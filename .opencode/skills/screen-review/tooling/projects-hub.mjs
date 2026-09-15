#!/usr/bin/env node
/* ============================================================
   PROJECTS-HUB — сторож хаба проектов (корневой index.html).

   Зачем. Хаб строит меню и три колонки (дизайн-система, проекты, концепты)
   из реестра hub.js в корне. По file:// страница не может сама обойти
   папки, поэтому реестр ведётся руками — а правило «добавь запись в реестр»
   прозой не держится: забытый проект или концепт просто молча не появляется
   на хабе. Сторож делает забывание видимым: гейт краснеет.

   Что проверяет (коды П — «проекты»):
     П1 реестр читается; у записей есть обязательные поля, id уникальны,
        group из списка, у проектов и концептов есть root;
     П2 иконка записи есть в DS-IBP/specs/Icons.md;
     П3 файл по href существует, папка root существует, href лежит в root,
        root лежит в папке своей группы (projects — Projects, concepts —
        Concepts): концепт не зарегистрировать проектом и наоборот;
     П4 полнота: каждый .html в папках Projects и Concepts лежит внутри root
        какой-нибудь записи (исключение — любая папка fixtures);
        DS-IBP/index.html зарегистрирован;
     П5 возврат в хаб: экран внутри root проекта или концепта, где есть
        строка пользователя меню (nav__user или вызов footerHTML), ведёт ею на
        хаб — в файле есть литерал относительного пути до корневого
        index.html, нет статического nav__user с href="#", а каждый вызов
        footerHTML(…) заканчивается подменой .replace(…).

   Честная граница П5: проверка статическая. Разметку, склеенную из кусков
   без литерала пути, и подмену, которая ничего не находит, она не видит —
   это видно только в браузере.

   Журнал прогонов (runs.jsonl) сторож не пишет: у него нет кодов, которые
   `stats` должен делить на «живой/исчез», а лишние строки вытеснили бы из
   окна настоящие экраны.

   Использование:
     node projects-hub.mjs [check] [--root <корень репозитория>]
     node projects-hub.mjs --selftest   — откат на временном дереве
   Строка `ВЕРДИКТ: OK | FAIL`, код выхода 0 | 1.
   ============================================================ */
import { readFileSync, existsSync, readdirSync, statSync, mkdirSync, writeFileSync, rmSync, mkdtempSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..', '..', '..', '..');

const REGISTRY = 'hub.js';
const HUB = 'index.html';
// группа → папка, в которой обязан лежать root записи (у ds root нет)
const GROUP_DIRS = { ds: null, projects: 'Projects', concepts: 'Concepts' };
const FIELDS = ['id', 'group', 'title', 'desc', 'href', 'icon'];

const slash = (p) => p.split(path.sep).join('/');
const inside = (file, dir) => {
  const r = path.relative(dir, file);
  return r !== '' && !r.startsWith('..') && !path.isAbsolute(r);
};

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function loadRegistry(file) {
  const ctx = { window: {} };
  vm.runInNewContext(readFileSync(file, 'utf8'), ctx, { filename: file, timeout: 1000 });
  return ctx.window.IBPHub;
}

/** Имена глифов из строки после заголовка «## Все глифы». null — файла нет. */
function iconNames(repo) {
  const f = path.join(repo, 'DS-IBP', 'specs', 'Icons.md');
  if (!existsSync(f)) return null;
  const lines = readFileSync(f, 'utf8').split(/\r?\n/);
  const i = lines.findIndex((l) => l.startsWith('## Все глифы'));
  if (i < 0) return null;
  return new Set((lines[i + 1] || '').split('·').map((s) => s.trim()).filter(Boolean));
}

/** Текст без HTML- и блочных JS-комментариев: упоминание в комментарии — не код. */
function codeOf(src) {
  return src.replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
}

const inFixtures = (rel) => rel.split('/').includes('fixtures');

export function check(repo = REPO) {
  const defects = [];
  const stats = { entries: 0, pages: 0, screens: 0 };
  const regFile = path.join(repo, REGISTRY);

  if (!existsSync(regFile)) return { defects: ['П1 нет реестра ' + REGISTRY + ' в корне'], stats };
  let list;
  try { list = loadRegistry(regFile); } catch (e) {
    return { defects: ['П1 реестр ' + REGISTRY + ' не выполняется: ' + e.message], stats };
  }
  if (!Array.isArray(list)) return { defects: ['П1 реестр не задаёт массив window.IBPHub'], stats };
  stats.entries = list.length;

  /* П1–П3 записи */
  const icons = iconNames(repo);
  const ids = new Set();
  const valid = [];
  list.forEach((e, i) => {
    const name = 'запись ' + (i + 1) + (e && typeof e.id === 'string' ? ' «' + e.id + '»' : '');
    if (!e || typeof e !== 'object') { defects.push('П1 ' + name + ' — не объект'); return; }
    const missing = FIELDS.filter((f) => typeof e[f] !== 'string' || !e[f].trim());
    if (missing.length) { defects.push('П1 ' + name + ' — нет полей: ' + missing.join(', ')); return; }
    if (ids.has(e.id)) defects.push('П1 ' + name + ' — id повторяется');
    ids.add(e.id);
    if (!(e.group in GROUP_DIRS)) {
      defects.push('П1 ' + name + ' — group «' + e.group + '» не из списка: ' + Object.keys(GROUP_DIRS).join(', '));
      return;
    }
    const groupDir = GROUP_DIRS[e.group];
    const hasRoot = typeof e.root === 'string' && e.root.trim();
    if (groupDir && !hasRoot) defects.push('П1 ' + name + ' — нет root (папка записи от корня, внутри ' + groupDir + '/)');
    if (icons && !icons.has(e.icon)) defects.push('П2 ' + name + ' — иконки «' + e.icon + '» нет в DS-IBP/specs/Icons.md');

    const href = path.resolve(repo, e.href);
    if (!existsSync(href)) defects.push('П3 ' + name + ' — href ведёт на несуществующий файл: ' + e.href);
    let rootAbs = null;
    if (hasRoot) {
      rootAbs = path.resolve(repo, e.root);
      if (!existsSync(rootAbs) || !statSync(rootAbs).isDirectory()) defects.push('П3 ' + name + ' — папки root нет: ' + e.root);
      else if (!inside(href, rootAbs)) defects.push('П3 ' + name + ' — href лежит вне root: ' + e.href);
      if (groupDir && !inside(rootAbs, path.join(repo, groupDir))) {
        defects.push('П3 ' + name + ' — root «' + e.root + '» вне папки группы ' + groupDir + '/ (group: \'' + e.group + '\')');
      }
    }
    valid.push({ ...e, hrefAbs: href, rootAbs });
  });

  /* П4 полнота */
  const roots = valid.filter((e) => e.rootAbs).map((e) => e.rootAbs);
  for (const area of ['Projects', 'Concepts']) {
    for (const f of walk(path.join(repo, area))) {
      if (!f.endsWith('.html')) continue;
      const rel = slash(path.relative(repo, f));
      if (inFixtures(rel)) continue;
      stats.pages++;
      if (roots.some((r) => inside(f, r))) continue;
      defects.push('П4 ' + rel + ' — страница вне записей реестра: добавить запись в ' + REGISTRY + ' (root — папка проекта или концепта)');
    }
  }
  const dsIndex = path.join(repo, 'DS-IBP', 'index.html');
  if (existsSync(dsIndex) && !valid.some((e) => e.hrefAbs === dsIndex)) {
    defects.push('П4 DS-IBP/index.html — дизайн-система не в реестре (group: \'ds\')');
  }

  /* П5 возврат в хаб */
  const hub = path.join(repo, HUB);
  for (const e of valid) {
    if (!e.rootAbs || !GROUP_DIRS[e.group]) continue;
    for (const f of walk(e.rootAbs)) {
      const rel = slash(path.relative(repo, f));
      if (!f.endsWith('.html') || inFixtures(rel)) continue;
      const code = codeOf(readFileSync(f, 'utf8'));
      if (!/nav__user|footerHTML\(/.test(code)) continue;
      stats.screens++;
      const hubRel = slash(path.relative(path.dirname(f), hub));
      if (code.includes('nav__user" href="#"')) {
        defects.push('П5 ' + rel + ' — строка пользователя меню ведёт на «#», а не на хаб ' + hubRel);
      }
      if (!code.includes('"' + hubRel + '"') && !code.includes('\'' + hubRel + '\'')) {
        defects.push('П5 ' + rel + ' — нет ссылки на хаб: ожидается путь ' + hubRel + ' у строки пользователя меню');
      }
      const calls = [...code.matchAll(/footerHTML\(/g)];
      const bare = calls.filter((m) => {
        const end = code.indexOf(';', m.index);
        const stmt = code.slice(m.index, end < 0 ? m.index + 400 : end);
        return !/\)\s*\.replace\(/.test(stmt);
      });
      if (bare.length) {
        defects.push('П5 ' + rel + ' — footerHTML(…) без подмены .replace(…): строка пользователя останется ссылкой «#» (вызовов без подмены: ' + bare.length + ')');
      }
    }
  }

  return { defects, stats };
}

function report({ defects, stats }) {
  const out = ['== projects-hub ==',
    'реестр: записей ' + stats.entries + ' · страниц в Projects/ и Concepts/: ' + stats.pages + ' · экранов с меню проверено: ' + stats.screens];
  for (const d of defects) out.push('FAIL  ' + d);
  out.push('ВЕРДИКТ: ' + (defects.length ? 'FAIL (дефектов: ' + defects.length + ')' : 'OK'));
  return out.join('\n');
}

/* ---------------- selftest: откат на временном дереве ---------------- */

function put(root, rel, text) {
  const p = path.join(root, rel);
  mkdirSync(path.dirname(p), { recursive: true });
  writeFileSync(p, text, 'utf8');
}

function registryJs(entries) {
  return '/* тестовый реестр */\nwindow.IBPHub = ' + JSON.stringify(entries, null, 2) + ';\n';
}

const CLEAN_ENTRIES = [
  { id: 'ds', group: 'ds', title: 'ДС', desc: 'тест', href: 'DS-IBP/index.html', root: null, icon: 'layer-01' },
  { id: 'alpha', group: 'projects', title: 'Альфа', desc: 'тест', href: 'Projects/alpha/start/index.html', root: 'Projects/alpha', icon: 'folder' },
  { id: 'gamma', group: 'concepts', title: 'Гамма', desc: 'тест', href: 'Concepts/gamma/Gamma.html', root: 'Concepts/gamma', icon: 'folder' },
];
const withEntry = (i, patch) => CLEAN_ENTRIES.map((e, k) => (k === i ? { ...e, ...patch } : e));

function cleanTree(root) {
  put(root, 'DS-IBP/specs/Icons.md', '# Иконки\n\n## Все глифы (2)\nfolder · layer-01\n');
  put(root, 'DS-IBP/index.html', '<!DOCTYPE html><title>ДС</title>');
  put(root, 'index.html', '<!DOCTYPE html><title>Хаб</title>');
  put(root, 'hub.js', registryJs(CLEAN_ENTRIES));
  put(root, 'Projects/alpha/start/index.html',
    '<nav class="nav"><div class="nav__footer"><a class="nav__user" href="../../../index.html" aria-label="Хаб проектов">А</a></div></nav>');
  put(root, 'Projects/alpha/screen/Screen.html',
    '<script>var USER_LINK_TO = \' href="../../../index.html"\';\n'
    + 'var s = window.IBPHome.footerHTML(role, { logoutModal: \'m\' }).replace(\' href="#"\', USER_LINK_TO);</script>');
  put(root, 'Projects/alpha/screen/NoNav.html', '<p>экран без меню</p>');
  put(root, 'Concepts/gamma/Gamma.html',
    '<div class="nav__footer"><a class="nav__user" href="../../index.html" aria-label="Хаб проектов">Г</a></div>');
  put(root, 'Projects/alpha/fixtures/index.html', '<a class="nav__user" href="#">фикстура</a>');
  put(root, 'Concepts/fixtures/lint/X.html', '<a class="nav__user" href="#">фикстура</a>');
}

const CASES = [
  { name: 'чистое дерево', expect: null },
  { name: 'страница проекта вне реестра', expect: 'П4 Projects/beta/index.html',
    mutate: (r) => put(r, 'Projects/beta/index.html', '<p>новый проект</p>') },
  { name: 'экран концепта вне реестра', expect: 'П4 Concepts/delta/Delta.html',
    mutate: (r) => put(r, 'Concepts/delta/Delta.html', '<p>новый концепт</p>') },
  { name: 'ДС не в реестре', expect: 'П4 DS-IBP/index.html',
    mutate: (r) => put(r, 'hub.js', registryJs(CLEAN_ENTRIES.filter((e) => e.group !== 'ds'))) },
  { name: 'битый href', expect: 'несуществующий файл',
    mutate: (r) => put(r, 'hub.js', registryJs(withEntry(1, { href: 'Projects/alpha/start/missing.html' }))) },
  { name: 'href вне root', expect: 'href лежит вне root',
    mutate: (r) => put(r, 'hub.js', registryJs(withEntry(1, { root: 'Projects/alpha/screen' }))) },
  { name: 'концепт зарегистрирован проектом', expect: 'вне папки группы Projects/',
    mutate: (r) => put(r, 'hub.js', registryJs(withEntry(2, { group: 'projects' }))) },
  { name: 'неизвестная иконка', expect: 'П2',
    mutate: (r) => put(r, 'hub.js', registryJs(withEntry(1, { icon: 'no-such-glyph' }))) },
  { name: 'повтор id', expect: 'id повторяется',
    mutate: (r) => put(r, 'hub.js', registryJs([...CLEAN_ENTRIES, { ...CLEAN_ENTRIES[2] }])) },
  { name: 'концепт без root', expect: 'нет root',
    mutate: (r) => put(r, 'hub.js', registryJs(withEntry(2, { root: null }))) },
  { name: 'строка пользователя на «#»', expect: 'ведёт на «#»',
    mutate: (r) => put(r, 'Concepts/gamma/Gamma.html', '<a class="nav__user" href="#" aria-label="Открыть личный кабинет">Г</a>') },
  { name: 'footerHTML без подмены', expect: 'без подмены',
    mutate: (r) => put(r, 'Projects/alpha/screen/Screen.html', '<script>var USER_LINK_TO = \' href="../../../index.html"\';\nvar s = window.IBPHome.footerHTML(role);</script>') },
  { name: 'реестр не выполняется', expect: 'не выполняется',
    mutate: (r) => put(r, 'hub.js', 'window.IBPHub = [ {;') },
];

function selftest() {
  const out = ['== projects-hub --selftest =='];
  let failed = 0;
  for (const c of CASES) {
    const root = mkdtempSync(path.join(os.tmpdir(), 'projects-hub-'));
    try {
      cleanTree(root);
      if (c.mutate) c.mutate(root);
      const { defects } = check(root);
      const pass = c.expect === null
        ? defects.length === 0
        : defects.length > 0 && defects.some((d) => d.includes(c.expect));
      if (!pass) failed++;
      // префикс FAIL — его показывает гейт (фильтр FINDING в lessons-cli.mjs)
      out.push((pass ? 'ok    ' : 'FAIL  ') + c.name + ' — ' + (defects.length ? defects.join(' | ') : 'дефектов нет'));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }
  out.push('ВЕРДИКТ: ' + (failed ? 'FAIL (кейсов не прошло: ' + failed + ' из ' + CASES.length + ')' : 'OK (кейсов: ' + CASES.length + ')'));
  console.log(out.join('\n'));
  process.exit(failed ? 1 : 0);
}

/* ---------------- main ---------------- */

function main() {
  const args = process.argv.slice(2);
  if (args.includes('--selftest')) return selftest();
  const rIdx = args.indexOf('--root');
  const repo = rIdx >= 0 ? path.resolve(args[rIdx + 1]) : REPO;
  const res = check(repo);
  console.log(report(res));
  process.exit(res.defects.length ? 1 : 0);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
