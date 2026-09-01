#!/usr/bin/env node
/* ============================================================
   DOCS-SPLIT CLI — тулчейн раскатки страниц документации IBP
   на паттерн «сплиттер + табы» (docs-split).

   Подкоманды:
     map                 — перегенерировать references/pages-index.md
                           (структурная карта всех doc-страниц)
     inject <page>       — вставить styles/<компонент>.css в блок
                           <script type="text/plain" id="src-code-css">
                           (CSS берётся из файла, модель его не читает)
     check <page>        — структурные проверки: баланс тегов, остатки
                           ds-toc/pg-kit, splitpane--app, src-code, panes
     verify <page>       — headless Chrome: temp-копия + харнесс +
                           --dump-dom → извлечь #diag → удалить копию

   Запуск (из корня репо):
     node .opencode/skills/docs-split/tooling/docs-split.mjs <cmd> [page]

   Код выхода: 1 при любой невыполненной проверке (check/verify), иначе 0.
   ============================================================ */
import { readFile, writeFile, readdir, unlink, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import os from 'node:os';

const run = promisify(execFile);

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const DS = path.join(ROOT, 'DS-IBP');
const TOOL = path.dirname(fileURLToPath(import.meta.url));
const HARNESS = path.join(TOOL, 'diag-harness.js');
const INDEX_MD = path.join(DS, 'specs', '_index.md');
const PAGES_INDEX = path.join(TOOL, '..', 'references', 'pages-index.md');

const PAGE_DIRS = ['foundations', 'atoms', 'molecules', 'organisms', 'patterns'];

const CHROME_CANDIDATES = [
  process.env.DS_CHROME,
  // macOS (корпоративный контур)
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  // Windows (домашний ПК)
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'Application', 'chrome.exe'),
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].filter(Boolean);

/* ---------------- helpers ---------------- */

function log(msg) { process.stdout.write(msg + '\n'); }
function fail(msg) { log('ОШИБКА: ' + msg); process.exit(2); }

async function readUtf8(p) { return readFile(p, 'utf8'); }
async function writeUtf8(p, s) { return writeFile(p, s, 'utf8'); }

/* компонент → styles/*.css из specs/_index.md (источник истины) */
async function loadCssMap() {
  const map = {};
  const text = await readUtf8(INDEX_MD);
  for (const line of text.split('\n')) {
    const m = line.match(/^\|\s*([^|]+?)\s*\|\s*specs\/[^|]+\|\s*([^|]+?\.css)\s*\|/);
    if (m) map[m[1].trim()] = m[2].trim();
  }
  return map;
}

function kebab(name) {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

async function resolveCss(pagePath, explicitCss) {
  if (explicitCss) {
    const p = path.isAbsolute(explicitCss) ? explicitCss : path.join(ROOT, explicitCss);
    if (existsSync(p)) return p;
    const p2 = path.join(DS, explicitCss);
    if (existsSync(p2)) return p2;
    fail(`--css файл не найден: ${explicitCss}`);
  }
  const name = path.basename(pagePath, '.html');
  const cssMap = await loadCssMap();
  if (cssMap[name]) return path.join(DS, cssMap[name]);
  // fallback: kebab + нижний регистр (snackbar, riskmetric — без дефиса)
  const cands = [kebab(name) + '.css', name.toLowerCase() + '.css'];
  for (const c of cands) {
    const p = path.join(DS, 'styles', c);
    if (existsSync(p)) return p;
  }
  fail(`не найден CSS для ${name} — укажи явно: --css DS-IBP/styles/<файл>.css`);
}

function pagePath(arg) {
  const p = path.resolve(ROOT, arg);
  if (!existsSync(p)) fail(`файл не найден: ${arg}`);
  return p;
}

/* ---------------- check ---------------- */

async function cmdCheck(pageArg) {
  const p = pagePath(pageArg);
  const t = await readUtf8(p);
  const name = path.basename(p);
  const results = [];
  const ok = (cond, label) => results.push([cond, label]);

  // баланс тегов вне <script>-блоков
  const noScript = t.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  const bal = (tag) => {
    const o = (noScript.match(new RegExp('<' + tag + '(\\s[^>]*)?>', 'g')) || []).length;
    const c = (noScript.match(new RegExp('</' + tag + '>', 'g')) || []).length;
    return o - c;
  };
  ok(bal('div') === 0, `баланс <div> (${bal('div')})`);
  ok(bal('section') === 0, `баланс <section> (${bal('section')})`);
  ok(bal('table') === 0, `баланс <table> (${bal('table')})`);

  const count = (re) => (t.match(re) || []).length;
  const countFrame = (re) => (noScript.match(re) || []).length;
  ok(count(/<\/body>/gi) === 1, `один </body> (${count(/<\/body>/gi)})`);
  ok(count(/<\/html>/gi) === 1, `один </html> (${count(/<\/html>/gi)})`);
  ok(count(/ds-toc\.js/g) === 0, `нет ds-toc.js (${count(/ds-toc\.js/g)})`);
  ok(count(/pg-kit\.js/g) === 0, `нет pg-kit.js (${count(/pg-kit\.js/g)})`);
  ok(count(/ds-toc\.css/g) === 0, `нет ds-toc.css (${count(/ds-toc\.css/g)})`);
  ok(count(/styles\/tab\.css/) >= 1, `tab.css подключён (${count(/styles\/tab\.css/)})`);
  ok(count(/styles\/segment-control\.css/) >= 1, `segment-control.css подключён (${count(/styles\/segment-control\.css/)})`);
  ok(count(/\{\s*on:\s*'[^']*'\s*,\s*off:/) === 0, `нет {on, off} словарей в DS_SPLIT_SWITCH_LABELS (${count(/\{\s*on:\s*'[^']*'\s*,\s*off:/)})`);
  /* .splitpane--app считается по КАРКАСУ (noScript), не по всему файлу: правила
     --app входят в styles/splitter.css, который inject кладёт в src-code-css
     вкладки «Код» (полный CSS компонента) — упоминания в код-образцах легальны.
     Запрет паттерна касается каркаса main.ds-split (урок Splitter, 30.08.2026). */
  ok(countFrame(/splitpane--app/g) === 0, `нет .splitpane--app в каркасе (${countFrame(/splitpane--app/g)})`);
  ok(count(/class="page ds-split"/) === 1, `main.page.ds-split (${count(/class="page ds-split"/)})`);
  ok(count(/docs-split\.js/g) >= 1, `docs-split.js подключён (${count(/docs-split\.js/g)})`);
  ok(count(/id="src-code-(html|css|js)"/g) === 3, `3 src-code блока (${count(/id="src-code-(html|css|js)"/g)})`);
  ok(count(/id="pane-docs"/g) === 1 && count(/id="pane-constructor"/g) === 1 && count(/id="pane-code"/g) === 1, 'panes docs/constructor/code');

  let bad = 0;
  log(`== check ${name} ==`);
  for (const [cond, label] of results) {
    log((cond ? 'PASS' : 'FAIL') + '  ' + label);
    if (!cond) bad++;
  }
  log(bad === 0 ? 'ВЕРДИКТ: OK' : `ВЕРДИКТ: FAIL (${bad})`);
  process.exit(bad === 0 ? 0 : 1);
}

/* ---------------- inject ---------------- */

/* HTML-эталон из спеки: первый fenced-блок после «### Разметка · HTML» */
async function loadSpecHtml(pagePath) {
  const name = path.basename(pagePath, '.html');
  const specPath = path.join(DS, 'specs', name + '.md');
  if (!existsSync(specPath)) return null;
  const text = await readUtf8(specPath);
  const idx = text.indexOf('### Разметка · HTML');
  if (idx < 0) return null;
  const m = text.slice(idx).match(/```[a-zA-Z]*\n([\s\S]*?)```/);
  if (!m) return null;
  return m[1].replace(/\s+$/, '');
}

async function cmdInject(pageArg, explicitCss, wantHtml) {
  const p = pagePath(pageArg);
  const name = path.basename(p);
  let t = await readUtf8(p);
  const done = [];

  if (wantHtml) {
    const html = await loadSpecHtml(p);
    if (html === null) fail(`${name}: в specs/${name}.md нет блока «### Разметка · HTML» — вставь src-code-html вручную`);
    const reHtml = /<script type="text\/plain" id="src-code-html">[\s\S]*?<\/script>/i;
    if (!reHtml.test(t)) fail(`${name}: блок src-code-html не найден`);
    const before = t;
    t = t.replace(reHtml, `<script type="text/plain" id="src-code-html">${html}</script>`);
    if (t !== before) { done.push(`HTML-эталон из specs/${name}.md (${html.length} байт)`); }
  }

  const cssPath = await resolveCss(p, explicitCss);
  const css = await readUtf8(cssPath);
  const re = /<script type="text\/plain" id="src-code-css">[\s\S]*?<\/script>/i;
  if (!re.test(t)) fail(`${name}: блок src-code-css не найден`);
  const before = t;
  t = t.replace(re, `<script type="text/plain" id="src-code-css">${css.trimEnd()}</script>`);
  if (t !== before) done.push(`styles/${path.basename(cssPath)} (${css.length} байт)`);

  if (!done.length) {
    log(`== inject ${name} ==`);
    log('src-code уже актуален, файл не тронут');
    process.exit(0);
  }
  await writeUtf8(p, t);
  log(`== inject ${name} ==`);
  done.forEach((d) => log('вставлено: ' + d));
  process.exit(0);
}

/* ---------------- scaffold ---------------- */

/* вырезать сбалансированный элемент от индекса '<tag' (startIdx) до закрывающего тега */
function sliceTag(html, startIdx, tag) {
  const re = new RegExp('<' + tag + '(\\s[^>]*)?>|</' + tag + '>', 'g');
  re.lastIndex = startIdx;
  let depth = 0, m;
  while ((m = re.exec(html))) {
    if (m[0][1] === '/') depth--; else depth++;
    if (depth === 0) return html.slice(startIdx, re.lastIndex);
  }
  return null;
}

/* каркасные константы (см. skeleton.md) */
const SPL_GRIP = '<span class="spl__grip"><i></i><i></i><i></i><i></i><i></i><i></i></span>';
const TABS_OPEN = ''
  + '    <div class="splitpane__panel splitpane__b app-pane-docs">\n'
  + '      <div class="tabs tabs--horiz" role="tablist" data-tabs aria-label="Разделы страницы">\n'
  + '        <button type="button" class="tab tab--m" id="tab-constructor" role="tab" aria-selected="false" tabindex="-1" data-pane="pane-constructor" aria-controls="pane-constructor"><span class="tab__label">Конструктор</span></button>\n'
  + '        <button type="button" class="tab tab--m tab--selected" id="tab-docs" role="tab" aria-selected="true" tabindex="0" data-pane="pane-docs" aria-controls="pane-docs"><span class="tab__label">Документация</span></button>\n'
  + '        <button type="button" class="tab tab--m" id="tab-code" role="tab" aria-selected="false" tabindex="-1" data-pane="pane-code" aria-controls="pane-code"><span class="tab__label">Код</span></button>\n'
  + '      </div>\n'
  + '\n'
  + '      <div class="tabs-body">\n'
  + '        <div class="tabpane" id="pane-docs" role="tabpanel" aria-labelledby="tab-docs">\n'
  + '          <div class="docs-layout">\n'
  + '            <div class="docs-main">\n\n';

const FOOT_CLOSE = ''
  + '            </div><!-- /docs-main -->\n'
  + '            <nav class="docs-toc" id="docs-toc" aria-label="Содержание страницы"></nav>\n'
  + '          </div><!-- /docs-layout -->\n'
  + '        </div><!-- /pane-docs -->\n'
  + '\n'
        + '        <div class="tabpane" id="pane-constructor" role="tabpanel" aria-labelledby="tab-constructor" hidden>\n'
  + '          <div class="docs-layout">\n'
  + '            <div class="docs-main">\n'
  + '              <h2>Конструктор</h2>\n'
  + '@@PC_DESC@@'
  + '@@PC_BLOCK@@'
  + '            </div>\n'
  + '          </div>\n'
  + '        </div>\n'
  + '\n'
  + '        <div class="tabpane" id="pane-code" role="tabpanel" aria-labelledby="tab-code" hidden>\n'
  + '          <div class="docs-layout">\n'
  + '            <div class="docs-main">\n'
  + '              <h2>Код компонента</h2>\n'
  + '              <p class="desc">Эталонная разметка, полный CSS компонента и выжимка API для интеграции.</p>\n'
  + '              <div class="segctrl segctrl--s code-switch" role="radiogroup" aria-label="Язык кода" data-segctrl>\n'
  + '                <div class="segctrl__thumb"></div>\n'
  + '                <button type="button" class="segctrl__item" role="radio" aria-checked="true" data-lang="html"><span class="segctrl__label">HTML</span></button>\n'
  + '                <button type="button" class="segctrl__item" role="radio" aria-checked="false" data-lang="css"><span class="segctrl__label">CSS</span></button>\n'
  + '                <button type="button" class="segctrl__item" role="radio" aria-checked="false" data-lang="js"><span class="segctrl__label">JS</span></button>\n'
  + '              </div>\n'
  + '              <div class="code-panel code-view" data-view="html"><pre><code id="code-out-html"></code></pre></div>\n'
  + '              <div class="code-panel code-view" data-view="css" hidden><pre><code id="code-out-css"></code></pre></div>\n'
  + '              <div class="code-panel code-view" data-view="js" hidden><pre><code id="code-out-js"></code></pre></div>\n'
  + '            </div>\n'
  + '          </div>\n'
  + '        </div>\n'
  + '      </div><!-- /tabs-body -->\n'
  + '    </div><!-- /app-pane-docs -->\n'
  + '  </div><!-- /splitpane -->\n';

const SRC_CODE_TAIL = ''
  + '\n'
  + '<!-- ===== исходники для вкладки «Код» (статично) ===== -->\n'
  + '<script type="text/plain" id="src-code-html"></script>\n'
  + '<script type="text/plain" id="src-code-js"></script>\n'
  + '<script type="text/plain" id="src-code-css"></script>\n';

async function cmdScaffold(pageArg) {
  const p = pagePath(pageArg);
  const name = path.basename(p, '.html');
  let t = await readUtf8(p);
  if (t.includes('class="page ds-split"')) {
    log(`== scaffold ${name} ==`);
    log('уже на docs-split — файл не тронут');
    process.exit(0);
  }
  const warn = [];
  const ok = (label) => warn.push('OK  ' + label);
  const miss = (label) => warn.push('MISS ' + label);

  /* 1. masthead — вырезать (встанет внутрь pane-docs) */
  const mhIdx = t.indexOf('<header class="masthead">');
  const masthead = mhIdx >= 0 ? sliceTag(t, mhIdx, 'header') : null;
  if (masthead) { t = t.replace(masthead, '@@MASTHEAD@@'); ok('masthead'); } else miss('masthead');

  /* 2. playground-секция: извлечь стадию, контролы (.pg__controls), #pg-code, desc */
  let stage = null, controls = null, pgcode = null, pcDesc = null, pgSection = null;
  let staticControls = null; /* static-режим: .pg__controls целиком (без id) */
  const pgIdx = t.indexOf('data-screen-label="Playground"');
  if (pgIdx >= 0) {
    const secStart = t.lastIndexOf('<section', pgIdx);
    if (secStart >= 0) {
      pgSection = sliceTag(t, secStart, 'section');
      if (pgSection) {
        t = t.replace(pgSection, '@@PLAYGROUND@@');
        const s = pgSection;
        const stIdx = s.indexOf('<div class="pg__stage');
        if (stIdx >= 0) { stage = sliceTag(s, stIdx, 'div'); ok('демо-стадия'); } else miss('демо-стадия');
        const cIdx = s.indexOf('id="pg-controls"');
        const cStatIdx = s.indexOf('<div class="pg__controls"');
        if (cIdx >= 0) {
          const cStart = s.lastIndexOf('<div', cIdx);
          if (cStart >= 0) { controls = sliceTag(s, cStart, 'div'); ok('#pg-controls'); }
          else { controls = ''; miss('#pg-controls обёртка'); }
        } else if (cStatIdx >= 0) {
          staticControls = sliceTag(s, cStatIdx, 'div');
          if (staticControls) ok('.pg__controls (static)'); else miss('.pg__controls (static)');
        } else { controls = ''; miss('#pg-controls'); }
        const gIdx = s.indexOf('id="pg-code"');
        if (gIdx >= 0) {
          const gStart = s.lastIndexOf('<p', gIdx);
          if (gStart >= 0) { pgcode = sliceTag(s, gStart, 'p'); ok('#pg-code'); }
        } else ok('#pg-code отсутствует (page.js может писать без гварда — проверить)');
        const dIdx = s.indexOf('<p class="desc">');
        if (dIdx >= 0) { pcDesc = sliceTag(s, dIdx, 'p'); ok('desc конструктора'); } else miss('desc конструктора');
      }
    }
  }
  if (!pgSection) miss('playground-секция');

  /* 3. main → ds-split + каркас */
  const mainRe = new RegExp('<main class="page" data-screen-label="([^"]*)">');
  const mm = t.match(mainRe);
  if (!mm) fail(`${name}: <main class="page"> не найден`);
  const label = mm[1];
  t = t.replace(mainRe,
    '<main class="page ds-split" data-screen-label="' + label + '">\n'
    + '\n'
    + '  <div class="splitpane splitpane--h" data-splitter data-min="25" data-max="75" data-initial="42">\n'
    + '    <div class="splitpane__panel splitpane__a app-pane-demo">\n'
    + '      <div class="demo-stage">\n'
    + (stage ? '        ' + stage + '\n' : '')
    + (pgcode ? '        ' + pgcode + '\n' : '')
    + '      </div>\n'
    + '    </div>\n'
    + '\n'
    + '    <div class="spl spl--h" role="separator" aria-orientation="horizontal" aria-label="Изменить высоту демо" tabindex="0">' + SPL_GRIP + '</div>\n'
    + '\n'
    + TABS_OPEN
    + (masthead ? masthead + '\n\n' : ''));

  /* 4. playground-маркер — убрать */
  t = t.replace('@@PLAYGROUND@@', '');
  t = t.replace('@@MASTHEAD@@', ''); // уже вставлен выше

  /* 5. футер: закрыть panes. pane-constructor: dynamic — #pg-controls (docs-split.js
     раскладывает); static — .pg__controls как есть (docs-split.css даёт 2 колонки) */
  const pcBlock = staticControls
    ? '              ' + staticControls + '\n'
    : '              <div class="pg__controls" id="pg-controls">' + (controls ? controls.replace(/^<div class="pg__controls" id="pg-controls">|<\/div>$/g, '') : '') + '</div>\n';
  t = t.replace('</main>',
    FOOT_CLOSE.replace('@@PC_DESC@@', pcDesc ? '              ' + pcDesc + '\n' : '')
      .replace('@@PC_BLOCK@@', staticControls
        ? '              ' + staticControls + '\n'
        : '              <div class="pg__controls" id="pg-controls">' + (controls ? controls.replace(/^<div class="pg__controls" id="pg-controls">|<\/div>$/g, '') : '') + '</div>\n')
    + '</main>');

  /* 6. head: ds-toc.css → 4 файла; убрать pg-kit.css */
  t = t.replace(/<link rel="stylesheet" href="\.\.\/\.\.\/styles\/ds-toc\.css">\s*/g, '');
  t = t.replace(/<link rel="stylesheet" href="\.\.\/\.\.\/styles\/pg-kit\.css">\s*/g, '');
  const need = ['splitter.css', 'segment-control.css', 'tab.css', 'docs-split.css'];
  const add = need.filter((c) => !t.includes('styles/' + c));
  if (add.length) {
    const ins = add.map((c) => '  <link rel="stylesheet" href="../../styles/' + c + '">').join('\n') + '\n';
    t = t.replace('</head>', ins + '</head>');
    ok('head: ' + add.join(', '));
  }

  /* 7. style: playground-правила */
  t = t.replace(/\s*\.panel\.pg\s*\{[^}]*\}/g, '');
  t = t.replace(/\s*\.pg__controls\s*\{[^}]*\}/g, '');
  t = t.replace(/\s*@media[^{]*\{[^}]*\.pg__controls[^}]*\}/g, '');
  t = t.replace(/(\.pg__stage\s*\{)([^}]*)(\})/g, (mm2, pre, body, post) => {
    let b = body.replace(/min-height\s*:[^;]+;?/g, '');
    if (!/\bflex\s*:/.test(b)) b = ' flex:1; min-height:0; width:100%;' + b;
    return pre + b + post;
  });

  /* 8. скрипты: ds-toc/pg-kit убрать; рантаймы до page.js; docs-split после */
  t = t.replace(/<script src="\.\.\/\.\.\/scripts\/ds-toc\.js"><\/script>\s*/g, '');
  t = t.replace(/<script src="\.\.\/\.\.\/scripts\/pg-kit\.js"><\/script>\s*/g, '');
  const runtimes = ['ds-splitter.js', 'ds-tabs.js'].filter((r) => !t.includes('scripts/' + r));
  if (runtimes.length) {
    const firstPage = t.search(/<script src="\.\.\/\.\.\/scripts\/[a-z0-9-]+\.page\.js">/);
    const insRt = runtimes.map((r) => '<script src="../../scripts/' + r + '"></script>\n').join('');
    if (firstPage >= 0) t = t.slice(0, firstPage) + insRt + t.slice(firstPage);
    else t = t.replace('</body>', insRt + '</body>');
    ok('рантаймы: ' + runtimes.join(', '));
  }
  const tail = '<script>window.DS_SPLIT_SWITCH_LABELS = {};</script>\n'
    + '<script src="../../scripts/docs-split.js"></script>\n'
    + SRC_CODE_TAIL;
  if (!t.includes('docs-split.js')) t = t.replace('</body>', tail + '</body>');

  /* 9. «Обновлено» → сегодня */
  const today = new Date().toISOString().slice(0, 10).split('-').reverse().join('.');
  t = t.replace(/Обновлено:?\s*<b>\d{2}\.\d{2}\.\d{4}<\/b>/, 'Обновлено: <b>' + today + '</b>');

  await writeUtf8(p, t);
  log(`== scaffold ${name} ==`);
  warn.forEach((w) => log('  ' + w));
  log('каркас собран. Дозаполни вручную: словарь DS_SPLIT_SWITCH_LABELS, src-code-js (выжимка API), при необходимости стадию/контролы.');
}

/* ---------------- rollout ---------------- */

async function cmdRollout(pageArg) {
  const p = pagePath(pageArg);
  const rel = path.relative(ROOT, p).split(path.sep).join('/');
  const tool = path.join(TOOL, 'docs-split.mjs');
  const node = process.execPath;
  const steps = [];
  const t0 = await readUtf8(p);
  if (!t0.includes('class="page ds-split"')) steps.push(['scaffold', [tool, 'scaffold', rel]]);
  steps.push(['inject css', [tool, 'inject', rel]]);
  steps.push(['inject html', [tool, 'inject', rel, '--html']]);
  steps.push(['check', [tool, 'check', rel]]);
  steps.push(['verify', [tool, 'verify', rel]]);
  let failed = 0;
  for (const [st, args] of steps) {
    log('\n=== ' + st + ' ===');
    try {
      const { stdout } = await run(node, args, { maxBuffer: 16 * 1024 * 1024, timeout: 150000, windowsHide: true });
      process.stdout.write(stdout);
    } catch (e) {
      if (e.stdout) process.stdout.write(String(e.stdout));
      if (e.stderr) process.stderr.write(String(e.stderr));
      failed++;
      log('шаг ' + st + ' завершился с ошибкой');
    }
  }
  log('\n' + '='.repeat(40));
  log(failed === 0 ? 'ВЕРДИКТ: OK' : `ВЕРДИКТ: FAIL (${failed} шаг(а))`);
  process.exit(failed === 0 ? 0 : 1);
}

/* ---------------- verify ---------------- */

function findChrome() {
  for (const c of CHROME_CANDIDATES) {
    if (c && existsSync(c)) return c;
  }
  fail('Chrome/Edge не найден — задай путь через DS_CHROME');
}

async function cmdVerify(pageArg) {
  const p = pagePath(pageArg);
  const name = path.basename(p, '.html');
  const dir = path.dirname(p);
  const diagPath = path.join(dir, name + '.diag.html');

  const page = await readUtf8(p);
  const harness = await readUtf8(HARNESS);
  if (!/<\/body>/i.test(page)) fail(`${name}.html: нет </body>`);
  const diagHtml = page.replace(/<\/body>/i, `<script>${harness}</script>\n</body>`);
  await writeUtf8(diagPath, diagHtml);

  const chrome = findChrome();
  const url = pathToFileURL(diagPath).href;
  /* уникальный профиль на запуск: общий --user-data-dir блокируется первым
     headless-процессом и даёт ложные FAIL при параллельных verify (урок Л9) */
  const profile = path.join(os.tmpdir(), 'opencode', 'dsv-' + Date.now() + '-' + Math.random().toString(36).slice(2));

  try {
    const { stdout } = await run(chrome, [
      '--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files',
      `--user-data-dir=${profile}`, '--window-size=1600,900',
      '--virtual-time-budget=30000', '--dump-dom', url,
    ], { maxBuffer: 32 * 1024 * 1024, timeout: 90000, windowsHide: true });

    // последнее вхождение pre#diag (в комментариях страницы может быть похожий текст)
    const matches = [...stdout.matchAll(/<pre id="diag">([\s\S]*?)<\/pre>/g)];
    const m = matches.length ? matches[matches.length - 1] : null;
    log(`== verify ${name} ==`);
    if (!m) { log('DIAG НЕ НАЙДЕН — страница могла не догрузиться'); process.exitCode = 1; return; }
    log(m[1].trim());
    // автоассерты по ключевым инвариантам
    const d = m[1];
    const asserts = [
      [/main\.ds-split: yes/, 'main.ds-split'],
      [/TOC links: (\d+)/, 'TOC'],
      [/code-out lengths: (?!-|\/|-?\/)\d+\/\d+\/\d+/, 'код заполнен'],
    ];
    let bad = 0;
    for (const [re, label] of asserts) {
      const okk = re.test(d);
      log((okk ? 'PASS' : 'FAIL') + '  автоассерт: ' + label);
      if (!okk) bad++;
    }
    log(bad === 0 ? 'ВЕРДИКТ: OK' : `ВЕРДИКТ: FAIL (${bad})`);
    process.exitCode = bad === 0 ? 0 : 1;
  } finally {
    try { await unlink(diagPath); } catch { /* уже удалён */ }
    try { await rm(profile, { recursive: true, force: true }); } catch { /* профиль мог не создаться */ }
  }
}

/* ---------------- map ---------------- */

async function parsePage(filePath) {
  const t = await readUtf8(filePath);
  const name = path.basename(filePath, '.html');
  const sections = [];
  const re = /<section class="section"([^>]*)>/g;
  let m;
  while ((m = re.exec(t))) {
    const lbl = (m[1].match(/data-screen-label="([^"]*)"/) || [])[1];
    sections.push(lbl || '?');
  }
  const ctor = t.includes('id="pg-controls"') ? 'dynamic'
    : /class="ctl-group"/.test(t) ? 'grouped'
    : /pg__controls/.test(t) ? 'static' : '—';
  const demo = (t.match(/id="(pg-stage|demo-[a-z0-9-]+)"/i) || [])[1] || '—';
  const pageJs = [...t.matchAll(/src="[^"]*\/([a-z0-9-]+\.page\.js)"/g)].map((x) => x[1]);
  const cssMap = await loadCssMap();
  const css = cssMap[name] || '—';
  const status = /class="page ds-split"/.test(t) ? '✅' : '⬜';
  return { name, sections, ctor, demo, pageJs: pageJs.join(', ') || '—', css, status };
}

async function cmdMap() {
  const cssMap = await loadCssMap();
  const lines = [];
  lines.push('---');
  lines.push('belongs_to: docs-split');
  lines.push('purpose: Структурная карта doc-страниц IBP. Читай карту вместо файла целиком. Генерируется командой map, руками не править.');
  lines.push('generated: ' + new Date().toISOString().slice(0, 10));
  lines.push('---');
  lines.push('');
  lines.push('# Карта страниц документации');
  lines.push('');
  lines.push('Статус: ✅ — раскатано на docs-split, ⬜ — старый формат. Конструктор: dynamic — контролы строит page.js в `#pg-controls` (docs-split.js сам делает две колонки); static — разметка `.ctl-col`/`.toggles` вручную; grouped — `.ctl-group` с двумя колонками в каждой.');
  lines.push('');

  for (const dir of PAGE_DIRS) {
    const dirPath = path.join(DS, 'pages', dir);
    if (!existsSync(dirPath)) continue;
    const files = (await readdir(dirPath)).filter((f) => f.endsWith('.html'));
    if (!files.length) continue;
    lines.push(`## ${dir[0].toUpperCase() + dir.slice(1)} (${files.length})`);
    lines.push('');
    lines.push('| Страница | Конструктор | Демо | page.js | CSS | Секций | Статус |');
    lines.push('|---|---|---|---|---|---|---|');
    for (const f of files.sort()) {
      const info = await parsePage(path.join(dirPath, f));
      lines.push(`| ${info.name} | ${info.ctor} | ${info.demo} | ${info.pageJs} | ${info.css} | ${info.sections.length} | ${info.status} |`);
    }
    lines.push('');
  }
  lines.push('<!-- Примечания (дописывать руками при необходимости) -->');
  lines.push('');

  await writeUtf8(PAGES_INDEX, lines.join('\n'));
  log('== map ==');
  log('pages-index.md перегенерирован: ' + path.relative(ROOT, PAGES_INDEX));
  process.exit(0);
}

/* ---------------- main ---------------- */

const args = process.argv.slice(2);
const cmd = args[0];
if (!cmd) {
  log('Использование: node docs-split.mjs <map|scaffold|inject|rollout|check|verify> [page] [--css styles/x.css] [--html]');
  process.exit(1);
}
const pageArg = args.slice(1).find((a) => !a.startsWith('--'));
const cssIdx = args.indexOf('--css');
const explicitCss = cssIdx >= 0 ? args[cssIdx + 1] : null;
const wantHtml = args.includes('--html');

try {
  if (cmd === 'map') await cmdMap();
  else if (cmd === 'scaffold') await cmdScaffold(pageArg);
  else if (cmd === 'inject') await cmdInject(pageArg, explicitCss, wantHtml);
  else if (cmd === 'rollout') await cmdRollout(pageArg);
  else if (cmd === 'check') await cmdCheck(pageArg);
  else if (cmd === 'verify') await cmdVerify(pageArg);
  else fail(`неизвестная команда: ${cmd}`);
} catch (e) {
  fail(e.message);
}
