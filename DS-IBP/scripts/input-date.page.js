/* =========================================================================
   InputDate documentation — интерактивные демо.
   Требует: icons-data.js и input-kit.js подключены ДО этого файла.
   ========================================================================= */
(function () {
  'use strict';
  const K = window.DSInputKit;
  const mk = K.makeInput;
  const MASK = 'ММ.ДД.ГГГГ';

  /* маска даты: цифры + автоточки */
  function attachMask(ctl) {
    ctl.setAttribute('inputmode', 'numeric');
    ctl.addEventListener('input', () => {
      const d = ctl.value.replace(/\D/g, '').slice(0, 8);
      let out = d.slice(0, 2);
      if (d.length > 2) out += '.' + d.slice(2, 4);
      if (d.length > 4) out += '.' + d.slice(4, 8);
      ctl.value = out;
    });
  }
  function mkDate(spec) {
    const node = mk(Object.assign({ calendar: true, placeholder: spec.value ? null : MASK }, spec));
    attachMask(node._control);
    return node;
  }

  function cell(title, node, sub) {
    const c = document.createElement('div'); c.className = 'demo-cell';
    const h = document.createElement('span'); h.className = 'th'; h.innerHTML = title; c.appendChild(h);
    c.appendChild(node);
    if (sub) { const s = document.createElement('p'); s.className = 'sub'; s.textContent = sub; c.appendChild(s); }
    return c;
  }

  /* =========================== PLAYGROUND =========================== */
  (function () {
    const state = { size: 'm', state: 'default', fill: 'value', label: true, helper: true, informer: false };
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

    controls.appendChild(ctlSelect('Размер', [['m', 'M'], ['s', 'S (Table Edit)']], 'size'));
    controls.appendChild(ctlSelect('Состояние', [
      ['default', 'Default'], ['hover', 'Hover'], ['focus', 'Focus'],
      ['error', 'Error'], ['error-focus', 'ErrorFocus'],
      ['warning', 'Warning'], ['warning-focus', 'WarningFocus'],
      ['disabled', 'Disabled'],
    ], 'state', true));
    controls.appendChild(ctlSelect('Наполнение', [['empty', 'Маска'], ['value', 'Заполнено']], 'fill'));
    const labelCtl = ctlToggle('Label', 'label');
    const helperCtl = ctlToggle('Helper', 'helper');
    controls.appendChild(labelCtl);
    controls.appendChild(ctlToggle('Информер', 'informer'));
    controls.appendChild(helperCtl);

    function render() {
      const table = state.size === 's';
      [labelCtl, helperCtl].forEach(c => c.classList.toggle('is-off', table));
      stage.innerHTML = '';
      stage.appendChild(mkDate({
        size: state.size,
        table,
        lead: table,
        state: state.state,
        label: !table && state.label ? 'Label' : null,
        helper: !table && state.helper ? 'Helper' : null,
        informer: state.informer,
        value: state.fill === 'value' ? '12.21.2022' : null,
        tip: state.state === 'error-focus' ? 'Текст ошибки' : (state.state === 'warning-focus' ? 'Указана информация, которая не блокирует действие, но требует внимания пользователя' : null),
        live: true,
        width: 260,
        id: 'pg-input',
      }));
      const cls = ['.inp', 'inp--' + state.size];
      if (state.state.startsWith('error')) cls.push('inp--error');
      if (state.state.startsWith('warning')) cls.push('inp--warning');
      if (state.state === 'disabled') cls.push('inp--disabled');
      if (state.state === 'hover') cls.push('is-hover');
      if (state.state === 'focus' || state.state.endsWith('-focus')) cls.push('is-focus');
      codeEl.innerHTML = '<code>' + cls.join('.') + '</code>';
    }
    render();
  })();

  /* =========================== USAGE =========================== */
  (function () {
    const form = document.getElementById('use-form');
    if (form) form.appendChild(mkDate({ label: 'Дата подписания', helper: 'Не раньше даты договора', clear: false, live: true, width: 260 }));
    const filled = document.getElementById('use-filled');
    if (filled) filled.appendChild(mkDate({ label: 'Плановая дата транша', helper: 'Helper', value: '12.21.2022', live: true, width: 260 }));
    const table = document.getElementById('use-table');
    if (table) table.appendChild(mkDate({ size: 's', table: true, lead: true, clear: false, live: true, width: 220 }));
  })();

  /* =========================== ANATOMY =========================== */
  (function () {
    const el = document.getElementById('anat-diagram');
    if (!el) return;
    el.appendChild(mkDate({ label: 'Label', helper: 'Helper', informer: true, value: '12.21.2022', width: 280 }));
  })();

  /* =========================== VARIANTS =========================== */
  (function () {
    const g = document.getElementById('var-helper');
    if (g) {
      g.appendChild(cell('Helper — нет', mkDate({ label: 'Label', clear: false })));
      g.appendChild(cell('Helper — да', mkDate({ label: 'Label', helper: 'Helper', clear: false })));
    }
    const gi = document.getElementById('var-informer');
    if (gi) {
      gi.appendChild(cell('Без информера (по умолчанию)', mkDate({ label: 'Label', value: '12.21.2022' })));
      gi.appendChild(cell('С информером', mkDate({ label: 'Label', value: '12.21.2022', informer: true })));
    }
    const gt = document.getElementById('var-table');
    if (gt) {
      gt.appendChild(cell('Default', mkDate({ size: 's', table: true, lead: true, clear: false, live: true })));
      gt.appendChild(cell('Error', mkDate({ size: 's', table: true, lead: true, state: 'error', clear: false })));
      gt.appendChild(cell('Disabled', mkDate({ size: 's', table: true, lead: true, state: 'disabled', clear: false })));
    }
  })();

  /* =========================== SIZES =========================== */
  (function () {
    const g = document.getElementById('sizes-demo');
    if (!g) return;
    const m = cell('M — основной', mkDate({ label: 'Label', helper: 'Helper', value: '01.01.2021' }));
    m.insertBefore(Object.assign(document.createElement('span'), { className: 'size-badge', textContent: 'высота 40px · текст Body M' }), m.children[1]);
    const s = cell('S — Table Edit', mkDate({ size: 's', table: true, value: '01.01.2021' }));
    s.insertBefore(Object.assign(document.createElement('span'), { className: 'size-badge', textContent: 'высота 32px · текст Body S' }), s.children[1]);
    g.appendChild(m); g.appendChild(s);
  })();

  /* =========================== CONTENT =========================== */
  (function () {
    const g = document.getElementById('content-demo');
    if (!g) return;
    g.appendChild(cell('Пустое поле — маска-плейсхолдер', mkDate({ label: 'Дата подписания', helper: 'Helper', clear: false, live: true })));
    g.appendChild(cell('Заполненное поле', mkDate({ label: 'Дата подписания', helper: 'Helper', value: '12.21.2022', live: true })));
  })();

  /* =========================== BEHAVIOR =========================== */
  (function () {
    const g = document.getElementById('beh-mask');
    if (!g) return;
    const node = mkDate({ label: 'Label', helper: 'Вводите цифры — точки подставятся сами', clear: false, live: true, width: 280 });
    g.appendChild(cell('Маска · живой ввод', node, 'Попробуйте: «12212022» → «12.21.2022».'));
  })();

  /* календарь по кнопке — живой DatePicker (ds-datepicker.js) */
  (function () {
    const g = document.getElementById('beh-picker');
    if (!g) return;
    g.appendChild(cell('Кнопка-календарь · живой выбор', mkDate({ label: 'Дата подписания', helper: 'Нажмите на иконку календаря', value: '10.15.2025', live: true, width: 280 }), 'Клик по календарю поднимает DatePicker; выбор даты пишет её в поле.'));
  })();

  /* =========================== STATES =========================== */
  (function () {
    const g = document.getElementById('states-demo');
    if (!g) return;
    [
      ['Default', 'default'], ['Hover', 'hover'], ['Focus', 'focus'],
      ['Error', 'error'], ['ErrorFocus', 'error-focus'],
      ['Warning', 'warning'], ['WarningFocus', 'warning-focus'],
      ['Disabled', 'disabled'],
    ].forEach(([title, st]) => {
      g.appendChild(cell(title, mkDate({
        label: 'Label',
        helper: 'Helper',
        value: '12.21.2022',
        state: st,
        informer: st === 'disabled',
        tip: st === 'error-focus' ? 'Текст ошибки' : (st === 'warning-focus' ? 'Указана информация, которая не блокирует действие, но требует внимания пользователя' : null),
      })));
    });
  })();

  (function () {
    const g = document.getElementById('states-fill');
    if (!g) return;
    g.appendChild(cell('Пусто', mkDate({ label: 'Label', helper: 'Helper', clear: false, informer: true })));
    g.appendChild(cell('Заполнено', mkDate({ label: 'Label', helper: 'Helper', value: '12.21.2022', informer: true })));
  })();

  /* =========================== TYPOGRAPHY =========================== */
  (function () {
    const tb = document.querySelector('#typo-table tbody');
    if (!tb) return;
    [
      ['Значение · M', '12.21.2022', '--type-body-m'],
      ['Значение · S (Table Edit)', '12.21.2022', '--type-body-s'],
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
        ['Рамка', '--border-primary'],
        ['Рамка · hover/focus', '--primary'],
        ['Фон · disabled', '--st-disabled-light'],
      ]],
      ['Текст и статусы', [
        ['Значение', '--text-primary'],
        ['Маска-плейсхолдер', '--text-inactive'],
        ['Иконки (календарь / крестик)', '--secondary'],
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
    const m = mkDate({ label: 'L', helper: 'H', value: '12.21.2022' });
    const s = mkDate({ size: 's', table: true, value: '12.21.2022' });
    holder.appendChild(m); holder.appendChild(s);
    const fm = getComputedStyle(m._field), fs = getComputedStyle(s._field);
    [
      ['Высота поля', fm.height, fs.height],
      ['Паддинг горизонтальный', fm.paddingLeft, fs.paddingLeft],
      ['Зазор между элементами', fm.columnGap, fs.columnGap],
      ['Радиус', fm.borderRadius, fs.borderRadius],
      ['Рамка', fm.borderTopWidth + ' solid', fs.borderTopWidth + ' solid'],
      ['Шрифт значения', fm.fontSize + ' / ' + fm.lineHeight, fs.fontSize + ' / ' + fs.lineHeight],
      ['Иконки действий', '20px', '18px'],
      ['Отступ метки → поле / поле → хелпер', '4px', '—'],
    ].forEach(([p, vm, vs]) => {
      const row = document.createElement('div'); row.className = 'tbl__row'; row.style.gridTemplateColumns = '8px 1.84fr 0.55fr 1.08fr 8px';
      row.innerHTML = '<div class="tc tc--separator"></div><div class="tc"><span class="tc__row"><span class="tc__text">' + p + '</span></span></div><div class="tc tc--numbers"><span class="tc__row"><span class="tc__text">' + vm + '</span></span></div><div class="tc tc--numbers"><span class="tc__row"><span class="tc__text">' + vs + '</span></span></div><div class="tc tc--separator"></div>';
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
