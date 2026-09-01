/* ds-alert.js — общий рантайм Alert: свернуть/закрыть (RulesAudit W5 · K5).
   Делегированные слушатели на document — работает на любой .alert, включая
   динамически добавленные. Разметка сама ничего не делает без этого скрипта:
   .alert__collapse только меняет aria-expanded, .alert--collapsed на .alert
   даёт CSS (display:none у текста/кнопок) — оба шага делает этот файл. */
(function () {
  document.addEventListener('click', function (e) {
    var collapseBtn = e.target.closest ? e.target.closest('.alert__collapse') : null;
    if (collapseBtn) {
      var alertEl = collapseBtn.closest('.alert');
      if (!alertEl) return;
      var expanded = collapseBtn.getAttribute('aria-expanded') !== 'false';
      collapseBtn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      alertEl.classList.toggle('alert--collapsed', expanded);
      return;
    }
    var closeBtn = e.target.closest ? e.target.closest('.alert__close') : null;
    if (closeBtn) {
      var toRemove = closeBtn.closest('.alert');
      if (toRemove) toRemove.remove();
    }
  });
})();
