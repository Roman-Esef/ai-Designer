/* =========================================================================
   DS Tabs — рантайм табов и сегмент-контрола (out-of-box).
   Зависимости: styles/tab.css, styles/segment-control.css.

   Общее у Tab и SegmentControl — roving tabindex и навигация стрелками;
   различаются разметкой (role/атрибут выбора) и тем, что у сегмент-контрола
   есть измеряемый индикатор (thumb), а у табов — переполнение.

   Переполнение горизонтальных табов — из коробки, включено в tabs():
   ряд шире контейнера сам получает паттерн переполнения — по умолчанию скролл со
   стрелками (ни один таб не скрывается). Атрибут data-tabs-overflow на самом
   .tabs принудительно задаёт паттерн: "menu" — fit + кнопка «ёщё» с выпадающим
   списком остальных; "none" — отключить (ответственность за границу на экране остаётся
   на вызывающей стороне). Активируется только у горизонтальных групп (.tabs--horiz) —
   вертикальные переполняются своим контейнером, это не задача этого рантайма.

   Экспорт: window.DSTabs = {
     tabs(el, opts) → api          — группа .tabs[role="tablist"]
     segment(el, opts) → api       — контрол .segctrl[role="radiogroup"]
     positionThumb(el)             — пересчитать индикатор сегмент-контрола
     wireAll(root)                 — обойти [data-tabs] и [data-segctrl]
   }
   api: { el, items() → [], select(elOrIndex), value() → index, refresh(),
          overflow — { mode, refresh() } у горизонтальных групп (или null) }

   Автоподключение (opt-in, чтобы не оживлять статичные примеры витрин):
     <div class="tabs tabs--horiz" role="tablist" data-tabs>…</div>
     <div class="tabs tabs--horiz" role="tablist" data-tabs data-tabs-overflow="menu">…</div>
     <div class="segctrl" role="radiogroup" aria-label="Период" data-segctrl>…</div>
   opts.onChange(index, el) — коллбэк при смене выбора.
   ========================================================================= */
(function () {
  'use strict';

  function disabled(el) {
    return el.disabled
      || el.getAttribute('aria-disabled') === 'true'
      || el.classList.contains('tab--disabled');
  }

  /* общий движок: roving tabindex + стрелки/Home/End с активацией на месте */
  function roving(host, cfg) {
    function items() { return Array.prototype.slice.call(host.querySelectorAll(cfg.itemSel)); }
    function live() { return items().filter(function (b) { return !disabled(b); }); }

    function select(target, silent) {
      var list = items();
      var el = typeof target === 'number' ? list[target] : target;
      if (!el || disabled(el)) return null;
      list.forEach(function (b) {
        var on = b === el;
        b.setAttribute(cfg.selAttr, String(on));
        if (cfg.selClass) b.classList.toggle(cfg.selClass, on);
        b.tabIndex = on ? 0 : -1;
      });
      if (cfg.afterSelect) cfg.afterSelect(host, el);
      if (!silent && cfg.onChange) cfg.onChange(list.indexOf(el), el);
      return el;
    }

    /* фокус остаётся на выбранном элементе — иначе стрелки уходят в никуда */
    function move(delta) {
      var l = live();
      if (!l.length) return;
      var cur = l.indexOf(document.activeElement);
      if (cur < 0) cur = l.indexOf(host.querySelector('[' + cfg.selAttr + '="true"]'));
      var next = l[(cur + delta + l.length) % l.length];
      select(next);
      next.focus();
    }

    host.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest(cfg.itemSel) : null;
      if (btn && host.contains(btn) && !disabled(btn)) select(btn);
    });

    host.addEventListener('keydown', function (e) {
      var l = live();
      if (!l.length) return;
      var k = e.key;
      if (k === 'ArrowRight' || k === 'ArrowDown') { e.preventDefault(); move(1); }
      else if (k === 'ArrowLeft' || k === 'ArrowUp') { e.preventDefault(); move(-1); }
      else if (k === 'Home') { e.preventDefault(); select(l[0]); l[0].focus(); }
      else if (k === 'End') { e.preventDefault(); select(l[l.length - 1]); l[l.length - 1].focus(); }
    });

    /* исходное состояние разметки: roving tabindex и индикатор */
    var cur = host.querySelector('[' + cfg.selAttr + '="true"]') || live()[0];
    if (cur) select(cur, true);

    return {
      el: host, items: items, select: select,
      value: function () { return items().indexOf(host.querySelector('[' + cfg.selAttr + '="true"]')); },
      refresh: function () { if (cfg.afterSelect) cfg.afterSelect(host, host.querySelector('[' + cfg.selAttr + '="true"]')); },
    };
  }

  /* --------------------------------------------------------------------- */
  /* SegmentControl: индикатор измеряется, а не считается по индексу        */
  /* --------------------------------------------------------------------- */
  function positionThumb(host) {
    var thumb = host.querySelector('.segctrl__thumb');
    if (!thumb) return;
    var sel = host.querySelector('.segctrl__item[aria-checked="true"]');
    if (!sel) { thumb.classList.remove('is-visible'); return; }
    thumb.style.width = sel.offsetWidth + 'px';
    thumb.style.transform = 'translateX(' + sel.offsetLeft + 'px)';
    thumb.classList.add('is-visible');
  }

  function segment(host, opts) {
    if (!host || host.__dsSeg) return host && host.__dsSeg;
    opts = opts || {};
    var api = roving(host, {
      itemSel: '.segctrl__item',
      selAttr: 'aria-checked',
      selClass: null,
      afterSelect: positionThumb,
      onChange: opts.onChange,
    });
    /* метрики шрифта и адаптивная ширина меняют offsetWidth уже после первого
       рендера — пересчитываем на каждый повод, а не один раз при монтировании */
    var recalc = function () { positionThumb(host); };
    requestAnimationFrame(recalc);
    window.addEventListener('resize', recalc);
    window.addEventListener('load', recalc);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(recalc);
    if (window.ResizeObserver) new ResizeObserver(recalc).observe(host);
    host.__dsSeg = api;
    return api;
  }

  /* --------------------------------------------------------------------- */
  /* Tabs                                                                    */
  /* --------------------------------------------------------------------- */
  function tabs(host, opts) {
    if (!host || host.__dsTabs) return host && host.__dsTabs;
    opts = opts || {};
    var api = roving(host, {
      itemSel: '.tab',
      selAttr: 'aria-selected',
      selClass: 'tab--selected',
      afterSelect: opts.scrollIntoView === false ? null : keepVisible,
      onChange: opts.onChange,
    });
    if (host.classList.contains('tabs--horiz')) {
      var mode = host.getAttribute('data-tabs-overflow') || opts.overflow;
      if (mode !== 'none') api.overflow = wireOverflow(host, mode === 'menu' ? 'menu' : 'scroll', opts);
    }
    host.__dsTabs = api;
    return api;
  }

  /* --------------------------------------------------------------------- */
  /* Overflow — горизонтальный ряд шире контейнера. Два паттерна:
     scroll (по умолчанию) — обёртка со скроллом и стрелками, ни один таб
     не прячется; menu — влезающие остаются в ряд, остальные уходят в
     дропдаун за кнопкой «⋯». Оба активируются сами по факту переполнения
     (CSS/замер ширины), форсировать конкретный — data-tabs-overflow.       */
  function wireOverflow(host, mode, opts) {
    if (!host.parentNode) return null; // группа ещё не вставлена в DOM — обёрнуть нечем; на реальных экранах wireAll всегда видит разметку уже в DOM
    if (host.closest('.tabs-scroll, .tabs-overflow')) return null; // уже обёрнут разметкой
    return mode === 'menu' ? wireOverflowMenu(host, opts) : wireOverflowScroll(host, opts);
  }

  function mkArrowIcon(name, label) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'tabs-scroll__arrow tabs-scroll__arrow--' + (name === 'chevron-left' ? 'left' : 'right');
    b.setAttribute('aria-label', label);
    var i = document.createElement('i');
    i.setAttribute('data-icon', name);
    b.appendChild(i);
    return b;
  }

  function wireOverflowScroll(host) {
    var scrollBox = document.createElement('div'); scrollBox.className = 'tabs-scroll';
    var wrap = document.createElement('div'); wrap.className = 'tabs-scroll-wrap';
    host.parentNode.insertBefore(wrap, host);
    wrap.appendChild(scrollBox);
    scrollBox.appendChild(host);

    var left = mkArrowIcon('chevron-left', 'Прокрутить влево');
    var right = mkArrowIcon('chevron-right', 'Прокрутить вправо');
    wrap.appendChild(left); wrap.appendChild(right);
    left.addEventListener('click', function () { scrollBox.scrollBy({ left: -160, behavior: 'smooth' }); });
    right.addEventListener('click', function () { scrollBox.scrollBy({ left: 160, behavior: 'smooth' }); });

    function update() {
      var max = scrollBox.scrollWidth - scrollBox.clientWidth;
      left.classList.toggle('is-visible', scrollBox.scrollLeft > 4);
      right.classList.toggle('is-visible', scrollBox.scrollLeft < max - 4);
    }
    scrollBox.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    window.addEventListener('load', update);
    if (window.ResizeObserver) new ResizeObserver(update).observe(scrollBox);
    if (window.dsIcons) window.dsIcons.apply(wrap);
    requestAnimationFrame(update);
    return { mode: 'scroll', refresh: update };
  }

  function wireOverflowMenu(host, opts) {
    opts = opts || {};
    var tabEls = Array.prototype.slice.call(host.querySelectorAll('.tab'));
    if (tabEls.length < 2) return null;
    var sizeCls = tabEls[0].className.match(/tab--[ms]\b/);
    var outer = document.createElement('div'); outer.className = 'tabs-overflow';
    host.parentNode.insertBefore(outer, host);
    outer.appendChild(host);

    var moreBtn = document.createElement('button');
    moreBtn.type = 'button';
    moreBtn.className = 'tab tab--more' + (sizeCls ? ' ' + sizeCls[0] : '');
    moreBtn.setAttribute('aria-haspopup', 'true');
    moreBtn.setAttribute('aria-expanded', 'false');
    moreBtn.setAttribute('aria-label', opts.moreLabel || 'Показать остальные разделы');
    var mi = document.createElement('span'); mi.className = 'tab__icon';
    var mIcon = document.createElement('i'); mIcon.setAttribute('data-icon', 'more-dots');
    mi.appendChild(mIcon); moreBtn.appendChild(mi);
    host.appendChild(moreBtn);

    var menu = document.createElement('div'); menu.className = 'tabs-overflow__menu'; menu.setAttribute('role', 'menu');
    outer.appendChild(menu);

    function closeMenu() { menu.classList.remove('is-open'); moreBtn.setAttribute('aria-expanded', 'false'); moreBtn.classList.remove('is-menu-open'); }
    function openMenu() { menu.classList.add('is-open'); moreBtn.setAttribute('aria-expanded', 'true'); moreBtn.classList.add('is-menu-open'); }
    moreBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (menu.classList.contains('is-open')) closeMenu(); else openMenu();
    });
    document.addEventListener('click', function (e) { if (!outer.contains(e.target)) closeMenu(); });
    outer.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

    /* пункт меню — прокси на реальный (скрытый) таб: клик активирует его
       собственный click, поведение/данные таба не дублируются */
    function buildMenu() {
      menu.innerHTML = '';
      tabEls.forEach(function (t) {
        if (t.style.display !== 'none') return;
        var btn = document.createElement('button');
        btn.type = 'button'; btn.className = 'tabs-overflow__item'; btn.setAttribute('role', 'menuitemradio');
        btn.setAttribute('aria-checked', t.getAttribute('aria-selected') === 'true' ? 'true' : 'false');
        var srcIcon = t.querySelector('.tab__icon');
        if (srcIcon) { var ic = document.createElement('span'); ic.className = 'tab__icon'; ic.innerHTML = srcIcon.innerHTML; btn.appendChild(ic); }
        var lb = document.createElement('span'); lb.className = 'tab__label';
        var srcLabel = t.querySelector('.tab__label');
        lb.textContent = srcLabel ? srcLabel.textContent : t.textContent.trim();
        btn.appendChild(lb);
        var srcBadge = t.querySelector('.tab__badge');
        if (srcBadge) { var bd = document.createElement('span'); bd.className = 'tab__badge'; bd.textContent = srcBadge.textContent; btn.appendChild(bd); }
        btn.addEventListener('click', function () { closeMenu(); t.click(); t.focus(); });
        menu.appendChild(btn);
      });
    }

    function layout() {
      tabEls.forEach(function (t) { t.style.display = ''; });
      moreBtn.style.display = 'none';
      var available = host.clientWidth;
      if (!available) return;
      var widths = tabEls.map(function (t) { return t.getBoundingClientRect().width; });
      var total = widths.reduce(function (a, b) { return a + b; }, 0);
      if (total <= available + 0.5) { buildMenu(); return; }
      moreBtn.style.display = '';
      var moreWidth = moreBtn.getBoundingClientRect().width;
      var sum = 0, cutoff = tabEls.length;
      for (var i = 0; i < widths.length; i++) {
        sum += widths[i];
        if (sum + moreWidth > available) { cutoff = i; break; }
      }
      cutoff = Math.max(cutoff, 1);
      tabEls.forEach(function (t, i) { t.style.display = i < cutoff ? '' : 'none'; });
      buildMenu();
    }

    window.addEventListener('resize', layout);
    window.addEventListener('load', layout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
    if (window.ResizeObserver) new ResizeObserver(layout).observe(host);
    if (window.dsIcons) window.dsIcons.apply(host);
    requestAnimationFrame(layout);
    return { mode: 'menu', refresh: layout };
  }

  /* выбранный таб подскролливается в зону видимости — только по горизонтали
     и только внутри самой ленты, страница при этом не двигается */
  function keepVisible(host, el) {
    if (!el) return;
    var box = host.classList.contains('tabs-scroll__viewport') ? host : host.parentElement;
    if (!box || box.scrollWidth <= box.clientWidth + 1) return;
    var l = el.offsetLeft, r = l + el.offsetWidth;
    if (l < box.scrollLeft) box.scrollTo({ left: l - 8, behavior: 'smooth' });
    else if (r > box.scrollLeft + box.clientWidth) box.scrollTo({ left: r - box.clientWidth + 8, behavior: 'smooth' });
  }

  function wireAll(root) {
    root = root || document;
    root.querySelectorAll('[data-tabs]').forEach(function (el) { tabs(el); });
    root.querySelectorAll('[data-segctrl]').forEach(function (el) { segment(el); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { wireAll(document); });
  else wireAll(document);

  window.DSTabs = { tabs: tabs, segment: segment, positionThumb: positionThumb, wireAll: wireAll };
})();
