/* =========================================================================
   Chip — documentation page logic
   ========================================================================= */
(function () {
  const L = window.DS_ICONS || {};
  const icon = (n) => L[n] || '';

  /* ---------- chip factory ----------
     o: {
       type:'edit'|'readonly', style:'fill'|'outline', size:'l'|'m'|'s'|'xs',
       tone:'system'|'success'|'info'|'warning'|'error'|'green'|'lblue'|'orange'|'red'|'dpurple'|'grey'|'primary'|'accent'|'dark',
       solid:bool — заливка base-тоном + белый текст (chip--<tone>-solid),
       label, leading:null|'marker'|'badge'|'avatar', leadingIcon, badgeText, avatarText,
       removable, dropdown, count, rounded, state:'default'|'selected'|'focus'|'loading'|'invalid',
       disabled, tooltip, maxWidth
     } */
  function makeChip(o = {}) {
    const {
      type = 'edit', style = 'fill', size = 's', tone = 'system',
      label = 'Text', leading = null, leadingIcon,
      avatarText = 'A', avatarContent = 'text', avatarIcon = null, avatarImgId = null,
      removable = false, dropdown = false, count = null, rounded = false, solid = false,
      state = 'default', disabled = false, tooltip = null, maxWidth = null,
    } = o;
    // marker defaults to a small status dot; a plain "icon" leading slot defaults to a pictographic glyph
    const resolvedLeadingIcon = leadingIcon || (leading === 'icon' ? 'star-filled' : 'circle-filled-small');

    const el = document.createElement('span');
    el.className = 'chip';
    el.classList.add('chip--' + type);
    if (style === 'outline') el.classList.add('chip--outline');
    el.classList.add('chip--' + size);
    if (tone && tone !== 'system') el.classList.add('chip--' + tone + (solid ? '-solid' : ''));
    if (rounded) el.classList.add('chip--rounded');
    if (state === 'selected') el.classList.add('chip--selected');
    if (state === 'focus') el.classList.add('chip--edit', 'is-focus');
    if (state === 'invalid') el.classList.add('chip--invalid');
    if (disabled) el.classList.add('chip--disabled');
    if (type === 'edit' && !disabled) el.tabIndex = 0;
    if (maxWidth) el.style.maxWidth = maxWidth + 'px';

    // leading slot
    if (state === 'loading') {
      const sp = document.createElement('span'); sp.className = 'spin'; el.appendChild(sp);
    } else if (state === 'selected') {
      const ic = document.createElement('span'); ic.className = 'chip__icon'; ic.innerHTML = icon('check'); el.appendChild(ic);
    } else if (leading === 'marker') {
      const m = document.createElement('span'); m.className = 'chip__marker'; m.innerHTML = icon(resolvedLeadingIcon); el.appendChild(m);
    } else if (leading === 'icon') {
      const ic = document.createElement('span'); ic.className = 'chip__marker'; ic.innerHTML = icon(resolvedLeadingIcon); el.appendChild(ic);
    } else if (leading === 'avatar') {
      // аватар = компонент Avatar (.av) с выбираемым содержимым: текст / иконка / фото
      const a = document.createElement('span'); a.className = 'chip__avatar av av--circular';
      if (avatarContent === 'icon') {
        a.innerHTML = '<span class="av__icon">' + (icon(avatarIcon || 'user') || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>') + '</span>';
      } else if (avatarContent === 'image') {
        a.innerHTML = '<span class="av__img"><image-slot' + (avatarImgId ? ' id="' + avatarImgId + '"' : '') + ' shape="circle" placeholder="Фото"></image-slot></span>';
      } else {
        a.innerHTML = '<span class="av__text">' + avatarText + '</span>';
      }
      el.appendChild(a);
    }

    // label
    const lb = document.createElement('span'); lb.className = 'chip__label'; lb.textContent = label; el.appendChild(lb);

    // counter
    if (count != null) {
      const c = document.createElement('span'); c.className = 'chip__count'; c.textContent = count; el.appendChild(c);
    }

    // trailing action
    if (dropdown) {
      const d = document.createElement('span'); d.className = 'chip__dropdown'; d.innerHTML = icon('chevron-down'); el.appendChild(d);
    }
    if (removable) {
      const r = document.createElement('span'); r.className = 'chip__remove'; r.setAttribute('role', 'button');
      r.setAttribute('aria-label', 'Удалить'); r.innerHTML = icon('close'); el.appendChild(r);
    }

    // tooltip on overflow / long text
    if (tooltip) { el.title = tooltip; if (disabled) el.classList.add('chip--has-tooltip'); }

    return el;
  }

  /* ============================ PLAYGROUND ============================ */
  (function () {
    const state = {
      type: 'edit', style: 'fill', size: 'm', tone: 'system', solid: false,
      leading: 'none', avatarContent: 'text', removable: true, dropdown: false, count: false, rounded: false, chipState: 'default',
    };
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
      box.appendChild(sel); wrap.appendChild(box); wrap._sel = sel; return wrap;
    }
    /* Бинарные опции — селекты: docs-split.js конвертирует их в свитчи ДС (урок Л4) */
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
      box.appendChild(sel); wrap.appendChild(box); wrap._sel = sel; return wrap;
    }

    controls.appendChild(select('Тип', [['edit', 'Edit'], ['readonly', 'ReadOnly']], () => state.type, v => state.type = v));
    controls.appendChild(select('Стиль', [['fill', 'Fill (Border + Fill)'], ['outline', 'Outline (Border)']], () => state.style, v => state.style = v));
    controls.appendChild(select('Размер', [['l', 'L · 40'], ['m', 'M · 32'], ['s', 'S · 24'], ['xs', 'XS · 20']], () => state.size, v => state.size = v));
    controls.appendChild(select('Тон', [['system', 'System'], ['success', 'Success'], ['info', 'Info'], ['warning', 'Warning'], ['error', 'Error'], ['green', 'Green'], ['lblue', 'LBlue'], ['orange', 'Orange'], ['red', 'Red'], ['dpurple', 'DPurple'], ['grey', 'Grey'], ['primary', 'Primary']], () => state.tone, v => state.tone = v));
    controls.appendChild(select('Дополнительный элемент', [['none', 'Нет'], ['marker', 'Маркер'], ['icon', 'Иконка'], ['avatar', 'Аватар']], () => state.leading, v => state.leading = v));
    const avatarCtl = select('Содержимое аватара', [['text', 'Текст'], ['icon', 'Иконка'], ['image', 'Фото']], () => state.avatarContent, v => state.avatarContent = v);
    controls.appendChild(avatarCtl);
    controls.appendChild(select('Состояние', [['default', 'Default'], ['selected', 'Selected'], ['focus', 'Focus'], ['loading', 'Loading'], ['invalid', 'Invalid'], ['disabled', 'Disabled']], () => state.chipState, v => state.chipState = v));

    const rmToggle = ctlToggle('Крестик удаления', 'removable');
    const ddToggle = ctlToggle('Выпадающий список', 'dropdown');
    // крестик и выпадающий список — взаимоисключаются
    rmToggle._sel.addEventListener('change', () => { if (state.removable && state.dropdown) { state.dropdown = false; ddToggle._sel.value = 'no'; render(); } });
    ddToggle._sel.addEventListener('change', () => { if (state.dropdown && state.removable) { state.removable = false; rmToggle._sel.value = 'no'; render(); } });
    controls.appendChild(rmToggle);
    controls.appendChild(ddToggle);
    controls.appendChild(ctlToggle('Счётчик', 'count'));
    controls.appendChild(ctlToggle('Rounded', 'rounded'));
    const solidCtl = ctlToggle('Solid', 'solid');
    controls.appendChild(solidCtl);

    function render() {
      const disabled = state.chipState === 'disabled';
      /* у ReadOnly-чипа крестика удаления не бывает — скрываем настройку */
      rmToggle.classList.toggle('is-off', state.type !== 'edit');
      /* содержимое аватара — только когда выбран аватар */
      avatarCtl.classList.toggle('is-off', state.leading !== 'avatar');
      /* solid — только у статусных тонов (у system solid нет) */
      solidCtl.classList.toggle('is-off', state.tone === 'system');
      const o = {
        type: state.type, style: state.style, size: state.size, tone: state.tone, solid: state.solid,
        label: 'Text', leading: state.leading === 'none' ? null : state.leading,
        avatarContent: state.avatarContent, avatarText: 'И', avatarImgId: 'chip-pg-av-img',
        removable: state.removable && state.type === 'edit',
        dropdown: state.dropdown, rounded: state.rounded,
        count: state.count ? '12' : null,
        state: disabled ? 'default' : state.chipState, disabled,
      };
      preview.innerHTML = '';
      const chip = makeChip(o);
      // live remove in playground
      const rm = chip.querySelector('.chip__remove');
      if (rm) rm.addEventListener('click', () => { chip.style.transition = 'opacity .2s, transform .2s'; chip.style.opacity = '0'; chip.style.transform = 'scale(.85)'; setTimeout(render, 220); });
      preview.appendChild(chip);

      const cls = ['chip', 'chip--' + state.type];
      if (state.style === 'outline') cls.push('chip--outline');
      cls.push('chip--' + state.size);
      if (state.tone !== 'system') cls.push('chip--' + state.tone + (state.solid ? '-solid' : ''));
      if (state.rounded) cls.push('chip--rounded');
      if (state.chipState === 'selected') cls.push('chip--selected');
      if (state.chipState === 'invalid') cls.push('chip--invalid');
      if (disabled) cls.push('chip--disabled');
      codeEl.innerHTML = '<code>&lt;span class="' + cls.join(' ') + '"&gt;…&lt;/span&gt;</code>';
    }
    render();
  })();

  /* ============================ USAGE ============================ */
  (function () {
    const filters = document.getElementById('use-filters');
    [['Москва', false], ['В работе', false], ['2024 год', false], ['Высокий приоритет', false]].forEach(([t]) =>
      filters.appendChild(makeChip({ type: 'edit', size: 's', label: t, removable: true })));

    const input = document.getElementById('use-input');
    ['Иван Белов', 'Мария Адамова', 'Виктор Б.'].forEach(t =>
      input.appendChild(makeChip({ type: 'edit', size: 's', label: t, leading: 'avatar', avatarText: t[0], removable: true })));
    const fld = document.createElement('span'); fld.className = 'input-mock__field'; fld.textContent = 'Добавить…'; input.appendChild(fld);

    const status = document.getElementById('use-status');
    [['Активна', 'success'], ['В работе', 'info'], ['Ожидает', 'warning'], ['Просрочена', 'error']].forEach(([t, tone]) =>
      status.appendChild(makeChip({ type: 'edit', size: 's', tone, label: t, leading: 'marker', rounded: true })));

    const ro = document.getElementById('use-readonly');
    ['Договор', 'Поставка', 'Опт'].forEach(t => {
      const c = makeChip({ type: 'readonly', size: 'xs', label: t });
      ro.appendChild(c);
    });
  })();

  /* ============================ ANATOMY ============================ */
  (function () {
    const d = document.getElementById('anat-diagram');
    const chip = makeChip({ type: 'edit', size: 'l', label: 'Текст метки', leading: 'marker', removable: true });
    chip.classList.add('big'); d.appendChild(chip);
    requestAnimationFrame(() => {
      const r = chip.getBoundingClientRect();
      const marks = [
        ['1', '50%', '-14px'],
        ['2', '14%', 'calc(100% + 14px)'],
        ['3', '50%', 'calc(100% + 14px)'],
        ['4', '90%', 'calc(100% + 14px)'],
      ];
      marks.forEach(([n, left, top]) => {
        const m = document.createElement('span'); m.className = 'mk'; m.textContent = n;
        m.style.left = left; m.style.top = top; d.appendChild(m);
      });
    });
  })();

  /* ============================ TYPES ============================ */
  (function () {
    const edit = document.getElementById('type-edit');
    [['M', 'm'], ['S', 's'], ['XS', 'xs']].forEach(([nm, sz]) => {
      const row = document.createElement('div');
      const lab = document.createElement('p'); lab.className = 'demo-rowlabel'; lab.textContent = nm; row.appendChild(lab);
      const list = document.createElement('div'); list.className = 'chiplist';
      list.appendChild(makeChip({ type: 'edit', size: sz, label: 'Text', removable: true }));
      list.appendChild(makeChip({ type: 'edit', style: 'outline', size: sz, label: 'Text', removable: true }));
      list.appendChild(makeChip({ type: 'edit', size: sz, label: 'Text' }));
      row.appendChild(list); edit.appendChild(row);
    });

    const ro = document.getElementById('type-readonly');
    [['L', 'l'], ['M', 'm'], ['S', 's'], ['XS', 'xs']].forEach(([nm, sz]) => {
      const row = document.createElement('div');
      const lab = document.createElement('p'); lab.className = 'demo-rowlabel'; lab.textContent = nm; row.appendChild(lab);
      const list = document.createElement('div'); list.className = 'chiplist';
      list.appendChild(makeChip({ type: 'readonly', size: sz, label: 'Text' }));
      list.appendChild(makeChip({ type: 'readonly', style: 'outline', size: sz, label: 'Text' }));
      row.appendChild(list); ro.appendChild(row);
    });
  })();

  /* ============================ STYLE ============================ */
  (function () {
    const fill = document.getElementById('style-fill');
    const outline = document.getElementById('style-outline');
    const variants = (style) => {
      const host = style === 'fill' ? fill : outline;
      host.appendChild(makeChip({ type: 'edit', style, size: 'm', label: 'Text' }));
      host.appendChild(makeChip({ type: 'edit', style, size: 'm', label: 'Маркер', leading: 'marker' }));
      host.appendChild(makeChip({ type: 'edit', style, size: 'm', label: 'Удаляемый', removable: true }));
      host.appendChild(makeChip({ type: 'edit', style, size: 'm', label: 'Список', dropdown: true }));
    };
    variants('fill'); variants('outline');
  })();

  /* ============================ SIZES ============================ */
  (function () {
    const g = document.getElementById('sizes-grid');
    const cols = [['L', 'l'], ['M', 'm'], ['S', 's'], ['XS', 'xs']];
    g.appendChild(document.createElement('div')); // empty corner
    cols.forEach(([nm]) => { const h = document.createElement('div'); h.className = 'col-head'; h.textContent = nm; g.appendChild(h); });

    const rows = [
      ['Текст', (sz) => makeChip({ type: 'edit', size: sz, label: 'Text' })],
      ['+ маркер', (sz) => makeChip({ type: 'edit', size: sz, label: 'Text', leading: 'marker' })],
      ['+ крестик', (sz) => makeChip({ type: 'edit', size: sz, label: 'Text', removable: true })],
    ];
    rows.forEach(([rl, build]) => {
      const rh = document.createElement('div'); rh.className = 'row-head'; rh.textContent = rl; g.appendChild(rh);
      cols.forEach(([, sz]) => { const c = document.createElement('div'); c.className = 'cell'; c.appendChild(build(sz)); g.appendChild(c); });
    });

    const tbl = [
      ['L', '40 px', 'Body M · 16/20', '20 px', '8 px', 'Крупный ReadOnly-показ (зарезервирован)'],
      ['M', '32 px', 'Body M · 16/20', '20 px', '8 px', 'Базовый: чиплисты, фильтры'],
      ['S', '24 px', 'Body S · 14/16', '16 px', '6 px', 'Компактные фильтры, InputAutocomplete'],
      ['XS', '20 px', 'Body XS · 12/16', '16 px', '6 px', 'Плотные таблицы, ReadOnlyField (значения-чипы)'],
    ];
    document.querySelector('#sizes-table').innerHTML = tbl.map(r =>
      `<div class="tbl__row" style="grid-template-columns:8px 0.45fr 0.6fr 1fr 0.6fr 0.7fr 1.6fr 8px;"><div class="tc tc--separator"></div><div class="tc"><span class="tc__row"><span class="tc__text"><b>${r[0]}</b></span></span></div><div class="tc tc--numbers"><span class="tc__row"><span class="tc__text">${r[1]}</span></span></div><div class="tc"><span class="tc__row"><span class="tc__text">${r[2]}</span></span></div><div class="tc tc--numbers"><span class="tc__row"><span class="tc__text">${r[3]}</span></span></div><div class="tc tc--numbers"><span class="tc__row"><span class="tc__text">${r[4]}</span></span></div><div class="tc"><span class="tc__row"><span class="tc__text">${r[5]}</span></span></div><div class="tc tc--separator"></div></div>`).join('');
  })();

  /* ============================ STATES (spec tables) ============================ */
  (function () {
    // color resolver
    const probe = document.createElement('span');
    probe.style.cssText = 'position:absolute;left:-9999px;width:0;height:0;';
    document.body.appendChild(probe);
    function resolveHex(token, pct) {
      let css = 'var(' + token + ')';
      if (pct != null) css = 'color-mix(in srgb, var(' + token + ') ' + pct + '%, transparent)';
      probe.style.backgroundColor = 'transparent'; probe.style.backgroundColor = css;
      const v = getComputedStyle(probe).backgroundColor;
      let r, g, b, a = 1, m = v.match(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)/i);
      if (m) { r = +m[1] * 255; g = +m[2] * 255; b = +m[3] * 255; if (m[4] !== undefined) a = +m[4]; }
      else { const n = v.match(/[\d.]+/g); if (!n) return css; r = +n[0]; g = +n[1]; b = +n[2]; if (n[3] !== undefined) a = +n[3]; }
      const hx = n => Math.round(n).toString(16).padStart(2, '0').toUpperCase();
      let s = '#' + hx(r) + hx(g) + hx(b); if (a < 1) s += ', ' + Math.round(a * 100) + '%'; return s;
    }

    // line: [role, token, displayName, raw]
    function cline(role, token, name, raw) {
      const hex = resolveHex(token);
      return `<div class="spec__cline"><b>${role}</b><span class="spec__sw" style="background:var(${token})"></span><span><span class="tnm">${name}</span></span><span class="raw">${raw} · ${hex}</span></div>`;
    }

    const fillStates = [
      ['Default', { type: 'edit', size: 'm', label: 'Text', removable: true }, [
        ['Border', '--st-system-light', 'StSystem_Light', 'Swamp_400, 16%'],
        ['Fill', '--st-system-light', 'StSystem_Light', 'Swamp_400, 16%'],
        ['Text', '--st-system-dark', 'StSystem_Dark', 'CGrey_600'],
        ['Icons', '--st-system', 'StSystem', 'Swamp_400'],
      ]],
      ['Hover', { type: 'edit', size: 'm', label: 'Text', removable: true, _hover: true }, [
        ['Border', '--st-system-light', 'StSystem_Light', 'Swamp_400, 16%'],
        ['Fill', '--st-system-midlight', 'StSystem_MidLight', 'Swamp_400, 32%'],
        ['Text', '--st-system-dark', 'StSystem_Dark', 'CGrey_600'],
        ['Icons', '--st-system', 'StSystem', 'Swamp_400'],
      ]],
      ['Disabled', { type: 'edit', size: 'm', label: 'Text', removable: true, disabled: true }, [
        ['Border', '--st-disabled-light', 'StDisabled_Light', 'CGrey_600, 4%'],
        ['Fill', '--st-disabled-light', 'StDisabled_Light', 'CGrey_600, 4%'],
        ['Text', '--st-disabled-dark', 'StDisabled_Dark', 'CGrey_600, 40%'],
        ['Icons', '--st-disabled', 'StDisabled', 'CGrey_600, 24%'],
      ]],
    ];
    const outlineStates = [
      ['Default', { type: 'edit', style: 'outline', size: 'm', label: 'Text', removable: true }, [
        ['Border', '--st-system-mid', 'StSystem_Mid', 'Swamp_400, 56%'],
        ['Text', '--st-system-dark', 'StSystem_Dark', 'CGrey_600'],
        ['Icons', '--st-system', 'StSystem', 'Swamp_400'],
      ]],
      ['Hover', { type: 'edit', style: 'outline', size: 'm', label: 'Text', removable: true, _hover: true }, [
        ['Border', '--st-system-mid', 'StSystem_Mid', 'Swamp_400, 56%'],
        ['Fill', '--st-system-midlight', 'StSystem_MidLight', 'Swamp_400, 32%'],
        ['Text', '--st-system-dark', 'StSystem_Dark', 'CGrey_600'],
        ['Icons', '--st-system', 'StSystem', 'Swamp_400'],
      ]],
      ['Disabled', { type: 'edit', style: 'outline', size: 'm', label: 'Text', removable: true, disabled: true }, [
        ['Border', '--st-disabled-mid', 'StDisabled_Mid', 'CGrey_600, 16%'],
        ['Text', '--st-disabled-dark', 'StDisabled_Dark', 'CGrey_600, 40%'],
        ['Icons', '--st-disabled', 'StDisabled', 'CGrey_600, 24%'],
      ]],
    ];

    function buildSpec(title, states) {
      const spec = document.createElement('div'); spec.className = 'spec';
      const head = document.createElement('div'); head.className = 'spec__head'; head.textContent = title; spec.appendChild(head);
      states.forEach(([st, opt, colors]) => {
        const row = document.createElement('div'); row.className = 'spec__row';
        const a = document.createElement('div'); a.className = 'spec__state'; a.textContent = st; row.appendChild(a);
        const b = document.createElement('div'); b.className = 'spec__sample';
        const chip = makeChip(opt); if (opt._hover) chip.classList.add('is-hover'); b.appendChild(chip); row.appendChild(b);
        const c = document.createElement('div'); c.className = 'spec__colors';
        c.innerHTML = colors.map(cc => cline(cc[0], cc[1], cc[2], cc[3])).join(''); row.appendChild(c);
        spec.appendChild(row);
      });
      return spec;
    }

    const host = document.getElementById('state-specs');
    host.appendChild(buildSpec('Border + Fill', fillStates));
    host.appendChild(buildSpec('Border', outlineStates));
    probe.remove();
  })();

  /* ============================ LEADING SLOTS ============================ */
  (function () {
    const host = document.getElementById('slot-tiles');
    const tiles = [
      ['.Chip_Content', 'Иконка-маркер слева. Размеры иконки: M — 20px, S / XS — 16px.', [
        makeChip({ type: 'edit', size: 'm', label: 'Text', leading: 'marker', removable: true }),
        makeChip({ type: 'edit', size: 'm', label: 'Text', leading: 'marker' }),
      ]],
      ['Иконка', 'Смысловая пиктограмма слева от текста — в отличие от маркера, не завязана на тон/статус. Те же размеры: M — 20px, S / XS — 16px.', [
        makeChip({ type: 'edit', size: 'm', label: 'Text', leading: 'icon', removable: true }),
        makeChip({ type: 'edit', size: 'm', label: 'Text', leading: 'icon' }),
      ]],
      ['Avatar', 'Ведущий аватар — компонент Avatar с выбираемым содержимым: текст-инициалы, иконка-фолбэк или фото. Бейдж как отдельный слот убран — он объединён с аватаром.', [
        makeChip({ type: 'edit', size: 'm', label: 'Иван Б.', leading: 'avatar', avatarText: 'И', removable: true }),
        makeChip({ type: 'edit', size: 'm', label: 'Бот', leading: 'avatar', avatarContent: 'icon' }),
        makeChip({ type: 'edit', size: 'm', label: 'Фото', leading: 'avatar', avatarContent: 'image', avatarImgId: 'chip-slot-av-img' }),
      ]],
      ['.Chip_Action', 'Завершающее действие: крестик удаления ИЛИ шеврон выпадающего списка — они взаимоисключающие, вместе не ставятся.', [
        makeChip({ type: 'edit', size: 'm', label: 'Удалить', removable: true }),
        makeChip({ type: 'edit', size: 'm', label: 'Список', dropdown: true }),
      ]],
    ];
    tiles.forEach(([name, desc, chips]) => {
      const t = document.createElement('div'); t.className = 'slot-tile';
      const n = document.createElement('div'); n.className = 'slot-tile__name'; n.textContent = name; t.appendChild(n);
      const d = document.createElement('div'); d.className = 'slot-tile__demo'; chips.forEach(c => d.appendChild(c)); t.appendChild(d);
      const p = document.createElement('div'); p.className = 'slot-tile__desc'; p.textContent = desc; t.appendChild(p);
      host.appendChild(t);
    });
  })();

  /* ============================ TONES ============================ */
  (function () {
    const g = document.getElementById('tone-grid');
    const STATUS_TONES = [
      ['success', 'Success', 'Положительный статус: активна, в сети, оплачено'],
      ['info', 'Info', 'Информационный статус: в работе, новое'],
      ['warning', 'Warning', 'Требует внимания: ожидает, на проверке'],
      ['error', 'Error', 'Ошибка: просрочено, отклонено, заблокировано'],
      ['green', 'Green', 'Тональный (просто цвет): зелёный — маркер категории'],
      ['lblue', 'LBlue', 'Тональный (просто цвет): голубой — маркер категории'],
      ['orange', 'Orange', 'Тональный (просто цвет): оранжевый — маркер категории'],
      ['red', 'Red', 'Тональный (просто цвет): красный — маркер категории'],
      ['dpurple', 'DPurple', 'Тональный (просто цвет): фиолетовый — маркер категории'],
      ['grey', 'Grey', 'Тональный (просто цвет): серый — маркер категории'],
      ['primary', 'Primary', 'Тональный (просто цвет): изумрудный — маркер категории'],
    ];
    // system — не статусный тон (нет solid); показываем отдельно
    const sc = document.createElement('div'); sc.className = 'tone-cell';
    sc.appendChild(makeChip({ type: 'edit', size: 'm', tone: 'system', label: 'System', leading: 'marker', removable: true }));
    const sn = document.createElement('div'); sn.className = 'nm'; sn.textContent = 'System'; sc.appendChild(sn);
    const sr = document.createElement('div'); sr.className = 'rl'; sr.textContent = 'Нейтральный тег / маркер без статусной окраски'; sc.appendChild(sr);
    g.appendChild(sc);

    STATUS_TONES.forEach(([tone, nm, rl]) => {
      const c = document.createElement('div'); c.className = 'tone-cell';
      c.appendChild(makeChip({ type: 'edit', size: 'm', tone, label: nm, leading: 'marker', rounded: true }));
      c.appendChild(makeChip({ type: 'edit', size: 'm', tone, label: nm, leading: 'marker', rounded: true, solid: true }));
      const n = document.createElement('div'); n.className = 'nm'; n.textContent = nm; c.appendChild(n);
      const r = document.createElement('div'); r.className = 'rl'; r.textContent = rl + ' · solid-заливка — тот же тон свитчом `-solid`'; c.appendChild(r);
      g.appendChild(c);
    });
  })();

  /* ============================ REMOVABLE (interactive) ============================ */
  (function () {
    const host = document.getElementById('removable-demo');
    const statusEl = document.getElementById('removable-status');
    const data = ['Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург', 'Казань'];
    function update() { statusEl.textContent = 'Осталось чипов: ' + host.querySelectorAll('.chip').length; }
    function build() {
      host.innerHTML = '';
      data.forEach(t => {
        const chip = makeChip({ type: 'edit', size: 'm', label: t, removable: true });
        const remove = () => {
          chip.style.transition = 'opacity .18s, transform .18s, margin .18s';
          chip.style.opacity = '0'; chip.style.transform = 'scale(.85)';
          setTimeout(() => { chip.remove(); update(); }, 180);
        };
        chip.querySelector('.chip__remove').addEventListener('click', remove);
        chip.addEventListener('keydown', (e) => { if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); remove(); } });
        host.appendChild(chip);
      });
      update();
    }
    build();
    // reset chip
    const reset = makeChip({ type: 'edit', style: 'outline', size: 'm', label: 'Сбросить все', leading: 'marker', leadingIcon: 'filter-reset' });
    reset.style.cursor = 'pointer';
    reset.addEventListener('click', build);
    host.parentElement.appendChild(reset);
  })();

  /* ============================ OVERFLOW ============================ */
  (function () {
    const d = document.getElementById('overflow-demo');
    const long = 'Очень длинное название параметра фильтрации, которое не помещается';
    d.appendChild(makeChip({ type: 'edit', size: 'm', label: long, removable: true, tooltip: long, maxWidth: 320 }));
    d.appendChild(makeChip({ type: 'edit', size: 'm', label: long, disabled: true, tooltip: long, maxWidth: 320 }));

    const list = document.getElementById('overflow-list');
    ['Москва', 'СПб', 'Новосибирск', 'Казань'].forEach(t => list.appendChild(makeChip({ type: 'edit', size: 's', label: t, removable: true })));
    const more = makeChip({ type: 'edit', style: 'outline', size: 's', label: '+5', dropdown: true });
    more.style.cursor = 'pointer'; list.appendChild(more);
  })();

  /* ============================ ROUNDED ============================ */
  (function () {
    const off = document.getElementById('rounded-off');
    const on = document.getElementById('rounded-on');
    [['marker', 'Маркер'], [null, 'Text'], ['avatar', 'Аватар']].forEach(([lead, lbl]) => {
      off.appendChild(makeChip({ type: 'edit', size: 'm', label: lbl, leading: lead, avatarText: 'А', removable: true }));
      on.appendChild(makeChip({ type: 'edit', size: 'm', label: lbl, leading: lead, avatarText: 'А', removable: true, rounded: true }));
    });
  })();

  /* ============================ PROPOSALS ============================ */
  (function () {
    const host = document.getElementById('proposals');
    const props = [
      ['Свёртка «+N»', 'Переполнение чиплиста сворачивается в чип-счётчик, открывающий полный список. Требует измерения ширины на уровне чиплиста (JS) — пока не реализовано.', [
        makeChip({ type: 'edit', style: 'outline', size: 'm', label: '+5', dropdown: true }),
      ]],
    ];
    props.forEach(([name, desc, chips]) => {
      const p = document.createElement('div'); p.className = 'prop';
      const demo = document.createElement('div'); demo.className = 'pdemo'; chips.forEach(c => demo.appendChild(c)); p.appendChild(demo);
      const n = document.createElement('div'); n.className = 'pname'; n.textContent = name; p.appendChild(n);
      const d = document.createElement('div'); d.className = 'pdesc'; d.textContent = desc; p.appendChild(d);
      host.appendChild(p);
    });
  })();

  /* ============================ TYPOGRAPHY ============================ */
  (function () {
    const rows = [
      ['L', 'l', 'Body M', '16 px / Regular'],
      ['M', 'm', 'Body M', '16 px / Regular'],
      ['S', 's', 'Body S', '14 px / Regular'],
      ['XS', 'xs', 'Body XS', '12 px / Regular'],
    ];
    const tb = document.querySelector('#typo-table tbody');
    rows.forEach(r => {
      const tr = document.createElement('tr');
      const t0 = document.createElement('td'); t0.innerHTML = '<b>' + r[0] + '</b>';
      const t1 = document.createElement('td'); t1.appendChild(makeChip({ type: 'edit', size: r[1], label: 'Text' }));
      const t2 = document.createElement('td'); t2.innerHTML = '<code class="tok">--type-body-' + (r[1] === 'l' || r[1] === 'm' ? 'm' : r[1]) + '</code>';
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
    document.getElementById('ic-bad3').innerHTML = BAD;
    document.getElementById('ic-good1').innerHTML = GOOD;
    document.getElementById('ic-good2').innerHTML = GOOD;
    document.getElementById('ic-good3').innerHTML = GOOD;

    document.getElementById('guide-good1').appendChild(makeChip({ type: 'edit', size: 'm', label: 'Москва', removable: true }));
    document.getElementById('guide-good1').appendChild(makeChip({ type: 'edit', size: 'm', label: 'Очень длинное название…', tooltip: 'Очень длинное название параметра', maxWidth: 180 }));

    document.getElementById('guide-bad1').appendChild(makeChip({ type: 'edit', size: 'm', label: 'Нажмите сюда, чтобы применить все выбранные фильтры', removable: true }));

    document.getElementById('guide-good2').appendChild(makeChip({ type: 'edit', size: 'm', tone: 'success', label: 'Активна', leading: 'marker', rounded: true }));
    document.getElementById('guide-good2').appendChild(makeChip({ type: 'edit', size: 'm', label: 'Тег', removable: true }));

    const fakeBtn = makeChip({ type: 'edit', size: 'm', tone: 'accent', label: 'Сохранить' });
    fakeBtn.style.cssText += 'background:var(--primary);color:var(--text-on-dark);border-color:var(--primary);';
    document.getElementById('guide-bad2').appendChild(fakeBtn);

    document.getElementById('guide-good3').appendChild(makeChip({ type: 'edit', size: 'm', tone: 'success', label: 'Активна', leading: 'marker', rounded: true }));
    document.getElementById('guide-good3').appendChild(makeChip({ type: 'edit', size: 'm', tone: 'info', label: 'В работе', leading: 'marker', rounded: true }));

    document.getElementById('guide-bad3').appendChild(makeChip({ type: 'edit', size: 'm', tone: 'success', label: 'Активна', leading: 'marker' }));
    document.getElementById('guide-bad3').appendChild(makeChip({ type: 'edit', size: 'm', tone: 'info', label: 'В работе', leading: 'marker' }));
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
      { name: 'System (база)', rows: [
        ['Fill / Border', '--st-system-light'], ['Fill hover', '--st-system-midlight'],
        ['Border outline', '--st-system-mid'], ['Текст', '--st-system-dark'], ['Иконки', '--st-system'],
      ] },
      { name: 'Disabled', rows: [
        ['Fill / Border', '--st-disabled-light'], ['Border outline', '--st-disabled-mid'],
        ['Текст', '--st-disabled-dark'], ['Иконки', '--st-disabled'],
      ] },
      { name: 'Статусы — фон (Light)', rows: [
        ['System', '--st-system-light'],
        ['Primary (accent)', '--st-primary-light'], ['Green (success)', '--st-green-light'], ['LBlue (info)', '--st-lblue-light'],
        ['Orange (warning)', '--st-orange-light'], ['Red (error)', '--st-red-light'], ['DPurple', '--st-dpurple-light'], ['Grey (dark)', '--st-grey-light'],
      ] },
      { name: 'Статусы — текст (Dark)', rows: [
        ['System', '--st-system-dark'],
        ['Primary (accent)', '--st-primary-dark'], ['Green (success)', '--st-green-dark'], ['LBlue (info)', '--st-lblue-dark'],
        ['Orange (warning)', '--st-orange-dark'], ['Red (error)', '--st-red-dark'], ['DPurple', '--st-dpurple-dark'], ['Grey (dark)', '--st-grey-dark'],
      ] },
      { name: 'Solid — заливка (base) · белый текст', rows: [
        ['Primary (accent)', '--st-primary'], ['Green (success)', '--st-green'], ['LBlue (info)', '--st-lblue'],
        ['Orange (warning)', '--st-orange'], ['Red (error)', '--st-red'], ['DPurple', '--st-dpurple'], ['Grey (dark)', '--st-grey'],
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

  /* ============================ A11Y FOCUS DEMO ============================ */
  (function () {
    const host = document.getElementById('a11y-focus-demo');
    if (!host) return;
    ['Москва', 'Санкт-Петербург'].forEach(t => host.appendChild(makeChip({ type: 'edit', size: 'm', label: t, removable: true })));
  })();

  /* ============================ DEV: redline measured from live component ============================ */
  (function () {
    const tbody = document.querySelector('#dev-spec-table');
    if (!tbody) return;
    const host = document.createElement('div');
    host.style.cssText = 'position:absolute;left:-9999px;top:0;';
    document.body.appendChild(host);
    function measure(sz, opts) {
      const chip = makeChip(Object.assign({ type: 'edit', size: sz, label: 'Text' }, opts || {}));
      host.appendChild(chip);
      const cs = getComputedStyle(chip);
      const icon = chip.querySelector('.chip__marker, .chip__icon');
      return {
        h: cs.height,
        padX: cs.paddingLeft,
        gap: cs.columnGap,
        radius: cs.borderTopLeftRadius,
        font: cs.fontSize,
        icon: icon ? getComputedStyle(icon).width : null,
      };
    }
    const d = { l: measure('l', { leading: 'marker' }), m: measure('m', { leading: 'marker' }), s: measure('s', { leading: 'marker' }), xs: measure('xs', { leading: 'marker' }) };
    host.remove();
    const r = n => Math.round(n * 10) / 10;
    const px = v => { const n = parseFloat(v); return isNaN(n) ? v : r(n) + ' px'; };
    const rows = [
      ['Высота', z => px(d[z].h)],
      ['Паддинг X', z => px(d[z].padX)],
      ['Зазор между слотами', z => px(d[z].gap)],
      ['Радиус (Default)', z => px(d[z].radius)],
      ['Иконка/маркер', z => d[z].icon ? px(d[z].icon) : '—'],
      ['Кегль текста', z => px(d[z].font)],
    ];
    tbody.innerHTML = rows.map(([label, fn]) =>
      `<div class="tbl__row" style="grid-template-columns:8px 1.4fr 0.55fr 0.55fr 0.55fr 0.55fr 8px;"><div class="tc tc--separator"></div><div class="tc"><span class="tc__row"><span class="tc__text">${label}</span></span></div><div class="tc tc--numbers"><span class="tc__row"><span class="tc__text">${fn('l')}</span></span></div><div class="tc tc--numbers"><span class="tc__row"><span class="tc__text">${fn('m')}</span></span></div><div class="tc tc--numbers"><span class="tc__row"><span class="tc__text">${fn('s')}</span></span></div><div class="tc tc--numbers"><span class="tc__row"><span class="tc__text">${fn('xs')}</span></span></div><div class="tc tc--separator"></div></div>`
    ).join('');
  })();

})();
