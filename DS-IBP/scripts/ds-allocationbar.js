/* ds-allocationbar.js — общий рантайм AllocationBar: связь бар↔строка по hover
   (RulesAudit W5 · K5). Делегированные слушатели на document — работает на
   любой .albar, включая динамически отрендеренный. CSS уже умеет гасить
   несвязанные сегменты/строки через [data-hover] + .is-active, этот файл
   только выставляет их по наведению. */
(function () {
  function setActive(root, id) {
    root.querySelectorAll('.albar__seg,.albar__row').forEach(function (n) {
      n.classList.toggle('is-active', n.getAttribute('data-id') === id);
    });
  }
  document.addEventListener('mouseover', function (e) {
    var node = e.target.closest ? e.target.closest('.albar__seg,.albar__row') : null;
    if (!node) return;
    var root = node.closest('.albar');
    if (!root) return;
    root.setAttribute('data-hover', '');
    setActive(root, node.getAttribute('data-id'));
  });
  document.addEventListener('mouseout', function (e) {
    var node = e.target.closest ? e.target.closest('.albar__seg,.albar__row') : null;
    if (!node) return;
    var root = node.closest('.albar');
    if (!root || root.contains(e.relatedTarget)) return;
    root.removeAttribute('data-hover');
  });
})();
