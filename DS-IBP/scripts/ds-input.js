/* =========================================================================
   DS Input — общий рантайм поля ввода (InputText · InputAutocomplete ·
   InputDate · InputDateRange). Закрывает два поведения, которые спеки
   описывали как штатные, но в коде их не было ни одной строкой:

   1. КРЕСТИК ОЧИСТКИ ЖИВЁТ ПО ЗНАЧЕНИЮ. Крестик виден ровно тогда, когда в
      поле есть значение — текст в контроле или чипы в `.inp__chips`. Пусто —
      крестика нет; появилось значение (набрали руками, выбрали из списка,
      поставили календарём) — крестик есть. Если в разметке крестика нет
      вовсе, рантайм добавляет его сам, соблюдая порядок действий из спеки
      InputText: информер -> крестик -> календарь -> шеврон.

   2. ПЕРЕПОЛНЕНИЕ ЧИПОВ СВОРАЧИВАЕТСЯ В «+N». Чипы, не помещающиеся в
      ширину поля, скрываются, а в конце стека встаёт чип-счётчик «+N» —
      без крестика удаления (правило InputAutocomplete). Раньше `.inp__chips`
      просто обрезал лишнее по `overflow: hidden`, и сколько значений выбрано
      было не видно.

   Зависимости: styles/input.css, styles/chip.css. Иконка крестика — через
   `<i data-icon="close">` + ds-icons.js, инлайн-SVG рантайм не пишет.

   Экспорт: window.DSInput = {
     bind(inp) -> api|null   — привязать один блок `.inp`
     bindAll(root)           — обойти `.inp` внутри root
     sync(inp)               — пересчитать крестик и «+N» у одного поля
     syncAll(root)
     clear(inp)              — очистить поле программно (то же, что клик по крестику)
   }

   Автоподключение: обходит все `.inp` на DOMContentLoaded и довязывает
   поле при первом взаимодействии — динамически вставленные формы работают
   без вызова кода на экране.

   ОЧИСТКА — событие наружу. Крестик чистит только то, что видно в DOM:
   значение контрола и чипы. Собственное состояние потребителя (набор
   выбранных значений фильтра) рантайму неизвестно, поэтому при очистке
   на `.inp` всплывает `ds-input:clear`, а на контроле — обычные `input` и
   `change`. Потребитель слушает то, что ему удобнее.

   ДЕМО-ПОЛЯ ДОКУМЕНТАЦИИ. Страницы компонентов показывают состояния
   статично — в том числе пустое поле С крестиком (это витрина состояния,
   а не рабочее поле). Такие блоки помечаются `data-input-static` и
   рантаймом не трогаются.
   ========================================================================= */
(function () {
  'use strict';

  var GAP = 4;               /* .inp__chips { gap: 4px } */
  var CLEAR_LABELS = ['Очистить поле', 'Очистить'];

  function isStatic(el) { return !!(el && el.closest('[data-input-static]')); }

  function controlOf(inp) { return inp.querySelector('.inp__control'); }
  function chipsOf(inp) { return inp.querySelector('.inp__chips'); }
  function fieldOf(inp) { return inp.querySelector('.inp__field'); }

  /* чипы-значения: счётчик «+N» в их число не входит */
  function valueChips(chips) {
    if (!chips) return [];
    return Array.prototype.filter.call(chips.children, function (c) {
      return c.classList && c.classList.contains('chip') && !c.hasAttribute('data-inp-count');
    });
  }
  function counterOf(chips) { return chips ? chips.querySelector('[data-inp-count]') : null; }

  function findClear(inp) {
    var acts = inp.querySelector('.inp__acts');
    if (!acts) return null;
    for (var i = 0; i < CLEAR_LABELS.length; i++) {
      var b = acts.querySelector('.inp__act[aria-label="' + CLEAR_LABELS[i] + '"]');
      if (b) return b;
    }
    return null;
  }

  /* можно ли вообще предлагать очистку: у выключенного и readonly-поля
     сброса значения быть не может (правило InputText), у поля с
     «показать/скрыть пароль» крестик заменён этой кнопкой */
  function canClear(inp) {
    if (inp.classList.contains('inp--disabled')) return false;
    var ctl = controlOf(inp);
    if (ctl && (ctl.disabled || ctl.readOnly)) return false;
    if (inp.querySelector('.inp__act[aria-label="Показать пароль"], .inp__act[aria-label="Скрыть пароль"]')) return false;
    return true;
  }

  /* Крестик по порядку действий из спеки InputText:
     информер -> крестик -> календарь -> шеврон. */
  function ensureClear(inp) {
    var found = findClear(inp);
    if (found) return found;
    if (!canClear(inp)) return null;
    var field = fieldOf(inp);
    if (!field) return null;
    var acts = field.querySelector('.inp__acts');
    if (!acts) {
      acts = document.createElement('span');
      acts.className = 'inp__acts';
      field.appendChild(acts);
    }
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'inp__act';
    btn.setAttribute('aria-label', 'Очистить поле');
    btn.innerHTML = '<i data-icon="close"></i>';
    var after = acts.querySelector('.inp__act[aria-label="Открыть календарь"], .inp__act--chev');
    if (after) acts.insertBefore(btn, after); else acts.appendChild(btn);
    if (window.dsIcons) window.dsIcons.apply(acts);
    return btn;
  }

  function hasValue(inp) {
    var ctl = controlOf(inp);
    if (ctl && String(ctl.value || '').trim() !== '') return true;
    if (valueChips(chipsOf(inp)).length) return true;
    return false;
  }

  /* ------------------------------------------------------------------ */
  /* «+N» — свёрнутые чипы                                               */
  /* ------------------------------------------------------------------ */
  function makeCounter(n) {
    var ch = document.createElement('span');
    /* chip--fit: счётчик обязан показаться целиком и не сжиматься —
       ровно тот случай, под который заведён вариант (см. Chip) */
    ch.className = 'chip chip--edit chip--s chip--fit';
    ch.setAttribute('data-inp-count', '');
    ch.tabIndex = 0;
    ch.setAttribute('aria-label', 'Ещё ' + n + ' — показать все значения');
    ch.innerHTML = '<span class="chip__label">+' + n + '</span>';
    return ch;
  }

  /* Сколько чипов помещается в `avail` пикселей, если в конце ещё встанет
     счётчик шириной `counterW`. Ноль означает «не влезает даже одно
     значение» — снаружи это превращается в один усекаемый чип. */
  function fitCount(list, avail, counterW) {
    var used = 0, shown = 0;
    for (var i = 0; i < list.length; i++) {
      var w = list[i].offsetWidth + (shown ? GAP : 0);
      if (used + w + GAP + counterW > avail) break;
      used += w; shown++;
    }
    return shown;
  }

  function layoutChips(inp) {
    var chips = chipsOf(inp);
    if (!chips) return;
    var list = valueChips(chips);
    var old = counterOf(chips);

    /* разворачиваем всё обратно перед замером: иначе считали бы ширину
       уже свёрнутого состояния и «+N» залипал бы на первом значении */
    list.forEach(function (c) { c.hidden = false; c.removeAttribute('data-inp-last'); });
    if (old) old.remove();
    if (!list.length) return;

    if (!chips.clientWidth) return;                       /* поле скрыто — мерить нечего */
    var full = 0;
    list.forEach(function (c, i) { full += c.offsetWidth + (i ? GAP : 0); });
    if (full <= chips.clientWidth) return;                /* помещается — счётчик не нужен */

    var probe = makeCounter(list.length);
    chips.appendChild(probe);
    var counterW = probe.offsetWidth;

    /* Ширину стека задаёт flex, и она зависит от того, сколько чипов в нём
       осталось: пока видны все, контейнер сжат до предела, а после сворачивания
       он может стать шире. Замер по сжатому состоянию давал бы «+N» заведомо
       агрессивнее, чем нужно, — поэтому считаем в несколько проходов, пока
       число видимых чипов не перестанет меняться (обычно два прохода). */
    var shown = -1, prev = -1, pass = 0;
    for (; pass < 3; pass++) {
      shown = fitCount(list, chips.clientWidth, counterW);
      if (shown === 0) shown = 1;
      if (shown === prev) break;
      prev = shown;
      for (var j = 0; j < list.length; j++) {
        list[j].hidden = j >= shown;
        /* последний ВИДИМЫЙ чип помечаем явно: :nth-last-child в CSS считал бы
           и скрытые узлы, а сжиматься должен именно он — иначе одно длинное
           значение выталкивает счётчик за границу поля */
        if (j === shown - 1) list[j].setAttribute('data-inp-last', '');
        else list[j].removeAttribute('data-inp-last');
      }
      /* чтение clientWidth на следующем проходе форсирует пересчёт раскладки */
    }

    var rest = list.length - shown;
    if (rest <= 0) {
      probe.remove();
      list.forEach(function (c) { c.hidden = false; });
      return;
    }
    probe.querySelector('.chip__label').textContent = '+' + rest;
    var hiddenText = list.slice(shown).map(chipText).filter(Boolean).join(', ');
    probe.setAttribute('aria-label', 'Ещё ' + rest + ': ' + hiddenText);
    countTooltip(probe, hiddenText);
  }

  /* Подпись свёрнутого чипа — мимо чужих тултипов: ds-tooltip.js кладёт копию
     значения в .tip[role=tooltip] рядом с целью, и текст удвоился бы. */
  function chipText(chip) {
    var lab = chip.querySelector('.chip__label');
    if (!lab) return '';
    var out = '';
    Array.prototype.forEach.call(lab.childNodes, function (n) {
      if (n.nodeType === 3) { out += n.nodeValue; return; }
      if (n.nodeType !== 1) return;
      if (n.getAttribute('role') === 'tooltip') return;
      out += n.textContent;
    });
    return out.replace(/\s+/g, ' ').trim();
  }

  /* Тултип счётчика обязателен (правило ReadOnlyField, общее для «+N»): по
     наведению и по фокусу перечисляет скрытые значения через запятую — иначе
     видно только их количество.

     Разметку тултипа строим сами и передаём готовой. Обычный `bind` без
     `opts.tip` оборачивает цель в `.tip-anchor`, а на прямых детях
     `.inp__chips` завязано три вещи: valueChips() сканирует `chips.children`,
     наблюдатель считает «своими» только узлы с data-inp-count, и CSS
     `.inp__chips .chip--fit:last-child` требует, чтобы счётчик был последним
     ребёнком. Обёртка ломала бы все три. Тултип внутри чипа не мешает: он
     `position: absolute`, ширину не занимает, а на показе ds-tooltip.js
     уносит его в общий слой DSFloat (иначе его срезал бы
     `overflow: hidden` у `.inp__chips`). */
  function countTooltip(counter, text) {
    if (!window.DSTooltip || !text) return;
    /* data-tooltip дублирует текст в разметке: привязка уже сделана готовым
       tip, но атрибут делает состояние читаемым — тем же атрибутом объясняет
       себя счётчик «+N» в ячейке таблицы */
    counter.setAttribute('data-tooltip', text);
    counter.setAttribute('data-tooltip-multiline', 'yes');
    var tip = DSTooltip.make(text, { multiline: true });
    counter.appendChild(tip);
    DSTooltip.bind(counter, { tip: tip, multiline: true });
  }

  /* ------------------------------------------------------------------ */
  /* синхронизация                                                       */
  /* ------------------------------------------------------------------ */
  function sync(inp) {
    if (!inp || isStatic(inp)) return;
    var on = hasValue(inp);
    var btn = on ? ensureClear(inp) : findClear(inp);
    /* .inp__act { display: inline-flex } той же специфичности, что и
       браузерное [hidden] — парное правило стоит в styles/input.css */
    if (btn) btn.hidden = !on || !canClear(inp);
    layoutChips(inp);
  }

  function clear(inp) {
    if (!inp) return;
    var ctl = controlOf(inp);
    if (ctl) {
      ctl.value = '';
      ctl.dispatchEvent(new Event('input', { bubbles: true }));
      ctl.dispatchEvent(new Event('change', { bubbles: true }));
    }
    var chips = chipsOf(inp);
    if (chips) chips.innerHTML = '';
    inp.dispatchEvent(new CustomEvent('ds-input:clear', { bubbles: true }));
    if (ctl && !ctl.disabled && !ctl.readOnly) ctl.focus();
    sync(inp);
  }

  function bind(inp) {
    if (!inp || inp.__dsInput) return inp && inp.__dsInput;
    if (isStatic(inp)) return null;
    var field = fieldOf(inp);
    if (!field) return null;

    var api = { el: inp, sync: function () { sync(inp); }, clear: function () { clear(inp); } };
    inp.__dsInput = api;

    var ctl = controlOf(inp);
    if (ctl) {
      ctl.addEventListener('input', api.sync);
      ctl.addEventListener('change', api.sync);
    }

    /* чипы кладёт и снимает потребитель (или DSDropdownList через его
       обработчик) — узнаём об этом наблюдателем, а не договорённостью */
    var chips = chipsOf(inp);
    if (chips && window.MutationObserver) {
      var mo = new MutationObserver(function (recs) {
        /* правки самого рантайма (hidden у чипов, счётчик) не должны
           вызывать повторный проход — иначе наблюдатель зациклится */
        var own = recs.every(function (r) {
          if (r.type === 'attributes') return true;
          var nodes = [].concat(Array.prototype.slice.call(r.addedNodes), Array.prototype.slice.call(r.removedNodes));
          return nodes.length > 0 && nodes.every(function (n) { return n.nodeType === 1 && n.hasAttribute && n.hasAttribute('data-inp-count'); });
        });
        if (own) return;
        api.sync();
      });
      mo.observe(chips, { childList: true });
    }

    if (window.ResizeObserver) {
      var ro = new ResizeObserver(function () { layoutChips(inp); });
      ro.observe(field);
    }

    sync(inp);
    return api;
  }

  function bindAll(root) {
    (root || document).querySelectorAll('.inp').forEach(bind);
  }
  function syncAll(root) {
    (root || document).querySelectorAll('.inp').forEach(sync);
  }

  /* клик по крестику — делегированием: кнопка может быть и из разметки,
     и созданной рантаймом, и пересозданной потребителем */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('.inp__act') : null;
    if (!btn || btn.disabled) return;
    if (CLEAR_LABELS.indexOf(btn.getAttribute('aria-label')) < 0) return;
    var inp = btn.closest('.inp');
    if (!inp || isStatic(inp)) return;
    e.preventDefault();
    e.stopPropagation();          /* поле-триггер DropdownList не должно раскрыть список */
    clear(inp);
  });

  /* Поля, вставленные в DOM после старта, — обычный случай, а не край:
     страницы документации строят демо в своём page.js уже после того, как
     рантайм отработал DOMContentLoaded, а экраны рисуют формы из данных.
     Без наблюдателя такое поле осталось бы без крестика и без «+N» до
     первого касания — а «+N» обязан быть виден сразу. */
  var pending = false;
  function scheduleBind() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(function () { pending = false; bindAll(document); });
  }
  if (window.MutationObserver) {
    new MutationObserver(function (recs) {
      for (var i = 0; i < recs.length; i++) {
        var added = recs[i].addedNodes;
        for (var j = 0; j < added.length; j++) {
          var n = added[j];
          if (n.nodeType !== 1) continue;
          if (n.classList && n.classList.contains('inp')) { scheduleBind(); return; }
          if (n.querySelector && n.querySelector('.inp')) { scheduleBind(); return; }
        }
      }
    }).observe(document.documentElement, { childList: true, subtree: true });
  }

  /* страховка: поле, до которого наблюдатель не дотянулся, привяжется при касании */
  function lazy(e) {
    var inp = e.target.closest ? e.target.closest('.inp') : null;
    if (inp && !inp.__dsInput) bind(inp);
  }
  document.addEventListener('focusin', lazy, true);
  document.addEventListener('pointerdown', lazy, true);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { bindAll(document); });
  else bindAll(document);

  window.DSInput = { bind: bind, bindAll: bindAll, sync: sync, syncAll: syncAll, clear: clear };
})();
