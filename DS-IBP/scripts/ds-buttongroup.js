/* ds-buttongroup.js — переключение toggle-кнопок ButtonGroup (out-of-box, RulesAudit Фаза 3).
   Split Button (меню) уже общий рантайм — ds-menu.js; здесь — только сам toggle.

   Делегированный клик по .btn[aria-pressed] внутри .btn-group--toggle:
     role="group"      — независимый мультивыбор, клик инвертирует только свою кнопку
     role="radiogroup" — одиночный выбор (сегмент-подобный), клик снимает pressed с соседей
   Отключённая группа (aria-disabled="true" на .btn-group) или сама кнопка (disabled) — без реакции. */
(function () {
  document.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('.btn-group--toggle > .btn[aria-pressed]') : null;
    if (!btn || btn.disabled) return;
    var group = btn.closest('.btn-group--toggle');
    if (!group || group.getAttribute('aria-disabled') === 'true') return;
    var exclusive = group.getAttribute('role') === 'radiogroup';
    if (exclusive) {
      if (btn.getAttribute('aria-pressed') === 'true') return;
      Array.prototype.forEach.call(group.querySelectorAll('.btn[aria-pressed]'), function (b) {
        b.setAttribute('aria-pressed', String(b === btn));
      });
    } else {
      btn.setAttribute('aria-pressed', String(btn.getAttribute('aria-pressed') !== 'true'));
    }
  });
})();
