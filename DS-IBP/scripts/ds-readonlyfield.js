/* =========================================================================
   ds-readonlyfield.js — общий рантайм ReadOnlyField.
   Зависимости: styles/read-only-field.css; scripts/ds-copy.js (копирование);
   scripts/ds-tooltip.js (тултип переполнения, обязателен).
   Подключение: через scripts/ds.js (единая точка) или поштучно в странице,
   как любой другой рантайм ДС.

   Что делает: регистрирует «усечено → тултип» для значения (`.rof__value` —
   одна строка ellipsis или N строк line-clamp) и аффиксов (`.rof__affix`,
   ~12 символов) общим механизмом DSTooltip.truncated(). Правило в спеке:
   «Переполнение — либо одна строка (ellipsis), либо N строк (line-clamp),
   обе версии с тултипом на переполнении» — кода за ним не было, значение
   и аффиксы обрезались молча. Копирование по иконке — отдельный общий
   рантайм ds-copy.js, здесь не дублируется.

   Свёртка чипов «+N» (chipsMaxRows, правило ReadOnlyField) — Предложение,
   не реализовано; у самих чипов усечённую подпись обслуживает свой рантайм
   (ds-chip.js).

   Экспорт: — (чистая регистрация; поведение — через DSTooltip.truncated).
   ========================================================================= */
(function () {
  'use strict';

  function register() {
    /* Без opts.host: у значения-ссылки (a.rof__value) фокус приходит на
       сам элемент, у текста/аффикса — только hover (они не фокусируются,
       поэтому путь focusin механизма их просто не трогает). */
    if (window.DSTooltip) window.DSTooltip.truncated('.rof__value, .rof__affix');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', register);
  else register();
})();
