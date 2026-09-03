/* ============================================================
   ds.js — единая точка входа для рантаймов экрана (K0, RulesAudit W0).
   Подключение — один тег в конце body, вместо ручного подбора рантаймов:
     <script src="../../scripts/ds.js"></script>
   Дальше — только скрипт, специфичный для конкретного экрана (если есть).

   Что делает: догружает фиксированный список рантаймов ДС в порядке
   зависимостей (icons-data → ds-icons → остальные). Каждый рантайм сам
   ищет свою разметку и молча ничего не делает, если её нет на странице
   (например ds-modal.js без .modal просто не свяжет ни одного слоя) —
   поэтому список одинаков для любого экрана независимо от набора
   компонентов на нём. Забыть рантайм становится невозможно.

   document.write вставляет теги прямо в поток разбора документа — те же
   гарантии порядка и синхронности, что у ручного списка <script src>,
   поэтому скрипт экрана, идущий следом за ds.js (например
   01-portfolio-v2.screen.js), гарантированно выполняется после того,
   как все рантаймы ниже уже загружены. Работает только пока документ
   ещё разбирается (обычный тег в конце body, без async/defer) — так
   ds.js и подключается везде.

   Добавили новый общий рантайм ds-*.js — впиши его в FILES ниже,
   больше никаких правок на экранах не требуется.
   ============================================================ */
(function () {
  var cur = document.currentScript;
  var base = cur ? cur.src.replace(/[^/]*$/, '') : '';
  var FILES = [
    'icons-data.js',
    'ds-icons.js',
    'ds-tabs.js',
    'ds-tile.js',
    'ds-menu.js',
    'ds-popover.js',
    'ds-riskmetric.js',
    'ds-alert.js',
    'ds-chip.js',
    'ds-allocationbar.js',
    'ds-chart.js',
    'ds-buttongroup.js',
    'ds-table-filter.js',
    'ds-actions-overflow.js',
    'ds-copy.js',
    'ds-tooltip.js',
    'ds-breadcrumbs.js',
    'ds-dropdownlist.js',
    'ds-modal.js',
    'ds-table.js',
    'tbl-resize.js',
    'tbl-reorder.js',
    'ds-pagination.js',
    'ds-notify.js',
    'ds-datepicker.js',
    'input-kit.js',
    'ds-nav-panel.js',
    'ds-splitter.js',
    'ds-illustrations.js',
    'ds-include.js'
  ];
  var html = '';
  FILES.forEach(function (f) { html += '<script src="' + base + f + '"></script>'; });
  document.write(html);
})();
