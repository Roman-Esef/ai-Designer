#!/usr/bin/env node
/* ============================================================
   LESSONS-CLI — инструмент самообучения: проверяет не то, что урок ЗАПИСАН,
   а то, что он во что-то превратился.

   Зачем. Журнал уроков накапливал правила прозой: на 06.09.2026 закрепление
   объявили 2 записи из 38, а из 67 пунктов чек-листов сторожем закрыт 21.
   Проверка «в файле есть строка про правило» ничего не доказывает — это тот
   же дефект, что урок Л42 («правило записано, кода нет»), только применённый
   к самому журналу. Здесь проверка одна: правило обязано ПАДАТЬ на
   воспроизведённом дефекте и МОЛЧАТЬ на эталоне.

   Подкоманды:
     verify    — прогон фикстур: каждая пара «дефект/эталон» доказывает, что
                 сторож живой. Код выхода 1, если хоть один не доказан.
     coverage  — какие пункты чек-листов закрыты сторожем, какие живут прозой,
                 какие признаны неизмеримыми. Код выхода 1, если пункт не
                 классифицирован (не закрыт и не объявлен суждением).
     anchors   — реестр живых идентификаторов сторожей: сверка `anchors.json`
                 с кодом. Код выхода 1 при расхождении. `--write` обновляет.
     check     — механическая проверка формы записей журнала: номер, поля,
                 закрепление, якорь есть в реестре, алфавит якоря, связь с
                 оракулом, единственность владельца ритуала.
      add       — дозапись урока из черновика: номер, дата, EOL, `updated:`.
      state     — объём журнала и долг курации.
      stats     — сигнал об эффекте: что было ПОСЛЕ закрепления — регресс,
                  обучение, мёртвые правила.


   Запуск (из корня репозитория):
     node .opencode/skills/screen-review/tooling/lessons-cli.mjs <подкоманда>

   Кодировка и escape: файл правится редактором, НЕ через шелл — шелл-слой
   схлопывает обратные слэши и молча ломает регулярки (урок Л51).
   ============================================================ */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..', '..', '..');
const SENSOR = path.join(HERE, 'layout-check.mjs');
const FIXTURES = path.join(HERE, 'fixtures');
const REGISTRY = path.join(HERE, 'coverage.json');
const ANCHORS = path.join(HERE, 'anchors.json');
const LINT_FIXTURES = path.join(ROOT, 'DS-IBP/fixtures');
/* Корпус экранов лежит ВНЕ дерева ДС не по вкусу, а по определению правила:
   линтер считает экраном путь, начинающийся с `pages/screens/` или с `../`.
   Правила A7, F6, L4, L5, G1 внутри `DS-IBP/fixtures/` не срабатывают никогда —
   доказывать их там значило бы доказывать на входе, который им не вход (Л71). */
const SCREEN_FIXTURES = path.join(ROOT, 'Projects/test/fixtures');
const RUNS = path.join(HERE, 'runs.jsonl');
const REFS = path.join(ROOT, '.opencode/skills/screen-review/references');
const RAW = path.join(REFS, 'lessons-raw.md');
const CUR = path.join(REFS, 'lessons.md');

const rd = (p) => readFileSync(p, 'utf8');
const log = (s = '') => console.log(s);
const today = () => { const d = new Date(); const p = (n) => String(n).padStart(2, '0'); return p(d.getDate()) + '.' + p(d.getMonth() + 1) + '.' + d.getFullYear(); };

/* Прогон сенсора. Он завершается кодом 1 при любом FAIL, поэтому execFileSync
   бросает — перехватываем и берём stdout: нас интересует не код, а строки. */
function runSensor(file) {
  try {
    return execFileSync(process.execPath, [SENSOR, file], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  } catch (e) {
    return String(e.stdout || '') + String(e.stderr || '');
  }
}

/* Сработал ли сторож по этому идентификатору. Метка стоит в начале строки
   после уровня: «FAIL  Б22 нет сброса…» у сенсора, «BLOCKER R1 …» у линтера.
   Словари уровней у инструментов разные, само срабатывание — одно и то же;
   для оракула важно оно, а не тяжесть. */
function firedOn(out, id) {
  const rx = new RegExp('^(?:FAIL|WARN|BLOCKER|INFO)\\s+' + id + '(?![0-9.])', 'mu');
  return rx.test(out);
}

/* Прогон линтера по фикстуре. Пути линтер разрешает от корня ДС, поэтому
   запускается оттуда. Ненулевой код — норма для `.bad`, перехватываем. */
function runLinter(rel) {
  try {
    return execFileSync(process.execPath, ['scripts/ds-lint-cli.mjs', rel], { cwd: path.join(ROOT, 'DS-IBP'), encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  } catch (e) {
    return String(e.stdout || '') + String(e.stderr || '');
  }
}

/* ---------------- verify ---------------- */

/* Один корпус фикстур: эталон плюс пары `<ID>.bad.html`. Инструмент передаётся
   запускалкой — доказательство устроено одинаково для сенсора и для линтера,
   различаются только словарь уровней и способ вызова. */
function verifyCorpus(dir, run, title) {
  if (!existsSync(dir)) return { total: 0, bad: 0, missing: title };
  const files = readdirSync(dir);
  const baseName = '_base.ok.html';
  if (!files.includes(baseName)) { log('  нет эталона ' + baseName + ' в ' + title); return { total: 0, bad: 1 }; }

  const baseOut = run(baseName);
  const bads = files.filter((f) => f.endsWith('.bad.html')).sort();

  log('== ' + title + ' ==');
  log('эталон: ' + baseName);
  let bad = 0;
  for (const f of bads) {
    const id = f.replace(/\.bad\.html$/, '');
    const caught = firedOn(run(f), id);
    // на эталоне того же дефекта быть не должно — иначе правило шумит всегда
    const quiet = !firedOn(baseOut, id);

    if (caught && quiet) {
      log('  ДОКАЗАН  ' + id + ' — падает на дефекте, молчит на эталоне');
    } else {
      bad++;
      if (!caught) log('  НЕ ДОКАЗАН ' + id + ' — дефект внесён, а находки ' + id + ' нет: сторож мёртв либо не видит вход (класс Л48)');
      if (!quiet) log('  НЕ ДОКАЗАН ' + id + ' — правило срабатывает и на эталоне: оно шумит, а не ловит');
    }
  }
  log('');
  return { total: bads.length, bad };
}

function verify() {
  log('== verify: доказательство сторожей откатом ==');
  log('');
  const s = verifyCorpus(FIXTURES, (f) => runSensor(path.join(FIXTURES, f)), 'сенсор layout-check (tooling/fixtures)');
  const l = verifyCorpus(LINT_FIXTURES, (f) => runLinter('fixtures/' + f), 'линтер ds-lint, страницы (DS-IBP/fixtures)');
  const e = verifyCorpus(SCREEN_FIXTURES, (f) => runLinter('../Projects/test/fixtures/' + f), 'линтер ds-lint, экраны (Projects/test/fixtures)');

  const total = s.total + l.total + e.total, bad = s.bad + l.bad + e.bad;
  log('фикстур: ' + total + ' (сенсор ' + s.total + ' · линтер-страницы ' + l.total + ' · линтер-экраны ' + e.total + '), доказано: ' + (total - bad) + ', не доказано: ' + bad);
  if (bad === 0) log('Каждое проверенное правило подтверждено откатом, а не наличием строки в файле.');
  return bad === 0 ? 0 : 1;
}

/* ---------------- реестр якорей ----------------

   Зачем реестр отдельным файлом, а не грепом на лету: греп по журналу
   отвечает «такая строка написана», а нужен ответ «такой сторож жив».
   Идентификаторы берутся из ТОЧКИ ОТЧЁТА каждого инструмента — там, где он
   печатает находку, — а не из комментариев: наивный греп по `ds-lint.js`
   даёт 56 идентификаторов, из них пять живут только в прозе шапки. */

function lintIds() {
  const src = rd(path.join(ROOT, 'DS-IBP/scripts/ds-lint.js'));
  const out = new Set();
  // say('WARN', 'A2', …) и out.push(['BLOCKER', 'P1', …]) — обе формы отчёта
  for (const m of src.matchAll(/(?:say|out\.push)\(\s*\[?\s*(?:'[A-Z]+'|lvl)\s*,\s*'([A-Z]\d{1,2})'/g)) out.add(m[1]);
  return [...out].sort(natural);
}

/* Правила линтера, чей ВХОД — не файл, а репозиторий: реестры (index.html,
   ds-nav.js, specs/_index.md), все styles/*.css, все scripts/*.js, дерево
   файлов. Такое правило файловой фикстурой не доказывается в принципе —
   доказывать его пришлось бы фикстурным РЕПОЗИТОРИЕМ.

   Различаются механически, а не списком: репозиторные правила печатают находку
   через `out.push` в глобальной секции, страничные — через локальный `say`
   внутри `pageChecks`. Список руками разъехался бы с кодом на первой же новой
   проверке; здесь он пересчитывается каждым прогоном. */
function lintRepoIds() {
  const src = rd(path.join(ROOT, 'DS-IBP/scripts/ds-lint.js'));
  const at = src.indexOf('function pageChecks');
  const head = at > 0 ? src.slice(0, at) : src;
  const tail = at > 0 ? src.slice(at) : '';
  const ids = (s) => {
    const set = new Set();
    for (const m of s.matchAll(/(?:say|out\.push)\(\s*\[?\s*(?:'[A-Z]+'|lvl)\s*,\s*'([A-Z]\d{1,2})'/g)) set.add(m[1]);
    return set;
  };
  const page = ids(tail);
  // id, встречающийся и там и там, считается страничным: страничный вход у него есть
  return [...ids(head)].filter((id) => !page.has(id)).sort(natural);
}

/* Обычный sort ставит B10 перед B2 — реестр читает человек, порядок должен
   совпадать с тем, как правила пронумерованы. */
const natural = (a, b) => a.localeCompare(b, 'ru', { numeric: true });

function sensorIds() {
  const out = execFileSync(process.execPath, [SENSOR, '--rules'], { encoding: 'utf8' });
  /* Все четыре ряда: Б блокеры, З замечания, К каскад (кириллица),
     K геометрия (латиница). Ряд, забытый здесь, делает реализованную
     проверку невидимой для отчёта — так пропали З3 и З7 (урок Л54). */
  return [...new Set([...out.matchAll(/([БЗКK]\d{1,2}(?:\.\d)?)(?![0-9.])/gu)].map((m) => m[1]))];
}

function auditIds() {
  const src = rd(path.join(ROOT, 'DS-IBP/scripts/spec-audit.mjs'));
  return [...new Set([...src.matchAll(/section\('Проход (\d)/g)].map((m) => m[1]))];
}

/* Пункты чек-листов — первая ячейка строки таблицы. */
function checklistIds(md, letter) {
  const rx = new RegExp('^\\|\\s*(' + letter + '\\d{1,2})\\s*\\|', 'gmu');
  return [...new Set([...md.matchAll(rx)].map((m) => m[1]))];
}

function checkIds() {
  const srv = rd(path.join(ROOT, '.opencode/skills/screen-review/SKILL.md'));
  const cmp = rd(path.join(ROOT, '.opencode/skills/composition-review/SKILL.md'));
  return [...checklistIds(srv, 'Б'), ...checklistIds(srv, 'З'), ...checklistIds(srv, 'К'), ...checklistIds(cmp, 'K')];
}

function anchorsFromCode() {
  return {
    сгенерировано: today(),
    как: 'node .opencode/skills/screen-review/tooling/lessons-cli.mjs anchors --write',
    зачем: 'Журнал уроков сверяется с этим реестром, а не с грепом по коду. Расхождение реестра и кода — находка команды anchors.',
    пространства: {
      'линтер': { источник: 'DS-IBP/scripts/ds-lint.js', алфавит: 'латиница', ids: lintIds() },
      'сенсор': { источник: '.opencode/skills/screen-review/tooling/layout-check.mjs --rules', алфавит: 'кириллица Б/З/К, латинская K — геометрия', ids: sensorIds() },
      'аудит': { источник: 'DS-IBP/scripts/spec-audit.mjs', алфавит: 'номер прохода', ids: auditIds() },
      'чек-лист': { источник: 'SKILL.md screen-review и composition-review', алфавит: 'кириллица Б/З/К, латинская K — композиция', ids: checkIds() },
    },
  };
}

const NS_FREE = new Set(['структурно', 'правило']); // якорь без реестра: гарантия ДС / пункт ds-rules

function cmdAnchors(write) {
  const live = anchorsFromCode();
  if (write) {
    writeFileSync(ANCHORS, JSON.stringify(live, null, 2) + '\n', 'utf8');
    log('anchors.json перезаписан из кода.');
    for (const [ns, v] of Object.entries(live.пространства)) log('  ' + ns + ': ' + v.ids.length + ' — ' + v.ids.join(' '));
    return 0;
  }
  if (!existsSync(ANCHORS)) { log('реестра нет. Создать: anchors --write'); return 1; }
  const saved = JSON.parse(rd(ANCHORS));
  log('== anchors: реестр против кода ==');
  log('');
  let drift = 0;
  for (const [ns, v] of Object.entries(live.пространства)) {
    const was = new Set((saved.пространства?.[ns]?.ids) || []);
    const now = new Set(v.ids);
    const added = [...now].filter((x) => !was.has(x));
    const gone = [...was].filter((x) => !now.has(x));
    log('  ' + ns + ': в коде ' + now.size + ', в реестре ' + was.size);
    if (added.length) { drift++; log('    ПОЯВИЛОСЬ в коде, нет в реестре: ' + added.join(' ')); }
    if (gone.length) { drift++; log('    ЕСТЬ в реестре, нет в коде: ' + gone.join(' ') + ' — либо сторож удалён, либо переименован; уроки с таким якорем повисли'); }
  }
  log('');
  if (drift) {
    log('Реестр разошёлся с кодом. Пока он не обновлён, `check` сверяет журнал');
    log('с устаревшим списком: якорь на удалённого сторожа выглядит живым.');
    log('Обновить: anchors --write');
    return 1;
  }
  log('Реестр совпадает с кодом.');
  return 0;
}

/* ---------------- coverage ---------------- */

function coverage() {
  const srv = rd(path.join(ROOT, '.opencode/skills/screen-review/SKILL.md'));
  const cmp = rd(path.join(ROOT, '.opencode/skills/composition-review/SKILL.md'));

  const groups = [
    ['блокеры screen-review', 'Б', checklistIds(srv, 'Б')],
    ['замечания screen-review', 'З', checklistIds(srv, 'З')],
    ['каскад screen-review', 'К', checklistIds(srv, 'К')],
    ['композиция composition-review', 'K', checklistIds(cmp, 'K')],
  ];

  const sensor = new Set(sensorIds());
  const reg = existsSync(REGISTRY) ? JSON.parse(rd(REGISTRY)) : {};
  const judgment = reg.judgment || {};       // id -> причина, почему статикой не ловится
  /* id -> «якорь — обоснование» для пунктов, закрытых НЕ сенсором экранов.
     Графа общая, а не «byLinter»: закрывать пункт может линтер, проход аудита
     или структурная гарантия ДС, и заводить по колонке на каждый инструмент
     значит переписывать отчёт при появлении следующего. Пространство имён
     берётся из самого якоря. */
  const closedBy = reg.closedBy || {};
  const mech = new Set(reg.mechanizable || []); // id -> сторож посилен, просто не написан

  log('== coverage: чем закрыт каждый пункт чек-листов ==');
  log('');

  let all = 0, byCode = 0, byOther = 0, asJudgment = 0, planned = 0;
  const unclassified = [];
  const nsOf = (v) => (String(v).match(/^([а-яё-]+):/u) || [, 'другим'])[1];

  for (const [name, , ids] of groups) {
    const code = ids.filter((id) => sensor.has(id));
    const other = ids.filter((id) => !sensor.has(id) && closedBy[id]);
    const judg = ids.filter((id) => !sensor.has(id) && !closedBy[id] && judgment[id]);
    const plan = ids.filter((id) => !sensor.has(id) && !closedBy[id] && !judgment[id] && mech.has(id));
    const none = ids.filter((id) => !sensor.has(id) && !closedBy[id] && !judgment[id] && !mech.has(id));

    all += ids.length; byCode += code.length; byOther += other.length; asJudgment += judg.length; planned += plan.length;
    unclassified.push(...none);

    log(name + ' — всего ' + ids.length);
    log('  сенсором:    ' + (code.length ? code.join(' ') : '—'));
    log('  иначе:       ' + (other.length ? other.map((id) => id + ' (' + nsOf(closedBy[id]) + ')').join(' ') : '—'));
    log('  суждение:    ' + (judg.length ? judg.join(' ') : '—'));
    log('  посильно:    ' + (plan.length ? plan.join(' ') : '—'));
    if (none.length) log('  НЕ РАЗМЕЧЕНО: ' + none.join(' '));
    log('');
  }

  /* Частичное закрытие печатается отдельно и всегда. Пункт с оговоркой,
     закрытый молча, читается как закрытый целиком, и оставшаяся половина не
     попадает ни в один список — ни в рабочий, ни в суждения. */
  const partial = reg.partial || {};
  const partialIds = Object.keys(partial);
  if (partialIds.length) {
    log('ЗАКРЫТО ЧАСТИЧНО — ' + partialIds.length + ':');
    for (const id of partialIds) log('  ' + id + ': ' + partial[id]);
    log('');
  }

  log('ИТОГО ' + all + ': сенсором ' + byCode + ' · другим инструментом ' + byOther + ' · суждение ' + asJudgment + ' · посильно, не написано ' + planned + ' · не размечено ' + unclassified.length);
  /* Графа «иначе» появилась не для красоты: без неё отчёт ЗАНИЖАЛ закрытость.
     Пункт К7 («@import не считается подключением») закрыт правилом A2 в ds-lint
     и числился «посильным, не написанным» только потому, что coverage смотрел
     в один инструмент из двух (урок Л67). */
  log('');
  if (unclassified.length) {
    log('Не размечено — это не «плохо», это «решение не принято». Каждый пункт');
    log('обязан быть либо закрыт сторожем, либо признан суждением с причиной,');
    log('либо помечен посильным. Разметка — в coverage.json рядом с этим файлом.');
    return 1;
  }
  log('Все пункты классифицированы. «Посильно, не написано» — рабочий список,');
  log('он и должен уменьшаться; «суждение» — честная граница статики (ds-rules §9).');
  return 0;
}

/* ---------------- check ----------------

   Механическая проверка формы записей. Делит находки на два веса:
   БЛОКЕР — запись врёт (якорь на несуществующего сторожа, объявленное
   исполняемое закрепление без фикстуры, задвоенный номер, ритуал описан
   в двух местах); ЗАМЕЧАНИЕ — запись неполна (нет поля, нестандартный
   ярлык). Код выхода 1 только на блокерах: неполнота — предмет Э3/Э5,
   ложь — предмет немедленной правки. */

/* Гомоглифы: `B9` (латинская) и `Б9` — разные сторожа, на экране одинаковы.
   Поэтому промах по реестру сначала проверяется на подмену алфавита, и
   сообщение называет причину, а не просто «нет в реестре». */
const HOMO = { 'А': 'A', 'В': 'B', 'Е': 'E', 'К': 'K', 'М': 'M', 'Н': 'H', 'О': 'O', 'Р': 'P', 'С': 'C', 'Т': 'T', 'У': 'Y', 'Х': 'X' };
const HOMO_BACK = Object.fromEntries(Object.entries(HOMO).map(([c, l]) => [l, c]));
const swapAlphabet = (id) => {
  const h = id[0];
  const other = HOMO[h] || HOMO_BACK[h];
  return other ? other + id.slice(1) : null;
};

const FIX_LEVELS = ['исполняемое', 'временное', 'неизмеримое'];

/* Ярлыки полей. Канон — пять; всё остальное сводится к ним в Э3. */
const CANON = ['Дата/зона', 'Симптом', 'Причина', 'Правило', 'Закрепление'];
const OPTIONAL = ['Для приёмки', 'Промоут'];
/* Без `\b`: граница слова в JS считается по ASCII, после кириллической буквы
   её нет — `/^Правило\b/` не совпадает НИ С ЧЕМ и молча даёт «правила нет»
   у всех 92 записей. Тот же класс, что Л51: регулярка синтаксически верна,
   а совпадений ноль. */
const RULE_LABELS = /^(Правил[оа]|Решение)/u;

function entriesOf(file) {
  const src = rd(file);
  const eol = src.includes('\r\n') ? '\r\n' : '\n';
  const lines = src.split(/\r?\n/);
  const out = [];
  let cur = null;
  lines.forEach((line, i) => {
    const m = line.match(/^### Л(\d+)\.\s*(.*)$/);
    if (m) {
      cur = { num: Number(m[1]), title: m[2].trim(), line: i + 1, body: [], file };
      out.push(cur);
    } else if (cur) cur.body.push(line);
  });
  return { entries: out, eol, src };
}

/* Ярлык поля: `- **Имя:**` и форма с уточнением `- **Закрепление (дата): уровень —**`.
   Вторая появилась стихийно и ломала наивный греп — поэтому разбирается явно. */
function fieldsOf(entry) {
  const labels = [];
  for (const line of entry.body) {
    const m = line.match(/^\s*[-*]\s+\*\*([^*]+?)\*\*/u);
    if (!m) continue;
    const raw = m[1].trim();
    const head = raw.split(/[(:]/)[0].trim();
    labels.push({ raw, head, line });
  }
  return labels;
}

function checkOwners(findings) {
  /* Самоприменение Л43: у процедуры один владелец. Файл считается владельцем,
     если ОПРЕДЕЛЯЕТ все три уровня закрепления; журналы их употребляют, а не
     определяют, и из проверки исключены. */
  const owners = [];
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { if (e.name !== 'node_modules' && e.name !== '.git') walk(p); continue; }
      if (!e.name.endsWith('.md')) continue;
      if (/lessons(-raw)?\.md$/.test(e.name)) continue;
      const t = rd(p);
      if (FIX_LEVELS.every((l) => t.includes(l))) owners.push(path.relative(ROOT, p).replace(/\\/g, '/'));
    }
  };
  walk(path.join(ROOT, '.opencode'));
  const agents = path.join(ROOT, 'AGENTS.md');
  if (existsSync(agents) && FIX_LEVELS.every((l) => rd(agents).includes(l))) owners.push('AGENTS.md');

  const OWNER = '.opencode/skills/lessons/SKILL.md';
  const extra = owners.filter((p) => p !== OWNER);
  if (!owners.includes(OWNER)) findings.push(['БЛОКЕР', 'Л-ВЛАДЕЛЕЦ', OWNER + ' не определяет три уровня закрепления — владельца ритуала нет']);
  for (const p of extra) findings.push(['БЛОКЕР', 'Л-ВЛАДЕЛЕЦ', p + ' повторно определяет уровни закрепления. У процедуры один владелец (' + OWNER + '), остальные — указатели: копия разъедется молча (урок Л43)']);
  return owners.length;
}

/* Сколько прогонов инструментов записано ПОСЛЕ указанного дня. Считаются все
   инструменты разом: якорь временного закрепления часто указывает на пункт
   чек-листа, у которого своего прогона нет вовсе. */
let runTimes = null;   // журнал читается один раз на прогон, а не на каждую запись
function runsSince(day) {
  if (!runTimes) runTimes = readRuns().map((r) => Date.parse(r.t)).filter((n) => !Number.isNaN(n));
  return runTimes.filter((t) => t >= day + 24 * 3600 * 1000).length;
}

function cmdCheck() {
  if (!existsSync(ANCHORS)) { log('реестра якорей нет. Создать: anchors --write'); return 1; }
  const reg = JSON.parse(rd(ANCHORS)).пространства || {};
  const known = new Set([...Object.keys(reg), ...NS_FREE]);
  const fixtures = existsSync(FIXTURES) ? new Set(readdirSync(FIXTURES).filter((f) => f.endsWith('.bad.html')).map((f) => f.replace(/\.bad\.html$/, ''))) : new Set();

  const findings = [];
  const stats = { entries: 0, withRule: 0, withFix: 0, anchors: 0, refs: 0 };

  /* Номера, которые вообще существуют. Собираются по обоим файлам заранее:
     выжимка ссылается на записи, живущие только в архиве. */
  const knownNums = new Set();
  for (const file of [RAW, CUR]) for (const e of entriesOf(file).entries) knownNums.add(e.num);

  /* Даты записей по номеру — из архива: он полон, в выжимке поле срезано.
     Второй запас — заголовок раздела `## ДД.ММ.ГГГГ — …`: у ранних записей
     поля «Дата/зона» ещё не было, зато архив разбит на датированные разделы.
     Дата берётся оттуда, а не назначается: назначить дату задним числом
     значило бы выдумать данные, а раздел — факт, записанный тогда же. */
  const dayByNum = new Map();
  {
    const rawLines = rd(RAW).split(/\r?\n/);
    const sectionDay = [];
    let cur = 0;
    for (const line of rawLines) {
      const h = line.match(/^##\s+(\d{2}\.\d{2}\.\d{4})/u);
      if (h) cur = parseDay(h[1]) || cur;
      sectionDay.push(cur);
    }
    for (const e of entriesOf(RAW).entries) {
      const own = parseDay(e.body.find((l) => /^\s*[-*]\s+\*\*Дата\/зона:/u.test(l)) || '');
      const d = own || sectionDay[e.line - 1] || 0;
      if (d) dayByNum.set(e.num, d);
    }
  }

  for (const file of [RAW, CUR]) {
    const rel = path.relative(ROOT, file).replace(/\\/g, '/');
    const { entries } = entriesOf(file);
    const seen = new Map();

    for (const e of entries) {
      stats.entries++;
      const where = rel + ':' + e.line + ' Л' + e.num;

      if (seen.has(e.num)) findings.push(['БЛОКЕР', 'Л-НОМЕР', where + ' — номер уже занят записью на строке ' + seen.get(e.num) + '. Ссылка «см. Лn» перестаёт быть однозначной']);
      seen.set(e.num, e.line);

      const labels = fieldsOf(e);
      const heads = labels.map((l) => l.head);
      const text = e.body.join('\n');

      if (heads.some((h) => RULE_LABELS.test(h))) stats.withRule++;
      else findings.push(['ЗАМЕЧАНИЕ', 'Л-ПРАВИЛО', where + ' — нет поля с правилом. Урок без правила — это запись о происшествии, применить её не к чему']);

      for (const l of labels) {
        if (CANON.includes(l.head) || OPTIONAL.includes(l.head)) continue;
        findings.push(['ЗАМЕЧАНИЕ', 'Л-ЯРЛЫК', where + ' — ярлык «' + l.raw + '» вне словаря (' + CANON.join(', ') + '; необязательные: ' + OPTIONAL.join(', ') + ')']);
      }

      // закрепление: ярлык может нести уровень внутри — «Закрепление (дата): исполняемое —»
      const fixLabel = labels.find((l) => l.head === 'Закрепление');
      if (!fixLabel) {
        findings.push(['ЗАМЕЧАНИЕ', 'Л-ЗАКР', where + ' — нет поля «Закрепление»: во что урок превратился, не сказано']);
      } else {
        stats.withFix++;
        const scope = fixLabel.line + '\n' + (e.body[e.body.indexOf(fixLabel.line) + 1] || '');
        const level = FIX_LEVELS.find((l) => scope.includes(l));
        if (!level) findings.push(['БЛОКЕР', 'Л-УРОВЕНЬ', where + ' — «Закрепление» без уровня. Допустимы: ' + FIX_LEVELS.join(' / ')]);
        else if (level === 'исполняемое') {
          const sens = [...scope.matchAll(/сенсор:\s*([БЗКK]\d{1,2}(?:\.\d)?)/gu)].map((m) => m[1]);
          for (const id of sens) {
            if (!fixtures.has(id)) findings.push(['БЛОКЕР', 'Л-ОРАКУЛ', where + ' — объявлено исполняемое закрепление на сенсор:' + id + ', а пары фикстур ' + id + '.bad.html нет. Уровень недоказан и понижается до «временное» (Л42 в новом обличье)']);
          }
        }
        /* Срок жизни «временного». Уровень задуман как расписка «правило пока
           держится на памяти» — без срока такая расписка становится вечной, и
           «временное» превращается в способ не писать сторожа. Срок меряется
           ПРОГОНАМИ, а не календарём: неделя простоя ничего не проверяет, а
           десять прогонов означают, что случай встречался и повод написать
           сторожа был. Снимается явным «продлено: причина». */
        else if (level === 'временное') {
          /* Дата берётся из записи, а при её отсутствии — из архивной записи с
             тем же номером. В выжимке «Дата/зона» срезана курацией, и без этой
             подстановки срок не отсчитывался бы ровно у тех записей, ради
             которых правило написано: временное закрепление живёт как раз в
             выжимке. Правило, которое есть, но не применяется, — тот же класс,
             что Л71. */
          const own = parseDay((e.body.find((l) => /^\s*[-*]\s+\*\*Дата\/зона:/u.test(l)) || ''));
          const day = own || dayByNum.get(e.num) || 0;
          const n = day ? runsSince(day) : 0;
          if (!day) findings.push(['ЗАМЕЧАНИЕ', 'Л-СРОК', where + ' — временное закрепление без даты ни в записи, ни в архиве: срок не отсчитывается, уровень становится вечным']);
          else if (n >= HORIZON && !/продлен/iu.test(scope)) {
            findings.push(['ЗАМЕЧАНИЕ', 'Л-СРОК', where + ' — временное закрепление держится ' + n + ' прогонов (предел ' + HORIZON + '). Либо поднять до исполняемого (сторож + пара фикстур), либо дописать в поле «продлено: причина»']);
          }
        }
      }

      // якоря известных пространств — сверяются с реестром
      for (const m of text.matchAll(/(линтер|сенсор|чек-лист|аудит):\s*([^\s`,;)]+)/gu)) {
        const ns = m[1];
        let id = m[2].replace(/[.,;:)»]+$/u, '');
        if (ns === 'аудит') { const d = id.match(/(\d)\s*$/); id = d ? d[1] : id; }
        stats.anchors++;
        const ids = new Set(reg[ns]?.ids || []);
        if (ids.has(id)) continue;
        const alt = swapAlphabet(id);
        if (alt && ids.has(alt)) findings.push(['БЛОКЕР', 'Л-АЛФАВИТ', where + ' — якорь ' + ns + ':' + id + ' записан не тем алфавитом; в реестре ' + ns + ':' + alt + '. На экране они неразличимы, а сторожа разные']);
        else findings.push(['БЛОКЕР', 'Л-ЯКОРЬ', where + ' — якорь ' + ns + ':' + id + ' в реестре не значится: сторожа с таким идентификатором нет']);
      }

      /* Перекрёстные ссылки «см. Лn». Ссылка на несуществующий номер молча
         уводит читателя в пустоту, а промах на единицу правдоподобен как
         нигде: номер присваивает команда в момент дозаписи, и порядок записи
         не совпадает с порядком, в котором уроки задумывались. */
      for (const m of text.matchAll(/Л(\d+)/gu)) {
        const n = Number(m[1]);
        stats.refs++;
        if (!knownNums.has(n)) findings.push(['БЛОКЕР', 'Л-ССЫЛКА', where + ' — ссылка на Л' + n + ', записи с таким номером нет ни в архиве, ни в выжимке']);
      }

      /* Якоря неизвестных пространств — только внутри обратных кавычек и только
         с КИРИЛЛИЧЕСКИМ именем пространства. Латиницу пришлось исключить:
         журнал полон CSS-объявлений в кавычках (`flex-grow:1`, `overflow-y:auto`),
         и они неотличимы от якоря по форме — различает их алфавит. */
      for (const m of text.matchAll(/`([а-яё-]{3,12}):([^`\s]{1,14})`/gu)) {
        if (known.has(m[1])) continue;
        findings.push(['БЛОКЕР', 'Л-ПРОСТРАНСТВО', where + ' — пространство имён «' + m[1] + ':» не заведено. Известные: ' + [...known].join(', ')]);
      }
    }
  }

  const owners = checkOwners(findings);

  log('== check: форма записей журнала ==');
  log('');
  const blockers = findings.filter((f) => f[0] === 'БЛОКЕР');
  const warns = findings.filter((f) => f[0] === 'ЗАМЕЧАНИЕ');
  for (const [lvl, id, msg] of [...blockers, ...warns]) log('  ' + lvl + '  ' + id + '  ' + msg);
  if (!findings.length) log('  находок нет');
  log('');
  /* Счётчики печатаются рядом с находками намеренно: правило, давшее НОЛЬ
     совпадений на заведомо непустом входе, выглядит как «чисто». Так уже
     случилось — `/^Правило\b/` не совпало ни с чем, потому что граница слова
     в JS считается по ASCII (урок Л56). Ноль в этой строке виден сразу. */
  log('записей ' + stats.entries + ' · с правилом ' + stats.withRule + ' · с закреплением ' + stats.withFix + ' · якорей сверено ' + stats.anchors + ' · ссылок Лn ' + stats.refs + ' · владельцев ритуала ' + owners);
  log('БЛОКЕР ' + blockers.length + ' · ЗАМЕЧАНИЕ ' + warns.length);
  log('');
  log('БЛОКЕР — запись врёт: якорь на несуществующего сторожа, недоказанное');
  log('закрепление, задвоенный номер, ритуал в двух местах. Чинится сразу.');
  log('ЗАМЕЧАНИЕ — запись неполна: нет поля, ярлык вне словаря. Предмет Э3/Э5.');
  return blockers.length ? 1 : 0;
}

/* ---------------- add ----------------

   Черновик пишется редактором (кириллица и регулярки через шелл не проходят),
   а механику — номер, дату, EOL, `updated:` — делает CLI: именно на ней
   ошибались руками. Номер берётся как max+1 по ОБОИМ файлам: нумерация
   немонотонна, «последний в файле» не значит «наибольший». */

function cmdAdd(draftPath) {
  if (!draftPath || !existsSync(draftPath)) { log('нужен черновик: add --from <файл.md>'); return 2; }
  let draft = rd(draftPath).replace(/\r\n/g, '\n').trim();

  const head = draft.match(/^### Л([\d_?]+)\./);
  if (!head) { log('черновик обязан начинаться со строки «### Л_. <заголовок>»'); return 2; }

  const maxOf = (f) => Math.max(0, ...[...rd(f).matchAll(/^### Л(\d+)\./gm)].map((m) => Number(m[1])));
  const next = Math.max(maxOf(RAW), maxOf(CUR)) + 1;
  draft = draft.replace(/^### Л[\d_?]+\./, '### Л' + next + '.').replace(/\{дата\}/g, today());

  const src = rd(RAW);
  const eol = src.includes('\r\n') ? '\r\n' : '\n';
  const body = draft.split('\n').join(eol);
  let out = src.replace(/\s+$/, '') + eol + eol + body + eol;
  // `updated:` в кавычках — иначе YAML читает дату как число и ломается C3
  out = out.replace(/^updated:.*$/m, 'updated: "' + today() + '"');

  writeFileSync(RAW, out, 'utf8');
  log('Л' + next + ' дописан в ' + path.relative(ROOT, RAW).replace(/\\/g, '/') + ' (EOL ' + (eol === '\r\n' ? 'CRLF' : 'LF') + ', updated ' + today() + ')');
  log('');
  return cmdCheck();
}

/* ---------------- state ----------------
   Состояние журнала печатается, а не пересказывается прозой: любая записанная
   в текст цифра устаревает на следующей же правке (этот файл появился ровно
   потому, что абзац «38 записей / 228 строк» устарел через час). */

function state() {
  const raw = rd(RAW);
  const cur = rd(CUR);
  const nums = (s) => [...s.matchAll(/^### Л(\d+)\./gm)].map((m) => Number(m[1]));

  const inRaw = new Set(nums(raw));
  const inCur = new Set(nums(cur));

  const blocks = raw.split(/^(?=### Л\d+\.)/m).filter((b) => /^### Л\d+\./.test(b));
  const decided = new Map();
  for (const b of blocks) {
    const n = Number(b.match(/^### Л(\d+)\./)[1]);
    const m = b.match(/^- \*\*Промоут:\*\* (.+)$/m);
    decided.set(n, m ? m[1].trim() : null);
  }

  const notInCur = [...inRaw].filter((n) => !inCur.has(n)).sort((a, b) => a - b);
  const debt = notInCur.filter((n) => !decided.get(n));
  const curLines = cur.split(/\r?\n/).length;

  const LIMIT_N = 20, LIMIT_L = 150;
  log('== состояние журнала уроков ==');
  log('');
  log('  архив:   ' + inRaw.size + ' записей');
  log('  выжимка: ' + inCur.size + ' записей / ' + curLines + ' строк   (предел ' + LIMIT_N + ' / ' + LIMIT_L + ')');
  log('');
  log('  долг курации (нет в выжимке, решение не записано): ' + debt.length + (debt.length ? ' — ' + debt.map((n) => 'Л' + n).join(' ') : ''));

  const curBlocks = cur.split(/^(?=### Л\d+\.)/m).filter((b) => /^### Л\d+\./.test(b));
  const withFix = curBlocks.filter((b) => /\*\*Закрепление/.test(b)).length;
  log('  в выжимке объявили закрепление: ' + withFix + ' из ' + curBlocks.length);

  /* Шарды печатаются рядом с выжимкой, иначе отчёт вводит в заблуждение:
     «14 записей» звучит как «столько всего читают», а по scope читают ещё два
     файла. Предел относится к КАЖДОЙ выжимке отдельно — он меряет стоимость
     чтения на одной задаче, а не объём журнала (урок Л79). */
  const SHARDS = [
    ['docs-split', '.opencode/skills/docs-split/references/lessons.md'],
    ['lessons', '.opencode/skills/lessons/references/lessons.md'],
  ];
  const live = SHARDS.filter(([, p]) => existsSync(path.join(ROOT, p)));
  if (live.length) {
    log('');
    log('  шарды по scope (свой предел у каждого):');
    for (const [name, p] of live) {
      const s = rd(path.join(ROOT, p));
      log('    ' + name + ': ' + nums(s).length + ' записей / ' + s.split(/\r?\n/).length + ' строк');
    }
  }
  log('');

  const over = inCur.size > LIMIT_N || curLines > LIMIT_L;
  if (over) {
    log('Выжимка сверх предела. Это не «журнал вырос» — это счётчик несделанных');
    log('закреплений: столько уроков держатся на памяти агента вместо кода.');
  }
  if (debt.length >= 3) log('Долг курации >= 3 — курация обязательна (триггер по событию, не по календарю).');

  // код выхода: долг курации — то, что чинится за минуту; предел — долгая работа
  return debt.length >= 3 ? 1 : 0;
}

/* ---------------- stats ----------------

   Вопрос, на который не отвечают ни `verify`, ни `coverage`: что случилось с
   правилом ПОСЛЕ того, как урок объявили закреплённым. `verify` доказывает, что
   сторож жив на фикстуре; `coverage` — что пункт чек-листа кем-то закрыт. Оба
   слепы к полю: сторож может ловить дефект на выдуманной разметке и ни разу не
   сработать на настоящей, а дефект — вернуться назавтра после закрытия урока.

   Различаются четыре состояния, и различаются машинно:
     РЕГРЕСС   — код появился ПОЗЖЕ дня, которым урок объявил закрепление.
                 Сигнала этого рода не было вовсе.
     ЖИВОЙ     — встречался в последних HORIZON прогонах инструмента.
     ИСЧЕЗ     — встречался раньше, в последних HORIZON прогонах нет.
                 Это и есть «обучение»: правило перестало срабатывать.
     НЕ ВСТРЕЧАЛСЯ — дальше развилка, и она принципиальна:
                 доказан фикстурой  → норма, правило работает на упреждение;
                 фикстуры нет        → сторож не доказан и ни разу не сработал.
                 Приравнивать эти два случая нельзя: первый — цель, второй —
                 ровно тот дефект «правило записано, кода нет» (Л42), только
                 переехавший на уровень сторожа.

   Инструмент, у которого нет прогонов, НЕ классифицируется вовсе — иначе
   пустой журнал объявил бы мёртвыми все правила разом. */

const HORIZON = 10;

function readRuns() {
  if (!existsSync(RUNS)) return [];
  const out = [];
  for (const line of rd(RUNS).split(/\r?\n/)) {
    if (!line.trim()) continue;
    try { out.push(JSON.parse(line)); } catch { /* битая строка журнала не роняет отчёт */ }
  }
  return out;
}

const parseDay = (s) => {
  const m = String(s).match(/(\d{2})\.(\d{2})\.(\d{4})/);
  return m ? Date.UTC(Number(m[3]), Number(m[2]) - 1, Number(m[1])) : null;
};
const fmtDay = (ms) => {
  const d = new Date(ms), p = (n) => String(n).padStart(2, '0');
  return p(d.getUTCDate()) + '.' + p(d.getUTCMonth() + 1) + '.' + d.getUTCFullYear();
};

/* Файлы журнала: архив, выжимка и шарды по scope. Шард — такой же журнал,
   и закрепление, объявленное в нём, обязано проверяться так же (Л79). */
function journalFiles() {
  const list = [RAW, CUR,
    path.join(ROOT, '.opencode/skills/docs-split/references/lessons.md'),
    path.join(ROOT, '.opencode/skills/lessons/references/lessons.md')];
  return list.filter((p) => existsSync(p));
}

/* Якорь → день, которым закрепление объявлено.

   Источников ДВА, и второй важнее первого. «Закрепление: исполняемое — `якорь`»
   объявляет намерение; «Промоут: выведен из выжимки — закреплён `якорь`»
   объявляет СВЕРШИВШЕЕСЯ закрытие, после которого урок перестали держать в
   памяти. Ровно эти записи и должны сторожиться на регресс — а первая версия
   разбора читала только «Закрепление» и не увидела ни одной из 14 выведенных:
   у выведенного урока правило живёт в поле «Правило» прозой, а якорь — в
   «Промоуте». Проверка регресса молчала бы всегда, и молчание читалось бы как
   «регресса нет» (тот же класс, что Л56).

   День — позднейшая из дат записи и промоута: закрытие объявлено промоутом. */
function fixationDays() {
  const days = new Map();
  for (const file of journalFiles()) {
    for (const e of entriesOf(file).entries) {
      const body = e.body.join('\n');
      const fixLine = e.body.find((l) => /^\s*[-*]\s+\*\*Закрепление/u.test(l)) || '';
      const promoLine = e.body.find((l) => /^\s*[-*]\s+\*\*Промоут:/u.test(l)) || '';
      const sources = [];
      if (/исполняемое/u.test(fixLine)) sources.push(fixLine);   // временное и неизмеримое регресс не сторожат
      if (/закреплён|закреплена/u.test(promoLine)) sources.push(promoLine);
      if (!sources.length) continue;
      const d1 = parseDay((body.match(/^\s*[-*]\s+\*\*Дата\/зона:\*\*\s*(.+)$/mu) || [])[1] || '');
      const d2 = parseDay(promoLine);
      const day = Math.max(d1 || 0, d2 || 0);
      if (!day) continue;
      for (const m of sources.join('\n').matchAll(/(линтер|сенсор|аудит):\s*([^\s`,;)]+)/gu)) {
        const id = m[2].replace(/[.,;:)»]+$/u, '');
        const key = m[1] + ':' + id;
        const prev = days.get(key);
        if (!prev || day > prev.day) days.set(key, { day, num: e.num });
      }
    }
  }
  return days;
}

/* Корпус фикстур есть не у каждого пространства имён, и это не пробел, а
   устройство инструмента. `чек-лист:` — вообще не инструмент: он ничего не
   прогоняет и в журнал прогонов не пишет. `аудит:` прогоняется, но его
   «коды» — номера проходов-инвентаризаций, а не сторожа: молчащий проход
   значит «обещаний без кода не нашлось», то есть ЗАКРЫТО, а не «мёртвое
   правило». Приравнять их к сторожу без фикстуры — соврать в отчёте. */
const CORPUS = { 'сенсор': [FIXTURES], 'линтер': [LINT_FIXTURES, SCREEN_FIXTURES] };
const RUN_TOOLS = ['сенсор', 'линтер', 'аудит'];

function fixtureIdsFor(ns) {
  const ids = new Set();
  for (const dir of (CORPUS[ns] || [])) {
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) if (f.endsWith('.bad.html')) ids.add(f.replace(/\.bad\.html$/, ''));
  }
  return ids;
}

function stats() {
  const runs = readRuns();
  log('== stats: сигнал об эффекте ==');
  log('');
  if (!runs.length) {
    log('  журнал прогонов пуст: ' + path.relative(ROOT, RUNS).replace(/\\/g, '/'));
    log('');
    log('Он наполняется сам — каждым прогоном сенсора, линтера и аудита на');
    log('НАСТОЯЩЕМ файле. Фикстуры в журнал не идут намеренно: `verify` даёт');
    log('срабатывание по определению, и с ними «код появлялся» стало бы верно');
    log('для любого сторожа, то есть сигнал обнулился бы.');
    return 0;
  }

  if (!existsSync(ANCHORS)) { log('реестра якорей нет. Создать: anchors --write'); return 1; }
  const reg = JSON.parse(rd(ANCHORS)).пространства || {};
  const fixed = fixationDays();

  const byTool = new Map();
  for (const r of runs) {
    if (!byTool.has(r.tool)) byTool.set(r.tool, []);
    byTool.get(r.tool).push(r);
  }
  const times = runs.map((r) => Date.parse(r.t)).filter((n) => !Number.isNaN(n));
  log('  прогонов: ' + runs.length + '   ' + [...byTool].map(([t, rs]) => t + ' ' + rs.length).join(' · '));
  if (times.length) log('  период: ' + fmtDay(Math.min(...times)) + ' — ' + fmtDay(Math.max(...times)));
  log('  журнал: ' + path.relative(ROOT, RUNS).replace(/\\/g, '/'));
  /* Счётчик печатается рядом с выводом: разбор дат закрепления, давший НОЛЬ,
     выглядел бы как «регресса нет» — то же, чем обманул `/^Правило\b/` (Л56). */
  log('  якорей с датой закрепления: ' + fixed.size);
  log('');
  log('  «не встречался» считается ОТ НАЧАЛА ЖУРНАЛА, а не за всю историю:');
  log('  дефект, починенный до ' + (times.length ? fmtDay(Math.min(...times)) : '—') + ', сюда не попадёт по построению.');
  log('');

  const regress = [];
  let dead = 0, prevented = 0;

  for (const ns of RUN_TOOLS) {
    const ids = reg[ns]?.ids || [];
    const rs = byTool.get(ns) || [];
    const fixtures = fixtureIdsFor(ns);
    log('— ' + ns + ' (' + ids.length + ' правил, прогонов ' + rs.length + ')');
    if (!rs.length) {
      log('    прогонов нет — коды не классифицируются. Пустой журнал не делает');
      log('    правило мёртвым, он делает вывод невозможным.');
      log('');
      continue;
    }
    const recent = new Set(rs.slice(-HORIZON).flatMap((r) => r.codes || []));
    const ever = new Map();                       // id → последний прогон, где встретился
    for (const r of rs) for (const c of (r.codes || [])) ever.set(c, r);

    const hasCorpus = Boolean(CORPUS[ns]);
    const repo = ns === 'линтер' ? new Set(lintRepoIds()) : new Set();
    const alive = [], gone = [], never = [], unproven = [], noOracle = [];
    for (const id of ids) {
      const last = ever.get(id);
      if (!last) {
        if (repo.has(id)) noOracle.push(id);
        else (!hasCorpus || fixtures.has(id) ? never : unproven).push(id);
        continue;
      }
      const f = fixed.get(ns + ':' + id);
      const t = Date.parse(last.t);
      // строго ПОЗЖЕ дня закрепления: прогон того же дня — это и есть прогон, которым закрывали
      if (f && t >= f.day + 24 * 3600 * 1000) { regress.push({ ns, id, f, last }); continue; }
      (recent.has(id) ? alive : gone).push(id);
    }
    dead += unproven.length;
    if (hasCorpus) prevented += never.length;   // молчащий проход аудита в этот счёт не идёт

    if (alive.length) log('    ЖИВОЙ (в последних ' + HORIZON + ' прогонах): ' + alive.join(' '));
    if (gone.length) log('    ИСЧЕЗ (встречался раньше): ' + gone.join(' '));
    if (hasCorpus) {
      log('    НЕ ВСТРЕЧАЛСЯ, доказан фикстурой: ' + never.length + (never.length ? '  (' + never.join(' ') + ')' : ''));
      if (unproven.length) log('    НЕ ВСТРЕЧАЛСЯ и фикстуры нет: ' + unproven.length + '  ' + unproven.join(' '));
      if (noOracle.length) log('    ВХОД — РЕПОЗИТОРИЙ, файловой фикстурой не доказывается: ' + noOracle.length + '  ' + noOracle.join(' '));
    } else {
      log('    МОЛЧАЛ: ' + never.length + (never.length ? '  (' + never.join(' ') + ')' : '') + ' — у аудита это ЗАКРЫТО, а не пробел: проход перечисляет обещания без кода, и пустой список значит, что таких нет. Корпуса фикстур у пространства нет по устройству.');
    }
    if (rs.length < HORIZON) log('    прогонов меньше ' + HORIZON + ' — деление «живой / исчез» предварительное');
    log('');
  }

  log('  РЕГРЕСС: ' + regress.length);
  for (const r of regress) {
    log('    ' + r.ns + ':' + r.id + ' — Л' + r.f.num + ' объявил закрепление ' + fmtDay(r.f.day) +
        ', код снова сработал ' + fmtDay(Date.parse(r.last.t)) + ' на ' + (r.last.target || '—'));
  }
  log('');
  log('Регресс — единственная находка этой команды: закрытый урок не удержал');
  log('дефект. «Не встречался и фикстуры нет» (' + dead + ') — рабочий список для verify,');
  log('«не встречался, доказан фикстурой» (' + prevented + ') — норма, а не пробел.');
  return regress.length ? 1 : 0;
}

/* ---------------- main ---------------- */

const argv = process.argv.slice(2);
const cmd = argv[0];
const flag = (name) => argv.includes(name);
const value = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : null; };

if (cmd === 'verify') process.exit(verify());
else if (cmd === 'coverage') process.exit(coverage());
else if (cmd === 'anchors') process.exit(cmdAnchors(flag('--write')));
else if (cmd === 'check') process.exit(cmdCheck());
else if (cmd === 'add') process.exit(cmdAdd(value('--from')));
else if (cmd === 'state') process.exit(state());
else if (cmd === 'stats') process.exit(stats());
else {
  log('Использование:');
  log('  node lessons-cli.mjs verify            — доказать сторожей откатом на фикстурах');
  log('  node lessons-cli.mjs coverage          — чем закрыт каждый пункт чек-листов');
  log('  node lessons-cli.mjs anchors [--write]  — реестр живых идентификаторов против кода');
  log('  node lessons-cli.mjs check             — форма записей журнала: якоря, уровни, поля');
  log('  node lessons-cli.mjs add --from <файл> — дозаписать урок из черновика');
  log('  node lessons-cli.mjs state             — объём журнала, долг курации, закрепления');
  log('  node lessons-cli.mjs stats             — что было ПОСЛЕ закрепления: регресс, обучение, мёртвые правила');
  process.exit(2);
}
