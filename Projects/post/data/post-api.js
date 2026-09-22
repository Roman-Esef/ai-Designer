/* =========================================================================
   PostApi — адаптер хранения данных направления Post.

   Единственное место, которое знает, КУДА пишутся данные. Сторы и страницы
   говорят только с ним, поэтому переход на настоящий бэкенд — правка этого
   файла, а не экранов. Контракт API — data/API.md.

   Экспорт: window.PostApi = {
     mode() → 'server' | 'local' | null   — null, пока режим не определён
     ready → Promise<'server'|'local'>
     all() → Promise<{ dealId: { members, knr, updated } }>
     get(dealId) → Promise<{ members, knr, updated } | null>
     put(dealId, { members, knr }) → Promise<{ ok, updated }>
     reset() → Promise
   }

   Два режима:
   – server — страница открыта с локального сервера (node Projects/post/server.mjs)
     и он отвечает на /api/post/participants: данные пишутся в его базу;
   – local — страница открыта двойным кликом (file://) или с чужого сервера без
     этого API: данные пишутся в localStorage этого браузера. Так же ДС хранит
     закрепление меню между страницами (ds-nav-panel.js). Режим объявляется в
     консоли один раз.

   Состояние — состав участников сделки: members — id контрагентов из базы
   (mock-counterparties.js), knr — те из них, кто отмечен КНР.
   ========================================================================= */
(function () {
  'use strict';

  var BASE = '/api/post/participants';
  var LS_KEY = 'ibp.post.participants';
  var mode = null;

  /* ── local: localStorage ────────────────────────────────────────── */
  function readLocal() {
    try {
      var raw = window.localStorage.getItem(LS_KEY);
      var data = raw ? JSON.parse(raw) : {};
      return data && typeof data === 'object' ? data : {};
    } catch (e) { return {}; }
  }
  function writeLocal(data) {
    try { window.localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch (e) { /* хранилище недоступно — правка живёт до перезагрузки */ }
  }

  var local = {
    all: function () { return Promise.resolve(readLocal()); },
    get: function (id) { return Promise.resolve(readLocal()[String(id)] || null); },
    put: function (id, rec) {
      var data = readLocal();
      var updated = new Date().toISOString();
      data[String(id)] = { members: rec.members.slice(), knr: rec.knr.slice(), updated: updated };
      writeLocal(data);
      return Promise.resolve({ ok: true, updated: updated });
    },
    reset: function () {
      try { window.localStorage.removeItem(LS_KEY); } catch (e) {}
      return Promise.resolve();
    }
  };

  /* ── server: HTTP API локального сервера ─────────────────────────── */
  function http(method, url, body) {
    var init = { method: method, headers: { 'Accept': 'application/json' }, cache: 'no-store' };
    if (body !== undefined) {
      init.headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(body);
    }
    return fetch(url, init).then(function (res) {
      if (res.status === 404 && method === 'GET') return null;
      if (!res.ok) throw new Error('PostApi: ' + method + ' ' + url + ' → ' + res.status);
      return res.status === 204 ? null : res.json();
    });
  }

  var server = {
    all: function () { return http('GET', BASE).then(function (d) { return d || {}; }); },
    get: function (id) { return http('GET', BASE + '/' + encodeURIComponent(id)); },
    put: function (id, rec) { return http('PUT', BASE + '/' + encodeURIComponent(id), { members: rec.members, knr: rec.knr }); },
    reset: function () { return http('DELETE', BASE); }
  };

  /* ── выбор режима ───────────────────────────────────────────────── */
  /* По file:// fetch не работает вовсе, поэтому сервер пробуется только на
     http(s). Любой отказ (нет сервера, чужой сервер, 404) — режим local. */
  function detect() {
    var proto = window.location && window.location.protocol;
    if ((proto === 'http:' || proto === 'https:') && window.fetch) {
      return fetch(BASE, { cache: 'no-store' })
        .then(function (res) { return res.ok ? 'server' : 'local'; })
        .catch(function () { return 'local'; });
    }
    return Promise.resolve('local');
  }

  var ready = detect().then(function (m) {
    mode = m;
    if (m === 'local' && window.console) {
      console.info('PostApi: сервер данных не найден — правки состава участников сохраняются только в этом браузере (localStorage). Запуск сервера: node Projects/post/server.mjs');
    }
    return m;
  });

  function impl() { return mode === 'server' ? server : local; }
  function call(name, args) {
    return ready.then(function () { return impl()[name].apply(null, args); });
  }

  window.PostApi = {
    mode: function () { return mode; },
    ready: ready,
    all: function () { return call('all', []); },
    get: function (id) { return call('get', [id]); },
    put: function (id, rec) { return call('put', [id, rec]); },
    reset: function () { return call('reset', []); }
  };
})();
