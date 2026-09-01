/* PageHeader — конструктор и демо страницы компонента */
(function(){
'use strict';

function getIcon(name, size){
  size = size || 20;
  if(!window.DS_ICONS) return '';
  var raw = window.DS_ICONS[name] || ''; if(!raw) return '';
  var d = document.createElement('div'); d.innerHTML = raw;
  var s = d.querySelector('svg'); if(!s) return '';
  s.setAttribute('width', size); s.setAttribute('height', size); s.setAttribute('aria-hidden','true');
  s.querySelectorAll('[fill]').forEach(function(n){
    var f = n.getAttribute('fill');
    var boundingRect = n.tagName.toLowerCase() === 'rect' && n.getAttribute('fill-opacity') === '0';
    if (f && f !== 'none' && !boundingRect) n.setAttribute('fill','currentColor');
  });
  s.querySelectorAll('[stroke]').forEach(function(n){
    var st = n.getAttribute('stroke');
    if (st && st !== 'none') n.setAttribute('stroke','currentColor');
  });
  return s.outerHTML;
}
function esc(str){ return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

/* ---------- сборка PageHeader из опций ---------- */
function buildPhead(o){
  o = o || {};
  var title = o.title || 'D-007. ПАО «Газпром»';

  var chipsHtml = '';
  if (o.chips === 'one' || o.chips === 'list'){
    var chip = function(t){ return '<span class="chip chip--rounded chip--s"><span class="chip__label">' + t + '</span></span>'; };
    var chips = (o.chips === 'one') ? chip('Черновик') : chip('Черновик') + chip('На утверждении') + chip('PE');
    chipsHtml = '<div class="phead__chips">' + chips + '</div>';
  }
  var retHtml = o.ret ? '<span class="phead__return"><button type="button" class="btn btn--outline btn--xs">' + getIcon('flip-backward',16) + '<span class="btn__label">' + esc(o.retLabel || 'В сделку') + '</span></button></span>' : '';

  var row = '';
  var titleGroup = '';
  if (o.ico) titleGroup += '<span class="phead__title-ico" aria-hidden="true">' + getIcon('drag-dots',24) + '</span>';
  titleGroup += '<h' + (o.hLevel || 2) + ' class="phead__title">' + esc(title) + '</h' + (o.hLevel || 2) + '>';
  if (o.edit) titleGroup += '<button type="button" class="ibtn ibtn--neutral ibtn--s phead__edit" aria-label="Переименовать">' + getIcon('edit',20) + '</button>';
  row += '<div class="phead__title-group">' + titleGroup + '</div>';
  if (!o.wrapChips) row += chipsHtml + retHtml;

  var sub = '';
  if (o.sub === 'text'){
    sub = '<div class="phead__subtitle">Дата фактического погашения 12.01.2021</div>';
  } else if (o.sub === 'std'){
    sub = '<div class="phead__subtitle"><span class="phead__subtitle-ico" aria-hidden="true">' + getIcon('check-circle-filled',16) + '</span>Дата фактического погашения 12.01.2021</div>';
  } else if (o.sub === 'custom'){
    sub = '<div class="phead__subtitle">' +
      '<span class="phead__meta"><span class="phead__meta-ico">' + getIcon('copy',16) + '</span>7</span>' +
      '<span class="phead__meta"><span class="phead__meta-ico phead__meta-ico--ok">' + getIcon('check-circle',16) + '</span>Версия 12 (07.02.2021)</span>' +
      '</div>';
  }

  var extras = '';
  if (o.wrapChips && (chipsHtml || retHtml)) extras = '<div class="phead__extras">' + chipsHtml + retHtml + '</div>';

  var acts = '';
  var n = Number(o.actions || 0);
  if (n > 0 || o.menu){
    var list = [];
    if (n >= 1) list.push('<button type="button" class="btn btn--outline btn--m">' + getIcon('star',20) + '<span class="btn__label">В избранное</span></button>');
    if (n >= 3) list.push('<button type="button" class="btn btn--outline btn--m">' + getIcon('refresh',20) + '<span class="btn__label">Пересчёт метрик</span></button>');
    if (n >= 2) list.push('<button type="button" class="btn btn--accent btn--m">' + getIcon('download',20) + '<span class="btn__label">Выгрузить</span></button>');
    if (o.menu) list.push('<button type="button" class="btn btn--outline btn--m btn--icon-only" aria-label="Ещё действия" aria-haspopup="menu" aria-expanded="' + (o.menuOpen ? 'true' : 'false') + '">' + getIcon('more-dots',20) + '</button>');
    acts = '<div class="phead__actions" data-actions-overflow>' + list.join('') + '</div>';
  }

  var cls = 'phead';
  if (o.dashboard) cls += ' phead--dashboard';
  if (o.stack) cls += ' phead--stack';

  return '<div class="' + cls + '"><div class="phead__main"><div class="phead__title-row">' + row + '</div>' + sub + extras + '</div>' + acts + '</div>';
}

function mount(id, opts){
  var el = document.getElementById(id);
  if (el) { el.innerHTML = buildPhead(opts); rebindOverflow(el); }
}
function rebindOverflow(root){
  var host = root.querySelector('[data-actions-overflow]');
  if (host && host.__dsActOverflow) host.__dsActOverflow.refresh();
  else if (host && window.DSActionsOverflow) window.DSActionsOverflow.bind(host);
}

/* ---------- конструктор ---------- */
function rebuild(){
  var width = Number(document.getElementById('ctl-width').value);
  var vp = document.getElementById('demo-viewport');
  vp.style.width = width + 'px';
  var wOut = document.getElementById('ctl-width-val');
  if (wOut) wOut.textContent = width;

  var o = {
    title:   document.getElementById('ctl-title').value.trim() || 'D-007. ПАО «Газпром»',
    ico:     document.getElementById('ctl-ico').checked,
    edit:    document.getElementById('ctl-edit').checked,
    chips:   document.getElementById('ctl-chips').value === 'none' ? null : document.getElementById('ctl-chips').value,
    ret:     document.getElementById('ctl-return').checked,
    sub:     document.getElementById('ctl-sub').value === 'none' ? null : document.getElementById('ctl-sub').value,
    actions: document.getElementById('ctl-actions').value,
    menu:    document.getElementById('ctl-menu').checked,
    dashboard: document.getElementById('ctl-dash').checked,
    stack:   width < 720,
    wrapChips: width < 1024
  };
  /* MenuButton неактуален, когда действий нет вовсе */
  var demoHost = document.getElementById('demo-phead');
  demoHost.innerHTML = buildPhead(o);
  rebindOverflow(demoHost);
  closePheadMenus();
  fitViewport();
}

/* ---------- MenuButton: интерактивное меню поверх страницы (все демо) ------
   Меню рендерится в document.body с position:fixed, поэтому не обрезается
   контейнерами демо-блоков и всегда лежит поверх остального. */
function menuMarkup(){
  return '<button type="button" class="menu__item" role="menuitem"><span class="menu__item-icon">' + getIcon('download-report',20) + '</span><span class="menu__item-label">Выгрузить в XLSX</span></button>' +
         '<button type="button" class="menu__item" role="menuitem"><span class="menu__item-icon">' + getIcon('history',20) + '</span><span class="menu__item-label">История изменений</span></button>' +
         '<hr class="menu__divider">' +
         '<button type="button" class="menu__item menu__item--danger" role="menuitem"><span class="menu__item-icon">' + getIcon('trash',20) + '</span><span class="menu__item-label">Удалить сделку</span></button>';
}
function closePheadMenus(){
  if (window.DSMenu) DSMenu.closeAll();
  /* демо перерисовывается — снимаем меню, чей триггер уже вне документа */
  document.querySelectorAll('.phead-menu-pop').forEach(function(m){
    if (!m.__dsMenu || !document.contains(m.__dsMenu.trigger)) m.remove();
  });
}
/* Первый клик по триггеру собирает меню и передаёт его рантайму ДС
   (scripts/ds-menu.js) — дальше открытие, позиционирование, клавиатура,
   закрытие по клику вне, Esc и репозиция на scroll/resize за ним. */
document.addEventListener('click', function(e){
  if (!e.target.closest || !window.DSMenu) return;
  var btn = e.target.closest('.phead [aria-haspopup="menu"], .phx [aria-haspopup="menu"]');
  if (!btn || btn.__dsMenu) return;
  var pop = document.createElement('div');
  pop.className = 'menu phead-menu-pop';
  pop.style.cssText = 'position:fixed;z-index:9000;';
  pop.innerHTML = menuMarkup();
  document.body.appendChild(pop);
  DSMenu.bind(btn, { menu: pop, align: 'end' }).open();
});

/* масштабирование вьюпорта под ширину фрейма */
function fitViewport(){
  var scaler = document.getElementById('demo-scale');
  var vp = document.getElementById('demo-viewport');
  if (!scaler || !vp) return;
  var frame = scaler.parentElement;
  var avail = frame.clientWidth - 56; /* padding 28×2 */
  var w = vp.offsetWidth;
  var k = Math.min(1, avail / w);
  scaler.style.transform = k < 1 ? 'scale(' + k + ')' : '';
  scaler.style.width = w + 'px';
  scaler.style.height = (vp.offsetHeight * k) + 'px';
}
window.addEventListener('resize', fitViewport);
if (window.ResizeObserver){
  var _fr = document.querySelector('.pg-stage-frame');
  if (_fr) new ResizeObserver(fitViewport).observe(_fr);
}

var ids = ['ctl-title','ctl-ico','ctl-edit','ctl-chips','ctl-return','ctl-sub','ctl-actions','ctl-menu','ctl-dash','ctl-width'];
ids.forEach(function(id){
  var el = document.getElementById(id);
  if (el){ el.addEventListener('change', rebuild); el.addEventListener('input', rebuild); }
});

/* ---------- статичные демо ---------- */
function renderDemos(){
  rebuild();

  /* Использование */
  mount('ex-list',   { title:'Текущий портфель ДИД', edit:false, actions:'1', menu:false, hLevel:3 });
  mount('ex-deal',   { title:'1234. СамолётИнвестПродакшн', edit:true, chips:'list', sub:'custom', actions:'2', menu:true, hLevel:3 });
  mount('ex-nested', { title:'Плановые платежи по сделке', ret:true, retLabel:'В сделку', hLevel:3 });

  /* Анатомия */
  mount('anat-phead', { ico:true, edit:true, chips:'one', ret:true, sub:'custom', actions:'2', menu:true, hLevel:3 });

  /* Варианты */
  mount('v-chip-one',  { edit:true, chips:'one', hLevel:3 });
  mount('v-chip-list', { edit:true, chips:'list', hLevel:3 });
  mount('v-return',    { ret:true, hLevel:3 });
  mount('v-sub-std',   { edit:true, sub:'std', hLevel:3 });
  mount('v-sub-text',  { edit:true, sub:'text', hLevel:3 });
  mount('v-sub-custom',{ edit:true, sub:'custom', hLevel:3 });
  mount('v-act-2m',    { edit:true, actions:'2', menu:true, hLevel:3 });
  mount('v-act-1',     { edit:true, actions:'1', hLevel:3 });
  mount('v-act-m',     { edit:true, menu:true, hLevel:3 });
  mount('v-dash',      { edit:true, chips:'one', sub:'custom', actions:'2', menu:true, dashboard:true, hLevel:3 });

  /* Поведение */
  mount('b-menu', { edit:true, actions:'2', menu:true, hLevel:3 });
  mount('b-multiline', { title:'ФИ: 111-Акции-2 · КГ ГАЗНЕФТЕХИМПРОМСТРОЙ НЕДВИЖИМОСТЬ, внутригрупповой кредит', edit:true, actions:'1', hLevel:3 });
  mount('b-ad-desktop', { edit:true, chips:'one', sub:'custom', actions:'2', menu:true, hLevel:3 });
  mount('b-ad-tablet',  { edit:true, chips:'one', ret:true, sub:'custom', actions:'1', menu:true, wrapChips:true, hLevel:3 });
  mount('b-ad-mobile',  { edit:true, chips:'one', sub:'custom', actions:'1', menu:true, stack:true, wrapChips:true, hLevel:3 });
}

/* ---------- ТЕСТОВАЯ СРЕДА: экспериментальная раскладка (.phx) -------------
   Не часть компонента. Return над заголовком (transparent), подзаголовок
   неразрывен с заголовком и ограничен его шириной, не поместившиеся чипы
   уходят под подзаголовок. */
function buildPhx(){
  return '<div class="phx">' +
    '<div class="phx__return"><button type="button" class="btn btn--transparent btn--xs">' + getIcon('flip-backward',16) + '<span class="btn__label">К списку сделок</span></button></div>' +
    '<div class="phx__row">' +
      '<div class="phx__main">' +
        '<div class="phx__title-row"><h3 class="phx__title">1234. СамолётИнвестПродакшн</h3>' +
          '<div class="phx__chips"><span class="chip chip--rounded chip--s"><span class="chip__label">Черновик</span></span><span class="chip chip--rounded chip--s"><span class="chip__label">На утверждении</span></span></div>' +
        '</div>' +
        '<div class="phx__subtitle">Дата фактического погашения 12.01.2021 · ответственный Александров П. К. · последнее изменение 07.02.2021</div>' +
      '</div>' +
      '<div class="phx__actions"><button type="button" class="btn btn--outline btn--m">' + getIcon('star',20) + '<span class="btn__label">В избранное</span></button>' +
        '<button type="button" class="btn btn--accent btn--m">' + getIcon('download',20) + '<span class="btn__label">Выгрузить</span></button>' +
        '<button type="button" class="btn btn--outline btn--m btn--icon-only" aria-label="Ещё действия" aria-haspopup="menu" aria-expanded="false">' + getIcon('more-dots',20) + '</button></div>' +
    '</div>' +
  '</div>';
}
function layoutPhx(){
  var host = document.getElementById('phx-demo'); if (!host) return;
  var root = host.querySelector('.phx'); if (!root) return;
  var main = root.querySelector('.phx__main');
  var row = root.querySelector('.phx__title-row');
  var chips = root.querySelector('.phx__chips');
  var sub = root.querySelector('.phx__subtitle');
  if (!main || !row || !chips || !sub) return;
  /* вернуть чипы в строку заголовка и померить, помещаются ли они рядом с заголовком.
     Заголовок сжимаем flex-ом, поэтому переполнения строки не возникает — считаем
     по естественной (max-content) ширине заголовка. */
  if (chips.parentElement !== row) row.appendChild(chips);
  root.classList.remove('phx--chips-below');
  root.classList.remove('phx--stack');
  /* мало места под заголовок рядом с действиями — actions уходят вниз на всю ширину */
  const outer = root.querySelector('.phx__row');
  const actions = root.querySelector('.phx__actions');
  if (outer && actions && outer.clientWidth - actions.offsetWidth - 16 < 280) root.classList.add('phx--stack');
  const title = row.querySelector('.phx__title');
  if (!title) return;
  const prevWs = title.style.whiteSpace, prevW = title.style.width;
  title.style.whiteSpace = 'nowrap';
  title.style.width = 'max-content';
  const titleNatural = title.scrollWidth;
  title.style.whiteSpace = prevWs;
  title.style.width = prevW;
  const gap = parseFloat(getComputedStyle(row).columnGap) || 8;
  const fits = Math.min(titleNatural, row.clientWidth) + gap + chips.offsetWidth <= row.clientWidth;
  if (!fits){
    root.classList.add('phx--chips-below');
    main.appendChild(chips);   /* под подзаголовок */
  }
}
function initPhx(){
  var host = document.getElementById('phx-demo'); if (!host) return;
  host.innerHTML = buildPhx();
  var slider = document.getElementById('phx-width');
  var vp = document.getElementById('phx-vp');
  var out = document.getElementById('phx-width-val');
  if (slider && vp){
    slider.addEventListener('input', function(){
      vp.style.width = slider.value + 'px';
      if (out) out.textContent = slider.value;
      layoutPhx();
    });
  }
  layoutPhx();
  window.addEventListener('resize', layoutPhx);
}

/* ---------- redline ---------- */
function measureRedline(){
  var root = document.getElementById('rl-phead'); if(!root) return;
  function set(id,v){ var n=document.getElementById(id); if(n) n.textContent=v; }
  var title = getComputedStyle(document.getElementById('rl-title-el'));
  var sub   = getComputedStyle(document.getElementById('rl-sub-el'));
  var row   = getComputedStyle(document.getElementById('rl-row'));
  var main  = getComputedStyle(document.getElementById('rl-main'));
  var rootS = getComputedStyle(root);
  var acts  = getComputedStyle(document.getElementById('rl-acts'));
  var dash  = getComputedStyle(document.getElementById('rl-dash-el'));
  set('rl-title', title.fontSize + ' / ' + title.lineHeight + ' · ' + title.fontWeight);
  set('rl-sub', sub.fontSize + ' / ' + sub.lineHeight);
  set('rl-rowgap', row.columnGap || row.gap);
  set('rl-maingap', main.rowGap || main.gap);
  set('rl-rootgap', rootS.columnGap || rootS.gap);
  set('rl-actgap', acts.columnGap || acts.gap);
  set('rl-rowh', row.minHeight);
  set('rl-dash', dash.paddingTop + ' / ' + dash.paddingLeft + ' · радиус ' + dash.borderTopLeftRadius);
}

/* ---------- copy buttons ---------- */
document.querySelectorAll('.copy-btn').forEach(function(btn){
  btn.addEventListener('click', function(){
    var el = document.getElementById('code-' + btn.getAttribute('data-copy')); if(!el) return;
    navigator.clipboard.writeText(el.textContent).then(function(){
      btn.textContent='Скопировано ✓'; btn.classList.add('is-copied');
      setTimeout(function(){ btn.textContent='Скопировать'; btn.classList.remove('is-copied'); }, 2000);
    });
  });
});

renderDemos();
initPhx();
setTimeout(fitViewport, 250);
setTimeout(layoutPhx, 300);
setTimeout(measureRedline, 300);
})();
