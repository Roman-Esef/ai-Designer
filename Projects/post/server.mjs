#!/usr/bin/env node
/* ============================================================
   server.mjs — локальный сервер направления Post: статика + API данных.

   Зачем. Страницы открываются двойным кликом (file://), а оттуда браузер не
   может ни обратиться к серверу, ни записать файл: правка состава участников
   сделки дошла бы до таблицы портфеля только через хранилище браузера. Этот
   сервер исполняет контракт API (data/API.md) — тот же, что потом реализует
   настоящий бэкенд, — и хранит данные в файле базы. Со страницей его связывает
   один адаптер, data/post-api.js; без сервера адаптер пишет в localStorage.

   Что делает:
   – раздаёт статику от КОРНЯ репозитория, поэтому относительные пути страниц
     (../../../DS-IBP/…) работают как есть; кэш отключён — правка файла видна
     на следующей перезагрузке;
   – /api/post/participants — состав участников сделок (см. data/API.md);
   – база — data/db/participants.json, запись атомарная (временный файл +
     rename). Папка db/ — данные запуска, в git не идёт (.gitignore).

   Запуск:
     node Projects/post/server.mjs            — http://127.0.0.1:8787/
     PORT=9000 node Projects/post/server.mjs  — другой порт
     node Projects/post/server.mjs --reset    — очистить базу и выйти
   Слушает только 127.0.0.1: наружу сервер не виден.
   ============================================================ */
import http from 'node:http';
import { readFile, writeFile, rename, mkdir, stat, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const DB_DIR = path.join(HERE, 'data', 'db');
const DB_FILE = path.join(DB_DIR, 'participants.json');
const HOST = '127.0.0.1';
const PORT = Number(process.env.PORT) || 8787;

const API = '/api/post/participants';
const ID_RE = /^[\w-]{1,32}$/;
const MAX_ITEMS = 500;
const MAX_BODY = 64 * 1024;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.otf': 'font/otf',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

/* ── База ─────────────────────────────────────────────────────────── */

async function readDb() {
  try {
    const data = JSON.parse(await readFile(DB_FILE, 'utf8'));
    return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
  } catch (e) {
    if (e.code === 'ENOENT') return {};
    throw e;
  }
}

/* Запросы выполняются по очереди: два одновременных PUT иначе прочитали бы
   одну и ту же базу и второй затёр бы первый. */
let queue = Promise.resolve();
function serial(fn) {
  const run = queue.then(fn, fn);
  queue = run.catch(() => {});
  return run;
}

async function writeDb(data) {
  await mkdir(DB_DIR, { recursive: true });
  const tmp = DB_FILE + '.' + process.pid + '.tmp';
  await writeFile(tmp, JSON.stringify(data, null, 2) + '\n', 'utf8');
  await rename(tmp, DB_FILE);
}

/* ── HTTP-помощники ───────────────────────────────────────────────── */

function send(res, status, body, type) {
  const headers = { 'Cache-Control': 'no-store' };
  if (body === undefined || body === null) {
    res.writeHead(status, headers);
    res.end();
    return;
  }
  const isJson = !type;
  headers['Content-Type'] = type || 'application/json; charset=utf-8';
  res.writeHead(status, headers);
  res.end(isJson ? JSON.stringify(body) : body);
}

function fail(res, status, message) { send(res, status, { error: message }); }

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) { reject(Object.assign(new Error('тело больше 64 КБ'), { status: 413 })); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

/* Состав сделки: members — id контрагентов, knr — подмножество members. */
function validParticipants(body) {
  if (!body || typeof body !== 'object') return 'тело — объект { members, knr }';
  const { members, knr } = body;
  if (!Array.isArray(members) || !Array.isArray(knr)) return 'members и knr — массивы';
  if (members.length > MAX_ITEMS || knr.length > MAX_ITEMS) return 'не больше ' + MAX_ITEMS + ' записей';
  if (!members.every((id) => typeof id === 'string' && ID_RE.test(id))) return 'id в members — строка [A-Za-z0-9_-]{1,32}';
  if (new Set(members).size !== members.length) return 'id в members повторяются';
  if (!knr.every((id) => members.includes(id))) return 'каждый id из knr должен быть в members';
  if (new Set(knr).size !== knr.length) return 'id в knr повторяются';
  return null;
}

/* ── API ──────────────────────────────────────────────────────────── */

async function handleApi(req, res, pathname) {
  const rest = pathname.slice(API.length);

  if (rest === '' || rest === '/') {
    if (req.method === 'GET') return send(res, 200, await readDb());
    if (req.method === 'DELETE') {
      await serial(() => writeDb({}));
      return send(res, 204);
    }
    return fail(res, 405, 'метод не поддерживается');
  }

  const dealId = decodeURIComponent(rest.replace(/^\//, ''));
  if (!ID_RE.test(dealId)) return fail(res, 400, 'номер сделки — [A-Za-z0-9_-]{1,32}');

  if (req.method === 'GET') {
    const db = await readDb();
    return db[dealId] ? send(res, 200, db[dealId]) : fail(res, 404, 'состав сделки не сохранялся');
  }

  if (req.method === 'PUT') {
    let body;
    try { body = JSON.parse(await readBody(req)); }
    catch (e) { return fail(res, e.status || 400, e.status ? e.message : 'тело — JSON'); }
    const problem = validParticipants(body);
    if (problem) return fail(res, 400, problem);
    const updated = new Date().toISOString();
    await serial(async () => {
      const db = await readDb();
      db[dealId] = { members: body.members, knr: body.knr, updated };
      await writeDb(db);
    });
    return send(res, 200, { ok: true, updated });
  }

  return fail(res, 405, 'метод не поддерживается');
}

/* ── Статика ──────────────────────────────────────────────────────── */

async function handleStatic(req, res, pathname) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return fail(res, 405, 'метод не поддерживается');
  let file = path.resolve(ROOT, '.' + pathname);
  /* выход за корень репозитория — запрещён */
  if (file !== ROOT && !file.startsWith(ROOT + path.sep)) return send(res, 403, 'Forbidden', 'text/plain; charset=utf-8');
  /* скрытые папки и файлы (.git, .opencode) страницам не нужны — не отдаются */
  if (path.relative(ROOT, file).split(path.sep).some((part) => part.startsWith('.'))) {
    return send(res, 404, 'Not found: ' + pathname, 'text/plain; charset=utf-8');
  }
  try {
    let info = await stat(file);
    if (info.isDirectory()) {
      file = path.join(file, 'index.html');
      info = await stat(file);
    }
    const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
    const data = req.method === 'HEAD' ? '' : await readFile(file);
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
    res.end(data);
  } catch (e) {
    send(res, 404, 'Not found: ' + pathname, 'text/plain; charset=utf-8');
  }
}

/* ── Запуск ───────────────────────────────────────────────────────── */

if (process.argv.includes('--reset')) {
  await rm(DB_FILE, { force: true });
  console.log('server: база очищена — ' + path.relative(ROOT, DB_FILE));
  process.exit(0);
}

const server = http.createServer(async (req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://' + HOST).pathname); }
  catch (e) { return fail(res, 400, 'неверный адрес'); }
  try {
    if (pathname === API || pathname.startsWith(API + '/')) return await handleApi(req, res, pathname);
    return await handleStatic(req, res, pathname);
  } catch (e) {
    console.error('server: ' + req.method + ' ' + pathname + ' — ' + e.message);
    if (!res.headersSent) fail(res, 500, 'ошибка сервера');
  }
});

server.listen(PORT, HOST, () => {
  const base = 'http://' + HOST + ':' + PORT;
  console.log('server: ' + base + '/  (корень — ' + ROOT + ')');
  console.log('server: портфель — ' + base + '/Projects/post/Portfolio-did/Portfolio.html');
  console.log('server: база — ' + path.relative(ROOT, DB_FILE));
});
