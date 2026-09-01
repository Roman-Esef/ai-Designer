/* ds-actions-overflow.js — переполнение ряда кнопок в меню «Ещё» (out-of-box, RulesAudit Фаза 3).
   Тот же принцип, что у ds-tabs.js для табов (data-tabs-overflow="menu"): кнопки,
   не поместившиеся в ширину контейнера, скрываются и появляются как пункты меню
   за кнопкой «Ещё действия» (открытие/позиция/клавиатура — ds-menu.js). Первым
   кандидатом — PageHeader (.phead__actions), но применим к любому ряду .btn.

   Подключение (opt-in): <div class="phead__actions" data-actions-overflow>…</div>
   Экспорт: window.DSActionsOverflow = { bind(host)→api|null, bindAll(root) } */
(function () {
  'use strict';
  function bind(host) {
    if (host.__dsActOverflow) return host.__dsActOverflow;
    if (!host.parentNode) return null;
    var btns = Array.prototype.filter.call(host.children, function (n) { return n.matches && n.matches('.btn'); });
    if (btns.length < 2) return null;

    var sizeM = btns[0].className.match(/\bbtn--(xs|s|m)\b/);
    var typeM = btns[0].className.match(/\bbtn--(accent|outline|transparent)\b/);
    var moreBtn = document.createElement('button');
    moreBtn.type = 'button';
    moreBtn.className = 'btn btn--icon-only ' + (typeM ? typeM[0] : 'btn--outline') + ' ' + (sizeM ? sizeM[0] : 'btn--m');
    moreBtn.setAttribute('aria-haspopup', 'menu');
    moreBtn.setAttribute('aria-expanded', 'false');
    moreBtn.setAttribute('aria-label', 'Показать скрытые действия');
    moreBtn.innerHTML = (window.DS_ICONS && window.DS_ICONS['more-dots']) || '&#8943;';
    moreBtn.style.display = 'none';
    host.appendChild(moreBtn);

    var menu = document.createElement('div');
    menu.className = 'menu';
    menu.setAttribute('role', 'menu'); menu.hidden = true;
    document.body.appendChild(menu);
    var menuApi = window.DSMenu ? window.DSMenu.bind(moreBtn, { menu: menu, align: 'end' }) : null;

    /* натуральная (несжатая) ширина каждой кнопки — сжатая getBoundingClientRect
       живых .btn (flex-shrink:1 + min-width:0 в page-header.css) всегда "влезает",
       порог обрезки никогда не сработает. Меряем клон off-screen, как probe в
       ds-breadcrumbs.js: flex:none + white-space:nowrap внутри max-content хоста. */
    var probe = host.cloneNode(false);
    probe.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;left:-9999px;top:-9999px;width:max-content;flex-wrap:nowrap;';
    var widths = btns.map(function (b) {
      var c = b.cloneNode(true);
      c.style.flex = 'none'; c.style.minWidth = ''; c.style.whiteSpace = 'nowrap';
      probe.appendChild(c);
      return c;
    });
    document.body.appendChild(probe);
    widths = widths.map(function (c) { return c.getBoundingClientRect().width; });
    probe.remove();

    function buildMenu() {
      menu.innerHTML = '';
      btns.forEach(function (b) {
        if (b.style.display !== 'none') return;
        var item = document.createElement('button');
        item.type = 'button'; item.className = 'menu__item'; item.setAttribute('role', 'menuitem');
        var srcIcon = b.querySelector('svg, [data-icon]');
        if (srcIcon) { var ic = document.createElement('span'); ic.className = 'menu__item-icon'; ic.innerHTML = srcIcon.outerHTML; item.appendChild(ic); }
        var label = b.querySelector('.btn__label');
        var lb = document.createElement('span'); lb.className = 'menu__item-label';
        lb.textContent = label ? label.textContent : (b.getAttribute('aria-label') || b.textContent.trim());
        item.appendChild(lb);
        if (b.disabled) item.setAttribute('aria-disabled', 'true');
        item.addEventListener('click', function () { if (menuApi) menuApi.close(); b.click(); });
        menu.appendChild(item);
      });
      if (window.dsIcons) window.dsIcons.apply(menu);
    }

    function layout() {
      var available = host.clientWidth;
      var gap = parseFloat(getComputedStyle(host).columnGap || getComputedStyle(host).gap) || 0;
      var total = widths.reduce(function (a, w) { return a + w; }, 0) + gap * Math.max(0, widths.length - 1);
      if (total <= available + 0.5) {
        btns.forEach(function (b) { b.style.display = ''; });
        moreBtn.style.display = 'none';
        buildMenu();
        return;
      }
      moreBtn.style.display = '';
      var moreW = moreBtn.getBoundingClientRect().width;
      var sum = moreW, cutoff = 0;
      for (var i = 0; i < widths.length; i++) {
        sum += widths[i] + (i > 0 ? gap : 0);
        if (sum + gap > available) break;
        cutoff = i + 1;
      }
      btns.forEach(function (b, i) { b.style.display = i < cutoff ? '' : 'none'; });
      buildMenu();
    }

    var ro = new ResizeObserver(layout);
    ro.observe(host);
    var api = { refresh: layout };
    host.__dsActOverflow = api;
    requestAnimationFrame(layout);
    return api;
  }
  function bindAll(root) { (root || document).querySelectorAll('[data-actions-overflow]').forEach(bind); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { bindAll(document); });
  else bindAll(document);
  window.DSActionsOverflow = { bind: bind, bindAll: bindAll };
})();
