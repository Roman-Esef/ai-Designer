#!/usr/bin/env node
/* ============================================================
   DS-ICON — достать один глиф из icons-data.js, не читая файл.

   icons-data.js — 671 KB в одну строку: чтение целиком съедает
   контекст и запрещено правилами (MAINTAINING, «Жёсткие запреты»).
   Здесь файл разбирается как JSON и наружу отдаётся ровно то,
   что просили.

   Запуск (из корня ДС):
     node scripts/ds-icon.mjs check              # SVG одного глифа
     node scripts/ds-icon.mjs --list             # все имена (247 шт.)
     node scripts/ds-icon.mjs --list deal        # имена по подстроке

   Имя не найдено — печатаются похожие, код выхода 1.
   Полный каталог с картинками — pages/foundations/Icons.html.
   ============================================================ */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const src = await readFile(path.join(ROOT, 'scripts', 'icons-data.js'), 'utf8');
// формат файла: window.DS_ICONS = {"имя":"<svg …>", …};
const json = src.slice(src.indexOf('{'), src.lastIndexOf('}') + 1);
let icons;
try {
  icons = JSON.parse(json);
} catch (e) {
  console.error('icons-data.js не разобрался как JSON: ' + e.message);
  process.exit(2);
}

const names = Object.keys(icons);
const args = process.argv.slice(2);

if (args[0] === '--list') {
  const filter = (args[1] || '').toLowerCase();
  const list = filter ? names.filter((n) => n.toLowerCase().includes(filter)) : names;
  console.log(list.sort().join('\n'));
  console.log(`\n— ${list.length} из ${names.length}`);
  process.exit(0);
}

const name = args[0];
if (!name) {
  console.error('Использование: node scripts/ds-icon.mjs <имя глифа> | --list [подстрока]');
  process.exit(2);
}

if (icons[name]) {
  console.log(icons[name]);
  process.exit(0);
}

const near = names.filter((n) => n.toLowerCase().includes(name.toLowerCase()));
console.error(`Глифа «${name}» нет (всего ${names.length}).`);
if (near.length) console.error('Похожие: ' + near.slice(0, 15).join(', '));
else console.error('Список имён: node scripts/ds-icon.mjs --list');
process.exit(1);
