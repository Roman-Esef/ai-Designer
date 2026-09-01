/* =========================================================================
   DS Popover — рантайм поповера (out-of-box).
   Зависимости: styles/popover.css. Иконки в разметке поповера — как обычно
   через icons-data.js + ds-icons.js (рантайм их не требует).

   Экспорт: window.DSPopover = {
     bind(trigger, opts) → api | null      — навесить поведение на триггер
     bindAll(root)                          — обойти [data-popover] внутри root
     place(pop, trigger, opts) → {placement, align}
     watchScroll(pop) → sync()              — тени шапки/подвала при прокрутке тела
     closeAll()                             — закрыть открытый поповер
     current() → api | null
   }

   Автоподключение (без единой строки кода на экране):
     <span class="pop-anchor">
       <button data-popover="pop-1" …>…</button>
       <div id="pop-1" class="pop pop--w-m" role="dialog">…</div>
     </span>
   Значение data-popover — id поповера; пустое значение — ближайший .pop
   внутри .pop-anchor. Настройки триггера: data-popover-placement
   (top|bottom|left|right, по умолчанию bottom), data-popover-align
   (start|center|end, по умолчанию start), data-popover-gap (px, 8),
   data-popover-flip="no" (выключить авто-flip), data-popover-boundary
   (CSS-селектор контейнера-границы, по умолчанию — вьюпорт).

   Поведение по спеке: 12 позиций, авто-flip стороны и выравнивания, стрелка
   доводится до центра триггера, один открытый поповер одновременно,
   5 способов закрытия (✕ / клик вне / Esc / Tab за последний элемент /
   [data-pop-close]), тени шапки и подвала при прокрутке тела.
   ========================================================================= */
(function () {
  'use strict';

  var ARROW_H = 18;   /* совпадает с popover.css: отступ стрелки при top/bottom */
  var ARROW_V = 14;   /* то же при left/right */
  var GAP = 8;        /* зазор от триггера */
  var GUARD = 8;      /* минимальный отступ от края контейнера */
  var ARROW_EDGE = 12;/* стрелка не ближе 12px к углу */

  var OPPOSITE = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
  var PERP = { top: ['right', 'left'], bottom: ['right', 'left'], left: ['bottom', 'top'], right: ['bottom', 'top'] };
  var FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

  var current = null; /* единственный открытый поповер */

  /* ------------------------------------------------------------------ */
  /* геометрия                                                           */
  /* ------------------------------------------------------------------ */
  function bounds(el) {
    if (!el) return { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight };
    var r = el.getBoundingClientRect();
    return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
  }

  function fits(side, tr, br, pw, ph, gap) {
    if (side === 'top') return tr.top - br.top >= ph + gap + GUARD;
    if (side === 'bottom') return br.bottom - tr.bottom >= ph + gap + GUARD;
    if (side === 'left') return tr.left - br.left >= pw + gap + GUARD;
    return br.right - tr.right >= pw + gap + GUARD;
  }

  function setMods(pop, placement, align) {
    pop.classList.remove('pop--top', 'pop--bottom', 'pop--left', 'pop--right', 'pop--start', 'pop--center', 'pop--end');
    pop.classList.add('pop--' + placement, 'pop--' + align);
  }

  /* place — позиционирование + авто-flip. Возвращает выбранные placement/align. */
  function place(pop, trigger, o) {
    o = o || {};
    var gap = o.gap == null ? GAP : o.gap;
    var placement = o.placement || 'bottom';
    var align = o.align || 'start';
    var op = o.offsetParent || pop.offsetParent || pop.parentElement;
    var br = bounds(o.boundary || null);
    var tr = trigger.getBoundingClientRect();
    var pw = pop.offsetWidth, ph = pop.offsetHeight;
    var cx = tr.left + tr.width / 2, cy = tr.top + tr.height / 2;

    if (o.flip !== false && tr.bottom > br.top && tr.top < br.bottom && tr.right > br.left && tr.left < br.right) {
      if (!fits(placement, tr, br, pw, ph, gap)) {
        var cand = [OPPOSITE[placement]].concat(PERP[placement]);
        for (var i = 0; i < cand.length; i++) {
          if (fits(cand[i], tr, br, pw, ph, gap)) { placement = cand[i]; break; }
        }
      }
      if (align !== 'center') {
        var horizAxis = placement === 'top' || placement === 'bottom';
        var need = (horizAxis ? pw : ph) - (horizAxis ? ARROW_H : ARROW_V) + GUARD;
        var fwd = horizAxis ? br.right - cx : br.bottom - cy;
        var back = horizAxis ? cx - br.left : cy - br.top;
        if (align === 'start' && fwd < need && back > fwd) align = 'end';
        else if (align === 'end' && back < need && fwd > back) align = 'start';
      }
    }

    var horiz = placement === 'top' || placement === 'bottom';
    var x = 0, y = 0;
    if (placement === 'top') y = tr.top - gap - ph;
    else if (placement === 'bottom') y = tr.bottom + gap;
    else if (placement === 'left') x = tr.left - gap - pw;
    else x = tr.right + gap;

    if (horiz) {
      x = align === 'center' ? cx - pw / 2 : align === 'start' ? cx - ARROW_H : cx - (pw - ARROW_H);
      x = Math.min(Math.max(br.left + GUARD, x), Math.max(br.left + GUARD, br.right - pw - GUARD));
    } else {
      y = align === 'center' ? cy - ph / 2 : align === 'start' ? cy - ARROW_V : cy - (ph - ARROW_V);
      y = Math.min(Math.max(br.top + GUARD, y), Math.max(br.top + GUARD, br.bottom - ph - GUARD));
    }

    /* из координат вьюпорта — в координаты позиционирующего предка */
    var ox = -(window.pageXOffset || 0), oy = -(window.pageYOffset || 0);
    if (op && op !== document.body && op !== document.documentElement) {
      var opr = op.getBoundingClientRect(), cs = getComputedStyle(op);
      ox = opr.left + (parseFloat(cs.borderLeftWidth) || 0) - op.scrollLeft;
      oy = opr.top + (parseFloat(cs.borderTopWidth) || 0) - op.scrollTop;
    }
    pop.style.left = (x - ox) + 'px';
    pop.style.top = (y - oy) + 'px';
    setMods(pop, placement, align);

    /* стрелка всегда смотрит в центр триггера — даже после clamp и flip */
    var arrow = pop.querySelector('.pop__arrow');
    if (arrow && pop.classList.contains('pop--arrow')) {
      if (horiz) {
        arrow.style.left = Math.min(Math.max(ARROW_EDGE, cx - x), pw - ARROW_EDGE) + 'px';
        arrow.style.right = 'auto';
        arrow.style.transform = 'translateX(-50%)';
      } else {
        arrow.style.top = Math.min(Math.max(ARROW_EDGE, cy - y), ph - ARROW_EDGE) + 'px';
        arrow.style.bottom = 'auto';
        arrow.style.transform = 'translateY(-50%)';
      }
    }
    return { placement: placement, align: align };
  }

  /* ------------------------------------------------------------------ */
  /* тени шапки/подвала при прокрутке тела — идентично Modal              */
  /* ------------------------------------------------------------------ */
  function watchScroll(pop) {
    var body = pop.querySelector('.pop__body');
    if (!body) return function () {};
    function sync() {
      var head = pop.querySelector('.pop__head'), foot = pop.querySelector('.pop__foot');
      if (head) head.classList.toggle('is-scrolled', body.scrollTop > 1);
      if (foot) foot.classList.toggle('is-scrolled', body.scrollTop + body.clientHeight < body.scrollHeight - 1);
    }
    if (!body.__dsPopScroll) { body.addEventListener('scroll', sync); body.__dsPopScroll = true; }
    requestAnimationFrame(sync);
    return sync;
  }

  /* ------------------------------------------------------------------ */
  /* bind — поведение триггера                                            */
  /* ------------------------------------------------------------------ */
  function resolvePop(trigger, opts) {
    if (opts.pop) return opts.pop;
    var id = trigger.getAttribute('data-popover');
    if (id) return document.getElementById(id);
    var anchor = trigger.closest('.pop-anchor');
    if (anchor) return anchor.querySelector('.pop');
    var next = trigger.nextElementSibling;
    return next && next.classList.contains('pop') ? next : null;
  }

  function bind(trigger, opts) {
    opts = opts || {};
    if (trigger.__dsPopover) return trigger.__dsPopover;
    var pop = resolvePop(trigger, opts);
    if (!pop) return null;

    var d = trigger.dataset || {};
    var conf = {
      placement: opts.placement || d.popoverPlacement || 'bottom',
      align: opts.align || d.popoverAlign || 'start',
      gap: opts.gap != null ? opts.gap : (d.popoverGap != null ? parseFloat(d.popoverGap) : GAP),
      flip: opts.flip != null ? opts.flip : d.popoverFlip !== 'no',
      boundary: opts.boundary || (d.popoverBoundary ? document.querySelector(d.popoverBoundary) : null),
      offsetParent: opts.offsetParent || null,
      autoFocus: opts.autoFocus !== false,
    };

    pop.classList.add('pop--floating');
    if (!pop.getAttribute('role')) pop.setAttribute('role', 'dialog');
    if (!pop.hasAttribute('aria-modal')) pop.setAttribute('aria-modal', 'false');
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-expanded', 'false');
    if (pop.id) trigger.setAttribute('aria-controls', pop.id);
    var syncShadow = watchScroll(pop);

    function isOpen() { return pop.classList.contains('is-open'); }

    function reposition() {
      return place(pop, trigger, {
        placement: conf.placement, align: conf.align, gap: conf.gap, flip: conf.flip,
        boundary: conf.boundary, offsetParent: conf.offsetParent,
      });
    }

    function open() {
      if (isOpen()) return api;
      if (trigger.disabled || trigger.getAttribute('aria-disabled') === 'true') return api;
      if (current && current !== api) current.close();
      pop.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
      reposition();
      syncShadow();
      current = api;
      if (conf.autoFocus) {
        var f = pop.querySelector(FOCUSABLE);
        if (f) f.focus();
      }
      return api;
    }

    function close(returnFocus) {
      if (!isOpen()) return api;
      pop.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
      if (current === api) current = null;
      if (returnFocus) trigger.focus();
      return api;
    }

    function toggle() { return isOpen() ? close() : open(); }

    trigger.addEventListener('click', function (e) { e.preventDefault(); toggle(); });
    /* триггер-не-кнопка (чип с role="button") — клавиатура */
    if (!/^(button|a)$/i.test(trigger.tagName)) {
      trigger.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
      });
    }
    /* ✕ и любые [data-pop-close] внутри — закрытие */
    pop.addEventListener('click', function (e) {
      if (e.target.closest('.pop__close, [data-pop-close]')) close(true);
    });
    /* Tab за последний интерактивный элемент — фокус не заперт, поповер закрывается */
    pop.addEventListener('focusout', function (e) {
      if (!isOpen()) return;
      var to = e.relatedTarget;
      if (to && (pop.contains(to) || trigger === to || trigger.contains(to))) return;
      if (to) close();
    });

    var api = { pop: pop, trigger: trigger, open: open, close: close, toggle: toggle, place: reposition, isOpen: isOpen, config: conf };
    trigger.__dsPopover = api;
    pop.__dsPopover = api;
    return api;
  }

  function bindAll(root) {
    (root || document).querySelectorAll('[data-popover]').forEach(function (t) { bind(t); });
  }

  function closeAll() { if (current) current.close(); }

  /* ------------------------------------------------------------------ */
  /* глобальные слушатели: клик вне, Esc, resize/scroll                   */
  /* ------------------------------------------------------------------ */
  document.addEventListener('click', function (e) {
    if (!current) return;
    if (current.pop.contains(e.target) || current.trigger.contains(e.target)) return;
    current.close();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && current) current.close(true);
  });
  function onReflow() { if (current) current.place(); }
  window.addEventListener('resize', onReflow);
  window.addEventListener('scroll', onReflow, true);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { bindAll(document); });
  else bindAll(document);

  window.DSPopover = {
    bind: bind, bindAll: bindAll, place: place, watchScroll: watchScroll,
    closeAll: closeAll, current: function () { return current; },
    ARROW_INSET_H: ARROW_H, ARROW_INSET_V: ARROW_V,
  };
})();
