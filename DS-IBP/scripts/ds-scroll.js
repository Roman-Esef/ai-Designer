/* =========================================================================
   DS Scroll — появление и затухание бегунка у .ds-scroll (Layout 1.011).

   Вид полосы прокрутки — styles/layout.css (.ds-scroll): только бегунок,
   в покое скрыт. Здесь одно: пока область прокручивается, на ней стоит
   класс .is-scrolling, и через HIDE_AFTER мс после остановки он снимается —
   плавное затухание делает переход в CSS.

   Слушатель один, делегированный: событие scroll не всплывает, поэтому он
   стоит на document в фазе захвата и видит прокрутку любого элемента.
   Привязывать ничего не нужно — работает и для разметки, нарисованной
   скриптом после загрузки.
   ========================================================================= */
(function () {
  'use strict';

  var HIDE_AFTER = 800; /* мс после последнего события scroll */

  document.addEventListener('scroll', function (e) {
    var el = e.target;
    if (!el || !el.classList || !el.classList.contains('ds-scroll')) return;
    el.classList.add('is-scrolling');
    clearTimeout(el.__dsScrollTimer);
    el.__dsScrollTimer = setTimeout(function () {
      el.classList.remove('is-scrolling');
    }, HIDE_AFTER);
  }, { capture: true, passive: true });
})();
