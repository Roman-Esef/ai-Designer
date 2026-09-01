/* =========================================================================
   InputAutocomplete documentation — интерактивные демо.
   Требует: icons-data.js и input-kit.js подключены ДО этого файла.
   ========================================================================= */
(function () {
  'use strict';
  const K = window.DSInputKit;
  const mk = K.makeInput;
  const esc = K.esc;

  const CURRENCIES = [
    { id: 'usd', label: 'Доллар США', helper: 'USD · 840' },
    { id: 'eur', label: 'Евро', helper: 'EUR · 978' },
    { id: 'rub', label: 'Российский рубль', helper: 'RUB · 643' },
    { id: 'cny', label: 'Юань', helper: 'CNY · 156' },
    { id: 'gbp', label: 'Фунт стерлингов', helper: 'GBP · 826' },
    { id: 'chf', label: 'Швейцарский франк', helper: 'CHF · 756' },
  ];

  /* ---------- DropdownList ---------- */
  function checkMark() {
    return '<span class="ddl__item-check"><span class="cb__box"><span class="cb__mark">' + K.icon('check') + '</span></span></span>';
  }
  function highlight(label, q) {
    if (!q) return esc(label);
    const i = label.toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return esc(label);
    return esc(label.slice(0, i)) + '<span class="ddl__match">' + esc(label.slice(i, i + q.length)) + '</span>' + esc(label.slice(i + q.length));
  }
  function makeList(opts, o = {}) {
    const list = document.createElement('div');
    list.className = 'ddl ddl--scroll';
    list.setAttribute('role', 'listbox');
    if (o.multiple) list.setAttribute('aria-multiselectable', 'true');
    const sel = new Set(o.selected || []);
    if (!opts.length) {
      const st = document.createElement('div'); st.className = 'ddl__state ddl__state--empty';
      st.innerHTML = '<span>Ничего не найдено</span>';
      list.appendChild(st); return list;
    }
    opts.forEach(op => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ddl__item' + (o.multiple ? ' ddl__item--checkbox' : '');
      b.setAttribute('role', 'option');
      const on = sel.has(op.id);
      if (o.multiple) { b.setAttribute('aria-checked', String(on)); if (on) b.classList.add('ddl__item--selected'); }
      else if (on) { b.setAttribute('aria-selected', 'true'); b.classList.add('ddl__item--selected'); }
      if (op.disabled) b.setAttribute('aria-disabled', 'true');
      let inner = '';
      if (o.multiple) inner += checkMark();
      inner += '<span class="ddl__item-body"><span class="ddl__item-label">' + highlight(op.label, o.query) + '</span>'
        + (op.helper ? '<span class="ds-helper">' + esc(op.helper) + '</span>' : '') + '</span>';
      b.innerHTML = inner;
      if (o.onPick) b.addEventListener('click', () => o.onPick(op, b));
      list.appendChild(b);
    });
    return list;
  }

  function cell(title, node, sub) {
    const c = document.createElement('div'); c.className = 'demo-cell';
    const h = document.createElement('span'); h.className = 'th'; h.innerHTML = title; c.appendChild(h);
    c.appendChild(node);
    if (sub) { const s = document.createElement('p'); s.className = 'sub'; s.textContent = sub; c.appendChild(s); }
    return c;
  }

  /* Вставляет DropdownList ВНУТРЬ .inp__box (якорь, position:relative), поверх
     поля — абсолютным позиционированием под ним. Список перекрывает то, что
     идёт ниже (хелпер, внешний стек чипов Chips Ext), а не сдвигает их. */
  function styleList(list) {
    list.style.position = 'absolute';
    list.style.left = '0'; list.style.right = '0'; list.style.top = '100%';
    list.style.width = 'auto'; list.style.maxWidth = 'none';
    list.style.marginTop = '0';
    list.style.display = 'flex';
    list.style.zIndex = '45';
  }
  function openUnder(node, list) { styleList(list); node._field.parentElement.appendChild(list); return list; }

  /* =========================== PLAYGROUND =========================== */
  (function () {
    const state = { size: 'm', state: 'default', display: 'summary', list: 'text', open: true };
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

    controls.appendChild(ctlSelect('Размер', [['m', 'M'], ['s', 'S (Table Edit)']], 'size'));
    controls.appendChild(ctlSelect('Состояние', [
      ['default', 'Default'], ['hover', 'Hover'], ['focus', 'Focus'],
      ['error', 'Error'], ['error-focus', 'ErrorFocus'],
      ['warning', 'Warning'], ['warning-focus', 'WarningFocus'],
      ['disabled', 'Disabled'],
    ], 'state', true));
    controls.appendChild(ctlSelect('Показ выбора', [['summary', 'Сводка'], ['chips', 'Чипы в поле'], ['chips-ext', 'Чипы внешние']], 'display'));
    controls.appendChild(ctlSelect('Тип списка', [['text', 'Текст'], ['checkbox', 'Чекбоксы']], 'list'));

    function render() {
      const table = state.size === 's';
      /* Table Edit сводкой: чипы не помещаются в ячейку */
      const displayCtl = controls.children[2];
      displayCtl.classList.toggle('is-off', table);
      const effDisplay = table ? 'summary' : state.display;

      stage.innerHTML = '';
      const combo = document.createElement('div');
      combo.style.width = table ? '240px' : '300px';

      const spec = {
        size: state.size,
        table,
        state: state.state,
        label: !table ? 'Контрагент' : null,
        helper: !table ? 'Выберите из справочника' : null,
        chevron: true,
        placeholder: 'Поиск…',
        tip: state.state === 'error-focus' ? 'Текст ошибки' : (state.state === 'warning-focus' ? 'Указана информация, которая не блокирует действие, но требует внимания пользователя' : null),
        open: state.open,
        width: 'auto',
        id: 'pg-input',
      };
      if (effDisplay === 'summary') spec.summary = 'Value 1, +4';
      if (effDisplay === 'chips') spec.chips = ['Value 1', 'Value 2', '+3'];
      if (effDisplay === 'chips-ext') spec.ext = ['Value 1', 'Value 2', 'Value 3', 'Value 4'];
      const node = mk(spec);
      node.style.width = '100%';
      combo.appendChild(node);

      if (state.open && state.state !== 'disabled') {
        openUnder(node, makeList(CURRENCIES, { multiple: state.list === 'checkbox', selected: ['usd', 'eur'] }));
      }
      stage.appendChild(combo);

      /* сворачивание — реальным кликом по шеврону в поле, а не отдельной настройкой конструктора */
      const chev = node.querySelector('.inp__act--chev');
      if (chev) chev.addEventListener('click', () => { state.open = !state.open; render(); });

      const cls = ['.inp', 'inp--' + state.size];
      if (state.state.startsWith('error')) cls.push('inp--error');
      if (state.state.startsWith('warning')) cls.push('inp--warning');
      if (state.state === 'disabled') cls.push('inp--disabled');
      if (state.open && state.state !== 'disabled') cls.push('is-open');
      codeEl.innerHTML = '<code>' + cls.join('.') + '</code> + <code>.ddl' + (state.list === 'checkbox' ? ' · .ddl__item--checkbox' : '') + '</code>';
    }
    render();
  })();

  /* =========================== USAGE =========================== */
  (function () {
    const single = document.getElementById('use-single');
    if (single) single.appendChild(mk({ label: 'Валюта сделки', helper: 'Helper', chevron: true, value: 'Доллар США', width: 260, clear: true }));
    const summary = document.getElementById('use-summary');
    if (summary) summary.appendChild(mk({ label: 'Продукты', helper: 'Helper', chevron: true, summary: 'Кредит, +4', width: 260 }));
    const chips = document.getElementById('use-chips');
    if (chips) chips.appendChild(mk({ label: 'Продукты', helper: 'Helper', chevron: true, chips: ['Кредит', 'Гарантия', '+2'], width: 260 }));
  })();

  /* =========================== ANATOMY =========================== */
  (function () {
    const el = document.getElementById('anat-diagram');
    if (!el) return;
    const combo = document.createElement('div'); combo.style.width = '300px';
    const node = mk({ label: 'Контрагент', chevron: true, chips: ['Value 1', 'Value 2'], open: true, width: 'auto' });
    node.style.width = '100%';
    combo.appendChild(node);
    openUnder(node, makeList(CURRENCIES.slice(0, 4), { multiple: true, selected: ['usd'] }));
    el.appendChild(combo);
  })();

  /* =========================== VARIANTS =========================== */
  (function () {
    const g = document.getElementById('var-display');
    if (g) {
      g.appendChild(cell('Сводка', mk({ label: 'Label', chevron: true, summary: 'Value 1, +4' }), '«первое значение, +N остальных».'));
      g.appendChild(cell('Чипы в поле', mk({ label: 'Label', chevron: true, chips: ['Value 1', 'Value 2', '+2'] }), 'Каждое значение видно и удаляется.'));
      g.appendChild(cell('Чипы внешние', mk({ label: 'Label', chevron: true, placeholder: 'Поиск…', clear: false, ext: ['Value 1', 'Value 2', 'Value 3'] }), 'Чипы вынесены под поле.'));
    }

    const gf = document.getElementById('var-chips-field');
    if (gf) {
      gf.appendChild(cell('Немного значений', mk({ label: 'Label', chevron: true, chips: ['Value 1', 'Value 2'] })));
      gf.appendChild(cell('Переполнение → «+N»', mk({ label: 'Label', chevron: true, chips: ['Value 1', 'Value 2', '+3'] })));
      gf.appendChild(cell('Размер S · чип XS', mk({ size: 's', table: true, chevron: true, chips: ['Value 1', '+2'] })));
    }

    const ge = document.getElementById('var-chips-ext');
    if (ge) {
      ge.appendChild(cell('Внешний стек чипов (Chips Ext)', mk({ label: 'Продукты сделки', helper: 'Выбрано: 4', chevron: true, placeholder: 'Добавить продукт…', clear: false, ext: ['Кредитная линия', 'Банковская гарантия', 'Аккредитив', 'Овердрафт'], width: 420 })));
    }

    const gl = document.getElementById('var-list');
    if (gl) {
      const wrapText = document.createElement('div'); wrapText.style.flex = '1 1 240px';
      wrapText.appendChild(Object.assign(document.createElement('span'), { className: 'th', textContent: 'Список · текст (одиночный)', style: 'display:block;margin-bottom:12px;font:var(--type-body-s-strong);color:var(--text-secondary);' }));
      wrapText.appendChild(makeList(CURRENCIES, { selected: ['usd'], query: 'Дол' }));
      const wrapCb = document.createElement('div'); wrapCb.style.flex = '1 1 240px';
      wrapCb.appendChild(Object.assign(document.createElement('span'), { className: 'th', textContent: 'Список · чекбоксы (множественный)', style: 'display:block;margin-bottom:12px;font:var(--type-body-s-strong);color:var(--text-secondary);' }));
      wrapCb.appendChild(makeList(CURRENCIES, { multiple: true, selected: ['usd', 'eur'] }));
      gl.appendChild(wrapText); gl.appendChild(wrapCb);
    }

    const gt = document.getElementById('var-table');
    if (gt) {
      gt.appendChild(cell('Default · сводка', mk({ size: 's', table: true, chevron: true, summary: 'Value 1, +4', live: true })));
      gt.appendChild(cell('Error', mk({ size: 's', table: true, chevron: true, summary: 'Value 1, +4', state: 'error' })));
      gt.appendChild(cell('Disabled', mk({ size: 's', table: true, chevron: true, summary: 'Value 1, +4', state: 'disabled' })));
    }
  })();

  /* =========================== SIZES =========================== */
  (function () {
    const g = document.getElementById('sizes-demo');
    if (!g) return;
    const m = cell('M — чип S', mk({ label: 'Label', helper: 'Helper', chevron: true, chips: ['Value 1', 'Value 2'] }));
    m.insertBefore(Object.assign(document.createElement('span'), { className: 'size-badge', textContent: 'поле 40px · чип 24px' }), m.children[1]);
    const s = cell('S — чип XS (Table Edit)', mk({ size: 's', table: true, chevron: true, chips: ['Value 1', '+2'] }));
    s.insertBefore(Object.assign(document.createElement('span'), { className: 'size-badge', textContent: 'поле 32px · чип 20px' }), s.children[1]);
    g.appendChild(m); g.appendChild(s);
  })();

  /* =========================== CONTENT =========================== */
  (function () {
    const g = document.getElementById('content-demo');
    if (!g) return;
    g.appendChild(cell('Плейсхолдер — приглашение к поиску', mk({ label: 'Контрагент', helper: 'Helper', chevron: true, placeholder: 'Начните вводить название', clear: false })));
    g.appendChild(cell('Сводка множественного выбора', mk({ label: 'Продукты', helper: 'Выбрано: 5', chevron: true, summary: 'Кредитная линия, +4' })));
    const c = cell('Подсветка совпадения', document.createElement('div'));
    c.children[1].replaceWith(makeList(CURRENCIES.slice(0, 3), { query: 'Дол', selected: ['usd'] }));
    g.appendChild(c);
  })();

  /* =========================== BEHAVIOR · filter (live) =========================== */
  (function () {
    const host = document.getElementById('beh-filter');
    if (!host) return;
    const combo = document.createElement('div'); combo.style.maxWidth = '360px';
    const node = mk({ label: 'Валюта', helper: 'Печатайте название', chevron: true, placeholder: 'Поиск…', clear: false, width: 'auto', live: true });
    node.style.width = '100%';
    const ctl = node._control;
    combo.appendChild(node);
    let list = openUnder(node, makeList(CURRENCIES, { onPick: pick }));
    host.appendChild(combo);

    function pick(op) { ctl.value = op.label; close(); }
    function close() { node.classList.remove('is-open'); list.style.display = 'none'; document.removeEventListener('pointerdown', onOutside, true); document.removeEventListener('keydown', onEsc); }
    function onOutside(e) { if (!combo.contains(e.target)) close(); }
    function onEsc(e) { if (e.key === 'Escape') { close(); ctl.focus(); } }
    function rerender() {
      const q = ctl.value.trim();
      const filtered = CURRENCIES.filter(c => c.label.toLowerCase().includes(q.toLowerCase()));
      const fresh = makeList(filtered, { query: q, onPick: pick });
      list.replaceWith(fresh); list = fresh; styleList(list);
      node.classList.add('is-open');
    }
    ctl.addEventListener('input', rerender);
    ctl.addEventListener('focus', () => { list.style.display = 'flex'; node.classList.add('is-open'); document.addEventListener('pointerdown', onOutside, true); document.addEventListener('keydown', onEsc); });
  })();

  /* =========================== BEHAVIOR · chips (live) =========================== */
  (function () {
    const host = document.getElementById('beh-chips');
    if (!host) return;
    const selected = new Set(['usd']);
    let displayMode = 'field'; // 'field' | 'ext'
    const modeRow = document.createElement('div'); modeRow.className = 'ctl'; modeRow.style.marginBottom = '16px';
    const modeLbl = document.createElement('div'); modeLbl.className = 'lbl'; modeLbl.textContent = 'Показ чипов'; modeRow.appendChild(modeLbl);
    const modeBox = document.createElement('div'); modeBox.className = 'pg-select';
    const modeSel = document.createElement('select');
    [['field', 'В поле'], ['ext', 'Внешний стек']].forEach(([v, t]) => { const op = document.createElement('option'); op.value = v; op.textContent = t; modeSel.appendChild(op); });
    modeSel.addEventListener('change', () => { displayMode = modeSel.value; build(); });
    modeBox.appendChild(modeSel); modeRow.appendChild(modeBox);
    host.appendChild(modeRow);
    const combo = document.createElement('div'); combo.style.maxWidth = '420px';
    let node, list;

    function build() {
      combo.innerHTML = '';
      const labels = [...selected].map(id => CURRENCIES.find(c => c.id === id).label);
      const spec = {
        label: 'Валюты', helper: displayMode === 'ext' ? 'Чипы вынесены под поле; выбирайте в списке' : 'Выбирайте в списке; крестик на чипе — удалить',
        chevron: true, placeholder: selected.size && displayMode === 'field' ? '' : 'Поиск…', clear: false, width: 'auto', open: true,
        onChipRemove: (label) => { const o = CURRENCIES.find(c => c.label === label); if (o) selected.delete(o.id); build(); },
      };
      if (displayMode === 'ext') spec.ext = labels; else spec.chips = labels;
      node = mk(spec);
      node.style.width = '100%';
      combo.appendChild(node);
      list = openUnder(node, makeList(CURRENCIES, {
        multiple: true, selected: [...selected],
        onPick: (op) => { selected.has(op.id) ? selected.delete(op.id) : selected.add(op.id); build(); },
      }));
    }
    build();
    host.appendChild(combo);
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
      g.appendChild(cell(title, mk({
        label: 'Label',
        helper: 'Helper',
        chevron: true, summary: 'Value 1, +4',
        state: st,
        tip: st === 'error-focus' ? 'Текст ошибки' : (st === 'warning-focus' ? 'Указана информация, которая не блокирует действие, но требует внимания пользователя' : null),
      })));
    });
  })();

  /* =========================== TYPOGRAPHY =========================== */
  (function () {
    const tb = document.querySelector('#typo-table tbody');
    if (!tb) return;
    [
      ['Ввод / сводка · M', 'Value 1, +4', '--type-body-m'],
      ['Ввод / сводка · S', 'Value 1, +4', '--type-body-s'],
      ['Чип в поле · M → S', 'Value 1', '--type-body-s'],
      ['Опция списка', 'Доллар США', '--type-body-m'],
      ['Helper опции / группа', 'USD · 840', '--type-body-xs'],
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
      ['Поле-триггер', [
        ['Фон поля', '--bg-tile'],
        ['Рамка', '--border-primary'],
        ['Рамка · hover/focus', '--primary'],
        ['Сводка / значение', '--text-primary'],
        ['Плейсхолдер', '--text-inactive'],
        ['Иконки (шеврон / крестик)', '--secondary'],
      ]],
      ['Список (DropdownList)', [
        ['Фон списка', '--bg-popup'],
        ['Hover опции', '--tertiary-light'],
        ['Выбранная строка', '--bgtable-row-focus'],
        ['Подсветка совпадения', '--primary'],
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
    const m = mk({ label: 'L', helper: 'H', chevron: true, chips: ['V'] });
    const s = mk({ size: 's', table: true, chevron: true, summary: 'V, +4' });
    const list = makeList(CURRENCIES.slice(0, 2), {});
    holder.appendChild(m); holder.appendChild(s); holder.appendChild(list);
    const fm = getComputedStyle(m._field), fs = getComputedStyle(s._field);
    const item = list.querySelector('.ddl__item');
    const fi = item ? getComputedStyle(item) : null;
    const ddl = getComputedStyle(list);
    [
      ['Высота поля', fm.height, fs.height],
      ['Паддинг горизонтальный', fm.paddingLeft, fs.paddingLeft],
      ['Зазор элементов', fm.columnGap, fs.columnGap],
      ['Радиус поля', fm.borderRadius, fs.borderRadius],
      ['Размер чипа', 'S · 24px', 'XS · 20px'],
      ['Шеврон', '20px', '18px'],
      ['Высота опции списка', fi ? fi.minHeight : '40px', fi ? fi.minHeight : '40px'],
      ['Радиус списка', ddl.borderRadius, ddl.borderRadius],
      ['Отступ поле → список', '0px', '0px'],
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
