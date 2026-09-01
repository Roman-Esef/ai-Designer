/* =========================================================================
   IBP Home — каталог навигации и главной страницы (единый источник истины).
   Данные: группы меню (NavPanel) + тайлы главной страницы (NavTile) + роли.
   Один раздел (item) = и меню-поля, и тайл-поля; item.tile === null — пункт
   меню без тайла (исключение «Поиск клиентов в ЕПК»); tile.links — NavTile
   варианта «со ссылками» («Отчёты для Рисков»).

   Подключается явно (как icons-data.js), НЕ через ds.js:
     <script src="../../scripts/ibp-home.js"></script>
   Потребители: страница NavTile (каталог), демо NavPanel (меню по роли),
   экран главной страницы, страница «Главная страница · роли».

   Экспорт: window.IBPHome = {
     groups (полный каталог), roles, rolesList,
     itemsFor(role) → группы роли, tileHTML(item) → разметка NavTile
   }
   ========================================================================= */
(function () {
  'use strict';

  var GROUPS = [
    { id: 'origination', label: 'Origination', items: [
      { id: 'obligatory-deals', label: 'Обязательные сделки', icon: 'Important-deals' },
      { id: 'possible-deals',   label: 'Возможные сделки',    icon: 'deals-possible-deals' },
      { id: 'potentials-rd',    label: 'Потенциалы РД',       icon: 'potentials-rd' },
      { id: 'obligatory-leads', label: 'Обязательные лиды',   icon: 'important-leads' },
      { id: 'possible-leads',   label: 'Возможные лиды',      icon: 'possible-leads' },
      { id: 'sales-projects',   label: 'Проекты продаж CIB',  icon: 'sales-projects' },
      { id: 'sales-company',    label: 'Кампании продаж',     icon: 'sales-company' },
      { id: 'dcm-potentials',   label: 'Потенциалы DCM',      icon: 'dcm-potentials' },
      { id: 'calculator',       label: 'Калькулятор',         icon: 'calc' },
      { id: 'funds',            label: 'Фонды',               icon: 'funds' }
    ] },
    { id: 'pipeline', label: 'Pipeline', items: [
      { id: 'pipeline',            label: 'Pipeline',             icon: 'pipeline' },
      { id: 'pipeline-ckp',        label: 'Pipeline ЦКП',         icon: 'ckp-pipeline' },
      { id: 'pipeline-mna',        label: 'M&A Pipeline',         icon: 'mna-pipeline' },
      { id: 'pipeline-dcm',        label: 'DCM Pipeline',         icon: 'dcm-pipeline' },
      { id: 'pipeline-ecm',        label: 'ECM Pipeline',         icon: 'ecm-pipeline' },
      { id: 'kpki-calendar',       label: 'Календарь КПКИ',       icon: 'kpki-cal' },
      { id: 'pipeline-dashboards', label: 'Дашборды по Pipeline', icon: 'pmc-dashboard' },
      { id: 'payments-ib',         label: 'Реестр платежей IB',   icon: 'payments-ib' }
    ] },
    { id: 'current-portfolio', label: 'Текущий портфель ДИД', items: [
      { id: 'current-portfolio', label: 'Текущий портфель', icon: 'current-depo',
        tile: { title: 'Текущий портфель', desc: 'Все активные сделки ДИД', illu: 'current-depo' } },
      { id: 'cf-sbi', label: 'CF СБИ', icon: 'cash-flow',
        tile: { title: 'CF СБИ', desc: 'Плановые платежи по сделкам ГК СБИ', illu: 'cash-flow' } },
      { id: 'corporate-requests', label: 'Корпоративные запросы', icon: 'corporate-transactions',
        tile: { title: 'Корпоративные запросы', desc: '', illu: 'corporate-transactions', links: ['Реестр запросов', 'Реестр входящих писем'] } }
    ] },
    { id: 'reports', label: 'Отчёты', items: [
      { id: 'reports-1c', label: 'Отчёты 1C/Navision', icon: 'reports-1-c',
        tile: { title: 'Отчёты 1C/Navision', desc: '', illu: 'reports-1-c', links: ['Доходы/Расходы сделок СБИ', 'Резервы', 'Сверка с данными 1С'] } },
      { id: 'statements-registry', label: 'Реестр выписок', icon: 'registry',
        tile: { title: 'Реестр выписок', desc: 'Обработка фактических платежей по сделкам ДИД', illu: 'registry' } },
      { id: 'reserve-calculation', label: 'Расчет резерва', icon: 'reserve',
        tile: { title: 'Расчет резерва', desc: 'Реестр расчетов резерва', illu: 'reserve' } },
      { id: 'fv-calculation', label: 'Расчет FV', icon: 'calclate-fv',
        tile: { title: 'Расчет FV', desc: 'Расчет справедливой стоимости', illu: 'calclate-fv' } },
      { id: 'reports-for-risks', label: 'Отчёты для Рисков', icon: 'rwa',
        tile: { title: 'Отчёты для Рисков', desc: '', illu: 'rwa', links: ['Коды RWA', 'Расчет RWA', 'Расчет ОВП'] } }
    ] },
    { id: 'clients-tasks', label: 'Клиенты и задачи', items: [
      { id: 'clients', label: 'Клиенты', icon: 'factory-01',
        tile: { title: 'Клиенты', desc: 'Работа с моими клиентами', illu: 'clients' } },
      /* исключение: пункт меню без тайла на главной */
      { id: 'client-search-epk', label: 'Поиск клиентов в ЕПК', icon: 'client-search', tile: null },
      { id: 'tasks', label: 'Задачи', icon: 'tasks', badge: 7,
        tile: { title: 'Задачи', desc: 'Все задачи моего деска', illu: 'tasks' } }
    ] },
    { id: 'admin', label: 'Администрирование', items: [
      { id: 'admin', label: 'Администрирование', icon: 'admin-panel-settings',
        tile: { title: 'Администрирование', desc: 'Справочники и другая информация', illu: 'settings' } },
      /* в мастер-каталоге есть, но в роль «Финансист ДИД» не входит (partial) */
      { id: 'admin-ckp', label: 'Администратор ЦКП', icon: 'admin-ckp' }
    ] }
  ];

  /* Роль → состав групп: 'full' (все пункты) или список id пунктов (частичная).
     Пункт с tile:null («Поиск клиентов в ЕПК») есть в меню, но не в тайлах. */
  var ROLES = {
    'Финансист ДИД': {
      groups: {
        'current-portfolio': 'full',
        'reports': 'full',
        'clients-tasks': 'full',
        'admin': ['admin']
      }
    }
  };
  var DEFAULT_ROLE = 'Финансист ДИД';

  function groupById(id) {
    for (var i = 0; i < GROUPS.length; i++) if (GROUPS[i].id === id) return GROUPS[i];
    return null;
  }

  /* группы, доступные роли (порядок — по объявлению роли); частичная группа —
     копия с отфильтрованными пунктами */
  function itemsFor(role) {
    var r = ROLES[role] || ROLES[DEFAULT_ROLE];
    if (!r) return [];
    return Object.keys(r.groups).map(function (gid) {
      var g = groupById(gid);
      if (!g) return null;
      var spec = r.groups[gid];
      if (spec === 'full') return g;
      return { id: g.id, label: g.label, items: g.items.filter(function (it) { return spec.indexOf(it.id) >= 0; }) };
    }).filter(Boolean);
  }

  /* разметка NavTile по данным item.tile (варианты: обычный <a> / «со ссылками» div) */
  function tileHTML(item) {
    var t = item && item.tile;
    if (!t) return '';
    var illu = '<span class="illu ntile__illu" data-illu="' + t.illu + '" aria-hidden="true"></span>';
    var desc = t.desc ? '<p class="ntile__desc">' + t.desc + '</p>' : '';
    if (t.links && t.links.length) {
      var links = '<nav class="ntile__links" aria-label="Подразделы">' + t.links.map(function (l) {
        return '<a class="link link--accent link--m" href="#">' + l + '</a>';
      }).join('') + '</nav>';
      return '<div class="ntile">' + illu
        + '<a class="ntile__title-link" href="#"><h3 class="ntile__title">' + t.title + '</h3></a>'
        + desc + links + '</div>';
    }
    return '<a class="ntile" href="#">' + illu
      + '<h3 class="ntile__title">' + t.title + '</h3>' + desc + '</a>';
  }

  function rolesList() {
    return Object.keys(ROLES);
  }

  window.IBPHome = {
    groups: GROUPS,
    roles: ROLES,
    rolesList: rolesList,
    defaultRole: DEFAULT_ROLE,
    itemsFor: itemsFor,
    tileHTML: tileHTML
  };
})();
