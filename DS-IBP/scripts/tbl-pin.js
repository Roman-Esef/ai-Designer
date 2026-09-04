/* =========================================================================
   tbl-pin.js — закрепление колонок таблицы (out-of-box).

   Удержание колонок — НАТИВНЫЙ CSS position: sticky (см. table-cell.css).
   Рантайм считает только ИНСЕТЫ: для лево-закреплённой колонки `left` =
   суммарная ширина закреплённых колонок левее, для колонки хвостового правого
   блока `right` = суммарная ширина закреплённых колонок правее. Пишутся
   инлайном и пересчитываются ТОЛЬКО когда меняется состав или ширины колонок
   (закрепление, перенос, ресайз колонки, ресайз окна) — на скролл рантайм не
   реагирует вовсе.

   Почему не transform (было до 04.09.2026): удержание через translateX на
   событии `scroll` всегда опаздывает на кадр — скролл применяет компоновщик
   до того, как выполнится JS-обработчик. Закреплённая колонка каждый кадр
   уезжала с контентом и возвращалась следующим кадром. На Windows дискретное
   колесо это скрывало (коррекция успевала в паузу между щелчками), на трекпаде
   macOS с инерционным докрутом ошибка показывалась на каждом кадре подряд и
   читалась как дрожание закреплённых колонок.

   Поведение:
   1. Тогл закрепления — клик по .th__pin в шапке: переключает
      .th--pinned/.tc--pinned у всей колонки (шапка + все строки), глиф
      pin ↔ pin-filled, aria-pressed/aria-label; событие 'columnpin' на .tbl
      { column, pinned }. Закрепление НЕ переставляет колонку.
   2. Классификация закреплённых:
      - left-pinned — колонка не входит в хвостовой блок: при скролле
        «упирается» в левый край (или в закреплённую колонку левее);
      - right-pinned — колонка входит в ХВОСТОВОЙ блок (все колонки правее
        тоже закреплены): удерживается у правого края.
   3. Сепаратор (.th--separator/.tc--separator) прилипает вместе с примыкающей
      закреплённой колонкой: левый крайний сепаратор — если закреплена первая
      колонка (остаётся у левого края, колонка — за ним), правый крайний —
      если закреплена последняя (у правого края). Прилипший сепаратор несёт
      data-pin-side="left"/"right" и получает заливку --bgtable-pinned
      (см. table-cell.css) — сливается с закреплённой колонкой в сплошную полосу.
   4. Строка обязана быть ШИРЕ скроллпорта, иначе прокручивать нечего и sticky
      не даёт ничего. Резерв полной ширины строки — `.tbl__row { min-width:
      max-content }` (table-cell.css), только у .tbl--scroll / .dtable__body.
   5. Пересчёт инсетов: 'columnpin', 'columnreorder', resize окна и
      ResizeObserver по ячейкам шапки (ресайз колонки из tbl-resize.js своего
      события не шлёт — ловим наблюдателем).

   Экспорт: window.DSTablePin = { bind(tbl), bindAll(root), apply(tbl) }.
   Автоподключение: любой .tbl на странице (делегирование, как tbl-reorder).
   ========================================================================= */
(function () {
  'use strict';

  function closestTbl(el) {
    return el && el.closest ? el.closest('.tbl') : null;
  }

  /* анализ шапки: ширины ячеек, разделители, закреплённые, классификация
     (левый/правый блок), «прилипшие» сепараторы и целевые инсеты */
  function analyze(headerRow) {
    var M = headerRow.children.length;
    var width = [], isSep = [], isPin = [], data = [];
    var i, c;
    for (i = 0; i < M; i++) {
      c = headerRow.children[i];
      isSep[i] = c.classList.contains('th--separator');
      isPin[i] = c.classList.contains('th--pinned');
      width[i] = c.getBoundingClientRect().width || 0;
      if (!isSep[i]) data.push(i);
    }

    /* правый блок = хвостовой непрерывный блок закреплённых (справа налево) */
    var rightBlock = {};
    for (i = data.length - 1; i >= 0 && isPin[data[i]]; i--) rightBlock[data[i]] = true;
    /* левая граница правого блока — только она несёт тень-разделитель слева
       (внутренним колонкам блока тень не нужна — они сливаются с блоком) */
    var rightBoundary = {};
    for (i = 0; i < data.length; i++) {
      if (rightBlock[data[i]]) { rightBoundary[data[i]] = true; break; }
    }

    var firstData = data[0], lastData = data[data.length - 1];
    var sepL = -1, sepR = -1;
    for (i = 0; i < M && sepL < 0; i++) if (isSep[i]) sepL = i;
    for (i = M - 1; i >= 0 && sepR < 0; i--) if (isSep[i]) sepR = i;

    /* сепаратор прилипает, если примыкает к закреплённой колонке */
    var stickL = sepL >= 0 && firstData !== undefined && isPin[firstData];
    var stickR = sepR >= 0 && lastData !== undefined && isPin[lastData];

    /* инсет left для left-pinned колонок (включая прилипший сепаратор) */
    var leftTarget = [], j, di, dj;
    var cumL = stickL ? width[sepL] : 0;
    for (j = 0; j < data.length; j++) {
      di = data[j];
      if (isPin[di] && !rightBlock[di]) { leftTarget[di] = cumL; cumL += width[di]; }
    }
    if (stickL) leftTarget[sepL] = 0;

    /* правая граница левого блока — только она несёт тень-разделитель справа
       (внутренним left-pinned тень не нужна — сливаются с блоком в сплошную полосу) */
    var leftBoundary = {};
    for (j = data.length - 1; j >= 0; j--) {
      di = data[j];
      if (isPin[di] && !rightBlock[di]) { leftBoundary[di] = true; break; }
    }

    /* инсет right для right-pinned колонок (с прилипшим сепаратором) */
    var rightGap = [];
    var cumR = stickR ? width[sepR] : 0;
    for (j = data.length - 1; j >= 0; j--) {
      dj = data[j];
      if (rightBlock[dj]) { rightGap[dj] = cumR; cumR += width[dj]; }
    }
    if (stickR) rightGap[sepR] = 0;

    return {
      M: M, width: width, isSep: isSep, isPin: isPin,
      rightBlock: rightBlock, rightBoundary: rightBoundary,
      leftBoundary: leftBoundary,
      sepL: stickL ? sepL : -1, sepR: stickR ? sepR : -1,
      leftTarget: leftTarget, rightGap: rightGap
    };
  }

  function hasPinned(A) {
    for (var i = 0; i < A.M; i++) if (A.isPin[i]) return true;
    return false;
  }

  /* сброс всего, что рантайм мог написать ячейке (включая transform от
     предыдущей реализации — страницы могли остаться с инлайном в разметке) */
  function resetCell(cell) {
    if (cell.style.left) cell.style.left = '';
    if (cell.style.right) cell.style.right = '';
    if (cell.style.transform && /translateX/.test(cell.style.transform)) cell.style.transform = '';
    if (cell.dataset.pinSide) delete cell.dataset.pinSide;
  }

  function clearAll(tbl) {
    tbl.querySelectorAll('.tbl__row').forEach(function (row) {
      Array.prototype.forEach.call(row.children, resetCell);
    });
  }

  function applyPin(tbl) {
    var headerRow = tbl.querySelector('.tbl__row');
    if (!headerRow) return;
    var rows = tbl.querySelectorAll('.tbl__row');

    var A = analyze(headerRow);
    if (!hasPinned(A)) { clearAll(tbl); return; }

    /* инсеты по индексу колонки — одинаковы для шапки и всех строк */
    var insL = [], insR = [], i;
    for (i = 0; i < A.M; i++) {
      insL[i] = ''; insR[i] = '';
      if (A.isPin[i] && !A.isSep[i]) {
        if (A.rightBlock[i]) insR[i] = (A.rightGap[i] || 0) + 'px';
        else insL[i] = (A.leftTarget[i] || 0) + 'px';
      } else if (i === A.sepL) {
        insL[i] = '0px';               /* прилипший левый сепаратор — у левого края */
      } else if (i === A.sepR) {
        insR[i] = '0px';               /* прилипший правый сепаратор — у правого края */
      }
    }

    rows.forEach(function (row) {
      for (var i = 0; i < A.M && i < row.children.length; i++) {
        var cell = row.children[i];
        if (!cell) continue;
        cell.style.left = insL[i];
        cell.style.right = insR[i];
        /* наследие transform-реализации: инлайн мог остаться в разметке экрана */
        if (cell.style.transform && /translateX/.test(cell.style.transform)) cell.style.transform = '';

        if (A.isPin[i] && !A.isSep[i]) {
          /* data-pin-side — только граничной колонке блока (тень-разделитель):
             right -> левой границе правого блока (тень слева),
             left  -> правой границе левого блока (тень справа).
             Внутренним колонкам блока data-pin-side не нужен — они сливаются
             с блоком в сплошную полосу и тени не несут */
          var side = A.rightBlock[i] ? (A.rightBoundary[i] ? 'right' : '')
                                     : (A.leftBoundary[i] ? 'left' : '');
          if (side) cell.dataset.pinSide = side;
          else if (cell.dataset.pinSide) delete cell.dataset.pinSide;
        } else if (A.isSep[i] && (i === A.sepL || i === A.sepR)) {
          /* прилипший сепаратор несёт data-pin-side — он и включает ему
             position: sticky, и красит как закреплённую ячейку
             (см. table-cell.css): левый — 'left', правый — 'right' */
          cell.dataset.pinSide = (i === A.sepL) ? 'left' : 'right';
        } else if (cell.dataset.pinSide) {
          delete cell.dataset.pinSide;
        }
      }
    });
  }

  function wirePin(tbl) {
    if (tbl.__dsTblPin) return;
    tbl.__dsTblPin = true;

    /* пересчёт инсетов дешёвый, но дёргает layout — коалесцируем в кадр */
    var raf = 0;
    function schedule() {
      if (raf) return;
      raf = requestAnimationFrame(function () { raf = 0; applyPin(tbl); });
    }

    window.addEventListener('resize', schedule);
    /* перенос колонок и закрепление меняют состав — пересчитываем */
    tbl.addEventListener('columnreorder', schedule);
    tbl.addEventListener('columnpin', schedule);

    /* ресайз колонки (tbl-resize.js) своего события не шлёт, а суммарная ширина
       строки при этом может не измениться — наблюдаем ячейки шапки поимённо.
       applyPin пишет только инсеты sticky-ячеек, размеров не меняет, поэтому
       цикла наблюдателя тут быть не может. */
    var headerRow = tbl.querySelector('.tbl__row');
    if (headerRow && window.ResizeObserver) {
      var ro = new ResizeObserver(schedule);
      Array.prototype.forEach.call(headerRow.children, function (c) { ro.observe(c); });
      tbl.__dsTblPinRO = ro;
    }

    applyPin(tbl);
  }

  /* тогл закрепления: клик по .th__pin в шапке */
  document.addEventListener('click', function (e) {
    var pin = e.target.closest && e.target.closest('.th__pin');
    if (!pin) return;
    var th = pin.closest('.th');
    var tbl = closestTbl(th);
    if (!th || !tbl || !tbl.contains(th)) return;

    var headerRow = th.parentElement;
    var idx = Array.prototype.indexOf.call(headerRow.children, th);
    if (idx < 0) return;

    var on = !th.classList.contains('th--pinned');
    tbl.querySelectorAll('.tbl__row').forEach(function (row) {
      var cell = row.children[idx];
      if (!cell) return;
      if (cell.classList.contains('th')) cell.classList.toggle('th--pinned', on);
      else cell.classList.toggle('tc--pinned', on);
      if (!on) resetCell(cell);
    });

    pin.setAttribute('aria-pressed', String(on));
    pin.setAttribute('aria-label', on ? 'Открепить колонку' : 'Закрепить колонку');
    var ico = pin.querySelector('i[data-icon]');
    if (ico) {
      ico.setAttribute('data-icon', on ? 'pin-filled' : 'pin');
      ico.innerHTML = '';
      delete ico.dataset.iconDone;
      if (window.dsIcons) window.dsIcons.apply(pin);
    }

    tbl.dispatchEvent(new CustomEvent('columnpin', { bubbles: true, detail: { column: idx, pinned: on } }));
    applyPin(tbl);
  });

  function bind(tbl) {
    if (!tbl) return;
    wirePin(tbl);
  }
  function bindAll(root) {
    (root || document).querySelectorAll('.tbl').forEach(bind);
  }

  function boot() { bindAll(document); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.DSTablePin = { bind: bind, bindAll: bindAll, apply: applyPin };
})();
