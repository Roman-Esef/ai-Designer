/* ds-breadcrumbs.js — авто-схлопывание трейла Breadcrumbs по ширине (out-of-box, RulesAudit Фаза 3).
   Зависимости: styles/breadcrumbs.css, ds-menu.js («…»), ds-tooltip.js (тултип обрезанной крошки).

   Подключение (opt-in, чтобы не оживлять статичные примеры витрин):
     <ol class="crumbs" data-breadcrumbs>
       <li class="crumbs__item"><a class="link link--muted" href="…">Главная</a></li>
       <li class="crumbs__item"><a class="link link--muted" href="…">Раздел</a></li>
       <li class="crumbs__item crumbs__item--current"><span class="crumbs__current" aria-current="page">Текущая</span></li>
     </ol>
   Полный список звеньев считывается ОДИН РАЗ при первом bind() (a[href]/текст
   каждого <li>) — дальше по ResizeObserver алгоритм сам решает полный трейл
   показывать или схлопнутый (срединные звенья → «…» с меню), не трогая
   переданную разметку сверх этого.

   Экспорт: window.DSBreadcrumbs = { bind(ol)→api|null, bindAll(root) } */
(function () {
  'use strict';

  function textOf(el) { return (el.textContent || '').trim(); }

  function captureItems(ol) {
    return Array.prototype.map.call(ol.querySelectorAll(':scope > .crumbs__item'), function (li) {
      var current = li.classList.contains('crumbs__item--current');
      var cur = current ? li.querySelector('.crumbs__current') : null;
      var a = li.querySelector('a');
      return { text: textOf(cur || a || li), href: a ? a.getAttribute('href') : null };
    });
  }
  function crumbLink(item) {
    var li = document.createElement('li'); li.className = 'crumbs__item';
    var a = document.createElement('a'); a.href = item.href || '#'; a.className = 'link link--muted';
    a.textContent = item.text; a.title = item.text;
    li.appendChild(a); return li;
  }
  function crumbCurrent(item) {
    var li = document.createElement('li'); li.className = 'crumbs__item crumbs__item--current';
    var span = document.createElement('span'); span.className = 'crumbs__current';
    span.setAttribute('aria-current', 'page'); span.textContent = item.text;
    li.appendChild(span);
    if (window.DSTooltip) window.DSTooltip.bind(span, { text: item.text, truncatedOnly: true, multiline: true });
    return li;
  }
  function crumbMore(hidden) {
    var li = document.createElement('li'); li.className = 'crumbs__item';
    var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'crumbs__more';
    btn.textContent = '…';
    btn.setAttribute('aria-haspopup', 'true'); btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Показать промежуточные страницы: ' + hidden.map(function (h) { return h.text; }).join(', '));
    var menu = document.createElement('div');
    menu.className = 'menu crumbs__popup'; menu.style.position = 'fixed'; menu.hidden = true;
    hidden.forEach(function (h) {
      var item = document.createElement(h.href ? 'a' : 'button');
      if (h.href) item.href = h.href; else item.type = 'button';
      item.className = 'menu__item';
      var label = document.createElement('span'); label.className = 'menu__item-label'; label.textContent = h.text;
      item.appendChild(label); menu.appendChild(item);
    });
    document.body.appendChild(menu);
    li.appendChild(btn);
    if (window.DSMenu) window.DSMenu.bind(btn, { menu: menu, align: 'start' });
    li.__dsPopup = menu;
    return li;
  }
  function overflows(el) { return el.scrollWidth > el.clientWidth + 1; }

  function render(ol, items) {
    if (ol.__dsPopups) ol.__dsPopups.forEach(function (m) { m.remove(); });
    ol.__dsPopups = [];
    var w = ol.clientWidth;
    var probe = document.createElement('ol'); probe.className = ol.className;
    probe.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;left:-9999px;top:-9999px;width:' + w + 'px;';
    items.forEach(function (it, i) { probe.appendChild(i === items.length - 1 ? crumbCurrent(it) : crumbLink(it)); });
    document.body.appendChild(probe);
    var collapse = items.length > 2 && overflows(probe);
    probe.remove();

    ol.innerHTML = '';
    if (!collapse) {
      items.forEach(function (it, i) { ol.appendChild(i === items.length - 1 ? crumbCurrent(it) : crumbLink(it)); });
    } else {
      ol.appendChild(crumbLink(items[0]));
      var moreLi = crumbMore(items.slice(1, -1));
      ol.__dsPopups.push(moreLi.__dsPopup);
      ol.appendChild(moreLi);
      ol.appendChild(crumbCurrent(items[items.length - 1]));
    }
  }

  function bind(ol) {
    if (ol.__dsBreadcrumbs) return ol.__dsBreadcrumbs;
    var items = captureItems(ol);
    if (!items.length) return null;
    function reflow() { render(ol, items); }
    reflow();
    var ro = new ResizeObserver(reflow);
    ro.observe(ol);
    var api = { refresh: reflow, items: items };
    ol.__dsBreadcrumbs = api;
    return api;
  }
  function bindAll(root) { (root || document).querySelectorAll('[data-breadcrumbs]').forEach(bind); }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { bindAll(document); });
  else bindAll(document);

  window.DSBreadcrumbs = { bind: bind, bindAll: bindAll };
})();
