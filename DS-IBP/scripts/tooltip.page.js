/* =========================================================================
   Tooltip documentation — interactive demos
   ========================================================================= */

const UI_ICONS = {
  bad:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  good: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><circle cx="12" cy="7.5" r=".6" fill="currentColor" stroke="none"/></svg>',
  help: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.2 9.3a2.8 2.8 0 1 1 3.6 2.7c-.6.2-.9.7-.9 1.3v.5"/><circle cx="12" cy="17" r=".6" fill="currentColor" stroke="none"/></svg>',
  trash:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/></svg>',
  download:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 11l5 5 5-5M5 20h14"/></svg>',
};

/* ---------- разметка и позиционирование — общий рантайм, scripts/ds-tooltip.js ---------- */
function makeTip(text, o = {}) { return window.DSTooltip.make(text, o); }

/* демо фиксируют позицию, поэтому flip выключен */
function placeTip(stage, tip, target, placement, align, gap) {
  return window.DSTooltip.place(tip, target,
    { placement, align, gap: gap == null ? 8 : gap, flip: false, offsetParent: stage });
}

/* =========================================================================
   PLAYGROUND
   ========================================================================= */
(function () {
  const state = { type:'main', placement:'top', align:'center', arrow:true, multiline:false,
                  rich:false, text:'Подсказка' };
  const controls = document.getElementById('pg-controls');
  const stage    = document.getElementById('pg-stage');
  const target   = document.getElementById('pg-target');
  const codeEl   = document.getElementById('pg-code');
  let tip = null;

  function select(label, options, getCur, onPick) {
    const wrap = document.createElement('div'); wrap.className = 'ctl';
    const l = document.createElement('div'); l.className = 'lbl'; l.textContent = label; wrap.appendChild(l);
    const box = document.createElement('div'); box.className = 'pg-select';
    const sel = document.createElement('select');
    options.forEach(([v, t]) => { const op = document.createElement('option'); op.value = v; op.textContent = t; if (v === getCur()) op.selected = true; sel.appendChild(op); });
    sel.addEventListener('change', () => { onPick(sel.value); render(); });
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
  function textInput() {
    const wrap = document.createElement('div'); wrap.className = 'ctl';
    const l = document.createElement('div'); l.className = 'lbl'; l.textContent = 'Текст'; wrap.appendChild(l);
    const inp = document.createElement('input'); inp.type = 'text'; inp.className = 'pg-text'; inp.value = state.text; inp.maxLength = 80;
    inp.addEventListener('input', () => { state.text = inp.value || ' '; render(); });
    wrap.appendChild(inp); return wrap;
  }

  controls.appendChild(textInput());
  controls.appendChild(select('Тип', [['main','Main'],['error','Error']], () => state.type, v => state.type = v));
  controls.appendChild(select('Размещение', [['top','Top'],['bottom','Bottom'],['left','Left'],['right','Right']], () => state.placement, v => state.placement = v));
  controls.appendChild(select('Стрелка (выравнивание)', [['start','Start'],['center','Center'],['end','End']], () => state.align, v => state.align = v));
  controls.appendChild(ctlToggle('Стрелка', 'arrow'));
  controls.appendChild(ctlToggle('Богатый контент', 'rich'));
  const multilineCtl = ctlToggle('Перенос (multiline)', 'multiline');
  controls.appendChild(multilineCtl);

  function render() {
    if (tip) tip.remove();
    // rich уже переносит текст — тумблер переноса в этом режиме не нужен
    multilineCtl.classList.toggle('is-off', state.rich);
    tip = makeTip(state.rich ? 'Максимальная сумма, которую банк держит на одном контрагенте. Пересчитывается ночью.' : state.text,
                  { ...state, floating:true, pinned:true, title: state.rich ? state.text : '', action: state.rich ? 'Открыть методику' : '' });
    if (state.multiline && !state.rich) tip.style.maxWidth = '180px';
    stage.appendChild(tip);
    placeTip(stage, tip, target, state.placement, state.align, 8);
    const cls = ['tip','tip--'+state.type,'tip--'+state.placement,'tip--'+state.align];
    if (!state.arrow) cls.push('tip--no-arrow');
    if (state.rich) cls.push('tip--rich');
    if (state.multiline && !state.rich) cls.push('tip--multiline');
    codeEl.innerHTML = '<code>&lt;span class="' + cls.join(' ') + '"&gt;</code>';
  }
  render();
  const reposition = () => { if (tip) placeTip(stage, tip, target, state.placement, state.align, 8); };
  window.addEventListener('resize', reposition);
  /* раскладка pg-kit достраивается после первого render(): сцена получает
     position:relative и уезжает вправо — пересчитываем, когда всё устоялось */
  requestAnimationFrame(() => requestAnimationFrame(reposition));
  window.addEventListener('load', reposition);
  if (window.ResizeObserver) new ResizeObserver(reposition).observe(stage);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(reposition);
})();

/* =========================================================================
   ANATOMY diagram + paddings
   ========================================================================= */
(function () {
  const d = document.getElementById('anat-diagram');
  const t = makeTip('Текст подсказки', { placement:'bottom', align:'center' });
  t.style.transform = 'scale(1.6)';
  d.appendChild(t);

  // paddings — enlarged tooltip with content-box guide + gap labels
  const host = document.getElementById('pad-diagram');
  const box = document.createElement('div'); box.className = 'padbox';
  box.innerHTML =
    '<div class="padtip"><span class="padtip__c">Text</span></div>' +
    '<span class="padlbl padlbl--top">8</span>' +
    '<span class="padlbl padlbl--bot">8</span>' +
    '<span class="padlbl padlbl--left">12</span>' +
    '<span class="padlbl padlbl--right">12</span>';
  host.appendChild(box);
})();

/* =========================================================================
   SIZES
   ========================================================================= */
(function () {
  document.getElementById('size-short').appendChild(makeTip('Скачать PDF', { placement:'bottom', align:'center' }));
  const long = makeTip('Длинный текст подсказки переносится на несколько строк, когда превышает максимальную ширину контейнера.', { placement:'bottom', align:'start', multiline:true });
  long.style.maxWidth = '220px';
  document.getElementById('size-long').appendChild(long);
})();

/* =========================================================================
   TYPES
   ========================================================================= */
(function () {
  const host = document.getElementById('types-demo');
  [['main','Main','Нейтральная подсказка'],['error','Error','Сообщение об ошибке']].forEach(([type,name,txt]) => {
    const item = document.createElement('div'); item.className = 'type-item';
    const h = document.createElement('span'); h.className = 'th'; h.textContent = name;
    const box = document.createElement('div'); box.style.cssText = 'padding:6px 0;';
    box.appendChild(makeTip(txt, { type, placement:'bottom', align:'center' }));
    item.appendChild(h); item.appendChild(box); host.appendChild(item);
  });
})();

/* =========================================================================
   RICH CONTENT — заголовок + описание + действие; тултип интерактивный
   ========================================================================= */
(function () {
  const host = document.getElementById('rich-demo');
  if (!host) return;
  const wrap = document.createElement('span'); wrap.className = 'tip-anchor';
  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'ibtn ibtn--neutral ibtn--m'; btn.innerHTML = UI_ICONS.help;
  btn.setAttribute('aria-label', 'Что такое лимит риска');
  btn.setAttribute('aria-describedby', 'tt-rich');
  wrap.appendChild(btn);

  const tip = makeTip('Максимальная сумма, которую банк держит на одном контрагенте. Пересчитывается ночью после закрытия операционного дня.',
    { placement:'bottom', align:'center', floating:true, rich:true,
      title:'Лимит риска', action:'Открыть методику' });
  tip.id = 'tt-rich'; tip.setAttribute('role', 'tooltip');
  wrap.appendChild(tip);
  host.appendChild(wrap);

  // hover/focus, задержки, Esc и «курсор внутри rich» — общий рантайм
  window.DSTooltip.bind(btn, { tip, placement: 'bottom', align: 'center', gap: 8, flip: false, offsetParent: wrap });
})();

/* =========================================================================
   PLACEMENT VARIANTS GRID (12 positions)
   ========================================================================= */
(function () {
  const grid = document.getElementById('variants-grid');
  const order = [
    ['top','start'],['top','center'],['top','end'],
    ['bottom','start'],['bottom','center'],['bottom','end'],
    ['left','start'],['left','center'],['left','end'],
    ['right','start'],['right','center'],['right','end'],
  ];
  let curType = 'main';
  function build() {
    grid.innerHTML = '';
    order.forEach(([p,a]) => {
      const cell = document.createElement('div'); cell.className = 'vcell';
      const cap = document.createElement('span'); cap.className = 'cap'; cap.textContent = p + ' · ' + a;
      const box = document.createElement('div'); box.className = 'tipbox';
      // pad so side arrows have room
      if (p === 'left' || p === 'right') box.style.padding = '0 10px';
      if (p === 'top') box.style.alignItems = 'flex-end';
      box.appendChild(makeTip('Text', { type:curType, placement:p, align:a }));
      cell.appendChild(cap); cell.appendChild(box); grid.appendChild(cell);
    });
  }
  build();
  const tg = document.getElementById('vtype-toggle');
  tg.addEventListener('click', () => {
    curType = curType === 'main' ? 'error' : 'main';
    tg.setAttribute('aria-pressed', String(curType === 'error'));
    tg.querySelector('span:last-child').textContent = curType === 'error' ? 'Показать Main' : 'Показать Error';
    build();
  });

  // no-arrow comparison
  const withA = makeTip('Со стрелкой', { placement:'bottom', align:'center' });
  document.getElementById('noarrow-with').appendChild(withA);
  const noA = makeTip('Без стрелки', { placement:'bottom', align:'center', arrow:false });
  document.getElementById('noarrow-without').appendChild(noA);
})();

/* =========================================================================
   AUTO-FLIP / COLLISION (draggable target)
   ========================================================================= */
(function () {
  const vp = document.getElementById('flip-vp');
  const target = document.getElementById('flip-target');
  const select = document.getElementById('flip-prefer');
  const tip = makeTip('Подсказка с авто-разворотом', { placement:'bottom', align:'center', floating:true, pinned:true });
  vp.appendChild(tip);

  /* авто-flip, clamp по границе и доводка стрелки в центр цели — общий рантайм */
  function update() {
    window.DSTooltip.place(tip, target,
      { placement: select.value, align: 'center', gap: 8, boundary: vp, offsetParent: vp });
  }

  // drag
  let dragging = false, ox = 0, oy = 0;
  target.addEventListener('pointerdown', e => {
    dragging = true; target.setPointerCapture(e.pointerId);
    ox = e.offsetX; oy = e.offsetY;
  });
  target.addEventListener('pointermove', e => {
    if (!dragging) return;
    const br = vp.getBoundingClientRect();
    let nx = e.clientX - br.left - ox, ny = e.clientY - br.top - oy;
    nx = Math.max(0, Math.min(br.width - target.offsetWidth, nx));
    ny = Math.max(0, Math.min(br.height - target.offsetHeight, ny));
    target.style.left = nx + 'px'; target.style.top = ny + 'px';
    update();
  });
  target.addEventListener('pointerup', () => dragging = false);
  select.addEventListener('change', update);
  update();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(update);
  window.addEventListener('resize', update);
})();

/* =========================================================================
   TRIGGERS & TIMING — real hover/focus with delay
   ========================================================================= */
(function () {
  const bar = document.getElementById('trigger-demo');
  const defs = [
    [UI_ICONS.copy, 'Копировать'],
    [UI_ICONS.download, 'Скачать PDF'],
    [UI_ICONS.trash, 'Удалить'],
  ];
  const SHOW_DELAY = 400;
  defs.forEach(([ic, label], i) => {
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'ibtn ibtn--neutral ibtn--m'; btn.innerHTML = ic;
    btn.setAttribute('aria-label', label);
    const id = 'tt-trigger-' + i;
    btn.setAttribute('aria-describedby', id);
    bar.appendChild(btn);

    const tip = makeTip(label, { placement:'top', align:'center', floating:true });
    tip.setAttribute('role', 'tooltip'); tip.id = id;
    bar.appendChild(tip);

    window.DSTooltip.bind(btn, { tip, placement: 'top', align: 'center', gap: 8, flip: false, offsetParent: bar, delay: SHOW_DELAY });
  });

  // timing table
  const rows = [
    ['Появление (hover)', '≈ 400 мс'],
    ['Появление (focus)', 'мгновенно'],
    ['Скрытие', 'мгновенно'],
    ['Анимация', '140 мс · ease'],
  ];
  document.querySelector('#timing-table').innerHTML = rows.map(([k,v]) =>
    `<div class="tbl__row" style="grid-template-columns:8px 1.3fr 1fr 8px;"><div class="tc tc--separator"></div><div class="tc"><span class="tc__row"><span class="tc__text">${k}</span></span></div><div class="tc tc--numbers"><span class="tc__row"><span class="tc__text">${v}</span></span></div><div class="tc tc--separator"></div></div>`).join('');
})();

/* =========================================================================
   ACCESSIBILITY do / don't
   ========================================================================= */
(function () {
  // bad: actions hidden in a tooltip
  const bad = document.getElementById('a11y-bad');
  const tBad = makeTip('Открыть · Удалить · Поделиться →', { placement:'bottom', align:'center' });
  bad.appendChild(tBad);

  // good: short describing hint
  const good = document.getElementById('a11y-good');
  const tGood = makeTip('Удалить сделку', { placement:'bottom', align:'center' });
  good.appendChild(tGood);
})();

/* =========================================================================
   COPY do / don't
   ========================================================================= */
(function () {
  const bad = document.getElementById('copy-bad');
  const tBad = makeTip('Нажмите эту кнопку, чтобы сохранить введённые данные и перейти к следующему шагу мастера создания сделки.', { placement:'top', align:'center', multiline:true });
  tBad.style.maxWidth = '240px';
  bad.appendChild(tBad);

  const good = document.getElementById('copy-good');
  good.appendChild(makeTip('Сохранить и продолжить', { placement:'top', align:'center' }));
})();

/* ---------- guide icons ---------- */
['ic-bad1','ic-bad2'].forEach(id => document.getElementById(id).innerHTML = UI_ICONS.bad);
['ic-good1','ic-good2'].forEach(id => document.getElementById(id).innerHTML = UI_ICONS.good);

/* =========================================================================
   TYPOGRAPHY reference
   ========================================================================= */
(function () {
  const tb = document.querySelector('#typo-table tbody');
  tb.innerHTML = [
    ['Контент', 'Текст подсказки', '--type-body-s', 'SB Sans Text', '14 / 16'],
  ].map(([part,sample,tok,font,sl]) => `
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
  const probe = document.createElement('span');
  probe.style.cssText = 'position:absolute;left:-9999px;width:0;height:0;';
  document.body.appendChild(probe);
  function resolveHex(cssValue) {
    probe.style.backgroundColor = 'transparent';
    probe.style.backgroundColor = cssValue;
    const v = getComputedStyle(probe).backgroundColor;
    let r,g,b,a=1, m=v.match(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)/i);
    if (m){ r=+m[1]*255; g=+m[2]*255; b=+m[3]*255; if(m[4]!==undefined) a=+m[4]; }
    else { const n=v.match(/[\d.]+/g); if(!n) return cssValue; r=+n[0]; g=+n[1]; b=+n[2]; if(n[3]!==undefined) a=+n[3]; }
    const hx=n=>Math.round(n).toString(16).padStart(2,'0').toUpperCase();
    let s='#'+hx(r)+hx(g)+hx(b); if(a<1) s+=' · '+Math.round(a*100)+'%'; return s;
  }
  const groups = [
    { name:'Main', rows:[
      ['Фон контейнера и стрелки', '--bg-hint'],
      ['Текст', '--text-on-dark'],
    ]},
    { name:'Error', rows:[
      ['Фон контейнера и стрелки', '--error'],
      ['Текст', '--text-on-dark'],
    ]},
  ];
  const root = document.getElementById('color-ref');
  root.innerHTML = groups.map(g => `
    <section class="cref-group">
      <h3>${g.name}</h3>
      <div class="cref-rows">
        ${g.rows.map(([role,tok]) => `
          <div class="cref-row">
            <div class="cref-sw"><div class="cf" style="background:var(${tok});"></div></div>
            <div class="cref-meta"><p class="role">${role}</p><p class="tname">${tok}</p></div>
            <div class="cref-hex">${resolveHex('var('+tok+')')}</div>
          </div>`).join('')}
      </div>
    </section>`).join('');
  probe.remove();
})();

/* =========================================================================
   USAGE TILES
   ========================================================================= */
(function () {
  const ib = document.getElementById('use-iconbtn');
  if (ib) {
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'ibtn ibtn--neutral ibtn--m'; btn.innerHTML = UI_ICONS.trash;
    btn.setAttribute('aria-label', 'Удалить');
    btn.setAttribute('aria-describedby', 'use-tip-1');
    const wrap = document.createElement('span'); wrap.className = 'tip-anchor';
    wrap.appendChild(btn);
    const tip = makeTip('Удалить', { placement:'top', align:'center', floating:true });
    tip.id = 'use-tip-1'; tip.setAttribute('role', 'tooltip');
    wrap.appendChild(tip);
    ib.appendChild(wrap);
    window.DSTooltip.bind(btn, { tip, placement: 'top', align: 'center', gap: 8, flip: false, offsetParent: wrap });
  }

  const tr = document.getElementById('use-truncate');
  if (tr) {
    const wrap = document.createElement('span'); wrap.className = 'tip-anchor';
    const el = document.createElement('span'); el.className = 'use-truncate'; el.textContent = 'Договор поставки оборудования №4521-К от 12.03.2026';
    wrap.appendChild(el);
    const tip = makeTip('Договор поставки оборудования №4521-К от 12.03.2026', { placement:'bottom', align:'center', floating:true, multiline:true });
    tip.style.maxWidth = '220px';
    wrap.appendChild(tip);
    tr.appendChild(wrap);
    // подсказка только при усечении текста — детект в рантайме
    window.DSTooltip.bind(el, { tip, placement: 'bottom', align: 'center', gap: 8, flip: false, offsetParent: wrap, truncatedOnly: true });
  }

  const fl = document.getElementById('use-field');
  if (fl) {
    const wrap = document.createElement('div'); wrap.className = 'use-field';
    wrap.innerHTML = '<span class="use-field__label">ИНН</span>';
    const inputWrap = document.createElement('span'); inputWrap.className = 'tip-anchor'; inputWrap.style.width = '100%';
    const input = document.createElement('span'); input.className = 'use-field__input';
    input.innerHTML = UI_ICONS.info + '<span>7701234567</span>';
    input.setAttribute('tabindex', '0');
    inputWrap.appendChild(input);
    const tip = makeTip('ИНН должен содержать 10 или 12 цифр', { type:'error', placement:'bottom', align:'start', floating:true });
    inputWrap.appendChild(tip);
    wrap.appendChild(inputWrap);
    fl.appendChild(wrap);
    window.DSTooltip.bind(input, { tip, placement: 'bottom', align: 'start', gap: 8, flip: false, offsetParent: inputWrap });
  }
})();

/* =========================================================================
   DEV: redline measured from live component
   ========================================================================= */
(function () {
  const host = document.createElement('div');
  host.style.cssText = 'position:absolute;left:-9999px;top:0;';
  document.body.appendChild(host);
  const t = makeTip('Text', { placement:'top', align:'center' });
  host.appendChild(t);
  const cs = getComputedStyle(t);
  const arrow = t.querySelector('.tip__arrow');
  const csArrow = getComputedStyle(arrow);

  const r = n => Math.round(n*10)/10;
  const px = v => { const n = parseFloat(v); return isNaN(n) ? v : r(n)+' px'; };
  const padding = px(cs.paddingTop) + ' / ' + px(cs.paddingLeft);
  const radius = px(cs.borderRadius);
  const maxWidth = px(cs.maxWidth);
  const arrowH = px(csArrow.height);
  const shadow = cs.boxShadow;
  host.remove();

  const rows = [
    ['Паддинг (верт. / гориз.)', padding],
    ['Радиус контейнера', radius],
    ['Максимальная ширина (--tip-max)', maxWidth],
    ['Высота стрелки (вынос за край)', arrowH],
    ['Тень', shadow],
    ['Задержка появления (hover)', '≈ 400 мс'],
    ['Анимация появления', '140 мс · ease'],
  ];
  const tb = document.querySelector('#dev-spec-table');
  if (tb) tb.innerHTML = rows.map(([p,v]) => `<div class="tbl__row" style="grid-template-columns:8px 1.84fr 0.81fr 8px;"><div class="tc tc--separator"></div><div class="tc"><span class="tc__row"><span class="tc__text">${p}</span></span></div><div class="tc tc--numbers"><span class="tc__row"><span class="tc__text">${v}</span></span></div><div class="tc tc--separator"></div></div>`).join('');
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
      try {
        await navigator.clipboard.writeText(text);
      } catch (e) {
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
