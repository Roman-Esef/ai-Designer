/* =========================================================================
   Мок-данные ДИД — реестр сделок (window.MOCK_DEALS) и перечни (window.DEALS_ENUMS).

   Литеральный массив: сгенерирован один раз детерминированным скриптом
   (не входит в репозиторий), правится здесь вручную. 50 сделок — рендер
   таблицы «Текущий портфель ДИД», модалка фильтра, будущая страница сделки.

   Плоские поля этой записи (balances/currencies/isPE/mainProductDid/
   productsDidNames/productsNames) вычислены из дерева продуктов сделки
   (window.MOCK_DEAL_TREES, файл mock-deal-trees.js) в момент генерации и
   заморожены здесь — в проде их считает бэкенд, реестр их не пересчитывает.

   Формат дат — ДД.ММ.ГГГГ, пустая строка → в таблице отображается как «—».
   Статус = произвольная строка (UI-агностично); тон-маппинг — на экране,
   см. Portfolio.screen.md §7.

   Допущения по форматам (нет однозначного ответа в ТЗ): jointness — строка
   из справочника (см. DEALS_ENUMS.jointness); corpGovernance — список строк;
   boardRep — Да/Нет.
   ========================================================================= */

window.MOCK_DEALS = [
  {
    "id": 1024,
    "name": "Финансирование строительства логистического хаба",
    "status": "Активная",
    "statusTsup": "Утверждена",
    "statusOps": "На сопровождении",
    "statusMon": "На мониторинге ГК СБИ",
    "restricted": "Нет",
    "desk": "Недвижимость",
    "director": "Иванов И.И.",
    "manager": "Павлов П.П.",
    "tsupEmployee": "Комаров К.К.",
    "knr": [
      "ООО «ЮгСтрой»"
    ],
    "gsz": "Группа «СтройИнвест»",
    "jointness": "Совместная",
    "collateral": "Да",
    "corpGovernance": [
      "Наблюдательный совет"
    ],
    "boardRep": "Да",
    "finTpl": "Да",
    "signDate": "01.01.2021",
    "firstDisb": "21.01.2021",
    "endDate": "01.01.2023",
    "repayDate": "",
    "monEntity": "ГК СБИ",
    "mainProductDid": "Акционерный мезонин",
    "productsDidNames": [
      "Акционерный мезонин"
    ],
    "productsNames": [
      "Кредитная линия"
    ],
    "balances": [
      "ООО «СБИ»"
    ],
    "currencies": [
      "RUB"
    ],
    "isPE": false
  },
  {
    "id": 1025,
    "name": "Приобретение сети АЗС",
    "status": "Ожидает подтверждения",
    "statusTsup": "Ожидает подтверждения",
    "statusOps": "Ожидает подтверждения",
    "statusMon": "На утверждении",
    "restricted": "Нет",
    "desk": "Телекоммуникации",
    "director": "Петров П.П.",
    "manager": "Медведев М.М.",
    "tsupEmployee": "Щукин Щ.Щ.",
    "knr": [
      "АО «НефтьСервис»"
    ],
    "gsz": "Группа «СвязьКапитал»",
    "jointness": "Не совместная",
    "collateral": "Нет",
    "corpGovernance": [],
    "boardRep": "Нет",
    "finTpl": "Нет",
    "signDate": "07.02.2021",
    "firstDisb": "28.02.2021",
    "endDate": "07.03.2023",
    "repayDate": "",
    "monEntity": "ПАО Сбербанк",
    "mainProductDid": "Кредитный мезонин",
    "productsDidNames": [
      "Кредитный мезонин",
      "Корпоративный контроль"
    ],
    "productsNames": [
      "Опцион",
      "Привилегированные акции",
      "Акции"
    ],
    "balances": [
      "SBERFIN",
      "ЮГ ИНВЕСТ"
    ],
    "currencies": [
      "USD",
      "EUR"
    ],
    "isPE": true
  },
  {
    "id": 1026,
    "name": "Рефинансирование кредитного портфеля",
    "status": "Черновик",
    "statusTsup": "Черновик",
    "statusOps": "Черновик",
    "statusMon": "На утверждении",
    "restricted": "Нет",
    "desk": "Розничная торговля",
    "director": "Сидоров С.С.",
    "manager": "Егоров Е.Е.",
    "tsupEmployee": "Воробьёв В.В.",
    "knr": [
      "ПАО «ТелекомИнвест»"
    ],
    "gsz": "Группа «УралРесурс»",
    "jointness": "Совместная",
    "collateral": "Да",
    "corpGovernance": [],
    "boardRep": "Нет",
    "finTpl": "Да",
    "signDate": "",
    "firstDisb": "",
    "endDate": "",
    "repayDate": "",
    "monEntity": "ГК СБИ",
    "mainProductDid": "Корпоративный контроль",
    "productsDidNames": [
      "Корпоративный контроль",
      "Долевое участие в капитале",
      "Венчурное финансирование"
    ],
    "productsNames": [
      "Акции",
      "Обыкновенные акции",
      "Конвертируемый заём",
      "Привилегированные акции"
    ],
    "balances": [
      "СОКОЛ ФИНАНС",
      "ТрансКапитал"
    ],
    "currencies": [
      "EUR",
      "JPY"
    ],
    "isPE": false
  },
  {
    "id": 1027,
    "name": "Развитие горнорудного месторождения",
    "status": "Корректировка",
    "statusTsup": "Корректировка",
    "statusOps": "Корректировка",
    "statusMon": "На утверждении",
    "restricted": "Да",
    "desk": "Природные ресурсы",
    "director": "Кузнецов К.К.",
    "manager": "Фролов Ф.Ф.",
    "tsupEmployee": "Лебедев Л.Л.",
    "knr": [
      "ООО «ГорноКапитал»"
    ],
    "gsz": "Группа «ГорСтрой»",
    "jointness": "Не совместная",
    "collateral": "Нет",
    "corpGovernance": [
      "Комитет по рискам"
    ],
    "boardRep": "Да",
    "finTpl": "Нет",
    "signDate": "22.04.2021",
    "firstDisb": "15.05.2021",
    "endDate": "22.07.2023",
    "repayDate": "",
    "monEntity": "ПАО Сбербанк",
    "mainProductDid": "Долевое участие в капитале",
    "productsDidNames": [
      "Долевое участие в капитале"
    ],
    "productsNames": [
      "Обыкновенные акции",
      "Конвертируемый заём"
    ],
    "balances": [
      "VPE CAPITAL",
      "ПромФинанс"
    ],
    "currencies": [
      "JPY",
      "RUB"
    ],
    "isPE": false
  },
  {
    "id": 1028,
    "name": "Кредитование застройщика жилого квартала",
    "status": "Ввод изменений",
    "statusTsup": "Ввод изменений",
    "statusOps": "Ввод изменений",
    "statusMon": "На мониторинге ГК СБИ",
    "restricted": "Нет",
    "desk": "Металлургия",
    "director": "Смирнов С.С.",
    "manager": "Гусев Г.Г.",
    "tsupEmployee": "Николаев Н.Н.",
    "knr": [
      "ООО «ЖилСтрой»"
    ],
    "gsz": "",
    "jointness": "Совместная",
    "collateral": "Да",
    "corpGovernance": [],
    "boardRep": "Нет",
    "finTpl": "Да",
    "signDate": "29.05.2021",
    "firstDisb": "22.06.2021",
    "endDate": "29.09.2023",
    "repayDate": "",
    "monEntity": "ГК СБИ",
    "mainProductDid": "Венчурное финансирование",
    "productsDidNames": [
      "Венчурное финансирование",
      "Акционерный мезонин"
    ],
    "productsNames": [
      "Привилегированные акции",
      "Заём",
      "Гарантия"
    ],
    "balances": [
      "ЮГ ИНВЕСТ",
      "АгроБаланс"
    ],
    "currencies": [
      "RUB",
      "USD"
    ],
    "isPE": false
  },
  {
    "id": 1029,
    "name": "Расширение сети продовольственного ритейла",
    "status": "Подтверждение изменений",
    "statusTsup": "Подтверждение изменений",
    "statusOps": "Подтверждение изменений",
    "statusMon": "Изменения ожидают передачи на мониторинг",
    "restricted": "Нет",
    "desk": "Энергетика",
    "director": "Соколов С.С.",
    "manager": "Титов Т.Т.",
    "tsupEmployee": "Крылов К.К.",
    "knr": [
      "ООО «ПродуктТрейд»"
    ],
    "gsz": "Группа «МедИнвест»",
    "jointness": "Не совместная",
    "collateral": "Нет",
    "corpGovernance": [],
    "boardRep": "Нет",
    "finTpl": "Нет",
    "signDate": "05.07.2021",
    "firstDisb": "30.07.2021",
    "endDate": "05.12.2023",
    "repayDate": "",
    "monEntity": "ПАО Сбербанк",
    "mainProductDid": "Акционерный мезонин",
    "productsDidNames": [
      "Акционерный мезонин"
    ],
    "productsNames": [
      "Кредитная линия"
    ],
    "balances": [
      "ООО «СБИ»",
      "SBERFIN",
      "СОКОЛ ФИНАНС",
      "VPE CAPITAL"
    ],
    "currencies": [
      "RUB",
      "USD",
      "EUR",
      "JPY"
    ],
    "isPE": false
  },
  {
    "id": 1030,
    "name": "Строительство дата-центра",
    "status": "Погашена",
    "statusTsup": "Погашена",
    "statusOps": "Погашена",
    "statusMon": "Погашена",
    "restricted": "Нет",
    "desk": "Агропромышленный комплекс",
    "director": "Орлов О.О.",
    "manager": "Кузьмин К.К.",
    "tsupEmployee": "Волков В.В.",
    "knr": [
      "АО «ДатаХаб»"
    ],
    "gsz": "Группа «АгроСоюз»",
    "jointness": "Совместная",
    "collateral": "Да",
    "corpGovernance": [
      "Совет директоров"
    ],
    "boardRep": "Да",
    "finTpl": "Да",
    "signDate": "11.08.2021",
    "firstDisb": "06.09.2021",
    "endDate": "11.02.2024",
    "repayDate": "11.02.2023",
    "monEntity": "ГК СБИ",
    "mainProductDid": "Кредитный мезонин",
    "productsDidNames": [
      "Кредитный мезонин"
    ],
    "productsNames": [
      "Конвертируемый заём"
    ],
    "balances": [
      "ПромФинанс"
    ],
    "currencies": [
      "EUR"
    ],
    "isPE": false
  },
  {
    "id": 1031,
    "name": "Инвестиции в фармацевтическое производство",
    "status": "Корректировка изменений",
    "statusTsup": "Корректировка изменений",
    "statusOps": "Корректировка изменений",
    "statusMon": "На мониторинге ПАО Сбербанк",
    "restricted": "Нет",
    "desk": "Транспорт и логистика",
    "director": "Павлов П.П.",
    "manager": "Баранов Б.Б.",
    "tsupEmployee": "Зайцев З.З.",
    "knr": [
      "ООО «ФармаПлюс»",
      "ООО «СтройГрупп»",
      "ООО «НефтеХимСервис»",
      "ООО «РечПорт»"
    ],
    "gsz": "Группа «МеталлСоюз»",
    "jointness": "Не совместная",
    "collateral": "Нет",
    "corpGovernance": [],
    "boardRep": "Нет",
    "finTpl": "Нет",
    "signDate": "17.09.2021",
    "firstDisb": "14.10.2021",
    "endDate": "17.04.2024",
    "repayDate": "",
    "monEntity": "ПАО Сбербанк",
    "mainProductDid": "Корпоративный контроль",
    "productsDidNames": [
      "Корпоративный контроль",
      "Долевое участие в капитале"
    ],
    "productsNames": [
      "Доли в уставном капитале",
      "Кредитная линия",
      "Гарантия"
    ],
    "balances": [
      "АгроБаланс",
      "СОКОЛ ФИНАНС"
    ],
    "currencies": [
      "JPY",
      "RUB"
    ],
    "isPE": false
  },
  {
    "id": 1032,
    "name": "Модернизация теплоэлектростанции",
    "status": "Ожидает подтверждения",
    "statusTsup": "Ожидает назначения ответственного",
    "statusOps": "Ожидает подтверждения",
    "statusMon": "На утверждении",
    "restricted": "Нет",
    "desk": "Недвижимость",
    "director": "Медведев М.М.",
    "manager": "Комаров К.К.",
    "tsupEmployee": "Морозов М.М.",
    "knr": [
      "ООО «АгроХолдинг»"
    ],
    "gsz": "Группа «ЭнергоАльянс»",
    "jointness": "Совместная",
    "collateral": "Да",
    "corpGovernance": [],
    "boardRep": "Нет",
    "finTpl": "Да",
    "signDate": "24.10.2021",
    "firstDisb": "21.11.2021",
    "endDate": "24.06.2024",
    "repayDate": "",
    "monEntity": "ГК СБИ",
    "mainProductDid": "Долевое участие в капитале",
    "productsDidNames": [
      "Долевое участие в капитале",
      "Венчурное финансирование",
      "Акционерный мезонин"
    ],
    "productsNames": [
      "Гарантия",
      "Овердрафт",
      "Акции",
      "Кредитная линия"
    ],
    "balances": [
      "ООО «СБИ»",
      "VPE CAPITAL"
    ],
    "currencies": [
      "RUB",
      "USD"
    ],
    "isPE": true
  },
  {
    "id": 1033,
    "name": "Приобретение доли в морском порту",
    "status": "Активная",
    "statusTsup": "Утверждена",
    "statusOps": "На сопровождении",
    "statusMon": "На мониторинге ПАО Сбербанк",
    "restricted": "Нет",
    "desk": "Телекоммуникации",
    "director": "Егоров Е.Е.",
    "manager": "Щукин Щ.Щ.",
    "tsupEmployee": "Захаров З.З.",
    "knr": [
      "АО «МеталлИнвест»"
    ],
    "gsz": "",
    "jointness": "Не совместная",
    "collateral": "Нет",
    "corpGovernance": [
      "Правление"
    ],
    "boardRep": "Да",
    "finTpl": "Нет",
    "signDate": "30.11.2021",
    "firstDisb": "29.12.2021",
    "endDate": "30.08.2024",
    "repayDate": "",
    "monEntity": "ПАО Сбербанк",
    "mainProductDid": "Венчурное финансирование",
    "productsDidNames": [
      "Венчурное финансирование"
    ],
    "productsNames": [
      "Овердрафт",
      "Акции"
    ],
    "balances": [
      "SBERFIN",
      "ЮГ ИНВЕСТ"
    ],
    "currencies": [
      "USD",
      "EUR"
    ],
    "isPE": false
  },
  {
    "id": 1034,
    "name": "Финансирование строительства мультимодального транспортно-логистического комплекса с элементами индустриального парка на территории особой экономической зоны",
    "status": "Ожидает подтверждения",
    "statusTsup": "Ожидает подтверждения",
    "statusOps": "Ожидает подтверждения",
    "statusMon": "На утверждении",
    "restricted": "Нет",
    "desk": "Розничная торговля",
    "director": "Фролов Ф.Ф.",
    "manager": "Воробьёв В.В.",
    "tsupEmployee": "Козлов К.К.",
    "knr": [
      "ООО «ЭнергоСтрой»"
    ],
    "gsz": "Группа «СтройИнвест»",
    "jointness": "Совместная",
    "collateral": "Да",
    "corpGovernance": [],
    "boardRep": "Нет",
    "finTpl": "Да",
    "signDate": "06.01.2022",
    "firstDisb": "26.01.2022",
    "endDate": "06.11.2024",
    "repayDate": "",
    "monEntity": "ГК СБИ",
    "mainProductDid": "Акционерный мезонин",
    "productsDidNames": [
      "Акционерный мезонин",
      "Кредитный мезонин"
    ],
    "productsNames": [
      "Кредитная линия",
      "Опцион",
      "Привилегированные акции"
    ],
    "balances": [
      "СОКОЛ ФИНАНС",
      "ТрансКапитал"
    ],
    "currencies": [
      "EUR",
      "JPY"
    ],
    "isPE": false
  },
  {
    "id": 1035,
    "name": "Реконструкция аэропортового комплекса",
    "status": "Черновик",
    "statusTsup": "Черновик",
    "statusOps": "Черновик",
    "statusMon": "На утверждении",
    "restricted": "Нет",
    "desk": "Природные ресурсы",
    "director": "Гусев Г.Г.",
    "manager": "Лебедев Л.Л.",
    "tsupEmployee": "Степанов С.С.",
    "knr": [
      "ПАО «ТрансЛогистик»"
    ],
    "gsz": "Группа «СвязьКапитал»",
    "jointness": "Не совместная",
    "collateral": "Нет",
    "corpGovernance": [],
    "boardRep": "Нет",
    "finTpl": "Нет",
    "signDate": "",
    "firstDisb": "",
    "endDate": "",
    "repayDate": "",
    "monEntity": "ПАО Сбербанк",
    "mainProductDid": "Кредитный мезонин",
    "productsDidNames": [
      "Кредитный мезонин",
      "Корпоративный контроль",
      "Долевое участие в капитале"
    ],
    "productsNames": [
      "Опцион",
      "Привилегированные акции",
      "Акции",
      "Обыкновенные акции",
      "Конвертируемый заём"
    ],
    "balances": [
      "VPE CAPITAL",
      "ПромФинанс"
    ],
    "currencies": [
      "JPY",
      "RUB"
    ],
    "isPE": false
  },
  {
    "id": 1036,
    "name": "Кредитование зернового терминала",
    "status": "Корректировка",
    "statusTsup": "Корректировка",
    "statusOps": "Корректировка",
    "statusMon": "На утверждении",
    "restricted": "Нет",
    "desk": "Металлургия",
    "director": "Титов Т.Т.",
    "manager": "Николаев Н.Н.",
    "tsupEmployee": "Яковлев Я.Я.",
    "knr": [
      "ООО «СтройГрупп»"
    ],
    "gsz": "Группа «УралРесурс»",
    "jointness": "Совместная",
    "collateral": "Да",
    "corpGovernance": [
      "Наблюдательный совет"
    ],
    "boardRep": "Да",
    "finTpl": "Да",
    "signDate": "21.03.2022",
    "firstDisb": "12.04.2022",
    "endDate": "21.03.2025",
    "repayDate": "",
    "monEntity": "ГК СБИ",
    "mainProductDid": "Корпоративный контроль",
    "productsDidNames": [
      "Корпоративный контроль"
    ],
    "productsNames": [
      "Опцион"
    ],
    "balances": [
      "ООО «СБИ»",
      "SBERFIN",
      "СОКОЛ ФИНАНС",
      "VPE CAPITAL",
      "ЮГ ИНВЕСТ",
      "ТрансКапитал"
    ],
    "currencies": [
      "RUB",
      "USD",
      "EUR",
      "JPY"
    ],
    "isPE": false
  },
  {
    "id": 1037,
    "name": "Финансирование автопарка логистического оператора",
    "status": "Ввод изменений",
    "statusTsup": "Ввод изменений",
    "statusOps": "Ввод изменений",
    "statusMon": "На мониторинге ПАО Сбербанк",
    "restricted": "Нет",
    "desk": "Энергетика",
    "director": "Кузьмин К.К.",
    "manager": "Крылов К.К.",
    "tsupEmployee": "Соловьёв С.С.",
    "knr": [
      "АО «ХимПром»"
    ],
    "gsz": "Группа «ГорСтрой»",
    "jointness": "Не совместная",
    "collateral": "Нет",
    "corpGovernance": [],
    "boardRep": "Нет",
    "finTpl": "Нет",
    "signDate": "27.04.2022",
    "firstDisb": "20.05.2022",
    "endDate": "27.05.2025",
    "repayDate": "",
    "monEntity": "ПАО Сбербанк",
    "mainProductDid": "Долевое участие в капитале",
    "productsDidNames": [
      "Долевое участие в капитале",
      "Венчурное финансирование"
    ],
    "productsNames": [
      "Обыкновенные акции",
      "Конвертируемый заём",
      "Привилегированные акции"
    ],
    "balances": [
      "ТрансКапитал",
      "ООО «СБИ»"
    ],
    "currencies": [
      "USD",
      "EUR"
    ],
    "isPE": false
  },
  {
    "id": 1038,
    "name": "Приобретение производственной линии",
    "status": "Подтверждение изменений",
    "statusTsup": "Подтверждение изменений",
    "statusOps": "Подтверждение изменений",
    "statusMon": "Изменения направлены на передачу",
    "restricted": "Нет",
    "desk": "Агропромышленный комплекс",
    "director": "Баранов Б.Б.",
    "manager": "Волков В.В.",
    "tsupEmployee": "Борисов Б.Б.",
    "knr": [
      "ООО «ЛесПром»"
    ],
    "gsz": "",
    "jointness": "Совместная",
    "collateral": "Да",
    "corpGovernance": [],
    "boardRep": "Нет",
    "finTpl": "Да",
    "signDate": "03.06.2022",
    "firstDisb": "27.06.2022",
    "endDate": "03.08.2025",
    "repayDate": "",
    "monEntity": "ГК СБИ",
    "mainProductDid": "Венчурное финансирование",
    "productsDidNames": [
      "Венчурное финансирование",
      "Акционерный мезонин",
      "Кредитный мезонин"
    ],
    "productsNames": [
      "Привилегированные акции",
      "Заём",
      "Гарантия",
      "Конвертируемый заём"
    ],
    "balances": [
      "ПромФинанс",
      "SBERFIN"
    ],
    "currencies": [
      "EUR",
      "JPY"
    ],
    "isPE": false
  },
  {
    "id": 1039,
    "name": "Строительство ветропарка",
    "status": "Погашена",
    "statusTsup": "Погашена",
    "statusOps": "Погашена",
    "statusMon": "Погашена",
    "restricted": "Нет",
    "desk": "Транспорт и логистика",
    "director": "Комаров К.К.",
    "manager": "Зайцев З.З.",
    "tsupEmployee": "Виноградов В.В.",
    "knr": [
      "АО «ПортИнвест»"
    ],
    "gsz": "Группа «МедИнвест»",
    "jointness": "Не совместная",
    "collateral": "Нет",
    "corpGovernance": [
      "Комитет по рискам"
    ],
    "boardRep": "Да",
    "finTpl": "Нет",
    "signDate": "10.07.2022",
    "firstDisb": "04.08.2022",
    "endDate": "10.10.2025",
    "repayDate": "10.10.2024",
    "monEntity": "ПАО Сбербанк",
    "mainProductDid": "Акционерный мезонин",
    "productsDidNames": [
      "Акционерный мезонин"
    ],
    "productsNames": [
      "Заём",
      "Гарантия"
    ],
    "balances": [
      "АгроБаланс",
      "СОКОЛ ФИНАНС"
    ],
    "currencies": [
      "JPY",
      "RUB"
    ],
    "isPE": false
  },
  {
    "id": 1040,
    "name": "Финансирование М&A в металлургии",
    "status": "Корректировка изменений",
    "statusTsup": "Корректировка изменений",
    "statusOps": "Корректировка изменений",
    "statusMon": "На мониторинге ГК СБИ",
    "restricted": "Нет",
    "desk": "Недвижимость",
    "director": "Щукин Щ.Щ.",
    "manager": "Морозов М.М.",
    "tsupEmployee": "Белов Б.Б.",
    "knr": [
      "ООО «МорТранс»"
    ],
    "gsz": "Группа «АгроСоюз»",
    "jointness": "Совместная",
    "collateral": "Да",
    "corpGovernance": [],
    "boardRep": "Нет",
    "finTpl": "Да",
    "signDate": "16.08.2022",
    "firstDisb": "11.09.2022",
    "endDate": "16.12.2025",
    "repayDate": "",
    "monEntity": "ГК СБИ",
    "mainProductDid": "Кредитный мезонин",
    "productsDidNames": [
      "Кредитный мезонин",
      "Корпоративный контроль"
    ],
    "productsNames": [
      "Конвертируемый заём",
      "Доли в уставном капитале",
      "Кредитная линия"
    ],
    "balances": [
      "ООО «СБИ»",
      "VPE CAPITAL"
    ],
    "currencies": [
      "RUB",
      "USD"
    ],
    "isPE": false
  },
  {
    "id": 1041,
    "name": "Рефинансирование облигационного займа",
    "status": "Ожидает подтверждения",
    "statusTsup": "Ожидает назначения ответственного",
    "statusOps": "Ожидает подтверждения",
    "statusMon": "На утверждении",
    "restricted": "Да",
    "desk": "Телекоммуникации",
    "director": "Воробьёв В.В.",
    "manager": "Захаров З.З.",
    "tsupEmployee": "Иванов И.И.",
    "knr": [
      "ПАО «СтальГрупп»"
    ],
    "gsz": "Группа «МеталлСоюз»",
    "jointness": "Не совместная",
    "collateral": "Нет",
    "corpGovernance": [],
    "boardRep": "Нет",
    "finTpl": "Нет",
    "signDate": "22.09.2022",
    "firstDisb": "19.10.2022",
    "endDate": "22.02.2026",
    "repayDate": "",
    "monEntity": "ПАО Сбербанк",
    "mainProductDid": "Корпоративный контроль",
    "productsDidNames": [
      "Корпоративный контроль",
      "Долевое участие в капитале",
      "Венчурное финансирование"
    ],
    "productsNames": [
      "Доли в уставном капитале",
      "Кредитная линия",
      "Гарантия",
      "Овердрафт",
      "Акции"
    ],
    "balances": [
      "SBERFIN",
      "ЮГ ИНВЕСТ"
    ],
    "currencies": [
      "USD",
      "EUR"
    ],
    "isPE": false
  },
  {
    "id": 1042,
    "name": "Развитие сети складских комплексов",
    "status": "Активная",
    "statusTsup": "Утверждена",
    "statusOps": "На сопровождении",
    "statusMon": "На мониторинге ГК СБИ",
    "restricted": "Нет",
    "desk": "Розничная торговля",
    "director": "Лебедев Л.Л.",
    "manager": "Козлов К.К.",
    "tsupEmployee": "Петров П.П.",
    "knr": [
      "ООО «НефтеХимСервис»"
    ],
    "gsz": "Группа «ЭнергоАльянс»",
    "jointness": "Совместная",
    "collateral": "Да",
    "corpGovernance": [
      "Совет директоров"
    ],
    "boardRep": "Да",
    "finTpl": "Да",
    "signDate": "29.10.2022",
    "firstDisb": "26.11.2022",
    "endDate": "29.04.2026",
    "repayDate": "",
    "monEntity": "ГК СБИ",
    "mainProductDid": "Долевое участие в капитале",
    "productsDidNames": [
      "Долевое участие в капитале"
    ],
    "productsNames": [
      "Гарантия"
    ],
    "balances": [
      "СОКОЛ ФИНАНС"
    ],
    "currencies": [
      "EUR"
    ],
    "isPE": false
  },
  {
    "id": 1043,
    "name": "Кредитование агрохолдинга под урожай",
    "status": "Ожидает подтверждения",
    "statusTsup": "Ожидает подтверждения",
    "statusOps": "Ожидает подтверждения",
    "statusMon": "На утверждении",
    "restricted": "Нет",
    "desk": "Природные ресурсы",
    "director": "Николаев Н.Н.",
    "manager": "Степанов С.С.",
    "tsupEmployee": "Сидоров С.С.",
    "knr": [
      "АО «ГидроЭнерго»"
    ],
    "gsz": "",
    "jointness": "Не совместная",
    "collateral": "Нет",
    "corpGovernance": [],
    "boardRep": "Нет",
    "finTpl": "Нет",
    "signDate": "05.12.2022",
    "firstDisb": "03.01.2023",
    "endDate": "05.07.2026",
    "repayDate": "",
    "monEntity": "ПАО Сбербанк",
    "mainProductDid": "Венчурное финансирование",
    "productsDidNames": [
      "Венчурное финансирование",
      "Акционерный мезонин"
    ],
    "productsNames": [
      "Овердрафт",
      "Акции",
      "Кредитная линия"
    ],
    "balances": [
      "VPE CAPITAL",
      "ПромФинанс"
    ],
    "currencies": [
      "JPY",
      "RUB"
    ],
    "isPE": false
  },
  {
    "id": 1044,
    "name": "Финансирование запуска нового завода",
    "status": "Черновик",
    "statusTsup": "Черновик",
    "statusOps": "Черновик",
    "statusMon": "На утверждении",
    "restricted": "Нет",
    "desk": "Металлургия",
    "director": "Крылов К.К.",
    "manager": "Яковлев Я.Я.",
    "tsupEmployee": "Кузнецов К.К.",
    "knr": [
      "ООО «ЗерноТрейд»"
    ],
    "gsz": "Группа «СтройИнвест»",
    "jointness": "Совместная",
    "collateral": "Да",
    "corpGovernance": [],
    "boardRep": "Нет",
    "finTpl": "Да",
    "signDate": "",
    "firstDisb": "",
    "endDate": "",
    "repayDate": "",
    "monEntity": "ГК СБИ",
    "mainProductDid": "Акционерный мезонин",
    "productsDidNames": [
      "Акционерный мезонин",
      "Кредитный мезонин",
      "Корпоративный контроль"
    ],
    "productsNames": [
      "Кредитная линия",
      "Опцион",
      "Привилегированные акции",
      "Акции"
    ],
    "balances": [
      "ЮГ ИНВЕСТ",
      "АгроБаланс"
    ],
    "currencies": [
      "RUB",
      "USD"
    ],
    "isPE": false
  },
  {
    "id": 1045,
    "name": "Приобретение пакета акций энергокомпании",
    "status": "Корректировка",
    "statusTsup": "Корректировка",
    "statusOps": "Корректировка",
    "statusMon": "На утверждении",
    "restricted": "Нет",
    "desk": "Энергетика",
    "director": "Волков В.В.",
    "manager": "Соловьёв С.С.",
    "tsupEmployee": "Смирнов С.С.",
    "knr": [
      "ПАО «АвтоЛогистик»"
    ],
    "gsz": "Группа «СвязьКапитал»",
    "jointness": "Не совместная",
    "collateral": "Нет",
    "corpGovernance": [
      "Правление"
    ],
    "boardRep": "Да",
    "finTpl": "Нет",
    "signDate": "17.02.2023",
    "firstDisb": "10.03.2023",
    "endDate": "17.11.2026",
    "repayDate": "",
    "monEntity": "ПАО Сбербанк",
    "mainProductDid": "Кредитный мезонин",
    "productsDidNames": [
      "Кредитный мезонин"
    ],
    "productsNames": [
      "Опцион",
      "Привилегированные акции"
    ],
    "balances": [
      "ТрансКапитал",
      "ООО «СБИ»"
    ],
    "currencies": [
      "USD",
      "EUR"
    ],
    "isPE": true
  },
  {
    "id": 1046,
    "name": "Строительство мусоросортировочного комплекса",
    "status": "Ввод изменений",
    "statusTsup": "Ввод изменений",
    "statusOps": "Ввод изменений",
    "statusMon": "На мониторинге ГК СБИ",
    "restricted": "Нет",
    "desk": "Агропромышленный комплекс",
    "director": "Зайцев З.З.",
    "manager": "Борисов Б.Б.",
    "tsupEmployee": "Соколов С.С.",
    "knr": [
      "ООО «СтройМонтаж»"
    ],
    "gsz": "Группа «УралРесурс»",
    "jointness": "Совместная",
    "collateral": "Да",
    "corpGovernance": [],
    "boardRep": "Нет",
    "finTpl": "Да",
    "signDate": "26.03.2023",
    "firstDisb": "17.04.2023",
    "endDate": "26.01.2027",
    "repayDate": "",
    "monEntity": "ГК СБИ",
    "mainProductDid": "Корпоративный контроль",
    "productsDidNames": [
      "Корпоративный контроль",
      "Долевое участие в капитале"
    ],
    "productsNames": [
      "Акции",
      "Обыкновенные акции",
      "Конвертируемый заём"
    ],
    "balances": [
      "ПромФинанс",
      "SBERFIN"
    ],
    "currencies": [
      "EUR",
      "JPY"
    ],
    "isPE": false
  },
  {
    "id": 1047,
    "name": "Финансирование геологоразведки",
    "status": "Подтверждение изменений",
    "statusTsup": "Подтверждение изменений",
    "statusOps": "Подтверждение изменений",
    "statusMon": "Передача изменений",
    "restricted": "Нет",
    "desk": "Транспорт и логистика",
    "director": "Морозов М.М.",
    "manager": "Виноградов В.В.",
    "tsupEmployee": "Орлов О.О.",
    "knr": [
      "АО «ТеплоЭнерго»"
    ],
    "gsz": "Группа «ГорСтрой»",
    "jointness": "Не совместная",
    "collateral": "Нет",
    "corpGovernance": [],
    "boardRep": "Нет",
    "finTpl": "Нет",
    "signDate": "02.05.2023",
    "firstDisb": "25.05.2023",
    "endDate": "02.04.2027",
    "repayDate": "",
    "monEntity": "ПАО Сбербанк",
    "mainProductDid": "Долевое участие в капитале",
    "productsDidNames": [
      "Долевое участие в капитале",
      "Венчурное финансирование",
      "Акционерный мезонин"
    ],
    "productsNames": [
      "Обыкновенные акции",
      "Конвертируемый заём",
      "Привилегированные акции",
      "Заём",
      "Гарантия"
    ],
    "balances": [
      "АгроБаланс",
      "СОКОЛ ФИНАНС"
    ],
    "currencies": [
      "JPY",
      "RUB"
    ],
    "isPE": false
  },
  {
    "id": 1048,
    "name": "Кредитная линия на пополнение оборотных средств",
    "status": "Погашена",
    "statusTsup": "Погашена",
    "statusOps": "Погашена",
    "statusMon": "Погашена",
    "restricted": "Нет",
    "desk": "Недвижимость",
    "director": "Захаров З.З.",
    "manager": "Белов Б.Б.",
    "tsupEmployee": "Павлов П.П.",
    "knr": [
      "ООО «РечПорт»"
    ],
    "gsz": "",
    "jointness": "Совместная",
    "collateral": "Да",
    "corpGovernance": [
      "Наблюдательный совет"
    ],
    "boardRep": "Да",
    "finTpl": "Да",
    "signDate": "08.06.2023",
    "firstDisb": "02.07.2023",
    "endDate": "08.06.2027",
    "repayDate": "08.06.2024",
    "monEntity": "ГК СБИ",
    "mainProductDid": "Венчурное финансирование",
    "productsDidNames": [
      "Венчурное финансирование"
    ],
    "productsNames": [
      "Привилегированные акции"
    ],
    "balances": [
      "ООО «СБИ»"
    ],
    "currencies": [
      "RUB"
    ],
    "isPE": false
  },
  {
    "id": 1049,
    "name": "Финансирование лизинга подвижного состава",
    "status": "Активная",
    "statusTsup": "Утверждена",
    "statusOps": "На сопровождении",
    "statusMon": "Ожидает передачи на мониторинг",
    "restricted": "Нет",
    "desk": "Телекоммуникации",
    "director": "Козлов К.К.",
    "manager": "Иванов И.И.",
    "tsupEmployee": "Медведев М.М.",
    "knr": [
      "ПАО «МясоПром»"
    ],
    "gsz": "Группа «МедИнвест»",
    "jointness": "Не совместная",
    "collateral": "Нет",
    "corpGovernance": [],
    "boardRep": "Нет",
    "finTpl": "Нет",
    "signDate": "15.07.2023",
    "firstDisb": "09.08.2023",
    "endDate": "15.08.2027",
    "repayDate": "",
    "monEntity": "ПАО Сбербанк",
    "mainProductDid": "Акционерный мезонин",
    "productsDidNames": [
      "Акционерный мезонин",
      "Кредитный мезонин"
    ],
    "productsNames": [
      "Заём",
      "Гарантия",
      "Конвертируемый заём"
    ],
    "balances": [
      "SBERFIN",
      "ЮГ ИНВЕСТ"
    ],
    "currencies": [
      "USD",
      "EUR"
    ],
    "isPE": false
  },
  {
    "id": 1050,
    "name": "Приобретение бизнес-центра",
    "status": "Ожидает подтверждения",
    "statusTsup": "Ожидает подтверждения",
    "statusOps": "Ожидает подтверждения",
    "statusMon": "На утверждении",
    "restricted": "Нет",
    "desk": "Розничная торговля",
    "director": "Степанов С.С.",
    "manager": "Петров П.П.",
    "tsupEmployee": "Егоров Е.Е.",
    "knr": [
      "ООО «ЛогистикЦентр»"
    ],
    "gsz": "Группа «АгроСоюз»",
    "jointness": "Совместная",
    "collateral": "Да",
    "corpGovernance": [],
    "boardRep": "Нет",
    "finTpl": "Да",
    "signDate": "21.08.2023",
    "firstDisb": "16.09.2023",
    "endDate": "21.10.2027",
    "repayDate": "",
    "monEntity": "ГК СБИ",
    "mainProductDid": "Кредитный мезонин",
    "productsDidNames": [
      "Кредитный мезонин",
      "Корпоративный контроль",
      "Долевое участие в капитале"
    ],
    "productsNames": [
      "Конвертируемый заём",
      "Доли в уставном капитале",
      "Кредитная линия",
      "Гарантия"
    ],
    "balances": [
      "СОКОЛ ФИНАНС",
      "ТрансКапитал"
    ],
    "currencies": [
      "EUR",
      "JPY"
    ],
    "isPE": false
  },
  {
    "id": 1051,
    "name": "Развитие сети АЗС нового формата",
    "status": "Черновик",
    "statusTsup": "Черновик",
    "statusOps": "Черновик",
    "statusMon": "На утверждении",
    "restricted": "Нет",
    "desk": "Природные ресурсы",
    "director": "Яковлев Я.Я.",
    "manager": "Сидоров С.С.",
    "tsupEmployee": "Фролов Ф.Ф.",
    "knr": [
      "АО «ЦветМет»"
    ],
    "gsz": "Группа «МеталлСоюз»",
    "jointness": "Не совместная",
    "collateral": "Нет",
    "corpGovernance": [
      "Комитет по рискам"
    ],
    "boardRep": "Да",
    "finTpl": "Нет",
    "signDate": "",
    "firstDisb": "",
    "endDate": "",
    "repayDate": "",
    "monEntity": "ПАО Сбербанк",
    "mainProductDid": "Корпоративный контроль",
    "productsDidNames": [
      "Корпоративный контроль"
    ],
    "productsNames": [
      "Доли в уставном капитале",
      "Кредитная линия"
    ],
    "balances": [
      "VPE CAPITAL",
      "ПромФинанс"
    ],
    "currencies": [
      "JPY",
      "RUB"
    ],
    "isPE": false
  },
  {
    "id": 1052,
    "name": "Финансирование строительства ЦОД для облачного провайдера",
    "status": "Корректировка",
    "statusTsup": "Корректировка",
    "statusOps": "Корректировка",
    "statusMon": "На утверждении",
    "restricted": "Нет",
    "desk": "Металлургия",
    "director": "Соловьёв С.С.",
    "manager": "Кузнецов К.К.",
    "tsupEmployee": "Гусев Г.Г.",
    "knr": [
      "ООО «СтройИндустрия»"
    ],
    "gsz": "Группа «ЭнергоАльянс»",
    "jointness": "Совместная",
    "collateral": "Да",
    "corpGovernance": [],
    "boardRep": "Нет",
    "finTpl": "Да",
    "signDate": "03.11.2023",
    "firstDisb": "01.12.2023",
    "endDate": "03.03.2028",
    "repayDate": "",
    "monEntity": "ГК СБИ",
    "mainProductDid": "Долевое участие в капитале",
    "productsDidNames": [
      "Долевое участие в капитале",
      "Венчурное финансирование"
    ],
    "productsNames": [
      "Гарантия",
      "Овердрафт",
      "Акции"
    ],
    "balances": [
      "ЮГ ИНВЕСТ",
      "АгроБаланс"
    ],
    "currencies": [
      "RUB",
      "USD"
    ],
    "isPE": false
  },
  {
    "id": 1053,
    "name": "Кредитование производителя стройматериалов",
    "status": "Активная",
    "statusTsup": "Утверждена",
    "statusOps": "На сопровождении",
    "statusMon": "На мониторинге ПАО Сбербанк",
    "restricted": "Нет",
    "desk": "Энергетика",
    "director": "Борисов Б.Б.",
    "manager": "Смирнов С.С.",
    "tsupEmployee": "Титов Т.Т.",
    "knr": [
      "ПАО «АгроТех»"
    ],
    "gsz": "",
    "jointness": "Не совместная",
    "collateral": "Нет",
    "corpGovernance": [],
    "boardRep": "Нет",
    "finTpl": "Нет",
    "signDate": "10.12.2023",
    "firstDisb": "08.01.2024",
    "endDate": "10.05.2028",
    "repayDate": "",
    "monEntity": "ПАО Сбербанк",
    "mainProductDid": "Венчурное финансирование",
    "productsDidNames": [
      "Венчурное финансирование",
      "Акционерный мезонин",
      "Кредитный мезонин"
    ],
    "productsNames": [
      "Овердрафт",
      "Акции",
      "Кредитная линия",
      "Опцион",
      "Привилегированные акции"
    ],
    "balances": [
      "ТрансКапитал",
      "ООО «СБИ»"
    ],
    "currencies": [
      "USD",
      "EUR"
    ],
    "isPE": true
  },
  {
    "id": 1054,
    "name": "Рефинансирование задолженности перед синдикатом банков",
    "status": "Ожидает подтверждения",
    "statusTsup": "Ожидает подтверждения",
    "statusOps": "Ожидает подтверждения",
    "statusMon": "На утверждении",
    "restricted": "Нет",
    "desk": "Агропромышленный комплекс",
    "director": "Виноградов В.В.",
    "manager": "Соколов С.С.",
    "tsupEmployee": "Кузьмин К.К.",
    "knr": [
      "ООО «ЮгСтрой»"
    ],
    "gsz": "Группа «СтройИнвест»",
    "jointness": "Совместная",
    "collateral": "Да",
    "corpGovernance": [
      "Совет директоров"
    ],
    "boardRep": "Да",
    "finTpl": "Да",
    "signDate": "16.01.2024",
    "firstDisb": "05.02.2024",
    "endDate": "16.07.2028",
    "repayDate": "",
    "monEntity": "ГК СБИ",
    "mainProductDid": "Акционерный мезонин",
    "productsDidNames": [
      "Акционерный мезонин"
    ],
    "productsNames": [
      "Кредитная линия"
    ],
    "balances": [
      "ПромФинанс"
    ],
    "currencies": [
      "EUR"
    ],
    "isPE": false
  },
  {
    "id": 1055,
    "name": "Финансирование модернизации нефтеперерабатывающего завода",
    "status": "Черновик",
    "statusTsup": "Черновик",
    "statusOps": "Черновик",
    "statusMon": "На утверждении",
    "restricted": "Нет",
    "desk": "Транспорт и логистика",
    "director": "Белов Б.Б.",
    "manager": "Орлов О.О.",
    "tsupEmployee": "Баранов Б.Б.",
    "knr": [
      "АО «НефтьСервис»"
    ],
    "gsz": "Группа «СвязьКапитал»",
    "jointness": "Не совместная",
    "collateral": "Нет",
    "corpGovernance": [],
    "boardRep": "Нет",
    "finTpl": "Нет",
    "signDate": "",
    "firstDisb": "",
    "endDate": "",
    "repayDate": "",
    "monEntity": "ПАО Сбербанк",
    "mainProductDid": "Кредитный мезонин",
    "productsDidNames": [
      "Кредитный мезонин",
      "Корпоративный контроль"
    ],
    "productsNames": [
      "Опцион",
      "Привилегированные акции",
      "Акции"
    ],
    "balances": [
      "АгроБаланс",
      "СОКОЛ ФИНАНС"
    ],
    "currencies": [
      "JPY",
      "RUB"
    ],
    "isPE": false
  },
  {
    "id": 1056,
    "name": "Приобретение доли в телеком-операторе",
    "status": "Активная",
    "statusTsup": "Утверждена",
    "statusOps": "На сопровождении",
    "statusMon": "На мониторинге ГК СБИ",
    "restricted": "Нет",
    "desk": "Недвижимость",
    "director": "Иванов И.И.",
    "manager": "Павлов П.П.",
    "tsupEmployee": "Комаров К.К.",
    "knr": [
      "ПАО «ТелекомИнвест»"
    ],
    "gsz": "Группа «УралРесурс»",
    "jointness": "Совместная",
    "collateral": "Да",
    "corpGovernance": [],
    "boardRep": "Нет",
    "finTpl": "Да",
    "signDate": "30.03.2024",
    "firstDisb": "21.04.2024",
    "endDate": "30.11.2028",
    "repayDate": "",
    "monEntity": "ГК СБИ",
    "mainProductDid": "Корпоративный контроль",
    "productsDidNames": [
      "Корпоративный контроль",
      "Долевое участие в капитале",
      "Венчурное финансирование"
    ],
    "productsNames": [
      "Акции",
      "Обыкновенные акции",
      "Конвертируемый заём",
      "Привилегированные акции"
    ],
    "balances": [
      "ООО «СБИ»",
      "VPE CAPITAL"
    ],
    "currencies": [
      "RUB",
      "USD"
    ],
    "isPE": false
  },
  {
    "id": 1057,
    "name": "Кредитование сети гипермаркетов",
    "status": "Ожидает подтверждения",
    "statusTsup": "Ожидает подтверждения",
    "statusOps": "Ожидает подтверждения",
    "statusMon": "На утверждении",
    "restricted": "Нет",
    "desk": "Телекоммуникации",
    "director": "Петров П.П.",
    "manager": "Медведев М.М.",
    "tsupEmployee": "Щукин Щ.Щ.",
    "knr": [
      "ООО «ГорноКапитал»"
    ],
    "gsz": "Группа «ГорСтрой»",
    "jointness": "Не совместная",
    "collateral": "Нет",
    "corpGovernance": [
      "Правление"
    ],
    "boardRep": "Да",
    "finTpl": "Нет",
    "signDate": "06.05.2024",
    "firstDisb": "29.05.2024",
    "endDate": "06.02.2029",
    "repayDate": "",
    "monEntity": "ПАО Сбербанк",
    "mainProductDid": "Долевое участие в капитале",
    "productsDidNames": [
      "Долевое участие в капитале"
    ],
    "productsNames": [
      "Обыкновенные акции",
      "Конвертируемый заём"
    ],
    "balances": [
      "SBERFIN",
      "ЮГ ИНВЕСТ"
    ],
    "currencies": [
      "USD",
      "EUR"
    ],
    "isPE": false
  },
  {
    "id": 1058,
    "name": "Финансирование строительства ветроэлектростанции",
    "status": "Активная",
    "statusTsup": "Утверждена",
    "statusOps": "На сопровождении",
    "statusMon": "На мониторинге ГК СБИ",
    "restricted": "Нет",
    "desk": "Розничная торговля",
    "director": "Сидоров С.С.",
    "manager": "Егоров Е.Е.",
    "tsupEmployee": "Воробьёв В.В.",
    "knr": [
      "ООО «ЖилСтрой»"
    ],
    "gsz": "",
    "jointness": "Совместная",
    "collateral": "Да",
    "corpGovernance": [],
    "boardRep": "Нет",
    "finTpl": "Да",
    "signDate": "12.06.2024",
    "firstDisb": "06.07.2024",
    "endDate": "12.04.2029",
    "repayDate": "",
    "monEntity": "ГК СБИ",
    "mainProductDid": "Венчурное финансирование",
    "productsDidNames": [
      "Венчурное финансирование",
      "Акционерный мезонин"
    ],
    "productsNames": [
      "Привилегированные акции",
      "Заём",
      "Гарантия"
    ],
    "balances": [
      "СОКОЛ ФИНАНС",
      "ТрансКапитал"
    ],
    "currencies": [
      "EUR",
      "JPY"
    ],
    "isPE": false
  },
  {
    "id": 1059,
    "name": "Приобретение земельного банка под девелопмент",
    "status": "Активная",
    "statusTsup": "Утверждена",
    "statusOps": "На сопровождении",
    "statusMon": "На мониторинге ПАО Сбербанк",
    "restricted": "Нет",
    "desk": "Природные ресурсы",
    "director": "Кузнецов К.К.",
    "manager": "Фролов Ф.Ф.",
    "tsupEmployee": "Лебедев Л.Л.",
    "knr": [
      "ООО «ПродуктТрейд»"
    ],
    "gsz": "Группа «МедИнвест»",
    "jointness": "Не совместная",
    "collateral": "Нет",
    "corpGovernance": [],
    "boardRep": "Нет",
    "finTpl": "Нет",
    "signDate": "19.07.2024",
    "firstDisb": "13.08.2024",
    "endDate": "19.06.2029",
    "repayDate": "",
    "monEntity": "ПАО Сбербанк",
    "mainProductDid": "Акционерный мезонин",
    "productsDidNames": [
      "Акционерный мезонин",
      "Кредитный мезонин",
      "Корпоративный контроль"
    ],
    "productsNames": [
      "Заём",
      "Гарантия",
      "Конвертируемый заём",
      "Доли в уставном капитале",
      "Кредитная линия"
    ],
    "balances": [
      "VPE CAPITAL",
      "ПромФинанс"
    ],
    "currencies": [
      "JPY",
      "RUB"
    ],
    "isPE": false
  },
  {
    "id": 1060,
    "name": "Кредитование производителя удобрений",
    "status": "Активная",
    "statusTsup": "Утверждена",
    "statusOps": "На сопровождении",
    "statusMon": "Направлена на передачу",
    "restricted": "Нет",
    "desk": "Металлургия",
    "director": "Смирнов С.С.",
    "manager": "Гусев Г.Г.",
    "tsupEmployee": "Николаев Н.Н.",
    "knr": [
      "АО «ДатаХаб»"
    ],
    "gsz": "Группа «АгроСоюз»",
    "jointness": "Совместная",
    "collateral": "Да",
    "corpGovernance": [
      "Наблюдательный совет"
    ],
    "boardRep": "Да",
    "finTpl": "Да",
    "signDate": "25.08.2024",
    "firstDisb": "20.09.2024",
    "endDate": "25.08.2029",
    "repayDate": "",
    "monEntity": "ГК СБИ",
    "mainProductDid": "Кредитный мезонин",
    "productsDidNames": [
      "Кредитный мезонин"
    ],
    "productsNames": [
      "Конвертируемый заём"
    ],
    "balances": [
      "ЮГ ИНВЕСТ"
    ],
    "currencies": [
      "RUB"
    ],
    "isPE": true
  },
  {
    "id": 1061,
    "name": "Финансирование запуска регионального авиаперевозчика",
    "status": "Активная",
    "statusTsup": "Утверждена",
    "statusOps": "На сопровождении",
    "statusMon": "На мониторинге ПАО Сбербанк",
    "restricted": "Нет",
    "desk": "Энергетика",
    "director": "Соколов С.С.",
    "manager": "Титов Т.Т.",
    "tsupEmployee": "Крылов К.К.",
    "knr": [
      "ООО «ФармаПлюс»"
    ],
    "gsz": "Группа «МеталлСоюз»",
    "jointness": "Не совместная",
    "collateral": "Нет",
    "corpGovernance": [],
    "boardRep": "Нет",
    "finTpl": "Нет",
    "signDate": "01.10.2024",
    "firstDisb": "28.10.2024",
    "endDate": "01.11.2029",
    "repayDate": "",
    "monEntity": "ПАО Сбербанк",
    "mainProductDid": "Корпоративный контроль",
    "productsDidNames": [
      "Корпоративный контроль",
      "Долевое участие в капитале"
    ],
    "productsNames": [
      "Доли в уставном капитале",
      "Кредитная линия",
      "Гарантия"
    ],
    "balances": [
      "ТрансКапитал",
      "ООО «СБИ»"
    ],
    "currencies": [
      "USD",
      "EUR"
    ],
    "isPE": false
  },
  {
    "id": 1062,
    "name": "Реструктуризация задолженности девелопера",
    "status": "Активная",
    "statusTsup": "Утверждена",
    "statusOps": "На сопровождении",
    "statusMon": "На мониторинге ГК СБИ",
    "restricted": "Нет",
    "desk": "Агропромышленный комплекс",
    "director": "Орлов О.О.",
    "manager": "Кузьмин К.К.",
    "tsupEmployee": "Волков В.В.",
    "knr": [
      "ООО «АгроХолдинг»"
    ],
    "gsz": "Группа «ЭнергоАльянс»",
    "jointness": "Совместная",
    "collateral": "Да",
    "corpGovernance": [],
    "boardRep": "Нет",
    "finTpl": "Да",
    "signDate": "07.11.2024",
    "firstDisb": "05.12.2024",
    "endDate": "07.01.2030",
    "repayDate": "",
    "monEntity": "ГК СБИ",
    "mainProductDid": "Долевое участие в капитале",
    "productsDidNames": [
      "Долевое участие в капитале",
      "Венчурное финансирование",
      "Акционерный мезонин"
    ],
    "productsNames": [
      "Гарантия",
      "Овердрафт",
      "Акции",
      "Кредитная линия"
    ],
    "balances": [
      "ПромФинанс",
      "SBERFIN"
    ],
    "currencies": [
      "EUR",
      "JPY"
    ],
    "isPE": false
  },
  {
    "id": 1063,
    "name": "Финансирование строительства зернового элеватора",
    "status": "Активная",
    "statusTsup": "Утверждена",
    "statusOps": "На сопровождении",
    "statusMon": "На мониторинге ПАО Сбербанк",
    "restricted": "Нет",
    "desk": "Транспорт и логистика",
    "director": "Павлов П.П.",
    "manager": "Баранов Б.Б.",
    "tsupEmployee": "Зайцев З.З.",
    "knr": [
      "АО «МеталлИнвест»"
    ],
    "gsz": "",
    "jointness": "Не совместная",
    "collateral": "Нет",
    "corpGovernance": [
      "Комитет по рискам"
    ],
    "boardRep": "Да",
    "finTpl": "Нет",
    "signDate": "14.12.2024",
    "firstDisb": "12.01.2025",
    "endDate": "14.03.2030",
    "repayDate": "",
    "monEntity": "ПАО Сбербанк",
    "mainProductDid": "Венчурное финансирование",
    "productsDidNames": [
      "Венчурное финансирование"
    ],
    "productsNames": [
      "Овердрафт",
      "Акции"
    ],
    "balances": [
      "АгроБаланс",
      "СОКОЛ ФИНАНС"
    ],
    "currencies": [
      "JPY",
      "RUB"
    ],
    "isPE": false
  },
  {
    "id": 1064,
    "name": "Приобретение контрольного пакета в добывающей компании",
    "status": "Активная",
    "statusTsup": "Утверждена",
    "statusOps": "На сопровождении",
    "statusMon": "На мониторинге ГК СБИ",
    "restricted": "Нет",
    "desk": "Недвижимость",
    "director": "Медведев М.М.",
    "manager": "Комаров К.К.",
    "tsupEmployee": "Морозов М.М.",
    "knr": [
      "ООО «ЭнергоСтрой»"
    ],
    "gsz": "Группа «СтройИнвест»",
    "jointness": "Совместная",
    "collateral": "Да",
    "corpGovernance": [],
    "boardRep": "Нет",
    "finTpl": "Да",
    "signDate": "20.01.2025",
    "firstDisb": "09.02.2025",
    "endDate": "20.05.2030",
    "repayDate": "",
    "monEntity": "ГК СБИ",
    "mainProductDid": "Акционерный мезонин",
    "productsDidNames": [
      "Акционерный мезонин",
      "Кредитный мезонин"
    ],
    "productsNames": [
      "Кредитная линия",
      "Опцион",
      "Привилегированные акции"
    ],
    "balances": [
      "ООО «СБИ»",
      "VPE CAPITAL"
    ],
    "currencies": [
      "RUB",
      "USD"
    ],
    "isPE": false
  },
  {
    "id": 1065,
    "name": "Кредитование лесопромышленного комбината",
    "status": "Активная",
    "statusTsup": "Утверждена",
    "statusOps": "На сопровождении",
    "statusMon": "Передана",
    "restricted": "Да",
    "desk": "Телекоммуникации",
    "director": "Егоров Е.Е.",
    "manager": "Щукин Щ.Щ.",
    "tsupEmployee": "Захаров З.З.",
    "knr": [
      "ПАО «ТрансЛогистик»"
    ],
    "gsz": "Группа «СвязьКапитал»",
    "jointness": "Не совместная",
    "collateral": "Нет",
    "corpGovernance": [],
    "boardRep": "Нет",
    "finTpl": "Нет",
    "signDate": "26.02.2025",
    "firstDisb": "19.03.2025",
    "endDate": "26.07.2030",
    "repayDate": "",
    "monEntity": "ПАО Сбербанк",
    "mainProductDid": "Кредитный мезонин",
    "productsDidNames": [
      "Кредитный мезонин",
      "Корпоративный контроль",
      "Долевое участие в капитале"
    ],
    "productsNames": [
      "Опцион",
      "Привилегированные акции",
      "Акции",
      "Обыкновенные акции",
      "Конвертируемый заём"
    ],
    "balances": [
      "SBERFIN",
      "ЮГ ИНВЕСТ"
    ],
    "currencies": [
      "USD",
      "EUR"
    ],
    "isPE": false
  },
  {
    "id": 1066,
    "name": "Финансирование расширения производства удобрений",
    "status": "Активная",
    "statusTsup": "Утверждена",
    "statusOps": "На сопровождении",
    "statusMon": "На мониторинге ГК СБИ",
    "restricted": "Нет",
    "desk": "Розничная торговля",
    "director": "Фролов Ф.Ф.",
    "manager": "Воробьёв В.В.",
    "tsupEmployee": "Козлов К.К.",
    "knr": [
      "ООО «СтройГрупп»"
    ],
    "gsz": "Группа «УралРесурс»",
    "jointness": "Совместная",
    "collateral": "Да",
    "corpGovernance": [
      "Совет директоров"
    ],
    "boardRep": "Да",
    "finTpl": "Да",
    "signDate": "04.04.2025",
    "firstDisb": "26.04.2025",
    "endDate": "04.10.2030",
    "repayDate": "",
    "monEntity": "ГК СБИ",
    "mainProductDid": "Корпоративный контроль",
    "productsDidNames": [
      "Корпоративный контроль"
    ],
    "productsNames": [
      "Акции"
    ],
    "balances": [
      "СОКОЛ ФИНАНС"
    ],
    "currencies": [
      "EUR"
    ],
    "isPE": false
  },
  {
    "id": 1067,
    "name": "Приобретение сети торговых центров",
    "status": "Активная",
    "statusTsup": "Утверждена",
    "statusOps": "На сопровождении",
    "statusMon": "На мониторинге ПАО Сбербанк",
    "restricted": "Нет",
    "desk": "Природные ресурсы",
    "director": "Гусев Г.Г.",
    "manager": "Лебедев Л.Л.",
    "tsupEmployee": "Степанов С.С.",
    "knr": [
      "АО «ХимПром»"
    ],
    "gsz": "Группа «ГорСтрой»",
    "jointness": "Не совместная",
    "collateral": "Нет",
    "corpGovernance": [],
    "boardRep": "Нет",
    "finTpl": "Нет",
    "signDate": "11.05.2025",
    "firstDisb": "03.06.2025",
    "endDate": "11.12.2030",
    "repayDate": "",
    "monEntity": "ПАО Сбербанк",
    "mainProductDid": "Долевое участие в капитале",
    "productsDidNames": [
      "Долевое участие в капитале",
      "Венчурное финансирование"
    ],
    "productsNames": [
      "Обыкновенные акции",
      "Конвертируемый заём",
      "Привилегированные акции"
    ],
    "balances": [
      "VPE CAPITAL",
      "ПромФинанс"
    ],
    "currencies": [
      "JPY",
      "RUB"
    ],
    "isPE": false
  },
  {
    "id": 1068,
    "name": "Финансирование строительства портового терминала",
    "status": "Активная",
    "statusTsup": "Утверждена",
    "statusOps": "На сопровождении",
    "statusMon": "На мониторинге ГК СБИ",
    "restricted": "Нет",
    "desk": "Металлургия",
    "director": "Титов Т.Т.",
    "manager": "Николаев Н.Н.",
    "tsupEmployee": "Яковлев Я.Я.",
    "knr": [
      "ООО «ЛесПром»"
    ],
    "gsz": "",
    "jointness": "Совместная",
    "collateral": "Да",
    "corpGovernance": [],
    "boardRep": "Нет",
    "finTpl": "Да",
    "signDate": "17.06.2025",
    "firstDisb": "11.07.2025",
    "endDate": "17.02.2031",
    "repayDate": "",
    "monEntity": "ГК СБИ",
    "mainProductDid": "Венчурное финансирование",
    "productsDidNames": [
      "Венчурное финансирование",
      "Акционерный мезонин",
      "Кредитный мезонин"
    ],
    "productsNames": [
      "Привилегированные акции",
      "Заём",
      "Гарантия",
      "Конвертируемый заём"
    ],
    "balances": [
      "ЮГ ИНВЕСТ",
      "АгроБаланс"
    ],
    "currencies": [
      "RUB",
      "USD"
    ],
    "isPE": true
  },
  {
    "id": 1069,
    "name": "Кредитование производителя электроники",
    "status": "Активная",
    "statusTsup": "Утверждена",
    "statusOps": "На сопровождении",
    "statusMon": "На мониторинге ПАО Сбербанк",
    "restricted": "Нет",
    "desk": "Энергетика",
    "director": "Кузьмин К.К.",
    "manager": "Крылов К.К.",
    "tsupEmployee": "Соловьёв С.С.",
    "knr": [
      "АО «ПортИнвест»"
    ],
    "gsz": "Группа «МедИнвест»",
    "jointness": "Не совместная",
    "collateral": "Нет",
    "corpGovernance": [
      "Правление"
    ],
    "boardRep": "Да",
    "finTpl": "Нет",
    "signDate": "24.07.2025",
    "firstDisb": "18.08.2025",
    "endDate": "24.04.2031",
    "repayDate": "",
    "monEntity": "ПАО Сбербанк",
    "mainProductDid": "Акционерный мезонин",
    "productsDidNames": [
      "Акционерный мезонин"
    ],
    "productsNames": [
      "Заём",
      "Гарантия"
    ],
    "balances": [
      "ТрансКапитал",
      "ООО «СБИ»"
    ],
    "currencies": [
      "USD",
      "EUR"
    ],
    "isPE": false
  },
  {
    "id": 1070,
    "name": "Финансирование модернизации ТЭЦ",
    "status": "Активная",
    "statusTsup": "Утверждена",
    "statusOps": "На сопровождении",
    "statusMon": "Ожидает передачи на мониторинг",
    "restricted": "Нет",
    "desk": "Агропромышленный комплекс",
    "director": "Баранов Б.Б.",
    "manager": "Волков В.В.",
    "tsupEmployee": "Борисов Б.Б.",
    "knr": [
      "ООО «МорТранс»"
    ],
    "gsz": "Группа «АгроСоюз»",
    "jointness": "Совместная",
    "collateral": "Да",
    "corpGovernance": [],
    "boardRep": "Нет",
    "finTpl": "Да",
    "signDate": "30.08.2025",
    "firstDisb": "25.09.2025",
    "endDate": "30.06.2031",
    "repayDate": "",
    "monEntity": "ГК СБИ",
    "mainProductDid": "Кредитный мезонин",
    "productsDidNames": [
      "Кредитный мезонин",
      "Корпоративный контроль"
    ],
    "productsNames": [
      "Конвертируемый заём",
      "Доли в уставном капитале",
      "Кредитная линия"
    ],
    "balances": [
      "ПромФинанс",
      "SBERFIN"
    ],
    "currencies": [
      "EUR",
      "JPY"
    ],
    "isPE": false
  },
  {
    "id": 1071,
    "name": "Приобретение доли в управляющей компании",
    "status": "Активная",
    "statusTsup": "Утверждена",
    "statusOps": "На сопровождении",
    "statusMon": "На мониторинге ПАО Сбербанк",
    "restricted": "Нет",
    "desk": "Транспорт и логистика",
    "director": "Комаров К.К.",
    "manager": "Зайцев З.З.",
    "tsupEmployee": "Виноградов В.В.",
    "knr": [
      "ПАО «СтальГрупп»"
    ],
    "gsz": "Группа «МеталлСоюз»",
    "jointness": "Не совместная",
    "collateral": "Нет",
    "corpGovernance": [],
    "boardRep": "Нет",
    "finTpl": "Нет",
    "signDate": "06.10.2025",
    "firstDisb": "02.11.2025",
    "endDate": "06.09.2031",
    "repayDate": "",
    "monEntity": "ПАО Сбербанк",
    "mainProductDid": "Корпоративный контроль",
    "productsDidNames": [
      "Корпоративный контроль",
      "Долевое участие в капитале",
      "Венчурное финансирование"
    ],
    "productsNames": [
      "Доли в уставном капитале",
      "Кредитная линия",
      "Гарантия",
      "Овердрафт",
      "Акции"
    ],
    "balances": [
      "АгроБаланс",
      "СОКОЛ ФИНАНС"
    ],
    "currencies": [
      "JPY",
      "RUB"
    ],
    "isPE": false
  },
  {
    "id": 1072,
    "name": "Кредитование производителя упаковки",
    "status": "Активная",
    "statusTsup": "Утверждена",
    "statusOps": "На сопровождении",
    "statusMon": "На мониторинге ГК СБИ",
    "restricted": "Нет",
    "desk": "Недвижимость",
    "director": "Щукин Щ.Щ.",
    "manager": "Морозов М.М.",
    "tsupEmployee": "Белов Б.Б.",
    "knr": [
      "ООО «НефтеХимСервис»"
    ],
    "gsz": "Группа «ЭнергоАльянс»",
    "jointness": "Совместная",
    "collateral": "Да",
    "corpGovernance": [
      "Наблюдательный совет"
    ],
    "boardRep": "Да",
    "finTpl": "Да",
    "signDate": "12.11.2025",
    "firstDisb": "10.12.2025",
    "endDate": "12.11.2027",
    "repayDate": "",
    "monEntity": "ГК СБИ",
    "mainProductDid": "Долевое участие в капитале",
    "productsDidNames": [
      "Долевое участие в капитале"
    ],
    "productsNames": [
      "Гарантия"
    ],
    "balances": [
      "ООО «СБИ»"
    ],
    "currencies": [
      "RUB"
    ],
    "isPE": false
  },
  {
    "id": 1073,
    "name": "Финансирование строительства логистического парка класса А",
    "status": "Активная",
    "statusTsup": "Утверждена",
    "statusOps": "На сопровождении",
    "statusMon": "На мониторинге ПАО Сбербанк",
    "restricted": "Нет",
    "desk": "Телекоммуникации",
    "director": "Воробьёв В.В.",
    "manager": "Захаров З.З.",
    "tsupEmployee": "Иванов И.И.",
    "knr": [
      "АО «ГидроЭнерго»"
    ],
    "gsz": "",
    "jointness": "Не совместная",
    "collateral": "Нет",
    "corpGovernance": [],
    "boardRep": "Нет",
    "finTpl": "Нет",
    "signDate": "19.12.2025",
    "firstDisb": "17.01.2026",
    "endDate": "19.01.2028",
    "repayDate": "",
    "monEntity": "ПАО Сбербанк",
    "mainProductDid": "Венчурное финансирование",
    "productsDidNames": [
      "Венчурное финансирование",
      "Акционерный мезонин"
    ],
    "productsNames": [
      "Овердрафт",
      "Акции",
      "Кредитная линия"
    ],
    "balances": [
      "SBERFIN",
      "ЮГ ИНВЕСТ"
    ],
    "currencies": [
      "USD",
      "EUR"
    ],
    "isPE": false
  }
];

window.DEALS_ENUMS = {
  "status": [
    "Черновик",
    "Ожидает подтверждения",
    "Ожидает назначения ответственного",
    "Корректировка",
    "Ввод изменений",
    "Подтверждение изменений",
    "Корректировка изменений",
    "Активная",
    "Погашена"
  ],
  "statusTsup": [
    "Черновик",
    "Ожидает подтверждения",
    "Ожидает назначения ответственного",
    "Корректировка",
    "Утверждена",
    "Ввод изменений",
    "Подтверждение изменений",
    "Корректировка изменений",
    "Погашена"
  ],
  "statusOps": [
    "Черновик",
    "Ожидает подтверждения",
    "Корректировка",
    "На сопровождении",
    "Ввод изменений",
    "Подтверждение изменений",
    "Корректировка изменений",
    "Погашена"
  ],
  "statusMon": [
    "На утверждении",
    "Ожидает передачи на мониторинг",
    "Направлена на передачу",
    "Передана",
    "Изменения ожидают передачи на мониторинг",
    "Изменения направлены на передачу",
    "Передача изменений",
    "На мониторинге ГК СБИ",
    "На мониторинге ПАО Сбербанк",
    "Погашена"
  ],
  "desk": [
    "Недвижимость",
    "Телекоммуникации",
    "Розничная торговля",
    "Природные ресурсы",
    "Металлургия",
    "Энергетика",
    "Агропромышленный комплекс",
    "Транспорт и логистика"
  ],
  "balances": [
    "ООО «СБИ»",
    "SBERFIN",
    "СОКОЛ ФИНАНС",
    "VPE CAPITAL",
    "ЮГ ИНВЕСТ",
    "ТрансКапитал",
    "ПромФинанс",
    "АгроБаланс"
  ],
  "currencies": [
    "RUB",
    "USD",
    "EUR",
    "JPY"
  ],
  "productsDid": [
    "Акционерный мезонин",
    "Кредитный мезонин",
    "Корпоративный контроль",
    "Долевое участие в капитале",
    "Венчурное финансирование"
  ],
  "products": [
    "Кредитная линия",
    "Опцион",
    "Акции",
    "Обыкновенные акции",
    "Привилегированные акции",
    "Заём",
    "Конвертируемый заём",
    "Доли в уставном капитале",
    "Гарантия",
    "Овердрафт"
  ],
  "jointness": [
    "Совместная",
    "Не совместная"
  ],
  "corpGovernance": [
    "Наблюдательный совет",
    "Правление",
    "Совет директоров",
    "Комитет по рискам"
  ],
  "people": {
    "director": [
      "Баранов Б.Б.",
      "Белов Б.Б.",
      "Борисов Б.Б.",
      "Виноградов В.В.",
      "Волков В.В.",
      "Воробьёв В.В.",
      "Гусев Г.Г.",
      "Егоров Е.Е.",
      "Зайцев З.З.",
      "Захаров З.З.",
      "Иванов И.И.",
      "Козлов К.К.",
      "Комаров К.К.",
      "Крылов К.К.",
      "Кузнецов К.К.",
      "Кузьмин К.К.",
      "Лебедев Л.Л.",
      "Медведев М.М.",
      "Морозов М.М.",
      "Николаев Н.Н.",
      "Орлов О.О.",
      "Павлов П.П.",
      "Петров П.П.",
      "Сидоров С.С.",
      "Смирнов С.С.",
      "Соколов С.С.",
      "Соловьёв С.С.",
      "Степанов С.С.",
      "Титов Т.Т.",
      "Фролов Ф.Ф.",
      "Щукин Щ.Щ.",
      "Яковлев Я.Я."
    ],
    "manager": [
      "Баранов Б.Б.",
      "Белов Б.Б.",
      "Борисов Б.Б.",
      "Виноградов В.В.",
      "Волков В.В.",
      "Воробьёв В.В.",
      "Гусев Г.Г.",
      "Егоров Е.Е.",
      "Зайцев З.З.",
      "Захаров З.З.",
      "Иванов И.И.",
      "Козлов К.К.",
      "Комаров К.К.",
      "Крылов К.К.",
      "Кузнецов К.К.",
      "Кузьмин К.К.",
      "Лебедев Л.Л.",
      "Медведев М.М.",
      "Морозов М.М.",
      "Николаев Н.Н.",
      "Орлов О.О.",
      "Павлов П.П.",
      "Петров П.П.",
      "Сидоров С.С.",
      "Смирнов С.С.",
      "Соколов С.С.",
      "Соловьёв С.С.",
      "Степанов С.С.",
      "Титов Т.Т.",
      "Фролов Ф.Ф.",
      "Щукин Щ.Щ.",
      "Яковлев Я.Я."
    ],
    "tsupEmployee": [
      "Баранов Б.Б.",
      "Белов Б.Б.",
      "Борисов Б.Б.",
      "Виноградов В.В.",
      "Волков В.В.",
      "Воробьёв В.В.",
      "Гусев Г.Г.",
      "Егоров Е.Е.",
      "Зайцев З.З.",
      "Захаров З.З.",
      "Иванов И.И.",
      "Козлов К.К.",
      "Комаров К.К.",
      "Крылов К.К.",
      "Кузнецов К.К.",
      "Кузьмин К.К.",
      "Лебедев Л.Л.",
      "Медведев М.М.",
      "Морозов М.М.",
      "Николаев Н.Н.",
      "Орлов О.О.",
      "Павлов П.П.",
      "Петров П.П.",
      "Сидоров С.С.",
      "Смирнов С.С.",
      "Соколов С.С.",
      "Соловьёв С.С.",
      "Степанов С.С.",
      "Титов Т.Т.",
      "Фролов Ф.Ф.",
      "Щукин Щ.Щ.",
      "Яковлев Я.Я."
    ]
  }
};
