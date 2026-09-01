/* =========================================================================
   SegmentControl — documentation page logic
   ========================================================================= */
(function () {
  const L = window.DS_ICONS || {};
  const icon = (n) => L[n] || '';

  /* ---------- factory ----------
     o: {
       size:'m'|'s'|'xs', items:[{label, icon, disabled, badge}], selected:0,
       fullwidth:false, disabled:false, label:'aria-label', animate:true
     } badge — number/string rendered as a borderless Badge (--text variant) */
  const BADGE_SIZE_BY_SEG = { m: 's', s: 'xs', xs: 'xxs' };
  function makeSegControl(o = {}) {
    const {
      size = 'm', items = [], selected = 0,
      fullwidth = false, disabled = false, label = null,
    } = o;

    const host = document.createElement('div');
    host.className = 'segctrl segctrl--' + size;
    if (fullwidth) host.classList.add('segctrl--fullwidth');
    if (disabled) { host.classList.add('segctrl--disabled'); host.setAttribute('aria-disabled', 'true'); }
    host.setAttribute('role', 'radiogroup');
    if (label) host.setAttribute('aria-label', label);

    const thumb = document.createElement('div');
    thumb.className = 'segctrl__thumb';
    host.appendChild(thumb);

    items.forEach((it, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'segctrl__item' + (it.label == null ? ' segctrl__item--icon-only' : '');
      b.setAttribute('role', 'radio');
      const isSel = i === selected;
      b.setAttribute('aria-checked', String(isSel));
      const itemDisabled = disabled || it.disabled;
      if (it.disabled && !disabled) b.setAttribute('aria-disabled', 'true');
      b.tabIndex = itemDisabled ? -1 : (isSel ? 0 : -1);
      if (it.icon) { const ic = document.createElement('span'); ic.innerHTML = icon(it.icon); b.appendChild(ic); }
      if (it.label != null) { const lb = document.createElement('span'); lb.className = 'segctrl__label'; lb.textContent = it.label; b.appendChild(lb); }
      if (it.badge != null) {
        const bd = document.createElement('span');
        bd.className = 'badge badge--text badge--' + BADGE_SIZE_BY_SEG[size];
        bd.textContent = String(it.badge);
        b.appendChild(bd);
      }
      if (it.label == null && it.icon) b.setAttribute('aria-label', it.ariaLabel || it.icon);
      if (it._hover) b.classList.add('is-hover');
      host.appendChild(b);
    });

    return host;
  }

  /* позиция индикатора — рантайм ДС (scripts/ds-tabs.js): измеряется по
     выбранному сегменту, а не считается по индексу */
  function positionThumb(host) { window.DSTabs && DSTabs.positionThumb(host); }

  /* клик, клавиатура и пересчёт индикатора — тот же рантайм ДС */
  function wireSegControl(host, onChange) {
    window.DSTabs && DSTabs.segment(host, { onChange: onChange });
    return host;
  }

  function mount(id, node) { const el = document.getElementById(id); if (el) el.appendChild(node); }
  function mountAll(id, nodes) { const el = document.getElementById(id); if (el) nodes.forEach(n => el.appendChild(n)); }

  function build(o) { const h = makeSegControl(o); wireSegControl(h); return h; }

  /* ============================ PLAYGROUND ============================ */
  (function () {
    const state = { size: 'm', count: 3, content: 'text', fullwidth: false, withBadge: false, tabState: 'default', selected: 0 };
    const controls = document.getElementById('pg-controls');
    const preview = document.getElementById('pg-preview');
    const codeEl = document.getElementById('pg-code');

    const ICONS_CYCLE = ['bar-chart', 'pie-chart', 'list-view-01', 'layout-grid-01', 'activity-heart', 'file'];
    const LABELS_CYCLE = ['День', 'Неделя', 'Месяц', 'Квартал', 'Год', 'Всё время'];

    function select(label, options, getCur, onPick) {
      const wrap = document.createElement('div'); wrap.className = 'ctl';
      const l = document.createElement('div'); l.className = 'lbl'; l.textContent = label; wrap.appendChild(l);
      const box = document.createElement('div'); box.className = 'pg-select';
      const sel = document.createElement('select');
      options.forEach(([val, txt]) => { const op = document.createElement('option'); op.value = val; op.textContent = txt; if (String(val) === String(getCur())) op.selected = true; sel.appendChild(op); });
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

    controls.appendChild(select('Размер', [['m', 'M'], ['s', 'S'], ['xs', 'XS']], () => state.size, v => state.size = v));
    controls.appendChild(select('Кол-во сегментов', [['2', '2'], ['3', '3'], ['4', '4'], ['5', '5'], ['6', '6']], () => state.count, v => { state.count = +v; if (state.selected >= state.count) state.selected = 0; }));
    controls.appendChild(select('Контент', [['text', 'Текст'], ['icon-text', 'Иконка + текст'], ['icon', 'Только иконки']], () => state.content, v => state.content = v));
    controls.appendChild(select('Состояние', [['default', 'Default'], ['disabled', 'Disabled']], () => state.tabState, v => state.tabState = v));
    controls.appendChild(ctlToggle('Fullwidth', 'fullwidth'));
    controls.appendChild(ctlToggle('Счётчик (badge)', 'withBadge'));

    function buildItems() {
      const n = state.count;
      const arr = [];
      const counts = [3, 12, 128, 7, 41, 5];
      for (let i = 0; i < n; i++) {
        let o;
        if (state.content === 'icon') o = { icon: ICONS_CYCLE[i % ICONS_CYCLE.length], ariaLabel: LABELS_CYCLE[i % LABELS_CYCLE.length] };
        else if (state.content === 'icon-text') o = { icon: ICONS_CYCLE[i % ICONS_CYCLE.length], label: LABELS_CYCLE[i % LABELS_CYCLE.length] };
        else o = { label: LABELS_CYCLE[i % LABELS_CYCLE.length] };
        if (state.withBadge) o.badge = counts[i % counts.length];
        arr.push(o);
      }
      return arr;
    }

    function render() {
      preview.innerHTML = '';
      const disabled = state.tabState === 'disabled';
      const node = build({
        size: state.size, items: buildItems(), selected: Math.min(state.selected, state.count - 1),
        fullwidth: state.fullwidth, disabled, label: 'Пример',
      });
      if (state.fullwidth) node.style.width = '100%';
      preview.appendChild(node);
      node.addEventListener('click', (e) => { const b = e.target.closest('.segctrl__item'); if (b) state.selected = [...node.querySelectorAll('.segctrl__item')].indexOf(b); });

      const cls = ['segctrl', 'segctrl--' + state.size];
      if (state.fullwidth) cls.push('segctrl--fullwidth');
      if (disabled) cls.push('segctrl--disabled');
      codeEl.innerHTML = '<code>&lt;div class="' + cls.join(' ') + '" role="radiogroup"&gt;…&lt;/div&gt;</code>';
    }
    render();
  })();

  /* ============================ USAGE ============================ */
  (function () {
    mount('use-period', build({ size: 'm', label: 'Период', items: [
      { label: 'День' }, { label: 'Неделя' }, { label: 'Месяц', }, { label: 'Год' },
    ], selected: 2 }));

    mount('use-view', build({ size: 's', label: 'Режим отображения', items: [
      { icon: 'list-view-01', ariaLabel: 'Список' }, { icon: 'layout-grid-01', ariaLabel: 'Плитка' },
    ], selected: 0 }));
  })();

  /* ============================ DIFFERENTIATION ============================ */
  (function () {
    const segHost = document.getElementById('diff-seg');
    if (segHost) segHost.appendChild(build({ size: 's', items: [{ label: 'Неделя' }, { label: 'Месяц' }, { label: 'Год' }], selected: 1 }));

    const tabHost = document.getElementById('diff-tab');
    if (tabHost) {
      const g = document.createElement('div');
      g.className = 'tabs tabs--horiz';
      g.setAttribute('role', 'tablist');
      [['Обзор', false], ['Документы', true], ['История', false]].forEach(([label, sel]) => {
        const t = document.createElement('button');
        t.type = 'button';
        t.className = 'tab tab--s' + (sel ? ' tab--selected' : '');
        t.setAttribute('role', 'tab');
        t.setAttribute('aria-selected', String(sel));
        const lb = document.createElement('span'); lb.className = 'tab__label'; lb.textContent = label; t.appendChild(lb);
        g.appendChild(t);
      });
      tabHost.appendChild(g);
    }

    const btgHost = document.getElementById('diff-btg');
    if (btgHost && window.DS_ICONS) {
      const L = window.DS_ICONS;
      const g = document.createElement('div');
      g.className = 'btn-group btn-group--outline btn-group--toggle';
      g.setAttribute('role', 'group');
      [['list-view-01', false], ['layout-grid-01', true]].forEach(([ic, pressed]) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'btn btn--outline btn--s btn--icon-only';
        b.setAttribute('aria-pressed', String(pressed));
        b.innerHTML = L[ic] || '';
        g.appendChild(b);
      });
      btgHost.appendChild(g);
    }
  })();

  /* ============================ ANATOMY ============================ */
  (function () {
    const d = document.getElementById('anat-diagram');
    const g = build({ size: 'm', items: [{ label: 'Неделя' }, { label: 'Месяц' }, { label: 'Год' }], selected: 1, label: 'Период' });
    d.appendChild(g);
    requestAnimationFrame(() => {
      const marks = [
        ['1', '50%', 'calc(100% + 16px)'],  // track
        ['2', '50%', '-16px'],              // thumb
        ['3', '84%', '-16px'],              // segment/label
        ['4', '2%', '-16px'],               // divider
      ];
      marks.forEach(([n, left, top]) => {
        const m = document.createElement('span'); m.className = 'mk'; m.textContent = n;
        m.style.left = left; m.style.top = top; d.appendChild(m);
      });
    });
  })();

  /* ============================ SIZES ============================ */
  (function () {
    const g = document.getElementById('sizes-grid');
    const cols = [['M', 'm'], ['S', 's'], ['XS', 'xs']];
    g.appendChild(document.createElement('div'));
    cols.forEach(([nm]) => { const h = document.createElement('div'); h.className = 'col-head'; h.textContent = nm; g.appendChild(h); });

    const rows = [
      ['Текст', (sz) => build({ size: sz, items: [{ label: 'Неделя' }, { label: 'Месяц' }, { label: 'Год' }], selected: 1 })],
      ['+ иконка', (sz) => build({ size: sz, items: [{ icon: 'list-view-01', label: 'Список' }, { icon: 'layout-grid-01', label: 'Плитка' }], selected: 0 })],
      ['Только иконки', (sz) => build({ size: sz, items: [{ icon: 'list-view-01', ariaLabel: 'Список' }, { icon: 'layout-grid-01', ariaLabel: 'Плитка' }], selected: 1 })],
    ];
    rows.forEach(([rl, mkr]) => {
      const rh = document.createElement('div'); rh.className = 'row-head'; rh.textContent = rl; g.appendChild(rh);
      cols.forEach(([, sz]) => { const c = document.createElement('div'); c.className = 'cell'; c.appendChild(mkr(sz)); g.appendChild(c); });
    });

    const tbl = [
      ['M', '40 px', 'Button M · 16/24', '20 px', 'Базовый: фильтры и панели над таблицами/графиками'],
      ['S', '32 px', 'Button S · 14/20', '18 px', 'Плотные тулбары, карточки виджетов'],
      ['XS', '24 px', 'Button XS · 12/16', '16 px', 'Компактные строки, инлайн рядом с текстом'],
    ];
    document.querySelector('#sizes-table').innerHTML = tbl.map(r =>
      `<div class="tbl__row" style="grid-template-columns:8px 1.84fr 0.72fr 0.95fr 0.72fr 0.9fr 8px;"><div class="tc tc--separator"></div><div class="tc"><span class="tc__row"><span class="tc__text"><b>${r[0]}</b></span></span></div><div class="tc tc--numbers"><span class="tc__row"><span class="tc__text">${r[1]}</span></span></div><div class="tc"><span class="tc__row"><span class="tc__text">${r[2]}</span></span></div><div class="tc tc--numbers"><span class="tc__row"><span class="tc__text">${r[3]}</span></span></div><div class="tc"><span class="tc__row"><span class="tc__text">${r[4]}</span></span></div><div class="tc tc--separator"></div></div>`).join('');
  })();

  /* ============================ CONTENT ============================ */
  (function () {
    mount('content-text', build({ size: 'm', items: [{ label: 'Все' }, { label: 'Активные' }, { label: 'Закрытые' }], selected: 0 }));
    mount('content-icontext', build({ size: 'm', items: [{ icon: 'bar-chart', label: 'График' }, { icon: 'list-view-01', label: 'Таблица' }], selected: 1 }));
    mount('content-icononly', build({ size: 'm', items: [
      { icon: 'list-view-01', ariaLabel: 'Список' }, { icon: 'layout-grid-01', ariaLabel: 'Плитка' }, { icon: 'bar-chart', ariaLabel: 'График' },
    ], selected: 2, label: 'Режим отображения' }));
    mount('content-badge', build({ size: 'm', items: [
      { label: 'Все', badge: 128 }, { label: 'Активные', badge: 12 }, { label: 'Закрытые', badge: 3 },
    ], selected: 1 }));
  })();

  /* ============================ COUNT + FULLWIDTH ============================ */
  (function () {
    const g = document.getElementById('count-row');
    [2, 3, 4, 6].forEach(n => {
      const items = LABELS_CYCLE_SAFE(n);
      g.appendChild(build({ size: 's', items, selected: 0 }));
    });
    function LABELS_CYCLE_SAFE(n) {
      const src = ['День', 'Неделя', 'Месяц', 'Квартал', 'Полгода', 'Год'];
      return src.slice(0, n).map(label => ({ label }));
    }

    const fw = document.getElementById('fullwidth-demo');
    const node = build({ size: 'm', fullwidth: true, items: [{ label: 'Все' }, { label: 'Мои' }, { label: 'Избранные' }], selected: 0 });
    node.style.width = '100%';
    fw.appendChild(node);
  })();

  /* ============================ STATES (spec) ============================ */
  (function () {
    const probe = document.createElement('span');
    probe.style.cssText = 'position:absolute;left:-9999px;width:0;height:0;';
    document.body.appendChild(probe);
    function resolveHex(token) {
      const cssVal = token.startsWith('--') ? 'var(' + token + ')' : token;
      probe.style.backgroundColor = 'transparent'; probe.style.backgroundColor = cssVal;
      const v = getComputedStyle(probe).backgroundColor;
      let r, g, b, a = 1, m = v.match(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)/i);
      if (m) { r = +m[1] * 255; g = +m[2] * 255; b = +m[3] * 255; if (m[4] !== undefined) a = +m[4]; }
      else { const n = v.match(/[\d.]+/g); if (!n) return ''; r = +n[0]; g = +n[1]; b = +n[2]; if (n[3] !== undefined) a = +n[3]; }
      const hx = n => Math.round(n).toString(16).padStart(2, '0').toUpperCase();
      let s = '#' + hx(r) + hx(g) + hx(b); if (a < 1) s += ', ' + Math.round(a * 100) + '%'; return s;
    }
    function cline(role, token, name, raw) {
      const cssVal = token.startsWith('--') ? 'var(' + token + ')' : token;
      return `<div class="spec__cline"><b>${role}</b><span class="spec__sw" style="background:${cssVal}"></span><span><span class="tnm">${name}</span></span><span class="raw">${raw} · ${resolveHex(token)}</span></div>`;
    }

    function sample(sel, hover) {
      const g = makeSegControl({ size: 'm', items: [{ label: 'Неделя' }, { label: 'Месяц' }, { label: 'Год' }], selected: sel });
      if (hover != null) g.children[hover + 1].classList.add('is-hover');
      requestAnimationFrame(() => positionThumb(g));
      return g;
    }

    const rows = [
      ['Default', () => sample(1), [
        ['Track заливка', 'color-mix(in srgb, var(--c-swamp-400) 16%, transparent)', 'Swamp_400, 16%', 'полупрозрачная'],
        ['Текст (unselected)', '--text-secondary', 'Text_Secondary', 'CGrey_500'],
        ['Индикатор (thumb)', '--bg-tile', 'BG_Tile', '#FFFFFF + shadow'],
        ['Текст (selected)', '--primary', 'Primary', 'Emerald_500'],
      ]],
      ['Hover · unselected', () => sample(1, 0), [
        ['Fill', '--primary-bg', 'Active_PrimaryBG', 'Emerald_500, 6%'],
        ['Текст', '--text-primary', 'Text_Primary', 'CGrey_600'],
      ]],
      ['Selected — hover не меняет вид', () => sample(1, 1), [
        ['Индикатор', '--bg-tile', 'BG_Tile', 'без изменений'],
        ['Текст', '--primary', 'Primary', 'без изменений'],
      ]],
      ['Disabled (весь контрол)', () => { const g = makeSegControl({ size: 'm', disabled: true, items: [{ label: 'Неделя' }, { label: 'Месяц' }, { label: 'Год' }], selected: 1 }); requestAnimationFrame(() => positionThumb(g)); return g; }, [
        ['Track', '--disabled-bg', 'DisabledBG', 'CGrey_50'],
        ['Текст', '--st-disabled-dark', 'StDisabled_Dark', 'CGrey_600, 40%'],
      ]],
    ];

    const host = document.getElementById('state-specs');
    rows.forEach(([title, mkr, colors]) => {
      const spec = document.createElement('div'); spec.className = 'spec';
      const row = document.createElement('div'); row.className = 'spec__row';
      const a = document.createElement('div'); a.className = 'spec__state'; a.textContent = title; row.appendChild(a);
      const b = document.createElement('div'); b.className = 'spec__sample'; b.appendChild(mkr()); row.appendChild(b);
      const c = document.createElement('div'); c.className = 'spec__colors'; c.innerHTML = colors.map(cc => cline(cc[0], cc[1], cc[2], cc[3])).join(''); row.appendChild(c);
      spec.appendChild(row); host.appendChild(spec);
    });
    probe.remove();
  })();

  /* ============================ SINGLE-ITEM DISABLED (addon) ============================ */
  (function () {
    const host = document.getElementById('item-disabled-demo');
    if (!host) return;
    const node = build({ size: 'm', items: [{ label: 'Базовый' }, { label: 'Стандарт' }, { label: 'Премиум', disabled: true }], selected: 0 });
    host.appendChild(node);
  })();

  /* ============================ ANIMATION DEMO ============================ */
  (function () {
    const host = document.getElementById('anim-demo');
    if (!host) return;
    host.appendChild(build({ size: 'm', items: [{ label: 'День' }, { label: 'Неделя' }, { label: 'Месяц' }, { label: 'Квартал' }], selected: 0 }));
  })();

  /* ============================ TYPOGRAPHY ============================ */
  (function () {
    const rows = [
      ['M', 'm', '--type-button-m', '16 / 24'],
      ['S', 's', '--type-button-s', '14 / 20'],
      ['XS', 'xs', '--type-button-xs', '12 / 16'],
    ];
    const tb = document.querySelector('#typo-table tbody');
    rows.forEach(r => {
      const tr = document.createElement('tr');
      const t0 = document.createElement('td'); t0.innerHTML = '<b>' + r[0] + '</b>';
      const t1 = document.createElement('td'); t1.appendChild(build({ size: r[1], items: [{ label: 'Текст' }, { label: 'Текст' }], selected: 0 }));
      const t2 = document.createElement('td'); t2.innerHTML = '<code class="tok">' + r[2] + '</code>';
      const t3 = document.createElement('td'); t3.className = 'rt-num'; t3.textContent = r[3];
      tr.append(t0, t1, t2, t3); tb.appendChild(tr);
    });
  })();

  /* ============================ GUIDELINES ============================ */
  (function () {
    const BAD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    const GOOD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>';
    document.getElementById('ic-bad1').innerHTML = BAD;
    document.getElementById('ic-bad2').innerHTML = BAD;
    document.getElementById('ic-good1').innerHTML = GOOD;
    document.getElementById('ic-good2').innerHTML = GOOD;
    document.getElementById('ic-good3').innerHTML = GOOD;

    // pair 1 — короткие взаимоисключающие значения одного параметра
    document.getElementById('guide-good1').appendChild(build({ size: 'm', items: [{ label: 'День' }, { label: 'Неделя' }, { label: 'Месяц' }], selected: 1 }));
    // bad — использование вместо навигационных Tab
    document.getElementById('guide-bad1').appendChild(build({ size: 'm', items: [{ label: 'Обзор сделки' }, { label: 'Документы и вложения' }, { label: 'История изменений' }], selected: 0 }));

    // pair 2 — количество сегментов 2–6
    document.getElementById('guide-good2').appendChild(build({ size: 'm', items: [{ label: 'Список' }, { label: 'Плитка' }], selected: 0 }));
    const many = build({ size: 's', items: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(label => ({ label })), selected: 0 });
    document.getElementById('guide-bad2').appendChild(many);

    // solo — без пары «не так»
    document.getElementById('guide-good3').appendChild(build({ size: 'm', fullwidth: true, items: [{ label: 'Отмена' }, { label: 'Применить' }], selected: 1 }));
    document.getElementById('guide-good3').firstChild && (document.getElementById('guide-good3').style.width = '100%');
  })();

  /* ============================ COLOR REFERENCE ============================ */
  (function () {
    const probe = document.createElement('span');
    probe.style.cssText = 'position:absolute;left:-9999px;width:0;height:0;';
    document.body.appendChild(probe);
    function resolveHex(cssValue) {
      probe.style.backgroundColor = 'transparent'; probe.style.backgroundColor = cssValue;
      const v = getComputedStyle(probe).backgroundColor;
      let r, g, b, a = 1, m = v.match(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)/i);
      if (m) { r = +m[1] * 255; g = +m[2] * 255; b = +m[3] * 255; if (m[4] !== undefined) a = +m[4]; }
      else { const n = v.match(/[\d.]+/g); if (!n) return cssValue; r = +n[0]; g = +n[1]; b = +n[2]; if (n[3] !== undefined) a = +n[3]; }
      const hx = n => Math.round(n).toString(16).padStart(2, '0').toUpperCase();
      let s = '#' + hx(r) + hx(g) + hx(b); if (a < 1) s += ' · ' + Math.round(a * 100) + '%'; return s;
    }
    const groups = [
      { name: 'Track / индикатор', rows: [
        ['Track заливка', 'color-mix(in srgb, var(--c-swamp-400) 16%, transparent)'], ['Индикатор (thumb)', '--bg-tile'], ['Разделитель', '--border-primary'],
      ] },
      { name: 'Текст', rows: [
        ['Unselected', '--text-secondary'], ['Hover', '--text-primary'], ['Selected', '--primary'],
      ] },
      { name: 'Заливки', rows: [
        ['Hover fill', '--primary-bg'],
      ] },
      { name: 'Disabled', rows: [
        ['Track', '--disabled-bg'], ['Текст', '--st-disabled-dark'],
      ] },
    ];
    document.getElementById('color-ref').innerHTML = groups.map(g => `
      <section class="cref-group">
        <h3>${g.name}</h3>
        <div class="cref-rows">
          ${g.rows.map(([role, tok]) => `
            <div class="cref-row">
              <div class="cref-sw"><div class="cf" style="background:${tok.startsWith('--') ? 'var(' + tok + ')' : tok};"></div></div>
              <div class="cref-meta"><p class="role">${role}</p><p class="tname">${tok}</p></div>
              <div class="cref-hex">${resolveHex(tok.startsWith('--') ? 'var(' + tok + ')' : tok)}</div>
            </div>`).join('')}
        </div>
      </section>`).join('');
    probe.remove();
  })();

  /* ============================ DEV SPEC TABLE (measured, not hardcoded) ============================ */
  (function () {
    const tbody = document.querySelector('#dev-spec-table');
    if (!tbody) return;

    function measure(size) {
      const host = document.createElement('div');
      host.style.cssText = 'position:absolute; left:-9999px; top:0; visibility:hidden;';
      const g = makeSegControl({ size, items: [
        { icon: 'list-view-01', label: 'Текст' }, { label: 'Текст', badge: 12 },
      ], selected: 1 });
      host.appendChild(g);
      document.body.appendChild(host);

      const track = g;
      const items = g.querySelectorAll('.segctrl__item');
      const item = items[1];
      const badge = item.querySelector('.badge--text');
      const cs = getComputedStyle(track);
      const csItem = getComputedStyle(item);
      const csBadge = badge ? getComputedStyle(badge) : null;

      const itemH = Math.round(parseFloat(csItem.height));
      const trackPad = Math.round(parseFloat(cs.paddingTop));
      const data = {
        itemH: itemH,
        trackPad: trackPad,
        // полная высота контрола = сегмент + обводка трека сверху и снизу;
        // именно она обязана совпадать с высотой Button того же размера
        trackH: itemH + trackPad * 2,
        trackRadius: Math.round(parseFloat(cs.borderTopLeftRadius)),
        itemRadius: Math.round(parseFloat(csItem.borderTopLeftRadius)),
        itemPadX: Math.round(parseFloat(csItem.paddingLeft)),
        gap: Math.round(parseFloat(cs.columnGap || cs.gap)),
        icon: Math.round(parseFloat(cs.getPropertyValue('--seg-icon'))),
        fontSize: Math.round(parseFloat(csItem.fontSize)),
        lineHeight: Math.round(parseFloat(csItem.lineHeight)),
        badgeFont: csBadge ? Math.round(parseFloat(csBadge.fontSize)) : null,
      };
      host.remove();
      return data;
    }

    const sizes = ['m', 's', 'xs'];
    const d = { m: measure('m'), s: measure('s'), xs: measure('xs') };

    const rows = [
      ['Высота сегмента', sz => d[sz].itemH + ' px'],
      ['Паддинг трека (top/bottom/left)', sz => d[sz].trackPad + ' px'],
      ['Высота трека (расчётная)', sz => d[sz].trackH + ' px'],
      ['Радиус трека', sz => d[sz].trackRadius + ' px'],
      ['Радиус сегмента / индикатора', sz => d[sz].itemRadius + ' px'],
      ['Паддинг сегмента по X', sz => d[sz].itemPadX + ' px'],
      ['Зазор между сегментами', sz => d[sz].gap + ' px'],
      ['Иконка', sz => d[sz].icon + ' px'],
      ['Типографика (размер / высота строки)', sz => d[sz].fontSize + ' / ' + d[sz].lineHeight + ' px'],
      ['Счётчик (Badge, кегль)', sz => d[sz].badgeFont + ' px'],
    ];
    tbody.innerHTML = rows.map(([label, fn]) =>
      `<div class="tbl__row" style="grid-template-columns:8px 1.84fr 0.55fr 0.55fr 0.55fr 8px;"><div class="tc tc--separator"></div><div class="tc"><span class="tc__row"><span class="tc__text">${label}</span></span></div><div class="tc tc--numbers"><span class="tc__row"><span class="tc__text">${fn('m')}</span></span></div><div class="tc tc--numbers"><span class="tc__row"><span class="tc__text">${fn('s')}</span></span></div><div class="tc tc--numbers"><span class="tc__row"><span class="tc__text">${fn('xs')}</span></span></div><div class="tc tc--separator"></div></div>`
    ).join('');
  })();

  /* ============================ DEV CODE PANELS — copy buttons ============================ */
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

})();
