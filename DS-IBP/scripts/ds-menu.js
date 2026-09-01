/* =========================================================================
   DS Menu — рантайм контекстного меню (out-of-box).
   Зависимости: styles/context-menu.css. Иконки в разметке — как обычно
   через icons-data.js + ds-icons.js (рантайм их не требует).

   Экспорт: window.DSMenu = {
     bind(trigger, opts) → api | null   — навесить поведение на триггер
     bindAll(root)                      — обойти [data-menu] внутри root
     place(menu, trigger, opts) → {placement, align}
     wireKeys(menu, opts)               — клавиатура для статичного меню
     wireSubs(menu)                     — подменю (hover + → / ←) внутри меню
     closeAll() · current() → api|null
   }

   Автоподключение (без единой строки кода на экране):
     <span class="menu-anchor">
       <button data-menu="m1" aria-label="Действия">⋮</button>
       <div id="m1" class="menu" role="menu">…</div>
     </span>
   Значение data-menu — id меню; пустое значение — ближайшее .menu внутри
   .menu-anchor. Настройки на триггере: data-menu-placement (bottom|top,
   по умолчанию bottom), data-menu-align (start|end, start), data-menu-gap
   (px, 6), data-menu-flip="no" (выключить авто-разворот),
   data-menu-boundary (CSS-селектор контейнера-границы, по умолчанию вьюпорт),
   data-menu-keep-open (не закрывать по клику на пункт — меню-выбор).

   Поведение по спеке: разворот вверх при нехватке места снизу, флип
   выравнивания и зажим по горизонтали, одно открытое меню, закрытие по
   клику на пункт / клику вне / Esc с возвратом фокуса, полная клавиатура
   (↑ ↓ Home End Enter Space → ← Esc + typeahead), подменю по наведению
   с задержкой закрытия 160мс и разворотом влево при нехватке места.
   ========================================================================= */
(function () {
  'use strict';

  var GAP = 6;          /* зазор меню от триггера */
  var GUARD = 8;        /* минимальный отступ от края границы */
  var SUB_CLOSE = 160;  /* задержка закрытия подменю, мс */
  var TYPE_RESET = 700; /* сброс буфера typeahead, мс */

  var ITEM = '.menu__item';
  var current = null;   /* единственное открытое меню верхнего уровня */

  /* ------------------------------------------------------------------ */
  /* геометрия                                                           */
  /* ------------------------------------------------------------------ */
  function bounds(el) {
    if (!el) return { left: 0, top: 0, right: document.documentElement.clientWidth, bottom: document.documentElement.clientHeight };
    var r = el.getBoundingClientRect();
    return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
  }

  /* origin для transform-scale появления — со стороны триггера */
  function setOrigin(menu, placement, align) {
    menu.style.setProperty('--menu-origin', (placement === 'top' ? 'bottom ' : 'top ') + (align === 'end' ? 'right' : 'left'));
  }

  /* place — позиционирование + авто-разворот. Возвращает placement/align. */
  function place(menu, trigger, o) {
    o = o || {};
    var gap = o.gap == null ? GAP : o.gap;
    var placement = o.placement || 'bottom';
    var align = o.align || 'start';
    var flip = o.flip !== false;
    var op = o.offsetParent || menu.offsetParent || menu.parentElement;
    var br = bounds(o.boundary || null);
    var tr = trigger.getBoundingClientRect();
    var mw = menu.offsetWidth, mh = menu.offsetHeight;

    /* триггер вне границы (секция ещё за пределами вьюпорта) — ни разворота,
       ни зажима: иначе меню «уедет» к краю экрана вместо своего триггера */
    var inView = tr.bottom > br.top && tr.top < br.bottom && tr.right > br.left && tr.left < br.right;

    if (flip && inView) {
      var below = br.bottom - tr.bottom, above = tr.top - br.top;
      if (placement === 'bottom' && below < mh + gap + GUARD && above > below) placement = 'top';
      else if (placement === 'top' && above < mh + gap + GUARD && below > above) placement = 'bottom';
      /* выравнивание: start растёт вправо, end — влево */
      var fwd = br.right - tr.left, back = tr.right - br.left;
      if (align === 'start' && fwd < mw + GUARD && back >= mw + GUARD) align = 'end';
      else if (align === 'end' && back < mw + GUARD && fwd >= mw + GUARD) align = 'start';
    }

    var y = placement === 'top' ? tr.top - gap - mh : tr.bottom + gap;
    var x = align === 'end' ? tr.right - mw : tr.left;

    if (inView && (flip || o.boundary)) {
      x = Math.min(Math.max(br.left + GUARD, x), Math.max(br.left + GUARD, br.right - mw - GUARD));
      y = Math.min(Math.max(br.top + GUARD, y), Math.max(br.top + GUARD, br.bottom - mh - GUARD));
    }

    /* из координат вьюпорта — в координаты позиционирующего предка */
    var ox = -(window.pageXOffset || 0), oy = -(window.pageYOffset || 0);
    if (getComputedStyle(menu).position === 'fixed') { ox = 0; oy = 0; }
    else if (op && op !== document.body && op !== document.documentElement) {
      var opr = op.getBoundingClientRect(), cs = getComputedStyle(op);
      ox = opr.left + (parseFloat(cs.borderLeftWidth) || 0) - op.scrollLeft;
      oy = opr.top + (parseFloat(cs.borderTopWidth) || 0) - op.scrollTop;
    }
    /* пишем только при изменении: лишняя запись стилей провоцирует
       reflow → scroll → repositioning по кругу */
    var nl = Math.round(x - ox) + 'px', nt = Math.round(y - oy) + 'px';
    if (menu.style.left !== nl) menu.style.left = nl;
    if (menu.style.top !== nt) menu.style.top = nt;
    setOrigin(menu, placement, align);
    return { placement: placement, align: align };
  }

  /* ------------------------------------------------------------------ */
  /* пункты и клавиатура                                                 */
  /* ------------------------------------------------------------------ */
  /* все пункты, включая отключённые — для roving tabindex: отключённый пункт
     должен получить tabindex=-1, иначе Tab уводит фокус на нерабочий пункт */
  function allItems(menu) {
    return Array.prototype.filter.call(menu.children, function (el) {
      return el.classList && el.classList.contains('menu__item');
    });
  }

  function items(menu) {
    return Array.prototype.filter.call(menu.children, function (el) {
      return el.classList && el.classList.contains('menu__item') && el.getAttribute('aria-disabled') !== 'true' && !el.classList.contains('is-disabled');
    });
  }

  function focusItem(menu, el) {
    if (!el) return;
    allItems(menu).forEach(function (i) { i.tabIndex = i === el ? 0 : -1; });
    el.focus();
  }

  function step(menu, dir) {
    var list = items(menu);
    if (!list.length) return;
    var i = list.indexOf(document.activeElement.closest ? document.activeElement.closest(ITEM) : null);
    var next = i < 0 ? (dir > 0 ? 0 : list.length - 1) : (i + dir + list.length) % list.length;
    focusItem(menu, list[next]);
  }

  /* wireKeys — роving tabindex и полная клавнавигация внутри меню */
  function wireKeys(menu, opts) {
    if (menu.__dsMenuKeys) return menu;
    menu.__dsMenuKeys = true;
    opts = opts || {};
    if (!menu.getAttribute('role')) menu.setAttribute('role', 'menu');
    allItems(menu).forEach(function (it) {
      if (!it.getAttribute('role')) it.setAttribute('role', 'menuitem');
      it.tabIndex = -1;
    });
    var first = items(menu)[0];
    if (first) first.tabIndex = 0;
    var buf = '', bufT;
    menu.addEventListener('keydown', function (e) {
      var host = e.target.closest ? e.target.closest(ITEM) : null;
      if (e.key === 'ArrowDown') { e.preventDefault(); step(menu, 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); step(menu, -1); }
      else if (e.key === 'Home') { e.preventDefault(); focusItem(menu, items(menu)[0]); }
      else if (e.key === 'End') { e.preventDefault(); var l = items(menu); focusItem(menu, l[l.length - 1]); }
      else if (e.key === 'Enter' || e.key === ' ') {
        if (host && host.classList.contains('menu__item--sub')) { e.preventDefault(); if (host.__dsSubOpen) host.__dsSubOpen(true); }
        else if (host && host.tagName !== 'BUTTON' && host.tagName !== 'A') { e.preventDefault(); host.click(); }
      } else if (e.key === 'Escape' || e.key === 'ArrowLeft') {
        if (menu.classList.contains('menu__sub')) return; /* обрабатывает подменю */
        if (opts.onClose) { e.preventDefault(); e.stopPropagation(); opts.onClose(); }
      } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
        /* typeahead по первой букве подписи */
        clearTimeout(bufT); buf += e.key.toLowerCase();
        bufT = setTimeout(function () { buf = ''; }, TYPE_RESET);
        var list = items(menu), from = list.indexOf(host) + 1;
        for (var n = 0; n < list.length; n++) {
          var it = list[(from + n) % list.length];
          var lab = (it.querySelector('.menu__item-label') || it).textContent.trim().toLowerCase();
          if (lab.indexOf(buf) === 0) { focusItem(menu, it); break; }
        }
      }
    });
    return menu;
  }

  /* ------------------------------------------------------------------ */
  /* подменю (flyout)                                                    */
  /* ------------------------------------------------------------------ */
  function wireSubs(menu) {
    menu.querySelectorAll('.menu__item--sub').forEach(function (host) {
      var sub = host.querySelector('.menu__sub');
      if (!sub || host.__dsSub) return;
      host.__dsSub = true;
      host.setAttribute('aria-haspopup', 'menu');
      host.setAttribute('aria-expanded', 'false');
      if (host.tabIndex !== 0) host.tabIndex = -1;
      wireKeys(sub);
      var t;
      function open(focusFirst) {
        clearTimeout(t);
        sub.classList.add('is-open');
        host.setAttribute('aria-expanded', 'true');
        /* нет места справа — разворачиваем влево */
        var r = sub.getBoundingClientRect();
        var vw = document.documentElement.clientWidth;
        sub.classList.toggle('menu__sub--left', r.right > vw - GUARD && host.getBoundingClientRect().left - r.width > GUARD);
        if (focusFirst) { var f = items(sub)[0]; if (f) focusItem(sub, f); }
      }
      function close(now) {
        clearTimeout(t);
        t = setTimeout(function () {
          sub.classList.remove('is-open');
          host.setAttribute('aria-expanded', 'false');
        }, now ? 0 : SUB_CLOSE);
      }
      host.__dsSubOpen = open;
      host.__dsSubClose = close;
      host.addEventListener('mouseenter', function () { open(false); });
      host.addEventListener('mouseleave', function () { close(false); });
      host.addEventListener('focusin', function () { open(false); });
      host.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); open(true); }
        else if ((e.key === 'ArrowLeft' || e.key === 'Escape') && sub.classList.contains('is-open')) {
          e.preventDefault(); e.stopPropagation(); close(true); host.focus();
        }
      });
    });
    return menu;
  }

  /* ------------------------------------------------------------------ */
  /* bind — поведение триггера                                           */
  /* ------------------------------------------------------------------ */
  function resolveMenu(trigger, opts) {
    if (opts.menu) return opts.menu;
    var id = trigger.getAttribute('data-menu');
    if (id) return document.getElementById(id);
    var anchor = trigger.closest('.menu-anchor');
    if (anchor) return anchor.querySelector('.menu');
    var next = trigger.nextElementSibling;
    return next && next.classList.contains('menu') ? next : null;
  }

  function bind(trigger, opts) {
    opts = opts || {};
    if (trigger.__dsMenu) return trigger.__dsMenu;
    var menu = resolveMenu(trigger, opts);
    if (!menu) return null;

    var d = trigger.dataset || {};
    var conf = {
      placement: opts.placement || d.menuPlacement || 'bottom',
      align: opts.align || d.menuAlign || 'start',
      gap: opts.gap != null ? opts.gap : (d.menuGap != null ? parseFloat(d.menuGap) : GAP),
      flip: opts.flip != null ? opts.flip : d.menuFlip !== 'no',
      boundary: opts.boundary || (d.menuBoundary ? document.querySelector(d.menuBoundary) : null),
      offsetParent: opts.offsetParent || null,
      keepOpen: opts.keepOpen != null ? opts.keepOpen : d.menuKeepOpen != null,
      autoFocus: opts.autoFocus !== false,
      /* dismiss:false — закреплённое меню витрины: не закрывается по клику вне
         и Esc, не занимает слот единственного открытого меню */
      dismiss: opts.dismiss !== false,
    };

    menu.classList.add('menu--floating');
    if (!menu.getAttribute('role')) menu.setAttribute('role', 'menu');
    trigger.setAttribute('aria-haspopup', 'menu');
    trigger.setAttribute('aria-expanded', 'false');
    if (menu.id) trigger.setAttribute('aria-controls', menu.id);
    var wasHidden = menu.hasAttribute('hidden');
    wireKeys(menu, { onClose: function () { close(true); } });
    wireSubs(menu);

    function isOpen() { return menu.classList.contains('is-open'); }
    function reposition() {
      return place(menu, trigger, {
        placement: conf.placement, align: conf.align, gap: conf.gap, flip: conf.flip,
        boundary: conf.boundary, offsetParent: conf.offsetParent,
      });
    }

    function open() {
      if (isOpen()) return api;
      if (trigger.disabled || trigger.getAttribute('aria-disabled') === 'true') return api;
      if (conf.dismiss && current && current !== api) current.close();
      if (wasHidden) menu.removeAttribute('hidden');
      menu.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
      reposition();
      if (conf.dismiss) current = api;
      if (conf.autoFocus) { var f = items(menu)[0]; if (f) focusItem(menu, f); }
      return api;
    }

    function close(returnFocus) {
      if (!isOpen()) return api;
      menu.classList.remove('is-open');
      menu.querySelectorAll('.menu__sub.is-open').forEach(function (s) { s.classList.remove('is-open'); });
      trigger.setAttribute('aria-expanded', 'false');
      if (wasHidden) menu.setAttribute('hidden', '');
      if (current === api) current = null;
      if (returnFocus) trigger.focus();
      return api;
    }

    function toggle() { return isOpen() ? close() : open(); }

    trigger.addEventListener('click', function (e) { e.preventDefault(); toggle(); });
    if (!/^(button|a)$/i.test(trigger.tagName)) {
      trigger.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
        else if (e.key === 'ArrowDown') { e.preventDefault(); open(); }
      });
    } else {
      trigger.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown' && !isOpen()) { e.preventDefault(); open(); }
      });
    }
    /* клик на пункт — закрытие (кроме пункта с подменю и меню-выбора) */
    menu.addEventListener('click', function (e) {
      var it = e.target.closest(ITEM);
      if (!it || it.classList.contains('menu__item--sub')) return;
      if (!conf.keepOpen) close(true);
    });

    var api = {
      menu: menu, trigger: trigger, open: open, close: close, toggle: toggle,
      place: reposition, isOpen: isOpen, config: conf,
    };
    trigger.__dsMenu = api;
    menu.__dsMenu = api;
    return api;
  }

  function bindAll(root) {
    (root || document).querySelectorAll('[data-menu]').forEach(function (t) { bind(t); });
  }

  function closeAll() { if (current) current.close(); }

  /* ------------------------------------------------------------------ */
  /* глобальные слушатели: клик вне, Esc, resize/scroll                  */
  /* ------------------------------------------------------------------ */
  document.addEventListener('pointerdown', function (e) {
    if (!current) return;
    if (current.menu.contains(e.target) || current.trigger.contains(e.target)) return;
    current.close();
  }, true);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && current) current.close(true);
  });
  /* пересчёт позиции — не чаще кадра, иначе всплеск scroll-событий
     превращается в бесконечный цикл reflow */
  var reflowQueued = false;
  function onReflow() {
    if (!current || reflowQueued) return;
    reflowQueued = true;
    requestAnimationFrame(function () { reflowQueued = false; if (current) current.place(); });
  }
  window.addEventListener('resize', onReflow, { passive: true });
  window.addEventListener('scroll', onReflow, { capture: true, passive: true });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { bindAll(document); });
  else bindAll(document);

  window.DSMenu = {
    bind: bind, bindAll: bindAll, place: place, wireKeys: wireKeys, wireSubs: wireSubs,
    items: items, closeAll: closeAll, current: function () { return current; },
  };
})();
