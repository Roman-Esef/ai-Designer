/* =========================================================================
   TableFilter — страница ДС: конструктор, витрины, модалка фильтра.
   Ядро — бар над таблицей: кнопка «Фильтр» (Outline S) + один чип-счётчик
   «Применено: N» (Chip Edit M), крестик которого сбрасывает все параметры.
   ========================================================================= */
(function () {
  const L = window.DS_ICONS || {};
  const glyph = (n) => L[n] || '';

  /* ---------- пул демонстрационных параметров (для таблиц пресетов) ---------- */
  const PARAM_POOL = [
    ['ТБ', 'ЦА, МБ, СРБ, СЗБ'],
    ['Скрыть сделки', 'ЦЭ'],
    ['Дески', 'RE, TMT, CND'],
    ['Группа продуктов', 'Продукты ДИД, Кредиты, Лизинг'],
    ['Валюта', 'RUB, USD, EUR'],
    ['Стадия', 'Согласование, Подписание'],
    ['Клиентский менеджер', 'Иванов И. И.'],
    ['Сумма', 'от 100 млн RUB'],
  ];
  function paramsFor(n) {
    const out = [];
    for (let i = 0; i < n; i++) out.push(PARAM_POOL[i % PARAM_POOL.length]);
    return out;
  }

  /* ---------- чип-счётчик «Применено: N» ---------- */
  function makeAppliedChip(count) {
    const el = document.createElement('span');
    el.className = 'chip chip--edit chip--m tfilter__applied';
    el.tabIndex = 0;
    el.innerHTML =
      '<span class="chip__label">Применено: ' + count + '</span>' +
      '<span class="chip__remove" role="button" aria-label="Сбросить все фильтры">' + glyph('close') + '</span>';
    return el;
  }

  /* ---------- сборка бара ---------- */
  function buildBar(o = {}) {
    const { applied = false, count = 0, disabled = false, onReset = null,
            presetList = null, onApplyPreset = null } = o;
    const bar = document.createElement('div');
    bar.className = 'tfilter';
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', 'Фильтр таблицы');
    if (disabled) { bar.classList.add('tfilter--disabled'); bar.setAttribute('aria-disabled', 'true'); }

    const openBtn = '<button type="button" class="btn btn--outline btn--s tfilter__open" aria-haspopup="dialog" aria-expanded="false"><i data-icon="filter"></i><span class="btn__label">Фильтр</span></button>';

    if (presetList && presetList.length) {
      /* есть сохранённые пресеты → Split Button: «Фильтр» + шеврон со списком */
      bar.innerHTML =
        '<span class="menu-anchor tfilter__split">' +
          '<span class="btn-group btn-group--outline btn-group--split" role="group" aria-label="Фильтр">' +
            openBtn +
            '<button type="button" class="btn btn--outline btn--s btn--icon-only tfilter__presets" aria-haspopup="menu" aria-expanded="false" aria-label="Сохранённые пресеты">' + glyph('chevron-down').replace('<svg', '<svg class="btn__chevron tfilter__chev"') + '</button>' +
          '</span>' +
          '<div class="menu menu--floating tfilter__menu" role="menu" aria-label="Сохранённые пресеты" hidden>' +
            '<div class="menu__label">Сохранённые пресеты</div>' +
            presetList.map((p, i) => '<button type="button" class="menu__item" role="menuitem" data-preset="' + i + '">' +
              '<span class="menu__item-label">' + p.name + '</span>' +
              '<span class="menu__item-hint">' + p.params.length + '</span></button>').join('') +
          '</div>' +
        '</span>';
    } else {
      bar.innerHTML = openBtn;
    }

    if (applied && count > 0) {
      const chip = makeAppliedChip(count);
      bar.appendChild(chip);
      /* сброс (клик по крестику / Backspace-Delete, фейд, удаление чипа) —
         рантайм ДС (scripts/ds-table-filter.js); он всплывает 'tfilter:reset' на .tfilter */
      if (onReset) bar.addEventListener('tfilter:reset', onReset, { once: true });
    }

    /* выпадающий список пресетов */
    const chevBtn = bar.querySelector('.tfilter__presets');
    if (chevBtn) {
      /* поведение — рантайм ДС (scripts/ds-menu.js): открытие/закрытие,
         позиция, клавиатура, Esc, закрытие по выбору пункта */
      const menu = bar.querySelector('.tfilter__menu');
      if (window.DSMenu) DSMenu.bind(chevBtn, { menu: menu, align: 'end' });
      menu.querySelectorAll('.menu__item').forEach(item => {
        item.addEventListener('click', () => {
          onApplyPreset && onApplyPreset(presetList[parseInt(item.dataset.preset, 10)]);
        });
      });
    }

    window.dsIcons && window.dsIcons.apply(bar);
    return bar;
  }

  /* ========================================================================= */
  document.addEventListener('DOMContentLoaded', () => {

    /* сохранённые пресеты — общие для бара и модалки */
    const presets = [
      { name: 'Мои сделки ЦА', params: [['ТБ', 'ЦА'], ['Дески', 'RE, TMT'], ['Стадия', 'Согласование']] },
      { name: 'Крупные кредиты RUB', params: [['Группа продуктов', 'Кредиты'], ['Валюта', 'RUB'], ['Сумма', 'от 100 млн RUB'], ['Стадия', 'Подписание']] },
    ];

    /* ---------------- КОНСТРУКТОР ---------------- */
    (function () {
      const controls = document.getElementById('pg-controls');
      const stage = document.getElementById('pg-stage');
      if (!controls || !stage) return;
      const state = { applied: 'yes', count: '3', mode: 'default', presets: 'no' };

      function ctl(labelText, options, get, set, keepSelect) {
        const wrap = document.createElement('div'); wrap.className = 'ctl';
        if (keepSelect) wrap.dataset.pgKeepSelect = '';
        const l = document.createElement('div'); l.className = 'lbl'; l.textContent = labelText; wrap.appendChild(l);
        const box = document.createElement('div'); box.className = 'pg-select';
        const sel = document.createElement('select');
        options.forEach(([v, t]) => { const o = document.createElement('option'); o.value = v; o.textContent = t; if (v === get()) o.selected = true; sel.appendChild(o); });
        sel.value = get();
        sel.addEventListener('change', () => { set(sel.value); render(); });
        box.appendChild(sel); wrap.appendChild(box);
        return wrap;
      }

      const cApplied = ctl('Фильтр применён', [['no', 'Нет'], ['yes', 'Да']], () => state.applied, v => state.applied = v);
      const cCount = ctl('Параметров применено', [['1', '1'], ['2', '2'], ['3', '3'], ['4', '4'], ['5', '5'], ['8', '8'], ['12', '12']], () => state.count, v => state.count = v, true);
      const cMode = ctl('Состояние', [['default', 'Обычный'], ['disabled', 'Заблокирован']], () => state.mode, v => state.mode = v);
      const cPresets = ctl('Сохранённые пресеты', [['no', 'Нет'], ['yes', 'Есть — Split Button']], () => state.presets, v => state.presets = v);
      controls.append(cApplied, cCount, cPresets, cMode);

      function render() {
        const applied = state.applied === 'yes';
        cCount.classList.toggle('is-off', !applied);
        stage.innerHTML = '';
        const bar = buildBar({
          applied,
          count: parseInt(state.count, 10),
          disabled: state.mode === 'disabled',
          presetList: state.presets === 'yes' ? presets : null,
          onApplyPreset: (p) => {
            state.applied = 'yes'; state.count = String(p.params.length);
            cApplied.querySelector('select').value = 'yes';
            const cs = cCount.querySelector('select');
            if (!Array.from(cs.options).some(o => o.value === state.count)) {
              const o = document.createElement('option'); o.value = state.count; o.textContent = state.count; cs.appendChild(o);
            }
            cs.value = state.count;
            render();
          },
          onReset: () => { state.applied = 'no'; cApplied.querySelector('select').value = 'no'; render(); },
        });
        stage.appendChild(bar);
        const open = bar.querySelector('.tfilter__open');
        open && open.addEventListener('click', () => openFilterModal(open));
      }
      render();
    })();

    /* ---------------- АНАТОМИЯ ---------------- */
    (function () {
      const host = document.getElementById('anat-stage');
      if (!host) return;
      host.appendChild(buildBar({ applied: true, count: 3 }));
    })();

    /* ---------------- ВАРИАНТЫ · СОСТОЯНИЕ БАРА ---------------- */
    (function () {
      const host = document.getElementById('variants-states');
      if (!host) return;
      const rows = [
        { k: 'Filtered = No', d: 'Фильтр не применён — только кнопка «Фильтр»', bar: { applied: false } },
        { k: 'Filtered = Yes', d: 'Применён ≥1 параметр — рядом чип «Применено: N»', bar: { applied: true, count: 3 } },
      ];
      rows.forEach(r => {
        const row = document.createElement('div'); row.className = 'vrow';
        row.innerHTML = '<div class="vrow__cap"><span class="k">' + r.k + '</span><span class="d">' + r.d + '</span></div>';
        const demo = document.createElement('div'); demo.className = 'vrow__demo';
        demo.appendChild(buildBar(r.bar));
        row.appendChild(demo); host.appendChild(row);
      });
    })();

    /* ---------------- ВАРИАНТЫ · ЧИП «ПРИМЕНЕНО» ---------------- */
    (function () {
      const host = document.getElementById('variants-chip');
      if (!host) return;
      [1, 3, 12].forEach(n => {
        const row = document.createElement('div'); row.className = 'vrow';
        row.innerHTML = '<div class="vrow__cap"><span class="k">N = ' + n + '</span><span class="d">Chip · Edit · M, крестик сбрасывает все параметры</span></div>';
        const demo = document.createElement('div'); demo.className = 'vrow__demo';
        demo.appendChild(makeAppliedChip(n));
        window.dsIcons && window.dsIcons.apply(demo);
        row.appendChild(demo); host.appendChild(row);
      });
    })();

    /* ---------------- ВАРИАНТЫ · С ПРЕСЕТАМИ (Split Button) ---------------- */
    (function () {
      const host = document.getElementById('variants-presets');
      if (!host) return;
      const rows = [
        { k: 'Пресетов нет', d: 'Одиночная кнопка «Фильтр»', bar: {} },
        { k: 'Есть пресеты', d: 'ButtonGroup Split: «Фильтр» + шеврон со списком пресетов', bar: { presetList: presets } },
        { k: 'Пресет применён', d: 'Справа от группы — чип «Применено: N» по числу параметров пресета', bar: { presetList: presets, applied: true, count: 3 } },
      ];
      rows.forEach(r => {
        const row = document.createElement('div'); row.className = 'vrow';
        row.innerHTML = '<div class="vrow__cap"><span class="k">' + r.k + '</span><span class="d">' + r.d + '</span></div>';
        const demo = document.createElement('div'); demo.className = 'vrow__demo';
        demo.appendChild(buildBar(r.bar));
        row.appendChild(demo); host.appendChild(row);
      });
    })();

    /* ---------------- СОСТОЯНИЯ ---------------- */
    (function () {
      const host = document.getElementById('states-demo');
      if (!host) return;
      const items = [
        { cap: 'По умолчанию', desc: 'Применён фильтр — кнопка и чип-счётчик', bar: { applied: true, count: 3 } },
        { cap: 'Заблокирован', desc: 'Бар недоступен целиком — pointer-events: none, opacity', bar: { applied: true, count: 3, disabled: true } },
        { cap: 'Без фильтра', desc: 'Нет применённых параметров — только кнопка «Фильтр»', bar: { applied: false } },
      ];
      items.forEach(it => {
        const cell = document.createElement('div'); cell.className = 'state-cell';
        cell.innerHTML = '<span class="state-cap">' + it.cap + '</span>';
        const box = document.createElement('div'); box.style.cssText = 'width:100%;';
        box.appendChild(buildBar(it.bar)); cell.appendChild(box);
        cell.insertAdjacentHTML('beforeend', '<span class="state-desc">' + it.desc + '</span>');
        host.appendChild(cell);
      });
    })();

    /* ---------------- ЦВЕТА ---------------- */
    (function () {
      const root = document.getElementById('color-ref');
      if (!root) return;
      const groups = [
        { name: 'Кнопка «Фильтр» (Outline)', rows: [
          ['Ведущая воронка', '--primary'], ['Обводка', '--border-primary'],
          ['Текст', '--text-primary'], ['Фон', '--bg-tile'],
        ]},
        { name: 'Чип «Применено: N» (Edit · Fill)', rows: [
          ['Фон', '--st-system-light'], ['Обводка', '--st-system-midlight'],
          ['Текст', '--text-primary'], ['Крестик', '--text-secondary'],
        ]},
        { name: 'Заблокированный бар', rows: [
          ['Прозрачность', '--st-disabled-mid'],
        ]},
      ];
      root.innerHTML = groups.map(g => `
        <section class="cref-group">
          <h3>${g.name}</h3>
          <div class="cref-rows">
            ${g.rows.map(([role, tok]) => `
              <div class="cref-row">
                <div class="cref-sw"><div class="cf" style="background:var(${tok});"></div></div>
                <div class="cref-meta"><p class="role">${role}</p><p class="tname">${tok}</p></div>
              </div>`).join('')}
          </div>
        </section>`).join('');
    })();

    /* ---------------- РАЗМЕРЫ + REDLINE (измерено на живом экземпляре) ---------------- */
    (function () {
      const sizeBody = document.querySelector('#size-table');
      const devBody = document.querySelector('#dev-spec-table');
      if (!sizeBody && !devBody) return;
      const host = document.createElement('div');
      host.style.cssText = 'position:absolute; left:-9999px; top:0; width:900px;';
      document.body.appendChild(host);
      const bar = buildBar({ applied: true, count: 3 });
      host.appendChild(bar);
      const r = n => Math.round(parseFloat(n) * 10) / 10;
      const btn = bar.querySelector('.tfilter__open');
      const chip = bar.querySelector('.chip');
      const csBar = getComputedStyle(bar);
      const csBtn = getComputedStyle(btn);
      const csChip = getComputedStyle(chip);
      const lbl = getComputedStyle(chip.querySelector('.chip__label'));

      if (sizeBody) {
        const rows = [
          ['Кнопка «Фильтр»', 'Button · Outline S', Math.round(parseFloat(csBtn.height)) + ' px', 'Ведущая воронка 16px, тонирована в --primary'],
          ['Чип «Применено: N»', 'Chip · Edit M', Math.round(parseFloat(csChip.height)) + ' px', 'Крестик сбрасывает все параметры'],
          ['Зазор между кнопкой и чипом', '—', Math.round(parseFloat(csBar.columnGap)) + ' px', 'Единственный отступ внутри бара'],
        ];
        sizeBody.innerHTML = rows.map(([a, b, c, d]) => `<div class="tbl__row" style="grid-template-columns:8px 1.84fr 1.26fr 0.72fr 0.95fr 8px;"><div class="tc tc--separator"></div><div class="tc"><span class="tc__row"><span class="tc__text">${a}</span></span></div><div class="tc tc--wrap"><span class="tc__row"><span class="tc__text">${b}</span></span></div><div class="tc tc--numbers"><span class="tc__row"><span class="tc__text">${c}</span></span></div><div class="tc"><span class="tc__row"><span class="tc__text">${d}</span></span></div><div class="tc tc--separator"></div></div>`).join('');
      }
      if (devBody) {
        const rows = [
          ['Зазор бара (row / column)', r(csBar.rowGap) + ' / ' + r(csBar.columnGap) + ' px'],
          ['Высота кнопки «Фильтр»', r(csBtn.height) + ' px'],
          ['Паддинг кнопки (X)', r(csBtn.paddingLeft) + ' / ' + r(csBtn.paddingRight) + ' px'],
          ['Радиус кнопки', r(csBtn.borderTopLeftRadius) + ' px'],
          ['Высота чипа «Применено: N»', r(csChip.height) + ' px'],
          ['Паддинг чипа (Y / X)', r(csChip.paddingTop) + ' / ' + r(csChip.paddingLeft) + ' … ' + r(csChip.paddingRight) + ' px'],
          ['Радиус чипа', r(csChip.borderTopLeftRadius) + ' px'],
          ['Типографика чипа (кегль / интерлиньяж)', r(lbl.fontSize) + ' / ' + r(lbl.lineHeight) + ' px'],
        ];
        devBody.innerHTML = rows.map(([k, v]) => `<div class="tbl__row" style="grid-template-columns:8px 1.84fr 0.81fr 8px;"><div class="tc tc--separator"></div><div class="tc"><span class="tc__row"><span class="tc__text">${k}</span></span></div><div class="tc tc--numbers"><span class="tc__row"><span class="tc__text">${v}</span></span></div><div class="tc tc--separator"></div></div>`).join('');
      }
      host.remove();
    })();

    /* ---------------- МОДАЛКА ФИЛЬТРА ---------------- */
    let openerEl = null;

    function nested(parentScrim, opts) {
      const { title, body, danger, confirmLabel, onConfirm, width } = opts;
      const scrim = document.createElement('div');
      scrim.className = 'modal-scrim modal-scrim--nested';
      const w = width || (danger ? 3 : 4);
      scrim.innerHTML =
        '<div class="modal modal--w' + w + '" role="alertdialog" aria-modal="true">' +
          '<header class="modal__head"><h2 class="modal__title">' + title + '</h2>' +
          '<span class="modal__close"><button type="button" class="ibtn ibtn--neutral ibtn--l" aria-label="Закрыть"><i data-icon="close"></i></button></span></header>' +
          '<div class="modal__body">' + body + '</div>' +
          '<footer class="modal__foot"><div class="modal__foot-left"></div><div class="modal__foot-right">' +
            '<button type="button" class="btn btn--outline btn--m" data-modal-close><span class="btn__label">Отмена</span></button>' +
            '<button type="button" class="btn btn--accent btn--m' + (danger ? ' btn--danger' : '') + ' nested-ok"><span class="btn__label">' + confirmLabel + '</span></button>' +
          '</div></footer>' +
        '</div>';
      parentScrim.appendChild(scrim);
      window.dsIcons && window.dsIcons.apply(scrim);
      scrim.querySelector('.nested-ok').addEventListener('click', () => { onConfirm && onConfirm(scrim); DSModal.closeTop(); });
      /* слой ведёт рантайм ДС: крестик, Отмена, Esc, клик по скриму, фокус и его возврат */
      DSModal.open(scrim, { nested: true, returnFocus: parentScrim.querySelector('.tfm-save, .modal__close button') });
      return scrim;
    }

    /* ---------- секция «Общая информация» ---------- */
    function generalSection() {
      return '<section class="tfm__sec" id="tfm-sec-general" aria-labelledby="tfm-sec-general-t">' +
        '<p class="tfm__sec-title" id="tfm-sec-general-t">Общая информация</p>' +
        '<div class="tfm__grid">' +
          '<div class="inp"><label class="ds-label" for="tfm-name"><span class="ds-label__text">Название сделки</span></label>' +
            '<div class="inp__field"><input class="inp__control" id="tfm-name" placeholder="Например, 1-Кредит-199"></div></div>' +
          '<div class="inp"><label class="ds-label" for="tfm-client"><span class="ds-label__text">Клиент</span></label>' +
            '<div class="inp__field"><input class="inp__control" id="tfm-client" placeholder="Наименование или ИНН"></div></div>' +
          '<div class="inp tfm__span-2"><label class="ds-label"><span class="ds-label__text">Территориальный банк</span></label>' +
            '<div class="inp__field"><span class="inp__chips">' +
              '<span class="chip chip--edit chip--s"><span class="chip__label">ЦА</span><span class="chip__remove" role="button" aria-label="Убрать ЦА">' + glyph('close') + '</span></span>' +
              '<span class="chip chip--edit chip--s"><span class="chip__label">МБ</span><span class="chip__remove" role="button" aria-label="Убрать МБ">' + glyph('close') + '</span></span>' +
            '</span><input class="inp__control" placeholder="Добавить…"><span class="inp__acts"><button class="inp__act" aria-label="Показать список">' + glyph('chevron-down') + '</button></span></div></div>' +
          '<div class="inp"><label class="ds-label"><span class="ds-label__text">Группа продуктов</span></label>' +
            '<div class="inp__field"><span class="inp__chips">' +
              '<span class="chip chip--edit chip--s"><span class="chip__label">Кредиты</span><span class="chip__remove" role="button" aria-label="Убрать Кредиты">' + glyph('close') + '</span></span>' +
            '</span><input class="inp__control" placeholder="Добавить…"><span class="inp__acts"><button class="inp__act" aria-label="Показать список">' + glyph('chevron-down') + '</button></span></div></div>' +
          '<div class="inp"><label class="ds-label" for="tfm-cur"><span class="ds-label__text">Валюта</span></label>' +
            '<div class="inp__field"><input class="inp__control" id="tfm-cur" placeholder="Все валюты"><span class="inp__acts"><button class="inp__act" aria-label="Показать список">' + glyph('chevron-down') + '</button></span></div></div>' +
          '<label class="cb cb--selected tfm__span-2"><input type="checkbox" class="cb__input" checked>' +
            '<span class="cb__box"><span class="cb__mark">' + glyph('check') + '</span></span>' +
            '<span class="cb__content"><span class="cb__label">Скрыть сделки ЦЭ</span></span></label>' +
        '</div>' +
      '</section>';
    }

    /* ---------- секция «Даты» ---------- */
    function datesSection() {
      const dateRange = (label) =>
        '<div class="inp-range inp-range--date tfm__span-2">' +
          '<label class="ds-label"><span class="ds-label__text">' + label + '</span></label>' +
          '<div class="inp-range__row">' +
            '<div class="inp inp-range__field"><div class="inp__field">' +
              '<span class="inp__prefix">От</span>' +
              '<input class="inp__control" inputmode="numeric" placeholder="ДД.ММ.ГГГГ">' +
              '<span class="inp__acts"><button class="inp__act" aria-label="Открыть календарь" aria-haspopup="dialog">' + glyph('calendar') + '</button></span>' +
            '</div></div>' +
            '<span class="inp-range__line" aria-hidden="true"></span>' +
            '<div class="inp inp-range__field"><div class="inp__field">' +
              '<span class="inp__prefix">До</span>' +
              '<input class="inp__control" inputmode="numeric" placeholder="ДД.ММ.ГГГГ">' +
              '<span class="inp__acts"><button class="inp__act" aria-label="Открыть календарь" aria-haspopup="dialog">' + glyph('calendar') + '</button></span>' +
            '</div></div>' +
          '</div>' +
        '</div>';
      return '<section class="tfm__sec" id="tfm-sec-dates" aria-labelledby="tfm-sec-dates-t">' +
        '<p class="tfm__sec-title" id="tfm-sec-dates-t">Даты</p>' +
        '<div class="tfm__grid">' +
          dateRange('Дата сделки') + dateRange('Дата изменения') +
        '</div>' +
      '</section>';
    }

    /* ---------- секция «Сохранённые пресеты» ---------- */
    function presetsSection(scrim) {
      const sec = document.createElement('section');
      sec.className = 'tfm__sec';
      sec.id = 'tfm-sec-presets';
      sec.setAttribute('aria-labelledby', 'tfm-sec-presets-t');
      sec.innerHTML = '<p class="tfm__sec-title" id="tfm-sec-presets-t">Сохранённые пресеты</p>';
      const list = document.createElement('div'); list.className = 'preset-list';
      function draw() {
        list.innerHTML = '';
        if (!presets.length) {
          list.innerHTML = '<div class="preset-empty">Пока нет сохранённых пресетов.<br>Настройте параметры и сохраните набор.</div>';
        } else {
          presets.forEach((p, i) => {
            const item = document.createElement('div'); item.className = 'preset-item';
            const bodyId = 'preset-body-' + i;
            item.innerHTML =
              '<div class="preset-row">' +
                '<button type="button" class="ibtn ibtn--neutral ibtn--s pr-toggle" aria-expanded="false" aria-controls="' + bodyId + '" aria-label="Показать параметры пресета"><span class="pr-chev"><i data-icon="chevron-down"></i></span></button>' +
                '<span class="preset-row__name">' + p.name + '</span>' +
                '<span class="preset-row__count">' + p.params.length + ' парам.</span>' +
                '<button type="button" class="btn btn--outline btn--xs pr-apply"><span class="btn__label">Применить</span></button>' +
                '<button type="button" class="ibtn ibtn--neutral ibtn--s pr-del" aria-label="Удалить пресет"><i data-icon="trash"></i></button>' +
              '</div>' +
              '<div class="preset-item__body" id="' + bodyId + '" hidden>' +
                '<div class="tbl" style="grid-template-columns:none;border:none;border-radius:0;"><div class="tbl__row" style="grid-template-columns:8px 1.84fr 0.81fr 8px;"><div class="th th--separator"></div><div class="th"><span class="th__label">Параметр</span></div><div class="th"><span class="th__label">Значение</span></div><div class="th th--separator"></div></div>' +
                p.params.map(([k, v]) => '<div class="tbl__row" style="grid-template-columns:8px 1.84fr 0.81fr 8px;"><div class="tc tc--separator"></div><div class="tc"><span class="tc__row"><span class="tc__text">' + k + '</span></span></div><div class="tc"><span class="tc__row"><span class="tc__text">' + v + '</span></span></div><div class="tc tc--separator"></div></div>').join('') +
                '</div>' +
              '</div>';

            const toggle = item.querySelector('.pr-toggle');
            const body = item.querySelector('.preset-item__body');
            toggle.addEventListener('click', () => {
              const open = toggle.getAttribute('aria-expanded') !== 'true';
              toggle.setAttribute('aria-expanded', String(open));
              toggle.setAttribute('aria-label', open ? 'Скрыть параметры пресета' : 'Показать параметры пресета');
              body.hidden = !open;
              item.classList.toggle('is-open', open);
              const chev = toggle.querySelector('.pr-chev i');
              chev && chev.setAttribute('data-icon', open ? 'chevron-up' : 'chevron-down');
              window.dsIcons && window.dsIcons.apply(toggle);
            });
            item.querySelector('.pr-del').addEventListener('click', () => {
              nested(scrim, {
                title: 'Удалить пресет?', danger: true, confirmLabel: 'Удалить',
                body: '<p style="margin:0;">Пресет «' + p.name + '» будет удалён без возможности восстановления.</p>',
                onConfirm: () => { presets.splice(i, 1); draw(); },
              });
            });
            item.querySelector('.pr-apply').addEventListener('click', () => closeFilterModal(true));
            list.appendChild(item);
          });
        }
        window.dsIcons && window.dsIcons.apply(list);
      }
      draw();
      sec.appendChild(list);
      sec._draw = draw;
      return sec;
    }

    let activeScrim = null;
    function openFilterModal(opener) {
      if (activeScrim) closeFilterModal(false);
      openerEl = opener || null;
      const scrim = document.createElement('div');
      scrim.className = 'modal-scrim';
      const modal = document.createElement('div');
      modal.className = 'modal modal--w6 tfm';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-labelledby', 'tfm-title');

      /* вертикальные табы работают как якорные ссылки по контентной области */
      const sections = [
        { id: 'tfm-sec-general', label: 'Общая информация', count: 3 },
        { id: 'tfm-sec-dates', label: 'Даты', count: 1 },
        { id: 'tfm-sec-presets', label: 'Сохранённые пресеты', count: 0 },
      ];
      const nav = '<nav class="tabs tabs--vert tfm__nav" aria-label="Разделы фильтра">' +
        sections.map((s, i) => '<button type="button" class="tab tab--m tab--vert' + (i === 0 ? ' tab--selected' : '') + '"' +
          (i === 0 ? ' aria-current="true"' : '') + ' data-target="' + s.id + '">' +
          '<span class="tab__label">' + s.label + '</span>' +
          (s.count ? '<span class="tab__badge">' + s.count + '</span>' : '') +
          '</button>').join('') +
        '</nav>';

      modal.innerHTML =
        '<header class="modal__head"><h2 class="modal__title" id="tfm-title">Фильтр</h2>' +
          '<span class="modal__close"><button type="button" class="ibtn ibtn--neutral ibtn--l" aria-label="Закрыть"><i data-icon="close"></i></button></span></header>' +
        '<div class="modal__body modal__body--flush"><div class="tfm__body">' + nav +
          '<div class="tfm__panel" id="tfm-panel"></div></div></div>' +
        '<footer class="modal__foot"><div class="modal__foot-left">' +
          '<button type="button" class="btn btn--transparent btn--m tfm-save"><i data-icon="bookmark-add"></i><span class="btn__label">Сохранить пресет</span></button>' +
          '</div><div class="modal__foot-right">' +
          '<button type="button" class="btn btn--transparent btn--m tfm-clear"><span class="btn__label">Очистить</span></button>' +
          '<button type="button" class="btn btn--accent btn--m tfm-apply"><span class="btn__label">Применить</span></button>' +
        '</div></footer>';

      scrim.appendChild(modal);
      activeScrim = scrim;
      if (opener) opener.setAttribute('aria-expanded', 'true');

      const panel = modal.querySelector('#tfm-panel');
      const scroller = modal.querySelector('.modal__body');
      const head = modal.querySelector('.modal__head');
      const foot = modal.querySelector('.modal__foot');
      panel.insertAdjacentHTML('beforeend', generalSection() + datesSection());
      const presetsWrap = presetsSection(scrim);
      panel.appendChild(presetsWrap);
      window.dsIcons && window.dsIcons.apply(panel);

      /* --- табы-якоря: клик скроллит Modal_Body к секции --- */
      const tabs = Array.from(modal.querySelectorAll('.tfm__nav .tab'));
      function setActive(id) {
        tabs.forEach(t => {
          const on = t.dataset.target === id;
          t.classList.toggle('tab--selected', on);
          if (on) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current');
        });
      }
      const offsetIn = (el) => scroller.scrollTop + (el.getBoundingClientRect().top - scroller.getBoundingClientRect().top);
      let spyLock = 0;
      tabs.forEach(t => {
        t.addEventListener('click', () => {
          const sec = panel.querySelector('#' + t.dataset.target);
          if (!sec) return;
          setActive(t.dataset.target);
          spyLock = Date.now() + 900;
          scroller.scrollTo({ top: Math.max(0, offsetIn(sec) - 16), behavior: 'smooth' });
        });
      });

      /* --- тени шапки/подвала + scroll spy на прокрутке Modal_Body (правило Modal) --- */
      function onScroll() {
        head.classList.toggle('is-scrolled', scroller.scrollTop > 0);
        foot.classList.toggle('is-scrolled', scroller.scrollTop + scroller.clientHeight < scroller.scrollHeight - 1);
        if (Date.now() < spyLock) return;
        const secs = Array.from(panel.querySelectorAll('.tfm__sec'));
        if (!secs.length) return;
        if (scroller.scrollTop >= scroller.scrollHeight - scroller.clientHeight - 2) { setActive(secs[secs.length - 1].id); return; }
        let current = secs[0];
        secs.forEach(s => { if (offsetIn(s) - scroller.scrollTop <= 48) current = s; });
        current && setActive(current.id);
      }
      scroller.addEventListener('scroll', onScroll);
      onScroll();

      modal.addEventListener('click', (e) => {
        const save = e.target.closest && e.target.closest('.tfm-save');
        if (!save) return;
        nested(scrim, {
          title: 'Сохранить пресет', confirmLabel: 'Сохранить', width: 3,
          body: '<div class="inp"><label class="ds-label"><span class="ds-label__text">Название пресета</span></label><div class="inp__field"><input class="inp__control nested-name" placeholder="Например, Мои сделки"></div></div>',
          onConfirm: (s) => {
            const name = (s.querySelector('.nested-name').value || '').trim() || 'Новый пресет';
            const exists = presets.find(p => p.name === name);
            const current = paramsFor(4);
            if (exists) {
              nested(scrim, {
                title: 'Заменить пресет?', confirmLabel: 'Заменить', width: 3,
                body: '<p style="margin:0;">Пресет с именем «' + name + '» уже существует. Заменить его текущими параметрами?</p>',
                onConfirm: () => { exists.params = current; presetsWrap._draw && presetsWrap._draw(); },
              });
            } else if (presets.length >= 5) {
              nested(scrim, { title: 'Достигнут лимит', confirmLabel: 'Понятно', width: 3, body: '<p style="margin:0;">Сохранено максимум 5 пресетов. Удалите один, чтобы добавить новый.</p>' });
            } else {
              presets.push({ name, params: current }); presetsWrap._draw && presetsWrap._draw();
            }
          },
        });
      });

      modal.querySelector('.tfm-clear').addEventListener('click', () => {
        modal.querySelectorAll('.tfm__sec .chip').forEach(c => c.remove());
        modal.querySelectorAll('.tfm__sec .inp__control').forEach(i => { i.value = ''; });
        modal.querySelectorAll('.tfm__sec .cb__input').forEach(i => { i.checked = false; });
      });
      modal.querySelector('.tfm-apply').addEventListener('click', () => closeFilterModal(true));
      window.dsIcons && window.dsIcons.apply(scrim);

      /* слой ведёт рантайм ДС (scripts/ds-modal.js): портал в body, блокировка
         прокрутки, inert фона, focus trap, крестик/Esc/клик по скриму, тени
         шапки и подвала, возврат фокуса на инициатора */
      DSModal.open(scrim, {
        returnFocus: opener || null,
        onClose: () => {
          activeScrim = null;
          if (openerEl) { openerEl.setAttribute('aria-expanded', 'false'); openerEl = null; }
        },
      });
    }

    function closeFilterModal() { DSModal.closeAll(); }

    const openBtn = document.getElementById('open-modal');
    openBtn && openBtn.addEventListener('click', () => openFilterModal(openBtn));

    /* ---------------- COPY-TO-CLIPBOARD ---------------- */
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
          document.body.appendChild(ta); ta.select();
          try { document.execCommand('copy'); } catch (e2) {}
          ta.remove();
        }
        btn.classList.add('is-copied');
        const prev = label.textContent; label.textContent = 'Скопировано';
        setTimeout(() => { btn.classList.remove('is-copied'); label.textContent = prev; }, 1600);
      });
    });

    /* ---------- статичные/живые примеры к разделу «Поведение» ---------- */
    (function () {
      const modalNav = document.getElementById('demo-modalnav');
      if (modalNav) {
        const nav = document.createElement('nav');
        nav.className = 'tabs tabs--vert';
        nav.setAttribute('aria-label', 'Разделы фильтра (пример)');
        nav.style.cssText = 'width:220px;background:var(--tertiary-light);border:1px solid var(--border-light);border-radius:10px;padding:8px;';
        nav.innerHTML = [
          ['Общая информация', 0, false],
          ['Даты', 2, true],
          ['Сохранённые пресеты', 0, false],
        ].map(([label, count, sel]) => '<button type="button" class="tab tab--m tab--vert' + (sel ? ' tab--selected' : '') + '"' + (sel ? ' aria-current="true"' : '') + '><span class="tab__label">' + label + '</span>' + (count ? '<span class="tab__badge">' + count + '</span>' : '') + '</button>').join('');
        modalNav.prepend(nav);
      }

      const presetPick = document.getElementById('demo-presetpick');
      if (presetPick) {
        const mount = () => {
          presetPick.querySelector('.tfilter') && presetPick.querySelector('.tfilter').remove();
          const bar = buildBar({
            presetList: [{ name: 'Мои сделки ЦА', params: paramsFor(3) }, { name: 'Просрочка МБ', params: paramsFor(2) }],
            onApplyPreset: (p) => { presetPick.querySelector('.tfilter').replaceWith(buildBar({ applied: true, count: p.params.length })); },
          });
          presetPick.prepend(bar);
        };
        mount();
      }

      const scrollLock = document.getElementById('demo-scrolllock');
      if (scrollLock) {
        const frame = (locked) => '<div style="width:150px;height:104px;border:1px solid var(--border-light);border-radius:10px;background:var(--bg-tile);padding:10px;display:flex;flex-direction:column;gap:6px;position:relative;overflow:hidden;' + (locked ? 'opacity:.5;' : '') + '">' +
          '<div style="height:8px;width:60%;border-radius:4px;background:var(--border-primary);"></div>' +
          '<div style="height:8px;width:85%;border-radius:4px;background:var(--border-primary);"></div>' +
          '<div style="height:8px;width:70%;border-radius:4px;background:var(--border-primary);"></div>' +
          (locked ? '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:color-mix(in srgb, var(--text-primary) 6%, transparent);"><div style="width:74px;height:44px;border-radius:8px;background:var(--bg-tile);border:1px solid var(--border-primary);box-shadow:0 4px 12px color-mix(in srgb, var(--text-primary) 16%, transparent);"></div></div>' : '') +
          '</div>';
        const wrap = document.createElement('div');
        wrap.style.cssText = 'display:flex;gap:20px;align-items:flex-start;';
        wrap.innerHTML =
          '<div style="display:flex;flex-direction:column;gap:8px;align-items:center;"><span class="state-desc">Обычная страница</span>' + frame(false) + '</div>' +
          '<div style="display:flex;flex-direction:column;gap:8px;align-items:center;"><span class="state-desc">Модалка открыта</span>' + frame(true) + '</div>';
        scrollLock.prepend(wrap);
      }

      const counter = document.getElementById('demo-counter');
      if (counter) {
        const col = (label, bar) => {
          const c = document.createElement('div');
          c.style.cssText = 'display:flex;flex-direction:column;gap:8px;';
          c.innerHTML = '<span class="state-desc">' + label + '</span>';
          c.appendChild(bar);
          return c;
        };
        counter.append(col('До применения', buildBar({ applied: false })), col('После применения', buildBar({ applied: true, count: 3 })));
      }

      const reset = document.getElementById('demo-reset');
      if (reset) reset.prepend(buildBar({ applied: true, count: 2 }));

      const presets = document.getElementById('demo-presets');
      if (presets) {
        presets.innerHTML =
          '<div class="preset-list">' +
            '<div class="preset-item"><div class="preset-row">' +
              '<button type="button" class="ibtn ibtn--neutral ibtn--s pr-chev" aria-expanded="false" aria-label="Показать параметры пресета"><i data-icon="chevron-down"></i></button>' +
              '<span class="preset-row__name">Мои сделки ЦА</span><span class="preset-row__count">3 парам.</span>' +
              '<button type="button" class="btn btn--outline btn--xs"><span class="btn__label">Применить</span></button>' +
              '<button type="button" class="ibtn ibtn--neutral ibtn--s" aria-label="Удалить пресет"><i data-icon="trash"></i></button>' +
            '</div></div>' +
            '<div class="preset-item is-open"><div class="preset-row">' +
              '<button type="button" class="ibtn ibtn--neutral ibtn--s pr-chev" aria-expanded="true" aria-label="Скрыть параметры пресета"><i data-icon="chevron-up"></i></button>' +
              '<span class="preset-row__name">Просрочка МБ</span><span class="preset-row__count">2 парам.</span>' +
              '<button type="button" class="btn btn--outline btn--xs"><span class="btn__label">Применить</span></button>' +
              '<button type="button" class="ibtn ibtn--neutral ibtn--s" aria-label="Удалить пресет"><i data-icon="trash"></i></button>' +
            '</div>' +
            '<div class="preset-item__body">' +
              '<div class="tbl" style="grid-template-columns:none;border:none;border-radius:0;"><div class="tbl__row" style="grid-template-columns:8px 1.84fr 0.81fr 8px;"><div class="th th--separator"></div><div class="th"><span class="th__label">Параметр</span></div><div class="th"><span class="th__label">Значение</span></div><div class="th th--separator"></div></div>' +
              paramsFor(2).map(([k, v]) => '<div class="tbl__row" style="grid-template-columns:8px 1.84fr 0.81fr 8px;"><div class="tc tc--separator"></div><div class="tc"><span class="tc__row"><span class="tc__text">' + k + '</span></span></div><div class="tc"><span class="tc__row"><span class="tc__text">' + v + '</span></span></div><div class="tc tc--separator"></div></div>').join('') +
              '</div>' +
            '</div></div>' +
          '</div>';
        window.dsIcons && window.dsIcons.apply(presets);
      }
    })();
  });
})();
