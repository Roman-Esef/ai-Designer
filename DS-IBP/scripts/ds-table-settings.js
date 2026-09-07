/* =========================================================================
   DS Table Settings (ds-table-settings.js) — стандартная модалка
   «Настройка таблицы» (out-of-box).

   Строит модалку настройки колонок из колонок РЕАЛЬНОЙ таблицы и применяет
   изменения к ней: порядок, видимость, закрепление. Правила (см.
   specs/Table.md «Настройка таблицы»):
     - структура модалки: описание Body M secondary → родительский чекбокс
       «Выбрать все» (indeterminate) → серый divider → список
       [checkbox + pin ibtn M + drag ibtn M справа];
     - футер: «Отменить» (transparent) + «Применить» (accent) справа;
     - мультизакрепление; отложенное применение (снимок колонок на открытие,
       таблица меняется только по «Применить»);
     - перетаскивание за drag-иконку, место вставки — линия --primary;
     - колонки без подписи (.th__label) — «служебные», в настройке не участвуют.

   Хук: data-table-settings на кнопке настроек (ibtn) в тулбаре таблицы.
   Значение атрибута — необязательный CSS-селектор таблицы; без него таблица
   находится по контексту (closest('.dtable') / соседняя .dtable от
   .dtable-toolbar / первый .tbl в контентной области).

   Экспорт: window.DSTableSettings = { bind(trigger), bindAll(root) }.
   Автоподключение: bindAll(document) на DOMContentLoaded.
   ========================================================================= */
(function () {
  'use strict';
  var CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>';
  var MINUS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 12h12"/></svg>';
  var counter = 0;

  /* ---------- поиск таблицы по триггеру ---------- */
  function findTable(trigger) {
    var sel = trigger.getAttribute('data-table-settings');
    if (sel) return document.querySelector(sel);
    var dtable = trigger.closest('.dtable');
    if (dtable) return dtable.querySelector('.tbl');
    var zone = trigger.closest('.dtable-toolbar');
    if (zone) {
      var sib = zone.nextElementSibling;
      while (sib) {
        if (sib.classList && sib.classList.contains('dtable')) return sib.querySelector('.tbl');
        if (sib.querySelector && sib.querySelector('.tbl')) return sib.querySelector('.tbl');
        sib = sib.nextElementSibling;
      }
    }
    var scope = trigger.closest('.screen__content, main, article, section');
    return (scope || document).querySelector('.tbl');
  }

  function isHeadRow(row) {
    return !!row && (row.classList.contains('tbl__row--head') || !!row.querySelector('.th'));
  }
  function headerRowOf(tbl) {
    var r = tbl.querySelector('.tbl__row');
    return r && isHeadRow(r) ? r : null;
  }
  function dataRowsOf(tbl, headerRow) {
    return Array.prototype.filter.call(tbl.querySelectorAll('.tbl__row'), function (r) {
      return r !== headerRow;
    });
  }

  /* ---------- снимок колонок таблицы ---------- */
  /* Колонки: { id, label, pinned, visible, width, headerCell, rowCells }.
     visible/pinned/порядок персистятся на table.__dsTableSettings — повторное
     открытие читает модель, а не DOM (скрытые колонки не в DOM, их ячейки
     удерживаются ссылками rowCells/headerCell). */
  function captureState(table) {
    var headerRow = headerRowOf(table);
    if (!headerRow) return null;
    var dataRows = dataRowsOf(table, headerRow);
    var children = Array.prototype.slice.call(headerRow.children);

    var leadSep = null, trailSep = null;
    children.forEach(function (c) {
      if (c.classList.contains('th--separator')) {
        if (!leadSep) leadSep = c; else trailSep = c;
      }
    });

    var columns = [];
    Array.prototype.forEach.call(headerRow.children, function (th, i) {
      if (th.classList.contains('th--separator')) return;
      var labelEl = th.querySelector('.th__label');
      var label = labelEl ? labelEl.textContent.trim() : '';
      if (!label) return; /* служебные (выбор/действие) — не настраиваются */
      columns.push({
        id: i,
        label: label,
        pinned: th.classList.contains('th--pinned'),
        visible: true,
        width: Math.round(th.getBoundingClientRect().width),
        headerCell: th,
        rowCells: dataRows.map(function (r) { return r.children[i]; })
      });
    });

    return {
      table: table,
      headerRow: headerRow,
      dataRows: dataRows,
      columns: columns,
      leadSep: leadSep,
      trailSep: trailSep,
      dataLead: dataRows.map(function (r) { return r.children[0]; }),
      dataTrail: dataRows.map(function (r) { return r.children[r.children.length - 1]; }),
      leadWidth: Math.round((leadSep || { getBoundingClientRect: function () { return { width: 8 }; } }).getBoundingClientRect().width),
      trailTrack: 'minmax(8px,1fr)'
    };
  }

  /* ---------- применение к таблице ---------- */
  function commit(state, working) {
    var visible = working.filter(function (c) { return c.visible; });
    var tracks = [state.leadWidth + 'px'].concat(
      visible.map(function (c) { return c.width + 'px'; })
    ).concat([state.trailTrack]);
    var gtc = tracks.join(' ');

    /* пересобрать строку: очистить и заново выложить разделитель + видимые
       колонки + разделитель; скрытые колонки остаются вне DOM (detached) */
    function rebuildRow(row, lead, cols, trail) {
      while (row.firstChild) row.removeChild(row.firstChild);
      if (lead) row.appendChild(lead);
      cols.forEach(function (c) { if (c) row.appendChild(c); });
      if (trail) row.appendChild(trail);
      row.style.gridTemplateColumns = gtc;
    }

    rebuildRow(state.headerRow, state.leadSep, visible.map(function (c) { return c.headerCell; }), state.trailSep);
    state.dataRows.forEach(function (row, k) {
      rebuildRow(row, state.dataLead[k], visible.map(function (c) { return c.rowCells[k]; }), state.dataTrail[k]);
    });

    /* закрепление: классы + синхронизация .th__pin в шапке */
    visible.forEach(function (c) {
      c.headerCell.classList.toggle('th--pinned', c.pinned);
      c.rowCells.forEach(function (cell) {
        if (cell && cell !== c.headerCell) cell.classList.toggle('tc--pinned', c.pinned);
      });
      var pinBtn = c.headerCell.querySelector('.th__pin');
      if (pinBtn) {
        pinBtn.setAttribute('aria-pressed', String(c.pinned));
        pinBtn.setAttribute('aria-label', c.pinned ? 'Открепить колонку' : 'Закрепить колонку');
        var slot = pinBtn.querySelector('i[data-icon]');
        if (slot) {
          slot.setAttribute('data-icon', c.pinned ? 'pin-filled' : 'pin');
          slot.innerHTML = '';
          delete slot.dataset.iconDone;
          if (window.dsIcons) window.dsIcons.apply(pinBtn);
        }
      }
    });

    /* персистим модель; скрытые колонки остаются в columns (ячейки вне DOM) */
    state.columns = working;
    state.table.__dsTableSettings = state;

    /* пересчитать sticky-инсеты закреплённых (tbl-pin.js) */
    if (window.DSTablePin && window.DSTablePin.apply) window.DSTablePin.apply(state.table);
    state.table.dispatchEvent(new CustomEvent('columnreorder', { bubbles: true, detail: { from: 0, to: 0 } }));
    state.table.dispatchEvent(new CustomEvent('columnsettings', {
      bubbles: true, detail: {
        columns: working.map(function (c) { return { label: c.label, pinned: c.pinned, visible: c.visible }; })
      }
    }));
  }

  /* ---------- строка списка модалки ---------- */
  function columnListItem(c, idx) {
    return '<li class="col-item" draggable="true" data-idx="' + idx + '">' +
      '<label class="cb' + (c.visible ? ' cb--selected' : '') + '"><input type="checkbox" class="cb__input" data-visible="' + idx + '"' + (c.visible ? ' checked' : '') + '><span class="cb__box"><span class="cb__mark">' + (c.visible ? CHECK : '') + '</span></span><span class="cb__content"><span class="cb__label">' + c.label + '</span></span></label>' +
      '<button type="button" class="ibtn ibtn--neutral ibtn--m col-item__pin" data-pin="' + idx + '" aria-pressed="' + (c.pinned ? 'true' : 'false') + '" aria-label="' + (c.pinned ? 'Открепить колонку' : 'Закрепить колонку') + '"><i data-icon="' + (c.pinned ? 'pin-filled' : 'pin') + '"></i></button>' +
      '<button type="button" class="ibtn ibtn--neutral ibtn--m col-item__drag" draggable="true" aria-label="Перетащить"><i data-icon="drag-dots"></i></button>' +
      '</li>';
  }

  /* ---------- модалка ---------- */
  function buildModalHtml(scrimId, working) {
    var items = working.map(function (c, i) { return columnListItem(c, i); }).join('');
    return '<div class="modal-scrim" id="' + scrimId + '">' +
      '<div class="modal modal--w4" role="dialog" aria-modal="true">' +
        '<header class="modal__head">' +
          '<h2 class="modal__title">Настройка таблицы</h2>' +
          '<button type="button" class="ibtn ibtn--neutral ibtn--l" data-cancel aria-label="Закрыть"><i data-icon="close"></i></button>' +
        '</header>' +
        '<div class="modal__body">' +
          '<p class="col-desc">Выберите столбцы для отображения</p>' +
          '<label class="cb" data-parent><input type="checkbox" class="cb__input"><span class="cb__box"><span class="cb__mark"></span></span><span class="cb__content"><span class="cb__label">Выбрать все</span></span></label>' +
          '<hr class="dvd dvd--h">' +
          '<ul class="col-list">' + items + '</ul>' +
        '</div>' +
        '<footer class="modal__foot">' +
          '<div class="modal__foot-left"></div>' +
          '<div class="modal__foot-right">' +
            '<button type="button" class="btn btn--transparent btn--m" data-cancel><span class="btn__label">Отменить</span></button>' +
            '<button type="button" class="btn btn--accent btn--m" data-apply><span class="btn__label">Применить</span></button>' +
          '</div>' +
        '</footer>' +
      '</div>' +
    '</div>';
  }

  function syncParent(host, cols) {
    var input = host.querySelector('input');
    var mark = host.querySelector('.cb__mark');
    var visible = cols.filter(function (c) { return c.visible; }).length;
    var all = cols.length > 0 && visible === cols.length;
    var some = visible > 0 && visible < cols.length;
    input.checked = all;
    input.indeterminate = some;
    host.classList.toggle('cb--selected', all);
    host.classList.toggle('cb--indeterminate', some);
    mark.innerHTML = all ? CHECK : some ? MINUS : '';
  }

  function openSettings(state) {
    var working = state.columns.map(function (c) { return Object.assign({}, c); });
    var scrimId = 'ds-table-settings-scrim-' + (++counter);
    var wrap = document.createElement('div');
    wrap.innerHTML = buildModalHtml(scrimId, working);
    document.body.appendChild(wrap.firstChild);
    var scrim = document.getElementById(scrimId);
    if (window.dsIcons) window.dsIcons.apply(scrim);

    var list = scrim.querySelector('.col-list');
    var parentBox = scrim.querySelector('[data-parent]');

    function close() {
      document.removeEventListener('keydown', onKey);
      scrim.remove();
    }
    function onKey(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);

    function refreshList() {
      list.innerHTML = working.map(function (c, i) { return columnListItem(c, i); }).join('');
      if (window.dsIcons) window.dsIcons.apply(list);
      syncParent(parentBox, working);
    }
    refreshList();

    scrim.addEventListener('click', function (e) {
      if (e.target === scrim) { close(); return; }
      if (e.target.closest('[data-cancel]')) { close(); return; }
      if (e.target.closest('[data-apply]')) { commit(state, working); close(); return; }
      var pin = e.target.closest('[data-pin]');
      if (pin) {
        var pi = parseInt(pin.getAttribute('data-pin'), 10);
        working[pi].pinned = !working[pi].pinned;
        refreshList();
      }
    });

    scrim.addEventListener('change', function (e) {
      var vis = e.target.closest('[data-visible]');
      if (vis) {
        var vi = parseInt(vis.getAttribute('data-visible'), 10);
        working[vi].visible = e.target.checked;
        refreshList();
        return;
      }
      if (e.target.closest('[data-parent]')) {
        var all = e.target.checked;
        working.forEach(function (c) { c.visible = all; });
        refreshList();
      }
    });

    /* перетаскивание в списке: вся строка draggable, индикатор --primary */
    var dragIdx = null, dropTarget = null, dropBefore = false;
    function clearDrop() {
      list.querySelectorAll('.col-item').forEach(function (el) { el.classList.remove('drop-before', 'drop-after'); });
      dropTarget = null;
    }
    list.addEventListener('dragstart', function (e) {
      var li = e.target.closest('.col-item'); if (!li) return;
      dragIdx = parseInt(li.getAttribute('data-idx'), 10);
      li.classList.add('is-dragging');
    });
    list.addEventListener('dragend', function (e) {
      var li = e.target.closest('.col-item'); if (li) li.classList.remove('is-dragging');
      clearDrop();
    });
    list.addEventListener('dragover', function (e) {
      e.preventDefault();
      var li = e.target.closest('.col-item');
      list.querySelectorAll('.col-item').forEach(function (el) { el.classList.remove('drop-before', 'drop-after'); });
      dropTarget = null;
      if (!li) return;
      var ti = parseInt(li.getAttribute('data-idx'), 10);
      if (ti === dragIdx) return;
      var r = li.getBoundingClientRect();
      dropBefore = (e.clientY - r.top) < (r.height / 2);
      li.classList.add(dropBefore ? 'drop-before' : 'drop-after');
      dropTarget = ti;
    });
    list.addEventListener('dragleave', function (e) {
      if (!list.contains(e.relatedTarget)) clearDrop();
    });
    list.addEventListener('drop', function (e) {
      e.preventDefault();
      var target = dropTarget, before = dropBefore;
      clearDrop();
      if (dragIdx === null || target === null) return;
      var col = working.splice(dragIdx, 1)[0];
      var insertAt = target;
      if (target > dragIdx) insertAt -= 1;
      if (!before) insertAt += 1;
      working.splice(insertAt, 0, col);
      refreshList();
      dragIdx = null;
    });
  }

  /* ---------- привязка триггера ---------- */
  function bind(trigger) {
    if (!trigger || trigger.__dsTableSettingsBound) return;
    trigger.__dsTableSettingsBound = true;
    trigger.addEventListener('click', function (e) {
      e.preventDefault();
      var table = findTable(trigger);
      if (!table) return;
      var state = table.__dsTableSettings || captureState(table);
      if (!state) return;
      if (!table.__dsTableSettings) table.__dsTableSettings = state;
      openSettings(state);
    });
  }
  function bindAll(root) {
    (root || document).querySelectorAll('[data-table-settings]').forEach(bind);
  }
  function boot() { bindAll(document); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.DSTableSettings = { bind: bind, bindAll: bindAll };
})();
