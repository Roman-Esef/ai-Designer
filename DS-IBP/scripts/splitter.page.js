/* =========================================================================
   Splitter — documentation page logic
   ========================================================================= */

/* ---------- icons (fallback, overridden by DS_ICONS) ---------- */
const SPL_UI = {
  bad:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  good: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>',
};
(function(){ const L=window.DS_ICONS||{}; const m={bad:'close',good:'check'};
  for(const k in m){ if(L[m[k]]) SPL_UI[k]=L[m[k]]; } })();

/* Поведение сплиттера вынесено в рантайм ДС — scripts/ds-splitter.js
   (перетаскивание с pointer capture, min/max, клавиатура, aria-value*).
   Страница-витрина пользуется тем же публичным API. */
const makeSplitter = (o) => window.DSSplitter.make(o);
const createSplitPane = (o) => window.DSSplitter.pane(o);

/* ===================================================================== *
   PLAYGROUND
 * ===================================================================== */
(function(){
  const state = { orientation:'v', istate:'default' };
  const controls = document.getElementById('pg-controls');
  const stage    = document.getElementById('pg-stage');
  const codeEl   = document.getElementById('pg-code');

  function select(label, options, getCur, onPick){
    const wrap=document.createElement('div'); wrap.className='ctl';
    const l=document.createElement('div'); l.className='lbl'; l.textContent=label; wrap.appendChild(l);
    const box=document.createElement('div'); box.className='pg-select';
    const sel=document.createElement('select');
    options.forEach(([val,txt])=>{ const op=document.createElement('option'); op.value=val; op.textContent=txt; if(val===getCur()) op.selected=true; sel.appendChild(op); });
    sel.addEventListener('change',()=>{ onPick(sel.value); render(); });
    box.appendChild(sel); wrap.appendChild(box); return wrap;
  }

  controls.appendChild(select('Ориентация',
    [['v','Вертикальный — col-resize'],['h','Горизонтальный — row-resize']],
    ()=>state.orientation, v=>state.orientation=v));
  controls.appendChild(select('Состояние',
    [['default','Default'],['hover','Hover'],['move','Move (drag)'],['disabled','Disabled'],['live','Живой — перетащите']],
    ()=>state.istate, v=>state.istate=v));

  function render(){
    stage.innerHTML='';
    if (state.istate==='live'){
      const sp = createSplitPane({ orientation:state.orientation, height: state.orientation==='h'?240:200, min:20, max:80, initial:46 });
      sp.wrap.style.width='100%'; sp.wrap.style.maxWidth='520px';
      stage.appendChild(sp.wrap);
      codeEl.innerHTML='<code>&lt;div class="spl'+(state.orientation==='h'?' spl--h':'')+'" role="separator" tabindex="0"&gt;…&lt;/div&gt;</code>';
      return;
    }
    // static state preview inside a faux two-pane frame
    const frame = document.createElement('div');
    frame.className='spl-static' + (state.orientation==='h'?' spl-static--h':'');
    const a=document.createElement('div'); a.className='spl-static__p';
    const b=document.createElement('div'); b.className='spl-static__p';
    const spl = makeSplitter({ orientation:state.orientation, state:state.istate });
    frame.appendChild(a); frame.appendChild(spl); frame.appendChild(b);
    stage.appendChild(frame);
    const cls=['spl']; if(state.orientation==='h')cls.push('spl--h');
    if(state.istate==='hover')cls.push('spl--hover');
    if(state.istate==='move')cls.push('spl--move');
    if(state.istate==='disabled')cls.push('spl--disabled');
    codeEl.innerHTML='<code>&lt;div class="'+cls.join(' ')+'" role="separator"&gt;…&lt;/div&gt;</code>';
  }
  render();
})();

/* ===================================================================== *
   ANATOMY
 * ===================================================================== */
(function(){
  const d = document.getElementById('anat-diagram');
  const frame=document.createElement('div'); frame.className='spl-static'; frame.style.height='180px';
  const a=document.createElement('div'); a.className='spl-static__p';
  const b=document.createElement('div'); b.className='spl-static__p';
  const spl = makeSplitter({ orientation:'v', state:'hover' });
  spl.style.transform='scale(1.6)';
  frame.appendChild(a); frame.appendChild(spl); frame.appendChild(b);
  d.appendChild(frame);
})();

/* ===================================================================== *
   STATES
 * ===================================================================== */
(function(){
  const host = document.getElementById('states');
  const defs = [
    ['Default','default','Тонкая линия, ручка приглушена. Курсор обычный.'],
    ['Hover','hover','Зона подсвечивается, линия и ручка темнеют, курсор col-resize.'],
    ['Move','move','Состояние перетаскивания — вид Hover и курсор удерживаются.'],
    ['Focus','focus','Обводка --primary при фокусе с клавиатуры.'],
    ['Disabled','disabled','Сплиттер зафиксирован, перетаскивание недоступно.'],
  ];
  defs.forEach(([name,st,desc])=>{
    const cell=document.createElement('div'); cell.className='scell';
    const cap=document.createElement('div'); cap.className='vcap'; cap.innerHTML='<span class="vcap__name">'+name+'</span>';
    const frame=document.createElement('div'); frame.className='spl-static'; frame.style.height='150px';
    const a=document.createElement('div'); a.className='spl-static__p';
    const b=document.createElement('div'); b.className='spl-static__p';
    const spl = makeSplitter({ orientation:'v', state: st==='focus'?'default':st });
    if (st==='focus') spl.classList.add('is-focus');
    frame.appendChild(a); frame.appendChild(spl); frame.appendChild(b);
    const p=document.createElement('p'); p.className='vdesc'; p.textContent=desc;
    cell.appendChild(cap); cell.appendChild(frame); cell.appendChild(p);
    host.appendChild(cell);
  });
})();

/* ===================================================================== *
   BEHAVIOR — live drag with min / max + readout
 * ===================================================================== */
(function(){
  const host = document.getElementById('behavior');
  const read = document.getElementById('behavior-read');
  const sp = createSplitPane({
    orientation:'v', height:240, min:25, max:75, initial:50,
    buildLeft:(el)=>{ el.innerHTML='<span class="splitpane__ph">Левая часть</span>'; },
    buildRight:(el)=>{ el.innerHTML='<span class="splitpane__ph">Правая часть</span>'; },
    onChange:(v)=>{ if(read) read.textContent = v + '% / ' + (100-v) + '%'; },
  });
  sp.wrap.style.width='100%';
  host.appendChild(sp.wrap);
})();

/* ===================================================================== *
   ORIENTATION — vertical + horizontal live
 * ===================================================================== */
(function(){
  const v = document.getElementById('orient-v');
  const spV = createSplitPane({ orientation:'v', height:200, min:25, max:75, initial:50,
    leftLabel:'Колонка A', rightLabel:'Колонка B' });
  spV.wrap.style.width='100%';
  v.appendChild(spV.wrap);

  const h = document.getElementById('orient-h');
  const spH = createSplitPane({ orientation:'h', height:240, min:25, max:75, initial:50,
    leftLabel:'Строка сверху', rightLabel:'Строка снизу' });
  spH.wrap.style.width='100%';
  h.appendChild(spH.wrap);
})();

/* ===================================================================== *
   USAGE EXAMPLE — master / detail (Пользователи)
 * ===================================================================== */
(function(){
  const host = document.getElementById('ex-master');
  const ic = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">';

  function buildLeft(el){
    el.classList.add('mdt');
    const head=document.createElement('div'); head.className='mdt__head';
    head.innerHTML='<span class="mdt__crumb">Настройки / Пользователи</span>'
      + '<button type="button" class="btn btn--accent btn--xs">'+ic+'<path d="M12 5v14M5 12h14"/></svg> Новый пользователь</button>';
    el.appendChild(head);
    const title=document.createElement('div'); title.className='mdt__title'; title.textContent='Пользователи'; el.appendChild(title);
    const filter=document.createElement('div'); filter.className='mdt__filter'; filter.innerHTML=ic+'<path d="M4 5h16l-6 8v5l-4 2v-7Z"/></svg> Фильтр'; el.appendChild(filter);
    const tbl=document.createElement('div'); tbl.className='mdt__table';
    const th=document.createElement('div'); th.className='mdt__tr mdt__tr--head';
    th.innerHTML='<span>№</span><span>ФИО</span><span>Роли</span>';
    tbl.appendChild(th);
    for(let i=0;i<7;i++){
      const tr=document.createElement('div'); tr.className='mdt__tr'+(i===2?' is-active':'');
      tr.innerHTML='<span class="mono">01833672</span><span>Константинопольский К.К.</span><span class="dim">Руководитель деска ДГР, Директор…</span>';
      tbl.appendChild(tr);
    }
    el.appendChild(tbl);
  }
  function buildRight(el){
    el.classList.add('mdd');
    el.innerHTML =
      '<div class="mdd__head"><span class="mdd__name">Константинопольский К.К. <span class="mdd__chip">Уволен</span></span><span class="mdd__tools">'+ic+'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg> '+ic+'<path d="M6 6l12 12M18 6L6 18"/></svg></span></div>'
      + '<div class="mdd__grid">'
      + field('Должность','Бизнес-администратор') + field('','Пользователь системы')
      + field('Подразделение','Управление кредитных операций') + field('Роль в системе','Аудитор ДИД')
      + field('Табельный номер','01833672') + field('Последняя активность','12:23:45 12.12.21')
      + field('Номер телефона','8-55-765-81-86') + field('E-mail OMEGA','kozhevnikov@omega.sbrf.ru')
      + '</div>';
    function field(k,v){ return '<div class="mdd__f"><span class="mdd__k">'+k+'</span><span class="mdd__v">'+v+'</span></div>'; }
  }

  const sp = createSplitPane({ orientation:'v', height:430, min:30, max:70, initial:48, buildLeft, buildRight });
  sp.wrap.classList.add('splitpane--app');
  sp.wrap.style.width='100%';
  host.appendChild(sp.wrap);
})();

/* ===================================================================== *
   GUIDELINES (do / don't)
 * ===================================================================== */
(function(){
  // bad: splitter without grip / invisible affordance
  const bad = document.getElementById('guide-bad');
  const fb=document.createElement('div'); fb.className='spl-static'; fb.style.height='150px';
  const a1=document.createElement('div'); a1.className='spl-static__p';
  const b1=document.createElement('div'); b1.className='spl-static__p';
  const s1=makeSplitter({orientation:'v'}); s1.querySelector('.spl__grip').remove(); // no grip
  s1.style.cursor='default';
  fb.appendChild(a1); fb.appendChild(s1); fb.appendChild(b1);
  bad.appendChild(fb);

  // good: clear grip + hover state
  const good = document.getElementById('guide-good');
  const fg=document.createElement('div'); fg.className='spl-static'; fg.style.height='150px';
  const a2=document.createElement('div'); a2.className='spl-static__p';
  const b2=document.createElement('div'); b2.className='spl-static__p';
  const s2=makeSplitter({orientation:'v', state:'hover'});
  fg.appendChild(a2); fg.appendChild(s2); fg.appendChild(b2);
  good.appendChild(fg);
})();

/* ---------- guide icons ---------- */
['ic-bad1'].forEach(id=>{ const e=document.getElementById(id); if(e) e.innerHTML=SPL_UI.bad; });
['ic-good1'].forEach(id=>{ const e=document.getElementById(id); if(e) e.innerHTML=SPL_UI.good; });

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
      ['Линия · Default', '--border-light'],
      ['Линия · Hover / Move', '--border-dark'],
    ]},
    { name:'Зона и ручка', rows:[
      ['Подсветка зоны · Hover / Move', '--primary-bg'],
      ['Ручка · Default', '--text-inactive'],
      ['Ручка · Hover / Move', '--text-secondary'],
      ['Ручка · Disabled', '--disabled'],
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
   SIZES + DEV SPEC — measured on a live instance (getComputedStyle), not hardcoded
 * ===================================================================== */
(function(){
  function measure(){
    const host = document.createElement('div');
    host.style.cssText = 'position:absolute; left:-9999px; top:0; visibility:hidden;';
    const frame = document.createElement('div'); frame.className = 'spl-static'; frame.style.height = '150px';
    const a = document.createElement('div'); a.className = 'spl-static__p';
    const b = document.createElement('div'); b.className = 'spl-static__p';
    const spl = makeSplitter({ orientation:'v', state:'default' });
    frame.appendChild(a); frame.appendChild(spl); frame.appendChild(b);
    host.appendChild(frame);
    document.body.appendChild(host);

    const cs = getComputedStyle(spl);
    const csBefore = getComputedStyle(spl, '::before');
    const dot = spl.querySelector('.spl__grip i');
    const csDot = dot ? getComputedStyle(dot) : null;
    const csGrip = getComputedStyle(spl.querySelector('.spl__grip'));

    const data = {
      captureW: Math.round(parseFloat(cs.width)),
      minH: Math.round(parseFloat(cs.minHeight)),
      lineW: Math.round(parseFloat(csBefore.width) * 10) / 10,
      dotSize: csDot ? Math.round(parseFloat(csDot.width) * 10) / 10 : null,
      dotRadius: csDot ? csDot.borderRadius : null,
      gripGap: Math.round(parseFloat(csGrip.rowGap || csGrip.gap)),
    };
    host.remove();
    return data;
  }

  const m = measure();

  const sizeTbody = document.querySelector('#size-table');
  if (sizeTbody) {
    const rows = [
      ['Ширина зоны захвата', m.captureW + ' px', '--spl-size'],
      ['Толщина линии', m.lineW + ' px', '--spl-line'],
      ['Минимальная длина', m.minH + ' px', '(min-height)'],
      ['Диаметр точки грипа', m.dotSize + ' px', '(spl__grip i)'],
      ['Зазор между точками грипа', m.gripGap + ' px', '(spl__grip gap)'],
    ];
    sizeTbody.innerHTML = rows.map(r => `<div class="tbl__row" style="grid-template-columns:8px 1.84fr 0.81fr 0.68fr 8px;"><div class="tc tc--separator"></div><div class="tc"><span class="tc__row"><span class="tc__text">${r[0]}</span></span></div><div class="tc tc--numbers"><span class="tc__row"><span class="tc__text">${r[1]}</span></span></div><div class="tc"><code>${r[2]}</code></div><div class="tc tc--separator"></div></div>`).join('');
  }

  const devTbody = document.querySelector('#dev-spec-table');
  if (devTbody) {
    const rows = [
      ['Ширина зоны захвата (vert) / высота (horiz)', m.captureW + ' px'],
      ['Толщина линии', m.lineW + ' px'],
      ['Минимальная длина', m.minH + ' px'],
      ['Диаметр точки грипа', m.dotSize + ' px'],
      ['Зазор между точками грипа', m.gripGap + ' px'],
      ['Радиус точки грипа', m.dotRadius],
    ];
    devTbody.innerHTML = rows.map(r => `<div class="tbl__row" style="grid-template-columns:8px 1.84fr 0.81fr 8px;"><div class="tc tc--separator"></div><div class="tc"><span class="tc__row"><span class="tc__text">${r[0]}</span></span></div><div class="tc tc--numbers"><span class="tc__row"><span class="tc__text">${r[1]}</span></span></div><div class="tc tc--separator"></div></div>`).join('');
  }
})();
