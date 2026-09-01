/* =========================================================================
   Chart — рантайм ДС. Строит SVG-график из данных и держит поведение:
   легенда, тултип, кросс-хэйр, подписи значений, опорная линия, brush.
   Публичное API: window.DSChart
     .make(cfg)  → DOM-узел .chart-host (перерисовывается по ResizeObserver)
     .palette    → 12 токенов --chart-* в порядке назначения
     .fmt        → { number, compact, percent } — форматтеры ru-RU
   Разметка: см. specs/Chart.md. Стиль: styles/chart.css.
   ========================================================================= */
(function (global) {
'use strict';

var PALETTE = [
  '--chart-blue', '--chart-turquoise', '--chart-indigo', '--chart-orange',
  '--chart-pastel-green', '--chart-purple', '--chart-light-blue', '--chart-yellow',
  '--chart-shiny-green', '--chart-pink-purple', '--chart-red', '--chart-pale-purple'
];
var NS = 'http://www.w3.org/2000/svg';
var CAT_TYPES = { bar: 1, hbar: 1, grouped: 1, stacked: 1, stacked100: 1, line: 1, area: 1, combo: 1, waterfall: 1 };

/* ---------- числа ru-RU ---------- */
function fmtNumber(n, min, max) {
  if (n == null || isNaN(n)) return '—';
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: min == null ? 0 : min,
    maximumFractionDigits: max == null ? 2 : max
  }).format(n);
}
function fmtPercent(p) { return fmtNumber(p, 1, 1) + '%'; }
function fmtCompact(n) {
  if (n == null || isNaN(n)) return '—';
  var a = Math.abs(n);
  if (a >= 1e9) return fmtNumber(n / 1e9, 0, 1) + ' млрд';
  if (a >= 1e6) return fmtNumber(n / 1e6, 0, 1) + ' млн';
  if (a >= 1e4) return fmtNumber(n / 1e3, 0, 1) + ' тыс.';
  return fmtNumber(n, 0, 2);
}

/* ---------- DOM/SVG ---------- */
function el(tag, cls, txt) {
  var e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt != null) e.textContent = txt;
  return e;
}
function s(tag, attrs, txt) {
  var e = document.createElementNS(NS, tag);
  if (attrs) for (var k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
  if (txt != null) e.textContent = txt;
  return e;
}
function tokenColor(tok) { return tok ? 'var(' + tok + ')' : null; }

/* ---------- шкала: «красивые» деления ---------- */
function niceTicks(min, max, count) {
  if (min === max) { max = min + 1; }
  var span = max - min;
  var step = Math.pow(10, Math.floor(Math.log10(span / count)));
  var err = span / count / step;
  if (err >= 7.5) step *= 10; else if (err >= 3.5) step *= 5; else if (err >= 1.5) step *= 2;
  var lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step;
  var ticks = [], v = lo, guard = 0;
  while (v <= hi + step / 1000 && guard++ < 40) { ticks.push(Math.abs(v) < step / 1000 ? 0 : v); v += step; }
  return { min: lo, max: hi, ticks: ticks };
}

/* =========================================================================
   Основной конструктор
   ========================================================================= */
function make(cfg) {
  cfg = Object.assign({
    type: 'bar', size: 'm', legend: true, tooltip: true, crosshair: false,
    grid: 'y', valueLabels: false, brush: false, format: 'compact',
    yTicks: 4, status: 'loaded', categories: [], series: []
  }, cfg || {});

  var host = el('div', 'chart-host' + (cfg.type === 'spark' ? ' chart-host--spark' : ''));
  host.dataset.size = cfg.size;
  host.dataset.type = cfg.type;
  var root = el('div', 'chart' + (cfg.type === 'spark' ? ' chart--spark' : '') + (cfg.stretch ? ' chart--stretch' : ''));
  host.appendChild(root);

  var inst = {
    cfg: cfg, host: host, root: root,
    hidden: {},                       /* id серии → скрыта легендой */
    range: null,                      /* [i0, i1] при brush */
    palette: cfg.palette || PALETTE
  };
  host.__chart = inst;

  if (cfg.status === 'loading' || cfg.status === 'loading-slow') { renderSkeleton(inst); return host; }
  if (cfg.status === 'error') { renderError(inst); return host; }
  if (cfg.status === 'empty' || !hasData(cfg)) { renderEmpty(inst); return host; }

  buildAnatomy(inst);
  observe(inst);
  return host;
}

function hasData(cfg) {
  if (!cfg.series || !cfg.series.length) return false;
  return cfg.series.some(function (se) {
    return (se.data || []).some(function (v) { return v != null && (typeof v !== 'object' || v.y != null); });
  });
}

/* ---------- служебные состояния ---------- */
function head(inst) {
  var cfg = inst.cfg;
  if (!cfg.title && !cfg.subtitle && !cfg.toolbar) return null;
  var h = el('div', 'chart__head');
  var t = el('div', 'chart__titles');
  if (cfg.title) t.appendChild(el('div', 'chart__title', cfg.title));
  if (cfg.subtitle) t.appendChild(el('div', 'chart__subtitle', cfg.subtitle));
  h.appendChild(t);
  if (cfg.toolbar) h.appendChild(buildToolbar(inst));
  return h;
}
function renderSkeleton(inst) {
  var h = head(inst); if (h) inst.root.appendChild(h);
  var wrap = el('div', 'chart__sk');
  wrap.setAttribute('aria-busy', 'true');
  if (inst.cfg.status === 'loading-slow') {
    var c = el('div', 'chart__calc');
    c.appendChild(el('div', 'chart__calc-title', 'Данные рассчитываются'));
    c.appendChild(el('div', 'chart__calc-sub', inst.cfg.calcMessage || 'Расчёт занимает больше обычного, график появится автоматически'));
    inst.root.appendChild(c);
    return;
  }
  var bars = el('div', 'chart__sk-bars');
  [58, 82, 44, 96, 70, 62].forEach(function (p) {
    var b = el('span', 'sk-block');
    b.style.setProperty('--sk-h', p + '%');
    b.setAttribute('aria-hidden', 'true');
    bars.appendChild(b);
  });
  wrap.appendChild(bars);
  var line = el('span', 'sk-line sk-line--caption');
  line.style.setProperty('--sk-w', '100%');
  line.setAttribute('aria-hidden', 'true');
  wrap.appendChild(line);
  inst.root.appendChild(wrap);
}
function renderError(inst) {
  var h = head(inst); if (h) inst.root.appendChild(h);
  var box = el('div', 'chart__foot');
  var a = el('div', 'alert alert--error alert--m');
  a.setAttribute('role', 'alert');
  var ico = el('span', 'alert__icon'); ico.setAttribute('aria-hidden', 'true');
  ico.innerHTML = '<i data-icon="alert-circle-filled"></i>';
  var body = el('div', 'alert__body');
  var p = el('p', 'alert__text', inst.cfg.errorMessage || 'Не удалось загрузить данные графика');
  body.appendChild(p);
  var btns = el('div', 'alert__buttons');
  var b = el('button', 'btn btn--outline btn--xs btn--error'); b.type = 'button';
  b.appendChild(el('span', 'btn__label', 'Повторить'));
  if (inst.cfg.onRetry) b.addEventListener('click', inst.cfg.onRetry);
  btns.appendChild(b); body.appendChild(btns);
  a.appendChild(ico); a.appendChild(body);
  box.appendChild(a);
  inst.root.appendChild(box);
  if (global.dsIcons) global.dsIcons.apply(inst.root);
}
function renderEmpty(inst) {
  var h = head(inst); if (h) inst.root.appendChild(h);
  inst.root.appendChild(el('div', 'chart__empty', inst.cfg.emptyMessage || 'Нет данных за выбранный период'));
}

/* ---------- тулбар ---------- */
function buildToolbar(inst) {
  var tb = inst.cfg.toolbar, box = el('div', 'chart__toolbar');
  if (tb.periods && tb.periods.length) {
    var rail = el('div', 'segctrl segctrl--xs');
    rail.setAttribute('role', 'radiogroup');
    rail.setAttribute('aria-label', 'Период');
    var thumb = el('div', 'segctrl__thumb'); rail.appendChild(thumb);
    var btns = tb.periods.map(function (p) {
      var b = el('button', 'segctrl__item'); b.type = 'button';
      b.setAttribute('role', 'radio'); b.dataset.val = p;
      b.innerHTML = '<span class="segctrl__label"></span>';
      b.firstChild.textContent = p;
      b.addEventListener('click', function () {
        tb.active = p; sync();
        if (tb.onPeriod) tb.onPeriod(p, inst);
      });
      rail.appendChild(b); return b;
    });
    function sync() {
      var on = null;
      btns.forEach(function (b) {
        var is = b.dataset.val === tb.active;
        b.setAttribute('aria-checked', String(is)); if (is) on = b;
      });
      if (on && on.offsetWidth) {
        thumb.style.width = on.offsetWidth + 'px';
        thumb.style.transform = 'translateX(' + on.offsetLeft + 'px)';
        thumb.classList.add('is-visible');
      }
    }
    if (global.ResizeObserver) new ResizeObserver(sync).observe(rail);
    setTimeout(sync, 0);
    setTimeout(sync, 160);
    box.appendChild(rail);
  }
  if (tb.export !== false) {
    var ib = el('button', 'ibtn ibtn--neutral ibtn--s'); ib.type = 'button';
    ib.setAttribute('aria-label', 'Скачать график');
    ib.title = 'Скачать SVG';
    ib.innerHTML = '<i data-icon="download"></i>';
    ib.addEventListener('click', function () { exportSvg(inst); });
    box.appendChild(ib);
  }
  return box;
}
function exportSvg(inst) {
  if (!inst.svg) return;
  var clone = inst.svg.cloneNode(true);
  clone.setAttribute('xmlns', NS);
  var blob = new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = (inst.cfg.title || 'chart') + '.svg';
  a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
}

/* ---------- анатомия ---------- */
function buildAnatomy(inst) {
  var cfg = inst.cfg, root = inst.root;
  var h = head(inst); if (h) root.appendChild(h);

  if (cfg.legend && cfg.type !== 'spark') {
    inst.legend = el('div', 'chart__legend' + (cfg.legend === 'bottom' ? ' chart__legend--bottom' : ''));
    root.appendChild(inst.legend);
  }
  inst.plot = el('div', 'chart__plot');
  inst.svg = s('svg', { class: 'chart__svg', role: 'img' });
  inst.plot.appendChild(inst.svg);
  if (cfg.crosshair) { inst.cursor = el('div', 'chart__cursor'); inst.plot.appendChild(inst.cursor); }
  if (cfg.tooltip && cfg.type !== 'spark') {
    inst.tip = el('div', 'tip tip--main tip--multiline tip--no-arrow chart__tip');
    inst.tip.setAttribute('role', 'tooltip');
    inst.tip.style.display = 'none';
    inst.plot.appendChild(inst.tip);
  }
  root.appendChild(inst.plot);

  if (cfg.brush && CAT_TYPES[cfg.type]) buildBrush(inst);
  if (cfg.footNote) {
    var f = el('div', 'chart__foot');
    var a = el('div', 'alert alert--info alert--m');
    var ico = el('span', 'alert__icon'); ico.setAttribute('aria-hidden', 'true');
    ico.innerHTML = '<i data-icon="Info-circle-filled"></i>';
    var body = el('div', 'alert__body'); body.appendChild(el('p', 'alert__text', cfg.footNote));
    a.appendChild(ico); a.appendChild(body); f.appendChild(a);
    root.appendChild(f);
  }
  if (global.dsIcons) global.dsIcons.apply(root);
  if (global.DSTooltip) global.DSTooltip.bindAll(root);
}

/* ---------- легенда ---------- */
function renderLegend(inst, series) {
  if (!inst.legend) return;
  inst.legend.innerHTML = '';
  series.forEach(function (se) {
    var b = el('button', 'chart__legend-item'); b.type = 'button';
    b.setAttribute('aria-pressed', String(!inst.hidden[se.id]));
    var mk = el('span', 'chart__marker' + (se.kind === 'line' ? ' chart__marker--line' : '') + (se.kind === 'scatter' ? ' chart__marker--dot' : '') + (se.dashed ? ' chart__marker--dashed' : ''));
    mk.style.setProperty('--chart-c', se.color);
    b.appendChild(mk);
    b.appendChild(el('span', 'chart__legend-name', se.name));
    if (se.legendValue != null) b.appendChild(el('span', 'chart__legend-val', se.legendValue));
    b.addEventListener('click', function () {
      var visible = series.filter(function (x) { return !inst.hidden[x.id]; });
      if (!inst.hidden[se.id] && visible.length === 1) return;   /* последнюю серию не гасим */
      inst.hidden[se.id] = !inst.hidden[se.id];
      draw(inst);
    });
    b.addEventListener('mouseenter', function () { inst.root.dataset.hover = se.id; markActive(inst, se.id); });
    b.addEventListener('mouseleave', function () { delete inst.root.dataset.hover; markActive(inst, null); });
    inst.legend.appendChild(b);
  });
}
function markActive(inst, id) {
  inst.svg.querySelectorAll('.chart__ser').forEach(function (g) {
    g.classList.toggle('is-active', id != null && g.dataset.id === id);
  });
}

/* ---------- нормализация серий ---------- */
function prepare(inst) {
  var cfg = inst.cfg;
  return (cfg.series || []).map(function (se, i) {
    var kind = se.type || (cfg.type === 'line' ? 'line'
      : (cfg.type === 'area' || cfg.type === 'stackedArea') ? 'area'
      : cfg.type === 'scatter' ? 'scatter' : 'bar');
    return {
      id: se.id || 's' + i,
      name: se.name || 'Серия ' + (i + 1),
      data: se.data || [],
      kind: kind,
      dashed: !!se.dashed,
      forecastFrom: se.forecastFrom == null ? null : se.forecastFrom,
      legendValue: se.legendValue,
      color: tokenColor(se.color || inst.palette[i % inst.palette.length])
    };
  });
}

/* ---------- перерисовка по размеру ---------- */
function observe(inst) {
  function schedule() {
    clearTimeout(inst.raf);
    inst.raf = setTimeout(function () { draw(inst); }, 16);
  }
  inst.redraw = schedule;
  if (global.ResizeObserver) { inst.ro = new ResizeObserver(schedule); inst.ro.observe(inst.plot); }
  global.addEventListener('resize', schedule);
  /* первая отрисовка: узел мог ещё не попасть в документ — ждём ненулевую ширину */
  var tries = 0;
  (function attempt() {
    if (inst.plot.clientWidth) { draw(inst); return; }
    if (tries++ < 60) setTimeout(attempt, 32);
  })();
}

/* =========================================================================
   Отрисовка
   ========================================================================= */
function draw(inst) {
  var cfg = inst.cfg, svg = inst.svg;
  var box = svg.getBoundingClientRect();
  var W = Math.round(box.width), H = Math.round(box.height);
  if (!W || !H) return;
  svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
  svg.innerHTML = '';

  var all = prepare(inst);
  renderLegend(inst, all);
  var series = all.filter(function (se) { return !inst.hidden[se.id]; });
  if (!series.length) series = all.slice(0, 1);

  var cats = cfg.categories || [];
  var range = inst.range || [0, Math.max(cats.length - 1, 0)];
  inst.view = { series: series, all: all, W: W, H: H };

  if (cfg.type === 'spark') { drawSpark(inst, series, W, H); return; }
  if (cfg.type === 'pie' || cfg.type === 'donut') { drawPie(inst, series, W, H); return; }
  if (cfg.type === 'scatter') { drawScatter(inst, series, W, H); return; }
  drawCartesian(inst, series, cats, range, W, H);
}

/* ---- измерение ширины подписи: меряем в том же контексте, что и ось,
   иначе на размере L (Body S) подписи окажутся шире расчётного поля ---- */
function textW(svg, txt, fontClass) {
  var g = s('g', { class: 'chart__axis' });
  var t = s('text', { class: fontClass || null, x: -999, y: -999 }, txt);
  g.appendChild(t); svg.appendChild(g);
  var w = t.getComputedTextLength();
  g.remove();
  return w;
}

/* ---------- декартовы типы ---------- */
function drawCartesian(inst, series, cats, range, W, H) {
  var cfg = inst.cfg, svg = inst.svg;
  var horiz = cfg.type === 'hbar';
  var i0 = Math.max(0, Math.round(range[0])), i1 = Math.min(cats.length - 1, Math.round(range[1]));
  var idx = []; for (var i = i0; i <= i1; i++) idx.push(i);
  var stacked = cfg.type === 'stacked' || cfg.type === 'stacked100' || cfg.type === 'stackedArea';
  var stackedArea = cfg.type === 'stackedArea';
  var pct = cfg.type === 'stacked100';
  var waterfall = cfg.type === 'waterfall';

  /* --- диапазон значений --- */
  var lo = 0, hi = 0, wf = null;
  if (waterfall) {
    wf = []; var acc = 0;
    idx.forEach(function (j, k) {
      var v = num(series[0].data[j]);
      var isTot = (cfg.totalIndexes || []).indexOf(j) >= 0;
      var from = isTot ? 0 : acc, to = isTot ? v : acc + v;
      wf.push({ j: j, from: from, to: to, v: v, total: isTot });
      acc = to;
      lo = Math.min(lo, from, to); hi = Math.max(hi, from, to);
    });
  } else if (pct) { lo = 0; hi = 100; }
  else if (stacked) {
    idx.forEach(function (j) {
      var pos = 0, neg = 0;
      series.forEach(function (se) { var v = num(se.data[j]); if (v >= 0) pos += v; else neg += v; });
      hi = Math.max(hi, pos); lo = Math.min(lo, neg);
    });
  } else {
    series.forEach(function (se) {
      idx.forEach(function (j) {
        var v = se.data[j]; if (v == null) return;
        hi = Math.max(hi, num(v)); lo = Math.min(lo, num(v));
      });
    });
  }
  if (cfg.refLine) { hi = Math.max(hi, cfg.refLine.value); lo = Math.min(lo, cfg.refLine.value); }
  if (cfg.maxY != null) hi = cfg.maxY;
  if (cfg.minY != null) lo = cfg.minY;
  if (hi === lo) hi = lo + 1;
  var scale = pct ? { min: 0, max: 100, ticks: [0, 25, 50, 75, 100] } : niceTicks(lo, hi, cfg.yTicks);

  /* --- поля --- */
  var fmtV = function (v) { return pct ? fmtNumber(v, 0, 0) + '%' : (cfg.format === 'full' ? fmtNumber(v, 0, 2) : fmtCompact(v)); };
  var valW = 0;
  scale.ticks.forEach(function (t) { valW = Math.max(valW, textW(svg, fmtV(t))); });
  var catW = 0;
  idx.forEach(function (j) { catW = Math.max(catW, textW(svg, String(cats[j] == null ? '' : cats[j]))); });

  var pad = { t: cfg.valueLabels ? 18 : 10, r: 10, b: 22, l: 8 };
  if (horiz) { pad.l = Math.min(catW + 10, W * 0.42); pad.b = 20; pad.r = Math.max(10, textW(svg, fmtV(scale.max)) / 2 + 6); }
  else { pad.l = valW + 10; }
  var x0 = pad.l, x1 = W - pad.r, y0 = pad.t, y1 = H - pad.b;
  if (x1 <= x0 || y1 <= y0) return;

  var gGrid = s('g', { class: 'chart__grid' }), gBand = s('g'), gSer = s('g'), gAxis = s('g', { class: 'chart__axis' }), gLab = s('g'), gHit = s('g');

  /* --- сетка и ось значений --- */
  var vPos = horiz
    ? function (v) { return x0 + (v - scale.min) / (scale.max - scale.min) * (x1 - x0); }
    : function (v) { return y1 - (v - scale.min) / (scale.max - scale.min) * (y1 - y0); };

  if (cfg.grid !== 'none') scale.ticks.forEach(function (t) {
    var p = Math.round(vPos(t)) + .5;
    gGrid.appendChild(horiz
      ? s('line', { x1: p, x2: p, y1: y0, y2: y1, class: t === 0 ? 'chart__zero' : null })
      : s('line', { x1: x0, x2: x1, y1: p, y2: p, class: t === 0 ? 'chart__zero' : null }));
    gAxis.appendChild(horiz
      ? s('text', { x: p, y: y1 + 15, 'text-anchor': 'middle' }, fmtV(t))
      : s('text', { x: x0 - 8, y: p + 4, 'text-anchor': 'end' }, fmtV(t)));
  });

  /* --- полосы категорий --- */
  var n = idx.length;
  var bandFull = (horiz ? (y1 - y0) : (x1 - x0)) / Math.max(n, 1);
  var bandPos = function (k) { return (horiz ? y0 : x0) + bandFull * k; };
  var barPad = Math.min(bandFull * 0.24, 12);
  var bw = Math.max(bandFull - barPad * 2, 2);

  /* подписи категорий: прореживание, если не помещаются */
  var step = 1;
  if (!horiz) { var need = catW + 10; while (bandFull * step < need && step < n) step++; }
  idx.forEach(function (j, k) {
    if (!horiz && k % step) return;
    var lbl = String(cats[j] == null ? '' : cats[j]);
    if (horiz) {
      gAxis.appendChild(s('text', { x: x0 - 8, y: bandPos(k) + bandFull / 2 + 4, 'text-anchor': 'end' }, lbl));
      return;
    }
    /* центр полосы, но крайние подписи прижимаются к границам поля — иначе их срезает overflow */
    var cxL = bandPos(k) + bandFull / 2, half = textW(svg, lbl) / 2, anchor = 'middle';
    if (cxL - half < x0) { cxL = x0; anchor = 'start'; }
    else if (cxL + half > x1) { cxL = x1; anchor = 'end'; }
    gAxis.appendChild(s('text', { x: cxL, y: y1 + 15, 'text-anchor': anchor }, lbl));
  });
  gAxis.appendChild(horiz
    ? s('line', { x1: x0 + .5, x2: x0 + .5, y1: y0, y2: y1 })
    : s('line', { x1: x0, x2: x1, y1: Math.round(vPos(Math.max(scale.min, 0))) + .5, y2: Math.round(vPos(Math.max(scale.min, 0))) + .5 }));

  /* --- серии --- */
  var barSeries = series.filter(function (se) { return se.kind === 'bar'; });
  var lineSeries = series.filter(function (se) { return se.kind === 'line' || se.kind === 'area'; });
  var stackAcc = {}, areaAcc = {};

  if (waterfall) {
    var g = s('g', { class: 'chart__ser', 'data-id': series[0].id });
    wf.forEach(function (b, k) {
      var yA = vPos(b.from), yB = vPos(b.to);
      var color = b.total ? 'var(--primary)' : (b.v >= 0 ? 'var(--success)' : 'var(--error)');
      var rect = s('rect', {
        class: 'chart__bar', x: bandPos(k) + barPad, width: bw,
        y: Math.min(yA, yB), height: Math.max(Math.abs(yB - yA), 2), 'data-i': b.j
      });
      rect.style.setProperty('--chart-c', color);
      g.appendChild(rect);
      if (cfg.valueLabels) gLab.appendChild(s('text', {
        class: 'chart__vlabel', x: bandPos(k) + bandFull / 2,
        y: Math.min(yA, yB) - 5, 'text-anchor': 'middle'
      }, (b.v > 0 && !b.total ? '+' : '') + fmtV(b.v)));
      if (k < wf.length - 1) gGrid.appendChild(s('line', {
        x1: bandPos(k) + barPad, x2: bandPos(k + 1) + barPad + bw,
        y1: Math.round(vPos(b.to)) + .5, y2: Math.round(vPos(b.to)) + .5
      }));
    });
    gSer.appendChild(g);
  } else if (barSeries.length) {
    /* bar/hbar с несколькими сериями группируются автоматически — накладывать серии друг на друга нельзя */
    var groupN = stacked ? 1 : barSeries.length;
    var slot = bw / groupN;
    barSeries.forEach(function (se, si) {
      var g = s('g', { class: 'chart__ser', 'data-id': se.id });
      g.style.setProperty('--chart-c', se.color);
      idx.forEach(function (j, k) {
        var raw = se.data[j];
        if (raw == null) return;
        var v = num(raw);
        if (pct) {
          var sum = series.reduce(function (a, x) { return a + Math.abs(num(x.data[j])); }, 0) || 1;
          v = num(raw) / sum * 100;
        }
        var base = 0, top = v;
        if (stacked) {
          var key = j + '|' + (v >= 0 ? 'p' : 'n');
          base = stackAcc[key] || 0; top = base + v; stackAcc[key] = top;
        }
        var yA = vPos(base), yB = vPos(top);
        var forecast = se.forecastFrom != null && j >= se.forecastFrom;
        var attrs = horiz
          ? { x: Math.min(yA, yB), y: bandPos(k) + barPad + slot * (groupN > 1 ? si : 0), width: Math.max(Math.abs(yB - yA), 2), height: groupN > 1 ? slot - 2 : bw }
          : { x: bandPos(k) + barPad + slot * (groupN > 1 ? si : 0) + (groupN > 1 ? 1 : 0), y: Math.min(yA, yB), width: groupN > 1 ? Math.max(slot - 2, 1) : bw, height: Math.max(Math.abs(yB - yA), 2) };
        attrs.class = 'chart__bar' + (forecast ? ' chart__bar--forecast' : '');
        attrs['data-i'] = j;
        var rect = s('rect', attrs);
        if (forecast) rect.style.setProperty('--chart-forecast', hatch(inst, se.color));
        g.appendChild(rect);
        if (cfg.valueLabels && !stacked) gLab.appendChild(s('text', {
          class: 'chart__vlabel',
          x: horiz ? Math.max(yA, yB) + 4 : attrs.x + attrs.width / 2,
          y: horiz ? attrs.y + attrs.height / 2 + 4 : Math.min(yA, yB) - 5,
          'text-anchor': horiz ? 'start' : 'middle'
        }, fmtV(num(raw))));
      });
      gSer.appendChild(g);
    });
  }

  var lineList = lineSeries.map(function (se) {
    var vAt = {};
    idx.forEach(function (j) {
      if (se.data[j] == null) return;
      var v = num(se.data[j]);
      if (stackedArea) { areaAcc[j] = (areaAcc[j] || 0) + v; v = areaAcc[j]; }
      vAt[j] = v;
    });
    return { se: se, vAt: vAt };
  });
  if (stackedArea) lineList.reverse();   /* верхний слой рисуется первым, чтобы не перекрыть нижние */

  lineList.forEach(function (item) {
    var se = item.se, vAt = item.vAt;
    var g = s('g', { class: 'chart__ser', 'data-id': se.id });
    g.style.setProperty('--chart-c', se.color);
    var cx = function (k) { return horiz ? vPos(vAt[idx[k]]) : bandPos(k) + bandFull / 2; };
    var cy = function (k) { return horiz ? bandPos(k) + bandFull / 2 : vPos(vAt[idx[k]]); };
    var runs = [], cur = [];
    idx.forEach(function (j, k) {
      if (se.data[j] == null) { if (cur.length) { runs.push(cur); cur = []; } return; }
      cur.push(k);
    });
    if (cur.length) runs.push(cur);

    runs.forEach(function (run) {
      var solid = [], dash = [];
      run.forEach(function (k) {
        var isF = se.forecastFrom != null && idx[k] >= se.forecastFrom;
        (isF ? dash : solid).push(k);
        if (isF && solid.length && dash.length === 1) dash.unshift(solid[solid.length - 1]);
      });
      [[solid, false], [dash, true]].forEach(function (pair) {
        var pts = pair[0]; if (pts.length < 1) return;
        var d = pts.map(function (k, m) { return (m ? 'L' : 'M') + cx(k).toFixed(1) + ' ' + cy(k).toFixed(1); }).join(' ');
        if (se.kind === 'area' && !pair[1]) {
          var area = s('path', { class: 'chart__area', d: d + ' L' + cx(pts[pts.length - 1]).toFixed(1) + ' ' + vPos(Math.max(scale.min, 0)) + ' L' + cx(pts[0]).toFixed(1) + ' ' + vPos(Math.max(scale.min, 0)) + ' Z' });
          g.appendChild(area);
        }
        if (pts.length === 1) {
          var dot1 = s('circle', { class: 'chart__dot chart__dot--solid', cx: cx(pts[0]), cy: cy(pts[0]), r: 3.5 });
          g.appendChild(dot1);
          return;
        }
        var p = s('path', { class: 'chart__line' + (pair[1] || se.dashed ? ' chart__line--dashed' : ''), d: d });
        g.appendChild(p);
      });
      if (run.length && runs.length > 1) {
        /* разрыв ряда: точки на краях сегмента подчёркивают пропуск */
        [run[0], run[run.length - 1]].forEach(function (k) {
          var dt = s('circle', { class: 'chart__dot', cx: cx(k), cy: cy(k), r: 3.5 });
          g.appendChild(dt);
        });
      }
    });
    if (cfg.dots !== false && idx.length <= 32) idx.forEach(function (j, k) {
      if (se.data[j] == null) return;
      var dt = s('circle', { class: 'chart__dot', cx: cx(k), cy: cy(k), r: 3.5, 'data-i': j });
      g.appendChild(dt);
    });
    if (cfg.valueLabels) idx.forEach(function (j, k) {
      if (se.data[j] == null) return;
      gLab.appendChild(s('text', { class: 'chart__vlabel', x: cx(k), y: cy(k) - 9, 'text-anchor': 'middle' }, fmtV(num(se.data[j]))));
    });
    gSer.appendChild(g);
  });
  /* --- опорная линия --- */
  if (cfg.refLine) {
    var rp = Math.round(vPos(cfg.refLine.value)) + .5;
    gLab.appendChild(horiz ? s('line', { class: 'chart__ref', x1: rp, x2: rp, y1: y0, y2: y1 })
      : s('line', { class: 'chart__ref', x1: x0, x2: x1, y1: rp, y2: rp }));
    if (cfg.refLine.label) {
      var lw = textW(svg, cfg.refLine.label) + 8;
      if (horiz) {
        gLab.appendChild(s('rect', { x: rp + 2, y: y0 - 1, width: lw, height: 16, fill: 'var(--bg-tile)' }));
        gLab.appendChild(s('text', { class: 'chart__ref-label', x: rp + 6, y: y0 + 11 }, cfg.refLine.label));
      } else {
        gLab.appendChild(s('rect', { x: x1 - lw, y: rp - 16, width: lw, height: 15, fill: 'var(--bg-tile)' }));
        gLab.appendChild(s('text', { class: 'chart__ref-label', x: x1 - 4, y: rp - 5, 'text-anchor': 'end' }, cfg.refLine.label));
      }
    }
  }

  /* --- зоны наведения --- */
  if (cfg.tooltip || cfg.crosshair) idx.forEach(function (j, k) {
    var geom = {
      'data-i': j,
      x: horiz ? x0 : bandPos(k), y: horiz ? bandPos(k) : y0,
      width: horiz ? (x1 - x0) : bandFull, height: horiz ? bandFull : (y1 - y0)
    };
    gBand.appendChild(s('rect', Object.assign({ class: 'chart__band' }, geom)));
    gHit.appendChild(s('rect', Object.assign({ class: 'chart__hit' }, geom)));
  });

  svg.appendChild(gGrid); svg.appendChild(gBand); svg.appendChild(gSer); svg.appendChild(gAxis); svg.appendChild(gLab); svg.appendChild(gHit);
  svg.setAttribute('aria-label', ariaSummary(inst, series, cats, idx));
  bindHover(inst, { horiz: horiz, series: series, cats: cats, idx: idx, bandPos: bandPos, bandFull: bandFull, vPos: vPos, fmtV: fmtV, y0: y0, y1: y1, pct: pct });
  if (inst.brush) syncBrushWindow(inst);
}

function num(v) { return v == null ? 0 : (typeof v === 'object' ? +v.y : +v); }

/* штриховка прогноза */
function hatch(inst, color) {
  var svg = inst.svg;
  var id = 'hatch-' + Math.abs(hashCode(color));
  if (!svg.querySelector('#' + id)) {
    var defs = svg.querySelector('defs') || svg.insertBefore(s('defs'), svg.firstChild);
    var p = s('pattern', { id: id, width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' });
    var bg = s('rect', { width: 6, height: 6, opacity: .28 }); bg.setAttribute('fill', color);
    var ln = s('rect', { width: 3, height: 6 }); ln.setAttribute('fill', color);
    p.appendChild(bg); p.appendChild(ln); defs.appendChild(p);
  }
  return 'url(#' + id + ')';
}
function hashCode(str) { var h = 0; for (var i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0; return h; }

/* ---------- круговой / кольцевой ---------- */
function drawPie(inst, series, W, H) {
  var cfg = inst.cfg, svg = inst.svg;
  inst.hiddenSlice = inst.hiddenSlice || {};
  var all = (series[0].data || []).map(function (v, i) {
    return { i: i, v: Math.abs(num(v)), name: cfg.categories[i] || 'Позиция ' + (i + 1), color: tokenColor(inst.palette[i % inst.palette.length]) };
  }).filter(function (d) { return d.v > 0; });
  var data = all.filter(function (d) { return !inst.hiddenSlice[d.i]; });
  if (!data.length) data = all.slice(0, 1);
  var total = data.reduce(function (a, d) { return a + d.v; }, 0) || 1;
  var cx = W / 2, cy = H / 2, R = Math.max(Math.min(W, H) / 2 - 6, 10);
  var inner = cfg.type === 'donut' ? R * (cfg.donutRatio || 0.62) : 0;
  var a0 = -Math.PI / 2;
  var g = s('g', { class: 'chart__ser', 'data-id': series[0].id });
  data.forEach(function (d, i) {
    var a1 = a0 + d.v / total * Math.PI * 2;
    var path = s('path', { class: 'chart__slice', d: arc(cx, cy, R, inner, a0, a1), 'data-i': i });
    path.setAttribute('fill', d.color);
    path.addEventListener('mouseenter', function (e) {
      showTip(inst, [{ color: d.color, name: d.name, val: fmtCompact(d.v) + ' · ' + fmtPercent(d.v / total * 100) }], cfg.title || null, e);
    });
    path.addEventListener('mousemove', function (e) { moveTip(inst, e); });
    path.addEventListener('mouseleave', function () { hideTip(inst); });
    g.appendChild(path);
    a0 = a1;
  });
  svg.appendChild(g);
  if (cfg.centerLabel) {
    svg.appendChild(s('text', { x: cx, y: cy - 2, 'text-anchor': 'middle', class: 'chart__vlabel', style: 'font:var(--type-body-m-strong);fill:var(--text-primary)' }, cfg.centerLabel));
    if (cfg.centerSub) svg.appendChild(s('text', { x: cx, y: cy + 15, 'text-anchor': 'middle', class: 'chart__tick' }, cfg.centerSub));
  }
  if (inst.legend) {
    inst.legend.innerHTML = '';
    all.forEach(function (d) {
      var on = !inst.hiddenSlice[d.i];
      var b = el('button', 'chart__legend-item'); b.type = 'button';
      b.setAttribute('aria-pressed', String(on));
      var mk = el('span', 'chart__marker'); mk.style.setProperty('--chart-c', d.color);
      b.appendChild(mk); b.appendChild(el('span', 'chart__legend-name', d.name));
      b.appendChild(el('span', 'chart__legend-val', on ? fmtPercent(d.v / total * 100) : '—'));
      b.addEventListener('click', function () {
        if (on && data.length === 1) return;      /* последний видимый сектор не выключаем */
        inst.hiddenSlice[d.i] = on;
        draw(inst);
      });
      inst.legend.appendChild(b);
    });
  }
  svg.setAttribute('aria-label', (cfg.title || 'Круговой график') + ': ' + data.map(function (d) {
    return d.name + ' ' + fmtPercent(d.v / total * 100);
  }).join(', '));
}
function arc(cx, cy, R, r, a0, a1) {
  var large = (a1 - a0) > Math.PI ? 1 : 0;
  var p = function (rad, a) { return [cx + rad * Math.cos(a), cy + rad * Math.sin(a)]; };
  var A = p(R, a0), B = p(R, a1), C = p(r, a1), D = p(r, a0);
  if (!r) return 'M' + cx + ' ' + cy + ' L' + A + ' A' + R + ' ' + R + ' 0 ' + large + ' 1 ' + B + ' Z';
  return 'M' + A + ' A' + R + ' ' + R + ' 0 ' + large + ' 1 ' + B + ' L' + C + ' A' + r + ' ' + r + ' 0 ' + large + ' 0 ' + D + ' Z';
}

/* ---------- точечный ---------- */
function drawScatter(inst, series, W, H) {
  var cfg = inst.cfg, svg = inst.svg;
  var xs = [], ys = [];
  series.forEach(function (se) {
    se.data.forEach(function (p) { if (!p) return; xs.push(+p.x); ys.push(+p.y); });
  });
  var sx = niceTicks(Math.min.apply(null, xs), Math.max.apply(null, xs), 4);
  var sy = niceTicks(Math.min.apply(null, ys), Math.max.apply(null, ys), cfg.yTicks);
  var fmtV = function (v) { return cfg.format === 'full' ? fmtNumber(v, 0, 2) : fmtCompact(v); };
  var valW = 0; sy.ticks.forEach(function (t) { valW = Math.max(valW, textW(svg, fmtV(t))); });
  var pad = { t: 10, r: 12, b: 22, l: valW + 10 };
  var x0 = pad.l, x1 = W - pad.r, y0 = pad.t, y1 = H - pad.b;
  var X = function (v) { return x0 + (v - sx.min) / (sx.max - sx.min) * (x1 - x0); };
  var Y = function (v) { return y1 - (v - sy.min) / (sy.max - sy.min) * (y1 - y0); };
  var gGrid = s('g', { class: 'chart__grid' }), gAxis = s('g', { class: 'chart__axis' }), gSer = s('g');
  sy.ticks.forEach(function (t) {
    var p = Math.round(Y(t)) + .5;
    gGrid.appendChild(s('line', { x1: x0, x2: x1, y1: p, y2: p, class: t === 0 ? 'chart__zero' : null }));
    gAxis.appendChild(s('text', { x: x0 - 8, y: p + 4, 'text-anchor': 'end' }, fmtV(t)));
  });
  sx.ticks.forEach(function (t) {
    var p = Math.round(X(t)) + .5;
    gGrid.appendChild(s('line', { x1: p, x2: p, y1: y0, y2: y1 }));
    gAxis.appendChild(s('text', { x: p, y: y1 + 15, 'text-anchor': 'middle' }, fmtV(t)));
  });
  series.forEach(function (se) {
    var g = s('g', { class: 'chart__ser', 'data-id': se.id });
    g.style.setProperty('--chart-c', se.color);
    se.data.forEach(function (p) {
      if (!p) return;
      var dot = s('circle', { class: 'chart__dot chart__dot--solid', cx: X(+p.x), cy: Y(+p.y), r: p.r || 4.5 });
      dot.addEventListener('mouseenter', function (e) {
        showTip(inst, [{ color: se.color, name: se.name, val: fmtV(+p.x) + ' / ' + fmtV(+p.y) }], p.name || se.name, e);
      });
      dot.addEventListener('mousemove', function (e) { moveTip(inst, e); });
      dot.addEventListener('mouseleave', function () { hideTip(inst); });
      g.appendChild(dot);
    });
    gSer.appendChild(g);
  });
  svg.appendChild(gGrid); svg.appendChild(gSer); svg.appendChild(gAxis);
  svg.setAttribute('aria-label', (cfg.title || 'Точечный график') + ': ' + xs.length + ' наблюдений');
}

/* ---------- спарклайн ---------- */
function drawSpark(inst, series, W, H) {
  var cfg = inst.cfg, svg = inst.svg, se = series[0];
  var vals = se.data.map(num);
  var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
  if (hi === lo) { hi = lo + 1; }
  var pad = 3, y0 = pad, y1 = H - pad;
  var Y = function (v) { return y1 - (v - lo) / (hi - lo) * (y1 - y0); };
  var color = se.color;
  if (cfg.tone === 'auto') color = vals[vals.length - 1] >= vals[0] ? 'var(--success)' : 'var(--error)';
  if (cfg.spark === 'bar') {
    var bw = W / vals.length;
    vals.forEach(function (v, i) {
      var r = s('rect', { class: 'chart__bar', x: i * bw + bw * .15, width: Math.max(bw * .7, 1), y: Y(v), height: Math.max(y1 - Y(v), 1) });
      r.style.setProperty('--chart-c', color);
      svg.appendChild(r);
    });
  } else {
    var d = vals.map(function (v, i) {
      return (i ? 'L' : 'M') + (i / (vals.length - 1) * (W - 4) + 2).toFixed(1) + ' ' + Y(v).toFixed(1);
    }).join(' ');
    if (cfg.spark === 'area') {
      var a = s('path', { class: 'chart__area', d: d + ' L' + (W - 2) + ' ' + y1 + ' L2 ' + y1 + ' Z' });
      a.style.setProperty('--chart-c', color); svg.appendChild(a);
    }
    var p = s('path', { class: 'chart__line', d: d, style: '--chart-line-w:1.5' });
    p.style.setProperty('--chart-c', color);
    svg.appendChild(p);
    var last = s('circle', { class: 'chart__spark-dot', cx: W - 2, cy: Y(vals[vals.length - 1]), r: 2.5 });
    last.style.setProperty('--chart-c', color);
    svg.appendChild(last);
  }
  svg.setAttribute('aria-label', cfg.ariaLabel || ('Динамика: ' + fmtCompact(vals[0]) + ' → ' + fmtCompact(vals[vals.length - 1])));
}

/* ---------- наведение: курсор + тултип ---------- */
function bindHover(inst, ctx) {
  var cfg = inst.cfg;
  if (!cfg.tooltip && !cfg.crosshair) return;
  var svg = inst.svg;
  if (inst.unbind) inst.unbind();
  function at(e) {
    var box = svg.getBoundingClientRect();
    var pos = ctx.horiz ? e.clientY - box.top : e.clientX - box.left;
    var k = Math.floor((pos - (ctx.horiz ? ctx.bandPos(0) : ctx.bandPos(0))) / ctx.bandFull);
    return Math.max(0, Math.min(ctx.idx.length - 1, k));
  }
  function onMove(e) {
    var k = at(e), j = ctx.idx[k];
    svg.querySelectorAll('.chart__band').forEach(function (r) { r.classList.toggle('is-active', +r.dataset.i === j); });
    if (inst.cursor && !ctx.horiz) {
      inst.cursor.style.left = (ctx.bandPos(k) + ctx.bandFull / 2) + 'px';
      inst.cursor.style.height = (ctx.y1 - ctx.y0) + 'px';
      inst.cursor.style.top = ctx.y0 + 'px';
      inst.cursor.classList.add('is-visible');
    }
    if (cfg.tooltip) {
      var rows = ctx.series.map(function (se) {
        var v = se.data[j];
        return { color: se.color, name: se.name, val: v == null ? 'нет данных' : ctx.fmtV(num(v)) };
      });
      var total = ctx.series.reduce(function (a, se) { return a + num(se.data[j]); }, 0);
      showTip(inst, rows, String(ctx.cats[j] == null ? '' : ctx.cats[j]), e,
        ctx.series.length > 1 && !ctx.pct ? { name: 'Итого', val: ctx.fmtV(total) } : null);
    }
  }
  function onLeave() {
    hideTip(inst);
    if (inst.cursor) inst.cursor.classList.remove('is-visible');
    svg.querySelectorAll('.chart__band').forEach(function (r) { r.classList.remove('is-active'); });
  }
  svg.addEventListener('mousemove', onMove);
  svg.addEventListener('mouseleave', onLeave);
  inst.unbind = function () {
    svg.removeEventListener('mousemove', onMove);
    svg.removeEventListener('mouseleave', onLeave);
  };
}
function showTip(inst, rows, title, e, total) {
  var tip = inst.tip; if (!tip) return;
  tip.innerHTML = '';
  if (title) tip.appendChild(el('span', 'chart__tip-title', title));
  rows.forEach(function (r) {
    var row = el('div', 'chart__tip-row');
    var mk = el('span', 'chart__marker'); mk.style.setProperty('--chart-c', r.color);
    row.appendChild(mk);
    row.appendChild(el('span', 'chart__tip-name', r.name));
    row.appendChild(el('span', 'chart__tip-val', r.val));
    tip.appendChild(row);
  });
  if (total) {
    var t = el('div', 'chart__tip-row chart__tip-total');
    t.appendChild(el('span'));
    t.appendChild(el('span', 'chart__tip-name', total.name));
    t.appendChild(el('span', 'chart__tip-val', total.val));
    tip.appendChild(t);
  }
  tip.style.display = '';
  tip.classList.add('is-visible');
  moveTip(inst, e);
}
function moveTip(inst, e) {
  var tip = inst.tip; if (!tip) return;
  var box = inst.plot.getBoundingClientRect();
  var x = e.clientX - box.left + 14, y = e.clientY - box.top + 14;
  var w = tip.offsetWidth, h = tip.offsetHeight;
  if (x + w > box.width) x = Math.max(0, e.clientX - box.left - w - 14);
  if (y + h > box.height) y = Math.max(0, y - h - 28);
  tip.style.left = Math.round(x) + 'px';
  tip.style.top = Math.round(y) + 'px';
}
function hideTip(inst) {
  if (!inst.tip) return;
  inst.tip.classList.remove('is-visible');
  inst.tip.style.display = 'none';
}

/* ---------- краткое описание для скринридера ---------- */
function ariaSummary(inst, series, cats, idx) {
  var cfg = inst.cfg;
  var head = (cfg.title || 'График') + ', тип: ' + cfg.type + '. ';
  return head + series.map(function (se) {
    var first = se.data[idx[0]], last = se.data[idx[idx.length - 1]];
    return se.name + ': от ' + fmtCompact(num(first)) + ' (' + cats[idx[0]] + ') до ' + fmtCompact(num(last)) + ' (' + cats[idx[idx.length - 1]] + ')';
  }).join('; ');
}

/* ---------- brush ---------- */
function buildBrush(inst) {
  var box = el('div', 'chart__brush');
  var svg = s('svg', { class: 'chart__brush-svg' });
  var win = el('div', 'chart__brush-window');
  win.appendChild(el('span', 'chart__brush-handle chart__brush-handle--l'));
  win.appendChild(el('span', 'chart__brush-handle chart__brush-handle--r'));
  box.appendChild(svg); box.appendChild(win);
  inst.root.appendChild(box);
  inst.brush = { box: box, svg: svg, win: win };
  var n = inst.cfg.categories.length;
  inst.range = inst.cfg.initialRange || [0, n - 1];

  function drawMini() {
    var W = box.clientWidth, H = 36;
    if (!W) return;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.innerHTML = '';
    var se = inst.cfg.series[0] || { data: [] };
    var vals = (se.data || []).map(num);
    var hi = Math.max.apply(null, vals.concat([0])) || 1;
    var bw = W / Math.max(vals.length, 1);
    var r = inst.range || [0, vals.length - 1];
    vals.forEach(function (v, i) {
      var inWin = i >= r[0] && i <= r[1];
      svg.appendChild(s('rect', {
        class: 'chart__brush-spark' + (inWin ? ' is-active' : ''),
        x: i * bw + bw * .2, width: Math.max(bw * .6, 1),
        y: H - 4 - (v / hi) * (H - 8), height: Math.max((v / hi) * (H - 8), 1)
      }));
    });
  }
  inst.brush = inst.brush || {};
  inst.brushDraw = drawMini;
  if (global.ResizeObserver) new ResizeObserver(function () { drawMini(); syncBrushWindow(inst); }).observe(box);
  var t = 0;
  (function attempt() {
    if (box.clientWidth) { drawMini(); syncBrushWindow(inst); return; }
    if (t++ < 60) setTimeout(attempt, 32);
  })();

  var drag = null;
  box.addEventListener('pointerdown', function (e) {
    var W = box.clientWidth, unit = W / n;
    var target = e.target.classList.contains('chart__brush-handle')
      ? (e.target.classList.contains('chart__brush-handle--l') ? 'l' : 'r')
      : (e.target === win ? 'move' : 'set');
    var x = e.clientX - box.getBoundingClientRect().left;
    if (target === 'set') {
      var c = Math.round(x / unit), half = Math.max(Math.round((inst.range[1] - inst.range[0]) / 2), 1);
      setRange(inst, c - half, c + half, n);
    }
    drag = { mode: target, x: x, r0: inst.range.slice(), unit: unit };
    box.setPointerCapture(e.pointerId);
  });
  box.addEventListener('pointermove', function (e) {
    if (!drag) return;
    var x = e.clientX - box.getBoundingClientRect().left;
    var d = Math.round((x - drag.x) / drag.unit);
    if (drag.mode === 'l') setRange(inst, drag.r0[0] + d, drag.r0[1], n);
    else if (drag.mode === 'r') setRange(inst, drag.r0[0], drag.r0[1] + d, n);
    else if (drag.mode === 'move' || drag.mode === 'set') setRange(inst, drag.r0[0] + d, drag.r0[1] + d, n);
  });
  box.addEventListener('pointerup', function () { drag = null; });
  box.addEventListener('dblclick', function () { setRange(inst, 0, n - 1, n); });
}
function setRange(inst, a, b, n) {
  a = Math.max(0, Math.min(a, n - 2)); b = Math.min(n - 1, Math.max(b, a + 1));
  inst.range = [a, b];
  draw(inst);
}
function syncBrushWindow(inst) {
  if (!inst.brush) return;
  if (inst.brushDraw) inst.brushDraw();
  var n = inst.cfg.categories.length, W = inst.brush.box.clientWidth, unit = W / n;
  inst.brush.win.style.left = (inst.range[0] * unit) + 'px';
  inst.brush.win.style.width = ((inst.range[1] - inst.range[0] + 1) * unit) + 'px';
}

global.DSChart = {
  make: make,
  _draw: draw,
  palette: PALETTE,
  fmt: { number: fmtNumber, compact: fmtCompact, percent: fmtPercent }
};
})(window);
