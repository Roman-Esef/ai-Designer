#!/usr/bin/env node
/* ============================================================
   assemble.mjs — сборка экрана направления Post из локальных компонентов.

   Зачем. Страница держит перечень модулей и их место в сетке, а разметка
   модуля живёт в своей папке (`post_local_components/<Имя>/<Имя>.html`).
   Рантайм-инклуд `DS-IBP/scripts/ds-include.js` здесь не годится: он тянет
   фрагмент через `fetch`, а `fetch` по `file://` не работает — страницы же
   открываются двойным кликом. Поэтому аналог `import` — этот ассемблер.

   Что делает:
   - читает источник (`<имя>.html`) и находит метки
     `<ds-include src="…"></ds-include>` (или самозакрывающиеся `… />`);
   - подставляет содержимое файла фрагмента на место метки (путь — от папки
     источника);
   - переносит на корневой элемент фрагмента атрибуты метки: `id`, `class`
     (слияние с классом корня), `state`/`mode` → `data-state`/`data-mode` —
     паритет с рантаймом `ds-include.js`;
   - подключает CSS компонентов: для каждой метки берёт файл рядом с `src`
     (тот же путь, расширение `.css`), если он есть на диске; путь можно
     задать явно атрибутом `css="…"`, а `css="none"` отключает подключение.
     Линки вставляются в `<head>` — после маркера `<!-- @lc-css -->`, если он
     есть, иначе перед `</head>`. Дубли не добавляются;
   - пишет самодостаточный `<имя>.preview.html` — его открывают двойным кликом.

   Фрагмент — чистый кусок разметки с одним корневым элементом: без
   `<html>`/`<head>`/`<link>`/`<script>`. Несоблюдение — ошибка с ненулевым
   кодом выхода.

   Запуск:
     node Projects/post/assemble.mjs                 — собрать все источники направления
     node Projects/post/assemble.mjs <источник> […]   — собрать указанные
   Код выхода: 0 — сборка успешна, 1 — ошибка.
   ============================================================ */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
/* Предикат «в файле есть метка сборки» — общий с оснасткой приёмки: витрина
   показывает `<ds-include>` примером кода во вкладке «Код», и по подстроке
   пример неотличим от настоящей метки. Владелец разбора один (Л43); там же
   причина, по которой вырезаются скрипты и <pre>. */
import { hasActiveInclude } from '../../.opencode/skills/screen-review/tooling/fragments.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));

const TAG_OPEN_RE = /<ds-include\b[^>]*>/gi;   // открывающая метка (в т.ч. самозакрывающаяся)
const ATTR_RE = /([a-zA-Z-]+)\s*=\s*"([^"]*)"/g;
const CSS_MARKER = '<!-- @lc-css -->';

function fail(msg) {
  console.error('assemble: ОШИБКА: ' + msg);
  process.exit(1);
}

/* Разобрать атрибуты тега в объект. */
function parseAttrs(tag) {
  const attrs = {};
  let m;
  ATTR_RE.lastIndex = 0;
  while ((m = ATTR_RE.exec(tag)) !== null) {
    attrs[m[1].toLowerCase()] = m[2];
  }
  return attrs;
}

/* Найти в фрагменте открывающий тег корневого элемента: пропускает комментарии
   и декларации <!…>, возвращает { start, end } границ тега или null. */
function findRootTag(text) {
  let i = 0;
  while (i < text.length) {
    const lt = text.indexOf('<', i);
    if (lt === -1) return null;
    if (text.startsWith('<!--', lt)) {
      const close = text.indexOf('-->', lt + 4);
      if (close === -1) return null;
      i = close + 3;
      continue;
    }
    if (text.startsWith('<!', lt) || text.startsWith('<?', lt)) {
      const gt = text.indexOf('>', lt);
      if (gt === -1) return null;
      i = gt + 1;
      continue;
    }
    // это тег элемента: ищем закрывающую '>', не внутри кавычек
    let quote = null;
    let j = lt + 1;
    for (; j < text.length; j++) {
      const ch = text[j];
      if (quote) { if (ch === quote) quote = null; continue; }
      if (ch === '"' || ch === "'") { quote = ch; continue; }
      if (ch === '>') break;
    }
    if (j >= text.length) return null;
    return { start: lt, end: j + 1 };
  }
  return null;
}

/* Убрать атрибут из открывающего тега, не трогая остальные. Разбор посимвольный,
   а не регуляркой по тегу: регулярка здесь легко портится при правке, а цена
   ошибки — молча испорченный тег. */
function stripAttr(tagText, name) {
  const lower = tagText.toLowerCase();
  const needle = name.toLowerCase();
  let from = 1;
  while (from < tagText.length) {
    const at = lower.indexOf(needle, from);
    if (at === -1) return tagText;
    let j = at + needle.length;
    while (j < tagText.length && /\s/.test(tagText[j])) j++;
    // имя атрибута отделено пробелом слева и знаком '=' справа
    if (!/\s/.test(tagText[at - 1]) || tagText[j] !== '=') { from = at + needle.length; continue; }
    j++;
    while (j < tagText.length && /\s/.test(tagText[j])) j++;
    const quote = tagText[j];
    if (quote !== '"' && quote !== "'") { from = at + needle.length; continue; }
    const close = tagText.indexOf(quote, j + 1);
    if (close === -1) return tagText;
    return tagText.slice(0, at - 1) + tagText.slice(close + 1);
  }
  return tagText;
}

/* Добавить атрибуты в открывающий тег (перед закрывающим '>').
   Прежнее значение атрибута снимается, а не дописывается вторым: два class в
   одном теге браузер читает первым, и ширина тайла из метки молча пропадает.
   Паритет с рантаймом ds-include.js — он тоже присваивает className, не
   добавляет второй атрибут. */
function injectAttrs(tagText, extra) {
  const keys = Object.keys(extra);
  if (!keys.length) return tagText;
  let tag = tagText;
  keys.forEach(function (k) { tag = stripAttr(tag, k); });
  const insert = keys.map(function (k) { return k + '="' + String(extra[k]).trim() + '"'; }).join(' ');
  let head = tag.slice(0, -1).replace(/\s+$/, '');       // без закрывающей '>'
  let tail = '>';
  if (head.endsWith('/')) { head = head.slice(0, -1).replace(/\s+$/, ''); tail = ' />'; }
  return head + ' ' + insert + tail;
}

/* Путь до CSS компонента: атрибут css= перекрывает файл рядом с src.
   Возвращает относительный путь (как его напишет <link>) или null. */
function cssFor(inputDir, src, override) {
  if (override === 'none') return null;
  const rel = override || src.replace(/\.html?$/i, '.css');
  return existsSync(path.resolve(inputDir, rel)) ? rel : null;
}

/* Элементы без закрывающего тега — у них «конец элемента» равен концу
   открывающего тега. Нужен проверке «один корень». */
const VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img',
  'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

/* Где кончается корневой элемент: от его открывающего тега идём с глубиной,
   считая одноимённые вложенные теги. Комментарии и примеры кода пропускаем —
   в них бывает разметка примера. Вернёт -1, если парный закрывающий не нашёлся. */
function findElementEnd(frag, root) {
  const nameMatch = /^<\s*([a-zA-Z][\w-]*)/.exec(frag.slice(root.start, root.end));
  if (!nameMatch) return -1;
  const name = nameMatch[1].toLowerCase();
  if (VOID_TAGS.has(name) || /\/\s*>$/.test(frag.slice(root.start, root.end))) return root.end;

  const re = new RegExp('<\\s*(/?)' + name + '\\b[^>]*>', 'gi');
  const inert = inertRanges(frag);
  const inInert = (pos) => inert.some((r) => pos >= r[0] && pos < r[1]);
  re.lastIndex = root.end;
  let depth = 1;
  let m;
  while ((m = re.exec(frag)) !== null) {
    if (inInert(m.index)) continue;
    if (m[1]) { if (--depth === 0) return m.index + m[0].length; }
    else if (!/\/\s*>$/.test(m[0])) depth++;
  }
  return -1;
}

/* Обработка одной метки: возвращает разметку фрагмента и путь до его файла. */
function loadFragment(inputDir, tag) {
  const attrs = parseAttrs(tag);
  const rel = attrs.src;
  if (!rel) fail('метка без атрибута src: ' + tag.trim());

  const file = path.resolve(inputDir, rel);
  if (!existsSync(file)) fail('не найден файл фрагмента: ' + rel + ' (' + file + ')');

  const raw = readFileSync(file, 'utf8');
  /* BOM снимается по коду символа, а не регуляркой: escape-последовательность
     в исходнике легко теряется при правке через шелл (ds-rules §8) */
  const frag = (raw.charCodeAt(0) === 0xFEFF ? raw.slice(1) : raw).trim();
  if (!frag) fail('фрагмент пуст: ' + rel);
  if (/^<!DOCTYPE/i.test(frag) || /^<html[\s>]/i.test(frag)) {
    fail('фрагмент ' + rel + ' — это целый документ. Фрагмент должен быть куском ' +
         'разметки с одним корневым элементом (без <html>/<head>/<link>/<script>).');
  }

  const root = findRootTag(frag);
  if (!root) fail('во фрагменте нет корневого элемента: ' + rel);

  /* Один корень — требование контракта, но до 20.09.2026 его никто не проверял.
     Цена молчания: сборщик вставляет все корни, а рантайм ds-include.js берёт
     только первый (doc.body.firstElementChild) — один и тот же фрагмент даёт
     разный DOM в сборке и в браузере. */
  const rootEnd = findElementEnd(frag, root);
  if (rootEnd === -1) fail('у корневого элемента фрагмента нет парного закрывающего тега: ' + rel);
  const tail = frag.slice(rootEnd).replace(/<!--[\s\S]*?-->/g, '').trim();
  if (tail) {
    fail('во фрагменте ' + rel + ' больше одного корневого элемента — после корня идёт: ' +
         tail.slice(0, 60).replace(/\s+/g, ' ') + '…');
  }

  // перенос атрибутов метки на корень (паритет с рантаймом ds-include.js)
  const extra = {};
  if (attrs.id) extra.id = attrs.id;
  if (attrs.state) extra['data-state'] = attrs.state;
  if (attrs.mode) extra['data-mode'] = attrs.mode;
  if (attrs['class'] !== undefined) {
    // class корня фрагмента + class метки, без дублей
    const rootTag = frag.slice(root.start, root.end);
    const rootAttrs = parseAttrs(rootTag);
    const merged = [rootAttrs['class'], attrs['class']].filter(Boolean).join(' ').trim();
    if (merged) extra['class'] = merged;
  }

  const rootOpen = frag.slice(root.start, root.end);
  const newOpen = injectAttrs(rootOpen, extra);

  return { html: frag.slice(0, root.start) + newOpen + frag.slice(root.end), file: file };
}

/* Диапазоны, где метка — не метка: HTML-комментарий и содержимое <script>,
   <pre>, <code>. Комментарии считались и раньше; блоки кода добавлены
   20.09.2026 — витрина компонента показывает `<ds-include>` примером кода во
   вкладке «Код», и без этого ассемблер подставлял фрагмент прямо в пример.
   Тот же признак при ОТБОРЕ источников считает `hasActiveInclude` из
   fragments.mjs — разбор один на оба применения (Л43). */
const INERT_BLOCKS = /<(script|pre|code)\b[^>]*>[\s\S]*?<\/\1>/gi;

function inertRanges(text) {
  const ranges = [];
  let i = 0;
  while (i < text.length) {
    const start = text.indexOf('<!--', i);
    if (start === -1) break;
    const end = text.indexOf('-->', start + 4);
    if (end === -1) break;
    ranges.push([start, end + 3]);
    i = end + 3;
  }
  const re = new RegExp(INERT_BLOCKS.source, 'gi');
  let m;
  while ((m = re.exec(text))) ranges.push([m.index, m.index + m[0].length]);
  ranges.sort(function (a, b) { return a[0] - b[0]; });
  return ranges;
}

/* Вставить линки на CSS компонентов в <head>. */
function injectCss(html, hrefs) {
  if (!hrefs.length) return html;
  const links = hrefs
    .map(function (h) { return '<link rel="stylesheet" href="' + h + '">'; })
    .filter(function (l) { return html.indexOf(l) === -1; });
  if (!links.length) return html;

  const block = '\n' + links.join('\n');
  const markerAt = html.indexOf(CSS_MARKER);
  if (markerAt !== -1) {
    const at = markerAt + CSS_MARKER.length;
    return html.slice(0, at) + block + html.slice(at);
  }
  const headAt = html.toLowerCase().indexOf('</head>');
  if (headAt === -1) fail('в источнике нет </head> — некуда вставить CSS компонентов');
  return html.slice(0, headAt) + block.slice(1) + '\n' + html.slice(headAt);
}

/* Раскрыть метки в тексте. Рекурсивно: фрагмент может включать другой фрагмент —
   так переиспользуемый компонент («Общие») попадает внутрь предметного.

   base      — папка, относительно которой считаются src меток ЭТОГО текста.
               У источника это его папка, у фрагмента — папка самого фрагмента:
               компонент пишет пути от себя и не знает, кто его включил.
   sourceDir — папка собираемой страницы. От неё считаются href у <link>, потому
               что резолвятся они браузером относительно .preview.html.
   ctx       — общее на прогон: что вшито, какой CSS собран, счётчик меток.
   stack     — цепочка включений: защита от цикла A → B → A. */
function expand(text, base, sourceDir, ctx, stack) {
  let out = text;
  /* Своя регулярка на каждый вызов. TAG_OPEN_RE хранит lastIndex, и вложенный
     вызов затёр бы позицию внешнего цикла — часть меток осталась бы текстом. */
  const re = new RegExp(TAG_OPEN_RE.source, 'gi');
  /* Инертные диапазоны пересчитываются на каждой итерации, а НЕ один раз по
     исходнику: вставка фрагмента сдвигает все позиции после неё, и настоящая
     метка попадает в устаревший диапазон — её молча пропускают вместе с куском
     страницы. Ловится только счётом вшитых фрагментов, поэтому build() его и
     печатает. */
  let inert = inertRanges(out);

  function inInert(pos) {
    return inert.some(function (r) { return pos >= r[0] && pos < r[1]; });
  }

  while (true) {
    if (++ctx.loops > 500) fail('похоже на бесконечный цикл: больше 500 меток');
    const m = re.exec(out);
    if (!m) break;

    if (inInert(m.index)) {
      // метка — текст внутри комментария или примера кода: пропустить блок
      const range = inert.find(function (r) { return m.index >= r[0] && m.index < r[1]; });
      re.lastIndex = range[1];
      continue;
    }

    const tag = m[0];
    const tagStart = m.index;
    const tagEnd = m.index + tag.length;
    const selfClosing = /\/\s*>$/.test(tag);

    let closeEnd;
    if (selfClosing) {
      closeEnd = tagEnd;
    } else {
      const closeAt = out.indexOf('</ds-include>', tagEnd);
      if (closeAt === -1) fail('не закрыта метка: ' + tag.trim());
      closeEnd = closeAt + '</ds-include>'.length;
    }

    const attrs = parseAttrs(tag);
    const loaded = loadFragment(base, tag);

    if (stack.indexOf(loaded.file) !== -1) {
      fail('цикл включений: ' + stack.concat([loaded.file])
        .map(function (f) { return path.relative(HERE, f).split(path.sep).join('/'); })
        .join(' → '));
    }

    ctx.inlined.push(attrs.src + (attrs.id ? '  (id="' + attrs.id + '")' : ''));

    /* CSS компонента лежит рядом с ним, а href в <link> читается от страницы —
       поэтому путь пересчитывается, а не берётся как написан в метке. Для метки
       верхнего уровня base === sourceDir и строка не меняется. */
    const cssRel = cssFor(base, attrs.src, attrs.css);
    if (cssRel) {
      const href = path.relative(sourceDir, path.resolve(base, cssRel)).split(path.sep).join('/');
      if (ctx.cssHrefs.indexOf(href) === -1) ctx.cssHrefs.push(href);
    }

    // сначала раскрываем вложенные метки — от папки САМОГО фрагмента
    const frag = expand(loaded.html, path.dirname(loaded.file), sourceDir, ctx,
                        stack.concat([loaded.file]));

    out = out.slice(0, tagStart) + frag + out.slice(closeEnd);
    inert = inertRanges(out);
    // фрагмент уже раскрыт целиком — продолжаем за ним
    re.lastIndex = tagStart + frag.length;
  }

  return out;
}

/* Основной цикл замены. */
function assemble(source, inputDir) {
  const ctx = { inlined: [], cssHrefs: [], loops: 0 };
  const out = expand(source, inputDir, inputDir, ctx, []);
  return { html: injectCss(out, ctx.cssHrefs), inlined: ctx.inlined, css: ctx.cssHrefs };
}

/* Собрать один источник. */
function build(inputPath) {
  if (!existsSync(inputPath)) fail('не найден источник: ' + inputPath);
  const outputPath = inputPath.replace(/\.html$/i, '.preview.html');
  const inputDir = path.dirname(inputPath);

  const source = readFileSync(inputPath, 'utf8');
  const { html, inlined, css } = assemble(source, inputDir);

  if (!inlined.length) fail('в источнике нет меток <ds-include>: ' + inputPath);

  writeFileSync(outputPath, html, 'utf8');

  console.log('assemble: ' + path.relative(HERE, inputPath).split(path.sep).join('/') +
              ' — фрагментов ' + inlined.length + ', CSS компонентов ' + css.length);
  inlined.forEach(function (f) { console.log('  – ' + f); });
  console.log('assemble: готово → ' + path.relative(HERE, outputPath).split(path.sep).join('/'));
}

/* Источники направления: целая СТРАНИЦА внутри Projects/post/ с меткой
   <ds-include>. Собранные *.preview.html пропускаются — они результат.

   Условие «это страница» обязательно. С тех пор как фрагмент может включать
   другой фрагмент, метка встречается и во фрагментах — а фрагмент источником не
   является: у него нет <head>, и injectCss уронил бы на нём весь прогон
   («в источнике нет </head>»), либо рядом с компонентом появился бы мусорный
   <Имя>.preview.html. */
function findSources(dir, out) {
  out = out || [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { findSources(full, out); continue; }
    if (!e.isFile() || !/\.html$/i.test(e.name) || /\.preview\.html$/i.test(e.name)) continue;
    const text = readFileSync(full, 'utf8');
    if (!hasActiveInclude(text)) continue;
    if (!/<html[\s>]/i.test(text) && !/^﻿?\s*<!DOCTYPE/i.test(text)) continue;
    out.push(full);
  }
  return out;
}

/* ── запуск ── */
const args = process.argv.slice(2);
const targets = args.length
  ? args.map(function (a) { return path.resolve(process.cwd(), a); })
  : findSources(HERE);

if (!targets.length) fail('в ' + HERE + ' нет источников с метками <ds-include>');
targets.forEach(build);
