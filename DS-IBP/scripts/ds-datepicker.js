/* =========================================================================
   DS DatePicker — рантайм календаря (out-of-box).
   Требует: icons-data.js подключён ДО этого файла (window.DS_ICONS).
   Экспорт: window.DSDatePicker = { makeCalendar, openPicker,
                                    parseDate, formatDate }
   Автоподключение: клик по кнопке-календарю поля (.inp__act[aria-label=
   "Открыть календарь"]) поднимает календарь. Одиночное поле → выбор даты;
   поле внутри .inp-range--date → выбор диапазона (start → «От», end → «До»).
   ========================================================================= */
(function () {
  'use strict';
  var ICONS = window.DS_ICONS || {};
  function icon(name) { return ICONS[name] || ''; }

  var MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
  var MONTHS_SHORT = ['Янв','Фев','Март','Апр','Май','Июнь','Июль','Авг','Сен','Окт','Ноя','Дек'];
  var WEEKDAYS = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];

  function d(y, m, day) { return new Date(y, m, day); }
  function sameDay(a, b) { return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
  function startOfDay(x) { return new Date(x.getFullYear(), x.getMonth(), x.getDate()); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function fmtFull(dt) { return dt.getDate() + ' ' + MONTHS[dt.getMonth()].toLowerCase() + ' ' + dt.getFullYear(); }

  /* маска поля — ММ.ДД.ГГГГ (месяц.день.год) */
  function formatDate(dt) { return dt ? pad(dt.getMonth() + 1) + '.' + pad(dt.getDate()) + '.' + dt.getFullYear() : ''; }
  function parseDate(str) {
    if (!str) return null;
    var p = String(str).split('.');
    if (p.length !== 3) return null;
    var mm = +p[0], dd = +p[1], yy = +p[2];
    if (!mm || !dd || String(p[2]).length !== 4) return null;
    var dt = new Date(yy, mm - 1, dd);
    return (dt.getMonth() === mm - 1 && dt.getDate() === dd) ? dt : null;
  }

  /* ------------------------------------------------------------------ */
  /* makeCalendar — фабрика поверхности календаря по спецификации.       */
  /* spec: { year, month, today, selected, rangeStart, rangeEnd, min,    */
  /*   max, mode:'single'|'range'|'month', view:'day'|'month'|'year',    */
  /*   foot, quick, inline, live, onPick(state), onApply(state),         */
  /*   onCancel() }                                                       */
  /* ------------------------------------------------------------------ */
  function makeCalendar(spec) {
    spec = spec || {};
    var today = spec.today !== undefined ? spec.today : new Date();
    var anchorDate = spec.selected || spec.rangeStart || today;
    var st = {
      year: spec.year != null ? spec.year : anchorDate.getFullYear(),
      month: spec.month != null ? spec.month : anchorDate.getMonth(),
      today: today,
      selected: spec.selected || null,
      rangeStart: spec.rangeStart || null,
      rangeEnd: spec.rangeEnd || null,
      min: spec.min || null,
      max: spec.max || null,
      mode: spec.mode || 'single',
      view: spec.view || 'day',
      foot: !!spec.foot,
      quick: !!spec.quick,
      inline: !!spec.inline,
      live: !!spec.live
    };
    var root = document.createElement('div');
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'false');
    root.setAttribute('aria-label', 'Выбор даты');

    function disabled(dt) {
      if (st.min && startOfDay(dt) < startOfDay(st.min)) return true;
      if (st.max && startOfDay(dt) > startOfDay(st.max)) return true;
      return false;
    }

    function headHTML(caption) {
      return '<div class="dpk__head">' +
        '<button type="button" class="dpk__caption" aria-haspopup="true"><span>' + caption + '</span>' +
        '<span class="dpk__cap-icon" aria-hidden="true">' + icon('chevron-down') + '</span></button>' +
        '<div class="dpk__nav">' +
          '<button type="button" class="ibtn ibtn--neutral ibtn--s dpk__prev" aria-label="Назад">' + icon('chevron-left') + '</button>' +
          '<button type="button" class="ibtn ibtn--neutral ibtn--s dpk__next" aria-label="Вперёд">' + icon('chevron-right') + '</button>' +
        '</div></div>';
    }

    function footHTML() {
      if (!st.foot) return '';
      var left = st.quick ? '<div class="dpk__foot-left"><button type="button" class="btn btn--transparent btn--xs dpk__today"><span class="btn__label">Сегодня</span></button></div>' : '<div class="dpk__foot-left"></div>';
      return '<div class="dpk__foot">' + left +
        '<div class="dpk__foot-right">' +
          '<button type="button" class="btn btn--transparent btn--xs dpk__cancel"><span class="btn__label">Отменить</span></button>' +
          '<button type="button" class="btn btn--accent btn--xs dpk__ok"><span class="btn__label">Применить</span></button>' +
        '</div></div>';
    }

    function render() {
      root.className = 'dpk' + (st.inline ? ' dpk--inline' : '') + (st.view !== 'day' ? ' dpk--panel' : '');
      var html = '';

      if (st.view === 'year') {
        var ds = st.year - (st.year % 12);
        html += headHTML(ds + ' – ' + (ds + 11));
        html += '<div class="dpk__panel dpk__panel--years" role="grid">';
        for (var i = 0; i < 12; i++) {
          var yy = ds + i;
          var cur = yy === st.today.getFullYear();
          var selY = yy === st.year;
          html += '<button type="button" class="dpk__panel-cell' + (selY ? ' dpk__panel-cell--selected' : (cur ? ' dpk__panel-cell--current' : '')) + '" data-year="' + yy + '" role="gridcell">' + yy + '</button>';
        }
        html += '</div>';
      } else if (st.view === 'month') {
        html += headHTML(String(st.year));
        html += '<div class="dpk__panel" role="grid">';
        for (var mi = 0; mi < 12; mi++) {
          var curM = mi === st.today.getMonth() && st.year === st.today.getFullYear();
          var selM = mi === st.month;
          html += '<button type="button" class="dpk__panel-cell' + (selM ? ' dpk__panel-cell--selected' : (curM ? ' dpk__panel-cell--current' : '')) + '" data-month="' + mi + '" role="gridcell">' + MONTHS_SHORT[mi] + '</button>';
        }
        html += '</div>';
      } else {
        html += headHTML(MONTHS[st.month] + ' ' + st.year);
        html += '<div class="dpk__weekdays" aria-hidden="true">';
        WEEKDAYS.forEach(function (w) { html += '<span class="dpk__weekday">' + w + '</span>'; });
        html += '</div><div class="dpk__grid" role="grid">';
        var first = d(st.year, st.month, 1);
        var lead = (first.getDay() + 6) % 7;
        var start = d(st.year, st.month, 1 - lead);
        for (var c = 0; c < 42; c++) {
          var cd = d(start.getFullYear(), start.getMonth(), start.getDate() + c);
          var cls = 'dpk__day';
          if (cd.getMonth() !== st.month) cls += ' dpk__day--outside';
          if (sameDay(cd, st.today)) cls += ' dpk__day--today';
          var dis = disabled(cd);
          if (dis) cls += ' dpk__day--disabled';
          if (st.mode === 'range' && st.rangeStart) {
            var rs = sameDay(cd, st.rangeStart), re = st.rangeEnd && sameDay(cd, st.rangeEnd);
            if (st.rangeEnd && startOfDay(cd) > startOfDay(st.rangeStart) && startOfDay(cd) < startOfDay(st.rangeEnd)) cls += ' dpk__day--in-range';
            if (rs && !(st.rangeEnd && sameDay(st.rangeStart, st.rangeEnd))) cls += ' dpk__day--range-start';
            if (re) cls += ' dpk__day--range-end';
            if (rs && !st.rangeEnd) cls += ' dpk__day--selected';
          } else if (st.selected && sameDay(cd, st.selected)) {
            cls += ' dpk__day--selected';
          }
          var sel = /--selected|--range-start|--range-end/.test(cls);
          html += '<button type="button" class="' + cls + '" role="gridcell"' +
            ' data-y="' + cd.getFullYear() + '" data-m="' + cd.getMonth() + '" data-d="' + cd.getDate() + '"' +
            (dis ? ' aria-disabled="true"' : '') +
            ' aria-selected="' + (sel ? 'true' : 'false') + '"' +
            ' aria-label="' + fmtFull(cd) + '" tabindex="' + (sel ? '0' : '-1') + '">' +
            '<span class="dpk__daynum">' + cd.getDate() + '</span></button>';
        }
        html += '</div>';
      }
      html += footHTML();
      root.innerHTML = html;
      if (st.live) bind();
    }

    function bind() {
      var cap = root.querySelector('.dpk__caption');
      cap.addEventListener('click', function () {
        st.view = st.view === 'day' ? 'year' : 'day';
        render();
      });
      root.querySelector('.dpk__prev').addEventListener('click', function () { step(-1); });
      root.querySelector('.dpk__next').addEventListener('click', function () { step(1); });
      root.querySelectorAll('.dpk__day').forEach(function (b) {
        if (b.getAttribute('aria-disabled')) return;
        b.addEventListener('click', function () { pickDay(+b.dataset.y, +b.dataset.m, +b.dataset.d); });
      });
      root.querySelectorAll('[data-year]').forEach(function (b) {
        b.addEventListener('click', function () { st.year = +b.dataset.year; st.view = 'month'; render(); });
      });
      root.querySelectorAll('[data-month]').forEach(function (b) {
        b.addEventListener('click', function () { st.month = +b.dataset.month; st.view = 'day'; render(); });
      });
      var todayBtn = root.querySelector('.dpk__today');
      if (todayBtn) todayBtn.addEventListener('click', function () {
        st.year = st.today.getFullYear(); st.month = st.today.getMonth();
        pickDay(st.today.getFullYear(), st.today.getMonth(), st.today.getDate());
      });
      var ok = root.querySelector('.dpk__ok');
      if (ok) ok.addEventListener('click', function () { if (typeof spec.onApply === 'function') spec.onApply(st); });
      var cancel = root.querySelector('.dpk__cancel');
      if (cancel) cancel.addEventListener('click', function () { if (typeof spec.onCancel === 'function') spec.onCancel(st); });
    }

    function step(dir) {
      if (st.view === 'year') { st.year += dir * 12; }
      else if (st.view === 'month') { st.year += dir; }
      else {
        var nm = st.month + dir;
        st.year += Math.floor(nm / 12); st.month = ((nm % 12) + 12) % 12;
      }
      render();
    }

    function pickDay(y, m, day) {
      var dt = d(y, m, day);
      if (m !== st.month || y !== st.year) { st.year = y; st.month = m; }
      if (st.mode === 'range') {
        if (!st.rangeStart || st.rangeEnd) { st.rangeStart = dt; st.rangeEnd = null; }
        else if (startOfDay(dt) < startOfDay(st.rangeStart)) { st.rangeStart = dt; }
        else { st.rangeEnd = dt; }
      } else {
        st.selected = dt;
      }
      render();
      if (typeof spec.onPick === 'function') spec.onPick(st);
    }

    render();
    root._state = st;
    return root;
  }

  /* ------------------------------------------------------------------ */
  /* openPicker — всплывающий календарь, привязанный к якорю (полю).     */
  /* Один открытый экземпляр; закрытие — клик вне / Esc.                 */
  /* ------------------------------------------------------------------ */
  var current = null;
  function closeCurrent(returnFocus) {
    if (!current) return;
    document.removeEventListener('mousedown', current.onDoc, true);
    document.removeEventListener('keydown', current.onKey, true);
    window.removeEventListener('resize', current.reposition);
    window.removeEventListener('scroll', current.reposition, true);
    if (current.el.parentNode) current.el.parentNode.removeChild(current.el);
    var focusEl = returnFocus ? current.anchorFocus : null;
    current = null;
    if (focusEl && focusEl.focus) focusEl.focus();
  }

  function openPicker(anchorEl, spec) {
    closeCurrent(false);
    spec = spec || {};
    var cal = makeCalendar(Object.assign({ live: true }, spec));
    cal.style.position = 'fixed';
    cal.style.zIndex = '9500';
    document.body.appendChild(cal);

    function reposition() {
      var r = anchorEl.getBoundingClientRect();
      var h = cal.offsetHeight, w = cal.offsetWidth;
      var gap = 8;
      var top = r.bottom + gap;
      if (top + h > window.innerHeight - 8 && r.top - gap - h > 8) top = r.top - gap - h;
      var left = Math.min(Math.max(8, r.left), window.innerWidth - w - 8);
      cal.style.top = Math.round(top) + 'px';
      cal.style.left = Math.round(left) + 'px';
    }
    reposition();

    var onDoc = function (e) { if (!cal.contains(e.target) && !anchorEl.contains(e.target)) closeCurrent(false); };
    var onKey = function (e) { if (e.key === 'Escape') { e.stopPropagation(); closeCurrent(true); } };
    document.addEventListener('mousedown', onDoc, true);
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);

    current = { el: cal, onDoc: onDoc, onKey: onKey, reposition: reposition, anchorFocus: spec.anchorFocus || anchorEl };
    return { el: cal, close: function () { closeCurrent(false); } };
  }

  /* ------------------------------------------------------------------ */
  /* Автоподключение: делегированный клик по кнопке-календарю поля.      */
  /* ------------------------------------------------------------------ */
  function fire(ctl) {
    ctl.dispatchEvent(new Event('input', { bubbles: true }));
    ctl.dispatchEvent(new Event('change', { bubbles: true }));
  }
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('.inp__act');
    if (!btn || btn.getAttribute('aria-label') !== 'Открыть календарь' || btn.disabled) return;
    var field = btn.closest('.inp__field');
    var inp = field && field.closest('.inp');
    if (!inp) return;
    e.preventDefault();
    var range = inp.closest('.inp-range--date');
    if (range) {
      var ctls = range.querySelectorAll('.inp-range__field .inp__control');
      var fromCtl = ctls[0], toCtl = ctls[1];
      openPicker(field, {
        mode: 'range',
        rangeStart: parseDate(fromCtl.value),
        rangeEnd: parseDate(toCtl.value),
        anchorFocus: field.querySelector('.inp__control'),
        onPick: function (s) {
          fromCtl.value = formatDate(s.rangeStart); fire(fromCtl);
          if (s.rangeEnd) { toCtl.value = formatDate(s.rangeEnd); fire(toCtl); closeCurrent(true); }
          else { toCtl.value = ''; fire(toCtl); }
        }
      });
    } else {
      var ctl = inp.querySelector('.inp__control');
      openPicker(field, {
        mode: 'single',
        selected: parseDate(ctl.value),
        anchorFocus: ctl,
        onPick: function (s) { ctl.value = formatDate(s.selected); fire(ctl); closeCurrent(true); }
      });
    }
  });

  window.DSDatePicker = { makeCalendar: makeCalendar, openPicker: openPicker, parseDate: parseDate, formatDate: formatDate };
})();
