/* =========================================================================
   kanban.page.js — демо и конструктор страницы Kanban.
   Только для страницы документации: на экранах доску оживляет
   scripts/ds-kanban.js, а этот файл туда не подключается.
   ========================================================================= */
(function () {
  'use strict';

  /* Колонки — этапы жизненного цикла. Никаких ограничений переходов доска
     не знает: компонент общий, на нём живут сделки, задачи и заметки.
     Решению, которому модель переходов нужна, — kanban:beforemove. */
  var COLS = [
    { key: 'draft',    tone: 'lblue',   name: 'Заведение' },
    { key: 'vote',     tone: 'dpurple', name: 'Голосование' },
    { key: 'products', tone: 'orange',  name: 'Заполнение продуктов' },
    { key: 'support',  tone: 'green',   name: 'Сопровождение' },
    { key: 'corp',     tone: 'primary', name: 'Корпоративные запросы' },
    { key: 'closed',   tone: 'grey',    name: 'Погашение' }
  ];

  var CARDS = {
    draft: [
      { id: 'D-1042', t: 'ООО «ЮгСтрой» — кредитный мезонин', key: true,
        chips: ['Повышенный риск'], f: [['Сумма', '1 250 000 000 ₽'], ['Погашение', '31.12.2029']],
        stat: [['attach', '3'], ['message-text', '7']], av: ['ВП', 'ЗК'] },
      { id: 'D-1051', t: 'АО «Северный проект» — доля 24%',
        chips: ['Стандартный риск'], f: [['Сумма', '480 000 000 ₽'], ['Погашение', '—']], av: ['ИА'] }
    ],
    vote: [
      { id: 'D-0998', t: 'ПАО «Волга-Телеком» — опцион', star: true, key: true,
        chips: ['Ждёт кворума'], f: [['Сумма', '2 100 000 000 ₽'], ['Голосов', '4 из 7']],
        stat: [['message-text', '2']], av: ['ВП', 'МД'], more: '+3' }
    ],
    products: [
      { id: 'D-0977', t: 'ООО «Гранд-Девелопмент» — транш 2',
        chips: ['Нет договора'], f: [['Продуктов', '3'], ['Инструментов', '7']],
        stat: [['attach', '12']], av: ['ЗК'] },
      { id: 'D-0961', t: 'АО «Промлизинг» — акции',
        chips: ['Готово к сверке'], f: [['Продуктов', '1'], ['Инструментов', '2']], av: ['ИА', 'ВП'] }
    ],
    support: [
      { id: 'D-0834', t: 'ООО «Каспий-Порт» — кредитный мезонин', star: true, key: true,
        chips: ['Платежи в графике'], f: [['Ближайший платёж', '25.09.2026'], ['Резерв', '12 400 000 ₽']],
        av: ['ЗК', 'МД'] },
      { id: 'D-0790', t: 'ПАО «Уралсталь» — доля 11%',
        chips: ['Просрочка 4 дня', 'Эскалация'], f: [['Ближайший платёж', '06.09.2026'], ['Резерв', '88 000 000 ₽']],
        stat: [['message-text', '11']], av: ['ИА'] },
      { id: 'D-0752', t: 'ООО «Сибагро» — опцион',
        chips: ['Платежи в графике'], f: [['Ближайший платёж', '14.10.2026'], ['Резерв', '—']], av: ['ВП'] }
    ],
    corp: [
      { id: 'D-0688', t: 'АО «Балтэнерго» — согласование партнёрства', key: true,
        chips: ['Право вето'], f: [['Срок ответа', '19.09.2026'], ['Инициатор', 'Клиент']],
        stat: [['attach', '5']], av: ['ЗК'] }
    ],
    closed: [
      { id: 'D-0410', t: 'ООО «Мосэлектро» — кредитный мезонин',
        chips: ['Погашен'], f: [['Закрыт', '12.03.2026'], ['Итог', 'полное погашение']], av: ['МД'] }
    ]
  };

  var state = { cols: 6, dense: false, fields: 2, keychip: true, avatars: true,
                collapsed: false, view: 'default' };

  /* ---------- строители разметки (чистые, без DOM) ---------- */
  function chips(c, o) {
    var out = [];
    if (c.key && o.keychip) {
      out.push('<span class="chip chip--xs chip--rounded chip--orange">' +
        '<span class="chip__icon"><i data-icon="zap"></i></span>' +
        '<span class="chip__label">Ключевая сделка</span></span>');
    }
    (c.chips || []).forEach(function (t) {
      out.push('<span class="chip chip--xs chip--rounded"><span class="chip__label">' + t + '</span></span>');
    });
    if (!out.length) return '';
    return '<div class="tile__chiplist">' + out.join('') + '</div>';
  }

  function fields(c, o) {
    if (!o.fields || !c.f) return '';
    var list = c.f.slice(0, o.fields);
    if (!list.length) return '';
    return '<div class="kbcard__fields">' + list.map(function (p) {
      return '<div class="kbcard__field"><span class="kbcard__flabel">' + p[0] +
        '</span><span class="kbcard__fvalue">' + p[1] + '</span></div>';
    }).join('') + '</div>';
  }

  function meta(c) {
    if (!c.stat || !c.stat.length) return '';
    return '<div class="kbcard__meta">' + c.stat.map(function (s) {
      return '<span class="kbcard__stat"><i data-icon="' + s[0] + '"></i>' + s[1] + '</span>';
    }).join('') + '</div>';
  }

  function foot(c, o) {
    var av = '';
    if (o.avatars && c.av) {
      av = '<span class="av-group av-group--s">' + c.av.map(function (t, i) {
        return '<span class="av av--s av--circular' + (i === 1 ? ' av--accent' : '') +
          '"><span class="av__text">' + t + '</span></span>';
      }).join('') + (c.more ? '<span class="av-group__more">' + c.more + '</span>' : '') + '</span>';
    }
    return '<div class="kbcard__foot">' + av +
      '<span class="kbcard__id">' + c.id + '</span></div>';
  }

  function card(c, o, extra) {
    o = o || state;
    var cls = 'kbcard tile tile--card' + (o.dense ? ' kbcard--compact' : '') +
      (extra ? ' ' + extra : '');
    return '<article class="' + cls + '" tabindex="0" data-kb-card="' + c.id + '">' +
      '<header class="tile__header">' +
        '<div class="tile__header-main">' +
          '<div class="tile__title-row"><h3 class="tile__title">' + c.t + '</h3></div>' +
          chips(c, o) +
        '</div>' +
        '<div class="tile__actions">' +
          '<button type="button" class="ibtn ibtn--neutral ibtn--s" aria-label="В избранное" ' +
            'aria-pressed="' + (c.star ? 'true' : 'false') + '" data-kb-star>' +
            '<i data-icon="' + (c.star ? 'star-filled' : 'star') + '"></i></button>' +
          '<button type="button" class="ibtn ibtn--neutral ibtn--s" aria-label="Действия с карточкой" ' +
            'data-menu="kb-card-menu"><i data-icon="more-dots"></i></button>' +
        '</div>' +
      '</header>' +
      '<div class="tile__body">' + fields(c, o) + meta(c) + foot(c, o) + '</div>' +
    '</article>';
  }

  function skeletonCard() {
    return '<article class="kbcard tile tile--card">' +
      '<header class="tile__header"><div class="tile__header-main">' +
        '<span class="sk-line sk-line--title" style="--sk-w:100%"></span>' +
        '<span class="sk-line sk-line--caption" style="--sk-w:60%"></span>' +
      '</div></header>' +
      '<div class="tile__body"><div class="kbcard__fields">' +
        '<div class="kbcard__field"><span class="sk-line sk-line--caption" style="--sk-w:52px"></span>' +
          '<span class="sk-line" style="--sk-w:76px"></span></div>' +
        '<div class="kbcard__field"><span class="sk-line sk-line--caption" style="--sk-w:52px"></span>' +
          '<span class="sk-line" style="--sk-w:64px"></span></div>' +
      '</div></div></article>';
  }

  function colHead(c, n) {
    return '<header class="kbcol__head">' +
      '<span class="kbcol__marker" aria-hidden="true"></span>' +
      '<span class="kbcol__name">' + c.name + '</span>' +
      '<span class="kbcol__vname" aria-hidden="true">' + c.name + '</span>' +
      '<span class="badge badge--text badge--s" data-kb-count>' + n + '</span>' +
      '<span class="kbcol__acts">' +
        '<button type="button" class="ibtn ibtn--neutral ibtn--s" aria-label="Добавить карточку в «' + c.name + '»" data-kb-add><i data-icon="add"></i></button>' +
        '<button type="button" class="ibtn ibtn--neutral ibtn--s" aria-label="Открыть страницу «' + c.name + '»"><i data-icon="arrow-right"></i></button>' +
        '<button type="button" class="ibtn ibtn--neutral ibtn--s" aria-label="Действия с колонкой «' + c.name + '»" data-menu="kb-col-menu"><i data-icon="more-dots"></i></button>' +
      '</span>' +
    '</header>';
  }

  function column(c, o, opts) {
    opts = opts || {};
    var list = opts.empty ? [] : (CARDS[c.key] || []);
    var body;
    if (o.view === 'loading') body = skeletonCard() + skeletonCard();
    else body = list.map(function (x) { return card(x, o); }).join('');
    var cls = 'kbcol kbcol--' + c.tone + (opts.mod ? ' ' + opts.mod : '');
    return '<section class="' + cls + '" data-kb-col="' + c.key + '" ' +
      'data-kb-name="' + c.name + '">' +
      colHead(c, list.length) +
      '<div class="kbcol__body" data-kb-body>' + body + '</div>' +
    '</section>';
  }

  function board(o) {
    var use = COLS.slice(0, o.cols);
    var total = 0;
    use.forEach(function (c) { total += (CARDS[c.key] || []).length; });
    var cols = use.map(function (c, i) {
      return column(c, o, { mod: (o.collapsed && i === 0) ? 'kbcol--collapsed' : '' });
    }).join('');
    var addcol = '<div class="kanban__addcol">' +
      '<button type="button" class="btn btn--transparent btn--s" data-kb-addcol>' +
      '<i data-icon="add"></i><span class="btn__label">Добавить колонку</span></button></div>';

    if (o.view === 'empty') {
      cols = '';
      addcol = '<div class="es es--m" style="margin:auto"><span class="illu es__illu" data-illu="empty-folder" aria-hidden="true"></span>' +
        '<div class="es__body"><p class="es__title">На доске нет колонок</p>' +
        '<p class="es__text">Колонки — этапы, по которым движется работа. Создайте первую.</p></div>' +
        '<div class="es__actions"><button type="button" class="btn btn--accent btn--m" data-kb-addcol>' +
        '<span class="btn__label">Создать первую колонку</span></button></div></div>';
    }

    return '<div class="kanban" data-kanban data-kb-confirm="kb-confirm" data-kb-drawer="kb-drawer">' +
      '<div class="kanban__toolbar">' +
        '<h2 class="kanban__title">Сделки направления Post</h2>' +
        '<span class="badge badge--text badge--s" data-kb-total>' + total + '</span>' +
        '<div class="kanban__toolbar-right">' +
          '<div class="segctrl segctrl--s" role="radiogroup" aria-label="Вид представления" data-segctrl>' +
            '<div class="segctrl__thumb"></div>' +
            '<button type="button" class="segctrl__item" role="radio" aria-checked="true" tabindex="0"><span class="segctrl__label">Доска</span></button>' +
            '<button type="button" class="segctrl__item" role="radio" aria-checked="false" tabindex="-1"><span class="segctrl__label">Таблица</span></button>' +
          '</div>' +
          '<button type="button" class="btn btn--outline btn--s"><i data-icon="filter"></i><span class="btn__label">Фильтр</span></button>' +
          '<button type="button" class="ibtn ibtn--neutral ibtn--m" aria-label="Настройки доски" data-menu="kb-board-menu"><i data-icon="more-dots"></i></button>' +
        '</div>' +
      '</div>' +
      '<div class="kanban__viewport"><div class="kanban__track">' + cols + addcol + '</div></div>' +
    '</div>';
  }

  /* ---------- отрисовка ---------- */
  function paint(host, html) {
    if (!host) return;
    host.innerHTML = html;
    if (window.dsIcons && dsIcons.apply) dsIcons.apply(host);
    if (window.DSIllustrations && DSIllustrations.render) DSIllustrations.render();
  }

  /* Пересборка сцены = новая разметка, а значит НОВЫЕ узлы. Рантаймы ДС
     связывают свою разметку один раз на DOMContentLoaded, поэтому каждый
     из них надо позвать повторно — забытый DSMenu.bindAll оставлял кебабы
     доски, колонок и карточек мёртвыми, и меню не открывались вовсе.
     Имена методов здесь сверяются с экспортом рантайма: guard вида
     «window.DSX && DSX.method» при опечатке в имени не падает, а молча
     ничего не делает (так segctrl остался без индикатора). */
  function rebind(scope) {
    if (window.dsIcons && dsIcons.apply) dsIcons.apply(scope);
    if (window.DSTabs && DSTabs.wireAll) DSTabs.wireAll(scope);
    if (window.DSMenu && DSMenu.bindAll) DSMenu.bindAll(scope);
    if (window.DSModal && DSModal.bindAll) DSModal.bindAll(scope);
    if (window.DSDrawer && DSDrawer.bindAll) DSDrawer.bindAll(scope);
  }

  function render() {
    var stage = document.getElementById('pg-stage');
    if (!stage) return;
    paint(stage, board(state));
    var el = stage.querySelector('[data-kanban]');
    if (el && window.DSKanban) { el.__dsKanban = false; DSKanban.bind(el); }
    rebind(stage);
  }

  /* ---------- конструктор ----------
     Контролы кладутся прямыми детьми #pg-controls; колонки .ctl-col и
     .toggles строит docs-split.js сам, бинарные селекты он же
     превращает в свитчи. */
  function ctlSelect(id, label, opts, val) {
    return '<div class="ctl"><div class="lbl">' + label + '</div>' +
      '<div class="pg-select"><select id="' + id + '">' +
      opts.map(function (o) {
        return '<option value="' + o[0] + '"' + (String(o[0]) === String(val) ? ' selected' : '') +
          '>' + o[1] + '</option>';
      }).join('') + '</select></div></div>';
  }

  function buildControls() {
    var host = document.getElementById('pg-controls');
    if (!host) return;
    host.innerHTML =
      '<div class="pg__grouphead">Доска</div>' +
      ctlSelect('pg-cols', 'Колонок', [[3, '3'], [4, '4'], [5, '5'], [6, '6']], state.cols) +
      ctlSelect('pg-view', 'Состояние', [['default', 'Обычное'], ['loading', 'Загрузка'], ['empty', 'Нет колонок']], state.view) +
      ctlSelect('pg-collapsed', 'Свернуть первую колонку', [['no', 'Нет'], ['yes', 'Да']], state.collapsed ? 'yes' : 'no') +
      '<div class="pg__grouphead">Карточка</div>' +
      ctlSelect('pg-dense', 'Компактные карточки', [['no', 'Нет'], ['yes', 'Да']], state.dense ? 'yes' : 'no') +
      ctlSelect('pg-fields', 'Полей на карточке', [[0, '0'], [2, '2'], [4, '4']], state.fields) +
      ctlSelect('pg-keychip', 'Чип «Ключевая сделка»', [['no', 'Нет'], ['yes', 'Да']], state.keychip ? 'yes' : 'no') +
      ctlSelect('pg-avatars', 'Исполнители', [['no', 'Нет'], ['yes', 'Да']], state.avatars ? 'yes' : 'no');

    var map = {
      'pg-cols':      function (v) { state.cols = parseInt(v, 10); },
      'pg-view':      function (v) { state.view = v; },
      'pg-collapsed': function (v) { state.collapsed = v === 'yes'; },
      'pg-dense':     function (v) { state.dense = v === 'yes'; },
      'pg-fields':    function (v) { state.fields = parseInt(v, 10); },
      'pg-keychip':   function (v) { state.keychip = v === 'yes'; },
      'pg-avatars':   function (v) { state.avatars = v === 'yes'; }
    };
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      var on = function () { map[id](el.value); render(); };
      el.addEventListener('change', on);
      el.addEventListener('input', on);
    });
  }

  /* ---------- анатомия: маркеры считаются по факту, а не вручную ---------- */
  function markers(host, pairs) {
    if (!host) return;
    var hr = host.getBoundingClientRect();
    host.style.paddingLeft = '14px';
    pairs.forEach(function (p) {
      var el = host.querySelector(p[0]);
      if (!el) return;
      var r = el.getBoundingClientRect();
      var s = document.createElement('span');
      s.className = 'mk';
      s.style.top = (r.top - hr.top + r.height / 2) + 'px';
      s.style.left = '-11px';
      s.textContent = p[1];
      host.appendChild(s);
    });
  }

  function buildAnatomy() {
    var o = { cols: 3, dense: false, fields: 2, keychip: true, avatars: true,
              collapsed: false, view: 'default' };

    var b = document.getElementById('anat-board');
    if (b) {
      b.style.width = '760px';
      paint(b, board(o));
      markers(b, [['.kanban__toolbar', 1], ['.kanban__track', 2], ['.kbcol', 3], ['.kanban__addcol', 4]]);
    }

    var c = document.getElementById('anat-col');
    if (c) {
      c.style.width = '288px';
      paint(c, '<div class="kanban">' + column(COLS[0], o, {}) + '</div>');
      markers(c, [['.kbcol__head', 1], ['.kbcol__marker', 2], ['.kbcol__name', 3],
                  ['.kbcol__acts', 4], ['.kbcol__body', 5]]);
      var body = c.querySelector('.kbcol__body');
      if (body) {
        var g = document.createElement('div');
        g.className = 'kbcol__guide';
        body.appendChild(g);
        markers(c, [['.kbcol__guide', 6]]);
      }
    }

    var k = document.getElementById('anat-card');
    if (k) {
      k.style.width = '272px';
      paint(k, card(CARDS.draft[0], o));
      markers(k, [['.tile__title', 1], ['.tile__chiplist', 2], ['.tile__actions', 3],
                  ['.kbcard__fields', 4], ['.kbcard__meta', 5], ['.kbcard__foot', 6]]);
    }
  }

  /* ---------- образцы вариантов и состояний ---------- */
  function sample(name, html, w) {
    return '<div class="sample"' + (w ? ' style="width:' + w + '"' : '') + '>' +
      '<span class="sample__name">' + name + '</span>' +
      '<div class="sample__box">' + html + '</div></div>';
  }
  var BASE = { cols: 1, dense: false, fields: 2, keychip: true, avatars: true,
               collapsed: false, view: 'default' };
  function opt(over) {
    var o = {}, k;
    for (k in BASE) if (BASE.hasOwnProperty(k)) o[k] = BASE[k];
    for (k in over) if (over.hasOwnProperty(k)) o[k] = over[k];
    return o;
  }

  function buildVariants() {
    var tones = [['grey', 'Нейтральный'], ['green', 'Зелёный'], ['lblue', 'Голубой'],
                 ['orange', 'Оранжевый'], ['dpurple', 'Фиолетовый'], ['primary', 'Акцентный']];
    paint(document.getElementById('var-col-tone'), tones.map(function (t) {
      var c = { key: 'x', tone: t[0], name: COLS[0].name, to: '' };
      return sample(t[1] + ' · --st-' + t[0],
        '<div class="kanban"><section class="kbcol kbcol--' + t[0] + '">' +
        '<header class="kbcol__head"><span class="kbcol__marker" aria-hidden="true"></span>' +
        '<span class="kbcol__name">' + t[1] + '</span>' +
        '<span class="badge badge--text badge--s">4</span></header></section></div>', '200px');
    }).join(''));

    paint(document.getElementById('var-col-collapsed'),
      sample('Развёрнутая', '<div class="kanban">' + column(COLS[1], opt({}), {}) + '</div>') +
      sample('Свёрнутая — имя читается снизу вверх',
        '<div class="kanban"><div class="kanban__viewport"><div class="kanban__track">' +
        column(COLS[1], opt({}), { mod: 'kbcol--collapsed' }) + '</div></div></div>', '120px'));

    paint(document.getElementById('var-card-density'),
      sample('Базовая', card(CARDS.draft[0], opt({}))) +
      sample('Компактная — в той же высоте помещается две',
        card(CARDS.draft[0], opt({ dense: true })) +
        '<div style="height:16px"></div>' +
        card(CARDS.draft[1], opt({ dense: true }))));

    paint(document.getElementById('var-card-chips'),
      sample('Без чипов', card({ id: 'D-1000', t: CARDS.draft[0].t, f: CARDS.draft[0].f, av: ['ВП'] }, opt({}))) +
      sample('Один чип', card({ id: 'D-1001', t: CARDS.draft[0].t, chips: ['Повышенный риск'], f: CARDS.draft[0].f, av: ['ВП'] }, opt({}))) +
      sample('Ключевая сделка + два чипа',
        card({ id: 'D-1002', t: CARDS.draft[0].t, key: true, chips: ['Повышенный риск', 'Эскалация'],
               f: CARDS.draft[0].f, av: ['ВП'] }, opt({}))));
  }

  function buildStates() {
    var c = CARDS.draft[1];
    var st = [['', 'Default — обычная'], ['is-hover', 'Hover — под указателем'],
              ['is-pressed', 'Active — нажата'], ['is-move', 'Move — схвачена и едет за курсором'],
              ['kbcard--ghost', 'Ghost — место схваченной карточки'],
              ['kbcard--selected', 'Selected — выбрана или взята с клавиатуры'],
              ['kbcard--error', 'Error — изменение не сохранилось']];
    var html = st.map(function (s) {
      return sample(s[1], card(c, opt({}), s[0]));
    }).join('');
    html += sample('Disabled — роль не вправе двигать',
      card(c, opt({}), '').replace('<article class="', '<article aria-disabled="true" class="'));
    html += sample('Skeleton — загрузка', skeletonCard());
    paint(document.getElementById('states-card'), html);

    var cs = [['', 'Default — заливки нет'], ['kbcol--drop', 'Цель дропа'],
              ['kbcol--selected', 'Взята с клавиатуры'], ['kbcol--ghost', 'Место взятой колонки'],
              ['kbcol--collapsed', 'Свёрнута']];
    paint(document.getElementById('states-col'), cs.map(function (s) {
      return sample(s[1], '<div class="kanban"><div class="kanban__viewport"><div class="kanban__track">' +
        column(COLS[0], opt({}), { mod: s[0], empty: s[0] === 'kbcol--collapsed' }) +
        '</div></div></div>', s[0] === 'kbcol--collapsed' ? '120px' : '');
    }).join('') + sample('Пустая — текст говорит, что сюда класть',
      '<div class="kanban">' + column(COLS[0], opt({}), { empty: true }) + '</div>'));
    var host = document.getElementById('states-col');
    if (host && window.DSKanban) {
      Array.prototype.forEach.call(host.querySelectorAll('[data-kb-body]'), function (b) {
        if (b.querySelectorAll('.kbcard').length) return;
        var p = document.createElement('p');
        p.className = 'kbcard__flabel';
        p.style.cssText = 'margin:0;padding:12px 4px;white-space:normal;';
        p.textContent = 'Пока пусто. Перетащите сюда карточку.';
        b.appendChild(p);
      });
    }
  }

  /* ---------- таблицы: цвета и redline ---------- */
  function dsTbl(host, headers, rows, widths) {
    if (!host) return;
    var grid = ['8px'].concat(widths, ['8px']).join(' ');
    var head = '<div class="tbl__row" style="grid-template-columns:' + grid + ';">' +
      '<div class="th th--separator"></div>' +
      headers.map(function (h) {
        return '<div class="th"><span class="th__label">' + h + '</span></div>';
      }).join('') + '<div class="th th--separator"></div></div>';
    var body = rows.map(function (r) {
      return '<div class="tbl__row" style="grid-template-columns:' + grid + ';">' +
        '<div class="tc tc--separator"></div>' +
        r.map(function (c) {
          return '<div class="tc tc--wrap"><span class="tc__row"><span class="tc__text">' + c +
            '</span></span></div>';
        }).join('') + '<div class="tc tc--separator"></div></div>';
    }).join('');
    host.innerHTML = head + body;
  }

  function hexOf(probe, value) {
    probe.style.color = '';
    probe.style.color = value;
    var m = getComputedStyle(probe).color.match(/[\d.]+/g);
    if (!m) return '—';
    return '#' + m.slice(0, 3).map(function (n) {
      return ('0' + Math.round(parseFloat(n)).toString(16)).slice(-2);
    }).join('').toUpperCase();
  }

  function buildColors() {
    var host = document.getElementById('color-table');
    if (!host) return;
    var probe = document.createElement('span');
    probe.style.display = 'none';
    document.body.appendChild(probe);
    var rows = [
      ['Доска', 'Фон под доской', '--bg-page'],
      ['Колонка', 'Заливка в покое', 'transparent'],
      ['Колонка', 'Заливка под указателем', '--primary-bg'],
      ['Колонка', 'Заливка — цель дропа', '--primary-bg'],
      ['Колонка', 'База липкой шапки', '--bg-page'],
      ['Колонка', 'Маркер тона', '--st-lblue'],
      ['Колонка', 'Линия вставки', '--primary-dark'],
      ['Карточка', 'Фон', '--bg-tile'],
      ['Карточка', 'Рамка', '--border-light'],
      ['Карточка', 'Фон · Hover', '--bgtable-row-hover'],
      ['Карточка', 'Фон · Active', '--bgtable-row-focus'],
      ['Карточка', 'Рамка · Move', '--primary'],
      ['Карточка', 'Фон · Selected', '--primary-bg'],
      ['Карточка', 'Рамка · Error', '--error'],
      ['Текст', 'Заголовок и значение поля', '--text-primary'],
      ['Текст', 'Подпись поля, метрики, код', '--text-inactive']
    ];
    dsTbl(host, ['Раздел', 'Роль', 'Токен', 'Образец', 'Hex'], rows.map(function (r) {
      var isToken = r[2].indexOf('--') === 0;
      var val = isToken ? 'var(' + r[2] + ')' : r[2];
      var sw = '<span style="display:inline-block;width:22px;height:22px;border-radius:var(--radius-xs);' +
        'border:1px solid var(--border-light);vertical-align:middle;background:' + val + '"></span>';
      return [r[0], r[1], '<code class="tok">' + r[2] + '</code>', sw,
              isToken ? hexOf(probe, val) : '—'];
    }), ['1fr', '1.6fr', '1.3fr', '0.7fr', '0.9fr']);
    probe.remove();
  }

  /* Значения снимаются с живых узлов через getComputedStyle,
     а не выписываются руками — расхождение с CSS невозможно. */
  function buildRedline() {
    var host = document.getElementById('redline-table');
    var stage = document.getElementById('pg-stage');
    if (!host || !stage) return;
    function cs(sel, prop) {
      var el = stage.querySelector(sel);
      return el ? getComputedStyle(el)[prop] : '—';
    }
    var rows = [
      ['Ширина колонки', cs('.kbcol', 'width'), '<code class="tok">--kb-col-w</code>'],
      ['Паддинг колонки', cs('.kbcol', 'padding'), '<code class="tok">--space-8</code>'],
      ['Радиус колонки', cs('.kbcol', 'borderRadius'), '<code class="tok">--radius-m</code>'],
      ['Зазор между карточками', cs('.kbcol__body', 'rowGap'), '<code class="tok">--space-8</code>'],
      ['Хэдер карточки', cs('.kbcard > .tile__header', 'padding'), 'Card: 16 / 16 / 8'],
      ['Контент карточки', cs('.kbcard > .tile__body', 'padding'), 'Card: 8 / 16 / 20'],
      ['Радиус карточки', cs('.kbcard', 'borderRadius'), '<code class="tok">--radius-m</code>'],
      ['Заголовок карточки', cs('.kbcard .tile__title', 'font'), '<code class="tok">--type-h6-strong</code>'],
      ['Значение поля', cs('.kbcard__fvalue', 'font'), '<code class="tok">--type-body-s</code>'],
      ['Подпись поля', cs('.kbcard__flabel', 'font'), '<code class="tok">--type-body-xs</code>'],
      ['Имя колонки', cs('.kbcol__name', 'font'), '<code class="tok">--type-body-s-strong</code>']
    ];
    dsTbl(host, ['Свойство', 'Значение', 'Токен / описание'], rows, ['1.6fr', '1.6fr', '1.6fr']);
  }

  function copyButtons() {
    Array.prototype.forEach.call(document.querySelectorAll('.copy-btn'), function (btn) {
      btn.addEventListener('click', function () {
        var code = document.getElementById('code-' + btn.getAttribute('data-copy'));
        if (!code || !navigator.clipboard) return;
        navigator.clipboard.writeText(code.textContent).then(function () {
          var old = btn.textContent;
          btn.textContent = 'Скопировано';
          btn.classList.add('is-copied');
          setTimeout(function () { btn.textContent = old; btn.classList.remove('is-copied'); }, 1600);
        });
      });
    });
  }

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }
  ready(function () {
    buildControls();
    render();
    buildAnatomy();
    buildVariants();
    buildStates();
    buildColors();
    copyButtons();
    setTimeout(buildRedline, 80);   /* после того, как раскладка устоялась */
  });
})();
