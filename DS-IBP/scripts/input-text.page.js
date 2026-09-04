/* =========================================================================
   InputText documentation — интерактивные демо.
   Требует: icons-data.js и input-kit.js подключены ДО этого файла.
   ========================================================================= */
(function () {
  'use strict';
  const K = window.DSInputKit;
  const mk = K.makeInput;

  /* =========================== PLAYGROUND =========================== */
  (function () {
    const state = { size: 'm', state: 'default', fill: 'value', label: true, helper: true, prefix: false, postfix: false, lead: false, informer: false, multiline: false, resizable: false };
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
    controls.appendChild(ctlSelect('Наполнение', [['empty', 'Пусто'], ['placeholder', 'Плейсхолдер'], ['value', 'Заполнено']], 'fill'));
    const labelCtl = ctlToggle('Label', 'label');
    const helperCtl = ctlToggle('Helper', 'helper');
    const resizableCtl = ctlToggle('Resize', 'resizable');
    controls.appendChild(labelCtl);
    controls.appendChild(ctlToggle('Префикс', 'prefix'));
    controls.appendChild(ctlToggle('Постфикс', 'postfix'));
    controls.appendChild(ctlToggle('Иконка слева', 'lead'));
    controls.appendChild(ctlToggle('Иконка справа', 'informer'));
    controls.appendChild(ctlToggle('Многострочный', 'multiline'));
    controls.appendChild(helperCtl);
    controls.appendChild(resizableCtl);

    function render() {
      const table = state.size === 's';
      /* неактуальные контролы: у Table Edit нет label/helper */
      [labelCtl, helperCtl].forEach(c => c.classList.toggle('is-off', table));
      resizableCtl.classList.toggle('is-off', !state.multiline);
      stage.innerHTML = '';
      const spec = {
        size: state.size,
        table,
        state: state.state,
        label: !table && state.label ? 'Label' : null,
        helper: !table && state.helper ? 'Helper' : null,
        prefix: state.prefix ? 'Pref' : null,
        postfix: state.postfix ? 'Postf' : null,
        lead: state.lead,
        informer: state.informer,
        multiline: state.multiline,
        resizable: state.multiline && state.resizable,
        value: state.fill === 'value' ? (state.multiline ? 'Многострочный вариант поля InputText' : 'Text') : null,
        placeholder: state.fill === 'placeholder' ? 'Плейсхолдер' : null,
        tip: state.state === 'error-focus' ? 'Текст ошибки' : (state.state === 'warning-focus' ? 'Указана информация, которая не блокирует действие, но требует внимания пользователя' : null),
        live: true,
        width: 280,
        id: 'pg-input',
      };
      stage.appendChild(mk(spec));
      const cls = ['inp', 'inp--' + state.size];
      if (state.state.startsWith('error')) cls.push('inp--error');
      if (state.state.startsWith('warning')) cls.push('inp--warning');
      if (state.state === 'disabled') cls.push('inp--disabled');
      if (state.state === 'hover') cls.push('is-hover');
      if (state.state === 'focus' || state.state.endsWith('-focus')) cls.push('is-focus');
      if (state.multiline) cls.push('inp--multiline');
      if (state.multiline && state.resizable) cls.push('inp--resizable');
      codeEl.innerHTML = '<code>' + cls.join('.').replace(/^inp/, '.inp') + '</code>';
    }
    render();
  })();

  /* =========================== USAGE =========================== */
  (function () {
    const form = document.getElementById('use-form');
    if (form) form.appendChild(mk({ label: 'Наименование сделки', helper: 'Отображается в реестре', value: 'Кредитная линия · ЮгСтрой', width: 280, live: true }));

    const table = document.getElementById('use-table');
    if (table) {
      const t = document.createElement('div'); t.className = 'tbl-demo';
      t.innerHTML = '<div class="tbl-demo__row tbl-demo__row--head"><div></div><div class="tbl-demo__cell">Контрагент</div><div class="tbl-demo__cell">Комментарий</div><div></div></div>';
      const row = document.createElement('div'); row.className = 'tbl-demo__row';
      row.innerHTML = '<div></div><div class="tbl-demo__cell" style="font:var(--type-body-s);">ООО ЮгСтрой</div><div class="tbl-demo__cell"></div><div></div>';
      row.children[2].appendChild(mk({ size: 's', table: true, value: 'Text', width: 'auto', live: true }));
      row.children[2].firstChild.style.width = '100%';
      t.appendChild(row);
      table.appendChild(t);
    }

    const amount = document.getElementById('use-amount');
    if (amount) amount.appendChild(mk({ label: 'Сумма сделки', helper: 'Лимит — 5 000 000,00', value: '1 234 567,00', postfix: 'RUB', width: 280, live: true }));
  })();

  /* =========================== ANATOMY =========================== */
  (function () {
    const el = document.getElementById('anat-diagram');
    if (!el) return;
    el.appendChild(mk({ label: 'Label', helper: 'Helper', prefix: 'Pref', postfix: 'Postf', lead: true, informer: true, value: 'Text', width: 300 }));
  })();

  /* =========================== VARIANTS =========================== */
  function cell(title, node, sub) {
    const c = document.createElement('div'); c.className = 'demo-cell';
    const h = document.createElement('span'); h.className = 'th'; h.innerHTML = title; c.appendChild(h);
    c.appendChild(node);
    if (sub) { const s = document.createElement('p'); s.className = 'sub'; s.textContent = sub; c.appendChild(s); }
    return c;
  }

  (function () {
    const g = document.getElementById('var-content');
    if (!g) return;
    g.appendChild(cell('Только текст', mk({ label: 'Label', value: 'Text', live: true })));
    g.appendChild(cell('Префикс + постфикс', mk({ label: 'Label', prefix: 'Pref', postfix: 'Postf', value: 'Text', live: true })));
    g.appendChild(cell('Иконка слева', mk({ label: 'Label', lead: true, placeholder: 'Поиск…', clear: false, live: true })));
    g.appendChild(cell('Иконка справа', mk({ label: 'Label', value: 'Text', informer: true, live: true })));
  })();

  (function () {
    const g = document.getElementById('var-multiline');
    if (!g) return;
    g.appendChild(cell('Многострочный', mk({ label: 'Label', helper: 'Helper', multiline: true, value: 'Многострочный вариант поля InputText', live: true })));
    g.appendChild(cell('Многострочный · пустой', mk({ label: 'Label', multiline: true, placeholder: 'Комментарий к сделке', clear: false, live: true })));
    g.appendChild(cell('Многострочный · с изменением размера', mk({ label: 'Label', helper: 'Потяните за правый нижний угол поля', multiline: true, resizable: true, value: 'Поле растягивается по высоте стандартно, а также вручную потянув за угол', live: true })));
  })();

  (function () {
    const g = document.getElementById('var-amount');
    if (!g) return;
    /* живой InputAmount с форматированием разрядов */
    const node = mk({ label: 'Сумма', helper: 'Разряды по 3 знака, децималы — 2', prefix: 'От', postfix: 'RUB', value: '1 234 567,00', live: true });
    const ctl = node._control;
    ctl.addEventListener('input', () => {
      let raw = ctl.value.replace(/[^\d.,-]/g, '').replace(/\./g, ',');
      const parts = raw.split(',');
      let int = parts[0].replace(/\s/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
      ctl.value = parts.length > 1 ? int + ',' + parts.slice(1).join('').slice(0, 2) : int;
    });
    ctl.addEventListener('blur', () => {
      let v = ctl.value.replace(/\u00A0/g, '');
      if (!v) return;
      let [int, dec] = v.split(',');
      int = String(parseInt(int, 10) || 0).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
      ctl.value = dec != null && dec.replace(/0+$/, '') === '' && dec.length ? int + ',' + dec.slice(0, 2)
        : dec ? int + ',' + dec.replace(/0+$/, '').slice(0, 2) || int
        : int;
    });
    g.appendChild(cell('InputAmount · живой ввод', node, 'Печатайте: буквы игнорируются, точка становится запятой.'));
    g.appendChild(cell('Disabled', mk({ label: 'Сумма', helper: 'Helper', postfix: 'RUB', value: '1 234 567,00', state: 'disabled' })));
  })();

  (function () {
    const g = document.getElementById('var-password');
    if (!g) return;
    g.appendChild(cell('Пароль · скрыт', mk({ label: 'Пароль', helper: 'Не короче 8 символов', password: true, value: 'sup3rSecret', live: true }), 'Действие справа — «показать/скрыть» вместо крестика очистки.'));
    g.appendChild(cell('Пароль · пусто', mk({ label: 'Пароль', helper: 'Не короче 8 символов', password: true, placeholder: 'Введите пароль', live: true })));
  })();

  (function () {
    const g = document.getElementById('var-counter');
    if (!g) return;
    g.appendChild(cell('Ограничение длины · однострочный', mk({ label: 'Заголовок', helper: 'Отображается в реестре', maxLength: 40, value: 'Кредитная линия ЮгСтрой', live: true })));
    g.appendChild(cell('Ограничение длины · многострочный', mk({ label: 'Комментарий', multiline: true, maxLength: 140, value: 'Выдача средств согласована с казначейством', live: true })));
  })();

  (function () {
    const g = document.getElementById('var-table');
    if (!g) return;
    const grid = document.createElement('div'); grid.className = 'demo-grid';
    grid.appendChild(cell('Default', mk({ size: 's', table: true, value: 'Text', live: true })));
    grid.appendChild(cell('Error', mk({ size: 's', table: true, value: 'Text', state: 'error' })));
    grid.appendChild(cell('Disabled', mk({ size: 's', table: true, value: 'Text', state: 'disabled' })));
    g.appendChild(grid);
  })();

  /* =========================== SIZES =========================== */
  (function () {
    const g = document.getElementById('sizes-demo');
    if (!g) return;
    const m = cell('M — основной', mk({ label: 'Label', helper: 'Helper', value: 'Text' }));
    m.insertBefore(Object.assign(document.createElement('span'), { className: 'size-badge', textContent: 'высота 40px · текст Body M' }), m.children[1]);
    const s = cell('S — Table Edit', mk({ size: 's', table: true, value: 'Text' }));
    s.insertBefore(Object.assign(document.createElement('span'), { className: 'size-badge', textContent: 'высота 32px · текст Body S' }), s.children[1]);
    g.appendChild(m); g.appendChild(s);
  })();

  /* =========================== CONTENT =========================== */
  (function () {
    const g = document.getElementById('content-demo');
    if (!g) return;
    g.appendChild(cell('Плейсхолдер — формат значения', mk({ label: 'ИНН контрагента', helper: '10 или 12 цифр', placeholder: 'Например, 7707083893', clear: false, live: true })));
    g.appendChild(cell('Префикс и постфикс — единицы', mk({ label: 'Ставка', prefix: 'От', postfix: '%', value: '16,5', live: true })));
    g.appendChild(cell('Длинный текст — многострочный', mk({ label: 'Комментарий', multiline: true, value: 'Выдача средств согласована с казначейством, транш планируется в первый рабочий день месяца', live: true })));
  })();

  /* =========================== BEHAVIOR (live) =========================== */
  (function () {
    const g = document.getElementById('beh-live');
    if (!g) return;
    /* крестик появляется только у заполненного поля */
    const node = mk({ label: 'Label', helper: 'Крестик — только у заполненного поля', placeholder: 'Плейсхолдер', clear: false, live: true, width: 280 });
    const field = node._field, ctl = node._control;
    const acts = document.createElement('span'); acts.className = 'inp__acts';
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'inp__act'; btn.setAttribute('aria-label', 'Очистить поле');
    btn.innerHTML = K.icon('close');
    btn.addEventListener('click', () => { ctl.value = ''; sync(); ctl.focus(); });
    acts.appendChild(btn); field.appendChild(acts);
    function sync() { acts.style.display = ctl.value ? '' : 'none'; }
    ctl.addEventListener('input', sync); sync();
    g.appendChild(cell('Плейсхолдер + очистка', node, 'Начните печатать — появится крестик; очистите и уведите фокус — вернётся плейсхолдер.'));
  })();

  /* =========================== STATES =========================== */
  (function () {
    const g = document.getElementById('states-demo');
    if (!g) return;
    const states = [
      ['Default', 'default'], ['Hover', 'hover'], ['Focus', 'focus'],
      ['Error', 'error'], ['ErrorFocus', 'error-focus'],
      ['Warning', 'warning'], ['WarningFocus', 'warning-focus'],
      ['Disabled', 'disabled'],
    ];
    states.forEach(([title, st]) => {
      g.appendChild(cell(title, mk({
        label: 'Label',
        helper: 'Helper',
        prefix: 'Pref', postfix: 'Postf', value: 'Text',
        state: st,
        tip: st === 'error-focus' ? 'Текст ошибки' : (st === 'warning-focus' ? 'Указана информация, которая не блокирует действие, но требует внимания пользователя' : null),
      })));
    });
  })();

  (function () {
    const g = document.getElementById('states-fill');
    if (!g) return;
    g.appendChild(cell('Пусто', mk({ label: 'Label', helper: 'Helper', clear: false })));
    g.appendChild(cell('Плейсхолдер', mk({ label: 'Label', helper: 'Helper', placeholder: 'Плейсхолдер', clear: false })));
    g.appendChild(cell('Заполнено', mk({ label: 'Label', helper: 'Helper', value: 'Text' })));
  })();

  /* =========================== TYPOGRAPHY =========================== */
  (function () {
    const tb = document.querySelector('#typo-table tbody');
    if (!tb) return;
    const rows = [
      ['Текст поля · M', 'Text', '--type-body-m', 'inp-m'],
      ['Текст поля · S (Table Edit)', 'Text', '--type-body-s', 'inp-s'],
      ['Label', 'Label', '--type-body-xs', 'label'],
      ['Helper', 'Helper', '--type-body-xs', 'helper'],
    ];
    rows.forEach(([part, sample, token, kind]) => {
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
        ['Тень фокуса', '--primary-bg-light'],
        ['Фон · disabled', '--st-disabled-light'],
      ]],
      ['Текст', [
        ['Значение', '--text-primary'],
        ['Плейсхолдер / префикс / постфикс', '--text-inactive'],
        ['Метка', '--text-secondary'],
        ['Действия (иконки)', '--secondary'],
      ]],
      ['Статусы', [
        ['Рамка · Error', '--error'],
        ['Рамка · Warning', '--warning'],
        ['Хелпер · Error', '--error'],
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
    /* живые экземпляры для измерения */
    const holder = document.createElement('div');
    holder.style.cssText = 'position:absolute; left:-9999px; top:0; visibility:hidden;';
    document.body.appendChild(holder);
    const m = mk({ label: 'L', helper: 'H', value: 'Text' });
    const s = mk({ size: 's', table: true, value: 'Text' });
    holder.appendChild(m); holder.appendChild(s);
    const fm = getComputedStyle(m._field), fs = getComputedStyle(s._field);
    const lead = m.querySelector('.inp__lead');
    const rows = [
      ['Высота поля', fm.height, fs.height],
      ['Паддинг горизонтальный', fm.paddingLeft, fs.paddingLeft],
      ['Зазор между элементами', fm.columnGap, fs.columnGap],
      ['Радиус', fm.borderRadius, fs.borderRadius],
      ['Рамка', fm.borderTopWidth + ' solid', fs.borderTopWidth + ' solid'],
      ['Шрифт значения', fm.fontSize + ' / ' + fm.lineHeight, fs.fontSize + ' / ' + fs.lineHeight],
      ['Иконки и действия', lead ? getComputedStyle(lead).width : '20px', '18px'],
      ['Отступ метки → поле', '4px', '—'],
      ['Отступ поле → хелпер', '4px', '—'],
    ];
    rows.forEach(([p, vm, vs]) => {
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
