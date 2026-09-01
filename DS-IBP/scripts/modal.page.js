/* =========================================================================
   Modal — страница ДС: конструктор, редлайн, вспомогательные демо.
   ========================================================================= */

/* ---------- содержимое тела модалки: варианты для конструктора и демо ---------- */
const MODAL_CONTENT = {
  form() {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex; flex-direction:column; gap:16px;';
    wrap.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:8px;">
        <label class="ds-label"><span class="ds-label__text">Название сделки</span></label>
        <div class="mock-input">1-Кредит-199</div>
      </div>
      <div style="display:flex; flex-direction:column; gap:8px;">
        <label class="ds-label"><span class="ds-label__text">Сумма, RUB</span></label>
        <div class="mock-input">2 500 000 000,00</div>
        <span class="ds-helper ds-helper--left">Указывается с учётом НДС</span>
      </div>
      <label class="cb cb--selected" style="align-items:flex-start;">
        <input type="checkbox" class="cb__input" checked>
        <span class="cb__box"><span class="cb__mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span></span>
        <span class="cb__content"><span class="cb__label">Уведомить заёмщика о создании сделки</span></span>
      </label>`;
    return wrap;
  },
  error() {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex; flex-direction:column; gap:16px;';
    wrap.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:8px;">
        <label class="ds-label"><span class="ds-label__text">Название сделки</span></label>
        <div class="mock-input">1-Кредит-199</div>
      </div>
      <div style="display:flex; flex-direction:column; gap:8px;">
        <label class="ds-label"><span class="ds-label__text">ИНН контрагента</span></label>
        <div class="mock-input mock-input--error" aria-invalid="true">77012345</div>
        <span class="ds-helper ds-helper--left ds-helper--error ds-helper--with-icon" role="alert">
          <span class="ds-helper__icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg></span>
          <span class="ds-helper__text">Нужно 10 или 12 цифр</span>
        </span>
      </div>`;
    return wrap;
  },
  empty() {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; padding:24px 0; text-align:center; color:var(--text-inactive);';
    wrap.innerHTML = `
      <span style="width:48px; height:48px; display:flex; align-items:center; justify-content:center; border-radius:50%; background:var(--tertiary-light);"><i data-icon="folder-close-x" style="width:24px;height:24px;color:var(--text-inactive);"></i></span>
      <p style="margin:0; font:var(--type-body-m-strong); color:var(--text-secondary);">Пока ничего нет</p>
      <p style="margin:0; font:var(--type-body-s); max-width:32ch;">Добавьте первую запись, чтобы она появилась здесь</p>`;
    return wrap;
  },
  table() {
    const wrap = document.createElement('div');
    wrap.className = 'mtable';
    wrap.style.cssText = 'border:1px solid var(--border-light); border-radius:12px; overflow:hidden;';
    const rows = [['Выдача','01.02.2026','120 000 000'],['Погашение','01.03.2026','12 500 000'],['Погашение','01.04.2026','12 500 000']];
    wrap.innerHTML = `
      <div style="display:grid; grid-template-columns:1.2fr 1fr 1fr; padding:11px 16px; background:var(--tertiary-light); font:var(--type-body-s-strong); color:var(--text-secondary);">
        <span>Операция</span><span>Дата</span><span style="text-align:right;">Сумма</span>
      </div>
      ${rows.map(r=>`<div style="display:grid; grid-template-columns:1.2fr 1fr 1fr; padding:12px 16px; border-top:1px solid var(--border-light); font:var(--type-body-m); color:var(--text-primary);">
        <span>${r[0]}</span><span style="color:var(--text-secondary);">${r[1]}</span><span style="text-align:right; font-variant-numeric:tabular-nums;">${r[2]}</span>
      </div>`).join('')}`;
    return wrap;
  },
  scroll() {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex; flex-direction:column; gap:16px;';
    for (let i = 1; i <= 12; i++) {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex; flex-direction:column; gap:6px; padding-bottom:16px; border-bottom:1px solid var(--border-light);';
      row.innerHTML = `<span style="font:var(--type-body-m-strong); color:var(--text-primary);">Пункт ${i}</span><span style="font:var(--type-body-s); color:var(--text-secondary);">Пояснение к пункту, чтобы контент занимал больше одной строки и требовал прокрутки.</span>`;
      wrap.appendChild(row);
    }
    return wrap;
  },
  skeleton() {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex; flex-direction:column; gap:16px;';
    for (let i = 0; i < 3; i++) {
      const row = document.createElement('div');
      row.className = 'sk-group';
      row.innerHTML = `<span class="sk-line sk-line--title" style="--sk-w:30%;"></span><span class="sk-line" style="--sk-w:100%;"></span>`;
      wrap.appendChild(row);
    }
    return wrap;
  },
};

/* ---------- сборка модалки: голова + тело + подвал ---------- */
function buildModal(o = {}) {
  const {
    width = 6, title = 'Новая сделка',
    footLeft = 'none', footRight = 'primary',
    content = 'form', inline = false, saving = false, alert = 'none',
  } = o;

  const scrim = document.createElement('div');
  scrim.className = 'modal-scrim' + (inline ? ' modal-scrim--inline' : '');

  const modal = document.createElement('div');
  modal.className = 'modal modal--w' + width + (saving ? ' modal--saving' : '');
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  const titleId = 'modal-title-' + Math.random().toString(36).slice(2, 8);
  modal.setAttribute('aria-labelledby', titleId);

  const head = document.createElement('div');
  head.className = 'modal__head';
  head.innerHTML = `<h2 class="modal__title" id="${titleId}">${title}</h2>
    <span class="modal__close"><button type="button" class="ibtn ibtn--neutral ibtn--l" aria-label="Закрыть"><i data-icon="close"></i></button></span>`;

  /* необязательная зона между шапкой и телом — Alert уровня всей модалки */
  const alertZone = alert === 'none' ? null : buildModalAlert(alert);

  const body = document.createElement('div');
  body.className = 'modal__body';
  body.appendChild(MODAL_CONTENT[content] ? MODAL_CONTENT[content]() : MODAL_CONTENT.form());

  const foot = document.createElement('div');
  foot.className = 'modal__foot';
  const left = document.createElement('div'); left.className = 'modal__foot-left';
  if (footLeft === 'edit' || footLeft === 'both') left.innerHTML += `<button type="button" class="btn btn--transparent btn--s"><i data-icon="edit"></i><span class="btn__label">Изменить</span></button>`;
  if (footLeft === 'delete' || footLeft === 'both') left.innerHTML += `<button type="button" class="btn btn--transparent btn--s"><i data-icon="trash"></i><span class="btn__label">Удалить</span></button>`;
  const right = document.createElement('div'); right.className = 'modal__foot-right';
  if (footRight === 'both') right.innerHTML += `<button type="button" class="btn btn--transparent btn--m"><span class="btn__label">Очистить фильтр</span></button>`;
  right.innerHTML += saving
    ? `<button type="button" class="btn btn--accent btn--m btn--loading" disabled aria-busy="true"><span class="spin spin--current"></span><span class="btn__label">Сохранить</span></button>`
    : `<button type="button" class="btn btn--accent btn--m"><span class="btn__label">Сохранить</span></button>`;
  foot.appendChild(left); foot.appendChild(right);

  modal.appendChild(head);
  if (alertZone) modal.appendChild(alertZone);
  modal.appendChild(body);
  modal.appendChild(foot);
  scrim.appendChild(modal);

  /* тени шапки и подвала при прокрутке тела — рантайм ДС (scripts/ds-modal.js) */
  window.DSModal && DSModal.wireScroll(modal);

  window.dsIcons && window.dsIcons.apply(scrim);
  return { scrim, modal, head, body, foot, syncScrollShadow: modal.__dsModalSyncShadow || function () {} };
}

/* ---------- Alert между шапкой и телом (ошибка отправки / предупреждение) ---------- */
const MODAL_ALERT = {
  error: { tone: 'error', icon: 'alert-circle-filled', title: 'Не удалось сохранить сделку', text: 'Сервис лимитов недоступен. Попробуйте сохранить ещё раз через минуту.' },
  warning: { tone: 'warning', icon: 'alert-triangle-filled', title: 'Данные контрагента устарели', text: 'Последняя проверка — 12.05.2026. Значения полей могли измениться.' },
};
function buildModalAlert(kind) {
  const cfg = MODAL_ALERT[kind] || MODAL_ALERT.error;
  const zone = document.createElement('div');
  zone.className = 'modal__alert';
  zone.innerHTML = `<div class="alert alert--${cfg.tone} alert--m alert--flush" data-alert-tone="${cfg.tone}" role="alert">
    <span class="alert__icon" aria-hidden="true"><i data-icon="${cfg.icon}"></i></span>
    <div class="alert__body">
      <p class="alert__title">${cfg.title}</p>
      <p class="alert__text">${cfg.text}</p>
    </div>
  </div>`;
  return zone;
}

/* ---------- диалог подтверждения удаления (вложенный поверх модалки) ---------- */
function buildDangerDialog(onCancel) {
  const scrim = document.createElement('div');
  scrim.className = 'modal-scrim modal-scrim--inline modal-scrim--nested';
  const modal = document.createElement('div');
  modal.className = 'modal modal--w3';
  modal.setAttribute('role', 'alertdialog');
  modal.setAttribute('aria-modal', 'true');
  modal.innerHTML = `
    <div class="modal__head">
      <h2 class="modal__title">Удаление сделки</h2>
      <span class="modal__close"><button type="button" class="ibtn ibtn--neutral ibtn--l" aria-label="Закрыть"><i data-icon="close"></i></button></span>
    </div>
    <div class="modal__body">
      <p style="margin:0;">Сделка «1-Кредит-199» будет удалена без возможности восстановления.</p>
    </div>
    <div class="modal__foot">
      <div class="modal__foot-left"></div>
      <div class="modal__foot-right">
        <button type="button" class="btn btn--outline btn--m"><span class="btn__label">Отмена</span></button>
        <button type="button" class="btn btn--accent btn--m btn--danger"><span class="btn__label">Удалить</span></button>
      </div>
    </div>`;
  scrim.appendChild(modal);
  scrim.querySelectorAll('.modal__close button, .btn--outline').forEach(b => b.addEventListener('click', () => { scrim.remove(); onCancel && onCancel(); }));
  window.dsIcons && window.dsIcons.apply(scrim);
  return scrim;
}

/* ========================================================================= */
document.addEventListener('DOMContentLoaded', () => {

  /* ---------------- КОНСТРУКТОР ---------------- */
  (function () {
    const controls = document.getElementById('pg-controls');
    const stage = document.getElementById('pg-stage');
    if (!controls || !stage) return;
    const state = { width: '6', footLeft: 'none', footRight: 'primary', content: 'form', mode: 'default', alert: 'none' };

    function ctl(labelText, options, get, set) {
      const wrap = document.createElement('div'); wrap.className = 'ctl';
      const l = document.createElement('div'); l.className = 'lbl'; l.textContent = labelText; wrap.appendChild(l);
      const box = document.createElement('div'); box.className = 'pg-select';
      const sel = document.createElement('select');
      options.forEach(([v, t]) => { const o = document.createElement('option'); o.value = v; o.textContent = t; if (v === get()) o.selected = true; sel.appendChild(o); });
      sel.addEventListener('change', () => { set(sel.value); render(); });
      box.appendChild(sel); wrap.appendChild(box);
      return wrap;
    }

    controls.appendChild(ctl('Ширина · колонок', [
      ['2','2 · 289px'],['3','3 · 442px'],['4','4 · 595px'],['5','5 · 747px'],
      ['6','6 · 900px'],['7','7 · 1053px'],['8','8 · 1205px'],['9','9 · 1358px'],
      ['10','10 · 1511px'],['11','11 · 1663px'],['12','12 · 1816px'],
    ], () => state.width, v => state.width = v));

    controls.appendChild(ctl('Подвал · слева', [
      ['none','Нет'],['edit','Изменить'],['delete','Удалить'],['both','Оба'],
    ], () => state.footLeft, v => state.footLeft = v));

    controls.appendChild(ctl('Подвал · справа', [
      ['primary','Только Primary'],['both','Secondary + Primary'],
    ], () => state.footRight, v => state.footRight = v));

    controls.appendChild(ctl('Контент', [
      ['form','Форма'],['table','Таблица'],['empty','Пустое состояние'],
      ['scroll','Длинный скролл'],['skeleton','Загрузка (скелетон)'],['error','Ошибка валидации'],
    ], () => state.content, v => state.content = v));

    controls.appendChild(ctl('Алерт над контентом', [
      ['none','Нет'],['error','Ошибка'],['warning','Предупреждение'],
    ], () => state.alert, v => state.alert = v));

    controls.appendChild(ctl('Состояние', [
      ['default','По умолчанию'],['scrolled','Прокручен'],['saving','Сохранение'],['nested','Вложенный диалог'],
    ], () => state.mode, v => state.mode = v));

    function render() {
      stage.innerHTML = '';
      const { scrim, modal, body, syncScrollShadow } = buildModal({
        width: state.width, footLeft: state.footLeft, footRight: state.footRight,
        content: state.mode === 'scrolled' ? 'scroll' : state.content,
        inline: true, saving: state.mode === 'saving', alert: state.alert,
      });
      stage.appendChild(scrim);
      if (state.mode === 'scrolled') { body.scrollTop = 40; syncScrollShadow(); }
      if (state.mode === 'nested') {
        const dialog = buildDangerDialog();
        stage.appendChild(dialog);
      }
    }
    render();
  })();

  /* ---------------- АНАТОМИЯ ---------------- */
  (function () {
    const host = document.getElementById('anat-stage');
    if (!host) return;
    const { scrim, modal } = buildModal({ width: 5, footLeft: 'both', footRight: 'both', content: 'form', inline: true });
    modal.style.width = '100%'; // витрина показывает структуру, не буквальный шаг ширины
    modal.style.maxWidth = '440px';
    host.appendChild(scrim);
  })();

  /* ---------------- ИСПОЛЬЗОВАНИЕ — комбинации подвала ---------------- */
  (function () {
    const host = document.getElementById('use-foot-combos');
    if (!host) return;
    [
      { footLeft: 'none',   footRight: 'primary', caption: 'Только Primary — форма без вторичного действия и без режима редактирования' },
      { footLeft: 'none',   footRight: 'both',     caption: 'Secondary + Primary — есть альтернативное действие (например «Очистить фильтр»)' },
      { footLeft: 'edit',   footRight: 'primary',  caption: 'Изменить слева — форма открыта в режиме просмотра' },
      { footLeft: 'delete', footRight: 'primary',  caption: 'Удалить слева — форма открыта в режиме редактирования существующей сущности' },
    ].forEach(cfg => {
      const card = document.createElement('div');
      card.className = 'use-block';
      const stageEl = document.createElement('div'); stageEl.className = 'use-block__stage';
      stageEl.style.cssText = 'padding:0; display:flex; align-items:center; justify-content:center; min-height:120px;';
      const { modal } = buildModal({ width: 6, footLeft: cfg.footLeft, footRight: cfg.footRight, content: 'form', inline: true });
      modal.style.cssText += 'box-shadow:0 1px 2px rgba(40,50,55,.12); max-height:none;';
      // показываем только подвал в этой витрине
      const foot = modal.querySelector('.modal__foot');
      const wrap = document.createElement('div'); wrap.style.cssText = 'width:100%; border:1px solid var(--border-light); border-radius:12px; overflow:hidden; background:var(--bg-tile);';
      wrap.appendChild(foot);
      stageEl.appendChild(wrap);
      const cap = document.createElement('div'); cap.className = 'use-block__cap'; cap.textContent = cfg.caption;
      card.appendChild(stageEl); card.appendChild(cap);
      host.appendChild(card);
    });
    window.dsIcons && window.dsIcons.apply(host);
  })();

  /* ---------------- СОСТОЯНИЯ: закрытие / guarded / saving / skeleton / error / scroll / nested ---------------- */
  (function () {
    const host = document.getElementById('states-demo');
    if (!host) return;
    const items = [
      { label: 'Загрузка контента', opts: { content: 'skeleton' } },
      { label: 'Сохранение (форма заблокирована)', opts: { content: 'form', saving: true } },
      { label: 'Ошибка валидации — Helper поля', opts: { content: 'error' } },
      { label: 'Ошибка уровня модалки — Alert между шапкой и телом', opts: { content: 'form', alert: 'error' } },
      { label: 'Прокрутка — тень у шапки/подвала', opts: { content: 'scroll' }, scrolled: true, clamp: true },
    ];
    items.forEach(it => {
      const cell = document.createElement('div'); cell.className = 'state-cell';
      const cap = document.createElement('div'); cap.className = 'state-cap'; cap.textContent = it.label; cell.appendChild(cap);
      const box = document.createElement('div'); box.style.cssText = 'width:100%;';
      /* витрина — реальный шаг ширины 3 (442px), по две модалки в ряд; высота по контенту,
         кроме примера с прокруткой, где потолок задан искусственно */
      const { scrim, modal, body, syncScrollShadow } = buildModal({ width: 3, ...it.opts, inline: true });
      modal.style.cssText += 'max-width:100%; max-height:' + (it.clamp ? '380px' : 'none') + '; box-shadow:0 1px 2px rgba(40,50,55,.12); position:relative;';
      scrim.style.cssText = 'position:static; background:transparent; padding:0; display:block;';
      if (it.scrolled) { requestAnimationFrame(() => { body.scrollTop = 30; syncScrollShadow(); }); }
      box.appendChild(scrim); cell.appendChild(box); host.appendChild(cell);
    });
  })();

  /* ---------------- ВАРИАНТЫ: алерт между шапкой и телом ---------------- */
  (function () {
    const host = document.getElementById('alert-demo');
    if (!host) return;
    host.className = 'alert-demo';
    [
      { alert: 'error', cap: 'Ошибка уровня модалки — не привязана к конкретному полю, форма остаётся открытой' },
      { alert: 'warning', cap: 'Предупреждение — отправить можно, но данные требуют внимания' },
    ].forEach(cfg => {
      const cell = document.createElement('div'); cell.className = 'alert-demo__cell';
      const cap = document.createElement('div'); cap.className = 'state-cap'; cap.textContent = cfg.cap;
      const stageEl = document.createElement('div'); stageEl.className = 'alert-demo__stage';
      const { scrim, modal } = buildModal({ width: 3, content: 'form', alert: cfg.alert, inline: true });
      modal.style.cssText += 'max-width:100%; max-height:none; box-shadow:0 1px 2px rgba(40,50,55,.12); position:relative;';
      scrim.style.cssText = 'position:static; background:transparent; padding:0; display:block; width:100%;';
      stageEl.appendChild(scrim);
      cell.appendChild(cap); cell.appendChild(stageEl); host.appendChild(cell);
    });
  })();

  /* ---------------- ДИАЛОГ ПОДТВЕРЖДЕНИЯ (удаление) — отдельная витрина ---------------- */
  (function () {
    const host = document.getElementById('danger-demo');
    if (!host) return;
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'btn btn--outline btn--m';
    btn.innerHTML = '<span class="btn__label">Показать диалог удаления</span>';
    const stageBox = document.createElement('div');
    stageBox.style.cssText = 'position:relative; min-height:260px; width:100%; border:1px solid var(--border-light); border-radius:14px; background:var(--tertiary-light); display:flex; align-items:center; justify-content:center;';
    btn.addEventListener('click', () => {
      stageBox.querySelectorAll('.modal-scrim').forEach(n => n.remove());
      const dialog = buildDangerDialog();
      dialog.style.position = 'absolute';
      stageBox.appendChild(dialog);
    });
    host.appendChild(btn); host.appendChild(stageBox);
  })();

  /* ---------------- ЦВЕТА ---------------- */
  (function () {
    const root = document.getElementById('color-ref');
    if (!root) return;
    const groups = [
      { name: 'Поверхность', rows: [
        ['Фон модалки', '--bg-popup'], ['Скрим', '--modal-scrim'],
        ['Разделитель шапка/подвал', '--border-light'], ['Тень', '--shadow-modal-form (--elevation, не color)'],
      ]},
      { name: 'Типографика', rows: [
        ['Заголовок', '--text-primary'], ['Текст контента', '--text-primary'],
      ]},
      { name: 'Скелетон-загрузка', rows: [
        ['База', '--st-disabled-light'], ['Пик волны', '--st-disabled-midlight'],
      ]},
      { name: 'Диалог подтверждения', rows: [
        ['Primary · Danger фон', '--error'], ['Hover', '--error-dark'], ['Active', '--error-light'],
      ]},
    ];
    root.innerHTML = groups.map(g => `
      <section class="cref-group">
        <h3>${g.name}</h3>
        <div class="cref-rows">
          ${g.rows.map(([role, tok]) => `
            <div class="cref-row">
              <div class="cref-sw"><div class="cf" style="background:var(${tok.split(' ')[0]});"></div></div>
              <div class="cref-meta"><p class="role">${role}</p><p class="tname">${tok}</p></div>
            </div>`).join('')}
        </div>
      </section>`).join('');
  })();

  /* ---------------- DEV: redline измерено на живом экземпляре ---------------- */
  (function () {
    const tbody = document.querySelector('#dev-spec-table');
    if (!tbody) return;
    const host = document.createElement('div');
    host.style.cssText = 'position:absolute; left:-9999px; top:0;';
    document.body.appendChild(host);
    const { scrim, modal, head, body, foot } = buildModal({ width: 6, footLeft: 'both', footRight: 'both', content: 'form', inline: true });
    scrim.style.cssText = 'position:static;';
    host.appendChild(scrim);
    const csModal = getComputedStyle(modal), csHead = getComputedStyle(head), csBody = getComputedStyle(body), csFoot = getComputedStyle(foot);
    const r = n => Math.round(parseFloat(n) * 10) / 10;
    const rows = [
      ['Радиус модалки', r(csModal.borderTopLeftRadius) + ' px'],
      ['Максимальная высота', csModal.maxHeight === 'none' ? '80% вьюпорта' : '80% вьюпорта (' + r(csModal.maxHeight) + ' px при текущем экране)'],
      ['Шапка: паддинги (верх / право / низ / лево)', [csHead.paddingTop, csHead.paddingRight, csHead.paddingBottom, csHead.paddingLeft].map(r).join(' / ') + ' px'],
      ['Шапка: высота строки «заголовок + крестик»', r(csHead.minHeight) + ' px'],
      ['Шапка: зазор заголовок ↔ крестик', r(csHead.columnGap) + ' px'],
      ['Тело: паддинги (верх / бок / низ)', [csBody.paddingTop, csBody.paddingLeft, csBody.paddingBottom].map(r).join(' / ') + ' px'],
      ['Тело: зазор между вложенными компонентами', r(csBody.rowGap) + ' px'],
      ['Подвал: паддинги (Y / X)', r(csFoot.paddingTop) + ' / ' + r(csFoot.paddingLeft) + ' px'],
      ['Зазор в подвале между кнопками', r(getComputedStyle(foot.querySelector('.modal__foot-right')).columnGap) + ' px'],
      ['Толщина разделителя шапка/подвал', r(csHead.borderBottomWidth) + ' px'],
    ].filter(r => r[1] !== '');
    // типографика заголовка отдельным запросом (querySelector недоступен на csHead)
    const csTitle = getComputedStyle(head.querySelector('.modal__title'));
    rows.push(['Типографика заголовка (кегль / интерлиньяж)', r(csTitle.fontSize) + ' / ' + r(csTitle.lineHeight) + ' px']);
    host.remove();
    tbody.innerHTML = rows.map(([k, v]) => `<div class="tbl__row" style="grid-template-columns:8px 1.84fr 0.81fr 8px;"><div class="tc tc--separator"></div><div class="tc"><span class="tc__row"><span class="tc__text">${k}</span></span></div><div class="tc tc--numbers"><span class="tc__row"><span class="tc__text">${v}</span></span></div><div class="tc tc--separator"></div></div>`).join('');
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
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); } catch (e2) {}
        ta.remove();
      }
      btn.classList.add('is-copied');
      const prev = label.textContent;
      label.textContent = 'Скопировано';
      setTimeout(() => { btn.classList.remove('is-copied'); label.textContent = prev; }, 1600);
    });
  });
});
