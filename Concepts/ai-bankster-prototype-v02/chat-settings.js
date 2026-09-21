/* Общие настройки чатов прототипа. Данные демонстрационные; модальные слои,
   меню и списки обслуживают штатные DSModal / DSMenu / DSDropdownList. */
(function () {
  'use strict';

  var PEOPLE = [
    { id: 'petrov', name: 'Петров Алексей', desk: 'realty' },
    { id: 'smirnova', name: 'Смирнова Елена', desk: 'realty' },
    { id: 'kim', name: 'Ким Дмитрий', desk: 'realty' },
    { id: 'orlova', name: 'Орлова Наталья', desk: 'agro' },
    { id: 'gusev', name: 'Гусев Павел', desk: 'agro' },
    { id: 'lebedeva', name: 'Лебедева Ольга', desk: 'agro' },
    { id: 'ivanov', name: 'Иванов Сергей', desk: 'industry' },
    { id: 'volkova', name: 'Волкова Мария', desk: 'industry' },
    { id: 'sokolov', name: 'Соколов Андрей', desk: 'logistics' },
    { id: 'morozova', name: 'Морозова Анна', desk: 'logistics' }
  ];
  var DESKS = [
    { id: 'realty', name: 'Недвижимость' },
    { id: 'agro', name: 'Сельское хозяйство' },
    { id: 'industry', name: 'Промышленность' },
    { id: 'logistics', name: 'Транспорт и логистика' }
  ];
  var THREAD_IDS = {
    'ГК «Северный агрохолдинг» — выход миноритария': 1,
    'ПАО «Волга-Агро» — оценка перед встречей': 2,
    'Логистика последней мили, Юг России': 4,
    'Бенефициар Токарев П. А. — активы и структура владения': 5,
    'АО «Метизный завод» — рефинансирование выпуска': 6,
    'Рынок минеральных удобрений, СЗФО': 7,
    'ГК «Северный агрохолдинг» — долговой профиль': 8,
    'Сравнение peers в агросекторе за 2025 год': 9,
    'ООО «Каспий-Порт» — расширение терминала': 10
  };
  var CHANNELS = { mail: 'Почта', sberchat: 'Сберчат', ui: 'В интерфейсе' };
  var cache = Object.create(null);
  var provider = function () { return null; };
  var menuChat = null, editingChat = null, draft = null;
  var peopleApi, desksApi;

  function el(id) { return document.getElementById(id); }
  function esc(value) {
    return String(value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function key(id) { return 'ai-pitcher-v02-chat-settings:' + id; }
  function read(id) {
    var value = cache[id];
    try { value = JSON.parse(localStorage.getItem(key(id))) || value; } catch (_) { /* file:// может ограничить хранилище */ }
    value = value && typeof value === 'object' ? value : {};
    return {
      channels: Array.isArray(value.channels) ? value.channels.filter(function (c) { return CHANNELS[c]; }) : ['mail', 'ui'],
      users: Array.isArray(value.users) ? value.users.filter(function (id) { return PEOPLE.some(function (p) { return p.id === id; }); }) : [],
      desks: Array.isArray(value.desks) ? value.desks.filter(function (id) { return DESKS.some(function (d) { return d.id === id; }); }) : []
    };
  }
  function save(id, value) {
    cache[id] = value;
    try { localStorage.setItem(key(id), JSON.stringify(value)); } catch (_) { /* Сохраняем в памяти текущей страницы. */ }
    document.dispatchEvent(new CustomEvent('pitcher:settings', { detail: { id: id } }));
  }
  function recipients(value) {
    return PEOPLE.filter(function (p) { return value.users.indexOf(p.id) !== -1 || value.desks.indexOf(p.desk) !== -1; });
  }
  function deskName(id) { return DESKS.filter(function (d) { return d.id === id; })[0].name; }
  function toast(message) {
    if (window.DSToast) window.DSToast.show({ message: message, kind: 'bar', tone: 'success', duration: 3000 });
  }
  function modal(id, title, body, action, width) {
    return '<div class="modal-scrim" id="' + id + '-scrim" hidden data-modal-guarded>' +
      '<div class="modal modal--w' + width + '" role="dialog" aria-modal="true" aria-labelledby="' + id + '-title">' +
      '<header class="modal__head"><h2 class="modal__title" id="' + id + '-title">' + title + '</h2>' +
      '<button type="button" class="ibtn ibtn--neutral ibtn--l" aria-label="Закрыть" data-modal-close><i data-icon="close"></i></button></header>' +
      '<div class="modal__body">' + body + '</div>' +
      '<footer class="modal__foot"><div class="modal__foot-right">' +
      '<button type="button" class="btn btn--transparent btn--m" data-modal-close><span class="btn__label">Отмена</span></button>' +
      '<button type="button" class="btn btn--accent btn--m" id="' + id + '-save"><span class="btn__label">' + action + '</span></button>' +
      '</div></footer></div></div>';
  }
  function field(id, label, placeholder, readonly) {
    return '<div class="inp inp--m"><label class="ds-label" for="' + id + '"><span class="ds-label__text">' + label + '</span></label>' +
      '<div class="inp__field" id="' + id + '-field" aria-label="' + label + '">' +
      '<input class="inp__control" id="' + id + '" placeholder="' + placeholder + '" autocomplete="off"' + (readonly ? ' readonly' : '') + '>' +
      '<span class="inp__acts"><button type="button" class="inp__act inp__act--chev" aria-label="Показать список ' + label.toLowerCase() + '"><i data-icon="chevron-down"></i></button></span></div>' +
      '<div id="' + id + '-list" class="ddl ddl--floating ddl--scroll" role="listbox" aria-label="' + label + '" aria-multiselectable="true"></div>' +
      (readonly ? '' : '<div class="inp-ext" id="share-selected" role="group" aria-label="Выбранные пользователи"></div>') + '</div>';
  }
  function option(id, label, helper, checked, all) {
    return '<button type="button" tabindex="-1" class="ddl__item ddl__item--checkbox' + (all ? ' ddl__item--all' : '') + '" role="option" data-value="' + id + '" aria-checked="' + checked + '">' +
      '<span class="ddl__item-check"><span class="cb__box"><span class="cb__mark"><i data-icon="check"></i></span></span></span>' +
      '<span class="ddl__item-body"><span class="ddl__item-label">' + label + '</span>' +
      (helper ? '<span class="ds-helper">' + esc(helper) + '</span>' : '') + '</span></button>';
  }
  function drawPeople() {
    var query = el('share-people').value.trim().toLocaleLowerCase('ru');
    var words = query.split(/\s+/).filter(Boolean);
    var matches = PEOPLE.filter(function (p) {
      return words.every(function (word) { return p.name.toLocaleLowerCase('ru').indexOf(word) !== -1; });
    });
    el('share-people-list').innerHTML = matches.length ? matches.map(function (p) {
      var name = esc(p.name), start = p.name.toLocaleLowerCase('ru').indexOf(query);
      if (query && start !== -1) name = esc(p.name.slice(0, start)) + '<span class="ddl__match">' + esc(p.name.slice(start, start + query.length)) + '</span>' + esc(p.name.slice(start + query.length));
      return option(p.id, name, deskName(p.desk), draft.users.indexOf(p.id) !== -1, false);
    }).join('') : '<div class="ddl__state ddl__state--empty" role="status">Пользователи не найдены</div>';
    window.dsIcons.apply(el('share-people-list'));
    if (peopleApi && peopleApi.isOpen()) peopleApi.place();
  }
  function drawSelection() {
    var selected = PEOPLE.filter(function (p) { return draft.users.indexOf(p.id) !== -1; });
    el('share-selected').innerHTML = selected.map(function (p) {
      return '<span class="chip chip--edit chip--s"><span class="chip__label">' + esc(p.name) + '</span>' +
        '<button type="button" class="chip__remove" data-remove-person="' + p.id + '" aria-label="Убрать ' + esc(p.name) + '"><i data-icon="close"></i></button></span>';
    }).join('');
    el('share-desks').value = DESKS.filter(function (d) { return draft.desks.indexOf(d.id) !== -1; }).map(function (d) { return d.name; }).join(', ');
    el('share-summary').textContent = 'Получателей: ' + recipients(draft).length + '. Владелец чата — Александров Пётр.';
    window.dsIcons.apply(el('share-selected'));
  }
  function prepareShare() {
    draft = read(editingChat.id);
    el('share-chat').textContent = editingChat.title;
    el('share-people').value = '';
    drawPeople();
    el('share-desks-list').innerHTML = option('all', 'Выбрать всё', '', draft.desks.length === DESKS.length ? 'true' : draft.desks.length ? 'mixed' : 'false', true) +
      '<hr class="ddl__divider">' + DESKS.map(function (d) {
        return option(d.id, esc(d.name), 'Пользователей: ' + PEOPLE.filter(function (p) { return p.desk === d.id; }).length, draft.desks.indexOf(d.id) !== -1, false);
      }).join('');
    window.dsIcons.apply(el('share-desks-list'));
    drawSelection();
  }
  function init() {
    var menu = el('hist-menu') || el('row-menu');
    if (!menu) return;
    var content = '<p class="ds-body-m" id="notify-chat"></p><div class="cb-group" role="group" aria-labelledby="notify-channels-title">' +
      '<p class="cb-group__title" id="notify-channels-title">Сообщить о готовности материала</p><div class="cb-group__items">' +
      Object.keys(CHANNELS).map(function (id) {
        return '<label class="cb"><input type="checkbox" class="cb__input" name="notify-channel" value="' + id + '">' +
          '<span class="cb__box"><span class="cb__mark"><i data-icon="check"></i></span></span><span class="cb__content"><span class="cb__label">' + CHANNELS[id] + '</span></span></label>';
      }).join('') + '</div></div><span class="ds-helper ds-helper--left">Настройка действует только для этого чата. Можно выбрать несколько каналов.</span>';
    document.body.insertAdjacentHTML('beforeend', modal('notify', 'Настроить уведомление', content, 'Сохранить', 4));
    menu.insertAdjacentHTML('beforeend', '<button type="button" class="menu__item" role="menuitem" data-chat-settings="notify" data-modal="notify-scrim" data-modal-guarded><span class="menu__item-icon"><i data-icon="settings"></i></span><span class="menu__item-label">Настроить уведомление</span></button>');
    /* Новое действие стоит до разделителя и удаления. */
    menu.insertBefore(menu.lastElementChild, menu.querySelector('.menu__divider') || menu.querySelector('.menu__item--danger'));
    el('notify-save').addEventListener('click', function () {
      var value = read(editingChat.id);
      value.channels = Array.from(document.querySelectorAll('[name="notify-channel"]:checked')).map(function (n) { return n.value; });
      save(editingChat.id, value);
      window.DSModal.closeTop();
      toast('Настройки уведомлений сохранены');
    });

    if (el('hdActions')) {
      menu.insertAdjacentHTML('afterbegin', '<button type="button" class="menu__item" role="menuitem" data-chat-settings="share" data-modal="share-scrim" data-modal-guarded><span class="menu__item-icon"><i data-icon="user"></i></span><span class="menu__item-label">Поделиться</span></button>');
      var label = menu.querySelector('.menu__label');
      if (label) menu.insertBefore(label, menu.firstChild);
      document.body.insertAdjacentHTML('beforeend', modal('share', 'Поделиться чатом',
        '<p class="ds-body-m" id="share-chat"></p>' + field('share-people', 'Пользователи', 'Введите имя или фамилию', false) +
        field('share-desks', 'Дески', 'Выберите один или несколько десков', true) +
        '<span class="ds-helper ds-helper--left">Все пользователи выбранных десков увидят этот чат и его владельца в своей истории чатов. Доступ — для просмотра.</span>' +
        '<p class="ds-body-s" id="share-summary" role="status" aria-live="polite"></p>', 'ОК', 4));
      peopleApi = window.DSDropdownList.bind(el('share-people-field'), { list: el('share-people-list'), multiple: true, onToggle: function (item) {
        var id = item.getAttribute('data-value');
        draft.users = draft.users.filter(function (value) { return value !== id; });
        if (item.getAttribute('aria-checked') === 'true') draft.users.push(id);
        drawSelection();
      } });
      desksApi = window.DSDropdownList.bind(el('share-desks-field'), { list: el('share-desks-list'), multiple: true, onToggle: function () {
        draft.desks = Array.from(el('share-desks-list').querySelectorAll('[data-value]:not(.ddl__item--all)[aria-checked="true"]')).map(function (n) { return n.getAttribute('data-value'); });
        drawSelection();
      } });
      el('share-people').addEventListener('input', function () {
        /* Закрытие сбрасывает активную опцию перед заменой результатов. */
        peopleApi.close(); drawPeople(); peopleApi.open();
      });
      /* Пробел при наборе имени принадлежит полю, а не мультивыбору списка. */
      el('share-people').addEventListener('keydown', function (e) { if (e.key === ' ') e.stopPropagation(); });
      el('share-save').addEventListener('click', function () {
        var value = read(editingChat.id);
        value.users = draft.users.slice(); value.desks = draft.desks.slice();
        save(editingChat.id, value);
        window.DSDropdownList.closeAll(); window.DSModal.closeTop();
        toast(recipients(value).length ? 'Доступ к чату сохранён. Получателей: ' + recipients(value).length : 'Доступ к чату есть только у вас');
      });
      el('share-selected').addEventListener('click', function (e) {
        var remove = e.target.closest('[data-remove-person]');
        if (!remove) return;
        e.preventDefault(); e.stopPropagation();
        draft.users = draft.users.filter(function (id) { return id !== remove.getAttribute('data-remove-person'); });
        drawPeople(); drawSelection(); el('share-people').focus();
      }, true);
    }
    window.dsIcons.apply(menu); window.dsIcons.apply(el('notify-scrim'));
    if (el('share-scrim')) window.dsIcons.apply(el('share-scrim'));
    /* Таймер отрисован скриптом страницы до появления общих диалогов. */
    window.DSModal.bindAll(document);
  }

  /* Запоминаем владельца меню до портала DSFloat и до обработчиков ДС. */
  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-menu="hist-menu"], [data-menu="row-menu"]');
    if (trigger) {
      var row = trigger.closest('[data-thread], .tbl__row');
      var titleNode = row && row.querySelector('.entity__label, .tc__text');
      var title = titleNode ? titleNode.textContent.trim() : '';
      menuChat = row ? { id: row.getAttribute('data-thread') || THREAD_IDS[title] || 'history:' + title, title: title } : provider();
      if (menuChat && menuChat.id === 'new') menuChat = provider();
    }
    var action = e.target.closest('[data-chat-settings]');
    if (!action) return;
    editingChat = action.closest('.menu') ? menuChat : provider();
    if (!editingChat) return;
    if (action.getAttribute('data-chat-settings') === 'notify') {
      var value = read(editingChat.id);
      el('notify-chat').textContent = editingChat.title;
      document.querySelectorAll('[name="notify-channel"]').forEach(function (n) { n.checked = value.channels.indexOf(n.value) !== -1; });
    } else prepareShare();
  }, true);
  /* Рантайм модалки закрывает окно; его списки освобождаются тем же событием. */
  document.addEventListener('click', function (e) {
    if (e.target.closest('#share-scrim [data-modal-close]')) window.DSDropdownList.closeAll();
  }, true);
  window.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' || !e.target.closest('#share-scrim')) return;
    var list = window.DSDropdownList.current();
    if (!list) return;
    /* Capture на window идёт раньше DSModal на document: сначала список,
       следующий Esc отдаётся модальному слою. Сам список закрывает его API. */
    e.preventDefault(); e.stopPropagation(); list.close(true);
  }, true);

  window.PitcherChatSettings = {
    configure: function (current) { provider = current; },
    channels: function (id) { return read(id).channels; },
    recipients: function (id) { return recipients(read(id)); },
    avatars: function (id) {
      var people = recipients(read(id));
      if (!people.length) return '';
      var names = people.map(function (p) { return p.name; }).join(', ');
      return '<span class="av-group av-group--m" role="group" tabindex="0" aria-label="Чат доступен для просмотра: ' + esc(names) + '" data-tooltip="' + esc(names) + '" data-tooltip-multiline="yes">' +
        people.slice(0, 4).map(function (p) {
          var initials = p.name.split(' ').map(function (part) { return part.charAt(0); }).join('');
          return '<span class="av av--circular av--m" aria-hidden="true"><span class="av__text">' + initials + '</span></span>';
        }).join('') + (people.length > 4 ? '<span class="av-group__more" aria-hidden="true">+' + (people.length - 4) + '</span>' : '') + '</span>';
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
