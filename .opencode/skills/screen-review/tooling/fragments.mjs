/* ============================================================
   FRAGMENTS — фрагмент экрана не является экраном.

   Зачем. Модульный экран (пилот `Projects/test/post/`) собирается из
   источника с метками `<ds-include src="…">` и файлов-фрагментов — модалок и
   таблиц без `<html>`, `<link>` и каркаса. Экраном их делает сборщик: он
   вшивает фрагменты в `*.preview.html`. Сенсор и линтер проверяли фрагмент как
   целый экран и выносили «нет ds.css», «нет каркаса», «нет .screen.md» —
   13.09.2026 это 21 ложный блокер на четырёх файлах, и каждый полный гейт был
   красным из-за них.

   Определение строгое: фрагмент — файл без `<!DOCTYPE`/`<html>`, на который
   ССЫЛАЕТСЯ `<ds-include src>` из html в той же папке или выше (до корня
   репозитория). Одного «нет DOCTYPE» мало: настоящий экран, где DOCTYPE забыт,
   молча перестал бы проверяться (класс Л100).

   Владелец один — этот модуль. Импортируют: `layout-check.mjs`,
   `DS-IBP/scripts/ds-lint-cli.mjs` (мягко: ДС без оснастки линтуется как
   раньше), `lessons-cli gate`.
   ============================================================ */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const REPO = path.resolve(HERE, '..', '..', '..', '..');

const stripComments = (s) => s.replace(/<!--[\s\S]*?-->/g, '');

/** Источники, которые вшивают этот файл через `<ds-include src>`. Пустой
    список — файл не фрагмент (или фрагмент-сирота: он проверяется как экран). */
export function includersOf(file) {
  const abs = path.resolve(file);
  let text;
  try { text = stripComments(readFileSync(abs, 'utf8')); } catch { return []; }
  if (/<!DOCTYPE|<html\b/i.test(text)) return [];

  const out = [];
  let dir = path.dirname(abs);
  while (dir.startsWith(REPO) && dir.length >= REPO.length) {
    let entries = [];
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { entries = []; }
    for (const e of entries) {
      if (!e.isFile() || !e.name.endsWith('.html')) continue;
      const host = path.join(dir, e.name);
      if (host === abs) continue;
      let h;
      try { h = stripComments(readFileSync(host, 'utf8')); } catch { continue; }
      for (const m of h.matchAll(/<ds-include\b[^>]*\bsrc="([^"]+)"/gi)) {
        if (path.resolve(dir, m[1]) === abs) out.push(host);
      }
    }
    if (dir === REPO) break;
    dir = path.dirname(dir);
  }
  return out;
}

/** Собранный файл источника: `<имя>.html` → `<имя>.preview.html`, если есть. */
export function assembledOf(host) {
  const p = host.replace(/\.html$/, '.preview.html');
  return existsSync(p) ? p : null;
}
