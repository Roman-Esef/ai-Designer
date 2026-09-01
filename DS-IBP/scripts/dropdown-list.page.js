/* =========================================================================
   DropdownList (Select) documentation — интерактивные демо
   Требует: icons-data.js подключён ДО этого файла (window.DS_ICONS).
   ========================================================================= */

const L = window.DS_ICONS || {};
function icon(name) {
  return L[name] || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/></svg>';
}
const CHECK   = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>';
const CHEVRON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
const DASH    = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 12h12"/></svg>';
const SEARCH  = icon('search');
const UI = {
  bad:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  good: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>',
};

/* ---------- подсветка совпавшей подстроки (автокомплит) ---------- */
function highlight(label, q) {
  if (!q) return escapeHtml(label);
  const i = label.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return escapeHtml(label);
  return escapeHtml(label.slice(0, i)) +
    '<span class="ddl__match">' + escapeHtml(label.slice(i, i + q.length)) + '</span>' +
    escapeHtml(label.slice(i + q.length));
}
function escapeHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

/* =========================================================================
   FACTORY — сборка списка и опций
   ========================================================================= */
function makeItem(spec) {
  if (spec.divider) { const d = document.createElement('hr'); d.className = 'ddl__divider'; return d; }
  if (spec.group)   { const g = document.createElement('div'); g.className = 'ddl__group'; g.textContent = spec.group; return g; }

  /* системная строка: loading / empty / error */
  if (spec.system) {
    const row = document.createElement('div');
    row.className = 'ddl__state ddl__state--' + spec.system;
    const ic = document.createElement('span'); ic.className = 'ddl__state-icon';
    if (spec.system === 'loading') ic.innerHTML = '<span class="spin"></span>';
    else if (spec.system === 'error') ic.innerHTML = icon('alert-circle-filled');
    else ic.innerHTML = icon('close-circle');
    const tx = document.createElement('span'); tx.className = 'ddl__state-text';
    tx.innerHTML = escapeHtml(spec.label) + (spec.sub ? '<span class="ddl__state-sub">' + escapeHtml(spec.sub) + '</span>' : '');
    row.appendChild(ic); row.appendChild(tx);
    return row;
  }

  const it = document.createElement('button');
  it.type = 'button';
  it.className = 'ddl__item';
  it.setAttribute('role', 'option');
  if (spec.checkbox) it.classList.add('ddl__item--checkbox');
  if (spec.all)      it.classList.add('ddl__item--all');
  if (spec.wrap)     it.classList.add('ddl__item--wrap');
  if (spec.danger)   it.classList.add('ddl__item--danger');
  if (spec.action)   it.classList.add('ddl__item--action');
  if (spec.state)    it.classList.add('is-' + spec.state);
  if (spec.disabled) it.setAttribute('aria-disabled', 'true');

  if (spec.checkbox) {
    const st = spec.checked === 'mixed' ? 'mixed' : String(!!spec.checked);
    it.setAttribute('aria-checked', st);
    const cb = document.createElement('span'); cb.className = 'ddl__item-check';
    cb.innerHTML = '<span class="cb__box"><span class="cb__mark">' + (st === 'mixed' ? DASH : CHECK) + '</span></span>';
    it.appendChild(cb);
  } else if (spec.selectable !== false && spec.selected != null) {
    it.setAttribute('aria-selected', String(!!spec.selected));
  } else if (spec.selected) {
    it.setAttribute('aria-selected', 'true');
  }

  if (spec.icon) {
    const i = document.createElement('span'); i.className = 'ddl__item-icon'; i.innerHTML = icon(spec.icon); it.appendChild(i);
  }

  const body = document.createElement('span'); body.className = 'ddl__item-body';
  const lab = document.createElement('span'); lab.className = 'ddl__item-label';
  if (spec.match) lab.innerHTML = highlight(spec.label, spec.match);
  else lab.innerHTML = spec.actionHtml || escapeHtml(spec.label);
  body.appendChild(lab);
  if (spec.helper) { const h = document.createElement('span'); h.className = 'ds-helper'; h.textContent = spec.helper; body.appendChild(h); }
  it.appendChild(body);

  if (spec.single && !spec.checkbox) {
    const tr = document.createElement('span'); tr.className = 'ddl__item-trail';
    tr.innerHTML = '<span class="ddl__item-check-single">' + CHECK + '</span>';
    it.appendChild(tr);
  } else if (spec.trail) {
    const tr = document.createElement('span'); tr.className = 'ddl__item-trail'; tr.textContent = spec.trail; it.appendChild(tr);
  }
  return it;
}

function makeList(items, o = {}) {
  const { floating = false, pinned = false, scroll = false, maxH = null } = o;
  const el = document.createElement('div');
  el.className = 'ddl';
  el.setAttribute('role', 'listbox');
  if (floating) el.classList.add('ddl--floating');
  if (pinned)   el.classList.add('ddl--pinned');
  if (scroll)   el.classList.add('ddl--scroll');
  if (maxH)     el.style.setProperty('--ddl-max-h', maxH + 'px');
  items.forEach(spec => el.appendChild(makeItem(spec)));
  return el;
}

/* ---------- поле-триггер (Select / Autocomplete) ---------- */
function makeField(o = {}) {
  const f = document.createElement('div');
  f.className = 'fld' + (o.search ? ' fld--search' : '') + (o.open ? ' is-open' : '');
  f.style.width = (o.width || 260) + 'px';
  let inner = '';
  if (o.search) inner += '<span class="fld__lead">' + SEARCH + '</span>';
  if (o.prefix) inner += '<span class="fld__prefix">' + escapeHtml(o.prefix) + '</span>';
  inner += '<span class="fld__value' + (o.placeholder ? ' is-ph' : '') + '">' + escapeHtml(o.value || o.placeholder || '') + '</span>';
  inner += '<span class="fld__chev">' + CHEVRON + '</span>';
  f.innerHTML = inner;
  return f;
}

/* сводка множественного выбора в поле: «Выбрано:» — префикс, N — значение */
function setSummary(field, n) {
  const pre = field.querySelector('.fld__prefix');
  if (pre) pre.style.display = n ? '' : 'none';
  field.querySelector('.fld__value').textContent = n ? String(n) : 'Не выбрано';
}

/* позиционирование и открытие/закрытие/клавиатура/три-стейт — рантайм scripts/ds-dropdownlist.js */

/* =========================================================================
   PLAYGROUND
   ========================================================================= */
(function () {
  const state = { variant: 'text', helper: false, icons: false, match: false, group: false, count: '6', disabled: false, system: 'none', all: false, create: false };
  const controls = document.getElementById('pg-controls');
  const stage    = document.getElementById('pg-stage');
  const codeEl   = document.getElementById('pg-code');
  if (!controls || !stage) return;

  function ctlSelect(label, options, key) {
    const wrap = document.createElement('div'); wrap.className = 'ctl';
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

  const cVariant = ctlSelect('Вариант', [['text', 'Текст'], ['checkbox', 'Чекбокс']], 'variant');
  const cCount   = ctlSelect('Количество опций', [['3', '3'], ['6', '6'], ['9', '9'], ['14', '14']], 'count');
  const cSystem  = ctlSelect('Системное состояние', [['none', 'Нет'], ['loading', 'Загрузка'], ['empty', 'Пусто'], ['error', 'Ошибка']], 'system');
  const cHelper  = ctlToggle('Helper-текст', 'helper');
  const cIcons   = ctlToggle('Ведущие иконки', 'icons');
  const cMatch   = ctlToggle('Подсветка совпадения', 'match');
  const cGroup   = ctlToggle('Группировка', 'group');
  const cDisabled= ctlToggle('Отключённая опция', 'disabled');
  const cAll     = ctlToggle('Строка «Выбрать всё»', 'all');
  const cCreate  = ctlToggle('Строка создания', 'create');

  controls.append(cVariant, cCount, cSystem, cHelper, cIcons, cMatch, cGroup, cDisabled, cAll, cCreate);

  const POOL = [
    { label: 'Российский рубль', helper: 'RUB · 643', icon: 'bank' },
    { label: 'Доллар США', helper: 'USD · 840', icon: 'bank' },
    { label: 'Евро', helper: 'EUR · 978', icon: 'bank' },
    { label: 'Фунт стерлингов', helper: 'GBP · 826', icon: 'bank' },
    { label: 'Швейцарский франк', helper: 'CHF · 756', icon: 'bank' },
    { label: 'Китайский юань', helper: 'CNY · 156', icon: 'bank' },
    { label: 'Японская иена', helper: 'JPY · 392', icon: 'bank' },
    { label: 'Канадский доллар', helper: 'CAD · 124', icon: 'bank' },
    { label: 'Австралийский доллар', helper: 'AUD · 036', icon: 'bank' },
    { label: 'Сингапурский доллар', helper: 'SGD · 702', icon: 'bank' },
    { label: 'Гонконгский доллар', helper: 'HKD · 344', icon: 'bank' },
    { label: 'Норвежская крона', helper: 'NOK · 578', icon: 'bank' },
    { label: 'Шведская крона', helper: 'SEK · 752', icon: 'bank' },
    { label: 'Индийская рупия', helper: 'INR · 356', icon: 'bank' },
  ];

  function toggleOff(ctl, off) { ctl.classList.toggle('is-off', off); }

  function buildSpecs() {
    const isCb = state.variant === 'checkbox';
    const n = parseInt(state.count, 10);
    const q = state.match ? 'дол' : null;
    const specs = [];
    if (isCb && state.all) specs.push({ checkbox: true, all: true, label: 'Выбрать всё', checked: 'mixed' }, { divider: true });
    if (state.group) specs.push({ group: 'Популярные' });
    for (let i = 0; i < n; i++) {
      const base = POOL[i % POOL.length];
      const s = { label: base.label };
      if (isCb) { s.checkbox = true; s.checked = (i === 1 || i === 4); }
      else s.selected = (i === 1);
      if (state.helper) s.helper = base.helper;
      if (state.icons && !isCb) s.icon = base.icon;
      if (q) s.match = q;
      if (state.disabled && i === 2) { s.disabled = true; delete s.selected; s.checked = false; }
      if (state.group && i === 2) specs.push({ group: 'Все валюты' });
      specs.push(s);
    }
    return specs;
  }

  let anchor, field, list;
  function render() {
    /* контекстная доступность контролов */
    const sys = state.system !== 'none';
    toggleOff(cIcons, sys || state.variant === 'checkbox');  // иконка и чекбокс — взаимоисключающий ведущий слот
    toggleOff(cAll, sys || state.variant !== 'checkbox');    // «Выбрать всё» — только множественный выбор
    toggleOff(cCreate, state.system !== 'empty');            // строка создания — только пустой результат
    [cVariant, cCount, cHelper, cMatch, cGroup, cDisabled].forEach(c => toggleOff(c, sys));

    stage.innerHTML = '';
    anchor = document.createElement('span'); anchor.className = 'ddl-anchor';
    field = makeField({ width: 300, open: true, search: state.variant === 'checkbox' ? false : state.match, prefix: (!state.match && state.variant === 'checkbox') ? 'Выбрано:' : null, value: state.match ? 'дол' : (state.variant === 'checkbox' ? '2' : 'Доллар США'), placeholder: null });
    anchor.appendChild(field);

    let items;
    if (state.system === 'loading') items = [{ system: 'loading', label: 'Поиск в справочнике' }];
    else if (state.system === 'empty') items = state.create
      ? [{ system: 'empty', label: 'Ничего не найдено' }, { divider: true }, { action: true, icon: 'add-circle', actionHtml: 'Создать «<strong>SBI Voskhod</strong>»' }]
      : [{ system: 'empty', label: 'Ничего не найдено' }];
    else if (state.system === 'error') items = [{ system: 'error', label: 'Не удалось загрузить справочник', sub: 'Проверьте соединение и повторите' }];
    else items = buildSpecs();

    list = makeList(items, { floating: true, pinned: true, scroll: !sys });
    list.style.width = '300px';
    if (!sys) list.style.setProperty('--ddl-max-h', '312px');
    anchor.appendChild(list);
    stage.appendChild(anchor);
    if (state.variant === 'checkbox' && !sys) {
      window.DSDropdownList.wireMulti(list, n => setSummary(field, n));
    }
    place();

    const tag = state.variant === 'checkbox' ? 'aria-multiselectable="true"' : '';
    codeEl.innerHTML = '<code>&lt;div class="ddl" role="listbox" ' + tag + '&gt;…&lt;/div&gt;</code>';
  }
  function place() { window.DSDropdownList.place(list, field, { gap: 6 }); }
  render();
  window.addEventListener('resize', () => { if (list) place(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (list) place(); });
})();

/* =========================================================================
   ANATOMY
   ========================================================================= */
(function () {
  const d = document.getElementById('anat-diagram');
  if (!d) return;
  const list = makeList([
    { group: 'Валюта' },
    { label: 'Российский рубль', helper: 'RUB · 643', selected: true },
    { label: 'Доллар США', helper: 'USD · 840' },
    { label: 'Евро', helper: 'EUR · 978' },
  ]);
  list.style.minWidth = '280px';
  d.appendChild(list);
})();

/* =========================================================================
   VARIANTS MATRIX (Dropdown_Item)
   Столбцы: Text · Text + Helper · Checkbox · Checkbox + Helper
   Строки:  Default · Hover · Selected · Hover Selected · Disabled
   ========================================================================= */
(function () {
  const host = document.getElementById('variants-grid');
  if (!host) return;
  const cols = [
    { key: 'text',        helper: false, cb: false, title: 'Text' },
    { key: 'text-h',      helper: true,  cb: false, title: 'Text + Helper' },
    { key: 'cb',          helper: false, cb: true,  title: 'Checkbox' },
    { key: 'cb-h',        helper: true,  cb: true,  title: 'Checkbox + Helper' },
  ];
  const rows = [
    { name: 'Default',        st: {} },
    { name: 'Hover',          st: { state: 'hover' } },
    { name: 'Selected',       st: { sel: true } },
    { name: 'Hover Selected', st: { sel: true, state: 'hover' } },
    { name: 'Disabled',       st: { disabled: true } },
  ];

  // header
  host.appendChild(cell('', 'vh-corner'));
  cols.forEach(c => host.appendChild(cell(c.title, 'vh-col')));

  rows.forEach(r => {
    host.appendChild(cell(r.name, 'vh-row'));
    cols.forEach(c => {
      const spec = { label: 'Item' };
      if (c.helper) spec.helper = 'HelperText';
      if (c.cb) { spec.checkbox = true; spec.checked = !!r.st.sel; }
      else if (r.st.sel) spec.selected = true;
      if (r.st.state) spec.state = r.st.state;
      if (r.st.disabled) spec.disabled = true;
      const box = makeList([spec]); box.style.minWidth = '180px'; box.style.boxShadow = 'none';
      const wrap = document.createElement('div'); wrap.className = 'vcell'; wrap.appendChild(box);
      host.appendChild(wrap);
    });
  });
  function cell(text, cls) { const d = document.createElement('div'); d.className = cls; d.textContent = text; return d; }
})();

/* =========================================================================
   SELECT ALL — три состояния строки «Выбрать всё»
   ========================================================================= */
(function () {
  const host = document.getElementById('var-all');
  if (!host) return;
  const opts = ['Российский рубль', 'Доллар США', 'Евро'];
  [['Ничего не выбрано', false], ['Выбрана часть · mixed', 'mixed'], ['Выбрано всё', true]].forEach(([cap, st]) => {
    const box = makeList([{ checkbox: true, all: true, label: 'Выбрать всё', checked: st }, { divider: true }]
      .concat(opts.map((l, i) => ({ checkbox: true, label: l, checked: st === true || (st === 'mixed' && i === 1) }))));
    box.style.minWidth = '240px';
    const cell = document.createElement('div'); cell.className = 'stack';
    const h = document.createElement('span'); h.className = 'th'; h.textContent = cap;
    cell.append(h, box); host.appendChild(cell);
  });
})();

/* =========================================================================
   SYSTEM STATES — loading · empty · error
   ========================================================================= */
(function () {
  const host = document.getElementById('system-grid');
  if (!host) return;
  const cases = [
    ['Загрузка', [{ system: 'loading', label: 'Поиск в справочнике' }], 'Пока идёт запрос: спиннер + название источника. Не мигать пустым списком.'],
    ['Пусто', [{ system: 'empty', label: 'Ничего не найдено' }], 'Запрос отработал, совпадений нет. По возможности — действие «создать».'],
    ['Ошибка', [{ system: 'error', label: 'Не удалось загрузить словарь', sub: 'Проверьте соединение и повторите' }], 'Запрос упал: иконка Error + короткое пояснение.'],
    ['Пусто + действие', [{ system: 'empty', label: 'Ничего не найдено' }, { divider: true }, { action: true, icon: 'add-circle', actionHtml: 'Создать «<strong>SBI Voskhod</strong>»' }], 'Автокомплит со свободным вводом: строка «создать» под сообщением.'],
  ];
  cases.forEach(([name, items, cap]) => {
    const cell = document.createElement('div'); cell.className = 'sys-cell';
    const h = document.createElement('span'); h.className = 'th'; h.textContent = name;
    const box = makeList(items); box.style.width = '288px';
    const c = document.createElement('p'); c.className = 'sys-cap'; c.textContent = cap;
    cell.append(h, box, c); host.appendChild(cell);
  });
})();

/* =========================================================================
   STATES row
   ========================================================================= */
(function () {
  const host = document.getElementById('states-demo');
  if (!host) return;
  const rows = [
    ['Default',  {}],
    ['Hover',    { state: 'hover' }],
    ['Focus',    { state: 'focus' }],
    ['Pressed',  { state: 'active' }],
    ['Selected', { selected: true }],
    ['Disabled', { disabled: true }],
  ];
  rows.forEach(([name, extra]) => {
    const cell = document.createElement('div'); cell.className = 'state-cell';
    const h = document.createElement('span'); h.className = 'state-cap'; h.textContent = name;
    const spec = Object.assign({ label: 'Доллар США', helper: 'USD · 840' }, extra);
    const box = makeList([spec]); box.style.minWidth = '220px';
    cell.append(h, box); host.appendChild(cell);
  });
})();

/* =========================================================================
   CONTENT — truncate · wrap · match
   ========================================================================= */
(function () {
  const trunc = makeList([
    { label: 'Долгосрочные обязательства по инвестиционным контрактам', selected: false },
    { label: 'Евро' },
  ]);
  trunc.style.maxWidth = '260px'; trunc.style.minWidth = '260px';
  const t1 = document.getElementById('content-trunc'); if (t1) t1.appendChild(trunc);

  const wrap = makeList([
    { label: 'Долгосрочные обязательства по инвестиционным контрактам', wrap: true },
    { label: 'Евро' },
  ]);
  wrap.style.maxWidth = '260px'; wrap.style.minWidth = '260px';
  const t2 = document.getElementById('content-wrap'); if (t2) t2.appendChild(wrap);

  const match = makeList([
    { label: 'Доллар США', helper: 'USD · 840', match: 'дол' },
    { label: 'Доллар Канады', helper: 'CAD · 124', match: 'дол' },
    { label: 'Австралийский доллар', helper: 'AUD · 036', match: 'дол' },
  ]);
  match.style.minWidth = '260px';
  const t3 = document.getElementById('content-match'); if (t3) t3.appendChild(match);
})();

/* =========================================================================
   SIZES — однострочная vs двустрочная опция (redline-мини)
   ========================================================================= */
(function () {
  const host = document.getElementById('sizes-demo');
  if (!host) return;
  const rows = [
    ['Опция — 1 строка', [{ label: 'Российский рубль' }], '40 px'],
    ['Опция + Helper — 2 строки', [{ label: 'Российский рубль', helper: 'RUB · 643' }], '52 px'],
    ['С ведущим чекбоксом', [{ checkbox: true, checked: true, label: 'Российский рубль' }], '40 px'],
  ];
  rows.forEach(([name, items, h]) => {
    const cell = document.createElement('div'); cell.className = 'size-cell';
    const cap = document.createElement('span'); cap.className = 'th'; cap.textContent = name;
    const box = makeList(items); box.style.minWidth = '240px';
    const badge = document.createElement('span'); badge.className = 'size-badge'; badge.textContent = h;
    cell.append(cap, box, badge); host.appendChild(cell);
  });
})();

/* =========================================================================
   POSITIONING / AUTO-FLIP (draggable field, list width == field width)
   ========================================================================= */
(function () {
  const vp = document.getElementById('flip-vp');
  const fieldWrap = document.getElementById('flip-field');
  if (!vp || !fieldWrap) return;
  const field = makeField({ width: 220, open: true, value: 'Доллар США' });
  fieldWrap.appendChild(field);
  const list = makeList([
    { label: 'Российский рубль', helper: 'RUB · 643' },
    { label: 'Доллар США', helper: 'USD · 840', selected: true },
    { label: 'Евро', helper: 'EUR · 978' },
    { label: 'Фунт стерлингов', helper: 'GBP · 826' },
  ], { floating: true, pinned: true });
  vp.appendChild(list);

  function update() {
    const br = vp.getBoundingClientRect();
    window.DSDropdownList.place(list, field, { boundary: vp, offsetParent: vp, gap: 6 });
    const m = 6;
    let x = parseFloat(list.style.left), y = parseFloat(list.style.top);
    x = Math.max(m, Math.min(br.width - list.offsetWidth - m, x));
    list.style.left = x + 'px';
    list.style.top = y + 'px';
  }

  let dragging = false, ox = 0, oy = 0;
  fieldWrap.style.position = 'absolute';
  fieldWrap.addEventListener('pointerdown', e => { dragging = true; fieldWrap.setPointerCapture(e.pointerId); const r = fieldWrap.getBoundingClientRect(); ox = e.clientX - r.left; oy = e.clientY - r.top; });
  fieldWrap.addEventListener('pointermove', e => {
    if (!dragging) return;
    const br = vp.getBoundingClientRect();
    let nx = e.clientX - br.left - ox, ny = e.clientY - br.top - oy;
    nx = Math.max(0, Math.min(br.width - fieldWrap.offsetWidth, nx));
    ny = Math.max(0, Math.min(br.height - fieldWrap.offsetHeight, ny));
    fieldWrap.style.left = nx + 'px'; fieldWrap.style.top = ny + 'px';
    update();
  });
  fieldWrap.addEventListener('pointerup', () => dragging = false);
  fieldWrap.style.left = '40px'; fieldWrap.style.top = '30px';
  update();
  window.addEventListener('resize', update);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(update);
})();

/* =========================================================================
   USAGE — Select (single) · Multiselect · Autocomplete
   Открытие/позиционирование/клавиатура/три-стейт — window.DSDropdownList.bind, без своего кода
   ========================================================================= */
(function () {
  // --- single select ---
  const s1 = document.getElementById('use-select');
  if (s1) {
    const anchor = document.createElement('span'); anchor.className = 'ddl-anchor';
    const field = makeField({ width: 280, value: 'Доллар США' });
    anchor.appendChild(field);
    const list = makeList([
      { label: 'Российский рубль', helper: 'RUB · 643' },
      { label: 'Доллар США', helper: 'USD · 840', selected: true },
      { label: 'Евро', helper: 'EUR · 978' },
      { label: 'Фунт стерлингов', helper: 'GBP · 826' },
    ], { floating: true });
    anchor.appendChild(list); s1.appendChild(anchor);
    window.DSDropdownList.bind(field, { list, onSelect: it => { field.querySelector('.fld__value').textContent = it.querySelector('.ddl__item-label').textContent; } });
  }

  // --- multiselect ---
  const s2 = document.getElementById('use-multi');
  if (s2) {
    const anchor = document.createElement('span'); anchor.className = 'ddl-anchor';
    const field = makeField({ width: 280, prefix: 'Выбрано:', value: '2' });
    anchor.appendChild(field);
    const opts = ['Российский рубль', 'Доллар США', 'Евро', 'Фунт стерлингов', 'Китайский юань'];
    const list = makeList([{ checkbox: true, all: true, label: 'Выбрать всё' }, { divider: true }]
      .concat(opts.map((l, i) => ({ checkbox: true, checked: i === 1 || i === 2, label: l }))), { floating: true });
    anchor.appendChild(list); s2.appendChild(anchor);
    window.DSDropdownList.bind(field, { list, multiple: true, onToggle: () => setSummary(field, list.querySelectorAll('.ddl__item--checkbox:not(.ddl__item--all)[aria-checked="true"]').length) });
  }

  // --- autocomplete ---
  const s3 = document.getElementById('use-auto');
  if (s3) {
    const anchor = document.createElement('span'); anchor.className = 'ddl-anchor';
    const field = makeField({ width: 280, search: true, value: 'дол' });
    anchor.appendChild(field);
    const list = makeList([
      { label: 'Доллар США', helper: 'USD · 840', match: 'дол' },
      { label: 'Канадский доллар', helper: 'CAD · 124', match: 'дол' },
      { label: 'Австралийский доллар', helper: 'AUD · 036', match: 'дол' },
      { label: 'Сингапурский доллар', helper: 'SGD · 702', match: 'дол' },
    ], { floating: true });
    anchor.appendChild(list); s3.appendChild(anchor);
    window.DSDropdownList.bind(field, { list, onSelect: it => { field.querySelector('.fld__value').textContent = it.querySelector('.ddl__item-label').textContent; } });
  }
})();

/* =========================================================================
   ACCESSIBILITY — keyboard table + focused example
   ========================================================================= */
(function () {
  const good = document.getElementById('a11y-good');
  if (good) {
    const list = makeList([
      { label: 'Российский рубль', helper: 'RUB · 643' },
      { label: 'Доллар США', helper: 'USD · 840', state: 'focus' },
      { label: 'Евро', helper: 'EUR · 978', selected: true },
    ]);
    list.style.minWidth = '240px';
    good.appendChild(list);
  }
  const rows = [
    ['↓ / ↑', 'Перейти к следующей / предыдущей опции (активная — aria-activedescendant)'],
    ['Enter', 'Выбрать активную опцию (в multiselect — переключить)'],
    ['Space', 'Переключить чекбокс (в multiselect)'],
    ['Home / End', 'Первая / последняя опция'],
    ['A–Я', 'Быстрый переход по первой букве (typeahead)'],
    ['Esc', 'Закрыть список, вернуть фокус в поле'],
  ];
  const tb = document.querySelector('#kbd-table');
  if (tb) tb.innerHTML = rows.map(([k, v]) => `<div class="tbl__row" style="grid-template-columns:8px 0.6fr 2.2fr 8px;"><div class="tc tc--separator"></div><div class="tc"><span class="tc__row"><span class="tc__text"><kbd>${k}</kbd></span></span></div><div class="tc tc--wrap"><span class="tc__row"><span class="tc__text">${v}</span></span></div><div class="tc tc--separator"></div></div>`).join('');
})();

/* =========================================================================
   TYPOGRAPHY reference
   ========================================================================= */
(function () {
  const tb = document.querySelector('#typo-table tbody');
  if (!tb) return;
  tb.innerHTML = [
    ['Подпись опции', 'Доллар США', '--type-body-m', 'SB Sans Text', '16 / 20'],
    ['Подпись · выбранная', 'Доллар США', '--type-body-m-strong', 'SB Sans Text', '16 / 20'],
    ['Helper-текст', 'USD · 840', '--type-body-xs', 'SB Sans Text', '12 / 16'],
    ['Заголовок группы', 'ПОПУЛЯРНЫЕ', '--type-body-xs', 'SB Sans Text', '12 / 16'],
    ['Системное сообщение', 'Ничего не найдено', '--type-body-m-strong', 'SB Sans Text', '16 / 20'],
  ].map(([part, sample, tok, font, sl]) => `
    <tr>
      <td>${part}</td>
      <td><span style="font:var(${tok});">${sample}</span></td>
      <td class="rt-tok"><code>${tok}</code></td>
      <td>${font}</td>
      <td class="rt-num">${sl}</td>
    </tr>`).join('');
})();

/* =========================================================================
   COLORS reference
   ========================================================================= */
(function () {
  const root = document.getElementById('color-ref');
  if (!root) return;
  const probe = document.createElement('span');
  probe.style.cssText = 'position:absolute;left:-9999px;width:0;height:0;';
  document.body.appendChild(probe);
  function resolveHex(cssValue) {
    probe.style.backgroundColor = 'transparent';
    probe.style.backgroundColor = cssValue;
    const v = getComputedStyle(probe).backgroundColor;
    let r, g, b, a = 1, m = v.match(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)/i);
    if (m) { r = +m[1] * 255; g = +m[2] * 255; b = +m[3] * 255; if (m[4] !== undefined) a = +m[4]; }
    else { const n = v.match(/[\d.]+/g); if (!n) return cssValue; r = +n[0]; g = +n[1]; b = +n[2]; if (n[3] !== undefined) a = +n[3]; }
    const hx = n => Math.round(n).toString(16).padStart(2, '0').toUpperCase();
    let s = '#' + hx(r) + hx(g) + hx(b); if (a < 1) s += ' · ' + Math.round(a * 100) + '%'; return s;
  }
  const groups = [
    { name: 'Контейнер', rows: [
      ['Фон списка', '--bg-popup'],
      ['Граница', '--border-light'],
      ['Разделитель', '--border-light'],
    ]},
    { name: 'Опция', rows: [
      ['Текст', '--text-primary'],
      ['Helper', '--text-inactive'],
      ['Фон · hover / focus', '--tertiary-light'],
      ['Фон · выбранная', '--bgtable-row-focus'],
    ]},
    { name: 'Выбор', rows: [
      ['Чекбокс · заливка', '--primary'],
      ['Подпись выбранной', '--text-primary'],
      ['Подсветка совпадения', '--text-primary'],
    ]},
    { name: 'Системное', rows: [
      ['Ошибка · иконка', '--error'],
      ['Пусто · иконка', '--text-secondary'],
      ['Загрузка / отключено', '--text-inactive'],
    ]},
  ];
  root.innerHTML = groups.map(g => `
    <section class="cref-group">
      <h3>${g.name}</h3>
      <div class="cref-rows">
        ${g.rows.map(([role, tok]) => `
          <div class="cref-row">
            <div class="cref-sw"><div class="cf" style="background:var(${tok});"></div></div>
            <div class="cref-meta"><p class="role">${role}</p><p class="tname">${tok}</p></div>
            <div class="cref-hex">${resolveHex('var(' + tok + ')')}</div>
          </div>`).join('')}
      </div>
    </section>`).join('');
  probe.remove();
})();

/* =========================================================================
   DEV: redline measured from live component
   ========================================================================= */
(function () {
  const tb = document.querySelector('#dev-spec-table');
  if (!tb) return;
  const host = document.createElement('div');
  host.style.cssText = 'position:absolute;left:-9999px;top:0;';
  document.body.appendChild(host);

  const single = makeList([{ label: 'Item' }]);
  const withHelper = makeList([{ label: 'Item', helper: 'HelperText' }]);
  const withCb = makeList([{ checkbox: true, checked: true, label: 'Item' }]);
  host.append(single, withHelper, withCb);

  const r = n => Math.round(parseFloat(n) * 10) / 10;
  const csL = getComputedStyle(single);
  const it = single.querySelector('.ddl__item');
  const csI = getComputedStyle(it);
  const csIh = getComputedStyle(withHelper.querySelector('.ddl__item'));
  const mark = withCb.querySelector('.cb__mark');
  const csMark = mark ? getComputedStyle(mark) : null;
  const box = withCb.querySelector('.cb__box');
  const csBox = box ? getComputedStyle(box) : null;

  const rows = [
    ['Высота опции · 1 строка', r(it.offsetHeight) + ' px'],
    ['Высота опции · с Helper', r(withHelper.querySelector('.ddl__item').offsetHeight) + ' px'],
    ['Гориз. паддинг опции', r(csI.paddingLeft) + ' px'],
    ['Зазор слот↔текст', r(csI.columnGap || csI.gap) + ' px'],
    ['Размер ведущей иконки', r(csL.getPropertyValue('--ddl-icon') || 20) + ' px'],
    ['Чекбокс · область', csBox ? r(csBox.width) + ' px' : '20 px'],
    ['Чекбокс · метка', csMark ? r(csMark.width) + ' px' : '16 px'],
    ['Размер шрифта подписи', csI.fontSize],
    ['Верт. паддинг контейнера', r(csL.paddingTop) + ' px'],
    ['Радиус контейнера', r(csL.borderTopLeftRadius) + ' px'],
    ['Мин. ширина', r(csL.minWidth) + ' px'],
    ['Макс. высота (скролл)', '296 px (≈7 опций)'],
    ['Тень', csL.boxShadow],
  ];
  host.remove();
  tb.innerHTML = rows.map(([p, v]) => `<div class="tbl__row" style="grid-template-columns:8px 1.84fr 0.81fr 8px;"><div class="tc tc--separator"></div><div class="tc"><span class="tc__row"><span class="tc__text">${p}</span></span></div><div class="tc tc--numbers"><span class="tc__row"><span class="tc__text">${v}</span></span></div><div class="tc tc--separator"></div></div>`).join('');
})();

/* =========================================================================
   DEV: copy-to-clipboard
   ========================================================================= */
(function () {
  document.querySelectorAll('.code-panel__copy').forEach(btn => {
    const target = document.getElementById(btn.dataset.copyTarget);
    if (!target) return;
    const label = btn.querySelector('.copy-label');
    btn.addEventListener('click', async () => {
      const text = target.textContent;
      try { await navigator.clipboard.writeText(text); }
      catch (e) {
        const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); } catch (e2) {}
        ta.remove();
      }
      btn.classList.add('is-copied');
      const prev = label.textContent; label.textContent = 'Скопировано';
      setTimeout(() => { btn.classList.remove('is-copied'); label.textContent = prev; }, 1600);
    });
  });
})();
