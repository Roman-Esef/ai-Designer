/* ============================================================
   TileKNRModal.js — поведение модального окна КНР.

   Делает то, чего нет в рантаймах ДС, и только это:
   1) показ панели выбранного таба (DSTabs даёт roving tabindex и стрелки,
      но панель не переключает — рантайма для этого в ДС нет);
   2) поиск по базе контрагентов (формы «Параметры поиска»);
   3) перенос карточки в соседнюю колонку — кнопкой со стрелками на карточке
      или двойным кликом по ней. Перетаскивания нет;
   4) черновик: окно правит состав сделки, «Сохранить» применяет правки,
      крестик, Esc и любое другое закрытие их отменяют;
   5) режим прав окна — data-mode на .lc-knrm (edit | view), его ставит
      страница. В view поиск работает, а карточки рисуются в режиме просмотра:
      без кнопки переноса, отметка «КНР» не меняется. Смена режима
      перерисовывает колонки.

   Данные — CounterpartiesStore (data/counterparties-store.js): состав сделки,
   поиск, черновик и сохранение живут там. Разметку карточки даёт локальный
   компонент «Карточка контрагента» (PostCardCounterparty). Здесь только
   раскладка одного по другому и реакция на действия пользователя.

   Свой JavaScript здесь — модель данных экрана, а не замена рантайма ДС:
   открытие окна, фокус, Esc, выпадающий список и подсказки делают рантаймы.
   ============================================================ */
(function () {
  'use strict';

  var scrim = document.getElementById('knr-scrim');
  if (!scrim) return;

  var NOTHING_FOUND = 'По заданным параметрам ничего не найдено';

  function store() { return window.CounterpartiesStore; }

  /* ── Табы: показ панели выбранного ──────────────────────────────── */
  /* Скрипт синхронный и стоит после ds.js, поэтому DSTabs.tabs(...) успевает
     раньше автопривязки wireAll (она на DOMContentLoaded) и onChange не
     теряется — тот же приём, что у табов страницы сделки. */
  function bindTabs() {
    var bar = document.getElementById('knr-tabs');
    if (!bar || !window.DSTabs) return;
    var panels = Array.prototype.slice.call(scrim.querySelectorAll('[data-knr-panel]'));
    window.DSTabs.tabs(bar, {
      onChange: function (index) {
        panels.forEach(function (p, i) { p.hidden = (i !== index); });
      }
    });
  }

  /* ── Вспомогательное ────────────────────────────────────────────── */

  function isMembers(drop) {
    return drop && drop.getAttribute('data-knr-drop').indexOf('-members') !== -1;
  }

  function kindOf(drop) {
    return drop && drop.getAttribute('data-knr-drop').indexOf('fl-') === 0 ? 'fl' : 'ul';
  }

  function cardId(card) {
    return card && card.getAttribute('data-knr-card');
  }

  function isInline(el) {
    return el.classList.contains('modal-scrim--inline');
  }

  /* Режим прав окна: входной атрибут корня, по умолчанию правка */
  var root = scrim.querySelector('.lc-knrm');

  function modeOf() {
    return root && root.getAttribute('data-mode') === 'view' ? 'view' : 'edit';
  }

  /* ── Результаты поиска ──────────────────────────────────────────── */
  /* По вкладке: null — поиск не задан (в колонке подсказка), массив id —
     что нашлось. Убранный из участников контрагент дописывается в конец
     результатов своей вкладки, даже если под поиск он не подходит: он ушёл
     в соседнюю колонку и там должен быть виден. */
  var results = { ul: null, fl: null };

  function asFound(id) {
    var rec = store().byId(id);
    if (!rec) return null;
    var v = JSON.parse(JSON.stringify(rec));
    v.place = 'found';
    v.knr = false;
    return v;
  }

  function foundItems(kind) {
    return (results[kind] || []).filter(function (id) { return !store().isMember(id); })
      .map(asFound).filter(Boolean);
  }

  function dropResult(id) {
    ['ul', 'fl'].forEach(function (k) {
      if (!results[k]) return;
      var i = results[k].indexOf(id);
      if (i !== -1) results[k].splice(i, 1);
    });
  }

  function addResult(kind, id) {
    results[kind] = (results[kind] || []).filter(function (x) { return x !== id; });
    results[kind].push(id);
  }

  /* ── Рендер колонок ─────────────────────────────────────────────── */
  /* Колонка «Участники сделки» на обеих вкладках показывает всех участников,
     но трогать с вкладки можно только свой вид: на вкладке юрлиц физлица
     недоступны, на вкладке физлиц — юрлица (состояние Disabled у Card). */
  function fill(drop) {
    var card = window.PostCardCounterparty;
    if (!store() || !card) return;

    var kind = kindOf(drop);
    var members = isMembers(drop);
    var items = members ? store().members() : foundItems(kind);

    Array.prototype.slice.call(drop.querySelectorAll('.lc-knrm__card'))
      .forEach(function (el) { el.parentNode.removeChild(el); });

    var mode = modeOf();
    items.forEach(function (item) {
      var el = card.render(item, {
        mode: mode,
        disabled: members && item.kind !== kind,
        moveLabel: members ? 'Убрать из участников сделки' : 'Перенести в участники сделки'
      });
      if (el) drop.appendChild(el);
    });

    /* Подсказка колонки результатов: пока поиска не было — как искать,
       после пустого поиска — что ничего не нашлось. Карточки её прячут (CSS). */
    var hint = drop.querySelector('[data-knr-hint]');
    if (hint && !members) {
      if (!hint.hasAttribute('data-hint')) hint.setAttribute('data-hint', hint.textContent.trim());
      hint.textContent = results[kind] !== null && !items.length ? NOTHING_FOUND : hint.getAttribute('data-hint');
    }
  }

  var focusId = null;   /* чью кнопку переноса вернуть в фокус после перерисовки */

  function repaint() {
    /* Подсказка кнопки, которую сейчас уберёт перерисовка, иначе осталась бы
       висеть: mouseleave у удалённого узла не наступает. */
    if (window.DSTooltip) window.DSTooltip.hideAll();
    Array.prototype.slice.call(scrim.querySelectorAll('[data-knr-drop]')).forEach(fill);
    buildUlList();
    /* риск-метрики появились вместе с карточками — их рантайм собирает чип и
       поповер сам, но только по свежей разметке (подсказку кнопки переноса
       привязывает рендер карточки) */
    if (window.DSRiskMetric) window.DSRiskMetric.mount(scrim);
    if (focusId) {
      var panel = scrim.querySelector('[data-knr-panel]:not([hidden])') || scrim;
      var btn = panel.querySelector('[data-knr-card="' + focusId + '"] [data-knr-move]');
      if (btn) btn.focus();
      focusId = null;
    }
  }

  /* ── Перенос в соседнюю колонку ─────────────────────────────────── */

  function addMember(id) {
    dropResult(id);
    focusId = id;
    store().move(id, 'member');
  }

  function removeMember(id) {
    var rec = store().byId(id);
    if (!rec) return;
    addResult(rec.kind, id);
    focusId = id;
    store().move(id, 'found');
  }

  var pending = null;   /* кого убрать после подтверждения */

  /* Контрагента, отмеченного КНР, из участников молча не убирают:
     сначала окно подтверждения. */
  function moveCard(card) {
    var id = cardId(card);
    var drop = card.closest('[data-knr-drop]');
    if (!id || !drop || !store()) return;
    if (!isMembers(drop)) { addMember(id); return; }
    if (store().isKnr(id)) { askRemove(id); return; }
    removeMember(id);
  }

  scrim.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-knr-move]');
    if (!btn || !scrim.contains(btn)) return;
    var card = btn.closest('.lc-knrm__card');
    if (card) moveCard(card);
  });

  /* Двойной клик по карточке — то же, что кнопка. Не срабатывает на
     собственных элементах карточки (кнопка, чекбокс «КНР», чип метрики) и у
     карточки без права переноса. Заблокированная карточка указатель не
     принимает вовсе (Disabled у Card). Выделение, которое оставил двойной
     клик, снимается: карточка уже в другой колонке. */
  scrim.addEventListener('dblclick', function (e) {
    var card = e.target.closest('.lc-knrm__card');
    if (!card || !card.closest('[data-knr-drop]')) return;
    if (e.target.closest('button, a, input, label, [data-riskmetric]')) return;
    if (card.getAttribute('data-mode') !== 'edit' || card.getAttribute('aria-disabled') === 'true') return;
    var sel = window.getSelection && window.getSelection();
    if (sel && sel.removeAllRanges) sel.removeAllRanges();
    moveCard(card);
  });

  /* Отметка «КНР» — тоже данные: пишется в стор. Делегированно, потому что
     карточки перерисовываются. В просмотре чекбокс выключен самой карточкой;
     проверка режима здесь — страховка, чтобы стор не менялся ни при каком
     пути. */
  scrim.addEventListener('change', function (e) {
    var box = e.target.closest('.lc-knrm__knr .cb__input');
    if (!box || modeOf() === 'view') return;
    var card = box.closest('.lc-knrm__card');
    if (card && store()) store().setKnr(cardId(card), box.checked);
  });

  /* ── Подтверждение удаления КНР ─────────────────────────────────── */
  /* Подтверждение поднимается рантаймом ДС как настоящий вложенный слой.
     Исключение — окно, показанное статично внутри страницы (витрина:
     .modal-scrim--inline у подтверждения): там слой не открывают, а
     показывают и прячут атрибутом hidden, чтобы оно не вышло из демо-зоны. */
  function confirmScrim() { return document.getElementById('knr-confirm-scrim'); }

  function askRemove(id) {
    var c = confirmScrim();
    if (!c) { removeMember(id); return; }
    pending = id;
    if (isInline(c)) { c.hidden = false; return; }
    if (window.DSModal) window.DSModal.open(c);
    else { pending = null; removeMember(id); }
  }

  function closeConfirm(c, ok) {
    if (isInline(c)) { c.hidden = true; return; }
    if (window.DSModal) window.DSModal.closeTop(ok);
  }

  function bindConfirm() {
    var c = confirmScrim();
    if (!c) return;
    c.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-knr-confirm]');
      if (!btn) {
        /* крестик статичного подтверждения: слоя нет, закрываем сами */
        if (isInline(c) && e.target.closest('[data-modal-close]')) {
          pending = null;
          c.hidden = true;
        }
        return;
      }
      var ok = btn.getAttribute('data-knr-confirm') === 'ok';
      var id = pending;
      pending = null;
      if (ok && id) removeMember(id);
      closeConfirm(c, ok);
    });
  }

  /* ── Поиск ──────────────────────────────────────────────────────── */
  /* Формы — <form>: Enter в любом поле и «Найти» приходят сюда одним
     событием submit. Правила поиска — в сторе. */
  function paramsOf(form) {
    var p = {};
    Array.prototype.forEach.call(form.querySelectorAll('input[name]'), function (inp) {
      p[inp.name] = inp.value;
    });
    if (form.getAttribute('data-knr-search') === 'fl') p.parentId = flParent || '';
    return p;
  }

  scrim.addEventListener('submit', function (e) {
    var form = e.target.closest('[data-knr-search]');
    if (!form || !store()) return;
    e.preventDefault();
    var kind = form.getAttribute('data-knr-search');
    var found = store().search(kind, paramsOf(form));
    results[kind] = found ? found.map(function (r) { return r.id; }) : null;
    repaint();
  });

  /* ── «Юридическое лицо» на вкладке физлиц ───────────────────────── */
  /* Автокомплит ДС (data-ddl): открытие, клавиатуру и позицию даёт
     ds-dropdownlist.js, он же читает опции при каждом открытии. Здесь —
     опции из юрлиц-участников сделки, фильтр по введённому тексту и запись
     выбора в поле (автопривязка значение в поле не пишет). */
  var ulInput = document.getElementById('knr-fl-ul');
  var ulList = document.getElementById('knr-fl-ul-list');
  var flParent = null;

  function escHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function withMatch(label, q) {
    var i = q ? label.toLowerCase().indexOf(q.toLowerCase()) : -1;
    if (i < 0) return escHtml(label);
    return escHtml(label.slice(0, i)) + '<span class="ddl__match">' + escHtml(label.slice(i, i + q.length)) + '</span>'
      + escHtml(label.slice(i + q.length));
  }

  function buildUlList() {
    if (!ulInput || !ulList || !store()) return;
    var uls = store().members('ul');
    /* выбранное юрлицо убрали из участников — выбор сбрасывается */
    if (flParent && !uls.some(function (u) { return u.id === flParent; })) {
      flParent = null;
      ulInput.value = '';
    }
    var q = flParent ? '' : ulInput.value.trim();
    var shown = uls.filter(function (u) { return !q || u.name.toLowerCase().indexOf(q.toLowerCase()) !== -1; });
    if (!shown.length) {
      ulList.innerHTML = '<div class="ddl__state ddl__state--empty"><span>Ничего не найдено</span></div>';
      return;
    }
    ulList.innerHTML = shown.map(function (u) {
      var on = u.id === flParent;
      return '<button type="button" class="ddl__item' + (on ? ' ddl__item--selected' : '') + '" role="option"'
        + ' aria-selected="' + on + '" tabindex="-1" data-ul="' + escHtml(u.id) + '">'
        + '<span class="ddl__item-body"><span class="ddl__item-label">' + withMatch(u.name, q) + '</span></span></button>';
    }).join('');
  }

  function bindUlField() {
    if (!ulInput || !ulList) return;
    ulList.addEventListener('click', function (e) {
      var it = e.target.closest('.ddl__item[data-ul]');
      if (!it) return;
      flParent = it.getAttribute('data-ul');
      var rec = store() && store().byId(flParent);
      ulInput.value = rec ? rec.name : '';
    });
    ulInput.addEventListener('input', function () {
      flParent = null;
      buildUlList();
      var api = ulInput.closest('[data-ddl]') && ulInput.closest('[data-ddl]').__dsDdl;
      if (api) { if (!api.isOpen()) api.open(); else api.place(); }
    });
  }

  /* ── Черновик и «Сохранить» ─────────────────────────────────────── */
  /* Окно открылось — стор запоминает состав; закрылось не через «Сохранить»
     (крестик, Esc) — состав возвращается. Слушатель «Сохранить» стоит на
     скриме и срабатывает раньше глобального закрытия ds-modal.js. Окно,
     показанное статично (витрина), не открывается и не закрывается —
     черновика у него нет. */
  var saving = false;
  var wasOpen = !scrim.hidden;

  function resetSearch() {
    results = { ul: null, fl: null };
    flParent = null;
    Array.prototype.forEach.call(scrim.querySelectorAll('[data-knr-search]'), function (f) { f.reset(); });
    if (ulInput) ulInput.value = '';
  }

  function bindDraft() {
    new MutationObserver(function () {
      var open = !scrim.hidden;
      if (open === wasOpen) return;
      wasOpen = open;
      if (isInline(scrim) || !store()) return;
      if (open) {
        saving = false;
        resetSearch();
        store().begin();
        repaint();
      } else if (!saving) {
        store().rollback();
      }
    }).observe(scrim, { attributes: true, attributeFilter: ['hidden'] });

    scrim.addEventListener('click', function (e) {
      if (!e.target.closest('[data-knr-save]') || !store()) return;
      saving = true;
      store().commit();
    });
  }

  /* Смена режима — карточки рисуются заново в новом режиме. На странице
     режим ставится до открытия окна (и окно перерисовывается при открытии);
     наблюдатель нужен тому, кто переключает режим у открытого окна, — витрине. */
  function bindMode() {
    if (!root) return;
    new MutationObserver(repaint).observe(root, { attributes: true, attributeFilter: ['data-mode'] });
  }

  /* Перерисовка по событию стора: перенос, отметка КНР, откат черновика,
     загрузка состава сделки — одна дорога для всех изменений. */
  function bindStore() {
    if (!store()) return;
    store().on('change', function (d) {
      if (d && d.reason === 'use') resetSearch();
      repaint();
    });
  }

  bindTabs();
  bindConfirm();
  bindUlField();
  bindDraft();
  bindMode();
  bindStore();
  repaint();
})();
