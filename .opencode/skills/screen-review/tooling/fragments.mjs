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
   раньше), `lessons-cli gate`, `Projects/post/assemble.mjs` (предикат
   `hasActiveInclude` — им ассемблер отбирает источники сборки).
   ============================================================ */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const REPO = path.resolve(HERE, '..', '..', '..', '..');

/* Разметка без того, что разметкой не является. Комментарий вырезался здесь и
   раньше; скрипты, <pre> и <code> добавлены 20.09.2026.

   Причина. Витрина компонента показывает метку `<ds-include src="…">` ПРИМЕРОМ
   КОДА — в `<script type="text/plain" id="src-code-html">` вкладки «Код». По
   подстроке такой пример неотличим от настоящей метки, и витрина молча
   становилась «источником сборки»: ассемблер собирал ей лишний `.preview.html`,
   а сенсор печатал ПРОПУЩЕН и не проверял её вовсе (класс Л100 — молчание
   читается как чистота). Разбор один на всех потребителей: два почти одинаковых
   разбора одного признака — это Л43. */
export function activeMarkup(s) {
  return s
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<pre\b[^>]*>[\s\S]*?<\/pre>/gi, '')
    .replace(/<code\b[^>]*>[\s\S]*?<\/code>/gi, '');
}

/** Есть ли в файле метка сборки, которую ассемблер обязан развернуть. */
export function hasActiveInclude(s) {
  return /<ds-include\b/i.test(activeMarkup(s));
}

/* `.opencode` не исключается намеренно: фикстуры корпуса лежат там, и источник
   фрагмента-фикстуры обязан находиться. */
const SKIP_DIRS = new Set(['.git', 'node_modules']);

/** Все .html в поддереве каталога. */
function htmlUnder(dir, out = []) {
  let entries = [];
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) htmlUnder(full, out); continue; }
    if (e.isFile() && e.name.endsWith('.html')) out.push(full);
  }
  return out;
}

/** Источники, которые вшивают этот файл через `<ds-include src>`. Пустой
    список — файл не фрагмент (или фрагмент-сирота: он проверяется как экран).

    Поиск идёт по уровням вверх, и на КАЖДОМ уровне просматривается всё его
    поддерево, а не только файлы, лежащие в нём прямо. Причина: общие модули
    направления живут в своей папке (`Projects/post/post_local_components/`),
    а страница, которая их вшивает, — в соседней (`Projects/post/deal_post/`).
    Предок у них общий, прямым родителем источник фрагменту не приходится, и
    поиск «только по прямым файлам предков» объявлял такой модуль сиротой —
    его линтовали как страницу документации ДС (2 ложных блокера на каждом
    модуле, 19.09.2026). Подъём прекращается на первом уровне, где источник
    нашёлся, поэтому полный обход репозитория делает только настоящая сирота. */
export function includersOf(file) {
  const abs = path.resolve(file);
  let text;
  try { text = activeMarkup(readFileSync(abs, 'utf8')); } catch { return []; }
  if (/<!DOCTYPE|<html\b/i.test(text)) return [];

  let dir = path.dirname(abs);
  while (dir.startsWith(REPO) && dir.length >= REPO.length) {
    const out = [];
    for (const host of htmlUnder(dir)) {
      if (host === abs) continue;
      let h;
      try { h = activeMarkup(readFileSync(host, 'utf8')); } catch { continue; }
      for (const m of h.matchAll(/<ds-include\b[^>]*\bsrc="([^"]+)"/gi)) {
        if (path.resolve(path.dirname(host), m[1]) === abs) out.push(host);
      }
    }
    if (out.length) return out;
    if (dir === REPO) break;
    dir = path.dirname(dir);
  }
  return [];
}

/** Собранный файл источника: `<имя>.html` → `<имя>.preview.html`, если есть. */
export function assembledOf(host) {
  const p = host.replace(/\.html$/, '.preview.html');
  return existsSync(p) ? p : null;
}
