#!/usr/bin/env node
/* ============================================================
   AGENT-CONFIG — сторож конфигурации агентного CLI (opencode).

   Зачем. Конфиг opencode читается из двух мест: корень проекта и папка
   `.opencode/`. Слой `.opencode/` грузится ПОСЛЕ корневого и перекрывает его
   (проверено на 1.18.30, 15.09.2026). Решено держать один файл —
   `.opencode/opencode.json`. Второй конфиг в корне не ломает ничего явно:
   права просто начинают складываться из двух слоёв, и запрет на удаление
   может оказаться снятым в файле, на который никто не смотрит.

   Модель в конфиге репозитория не задаётся: провайдер и имя модели зависят
   от контура (дома — публичный API, на работе — корпоративная копия у другого
   провайдера). Неверная пара «провайдер/модель» в opencode — не откат на
   модель по умолчанию, а ошибка «Model not found», агент не стартует. Модель
   и провайдер пишутся в глобальный конфиг машины (.opencode/README.md,
   раздел «Как подключить модель»).

   Что проверяет (коды КФ — «конфиг»):
     КФ1 в корне репозитория нет opencode.json и opencode.jsonc;
     КФ2 конфиг есть ровно один — .opencode/opencode.json, читается как JSON;
     КФ3 в нём нет ключей модели: model, small_model, provider,
         agent.<имя>.model.

   Честная граница: frontmatter агентов (.opencode/agents) на ключ model
   не проверяется — там его сейчас нет, и заводить вход без случая незачем.

   Журнал прогонов (runs.jsonl) сторож не пишет — по той же причине, что
   projects-hub.mjs: кодов для деления на «живой/исчез» у него нет.

   Использование:
     node agent-config.mjs [--root <корень репозитория>]
     node agent-config.mjs --selftest   — откат на временном дереве
   Строка `ВЕРДИКТ: OK | FAIL`, код выхода 0 | 1.
   ============================================================ */
import { readFileSync, existsSync, mkdirSync, writeFileSync, rmSync, mkdtempSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..', '..', '..', '..');

const CONFIG = '.opencode/opencode.json';
const MODEL_KEYS = ['model', 'small_model', 'provider'];

function check(root) {
  const defects = [];

  for (const name of ['opencode.json', 'opencode.jsonc']) {
    if (existsSync(path.join(root, name))) {
      defects.push('КФ1 ' + name + ' в корне — второй слой конфига поверх ' + CONFIG + '; перенести содержимое в ' + CONFIG + ' и удалить');
    }
  }

  if (existsSync(path.join(root, '.opencode/opencode.jsonc'))) {
    defects.push('КФ2 .opencode/opencode.jsonc — конфиг ведётся одним файлом ' + CONFIG);
  }
  const abs = path.join(root, CONFIG);
  if (!existsSync(abs)) {
    defects.push('КФ2 ' + CONFIG + ' не найден — права и instructions не подключены');
    return { defects };
  }
  let cfg;
  try {
    cfg = JSON.parse(readFileSync(abs, 'utf8'));
  } catch (e) {
    defects.push('КФ2 ' + CONFIG + ' не читается как JSON: ' + e.message);
    return { defects };
  }

  for (const k of MODEL_KEYS) {
    if (cfg[k] !== undefined) defects.push('КФ3 ' + CONFIG + ' → ' + k + ' — модель и провайдер задаются в глобальном конфиге машины, не в репозитории');
  }
  for (const [name, a] of Object.entries(cfg.agent || {})) {
    if (a && a.model !== undefined) defects.push('КФ3 ' + CONFIG + ' → agent.' + name + '.model — на другом контуре даст «Model not found»');
  }

  return { defects };
}

function report({ defects }) {
  const out = ['== agent-config =='];
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

const CLEAN = {
  $schema: 'https://opencode.ai/config.json',
  instructions: ['.opencode/rules/ds-rules.md'],
  permission: { bash: { '*': 'allow', 'rm *': 'deny' } },
  agent: { build: { temperature: 0.2 } },
};
const cfgJson = (patch) => JSON.stringify({ ...CLEAN, ...patch }, null, 2);

const CASES = [
  { name: 'чистое дерево', expect: null },
  { name: 'конфиг в корне', expect: 'КФ1 opencode.json',
    mutate: (r) => put(r, 'opencode.json', cfgJson({})) },
  { name: 'jsonc в корне', expect: 'КФ1 opencode.jsonc',
    mutate: (r) => put(r, 'opencode.jsonc', '{}') },
  { name: 'конфига нет', expect: 'не найден',
    mutate: (r) => rmSync(path.join(r, CONFIG)) },
  { name: 'jsonc рядом в .opencode', expect: 'КФ2 .opencode/opencode.jsonc',
    mutate: (r) => put(r, '.opencode/opencode.jsonc', '{}') },
  { name: 'битый JSON', expect: 'не читается как JSON',
    mutate: (r) => put(r, CONFIG, '{ "permission": ') },
  { name: 'модель агента', expect: 'agent.plan.model',
    mutate: (r) => put(r, CONFIG, cfgJson({ agent: { plan: { model: 'deepseek/deepseek-v4-flash' } } })) },
  { name: 'модель по умолчанию', expect: '→ model',
    mutate: (r) => put(r, CONFIG, cfgJson({ model: 'corp-gateway/deepseek-v4-flash' })) },
  { name: 'провайдер', expect: '→ provider',
    mutate: (r) => put(r, CONFIG, cfgJson({ provider: { 'corp-gateway': {} } })) },
];

function selftest() {
  const out = ['== agent-config --selftest =='];
  let failed = 0;
  for (const c of CASES) {
    const root = mkdtempSync(path.join(os.tmpdir(), 'agent-config-'));
    try {
      put(root, CONFIG, cfgJson({}));
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
