/* ds-illustrations.js — подставляет реальные SVG в слоты .illu[data-illu].
   Использование: <span class="illu" data-illu="deals" aria-hidden="true"></span>
   Путь к файлу: assets/illustrations/<data-illu>.svg (учитывает window.__DS_ROOT,
   как ds-nav.js). Если файл не найден — img удаляет себя, слот пустеет и
   styles/illustration.css рисует штриховую заглушку (.illu:empty). */
(function () {
  function render() {
    var root = window.__DS_ROOT || '';
    document.querySelectorAll('.illu[data-illu]').forEach(function (el) {
      if (el.querySelector('img')) return;
      var name = el.getAttribute('data-illu');
      var img = document.createElement('img');
      img.src = root + 'assets/illustrations/' + name + '.svg';
      img.alt = '';
      img.draggable = false;
      img.onerror = function () { img.remove(); };
      el.appendChild(img);
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
  // авто-рендер для слотов, добавленных в DOM позже (конструкторы/тайквики
  // перестраивают innerHTML — без наблюдателя новые слоты остаются пустыми
  // и показывают заглушку вместо иллюстрации).
  new MutationObserver(function (muts) {
    for (var i = 0; i < muts.length; i++) {
      if (muts[i].addedNodes.length) { render(); return; }
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
  window.DSIllustrations = { render: render };
})();
