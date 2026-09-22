/* =========================================================================
   DOCS-SPLIT — логика страницы документации со сплиттером и табами
   (пилот AllocationBar2 → общий слой, 29.08.2026).

   Требует: styles/docs-split.css, рантаймы ds-splitter.js и ds-tabs.js
   (таблицу рантайм-хуков см. .opencode/skills/screen-assembly/references/runtime-hooks.md).

   Запускается только на страницах-хостах: <main class="page ds-split">.
   Порядок: подключать ПОСЛЕ page.js страницы (конструктор и демо строятся
   на DOMContentLoaded — этот скрипт регистрирует свой обработчик позже и
   работает с уже готовыми контролами). Рантаймы ДС не дублирует: ds-tabs.js
   делает roving tabindex и индикатор, ds-splitter.js — перетаскивание;
   здесь только связка «таб ↔ панель», сегмент «Код», подсветка, локальный
   TOC (замена ds-toc.js) и прогрессивное улучшение контролов конструктора
   (правило ds-rules §11, решение человека 21.09.2026):
     да/нет           → свитчер pg-toggle;
     2–3 варианта     → ButtonGroup, сегментированный выбор;
     4 и больше       → выпадающий список, как есть.
   Свитчер и ButtonGroup — без лейбла сверху: подпись свитча и тексты кнопок
   самодостаточны, текст .lbl остаётся только в aria-label группы.
   SegmentControl и сетка иконок в конструкторе не применяются.

   Словарь самодостаточных подписей свитчеров страница может задать до
   подключения этого файла: window.DS_SPLIT_SWITCH_LABELS = { 'Имя': 'Подпись' }
   или { 'Имя': { label: 'Подпись', on: '<значение селекта>' } }.
   Подпись СТАТИЧНА (правило Switch): не меняется от положения свитча.
   ========================================================================= */
(function () {
'use strict';

function ready(fn) {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
  else fn();
}

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

ready(function () {
  var main = document.querySelector('main.ds-split');
  if (!main) return;
  var tablist = main.querySelector('.app-pane-docs .tabs[data-tabs]');
  var tabsBody = main.querySelector('.app-pane-docs .tabs-body');
  if (!tablist || !tabsBody) return;

  /* ---------- 1. Табы: Конструктор / Документация / Код ---------- */
  var tocSpy = null;
  function setPane(paneId) {
    tabsBody.querySelectorAll('.tabpane').forEach(function (p) { p.hidden = p.id !== paneId; });
    tabsBody.scrollTop = 0;
    if (paneId === 'pane-docs' && tocSpy) requestAnimationFrame(tocSpy);
  }
  /* клик — по data-pane самой кнопки (не зависит от порядка обработчиков
     с рантаймом ds-tabs.js); клавиатура — после того, как рантайм обновил
     aria-selected (setTimeout 0 выполняется после его обработчика) */
  tablist.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('.tab') : null;
    if (t && tablist.contains(t) && t.dataset.pane) setPane(t.dataset.pane);
  });
  tablist.addEventListener('keydown', function () {
    setTimeout(function () {
      var sel = tablist.querySelector('.tab[aria-selected="true"]');
      if (sel && sel.dataset.pane) setPane(sel.dataset.pane);
    }, 0);
  });

  /* ---------- 2. Переключатель «Код»: HTML / CSS / JS ---------- */
  var codeSwitch = main.querySelector('#pane-code .segctrl[data-segctrl]');
  if (codeSwitch) {
    codeSwitch.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('.segctrl__item') : null;
      if (!b || !codeSwitch.contains(b) || !b.dataset.lang) return;
      main.querySelectorAll('#pane-code .code-view').forEach(function (v) {
        v.hidden = v.dataset.view !== b.dataset.lang;
      });
    });
  }

  /* ---------- 3. Подсветка кода (лёгкая, regex; токены палитры кода ДС) ---------- */
  var RE_HTML = /(<!--[\s\S]*?-->)|("[^"]*"|'[^']*')|(<\/?[a-zA-Z][\w-]*)|(\s[a-zA-Z-]+(?==))|(\/?>)|(=)/g;
  function hlHtml(code) {
    return code.replace(RE_HTML, function (m, cmt, str, tag, attr, close, eq) {
      if (cmt)  return '<span class="tk-cm">' + esc(cmt) + '</span>';
      if (str)  return '<span class="tk-val">' + esc(str) + '</span>';
      if (tag)  { var mm = tag.match(/^(<\/?)(.*)$/); return '<span class="tk-pun">' + esc(mm[1]) + '</span><span class="tk-tag">' + esc(mm[2]) + '</span>'; }
      if (attr) return '<span class="tk-attr">' + esc(attr) + '</span>';
      if (close)return '<span class="tk-pun">' + esc(close) + '</span>';
      if (eq)   return '<span class="tk-pun">=</span>';
      return esc(m);
    });
  }
  var RE_CSS = /(\/\*[\s\S]*?\*\/)|("[^"]*"|'[^']*')|(--[\w-]+)|(\b\d+(?:\.\d+)?(?:px|%|em|rem|vh|vw|s|ms)?\b)|([a-zA-Z-]+(?=\s*:))/g;
  function hlCss(code) {
    return code.replace(RE_CSS, function (m, cmt, str, v, num, prop) {
      if (cmt)  return '<span class="tk-cm">' + esc(cmt) + '</span>';
      if (str)  return '<span class="tk-val">' + esc(str) + '</span>';
      if (v)    return '<span class="tk-attr">' + esc(v) + '</span>';
      if (num)  return '<span class="tk-num">' + esc(num) + '</span>';
      if (prop) return '<span class="tk-tag">' + esc(prop) + '</span>';
      return esc(m);
    });
  }
  var RE_JS = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("[^"\n]*"|'[^'\n]*')|(\b\d+(?:\.\d+)?\b)|(\b(?:function|return|var|if|else|for|while|new|typeof|in|of|switch|case|break|continue|try|catch|finally|throw|const|let|do|delete|void|this|null|true|false|undefined|NaN|instanceof|yield|async|await|window|document)\b)/g;
  function hlJs(code) {
    return code.replace(RE_JS, function (m, cmt, str, num, kw) {
      if (cmt)  return '<span class="tk-cm">' + esc(cmt) + '</span>';
      if (str)  return '<span class="tk-val">' + esc(str) + '</span>';
      if (num)  return '<span class="tk-num">' + esc(num) + '</span>';
      if (kw)   return '<span class="tk-kw">' + esc(kw) + '</span>';
      return esc(m);
    });
  }
  function fillCode(srcId, outId, fn) {
    var src = document.getElementById(srcId), out = document.getElementById(outId);
    if (src && out) out.innerHTML = fn(src.textContent.replace(/^\n+/, '').replace(/\s+$/, ''));
  }
  fillCode('src-code-html', 'code-out-html', hlHtml);
  fillCode('src-code-css',  'code-out-css',  hlCss);
  fillCode('src-code-js',   'code-out-js',   hlJs);

  /* ---------- 4. Локальная якорная навигация (замена ds-toc.js) ---------- */
  var tocHost = main.querySelector('#docs-toc');
  var docsPane = main.querySelector('#pane-docs');
  if (tocHost && docsPane) {
    var TR = { 'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'c','ч':'ch','ш':'sh','щ':'sch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya' };
    function slugify(s) {
      var out = '';
      s = String(s).toLowerCase();
      for (var i = 0; i < s.length; i++) out += (TR[s[i]] !== undefined ? TR[s[i]] : s[i]);
      out = out.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      return out || 'section';
    }
    var items = [], used = {};
    docsPane.querySelectorAll('section.section').forEach(function (sec) {
      var h = sec.querySelector('h2');
      if (!h) return;
      var text = (h.textContent || '').replace(/\s+/g, ' ').trim();
      if (!text) return;
      var base = 'sec-' + slugify(sec.getAttribute('data-screen-label') || text), id = base, n = 2;
      while (used[id] || document.getElementById(id)) id = base + '-' + (n++);
      used[id] = true; sec.id = id;
      items.push({ sec: sec, text: text });
    });
    if (items.length > 1) {
      var label = document.createElement('p');
      label.className = 'docs-toc__label';
      label.textContent = 'На этой странице';
      tocHost.appendChild(label);
      var list = document.createElement('ul');
      list.className = 'docs-toc__list';
      items.forEach(function (it) {
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.className = 'docs-toc__link';
        a.href = '#' + it.sec.id;
        a.textContent = it.text;
        a.addEventListener('click', function (e) {
          e.preventDefault();
          var top = it.sec.getBoundingClientRect().top + tabsBody.scrollTop - tabsBody.getBoundingClientRect().top - 28;
          tabsBody.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
          if (history.replaceState) history.replaceState(null, '', '#' + it.sec.id);
        });
        li.appendChild(a); list.appendChild(li); it.link = a;
      });
      tocHost.appendChild(list);
      function spy() {
        if (docsPane.hidden) return;
        var line = 140;
        var current = items[0];
        var bodyTop = tabsBody.getBoundingClientRect().top;
        for (var i = 0; i < items.length; i++) {
          if (items[i].sec.getBoundingClientRect().top - bodyTop <= line) current = items[i];
        }
        items.forEach(function (it) { it.link.classList.toggle('is-active', it === current); });
      }
      tocSpy = spy;
      tabsBody.addEventListener('scroll', function () { requestAnimationFrame(spy); }, { passive: true });
      window.addEventListener('resize', spy, { passive: true });
      spy();
    }
  }

  /* ---------- 5. Конструктор: две колонки контролов ----------
     Слева (.ctl-col) — выпадающие списки, ButtonGroup и инпуты; справа
     (.toggles) — свитчеры, чекбоксы, радиобаттоны, слайдеры. Селекты
     улучшаются по числу вариантов (правило §11, 21.09.2026): да/нет →
     свитчер pg-toggle, 2–3 варианта → ButtonGroup (5c), 4 и больше
     остаются списком. Селект всегда остаётся скрытым источником истины —
     change страницы продолжает работать. SegmentControl в конструкторе
     не применяется. Пустая колонка не рисуется — docs-split.css. */
  var SWITCH_LABELS = window.DS_SPLIT_SWITCH_LABELS || {};
  var OFF_VALUES = ['no', 'off', 'false', 'none', '0', ''];

  function isOffOption(o) {
    return OFF_VALUES.indexOf(String(o.value).toLowerCase()) !== -1 || /^нет$/i.test(o.textContent.trim());
  }
  /* Да/нет — это селект на два варианта, записанный в словаре подписей
     свитчеров, или селект, у которого один вариант означает «выключено».
     Два равноправных варианта («Юрлицо / Физлицо», «Найдено / Выбрано») —
     выбор, а не опция: ему место в ButtonGroup. */
  function isToggleSelect(sel, labelName) {
    if (sel.options.length !== 2) return false;
    if (Object.prototype.hasOwnProperty.call(SWITCH_LABELS, labelName)) return true;
    return isOffOption(sel.options[0]) || isOffOption(sel.options[1]);
  }

  var controls = main.querySelector('#pg-controls') || main.querySelector('.constructor-panel .pg__controls');
  if (controls) {
    var ctlCol = document.createElement('div'); ctlCol.className = 'ctl-col';
    var toggles = document.createElement('div'); toggles.className = 'toggles';
    controls.appendChild(ctlCol);
    controls.appendChild(toggles);

    /* 5a. бинарные селекты → свитчеры pg-toggle (в правую колонку).
       Подпись свитча СТАТИЧНА (правило компонента Switch, 30.08.2026):
       текст не меняется от положения свитча. Словарь DS_SPLIT_SWITCH_LABELS:
       строка — статичная подпись; объект { label, on? } — подпись + явное
       on-значение селекта (для выборов вида [y, none], где эвристика
       yes/on/options[1] даёт неверное направление). */
    controls.querySelectorAll(':scope > .ctl').forEach(function (ctl) {
      var box = ctl.querySelector('.pg-select');
      var sel = box && box.querySelector('select');
      if (!sel || sel.options.length !== 2) return;
      var lblEl = ctl.querySelector('.lbl');
      var labelName = lblEl ? lblEl.textContent.trim() : '';
      if (!isToggleSelect(sel, labelName)) return; /* два равноправных варианта — в 5c */
      var dict = SWITCH_LABELS[labelName];
      var yesVal = null;
      if (dict && typeof dict === 'object' && dict.on) yesVal = String(dict.on);
      if (yesVal === null) {
        for (var i = 0; i < sel.options.length; i++) {
          var v = sel.options[i].value;
          if (v === 'yes' || v === 'on') yesVal = v;
        }
      }
      /* «включено» — вариант, который не означает «выключено» */
      if (yesVal === null && isOffOption(sel.options[0]) && !isOffOption(sel.options[1])) yesVal = sel.options[1].value;
      if (yesVal === null && isOffOption(sel.options[1]) && !isOffOption(sel.options[0])) yesVal = sel.options[0].value;
      if (yesVal === null) yesVal = sel.options[1].value;
      var noVal = sel.options[0].value === yesVal ? sel.options[1].value : sel.options[0].value;
      var label = document.createElement('label');
      label.className = 'pg-toggle';
      var input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = sel.value === yesVal;
      var sw = document.createElement('span'); sw.className = 'pg-toggle__sw';
      var txt = document.createElement('span');
      var staticText = (dict == null) ? labelName
        : (typeof dict === 'string' ? dict : (dict.label || labelName));
      txt.textContent = staticText;
      input.addEventListener('change', function () {
        sel.value = input.checked ? yesVal : noVal;
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      });
      label.appendChild(input); label.appendChild(sw); label.appendChild(txt);
      toggles.appendChild(label);
      ctl.style.display = 'none';
    });

    /* 5b. все не-бинарные ПРЯМЫЕ дети #pg-controls — в левую колонку в исходном
       порядке, включая групповые заголовки .pg__grouphead (урок ReadOnlyField,
       30.08.2026: раньше переносились только :scope > .ctl, заголовки групп
       оставались стопкой вверху #pg-controls без своих контролов). */
    controls.querySelectorAll(':scope > *').forEach(function (node) {
      /* сами колонки тоже прямые дети: перенос колонки в саму себя бросал
         HierarchyRequestError и обрывал обработчик (найдено 21.09.2026) */
      if (node === ctlCol || node === toggles) return;
      if (node.classList.contains('ctl') && node.style.display === 'none') return; /* бинарные уже скрыты */
      ctlCol.appendChild(node);
    });
  }

  /* 5c. селекты на 2–3 варианта → ButtonGroup, сегментированный выбор
     (правило §11, решение человека 21.09.2026). Работает во всех
     конструкторах страницы — динамических, статических и сгруппированных —
     и на месте: контрол остаётся в своей колонке.
     Лейбла над группой нет (правило ButtonGroup, 21.09.2026): .lbl скрывается,
     его текст уходит в aria-label группы, а смысл несут тексты кнопок —
     поэтому варианты селекта пишутся самодостаточными («1 чип / 2 чипа»,
     а не «1 / 2» под лейблом «Количество чипов»).
     Разметка — по спеке ButtonGroup: outline, toggle, fullwidth (ширина
     колонки, как у списка), кнопки M (40px, как селект). Длинная подпись
     режется многоточием по правилу Button, полный текст — в title.
     aria-pressed ставится здесь, а не рантаймом ds-buttongroup.js: страницы
     ДС грузят рантаймы поштучно, и его на них нет. */
  function ensureButtonCss() {
    if (ensureButtonCss.done) return;
    ensureButtonCss.done = true;
    var barrel = document.querySelector('link[rel="stylesheet"][href$="/ds.css"]');
    ['button.css', 'button-group.css'].forEach(function (f) {
      if (barrel || document.querySelector('link[rel="stylesheet"][href$="/' + f + '"]')) return;
      var l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = (window.__DS_ROOT || '') + 'styles/' + f;
      document.head.appendChild(l);
    });
  }

  function segmented(box, sel, lblEl, labelName) {
    ensureButtonCss();
    if (lblEl) lblEl.hidden = true;
    var group = document.createElement('div');
    group.className = 'btn-group btn-group--outline btn-group--toggle btn-group--fullwidth';
    group.setAttribute('role', 'radiogroup');
    if (labelName) group.setAttribute('aria-label', labelName);

    function sync() {
      Array.prototype.forEach.call(group.children, function (b) {
        b.setAttribute('aria-pressed', String(b.dataset.value === sel.value));
      });
    }
    function build() {
      group.textContent = '';
      Array.prototype.forEach.call(sel.options, function (o) {
        var text = o.textContent.trim();
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'btn btn--outline btn--m';
        b.dataset.value = o.value;
        b.title = text;
        b.disabled = o.disabled;
        var s = document.createElement('span');
        s.className = 'btn__label';
        s.textContent = text;
        b.appendChild(s);
        group.appendChild(b);
      });
      sync();
    }

    group.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('.btn') : null;
      if (!b || !group.contains(b) || b.disabled) return;
      if (sel.value !== b.dataset.value) {
        sel.value = b.dataset.value;
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      }
      sync();
    });
    sel.addEventListener('change', sync);
    /* страница может пересобрать варианты селекта — группа следует за ним */
    if (window.MutationObserver) new MutationObserver(build).observe(sel, { childList: true });

    box.style.display = 'none';
    box.parentNode.insertBefore(group, box.nextSibling);
    build();
    return sync;
  }

  main.querySelectorAll('#pane-constructor .pg__controls, .constructor-panel .pg__controls').forEach(function (host) {
    var syncers = [];
    host.querySelectorAll('.ctl').forEach(function (ctl) {
      if (ctl.style.display === 'none') return;                  /* уже свитчер */
      var box = ctl.querySelector('.pg-select');
      var sel = box && box.querySelector('select');
      if (!sel || sel.multiple || box.style.display === 'none') return;
      if (sel.options.length < 2 || sel.options.length > 3) return;
      var lblEl = ctl.querySelector('.lbl');
      var labelName = lblEl ? lblEl.textContent.trim() : '';
      if (isToggleSelect(sel, labelName)) return;                /* да/нет — не выбор */
      syncers.push(segmented(box, sel, lblEl, labelName));
    });
    if (!syncers.length) return;
    /* Страница правит зависимые селекты программно, без события (например,
       сбрасывает значение скрытого контрола). Такие правки случаются в
       обработчике change — после него группы сверяются со своими селектами. */
    function syncAll() { syncers.forEach(function (f) { f(); }); }
    host.addEventListener('change', function () { syncAll(); setTimeout(syncAll, 0); });
  });
});
})();
