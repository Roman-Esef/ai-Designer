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

   Хранение на время сессии (opt-in): data-table-persist="<ключ>" на .tbl.
   В sessionStorage (ключ ds.table-settings.<ключ>) пишется вид таблицы:
     колонки — порядок, видимость, закрепление и ширина: после «Применить»,
       переноса за подпись, булавки в шапке и ручки ширины;
     сортировка — после каждого события sort;
     скролл тела — при уходе со страницы (pagehide).
   На загрузке страницы всё возвращается в этом порядке: колонки →
   сортировка (событие sort с restored: true) → скролл — последним, когда
   строки, страница пагинации и ширины уже на месте. Колонки опознаются по
   data-col на .th. Хранилище живёт, пока открыта вкладка браузера.

   Экспорт: window.DSTableSettings = { bind(trigger), bindAll(root), restore(table) }.
   Автоподключение: bindAll(document) и восстановление на DOMContentLoaded.
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
        /* ключ колонки (data-col) — по нему ячейка строки, дописанной экраном
           уже после снимка, находит свою колонку (см. syncRows) */
        key: th.dataset.col || '',
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

  /* ---------- модель догоняет состав строк ---------- */
  /* Снимок колонок делается один раз и живёт на таблице: пересоздать его
     нельзя — ссылки на ячейки СКРЫТЫХ колонок держит только он, в DOM их нет.
     Но состав строк между открытиями меняется: реестр дописывает сделки мимо
     рантайма. Поэтому модель не пересоздаётся, а догоняет DOM — ушедшие строки
     выбрасываются, пришедшие дописываются.
     Видимая ячейка новой строки берётся по позиции (adoptRow из ds-table.js
     уже привёл строку к форме шапки: разделитель + видимые колонки +
     разделитель), ячейка скрытой колонки — со склада row.__dsColCells.
     Строка, в которой нашлась не каждая колонка (нет data-col, разъехалась
     разметка), в модель не берётся: неполный набор ячеек при «Применить»
     собрал бы строку короче шапки, и всё правее съехало бы на трек. */
  function syncRows(state) {
    var rows = dataRowsOf(state.table, state.headerRow);
    var visible = state.columns.filter(function (c) { return c.visible; });
    var nextRows = [], nextLead = [], nextTrail = [];
    var nextCells = state.columns.map(function () { return []; });

    rows.forEach(function (row) {
      var known = state.dataRows.indexOf(row);
      var cells = state.columns.map(function (c, ci) {
        if (known >= 0) return c.rowCells[known];
        if (c.visible) return row.children[visible.indexOf(c) + 1];
        return c.key ? (row.__dsColCells || {})[c.key] : null;
      });
      if (known < 0 && row.children.length !== visible.length + 2) return;
      for (var ci = 0; ci < cells.length; ci++) if (!cells[ci]) return;

      nextRows.push(row);
      nextLead.push(row.children[0]);
      nextTrail.push(row.children[row.children.length - 1]);
      cells.forEach(function (cell, ci) { nextCells[ci].push(cell); });
    });

    state.dataRows = nextRows;
    state.dataLead = nextLead;
    state.dataTrail = nextTrail;
    state.columns.forEach(function (c, ci) { c.rowCells = nextCells[ci]; });
  }

  /* ---------- модель догоняет шапку ---------- */
  /* Порядок и закрепление меняют и мимо модалки: перенос за подпись
     (tbl-reorder.js), булавка в шапке (tbl-pin.js), ширину — ручка
     (tbl-resize.js). Модель об этом не знала, и следующее «Применить»
     откатывало такие правки к снимку. Поэтому видимые колонки перед каждым
     использованием модели берут из шапки порядок, закрепление и ширину;
     скрытые остаются на своих местах в списке — в шапке их нет. */
  function syncHeader(state) {
    var cells = Array.prototype.slice.call(state.headerRow.children);
    var visible = state.columns.filter(function (c) { return c.visible; });
    if (visible.some(function (c) { return cells.indexOf(c.headerCell) < 0; })) return;
    visible.sort(function (a, b) { return cells.indexOf(a.headerCell) - cells.indexOf(b.headerCell); });
    var vi = 0;
    state.columns = state.columns.map(function (c) { return c.visible ? visible[vi++] : c; });
    visible.forEach(function (c) {
      c.pinned = c.headerCell.classList.contains('th--pinned');
      var w = Math.round(c.headerCell.getBoundingClientRect().width);
      if (w > 0) c.width = w;
    });
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

    /* ячейки скрытых колонок уходят из DOM и ждут на СВОЕЙ строке — тогда
       склад один и тот же для строк разметки и для строк, дописанных экраном
       (их туда кладёт adoptRow из ds-table.js), и syncRows берёт оттуда же */
    working.forEach(function (c) {
      if (c.visible || !c.key) return;
      c.rowCells.forEach(function (cell, k) {
        var row = state.dataRows[k];
        if (!cell || !row) return;
        if (!row.__dsColCells) row.__dsColCells = {};
        row.__dsColCells[c.key] = cell;
      });
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
      else {
        syncRows(state);     /* строки могли добавиться после снимка */
        syncHeader(state);   /* порядок и булавки могли поменять в шапке */
      }
      openSettings(state);
    });
  }
  function bindAll(root) {
    (root || document).querySelectorAll('[data-table-settings]').forEach(bind);
  }

  /* ---------- хранение на время сессии: data-table-persist ---------- */
  /* Запись — { v, columns: [{ key, visible, pinned, width }] в порядке колонок,
     sort: { column, dir }, scroll: { top, left } }. Колонку узнаём по
     data-col: индекс ненадёжен, порядок как раз и хранится. Части записи
     пишутся в разное время (колонки — по событию, скролл — на уходе), поэтому
     запись дополняется, а не перезаписывается. width, sort и scroll
     необязательны — запись без них (Table 1.017) читается как есть.
     Хранилище может быть недоступно (приватный режим, запрет сайта) — тогда
     таблица просто работает без памяти, все обращения в try/catch. */
  var STORE_PREFIX = 'ds.table-settings.';
  var warned = [];

  function persistKey(table) {
    var key = table && table.getAttribute('data-table-persist');
    return key ? STORE_PREFIX + key : null;
  }
  function readStore(key) {
    try {
      var raw = window.sessionStorage.getItem(key);
      var data = raw ? JSON.parse(raw) : null;
      return data && data.v === 1 && Array.isArray(data.columns) ? data : null;
    } catch (e) { return null; }
  }
  function writeStore(key, patch) {
    var data = readStore(key) || { v: 1, columns: [] };
    Object.keys(patch).forEach(function (k) { data[k] = patch[k]; });
    try { window.sessionStorage.setItem(key, JSON.stringify(data)); } catch (e) { /* без памяти */ }
  }

  /* Без ключа у настраиваемой колонки хранить нечего: восстановленный порядок
     не на что было бы сопоставить. Предупреждаем один раз на таблицу. */
  function keysComplete(table, cols) {
    if (cols.every(function (c) { return !!c.key; })) return true;
    if (warned.indexOf(table) < 0) {
      warned.push(table);
      if (window.console) console.warn('[ds-table-settings] data-table-persist: у колонки шапки нет data-col — настройки колонок не сохраняются');
    }
    return false;
  }

  /* текущее состояние колонок: из модели, если настройку уже открывали
     (в ней и скрытые колонки), иначе прямо из шапки — там все видимы */
  function currentColumns(table) {
    var state = table.__dsTableSettings;
    if (state) {
      syncHeader(state);
      return state.columns.map(function (c) { return { key: c.key, visible: c.visible, pinned: c.pinned, width: c.width }; });
    }
    var headerRow = headerRowOf(table);
    if (!headerRow) return null;
    var out = [];
    Array.prototype.forEach.call(headerRow.children, function (th) {
      if (th.classList.contains('th--separator')) return;
      var labelEl = th.querySelector('.th__label');
      if (!labelEl || !labelEl.textContent.trim()) return;
      out.push({
        key: th.dataset.col || '', visible: true, pinned: th.classList.contains('th--pinned'),
        width: Math.round(th.getBoundingClientRect().width)
      });
    });
    return out;
  }

  function save(table) {
    var key = persistKey(table);
    if (!key) return;
    var cols = currentColumns(table);
    if (!cols || !keysComplete(table, cols)) return;
    writeStore(key, { columns: cols });
  }

  /* Колонки: снимок колонок → рабочий список в сохранённом порядке с
     сохранёнными видимостью, закреплением и шириной → то же применение, что
     у «Применить» (commit строит треки из width). Колонка, которой в записи
     нет (появилась в разметке позже), встаёт на свой исходный индекс; ключ
     записи, которого в шапке больше нет, пропускается. Ширина берётся любая
     положительная: минимум ручки (96px) — ограничение перетаскивания, а в
     разметке бывают колонки и уже (флаг, признак). */
  function restoreColumns(table, saved) {
    var headerRow = headerRowOf(table);
    if (!headerRow) return false;
    /* не отрисованная таблица (display:none — например, экран показал вместо
       неё пустое состояние) даёт нулевые ширины, и применение записало бы
       нулевые треки. Сейчас её не трогаем, а ждём, пока она появится */
    if (!headerRow.getBoundingClientRect().width) { whenRendered(table); return false; }
    var state = table.__dsTableSettings || captureState(table);
    if (!state || !keysComplete(table, state.columns)) return false;
    if (table.__dsTableSettings) { syncRows(state); syncHeader(state); }

    var byKey = {};
    state.columns.forEach(function (c) { byKey[c.key] = c; });
    var used = {};
    var working = [];
    saved.columns.forEach(function (s) {
      var c = s && byKey[s.key];
      if (!c || used[s.key]) return;
      used[s.key] = true;
      var width = (typeof s.width === 'number' && s.width > 0) ? Math.round(s.width) : c.width;
      working.push(Object.assign({}, c, { visible: s.visible !== false, pinned: !!s.pinned, width: width }));
    });
    state.columns.forEach(function (c, i) {
      if (used[c.key]) return;
      working.splice(Math.min(i, working.length), 0, Object.assign({}, c));
    });

    var same = working.length === state.columns.length && working.every(function (w, i) {
      var c = state.columns[i];
      return w.key === c.key && w.visible === c.visible && w.pinned === c.pinned && w.width === c.width;
    });
    if (same) return false;
    table.__dsTableSettings = state;
    commit(state, working);
    return true;
  }

  /* Таблица появится позже (экран уберёт пустое состояние) — колонки
     применяются тогда. Без этого она показалась бы в исходном виде, а первая
     же правка колонок затёрла бы запись исходными. Один наблюдатель на
     таблицу, после применения отключается. */
  function whenRendered(table) {
    if (table.__dsPersistWait || !window.ResizeObserver) return;
    var ro = new ResizeObserver(function () {
      var headerRow = headerRowOf(table);
      if (!headerRow || !headerRow.getBoundingClientRect().width) return;
      ro.disconnect();
      table.__dsPersistWait = null;
      var saved = readStore(persistKey(table));
      if (saved) restoreColumns(table, saved);
    });
    table.__dsPersistWait = ro;
    ro.observe(table);
  }

  /* Сортировка: текущую читаем с кнопок шапки (стартовую рисует разметка через
     aria-sort) и при совпадении с записью не трогаем. Применяет рантайм
     таблицы с флагом restored: событие sort говорит экрану, что это возврат,
     а не клик, — экран с пагинацией оставляет страницу. dir 'none' — «без
     сортировки»: снимается той кнопкой, что активна сейчас. Кнопка скрытой
     колонки в DOM не стоит — такая сортировка молча не применяется. */
  function restoreSort(table, saved) {
    var s = saved.sort;
    if (!s || !s.column || !window.DSTable || !table.hasAttribute('data-table')) return false;
    var active = null;
    table.querySelectorAll('[data-sort]').forEach(function (b) {
      if (b.dataset.sortDir && b.dataset.sortDir !== 'none') active = b;
    });
    var want = (s.dir === 'asc' || s.dir === 'desc') ? s.dir : 'none';
    var api = window.DSTable.wire(table);
    if (want === 'none') {
      if (!active) return false;
      api.sort(active.dataset.sort, 'none', { restored: true });
      return true;
    }
    if (active && active.dataset.sort === String(s.column) && active.dataset.sortDir === want) return false;
    api.sort(String(s.column), want, { restored: true });
    return true;
  }

  /* Скролл тела: контейнер — .dtable__body вокруг таблицы, у таблицы без
     обёртки (.tbl--scroll) — она сама. Возвращается последним, иначе
     упрётся в высоту и ширину до пагинации, сортировки и ширин колонок.
     Скрытую таблицу не прокручиваем — прокручивать нечего. */
  function scrollerOf(table) { return table.closest('.dtable__body') || table; }
  function restoreScroll(table, saved) {
    var s = saved.scroll;
    if (!s || !table.getBoundingClientRect().width) return false;
    var box = scrollerOf(table);
    box.scrollTop = +s.top || 0;
    box.scrollLeft = +s.left || 0;
    return true;
  }
  function saveScroll(table) {
    var key = persistKey(table);
    if (!key) return;
    var box = scrollerOf(table);
    writeStore(key, { scroll: { top: Math.round(box.scrollTop), left: Math.round(box.scrollLeft) } });
  }

  /* Восстановление вида: колонки → сортировка → скролл. Порядок обязателен:
     сортировка переставляет строки, и экран по её событию пересчитывает окно
     пагинации, а скролл имеет смысл только на окончательной раскладке. */
  function restore(table) {
    var key = persistKey(table);
    if (!key) return false;
    var saved = readStore(key);
    if (!saved) return false;
    var cols = restoreColumns(table, saved);
    var sorted = restoreSort(table, saved);
    var scrolled = restoreScroll(table, saved);
    return cols || sorted || scrolled;
  }

  /* запись колонок — на любое их изменение: «Применить» (columnsettings),
     перенос за подпись (columnreorder), булавка в шапке (columnpin), ручка
     ширины (columnresize) */
  ['columnsettings', 'columnreorder', 'columnpin', 'columnresize'].forEach(function (type) {
    document.addEventListener(type, function (e) {
      var t = e.target;
      if (t && t.matches && t.matches('.tbl[data-table-persist]')) save(t);
    });
  });
  /* сортировка — по её событию; восстановленная пишется тем же значением */
  document.addEventListener('sort', function (e) {
    var t = e.target;
    if (!t || !t.matches || !t.matches('.tbl[data-table-persist]')) return;
    var d = e.detail || {};
    if (d.column) writeStore(persistKey(t), { sort: { column: String(d.column), dir: d.dir || 'none' } });
  });
  /* скролл меняется непрерывно — пишем один раз, при уходе со страницы */
  window.addEventListener('pagehide', function () {
    document.querySelectorAll('.tbl[data-table-persist]').forEach(saveScroll);
  });

  function boot() {
    bindAll(document);
    document.querySelectorAll('.tbl[data-table-persist]').forEach(restore);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.DSTableSettings = { bind: bind, bindAll: bindAll, restore: restore };
})();
