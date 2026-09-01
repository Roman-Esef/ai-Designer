/* =========================================================================
   Label / Helper — documentation page logic
   ========================================================================= */

const LH_ICONS = {
  bad:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  good:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>',
  dash:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M6 12h12"/></svg>',
};
(function(){ const L=window.DS_ICONS||{}; const m={bad:'close',good:'check'};
  for(const k in m){ if(L[m[k]]) LH_ICONS[k]=L[m[k]]; } })();
function lhIcon(name){ const L=window.DS_ICONS||{}; return L[name] || ''; }

/* ---------- builders ----------
   makeLabel: { text, icons:0|1|2, align:'left'|'right', disabled }
   makeHelper: { text, align:'left'|'right', status:'default'|'error'|'disabled' }
   Выравнивание всегда задаётся обоим слотам одинаково — Label и Helper одной пары не
   бывают в разных ориентациях. */
const LH_ICON_GLYPHS = [
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/></svg>',
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21v-3.6L16 5.9a1.5 1.5 0 0 1 2.1 0l1.6 1.6a1.5 1.5 0 0 1 0 2.1L7.6 21H4z"/></svg>',
];
const LH_ICON_LABELS = ['Пояснение', 'Редактировать'];
function makeLabel(o = {}) {
  const { text = 'Label', icons = 0, align = 'left', disabled = false } = o;
  const root = document.createElement('span');
  root.className = 'ds-label ds-label--' + align + (disabled ? ' ds-label--disabled' : '');
  const t = document.createElement('span');
  t.className = 'ds-label__text';
  t.textContent = text;
  root.appendChild(t);
  const count = Math.max(0, Math.min(2, Number(icons) || 0));
  if (count > 0) {
    // иконки в Label — IconButton S neutral
    const wrap = document.createElement('span'); wrap.className = 'ds-label__icons';
    for (let i = 0; i < count; i++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ibtn ibtn--s ibtn--neutral';
      btn.setAttribute('aria-label', LH_ICON_LABELS[i % LH_ICON_LABELS.length]);
      if (disabled) btn.disabled = true;
      btn.innerHTML = LH_ICON_GLYPHS[i % LH_ICON_GLYPHS.length];
      wrap.appendChild(btn);
    }
    root.appendChild(wrap);
  }
  return root;
}
function makeHelper(o = {}) {
  const { text = 'Helper', align = 'left', status = 'default', icon = false } = o;
  const el = document.createElement('span');
  el.className = 'ds-helper ds-helper--' + align
    + (status === 'error' ? ' ds-helper--error' : status === 'disabled' ? ' ds-helper--disabled' : '')
    + (icon ? ' ds-helper--with-icon' : '');
  if (icon) {
    const ic = document.createElement('span'); ic.className = 'ds-helper__icon';
    ic.innerHTML = lhIcon('alert-triangle-filled') || '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 1 21h22L12 2zm0 6v6m0 3h.01"/></svg>';
    const tx = document.createElement('span'); tx.className = 'ds-helper__text'; tx.textContent = text;
    el.appendChild(ic); el.appendChild(tx);
  } else {
    el.textContent = text;
  }
  return el;
}
function classListLabel(o){ return 'ds-label ds-label--' + (o.align || 'left') + (o.disabled ? ' ds-label--disabled' : ''); }
function classListHelper(o){ return 'ds-helper ds-helper--' + o.align + (o.status==='error' ? ' ds-helper--error' : o.status==='disabled' ? ' ds-helper--disabled' : '') + (o.icon ? ' ds-helper--with-icon' : ''); }

/* ===================================================================== *
   PLAYGROUND
 * ===================================================================== */
(function(){
  const state = { host:'field', label:true, icons:0, helper:true, align:'left', status:'default', helperIcon:false };
  const controls = document.getElementById('pg-controls');
  const preview  = document.getElementById('pg-preview');
  const codeEl   = document.getElementById('pg-code');

  function select(label, options, getCur, onPick){
    const wrap=document.createElement('div'); wrap.className='ctl';
    const l=document.createElement('div'); l.className='lbl'; l.textContent=label; wrap.appendChild(l);
    const box=document.createElement('div'); box.className='pg-select';
    const sel=document.createElement('select');
    options.forEach(([val,txt])=>{ const op=document.createElement('option'); op.value=val; op.textContent=txt; if(val===getCur()) op.selected=true; sel.appendChild(op); });
    sel.addEventListener('change',()=>{ onPick(sel.value); render(); });
    box.appendChild(sel); wrap.appendChild(box);
    wrap._select = sel;
    return wrap;
  }
  /* Бинарные опции — селекты: docs-split.js конвертирует их в свитчи ДС (урок Л4) */
  function ctlToggle(label, key){
    const wrap=document.createElement('div'); wrap.className='ctl';
    const l=document.createElement('div'); l.className='lbl'; l.textContent=label; wrap.appendChild(l);
    const box=document.createElement('div'); box.className='pg-select';
    const sel=document.createElement('select');
    [['no','Нет'],['yes','Да']].forEach(([v,t])=>{ const op=document.createElement('option'); op.value=v; op.textContent=t; if((v==='yes')===!!state[key]) op.selected=true; sel.appendChild(op); });
    sel.addEventListener('change',()=>{ state[key]=sel.value==='yes'; render(); });
    box.appendChild(sel); wrap.appendChild(box); return wrap;
  }

  const cHost = select('Родительский компонент',
    [['field','Поле ввода (InputText / Autocomplete / Date / ReadOnly)'],
     ['checkbox','Checkbox'],['radiobutton','Radiobutton'],['switch','Switch']],
    ()=>state.host, v=>{ state.host=v; state.status='default'; });

  const tLabel = ctlToggle('Показывать Label','label');

  const cIcon = select('Иконки в Label',
    [['0','Нет'],['1','Одна'],['2','Две']],
    ()=>String(state.icons), v=>state.icons=Number(v));

  const tHelper = ctlToggle('Показывать Helper','helper');

  const cAlign = select('Выравнивание (Label + Helper, только для полей)',
    [['left','Слева'],['right','Справа']],
    ()=>state.align, v=>state.align=v);

  const tHelperIcon = ctlToggle('Показывать иконку (Helper, Error)','helperIcon');

  const cStatus = select('Состояние', [['default','Default'],['disabled','Disabled'],['error','Error']],
    ()=>state.status, v=>state.status=v);

  controls.appendChild(cHost);
  controls.appendChild(tLabel);
  controls.appendChild(cIcon);
  controls.appendChild(tHelper);
  controls.appendChild(cAlign);
  controls.appendChild(cStatus);
  controls.appendChild(tHelperIcon);

  function refreshAvailability(){
    const isField = state.host === 'field';
    tLabel.classList.toggle('is-off', !isField);
    cIcon.classList.toggle('is-off', !isField || !state.label);
    cAlign.classList.toggle('is-off', !isField);
    tHelperIcon.classList.toggle('is-off', !state.helper || state.status !== 'error');
    // switch has no error state in this DS
    const statusSel = cStatus._select;
    [...statusSel.options].forEach(op=>{ op.disabled = (op.value==='error' && state.host==='switch'); });
    if (state.status==='error' && state.host==='switch') { state.status='default'; statusSel.value='default'; }
    if (state.status !== 'error') state.helperIcon = false;
  }

  function fieldTitle(host){
    return { field:'Название поля', checkbox:'Название чекбокса', radiobutton:'Название варианта', switch:'Название настройки' }[host];
  }

  function render(){
    refreshAvailability();
    preview.innerHTML = '';
    const isField = state.host === 'field';
    const showLabel = isField && state.label;
    const showHelper = state.helper;
    const align = isField ? state.align : 'left';

    if (isField) {
      const wrap = document.createElement('div'); wrap.className = 'field-mock';
      if (showLabel) wrap.appendChild(makeLabel({ text:'Название поля', icons: state.icons, align, disabled: state.status==='disabled' }));
      const box = document.createElement('div'); box.className = 'field-mock__box' + (align==='right' ? ' is-right' : '') + (state.status==='disabled' ? ' is-disabled' : '') + (state.status==='error' ? ' is-error' : '');
      box.textContent = align==='right' ? '120 000 ₽' : 'Введите значение';
      wrap.appendChild(box);
      if (showHelper) wrap.appendChild(makeHelper({ text: state.status==='error' ? 'Нужно выбрать хотя бы один вариант' : 'Подсказка к заполнению', align, status: state.status, icon: state.status==='error' && state.helperIcon }));
      preview.appendChild(wrap);
    } else {
      const kind = state.host; // checkbox | radiobutton | switch
      const cls = kind==='checkbox' ? 'cb' : kind==='radiobutton' ? 'rb' : 'sw';
      const root = document.createElement('label');
      root.className = cls + (state.status==='disabled' ? ' ' + cls + '--disabled' : '') + (state.status==='error' && kind!=='switch' ? ' ' + cls + '--error' : '');
      root.style.pointerEvents = 'none';

      if (kind === 'switch') {
        const control = document.createElement('span'); control.className = 'sw__control';
        control.appendChild(Object.assign(document.createElement('span'), { className:'sw__thumb' }));
        root.appendChild(control);
      } else {
        const box = document.createElement('span'); box.className = cls + '__box';
        box.appendChild(Object.assign(document.createElement('span'), { className: cls + '__mark' }));
        root.appendChild(box);
      }

      const content = document.createElement('span'); content.className = cls + '__content';
      const title = document.createElement('span'); title.style.cssText = 'font:var(--type-body-m); color:' + (state.status==='disabled' ? 'var(--text-inactive)' : 'var(--text-primary)') + ';';
      title.textContent = fieldTitle(kind);
      content.appendChild(title);
      if (showHelper) content.appendChild(makeHelper({ text: state.status==='error' ? 'Нужно выбрать хотя бы один вариант' : 'Пояснение к пункту', align:'left', status: state.status, icon: state.status==='error' && state.helperIcon }));
      root.appendChild(content);
      preview.appendChild(root);
    }

    // code preview
    let code = '';
    if (isField) {
      code = (showLabel ? '<span class="'+classListLabel({align, disabled:state.status==='disabled'})+'">…</span>\n' : '') +
             '<div class="field-mock__box' + (align==='right'?' is-right':'') + '">…</div>' +
             (showHelper ? '\n<span class="'+classListHelper({align,status:state.status,icon:state.status==='error' && state.helperIcon})+'">'+(state.status==='error' && state.helperIcon ? '<span class="ds-helper__icon">…</span><span class="ds-helper__text">…</span>' : '…')+'</span>' : '');
    } else {
      code = '<label class="' + (state.host==='checkbox'?'cb':state.host==='radiobutton'?'rb':'sw') + '">…' +
             (showHelper ? '\n  <span class="'+classListHelper({align:'left',status:state.status,icon:state.status==='error' && state.helperIcon})+'">…</span>' : '') + '\n</label>';
    }
    codeEl.innerHTML = '<code>' + code.replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>') + '</code>';
  }
  render();
})();

/* ===================================================================== *
   RULE — good example (Helper inside Checkbox)
 * ===================================================================== */
(function(){
  const host = document.getElementById('rule-good');
  if (!host) return;
  const root = document.createElement('label'); root.className = 'cb cb--selected'; root.style.pointerEvents='none';
  const box = document.createElement('span'); box.className = 'cb__box';
  box.innerHTML = '<span class="cb__mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg></span>';
  root.appendChild(box);
  const content = document.createElement('span'); content.className = 'cb__content';
  const title = document.createElement('span'); title.style.cssText='font:var(--type-body-m); color:var(--text-primary);'; title.textContent = 'Получать уведомления';
  content.appendChild(title);
  content.appendChild(makeHelper({ text:'Не чаще одного раза в день', align:'left', status:'default' }));
  root.appendChild(content);
  host.appendChild(root);
})();

/* ===================================================================== *
   USAGE MAP
 * ===================================================================== */
(function(){
  const tb = document.querySelector('#usage-table');
  if (!tb) return;
  const rows = [
    ['InputText',          null, true,  true],
    ['InputAutocomplete',  '../molecules/InputAutocomplete.html', true, true],
    ['InputDate',          null, true,  true],
    ['ReadOnlyField',      '../molecules/ReadOnlyField.html', true,  true],
    ['Checkbox',           'Checkbox.html', false, true],
    ['Radiobutton',        'Radiobutton.html', false, true],
    ['Switch',             'Switch.html', false, true],
    ['DropdownList',       '../molecules/DropdownList.html', false, true],
  ];
  function cell(v){ return v ? '<span class="yes">'+LH_ICONS.check+'</span>' : '<span class="no">'+LH_ICONS.dash+'</span>'; }
  tb.innerHTML = rows.map(([name, href, hasLabel, hasHelper])=>`
    <div class="tbl__row" style="grid-template-columns:8px 1.2fr 0.9fr 0.9fr 8px;">
      <div class="tc tc--separator"></div>
      <div class="tc"><span class="tc__row"><span class="tc__text">${href ? '<a class="inl" href="'+href+'">'+name+'</a>' : name}</span></span></div>
      <div class="tc"><span class="tc__row"><span class="tc__text">${cell(hasLabel)}</span></span></div>
      <div class="tc"><span class="tc__row"><span class="tc__text">${cell(hasHelper)}</span></span></div>
      <div class="tc tc--separator"></div>
    </div>`).join('');
})();

/* ===================================================================== *
   ANATOMY DIAGRAMS
 * ===================================================================== */
(function(){
  const l = document.getElementById('anat-label');
  if (l) {
    const wrap = document.createElement('div'); wrap.style.cssText='display:flex; flex-direction:column; gap:14px;';
    wrap.appendChild(makeLabel({ text:'Label', icons:0 }));
    wrap.appendChild(makeLabel({ text:'Label', icons:1 }));
    wrap.appendChild(makeLabel({ text:'Label', icons:2 }));
    l.appendChild(wrap);
  }
  const h = document.getElementById('anat-helper');
  if (h) {
    const wrap = document.createElement('div'); wrap.style.cssText='width:100%; display:flex; flex-direction:column; gap:14px;';
    wrap.appendChild(makeHelper({ text:'Helper', align:'left' }));
    wrap.appendChild(makeHelper({ text:'Helper', align:'right' }));
    wrap.appendChild(makeHelper({ text:'Ошибка в заполнении', align:'left', status:'error', icon:true }));
    h.appendChild(wrap);
  }
})();

/* ===================================================================== *
   LABEL DETAIL
 * ===================================================================== */
(function(){
  const plain = document.getElementById('label-plain');
  const info = document.getElementById('label-info');
  const actions = document.getElementById('label-actions');
  if (plain) plain.appendChild(makeLabel({ text:'Label' }));
  if (info) info.appendChild(makeLabel({ text:'Label', icons:1 }));
  if (actions) actions.appendChild(makeLabel({ text:'Label', icons:2 }));
})();

/* ===================================================================== *
   HELPER DETAIL
 * ===================================================================== */
(function(){
  const left = document.getElementById('helper-left');
  if (left) {
    left.appendChild(makeLabel({ text:'ФИО контрагента', align:'left' }));
    const box = document.createElement('div'); box.className='field-mock__box'; box.textContent='Введите значение'; left.appendChild(box);
    left.appendChild(makeHelper({ text:'Как указано в учредительных документах', align:'left' }));
  }
  const right = document.getElementById('helper-right');
  if (right) {
    right.appendChild(makeLabel({ text:'Сумма сделки', align:'right' }));
    const box = document.createElement('div'); box.className='field-mock__box is-right'; box.textContent='120 000 ₽'; right.appendChild(box);
    right.appendChild(makeHelper({ text:'С учётом комиссии', align:'right' }));
  }
  const errPlain = document.getElementById('helper-error-plain');
  if (errPlain) {
    errPlain.appendChild(makeLabel({ text:'Способ доставки', align:'left' }));
    const box = document.createElement('div'); box.className='field-mock__box is-error'; box.textContent='Не выбрано'; errPlain.appendChild(box);
    errPlain.appendChild(makeHelper({ text:'Нужно выбрать хотя бы один вариант', align:'left', status:'error' }));
  }
  const errIcon = document.getElementById('helper-error-icon');
  if (errIcon) {
    errIcon.appendChild(makeLabel({ text:'Способ доставки', align:'left' }));
    const box = document.createElement('div'); box.className='field-mock__box is-error'; box.textContent='Не выбрано'; errIcon.appendChild(box);
    errIcon.appendChild(makeHelper({ text:'Нужно выбрать хотя бы один вариант', align:'left', status:'error', icon:true }));
  }
})();

/* ===================================================================== *
   COMPOSITION GRID
 * ===================================================================== */
(function(){
  const grid = document.getElementById('compo-grid');
  if (!grid) return;

  function cell(caption, uses, node){
    const c = document.createElement('div'); c.className = 'compo-cell';
    const cap = document.createElement('div'); cap.className = 'compo-cell__cap'; cap.textContent = caption;
    const u = document.createElement('div'); u.className = 'compo-cell__uses'; u.textContent = uses;
    c.appendChild(cap); c.appendChild(node); c.appendChild(u);
    grid.appendChild(c);
  }

  // Checkbox
  (function(){
    const root = document.createElement('label'); root.className='cb'; root.style.pointerEvents='none';
    root.innerHTML = '<span class="cb__box"><span class="cb__mark"></span></span>';
    const content = document.createElement('span'); content.className='cb__content';
    const t=document.createElement('span'); t.style.cssText='font:var(--type-body-m); color:var(--text-primary);'; t.textContent='Показывать архив';
    content.appendChild(t); content.appendChild(makeHelper({ text:'Скрытые сделки тоже попадут в список' }));
    root.appendChild(content);
    cell('Checkbox', 'использует Helper', root);
  })();

  // Radiobutton
  (function(){
    const root = document.createElement('label'); root.className='rb rb--selected'; root.style.pointerEvents='none';
    const rbIcon = ((window.DS_ICONS||{})['radio-button-checked']||'').replace(/fill="(?!none)[^"]*"/g,'fill="currentColor"');
    root.innerHTML = '<span class="rb__box"><span class="rb__mark">'+rbIcon+'</span></span>';
    const content = document.createElement('span'); content.className='rb__content';
    const t=document.createElement('span'); t.style.cssText='font:var(--type-body-m); color:var(--text-primary);'; t.textContent='Ежемесячно';
    content.appendChild(t); content.appendChild(makeHelper({ text:'Списание 1-го числа' }));
    root.appendChild(content);
    cell('Radiobutton', 'использует Helper', root);
  })();

  // Switch
  (function(){
    const root = document.createElement('label'); root.className='sw sw--on'; root.style.pointerEvents='none';
    root.innerHTML = '<span class="sw__control"><span class="sw__thumb"></span></span>';
    const content = document.createElement('span'); content.className='sw__content';
    const t=document.createElement('span'); t.style.cssText='font:var(--type-body-m); color:var(--text-primary);'; t.textContent='Двухфакторная аутентификация';
    content.appendChild(t); content.appendChild(makeHelper({ text:'Потребует код при каждом входе' }));
    root.appendChild(content);
    cell('Switch', 'использует Helper', root);
  })();

  // Field (Input family)
  (function(){
    const wrap = document.createElement('div'); wrap.className='field-mock';
    wrap.appendChild(makeLabel({ text:'ИНН контрагента' }));
    const box=document.createElement('div'); box.className='field-mock__box'; box.textContent='7719000000'; wrap.appendChild(box);
    wrap.appendChild(makeHelper({ text:'10 или 12 цифр' }));
    cell('Поле ввода', 'использует Label + Helper', wrap);
  })();
})();

/* ===================================================================== *
   TYPOGRAPHY REFERENCE
 * ===================================================================== */
(function(){
  const rows = [
    ['Label',  'Label',  '--type-body-xs', 'SB Sans Text', '12 / 16'],
    ['Helper', 'Helper', '--type-body-xs', 'SB Sans Text', '12 / 16'],
  ];
  const tb = document.querySelector('#typo-table tbody');
  if (!tb) return;
  tb.innerHTML = rows.map(([part,sample,tok,font,sl])=>`
    <tr>
      <td>${part}</td>
      <td>${sample}</td>
      <td class="rt-tok"><code>${tok}</code></td>
      <td>${font}</td>
      <td class="rt-num">${sl}</td>
    </tr>`).join('');
})();

/* ===================================================================== *
   COLORS REFERENCE
 * ===================================================================== */
(function(){
  const probe = document.createElement('span');
  probe.style.cssText = 'position:absolute;left:-9999px;width:0;height:0;';
  document.body.appendChild(probe);
  function resolveHex(cssValue){
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
    { name:'Label', rows:[
      ['Текст', '--text-secondary'],
      ['Иконки — IconButton S neutral', '--secondary'],
      ['Disabled', '--text-inactive'],
    ]},
    { name:'Helper', rows:[
      ['Текст', '--text-inactive'],
      ['Error', '--error'],
      ['Disabled', '--text-inactive'],
    ]},
  ];
  const root = document.getElementById('color-ref');
  if (!root) return;
  root.innerHTML = groups.map(g=>`
    <section class="cref-group">
      <h3>${g.name}</h3>
      <div class="cref-rows">
        ${g.rows.map(([role,tok])=>`
          <div class="cref-row">
            <div class="cref-sw"><div class="cf" style="background:var(${tok});"></div></div>
            <div class="cref-meta"><p class="role">${role}</p><p class="tname">${tok}</p></div>
            <div class="cref-hex">${resolveHex('var('+tok+')')}</div>
          </div>`).join('')}
      </div>
    </section>`).join('');
  probe.remove();
})();

/* ---------- guide icons ---------- */
(function(){
  const bad = document.getElementById('ic-bad1'); if (bad) bad.innerHTML = LH_ICONS.bad;
  const good = document.getElementById('ic-good1'); if (good) good.innerHTML = LH_ICONS.good;
})();

/* ===================================================================== *
   SIZES + STATES + DEV SPEC — measured (getComputedStyle), not hardcoded
 * ===================================================================== */
(function(){
  const host = document.createElement('div');
  host.style.cssText = 'position:absolute; left:-9999px; top:0; width:280px; visibility:hidden;';
  const lab = makeLabel({ text:'Label', icons:1 });
  const help = makeHelper({ text:'Helper', icon:false });
  const helpIc = makeHelper({ text:'Ошибка', status:'error', icon:true });
  host.appendChild(lab); host.appendChild(help); host.appendChild(helpIc);
  document.body.appendChild(host);

  const csLabel = getComputedStyle(lab);
  const csHelp = getComputedStyle(help);
  const labelIcon = lab.querySelector('.ds-label__icons svg');
  const helperIcon = helpIc.querySelector('.ds-helper__icon');
  const csLabelIcon = labelIcon ? getComputedStyle(labelIcon) : null;
  const csHelperIcon = helperIcon ? getComputedStyle(helperIcon) : null;
  const csLabelGap = getComputedStyle(lab);
  const csHelperIconGap = getComputedStyle(helpIc);

  const data = {
    labelSize: Math.round(parseFloat(csLabel.fontSize)),
    labelLh: Math.round(parseFloat(csLabel.lineHeight)),
    helperSize: Math.round(parseFloat(csHelp.fontSize)),
    helperLh: Math.round(parseFloat(csHelp.lineHeight)),
    labelGap: Math.round(parseFloat(csLabelGap.columnGap || csLabelGap.gap)),
    labelIconSize: csLabelIcon ? Math.round(parseFloat(csLabelIcon.width)) : null,
    helperIconSize: csHelperIcon ? Math.round(parseFloat(csHelperIcon.width)) : null,
    helperIconGap: Math.round(parseFloat(csHelperIconGap.columnGap || csHelperIconGap.gap)),
  };
  host.remove();

  const sizeTbody = document.querySelector('#size-table');
  if (sizeTbody) {
    const rows = [
      ['Label', '--type-body-xs', data.labelSize + ' / ' + data.labelLh + ' px', data.labelIconSize + ' px'],
      ['Helper', '--type-body-xs', data.helperSize + ' / ' + data.helperLh + ' px', data.helperIconSize + ' px (только Error)'],
    ];
    sizeTbody.innerHTML = rows.map(r => `<div class="tbl__row" style="grid-template-columns:8px 0.7fr 1fr 1.1fr 0.9fr 8px;"><div class="tc tc--separator"></div><div class="tc"><span class="tc__row"><span class="tc__text">${r[0]}</span></span></div><div class="tc"><code>${r[1]}</code></div><div class="tc tc--numbers"><span class="tc__row"><span class="tc__text">${r[2]}</span></span></div><div class="tc tc--numbers"><span class="tc__row"><span class="tc__text">${r[3]}</span></span></div><div class="tc tc--separator"></div></div>`).join('');
  }

  const devTbody = document.querySelector('#dev-spec-table');
  if (devTbody) {
    const rows = [
      ['Кегль / строка — Label и Helper', data.labelSize + ' / ' + data.labelLh + ' px'],
      ['Зазор Label ↔ иконка', data.labelGap + ' px'],
      ['Иконка в Label', data.labelIconSize + ' px'],
      ['Иконка в Helper (Error)', data.helperIconSize + ' px'],
      ['Зазор иконка ↔ текст (Helper Error)', data.helperIconGap + ' px'],
    ];
    devTbody.innerHTML = rows.map(r => `<div class="tbl__row" style="grid-template-columns:8px 1.8fr 1fr 8px;"><div class="tc tc--separator"></div><div class="tc"><span class="tc__row"><span class="tc__text">${r[0]}</span></span></div><div class="tc tc--numbers"><span class="tc__row"><span class="tc__text">${r[1]}</span></span></div><div class="tc tc--separator"></div></div>`).join('');
  }

  const specHost = document.getElementById('state-specs');
  if (specHost) {
    function buildSpec(title, sampleNode, colorRows) {
      const spec = document.createElement('div'); spec.className = 'spec';
      const head = document.createElement('div'); head.className = 'spec__head'; head.textContent = title; spec.appendChild(head);
      const row = document.createElement('div'); row.className = 'spec__row';
      const a = document.createElement('div'); a.className = 'spec__state'; a.textContent = title; row.appendChild(a);
      const b = document.createElement('div'); b.className = 'spec__sample'; b.appendChild(sampleNode); row.appendChild(b);
      const c = document.createElement('div'); c.className = 'spec__colors';
      c.innerHTML = colorRows.map(([role, tok, name]) => `<div class="spec__cline"><b>${role}</b><span class="spec__sw" style="background:var(${tok})"></span><span class="tnm">${name}</span><span class="raw"></span></div>`).join('');
      row.appendChild(c);
      spec.appendChild(row);
      return spec;
    }
    specHost.appendChild(buildSpec('Label · Default', makeLabel({ text:'Label' }), [['Текст', '--text-secondary', 'Text_Secondary']]));
    specHost.appendChild(buildSpec('Label · Disabled', makeLabel({ text:'Label', disabled:true }), [['Текст', '--text-inactive', 'Text_Inactive']]));
    specHost.appendChild(buildSpec('Helper · Default', makeHelper({ text:'Helper' }), [['Текст', '--text-inactive', 'Text_Inactive']]));
    specHost.appendChild(buildSpec('Helper · Error', makeHelper({ text:'Ошибка в заполнении', status:'error', icon:true }), [['Текст / иконка', '--error', 'Error']]));
    specHost.appendChild(buildSpec('Helper · Disabled', makeHelper({ text:'Helper', status:'disabled' }), [['Текст', '--text-inactive', 'Text_Inactive']]));
  }
})();
