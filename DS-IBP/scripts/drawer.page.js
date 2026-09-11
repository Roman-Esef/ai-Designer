/* =========================================================================
   drawer.page.js — демо и конструктор страницы Drawer.
   Только для страницы документации: на экранах панель оживляет
   scripts/ds-drawer.js, а этот файл туда не подключается.
   ========================================================================= */
(function () {
  'use strict';

  var state = { w: 'w4', foot: true, path: true, alert: false, cols: 2, sections: 3 };

  /* ---------- строители разметки (чистые, без DOM) ---------- */
  function rof(label, val) {
    return '<div class="rof"><span class="ds-label"><span class="ds-label__text">' + label +
      '</span></span><div class="rof__row"><span class="rof__value">' + val +
      '</span></div></div>';
  }

  function sec(title, act, rows, o) {
    var cls = 'drawer__grid' + (o.cols === 1 ? ' drawer__grid--1col' : '');
    return '<section class="drawer__sec">' +
      '<div class="drawer__sechead"><h3 class="drawer__sectitle">' + title + '</h3>' +
        (act ? '<span class="drawer__secact"><button type="button" class="btn btn--transparent btn--s">' +
          '<i data-icon="add"></i><span class="btn__label">' + act + '</span></button></span>' : '') +
      '</div>' +
      '<div class="' + cls + '">' + rows.map(function (r) { return rof(r[0], r[1]); }).join('') + '</div>' +
    '</section>';
  }

  var SECS = [
    ['Реквизиты сделки', '', [['Сумма', '1 250 000 000 ₽'], ['Погашение', '31.12.2029'],
                              ['Клиент', 'ООО «ЮгСтрой»'], ['Менеджер', 'Волкова П. А.']]],
    ['Поля карточки', 'Добавить поле', [['Уровень риска', 'Повышенный'],
                              ['Обеспечение', 'Залог недвижимости']]],
    ['Обеспечение', '', [['Тип', 'Недвижимость'], ['Оценка', '1 800 000 000 ₽'],
                              ['Дата оценки', '14.08.2026'], ['Страховка', 'до 31.12.2027']]]
  ];

  function drawer(o, inline) {
    var cls = 'drawer drawer--' + o.w + (inline ? ' drawer--inline' : '');
    var body = SECS.slice(0, o.sections).map(function (s) { return sec(s[0], s[1], s[2], o); }).join('');
    return '<aside class="' + cls + '" role="dialog" aria-modal="true" aria-labelledby="dw-demo-t">' +
      '<header class="drawer__head">' +
        '<div class="drawer__headmain">' +
          (o.path ? '<p class="drawer__path"><span>Заведение</span><i data-icon="chevron-right"></i><span>D-1042</span></p>' : '') +
          '<h2 class="drawer__title" id="dw-demo-t">ООО «ЮгСтрой» — кредитный мезонин</h2>' +
        '</div>' +
        '<div class="drawer__acts">' +
          '<button type="button" class="ibtn ibtn--neutral ibtn--m" aria-label="В избранное" aria-pressed="false"><i data-icon="star"></i></button>' +
          '<button type="button" class="ibtn ibtn--neutral ibtn--m" aria-label="Действия" data-menu="dw-menu"><i data-icon="more-dots"></i></button>' +
          '<span class="drawer__close"><button type="button" class="ibtn ibtn--neutral ibtn--m" aria-label="Закрыть панель" data-modal-close><i data-icon="close"></i></button></span>' +
        '</div>' +
      '</header>' +
      (o.alert ? '<div class="drawer__alert"><div class="alert alert--warning alert--flush">' +
        '<span class="alert__icon"><i data-icon="alert-triangle"></i></span>' +
        '<div class="alert__body"><p class="alert__text">Оценка обеспечения просрочена на 12 дней.</p></div>' +
        '</div></div>' : '') +
      '<div class="drawer__body">' + body + '</div>' +
      (o.foot ? '<div class="drawer__foot">' +
        '<div class="drawer__foot-left"><button type="button" class="btn btn--transparent btn--m"><span class="btn__label">Открыть сделку</span></button></div>' +
        '<div class="drawer__foot-right"><button type="button" class="btn btn--outline btn--m" data-modal-close><span class="btn__label">Закрыть</span></button></div>' +
      '</div>' : '') +
    '</aside>';
  }

  /* Сцена: слева список, справа панель. Панель встроенная (--inline) —
     живой слой на весь вьюпорт закрыл бы саму документацию. Открыть
     настоящим слоем можно кнопкой над сценой. */
  function scene(o) {
    var rows = ['ООО «ЮгСтрой» — кредитный мезонин', 'АО «Северный проект» — доля 24%',
                'ПАО «Волга-Телеком» — опцион', 'ООО «Каспий-Порт» — мезонин'];
    var list = rows.map(function (t, i) {
      return '<article class="tile tile--card' + (i === 0 ? ' dw-row--active' : '') + '">' +
        '<header class="tile__header"><div class="tile__header-main">' +
        '<div class="tile__title-row"><h3 class="tile__title">' + t + '</h3></div>' +
        '</div></header></article>';
    }).join('');
    return '<div class="dw-scene">' +
      '<div class="dw-scene__list">' + list + '</div>' + drawer(o, true) + '</div>';
  }

  /* ---------- отрисовка ---------- */
  function paint(host, html) {
    if (!host) return;
    host.innerHTML = html;
    if (window.dsIcons && dsIcons.apply) dsIcons.apply(host);
  }

  /* Пересборка сцены = новые узлы. Рантаймы ДС связывают разметку один раз
     на DOMContentLoaded, поэтому каждый зовётся повторно. Имена методов
     сверены с экспортом рантайма: guard вида «window.DSX && DSX.method»
     при опечатке не падает, а молча ничего не делает. */
  function rebind(scope) {
    if (window.dsIcons && dsIcons.apply) dsIcons.apply(scope);
    if (window.DSMenu && DSMenu.bindAll) DSMenu.bindAll(scope);
    if (window.DSModal && DSModal.bindAll) DSModal.bindAll(scope);
    if (window.DSDrawer && DSDrawer.bindAll) DSDrawer.bindAll(scope);
    if (window.DSTabs && DSTabs.wireAll) DSTabs.wireAll(scope);
  }

  function render() {
    var stage = document.getElementById('pg-stage');
    if (!stage) return;
    paint(stage, scene(state));
    rebind(stage);
    syncLayer();
  }

  /* Живой слой — та же конфигурация, что в сцене: иначе кнопка «Открыть
     слоем» показывала бы не то, что собрано конструктором. */
  function syncLayer() {
    var scrim = document.getElementById('dw-layer');
    if (!scrim) return;
    paint(scrim, drawer(state, false));
    rebind(scrim);
  }

  /* ---------- конструктор ---------- */
  function ctlSelect(id, label, opts, val) {
    return '<div class="ctl"><div class="lbl">' + label + '</div>' +
      '<div class="pg-select"><select id="' + id + '">' +
      opts.map(function (o) {
        return '<option value="' + o[0] + '"' + (String(o[0]) === String(val) ? ' selected' : '') +
          '>' + o[1] + '</option>';
      }).join('') + '</select></div></div>';
  }

  function buildControls() {
    var host = document.getElementById('pg-controls');
    if (!host) return;
    host.innerHTML =
      '<div class="pg__grouphead">Панель</div>' +
      ctlSelect('pg-w', 'Ширина', [['w3', 'w3 · 442'], ['w4', 'w4 · 595'], ['w5', 'w5 · 747'], ['w6', 'w6 · 900']], state.w) +
      ctlSelect('pg-foot', 'Подвал', [['no', 'Нет'], ['yes', 'Да']], state.foot ? 'yes' : 'no') +
      ctlSelect('pg-path', 'Путь в шапке', [['no', 'Нет'], ['yes', 'Да']], state.path ? 'yes' : 'no') +
      ctlSelect('pg-alert', 'Alert под шапкой', [['no', 'Нет'], ['yes', 'Да']], state.alert ? 'yes' : 'no') +
      '<div class="pg__grouphead">Содержимое</div>' +
      ctlSelect('pg-cols', 'Колонок в сетке', [[2, '2'], [1, '1']], state.cols) +
      ctlSelect('pg-sections', 'Секций', [[1, '1'], [2, '2'], [3, '3']], state.sections);

    var map = {
      'pg-w':        function (v) { state.w = v; },
      'pg-foot':     function (v) { state.foot = v === 'yes'; },
      'pg-path':     function (v) { state.path = v === 'yes'; },
      'pg-alert':    function (v) { state.alert = v === 'yes'; },
      'pg-cols':     function (v) { state.cols = parseInt(v, 10); },
      'pg-sections': function (v) { state.sections = parseInt(v, 10); }
    };
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      var on = function () { map[id](el.value); render(); };
      el.addEventListener('change', on);
      el.addEventListener('input', on);
    });
  }

  /* ---------- анатомия: маркеры считаются по факту, а не расставлены вручную ---------- */
  function markers(host, pairs) {
    if (!host) return;
    var hr = host.getBoundingClientRect();
    host.style.paddingLeft = '14px';
    pairs.forEach(function (p) {
      var el = host.querySelector(p[0]);
      if (!el) return;
      var r = el.getBoundingClientRect();
      var s = document.createElement('span');
      s.className = 'mk';
      s.style.top = (r.top - hr.top + r.height / 2) + 'px';
      s.style.left = '-11px';
      s.textContent = p[1];
      host.appendChild(s);
    });
  }

  function buildAnatomy() {
    var host = document.getElementById('anat-drawer');
    if (!host) return;
    var o = { w: 'w4', foot: true, path: true, alert: false, cols: 2, sections: 2 };
    host.style.width = '595px';
    host.style.height = '440px';
    paint(host, drawer(o, true));
    markers(host, [['.drawer__path', 1], ['.drawer__title', 2], ['.drawer__acts', 3],
                   ['.drawer__sectitle', 4], ['.drawer__secact', 5],
                   ['.drawer__grid', 6], ['.drawer__foot', 7]]);
  }

  /* ---------- таблицы: та же разметка .tbl, что на остальных страницах ДС.
     Нативный <table> запрещён правилом B5 линтера. ---------- */
  function dsTbl(host, headers, rows, widths) {
    if (!host) return;
    var grid = ['8px'].concat(widths, ['8px']).join(' ');
    var head = '<div class="tbl__row" style="grid-template-columns:' + grid + ';">' +
      '<div class="th th--separator"></div>' +
      headers.map(function (h) {
        return '<div class="th"><span class="th__label">' + h + '</span></div>';
      }).join('') + '<div class="th th--separator"></div></div>';
    var body = rows.map(function (r) {
      return '<div class="tbl__row" style="grid-template-columns:' + grid + ';">' +
        '<div class="tc tc--separator"></div>' +
        r.map(function (c) {
          return '<div class="tc tc--wrap"><span class="tc__row"><span class="tc__text">' + c +
            '</span></span></div>';
        }).join('') + '<div class="tc tc--separator"></div></div>';
    }).join('');
    host.innerHTML = head + body;
  }

  function hexOf(probe, value) {
    probe.style.color = '';
    probe.style.color = value;
    var m = getComputedStyle(probe).color.match(/[d.]+/g);
    if (!m) return '—';
    return '#' + m.slice(0, 3).map(function (n) {
      return ('0' + Math.round(parseFloat(n)).toString(16)).slice(-2);
    }).join('').toUpperCase();
  }

  /* Значения снимаются с живого узла через getComputedStyle, а не
     выписываются руками: расхождение таблицы с CSS становится невозможным. */
  function buildRedline() {
    var host = document.getElementById('redline-table');
    var stage = document.getElementById('pg-stage');
    if (!host || !stage) return;
    function cs(sel, prop) {
      var el = stage.querySelector(sel);
      return el ? getComputedStyle(el)[prop] : '—';
    }
    dsTbl(host, ['Узел', 'Значение', 'Токен'], [
      ['Ширина панели (текущий вариант)', cs('.drawer', 'width'), '<code class="tok">--modal-w-*</code>'],
      ['Радиус панели', cs('.drawer', 'borderRadius'), '<code class="tok">--radius-modal</code>'],
      ['Шапка · паддинг', cs('.drawer__head', 'padding'), '20 / 20 / 20 / 24'],
      ['Шапка · зазор до действий', cs('.drawer__head', 'columnGap'), '<code class="tok">--drawer-head-gap</code>'],
      ['Путь · шрифт', cs('.drawer__path', 'font'), '<code class="tok">--type-body-xs</code>'],
      ['Заголовок · шрифт', cs('.drawer__title', 'font'), '<code class="tok">--type-h5-strong</code>'],
      ['Тело · паддинг', cs('.drawer__body', 'padding'), '20 / 24'],
      ['Тело · зазор между секциями', cs('.drawer__body', 'rowGap'), '<code class="tok">--drawer-body-gap</code>'],
      ['Секция · зазор внутри', cs('.drawer__sec', 'rowGap'), '<code class="tok">--drawer-sec-gap</code>'],
      ['Сетка значений · зазор', cs('.drawer__grid', 'gap'), '<code class="tok">--space-16</code>'],
      ['Подвал · паддинг', cs('.drawer__foot', 'padding'), '16 / 24']
    ], ['1.4fr', '1.2fr', '1.2fr']);
  }

  function buildColors() {
    var host = document.getElementById('color-table');
    if (!host) return;
    var probe = document.createElement('span');
    probe.style.display = 'none';
    document.body.appendChild(probe);
    var rows = [
      ['Панель', 'Поверхность', '--bg-popup'],
      ['Панель', 'Тень', '--shadow-modal-form'],
      ['Слой', 'Скрим', '--modal-scrim'],
      ['Шапка · подвал', 'Разделительная линия', '--border-light'],
      ['Текст', 'Заголовок, значения', '--text-primary'],
      ['Текст', 'Путь, подписи полей', '--text-inactive']
    ];
    dsTbl(host, ['Узел', 'Роль', 'Токен', 'Образец', 'Hex'], rows.map(function (r) {
      var val = 'var(' + r[2] + ')';
      var paint = r[2] === '--shadow-modal-form' ? 'transparent' : val;
      var sw = '<span style="display:inline-block;width:22px;height:22px;border-radius:var(--radius-xs);' +
        'border:1px solid var(--border-light);vertical-align:middle;background:' + paint + '"></span>';
      return [r[0], r[1], '<code class="tok">' + r[2] + '</code>', sw,
              r[2] === '--shadow-modal-form' ? '—' : hexOf(probe, val)];
    }), ['1fr', '1.5fr', '1.4fr', '0.7fr', '0.9fr']);
    probe.remove();
  }

  function init() {
    buildControls();
    render();
    buildAnatomy();
    buildRedline();
    buildColors();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
