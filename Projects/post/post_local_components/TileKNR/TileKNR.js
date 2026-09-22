/* ============================================================
   TileKNR.js — строки тайла «КНР» из данных.

   Фрагмент TileKNR.html держит эталон всех состояний, а строки КНР в нём —
   пример с макета. Страница сделки показывает КНР своей сделки: берёт их из
   CounterpartiesStore.knr() и отдаёт сюда. Витрина компонента строит строки
   этой же функцией — разметка строки одна на оба места.

   API:
     PostTileKNR.rowsHTML(list) → строка
       list — [{ name, risk }]: risk — { rating, zone, ratingDate, zoneDate,
       segment, profile } или null (рейтинг не рассчитан — чип без данных).
       Первые два КНР — строками, остальные — строкой «и ещё N КНР» с
       тултипом-списком (multiline: иначе рантайм режет список в одну строку).
     PostTileKNR.render(tile, list)
       Заменяет строки в .lc-knr__list (шапка колонок остаётся) и ставит
       data-state: data — КНР есть, empty — нет. Монтирует RiskMetric, иконки
       и тултип.
   ============================================================ */
(function () {
  'use strict';

  var SHOWN = 2;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function metric(risk) {
    if (!risk) return '<span data-riskmetric></span>';
    var a = ' data-risk="' + esc(risk.rating) + '"';
    if (risk.zone) a += ' data-zone="' + esc(risk.zone) + '"';
    if (risk.ratingDate) a += ' data-rating-date="' + esc(risk.ratingDate) + '"';
    if (risk.zoneDate) a += ' data-zone-date="' + esc(risk.zoneDate) + '"';
    if (risk.segment) a += ' data-segment="' + esc(risk.segment) + '"';
    if (risk.profile) a += ' data-profile="' + esc(risk.profile) + '"';
    return '<span data-riskmetric' + a + '></span>';
  }

  function rowsHTML(list) {
    list = list || [];
    var s = list.slice(0, SHOWN).map(function (k) {
      return '<div class="lc-knr__row">'
        + '<span class="lc-knr__name"><a class="link link--accent link--s" href="#">' + esc(k.name) + '</a></span>'
        + metric(k.risk) + '</div>';
    }).join('');
    var rest = list.slice(SHOWN);
    if (rest.length) {
      s += '<span class="lc-knr__more" tabindex="0" data-tooltip="'
        + esc(rest.map(function (k) { return k.name; }).join(', '))
        + '" data-tooltip-multiline="yes">и ещё ' + rest.length + ' КНР</span>';
    }
    return s;
  }

  function render(tile, list) {
    if (!tile) return;
    list = list || [];
    var box = tile.querySelector('.lc-knr__list');
    if (box) {
      Array.prototype.slice.call(box.children).forEach(function (el) {
        if (!el.classList.contains('lc-knr__head')) box.removeChild(el);
      });
      box.insertAdjacentHTML('beforeend', rowsHTML(list));
    }
    tile.setAttribute('data-state', list.length ? 'data' : 'empty');
    if (window.dsIcons) window.dsIcons.apply(tile);
    if (window.DSRiskMetric) window.DSRiskMetric.mount(tile);
    /* тултип «и ещё N КНР»: ds-tooltip.js обходит [data-tooltip] только на
       загрузке страницы, свежую строку привязываем сами */
    if (window.DSTooltip) window.DSTooltip.bindAll(tile);
  }

  window.PostTileKNR = { rowsHTML: rowsHTML, render: render };
})();
