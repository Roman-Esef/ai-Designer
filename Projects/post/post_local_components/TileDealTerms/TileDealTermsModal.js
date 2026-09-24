/* ============================================================
   TileDealTermsModal.js — поведение окна «Сроки сделки».

   Делает то, чего нет в рантаймах ДС, и только это:
   1) заполняет окно датами сделки при каждом открытии: две даты для
      справки и поле «Дата первой выдачи»;
   2) проверяет дату первой выдачи по «Сохранить»: пусто — можно; иначе
      дата ДД.ММ.ГГГГ не раньше даты заключения и не позже даты окончания
      (границы включительно, отсутствующая граница не проверяется);
   3) показывает ошибку по правилу InputText: красное поле, текст — в тултипе
      на фокусе, не в хелпере. Правка поля снимает ошибку, как только ввод
      стал корректным;
   4) отдаёт проверенную дату странице и закрывает окно.

   Открытие, фокус, Esc, крестик, маска даты, календарь и информеры делают
   рантаймы ДС. Сделку окно не знает: даты берёт и сохраняет через функции,
   которые передала страница, — так же окно работает на витрине.

   API:
     PostDealTermsModal.bind(scrim, { get, save }) → api
       get()       → { signDate, endDate, firstDisb } — даты 'ДД.ММ.ГГГГ' или ''
       save(value) — принять дату первой выдачи ('' — дата стёрта)
       api.fill()      — заполнить окно заново из get()
       api.validate()  → boolean — проверить поле и показать ошибку
       api.clearError()
   ============================================================ */
(function () {
  'use strict';

  var FORMAT = 'Введите дату в формате ДД.ММ.ГГГГ';
  var DATE = /^(\d{2})\.(\d{2})\.(\d{4})$/;

  /* Дата 'ДД.ММ.ГГГГ' → число ГГГГММДД для сравнения; не дата — null
     (в том числе 31.02 и прочие несуществующие дни) */
  function dateKey(s) {
    var m = DATE.exec(String(s == null ? '' : s).trim());
    if (!m) return null;
    var d = +m[1], mo = +m[2], y = +m[3];
    var dt = new Date(y, mo - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
    return y * 10000 + mo * 100 + d;
  }

  function isInline(scrim) {
    return scrim.classList.contains('modal-scrim--inline');
  }

  function bind(scrim, opts) {
    if (!scrim) return null;
    if (scrim.__dealTerms) return scrim.__dealTerms;
    opts = opts || {};

    var input = scrim.querySelector('.inp__control[name="firstDisb"]');
    var inp = input && input.closest('.inp');
    var box = input && input.closest('.inp__box');
    var error = '';
    var tipApi = null;

    function terms() { return (opts.get && opts.get()) || {}; }

    /* ── Ошибка поля ────────────────────────────────────────────────── */
    /* Тултип строится через DSTooltip: из модалки он монтируется в её скрим
       и не обрезается телом окна. bind() навешивает показ на наведение и
       фокус навсегда, а снять его нечем, поэтому, пока ошибки нет, показ
       гасится сразу за ним: слушатели ниже зарегистрированы после рантайма
       и срабатывают следом в том же такте — тултип не успевает мелькнуть. */
    function ensureTip() {
      if (tipApi || !window.DSTooltip || !box) return tipApi;
      var o = { type: 'error', placement: 'bottom', align: 'start', multiline: true };
      var tip = window.DSTooltip.make('', o);
      box.appendChild(tip);
      o.tip = tip;
      tipApi = window.DSTooltip.bind(input, o);
      ['mouseenter', 'focus'].forEach(function (ev) {
        input.addEventListener(ev, function () { if (!error && tipApi) tipApi.hide(true); });
      });
      return tipApi;
    }

    function setError(msg) {
      error = msg;
      inp.classList.add('inp--error');
      input.setAttribute('aria-invalid', 'true');
      var api = ensureTip();
      if (!api) return;
      api.tip.firstChild.textContent = msg;
      if (document.activeElement === input) api.show(true);
    }

    function clearError() {
      if (!input) return;
      error = '';
      inp.classList.remove('inp--error');
      input.removeAttribute('aria-invalid');
      if (tipApi) tipApi.hide(true);
    }

    /* ── Проверка ───────────────────────────────────────────────────── */
    function messageFor(value, t) {
      if (!value) return '';
      var key = dateKey(value);
      if (key == null) return FORMAT;
      var from = dateKey(t.signDate);
      var to = dateKey(t.endDate);
      if (from != null && key < from) return 'Не раньше даты заключения — ' + String(t.signDate).trim();
      if (to != null && key > to) return 'Не позже даты окончания — ' + String(t.endDate).trim();
      return '';
    }

    function validate() {
      if (!input) return true;
      var msg = messageFor(input.value.trim(), terms());
      if (msg) { setError(msg); return false; }
      clearError();
      return true;
    }

    /* ── Заполнение ─────────────────────────────────────────────────── */
    function fill() {
      var t = terms();
      Array.prototype.forEach.call(scrim.querySelectorAll('.rof__value[data-terms-field]'), function (el) {
        var v = String(t[el.getAttribute('data-terms-field')] || '').trim();
        /* Прочерк — значение, а не подсказка: своего цвета у него нет
           (ReadOnlyField 1.010). */
        el.textContent = v || '—';
      });
      if (input) {
        input.value = String(t.firstDisb || '').trim();
        /* крестик очистки живёт по значению — после записи скриптом его
           состояние пересчитывает рантайм поля */
        if (window.DSInput && inp) window.DSInput.sync(inp);
      }
      clearError();
    }

    /* ── События ────────────────────────────────────────────────────── */
    /* Окно открылось — даты заново: за время, пока оно было закрыто, они
       могли смениться, а несохранённый ввод прошлого открытия не нужен. */
    var wasOpen = !scrim.hidden;
    new MutationObserver(function () {
      var open = !scrim.hidden;
      if (open === wasOpen) return;
      wasOpen = open;
      if (open) fill();
      else clearError();
    }).observe(scrim, { attributes: true, attributeFilter: ['hidden'] });

    /* новая ошибка появляется только по «Сохранить»; при правке поля уже
       показанная ошибка пересчитывается и снимается, когда ввод стал верным.
       Очистка крестиком и выбор в календаре приходят тем же событием input */
    if (input) {
      input.addEventListener('input', function () { if (error) validate(); });
    }

    scrim.addEventListener('click', function (e) {
      if (!e.target.closest('[data-terms-save]')) return;
      if (!validate()) { input.focus(); return; }
      if (opts.save) opts.save(input.value.trim());
      if (!isInline(scrim) && window.DSModal) window.DSModal.closeTop(true);
    });

    fill();

    var api = { fill: fill, validate: validate, clearError: clearError };
    scrim.__dealTerms = api;
    return api;
  }

  window.PostDealTermsModal = { bind: bind };
})();
