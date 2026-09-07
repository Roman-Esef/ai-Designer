#!/usr/bin/env node
/* ============================================================
   verify.mjs — самопроверка собранного экрана (пилот модульной структуры).
   Проверяет index.preview.html после assemble.mjs:
     1) в собранном файле не осталось меток <ds-include …>;
     2) id в документе уникальны (модалки/скримы/поля из разных фрагментов
        не должны пересекаться);
     3) ключевые узлы фрагментов реально вшиты (таблица, скримы модалок).
   Код выхода: 0 — все проверки прошли, 1 — есть нарушения.
   ============================================================ */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(HERE, 'index.preview.html');

if (!existsSync(file)) {
  console.error('verify: не найден ' + file + ' — сначала запусти assemble.mjs');
  process.exit(1);
}

const s = readFileSync(file, 'utf8');
let errors = 0;

function check(name, ok, detail) {
  console.log((ok ? '  ok  ' : '  FAIL') + ' — ' + name + (detail ? ' (' + detail + ')' : ''));
  if (!ok) errors++;
}

console.log('verify: ' + file);

// 1. Метки развёрнуты: рантайм ds-include.js в собранном файле не сработает.
//    Считаем только настоящие элементы — упоминания в <!-- комментариях -->
//    не разметка (DOM-парсер их игнорирует).
function stripComments(text) {
  return text.replace(/<!--[\s\S]*?-->/g, '');
}
const noComments = stripComments(s);
check('все метки <ds-include> развёрнуты',
  !/<ds-include\b/i.test(noComments),
  (noComments.match(/<ds-include\b/gi) || []).length + ' осталось');

// 2. Уникальность id по всему документу
const ids = (s.match(/id="[^"]*"/g) || []).map(function (x) { return x.slice(4, -1); });
const seen = {}, dup = [];
ids.forEach(function (i) { if (seen[i]) dup.push(i); seen[i] = 1; });
check('id уникальны по всему документу',
  dup.length === 0,
  dup.length ? 'повторяются: ' + dup.join(', ') : 'id всего ' + ids.length);

// 3. Ключевые узлы фрагментов вшиты
check('вшита таблица (.dtable.dtable--fill)',
  /class="dtable\s+dtable--fill"/.test(s));
check('вшит скрим фильтра #filter-scrim',
  /id="filter-scrim"/.test(s));
check('вшит скрим формы #deal-form-scrim',
  /id="deal-form-scrim"/.test(s));
check('вшит скрим удаления #delete-scrim',
  /id="delete-scrim"/.test(s));

// 4. Скримы модалок стоят с hidden (закрыты по умолчанию)
const hiddenScrims = (s.match(/<div class="modal-scrim" id="[^"]*" hidden>/g) || []).length;
check('все скримы модалок закрыты (hidden)', hiddenScrims === 3, 'hidden-скримов ' + hiddenScrims);

// 5. Подключения — один ds.css и один ds.js, пути на три уровня
check('подключён ровно один ds.css (../../../DS-IBP/ds.css)',
  (s.match(/href="\.\.\/\.\.\/\.\.\/DS-IBP\/ds\.css"/g) || []).length === 1);
check('подключён ровно один ds.js (../../../DS-IBP/scripts/ds.js)',
  (s.match(/src="\.\.\/\.\.\/\.\.\/DS-IBP\/scripts\/ds\.js"/g) || []).length === 1);

console.log(errors === 0 ? 'verify: PASS' : 'verify: FAIL (' + errors + ')');
process.exit(errors === 0 ? 0 : 1);
