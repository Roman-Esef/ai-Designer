/* =========================================================================
   DS Table — рантайм таблицы (out-of-box).
   Зависимости: styles/table.css, styles/table-cell.css;
   опционально scripts/ds-tooltip.js (тултип на усечённом тексте).

   Экспорт: window.DSTable = {
     bind(bodyEl) · bindAll(root)          — тень липкой шапки .dtable (--scrolled)
     wire(tblEl, opts) → api               — интерактив строк и ячеек
     wireAll(root)                         — обойти [data-table]
   }

   Тень липкой шапки: .dtable__body сам подхватывается (scroll + ResizeObserver)
   и красит корень классом --scrolled, когда тело проскроллено вниз.
   Теней по левому/правому краю нет — убраны 27.08.2026 (уезжали с контентом).

   Интерактив (opt-in: data-table на .tbl) — делегированием, поэтому
   перерисовка строк ничего не ломает:
     сортировка   — клик по [data-sort] в шапке: none → asc → desc → none,
                    aria-sort и глиф синхронны, активна одна колонка;
                    событие 'sort' с { column, dir }
     дерево       — .tc__twisty переключает aria-expanded и показ дочерних
                    строк ([data-parent] = id узла); событие 'treetoggle'
     выбор строк   — чекбокс .tbl__row .cb__input красит строку .tbl__row--selected,
                    чекбокс шапки выделяет все (с промежуточным состоянием);
                    событие 'rowselect' с { selected: [id…] }
     фокус строки  — клик по строке ставит .tbl__row--focus (снимается кликом вне)
     усечение      — .tc__text--truncate получает тултип с полным текстом,
                    показываемый только при реальном усечении
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

  function icon(name) { return (window.DS_ICONS || {})[name] || ''; }
  function emit(el, type, detail) {
    el.dispatchEvent(new CustomEvent(type, { detail: detail, bubbles: true }));
  }

  function setSort(tbl, btn, dir) {
    tbl.querySelectorAll('[data-sort]').forEach(function (b) {
      var head = b.closest('.th') || b;
      var own = b === btn;
      var d = own ? dir : 'none';
      b.dataset.sortDir = d;
      var g = b.querySelector('.th__sort-icon') || b;
      if (g !== b) g.innerHTML = icon(SORT_GLYPH[d]);
      head.setAttribute('aria-sort', ARIA_SORT[d]);
      b.classList.toggle('is-sorted', d !== 'none');
    });
    emit(tbl, 'sort', { column: btn.dataset.sort, dir: dir });
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
    var boxes = tbl.querySelectorAll('.tbl__row:not(.tbl__row--head) .cb__input');
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
          tbl.querySelectorAll('.tbl__row:not(.tbl__row--head)').forEach(function (r) { setRowSelected(r, on); });
          syncHeadCheckbox(tbl);
          emit(tbl, 'rowselect', { selected: selectedIds(tbl) });
        }, 0);
        return;
      }

      var row = t.closest('.tbl__row:not(.tbl__row--head)');
      if (!row || !tbl.contains(row)) return;

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

    truncationTooltips(tbl);

    var api = {
      el: tbl,
      selected: function () { return selectedIds(tbl); },
      sort: function (column, dir) {
        var b = tbl.querySelector('[data-sort="' + column + '"]');
        if (b) setSort(tbl, b, dir || 'asc');
      },
      refresh: function () { syncHeadCheckbox(tbl); truncationTooltips(tbl); },
    };
    tbl.__dsTableWired = api;
    return api;
  }

  /* усечённый текст объясняет себя тултипом — показывается только когда
     текст действительно не помещается (ds-tooltip проверяет scrollWidth).
     Поведение общее для всей таблицы: значение ячейки (.tc__text--truncate),
     подпись шапки (.th__label) и подпись чипа в ячейке (.chip__label) —
     всё, что усекается многоточием, по наведению показывает полный текст. */
  var TRUNC_SEL = '.tc__text--truncate, .th__label, .tc .chip__label';

  function truncationTooltips(tbl) {
    if (!window.DSTooltip) return;
    tbl.querySelectorAll(TRUNC_SEL).forEach(function (el) {
      if (el.hasAttribute('data-tooltip')) return;
      var text = el.textContent.trim();
      if (!text) return;
      el.setAttribute('data-tooltip', text);
      el.setAttribute('data-tooltip-truncated', 'only');
      /* смысл тултипа здесь — показать значение ЦЕЛИКОМ, поэтому длинный текст
         переносится по --tip-max, а не усекается повторно внутри тултипа */
      el.setAttribute('data-tooltip-multiline', 'yes');
      DSTooltip.bind(el);
    });
  }

  function wireAll(root) {
    (root || document).querySelectorAll('[data-table]').forEach(function (el) { wire(el); });
  }

  function boot() { bindAll(); wireAll(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.DSTable = { bind: bind, bindAll: bindAll, wire: wire, wireAll: wireAll };
})();
