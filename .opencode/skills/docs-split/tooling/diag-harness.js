/* ============================================================
   DIAG-HARNESS — универсальный харнесс проверки doc-страниц IBP.
   Инжектится docs-split.mjs verify перед </body> в temp-копию
   страницы; собирает компактную диагностику в элемент pre#diag.
   headless chrome --dump-dom выводит её, CLI извлекает.

   Не зависит от конкретного компонента: определяет режим
   конструктора и живое демо по тому, что есть в разметке.
   ============================================================ */
(function () {
  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }
  ready(function () {
    setTimeout(function () {
      var out = [];
      function rect(el) { if (!el) return 'null'; var r = el.getBoundingClientRect(); return Math.round(r.width) + 'x' + Math.round(r.height); }
      function tap(id) { var b = document.getElementById(id); if (b) b.click(); }

      /* --- каркас --- */
      out.push('main.ds-split: ' + (document.querySelector('main.ds-split') ? 'yes' : 'NO'));
      var tabs = document.querySelectorAll('.app-pane-docs .tabs[data-tabs] .tab');
      out.push('tabs: ' + (tabs.length ? Array.prototype.map.call(tabs, function (t) { return t.textContent.trim(); }).join(' | ') : 'none')
        + ' [' + Array.prototype.map.call(tabs, function (t) { return Math.round(t.getBoundingClientRect().width); }).join(',') + ']');
      var paneD = document.getElementById('pane-docs'), paneC = document.getElementById('pane-constructor'), paneK = document.getElementById('pane-code');
      out.push('panes hidden (docs/ctor/code): ' + (paneD ? paneD.hidden : '-') + '/' + (paneC ? paneC.hidden : '-') + '/' + (paneK ? paneK.hidden : '-'));
      out.push('TOC links: ' + document.querySelectorAll('#docs-toc .docs-toc__link').length);
      out.push('splitpane--app: ' + document.querySelectorAll('.splitpane--app').length);

      /* --- живое демо в верхней панели --- */
      var stage = document.querySelector('.demo-stage');
      if (stage) {
        var inner = stage.firstElementChild;
        out.push('demo-stage: ' + rect(stage) + ' child=' + (inner ? inner.tagName.toLowerCase() + (inner.id ? '#' + inner.id : '') + '.' + String(inner.className).split(' ')[0] : 'none'));
        out.push('demo content: modal=' + stage.querySelectorAll('.modal').length + ' tbl_rows=' + stage.querySelectorAll('.tbl__row').length
          + ' snack=' + stage.querySelectorAll('.snack').length + ' tile=' + (stage.querySelector('.tile') ? 1 : 0)
          + ' kids=' + stage.children.length);
      } else {
        out.push('demo-stage: нет');
      }

      /* --- конструктор: режим и колонки --- */
      var pgc = document.getElementById('pg-controls');
      if (pgc) {
        out.push('constructor: dynamic children=' + pgc.children.length);
        /* :scope > .toggles — ПРАВАЯ колонка, прямой ребёнок #pg-controls.
           Наивный pgc.querySelector('.toggles') находил вложенный .toggles
           группы «Опции» (кастомные кнопки .toggle) и показывал пустую метрику,
           хотя свитчи-конвертации созданы (30.08.2026). */
        var dt = pgc.querySelector(':scope > .toggles'), dc = pgc.querySelector('.ctl-col');
        if (dc) out.push('  ctl-col children: ' + dc.children.length);
        if (dt) {
          out.push('  toggles labels: ' + Array.prototype.map.call(dt.querySelectorAll('.pg-toggle'), function (t) { return t.textContent.trim(); }).join(' || '));
        }
      } else {
        var groups = document.querySelectorAll('.docs-main .pg__controls .ctl-group');
        var spgc = document.querySelector('.docs-main .pg__controls');
        if (groups.length) {
          out.push('constructor: grouped groups=' + groups.length);
          Array.prototype.forEach.call(groups, function (g, i) {
            var h = g.querySelector('.ctl-group__head');
            var col = g.querySelector('.ctl-col'), tog = g.querySelector('.toggles');
            out.push('  g' + (i + 1) + ': ' + (h ? h.textContent.trim() : '?') + ' | ctl-col=' + (col ? col.children.length : 0) + ' toggles=' + (tog ? tog.children.length : 0));
          });
        } else if (spgc) {
          var sCol = spgc.querySelector('.ctl-col'), sTog = spgc.querySelector('.toggles');
          out.push('constructor: static ctl-col=' + (sCol ? sCol.children.length : 0) + ' toggles=' + (sTog ? sTog.children.length : 0));
          if (sTog) out.push('  toggles labels: ' + Array.prototype.map.call(sTog.querySelectorAll('.pg-toggle'), function (t) { return t.textContent.trim(); }).join(' || '));
        } else {
          out.push('constructor: none found');
        }
      }
      out.push('switches with .lbl inside: ' + document.querySelectorAll('.toggles .pg-toggle .lbl').length);
      out.push('segctrl in constructor: ' + document.querySelectorAll('.docs-main .pg__controls .segctrl, #pg-controls .segctrl').length);

      /* --- статичность подписи свитча (правило Switch, К8): клик не меняет текст --- */
      var swEl = document.querySelector('.docs-main .toggles .pg-toggle, #pg-controls .toggles .pg-toggle');
      if (swEl) {
        var swTxt = swEl.lastElementChild ? swEl.lastElementChild.textContent : swEl.textContent;
        var swInp = swEl.querySelector('input');
        if (swInp) {
          swInp.checked = !swInp.checked;
          swInp.dispatchEvent(new Event('change', { bubbles: true }));
          var swTxt2 = swEl.lastElementChild ? swEl.lastElementChild.textContent : swEl.textContent;
          out.push('switch label static: ' + (swTxt === swTxt2 ? 'yes' : 'NO "' + swTxt + '" -> "' + swTxt2 + '"'));
        } else {
          out.push('switch label static: no-input');
        }
      } else {
        out.push('switch label static: no-switch');
      }

      /* --- вкладка «Код» --- */
      tap('tab-code');
      out.push('code-out lengths: ' + ['html', 'css', 'js'].map(function (k) {
        var el = document.getElementById('code-out-' + k);
        return el ? el.textContent.length : '-';
      }).join('/'));
      out.push('segctrl code-switch: ' + (document.querySelector('#pane-code .segctrl[data-segctrl]') ? 1 : 0));
      out.push('code pane visible: ' + (paneK ? !paneK.hidden : '-'));

      tap('tab-docs');
      var diag = document.createElement('pre');
      diag.id = 'diag';
      diag.textContent = out.join('\n');
      document.body.appendChild(diag);
    }, 1500);
  });
})();
