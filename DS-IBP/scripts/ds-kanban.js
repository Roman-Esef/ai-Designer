/* =========================================================================
   ds-kanban.js — рантайм канбан-доски.

   Автоподключение (без кода на экране):
     <div class="kanban" data-kanban> … </div>

   Компонент общий: на доске могут лежать сделки, задачи, заметки — что
   угодно. Поэтому НИКАКОЙ статусной модели внутри нет: рантайм не знает
   и не должен знать, из какого этапа в какой карточку переносить можно.
   Решению, которому ограничения нужны, дана одна точка входа — отменяемое
   событие kanban:beforemove: preventDefault() отменяет укладку, и решение
   реализует свою модель у себя, не завися от ДС и не форкая рантайм.

   Что делает из коробки: перетаскивание карточек указателем (порог 4px,
   плавающий клон, место-призрак, линия вставки, автоскролл трека, отмена
   по Esc), перетаскивание КОЛОНОК за шапку, клавиатурный эквивалент для
   того и другого (Space — взять, стрелки — перенести, Space — положить,
   Esc — отменить, WCAG 2.1.1), счётчики колонок и доски, пустые
   состояния, звезда избранного, сворачивание колонки, добавление и
   удаление карточек и колонок, открытие панели деталей. Меню,
   подтверждения, снекбар и слой панели — штатные DSMenu / DSModal /
   DSSnack / DSDrawer, своих реализаций рантайм не заводит.

   API: DSKanban.bind(board, opts) · bindAll(root) · move(card, col, index)
   События на доске: kanban:beforemove (отменяемое) · kanban:move
   {card, from, to, index} · kanban:add · kanban:remove · kanban:star ·
   kanban:colmove {column, from, to} · kanban:colremove · kanban:open
   ========================================================================= */
(function () {
  'use strict';

  var THRESHOLD = 4;      /* порог захвата: ниже — это клик, а не перенос */
  var EDGE = 64;          /* зона автоскролла у края трека */
  var STEP = 12;

  var drag = null;        /* активный перенос указателем */
  var armed = null;       /* нажатие было, порог ещё не пройден */
  var guide = null;       /* линия места вставки */
  var grabbed = null;     /* карточка, взятая с клавиатуры */
  var grabHome = null;    /* её исходное место — для честной отмены по Esc */
  var coldrag = null;     /* перенос колонки указателем */
  var colArmed = null;    /* нажатие на шапке, порог ещё не пройден */
  var colGuide = null;    /* вертикальная линия места вставки колонки */
  var colAt = -1;         /* индекс вставки, вычисленный линией */
  var colGrabbed = null;  /* колонка, взятая с клавиатуры */
  var afterGesture = false; /* закончился перенос — следующий click не наш */
  var colHome = null;     /* её исходный сосед справа — для отмены по Esc */

  /* ---------- поиск по дереву ---------- */
  function boardOf(el) { return el && el.closest ? el.closest('[data-kanban]') : null; }
  function colOf(el) { return el && el.closest ? el.closest('.kbcol') : null; }
  function cardOf(el) { return el && el.closest ? el.closest('.kbcard') : null; }
  function bodyOf(col) { return col ? col.querySelector('[data-kb-body]') : null; }
  function nameOf(col) { return col ? (col.getAttribute('data-kb-name') || '') : ''; }
  function viewportOf(board) { return board ? board.querySelector('.kanban__viewport') : null; }
  function cols(board) {
    return Array.prototype.slice.call(board.querySelectorAll('.kbcol'));
  }

  /* ---------- счётчики, пустые состояния, объявления ---------- */
  function live(board) {
    var el = board.querySelector('[data-kb-live]');
    if (!el) {
      el = document.createElement('div');
      el.setAttribute('data-kb-live', '');
      el.setAttribute('aria-live', 'polite');
      el.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;' +
        'clip:rect(0 0 0 0);white-space:nowrap;';
      board.appendChild(el);
    }
    return el;
  }
  function announce(board, msg) { live(board).textContent = msg; }

  function sync(board) {
    var total = 0;
    cols(board).forEach(function (col) {
      var body = bodyOf(col);
      if (!body) return;
      var n = body.querySelectorAll('.kbcard').length;
      total += n;
      var cnt = col.querySelector('[data-kb-count]');
      if (cnt) cnt.textContent = String(n);
      /* имя колонки для скринридера несёт объём: без него неясно, что внутри */
      col.setAttribute('role', 'group');
      col.setAttribute('aria-label', nameOf(col) + ', карточек: ' + n);

      var empty = body.querySelector('[data-kb-empty]');
      if (!n && !empty) {
        var p = document.createElement('p');
        p.setAttribute('data-kb-empty', '');
        p.className = 'kbcard__flabel';
        p.style.cssText = 'margin:0;padding:12px 4px;text-wrap:pretty;white-space:normal;';
        p.textContent = col.getAttribute('data-kb-empty-text') ||
          'Пока пусто. Перетащите сюда карточку.';
        body.appendChild(p);
      } else if (n && empty) { empty.remove(); }
    });
    var t = board.querySelector('[data-kb-total]');
    if (t) t.textContent = String(total);
  }

  function emit(board, name, detail) {
    board.dispatchEvent(new CustomEvent('kanban:' + name, { detail: detail, bubbles: true }));
  }
  /* Единственная точка, где решение может вмешаться в перенос. Возвращает
     false, если обработчик экрана вызвал preventDefault(). Через неё
     реализуется статусная модель конкретного продукта — внутри ДС её нет. */
  function allow(board, detail) {
    var ev = new CustomEvent('kanban:beforemove', {
      detail: detail, bubbles: true, cancelable: true
    });
    board.dispatchEvent(ev);
    return !ev.defaultPrevented;
  }

  /* ---------- линия вставки ---------- */
  function makeGuide() {
    if (!guide) { guide = document.createElement('div'); guide.className = 'kbcol__guide'; }
    return guide;
  }
  function clearGuide() { if (guide && guide.parentNode) guide.parentNode.removeChild(guide); }

  /* Индекс вставки по центрам карточек — та же механика, что у
     переупорядочивания колонок таблицы в tbl-reorder.js. */
  function placeGuide(col, y, moving) {
    var body = bodyOf(col);
    if (!body) return;
    var list = Array.prototype.filter.call(body.querySelectorAll('.kbcard'), function (c) {
      return c !== moving;
    });
    var g = makeGuide();
    for (var i = 0; i < list.length; i++) {
      var r = list[i].getBoundingClientRect();
      if (y < r.top + r.height / 2) { body.insertBefore(g, list[i]); return; }
    }
    body.appendChild(g);
  }

  function indexOfGuide() {
    if (!guide || !guide.parentNode) return -1;
    var sibs = Array.prototype.slice.call(guide.parentNode.children);
    var n = 0;
    for (var i = 0; i < sibs.length; i++) {
      if (sibs[i] === guide) return n;
      if (sibs[i].classList && sibs[i].classList.contains('kbcard')) n++;
    }
    return n;
  }

  /* ---------- перенос указателем ---------- */
  function beginDrag(card, e) {
    var board = boardOf(card);
    var from = colOf(card);
    var r = card.getBoundingClientRect();

    var fly = card.cloneNode(true);
    fly.classList.add('is-move', 'kanban__flying');
    fly.style.width = r.width + 'px';
    fly.removeAttribute('tabindex');
    fly.removeAttribute('id');
    document.body.appendChild(fly);

    card.classList.add('kbcard--ghost');
    drag = {
      board: board, card: card, fly: fly, from: from,
      next: card.nextElementSibling,
      dx: e.clientX - r.left, dy: e.clientY - r.top
    };
    dragChrome(board, true);
    afterGesture = true;
    moveFly(e);
  }

  /* Оформление жеста, общее для карточек и колонок. Выделение текста
     гасится на ВСЁМ документе: указатель во время переноса уходит за
     пределы трека, и браузер тянет выделение по соседним карточкам и по
     странице. Снять уже начатое выделение тоже надо — оно могло
     возникнуть на первых пикселях хода, до порога захвата. */
  function dragChrome(board, on) {
    board.classList.toggle('is-dragging', on);
    document.body.classList.toggle('kb-dragging', on);
    if (on) {
      var sel = window.getSelection && window.getSelection();
      if (sel && sel.removeAllRanges) sel.removeAllRanges();
    }
  }

  function moveFly(e) {
    if (!drag) return;
    drag.fly.style.left = (e.clientX - drag.dx) + 'px';
    drag.fly.style.top = (e.clientY - drag.dy) + 'px';
  }

  function colUnder(e) {
    var el = document.elementFromPoint(e.clientX, e.clientY);
    var col = colOf(el);
    if (!col) return null;
    if (col.classList.contains('kbcol--collapsed')) return null;
    return col;
  }

  /* Без автоскролла нельзя донести карточку до колонки, которой не видно.
     Крутится ВЬЮПОРТ: скролл принадлежит ему, а не ряду колонок. */
  function autoScroll(board, e) {
    var vp = viewportOf(board);
    if (!vp) return;
    var r = vp.getBoundingClientRect();
    if (e.clientX > r.right - EDGE) vp.scrollLeft += STEP;
    else if (e.clientX < r.left + EDGE) vp.scrollLeft -= STEP;
    if (e.clientY > r.bottom - EDGE) vp.scrollTop += STEP;
    else if (e.clientY < r.top + EDGE) vp.scrollTop -= STEP;
  }

  function cleanupDrag() {
    if (!drag) return;
    var board = drag.board;
    drag.card.classList.remove('kbcard--ghost');
    if (drag.fly.parentNode) drag.fly.parentNode.removeChild(drag.fly);
    clearGuide();
    cols(board).forEach(function (col) { col.classList.remove('kbcol--drop'); });
    dragChrome(board, false);
    drag = null;
    sync(board);
  }

  function dropHere(e) {
    if (!drag) return;
    var board = drag.board;
    var target = colUnder(e);
    if (target && guide && guide.parentNode) {
      var from = drag.from;
      var idx = indexOfGuide();
      /* Решение может запретить укладку своей моделью переходов — тогда
         карточка возвращается на место, как по Esc. */
      if (from !== target && !allow(board, { card: drag.card, from: from, to: target, index: idx })) {
        cancelDrag();
        return;
      }
      guide.parentNode.insertBefore(drag.card, guide);
      if (from !== target) {
        emit(board, 'move', { card: drag.card, from: from, to: target, index: idx });
        announce(board, 'Карточка перенесена в «' + nameOf(target) + '»');
        if (window.DSSnack) {
          DSSnack.show({
            tone: 'info',
            title: 'Карточка перенесена',
            text: 'Этап: «' + nameOf(target) + '»'
          });
        }
      }
    }
    cleanupDrag();
  }

  function cancelDrag() {
    if (!drag) return;
    var body = bodyOf(drag.from);
    clearGuide();
    if (drag.next && drag.next.parentNode === body) body.insertBefore(drag.card, drag.next);
    else if (body) body.appendChild(drag.card);
    cleanupDrag();
  }

  /* ---------- делегированные события указателя ---------- */
  document.addEventListener('pointerdown', function (e) {
    if (e.button !== 0) return;
    if (e.target.closest('button, a, input, .menu')) return;

    var head = e.target.closest('.kbcol__head');
    if (head && boardOf(head)) {
      colArmed = { col: colOf(head), x: e.clientX, y: e.clientY };
      return;
    }

    var card = cardOf(e.target);
    if (!card || !boardOf(card)) return;
    if (card.getAttribute('aria-disabled') === 'true') return;
    armed = { card: card, x: e.clientX, y: e.clientY, moved: false };
  });

  document.addEventListener('pointermove', function (e) {
    if (colArmed && !coldrag) {
      if (Math.abs(e.clientX - colArmed.x) + Math.abs(e.clientY - colArmed.y) < THRESHOLD) return;
      beginColDrag(colArmed.col, e);
    }
    if (coldrag) {
      e.preventDefault();
      moveColFly(e);
      autoScroll(coldrag.board, e);
      placeColGuide(coldrag.board, e.clientX, coldrag.col);
      return;
    }

    if (armed && !drag) {
      if (Math.abs(e.clientX - armed.x) + Math.abs(e.clientY - armed.y) < THRESHOLD) return;
      armed.moved = true;
      beginDrag(armed.card, e);
    }
    if (!drag) return;
    e.preventDefault();
    moveFly(e);
    autoScroll(drag.board, e);
    var col = colUnder(e);
    cols(drag.board).forEach(function (c) { c.classList.toggle('kbcol--drop', c === col); });
    if (col) placeGuide(col, e.clientY, drag.card); else clearGuide();
  }, { passive: false });

  document.addEventListener('pointerup', function (e) {
    if (coldrag) dropColumn(e);
    if (drag) dropHere(e);
    armed = null;
    colArmed = null;
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (drag) cancelDrag();
    if (coldrag) cancelColDrag();
  });

  /* ---------- клавиатурный перенос КОЛОНКИ ----------
     Тот же договор, что у карточки: Space — взять, стрелки — перенести,
     Space — положить, Esc — вернуть на исходное место (WCAG 2.1.1).
     Шапка колонки для этого получает tabindex — см. bind(). */
  function grabColumn(col) {
    var board = boardOf(col);
    if (!board || colGrabbed) return;
    colGrabbed = col;
    colHome = colIndexOf(board, col);
    col.classList.add('kbcol--selected');
    var head = col.querySelector('.kbcol__head');
    if (head) head.focus();
    announce(board, 'Взята колонка «' + nameOf(col) + '». Стрелками — перенос, ' +
      'Space — положить, Esc — отменить.');
  }
  function releaseColumn(restore) {
    if (!colGrabbed) return;
    var col = colGrabbed, board = boardOf(col);
    if (restore) putColumn(board, col, colHome);
    col.classList.remove('kbcol--selected');
    colGrabbed = null; colHome = null;
    var head = col.querySelector('.kbcol__head');
    if (head) head.focus();
    sync(board);
    announce(board, restore
      ? 'Перенос отменён, колонка «' + nameOf(col) + '» возвращена на место'
      : 'Колонка «' + nameOf(col) + '» поставлена, позиция ' +
        (colIndexOf(board, col) + 1) + ' из ' + cols(board).length);
  }

  document.addEventListener('keydown', function (e) {
    var head = e.target.closest ? e.target.closest('.kbcol__head') : null;
    if (!colGrabbed && !head) return;
    var col = colGrabbed || colOf(head);
    var board = boardOf(col);
    if (!board) return;

    if (e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      if (colGrabbed) releaseColumn(false); else grabColumn(col);
      return;
    }
    if (e.key === 'Escape' && colGrabbed) { releaseColumn(true); return; }
    if (!colGrabbed || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;

    e.preventDefault();
    var list = cols(board);
    var i = list.indexOf(col);
    var j = i + (e.key === 'ArrowRight' ? 1 : -1);
    if (j < 0 || j >= list.length) { announce(board, 'Край доски'); return; }
    putColumn(board, col, j);
    var head2 = col.querySelector('.kbcol__head');
    if (head2) head2.focus();
    emit(board, 'colmove', { column: col, from: i, to: j });
    announce(board, nameOf(col) + ', позиция ' + (j + 1) + ' из ' + list.length);
  });

  /* ---------- клавиатурный перенос ----------
     Не дубль мышиного: перебираются ТОЛЬКО разрешённые колонки,
     поэтому промахнуться нельзя в принципе. WCAG 2.1.1 и 2.5.7. */
  document.addEventListener('keydown', function (e) {
    var card = cardOf(e.target);
    if (!card) return;
    var board = boardOf(card);
    if (!board) return;

    if (e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      if (!grabbed) {
        grabbed = card;
        grabHome = { col: colOf(card), next: card.nextElementSibling };
        card.classList.add('kbcard--selected');
        announce(board, 'Взята карточка. Стрелками — перенос, Space — положить, Esc — отменить.');
      } else {
        grabbed.classList.remove('kbcard--selected');
        announce(board, 'Карточка положена в «' + nameOf(colOf(grabbed)) + '»');
        grabbed = null; grabHome = null;
        sync(board);
      }
      return;
    }

    if (e.key === 'Escape' && grabbed) {
      var back = grabbed;
      if (grabHome && grabHome.col) {
        var body = bodyOf(grabHome.col);
        if (grabHome.next && grabHome.next.parentNode === body) body.insertBefore(back, grabHome.next);
        else body.appendChild(back);
      }
      back.classList.remove('kbcard--selected');
      grabbed = null; grabHome = null;
      sync(board);
      back.focus();
      announce(board, 'Перенос отменён, карточка возвращена в «' + nameOf(colOf(back)) + '»');
      return;
    }

    if (grabbed && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      e.preventDefault();
      var list = cols(board), cur = colOf(grabbed), i = list.indexOf(cur);
      var dir = e.key === 'ArrowRight' ? 1 : -1;
      var j = i + dir;
      if (j < 0 || j >= list.length) { announce(board, 'Дальше переносить некуда'); return; }
      var to = list[j];
      var n0 = bodyOf(to).querySelectorAll('.kbcard').length;
      if (!allow(board, { card: grabbed, from: cur, to: to, index: n0 })) {
        announce(board, 'Перенос в «' + nameOf(to) + '» недоступен');
        return;
      }
      bodyOf(to).appendChild(grabbed);
      sync(board);
      grabbed.focus();
      var n = bodyOf(to).querySelectorAll('.kbcard').length;
      emit(board, 'move', { card: grabbed, from: cur, to: to, index: n - 1 });
      announce(board, nameOf(to) + ', позиция ' + n + ' из ' + n);
      return;
    }

    if (grabbed && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      var b = bodyOf(colOf(grabbed));
      var sib = e.key === 'ArrowUp' ? grabbed.previousElementSibling : grabbed.nextElementSibling;
      if (!sib || !sib.classList.contains('kbcard')) { announce(board, 'Край колонки'); return; }
      if (e.key === 'ArrowUp') b.insertBefore(grabbed, sib); else b.insertBefore(sib, grabbed);
      grabbed.focus();
      announce(board, 'Позиция изменена');
    }
  });

  /* =====================================================================
     ПЕРЕНОС КОЛОНОК
     Собран по образцу scripts/tbl-reorder.js — приём для переупорядочивания
     колонок в ДС уже принят: порог 4px, линия вставки, индекс по центрам,
     отмена по Esc. Ручка — ШАПКА колонки, а не вся колонка: тело занято
     переносом карточек, и один и тот же жест не может значить два разных
     переноса. Летит клон шапки — колонка высотой в экран под курсором
     перекрывает как раз то место, куда целятся.
     ===================================================================== */
  function trackOf(board) { return board ? board.querySelector('.kanban__track') : null; }

  function ensureColGuide(track) {
    if (!colGuide) { colGuide = document.createElement('div'); colGuide.className = 'kanban__colguide'; }
    if (colGuide.parentNode !== track) track.appendChild(colGuide);
    return colGuide;
  }
  function clearColGuide() {
    if (colGuide && colGuide.parentNode) colGuide.parentNode.removeChild(colGuide);
    colAt = -1;
  }

  /* Место вставки — по центрам колонок, как индекс карточки по центрам
     карточек. Линия — абсолютный потомок трека, а трек сам не скроллится
     (скролл у вьюпорта), поэтому поправки на прокрутку не нужны: хватает
     смещения от левой кромки трека. Вертикаль и высота — из CSS. */
  function placeColGuide(board, x, moving) {
    var track = trackOf(board);
    if (!track) return;
    var list = cols(board).filter(function (c) { return c !== moving; });
    var tr = track.getBoundingClientRect();
    var edge = null;
    colAt = list.length;
    for (var i = 0; i < list.length; i++) {
      var r = list[i].getBoundingClientRect();
      if (x < r.left + r.width / 2) { colAt = i; edge = r.left; break; }
    }
    if (edge === null) {
      var last = list[list.length - 1];
      edge = last ? last.getBoundingClientRect().right : tr.left;
    }
    ensureColGuide(track).style.left = (edge - tr.left - 1) + 'px';
  }

  /* Вставка колонки на позицию index среди ОСТАЛЬНЫХ колонок доски */
  function putColumn(board, col, index) {
    var track = trackOf(board);
    if (!track) return;
    var list = cols(board).filter(function (c) { return c !== col; });
    var before = list[index] || board.querySelector('.kanban__addcol') || null;
    track.insertBefore(col, before);
  }

  function beginColDrag(col, e) {
    var board = boardOf(col);
    var head = col.querySelector('.kbcol__head');
    var r = head.getBoundingClientRect();

    var fly = head.cloneNode(true);
    fly.classList.add('kanban__flying');
    fly.style.width = r.width + 'px';
    fly.removeAttribute('id');
    fly.removeAttribute('tabindex');
    /* клон не должен уносить чужие идентификаторы: две кнопки с одним
       data-menu уводят действие не на ту колонку (урок прошлого захода) */
    Array.prototype.forEach.call(fly.querySelectorAll('[data-menu], [id]'), function (n) {
      n.removeAttribute('data-menu'); n.removeAttribute('id');
    });
    document.body.appendChild(fly);

    col.classList.add('kbcol--ghost', 'kbcol--moving');
    coldrag = {
      board: board, col: col, fly: fly,
      home: colIndexOf(board, col),
      dx: e.clientX - r.left, dy: e.clientY - r.top
    };
    dragChrome(board, true);
    afterGesture = true;
    moveColFly(e);
  }

  function colIndexOf(board, col) { return cols(board).indexOf(col); }

  function moveColFly(e) {
    if (!coldrag) return;
    coldrag.fly.style.left = (e.clientX - coldrag.dx) + 'px';
    coldrag.fly.style.top = (e.clientY - coldrag.dy) + 'px';
  }

  function cleanupColDrag() {
    if (!coldrag) return;
    var board = coldrag.board;
    coldrag.col.classList.remove('kbcol--ghost', 'kbcol--moving');
    if (coldrag.fly.parentNode) coldrag.fly.parentNode.removeChild(coldrag.fly);
    clearColGuide();
    dragChrome(board, false);
    coldrag = null;
    sync(board);
  }

  function dropColumn(e) {
    if (!coldrag) return;
    var board = coldrag.board, col = coldrag.col, from = coldrag.home;
    if (colAt >= 0) {
      putColumn(board, col, colAt);
      var to = colIndexOf(board, col);
      if (to !== from) {
        emit(board, 'colmove', { column: col, from: from, to: to });
        announce(board, 'Колонка «' + nameOf(col) + '» перемещена, позиция ' +
          (to + 1) + ' из ' + cols(board).length);
      }
    }
    cleanupColDrag();
  }

  function cancelColDrag() {
    if (!coldrag) return;
    putColumn(coldrag.board, coldrag.col, coldrag.home);
    cleanupColDrag();
  }

  /* ---------- действия ----------
     Меню карточки и колонки общие на всю доску, поэтому запоминаем
     триггер, из которого меню открыли: иначе непонятно, к какой
     карточке относится нажатый пункт. */
  var lastTrigger = null;
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-menu]');
    if (t && boardOf(t)) lastTrigger = t;
  }, true);

  /* Подтверждение — модалка страницы, рантайм только наполняет её
     и помнит отложенное действие. Разметки своей не создаёт. */
  var pending = null;
  function confirmVia(board, title, text, run) {
    var id = board.getAttribute('data-kb-confirm');
    var scrim = id ? document.getElementById(id) : null;
    if (!scrim || !window.DSModal) { run(); return; }   /* модалки нет — делаем сразу */
    var h = scrim.querySelector('[data-kb-confirm-title]');
    var p = scrim.querySelector('[data-kb-confirm-text]');
    if (h) h.textContent = title;
    if (p) p.textContent = text;
    pending = run;
    if (window.DSMenu) DSMenu.closeAll();
    DSModal.open(scrim);
  }

  document.addEventListener('click', function (e) {
    /* подтверждение — модалка живёт вне доски */
    if (e.target.closest('[data-kb-confirm-ok]')) {
      var scrim = e.target.closest('.modal-scrim');
      if (pending) { pending(); pending = null; }
      if (scrim && window.DSModal) DSModal.closeTop();
      return;
    }

    /* Пункты меню тоже живут ВНЕ доски: DSMenu держит меню в общем слое.
       Поэтому доску берём у запомненного триггера, а не у цели клика —
       иначе обработчик выходит раньше, чем дойдёт до пункта. */
    var item = e.target.closest('[data-kb-delcard], [data-kb-delcol], [data-kb-collapse]');
    if (item) {
      var owner = lastTrigger ? boardOf(lastTrigger) : null;
      if (!owner) return;

      if (item.matches('[data-kb-collapse]')) {
        var tc = colOf(lastTrigger);
        if (tc) tc.classList.toggle('kbcol--collapsed');
        if (window.DSMenu) DSMenu.closeAll();
        return;
      }

      if (item.matches('[data-kb-delcard]')) {
        var card = cardOf(lastTrigger);
        if (!card) return;
        confirmVia(owner, 'Удалить карточку?',
          'Карточка будет удалена без возможности восстановления.',
          function () {
            var from = colOf(card);
            card.remove();
            sync(owner);
            emit(owner, 'remove', { card: card, from: from });
          });
        return;
      }

      var col2 = colOf(lastTrigger);
      if (!col2) return;
      var rest = bodyOf(col2).querySelectorAll('.kbcard');
      var first = owner.querySelector('.kbcol');
      var where = (first && first !== col2) ? first : null;
      confirmVia(owner, 'Удалить колонку «' + nameOf(col2) + '»?',
        rest.length
          ? 'В колонке ' + rest.length + ' карточ' + (rest.length === 1 ? 'ка' : 'ки') +
            (where ? ' — они переедут в «' + nameOf(where) + '».' : '.')
          : 'Колонка пуста.',
        function () {
          if (where) {
            Array.prototype.forEach.call(rest, function (x) { bodyOf(where).appendChild(x); });
          }
          col2.remove();
          sync(owner);
          emit(owner, 'colremove', { column: col2 });
        });
      return;
    }

    /* дальше — действия на самой доске */
    var board = boardOf(e.target);
    if (!board) return;

    var star = e.target.closest('[data-kb-star]');
    if (star) {
      e.stopPropagation();
      var on = star.getAttribute('aria-pressed') === 'true';
      star.setAttribute('aria-pressed', on ? 'false' : 'true');
      var ic = star.querySelector('[data-icon]');
      if (ic) {
        ic.setAttribute('data-icon', on ? 'star' : 'star-filled');
        if (window.dsIcons && dsIcons.apply) dsIcons.apply(star);
      }
      emit(board, 'star', { card: cardOf(star), on: !on });
      return;
    }

    var add = e.target.closest('[data-kb-add]');
    if (add) { addCard(colOf(add)); return; }

    if (e.target.closest('[data-kb-addcol]')) { addColumn(board); return; }

    /* Клик по карточке открывает панель деталей. Отличить клик от жеста
       нечем, кроме памяти о жесте: pointerup гасит armed раньше, чем
       браузер дошлёт click. */
    var card2 = cardOf(e.target);
    if (card2 && !e.target.closest('button, a, input, .menu')) {
      if (afterGesture) { afterGesture = false; return; }
      openDetails(board, card2);
    }
  });

  /* Панель деталей — штатный Drawer. Рантайм доски только наполняет её
     шапку значениями карточки; содержимое панели принадлежит экрану. */
  function openDetails(board, card) {
    emit(board, 'open', { card: card });
    var id = board.getAttribute('data-kb-drawer');
    var scrim = id ? document.getElementById(id) : null;
    if (!scrim) return;
    var put = function (sel, val) {
      var n = scrim.querySelector(sel);
      if (n && val != null) n.textContent = val;
    };
    var title = card.querySelector('.tile__title');
    put('[data-kb-d-col]', nameOf(colOf(card)));
    put('[data-kb-d-id]', card.getAttribute('data-kb-card'));
    put('[data-kb-d-title]', title ? title.textContent.trim() : '');
    if (window.DSDrawer) DSDrawer.open(scrim, { returnFocus: card });
    else if (window.DSModal) DSModal.open(scrim, { returnFocus: card });
  }

  /* ---------- создание карточек и колонок ----------
     Шаблон берётся из самой доски: рантайм не знает, из чего состоит
     карточка конкретного продукта, и не должен придумывать её разметку. */
  var seq = 0;
  function addCard(col) {
    if (!col) return;
    var board = boardOf(col);
    var body = bodyOf(col);
    var tpl = board.querySelector('[data-kb-card-tpl]') || board.querySelector('.kbcard');
    if (!body || !tpl) return;
    var el = tpl.cloneNode(true);
    el.removeAttribute('data-kb-card-tpl');
    el.hidden = false;
    /* клон не должен унести состояния образца */
    el.classList.remove('kbcard--ghost', 'kbcard--selected', 'kbcard--error',
      'is-move', 'is-hover', 'is-pressed', 'is-disabled');
    el.removeAttribute('aria-disabled');
    seq++;
    /* клон обязан получить СВОЙ идентификатор: иначе на доске окажутся
       две карточки с одним data-kb-card, и действие уедет не на ту */
    var newId = 'NEW-' + seq;
    el.setAttribute('data-kb-card', newId);
    var title = el.querySelector('.tile__title');
    if (title) title.textContent = 'Новая карточка';
    var id = el.querySelector('.kbcard__id');
    if (id) id.textContent = newId;
    var st = el.querySelector('[data-kb-star]');
    if (st) {
      st.setAttribute('aria-pressed', 'false');
      var i2 = st.querySelector('[data-icon]');
      if (i2) i2.setAttribute('data-icon', 'star');
    }
    body.insertBefore(el, body.firstChild);
    if (window.dsIcons && dsIcons.apply) dsIcons.apply(el);
    sync(board);
    el.focus();
    emit(board, 'add', { card: el, column: col });
  }

  function addColumn(board) {
    var track = board.querySelector('.kanban__track');
    var last = board.querySelector('.kbcol:last-of-type');
    if (!track || !last) return;
    var el = last.cloneNode(true);
    el.className = 'kbcol';
    el.setAttribute('data-kb-col', 'col-' + Date.now());
    el.setAttribute('data-kb-name', 'Новая колонка');
    var nm = el.querySelector('.kbcol__name');
    if (nm) nm.textContent = 'Новая колонка';
    var vn = el.querySelector('.kbcol__vname');
    if (vn) vn.textContent = 'Новая колонка';
    el.classList.remove('kbcol--collapsed');
    var body = bodyOf(el);
    if (body) body.innerHTML = '';
    var addcol = board.querySelector('.kanban__addcol');
    track.insertBefore(el, addcol || null);
    if (window.dsIcons && dsIcons.apply) dsIcons.apply(el);
    sync(board);
  }

  /* ---------- инициализация ---------- */
  function bind(board) {
    if (!board || board.__dsKanban) return;
    board.__dsKanban = true;
    Array.prototype.forEach.call(board.querySelectorAll('.kbcard'), function (c) {
      if (!c.hasAttribute('tabindex')) c.setAttribute('tabindex', '0');
      if (!c.hasAttribute('aria-roledescription')) {
        c.setAttribute('aria-roledescription', 'карточка, перетаскиваемая');
      }
    });
    /* Шапка — ручка переноса колонки, значит она обязана быть достижима
       и с клавиатуры: мышиный жест без клавиатурного эквивалента — отказ
       по WCAG 2.1.1, а не «удобство для продвинутых». */
    Array.prototype.forEach.call(board.querySelectorAll('.kbcol__head'), function (h) {
      if (!h.hasAttribute('tabindex')) h.setAttribute('tabindex', '0');
      if (!h.hasAttribute('aria-roledescription')) {
        h.setAttribute('aria-roledescription', 'колонка, перетаскиваемая');
      }
    });
    sync(board);
  }
  function bindAll(root) {
    var scope = root || document;
    Array.prototype.forEach.call(scope.querySelectorAll('[data-kanban]'), bind);
  }

  /* Перенос программно — для экрана, который меняет доску сам */
  function move(card, col, index) {
    var body = bodyOf(col);
    if (!card || !body) return;
    var from = colOf(card);
    var list = body.querySelectorAll('.kbcard');
    if (index == null || index >= list.length) body.appendChild(card);
    else body.insertBefore(card, list[index]);
    var board = boardOf(col);
    if (board) { sync(board); emit(board, 'move', { card: card, from: from, to: col, index: index }); }
  }

  function init() {
    bindAll(document);
    /* усечённые подписи получают подсказку общим механизмом ДС,
       своей реализации «усечено → тултип» рантайм не заводит (урок Л43) */
    if (window.DSTooltip && DSTooltip.truncated) {
      DSTooltip.truncated('.kbcol__name');
      DSTooltip.truncated('.kbcard .tile__title');
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }

  window.DSKanban = { bind: bind, bindAll: bindAll, move: move, sync: sync };
})();
