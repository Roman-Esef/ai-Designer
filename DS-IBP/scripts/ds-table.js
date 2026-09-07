/* =========================================================================
   DS Table — рантайм таблицы (out-of-box).
   Зависимости: styles/table.css, styles/table-cell.css;
   опционально scripts/ds-tooltip.js (тултип на усечённом тексте).

   Экспорт: window.DSTable = {
     bind(bodyEl) · bindAll(root)          — тень липкой шапки .dtable (--scrolled)
     wire(tblEl, opts) → api               — интерактив строк и ячеек
     wireAll(root)                         — обойти [data-table]
     chipOverflow(tblEl)                   — пересчитать свёртку чипов «+N»
                                             (нужен, только если потребитель
                                             перерисовал ячейки мимо api)
   }
   api: { el, selected(), sort(column, dir), refresh(), rowsChanged() }
     refresh()      — чекбокс шапки + тултипы усечения + свёртка чипов «+N»
                      (состав строк не менялся)
     rowsChanged()  — то же плюс переустановка исходного порядка строк
                      (__dsRowOrder): звать после того, как потребитель добавил
                      или удалил .tbl__row мимо рантайма (data-sort-rows иначе
                      не увидит новую строку при сортировке)

   Тень липкой шапки: .dtable__body сам подхватывается (scroll + ResizeObserver)
   и красит корень классом --scrolled, когда тело проскроллено вниз.
   Теней по левому/правому краю нет — убраны 27.08.2026 (уезжали с контентом).

   Интерактив (opt-in: data-table на .tbl) — делегированием, поэтому
   перерисовка строк ничего не ломает:
     сортировка   — клик по [data-sort] в шапке: none → asc → desc → none,
                    глиф, aria-sort и подсветка .th--sorted синхронны, активна
                    одна колонка; стартовое направление читается из aria-sort
                    разметки; событие 'sort' с { column, dir }, где column —
                    значение data-sort (ключ поля данных)
     порядок строк — opt-in: data-sort-rows на .tbl. Рантайм сам переставляет
                    строки по значению колонки (тип — data-sort-type на .th:
                    date | number | text, иначе автоопределение), dir = none
                    возвращает исходный порядок. Механизм для макетов: значения
                    берутся из DOM. Реестр с пагинацией сортирует сервер —
                    там атрибут не ставят, а слушают событие 'sort'
     дерево       — .tc__twisty переключает aria-expanded и показ дочерних
                    строк ([data-parent] = id узла); событие 'treetoggle'
     выбор строк   — чекбокс .tbl__row .cb__input красит строку .tbl__row--selected,
                    чекбокс шапки выделяет все (с промежуточным состоянием);
                    событие 'rowselect' с { selected: [id…] }
      фокус строки  — клик по строке ставит .tbl__row--focus (снимается кликом вне)
      усечение      — .tc__text--truncate и .th__label получают тултип с полным
                     текстом, показываемый только при реальном усечении.
                     Реализация — общий DSTooltip.truncated() (см. регистрацию
                     внизу): делегирование по наведению/фокусу, новые строки
                     подхватываются сами. Подпись чипа — не здесь: это правило
                     Chip, его держит scripts/ds-chip.js для всей страницы
     чипы в ячейке — два и более чипа в одном контейнере ячейки сворачиваются
                    по ширине колонки: не поместившиеся получают hidden, в конец
                    встаёт чип-счётчик «+N» ([data-tc-count]) с тултипом со
                    списком скрытых значений; пересчёт по ResizeObserver
                    (изменение ширины колонки)
   ========================================================================= */
(function () {
  'use strict';

  /* ---------- тень липкой шапки ---------- */
  function sync(body) {
    var root = body.closest('.dtable');
    if (!root) return;
    root.classList.toggle('dtable--scrolled', body.scrollTop > 0);
  }
  function bind(body) {
    if (!body || body.__dsTableBound) return;
    body.__dsTableBound = true;
    var handler = function () { sync(body); };
    body.addEventListener('scroll', handler);
    if (window.ResizeObserver) new ResizeObserver(handler).observe(body);
    else window.addEventListener('resize', handler);
    handler();
  }
  function bindAll(root) {
    (root || document).querySelectorAll('.dtable__body').forEach(bind);
  }

  /* ---------- интерактив строк и ячеек ---------- */
  var SORT_GLYPH = { none: 'arrow-up-down', asc: 'arrow-narrow-up', desc: 'arrow-narrow-down' };
  var NEXT_DIR = { none: 'asc', asc: 'desc', desc: 'none' };
  var ARIA_SORT = { none: 'none', asc: 'ascending', desc: 'descending' };
  var DIR_FROM_ARIA = { ascending: 'asc', descending: 'desc' };
  var SORT_LABEL = {
    none: 'Сортировать',
    asc: 'Сортировка от меньшего к большему',
    desc: 'Сортировка от большего к меньшему'
  };

  function emit(el, type, detail) {
    el.dispatchEvent(new CustomEvent(type, { detail: detail, bubbles: true }));
  }

  /* шапка — строка, в которой лежат .th; класс tbl__row--head остаётся
     как явный маркер, но разметка экрана его не обязана ставить */
  function isHeadRow(row) {
    return !!row && (row.classList.contains('tbl__row--head') || !!row.querySelector('.th'));
  }
  function dataRows(tbl) {
    return Array.prototype.filter.call(
      tbl.querySelectorAll('.tbl__row'),
      function (r) { return !isHeadRow(r); }
    );
  }

  /* глиф кнопки сортировки — переставляем имя в data-icon и просим ds-icons
     перерисовать: инлайн SVG рантайм не пишет (правило ДС «не инлайнить SVG»).
     Кнопки, где глиф вставлен как готовый <svg> (демо-страницы рисуют шапку
     сами), остаются нетронутыми — слота [data-icon] в них нет */
  function paintSortGlyph(btn, dir) {
    var slot = btn.querySelector('[data-icon]');
    if (!slot) return;
    slot.setAttribute('data-icon', SORT_GLYPH[dir]);
    delete slot.dataset.iconDone;
    if (window.dsIcons) window.dsIcons.apply(btn);
  }

  function setSort(tbl, btn, dir) {
    tbl.querySelectorAll('[data-sort]').forEach(function (b) {
      var head = b.closest('.th') || b;
      var own = b === btn;
      var d = own ? dir : 'none';
      b.dataset.sortDir = d;
      paintSortGlyph(b, d);
      b.setAttribute('aria-label', SORT_LABEL[d]);
      head.setAttribute('aria-sort', ARIA_SORT[d]);
      head.classList.toggle('th--sorted', d !== 'none');
      b.classList.toggle('is-sorted', d !== 'none');
    });
    sortRows(tbl, btn, dir);
    emit(tbl, 'sort', { column: btn.dataset.sort, dir: dir });
  }

  /* ---------- порядок строк (opt-in: data-sort-rows на .tbl) ----------
     Механизм макета: значения берутся из DOM, поэтому сортируется только то,
     что на странице. Реестр с пагинацией сортирует сервер — там атрибут не
     ставят, а слушают событие 'sort' и запрашивают отсортированную страницу. */
  var DATE_RE = /^(\d{2})\.(\d{2})\.(\d{4})$/;
  var EMPTY_RE = /^(—|–|-|)$/;

  /* Текст ячейки для сравнения. Просто `cell.textContent` брать нельзя:
     ds-tooltip.js кладёт рядом со значением копию текста в .tip[role=tooltip],
     и текст ячейки удваивается — «20.04.202420.04.2024» перестаёт быть датой,
     ключ выходит NaN у всех строк и сортировка вырождается в «ничего не
     изменилось». Порядок: явное data-sort-value на .tc → значение .tc__text и
     подписи чипов → текст ячейки без тултипов. */
  function cellText(row, idx) {
    var cell = row.children[idx];
    if (!cell) return '';
    if (cell.dataset && cell.dataset.sortValue != null) return cell.dataset.sortValue;
    var parts = cell.querySelectorAll('.tc__text, .chip__label');
    var out = '';
    if (parts.length) {
      Array.prototype.forEach.call(parts, function (n) {
        if (n.closest('[role="tooltip"]')) return;
        /* «+2» чипа-счётчика — не значение ячейки, а признак свёртки: попав в
           ключ, он сортировал бы строки по числу скрытых чипов */
        if (n.closest('[data-tc-count]')) return;
        out += (out ? ' ' : '') + n.textContent;
      });
    } else {
      out = textSkippingTooltips(cell);
    }
    return out.replace(/\s+/g, ' ').trim();
  }

  function textSkippingTooltips(node) {
    var out = '';
    Array.prototype.forEach.call(node.childNodes, function (n) {
      if (n.nodeType === 3) { out += n.nodeValue; return; }
      if (n.nodeType !== 1) return;
      if (n.getAttribute('role') === 'tooltip') return;
      out += textSkippingTooltips(n);
    });
    return out;
  }
  function toNumber(s) {
    var n = s.replace(/[\s  ]/g, '').replace(',', '.').replace(/[^\d.\-+eE]/g, '');
    return n === '' ? NaN : parseFloat(n);
  }
  function detectType(values) {
    var v = null, i;
    for (i = 0; i < values.length; i++) if (!EMPTY_RE.test(values[i])) { v = values[i]; break; }
    if (v === null) return 'text';
    if (DATE_RE.test(v)) return 'date';
    return isNaN(toNumber(v)) ? 'text' : 'number';
  }
  function sortKey(value, type) {
    if (type === 'date') {
      var m = DATE_RE.exec(value);
      return m ? Date.UTC(+m[3], +m[2] - 1, +m[1]) : NaN;
    }
    if (type === 'number') return toNumber(value);
    return value;
  }

  function sortRows(tbl, btn, dir) {
    if (!tbl.hasAttribute('data-sort-rows')) return;
    var order = tbl.__dsRowOrder;
    if (!order) return;
    /* точка вставки — сразу за строкой-шапкой, чтобы она осталась первой */
    var headRow = btn.closest('.tbl__row');
    if (!headRow || !isHeadRow(headRow)) return;

    var rows = order.filter(function (r) { return r.isConnected; });
    if (dir !== 'none') {
      var th = btn.closest('.th');
      var idx = th ? Array.prototype.indexOf.call(headRow.children, th) : -1;
      if (idx < 0) return;
      var type = (th.dataset.sortType) || detectType(rows.map(function (r) { return cellText(r, idx); }));
      var sign = dir === 'asc' ? 1 : -1;
      /* корни сортируются, поддерево каждого едет следом; пустое значение
         всегда внизу — направление на него не влияет (норма реестров) */
      var roots = rows.filter(function (r) { return !r.dataset.parent; });
      roots.sort(function (a, b) {
        var va = cellText(a, idx), vb = cellText(b, idx);
        var ea = EMPTY_RE.test(va), eb = EMPTY_RE.test(vb);
        if (ea || eb) return ea && eb ? 0 : (ea ? 1 : -1);
        var ka = sortKey(va, type), kb = sortKey(vb, type);
        if (type === 'text') return sign * String(ka).localeCompare(String(kb), 'ru');
        if (isNaN(ka) || isNaN(kb)) return isNaN(ka) && isNaN(kb) ? 0 : (isNaN(ka) ? 1 : -1);
        return ka < kb ? -sign : ka > kb ? sign : 0;
      });
      rows = [];
      roots.forEach(function (r) { rows.push(r); pushSubtree(tbl, r, rows); });
    }

    var frag = document.createDocumentFragment();
    rows.forEach(function (r) { frag.appendChild(r); });
    headRow.parentNode.insertBefore(frag, headRow.nextSibling);
  }

  /* потомки узла в порядке дерева — тот же обход, что у treeToggle */
  function pushSubtree(tbl, row, out) {
    var id = row.dataset.node || row.dataset.row;
    if (!id) return;
    tbl.querySelectorAll('.tbl__row[data-parent="' + id + '"]').forEach(function (kid) {
      out.push(kid);
      pushSubtree(tbl, kid, out);
    });
  }

  function treeToggle(tbl, twisty) {
    var open = twisty.getAttribute('aria-expanded') !== 'true';
    twisty.setAttribute('aria-expanded', String(open));
    twisty.setAttribute('aria-label', open ? 'Свернуть' : 'Развернуть');
    var row = twisty.closest('.tbl__row');
    var id = row && (row.dataset.node || row.dataset.row);
    if (id) {
      /* закрытие узла прячет всё поддерево, а не только прямых детей */
      var hide = [];
      var walk = function (parent) {
        tbl.querySelectorAll('.tbl__row[data-parent="' + parent + '"]').forEach(function (r) {
          hide.push(r);
          var kid = r.dataset.node || r.dataset.row;
          if (kid) walk(kid);
        });
      };
      walk(id);
      hide.forEach(function (r) {
        if (open) {
          /* раскрываем только те ветки, чей собственный твисти открыт */
          var pr = tbl.querySelector('.tbl__row[data-node="' + r.dataset.parent + '"]');
          var pt = pr && pr.querySelector('.tc__twisty[aria-expanded]');
          r.hidden = !!(pt && pt.getAttribute('aria-expanded') !== 'true');
        } else r.hidden = true;
      });
    }
    emit(tbl, 'treetoggle', { node: id, open: open });
  }

  function selectedIds(tbl) {
    return Array.prototype.map.call(
      tbl.querySelectorAll('.tbl__row--selected'),
      function (r) { return r.dataset.row || null; }
    ).filter(Boolean);
  }

  function syncHeadCheckbox(tbl) {
    var head = tbl.querySelector('.tbl__row--head .cb__input, .th .cb__input');
    if (!head) return;
    var boxes = dataRows(tbl).map(function (r) { return r.querySelector('.cb__input'); }).filter(Boolean);
    if (!boxes.length) return;
    var on = 0;
    boxes.forEach(function (b) { if (b.checked) on++; });
    head.checked = on === boxes.length;
    head.indeterminate = on > 0 && on < boxes.length;
  }

  function setRowSelected(row, on) {
    row.classList.toggle('tbl__row--selected', on);
    var box = row.querySelector('.cb__input');
    if (box) {
      box.checked = on;
      var cb = box.closest('.cb');
      if (cb) cb.classList.toggle('cb--selected', on);
    }
  }

  function wire(tbl, opts) {
    if (!tbl || tbl.__dsTableWired) return tbl && tbl.__dsTableWired;
    opts = opts || {};

    /* стартовое направление берём из разметки: без этого первый клик по
       колонке, уже отсортированной на экране, начинал цикл с asc и терял её
       состояние. Источник — aria-sort у .th, он же красит колонку в разметке */
    tbl.querySelectorAll('[data-sort]').forEach(function (b) {
      if (b.dataset.sortDir) return;
      var head = b.closest('.th');
      b.dataset.sortDir = (head && DIR_FROM_ARIA[head.getAttribute('aria-sort')]) || 'none';
    });
    /* исходный порядок строк — к нему возвращает третий клик (dir = none) */
    tbl.__dsRowOrder = dataRows(tbl);

    tbl.addEventListener('click', function (e) {
      var t = e.target;
      if (!t.closest) return;

      var sortBtn = t.closest('[data-sort]');
      if (sortBtn && tbl.contains(sortBtn)) {
        setSort(tbl, sortBtn, NEXT_DIR[sortBtn.dataset.sortDir || 'none']);
        return;
      }

      var twisty = t.closest('.tc__twisty:not(.tc__twisty--leaf)');
      if (twisty && tbl.contains(twisty)) { treeToggle(tbl, twisty); return; }

      /* чекбокс шапки выделяет и снимает все строки разом */
      var headBox = t.closest('.tbl__row--head .cb, .th .cb');
      if (headBox && tbl.contains(headBox)) {
        var input = headBox.querySelector('.cb__input');
        var on = input ? !input.checked : true;
        setTimeout(function () {
          dataRows(tbl).forEach(function (r) { setRowSelected(r, on); });
          syncHeadCheckbox(tbl);
          emit(tbl, 'rowselect', { selected: selectedIds(tbl) });
        }, 0);
        return;
      }

      var row = t.closest('.tbl__row');
      if (!row || !tbl.contains(row) || isHeadRow(row)) return;

      var cb = t.closest('.cb');
      if (cb) {
        setTimeout(function () {
          var box = row.querySelector('.cb__input');
          setRowSelected(row, !!(box && box.checked));
          syncHeadCheckbox(tbl);
          emit(tbl, 'rowselect', { selected: selectedIds(tbl) });
        }, 0);
        return;
      }
      if (opts.focusRow === false) return;
      tbl.querySelectorAll('.tbl__row--focus').forEach(function (r) { r.classList.remove('tbl__row--focus'); });
      row.classList.add('tbl__row--focus');
      emit(tbl, 'rowfocus', { row: row.dataset.row || null });
    });

    document.addEventListener('click', function (e) {
      if (!e.target.closest || e.target.closest('.tbl') === tbl) return;
      tbl.querySelectorAll('.tbl__row--focus').forEach(function (r) { r.classList.remove('tbl__row--focus'); });
    });

    chipOverflow(tbl);

    var api = {
      el: tbl,
      selected: function () { return selectedIds(tbl); },
      sort: function (column, dir) {
        var b = tbl.querySelector('[data-sort="' + column + '"]');
        if (b) setSort(tbl, b, dir || 'asc');
      },
      refresh: function () { syncHeadCheckbox(tbl); chipOverflow(tbl); },
      /* Строка добавлена/удалена мимо рантайма (реестр дописал новую сделку) —
         refresh() тут не подходит: он не трогает __dsRowOrder, а без этого
         добавленная строка не участвует в сортировке (data-sort-rows видит
         только зафиксированный при wire() состав). Перечитывает исходный
         порядок. Тултипы усечения новых ячеек не навешивает — усечённый текст
         обслуживает делегированный DSTooltip.truncated по первому наведению
         (см. регистрацию внизу), поэтому новые строки подхватываются сами. */
      rowsChanged: function () { tbl.__dsRowOrder = dataRows(tbl); syncHeadCheckbox(tbl); chipOverflow(tbl); },
    };
    tbl.__dsTableWired = api;
    return api;
  }

  /* Усечённый текст объясняет себя тултипом: значение ячейки
     (.tc__text--truncate) и подпись колонки (.th__label) — всё, что
     обрезается многоточием, по наведению/фокусу показывает полный текст.
     Реализация — общий механизм DSTooltip.truncated() (см. ds-tooltip.js),
     зарегистрированный ниже: делегирование по pointerover/focusin, lazy,
     новые строки/колонки подхватываются сами без перескана. Чипы здесь не
     перечислены — усечённую подпись чипа держит ds-chip.js (правило Chip).
     Собственная функция truncationTooltips удалена: она была одной из двух
     почти одинаковых копий правила (вторая — в ds-chip.js), и правило
     чинилось в одной из копий, а в другой молча не работало. */

  /* ------------------------------------------------------------------ */
  /* Свёртка чипов в ячейке — «+N»                                       */
  /* ------------------------------------------------------------------ *
     Чип в ячейке несжимаем (`.chip--fit` — код валюты, тег PE: значение
     обязано читаться целиком), поэтому стек из нескольких чипов в узкой
     колонке выезжал под соседнюю ячейку. Фон ячеек непрозрачный — лишние
     значения просто пропадали под соседом, без признака, что они есть.
     Правило ячейки: не поместившиеся чипы скрываются атрибутом `hidden`,
     последним встаёт чип-счётчик «+N» с тултипом со списком скрытых значений.
     Тот же приём, что у стека чипов в поле (`ds-input.js`), и то же
     требование тултипа, что у ReadOnlyField.
     Хук — сама разметка: два и более чипа в одном контейнере ячейки. Один чип
     не сворачивается никогда — он усекает свою подпись внутри плашки. Если не
     помещается даже один чип, в ячейке остаётся только счётчик. */
  var CHIP_HOST_SEL = '.tc .tc__row, .tc .tc__controls';
  var CHIP_SIZES = ['chip--l', 'chip--m', 'chip--s', 'chip--xs'];
  var CHIP_GAP_FALLBACK = 8;

  /* Место в ряду занимает не всегда сам чип: ds-tooltip.js оборачивает цель
     тултипа в `.tip-anchor`, и тогда элементом ряда становится обёртка. Её же
     надо прятать и мерить, иначе пустая обёртка продолжает занимать ширину.
     `.tip-anchor[hidden]` в tooltip.css перебивает свой `display` — атрибут
     работает и на обёртке. */
  function rowItem(el) {
    var p = el.parentNode;
    return (p && p.classList && p.classList.contains('tip-anchor')) ? p : el;
  }
  function chipIn(node) {
    if (!node.classList) return null;
    if (node.classList.contains('chip')) return node;
    return node.classList.contains('tip-anchor') ? node.querySelector('.chip') : null;
  }
  function hostChips(host) {
    var out = [];
    Array.prototype.forEach.call(host.children, function (n) {
      var c = chipIn(n);
      if (c && !c.hasAttribute('data-tc-count')) out.push(c);
    });
    return out;
  }
  function hostCounter(host) {
    var out = null;
    Array.prototype.forEach.call(host.children, function (n) {
      var c = chipIn(n);
      if (c && c.hasAttribute('data-tc-count')) out = c;
    });
    return out;
  }
  function chipText(chip) {
    var lab = chip.querySelector('.chip__label');
    return lab ? textSkippingTooltips(lab).replace(/\s+/g, ' ').trim() : '';
  }
  function gapOf(host) {
    if (!window.getComputedStyle) return CHIP_GAP_FALLBACK;
    var g = parseFloat(window.getComputedStyle(host).columnGap);
    return isNaN(g) ? CHIP_GAP_FALLBACK : g;
  }

  /* счётчик повторяет размер и форму свёрнутых чипов — он стоит с ними
     в одном ряду; `--fit` обязателен: «+N» показывается целиком */
  function makeChipCounter(sample, n) {
    var ch = document.createElement('span');
    var cls = 'chip chip--fit';
    CHIP_SIZES.forEach(function (m) { if (sample.classList.contains(m)) cls += ' ' + m; });
    if (sample.classList.contains('chip--rounded')) cls += ' chip--rounded';
    ch.className = cls;
    ch.setAttribute('data-tc-count', '');
    ch.tabIndex = 0;
    ch.innerHTML = '<span class="chip__label">+' + n + '</span>';
    return ch;
  }

  function layoutChipsCell(host) {
    var chips = hostChips(host);
    var old = hostCounter(host);
    if (old) rowItem(old).remove();
    /* разворачиваем всё перед замером: считать по свёрнутому состоянию значит
       залипнуть на первом значении и никогда не вернуть чипы при расширении */
    chips.forEach(function (c) { rowItem(c).hidden = false; });
    if (chips.length < 2) return;

    var avail = host.clientWidth;
    if (!avail) return;                        /* ячейка скрыта — мерить нечего */
    host.__dsChipsW = avail;
    var gap = gapOf(host);

    var kids = Array.prototype.filter.call(host.children, function (n) { return n.nodeType === 1; });
    var w = [], i, total = 0;
    for (i = 0; i < kids.length; i++) { w[i] = kids[i].offsetWidth; total += w[i] + (i ? gap : 0); }
    if (total <= avail) return;                /* помещается — счётчик не нужен */

    var probe = makeChipCounter(chips[0], chips.length);
    host.appendChild(probe);
    var counterW = probe.offsetWidth;

    /* не-чипы ряда (иконка, префикс, текст) не сворачиваются — их ширина
       вычитается всегда; сворачиваются только чипы, с конца */
    var items = chips.map(rowItem);
    var fixedW = 0, fixedN = 0;
    kids.forEach(function (n, k) { if (items.indexOf(n) < 0) { fixedW += w[k]; fixedN++; } });

    var shown = 0;
    for (var k = chips.length - 1; k >= 0; k--) {
      var used = fixedW, cnt = fixedN + k + 1;   /* +1 — сам счётчик */
      for (i = 0; i < k; i++) used += w[kids.indexOf(items[i])];
      used += counterW + gap * (cnt - 1);
      if (used <= avail) { shown = k; break; }
    }

    var rest = chips.length - shown;
    if (rest <= 0) { probe.remove(); return; }
    for (i = 0; i < chips.length; i++) items[i].hidden = i >= shown;

    var hiddenText = chips.slice(shown).map(chipText).filter(Boolean).join(', ');
    probe.querySelector('.chip__label').textContent = '+' + rest;
    probe.setAttribute('aria-label', 'Ещё ' + rest + ': ' + hiddenText);
    if (window.DSTooltip) {
      probe.setAttribute('data-tooltip', hiddenText);
      probe.setAttribute('data-tooltip-multiline', 'yes');
      DSTooltip.bind(probe);
    }
  }

  /* ширина колонки меняется ручкой .th__resize и переносом колонок — событий
     об этом нет, поэтому следим за ячейками одним общим ResizeObserver.
     Собственные правки рантайма (hidden у чипов, счётчик) ширину ячейки не
     меняют — сравнение с прошлой шириной отсекает лишние проходы. */
  var chipRO = null;
  function watchChipHost(host) {
    if (host.__dsChipsWatched || !window.ResizeObserver) return;
    host.__dsChipsWatched = true;
    if (!chipRO) {
      chipRO = new ResizeObserver(function (recs) {
        recs.forEach(function (r) {
          var h = r.target;
          if (h.__dsChipsW === h.clientWidth) return;
          layoutChipsCell(h);
        });
      });
    }
    chipRO.observe(host);
  }

  function chipOverflow(tbl) {
    tbl.querySelectorAll(CHIP_HOST_SEL).forEach(function (host) {
      if (hostChips(host).length < 2) return;
      layoutChipsCell(host);
      watchChipHost(host);
    });
  }

  function wireAll(root) {
    (root || document).querySelectorAll('[data-table]').forEach(function (el) { wire(el); });
  }

  function boot() { bindAll(); wireAll(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  /* Регистрация «усечено → тултип» (см. комментарий выше). Отложена до
     DOMContentLoaded: в ds.js ds-table.js грузится после ds-tooltip.js,
     но на страницах-документации бывает наоборот — guard на факт. */
  function registerTrunc() {
    if (!window.DSTooltip) return;
    /* Без opts.host: у подписи колонки и значения ячейки фокус может прийти
       на сам элемент (ячейка с интерактивом) или на строку; хост не задан —
       focusin берёт ближайший усечённый элемент от цели, hover — всегда
       сам элемент. Делегирование подхватывает новые строки без перескана. */
    window.DSTooltip.truncated('.tc__text--truncate, .th__label');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', registerTrunc);
  else registerTrunc();

  window.DSTable = { bind: bind, bindAll: bindAll, wire: wire, wireAll: wireAll, chipOverflow: chipOverflow };
})();
