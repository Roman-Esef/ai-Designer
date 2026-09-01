/* ============================================================
   DS NAV — построение левой навигации и подсветка текущей страницы
   Структура: Основы · Компоненты (Атомы / Молекулы / Организмы) · Правила и паттерны
   ============================================================ */
(function () {
  var ROOT = window.__DS_ROOT || '';
  var NAV = [
    {
      cat: 'Основы',
      items: [
        { label: 'Иконки',      href: 'pages/foundations/Icons.html' },
        { label: 'Иллюстрации', href: 'pages/foundations/Illustrations.html' },
        { label: 'Каркас экрана', href: 'pages/foundations/Layout.html' },
        { label: 'Сетка и отступы', href: 'pages/foundations/Spacing.html' },
        { label: 'Скругления',  href: 'pages/foundations/Radius.html' },
        { label: 'Тени',        href: 'pages/foundations/Elevation.html' },
        { label: 'Типографика', href: 'pages/foundations/Typography.html' },
        { label: 'Цвета',       href: 'pages/foundations/Colors.html' }
      ]
    },
    {
      cat: 'Компоненты',
      groups: [
        {
          group: 'Атомы',
          items: [
            { label: 'Avatar',       href: 'pages/atoms/Avatar.html' },
            { label: 'Badge',        href: 'pages/atoms/Badge.html' },
            { label: 'Button',       href: 'pages/atoms/Buttons.html' },
            { label: 'Button Test',  href: 'pages/atoms/ButtonTest.html' },
            { label: 'Checkbox',     href: 'pages/atoms/Checkbox.html' },
            { label: 'Chip',         href: 'pages/atoms/Chip.html' },
            { label: 'Divider',      href: 'pages/atoms/Divider.html' },
            { label: 'IconButton',   href: 'pages/atoms/IconButton.html' },
            { label: 'Label / Helper', href: 'pages/atoms/LabelHelper.html' },
            { label: 'Link',         href: 'pages/atoms/Link.html' },
            { label: 'ProgressBar',  href: 'pages/atoms/ProgressBar.html' },
            { label: 'Radiobutton',  href: 'pages/atoms/Radiobutton.html' },
            { label: 'Skeleton',     href: 'pages/atoms/Skeleton.html' },
            { label: 'Spinner',      href: 'pages/atoms/Spinner.html' },
            { label: 'Switch',       href: 'pages/atoms/Switch.html' }
          ]
        },
        {
          group: 'Молекулы',
          items: [
            { label: 'Alert',            href: 'pages/molecules/Alert.html' },
            { label: 'Breadcrumbs',       href: 'pages/molecules/Breadcrumbs.html' },
            { label: 'ButtonGroup',      href: 'pages/molecules/ButtonGroup.html' },
            { label: 'Context Menu',     href: 'pages/molecules/ContextMenu.html' },
            { label: 'DatePicker',       href: 'pages/molecules/DatePicker.html' },
            { label: 'DropdownList',     href: 'pages/molecules/DropdownList.html' },
            { label: 'EmptyState',       href: 'pages/molecules/EmptyState.html' },
            { label: 'InputAmountRange', href: 'pages/molecules/InputAmountRange.html' },
            { label: 'InputAutocomplete', href: 'pages/molecules/InputAutocomplete.html' },
            { label: 'InputDate',        href: 'pages/molecules/InputDate.html' },
            { label: 'InputDateRange',   href: 'pages/molecules/InputDateRange.html' },
            { label: 'InputText',        href: 'pages/molecules/InputText.html' },
            { label: 'NavTile',          href: 'pages/molecules/NavTile.html' },
            { label: 'Pagination',       href: 'pages/molecules/Pagination.html' },
            { label: 'ReadOnlyField',    href: 'pages/molecules/ReadOnlyField.html' },
            { label: 'SegmentControl',   href: 'pages/molecules/SegmentControl.html' },
            { label: 'Splitter',         href: 'pages/molecules/Splitter.html' },
            { label: 'Tab',              href: 'pages/molecules/Tab.html' },
            { label: 'Toast',            href: 'pages/molecules/Toast.html' },
            { label: 'Tooltip',          href: 'pages/molecules/Tooltip.html' }
          ]
        },
        {
          group: 'Организмы',
          items: [
            { label: 'AllocationBar', href: 'pages/organisms/AllocationBar.html' },
            { label: 'Chart',    href: 'pages/organisms/Chart.html' },
            { label: 'Entity',     href: 'pages/organisms/Entity.html' },
            { label: 'Modal',    href: 'pages/organisms/Modal.html' },
            { label: 'NavPanel', href: 'pages/organisms/NavPanel.html' },
            { label: 'PageHeader', href: 'pages/organisms/PageHeader.html' },
            { label: 'Popover',  href: 'pages/organisms/Popover.html' },
            { label: 'RiskMetric', href: 'pages/organisms/RiskMetric.html' },
            { label: 'SnackBar',   href: 'pages/organisms/SnackBar.html' },
            { label: 'Table',      href: 'pages/organisms/Table.html' },
            { label: 'TableCell',  href: 'pages/organisms/TableCell.html' },
            { label: 'TableFilter', href: 'pages/organisms/TableFilter.html' },
            { label: 'Tile',       href: 'pages/organisms/Tile.html' }
          ]
        }
      ]
    },
    {
      cat: 'Правила и паттерны',
      items: [
        { label: 'Локальные компоненты',  href: 'pages/patterns/LocalComponents.html' },
        { label: 'Редполитика',           soon: true },
        { label: 'Тон оф войс',           soon: true },
        { label: 'Паттерны интерфейса',   soon: true }
      ],
    },
    {
      cat: 'Примеры экранов',
      items: [
        { label: 'Карточка сделки', href: 'pages/screens/DealCard.html' }
      ]
    },
    {
      cat: 'RND',
      items: [
        { label: 'Общий бэклог',            href: 'pages/rnd/Backlog.html' }
      ]
    }
  ];

  // текущий файл
  var current = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  if (current === '') current = 'index.html';

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function makeLink(item) {
    if (item.soon) {
      var s = el('span', 'ds-nav__link is-soon');
      s.appendChild(el('span', 'ds-nav__dot'));
      s.appendChild(el('span', 'ds-nav__label', item.label));
      s.appendChild(el('span', 'ds-nav__soon-badge', 'Скоро'));
      return s;
    }
    var a = el('a', 'ds-nav__link');
    a.href = ROOT + item.href;
    a.appendChild(el('span', 'ds-nav__dot'));
    a.appendChild(el('span', 'ds-nav__label', item.label));
    if (item.href.split('/').pop().toLowerCase() === current) {
      a.classList.add('is-active');
      a.setAttribute('aria-current', 'page');
    }
    return a;
  }

  // ---- построение DOM ----
  var nav = el('nav', 'ds-nav');
  nav.setAttribute('aria-label', 'Навигация по дизайн-системе');

  var brand = el('a', 'ds-nav__brand');
  brand.href = ROOT + 'index.html';
  var logo = el('span', 'ds-nav__logo');
  logo.appendChild(el('img'));
  logo.querySelector('img').src = ROOT + 'assets/logo.svg';
  logo.querySelector('img').alt = 'IBP';
  brand.appendChild(logo);
  var bt = el('span', 'ds-nav__brandtext');
  bt.appendChild(el('span', 'ds-nav__title', 'ДС IBP'));
  bt.appendChild(el('span', 'ds-nav__sub', 'Investment Banking Platform'));
  brand.appendChild(bt);
  if (current === 'index.html') brand.classList.add('is-active');
  nav.appendChild(brand);

  var scroll = el('div', 'ds-nav__scroll');

  NAV.forEach(function (block) {
    var cat = el('div', 'ds-nav__cat');
    cat.appendChild(el('div', 'ds-nav__cat-label', block.cat));

    if (block.items) {
      block.items.forEach(function (it) { cat.appendChild(makeLink(it)); });
    }
    if (block.groups) {
      block.groups.forEach(function (g) {
        var gl = el('div', 'ds-nav__group-label', g.group);
        var real = g.items.filter(function (i) { return !i.soon; }).length;
        if (real) gl.appendChild(el('span', 'ds-nav__count', String(real)));
        cat.appendChild(gl);
        g.items.forEach(function (it) { cat.appendChild(makeLink(it)); });
      });
    }
    scroll.appendChild(cat);
  });

  nav.appendChild(scroll);

  // мобильный тоггл + бэкдроп
  var toggle = el('button', 'ds-nav__toggle');
  toggle.type = 'button';
  toggle.setAttribute('aria-label', 'Открыть навигацию');
  toggle.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
  var backdrop = el('div', 'ds-nav__backdrop');

  function setOpen(open) {
    document.body.classList.toggle('ds-nav-open', open);
  }
  toggle.addEventListener('click', function () { setOpen(!document.body.classList.contains('ds-nav-open')); });
  backdrop.addEventListener('click', function () { setOpen(false); });
  nav.addEventListener('click', function (e) { if (e.target.closest('.ds-nav__link')) setOpen(false); });


  // самодостаточность: подтягиваем свой стиль, если страница его не подключила
  function ensureCss() {
    if (document.querySelector('link[rel="stylesheet"][href$="ds-nav.css"]')) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = (window.__DS_ROOT || '') + 'styles/ds-nav.css';
    document.head.appendChild(l);
  }

  function mount() {
    // no-op guard: монтируемся только на страницах-хостах навигации (index и документация
    // имеют <main class="page">). На карточках @dsCard, которые тянут ds-nav.js через
    // _ds_bundle.js, такого контейнера нет — молча выходим и не ломаем карточку/index.
    if (!document.querySelector('main.page')) return;
    if (document.body.classList.contains('ds-has-nav')) return;
    ensureCss();
    document.body.classList.add('ds-has-nav');
    document.body.insertBefore(backdrop, document.body.firstChild);
    document.body.insertBefore(nav, document.body.firstChild);
    document.body.appendChild(toggle);
    // прокрутка к активному пункту, если он ниже сгиба
    var active = nav.querySelector('.ds-nav__link.is-active');
    if (active) {
      var top = active.offsetTop;
      if (top > scroll.clientHeight - 80) scroll.scrollTop = top - scroll.clientHeight / 2;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
