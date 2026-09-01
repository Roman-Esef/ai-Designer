/* =========================================================================
   Breadcrumbs documentation — interactive demos
   ========================================================================= */

/* =========================================================================
   CORE — сборка и авто-схлопывание трейла
   ========================================================================= */

function crumbLink(text, href) {
  const li = document.createElement('li'); li.className = 'crumbs__item';
  const a = document.createElement('a'); a.href = href || '#'; a.className = 'link link--muted';
  a.textContent = text;
  a.title = text;
  a.addEventListener('click', e => e.preventDefault());
  li.appendChild(a);
  return li;
}
function crumbCurrentLi(text) {
  const li = document.createElement('li'); li.className = 'crumbs__item crumbs__item--current';
  const span = document.createElement('span'); span.className = 'crumbs__current';
  span.setAttribute('aria-current', 'page'); span.textContent = text; span.title = text;
  li.appendChild(span);
  return li;
}
/* интерактивная версия «…» — клик открывает контекстное меню со скрытыми
   страницами (переиспользует .menu / .menu__item из styles/context-menu.css).
   Меню портируется в document.body (position:fixed) — иначе его обрезал бы
   overflow:hidden контейнера .crumbs, нужный для авто-схлопывания. */
function crumbMore(hidden) {
  const li = document.createElement('li'); li.className = 'crumbs__item';
  const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'crumbs__more';
  btn.textContent = '…';
  btn.setAttribute('aria-haspopup', 'true');
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-label', 'Показать промежуточные страницы: ' + hidden.map(h => h.text).join(', '));
  li.appendChild(btn);

  /* поведение — рантайм ДС (scripts/ds-menu.js): открытие/закрытие, позиция
     с разворотом, клавиатура, Esc. Меню живёт в body с position:fixed —
     иначе его обрезал бы overflow:hidden контейнера .crumbs. */
  const menu = document.createElement('div');
  menu.className = 'menu crumbs__popup';
  menu.style.position = 'fixed';
  menu.hidden = true;
  hidden.forEach(h => {
    const item = document.createElement('button'); item.type = 'button'; item.className = 'menu__item';
    const label = document.createElement('span'); label.className = 'menu__item-label'; label.textContent = h.text;
    item.appendChild(label);
    menu.appendChild(item);
  });
  /* демо перерисовывается — снимаем меню, чей триггер уже вне документа */
  document.querySelectorAll('.crumbs__popup').forEach(m => {
    if (!m.__dsMenu || !document.contains(m.__dsMenu.trigger)) m.remove();
  });
  document.body.appendChild(menu);
  if (window.DSMenu) DSMenu.bind(btn, { menu: menu, align: 'start' });
  return li;
}

/* ---------- floating-тултип для обрезанной крошки (см. tooltip.css) ---------- */
function attachCrumbTip(el, text) {
  const parent = el.parentNode;
  const anchor = document.createElement('span'); anchor.className = 'tip-anchor';
  anchor.style.cssText = 'display:block; position:relative; min-width:0;';
  parent.insertBefore(anchor, el); anchor.appendChild(el);

  const tip = document.createElement('span');
  tip.className = 'tip tip--main tip--top tip--center tip--floating tip--multiline';
  tip.setAttribute('role', 'tooltip');
  tip.style.maxWidth = '260px';
  tip.appendChild(document.createTextNode(text));
  const arrow = document.createElement('span'); arrow.className = 'tip__arrow'; tip.appendChild(arrow);
  anchor.appendChild(tip);

  function place() {
    const ar = anchor.getBoundingClientRect(), er = el.getBoundingClientRect();
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    let left = (er.left - ar.left) + er.width / 2 - tw / 2;
    left = Math.max(-ar.left + 8, left);
    tip.style.left = left + 'px';
    tip.style.top = (er.top - ar.top) - 8 - th + 'px';
  }
  let timer;
  el.addEventListener('mouseenter', () => { timer = setTimeout(() => { place(); tip.classList.add('is-visible'); }, 300); });
  el.addEventListener('mouseleave', () => { clearTimeout(timer); tip.classList.remove('is-visible'); });
  el.setAttribute('tabindex', '0');
  el.addEventListener('focus', () => { place(); tip.classList.add('is-visible'); });
  el.addEventListener('blur', () => tip.classList.remove('is-visible'));
}

/* ---------- измерение: помещается ли построенный <ol> в доступную ширину ---------- */
function overflows(ol) { return ol.scrollWidth > ol.clientWidth + 1; }

function fillFull(ol, items) {
  ol.innerHTML = '';
  items.forEach((it, i) => ol.appendChild(i === items.length - 1 ? crumbCurrentLi(it.text) : crumbLink(it.text, it.href)));
}
function fillCollapsedReal(ol, items) {
  ol.innerHTML = '';
  ol.appendChild(crumbLink(items[0].text, items[0].href));
  ol.appendChild(crumbMore(items.slice(1, -1)));
  ol.appendChild(crumbCurrentLi(items[items.length - 1].text));
}

/* renderCrumbs(host, items) — host уже имеет заданную ширину. Единственный
   размер компонента — S.
   Алгоритм: 1) полный трейл; если не влезает и звеньев > 2 — схлопнуть
   срединные в «…»; 2) текущая крошка ВСЕГДА однострочная и обрезается
   многоточием по CSS (никогда не переносится) — если это реально обрезало
   текст (scrollWidth > clientWidth), вешаем тултип с полным названием.
   Решение "схлопывать ли" измеряется в скрытом зонде той же ширины,
   чтобы не было видимого «мигания». */
function renderCrumbs(host, items) {
  const w = host.clientWidth;

  const probe = document.createElement('ol');
  probe.className = 'crumbs';
  probe.style.cssText = 'position:fixed; visibility:hidden; pointer-events:none; left:-9999px; top:-9999px; width:' + w + 'px;';
  document.body.appendChild(probe);
  fillFull(probe, items);
  const mode = (items.length > 2 && overflows(probe)) ? 'collapsed' : 'full';
  probe.remove();

  const ol = document.createElement('ol');
  ol.className = 'crumbs';
  host.innerHTML = ''; host.appendChild(ol);
  if (mode === 'full') fillFull(ol, items); else fillCollapsedReal(ol, items);

  const curSpan = ol.querySelector('.crumbs__current');
  let truncateCurrent = false;
  if (curSpan && curSpan.scrollWidth > curSpan.clientWidth + 1) {
    truncateCurrent = true;
    attachCrumbTip(curSpan, items[items.length - 1].text);
  }
  return { mode, truncateCurrent };
}

/* удобный билдер списка уровней заданной длины (для конструктора/демо) */
const SAMPLE_NAMES = [
  'Главная', 'Текущий портфель ДИД', 'Сделки моего деска', 'Мои сделки',
  'Клиенты', 'ООО «Ромашка»', 'Договоры', 'Согласования',
];
function sampleItems(n, longCurrent) {
  const items = [];
  for (let i = 0; i < n - 1; i++) items.push({ text: SAMPLE_NAMES[i % SAMPLE_NAMES.length] });
  items.push({ text: longCurrent ? '1234. СамолётИнвестПродакшн — дополнительное соглашение №7 от 12.03.2026' : '1234. СамолётИнвестПродакшн' });
  return items;
}

Object.assign(window, {
  crumbLink, crumbCurrentLi, crumbMore, attachCrumbTip, renderCrumbs, sampleItems, SAMPLE_NAMES,
});

/* запуск всех демо-секций только после полной загрузки страницы (window 'load') и шрифтов (document.fonts.ready):
   renderCrumbs() измеряет реальную ширину/шрифт контейнера — если вызвать её до того, как
   применился styles/breadcrumbs.css и шрифт SB Sans Text, алгоритм схлопывания считает
   по неверным размерам и молча пропускает схлопывание там, где оно нужно. */
function whenReady(fn) {
  function run() {
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fn);
    else fn();
  }
  if (document.readyState === 'complete') run();
  else window.addEventListener('load', run);
}

whenReady(function () {

/* =========================================================================
   PLAYGROUND
   ========================================================================= */
(function () {
  const controls = document.getElementById('pg-controls');
  const previewNav = document.getElementById('pg-preview');
  const box = previewNav.closest('.pg__previewbox');
  const stageEl = previewNav.closest('.pg__stage');
  const codeEl = document.getElementById('pg-code');
  const capEl = document.getElementById('pg-caption');
  if (!controls || !previewNav || !box || !stageEl) return;

  const state = { levels: 4, width: 560, longCurrent: false };

  function slider(label, min, max, step, getCur, onPick, fmt) {
    const wrap = document.createElement('div'); wrap.className = 'ctl';
    const l = document.createElement('div'); l.className = 'lbl'; wrap.appendChild(l);
    const inp = document.createElement('input'); inp.type = 'range'; inp.min = min; inp.max = max; inp.step = step; inp.value = getCur();
    inp.className = 'pg-range';
    function labelText() { l.textContent = label + ' · ' + (fmt ? fmt(getCur()) : getCur()); }
    labelText();
    inp.addEventListener('input', () => { onPick(+inp.value); labelText(); render(); });
    wrap.appendChild(inp); return wrap;
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

  controls.appendChild(slider('Уровней', 2, 7, 1, () => state.levels, v => state.levels = v));
  controls.appendChild(slider('Ширина контейнера', 240, 900, 10, () => state.width, v => state.width = v, v => v + ' px'));
  controls.appendChild(ctlToggle('Длинное название текущей страницы', 'longCurrent'));

  function render() {
    /* контейнер конструктора имеет фиксированную ширину (колонка сплиттера) —
       ширина превью не может превышать реально доступное место, иначе
       алгоритм схлопывания считает по одной ширине, а показывается другая */
    const stagePad = parseFloat(getComputedStyle(stageEl).paddingLeft) + parseFloat(getComputedStyle(stageEl).paddingRight);
    const avail = Math.max(160, stageEl.clientWidth - stagePad);
    const w = Math.min(state.width, avail);
    box.style.width = w + 'px';
    previewNav.style.width = '100%';
    const items = sampleItems(state.levels, state.longCurrent);
    const res = renderCrumbs(previewNav, items);
    codeEl.innerHTML = '<code>&lt;ol class="crumbs"&gt;…&lt;/ol&gt;</code>';
    if (capEl) {
      const parts = [];
      parts.push(res.mode === 'collapsed' ? 'Свёрнуто: срединные звенья в «…»' : 'Полный трейл — всё помещается');
      if (res.truncateCurrent) parts.push('текущая крошка обрезана, полное имя — в тултипе');
      if (w < state.width - 1) parts.push('ширина ограничена панелью: ' + Math.round(w) + ' px');
      capEl.textContent = parts.join(' · ');
    }
  }
  render();
  window.addEventListener('resize', render);
  new ResizeObserver(render).observe(stageEl);
})();

/* =========================================================================
   USAGE — обычный трейл во всю ширину шапки
   ========================================================================= */
(function () {
  const host = document.getElementById('usage-crumbs');
  if (!host) return;
  renderCrumbs(host, sampleItems(4, false));
})();

/* =========================================================================
   ANATOMY
   ========================================================================= */
(function () {
  const host = document.getElementById('anat-art');
  if (!host) return;
  // узкая обёртка — форсируем схлопывание, чтобы показать «…» на диаграмме
  host.style.maxWidth = '320px';
  host.style.width = '100%';
  renderCrumbs(host, [
    { text: 'Главная' }, { text: 'Клиенты' }, { text: 'ООО «Ромашка»' },
    { text: 'Сделки' }, { text: 'Договоры' }, { text: 'Договор №4521' },
  ]);
})();

/* =========================================================================
   SIZES — единственный размер компонента
   ========================================================================= */
(function () {
  const host = document.getElementById('sizes-row');
  if (!host) return;
  const box = document.createElement('div'); box.style.cssText = 'max-width:360px; width:100%; min-width:0;';
  host.appendChild(box);
  renderCrumbs(box, sampleItems(3, false));
})();

/* =========================================================================
   STATES
   ========================================================================= */
(function () {
  const rows = [
    /* короткие имена и запас по ширине — трейл гарантированно НЕ схлопывается,
       чтобы наглядно отличаться от строки «Свёрнуто» ниже */
    ['stt-default', 420, [{ text: 'Главная' }, { text: 'Сделки' }, { text: 'Договор №4521' }]],
    ['stt-condensed', 320, sampleItems(6, false)],
    ['stt-truncated', 220, sampleItems(3, true)],
  ];
  rows.forEach(([id, w, items]) => {
    const host = document.getElementById(id);
    if (!host) return;
    /* max-width, не фиксированная width — не может раздуть grid-ячейку */
    host.style.maxWidth = w + 'px';
    host.style.width = '100%';
    renderCrumbs(host, items);
  });
  // hover = focus force-states — статичные ссылки без сборки трейла
  // (оформление идентично: одна и та же пара правил в CSS)
  const hoverHost = document.getElementById('stt-hover');
  if (hoverHost) {
    const a = document.createElement('a'); a.href = '#'; a.className = 'link link--muted is-hover'; a.textContent = 'Сделки моего деска';
    hoverHost.appendChild(a);
  }
  const focusHost = document.getElementById('stt-focus');
  if (focusHost) {
    const a = document.createElement('a'); a.href = '#'; a.className = 'link link--muted is-focus'; a.textContent = 'Сделки моего деска';
    focusHost.appendChild(a);
  }
  const expandedHost = document.getElementById('stt-expanded');
  if (expandedHost) {
    expandedHost.style.maxWidth = '320px';
    expandedHost.style.width = '100%';
    renderCrumbs(expandedHost, sampleItems(6, false));
    const btn = expandedHost.querySelector('.crumbs__more');
    if (btn) setTimeout(() => btn.click(), 60);
  }
})();

/* =========================================================================
   CONTENT — единственная крошка / длинное родительское звено
   ========================================================================= */
(function () {
  const single = document.getElementById('content-single');
  if (single) {
    single.innerHTML = '<span style="font: var(--type-body-m); color: var(--text-inactive);">— компонент не показывается (страница первого уровня)</span>';
  }
  const longParent = document.getElementById('content-longparent');
  if (longParent) {
    longParent.style.maxWidth = '380px';
    longParent.style.width = '100%';
    renderCrumbs(longParent, [
      { text: 'Главная' },
      { text: 'Управление рисками контрагентов и лимитов' },
      { text: 'Лимит №88' },
    ]);
  }
})();

/* =========================================================================
   CONTENT do/don't icons
   ========================================================================= */
(function(){
  const UI = {
    bad:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    good: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>',
  };
  document.querySelectorAll('[data-ic="bad"]').forEach(el => el.innerHTML = UI.bad);
  document.querySelectorAll('[data-ic="good"]').forEach(el => el.innerHTML = UI.good);
})();

/* =========================================================================
   ACCESSIBILITY demo — клавиатурный проход
   ========================================================================= */
(function () {
  const host = document.getElementById('a11y-crumbs');
  if (!host) return;
  host.style.maxWidth = '520px';
  host.style.width = '100%';
  renderCrumbs(host, sampleItems(4, false));
})();

/* =========================================================================
   TYPOGRAPHY
   ========================================================================= */
(function () {
  const tb = document.querySelector('#typo-table');
  if (!tb) return;
  tb.innerHTML = '<div class="tbl__row" style="grid-template-columns:8px 1.84fr 0.68fr 1.35fr 0.77fr 8px;"><div class="tc tc--separator"></div><div class="tc"><span class="tc__row"><span class="tc__text">S (единственный размер)</span></span></div><div class="tc"><code>--type-body-s</code></div><div class="tc tc--numbers"><span class="tc__row"><span class="tc__text">14 / 16</span></span></div><div class="tc" id="typo-sample-s"></div><div class="tc tc--separator"></div></div>';
  const cell = document.getElementById('typo-sample-s');
  if (cell) {
    cell.style.maxWidth = '260px';
    cell.style.width = '100%';
    renderCrumbs(cell, sampleItems(2, false));
  }
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
    { name: 'Родительские звенья · Breadcrumbs_1', rows: [
      ['Default', '--text-inactive'],
      ['Hover = Focus', '--text-secondary'],
      ['Pressed', '--text-primary'],
    ] },
    { name: 'Текущая страница · Breadcrumbs_2 / служебное', rows: [
      ['Текущая крошка', '--text-primary'],
      ['Разделитель «/»', '--text-inactive'],
      ['«…» (свёрнуто)', '--text-inactive'],
      ['«…» hover = focus / open', '--text-secondary'],
    ] },
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
   DEV — redline measured from live component
   ========================================================================= */
(function () {
  const tb = document.querySelector('#dev-spec-table');
  if (!tb) return;
  const host = document.createElement('div');
  host.style.cssText = 'position:absolute; left:-9999px; top:0; width:900px;';
  document.body.appendChild(host);

  const ol = document.createElement('ol'); ol.className = 'crumbs';
  ol.appendChild(crumbLink('Главная'));
  ol.appendChild(crumbCurrentLi('Договор №4521'));
  host.appendChild(ol);
  const cs = getComputedStyle(ol);
  const item = ol.querySelector('.crumbs__item');
  const cur = ol.querySelector('.crumbs__current');
  const csCur = getComputedStyle(cur);
  const d = {
    fz: parseFloat(cs.fontSize),
    lh: parseFloat(cs.lineHeight),
    gap: cs.columnGap,
    sepGap: getComputedStyle(item, '::after').marginLeft,
    curWeight: csCur.fontWeight,
  };
  host.remove();
  const px = v => { const n = parseFloat(v); return isNaN(n) ? v : (Math.round(n * 10) / 10) + ' px'; };
  const rows = [
    ['Размер / интерлиньяж', Math.round(d.fz * 10) / 10 + ' / ' + Math.round(d.lh * 10) / 10 + ' px'],
    ['Зазор между звеньями (ol gap)', px(d.gap)],
    ['Отступ перед разделителем «/»', px(d.sepGap)],
    ['Начертание текущей крошки', d.curWeight],
  ];
  tb.innerHTML = rows.map(([label, val]) => `<div class="tbl__row" style="grid-template-columns:8px 1.84fr 0.81fr 8px;"><div class="tc tc--separator"></div><div class="tc"><span class="tc__row"><span class="tc__text">${label}</span></span></div><div class="tc tc--numbers"><span class="tc__row"><span class="tc__text">${val}</span></span></div><div class="tc tc--separator"></div></div>`).join('');
})();

/* =========================================================================
   DEV: copy-to-clipboard on code panels
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
        const ta = document.createElement('textarea');
        ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); } catch (e2) {}
        ta.remove();
      }
      btn.classList.add('is-copied');
      const prev = label.textContent;
      label.textContent = 'Скопировано';
      setTimeout(() => { btn.classList.remove('is-copied'); label.textContent = prev; }, 1600);
    });
  });
})();
}); /* end whenReady */
