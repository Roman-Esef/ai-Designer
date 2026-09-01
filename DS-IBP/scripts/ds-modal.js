/* =========================================================================
   DS Modal — рантайм модального окна (out-of-box).
   Зависимости: styles/modal.css. Иконки в разметке — <i data-icon> как обычно.

   Экспорт: window.DSModal = {
     open(scrim, opts) → api        — смонтировать и открыть слой
     bind(trigger, opts) → api|null — открытие по клику на триггер
     bindAll(root)                  — обойти [data-modal] внутри root
     wireScroll(modal)              — тени шапки/подвала при прокрутке тела
     closeTop() · closeAll() · current() → api|null · stack() → api[]
   }

   Автоподключение (без единой строки кода на экране):
     <button data-modal="m1">Открыть</button>
     <div class="modal-scrim" id="m1" hidden>
       <div class="modal modal--w6" role="dialog" aria-modal="true">…</div>
     </div>
   Настройки на триггере: data-modal-guarded (клик по скриму не закрывает —
   форма с несохранённым вводом), data-modal-nested (открыть поверх текущего слоя).
   Закрытие: крестик .modal__close button, любой [data-modal-close], Esc,
   клик по скриму. Всё по спеке Modal: портал в body, блокировка прокрутки
   страницы, inert фона, focus trap, возврат фокуса на инициатора.
   ========================================================================= */
(function () {
  'use strict';

  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  var layers = [];          /* стек открытых слоёв, последний — верхний */
  var savedOverflow = '', savedPadRight = '';

  function top() { return layers.length ? layers[layers.length - 1] : null; }

  function visible(el) { return el.offsetParent !== null || el.getClientRects().length > 0; }

  function focusables(root) {
    return Array.prototype.filter.call(root.querySelectorAll(FOCUSABLE), visible);
  }

  /* прокрутка страницы блокируется один раз — на первом слое; вложенные
     диалоги её не трогают, иначе закрытие вложенного разблокирует фон */
  function lockPage() {
    if (layers.length > 1) return;
    var b = document.body;
    var gap = window.innerWidth - document.documentElement.clientWidth;
    savedOverflow = b.style.overflow;
    savedPadRight = b.style.paddingRight;
    b.style.overflow = 'hidden';
    if (gap > 0) b.style.paddingRight = gap + 'px';
    Array.prototype.forEach.call(b.children, function (el) {
      if (el.classList && el.classList.contains('modal-scrim')) return;
      el.inert = true;
      el.setAttribute('aria-hidden', 'true');
      el.__dsModalHidden = true;
    });
  }

  function unlockPage() {
    if (layers.length) return;
    document.body.style.overflow = savedOverflow;
    document.body.style.paddingRight = savedPadRight;
    Array.prototype.forEach.call(document.body.children, function (el) {
      if (!el.__dsModalHidden) return;
      el.inert = false;
      el.removeAttribute('aria-hidden');
      delete el.__dsModalHidden;
    });
  }

  /* wireScroll — тень у шапки и подвала по прокрутке тела (спека, п.4) */
  function wireScroll(modal) {
    if (!modal || modal.__dsModalScroll) return modal;
    var body = modal.querySelector('.modal__body');
    var head = modal.querySelector('.modal__head');
    var foot = modal.querySelector('.modal__foot');
    if (!body) return modal;
    modal.__dsModalScroll = true;
    function sync() {
      if (head) head.classList.toggle('is-scrolled', body.scrollTop > 1);
      if (foot) foot.classList.toggle('is-scrolled', body.scrollTop + body.clientHeight < body.scrollHeight - 1);
    }
    body.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync, { passive: true });
    requestAnimationFrame(sync);
    modal.__dsModalSyncShadow = sync;
    return modal;
  }

  function firstTarget(modal) {
    var body = modal.querySelector('.modal__body');
    var inBody = body ? focusables(body) : [];
    if (inBody.length) return inBody[0];
    var close = modal.querySelector('.modal__close button, [data-modal-close]');
    if (close) return close;
    return focusables(modal)[0] || null;
  }

  /* ------------------------------------------------------------------ */
  /* open — смонтировать слой                                            */
  /* ------------------------------------------------------------------ */
  function open(scrim, opts) {
    opts = opts || {};
    if (!scrim) return null;
    if (scrim.__dsModal && layers.indexOf(scrim.__dsModal) >= 0) return scrim.__dsModal;

    var d = scrim.dataset || {};
    var conf = {
      guarded: opts.guarded != null ? opts.guarded : d.modalGuarded != null,
      nested: opts.nested != null ? opts.nested : (d.modalNested != null || scrim.classList.contains('modal-scrim--nested')),
      keep: opts.keep != null ? opts.keep : scrim.hasAttribute('hidden'),
      returnFocus: opts.returnFocus !== undefined ? opts.returnFocus : document.activeElement,
      onClose: opts.onClose || null,
    };
    /* верхний слой закрывается, если новый — не вложенный */
    if (!conf.nested) while (layers.length) closeTop();

    var modal = scrim.querySelector('.modal') || scrim;
    if (conf.nested) scrim.classList.add('modal-scrim--nested');
    if (scrim.parentElement !== document.body) document.body.appendChild(scrim);
    scrim.removeAttribute('hidden');
    if (!modal.getAttribute('role')) modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    var api = {
      scrim: scrim, modal: modal, config: conf,
      close: function (ok) { return closeLayer(api, ok); },
      isOpen: function () { return layers.indexOf(api) >= 0; },
    };
    scrim.__dsModal = api;
    layers.push(api);
    lockPage();
    wireScroll(modal);

    var f = firstTarget(modal);
    if (f) f.focus();
    if (opts.onOpen) opts.onOpen(api);
    return api;
  }

  function closeLayer(api, ok) {
    var i = layers.indexOf(api);
    if (i < 0) return api;
    layers.splice(i, 1);
    if (api.config.keep) api.scrim.setAttribute('hidden', '');
    else api.scrim.remove();
    delete api.scrim.__dsModal;
    unlockPage();
    var rf = api.config.returnFocus;
    if (rf && document.contains(rf)) rf.focus();
    if (api.config.onClose) api.config.onClose(ok === true);
    return api;
  }

  function closeTop(ok) { var t = top(); return t ? closeLayer(t, ok) : null; }
  function closeAll() { while (layers.length) closeTop(); }

  /* ------------------------------------------------------------------ */
  /* bind — открытие по триггеру                                         */
  /* ------------------------------------------------------------------ */
  function resolveScrim(trigger, opts) {
    if (opts.scrim) return opts.scrim;
    var id = trigger.getAttribute('data-modal');
    if (id) return document.getElementById(id);
    var next = trigger.nextElementSibling;
    return next && next.classList.contains('modal-scrim') ? next : null;
  }

  function bind(trigger, opts) {
    opts = opts || {};
    if (trigger.__dsModalBound) return trigger.__dsModalBound;
    var scrim = resolveScrim(trigger, opts);
    if (!scrim) return null;
    var d = trigger.dataset || {};
    trigger.setAttribute('aria-haspopup', 'dialog');
    if (scrim.id) trigger.setAttribute('aria-controls', scrim.id);
    var api = {
      trigger: trigger, scrim: scrim,
      open: function () {
        return open(scrim, {
          guarded: opts.guarded != null ? opts.guarded : d.modalGuarded != null,
          nested: opts.nested != null ? opts.nested : d.modalNested != null,
          returnFocus: trigger,
          onOpen: opts.onOpen, onClose: opts.onClose,
        });
      },
    };
    trigger.addEventListener('click', function (e) { e.preventDefault(); api.open(); });
    trigger.__dsModalBound = api;
    return api;
  }

  function bindAll(root) {
    (root || document).querySelectorAll('[data-modal]').forEach(function (t) { bind(t); });
  }

  /* ------------------------------------------------------------------ */
  /* глобальные слушатели: крестик, скрим, Esc, focus trap               */
  /* ------------------------------------------------------------------ */
  document.addEventListener('click', function (e) {
    var t = top();
    if (!t || !e.target.closest) return;
    var closer = e.target.closest('[data-modal-close], .modal__close button');
    if (closer && t.scrim.contains(closer)) { e.preventDefault(); closeTop(); return; }
    /* клик мимо модалки: guarded-форма закрывается только крестиком и Esc */
    if (e.target === t.scrim && !t.config.guarded) closeTop();
  });

  document.addEventListener('keydown', function (e) {
    var t = top();
    if (!t) return;
    if (e.key === 'Escape') { e.stopPropagation(); closeTop(); return; }
    if (e.key !== 'Tab') return;
    var items = focusables(t.modal);
    if (!items.length) return;
    var first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    else if (!t.modal.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
  }, true);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { bindAll(document); });
  else bindAll(document);

  window.DSModal = {
    open: open, bind: bind, bindAll: bindAll, wireScroll: wireScroll,
    closeTop: closeTop, closeAll: closeAll,
    current: top, stack: function () { return layers.slice(); },
  };
})();
