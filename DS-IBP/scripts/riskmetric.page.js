/* =========================================================================
   RiskMetric — страница ДС: конструктор, редлайн, демо.
   Композиция строится рантаймом scripts/ds-riskmetric.js (Chip + Popover,
   позиционирование/открытие/single-open/Esc/клик-вне — из DSPopover).
   Эта страница только расставляет data-riskmetric-хосты и читает их обратно.
   ========================================================================= */

const RM_ZONE_LABEL = { green: 'Зеленая', watchlist: 'Watchlist', red: 'Красная', black: 'Черная' };
const RM_ZONE_TOKEN = { green: '--st-green', watchlist: '--st-orange', red: '--st-red', black: '--st-grey' };
const RM_ERROR_TEXT = 'Не удалось загрузить риск-метрику. Проверьте соединение и попробуйте ещё раз.';

/* ---------- создаёт data-riskmetric хост и собирает его рантаймом ---------- */
function rmMount(container, o = {}) {
  const host = document.createElement('span');
  host.setAttribute('data-riskmetric', '');
  if (o.rating != null) host.setAttribute('data-risk', o.rating);
  if (o.zone) host.setAttribute('data-zone', o.zone);
  if (o.ratingDate) host.setAttribute('data-rating-date', o.ratingDate);
  if (o.zoneDate) host.setAttribute('data-zone-date', o.zoneDate);
  if (o.segment) host.setAttribute('data-segment', o.segment);
  if (o.profile) host.setAttribute('data-profile', o.profile);
  if (o.loading) host.setAttribute('data-loading', '');
  if (o.error) host.setAttribute('data-error', o.error);
  container.appendChild(host);
  window.DSRiskMetric.build(host);
  window.dsIcons && window.dsIcons.apply(host);
  return host;
}
function rmPopoverApi(host) {
  const btn = host.querySelector('.chip__info');
  return btn ? btn.__dsPopover : null;
}

/* ---------- строительные блоки Body (только для демо «компоненты подкачки») ---------- */
function rmZoneBlockHTML(zone, zoneDate) {
  const color = RM_ZONE_TOKEN[zone] ? ' style="color:var(' + RM_ZONE_TOKEN[zone] + ')"' : '';
  const val = zone ? RM_ZONE_LABEL[zone] : '—';
  return '<div class="rm-block">' +
    '<div class="rm-block__row"><span class="rm-block__label">Зона проблемности</span><span class="rm-block__value rm-block__value--strong"' + color + '>' + val + '</span></div>' +
    '<div class="rm-block__row"><span class="rm-block__label">Дата расчета</span><span class="rm-block__value">' + (zone ? zoneDate : '—') + '</span></div>' +
  '</div>';
}
function rmRateBlockHTML(rating, ratingDate) {
  return '<div class="rm-block">' +
    '<div class="rm-block__row"><span class="rm-block__label">Рейтинг контрагента</span><span class="rm-block__value rm-block__value--strong">' + (rating != null ? rating : '—') + '</span></div>' +
    '<div class="rm-block__row"><span class="rm-block__label">Дата расчета</span><span class="rm-block__value">' + (rating != null ? ratingDate : '—') + '</span></div>' +
  '</div>';
}

/* ========================================================================= */
document.addEventListener('DOMContentLoaded', () => {

  /* ---------------- КОНСТРУКТОР ---------------- */
  (function () {
    const controls = document.getElementById('pg-controls');
    const stage = document.getElementById('pg-stage');
    if (!controls || !stage) return;

    const state = { zone: 'red', rating: '26', details: 'yes', popState: 'default' };

    function ctl(labelText, options, get, set) {
      const wrap = document.createElement('div'); wrap.className = 'ctl';
      const l = document.createElement('div'); l.className = 'lbl'; l.textContent = labelText; wrap.appendChild(l);
      const box = document.createElement('div'); box.className = 'pg-select';
      const sel = document.createElement('select');
      options.forEach(([v, t]) => { const op = document.createElement('option'); op.value = v; op.textContent = t; if (v === get()) op.selected = true; sel.appendChild(op); });
      sel.addEventListener('change', () => { set(sel.value); render(); });
      box.appendChild(sel); wrap.appendChild(box); return wrap;
    }

    controls.appendChild(ctl('Зона проблемности', [
      ['none', 'Нет данных'], ['green', 'Зелёная'], ['watchlist', 'Watchlist'], ['red', 'Красная'], ['black', 'Чёрная'],
    ], () => state.zone, v => state.zone = v));

    controls.appendChild(ctl('Рейтинг контрагента', [
      ['none', 'Нет данных'], ['1', '1'], ['5', '5'], ['12', '12'], ['18', '18'], ['26', '26'],
    ], () => state.rating, v => state.rating = v));

    controls.appendChild(ctl('Риск-сегмент и профиль', [
      ['yes', 'Есть'], ['no', 'Нет данных'],
    ], () => state.details, v => state.details = v));

    controls.appendChild(ctl('Состояние поповера', [
      ['default', 'Обычное'], ['loading', 'Загрузка'], ['error', 'Ошибка'],
    ], () => state.popState, v => state.popState = v));

    const hint = document.createElement('p');
    hint.style.cssText = 'font:var(--type-body-s); color:var(--text-inactive); margin:-8px 0 0;';
    hint.textContent = 'Кликните по иконке-информеру в превью, чтобы открыть Popover_RiskMetric. Если нет ни зоны, ни рейтинга, ни риск-сегмента с профилем — информера нет и поповер не открывается.';
    controls.appendChild(hint);

    function render() {
      stage.innerHTML = '';
      const box = document.createElement('div'); box.style.cssText = 'padding-top:60px; position:relative;';
      const rating = state.rating === 'none' ? null : Number(state.rating);
      const withDetails = state.details === 'yes';
      rmMount(box, {
        rating, zone: state.zone === 'none' ? null : state.zone,
        ratingDate: '24.10.2025', zoneDate: '24.10.2025',
        segment: withDetails ? 'Международный финансовый институт, НЕ относящийся к группе активов с риском 0%' : null,
        profile: withDetails ? 'Непроектный' : null,
        loading: state.popState === 'loading',
        error: state.popState === 'error' ? RM_ERROR_TEXT : null,
      });
      stage.appendChild(box);
    }
    render();
  })();

  /* ---------------- ИСПОЛЬЗОВАНИЕ: строка таблицы контрагентов ---------------- */
  (function () {
    const host = document.getElementById('use-table');
    if (!host) return;
    const rows = [
      ['ООО «Северная верфь»', 26, 'red'],
      ['АО «Балтийский лизинг»', 12, 'watchlist'],
      ['ПАО «Речной торговый банк»', 4, 'green'],
      ['Фонд «Прибрежные инвестиции»', null, 'black'],
      ['ИП Смирнов А. К.', null, null],
    ];
    rows.forEach(([name, rating, zone]) => {
      const row = document.createElement('div'); row.className = 'rm-usage-row';
      const nm = document.createElement('span'); nm.className = 'rm-usage-row__name'; nm.textContent = name; row.appendChild(nm);
      const cellWrap = document.createElement('span'); cellWrap.className = 'rm-usage-row__metric'; row.appendChild(cellWrap);
      rmMount(cellWrap, { rating, zone, ratingDate: '24.10.2025', zoneDate: '24.10.2025' });
      host.appendChild(row);
    });
  })();

  /* ---------------- АНАТОМИЯ ---------------- */
  (function () {
    const host = document.getElementById('anat-stage');
    if (!host) return;
    const box = document.createElement('div'); box.style.cssText = 'padding-top:60px; position:relative;';
    const rm = rmMount(box, { rating: 26, zone: 'red', ratingDate: '24.10.2025', zoneDate: '24.10.2025' });
    host.appendChild(box);
    requestAnimationFrame(() => { const api = rmPopoverApi(rm); if (api) api.open(); });
  })();

  /* ---------------- РАЗМЕРЫ: redline Chip S ---------------- */
  (function () {
    const host = document.getElementById('sizes-demo');
    if (!host) return;
    rmMount(host, { rating: 26, zone: 'red', ratingDate: '24.10.2025', zoneDate: '24.10.2025' });
  })();

  /* ---------------- СОСТОЯНИЯ: матрица 4×4 (комбинация × зона) ---------------- */
  (function () {
    const grid = document.getElementById('states-matrix');
    if (!grid) return;
    const cols = ['green', 'watchlist', 'red', 'black'];
    grid.appendChild(document.createElement('div'));
    cols.forEach(c => { const h = document.createElement('div'); h.className = 'rm-matrix__colhead'; h.textContent = RM_ZONE_LABEL[c]; grid.appendChild(h); });

    const rowDefs = [
      ['Rate + Zone', (c) => ({ rating: 26, zone: c })],
      ['Zone', (c) => ({ rating: null, zone: c })],
    ];
    rowDefs.forEach(([label, mk]) => {
      const rh = document.createElement('div'); rh.className = 'rm-matrix__rowhead'; rh.textContent = label; grid.appendChild(rh);
      cols.forEach(c => { const cell = document.createElement('div'); cell.className = 'rm-matrix__cell'; grid.appendChild(cell); rmMount(cell, Object.assign({ ratingDate: '24.10.2025', zoneDate: '24.10.2025' }, mk(c))); });
    });

    /* Rate и None не зависят от зоны — одна ячейка на всю ширину */
    const rateRowLabel = document.createElement('div'); rateRowLabel.className = 'rm-matrix__rowhead'; rateRowLabel.textContent = 'Rate'; grid.appendChild(rateRowLabel);
    const rateCell = document.createElement('div'); rateCell.className = 'rm-matrix__cell rm-matrix__cell--span'; grid.appendChild(rateCell);
    rmMount(rateCell, { rating: 26, zone: null, ratingDate: '24.10.2025' });
    const rateNote = document.createElement('span'); rateNote.className = 'rm-matrix__note'; rateNote.textContent = 'не зависит от зоны — всегда outline, дефолтный бордер'; rateCell.appendChild(rateNote);

    const noneRowLabel = document.createElement('div'); noneRowLabel.className = 'rm-matrix__rowhead'; noneRowLabel.textContent = 'Details'; grid.appendChild(noneRowLabel);
    const noneCell = document.createElement('div'); noneCell.className = 'rm-matrix__cell rm-matrix__cell--span'; grid.appendChild(noneCell);
    rmMount(noneCell, { rating: null, zone: null, segment: 'Международный финансовый институт, НЕ относящийся к группе активов с риском 0%', profile: 'Непроектный' });
    const noneNote = document.createElement('span'); noneNote.className = 'rm-matrix__note'; noneNote.textContent = 'нет ни рейтинга, ни зоны, но есть риск-сегмент и риск-профиль — информер остаётся, в поповере зона и рейтинг показаны прочерками'; noneCell.appendChild(noneNote);

    const emptyRowLabel = document.createElement('div'); emptyRowLabel.className = 'rm-matrix__rowhead'; emptyRowLabel.textContent = 'None'; grid.appendChild(emptyRowLabel);
    const emptyCell = document.createElement('div'); emptyCell.className = 'rm-matrix__cell rm-matrix__cell--span'; grid.appendChild(emptyCell);
    rmMount(emptyCell, { rating: null, zone: null });
    const emptyNote = document.createElement('span'); emptyNote.className = 'rm-matrix__note'; emptyNote.textContent = 'данных нет вообще — ни зоны, ни рейтинга, ни риск-сегмента с профилем: иконка-информер отсутствует, поповер не открывается'; emptyCell.appendChild(emptyNote);
  })();

  /* ---------------- Один поповер одновременно ---------------- */
  (function () {
    const host = document.getElementById('single-open-demo');
    if (!host) return;
    const defs = [
      { name: 'ООО «Восток-Ресурс»', rating: 9, zone: 'green' },
      { name: 'АО «Метротранс»', rating: 21, zone: 'watchlist' },
      { name: 'ООО «Дельта-Финанс»', rating: null, zone: 'black' },
    ];
    defs.forEach(d => {
      const row = document.createElement('div'); row.className = 'rm-usage-row';
      const nm = document.createElement('span'); nm.className = 'rm-usage-row__name'; nm.textContent = d.name; row.appendChild(nm);
      const cell = document.createElement('span'); cell.className = 'rm-usage-row__metric'; row.appendChild(cell);
      rmMount(cell, { rating: d.rating, zone: d.zone, ratingDate: '24.10.2025', zoneDate: '24.10.2025' });
      host.appendChild(row);
    });
    /* single-open, клик вне, Esc, ✕, позиционирование — всё в DSPopover, здесь нет ни строчки */
  })();

  /* ---------------- Загрузка и ошибка ---------------- */
  (function () {
    const host = document.getElementById('states-load-error');
    if (!host) return;
    [['Загрузка', { loading: true }], ['Ошибка', { error: RM_ERROR_TEXT }]].forEach(([label, extra]) => {
      const cell = document.createElement('div'); cell.className = 'state-cell';
      const cap = document.createElement('div'); cap.className = 'state-cap'; cap.textContent = label; cell.appendChild(cap);
      const box = document.createElement('div'); box.style.cssText = 'padding-top:60px; position:relative;'; cell.appendChild(box);
      const rm = rmMount(box, Object.assign({ rating: 26, zone: 'red' }, extra));
      host.appendChild(cell);
      requestAnimationFrame(() => { const api = rmPopoverApi(rm); if (api) api.open(); });
    });
  })();

  /* ---------------- КОМПОНЕНТЫ ПОДКАЧКИ ПОПОВЕРА ---------------- */
  (function () {
    const zoneHost = document.getElementById('feeder-zone');
    if (zoneHost) {
      ['green', 'watchlist', 'red', 'black', null].forEach(z => {
        const w = document.createElement('div'); w.innerHTML = rmZoneBlockHTML(z, '24.10.2025'); zoneHost.appendChild(w.firstChild);
      });
    }
    const rateHost = document.getElementById('feeder-rate');
    if (rateHost) {
      const a = document.createElement('div'); a.innerHTML = rmRateBlockHTML(26, '24.10.2025'); rateHost.appendChild(a.firstChild);
      const b = document.createElement('div'); b.innerHTML = rmRateBlockHTML(null, '24.10.2025'); rateHost.appendChild(b.firstChild);
    }
    const fieldHost = document.getElementById('feeder-fields');
    if (fieldHost) {
      fieldHost.innerHTML =
        '<div class="rm-field"><p class="rm-field__label">Риск-сегмент</p><p class="rm-field__value">Международный финансовый институт, НЕ относящийся к группе активов с риском 0%</p></div>' +
        '<div class="rm-field"><p class="rm-field__label">Риск-профиль</p><p class="rm-field__value">Непроектный</p></div>';
    }
  })();

  /* ---------------- ЦВЕТА ---------------- */
  (function () {
    const root = document.getElementById('color-ref');
    if (!root) return;
    const probe = document.createElement('span');
    probe.style.cssText = 'position:absolute;left:-9999px;width:0;height:0;';
    document.body.appendChild(probe);
    function resolveHex(cssValue) {
      probe.style.backgroundColor = 'transparent'; probe.style.backgroundColor = cssValue;
      const v = getComputedStyle(probe).backgroundColor;
      let r, g, b, a = 1, m = v.match(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)/i);
      if (m) { r = +m[1] * 255; g = +m[2] * 255; b = +m[3] * 255; if (m[4] !== undefined) a = +m[4]; }
      else { const n = v.match(/[\d.]+/g); if (!n) return cssValue; r = +n[0]; g = +n[1]; b = +n[2]; if (n[3] !== undefined) a = +n[3]; }
      const hx = n => Math.round(n).toString(16).padStart(2, '0').toUpperCase();
      let s = '#' + hx(r) + hx(g) + hx(b); if (a < 1) s += ' · ' + Math.round(a * 100) + '%'; return s;
    }
    const groups = [
      { name: 'Зоны — светлая заливка (Зелёная / Watchlist)', rows: [['Зеленая — фон', '--st-green-light'], ['Зеленая — текст', '--st-green-dark'], ['Watchlist — фон', '--st-orange-light'], ['Watchlist — текст', '--st-orange-dark']] },
      { name: 'Зоны — solid-заливка (Красная / Чёрная)', rows: [['Красная — фон', '--st-red'], ['Чёрная — фон', '--st-grey'], ['Текст и иконка (обе)', '--c-mgrey-50']] },
      { name: 'Нет зоны (Outline)', rows: [['Border', '--st-system-mid'], ['Текст', '--st-system-dark'], ['Иконка', '--st-system']] },
      { name: 'Popover — поверхность и блок подкачки', rows: [['Фон поповера', '--bg-popup'], ['Фон блока', '--c-cgrey-50'], ['Граница', '--border-light'], ['Радиус', '--radius-popup']] },
    ];
    root.innerHTML = groups.map(g => `
      <section class="cref-group">
        <h3>${g.name}</h3>
        <div class="cref-rows">
          ${g.rows.map(([role, tok]) => `
            <div class="cref-row">
              <div class="cref-sw"><div class="cf" style="background:var(${tok});"></div></div>
              <div class="cref-meta"><p class="role">${role}</p><p class="tname">${tok}</p></div>
              <div class="cref-hex">${resolveHex('var(' + tok + ')')}</div>
            </div>`).join('')}
        </div>
      </section>`).join('');
    probe.remove();
  })();

  /* ---------------- DEV: redline измерено на живом экземпляре ---------------- */
  (function () {
    const off = document.createElement('div'); off.style.cssText = 'position:absolute;left:-9999px;top:0;'; document.body.appendChild(off);
    const rm = rmMount(off, { rating: 26, zone: 'red', ratingDate: '24.10.2025', zoneDate: '24.10.2025' });
    const chipEl = rm.querySelector('.chip');
    const cs = getComputedStyle(chipEl);
    const info = chipEl.querySelector('.chip__info');
    const rows = [
      ['Высота', cs.height],
      ['Паддинг X', cs.paddingLeft],
      ['Зазор label ↔ информер', cs.columnGap],
      ['Радиус', cs.borderTopLeftRadius],
      ['Кегль текста', cs.fontSize],
      ['Иконка-информер', info ? getComputedStyle(info).width : '—'],
    ];
    const popEl = rm.querySelector('.pop');
    const r = v => { const n = parseFloat(v); return isNaN(n) ? v : (Math.round(n * 10) / 10) + ' px'; };
    const rowsHtml = rows.map(([p, v]) => `<div class="tbl__row" style="grid-template-columns:8px 1.84fr 0.81fr 8px;"><div class="tc tc--separator"></div><div class="tc"><span class="tc__row"><span class="tc__text">${p}</span></span></div><div class="tc tc--numbers"><span class="tc__row"><span class="tc__text">${r(v)}</span></span></div><div class="tc tc--separator"></div></div>`).join('');
    ['#dev-chip-table', '#dev-chip-table-dup'].forEach(sel => {
      const tb = document.querySelector(sel);
      if (tb) tb.innerHTML = rowsHtml;
    });
    const tbody2 = document.querySelector('#dev-pop-table');
    if (tbody2 && popEl) {
      popEl.classList.remove('pop--floating'); popEl.style.position = 'static';
      const csp = getComputedStyle(popEl);
      const head = popEl.querySelector('.pop__head'), body = popEl.querySelector('.pop__body');
      const rowsp = [
        ['Ширина (w-m)', csp.width],
        ['Радиус', csp.borderRadius],
        ['Паддинг Header (Y/X)', getComputedStyle(head).paddingTop + ' / ' + getComputedStyle(head).paddingLeft],
        ['Паддинг Body (Y/X)', getComputedStyle(body).paddingTop + ' / ' + getComputedStyle(body).paddingLeft],
        ['Зазор от триггера', '8 px'],
      ];
      tbody2.innerHTML = rowsp.map(([p, v]) => `<div class="tbl__row" style="grid-template-columns:8px 1.84fr 0.81fr 8px;"><div class="tc tc--separator"></div><div class="tc"><span class="tc__row"><span class="tc__text">${p}</span></span></div><div class="tc tc--numbers"><span class="tc__row"><span class="tc__text">${typeof v === 'string' && v.indexOf('/') > -1 ? v.split(' / ').map(r).join(' / ') : r(v)}</span></span></div><div class="tc tc--separator"></div></div>`).join('');
    }
    off.remove();
  })();

  /* ---------------- CONTENT: примеры зон в таблице ---------------- */
  (function () {
    const map = { green: 'content-ex-green', watchlist: 'content-ex-watchlist', red: 'content-ex-red', black: 'content-ex-black', none: 'content-ex-none' };
    Object.keys(map).forEach(zone => {
      const cell = document.getElementById(map[zone]);
      if (!cell) return;
      rmMount(cell, zone === 'none' ? { rating: null, zone: null } : { rating: 26, zone, ratingDate: '24.10.2025', zoneDate: '24.10.2025' });
    });
  })();

  /* ---------------- DEV: copy-to-clipboard ---------------- */
  document.querySelectorAll('.code-panel__copy').forEach(btn => {
    const target = document.getElementById(btn.dataset.copyTarget);
    if (!target) return;
    const label = btn.querySelector('.copy-label');
    btn.addEventListener('click', async () => {
      const text = target.textContent;
      try { await navigator.clipboard.writeText(text); }
      catch (e) {
        const ta = document.createElement('textarea');
        ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
      }
      btn.classList.add('is-copied');
      const prev = label.textContent; label.textContent = 'Скопировано';
      setTimeout(() => { btn.classList.remove('is-copied'); label.textContent = prev; }, 1600);
    });
  });

});
