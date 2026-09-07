/* ============================================================
   SPEC-AUDIT — read-only сверка «правило объявлено — кода нет»
   (пять проходов ревизии от 05.09.2026).

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

   Код выхода: 1 если в проходе 4 есть не закрытое обещание «усечено →
   тултип» (это корневой дефект CM, который чинили 05.09), иначе 0.
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

say('');
say('=== Итог ===');
say('Проход 4 (усечено → тултип): «ОТКРЫТО» = ' + promiseComponents.length + (promiseComponents.length ? ' → ' + promiseComponents.join(', ') : ' — все закрыты'));
console.log(out.join('\n'));
const needWork = promiseComponents.length > 0;

/* Журнал прогонов для самообучения агентов. «Сработавший код» здесь — номер
   прохода с НЕНУЛЕВЫМ числом находок: у аудита нет идентификаторов правил,
   единица наблюдения — проход. Счёт берётся из переменных прохода, а не из
   разбора собственного вывода: маркер «  · » в этом отчёте несёт и находки,
   и инвентарь (проход 4 перечисляет им зарегистрированные селекторы), так что
   разбор текста считал бы закрытый проход сработавшим.
   Импорт мягкий: аудит обязан работать и без агентской оснастки. */
try {
  const { logRun } = await import('../../.opencode/skills/screen-review/tooling/runlog.mjs');
  const perPass = { 1: stateMiss.length, 2: dataMiss.length, 3: apiMiss.length, 4: promiseComponents.length, 5: conflicts.length };
  const codes = Object.keys(perPass).filter((k) => perPass[k] > 0);
  logRun({ tool: 'аудит', target: 'DS-IBP', verdict: needWork ? 'NEEDS-WORK' : 'OK', codes });
} catch { /* оснастки нет — аудит работает как работал */ }

process.exit(needWork ? 1 : 0);
