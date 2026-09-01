/* ============================================================
   DS-REGISTRY — сборщик реестра продукта (этап 2 «Генератор панели и реестра»).
   ВНИМАНИЕ: это НЕ браузерный скрипт, как ds-lint.js. На страницах не подключается.
   Запуск только из run_script, В ПРОЕКТЕ ПРОДУКТА (эта ДС подключена туда как _ds/<папка>):

     const src = await readFile('_ds/<папка ДС>/scripts/ds-registry.js');
     const { build } = new Function('readFile', 'ls', src + ';return dsRegistry;')(readFile, ls);
     const reg = await build({ ls, readFile, rulesVersion: '1.003' }); // версия страницы
                                                                        // LocalComponents в подключённой ДС
     await saveFile('registry.json', JSON.stringify(reg, null, 2));

   registry.json — машинная таблица (структура в build() ниже). admin.html
   (templates/admin/ в этой ДС) — человеческое представление: fetch('./registry.json')
   и рендер, сам не пересобирается. Перегенерировать реестр — после ЛЮБОЙ правки паспорта
   компонента или документа экрана; реестр не редактируется руками никогда.

   Что читает (пути настраиваются опциями componentsDir/screensDir/requirementsDir):
     kit/components/<Имя>/<Имя>.md   — паспорта (шапка + проверка незаполненных строк тела)
     screens/<id>.md (+ <id>.frag.html) — документы экранов
     requirements/<БТ>.md            — копии требований (только факт существования файла)
   ============================================================ */

const SHELL_TEMPLATES = ['AppShell', 'ListPage', 'EntityPage', 'FormPage', 'DashboardPage', 'Prototype', 'Screen'];
const STATUSES = ['черновик', 'на тесте', 'утверждён', 'архив'];

function parseFrontMatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return { data: {}, body: text };
  const data = {};
  m[1].split(/\r?\n/).forEach((line) => {
    const mm = line.match(/^([A-Za-z_][\w]*):\s*(.*)$/);
    if (!mm) return;
    const raw = mm[2].replace(/\s+#.*$/, '').trim();
    if (/^\[.*\]$/.test(raw)) {
      const inner = raw.slice(1, -1).trim();
      data[mm[1]] = inner ? inner.split(',').map((s) => s.trim()).filter(Boolean) : [];
    } else {
      data[mm[1]] = raw;
    }
  });
  return { data, body: text.slice(m[0].length) };
}

// строка вида "|  |  |  |" — незаполненная строка таблицы шаблона (сигнал, что раздел не заполнен)
function unfilledRows(body) {
  let n = 0;
  body.split(/\r?\n/).forEach((line) => {
    if (!/^\s*\|.*\|\s*$/.test(line)) return;
    const cells = line.split('|').slice(1, -1).map((c) => c.trim());
    if (cells.length && cells.every((c) => c === '')) n++;
  });
  return n;
}

async function readMaybe(readFile, path) {
  try { return await readFile(path); } catch (e) { return null; }
}

async function scanComponents(ls, readFile, dir, mismatches) {
  let names = [];
  try { names = await ls(dir); } catch (e) { return []; }
  const out = [];
  for (const name of names) {
    let path = `${dir}/${name}/${name}.md`;
    let text = await readMaybe(readFile, path);
    if (text == null) {
      // файл назван не как папка — если внутри ровно один .md, берём его
      let inner = [];
      try { inner = await ls(`${dir}/${name}`); } catch (e) { inner = []; }
      const mdFiles = inner.filter((f) => f.endsWith('.md'));
      if (mdFiles.length === 1) { path = `${dir}/${name}/${mdFiles[0]}`; text = await readMaybe(readFile, path); }
    }
    if (text == null) {
      mismatches.push({ level: 'blocker', code: 'NO_PASSPORT', message: 'Папка компонента без паспорта .md', path: `${dir}/${name}/` });
      continue;
    }
    const { data, body } = parseFrontMatter(text);
    const REQUIRED = ['name', 'version', 'updated', 'rulesVersion', 'category', 'purpose', 'ds'];
    REQUIRED.filter((k) => !data[k] || (Array.isArray(data[k]) && !data[k].length))
      .forEach((k) => mismatches.push({ level: 'blocker', code: 'MISSING_FIELD', message: `Паспорт: пустое обязательное поле «${k}»`, path }));
    const blanks = unfilledRows(body);
    if (blanks > 0) mismatches.push({ level: 'warn', code: 'TEMPLATE_ROWS', message: `В теле паспорта осталось незаполненных строк таблиц: ${blanks}`, path });
    out.push({
      name: data.name || name, folder: name, path,
      version: data.version || null, updated: data.updated || null, rulesVersion: data.rulesVersion || null,
      category: data.category || null, purpose: data.purpose || null, owner: data.owner || null, designer: data.designer || null,
      ds: data.ds || [], passportUsedOn: data.usedOn || [], variants: data.variants || [], modifiers: data.modifiers || [],
      dependsOn: data.dependsOn || [], requirements: data.requirements || [], knowledge: data.knowledge || [],
      unfilledRows: blanks, usedOn: []
    });
  }
  return out;
}

async function scanScreens(ls, readFile, dir, mismatches) {
  let names = [];
  try { names = await ls(dir); } catch (e) { return []; }
  const mdNames = names.filter((n) => n.endsWith('.md'));
  const out = [];
  for (const n of mdNames) {
    const path = `${dir}/${n}`;
    const text = await readMaybe(readFile, path);
    if (text == null) continue;
    const { data } = parseFrontMatter(text);
    const REQUIRED = ['id', 'title', 'route', 'template', 'version', 'updated', 'status'];
    REQUIRED.filter((k) => !data[k]).forEach((k) => mismatches.push({ level: 'blocker', code: 'SCREEN_MISSING_FIELD', message: `Экран: пустое обязательное поле «${k}»`, path }));
    if (data.status && STATUSES.indexOf(data.status) === -1) mismatches.push({ level: 'warn', code: 'SCREEN_STATUS', message: `Неизвестный статус «${data.status}» (ожидались: ${STATUSES.join(' / ')})`, path });
    if (data.template && SHELL_TEMPLATES.indexOf(data.template) === -1) mismatches.push({ level: 'warn', code: 'SCREEN_TEMPLATE', message: `Неизвестный шаблон каркаса «${data.template}»`, path });
    const fragName = n.replace(/\.md$/, '.frag.html');
    const hasFragment = names.indexOf(fragName) !== -1;
    if (!hasFragment) mismatches.push({ level: 'warn', code: 'NO_FRAGMENT', message: `Нет парного файла вёрстки ${fragName}`, path });
    out.push({
      id: data.id || n.replace(/\.md$/, ''), path, title: data.title || null, route: data.route || null,
      template: data.template || null, status: data.status || null, version: data.version || null, updated: data.updated || null,
      components: data.components || [], ds: data.ds || [], fixtures: data.fixtures || null, states: data.states || [],
      requirements: data.requirements || [], knowledge: data.knowledge || [], hasFragment
    });
  }
  return out;
}

async function build(opts) {
  opts = opts || {};
  const ls = opts.ls, readFile = opts.readFile;
  const componentsDir = opts.componentsDir || 'kit/components';
  const screensDir = opts.screensDir || 'screens';
  const requirementsDir = opts.requirementsDir || 'requirements';
  const mismatches = [];

  const components = await scanComponents(ls, readFile, componentsDir, mismatches);
  const screens = await scanScreens(ls, readFile, screensDir, mismatches);

  // usedOn считается реестром, а не берётся из паспорта — паспорт его руками не правит
  const byName = new Map(components.map((c) => [c.name, c]));
  const byFolder = new Map(components.map((c) => [c.folder, c]));
  screens.forEach((s) => {
    s.components.forEach((ref) => {
      const c = byName.get(ref) || byFolder.get(ref);
      if (c) c.usedOn.push(s.id);
      else mismatches.push({ level: 'blocker', code: 'UNKNOWN_COMPONENT', message: `Экран ссылается на компонент «${ref}», паспорта с таким именем нет`, path: s.path });
    });
  });

  let reqFiles = null;
  try { reqFiles = await ls(requirementsDir); } catch (e) { reqFiles = null; }
  const reqIds = reqFiles ? reqFiles.map((f) => f.replace(/\.md$/, '')) : null;
  const requirementsIndex = {};
  const touch = (id, kind, ref) => {
    if (!requirementsIndex[id]) requirementsIndex[id] = { screens: [], components: [], fileExists: reqIds ? reqIds.indexOf(id) !== -1 : null };
    requirementsIndex[id][kind].push(ref);
  };
  screens.forEach((s) => s.requirements.forEach((id) => touch(id, 'screens', s.id)));
  components.forEach((c) => c.requirements.forEach((id) => touch(id, 'components', c.name)));
  if (reqIds) {
    Object.keys(requirementsIndex).forEach((id) => {
      if (!requirementsIndex[id].fileExists) mismatches.push({ level: 'blocker', code: 'REQ_NOT_FOUND', message: `Требование «${id}» упомянуто, но файла ${requirementsDir}/${id}.md нет`, path: '' });
    });
  }

  if (opts.rulesVersion) {
    components.forEach((c) => {
      if (c.rulesVersion && c.rulesVersion !== opts.rulesVersion) {
        mismatches.push({ level: 'warn', code: 'RULES_DRIFT', message: `Паспорт заполнен по правилам ${c.rulesVersion}, сейчас в ДС ${opts.rulesVersion}`, path: c.path });
      }
    });
  }

  components.forEach((c) => {
    if (!c.usedOn.length) mismatches.push({ level: 'info', code: 'UNUSED', message: 'Компонент не встречается ни на одном экране', path: c.path });
  });

  return {
    generatedAt: new Date().toISOString(),
    rulesVersionChecked: opts.rulesVersion || null,
    componentsDir, screensDir, requirementsDir,
    components, screens, requirements: requirementsIndex,
    mismatches
  };
}

/* API наружу: файл должен оставаться валидным скриптом (компилятор ДС его парсит),
   поэтому не `return`, а переменная — вызывающий дописывает `;return dsRegistry;` */
var dsRegistry = { build };
