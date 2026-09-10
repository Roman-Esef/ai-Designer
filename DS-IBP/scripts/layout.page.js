/* =========================================================================
   Layout (Каркас экрана) — страничный скрипт: конструктор, таблицы, копирование.
   Значения redline читаются с живого каркаса через getComputedStyle.
   ========================================================================= */
(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  /* ---------- таблицы на TableCell ---------- */
  function table(cols, head, rows) {
    const gt = '8px ' + cols.join(' ') + ' 8px';
    let h = '<div class="tbl" style="grid-template-columns:none;border:none;border-radius:0;">';
    h += '<div class="tbl__row" style="grid-template-columns:' + gt + ';"><div class="th th--separator"></div>';
    head.forEach(t => { h += '<div class="th"><span class="th__label">' + t + '</span></div>'; });
    h += '<div class="th th--separator"></div></div>';
    rows.forEach(r => {
      h += '<div class="tbl__row" style="grid-template-columns:' + gt + ';"><div class="tc tc--separator"></div>';
      r.forEach(c => { h += '<div class="tc tc--wrap"><span class="tc__row"><span class="tc__text">' + c + '</span></span></div>'; });
      h += '<div class="tc tc--separator"></div></div>';
    });
    return h + '</div>';
  }
  const tok = t => '<code class="tok">' + t + '</code>';

  /* ---------- превью каркаса ---------- */
  const CONTENT = {
    /* Стартовая страница: сетка групп на штатных .grid12 / .col-3 colw-6, фоновая
       иллюстрация за контентом. Шапки страницы нет — заголовок несёт группа.
       Пороги 1700/900 включает класс .is-home на рамке (см. <style> страницы),
       поэтому слайдер ширины реально перекладывает группы 4 → 2 → 1. */
    home:
      '<div class="lay-home"><div class="grid12">' +
      ['Текущий портфель ДИД', 'Отчёты', 'Клиенты и задачи', 'Администрирование'].map(g =>
        '<section class="lay-group col-3 colw-6">' +
        '<h2 class="lay-group__head">' + g + '</h2>' +
        '<div class="lay-block lay-ntile"></div><div class="lay-block lay-ntile"></div>' +
        '<div class="lay-block lay-ntile"></div></section>').join('') +
      '</div></div>',
    /* Экран-реестр: шапка страницы → зона тулбара → таблица на остаток высоты.
       Ритм 12px и app-shell включает класс .is-table на рамке (см. <style> страницы). */
    table:
      '<div class="lay-phead lay-phead--reg"><span>Текущий портфель ДИД</span>' +
      '<span class="lay-btn">Новая сделка</span></div>' +
      '<div class="lay-toolbar">' +
      '<div class="lay-toolbar__l"><span class="lay-pill">Фильтр</span>' +
      '<span class="lay-pill lay-pill--chip">Применено: 5</span></div>' +
      '<span class="lay-sq"></span></div>' +
      '<div class="lay-tbl"><div class="lay-tbl__body">' +
      '<div class="lay-tbl__head">' +
      [96, 150, 84, 110, 120, 72, 130, 96, 140, 88].map(w =>
        '<i style="width:' + w + 'px"></i>').join('') + '</div>' +
      '<div class="lay-rows">' + Array.from({ length: 14 }, () => '<div></div>').join('') +
      '</div></div>' +
      '<div class="lay-tbl__foot"><span>Сделок: 50</span><span>1 из 3</span></div></div>',
    entity:
      '<div class="lay-phead"><span>Корпоративный запрос 1344</span></div>' +
      '<div class="grid12">' +
      '<section class="col-4"><div class="lay-block" style="height:150px"></div></section>' +
      '<section class="col-4"><div class="lay-block" style="height:150px"></div></section>' +
      '<section class="col-4"><div class="lay-block" style="height:150px"></div></section>' +
      '<section class="col-8"><div class="lay-block" style="height:190px"></div></section>' +
      '<section class="col-4"><div class="lay-block" style="height:190px"></div></section>' +
      '<section class="col-6"><div class="lay-block" style="height:170px"></div></section>' +
      '<section class="col-6"><div class="lay-block" style="height:170px"></div></section>' +
      '</div>'
  };

  /* ---------- redline с живого каркаса ---------- */
  function measure() {
    const probe = document.createElement('div');
    probe.style.cssText = 'position:absolute;left:-10000px;top:0;width:1500px';
    probe.innerHTML =
      '<div class="nav-layout"><nav class="nav nav--rail">' +
      '<div class="nav__top"><button class="nav__burger"></button>' +
      '<button class="nav__pin" aria-pressed="false"></button></div>' +
      '<div class="nav__list"></div><div class="nav__footer"><div class="nav__user">' +
      '<span class="nav__user-text"></span></div></div></nav>' +
      '<div class="screen"><nav class="crumbs"><li class="crumbs__item">' +
      '<span class="crumbs__current">Крошка</span></li></nav>' +
      '<main class="screen__content">' +
      /* блоки экрана-реестра: их высоты идут в редлайн, а не вписываются руками */
      '<div class="phead"><div class="phead__main"><div class="phead__title-row">' +
      '<h1 class="phead__title">Заголовок</h1></div></div></div>' +
      '<div class="dtable-toolbar"><div class="tfilter">' +
      '<button class="btn btn--outline btn--s"><span class="btn__label">Фильтр</span></button>' +
      '</div><button class="ibtn ibtn--neutral ibtn--m"></button></div>' +
      /* сетка групп стартовой страницы: зазор берётся с живой .grid12 */
      '<div class="grid12"><section class="col-3"></section></div>' +
      '</main></div></div>';
    document.body.appendChild(probe);
    const screenEl = probe.querySelector('.screen');
    const crumbs = probe.querySelector('.crumbs');
    const content = probe.querySelector('.screen__content');
    const nav = probe.querySelector('.nav');
    const cs = el => getComputedStyle(el);
    const phead = probe.querySelector('.phead');
    const dtoolbar = probe.querySelector('.dtable-toolbar');
    const grid = probe.querySelector('.grid12');
    const s = cs(screenEl), c = cs(crumbs), ct = cs(content), n = cs(nav);
    const out = {
      pheadH: cs(phead).height,
      toolbarH: cs(dtoolbar).height,
      gridGap: cs(grid).columnGap,
      navW: n.width,
      screenInset: parseFloat(s.paddingLeft) ? s.paddingLeft : s.marginLeft,
      crumbsH: c.minHeight,
      crumbsPad: [c.paddingTop, c.paddingRight, c.paddingBottom, c.paddingLeft].join(' '),
      crumbsFont: c.fontSize + '/' + c.lineHeight,
      contentPad: [ct.paddingTop, ct.paddingRight, ct.paddingBottom, ct.paddingLeft].join(' '),
      contentGap: ct.rowGap
    };
    probe.remove();
    return out;
  }

  ready(function () {
    const m = measure();

    /* конструктор */
    const frame = document.getElementById('layFrame');
    const navBox = document.getElementById('layNav');
    const crumbs = document.getElementById('layCrumbs');
    const content = document.getElementById('layContent');
    const selNav = document.getElementById('pgNav');
    const selKind = document.getElementById('pgKind');
    const cbZones = document.getElementById('pgZones');
    const cbCrumbs = document.getElementById('pgCrumbs');
    const widthCtl = document.getElementById('pgWidth');
    const widthVal = document.getElementById('pgWVal');
    const ro = { nav: document.getElementById('roNav'), crumbs: document.getElementById('roCrumbs'), pad: document.getElementById('roPad'), gap: document.getElementById('roGap') };

    /* слайдер ширины демо: 480–1800 px (1800 — широкий каркас как на большом мониторе) */
    function applyWidth() {
      const v = widthCtl ? Number(widthCtl.value) : 1080;
      if (frame) frame.style.width = v + 'px';
      if (widthVal) widthVal.textContent = v + ' px';
    }

    function render() {
      const fixed = selNav.value === 'fixed';
      navBox.className = 'lay-nav' + (fixed ? ' lay-nav-fixed' : '');
      const dots = n => Array.from({ length: n }, () => '<span class="lay-nav__dot"></span>').join('');
      navBox.innerHTML =
        '<div class="lay-nav__top">' + dots(fixed ? 1 : 2) + '</div>' +
        '<div class="lay-nav__list">' + dots(fixed ? 16 : 20) + '</div>' +
        '<div class="lay-nav__foot">' + dots(1) + '</div>';
      const isTable = selKind.value === 'table';
      const isHome = selKind.value === 'home';
      content.innerHTML = CONTENT[selKind.value];
      crumbs.style.display = cbCrumbs.checked ? '' : 'none';
      frame.classList.toggle('is-zones', cbZones.checked);
      /* реестр — app-shell: страница не скроллится, ритм блоков 12px */
      frame.classList.toggle('is-table', isTable);
      /* стартовая страница — пороги перестроения и фоновая иллюстрация */
      frame.classList.toggle('is-home', isHome);
      ro.nav.textContent = fixed ? '272 px' : '56 px';
      ro.crumbs.textContent = cbCrumbs.checked ? parseFloat(m.crumbsH) + ' px · 16/24/12' : 'нет (Дашборд)';
      ro.pad.textContent = '8 / 24 / 24';
      /* на главной блок контента один — виден не зазор блоков, а зазор сетки */
      ro.gap.textContent = isTable ? '12 px · экран-реестр'
        : isHome ? parseFloat(m.gridGap) + ' px · зазор сетки групп'
        : parseFloat(m.contentGap) + ' px';
      applyWidth();
    }
    [selNav, selKind, cbZones, cbCrumbs].forEach(el => el.addEventListener('change', render));
    if (widthCtl) {
      widthCtl.addEventListener('input', applyWidth);
      widthCtl.addEventListener('change', applyWidth);
    }
    render();

    /* таблицы */
    document.getElementById('ownersTable').innerHTML = table(
      ['0.8fr', '1.6fr', '1.6fr'], ['Решение', 'Каркас', 'Экран'],
      [
        ['Поля по бокам', '24 px, единственное значение', 'не задаёт'],
        ['Зона крошек', 'высота 44 px, поля 24 px', 'только состав трейла'],
        ['Отступ под панель', 'по режиму панели, автоматически', 'не задаёт'],
        ['Вертикальный ритм', 'зазор блоков 24 px; у экрана-реестра — 12 px, у стартовой страницы виден зазор сетки 16 px', 'выбирает не значение, а тип экрана; внутри блока может сгруппировать плотнее'],
        ['Ширина блоков', 'сетка 12 колонок', 'сколько колонок занимает блок'],
        ['Состав контента', 'не задаёт', 'блоки, порядок, наполнение']
      ]);

    document.getElementById('anatomyTable').innerHTML = table(
      ['0.9fr', '1fr', '1.7fr'], ['Зона', 'Класс', 'Что задаёт'],
      [
        ['Обёртка каркаса', tok('.nav-layout'), 'держит панель и рабочую область, резервирует отступ слева по режиму панели (NavPanel)'],
        ['Панель навигации', tok('.nav'), 'фиксирована на высоту вьюпорта, не участвует в потоке; отступа до рабочей области нет'],
        ['Рабочая область', tok('.screen'), 'колонка: зона крошек + контентная область; фон страницы; резиновая, перестраивается по брейкпоинтам'],
        ['Зона крошек', tok('.crumbs'), 'высота 44 px и поля 24 px — внутри компонента Breadcrumbs; в каркасе — залипание сверху'],
        ['Контентная область', tok('.screen__content'), 'поля 8 / 24 / 24, зазор блоков 24 px; семантически ' + tok('&lt;main&gt;')],
        ['Сетка внутри контента', tok('.grid12') + ' ' + tok('.col-N'), '12 колонок, зазор 16 px — компонент Spacing, каркас его не переопределяет']
      ]);

    document.getElementById('homeTable').innerHTML = table(
      ['0.9fr', '1.1fr', '1.2fr', '0.9fr'], ['Блок', 'Класс', 'Размер', 'До следующего'],
      [
        ['Зона крошек', tok('.crumbs'), m.crumbsH + '; на главной одна крошка — текущая страница, трейла нет', '8 px — верхнее поле контента'],
        ['Сетка групп', tok('.grid12'), '12 резиновых колонок, зазор ' + m.gridGap + ' (' + tok('--grid-gutter') + ')', '—'],
        ['Группа', tok('.col-3') + ' ' + tok('.colw-6'), '3 колонки из 12 — 4 группы в ряд; узкая ширина 6 колонок объявлена рядом', m.gridGap + ' — зазор сетки, по горизонтали и между рядами'],
        ['Заголовок группы', 'H5 Strong', 'по контенту', m.gridGap + ' до первого тайла'],
        ['Тайл', tok('.ntile'), 'ширина — от колонки (' + tok('width:auto') + '), высота от 190 px — размер <a class="link link--accent" href="../molecules/NavTile.html">NavTile</a>', m.gridGap + ' между тайлами'],
        ['Фоновая иллюстрация', tok('background-size: cover'), 'за контентом на всю рабочую область, ' + tok('opacity: .6'), '—']
      ]);

    document.getElementById('registryTable').innerHTML = table(
      ['0.9fr', '1.1fr', '1fr', '0.9fr'], ['Блок', 'Класс', 'Высота', 'До следующего'],
      [
        ['Зона крошек', tok('.crumbs'), m.crumbsH + ', залипает сверху', '8 px — верхнее поле контента'],
        ['Шапка страницы', tok('.phead'), m.pheadH + ' (высота Button M); растёт под подзаголовок и многострочный заголовок', '12 px'],
        ['Зона тулбара', tok('.dtable-toolbar'), m.toolbarH + ', подложки нет: слева фильтр, справа настройка колонок', '12 px'],
        ['Таблица', tok('.dtable') + ' ' + tok('.dtable--fill'), 'весь остаток высоты', '24 px — нижнее поле контента'],
        ['↳ шапка колонок', tok('.tbl__row--head'), 'липкая внутри тела таблицы, не под крошками', '—'],
        ['↳ тело', tok('.dtable__body'), 'скролл по вертикали и горизонтали', '—'],
        ['↳ футер пагинации', tok('.dtable__footer'), '56 px (' + tok('--pgn-h') + '), закреплён', '—']
      ]);

    document.getElementById('modesTable').innerHTML = table(
      ['0.7fr', '0.8fr', '1.6fr'], ['Режим', 'Отступ слева', 'Поведение'],
      [
        ['Rail', '56 px', 'только иконки, подпись — тултипом; состояние по умолчанию'],
        ['Drawer', '56 px', 'панель всплывает поверх контента, отступ не меняется, контент не двигается'],
        ['Fixed', '272 px', 'панель закреплена, контент ужимается на разницу 216 px']
      ]);

    document.getElementById('sizesTable').innerHTML = table(
      ['1.3fr', '0.7fr', '1.2fr'], ['Величина', 'Значение', 'Токен / источник'],
      [
        ['Отступ рабочей области слева (rail/drawer)', '56 px', 'NavPanel, ' + tok('.nav-layout')],
        ['Отступ рабочей области слева (fixed)', '272 px', 'NavPanel, ' + tok('.nav-layout')],
        ['Высота зоны крошек', m.crumbsH, tok('--layout-crumbs-h') + ' / Breadcrumbs'],
        ['Поля зоны крошек (top / side / bottom)', '16 / 24 / 12 px', 'Breadcrumbs, ' + tok('.crumbs')],
        ['Поля контентной области (top / side / bottom)', '8 / 24 / 24 px', tok('--layout-pad-top') + ', ' + tok('--layout-pad-x') + ', ' + tok('--layout-pad-bottom')],
        ['Зазор блоков контента', m.contentGap, tok('--layout-block-gap')],
        ['Зазор блоков экрана-реестра', '12 px', tok('--space-12') + ' — задаёт экран'],
        ['Зазор сетки групп (стартовая страница)', m.gridGap, tok('--grid-gutter') + ' / Spacing'],
        ['Ширина группы (стартовая страница)', '3 колонки из 12', tok('.col-3') + ' + ' + tok('.colw-6') + ' на узком шаге'],
        ['Высота шапки страницы (без подзаголовка)', m.pheadH, 'PageHeader, ' + tok('.phead__title-row')],
        ['Высота зоны тулбара реестра', m.toolbarH, 'Table, ' + tok('.dtable-toolbar')],
        ['Колонок / зазор сетки', '12 / 16 px', tok('--grid-columns') + ', ' + tok('--grid-gutter')]
      ]);

    document.getElementById('colorsTable').innerHTML = table(
      ['1fr', '1.1fr', '0.5fr'], ['Часть', 'Токен', 'Образец'],
      [
        ['Рабочая область и зона крошек', tok('--bg-page'), '<span style="display:inline-block;width:22px;height:22px;border-radius:var(--radius-xs);border:1px solid var(--border-light);background:var(--bg-page)"></span>'],
        ['Панель навигации', tok('--bg-mainmenu'), '<span style="display:inline-block;width:22px;height:22px;border-radius:var(--radius-xs);border:1px solid var(--border-light);background:var(--bg-mainmenu)"></span>'],
        ['Поверхности контента (тайлы, таблицы)', tok('--bg-tile'), '<span style="display:inline-block;width:22px;height:22px;border-radius:var(--radius-xs);border:1px solid var(--border-light);background:var(--bg-tile)"></span>'],
        ['Границы блоков и шов панели', tok('--border-light'), '<span style="display:inline-block;width:22px;height:22px;border-radius:var(--radius-xs);background:var(--border-light)"></span>']
      ]);

    document.getElementById('redlineTable').innerHTML = table(
      ['1.5fr', '0.9fr'], ['Свойство', 'Значение'],
      [
        [tok('.screen') + ' отступ слева (rail)', m.screenInset || '56px'],
        [tok('.nav.nav--rail') + ' width', m.navW],
        [tok('.crumbs') + ' min-height', m.crumbsH],
        [tok('.crumbs') + ' padding', m.crumbsPad],
        [tok('.crumbs') + ' font-size / line-height', m.crumbsFont],
        [tok('.screen__content') + ' padding', m.contentPad],
        [tok('.screen__content') + ' row-gap', m.contentGap],
        [tok('.phead') + ' height', m.pheadH],
        [tok('.dtable-toolbar') + ' height', m.toolbarH]
      ]);

    /* копирование */
    document.querySelectorAll('.dev-copy').forEach(btn => {
      btn.addEventListener('click', () => {
        const src = document.querySelector(btn.dataset.copy);
        if (!src) return;
        navigator.clipboard.writeText(src.textContent).then(() => {
          const t = btn.textContent;
          btn.textContent = 'Скопировано';
          setTimeout(() => { btn.textContent = t; }, 1400);
        });
      });
    });
  });
})();
