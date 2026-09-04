/* =========================================================================
   TableCell — скрипт страницы: конструктор (шапка + ячейка + строка),
   интерактив демо, redline-измерения, Tooltip усечения, copy-кнопки.
   ========================================================================= */
(function () {
  'use strict';

  /* галочка и минус чекбокса — те же инлайн-глифы, что в компоненте Checkbox */
  var CB_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7"/></svg>';
  var CB_MINUS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 12h12"/></svg>';

  function icon(name, size) {
    size = size || 16;
    if (!window.DS_ICONS) return '';
    var raw = window.DS_ICONS[name] || ''; if (!raw) return '';
    var d = document.createElement('div'); d.innerHTML = raw;
    var s = d.firstElementChild; if (!s) return '';
    s.setAttribute('width', size); s.setAttribute('height', size); s.setAttribute('aria-hidden', 'true');
    return s.outerHTML;
  }
  window.getIcon = icon;

  function esc(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ---------------- состояние демо (то, что живёт по клику) ---------------- */
  var S = { sortDir: 'none', pinned: false, sel: [false, false, false], treeOpen: true, focusRow: -1, acOpen: -1, colW: 300 };
  var RESIZE_MIN = 96;

  var TEXT_DEFAULTS = {
    text: 'ООО ЮгСтройИнвестМонтаж',
    tree: 'Дочернее ООО «Восток»',
    'input-text': 'Договор поставки',
    'input-date': '12.05.2026',
    'input-autocomplete': 'Услуги подряда'
  };
  var VALUE_TYPES = ['text', 'tree'];
  var INPUT_TYPES = ['input-text', 'input-date', 'input-autocomplete'];

  function el(id) { return document.getElementById(id); }
  function has(arr, v) { return arr.indexOf(v) !== -1; }

  function fmtNum(v) {
    var s = String(v).trim();
    if (!s) return v;
    var n = Number(s.replace(/\s|\u00a0/g, '').replace(',', '.'));
    if (!isFinite(n)) return v;
    return n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  /* ---------------- чтение панели ---------------- */
  function readCfg() {
    var type = el('ctl-type').value;
    var numeric = el('ctl-numeric').checked && type === 'text';
    var textIn = el('ctl-text').value.trim();
    var text = textIn || (numeric ? '1 240 500,00' : (TEXT_DEFAULTS[type] || 'Значение ячейки'));
    if (numeric) text = fmtNum(text);
    return {
      type: type,
      sortOn: el('ctl-sort-on').checked,
      pinOn: el('ctl-pin-on').checked,
      align: el('ctl-align').value,
      numeric: numeric,
      text: text,
      level: parseInt(el('ctl-level').value, 10) || 0,
      prefixOn: el('ctl-prefix-on').checked,
      prefixText: el('ctl-prefix-text').value.trim(),
      postfixOn: el('ctl-postfix-on').checked,
      postfixText: el('ctl-postfix-text').value.trim(),
      leadOn: el('ctl-lead-on').checked,
      leadGlyph: el('ctl-lead-glyph').value,
      iconOn: el('ctl-icon-on').checked,
      iconGlyph: el('ctl-icon-glyph').value,
      subtextOn: el('ctl-subtext-on').checked,
      subtextText: el('ctl-subtext-text').value.trim(),
      truncate: el('ctl-truncate').checked,
      chipsCount: parseInt(el('ctl-chips-count').value, 10) || 2,
      chipsTone: el('ctl-chips-tone').value,
      chipsRounded: el('ctl-chips-rounded').checked,
      hiddenOn: el('ctl-hidden').checked,
      edited: el('ctl-edited').checked,
      bg: el('ctl-bg').value,
      state: el('ctl-state').value
    };
  }

  function syncControls(cfg) {
    var valueRow = has(VALUE_TYPES, cfg.type);
    var isInput = has(INPUT_TYPES, cfg.type);
    function off(id, cond) { var n = el(id); if (n) n.classList.toggle('is-off', cond); }
    off('ctl-sort-dir-wrap', !cfg.sortOn);
    off('ctl-pinned-wrap', !cfg.pinOn);
    off('ctl-align-wrap', !valueRow || cfg.numeric);
    off('ctl-numeric-wrap', cfg.type !== 'text');
    off('ctl-text-wrap', !valueRow && !isInput);
    off('ctl-level-wrap', cfg.type !== 'tree');
    off('ctl-prefix-wrap', !valueRow);
    off('ctl-postfix-wrap', !valueRow);
    off('ctl-lead-wrap', !valueRow);
    off('ctl-icon-wrap', !valueRow);
    off('ctl-subtext-wrap', !valueRow);
    off('ctl-truncate-wrap', !valueRow);
    off('ctl-chips-count-wrap', cfg.type !== 'chips');
    off('ctl-chips-tone-wrap', cfg.type !== 'chips');
    off('ctl-chips-rounded-wrap', cfg.type !== 'chips');
    off('ctl-hidden-wrap', isInput || cfg.type === 'checkbox');
    off('ctl-edited-wrap', cfg.type === 'checkbox');
  }

  /* ---------------- разметка ---------------- */
  function checkbox(state, extra) {
    var cls = 'cb cb--no-content cb--' + state;
    var mark = state === 'selected' ? CB_CHECK : state === 'indeterminate' ? CB_MINUS : '';
    return '<label class="' + cls + '"><input type="checkbox" class="cb__input" ' +
      (state === 'selected' ? 'checked ' : '') + (extra || '') +
      '><span class="cb__box"><span class="cb__mark">' + mark + '</span></span></label>';
  }

  function valueRow(cfg) {
    var lead = cfg.leadOn ? '<span class="tc__icon tc__icon--lead">' + icon(cfg.leadGlyph, 16) + '</span>' : '';
    var pre = cfg.prefixOn ? '<span class="tc__prefix">' + esc(cfg.prefixText || 'от') + '</span>' : '';
    var post = cfg.postfixOn ? '<span class="tc__postfix">' + esc(cfg.postfixText || 'RUB') + '</span>' : '';
    var ico = cfg.iconOn ? '<span class="tc__icon">' + icon(cfg.iconGlyph, 16) + '</span>' : '';
    var text = '<span class="tc__text' + (cfg.truncate ? ' tc__text--truncate' : '') + '">' + esc(cfg.text) + '</span>';
    return '<span class="tc__row">' + lead + pre + text + post + ico + '</span>';
  }

  function withSubtext(row, cfg) {
    if (!cfg.subtextOn) return row;
    return '<span class="tc__body">' + row + '<span class="tc__subtext">' +
      esc(cfg.subtextText || 'Дополнительная строка') + '</span></span>';
  }

  function hiddenActions() {
    return '<div class="tc__hidden"><button class="ibtn ibtn--neutral ibtn--s" aria-label="Изменить">' +
      icon('edit', 16) + '</button><button class="ibtn ibtn--neutral ibtn--s" aria-label="Ещё">' +
      icon('more-dots', 16) + '</button></div>';
  }

  function inputCell(cfg, i) {
    var kind = cfg.type.replace('input-', '');
    var isErr = cfg.state === 'error';
    var acts = '<button class="inp__act" aria-label="Очистить поле" tabindex="-1">' + icon('close', 16) + '</button>';
    if (kind === 'date') acts += '<button class="inp__act" aria-label="Открыть календарь" aria-haspopup="dialog" tabindex="-1">' + icon('calendar', 16) + '</button>';
    if (kind === 'autocomplete') acts += '<button class="inp__act inp__act--chev" aria-label="Показать список" data-ac="' + i + '" tabindex="-1">' + icon('chevron-down', 16) + '</button>';
    var open = kind === 'autocomplete' && S.acOpen === i;
    var ddl = '';
    if (open) {
      ddl = '<div class="ddl ddl--floating" role="listbox">' +
        ['Услуги подряда', 'Поставка оборудования', 'Монтажные работы'].map(function (t, k) {
          return '<button class="ddl__item" role="option" aria-selected="' + (k === 0) + '"><span class="ddl__item-body"><span class="ddl__item-label">' + t + '</span></span></button>';
        }).join('') + '</div>';
    }
    var ph = kind === 'date' ? 'ММ.ДД.ГГГГ' : 'Значение';
    return '<div class="inp inp--s inp--fullwidth' + (isErr ? ' inp--error' : '') + (open ? ' is-open' : '') + '">' +
      '<div class="inp__field"' + (kind === 'autocomplete' ? ' role="combobox" aria-expanded="' + open + '"' : '') + '>' +
      '<input class="inp__control" value="' + esc(cfg.text) + '" placeholder="' + ph + '" aria-label="Значение ячейки"' +
      (kind === 'date' ? ' inputmode="numeric"' : '') + '>' +
      '<span class="inp__acts">' + acts + '</span></div>' + ddl + '</div>';
  }

  function cellContent(cfg, i) {
    if (cfg.state === 'skeleton') return '<span class="sk-line sk-line--caption" style="--sk-w:60%"></span>';
    if (cfg.state === 'empty') return '<span class="tc__empty">—</span>';
    var extra = cfg.hiddenOn && !has(INPUT_TYPES, cfg.type) && cfg.type !== 'checkbox' ? hiddenActions() : '';

    switch (cfg.type) {
      case 'text':
        return withSubtext(valueRow(cfg), cfg) + extra;
      case 'tree': {
        var leaf = cfg.rowLeaf;
        var tw = leaf
          ? '<span class="tc__twisty tc__twisty--leaf"></span>'
          : '<button class="tc__twisty" aria-expanded="' + S.treeOpen + '" aria-label="' + (S.treeOpen ? 'Свернуть' : 'Развернуть') + '">' + icon('chevron-right', 16) + '</button>';
        return tw + withSubtext(valueRow(cfg), cfg) + extra;
      }
      case 'chips': {
        var toneCls = cfg.chipsTone ? ' chip--' + cfg.chipsTone : '';
        var roundCls = cfg.chipsRounded ? ' chip--rounded' : '';
        var labels = ['Активна', 'VIP', 'Новый'];
        var html = '<div class="tc__controls">';
        for (var k = 0; k < cfg.chipsCount; k++) {
          html += '<span class="chip chip--s' + roundCls + toneCls + '"><span class="chip__label">' + labels[k % labels.length] + '</span></span>';
        }
        return html + '</div>' + extra;
      }
      case 'button':
        return '<div class="tc__controls"><button class="btn btn--outline btn--xs"><span class="btn__label">Открыть</span></button></div>' + extra;
      case 'iconbuttons':
        return '<div class="tc__controls"><button class="ibtn ibtn--neutral ibtn--s" aria-label="Изменить">' + icon('edit', 16) +
          '</button><button class="ibtn ibtn--neutral ibtn--s" aria-label="Удалить">' + icon('trash', 16) + '</button></div>';
      case 'checkbox':
        return checkbox(S.sel[i] ? 'selected' : 'unselected', 'data-row="' + i + '" aria-label="Выбрать строку ' + (i + 1) + '"');
      default:
        return inputCell(cfg, i);
    }
  }

  function cellCls(cfg) {
    var c = 'tc';
    if (cfg.type === 'text' || cfg.type === 'tree') {
      if (cfg.numeric) c += ' tc--numbers';
      else if (cfg.align === 'right' && cfg.type === 'text') c += ' tc--right';
    }
    if (cfg.type === 'tree') c += ' tc--tree';
    if (cfg.type === 'checkbox') c += ' tc--center' + (cfg.sortOn || cfg.pinOn ? ' tc--select' : '');
    if (has(INPUT_TYPES, cfg.type)) c += ' tc--input';
    if (cfg.pinOn && S.pinned) c += ' tc--pinned';
    else if (cfg.bg === 'accent') c += ' tc--accent';
    if (cfg.state === 'error') c += ' tc--error' + (cfg.type === 'text' ? ' tc--error-bg' : '');
    if (cfg.state === 'skeleton') c += ' tc--skeleton';
    if (cfg.edited && cfg.type !== 'checkbox') c += ' tc--edited';
    if (has(VALUE_TYPES, cfg.type) && !cfg.truncate) c += ' tc--wrap';
    return c;
  }

  function sepCls(cfg) {
    var c = 'tc tc--separator';
    if (cfg.pinOn && S.pinned) c += ' tc--pinned';
    else if (cfg.bg === 'accent') c += ' tc--accent';
    return c;
  }

  function rowCls(i, cfg) {
    var c = 'tbl__row';
    if (cfg.state === 'hover') c += ' tbl__row--hover';
    if (cfg.state === 'focus') c += ' tbl__row--focus';
    if (cfg.state === 'selected') c += ' tbl__row--selected';
    if (cfg.type === 'checkbox' && S.sel[i]) c += ' tbl__row--selected';
    if (S.focusRow === i) c += ' tbl__row--focus';
    return c;
  }

  function gridTpl() { return 'grid-template-columns:8px ' + S.colW + 'px minmax(8px,1fr);'; }

  function applyDemoWidths() {
    var tbl = el('demo-tbl'); if (!tbl) return;
    var t = gridTpl();
    [].forEach.call(tbl.querySelectorAll('.tbl__row'), function (n) { n.style.cssText = t; });
  }

  function guideAt(clientX) {
    var tbl = el('demo-tbl'); if (!tbl) return;
    var g = tbl.querySelector('.tbl__guide');
    if (g) g.style.left = (clientX - tbl.getBoundingClientRect().left + tbl.scrollLeft) + 'px';
  }

  function startResize(e) {
    e.preventDefault();
    var tbl = el('demo-tbl'); if (!tbl) return;
    var x0 = e.clientX, w0 = S.colW;
    var th = e.target.closest('.th');
    tbl.classList.add('tbl--resizing');
    if (th) th.classList.add('th--resizing');
    function move(ev) {
      S.colW = Math.max(RESIZE_MIN, Math.round(w0 + (ev.clientX - x0)));
      applyDemoWidths();
      guideAt(ev.clientX);
    }
    function up() {
      tbl.classList.remove('tbl--resizing');
      if (th) th.classList.remove('th--resizing');
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
    }
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
    move(e);
  }

  function headerRow(cfg) {
    var cls = 'th';
    if (cfg.numeric || (cfg.align === 'right' && cfg.type === 'text')) cls += ' th--right';
    else if (cfg.type === 'checkbox') cls += ' th--center' + (cfg.sortOn || cfg.pinOn ? ' th--select' : '');
    if (cfg.sortOn && S.sortDir !== 'none') cls += ' th--sorted';
    if (cfg.pinOn && S.pinned) cls += ' th--pinned';
    else if (cfg.bg === 'accent') cls += ' tc--accent';

    var tools = '';
    if (cfg.pinOn) {
      tools += '<button class="ibtn ibtn--neutral ibtn--s th__pin" data-pin="1" aria-pressed="' + S.pinned +
        '" aria-label="' + (S.pinned ? 'Открепить колонку' : 'Закрепить колонку') + '">' + icon(S.pinned ? 'pin-filled' : 'pin', 16) + '</button>';
    }
    if (cfg.sortOn) {
      var glyph = S.sortDir === 'asc' ? 'arrow-narrow-up' : S.sortDir === 'desc' ? 'arrow-narrow-down' : 'arrow-up-down';
      var lbl = S.sortDir === 'asc' ? 'Сортировка от меньшего к большему' : S.sortDir === 'desc' ? 'Сортировка от большего к меньшему' : 'Сортировать';
      tools += '<button class="ibtn ibtn--neutral ibtn--s th__sort" data-sort="1" aria-label="' + lbl + '">' + icon(glyph, 16) + '</button>';
    }
    if (tools) tools = '<span class="th__tools">' + tools + '</span>';

    var label = cfg.type === 'checkbox'
      ? checkbox(allState(), 'data-all="1" aria-label="Выбрать все строки"')
      : '<span class="th__label">Заголовок</span>';

    var resize = '<span class="th__resize" role="separator" aria-orientation="vertical" tabindex="0" data-resize="1" aria-label="Изменить ширину колонки"></span>';
    var aria = cfg.sortOn ? ' aria-sort="' + (S.sortDir === 'asc' ? 'ascending' : S.sortDir === 'desc' ? 'descending' : 'none') + '"' : '';
    var sep = 'th th--separator' + (cfg.pinOn && S.pinned ? ' th--pinned' : cfg.bg === 'accent' ? ' tc--accent' : '');
    return '<div class="tbl__row" style="' + gridTpl() + '"><div class="' + sep + '"></div>' +
      '<div class="' + cls + '"' + aria + '>' + label + tools + resize + '</div>' +
      '<div class="' + sep + '"></div></div>';
  }

  function allState() {
    var n = S.sel.filter(Boolean).length;
    return n === 0 ? 'unselected' : n === S.sel.length ? 'selected' : 'indeterminate';
  }

  function bodyRows(cfg) {
    var rows = [];
    if (cfg.type === 'tree') {
      rows.push({ level: cfg.level, leaf: false, text: cfg.text });
      if (S.treeOpen) {
        rows.push({ level: cfg.level + 1, leaf: true, text: 'Филиал в Казани' });
        rows.push({ level: cfg.level + 1, leaf: true, text: 'Филиал в Самаре' });
      }
      rows.push({ level: cfg.level, leaf: true, text: 'ЗАО «Запад»' });
    } else {
      rows = [{}, {}, {}];
    }
    return rows.map(function (r, i) {
      var rcfg = Object.assign({}, cfg);
      if (cfg.type === 'tree') { rcfg.text = r.text; rcfg.rowLeaf = r.leaf; }
      var style = cfg.type === 'tree' ? ' style="--tc-level:' + r.level + ';"' : '';
      return '<div class="' + rowCls(i, cfg) + '" style="' + gridTpl() + '" data-row="' + i + '">' +
        '<div class="' + sepCls(cfg) + '"></div>' +
        '<div class="' + cellCls(rcfg) + '"' + style + (cfg.state === 'skeleton' ? ' aria-busy="true"' : '') + '>' +
        cellContent(rcfg, i) + '</div>' +
        '<div class="' + sepCls(cfg) + '"></div></div>';
    }).join('');
  }

  function render(focusInput) {
    var cfg = readCfg();
    syncControls(cfg);
    var tbl = el('demo-tbl'); if (!tbl) return;
    tbl.innerHTML = headerRow(cfg) + bodyRows(cfg) + '<span class="tbl__guide"></span>';
    if (focusInput && S.focusRow >= 0) {
      var row = tbl.querySelector('.tbl__row[data-row="' + S.focusRow + '"] .inp__control');
      if (row) row.focus();
    }
  }

  /* ---------------- интерактив демо ---------------- */
  function bind() {
    ['ctl-type', 'ctl-sort-on', 'ctl-sort-dir', 'ctl-pin-on', 'ctl-pinned', 'ctl-align', 'ctl-numeric', 'ctl-text',
      'ctl-level', 'ctl-prefix-on', 'ctl-prefix-text', 'ctl-postfix-on', 'ctl-postfix-text', 'ctl-lead-on',
      'ctl-lead-glyph', 'ctl-icon-on', 'ctl-icon-glyph', 'ctl-subtext-on', 'ctl-subtext-text', 'ctl-truncate',
      'ctl-chips-count', 'ctl-chips-tone', 'ctl-chips-rounded', 'ctl-hidden', 'ctl-edited', 'ctl-bg', 'ctl-state'
    ].forEach(function (id) {
      var n = el(id); if (!n) return;
      n.addEventListener('change', function () {
        if (id === 'ctl-sort-dir') S.sortDir = n.value;
        if (id === 'ctl-pinned') S.pinned = n.checked;
        if (id === 'ctl-type') { S.focusRow = -1; S.acOpen = -1; }
        render();
      });
      n.addEventListener('input', function () { render(); });
    });

    var tbl = el('demo-tbl'); if (!tbl) return;

    tbl.addEventListener('pointerdown', function (e) {
      var h = e.target.closest('[data-resize]');
      if (h) startResize(e);
    });
    tbl.addEventListener('keydown', function (e) {
      var h = e.target.closest('[data-resize]');
      if (!h || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
      e.preventDefault();
      S.colW = Math.max(RESIZE_MIN, S.colW + (e.key === 'ArrowRight' ? 16 : -16));
      applyDemoWidths();
    });

    tbl.addEventListener('click', function (e) {
      var t = e.target;
      var sortBtn = t.closest('[data-sort]');
      if (sortBtn) {
        S.sortDir = S.sortDir === 'none' ? 'asc' : S.sortDir === 'asc' ? 'desc' : 'none';
        var dirSel = el('ctl-sort-dir'); if (dirSel) { dirSel.value = S.sortDir; dirSel.dispatchEvent(new Event('pg:sync')); }
        render(); return;
      }
      var pinBtn = t.closest('[data-pin]');
      if (pinBtn) {
        S.pinned = !S.pinned;
        var pinChk = el('ctl-pinned'); if (pinChk) pinChk.checked = S.pinned;
        render(); return;
      }
      var tw = t.closest('.tc__twisty:not(.tc__twisty--leaf)');
      if (tw) { S.treeOpen = !S.treeOpen; render(); return; }
      var chev = t.closest('[data-ac]');
      if (chev) {
        var i = parseInt(chev.getAttribute('data-ac'), 10);
        S.acOpen = S.acOpen === i ? -1 : i;
        S.focusRow = i;
        render(true); return;
      }
      var opt = t.closest('.ddl__item');
      if (opt) {
        var txt = opt.textContent.trim();
        var input = el('ctl-text'); if (input) input.value = txt;
        S.acOpen = -1; render(true); return;
      }
      /* клик по строке — фокус всей строки: все ячейки в фокусе и доступны */
      var row = t.closest('.tbl__row[data-row]');
      if (row && !t.closest('.cb')) {
        S.focusRow = parseInt(row.getAttribute('data-row'), 10);
        var isInput = t.closest('.tc--input');
        render(!!isInput);
      }
    });

    tbl.addEventListener('change', function (e) {
      var input = e.target.closest('.cb__input'); if (!input) return;
      if (input.hasAttribute('data-all')) {
        var next = allState() !== 'selected';
        S.sel = S.sel.map(function () { return next; });
      } else {
        var i = parseInt(input.getAttribute('data-row'), 10);
        S.sel[i] = !S.sel[i];
      }
      render();
    });

    /* capture-фаза: до перерисовки демо, иначе e.target уже отсоединён от DOM */
    document.addEventListener('click', function (e) {
      if (!e.target.closest || e.target.closest('#demo-tbl') || e.target.closest('.pg__controls')) return;
      if (S.focusRow === -1 && S.acOpen === -1) return;
      S.focusRow = -1; S.acOpen = -1; render();
    }, true);
  }

  /* ---------------- redline ---------------- */
  function measureRedline() {
    var c = el('rl-cell'); if (!c) return;
    var cs = getComputedStyle(c);
    var t = c.querySelector('.tc__text');
    function set(id, v) { var n = el(id); if (n) n.textContent = v; }
    var px = function (v) { return Math.round(parseFloat(v)) + 'px'; };
    set('rl-minh', px(cs.minHeight));
    set('rl-px', px(cs.paddingLeft));
    set('rl-gap', px(cs.columnGap || cs.gap));
    set('rl-border', px(cs.borderBottomWidth) + ' solid');
    set('rl-font', t ? (getComputedStyle(t).fontWeight + ' · ' + getComputedStyle(t).fontSize + '/' + getComputedStyle(t).lineHeight) : '400 · 14px');
    var ib = document.querySelector('#rl-sample .th__sort');
    if (ib) { var ics = getComputedStyle(ib); set('rl-sort', Math.round(parseFloat(ics.width)) + ' × ' + Math.round(parseFloat(ics.height)) + ' px'); }
    var fld = document.querySelector('#rl-sample .inp__field');
    if (fld) { var fcs = getComputedStyle(fld); set('rl-field', Math.round(parseFloat(fcs.height)) + 'px · радиус ' + fcs.borderRadius); }
  }

  /* ---------------- Tooltip усечения ---------------- */
  function tooltips() {
    var tip = document.createElement('span');
    tip.className = 'tip tip--main tip--top tip--center tip--floating tip--multiline';
    tip.setAttribute('role', 'tooltip');
    tip.innerHTML = '<span class="tip__content"></span><span class="tip__arrow"></span>';
    document.body.appendChild(tip);

    function show(target) {
      if (target.scrollWidth <= target.clientWidth + 1) return;
      tip.querySelector('.tip__content').textContent = target.textContent;
      tip.classList.add('is-visible');
      var r = target.getBoundingClientRect();
      var tr = tip.getBoundingClientRect();
      var left = r.left + window.scrollX + (r.width / 2) - (tr.width / 2);
      left = Math.max(8, Math.min(left, document.documentElement.clientWidth - tr.width - 8));
      tip.style.top = (r.top + window.scrollY - tr.height - 8) + 'px';
      tip.style.left = left + 'px';
    }
    document.addEventListener('mouseover', function (e) {
      var t = e.target.closest && e.target.closest('.tc__text--truncate');
      if (t) show(t);
    });
    document.addEventListener('mouseout', function (e) {
      var t = e.target.closest && e.target.closest('.tc__text--truncate');
      if (t) tip.classList.remove('is-visible');
    });
  }

  /* ---------------- copy ---------------- */
  function copyButtons() {
    document.querySelectorAll('.copy-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var node = el('code-' + btn.getAttribute('data-copy')); if (!node) return;
        navigator.clipboard.writeText(node.textContent).then(function () {
          btn.textContent = 'Скопировано ✓'; btn.classList.add('is-copied');
          setTimeout(function () { btn.textContent = 'Скопировать'; btn.classList.remove('is-copied'); }, 2000);
        });
      });
    });
  }

  function init() {
    if (!el('demo-tbl')) return;
    S.sortDir = el('ctl-sort-dir') ? el('ctl-sort-dir').value : 'none';
    S.pinned = el('ctl-pinned') ? el('ctl-pinned').checked : false;
    render();
    bind();
    tooltips();
    copyButtons();
    setTimeout(measureRedline, 300);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

/* =========================================================================
   Демо «Дерево» (раздел «Поведение»).
   ========================================================================= */
(function () {
  'use strict';
  var root = document.getElementById('tree-behavior-demo');
  if (!root) return;
  var icon = window.getIcon || function () { return ''; };
  var open = true;

  function row(level, text, leaf) {
    var tw = leaf
      ? '<span class="tc__twisty tc__twisty--leaf"></span>'
      : '<button class="tc__twisty" aria-expanded="' + open + '" aria-label="' + (open ? 'Свернуть' : 'Развернуть') + '" data-twisty="1">' + icon('chevron-right', 16) + '</button>';
    return '<div class="tbl__row" style="grid-template-columns:8px 1fr 8px;"><div class="tc tc--separator"></div>' +
      '<div class="tc tc--tree" style="--tc-level:' + level + ';">' + tw + '<span class="tc__row"><span class="tc__text">' + text + '</span></span></div>' +
      '<div class="tc tc--separator"></div></div>';
  }
  function render() {
    var html = row(0, 'ООО «Восток»', false);
    if (open) {
      html += row(1, 'Филиал в Казани', true);
      html += row(1, 'Филиал в Самаре', true);
    }
    html += row(0, 'ЗАО «Запад»', true);
    root.innerHTML = html;
  }
  root.addEventListener('click', function (e) {
    if (e.target.closest('[data-twisty]')) { open = !open; render(); }
  });
  render();
})();

/* =========================================================================
   Демо «Выбор и фокус строки» (раздел «Поведение»).
   ========================================================================= */
(function () {
  'use strict';
  var root = document.getElementById('rowselect-behavior-demo');
  if (!root) return;
  var CB_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7"/></svg>';
  var CB_MINUS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 12h12"/></svg>';
  var rows = [{ t: 'ООО ЮгСтрой', sel: false }, { t: 'ПАО Ростелеком', sel: false }, { t: 'АО Тандер', sel: false }];
  var focus = -1;

  function cb(state, extra) {
    var mark = state === 'selected' ? CB_CHECK : state === 'indeterminate' ? CB_MINUS : '';
    return '<label class="cb cb--no-content cb--' + state + '"><input type="checkbox" class="cb__input" ' +
      (state === 'selected' ? 'checked ' : '') + extra + '><span class="cb__box"><span class="cb__mark">' + mark + '</span></span></label>';
  }
  function allState() {
    var n = rows.filter(function (r) { return r.sel; }).length;
    return n === 0 ? 'unselected' : n === rows.length ? 'selected' : 'indeterminate';
  }
  function render() {
    var html = '<div class="tbl__row" style="grid-template-columns:8px 48px 1fr 8px;"><div class="th th--separator"></div>' +
      '<div class="th th--center">' + cb(allState(), 'data-all="1" aria-label="Выбрать все строки"') + '</div>' +
      '<div class="th"><span class="th__label">Контрагент</span></div><div class="th th--separator"></div></div>';
    rows.forEach(function (r, i) {
      var cls = 'tbl__row' + (r.sel ? ' tbl__row--selected' : '') + (focus === i ? ' tbl__row--focus' : '');
      html += '<div class="' + cls + '" style="grid-template-columns:8px 48px 1fr 8px;" data-row="' + i + '"><div class="tc tc--separator"></div>' +
        '<div class="tc tc--center">' + cb(r.sel ? 'selected' : 'unselected', 'data-row="' + i + '" aria-label="Выбрать ' + r.t + '"') + '</div>' +
        '<div class="tc"><span class="tc__row"><span class="tc__text">' + r.t + '</span></span></div>' +
        '<div class="tc tc--separator"></div></div>';
    });
    root.innerHTML = html;
  }
  root.addEventListener('change', function (e) {
    var input = e.target.closest('.cb__input'); if (!input) return;
    if (input.hasAttribute('data-all')) { var next = allState() !== 'selected'; rows.forEach(function (r) { r.sel = next; }); }
    else { var i = parseInt(input.getAttribute('data-row'), 10); rows[i].sel = !rows[i].sel; }
    render();
  });
  root.addEventListener('click', function (e) {
    var rowEl = e.target.closest('.tbl__row[data-row]');
    if (rowEl && !e.target.closest('.cb')) { focus = parseInt(rowEl.getAttribute('data-row'), 10); render(); }
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest || e.target.closest('#rowselect-behavior-demo') || focus === -1) return;
    focus = -1; render();
  });
  render();
})();

/* =========================================================================
   Демо «Навигация по сетке» (раздел «Поведение»).
   Роving tabindex: фокус стрелками, видимая обводка через .tc:focus-visible.
   ========================================================================= */
(function () {
  'use strict';
  var root = document.getElementById('gridnav-behavior-demo');
  if (!root) return;
  var data = [
    ['ООО «Восток»', '1 240 500,00', '12.05.2026'],
    ['ПАО Ростелеком', '986 300,00', '28.04.2026'],
    ['АО Тандер', '432 100,00', '05.03.2026']
  ];
  var COLS = 3, ROWS = data.length;

  function render() {
    var html = '<div class="tbl__row" style="grid-template-columns:8px 1fr 1fr 1fr 8px;"><div class="th th--separator"></div>' +
      '<div class="th"><span class="th__label">Контрагент</span></div><div class="th th--right"><span class="th__label">Сумма, RUB</span></div>' +
      '<div class="th"><span class="th__label">Дата</span></div><div class="th th--separator"></div></div>';
    data.forEach(function (r, ri) {
      html += '<div class="tbl__row" style="grid-template-columns:8px 1fr 1fr 1fr 8px;"><div class="tc tc--separator"></div>';
      r.forEach(function (v, ci) {
        var tab = (ri === 0 && ci === 0) ? '0' : '-1';
        var num = ci === 1 ? ' tc--numbers' : '';
        html += '<div class="tc' + num + '" tabindex="' + tab + '" data-r="' + ri + '" data-c="' + ci + '"><span class="tc__row"><span class="tc__text">' + v + '</span></span></div>';
      });
      html += '<div class="tc tc--separator"></div></div>';
    });
    root.innerHTML = html;
  }
  function cellAt(r, c) { return root.querySelector('.tc[data-r="' + r + '"][data-c="' + c + '"]'); }
  root.addEventListener('focusin', function (e) {
    var t = e.target.closest('.tc[data-r]'); if (!t) return;
    [].forEach.call(root.querySelectorAll('.tc[data-r]'), function (n) { n.tabIndex = -1; });
    t.tabIndex = 0;
  });
  root.addEventListener('keydown', function (e) {
    var t = e.target.closest('.tc[data-r]'); if (!t) return;
    var r = parseInt(t.getAttribute('data-r'), 10), c = parseInt(t.getAttribute('data-c'), 10);
    var nr = r, nc = c;
    if (e.key === 'ArrowRight') nc = Math.min(COLS - 1, c + 1);
    else if (e.key === 'ArrowLeft') nc = Math.max(0, c - 1);
    else if (e.key === 'ArrowDown') nr = Math.min(ROWS - 1, r + 1);
    else if (e.key === 'ArrowUp') nr = Math.max(0, r - 1);
    else return;
    e.preventDefault();
    var next = cellAt(nr, nc); if (next) next.focus();
  });
  root.addEventListener('click', function (e) {
    var t = e.target.closest('.tc[data-r]'); if (t) t.focus();
  });
  render();
})();

/* =========================================================================
   Демо «Ширина и порядок колонок» (раздел «Поведение»).
   Ширина — перетаскивание правой границы шапки; порядок — перетаскивание
   подписи шапки. Других органов управления у колонки нет.
   ========================================================================= */
(function () {
  'use strict';
  var root = document.getElementById('cols-demo');
  if (!root) return;
  var icon = window.getIcon || function () { return ''; };
  var MIN = 96;

  var cols = [
    { k: 'name',   t: 'Контрагент', w: 240 },
    { k: 'status', t: 'Статус',     w: 150 },
    { k: 'sum',    t: 'Сумма, RUB',   w: 160, num: true },
    { k: 'date',   t: 'Дата',       w: 130 },
    { k: 'mgr',    t: 'Менеджер',   w: 180 }
  ];
  cols.forEach(function (c) { c.vis = true; c.w0 = c.w; });

  var rows = [
    { name: 'ООО ЮгСтройИнвестМонтаж', status: ['success', 'Активна'],    sum: '1 240 500,00', date: '12.05.2026', mgr: 'Смирнова А.' },
    { name: 'ПАО Ростелеком',          status: ['', 'На проверке'],       sum: '986 300,00',   date: '28.04.2026', mgr: 'Волков И.' },
    { name: 'АО Тандер',               status: ['error', 'Просрочена'],   sum: '432 100,00',   date: '05.03.2026', mgr: 'Гаврилова Е.' },
    { name: 'ИП Смирнов А.В.',         status: ['warning', 'Продление'],  sum: '57 800,00',    date: '19.06.2026', mgr: 'Волков И.' }
  ];

  var dragKey = null;

  function vis() { return cols.filter(function (c) { return c.vis; }); }
  function find(k) { return cols.filter(function (c) { return c.k === k; })[0]; }
  function tpl() { return '8px ' + vis().map(function (c) { return c.w + 'px'; }).join(' ') + ' minmax(8px,1fr)'; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }

  function headCell(c) {
    return '<div class="th th--movable' + (c.num ? ' th--right' : '') + (dragKey === c.k ? ' th--dragging' : '') + '" data-k="' + c.k + '">' +
      '<span class="th__label" data-grab="' + c.k + '">' + esc(c.t) + '</span>' +
      '<span class="th__resize" role="separator" aria-orientation="vertical" tabindex="0" data-resize="' + c.k + '" aria-label="Изменить ширину колонки «' + esc(c.t) + '»"></span>' +
      '</div>';
  }

  function bodyCell(c, r) {
    var cls = 'tc' + (c.num ? ' tc--numbers' : '') + (dragKey === c.k ? ' tc--dragging' : '');
    if (c.k === 'status') {
      var tone = r.status[0] ? ' chip--' + r.status[0] : '';
      return '<div class="' + cls + '"><span class="chip chip--s chip--rounded' + tone + '"><span class="chip__label">' + r.status[1] + '</span></span></div>';
    }
    return '<div class="' + cls + '"><span class="tc__row"><span class="tc__text tc__text--truncate">' + esc(r[c.k]) + '</span></span></div>';
  }

  function render() {
    var t = tpl();
    var html = '<div class="tbl__row" style="grid-template-columns:' + t + ';"><div class="th th--separator"></div>' +
      vis().map(headCell).join('') + '<div class="th th--separator"></div></div>';
    html += rows.map(function (r) {
      return '<div class="tbl__row" style="grid-template-columns:' + t + ';"><div class="tc tc--separator"></div>' +
        vis().map(function (c) { return bodyCell(c, r); }).join('') + '<div class="tc tc--separator"></div></div>';
    }).join('');
    root.innerHTML = html + '<span class="tbl__guide"></span>';
  }

  function applyWidths() {
    var t = tpl();
    [].forEach.call(root.querySelectorAll('.tbl__row'), function (n) { n.style.gridTemplateColumns = t; });
  }

  function guideAt(clientX) {
    var g = root.querySelector('.tbl__guide');
    if (g) g.style.left = (clientX - root.getBoundingClientRect().left + root.scrollLeft) + 'px';
  }

  /* ---------- изменение ширины ---------- */
  function startResize(e, k) {
    e.preventDefault();
    var col = find(k), x0 = e.clientX, w0 = col.w;
    var th = root.querySelector('.th[data-k="' + k + '"]');
    root.classList.add('tbl--resizing');
    if (th) th.classList.add('th--resizing');
    function move(ev) {
      col.w = Math.max(MIN, Math.round(w0 + (ev.clientX - x0)));
      applyWidths();
      guideAt(th.getBoundingClientRect().right);
    }
    function up() {
      root.classList.remove('tbl--resizing');
      if (th) th.classList.remove('th--resizing');
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
    }
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
    move(e);
  }

  /* ---------- порядок колонок: только перетаскивание ---------- */
  function boundaries() {
    return [].map.call(root.querySelectorAll('.th[data-k]'), function (n) { return n.getBoundingClientRect(); });
  }
  function dropIndex(clientX) {
    var rects = boundaries(), i;
    for (i = 0; i < rects.length; i++) {
      if (clientX < rects[i].left + rects[i].width / 2) return i;
    }
    return rects.length;
  }
  function guideAtIndex(i) {
    var rects = boundaries();
    if (!rects.length) return;
    guideAt(i >= rects.length ? rects[rects.length - 1].right : rects[i].left);
  }
  function startDrag(e, k) {
    if (e.button !== 0) return;
    e.preventDefault();
    var x0 = e.clientX, started = false, target = -1;
    function move(ev) {
      if (!started) {
        if (Math.abs(ev.clientX - x0) < 4) return;
        started = true;
        dragKey = k;
        root.classList.add('tbl--reordering');
        render();
      }
      target = dropIndex(ev.clientX);
      guideAtIndex(target);
    }
    function up() {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      root.classList.remove('tbl--reordering');
      if (started && target >= 0) moveTo(k, target);
      dragKey = null;
      render();
    }
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
  }
  /* перенос колонки на позицию среди видимых */
  function moveTo(k, visTarget) {
    var v = vis(), col = find(k), from = v.indexOf(col);
    if (from < 0) return;
    var to = visTarget > from ? visTarget - 1 : visTarget;
    if (to === from) return;
    v.splice(from, 1);
    v.splice(Math.max(0, Math.min(v.length, to)), 0, col);
    var order = v.slice();
    cols.sort(function (a, b) {
      var ia = order.indexOf(a), ib = order.indexOf(b);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
  }

  /* ---------- события ---------- */
  root.addEventListener('pointerdown', function (e) {
    var h = e.target.closest('[data-resize]');
    if (h) { startResize(e, h.getAttribute('data-resize')); return; }
    var g = e.target.closest('[data-grab]');
    if (g) startDrag(e, g.getAttribute('data-grab'));
  });
  /* клавиатура на ручке: ← → меняют ширину шагом 16px */
  root.addEventListener('keydown', function (e) {
    var h = e.target.closest('[data-resize]');
    if (!h || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
    e.preventDefault();
    var c = find(h.getAttribute('data-resize'));
    c.w = Math.max(MIN, c.w + (e.key === 'ArrowRight' ? 16 : -16));
    applyWidths();
  });

  render();
})();


/* ------------------------------------------------------------------ */
/* Вариант «Динамика»: спарклайн в ячейке — компонент Chart (spark)     */
/* ------------------------------------------------------------------ */
(function () {
  function build() {
    var host = document.getElementById('tc-spark-demo');
    if (!host || !window.DSChart) return;
    var rows = [
      ['Показатель A', '810 000 000,00', [120, 160, 150, 190, 210, 240, 260, 300], 'auto'],
      ['Показатель B', '530 000 000,00', [300, 280, 260, 250, 230, 210, 190, 160], 'auto'],
      ['Показатель C', '420 000 000,00', [200, 210, 190, 220, 205, 215, 210, 225], 'series']
    ];
    var tpl = 'grid-template-columns:8px 1.6fr 1fr 0.7fr 8px;';
    var html = '<div class="tbl" style="grid-template-columns:none;border:none;border-radius:0;">';
    html += '<div class="tbl__row" style="' + tpl + '"><div class="th th--separator"></div>' +
      '<div class="th"><span class="th__label">Показатель</span></div>' +
      '<div class="th th--right"><span class="th__label">Значение</span></div>' +
      '<div class="th"><span class="th__label">Динамика</span></div>' +
      '<div class="th th--separator"></div></div>';
    rows.forEach(function (r, i) {
      html += '<div class="tbl__row" style="' + tpl + '"><div class="tc tc--separator"></div>' +
        '<div class="tc"><span class="tc__row"><span class="tc__text">' + r[0] + '</span></span></div>' +
        '<div class="tc tc--numbers"><span class="tc__row"><span class="tc__text">' + r[1] + '</span></span></div>' +
        '<div class="tc"><span class="tc__row"><span class="tc__spark" id="tc-spk-' + i + '"></span></span></div>' +
        '<div class="tc tc--separator"></div></div>';
    });
    host.innerHTML = html + '</div>';
    rows.forEach(function (r, i) {
      var slot = document.getElementById('tc-spk-' + i);
      if (!slot) return;
      slot.appendChild(window.DSChart.make({
        type: 'spark', spark: 'line',
        tone: r[3] === 'auto' ? 'auto' : null,
        series: [{ id: 'k', data: r[2], color: '--chart-blue' }],
        ariaLabel: 'Динамика: ' + r[0]
      }));
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
