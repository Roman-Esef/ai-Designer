/* =========================================================================
   DS Tooltip — рантайм тултипа (out-of-box).
   Зависимости: styles/tooltip.css.

   Экспорт: window.DSTooltip = {
     bind(target, opts) → api | null   — навесить поведение на цель
     bindAll(root)                      — обойти [data-tooltip] и цели с
                                           aria-describedby на .tip внутри root
     make(text, opts) → HTMLElement     — собрать разметку тултипа
     place(tip, target, opts) → {placement, align}  — позиционирование + flip
     hideAll()                          — скрыть показанный тултип
     truncated(selector, opts) → handle — «усечено → тултип» одной регистрацией
                                           (см. механизм ниже; владельцы —
                                           Chip, Tab, NavPanel, ReadOnlyField,
                                           Table)
     current() → api | null
   }

   Автоподключение (без кода на экране):
     <button data-tooltip="Удалить">…</button>            — текст в атрибуте
     <span class="tip-anchor">                            — своя разметка тултипа
       <button aria-describedby="tt-1">…</button>
       <span id="tt-1" class="tip tip--main" role="tooltip">Удалить</span>
     </span>
   Настройки цели: data-tooltip-placement (top|bottom|left|right, по
   умолчанию top), data-tooltip-align (start|center|end, center),
   data-tooltip-gap (px, 8), data-tooltip-type (main|error, main),
   data-tooltip-flip="no", data-tooltip-boundary (CSS-селектор границы),
   data-tooltip-delay (мс, 400), data-tooltip-truncated="only" — показывать
   только при усечении текста цели (scrollWidth > clientWidth).
     data-tooltip-multiline="yes" — переносить длинный текст по --tip-max
     вместо усечения самого тултипа.

   Поведение по спеке: 12 позиций, авто-flip стороны и выравнивания, стрелка
   доводится до центра цели, задержка 400 мс по hover и мгновенно по focus,
   мгновенное скрытие, Esc, один показанный тултип одновременно, курсор может
   зайти в rich-тултип (скрытие с задержкой 300 мс).
   ========================================================================= */
(function () {
  'use strict';

  var ARROW_INSET = 13;  /* 6px край + 7px до вершины треугольника */
  var ARROW_EDGE = 7;    /* половина ширины стрелки */
  var GAP = 8;
  var GUARD = 6;         /* минимальный отступ от края границы */
  var SHOW_DELAY = 400;
  var RICH_HIDE_DELAY = 300;

  var OPPOSITE = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
  var PERP = { top: ['right', 'left'], bottom: ['right', 'left'], left: ['bottom', 'top'], right: ['bottom', 'top'] };

  var current = null;

  /* ------------------------------------------------------------------ */
  /* разметка                                                            */
  /* ------------------------------------------------------------------ */
  function make(text, o) {
    o = o || {};
    var el = document.createElement('span');
    el.className = 'tip tip--' + (o.type || 'main') + ' tip--' + (o.placement || 'top') + ' tip--' + (o.align || 'center');
    if (o.arrow === false) el.classList.add('tip--no-arrow');
    if (o.multiline) el.classList.add('tip--multiline');
    if (o.floating) el.classList.add('tip--floating');
    if (o.pinned) el.classList.add('tip--pinned');
    if (o.rich) {
      el.classList.add('tip--rich');
      if (o.title) {
        var t = document.createElement('span'); t.className = 'tip__title'; t.textContent = o.title;
        el.appendChild(t);
      }
      var p = document.createElement('span'); p.className = 'tip__text'; p.textContent = text;
      el.appendChild(p);
      if (o.action) {
        var box = document.createElement('span'); box.className = 'tip__actions';
        var b = document.createElement('button'); b.type = 'button'; b.className = 'tip__action'; b.textContent = o.action;
        box.appendChild(b); el.appendChild(box);
      }
    } else {
      el.appendChild(document.createTextNode(text));
    }
    var a = document.createElement('span'); a.className = 'tip__arrow';
    el.appendChild(a);
    el.setAttribute('role', 'tooltip');
    return el;
  }

  /* ------------------------------------------------------------------ */
  /* геометрия                                                           */
  /* ------------------------------------------------------------------ */
  function bounds(el) {
    if (!el) return { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight, width: window.innerWidth, height: window.innerHeight };
    var r = el.getBoundingClientRect();
    return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
  }

  function fits(side, tr, br, w, h, gap) {
    if (side === 'top') return tr.top - br.top >= h + gap + GUARD;
    if (side === 'bottom') return br.bottom - tr.bottom >= h + gap + GUARD;
    if (side === 'left') return tr.left - br.left >= w + gap + GUARD;
    return br.right - tr.right >= w + gap + GUARD;
  }

  function setMods(tip, placement, align) {
    tip.classList.remove('tip--top', 'tip--bottom', 'tip--left', 'tip--right', 'tip--start', 'tip--center', 'tip--end');
    tip.classList.add('tip--' + placement, 'tip--' + align);
  }

  /* place — позиционирование + авто-flip; стрелка доводится до центра цели. */
  function place(tip, target, o) {
    o = o || {};
    var gap = o.gap == null ? GAP : o.gap;
    var placement = o.placement || 'top';
    var align = o.align || 'center';
    var br = bounds(o.boundary || null);
    var tr = target.getBoundingClientRect();
    var tw = tip.offsetWidth, th = tip.offsetHeight;
    var cx = tr.left + tr.width / 2, cy = tr.top + tr.height / 2;

    if (o.flip !== false && !fits(placement, tr, br, tw, th, gap)) {
      var cand = [OPPOSITE[placement]].concat(PERP[placement]);
      for (var i = 0; i < cand.length; i++) {
        if (fits(cand[i], tr, br, tw, th, gap)) { placement = cand[i]; break; }
      }
    }

    var horiz = placement === 'top' || placement === 'bottom';
    /* кламп — только когда граница задана явно или разрешён flip:
       с flip:false демо фиксирует сторону и не должно зависеть от положения окна */
    var clamp = o.flip !== false || !!o.boundary;
    if (o.flip !== false && align !== 'center') {
      var need = (horiz ? tw : th) - ARROW_INSET + GUARD;
      var fwd = horiz ? br.right - cx : br.bottom - cy;
      var back = horiz ? cx - br.left : cy - br.top;
      if (align === 'start' && fwd < need && back > fwd) align = 'end';
      else if (align === 'end' && back < need && fwd > back) align = 'start';
    }

    var x = 0, y = 0;
    if (placement === 'top') y = tr.top - gap - th;
    else if (placement === 'bottom') y = tr.bottom + gap;
    else if (placement === 'left') x = tr.left - gap - tw;
    else x = tr.right + gap;

    if (horiz) {
      x = align === 'center' ? cx - tw / 2 : align === 'start' ? cx - ARROW_INSET : cx - (tw - ARROW_INSET);
      if (clamp) x = Math.min(Math.max(br.left + GUARD, x), Math.max(br.left + GUARD, br.right - tw - GUARD));
    } else {
      y = align === 'center' ? cy - th / 2 : align === 'start' ? cy - ARROW_INSET : cy - (th - ARROW_INSET);
      if (clamp) y = Math.min(Math.max(br.top + GUARD, y), Math.max(br.top + GUARD, br.bottom - th - GUARD));
    }

    /* координаты вьюпорта — в left/top элемента (см. DSFloat.apply).
       Если DSFloat не подключён (страницы-документация грузят рантайм точечно),
       работаем прежним инлайн-пересчётом — элемент остаётся absolute. */
    var Float = window.DSFloat;
    if (Float) {
      Float.apply(tip, x, y, o.offsetParent);
    } else {
      var fl = o.offsetParent || tip.offsetParent || tip.parentElement;
      var fOx = -(window.pageXOffset || 0), fOy = -(window.pageYOffset || 0);
      if (fl && fl !== document.body && fl !== document.documentElement) {
        var fOpr = fl.getBoundingClientRect(), fCs = getComputedStyle(fl);
        fOx = fOpr.left + (parseFloat(fCs.borderLeftWidth) || 0) - fl.scrollLeft;
        fOy = fOpr.top + (parseFloat(fCs.borderTopWidth) || 0) - fl.scrollTop;
      }
      tip.style.left = Math.round(x - fOx) + 'px';
      tip.style.top = Math.round(y - fOy) + 'px';
    }
    setMods(tip, placement, align);

    var arrow = tip.querySelector('.tip__arrow');
    if (arrow && !tip.classList.contains('tip--no-arrow')) {
      arrow.style.transform = 'none';
      if (horiz) {
        arrow.style.left = (Math.min(Math.max(ARROW_INSET, cx - x), tw - ARROW_INSET) - ARROW_EDGE) + 'px';
        arrow.style.right = 'auto';
      } else {
        arrow.style.top = (Math.min(Math.max(ARROW_INSET, cy - y), th - ARROW_INSET) - ARROW_EDGE) + 'px';
        arrow.style.bottom = 'auto';
      }
    }
    return { placement: placement, align: align };
  }

  /* ------------------------------------------------------------------ */
  /* bind — поведение цели                                               */
  /* ------------------------------------------------------------------ */
  function resolveTip(target, opts) {
    if (opts.tip) return opts.tip;
    var id = target.getAttribute('aria-describedby');
    if (id) {
      var byId = document.getElementById(id);
      if (byId && byId.classList.contains('tip')) return byId;
    }
    var anchor = target.closest('.tip-anchor');
    if (anchor) {
      var inside = anchor.querySelector('.tip');
      if (inside) return inside;
    }
    var next = target.nextElementSibling;
    return next && next.classList.contains('tip') ? next : null;
  }

  /* цель без готовой разметки — оборачиваем в .tip-anchor и строим тултип */
  function createTip(target, conf) {
    var anchor = target.closest('.tip-anchor');
    if (!anchor) {
      anchor = document.createElement('span');
      anchor.className = 'tip-anchor';
      target.parentNode.insertBefore(anchor, target);
      anchor.appendChild(target);
    }
    var tip = make(conf.text, {
      type: conf.type, placement: conf.placement, align: conf.align,
      multiline: conf.multiline, floating: true, rich: conf.rich,
      title: conf.title, action: conf.action,
    });
    anchor.appendChild(tip);
    return tip;
  }

  function isTruncated(el) {
    return el.scrollWidth - el.clientWidth > 1 || el.scrollHeight - el.clientHeight > 1;
  }

  function bind(target, opts) {
    opts = opts || {};
    if (target.__dsTooltip) return target.__dsTooltip;
    var d = target.dataset || {};
    var conf = {
      text: opts.text || d.tooltip || '',
      type: opts.type || d.tooltipType || 'main',
      placement: opts.placement || d.tooltipPlacement || 'top',
      align: opts.align || d.tooltipAlign || 'center',
      gap: opts.gap != null ? opts.gap : (d.tooltipGap != null ? parseFloat(d.tooltipGap) : GAP),
      flip: opts.flip != null ? opts.flip : d.tooltipFlip !== 'no',
      boundary: opts.boundary || (d.tooltipBoundary ? document.querySelector(d.tooltipBoundary) : null),
      delay: opts.delay != null ? opts.delay : (d.tooltipDelay != null ? parseFloat(d.tooltipDelay) : SHOW_DELAY),
      truncatedOnly: opts.truncatedOnly != null ? opts.truncatedOnly : d.tooltipTruncated === 'only',
      multiline: opts.multiline != null ? opts.multiline : d.tooltipMultiline === 'yes',
      rich: opts.rich || false,
      title: opts.title || '',
      action: opts.action || '',
    };

    var tip = resolveTip(target, opts);
    if (!tip) {
      if (!conf.text) return null;
      tip = createTip(target, conf);
    }
    tip.classList.add('tip--floating');
    if (!tip.getAttribute('role')) tip.setAttribute('role', 'tooltip');
    if (!tip.id) tip.id = 'ds-tip-' + (++bind._n);
    if (!target.getAttribute('aria-describedby')) target.setAttribute('aria-describedby', tip.id);
    var rich = tip.classList.contains('tip--rich');

    var showT = null, hideT = null;

    function allowed() { return !conf.truncatedOnly || isTruncated(target); }

    function reposition() {
      return place(tip, target, {
        placement: conf.placement, align: conf.align, gap: conf.gap,
        flip: conf.flip, boundary: conf.boundary, offsetParent: opts.offsetParent || null,
      });
    }

    function show(immediate) {
      clearTimeout(hideT); clearTimeout(showT);
      if (!allowed()) return api;
      var run = function () {
        if (current && current !== api) current.hide(true);
        /* anchor — цель тултипа: из модалки слой уезжает в её скрим, иначе
           тултип рисуется под подложкой (z-index 30 против 1000) */
        if (window.DSFloat) DSFloat.mount(tip, { anchor: target });
        reposition();
        tip.classList.add('is-visible');
        current = api;
      };
      if (immediate) run(); else showT = setTimeout(run, conf.delay);
      return api;
    }

    function hide(immediate) {
      clearTimeout(showT);
      var run = function () {
        tip.classList.remove('is-visible');
        if (window.DSFloat) DSFloat.unmount(tip);
        if (current === api) current = null;
      };
      /* rich интерактивен: курсор может перейти с цели в тултип */
      if (!immediate && rich) { clearTimeout(hideT); hideT = setTimeout(run, RICH_HIDE_DELAY); }
      else { clearTimeout(hideT); run(); }
      return api;
    }

    target.addEventListener('mouseenter', function () { show(false); });
    target.addEventListener('mouseleave', function () { hide(false); });
    target.addEventListener('focus', function () { show(true); });
    target.addEventListener('blur', function () { hide(true); });
    target.addEventListener('keydown', function (e) { if (e.key === 'Escape') hide(true); });
    if (rich) {
      tip.addEventListener('mouseenter', function () { clearTimeout(hideT); });
      tip.addEventListener('mouseleave', function () { hide(false); });
    }

    var api = {
      tip: tip, target: target, show: show, hide: hide, place: reposition,
      isVisible: function () { return tip.classList.contains('is-visible'); }, config: conf,
    };
    target.__dsTooltip = api;
    tip.__dsTooltip = api;
    return api;
  }
  bind._n = 0;

  function bindAll(root) {
    root = root || document;
    root.querySelectorAll('[data-tooltip]').forEach(function (t) { bind(t); });
    root.querySelectorAll('.tip-anchor [aria-describedby]').forEach(function (t) {
      var tip = document.getElementById(t.getAttribute('aria-describedby'));
      if (tip && tip.classList.contains('tip')) bind(t);
    });
  }

  function hideAll() { if (current) current.hide(true); }

  /* ------------------------------------------------------------------ */
  /* «Усечено → тултип»: делегированный механизм без владельца per файл  */
  /* ------------------------------------------------------------------ *
     Правило «короткая строка усеклась многоточием → по наведению/фокусу
     показываем полный текст тултипом» повторялось в каждом владельце
     своим кодом (и в двух местах — ds-chip.js и ds-table.js — двумя
     почти одинаковыми реализациями, CM-1). Одна запись в чит-шите, а
     реализация — в четырёх файлах: правило чинилось в одном из четырёх
     и молча не работало в остальных. Владельцы регистрируют свой
     селектор одной строкой: DSTooltip.truncated('.tab__label', opts).

     Привязка ленивая, делегированием по pointerover/focusin: цель
     получает data-tooltip + data-tooltip-truncated="only" +
     data-tooltip-multiline="yes" и первый показ вручную. Почему лениво —
     элементы (чипы в стеке, ячейки реестра) создаются динамически, а
     ds-tooltip.js за DOM не следит. Тултип показывается ТОЛЬКО когда цель
     реально усечена (isTruncated), поэтому короткие подписи проходят без
     тултипа.

     Два пути, потому что фокус и наведение целятся в разные элементы:
     hover приходит на сам усечённый элемент, focus — на хост-предок
     (чип, таб, пункт меню), внутри которого живёт подпись. opts.host
     задаёт селектор такого хоста.

     Общие функции — см. attachTrunc / textOf / isTruncated ниже. */

  /* текст цели мимо чужих тултипов: ds-tooltip.js кладёт копию значения в
     .tip[role=tooltip] рядом с целью, и textContent удвоился бы */
  function textOf(el) {
    var out = '';
    Array.prototype.forEach.call(el.childNodes, function (n) {
      if (n.nodeType === 3) { out += n.nodeValue; return; }
      if (n.nodeType !== 1) return;
      if (n.getAttribute && n.getAttribute('role') === 'tooltip') return;
      out += n.textContent;
    });
    return out.replace(/\s+/g, ' ').trim();
  }

  /* усечение — либо по ширине (ellipsis), либо по высоте (line-clamp) */
  function isTruncated(el) {
    return el.scrollWidth - el.clientWidth > 1 || el.scrollHeight - el.clientHeight > 1;
  }

  function attachTrunc(el, o) {
    if (!window.DSTooltip) return null;
    if (el.__dsTrunc) return el.__dsTrunc;
    if (o && o.skip && o.skip(el)) return null;
    /* текст — в очерёдности: преданный data-tooltip → title (пишут
       конструкторы и старые потребители) → сама подпись */
    var text = o && o.text ? o.text(el)
      : (el.getAttribute('data-tooltip') || el.getAttribute('title') || textOf(el));
    if (!text) return null;
    el.removeAttribute('title');
    el.setAttribute('data-tooltip', text);
    el.setAttribute('data-tooltip-truncated', 'only');
    el.setAttribute('data-tooltip-multiline', 'yes');
    var api = window.DSTooltip.bind(el);
    el.__dsTrunc = api;
    return api;
  }

  /* truncated(selector, opts) → handle { refresh(root) }
     selector        — усечённый элемент (подпись). Может быть списком через
                       «,» — closest/querySelectorAll воспринимают как есть.
     opts.host       — селектор фокус-хоста: focus приходит на него, а не на
                       подпись (chip→.chip, tab→.tab, nav→.nav__item/.nav__user).
     opts.disabled   — селектор хостов с pointer-events:none (disabled-чипы/
                       табы), у которых событий нет вовсе — их нельзя поймать
                       делегированием, только сканом.
     opts.disabledClass — класс (a la .chip--has-tooltip), возвращающий
                       pointer-events, чтобы усечённая подпись всё же читалась.
     opts.skip(el)   — предикат; вернуть true — пропустить (счётчики «+N»).
     opts.text(el)   — свой извлекатель текста.
     opts.init = false — не запускать refresh() самому (владелец зовёт сам). */
  function truncated(sel, o) {
    o = o || {};
    var doc = document;
    var hostSel = o.host || null;
    var hasHost = !!hostSel;

    function findHover(target) {
      return target.closest ? target.closest(sel) : null;
    }

    doc.addEventListener('pointerover', function (e) {
      var el = findHover(e.target);
      if (!el || el.__dsTrunc) return;
      var api = attachTrunc(el, o);
      if (api) api.show(false);
    }, true);

    doc.addEventListener('focusin', function (e) {
      var els;
      if (hasHost) {
        var host = e.target.closest ? e.target.closest(hostSel) : null;
        if (!host) return;
        els = host.querySelectorAll(sel);
      } else {
        var direct = e.target.closest ? e.target.closest(sel) : null;
        els = direct ? [direct] : [];
      }
      Array.prototype.forEach.call(els, function (el) {
        if (!isTruncated(el)) return;
        var api = el.__dsTrunc || attachTrunc(el, o);
        if (!api) return;
        api.show(true);
        var blurEl = hasHost ? e.target.closest(hostSel) : e.target;
        if (blurEl && !blurEl.__dsTruncBlur) {
          blurEl.__dsTruncBlur = true;
          blurEl.addEventListener('blur', function () { DSTooltip.hideAll(); });
        }
      });
    }, true);

    function refresh(root) {
      if (!o.disabled || !window.DSTooltip) return;
      (root || doc).querySelectorAll(o.disabled).forEach(function (host) {
        var el = host.querySelector(sel);
        if (!el || el.__dsTrunc) return;
        if (!isTruncated(el)) return;
        if (o.skip && o.skip(el)) return;
        if (o.disabledClass) host.classList.add(o.disabledClass);
        attachTrunc(el, o);
      });
    }

    if (o.init !== false) {
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { refresh(); });
      else refresh();
    }
    return { refresh: refresh };
  }

  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hideAll(); });
  function onReflow() { if (current) current.place(); }
  window.addEventListener('resize', onReflow);
  window.addEventListener('scroll', onReflow, true);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { bindAll(document); });
  else bindAll(document);

  window.DSTooltip = {
    bind: bind, bindAll: bindAll, make: make, place: place,
    hideAll: hideAll, current: function () { return current; },
    truncated: truncated, ARROW_INSET: ARROW_INSET, SHOW_DELAY: SHOW_DELAY,
  };
})();
