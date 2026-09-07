/* =========================================================================
   DS Float — общий слой плавающих компонентов (out-of-box).

   Единый механизм пере-якорения: выносит плавающий элемент (tooltip, popover,
   menu, dropdownlist, chart tooltip) из его авторской позиции в общий слой
   поверх контента, чтобы его z-index не запирался в stacking context
   закреплённой ячейки таблицы (.tc--pinned: position:sticky; z-index:1) и
   не перекрывался липкой шапкой (z-index 3/4). Инцидент: портфель ДИД,
   тултип первой строки закреплённой колонки перекрывался хедером.

   Экспорт: window.DSFloat = {
     host()                 — возвращает (лениво создаёт) слой
     mount(el, opts)        — перенести el в слой, position:fixed, запомнить родителя
                              (opts.anchor — элемент, ОТ которого открыт слой:
                              из модалки монтируем в её скрим, см. ниже)
     unmount(el)            — вернуть el исходному родителю, снять инлайн-позицию
     apply(el, x, y)        — списать координаты вьюпорта в left/top (fixed vs absolute)
   }

   МОДАЛКА — ИСКЛЮЧЕНИЕ ИЗ ОБЩЕГО СЛОЯ. Слой лежит в корне body, и это же
   делает его непригодным, когда плавающий элемент открыт ИЗ модалки: z-index
   детей слоя разрешается в корневом контексте (tooltip 30, menu/popover/
   dropdown 40), а `.modal-scrim` несёт 1000 — элемент рисуется ПОД подложкой,
   а над самой модалкой ещё и под её непрозрачным фоном. Вторым слоем
   `DSModal.lockPage()` вешает `inert` на всех детей body, кроме скримов, —
   общий слой становится недоступен указателю. Поэтому mount с `anchor`
   внутри модалки монтирует элемент В СКРИМ: он выведен из-под обоих правил.
   Именно в скрим, а не в `.modal`: у модалки `overflow: hidden` (обрезала бы)
   и анимация появления с `transform` — на время анимации она стала бы
   containing block для `position: fixed` и координаты уехали бы.
   (Инцидент: портфель ДИД, 05.09.2026 — сначала DropdownList со своей
   локальной починкой, затем тултипы чипов в модалке фильтра.)

   Слой: <div class="ds-float-layer">, статичный контейнер (БЕЗ position и БЕЗ
   z-index) + pointer-events:none (правило — styles/shadow.css). Важно: никакого position:fixed — иначе слой
   становится stacking context и «запирает» z-index детей на своём уровне.
   Дети сами получают position:fixed в mount() и позиционируются от вьюпорта,
   поэтому слой остаётся нулевого размера и нейтрален для раскладки.
   Поскольку слой НЕ создаёт stacking context, z-index плавающих детей (tooltip
   30, popover/menu/dropdown 40, chart__tip 5) разрешается в КОРНЕВОМ контексте
   и рисуется выше липкой шапки таблицы (z-index 3/4) и закреплённой ячейки
   (z-index 1) — иначе тултип остаётся под шапкой.

   Зависимости: нет. Включается в ds.js раньше компонентных рантаймов.
   ========================================================================= */
(function () {
  'use strict';

  var layer = null;

  function host() {
    if (layer) return layer;
    layer = document.createElement('div');
    layer.className = 'ds-float-layer';
    layer.setAttribute('data-ds-float', '');
    /* pointer-events:none — в styles/shadow.css (.ds-float-layer), не инлайном:
       правило класса, который вешает рантайм, обязано жить в CSS ДС */
    (document.body || document.documentElement).appendChild(layer);
    return layer;
  }

  /* Куда монтировать. Явный `parent` — последнее слово потребителя. Иначе
     решает якорь: плавающий элемент, открытый из модалки, живёт в её скриме
     (`.modal-scrim`), всё остальное — в общем слое. Разбор — в шапке файла.
     `closest` берёт БЛИЖАЙШИЙ скрим, поэтому вложенный диалог
     (`.modal-scrim--nested`, z-index 1010) обслуживается тем же правилом. */
  function resolveParent(opts) {
    if (opts.parent) return opts.parent;
    var a = opts.anchor;
    var scrim = a && a.closest ? a.closest('.modal-scrim') : null;
    return scrim || host();
  }

  /* mount — перенос плавающего элемента в слой.
     Запоминаем исходного родителя и позицию среди сиблингов, чтобы unmount
     вернул элемент точно на место (авторская разметка не меняется). */
  function mount(el, opts) {
    if (!el) return el;
    opts = opts || {};
    if (!el.__dsFloatHome) {
      el.__dsFloatHome = { parent: el.parentNode, next: el.nextSibling };
    }
    var target = resolveParent(opts);
    if (el.parentNode !== target) target.appendChild(el);
    el.style.position = 'fixed';
    /* интерактивные слои (popover/menu/dropdown, rich tooltip) должны ловить
       клики/наведение поверх слоя с pointer-events:none — вернуть auto.
       Chart tooltip указатель не ловит: pointerEvents:false оставляет CSS
       (.chart__tip уже pointer-events:none). Обычный tooltip тоже получает
       auto, как и в исходной разметке (тултип не задевает цель). */
    if (opts.pointerEvents !== false) el.style.pointerEvents = 'auto';
    if (opts.zIndex != null) el.style.zIndex = opts.zIndex;
    return el;
  }

  /* unmount — вернуть элемент исходному родителю, снять инлайн-позицию. */
  function unmount(el) {
    if (!el) return el;
    var home = el.__dsFloatHome;
    el.style.position = '';
    el.style.left = '';
    el.style.top = '';
    if (el.style.pointerEvents) el.style.pointerEvents = '';
    if (el.style.zIndex) el.style.zIndex = '';
    if (home && home.parent) {
      if (home.next && home.next.parentNode === home.parent) home.parent.insertBefore(el, home.next);
      else home.parent.appendChild(el);
    }
    delete el.__dsFloatHome;
    return el;
  }

  /* apply — координаты вьюпорта (x, y) в left/top элемента.
     fixed: координаты вьюпорта пишутся как есть.
     absolute: переводятся в координаты позиционирующего предка (прежняя логика).
     offsetParent — явно переданный позиционирующий предок (для демо с кастомным
     стажем); по умолчанию берётся из DOM (el.offsetParent || el.parentElement). */
  function apply(el, x, y, offsetParent) {
    if (!el) return;
    var nl, nt;
    if (getComputedStyle(el).position === 'fixed') {
      nl = Math.round(x) + 'px';
      nt = Math.round(y) + 'px';
    } else {
      var op = offsetParent || el.offsetParent || el.parentElement;
      var ox = -(window.pageXOffset || 0), oy = -(window.pageYOffset || 0);
      if (op && op !== document.body && op !== document.documentElement) {
        var opr = op.getBoundingClientRect();
        var bcs = getComputedStyle(op);
        ox = opr.left + (parseFloat(bcs.borderLeftWidth) || 0) - op.scrollLeft;
        oy = opr.top + (parseFloat(bcs.borderTopWidth) || 0) - op.scrollTop;
      }
      nl = Math.round(x - ox) + 'px';
      nt = Math.round(y - oy) + 'px';
    }
    /* пишем только при изменении: лишняя запись стилей провоцирует
       reflow → scroll → repositioning по кругу */
    if (el.style.left !== nl) el.style.left = nl;
    if (el.style.top !== nt) el.style.top = nt;
  }

  window.DSFloat = { host: host, mount: mount, unmount: unmount, apply: apply };
})();
