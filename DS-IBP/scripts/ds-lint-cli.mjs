/* ============================================================
   DS-LINT-CLI — локальный запуск ds-lint.js из терминала (Node).

   ds-lint.js сам по себе не исполняемый: он ждёт хелперы readFile/ls
   от харнеса run_script. Эта обёртка даёт их через node:fs и вызывает
   dsLint.run(...). Сам линтер не трогается.

   Запуск:
     node scripts/ds-lint-cli.mjs                         # только глобальные правила
     node scripts/ds-lint-cli.mjs pages/molecules/SegmentControl.html
     node scripts/ds-lint-cli.mjs pages/atoms/*.html      # несколько страниц
     node scripts/ds-lint-cli.mjs --parity                # гейт парности «доки = код»

   Код выхода: 1 если в отчёте есть BLOCKER (NEEDS-WORK), иначе 0.
   ============================================================ */
import { readFile as fsReadFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP_DIRS = new Set(['.git', 'node_modules', '.vscode', 'uploads', 'screenshots']);

// хелперы в том же контракте, что даёт run_script харнеса ДС
const readFile = (p) => fsReadFile(path.join(ROOT, p), 'utf8');
const ls = async (dir) => {
  const entries = await readdir(path.join(ROOT, dir || '.'), { withFileTypes: true });
  return entries
    .filter((e) => !(e.isDirectory() && SKIP_DIRS.has(e.name)))
    .map((e) => (e.isDirectory() ? e.name + '/' : e.name));
};

// загрузка линтера тем же способом, что в skills/ds-integrity-check.md
const src = await readFile('scripts/ds-lint.js');
const { run } = new Function('readFile', 'ls', src + ';return dsLint;')(readFile, ls);

const args = process.argv.slice(2);
const parity = args.includes('--parity');
const targets = args.filter((a) => !a.startsWith('--'));

const report = parity
  ? await run([], { global: false, parity: true })
  : await run(targets, { changed: targets });

console.log(report);
process.exit(/^BLOCKER\s+[1-9]/m.test(report) || /NEEDS-WORK/.test(report) ? 1 : 0);
