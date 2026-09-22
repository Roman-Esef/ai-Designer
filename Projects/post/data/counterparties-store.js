/* =========================================================================
   CounterpartiesStore — база контрагентов и состав участников сделки.
   Подключить ПОСЛЕ mock-counterparties.js и post-api.js; если на странице есть
   сделки — после deals-store.js (стор переносит КНР сделок в DealsStore).

   Экспорт: window.CounterpartiesStore = {
     list() → запись[] · byId(id) → запись|null      — база (копии не нужны:
                                                        записи не меняются)
     ready → Promise                                  — загружены сохранённые
                                                        составы всех сделок
     use(dealId|null) → Promise                       — открыть сделку; null —
                                                        демо-состав витрин
     dealId() → id|null
     members(kind) → запись[]                         — участники текущей сделки;
                                                        без kind — все
     search(kind, params) → запись[] | null           — поиск по базе; null —
                                                        параметры не заданы
     isMember(id) · isKnr(id) → boolean
     move(id, 'member'|'found') → boolean             — добавить / убрать
     setKnr(id, value) → boolean                      — отметка «КНР»
     knr() → запись[]                                 — КНР текущей сделки
     knrNames(dealId) → строка[]                      — имена КНР любой сделки
     begin() · rollback() · commit() → Promise · dirty() → boolean
     on('change' | 'commit', fn) → off()
   }
   Записи, которые отдают members/search/knr, — копии записей базы с двумя
   полями состава: place ('member' | 'found') и knr. Их и рисует карточка.

   Правила предметной области живут здесь, а не на экране:
   – риск-метрика, строка ГСЗ и чекбокс «КНР» осмыслены только у участника
     сделки (карточка их показывает по place);
   – убрать контрагента из участников — значит снять с него и отметку КНР:
     носителем риска не может быть тот, кто в сделке не участвует;
   – физлица ищутся только среди физлиц юрлиц — участников сделки.

   Откуда состав сделки:
   – сохранённая сделка — из PostApi (база сервера или localStorage);
   – несохранённая — из её поля knr в mock-deals.js: по именам находятся
     записи базы, все они участники и все КНР. Так тайл «КНР», таблица
     портфеля и окно согласованы с первого открытия.

   Черновик. Окно КНР правит состав в черновике: begin() запоминает состав,
   rollback() возвращает его, commit() сохраняет через PostApi и переносит
   имена КНР в DealsStore (колонка «КНР» портфеля читает оттуда).
   ========================================================================= */
(function () {
  'use strict';

  var base = (window.MOCK_COUNTERPARTIES || []).map(function (c) {
    return JSON.parse(JSON.stringify(c));
  });
  var DEMO = window.MOCK_DEMO_PARTICIPANTS || { members: [], knr: [] };

  /* До use() открыт демо-состав: витрины кита сделку не выбирают */
  var current = { dealId: null, members: DEMO.members.slice(), knr: DEMO.knr.slice() };
  var snapshot = null;
  var saved = {};
  var listeners = [];

  function emit(type, detail) {
    listeners.forEach(function (l) { if (l.type === type) l.fn(detail || {}); });
  }

  function byId(id) {
    for (var i = 0; i < base.length; i++) if (base[i].id === id) return base[i];
    return null;
  }

  function byName(name) {
    for (var i = 0; i < base.length; i++) {
      if (base[i].kind === 'ul' && base[i].name === name) return base[i];
    }
    return null;
  }

  function copyState(s) {
    return { members: (s.members || []).slice(), knr: (s.knr || []).slice() };
  }

  /* ── Состав сделки ──────────────────────────────────────────────── */

  /* Начальный состав несохранённой сделки — её КНР из реестра. */
  function seed(dealId) {
    if (dealId == null) return copyState(DEMO);
    var deal = window.DealsStore ? window.DealsStore.byId(dealId) : null;
    var ids = [];
    ((deal && deal.knr) || []).forEach(function (name) {
      var rec = byName(name);
      if (rec && ids.indexOf(rec.id) === -1) ids.push(rec.id);
    });
    return { members: ids, knr: ids.slice() };
  }

  function stateOf(dealId) {
    if (dealId != null && saved[String(dealId)]) return copyState(saved[String(dealId)]);
    return seed(dealId);
  }

  function namesOf(state) {
    return state.knr.map(function (id) { var r = byId(id); return r ? r.name : null; })
      .filter(Boolean);
  }

  /* Колонка «КНР» портфеля читает deal.knr — туда стор и кладёт имена. */
  function syncDeal(dealId, state) {
    if (dealId == null || !window.DealsStore || !window.DealsStore.byId(dealId)) return;
    window.DealsStore.update(dealId, { knr: namesOf(state) });
  }

  var api = window.PostApi;
  var ready = (api ? api.all() : Promise.resolve({}))
    .then(function (all) {
      saved = all || {};
      Object.keys(saved).forEach(function (id) {
        /* ключи хранилища — строки, номера сделок в реестре — числа */
        var deal = window.DealsStore && window.DealsStore.byId(id);
        if (deal) syncDeal(deal.id, copyState(saved[id]));
      });
    })
    .catch(function (e) {
      if (window.console) console.warn('CounterpartiesStore: сохранённые составы не загрузились', e);
    });

  function use(dealId) {
    current = { dealId: dealId == null ? null : dealId, members: [], knr: [] };
    snapshot = null;
    return ready.then(function () {
      if (current.dealId !== (dealId == null ? null : dealId)) return;
      var s = stateOf(dealId);
      current.members = s.members;
      current.knr = s.knr;
      emit('change', { reason: 'use' });
    });
  }

  /* ── Чтение ─────────────────────────────────────────────────────── */

  function view(rec, place) {
    var c = JSON.parse(JSON.stringify(rec));
    c.place = place;
    c.knr = place === 'member' && current.knr.indexOf(rec.id) !== -1;
    return c;
  }

  function isMember(id) { return current.members.indexOf(id) !== -1; }
  function isKnr(id) { return current.knr.indexOf(id) !== -1; }

  function members(kind) {
    return current.members.map(byId).filter(function (r) {
      return r && (!kind || r.kind === kind);
    }).map(function (r) { return view(r, 'member'); });
  }

  function knr() {
    return current.members.filter(isKnr).map(byId).filter(Boolean)
      .map(function (r) { return view(r, 'member'); });
  }

  function knrNames(dealId) {
    if (dealId != null && current.dealId != null && String(dealId) === String(current.dealId)) {
      return namesOf(current);
    }
    return namesOf(stateOf(dealId));
  }

  /* ── Поиск ──────────────────────────────────────────────────────── */

  /* Наименование — подстрокой, без регистра, кавычек и разницы ё/е.
     Коды — подстрокой по цифрам: пробелы и знаки в номере не мешают. */
  function normText(s) {
    return String(s == null ? '' : s).toLowerCase().replace(/ё/g, 'е')
      .replace(/[«»"'„“”]/g, '').replace(/\s+/g, ' ').trim();
  }
  function normDigits(s) { return String(s == null ? '' : s).replace(/\D/g, ''); }

  function fieldValue(rec, label) {
    var f = (rec.fields || []).filter(function (p) { return p[0] === label; })[0];
    return f ? f[1] : '';
  }

  function hasCode(value, wanted) {
    var w = normDigits(wanted);
    return !w || normDigits(value).indexOf(w) !== -1;
  }

  var UL_CODES = [['inn', 'ИНН'], ['kpp', 'КПП'], ['ogrn', 'ОГРН'], ['kio', 'КИО']];
  var FL_CODES = ['inn', 'passport', 'phone'];

  function filled(params) {
    return Object.keys(params || {}).some(function (k) {
      return String(params[k] == null ? '' : params[k]).trim() !== '';
    });
  }

  function search(kind, params) {
    params = params || {};
    if (!filled(params)) return null;
    var name = normText(params.name);

    return base.filter(function (r) {
      if (r.kind !== kind || isMember(r.id)) return false;
      if (kind === 'ul') {
        if (name && normText(r.name).indexOf(name) === -1) return false;
        return UL_CODES.every(function (c) { return hasCode(fieldValue(r, c[1]), params[c[0]]); });
      }
      /* физлица — только юрлиц-участников сделки */
      if (!isMember(r.parentId)) return false;
      if (params.parentId && r.parentId !== params.parentId) return false;
      var bd = String(params.birthDate || '').trim();
      if (bd && String(r.subheader).trim() !== bd) return false;
      var keys = r.keys || {};
      return FL_CODES.every(function (k) { return hasCode(keys[k], params[k]); });
    }).map(function (r) { return view(r, 'found'); });
  }

  /* ── Правка ─────────────────────────────────────────────────────── */

  function move(id, place) {
    if (!byId(id) || (place !== 'member' && place !== 'found')) return false;
    if (place === 'member') {
      if (isMember(id)) return false;
      current.members.push(id);
    } else {
      if (!isMember(id)) return false;
      current.members.splice(current.members.indexOf(id), 1);
      /* КНР принадлежит участнику сделки: убрали — сняли */
      var k = current.knr.indexOf(id);
      if (k !== -1) current.knr.splice(k, 1);
    }
    emit('change', { reason: 'move', id: id, place: place });
    return true;
  }

  function setKnr(id, value) {
    if (!isMember(id)) return false;
    var k = current.knr.indexOf(id);
    if (value && k === -1) current.knr.push(id);
    else if (!value && k !== -1) current.knr.splice(k, 1);
    else return false;
    emit('change', { reason: 'knr', id: id });
    return true;
  }

  /* ── Черновик ───────────────────────────────────────────────────── */

  function begin() { snapshot = copyState(current); }

  function dirty() {
    if (!snapshot) return false;
    return JSON.stringify(snapshot) !== JSON.stringify(copyState(current));
  }

  function rollback() {
    if (!snapshot) return;
    current.members = snapshot.members;
    current.knr = snapshot.knr;
    snapshot = null;
    emit('change', { reason: 'rollback' });
  }

  /* Витрины (dealId === null) не сохраняются: демо-состав живёт в памяти. */
  function commit() {
    snapshot = null;
    var dealId = current.dealId;
    var state = copyState(current);
    if (dealId == null) { emit('commit', { dealId: null }); return Promise.resolve(); }
    saved[String(dealId)] = state;
    syncDeal(dealId, state);
    emit('commit', { dealId: dealId });
    return api ? api.put(dealId, state).catch(function (e) {
      if (window.console) console.error('CounterpartiesStore: состав сделки не сохранился', e);
    }) : Promise.resolve();
  }

  function on(type, fn) {
    var rec = { type: type, fn: fn };
    listeners.push(rec);
    return function off() {
      var i = listeners.indexOf(rec);
      if (i !== -1) listeners.splice(i, 1);
    };
  }

  window.CounterpartiesStore = {
    list: function () { return base.slice(); },
    byId: byId,
    ready: ready,
    use: use,
    dealId: function () { return current.dealId; },
    members: members,
    search: search,
    isMember: isMember,
    isKnr: isKnr,
    move: move,
    setKnr: setKnr,
    knr: knr,
    knrNames: knrNames,
    begin: begin,
    rollback: rollback,
    commit: commit,
    dirty: dirty,
    on: on
  };
})();
