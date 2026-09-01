/* =========================================================================
   NavTile documentation — конструктор и демо.
   ========================================================================= */
(function () {
  'use strict';

  /* ---------- фабрика плитки ---------- */
  function tile(opts) {
    var o = Object.assign({
      variant: 'base',          // base | links
      title: 'Сделки',
      desc: 'Кредитные линии, договоры и график платежей',
      illu: 'deals',
      showIllu: true, showDesc: true,
      links: ['Кредитные линии', 'Договоры', 'График платежей'],
      state: 'default'          // default | hover | focus | disabled
    }, opts || {});

    var disabled = o.state === 'disabled';
    var cls = 'ntile';
    /* вариант «Со ссылками» задаётся составом (.ntile__title-link + .ntile__links), отдельного модификатора нет */
    if (o.state === 'hover') cls += ' is-hover';
    if (o.state === 'focus') cls += ' is-focus';
    if (disabled) cls += ' is-disabled';

    var illu = o.showIllu ? '<span class="illu ntile__illu" data-illu="' + o.illu + '" aria-hidden="true"></span>' : '';
    var desc = o.showDesc ? '<p class="ntile__desc">' + o.desc + '</p>' : '';

    if (o.variant === 'links') {
      var links = o.links.slice(0, 4).map(function (t) {
        return '<a class="link link--accent link--m"' + (disabled ? ' aria-disabled="true"' : ' href="#"') + '>' + t + '</a>';
      }).join('');
      return '<div class="' + cls + '"' + (disabled ? ' aria-disabled="true"' : '') + '>' +
        illu +
        (disabled
          ? '<h3 class="ntile__title">' + o.title + '</h3>'
          : '<a class="ntile__title-link" href="#"><h3 class="ntile__title">' + o.title + '</h3></a>') +
        desc +
        '<nav class="ntile__links" aria-label="Подразделы">' + links + '</nav>' +
        '</div>';
    }
    return '<a class="' + cls + '"' + (disabled ? ' aria-disabled="true"' : ' href="#"') + '>' +
      illu + '<h3 class="ntile__title">' + o.title + '</h3>' + desc + '</a>';
  }

  function put(id, html) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = html;
  }

  /* ---------- конструктор ---------- */
  var pg = { variant: 'base', state: 'default', showIllu: true, showDesc: true, nLinks: 3 };

  function pgRender() {
    var stage = document.getElementById('pg-stage');
    var allLinks = ['Кредитные линии', 'Договоры', 'График платежей', 'Архив'];
    stage.innerHTML = '<div style="width:300px;">' + tile({
      variant: pg.variant, state: pg.state,
      showIllu: pg.showIllu, showDesc: pg.showDesc,
      links: allLinks.slice(0, pg.nLinks)
    }) + '</div>';
    var code = document.getElementById('pg-code');
    code.textContent = pg.variant === 'links'
      ? '<div class="ntile"> … <a class="ntile__title-link"> + <nav class="ntile__links">'
      : '<a class="ntile" href="…"> illu · title · desc </a>';
    stage.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); });
    });
  }

  function pgControls() {
    var c = document.getElementById('pg-controls');
    c.innerHTML =
      ctl('Вариант', 'pgVariant', [['base', 'Базовая'], ['links', 'Со ссылками']], pg.variant) +
      ctl('Состояние', 'pgState', [['default', 'Default'], ['hover', 'Hover'], ['focus', 'Focus'], ['disabled', 'Disabled']], pg.state) +
      chk('Иллюстрация', 'pgIllu', pg.showIllu) +
      chk('Описание', 'pgDesc', pg.showDesc) +
      '<div class="ctl" id="ctlLinks"><span class="lbl">Ссылок</span>' +
      '<div class="pg-select"><select id="pgLinks">' + [1, 2, 3, 4].map(function (n) {
        return '<option value="' + n + '"' + (n === pg.nLinks ? ' selected' : '') + '>' + n + '</option>';
      }).join('') + '</select></div></div>';

    c.addEventListener('change', function (e) {
      var t = e.target;
      if (t.id === 'pgVariant') pg.variant = t.value;
      if (t.id === 'pgState') pg.state = t.value;
      if (t.id === 'pgIllu') { pg.showIllu = t.checked; cbSync(t); }
      if (t.id === 'pgDesc') { pg.showDesc = t.checked; cbSync(t); }
      if (t.id === 'pgLinks') pg.nLinks = +t.value;
      sync();
    });
    sync();

    function cbSync(input) {
      var cb = input.closest('.cb');
      if (cb) {
        cb.classList.toggle('cb--selected', input.checked);
      }
    }

    function sync() {
      var links = document.getElementById('ctlLinks');
      links.classList.toggle('is-off', pg.variant !== 'links');
      pgRender();
      if (window.pgKit && window.pgKit.refresh) window.pgKit.refresh();
    }
  }

  function ctl(label, id, opts, cur) {
    return '<div class="ctl"><span class="lbl">' + label + '</span>' +
      '<div class="pg-select"><select id="' + id + '">' + opts.map(function (o) {
        return '<option value="' + o[0] + '"' + (o[0] === cur ? ' selected' : '') + '>' + o[1] + '</option>';
      }).join('') + '</select></div></div>';
  }
  function chk(label, id, on) {
    return '<div class="ctl"><label class="cb' + (on ? ' cb--selected' : '') + '">' +
      '<input type="checkbox" class="cb__input" id="' + id + '"' + (on ? ' checked' : '') + '>' +
      '<span class="cb__box"><span class="cb__mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span></span>' +
      '<span class="cb__content"><span class="cb__label">' + label + '</span></span>' +
      '</label></div>';
  }

  /* ---------- Использование: сетка ---------- */
  put('use-grid',
    tile({ title: 'Сделки', desc: 'Кредитные линии, договоры и график платежей', illu: 'deals' }) +
    tile({ title: 'Контрагенты', desc: 'Компании, реквизиты и связанные лица', illu: 'clients' }) +
    tile({ variant: 'links', title: 'Отчётность', desc: 'Формы, выгрузки и регламентные отчёты', illu: 'reports-1-c', links: ['Регламентные', 'Выгрузки', 'Архив'] }) +
    tile({ title: 'Задачи', desc: 'Поручения и согласования', illu: 'tasks' })
  );

  /* ---------- Анатомия ---------- */
  put('anat-diagram',
    tile({ variant: 'links', title: 'Отчётность', desc: 'Формы, выгрузки и регламентные отчёты', illu: 'reports-1-c', links: ['Регламентные', 'Выгрузки'] }));

  /* ---------- Варианты ---------- */
  put('var-base', tile({}) +
    tile({ title: 'Контрагенты', desc: 'Компании, реквизиты и связанные лица', illu: 'clients' }));
  put('var-links',
    tile({ variant: 'links', title: 'Отчётность', desc: 'Формы, выгрузки и регламентные отчёты', illu: 'reports-1-c', links: ['Регламентные', 'Выгрузки', 'Архив'] }) +
    tile({ variant: 'links', title: 'Администрирование', desc: 'Пользователи, роли и справочники', illu: 'settings', links: ['Пользователи', 'Роли', 'Справочники', 'Журнал'] }));

  /* ---------- Размеры ---------- */
  put('sizes-demo',
    tile({}) + tile({ title: 'Контрагенты', desc: 'Компании, реквизиты и связанные лица', illu: 'clients' }) +
    tile({ title: 'Задачи', desc: 'Поручения и согласования', illu: 'tasks' }) +
    tile({ title: 'Отчётность', desc: 'Формы, выгрузки и регламентные отчёты', illu: 'reports-1-c' })
  );

  /* ---------- Контент ---------- */
  put('content-demo',
    '<div>' + tile({ title: 'Сделки', desc: 'Кредитные линии, договоры и график платежей' }) + '</div>' +
    '<div>' + tile({ title: 'Переход к разделу сделок', desc: 'Здесь можно посмотреть все кредитные линии, договоры, график платежей, а также многое другое, что относится к сделкам.', illu: 'deals' }) + '</div>');
  // подпись «плохо/хорошо»
  (function () {
    var g = document.getElementById('content-demo');
    if (!g) return;
    var caps = ['Хорошо: короткое название-существительное, описание в 1–2 строки.', 'Плохо: глагольное название и описание-абзац.'];
    Array.prototype.forEach.call(g.children, function (w, i) {
      var p = document.createElement('p');
      p.className = 'desc tight';
      p.style.cssText = 'margin:10px 0 0; font-size:13px;';
      p.textContent = caps[i] || '';
      w.appendChild(p);
    });
  })();

  /* ---------- Состояния ---------- */
  (function () {
    var el = document.getElementById('states-demo');
    if (!el) return;
    var states = [['default', 'Default'], ['hover', 'Hover'], ['focus', 'Focus'], ['disabled', 'Disabled']];
    el.style.cssText = 'display:grid; grid-template-columns:repeat(auto-fill,minmax(400px,1fr)); gap:16px;';
    el.innerHTML = states.map(function (s) {
      return '<div><p class="desc tight" style="margin:0 0 10px; font-size:13px;">' + s[1] + '</p>' +
        tile({ state: s[0], title: 'Сделки', desc: 'Кредитные линии и договоры' }) + '</div>';
    }).join('');
  })();

  /* ---------- Redline: живые значения ---------- */
  (function () {
    var host = document.createElement('div');
    host.style.cssText = 'position:absolute; left:0; top:0; visibility:hidden;';
    host.innerHTML = tile({});
    document.body.appendChild(host);
    var t = host.querySelector('.ntile');
    var title = host.querySelector('.ntile__title');
    var desc = host.querySelector('.ntile__desc');
    var illu = host.querySelector('.ntile__illu');
    var cs = getComputedStyle(t);
    var rows = [
      ['Ширина × высота по умолчанию', cs.width + ' × ' + cs.minHeight],
      ['Паддинг контейнера', cs.paddingTop],
      ['Радиус скругления', cs.borderRadius + ' (--radius-control)'],
      ['Рамка', cs.borderTopWidth + ' solid (--border-light)'],
      ['Мин. высота', cs.minHeight],
      ['Зазор между частями', cs.rowGap],
      ['Иллюстрация', getComputedStyle(illu).width + ' × ' + getComputedStyle(illu).height],
      ['Название', getComputedStyle(title).fontSize + '/' + getComputedStyle(title).lineHeight + ' ' + getComputedStyle(title).fontWeight + ' (--type-h4-strong)'],
      ['Описание', getComputedStyle(desc).fontSize + '/' + getComputedStyle(desc).lineHeight + ' (--type-body-s)']
    ];
    document.body.removeChild(host);
    var tb = document.querySelector('#dev-spec-table');
    if (tb) tb.innerHTML = rows.map(function (r) {
      return '<div class="tbl__row" style="grid-template-columns:8px 1.84fr 0.81fr 8px;"><div class="tc tc--separator"></div><div class="tc"><span class="tc__row"><span class="tc__text">' + r[0] + '</span></span></div><div class="tc tc--wrap"><span class="tc__row"><span class="tc__text">' + r[1] + '</span></span></div><div class="tc tc--separator"></div></div>';
    }).join('');
  })();

  /* ---------- копирование кода ---------- */
  document.querySelectorAll('[data-copy-target]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var el = document.getElementById(btn.getAttribute('data-copy-target'));
      navigator.clipboard.writeText(el.textContent).then(function () {
        var l = btn.querySelector('.copy-label'), was = l.textContent;
        l.textContent = 'Скопировано';
        setTimeout(function () { l.textContent = was; }, 1400);
      });
    });
  });

  /* ---------- глушим переходы по демо-ссылкам ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('main a[href="#"]');
    if (a) e.preventDefault();
  });

  /* ---------- Каталог тайлов (единый источник: scripts/ibp-home.js) ----------
     Показывает все тайлы главной страницы по группам; пункты меню без тайла
     (tile: null) не выводятся. Изменение каталога в ibp-home.js подхватывается
     и страницей, и экранами главной. */
  (function () {
    var host = document.getElementById('catalog-demo');
    if (!host || !window.IBPHome) return;
    var html = '';
    IBPHome.groups.forEach(function (g) {
      var withTiles = g.items.filter(function (it) { return it.tile; });
      if (!withTiles.length) return;
      html += '<h4 class="cat-head">' + g.label + '</h4>';
      html += '<div class="demo-grid">' + withTiles.map(function (it) {
        return IBPHome.tileHTML(it);
      }).join('') + '</div>';
    });
    host.innerHTML = html;
  })();

  pgControls();
})();
