#!/usr/bin/env node
/* ============================================================
   LAYOUT-CHECK — статическая проверка раскладки экрана из Projects/test/.
   Замена скриншотной проверки вёрстки: никакого браузера,
   никакого рендера, никакого запуска Chrome. Чистый Node.

   Два класса проверок:
     механика   — блокеры screen-review (Б*): точные, строковые/структурные;
                   в том числе Б24/Б25 — усечение в таблице без браузера:
                   помещается ли значение в свою колонку и не шире ли строка
                   контентной области (уроки Л28–Л30, ~7px/символ body-s).
     геометрия  — блокеры composition-review (K*): вычисленные
                   из токенов styles/*.css + эвристика ширины
                   символа (~8px body-m кириллица, ~7px body-xs).

   ФАКТИЧЕСКИЙ СОСТАВ ПРОВЕРОК ЗДЕСЬ НЕ ПЕРЕЧИСЛЯЕТСЯ — его печатает
   сам сенсор: `layout-check.mjs --rules`. Прозаическое перечисление уже
   разъезжалось с кодом в трёх файлах сразу (урок Л43).

   ОГРАНИЧЕНИЯ (честно, см. ds-rules.md §9):
   - Без рендера не ловятся реальные рендер-баги: сломанная
     flex-цепочка, фактический overflow. Это компенсируется
     марковочными правилами (скролл-контейнер обязан
     flex:1;min-height:0;overflow-y:auto и т.п.) — их проверяет
     ревьюер по screen-review (К3 и каскад CSS).
   - Метрики, зависящие от ширины текста (K1, K2.1), — оценки
     по эвристике; при значении, близком к порогу, вывод
     «проверить вручную».

   Запуск (из корня репо):
     node .opencode/skills/screen-review/tooling/layout-check.mjs <путь к <Имя>.html> [--width 1920]

   Код выхода: 0 — блокеров нет (замечания допустимы), 1 — есть FAIL.
   ============================================================ */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { logRun, codesFrom } from './runlog.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const DS = path.join(ROOT, 'DS-IBP');

/* ---------------- токены ДС (источник истины — styles/*.css) ---------------- */

const TOKEN_FILES = [
  'styles/spacing.css',
  'styles/layout.css',
  'styles/tile.css',
  'styles/nav-panel.css',
];

function loadTokens() {
  const raw = {};
  for (const f of TOKEN_FILES) {
    const p = path.join(DS, f);
    if (!existsSync(p)) continue;
    const text = readFileSync(p, 'utf8');
    const re = /--([a-z0-9][a-z0-9-]*)\s*:\s*([^;]+);/g;
    let m;
    while ((m = re.exec(text))) {
      const name = m[1];
      const val = m[2].trim();
      if (!(name in raw)) raw[name] = val; // первое определение побеждает
    }
  }
  const get = (name) => {
    let v = raw[name];
    const seen = new Set();
    while (v && v.startsWith('var(') && !seen.has(v)) {
      seen.add(v);
      const inner = v.match(/^var\((--[a-z0-9-]+)/);
      if (!inner) break;
      v = raw[inner[1]];
    }
    return v;
  };
  return { get };
}

const T = loadTokens();
const px = (name, fallback) => {
  const v = T.get(name);
  const m = v && v.match(/(\d+(?:\.\d+)?)px/);
  return m ? parseFloat(m[1]) : fallback;
};

/* геометрические константы (из токенов ДС) */
const RAIL_W = px('--nav-rail-w', 56);
const PAD_X = px('--layout-pad-x', 24);         // поля контентной области (space-24)
const TILE_PAD_X = px('--tile-pad-x', 20);
const TILE_GAP = px('--tile-gap-col', 16);       // gap сетки и рядов (space-16)
const ROW_H = 40;                                // метка body-xs (16) + 4 + значение body-m (20)
const ROW_GAP = 16;
const CELL_MIN = 240;                            // K5: минимальная ширина ячейки
const CHAR_W_VALUE = 8;                          // body-m 16px, кириллица (эвристика composition-review)
const CHAR_W_LABEL = 7;                          // body-xs
const HEADER_H = 50;                             // шапка тайла (~padding 20/10 + заголовок h5)
const PAD_BOTTOM = 24;                           // --tile-pad-bottom
const PAD_TOP = 10;                              // .tile__body padding-top

/* ---------------- helpers ---------------- */

function log(msg) { process.stdout.write(msg + '\n'); }
function fail(msg) { log('ОШИБКА: ' + msg); process.exit(2); }

function lineOf(text, index) {
  return text.slice(0, index).split('\n').length;
}

/* сбалансированный элемент от индекса '<tag' */
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

function stripTags(s) {
  return s.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/* Значение атрибута — литерал, а не половина JS-выражения.

   Сенсор читает разметку ВМЕСТЕ со скриптами: класс и имя иконки, которые
   рисует рантайм страницы, употреблены по-настоящему. Плата — строки вида
   `'<i data-icon="' + name + '">'`: регулярка `attr="([^"]+)"` обрывается на
   первой кавычке и отдаёт кусок выражения. От настоящего значения он
   синтаксически неотличим, поэтому отсекается весь атрибут, а не токен.

   Цена названа честно: значение, собранное из кусков, сенсор не проверяет
   вовсе — для этого нужен разбор JS. Общий помощник, а не заплатка по месту:
   один и тот же дефект вылез сперва у Б4, потом у Б2 (уроки Л70, Л74). */
function isLiteralAttr(v) {
  return !/['"+?()]/.test(v);
}

/* ---------------- разбор разметки ---------------- */

/* все тайлы (класс-токен ровно «tile»); opts: inRange, fullText, baseOffset, stackRanges */
function extractTiles(html, opts = {}) {
  const { inRange, fullText, baseOffset = 0, stackRanges = [] } = opts;
  const tiles = [];
  const tagRe = /<([a-z]+)\s[^>]*class="([^"]*)"[^>]*>/g;
  let m;
  while ((m = tagRe.exec(html))) {
    const tokens = m[2].split(/\s+/).filter(Boolean);
    if (!tokens.includes('tile')) continue; // tile-group/tile-row/tile-stack не тайлы
    const tag = m[1];
    const el = sliceTag(html, m.index, tag);
    if (!el) continue;
    if (inRange && !inRange(m.index)) continue;
    const absIdx = baseOffset + m.index;
    const inStack = stackRanges.some((r) => absIdx >= r.idx && absIdx < r.idx + r.html.length);
    tiles.push(analyzeTile(el, lineOf(fullText || html, absIdx), inStack));
  }
  return tiles;
}

function parseTiles(html) {
  const rows = [];
  const rowRe = /<div class="tile-row[^"]*"/g;
  let m;
  while ((m = rowRe.exec(html))) {
    const idx = m.index;
    const rowHtml = sliceTag(html, idx, 'div');
    if (!rowHtml) continue;
    rows.push({
      html: rowHtml, idx, line: lineOf(html, idx),
      tiles: extractTiles(rowHtml, { fullText: html, baseOffset: idx, stackRanges: [] }),
    });
  }
  /* стопки (kanban): ширина тайла задаётся стопкой, не самим тайлом */
  const stackRanges = [];
  const stackRe = /<div class="tile-stack[^"]*"/g;
  while ((m = stackRe.exec(html))) {
    const idx = m.index;
    const st = sliceTag(html, idx, 'div');
    if (!st) continue;
    stackRanges.push({ html: st, idx });
  }
  const standalone = extractTiles(html, {
    inRange: (i) => !rows.some((r) => i >= r.idx && i < r.idx + r.html.length),
    fullText: html,
    baseOffset: 0,
    stackRanges,
  });
  return { rows, standalone, stackRanges };
}

function analyzeTile(el, line, inStack = false) {
  const open = el.match(/^<[a-z]+\s[^>]*class="([^"]*)"/);
  const cls = open ? open[1] : '';
  const styleM = el.match(/<[a-z]+\s[^>]*style="([^"]*)"/);
  const style = styleM ? styleM[1] : '';

  /* ширина: inline grid-column:span N > col-N > colw-N */
  let span = null;
  const sp = style.match(/grid-column\s*:\s*span\s*(\d+)/);
  if (sp) span = parseInt(sp[1], 10);
  if (span === null) { const c = cls.match(/\bcol-(\d+)\b/); if (c) span = parseInt(c[1], 10); }
  if (span === null) { const c = cls.match(/\bcolw-(\d+)\b/); if (c) span = parseInt(c[1], 10); }

  const titleM = el.match(/class="tile__title"[^>]*>([^<]*)</);
  const title = titleM ? titleM[1].trim() : '(без заголовка)';

  /* сетка полей: первая .tile__grid (сбалансированно) */
  let cols = null;
  let gridHtml = '';
  const gRe = /<div class="tile__grid([^"]*)"([^>]*)>/g;
  const gm = gRe.exec(el);
  if (gm) {
    const rep = gm[2].match(/grid-template-columns\s*:\s*repeat\((\d+)/);
    if (rep) cols = parseInt(rep[1], 10);
    const g = sliceTag(el, gm.index, 'div');
    if (g) gridHtml = g;
  }
  const body = gridHtml || el;

  /* поля .rof (сбалансированно); ровно токен «rof», не rof__row */
  const fields = [];
  const rofRe = /<div class="rof(\s[^"]*)?"[^>]*>/g;
  let fm;
  while ((fm = rofRe.exec(body))) {
    const r = sliceTag(body, fm.index, 'div');
    if (!r) continue;
    const fCls = (fm[1] || '').split(/\s+/).filter(Boolean);
    const full = fCls.includes('tile__grid-full');
    const clamp = /rof__value--clamp-n/.test(r);
    const labelM = r.match(/class="ds-label__text"[^>]*>([^<]*)</);
    const valM = r.match(/<span class="rof__value[^"]*"[^>]*>([\s\S]*?)<\/span>/);
    const value = valM ? stripTags(valM[1]).trim() : '';
    fields.push({
      full, clamp,
      label: labelM ? labelM[1].trim() : '',
      value,
      hasPbar: /\bpbar\b/.test(r),
      hasChips: /rof__value--chips/.test(r),
    });
  }

  /* прямые тяжёлые вставки в сетке (pbar вне .rof) */
  const directPbars = (body.match(/class="pbar\b/g) || []).length;

  return { el, line, span, title, cols, fields, directPbars, inStack };
}

/* ---------------- механика (Б-блокеры) ---------------- */

function checkMechanics(html, icons, pagePath) {
  const res = [];
  const ok = (cond, label, line) => res.push({ ok: !!cond, label, line, level: cond ? 'ok' : 'fail' });
  const warn = (label, line) => res.push({ ok: false, label, line, level: 'warn' });

  /* Комментарий — не разметка. Без этого сторож считал живым всё, что просто
     УПОМЯНУТО в комментарии: `<!-- повесить data-table -->` закрывал Б13, а
     `<!-- нет сброса body { margin: 0 } -->` закрывал Б22 — ложный PASS на
     ровном месте. Вскрыто фикстурами (lessons-cli verify), класс Л48:
     правило верное, вход не отфильтрован.
     Исключение — `raw`: заглушки (Б9) ищем и в комментариях, «TODO» там
     означает незаконченный экран ровно так же. */
  const raw = html;
  const blank = (m) => m.replace(/[^\n]/g, ' ');   // гасим текст, сохраняя нумерацию строк
  html = html.replace(/<!--[\s\S]*?-->/g, blank);
  /* Без комментариев, но СО скриптами: имя иконки в JS-шаблоне — настоящее
     употребление, его надо валидировать по Icons.md; имя в комментарии —
     нет. Промежуточный срез нужен именно для этого (Б2). */
  const noComments = html;
  /* Собственный <style> экрана — общий вход нескольких правил (Б4, Б29, З10,
     K12). Берётся из `raw`: <style> целиком, без гашения. Объявлен здесь, а не
     у первого потребителя: правило, которому вход понадобился вторым, иначе
     заводит свою копию разбора, и копии расходятся (Л43). */
  const styleSrc = [...raw.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join('\n');
  /* Содержимое <script> — тоже не разметка. JS-шаблон
     `'<div class="tbl__row" style="grid-template-columns:' + GRID + '">'`
     выглядел для сторожа готовой строкой таблицы, а `data-table` в строке
     кода закрывал Б13 так же, как это делал комментарий. Открывающий тег
     оставляем: по нему Б1 считает `<script src="…ds.js">`. */
  html = html.replace(/(<script\b[^>]*>)([\s\S]*?)(<\/script>)/gi, (m, open, inner, close) => open + blank(inner) + close);

  /* Б1 подключения. Путь к ds.css НЕ фиксирован по числу уровней: экраны лежат
     на разной глубине (`Projects/test/` → `../../DS-IBP/ds.css`,
     `Projects/post/<направление>/<экран>/` → `../../../../DS-IBP/ds.css`).
     Раньше здесь была зашита строка `../../../ds.css` — путь структуры до
     переезда ДС в `DS-IBP/` (01.09.2026), из-за чего Б1 падал на ЛЮБОМ экране
     репозитория, включая заведомо правильные из `Projects/test/`. */
  const dsCssLinks = (html.match(/href="[^"]*\bds\.css"/g) || []);
  ok(dsCssLinks.length === 1,
    `Б1 ровно один ds.css (${dsCssLinks.length})`);
  ok((html.match(/scripts\/ds\.js/g) || []).length === 1,
    `Б1 ровно один scripts/ds.js (${(html.match(/scripts\/ds\.js/g) || []).length})`);
  ok(!/href="[^"]*styles\//.test(html), 'Б1 нет поштучных styles/* (только ds.css)');
  ok(!/src="[^"]*scripts\/ds-[a-z-]+\.js/.test(html), 'Б1 нет поштучных scripts/ds-*');

  /* Б2 иконки */
  ok(!/<svg[\s>]/.test(html), 'Б2 нет инлайн-<svg>');
  /* Значения атрибутов берутся из разметки СО скриптами — имя иконки в
     JS-шаблоне употреблено по-настоящему. Но атрибут, собранный склейкой
     (`data-icon="' + name + '"`), регулярка обрывает на первой кавычке и
     выдаёт кусок выражения за имя. Отсеивается весь такой атрибут: половина
     JS-выражения не является значением (тот же приём, что у Б4). */
  const used = [...noComments.matchAll(/data-icon="([^"]+)"/g)].map((m) => m[1]).filter(isLiteralAttr);
  const unknown = [...new Set(used.filter((n) => !icons.has(n)))];
  ok(unknown.length === 0,
    unknown.length ? `Б2 неизвестные иконки: ${unknown.join(', ')}` : `Б2 иконки из списка Icons.md (${used.length} шт.)`);

  /* Б3 цвета */
  const hexes = [...html.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((m) => lineOf(html, m.index));
  ok(hexes.length === 0, hexes.length ? `Б3 #hex на строках: ${[...new Set(hexes)].join(', ')}` : 'Б3 нет #hex — цвета токенами');
  const rgbs = [...html.matchAll(/rgba?\(/g)].map((m) => lineOf(html, m.index));
  ok(rgbs.length === 0, rgbs.length ? `Б3 rgb() на строках: ${[...new Set(rgbs)].join(', ')}` : 'Б3 нет rgb()');

  /* Б5 каркас */
  for (const [cls, label] of [['nav-layout', '.nav-layout'], ['class="nav ', '.nav'], ['class="screen', '.screen'], ['class="crumbs', '.crumbs'], ['screen__content', 'main.screen__content']]) {
    ok(html.includes(cls), `Б5 каркас: ${label}`);
  }

  /* Б6 заголовок */
  const h1s = [...html.matchAll(/<h1\b/g)].length;
  ok(h1s === 1 && /phead__title/.test(html), `Б6 ровно один h1 в .phead__title (${h1s})`);

  /* Б14 свои классы ширины */
  const classes = [...html.matchAll(/class="([^"]+)"/g)].flatMap((m) => m[1].split(/\s+/)).filter(Boolean);
  const customW = [...new Set(classes.filter((c) =>
    (/-(half|full|col\d+)$/.test(c) || /-(half|full|col\d+)-/.test(c))
    && !/^col-\d+$/.test(c) && !/^colw-\d+$/.test(c)
    && !/^tile__grid-full$/.test(c) && !/__/.test(c)
  ))];
  ok(customW.length === 0, customW.length ? `Б14 свои классы ширины: ${customW.join(', ')}` : 'Б14 ширина тайлов — span/col-*');

  /* Б16 зазоры рядов руками */
  const rowStyle = [...html.matchAll(/<div class="tile-row[^"]*"[^>]*style="([^"]*)"/g)].map((m) => lineOf(html, m.index));
  ok(rowStyle.length === 0, rowStyle.length ? `Б16 margin/gap на .tile-row (строки ${rowStyle.join(', ')})` : 'Б16 зазоры рядов держит .tile-group');
  const rowCss = [...html.matchAll(/\.tile-row\s*\{[^}]*\b(margin|gap)\b[^}]*\}/g)].map((m) => lineOf(html, m.index));
  ok(rowCss.length === 0, rowCss.length ? `Б16 свой CSS зазора .tile-row (строки ${rowCss.join(', ')})` : 'Б16 нет своего CSS зазора .tile-row');

  /* Б9 заглушки */
  const ph = [...raw.matchAll(/Lorem|TODO|XXX|здесь будет|заглушк/ig)].map((m) => lineOf(raw, m.index));
  ok(ph.length === 0, ph.length ? `Б9 заглушки на строках: ${[...new Set(ph)].join(', ')}` : 'Б9 контент отрисован, заглушек нет');

  /* Б13 хуки рантаймов */
  /* Таблицы проверяются ПОЭЛЕМЕНТНО, а не по наличию хука где-нибудь на
     странице. Общая проверка «есть .tbl и есть data-table» пропускала экран
     с несколькими таблицами, из которых захукана одна: остальные оставались
     мёртвыми, а сторож рапортовал «компонент + хук ✓». Вскрыто фикстурой
     Б13 после того, как в эталон добавили корректную таблицу. */
  const tableRoots = [...html.matchAll(/<div[^>]*class="[^"]*\btbl\b[^"]*"[^>]*>/g)];
  const unhooked = tableRoots.filter((m) => !/data-table/.test(m[0])).map((m) => lineOf(html, m.index));
  if (tableRoots.length) {
    ok(unhooked.length === 0, unhooked.length
      ? `Б13 таблица без хука data-table на строках: ${unhooked.join(', ')} (${unhooked.length} из ${tableRoots.length}) — сортировка, выбор строк и тянущиеся колонки не заработают`
      : `Б13 class="tbl": компонент + хук ✓ (таблиц ${tableRoots.length})`);
  }

  const hookPairs = [
    ['modal-scrim', 'data-modal'],
    // class="tabs: НО НЕ .tabs--vert — вертикальные табы-ЯКОРИ (TableFilter .tfm__nav)
    // переключают не вьюхи, а прокрутку к секции (aria-current scroll-spy), по спеке
    // Tab они НЕ role="tablist" и data-tabs им НЕ нужен (урок Л39).
    ['role="tablist"', 'data-tabs'],
    ['segctrl', 'data-segctrl'],
    ['riskmetric', 'data-riskmetric'],
    ['tile--accordion', 'tile__toggle'],
  ];
  const anchorTabs = /class="tabs[^"]*--vert/.test(html);
  const horizTabs = /class="tabs[^"]*--horiz/.test(html) || html.includes('class="tabs"');
  const dataTabsPresent = html.includes('data-tabs');
  for (const [comp, hook] of hookPairs) {
    const hasComp = comp === 'role="tablist"' ? html.includes(comp) : (comp === 'class="tabs' ? (horizTabs && !anchorTabs) : html.includes(comp));
    const hasHook = html.includes(hook);
    if (comp === 'class="tabs' && anchorTabs && !horizTabs) { ok(true, 'Б13 якорные табы (tabs--vert): data-tabs не нужен ✓'); continue; }
    if (hasComp && !hasHook) ok(false, `Б13 ${comp} есть, хука ${hook} нет`);
    else if (!hasComp && hasHook) ok(false, `Б13 хук ${hook} есть, компонента нет (мёртвый) — проверить`);
    else ok(true, `Б13 ${comp || hook}: ${hasComp ? 'компонент + хук ✓' : 'нет'}`);
  }

  /* Б10 подозрительные фиксированные ширины (>=100px), без max-/min- и без @media/@container */
  const widthHits = [...html.matchAll(/(?<![\w-])width\s*:\s*(\d{3,})px/g)].filter((m) => {
    const l = html.slice(0, m.index).split('\n').pop();
    return !/@(container|media)/.test(l);
  });
  const widthLines = widthHits.map((m) => lineOf(html, m.index));
  if (widthLines.length) warn(`Б10 фиксированные width >=100px на строках: ${[...new Set(widthLines)].join(', ')} (проверить: не блоки сетки)`);

  /* Б17 pbar--floating */
  const floats = [...html.matchAll(/pbar--floating/g)].map((m) => lineOf(html, m.index));
  if (floats.length && !/вероятност|скор|probab/i.test(html)) {
    warn(`Б17 pbar--floating на строках ${floats.join(', ')} — контекст не похож на «вероятность/скор» (проверить)`);
  }

  /* Б21 селекторы «тег+класс компонента» в <style> перебивают состояния
     (урок Л23: button.<класс>{background:none} побеждает .класс--selected) */
  const styleText = (html.match(/<style[\s>][\s\S]*?<\/style>/g) || []).join('\n');
  const tagClsSel = [...styleText.matchAll(/(?:^|\n)\s*(?:button|a|input)\.[a-z0-9_-]+\s*\{/g)]
    .map((m) => m[0].replace(/\s*\{\s*$/, '').trim());
  ok(tagClsSel.length === 0,
    tagClsSel.length ? `Б21 селекторы тег+класс компонента в <style>: ${[...new Set(tagClsSel)].join(', ')} (перебивают состояния — ds-rules §4)` : 'Б21 нет button./a./input. селекторов в <style> (состояния не перебиты)');

  /* Б22 сброс body margin (урок Л26: без него UA-дефолт 8px → рамка по периметру
     и горизонтальный скролл; экран обязан собираться из шаблона с body-reset) */
  const bodyReset = /body\s*\{[^}]*margin\s*:\s*0/.test(html);
  ok(bodyReset, bodyReset ? 'Б22 body { margin: 0 } сброшен' : 'Б22 нет сброса body { margin: 0 } (UA-дефолт 8px → рамка и скролл)');

  /* Б23 классы документационного слоя на экране мертвы (урок Л27: их даёт
     только ds-docs.css, а экран подключает ds.css). Проверка по точным
     токенам класса, чтобы не цеплять tc--numbers и т.п. */
  const docTokens = ['desc', 'tight', 'panel', 'masthead', 'lead', 'eyebrow', 'claim', 'note', 'bullets', 'rules', 'guide', 'subhead'];
  const usedDoc = [];
  for (const m of html.matchAll(/class="([^"]+)"/g)) {
    for (const tok of m[1].split(/\s+/)) {
      if (docTokens.includes(tok) && !usedDoc.includes(tok)) usedDoc.push(tok);
    }
  }
  ok(usedDoc.length === 0,
    usedDoc.length ? `Б23 док-классы на экране (нет в ds.css): ${usedDoc.join(', ')}` : 'Б23 нет классов документационного слоя');

  /* Б24/Б25 — усечение в таблице, проверяемое БЕЗ браузера.

     Почему статикой: рендер в контуре компании недоступен (ds-rules §9), а
     класс дефектов дорогой — 04.09.2026 усечение в таблицах ломалось тремя
     разными способами, и все три выглядели как правильная разметка
     (уроки Л28–Л30). Меряем не «стоит ли класс», а помещается ли текст.

     Эвристика та же, что у K1/K2.1: ~7px на символ для body-s (шрифт ячейки
     .tc — --type-body-s 14/16). Запас 15% — при значении около порога
     выводим замечание, а не блокер (правило §9 «близко к порогу — проверить
     вручную»).

     Что НЕ ловится статикой и закрыто линтером ds-lint по CSS: обёртка
     рантайма, отключающая усечение (B9, урок Л28), и компонент с усекаемой
     подписью, который не умеет сжиматься (B8, урок Л29). */
  const CHAR_W_CELL = 7;                   // body-s 14px, кириллица
  const CELL_PAD = 32;                     // .tc padding 16 + 16
  const TRUNC_HARD = 1.5;                  // усечено больше трети — колонка систематически узка

  const bleed = [];
  const tight = new Map();                 // колонка → сколько значений усекается жёстко
  let rowsChecked = 0;

  for (const row of html.matchAll(/<div class="tbl__row[^"]*"[^>]*style="[^"]*grid-template-columns:([^;"]+)[^>]*>([\s\S]*?)(?=<div class="tbl__row|<\/div>\s*<\/div>)/g)) {
    const tracks = row[1].trim().split(/\s+(?![^(]*\))/);
    const cells = [...row[2].matchAll(/<div class="(tc[^"]*)"[^>]*>([\s\S]*?)<\/div>/g)];
    if (!cells.length) continue;
    rowsChecked++;
    const rowLine = lineOf(html, row.index);

    cells.forEach((cell, i) => {
      const track = tracks[i];
      if (!track || !/^\d+(\.\d+)?px$/.test(track)) return;   // fr/minmax/auto — ширина неизвестна
      const cls = cell[1];
      if (/tc--wrap/.test(cls)) return;                        // перенос разрешён явно — растёт по высоте
      const inner = cell[2];
      const textEl = inner.match(/<span class="(tc__text[^"]*)"[^>]*>([^<]*)</);
      if (!textEl) return;
      const value = textEl[2].trim();
      if (!value || value === '—') return;
      const avail = parseFloat(track) - CELL_PAD;
      const est = value.length * CHAR_W_CELL;
      if (est <= avail) return;
      const truncates = /tc__text--truncate/.test(textEl[1]);
      const item = `строка ${rowLine}, колонка ${i + 1} (${track}): «${value.slice(0, 28)}» ~${est}px / ${Math.round(avail)}px`;
      if (!truncates) bleed.push(item);
      else if (est > avail * TRUNC_HARD) {
        const key = `колонка ${i + 1} (${track})`;
        tight.set(key, (tight.get(key) || 0) + 1);
      }
    });
  }

  if (rowsChecked) {
    ok(bleed.length === 0, bleed.length
      ? `Б24 значение шире своей колонки и без .tc__text--truncate — текст выйдет за ячейку, а непрозрачный фон соседней обрежет его без многоточия: ${bleed.slice(0, 3).join(' · ')}`
      : `Б24 значения помещаются в колонки или усечены (${rowsChecked} строк)`);
    for (const [col, n] of tight) {
      warn(`Б24 ${col}: ${n} из ${rowsChecked} значений теряют больше трети текста — колонка систематически узка; расширить или подтвердить, что смысл читается по началу строки и тултипа достаточно`);
    }
  }

  /* Б25 — строка шире контентной области, а таблица не прокручивается:
     хвост колонок физически недостижим (статический аналог урока Л30). */
  for (const row of html.matchAll(/<div class="tbl__row[^"]*"[^>]*style="[^"]*grid-template-columns:([^;"]+)/g)) {
    const tracks = row[1].trim().split(/\s+(?![^(]*\))/);
    if (!tracks.every((t) => /^\d+(\.\d+)?px$/.test(t))) continue;   // есть fr/minmax — строка тянется
    const sum = tracks.reduce((a, t) => a + parseFloat(t), 0);
    const scrollable = /class="[^"]*\btbl--scroll\b/.test(html) || /class="[^"]*\bdtable__body\b/.test(html);
    if (sum > 1816 && !scrollable) {
      ok(false, `Б25 строка ${lineOf(html, row.index)}: сумма колонок ${Math.round(sum)}px шире контентной области, а горизонтального скролла нет (.tbl--scroll / .dtable__body) — хвост колонок недостижим`);
    }
    break;   // достаточно одной строки: треки у всех одинаковые (Б8)
  }

  /* Б26 валюта — только 3-буквенным кодом ISO 4217 (редполитика, Redpolicy
     04.09.2026): символы ₽/$/€/¥ и «руб.» на экране запрещены. */
  const curHits = [...html.matchAll(/[₽$€¥]|руб\./g)].map((m) => lineOf(html, m.index));
  ok(curHits.length === 0,
    curHits.length ? `Б26 валюта символом/«руб.» на строках: ${[...new Set(curHits)].join(', ')} (только код ISO 4217 — RUB/USD/EUR/JPY)` : 'Б26 валюта — кодами ISO 4217 (символов и «руб.» нет)');

  /* Б8 — сетка строки совпадает с сеткой шапки, по краям разделители.
     Строка с другим числом треков сдвигает все данные на колонку: значение
     уезжает в 8px-желоб, заголовки перестают соответствовать столбцам
     (урок Л22 — «бардак в таблицах» на JS-рендере). Считаем только строки,
     объявившие треки: остальные наследуют сетку от контейнера. */
  const gridRows = [...html.matchAll(/<div class="(tbl__row[^"]*)"[^>]*style="[^"]*grid-template-columns:([^;"]+)/g)]
    .map((m) => ({ cls: m[1], tracks: m[2].trim().split(/\s+(?![^(]*\))/), line: lineOf(html, m.index) }));
  if (gridRows.length > 1) {
    const head = gridRows.find((r) => /--head/.test(r.cls)) || gridRows[0];
    const off = gridRows.filter((r) => r.tracks.length !== head.tracks.length);
    ok(off.length === 0, off.length
      ? `Б8 число колонок расходится с шапкой (${head.tracks.length}) на строках: ${off.map((r) => `${r.line}→${r.tracks.length}`).join(', ')} — данные сдвинутся на колонку`
      : `Б8 сетка строк совпадает с шапкой (${head.tracks.length} треков, строк ${gridRows.length})`);
  }
  const sepRows = [...html.matchAll(/<div class="tbl__row[^"]*"[^>]*>([\s\S]*?)(?=<div class="tbl__row|<\/div>\s*<\/div>)/g)];
  const noSep = sepRows.filter((m) => {
    const cells = [...m[1].matchAll(/<div class="(t[hc][^"]*)"/g)].map((c) => c[1]);
    return cells.length > 2 && !(/--separator/.test(cells[0]) && /--separator/.test(cells[cells.length - 1]));
  }).map((m) => lineOf(html, m.index));
  if (sepRows.length) {
    ok(noSep.length === 0, noSep.length
      ? `Б8 нет краевых ячеек-разделителей на строках: ${[...new Set(noSep)].slice(0, 5).join(', ')} (строка обязана начинаться и кончаться .tc--separator / .th--separator)`
      : `Б8 краевые разделители на месте (${sepRows.length} строк)`);
  }

  /* Б30 — липкую шапку держит sticky на СТРОКЕ (.dtable__body .tbl >
     .tbl__row--head), а не на ячейке .th: у ячейки блок-контейнер смещения —
     сама строка, по вертикали двигаться некуда, и шапка уезжает при прокрутке
     тела. По горизонтали то же правило работает, поэтому на закреплении
     колонок дефект не виден (урок Л46, Table 1.013). */
  if (/dtable__body/.test(html)) {
    const hasHeadRow = /tbl__row[^"]*--head/.test(html);
    ok(hasHeadRow, hasHeadRow
      ? 'Б30 строка шапки несёт .tbl__row--head — липкая шапка работает по вертикали'
      : 'Б30 в .dtable__body нет строки с классом .tbl__row--head — sticky повиснет на ячейке и шапка уедет при прокрутке тела');
  }

  /* З3 — у кнопки-иконки нет видимого текста, поэтому имя ей даёт только
     aria-label; без него скринридер читает пустую кнопку. */
  const iconBtns = [...html.matchAll(/<button[^>]*class="[^"]*\bibtn\b[^"]*"[^>]*>/g)];
  const mute = iconBtns.filter((m) => !/aria-label\s*=/.test(m[0])).map((m) => lineOf(html, m.index));
  if (iconBtns.length) {
    if (mute.length) warn(`З3 кнопки-иконки без aria-label на строках: ${[...new Set(mute)].slice(0, 8).join(', ')} (${mute.length} из ${iconBtns.length})`);
    else ok(true, `З3 у всех кнопок-иконок есть aria-label (${iconBtns.length})`);
  }

  /* З7 — модалка лежит в конце body и скрыта до открытия, триггер помечен
     data-modal. Видимая при загрузке модалка перекрывает экран. */
  const scrims = [...html.matchAll(/<div[^>]*class="[^"]*\bmodal-scrim\b[^"]*"[^>]*>/g)];
  if (scrims.length) {
    const shown = scrims.filter((m) => !/\bhidden\b/.test(m[0])).map((m) => lineOf(html, m.index));
    if (shown.length) warn(`З7 .modal-scrim без атрибута hidden на строках: ${shown.join(', ')} — модалка видна при загрузке`);
    else ok(true, `З7 модалки скрыты атрибутом hidden (${scrims.length})`);
    const hasTrigger = /data-modal/.test(html);
    if (!hasTrigger) warn('З7 модалка есть, а триггера data-modal нет — открыть её нечем');
  }

  /* Б15 — размерный модификатор берётся из спеки компонента, а не «похожий».
     Закрыты ИМЕНОВАННЫЕ случаи самого пункта: бургер/пин/выход NavPanel и
     действия в шапке тайла — все `ibtn--m` (NavPanel.md, Tile.md: «IconButton
     размер M, 20×20»). Неназванные случаи остаются суждением: «совпадает со
     спекой» без перечня — это сверка каждого компонента с его спекой, а не
     строковая проверка. */
  const sizedM = [];
  for (const hook of ['nav__burger', 'nav__pin', 'nav__logout']) {
    const rx = new RegExp('<button[^>]*class="([^"]*\\b' + hook + '\\b[^"]*)"', 'g');
    for (const m of html.matchAll(rx)) {
      if (!/\bibtn--m\b/.test(m[1])) sizedM.push(`.${hook} (строка ${lineOf(html, m.index)})`);
    }
  }
  for (const acts of html.matchAll(/<div[^>]*class="[^"]*\btile__actions\b[^"]*"[^>]*>/g)) {
    const inner = tagRange(html, acts.index, 'div').inner;
    for (const b of inner.matchAll(/<button[^>]*class="([^"]*\bibtn\b[^"]*)"/g)) {
      if (!/\bibtn--m\b/.test(b[1])) sizedM.push(`кнопка в .tile__actions (строка ${lineOf(html, acts.index)})`);
    }
  }
  if (sizedM.length) {
    ok(false, `Б15 размер не по спеке (положен ibtn--m): ${[...new Set(sizedM)].slice(0, 6).join(', ')}`);
  }

  /* Б29 — выравнивание пагинатора держит CSS ДС (`margin-left:auto` на
     `.pgn-row__right`, независимое центрирование `.pgn__pagesize`), а не
     разметка экрана. Проверяется ровно эта половина пункта: собственный
     `<style>` не выравнивает пагинатор руками. Структурную половину («правый
     блок на месте») сторожу не отдаём — на реальном экране колонтитул строит
     рантайм `DSPagination.footer`, и `.pgn-row` в разметке нет вовсе. */
  for (const st of raw.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) {
    const css = st[1];
    const at = st.index + st[0].indexOf(css);
    for (const rule of css.matchAll(/([^{}]*\b(?:pgn-row__right|pgn__pagesize|pgn-row__left)\b[^{}]*)\{([^{}]*)\}/g)) {
      if (!/margin|align|justify|position|float/.test(rule[2])) continue;
      warn(`Б29 пагинатор выравнивается вручную (строка ${lineOf(raw, at + rule.index)}): «${rule[1].trim()}» — это держит CSS ДС; ручная правка разъедется с компонентом`);
    }
  }

  /* З2 — сортировка: активна не больше чем у одной колонки, и у кнопки
     сортировки есть непустой ключ. Пустой `data-sort` уходит в событие
     `sort`, и бэкенд получает запрос без поля сортировки. */
  const sorted = [...html.matchAll(/aria-sort="(ascending|descending)"/g)];
  if (sorted.length > 1) {
    warn(`З2 сортировка активна у ${sorted.length} колонок (строки ${sorted.map((m) => lineOf(html, m.index)).join(', ')}) — одновременно активной может быть одна`);
  }
  const emptyKeys = [...html.matchAll(/<button[^>]*class="[^"]*\bth__sort\b[^"]*"[^>]*>/g)]
    .filter((m) => !/data-sort="[^"]+"/.test(m[0]))
    .map((m) => lineOf(html, m.index));
  if (emptyKeys.length) {
    warn(`З2 .th__sort без непустого data-sort на строках: ${emptyKeys.join(', ')} — ключ уходит в событие sort, пустой означает «сортировать неизвестно по чему»`);
  }

  /* З10 — на экране больше одного ряда тайлов, а правила перестроения нет:
     на узкой раскладке ряды останутся в 12 колонок и уедут за кромку. */
  const tileRows = [...html.matchAll(/class="[^"]*\btile-row\b[^"]*"/g)].length;
  if (tileRows > 1 && !/@container\s+screen\s*\(/.test(styleSrc)) {
    warn(`З10 рядов тайлов ${tileRows}, а правила перестроения нет — нужен @container screen (max-width: …) в <style> экрана`);
  }

  /* Б18 — элемент на всю ширину сетки живёт ВНУТРИ .tile__grid и несёт
     .tile__grid-full. Вынесенный рядом с сеткой блок тащит свои паддинги и
     разъезжается с колонками соседних полей (урок Л62: паттерн не искали —
     изобрели замену).

     Считаем структурно, а не по классу: из тела тайла вырезаются поддеревья
     .tile__grid, и если в остатке осталось поле (.rof / .rof__label) — оно
     стоит рядом с сеткой. Шапка .tile__head полей не содержит и остатку не
     мешает. */
  const strayFields = [];
  for (const t of html.matchAll(/<section[^>]*class="[^"]*\btile\b[^"]*"[^>]*>/g)) {
    const inner = tagRange(html, t.index, 'section').inner;
    if (!/\btile__grid\b/.test(inner)) continue;      // тайл без сетки полей — таблица, график
    let rest = inner;
    for (let guard = 0; guard < 50; guard++) {
      const g = rest.match(/<div[^>]*class="[^"]*\btile__grid\b[^"]*"[^>]*>/);
      if (!g) break;
      const r = tagRange(rest, g.index, 'div');
      rest = rest.slice(0, g.index) + rest.slice(r.end);
    }
    if (/class="rof(?:\s|")/.test(rest)) strayFields.push(lineOf(html, t.index));
  }
  if (strayFields.length) {
    ok(false, `Б18 тайлы на строках ${[...new Set(strayFields)].join(', ')}: поле стоит рядом с .tile__grid, а не внутри неё — элемент на всю ширину оформляется классом .tile__grid-full ВНУТРИ сетки`);
  } else if (/\btile__grid\b/.test(html)) {
    ok(true, 'Б18 все поля тайлов лежат внутри .tile__grid');
  }

  /* З5 — единый порядок ДД.ММ.ГГГГ по всей ДС. Разнобой в датах читается как
     разные источники данных и провоцирует ошибку на месяц/день (Л47).
     Ловим три расхожие подмены; двузначный год отсекаем по границе цифры,
     иначе `20.04.2024` совпадёт своим началом. */
  const badDates = [];
  for (const [rx, what] of [
    [/\b\d{4}-\d{2}-\d{2}\b/g, 'ISO ГГГГ-ММ-ДД'],
    [/\b\d{2}\/\d{2}\/\d{4}\b/g, 'через дробь ДД/ММ/ГГГГ'],
    [/\b\d{2}\.\d{2}\.\d{2}(?!\d)/g, 'двузначный год ДД.ММ.ГГ'],
  ]) {
    for (const m of html.matchAll(rx)) badDates.push(`«${m[0]}» (${what}, строка ${lineOf(html, m.index)})`);
  }
  if (badDates.length) warn(`З5 дата не в формате ДД.ММ.ГГГГ: ${[...new Set(badDates)].slice(0, 6).join(' · ')}`);

  /* З6 — шапка страницы: не больше трёх кнопок, и ровно одна главная.
     Проверка на btn--accent включается, только когда в шапке есть текстовые
     кнопки: шапка из одних кнопок-иконок главной не имеет и требовать её
     от неё — шум. */
  for (const h of html.matchAll(/<div[^>]*class="[^"]*\bphead__actions\b[^"]*"[^>]*>/g)) {
    const inner = tagRange(html, h.index, 'div').inner;
    const line = lineOf(html, h.index);
    const all = [...inner.matchAll(/<button\b/g)].length;
    const text = [...inner.matchAll(/class="[^"]*\bbtn\b[^"]*"/g)].length;
    const accent = [...inner.matchAll(/class="[^"]*\bbtn--accent\b[^"]*"/g)].length;
    if (all > 3) warn(`З6 шапка (строка ${line}): ${all} кнопок — больше трёх, вторичные действия убираются в меню`);
    if (text >= 1 && accent !== 1) {
      warn(`З6 шапка (строка ${line}): текстовых кнопок ${text}, главных (btn--accent) ${accent} — главная обязана быть ровно одна`);
    }
  }

  /* З9 — у таблицы описано состояние «данных нет». Пустая таблица без
     EmptyState выглядит как сломанная загрузка: пользователь не отличает
     «ничего не нашлось» от «не отрисовалось».

     Два условия, без которых правило врёт (обнаружено прогоном по
     `Portfolio.html`, класс Л48 — правило верное, вход не отфильтрован):
     · строки может строить рантайм, а содержимое <script> здесь погашено —
       поэтому «строк в разметке нет» само по себе не значит «таблица пуста»;
       смотрим в `raw`, собирает ли страница строки скриптом;
     · EmptyState в ДС — это `.es` (styles/empty-state.css), а не выдуманный
       `.empty-state`; проверка по несуществующему классу дала бы находку на
       экране, где состояние как раз описано. */
  const rowsFromJs = [...raw.matchAll(/tbl__row/g)].length > [...html.matchAll(/tbl__row/g)].length;
  for (const b of html.matchAll(/<div[^>]*class="[^"]*\bdtable__body\b[^"]*"[^>]*>/g)) {
    const inner = tagRange(html, b.index, 'div').inner;
    const rows = [...inner.matchAll(/class="[^"]*\btbl__row\b[^"]*"/g)].length;
    const heads = [...inner.matchAll(/class="[^"]*\btbl__row--head\b[^"]*"/g)].length;
    if (rows - heads > 0 || rowsFromJs) continue;         // данные есть в разметке или их строит рантайм
    const hasEmpty = /class="[^"]*\bes\b[^"]*"|\bdtable__empty\b|data-empty/.test(html);
    if (!hasEmpty) {
      warn(`З9 таблица (строка ${lineOf(html, b.index)}) без строк данных, а состояния «данных нет» на экране нет — нужен EmptyState (.es) или .dtable__empty`);
    }
  }

  /* Пункт К10 («остатки flex-раскладки конструктора в <style>») жил здесь
     один заход и переехал в линтер правилом R4. Причина: его предмет —
     страница документации, а сенсор такую страницу не принимает вовсе (на
     ней первыми падают Б1 и Б5 — «нет каркаса экрана»). Правило было
     написано, доказано фикстурой и при этом не могло сработать ни разу:
     на экране `.pg__controls` не бывает. Держать его в двух местах нельзя —
     у правила один владелец (Л43). */

  /* Б4 — класс, которого нет ни в ДС, ни в собственном <style>, не падает и
     ничем себя не выдаёт: блок просто рендерится без оформления. Это самый
     дешёвый способ нарушить главное правило проекта («ничего не выдумывать»),
     потому что выглядит как рабочая разметка.

     Вход: разметка БЕЗ комментариев, но СО скриптами — класс, который вешает
     рантайм страницы, употреблён по-настоящему. Токены с ${} — куски шаблона,
     не классы. */
  const dsClasses = new Set();
  const stylesDir = path.join(DS, 'styles');
  if (existsSync(stylesDir)) {
    for (const f of readdirSync(stylesDir).filter((n) => n.endsWith('.css'))) {
      for (const m of readFileSync(path.join(stylesDir, f), 'utf8').matchAll(/\.(-?[a-zA-Z][\w-]*)/g)) dsClasses.add(m[1]);
    }
  }
  for (const m of styleSrc.matchAll(/\.(-?[a-zA-Z][\w-]*)/g)) dsClasses.add(m[1]);

  /* Хуки рантаймов: класс без собственных правил в CSS, по которому работает
     скрипт ДС, — не опечатка. `.nav__burger` правил не имеет вовсе, но его
     ищет `ds-nav-panel.js`; без этого шага Б4 объявил бы дефектом рабочую
     разметку на трёх экранах сразу. Набор паттернов зеркалит `collectHooks`
     линтера — разъедутся, и два правила заспорят об одном классе. */
  const scriptsDir = path.join(DS, 'scripts');
  if (existsSync(scriptsDir)) {
    for (const f of readdirSync(scriptsDir).filter((n) => n.endsWith('.js'))) {
      const src = readFileSync(path.join(scriptsDir, f), 'utf8');
      for (const m of src.matchAll(/closest\(\s*['"]\.([\w-]+)/g)) dsClasses.add(m[1]);
      for (const m of src.matchAll(/querySelector(?:All)?\(\s*['"][^'"]*\.([\w-]+)/g)) dsClasses.add(m[1]);
      for (const m of src.matchAll(/classList\.(?:add|remove|toggle|contains)\(\s*['"]([\w-]+)/g)) dsClasses.add(m[1]);
    }
  }

  /* Вход — разметка без комментариев, но СО скриптами: класс, который вешает
     рантайм страницы, употреблён по-настоящему.

     Плата за это — склейка в JS. Атрибут `class="tc' + (extra ? ' ' + extra : '') + '"`
     обрывается регуляркой на первой кавычке, и в разбор попадают имена
     ПЕРЕМЕННЫХ — `extraClass`, `tone`, `sel`. От опечатки в классе они
     синтаксически неотличимы, поэтому отсекается не токен, а весь атрибут:
     значение со следами конкатенации (кавычка, `+`, скобка, `?`) в разбор
     не идёт. Класс, собранный из кусков, при этом теряется — граница
     признаётся честно, ловить его пришлось бы разбором JS. */
  const isIdent = (c) => /^-?[a-zA-Z][\w-]*$/.test(c);
  const invented = [];
  const seenCls = new Set();
  for (const m of noComments.matchAll(/class="([^"]+)"/g)) {
    if (!isLiteralAttr(m[1])) continue;                  // склейка в JS, а не список классов
    for (const c of m[1].split(/\s+/)) {
      if (!c || seenCls.has(c) || !isIdent(c)) continue;
      seenCls.add(c);
      if (dsClasses.has(c) || CLASS_IGNORE.has(c)) continue;
      if (/^(is-|has-|js-)/.test(c)) continue;            // состояния и хуки ставит рантайм
      invented.push(`.${c} (строка ${lineOf(noComments, m.index)})`);
    }
  }
  if (dsClasses.size) {
    ok(invented.length === 0, invented.length
      ? `Б4 классов нет ни в styles/*.css, ни в <style> экрана: ${invented.slice(0, 8).join(', ')}${invented.length > 8 ? ` и ещё ${invented.length - 8}` : ''} — блок отрисуется без оформления`
      : `Б4 все классы разметки существуют в ДС или в <style> экрана (${seenCls.size})`);
  }

  /* Б12 — рядом с экраном лежит `<Имя>.screen.md` с заполненной YAML-шапкой.
     Без него приёмка не знает, что экран обязан показывать, и сверяет
     разметку сама с собой.

     О фикстурах: спутник заведён только у эталона (`_base.ok.screen.md`).
     На остальных фикстурах Б12 срабатывает — и это верно, они не экраны;
     «ровно один дефект» у корпуса держится по каждой проверке отдельно,
     а не по каждому файлу. */
  if (pagePath) {
    /* Имя спутника не всегда совпадает с именем файла: экран может лежать в
       своей папке как `index.html`, а спека называться по экрану
       (`mainPage/index.html` ↔ `mainPage/mainPage.screen.md`). Поэтому,
       не найдя пару по имени, ищем в той же папке спеку, чья YAML-строка
       `file:` указывает на эту страницу — связь объявлена в самой спеке,
       и гадать по имени незачем. */
    const dir = path.dirname(pagePath);
    let spec = pagePath.replace(/\.html$/i, '.screen.md');
    if (!existsSync(spec)) {
      const rel = path.relative(ROOT, pagePath).replace(/\\/g, '/');
      const near = readdirSync(dir).filter((n) => n.endsWith('.screen.md'));
      const owner = near.find((n) => {
        const m = readFileSync(path.join(dir, n), 'utf8').match(/^file:\s*(.+)$/m);
        return m && m[1].trim().replace(/\\/g, '/').endsWith(path.basename(pagePath)) && rel.endsWith(m[1].trim().replace(/\\/g, '/'));
      });
      if (owner) spec = path.join(dir, owner);
    }
    if (!existsSync(spec)) {
      ok(false, `Б12 рядом нет ${path.basename(pagePath).replace(/\.html$/i, '.screen.md')} и ни одна спека в папке не объявляет этот файл строкой file: — приёмке не с чем сверять состав экрана`);
    } else {
      const head = readFileSync(spec, 'utf8').split(/\r?\n/);
      const closed = head.indexOf('---', 1);
      const keys = closed > 0 ? head.slice(1, closed).filter((l) => /^[a-z_]+:\s*\S/.test(l)).length : 0;
      ok(head[0] === '---' && keys >= 2, keys >= 2 && head[0] === '---'
        ? `Б12 спутник ${path.basename(spec)} на месте, полей в шапке ${keys}`
        : `Б12 у ${path.basename(spec)} нет заполненной YAML-шапки (полей ${keys}) — шапка и есть то, что читает приёмка`);
    }
  }

  /* К12 — на реестре-экране (таблица без тайлов) главная таблица занимает
     свободную высоту: `.screen--app` + `.dtable--fill`. Иначе таблица растёт
     по числу строк, а страница скроллится целиком — шапка и колонтитул
     уезжают. Экраны с тайлами над таблицей правило не трогает: там высота
     разбирается индивидуально (оговорка самого пункта). */
  if (/class="[^"]*\bdtable\b/.test(html) && !/class="[^"]*\btile\b/.test(html)) {
    const app = /class="[^"]*\bscreen--app\b/.test(html);
    const fill = /class="[^"]*\bdtable--fill\b/.test(html);
    const miss = [!app && '.screen--app на .screen', !fill && '.dtable--fill на .dtable'].filter(Boolean);
    ok(miss.length === 0, miss.length
      ? `К12 реестр-экран без растяжки таблицы по высоте: нет ${miss.join(' и ')} — таблица вырастет по числу строк, шапка и колонтитул уедут со страницей`
      : 'К12 таблица реестра растянута по высоте (.screen--app + .dtable--fill)');
  }

  /* K12 — адаптивное правило, перебитое инлайн-стилем на том же элементе,
     не сработает никогда: инлайн выигрывает у любого селектора без
     !important. Узкая раскладка тихо не отрабатывает. */
  for (const at of [...styleSrc.matchAll(/@container[^{]*\{/g)]) {
    const body = braceBody(styleSrc, at.index + at[0].length - 1);
    for (const rule of body.matchAll(/\.([\w-]+)[^{}]*\{([^{}]*)\}/g)) {
      const cls = rule[1];
      for (const decl of rule[2].matchAll(/([a-z-]+)\s*:/g)) {
        const prop = decl[1];
        const rx = new RegExp('<[^>]*class="[^"]*\\b' + cls + '\\b[^"]*"[^>]*style="[^"]*\\b' + prop + '\\s*:', 'g');
        for (const hit of html.matchAll(rx)) {
          warn(`K12 @container задаёт ${prop} для .${cls}, а на элементе (строка ${lineOf(html, hit.index)}) тот же ${prop} стоит инлайн — адаптивное правило не сработает никогда`);
        }
      }
    }
  }

  return res;
}

/* Тело блока от открывающей `{` на позиции `at` до парной `}`. Нужно там, где
   у правила есть вложенность: @container содержит обычные правила, и наивный
   `[^}]*` обрывается на первой же внутренней скобке. */
function braceBody(src, at) {
  let depth = 0;
  for (let i = at; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) return src.slice(at + 1, i); }
  }
  return src.slice(at + 1);
}

/* Классы, которые не принадлежат ни одному компоненту ДС и живут в разметке
   как общие слова. Список зеркалит CLASS_IGNORE линтера — если он разъедется,
   Б4 и правило A2 начнут спорить об одном и том же классе. */
const CLASS_IGNORE = new Set(['page', 'section', 'masthead', 'meta', 'lead', 'eyebrow', 'crumb', 'desc', 'panel', 'row', 'col', 'grid', 'card', 'note', 'name', 'c', 'n', 'is-off']);

/* Содержимое парного тега и его конец — надстройка над `sliceTag`, который
   уже умеет считать глубину. Отдельный разборщик здесь заводить нельзя: два
   парсера одной разметки разъедутся на первом же исключении (урок Л43,
   у правила один владелец). Нужно там, где важна ВЛОЖЕННОСТЬ, а не совпадение
   строки: Б18 отличает поле внутри сетки от поля рядом с ней. */
function tagRange(src, at, tag) {
  const el = sliceTag(src, at, tag);
  if (!el) return { inner: src.slice(src.indexOf('>', at) + 1), end: src.length };
  const open = el.indexOf('>') + 1;
  const close = el.lastIndexOf('</');
  return { inner: el.slice(open, close), end: at + el.length };
}

/* ---------------- геометрия (K-блокеры) ---------------- */

function runGeometry(rows, standalone, width) {
  const contentW = width - RAIL_W - 2 * PAD_X;
  const colW = (contentW - 11 * TILE_GAP) / 12;
  const tileW = (n) => n * colW + (n - 1) * TILE_GAP;
  const inner = (n) => tileW(n) - 2 * TILE_PAD_X;
  const k5 = (n) => Math.max(1, Math.min(4, Math.floor(inner(n) / CELL_MIN)));
  const cellW = (tileN, cols) => (inner(tileN) - (cols - 1) * TILE_GAP) / cols;

  function rowsOf(t, cols) {
    const fields = t.fields.filter((f) => !f.full);
    const fullRows = t.fields.filter((f) => f.full).length;
    return Math.ceil(fields.length / cols) + fullRows + t.directPbars;
  }
  function heightOf(t) {
    if (t.span === null) return 0;
    const cols = t.cols || k5(t.span);
    const rows = rowsOf(t, cols);
    return HEADER_H + PAD_TOP + rows * ROW_H + (rows - 1) * ROW_GAP + PAD_BOTTOM;
  }

  function analyzeTile(t) {
    const out = [];
    if (t.span === null && t.inStack) {
      const cols = t.cols || '—';
      out.push({ level: 'info', label: `«${t.title}» (строка ${t.line}): в стопке (tile-stack) — ширина от стопки, полей ${t.fields.length}, колонок ${cols} — ширинные проверки (K1/K4/K5) неприменимы` });
      return out;
    }
    if (t.span === null) {
      out.push({ level: 'fail', label: `тайл «${t.title}» (строка ${t.line}): ширина не читается (нет span/col-N)` });
      return out;
    }
    const fields = t.fields.filter((f) => !f.full);
    const tw = tileW(t.span);
    const inn = inner(t.span);
    let cols = t.cols;
    const k5rec = k5(t.span);
    if (cols === null && t.fields.length > 0) {
      out.push({ level: 'warn', label: `«${t.title}»: нет repeat(N) в .tile__grid — колонки не читаются, взять K5=${k5rec}` });
      cols = k5rec;
    } else if (cols === null) {
      cols = k5rec; // тайл без сетки полей (таблица/список) — колонки не нужны
    }
    const cw = cellW(t.span, cols);

    /* K5: ширина ячейки */
    if (t.cols !== null && t.cols > k5rec) {
      out.push({ level: 'warn', label: `K5 «${t.title}»: ${t.cols} колонки → ячейка ${Math.round(cw)}px < ${CELL_MIN}px (рекомендация ${k5rec})` });
    } else if (t.cols !== null && t.cols < k5rec && fields.length >= 4) {
      out.push({ level: 'warn', label: `K5 «${t.title}»: ${t.cols} колонки при рекомендации ${k5rec} — помещается больше` });
    }

    /* K4: ширина по объёму */
    const fcount = t.fields.length;
    const hasTable = /class="tbl|chart-host/.test(t.el);
    const expected = hasTable ? 12 : (fcount >= 10 ? 8 : fcount >= 6 ? 6 : fcount >= 3 ? 4 : 4);
    if (t.span < expected && t.span <= 4) {
      out.push({ level: 'fail', label: `K4 «${t.title}» (строка ${t.line}): ${fcount} полей на ${t.span} колонках — положено от ${expected} (поля переносятся)` });
    } else if (t.span === 12 && fcount <= 5 && !hasTable) {
      out.push({ level: 'warn', label: `K4 «${t.title}»: тайл на всю ширину под ${fcount} полей — пустота справа` });
    }

    /* K9: сколько полей помещается в один тайл, прежде чем он перестаёт
       читаться. Пороги из чек-листа композиции: до 10 — норма, 11–12 —
       замечание (нужна подгруппировка), 13 и больше — блокер.

       Реализована ЧИСЛОВАЯ половина пункта. Вторая половина — «блоков в зоне
       не больше 7–8» — не закрыта: «зона» структурно не определена (ряд?
       экран? визуальный блок?), и додумывать её значило бы запрещать то, что
       не запрещено (урок Л72). Разрыв объявлен в coverage.json. */
    if (fcount >= 13) {
      out.push({ level: 'fail', label: `K9 «${t.title}» (строка ${t.line}): ${fcount} полей в одном тайле — от 13 читается как список, а не как карточка; разбить или сгруппировать` });
    } else if (fcount >= 11) {
      out.push({ level: 'warn', label: `K9 «${t.title}»: ${fcount} полей — нужна подгруппировка (подзаголовок, разделитель) либо разбиение на два тайла` });
    }

    /* K2 / K2.1: длинные значения */
    for (const f of fields) {
      if (!f.value) continue;
      const estW = f.value.length * CHAR_W_VALUE;
      const lines = Math.ceil(estW / cw);
      if (lines >= 2) {
        if (f.full || f.clamp) continue;
        out.push({
          level: lines >= 3 ? 'fail' : 'warn',
          label: `K2.1 «${t.title}» (строка ${t.line}): «${f.value.slice(0, 20)}…» ~${estW}px / ячейка ${Math.round(cw)}px → ~${lines} строк — дать .tile__grid-full или clamp`,
        });
      }
    }

    /* K1: пустота у правой кромки (оценка по эвристике) */
    if (!(cols === 1 && t.span <= 4) && fields.length) {
      const colWidest = new Array(cols).fill(0);
      let i = 0;
      for (const f of fields) {
        const w = Math.max(f.label.length * CHAR_W_LABEL, f.value.length * CHAR_W_VALUE);
        if (w > colWidest[i % cols]) colWidest[i % cols] = w;
        i++;
      }
      const lastWidest = colWidest[cols - 1] || 0;
      const air = cw - lastWidest;
      if (air > 0.5 * tw && air > 250) {
        out.push({ level: 'fail', label: `K1 «${t.title}» (строка ${t.line}): воздух ~${Math.round(air)}px > 250px и > половины тайла — оценка, проверить вручную` });
      } else if (air > 200) {
        out.push({ level: 'warn', label: `K1 «${t.title}»: воздух ~${Math.round(air)}px (близко к порогу)` });
      }
    }

    const rows = rowsOf(t, cols);
    out.push({ level: 'info', label: `«${t.title}»: span ${t.span} → ${Math.round(tw)}px (внутр. ${Math.round(inn)}), колонок ${cols} (K5=${k5rec}), полей ${t.fields.length} → ~${rows} строк, высота ~${Math.round(heightOf(t))}px` });

    return out;
  }

  const results = [];
  for (const row of rows) {
    let sum = 0;
    const parts = [];
    for (const t of row.tiles) {
      if (t.span === null) continue;
      sum += t.span;
      parts.push(`${t.title}(${t.span})`);
      results.push(...analyzeTile(t));
    }
    /* Метка с идентификатором Б7 — иначе проверка есть, а в `--rules` и в
       отчёте покрытия её не видно, и пункт числится незакрытым (класс Л50). */
    results.push({ level: sum === 12 ? 'info' : 'fail', label: `Б7 ряд (строка ${row.line}): ${parts.join(' + ')} = ${sum} ${sum === 12 ? '✓' : '≠ 12'}` });
  }
  for (const t of standalone) results.push(...analyzeTile(t));

  /* K6: сопоставимость соседей в ряду (оценка) */
  for (const row of rows) {
    const ts = row.tiles.filter((t) => t.span !== null);
    for (let i = 0; i < ts.length; i++) {
      for (let j = i + 1; j < ts.length; j++) {
        const a = heightOf(ts[i]);
        const b = heightOf(ts[j]);
        const diff = Math.abs(a - b);
        if (diff > 160) {
          results.push({ level: 'warn', label: `K6 (оценка) «${ts[i].title}» vs «${ts[j].title}» (строка ${row.line}): расхождение ~${diff}px (>160) — вероятная несопоставимость, проверить` });
        } else if (diff > 120) {
          results.push({ level: 'warn', label: `K6 (оценка) «${ts[i].title}» vs «${ts[j].title}» (строка ${row.line}): расхождение ~${diff}px — на грани (порог 120), проверить` });
        }
      }
    }
  }

  return { results, colW, contentW };
}

/* ---------------- --rules: фактический список реализованных проверок ----------------
   Источник истины — сам файл: идентификатор, стоящий В НАЧАЛЕ строкового литерала
   метки. Комментарии и кросс-ссылки на чужое пространство имён (каскад К3 из
   screen-review) сюда не попадают — они литерал не начинают.
   Зачем: перечисление проверок прозой уже разошлось в трёх местах (ds-rules §9,
   screen-review/SKILL.md, MAINTAINING.md) — урок Л43, одно правило у нескольких
   владельцев. Описание заменяется вызовом команды. */
function printRules() {
  const src = readFileSync(fileURLToPath(import.meta.url), "utf8");
  const found = new Map();
  /* Ряды идентификаторов: Б — блокеры, З — замечания (оба screen-review),
     К — каскад screen-review, K — геометрия composition-review. Кириллические
     и латинские буквы здесь визуально почти неразличимы, поэтому они заданы
     кодовыми точками, а не начертанием: Б U+0411, З U+0417, К U+041A. */
  const NS = {
    'Б': 'сенсор:Б — блокеры (чек-лист screen-review)',
    'З': 'сенсор:З — замечания (чек-лист screen-review)',
    'К': 'сенсор:К — каскад (чек-лист screen-review)',
    'K': 'сенсор:K — геометрия (чек-лист composition-review)',
  };
  for (const m of src.matchAll(/['"`]\s*([БЗКK]\d{1,2}(?:\.\d)?)(?!\d)/gu)) {
    const id = m[1];
    const ns = NS[id[0]];
    if (!found.has(ns)) found.set(ns, new Set());
    found.get(ns).add(id);
  }
  const num = (x) => parseFloat(x.replace(/^[^0-9]+/, ""));
  log("== layout-check: реализованные проверки ==");
  for (const [ns, set] of found) {
    log("");
    log(ns + ":");
    log("  " + [...set].sort((a, b) => num(a) - num(b)).join(" "));
  }
  log("");
  log("Якорь для журнала уроков пишется с пространством имён: сенсор:Б24, сенсор:K1.");
  log("Кириллическая Б и латинская K — разные ряды; латинские B* принадлежат ds-lint.js.");
}

/* ---------------- main ---------------- */

function main() {
  const args = process.argv.slice(2);
  if (args.includes("--rules")) { printRules(); return; }
  const pageArg = args.find((a) => !a.startsWith('--'));
  const wIdx = args.indexOf('--width');
  const width = wIdx >= 0 ? parseInt(args[wIdx + 1], 10) : 1920;
  if (!pageArg) fail('использование: node layout-check.mjs <путь к <Имя>.html> [--width 1920]');
  const p = path.resolve(ROOT, pageArg);
  if (!existsSync(p)) fail(`файл не найден: ${pageArg}`);
  const html = readFileSync(p, 'utf8');
  const name = path.basename(p);

  /* иконки из specs/Icons.md (формат: строка имён через ·) */
  const iconsText = readFileSync(path.join(DS, 'specs', 'Icons.md'), 'utf8');
  const iconsSection = iconsText.slice(iconsText.indexOf('## Все глифы'));
  const icons = new Set(iconsSection.split('·').map((s) => s.trim()).filter(Boolean));

  const mech = checkMechanics(html, icons, p);
  const { rows, standalone } = parseTiles(html);
  const geo = runGeometry(rows, standalone, width);

  const all = [...mech, ...geo.results];
  const fails = all.filter((r) => r.level === 'fail');
  const warns = all.filter((r) => r.level === 'warn');

  /* Печатаемое собирается в массив: из него же берутся сработавшие коды для
     журнала прогонов. Разбирать собственный отчёт дешевле, чем вести второй
     перечень идентификаторов рядом с первым — такие перечни расходятся (Л43). */
  const printed = [];
  const say = (s) => { printed.push(s); log(s); };

  say(`== layout-check ${name} (ширина ${width}) ==`);
  say('[механика]');
  for (const r of mech) say((r.level === 'ok' ? 'PASS  ' : r.level === 'warn' ? 'WARN  ' : 'FAIL  ') + r.label);
  say(`[геометрия] контент ${Math.round(geo.contentW)}px, колонка ${Math.round(geo.colW * 10) / 10}px`);
  for (const r of geo.results) say((r.level === 'info' ? '  ·   ' : r.level === 'warn' ? 'WARN  ' : 'FAIL  ') + r.label);
  say('');
  say(fails.length === 0 ? `ВЕРДИКТ: OK (замечаний: ${warns.length})` : `ВЕРДИКТ: FAIL (${fails.length} блокер, ${warns.length} замечание)`);

  logRun({
    tool: 'сенсор',
    target: p,
    verdict: fails.length === 0 ? 'OK' : 'FAIL',
    codes: codesFrom(printed.join('\n')),
  });
  process.exit(fails.length === 0 ? 0 : 1);
}

main();
