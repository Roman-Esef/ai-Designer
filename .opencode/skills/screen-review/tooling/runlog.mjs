/* ============================================================
   RUNLOG — журнал прогонов инструментов проверки (`runs.jsonl`).

   Зачем. `verify` доказывает, что сторож ЖИВОЙ (падает на дефекте, молчит на
   эталоне). Он не отвечает на другой вопрос: сработал ли сторож хоть раз на
   настоящей работе и не вернулся ли дефект после того, как урок объявили
   закреплённым. Этого сигнала не было вовсе: журнал уроков знает дату
   закрепления, но не знает, что случилось ПОСЛЕ неё.

   Одна строка на прогон, JSON Lines:
     {"n":12,"t":"2026-09-06T10:11:12.000Z","tool":"линтер",
      "target":"pages/molecules/InputText.html","verdict":"PASS с замечаниями",
      "codes":["D4"]}

   `codes` — только СРАБОТАВШИЕ идентификаторы (FAIL/WARN/BLOCKER/INFO).
   Пройденные проверки не пишутся: их состав меняется от версии к версии, а
   различать нужно «код появился» и «код не появился».

   ФИКСТУРЫ В ЖУРНАЛ НЕ ПОПАДАЮТ. `verify` гоняет 37 пар «дефект/эталон», и
   каждый прогон по определению даёт сработавший код. Пусти их в журнал — и
   «код появлялся» будет верно для любого сторожа с фикстурой, то есть сигнал
   обнулится ровно там, где он нужен. Отсекается по пути: любой файл внутри
   каталога `fixtures/` не логируется.

   Владелец один. Три инструмента (`layout-check.mjs`, `ds-lint-cli.mjs`,
   `spec-audit.mjs`) импортируют этот модуль МЯГКО — через try/catch: журнал
   прогонов не имеет права уронить проверку. Нет `.opencode/` (ДС уехала
   отдельно) — инструменты работают как работали, просто без записи.

   Читает журнал `lessons-cli stats`.
   ============================================================ */
import { appendFileSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..', '..', '..');
export const RUNS = path.join(HERE, 'runs.jsonl');

/** Путь к корню репозитория, слэшами вперёд — иначе на Windows пути в журнале
    будут в двух разных видах и `stats` посчитает их разными файлами. */
export function relTarget(p) {
  if (!p) return '';
  const abs = path.isAbsolute(p) ? p : path.resolve(ROOT, p);
  return path.relative(ROOT, abs).split(path.sep).join('/');
}

export function isFixture(p) {
  const rel = relTarget(p);
  return rel.split('/').includes('fixtures');
}

/** Сработавшие идентификаторы из отчёта любого из трёх инструментов.
    Формы строк: «FAIL  Б12 …», «WARN  K1 …», «BLOCKER A2 …», «WARN    D4  …».
    Один разбор на всех — три копии разъезжались бы так же, как разъезжались
    прозаические перечни проверок (урок Л43). */
export function codesFrom(text) {
  const out = [];
  const seen = new Set();
  for (const m of String(text).matchAll(/^(?:FAIL|WARN|BLOCKER|INFO)\s+([A-ZА-ЯЁ][0-9]{1,2}(?:\.[0-9])?)(?![0-9])/gmu)) {
    if (!seen.has(m[1])) { seen.add(m[1]); out.push(m[1]); }
  }
  return out;
}

function nextN() {
  if (!existsSync(RUNS)) return 1;
  try {
    const s = readFileSync(RUNS, 'utf8');
    return s.split('\n').filter(Boolean).length + 1;
  } catch { return 1; }
}

/**
 * @param {{tool:string, target?:string, verdict:string, codes?:string[], text?:string}} rec
 *   `codes` можно не передавать — тогда они извлекаются из `text` (отчёта).
 * @returns {boolean} записана ли строка
 */
export function logRun(rec) {
  try {
    const target = relTarget(rec.target || '');
    if (target && isFixture(target)) return false;
    const codes = rec.codes || codesFrom(rec.text || '');
    const line = JSON.stringify({
      n: nextN(),
      t: new Date().toISOString(),
      tool: rec.tool,
      target,
      verdict: rec.verdict,
      codes,
    });
    appendFileSync(RUNS, line + '\n', 'utf8');
    return true;
  } catch {
    // журнал прогонов не имеет права уронить проверку
    return false;
  }
}
