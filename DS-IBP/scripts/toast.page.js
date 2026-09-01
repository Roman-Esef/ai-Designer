/* =========================================================================
   Toast — documentation page logic
   Фабрика тостов + Конструктор + демонстрации + redline (измеренные размеры)
   ========================================================================= */
(function () {
  const L = window.DS_ICONS || {};
  const icon = (n) => L[n] || '';

  const TONE_ICON = { success: 'check-circle', error: 'alert-circle', info: 'info-circle', neutral: null };

  /* Узел тоста и вся логика показа — рантайм ДС (scripts/ds-notify.js):
     стек ≤3, авто-скрытие, loader со скримом, переход loading → success.
     Витрине нужен только сам узел для статичных примеров. */
  const makeToast = (o) => window.DSToast.make(o || {});

  function mount(id, node) { const el = document.getElementById(id); if (el) el.appendChild(node); }

  /* ---------- mock work-area surface (контекст для тостов) ---------- */
  function makeWorkSurface(o = {}) {
    const { layer = 'bar', scrim = false, toasts = [], tall = false } = o;
    const ws = document.createElement('div');
    ws.className = 'worksurface' + (tall ? ' worksurface--tall' : '');

    const bar = document.createElement('div');
    bar.className = 'ws-topbar';
    bar.innerHTML = '<span class="ws-topbar__title">' + (o.title || 'Маршрутизация сделок') + '</span>' +
      '<span class="ws-topbar__meta">' + (o.meta || 'ООО «Ромашка»') + '</span>';
    ws.appendChild(bar);

    const rows = document.createElement('div');
    rows.className = 'ws-rows';
    const rc = o.rows != null ? o.rows : 6;
    for (let i = 0; i < rc; i++) { const r = document.createElement('div'); r.className = 'ws-row'; rows.appendChild(r); }
    ws.appendChild(rows);

    if (scrim) { const s = document.createElement('div'); s.className = 'toast-scrim'; ws.appendChild(s); }

    const lay = document.createElement('div');
    lay.className = 'toast-layer toast-layer--' + layer;
    const stack = document.createElement('div');
    stack.className = 'toast-stack';
    toasts.forEach(t => stack.appendChild(t));
    lay.appendChild(stack);
    ws.appendChild(lay);

    ws._stack = stack;
    ws._layer = lay;
    return ws;
  }

  /* ---------- анимация появления/скрытия ---------- */
  function playEnterLeave(node) {
    node.classList.remove('toast--leave');
    node.classList.remove('toast--enter');
    // reflow
    void node.offsetWidth;
    node.classList.add('toast--enter');
    node.addEventListener('animationend', function onEnter() {
      node.removeEventListener('animationend', onEnter);
      setTimeout(() => {
        node.classList.remove('toast--enter');
        node.classList.add('toast--leave');
        node.addEventListener('animationend', function onLeave() {
          node.removeEventListener('animationend', onLeave);
          node.classList.remove('toast--leave');
          setTimeout(() => playEnterLeave(node), 700);
        });
      }, 1600);
    });
  }

  /* ============================ PLAYGROUND ============================ */
  (function () {
    const state = { kind: 'bar', tone: 'neutral', lead: 'auto', message: 'Процесс запущен', show: 'single' };
    const controls = document.getElementById('pg-controls');
    const preview = document.getElementById('pg-preview');
    const codeEl = document.getElementById('pg-code');
    if (!controls) return;

    function select(label, options, getCur, onPick) {
      const wrap = document.createElement('div'); wrap.className = 'ctl';
      const l = document.createElement('div'); l.className = 'lbl'; l.textContent = label; wrap.appendChild(l);
      const box = document.createElement('div'); box.className = 'pg-select';
      const sel = document.createElement('select');
      options.forEach(([val, txt]) => { const op = document.createElement('option'); op.value = val; op.textContent = txt; if (String(val) === String(getCur())) op.selected = true; sel.appendChild(op); });
      sel.addEventListener('change', () => { onPick(sel.value); render(); });
      box.appendChild(sel); wrap.appendChild(box); return wrap;
    }
    function textField(label, getCur, onInput) {
      const wrap = document.createElement('div'); wrap.className = 'ctl';
      const l = document.createElement('div'); l.className = 'lbl'; l.textContent = label; wrap.appendChild(l);
      const box = document.createElement('div'); box.className = 'pg-text';
      const inp = document.createElement('input'); inp.type = 'text'; inp.value = getCur();
      inp.addEventListener('input', () => { onInput(inp.value); render(); });
      box.appendChild(inp); wrap.appendChild(box); return wrap;
    }

    const ctlKind = select('Режим', [['bar', 'ToastBar (фоновый)'], ['loader', 'ToastLoader (блокирующий)']], () => state.kind, v => { state.kind = v; });
    const ctlTone = select('Тон', [['neutral', 'Neutral'], ['success', 'Success'], ['error', 'Error'], ['info', 'Info']], () => state.tone, v => state.tone = v);
    const ctlLead = select('Ведущий слот', [['auto', 'Авто (по режиму/тону)'], ['none', 'Без слота'], ['spinner', 'Спиннер'], ['icon', 'Статус-иконка']], () => state.lead, v => state.lead = v);
    const ctlShow = select('Показ', [['single', 'Один тост'], ['stack', 'Стек (3)']], () => state.show, v => state.show = v);
    const ctlMsg = textField('Текст сообщения', () => state.message, v => state.message = v);
    ctlLead.dataset.pgKeepSelect = '';   // 5 опций — оставить select

    controls.appendChild(ctlKind);
    controls.appendChild(ctlTone);
    controls.appendChild(ctlLead);
    controls.appendChild(ctlShow);
    controls.appendChild(ctlMsg);

    function resolveLead() {
      if (state.lead !== 'auto') return state.lead;
      if (state.kind === 'loader') return 'spinner';
      return TONE_ICON[state.tone] ? 'icon' : 'none';
    }

    let ws = null;
    function render() {
      preview.innerHTML = '';
      const lead = resolveLead();

      const box = document.createElement('div');
      box.style.cssText = 'width:100%; display:flex; flex-direction:column;';

      const toasts = [];
      if (state.show === 'stack') {
        toasts.push(makeToast({ kind: 'bar', tone: 'neutral', lead: 'none', message: 'Процесс запущен' }));
        toasts.push(makeToast({ kind: 'bar', tone: 'info', lead: 'icon', message: 'Запущена маршрутизация' }));
        toasts.push(makeToast({ kind: state.kind, tone: state.tone, lead: lead, message: state.message }));
      } else {
        toasts.push(makeToast({ kind: state.kind, tone: state.tone, lead: lead, message: state.message }));
      }

      ws = makeWorkSurface({
        layer: state.kind === 'loader' ? 'loader' : 'bar',
        scrim: state.kind === 'loader',
        rows: 7, tall: true, toasts,
      });
      ws.style.width = '100%';
      ws.style.borderRadius = '0';
      ws.style.border = 'none';
      ws.style.minHeight = '300px';
      preview.appendChild(ws);

      // «Проиграть» — анимация появления/скрытия последнего тоста
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'replay';
      btn.style.cssText = 'position:absolute; right:14px; bottom:14px; z-index:70; pointer-events:auto;';
      btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>Проиграть';
      btn.addEventListener('click', () => {
        const last = ws._stack.lastElementChild;
        if (last) playEnterLeave(last);
      });
      ws.style.position = 'relative';
      ws.appendChild(btn);

      // code line
      const cls = ['toast'];
      if (state.tone !== 'neutral') cls.push('toast--' + state.tone);
      const roleTxt = (state.tone === 'error' || (state.kind === 'loader' && state.tone === 'neutral')) ? 'alert' : 'status';
      const leadTxt = lead === 'none' ? '' : (lead === 'spinner' ? ' + spinner' : lead === 'icon' ? ' + icon' : ' + spinner + icon');
      codeEl.innerHTML = '<code>&lt;div class="' + cls.join(' ') + '" role="' + roleTxt + '"&gt;' + leadTxt + ' …&lt;/div&gt;</code>';
    }
    render();
  })();

  /* ============================ USAGE ============================ */
  (function () {
    rewrap('use-bar', { layer: 'bar', scrim: false, rows: 6, toasts: [makeToast({ kind: 'bar', tone: 'neutral', lead: 'none', message: 'Процесс запущен' })] });
    rewrap('use-loader', { layer: 'loader', scrim: true, rows: 6, toasts: [makeToast({ kind: 'loader', tone: 'neutral', lead: 'spinner', message: 'Выполняется маршрутизация' })] });
  })();

  // helper: заменить пустой .worksurface из HTML на сгенерированный, сохранив id/классы
  function rewrap(id, o) {
    const host = document.getElementById(id);
    if (!host) return;
    const ws = makeWorkSurface(o);
    // перенести доп. классы (напр. worksurface--tall) и размеры
    host.classList.forEach(c => { if (c !== 'worksurface') ws.classList.add(c); });
    if (host.style.minHeight) ws.style.minHeight = host.style.minHeight;
    ws.id = id;
    host.replaceWith(ws);
    return ws;
  }

  /* ============================ DIFFERENTIATION ============================ */
  (function () {
    const bar = document.getElementById('diff-bar');
    if (bar) {
      const ws = makeWorkSurface({ layer: 'bar', scrim: false, rows: 3, toasts: [
        makeToast({ kind: 'bar', tone: 'neutral', lead: 'none', message: 'Процесс запущен' }),
      ] });
      ws.style.minHeight = '150px'; bar.appendChild(ws);
    }
    const loader = document.getElementById('diff-loader');
    if (loader) {
      const ws = makeWorkSurface({ layer: 'loader', scrim: true, rows: 3, toasts: [
        makeToast({ kind: 'loader', tone: 'neutral', lead: 'spinner', message: 'Выполняется маршрутизация' }),
      ] });
      ws.style.minHeight = '150px'; loader.appendChild(ws);
    }
  })();

  /* ============================ ANATOMY ============================ */
  (function () {
    const d = document.getElementById('anat-diagram');
    if (!d) return;
    const t = makeToast({ kind: 'bar', tone: 'success', lead: 'icon', message: 'Маршрутизация завершена' });
    d.appendChild(t);
    requestAnimationFrame(() => {
      const marks = [
        ['1', '50%', '-14px'],                 // контейнер (сверху по центру)
        ['2', '20px', 'calc(100% + 14px)'],    // ведущий слот (спиннер ИЛИ иконка)
        ['3', '72%', 'calc(100% + 14px)'],     // текст
      ];
      marks.forEach(([n, left, top]) => {
        const m = document.createElement('span'); m.className = 'mk'; m.textContent = n;
        m.style.left = left; m.style.top = top; d.appendChild(m);
      });
    });
  })();

  /* ============================ WIDTH / WRAPPING ============================ */
  (function () {
    const short = document.getElementById('width-short');
    if (short) {
      const box = document.createElement('div');
      box.style.cssText = 'display:flex; gap:12px; flex-wrap:wrap; align-items:flex-start;';
      box.appendChild(makeToast({ kind: 'bar', tone: 'neutral', lead: 'none', message: 'Процесс запущен' }));
      box.appendChild(makeToast({ kind: 'bar', tone: 'info', lead: 'icon', message: 'Запущена маршрутизация' }));
      short.appendChild(box);
    }
    const wrap = document.getElementById('width-wrap');
    if (wrap) {
      const ws = makeWorkSurface({ layer: 'bar', scrim: false, rows: 3, tall: false, toasts: [
        makeToast({ kind: 'loader', tone: 'neutral', lead: 'spinner', message: 'Выполняется маршрутизация сделки ООО «Ромашка» по утверждённому маршруту согласования с участием финансового контроля' }),
      ] });
      ws.style.minHeight = '150px';
      wrap.replaceWith(ws); ws.id = 'width-wrap'; ws.classList.add('worksurface');
    }
  })();

  /* ============================ CONTENT (ведущий слот) ============================ */
  (function () {
    mount('content-none', makeToast({ kind: 'bar', tone: 'neutral', lead: 'none', message: 'Процесс запущен' }));
    mount('content-spinner', makeToast({ kind: 'loader', tone: 'neutral', lead: 'spinner', message: 'Выполняется маршрутизация' }));
    mount('content-icon', makeToast({ kind: 'bar', tone: 'success', lead: 'icon', message: 'Маршрутизация завершена' }));
  })();

  /* ============================ STATES / TONES (spec) ============================ */
  (function () {
    const host = document.getElementById('state-specs');
    if (!host) return;

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
    function cline(role, token, name) {
      const cssVal = token.startsWith('--') ? 'var(' + token + ')' : token;
      return `<div class="spec__cline"><b>${role}</b><span class="spec__sw" style="background:${cssVal}"></span><span><span class="tnm">${name}</span> · ${resolveHex(token)}</span></div>`;
    }

    const rows = [
      ['Neutral', 'Индикация запуска процесса, без окраски результата.',
        () => makeToast({ kind: 'bar', tone: 'neutral', lead: 'none', message: 'Процесс запущен' }), [
          ['Фон пилюли', '--st-grey', 'StGrey · CGrey_700'],
          ['Текст', '--text-on-dark', 'Text_OnDark'],
        ]],
      ['Loading', 'Процесс идёт — спиннер вращается 0.7 с.',
        () => makeToast({ kind: 'loader', tone: 'neutral', lead: 'spinner', message: 'Выполняется маршрутизация' }), [
          ['Фон пилюли', '--st-grey', 'StGrey · CGrey_700'],
          ['Спиннер', '--text-on-dark', 'Text_OnDark (currentColor)'],
        ]],
      ['Success', 'Процесс завершён успешно — галочка.',
        () => makeToast({ kind: 'bar', tone: 'success', lead: 'icon', message: 'Маршрутизация завершена' }), [
          ['Иконка', '--success-light', 'Success_Light'],
          ['Текст', '--text-on-dark', 'Text_OnDark'],
        ]],
      ['Error', 'Процесс завершился неуспешно — знак ошибки.',
        () => makeToast({ kind: 'bar', tone: 'error', lead: 'icon', message: 'Не удалось запустить процесс' }), [
          ['Иконка', '--error-light', 'Error_Light'],
          ['Текст', '--text-on-dark', 'Text_OnDark'],
        ]],
      ['Info', 'Нейтральное уточнение о процессе.',
        () => makeToast({ kind: 'bar', tone: 'info', lead: 'icon', message: 'Запущена маршрутизация' }), [
          ['Иконка', '--info-light', 'Info_Light'],
          ['Текст', '--text-on-dark', 'Text_OnDark'],
        ]],
    ];

    rows.forEach(([title, sub, mkr, colors]) => {
      const spec = document.createElement('div'); spec.className = 'spec';
      const row = document.createElement('div'); row.className = 'spec__row';
      const a = document.createElement('div'); a.className = 'spec__state'; a.innerHTML = title + '<small>' + sub + '</small>'; row.appendChild(a);
      const b = document.createElement('div'); b.className = 'spec__sample'; b.appendChild(mkr()); row.appendChild(b);
      const c = document.createElement('div'); c.className = 'spec__colors'; c.innerHTML = colors.map(cc => cline(cc[0], cc[1], cc[2])).join(''); row.appendChild(c);
      spec.appendChild(row); host.appendChild(spec);
    });
    probe.remove();
  })();

  /* ============================ TRANSITION Loading → Success ============================ */
  (function () {
    const host = document.getElementById('transition-demo');
    const btn = document.getElementById('transition-replay');
    if (!host) return;

    let node = null;
    function build() {
      host.innerHTML = '';
      node = makeToast({ kind: 'loader', tone: 'neutral', lead: 'spinner', message: 'Выполняется маршрутизация' });
      host.appendChild(node);
    }
    function play() {
      build();
      setTimeout(() => {
        // спиннер → галочка, тон success
        node.classList.add('toast--success');
        const slot = node.querySelector('.toast__lead');
        slot.innerHTML = '';
        const ic = document.createElement('span'); ic.className = 'toast__icon'; ic.setAttribute('aria-hidden', 'true');
        ic.innerHTML = icon('check-circle'); slot.appendChild(ic);
        node.querySelector('.toast__msg').textContent = 'Маршрутизация завершена';
        node.setAttribute('role', 'status');
        // держим ~1с и уходим фейдом вниз
        setTimeout(() => {
          node.classList.add('toast--leave');
          node.addEventListener('animationend', function onLeave() {
            node.removeEventListener('animationend', onLeave);
            node.style.visibility = 'hidden';
          });
        }, 1000);
      }, 1600);
    }
    build();
    if (btn) btn.addEventListener('click', play);
  })();

  /* ============================ STACK ============================ */
  (function () {
    const single = document.getElementById('stack-single');
    if (single) single.appendChild(makeToast({ kind: 'bar', tone: 'neutral', lead: 'none', message: 'Процесс запущен' }));

    const multi = document.getElementById('stack-multi');
    if (multi) {
      const stack = document.createElement('div'); stack.className = 'toast-stack'; stack.style.maxWidth = '100%';
      stack.appendChild(makeToast({ kind: 'bar', tone: 'neutral', lead: 'none', message: 'Процесс запущен' }));
      stack.appendChild(makeToast({ kind: 'bar', tone: 'info', lead: 'icon', message: 'Запущена маршрутизация' }));
      stack.appendChild(makeToast({ kind: 'bar', tone: 'success', lead: 'icon', message: 'Отчёт сформирован' }));
      multi.appendChild(stack);
    }
  })();

  /* ============================ STACK OVERFLOW (interactive) ============================ */
  (function () {
    const host = document.getElementById('stack-overflow');
    const addBtn = document.getElementById('overflow-add');
    const resetBtn = document.getElementById('overflow-reset');
    if (!host) return;

    const SEED = [
      { tone: 'neutral', lead: 'none', message: 'Процесс запущен' },
      { tone: 'info', lead: 'icon', message: 'Запущена маршрутизация' },
      { tone: 'success', lead: 'icon', message: 'Отчёт сформирован' },
    ];
    const QUEUE = [
      { tone: 'neutral', lead: 'none', message: 'Экспорт поставлен в очередь' },
      { tone: 'info', lead: 'icon', message: 'Запущена проверка лимитов' },
      { tone: 'success', lead: 'icon', message: 'Согласование завершено' },
      { tone: 'error', lead: 'icon', message: 'Не удалось отправить уведомление' },
    ];
    let qi = 0;

    const ws = makeWorkSurface({ layer: 'bar', scrim: false, rows: 5, tall: true, toasts: [] });
    ws.style.height = '100%';
    host.replaceWith(ws); ws.id = 'stack-overflow'; ws.classList.add('worksurface', 'worksurface--tall');
    const stack = ws._stack;

    /* вытеснение нижнего тоста при лимите — забота рантайма (DSToast) */
    function reset() {
      window.DSToast.clear();
      stack.innerHTML = '';
      SEED.slice().reverse().forEach(spec => DSToast.show({ kind: 'bar', duration: null, ...spec, layer: ws }));
      qi = 0;
    }
    function add() {
      const spec = QUEUE[qi % QUEUE.length]; qi++;
      DSToast.show({ kind: 'bar', duration: null, ...spec, layer: ws });
    }
    reset();
    if (addBtn) addBtn.addEventListener('click', add);
    if (resetBtn) resetBtn.addEventListener('click', reset);
  })();

  /* ============================ POSITION + SCRIM ============================ */
  (function () {
    rewrap('pos-bar', { layer: 'bar', scrim: false, rows: 5, toasts: [
      makeToast({ kind: 'bar', tone: 'neutral', lead: 'none', message: 'Процесс запущен' }),
    ] });
    rewrap('pos-loader', { layer: 'loader', scrim: true, rows: 5, toasts: [
      makeToast({ kind: 'loader', tone: 'neutral', lead: 'spinner', message: 'Выполняется маршрутизация' }),
    ] });
  })();

  /* ============================ ANIMATION DEMO ============================ */
  (function () {
    const host = document.getElementById('anim-demo');
    const btn = document.getElementById('anim-replay');
    if (!host) return;
    let node = makeToast({ kind: 'loader', tone: 'neutral', lead: 'spinner', message: 'Выполняется маршрутизация' });
    host.appendChild(node);
    node.classList.add('toast--enter');
    if (btn) btn.addEventListener('click', () => { playEnterLeave(node); });
  })();

  /* ============================ TIMING TABLE ============================ */
  (function () {
    const tb = document.querySelector('#timing-table');
    if (!tb) return;
    const rows = [
      ['Появление тоста', '180 мс', 'linear', 'Сдвиг сверху −16px + opacity 0→1'],
      ['Скрытие тоста', '200 мс', 'ease-in', 'Сдвиг вниз +12px + opacity 1→0'],
      ['Авто-скрытие (ToastBar без лоадера)', '3000 мс', '—', 'Отсчёт от момента показа'],
      ['Задержка перед скрытием после Success', '1000 мс', '—', 'Чтобы успеть считать результат'],
      ['Вращение спиннера', '700 мс', 'linear · infinite', 'При reduced-motion — 1600 мс'],
      ['Зазор в стеке', '8 px', '—', '--toast-stack-gap'],
    ];
    tb.innerHTML = rows.map(r =>
      `<div class="tbl__row" style="grid-template-columns:8px 1.84fr 0.99fr 0.72fr 0.9fr 8px;"><div class="tc tc--separator"></div><div class="tc"><span class="tc__row"><span class="tc__text">${r[0]}</span></span></div><div class="tc tc--numbers"><span class="tc__row"><span class="tc__text">${r[1]}</span></span></div><div class="tc"><span class="tc__row"><span class="tc__text">${r[2]}</span></span></div><div class="tc"><span class="tc__row"><span class="tc__text">${r[3]}</span></span></div><div class="tc tc--separator"></div></div>`).join('');
  })();

  /* ============================ TEXTOVKA GUIDELINES ============================ */
  (function () {
    const BAD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    const GOOD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>';
    const set = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };
    set('ic-bad1', BAD); set('ic-bad2', BAD); set('ic-good1', GOOD); set('ic-good2', GOOD);

    mount('guide-bad1', makeToast({ kind: 'bar', tone: 'neutral', lead: 'none', message: 'Выполняется маршрутизация' }));
    mount('guide-good1', makeToast({ kind: 'bar', tone: 'neutral', lead: 'none', message: 'Маршрутизация запущена' }));
    mount('guide-bad2', makeToast({ kind: 'loader', tone: 'neutral', lead: 'spinner', message: 'Маршрутизация завершена' }));
    mount('guide-good2', makeToast({ kind: 'loader', tone: 'neutral', lead: 'spinner', message: 'Выполняется маршрутизация' }));
  })();

  /* ============================ A11Y TABLE ============================ */
  (function () {
    const tb = document.querySelector('#a11y-table');
    if (!tb) return;
    const rows = [
      ['ToastBar · Neutral / Info', 'status', 'polite', 'Не прерывает чтение — сообщение озвучится в паузе'],
      ['ToastBar · Success', 'status', 'polite', 'Результат некритичен, объявляется вежливо'],
      ['ToastBar · Error', 'alert', 'assertive', 'Ошибку важно услышать сразу'],
      ['ToastLoader (блокирующий)', 'alert', 'assertive', 'Блокирует работу — объявляем немедленно'],
    ];
    tb.innerHTML = rows.map(r =>
      `<div class="tbl__row" style="grid-template-columns:8px 1.84fr 0.63fr 0.86fr 0.72fr 8px;"><div class="tc tc--separator"></div><div class="tc"><span class="tc__row"><span class="tc__text">${r[0]}</span></span></div><div class="tc"><code class="tok">${r[1]}</code></div><div class="tc"><code class="tok">${r[2]}</code></div><div class="tc tc--wrap"><span class="tc__row"><span class="tc__text">${r[3]}</span></span></div><div class="tc tc--separator"></div></div>`).join('');
  })();

  /* ============================ COLOR REFERENCE ============================ */
  (function () {
    const hostEl = document.getElementById('color-ref');
    if (!hostEl) return;
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
      { name: 'Пилюля', rows: [
        ['Фон', '--st-grey'], ['Текст', '--text-on-dark'], ['Тень', null, 'Elevation_2'],
      ] },
      { name: 'Статус-иконки (Situative)', rows: [
        ['Success', '--success-light'], ['Error', '--error-light'], ['Info', '--info-light'],
      ] },
      { name: 'ToastLoader', rows: [
        ['Затемнение (25%)', 'color-mix(in srgb, var(--st-grey) 25%, transparent)'],
      ] },
      { name: 'Спиннер', rows: [
        ['Обводка', '--text-on-dark'],
      ] },
    ];
    hostEl.innerHTML = groups.map(g => `
      <section class="cref-group">
        <h3>${g.name}</h3>
        <div class="cref-rows">
          ${g.rows.map(([role, tok, note]) => {
            if (!tok) return `
            <div class="cref-row">
              <div class="cref-sw"><div class="cf" style="box-shadow:var(--elevation-2); background:var(--bg-tile);"></div></div>
              <div class="cref-meta"><p class="role">${role}</p><p class="tname">${note}</p></div>
              <div class="cref-hex">shadow</div>
            </div>`;
            const cssVal = tok.startsWith('--') ? 'var(' + tok + ')' : tok;
            return `
            <div class="cref-row">
              <div class="cref-sw"><div class="cf" style="background:${cssVal};"></div></div>
              <div class="cref-meta"><p class="role">${role}</p><p class="tname">${tok}</p></div>
              <div class="cref-hex">${resolveHex(cssVal)}</div>
            </div>`;
          }).join('')}
        </div>
      </section>`).join('');
    probe.remove();
  })();

  /* ============================ DEV SPEC TABLE (measured, not hardcoded) ============================ */
  (function () {
    const tbody = document.querySelector('#dev-spec-table');
    if (!tbody) return;

    const host = document.createElement('div');
    host.style.cssText = 'position:absolute; left:-9999px; top:0; visibility:hidden;';
    const t = makeToast({ kind: 'loader', tone: 'neutral', lead: 'spinner', message: 'Тест' });
    const tIcon = makeToast({ kind: 'bar', tone: 'success', lead: 'icon', message: 'Тест' });
    host.appendChild(t);
    host.appendChild(tIcon);
    document.body.appendChild(host);

    const cs = getComputedStyle(t);
    const spinner = t.querySelector('.spin');
    const iconEl = tIcon.querySelector('.toast__icon');
    const msg = t.querySelector('.toast__msg');
    const csSp = spinner ? getComputedStyle(spinner) : null;
    const csIc = iconEl ? getComputedStyle(iconEl) : null;
    const csMsg = getComputedStyle(msg);
    const px = v => Math.round(parseFloat(v)) + ' px';

    // отдельно измеряем макс. ширину на реальном стеке (токен --toast-maxw)
    const stackProbe = document.createElement('div');
    stackProbe.className = 'toast-stack';
    stackProbe.style.cssText = 'position:absolute; left:-9999px; top:0; visibility:hidden;';
    document.body.appendChild(stackProbe);
    const stackMaxW = getComputedStyle(stackProbe).maxWidth;
    stackProbe.remove();

    const rows = [
      ['Паддинг по вертикали', px(cs.paddingTop), '--toast-pad-y'],
      ['Паддинг по горизонтали', px(cs.paddingLeft), '--toast-pad-x'],
      ['Радиус пилюли', px(cs.borderTopLeftRadius), '--toast-radius → --radius-control'],
      ['Зазор слот ↔ текст', px(cs.columnGap || cs.gap), '--toast-gap'],
      ['Размер спиннера', csSp ? px(csSp.width) : '—', '--toast-icon'],
      ['Толщина обводки спиннера', csSp ? px(csSp.borderTopWidth) : '—', 'border 2px'],
      ['Размер статус-иконки', csIc ? px(csIc.width) : '—', '--toast-icon'],
      ['Типографика текста (кегль / интерлиньяж)', Math.round(parseFloat(csMsg.fontSize)) + ' / ' + Math.round(parseFloat(csMsg.lineHeight)) + ' px', '--type-body-s'],
      ['Макс. ширина (стек)', stackMaxW, '--toast-maxw'],
    ];
    tbody.innerHTML = rows.map(r =>
      `<div class="tbl__row" style="grid-template-columns:8px 1.84fr 0.81fr 1.17fr 8px;"><div class="tc tc--separator"></div><div class="tc"><span class="tc__row"><span class="tc__text">${r[0]}</span></span></div><div class="tc tc--numbers"><span class="tc__row"><span class="tc__text">${r[1]}</span></span></div><div class="tc"><code class="tok">${r[2]}</code></div><div class="tc tc--separator"></div></div>`).join('');
    host.remove();
  })();

  /* ============================ COPY BUTTONS ============================ */
  (function () {
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
  })();

})();
