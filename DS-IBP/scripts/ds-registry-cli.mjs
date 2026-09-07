#!/usr/bin/env node
/* ============================================================
   DS-REGISTRY-CLI — локальный запуск ds-registry.js из терминала (Node).

   ds-registry.js сам по себе не исполняемый: он ждёт хелперы readFile/ls
   снаружи (тот же контракт, что у ds-lint.js). Эта обёртка даёт их через
   node:fs, вызывает build() и пишет registry.json. Сам генератор не трогается.

   Запуск (из корня проекта продукта, где лежит admin.html):
     node <путь к ДС>/scripts/ds-registry-cli.mjs --rules 1.004
     node <путь к ДС>/scripts/ds-registry-cli.mjs --root . --out registry.json

   Опции:
     --root <путь>   корень проекта продукта (по умолчанию — текущая папка)
     --out <файл>    куда писать реестр (по умолчанию <root>/registry.json)
     --rules <вер>   версия правил из LocalComponents.html — попадает в
                     rulesVersionChecked, по ней ловится паспорт, заполненный
                     по устаревшим правилам
     --components / --screens / --requirements <путь> — переопределить папки
                     (по умолчанию kit/components, screens, requirements)

   Код выхода: 1 — в реестре есть расхождения уровня blocker, иначе 0.
   Реестр руками не правится: расхождение — сигнал, что он устарел.
   ============================================================ */
import { readFile as fsReadFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const DS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = argv.indexOf('--' + name);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback;
};

const ROOT = path.resolve(opt('root', process.cwd()));
const OUT = path.resolve(ROOT, opt('out', 'registry.json'));

// хелперы в том же контракте, что ждёт ds-registry.js
const readFile = (p) => fsReadFile(path.join(ROOT, p), 'utf8');
const ls = async (dir) => {
  const entries = await readdir(path.join(ROOT, dir || '.'), { withFileTypes: true });
  return entries.map((e) => (e.isDirectory() ? e.name + '/' : e.name));
};

const src = await fsReadFile(path.join(DS, 'scripts', 'ds-registry.js'), 'utf8');
const { build } = new Function('readFile', 'ls', src + ';return dsRegistry;')(readFile, ls);

const reg = await build({
  ls,
  readFile,
  rulesVersion: opt('rules', null),
  componentsDir: opt('components', undefined),
  screensDir: opt('screens', undefined),
  requirementsDir: opt('requirements', undefined)
});

await writeFile(OUT, JSON.stringify(reg, null, 2), 'utf8');

const byLevel = (lvl) => reg.mismatches.filter((m) => m.level === lvl);
const blockers = byLevel('blocker');
console.log(`Реестр: ${reg.components.length} компонент(ов), ${reg.screens.length} экран(ов) → ${path.relative(process.cwd(), OUT) || OUT}`);
console.log(`Расхождения: ${blockers.length} blocker · ${byLevel('warn').length} warn · ${byLevel('info').length} info`);
for (const m of blockers.slice(0, 20)) console.log(`  BLOCKER ${m.code}  ${m.path}: ${m.message}`);
process.exit(blockers.length ? 1 : 0);
