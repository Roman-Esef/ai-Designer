/* ============================================================
   DS-LINT — статический ревизор целостности страниц ДС (группы A–D, P).
   ВНИМАНИЕ: это НЕ браузерный скрипт. Не подключать на страницах.
   Сам по себе не исполняется — ждёт хелперы readFile/ls снаружи.
   Запуск через обёртку, из корня ДС:

     node scripts/ds-lint-cli.mjs pages/atoms/Badge.html
     node scripts/ds-check.mjs pages/atoms/Badge.html   # линтер + проверки docs-split

   Отчёт — плоский текст, только нарушения. Живые проверки (группа E) —
   в skills/ds-integrity-check.md, сниппетом для консоли браузера.

   Группа P — гейт парности «документация = код» (Фаза 3, P0 аудита разделов).
   Запускается отдельно, страницы не нужны:

     log(await run([], { global: false, parity: true }));
   ============================================================ */

/* ---------- белые списки (каждое подавление — с причиной) ---------- */
// контракт разделов применяется только к компонентным страницам
const CONTRACT_DIRS = ['pages/atoms/', 'pages/molecules/', 'pages/organisms/'];
// реестры (index/ds-nav/спеки) ведутся для этих папок
const REGISTRY_DIRS = ['pages/foundations/', 'pages/atoms/', 'pages/molecules/', 'pages/organisms/'];
// у страниц-экранов и rnd свои разделы и своя роль
const SKIP_ALL = [/^index\.html$/, /^templates\//];
// CSS документации и экранов — намеренно вне ds.css/styles.css (не компоненты ДС)
const CSS_NOT_IN_BUNDLE = ['ds-docs.css', 'ds-nav.css', 'ds-toc.css', 'pg-kit.css', 'docs-split.css', 'input-pages.css', 'screens.css'];
// hex, которые легальны: демо-тени и шахматная подложка прозрачности
const HEX_OK = /(chess|checker|shadow-demo|elevation-demo)/i;
// значения, легальные в разметке документации (не выдуманные цвета продукта):
// #fff/#000 — демо-контраст и текст на тёмной панели кода; rgba(255,255,255,*) — оверлеи там же;
// #f2f5f5/#fbfcfc/#d9e0e0 — подложка и рамка превью конструктора; rgba(40,50,55,*) — демо-тени
const HEX_ALLOW = [/^#(fff|ffffff|000|000000)$/i, /^rgba?\(\s*255\s*,\s*255\s*,\s*255/i, /^#(f2f5f5|fbfcfc|d9e0e0)$/i, /^rgba?\(\s*40\s*,\s*50\s*,\s*55/i];
// пары «скрипт ↔ его CSS» (сами скрипты умеют подтягивать стиль, потому WARN)
const JS_CSS_PAIRS = [['ds-nav.js', 'ds-nav.css'], ['ds-toc.js', 'ds-toc.css'], ['pg-kit.js', 'pg-kit.css']];
// рантаймы, которые ds.js (RulesAudit W0/K0) догружает сам — экран не должен подключать их напрямую
const DS_JS_BUNDLES = ['icons-data.js', 'ds-icons.js', 'ds-float.js', 'screens-chrome.js', 'ds-tabs.js', 'ds-tile.js', 'ds-menu.js', 'ds-popover.js', 'ds-tooltip.js', 'ds-modal.js', 'ds-table.js', 'tbl-resize.js', 'tbl-reorder.js', 'tbl-pin.js', 'ds-pagination.js', 'ds-riskmetric.js', 'ds-alert.js', 'ds-chip.js', 'ds-allocationbar.js', 'ds-notify.js', 'ds-datepicker.js', 'input-kit.js', 'ds-nav-panel.js', 'ds-splitter.js', 'ds-illustrations.js'];
// утилитарные классы разметки документации — владельца в styles/* не имеют
const CLASS_IGNORE = new Set(['page', 'section', 'masthead', 'meta', 'lead', 'eyebrow', 'crumb', 'desc', 'panel', 'row', 'col', 'grid', 'card', 'note', 'name', 'c', 'n', 'is-off']);
// F5 — реестр «анатомия компонента взята целиком, не урезана под текущий вид». Каждый
// компонент, у которого есть узлы, обязанные существовать в DOM ВСЕГДА (класс-свап
// режима/состояния их только показывает/прячет CSS-ом, но не порождает), регистрируется
// здесь одной строкой вместо кода на каждый инцидент (см. skills/ds-integrity-check.md, F5).
// when — по этому маркеру лint понимает, что компонент использован; require — список
// [regex, человекочитаемое имя узла], каждый обязан встретиться в разметке страницы.
const ANATOMY_CONTRACTS = [
  { name: 'NavPanel', when: /\bnav--(rail|drawer|fixed)\b/, require: [
      [/\bnav__pin\b/, '.nav__pin'],
      [/\bnav__user-text\b/, '.nav__user-text'],
      [/\bnav-layout\b/, '.nav-layout (обёртка хост-контракта)']
    ] }
];
// B8 — компоненты, чья подпись усекается, но сам компонент НАМЕРЕННО не сжимается.
// Каждое подавление — с причиной: переполнение решается не сжатием элемента.
const SHRINK_OK = {
  tab: 'ряд табов не сжимает таб, а скроллится (.tabs-scroll) или прячет хвост в меню «Ещё» (.tabs-overflow); внутри меню .tab__label сжимается своим правилом',
  segctrl: 'ширина трека — по контенту; в --fullwidth растягивается трек, а сегменты делят его через flex:1 1 0 — сжимается item, не контрол'
};
// B9 — обёртки, которые рантайм вставляет ВОКРУГ уже свёрстанного элемента.
// Такая обёртка обязана быть раскладочно прозрачной, иначе она меняет поведение
// чужой разметки, которая сама по себе написана правильно.
/* B11 — корни, которым парное [hidden] не нужно, с причиной (стиль ANATOMY_CONTRACTS/SHRINK_OK) */
const HIDDEN_PAIR_OK = {
  screen: 'каркас рабочей области — существует ровно один на странице, скрывать нечем и незачем',
  'nav-layout': 'внешний каркас страницы, там же',
  'chart-host': 'слот под канвас графика: скрывается контейнер-потребитель, а не хост',
};

const RUNTIME_WRAPPERS = /(\w+)\.parentNode\.insertBefore\(\s*(\w+)\s*,\s*(\w+)\s*\)/g;

// B10 — geometry-свойства (transform/left/right/top/bottom), которые рантайму МОЖНО
// считать на событии scroll. Ключ — «файл:функция», чтобы подавление не накрывало
// весь файл: новая запись геометрии в том же рантайме снова потребует обоснования.
// Общая причина всех записей: это плавающий слой в координатах вьюпорта (position:
// fixed), привязанный к якорю ВНУТРИ прокручиваемого предка. При скролле он обязан
// пересчитаться, а CSS-эквивалента нет — CSS Anchor Positioning в ДС не применяется.
// Отставание на кадр здесь остаётся, но альтернативы ему нет; у sticky-удержания
// колонок она есть, поэтому там это дефект (см. B10 в skills/ds-integrity-check.md).
const SCROLL_GEOMETRY_OK = {
  'ds-tooltip.js:place': 'floating-тултип: position:fixed относительно якоря, следует за ним при скролле любого предка',
  'ds-popover.js:place': 'floating-поповер: то же — слой вне потока, координаты вьюпорта',
  'ds-dropdownlist.js:place': 'floating-список: раскрывается вне потока (боундари/флип), координаты вьюпорта',
  'ds-menu.js:place': 'floating-меню: слой вне потока, координаты вьюпорта',
  'ds-datepicker.js:reposition': 'floating-календарь: слой вне потока, координаты вьюпорта',
  'ds-float.js:apply': 'общий слой пере-якорения: плавающий элемент пере-якорен в .ds-float-layer (position:fixed), координаты вьюпорта — закладка на скролл любого предка',
  'ds-nav-panel.js:placeRailLabels': 'rail-подписи панели навигации — тултипы position:fixed вне скролл-контейнера списка'
};

// нативные таблицы и устаревшие сетки-справочники
// плюс: служебный тост «Скопировано» на страницах-каталогах и галочки внутри контролов ДС
// (.cb__mark/.sw__/.rb__ — инлайн-SVG прописан в самих DOM-снипах компонентов)
const SVG_OK = /(code-panel__copy|copy-btn|card__go|crumb|ds-nav__toggle|ds-toc|chev|arrow|guide|rules|dont|good|bad|class="toast"|cb__mark|cb__box|sw__|rb__)/i;
const BAD_TABLE = [/<table[\s>]/i, /\bref-table\b/, /\bdev-table\b/, /\bcolor-ref\b/, /\bcref-/];

/* ---------- утилиты ---------- */
const RX = {
  cssVarDef: /(--[a-zA-Z0-9-]+)\s*:/g,
  cssVarUse: /var\(\s*(--[a-zA-Z0-9-]+)\s*[),]/g,
  cls: /class="([^"]*)"/g,
  h2: /<h2[^>]*>([\s\S]*?)<\/h2>/g,
  link: /<link[^>]+href="([^"]+)"/g,
  src: /<script[^>]+src="([^"]+)"/g,
  href: /\shref="([^"]+)"/g,
  imgSrc: /<img[^>]+src="([^"]+)"/g,
  styleBlock: /<style[\s\S]*?<\/style>/gi,
  classNameAssign: /className\s*=\s*['"]([^'"]*)['"]/g,
  boxPx: /(padding|margin|gap|border-radius)\s*:\s*([^;{}]+)/gi
};
const strip = (s) => s.replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
const uniq = (a) => [...new Set(a)];
const base = (p) => p.split('/').pop();
const all = (re, s, i = 1) => { const out = []; let m; re.lastIndex = 0; while ((m = re.exec(s))) out.push(m[i]); return out; };
/* делит селектор по запятым верхнего уровня, не заходя внутрь ()/[] — нужно B7,
   чтобы отличить ":is(.entity--selected,[aria-selected=true])" (одна топ-ветка,
   не заскоуплена) от нормального "A, B" списка селекторов. */
const splitTopLevel = (sel) => {
  const out = []; let depth = 0, cur = '';
  for (const ch of sel) {
    if (ch === '(' || ch === '[') depth++;
    else if (ch === ')' || ch === ']') depth--;
    if (ch === ',' && depth === 0) { out.push(cur); cur = ''; } else cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out;
};
const today = () => { const d = new Date(); const p = (n) => String(n).padStart(2, '0'); return p(d.getDate()) + '.' + p(d.getMonth() + 1) + '.' + d.getFullYear(); };
/* тело блока: от первой `{` после from (не дальше span символов) до парной `}`.
   Строки и комментарии со скобками не разбираем — линтер и так регексовый, а у
   рантаймов ДС такой код в сигнатурах функций не встречается. Нужно B10. */
const braceBody = (s, from, span) => {
  const open = s.indexOf('{', from);
  if (open < 0 || open - from > (span === undefined ? 200 : span)) return '';
  let d = 0;
  for (let i = open; i < s.length; i++) {
    if (s[i] === '{') d++;
    else if (s[i] === '}') { d--; if (!d) return s.slice(open + 1, i); }
  }
  return '';
};
/* карта локальных функций файла: имя → тело. Объявления и присваивания
   (function f(){}, var f = function(){}, const f = (…) => {}). Нужно B10. */
const localFns = (js) => {
  const map = new Map();
  for (const m of js.matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\(/g)) map.set(m[1], braceBody(js, m.index));
  for (const m of js.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:function\b|\()/g)) {
    if (!map.has(m[1])) map.set(m[1], braceBody(js, m.index));
  }
  return map;
};

async function tree() {
  const files = new Set(), seen = new Set();
  async function walk(dir, depth) {
    if (depth > 3 || seen.has(dir)) return;
    seen.add(dir);
    let items;
    try { items = await ls(dir); } catch (e) { return; }
    const subs = [];
    for (const raw of items) {
      const nm = String(raw).replace(/\/$/, '');
      const p = dir ? dir + '/' + nm : nm;
      if (/\.[a-z0-9]{2,5}$/i.test(nm)) files.add(p);
      else subs.push(p);
    }
    await Promise.all(subs.map((p) => walk(p, depth + 1)));
  }
  await walk('', 0);
  return files;
}

/* ---------- сбор реестров проекта ---------- */
async function loadProject() {
  const files = await tree();
  const list = [...files];
  const styleFiles = list.filter((f) => /^styles\/.+\.css$/.test(f));

  // токены: все определения --x в styles/*
  const tokens = new Set();
  const classOwners = new Map(); // класс -> Set(файлов)
  const cssSources = await Promise.all(styleFiles.map((f) => readFile(f)));
  for (let i = 0; i < styleFiles.length; i++) {
    const f = styleFiles[i], css = cssSources[i];
    for (const t of all(RX.cssVarDef, css)) tokens.add(t);
    const selectors = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{[^{}]*\}/g, '{}');
    for (const c of uniq(all(/\.(-?[a-zA-Z][a-zA-Z0-9_-]*)/g, selectors))) {
      if (!classOwners.has(c)) classOwners.set(c, new Set());
      classOwners.get(c).add(f);
    }
  }
  // владелец класса — только если файл единственный
  const owner = new Map();
  for (const [c, set] of classOwners) if (set.size === 1) owner.set(c, [...set][0]);
  const cssClasses = new Set(classOwners.keys());

  const [index, nav, specIndex, cheat, dsCss, rootCss, dsRules] = await Promise.all(
    ['index.html', 'scripts/ds-nav.js', 'specs/_index.md', 'specs/_cheatsheet.md', 'ds.css', 'styles.css', 'MAINTAINING.md'].map((f) => readFile(f))
  );

  // канонический порядок h2 — из MAINTAINING.md, не дублируем
  let canon = [];
  const blk = dsRules.split('Контракт страницы компонента')[1];
  if (blk) {
    canon = all(/^\d+\.\s*(.+)$/gm, blk.split('###')[0])
      .map((s) => s.split(/\s+[—(]|:/)[0].trim())
      .filter((s) => s && !/^Шапка/.test(s));
  }
  return { files, list, styleFiles, tokens, owner, cssClasses, index, nav, specIndex, cheat, dsCss, rootCss, canon };
}

/* ---------- глобальные проверки: A3, B6, D3, D4 ---------- */
async function globalChecks(P, out) {
  for (const f of P.styleFiles) {
    if (CSS_NOT_IN_BUNDLE.includes(base(f))) continue;
    const imp = 'url("' + f + '")';
    const miss = [];
    if (!P.dsCss.includes(imp) && !P.dsCss.includes("url('" + f + "')")) miss.push('ds.css');
    if (!P.rootCss.includes(imp) && !P.rootCss.includes("url('" + f + "')")) miss.push('styles.css');
    if (miss.length) out.push(['BLOCKER', 'A3', f + ' — нет @import в ' + miss.join(' и ')]);
  }
  const react = P.list.filter((f) => /\.(jsx|tsx|d\.ts)$/.test(f) && !/^_ds_/.test(f));
  if (react.length) out.push(['BLOCKER', 'B6', 'React-файлы в ванильной ДС: ' + react.slice(0, 5).join(', ')]);

  /* B7 — незаскоупленный ARIA-состояние-селектор в styles/*.css: топ-уровневая ветка
     селектора (до `{`, разбитая по запятым верхнего уровня) начинается прямо с `:is(`/
     `[aria-...]` без класса-компонента перед ней — значит матчит ЛЮБОЙ элемент с этим
     атрибутом на странице. Через общий ds.css это протекает на другие компоненты с тем
     же ARIA-паттерном (инцидент Entity → Tab, 14.08.2026: `:is(.entity--selected,
     [aria-selected="true"])` без `.entity` перед `:is()` красило выбранный Tab в фон
     Entity). Правильно — класс-скоуп ПЕРЕД `:is(`/атрибутом: `.entity:is(…)`. */
  for (const f of P.styleFiles) {
    const css = P.src.get(f) || (await readFile(f).catch(() => ''));
    for (const sel of all(/([^{}]+)\{/g, css)) {
      const branches = splitTopLevel(sel);
      for (const br of branches) {
        const t = br.trim();
        if (/^\[aria-(selected|current|checked|pressed|expanded)="true"\]/.test(t)
            || /^:is\([^)]*\[aria-(selected|current|checked|pressed|expanded)="true"\]/.test(t)) {
          out.push(['BLOCKER', 'B7', f + ': "' + t.slice(0, 80) + '" — топ-ветка без класса-скоупа перед :is()/атрибутом, протечёт на любой другой компонент с тем же ARIA-атрибутом']);
        }
      }
    }
  }

  /* B8 — усечение, которое не сработает: подпись компонента усекается многоточием
     (`.x__label { text-overflow: ellipsis }`), а сам компонент — inline-flex-строка без
     `min-width: 0`. Автоминимум flex-элемента равен min-content содержимого, поэтому в
     чужой flex-строке такой компонент НЕ сжимается: он вылезает за границу контейнера, а
     непрозрачный фон соседа обрезает подпись без многоточия — усечение выглядит как
     поломка вёрстки (инцидент Chip в ячейке реестра ДИД, 04.09.2026). Компонент обязан
     высказаться явно: либо сжимается (`min-width: 0`), либо не сжимается намеренно
     (`flex: none` / `flex-shrink: 0` — как Avatar), либо стоит в SHRINK_OK с причиной. */
  for (const f of P.styleFiles) {
    const css = (P.src && P.src.get(f)) || (await readFile(f).catch(() => ''));
    const rules = [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      .map((m) => ({ sel: m[1].trim(), decl: m[2] }));
    const truncated = new Set();
    for (const r of rules) {
      if (!/text-overflow\s*:\s*ellipsis/.test(r.decl)) continue;
      for (const c of r.sel.match(/\.[-\w]+/g) || []) truncated.add(c.slice(1));
    }
    const blockDecl = new Map();
    for (const r of rules) {
      const m = r.sel.match(/^\.([-\w]+)$/);
      if (m) blockDecl.set(m[1], (blockDecl.get(m[1]) || '') + r.decl);
    }
    for (const t of truncated) {
      if (!t.includes('__')) continue;                       // усечение самого блока — не про сжатие
      const block = t.split('__')[0];
      if (SHRINK_OK[block]) continue;
      const d = blockDecl.get(block);
      if (!d || !/display\s*:\s*inline-flex/.test(d)) continue;
      if (/flex-direction\s*:\s*column/.test(d)) continue;    // колонка усекает по своей ширине
      if (/min-width\s*:\s*0(px)?\s*[;}]/.test(d)) continue;  // сжимается — высказался
      if (/flex\s*:\s*none|flex-shrink\s*:\s*0/.test(d)) continue; // не сжимается намеренно
      out.push(['WARN', 'B8', f + ': .' + block + ' — inline-flex без min-width:0, а внутри усечение .' + t
        + '; в чужой flex-строке компонент не сожмётся и подпись обрежется без многоточия — добавить min-width:0, либо flex:none, либо строку в SHRINK_OK с причиной']);
    }
  }

  /* B11 — компонент, объявивший display, но не объявивший `[hidden]`.
     Браузерное `[hidden] { display: none }` имеет специфичность (0,0,0) и живёт в
     UA-стиле, то есть подключается РАНЬШЕ любого CSS ДС. Правило компонента
     `.x { display: flex }` имеет ту же весовую категорию по важности, но большую
     специфичность (0,1,0) — и побеждает. Итог: атрибут `hidden` на компоненте не
     работает вовсе, причём молча: разметка выглядит правильной, скрипт выставляет
     атрибут, а элемент виден.
     Этот класс дефекта чинили поштучно шесть раз — Modal 1.005 (.modal-scrim),
     TableCell 2.015 (.tbl__row), Tab 1.010 (.tab__badge), EmptyState 1.002 (.es),
     InputText 1.010 (.inp__act), Chip 1.015 (.chip) — каждый раз по факту поломки
     на живом экране. Отличить статикой «этот класс реально переключают атрибутом»
     от «не переключают» нельзя: элемент почти всегда получают через переменную или
     чужую функцию, а не селектором в точке присваивания `.hidden`. Поэтому правило
     не ищет виновных, а закрывает саму возможность (доктрина ds-rules §9 «что нельзя
     измерить — делаем структурно невозможным»): корень компонента, задающий display,
     обязан рядом объявить `.x[hidden] { display: none }`.
     Проверяются только КОРНИ (класс без `__` и `--`) и только CSS компонентов —
     хром документации (CSS_NOT_IN_BUNDLE) не в счёт.
     Заведено 05.09.2026 как INFO с 80 находками в 44 файлах; в тот же день список
     разобран целиком (пары проставлены всем корням), и правило поднято до WARN —
     теперь оно охраняет достигнутый ноль, а не описывает долг. Новый компонент,
     объявивший display без пары, попадёт в отчёт сразу. */
  {
    const pairedAll = new Set();
    const rootsByFile = new Map();
    for (const f of P.styleFiles) {
      if (CSS_NOT_IN_BUNDLE.includes(base(f))) continue;
      const css = (P.src && P.src.get(f)) || (await readFile(f).catch(() => ''));
      const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
      for (const m of clean.matchAll(/\.([-\w]+)\[hidden\]/g)) pairedAll.add(m[1]);
      const roots = new Map();
      for (const m of clean.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        const sel = m[1].trim().match(/^\.([-\w]+)$/);
        if (!sel) continue;
        const cls = sel[1];
        if (cls.includes('__') || cls.includes('--')) continue;   // корень, не элемент и не модификатор
        if (HIDDEN_PAIR_OK[cls]) continue;
        const d = m[2].match(/display\s*:\s*([-\w]+)/);
        if (!d || /^(none|contents)$/.test(d[1])) continue;
        roots.set(cls, d[1]);
      }
      if (roots.size) rootsByFile.set(f, roots);
    }
    for (const [f, roots] of rootsByFile) {
      const miss = [...roots].filter(([c]) => !pairedAll.has(c));
      if (!miss.length) continue;
      out.push(['WARN', 'B11', f + ': ' + miss.map(([c, d]) => '.' + c + ' (display:' + d + ')').join(', ')
        + ' — нет парного [hidden] { display: none }, атрибут hidden на компоненте молча не сработает']);
    }
  }

  /* B9 — обёртка рантайма меняет раскладку чужой разметки. Рантаймы ДС вставляют свои
     обёртки ВОКРУГ уже свёрстанного элемента (`X.parentNode.insertBefore(W, X)`), поэтому
     обёртка обязана быть раскладочно прозрачной: `max-width: 100%`, а для flex/inline-flex
     ещё и `min-width: 0`. Иначе разметка, написанная правильно, ломается от одного факта
     подключения рантайма — и чинить её на экране бесполезно (инцидент .tip-anchor: якорь
     тултипа отключал усечение у ячейки таблицы, 04.09.2026). */
  {
    const runtimes = P.list.filter((f) => /^scripts\/(ds-|tbl-|input-kit)/.test(f) && f.endsWith('.js'));
    const srcs = await Promise.all(runtimes.map((f) => readFile(f).catch(() => '')));
    const cssAll = (await Promise.all(P.styleFiles.map((f) => readFile(f).catch(() => '')))).join('\n');
    const cssRules = [...cssAll.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      .map((m) => ({ sel: m[1].trim(), decl: m[2] }));
    for (let i = 0; i < runtimes.length; i++) {
      const js = srcs[i];
      for (const m of [...js.matchAll(RUNTIME_WRAPPERS)]) {
        const [, target, wrapper, before] = m;
        if (target !== before) continue;                     // не обёртка, а вставка соседа
        const clsRe = new RegExp(wrapper + "\\.className\\s*=\\s*'([\\w-]+)");
        const cls = (js.match(clsRe) || [])[1];
        if (!cls) continue;
        const decl = cssRules.filter((r) => r.sel === '.' + cls).map((r) => r.decl).join('');
        if (!decl) continue;
        const flex = /display\s*:\s*(inline-)?flex/.test(decl);
        const miss = [];
        if (!/max-width\s*:\s*100%/.test(decl)) miss.push('max-width: 100%');
        if (flex && !/min-width\s*:\s*0(px)?\s*[;}]/.test(decl)) miss.push('min-width: 0');
        if (miss.length) out.push(['WARN', 'B9', runtimes[i] + ' оборачивает чужой элемент в .' + cls
          + ', а обёртка не раскладочно прозрачна — нет ' + miss.join(' и ')
          + '; подключение рантайма изменит раскладку правильной разметки']);
      }
    }
  }

  /* B10 — рантайм считает геометрию на событии `scroll`. Скролл применяет компоновщик
     браузера, и новый offset попадает в кадр РАНЬШЕ, чем выполнится JS-обработчик:
     любая правка geometry-свойства (`transform`, `left`/`right`/`top`/`bottom`) из
     scroll-хендлера отстаёт минимум на кадр. Элемент каждый кадр уезжает вместе с
     контентом и возвращается следующим. На Windows дискретное колесо это скрывает —
     коррекция успевает в паузу между щелчками; на трекпаде macOS (непрерывные дельты
     + инерционный докрут) ошибка показывается на каждом кадре подряд и читается как
     дрожание (инцидент tbl-pin.js, 04.09.2026: закреплённые колонки таблицы дрожали
     на MacBook, на Windows дефект был невидим — то есть уезжал к пользователю).
     Удержание элемента при скролле делается CSS-ом (`position: sticky`), а рантайм
     считает только инсеты — по событию изменения состава, не по скроллу.
     Ищем записи в теле scroll-хендлера и в локальных функциях, до которых он
     дотягивается за два вызова (`scroll → requestAnimationFrame(…) → apply()` —
     ровно тот случай). Легальные исключения — SCROLL_GEOMETRY_OK, ключ «файл:функция». */
  {
    const GEO = /\.style\.(transform|left|right|top|bottom)\s*=[^=]/;
    const GEO_SET = /\.style\.setProperty\(\s*['"](transform|left|right|top|bottom)['"]/;
    const scripts = P.list.filter((f) => /^scripts\/.+\.js$/.test(f) && !/ds-lint/.test(base(f)));
    const srcs = await Promise.all(scripts.map((f) => P.src.get(f) || readFile(f).catch(() => '')));
    for (let i = 0; i < scripts.length; i++) {
      const js = srcs[i], name = base(scripts[i]);
      const fns = localFns(js);
      const queue = [];
      for (const m of [...js.matchAll(/addEventListener\(\s*['"]scroll['"]\s*,\s*/g),
                       ...js.matchAll(/\.onscroll\s*=\s*/g)]) {
        const at = m.index + m[0].length;
        const id = js.slice(at, at + 60).match(/^([A-Za-z_$][\w$]*)\s*[,)]/);
        if (id) { if (fns.has(id[1])) queue.push([id[1], fns.get(id[1]), 0]); }
        else queue.push(['<inline>', braceBody(js, at, 60), 0]);
      }
      const seen = new Set();
      while (queue.length) {
        const [fn, body, depth] = queue.shift();
        if (!body || seen.has(fn)) continue;
        seen.add(fn);
        const g = body.match(GEO) || body.match(GEO_SET);
        if (g && !SCROLL_GEOMETRY_OK[name + ':' + fn]) {
          /* WARN, а не BLOCKER: по «Как расширять» (п.4) новое правило первый цикл
             живёт как WARN и повышается после подтверждения на реальных страницах */
          out.push(['WARN', 'B10', scripts[i] + ': ' + fn + '() пишет .style.' + g[1]
            + ' по событию scroll — коррекция отстаёт на кадр от компоновщика (на трекпаде macOS это дрожание, на колесе Windows незаметно);'
            + ' удержание при скролле — position: sticky, рантайм считает только инсеты по изменению состава']);
        }
        if (depth < 2) for (const c of body.matchAll(/([A-Za-z_$][\w$]*)\s*\(/g)) {
          if (fns.has(c[1]) && !seen.has(c[1])) queue.push([c[1], fns.get(c[1]), depth + 1]);
        }
      }
    }
  }

  /* A6 — index.html тянет styles/* поштучно: если на витрине есть разметка
     компонента, его CSS обязан быть подключён. Инцидент 07.08.2026: карточка
     ProgressBar была пустой — .pbar не имел ни одного правила. */
  {
    const linked = new Set(all(RX.link, P.index).map((h) => base(h)));
    const own0 = new Set();
    for (const st of all(RX.styleBlock, P.index, 0)) for (const c of all(/\.(-?[a-zA-Z][a-zA-Z0-9_-]*)/g, st.replace(/\{[^{}]*\}/g, '{}'))) own0.add(c);
    const need = new Map();
    for (const attr of all(RX.cls, P.index)) {
      if (/['`+]|\$\{/.test(attr)) continue;
      for (const c of attr.split(/\s+/)) {
        const own = P.owner.get(c);
        if (own0.has(c)) continue;
        if (own && /^styles\//.test(own) && !linked.has(base(own))) {
          if (!need.has(own)) need.set(own, c);
        }
      }
    }
    for (const [f, c] of need) out.push(['BLOCKER', 'A6', 'index.html: есть разметка .' + c + ', но ' + f + ' не подключён — компонент рендерится без стилей']);
  }
  // D3/D4 — секции index.html
  const parts = P.index.split(/<div class="sec-head">/).slice(1);
  for (const part of parts) {
    const head = part.slice(0, 300);
    const title = (head.match(/<h2>([^<]*)<\/h2>/) || [, '?'])[1];
    const declared = parseInt((head.match(/class="n">\s*(\d+)/) || [, ''])[1], 10);
    const body = part.split('</section>')[0];
    const titles = all(/class="card__title"[^>]*>([^<]*)/g, body).map((s) => strip(s));
    const cards = (body.match(/class="card"/g) || []).length;
    const jsGrid = /class="grid" id="/.test(body) && cards === 0;
    if (!isNaN(declared) && declared !== cards && !jsGrid) out.push(['BLOCKER', 'D3', 'index.html: «' + title + '» → карточек ' + cards + ', счётчик говорит ' + declared]);
    const sorted = [...titles].sort((a, b) => a.localeCompare(b, 'ru'));
    if (titles.join('|') !== sorted.join('|')) {
      const bad = titles.find((t, i) => t !== sorted[i]);
      out.push(['WARN', 'D4', 'index.html: «' + title + '» — порядок не алфавитный: «' + bad + '» стоит ' + (titles.indexOf(bad) + 1) + '-м, ожидается ' + (sorted.indexOf(bad) + 1) + '-м']);
    }
  }
  // D4 — порядок в ds-nav.js по группам
  const chunks = P.nav.split(/(?:cat|group):\s*'/).slice(1);
  for (const ch of chunks) {
    const gname = ch.slice(0, ch.indexOf("'"));
    const body = ch.split(/(?:cat|group):\s*'/)[0];
    const labels = all(/label:\s*'([^']+)'[^}]*\}/g, body).filter((l) => !/^\d/.test(l)); // экраны нумерованы — порядок по номеру
    const soon = new Set(all(/label:\s*'([^']+)'[^}]*soon:\s*true/g, body));
    const real = labels.filter((l) => !soon.has(l));
    if (real.length < 2) continue;
    const sorted = [...real].sort((a, b) => a.localeCompare(b, 'ru'));
    if (real.join('|') !== sorted.join('|')) out.push(['WARN', 'D4', 'ds-nav.js: «' + gname + '» — порядок не алфавитный']);
  }
}

/* ---------- группа P: гейт парности «документация = код» ----------
   P1 — класс из копируемого сниппета (specs/_cheatsheet.md, specs/<Имя>.md)
        не существует ни в одном styles/*.css: документация обещает то, чего нет.
   P2 — класс в разметке экрана не существует в CSS и не объявлен в <style>
        самого экрана: класс выдуман при сборке.
   P3 — класс из код-панели витрины (<code> внутри scripts/*.page.js) отсутствует
        в CSS: страница предлагает скопировать несуществующий класс. */
const PARITY_SKIP = /^(is-|js-|has-)/;
// стили этих рантаймов живут в shadow DOM самого скрипта, а не в styles/*.css
const SHADOW_RUNTIMES = /image-slot\.js$/;
function parityIgnore(c) { return CLASS_IGNORE.has(c) || PARITY_SKIP.test(c) || /[^a-z0-9_-]/i.test(c); }
// JS-хуки: класс без собственных правил, но по нему работает рантайм — не опечатка
// документации. Снятие такого класса ломает компонент (инцидент tile__toggle).
function collectHooks(src, into) {
  for (const c of all(/closest\(\s*['"]\.([\w-]+)/g, src)) into.add(c);
  for (const c of all(/querySelector(?:All)?\(\s*['"][^'"]*\.([\w-]+)/g, src)) into.add(c);
  for (const c of all(/classList\.(?:add|remove|toggle|contains)\(\s*['"]([\w-]+)/g, src)) into.add(c);
  return into;
}
function fenceClasses(md) {
  const out = [];
  for (const f of all(/```[a-z]*\n([\s\S]*?)```/g, md)) for (const attr of all(RX.cls, f)) out.push(...attr.split(/\s+/));
  return uniq(out.filter(Boolean));
}
async function parityChecks(P, out) {
  const specs = P.list.filter((f) => /^specs\/[^/]+\.md$/.test(f) && !/_TEMPLATE/.test(f));
  const screens = P.list.filter((f) => /^pages\/screens\/.+\.html$/.test(f));
  const pageJs = P.list.filter((f) => /^scripts\/.+\.page\.js$/.test(f));
  const runtimeJs = P.list.filter((f) => /^scripts\/.+\.js$/.test(f) && !/icons-data|ds-lint/.test(f));
  const srcs = await Promise.all([...specs, ...screens, ...runtimeJs].map((f) => readFile(f).catch(() => '')));
  const src = new Map([...specs, ...screens, ...runtimeJs].map((f, i) => [f, srcs[i]]));
  const hooks = new Set();
  const localDoc = new Set(); // локальные классы витрин из инлайн-<style> страниц
  const written = new Set(); // классы, которые рантайм ДС реально пишет в разметку
  for (const f of runtimeJs) {
    const s = src.get(f);
    collectHooks(s, hooks);
    for (const a of [...all(RX.cls, s), ...all(RX.classNameAssign, s)]) for (const c of a.split(/\s+/)) if (c) written.add(c);
  }
  for (const f of screens) collectHooks(src.get(f), hooks);
  // локальная раскладка экрана живёт в его же <style> — для скрипта этого экрана
  // (<имя>.screen.js) такой класс законен, P4 не должен считать его сиротой
  for (const f of screens) for (const st of all(RX.styleBlock, src.get(f) || '', 0)) for (const c of all(/\.(-?[a-zA-Z][a-zA-Z0-9_-]*)/g, st.replace(/\{[^{}]*\}/g, '{}'))) localDoc.add(c);
  // хуки из inline-<script> страниц — читаем только страницы из поля page: спек
  const pagesOfSpecs = uniq(specs.map((f) => (src.get(f).match(/^page:\s*(\S+)/m) || [])[1]).filter(Boolean));
  const pageSrcs = await Promise.all(pagesOfSpecs.map((f) => readFile(f).catch(() => '')));
  for (let i = 0; i < pagesOfSpecs.length; i++) {
    src.set(pagesOfSpecs[i], pageSrcs[i]);
    for (const st of all(/<script[\s\S]*?<\/script>/gi, pageSrcs[i], 0)) collectHooks(st, hooks);
    for (const st of all(RX.styleBlock, pageSrcs[i], 0)) for (const c of all(/\.(-?[a-zA-Z][a-zA-Z0-9_-]*)/g, st.replace(/\{[^{}]*\}/g, '{}'))) localDoc.add(c);
  }
  const idx = await readFile('index.html').catch(() => '');
  src.set('index.html', idx);
  for (const st of all(RX.styleBlock, idx, 0)) for (const c of all(/\.(-?[a-zA-Z][a-zA-Z0-9_-]*)/g, st.replace(/\{[^{}]*\}/g, '{}'))) localDoc.add(c);
  const known = (c) => P.cssClasses.has(c) || hooks.has(c) || written.has(c);
  const knownStrict = (c) => P.cssClasses.has(c) || hooks.has(c);
  // корневой BEM-блок без собственных правил, но с описанными элементами (.tfm → .tfm__sec):
  // имя блока задаёт пространство имён, отдельного правила ему не нужно
  const cssList = [...P.cssClasses];
  const isBemRoot = (c) => !/__|--/.test(c) && cssList.some((k) => k.startsWith(c + '__') || k.startsWith(c + '--'));
  for (const f of specs) {
    const bad = fenceClasses(src.get(f)).filter((c) => !parityIgnore(c) && !known(c));
    for (const c of bad) out.push(['BLOCKER', 'P1', f + ': сниппет обещает .' + c + ' — в styles/*.css такого класса нет']);
  }
  for (const f of screens) {
    const html = src.get(f);
    const local = new Set();
    for (const st of all(RX.styleBlock, html, 0)) for (const c of all(/\.(-?[a-zA-Z][a-zA-Z0-9_-]*)/g, st.replace(/\{[^{}]*\}/g, '{}'))) local.add(c);
    const used = uniq([...all(RX.cls, html), ...all(RX.classNameAssign, html)].filter((a) => !/['`+]|\$\{/.test(a)).flatMap((a) => a.split(/\s+/)).filter(Boolean));
    const bad = used.filter((c) => !parityIgnore(c) && !known(c) && !local.has(c));
    for (const c of bad) out.push(['WARN', 'P2', f + ': .' + c + ' не объявлен ни в ДС, ни в <style> экрана']);
  }
  // P5 — класс в живой разметке страницы документации, у которого нет правил ни в ДС,
  // ни в её собственном <style>: блок рендерится без стиля и выглядит сломанным
  // (.readout/.lbl/.pg__stage на Layout.html, 20.08.2026). Сниппеты <pre>/<code> —
  // документация, не живая разметка, поэтому вырезаются.
  for (const f of pagesOfSpecs.concat(['index.html'])) {
    const h = src.get(f) || '';
    if (!h) continue;
    const local = new Set();
    for (const st of all(RX.styleBlock, h, 0)) for (const c of all(/\.(-?[a-zA-Z][a-zA-Z0-9_-]*)/g, st.replace(/\{[^{}]*\}/g, '{}'))) local.add(c);
    const live = h.replace(RX.styleBlock, '').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<pre[\s\S]*?<\/pre>/gi, '').replace(/<code[\s\S]*?<\/code>/gi, '');
    const used = uniq(all(RX.cls, live).filter((a) => !/['`+]|\$\{/.test(a)).flatMap((a) => a.split(/\s+/)).filter(Boolean));
    for (const c of used.filter((c) => !parityIgnore(c) && !known(c) && !local.has(c)))
      out.push(['WARN', 'P5', f + ': .' + c + ' в разметке страницы без правил в CSS — блок отрендерится без стиля']);
  }
  // P3 — код-панели витрин: то, что страница предлагает скопировать, тоже документация.
  // Внутри <code>…</code> в исходнике могут быть куски JS (конкатенация,
  // cls.join('.')) — смотрим только на содержимое строковых литералов.
  const literalsOnly = (span) => span.split(/['"`]/).filter((_, i) => i % 2 === 0).join(' ');
  // Класс-цепочка (.inp.inp--m) — только если перед ней не идентификатор:
  // отсекает обращения к свойствам JS (cls.join, state.tone), но не цепочки классов.
  const RX_TRUNC = /(?:class="([^"]*)"|className\s*=\s*'([^']*)')\s*\+/g;
  const RX_CHAIN = /(?:^|[^\w$)\].])((?:\.[a-zA-Z][a-zA-Z0-9_-]*)+)/g;
  // код-панели живут и в *.page.js, и в inline-<script> страниц, и в index.html
  // P4 — класс, который рантайм витрины реально вешает (className = '…'), но правил в CSS нет
  for (const f of [...runtimeJs, ...pagesOfSpecs, 'index.html']) {
    if (SHADOW_RUNTIMES.test(f)) continue;
    const s4 = src.get(f) || '';
    /* `<script type="text/plain">` — НЕ рантайм, а статичный образец кода для
       вкладки «Код». Класс оттуда никто не вешает: его предлагают скопировать.
       Раньше блок читался как рантайм, и P4 сообщал «рантайм вешает
       .demo-panel» про строку из документации — тот же класс дефекта, что
       урок Л53 (во вход правила попало содержимое, кодом не являющееся).
       Находка не теряется: она уходит под P3 «код-панель предлагает». */
    const blocks4 = /\.js$/.test(f) ? [s4] : all(/<script[\s\S]*?<\/script>/gi, s4, 0);
    const isPlain = (b) => /<script[^>]*type\s*=\s*["']text\/plain["']/i.test(b);
    const scope4 = blocks4.filter((b) => !isPlain(b)).join('\n');
    const scopeDocs = blocks4.filter(isPlain).join('\n');
    const classTokens = (scope) => {
      const trunc = new Set();
      for (const m of scope.matchAll(RX_TRUNC)) { const v = (m[1] ?? m[2] ?? '').trim(); if (v) trunc.add(v.split(/\s+/).pop()); }
      const isTrunc = (c) => trunc.has(c) && [...P.cssClasses].some((k) => k !== c && k.startsWith(c));
      return uniq([...all(RX.classNameAssign, scope), ...all(RX.cls, scope)].filter((a) => !/['"`+]|\$\{/.test(a)).flatMap((a) => a.split(/\s+/)).filter(Boolean))
        .filter((c) => !isTrunc(c))
        .filter((c) => !parityIgnore(c) && !knownStrict(c) && !localDoc.has(c) && !isBemRoot(c) && !/-$/.test(c))
        .filter((c) => !(/^(card__|file$)/.test(c) && f === 'index.html'));
    };
    for (const c of classTokens(scope4)) {
      out.push(['BLOCKER', 'P4', f + ": рантайм вешает ." + c + ' — в styles/*.css такого класса нет']);
    }
    for (const c of classTokens(scopeDocs)) {
      out.push(['BLOCKER', 'P3', f + ': код-панель предлагает .' + c + ' — в styles/*.css такого класса нет']);
    }
  }
  for (const f of [...pageJs, ...pagesOfSpecs, 'index.html']) {
    let s = src.get(f);
    if (s === undefined) { s = await readFile(f).catch(() => ''); src.set(f, s); }
    const scope = /\.js$/.test(f) ? s : all(/<script[\s\S]*?<\/script>/gi, s, 0).join('\n');
    const toks = uniq(all(/<code>([\s\S]*?)<\/code>/g, scope)
      .flatMap((sn) => all(RX_CHAIN, literalsOnly(sn)))
      .flatMap((chain) => chain.split('.').filter(Boolean)));
    for (const c of toks.filter((c) => !parityIgnore(c) && !known(c))) {
      out.push(['BLOCKER', 'P3', f + ': код-панель предлагает .' + c + ' — в styles/*.css такого класса нет']);
    }
  }
}

/* ---------- проверки страницы ---------- */
/* Сбалансированный кусок разметки от открывающего тега на позиции `at` до его
   пары. Нужен там, где важна ВЛОЖЕННОСТЬ, а не совпадение строки: «класс есть
   на странице» и «класс есть в этом узле» — разные утверждения, и первое
   вместо второго дало 20 ложных замечаний R2. */
function tagSlice(html, at) {
  const tag = (html.slice(at).match(/^<([a-z]+)/) || [])[1];
  if (!tag) return '';
  const rx = new RegExp('</?' + tag + '\\b', 'gi');
  rx.lastIndex = at;
  let depth = 0, m;
  while ((m = rx.exec(html))) {
    if (m[0][1] === '/') { depth--; if (depth === 0) return html.slice(at, m.index); }
    else depth++;
  }
  return html.slice(at);
}

async function pageChecks(p, P, opts, out) {
  const html = P.src.get(p);
  const dir = p.split('/').slice(0, -1).join('/');
  const name = base(p).replace(/\.html$/, '');
  const inContract = CONTRACT_DIRS.some((d) => p.startsWith(d));
  const inRegistry = REGISTRY_DIRS.some((d) => p.startsWith(d));
  /* Экран — это и `pages/screens/`, и любой файл ВНЕ дерева ДС: экраны живут
     в `Projects/**` и приходят сюда путём `../Projects/test/Имя.html`. Без
     второго условия к экрану применялся контракт docs-страницы, и любой экран
     получал ложные C1/C2 («нет @dsCard», «нет Версия/Обновлено»). */
  const isScreen = p.startsWith('pages/screens/') || p.startsWith('../');
  /* Комментарий — не разметка. Вырезается вместе со <style> и <script>: текст
     комментария неотличим от разметки для строкового правила, и страница,
     ОБЪЯСНЯЮЩАЯ в комментарии «здесь нужен data-tabs», этим объяснением
     правило и глушила. Поймано на фикстурах: F3.bad и A6.bad не срабатывали,
     потому что их собственное пояснение содержало искомые `data-tabs` и
     `<main class="page"`. Сенсор экранов вырезает комментарии с 06.09.2026 по
     той же причине; здесь асимметрия дожила до первого корпуса фикстур.
     `html` остаётся сырым: C1 читает первую строку — саму карточку @dsCard. */
  const markup = html
    .replace(RX.styleBlock, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');
  const styleSrc = (html.match(RX.styleBlock) || []).join('\n');
  const links = all(RX.link, html);
  const scripts = all(RX.src, html);
  const linkNames = links.map(base);
  const hasBundle = linkNames.includes('ds.css') || linkNames.includes('styles.css');
  const say = (lvl, id, msg) => {
    // на экранах контракт разделов и реестры не применяются, таблица-мокап — замечание
    if (isScreen && /^[CD]/.test(id)) return;
    if (isScreen && lvl === 'BLOCKER' && id === 'B5') lvl = 'WARN';
    out.push([lvl, id, msg]);
  };

  /* A1 — скрипт без парного CSS */
  for (const [js, css] of JS_CSS_PAIRS) {
    if (scripts.some((s) => base(s) === js) && !linkNames.includes(css) && !hasBundle) say('WARN', 'A1', js + ' подключён без ' + css);
  }
  /* A2 — компонентный CSS не подключён.
     Классы берутся и из разметки, и из парного *.page.js: `markup` вырезает
     <script>, поэтому разметка, которую страница рисует своим скриптом
     (демо-модалки, конструктор), правилу была не видна — так прожил урок Л41
     (`.dvd` в `columnsModalHtml` при неподключённом divider.css).
     Пару берём из <script src>, а НЕ из имени страницы: транслитерация
     неверна (DatePicker.html → datepicker.page.js, RiskMetric → riskmetric).
     Токены с ${…} из шаблонных строк отбрасываем — это не классы. */
  if (!hasBundle) {
    const local = new Set(all(/\.(-?[a-zA-Z][a-zA-Z0-9_-]*)/g, styleSrc.replace(/\{[^{}]*\}/g, '{}')));
    const pageJs = uniq(scripts.map(base).filter((f) => /\.page\.js$/.test(f)));
    const jsSrc = (await Promise.all(pageJs.map((f) => readFile('scripts/' + f).catch(() => '')))).join('\n');
    const used = uniq([...all(RX.cls, markup), ...all(RX.cls, jsSrc)]
      .join(' ').split(/\s+/).filter((c) => c && !/[${}]/.test(c)));
    const missing = new Map();
    for (const c of used) {
      if (local.has(c) || CLASS_IGNORE.has(c)) continue;
      const own = P.owner.get(c);
      if (own && !CSS_NOT_IN_BUNDLE.includes(base(own)) && !linkNames.includes(base(own))) {
        const key = own + '|' + (/__|--/.test(c) ? 'WARN' : 'BLOCKER');
        if (!missing.has(key)) missing.set(key, []);
        if (missing.get(key).length < 3) missing.get(key).push('.' + c);
      }
    }
    for (const [key, cls] of missing) {
      const [f, lvl] = key.split('|');
      say(lvl, 'A2', 'классы ' + cls.join(', ') + ' есть, а <link> на ' + f + ' нет');
    }
  }
  /* A6 — контейнер страницы: ds-nav/ds-toc монтируются только в <main class="page"> */
  if (!isScreen && !/<main class="page(?:\s|")/.test(markup) && scripts.some((s) => /ds-(nav|toc)\.js$/.test(s))) say('BLOCKER', 'A6', 'нет <main class="page"> — ds-nav/ds-toc молча не смонтируются');
  /* A4 — иконки без своих скриптов (ds.js на экранах закрывает оба) */
  if (/data-icon="[^"…\s]/.test(markup) && !scripts.some((x) => base(x) === 'ds.js')) {
    const need = ['icons-data.js', 'ds-icons.js'].filter((s) => !scripts.some((x) => base(x) === s));
    if (need.length) say('BLOCKER', 'A4', '<i data-icon> есть, не подключено: ' + need.join(', '));
  }
  /* A7 — экран мимо единой точки входа ds.js (K0, RulesAudit W0) */
  if (isScreen) {
    const dsJsCount = scripts.filter((s) => base(s) === 'ds.js').length;
    const direct = scripts.filter((s) => DS_JS_BUNDLES.includes(base(s)));
    if (dsJsCount === 0) say('BLOCKER', 'A7', 'экран без <script src="ds.js"> — рантаймы подключаются вручную и легко забываются');
    if (dsJsCount > 1) say('WARN', 'A7', 'ds.js подключён ' + dsJsCount + ' раза');
    if (direct.length) say('BLOCKER', 'A7', 'рантайм(ы) подключены мимо ds.js: ' + uniq(direct.map(base)).join(', '));
  }
  /* ---------- R* — каскад раскатки docs-split ----------
     Пункты К1/К2/К6/К10 чек-листа screen-review живут здесь, а не в сенсоре
     экранов: их предмет — страница документации, а сенсор такую страницу не
     принимает вовсе (на ней первым делом падают Б1 и Б5 — «нет каркаса
     экрана»), и до К-проверок дело не доходило. Правило, до входа которого
     инструмент не добирается, закрытием не является.
     Буква R («раскатка») выбрана свободной: A/B/C/D/F/G/L/P заняты здесь,
     латинская K принадлежит ряду геометрии сенсора. */
  if (!isScreen && /class="page ds-split"/.test(markup)) {
    /* R1 (К1) — `.splitpane--app` переводит `.splitpane__a/b` в display:block
       (splitter.css) и рвёт собственную flex-раскладку панелей: пропадает
       скролл, центрирование и якоря. Если страница задаёт панелям flex сама,
       модификатор либо снимается, либо перебивается !important. */
    if (/\bsplitpane--app\b/.test(markup)) {
      const panelFlex = [...styleSrc.matchAll(/\.splitpane__[ab][^{}]*\{([^{}]*)\}/g)]
        .filter((m) => /display\s*:\s*flex/.test(m[1]));
      const unguarded = panelFlex.filter((m) => !/display\s*:\s*flex\s*!important/.test(m[1]));
      if (unguarded.length) {
        say('BLOCKER', 'R1', '.splitpane--app вместе с собственной flex-раскладкой панелей: splitter.css переводит .splitpane__a/b в display:block и перебивает страницу — нужен display:flex!important либо снять модификатор');
      }
    }

    /* R2 (К2) — сегмент-контрол в колонке конструктора растягивается
       `align-items:stretch` по умолчанию (`.ctl-col` — flex-колонка без
       `align-items`), и серый трек уходит за сегменты. Лечится
       `align-self:flex-start` у самого контрола.

       Смотрим ТОЛЬКО внутрь `#pg-controls` — исходного контейнера контролов,
       из которого `docs-split.js` собирает колонку. Первая версия искала
       `segctrl` по всей странице и дала 20 замечаний там, где сегмент-контрол
       стоит в демо документируемого компонента, а не в конструкторе:
       «класс встречается на странице» и «класс стоит в этом узле» — разные
       утверждения (вход правила не был назван, класс дефектов Л48). */
    const pgAt = markup.search(/<[a-z]+[^>]*id="pg-controls"/);
    if (pgAt >= 0) {
      const controls = tagSlice(markup, pgAt);
      if (/\bsegctrl\b/.test(controls) && !/segctrl[^{}]*\{[^{}]*align-self\s*:\s*flex-start/.test(styleSrc)) {
        say('WARN', 'R2', 'segctrl внутри #pg-controls без align-self:flex-start — в колонке .ctl-col трек растянется на всю ширину и уйдёт за сегменты');
      }
    }

    /* R3 (К6) сознательно НЕ реализовано. Пункт чек-листа звучит как «порядок
       скриптов важен», но его условие — «если страничный скрипт читает
       состояние рантайма В МОМЕНТ СОБЫТИЯ». Порядок сам по себе дефектом не
       является: проверка «рантайм после page.js» дала 11 блокеров на рабочих
       страницах (там последним подключается `ds-nav.js`, к конструктору
       отношения не имеющий). Отличить «читает состояние рантайма» от «читает
       свой демо-DOM» статикой нельзя — `tab.page.js` ставит `aria-selected`
       своим же элементам. К6 помечен суждением в coverage.json. */

    /* R5 (К8) — подпись свитча статична и не меняется от положения. Свитч
       называет опцию действием в On-состоянии («Показывать проценты»); пара
       `{ on, off }` в словаре означает, что подпись переименовывается при
       выключении, и пользователь читает разные слова про один и тот же
       переключатель. Допустимы строка или `{ label, on? }`. */
    const dictSrc = (html.match(/DS_SPLIT_SWITCH_LABELS\s*=\s*\{[\s\S]*?\n\s*\}/) || [''])[0];
    if (dictSrc) {
      for (const entry of dictSrc.matchAll(/\{([^{}]*)\}/g)) {
        const body = entry[1];
        if (/(^|[,{\s])on\s*:/.test(body) && /(^|[,{\s])off\s*:/.test(body)) {
          say('BLOCKER', 'R5', 'DS_SPLIT_SWITCH_LABELS: запись { on, off } — подпись свитча меняется при переключении. Свитч называет опцию действием в On-состоянии; допустимы строка или { label, on? }');
          break;
        }
      }
    }

    /* R6 (К9) — свитч конструктора: (а) бинарный селект обязан нести подпись
       в `.lbl` — `docs-split.js` читает подпись только оттуда, и `.ds-label`
       даёт свитч без текста (урок NavTile); (б) самописная кнопка-тумблер
       `button.toggle` с `aria-pressed` вместо штатного `pg-toggle` (это R8:
       части (а) и (б) пункта независимы, и у каждой своя пара фикстур —
       один идентификатор на две части доказывал бы только одну).
       Смотрим внутрь `#pg-controls`: сегмент-контрол или тумблер в демо
       документируемого компонента — не предмет этого правила. */
    if (pgAt >= 0) {
      const controls = tagSlice(markup, pgAt);
      for (const ctl of controls.matchAll(/<div[^>]*class="[^"]*\bctl\b[^"]*"[^>]*>/g)) {
        const body = tagSlice(controls, ctl.index);
        const opts = [...body.matchAll(/<option\b/g)].length;
        if (opts !== 2) continue;                       // не бинарный селект — в свитч не превратится
        const lbl = body.match(/class="[^"]*\blbl\b[^"]*"[^>]*>([\s\S]*?)</);
        if (!lbl || !strip(lbl[1]).trim()) {
          say('BLOCKER', 'R6', 'бинарный селект в #pg-controls без непустой подписи в .lbl — docs-split.js читает подпись только из .lbl, свитч выйдет без текста');
          break;
        }
      }
      if (/<button[^>]*class="[^"]*\btoggle\b[^"]*"[^>]*aria-pressed/.test(controls)
          || /<button[^>]*aria-pressed[^>]*class="[^"]*\btoggle\b/.test(controls)) {
        say('BLOCKER', 'R8', 'самописная кнопка-тумблер button.toggle[aria-pressed] в #pg-controls — бинарная опция задаётся бинарным селектом, docs-split.js сам делает из него pg-toggle');
      }
    }

    /* R7 (К11) — групповой заголовок конструктора предшествует СВОИМ
       контролам. `docs-split.js` переносит прямых детей `#pg-controls` в
       колонку в исходном порядке, поэтому заголовок, за которым сразу идёт
       другой заголовок или ничего, встанет пустой стопкой вверху колонки
       (урок ReadOnlyField). */
    if (pgAt >= 0) {
      const controls = tagSlice(markup, pgAt);
      const heads = [...controls.matchAll(/<div[^>]*class="[^"]*\bpg__grouphead\b[^"]*"[^>]*>/g)];
      for (const h of heads) {
        const after = controls.slice(h.index + tagSlice(controls, h.index).length);
        const next = after.match(/<div[^>]*class="([^"]*)"/);
        if (!next || /\bpg__grouphead\b/.test(next[1])) {
          say('BLOCKER', 'R7', 'групповой заголовок .pg__grouphead без своих контролов следом — в колонке конструктора он встанет пустой стопкой вверху');
          break;
        }
      }
    }

    /* R4 (К10) — остатки flex-раскладки конструктора ДО docs-split: в колонке
       `.ctl-col` такие правила растягивают поля по высоте и дают огромные
       отступы (урок Л2, Pagination). Живые page-стили контролов остаются —
       ловим только связку «селектор конструктора + раскладочное свойство». */
    for (const rule of styleSrc.matchAll(/([^{}]*\b(?:pg__controls|pg__widthctl)\b[^{}]*)\{([^{}]*)\}/g)) {
      if (!/\bflex\b|\bflex-wrap\b|\bflex\s*:|\bgrid-template\b/.test(rule[2])) continue;
      say('WARN', 'R4', 'остаток старой раскладки конструктора в <style>: «' + rule[1].trim().slice(0, 60) + '» задаёт раскладку — при раскатке docs-split такие правила удаляются');
    }
  }

  /* B12 — поле ввода без размерного модификатора.

     Размер M перестал быть молчаливым дефолтом `.inp` и стал модификатором
     `.inp--m` (input.css, 06.09.2026): раньше класс, который разметка вешала
     руками, не делал ничего, спека объявляла пару M/S симметричной, а рантайм
     класс намеренно не ставил. После правки цена пропуска обратная: `.inp`
     без размера теряет высоту, паддинги, gap и шрифт — и это МОЛЧАЛИВО,
     потому что `height: var(--inp-h)` без значения даёт `height: auto`.

     Вход — разметка страницы И парный `*.page.js`: поля рисуют оба
     (`table-filter.page.js` собирает семь штук строками). Пара берётся из
     `<script src>`, а не из имени страницы — транслитерация неверна (Л41). */
  {
    const pageJsNames = uniq(scripts.map(base).filter((f) => /\.page\.js$/.test(f)));
    const pageJsSrc = (await Promise.all(pageJsNames.map((f) => readFile('scripts/' + f).catch(() => '')))).join('\n');
    const noSize = [];
    for (const m of (html + '\n' + pageJsSrc).matchAll(/class="([^"]*)"/g)) {
      const tokens = m[1].split(/\s+/).filter(Boolean);
      if (!tokens.includes('inp')) continue;
      if (tokens.some((t) => t === 'inp--m' || t === 'inp--s')) continue;
      noSize.push(m[1]);
    }
    if (noSize.length) {
      say('BLOCKER', 'B12', '.inp без размерного модификатора (' + noSize.length + '): class="' + noSize[0] + '" — размер задают только .inp--m / .inp--s, без них поле теряет высоту, паддинги и шрифт молча');
    }
  }

  /* A5 — битые относительные ссылки */
  const refs = uniq([...links, ...scripts, ...all(RX.href, html), ...all(RX.imgSrc, html)])
    .filter((h) => h && !/^(https?:|mailto:|#|data:|\/)/.test(h))
    .filter((h) => /\.[a-z0-9]{2,5}(\?|#|$)/i.test(h) && !/[\s…{}<>]/.test(h));
  for (const r of refs) {
    const clean = r.split(/[?#]/)[0];
    const segs = (dir ? dir.split('/') : []);
    /* `..` на пустом пути — выход ВЫШЕ корня ДС. Раньше `segs.pop()` на пустом
       массиве молча ничего не делал, побег терялся, и ссылка наружу выглядела
       как внутренняя: `pages/patterns/../../../Projects/…` превращалась в
       `Projects/…` и падала блокером «битая», хотя файл существует. */
    let escaped = false;
    for (const s of clean.split('/')) {
      if (s === '..') { if (segs.length) segs.pop(); else escaped = true; }
      else if (s !== '.') segs.push(s);
    }
    const abs = segs.join('/');
    /* Ссылка, ведущая ВНЕ дерева ДС, этим индексом не проверяется: `P.files`
       строится обходом только внутри DS-IBP (`tree()`). У экрана из
       `Projects/**` ссылка `../../DS-IBP/ds.css` корректна, но индексом не
       покрыта. Молчим, а не врём: несуществующий файл снаружи поймает не
       линтер, а открытие страницы. */
    if (escaped || abs.startsWith('..')) continue;
    if (!P.files.has(abs)) say('BLOCKER', 'A5', 'битая ссылка ' + r + ' → ' + abs);
  }
  /* ---------- группа L — правила раскладки (решения 21.08.2026) ----------
     L1 сумма колонок в ряду .grid12 больше 12 · L2 блок в .grid12 вне колонок
     без пометки data-off-grid · L3 самодельная сетка на экране · L4 переопределены
     поля контентной области или зазор сетки · L5 порог раскладки на @media ·
     L6 экран задаёт внешний отступ блоку ДС. */
  {
    const VOID = new Set(['br', 'img', 'input', 'hr', 'meta', 'link', 'source', 'use', 'path', 'circle', 'rect', 'area', 'col', 'embed', 'track', 'wbr']);
    const grids = [];
    const stack = [];
    const tagRx = /<(\/?)([a-z][a-z0-9-]*)([^>]*?)(\/?)>/gi;
    let t;
    while ((t = tagRx.exec(markup))) {
      const name = t[2].toLowerCase(), attrs = t[3] || '';
      if (t[1] === '/') {
        for (let i = stack.length - 1; i >= 0; i--) if (stack[i].name === name) { stack.length = i; break; }
        continue;
      }
      const cls = ((attrs.match(/class="([^"]*)"/i) || [, ''])[1]).split(/\s+/).filter(Boolean);
      const parent = stack[stack.length - 1];
      if (parent && parent.grid) parent.children.push({ cls, attrs });
      if (VOID.has(name) || t[4] === '/') continue;
      const node = { name, grid: cls.includes('grid12'), narrow: cls.includes('grid12--narrow'), children: [] };
      if (node.grid) grids.push(node);
      stack.push(node);
    }
    const spanOf = (cls, narrow) => {
      const c = cls.find((x) => /^col-\d+$/.test(x)), w = cls.find((x) => /^colw-\d+$/.test(x));
      if (narrow && w) return +w.slice(5);
      return c ? +c.slice(4) : null;
    };
    for (const g of grids) {
      for (const narrow of g.children.some((c) => c.cls.some((x) => /^colw-\d+$/.test(x))) ? [false, true] : [false]) {
        let sum = 0;
        for (const ch of g.children) {
          const s = spanOf(ch.cls, narrow);
          if (!s) continue;
          if (sum + s > 12) {
            say('BLOCKER', 'L1', 'ряд .grid12 переполнен: ' + (sum + s) + ' колонок при 12' + (narrow ? ' (узкий режим, .colw-*)' : '') + ' — блок .' + ch.cls.join('.'));
            sum = s;
          } else sum = (sum + s) % 12;
        }
      }
      for (const ch of g.children) {
        if (/data-off-grid/.test(ch.attrs)) continue;
        const style = (ch.attrs.match(/style="([^"]*)"/i) || [, ''])[1];
        if (!ch.cls.some((x) => /^col-\d+$/.test(x)))
          say('BLOCKER', 'L2', 'блок в .grid12 без .col-N: ' + (ch.cls.length ? '.' + ch.cls.join('.') : '<' + ch.name + '> без класса') + ' — привязка к колонке обязательна; осознанное исключение помечается data-off-grid="причина"');
        else if (/(?:^|;|\s)(?:width|min-width|max-width|flex-basis)\s*:\s*[^;]*\d+(?:px|rem)/i.test(style))
          say('BLOCKER', 'L2', 'фиксированная ширина у .' + ch.cls.join('.') + ' в .grid12 — ширину задаёт колонка; исключение помечается data-off-grid="причина"');
      }
    }
    if (isScreen) {
      for (const r of all(/grid-template-columns\s*:\s*([^;}]+)/gi, styleSrc, 1))
        if (/repeat\(\s*12\b/i.test(r) || (r.match(/fr\b/g) || []).length >= 12)
          say('WARN', 'L3', 'самодельная 12-колоночная сетка (grid-template-columns: ' + r.trim().slice(0, 40) + ') — раскладка экрана строится на .grid12 / .col-N (внутренняя раскладка блока — свое дело)');
      const overrides = uniq(all(/--(layout-pad-x|layout-pad-bottom|layout-crumbs-h|grid-gutter|grid-margin)\s*:/g, styleSrc, 1));
      if (overrides.length) say('BLOCKER', 'L4', 'экран переопределяет ' + overrides.map((o) => '--' + o).join(', ') + ' — поля контентной области и зазор сетки не меняются; исключение указывается явно при проектировании макета');
      if (/\.screen__content[^{]*\{[^}]*padding/.test(styleSrc)) say('BLOCKER', 'L4', 'экран переопределяет padding у .screen__content — поля 24px принадлежат каркасу');
      if (/@media[^{]*(?:max|min)-width/.test(styleSrc)) say('WARN', 'L5', 'порог раскладки на @media — считать нужно от ширины рабочей области: @container screen (max-width: …), иначе закрепление панели навигации не учтётся');
      /* L6 — внешний отступ блоку ДС из <style> экрана. Расстояния МЕЖДУ блоками
         принадлежат каркасу: их даёт зазор контентной области и её поля. Экран,
         которому нужного значения «в ДС нет», выдаёт его себе сам — и величина
         не проходит ни одной проверки. Так в портфеле ДИД завёлся
         «.dtable { margin-bottom: 8px }»: низ 32px, которого нет ни в шкале, ни
         на соседних экранах (10.09.2026). L4 этот случай не ловил — он смотрит
         только на padding у .screen__content и на токены --layout-*.
         Правило намеренно узкое: срабатывает лишь когда селектор ссылается на
         класс, объявленный в CSS дизайн-системы. Собственные классы экрана
         (.deal-*, .home-*, .frm-grid) свои margin ставят свободно — там отступ
         внутренний, а не между блоками каркаса. */
      {
        const ruleRx = /([^{}@]+){([^{}]*)}/g;
        let cr;
        while ((cr = ruleRx.exec(styleSrc))) {
          const sel = cr[1].trim(), decl = cr[2];
          if (!/(?:^|;|\s)margin(?:-top|-right|-bottom|-left)?\s*:/.test(decl)) continue;
          const ds = uniq((sel.match(/\.[a-zA-Z][\w-]*/g) || []).map((c) => c.slice(1))).filter((c) => P.cssClasses.has(c));
          if (ds.length) say('WARN', 'L6', 'экран задаёт margin блоку ДС (' + sel.replace(/\s+/g, ' ').slice(0, 48) + ') — внешние отступы между блоками даёт каркас: зазор контентной области и её поля, своих полей у компонента на экране не появляется');
        }
      }
    }
  }
  /* B1 — несуществующий токен */
  // локальными считаем переменные, объявленные где угодно на странице: <style>, inline style, JS (setProperty)
  const localVars = new Set([...all(RX.cssVarDef, html), ...all(/setProperty\(\s*['"`](--[a-zA-Z0-9-]+)/g, html)]);
  // флагаем только «голый» var(--x) БЕЗ fallback: var(--x, дефолт) — хук переопределения,
  // дефолт и есть определение (та же логика, что в B2 «fallback внутри var() легален»)
  const badTokens = uniq(all(/var\(\s*(--[a-zA-Z0-9-]+)\s*\)/g, html)).filter((t) => !P.tokens.has(t) && !localVars.has(t));
  for (const t of badTokens) say('BLOCKER', 'B1', 'var(' + t + ') — токена нет в styles/*.css');
  /* B2 — хардкод цвета в <style> страницы (fallback внутри var() легален) */
  const hexes = uniq(all(/(#[0-9a-f]{3,8}\b|rgba?\([^)]*\))/gi, styleSrc.replace(/var\([^)]*\)/g, ''), 1))
    .filter((h) => !HEX_ALLOW.some((rx) => rx.test(h.replace(/\s/g, ''))))
    .filter((h) => !HEX_OK.test(styleSrc.slice(Math.max(0, styleSrc.indexOf(h) - 80), styleSrc.indexOf(h))));
  if (hexes.length) say('WARN', 'B2', 'хардкод цвета в <style>: ' + hexes.slice(0, 4).join(', ') + (hexes.length > 4 ? ' … всего ' + hexes.length : ''));
  const changed = (opts.changed || []).includes(p);
  /* B3 — отступ/радиус вне шкалы 4 (шум старых страниц — только для правленых файлов) */
  const offScale = [];
  let m; RX.boxPx.lastIndex = 0;
  while ((m = RX.boxPx.exec(styleSrc))) {
    if (/var\(|calc\(|clamp\(|%|em|auto/.test(m[2])) continue;
    for (const v of m[2].match(/\b\d+(?:\.\d+)?px\b/g) || []) {
      const n = parseFloat(v);
      if (n % 4 !== 0 && ![1, 2, 6, 10, 14, 999, 9999].includes(n)) offScale.push(m[1] + ':' + v);
    }
  }
  if (offScale.length && changed) say('INFO', 'B3', 'вне шкалы 4: ' + uniq(offScale).slice(0, 5).join(', '));
  /* B4 — инлайн-SVG вместо <i data-icon> */
  let svgs = 0;
  for (const piece of markup.split(/<svg[\s>]/).slice(0, -1)) if (!SVG_OK.test(piece.slice(-200))) svgs++;
  if (svgs) say('WARN', 'B4', 'инлайн-SVG в разметке: ' + svgs + ' шт. — иконки должны быть <i data-icon>');
  /* B5 — нативная таблица */
  const visible = markup.replace(/<[^>]*display:\s*none[^>]*>[\s\S]*?<\/[a-z]+>/gi, '');
  if (BAD_TABLE.some((rx) => rx.test(visible))) say('BLOCKER', 'B5', 'нативная таблица/устаревшая сетка справочника — переделать на .tbl (Table/TableCell)');
  /* F1 — .chip__info без парного .pop/DSPopover (RiskMetric — половина композиции, RulesAudit W5) */
  if (/\bchip__info\b/.test(markup) && !/class="[^"]*\bpop\b/.test(markup) && !/data-riskmetric/.test(markup)
      && !scripts.some((s) => base(s) === 'ds-popover.js' || base(s) === 'ds-riskmetric.js')) {
    say('BLOCKER', 'F1', '.chip__info есть, а .pop/DSPopover рядом нет — композиция Chip+Popover собрана наполовину');
  }
  /* F2 — <i data-icon> внутри слота, который сам не размерен под иконку (не .cb__mark/.rb__mark —
     у чекбокса/радио слот принимает [data-icon] по конструкции, :is(svg,[data-icon]) в CSS) */
  if (/class="sw__knob"[^>]*>\s*<i\s+data-icon/.test(markup)) {
    say('BLOCKER', 'F2', '<i data-icon> вставлен прямо в .sw__knob — слот свитча не рассчитан на иконку, анатомия перевёрстана');
  }
  /* F3 — .tabs--horiz без data-tabs: ds-tabs.js не подключит переполнение (скролл/меню «Ещё») */
  if (/\btabs--horiz\b/.test(markup) && !/\bdata-tabs\b/.test(markup)) {
    say('BLOCKER', 'F3', '.tabs--horiz без data-tabs — переполнение ряда не подключится (ds-tabs.js молчит без атрибута)');
  }
  /* F4 — одноколоночный grid-track на фиксированной ширине вместо minmax(0,1fr) — трек сжимается по контенту */
  if (/grid-template-columns:\s*[\d.]+px\s*;/.test(styleSrc)) {
    say('WARN', 'F4', 'grid-template-columns: <px> без minmax(0,1fr) — трек не тянется, только сжимается по max-content');
  }
  /* F6 — интерактивная таблица на ЭКРАНЕ без ручек изменения ширины колонки. Изменение
     ширины — базовое, не отключаемое поведение любой таблицы, работает из коробки
     (tbl-resize.js входит в ds.js), но только если ручка размечена. Ждём .th__resize
     последним ребёнком каждой .th (кроме .th--separator). Только для screens: redline-
     и справочные таблицы в документации строятся на тех же .th/.th__label и ручки не
     несут — их не трогаем (инцидент 27.08.2026: tbl-resize.js не был в ds.js, а
     канонические сниппеты шапки шли без .th__resize — сборщик экрана не получал ресайз). */
  if (isScreen && /\bth__label\b/.test(markup) && !/\bth__resize\b/.test(markup)) {
    say('BLOCKER', 'F6', 'таблица на экране без .th__resize — ручка ширины ставится в каждой .th (кроме разделителей), опция не отключаемая; поведение из коробки через tbl-resize.js (уже в ds.js), свой JS не нужен');
  }
  // A8 — страница в pages без window.__DS_ROOT: ds-nav.js подставит пустой префикс,
  // и ВСЕ ссылки левой навигации плюс логотип окажутся битыми (Layout.html, 20.08.2026):
  // страница выглядит нормально, навигация не работает.
  if (/^pages\//.test(p) && /ds-nav\.js/.test(html) && !/__DS_ROOT/.test(html))
    say('BLOCKER', 'A8', "нет window.__DS_ROOT — ds-nav.js даст битые ссылки и логотип; для страниц в pages/<категория>/ нужно '../../'");
  /* F5 — «анатомия компонента взята не целиком»: реестр контрактов, а не код на каждый
     инцидент — новый компонент с обязательными «всегда обязаны присутствовать в DOM»
     узлами (не зависящими от текущего визуального режима/состояния) регистрируется ОДНОЙ
     строкой в ANATOMY_CONTRACTS ниже; проверка одна для всех компонентов. */
  /* Документационные сниппеты (<pre>/<code>) — не живая разметка: страница может
     показывать фрагмент чужого компонента как пример (Каркас экрана, 20.08.2026).
     Проверяем только разметку вне них. */
  const liveMarkup = markup.replace(/<pre[\s\S]*?<\/pre>/gi, '').replace(/<code[\s\S]*?<\/code>/gi, '');
  for (const c of ANATOMY_CONTRACTS) {
    if (c.when.test(liveMarkup)) {
      const missing = c.require.filter(([re]) => !re.test(liveMarkup)).map(([, label]) => label);
      if (missing.length) say('BLOCKER', 'F5', c.name + ' использован не целиком — анатомия урезана под текущий вид вместо взятой как есть (разметка не должна меняться между режимами/состояниями); отсутствует: ' + missing.join(', '));
    }
  }
  /* G1 — гейт фиделити макету (skills/mockup-fidelity-review.md) отмечен не в чате, а в
     самом файле: без строки-маркера экран сдавать нельзя (правило
     процесса, не мнение) — самоотчёт в переписке не переживает новую сессию/другого
     агента и не проверяем постфактум. Дата в маркере обязана совпадать с датой правки
     (тот же принцип, что C3), иначе разметка могла измениться уже ПОСЛЕ прогона гейта. */
  if (isScreen) {
    const gatePass = html.match(/<!--\s*FIDELITY-GATE:\s*PASS\s*·\s*ширина\s*[\d]+\s*·\s*([\d.]+)\s*-->/i);
    const gateNA = html.match(/<!--\s*FIDELITY-GATE:\s*N\/A\s*·\s*нет исходного макета\s*·\s*([\d.]+)\s*-->/i);
    const gate = gatePass || gateNA;
    if (!gate) say('BLOCKER', 'G1', 'нет строки <!-- FIDELITY-GATE: PASS · ширина <N> · ДД.ММ.ГГГГ --> (сборка по макету) или <!-- FIDELITY-GATE: N/A · нет исходного макета · ДД.ММ.ГГГГ --> (сборка по тексту) сразу после <!DOCTYPE html> — гейт не отмечен как пройденный в самом файле');
    else if (changed && gate[1] !== (opts.today || today()) && !p.split('/').includes('fixtures')) say('WARN', 'G1', 'экран правился, а дата в FIDELITY-GATE = ' + gate[1] + ', сегодня ' + (opts.today || today()) + ' — гейт нужно перепрогнать после правки и обновить дату');
  }
  /* C1 — карточка @dsCard первой строкой */
  if (!/^<!--\s*@dsCard\b/.test(html)) say('BLOCKER', 'C1', 'первая строка — не <!-- @dsCard … -->');
  /* C2/C3 — masthead */
  const metaBlk = (html.match(/<(?:p|div) class="meta"[\s\S]{0,900}?<\/(?:p|div)>/) || [''])[0];
  const ver = (metaBlk.match(/Версия:?\s*<b>([^<]+)/) || [])[1];
  const upd = (metaBlk.match(/Обновлено:?\s*<b>([^<]+)/) || [])[1];
  if (!ver || !upd) say('BLOCKER', 'C2', 'в masthead нет ' + (!ver ? '«Версия»' : '') + (!ver && !upd ? ' и ' : '') + (!upd ? '«Обновлено»' : ''));
  /* C7 — единый формат версии М.ммм без префикса v (решение 20.08.2026) */
  if (ver && !/^\d+\.\d{3}$/.test(ver.trim())) say('BLOCKER', 'C7', 'версия «' + ver.trim() + '» не в формате М.ммм (три знака после точки, без «v»): например 1.006');
  if (changed && upd && upd.trim() !== (opts.today || today())) say('WARN', 'C3', 'страница правилась, «Обновлено» = ' + upd + ', сегодня ' + (opts.today || today()));
  /* C4/C5/C6 — разделы */
  if (inContract && P.canon.length) {
    // docs-split: «Конструктор» и «Код компонента» — заголовки табов нижней панели,
    // не разделы документации; «Конструктор» исключается и из канона
    const isDs = /class="page ds-split"/.test(markup);
    const canon = isDs ? P.canon.filter((c) => c !== 'Конструктор') : P.canon;
    // разделы документации пишутся как <h2>Название</h2>; <h2 class=…> — часть демо-компонента
    const h2s = all(/<h2>([\s\S]*?)<\/h2>/g, html).map((h) => strip(h).replace(/\s*(Новое|Расширение|Обновлено)\s*$/, '').trim());
    const docs = isDs ? h2s.filter((h) => h !== 'Конструктор' && h !== 'Код компонента') : h2s;
    const idx = [];
    const unknown = [];
    for (const h of docs) {
      const i = canon.findIndex((c) => h === c || h.startsWith(c));
      if (i >= 0) idx.push(i);
      else if (!/бэклог|что предлагаем/i.test(h)) unknown.push(h);
      else if (/что предлагаем/i.test(h)) say('WARN', 'C5', 'раздел бэклога должен называться «Бэклог» (найдено: «' + h + '») — имя h2 контракт для агентов');
    }
    const missing = canon.filter((c) => !docs.some((h) => h === c || h.startsWith(c)));
    if (missing.length) say('WARN', 'C4', 'нет h2: ' + missing.join(', '));
    if (!docs.some((h) => /бэклог|что предлагаем/i.test(h))) say('BLOCKER', 'C4', 'нет обязательного раздела «Что предлагаем добавить» / «Бэклог»');
    const ordered = idx.every((v, i) => i === 0 || v >= idx[i - 1]);
    if (!ordered) say('WARN', 'C4', 'порядок h2 расходится с каноном: ' + idx.map((i) => canon[i]).join(' → '));
    if (unknown.length) say('WARN', 'C5', 'неканонические h2: ' + unknown.join(', '));
    if (docs.includes('Конструктор') && docs[0] !== 'Конструктор') say('WARN', 'C6', '«Конструктор» не первым после шапки (первый — «' + docs[0] + '»)');
  }
  /* D1/D2 — реестры */
  if (inRegistry) {
    if (!P.index.includes('"' + p + '"')) say('BLOCKER', 'D1', 'нет карточки в index.html (href="' + p + '")');
    if (!P.nav.includes("'" + p + "'")) say('BLOCKER', 'D2', 'нет пункта в scripts/ds-nav.js');
    /* D5 — спека и манифест */
    const spec = 'specs/' + name + '.md';
    if (!P.files.has(spec)) say('BLOCKER', 'D5', 'нет спеки ' + spec);
    else {
      if (!P.specIndex.includes(spec)) say('BLOCKER', 'D5', 'нет строки в specs/_index.md');
      /* D6 */
      if (inContract && !new RegExp('^##\\s*' + name + '\\b', 'mi').test(P.cheat)) say('WARN', 'D6', 'нет блока «## ' + name + '» в specs/_cheatsheet.md');
      else if (inContract) {
        const blockM = P.cheat.match(new RegExp('\\n##\\s*' + name + '\\b[\\s\\S]*?(?=\\n## |$)', 'i'));
        const block = blockM ? blockM[0] : '';
        if (block && !/\*\*Инварианты:\*\*/.test(block)) say('WARN', 'D8', 'блок «## ' + name + '» в чит-шите без «**Инварианты:**»');
        if (block && !new RegExp('specs/' + name + '\\.md').test(block)) say('WARN', 'D8', 'блок «## ' + name + '» в чит-шите без отсылки specs/' + name + '.md');
      }
      /* A5 — css компонента из спеки обязан быть подключён страницей */
      const sCss = ((P.src.get(spec) || '').match(/^css:\s*`?([^`\n·]+)/m) || [])[1];
      if (sCss && /^styles\//.test(sCss.trim())) {
        const need = base(sCss.trim());
        if (!all(RX.link, html).some((href) => base(href) === need)) say('BLOCKER', 'A5', 'спека объявляет css: ' + sCss.trim() + ', но страница его не линкует');
      }
      /* D7 */
      const s = P.src.get(spec) || '';
      const sv = (s.match(/^version:\s*"?([^"\n]+)/m) || [])[1];
      const su = (s.match(/^updated:\s*"?([^"\n]+)/m) || [])[1];
      if (ver && sv && sv.trim() !== ver.trim()) say('WARN', 'D7', 'версия в спеке ' + sv + ' ≠ ' + ver + ' на странице');
      if (upd && su && su.trim() !== upd.trim()) say('WARN', 'D7', 'дата в спеке ' + su + ' ≠ ' + upd + ' на странице');
    }
  }
  /* D7 вне реестров (pages/rnd/* и прочие): спека есть — версия и дата обязаны совпадать */
  if (!inRegistry) {
    const s = P.src.get('specs/' + name + '.md');
    if (s) {
      const sv = (s.match(/^version:\s*"?([^"\n]+)/m) || [])[1];
      const su = (s.match(/^updated:\s*"?([^"\n]+)/m) || [])[1];
      if (ver && sv && sv.trim() !== ver.trim()) say('WARN', 'D7', 'версия в спеке ' + sv + ' ≠ ' + ver + ' на странице');
      if (upd && su && su.trim() !== upd.trim()) say('WARN', 'D7', 'дата в спеке ' + su + ' ≠ ' + upd + ' на странице');
    }
  }
}

/* ---------- запуск ---------- */
async function run(targets, opts) {
  opts = opts || {};
  const P = await loadProject();
  const pages = (targets && targets.length ? targets : []).filter((p) => !SKIP_ALL.some((rx) => rx.test(p)));
  const wanted = [...pages];
  for (const p of pages) {
    const spec = 'specs/' + base(p).replace(/\.html$/, '') + '.md';
    if (P.files.has(spec)) wanted.push(spec);
  }
  const loaded = await Promise.all(wanted.map((f) => readFile(f).catch(() => '')));
  P.src = new Map(wanted.map((f, i) => [f, loaded[i]]));
  const lines = [];
  const rep = [];
  if (opts.global !== false) {
    const g = [];
    await globalChecks(P, g);
    for (const r of g) rep.push([null, ...r]);
  }
  if (opts.parity) {
    const g = [];
    try { await parityChecks(P, g); } catch (e) { g.push(['BLOCKER', '!!', 'гейт парности упал: ' + e.message]); }
    for (const r of g) rep.push([null, ...r]);
  }
  for (const p of pages) {
    const o = [];
    try { await pageChecks(p, P, opts, o); } catch (e) { o.push(['BLOCKER', '!!', 'линтер упал: ' + e.message]); }
    for (const r of o) rep.push([p, ...r]);
  }
  const order = { BLOCKER: 0, WARN: 1, INFO: 2 };
  rep.sort((a, b) => order[a[1]] - order[b[1]] || String(a[0]).localeCompare(String(b[0])));
  const scope = pages.length ? pages.join(', ') : 'проект (только глобальные правила)';
  lines.push('DS-LINT · ' + scope + ' · ' + (opts.today || today()));
  const count = { BLOCKER: 0, WARN: 0, INFO: 0 };
  for (const [pg, lvl, id, msg] of rep) {
    count[lvl]++;
    lines.push(lvl.padEnd(8) + id.padEnd(4) + (pages.length > 1 && pg ? base(pg) + ': ' : '') + msg);
  }
  if (!rep.length) return 'DS-LINT: чисто · ' + scope;
  lines.push('—');
  lines.push('BLOCKER ' + count.BLOCKER + ' · WARN ' + count.WARN + ' · INFO ' + count.INFO + ' → ' + (count.BLOCKER ? 'NEEDS-WORK' : 'PASS с замечаниями'));
  return lines.join('\n');
}

/* API наружу: файл должен оставаться валидным скриптом (компилятор ДС его парсит),
   поэтому не `return`, а переменная — вызывающий дописывает `;return dsLint;` */
var dsLint = { run };
