/* ds-copy.js — общий рантайм копирования в буфер обмена (out-of-box, RulesAudit Фаза 3).
   window.DSCopy = {
     write(text) → Promise   — clipboard API с фолбэком через execCommand
     flash(anchor, text, ms) — короткая всплывающая подсказка над anchor (по умолчанию 1300мс)
   }
   Не навешивает собственных слушателей на разметку — компонент сам решает, когда
   вызвать write()/flash() (иконка ReadOnlyField меняет глиф на галочку на время
   подсказки, это визуальное поведение остаётся за компонентом). */
(function () {
  function fallback(text) {
    var ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    ta.remove();
  }
  function write(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(function () { fallback(text); });
    }
    fallback(text);
    return Promise.resolve();
  }
  function flash(anchor, text, ms) {
    ms = ms || 1300;
    var tip = document.createElement('span');
    tip.className = 'tip tip--main tip--top tip--center tip--floating';
    tip.style.position = 'fixed'; tip.style.pointerEvents = 'none'; tip.style.zIndex = '1000';
    tip.appendChild(document.createTextNode(text));
    var arrow = document.createElement('span'); arrow.className = 'tip__arrow'; tip.appendChild(arrow);
    document.body.appendChild(tip);
    var r = anchor.getBoundingClientRect();
    var tw = tip.offsetWidth, th = tip.offsetHeight;
    var left = Math.max(8, Math.min(r.left + r.width / 2 - tw / 2, window.innerWidth - tw - 8));
    var top = Math.max(8, r.top - th - 8);
    tip.style.left = Math.round(left) + 'px';
    tip.style.top = Math.round(top) + 'px';
    void tip.offsetHeight;
    tip.classList.add('is-visible');
    setTimeout(function () {
      tip.classList.remove('is-visible');
      setTimeout(function () { tip.remove(); }, 160);
    }, ms);
  }
  window.DSCopy = { write: write, flash: flash };
})();
