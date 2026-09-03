/* =========================================================================
   NavPanel — конструктор, анатомия, варианты, состояния, redline, цвета.
   Панель собирается из данных меню (тот же набор, что в проде IBP).
   Иконки — <i data-icon>; после сборки DOM вызывается window.dsIcons.apply.
   ========================================================================= */
(function () {
  'use strict';

  function ic(name) { return '<i data-icon="' + name + '"></i>'; }
  function h(html) { var t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
  function paint(root) { if (window.dsIcons) window.dsIcons.apply(root); }

  /* ---------------- данные меню ----------------
     Первичный источник — единый каталог scripts/ibp-home.js (window.IBPHome):
     меню рендерится по выбранной роли (itemsFor). BLOCKS ниже — фолбэк для
     страниц, где ibp-home.js не подключён (бандл карточек). */
  var HOME = { icon: 'main-page', label: 'Главная', selected: true };
  var CURRENT_ROLE = 'Финансист ДИД';
  var BLOCKS = [
    { label: 'Origination', items: [
      { icon: 'Important-deals', label: 'Обязательные сделки' },
      { icon: 'deals-possible-deals', label: 'Возможные сделки' },
      { icon: 'potentials-rd', label: 'Потенциалы РД' },
      { icon: 'important-leads', label: 'Обязательные лиды' },
      { icon: 'possible-leads', label: 'Возможные лиды' },
      { icon: 'sales-projects', label: 'Проекты продаж CIB' },
      { icon: 'sales-company', label: 'Кампании продаж' },
      { icon: 'dcm-potentials', label: 'Потенциалы DCM' },
      { icon: 'calc', label: 'Калькулятор' },
      { icon: 'funds', label: 'Фонды' }
    ] },
    { label: 'Pipeline', items: [
      { icon: 'pipeline', label: 'Pipeline' },
      { icon: 'ckp-pipeline', label: 'Pipeline ЦКП' },
      { icon: 'mna-pipeline', label: 'M&A Pipeline' },
      { icon: 'dcm-pipeline', label: 'DCM Pipeline' },
      { icon: 'ecm-pipeline', label: 'ECM Pipeline' },
      { icon: 'kpki-cal', label: 'Календарь КПКИ' },
      { icon: 'pmc-dashboard', label: 'Дашборды по Pipeline' },
      { icon: 'payments-ib', label: 'Реестр платежей IB' }
    ] },
    { label: 'Текущий портфель ДИД', items: [
      { icon: 'current-depo', label: 'Текущий портфель' },
      { icon: 'cash-flow', label: 'CF СБИ' },
      { icon: 'corporate-transactions', label: 'Корпоративные запросы' }
    ] },
    { label: 'Отчёты', items: [
      { icon: 'reports-1-c', label: 'Отчёты 1C/Navision' },
      { icon: 'registry', label: 'Реестр выписок' },
      { icon: 'reserve', label: 'Расчет резерва' },
      { icon: 'calclate-fv', label: 'Расчет FV' },
      { icon: 'rwa', label: 'Отчёты для Рисков', canDisable: true }
    ] },
    { label: 'Клиенты и задачи', items: [
      { icon: 'factory-01', label: 'Клиенты' },
      { icon: 'client-search', label: 'Поиск клиентов в ЕПК' },
      { icon: 'tasks', label: 'Задачи', badge: 7 }
    ] },
    { label: 'Администрирование', items: [
      { icon: 'admin-panel-settings', label: 'Администрирование' },
      { icon: 'admin-ckp', label: 'Администратор ЦКП' }
    ] }
  ];
  /* группы меню текущей роли (или весь каталог-фолбэк) */
  function menuGroups() {
    if (window.IBPHome) return window.IBPHome.itemsFor(CURRENT_ROLE);
    return BLOCKS;
  }
  /* переключение роли: меняет состав меню и перерисовывает демо (событие) */
  function setRole(role) {
    if (!window.IBPHome || !window.IBPHome.roles[role]) return;
    CURRENT_ROLE = role;
    document.dispatchEvent(new CustomEvent('ibp-role-change', { detail: { role: role } }));
  }

  /* ---------------- сборка пункта ---------------- */
  function itemHTML(it, opts) {
    var disabled = opts.disabled && it.canDisable;
    /* пункт с тайлом-со-ссылками — аккордеон-родитель (под-пункты = ссылки тайла) */
    if (it.tile && it.tile.links && it.tile.links.length) {
      var sub = '<div class="nav__sub" id="nav-sub-' + it.id + '"><div class="nav__sub-in">'
        + it.tile.links.map(function (l) { return '<a class="nav__item" href="#"><span class="nav__label">' + l + '</span></a>'; }).join('')
        + '</div></div>';
      return '<a class="nav__item nav__item--acc" href="#" aria-expanded="false" aria-controls="nav-sub-' + it.id + '">'
        + '<span class="nav__ico">' + ic(it.icon) + '</span>'
        + '<span class="nav__label">' + it.label + '</span>'
        + '<span class="nav__caret">' + ic('chevron-down') + '</span></a>' + sub;
    }
    var cls = 'nav__item'
      + (it.selected ? ' nav__item--selected' : '')
      + (disabled ? ' nav__item--disabled' : '');
    var badge = '';
    if (opts.badges && it.badge) {
      var btone = disabled ? 'badge--muted' : 'badge--accent';
      badge = '<span class="nav__badge"><span class="badge badge--xs ' + btone + '" aria-hidden="true">' + it.badge + '</span></span>';
    }
    return '<a class="' + cls + '" href="#"'
      + (disabled ? ' aria-disabled="true" tabindex="-1"' : '')
      + (it.selected ? ' aria-current="page"' : '')
      + (it.badge ? ' aria-label="' + it.label + (opts.badges ? ', ' + it.badge : '') + '"' : '')
      + '>'
      + '<span class="nav__ico">' + ic(it.icon) + '</span>'
      + '<span class="nav__label">' + it.label + '</span>'
      + badge
      + '</a>';
  }

  /* ---------------- шапка и футер (для buildNav) ---------------- */
  function topHTML(mode) {
    var s = '<div class="nav__top">';
    s += '<button type="button" class="ibtn ibtn--neutral ibtn--m nav__burger" aria-label="'
      + (mode === 'rail' ? 'Развернуть меню' : 'Свернуть меню') + '">' + ic('left-menu') + '</button>';
    if (mode !== 'rail') {
      s += '<button type="button" class="ibtn ibtn--neutral ibtn--m nav__pin" aria-pressed="' + (mode === 'fixed')
        + '" aria-label="' + (mode === 'fixed' ? 'Открепить панель' : 'Закрепить панель') + '">'
        + ic(mode === 'fixed' ? 'unpin-menu' : 'pin-menu') + '</button>';
    }
    s += '</div>';
    return s;
  }
  function footerHTML() {
    return '<div class="nav__footer">'
      + '<a class="nav__user" href="#" aria-label="Открыть личный кабинет">'
      + '<span class="av av--circular av--m"><span class="av__text">АП</span></span>'
      + '<span class="nav__user-text">'
      + '<span class="nav__user-name">Александров Петр Константинович</span>'
      /* должность — заглушка, меняется по роли (CURRENT_ROLE) */
      + '<span class="nav__user-role">' + CURRENT_ROLE + '</span>'
      + '<span class="nav__user-org">SMB Недвижимость +2</span>'
      + '</span></a>'
      + '<button type="button" class="ibtn ibtn--neutral ibtn--m nav__logout" data-modal="nav-role-modal" aria-label="Сменить роль / выйти">' + ic('logout') + '</button>'
      + '</div>';
  }

  /* ---------------- сборка панели ---------------- */
  function buildNav(mode, opts) {
    opts = opts || {};
    var s = '<nav class="nav nav--' + mode + '" aria-label="Главное меню">';

    // top
    s += topHTML(mode);

    // list
    s += '<div class="nav__list">';
    s += itemHTML(HOME, opts);
    menuGroups().forEach(function (b, i) {
      s += '<div class="nav__block' + (i === 0 ? ' nav__block--first' : '') + '">';
      s += '<div class="nav__block-label">' + b.label + '</div>';
      b.items.forEach(function (it) { s += itemHTML(it, opts); });
      s += '</div>';
    });
    s += '</div>';

    // footer
    s += footerHTML();

    s += '</nav>';
    return h(s);
  }

  function frame(mode, opts, h0) {
    var f = h('<div class="nav-frame" style="height:' + (h0 || 560) + 'px"></div>');
    f.appendChild(buildNav(mode, opts));
    return f;
  }

  /* ---------------- rail-тултипы и режимы — общий рантайм, scripts/ds-nav-panel.js --- */
  function bindRailTooltips(scope, opts) {
    if (!window.DSNavPanel) return;
    (scope || document).querySelectorAll('.nav').forEach(function (nav) { window.DSNavPanel.bind(nav, opts || {}); });
  }

  /* =====================================================================
     PLAYGROUND
     ===================================================================== */
  function initPlayground() {
    var controls = document.getElementById('pg-controls');
    var stage = document.getElementById('pg-stage');
    if (!controls || !stage) return;

    controls.innerHTML =
      '<div class="ctl"><span class="lbl">Режим</span>'
      + '<div class="pg-select"><select id="pg-mode">'
      + '<option value="rail" selected>Rail</option>'
      + '<option value="drawer">Drawer</option>'
      + '<option value="fixed">Fixed</option>'
      + '</select></div></div>'
      /* бинарные опции — бинарные селекты: docs-split.js конвертирует их
         в свитчи pg-toggle (подпись статична, словарь DS_SPLIT_SWITCH_LABELS) */
      + '<div class="ctl"><span class="lbl">Бейджи</span>'
      + '<div class="pg-select"><select id="pg-badges">'
      + '<option value="no">Нет</option><option value="yes" selected>Да</option>'
      + '</select></div></div>'
      + '<div class="ctl"><span class="lbl">Заблокированный пункт</span>'
      + '<div class="pg-select"><select id="pg-disabled">'
      + '<option value="no" selected>Нет</option><option value="yes">Да</option>'
      + '</select></div></div>';

    var mode = controls.querySelector('#pg-mode');
    var badges = controls.querySelector('#pg-badges');
    var disabled = controls.querySelector('#pg-disabled');

    function render() {
      var opts = { badges: badges.value === 'yes', disabled: disabled.value === 'yes' };
      stage.innerHTML = '';
      stage.appendChild(frame(mode.value, opts, 620));
      paint(stage);
      bindRailTooltips(stage);
      /* триггер модалки ролей собирается динамически — байндим после сборки */
      if (window.DSModal) window.DSModal.bindAll(stage);
      /* бургер и пин реально переключают режим — селект следует за панелью */
      var nav = stage.querySelector('.nav');
      if (nav) nav.addEventListener('ds-nav-mode', function (e) { mode.value = e.detail.mode; });
    }
    mode.addEventListener('change', render);
    badges.addEventListener('change', render);
    disabled.addEventListener('change', render);
    /* смена роли (модалка ролей) — перерисовка меню в плейграунде */
    document.addEventListener('ibp-role-change', render);
    render();
  }

  /* =====================================================================
     ANATOMY
     ===================================================================== */
  function initAnatomy() {
    var stage = document.getElementById('anat-stage');
    if (!stage) return;
    stage.appendChild(frame('drawer', { badges: true }, 520));
    paint(stage);
  }

  /* =====================================================================
     VARIANTS — режимы
     ===================================================================== */
  function initModes() {
    var wrap = document.getElementById('variants-modes');
    if (!wrap) return;
    [['rail', 'Rail', 'Свёрнут — только иконки, тултип по hover, без тени.'],
     ['drawer', 'Drawer', 'Развёрнут-оверлей поверх контента, тень Shadow4.0_modalform.'],
     ['fixed', 'Fixed', 'Закреплён — контент ужимается под ширину панели, тени нет, шов справа.']
    ].forEach(function (m) {
      var col = h('<div class="mode-col"></div>');
      col.appendChild(h('<div class="mode-col__cap"><span class="k">' + m[1] + '</span><span class="d">' + m[2] + '</span></div>'));
      col.appendChild(frame(m[0], { badges: true }, 520));
      wrap.appendChild(col);
    });
    paint(wrap);
    /* режим каждой плитки зафиксирован подписью — только rail-тултипы */
    bindRailTooltips(wrap, { modes: false });
  }

  /* =====================================================================
     VARIANTS — элементы (Rail | Drawer)
     ===================================================================== */
  function elCell(mode, inner) {
    return '<div class="el-demo el-demo--' + mode + '"><div class="nav nav--' + mode + '" aria-hidden="true"><div class="nav__list" style="padding:6px 8px;gap:2px;' + (mode === 'rail' ? 'align-items:center;' : '') + '">' + inner + '</div></div></div>';
  }
  function initElements() {
    var wrap = document.getElementById('variants-el');
    if (!wrap) return;

    var rows = [
      ['Burger', 'Кнопка сворачивания/разворачивания; в Drawer соседствует с кнопкой пина.',
        '<div class="nav__top" style="padding:0"><button class="ibtn ibtn--neutral ibtn--m nav__burger" aria-label="Меню">' + ic('left-menu') + '</button></div>',
        '<div class="nav__top"><button class="ibtn ibtn--neutral ibtn--m" aria-label="Меню">' + ic('left-menu') + '</button><button class="ibtn ibtn--neutral ibtn--m nav__pin" aria-label="Закрепить">' + ic('pin-menu') + '</button></div>'],
      ['Menu Item', 'Иконка + подпись; в Rail подпись всплывает тултипом.',
        itemHTML({ icon: 'current-depo', label: 'Текущий портфель ДИД' }, {}),
        itemHTML({ icon: 'current-depo', label: 'Текущий портфель ДИД' }, {})],
      ['Menu Item + Badge', 'Опциональный Badge (accent) — счётчик сущностей.',
        itemHTML({ icon: 'tasks', label: 'Задачи', badge: 7 }, { badges: true }),
        itemHTML({ icon: 'tasks', label: 'Задачи', badge: 7 }, { badges: true })],
      ['Пункт-родитель', 'Пункт с тайлом-со-ссылками: каретка раскрывает под-пункты (ссылки тайла); в Rail каретка и под-список скрыты.',
        '<a class="nav__item nav__item--acc" href="#" aria-expanded="false"><span class="nav__ico">' + ic('rwa') + '</span><span class="nav__label">Отчёты для Рисков</span><span class="nav__caret">' + ic('chevron-down') + '</span></a>',
        '<a class="nav__item nav__item--acc" href="#" aria-expanded="true" aria-controls="el-nested-sub"><span class="nav__ico">' + ic('rwa') + '</span><span class="nav__label">Отчёты для Рисков</span><span class="nav__caret">' + ic('chevron-down') + '</span></a>'
        + '<div class="nav__sub" id="el-nested-sub"><div class="nav__sub-in">'
        + '<a class="nav__item" href="#"><span class="nav__label">Коды RWA</span></a>'
        + '<a class="nav__item" href="#"><span class="nav__label">Расчет RWA</span></a>'
        + '<a class="nav__item" href="#"><span class="nav__label">Расчет ОВП</span></a>'
        + '</div></div>'],
      ['Footer', 'Строка пользователя — ссылка на личный кабинет + логаут; в Rail — только аватар.',
        '<div class="nav__footer" style="border-top:none;padding:8px 0"><a class="nav__user" href="#" aria-label="Открыть личный кабинет"><span class="av av--circular av--m"><span class="av__text">АП</span></span></a></div>',
        '<div class="nav__footer" style="border-top:none;padding:8px"><a class="nav__user" href="#" aria-label="Открыть личный кабинет"><span class="av av--circular av--m"><span class="av__text">АП</span></span><span class="nav__user-text"><span class="nav__user-name">Александров Петр</span><span class="nav__user-role">Аналитик ДИД</span></span></a><button class="ibtn ibtn--neutral ibtn--m" aria-label="Выйти">' + ic('logout') + '</button></div>']
    ];

    rows.forEach(function (r) {
      var row = h('<div class="vrow"></div>');
      row.appendChild(h('<div class="vrow__cap"><span class="k">' + r[0] + '</span><span class="d">' + r[1] + '</span></div>'));
      var demo = h('<div class="vrow__demo el-pair"></div>');
      demo.innerHTML = '<div class="el-col"><span class="el-tag">Rail</span>' + elCell('rail', r[2]) + '</div>'
        + '<div class="el-col"><span class="el-tag">Drawer</span>' + elCell('drawer', r[3]) + '</div>';
      row.appendChild(demo);
      wrap.appendChild(row);
    });
    paint(wrap);
  }

  /* =====================================================================
     STATES — пункт меню
     ===================================================================== */
  function initStates() {
    var wrap = document.getElementById('states-demo');
    if (!wrap) return;
    var st = [
      ['Default', 'Базовый пункт: иконка + подпись, цвет Text_Secondary.', ''],
      ['Hover', 'Заливка Table Row Hover, текст и иконка — Text_Primary.', ' is-hover'],
      ['Selected', 'Текущая страница: заливка Table Row Focus, подпись Strong.', ' nav__item--selected'],
      ['Disabled', 'Недоступный пункт: Text_Inactive, без наведения; бейдж приглушён.', ' nav__item--disabled']
    ];
    st.forEach(function (s) {
      var cell = h('<div class="state-cell"></div>');
      cell.appendChild(h('<span class="state-cap">' + s[0] + '</span>'));
      var box = h('<div class="nav nav--drawer" aria-hidden="true" style="width:248px;box-shadow:none;border-radius:12px;border:1px solid var(--border-light)"><div class="nav__list" style="padding:8px"></div></div>');
      var it = s[0] === 'Disabled'
        ? '<a class="nav__item' + s[2] + '"><span class="nav__ico">' + ic('tasks') + '</span><span class="nav__label">Задачи</span><span class="nav__badge"><span class="badge badge--xs badge--muted">7</span></span></a>'
        : '<a class="nav__item' + s[2] + '" href="#"><span class="nav__ico">' + ic('current-depo') + '</span><span class="nav__label">Текущий портфель ДИД</span></a>';
      box.querySelector('.nav__list').innerHTML = it;
      cell.appendChild(box);
      cell.appendChild(h('<span class="state-desc">' + s[1] + '</span>'));
      wrap.appendChild(cell);
    });
    paint(wrap);
  }

  /* =====================================================================
     SIZES + REDLINE — измерение на живом экземпляре
     ===================================================================== */
  function measure() {
    var probe = frame('drawer', { badges: true }, 600);
    probe.style.position = 'absolute';
    probe.style.left = '-9999px';
    probe.style.top = '0';
    document.body.appendChild(probe);

    var railProbe = buildNav('rail', {});
    railProbe.style.position = 'absolute'; railProbe.style.left = '-9999px';
    document.body.appendChild(railProbe);

    var nav = probe.querySelector('.nav');
    var item = probe.querySelector('.nav__item');
    var ico = probe.querySelector('.nav__ico');
    var top = probe.querySelector('.nav__top');
    var lbl = probe.querySelector('.nav__block-label');
    var footer = probe.querySelector('.nav__footer');
    var cs = getComputedStyle;

    var data = {
      railW: Math.round(parseFloat(cs(railProbe).width)),
      drawerW: Math.round(parseFloat(cs(nav).width)),
      itemH: Math.round(parseFloat(cs(item).height)),
      itemPadX: Math.round(parseFloat(cs(item).paddingLeft)),
      itemGap: Math.round(parseFloat(cs(item).columnGap || cs(item).gap)),
      itemRadius: Math.round(parseFloat(cs(item).borderTopLeftRadius)),
      itemFont: Math.round(parseFloat(cs(probe.querySelector('.nav__label')).fontSize)),
      icoSize: Math.round(parseFloat(cs(ico).width)),
      topH: Math.round(parseFloat(cs(top).height)),
      lblFont: Math.round(parseFloat(cs(lbl).fontSize)),
      lblH: Math.round(parseFloat(cs(lbl).height)),
      footPad: Math.round(parseFloat(cs(footer).paddingTop)),
      footH: Math.round(parseFloat(cs(footer).height))
    };
    document.body.removeChild(probe);
    document.body.removeChild(railProbe);
    return data;
  }

  function fillTables(d) {
    var sizeRows = [
      ['Ширина — Rail', 'nav--rail', d.railW + ' px', 'Свёрнутый режим, только иконки'],
      ['Ширина — Drawer / Fixed', 'nav--drawer / nav--fixed', d.drawerW + ' px', 'Развёрнутый режим с подписями'],
      ['Высота пункта', 'nav__item', d.itemH + ' px', 'Фиксированная, одинаковая во всех режимах'],
      ['Иконка пункта', 'nav__ico', d.icoSize + '×' + d.icoSize + ' px', 'Глиф из раздела Menu'],
      ['Высота шапки (Burger)', 'nav__top', d.topH + ' px', 'Ряд бургера и пина'],
      ['Бейдж', 'badge--xs', '20 px', 'Компонент Badge, тон accent']
    ];
    var st = document.querySelector('#size-table');
    if (st) st.innerHTML = sizeRows.map(function (r) {
      return '<div class="tbl__row" style="grid-template-columns:8px 1.84fr 0.68fr 0.81fr 0.95fr 8px;"><div class="tc tc--separator"></div><div class="tc"><span class="tc__row"><span class="tc__text">' + r[0] + '</span></span></div><div class="tc"><code class="tok">' + r[1] + '</code></div><div class="tc tc--numbers"><span class="tc__row"><span class="tc__text">' + r[2] + '</span></span></div><div class="tc"><span class="tc__row"><span class="tc__text">' + r[3] + '</span></span></div><div class="tc tc--separator"></div></div>';
    }).join('');

    var devRows = [
      ['Ширина Rail', d.railW + ' px'],
      ['Ширина Drawer / Fixed', d.drawerW + ' px'],
      ['Высота пункта (item)', d.itemH + ' px'],
      ['Гор. паддинг пункта', d.itemPadX + ' px'],
      ['Зазор иконка → подпись', d.itemGap + ' px'],
      ['Радиус пункта', d.itemRadius + ' px'],
      ['Кегль подписи', d.itemFont + ' px'],
      ['Размер иконки', d.icoSize + '×' + d.icoSize + ' px'],
      ['Высота шапки (Burger)', d.topH + ' px'],
      ['Кегль заголовка блока', d.lblFont + ' px'],
      ['Высота заголовка блока', d.lblH + ' px (одинакова в Rail/Drawer)'],
      ['Высота футера', d.footH + ' px (одинакова в Rail/Drawer)'],
      ['Паддинг футера', d.footPad + ' px'],
      ['Тень Drawer', 'Shadow4.0_modalform'],
      ['Шов Fixed', '1px --border-light справа']
    ];
    var dt = document.querySelector('#dev-spec-table');
    if (dt) dt.innerHTML = devRows.map(function (r) {
      return '<div class="tbl__row" style="grid-template-columns:8px 1.84fr 0.81fr 8px;"><div class="tc tc--separator"></div><div class="tc"><span class="tc__row"><span class="tc__text">' + r[0] + '</span></span></div><div class="tc tc--numbers"><span class="tc__row"><span class="tc__text">' + r[1] + '</span></span></div><div class="tc tc--separator"></div></div>';
    }).join('');
  }

  /* =====================================================================
     COLORS
     ===================================================================== */
  function initColors() {
    var wrap = document.getElementById('color-ref');
    if (!wrap) return;
    var groups = [
      ['Панель', [
        ['Фон панели', '--bg-mainmenu'],
        ['Шов Fixed / разделители', '--border-light'],
        ['Тень Drawer', '--shadow-modal-form']
      ]],
      ['Пункт меню', [
        ['Текст подписи Default', '--text-secondary'],
        ['Текст подписи Hover · Selected', '--text-primary'],
        ['Иконка Default', '--secondary'],
        ['Иконка Hover · Selected', '--secondary-dark'],
        ['Заливка Hover', '--bgtable-row-hover'],
        ['Заливка Selected', '--bgtable-row-focus'],
        ['Текст / иконка Disabled', '--text-inactive']
      ]],
      ['Служебное', [
        ['Заголовок блока', '--text-inactive'],
        ['Бейдж (accent)', '--primary'],
        ['Тултип Rail (фон)', '--bg-hint'],
        ['Тултип Rail (текст)', '--text-on-dark']
      ]]
    ];
    wrap.innerHTML = groups.map(function (g) {
      return '<div class="cref-group"><h3>' + g[0] + '</h3><div class="cref-rows">'
        + g[1].map(function (r) {
          var sw = r[1] === '--shadow-modal-form'
            ? '<span class="cf" style="background:var(--bg-tile);box-shadow:var(--shadow-modal-form)"></span>'
            : '<span class="cf" style="background:var(' + r[1] + ')"></span>';
          return '<div class="cref-row"><span class="cref-sw">' + sw + '</span>'
            + '<span class="cref-meta"><p class="role">' + r[0] + '</p><p class="tname">' + r[1] + '</p></span></div>';
        }).join('')
        + '</div></div>';
    }).join('');
  }

  /* =====================================================================
     COPY buttons
     ===================================================================== */
  function initCopy() {
    document.querySelectorAll('.code-panel__copy').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var el = document.getElementById(btn.dataset.copyTarget);
        if (!el) return;
        navigator.clipboard.writeText(el.textContent).then(function () {
          btn.classList.add('is-copied');
          var lbl = btn.querySelector('.copy-label');
          var old = lbl ? lbl.textContent : '';
          if (lbl) lbl.textContent = 'Скопировано';
          setTimeout(function () { btn.classList.remove('is-copied'); if (lbl) lbl.textContent = old; }, 1500);
        });
      });
    });
  }

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }
  ready(function () {
    /* модалка ролей: клик по роли — переключение (меню/футер перерисовываются) */
    document.querySelectorAll('#nav-role-modal [data-role]').forEach(function (btn) {
      btn.addEventListener('click', function () { setRole(btn.getAttribute('data-role')); });
    });
    initPlayground();
    initAnatomy();
    initModes();
    initElements();
    initStates();
    initColors();
    initCopy();
    try { fillTables(measure()); } catch (e) { /* redline optional */ }
  });
  window.NavPanelDemo = { setRole: setRole, currentRole: function () { return CURRENT_ROLE; } };
})();
