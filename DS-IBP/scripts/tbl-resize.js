/* ============================================================
   tbl-resize.js — универсальное изменение ширины колонки для
   любой .tbl-таблицы (делегирование на document, без инициализации
   на странице). Общий рантайм ДС: входит в scripts/ds.js, поэтому
   на собранных экранах ручка `.th__resize` работает из коробки —
   отдельно подключать не нужно (страницы документации, не тянущие
   ds.js, линкуют файл напрямую).
   Ручки с [data-resize] (Конструктор, демо «Ширина колонок»)
   уже имеют свою логику — этот скрипт их не трогает.
   ============================================================ */
(function () {
  'use strict';
  var MIN = 96;

  function ensureGuide(tbl) {
    var g = tbl.querySelector(':scope > .tbl__guide');
    if (!g) { g = document.createElement('span'); g.className = 'tbl__guide'; tbl.appendChild(g); }
    return g;
  }
  function colIndex(row, th) { return Array.prototype.indexOf.call(row.children, th); }
  /* фиксирует текущую отрендеренную ширину каждой колонки строки в px —
     остальные колонки при резайзе не пересчитываются, только сдвигаются */
  function freezeTracks(row) {
    return Array.prototype.map.call(row.children, function (cell) {
      return Math.round(cell.getBoundingClientRect().width) + 'px';
    });
  }
  function applyTracksAll(tbl, tracks) {
    var str = tracks.join(' ');
    tbl.querySelectorAll('.tbl__row').forEach(function (row) { row.style.gridTemplateColumns = str; });
  }
  function guideAt(tbl, clientX) {
    var g = ensureGuide(tbl);
    g.style.left = (clientX - tbl.getBoundingClientRect().left + tbl.scrollLeft) + 'px';
  }
  function startResize(e, handle) {
    var th = handle.closest('.th');
    var row = handle.closest('.tbl__row');
    var tbl = handle.closest('.tbl');
    if (!th || !row || !tbl) return;
    e.preventDefault();
    tbl.classList.add('tbl--scroll');
    var idx = colIndex(row, th);
    var tracks = freezeTracks(row);
    applyTracksAll(tbl, tracks);
    var x0 = e.clientX, w0 = parseFloat(tracks[idx]);
    tbl.classList.add('tbl--resizing');
    th.classList.add('th--resizing');
    function move(ev) {
      var w = Math.max(MIN, Math.round(w0 + (ev.clientX - x0)));
      var next = tracks.slice(); next[idx] = w + 'px';
      applyTracksAll(tbl, next);
      guideAt(tbl, ev.clientX);
    }
    function up() {
      tbl.classList.remove('tbl--resizing');
      th.classList.remove('th--resizing');
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
    }
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
    move(e);
  }

  document.addEventListener('pointerdown', function (e) {
    var h = e.target.closest && e.target.closest('.th__resize');
    if (!h || h.hasAttribute('data-resize')) return;
    startResize(e, h);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    var h = document.activeElement;
    if (!h || !h.classList || !h.classList.contains('th__resize') || h.hasAttribute('data-resize')) return;
    var th = h.closest('.th'), row = h.closest('.tbl__row'), tbl = h.closest('.tbl');
    if (!th || !row || !tbl) return;
    e.preventDefault();
    tbl.classList.add('tbl--scroll');
    var idx = colIndex(row, th);
    var tracks = freezeTracks(row);
    var w = Math.max(MIN, Math.round(parseFloat(tracks[idx]) + (e.key === 'ArrowRight' ? 16 : -16)));
    tracks[idx] = w + 'px';
    applyTracksAll(tbl, tracks);
  });
})();
