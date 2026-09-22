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
     gate      — проверки по изменениям одной командой в конце захода: гоняет
                 только сторожей того, что изменилось со снимка. `--full` —
                 всё, `--dry` — показать шаги, `--changed <путь,…>` — задать
                 набор изменений (проверка матрицы).
     verify    — прогон фикстур: каждая пара «дефект/эталон» доказывает, что
                 сторож живой. Код выхода 1, если хоть один не доказан.
                 `--only <ID>` — одно правило, `--corpus sensor|lint` — один корпус.
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
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { includersOf, assembledOf } from './fragments.mjs';
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
   Правила A7, F6, L4, L5, L6 внутри `DS-IBP/fixtures/` не срабатывают никогда —
   доказывать их там значило бы доказывать на входе, который им не вход (Л71).
   С 15.09.2026 корпус лежит в оснастке (подпапка tooling/fixtures), а не в
   удалённой песочнице Projects/test. Сенсорный корпус эту подпапку не читает:
   verifyCorpus обходит каталог без вложенных. */
const SCREEN_FIXTURES_REL = '.opencode/skills/screen-review/tooling/fixtures/lint-screens';
const SCREEN_FIXTURES = path.join(ROOT, SCREEN_FIXTURES_REL);
const RUNS = path.join(HERE, 'runs.jsonl');
const REFS = path.join(ROOT, '.opencode/skills/screen-review/references');
const RAW = path.join(REFS, 'lessons-raw.md');
const CUR = path.join(REFS, 'lessons.md');
/* Шарды выжимки по scope (Л79). Список объявлен ОДИН раз: до 13.09.2026 он жил
   в трёх местах — `state`, `journalFiles()` и захардкоженный `[RAW, CUR]` в
   `check`, — и шарды не попали в `check`: мёртвый якорь в них не ловился (Л43). */
const SHARDS = [
  ['docs-split', path.join(ROOT, '.opencode/skills/docs-split/references/lessons.md')],
  ['lessons', path.join(ROOT, '.opencode/skills/lessons/references/lessons.md')],
];

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

/* Идентификатор правила по имени фикстуры.

   У одного правила вариантов может быть несколько: дефект тот же, а ВХОД
   разный. `Б15.bad.html` — статическая разметка, `Б15@js.bad.html` — разметка
   внутри <script>. Без суффикса корпус держал бы ровно один вход на правило,
   и способность сторожа читать второй доказывалась бы мутацией руками —
   то есть не доказывалась бы вовсе (класс Л71: правило РАБОТАЕТ, но не
   ПРИМЕНЯЕТСЯ к половине рабочих экранов).

   Разделитель — «@», а не точка: идентификаторы вида `K2.1` точку уже
   содержат, и по ней срез разрезал бы сам идентификатор. */
const idOfFixture = (f) => f.replace(/\.bad\.html$/, '').split('@')[0];

/* Один корпус фикстур: эталон плюс фикстуры `<ID>[@вариант].bad.html`.
   Инструмент передаётся запускалкой — доказательство устроено одинаково для
   сенсора и для линтера, различаются только словарь уровней и способ вызова. */
function verifyCorpus(dir, run, title, only = null) {
  if (!existsSync(dir)) return { total: 0, bad: 0, missing: title };
  const files = readdirSync(dir);
  const baseName = '_base.ok.html';
  /* `--only <ID>` отбирает фикстуры ДО прогона эталона: корпус, где нужного
     правила нет, не стоит ни одного запуска. Ради этого флаг и заведён —
     доказательство откатом одного сторожа во время работы стоит секунду, а
     не полный корпус (34 сек на 13.09.2026). */
  const bads = files.filter((f) => f.endsWith('.bad.html') && (!only || idOfFixture(f) === only)).sort();
  if (only && !bads.length) return { total: 0, bad: 0 };
  if (!files.includes(baseName)) { log('  нет эталона ' + baseName + ' в ' + title); return { total: 0, bad: 1 }; }

  const baseOut = run(baseName);

  log('== ' + title + ' ==');
  log('эталон: ' + baseName);
  let bad = 0;
  /* Печатается ИМЯ ФАЙЛА, а не только идентификатор. У правила с вариантами
     строк несколько, и все они про один и тот же `Б15`: «ДОКАЗАН Б15» дважды
     неотличимо, а «НЕ ДОКАЗАН Б15» не сказало бы, какая из фикстур мертва. */
  for (const f of bads) {
    const id = idOfFixture(f);
    const caught = firedOn(run(f), id);
    // на эталоне того же дефекта быть не должно — иначе правило шумит всегда
    const quiet = !firedOn(baseOut, id);

    if (caught && quiet) {
      log('  ДОКАЗАН  ' + f + ' → ' + id + ' — падает на дефекте, молчит на эталоне');
    } else {
      bad++;
      if (!caught) log('  НЕ ДОКАЗАН ' + f + ' → ' + id + ' — дефект внесён, а находки ' + id + ' нет: сторож мёртв либо не видит вход (класс Л48)');
      if (!quiet) log('  НЕ ДОКАЗАН ' + f + ' → ' + id + ' — правило срабатывает и на эталоне: оно шумит, а не ловит');
    }
  }
  log('');
  return { total: bads.length, bad };
}

/* `corpus`: null — все три; 'sensor' — корпус сенсора; 'lint' — оба корпуса
   линтера (страницы и экраны: правило одно, входы разные, Л71). */
function verify(only = null, corpus = null) {
  if (corpus && corpus !== 'sensor' && corpus !== 'lint') { log('--corpus: sensor | lint, получено «' + corpus + '»'); return 2; }
  log('== verify: доказательство сторожей откатом' + (only ? ' — только ' + only : '') + (corpus ? ' — корпус ' + corpus : '') + ' ==');
  log('');
  const none = { total: 0, bad: 0 };
  const s = corpus === 'lint' ? none : verifyCorpus(FIXTURES, (f) => runSensor(path.join(FIXTURES, f)), 'сенсор layout-check (tooling/fixtures)', only);
  const l = corpus === 'sensor' ? none : verifyCorpus(LINT_FIXTURES, (f) => runLinter('fixtures/' + f), 'линтер ds-lint, страницы (DS-IBP/fixtures)', only);
  const e = corpus === 'sensor' ? none : verifyCorpus(SCREEN_FIXTURES, (f) => runLinter('../' + SCREEN_FIXTURES_REL + '/' + f), 'линтер ds-lint, экраны (tooling/fixtures/lint-screens)', only);

  const total = s.total + l.total + e.total, bad = s.bad + l.bad + e.bad;
  /* Пустой отбор — не «всё доказано»: обход нуля фикстур с зелёным вердиктом
     неотличим от чистого (Л100). */
  if (only && total === 0) {
    log('  НЕ ДОКАЗАН ' + only + ' — фикстур `' + only + '[@вариант].bad.html` нет' + (corpus ? ' в корпусе ' + corpus : '') + ': сторож не доказан ничем');
    return 1;
  }
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

/* Структурные проверки страницы документации. Свой инструмент, свой ряд
   идентификаторов — и своё пространство имён: якорь `док-сплит:ДС17` иначе
   не проверяется ничем. Имя пространства кириллическое намеренно — разбор
   неизвестных пространств в `check` читает только кириллицу, и латинское имя
   прошло бы молча (то же, за что написан Л100). */
function docsSplitIds() {
  const out = execFileSync(process.execPath, [DOCS_SPLIT, '--rules'], { encoding: 'utf8' });
  return [...new Set([...out.matchAll(/(ДС\d{1,2})(?!\d)/gu)].map((m) => m[1]))];
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
      'док-сплит': { источник: '.opencode/skills/docs-split/tooling/docs-split.mjs --rules', алфавит: 'кириллица ДС', ids: docsSplitIds() },
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
  const fixtures = existsSync(FIXTURES) ? new Set(readdirSync(FIXTURES).filter((f) => f.endsWith('.bad.html')).map(idOfFixture)) : new Set();

  const findings = [];
  const stats = { entries: 0, withRule: 0, withFix: 0, anchors: 0, refs: 0 };

  /* Номера, которые вообще существуют. Собираются по обоим файлам заранее:
     выжимка ссылается на записи, живущие только в архиве. */
  const knownNums = new Set();
  for (const file of journalFiles()) for (const e of entriesOf(file).entries) knownNums.add(e.num);

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

  for (const file of journalFiles()) {
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
            if (!fixtures.has(id)) findings.push(['БЛОКЕР', 'Л-ОРАКУЛ', where + ' — объявлено исполняемое закрепление на сенсор:' + id + ', а пары фикстур ' + id + '.bad.html (или ' + id + '@<вариант>.bad.html) нет. Уровень недоказан и понижается до «временное» (Л42 в новом обличье)']);
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

      /* якоря известных пространств — сверяются с реестром. Цитата мёртвого
         идентификатора в ёлочках («линтер:G1» — снятый сторож) якорем не
         считается: так велит скилл lessons. До 13.09.2026 соглашение было
         записано, а регулярка ёлочки не исключала — первая же такая цитата
         дала ложный Л-ЯКОРЬ (класс Л42: правило записано, кода нет). */
      for (const m of text.matchAll(/(?<!«)(линтер|сенсор|чек-лист|аудит|док-сплит):\s*([^\s`,;)]+)/gu)) {
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

/* ---------------- давность ритуальных прогонов ----------------

   Два сторожа стерегут не файл, а СОСТОЯНИЕ всего репозитория: нейтральность
   (`vendor-scan.mjs`) и образцы каркаса (`layout-check.mjs --etalons`). У
   такого сторожа нет естественного повода запуститься: он не привязан к
   экрану, который сдают на приёмку, и правило «прогони в конце захода» живёт
   строкой в скилле. Цена строки видна в журнале: у нейтральности 4 прогона,
   все 11.09.2026 за две с половиной минуты — это откат при написании самого
   сторожа, — и после ни одного.

   Решение пересмотрено 13.09.2026. Раньше гейта не было намеренно: боялись
   девятого входа в тулчейн. Замер показал, что дорого не число входов, а число
   ОТДЕЛЬНЫХ прогонов (06.09: verify 49 раз, check 34, coverage 27 за 18 задач).
   Теперь оба сторожа запускает `gate` (подкоманда ниже) — когда изменились
   текстовые файлы или образцы каркаса. Давность здесь остаётся: она видна и
   тому, кто гоняет подкоманды поштучно.

   Строка ритуала живёт ТОЛЬКО в `lessons/SKILL.md`: находка `Л-ВЛАДЕЛЕЦ`
   считает владельцем процедуры файл, содержащий все три слова «исполняемое /
   временное / неизмеримое», и пересказ в AGENTS.md или ds-rules дал бы
   блокер. */
const RITUAL = [
  ['нейтральность', 'vendor-scan.mjs'],
  ['эталоны', 'layout-check.mjs --etalons'],
];

function ritualFreshness() {
  const runs = readRuns();
  const last = new Map(), count = new Map();
  for (const r of runs) {
    const t = Date.parse(r.t);
    if (Number.isNaN(t)) continue;
    count.set(r.tool, (count.get(r.tool) || 0) + 1);
    const prev = last.get(r.tool);
    if (!prev || t > prev.t) last.set(r.tool, { t, verdict: r.verdict });
  }

  log('  давность ритуальных прогонов (их запускает gate при изменениях; пропуск виден здесь):');
  for (const [tool, how] of RITUAL) {
    const l = last.get(tool);
    if (!l) { log('    ' + tool + ' (' + how + '): не прогонялся ни разу'); continue; }
    const days = Math.floor((Date.now() - l.t) / 86400000);
    const ago = days <= 0 ? 'сегодня' : days + ' дн. назад';
    log('    ' + tool + ' (' + how + '): ' + fmtDay(l.t) + ', ' + ago + ' · прогонов ' + count.get(tool) + ' · последний вердикт ' + l.verdict);
  }
  log('');
}

/* ---------------- state ----------------
   Состояние журнала печатается, а не пересказывается прозой: любая записанная
   в текст цифра устаревает на следующей же правке (этот файл появился ровно
   потому, что абзац «38 записей / 228 строк» устарел через час). */

function state() {
  const raw = rd(RAW);
  const cur = rd(CUR);
  const nums = (s) => [...s.matchAll(/^### Л(\d+)\./gm)].map((m) => Number(m[1]));

  const live = SHARDS.filter(([, p]) => existsSync(p));

  const inRaw = new Set(nums(raw));
  const inCur = new Set(nums(cur));
  /* Присутствие урока считается по ВСЕМ выжимкам, а не только по основной:
     запись, вынесенная по адресату в шард, промоутирована и долгом не является (Л79). */
  const present = new Set(inCur);
  for (const [, p] of live) for (const n of nums(rd(p))) present.add(n);

  const blocks = raw.split(/^(?=### Л\d+\.)/m).filter((b) => /^### Л\d+\./.test(b));
  const decided = new Map();
  for (const b of blocks) {
    const n = Number(b.match(/^### Л(\d+)\./)[1]);
    const m = b.match(/^- \*\*Промоут:\*\* (.+)$/m);
    decided.set(n, m ? m[1].trim() : null);
  }

  const notInCur = [...inRaw].filter((n) => !present.has(n)).sort((a, b) => a - b);
  /* «Промоут: в выжимке / в шард …» — заявка на включение. Если записи нет ни в
     одной выжимке, заявка не исполнена — это долг: поле «Промоут» объявляет
     намерение, а не факт (Л80, Л81). «Не промоутить», «выведен … закреплён …»,
     «слит в Лn» и «не держим» — решения, долгом не являющиеся. */
  const claimsInclusion = (d) => !!d && /в выжимке|в шард/iu.test(d);
  const settled = (d) => !!d && /не промоутить|выведен|слит|не держим/iu.test(d);
  const debt = notInCur.filter((n) => {
    const d = decided.get(n);
    if (!d) return true;
    if (settled(d)) return false;
    return claimsInclusion(d);
  });
  const curLines = cur.split(/\r?\n/).length;

  const LIMIT_N = 20, LIMIT_L = 150;
  log('== состояние журнала уроков ==');
  log('');
  log('  архив:   ' + inRaw.size + ' записей');
  log('  выжимка: ' + inCur.size + ' записей / ' + curLines + ' строк   (предел ' + LIMIT_N + ' / ' + LIMIT_L + ')');
  log('');
  log('  долг курации (нет ни в одной выжимке: решение не записано или заявлено, но не внесено): ' + debt.length + (debt.length ? ' — ' + debt.map((n) => 'Л' + n).join(' ') : ''));

  const curBlocks = cur.split(/^(?=### Л\d+\.)/m).filter((b) => /^### Л\d+\./.test(b));
  const withFix = curBlocks.filter((b) => /\*\*Закрепление/.test(b)).length;
  log('  в выжимке объявили закрепление: ' + withFix + ' из ' + curBlocks.length);

  /* Шарды печатаются рядом с выжимкой, иначе отчёт вводит в заблуждение:
     «14 записей» звучит как «столько всего читают», а по scope читают ещё два
     файла. Предел относится к КАЖДОЙ выжимке отдельно — он меряет стоимость
     чтения на одной задаче, а не объём журнала (урок Л79). */
  if (live.length) {
    log('');
    log('  шарды по scope (свой предел у каждого):');
    for (const [name, p] of live) {
      const s = rd(p);
      log('    ' + name + ': ' + nums(s).length + ' записей / ' + s.split(/\r?\n/).length + ' строк');
    }
  }
  log('');
  ritualFreshness();

  /* Долг калибровки сметы контекста. Строку печатает САМ ctx-budget — здесь её
     только показывают: логика долга у одного владельца, копия разошлась бы с
     оригиналом (Л43). Долг вердикт не краснит: отсутствие замера — это не ложь
     модели, а несделанная сверка, и она требует реального захода. */
  const кб = runGateStep({ args: [CTX_BUDGET, '--calibration-state'], cwd: ROOT });
  const кбСтрока = кб.out.split(/\r?\n/).find((l) => /калибровка сметы/.test(l));
  if (кбСтрока) { log('  ' + кбСтрока.trim()); log(''); }

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
     РЕГРЕСС   — код ВЕРНУЛСЯ: на файле, который после закрепления уже
                 проходил без него. Первое срабатывание на новом файле — это
                 сторож, поймавший новый экземпляр класса, а не сломанная
                 починка; агрегатные цели («N файлов», режим `--parity`) к
                 файлу не привязаны и в пофайловый разбор не идут. Если
                 последний прогон файла чист, регресс уже закрыт и не
                 показывается (Л49: всегда красный отчёт не несёт сигнала).
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
  return [RAW, CUR, ...SHARDS.map(([, p]) => p)].filter((p) => existsSync(p));
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
    for (const f of readdirSync(dir)) if (f.endsWith('.bad.html')) ids.add(idOfFixture(f));
  }
  return ids;
}

/* Регресс — не «код сработал после закрепления», а «код ВЕРНУЛСЯ»: на файле,
   который после закрепления уже проходил без него. Первое срабатывание на
   новом файле — сторож, поймавший новый экземпляр класса, а не сломанная
   починка. Агрегатные цели («N файлов», `--parity`, «(несколько)») к файлу не
   привязаны и в пофайловый разбор не идут. Если последний прогон файла чист,
   регресс закрыт и не показывается (Л49). */
const isFileTarget = (t) => /\.html?\b/i.test(String(t || ''));

function findRegressions(runs, fixed) {
  const byFile = new Map();               // 'инструмент|файл' → прогоны, по времени
  for (const r of runs) {
    if (!isFileTarget(r.target)) continue;
    const k = r.tool + '|' + r.target;
    if (!byFile.has(k)) byFile.set(k, []);
    byFile.get(k).push(r);
  }
  for (const list of byFile.values()) list.sort((a, b) => Date.parse(a.t) - Date.parse(b.t));

  const out = [];
  for (const [key, f] of fixed) {
    const i = key.indexOf(':');
    const ns = key.slice(0, i), id = key.slice(i + 1);
    const after = f.day + 24 * 3600 * 1000;
    let hit = null;
    for (const [k, list] of byFile) {
      if (!k.startsWith(ns + '|')) continue;
      const target = k.slice(ns.length + 1);
      const rs = list.filter((r) => Date.parse(r.t) >= after);
      if (!rs.length) continue;
      const last = rs[rs.length - 1];
      if (!(last.codes || []).includes(id)) continue;      // последний прогон чист — закрыт
      const earlierClean = rs.slice(0, -1).some((r) => !(r.codes || []).includes(id));
      if (earlierClean && !hit) hit = { ns, id, f, last, target };
    }
    if (hit) out.push(hit);
  }
  return out;
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

  const regress = findRegressions(runs, fixed);
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

/* ---------------- gate ----------------

   Одна команда в конце захода вместо шести–девяти отдельных прогонов. Гоняет
   только то, что стережёт ИЗМЕНИВШЕЕСЯ.

   Зачем. Раньше «гейта нет намеренно»: боялись девятого входа в тулчейн. Замер
   13.09.2026 показал другую цену — не длительность проверок (0,2–0,3 сек, кроме
   полного verify — 34 сек), а их ЧИСЛО: 06.09 за 18 задач verify прогнан 49
   раз, сенсор 150, check 34. Каждый отдельный прогон — отдельный ход агента и
   вывод, оседающий в контексте. Гейт не новый инструмент, а подкоманда этого
   же файла: он заменяет входы, а не добавляет слой.

   Изменения без git: снимок `gate-snapshot.json` — отпечатки файлов (путь →
   mtime:размер) и список УПАВШИХ шагов. Снимка нет — прогон полный. Упавший
   шаг перезапускается в следующем гейте, даже если файлы не менялись: красное
   не исчезает молча. Отпечатки сохраняются всегда — иначе один старый красный
   экран или репозиторный шаг заставлял бы перепроверять всё при каждом
   запуске, и гейт стал бы «всегда красным» (Л37).

   Вердикт читается строкой `ВЕРДИКТ:`, а не кодом выхода (ds-rules §8). */

const GATE_SNAPSHOT = path.join(HERE, 'gate-snapshot.json');
const DS = path.join(ROOT, 'DS-IBP');
const TOOL_REL = '.opencode/skills/screen-review/tooling';
const VENDOR = path.join(HERE, 'vendor-scan.mjs');
const SPEC_AUDIT = path.join(DS, 'scripts/spec-audit.mjs');
const DOCS_SPLIT = path.join(ROOT, '.opencode/skills/docs-split/tooling/docs-split.mjs');
const CTX_BUDGET = path.join(ROOT, '.opencode/skills/session-plan/tooling/ctx-budget.mjs');
const PROJECTS_HUB = path.join(HERE, 'projects-hub.mjs');
const AGENT_CONFIG = path.join(HERE, 'agent-config.mjs');
const SELF = fileURLToPath(import.meta.url);

const GATE_ROOTS = ['DS-IBP/styles', 'DS-IBP/scripts', 'DS-IBP/specs', 'DS-IBP/pages', 'DS-IBP/fixtures',
  'DS-IBP/ds.css', 'Projects', 'Concepts', '.opencode/rules', '.opencode/agents', '.opencode/commands', '.opencode/skills',
  'AGENTS.md', '.opencode/opencode.json', '.opencode/opencode.jsonc', 'opencode.json', 'opencode.jsonc',
  'index.html', 'index.screen.md', 'hub.js'];
// конфиг агентного CLI: живёт в .opencode/, корневые пути — чтобы гейт увидел появившийся второй слой (agent-config.mjs, КФ1)
const AGENT_CONFIG_FILES = new Set(['.opencode/opencode.json', '.opencode/opencode.jsonc', 'opencode.json', 'opencode.jsonc']);
// хаб проектов в корне: страница, её спека и реестр
const HUB_FILES = new Set(['index.html', 'index.screen.md', 'hub.js']);
const GATE_SKIP_DIRS = new Set(['node_modules', '.git', 'uploads', 'screenshots']);
// журнал прогонов и сам снимок меняет гейт — это не изменение работы
const gateIgnored = (rel) => rel === TOOL_REL + '/runs.jsonl' || rel === TOOL_REL + '/gate-snapshot.json';
const TEXT_EXT = /\.(md|json|js|mjs|cjs|html|css|txt|ya?ml|jsonc)$/i;

const toRel = (abs) => path.relative(ROOT, abs).split(path.sep).join('/');

function fingerprint() {
  const out = {};
  const walk = (abs) => {
    let st;
    try { st = statSync(abs); } catch { return; }
    if (st.isDirectory()) {
      for (const e of readdirSync(abs, { withFileTypes: true })) {
        if (e.isDirectory() && GATE_SKIP_DIRS.has(e.name)) continue;
        walk(path.join(abs, e.name));
      }
      return;
    }
    const rel = toRel(abs);
    if (!gateIgnored(rel)) out[rel] = Math.round(st.mtimeMs) + ':' + st.size;
  };
  for (const r of GATE_ROOTS) walk(path.join(ROOT, r));
  return out;
}

/* Страничный скрипт живёт в `DS-IBP/scripts/<kebab>.page.js`, страница — в
   `DS-IBP/pages/<раздел>/<Pascal>.html`. Имена сверяются без дефисов и регистра. */
function pageForScript(rel) {
  const key = path.basename(rel).replace(/\.page\.js$/, '').replace(/-/g, '').toLowerCase();
  const found = [];
  const walk = (abs) => {
    if (!existsSync(abs)) return;
    for (const e of readdirSync(abs, { withFileTypes: true })) {
      const p = path.join(abs, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.html') && e.name.replace(/\.html$/, '').toLowerCase() === key) found.push(toRel(p));
    }
  };
  walk(path.join(DS, 'pages'));
  return found;
}

const isDocsSplit = (rel) => {
  try { return readFileSync(path.resolve(ROOT, rel), 'utf8').includes('class="page ds-split"'); } catch { return false; }
};

/* Шаги. `args` — аргументы node, `cwd` — откуда запускать (линтер разрешает
   пути от корня ДС). Идентификатор шага дедуплицирует: пять правок стилей
   дают один глобальный прогон линтера, а не пять. */
function gateStep(id, paths = null) {
  const [kind, target] = [id.slice(0, id.indexOf(':') < 0 ? id.length : id.indexOf(':')), id.includes(':') ? id.slice(id.indexOf(':') + 1) : ''];
  const abs = target ? path.resolve(ROOT, target) : '';
  const fromDs = target ? path.relative(DS, abs).split(path.sep).join('/') : '';
  const dsRel = (rel) => path.relative(DS, path.resolve(ROOT, rel)).split(path.sep).join('/');
  switch (kind) {
    /* Пакет страниц ДС в полном режиме. Одним вызовом линтера, а не 65:
       линтер пишет в журнал прогонов строку на вызов, и 65 чистых страниц
       вытеснили бы настоящие экраны из окна, по которому `stats` делит коды на
       «живой» и «исчез», — молчание прочиталось бы как обучение (runlog.mjs,
       отсечение эталонов; поймано на первом полном гейте 13.09.2026). */
    case 'lint-pages': {
      const list = [...(paths || [])].sort();
      return { title: 'линтер, страницы ДС пакетом — файлов: ' + list.length, args: ['scripts/ds-lint-cli.mjs', ...list.map(dsRel)], cwd: DS };
    }
    case 'sensor': return { title: 'сенсор ' + target, args: [SENSOR, abs], cwd: ROOT };
    case 'lint': return { title: 'линтер ' + target, args: ['scripts/ds-lint-cli.mjs', fromDs], cwd: DS };
    case 'split': return { title: 'docs-split check ' + target, args: [DOCS_SPLIT, 'check', target], cwd: ROOT };
    case 'lint-global': return { title: 'линтер, глобальные правила', args: ['scripts/ds-lint-cli.mjs'], cwd: DS };
    case 'parity': return { title: 'линтер --parity (доки = код)', args: ['scripts/ds-lint-cli.mjs', '--parity'], cwd: DS };
    case 'spec-audit': return { title: 'spec-audit', args: [SPEC_AUDIT], cwd: DS };
    case 'etalons': return { title: 'сенсор --etalons', args: [SENSOR, '--etalons'], cwd: ROOT };
    case 'verify-sensor': return { title: 'verify --corpus sensor', args: [SELF, 'verify', '--corpus', 'sensor'], cwd: ROOT };
    case 'verify-lint': return { title: 'verify --corpus lint', args: [SELF, 'verify', '--corpus', 'lint'], cwd: ROOT };
    case 'anchors': return { title: 'anchors', args: [SELF, 'anchors'], cwd: ROOT };
    case 'check': return { title: 'check (форма журнала уроков)', args: [SELF, 'check'], cwd: ROOT };
    case 'stats': return { title: 'stats (регресс)', args: [SELF, 'stats'], cwd: ROOT };
    case 'coverage': return { title: 'coverage (чек-листы)', args: [SELF, 'coverage'], cwd: ROOT };
    case 'vendor': return { title: 'vendor-scan (нейтральность)', args: [VENDOR], cwd: ROOT };
    /* Селфтест сметы контекста. Заведён 14.09.2026: инструмент написали, сторож
       (обратный тест на известном провале) написали, а звать его забыли — гейт
       на правку `stages.json` поднимал один vendor-scan. Сторож без вызывающего
       не сторож; коэффициент можно было изменить мимоходом, и смета начала бы
       врать молча. */
    case 'ctx-budget': return { title: 'ctx-budget --selftest (смета контекста)', args: [CTX_BUDGET, '--selftest'], cwd: ROOT };
    /* Хаб проектов. Реестр hub.js в корне ведётся руками (по file://
       страница папки не обходит), поэтому забытый проект или концепт молча не появляется
       на хабе — сторож делает это красным гейтом. Селфтест — откат на
       временном дереве, гоняется, когда правят самого сторожа. */
    case 'projects': return { title: 'projects-hub (реестр хаба проектов)', args: [PROJECTS_HUB], cwd: ROOT };
    case 'projects-selftest': return { title: 'projects-hub --selftest', args: [PROJECTS_HUB, '--selftest'], cwd: ROOT };
    /* Конфиг агентного CLI. Конфиг читается и из корня, и из .opencode/ — второй
       файл молча складывает права из двух слоёв; модель в репозитории на
       другом контуре не стартует. Решение 15.09.2026, шапка agent-config.mjs. */
    case 'agent-config': return { title: 'agent-config (один конфиг, без модели)', args: [AGENT_CONFIG], cwd: ROOT };
    case 'agent-config-selftest': return { title: 'agent-config --selftest', args: [AGENT_CONFIG, '--selftest'], cwd: ROOT };
    default: throw new Error('неизвестный шаг гейта: ' + id);
  }
}

/* Матрица «изменилось → что гонять». Прозой не пересказывается — состав для
   любого пути печатает `gate --dry --changed <путь>` (Л43). */
function gateStepsFor(rel, deleted) {
  const s = [];
  const add = (...ids) => s.push(...ids);
  const inFixtures = rel.split('/').includes('fixtures');
  const html = rel.endsWith('.html');

  // проекты, концепты и сам хаб, в том числе удалённое: реестр хаба мог разойтись с папками
  const screenArea = rel.startsWith('Projects/') || rel.startsWith('Concepts/');
  if ((screenArea && !inFixtures) || HUB_FILES.has(rel)) add('projects');
  // конфиг, в том числе удалённый или появившийся в корне
  if (AGENT_CONFIG_FILES.has(rel)) add('agent-config');

  if (deleted) {
    if (rel.startsWith('DS-IBP/')) add('lint-global', 'parity');
    return s;
  }
  // экран: в репозитории — Projects/**, Concepts/** и хаб; вне репозитория — только через --changed (проверка откатом на копии)
  if (html && !inFixtures && (screenArea || rel === 'index.html' || rel.startsWith('..'))) {
    /* Фрагмент модульного экрана инструменты пропускают (fragments.mjs) —
       проверяется то, во что он вшит: источник и его собранный файл. */
    const hosts = rel.startsWith('..') ? [] : includersOf(path.resolve(ROOT, rel));
    if (hosts.length) {
      for (const h of hosts) {
        const built = assembledOf(h);
        for (const t of [h, built].filter(Boolean)) add('sensor:' + toRel(t), 'lint:' + toRel(t));
      }
    } else add('sensor:' + rel, 'lint:' + rel);
  }
  if (rel.startsWith(SCREEN_FIXTURES_REL + '/') || rel.startsWith('DS-IBP/fixtures/')) add('verify-lint', 'anchors');

  if (/^DS-IBP\/pages\/.+\.html$/.test(rel)) add('lint:' + rel);
  /* Структурная проверка паттерна «сплиттер + табы» — по ПРИЗНАКУ СТРАНИЦЫ, а
     не по её папке. Пока шаг звался только для `DS-IBP/pages/**`, витрины
     локальных компонентов не получали его вовсе: сенсор их пропускал, линтер
     проверяет другое, и три дефекта каркаса дошли до человека при зелёном
     гейте (20.09.2026). Урок Л115 — сторож, которого никто не вызывает, не
     сторож; здесь сторож был, а вызывали его не для всех входов.
     У собранной витрины проверяются оба файла: у источника свой каркас, но
     открывают и правят результат. */
  if (html && !inFixtures && isDocsSplit(rel)) {
    add('split:' + rel);
    const built = assembledOf(path.resolve(ROOT, rel));
    if (built) add('split:' + toRel(built));
  }
  if (/^DS-IBP\/scripts\/[^/]+\.page\.js$/.test(rel)) {
    const pages = pageForScript(rel);
    if (!pages.length) add('lint-global');
    for (const p of pages) { add('lint:' + p); if (isDocsSplit(p)) add('split:' + p); }
  } else if (rel === 'DS-IBP/scripts/ds-lint.js' || rel === 'DS-IBP/scripts/ds-lint-cli.mjs') {
    add('verify-lint', 'anchors', 'lint-global', 'parity');
  } else if (rel === 'DS-IBP/scripts/spec-audit.mjs') {
    add('anchors', 'spec-audit');
  } else if (/^DS-IBP\/scripts\/[^/]+\.js$/.test(rel)) {
    add('lint-global', 'parity', 'etalons');
  }
  if (rel.startsWith('DS-IBP/styles/') || rel === 'DS-IBP/ds.css') add('lint-global', 'parity', 'etalons');
  if (rel.startsWith('DS-IBP/specs/')) add('parity', 'spec-audit');
  // каталог компонентов в правилах агента сверяется с манифестом — проход 8 аудита
  if (rel === '.opencode/rules/ds-rules.md') add('spec-audit');

  // корпус экранов линтера — подпапка tooling/fixtures, но сенсор его не читает
  if (rel === TOOL_REL + '/layout-check.mjs' || (rel.startsWith(TOOL_REL + '/fixtures/') && !rel.startsWith(SCREEN_FIXTURES_REL + '/'))) add('verify-sensor', 'anchors', 'etalons');
  if (rel === TOOL_REL + '/lessons-cli.mjs' || rel === TOOL_REL + '/runlog.mjs') add('verify-sensor', 'verify-lint', 'anchors', 'check', 'coverage', 'stats');
  if (rel === TOOL_REL + '/anchors.json') add('anchors', 'check');
  if (rel.startsWith('.opencode/skills/session-plan/')) add('ctx-budget');
  if (rel === TOOL_REL + '/projects-hub.mjs') add('projects-selftest', 'projects');
  if (rel === TOOL_REL + '/agent-config.mjs') add('agent-config-selftest', 'agent-config');
  if (/^\.opencode\/skills\/[^/]+\/references\/[^/]+\.html$/.test(rel)) add('etalons');
  if (/(^|\/)lessons(-raw)?\.md$/.test(rel) && rel.startsWith('.opencode/')) add('check', 'stats');
  if (rel === TOOL_REL + '/coverage.json' || rel === '.opencode/skills/screen-review/SKILL.md' || rel === '.opencode/skills/composition-review/SKILL.md') add('coverage');
  if (TEXT_EXT.test(rel) && !rel.startsWith('..')) add('vendor');
  return s;
}

const GATE_FULL = ['lint-global', 'parity', 'spec-audit', 'etalons', 'verify-sensor', 'verify-lint', 'anchors', 'check', 'stats', 'coverage', 'ctx-budget', 'projects-selftest', 'projects', 'agent-config-selftest', 'agent-config', 'vendor'];
// порядок: сначала дешёвое и пофайловое, в конце — дорогое и репозиторное
const GATE_ORDER = ['sensor', 'lint', 'lint-pages', 'split', 'projects-selftest', 'projects', 'agent-config-selftest', 'agent-config', 'lint-global', 'parity', 'spec-audit', 'etalons', 'anchors', 'check', 'coverage', 'ctx-budget', 'stats', 'verify-sensor', 'verify-lint', 'vendor'];
const kindOf = (id) => id.split(':')[0];

// строки находок, которые показываются при FAIL; остальной вывод остаётся за кадром
const FINDING = /^\s*(FAIL|BLOCKER|NEEDS-WORK|НЕ ДОКАЗАН|БЛОКЕР|РЕГРЕСС|ОШИБКА|ВЕРДИКТ|ЖУРНАЛ)|Л-[А-ЯЁ]+|находок: [1-9]|^\s{2}\S+:\d+ — /u;

function runGateStep(step) {
  const t0 = Date.now();
  let out = '', code = 0;
  try {
    out = execFileSync(process.execPath, step.args, { cwd: step.cwd, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, timeout: 300000, windowsHide: true });
  } catch (e) {
    out = String(e.stdout || '') + String(e.stderr || '');
    code = typeof e.status === 'number' ? e.status : 1;
  }
  return { out, code, sec: (Date.now() - t0) / 1000 };
}

function gate() {
  const full = flag('--full');
  const dry = flag('--dry');
  const changedArg = value('--changed');
  const now = fingerprint();
  let snapExists = existsSync(GATE_SNAPSHOT);
  let snap = {}, prevFailed = [];
  if (snapExists) {
    try {
      const j = JSON.parse(rd(GATE_SNAPSHOT));
      snap = j.files || {};
      prevFailed = Array.isArray(j.failed) ? j.failed : [];
    } catch { snapExists = false; }     // битый снимок — как отсутствующий: полный прогон
  }

  /* Набор изменений. `--changed` подменяет его целиком и снимок не трогает:
     это режим проверки самой матрицы, а не работы. */
  let changed = [], deleted = [];
  if (changedArg) {
    changed = changedArg.split(',').map((p) => p.trim()).filter(Boolean)
      .map((p) => { const abs = path.resolve(ROOT, p); return toRel(abs); });
  } else if (!full && snapExists) {
    changed = Object.keys(now).filter((k) => now[k] !== snap[k]);
    deleted = Object.keys(snap).filter((k) => !(k in now));
  }
  const isFull = !changedArg && (full || !snapExists);

  const byStep = new Map();          // id шага → пути, которые его вызвали
  const want = (id, rel) => { if (!byStep.has(id)) byStep.set(id, new Set()); if (rel) byStep.get(id).add(rel); };
  if (isFull) {
    for (const rel of Object.keys(now)) {
      for (const id of gateStepsFor(rel, false)) {
        if (id.startsWith('lint:DS-IBP/pages/')) want('lint-pages', id.slice(5));
        else want(id, rel);
      }
    }
    for (const id of GATE_FULL) want(id, null);
  } else {
    for (const rel of changed) for (const id of gateStepsFor(rel, false)) want(id, rel);
    for (const rel of deleted) for (const id of gateStepsFor(rel, true)) want(id, rel);
  }
  /* Упавшее в прошлый раз. Пофайловый шаг, чей файл не менялся, НЕ
     перезапускается: результат не может измениться, а изменённый файл и так
     попал в набор выше. Такой долг переносится в снимок и печатается одной
     строкой. Репозиторный шаг зависит от многих файлов — он перезапускается.
     В режиме `--changed` долг не подмешивается: там проверяется матрица. */
  const retried = [], carried = [];
  if (!changedArg && !isFull) {
    for (const id of prevFailed) {
      if (byStep.has(id)) continue;
      const target = id.includes(':') ? id.slice(id.indexOf(':') + 1) : '';
      if (target && !(target in now)) continue;          // файл удалён — долга больше нет
      if (target) { carried.push(id); continue; }
      retried.push(id);
      if (id === 'lint-pages') for (const rel of Object.keys(now)) { if (/^DS-IBP\/pages\/.+\.html$/.test(rel)) want(id, rel); }
      else want(id, null);
    }
  }
  const ids =[...byStep.keys()].sort((a, b) => GATE_ORDER.indexOf(kindOf(a)) - GATE_ORDER.indexOf(kindOf(b)) || a.localeCompare(b));

  log('== gate: проверки по изменениям ==');
  if (isFull) log('режим: полный' + (full ? ' (--full)' : ' (снимка нет — первый прогон на этой машине)'));
  else log('изменено: ' + changed.length + (deleted.length ? ' · удалено: ' + deleted.length : '') + (changedArg ? ' (задано --changed, снимок не обновляется)' : ''));
  if (!isFull) for (const rel of [...changed, ...deleted].slice(0, 15)) log('  ' + rel + (deleted.includes(rel) ? ' (удалён)' : ''));
  if (!isFull && changed.length + deleted.length > 15) log('  … и ещё ' + (changed.length + deleted.length - 15));
  if (retried.length) log('повтор упавшего в прошлом гейте (репозиторные шаги): ' + retried.length);
  log('');

  const logCarried = () => {
    if (!carried.length) return;
    const files = [...new Set(carried.map((id) => id.slice(id.indexOf(':') + 1)))];
    log('ДОЛГ: ' + carried.length + ' красн. шаг. на ' + files.length + ' файл. — не менялись, не перезапускались, вердикт не меняют: ' +
        files.slice(0, 4).map((f) => path.basename(f)).join(', ') + (files.length > 4 ? ' …' : '') + ' (разбор — gate --full)');
  };

  if (!ids.length) {
    log(changed.length + deleted.length ? 'изменения не задевают ни одного сторожа — проверок 0' : 'изменений с прошлого гейта нет — проверок 0');
    logCarried();
    if (!changedArg && !dry && (changed.length || deleted.length)) saveSnapshot(now, carried);
    log('ВЕРДИКТ: OK');
    return 0;
  }
  if (dry) {
    log('шаги (--dry, не запускаются): ' + ids.length);
    for (const id of ids) log('  ' + gateStep(id, byStep.get(id)).title);
    return 0;
  }

  /* Прогон по НАСТОЯЩЕМУ файлу обязан оставить строку в журнале прогонов: на
     нём стоит `stats`. Инструмент, который молча не пишет, делает регресс
     невидимым — так с 12.09.2026 линтер не писал ни одного прогона по экрану
     (путь `../Projects/…` журнал счёл внешним). Сторож стоит здесь, потому что
     гейт — единственное место, которое знает, что прогон был настоящим. */
  const journalLines = () => (existsSync(RUNS) ? rd(RUNS).split('\n').filter(Boolean).length : 0);
  const MUST_LOG = new Set(['sensor', 'lint', 'lint-pages']);
  const results = [];
  for (const id of ids) {
    const step = gateStep(id, byStep.get(id));
    const target = id.includes(':') ? id.slice(id.indexOf(':') + 1) : '';
    const before = journalLines();
    const r = runGateStep(step);
    // ПРОПУЩЕН — инструмент сам объявил, что файл не его вход; строки в журнале у пропуска нет по устройству
    if (MUST_LOG.has(kindOf(id)) && !target.startsWith('..') && !/^ПРОПУЩЕН:/m.test(r.out) && journalLines() === before) {
      r.code = r.code || 1;
      r.out += '\nЖУРНАЛ: прогон по настоящему файлу не записан в runs.jsonl — stats его не видит (класс Л100)';
    }
    results.push({ id, step, debt: retried.includes(id), ...r });
  }

  /* Вывод сжат: он оседает в контексте агента. Прошедшие пофайловые шаги
     сворачиваются в строку на вид проверки; находки печатаются только у
     упавших. Долг прошлых гейтов — упавшее раньше и не задетое текущей
     правкой — идёт отдельной строкой и вердикт НЕ краснит: иначе старый
     красный экран краснил бы каждый гейт, и FAIL перестал бы читаться (Л37). */
  const fresh = results.filter((r) => !r.debt);
  const failedNow = fresh.filter((r) => r.code !== 0);
  const okNow = fresh.filter((r) => r.code === 0);
  const perFile = new Set(['sensor', 'lint', 'split']);
  const sec = (s) => s.toFixed(1).replace('.', ',') + ' с';

  if (okNow.length <= 8) {
    for (const r of okNow) log('OK    ' + r.step.title + '  (' + sec(r.sec) + ')');
  } else {
    const groups = new Map();
    for (const r of okNow) {
      const k = kindOf(r.id);
      if (!perFile.has(k)) { log('OK    ' + r.step.title + '  (' + sec(r.sec) + ')'); continue; }
      const g = groups.get(k) || { n: 0, sec: 0, title: r.step.title.split(' ')[0] + (k === 'split' ? ' check' : '') };
      g.n++; g.sec += r.sec; groups.set(k, g);
    }
    for (const g of groups.values()) log('OK    ' + g.title + ' — файлов: ' + g.n + '  (' + sec(g.sec) + ')');
  }
  const limit = failedNow.length > 3 ? 8 : 30;
  for (const r of failedNow) {
    log('FAIL  ' + r.step.title + '  (' + sec(r.sec) + ')');
    const lines = r.out.split(/\r?\n/).filter((l) => FINDING.test(l));
    const show = (lines.length ? lines : r.out.split(/\r?\n/).filter((l) => l.trim()).slice(-10)).slice(0, limit);
    for (const l of show) log('      ' + l.trimEnd());
    if (lines.length > limit) log('      … ещё ' + (lines.length - limit) + ' — полный вывод: node ' + r.step.args.map((a) => path.isAbsolute(a) ? toRel(a) : a).join(' '));
  }

  const debtRes = results.filter((r) => r.debt);
  const debtRed = debtRes.filter((r) => r.code !== 0);
  if (debtRes.length) {
    log('');
    log('ДОЛГ прошлых гейтов (текущей правкой не задет, вердикт не меняет): красных ' + debtRed.length + ' · починилось ' + (debtRes.length - debtRed.length));
    for (const r of debtRed.slice(0, 10)) log('      ' + r.step.title);
    if (debtRed.length > 10) log('      … и ещё ' + (debtRed.length - 10));
  }
  if (carried.length) { log(''); logCarried(); }

  // долг курации не зависит от текущей правки и вердикт не краснит, но молча не проходит
  const st = runGateStep({ args: [SELF, 'state'], cwd: ROOT });
  const debtLine = st.out.split(/\r?\n/).find((l) => /долг курации/.test(l));
  /* Тем же приёмом — долг калибровки сметы. Он не зависит ни от правки, ни от
     вердикта: его нельзя закрыть внутри репозитория, нужен факт реального
     захода. Поэтому он печатается при закрытии ЛЮБОГО захода, пока не закрыт:
     напоминание, не требующее, чтобы о нём помнили. */
  const калибровка = st.out.split(/\r?\n/).find((l) => /калибровка сметы/.test(l));

  if (!changedArg) saveSnapshot(now, [...results.filter((r) => r.code !== 0).map((r) => r.id), ...carried]);

  log('');
  if (st.code !== 0 && debtLine) log('ВНИМАНИЕ: ' + debtLine.trim() + ' — курация обязательна (скилл lessons)');
  if (калибровка) log('ВНИМАНИЕ: ' + калибровка.trim());
  log(failedNow.length ? 'ВЕРДИКТ: FAIL (' + failedNow.length + ' из ' + fresh.length + ')' : 'ВЕРДИКТ: OK (' + fresh.length + ' шаг.)');
  return failedNow.length ? 1 : 0;
}

function saveSnapshot(files, failed) {
  writeFileSync(GATE_SNAPSHOT, JSON.stringify({ files, failed }) + '\n', 'utf8');
}

/* ---------------- main ---------------- */

const argv = process.argv.slice(2);
const cmd = argv[0];
const flag = (name) => argv.includes(name);
const value = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : null; };

if (cmd === 'verify') process.exit(verify(value('--only'), value('--corpus')));
else if (cmd === 'gate') process.exit(gate());
else if (cmd === 'coverage') process.exit(coverage());
else if (cmd === 'anchors') process.exit(cmdAnchors(flag('--write')));
else if (cmd === 'check') process.exit(cmdCheck());
else if (cmd === 'add') process.exit(cmdAdd(value('--from')));
else if (cmd === 'state') process.exit(state());
else if (cmd === 'stats') process.exit(stats());
else {
  log('Использование:');
  log('  node lessons-cli.mjs gate [--full] [--dry] [--changed <путь,…>] — проверки по изменениям, одной командой в конце захода');
  log('  node lessons-cli.mjs verify [--only <ID>] [--corpus sensor|lint] — доказать сторожей откатом на фикстурах');
  log('  node lessons-cli.mjs coverage          — чем закрыт каждый пункт чек-листов');
  log('  node lessons-cli.mjs anchors [--write]  — реестр живых идентификаторов против кода');
  log('  node lessons-cli.mjs check             — форма записей журнала: якоря, уровни, поля');
  log('  node lessons-cli.mjs add --from <файл> — дозаписать урок из черновика');
  log('  node lessons-cli.mjs state             — объём журнала, долг курации, закрепления');
  log('  node lessons-cli.mjs stats             — что было ПОСЛЕ закрепления: регресс, обучение, мёртвые правила');
  process.exit(2);
}
