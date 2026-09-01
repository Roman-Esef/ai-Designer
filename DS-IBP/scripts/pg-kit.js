/* =========================================================================
   Playground Kit — прогрессивное улучшение панелей «Конструктор».
   Работает поверх существующей логики страниц, ничего в ней не меняя:
   1. Вставляет Splitter из ДС между настройками (слева, 360px по умолчанию)
      и превью (справа, гибкое) — drag / dblclick / Home — сброс, стрелки
      ← → с клавиатуры двигают именно ширину панели настроек.
   2. Следит за шириной панели настроек: < 520px → одна колонка.
   3. Заменяет селекты из 2–4 коротких опций на SegmentControl из ДС
      (скрытый <select> остаётся источником истины — страница получает
      обычное событие change).
   4. Селекты со списком иконок ДС заменяет на сетку глифов.
   Требует styles/pg-kit.css (импортирует splitter.css и segment-control.css).
   ========================================================================= */
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  /* ---------------- splitter ---------------- */
  function insertSplitter(panel, controls, stage) {
    if (panel.querySelector(':scope > .spl')) return;
    const spl = document.createElement('div');
    spl.className = 'spl';
    spl.setAttribute('role', 'separator');
    spl.setAttribute('aria-orientation', 'vertical');
    spl.setAttribute('aria-label', 'Изменить ширину панелей');
    spl.title = 'Перетащите; двойной клик — сброс';
    spl.tabIndex = 0;
    const grip = document.createElement('span'); grip.className = 'spl__grip';
    for (let i = 0; i < 6; i++) grip.appendChild(document.createElement('i'));
    spl.appendChild(grip);
    panel.insertBefore(spl, stage);

    const DEFAULT_W = 360, MIN_STAGE = 240, MIN_CONTROLS = 280;
    function splW() { return spl.getBoundingClientRect().width || 11; }
    function setControlsW(w) {
      const max = panel.getBoundingClientRect().width - MIN_STAGE - splW();
      panel.style.setProperty('--pg-controls-w', Math.round(Math.min(Math.max(w, MIN_CONTROLS), Math.max(max, MIN_CONTROLS))) + 'px');
    }
    function controlsW() {
      return parseFloat(getComputedStyle(panel).getPropertyValue('--pg-controls-w')) || DEFAULT_W;
    }
    spl.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      spl.setPointerCapture(e.pointerId);
      spl.classList.add('spl--move');
      document.body.classList.add('spl-dragging');
      const startX = e.clientX, startW = controlsW();
      function onMove(ev) { setControlsW(startW + (ev.clientX - startX)); }
      function onUp() {
        spl.classList.remove('spl--move');
        document.body.classList.remove('spl-dragging');
        spl.removeEventListener('pointermove', onMove);
        spl.removeEventListener('pointerup', onUp);
        spl.removeEventListener('pointercancel', onUp);
      }
      spl.addEventListener('pointermove', onMove);
      spl.addEventListener('pointerup', onUp);
      spl.addEventListener('pointercancel', onUp);
    });
    spl.addEventListener('dblclick', () => panel.style.removeProperty('--pg-controls-w'));
    spl.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { setControlsW(controlsW() - 24); e.preventDefault(); }
      else if (e.key === 'ArrowRight') { setControlsW(controlsW() + 24); e.preventDefault(); }
      else if (e.key === 'Home') { panel.style.removeProperty('--pg-controls-w'); e.preventDefault(); }
    });
  }

  /* ---------------- select → SegmentControl ---------------- */
  function trimLabel(t) {
    return t.replace(/\s*\(.*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function buildSeg(box, sel, opts) {
    const rail = document.createElement('div');
    rail.className = 'segctrl segctrl--xs segctrl--fullwidth';
    rail.setAttribute('role', 'radiogroup');
    const thumb = document.createElement('div'); thumb.className = 'segctrl__thumb'; rail.appendChild(thumb);
    const btns = opts.map(([val, txt, full]) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'segctrl__item';
      b.setAttribute('role', 'radio'); b.dataset.val = val;
      if (full && full !== txt) b.title = full;
      b.innerHTML = '<span class="segctrl__label"></span>';
      b.firstChild.textContent = txt;
      b.addEventListener('click', () => {
        if (sel.value === val) return;
        sel.value = val;
        sel.dispatchEvent(new Event('change', { bubbles: true }));
        sync();
      });
      rail.appendChild(b); return b;
    });
    function sync() {
      const cur = sel.value;
      let on = null;
      btns.forEach(b => { const is = b.dataset.val === cur; b.setAttribute('aria-checked', String(is)); if (is) on = b; });
      if (on && on.offsetWidth) {
        thumb.style.width = on.offsetWidth + 'px';
        thumb.style.transform = 'translateX(' + on.offsetLeft + 'px)';
        thumb.classList.add('is-visible');
      }
    }
    box.style.display = 'none';
    box.after(rail);
    sel.addEventListener('change', sync);
    new ResizeObserver(sync).observe(rail);
    requestAnimationFrame(sync);
  }

  /* ---------------- select → сетка иконок ---------------- */
  const NONE_GLYPH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="8.2"></circle><line x1="6.6" y1="17.4" x2="17.4" y2="6.6"></line></svg>';
  function buildIconPick(ctl, box, sel, opts) {
    const L = window.DS_ICONS || {};
    const grid = document.createElement('div');
    grid.className = 'icnpick';
    grid.setAttribute('role', 'radiogroup');
    const btns = opts.map(([val, txt]) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'icnpick__btn';
      b.setAttribute('role', 'radio'); b.dataset.val = val;
      b.title = txt; b.setAttribute('aria-label', txt);
      b.innerHTML = (val === 'none' || !L[val]) ? NONE_GLYPH : L[val];
      b.addEventListener('click', () => {
        if (sel.value === val) return;
        sel.value = val;
        sel.dispatchEvent(new Event('change', { bubbles: true }));
        sync();
      });
      grid.appendChild(b); return b;
    });
    function sync() { btns.forEach(b => b.setAttribute('aria-checked', String(b.dataset.val === sel.value))); }
    box.style.display = 'none';
    box.after(grid);
    sel.addEventListener('change', sync);
    ctl.classList.add('ctl--span');
    sync();
  }

  function enhanceSelects(controls) {
    controls.querySelectorAll('.ctl').forEach(ctl => {
      const box = ctl.querySelector('.pg-select');
      const sel = box && box.querySelector('select');
      if (!sel || ctl.dataset.pgKeepSelect !== undefined) return;
      const opts = Array.from(sel.options).map(o => [o.value, o.textContent]);
      const L = window.DS_ICONS || {};
      const iconish = opts.filter(([v]) => v !== 'none' && L[v]).length;
      if (opts.length >= 5 && iconish / Math.max(1, opts.length - 1) >= 0.6) {
        buildIconPick(ctl, box, sel, opts);
        return;
      }
      if (opts.length < 2 || opts.length > 4) return;
      const labels = opts.map(([, t]) => trimLabel(t));
      const total = labels.reduce((s, t) => s + t.length, 0);
      /* правило ДС: сегменты не переносятся в 2 ряда — длинные списки остаются селектом */
      if (labels.some(t => t.length > 16) || total > 44) return;
      if (total > 22) ctl.classList.add('ctl--span');
      buildSeg(box, sel, opts.map(([v, full], i) => [v, labels[i], full]));
    });
  }

  /* ---------------- адаптивная сетка настроек: 1 колонка по умолчанию,
     2 — когда пользователь расширил панель сплиттером ---------------- */
  function observeNarrow(controls) {
    new ResizeObserver(() => {
      controls.classList.toggle('pg__controls--wide', controls.clientWidth >= 640);
    }).observe(controls);
  }


  // самодостаточность: подтягиваем свой стиль, если страница его не подключила
  function ensureCss() {
    if (document.querySelector('link[rel="stylesheet"][href$="pg-kit.css"]')) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = (window.__DS_ROOT || '') + 'styles/pg-kit.css';
    document.head.appendChild(l);
  }

  ready(() => {
    if (document.querySelector('.panel.pg')) ensureCss();
    document.querySelectorAll('.panel.pg').forEach(panel => {
      const controls = panel.querySelector(':scope > .pg__controls');
      const stage = panel.querySelector(':scope > .pg__stage');
      if (!controls || !stage) return;
      if (panel.dataset.pgNoSplit === undefined) insertSplitter(panel, controls, stage);
      enhanceSelects(controls);
      observeNarrow(controls);
    });
  });
})();
