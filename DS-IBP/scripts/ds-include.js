/* ds-include.js — рантайм подключения локального компонента строкой (этап 2 раскатки компонентов).
   Разметка компонента лежит в одном файле <Имя>.html; экран ссылается на него вместо копии:
     <ds-include src="../../kit/components/TileKNR/TileKNR.html" state="data" mode="view"></ds-include>
   Что делает:
   - Один раз на href подключает CSS компонента (сам файл рядом с html, тот же путь без
     расширения + .css) — атрибут css="…" переопределяет путь, css="none" отключает подключение.
   - Забирает <Имя>.html, вставляет его корневой элемент на место <ds-include>.
   - Атрибуты state/mode тега перекрывают data-state/data-mode внутри фрагмента; id и class
     тега переносятся на вставленный корень, чтобы ссылки на него с экрана не ломались.
   - После вставки бросает CustomEvent 'ds-include:loaded' (bubbles) на вставленном корне —
     скрипт экрана слушает его, чтобы заполнить компонент данными. Слот данных руками —
     подключение размётки, а не биндинг: чем компонент заполняется, решает экран.
   - Ошибка загрузки не роняет экран: на месте компонента остаётся плашка с путём в консоли. */
(function () {
  var loadedCss = {};

  function ensureCss(href) {
    if (!href || href === 'none' || loadedCss[href]) return;
    loadedCss[href] = true;
    if (document.querySelector('link[rel="stylesheet"][href="' + href + '"]')) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }

  function cssFor(src, override) {
    if (override) return override;
    return src.replace(/\.html?$/i, '.css');
  }

  function mount(el) {
    var src = el.getAttribute('src');
    if (!src) { console.error('ds-include: атрибут src обязателен', el); return; }
    ensureCss(cssFor(src, el.getAttribute('css')));

    fetch(src)
      .then(function (r) { if (!r.ok) throw new Error(r.status + ' ' + r.statusText); return r.text(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var root = doc.body.firstElementChild;
        if (!root) throw new Error('во фрагменте нет корневого элемента');

        var state = el.getAttribute('state');
        var mode = el.getAttribute('mode');
        if (state) root.setAttribute('data-state', state);
        if (mode) root.setAttribute('data-mode', mode);
        if (el.id) root.id = el.id;
        if (el.className) root.className = (root.className + ' ' + el.className).trim();

        el.replaceWith(root);
        root.dispatchEvent(new CustomEvent('ds-include:loaded', { bubbles: true, detail: { src: src, root: root } }));
      })
      .catch(function (err) {
        console.error('ds-include: не удалось загрузить ' + src, err);
        var stub = document.createElement('div');
        stub.className = 'lc-include-error';
        stub.style.cssText = 'padding:12px;border:1px dashed var(--border-error,#d33);color:var(--text-error,#d33);font:var(--type-body-s,13px sans-serif)';
        stub.textContent = 'Компонент не загрузился: ' + src;
        el.replaceWith(stub);
      });
  }

  document.querySelectorAll('ds-include').forEach(mount);
})();
