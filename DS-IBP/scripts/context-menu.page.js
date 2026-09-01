/* =========================================================================
   Context Menu documentation — interactive demos
   Требует: icons-data.js подключён ДО этого файла (window.DS_ICONS).
   ========================================================================= */

/* ---------- иконки: из библиотеки ДС + служебные (do/don't) ---------- */
const L = window.DS_ICONS || {};
function icon(name) {
  return L[name] || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/></svg>';
}
const CHEVRON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>';
const CHECK   = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>';
const KEBAB   = L['more-dots'] || '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>';
const UI = {
  bad:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  good: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>',
};

/* =========================================================================
   FACTORY — сборка меню и пунктов
   ========================================================================= */
function makeItem(spec) {
  if (spec.divider) { const d = document.createElement('hr'); d.className = 'menu__divider'; return d; }
  if (spec.label && spec.header) { const l = document.createElement('div'); l.className = 'menu__label'; l.textContent = spec.label; return l; }

  const it = document.createElement(spec.sub ? 'div' : 'button');
  if (!spec.sub) it.type = 'button';
  it.className = 'menu__item';
  if (spec.danger)   it.classList.add('menu__item--danger');
  if (spec.selected) it.classList.add('menu__item--selected');
  if (spec.wrap)     it.classList.add('menu__item--wrap');
  if (spec.sub)      it.classList.add('menu__item--sub');
  it.setAttribute('role', spec.selectable ? 'menuitemradio' : 'menuitem');
  if (spec.selectable) it.setAttribute('aria-checked', String(!!spec.selected));
  if (spec.disabled) { it.setAttribute('aria-disabled', 'true'); it.tabIndex = -1; }   /* вне табуляции */
  if (spec.state)    it.classList.add('is-' + spec.state);

  if (spec.icon) {
    const i = document.createElement('span'); i.className = 'menu__item-icon'; i.innerHTML = icon(spec.icon); it.appendChild(i);
  }

  const lab = document.createElement('span'); lab.className = 'menu__item-label'; lab.textContent = spec.label;
  it.appendChild(lab);

  if (spec.hint) { const h = document.createElement('span'); h.className = 'menu__item-hint'; h.textContent = spec.hint; it.appendChild(h); }
  if (spec.sub)  { const cr = document.createElement('span'); cr.className = 'menu__item-caret'; cr.innerHTML = CHEVRON; it.appendChild(cr); }
  /* галочка — всегда СПРАВА, не занимает ведущий слот, поэтому
     подписи выровнены в меню с иконками и без них */
  if (spec.check){ const c = document.createElement('span'); c.className = 'menu__item-check'; c.innerHTML = CHECK; it.appendChild(c); }
  return it;
}

function makeMenu(items, o = {}) {
  const { floating = false, pinned = false, scroll = false, maxH = null } = o;
  const el = document.createElement('div');
  el.className = 'menu';
  el.setAttribute('role', 'menu');
  if (floating)      el.classList.add('menu--floating');
  if (pinned)        el.classList.add('menu--pinned');
  if (scroll)        el.classList.add('menu--scroll');
  if (maxH)          el.style.setProperty('--menu-max-h', maxH + 'px');
  items.forEach(spec => el.appendChild(makeItem(spec)));
  return el;
}

/* ---------- позиционирование: рантайм ДС (scripts/ds-menu.js) ----------
   Страница ничего не считает сама — DSMenu.place() делает разворот вверх,
   флип выравнивания и зажим в границах. boundary=null → вьюпорт. */
function autoPlaceMenu(stage, menu, trigger, prefer, align, gap, boundary) {
  return window.DSMenu.place(menu, trigger, {
    placement: prefer || 'bottom', align: align || 'start',
    gap: gap == null ? 6 : gap, boundary: boundary || null, offsetParent: stage,
  });
}

/* =========================================================================
   PLAYGROUND
   ========================================================================= */
(function () {
  const state = { count: '4', icons: true, hotkeys: true, dividers: true, header: false, danger: true, disabled: false, submenu: false };
  const controls = document.getElementById('pg-controls');
  const stage    = document.getElementById('pg-stage');
  const codeEl   = document.getElementById('pg-code');
  let anchor, trigger, menu, api, open = true;

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

  controls.appendChild(ctlSelect('Количество пунктов', [['2', '2'], ['4', '4'], ['5', '5'], ['6', '6']], 'count'));
  controls.appendChild(ctlToggle('Иконки', 'icons'));
  controls.appendChild(ctlToggle('Горячие клавиши', 'hotkeys'));
  controls.appendChild(ctlToggle('Разделители', 'dividers'));
  controls.appendChild(ctlToggle('Заголовок группы', 'header'));
  controls.appendChild(ctlToggle('Деструктивный пункт', 'danger'));
  controls.appendChild(ctlToggle('Отключённый пункт', 'disabled'));
  controls.appendChild(ctlToggle('Подменю', 'submenu'));

  const POOL = [
    { label: 'Изменить',  icon: 'edit' },
    { label: 'Копировать', icon: 'copy', hint: '⌘C' },
    { label: 'Скачать отчёт', icon: 'download' },
    { label: 'В инструмент', icon: 'link-external' },
    { label: 'Разделить',  icon: 'swap-currency' },
    { label: 'Погасить',   icon: 'refresh' },
  ];

  function buildSpecs() {
    const n = parseInt(state.count, 10);
    const specs = [];
    if (state.header) specs.push({ label: 'Действия', header: true });
    for (let i = 0; i < n; i++) {
      const base = POOL[i % POOL.length];
      const s = { label: base.label };
      if (state.icons) s.icon = base.icon;
      if (base.hint && state.hotkeys) s.hint = base.hint;
      if (state.disabled && i === 1) { s.disabled = true; s.label = base.label; }
      specs.push(s);
    }
    if (state.submenu) {
      specs.push({ label: 'Экспорт', icon: state.icons ? 'file' : null, sub: true });
    }
    if (state.danger) {
      if (state.dividers) specs.push({ divider: true });
      specs.push({ label: 'Удалить', icon: state.icons ? 'trash' : null, danger: true });
    }
    return specs;
  }

  function render() {
    if (menu) menu.remove();
    if (anchor) anchor.remove();
    anchor = document.createElement('span'); anchor.className = 'menu-anchor';
    trigger = document.createElement('button'); trigger.type = 'button'; trigger.className = 'ibtn ibtn--neutral ibtn--l'; trigger.innerHTML = KEBAB;
    trigger.setAttribute('aria-label', 'Действия'); trigger.setAttribute('aria-haspopup', 'menu');
    anchor.appendChild(trigger);
    stage.appendChild(anchor);

    menu = makeMenu(buildSpecs(), { floating: true });
    anchor.appendChild(menu);
    wireSubmenu(menu);
    /* меню в конструкторе показано открытым: рантайм ведёт открытие/закрытие,
       клавиатуру и позиционирование, страница лишь просит открыть по умолчанию */
    api = window.DSMenu.bind(trigger, { menu, placement: 'bottom', align: 'start', gap: 6, autoFocus: false, keepOpen: true, dismiss: false });
    if (open) api.open();

    // code
    codeEl.innerHTML = '<code>&lt;div class="menu" role="menu"&gt;…&lt;/div&gt;</code>';
  }
  function place() { if (api) api.place(); }
  render();
  window.addEventListener('resize', () => { if (menu) place(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (menu) place(); });
})();

/* ---------- подменю: разметка пунктов + поведение из рантайма DSMenu ---------- */
function wireSubmenu(menu, opts) {
  const items = opts && opts.items || [{ label: 'PDF' }, { label: 'Excel (XLSX)' }, { label: 'CSV' }];
  menu.querySelectorAll('.menu__item--sub').forEach(subHost => {
    if (subHost.querySelector('.menu__sub')) return;
    const sub = makeMenu(items, { floating: true });
    sub.classList.add('menu__sub');
    subHost.appendChild(sub);
  });
  window.DSMenu.wireSubs(menu);
}

/* =========================================================================
   ANATOMY
   ========================================================================= */
(function () {
  const d = document.getElementById('anat-diagram');
  const m = makeMenu([
    { label: 'Действия', header: true },
    { label: 'Изменить', icon: 'edit' },
    { label: 'Копировать', icon: 'copy', hint: '⌘C' },
    { label: 'Экспорт', icon: 'file', sub: true },
    { divider: true },
    { label: 'Удалить', icon: 'trash', danger: true },
  ]);
  m.style.minWidth = '240px';
  d.appendChild(m);
  wireSubmenu(m);
})();

/* =========================================================================
   ITEM TYPES
   ========================================================================= */
(function () {
  const host = document.getElementById('types-demo');
  const rows = [
    ['Текст', { label: 'Изменить' }],
    ['С иконкой', { label: 'Изменить', icon: 'edit' }],
    ['С горячей клавишей', { label: 'Копировать', icon: 'copy', hint: '⌘C' }],
    ['Выбранный', { label: 'По дате', check: true, selected: true, selectable: true }],
    ['Подменю', { label: 'Экспорт', icon: 'file', sub: true }],
    ['Деструктивный', { label: 'Удалить', icon: 'trash', danger: true }],
  ];
  rows.forEach(([name, spec]) => {
    const cell = document.createElement('div'); cell.className = 'type-item';
    const h = document.createElement('span'); h.className = 'th'; h.textContent = name;
    const box = makeMenu([spec]); box.style.minWidth = '210px';
    wireSubmenu(box);
    cell.appendChild(h); cell.appendChild(box); host.appendChild(cell);
  });
})();

/* =========================================================================
   HOTKEYS demo
   ========================================================================= */
(function () {
  const host = document.getElementById('hotkeys-demo');
  if (!host) return;
  const m = makeMenu([
    { label: 'Создать', icon: 'add', hint: '⌘N' },
    { label: 'Копировать', icon: 'copy', hint: '⌘C' },
    { label: 'Вставить', icon: 'file', hint: '⌘V' },
    { divider: true },
    { label: 'Удалить', icon: 'trash', hint: '⌦', danger: true },
  ]);
  m.style.minWidth = '250px';
  host.appendChild(m);
})();

/* =========================================================================
   CONTENT — truncate vs wrap
   ========================================================================= */
(function () {
  const trunc = makeMenu([
    { label: 'Правила начисления процентов' },
    { label: 'Экспортировать в Excel и отправить на согласование' },
  ]);
  trunc.style.maxWidth = '240px';
  document.getElementById('content-trunc').appendChild(trunc);

  const wrap = makeMenu([
    { label: 'Правила начисления процентов' },
    { label: 'Экспортировать в Excel и отправить на согласование', wrap: true },
  ]);
  wrap.style.maxWidth = '240px';
  document.getElementById('content-wrap').appendChild(wrap);
})();

/* =========================================================================
   STATES
   ========================================================================= */
(function () {
  const host = document.getElementById('states-demo');
  const rows = [
    ['Default',  {}],
    ['Hover',    { state: 'hover' }],
    ['Focus',    { state: 'focus' }],
    ['Pressed',  { state: 'active' }],
    ['Selected', { check: true, selected: true, selectable: true }],
    ['Disabled', { disabled: true }],
  ];
  rows.forEach(([name, extra]) => {
    const cell = document.createElement('div'); cell.className = 'state-cell';
    const h = document.createElement('span'); h.className = 'state-cap'; h.textContent = name;
    const spec = Object.assign({ label: name === 'Selected' ? 'По дате' : 'Изменить', icon: name === 'Selected' ? null : 'edit' }, extra);
    const m = makeMenu([spec]); m.style.minWidth = '200px';
    cell.appendChild(h); cell.appendChild(m); host.appendChild(cell);
  });
})();

/* =========================================================================
   USAGE — table header · table row · card
   ========================================================================= */
/* открытие/закрытие, клавиатура и позиционирование — рантайм DSMenu */
function openable(anchor, trigger, menu, placement, align) {
  const api = window.DSMenu.bind(trigger, { menu, placement, align, gap: 6 });
  return { place: () => api.place(), set: v => v ? api.open() : api.close() };
}

(function () {
  // --- table header ---
  const th = document.getElementById('use-th');
  if (th) {
    const anchor = document.createElement('span'); anchor.className = 'menu-anchor';
    const trg = document.createElement('button'); trg.type = 'button'; trg.className = 'ibtn ibtn--neutral ibtn--l'; trg.innerHTML = KEBAB; trg.setAttribute('aria-label', 'Ещё'); trg.setAttribute('aria-haspopup', 'menu');
    anchor.appendChild(trg);
    const m = makeMenu([{ label: 'Правила начисления процентов' }], { floating: true });
    m.style.minWidth = '240px';
    anchor.appendChild(m);
    th.appendChild(anchor);
    openable(anchor, trg, m, 'bottom', 'end');
  }

  // --- table row ---
  const tr = document.getElementById('use-tr');
  if (tr) {
    const anchor = document.createElement('span'); anchor.className = 'menu-anchor';
    const trg = document.createElement('button'); trg.type = 'button'; trg.className = 'ibtn ibtn--neutral ibtn--m'; trg.innerHTML = KEBAB; trg.setAttribute('aria-label', 'Действия'); trg.setAttribute('aria-haspopup', 'menu');
    anchor.appendChild(trg);
    const m = makeMenu([{ label: 'Разделить', icon: 'swap-currency' }], { floating: true });
    anchor.appendChild(m);
    tr.appendChild(anchor);
    openable(anchor, trg, m, 'bottom', 'start');
  }

  // --- card ---
  const cd = document.getElementById('use-card');
  if (cd) {
    const anchor = document.createElement('span'); anchor.className = 'menu-anchor';
    const trg = document.createElement('button'); trg.type = 'button'; trg.className = 'ibtn ibtn--neutral ibtn--m'; trg.innerHTML = KEBAB; trg.setAttribute('aria-label', 'Действия'); trg.setAttribute('aria-haspopup', 'menu');
    anchor.appendChild(trg);
    const m = makeMenu([
      { label: 'Изменить', icon: 'edit' },
      { label: 'Погасить', icon: 'refresh' },
      { divider: true },
      { label: 'Удалить', icon: 'trash', danger: true },
    ], { floating: true });
    anchor.appendChild(m);
    cd.appendChild(anchor);
    openable(anchor, trg, m, 'bottom', 'end');
  }
})();

/* =========================================================================
   POSITIONING / AUTO-FLIP (draggable trigger)
   ========================================================================= */
(function () {
  const vp = document.getElementById('flip-vp');
  const trg = document.getElementById('flip-target');
  if (!vp || !trg) return;
  const preferSel = document.getElementById('flip-prefer');
  const menu = makeMenu([
    { label: 'Изменить', icon: 'edit' },
    { label: 'Копировать', icon: 'copy' },
    { divider: true },
    { label: 'Удалить', icon: 'trash', danger: true },
  ], { floating: true, pinned: true });
  vp.appendChild(menu);

  function update() {
    /* границей служит сама демо-область: рантайм сам развернёт меню вверх
       и зажмёт его внутри рамки */
    window.DSMenu.place(menu, trg, {
      placement: preferSel.value, align: 'start', gap: 6, boundary: vp, offsetParent: vp,
    });
  }

  let dragging = false, ox = 0, oy = 0;
  trg.addEventListener('pointerdown', e => { dragging = true; trg.setPointerCapture(e.pointerId); ox = e.offsetX; oy = e.offsetY; });
  trg.addEventListener('pointermove', e => {
    if (!dragging) return;
    const br = vp.getBoundingClientRect();
    let nx = e.clientX - br.left - ox, ny = e.clientY - br.top - oy;
    nx = Math.max(0, Math.min(br.width - trg.offsetWidth, nx));
    ny = Math.max(0, Math.min(br.height - trg.offsetHeight, ny));
    trg.style.left = nx + 'px'; trg.style.top = ny + 'px';
    update();
  });
  trg.addEventListener('pointerup', () => dragging = false);
  preferSel.addEventListener('change', update);
  update();
  window.addEventListener('resize', update);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(update);
})();

/* =========================================================================
   SUBMENU demo (hover to open)
   ========================================================================= */
(function () {
  const host = document.getElementById('submenu-demo');
  if (!host) return;
  const menu = makeMenu([
    { label: 'Изменить', icon: 'edit' },
    { label: 'Экспорт', icon: 'file', sub: true },
    { divider: true },
    { label: 'Удалить', icon: 'trash', danger: true },
  ]);
  menu.style.minWidth = '220px';
  wireSubmenu(menu);
  host.appendChild(menu);
})();

/* =========================================================================
   SCROLL / OVERFLOW demo
   ========================================================================= */
(function () {
  const host = document.getElementById('scroll-demo');
  if (!host) return;
  const many = [];
  for (let i = 1; i <= 12; i++) many.push({ label: 'Сценарий №' + i, icon: i === 1 ? 'check' : null });
  const m = makeMenu(many, { scroll: true, maxH: 240 });
  m.style.minWidth = '220px';
  host.appendChild(m);
})();

/* =========================================================================
   ACCESSIBILITY / KEYBOARD do-don't
   ========================================================================= */
(function () {
  const bad = document.getElementById('a11y-bad');
  if (bad) {
    const m = makeMenu([
      { label: 'Изменить' }, { label: 'Погасить' }, { label: 'Удалить', danger: true },
    ]);
    m.style.minWidth = '180px';
    // визуально: пункты как div без роли — иллюстрация «не так» (не трогаем реальную семантику, показываем текстом)
    bad.appendChild(m);
  }
  const good = document.getElementById('a11y-good');
  if (good) {
    const m = makeMenu([
      { label: 'Изменить', state: 'focus' }, { label: 'Погасить' }, { label: 'Удалить', danger: true },
    ]);
    m.style.minWidth = '180px';
    good.appendChild(m);
  }

  // keyboard table
  const rows = [
    ['↑ / ↓', 'Переход между пунктами'],
    ['Enter / Space', 'Выполнить действие пункта'],
    ['→', 'Открыть подменю'],
    ['← / Esc', 'Закрыть меню / подменю'],
    ['Home / End', 'Первый / последний пункт'],
    ['A–Я', 'Быстрый переход по первой букве (typeahead)'],
  ];
  const tb = document.querySelector('#kbd-table');
  if (tb) tb.innerHTML = rows.map(([k, v]) => `<div class="tbl__row" style="grid-template-columns:8px 0.6fr 2.2fr 8px;"><div class="tc tc--separator"></div><div class="tc"><span class="tc__row"><span class="tc__text"><kbd>${k}</kbd></span></span></div><div class="tc tc--wrap"><span class="tc__row"><span class="tc__text">${v}</span></span></div><div class="tc tc--separator"></div></div>`).join('');
})();

/* =========================================================================
   COPY do / don't
   ========================================================================= */
(function () {
  const bad = document.getElementById('copy-bad');
  if (bad) {
    const m = makeMenu([
      { label: 'Нажмите здесь, чтобы изменить параметры этой операции', wrap: true },
      { label: 'Действие для удаления выбранного элемента навсегда', wrap: true },
    ]);
    m.style.maxWidth = '260px';
    bad.appendChild(m);
  }
  const good = document.getElementById('copy-good');
  if (good) {
    const m = makeMenu([
      { label: 'Изменить', icon: 'edit' },
      { label: 'Удалить', icon: 'trash', danger: true },
    ]);
    m.style.minWidth = '200px';
    good.appendChild(m);
  }
  ['ic-bad1', 'ic-bad2'].forEach(id => { const e = document.getElementById(id); if (e) e.innerHTML = UI.bad; });
  ['ic-good1', 'ic-good2'].forEach(id => { const e = document.getElementById(id); if (e) e.innerHTML = UI.good; });
})();

/* =========================================================================
   TYPOGRAPHY reference
   ========================================================================= */
(function () {
  const tb = document.querySelector('#typo-table tbody');
  if (!tb) return;
  tb.innerHTML = [
    ['Пункт', 'Изменить', '--type-body-m', 'SB Sans Text', '16 / 20'],
    ['Горячая клавиша', '⌘C', '--type-body-s', 'SB Sans Text', '14 / 16'],
    ['Заголовок группы', 'ДЕЙСТВИЯ', '--type-body-xs', 'SB Sans Text', '12 / 16'],
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
      ['Фон меню', '--bg-popup'],
      ['Граница', '--border-light'],
      ['Разделитель', '--border-light'],
    ]},
    { name: 'Пункт', rows: [
      ['Текст', '--text-primary'],
      ['Иконка', '--text-secondary'],
      ['Горячая клавиша', '--text-inactive'],
      ['Фон · hover / focus', '--tertiary'],
    ]},
    { name: 'Деструктивный', rows: [
      ['Текст', '--error-dark'],
      ['Иконка', '--error'],
      ['Фон · hover', '--error-bg-light'],
    ]},
    { name: 'Служебное', rows: [
      ['Выбранный · галочка', '--primary'],
      ['Отключённый · текст', '--text-inactive'],
      ['Заголовок группы', '--text-inactive'],
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

  function measure() {
    const m = makeMenu([{ label: 'Изменить', icon: 'edit' }]);
    host.appendChild(m);
    const it = m.querySelector('.menu__item');
    const ic = m.querySelector('.menu__item-icon');
    const csM = getComputedStyle(m), csI = getComputedStyle(it), csIc = getComputedStyle(ic);
    const r = n => Math.round(parseFloat(n) * 10) / 10;
    const out = {
      itemH: r(csI.minHeight),
      itemPx: r(csI.paddingLeft),
      gap: r(csI.columnGap || csI.gap),
      icon: r(csIc.width),
      font: csI.fontSize,
      radius: r(csM.borderTopLeftRadius),
      minW: r(csM.minWidth),
      maxW: r(csM.maxWidth),
      padY: r(csM.paddingTop),
      shadow: csM.boxShadow,
    };
    m.remove();
    return out;
  }
  const g = measure();
  host.remove();

  const px = v => (typeof v === 'number' ? v + ' px' : v);
  const rows = [
    ['Высота пункта', px(g.itemH)],
    ['Гориз. паддинг пункта', px(g.itemPx)],
    ['Зазор иконка↔текст', px(g.gap)],
    ['Размер иконки', px(g.icon)],
    ['Размер шрифта пункта', g.font],
    ['Верт. паддинг контейнера', px(g.padY)],
    ['Радиус контейнера', px(g.radius)],
    ['Мин. ширина', px(g.minW)],
    ['Макс. ширина', px(g.maxW)],
    ['Тень', g.shadow],
  ];
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
