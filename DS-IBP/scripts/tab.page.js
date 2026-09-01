/* =========================================================================
   Tab — documentation page logic
   ========================================================================= */
(function () {
  const L = window.DS_ICONS || {};
  const icon = (n) => L[n] || '';

  /* разбиение целого числа на разряды: 1234 -> "1 234" */
  function groupNum(n) {
    if (n == null || n === '') return null;
    const s = String(n).replace(/\D/g, '');
    return s.replace(/\B(?=(\d{3})+(?!\d))/g, '\u2009');
  }

  /* ---------- tab factory ----------
     o: {
       orient:'horiz'|'vert', size:'m'|'s',
       label, icon:null|'<name>', badge:null|number,
       state:'default'|'hover'|'selected', disabled
     } */
  function makeTab(o = {}) {
    const {
      orient = 'horiz', size = 'm', label = 'Text',
      icon: ic = null, badge = null,
      state = 'default', disabled = false, standalone = true,
    } = o;

    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'tab tab--' + size + ' tab--' + orient;
    if (standalone) el.classList.add('tab--standalone');
    el.setAttribute('role', 'tab');

    const selected = state === 'selected';
    if (selected) { el.classList.add('tab--selected'); el.setAttribute('aria-selected', 'true'); }
    else el.setAttribute('aria-selected', 'false');
    if (state === 'hover') el.classList.add('is-hover');
    if (disabled) { el.classList.add('tab--disabled'); el.setAttribute('aria-disabled', 'true'); }
    el.tabIndex = disabled ? -1 : (selected ? 0 : -1);

    if (ic) {
      const i = document.createElement('span'); i.className = 'tab__icon'; i.innerHTML = icon(ic); el.appendChild(i);
    }
    const lb = document.createElement('span'); lb.className = 'tab__label'; lb.textContent = label; el.appendChild(lb);
    if (badge != null) {
      const b = document.createElement('span'); b.className = 'tab__badge'; b.textContent = groupNum(badge); el.appendChild(b);
    }
    return el;
  }

  /* group helper */
  function makeGroup(orient, opts) {
    const g = document.createElement('div');
    g.className = 'tabs tabs--' + orient;
    g.setAttribute('role', 'tablist');
    opts.forEach(o => g.appendChild(makeTab(Object.assign({ orient, standalone: false }, o))));
    return g;
  }

  /* переключение и клавиатура — рантайм ДС (scripts/ds-tabs.js):
     roving tabindex, стрелки по ориентации, Home/End, подскролл выбранного */
  function wireTablist(group) { return window.DSTabs && DSTabs.tabs(group); }

  /* ---------- overflow — оба паттерна (скролл со стрелками, fit + меню «ёщё») живут
     в рантайме ds-tabs.js (RulesAudit W2) — страница только собирает реальную
     разметку и вызывает DSTabs.tabs(); паттерн активируется сам по факту
     переполнения — для второго ряда паттерн форсируется data-tabs-overflow="menu". ---------- */

  /* ============================ PLAYGROUND ============================ */
  (function () {
    const state = { orient: 'horiz', size: 'm', leadingIcon: 'none', hasBadge: false, badgeVal: '9', tabState: 'default', isSelected: true };
    const controls = document.getElementById('pg-controls');
    const preview = document.getElementById('pg-preview');
    const codeEl = document.getElementById('pg-code');

    function select(label, options, getCur, onPick) {
      const wrap = document.createElement('div'); wrap.className = 'ctl';
      const l = document.createElement('div'); l.className = 'lbl'; l.textContent = label; wrap.appendChild(l);
      const box = document.createElement('div'); box.className = 'pg-select';
      const sel = document.createElement('select');
      options.forEach(([val, txt]) => { const op = document.createElement('option'); op.value = val; op.textContent = txt; if (val === getCur()) op.selected = true; sel.appendChild(op); });
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

    controls.appendChild(select('Ориентация', [['horiz', 'Horizontal'], ['vert', 'Vertical']], () => state.orient, v => state.orient = v));
    controls.appendChild(select('Размер', [['m', 'M · 40'], ['s', 'S · 32']], () => state.size, v => state.size = v));
    controls.appendChild(select('Иконка', [['none', 'Нет'], ['bar-chart', 'bar-chart'], ['file', 'file'], ['user', 'user'], ['settings', 'settings'], ['pie-chart', 'pie-chart']], () => state.leadingIcon, v => state.leadingIcon = v));
    controls.appendChild(select('Состояние', [['default', 'Default'], ['hover', 'Hover = Focus'], ['disabled', 'Disabled']], () => state.tabState, v => state.tabState = v));
    controls.appendChild(ctlToggle('Selected', 'isSelected'));
    controls.appendChild(ctlToggle('Бейдж', 'hasBadge'));

    function render() {
      const disabled = state.tabState === 'disabled';
      const selected = state.isSelected && !disabled;
      const o = {
        orient: state.orient, size: state.size, label: 'Text',
        icon: state.leadingIcon === 'none' ? null : state.leadingIcon,
        badge: state.hasBadge ? state.badgeVal : null,
        state: disabled ? 'default' : state.tabState, disabled, standalone: false,
      };
      preview.innerHTML = '';
      // wrap a single tab in a small group so the rail shows
      const g = document.createElement('div');
      g.className = 'tabs tabs--' + state.orient + (state.orient === 'vert' ? '' : '');
      if (state.orient === 'vert') g.style.minWidth = '220px';
      const tabEl = makeTab(o);
      if (selected) { tabEl.classList.add('tab--selected'); tabEl.setAttribute('aria-selected', 'true'); }
      g.appendChild(tabEl);
      preview.appendChild(g);

      const cls = ['tab', 'tab--' + state.size, 'tab--' + state.orient];
      if (selected) cls.push('tab--selected');
      if (disabled) cls.push('tab--disabled');
      codeEl.innerHTML = '<code>&lt;button class="' + cls.join(' ') + '"&gt;…&lt;/button&gt;</code>';
    }
    render();
  })();

  /* ============================ USAGE ============================ */
  (function () {
    // horizontal tabs on a page
    const h = document.getElementById('use-horiz');
    const hg = makeGroup('horiz', [
      { label: 'Сделки', state: 'selected' },
      { label: 'Проекты' },
      { label: 'Документы' },
      { label: 'Архив' },
    ]);
    wireTablist(hg); h.appendChild(hg);

    // vertical tabs on a modal
    const v = document.getElementById('use-vert');
    const vg = makeGroup('vert', [
      { label: 'Основная информация', badge: 3 },
      { label: 'Продукты' },
      { label: 'Сроки', badge: 6, state: 'selected' },
      { label: 'Команда сделки', badge: 3 },
      { label: 'Прочее' },
    ]);
    wireTablist(vg); v.appendChild(vg);
  })();

  /* ============================ ANATOMY ============================ */
  (function () {
    const d = document.getElementById('anat-diagram');
    const g = document.createElement('div'); g.className = 'tabs tabs--horiz tabs--bare';
    const tab = makeTab({ orient: 'horiz', size: 'm', label: 'Текст', icon: 'bar-chart', badge: 9, state: 'selected', standalone: false });
    g.appendChild(tab); d.appendChild(g);
    requestAnimationFrame(() => {
      const marks = [
        ['1', '50%', 'calc(100% + 16px)'],   // container / rail
        ['2', '12%', '-16px'],               // leading icon
        ['3', '46%', '-16px'],               // text
        ['4', '86%', '-16px'],               // badge
      ];
      marks.forEach(([n, left, top]) => {
        const m = document.createElement('span'); m.className = 'mk'; m.textContent = n;
        m.style.left = left; m.style.top = top; d.appendChild(m);
      });
    });
  })();

  /* ============================ ORIENTATION ============================ */
  (function () {
    const h = document.getElementById('orient-horiz');
    const hg = makeGroup('horiz', [
      { label: 'Обзор', state: 'selected' }, { label: 'Продукты', badge: 12 },
      { label: 'История' }, { label: 'Документы', badge: 3 },
    ]);
    wireTablist(hg); h.appendChild(hg);

    const v = document.getElementById('orient-vert');
    const vg = makeGroup('vert', [
      { label: 'Обзор', state: 'selected' }, { label: 'Продукты', badge: 12 },
      { label: 'История' }, { label: 'Документы', badge: 3 },
    ]);
    wireTablist(vg); v.appendChild(vg);
  })();

  /* ============================ SIZES ============================ */
  (function () {
    const g = document.getElementById('sizes-grid');
    const cols = [['M', 'm'], ['S', 's']];
    g.appendChild(document.createElement('div'));
    cols.forEach(([nm]) => { const h = document.createElement('div'); h.className = 'col-head'; h.textContent = nm; g.appendChild(h); });

    const rows = [
      ['Текст', (sz) => makeTab({ size: sz, label: 'Text', state: 'selected' })],
      ['+ иконка', (sz) => makeTab({ size: sz, label: 'Text', icon: 'bar-chart', state: 'selected' })],
      ['+ бейдж', (sz) => makeTab({ size: sz, label: 'Text', badge: 9, state: 'selected' })],
    ];
    rows.forEach(([rl, build]) => {
      const rh = document.createElement('div'); rh.className = 'row-head'; rh.textContent = rl; g.appendChild(rh);
      cols.forEach(([, sz]) => { const c = document.createElement('div'); c.className = 'cell'; c.appendChild(build(sz)); g.appendChild(c); });
    });

    const tbl = [
      ['M', '40 px', 'Body M · 16/20', '20 px', '20 px', 'Базовый: страницы, модалки'],
      ['S', '32 px', 'Body S · 14/16', '18 px', '16 px', 'Плотные места, узкие модалки'],
    ];
    document.querySelector('#sizes-table').innerHTML = tbl.map(r =>
      `<div class="tbl__row" style="grid-template-columns:8px 1.84fr 0.72fr 0.99fr 0.72fr 0.95fr 0.9fr 8px;"><div class="tc tc--separator"></div><div class="tc"><span class="tc__row"><span class="tc__text"><b>${r[0]}</b></span></span></div><div class="tc tc--numbers"><span class="tc__row"><span class="tc__text">${r[1]}</span></span></div><div class="tc"><span class="tc__row"><span class="tc__text">${r[2]}</span></span></div><div class="tc tc--numbers"><span class="tc__row"><span class="tc__text">${r[3]}</span></span></div><div class="tc tc--numbers"><span class="tc__row"><span class="tc__text">${r[4]}</span></span></div><div class="tc"><span class="tc__row"><span class="tc__text">${r[5]}</span></span></div><div class="tc tc--separator"></div></div>`).join('');
  })();

  /* ============================ STATES (spec tables) ============================ */
  (function () {
    const probe = document.createElement('span');
    probe.style.cssText = 'position:absolute;left:-9999px;width:0;height:0;';
    document.body.appendChild(probe);
    function resolveHex(token) {
      probe.style.backgroundColor = 'transparent'; probe.style.backgroundColor = 'var(' + token + ')';
      const v = getComputedStyle(probe).backgroundColor;
      let r, g, b, a = 1, m = v.match(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)/i);
      if (m) { r = +m[1] * 255; g = +m[2] * 255; b = +m[3] * 255; if (m[4] !== undefined) a = +m[4]; }
      else { const n = v.match(/[\d.]+/g); if (!n) return ''; r = +n[0]; g = +n[1]; b = +n[2]; if (n[3] !== undefined) a = +n[3]; }
      const hx = n => Math.round(n).toString(16).padStart(2, '0').toUpperCase();
      let s = '#' + hx(r) + hx(g) + hx(b); if (a < 1) s += ', ' + Math.round(a * 100) + '%'; return s;
    }
    function cline(role, token, name, raw) {
      return `<div class="spec__cline"><b>${role}</b><span class="spec__sw" style="background:var(${token})"></span><span><span class="tnm">${name}</span></span><span class="raw">${raw} · ${resolveHex(token)}</span></div>`;
    }

    const unselected = [
      ['Default', { label: 'Text', badge: 3, state: 'default' }, [
        ['Текст', '--text-secondary', 'Text_Secondary', 'CGrey_500'],
        ['Иконка', '--text-secondary', 'Text_Secondary', 'CGrey_500'],
        ['Бейдж', '--st-system-midlight', 'StSystem_MidLight', 'Swamp_400, 32%'],
      ]],
      ['Hover = Focus', { label: 'Text', badge: 3, state: 'hover' }, [
        ['Fill', '--primary-bg', 'Active_PrimaryBG', 'Emerald_500, 6%'],
        ['Текст', '--text-primary', 'Text_Primary', 'CGrey_600'],
        ['Иконка', '--text-primary', 'Text_Primary', 'CGrey_600'],
      ]],
    ];
    const selected = [
      ['Default', { label: 'Text', badge: 3, state: 'selected' }, [
        ['Индикатор', '--primary', 'Primary', 'Emerald_500'],
        ['Текст', '--text-primary', 'Text_Primary', 'CGrey_600'],
        ['Иконка', '--primary', 'Primary', 'Emerald_500'],
      ]],
      ['Hover = Focus', { label: 'Text', badge: 77, state: 'selected', _hover: true }, [
        ['Fill', '--primary-bg', 'Active_PrimaryBG', 'Emerald_500, 6%'],
        ['Индикатор', '--primary', 'Primary', 'Emerald_500'],
        ['Текст', '--text-primary', 'Text_Primary', 'CGrey_600'],
        ['Бейдж', '--st-system-midlight', 'StSystem_MidLight', 'без изменений'],
      ]],
    ];
    const disabledRow = [
      ['Disabled', { label: 'Text', badge: 3, state: 'default', disabled: true }, [
        ['Текст', '--st-disabled-dark', 'StDisabled_Dark', 'CGrey_600, 40%'],
        ['Иконка', '--st-disabled', 'StDisabled', 'CGrey_600, 24%'],
        ['Бейдж', '--st-disabled-midlight', 'StDisabled_MidLight', 'CGrey_600, 8%'],
      ]],
    ];

    function buildSpec(title, states) {
      const spec = document.createElement('div'); spec.className = 'spec';
      const head = document.createElement('div'); head.className = 'spec__head'; head.textContent = title; spec.appendChild(head);
      states.forEach(([st, opt, colors]) => {
        const row = document.createElement('div'); row.className = 'spec__row';
        const a = document.createElement('div'); a.className = 'spec__state'; a.textContent = st; row.appendChild(a);
        const b = document.createElement('div'); b.className = 'spec__sample';
        const grp = document.createElement('div'); grp.className = 'tabs tabs--horiz';
        const tab = makeTab(Object.assign({ orient: 'horiz', size: 'm', standalone: false }, opt));
        if (opt._hover) tab.classList.add('is-hover');
        grp.appendChild(tab); b.appendChild(grp); row.appendChild(b);
        const c = document.createElement('div'); c.className = 'spec__colors';
        c.innerHTML = colors.map(cc => cline(cc[0], cc[1], cc[2], cc[3])).join(''); row.appendChild(c);
        spec.appendChild(row);
      });
      return spec;
    }

    const host = document.getElementById('state-specs');
    host.appendChild(buildSpec('Unselected', unselected));
    host.appendChild(buildSpec('Selected', selected));
    host.appendChild(buildSpec('Disabled', disabledRow));
    probe.remove();
  })();

  /* ============================ BADGE BEHAVIOUR ============================ */
  (function () {
    // grouping demo: 1 / 2 / 4 digits
    const g = document.getElementById('badge-grid');
    const cols = [['M', 'm'], ['S', 's']];
    g.appendChild(document.createElement('div'));
    cols.forEach(([nm]) => { const h = document.createElement('div'); h.className = 'col-head'; h.textContent = nm; g.appendChild(h); });
    const rows = [['Один знак', 9], ['Два знака', 99], ['Четыре знака', 9999]];
    rows.forEach(([rl, val]) => {
      const rh = document.createElement('div'); rh.className = 'row-head'; rh.textContent = rl; g.appendChild(rh);
      cols.forEach(([, sz]) => {
        const c = document.createElement('div'); c.className = 'cell';
        c.appendChild(makeTab({ size: sz, label: 'Text', badge: val, state: 'default' })); g.appendChild(c);
      });
    });

    // alignment: horiz badge hugs text, vert badge to the right edge
    const ah = document.getElementById('badge-align-h');
    const hg = makeGroup('horiz', [{ label: 'Сделки', badge: 1234, state: 'selected' }, { label: 'Архив', badge: 8 }]);
    wireTablist(hg); ah.appendChild(hg);

    const av = document.getElementById('badge-align-v');
    av.style.minWidth = '240px';
    const vg = makeGroup('vert', [{ label: 'Сделки', badge: 1234, state: 'selected' }, { label: 'Архив', badge: 8 }]);
    wireTablist(vg); av.appendChild(vg);
  })();

  /* ============================ ICON / LEADING ============================ */
  (function () {
    const host = document.getElementById('leading-demo');
    const hg = makeGroup('horiz', [
      { label: 'Дашборд', icon: 'bar-chart', state: 'selected' },
      { label: 'Документы', icon: 'file', badge: 4 },
      { label: 'Команда', icon: 'user' },
      { label: 'Настройки', icon: 'settings' },
    ]);
    wireTablist(hg); host.appendChild(hg);

    const host2 = document.getElementById('leading-icononly');
    const hg2 = document.createElement('div'); hg2.className = 'tabs tabs--horiz';
    [['bar-chart', true], ['pie-chart', false], ['list-view-01', false], ['layout-grid-01', false]].forEach(([ic, sel]) => {
      const t = makeTab({ orient: 'horiz', size: 'm', label: '', icon: ic, state: sel ? 'selected' : 'default', standalone: false });
      t.querySelector('.tab__label').remove();
      t.style.padding = '0 14px';
      t.setAttribute('aria-label', ic);
      hg2.appendChild(t);
    });
    wireTablist(hg2); host2.appendChild(hg2);
  })();

  /* ============================ OVERFLOW: SCROLL + FIT/MENU ============================ */
  (function () {
    const overflowItems = [
      { label: 'Возможные сделки', state: 'selected' }, { label: 'Сделки ДИД' },
      { label: 'Сделки моего деска' }, { label: 'Мои сделки' }, { label: 'В архиве' },
      { label: 'Закрытые' }, { label: 'На согласовании' }, { label: 'Черновики' },
    ];

    // pattern A — horizontal scroll (рантайм сам обёрнёт в .tabs-scroll-wrap + стрелки, когда ряд шире контейнера)
    const host = document.getElementById('overflow-demo');
    const g = makeGroup('horiz', overflowItems);
    host.appendChild(g);
    wireTablist(g);

    // pattern B — fit + «⋯», та же разметка, форсируется data-tabs-overflow="menu"
    const hostFit = document.getElementById('overflow-fit');
    const gFit = makeGroup('horiz', overflowItems);
    gFit.setAttribute('data-tabs-overflow', 'menu');
    hostFit.appendChild(gFit);
    wireTablist(gFit);

    // truncation: a vert tab with a very long label
    const t = document.getElementById('overflow-trunc');
    t.style.maxWidth = '260px';
    const vg = makeGroup('vert', [
      { label: 'Основная информация по сделке и контрагенту', badge: 3, state: 'selected' },
      { label: 'Продукты' },
    ]);
    wireTablist(vg); t.appendChild(vg);
  })();

  /* ============================ FULL-WIDTH (equal) ============================ */
  (function () {
    const host = document.getElementById('fitted-demo');
    const g = document.createElement('div'); g.className = 'tabs tabs--horiz tabs--fill';
    g.setAttribute('role', 'tablist');
    [{ label: 'День', state: 'selected' }, { label: 'Неделя' }, { label: 'Месяц' }, { label: 'Год' }].forEach(o =>
      g.appendChild(makeTab(Object.assign({ orient: 'horiz', standalone: false }, o))));
    wireTablist(g); host.appendChild(g);
  })();

  /* ============================ TYPOGRAPHY ============================ */
  (function () {
    const rows = [
      ['M', 'm', 'Body M', '16 px / Regular'],
      ['S', 's', 'Body S', '14 px / Regular'],
    ];
    const tb = document.querySelector('#typo-table tbody');
    rows.forEach(r => {
      const tr = document.createElement('tr');
      const t0 = document.createElement('td'); t0.innerHTML = '<b>' + r[0] + '</b>';
      const t1 = document.createElement('td'); const g = document.createElement('div'); g.className = 'tabs tabs--horiz tabs--bare';
      g.appendChild(makeTab({ size: r[1], label: 'Text', state: 'selected', standalone: false })); t1.appendChild(g);
      const t2 = document.createElement('td'); t2.innerHTML = '<code class="tok">--type-body-' + r[1] + '</code>';
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

    // pair 1 — длина текста метки
    const g1 = makeGroup('horiz', [{ label: 'Обзор', state: 'selected' }, { label: 'История' }, { label: 'Документы' }]);
    document.getElementById('guide-good1').appendChild(g1);

    const g2bad = makeGroup('horiz', [
      { label: 'Перейти на страницу обзора сделки', state: 'selected' },
      { label: 'Открыть полную историю операций' },
    ]);
    document.getElementById('guide-bad1').appendChild(g2bad);

    // pair 2 — количество табов в группе
    const g3 = makeGroup('vert', [{ label: 'Сроки', badge: 6, state: 'selected' }, { label: 'Продукты', badge: 3 }]);
    g3.style.minWidth = '180px';
    document.getElementById('guide-good2').appendChild(g3);

    const g4 = document.createElement('div'); g4.className = 'tabs tabs--horiz';
    g4.appendChild(makeTab({ orient: 'horiz', label: 'Единственный раздел', state: 'selected', standalone: false }));
    document.getElementById('guide-bad2').appendChild(g4);

    // solo — без пары «не так», отдельная рекомендация про бейдж
    const g5 = makeGroup('horiz', [{ label: 'Сделки', badge: 128, state: 'selected' }, { label: 'Архив', badge: 6 }]);
    document.getElementById('guide-good3').appendChild(g5);
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
      { name: 'Unselected', rows: [
        ['Текст', '--text-secondary'], ['Иконка', '--text-secondary'],
        ['Hover fill', '--primary-bg'], ['Рейл', '--border-light'],
      ] },
      { name: 'Selected', rows: [
        ['Индикатор', '--primary'], ['Текст', '--text-primary'],
        ['Hover fill', '--primary-bg'],
      ] },
      { name: 'Disabled', rows: [
        ['Текст', '--st-disabled-dark'], ['Иконка', '--st-disabled'], ['Бейдж', '--st-disabled-midlight'],
      ] },
      { name: 'Бейдж', rows: [
        ['Фон', '--st-system-midlight'], ['Текст', '--text-primary'],
      ] },
    ];
    document.getElementById('color-ref').innerHTML = groups.map(g => `
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

  /* ============================ ACCESSIBILITY DEMO ============================ */
  (function () {
    const host = document.getElementById('a11y-demo');
    if (!host) return;
    const g = makeGroup('horiz', [
      { label: 'Обзор', state: 'selected' }, { label: 'История' }, { label: 'Документы', badge: 3 },
    ]);
    wireTablist(g); host.appendChild(g);
  })();

  /* ============================ DEV SPEC TABLE (measured, not hardcoded) ============================ */
  (function () {
    const tbody = document.querySelector('#dev-spec-table');
    if (!tbody) return;

    function measure(size) {
      const host = document.createElement('div');
      host.style.cssText = 'position:absolute; left:-9999px; top:0; visibility:hidden;';
      const g = document.createElement('div'); g.className = 'tabs tabs--horiz';
      const t = makeTab({ size, label: 'Текст', icon: 'bar-chart', badge: 9, state: 'selected', standalone: false });
      g.appendChild(t); host.appendChild(g);
      document.body.appendChild(host);

      const cs = getComputedStyle(t);
      const csAfter = getComputedStyle(t, '::after');
      const iconEl = t.querySelector('.tab__icon');
      const badgeEl = t.querySelector('.tab__badge');
      const csIcon = iconEl ? getComputedStyle(iconEl) : null;
      const csBadge = badgeEl ? getComputedStyle(badgeEl) : null;

      const data = {
        height: Math.round(parseFloat(cs.height)),
        padX: Math.round(parseFloat(cs.paddingLeft)),
        gap: Math.round(parseFloat(cs.columnGap || cs.gap)),
        icon: csIcon ? Math.round(parseFloat(csIcon.width)) : null,
        indicator: Math.round(parseFloat(csAfter.height)),
        badgeMin: csBadge ? Math.round(parseFloat(csBadge.minWidth)) : null,
        fontSize: Math.round(parseFloat(cs.fontSize)),
        lineHeight: Math.round(parseFloat(cs.lineHeight)),
      };
      host.remove();
      return data;
    }

    const d = { m: measure('m'), s: measure('s') };
    const rows = [
      ['Высота таба', sz => d[sz].height + ' px'],
      ['Паддинг по X', sz => d[sz].padX + ' px'],
      ['Зазор (иконка / текст / бейдж)', sz => d[sz].gap + ' px'],
      ['Иконка', sz => d[sz].icon + ' px'],
      ['Толщина индикатора', sz => d[sz].indicator + ' px'],
      ['Бейдж — min-width', sz => d[sz].badgeMin + ' px'],
      ['Типографика (кегль / строка)', sz => d[sz].fontSize + ' / ' + d[sz].lineHeight + ' px'],
    ];
    tbody.innerHTML = rows.map(([label, fn]) =>
      `<div class="tbl__row" style="grid-template-columns:8px 1.84fr 0.55fr 0.55fr 8px;"><div class="tc tc--separator"></div><div class="tc"><span class="tc__row"><span class="tc__text">${label}</span></span></div><div class="tc tc--numbers"><span class="tc__row"><span class="tc__text">${fn('m')}</span></span></div><div class="tc tc--numbers"><span class="tc__row"><span class="tc__text">${fn('s')}</span></span></div><div class="tc tc--separator"></div></div>`
    ).join('');
  })();

})();
