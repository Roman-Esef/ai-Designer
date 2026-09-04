(function () {
  'use strict';
  var CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>';
  var MINUS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 12h12"/></svg>';

  var ROWS = [
    { name: 'ООО «ЮгСтрой»',      amount: '1 240 500,00', status: ['success', 'Активна'], owner: 'Иванова А.' },
    { name: 'АО «Ресурс-Инвест»', amount: '860 000,00',   status: ['warning', 'На проверке'], owner: 'Петров С.' },
    { name: 'ИП Смирнов Д. В.',   amount: '312 750,00',   status: ['error', 'Просрочена'], owner: 'Иванова А.' },
    { name: 'ООО «Восток Трейд»', amount: '2 005 000,00', status: ['success', 'Активна'], owner: 'Кузьмин П.' },
    { name: 'ООО «Балт Логистик»',amount: '95 400,00',    status: ['info', 'Новая'], owner: 'Петров С.' }
  ];

  var PRESETS = [
    { name: 'Мои сделки ЦА', count: 3 },
    { name: 'Просроченные',  count: 5 }
  ];

  function defaultColumns() {
    return [
      { key: 'select',  w: 44,  fixed: true },
      { key: 'name',    label: 'Контрагент',      w: 220, sort: 'none' },
      { key: 'amount',  label: 'Сумма, RUB',        w: 140, numbers: true, sort: 'none' },
      { key: 'status',  label: 'Статус',          w: 120, sort: 'none' },
      { key: 'owner',   label: 'Ответственный',   w: 180, sort: 'none' },
      { key: 'actions', label: 'Действие', w: 92, fixed: true }
    ];
  }
  var state = { columns: defaultColumns(), selected: {} };

  function movableCols() { return state.columns.filter(function (c) { return !c.fixed; }); }

  /* КАЖДАЯ колонка — фиксированная ширина в px; меняется только та, за чью
     ручку тянут, остальные лишь смещаются. Свободное место справа забирает
     замыкающий разделитель (minmax(8px,1fr)) — так таблица всегда тянется
     на всю ширину контейнера, см. TableCell «Поведение · ширина колонки». */
  function gridTemplate(cols) {
    var tracks = cols.map(function (c) { return c.w + 'px'; });
    return ['8px'].concat(tracks).concat(['minmax(8px,1fr)']).join(' ');
  }

  function sortGlyph(c) { return c.sort === 'asc' ? 'arrow-narrow-up' : c.sort === 'desc' ? 'arrow-narrow-down' : 'arrow-up-down'; }
  function ariaSort(c) { return c.sort === 'asc' ? 'ascending' : c.sort === 'desc' ? 'descending' : 'none'; }

  function togglePin(idx) {
    var wasPinned = state.columns[idx].pinned;
    state.columns.forEach(function (c) { c.pinned = false; });
    if (!wasPinned) {
      state.columns[idx].pinned = true;
      var col = state.columns.splice(idx, 1)[0];
      var firstMovable = state.columns.findIndex(function (c) { return !c.fixed; });
      state.columns.splice(firstMovable, 0, col);
    }
  }

  function cycleSort(idx) {
    var col = state.columns[idx];
    var next = col.sort === 'none' ? 'asc' : col.sort === 'asc' ? 'desc' : 'none';
    state.columns.forEach(function (c) { if (!c.fixed) c.sort = 'none'; });
    col.sort = next;
  }

  function headerRow(cols) {
    var total = ROWS.length;
    var selCount = Object.keys(state.selected).filter(function (k) { return state.selected[k]; }).length;
    var allSel = selCount > 0 && selCount === total;
    var partial = selCount > 0 && !allSel;
    var cb = '<label class="cb cb--no-content' + (allSel ? ' cb--selected' : '') + (partial ? ' cb--indeterminate' : '') + '"><input type="checkbox" class="cb__input" data-select-all' + (allSel ? ' checked' : '') + '><span class="cb__box"><span class="cb__mark">' + (allSel ? CHECK : (partial ? MINUS : '')) + '</span></span></label>';
    var cells = cols.map(function (c, i) {
      if (c.key === 'select') return '<div class="th th--center" data-col-idx="' + i + '">' + cb + '<span class="th__resize" data-resize-idx="' + i + '" role="separator" aria-orientation="vertical" tabindex="0" aria-label="Изменить ширину колонки"></span></div>';
      if (c.key === 'actions') return '<div class="th th--center" data-col-idx="' + i + '"><span class="th__label">' + c.label + '</span><span class="th__resize" data-resize-idx="' + i + '" role="separator" aria-orientation="vertical" tabindex="0" aria-label="Изменить ширину колонки"></span></div>';
      return '<div class="th th--movable' + (c.numbers ? ' th--right' : '') + (c.pinned ? ' th--pinned' : '') + (c.sort !== 'none' ? ' th--sorted' : '') + '" data-col-idx="' + i + '" aria-sort="' + ariaSort(c) + '">' +
        '<span class="th__label" data-drag-idx="' + i + '">' + c.label + '</span>' +
        '<span class="th__tools">' +
          '<button class="ibtn ibtn--neutral ibtn--s th__pin" data-pin-idx="' + i + '" aria-pressed="' + (c.pinned ? 'true' : 'false') + '" aria-label="' + (c.pinned ? 'Открепить колонку' : 'Закрепить колонку') + '"><i data-icon="' + (c.pinned ? 'pin-filled' : 'pin') + '"></i></button>' +
          '<button class="ibtn ibtn--neutral ibtn--s th__sort" data-sort-idx="' + i + '" aria-label="Сортировать"><i data-icon="' + sortGlyph(c) + '"></i></button>' +
        '</span>' +
        '<span class="th__resize" data-resize-idx="' + i + '" role="separator" aria-orientation="vertical" tabindex="0" aria-label="Изменить ширину колонки"></span>' +
        '</div>';
    }).join('');
    return '<div class="tbl__row" style="grid-template-columns:' + gridTemplate(cols) + ';">' +
      '<div class="th th--separator"></div>' + cells + '<div class="th th--separator"></div>' +
      '</div>';
  }

  function cellHtml(c, i, r, rowIdx) {
    if (c.key === 'select') {
      var sel = !!state.selected[rowIdx];
      return '<div class="tc tc--center" data-col-idx="' + i + '"><label class="cb cb--no-content' + (sel ? ' cb--selected' : '') + '"><input type="checkbox" class="cb__input" data-row-idx="' + rowIdx + '"' + (sel ? ' checked' : '') + '><span class="cb__box"><span class="cb__mark">' + (sel ? CHECK : '') + '</span></span></label></div>';
    }
    if (c.key === 'actions') return '<div class="tc tc--center" data-col-idx="' + i + '"><div class="tc__controls"><button class="ibtn ibtn--neutral ibtn--s" aria-label="Изменить"><i data-icon="edit"></i></button><button class="ibtn ibtn--neutral ibtn--s" aria-label="Удалить строку" data-row-delete="' + rowIdx + '"><i data-icon="trash"></i></button></div></div>';
    var pinCls = c.pinned ? ' tc--pinned' : '';
    if (c.key === 'name' || c.key === 'owner') return '<div class="tc' + pinCls + '" data-col-idx="' + i + '"><span class="tc__row"><span class="tc__text tc__text--truncate">' + r[c.key] + '</span></span></div>';
    if (c.key === 'amount') return '<div class="tc tc--numbers' + pinCls + '" data-col-idx="' + i + '"><span class="tc__row"><span class="tc__text">' + r.amount + '</span></span></div>';
    if (c.key === 'status') return '<div class="tc' + pinCls + '" data-col-idx="' + i + '"><span class="chip chip--s chip--' + r.status[0] + '"><span class="chip__label">' + r.status[1] + '</span></span></div>';
    return '<div class="tc' + pinCls + '" data-col-idx="' + i + '"></div>';
  }

  function dataRow(r, rowIdx, cols) {
    var selected = !!state.selected[rowIdx];
    var cells = cols.map(function (c, i) { return cellHtml(c, i, r, rowIdx); }).join('');
    return '<div class="tbl__row' + (selected ? ' tbl__row--selected' : '') + '" style="grid-template-columns:' + gridTemplate(cols) + ';">' +
      '<div class="tc tc--separator"></div>' + cells + '<div class="tc tc--separator"></div>' +
      '</div>';
  }

  function skeletonRow(cols) {
    var cells = cols.map(function (c, i) {
      if (c.key === 'select' || c.key === 'actions') return '<div class="tc" data-col-idx="' + i + '"></div>';
      return '<div class="tc tc--skeleton" data-col-idx="' + i + '" aria-busy="true"><span class="sk-line sk-line--caption" style="--sk-w:60%"></span></div>';
    }).join('');
    return '<div class="tbl__row" style="grid-template-columns:' + gridTemplate(cols) + ';">' +
      '<div class="tc tc--separator"></div>' + cells + '<div class="tc tc--separator"></div>' +
      '</div>';
  }

  function paginationRow(bulkCount, total) {
    var out = '';
    if (bulkCount > 0) {
      out += '<div class="pgn-row pgn-row--bulk"><div class="pgn-bulk">' +
        '<span class="pgn-bulk__count" aria-live="polite">Выбрано: <b>' + bulkCount + '</b> из ' + total + '</span>' +
        '<span class="pgn-bulk__actions">' +
          '<button class="btn btn--outline btn--s"><i data-icon="download"></i><span class="btn__label">Экспорт</span></button>' +
          '<button class="btn btn--outline btn--error btn--s"><i data-icon="trash"></i><span class="btn__label">Удалить</span></button>' +
        '</span></div></div>';
    }
    out += '<div class="pgn-row">' +
      '<div class="pgn-row__left"><div class="pgn-info">' + total + ' записей</div></div>' +
      '<div class="pgn-row__right"><div class="pgn">' +
        '<span class="pgn__range">1 из ' + Math.max(1, Math.ceil(total / 10)) + '</span>' +
        '<nav class="pgn__nav" aria-label="Страницы">' +
          '<button class="pgn__arrow" aria-label="Предыдущая страница" disabled>‹</button>' +
          '<button class="pgn__num" aria-current="page">1</button>' +
          '<button class="pgn__num">' + Math.max(2, Math.ceil(total / 10)) + '</button>' +
          '<button class="pgn__arrow" aria-label="Следующая страница">›</button>' +
        '</nav>' +
      '</div></div>' +
    '</div>';
    return out;
  }

  function emptyBody() {
    return '<div class="dtable__empty">' +
      '<span class="illu" data-illu="empty-folder" aria-hidden="true"></span>' +
      '<p class="dtable__empty-title">Ничего не найдено</p>' +
      '<p class="dtable__empty-text">Попробуйте изменить параметры фильтра или очистить его.</p>' +
      '<button class="btn btn--outline btn--s"><span class="btn__label">Очистить фильтр</span></button>' +
      '</div>';
  }

  function filterControl(opts) {
    if (!opts.presets) {
      return '<div class="tfilter" role="group" aria-label="Фильтр таблицы">' +
        '<button type="button" class="btn btn--outline btn--s tfilter__open" aria-haspopup="dialog" aria-expanded="false"><i data-icon="filter"></i><span class="btn__label">Фильтр</span></button>' +
        '<span class="chip chip--edit chip--m tfilter__applied" tabindex="0"><span class="chip__label">Применено: 2</span><span class="chip__remove" role="button" aria-label="Сбросить все фильтры"><i data-icon="close"></i></span></span>' +
      '</div>';
    }
    var items = PRESETS.map(function (p) {
      return '<button class="menu__item" role="menuitem" data-preset="' + p.name + '"><span class="menu__item-label">' + p.name + '</span><span class="menu__item-hint">' + p.count + '</span></button>';
    }).join('');
    return '<div class="tfilter" role="group" aria-label="Фильтр таблицы">' +
      '<span class="menu-anchor tfilter__split">' +
        '<span class="btn-group btn-group--outline btn-group--split" role="group" aria-label="Фильтр">' +
          '<button type="button" class="btn btn--outline btn--s tfilter__open" aria-haspopup="dialog" aria-expanded="false"><i data-icon="filter"></i><span class="btn__label">Фильтр</span></button>' +
          '<button type="button" class="btn btn--outline btn--s btn--icon-only tfilter__presets" data-presets-toggle aria-haspopup="menu" aria-expanded="false" aria-label="Сохранённые пресеты"><i data-icon="chevron-down"></i></button>' +
        '</span>' +
        '<div class="menu menu--floating tfilter__menu" role="menu" hidden>' +
          '<div class="menu__label">Сохранённые пресеты</div>' + items +
        '</div>' +
      '</span>' +
      '<span class="chip chip--edit chip--m tfilter__applied" tabindex="0"><span class="chip__label">Применено: 2</span><span class="chip__remove" role="button" aria-label="Сбросить все фильтры"><i data-icon="close"></i></span></span>' +
    '</div>';
  }

  function toolbar(opts) {
    var left = '<div class="dtable__title-row"><h3 class="dtable__title">' + (opts.title || 'Таблица') + '</h3><span class="dtable__count">' + ROWS.length + '</span></div>';
    if (opts.filter) left += filterControl(opts);
    var right = '<button class="ibtn ibtn--neutral ibtn--s" data-columns-toggle aria-haspopup="dialog" aria-label="Настроить колонки"><i data-icon="settings"></i></button>' +
      '<button class="btn btn--accent btn--s"><i data-icon="add"></i><span class="btn__label">Добавить</span></button>';
    return '<div class="dtable__toolbar">' +
      '<div class="dtable__toolbar-left">' + left + '</div>' +
      '<div class="dtable__toolbar-right">' + right + '</div>' +
      '</div>';
  }

  /* зона тулбара НАД таблицей (детached, без подложки): слева TableFilter,
     справа кнопка настройки колонок; таблица под ней headless (без .dtable__toolbar) */
  function toolbarZone(opts) {
    return '<div class="dtable-toolbar">' + filterControl(opts) +
      '<button class="ibtn ibtn--neutral ibtn--m" data-columns-toggle aria-haspopup="dialog" aria-label="Настроить колонки"><i data-icon="settings"></i></button></div>';
  }

  function selectedCount() {
    return Object.keys(state.selected).filter(function (k) { return state.selected[k]; }).length;
  }

  function build(opts, interactive) {
    var allCols = interactive ? state.columns : defaultColumns();
    var cols = allCols.filter(function (c) { return !c.hidden; });
    var detached = !!opts.toolbarFloat;
    var html = '';
    if (detached) html += toolbarZone(opts); /* тулбар-зона над таблицей, без подложки */
    html += '<div class="dtable" ' + (opts.state === 'loading' ? 'aria-busy="true"' : '') + '>';
    if (opts.toolbar && !detached) html += toolbar(opts);
    html += '<div class="dtable__body">';
    if (opts.state === 'empty') {
      html += emptyBody();
    } else if (opts.state === 'loading') {
      html += '<div class="tbl tbl--scroll">' + headerRow(cols) + skeletonRow(cols) + skeletonRow(cols) + skeletonRow(cols) + skeletonRow(cols) + '</div>';
    } else {
      var rows = '';
      for (var i = 0; i < ROWS.length; i++) rows += dataRow(ROWS[i], i, cols);
      html += '<div class="tbl tbl--scroll">' + headerRow(cols) + rows + '</div>';
    }
    html += '</div>';
    if (opts.footer) html += '<div class="dtable__footer">' + paginationRow(interactive ? selectedCount() : opts.selected, ROWS.length) + '</div>';
    html += '</div>';
    return html;
  }

  /* тень липкой шапки при вертикальном скролле — общий рантайм, scripts/ds-table.js */
  function bindScrollFx(root) {
    var body = root.querySelector('.dtable__body');
    if (body && window.DSTable) window.DSTable.bind(body);
  }

  /* ---------------- resize / reorder / select ---------------- */
  function bindInteractivity(root) {
    var body = root.querySelector('.dtable__body');
    if (!body) return;

    body.addEventListener('pointerdown', function (e) {
      var handle = e.target.closest('[data-resize-idx]');
      if (!handle) return;
      e.preventDefault();
      var idx = parseInt(handle.getAttribute('data-resize-idx'), 10);
      var col = state.columns[idx];
      var startX = e.clientX;
      var startW = col.w;
      function move(ev) {
        var w = Math.max(96, Math.round(startW + (ev.clientX - startX)));
        col.w = w;
        root.querySelectorAll('.tbl__row').forEach(function (row) { row.style.gridTemplateColumns = gridTemplate(state.columns.filter(function (c) { return !c.hidden; })); });
      }
      function up() { document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); }
      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', up);
    });

    body.addEventListener('pointerdown', function (e) {
      var label = e.target.closest('[data-drag-idx]');
      if (!label) return;
      var startIdx = parseInt(label.getAttribute('data-drag-idx'), 10);
      var startX = e.clientX, startY = e.clientY, dragging = false;
      var tbl = root.querySelector('.tbl');
      var guide = tbl.querySelector('.tbl__guide');
      if (!guide) { guide = document.createElement('div'); guide.className = 'tbl__guide'; tbl.appendChild(guide); }
      var movable = state.columns.map(function (c, i) { return i; }).filter(function (i) { return !state.columns[i].fixed; });

      function move(ev) {
        if (!dragging) {
          if (Math.abs(ev.clientX - startX) < 4 && Math.abs(ev.clientY - startY) < 4) return;
          dragging = true;
          tbl.classList.add('tbl--reordering');
          root.querySelectorAll('[data-col-idx="' + startIdx + '"]').forEach(function (el) { el.classList.add('th--dragging', 'tc--dragging'); });
        }
        var tblRect = tbl.getBoundingClientRect();
        var best = null, bestDist = Infinity;
        movable.forEach(function (i) {
          var el = root.querySelector('.th[data-col-idx="' + i + '"]');
          if (!el) return;
          var r = el.getBoundingClientRect();
          [r.left, r.right].forEach(function (x) { var d = Math.abs(ev.clientX - x); if (d < bestDist) { bestDist = d; best = x; } });
        });
        if (best !== null) guide.style.left = (best - tblRect.left) + 'px';
      }
      function up(ev) {
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', up);
        if (dragging) {
          var targetIdx = startIdx, bestDist = Infinity;
          movable.forEach(function (i) {
            var el = root.querySelector('.th[data-col-idx="' + i + '"]');
            if (!el) return;
            var r = el.getBoundingClientRect();
            var d = Math.abs(ev.clientX - (r.left + r.width / 2));
            if (d < bestDist) { bestDist = d; targetIdx = i; }
          });
          if (targetIdx !== startIdx) {
            var col = state.columns.splice(startIdx, 1)[0];
            state.columns.splice(targetIdx, 0, col);
          }
          tbl.classList.remove('tbl--reordering');
          render();
        }
      }
      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', up);
    });

    body.addEventListener('change', function (e) {
      if (e.target.matches('[data-select-all]')) {
        if (e.target.checked) ROWS.forEach(function (_, i) { state.selected[i] = true; });
        else state.selected = {};
        render();
      } else if (e.target.matches('[data-row-idx]')) {
        state.selected[parseInt(e.target.getAttribute('data-row-idx'), 10)] = e.target.checked;
        render();
      }
    });

    body.addEventListener('click', function (e) {
      var pinBtn = e.target.closest('[data-pin-idx]');
      if (pinBtn) { togglePin(parseInt(pinBtn.getAttribute('data-pin-idx'), 10)); render(); return; }
      var sortBtn = e.target.closest('[data-sort-idx]');
      if (sortBtn) { cycleSort(parseInt(sortBtn.getAttribute('data-sort-idx'), 10)); render(); return; }
      var del = e.target.closest('[data-row-delete]');
      if (del) { delete state.selected[del.getAttribute('data-row-delete')]; }
    });
  }

  /* ---------------- фильтр: пресеты ---------------- */
  function bindFilterMenu(root) {
    var toggle = root.querySelector('[data-presets-toggle]');
    var menu = root.querySelector('.tfilter__menu');
    if (!toggle || !menu) return;
    function close() { menu.hidden = true; menu.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); }
    function open() { menu.hidden = false; menu.classList.add('is-open'); toggle.setAttribute('aria-expanded', 'true'); }
    toggle.addEventListener('click', function (e) { e.stopPropagation(); menu.hidden ? open() : close(); });
    menu.addEventListener('click', function (e) { if (e.target.closest('.menu__item')) close(); });
    document.addEventListener('click', function (e) { if (!menu.hidden && !e.target.closest('.tfilter__split')) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  /* ---------------- модалка настройки колонок ---------------- */
  function columnListItem(c, idx) {
    return '<li class="col-item" draggable="true" data-col-order-idx="' + idx + '">' +
      '<span class="col-item__drag" aria-hidden="true"><i data-icon="drag-dots"></i></span>' +
      '<label class="cb' + (c.hidden ? '' : ' cb--selected') + '"><input type="checkbox" class="cb__input" data-col-visible="' + idx + '"' + (c.hidden ? '' : ' checked') + '><span class="cb__box"><span class="cb__mark">' + (c.hidden ? '' : CHECK) + '</span></span><span class="cb__content"><span class="cb__label">' + c.label + '</span></span></label>' +
      '<button class="ibtn ibtn--neutral ibtn--s col-item__pin" data-col-pin="' + idx + '" aria-pressed="' + (c.pinned ? 'true' : 'false') + '" aria-label="' + (c.pinned ? 'Открепить колонку' : 'Закрепить колонку') + '"><i data-icon="' + (c.pinned ? 'pin-filled' : 'pin') + '"></i></button>' +
      '</li>';
  }

  function columnsModalHtml() {
    var items = state.columns.map(function (c, i) { return c.fixed ? '' : columnListItem(c, i); }).join('');
    return '<div class="modal-scrim" id="dt-columns-scrim">' +
      '<div class="modal modal--w4" role="dialog" aria-modal="true" aria-labelledby="dt-columns-title">' +
        '<header class="modal__head">' +
          '<h2 class="modal__title" id="dt-columns-title">Колонки</h2>' +
          '<button type="button" class="ibtn ibtn--neutral ibtn--l" data-columns-close aria-label="Закрыть"><i data-icon="close"></i></button>' +
        '</header>' +
        '<div class="modal__body">' +
          '<div class="col-actions">' +
            '<button class="btn btn--transparent btn--xs" data-cols-all><span class="btn__label">Выбрать все</span></button>' +
            '<button class="btn btn--transparent btn--xs" data-cols-none><span class="btn__label">Сбросить все</span></button>' +
          '</div>' +
          '<ul class="col-list" id="dt-col-list">' + items + '</ul>' +
        '</div>' +
        '<footer class="modal__foot">' +
          '<div class="modal__foot-left"></div>' +
          '<div class="modal__foot-right"><button class="btn btn--accent btn--m" data-columns-close><span class="btn__label">Готово</span></button></div>' +
        '</footer>' +
      '</div>' +
    '</div>';
  }

  function refreshColumnsModal() {
    var list = document.getElementById('dt-col-list');
    if (!list) return;
    list.innerHTML = state.columns.map(function (c, i) { return c.fixed ? '' : columnListItem(c, i); }).join('');
    if (window.dsIcons) window.dsIcons.apply(list);
  }

  function openColumnsModal() {
    closeColumnsModal();
    var wrap = document.createElement('div');
    wrap.innerHTML = columnsModalHtml();
    document.body.appendChild(wrap.firstChild);
    var scrim = document.getElementById('dt-columns-scrim');
    if (window.dsIcons) window.dsIcons.apply(scrim);
    scrim.addEventListener('click', function (e) { if (e.target === scrim) closeColumnsModal(); });
    scrim.addEventListener('click', function (e) {
      if (e.target.closest('[data-columns-close]')) closeColumnsModal();
      if (e.target.closest('[data-cols-all]')) { movableCols().forEach(function (c) { c.hidden = false; }); refreshColumnsModal(); render(); }
      if (e.target.closest('[data-cols-none]')) { movableCols().forEach(function (c) { c.hidden = true; }); refreshColumnsModal(); render(); }
      var pin = e.target.closest('[data-col-pin]');
      if (pin) {
        togglePin(parseInt(pin.getAttribute('data-col-pin'), 10));
        refreshColumnsModal(); render();
      }
    });
    scrim.addEventListener('change', function (e) {
      var vis = e.target.closest('[data-col-visible]');
      if (vis) { state.columns[parseInt(vis.getAttribute('data-col-visible'), 10)].hidden = !e.target.checked; refreshColumnsModal(); render(); }
    });
    var list = scrim.querySelector('#dt-col-list');
    var dragIdx = null;
    list.addEventListener('dragstart', function (e) {
      var li = e.target.closest('.col-item'); if (!li) return;
      dragIdx = parseInt(li.getAttribute('data-col-order-idx'), 10);
      li.classList.add('is-dragging');
    });
    list.addEventListener('dragend', function (e) { var li = e.target.closest('.col-item'); if (li) li.classList.remove('is-dragging'); });
    list.addEventListener('dragover', function (e) { e.preventDefault(); });
    list.addEventListener('drop', function (e) {
      e.preventDefault();
      var li = e.target.closest('.col-item'); if (!li || dragIdx === null) return;
      var targetIdx = parseInt(li.getAttribute('data-col-order-idx'), 10);
      if (targetIdx === dragIdx) return;
      var col = state.columns.splice(dragIdx, 1)[0];
      state.columns.splice(targetIdx, 0, col);
      dragIdx = null;
      refreshColumnsModal(); render();
    });
    document.addEventListener('keydown', escCloseColumns);
  }
  function escCloseColumns(e) { if (e.key === 'Escape') closeColumnsModal(); }
  function closeColumnsModal() {
    var scrim = document.getElementById('dt-columns-scrim');
    if (scrim) scrim.remove();
    document.removeEventListener('keydown', escCloseColumns);
  }

  function readOpts() {
    var float = document.getElementById('ctl-toolbar-float');
    return {
      toolbar: document.getElementById('ctl-toolbar').checked,
      title: document.getElementById('ctl-title').value || 'Таблица',
      filter: document.getElementById('ctl-filter').checked,
      presets: document.getElementById('ctl-presets').checked,
      state: document.getElementById('ctl-state').value,
      footer: document.getElementById('ctl-footer').checked,
      toolbarFloat: !!(float && float.checked)
    };
  }

  function render() {
    var opts = readOpts();
    var host = document.getElementById('demo-dtable');
    if (!host) return;
    var detached = opts.toolbarFloat;
    var html = build(opts, true);
    /* detached: зона + таблица — два блока, нужен общий контейнер-колонка,
       чтобы иконки/биндинги/модалка колонок покрывали и зону */
    host.outerHTML = detached
      ? '<div id="demo-dtable" class="dt-detached">' + html + '</div>'
      : html.replace('class="dtable"', 'class="dtable" id="demo-dtable"');
    var root = document.getElementById('demo-dtable');
    if (window.dsIcons) window.dsIcons.apply(root);
    if (window.dsIllustrations) window.dsIllustrations.apply(root);
    bindScrollFx(root);
    if (opts.state === 'default') bindInteractivity(root);
    if (detached || opts.filter) bindFilterMenu(root);

    var columnsBtn = root.querySelector('[data-columns-toggle]');
    if (columnsBtn) columnsBtn.addEventListener('click', openColumnsModal);

    /* в варианте «тулбар над таблицей» внутренний тулбар, заголовок и переключатель
       фильтра не используются (зона с фильтром структурна); в обычном режиме
       фильтр/пресеты неактуальны, когда выключен их носитель (тулбар/фильтр) —
       такие свитчи скрываем целиком (is-off на label.pg-toggle) */
    toggle('ctl-title-wrap', !detached && opts.toolbar);
    function setToggleOff(id, off) {
      var el = document.getElementById(id);
      if (!el) return;
      var lbl = el.closest('label.pg-toggle');
      if (lbl) lbl.classList.toggle('is-off', off);
    }
    setToggleOff('ctl-toolbar', detached);
    setToggleOff('ctl-filter', detached || !opts.toolbar);
    setToggleOff('ctl-presets', !detached && (!opts.toolbar || !opts.filter));
  }

  function toggle(id, on) {
    var el = document.getElementById(id);
    if (el) el.classList.toggle('is-off', !on);
  }

  function buildAnatomy() {
    var host = document.getElementById('anat-dia');
    if (!host) return;
    var opts = { toolbar: true, title: 'Заявки', filter: true, presets: false, state: 'default', selected: 0, footer: true };
    host.innerHTML = build(opts, false);
    if (window.dsIcons) window.dsIcons.apply(host);
    var hostRect = host.getBoundingClientRect();
    function markAt(el, n) {
      if (!el) return;
      var r = el.getBoundingClientRect();
      var span = document.createElement('span');
      span.className = 'mk';
      span.style.top = (r.top - hostRect.top + r.height / 2) + 'px';
      span.style.left = '-11px';
      span.textContent = n;
      host.appendChild(span);
    }
    host.style.paddingLeft = '14px';
    markAt(host.querySelector('.dtable__toolbar'), 1);
    markAt(host.querySelector('.th'), 2);
    markAt(host.querySelector('.tbl__row:not(:first-child)'), 3);
    markAt(host.querySelector('.pgn-row'), 4);
  }

  function buildStates() {
    var host = document.getElementById('states-grid');
    if (!host) return;
    var defs = [
      { label: 'Default', opts: { toolbar: true, title: 'Заявки', filter: false, presets: false, state: 'default', selected: 0, footer: true } },
      { label: 'Loading', opts: { toolbar: true, title: 'Заявки', filter: false, presets: false, state: 'loading', selected: 0, footer: false } },
      { label: 'Empty',   opts: { toolbar: true, title: 'Заявки', filter: false, presets: false, state: 'empty', selected: 0, footer: false } }
    ];
    var html = '';
    defs.forEach(function (d) { html += '<div class="st-card"><span class="st-card__label">' + d.label + '</span>' + build(d.opts, false) + '</div>'; });
    host.innerHTML = html;
    if (window.dsIcons) window.dsIcons.apply(host);
    if (window.dsIllustrations) window.dsIllustrations.apply(host);
  }

  function redline() {
    var probe = document.querySelector('#demo-dtable');
    if (!probe) return;
    var set = function (id, v) { var el = document.getElementById(id); if (el) el.textContent = v; };
    set('rl-radius', getComputedStyle(probe).borderRadius);
    var tb = probe.querySelector('.dtable__toolbar');
    if (tb) {
      var tbCs = getComputedStyle(tb);
      set('rl-toolbar-pad', tbCs.paddingTop + ' / ' + tbCs.paddingLeft);
      set('rl-toolbar-h', Math.round(tb.getBoundingClientRect().height) + 'px');
      set('rl-toolbar-gap', tbCs.gap || tbCs.columnGap);
    }
    var th = probe.querySelector('.th');
    if (th) set('rl-th-z', getComputedStyle(th).zIndex);
  }

  function copyButtons() {
    document.querySelectorAll('.copy-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var node = document.getElementById('code-' + btn.getAttribute('data-copy'));
        if (!node) return;
        navigator.clipboard.writeText(node.textContent).then(function () {
          var old = btn.textContent; btn.textContent = 'Скопировано';
          setTimeout(function () { btn.textContent = old; }, 1200);
        });
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    ['ctl-toolbar', 'ctl-toolbar-float', 'ctl-title', 'ctl-filter', 'ctl-presets', 'ctl-state', 'ctl-footer'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) { el.addEventListener('input', render); el.addEventListener('change', render); }
    });
    render();
    buildAnatomy();
    buildStates();
    copyButtons();
    setTimeout(redline, 60);
  });
})();
