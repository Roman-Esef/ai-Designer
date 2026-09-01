#!/usr/bin/env node
/* ============================================================
   DS-CHECK — единый гейт механической проверки страницы.
   Прогоняет все автоматические проверки разом и выдаёт один вердикт:

     1. scripts/ds-lint-cli.mjs <page>        — статический ревизор целостности ДС
     2. docs-split.mjs check <page>           — структурные проверки docs-split
     3. docs-split.mjs verify <page>          — headless-проверка живости

   Для страниц НЕ на docs-split (экраны из Projects/test, старые страницы) шаги 2–3
   пропускаются — остаётся только ds-lint.

   Запуск:
     node scripts/ds-check.mjs <страница>

   Код выхода: 1 если хоть один шаг дал FAIL/BLOCKER, иначе 0.
   ============================================================ */
import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WS = path.resolve(ROOT, '..');
const NODE = process.execPath;
const DS_LINT = path.join(ROOT, 'scripts', 'ds-lint-cli.mjs');
const DOCS_SPLIT = path.join(WS, '.opencode', 'skills', 'docs-split', 'tooling', 'docs-split.mjs');

const page = process.argv[2];
if (!page) {
  console.error('Использование: node scripts/ds-check.mjs <страница>');
  process.exit(2);
}

const pageAbs = path.resolve(ROOT, page);
// ds-lint-cli.mjs ожидает ОТНОСИТЕЛЬНЫЙ путь (он делает path.join(ROOT, p));
// абсолютный путь превращается в мусор и даёт ложные C1/C2. На Windows
// path.relative() отдаёт обратные слэши, а ds-lint режет по '/' — нормализуем.
const pageRel = path.relative(ROOT, pageAbs).split(path.sep).join('/');
// docs-split.mjs живёт в воркспейсе (aiDesigner/.opencode/...) и резолвит
// страницу от корня воркспейса — путь передаём с префиксом DS-IBP/.
const pageWs = path.relative(WS, pageAbs).split(path.sep).join('/');
const isDocsSplit = (await readFile(pageAbs, 'utf8')).includes('class="page ds-split"');

const steps = [
  ['ds-lint', [DS_LINT, pageRel]],
];
if (isDocsSplit) {
  steps.push(['docs-split check', [DOCS_SPLIT, 'check', pageWs]]);
  steps.push(['docs-split verify', [DOCS_SPLIT, 'verify', pageWs]]);
}

let failed = 0;
for (const [name, args] of steps) {
  console.log(`\n=== ${name} ===`);
  try {
    const { stdout } = await run(NODE, args, { maxBuffer: 32 * 1024 * 1024, timeout: 150000, windowsHide: true });
    process.stdout.write(stdout);
  } catch (e) {
    if (e.stdout) process.stdout.write(String(e.stdout));
    if (e.stderr) process.stderr.write(String(e.stderr));
    failed++;
    console.log(`шаг ${name} завершился с ошибкой (код ${e.code ?? '?'})`);
  }
}

console.log('\n' + '='.repeat(40));
console.log(failed === 0 ? 'ВЕРДИКТ: OK' : `ВЕРДИКТ: FAIL (${failed} шаг(а))`);
process.exit(failed === 0 ? 0 : 1);
