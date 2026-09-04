#!/usr/bin/env node
/* ============================================================
   LAYOUT-CHECK — статическая проверка раскладки экрана из Projects/test/.
   Замена скриншотной проверки вёрстки: никакого браузера,
   никакого рендера, никакого запуска Chrome. Чистый Node.

   Два класса проверок:
     механика   — блокеры screen-review (Б1–Б16): точные,
                   строковые/структурные;
     Б24/Б25   — усечение в таблице без браузера: помещается ли значение
                   в свою колонку и не шире ли строка контентной области
                   (уроки Л28–Л30, эвристика ~7px/символ body-s).
     геометрия  — блокеры composition-review (K1–K6): вычисленные
                   из токенов styles/*.css + эвристика ширины
                   символа (~8px body-m кириллица, ~7px body-xs).

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
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

function checkMechanics(html, icons) {
  const res = [];
  const ok = (cond, label, line) => res.push({ ok: !!cond, label, line, level: cond ? 'ok' : 'fail' });
  const warn = (label, line) => res.push({ ok: false, label, line, level: 'warn' });

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
  const used = [...html.matchAll(/data-icon="([^"]+)"/g)].map((m) => m[1]);
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
  const ph = [...html.matchAll(/Lorem|TODO|XXX|здесь будет|заглушк/ig)].map((m) => lineOf(html, m.index));
  ok(ph.length === 0, ph.length ? `Б9 заглушки на строках: ${[...new Set(ph)].join(', ')}` : 'Б9 контент отрисован, заглушек нет');

  /* Б13 хуки рантаймов */
  const hookPairs = [
    ['class="tbl', 'data-table'],
    ['modal-scrim', 'data-modal'],
    ['class="tabs', 'data-tabs'],
    ['role="tablist"', 'data-tabs'],
    ['segctrl', 'data-segctrl'],
    ['riskmetric', 'data-riskmetric'],
    ['tile--accordion', 'tile__toggle'],
  ];
  for (const [comp, hook] of hookPairs) {
    const hasComp = html.includes(comp);
    const hasHook = html.includes(hook);
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

  return res;
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
    results.push({ level: sum === 12 ? 'info' : 'fail', label: `ряд (строка ${row.line}): ${parts.join(' + ')} = ${sum} ${sum === 12 ? '✓' : '≠ 12'}` });
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

/* ---------------- main ---------------- */

function main() {
  const args = process.argv.slice(2);
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

  const mech = checkMechanics(html, icons);
  const { rows, standalone } = parseTiles(html);
  const geo = runGeometry(rows, standalone, width);

  const all = [...mech, ...geo.results];
  const fails = all.filter((r) => r.level === 'fail');
  const warns = all.filter((r) => r.level === 'warn');

  log(`== layout-check ${name} (ширина ${width}) ==`);
  log('[механика]');
  for (const r of mech) log((r.level === 'ok' ? 'PASS  ' : r.level === 'warn' ? 'WARN  ' : 'FAIL  ') + r.label);
  log(`[геометрия] контент ${Math.round(geo.contentW)}px, колонка ${Math.round(geo.colW * 10) / 10}px`);
  for (const r of geo.results) log((r.level === 'info' ? '  ·   ' : r.level === 'warn' ? 'WARN  ' : 'FAIL  ') + r.label);
  log('');
  log(fails.length === 0 ? `ВЕРДИКТ: OK (замечаний: ${warns.length})` : `ВЕРДИКТ: FAIL (${fails.length} блокер, ${warns.length} замечание)`);
  process.exit(fails.length === 0 ? 0 : 1);
}

main();
