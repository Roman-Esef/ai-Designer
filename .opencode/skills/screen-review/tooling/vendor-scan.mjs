/* ============================================================
   VENDOR-SCAN — сторож нейтральности репозитория.

   Зачем. Репозиторий уезжает на рабочий контур, и следов посторонних
   агентных инструментов в нём быть не должно: ни имён вендоров и моделей,
   ни служебных каталогов, ни абсолютных путей с машины автора. Правило
   существовало текстом и нарушалось трижды (путь к внешнему плану в
   `Projects/post/…/data/`, два URL в скилле композиции) — текст правилом
   не является, пока его никто не проверяет.
   (Глоб-шаблоны в этой шапке записаны с многоточием: последовательность
   «звёздочка-слэш» закрыла бы блочный комментарий на середине файла.)

   Почему не проходом `spec-audit.mjs`. У аудита корень — `DS-IBP/`, он
   физически не видит `.opencode/` и `Projects/`, то есть ровно те места,
   где следы и нашлись. Сторож, не достающий до входа, — это класс Л100
   («правило, у которого отняли вход, молчит»), и повторять его здесь
   нельзя. Корень берётся как у `layout-check.mjs` — четыре уровня вверх.

   Почему шаблоны собраны из кусков. Сторож, написавший стоп-слова
   литералами, находит сам себя: файл правила стал бы первым нарушителем.
   Склейка — не украшение, а условие работоспособности.

   Что СОЗНАТЕЛЬНО не считается нарушением:
   - имя протокола и имя npm-пакета шлюза (`@ai-sdk/openai-compatible` и
     «…-совместимый API» в `.opencode/README.md`). Политика запрещает
     выдавать, каким агентным инструментом пользуются вне рабочего контура,
     а это — описание корпоративного шлюза и техническое имя зависимости:
     убрать их значит сломать инструкцию по настройке. Решение владельца
     от 11.09.2026;
   - `node_modules/` — чужой код, репозиторием не авторствуется.

   Запуск:  node .opencode/skills/screen-review/tooling/vendor-scan.mjs
   Код выхода: 1 — есть находки, 0 — чисто.
   ============================================================ */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const SELF = path.resolve(fileURLToPath(import.meta.url));

const SKIP_DIRS = new Set(['node_modules', '.git', 'uploads']);
const TEXT_EXT = new Set(['.md', '.json', '.js', '.mjs', '.cjs', '.html', '.css', '.txt', '.yml', '.yaml', '.jsonc']);

/* Стоп-слова: имя вендора, имя ассистента, два имени семейств моделей и
   служебный каталог. Собраны склейкой — см. шапку. */
const A = 'anthr' + 'opic';
const B = 'cla' + 'ude';
const C = 'op' + 'us';
const D = 'son' + 'net';
const PATTERNS = [
  { re: new RegExp(A, 'i'), what: 'имя вендора' },
  { re: new RegExp(B, 'i'), what: 'имя ассистента' },
  { re: new RegExp('\\b' + C + '\\b', 'i'), what: 'имя семейства моделей' },
  { re: new RegExp('\\b' + D + '\\b', 'i'), what: 'имя семейства моделей' },
  { re: /[A-Za-z]:\\Users\\[^\\\s"'`]+\\/, what: 'абсолютный путь с машины автора' },
];

function walk(dir, acc) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') && e.isDirectory() && e.name !== '.opencode') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      walk(p, acc);
    } else if (TEXT_EXT.has(path.extname(e.name).toLowerCase())) {
      acc.push(p);
    }
  }
  return acc;
}

const hits = [];
for (const file of walk(ROOT, [])) {
  if (path.resolve(file) === SELF) continue;          // см. шапку: иначе сторож ловит сам себя
  let text;
  try { text = readFileSync(file, 'utf8'); } catch { continue; }
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  text.split(/\r?\n/).forEach((line, i) => {
    for (const p of PATTERNS) {
      if (p.re.test(line)) hits.push({ rel, n: i + 1, what: p.what, line: line.trim().slice(0, 120) });
    }
  });
}

console.log('== vendor-scan: нейтральность репозитория ==');
console.log('корень: ' + ROOT);
if (!hits.length) {
  console.log('\nчисто — следов посторонних инструментов нет');
} else {
  console.log('\nнаходок: ' + hits.length);
  for (const h of hits) console.log(`  ${h.rel}:${h.n} — ${h.what}\n      ${h.line}`);
  console.log('\nКаждая находка — либо правится, либо получает явное исключение');
  console.log('в шапке этого файла с причиной и датой решения владельца.');
}

/* Журнал прогонов — мягко: сторож обязан работать и без оснастки уроков. */
try {
  const { logRun } = await import('./runlog.mjs');
  logRun({ tool: 'нейтральность', target: 'репозиторий', verdict: hits.length ? 'FAIL' : 'OK', codes: hits.length ? ['V1'] : [] });
} catch { /* оснастки нет — сторож работает как работал */ }

process.exit(hits.length ? 1 : 0);
