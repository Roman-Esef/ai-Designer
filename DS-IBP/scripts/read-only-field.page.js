/* =========================================================================
   ReadOnlyField — documentation page logic
   ========================================================================= */
(function () {
  const L = window.DS_ICONS || {};
  const icon = (n) => L[n] || '';

  /* ============================ tiny floating-tip helpers ============================
     Mirrors the interaction pattern from Tooltip.html (tooltip.page.js): a
     `.tip.tip--floating` positioned inside the nearest `position:relative`
     ancestor, shown after a short hover delay and removed on leave. Reused
     here for (a) overflow tooltips on truncated values and (b) the
     copy-to-clipboard confirmation toast. */
  function makeFloatingTip(text, opts = {}) {
    const { type = 'main', multiline = false } = opts;
    const el = document.createElement('span');
    el.className = 'tip tip--' + type + ' tip--top tip--center tip--floating';
    if (multiline) { el.classList.add('tip--multiline'); el.style.maxWidth = '260px'; }
    el.appendChild(document.createTextNode(text));
    const arrow = document.createElement('span'); arrow.className = 'tip__arrow';
    el.appendChild(arrow);
    /* Тултип живёт в <body> и позиционируется fixed относительно цели: строка
       значения слишком низкая, чтобы вместить тултип НАД иконкой внутри себя —
       раньше он прижимался к верху строки, перекрывал иконку и мигал (курсор
       уходил с цели). pointer-events:none — курсор всегда остаётся на цели. */
    el.style.position = 'fixed';
    el.style.pointerEvents = 'none';
    el.style.zIndex = '1000';
    return el;
  }
  /* По центру НАД целью с зазором 8px; если сверху не помещается — переворот
     вниз; по горизонтали прижимается к границам вьюпорта. */
  function positionTipAbove(container, tip, target) {
    const tr = target.getBoundingClientRect();
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    let left = tr.left + tr.width / 2 - tw / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - tw - 8));
    let top = tr.top - th - 8;
    if (top < 8) { top = tr.bottom + 8; tip.classList.remove('tip--top'); tip.classList.add('tip--bottom'); }
    tip.style.left = Math.round(left) + 'px';
    tip.style.top = Math.round(top) + 'px';
  }
  /* getText: string, or a function re-evaluated on every hover (used to only
     show the tip when the value is actually overflowing at that moment). */
  function hoverTip(container, target, getText, opts = {}) {
    let tip = null, timer = null;
    function show() {
      const text = typeof getText === 'function' ? getText() : getText;
      if (!text) return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        tip = makeFloatingTip(text, opts);
        document.body.appendChild(tip);
        positionTipAbove(container, tip, target);
        window.addEventListener('scroll', hide, true);
        void tip.offsetHeight; // reflow вместо rAF: кадры могут быть заморожены в фоновой вкладке
        tip.classList.add('is-visible');
      }, 280);
    }
    function hide() {
      clearTimeout(timer);
      window.removeEventListener('scroll', hide, true);
      if (tip) { tip.remove(); tip = null; }
    }
    target.addEventListener('mouseenter', show);
    target.addEventListener('mouseleave', hide);
    target.addEventListener('focus', show);
    target.addEventListener('blur', hide);
  }
  function flashTip(container, target, text, ms = 1300) {
    const tip = makeFloatingTip(text, { type: 'main' });
    document.body.appendChild(tip);
    positionTipAbove(container, tip, target);
    void tip.offsetHeight;
    tip.classList.add('is-visible');
    setTimeout(() => {
      tip.classList.remove('is-visible');
      setTimeout(() => tip.remove(), 160);
    }, ms);
  }

  /* ============================ label / helper (local, ds-label / ds-helper) ============================ */
  function makeROFLabel(text) {
    const root = document.createElement('span'); root.className = 'ds-label';
    const t = document.createElement('span'); t.className = 'ds-label__text'; t.textContent = text;
    root.appendChild(t); return root;
  }
  function makeROFHelper(text, align, status) {
    const el = document.createElement('span');
    el.className = 'ds-helper ds-helper--' + (align === 'right' ? 'right' : 'left') + (status === 'error' ? ' ds-helper--error' : '');
    el.textContent = text;
    return el;
  }
  function chipReadonly(text) {
    const el = document.createElement('span'); el.className = 'chip chip--xs';
    const lb = document.createElement('span'); lb.className = 'chip__label'; lb.textContent = text;
    el.appendChild(lb); return el;
  }

  /* Prefix / postfix are meant to be a single short symbol or abbreviation
     (currency, unit, ≈, №). If misconfigured with a long phrase, the affix
     must not stretch or wrap the row — it truncates with an ellipsis and, on
     hover, reveals the full text via the same floating-tip pattern used for
     the value. `row` is the positioned ancestor tooltips are anchored to. */
  function makeAffix(text, row) {
    const el = document.createElement('span'); el.className = 'rof__affix'; el.textContent = text;
    hoverTip(row, el, () => (el.scrollWidth > el.clientWidth + 1 ? text : null), { multiline: true });
    return el;
  }

  /* Collapses a wrapping .chiplist down to `maxRows` visible rows, replacing
     any further chips with a trailing outline «+N» counter chip. Reused for
     the chips value type when it must stay within a fixed number of lines
     (e.g. a table cell or a compact card slot) — otherwise chips are left to
     wrap onto as many rows as needed, which is the default, expected
     behaviour (not an overflow bug). Runs after layout (see caller), since
     offsetTop is meaningless on a detached / unpainted node. */
  function collapseChipRows(list, maxRows, tipContainer) {
    if (!maxRows) return;
    const chips = Array.from(list.children);
    if (chips.length < 2) return;
    const tops = [];
    chips.forEach((c) => {
      const t = Math.round(c.offsetTop);
      if (!tops.some((rt) => Math.abs(rt - t) < 2)) tops.push(t);
    });
    tops.sort((a, b) => a - b);
    if (tops.length <= maxRows) return; // already fits within the row budget
    const limitTop = tops[maxRows - 1];
    let visibleCount = chips.filter((c) => c.offsetTop <= limitTop + 2).length;

    const more = document.createElement('span');
    more.className = 'chip chip--xs chip--outline';
    more.tabIndex = 0;
    const lb = document.createElement('span'); lb.className = 'chip__label';
    more.appendChild(lb);

    // «+N» must not hide information silently — hovering (or focusing) it
    // reveals the names of every chip currently folded away
    hoverTip(tipContainer || list, more, () => {
      const hiddenNames = chips.slice(visibleCount)
        .map((c) => { const l = c.querySelector('.chip__label'); return l ? l.textContent : ''; })
        .filter(Boolean);
      return hiddenNames.length ? hiddenNames.join(', ') : null;
    }, { multiline: true });

    let guard = 0;
    function place() {
      guard++;
      chips.forEach((c, i) => { c.style.display = i < visibleCount ? '' : 'none'; });
      if (more.parentNode) more.remove();
      const hidden = chips.length - visibleCount;
      if (hidden <= 0) return;
      lb.textContent = '+' + hidden;
      list.appendChild(more);
      // if the counter chip itself spilled onto a new row, free up room by
      // hiding one more real chip and try again (bounded to avoid loops)
      if (more.offsetTop > limitTop + 2 && visibleCount > 0 && guard < 30) {
        visibleCount--;
        place();
      }
    }
    place();
  }

  /* ============================ ReadOnlyField factory ============================
     o: {
       label, showLabel, helper, helperStatus:'default'|'error',
       type:'text'|'chips'|'link', value, chips:[...], chipsMaxRows:null|1|2, linkHref,
       iconLeft:null|<any icon key> — purely decorative, any glyph from the icon set,
       prefix, postfix — short text; auto-truncates with a tooltip if too long,
       iconRight:null|<any icon key>, iconRightAction:'none'|'copy'|'tooltip',
       iconRightTone:'neutral'|'warning' (colour when action='tooltip'), iconRightTip,
       tone:'default'|'positive'|'negative'|'empty',
       clampMode:'none'|'1'|'2'|'3', align:'left'|'right', state:'default'|'loading'
     } */
  function makeROF(o = {}) {
    const {
      label = 'Атрибут', showLabel = true, helper = null, helperStatus = 'default',
      type = 'text', value = 'Значение', chips = ['Text', 'Text', 'Text'], chipsMaxRows = null, linkHref = '#',
      iconLeft = null, prefix = null, postfix = null,
      iconRight = null, iconRightAction = 'none', iconRightTone = 'neutral', iconRightTip = null,
      tone = 'default', clampMode = 'none', align = 'left', state = 'default',
    } = o;

    const root = document.createElement('div');
    root.className = 'rof' + (align === 'right' ? ' rof--align-right' : '') + (tone === 'empty' ? ' rof--empty' : '');

    if (state === 'loading') {
      if (showLabel) { const s = document.createElement('span'); s.className = 'sk-line sk-line--caption'; s.style.setProperty('--sk-w', '64px'); root.appendChild(s); }
      const s2 = document.createElement('span'); s2.className = 'sk-line'; s2.style.setProperty('--sk-w', (140 + Math.random() * 80 | 0) + 'px'); root.appendChild(s2);
      return root;
    }

    if (showLabel && label) root.appendChild(makeROFLabel(label));

    const row = document.createElement('div');
    row.className = 'rof__row' + ((clampMode === '2' || clampMode === '3') ? ' rof__row--top' : '');

    if (iconLeft) {
      const ic = document.createElement('span'); ic.className = 'rof__icon'; ic.innerHTML = icon(iconLeft);
      row.appendChild(ic);
    }
    if (prefix) row.appendChild(makeAffix(prefix, row));

    let valueEl, fullText = '';
    if (tone === 'empty') {
      valueEl = document.createElement('span'); valueEl.className = 'rof__value rof__value--muted'; valueEl.textContent = '—';
    } else if (type === 'chips') {
      valueEl = document.createElement('div'); valueEl.className = 'rof__value rof__value--chips';
      const list = document.createElement('div'); list.className = 'chiplist chiplist--s';
      chips.forEach((t) => list.appendChild(chipReadonly(t)));
      valueEl.appendChild(list);
      // deferred to next frame: the row must already be attached to the
      // document for offsetTop-based row measurement to mean anything
      if (chipsMaxRows) requestAnimationFrame(() => collapseChipRows(list, chipsMaxRows, row));
    } else if (type === 'link') {
      valueEl = document.createElement('a'); valueEl.className = 'rof__value link link--accent link--m';
      valueEl.href = linkHref; valueEl.textContent = value; fullText = value;
      if (clampMode === '1') valueEl.classList.add('rof__value--clamp-1');
    } else {
      valueEl = document.createElement('span'); valueEl.className = 'rof__value'; valueEl.textContent = value; fullText = value;
      if (tone === 'positive') valueEl.classList.add('rof__value--positive');
      if (tone === 'negative') valueEl.classList.add('rof__value--negative');
      if (clampMode === '1') valueEl.classList.add('rof__value--clamp-1');
      if (clampMode === '2' || clampMode === '3') { valueEl.classList.add('rof__value--clamp-n'); valueEl.style.setProperty('--rof-clamp', clampMode); }
    }
    row.appendChild(valueEl);

    if (postfix) row.appendChild(makeAffix(postfix, row));

    // icon-right glyph is free choice (any icon in the set) — the *behaviour*
    // is a separate switch: copy-to-clipboard, an informational tooltip, or
    // purely decorative (no interaction at all)
    if (iconRight) {
      const ic = document.createElement('span'); ic.innerHTML = icon(iconRight);
      if (iconRightAction === 'copy') {
        ic.className = 'rof__icon rof__icon--interactive';
        ic.setAttribute('role', 'button'); ic.tabIndex = 0;
        ic.setAttribute('aria-label', 'Скопировать значение');
        ic.addEventListener('click', () => {
          if (window.DSCopy) window.DSCopy.write(fullText || value); else try { navigator.clipboard && navigator.clipboard.writeText(fullText || value); } catch (e) { /* no-op in sandbox */ }
          const original = ic.innerHTML;
          ic.innerHTML = icon('check'); ic.classList.add('is-done');
          if (window.DSCopy) window.DSCopy.flash(ic, 'Скопировано'); else flashTip(row, ic, 'Скопировано');
          setTimeout(() => { ic.innerHTML = original; ic.classList.remove('is-done'); }, 1300);
        });
      } else if (iconRightAction === 'tooltip') {
        ic.className = 'rof__icon' + (iconRightTone === 'warning' ? ' rof__icon--warning' : '');
        ic.tabIndex = 0;
        if (iconRightTip) hoverTip(row, ic, iconRightTip, { type: iconRightTone === 'warning' ? 'error' : 'main' });
      } else {
        ic.className = 'rof__icon';
      }
      row.appendChild(ic);
    }

    root.appendChild(row);

    if ((clampMode === '1' || clampMode === '2' || clampMode === '3') && fullText) {
      hoverTip(row, valueEl, () => {
        const overflowing = valueEl.scrollWidth > valueEl.clientWidth + 1 || valueEl.scrollHeight > valueEl.clientHeight + 1;
        return overflowing ? fullText : null;
      }, { multiline: true });
    }

    if (helper) root.appendChild(makeROFHelper(helper, align === 'right' ? 'right' : 'left', helperStatus));

    return root;
  }

  window.ROF = { makeROF, chipReadonly, hoverTip, flashTip, makeROFLabel, makeROFHelper };

  /* ============================ PLAYGROUND ============================ */
  (function () {
    const ICON_CHOICES = [
      ['none', 'Нет'], ['search', 'Search'], ['info-circle', 'Info'],
      ['calendar-check-01', 'Calendar'], ['file-check', 'File check'], ['check-shield', 'Shield'],
      ['link-external', 'External link'], ['copy', 'Copy'], ['alert-triangle-filled', 'Warning'],
      ['check-circle', 'Check circle'], ['edit', 'Edit'], ['arrow-right', 'Arrow right'], ['chevron-right', 'Chevron right'],
    ];
    const state = {
      type: 'text', label: true, helper: false, align: 'left',
      iconLeft: 'none', prefixText: '', postfixText: '',
      iconRight: 'none', iconRightAction: 'none', iconRightTone: 'neutral', iconRightTipText: 'Значение требует внимания',
      tone: 'default', clamp: 'none', chipRows: 'none', loadState: 'default',
    };
    const controls = document.getElementById('pg-controls');
    const preview = document.getElementById('pg-preview');
    const codeEl = document.getElementById('pg-code');

    /* --- controls are the DS's own SegmentControl (xs, fullwidth) --- */
    const segSyncs = [];
    function seg(label, options, getCur, onPick, span) {
      const wrap = document.createElement('div'); wrap.className = 'ctl' + (span ? ' ctl--span' : '');
      const l = document.createElement('div'); l.className = 'lbl'; l.textContent = label; wrap.appendChild(l);
      const rail = document.createElement('div');
      rail.className = 'segctrl segctrl--xs segctrl--fullwidth';
      rail.setAttribute('role', 'radiogroup'); rail.setAttribute('aria-label', label);
      const thumb = document.createElement('div'); thumb.className = 'segctrl__thumb'; rail.appendChild(thumb);
      const btns = options.map(([val, txt]) => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'segctrl__item';
        b.setAttribute('role', 'radio'); b.dataset.val = val;
        b.innerHTML = '<span class="segctrl__label">' + txt + '</span>';
        b.addEventListener('click', () => { if (getCur() === val) return; onPick(val); render(); });
        rail.appendChild(b); return b;
      });
      function sync() {
        if (wrap.classList.contains('is-off')) return;
        const cur = getCur();
        let sel = null;
        btns.forEach(b => { const on = b.dataset.val === cur; b.setAttribute('aria-checked', String(on)); if (on) sel = b; });
        if (sel && sel.offsetWidth) {
          thumb.style.width = sel.offsetWidth + 'px';
          thumb.style.transform = 'translateX(' + sel.offsetLeft + 'px)';
          thumb.classList.add('is-visible');
        }
      }
      segSyncs.push(sync);
      wrap.appendChild(rail); return wrap;
    }
    function textInput(label, getCur, onChange, placeholder) {
      const wrap = document.createElement('div'); wrap.className = 'ctl';
      const l = document.createElement('div'); l.className = 'lbl'; l.textContent = label; wrap.appendChild(l);
      const inp = document.createElement('input'); inp.type = 'text'; inp.className = 'pg-text';
      inp.value = getCur(); inp.maxLength = 24; if (placeholder) inp.placeholder = placeholder;
      inp.addEventListener('input', () => { onChange(inp.value); render(); });
      wrap.appendChild(inp); return wrap;
    }
    /* --- icon picker: tappable glyph swatches instead of a name-only dropdown --- */
    const NONE_GLYPH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="8.2"></circle><line x1="6.6" y1="17.4" x2="17.4" y2="6.6"></line></svg>';
    function iconPick(label, getCur, onPick) {
      const wrap = document.createElement('div'); wrap.className = 'ctl ctl--span';
      const l = document.createElement('div'); l.className = 'lbl'; l.textContent = label; wrap.appendChild(l);
      const grid = document.createElement('div'); grid.className = 'icnpick';
      grid.setAttribute('role', 'radiogroup'); grid.setAttribute('aria-label', label);
      const btns = ICON_CHOICES.map(([val, txt]) => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'icnpick__btn';
        b.setAttribute('role', 'radio'); b.dataset.val = val;
        b.title = txt; b.setAttribute('aria-label', txt);
        b.innerHTML = val === 'none' ? NONE_GLYPH : icon(val);
        b.addEventListener('click', () => { onPick(val); sync(); render(); });
        grid.appendChild(b); return b;
      });
      function sync() { const cur = getCur(); btns.forEach(b => b.setAttribute('aria-checked', String(b.dataset.val === cur))); }
      sync();
      wrap.appendChild(grid); return wrap;
    }
    function groupHead(text) {
      const h = document.createElement('div'); h.className = 'pg__grouphead'; h.textContent = text; return h;
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

    /* --- Состояние --- */
    controls.appendChild(groupHead('Состояние'));
    const loadCtl = seg('Состояние', [['default', 'Обычное'], ['loading', 'Загрузка']], () => state.loadState, v => state.loadState = v);
    controls.appendChild(loadCtl);

    /* --- Значение --- */
    controls.appendChild(groupHead('Значение'));
    const typeCtl = seg('Тип значения', [['text', 'Текст'], ['chips', 'Чипы'], ['link', 'Ссылка']], () => state.type, v => state.type = v);
    controls.appendChild(typeCtl);
    controls.appendChild(seg('Выравнивание', [['left', 'Слева'], ['right', 'Справа']], () => state.align, v => state.align = v));
    const toneCtl = seg('Цвет значения', [['default', 'Default'], ['positive', 'Positive'], ['negative', 'Negative'], ['empty', 'Empty']], () => state.tone, v => state.tone = v, true);
    controls.appendChild(toneCtl);
    const clampCtl = seg('Обрезание текста (строк)', [['none', 'Нет'], ['1', '1'], ['2', '2'], ['3', '3']], () => state.clamp, v => state.clamp = v);
    controls.appendChild(clampCtl);
    const chipRowsCtl = seg('Ряды чипов', [['none', 'Перенос'], ['1', '1 ряд'], ['2', '2 ряда']], () => state.chipRows, v => state.chipRows = v);
    controls.appendChild(chipRowsCtl);

    controls.appendChild(ctlToggle('Label', 'label'));
    controls.appendChild(ctlToggle('Helper', 'helper'));

    /* --- Обрамление слева --- */
    controls.appendChild(groupHead('Обрамление'));
    const prefixCtl = textInput('Префикс', () => state.prefixText, v => state.prefixText = v, 'напр. ≈');
    controls.appendChild(prefixCtl);
    const postfixCtl = textInput('Постфикс', () => state.postfixText, v => state.postfixText = v, 'напр. ₽');
    controls.appendChild(postfixCtl);
    controls.appendChild(iconPick('Иконка слева', () => state.iconLeft, v => state.iconLeft = v));

    /* --- Иконка справа --- */
    controls.appendChild(groupHead('Иконка справа'));
    controls.appendChild(iconPick('Иконка справа', () => state.iconRight, v => state.iconRight = v));
    const iconActionCtl = seg('Действие по иконке', [['none', 'Нет'], ['copy', 'Копировать'], ['tooltip', 'Тултип']], () => state.iconRightAction, v => state.iconRightAction = v);
    controls.appendChild(iconActionCtl);
    const iconToneCtl = seg('Цвет иконки', [['neutral', 'Neutral'], ['warning', 'Warning']], () => state.iconRightTone, v => state.iconRightTone = v);
    controls.appendChild(iconToneCtl);
    const iconTipCtl = textInput('Текст тултипа', () => state.iconRightTipText, v => state.iconRightTipText = v);
    controls.appendChild(iconTipCtl);

    const LONG_TEXT = 'Очень длинное значение атрибута, которое не помещается в одну строку и должно обрезаться';
    const CHIP_SET = ['Договор', 'Поставка', 'Опт', 'Крупный клиент', 'VIP', 'Новый регион'];

    function render() {
      preview.innerHTML = '';
      const isLoading = state.loadState === 'loading';
      const isChips = state.type === 'chips';
      const isText = state.type === 'text';
      /* цвет значения — только у текста; аффиксы — не у чипов */
      const tone = isText ? state.tone : 'default';
      const prefix = isChips ? null : (state.prefixText || null);
      const postfix = isChips ? null : (state.postfixText || null);
      const useClamp = !isChips ? state.clamp : 'none';
      const hasIconRight = state.iconRight !== 'none';
      typeCtl.classList.toggle('is-off', isLoading);
      toneCtl.classList.toggle('is-off', !isText || isLoading);
      prefixCtl.classList.toggle('is-off', isChips || isLoading);
      postfixCtl.classList.toggle('is-off', isChips || isLoading);
      clampCtl.classList.toggle('is-off', isChips || isLoading);
      chipRowsCtl.classList.toggle('is-off', !isChips || isLoading);
      iconActionCtl.classList.toggle('is-off', !hasIconRight || isLoading);
      iconToneCtl.classList.toggle('is-off', !hasIconRight || state.iconRightAction !== 'tooltip' || isLoading);
      iconTipCtl.classList.toggle('is-off', !hasIconRight || state.iconRightAction !== 'tooltip' || isLoading);
      const o = {
        type: state.type,
        value: useClamp !== 'none' ? LONG_TEXT : (state.type === 'link' ? 'ссылка-на-документ.pdf' : 'Значение атрибута'),
        chips: CHIP_SET, chipsMaxRows: isChips && state.chipRows !== 'none' ? Number(state.chipRows) : null,
        showLabel: state.label, label: 'Название поля',
        helper: state.helper ? (tone === 'empty' ? 'Данные ещё не загружены' : 'Пояснение к значению') : null,
        iconLeft: state.iconLeft === 'none' ? null : state.iconLeft,
        prefix: prefix,
        postfix: postfix,
        iconRight: hasIconRight ? state.iconRight : null,
        iconRightAction: state.iconRightAction,
        iconRightTone: state.iconRightTone,
        iconRightTip: state.iconRightTipText,
        tone: tone, clampMode: useClamp, align: state.align, state: isLoading ? 'loading' : 'default',
      };
      preview.appendChild(makeROF(o));

      const parts = ['type=' + state.type];
      if (tone !== 'default') parts.push('tone=' + tone);
      if (state.iconLeft !== 'none') parts.push('iconLeft=' + state.iconLeft);
      if (prefix) parts.push('prefix="' + prefix + '"');
      if (postfix) parts.push('postfix="' + postfix + '"');
      if (hasIconRight) { parts.push('iconRight=' + state.iconRight); if (state.iconRightAction !== 'none') parts.push('iconRightAction=' + state.iconRightAction); }
      if (useClamp !== 'none') parts.push('clamp=' + useClamp);
      if (isChips && state.chipRows !== 'none') parts.push('chipsMaxRows=' + state.chipRows);
      if (state.align !== 'left') parts.push('align=right');
      if (!state.label) parts.push('label=false');
      if (state.helper) parts.push('helper');
      codeEl.innerHTML = '<code>&lt;ReadOnlyField ' + parts.join(' ') + ' /&gt;</code>';
      requestAnimationFrame(() => segSyncs.forEach(fn => fn()));
    }
    window.addEventListener('resize', () => segSyncs.forEach(fn => fn()));
    render();

    /* --- splitter: user-resizable controls/preview widths --- */
    (function () {
      const splitter = document.getElementById('pg-splitter');
      const panel = controls.closest('.panel.pg');
      if (!splitter || !panel) return;
      const DEFAULT_W = 360, MIN_STAGE = 240, MIN_CONTROLS = 280;
      const SPL_W = splitter.getBoundingClientRect().width || 11;
      function setStageW(w) {
        const max = panel.getBoundingClientRect().width - MIN_CONTROLS - SPL_W;
        panel.style.setProperty('--pg-stage-w', Math.round(Math.min(Math.max(w, MIN_STAGE), Math.max(max, MIN_STAGE))) + 'px');
      }
      function stageW() {
        return parseFloat(getComputedStyle(panel).getPropertyValue('--pg-stage-w')) || DEFAULT_W;
      }
      splitter.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        splitter.setPointerCapture(e.pointerId);
        splitter.classList.add('spl--move');
        document.body.classList.add('spl-dragging');
        const startX = e.clientX, startW = stageW();
        function onMove(ev) { setStageW(startW + (startX - ev.clientX)); }
        function onUp(ev) {
          splitter.classList.remove('spl--move');
          document.body.classList.remove('spl-dragging');
          splitter.removeEventListener('pointermove', onMove);
          splitter.removeEventListener('pointerup', onUp);
          splitter.removeEventListener('pointercancel', onUp);
        }
        splitter.addEventListener('pointermove', onMove);
        splitter.addEventListener('pointerup', onUp);
        splitter.addEventListener('pointercancel', onUp);
      });
      splitter.addEventListener('dblclick', () => { panel.style.removeProperty('--pg-stage-w'); });
      splitter.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') { setStageW(stageW() + 24); e.preventDefault(); }
        else if (e.key === 'ArrowRight') { setStageW(stageW() - 24); e.preventDefault(); }
        else if (e.key === 'Home') { panel.style.removeProperty('--pg-stage-w'); e.preventDefault(); }
      });
      /* controls grid: 1 колонка по умолчанию → 2 колонки, когда панель расширена */
      const ro = new ResizeObserver(() => {
        controls.classList.toggle('pg__controls--wide', controls.clientWidth >= 640);
        segSyncs.forEach(fn => fn());
      });
      ro.observe(controls);
    })();
  })();

  /* ============================ USAGE (composition in a card) ============================ */
  (function () {
    const cardA = document.getElementById('use-card-a');
    if (cardA) {
      cardA.append(
        makeROF({ label: 'Внешняя АС', value: 'ЕКС' }),
        makeROF({ label: 'ID во внешней АС', value: '123456789012', clampMode: '1', iconRight: 'copy', iconRightAction: 'copy' }),
        makeROF({ label: 'ВМ', value: '5,666666666', postfix: '%' }),
        makeROF({ label: 'Статус', type: 'chips', chips: ['Договор', 'Поставка'] }),
      );
    }
    const cardB = document.getElementById('use-card-b');
    if (cardB) {
      cardB.append(
        makeROF({ label: 'Ближайший платёж', value: '1 000 000,00', postfix: 'USD', tone: 'positive' }),
        makeROF({ label: 'Дата платежа', value: '22.02.2023', iconRight: 'alert-triangle-filled', iconRightAction: 'tooltip', iconRightTone: 'warning', iconRightTip: 'Платёж просрочен на 4 дня' }),
      );
      const wide = document.createElement('div'); wide.style.gridColumn = '1 / -1';
      wide.appendChild(makeROF({ label: 'Комментарий', value: 'Платёж включён в план реструктуризации задолженности, согласован казначейством и финансовым департаментом контрагента', clampMode: '2' }));
      cardB.appendChild(wide);
    }
  })();

  /* ============================ ANATOMY ============================ */
  (function () {
    const stage = document.getElementById('anat-stage');
    if (stage) {
      stage.appendChild(makeROF({
        label: 'Название поля', helper: 'Пояснение к значению',
        iconLeft: 'search', prefix: 'Pref', value: 'Значение', postfix: 'Postf',
        iconRight: 'alert-triangle-filled', iconRightAction: 'tooltip', iconRightTone: 'warning', iconRightTip: 'Комментарий к значению',
      }));
    }
  })();

  /* ============================ TYPES matrix ============================ */
  (function () {
    const rows = [
      ['Текст', 'text-default', 'text-full'],
      ['Чипы', 'chips-default', 'chips-full'],
      ['Ссылка', 'link-default', 'link-full'],
    ];
    const defaults = {
      'text-default': () => makeROF({ label: 'Label', value: 'Text' }),
      'text-full': () => makeROF({ label: 'Label', value: 'Text', helper: 'Helper', iconLeft: 'search', prefix: 'Pref', postfix: 'Postf', iconRight: 'alert-triangle-filled', iconRightAction: 'tooltip', iconRightTone: 'warning', iconRightTip: 'Комментарий' }),
      'chips-default': () => makeROF({ label: 'Label', type: 'chips', chips: ['Text', 'Text', 'Text'] }),
      'chips-full': () => makeROF({ label: 'Label', type: 'chips', chips: ['Text', 'Text', 'Text'], helper: 'Helper', iconLeft: 'search', iconRight: 'alert-triangle-filled', iconRightAction: 'tooltip', iconRightTone: 'warning', iconRightTip: 'Комментарий' }),
      'link-default': () => makeROF({ label: 'Label', type: 'link', value: 'Link' }),
      'link-full': () => makeROF({ label: 'Label', type: 'link', value: 'Link', helper: 'Helper', iconLeft: 'search', prefix: 'Pref', postfix: 'Postf', iconRight: 'alert-triangle-filled', iconRightAction: 'tooltip', iconRightTone: 'warning', iconRightTip: 'Комментарий' }),
    };
    const host = document.getElementById('types-matrix');
    if (host) {
      rows.forEach(([name, a, b]) => {
        const rh = document.createElement('div'); rh.className = 'tm-row-head'; rh.textContent = name; host.appendChild(rh);
        const c1 = document.createElement('div'); c1.className = 'tm-cell'; c1.appendChild(defaults[a]()); host.appendChild(c1);
        const c2 = document.createElement('div'); c2.className = 'tm-cell'; c2.appendChild(defaults[b]()); host.appendChild(c2);
      });
    }
  })();

  /* ============================ OPTIONS (independent slots) ============================ */
  (function () {
    const host = document.getElementById('option-tiles');
    if (!host) return;
    const tiles = [
      ['Icon-left · любая иконка', 'Глиф не зафиксирован — любая иконка из библиотеки, если она несёт смысл — источник, категорию, тип данных. Не интерактивна.', makeROF({ label: 'Внешняя АС', value: 'ЕКС', iconLeft: 'search' })],
      ['Prefix / Postfix', 'Короткий текст вокруг значения — аббревиатура, единица измерения, валюта (см. правила ниже).', makeROF({ label: 'Курс', prefix: '≈', value: '92,4', postfix: '₽/$' })],
      ['Icon-right · copy', 'Клик копирует значение в буфер обмена и на 1,3 с показывает подтверждение.', makeROF({ label: 'ID во внешней АС', value: '123456789012', iconRight: 'copy', iconRightAction: 'copy' })],
      ['Icon-right · tooltip', 'Индикатор требует внимания — при наведении показывает тултип с пояснением. Глиф и цвет (neutral/warning) настраиваются отдельно от действия.', makeROF({ label: 'Дата платежа', value: '22.02.2023', iconRight: 'alert-triangle-filled', iconRightAction: 'tooltip', iconRightTone: 'warning', iconRightTip: 'Платёж просрочен на 4 дня' })],
      ['Аффикс: слишком длинный текст', 'Если в префикс/постфикс попал слишком длинный текст — он обрезается многоточием и на наведении показывает полный текст в тултипе — вместо того чтобы растягивать строку.', makeROF({ label: 'Курс', prefix: 'Приблизительный курс на сегодня', value: '92,4' })],
      ['Без Label', 'Лейбл можно скрыть, если контекст и так понятен (например, в компактной таблице).', makeROF({ showLabel: false, value: 'Значение без подписи' })],
      ['Align · right', 'Правое выравнивание — для числовых и денежных значений в колонке.', makeROF({ label: 'Сумма сделки', value: '120 000', postfix: '₽', align: 'right' })],
    ];
    tiles.forEach(([name, desc, node]) => {
      const t = document.createElement('div'); t.className = 'slot-tile';
      const n = document.createElement('div'); n.className = 'slot-tile__name'; n.textContent = name; t.appendChild(n);
      const d = document.createElement('div'); d.className = 'slot-tile__demo'; d.appendChild(node); t.appendChild(d);
      const p = document.createElement('div'); p.className = 'slot-tile__desc'; p.textContent = desc; t.appendChild(p);
      host.appendChild(t);
    });
  })();

  /* ============================ OVERFLOW & MULTILINE ============================ */
  (function () {
    const LONG = 'Формула на базе EBITDA и Net Debt, применяется при расчёте цены исполнения опциона на конец отчётного периода';
    const one = document.getElementById('overflow-1');
    if (one) { one.style.maxWidth = '260px'; one.appendChild(makeROF({ label: 'Способ определения цены', value: LONG, clampMode: '1' })); }
    const two = document.getElementById('overflow-2');
    if (two) { two.style.maxWidth = '260px'; two.appendChild(makeROF({ label: 'Способ определения цены', value: LONG, clampMode: '2' })); }
    const three = document.getElementById('overflow-3');
    if (three) { three.style.maxWidth = '260px'; three.appendChild(makeROF({ label: 'Способ определения цены', value: LONG, clampMode: '3' })); }
    const flow = document.getElementById('overflow-flow');
    if (flow) { flow.style.maxWidth = '260px'; flow.appendChild(makeROF({ label: 'Способ определения цены', value: LONG })); }
  })();

  /* ============================ CHIPS — wrap & overflow ============================ */
  (function () {
    const CHIP_SET = ['Договор', 'Поставка', 'Опт', 'Крупный клиент', 'VIP', 'Новый регион', 'Экспорт'];
    const wrap = document.getElementById('chips-wrap-demo');
    if (wrap) { wrap.style.maxWidth = '220px'; wrap.appendChild(makeROF({ label: 'Категории', type: 'chips', chips: CHIP_SET })); }
    const c1 = document.getElementById('chips-collapse-1');
    if (c1) { c1.style.maxWidth = '220px'; c1.appendChild(makeROF({ label: 'Категории', type: 'chips', chips: CHIP_SET, chipsMaxRows: 1 })); }
    const c2 = document.getElementById('chips-collapse-2');
    if (c2) { c2.style.maxWidth = '220px'; c2.appendChild(makeROF({ label: 'Категории', type: 'chips', chips: CHIP_SET, chipsMaxRows: 2 })); }
  })();

  /* ============================ VALUE COLOR ============================ */
  (function () {
    const host = document.getElementById('tone-demo');
    if (!host) return;
    host.append(
      makeROF({ label: 'Последняя оценка', value: '1 234 567,89', postfix: 'RUB' }),
      makeROF({ label: 'Δ Переоценки', value: '+300 000', postfix: 'RUB', tone: 'positive' }),
      makeROF({ label: 'Δ Переоценки', value: '-100 000', postfix: 'RUB', tone: 'negative' }),
    );
  })();

  /* ============================ STATES ============================ */
  (function () {
    const host = document.getElementById('state-tiles');
    if (!host) return;
    const tiles = [
      ['Default', 'Значение получено и отображается как есть.', makeROF({ label: 'ИНН контрагента', value: '7719000000' })],
      ['Empty', 'Данные ещё не заполнены или недоступны — показываем «—» приглушённым цветом вместо пустоты.', makeROF({ label: 'ИНН контрагента', tone: 'empty' })],
      ['Loading', 'Данные запрошены у внешней системы — на месте значения и (опционально) лейбла показываем шиммер-плейсхолдер.', makeROF({ label: 'ИНН контрагента', state: 'loading' })],
    ];
    tiles.forEach(([name, desc, node]) => {
      const t = document.createElement('div'); t.className = 'slot-tile';
      const n = document.createElement('div'); n.className = 'slot-tile__name'; n.textContent = name; t.appendChild(n);
      const d = document.createElement('div'); d.className = 'slot-tile__demo'; d.appendChild(node); t.appendChild(d);
      const p = document.createElement('div'); p.className = 'slot-tile__desc'; p.textContent = desc; t.appendChild(p);
      host.appendChild(t);
    });
  })();

  /* ============================ TYPOGRAPHY ============================ */
  (function () {
    const rows = [
      ['Label', '--type-body-xs', 'SB Sans Text', '12 / 16', '--text-secondary'],
      ['Значение', '--type-body-m', 'SB Sans Text', '16 / 20', '--text-primary'],
      ['Helper', '--type-body-xs', 'SB Sans Text', '12 / 16', '--text-inactive'],
    ];
    const tb = document.querySelector('#typo-table tbody');
    if (!tb) return;
    tb.innerHTML = rows.map(r => `<tr><td><b>${r[0]}</b></td><td><code class="tok">${r[1]}</code></td><td>${r[2]}</td><td class="rt-num">${r[3]}</td><td><code class="tok">${r[4]}</code></td></tr>`).join('');
  })();

  /* ============================ GUIDELINES ============================ */
  (function () {
    const BAD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    const GOOD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>';
    ['ic-bad1', 'ic-bad2', 'ic-bad3'].forEach(id => { const e = document.getElementById(id); if (e) e.innerHTML = BAD; });
    ['ic-good1', 'ic-good2', 'ic-good3'].forEach(id => { const e = document.getElementById(id); if (e) e.innerHTML = GOOD; });

    const good1 = document.getElementById('guide-good1');
    if (good1) good1.appendChild(makeROF({ label: 'ИНН контрагента', value: '7719000000' }));
    const bad1 = document.getElementById('guide-bad1');
    if (bad1) {
      const wrap = document.createElement('div'); wrap.className = 'field-mock'; wrap.style.width = '220px';
      wrap.appendChild(makeROFLabel('ИНН контрагента'));
      const box = document.createElement('div'); box.className = 'field-mock__box is-disabled'; box.textContent = '7719000000'; wrap.appendChild(box);
      bad1.appendChild(wrap);
    }

    /* пример читается только в узкой колонке карточки: там обрезка до 2 строк
       и свободный поток дают разную высоту поля и разное положение соседа */
    const DELIVERY = 'Курьером в течение дня по указанному адресу и в согласованный с получателем интервал, кроме выходных и праздничных дней';
    function deliveryCard(clamp) {
      const w = document.createElement('div');
      w.style.cssText = 'width:224px;display:grid;gap:14px;';
      w.append(
        makeROF(clamp ? { label: 'Способ доставки', value: DELIVERY, clampMode: '2' } : { label: 'Способ доставки', value: DELIVERY }),
        makeROF({ label: 'Стоимость доставки', value: '1 200', postfix: '₽' }),
      );
      return w;
    }
    const good2 = document.getElementById('guide-good2');
    if (good2) good2.appendChild(deliveryCard(true));
    const bad2 = document.getElementById('guide-bad2');
    if (bad2) bad2.appendChild(deliveryCard(false));

    const good3 = document.getElementById('guide-good3');
    if (good3) good3.appendChild(makeROF({ label: 'Дата платежа', value: '22.02.2023', iconRight: 'alert-triangle-filled', iconRightAction: 'tooltip', iconRightTone: 'warning', iconRightTip: 'Платёж просрочен на 4 дня' }));
    const bad3 = document.getElementById('guide-bad3');
    if (bad3) {
      const fakeBtn = makeROF({ label: 'Действие', value: 'Отправить в архив' });
      fakeBtn.querySelector('.rof__value').style.cssText = 'color:var(--primary); font-weight:600; cursor:pointer; text-decoration:underline;';
      bad3.appendChild(fakeBtn);
    }
  })();

  /* ============================ PREFIX / POSTFIX RULES ============================ */
  (function () {
    const BAD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    const GOOD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>';
    const icG = document.getElementById('ic-good-affix'); if (icG) icG.innerHTML = GOOD;
    const icB = document.getElementById('ic-bad-affix'); if (icB) icB.innerHTML = BAD;
    const good = document.getElementById('affix-good');
    if (good) good.appendChild(makeROF({ label: 'Курс', prefix: '≈', value: '92,4', postfix: '₽/$' }));
    const bad = document.getElementById('affix-bad');
    if (bad) bad.appendChild(makeROF({ label: 'Курс', prefix: 'Приблизительный курс на сегодня', value: '92,4' }));
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
      { name: 'Текст', rows: [['Label', '--text-secondary'], ['Значение', '--text-primary'], ['Helper', '--text-inactive'], ['Empty / Disabled', '--text-inactive']] },
      { name: 'Семантика значения', rows: [['Positive', '--success-dark'], ['Negative', '--error-dark'], ['Warning-иконка', '--warning'], ['Error helper', '--error']] },
      { name: 'Interactive icon', rows: [['Иконка по умолчанию', '--text-inactive'], ['Hover / Focus', '--text-secondary'], ['После копирования', '--success-dark']] },
      { name: 'Loading skeleton', rows: [['База', '--st-disabled-light'], ['Пик волны', '--st-disabled-midlight']] },
    ];
    const root = document.getElementById('color-ref');
    if (!root) return;
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

  /* ============================ SIZES + DEV SPEC — measured (getComputedStyle), not hardcoded ============================ */
  (function () {
    const sizeTbody = document.querySelector('#size-table');
    const devTbody = document.querySelector('#dev-spec-table');
    if (!sizeTbody && !devTbody) return;

    const host = document.createElement('div');
    host.style.cssText = 'position:absolute; left:-9999px; top:0; width:280px; visibility:hidden;';
    const field = makeROF({
      label: 'Название поля', helper: 'Пояснение к значению', value: 'Значение',
    });
    host.appendChild(field);
    const chipField = makeROF({ label: 'Категории', type: 'chips', chips: ['Договор'] });
    host.appendChild(chipField);
    document.body.appendChild(host);

    const labelEl = field.querySelector('.ds-label__text');
    const valueEl = field.querySelector('.rof__value');
    const helperEl = field.querySelector('.ds-helper');
    const rowEl = field.querySelector('.rof__row');
    const chipEl = chipField.querySelector('.chip');

    const csLabel = getComputedStyle(labelEl);
    const csValue = getComputedStyle(valueEl);
    const csHelper = getComputedStyle(helperEl);
    const csRof = getComputedStyle(field);
    const csChip = getComputedStyle(chipEl);

    const data = {
      labelSize: Math.round(parseFloat(csLabel.fontSize)),
      labelLh: Math.round(parseFloat(csLabel.lineHeight)),
      valueSize: Math.round(parseFloat(csValue.fontSize)),
      valueLh: Math.round(parseFloat(csValue.lineHeight)),
      helperSize: Math.round(parseFloat(csHelper.fontSize)),
      helperLh: Math.round(parseFloat(csHelper.lineHeight)),
      stackGap: Math.round(parseFloat(csRof.rowGap || csRof.gap)),
      rowGap: Math.round(parseFloat(getComputedStyle(rowEl).columnGap || getComputedStyle(rowEl).gap)),
      chipH: Math.round(parseFloat(csChip.height)),
    };
    host.remove();

    if (sizeTbody) {
      const rows = [
        ['Label', '--type-body-xs', data.labelSize + ' / ' + data.labelLh + ' px'],
        ['Значение (текст)', '--type-body-m', data.valueSize + ' / ' + data.valueLh + ' px'],
        ['Helper', '--type-body-xs', data.helperSize + ' / ' + data.helperLh + ' px'],
        ['Значение-чип (Chip XS)', 'chip--xs', data.chipH + ' px — высота'],
      ];
      sizeTbody.innerHTML = rows.map(r => `<div class="tbl__row" style="grid-template-columns:8px 1.84fr 0.68fr 1.08fr 8px;"><div class="tc tc--separator"></div><div class="tc"><span class="tc__row"><span class="tc__text">${r[0]}</span></span></div><div class="tc"><code>${r[1]}</code></div><div class="tc tc--numbers"><span class="tc__row"><span class="tc__text">${r[2]}</span></span></div><div class="tc tc--separator"></div></div>`).join('');
    }
    if (devTbody) {
      const rows = [
        ['Зазор label → row → helper', data.stackGap + ' px'],
        ['Зазор внутри строки значения (слоты)', data.rowGap + ' px'],
        ['Кегль / строка — Label', data.labelSize + ' / ' + data.labelLh + ' px'],
        ['Кегль / строка — Значение', data.valueSize + ' / ' + data.valueLh + ' px'],
        ['Кегль / строка — Helper', data.helperSize + ' / ' + data.helperLh + ' px'],
        ['Высота значения-чипа (Chip XS)', data.chipH + ' px'],
        ['Макс. длина префикса/постфикса', '12 ch'],
      ];
      devTbody.innerHTML = rows.map(r => `<div class="tbl__row" style="grid-template-columns:8px 1.84fr 0.81fr 8px;"><div class="tc tc--separator"></div><div class="tc"><span class="tc__row"><span class="tc__text">${r[0]}</span></span></div><div class="tc tc--numbers"><span class="tc__row"><span class="tc__text">${r[1]}</span></span></div><div class="tc tc--separator"></div></div>`).join('');
    }
  })();

})();
