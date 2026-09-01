/* =========================================================================
   DS Notify — рантайм уведомлений: SnackBar и Toast (out-of-box).
   Зависимости: styles/snackbar.css, styles/toast.css, styles/spinner.css,
   styles/button.css, styles/link.css; scripts/icons-data.js (window.DS_ICONS).

   Экспорт:
     window.DSSnack = { show(opts) → id, dismiss(id), dismissAll(),
                        expand(), layer(), stack() }
     window.DSToast = { show(opts) → handle, dismiss(h), clear(), stack() }

   SnackBar (правый верхний угол, слой создаётся сам при первом show):
     DSSnack.show({ tone:'info'|'warning'|'error'|'success', title, text,
                    buttons:[{label, variant, href, onClick}], dedup:true,
                    duration }) → id
     Внутри: стек новым сверху, видимых ≤ 5 и плашка «+N уведомл.» с
     «развернуть» / «закрыть все», дедупликация одинаковых (тон+заголовок+
     текст) со счётчиком ×N и перезапуском таймера, авто-скрытие 5с у снека
     без кнопок с паузой на hover/focus, Esc закрывает верхний, live-region
     по тону (error/warning — assertive).

   Toast (центр у верхней границы рабочей области):
     DSToast.show({ message, kind:'bar'|'loader', tone, lead, duration,
                    layer }) → handle { el, update(patch), dismiss() }
     Внутри: стек ≤ 3 (новый сверху, вытесняется нижний), авто-скрытие 3с у
     bar без спиннера, loader единичен, замещает бары и добавляет затемнение,
     update({tone:'success'}) меняет спиннер на иконку и уводит через 1с.
   ========================================================================= */
(function () {
  'use strict';

  var L = function () { return window.DS_ICONS || {}; };
  function iconHtml(name, size) {
    var raw = L()[name] || '';
    if (!raw) return '';
    var d = document.createElement('div');
    d.innerHTML = raw;
    var s = d.firstElementChild;
    if (!s) return '';
    s.setAttribute('width', size || 20);
    s.setAttribute('height', size || 20);
    s.setAttribute('aria-hidden', 'true');
    return s.outerHTML;
  }
  function esc(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  /* удаление по animationend с подстраховкой: если анимация выключена
     (prefers-reduced-motion, скрытая вкладка), событие не придёт */
  function leave(el, cls, done) {
    var fired = false;
    var finish = function () { if (fired) return; fired = true; done(); };
    el.classList.add(cls);
    el.addEventListener('animationend', finish, { once: true });
    setTimeout(finish, 400);
  }

  /* ===================================================================== */
  /* SnackBar                                                               */
  /* ===================================================================== */
  var SNACK_ICON = {
    info: 'Info-circle-filled', warning: 'alert-triangle-filled',
    error: 'alert-circle-filled', success: 'check-circle-filled',
  };
  var MAX_VISIBLE = 5, SNACK_AUTO = 5000;
  var stack = [], hiddenCount = 0, overflowEl = null, layerEl = null, seq = 0;

  function snackLayer() {
    if (layerEl && document.contains(layerEl)) return layerEl;
    /* страница может отдать свой контейнер (демо внутри мокапа рабочей области) */
    layerEl = document.querySelector('[data-ds-snackbar]');
    if (!layerEl) {
      layerEl = document.createElement('div');
      layerEl.className = 'snackbar-layer';
      layerEl.setAttribute('aria-label', 'Уведомления');
      layerEl.setAttribute('data-ds-snackbar', '');
      document.body.appendChild(layerEl);
    }
    return layerEl;
  }

  function startTimer(s) {
    if (s.hasButtons || s.duration === null) return;
    s.timer = setTimeout(function () { dismissSnack(s.id); }, s.duration || SNACK_AUTO);
  }
  function clearTimer(s) { if (s.timer) { clearTimeout(s.timer); s.timer = null; } }

  function updateOverflow() {
    var layer = snackLayer();
    if (hiddenCount > 0) {
      if (!overflowEl) {
        overflowEl = document.createElement('div');
        overflowEl.className = 'snack-more';
        overflowEl.innerHTML = 'Ещё <span class="snack-more__count">0</span> уведомл.'
          + '<div class="snack-more__actions">'
          + '<button type="button" class="snack-more__btn" aria-label="Развернуть">' + iconHtml('chevron-down', 16) + '</button>'
          + '<button type="button" class="snack-more__btn" aria-label="Закрыть все">' + iconHtml('close', 16) + '</button>'
          + '</div>';
        var btns = overflowEl.querySelectorAll('.snack-more__btn');
        btns[0].addEventListener('click', expand);
        btns[1].addEventListener('click', dismissAll);
        layer.appendChild(overflowEl);
      }
      overflowEl.querySelector('.snack-more__count').textContent = hiddenCount;
    } else if (overflowEl) { overflowEl.remove(); overflowEl = null; }
  }

  function expand() {
    stack.forEach(function (s) { if (s.hidden) { s.el.style.display = ''; s.hidden = false; } });
    hiddenCount = 0;
    updateOverflow();
  }

  function dismissSnack(id) {
    var idx = stack.findIndex(function (s) { return s.id === id; });
    if (idx < 0) return;
    var s = stack[idx];
    if (s.leaving) return;
    /* помечаем синхронно: пока снек доигрывает уход, он не должен считаться
       видимым — иначе следующий показ прячет лишний под плашку «+N» */
    s.leaving = true;
    clearTimer(s);
    leave(s.el, 'snack--leave', function () {
      s.el.remove();
      var i = stack.indexOf(s);
      if (i >= 0) stack.splice(i, 1);
      /* освободилось место — поднимаем самый свежий из спрятанных */
      if (hiddenCount > 0) {
        var nxt = stack.find(function (x) { return x.hidden && !x.leaving; });
        if (nxt) { nxt.el.style.display = ''; nxt.hidden = false; hiddenCount--; }
      }
      updateOverflow();
    });
  }

  function dismissAll() {
    stack.map(function (s) { return s.id; }).forEach(dismissSnack);
    hiddenCount = 0;
    if (overflowEl) { overflowEl.remove(); overflowEl = null; }
  }

  function buttonsHtml(tone, buttons) {
    if (!buttons || !buttons.length) return '';
    var html = buttons.map(function (b, i) {
      if (b.href != null) return '<a class="link link--' + tone + '" href="' + esc(b.href) + '">' + esc(b.label) + '</a>';
      var variant = b.variant || (i === 0 ? 'outline' : 'transparent');
      return '<button type="button" class="btn btn--' + variant + ' btn--xs btn--' + tone + '">'
        + '<span class="btn__label">' + esc(b.label) + '</span></button>';
    }).join('');
    return '<div class="snack__buttons">' + html + '</div>';
  }

  function makeSnackEl(o) {
    var tone = o.tone;
    var loud = tone === 'error' || tone === 'warning';
    var el = document.createElement('div');
    el.className = 'snack snack--' + tone;
    el.setAttribute('data-snack-tone', tone);
    el.setAttribute('role', loud ? 'alert' : 'status');
    el.setAttribute('aria-live', loud ? 'assertive' : 'polite');
    el.innerHTML =
      '<span class="snack__icon" aria-hidden="true">' + iconHtml(SNACK_ICON[tone], 20) + '</span>'
      + '<div class="snack__body"><div class="snack__title">' + esc(o.title) + '</div>'
      + (o.text ? '<div class="snack__text">' + esc(o.text) + '</div>' : '')
      + buttonsHtml(tone, o.buttons) + '</div>'
      + '<button type="button" class="snack__close" aria-label="Закрыть">' + iconHtml('close', 16) + '</button>';
    return el;
  }

  function showSnack(o) {
    o = o || {};
    var tone = o.tone || 'info';
    var title = o.title || '';
    var text = o.text || '';
    var buttons = o.buttons || null;
    var hasButtons = !!(buttons && buttons.length);
    var key = tone + '|' + title + '|' + text;

    if (o.dedup !== false) {
      var ex = stack.find(function (s) { return s.key === key && !s.leaving; });
      if (ex) {
        ex.count++;
        var d = ex.el.querySelector('.snack__dupe');
        if (d) d.textContent = '\u00d7' + ex.count;
        else {
          var t = ex.el.querySelector('.snack__title');
          if (t) t.insertAdjacentHTML('beforeend', '<span class="snack__dupe">\u00d7' + ex.count + '</span>');
        }
        clearTimer(ex); startTimer(ex);
        return ex.id;
      }
    }

    /* лимит видимых: самый старый уходит под плашку «+N», а не удаляется */
    var visible = stack.filter(function (s) { return !s.hidden && !s.leaving; });
    if (visible.length >= MAX_VISIBLE) {
      var oldest = visible[visible.length - 1];
      if (oldest) { oldest.el.style.display = 'none'; oldest.hidden = true; hiddenCount++; }
    }

    var id = 'snack-' + (++seq);
    var el = makeSnackEl({ tone: tone, title: title, text: text, buttons: buttons });
    var s = {
      id: id, el: el, key: key, tone: tone, hasButtons: hasButtons,
      timer: null, count: 1, hidden: false, duration: o.duration,
    };
    el.querySelector('.snack__close').addEventListener('click', function () { dismissSnack(id); });
    if (buttons) {
      el.querySelectorAll('.snack__buttons .btn, .snack__buttons .link').forEach(function (node, i) {
        var b = buttons[i];
        node.addEventListener('click', function (e) {
          if (b && b.onClick) { e.preventDefault(); b.onClick(id, e); }
          if (b && b.dismiss !== false && b.onClick) dismissSnack(id);
        });
      });
    }
    /* таймер живёт, пока снек не под курсором и не в фокусе */
    el.addEventListener('mouseenter', function () { clearTimer(s); });
    el.addEventListener('mouseleave', function () { startTimer(s); });
    el.addEventListener('focusin', function () { clearTimer(s); });
    el.addEventListener('focusout', function () { startTimer(s); });

    stack.unshift(s);
    snackLayer().prepend(el);
    updateOverflow();
    startTimer(s);
    return id;
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && stack.length) dismissSnack(stack[0].id);
  });

  window.DSSnack = {
    show: showSnack, dismiss: dismissSnack, dismissAll: dismissAll,
    expand: expand, layer: snackLayer, stack: function () { return stack.slice(); },
  };

  /* ===================================================================== */
  /* Toast                                                                  */
  /* ===================================================================== */
  var TOAST_ICON = { success: 'check-circle', error: 'alert-circle', info: 'info-circle', neutral: null };
  var TOAST_MAX = 3, TOAST_AUTO = 3000, TOAST_RESULT_HOLD = 1000;
  var bars = [], loaderItem = null, scrimEl = null;

  function toastLayer(kind, host) {
    var root = host || document.body;
    var cls = kind === 'loader' ? 'toast-layer--loader' : 'toast-layer--bar';
    /* уже размеченный слой страницы имеет приоритет над создаваемым */
    var found = root.querySelector('.toast-layer.' + cls + '[data-ds-toast]')
      || root.querySelector('.toast-layer.' + cls);
    if (found) return found.querySelector('.toast-stack') || found;
    var lay = document.createElement('div');
    lay.className = 'toast-layer ' + cls;
    lay.setAttribute('data-ds-toast', '');
    var st = document.createElement('div');
    st.className = 'toast-stack';
    lay.appendChild(st);
    root.appendChild(lay);
    return st;
  }

  function makeToastEl(o) {
    var kind = o.kind || 'bar', tone = o.tone || 'neutral';
    var lead = o.lead || (kind === 'loader' ? 'spinner' : (TOAST_ICON[tone] ? 'icon' : 'none'));
    var el = document.createElement('div');
    el.className = 'toast';
    if (tone !== 'neutral') el.classList.add('toast--' + tone);
    var loud = tone === 'error' || (kind === 'loader' && tone === 'neutral');
    el.setAttribute('role', loud ? 'alert' : 'status');
    el.setAttribute('aria-live', loud ? 'assertive' : 'polite');
    if (lead !== 'none') {
      var slot = document.createElement('span');
      slot.className = 'toast__lead';
      if (lead === 'spinner') {
        slot.innerHTML = '<span class="spin spin--current" aria-hidden="true"></span>';
      } else {
        slot.innerHTML = '<span class="toast__icon" aria-hidden="true">'
          + (L()[TOAST_ICON[tone] || 'info-circle'] || '') + '</span>';
      }
      el.appendChild(slot);
    }
    var msg = document.createElement('span');
    msg.className = 'toast__msg';
    msg.textContent = o.message || '';
    el.appendChild(msg);
    return el;
  }

  function setScrim(on, host) {
    if (on) {
      if (scrimEl && document.contains(scrimEl)) return;
      scrimEl = document.createElement('div');
      scrimEl.className = 'toast-scrim';
      (host || document.body).appendChild(scrimEl);
    } else if (scrimEl) { scrimEl.remove(); scrimEl = null; }
  }

  function dismissToast(h) {
    if (!h || h.gone) return;
    h.gone = true;
    if (h.timer) clearTimeout(h.timer);
    /* из стека тост выбывает сразу, из DOM — когда доиграет уход: иначе при
       быстрых показах вытеснялся бы уже уходящий, а лишний оставался бы висеть */
    var i = bars.indexOf(h);
    if (i >= 0) bars.splice(i, 1);
    if (loaderItem === h) { loaderItem = null; setScrim(false, h.host); }
    leave(h.el, 'toast--leave', function () { h.el.remove(); });
  }

  function armToast(h) {
    if (h.duration === null) return;              /* ждём события извне */
    if (h.kind === 'loader' || h.lead === 'spinner') return;
    h.timer = setTimeout(function () { dismissToast(h); }, h.duration || TOAST_AUTO);
  }

  function showToast(o) {
    o = o || {};
    var kind = o.kind || 'bar';
    var host = o.layer || null;
    var el = makeToastEl(o);
    el.classList.add('toast--enter');
    var h = {
      el: el, kind: kind, tone: o.tone || 'neutral',
      lead: o.lead || (kind === 'loader' ? 'spinner' : (TOAST_ICON[o.tone] ? 'icon' : 'none')),
      duration: o.duration, host: host, timer: null, gone: false,
    };

    if (kind === 'loader') {
      /* блокирующий тост единичен и замещает собой весь ToastBar */
      bars.slice().forEach(dismissToast);
      if (loaderItem) dismissToast(loaderItem);
      loaderItem = h;
      setScrim(true, host);
      toastLayer('loader', host).appendChild(el);
    } else {
      toastLayer('bar', host).prepend(el);
      bars.unshift(h);
      while (bars.length > TOAST_MAX) dismissToast(bars[bars.length - 1]);
    }
    armToast(h);

    h.update = function (patch) {
      patch = patch || {};
      if (patch.message != null) h.el.querySelector('.toast__msg').textContent = patch.message;
      if (patch.tone) {
        h.el.classList.remove('toast--success', 'toast--error', 'toast--info');
        if (patch.tone !== 'neutral') h.el.classList.add('toast--' + patch.tone);
        h.tone = patch.tone;
        /* результат пришёл: спиннер заменяется иконкой, тост держится ~1с */
        var slot = h.el.querySelector('.toast__lead');
        if (slot && TOAST_ICON[patch.tone]) {
          slot.innerHTML = '<span class="toast__icon" aria-hidden="true">' + (L()[TOAST_ICON[patch.tone]] || '') + '</span>';
          h.lead = 'icon';
        }
        h.el.setAttribute('role', patch.tone === 'error' ? 'alert' : 'status');
        if (patch.duration !== null) {
          if (h.timer) clearTimeout(h.timer);
          h.timer = setTimeout(function () { dismissToast(h); }, patch.duration || TOAST_RESULT_HOLD);
        }
      }
      return h;
    };
    h.dismiss = function () { dismissToast(h); return h; };
    return h;
  }

  window.DSToast = {
    show: showToast,
    make: makeToastEl,
    dismiss: dismissToast,
    clear: function () { bars.slice().forEach(dismissToast); if (loaderItem) dismissToast(loaderItem); },
    stack: function () { return bars.slice(); },
  };
})();
