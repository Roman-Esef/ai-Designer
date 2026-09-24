/* ============================================================
   TileDealTerms.js — даты тайла «Сроки сделки» из данных.

   Фрагмент TileDealTerms.html держит эталон всех состояний, а даты в нём —
   пример. Страница сделки показывает даты своей сделки: берёт их из
   DealsStore и отдаёт сюда. Витрина компонента строит поля этой же функцией —
   разметка полей одна на оба места.

   API:
     PostTileDealTerms.fieldsHTML(terms) → строка
       terms — { signDate, endDate, firstDisb }: даты 'ДД.ММ.ГГГГ' или ''.
       Три поля в постоянном порядке; пустая дата — прочерк, поле с места
       не уходит.
     PostTileDealTerms.stateOf(terms) → 'data' | 'partial' | 'empty'
       Все даты пусты — empty, часть — partial, все есть — data.
     PostTileDealTerms.render(tile, terms)
       Заменяет поля в сетке дат и ставит data-state по stateOf.
   ============================================================ */
(function () {
  'use strict';

  /* Порядок полей — порядок отображения (паспорт, «Поля») */
  var FIELDS = [
    { key: 'signDate', label: 'Дата заключения' },
    { key: 'endDate', label: 'Дата окончания' },
    { key: 'firstDisb', label: 'Дата первой выдачи' }
  ];

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function val(terms, key) {
    return String((terms && terms[key]) || '').trim();
  }

  function fieldsHTML(terms) {
    return FIELDS.map(function (f) {
      var v = val(terms, f.key);
      return '<div class="rof">'
        + '<span class="ds-label ds-label--wrap"><span class="ds-label__text">' + f.label + '</span></span>'
        /* Прочерк — значение, а не подсказка, и своего цвета у него нет
           (ReadOnlyField 1.010). */
        + '<div class="rof__row"><span class="rof__value" data-terms-field="' + f.key + '">'
        + (v ? esc(v) : '—') + '</span></div>'
        + '</div>';
    }).join('');
  }

  function stateOf(terms) {
    var filled = FIELDS.filter(function (f) { return val(terms, f.key); }).length;
    if (!filled) return 'empty';
    return filled === FIELDS.length ? 'data' : 'partial';
  }

  function render(tile, terms) {
    if (!tile) return;
    var grid = tile.querySelector('.lc-deal-terms__grid:not(.lc-deal-terms__loading)');
    if (grid) grid.innerHTML = fieldsHTML(terms);
    tile.setAttribute('data-state', stateOf(terms));
  }

  window.PostTileDealTerms = { fieldsHTML: fieldsHTML, stateOf: stateOf, render: render };
})();
