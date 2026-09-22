/* ============================================================
   CardCounterparty.js — оживление шаблона карточки контрагента.

   Компонент отдаёт эталон разметки в <template id="lc-cpcard-tpl">, а данные
   приходят из стора (window.CounterpartiesStore). Этот модуль — единственное
   место, где данные раскладываются по слотам шаблона: и модалка КНР, и витрина
   компонента рисуют карточки им, поэтому вид не может разойтись между ними.

   Слоты шаблона помечены data-cp: name · subheader · risk · fields · knr.

   API:
     PostCardCounterparty.render(item, opts) → HTMLElement
       item — запись стора (см. data/mock-counterparties.js)
       opts.mode — 'edit' (кнопка переноса есть) | 'view' (её нет, а отметка
                   «КНР» видна, но выключена — в просмотре её не меняют);
                   по умолчанию edit
       opts.disabled — карточка видна, но недоступна: состояние Disabled у
                       Card из ДС (aria-disabled="true") плюс inert — кнопка
                       переноса, чекбокс и чип метрики не берут фокус с клавиатуры
       opts.moveLabel — подпись и подсказка кнопки переноса: куда она переносит

   Правила предметной области сюда НЕ дублируются: что риск-метрика, ГСЗ и
   чекбокс КНР принадлежат участнику сделки, решает стор и CSS компонента.
   Здесь только раскладка значений по слотам.
   ============================================================ */
(function () {
  'use strict';

  var TPL_ID = 'lc-cpcard-tpl';

  function tpl() {
    var t = document.getElementById(TPL_ID);
    if (!t) return null;
    return t;
  }

  /* Пара «лейбл — значение» в сетке полей. Лейбл и значение — прямые дети
     сетки, а не обёрнутая строка: иначе колонки не выровняются между строками. */
  function addField(grid, label, value) {
    var l = document.createElement('span');
    l.className = 'lc-knrm__flabel';
    l.textContent = label;
    var v = document.createElement('span');
    v.className = 'lc-knrm__fvalue';
    v.textContent = value;
    grid.appendChild(l);
    grid.appendChild(v);
  }

  function render(item, opts) {
    var t = tpl();
    if (!t || !item) return null;
    opts = opts || {};

    var card = t.content.firstElementChild.cloneNode(true);
    card.setAttribute('data-knr-card', item.id);
    card.setAttribute('data-state', item.place === 'member' ? 'member' : 'found');
    card.setAttribute('data-mode', opts.mode === 'view' ? 'view' : 'edit');
    /* Disabled — состояние Card из ДС: вид (полупрозрачность, курсор) и отказ от
       указателя даёт tile.css. Клавиатуру ДС не закрывает — это делает inert. */
    if (opts.disabled) {
      card.setAttribute('aria-disabled', 'true');
      card.inert = true;
    }

    card.querySelector('[data-cp="name"]').textContent = item.name || '';
    card.querySelector('[data-cp="subheader"]').textContent = item.subheader || '';

    var moveBtn = card.querySelector('[data-knr-move]');
    if (moveBtn && opts.moveLabel) {
      moveBtn.setAttribute('aria-label', opts.moveLabel);
      moveBtn.setAttribute('data-tooltip', opts.moveLabel);
    }

    /* Риск-метрика: рантайм ДС собирает чип и поповер сам из атрибутов. Пустой
       слот остаётся пустым span — у найденного контрагента его прячет CSS. */
    var risk = card.querySelector('[data-cp="risk"]');
    if (item.risk) {
      risk.setAttribute('data-risk', item.risk.rating);
      if (item.risk.zone) risk.setAttribute('data-zone', item.risk.zone);
      if (item.risk.ratingDate) risk.setAttribute('data-rating-date', item.risk.ratingDate);
      if (item.risk.zoneDate) risk.setAttribute('data-zone-date', item.risk.zoneDate);
      if (item.risk.segment) risk.setAttribute('data-segment', item.risk.segment);
      if (item.risk.profile) risk.setAttribute('data-profile', item.risk.profile);
    } else if (risk) {
      risk.parentNode.removeChild(risk);
    }

    /* Состав полей у разных контрагентов разный — это контент, а не вариант.
       ГСЗ и контакты появляются только у участника сделки: в данных найденного
       их просто нет. */
    var grid = card.querySelector('[data-cp="fields"]');
    (item.fields || []).forEach(function (pair) { addField(grid, pair[0], pair[1]); });
    if (item.place === 'member') {
      (item.contacts || []).forEach(function (pair) { addField(grid, pair[0], pair[1]); });
      if (item.gsz) addField(grid, 'ГСЗ', item.gsz);
    }

    /* Отметка «КНР» — правка состава сделки: в просмотре она остаётся видна,
       но не переключается. Вид выключенного чекбокса даёт Checkbox из ДС. */
    var box = card.querySelector('[data-cp="knr"]');
    if (box) {
      box.checked = !!item.knr;
      box.disabled = opts.mode === 'view';
    }

    /* Пустая контентная область оставила бы под шапкой полосу своих отступов —
       у найденного физлица показывать в ней нечего. */
    var body = card.querySelector('.tile__body');
    if (body && !grid.children.length && item.place !== 'member') {
      body.parentNode.removeChild(body);
    }

    if (window.dsIcons) window.dsIcons.apply(card);
    /* Подсказка кнопки переноса: ds-tooltip.js обходит [data-tooltip] только
       на загрузке страницы, а карточки рисуются позже — привязываем здесь,
       чтобы она работала у любого потребителя. */
    if (window.DSTooltip) window.DSTooltip.bindAll(card);
    return card;
  }

  window.PostCardCounterparty = { render: render, templateId: TPL_ID };
})();
