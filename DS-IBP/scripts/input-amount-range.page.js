/* =========================================================================
   InputAmountRange documentation — интерактивные демо.
   Требует: icons-data.js и input-kit.js подключены ДО этого файла.
   ========================================================================= */
(function () {
  'use strict';
  const K = window.DSInputKit;
  const range = (spec) => K.makeRange(Object.assign({ kind: 'amount' }, spec));

  const STATES = [
    ['Default', 'default'], ['Hover', 'hover'], ['Focus', 'focus'],
    ['Error', 'error'], ['ErrorFocus', 'error-focus'],
    ['Warning', 'warning'], ['WarningFocus', 'warning-focus'],
    ['Disabled', 'disabled'],
  ];
  const WARN_TIP = 'Указана информация, которая не блокирует действие, но требует внимания пользователя, например выдача средств в выходной день';

  function cell(title, node, sub) {
    const c = document.createElement('div'); c.className = 'demo-cell';
    const h = document.createElement('span'); h.className = 'th'; h.innerHTML = title; c.appendChild(h);
    c.appendChild(node);
    if (sub) { const s = document.createElement('p'); s.className = 'sub'; s.textContent = sub; c.appendChild(s); }
    return c;
  }

  /* спека поля для заданного состояния */
  function fieldSpec(st, value, opts) {
    opts = opts || {};
    return Object.assign({
      state: st,
      value: value,
      tip: st === 'error-focus' ? 'Текст ошибки' : (st === 'warning-focus' ? WARN_TIP : null),
    }, opts);
  }

  /* =========================== PLAYGROUND =========================== */
  (function () {
    const state = { left: 'default', right: 'default', fill: 'value', label: true, helper: true };
    const controls = document.getElementById('pg-controls');
    const stage = document.getElementById('pg-stage');
    const codeEl = document.getElementById('pg-code');
    if (!controls || !stage) return;

    function ctlSelect(label, options, key, keep) {
      const wrap = document.createElement('div'); wrap.className = 'ctl';
      if (keep) wrap.dataset.pgKeepSelect = '';
      const l = document.createElement('div'); l.className = 'lbl'; l.textContent = label; wrap.appendChild(l);
      const box = document.createElement('div'); box.className = 'pg-select';
      const sel = document.createElement('select');
      options.forEach(([v, t]) => { const op = document.createElement('option'); op.value = v; op.textContent = t; if (v === state[key]) op.selected = true; sel.appendChild(op); });
      sel.addEventListener('change', () => { state[key] = sel.value; render(); });
      box.appendChild(sel); wrap.appendChild(box); return wrap;
    }
    /* Бинарная опция — селект: docs-split.js конвертирует его в свитч ДС
       (label.pg-toggle) в правую колонку; подпись свитча статична
       (DS_SPLIT_SWITCH_LABELS, правило Switch). state[key] остаётся boolean. */
    function ctlToggle(label, key) {
      const wrap = document.createElement('div'); wrap.className = 'ctl';
      const l = document.createElement('div'); l.className = 'lbl'; l.textContent = label; wrap.appendChild(l);
      const box = document.createElement('div'); box.className = 'pg-select';
      const sel = document.createElement('select');
      [['no', 'Нет'], ['yes', 'Да']].forEach(([v, t]) => {
        const op = document.createElement('option'); op.value = v; op.textContent = t;
        if ((v === 'yes') === !!state[key]) op.selected = true;
        sel.appendChild(op);
      });
      sel.addEventListener('change', () => { state[key] = sel.value === 'yes'; render(); });
      box.appendChild(sel); wrap.appendChild(box); return wrap;
    }

    const stOpts = STATES.map(([t, v]) => [v, t]);
    controls.appendChild(ctlSelect('Поле «От» (левое)', stOpts, 'left', true));
    controls.appendChild(ctlSelect('Поле «До» (правое)', stOpts, 'right', true));
    controls.appendChild(ctlSelect('Наполнение', [['value', 'Заполнено'], ['empty', 'Пусто']], 'fill'));
    controls.appendChild(ctlToggle('Label', 'label'));
    controls.appendChild(ctlToggle('Helper', 'helper'));

    function render() {
      const disabled = state.left === 'disabled' && state.right === 'disabled';
      const val = state.fill === 'value' ? '9 999' : null;
      stage.innerHTML = '';
      stage.appendChild(range({
        label: state.label ? 'Label' : null,
        helper: state.helper ? 'Helper' : null,
        disabled,
        width: 380,
        from: fieldSpec(state.left, val, { live: true, id: 'pg-from' }),
        to: fieldSpec(state.right, val, { live: true, id: 'pg-to' }),
      }));
      const cls = ['.inp-range'];
      if (disabled) cls.push('inp-range--disabled');
      codeEl.innerHTML = '<code>' + cls.join('.') + '</code> · поля: <code>.inp</code> × 2 + <code>.inp-range__line</code>';
    }
    render();
  })();

  /* =========================== USAGE =========================== */
  (function () {
    const form = document.getElementById('use-form');
    if (form) form.appendChild(range({ label: 'Сумма сделки, ₽', helper: 'Диапазон «от» и «до»', from: { value: '100 000', live: true }, to: { value: '5 000 000', live: true } }));
    const empty = document.getElementById('use-empty');
    if (empty) empty.appendChild(range({ label: 'Сумма, ₽', helper: 'Оба поля опциональны', from: { live: true }, to: { live: true } }));
    const one = document.getElementById('use-one');
    if (one) one.appendChild(range({ label: 'Сумма, ₽', helper: 'Открытая граница — заполнено одно поле', from: { value: '250 000', live: true }, to: { live: true } }));
  })();

  /* =========================== ANATOMY =========================== */
  (function () {
    const el = document.getElementById('anat-diagram');
    if (!el) return;
    el.appendChild(range({ label: 'Label', helper: 'Helper', width: 420, from: { value: '9 999' }, to: { value: '9 999' } }));
  })();

  /* =========================== VARIANTS =========================== */
  (function () {
    const g = document.getElementById('var-helper');
    if (g) {
      g.appendChild(cell('Helper — нет', range({ label: 'Label', from: { value: '9 999' }, to: { value: '9 999' } })));
      g.appendChild(cell('Helper — да', range({ label: 'Label', helper: 'Helper', from: { value: '9 999' }, to: { value: '9 999' } })));
    }
    const gf = document.getElementById('var-fill');
    if (gf) {
      gf.appendChild(cell('Пусто', range({ label: 'Label', helper: 'Helper', from: { live: true }, to: { live: true } })));
      gf.appendChild(cell('Одно поле', range({ label: 'Label', helper: 'Helper', from: { value: '9 999', live: true }, to: { live: true } })));
      gf.appendChild(cell('Оба поля', range({ label: 'Label', helper: 'Helper', from: { value: '9 999', live: true }, to: { value: '9 999', live: true } })));
    }
  })();

  /* =========================== SIZES =========================== */
  (function () {
    const g = document.getElementById('sizes-demo');
    if (!g) return;
    const m = cell('M — единственный размер', range({ label: 'Label', helper: 'Helper', from: { value: '9 999' }, to: { value: '9 999' } }));
    m.insertBefore(Object.assign(document.createElement('span'), { className: 'size-badge', textContent: 'высота поля 40px · текст Body M' }), m.children[1]);
    g.appendChild(m);
  })();

  /* =========================== CONTENT =========================== */
  (function () {
    const g = document.getElementById('content-demo');
    if (!g) return;
    g.appendChild(cell('Префикс всегда присутствует', range({ label: 'Сумма, ₽', helper: 'Префиксы «От» / «До» неизменяемы', from: { value: '9 999', live: true }, to: { value: '9 999', live: true } })));
    g.appendChild(cell('Пустое поле — без плейсхолдера', range({ label: 'Сумма, ₽', helper: 'Helper', from: { live: true }, to: { live: true } })));
  })();

  /* =========================== BEHAVIOR =========================== */
  (function () {
    const g = document.getElementById('beh-independent');
    if (!g) return;
    g.appendChild(cell('Поля независимы — левое в ошибке, правое в норме',
      range({ label: 'Label', helper: 'Helper', from: fieldSpec('error', '9 999'), to: { value: '9 999' } })));
    g.appendChild(cell('Оба поля могут быть в ошибке одновременно',
      range({ label: 'Label', helper: 'Helper', from: fieldSpec('error', '9 999'), to: fieldSpec('error', '9 999') })));
  })();

  /* =========================== STATES =========================== */
  (function () {
    const g = document.getElementById('states-demo');
    if (!g) return;
    STATES.forEach(([title, st]) => {
      if (st === 'disabled') {
        g.appendChild(cell(title, range({ label: 'Label', helper: 'Helper', disabled: true, from: { state: 'disabled', value: '9 999' }, to: { state: 'disabled', value: '9 999' } })));
      } else {
        g.appendChild(cell(title, range({
          label: 'Label',
          helper: 'Helper',
          from: fieldSpec(st, '9 999'),
          to: { value: '9 999' },
        })));
      }
    });
  })();

  /* =========================== TYPOGRAPHY =========================== */
  (function () {
    const tb = document.querySelector('#typo-table tbody');
    if (!tb) return;
    [
      ['Значение поля', '9 999', '--type-body-m'],
      ['Префикс «От» / «До»', 'От', '--type-body-m'],
      ['Label', 'Label', '--type-body-xs'],
      ['Helper', 'Helper', '--type-body-xs'],
    ].forEach(([part, sample, token]) => {
      const tr = document.createElement('tr');
      const f = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
      tr.innerHTML = '<td>' + part + '</td><td style="font:var(' + token + ');">' + sample + '</td>'
        + '<td class="rt-tok"><code>' + token + '</code></td><td class="rt-num">' + (f.match(/(\d+px)\s*\/\s*(\d+px)/) ? RegExp.$1 + ' / ' + RegExp.$2 : f) + '</td>';
      tb.appendChild(tr);
    });
  })();

  /* =========================== COLORS =========================== */
  (function () {
    const wrap = document.getElementById('color-ref');
    if (!wrap) return;
    const groups = [
      ['Поле', [
        ['Фон поля', '--bg-tile'],
        ['Рамка / Range_Line', '--border-primary'],
        ['Рамка · hover/focus', '--primary'],
        ['Фон · disabled', '--st-disabled-light'],
        ['Range_Line · disabled', '--border-light'],
        ['Иконки в поле', '--secondary'],
      ]],
      ['Текст и статусы', [
        ['Значение', '--text-primary'],
        ['Префикс / плейсхолдер', '--text-inactive'],
        ['Рамка · Error', '--error'],
        ['Рамка · Warning', '--warning'],
      ]],
    ];
    const probe = document.createElement('span'); document.body.appendChild(probe);
    function hex(tok) {
      probe.style.color = 'var(' + tok + ')';
      const m = getComputedStyle(probe).color.match(/\d+(\.\d+)?/g) || [];
      if (m.length < 3) return '';
      const h = (n) => Math.round(+n).toString(16).padStart(2, '0').toUpperCase();
      return '#' + h(m[0]) + h(m[1]) + h(m[2]) + (m[3] != null && +m[3] < 1 ? ' · ' + Math.round(+m[3] * 100) + '%' : '');
    }
    groups.forEach(([name, rows]) => {
      const gr = document.createElement('div'); gr.className = 'cref-group';
      gr.innerHTML = '<h3>' + name + '</h3>';
      const rw = document.createElement('div'); rw.className = 'cref-rows';
      rows.forEach(([role, tok]) => {
        const r = document.createElement('div'); r.className = 'cref-row';
        r.innerHTML = '<span class="cref-sw"><span class="cf" style="background:var(' + tok + ');"></span></span>'
          + '<span class="cref-meta"><p class="role">' + role + '</p><p class="tname">' + tok + '</p></span>'
          + '<span class="cref-hex">' + hex(tok) + '</span>';
        rw.appendChild(r);
      });
      gr.appendChild(rw); wrap.appendChild(gr);
    });
    probe.remove();
  })();

  /* =========================== REDLINE =========================== */
  (function () {
    const tb = document.querySelector('#dev-spec-table');
    if (!tb) return;
    const holder = document.createElement('div');
    holder.style.cssText = 'position:absolute; left:-9999px; top:0; visibility:hidden;';
    document.body.appendChild(holder);
    const r = range({ label: 'L', helper: 'H', from: { value: '9 999' }, to: { value: '9 999' } });
    holder.appendChild(r);
    const ff = getComputedStyle(r._from._field);
    const line = getComputedStyle(r._row.querySelector('.inp-range__line'));
    const bar = getComputedStyle(r._row.querySelector('.inp-range__line'), '::before');
    [
      ['Высота поля', ff.height],
      ['Паддинг поля горизонтальный', ff.paddingLeft],
      ['Зазор между элементами поля', ff.columnGap],
      ['Радиус поля', ff.borderRadius],
      ['Рамка поля', ff.borderTopWidth + ' solid'],
      ['Range_Line — ширина зоны', line.width],
      ['Range_Line — толщина линии', bar.height || '1px'],
      ['Иконки действий', '20px'],
      ['Мин. ширина поля', 'от контента (' + ff.minWidth + ')'],
      ['Отступ метки → поля / поля → хелпер', '4px'],
    ].forEach(([p, v]) => {
      const row = document.createElement('div'); row.className = 'tbl__row'; row.style.gridTemplateColumns = '8px 1.84fr 0.55fr 8px';
      row.innerHTML = '<div class="tc tc--separator"></div><div class="tc"><span class="tc__row"><span class="tc__text">' + p + '</span></span></div><div class="tc tc--numbers"><span class="tc__row"><span class="tc__text">' + v + '</span></span></div><div class="tc tc--separator"></div>';
      tb.appendChild(row);
    });
    holder.remove();
  })();

  /* =========================== COPY BUTTONS =========================== */
  document.querySelectorAll('.code-panel__copy').forEach(btn => {
    btn.addEventListener('click', () => {
      const code = document.getElementById(btn.dataset.copyTarget);
      if (!code) return;
      navigator.clipboard.writeText(code.textContent).then(() => {
        btn.classList.add('is-copied');
        btn.querySelector('.copy-label').textContent = 'Скопировано';
        setTimeout(() => { btn.classList.remove('is-copied'); btn.querySelector('.copy-label').textContent = 'Копировать'; }, 1600);
      });
    });
  });
})();
