/* =========================================================================
   SubTab — documentation page logic
   ========================================================================= */
(function () {

  /* размер ряда → размер плашки счётчика. Счётчик здесь настоящий атом Badge,
     поэтому габариты ему меняет размерный класс САМОГО Badge, а не потомковое
     правило из sub-tab.css: переопределять чужой компонент извне запрещено. */
  const BADGE_SIZE = { m: 'badge--xs', s: 'badge--xxs', xs: 'badge--xxs' };
  const BADGE_DEFAULT = BADGE_SIZE.s;

  /* ---------- factory ----------
     o: {
       items: [{ label, badge, disabled, _hover, _selected }],
       selected: 0, label: 'aria-label',
       size: 'm' | 's' | 'xs',   // по умолчанию s, как в CSS компонента
       static: false   // true — не оживлять рантаймом (ряды состояний в витрине)
     }
     Счётчик — реальный атом Badge, вариант --neutral: светлая плашка с тёмным
     текстом читается и на светлом треке, и на акцентной заливке выбранного.  */
  function makeSubTabs(o = {}) {
    const { items = [], selected = 0, label = null, size = 's' } = o;

    const host = document.createElement('div');
    host.className = 'subtabs subtabs--' + size;
    host.setAttribute('role', 'tablist');
    if (label) host.setAttribute('aria-label', label);

    items.forEach((it, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'subtab';
      b.setAttribute('role', 'tab');
      const isSel = it._selected != null ? !!it._selected : i === selected;
      b.setAttribute('aria-selected', String(isSel));
      /* отключённый таб остаётся в разметке с aria-disabled, а не нативным
         disabled — иначе он выпадает из roving-порядка (инвариант Tab) */
      if (it.disabled) b.setAttribute('aria-disabled', 'true');
      b.tabIndex = isSel && !it.disabled ? 0 : -1;

      const lb = document.createElement('span');
      lb.className = 'subtab__label';
      lb.textContent = it.label;
      b.appendChild(lb);

      if (it.badge != null) {
        const bd = document.createElement('span');
        bd.className = 'badge badge--neutral ' + (BADGE_SIZE[size] || BADGE_DEFAULT);
        bd.textContent = String(it.badge);
        b.appendChild(bd);
      }
      if (it._hover) b.classList.add('is-hover');
      host.appendChild(b);
    });

    return host;
  }

  /* клик и клавиатура — рантайм ДС (scripts/ds-tabs.js), своего JS нет */
  function wireSubTabs(host, onChange) {
    window.DSTabs && DSTabs.subtabs(host, { onChange: onChange });
    return host;
  }

  function build(o = {}) {
    const h = makeSubTabs(o);
    if (!o.static) wireSubTabs(h);
    return h;
  }

  /* ряд первого уровня — Tab. На этой странице он не декорация: второй уровень
     без первого не существует, и демо это показывают. Размер (m по умолчанию,
     s) — параметр, потому что правило пары «второй не крупнее первого»
     проверяется глазами только на обоих рядах сразу. */
  function makeLevel1(labels, selected, opts) {
    selected = selected || 0;
    opts = opts || {};
    const size = opts.size || 'm';
    const host = document.createElement('div');
    host.className = 'tabs tabs--horiz';
    host.setAttribute('role', 'tablist');
    host.setAttribute('aria-label', opts.label || 'Разделы');
    host.setAttribute('data-tabs-overflow', 'none');
    labels.forEach((t, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'tab tab--' + size + (i === selected ? ' tab--selected' : '');
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', String(i === selected));
      b.tabIndex = i === selected ? 0 : -1;
      const lb = document.createElement('span');
      lb.className = 'tab__label';
      lb.textContent = t;
      b.appendChild(lb);
      host.appendChild(b);
    });
    if (!opts.static && window.DSTabs) DSTabs.tabs(host, { overflow: 'none' });
    return host;
  }

  function mount(id, node) { const el = document.getElementById(id); if (el) el.appendChild(node); }

  const SUB_LABELS = ['Общая информация', 'Условия', 'Документы', 'Обеспечение', 'История'];
  const SUB_COUNTS = [null, null, 12, 3, null];

  /* ============================ PLAYGROUND ============================ */
  (function () {
    const controls = document.getElementById('pg-controls');
    const preview = document.getElementById('pg-preview');
    const codeEl = document.getElementById('pg-code');
    if (!controls || !preview) return;

    /* Размер задаётся ПАРОЙ, а не двумя отдельными селектами. Причины две.
       Первая — правило: второй уровень не крупнее первого, и запрещённой
       комбинации в конструкторе просто нет среди опций, блокировать нечего.
       Вторая — механика витрины: docs-split превращает ЛЮБОЙ селект из двух
       опций в свитч, а «первый уровень M / S» — не тумблер. Заодно подписи
       опций сами проговаривают правило. */
    const PAIRS = [
      ['m-s', 'Tab M 40 → SubTab S 32 · шаг вниз', 'm', 's'],
      ['m-m', 'Tab M 40 → SubTab M 40 · равный', 'm', 'm'],
      ['m-xs', 'Tab M 40 → SubTab XS 24 · два шага', 'm', 'xs'],
      ['s-xs', 'Tab S 32 → SubTab XS 24 · шаг вниз', 's', 'xs'],
      ['s-s', 'Tab S 32 → SubTab S 32 · равный', 's', 's'],
    ];
    function pair() { return PAIRS.find((p) => p[0] === state.pair) || PAIRS[0]; }

    const state = { pair: 'm-s', count: 4, labels: 'short', withBadge: false, withDisabled: false, selected: 0 };

    function select(label, options, getCur, onPick) {
      const wrap = document.createElement('div'); wrap.className = 'ctl';
      const l = document.createElement('div'); l.className = 'lbl'; l.textContent = label; wrap.appendChild(l);
      const box = document.createElement('div'); box.className = 'pg-select';
      const sel = document.createElement('select');
      options.forEach(function (pair) {
        const op = document.createElement('option');
        op.value = pair[0]; op.textContent = pair[1];
        if (String(pair[0]) === String(getCur())) op.selected = true;
        sel.appendChild(op);
      });
      sel.addEventListener('change', function () { onPick(sel.value); render(); });
      box.appendChild(sel); wrap.appendChild(box); return wrap;
    }

    /* Бинарная опция — селект: docs-split.js конвертирует его в свитч ДС
       в правую колонку, подпись свитча статична (DS_SPLIT_SWITCH_LABELS) */
    function ctlToggle(label, key) {
      const wrap = document.createElement('div'); wrap.className = 'ctl';
      const l = document.createElement('div'); l.className = 'lbl'; l.textContent = label; wrap.appendChild(l);
      const box = document.createElement('div'); box.className = 'pg-select';
      const sel = document.createElement('select');
      [['no', 'Нет'], ['yes', 'Да']].forEach(function (pair) {
        const op = document.createElement('option');
        op.value = pair[0]; op.textContent = pair[1];
        if ((pair[0] === 'yes') === !!state[key]) op.selected = true;
        sel.appendChild(op);
      });
      sel.addEventListener('change', function () { state[key] = sel.value === 'yes'; render(); });
      box.appendChild(sel); wrap.appendChild(box); return wrap;
    }

    controls.appendChild(select('Размер пары', PAIRS.map((p) => [p[0], p[1]]),
      function () { return state.pair; },
      function (v) { state.pair = v; }));
    controls.appendChild(select('Кол-во подразделов', [['2', '2'], ['3', '3'], ['4', '4'], ['5', '5']],
      function () { return state.count; },
      function (v) { state.count = +v; if (state.selected >= state.count) state.selected = 0; }));
    controls.appendChild(select('Длина подписей', [['short', 'Короткие'], ['long', 'Длинные']],
      function () { return state.labels; },
      function (v) { state.labels = v; }));
    controls.appendChild(ctlToggle('Счётчик (badge)', 'withBadge'));
    controls.appendChild(ctlToggle('Отключённый подраздел', 'withDisabled'));

    const LONG = ['Общая информация по сделке', 'Существенные условия', 'Документы и вложения', 'Обеспечение и залоги', 'История изменений'];

    function buildItems() {
      const arr = [];
      for (let i = 0; i < state.count; i++) {
        const o = { label: state.labels === 'long' ? LONG[i] : SUB_LABELS[i] };
        if (state.withBadge && SUB_COUNTS[i] != null) o.badge = SUB_COUNTS[i];
        if (state.withDisabled && i === state.count - 1) o.disabled = true;
        arr.push(o);
      }
      return arr;
    }

    function render() {
      preview.innerHTML = '';

      /* первый уровень в превью не опция конструктора: ряд второго уровня
         без него — дефект, и конструктор не даёт собрать такую разметку */
      const frame = document.createElement('div');
      frame.className = 'lvl-frame';

      const p = pair();

      const l1 = document.createElement('div');
      l1.className = 'lvl-frame__l1';
      l1.appendChild(makeLevel1(['Сделка', 'ЦУП', 'Operations'], 0, { label: 'Разделы сделки', size: p[2] }));

      const l2 = document.createElement('div');
      l2.className = 'lvl-frame__l2';
      const node = build({
        items: buildItems(),
        selected: Math.min(state.selected, state.count - 1),
        label: 'Подразделы раздела «Сделка»',
        size: p[3],
      });
      node.addEventListener('click', function (e) {
        const b = e.target.closest('.subtab');
        if (b) state.selected = Array.prototype.slice.call(node.querySelectorAll('.subtab')).indexOf(b);
      });
      l2.appendChild(node);

      const body = document.createElement('div');
      body.className = 'lvl-frame__body';
      body.textContent = 'Область содержимого подраздела';

      frame.appendChild(l1); frame.appendChild(l2); frame.appendChild(body);
      preview.appendChild(frame);

      if (codeEl) codeEl.innerHTML = '<code>&lt;div class="subtabs subtabs--' + p[3] + '" role="tablist" data-subtabs&gt;…&lt;/div&gt;</code>';
    }
    render();
  })();

  /* ============================ USAGE ============================ */
  (function () {
    /* так: ряд второго уровня внутри выбранного раздела первого */
    const ok = document.getElementById('use-correct');
    if (ok) {
      ok.appendChild(makeLevel1(['Сделка', 'ЦУП', 'Operations', 'Monitoring'], 0, { label: 'Разделы сделки (пример «так»)' }));
      const row = document.createElement('div');
      row.className = 'use-l2';
      row.appendChild(build({
        items: [{ label: 'Общая информация' }, { label: 'Условия' }, { label: 'Документы', badge: 12 }, { label: 'История' }],
        selected: 0,
        label: 'Подразделы раздела «Сделка»',
      }));
      ok.appendChild(row);
    }

    /* не так: одиночный ряд без первого уровня */
    mount('use-wrong', build({
      static: true,
      items: [{ label: 'Общая информация' }, { label: 'Условия' }, { label: 'Документы' }, { label: 'История' }],
      selected: 0,
      label: 'Пример «не так»',
    }));

    /* не так: ряд, переполненный подразделами */
    mount('use-toomany', build({
      static: true,
      items: [
        { label: 'Общая' }, { label: 'Условия' }, { label: 'Документы' }, { label: 'Обеспечение' },
        { label: 'История' }, { label: 'Лимиты' }, { label: 'Платежи' }, { label: 'Отчёты' },
      ],
      selected: 0,
      label: 'Пример «не так» — переполненный ряд',
    }));
  })();

  /* ============================ DIFFERENTIATION ============================ */
  (function () {
    const tab = document.getElementById('diff-tab');
    if (tab) tab.appendChild(makeLevel1(['Обзор', 'Сделки', 'Отчёты'], 0, { label: 'Пример Tab', static: true }));

    const seg = document.getElementById('diff-seg');
    if (seg) {
      const g = document.createElement('div');
      g.className = 'segctrl segctrl--s';
      g.setAttribute('role', 'radiogroup');
      g.setAttribute('aria-label', 'Пример SegmentControl');
      const th = document.createElement('div');
      th.className = 'segctrl__thumb';
      g.appendChild(th);
      ['Неделя', 'Месяц', 'Год'].forEach(function (t, i) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'segctrl__item';
        b.setAttribute('role', 'radio');
        b.setAttribute('aria-checked', String(i === 1));
        b.tabIndex = i === 1 ? 0 : -1;
        const lb = document.createElement('span');
        lb.className = 'segctrl__label';
        lb.textContent = t;
        b.appendChild(lb);
        g.appendChild(b);
      });
      seg.appendChild(g);
      if (window.DSTabs) DSTabs.segment(g);
    }

    mount('diff-sub', build({
      items: [{ label: 'Условия' }, { label: 'Документы' }, { label: 'История' }],
      selected: 0,
      label: 'Пример SubTab',
    }));
  })();

  /* ============================ ANATOMY ============================ */
  (function () {
    mount('anat-demo', build({
      static: true,
      items: [{ label: 'Условия' }, { label: 'Документы', badge: 12, _selected: true }, { label: 'История' }],
      label: 'Анатомия',
    }));
  })();

  /* ============================ VARIANTS ============================ */
  (function () {
    mount('var-plain', build({
      items: [{ label: 'Общая информация' }, { label: 'Условия' }, { label: 'История' }],
      selected: 0,
      label: 'Без счётчиков',
    }));

    mount('var-badge', build({
      items: [{ label: 'Общая информация' }, { label: 'Документы', badge: 12 }, { label: 'Замечания', badge: 3 }],
      selected: 0,
      label: 'Со счётчиками',
    }));
  })();

  /* ============================ SIZE ============================ */
  (function () {
    /* три размера в ряд, с подписью высоты — ряды живые, по ним можно ходить */
    const host = document.getElementById('size-demo');
    if (host) {
      const row = document.createElement('div');
      row.className = 'row';
      [['m', 'M · 40'], ['s', 'S · 32'], ['xs', 'XS · 24']].forEach(function (pair) {
        const cell = document.createElement('div');
        const cap = document.createElement('p');
        cap.className = 'demo-rowlabel';
        cap.textContent = pair[1];
        cell.appendChild(cap);
        cell.appendChild(build({
          size: pair[0],
          items: [{ label: 'Условия' }, { label: 'Документы', badge: 12 }, { label: 'История' }],
          selected: 0,
          label: 'Размер ' + pair[1],
        }));
        row.appendChild(cell);
      });
      host.appendChild(row);
    }

    /* Правило пары. Каждое демо — ОБА ряда сразу: размер второго уровня
       сам по себе ничего не говорит, правило проверяется только парой. */
    function pairFrame(l1size, l2size, l1label) {
      const frame = document.createElement('div');
      frame.className = 'lvl-frame';
      const a = document.createElement('div');
      a.className = 'lvl-frame__l1';
      a.appendChild(makeLevel1(['Сделка', 'ЦУП', 'Operations'], 0, { label: l1label, size: l1size, static: true }));
      const b = document.createElement('div');
      b.className = 'lvl-frame__l2';
      b.appendChild(build({
        static: true,
        size: l2size,
        items: [{ label: 'Общая информация' }, { label: 'Условия' }, { label: 'Документы', badge: 12 }],
        selected: 0,
        label: 'Подразделы, ' + l1size + ' → ' + l2size,
      }));
      frame.appendChild(a); frame.appendChild(b);
      return frame;
    }

    mount('pair-step', pairFrame('m', 's', 'Первый уровень M'));
    mount('pair-equal', pairFrame('m', 'm', 'Первый уровень M, второй тоже M'));
    mount('pair-dense', pairFrame('s', 'xs', 'Первый уровень S'));
    mount('pair-wrong', pairFrame('s', 'm', 'Первый уровень S, второй крупнее — так нельзя'));
  })();

  /* ============================ CONTENT ============================ */
  (function () {
    mount('content-short', build({
      static: true,
      items: [{ label: 'Условия' }, { label: 'Документы' }, { label: 'История' }],
      label: 'Короткие подписи',
    }));

    mount('content-long', build({
      static: true,
      items: [{ label: 'Существенные условия сделки' }, { label: 'Документы и вложения' }],
      label: 'Длинные подписи',
    }));
  })();

  /* ============================ BEHAVIOUR ============================ */
  (function () {
    mount('beh-min', build({
      static: true,
      items: [{ label: 'Условия' }, { label: 'История' }],
      label: 'Два подраздела',
    }));

    mount('beh-max', build({
      static: true,
      items: [
        { label: 'Общая' }, { label: 'Условия' }, { label: 'Документы' },
        { label: 'Обеспечение' }, { label: 'История' },
      ],
      label: 'Пять подразделов',
    }));
  })();

  /* ============================ STATES ============================ */
  (function () {
    /* ряды состояний статичны: рантайм их не оживляет, иначе форс-состояния
       слетают на первом же клике (правило витрины, как у Tab) */
    const rows = [
      ['st-default', { label: 'Условия' }],
      ['st-hover', { label: 'Условия', _hover: true }],
      ['st-selected', { label: 'Условия', _selected: true }],
      ['st-selected-hover', { label: 'Условия', _selected: true, _hover: true }],
      ['st-disabled', { label: 'Условия', disabled: true }],
    ];
    rows.forEach(function (pair) {
      mount(pair[0], build({ static: true, items: [pair[1]], label: 'Состояние' }));
    });
  })();

  /* ============================ DEV SPEC TABLE (measured, not hardcoded) ============================ */
  (function () {
    const tbody = document.querySelector('#dev-spec-table');
    if (!tbody) return;

    /* значения снимаются с реально отрендеренного экземпляра через
       getComputedStyle — не getBoundingClientRect (на скрытом off-screen
       он вернёт 0) и не хардкодом (разъедется с CSS) */
    function measure(size) {
      const host = document.createElement('div');
      host.style.cssText = 'position:absolute; left:-9999px; top:0; visibility:hidden;';
      const g = makeSubTabs({
        size: size,
        items: [{ label: 'Условия' }, { label: 'Документы', badge: 12 }],
        selected: 1,
      });
      host.appendChild(g);
      document.body.appendChild(host);

      const items = g.querySelectorAll('.subtab');
      const item = items[1];
      const badge = item.querySelector('.badge');
      const cs = getComputedStyle(g);
      const csItem = getComputedStyle(item);
      const csBadge = badge ? getComputedStyle(badge) : null;
      const csDiv = getComputedStyle(item, '::before');

      const data = {
        trackH: Math.round(parseFloat(cs.height)),
        trackPad: Math.round(parseFloat(cs.paddingTop)),
        itemH: Math.round(parseFloat(csItem.height)),
        trackRadius: Math.round(parseFloat(cs.borderTopLeftRadius)),
        itemRadius: Math.round(parseFloat(csItem.borderTopLeftRadius)),
        itemPadX: Math.round(parseFloat(csItem.paddingLeft)),
        gap: Math.round(parseFloat(cs.columnGap || cs.gap || '0')),
        slotGap: Math.round(parseFloat(csItem.columnGap || csItem.gap || '0')),
        divider: Math.round(parseFloat(csDiv.width || '1')),
        fontSize: Math.round(parseFloat(csItem.fontSize)),
        lineHeight: Math.round(parseFloat(csItem.lineHeight)),
        badgeH: csBadge ? Math.round(parseFloat(csBadge.height)) : null,
        badgeFont: csBadge ? Math.round(parseFloat(csBadge.fontSize)) : null,
      };
      host.remove();
      return data;
    }

    /* по колонке на размер — таблица обязана покрывать всю шкалу, иначе
       редлайн описывает один размер, а компонент отгружен в трёх */
    const M = measure('m'), S = measure('s'), XS = measure('xs');
    const px = (v) => (v == null ? '—' : v + ' px');

    const rows = [
      ['Высота трека', px(M.trackH), px(S.trackH), px(XS.trackH)],
      ['Высота сегмента', px(M.itemH), px(S.itemH), px(XS.itemH)],
      ['Паддинг трека', px(M.trackPad), px(S.trackPad), px(XS.trackPad)],
      ['Радиус трека', px(M.trackRadius), px(S.trackRadius), px(XS.trackRadius)],
      ['Радиус сегмента', px(M.itemRadius), px(S.itemRadius), px(XS.itemRadius)],
      ['Паддинг сегмента по X', px(M.itemPadX), px(S.itemPadX), px(XS.itemPadX)],
      ['Зазор между сегментами', px(M.gap), px(S.gap), px(XS.gap)],
      ['Зазор подпись ↔ счётчик', px(M.slotGap), px(S.slotGap), px(XS.slotGap)],
      ['Толщина разделителя', px(M.divider), px(S.divider), px(XS.divider)],
      ['Кегль / интерлиньяж',
        M.fontSize + ' / ' + M.lineHeight, S.fontSize + ' / ' + S.lineHeight, XS.fontSize + ' / ' + XS.lineHeight],
      ['Счётчик (Badge): высота / кегль',
        M.badgeH + ' / ' + M.badgeFont, S.badgeH + ' / ' + S.badgeFont, XS.badgeH + ' / ' + XS.badgeFont],
    ];

    const COLS = 'grid-template-columns:8px 1.5fr 0.8fr 0.8fr 0.8fr 8px;';
    tbody.innerHTML = rows.map(function (r) {
      return '<div class="tbl__row" style="' + COLS + '">'
        + '<div class="tc tc--separator"></div>'
        + '<div class="tc tc--wrap"><span class="tc__row"><span class="tc__text">' + r[0] + '</span></span></div>'
        + '<div class="tc tc--right"><span class="tc__row"><span class="tc__text">' + r[1] + '</span></span></div>'
        + '<div class="tc tc--right"><span class="tc__row"><span class="tc__text">' + r[2] + '</span></span></div>'
        + '<div class="tc tc--right"><span class="tc__row"><span class="tc__text">' + r[3] + '</span></span></div>'
        + '<div class="tc tc--separator"></div></div>';
    }).join('');
  })();

  /* ============================ DEV CODE PANELS — copy buttons ============================ */
  (function () {
    document.querySelectorAll('.code-panel__copy').forEach(function (btn) {
      const target = document.getElementById(btn.dataset.copyTarget);
      if (!target) return;
      const label = btn.querySelector('.copy-label');
      btn.addEventListener('click', async function () {
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
        setTimeout(function () { btn.classList.remove('is-copied'); label.textContent = prev; }, 1600);
      });
    });
  })();

})();
