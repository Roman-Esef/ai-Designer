/* ds-table-filter.js — сброс применённого фильтра в TableFilter (out-of-box, RulesAudit Фаза 3).
   Открытие модалки — уже общий рантайм ds-modal.js; содержимое модалки (секции,
   пресеты) держит модель данных потребителя, как и колонки/данные у Table — не
   даём из коробки. Здесь — только сброс чипа-счётчика «Применено: N».

   Клик по .tfilter__applied .chip__remove ИЛИ Backspace/Delete на сфокусированном
   .tfilter__applied — плавно убирает чип и всплывает 'tfilter:reset' на .tfilter
   (bubbles), который потребитель слушает, чтобы очистить параметры фильтра. */
(function () {
  function reset(chip) {
    if (!chip) return;
    var bar = chip.closest('.tfilter');
    chip.style.transition = 'opacity .18s, transform .18s';
    chip.style.opacity = '0'; chip.style.transform = 'scale(.85)';
    setTimeout(function () {
      chip.remove();
      if (bar) bar.dispatchEvent(new CustomEvent('tfilter:reset', { bubbles: true }));
    }, 180);
  }
  document.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('.tfilter__applied .chip__remove') : null;
    if (!btn) return;
    reset(btn.closest('.chip'));
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Backspace' && e.key !== 'Delete') return;
    var chip = e.target.closest ? e.target.closest('.tfilter__applied') : null;
    if (!chip || chip !== document.activeElement) return;
    e.preventDefault();
    reset(chip);
  });
})();
