/* =========================================================================
   Pipeline Management — демо-данные прототипа («рыба»).
   Обычный <script>, а не JSON: страницы открываются по file://.

   Экспорт: window.PMData = {
     desks     — дески (отделы/команды по отраслям),
     leadStages, dealStages — стадии лидов и сделок pipeline (порядок = порядок колонок),
     people    — сотрудники, из которых собираются команды,
     items     — сделки и лиды: { id, kind: 'deal'|'lead', client, holding, desk,
                 stage, key, star, lead, team[], products[], volume, profit,
                 docs, tasksDone, tasksTotal, created, updated, desc, comments[],
                 meetings[], linked }
   }
   Значения сгенерированы детерминированно (сид), чтобы экран был одинаковым
   при каждом открытии. Коды десков взяты из прототипов в Pixso; расшифровки
   — допущение прототипа (см. «Открытые вопросы» в спеке экрана).
   ========================================================================= */
(function () {
  'use strict';

  var DESKS = [
    { code: 'NRS', name: 'Pipe NRS', title: 'Природные ресурсы' },
    { code: 'TMT', name: 'Pipe TMT', title: 'Телеком, медиа, технологии' },
    { code: 'CNS', name: 'Pipe CNS', title: 'Потребительский сектор' },
    { code: 'IND', name: 'Pipe IND', title: 'Промышленность' },
    { code: 'RE',  name: 'Pipe RE',  title: 'Недвижимость' },
    { code: 'AGR', name: 'Pipe AGR', title: 'Сельское хозяйство' }
  ];

  /* tone — тон маркера колонки Kanban (kbcol--<tone>), пусто = серый */
  var LEAD_STAGES = [
    { key: 'idea',     name: 'Идея',               tone: 'lblue' },
    { key: 'lead-work', name: 'В работе',          tone: 'dpurple' },
    { key: 'handed',   name: 'Передан в Pipeline', tone: 'green' }
  ];
  var DEAL_STAGES = [
    { key: 'todo',       name: 'К отработке',                tone: '' },
    { key: 'mandatory',  name: 'Обязательные сделки',        tone: 'orange' },
    { key: 'routing',    name: 'Маршрутизация',              tone: 'lblue' },
    { key: 'indicative', name: 'Направлен индикатив',        tone: 'dpurple' },
    { key: 'termsheet',  name: 'Направлен Term Sheet',       tone: 'primary' },
    { key: 'uw',         name: 'Направлена в Андеррайтинг',  tone: 'orange' },
    { key: 'kpki',       name: 'Пройден КПКИ / Закрыта',     tone: 'green' }
  ];

  var PEOPLE = [
    { id: 'pkk', short: 'Петров К.К.',    name: 'Петров Кирилл Константинович', ini: 'ПК', role: 'Директор' },
    { id: 'iai', short: 'Иванов А.И.',    name: 'Иванов Александр Иванович',    ini: 'ИА', role: 'VP' },
    { id: 'bvs', short: 'Белова В.С.',    name: 'Белова Виктория Сергеевна',     ini: 'БВ', role: 'Консультант-аналитик' },
    { id: 'ima', short: 'Ильина М.А.',    name: 'Ильина Мария Андреевна',        ini: 'ИМ', role: 'Старший аналитик' },
    { id: 'sro', short: 'Слепцов Р.О.',   name: 'Слепцов Роман Олегович',        ini: 'СР', role: 'Региональный директор' },
    { id: 'kdn', short: 'Кузнецова Д.Н.', name: 'Кузнецова Дарья Николаевна',    ini: 'КД', role: 'Юрист' },
    { id: 'gev', short: 'Громов Е.В.',    name: 'Громов Евгений Витальевич',     ini: 'ГЕ', role: 'Риск-менеджер' },
    { id: 'aps', short: 'Орлов П.С.',     name: 'Орлов Павел Сергеевич',         ini: 'ОП', role: 'VP' }
  ];

  var CLIENTS = [
    ['ООО «Ромашка»', 'ГК Ромашка'], ['ООО «Одуванчик Медиа»', 'ГК Одуванчик'],
    ['АО «Северсталь-Инвест»', 'ГК Северный металл'], ['ПАО «Волга-Телеком»', 'ГК Волга'],
    ['ООО «Гранд-Девелопмент»', 'ГК Гранд'], ['АО «Сибагро»', 'Агрохолдинг Сибирь'],
    ['ООО «Каспий-Порт»', 'ГК Каспий'], ['АО «Промлизинг»', 'ГК Промфинанс'],
    ['ООО «ЮгСтрой»', 'ГК ЮгСтрой'], ['ПАО «Уралсталь»', 'ГК Урал'],
    ['АО «Балтэнерго»', 'ГК Балтика'], ['ООО «Мосэлектро»', 'ГК Мосэлектро'],
    ['АО «Кубань-Зерно»', 'Агрохолдинг Юг'], ['ООО «ТехноСфера»', 'ГК ТехноСфера'],
    ['АО «Северный проект»', 'ГК Северный проект'], ['ООО «Лента-Логистик»', 'ГК Лента'],
    ['ПАО «НефтеХимПром»', 'ГК НХП'], ['ООО «Дата-Центр Урал»', 'ГК Урал'],
    ['АО «Белгород-Мясо»', 'Агрохолдинг Черноземье'], ['ООО «Арктик Газ»', 'ГК Арктика'],
    ['АО «Невский Квартал»', 'ГК Невский'], ['ООО «Фарм-Лайн»', 'ГК Фарм'],
    ['АО «Цифровые решения»', 'ГК Цифра'], ['ООО «Алтай-Молоко»', 'Агрохолдинг Алтай']
  ];

  var PRODUCTS = ['Акционерный мезонин', 'Кредитный мезонин', 'Выкуп доли', 'Опцион',
    'Акционерное финансирование', 'Проектное финансирование', 'Бридж-кредит'];

  var MEETING_TOPICS = ['Первичная встреча с клиентом', 'Обсуждение структуры сделки',
    'Согласование индикативных условий', 'Созвон по Term Sheet', 'Встреча с акционерами'];

  /* детерминированный генератор: mulberry32 */
  var seed = 20260916;
  function rnd() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
  function pick(a) { return a[Math.floor(rnd() * a.length)]; }
  function int(a, b) { return a + Math.floor(rnd() * (b - a + 1)); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function date(dayFrom, dayTo) {
    var d = new Date(2026, 0, 1);
    d.setDate(d.getDate() + int(dayFrom, dayTo));
    return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear();
  }

  /* распределение по стадиям — «воронка»: ранних стадий больше */
  var LEAD_WEIGHTS = [22, 16, 8];
  var DEAL_WEIGHTS = [16, 14, 14, 12, 10, 8, 10];

  var items = [];
  var dealNo = 10412, leadNo = 20107;

  function makeItem(kind, stageKey) {
    var c = pick(CLIENTS);
    var lead = pick(PEOPLE);
    var teamSize = int(1, 5);
    var team = [lead.id];
    while (team.length < teamSize) {
      var p = pick(PEOPLE).id;
      if (team.indexOf(p) < 0) team.push(p);
    }
    var prods = [pick(PRODUCTS)];
    if (rnd() > 0.6) { var p2 = pick(PRODUCTS); if (p2 !== prods[0]) prods.push(p2); }
    var volume = kind === 'lead' ? int(2, 60) * 50 : int(4, 120) * 50;       /* млн RUB */
    var profit = Math.round(volume * (0.012 + rnd() * 0.035) * 10) / 10;     /* млн RUB */
    var tasksTotal = int(2, 8);
    return {
      id: kind === 'lead' ? 'L-' + (leadNo++) : 'D-' + (dealNo++),
      kind: kind,
      client: c[0],
      holding: c[1],
      desk: pick(DESKS).code,
      stage: stageKey,
      key: kind === 'deal' && rnd() > 0.78,
      star: rnd() > 0.75,
      lead: lead.id,
      team: team,
      products: prods,
      volume: volume,
      profit: profit,
      docs: int(0, 9),
      tasksDone: int(0, tasksTotal),
      tasksTotal: tasksTotal,
      created: date(0, 200),
      updated: date(200, 258),
      desc: 'Компания рассматривает привлечение финансирования под программу развития: модернизация производственных мощностей и расширение присутствия в регионах. Банк предлагает структуру с участием в капитале и опционом обратного выкупа.',
      comments: rnd() > 0.4 ? [{ author: 'Слепцов Р.О.', at: '14:00 ' + date(220, 258), text: pick(['Принята в работу', 'Клиент запросил индикатив до конца месяца', 'Ждём финансовую модель от клиента', 'Согласовали состав команды']) }] : [],
      meetings: [
        { at: date(180, 230) + ', 11:00', topic: pick(MEETING_TOPICS), place: 'Офис клиента' },
        { at: date(231, 260) + ', 15:30', topic: pick(MEETING_TOPICS), place: 'Видеоконференция' }
      ],
      linked: kind === 'deal' && rnd() > 0.5 ? 'L-' + int(19800, 20100) : null
    };
  }

  LEAD_STAGES.forEach(function (s, i) {
    for (var n = 0; n < LEAD_WEIGHTS[i]; n++) items.push(makeItem('lead', s.key));
  });
  DEAL_STAGES.forEach(function (s, i) {
    for (var n = 0; n < DEAL_WEIGHTS[i]; n++) items.push(makeItem('deal', s.key));
  });

  window.PMData = {
    desks: DESKS,
    leadStages: LEAD_STAGES,
    dealStages: DEAL_STAGES,
    people: PEOPLE,
    products: PRODUCTS,
    items: items
  };
})();
