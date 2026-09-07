#!/usr/bin/env node
/* ============================================================
   assemble.mjs — сборка экрана из фрагментов (пилот модульной структуры).
   Проект: Projects/test/post/

   Что делает:
   - читает index.html (источник) и находит метки <ds-include src="…"></ds-include>
     (или самозакрывающиеся <ds-include src="…" />);
   - для каждой метки читает файл фрагмента (путь — относительно папки источника),
     подставляет его содержимое на место метки;
   - переносит на корневой элемент фрагмента атрибуты метки id/class (слияние
     class) и state/mode → data-state/data-mode — паритет с рантаймом
     DS-IBP/scripts/ds-include.js;
   - атрибут css="…" сборке не нужен (у страницы один ds.css) и игнорируется;
   - пишет самодостаточный index.preview.html — его открывают двойным кликом.

   Фрагмент — чистый кусок разметки с одним корневым элементом: без
   <html>/<head>/<link>/<script>. Несоблюдение — ошибка с ненулевым кодом выхода.

   Запуск:
     node assemble.mjs [<источник> [<результат>]]
   По умолчанию: index.html → index.preview.html (в папке скрипта).
   Код выхода: 0 — сборка успешна, 1 — ошибка.
   ============================================================ */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

const inputPath = path.resolve(process.cwd(), process.argv[2] || path.join(HERE, 'index.html'));
const outputPath = path.resolve(process.cwd(), process.argv[3] || path.join(HERE, 'index.preview.html'));
const inputDir = path.dirname(inputPath);

const TAG_OPEN_RE = /<ds-include\b[^>]*>/gi;   // открывающая метка (в т.ч. самозакрывающаяся)
const ATTR_RE = /([a-zA-Z-]+)\s*=\s*"([^"]*)"/g;

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

/* Добавить атрибуты в открывающий тег (перед закрывающим '>'). */
function injectAttrs(tagText, extra) {
  const keys = Object.keys(extra);
  if (!keys.length) return tagText;
  const insert = keys.map(function (k) {
    if (k === 'class') {
      // class из метки сливается с class корня фрагмента
      return 'class="' + (extra[k].trim()) + '"';
    }
    return k + '="' + extra[k] + '"';
  }).join(' ');
  return tagText.slice(0, -1) + ' ' + insert + '>';
}

/* Обработка одной метки <ds-include …>: возвращает строку фрагмента,
   готовую к вставке, или null, если тег без src. */
function loadFragment(tag, closeEnd, src) {
  const attrs = parseAttrs(tag);
  const rel = attrs.src;
  if (!rel) fail('метка без атрибута src: ' + tag.trim());

  const file = path.resolve(inputDir, rel);
  if (!existsSync(file)) fail('не найден файл фрагмента: ' + rel + ' (' + file + ')');

  const raw = readFileSync(file, 'utf8');
  const frag = raw.replace(/^\uFEFF/, '').trim();
  if (!frag) fail('фрагмент пуст: ' + rel);
  if (/^<!DOCTYPE/i.test(frag) || /^<html[\s>]/i.test(frag)) {
    fail('фрагмент ' + rel + ' — это целый документ. Фрагмент должен быть куском ' +
         'разметки с одним корневым элементом (без <html>/<head>/<link>/<script>).');
  }

  const root = findRootTag(frag);
  if (!root) fail('во фрагменте нет корневого элемента: ' + rel);

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

  return frag.slice(0, root.start) + newOpen + frag.slice(root.end);
}

/* Найти диапазоны HTML-комментариев <!-- … -->, чтобы не принимать за метки
   упоминания <ds-include …> в тексте комментариев. */
function commentRanges(text) {
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
  return ranges;
}

/* Основной цикл замены. */
function assemble(source) {
  let out = source;
  const inlined = [];
  const comments = commentRanges(source);
  let loops = 0;

  function inComment(pos) {
    return comments.some(function (r) { return pos >= r[0] && pos < r[1]; });
  }

  while (true) {
    if (++loops > 100) fail('похоже на бесконечный цикл: больше 100 меток');
    const m = TAG_OPEN_RE.exec(out);
    if (!m) break;

    if (inComment(m.index)) {
      // метка — на самом деле текст внутри комментария: пропустить комментарий
      const range = comments.find(function (r) { return m.index >= r[0] && m.index < r[1]; });
      TAG_OPEN_RE.lastIndex = range[1];
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
    const frag = loadFragment(tag, closeEnd, attrs.src);
    inlined.push(attrs.src + (attrs.id ? '  (id="' + attrs.id + '")' : ''));

    out = out.slice(0, tagStart) + frag + out.slice(closeEnd);
    TAG_OPEN_RE.lastIndex = tagStart + frag.length;
  }

  return { html: out, inlined: inlined };
}

/* ── запуск ── */
if (!existsSync(inputPath)) fail('не найден источник: ' + inputPath);

const source = readFileSync(inputPath, 'utf8');
const { html, inlined } = assemble(source);

writeFileSync(outputPath, html, 'utf8');

console.log('assemble: собрано из ' + inlined.length + ' фрагмента(ов):');
inlined.forEach(function (f) { console.log('  – ' + f); });
console.log('assemble: готово → ' + outputPath);
