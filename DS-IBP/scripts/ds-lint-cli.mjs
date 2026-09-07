/* ============================================================
   DS-LINT-CLI — локальный запуск ds-lint.js из терминала (Node).

   ds-lint.js сам по себе не исполняемый: он ждёт хелперы readFile/ls
   снаружи. Эта обёртка даёт их через node:fs и вызывает
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

// хелперы в том же контракте, который ждёт линтер
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
const bad = /^BLOCKER\s+[1-9]/m.test(report) || /NEEDS-WORK/.test(report);

/* Журнал прогонов (.opencode/skills/screen-review/tooling/runs.jsonl) — сигнал
   «сторож сработал / замолчал / вернулся» для самообучения агентов. Импорт
   МЯГКИЙ: ДС обязана линтоваться и без агентской оснастки, а запись в журнал
   не имеет права уронить проверку. Фикстуры не логируются — их отсекает
   сам runlog. */
try {
  const { logRun, isFixture } = await import('../../.opencode/skills/screen-review/tooling/runlog.mjs');
  if (!targets.some(isFixture)) {
    logRun({
      tool: 'линтер',
      // при пакетном прогоне путь не пишется целиком: 61 путь в строке журнала
      // читать нечем, а привязка кода к файлу всё равно остаётся в самом отчёте
      target: parity ? '--parity' : (targets.length > 3 ? targets.length + ' файлов' : (targets.join(' ') || '(глобальные)')),
      verdict: bad ? 'NEEDS-WORK' : 'PASS',
      text: report,
    });
  }
} catch { /* оснастки нет — линтер работает как работал */ }

process.exit(bad ? 1 : 0);
