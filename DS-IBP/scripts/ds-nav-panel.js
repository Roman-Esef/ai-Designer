/* =========================================================================
   DS NavPanel — рантайм панели навигации (out-of-box).
   Зависимости: styles/nav-panel.css; иконки — icons-data.js + ds-icons.js.

   Экспорт: window.DSNavPanel = {
     bind(nav, opts) → api | null   — навесить поведение на .nav
     bindAll(root)                   — обойти .nav внутри root
     setMode(nav, mode)              — 'rail' | 'drawer' | 'fixed'
     placeRailLabels(nav)            — пересчитать позиции rail-тултипов
   }

   Автоподключение: любой <nav class="nav nav--rail|--drawer|--fixed"> на
   странице получает поведение — бургер сворачивает/разворачивает панель,
   пин переключает drawer ↔ fixed, подписи пунктов в rail позиционируются
   как тултипы (position:fixed, вне скролл-контейнера), пункт-родитель
   .nav__item--acc раскрывает/сворачивает вложенный под-список (в rail —
   разворачивает панель), развёрнутая (drawer) панель сворачивается в rail
   кликом вне панели или по Esc (клики внутри открытых модалок — например,
   смена роли из футера — drawer не сворачивают).

   Настройки на панели: data-nav-collapsed-mode (в какой режим уводит бургер
   из rail: drawer|fixed, по умолчанию — последний развёрнутый, иначе drawer),
   data-nav-auto="no" — выключить автоподключение для этой панели,
   data-nav-modes="no" — оставить только rail-тултипы, без переключения режимов
   (витрины, где режим панели зафиксирован подписью).

   Событие: 'ds-nav-mode' на .nav — detail {mode, prev}.
   ========================================================================= */
(function () {
  'use strict';

  var MODES = ['rail', 'drawer', 'fixed'];
  var RAIL_GAP = 10; /* зазор от правого края панели до подписи-тултипа */

  function icon(el, name) {
    if (!el) return;
    var i = el.querySelector('i[data-icon]');
    if (!i) return;
    i.setAttribute('data-icon', name);
    i.innerHTML = '';
    delete i.dataset.iconDone; /* ds-icons помечает отрисованные — снимаем метку */
    if (window.dsIcons) window.dsIcons.apply(el);
  }

  function modeOf(nav) {
    for (var i = 0; i < MODES.length; i++) if (nav.classList.contains('nav--' + MODES[i])) return MODES[i];
    return 'rail'; /* без класса режима — по умолчанию свёрнуто */
  }

  /* rail-подписи спозиционированы фиксированно — иначе их режет скролл списка */
  function placeRailLabels(nav) {
    if (modeOf(nav) !== 'rail') return;
    var r = nav.getBoundingClientRect();
    nav.querySelectorAll('.nav__item').forEach(function (item) {
      var lbl = item.querySelector('.nav__label');
      if (!lbl) return;
      var ir = item.getBoundingClientRect();
      lbl.style.top = (ir.top + ir.height / 2) + 'px';
      lbl.style.left = (r.right + RAIL_GAP) + 'px';
    });
  }

  function setMode(nav, mode) {
    if (MODES.indexOf(mode) < 0) return modeOf(nav);
    var prev = modeOf(nav);
    if (prev === mode) return mode;
    MODES.forEach(function (m) { nav.classList.toggle('nav--' + m, m === mode); });

    var burger = nav.querySelector('.nav__burger');
    if (burger) burger.setAttribute('aria-label', mode === 'rail' ? 'Развернуть меню' : 'Свернуть меню');
    var pin = nav.querySelector('.nav__pin');
    if (pin) {
      pin.setAttribute('aria-pressed', String(mode === 'fixed'));
      pin.setAttribute('aria-label', mode === 'fixed' ? 'Открепить панель' : 'Закрепить панель');
      icon(pin, mode === 'fixed' ? 'unpin-menu' : 'pin-menu');
    }
    /* подписи в развёрнутых режимах — обычный поток, инлайн-координаты снимаем */
    if (mode !== 'rail') {
      nav.querySelectorAll('.nav__label').forEach(function (l) { l.style.top = ''; l.style.left = ''; });
    } else {
      placeRailLabels(nav);
    }
    nav.dispatchEvent(new CustomEvent('ds-nav-mode', { bubbles: true, detail: { mode: mode, prev: prev } }));
    return mode;
  }

  function bind(nav, opts) {
    opts = opts || {};
    if (nav.__dsNavPanel) return nav.__dsNavPanel;
    var d = nav.dataset || {};
    var expanded = opts.expandedMode || d.navCollapsedMode || (modeOf(nav) === 'rail' ? 'drawer' : modeOf(nav));
    var modes = opts.modes !== false && d.navModes !== 'no';
    nav.__dsNavModes = modes;

    function toggleRail() {
      var cur = modeOf(nav);
      if (cur === 'rail') setMode(nav, expanded);
      else { expanded = cur; setMode(nav, 'rail'); }
    }
    function togglePin() {
      var cur = modeOf(nav);
      if (cur === 'rail') return;
      expanded = cur === 'fixed' ? 'drawer' : 'fixed';
      setMode(nav, expanded);
    }

    nav.addEventListener('click', function (e) {
      /* пункт-родитель с под-списком (аккордеон): в rail клик разворачивает
         панель, в развёрнутых режимах — переключает aria-expanded */
      var parent = e.target.closest('.nav__item--acc');
      if (parent) {
        e.preventDefault();
        if (modeOf(nav) === 'rail') { setMode(nav, expanded); return; }
        parent.setAttribute('aria-expanded', String(parent.getAttribute('aria-expanded') !== 'true'));
        return;
      }
      if (!modes) return;
      if (e.target.closest('.nav__burger')) { e.preventDefault(); toggleRail(); return; }
      if (e.target.closest('.nav__pin')) { e.preventDefault(); togglePin(); }
    });
    /* позиция подписи считается на входе курсора: пункт мог уехать скроллом */
    nav.addEventListener('mouseover', function (e) {
      var item = e.target.closest && e.target.closest('.nav__item');
      if (item && nav.contains(item)) placeRailLabels(nav);
    });
    nav.addEventListener('focusin', function (e) {
      var item = e.target.closest && e.target.closest('.nav__item');
      if (item && nav.contains(item)) placeRailLabels(nav);
    });
    var list = nav.querySelector('.nav__list');
    if (list) list.addEventListener('scroll', function () { placeRailLabels(nav); });

    var api = {
      nav: nav,
      mode: function () { return modeOf(nav); },
      setMode: function (m) { return setMode(nav, m); },
      toggleRail: toggleRail,
      togglePin: togglePin,
      placeLabels: function () { placeRailLabels(nav); },
    };
    nav.__dsNavPanel = api;
    return api;
  }

  /* Развёрнутая (drawer), но не закреплённая (fixed) панель сворачивается в rail
     кликом вне панели и по Esc. Клики внутри открытых модалок (например, смена
     роли — футер панели) drawer не трогают: модалка — отдельный слой поверх.
     Сворачивается только «живая» панель каркаса: внутри .nav-layout (демо-панели
     документации вне каркаса не трогаем), привязанная с включёнными режимами. */
  function outsideDrawer(t) {
    return t && t.closest && t.closest('.modal-scrim');
  }
  function liveDrawer(nav) {
    if (!nav.closest || !nav.closest('.nav-layout')) return false; /* демо вне каркаса */
    if (nav.__dsNavModes === false) return false;                  /* режимы выключены */
    return modeOf(nav) === 'drawer';
  }
  document.addEventListener('click', function (e) {
    if (outsideDrawer(e.target)) return;
    document.querySelectorAll('.nav--drawer').forEach(function (nav) {
      if (!liveDrawer(nav)) return;
      if (nav.contains(e.target)) return; /* клик внутри панели — её обработчики решают */
      setMode(nav, 'rail');
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    /* Esc закрывает сначала открытую модалку — drawer не трогаем */
    if (document.querySelector('.modal-scrim:not([hidden])')) return;
    document.querySelectorAll('.nav--drawer').forEach(function (nav) {
      if (liveDrawer(nav)) setMode(nav, 'rail');
    });
  });

  function bindAll(root) {
    (root || document).querySelectorAll('.nav').forEach(function (nav) {
      if (nav.getAttribute('data-nav-auto') === 'no') return;
      bind(nav);
    });
  }

  window.addEventListener('resize', function () {
    document.querySelectorAll('.nav--rail').forEach(placeRailLabels);
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { bindAll(document); });
  else bindAll(document);

  window.DSNavPanel = { bind: bind, bindAll: bindAll, setMode: setMode, placeRailLabels: placeRailLabels };
})();
