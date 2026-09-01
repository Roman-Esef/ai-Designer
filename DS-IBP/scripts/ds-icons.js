/* ============================================================
   ds-icons.js — иконки ДС на экранах без инлайна SVG в разметку.
   Подключение (в конце body):
     <script src="icons-data.js"></script>
     <script src="ds-icons.js"></script>
   Использование:
     <i data-icon="check"></i>
   Цвет — через color родителя (перекрашивается в currentColor).
   Размер — от слота: правила размера в CSS компонентов написаны на
   `:is(svg,[data-icon])`, поэтому один и тот же слот задаёт габарит
   и вставленному <svg>, и <i data-icon> — формы взаимозаменяемы,
   вид не меняется (RulesAudit W0 · K2). Вне компонентов действует
   дефолт 24px через :where() — нулевая специфичность, любое
   компонентное правило перебивает его независимо от порядка загрузки.
   Имена глифов — specs/Icons.md. Динамика: window.dsIcons.apply(root).
   ============================================================ */
(function () {
  var css = ':where([data-icon]){display:inline-flex;width:24px;height:24px;flex:none;font-style:normal}' +
            ':where([data-icon]) svg{width:100%;height:100%;display:block}';
  var tag = document.createElement('style');
  tag.textContent = css;
  document.head.appendChild(tag);

  function recolor(svg) {
    svg.querySelectorAll('[fill]').forEach(function (n) {
      var f = n.getAttribute('fill');
      var boundingRect = n.tagName.toLowerCase() === 'rect' && n.getAttribute('fill-opacity') === '0';
      if (f && f !== 'none' && !boundingRect) n.setAttribute('fill', 'currentColor');
    });
    svg.querySelectorAll('[stroke]').forEach(function (n) {
      var s = n.getAttribute('stroke');
      if (s && s !== 'none') n.setAttribute('stroke', 'currentColor');
    });
  }

  function apply(root) {
    (root || document).querySelectorAll('[data-icon]').forEach(function (el) {
      if (el.dataset.iconDone === '1') return;
      var name = el.getAttribute('data-icon');
      var svg = (window.DS_ICONS || {})[name];
      if (!svg) { console.warn('ds-icons: нет глифа "' + name + '" (см. specs/Icons.md)'); return; }
      el.innerHTML = svg;
      var node = el.querySelector('svg');
      if (node) recolor(node);
      el.dataset.iconDone = '1';
    });
  }

  window.dsIcons = { apply: apply };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { apply(); });
  } else {
    apply();
  }
})();
