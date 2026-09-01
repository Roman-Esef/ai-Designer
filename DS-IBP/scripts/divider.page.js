/* =========================================================================
   Divider — documentation page logic
   ========================================================================= */

/* ---------- icons (fallback, overridden by DS_ICONS if present) ---------- */
const DVD_UI = {
  bad:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  good: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>',
};
(function(){ const L=window.DS_ICONS||{}; const m={bad:'close',good:'check'};
  for(const k in m){ if(L[m[k]]) DVD_UI[k]=L[m[k]]; } })();

/* ---------- divider factory ----------
   o: { orientation:'h'|'v', variant:'full'|'inset'|'middle'|'section',
        strong, dashed, label, align:'left'|'center'|'right' } */
function makeDivider(o = {}) {
  const { orientation='h', variant='full', strong=false, dashed=false,
          label=null, align='center' } = o;

  // divider with text label (horizontal only)
  if (label != null && orientation === 'h' && variant !== 'section') {
    const wrap = document.createElement('div');
    wrap.className = 'dvd-text dvd-text--' + align;
    if (strong) wrap.classList.add('dvd-text--strong');
    if (dashed) wrap.classList.add('dvd-text--dashed');
    wrap.setAttribute('role', 'separator');
    const l = document.createElement('span');
    l.className = 'dvd-text__label';
    l.textContent = label;
    wrap.appendChild(l);
    return wrap;
  }

  const el = document.createElement(orientation === 'h' ? 'hr' : 'div');
  el.className = 'dvd dvd--' + orientation;
  if (orientation === 'h') {
    if (variant === 'inset')   el.classList.add('dvd--inset');
    if (variant === 'middle')  el.classList.add('dvd--middle');
  }
  if (variant === 'section') el.classList.add('dvd--section');
  if (strong) el.classList.add('dvd--strong');
  if (dashed) el.classList.add('dvd--dashed');
  if (orientation === 'v') {
    el.setAttribute('role', 'separator');
    el.setAttribute('aria-orientation', 'vertical');
  }
  return el;
}

function classListFor(o){
  const { orientation='h', variant='full', strong, dashed, label, align } = o;
  if (label != null && orientation === 'h' && variant !== 'section') {
    const c = ['dvd-text','dvd-text--'+align];
    if (strong) c.push('dvd-text--strong');
    if (dashed) c.push('dvd-text--dashed');
    return c.join(' ');
  }
  const c = ['dvd','dvd--'+orientation];
  if (orientation==='h' && variant==='inset')  c.push('dvd--inset');
  if (orientation==='h' && variant==='middle') c.push('dvd--middle');
  if (variant==='section') c.push('dvd--section');
  if (strong) c.push('dvd--strong');
  if (dashed) c.push('dvd--dashed');
  return c.join(' ');
}

/* ---------- generic helpers for a sample “content row” ---------- */
function textBlock(t, dim){
  const p = document.createElement('p');
  p.style.cssText = 'margin:0; font:var(--type-body-m); color:var(' + (dim?'--text-inactive':'--text-primary') + ');';
  p.textContent = t;
  return p;
}

/* ===================================================================== *
   PLAYGROUND
 * ===================================================================== */
(function(){
  const state = { orientation:'h', variant:'full', strong:false, dashed:false, withText:false, align:'center' };
  const controls = document.getElementById('pg-controls');
  const stage    = document.getElementById('pg-stage');
  const codeEl   = document.getElementById('pg-code');

  function select(label, options, getCur, onPick, disabledFn){
    const wrap=document.createElement('div'); wrap.className='ctl';
    const l=document.createElement('div'); l.className='lbl'; l.textContent=label; wrap.appendChild(l);
    const box=document.createElement('div'); box.className='pg-select';
    const sel=document.createElement('select');
    options.forEach(([val,txt])=>{ const op=document.createElement('option'); op.value=val; op.textContent=txt; if(val===getCur()) op.selected=true; sel.appendChild(op); });
    sel.addEventListener('change',()=>{ onPick(sel.value); render(); });
    box.appendChild(sel); wrap.appendChild(box);
    wrap.dataset.disable = disabledFn ? '1' : '';
    wrap._update = ()=>{ if(disabledFn){ const d=disabledFn(); sel.disabled=d; wrap.style.opacity=d?'.4':'1'; wrap.style.pointerEvents=d?'none':'auto'; } };
    return wrap;
  }
  /* Бинарные опции — селекты: docs-split.js конвертирует их в свитчи ДС (урок Л4);
     disabledFn — как у селектов: блокирует контрол, когда условие не выполнено */
  function ctlToggle(label, key, disabledFn){
    const wrap=document.createElement('div'); wrap.className='ctl';
    const l=document.createElement('div'); l.className='lbl'; l.textContent=label; wrap.appendChild(l);
    const box=document.createElement('div'); box.className='pg-select';
    const sel=document.createElement('select');
    [['no','Нет'],['yes','Да']].forEach(([v,t])=>{ const op=document.createElement('option'); op.value=v; op.textContent=t; if((v==='yes')===!!state[key]) op.selected=true; sel.appendChild(op); });
    sel.addEventListener('change',()=>{ state[key]=sel.value==='yes'; render(); });
    box.appendChild(sel); wrap.appendChild(box);
    wrap._update = ()=>{ if(disabledFn){ const d=disabledFn(); sel.disabled=d; wrap.style.opacity=d?'.4':'1'; wrap.style.pointerEvents=d?'none':'auto'; } };
    return wrap;
  }

  const cOrient = select('Ориентация',
    [['h','Горизонтальный'],['v','Вертикальный']],
    ()=>state.orientation, v=>{ state.orientation=v; if(v==='v'){ state.withText=false; tText.querySelector('select').value='no'; } });
  const cVariant = select('Вариант',
    [['full','Full — на всю длину'],['inset','Inset — отступ слева'],['middle','Middle — отступ с двух сторон'],['section','Section — блок 8px']],
    ()=>state.variant, v=>state.variant=v,
    ()=>state.orientation==='v');
  const cAlign = select('Выравнивание подписи',
    [['left','Слева'],['center','По центру'],['right','Справа']],
    ()=>state.align, v=>state.align=v,
    ()=>!(state.withText && state.orientation==='h'));

  controls.appendChild(cOrient);
  controls.appendChild(cVariant);

  const tStrong = ctlToggle('Контрастная линия','strong');
  const tDashed = ctlToggle('Пунктир','dashed');
  const tText   = ctlToggle('С подписью','withText', ()=>state.orientation==='v');
  controls.appendChild(tStrong);
  controls.appendChild(tDashed);
  controls.appendChild(tText);
  controls.appendChild(cAlign);

  const updaters=[cVariant, cAlign, tText];

  function render(){
    updaters.forEach(u=>u._update && u._update());
    // section variant has no text
    const o = {
      orientation: state.orientation,
      variant: state.variant,
      strong: state.strong,
      dashed: state.dashed && state.variant!=='section',
    };
    if (state.withText && state.orientation==='h' && state.variant!=='section') {
      o.label = 'или'; o.align = state.align;
    }
    stage.innerHTML='';
    const host = document.createElement('div');
    if (state.orientation==='h') {
      host.style.cssText='width:100%; max-width:460px; display:flex; flex-direction:column; gap:0;';
      host.appendChild(textBlock('Блок контента сверху'));
      const pad=document.createElement('div'); pad.style.height='18px'; host.appendChild(pad);
      host.appendChild(makeDivider(o));
      const pad2=document.createElement('div'); pad2.style.height='18px'; host.appendChild(pad2);
      host.appendChild(textBlock('Блок контента снизу'));
    } else {
      host.style.cssText='display:flex; align-items:center; gap:20px; height:64px;';
      host.appendChild(textBlock('Слева'));
      host.appendChild(makeDivider(o));
      host.appendChild(textBlock('Справа'));
    }
    stage.appendChild(host);
    codeEl.innerHTML = '<code>'+(o.label!=null
      ? '&lt;div class="'+classListFor(o)+'"&gt;…&lt;/div&gt;'
      : (state.orientation==='h' ? '&lt;hr class="'+classListFor(o)+'"&gt;' : '&lt;div class="'+classListFor(o)+'"&gt;&lt;/div&gt;'))+'</code>';
  }
  render();
})();

/* ===================================================================== *
   ORIENTATION
 * ===================================================================== */
(function(){
  const h = document.getElementById('orient-h');
  const hb = document.createElement('div');
  hb.style.cssText='width:100%; max-width:420px; display:flex; flex-direction:column;';
  hb.appendChild(textBlock('Раздел A'));
  const s1=document.createElement('div'); s1.style.height='16px'; hb.appendChild(s1);
  hb.appendChild(makeDivider({orientation:'h'}));
  const s2=document.createElement('div'); s2.style.height='16px'; hb.appendChild(s2);
  hb.appendChild(textBlock('Раздел B'));
  h.appendChild(hb);

  const v = document.getElementById('orient-v');
  const vb = document.createElement('div');
  vb.style.cssText='display:flex; align-items:center; gap:20px; height:56px;';
  vb.appendChild(textBlock('Пункт 1'));
  vb.appendChild(makeDivider({orientation:'v'}));
  vb.appendChild(textBlock('Пункт 2'));
  vb.appendChild(makeDivider({orientation:'v'}));
  vb.appendChild(textBlock('Пункт 3'));
  v.appendChild(vb);
})();

/* ===================================================================== *
   ANATOMY
 * ===================================================================== */
(function(){
  const d = document.getElementById('anat-diagram');
  const box=document.createElement('div'); box.style.cssText='width:100%; max-width:360px; display:flex; flex-direction:column; gap:22px;';
  const lineWrap=document.createElement('div'); lineWrap.style.cssText='position:relative; padding:10px 0;';
  lineWrap.appendChild(makeDivider({orientation:'h', strong:true}));
  box.appendChild(lineWrap);
  d.appendChild(box);
})();

/* ===================================================================== *
   VARIANTS — full / inset / middle
 * ===================================================================== */
(function(){
  const host = document.getElementById('variants');
  const defs = [
    ['Full', 'full',   'На всю ширину контейнера. Базовый вариант — отделяет независимые блоки.'],
    ['Inset', 'inset', 'Отступ слева на 16px — выравнивает линию по тексту, когда слева есть иконка или аватар.'],
    ['Middle','middle','Отступ с обеих сторон — лёгкое разделение элементов внутри одного блока.'],
  ];
  defs.forEach(([name,variant,desc])=>{
    const cell=document.createElement('div'); cell.className='vcell';
    const cap=document.createElement('div'); cap.className='vcap'; cap.innerHTML='<span class="vcap__name">'+name+'</span><span class="vcap__tok">.dvd--'+(variant==='full'?'h':variant)+'</span>';
    const demo=document.createElement('div'); demo.className='vdemo';
    // list-like rows with leading dot/avatar to show inset alignment
    [0,1].forEach(i=>{
      const row=document.createElement('div'); row.className='vrow';
      const av=document.createElement('span'); av.className='vrow__av';
      const txt=document.createElement('span'); txt.className='vrow__txt'; txt.textContent='Элемент списка '+(i+1);
      row.appendChild(av); row.appendChild(txt); demo.appendChild(row);
      if(i===0) demo.appendChild(makeDivider({orientation:'h', variant}));
    });
    const p=document.createElement('p'); p.className='vdesc'; p.textContent=desc;
    cell.appendChild(cap); cell.appendChild(demo); cell.appendChild(p);
    host.appendChild(cell);
  });
})();

/* ===================================================================== *
   DIVIDER WITH TEXT
 * ===================================================================== */
(function(){
  const host = document.getElementById('with-text');
  const aligns = [['left','Слева'],['center','По центру'],['right','Справа']];
  aligns.forEach(([align,name])=>{
    const cell=document.createElement('div'); cell.className='tcell';
    const cap=document.createElement('div'); cap.className='vcap'; cap.innerHTML='<span class="vcap__name">'+name+'</span><span class="vcap__tok">.dvd-text--'+align+'</span>';
    const demo=document.createElement('div'); demo.style.cssText='width:100%;';
    demo.appendChild(makeDivider({orientation:'h', label:'Ещё 12 сделок', align}));
    cell.appendChild(cap); cell.appendChild(demo);
    host.appendChild(cell);
  });

  // the classic "or" separator between actions
  const orHost = document.getElementById('with-text-or');
  const card = document.createElement('div');
  card.style.cssText='width:100%; max-width:340px; display:flex; flex-direction:column; gap:14px;';
  const b1=document.createElement('button'); b1.className='btn btn--accent btn--m'; b1.type='button'; b1.style.width='100%'; b1.textContent='Войти';
  const orDiv=makeDivider({orientation:'h', label:'или'});
  const b2=document.createElement('button'); b2.className='btn btn--outline btn--m'; b2.type='button'; b2.style.width='100%'; b2.textContent='Создать аккаунт';
  card.appendChild(b1); card.appendChild(orDiv); card.appendChild(b2);
  orHost.appendChild(card);
})();

/* ===================================================================== *
   THICKNESS / WEIGHT
 * ===================================================================== */
(function(){
  const host = document.getElementById('weight');
  const defs = [
    ['Hairline · 1px', { strong:false }, 'Линия по умолчанию — токен --border-light. Незаметное деление внутри блока.'],
    ['Контрастная · 1px', { strong:true }, 'Токен --border-primary. Более заметная граница между крупными зонами.'],
    ['Section · 8px', { variant:'section' }, 'Толстый блок-секция для группировки независимых разделов длинной страницы.'],
  ];
  defs.forEach(([name,o,desc])=>{
    const cell=document.createElement('div'); cell.className='wcell';
    const cap=document.createElement('div'); cap.className='vcap'; cap.innerHTML='<span class="vcap__name">'+name+'</span>';
    const demo=document.createElement('div'); demo.style.cssText='width:100%; display:flex; flex-direction:column; gap:14px;';
    demo.appendChild(textBlock('Контент', true));
    demo.appendChild(makeDivider(Object.assign({orientation:'h'},o)));
    demo.appendChild(textBlock('Контент', true));
    const p=document.createElement('p'); p.className='vdesc'; p.textContent=desc;
    cell.appendChild(cap); cell.appendChild(demo); cell.appendChild(p);
    host.appendChild(cell);
  });
})();

/* ===================================================================== *
   SPACING — do/don't на отступы
 * ===================================================================== */
(function(){
  // bad: divider tight to content, no breathing room
  const bad = document.getElementById('space-bad');
  const gb=document.createElement('div'); gb.style.cssText='width:100%; display:flex; flex-direction:column;';
  gb.appendChild(textBlock('Заголовок раздела'));
  gb.appendChild(makeDivider({orientation:'h'}));
  gb.appendChild(textBlock('Текст идёт сразу под линией без отступа.', true));
  bad.appendChild(gb);

  // good: even spacing above/below
  const good = document.getElementById('space-good');
  const gg=document.createElement('div'); gg.style.cssText='width:100%; display:flex; flex-direction:column;';
  gg.appendChild(textBlock('Заголовок раздела'));
  const s1=document.createElement('div'); s1.style.height='16px'; gg.appendChild(s1);
  gg.appendChild(makeDivider({orientation:'h'}));
  const s2=document.createElement('div'); s2.style.height='16px'; gg.appendChild(s2);
  gg.appendChild(textBlock('Симметричные отступы сверху и снизу.', true));
  good.appendChild(gg);
})();

/* ===================================================================== *
   USAGE EXAMPLES
 * ===================================================================== */
(function(){
  /* --- list (inset dividers, aligned to text) --- */
  const list = document.getElementById('ex-list');
  const lc=document.createElement('div'); lc.className='ex-card'; lc.style.maxWidth='360px';
  const people=[['ИБ','Иван Белов','Менеджер'],['ВК','Вера Котова','Аналитик'],['МА','Мурад Алиев','Архитектор']];
  people.forEach((p,i)=>{
    const row=document.createElement('div'); row.className='ex-row';
    const av=document.createElement('span'); av.className='ex-av'; av.textContent=p[0];
    const meta=document.createElement('div'); meta.className='ex-meta';
    meta.innerHTML='<span class="ex-name">'+p[1]+'</span><span class="ex-sub">'+p[2]+'</span>';
    row.appendChild(av); row.appendChild(meta); lc.appendChild(row);
    if(i<people.length-1) lc.appendChild(makeDivider({orientation:'h', variant:'inset'}));
  });
  list.appendChild(lc);

  /* --- menu (full-bleed divider separating groups) --- */
  const menu = document.getElementById('ex-menu');
  const mc=document.createElement('div'); mc.className='ex-menu'; mc.style.maxWidth='240px';
  ['Открыть','Переименовать','Дублировать'].forEach(t=>{ const it=document.createElement('div'); it.className='ex-mi'; it.textContent=t; mc.appendChild(it); });
  mc.appendChild(makeDivider({orientation:'h'}));
  const del=document.createElement('div'); del.className='ex-mi ex-mi--danger'; del.textContent='Удалить'; mc.appendChild(del);
  menu.appendChild(mc);

  /* --- toolbar (vertical dividers between groups) --- */
  const tb = document.getElementById('ex-toolbar');
  const tc=document.createElement('div'); tc.className='ex-toolbar';
  const ic = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">';
  const icons=[
    ic+'<path d="M5 12h14"/></svg>',
    ic+'<path d="M12 5v14M5 12h14"/></svg>',
    'sep',
    ic+'<path d="M4 7h16M4 12h16M4 17h10"/></svg>',
    ic+'<path d="M4 7h16M7 12h10M10 17h4"/></svg>',
    'sep',
    ic+'<circle cx="12" cy="12" r="3"/><path d="M3 12c2-4 6-6 9-6s7 2 9 6c-2 4-6 6-9 6s-7-2-9-6Z"/></svg>',
  ];
  icons.forEach(g=>{
    if(g==='sep'){ tc.appendChild(makeDivider({orientation:'v'})); return; }
    const b=document.createElement('button'); b.type='button'; b.className='ex-ic'; b.innerHTML=g; tc.appendChild(b);
  });
  tb.appendChild(tc);

  /* --- modal (КНП) — horizontal in header/footer, vertical between columns --- */
  const modal = document.getElementById('ex-modal');
  const mw=document.createElement('div'); mw.className='ex-modal';
  // header
  const head=document.createElement('div'); head.className='ex-modal__head';
  head.innerHTML='<span class="ex-modal__title">КНП</span><span class="ex-modal__x">'+ic+'<path d="M6 6l12 12M18 6L6 18"/></svg>'+'</span>';
  mw.appendChild(head);
  mw.appendChild(makeDivider({orientation:'h'}));
  // body — 3 columns split by vertical dividers
  const body=document.createElement('div'); body.className='ex-modal__body';
  function col(title, lines){
    const c=document.createElement('div'); c.className='ex-modal__col';
    const t=document.createElement('div'); t.className='ex-modal__coltitle'; t.textContent=title; c.appendChild(t);
    lines.forEach(l=>{ const p=document.createElement('p'); p.className='ex-modal__line'; p.textContent=l; c.appendChild(p); });
    return c;
  }
  body.appendChild(col('Параметры поиска',['Наименование','ИНН','КПП','ОГРН']));
  body.appendChild(makeDivider({orientation:'v'}));
  body.appendChild(col('Найдено',['КГ Самолёт','СамолётИнвестХолдинг','Самолёт-KZ']));
  body.appendChild(makeDivider({orientation:'v'}));
  body.appendChild(col('Участники сделки',['КГ Самолёт','КНП']));
  mw.appendChild(body);
  mw.appendChild(makeDivider({orientation:'h'}));
  // footer
  const foot=document.createElement('div'); foot.className='ex-modal__foot';
  const fb=document.createElement('button'); fb.type='button'; fb.className='btn btn--accent btn--s'; fb.textContent='Сохранить';
  foot.appendChild(fb);
  mw.appendChild(foot);
  modal.appendChild(mw);
})();

/* ===================================================================== *
   GUIDELINES (do / don't — overuse)
 * ===================================================================== */
(function(){
  // bad: a divider between every single row -> visual noise
  const bad = document.getElementById('over-bad');
  const cb=document.createElement('div'); cb.className='ex-card'; cb.style.maxWidth='300px';
  ['Имя','Телефон','E-mail','Должность'].forEach((t,i,arr)=>{
    const r=document.createElement('div'); r.className='kv'; r.innerHTML='<span class="kv__k">'+t+'</span><span class="kv__v">—</span>'; cb.appendChild(r);
    if(i<arr.length-1) cb.appendChild(makeDivider({orientation:'h'}));
  });
  bad.appendChild(cb);

  // good: group with whitespace, divider only between groups
  const good = document.getElementById('over-good');
  const cg=document.createElement('div'); cg.className='ex-card'; cg.style.maxWidth='300px';
  const g1=document.createElement('div'); g1.className='kv-group';
  ['Имя','Телефон'].forEach(t=>{ const r=document.createElement('div'); r.className='kv'; r.innerHTML='<span class="kv__k">'+t+'</span><span class="kv__v">—</span>'; g1.appendChild(r); });
  cg.appendChild(g1);
  cg.appendChild(makeDivider({orientation:'h'}));
  const g2=document.createElement('div'); g2.className='kv-group';
  ['E-mail','Должность'].forEach(t=>{ const r=document.createElement('div'); r.className='kv'; r.innerHTML='<span class="kv__k">'+t+'</span><span class="kv__v">—</span>'; g2.appendChild(r); });
  cg.appendChild(g2);
  good.appendChild(cg);
})();

/* ---------- guide icons ---------- */
['ic-bad1','ic-bad2'].forEach(id=>{ const e=document.getElementById(id); if(e) e.innerHTML=DVD_UI.bad; });
['ic-good1','ic-good2'].forEach(id=>{ const e=document.getElementById(id); if(e) e.innerHTML=DVD_UI.good; });

/* ===================================================================== *
   TYPOGRAPHY REFERENCE
 * ===================================================================== */
(function(){
  const rows = [
    ['Подпись разделителя', 'Ещё 12 сделок', '--type-body-s', 'SB Sans Text', '14 / 16', 'dvd-text__label'],
  ];
  const tb = document.querySelector('#typo-table tbody');
  if(!tb) return;
  tb.innerHTML = rows.map(([part,sample,tok,font,sl,cls])=>`
    <tr>
      <td>${part}</td>
      <td><span class="${cls}" style="display:inline;">${sample}</span></td>
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
    { name:'Линия', rows:[
      ['Линия по умолчанию', '--border-light'],
      ['Контрастная линия', '--border-primary'],
      ['Блок-секция', '--tertiary'],
    ]},
    { name:'Текст', rows:[
      ['Подпись разделителя', '--text-secondary'],
    ]},
  ];
  const root = document.getElementById('color-ref');
  if(!root) return;
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

/* ===================================================================== *
   SIZES + DEV: redline measured from live component
 * ===================================================================== */
(function(){
  const host = document.createElement('div');
  host.style.cssText = 'position:absolute;left:-9999px;top:0;';
  document.body.appendChild(host);

  const h = makeDivider({ orientation:'h' });
  const v = makeDivider({ orientation:'v' });
  const strong = makeDivider({ orientation:'h', strong:true });
  const section = makeDivider({ orientation:'h', variant:'section' });
  const inset = makeDivider({ orientation:'h', variant:'inset' });
  const withText = makeDivider({ orientation:'h', label:'или' });
  host.append(h, v, strong, section, inset, withText);

  const r = n => Math.round(n*10)/10;
  const px = v => { const n = parseFloat(v); return isNaN(n) ? v : r(n)+' px'; };

  const D = {
    thickness: px(getComputedStyle(h).borderTopWidth),
    thicknessStrong: px(getComputedStyle(strong).borderTopWidth),
    section: px(getComputedStyle(section).height),
    inset: px(getComputedStyle(inset).marginLeft),
    vmin: px(getComputedStyle(v).minHeight),
    labelGap: px(getComputedStyle(withText).gap),
  };
  host.remove();

  function set(id,v){ const n=document.getElementById(id); if(n) n.textContent=v; }
  set('sz-thickness', D.thickness);
  set('sz-thickness-strong', D.thicknessStrong);
  set('sz-section', D.section);
  set('sz-inset', D.inset);
  set('sz-vmin', D.vmin);
  set('sz-label-gap', D.labelGap);
  set('dv-thickness', D.thickness);
  set('dv-thickness-strong', D.thicknessStrong);
  set('dv-section', D.section);
  set('dv-inset', D.inset);
  set('dv-vmin', D.vmin);
  set('dv-label-gap', D.labelGap);
})();

/* ===================================================================== *
   DEV: copy-to-clipboard on code panels
 * ===================================================================== */
(function(){
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
