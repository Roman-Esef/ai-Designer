/* ============================================================
   tbl-reorder.js — универсальное перетаскивание колонок для
   любой .tbl-таблицы (делегирование на document, без инициализации
   на странице). Общий рантайм ДС: входит в scripts/ds.js, поэтому
   на собранных экранах перетаскивание колонок работает из коробки —
   отдельно подключать не нужно.
   Колонку берут за подпись шапки (.th__label). Переносятся все
   колонки, кроме разделителей (.th--separator) и закреплённых
   (.th--pinned); колонки без подписи (например, колонка выбора)
   не перетаскиваются. Подписи с собственной логикой
   ([data-grab]/[data-drag-idx] — демо страниц) скрипт не трогает.
   ============================================================ */
(function () {
  'use strict';
  var THRESHOLD = 4; /* px горизонтального хода до начала переноса */

  /* абсолютные индексы переносимых колонок в строке (по шапке) */
  function movableIndices(headerRow) {
    var idx = [];
    Array.prototype.forEach.call(headerRow.children, function (th, i) {
      if (!th.classList.contains('th--separator') && !th.classList.contains('th--pinned')) idx.push(i);
    });
    return idx;
  }
  function ensureGuide(tbl) {
    var g = tbl.querySelector(':scope > .tbl__guide');
    if (!g) { g = document.createElement('span'); g.className = 'tbl__guide'; tbl.appendChild(g); }
    return g;
  }
  /* позиция вставки (0..len) среди переносимых колонок — по центрам */
  function dropIndex(headerRow, movable, clientX) {
    for (var i = 0; i < movable.length; i++) {
      var r = headerRow.children[movable[i]].getBoundingClientRect();
      if (clientX < r.left + r.width / 2) return i;
    }
    return movable.length;
  }

  document.addEventListener('pointerdown', function (e) {
    var label = e.target.closest && e.target.closest('.th__label');
    if (!label || label.hasAttribute('data-grab') || label.hasAttribute('data-drag-idx')) return;
    var th = label.closest('.th');
    if (!th || th.classList.contains('th--separator') || th.classList.contains('th--pinned')) return;
    var headerRow = th.closest('.tbl__row');
    var tbl = th.closest('.tbl');
    if (!headerRow || !tbl || e.button !== 0) return;

    var movable = movableIndices(headerRow);
    var from = Array.prototype.indexOf.call(headerRow.children, th);
    var fromPos = movable.indexOf(from);
    if (fromPos < 0) return;

    var x0 = e.clientX, started = false, target = fromPos;
    e.preventDefault();

    function mark(on) {
      tbl.querySelectorAll('.tbl__row').forEach(function (row) {
        var c = row.children[from];
        if (!c) return;
        c.classList.toggle(c.classList.contains('th') ? 'th--dragging' : 'tc--dragging', on);
      });
    }
    function move(ev) {
      if (!started) {
        if (Math.abs(ev.clientX - x0) < THRESHOLD) return;
        started = true;
        tbl.classList.add('tbl--reordering');
        mark(true);
      }
      target = dropIndex(headerRow, movable, ev.clientX);
      var g = ensureGuide(tbl);
      var x;
      if (target >= movable.length) {
        x = headerRow.children[movable[movable.length - 1]].getBoundingClientRect().right;
      } else {
        x = headerRow.children[movable[target]].getBoundingClientRect().left;
      }
      g.style.left = (x - tbl.getBoundingClientRect().left + tbl.scrollLeft) + 'px';
    }
    function up() {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      tbl.classList.remove('tbl--reordering');
      mark(false);
      if (!started || target === fromPos) return;
      var toPos = target > fromPos ? target - 1 : target;

      var rows = tbl.querySelectorAll('.tbl__row');
      /* фиксируем текущие ширины в px, чтобы перенос не переставил fr-треки */
      rows.forEach(function (row) {
        row.style.gridTemplateColumns = Array.prototype.map.call(row.children, function (c) {
          return Math.round(c.getBoundingClientRect().width) + 'px';
        }).join(' ');
      });
      rows.forEach(function (row) {
        var kids = Array.prototype.slice.call(row.children);
        var tracks = Array.prototype.map.call(kids, function (c) {
          return Math.round(c.getBoundingClientRect().width) + 'px';
        });
        var cells = movable.map(function (i) { return kids[i]; });
        var widths = movable.map(function (i) { return tracks[i]; });
        var dragged = cells.splice(fromPos, 1)[0];
        cells.splice(toPos, 0, dragged);
        var draggedW = widths.splice(fromPos, 1)[0];
        widths.splice(toPos, 0, draggedW);

        var orderedCells = [], orderedWidths = [], mi = 0;
        for (var i = 0; i < kids.length; i++) {
          if (movable.indexOf(i) >= 0) {
            orderedCells.push(cells[mi]);
            orderedWidths.push(widths[mi]);
            mi++;
          } else {
            orderedCells.push(kids[i]);
            orderedWidths.push(tracks[i]);
          }
        }
        orderedCells.forEach(function (c) { row.appendChild(c); });
        row.style.gridTemplateColumns = orderedWidths.join(' ');
      });
      /* новый абсолютный индекс перенесённой колонки */
      tbl.dispatchEvent(new CustomEvent('columnreorder', { bubbles: true, detail: { from: from, to: movable[toPos] } }));
    }
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
  });
})();
