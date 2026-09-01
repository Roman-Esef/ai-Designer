/* =========================================================================
   Popover — страница ДС: конструктор, редлайн, вспомогательные демо.
   ========================================================================= */

/* Геометрия, авто-flip, открытие/закрытие и тени прокрутки живут в рантайме
   scripts/ds-popover.js (out-of-box) — страница только собирает демо. */

/* ---------- содержимое тела: варианты для конструктора и демо ---------- */
const POP_CONTENT = {
  text() {
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <p style="margin:0;">Сумма округляется до сотых по правилам ЦБ РФ на дату расчёта.
      <a class="link link--accent link--inline" href="#">Подробнее в справке</a>.</p>`;
    return wrap;
  },
  legend() {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex; flex-direction:column; gap:10px;';
    const rows = [['#2AA876','Зона проблемности','Зелёная'],['#E2A73B','Рейтинг контрагента','26'],['#5B7CFA','Риск-сегмент','Международный институт']];
    wrap.innerHTML = rows.map(r => `
      <div style="display:flex; align-items:center; gap:10px;">
        <span style="width:8px;height:8px;border-radius:50%;background:${r[0]};flex:none;"></span>
        <span style="font:var(--type-body-s); color:var(--text-secondary); flex:1 1 auto;">${r[1]}</span>
        <span style="font:var(--type-body-s-strong); color:var(--text-primary);">${r[2]}</span>
      </div>`).join('');
    return wrap;
  },
  form() {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex; flex-direction:column; gap:14px;';
    wrap.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:6px;">
        <label class="ds-label"><span class="ds-label__text">Название тега</span></label>
        <div class="mock-input">Проблемный актив</div>
      </div>
      <div style="display:flex; flex-direction:column; gap:6px;">
        <label class="ds-label"><span class="ds-label__text">Срок пересмотра</span></label>
        <div class="mock-input">15.08.2026</div>
      </div>`;
    return wrap;
  },
  card() {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex; flex-direction:column; gap:10px;';
    wrap.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
        <span style="font:var(--type-body-m-strong); color:var(--text-primary);">ДК-2025-4471</span>
        <span class="chip chip--s"><span class="chip__label">В работе</span></span>
      </div>
      <div style="display:flex; flex-direction:column; gap:4px;">
        <span style="font:var(--type-body-s); color:var(--text-inactive);">Сумма</span>
        <span style="font:var(--type-body-m-strong); color:var(--text-primary); font-variant-numeric:tabular-nums;">2 500 000 000,00 ₽</span>
      </div>
      <div style="display:flex; flex-direction:column; gap:4px;">
        <span style="font:var(--type-body-s); color:var(--text-inactive);">Контрагент</span>
        <span style="font:var(--type-body-m); color:var(--text-primary);">ООО «Северная верфь»</span>
      </div>`;
    return wrap;
  },
  table() {
    const wrap = document.createElement('div');
    wrap.className = 'mtable';
    const rows = [['Выдача','01.02.2026','120 000 000'],['Погашение','01.03.2026','12 500 000']];
    wrap.innerHTML = `
      <div style="display:grid; grid-template-columns:1.2fr 1fr 1fr; padding:9px 0; font:var(--type-body-s-strong); color:var(--text-secondary);">
        <span>Операция</span><span>Дата</span><span style="text-align:right;">Сумма</span>
      </div>
      ${rows.map(r => `<div style="display:grid; grid-template-columns:1.2fr 1fr 1fr; padding:9px 0; border-top:1px solid var(--border-light); font:var(--type-body-m); color:var(--text-primary);">
        <span>${r[0]}</span><span style="color:var(--text-secondary);">${r[1]}</span><span style="text-align:right; font-variant-numeric:tabular-nums;">${r[2]}</span>
      </div>`).join('')}`;
    return wrap;
  },
  skeleton() {
    const wrap = document.createElement('div');
    wrap.className = 'sk-group';
    wrap.innerHTML = `<span class="sk-line sk-line--title" style="--sk-w:45%;"></span>
      <span class="sk-line" style="--sk-w:100%;"></span>
      <span class="sk-line" style="--sk-w:80%;"></span>`;
    return wrap;
  },
  error() {
    const wrap = document.createElement('div');
    wrap.setAttribute('role', 'alert');
    wrap.style.cssText = 'display:flex; gap:10px; align-items:flex-start;';
    wrap.innerHTML = `<span style="flex:none; width:20px; height:20px; color:var(--error);"><i data-icon="alert-circle"></i></span>
      <p style="margin:0; font:var(--type-body-s); color:var(--text-primary);">Не удалось загрузить данные. Проверьте соединение и попробуйте ещё раз.</p>`;
    return wrap;
  },
  scroll() {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex; flex-direction:column; gap:12px;';
    for (let i = 1; i <= 8; i++) {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex; justify-content:space-between; gap:10px; padding-bottom:12px; border-bottom:1px solid var(--border-light);';
      row.innerHTML = `<span style="font:var(--type-body-s); color:var(--text-secondary);">Пункт ${i}</span><span style="font:var(--type-body-s-strong); color:var(--text-primary);">${(i * 12.5).toFixed(1)}%</span>`;
      wrap.appendChild(row);
    }
    return wrap;
  },
};

/* ---------- сборка поповера: голова + тело + подвал ---------- */
function buildPopover(o = {}) {
  const {
    width = 'm', title = 'Заголовок поповера', header = true, headerAccessory = 'none',
    footLeft = 'none', footRight = 'primary', content = 'text',
    arrow = false, placement = 'bottom', align = 'start',
    floating = false, pinned = false, flush = false,
  } = o;

  const pop = document.createElement('div');
  pop.className = 'pop pop--w-' + width + ' pop--' + placement + ' pop--' + align
    + (arrow ? ' pop--arrow' : '')
    + (floating ? ' pop--floating' : ' pop--inline')
    + (pinned ? ' pop--pinned' : '');
  pop.setAttribute('role', 'dialog');
  pop.setAttribute('aria-modal', 'false');

  if (header) {
    const titleId = 'pop-title-' + Math.random().toString(36).slice(2, 8);
    pop.setAttribute('aria-labelledby', titleId);
    const head = document.createElement('div');
    head.className = 'pop__head';
    const main = document.createElement('div');
    main.className = 'pop__head-main';
    main.innerHTML = `<h3 class="pop__title" id="${titleId}">${title}</h3>`;
    if (headerAccessory === 'chip') {
      main.innerHTML += `<span class="chip chip--s"><span class="chip__label">Черновик</span></span>`;
    }
    head.appendChild(main);
    if (headerAccessory === 'link') {
      const link = document.createElement('a');
      link.className = 'link link--accent link--s';
      link.href = '#';
      link.style.flex = 'none';
      link.textContent = 'Сбросить';
      head.appendChild(link);
    }
    const closeWrap = document.createElement('span');
    closeWrap.className = 'pop__close';
    closeWrap.innerHTML = `<button type="button" class="ibtn ibtn--neutral ibtn--s" aria-label="Закрыть"><i data-icon="close"></i></button>`;
    head.appendChild(closeWrap);
    pop.appendChild(head);
  }

  const body = document.createElement('div');
  body.className = 'pop__body' + (flush ? ' pop__body--flush' : '');
  body.appendChild((POP_CONTENT[content] ? POP_CONTENT[content] : POP_CONTENT.text)());
  pop.appendChild(body);

  if (footLeft !== 'none' || footRight !== 'none') {
    const foot = document.createElement('div'); foot.className = 'pop__foot';
    const left = document.createElement('div'); left.className = 'pop__foot-left';
    if (footLeft === 'info') left.textContent = 'Найдено: 24';
    if (footLeft === 'link') left.innerHTML = '<a class="link link--accent link--m" href="#">Подробнее</a>';
    if (footLeft === 'button') left.innerHTML = '<button type="button" class="btn btn--transparent btn--s"><span class="btn__label">Сбросить</span></button>';
    const right = document.createElement('div'); right.className = 'pop__foot-right';
    if (footRight === 'both') right.innerHTML += `<button type="button" class="btn btn--transparent btn--s"><span class="btn__label">Отмена</span></button>`;
    if (footRight !== 'none') right.innerHTML += `<button type="button" class="btn btn--accent btn--s"><span class="btn__label">Применить</span></button>`;
    foot.appendChild(left); foot.appendChild(right);
    pop.appendChild(foot);
  }

  const arrowEl = document.createElement('span'); arrowEl.className = 'pop__arrow';
  pop.appendChild(arrowEl);

  const syncScrollShadow = window.DSPopover.watchScroll(pop);

  window.dsIcons && window.dsIcons.apply(pop);
  return { pop, body, syncScrollShadow };
}

/* ---------- триггер-моки для витрин ---------- */
function makeTrigger(type, expanded) {
  const exp = expanded ? 'true' : 'false';
  if (type === 'icon') {
    return `<button type="button" class="ibtn ibtn--neutral ibtn--m" aria-haspopup="dialog" aria-expanded="${exp}" aria-label="Информация"><i data-icon="info-circle"></i></button>`;
  }
  if (type === 'link') {
    return `<button type="button" class="pop-trigger-link" aria-haspopup="dialog" aria-expanded="${exp}"><span class="link link--accent">ДК-2025-4471</span><i data-icon="chevron-down"></i></button>`;
  }
  if (type === 'chip') {
    return `<span class="chip chip--m" tabindex="0" role="button" aria-haspopup="dialog" aria-expanded="${exp}"><span class="chip__label">Проблемный актив</span></span>`;
  }
  return `<button type="button" class="btn btn--outline btn--m" aria-haspopup="dialog" aria-expanded="${exp}"><span class="btn__label">Фильтр</span><svg class="btn__chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6l4 4 4-4"/></svg></button>`;
}

/* ---------- позиционирование: тонкая обёртка над рантаймом ----------
   Витрина фиксирует позицию (flip выключен), контейнер-стенд служит и
   позиционирующим предком, и границей. */
function placePop(stage, pop, target, placement, align, gap) {
  return window.DSPopover.place(pop, target, {
    placement, align, gap: gap == null ? 8 : gap,
    offsetParent: stage, boundary: stage, flip: false,
  });
}

/* ========================================================================= */
document.addEventListener('DOMContentLoaded', () => {

  /* ---------------- КОНСТРУКТОР ---------------- */
  (function () {
    const controls = document.getElementById('pg-controls');
    const stage = document.getElementById('pg-stage');
    if (!controls || !stage) return;
    const state = { trigger: 'button', width: 'm', header: 'title', footLeft: 'none', footRight: 'primary', content: 'text', arrow: 'no' };

    function ctl(labelText, options, get, set) {
      const wrap = document.createElement('div'); wrap.className = 'ctl';
      const l = document.createElement('div'); l.className = 'lbl'; l.textContent = labelText; wrap.appendChild(l);
      const box = document.createElement('div'); box.className = 'pg-select';
      const sel = document.createElement('select');
      options.forEach(([v, t]) => { const o = document.createElement('option'); o.value = v; o.textContent = t; if (v === get()) o.selected = true; sel.appendChild(o); });
      sel.addEventListener('change', () => { set(sel.value); render(); });
      box.appendChild(sel); wrap.appendChild(box);
      return wrap;
    }

    controls.appendChild(ctl('Триггер', [
      ['button', 'Кнопка'], ['icon', 'Иконка'], ['link', 'Ссылка'], ['chip', 'Чип'],
    ], () => state.trigger, v => state.trigger = v));

    controls.appendChild(ctl('Ширина', [
      ['s', 's · 240px'], ['m', 'm · 320px'], ['l', 'l · 400px'], ['xl', 'xl · 480px'], ['max', 'max · 560px'],
    ], () => state.width, v => state.width = v));

    controls.appendChild(ctl('Header', [
      ['no', 'Нет'], ['title', 'Заголовок'], ['chip', '+ Чип'], ['link', '+ Ссылка'],
    ], () => state.header, v => state.header = v));

    controls.appendChild(ctl('Footer · слева', [
      ['none', 'Нет'], ['info', 'Инфо-текст'], ['link', 'Ссылка'], ['button', 'Кнопка'],
    ], () => state.footLeft, v => state.footLeft = v));

    controls.appendChild(ctl('Footer · справа', [
      ['none', 'Нет'], ['primary', 'Primary'], ['both', 'Secondary + Primary'],
    ], () => state.footRight, v => state.footRight = v));

    controls.appendChild(ctl('Контент', [
      ['text', 'Текст + ссылка'], ['legend', 'Легенда'], ['form', 'Форма'],
      ['card', 'Карточка данных'], ['table', 'Таблица'], ['skeleton', 'Загрузка'], ['error', 'Ошибка'],
    ], () => state.content, v => state.content = v));

    controls.appendChild(ctl('Стрелка', [
      ['no', 'Скрыта'], ['yes', 'Показана'],
    ], () => state.arrow, v => state.arrow = v));

    function render() {
      stage.innerHTML = '';
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex; flex-direction:column; align-items:flex-start; gap:' + (state.arrow === 'yes' ? '0' : '10') + 'px;';
      wrap.innerHTML = makeTrigger(state.trigger, true);
      const headerOn = state.header !== 'no';
      const headerAccessory = state.header === 'chip' ? 'chip' : state.header === 'link' ? 'link' : 'none';
      const { pop } = buildPopover({
        width: state.width, header: headerOn, headerAccessory, footLeft: state.footLeft, footRight: state.footRight,
        content: state.content, arrow: state.arrow === 'yes', placement: 'bottom', align: 'start',
      });
      if (state.arrow === 'yes') pop.style.marginTop = '8px';
      wrap.appendChild(pop);
      stage.appendChild(wrap);
      window.dsIcons && window.dsIcons.apply(stage);
    }
    render();
  })();

  /* ---------------- АНАТОМИЯ ---------------- */
  (function () {
    const host = document.getElementById('anat-stage');
    if (!host) return;
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex; flex-direction:column; align-items:flex-start; gap:10px;';
    wrap.innerHTML = makeTrigger('button', true);
    const { pop } = buildPopover({ width: 'l', header: true, footLeft: 'none', footRight: 'both', content: 'form', title: 'Изменить тег', arrow: true });
    wrap.style.gap = '0';
    pop.style.marginTop = '8px';
    wrap.appendChild(pop);
    host.appendChild(wrap);
    window.dsIcons && window.dsIcons.apply(host);
  })();

  /* ---------------- HEADER: варианты (заголовок / +чип / +ссылка) ---------------- */
  (function () {
    const host = document.getElementById('header-variants');
    if (!host) return;
    const variants = [
      { accessory: 'none', title: 'Заголовок поповера', cap: 'Базовый — заголовок + ✕' },
      { accessory: 'chip', title: 'Заголовок', cap: 'С чипом — метка состояния, примыкает к заголовку с отступом 8px' },
      { accessory: 'link', title: 'Заголовок', cap: 'Со служебной ссылкой — не primary-действие' },
    ];
    variants.forEach(v => {
      const { pop } = buildPopover({ width: 'm', header: true, headerAccessory: v.accessory, title: v.title, footLeft: 'none', footRight: 'none', content: 'text' });
      const head = pop.querySelector('.pop__head');
      head.style.borderBottom = 'none';
      const card = document.createElement('div');
      card.style.cssText = 'border:1px solid var(--border-light); border-radius: var(--pop-radius); overflow:hidden; background:var(--bg-tile); width:280px;';
      const cap = document.createElement('div'); cap.style.cssText = 'padding:12px 16px; border-top:1px solid var(--border-light); font:var(--type-body-xs); color:var(--text-inactive);'; cap.textContent = v.cap;
      card.appendChild(head); card.appendChild(cap);
      host.appendChild(card);
    });
    window.dsIcons && window.dsIcons.apply(host);
  })();

  /* ---------------- ИСПОЛЬЗОВАНИЕ — комбинации подвала ---------------- */
  (function () {
    const host = document.getElementById('use-foot-combos');
    if (!host) return;
    [
      { footLeft: 'none', footRight: 'primary', caption: 'Только Primary — одно завершающее действие' },
      { footLeft: 'none', footRight: 'both', caption: 'Secondary + Primary — есть отказ/отмена рядом с основным' },
      { footLeft: 'info', footRight: 'primary', caption: 'Инфо слева («Найдено: 24») + Primary справа' },
      { footLeft: 'link', footRight: 'none', caption: 'Только служебная ссылка слева — без формы' },
      { footLeft: 'button', footRight: 'both', caption: 'Кнопка слева («Сбросить») + Secondary/Primary справа — обе группы включаются независимо' },
      { footLeft: 'info', footRight: 'both', caption: 'Инфо слева + Secondary/Primary справа — любая комбинация сторон возможна' },
    ].forEach(cfg => {
      const card = document.createElement('div'); card.className = 'use-block';
      const stageEl = document.createElement('div'); stageEl.className = 'use-block__stage';
      stageEl.style.cssText = 'padding:0; display:flex; align-items:center; justify-content:center; min-height:80px;';
      const { pop } = buildPopover({ width: 'l', header: false, footLeft: cfg.footLeft, footRight: cfg.footRight, content: 'text' });
      const foot = pop.querySelector('.pop__foot');
      const box = document.createElement('div'); box.style.cssText = 'width:100%; border:1px solid var(--border-light); border-radius:12px; overflow:hidden; background:var(--bg-tile);';
      box.appendChild(foot || document.createElement('div'));
      stageEl.appendChild(box);
      const cap = document.createElement('div'); cap.className = 'use-block__cap'; cap.textContent = cfg.caption;
      card.appendChild(stageEl); card.appendChild(cap);
      host.appendChild(card);
    });
    window.dsIcons && window.dsIcons.apply(host);
  })();

  /* ---------------- РАЗМЕЩЕНИЕ: 12 позиций ---------------- */
  (function () {
    const grid = document.getElementById('placement-grid');
    if (!grid) return;
    const order = [
      ['top', 'start'], ['top', 'center'], ['top', 'end'],
      ['bottom', 'start'], ['bottom', 'center'], ['bottom', 'end'],
      ['left', 'start'], ['left', 'center'], ['left', 'end'],
      ['right', 'start'], ['right', 'center'], ['right', 'end'],
    ];
    const items = [];
    order.forEach(([p, a]) => {
      const cell = document.createElement('div'); cell.className = 'pcell';
      const cap = document.createElement('span'); cap.className = 'cap'; cap.textContent = p + ' · ' + a;
      const box = document.createElement('div'); box.className = 'popbox';
      const target = document.createElement('span'); target.className = 'pcell-target';
      const tx = (p === 'top' || p === 'bottom') ? (a === 'start' ? '22%' : a === 'end' ? '78%' : '50%') : (p === 'left' ? '78%' : '22%');
      const ty = (p === 'left' || p === 'right') ? (a === 'start' ? '22%' : a === 'end' ? '78%' : '50%') : (p === 'top' ? '80%' : '20%');
      target.style.left = tx; target.style.top = ty;
      const { pop } = buildPopover({ width: 's', header: false, footLeft: 'none', footRight: 'none', content: 'text', arrow: true, placement: p, align: a, floating: true, pinned: true });
      pop.querySelector('.pop__body').innerHTML = '<p style="margin:0;">Текст</p>';
      box.appendChild(target); box.appendChild(pop);
      cell.appendChild(cap); cell.appendChild(box); grid.appendChild(cell);
      items.push({ box, pop, target, p, a });
    });
    function reflow() { items.forEach(it => placePop(it.box, it.pop, it.target, it.p, it.a, 8)); }
    reflow();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(reflow);
    window.addEventListener('resize', reflow);
  })();

  /* ---------------- АВТО-FLIP у края контейнера ---------------- */
  (function () {
    const vp = document.getElementById('flip-vp');
    const select = document.getElementById('flip-pos');
    if (!vp || !select) return;
    const target = document.createElement('button');
    target.type = 'button'; target.className = 'ibtn ibtn--neutral ibtn--m'; target.setAttribute('aria-label', 'Информация');
    target.style.position = 'absolute'; target.style.top = '24px'; target.style.marginTop = '0';
    target.style.touchAction = 'none'; target.style.cursor = 'grab';
    target.innerHTML = '<i data-icon="info-circle"></i>';
    vp.appendChild(target);
    const { pop } = buildPopover({ width: 'm', header: true, title: 'Пояснение', footLeft: 'none', footRight: 'primary', content: 'text', arrow: true, floating: true, pinned: true, placement: 'bottom', align: 'start' });
    vp.appendChild(pop);

    const stateOut = document.getElementById('flip-state');
    /* авто-flip считает рантайм: предпочтение bottom/start, границы — стенд */
    function reposition() {
      const r = window.DSPopover.place(pop, target, {
        placement: 'bottom', align: 'start', gap: 8, flip: true, boundary: vp, offsetParent: vp,
      });
      if (stateOut) stateOut.textContent = 'placement: ' + r.placement + ' · align: ' + r.align;
    }
    function applyPreset(posVal) {
      target.style.left = posVal === 'left' ? '12px' : posVal === 'right' ? 'calc(100% - 44px)' : 'calc(50% - 16px)';
      reposition();
    }
    select.addEventListener('change', () => applyPreset(select.value));

    /* перетаскивание триггера по обеим осям */
    let dragging = false, startX = 0, startY = 0, startLeft = 0, startTop = 0;
    target.addEventListener('pointerdown', (e) => {
      dragging = true; target.setPointerCapture(e.pointerId); target.style.cursor = 'grabbing';
      const vr = vp.getBoundingClientRect(), tr = target.getBoundingClientRect();
      startX = e.clientX; startY = e.clientY;
      startLeft = tr.left - vr.left; startTop = tr.top - vr.top;
    });
    target.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const maxLeft = Math.max(0, vp.clientWidth - target.offsetWidth);
      const maxTop = Math.max(0, vp.clientHeight - target.offsetHeight);
      target.style.left = Math.max(0, Math.min(maxLeft, startLeft + (e.clientX - startX))) + 'px';
      target.style.top = Math.max(0, Math.min(maxTop, startTop + (e.clientY - startY))) + 'px';
      reposition();
    });
    target.addEventListener('pointerup', (e) => { dragging = false; target.style.cursor = 'grab'; target.releasePointerCapture(e.pointerId); });

    window.dsIcons && window.dsIcons.apply(vp);
    applyPreset('center');
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(reposition);
    window.addEventListener('resize', reposition);
  })();

  /* ---------------- ОДИН ПОПОВЕР ОДНОВРЕМЕННО ---------------- */
  (function () {
    const host = document.getElementById('single-open-demo');
    if (!host) return;
    const defs = [
      { icon: 'edit', label: 'Изменить', title: 'Быстрое редактирование', content: 'form' },
      { icon: 'filter', label: 'Фильтр', title: 'Фильтр по статусу', content: 'legend' },
      { icon: 'download', label: 'Скачать', title: 'Экспорт', content: 'text' },
    ];
    defs.forEach(d => {
      const anchor = document.createElement('span'); anchor.className = 'pop-anchor';
      const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'ibtn ibtn--neutral ibtn--m';
      btn.setAttribute('aria-label', d.label); btn.setAttribute('aria-haspopup', 'dialog'); btn.setAttribute('aria-expanded', 'false');
      btn.innerHTML = `<i data-icon="${d.icon}"></i>`;
      const { pop } = buildPopover({ width: 's', header: true, title: d.title, footLeft: 'none', footRight: 'none', content: d.content, arrow: true, floating: true, placement: 'bottom', align: 'start' });
      pop.id = 'pop-single-' + d.icon;
      anchor.appendChild(btn); anchor.appendChild(pop);
      host.appendChild(anchor);
      /* всё поведение — рантайм: single-open, клик вне, Esc, Tab-out, ✕, позиционирование */
      window.DSPopover.bind(btn, { pop, placement: 'bottom', align: 'start' });
    });
    window.dsIcons && window.dsIcons.apply(host);
  })();

  /* ---------------- СОСТОЯНИЯ: hover/disabled триггер, загрузка, ошибка, прокрутка ---------------- */
  (function () {
    const host = document.getElementById('states-demo');
    if (!host) return;
    const items = [
      { label: 'Триггер disabled — не открывается', disabledTrigger: true },
      { label: 'Загрузка контента', opts: { content: 'skeleton' } },
      { label: 'Ошибка загрузки', opts: { content: 'error' } },
      { label: 'Прокрутка — тень у шапки/подвала', opts: { content: 'scroll', header: true, footLeft: 'none', footRight: 'primary' }, scrolled: true },
    ];
    items.forEach(it => {
      const cell = document.createElement('div'); cell.className = 'state-cell';
      const cap = document.createElement('div'); cap.className = 'state-cap'; cap.textContent = it.label; cell.appendChild(cap);
      if (it.disabledTrigger) {
        const btn = document.createElement('button');
        btn.type = 'button'; btn.className = 'ibtn ibtn--neutral ibtn--m'; btn.disabled = true;
        btn.setAttribute('aria-label', 'Недоступно'); btn.setAttribute('aria-disabled', 'true');
        btn.innerHTML = '<i data-icon="info-circle"></i>';
        cell.appendChild(btn);
      } else {
        const box = document.createElement('div'); box.style.cssText = 'width:100%; max-width:280px;';
        const { pop, body, syncScrollShadow } = buildPopover({ width: 'm', header: it.opts.header !== false, title: 'Заголовок', footLeft: it.opts.footLeft || 'none', footRight: it.opts.footRight || 'none', content: it.opts.content });
        pop.style.cssText += 'box-shadow:0 1px 2px rgba(40,50,55,.12); position:relative;';
        if (it.scrolled) { pop.querySelector('.pop__body').style.maxHeight = '140px'; requestAnimationFrame(() => { body.scrollTop = 30; syncScrollShadow(); }); }
        box.appendChild(pop); cell.appendChild(box);
      }
      host.appendChild(cell);
    });
    window.dsIcons && window.dsIcons.apply(host);
  })();

  /* ---------------- ЦВЕТА ---------------- */
  (function () {
    const root = document.getElementById('color-ref');
    if (!root) return;
    const groups = [
      { name: 'Поверхность', rows: [
        ['Фон Body', '--bg-popup'], ['Фон Header/Footer', '--bgtable-pinned'], ['Тень', '--elevation-5 (без внешнего бордера)'],
      ]},
      { name: 'Типографика', rows: [
        ['Заголовок', '--text-primary'], ['Текст контента', '--text-primary'], ['Служебный текст в футере', '--text-secondary'],
      ]},
      { name: 'Загрузка / ошибка', rows: [
        ['Скелетон — база', '--st-disabled-light'], ['Скелетон — пик волны', '--st-disabled-midlight'], ['Иконка ошибки', '--error'],
      ]},
    ];
    root.innerHTML = groups.map(g => `
      <section class="cref-group">
        <h3>${g.name}</h3>
        <div class="cref-rows">
          ${g.rows.map(([role, tok]) => `
            <div class="cref-row">
              <div class="cref-sw"><div class="cf" style="background:var(${tok.split(' ')[0]});"></div></div>
              <div class="cref-meta"><p class="role">${role}</p><p class="tname">${tok}</p></div>
            </div>`).join('')}
        </div>
      </section>`).join('');
  })();

  /* ---------------- DEV: redline измерено на живом экземпляре ---------------- */
  (function () {
    const tbody = document.querySelector('#dev-spec-table');
    if (!tbody) return;
    const host = document.createElement('div');
    host.style.cssText = 'position:absolute; left:-9999px; top:0;';
    document.body.appendChild(host);
    const { pop, body } = buildPopover({ width: 'm', header: true, title: 'Заголовок', footLeft: 'none', footRight: 'both', content: 'text' });
    host.appendChild(pop);
    const csPop = getComputedStyle(pop), csHead = getComputedStyle(pop.querySelector('.pop__head')), csBody = getComputedStyle(body), csFoot = getComputedStyle(pop.querySelector('.pop__foot'));
    const r = n => Math.round(parseFloat(n) * 10) / 10;
    const rows = [
      ['Радиус контейнера', r(csPop.borderTopLeftRadius) + ' px'],
      ['Высота шапки', r(csHead.height) + ' px'],
      ['Паддинг шапки (X)', r(csHead.paddingLeft) + ' px'],
      ['Паддинг тела (Y / X)', r(csBody.paddingTop) + ' / ' + r(csBody.paddingLeft) + ' px'],
      ['Паддинг подвала (Y / X)', r(csFoot.paddingTop) + ' / ' + r(csFoot.paddingLeft) + ' px'],
      ['Зазор в подвале между кнопками', r(getComputedStyle(pop.querySelector('.pop__foot-right')).columnGap) + ' px'],
      ['Толщина разделителя шапка/тело', r(csHead.borderBottomWidth) + ' px'],
      ['Зазор от триггера', '8 px'],
    ];
    const csTitle = getComputedStyle(pop.querySelector('.pop__title'));
    rows.push(['Типографика заголовка (кегль / интерлиньяж)', r(csTitle.fontSize) + ' / ' + r(csTitle.lineHeight) + ' px']);
    host.remove();
    tbody.innerHTML = rows.map(([k, v]) => `<div class="tbl__row" style="grid-template-columns:8px 1.84fr 0.81fr 8px;"><div class="tc tc--separator"></div><div class="tc"><span class="tc__row"><span class="tc__text">${k}</span></span></div><div class="tc tc--numbers"><span class="tc__row"><span class="tc__text">${v}</span></span></div><div class="tc tc--separator"></div></div>`).join('');
  })();

  /* ---------------- DEV: copy-to-clipboard ---------------- */
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
});
