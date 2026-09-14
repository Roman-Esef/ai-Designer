/* ============================================================
   SPEC-AUDIT — read-only сверка «правило объявлено — кода нет»
   (восемь проходов: пять ревизии от 05.09.2026 + шестой и седьмой от 11.09.2026
   + восьмой от 13.09.2026).

   Что делает: по репозиторию ДС ищет места, где спека/манифест
   обещают поведение, а реализации нет (или она живёт не у владельца).
   Ничего не пишет. Запуск:
     node scripts/spec-audit.mjs

   Проходы (см. «Ревизия ДС: правило объявлено — кода нет. Отчёт»):
     1. Классы-состояния в styles/*.css, которых нет ни в одном скрипте.
     2. data-* хуки из спек, отсутствующие в коде (обе формы: литерал
        и dataset.camelCase).
     3. API, обещанный спекой (DSx.method()), против фактических
        window.DSx = {…}.
     4. Обещания «усечено → тултип» по всем спекам против вызовов
        DSTooltip (bind / truncated) в рантаймах.
     5. Селекторы, которые ловят два и более рантайма делегированием
        (спор за элемент).
     6. Классы, названные в спеке (в обратных кавычках или в примере
        `class="…"`), которых нет ни в одном styles/*.css. Закрывает
        ветку «объявлен компонент-родственник, CSS нет» (Л86): `Card
        (`.tile--card`)` в спеке Tile без правил `.tile--card`.
     7. Классы из фасета «Классы» чит-шита, которых нет ни в одном
        styles/*.css. Чит-шит ведётся руками и уже расходился с CSS;
        проход 6 его не видит — там фильтр по `component:` во фронт-маттере.
     8. Манифест specs/_index.md против каталога компонентов в правилах
        агента (.opencode/rules/ds-rules.md §6), в обе стороны. Каталог — копия
        манифеста в контексте каждого агента; сторож реестров линтера её не
        читает. Нет файла правил — строка ПРОПУЩЕН.

   Код выхода: 1 если в проходе 4 есть не закрытое обещание «усечено →
   тултип» (это корневой дефект CM, который чинили 05.09) или если проход 8
   нашёл расхождение манифеста с каталогом; иначе 0.
   ============================================================ */
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function list(dir, ext) {
  try {
    const entries = await readdir(path.join(ROOT, dir), { withFileTypes: true });
    return entries
      .filter((e) => e.isFile() && (!ext || e.name.endsWith(ext)))
      .map((e) => path.join(ROOT, dir, e.name));
  } catch {
    return [];
  }
}
const read = (p) => readFile(p, 'utf8');

/* Рекурсивный обход дерева (страницы лежат в подпапках pages/<тип>/). */
async function listRec(dir, ext) {
  const out = [];
  let entries;
  try { entries = await readdir(path.join(ROOT, dir), { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const rel = dir + '/' + e.name;
    if (e.isDirectory()) out.push(...(await listRec(rel, ext)));
    else if (!ext || e.name.endsWith(ext)) out.push(path.join(ROOT, rel));
  }
  return out;
}

const stylesFiles = await list('styles', '.css');
const scriptsFiles = await list('scripts', '.js');
const specsFiles = await list('specs', '.md');

const styles = {};
for (const f of stylesFiles) styles[path.basename(f)] = await read(f);
const scripts = {};
for (const f of scriptsFiles) scripts[path.basename(f)] = await read(f);
const specs = {};
for (const f of specsFiles) specs[path.basename(f)] = await read(f);

const allScripts = Object.values(scripts).join('\n');
const allStyles = Object.values(styles).join('\n');

const out = [];
const say = (s) => out.push(s);
const section = (t) => { say(''); say('===== ' + t + ' ====='); };

/* ---------- Поиск токенов (классы, data-*, API) ---------- */
function cssTokens(re) {
  const set = new Set();
  for (const s of Object.values(styles)) {
    let m;
    re.lastIndex = 0;
    while ((m = re.exec(s))) set.add(m[1] || m[0]);
  }
  return set;
}
function inAnyScript(token) {
  return allScripts.includes(token);
}
/* dataset.camelCase — форма, которую ставит код через dataset.X */
function inAnyScriptDataset(camel) {
  return allScripts.includes('dataset.' + camel);
}

/* ---------- Проход 1: классы-состояния без скрипта ---------- */
section('Проход 1 · классы-состояния в CSS, которых нет ни в одном скрипте');
const inScriptStates = new Set();
for (const s of Object.values(scripts)) {
  const m = s.match(/classList\.(add|remove|toggle)\(['"]([^'"]+)['"]/g) || [];
  m.forEach((x) => x.replace(/.*\(['"]([^'"]+)['"]\)/, (all, c) => inScriptStates.add(c)));
  const m2 = s.match(/\b([a-z][a-z0-9_-]*--[a-z][a-z0-9_-]*)\b/g) || [];
  m2.forEach((c) => inScriptStates.add(c));
}
const stateClasses = cssTokens(/\.([a-z][a-z0-9_-]*--[a-z0-9_-]+)(?![a-z0-9_-])/g);
const stateMiss = [...stateClasses].filter((c) => !inScriptStates.has(c) && !allScripts.includes(c));
say('Кандидатов классов-состояний: ' + stateClasses.size + ', не упомянуты в скриптах: ' + stateMiss.length);
for (const c of stateMiss.slice(0, 40)) say('  · ' + c + '  — не упомянут ни в одном скрипте');

/* ---------- Проход 2: data-* хуки ---------- */
section('Проход 2 · data-* хуки из спек, которых нет в коде');
const specData = new Set();
for (const s of Object.values(specs)) {
  const m = s.match(/\bdata-[a-z0-9-]+/g) || [];
  m.forEach((t) => specData.add(t));
}
const dataMiss = [...specData].filter((t) => {
  const camel = t.replace(/^data-/, '').replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  return !inAnyScript(t) && !inAnyScriptDataset(camel);
});
say('data-* из спек: ' + specData.size + ', не найдено в коде (обе формы): ' + dataMiss.length);
for (const t of dataMiss.slice(0, 30)) say('  · ' + t);

/* ---------- Проход 3: API ---------- */
section('Проход 3 · API, обещанный спекой, против window.DSx = {…)');
const apiMiss = [];
/* карта: `window.DSx = { … }` → set ключей. Вытягиваем ключи объекта
   (плоские экспорты ДС: bind, tabs, make …) нежадным взятием до первого `}`. */
const apiMap = {};
let am;
const apiAssign = /window\.(DS[A-Za-z]+)\s*=\s*\{([\s\S]*?)\n\s*\}/g;
while ((am = apiAssign.exec(allScripts))) {
  const keys = new Set();
  const km = /[\s,{]([a-zA-Z][a-zA-Z0-9]*)\s*:/g;
  km.lastIndex = 0;
  let k;
  while ((k = km.exec(am[2]))) keys.add(k[1]);
  apiMap[am[1]] = keys;
}
for (const [name, s] of Object.entries(specs)) {
  const m = s.match(/(\bDS[A-Za-z]+)\.([a-zA-Z][a-zA-Z0-9]*)\s*\(/g) || [];
  const seen = new Set();
  for (const call of m) {
    const [, api, method] = call.match(/(\bDS[A-Za-z]+)\.([a-zA-Z][a-zA-Z0-9]*)\s*\(/);
    const key = api + '.' + method;
    if (seen.has(key)) continue;
    seen.add(key);
    const keys = apiMap[api];
    const ok = keys ? keys.has(method) : false;
    if (!ok) apiMiss.push(key + '  (' + name.replace('.md', '') + ')');
  }
}
say('Обещанных вызовов API, у которых нет ключа в window.DS*: ' + apiMiss.length);
for (const t of [...new Set(apiMiss)].slice(0, 30)) say('  · ' + t);

/* ---------- Проход 4: «усечено → тултип» ---------- */
section('Проход 4 · обещания «усечено → тултип» против вызовов DSTooltip / truncated');
const TRUNC_PROMISE = /(усеч|обреза|многоточи|не помеща|тултип|тол)+/;
const truncSelectors = new Set();
const truncRegex = /DSTooltip\.truncated\(\s*'([^']+)'/g;
let m;
while ((m = truncRegex.exec(allScripts))) {
  m[1].split(',').forEach((s) => truncSelectors.add(s.trim()));
}
const bindRe = /DSTooltip\.(bind|make)\(/g;
let hasDSBind = false;
while (bindRe.exec(allScripts)) { hasDSBind = true; break; }
say('Зарегистрировано селекторов через DSTooltip.truncated: ' + truncSelectors.size);
for (const s of truncSelectors) say('  · ' + s);

/* Обещание — сильное: в спеке «тултип» соседствует с усечением/переполнением/
   многоточием/ellipsis. Критерий закрытия — метод отчёта: у компонента есть
   рантайм(ы) из поля `runtime:`, который(е) обращаются к DSTooltip, либо его
   класс подписи зарегистрирован через DSTooltip.truncated. Если обещание есть,
   а ни один рантайм DSTooltip не трогает и класс не зарегистрирован — это
   «правило объявлено, кода нет». */
function runtimeFiles(spec) {
  const line = (spec.match(/^runtime:\s*(.+)$/m) || [])[1] || '';
  return line.match(/[a-zA-Z0-9_-]+\.js/g) || [];
}
function anyRuntimeUsesDSTooltip(names) {
  return names.some((n) => /DSTooltip/.test(scripts[n] || ''));
}

const STRONG = /тултип[^\n]{0,70}(усеч|обреза|переполн|многоточи|ellipsis|не помеща)|(усеч|обреза|переполн|многоточи|ellipsis|не помеща)[^\n]{0,70}тултип/i;

const promiseComponents = [];
for (const [name, s] of Object.entries(specs)) {
  if (!/^component:\s*.+$/m.test(s)) continue;   // только компоненты, не _cheatsheet/_TEMPLATE/_index
  const c = (s.match(/^component:\s*(.+)$/m) || [])[1].trim();
  if (!STRONG.test(s)) continue;
  const runtimes = runtimeFiles(s);
  const selectorCovered = [...truncSelectors].some((r) => {
    const key = (c.toLowerCase().replace(/[^a-z0-9]/g, ''));
    return r.toLowerCase().includes(key);
  });
  /* Закрыто, если хотя бы одно: рантайм обращается к DSTooltip; класс подписи
     зарегистрирован; тултип обещан через `data-tooltip` в разметке
     (подхватывает ds-tooltip.js bindAll без своего рантайма) или через
     нативный `title` (так и задумано). */
  const closed = anyRuntimeUsesDSTooltip(runtimes)
    || selectorCovered
    || /data-tooltip=/.test(s)
    || /title\s*[)]?/.test(s);
  if (!closed) {
    promiseComponents.push(c + (runtimes.length ? '  (рантайм: ' + runtimes.join(', ') + ')' : '  (рантайм не указан)'));
  }
}
say('Спек с сильным обещанием «усечено → тултип», где ни один рантайм не трогает DSTooltip: ' + promiseComponents.length);
for (const c of promiseComponents) say('  · ' + c);

/* ---------- Проход 5: селекторы-конфликты ---------- */
section('Проход 5 · селекторы, ловимые двумя+ рантаймами (closest/querySelector делегированием)');
const selRe = /\.closest\(\s*'([^']+)'\)/g;
const selUse = {};
for (const [name, s] of Object.entries(scripts)) {
  let mm;
  selRe.lastIndex = 0;
  while ((mm = selRe.exec(s))) {
    const sel = mm[1];
    selUse[sel] = selUse[sel] || [];
    selUse[sel].push(name.replace('.js', ''));
  }
}
const conflicts = Object.entries(selUse).filter(([, fs]) => new Set(fs).size >= 2);
say('Селекторов с 2+ владельцами: ' + conflicts.length);
for (const [sel, fs] of conflicts) say('  · ' + sel + '  ← ' + [...new Set(fs)].join(', '));

/* ---------- Проход 6: классы, названные в спеке, без правил в styles/*.css ----------
   Класс компонента-родственника/варианта, названный в спеке (например «Card
   (`.tile--card`)»), обязан иметь правила в CSS ДС: объявление родственника в
   прозе — не доказательство его существования (Л86). Классы берутся из спек в
   обратных кавычках и из примеров `class="…"`; наличие проверяется по всем
   styles/*.css. Класс, которого нет ни в одном файле стилей, — либо опечатка в
   спеке, либо объявленный-но-нереализованный компонент.

   Класс с ролью в рантайме — не дефект: `.nav__burger`, `.dpk__prev`,
   `.preset-item` и подобные живут в `scripts/*.js` как хуки или демо-разметка
   и стилизуются чужими классами (`.ibtn`, `.btn`). Находка — только то, чего
   нет НИ в CSS, НИ в скриптах: чисто CSS-модификатор вроде `.tile--card`
   остаётся в области правила. */
section('Проход 6 · классы, названные в спеке, которых нет в styles/*.css');
const specClasses = new Set();
for (const s of Object.values(specs)) {
  if (!/^component:\s*.+$/m.test(s)) continue;   // только компоненты, не _cheatsheet/_TEMPLATE/_index
  const bt = s.match(/`\.([a-z][a-z0-9_-]*)`/g) || [];
  bt.forEach((x) => specClasses.add(x.slice(2, -1)));
  const cl = s.match(/class="([^"]+)"/g) || [];
  cl.forEach((x) => x.replace(/class="([^"]+)"/, (all, v) => v.split(/\s+/).forEach((c) => { if (/^[a-z][a-z0-9_-]*$/.test(c)) specClasses.add(c); })));
}
/* Классы, которые реально живут на страницах: в атрибуте `class="…"` или в
   собственном `<style>` страницы. Их отсутствие в `styles/*.css` — предмет
   линтера `P5`, а не этого прохода: проход ищет класс, названный в спеке и не
   реализованный НИГДЕ (случай Л86, `Card`/`.tile--card`). Прозаическое
   упоминание класса на странице (например, «удалённый `.dtable__edge`») сюда
   не попадает — иначе проход ослеп бы ровно на том случае, ради которого
   заведён. */
const pageClasses = new Set();
for (const f of await listRec('pages', '.html')) {
  const h = await read(f);
  const attrs = h.match(/class="([^"]+)"/g) || [];
  attrs.forEach((x) => x.replace(/class="([^"]+)"/, (all, v) => v.split(/\s+/).forEach((c) => { if (/^[a-z][a-z0-9_-]*$/.test(c)) pageClasses.add(c); })));
  for (const blk of (h.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [])) {
    for (const x of (blk.match(/\.([a-z][a-z0-9_-]*)/g) || [])) pageClasses.add(x.slice(1));
  }
}

const hasClassRule = (c) => new RegExp('\\.' + c.replace(/-/g, '\\-') + '(?![a-z0-9_-])').test(allStyles);
const classMiss = [...specClasses].filter((c) => !hasClassRule(c) && !allScripts.includes(c) && !pageClasses.has(c)).sort();
say('Классов из спек: ' + specClasses.size + ', нет правил в styles/*.css: ' + classMiss.length);
for (const c of classMiss.slice(0, 40)) say('  · .' + c);

/* ---------- Проход 7: фасет «Классы» чит-шита против styles/*.css ----------
   Чит-шит — производный источник и ведётся руками; старшинство при конфликте
   CSS → полная спека → чит-шит. Расхождения уже случались и ловились глазом
   (размер бургера NavPanel, размер кнопки DatePicker). Проход механизирует
   сверку: класс, объявленный фасетом «Классы» и не существующий ни в одном
   styles/*.css, ни в scripts/*.js, — опечатка либо модификатор, который
   описан, но не реализован.

   Проход 6 сюда не достаёт: он берёт только файлы с `component:` во
   фронт-маттере, а у `_cheatsheet.md` его нет — чит-шит из той выборки
   исключён целиком.

   Зависимости из `_index.md` не нужны: сверка идёт по СКЛЕЙКЕ всех
   styles/*.css, поэтому классы, объявленные в одном блоке, а живущие у
   соседнего компонента (`tc`, `tbl__row` — в table-cell.css, объявлены у
   Table), находятся сами. Фильтры те же, что у прохода 6: хук-класс без
   собственных правил CSS (`.nav__burger`) не дефект — его ищет рантайм. */
section('Проход 7 · классы из фасета «Классы» чит-шита, которых нет в styles/*.css');
const sheet = specs['_cheatsheet.md'] || '';
const sheetClasses = new Set();
let sheetBlocks = 0;
for (const block of sheet.split(/^## /m).slice(1)) {
  const facet = block.split('\n').find((l) => l.startsWith('**Классы:**'));
  if (!facet) continue;
  sheetBlocks++;
  for (const x of (facet.match(/`\.([a-z][a-z0-9_-]*)`/g) || [])) sheetClasses.add(x.slice(2, -1));
}
const sheetMiss = [...sheetClasses].filter((c) => !hasClassRule(c) && !allScripts.includes(c) && !pageClasses.has(c)).sort();
say('Блоков с фасетом «Классы»: ' + sheetBlocks + ', классов: ' + sheetClasses.size
  + ', нет правил в styles/*.css: ' + sheetMiss.length);
for (const c of sheetMiss.slice(0, 40)) say('  · .' + c);

/* ---------- Проход 8: манифест против каталога в правилах агента ----------
   Каталог компонентов в `.opencode/rules/ds-rules.md` §6 — ещё одна копия
   манифеста `specs/_index.md`, и она лежит в контексте КАЖДОГО агента.
   Сторож реестров линтера (D1/D5) её не читает: до 13.09.2026 Drawer и Kanban
   были в манифесте и отсутствовали в каталоге, и агент, которому запрещено
   изобретать компонент, не узнал бы, что компонент есть.
   Сверка в обе стороны. Файл правил читается мягко — аудит обязан работать и
   без агентской оснастки, — но пропуск печатается, а не молчит. Разбор, давший
   пустой список, — находка: пустая сверка неотличима от чистой. */
section('Проход 8 · манифест specs/_index.md против каталога компонентов в правилах агента');
const RULES = path.join(ROOT, '..', '.opencode', 'rules', 'ds-rules.md');
let catalogMissing = [];
let catalogExtra = [];
let catalogBroken = false;
{
  const manifestTable = (specs['_index.md'] || '').split(/^## /m)[0];
  const manifest = new Set();
  for (const line of manifestTable.split('\n')) {
    const m = line.match(/^\|\s*([A-Za-z][A-Za-z0-9]*)\s*\|\s*specs\//);
    if (m) manifest.add(m[1]);
  }
  let rules = null;
  try { rules = await read(RULES); } catch { /* оснастки нет */ }
  if (rules === null) {
    say('ПРОПУЩЕН: нет файла правил агента .opencode/rules/ds-rules.md — сверять каталог не с чем');
  } else {
    const blk = (rules.split(/^## 6\. Каталог компонентов/m)[1] || '').split(/^## /m)[0];
    const catalog = new Set();
    for (const line of blk.split('\n')) {
      const g = line.match(/^\*\*[^*]+:\*\*\s*(.+)$/);
      if (!g) continue;
      for (const item of g[1].split('·')) {
        const name = item.replace(/\([^)]*\)/g, '').trim();
        if (name) catalog.add(name);
      }
    }
    catalogMissing = [...manifest].filter((n) => !catalog.has(n)).sort();
    catalogExtra = [...catalog].filter((n) => !manifest.has(n)).sort();
    catalogBroken = manifest.size === 0 || catalog.size === 0;
    say('В манифесте: ' + manifest.size + ', в каталоге правил: ' + catalog.size
      + ', нет в каталоге: ' + catalogMissing.length + ', нет в манифесте: ' + catalogExtra.length);
    for (const n of catalogMissing) say('  · ' + n + '  — есть в манифесте, нет в каталоге §6: агент не узнает, что компонент существует');
    for (const n of catalogExtra) say('  · ' + n + '  — есть в каталоге §6, нет в манифесте: агент будет искать несуществующую спеку');
    if (catalogBroken) say('  · разбор дал пустой список (' + (manifest.size ? 'каталог §6' : 'манифест') + ') — формат файла изменился, сверка недействительна');
  }
}
const catalogFindings = catalogMissing.length + catalogExtra.length + (catalogBroken ? 1 : 0);

say('');
say('=== Итог ===');
say('Проход 4 (усечено → тултип): «ОТКРЫТО» = ' + promiseComponents.length + (promiseComponents.length ? ' → ' + promiseComponents.join(', ') : ' — все закрыты'));
say('Проход 6 (класс из спеки без правил CSS): ' + classMiss.length + (classMiss.length ? ' — см. список выше' : ' — чисто'));
say('Проход 7 (класс из чит-шита без правил CSS): ' + sheetMiss.length + (sheetMiss.length ? ' — см. список выше' : ' — чисто'));
say('Проход 8 (манифест ↔ каталог правил агента): ' + catalogFindings + (catalogFindings ? ' — см. список выше' : ' — чисто'));
console.log(out.join('\n'));
const needWork = promiseComponents.length > 0 || catalogFindings > 0;

/* Журнал прогонов для самообучения агентов. «Сработавший код» здесь — номер
   прохода с НЕНУЛЕВЫМ числом находок: у аудита нет идентификаторов правил,
   единица наблюдения — проход. Счёт берётся из переменных прохода, а не из
   разбора собственного вывода: маркер «  · » в этом отчёте несёт и находки,
   и инвентарь (проход 4 перечисляет им зарегистрированные селекторы), так что
   разбор текста считал бы закрытый проход сработавшим.
   Импорт мягкий: аудит обязан работать и без агентской оснастки. */
try {
  const { logRun } = await import('../../.opencode/skills/screen-review/tooling/runlog.mjs');
  const perPass = { 1: stateMiss.length, 2: dataMiss.length, 3: apiMiss.length, 4: promiseComponents.length, 5: conflicts.length, 6: classMiss.length, 7: sheetMiss.length, 8: catalogFindings };
  const codes = Object.keys(perPass).filter((k) => perPass[k] > 0);
  logRun({ tool: 'аудит', target: 'DS-IBP', verdict: needWork ? 'NEEDS-WORK' : 'OK', codes });
} catch { /* оснастки нет — аудит работает как работал */ }

process.exit(needWork ? 1 : 0);
