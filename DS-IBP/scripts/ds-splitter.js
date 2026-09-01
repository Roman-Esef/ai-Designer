/* =========================================================================
   DS Splitter — рантайм функционального разделителя панелей (out-of-box).
   Зависимости: styles/splitter.css.

   Экспорт: window.DSSplitter = {
     make(opts) → HTMLElement       — один сплиттер .spl (без панелей)
     pane(opts) → { wrap, spl, a, b, setPct(v), value() }  — готовая пара панелей
     wire(splEl, opts) → api        — оживить сплиттер в уже свёрстанной разметке
     wireAll(root)                  — обойти [data-splitter]
   }

   Автоподключение: поставить data-splitter на .splitpane — рантайм найдёт
   внутри .spl и соседние .splitpane__panel и оживит их:
     <div class="splitpane" data-splitter data-min="25" data-max="75" data-initial="50">
       <div class="splitpane__panel splitpane__a">…</div>
       <div class="spl" role="separator"><span class="spl__grip">…</span></div>
       <div class="splitpane__panel splitpane__b">…</div>
     </div>

   Поведение по спеке Splitter: перетаскивание с pointer capture и курсором,
   зафиксированным на body (работает поверх любых элементов под курсором),
   ограничение min/max, стрелки с шагом 2% (Shift — 10%), Home/End,
   aria-valuemin/max/now, двойной клик — сброс к исходному значению.
   ========================================================================= */
(function () {
  'use strict';

  function make(o) {
    o = o || {};
    var orientation = o.orientation || 'v', state = o.state || 'default';
    var el = document.createElement('div');
    el.className = 'spl' + (orientation === 'h' ? ' spl--h' : '');
    if (state === 'hover') el.classList.add('spl--hover');
    if (state === 'move') el.classList.add('spl--move');
    if (state === 'disabled') el.classList.add('spl--disabled');
    el.setAttribute('role', 'separator');
    el.setAttribute('aria-orientation', orientation === 'h' ? 'horizontal' : 'vertical');
    el.setAttribute('aria-label', o.label || 'Изменить размер панелей');
    if (state !== 'disabled') el.tabIndex = 0;
    var grip = document.createElement('span'); grip.className = 'spl__grip';
    for (var i = 0; i < 6; i++) grip.appendChild(document.createElement('i'));
    el.appendChild(grip);
    return el;
  }

  /* оживляет сплиттер, у которого панели A и B — его соседи в .splitpane */
  function wire(spl, o) {
    o = o || {};
    if (!spl || spl.__dsSpl) return spl && spl.__dsSpl;
    var wrap = o.wrap || spl.parentElement;
    var a = o.a || spl.previousElementSibling;
    var b = o.b || spl.nextElementSibling;
    if (!wrap || !a || !b) return null;

    var horiz = o.orientation ? o.orientation === 'h'
      : (spl.classList.contains('spl--h') || wrap.classList.contains('splitpane--h'));
    var min = o.min != null ? o.min : 20;
    var max = o.max != null ? o.max : 80;
    var initial = o.initial != null ? o.initial : 50;
    var step = o.step != null ? o.step : 2;
    var bigStep = o.bigStep != null ? o.bigStep : 10;
    var pct = Math.max(min, Math.min(max, initial));

    function apply() {
      a.style.flex = '0 0 ' + pct + '%';
      b.style.flex = '1 1 auto';
      spl.setAttribute('aria-valuemin', String(min));
      spl.setAttribute('aria-valuemax', String(max));
      spl.setAttribute('aria-valuenow', String(Math.round(pct)));
      if (o.onChange) o.onChange(Math.round(pct));
    }

    var dragging = false;
    function pointerPct(clientPos) {
      var r = wrap.getBoundingClientRect();
      var total = horiz ? r.height : r.width;
      var offset = horiz ? (clientPos - r.top) : (clientPos - r.left);
      return Math.max(min, Math.min(max, offset / total * 100));
    }
    spl.addEventListener('pointerdown', function (e) {
      if (spl.classList.contains('spl--disabled')) return;
      dragging = true;
      spl.classList.add('spl--move');
      /* курсор держим на body: под указателем во время перетаскивания
         оказываются чужие элементы со своими курсорами */
      document.body.classList.add(horiz ? 'spl-dragging-h' : 'spl-dragging');
      spl.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    spl.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      pct = pointerPct(horiz ? e.clientY : e.clientX);
      apply();
    });
    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      spl.classList.remove('spl--move');
      document.body.classList.remove('spl-dragging', 'spl-dragging-h');
      try { spl.releasePointerCapture(e.pointerId); } catch (_) {}
    }
    spl.addEventListener('pointerup', endDrag);
    spl.addEventListener('pointercancel', endDrag);

    spl.addEventListener('keydown', function (e) {
      var s = e.shiftKey ? bigStep : step, used = true;
      if (horiz) {
        if (e.key === 'ArrowUp') pct = Math.max(min, pct - s);
        else if (e.key === 'ArrowDown') pct = Math.min(max, pct + s);
        else used = false;
      } else {
        if (e.key === 'ArrowLeft') pct = Math.max(min, pct - s);
        else if (e.key === 'ArrowRight') pct = Math.min(max, pct + s);
        else used = false;
      }
      if (e.key === 'Home') { pct = min; used = true; }
      if (e.key === 'End') { pct = max; used = true; }
      if (used) { e.preventDefault(); apply(); }
    });
    if (o.resetOnDblClick !== false) {
      spl.addEventListener('dblclick', function () { pct = Math.max(min, Math.min(max, initial)); apply(); });
    }

    apply();
    var api = {
      wrap: wrap, spl: spl, a: a, b: b,
      setPct: function (v) { pct = Math.max(min, Math.min(max, v)); apply(); },
      value: function () { return Math.round(pct); },
    };
    spl.__dsSpl = api;
    return api;
  }

  /* собирает пару панелей вместе со сплиттером */
  function pane(o) {
    o = o || {};
    var horiz = o.orientation === 'h';
    var wrap = document.createElement('div');
    wrap.className = 'splitpane' + (horiz ? ' splitpane--h' : '');
    if (o.height) wrap.style.height = o.height + 'px';

    var a = document.createElement('div'); a.className = 'splitpane__panel splitpane__a';
    var b = document.createElement('div'); b.className = 'splitpane__panel splitpane__b';
    if (o.buildLeft) o.buildLeft(a);
    else a.innerHTML = '<span class="splitpane__ph">' + (o.leftLabel || 'Левая панель') + '</span>';
    if (o.buildRight) o.buildRight(b);
    else b.innerHTML = '<span class="splitpane__ph">' + (o.rightLabel || 'Правая панель') + '</span>';

    var spl = make({ orientation: o.orientation || 'v', label: o.label });
    wrap.appendChild(a); wrap.appendChild(spl); wrap.appendChild(b);
    var api = wire(spl, Object.assign({}, o, { wrap: wrap, a: a, b: b }));
    return Object.assign({ wrap: wrap }, api);
  }

  function wireAll(root) {
    (root || document).querySelectorAll('[data-splitter]').forEach(function (host) {
      /* :scope > .spl — ТОЛЬКО прямой ребёнок хоста. Наивный host.querySelector('.spl')
         брал первый .spl-потомок вообще: на странице Splitter демо-сплиттер
         (page.js рисует его в #pg-stage внутри панели A, до фреймового разделителя)
         перехватывал выбор, и фреймовый .spl оставался незаведённым (30.08.2026). */
      var spl = host.classList.contains('spl') ? host : host.querySelector(':scope > .spl');
      if (!spl) return;
      var d = host.dataset;
      wire(spl, {
        min: d.min != null ? +d.min : undefined,
        max: d.max != null ? +d.max : undefined,
        initial: d.initial != null ? +d.initial : undefined,
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { wireAll(document); });
  else wireAll(document);

  window.DSSplitter = { make: make, pane: pane, wire: wire, wireAll: wireAll };
})();
