/* =========================================================================
   DatePicker documentation — интерактивные демо календаря.
   Требует: icons-data.js и ds-datepicker.js подключены ДО этого файла.
   Календарь строит общий рантайм window.DSDatePicker (out-of-box).
   ========================================================================= */
(function () {
  'use strict';
  var BASE = new Date(2025, 9, 15); // фикс. «сегодня» для стабильной документации
  function d(y, m, day) { return new Date(y, m, day); }

  /* обёртка: демо всегда строятся вокруг фиксированного BASE */
  function makeCalendar(spec) {
    spec = Object.assign({}, spec || {});
    if (spec.today === undefined) spec.today = BASE;
    return window.DSDatePicker.makeCalendar(spec);
  }

  /* демо-ячейка с заголовком */
  function cell(title, node, sub) {
    var c = document.createElement('div'); c.className = 'demo-cell';
    var h = document.createElement('span'); h.className = 'th'; h.innerHTML = title; c.appendChild(h);
    c.appendChild(node);
    if (sub) { var s = document.createElement('p'); s.className = 'sub'; s.textContent = sub; c.appendChild(s); }
    return c;
  }
  function mount(id, node) { var el = document.getElementById(id); if (el) el.appendChild(node); }

  /* =========================== PLAYGROUND =========================== */
  (function () {
    var controls = document.getElementById('pg-controls');
    var stage = document.getElementById('pg-stage');
    var codeEl = document.getElementById('pg-code');
    if (!controls || !stage) return;
    var state = { mode: 'single', foot: false, quick: false };

    function ctlSelect(label, options, key) {
      var wrap = document.createElement('div'); wrap.className = 'ctl';
      var l = document.createElement('div'); l.className = 'lbl'; l.textContent = label; wrap.appendChild(l);
      var box = document.createElement('div'); box.className = 'pg-select';
      var sel = document.createElement('select');
      options.forEach(function (o) { var op = document.createElement('option'); op.value = o[0]; op.textContent = o[1]; if (o[0] === state[key]) op.selected = true; sel.appendChild(op); });
      sel.addEventListener('change', function () { state[key] = sel.value; render(); });
      box.appendChild(sel); wrap.appendChild(box); return wrap;
    }
    /* Бинарная опция — селект: docs-split.js конвертирует его в свитч ДС
       (label.pg-toggle) в правую колонку; подпись свитча статична
       (DS_SPLIT_SWITCH_LABELS, правило Switch). state[key] остаётся boolean. */
    function ctlToggle(label, key) {
      var wrap = document.createElement('div'); wrap.className = 'ctl';
      var l = document.createElement('div'); l.className = 'lbl'; l.textContent = label; wrap.appendChild(l);
      var box = document.createElement('div'); box.className = 'pg-select';
      var sel = document.createElement('select');
      [['no', 'Нет'], ['yes', 'Да']].forEach(function (p) {
        var op = document.createElement('option'); op.value = p[0]; op.textContent = p[1];
        if ((p[0] === 'yes') === !!state[key]) op.selected = true;
        sel.appendChild(op);
      });
      sel.addEventListener('change', function () { state[key] = sel.value === 'yes'; render(); });
      box.appendChild(sel); wrap.appendChild(box); return wrap;
    }

    controls.appendChild(ctlSelect('Режим выбора', [['single', 'Дата'], ['range', 'Диапазон'], ['month', 'Месяц']], 'mode'));
    var quickCtl = ctlToggle('Быстрое «Сегодня»', 'quick');
    controls.appendChild(ctlToggle('Кнопки Отменить / Применить', 'foot'));
    controls.appendChild(quickCtl);

    function render() {
      quickCtl.classList.toggle('is-off', !state.foot);
      stage.innerHTML = '';
      var spec = { live: true, foot: state.foot, quick: state.foot && state.quick };
      if (state.mode === 'single') { spec.mode = 'single'; spec.selected = d(2025, 9, 15); }
      else if (state.mode === 'range') { spec.mode = 'range'; spec.rangeStart = d(2025, 9, 8); spec.rangeEnd = d(2025, 9, 21); }
      else { spec.mode = 'single'; spec.view = 'month'; }
      var cal = makeCalendar(spec);
      stage.appendChild(cal);
      var label = state.mode === 'range' ? 'mode="range"' : (state.mode === 'month' ? 'view="month"' : 'mode="single"');
      codeEl.innerHTML = '<code>.dpk · ' + label + (state.foot ? ' · footer' : '') + (state.foot && state.quick ? ' · quick=«Сегодня»' : '') + '</code>';
    }
    render();
  })();

  /* =========================== USAGE =========================== */
  mount('use-single', makeCalendar({ selected: d(2025, 9, 15), live: true }));
  mount('use-range', makeCalendar({ mode: 'range', rangeStart: d(2025, 9, 8), rangeEnd: d(2025, 9, 21), live: true }));
  mount('use-inline', makeCalendar({ inline: true, selected: d(2025, 9, 15), foot: true, quick: true, live: true }));

  /* =========================== ANATOMY =========================== */
  mount('anat-diagram', makeCalendar({ selected: d(2025, 9, 15), foot: true, quick: false }));

  /* =========================== VARIANTS: режимы =========================== */
  mount('var-single', cell('Дата — одиночный выбор', makeCalendar({ selected: d(2025, 9, 15), live: true })));
  mount('var-range', cell('Диапазон — начало и конец', makeCalendar({ mode: 'range', rangeStart: d(2025, 9, 8), rangeEnd: d(2025, 9, 21), live: true })));
  mount('var-month', cell('Месяц — выбор месяца целиком', makeCalendar({ view: 'month', live: true })));

  /* =========================== VARIANTS: представления =========================== */
  mount('var-view-day', cell('Дни', makeCalendar({ selected: d(2025, 9, 15) })));
  mount('var-view-month', cell('Месяцы', makeCalendar({ view: 'month' })));
  mount('var-view-year', cell('Годы', makeCalendar({ view: 'year' })));

  /* =========================== VARIANTS: футер =========================== */
  mount('var-foot-none', cell('Без футера — авто-применение (docked)', makeCalendar({ selected: d(2025, 9, 15) })));
  mount('var-foot-btns', cell('С кнопками — подтверждение', makeCalendar({ selected: d(2025, 9, 15), foot: true })));
  mount('var-foot-quick', cell('С быстрым «Сегодня»', makeCalendar({ selected: d(2025, 9, 15), foot: true, quick: true })));

  /* =========================== SIZES =========================== */
  mount('sizes-floating', cell('Floating — с тенью (над полем)', makeCalendar({ selected: d(2025, 9, 15) })));
  mount('sizes-inline', cell('Inline — встроенный, без тени', makeCalendar({ inline: true, selected: d(2025, 9, 15) })));

  /* =========================== CONTENT =========================== */
  mount('content-demo', makeCalendar({ selected: d(2025, 9, 15), min: d(2025, 9, 3), max: d(2025, 9, 27) }));

  /* =========================== BEHAVIOR =========================== */
  mount('beh-range', cell('Диапазон · выберите две даты', makeCalendar({ mode: 'range', rangeStart: d(2025, 9, 10), live: true }), 'Первый клик — начало, второй — конец. Клик раньше начала перезапускает выбор.'));
  mount('beh-nav', cell('Навигация · заголовок → годы → месяцы', makeCalendar({ selected: d(2025, 9, 15), live: true }), 'Стрелки листают месяцы. Клик по заголовку открывает выбор года, затем месяца.'));

  /* =========================== STATES =========================== */
  (function () {
    var g = document.getElementById('states-demo');
    if (!g) return;
    var specs = [
      ['Default', {}],
      ['Сегодня (today)', { today: d(2025, 9, 15) }],
      ['Выбрано (selected)', { selected: d(2025, 9, 15) }],
      ['Начало диапазона', { mode: 'range', rangeStart: d(2025, 9, 15) }],
      ['В диапазоне (in-range)', { mode: 'range', rangeStart: d(2025, 9, 12), rangeEnd: d(2025, 9, 20) }],
      ['Недоступно (disabled)', { selected: d(2025, 9, 15), min: d(2025, 9, 10), max: d(2025, 9, 20) }]
    ];
    specs.forEach(function (s) { g.appendChild(cell(s[0], makeCalendar(s[1]))); });
  })();

  /* =========================== TYPOGRAPHY =========================== */
  (function () {
    var tb = document.querySelector('#typo-table tbody');
    if (!tb) return;
    [
      ['Заголовок (месяц/год)', 'Октябрь 2025', '--type-body-s-strong'],
      ['Дни недели', 'Пн Вт Ср', '--type-body-xs'],
      ['Число дня', '15', '--type-body-s'],
      ['Ячейка месяца / года', 'Окт · 2025', '--type-body-s']
    ].forEach(function (r) {
      var tr = document.createElement('tr');
      var f = getComputedStyle(document.documentElement).getPropertyValue(r[2]).trim();
      tr.innerHTML = '<td>' + r[0] + '</td><td style="font:var(' + r[2] + ');">' + r[1] + '</td>'
        + '<td class="rt-tok"><code>' + r[2] + '</code></td><td class="rt-num">' + (f.match(/(\d+px)\s*\/\s*(\d+px)/) ? RegExp.$1 + ' / ' + RegExp.$2 : f) + '</td>';
      tb.appendChild(tr);
    });
  })();

  /* =========================== COLORS =========================== */
  (function () {
    var wrap = document.getElementById('color-ref');
    if (!wrap) return;
    var groups = [
      ['Поверхность', [
        ['Фон календаря', '--bg-popup'],
        ['Тень (floating)', '--elevation-5'],
        ['Рамка (inline)', '--border-light'],
        ['Радиус', '--radius-m']
      ]],
      ['Дни и статусы', [
        ['Число дня', '--text-primary'],
        ['Дни недели / соседний месяц', '--text-inactive'],
        ['Ховер дня', '--bgtable-row-hover'],
        ['Сегодня (обводка)', '--primary'],
        ['Выбрано / концы диапазона (фон)', '--primary'],
        ['В диапазоне (полоса)', '--primary-bg'],
        ['Недоступно', '--st-disabled']
      ]]
    ];
    var probe = document.createElement('span'); document.body.appendChild(probe);
    function hex(tok) {
      probe.style.color = 'var(' + tok + ')';
      var m = getComputedStyle(probe).color.match(/\d+(\.\d+)?/g) || [];
      if (m.length < 3) return '';
      var h = function (n) { return Math.round(+n).toString(16).padStart(2, '0').toUpperCase(); };
      return '#' + h(m[0]) + h(m[1]) + h(m[2]) + (m[3] != null && +m[3] < 1 ? ' · ' + Math.round(+m[3] * 100) + '%' : '');
    }
    groups.forEach(function (grp) {
      var gr = document.createElement('div'); gr.className = 'cref-group';
      gr.innerHTML = '<h3>' + grp[0] + '</h3>';
      var rw = document.createElement('div'); rw.className = 'cref-rows';
      grp[1].forEach(function (row) {
        var isColor = /color|bg|primary|text|border|disabled|hover/.test(row[1]);
        var r = document.createElement('div'); r.className = 'cref-row';
        r.innerHTML = '<span class="cref-sw"><span class="cf" style="background:var(' + row[1] + ');"></span></span>'
          + '<span class="cref-meta"><p class="role">' + row[0] + '</p><p class="tname">' + row[1] + '</p></span>'
          + '<span class="cref-hex">' + (isColor ? hex(row[1]) : '') + '</span>';
        rw.appendChild(r);
      });
      gr.appendChild(rw); wrap.appendChild(gr);
    });
    probe.remove();
  })();

  /* =========================== REDLINE =========================== */
  (function () {
    var tb = document.querySelector('#dev-spec-table');
    if (!tb) return;
    var holder = document.createElement('div');
    holder.style.cssText = 'position:absolute; left:-9999px; top:0; visibility:hidden;';
    document.body.appendChild(holder);
    var cal = makeCalendar({ selected: d(2025, 9, 15), foot: true, quick: true });
    holder.appendChild(cal);
    var cs = getComputedStyle(cal);
    var head = getComputedStyle(cal.querySelector('.dpk__head'));
    var day = getComputedStyle(cal.querySelector('.dpk__day'));
    var num = getComputedStyle(cal.querySelector('.dpk__daynum'));
    var wd = getComputedStyle(cal.querySelector('.dpk__weekday'));
    [
      ['Ширина контейнера', cal.getBoundingClientRect().width.toFixed(0) + 'px'],
      ['Паддинг контейнера', cs.padding],
      ['Радиус контейнера', cs.borderRadius],
      ['Высота шапки', head.height],
      ['Ячейка дня', day.width + ' × ' + day.height],
      ['Кружок числа', num.width + ' × ' + num.height],
      ['Высота дней недели', wd.height],
      ['Шрифт числа', num.fontSize + ' / ' + num.lineHeight]
    ].forEach(function (r) {
      var row = document.createElement('div'); row.className = 'tbl__row'; row.style.gridTemplateColumns = '8px 1.84fr 0.81fr 8px';
      row.innerHTML = '<div class="tc tc--separator"></div><div class="tc"><span class="tc__row"><span class="tc__text">' + r[0] + '</span></span></div><div class="tc tc--numbers"><span class="tc__row"><span class="tc__text">' + r[1] + '</span></span></div><div class="tc tc--separator"></div>';
      tb.appendChild(row);
    });
    holder.remove();
  })();

  /* =========================== COPY BUTTONS =========================== */
  document.querySelectorAll('.code-panel__copy').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var code = document.getElementById(btn.dataset.copyTarget);
      if (!code) return;
      navigator.clipboard.writeText(code.textContent).then(function () {
        btn.classList.add('is-copied');
        btn.querySelector('.copy-label').textContent = 'Скопировано';
        setTimeout(function () { btn.classList.remove('is-copied'); btn.querySelector('.copy-label').textContent = 'Копировать'; }, 1600);
      });
    });
  });
})();
