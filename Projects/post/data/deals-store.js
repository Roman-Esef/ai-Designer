/* =========================================================================
   DealsStore — единственная точка доступа к базе сделок ДИД (мок).
   Источник — window.MOCK_DEALS (mock-deals.js), подключить ДО этого файла.

   Экспорт: window.DealsStore = {
     list() → запись[]                    — копия текущего состава (снимок)
     byId(id) → запись|null
     exists({ id, name }) → boolean       — уникальность номера/наименования,
                                             сверка регистронезависимая и по
                                             обрезанным пробелам
     create(partial) → запись             — новая сделка (см. ниже)
     update(id, patch) → запись|null
     on(type, fn) → off()                 — подписка на 'change'
   }

   Общий слой для таблицы портфеля и будущей страницы сделки: правила
   валидации и уникальности живут в одном месте, экраны остаются тонкими.
   Состояние — только в памяти вкладки: перезагрузка страницы возвращает
   исходные 50 записей (см. открытый вопрос №2 плана 05.09.2026).
   ========================================================================= */
(function () {
  'use strict';

  var deals = (window.MOCK_DEALS || []).slice();
  var listeners = [];

  function emit(type, detail) {
    listeners.forEach(function (l) { if (l.type === type) l.fn(detail); });
  }

  function norm(s) { return String(s == null ? '' : s).trim().toLowerCase(); }

  function byId(id) {
    var key = String(id);
    for (var i = 0; i < deals.length; i++) if (String(deals[i].id) === key) return deals[i];
    return null;
  }

  function exists(query) {
    query = query || {};
    if (query.id != null && String(query.id) !== '') {
      if (byId(query.id)) return true;
    }
    if (query.name != null && String(query.name) !== '') {
      var n = norm(query.name);
      for (var i = 0; i < deals.length; i++) if (norm(deals[i].name) === n) return true;
    }
    return false;
  }

  /* Новая сделка: только номер, наименование и статус (Черновик по правилу
     ТЗ — «все новые сделки создаются с этим статусом») — остальные поля
     заполняются позже, на странице сделки. */
  function create(partial) {
    var deal = Object.assign({
      status: 'Черновик', statusTsup: 'Черновик', statusOps: 'Черновик', statusMon: 'На утверждении',
      restricted: 'Нет',
      desk: '', director: '', manager: '', tsupEmployee: '',
      knr: [], gsz: '',
      jointness: '', collateral: '', corpGovernance: [], boardRep: '', finTpl: '',
      signDate: '', firstDisb: '', endDate: '', repayDate: '',
      monEntity: '',
      mainProductDid: '', productsDidNames: [], productsNames: [],
      balances: [], currencies: [], isPE: false,
    }, partial);
    deals.unshift(deal);
    emit('change', { type: 'create', deal: deal });
    return deal;
  }

  function update(id, patch) {
    var deal = byId(id);
    if (!deal) return null;
    Object.assign(deal, patch);
    emit('change', { type: 'update', id: id, patch: patch, deal: deal });
    return deal;
  }

  function on(type, fn) {
    var entry = { type: type, fn: fn };
    listeners.push(entry);
    return function off() {
      var idx = listeners.indexOf(entry);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  }

  window.DealsStore = {
    list: function () { return deals.slice(); },
    byId: byId,
    exists: exists,
    create: create,
    update: update,
    on: on,
  };
})();
