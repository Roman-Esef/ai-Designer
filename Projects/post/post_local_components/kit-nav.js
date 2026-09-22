/* ============================================================
   kit-nav.js — левая панель витрины кита и карточки компонентов.

   Зачем. Правила локальных компонентов требуют одну навигацию по категориям и
   на обзорной странице кита, и в витрине каждого компонента, а список — из
   паспортов, в одном файле. Список лежит в kit.js, а этот модуль его рисует,
   чтобы разметка панели не копировалась в каждую витрину.

   Панель — компонент ДС NavPanel: группа = категория паспорта
   (.nav__block + .nav__block-label), пункт = компонент (.nav__item),
   текущий — .nav__item--selected. Своей вёрстки панели здесь нет.

   Футер панели страница готовит сама и передаёт готовой строкой: путь до хаба
   у каждой страницы свой (она лежит на своей глубине), а сторож projects-hub
   проверяет подмену в самом .html, а не здесь.

   Вызов со страницы:
     PostKitNav.render({ nav, groups, base, current, footer })
       nav     — узел <nav class="nav">
       groups  — узел под карточки (может отсутствовать: в витрине компонента
                 рисуется только панель)
       base    — путь от страницы до папки кита ('.' или '..')
       current — id текущего компонента или null
       footer  — готовая разметка футера панели
   ============================================================ */
(function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* Группы в порядке из реестра; внутри группы — по алфавиту видимого
     названия, как требуют правила. Пустые категории тоже рисуются: список
     категорий — это раскладка кита, и по ней видно, куда класть новый
     компонент. Решение человека 20.09.2026. */
  function grouped(kit) {
    return kit.categories.map(function (cat) {
      var items = kit.components
        .filter(function (c) { return c.category === cat; })
        .sort(function (a, b) { return a.name.localeCompare(b.name, 'ru'); });
      return { category: cat, items: items };
    });
  }

  /* Ссылка на витрину компонента или null, если витрины ещё нет. */
  function docHref(base, item) {
    return item.doc ? base + '/' + item.doc : null;
  }

  /* Генерируется только список групп и пунктов — постоянная часть панели
     (шапка с бургером и пином) стоит статикой в разметке страницы. Так
     анатомию NavPanel видит приёмка: сенсор читает .html, а не внешний .js,
     и панель, целиком собранная скриптом, выглядит для него неполной (Б31). */
  /* Пункт под-списка. */
  function subItem(href, name, selected) {
    var cls = 'nav__item' + (selected ? ' nav__item--selected' : '') + (href ? '' : ' nav__item--disabled');
    var label = '<span class="nav__label">' + esc(name) + '</span>';
    return href
      ? '<a class="' + cls + '" href="' + esc(href) + '"' + (selected ? ' aria-current="page"' : '') + '>' + label + '</a>'
      : '<span class="' + cls + '" aria-disabled="true">' + label + '</span>';
  }

  /* Артефакты компонента — под-пункты аккордеона. В плоском списке кита их нет:
     модальное окно принадлежит своему тайлу, а не киту. Разметка аккордеона —
     штатная из NavPanel (.nav__item--acc + .nav__sub), разворачивание делает
     рантайм ds-nav-panel.js, своего кода не нужно.

     ВАЖНО: родитель аккордеона по контракту ДС НЕ ведёт по ссылке —
     ds-nav-panel.js вызывает на нём preventDefault (строка 136). Поэтому
     страница самого компонента стоит ПЕРВЫМ под-пунктом «Обзор»: иначе на неё
     не попасть из панели вовсе. */
  function subHTML(it, base, current) {
    var open = it.id === current
      || (it.artifacts || []).some(function (a) { return a.id === current; });
    var sub = subItem(docHref(base, it), 'Обзор', it.id === current);
    sub += (it.artifacts || []).map(function (a) {
      return subItem(a.doc ? base + '/' + a.doc : null, a.name, a.id === current);
    }).join('');
    return { open: open, html: sub };
  }

  function listHTML(groups, base, current) {
    var s = '';

    groups.forEach(function (g) {
      s += '<div class="nav__block"><p class="nav__block-label">' + esc(g.category) + '</p>';

      /* Пустая категория объявлена, но компонентов в ней пока нет. Прятать её
         нельзя: тогда не видно раскладки кита и того, куда класть новое. */
      if (!g.items.length) {
        s += '<span class="nav__item nav__item--disabled" aria-disabled="true">'
          + '<span class="nav__label">пока пусто</span></span></div>';
        return;
      }

      g.items.forEach(function (it) {
        var href = docHref(base, it);
        var selected = it.id === current;
        /* Компонент без витрины — пункт без ссылки и выключен: он есть в ките,
           но открывать пока нечего. Выключенное состояние честнее, чем скрытый
           пункт: иначе кит выглядит состоящим из одного компонента. */
        var cls = 'nav__item' + (selected ? ' nav__item--selected' : '') + (href ? '' : ' nav__item--disabled');
        /* Иконки у пунктов нет: она ничего не различает — все пункты одного
           рода, и один и тот же глиф у всех был бы шумом (решение человека
           20.09.2026). Панель работает в режиме --fixed, где виден лейбл. */
        var label = '<span class="nav__label">' + esc(it.name) + '</span>';

        if (it.artifacts && it.artifacts.length) {
          var sub = subHTML(it, base, current);
          var subId = 'kit-sub-' + it.id;
          /* Родитель аккордеона не ссылка: клик по нему рантайм перехватывает.
             Сама страница компонента — первый под-пункт «Обзор». */
          s += '<a class="' + cls + ' nav__item--acc" href="#"'
            + ' aria-expanded="' + (sub.open ? 'true' : 'false') + '" aria-controls="' + subId + '">'
            + label + '<span class="nav__caret"><i data-icon="chevron-down"></i></span></a>'
            + '<div class="nav__sub" id="' + subId + '"><div class="nav__sub-in">' + sub.html + '</div></div>';
          return;
        }

        s += href
          ? '<a class="' + cls + '" href="' + esc(href) + '"' + (selected ? ' aria-current="page"' : '') + '>'
            + label + '</a>'
          : '<span class="' + cls + '" aria-disabled="true">' + label + '</span>';
      });
      s += '</div>';
    });

    return s;
  }

  function cardsHTML(groups, base) {
    return groups.map(function (g) {
      var cards = g.items.map(function (it) {
        var href = docHref(base, it);
        var stub = it.state !== 'filled';
        var inner = '<header class="tile__header">'
          + '<div class="tile__header-main">'
          + '<div class="tile__title-row"><h3 class="tile__title">' + esc(it.name) + '</h3></div>'
          + (stub ? '<div class="tile__chiplist"><span class="chip chip--xs"><span class="chip__label">Заглушка</span></span></div>' : '')
          + '</div></header>'
          + '<div class="tile__body"><p class="kit-card__purpose">' + esc(it.purpose) + '</p>'
          /* Артефакты отдельными карточками не выводятся — они не компоненты.
             Но знать, что у компонента есть своё окно, нужно на обзоре. */
          + (it.artifacts && it.artifacts.length
              ? '<p class="kit-card__meta">Артефакты: ' + it.artifacts.length + '</p>' : '')
          + (href ? '' : '<p class="kit-card__no-doc">Витрины пока нет</p>')
          + '</div>';
        return href
          ? '<a class="tile tile--card kit-card col-4 colw-6" href="' + esc(href) + '">' + inner + '</a>'
          : '<div class="tile tile--card kit-card col-4 colw-6" aria-disabled="true">' + inner + '</div>';
      }).join('');

      return '<section class="kit-group">'
        + '<h2 class="kit-group__head">' + esc(g.category)
        + '<span class="kit-group__count">' + g.items.length + '</span></h2>'
        + (g.items.length
            ? '<div class="grid12">' + cards + '</div>'
            : '<p class="kit-card__no-doc">В этой категории пока нет компонентов</p>')
        + '</section>';
    }).join('');
  }

  function render(opts) {
    var kit = window.PostKit;
    if (!kit) return;
    var groups = grouped(kit);
    var base = opts.base || '.';

    var list = opts.nav && opts.nav.querySelector('.nav__list');
    if (list) list.innerHTML = listHTML(groups, base, opts.current || null);
    /* футер панели страница готовит сама: путь до хаба у каждой свой */
    if (opts.nav && opts.footer) opts.nav.insertAdjacentHTML('beforeend', opts.footer);
    if (opts.groups) opts.groups.innerHTML = cardsHTML(groups, base);
    if (window.dsIcons) window.dsIcons.apply(document);
  }

  window.PostKitNav = { render: render };
})();
