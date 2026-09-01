/* =========================================================================
   AllocationBar — рантайм-референс компонента + логика страницы документации.
   Публичное API: window.AllocationBar
     .make(cfg) → DOM-узел .albar-host
     .palette   → 12 токенов --chart-* в порядке назначения
     .fmtNumber / .fmtPercent / .fmtCompact — форматтеры ru-RU
   ========================================================================= */
(function (global) {
'use strict';

/* Палитра — порядок назначения совпадает с порядком в colors.css */
var PALETTE = [
  '--chart-red', '--chart-orange', '--chart-yellow', '--chart-shiny-green',
  '--chart-pastel-green', '--chart-turquoise', '--chart-light-blue', '--chart-blue',
  '--chart-indigo', '--chart-purple', '--chart-pale-purple', '--chart-pink-purple'
];

/* ---------- форматирование чисел (ru-RU) ---------- */
function fmtNumber(n, min, max) {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: min == null ? 0 : min,
    maximumFractionDigits: max == null ? 2 : max
  }).format(n);
}
function fmtPercent(p) { return fmtNumber(p, 2, 2) + '%'; }
function fmtCompact(n) {
  var a = Math.abs(n);
  if (a >= 1e9) return fmtNumber(n / 1e9, 0, 1) + ' млрд';
  if (a >= 1e6) return fmtNumber(n / 1e6, 0, 1) + ' млн';
  if (a >= 1e4) return fmtNumber(n / 1e3, 0, 1) + ' тыс.';
  return fmtNumber(n);
}

function el(tag, cls, txt) {
  var e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt != null) e.textContent = txt;
  return e;
}
function icons(root) { if (global.dsIcons) global.dsIcons.apply(root); }

/* ---------- Alert ДС как подвал компонента ---------- */
var ALERT_GLYPH = {
  info: 'Info-circle-filled', warning: 'alert-triangle-filled',
  error: 'alert-circle-filled', success: 'check-circle-filled'
};
function makeAlert(tone, html, actionLabel) {
  var a = el('div', 'alert alert--' + tone + ' alert--m');
  a.dataset.alertTone = tone;
  a.setAttribute('role', tone === 'error' || tone === 'warning' ? 'alert' : 'status');
  a.setAttribute('aria-live', tone === 'error' || tone === 'warning' ? 'assertive' : 'polite');
  var ico = el('span', 'alert__icon'); ico.setAttribute('aria-hidden', 'true');
  ico.innerHTML = '<i data-icon="' + ALERT_GLYPH[tone] + '"></i>';
  var body = el('div', 'alert__body');
  var p = el('p', 'alert__text'); p.innerHTML = html; body.appendChild(p);
  if (actionLabel) {
    var btns = el('div', 'alert__buttons');
    var b = el('button', 'btn btn--outline btn--xs btn--' + tone);
    b.type = 'button';
    b.appendChild(el('span', 'btn__label', actionLabel));
    btns.appendChild(b); body.appendChild(btns);
  }
  a.appendChild(ico); a.appendChild(body);
  return a;
}

/* ---------- шапка ---------- */
function buildHead(cfg, totalNode) {
  var head = el('div', 'albar__head');
  var titles = el('div', 'albar__titles');
  var lab = el('div', 'albar__label', cfg.label || '');
  if (cfg.label) lab.title = cfg.label;
  titles.appendChild(lab);
  if (cfg.sublabel) titles.appendChild(el('div', 'albar__sublabel', cfg.sublabel));
  head.appendChild(titles);
  if (cfg.warning) {
    var w = el('span', 'albar__warn');
    w.setAttribute('aria-hidden', 'true');
    w.title = cfg.warning;
    w.innerHTML = '<i data-icon="alert-triangle-filled"></i>';
    head.appendChild(w);
  }
  if (totalNode) head.appendChild(totalNode);
  return head;
}
function buildTotal(cfg) {
  var t = el('div', 'albar__total');
  t.appendChild(el('span', null, cfg.format === 'compact'
    ? fmtCompact(cfg.total)
    : fmtNumber(cfg.total, 2, 2)));
  if (cfg.unit) t.appendChild(el('span', 'albar__unit', cfg.unit));
  return t;
}

/* ---------- основной рендер ---------- */
function make(cfg) {
  cfg = cfg || {};
  var host = el('div', 'albar-host');
  var root = el('div', 'albar' + (cfg.stretch ? ' albar--stretch' : ''));
  host.appendChild(root);
  if (cfg.heightVariant) host.dataset.height = cfg.heightVariant;
  if (cfg.maxWidth) root.style.setProperty('--albar-max-w', cfg.maxWidth);

  var status = cfg.status || 'loaded';
  var raw = cfg.items || [];

  if (status === 'loading') { renderLoading(root, cfg); icons(root); return host; }
  if (status === 'error') {
    root.appendChild(buildHead(cfg, null));
    var fe = el('div', 'albar__foot');
    fe.appendChild(makeAlert('error', cfg.errorMessage || 'Не удалось загрузить данные', cfg.onRetryLabel || 'Повторить'));
    root.appendChild(fe); icons(root); return host;
  }
  var allZero = raw.length > 0 && raw.every(function (i) { return !i.value; });
  if (status === 'empty' || raw.length === 0 || allZero) {
    var te = el('div', 'albar__total albar__total--empty', '—');
    root.appendChild(buildHead(cfg, te));
    root.appendChild(el('div', 'albar__empty', cfg.emptyMessage || 'Нет данных'));
    icons(root); return host;
  }

  root.appendChild(buildHead(cfg, buildTotal(cfg)));

  var items = raw.map(function (it, i) {
    return {
      id: it.id || 'i' + i,
      label: it.label,
      value: it.value,
      percent: it.percent != null ? it.percent : (cfg.total > 0 ? (it.value / cfg.total) * 100 : 0),
      color: it.color ? ('var(' + it.color + ')') : ('var(' + PALETTE[i % PALETTE.length] + ')')
    };
  });
  var sum = items.reduce(function (a, b) { return a + b.percent; }, 0);
  var partial = sum < 99.5, overflow = sum > 100.5;

  if (cfg.showProgressBar !== false && cfg.total > 0) {
    var bar = el('div', 'albar__bar');
    bar.setAttribute('role', 'img');
    bar.setAttribute('aria-label', 'Распределение: ' + items.map(function (i) {
      return i.label + ' ' + fmtPercent(i.percent);
    }).join(', '));
    items.forEach(function (it) {
      var s = el('div', 'albar__seg');
      s.style.background = it.color;
      s.style.flexGrow = String(Math.max(it.percent, 0));
      s.dataset.id = it.id;
      s.title = it.label + ' · ' + fmtPercent(it.percent);
      bar.appendChild(s);
    });
    if (partial) {
      var rest = el('div', 'albar__seg albar__seg--rest');
      rest.style.flexGrow = String(100 - sum);
      bar.appendChild(rest);
    }
    root.appendChild(bar);
  }

  var list = el('div', 'albar__list');
  var max = cfg.maxVisibleItems || 5;
  var collapsed = items.length > max && !cfg.expanded;
  (collapsed ? items.slice(0, max) : items).forEach(function (it) {
    var row = el('div', 'albar__row');
    row.dataset.id = it.id;
    var dot = el('span', 'albar__dot');
    dot.style.background = it.color;
    row.appendChild(dot);
    var nm = el('span', 'albar__name', it.label); nm.title = it.label;
    row.appendChild(nm);
    if (cfg.showPercent !== false) row.appendChild(el('span', 'albar__pct', fmtPercent(it.percent)));
    row.appendChild(el('span', 'albar__val', fmtNumber(it.value, 2, 2)));
    list.appendChild(row);
  });
  root.appendChild(list);

  if (collapsed) {
    var more = el('button', 'btn btn--transparent btn--xs albar__more');
    more.type = 'button';
    more.appendChild(el('span', 'btn__label', 'Показать ещё ' + (items.length - max)));
    more.addEventListener('click', function () {
      var next = make(Object.assign({}, cfg, { expanded: true }));
      host.replaceWith(next);
    });
    root.appendChild(more);
  }

  if (overflow || partial) {
    var f = el('div', 'albar__foot');
    f.appendChild(overflow
      ? makeAlert('error', 'Сумма позиций превышает итог на <b>' + fmtPercent(sum - 100) + '</b> — проверьте данные')
      : makeAlert('warning', 'Учтено <b>' + fmtPercent(sum) + '</b> от итога, остаток <b>' + fmtPercent(100 - sum) + '</b> не распределён'));
    root.appendChild(f);
  }

  bindHover(root);
  if ('ResizeObserver' in global) {
    var ro = new ResizeObserver(function () { enforceMinSegments(root); });
    ro.observe(root);
    requestAnimationFrame(function () { enforceMinSegments(root); });
  }
  icons(root);
  return host;
}

function renderLoading(root, cfg) {
  var head = buildHead(cfg, null);
  head.appendChild(el('div', 'albar__sk albar__sk--total'));
  root.appendChild(head);
  root.appendChild(el('div', 'albar__sk albar__sk--bar'));
  if (cfg.loadingVariant === 'slow') {
    var box = el('div', 'albar__calc');
    box.appendChild(el('div', 'albar__calc-title', 'Данные рассчитываются'));
    box.appendChild(el('div', 'albar__calc-sub', 'Это может занять несколько секунд'));
    root.appendChild(box);
  } else {
    var list = el('div', 'albar__list');
    for (var i = 0; i < 3; i++) {
      var row = el('div', 'albar__row albar__row--sk');
      row.appendChild(el('span', 'albar__dot albar__dot--sk'));
      row.appendChild(el('span', 'albar__sk albar__sk--name'));
      row.appendChild(el('span', 'albar__sk albar__sk--num'));
      list.appendChild(row);
    }
    root.appendChild(list);
  }
}

function bindHover(root) {
  var bar = root.querySelector('.albar__bar');
  if (!bar) return;
  var rows = root.querySelectorAll('.albar__row');
  var segs = bar.querySelectorAll('.albar__seg[data-id]');
  function setActive(id) {
    if (id) root.dataset.hover = id; else delete root.dataset.hover;
    rows.forEach(function (r) { r.classList.toggle('is-active', r.dataset.id === id); });
    segs.forEach(function (s) { s.classList.toggle('is-active', s.dataset.id === id); });
  }
  function bind(n) {
    n.addEventListener('mouseenter', function () { setActive(n.dataset.id); });
    n.addEventListener('mouseleave', function () { setActive(null); });
  }
  rows.forEach(bind); segs.forEach(bind);
}

/* Сегмент тоньше 2px не читается: добиваем до 2px, остаток делим пропорционально */
function enforceMinSegments(root) {
  var bar = root.querySelector('.albar__bar');
  if (!bar) return;
  var segs = Array.prototype.slice.call(bar.children);
  var w = bar.clientWidth;
  if (!w) return;
  var MIN = 2;
  var total = segs.reduce(function (a, s) { return a + parseFloat(s.dataset.grow || s.style.flexGrow || '0'); }, 0);
  if (!total) return;
  var usedPx = 0, usedShare = 0;
  segs.forEach(function (s) {
    if (!s.dataset.grow) s.dataset.grow = s.style.flexGrow || '0';
    var share = parseFloat(s.dataset.grow) / total;
    if (share * w < MIN) { usedPx += MIN; usedShare += share; }
  });
  var remaining = Math.max(w - usedPx, 0), remainingShare = 1 - usedShare;
  segs.forEach(function (s) {
    var share = parseFloat(s.dataset.grow) / total;
    if (share * w < MIN) { s.style.flexBasis = MIN + 'px'; s.style.flexGrow = '0'; }
    else { s.style.flexBasis = '0'; s.style.flexGrow = String((share / (remainingShare || 1)) * remaining); }
  });
}

global.AllocationBar = {
  make: make, palette: PALETTE,
  fmtNumber: fmtNumber, fmtPercent: fmtPercent, fmtCompact: fmtCompact
};
})(window);

/* =========================================================================
   Страница документации
   ========================================================================= */
(function () {
'use strict';
var AB = window.AllocationBar;
var LABEL = 'ВБС по сделке на 25.02.2026, руб.';

/* доменный маппинг из продукта: позиция → токен палитры */
var DOMAIN = {
  'Кредит': '--chart-indigo',
  'Фондирующий кредит': '--chart-pastel-green',
  'Внутригрупповой кредит': '--chart-blue',
  'РЕПО': '--chart-light-blue',
  'Акции': '--chart-shiny-green',
  'Облигации': '--chart-turquoise',
  'Корп. контроль': '--chart-red',
  'Доп. доходность': '--chart-orange',
  'Комиссия': '--chart-yellow',
  'Дебиторская задолженность': '--chart-purple'
};
function di(label, value, percent) {
  return { id: label, label: label, value: value, percent: percent, color: DOMAIN[label] };
}
var TOTAL = 1000000000;
function base(n) {
  var sets = [
    [di('Кредит', 1000000000, 100)],
    [di('Кредит', 600000000, 60), di('Акции', 400000000, 40)],
    [di('Кредит', 350000000, 35), di('Акции', 350000000, 35), di('РЕПО', 300000000, 30)],
    [di('Кредит', 350000000, 35), di('Акции', 350000000, 35), di('РЕПО', 150000000, 15), di('Корп. контроль', 150000000, 15)],
    [di('Кредит', 350000000, 35), di('Акции', 350000000, 35), di('РЕПО', 100000000, 10), di('Корп. контроль', 100000000, 10), di('Комиссия', 100000000, 10)],
    [di('Кредит', 250000000, 25), di('Акции', 200000000, 20), di('РЕПО', 150000000, 15), di('Корп. контроль', 120000000, 12), di('Комиссия', 100000000, 10),
     di('Облигации', 80000000, 8), di('Доп. доходность', 60000000, 6), di('Дебиторская задолженность', 40000000, 4)]
  ];
  return sets[n];
}
function cfg(over) {
  return Object.assign({ label: LABEL, total: TOTAL, status: 'loaded', items: base(2) }, over || {});
}
function mount(id, c) {
  var box = document.getElementById(id);
  if (box) box.appendChild(AB.make(c));
}

function initExamples() {
  /* Использование — компонент в плитке */
  mount('use-tile', cfg());
  mount('use-modal', cfg({ items: base(4) }));

  /* Анатомия */
  mount('anat-stage', cfg({ items: base(3) }));

  /* Варианты — режимы */
  mount('var-full', cfg());
  mount('var-no-pct', cfg({ showPercent: false }));
  mount('var-no-bar', cfg({ showProgressBar: false }));
  mount('var-min', cfg({ showPercent: false, showProgressBar: false }));

  /* Варианты — количество позиций */
  mount('var-c1', cfg({ items: base(0) }));
  mount('var-c2', cfg({ items: base(1) }));
  mount('var-c3', cfg({ items: base(2) }));
  mount('var-c5', cfg({ items: base(4) }));
  mount('var-c8', cfg({ items: base(5) }));

  /* Размеры — контейнерные брейкпоинты */
  mount('size-wide', cfg({ items: base(3) }));
  mount('size-mid', cfg({ items: base(3) }));
  mount('size-narrow', cfg({ items: base(3) }));
  mount('size-tiny', cfg({ items: base(3) }));

  /* Контент */
  mount('cnt-long', cfg({
    sublabel: 'Расчёт по методике 2024-Р с учётом обеспечения и переоценки портфеля',
    items: base(2)
  }));
  mount('cnt-big', cfg({ total: 1500000000, format: 'compact', items: base(2) }));
  mount('cnt-mixed', cfg({
    items: [di('Дебиторская задолженность', 350000000, 35), di('РЕПО', 350000000, 35), di('Внутригрупповой кредит', 300000000, 30)]
  }));

  /* Поведение */
  mount('beh-hover', cfg({ items: base(2) }));
  mount('beh-tiny-seg', cfg({
    items: [di('Кредит', 997000000, 99.7), di('Акции', 2000000, 0.2), di('Комиссия', 1000000, 0.1)]
  }));
  mount('beh-h-a', cfg({ items: base(5), maxVisibleItems: 8, heightVariant: 'A' }));
  mount('beh-h-b', cfg({ items: base(5), heightVariant: 'B' }));
  mount('beh-h-c', cfg({ items: base(5), heightVariant: 'C' }));
  mount('beh-stretch', cfg({ items: base(2), stretch: true }));

  /* Состояния */
  mount('st-loaded', cfg());
  mount('st-loading', cfg({ status: 'loading' }));
  mount('st-loading-slow', cfg({ status: 'loading', loadingVariant: 'slow' }));
  mount('st-error', cfg({ status: 'error' }));
  mount('st-empty', cfg({ status: 'empty', items: [] }));
  mount('st-partial', cfg({
    items: [di('Кредит', 250000000, 25), di('Акции', 250000000, 25), di('РЕПО', 250000000, 25)]
  }));
  mount('st-overflow', cfg({
    items: [di('Кредит', 500000000, 50), di('Акции', 400000000, 40), di('РЕПО', 250000000, 25)]
  }));
  mount('st-zero', cfg({
    items: [di('Кредит', 700000000, 70), di('Акции', 300000000, 30), di('Комиссия', 0, 0)]
  }));
  mount('st-warn', cfg({ warning: 'Просроченная задолженность на сумму 123 млн. руб.', items: base(2) }));

  /* Цвета — все 12 в одном баре */
  var twelve = AB.palette.map(function (tok, i) {
    return { id: 't' + i, label: tok.replace('--chart-', ''), value: TOTAL / 12, percent: 100 / 12, color: tok };
  });
  mount('col-all', cfg({ items: twelve, maxVisibleItems: 12, label: 'Все 12 токенов палитры' }));
}

/* ---------------- КОНСТРУКТОР ---------------- */
function initPlayground() {
  var controls = document.getElementById('pg-controls');
  var stage = document.getElementById('pg-stage');
  if (!controls || !stage) return;

  var state = {
    count: '3', width: '480', status: 'loaded', pct: 'yes', bar: 'yes',
    sum: 'exact', warn: 'no', maxv: '5'
  };
  function ctl(labelText, options, get, set) {
    var wrap = document.createElement('div'); wrap.className = 'ctl';
    var l = document.createElement('div'); l.className = 'lbl'; l.textContent = labelText; wrap.appendChild(l);
    var box = document.createElement('div'); box.className = 'pg-select';
    var sel = document.createElement('select');
    options.forEach(function (o) {
      var op = document.createElement('option');
      op.value = o[0]; op.textContent = o[1];
      if (o[0] === get()) op.selected = true;
      sel.appendChild(op);
    });
    sel.addEventListener('change', function () { set(sel.value); render(); });
    box.appendChild(sel); wrap.appendChild(box); return wrap;
  }

  controls.appendChild(ctl('Позиций', [['1', '1'], ['2', '2'], ['3', '3'], ['5', '5'], ['8', '8']],
    function () { return state.count; }, function (v) { state.count = v; }));
  controls.appendChild(ctl('Ширина контейнера', [['640', '640px — широкий'], ['480', '480px — широкий'], ['400', '400px — средний'], ['280', '280px — узкий'], ['190', '190px — очень узкий']],
    function () { return state.width; }, function (v) { state.width = v; }));
  controls.appendChild(ctl('Состояние', [['loaded', 'Загружено'], ['loading', 'Загрузка'], ['loading-slow', 'Долгий расчёт'], ['error', 'Ошибка'], ['empty', 'Нет данных']],
    function () { return state.status; }, function (v) { state.status = v; }));
  controls.appendChild(ctl('Сумма позиций', [['exact', 'Равна итогу'], ['partial', 'Меньше итога'], ['overflow', 'Больше итога']],
    function () { return state.sum; }, function (v) { state.sum = v; }));
  controls.appendChild(ctl('Проценты', [['yes', 'Показывать'], ['no', 'Скрыть']],
    function () { return state.pct; }, function (v) { state.pct = v; }));
  controls.appendChild(ctl('Прогресс-бар', [['yes', 'Показывать'], ['no', 'Скрыть']],
    function () { return state.bar; }, function (v) { state.bar = v; }));
  controls.appendChild(ctl('Иконка предупреждения', [['no', 'Нет'], ['yes', 'Есть']],
    function () { return state.warn; }, function (v) { state.warn = v; }));
  controls.appendChild(ctl('maxVisibleItems', [['3', '3'], ['5', '5'], ['12', '12']],
    function () { return state.maxv; }, function (v) { state.maxv = v; }));

  function items() {
    var map = { '1': 0, '2': 1, '3': 2, '5': 4, '8': 5 };
    var arr = base(map[state.count]).map(function (i) { return Object.assign({}, i); });
    if (state.sum === 'partial') arr.forEach(function (i) { i.percent = i.percent * 0.75; i.value = i.value * 0.75; });
    if (state.sum === 'overflow') arr.forEach(function (i) { i.percent = i.percent * 1.15; i.value = i.value * 1.15; });
    return arr;
  }
  function render() {
    stage.innerHTML = '';
    var frame = document.createElement('div');
    frame.style.width = state.width + 'px';
    frame.style.maxWidth = '100%';
    frame.style.background = 'var(--bg-tile)';
    frame.style.border = '1px solid var(--border-light)';
    frame.style.borderRadius = 'var(--radius-control)';
    frame.style.padding = '16px';
    frame.appendChild(AB.make({
      label: LABEL,
      total: TOTAL,
      status: state.status === 'loading-slow' ? 'loading' : state.status,
      loadingVariant: state.status === 'loading-slow' ? 'slow' : null,
      items: state.status === 'empty' ? [] : items(),
      showPercent: state.pct === 'yes',
      showProgressBar: state.bar === 'yes',
      warning: state.warn === 'yes' ? 'Просроченная задолженность на сумму 123 млн. руб.' : null,
      maxVisibleItems: parseInt(state.maxv, 10),
      maxWidth: 'none'
    }));
    stage.appendChild(frame);
  }
  render();
}

/* ---------------- REDLINE ---------------- */
function initRedline() {
  var tbody = document.querySelector('#dev-redline');
  if (!tbody) return;
  var probe = document.createElement('div');
  probe.style.cssText = 'position:absolute;left:-9999px;top:0;width:560px';
  probe.appendChild(AB.make(cfg({ items: base(2), unit: 'руб.' })));
  document.body.appendChild(probe);

  try {
  var root = probe.querySelector('.albar');
  var cs = function (sel) {
    var n = probe.querySelector(sel);
    return n ? getComputedStyle(n) : {};
  };
  var rows = [
    ['Зазор между блоками (.albar)', getComputedStyle(root).rowGap],
    ['Максимальная ширина', getComputedStyle(root).maxWidth],
    ['Шапка · зазор', cs('.albar__head').columnGap],
    ['Заголовок (.albar__label)', cs('.albar__label').font],
    ['Итог (.albar__total)', cs('.albar__total').font],
    ['Единица (.albar__unit)', cs('.albar__unit').font],
    ['Бар · высота', cs('.albar__bar').height],
    ['Бар · радиус', cs('.albar__bar').borderRadius],
    ['Бар · зазор сегментов', cs('.albar__bar').columnGap],
    ['Сегмент · минимальная ширина', cs('.albar__seg').minWidth],
    ['Строка · минимальная высота', cs('.albar__row').minHeight],
    ['Строка · паддинг', cs('.albar__row').padding],
    ['Строка · зазор колонок', cs('.albar__row').columnGap],
    ['Строка · шрифт', cs('.albar__name').font],
    ['Маркер (.albar__dot)', cs('.albar__dot').width + ' × ' + cs('.albar__dot').height],
    ['Колонка процентов · min-width', cs('.albar__pct').minWidth],
    ['Колонка значений · min-width', cs('.albar__val').minWidth]
  ];
  tbody.innerHTML = rows.filter(function (r) { return r[1]; }).map(function (r) {
    return '<div class="tbl__row" style="grid-template-columns:8px 1.84fr 0.81fr 8px;"><div class="tc tc--separator"></div><div class="tc"><span class="tc__row"><span class="tc__text">' + r[0] + '</span></span></div><div class="tc"><code class="tok">' + r[1] + '</code></div><div class="tc tc--separator"></div></div>';
  }).join('');
  } finally { probe.remove(); }
}

/* ---------------- copy ---------------- */
function initCopy() {
  document.querySelectorAll('.code-panel__copy').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var t = document.getElementById(btn.dataset.copyTarget);
      if (!t) return;
      navigator.clipboard.writeText(t.textContent).then(function () {
        var lab = btn.querySelector('.copy-label');
        if (!lab) return;
        var old = lab.textContent;
        lab.textContent = 'Скопировано';
        setTimeout(function () { lab.textContent = old; }, 1400);
      });
    });
  });
}

function boot() {
  [initExamples, initPlayground, initRedline, initCopy].forEach(function (fn) {
    try { fn(); } catch (e) { console.error('allocation-bar.page:', e); }
  });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
})();
