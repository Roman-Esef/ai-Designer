/* ============================================================
   TileDealTeam.js — роли тайла «Команда сделки» из данных.

   Фрагмент TileDealTeam.html держит эталон всех состояний, а ФИО в нём —
   пример. Страница сделки показывает команду своей сделки: берёт её из
   DealsStore и отдаёт сюда. Витрина компонента строит поля этой же функцией —
   разметка полей одна на оба места.

   Тайл показывает ШЕСТЬ ролей из тринадцати (паспорт, «Поля»): это обзор, а
   не весь состав. Остальные роли, «Другие участники» и признак ограниченного
   доступа правятся и читаются в окне (TileDealTeamModal).

   API:
     PostTileDealTeam.fieldsHTML(team) → строка
       team — запись сделки: ФИО по ключу роли, '' или отсутствует — не назначен.
       Шесть полей в постоянном порядке; неназначенная роль — прочерк, поле с
       места не уходит.
     PostTileDealTeam.stateOf(team) → 'data' | 'partial' | 'empty'
       Ни одной роли — empty, часть — partial, все шесть — data. Заполнять все
       роли не требуется: у разных сделок свой обязательный состав, поэтому
       partial — штатное состояние тайла, а не дефект.
     PostTileDealTeam.render(tile, team)
       Заменяет поля в сетке ролей, ставит data-state по stateOf и
       data-restricted по признаку сделки.
   ============================================================ */
(function () {
  'use strict';

  /* Порядок полей — порядок отображения (паспорт, «Поля»). Сетка тайла в две
     колонки заполняется построчно, поэтому порядок здесь — как читается:
     слева направо, сверху вниз. */
  var FIELDS = [
    { key: 'desk', label: 'Деск' },
    { key: 'tsupEmployee', label: 'Сотрудник ЦУП' },
    { key: 'director', label: 'Директор' },
    { key: 'clientManager', label: 'Клиентский менеджер' },
    { key: 'manager', label: 'Менеджер сделки' },
    { key: 'creditInspector', label: 'Кредитный инспектор' }
  ];

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function val(team, key) {
    return String((team && team[key]) || '').trim();
  }

  function fieldsHTML(team) {
    return FIELDS.map(function (f) {
      var v = val(team, f.key);
      /* Незаполненная роль — прочерк, и прочерк набирается как обычное
         значение: он не подсказка, а то, что известно о роли (ReadOnlyField
         1.010). Приглушённый прочерк читался бы как выключенное поле. */
      return '<div class="rof">'
        + '<span class="ds-label ds-label--wrap"><span class="ds-label__text">' + f.label + '</span></span>'
        + '<div class="rof__row"><span class="rof__value" data-team-field="' + f.key + '">'
        + (v ? esc(v) : '—') + '</span></div>'
        + '</div>';
    }).join('');
  }

  function stateOf(team) {
    var filled = FIELDS.filter(function (f) { return val(team, f.key); }).length;
    if (!filled) return 'empty';
    return filled === FIELDS.length ? 'data' : 'partial';
  }

  /* Признак сделки ограниченного доступа хранится строкой «Да» / «Нет»
     (mock-deals.js, поле restricted) — как остальные да/нет реестра. */
  function isRestricted(team) {
    return String((team && team.restricted) || '').trim() === 'Да';
  }

  function render(tile, team) {
    if (!tile) return;
    var grid = tile.querySelector('.lc-deal-team__grid:not(.lc-deal-team__loading)');
    if (grid) grid.innerHTML = fieldsHTML(team);
    tile.setAttribute('data-state', stateOf(team));
    if (isRestricted(team)) tile.setAttribute('data-restricted', 'yes');
    else tile.removeAttribute('data-restricted');
  }

  window.PostTileDealTeam = {
    FIELDS: FIELDS,
    fieldsHTML: fieldsHTML,
    stateOf: stateOf,
    isRestricted: isRestricted,
    render: render
  };
})();
