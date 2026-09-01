/* =========================================================================
   DS Tile — рантайм плашки-аккордеона (out-of-box).
   Зависимости: styles/tile.css.

   Экспорт: window.DSTile = {
     wire(tileEl, opts) → api      — оживить один аккордеон
     wireAll(root)                 — обойти .tile--accordion
     toggle(tileEl, collapsed)     — программно свернуть / развернуть
   }
   api: { el, toggle(v), collapsed() }

   Подключение — разметкой, без атрибутов: любой .tile--accordion с кнопкой
   .tile__toggle оживает сам.
     <section class="tile tile--accordion">
       <header class="tile__header">…
         <button class="tile__toggle" aria-expanded="true">
           <span class="tile__chevron"><i data-icon="chevron-down"></i></span>
         </button>
       </header>
       <div class="tile__collapsible">…</div>
     </section>
   Свёрнутое состояние — класс .tile--collapsed на корне (в разметке можно
   задать сразу, рантайм подхватит и выставит aria-expanded).
   События: 'tiletoggle' с { collapsed } всплывает с корня плашки.
   ========================================================================= */
(function () {
  'use strict';

  function collapsed(tile) { return tile.classList.contains('tile--collapsed'); }

  function apply(tile, next) {
    tile.classList.toggle('tile--collapsed', next);
    var toggle = tile.querySelector('.tile__toggle');
    if (toggle) {
      toggle.setAttribute('aria-expanded', String(!next));
      toggle.setAttribute('aria-label', next ? 'Развернуть' : 'Свернуть');
      /* связываем кнопку с областью, которой она управляет */
      var body = tile.querySelector('.tile__collapsible');
      if (body) {
        if (!body.id) body.id = 'tile-collapsible-' + Math.random().toString(36).slice(2, 8);
        toggle.setAttribute('aria-controls', body.id);
      }
    }
    tile.dispatchEvent(new CustomEvent('tiletoggle', { detail: { collapsed: next }, bubbles: true }));
  }

  function wire(tile, opts) {
    if (!tile || tile.__dsTile) return tile && tile.__dsTile;
    opts = opts || {};
    var toggle = tile.querySelector('.tile__toggle');
    if (!toggle) return null;
    /* исходное состояние берём из разметки: класс важнее атрибута */
    apply(tile, opts.collapsed != null ? opts.collapsed : collapsed(tile));
    if (opts.onToggle) tile.addEventListener('tiletoggle', function (e) { opts.onToggle(e.detail.collapsed, tile); });
    var api = {
      el: tile,
      toggle: function (v) { apply(tile, v != null ? v : !collapsed(tile)); return api; },
      collapsed: function () { return collapsed(tile); },
    };
    tile.__dsTile = api;
    return api;
  }

  function wireAll(root) {
    (root || document).querySelectorAll('.tile--accordion').forEach(function (t) { wire(t); });
  }

  /* клик обрабатывается делегированием: плашки, перерисованные конструктором
     или пришедшие с сервера, работают без повторной инициализации */
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('.tile__toggle');
    if (!t) return;
    var tile = t.closest('.tile');
    if (tile) apply(tile, !collapsed(tile));
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { wireAll(document); });
  else wireAll(document);

  window.DSTile = {
    wire: wire, wireAll: wireAll,
    toggle: function (tile, v) { var a = wire(tile); return a && a.toggle(v); },
  };
})();
