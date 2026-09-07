/* =========================================================================
   DS DropdownList — рантайм комбобокса Select/Autocomplete (out-of-box).
   Зависимости: styles/dropdown-list.css. Иконки в разметке опций — как
   обычно через icons-data.js + ds-icons.js (рантайм их не требует).

   Экспорт: window.DSDropdownList = {
     bind(field, opts) → api | null   — навесить открытие/позиционирование/
                                          клавиатуру/выбор на поле-триггер
     bindAll(root)                     — обойти [data-ddl] внутри root
     place(list, field, opts)          — позиционирование под полем (авто-flip)
     wireMulti(list, onChange)         — три-стейт «Выбрать всё» + чекбоксы
     closeAll() · current() → api|null
   }

   Автоподключение: <span class="ddl-anchor"><div class="fld" data-ddl>…
   </div><div id="…" class="ddl" role="listbox">…</div></span>. opts.list
   можно передать напрямую (без data-ddl/.ddl-anchor). opts.multiple
   включает три-стейт «Выбрать всё» и не закрывает список при выборе.

   Поведение по спеке: список раскрывается под полем, ширина = ширине поля,
   разворот вверх при нехватке места, клавиатура (↑ ↓ Home End Enter Space
   typeahead Esc) без потери фокуса из поля — активная опция получает класс
   .is-focus и aria-activedescendant. На ОТКРЫТИИ активной опции нет: фокус
   один и он на поле-триггере, подсветка в списке появляется только после
   первого шага клавишами (до 05.09.2026 подсвечивалась первая строка); закрытие по клику вне / Esc / выбору
   (кроме множественного выбора).
   ========================================================================= */
(function () {
  'use strict';

  var GAP = 6, GUARD = 6;
  var current = null;
  var uid = 0;

  function bounds(el) {
    if (!el) return { left: 0, top: 0, right: document.documentElement.clientWidth, bottom: document.documentElement.clientHeight };
    var r = el.getBoundingClientRect();
    return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
  }

  /* ------------------------------------------------------------------ */
  /* позиционирование: ширина списка = ширине поля, авто-flip вверх       */
  /* ------------------------------------------------------------------ */
  function place(list, field, o) {
    o = o || {};
    var gap = o.gap == null ? GAP : o.gap;
    var br = bounds(o.boundary || null);
    var fr = field.getBoundingClientRect();
    list.style.width = fr.width + 'px';
    var lh = list.offsetHeight;
    var below = br.bottom - fr.bottom, above = fr.top - br.top;
    var placement = (o.placement === 'top') || (below < lh + gap + GUARD && above > below) ? 'top' : 'bottom';
    var y = placement === 'top' ? fr.top - gap - lh : fr.bottom + gap;
    var x = fr.left;
    /* из координат вьюпорта — в left/top элемента (см. DSFloat.apply).
       Если DSFloat не подключён (страницы-документация грузят рантайм точечно),
       работаем прежним инлайн-пересчётом — элемент остаётся absolute. */
    var Float = window.DSFloat;
    if (Float) {
      Float.apply(list, x, y, o.offsetParent);
    } else {
      var fl = o.offsetParent || list.offsetParent || list.parentElement;
      var fOx = -(window.pageXOffset || 0), fOy = -(window.pageYOffset || 0);
      if (fl && fl !== document.body && fl !== document.documentElement) {
        var fOpr = fl.getBoundingClientRect(), fCs = getComputedStyle(fl);
        fOx = fOpr.left + (parseFloat(fCs.borderLeftWidth) || 0) - fl.scrollLeft;
        fOy = fOpr.top + (parseFloat(fCs.borderTopWidth) || 0) - fl.scrollTop;
      }
      list.style.left = Math.round(x - fOx) + 'px';
      list.style.top = Math.round(y - fOy) + 'px';
    }
    list.style.setProperty('--ddl-origin', (placement === 'top' ? 'bottom' : 'top') + ' left');
    return placement;
  }

  /* ------------------------------------------------------------------ */
  /* множественный выбор: три-стейт «Выбрать всё»                        */
  /* ------------------------------------------------------------------ */
  function setChecked(it, v) {
    it.setAttribute('aria-checked', v === 'mixed' ? 'mixed' : String(!!v));
    var mark = it.querySelector('.cb__mark');
    if (mark) mark.innerHTML = v === 'mixed'
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 12h12"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>';
  }
  function refreshAllRow(list) {
    var allRow = list.querySelector('.ddl__item--all');
    if (!allRow) return;
    var rows = Array.prototype.filter.call(list.querySelectorAll('.ddl__item--checkbox:not(.ddl__item--all)'), function (r) {
      return r.getAttribute('aria-disabled') !== 'true';
    });
    var on = rows.filter(function (r) { return r.getAttribute('aria-checked') === 'true'; }).length;
    setChecked(allRow, on === rows.length ? true : (on ? 'mixed' : false));
  }
  function wireMulti(list, onChange) {
    var allRow = list.querySelector('.ddl__item--all');
    var rows = Array.prototype.filter.call(list.querySelectorAll('.ddl__item--checkbox:not(.ddl__item--all)'), function (r) {
      return r.getAttribute('aria-disabled') !== 'true';
    });
    function refresh() {
      var on = rows.filter(function (r) { return r.getAttribute('aria-checked') === 'true'; }).length;
      if (allRow) setChecked(allRow, on === rows.length ? true : (on ? 'mixed' : false));
      if (onChange) onChange(on, rows.length);
    }
    if (!list.__dsDdlMulti) {
      list.__dsDdlMulti = true;
      rows.forEach(function (r) { r.addEventListener('click', function () { setChecked(r, r.getAttribute('aria-checked') !== 'true'); refresh(); }); });
      if (allRow) allRow.addEventListener('click', function () {
        var turnOn = allRow.getAttribute('aria-checked') !== 'true';
        rows.forEach(function (r) { setChecked(r, turnOn); });
        refresh();
      });
    }
    refresh();
    return { refresh: refresh };
  }

  /* ------------------------------------------------------------------ */
  /* bind — поведение поля-триггера                                       */
  /* ------------------------------------------------------------------ */
  function resolveList(field, opts) {
    if (opts.list) return opts.list;
    var id = field.getAttribute('data-ddl');
    if (id) return document.getElementById(id);
    var anchor = field.closest('.ddl-anchor');
    if (anchor) return anchor.querySelector('.ddl');
    var next = field.nextElementSibling;
    return next && next.classList.contains('ddl') ? next : null;
  }
  function items(list) {
    return Array.prototype.filter.call(list.querySelectorAll('.ddl__item'), function (it) { return it.getAttribute('aria-disabled') !== 'true'; });
  }

  function bind(field, opts) {
    opts = opts || {};
    if (field.__dsDdl) return field.__dsDdl;
    var list = resolveList(field, opts);
    if (!list) return null;

    var conf = {
      multiple: !!opts.multiple,
      gap: opts.gap != null ? opts.gap : GAP,
      boundary: opts.boundary || null,
      offsetParent: opts.offsetParent || null,
      placement: opts.placement || null,
      keepOpenOnSelect: opts.keepOpenOnSelect != null ? opts.keepOpenOnSelect : conf_multiple(opts),
    };
    function conf_multiple(o) { return !!o.multiple; }

    list.classList.add('ddl--floating');
    if (!list.getAttribute('role')) list.setAttribute('role', 'listbox');
    if (conf.multiple) list.setAttribute('aria-multiselectable', 'true');
    if (!list.id) list.id = 'ddl-' + (++uid);
    if (field.tabIndex < 0 && !/^(input|button|select|textarea|a)$/i.test(field.tagName)) field.tabIndex = 0;
    field.setAttribute('role', 'combobox');
    field.setAttribute('aria-haspopup', 'listbox');
    field.setAttribute('aria-expanded', 'false');
    field.setAttribute('aria-controls', list.id);
    items(list).forEach(function (it) { it.tabIndex = -1; });

    var activeEl = null, buf = '', bufT;
    function isOpen() { return list.classList.contains('is-open'); }
    function reposition() { return place(list, field, conf); }

    function setActive(el) {
      if (activeEl) activeEl.classList.remove('is-focus');
      activeEl = el || null;
      if (activeEl) {
        activeEl.classList.add('is-focus');
        if (!activeEl.id) activeEl.id = list.id + '-opt' + (++uid);
        field.setAttribute('aria-activedescendant', activeEl.id);
        if (activeEl.scrollIntoView) activeEl.scrollIntoView({ block: 'nearest' });
      } else field.removeAttribute('aria-activedescendant');
    }

    function open() {
      if (isOpen()) return api;
      if (current && current !== api) current.close();
      list.classList.add('is-open');
      field.classList.add('is-open');
      field.setAttribute('aria-expanded', 'true');
      /* Слой DSFloat живёт в корне body с z-index 40, а .modal-scrim — 1000:
         список, открытый из поля ВНУТРИ модалки, рисовался под её подложкой
         и не ловил клики (инцидент: фильтр портфеля ДИД, 05.09.2026). Плюс
         DSModal.lockPage() ставит inert на всех детей body, кроме скримов, —
         уже созданный общий слой становился недоступен указателю. Поэтому
         поле из модалки монтирует список в свой скрим: position:fixed и
         координаты вьюпорта от этого не меняются, а стек и inert — да. */
      /* куда монтировать — решает общий слой по якорю (DSFloat.mount):
         из модалки список уезжает в её скрим, иначе в общий слой */
      if (window.DSFloat) DSFloat.mount(list, { anchor: field });
      reposition();
      /* На открытии активной опции НЕТ. Раньше подсвечивалась выбранная, а при
         её отсутствии — первая строка: список открывался с уже «наведённой»
         строкой, и пользователь видел два фокуса сразу — рамку на поле и
         подсветку в списке. Фокус остаётся на поле-триггере (он и держит
         реальный фокус, список — popup), а активная опция появляется только
         когда пользователь пошёл по списку клавишами.
         Выбранную опцию всё равно подкручиваем в зону видимости: в длинном
         справочнике список обязан открыться там, где стоит текущее значение,
         но подсвечивает её собственное правило [aria-selected], а не .is-focus. */
      var sel = list.querySelector('.ddl__item[aria-selected="true"]');
      if (sel && sel.scrollIntoView) sel.scrollIntoView({ block: 'nearest' });
      current = api;
      return api;
    }
    function close(returnFocus) {
      if (!isOpen()) return api;
      list.classList.remove('is-open');
      field.classList.remove('is-open');
      field.setAttribute('aria-expanded', 'false');
      setActive(null);
      if (window.DSFloat) DSFloat.unmount(list);
      if (current === api) current = null;
      if (returnFocus) field.focus();
      return api;
    }
    function toggle() { return isOpen() ? close() : open(); }

    field.addEventListener('click', function () { toggle(); });
    field.addEventListener('keydown', function (e) {
      if (!isOpen()) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
        return;
      }
      var list_ = items(list);
      var i = list_.indexOf(activeEl);
      /* активной опции ещё нет (список только открыли) — идём от выбранной,
         а если и её нет, то ArrowDown даёт первую опцию, ArrowUp — последнюю */
      var fresh = i < 0;
      if (fresh) i = list_.indexOf(list.querySelector('.ddl__item[aria-selected="true"]'));
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive(i < 0 ? list_[0] : list_[(i + 1) % list_.length]);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive(i < 0 ? list_[list_.length - 1] : list_[(i - 1 + list_.length) % list_.length]);
      }
      else if (e.key === 'Home') { e.preventDefault(); setActive(list_[0]); }
      else if (e.key === 'End') { e.preventDefault(); setActive(list_[list_.length - 1]); }
      else if (e.key === 'Enter' || (e.key === ' ' && conf.multiple)) { e.preventDefault(); if (activeEl) activeEl.click(); }
      else if (e.key === 'Escape') { e.preventDefault(); close(true); }
      else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
        clearTimeout(bufT); buf += e.key.toLowerCase();
        bufT = setTimeout(function () { buf = ''; }, 700);
        var from = (i < 0 ? 0 : i + 1);   /* активной нет — ищем с начала списка */
        for (var n = 0; n < list_.length; n++) {
          var it = list_[(from + n) % list_.length];
          var lab = (it.querySelector('.ddl__item-label') || it).textContent.trim().toLowerCase();
          if (lab.indexOf(buf) === 0) { setActive(it); break; }
        }
      }
    });

    list.addEventListener('click', function (e) {
      var it = e.target.closest('.ddl__item');
      if (!it || it.getAttribute('aria-disabled') === 'true') return;
      if (it.classList.contains('ddl__item--action')) { if (opts.onAction) opts.onAction(it); return; }
      if (it.classList.contains('ddl__item--checkbox')) {
        if (it.classList.contains('ddl__item--all')) {
          var turnOn = it.getAttribute('aria-checked') !== 'true';
          items(list).forEach(function (x) { if (x.classList.contains('ddl__item--checkbox') && x !== it) setChecked(x, turnOn); });
          setChecked(it, turnOn);
        } else {
          setChecked(it, it.getAttribute('aria-checked') !== 'true');
          refreshAllRow(list);
        }
        if (opts.onToggle) opts.onToggle(it);
        setActive(it);
        return;
      }
      items(list).forEach(function (x) { if (x.hasAttribute('aria-selected')) x.setAttribute('aria-selected', 'false'); });
      it.setAttribute('aria-selected', 'true');
      if (opts.onSelect) opts.onSelect(it);
      if (!conf.keepOpenOnSelect) close(true);
    });

    var api = { list: list, field: field, open: open, close: close, toggle: toggle, place: reposition, isOpen: isOpen, config: conf };
    field.__dsDdl = api;
    list.__dsDdl = api;
    return api;
  }

  function bindAll(root) { (root || document).querySelectorAll('[data-ddl]').forEach(function (f) { bind(f); }); }
  function closeAll() { if (current) current.close(); }

  document.addEventListener('pointerdown', function (e) {
    if (!current) return;
    if (current.list.contains(e.target) || current.field.contains(e.target)) return;
    current.close();
  }, true);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && current) current.close(true); });
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

  window.DSDropdownList = { bind: bind, bindAll: bindAll, place: place, wireMulti: wireMulti, closeAll: closeAll, current: function () { return current; } };
})();
