/* ============================================================
   TileDealTeamModal.js — окно «Команда сделки».

   Фрагмент TileDealTeamModal.html держит оба режима окна, а ФИО в нём —
   пример. Скрипт делает четыре вещи, которых нет в рантаймах ДС:

     1. Режим окна. Тайл показывает шесть ролей из тринадцати, поэтому в
        просмотре у него есть «Развернуть». Из какого тайла окно открыли, в
        таком режиме оно и открывается: data-mode переносится с тайла на
        .modal, дальше вид переключает TileDealTeamModal.css.
     2. Списки сотрудников. Справочник — 36 человек на каждое из тринадцати
        полей; в разметке это больше четырёхсот строк одного и того же списка,
        поэтому опции подставляются здесь (runtime-hooks: динамический список у
        DropdownList собирается кодом). Открытие, клавиатуру и выбор дальше
        ведёт DSDropdownList — своей копии этой логики тут нет. В строке списка
        имя и табельный номер под ним; выбранный сотрудник показывается в поле
        как «ФИО номер», а в запись сделки уходит двумя полями.
     3. Обязательность по деску. Деск обязателен всегда; какие роли обязательны
        вдобавок — зависит от деска (заказчик 23.09.2026). Пары берутся из
        MOCK_DESK_REQUIRED (mock-team.js), при смене деска звёздочки
        переставляются.
     4. Проверка и сохранение. «Сохранить» не закрывает окно само: без деска
        окно остаётся открытым и поле помечается ошибкой.

   Признак ограниченного доступа остаётся чекбоксом в обоих режимах — читаемой
   строкой его не подменяют. Видят его все роли, меняет только руководитель
   ЦУП: остальным чекбокс выключен, а в просмотре он выключен всегда. Право
   приходит снаружи параметром canEditRestricted — окно роль не вычисляет, как
   и тайл не вычисляет режим.

   API:
     PostDealTeamModal.bind(scrim, opts) → api — связать окно с источником
                                    данных. Витрине api нужен потому, что там
                                    окно стоит статично (.modal-scrim--inline) и
                                    триггера, который задал бы режим, нет:
                                      api.setMode(mode) — поставить режим и
                                                          перезаполнить поля
                                      api.refresh()     — перезаполнить в
                                                          текущем режиме
                                      api.validate()    — прогнать проверку
                                                          «Сохранить» без него
       opts.get()                 → запись сделки с полями команды
       opts.save(patch)           ← принять правку: на каждую роль два ключа —
                                    ФИО и табельный номер <роль>Tab (у деска
                                    номера нет), плюс otherParticipants и
                                    restricted
       opts.canEditRestricted     — можно ли менять признак: значение или
                                    функция; читается в момент открытия, потому
                                    что роль может смениться (по умолчанию нет)
       opts.roster                — справочник сотрудников, по умолчанию
                                    window.MOCK_TEAM_ROSTER
       opts.desks                 — список десков, по умолчанию
                                    window.DEALS_ENUMS.desk
     PostDealTeamModal.FIELDS     — поля окна в порядке отображения
   ============================================================ */
(function () {
  'use strict';

  var SCRIM_ID = 'deal-team-scrim';

  /* Порядок — порядок отображения на макете: сетка в три колонки заполняется
     построчно, поэтому здесь поля идут так, как читаются. Ключ совпадает с
     полем записи сделки (mock-deals.js), id — с разметкой окна. */
  var FIELDS = [
    { key: 'desk', id: 'dt-desk', label: 'Деск', source: 'desks' },
    { key: 'clientManager', id: 'dt-client-manager', label: 'Клиентский менеджер' },
    { key: 'pmzEmployee', id: 'dt-pmz', label: 'Сотрудник ПМЗ' },
    { key: 'director', id: 'dt-director', label: 'Директор' },
    { key: 'creditInspector', id: 'dt-credit-inspector', label: 'Кредитный инспектор' },
    { key: 'prpaEmployee', id: 'dt-prpa', label: 'Сотрудник ПРПА' },
    { key: 'regionalDirector', id: 'dt-regional-director', label: 'Региональный директор' },
    { key: 'riskEmployee', id: 'dt-risk', label: 'Сотрудник Рисков' },
    { key: 'legalEmployee', id: 'dt-legal', label: 'Сотрудник Юридической службы' },
    { key: 'manager', id: 'dt-manager', label: 'Менеджер сделки' },
    { key: 'monitoringEmployee', id: 'dt-monitoring', label: 'Сотрудник Мониторинга' },
    { key: 'constructionExpert', id: 'dt-construction', label: 'Строительный эксперт' },
    { key: 'tsupEmployee', id: 'dt-tsup', label: 'Сотрудник ЦУП' }
  ];

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function val(src, key) {
    return String((src && src[key]) || '').trim();
  }

  /* ---------- ФИО и табельный номер ----------

     В записи сделки они лежат порознь: роль — ФИО, её пара <роль>Tab — номер.
     Реестр портфеля читает те же поля роли и должен видеть чистое ФИО, и в
     тайле на макете номеров нет. В окне же сотрудник показывается с номером —
     иначе однофамильцев не различить. Поэтому склейка и разбор живут здесь. */

  function tabKey(key) { return key + 'Tab'; }

  /* «Андреев М.А.» + «100101» → «Андреев М.А. 100101» */
  function personValue(name, tab) {
    return name && tab ? name + ' ' + tab : name;
  }

  /* Обратно: хвостовая группа цифр — номер, остальное — ФИО. Разбор, а не
     запоминание выбора в dataset: переживает перерисовку поля и честно
     отрабатывает ручной ввод — набрали имя руками, не выбрав из списка, и
     номер остаётся пустым, а не подставляется наугад. */
  function splitPerson(value) {
    var s = String(value == null ? '' : value).trim();
    var m = /^(.*\S)\s+(\d+)$/.exec(s);
    return m ? { name: m[1], tab: m[2] } : { name: s, tab: '' };
  }

  /* ---------- списки ---------- */

  /* Строка списка сотрудников: ФИО, под ним табельный номер — просто число,
     без подписи (заказчик 23.09.2026). У списка десков номера нет: деск — не
     человек. Номер едет на самой опции атрибутом, чтобы выбор не разбирал
     текст обратно. */
  function optionHTML(label, tab) {
    return '<button type="button" class="ddl__item" role="option" aria-selected="false"'
      + (tab ? ' data-tab="' + esc(tab) + '"' : '') + '>'
      + '<span class="ddl__item-body">'
      + '<span class="ddl__item-label">' + esc(label) + '</span>'
      + (tab ? '<span class="ds-helper"><span class="ds-helper__text">' + esc(tab) + '</span></span>' : '')
      + '</span></button>';
  }

  function rosterHTML(roster) {
    return roster.map(function (p) { return optionHTML(p.name, p.tab); }).join('');
  }

  function desksHTML(desks) {
    return desks.map(function (d) { return optionHTML(d, ''); }).join('');
  }

  /* ---------- обязательность ---------- */

  /* Звёздочка у подписи. Деск обязателен всегда, остальные — по карте деска.
     Карта демонстрационная (mock-team.js), механика от её состава не зависит. */
  function requiredKeys(desk) {
    var map = window.MOCK_DESK_REQUIRED || {};
    var extra = map[desk] || [];
    return ['desk'].concat(extra);
  }

  function applyRequired(scrim, desk) {
    var need = requiredKeys(desk);
    FIELDS.forEach(function (f) {
      var label = scrim.querySelector('label[for="' + f.id + '"] .ds-label__text');
      if (!label) return;
      var mark = label.parentNode.querySelector('.ds-label__req');
      var must = need.indexOf(f.key) !== -1;
      if (must && !mark) {
        mark = document.createElement('span');
        mark.className = 'ds-label__req';
        mark.textContent = '*';
        label.parentNode.appendChild(mark);
      } else if (!must && mark) {
        mark.parentNode.removeChild(mark);
      }
    });
  }

  /* ---------- заполнение ---------- */

  /* Что показывает поле роли: ФИО с табельным номером. У деска номера нет. */
  function shown(team, f) {
    var name = val(team, f.key);
    return f.source === 'desks' ? name : personValue(name, val(team, tabKey(f.key)));
  }

  function fillEdit(scrim, team) {
    FIELDS.forEach(function (f) {
      var input = scrim.querySelector('#' + f.id);
      if (input) input.value = shown(team, f);
    });
    var others = scrim.querySelector('#dt-others');
    if (others) others.value = val(team, 'otherParticipants');
    applyRequired(scrim, val(team, 'desk'));
    /* Значения поставлены присваиванием, а оно событий не шлёт: рантайм поля
       считает крестик очистки по значению и без этого вызова считал бы все поля
       пустыми (правило InputText). Выбор из списка синхронизирует сам
       DSDropdownList (1.014) — здесь синхронизируется заполнение данными. */
    if (window.DSInput) window.DSInput.syncAll(scrim);
  }

  function fillView(scrim, team) {
    var byKey = {};
    FIELDS.forEach(function (f) { byKey[f.key] = f; });
    scrim.querySelectorAll('[data-team-view]').forEach(function (el) {
      var key = el.getAttribute('data-team-view');
      var v = byKey[key] ? shown(team, byKey[key]) : val(team, key);
      /* Прочерк — значение, а не подсказка: своего цвета у него нет
         (ReadOnlyField 1.010). */
      el.textContent = v || '—';
    });
  }

  /* Признак — чекбокс в обоих режимах, читаемой строкой его не подменяют.
     В просмотре он выключен всегда: там не правят ничего. В правке — по праву
     роли (менять признак может только руководитель ЦУП). */
  function fillFlag(scrim, team, mode, canEditRestricted) {
    var flag = scrim.querySelector('#dt-restricted');
    if (!flag) return;
    flag.checked = val(team, 'restricted') === 'Да';
    flag.disabled = mode === 'view' ? true : !canEditRestricted;
  }

  /* ---------- проверка ---------- */

  /* Ошибку показывает сам компонент поля: .inp--error + хелпер под полем.
     Состояние компонента ДС задаётся его же классом, а не своим. */
  function setError(scrim, id, message) {
    var input = scrim.querySelector('#' + id);
    if (!input) return;
    var box = input.closest('.inp');
    if (!box) return;
    var helper = box.querySelector('.ds-helper--error');
    if (message) {
      box.classList.add('inp--error');
      input.setAttribute('aria-invalid', 'true');
      if (!helper) {
        helper = document.createElement('span');
        helper.className = 'ds-helper ds-helper--error';
        box.appendChild(helper);
      }
      helper.innerHTML = '<span class="ds-helper__text">' + esc(message) + '</span>';
    } else {
      box.classList.remove('inp--error');
      input.removeAttribute('aria-invalid');
      if (helper) helper.parentNode.removeChild(helper);
    }
  }

  /* Поле показывает «ФИО номер», а в записи сделки они лежат порознь: роль
     получает чистое ФИО (его же читает реестр портфеля и тайл), номер — пару
     <роль>Tab. У деска пары нет. */
  function collect(scrim) {
    var patch = {};
    FIELDS.forEach(function (f) {
      var input = scrim.querySelector('#' + f.id);
      var raw = input ? input.value.trim() : '';
      if (f.source === 'desks') { patch[f.key] = raw; return; }
      var person = splitPerson(raw);
      patch[f.key] = person.name;
      patch[tabKey(f.key)] = person.tab;
    });
    var others = scrim.querySelector('#dt-others');
    patch.otherParticipants = others ? others.value.trim() : '';
    var flag = scrim.querySelector('#dt-restricted');
    if (flag && !flag.disabled) patch.restricted = flag.checked ? 'Да' : 'Нет';
    return patch;
  }

  /* ---------- связывание ---------- */

  function bind(scrim, opts) {
    if (!scrim) return null;
    if (scrim.__dealTeamApi) return scrim.__dealTeamApi;
    opts = opts || {};

    var modal = scrim.querySelector('.lc-deal-team-modal');
    var roster = opts.roster || window.MOCK_TEAM_ROSTER || [];
    var desks = opts.desks || (window.DEALS_ENUMS && window.DEALS_ENUMS.desk) || [];

    /* Право на признак читается в момент открытия: роль может смениться, а окно
       живёт в разметке постоянно. Поэтому значение или функция, а не снимок. */
    function canEditRestricted() {
      var v = opts.canEditRestricted;
      return typeof v === 'function' ? !!v() : !!v;
    }

    /* Опции — один раз на окно: справочник за время сессии не меняется. */
    FIELDS.forEach(function (f) {
      var list = scrim.querySelector('#' + f.id + '-list');
      if (!list) return;
      list.innerHTML = f.source === 'desks' ? desksHTML(desks) : rosterHTML(roster);
      var field = scrim.querySelector('[data-ddl="' + f.id + '-list"]');
      if (!field || !window.DSDropdownList) return;
      window.DSDropdownList.bind(field, {
        list: list,
        onSelect: function (it) {
          var input = scrim.querySelector('#' + f.id);
          var label = it.querySelector('.ddl__item-label');
          if (!input || !label) return;
          /* Выбран сотрудник — в поле имя и номер за ним; выбран деск — только
             название. Номер берётся с опции, а не из текста строки. */
          input.value = personValue(label.textContent.trim(), it.getAttribute('data-tab') || '');
          setError(scrim, f.id, '');
          /* Деск решает, какие роли обязательны, — звёздочки сразу за ним. */
          if (f.key === 'desk') applyRequired(scrim, input.value);
        }
      });
    });

    /* Деск можно не только выбрать, но и стереть — крестиком очистки или
       руками. Тогда обязательные роли этого деска обязательными быть
       перестают, и звёздочки обязаны уйти вместе со значением. Крестик шлёт на
       контроле обычный `input` (ds-input.js), поэтому один слушатель покрывает
       оба способа; выбор из списка звёздочки ставит сам, в onSelect. */
    var deskInput = scrim.querySelector('#dt-desk');
    if (deskInput) {
      deskInput.addEventListener('input', function () {
        applyRequired(scrim, deskInput.value.trim());
      });
    }

    function refresh() {
      var mode = modal ? (modal.getAttribute('data-mode') || 'edit') : 'edit';
      var team = opts.get ? opts.get() : null;
      if (mode === 'view') fillView(scrim, team);
      else fillEdit(scrim, team);
      /* Чекбокс признака общий для обоих режимов — заполняется отдельно. */
      fillFlag(scrim, team, mode, canEditRestricted());
    }

    function setMode(mode) {
      if (modal) modal.setAttribute('data-mode', mode === 'view' ? 'view' : 'edit');
      refresh();
    }

    /* Открытие: режим и значения берутся в момент клика по триггеру — окно
       живёт в разметке постоянно, а сделка, права и режим тайла могли
       измениться. */
    document.addEventListener('click', function (e) {
      var trigger = e.target.closest('[data-modal="' + SCRIM_ID + '"]');
      if (!trigger) return;
      var tile = trigger.closest('.lc-deal-team');
      setMode(tile ? (tile.getAttribute('data-mode') || 'edit') : 'edit');
    });

    /* Проверка: обязателен деск. Остальные роли обязательны по деску, но их
       обязательность сегодня только показывается звёздочкой — карта десков у
       владельца не получена, и проверять по демо-случаю было бы враньём. */
    function validate() {
      var desk = String((scrim.querySelector('#dt-desk') || {}).value || '').trim();
      setError(scrim, 'dt-desk', desk ? '' : 'Выберите деск — поле обязательное');
      return !!desk;
    }

    /* Сохранение: без деска окно остаётся открытым. В витрине окно стоит
       статично (.modal-scrim--inline) — там закрывать нечего. */
    var save = scrim.querySelector('[data-team-save]');
    if (save) {
      save.addEventListener('click', function () {
        if (!validate()) {
          var input = scrim.querySelector('#dt-desk');
          if (input) input.focus();
          return;
        }
        if (opts.save) opts.save(collect(scrim));
        if (scrim.classList.contains('modal-scrim--inline')) return;
        if (window.DSModal) window.DSModal.closeTop();
      });
    }

    var api = { setMode: setMode, refresh: refresh, validate: validate };
    scrim.__dealTeamApi = api;
    return api;
  }

  /* personValue / splitPerson отданы наружу не для красоты: это и есть
     контракт между тем, что видно в поле, и тем, что лежит в записи сделки.
     Отданный наружу, он проверяем и не переписывается заново там, где
     понадобится снова. */
  window.PostDealTeamModal = {
    FIELDS: FIELDS,
    bind: bind,
    personValue: personValue,
    splitPerson: splitPerson
  };
})();
