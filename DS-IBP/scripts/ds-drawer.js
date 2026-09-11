/* =========================================================================
   DS Drawer — рантайм панели деталей (out-of-box).
   Зависимости: styles/drawer.css, styles/modal.css, scripts/ds-modal.js.

   Слой Drawer НЕ пишет: скрим, портал в body, блокировку прокрутки, inert
   фона, focus trap, стек, Esc и возврат фокуса даёт ds-modal.js — один
   механизм на всю ДС. Здесь только то, что принадлежит именно панели:
   разрешение триггера, класс скрима и договор о закрытии.

   Экспорт: window.DSDrawer = {
     open(scrim, opts) → api        — открыть панель
     bind(trigger, opts) → api|null — открытие по клику на триггер
     bindAll(root)                  — обойти [data-drawer] внутри root
     close() · current() → api|null
   }

   Автоподключение (без единой строки кода на экране):
     <button data-drawer="d1">Открыть</button>
     <div class="modal-scrim drawer-scrim" id="d1" hidden>
       <aside class="drawer drawer--w4" role="dialog" aria-modal="true">…</aside>
     </div>
   Настройки на триггере: data-drawer-guarded (клик мимо не закрывает —
   панель с несохранённой формой). Закрытие: крестик .drawer__close button,
   любой [data-modal-close], Esc, клик мимо панели.
   ========================================================================= */
(function () {
  'use strict';

  function need() { return !!window.DSModal; }

  /* Скрим панели обязан нести .drawer-scrim: без него панель встанет по
     центру с охранным полем Modal, то есть перестанет быть панелью. */
  function prep(scrim) {
    if (!scrim) return null;
    if (!scrim.classList.contains('modal-scrim')) scrim.classList.add('modal-scrim');
    if (!scrim.classList.contains('drawer-scrim')) scrim.classList.add('drawer-scrim');
    return scrim;
  }

  function open(scrim, opts) {
    if (!prep(scrim) || !need()) return null;
    return DSModal.open(scrim, opts || {});
  }

  function resolve(trigger, opts) {
    if (opts && opts.scrim) return opts.scrim;
    var id = trigger.getAttribute('data-drawer');
    if (id) return document.getElementById(id);
    var next = trigger.nextElementSibling;
    return next && next.classList.contains('modal-scrim') ? next : null;
  }

  function bind(trigger, opts) {
    opts = opts || {};
    if (trigger.__dsDrawerBound) return trigger.__dsDrawerBound;
    var scrim = prep(resolve(trigger, opts));
    if (!scrim) return null;
    var d = trigger.dataset || {};
    trigger.setAttribute('aria-haspopup', 'dialog');
    if (scrim.id) trigger.setAttribute('aria-controls', scrim.id);
    var api = {
      trigger: trigger, scrim: scrim,
      open: function () {
        return open(scrim, {
          guarded: opts.guarded != null ? opts.guarded : d.drawerGuarded != null,
          returnFocus: trigger,
          onOpen: opts.onOpen, onClose: opts.onClose
        });
      }
    };
    trigger.addEventListener('click', function (e) { e.preventDefault(); api.open(); });
    trigger.__dsDrawerBound = api;
    return api;
  }

  function bindAll(root) {
    (root || document).querySelectorAll('[data-drawer]').forEach(function (t) { bind(t); });
  }

  function close() { return need() ? DSModal.closeTop() : null; }
  function current() { return need() ? DSModal.current() : null; }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { bindAll(document); });
  } else { bindAll(document); }

  window.DSDrawer = {
    open: open, bind: bind, bindAll: bindAll, close: close, current: current
  };
})();
