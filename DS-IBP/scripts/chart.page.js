/* =========================================================================
   Chart — логика страницы документации: демонстрации, конструктор,
   redline и справочные таблицы. Сам компонент живёт в scripts/ds-chart.js.
   ========================================================================= */
(function () {
'use strict';
var CH = window.DSChart;

/* ---------------- демо-данные (нейтральные, не доменные) ---------------- */
var M12 = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
var Q4 = ['I кв.', 'II кв.', 'III кв.', 'IV кв.'];
var IN = [420e6, 380e6, 510e6, 470e6, 620e6, 590e6, 700e6, 660e6, 730e6, 690e6, 810e6, 760e6];
var OUT = [210e6, 260e6, 240e6, 300e6, 280e6, 340e6, 320e6, 390e6, 360e6, 420e6, 400e6, 470e6];
var REST = [120e6, 160e6, 150e6, 190e6, 210e6, 240e6, 260e6, 250e6, 300e6, 320e6, 340e6, 380e6];

function mount(id, cfg) {
  var box = document.getElementById(id);
  if (!box) return null;
  box.innerHTML = '';
  var node = CH.make(cfg);
  box.appendChild(node);
  return node;
}
function base(over) {
  return Object.assign({
    type: 'bar', size: 'm', categories: M12,
    series: [{ id: 'in', name: 'Поступления', data: IN }],
    title: null, legend: true
  }, over || {});
}

/* ---------------- таблицы документации на компоненте Table ---------------- */
function tbl(target, cols, rows) {
  var host = typeof target === 'string' ? document.getElementById(target) : target;
  if (!host) return;
  var tpl = 'grid-template-columns:8px ' + cols.map(function (c) { return c[1]; }).join(' ') + ' 8px;';
  var html = '<div class="tbl" style="grid-template-columns:none;border:none;border-radius:0;">';
  html += '<div class="tbl__row" style="' + tpl + '"><div class="th th--separator"></div>';
  cols.forEach(function (c) {
    html += '<div class="th"><span class="th__label">' + c[0] + '</span><span class="th__resize" role="separator" aria-orientation="vertical" tabindex="0" aria-label="Изменить ширину колонки"></span></div>';
  });
  html += '<div class="th th--separator"></div></div>';
  rows.forEach(function (r) {
    html += '<div class="tbl__row" style="' + tpl + '"><div class="tc tc--separator"></div>';
    r.forEach(function (cell) {
      html += '<div class="tc tc--wrap"><span class="tc__row"><span class="tc__text">' + cell + '</span></span></div>';
    });
    html += '<div class="tc tc--separator"></div></div>';
  });
  host.innerHTML = html + '</div>';
}
function tok(t) { return '<code class="tok">' + t + '</code>'; }
function sw(t) { return '<span class="sw" style="background:var(' + t + ')"></span>'; }

/* =========================================================================
   Примеры на странице
   ========================================================================= */
function initExamples() {
  /* --- использование --- */
  mount('use-tile', base({
    size: 's', type: 'bar', legend: false, categories: M12.slice(6),
    series: [{ id: 'in', name: 'Поступления', data: IN.slice(6) }]
  }));
  mount('use-page', base({
    size: 'l', type: 'combo', title: 'Движение средств по месяцам', subtitle: 'Поступления и списания, руб.',
    series: [
      { id: 'in', name: 'Поступления', data: IN, type: 'bar' },
      { id: 'out', name: 'Списания', data: OUT, type: 'bar' },
      { id: 'rest', name: 'Остаток', data: REST, type: 'line', color: '--chart-indigo' }
    ],
    crosshair: true, toolbar: { periods: ['Месяц', 'Квартал', 'Год'], active: 'Месяц' }
  }));

  /* --- анатомия --- */
  mount('anat-stage', base({
    size: 'm', title: 'Движение средств', subtitle: 'по месяцам, руб.',
    categories: M12.slice(0, 8),
    series: [
      { id: 'in', name: 'Поступления', data: IN.slice(0, 8) },
      { id: 'out', name: 'Списания', data: OUT.slice(0, 8) }
    ],
    type: 'grouped', refLine: { value: 500e6, label: 'Цель' }, crosshair: true,
    toolbar: { periods: ['М', 'Кв'], active: 'М' }
  }));

  /* --- варианты: типы --- */
  var six = M12.slice(0, 6), IN6 = IN.slice(0, 6), OUT6 = OUT.slice(0, 6);
  mount('var-bar', base({ legend: false, categories: six, series: [{ id: 'in', name: 'Поступления', data: IN6 }] }));
  mount('var-hbar', base({
    type: 'hbar', legend: false, valueLabels: true,
    categories: ['Категория A', 'Категория B', 'Категория C', 'Категория D'],
    series: [{ id: 'v', name: 'Объём', data: [810e6, 530e6, 420e6, 260e6] }]
  }));
  mount('var-grouped', base({ type: 'grouped', categories: six, series: [{ id: 'p', name: 'План', data: IN6 }, { id: 'f', name: 'Факт', data: OUT6 }] }));
  mount('var-stacked', base({ type: 'stacked', categories: six, series: [{ id: 'a', name: 'Сегмент A', data: IN6 }, { id: 'b', name: 'Сегмент B', data: OUT6 }, { id: 'c', name: 'Сегмент C', data: REST.slice(0, 6) }] }));
  mount('var-stacked100', base({ type: 'stacked100', categories: six, series: [{ id: 'a', name: 'Сегмент A', data: IN6 }, { id: 'b', name: 'Сегмент B', data: OUT6 }, { id: 'c', name: 'Сегмент C', data: REST.slice(0, 6) }] }));
  mount('var-line', base({ type: 'line', legend: false, series: [{ id: 'r', name: 'Остаток', data: REST }], crosshair: true }));
  mount('var-area', base({ type: 'area', legend: false, series: [{ id: 'r', name: 'Остаток', data: REST }] }));
  mount('var-stacked-area', base({ type: 'stackedArea', series: [{ id: 'a', name: 'Сегмент A', data: REST }, { id: 'b', name: 'Сегмент B', data: OUT }] }));
  mount('var-combo', base({
    type: 'combo', categories: six,
    series: [
      { id: 'v', name: 'Поступления', data: IN6, type: 'bar' },
      { id: 'r', name: 'Среднее за квартал', data: [437e6, 437e6, 437e6, 560e6, 560e6, 560e6], type: 'line', color: '--chart-indigo' }
    ]
  }));
  mount('var-pie', base({
    type: 'pie', size: 'm', categories: ['Сегмент A', 'Сегмент B', 'Сегмент C', 'Сегмент D'],
    series: [{ id: 'p', name: 'Доля', data: [45, 25, 18, 12] }]
  }));
  mount('var-donut', base({
    type: 'donut', size: 'm', categories: ['Сегмент A', 'Сегмент B', 'Сегмент C', 'Сегмент D'],
    series: [{ id: 'p', name: 'Доля', data: [45, 25, 18, 12] }],
    centerLabel: '1,2 млрд', centerSub: 'всего'
  }));
  mount('var-scatter', base({
    type: 'scatter', legend: false,
    series: [{
      id: 'p', name: 'Наблюдения', data: [
        { x: 12, y: 120e6 }, { x: 30, y: 260e6 }, { x: 55, y: 180e6 }, { x: 70, y: 420e6 },
        { x: 90, y: 380e6 }, { x: 40, y: 90e6 }, { x: 62, y: 300e6 }, { x: 22, y: 210e6 }
      ]
    }]
  }));
  mount('var-waterfall', base({
    type: 'waterfall', legend: false, valueLabels: true,
    categories: ['На начало', 'Поступления', 'Списания', 'Переоценка', 'На конец'],
    totalIndexes: [4],
    series: [{ id: 'w', name: 'Изменение', data: [500e6, 320e6, -180e6, 60e6, 700e6] }]
  }));
  mount('var-spark', { type: 'spark', size: 's', spark: 'line', tone: 'auto', series: [{ id: 's', data: REST }] });
  mount('var-spark-bar', { type: 'spark', size: 's', spark: 'bar', series: [{ id: 's', data: OUT, color: '--chart-blue' }] });

  /* --- размеры --- */
  ['s', 'm', 'l'].forEach(function (sz) {
    mount('size-' + sz, base({ size: sz, legend: sz !== 's', categories: M12, series: [{ id: 'in', name: 'Поступления', data: IN }] }));
  });
  mount('size-tile', base({ size: 's', legend: false, type: 'area', categories: M12, series: [{ id: 'r', name: 'Остаток', data: REST }] }));

  /* --- контент --- */
  mount('cnt-compact', base({ legend: false, categories: six, series: [{ id: 'in', name: 'Поступления', data: IN6 }] }));
  mount('cnt-full', base({ legend: false, format: 'full', categories: Q4, series: [{ id: 'in', name: 'Поступления', data: [4.2, 5.1, 4.7, 6.3] }] }));
  mount('cnt-dense', base({
    legend: false, type: 'line',
    categories: Array.from({ length: 36 }, function (_, i) { return M12[i % 12] + ' ' + (24 + Math.floor(i / 12)); }),
    series: [{ id: 'r', name: 'Остаток', data: Array.from({ length: 36 }, function (_, i) { return 200e6 + Math.round(Math.sin(i / 3) * 80e6) + i * 6e6; }) }]
  }));
  mount('cnt-labels', base({ legend: false, valueLabels: true, categories: Q4, series: [{ id: 'in', name: 'Поступления', data: [420e6, 510e6, 470e6, 620e6] }] }));
  mount('cnt-legend-many', base({
    type: 'line', categories: six,
    series: CH.palette.slice(0, 8).map(function (c, i) {
      return { id: 'c' + i, name: 'Показатель ' + (i + 1), color: c, data: IN6.map(function (v) { return v * (0.5 + i * 0.12); }) };
    })
  }));

  /* --- поведение --- */
  mount('beh-tip', base({ type: 'grouped', categories: six, crosshair: true, series: [{ id: 'p', name: 'План', data: IN6 }, { id: 'f', name: 'Факт', data: OUT6 }] }));
  mount('beh-legend', base({ type: 'line', categories: M12, series: [{ id: 'in', name: 'Поступления', data: IN }, { id: 'out', name: 'Списания', data: OUT }, { id: 'r', name: 'Остаток', data: REST }] }));
  mount('beh-brush', base({ type: 'line', legend: false, categories: M12, brush: true, initialRange: [3, 10], series: [{ id: 'in', name: 'Поступления', data: IN }] }));
  mount('beh-ref', base({ legend: false, categories: six, refLine: { value: 550e6, label: 'Цель 550 млн' }, series: [{ id: 'in', name: 'Поступления', data: IN6 }] }));
  mount('beh-toolbar', base({
    legend: false, categories: Q4, title: 'Поступления', series: [{ id: 'in', name: 'Поступления', data: [1.4e9, 1.7e9, 1.55e9, 2.1e9] }],
    toolbar: { periods: ['Месяц', 'Квартал', 'Год'], active: 'Квартал' }
  }));

  /* --- состояния --- */
  mount('st-loaded', base({ legend: false, categories: six, series: [{ id: 'in', name: 'Поступления', data: IN6 }] }));
  mount('st-loading', base({ status: 'loading', title: 'Движение средств' }));
  mount('st-slow', base({ status: 'loading-slow', title: 'Движение средств' }));
  mount('st-error', base({ status: 'error', title: 'Движение средств' }));
  mount('st-empty', base({ status: 'empty', title: 'Движение средств' }));
  mount('st-gaps', base({
    type: 'line', legend: false, categories: M12,
    series: [{ id: 'r', name: 'Остаток', data: [120e6, 160e6, null, null, 210e6, 240e6, 260e6, null, 300e6, 320e6, 340e6, 380e6] }],
    footNote: 'За март — апрель и август данных нет: разрыв в ряду, не нулевые значения'
  }));
  mount('st-forecast', base({
    type: 'bar', legend: false, categories: M12,
    series: [{ id: 'in', name: 'Поступления', data: IN, forecastFrom: 9 }]
  }));
  mount('st-forecast-line', base({
    type: 'line', legend: false, categories: M12,
    series: [{ id: 'r', name: 'Остаток', data: REST, forecastFrom: 9 }]
  }));
  mount('st-hover', base({ type: 'line', categories: M12, series: [{ id: 'in', name: 'Поступления', data: IN }, { id: 'out', name: 'Списания', data: OUT }, { id: 'r', name: 'Остаток', data: REST }] }));

  /* --- цвета --- */
  mount('col-palette', base({
    type: 'line', categories: six,
    series: CH.palette.map(function (c, i) {
      return { id: 'p' + i, name: c.replace('--chart-', ''), color: c, data: IN6.map(function (v) { return v * (0.35 + i * 0.06); }) };
    })
  }));
  mount('col-planfact', base({
    type: 'grouped', categories: Q4,
    series: [
      { id: 'p', name: 'План', data: [500e6, 520e6, 560e6, 600e6], color: '--st-grey-midlight' },
      { id: 'f', name: 'Факт', data: [470e6, 545e6, 590e6, 575e6], color: '--primary' }
    ]
  }));
  mount('col-delta', base({
    type: 'waterfall', legend: false, valueLabels: true,
    categories: ['На начало', 'Рост', 'Снижение', 'На конец'], totalIndexes: [3],
    series: [{ id: 'w', name: 'Изменение', data: [400e6, 180e6, -90e6, 490e6] }]
  }));

  /* --- спарклайны в таблице --- */
  buildTableDemo();
}

/* таблица со столбцом динамики: спарклайн — вариант ячейки TableCell */
function buildTableDemo() {
  var host = document.getElementById('use-table');
  if (!host) return;
  var rows = [
    ['Показатель A', '810 000 000,00', [120, 160, 150, 190, 210, 240, 260, 300], 'up'],
    ['Показатель B', '530 000 000,00', [300, 280, 260, 250, 230, 210, 190, 160], 'down'],
    ['Показатель C', '420 000 000,00', [200, 210, 190, 220, 205, 215, 210, 225], 'up']
  ];
  var tplCols = 'grid-template-columns:8px 1.6fr 1fr 0.8fr 8px;';
  var html = '<div class="tbl" style="grid-template-columns:none;border:none;border-radius:0;">';
  html += '<div class="tbl__row" style="' + tplCols + '"><div class="th th--separator"></div>';
  ['Показатель', 'Значение', 'Динамика'].forEach(function (t) {
    html += '<div class="th"><span class="th__label">' + t + '</span></div>';
  });
  html += '<div class="th th--separator"></div></div>';
  rows.forEach(function (r, i) {
    html += '<div class="tbl__row" style="' + tplCols + '"><div class="tc tc--separator"></div>' +
      '<div class="tc"><span class="tc__row"><span class="tc__text">' + r[0] + '</span></span></div>' +
      '<div class="tc tc--numbers"><span class="tc__row"><span class="tc__text">' + r[1] + '</span></span></div>' +
      '<div class="tc"><span class="tc__row"><span class="tc__spark" id="spk-' + i + '"></span></span></div>' +
      '<div class="tc tc--separator"></div></div>';
  });
  host.innerHTML = html + '</div>';
  rows.forEach(function (r, i) {
    var cell = document.getElementById('spk-' + i);
    if (!cell) return;
    cell.appendChild(CH.make({
      type: 'spark', size: 's', spark: 'line', tone: 'auto',
      series: [{ id: 'k', data: r[2] }],
      ariaLabel: 'Динамика показателя: ' + (r[3] === 'up' ? 'рост' : 'снижение')
    }));
  });
}

/* =========================================================================
   Конструктор
   ========================================================================= */
function initPlayground() {
  var controls = document.getElementById('pg-controls');
  var stage = document.getElementById('pg-stage');
  if (!controls || !stage) return;

  var state = {
    type: 'bar', size: 'm', width: '640', series: '2', legend: 'top', tooltip: 'yes',
    crosshair: 'no', grid: 'y', labels: 'no', ref: 'no', brush: 'no', toolbar: 'no',
    status: 'loaded', format: 'compact'
  };
  var ctlRefs = {};
  function ctl(key, labelText, options) {
    var wrap = document.createElement('div'); wrap.className = 'ctl';
    var l = document.createElement('div'); l.className = 'lbl'; l.textContent = labelText; wrap.appendChild(l);
    var box = document.createElement('div'); box.className = 'pg-select';
    var sel = document.createElement('select');
    options.forEach(function (o) {
      var op = document.createElement('option');
      op.value = o[0]; op.textContent = o[1];
      if (o[0] === state[key]) op.selected = true;
      sel.appendChild(op);
    });
    sel.addEventListener('change', function () { state[key] = sel.value; render(); });
    box.appendChild(sel); wrap.appendChild(box);
    controls.appendChild(wrap);
    ctlRefs[key] = wrap;
    return wrap;
  }

  ctl('type', 'Тип графика', [
    ['bar', 'Столбчатый'], ['hbar', 'Горизонтальный'], ['grouped', 'Группированные'],
    ['stacked', 'Стек'], ['stacked100', 'Стек 100%'], ['line', 'Линейный'],
    ['area', 'Область'], ['stackedArea', 'Стек-области'], ['combo', 'Комбо'],
    ['pie', 'Круговой'], ['donut', 'Кольцевой'], ['scatter', 'Точечный'],
    ['waterfall', 'Водопад'], ['spark', 'Спарклайн']
  ]);
  ctl('size', 'Размер', [['s', 'S'], ['m', 'M'], ['l', 'L']]);
  ctl('width', 'Ширина контейнера', [['880', '880px'], ['640', '640px'], ['440', '440px'], ['320', '320px'], ['240', '240px']]);
  ctl('series', 'Серий', [['1', '1'], ['2', '2'], ['3', '3'], ['6', '6']]);
  ctl('status', 'Состояние', [['loaded', 'Загружено'], ['loading', 'Загрузка'], ['loading-slow', 'Долгий расчёт'], ['error', 'Ошибка'], ['empty', 'Нет данных'], ['gaps', 'Пропуски в ряду'], ['forecast', 'Прогноз с 10-го месяца']]);
  ctl('legend', 'Легенда', [['top', 'Сверху'], ['bottom', 'Снизу'], ['no', 'Скрыть']]);
  ctl('tooltip', 'Тултип', [['yes', 'Есть'], ['no', 'Нет']]);
  ctl('crosshair', 'Кросс-хэйр', [['no', 'Нет'], ['yes', 'Есть']]);
  ctl('grid', 'Сетка', [['y', 'По значениям'], ['none', 'Без сетки']]);
  ctl('labels', 'Подписи значений', [['no', 'Нет'], ['yes', 'Есть']]);
  ctl('ref', 'Опорная линия', [['no', 'Нет'], ['yes', 'Есть']]);
  ctl('brush', 'Выделение диапазона', [['no', 'Нет'], ['yes', 'Есть']]);
  ctl('toolbar', 'Тулбар', [['no', 'Нет'], ['yes', 'Период + экспорт']]);
  ctl('format', 'Формат чисел', [['compact', 'Компактный'], ['full', 'Полный']]);

  function seriesFor(n) {
    var pool = [
      { id: 'in', name: 'Поступления', data: IN },
      { id: 'out', name: 'Списания', data: OUT },
      { id: 'rest', name: 'Остаток', data: REST },
      { id: 'x1', name: 'Показатель 4', data: IN.map(function (v) { return v * 0.45; }) },
      { id: 'x2', name: 'Показатель 5', data: OUT.map(function (v) { return v * 1.25; }) },
      { id: 'x3', name: 'Показатель 6', data: REST.map(function (v) { return v * 0.7; }) }
    ];
    return pool.slice(0, n).map(function (se) { return Object.assign({}, se); });
  }

  function render() {
    var t = state.type;
    var isRound = t === 'pie' || t === 'donut';
    var isSpark = t === 'spark';
    var isScatter = t === 'scatter';
    /* неактуальные контролы скрываем целиком */
    var off = {
      series: isRound || isSpark || t === 'waterfall',
      legend: isSpark,
      crosshair: isRound || isSpark || isScatter,
      grid: isRound || isSpark,
      labels: isRound || isSpark || isScatter || t === 'stacked' || t === 'stacked100',
      ref: isRound || isSpark || isScatter,
      brush: isRound || isSpark || isScatter,
      toolbar: isSpark,
      tooltip: isSpark,
      format: isSpark
    };
    Object.keys(ctlRefs).forEach(function (k) { ctlRefs[k].classList.toggle('is-off', !!off[k]); });

    var n = parseInt(state.series, 10);
    var series = seriesFor(t === 'waterfall' ? 1 : n);
    var cats = M12;
    var cfg = {
      type: t, size: state.size, format: state.format,
      legend: state.legend === 'no' ? false : (state.legend === 'bottom' ? 'bottom' : true),
      tooltip: state.tooltip === 'yes', crosshair: state.crosshair === 'yes',
      grid: state.grid, valueLabels: state.labels === 'yes',
      brush: state.brush === 'yes', title: 'Движение средств', subtitle: 'по месяцам, руб.',
      categories: cats, series: series
    };
    if (state.ref === 'yes') cfg.refLine = { value: 550e6, label: 'Цель' };
    if (state.toolbar === 'yes') cfg.toolbar = { periods: ['М', 'Кв', 'Г'], active: 'Кв' };
    if (t === 'waterfall') {
      cfg.categories = ['На начало', 'Поступления', 'Списания', 'Переоценка', 'На конец'];
      cfg.totalIndexes = [4];
      cfg.series = [{ id: 'w', name: 'Изменение', data: [500e6, 320e6, -180e6, 60e6, 700e6] }];
    }
    if (isRound) {
      cfg.categories = ['Сегмент A', 'Сегмент B', 'Сегмент C', 'Сегмент D'];
      cfg.series = [{ id: 'p', name: 'Доля', data: [45, 25, 18, 12] }];
      if (t === 'donut') { cfg.centerLabel = '1,2 млрд'; cfg.centerSub = 'всего'; }
    }
    if (isScatter) {
      cfg.series = [{
        id: 'p', name: 'Наблюдения', data: [
          { x: 12, y: 120e6 }, { x: 30, y: 260e6 }, { x: 55, y: 180e6 }, { x: 70, y: 420e6 },
          { x: 90, y: 380e6 }, { x: 40, y: 90e6 }, { x: 62, y: 300e6 }, { x: 22, y: 210e6 }
        ]
      }];
    }
    if (isSpark) { cfg.spark = 'line'; cfg.tone = 'auto'; cfg.title = null; cfg.subtitle = null; cfg.series = [{ id: 's', data: REST }]; }
    if (state.status === 'gaps') cfg.series[0].data = [120e6, 160e6, null, null, 210e6, 240e6, 260e6, null, 300e6, 320e6, 340e6, 380e6];
    else if (state.status === 'forecast') cfg.series.forEach(function (se) { se.forecastFrom = 9; });
    else if (state.status !== 'loaded') cfg.status = state.status;

    stage.innerHTML = '';
    var frame = document.createElement('div');
    frame.style.cssText = 'width:' + state.width + 'px;max-width:100%;background:var(--bg-tile);border:1px solid var(--border-light);border-radius:var(--radius-control);padding:16px';
    frame.appendChild(CH.make(cfg));
    stage.appendChild(frame);
  }
  render();
}

/* =========================================================================
   Таблицы: типографика, цвета, redline
   ========================================================================= */
function initTables() {
  tbl('typo-table',
    [['Часть', '1.6fr'], ['Токен', '1.2fr'], ['Размер / интерлиньяж', '1fr'], ['Цвет', '1.2fr']],
    [
      ['Заголовок ' + tok('.chart__title') + ' (M)', tok('--type-body-m-strong'), '16 / 20', tok('--text-primary')],
      ['Заголовок, размер S', tok('--type-body-s-strong'), '14 / 16', tok('--text-primary')],
      ['Заголовок, размер L', tok('--type-body-l-strong'), '18 / 24', tok('--text-primary')],
      ['Подзаголовок ' + tok('.chart__subtitle'), tok('--type-body-xs'), '12 / 16', tok('--text-secondary')],
      ['Подписи осей ' + tok('.chart__axis text'), tok('--type-body-xs'), '12 / 16', tok('--text-inactive')],
      ['Подписи осей, размер L', tok('--type-body-s'), '14 / 16', tok('--text-inactive')],
      ['Легенда ' + tok('.chart__legend-item'), tok('--type-body-xs'), '12 / 16', tok('--text-secondary')],
      ['Значение в легенде', tok('--type-body-xs'), '12 / 16', tok('--text-primary')],
      ['Подпись значения ' + tok('.chart__vlabel'), tok('--type-body-xs'), '12 / 16', tok('--text-secondary')],
      ['Заголовок тултипа', tok('--type-body-s-strong'), '14 / 16', tok('--text-on-dark')],
      ['Строка тултипа', tok('--type-body-s'), '14 / 16', tok('--text-on-dark') + ', opacity .82'],
      ['Значение в тултипе', tok('--type-body-s-strong'), '14 / 16', tok('--text-on-dark')]
    ]);

  var palRows = CH.palette.map(function (t, i) {
    return ['Серия ' + String(i + 1).padStart(2, '0'), tok(t), sw(t), hexOf(t)];
  });
  tbl('color-palette-table', [['Порядок', '0.8fr'], ['Токен', '1.6fr'], ['Образец', '0.6fr'], ['Hex', '1fr']], palRows);

  tbl('color-role-table',
    [['Раздел', '1fr'], ['Роль', '1.6fr'], ['Токен', '1.4fr'], ['Образец', '0.6fr']],
    [
      ['Сетка', 'Линии сетки', tok('--border-light'), sw('--border-light')],
      ['Сетка', 'Ось и нулевая линия', tok('--border-primary'), sw('--border-primary')],
      ['Оси', 'Подписи делений', tok('--text-inactive'), sw('--text-inactive')],
      ['Поле', 'Подсветка категории под курсором', tok('--bgtable-row-hover'), sw('--bgtable-row-hover')],
      ['Поле', 'Кросс-хэйр', tok('--border-dark'), sw('--border-dark')],
      ['Опора', 'Опорная линия и её подпись', tok('--text-secondary'), sw('--text-secondary')],
      ['Семантика', 'Рост, положительная дельта', tok('--success'), sw('--success')],
      ['Семантика', 'Падение, отрицательная дельта', tok('--error'), sw('--error')],
      ['Семантика', 'Итоговый столбец водопада', tok('--primary'), sw('--primary')],
      ['Семантика', 'План (фон) в паре план/факт', tok('--st-grey-midlight'), sw('--st-grey-midlight')],
      ['Служебное', 'Фон пустого состояния и расчёта', tok('--bg-page'), sw('--bg-page')],
      ['Служебное', 'Скелетон загрузки', tok('--st-disabled-light'), sw('--st-disabled-light')],
      ['Brush', 'Окно выделенного диапазона', tok('--primary-bg-semitransparent'), sw('--primary-bg-semitransparent')],
      ['Brush', 'Мини-график диапазона', tok('--st-grey-midlight'), sw('--st-grey-midlight')]
    ]);

  tbl('type-guide-tbl',
    [['Тип', '1fr'], ['Значение ' + tok('type'), '1.1fr'], ['Когда применять', '2.4fr']],
    [
      ['Столбчатый', tok('bar'), 'Сравнение значений по категориям или периодам, 4–24 колонки'],
      ['Горизонтальный', tok('hbar'), 'Те же данные, когда названия категорий длинные или их больше 8'],
      ['Группированные', tok('grouped'), 'Сравнение 2–3 серий внутри каждой категории (план/факт, период к периоду)'],
      ['Стек', tok('stacked'), 'Состав категории и общий итог одновременно; серий до 6'],
      ['Стек 100%', tok('stacked100'), 'Только доли: важна структура, а не абсолютный итог'],
      ['Линейный', tok('line'), 'Динамика по равномерной шкале времени, от 6 точек'],
      ['Область', tok('area'), 'Одна серия-динамика, где важен объём под кривой'],
      ['Стек-области', tok('stackedArea'), 'Динамика состава: сумма серий читается как общий уровень'],
      ['Комбо', tok('combo'), 'Разнородные величины: столбцы — объём, линия — ставка или доля'],
      ['Круговой', tok('pie'), 'Доли одного целого, 2–6 секторов, без динамики'],
      ['Кольцевой', tok('donut'), 'То же, плюс итог в центре кольца'],
      ['Точечный', tok('scatter'), 'Связь двух числовых величин, 10+ наблюдений'],
      ['Водопад', tok('waterfall'), 'Как итог получился из начального значения и вкладов'],
      ['Спарклайн', tok('spark'), 'Форма тренда в строке таблицы или рядом с числом; осей и легенды нет']
    ]);
}
function hexOf(tokenName) {
  var v = getComputedStyle(document.documentElement).getPropertyValue(tokenName).trim();
  return v || '—';
}

/* ---------------- redline ---------------- */
function initRedline() {
  var host = document.getElementById('dev-redline');
  if (!host) return;
  var probe = document.createElement('div');
  probe.style.cssText = 'position:absolute;left:-9999px;top:0;width:640px';
  document.body.appendChild(probe);
  probe.appendChild(CH.make(base({
    title: 'Проба', subtitle: 'redline', size: 'm', categories: M12,
    series: [{ id: 'in', name: 'Поступления', data: IN }], valueLabels: true, crosshair: true
  })));
  var rows = [];
  try {
    var cs = function (sel) { var n = probe.querySelector(sel); return n ? getComputedStyle(n) : {}; };
    var hostCs = getComputedStyle(probe.querySelector('.chart-host'));
    rows = [
      ['Высота поля построения · S', '132px'],
      ['Высота поля построения · M', hostCs.getPropertyValue('--chart-h').trim()],
      ['Высота поля построения · L', '320px'],
      ['Зазор между блоками (.chart)', cs('.chart').rowGap],
      ['Шапка · зазор', cs('.chart__head').columnGap],
      ['Заголовок', cs('.chart__title').font],
      ['Подзаголовок', cs('.chart__subtitle').font],
      ['Тулбар · зазор', cs('.chart__toolbar').columnGap],
      ['Легенда · зазор', cs('.chart__legend').rowGap + ' / ' + cs('.chart__legend').columnGap],
      ['Легенда · элемент, паддинг', cs('.chart__legend-item').padding],
      ['Легенда · минимальная высота', cs('.chart__legend-item').minHeight],
      ['Маркер серии', cs('.chart__marker').width + ' × ' + cs('.chart__marker').height],
      ['Маркер серии · радиус', cs('.chart__marker').borderRadius],
      ['Подписи осей', cs('.chart__axis text').font || 'var(--type-body-xs)'],
      ['Отступ подписи Y от поля', '8px'],
      ['Отступ подписи X от оси', '15px (базовая линия)'],
      ['Радиус столбца', 'var(--radius-2xs) — 2px'],
      ['Зазор между столбцами в группе', '2px'],
      ['Внешний отступ полосы категории', 'min(24% полосы, 12px)'],
      ['Толщина линии', '2px'],
      ['Радиус точки на линии', '3.5px (активная — 5px)'],
      ['Толщина опорной линии', '1px, штрих 4/4'],
      ['Кросс-хэйр', '1px, ' + cs('.chart__cursor').backgroundColor],
      ['Тултип · максимальная ширина', cs('.chart__tip').maxWidth],
      ['Тултип · смещение от курсора', '14px по X и Y'],
      ['Brush · высота', '36px'],
      ['Спарклайн · высота', '24px']
    ];
  } finally { probe.remove(); }
  var tplCols = 'grid-template-columns:8px 1.84fr 0.81fr 8px;';
  host.innerHTML = rows.filter(function (r) { return r[1]; }).map(function (r) {
    return '<div class="tbl__row" style="' + tplCols + '"><div class="tc tc--separator"></div><div class="tc tc--wrap"><span class="tc__row"><span class="tc__text">' + r[0] + '</span></span></div><div class="tc tc--wrap"><span class="tc__row"><span class="tc__text"><code class="tok">' + r[1] + '</code></span></span></div><div class="tc tc--separator"></div></div>';
  }).join('');
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
  [initExamples, initPlayground, initTables, initRedline, initCopy].forEach(function (fn) {
    try { fn(); } catch (e) { console.error('chart.page:', e); }
  });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
})();
