/* ============================================================
   kit-docpage.js — общая обвязка страницы локального компонента.

   Страницы компонентов кита устроены как страницы компонентов ДС: сплиттер с
   живым демо сверху, три таба (Конструктор · Документация · Код), якорный TOC
   справа. Каркас и табы держит слой ДС (styles/docs-split.css +
   scripts/docs-split.js), TOC он собирает сам из section.section внутри
   #pane-docs — здесь этого нет и быть не должно.

   Этот модуль закрывает то, чего в слое ДС нет: контролы конструктора. Они
   создаются страницей (режим dynamic), а docs-split.js потом сам раскладывает
   их на две колонки и улучшает селекты по правилу §11: да/нет — свитч ДС,
   2–3 варианта — ButtonGroup с сегментированным выбором, 4 и больше остаются
   списком. Поэтому ВСЕ выборы создаются селектами — свитчей и групп кнопок
   руками не пишем (урок Л4 ДС). Над ButtonGroup лейбла нет: слой прячет
   .lbl, label уходит в aria-label группы — поэтому тексты options пишутся
   самодостаточными («Узкая колонка», а не «Узкая» под «Ширина колонки»).

   Вызов со страницы:
     PostKitDoc.controls([
       { key: 'state', label: 'Состояние данных',
         options: [['data','Данные есть'], ['empty','Данных нет']] },
       { key: 'move',  label: 'Доступно перемещение', bool: true, value: true },
       { key: 'width', label: 'Ширина, px',
         range: { min: 180, max: 940, step: 10 }, value: 400 }
     ], function (state) { … перерисовать демо … });

   Слайдер (range) — не селект: docs-split.js его не конвертирует и, как любой
   не-бинарный контрол, уносит в левую колонку. По конвенции конструктора
   (ds-rules §11) слайдеры стоят справа, рядом со свитчами, поэтому модуль сам
   переносит их в .toggles — после раскладки docs-split (см. placeRanges).

   Возвращает объект состояния; он же приходит в колбэк при каждом изменении.
   ============================================================ */
(function () {
  'use strict';

  /* Разметка контрола — из конвенции конструктора ДС: .ctl > .lbl + .pg-select.
     Её же ждёт docs-split.js, когда раскладывает контролы по колонкам. */
  function makeSelect(def, state, onChange) {
    var wrap = document.createElement('div');
    wrap.className = 'ctl';

    var lbl = document.createElement('div');
    lbl.className = 'lbl';
    lbl.textContent = def.label;
    wrap.appendChild(lbl);

    var box = document.createElement('div');
    box.className = 'pg-select';
    var sel = document.createElement('select');

    /* Бинарная опция — тоже селект с двумя option: docs-split.js сам сделает из
       него свитч ДС. Собственный свитч здесь был бы вёрсткой мимо слоя. */
    var options = def.bool ? [['no', 'Нет'], ['yes', 'Да']] : def.options;
    var cur = def.bool ? (state[def.key] ? 'yes' : 'no') : String(state[def.key]);

    options.forEach(function (pair) {
      var op = document.createElement('option');
      op.value = pair[0];
      op.textContent = pair[1];
      if (pair[0] === cur) op.selected = true;
      sel.appendChild(op);
    });

    sel.addEventListener('change', function () {
      state[def.key] = def.bool ? sel.value === 'yes' : sel.value;
      onChange(state);
    });

    box.appendChild(sel);
    wrap.appendChild(box);
    return wrap;
  }

  /* Слайдер — та же разметка контрола (.ctl > .lbl + контрол), в подписи
     текущее значение. Демо перерисовывается на каждом шаге (input), а не
     только по отпусканию: перестроение по ширине видно, пока тянешь. */
  function makeRange(def, state, onChange) {
    var wrap = document.createElement('div');
    wrap.className = 'ctl';

    var lbl = document.createElement('div');
    lbl.className = 'lbl';
    var val = document.createElement('b');
    lbl.appendChild(document.createTextNode(def.label + ' · '));
    lbl.appendChild(val);
    wrap.appendChild(lbl);

    var input = document.createElement('input');
    input.type = 'range';
    input.min = String(def.range.min);
    input.max = String(def.range.max);
    input.step = String(def.range.step || 1);
    input.value = String(state[def.key]);
    input.setAttribute('aria-label', def.label);
    val.textContent = input.value;

    input.addEventListener('input', function () {
      state[def.key] = Number(input.value);
      val.textContent = input.value;
      onChange(state);
    });

    wrap.appendChild(input);
    return wrap;
  }

  /* docs-split.js раскладывает контролы на DOMContentLoaded, а страница зовёт
     controls() раньше — пока документ грузится. Обработчики DOMContentLoaded
     выполняются подряд в одной задаче, поэтому setTimeout(0) из своего
     обработчика гарантированно срабатывает после раскладки. Нет колонки
     .toggles (страница без docs-split) — слайдер остаётся на месте. */
  function placeRanges(host, ranges) {
    if (!ranges.length) return;
    function move() {
      setTimeout(function () {
        var toggles = host.querySelector('.toggles');
        if (toggles) ranges.forEach(function (r) { toggles.appendChild(r); });
      }, 0);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', move);
    else move();
  }

  function controls(defs, onChange) {
    var host = document.getElementById('pg-controls');
    var state = {};
    defs.forEach(function (d) {
      if (d.bool) state[d.key] = !!d.value;
      else if (d.range) state[d.key] = d.value !== undefined ? Number(d.value) : d.range.min;
      else state[d.key] = d.value !== undefined ? d.value : d.options[0][0];
    });
    if (!host) return state;

    var ranges = [];
    defs.forEach(function (d) {
      if (d.range) {
        var r = makeRange(d, state, onChange);
        ranges.push(r);
        host.appendChild(r);
      } else {
        host.appendChild(makeSelect(d, state, onChange));
      }
    });
    placeRanges(host, ranges);
    onChange(state);
    return state;
  }

  window.PostKitDoc = { controls: controls };
})();
