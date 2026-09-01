/* ds-chip.js — общий рантайм Chip: удаление (RulesAudit W5 · K5).
   Делегированные слушатели на document. Клик по .chip__remove ИЛИ
   Backspace/Delete на сфокусированном .chip убирает чип и переносит фокус
   на соседний чип (или на контейнер чиплиста, если чипов не осталось). */
(function () {
  function removeChip(chip) {
    if (!chip) return;
    var list = chip.parentElement;
    var next = chip.nextElementSibling || chip.previousElementSibling;
    chip.remove();
    if (next && next.classList && next.classList.contains('chip')) next.focus();
    else if (list) list.focus && list.focus();
  }
  document.addEventListener('click', function (e) {
    var removeBtn = e.target.closest ? e.target.closest('.chip__remove') : null;
    if (!removeBtn) return;
    removeChip(removeBtn.closest('.chip'));
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Backspace' && e.key !== 'Delete') return;
    var chip = e.target.closest ? e.target.closest('.chip.chip--edit') : null;
    if (!chip || chip !== document.activeElement) return;
    if (!chip.querySelector('.chip__remove')) return;
    e.preventDefault();
    removeChip(chip);
  });
})();
