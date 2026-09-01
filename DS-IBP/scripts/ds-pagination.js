/* =========================================================================
   DS Pagination — рантайм пагинатора таблицы (out-of-box).
   Зависимости: styles/pagination.css, styles/dropdown-list.css, styles/divider.css;
   scripts/icons-data.js подключён ДО этого файла (window.DS_ICONS).

   Экспорт: window.DSPagination = {
     pager(opts) → HTMLElement       — сам пагинатор (pagesize + range + nav)
     row(opts) → HTMLElement          — строка колонтитула: левый слот + пагинатор
     footer(opts) → HTMLElement       — колонтитул: Action panel (опц.) + строка
     bulk(opts) · info(opts)          — Action panel и Pagi counters по отдельности
     pageWindow(current, total, sibling, boundary) → (number|'...')[]
     totalPages(total, pageSize) · sizeLabel(v) · SIZES
   }
   Опции pager/row/footer: total, page, pageSize, pageSizeOptions, showPageSize,
   compact, onChange(page), onPageSizeChange(size); у row/footer дополнительно
   left ('none'|'info'|узел), selectionCount, actions.

   Всё поведение внутри: окно номеров со свёрткой в «…», dropdown размера
   страницы, aria-current/aria-disabled и адаптивный подбор уровня навигации
   измерением (ResizeObserver + гистерезис), без порогов ширины.
   Совместимость: старые имена window.PGN_build / PGN_buildRow / PGN_buildFooter
   / PGN_buildBulk / PGN_buildInfo / PGN_pageWindow остаются рабочими.
   ========================================================================= */
(function () {
  const L = window.DS_ICONS || {};
  const icon = (n) => L[n] || '';
  const WARN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';

  function escapeHtml(s) { const d = document.createElement('div'); d.textContent = String(s); return d.innerHTML; }
  function range(a, b) { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; }

  /* =========================================================================
     WINDOWING ALGORITHM — какие номера страниц показывать, где «…»
     boundaryCount — сколько номеров у каждого края всегда видно (по умолч. 1)
     siblingCount  — сколько номеров вокруг текущей страницы (по умолч. 1)
     ========================================================================= */
  function pageWindow(current, total, siblingCount, boundaryCount) {
    siblingCount = siblingCount == null ? 1 : siblingCount;
    boundaryCount = boundaryCount == null ? 1 : boundaryCount;
    if (total <= 1) return [1];
    const totalNumbers = boundaryCount * 2 + siblingCount * 2 + 3;
    if (total <= totalNumbers) return range(1, total);

    const leftSibling = Math.max(current - siblingCount, 1);
    const rightSibling = Math.min(current + siblingCount, total);
    const showLeftEllipsis = leftSibling > boundaryCount + 2;
    const showRightEllipsis = rightSibling < total - boundaryCount - 1;

    if (!showLeftEllipsis && showRightEllipsis) {
      const leftItemCount = boundaryCount + siblingCount * 2 + 2;
      return [...range(1, leftItemCount), '...', ...range(total - boundaryCount + 1, total)];
    }
    if (showLeftEllipsis && !showRightEllipsis) {
      const rightItemCount = boundaryCount + siblingCount * 2 + 2;
      return [...range(1, boundaryCount), '...', ...range(total - rightItemCount + 1, total)];
    }
    if (showLeftEllipsis && showRightEllipsis) {
      return [...range(1, boundaryCount), '...', ...range(leftSibling, rightSibling), '...', ...range(total - boundaryCount + 1, total)];
    }
    return range(1, total);
  }
  window.PGN_pageWindow = pageWindow; // exposed for the dev "how it's computed" demo

  /* =========================================================================
     FACTORY — .pgn (pager)
     o: { total, pageSize, page, pageSizeOptions, showPageSize, compact,
          disabled, loading, onChange(page), onPageSizeChange(size) }
     ========================================================================= */
  const DEFAULT_SIZES = [5, 10, 15, 20, 50, 'all'];
  function sizeLabel(v) { return v === 'all' ? 'Все' : String(v); }
  function totalPages(total, pageSize) { return pageSize === 'all' ? 1 : Math.max(1, Math.ceil(total / pageSize)); }

  function buildPager(o = {}) {
    const opts = Object.assign({
      total: 800, pageSize: 50, page: 1, pageSizeOptions: DEFAULT_SIZES,
      showPageSize: true, compact: false, responsive: true,
      onChange: null, onPageSizeChange: null,
    }, o);

    const host = document.createElement('div');
    host.className = 'pgn' + (opts.compact ? ' pgn--compact' : '');

    const tp = totalPages(opts.total, opts.pageSize);
    const page = Math.min(Math.max(1, opts.page), tp);

    /* ---------- pagesize — неинтерактивный текст + IconButton-M чеврон ---------- */
    if (opts.showPageSize) {
      const CHEV_D = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
      const anchor = document.createElement('span');
      anchor.className = 'pgn__pagesize ddl-anchor';
      const label = document.createElement('span');
      label.className = 'pgn__pagesize-label';
      label.innerHTML = 'Показывать строк: <b>' + sizeLabel(opts.pageSize) + '</b>';
      const trg = document.createElement('button');
      trg.type = 'button';
      trg.className = 'pgn__pagesize-btn';
      trg.setAttribute('aria-haspopup', 'listbox');
      trg.setAttribute('aria-label', 'Изменить размер страницы');
      trg.innerHTML = icon('chevron-down') || CHEV_D;
      const list = document.createElement('div');
      list.className = 'ddl ddl--floating';
      list.setAttribute('role', 'listbox');
      opts.pageSizeOptions.forEach((v) => {
        const it = document.createElement('button');
        it.type = 'button';
        it.className = 'ddl__item';
        it.setAttribute('role', 'option');
        it.setAttribute('aria-selected', String(v === opts.pageSize));
        it.innerHTML = '<span class="ddl__item-body"><span class="ddl__item-label">' + sizeLabel(v) + '</span></span>';
        it.addEventListener('click', () => {
          set(false);
          if (opts.onPageSizeChange) opts.onPageSizeChange(v);
        });
        list.appendChild(it);
      });
      anchor.append(label, trg, list);
      host.appendChild(anchor);

      let open = false;
      function place() {
        list.style.minWidth = trg.offsetWidth + 'px';
        const ar = anchor.getBoundingClientRect();
        const vh = document.documentElement.clientHeight;
        const fr = trg.getBoundingClientRect();
        const lh = list.offsetHeight, gap = 6;
        let placement = 'bottom';
        if ((vh - fr.bottom) < lh + gap && fr.top > lh) placement = 'top';
        const y = placement === 'top' ? (fr.top - ar.top) - gap - lh : (fr.bottom - ar.top) + gap;
        list.style.left = Math.round(fr.left - ar.left) + 'px';
        list.style.top = Math.round(y) + 'px';
        list.style.setProperty('--ddl-origin', (placement === 'top' ? 'bottom' : 'top') + ' left');
      }
      function set(v) {
        open = v;
        list.classList.toggle('is-open', open);
        trg.classList.toggle('is-open', open);
        if (open) { place(); document.addEventListener('pointerdown', outside, true); document.addEventListener('keydown', onEsc); }
        else { document.removeEventListener('pointerdown', outside, true); document.removeEventListener('keydown', onEsc); }
      }
      function outside(e) { if (!anchor.contains(e.target)) set(false); }
      function onEsc(e) { if (e.key === 'Escape') set(false); }
      trg.addEventListener('click', () => set(!open));
      window.addEventListener('resize', () => { if (open) place(); });
    }

    /* ---------- range ---------- */
    const rangeEl = document.createElement('span');
    rangeEl.className = 'pgn__range';
    rangeEl.textContent = page + ' из ' + tp;
    host.appendChild(rangeEl);

    /* ---------- nav (перестраиваемый: число номеров зависит от tier) ---------- */
    const CHEV_L = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>';
    const CHEV_R = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>';
    const nav = document.createElement('nav');
    nav.className = 'pgn__nav';
    nav.setAttribute('aria-label', 'Страницы');

    function makeArrow(dir) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'pgn__arrow';
      b.setAttribute('aria-label', dir < 0 ? 'Предыдущая страница' : 'Следующая страница');
      b.innerHTML = dir < 0 ? (icon('chevron-left') || CHEV_L) : (icon('chevron-right') || CHEV_R);
      const atBound = dir < 0 ? page <= 1 : page >= tp;
      if (atBound) b.setAttribute('aria-disabled', 'true');
      b.addEventListener('click', () => {
        const target = page + dir;
        if (target >= 1 && target <= tp && opts.onChange) opts.onChange(target);
      });
      return b;
    }

    /* уровни деградации навигации — от полного набора к «стрелки + N из M» */
    const LEVELS = [
      { t: 'l',  sibling: 1, boundary: 1, mode: 'nums' },
      { t: 'm',  sibling: 0, boundary: 1, mode: 'nums' },
      { t: 'sm', sibling: 0, boundary: 0, mode: 'current' },
      { t: 'c',  sibling: 0, boundary: 0, mode: 'compact' },
    ];
    const LEVEL_XS = { t: 'xs', sibling: 0, boundary: 0, mode: 'compact' };

    function navItems(level) {
      if (level.mode === 'compact') return [];
      if (level.mode === 'current') return [page];
      return pageWindow(page, tp, level.sibling, level.boundary);
    }

    function renderNav(level) {
      nav.innerHTML = '';
      nav.appendChild(makeArrow(-1));
      navItems(level).forEach((p) => {
        if (p === '...') {
          const e = document.createElement('span'); e.className = 'pgn__ellipsis';
          e.setAttribute('aria-hidden', 'true'); e.textContent = '\u2026'; nav.appendChild(e);
          return;
        }
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'pgn__num'; b.textContent = String(p);
        b.setAttribute('aria-label', 'Страница ' + p);
        if (p === page) b.setAttribute('aria-current', 'page');
        else b.addEventListener('click', () => { if (opts.onChange) opts.onChange(p); });
        nav.appendChild(b);
      });
      if (level.mode === 'compact') {
        const r = document.createElement('span'); r.className = 'pgn__range';
        r.textContent = page + ' из ' + tp;
        nav.appendChild(r);
      }
      nav.appendChild(makeArrow(1));
    }
    renderNav(opts.compact ? LEVELS[LEVELS.length - 1] : LEVELS[0]);
    host.appendChild(nav);

    /* ---------- responsive controller — fit по доступному месту ----------
       Уровень выбирается не по порогам вьюпорта, а измерением: сколько места
       остаётся пагинатору после инфо-сводки левого слота. Пока пара
       «сводка + пагинатор» не влезает в одну строку — сокращается пагинатор
       (номера → только текущая → «N из M»); когда сокращать больше нечего,
       строка складывается в вертикаль и сводка получает всю ширину.
       Ничто не обрезается и не выходит за границы строки.
       -------------------------------------------------------------------- */
    const M = { slot: 32, gap: 2, section: 28, pagesize: 0, range: 56, ell: 24, done: false };
    function calibrate() {
      M.section = parseFloat(getComputedStyle(host).columnGap) || 28;
      M.gap = parseFloat(getComputedStyle(nav).columnGap) || 2;
      const n = nav.querySelector('.pgn__num');
      if (n) M.slot = n.getBoundingClientRect().width || M.slot;
      const e = nav.querySelector('.pgn__ellipsis');
      if (e) M.ell = e.getBoundingClientRect().width || M.ell;
      const ps = host.querySelector('.pgn__pagesize');
      M.pagesize = ps ? ps.getBoundingClientRect().width : 0;
      M.range = rangeEl.getBoundingClientRect().width || M.range;
      M.done = true;
    }
    /* требуемая ширина пагинатора на уровне level (+ буфер 8px) */
    function needOf(level) {
      let w = 0, sections = 1;               // sections — nav + опциональные pagesize/range
      if (M.pagesize) { w += M.pagesize; sections++; }
      if (level.mode === 'compact') {
        w += 2 * M.slot + M.range + 16 + M.gap * 2;   // range переезжает внутрь nav (padding 0 8px)
      } else {
        const items = navItems(level);
        const nums = items.filter((p) => p !== '...').length;
        w += M.range; sections++;
        w += (2 + nums) * M.slot + (items.length - nums) * M.ell + M.gap * (items.length + 1);
      }
      return w + M.section * (sections - 1) + 8;
    }
    /* ширина инфо-сводки: full — в одну строку, min — самый широкий пункт
       (пункты можно переносить, но не резать) */
    function leftNeed(row) {
      const left = row && row.querySelector('.pgn-row__left');
      const info = left && left.firstElementChild;
      if (!info) return { full: 0, min: 0, count: 0 };
      const kids = Array.prototype.filter.call(info.children, (el) => el.getBoundingClientRect().width > 0);
      if (!kids.length) { const w = left.getBoundingClientRect().width; return { full: w, min: w, count: 1 }; }
      const gap = parseFloat(getComputedStyle(info).columnGap) || 24;
      let full = gap * (kids.length - 1), min = 0;
      kids.forEach((el) => { const w = el.getBoundingClientRect().width; full += w; if (w > min) min = w; });
      return { full, min, count: kids.length };
    }
    let applied = '', appliedIdx = 0;
    function apply(level, layout, idx) {
      const key = level.t + '|' + layout + '|' + page + '|' + tp;
      appliedIdx = idx;
      if (applied === key) return;
      applied = key;
      host.dataset.tier = level.t;
      host.classList.toggle('pgn--compact', level.mode === 'compact');
      renderNav(level);
      const row = host.closest('.pgn-row');
      if (!row) return;
      const footer = row.closest('.pgn-footer');
      const rows = footer ? footer.querySelectorAll(':scope > .pgn-row') : [row];
      Array.prototype.forEach.call(rows, (r) => { r.dataset.tier = level.t; r.dataset.layout = layout; });
    }
    /* HYST — переход к менее компактному уровню требует запаса, иначе рост высоты
       строки (появление скроллбара у контейнера) вызывает дребезг решения */
    const HYST = 24;
    function fit() {
      const row = host.closest('.pgn-row');
      const box = row || host.parentElement || host;
      const cs = getComputedStyle(box);
      const inner = box.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
      if (!(inner > 0)) return;
      if (!M.done) calibrate();
      const L = leftNeed(row);
      const gapRow = L.full ? (parseFloat(cs.columnGap) || 20) : 0;
      const stacked = row && row.dataset.layout === 'stack';
      /* первый уровень, влезающий в avail; подъём к более полному набору — с запасом */
      function pick(avail, hyst) {
        for (let i = 0; i < LEVELS.length; i++) {
          if (needOf(LEVELS[i]) <= avail - (hyst && (i < appliedIdx || stacked) ? HYST : 0)) return i;
        }
        return -1;
      }
      /* Выбираем раскладку по правилу «максимум номеров»: если в одну строку
         помещается не хуже, чем в вертикаль — остаёмся в строке (колонтитул ниже);
         иначе складываемся в вертикаль — там сводка и пагинатор получают всю ширину. */
      const iRow = pick(inner - L.full - gapRow, true);
      const iStack = pick(inner, false);
      if (iRow >= 0 && (iStack < 0 || iRow <= iStack)) { apply(LEVELS[iRow], 'row', iRow); return; }
      if (iStack >= 0) { apply(LEVELS[iStack], 'stack', iStack); return; }
      apply(LEVEL_XS, 'stack', LEVELS.length);
    }
    /* один пересчёт на кадр + предохранитель от осцилляции (скроллбар контейнера) */
    let raf = 0, hits = 0, since = 0, lastW = -1, tail = 0;
    /* Отброшенный вызов не теряется: любое гашение (кадр уже запланирован
       или сработал предохранитель) ставит хвостовой пересчёт по покою —
       иначе после быстрого ресайза финальная ширина осталась бы без пересчёта */
    function scheduleTail() {
      clearTimeout(tail);
      tail = setTimeout(() => { tail = 0; hits = 0; since = 0; fit(); }, 300);
    }
    function scheduleFit() {
      if (raf) { scheduleTail(); return; }
      const run = () => {
        raf = 0;
        const now = Date.now();
        if (now - since > 400) { since = now; hits = 0; }
        if (++hits > 8) { scheduleTail(); return; }
        fit();
      };
      raf = 1;
      if (typeof requestAnimationFrame === 'function' && !document.hidden) requestAnimationFrame(run);
      else setTimeout(run, 16);
    }
    host.__pgnFit = fit;
    const AUTO = !opts.compact && opts.responsive !== false;
    if (AUTO && typeof ResizeObserver !== 'undefined') {
      /* бутстрап без rAF: на скрытой вкладке (document.hidden) кадры не идут вовсе */
      const boot = () => {
        const measured = host.closest('.pgn-row') || host.parentElement || host;
        calibrate();
        setTimeout(fit, 0);   /* первый расчёт вне доставки RO — без loop-предупреждения */
        /* реагируем только на изменение ШИРИНЫ: высоту меняет сам пересчёт —
           если слушать её, RO зацикливается */
        const ro = new ResizeObserver((es) => {
          if (!host.isConnected) { ro.disconnect(); return; }
          const w = Math.round(es[0].contentRect.width);
          if (w === lastW && applied) return;
          lastW = w;
          scheduleFit();
        });
        ro.observe(measured);
      };
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
      else setTimeout(boot, 0);
      /* если на момент бутстрапа ширины ещё не было (display:none, скрытая вкладка) — догоняем */
      const retry = () => { if (host.isConnected && !applied) fit(); };
      document.addEventListener('visibilitychange', retry);
      window.addEventListener('load', retry);
    }

    return host;
  }
  window.PGN_build = buildPager;

  /* ---------- Action_panel (bulk selection) ---------- */
  function buildBulk(o = {}) {
    const opts = Object.assign({ count: 4, actions: ['Экспорт', 'Согласовать', 'Удалить'] }, o);
    const host = document.createElement('div');
    host.className = 'pgn-bulk';
    const c = document.createElement('span'); c.className = 'pgn-bulk__count';
    c.innerHTML = 'Выбрано строк: <b>' + opts.count + '</b>';
    const acts = document.createElement('div'); acts.className = 'pgn-bulk__actions';
    opts.actions.forEach((label) => {
      const b = document.createElement('button'); b.type = 'button';
      b.className = 'btn btn--s btn--outline';
      b.textContent = label; acts.appendChild(b);
    });
    host.append(c, acts);
    return host;
  }
  window.PGN_buildBulk = buildBulk;

  /* ---------- Pagi_counters (info summary) ---------- */
  function buildInfo(o = {}) {
    const opts = Object.assign({ items: [['Сумма дохода', '23 597 млрд ₽']], warn: 'Превышение лимита' }, o);
    const host = document.createElement('div'); host.className = 'pgn-info';
    opts.items.forEach(([label, value]) => {
      const it = document.createElement('span'); it.className = 'pgn-info__item';
      it.innerHTML = escapeHtml(label) + ': <b>' + escapeHtml(value) + '</b>';
      host.appendChild(it);
    });
    if (opts.warn) {
      const w = document.createElement('span'); w.className = 'pgn-info__warn'; w.innerHTML = WARN + '<span>' + escapeHtml(opts.warn) + '</span>';
      host.appendChild(w);
    }
    return host;
  }
  window.PGN_buildInfo = buildInfo;

  /* ---------- Row composition ---------- */
  function buildRow(o = {}) {
    const host = document.createElement('div'); host.className = 'pgn-row';
    const left = document.createElement('div'); left.className = 'pgn-row__left';
    if (o.info) left.appendChild(buildInfo(o.info));
    const right = document.createElement('div'); right.className = 'pgn-row__right';
    right.appendChild(buildPager(o.pager || {}));
    host.append(left, right);
    return host;
  }
  window.PGN_buildRow = buildRow;

  /* ---------- Footer composition — Action_panel (опционально, НАД) + обычная строка ---------- */
  function buildFooter(o = {}) {
    const wrap = document.createElement('div'); wrap.className = 'pgn-footer';
    const selectionCount = o.selectionCount || 0;
    if (selectionCount > 0) {
      const bulkRow = document.createElement('div'); bulkRow.className = 'pgn-row pgn-row--bulk';
      bulkRow.appendChild(buildBulk(Object.assign({ count: selectionCount }, o.bulk || {})));
      wrap.appendChild(bulkRow);
      const dvd = document.createElement('hr'); dvd.className = 'dvd dvd--h';
      wrap.appendChild(dvd);
    }
    wrap.appendChild(buildRow(o));
    return wrap;
  }
  window.PGN_buildFooter = buildFooter;
  window.DSPagination = {
    pager: buildPager, row: buildRow, footer: buildFooter,
    bulk: buildBulk, info: buildInfo,
    pageWindow: pageWindow, totalPages: totalPages, sizeLabel: sizeLabel, SIZES: DEFAULT_SIZES,
  };

  /* автоподключение: <div data-pagination data-total="800" data-page="3" data-page-size="50"></div> */
  function boot(root) {
    (root || document).querySelectorAll('[data-pagination]').forEach(function (host) {
      if (host.__dsPgn) return;
      var d = host.dataset;
      var state = {
        total: +d.total || 0,
        page: +d.page || 1,
        pageSize: d.pageSize === 'all' ? 'all' : (+d.pageSize || 20),
        showPageSize: d.pageSize !== 'off',
        selectionCount: +d.selection || 0,
        left: d.left || 'none',
      };
      function draw() {
        host.innerHTML = '';
        host.appendChild(buildFooter(Object.assign({}, state, {
          onChange: function (p) { state.page = p; draw(); host.dispatchEvent(new CustomEvent('pagechange', { detail: { page: p }, bubbles: true })); },
          onPageSizeChange: function (v) { state.pageSize = v; state.page = 1; draw(); host.dispatchEvent(new CustomEvent('pagesizechange', { detail: { pageSize: v }, bubbles: true })); },
        })));
      }
      host.__dsPgn = { state: state, redraw: draw };
      draw();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { boot(document); });
  else boot(document);
  window.DSPagination.wireAll = boot;
})();
