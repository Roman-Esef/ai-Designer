---
component: DatePicker
title: "DatePicker"
version: "1.005"
updated: "21.08.2026"
page: pages/molecules/DatePicker.html
page_js: scripts/datepicker.page.js
css: styles/datepicker.css
deps: [icon-button, button]
status: curated
---

> Спека для быстрого контекста. Источник истины — styles/datepicker.css и страница. При изменении обновляй эту спеку и блок в specs/_cheatsheet.md.

## Назначение
Календарь — всплывающая поверхность выбора даты или диапазона дат. Поднимается полями InputDate / InputDateRange (floating над полем) либо встраивается в панель/модалку (inline). Material-подход на токенах ДС; неделя с понедельника, локаль русская. Рантайм — `scripts/ds-datepicker.js` (out-of-box): `makeCalendar`, `openPicker(anchor, spec)` и автоподключение — клик по кнопке-календарю поля (`.inp__act[aria-label="Открыть календарь"]`) поднимает календарь; одиночное поле → выбор даты, поле в `.inp-range--date` → выбор диапазона.

## Инварианты
- Один открытый календарь одновременно — второй открывшийся закрывает первый.
- Реальная ячейка несёт `aria-selected`/`aria-disabled`; визуальные классы `--selected`/`--disabled` — только форс-состояния витрины.
- В режиме диапазона клик раньше начала перезапускает выбор заново, а не двигает конец диапазона.
- В панели месяца/года стрелки навигации листают блок целиком (±1 год у месяцев, ±12 лет у годов), не по одной ячейке.
- `.dpk--inline` (docked) — без тени, только рамка; floating-вариант — тень `--elevation-5`; не смешивать на одном инстансе.

## Диагностика
- «Заголовок календаря обрезается непредсказуемо» → `.dpk__caption` требует ellipsis на первом `span` внутри `max-width:100%`
- «Клик по дате раньше начала диапазона не перезапускает выбор» → проверить логику рантайма выбора диапазона

## Ключевые правила (из разделов страницы)
- **Использование** — выбор даты указателем: одиночная дата (InputDate), диапазон «с … по …» (InputDateRange), месяц целиком. Ручной ввод по маске возможен в поле и без открытия календаря. Не для выбора из 2–6 фиксированных периодов — это SegmentControl.
- **Анатомия** — три зоны: шапка (заголовок «Месяц Год» + стрелки навигации), дни недели + сетка 6×7, опциональный футер («Сегодня» слева, «Отмена / Готово» справа).
- **Варианты** — режимы: single (дата) · range (диапазон) · month (выбор месяца); представления: day · month · year (переключаются заголовком и стрелками); футер: нет (авто-применение, docked) / кнопки / быстрое «Сегодня».
- **Размеры** — один размер: ширина 304px (7×40 + паддинг 12), одинаковая для всех вариантов футера (сетка растянута на всю ширину, без пустот по бокам). Ячейка дня 40×40, кружок 36. Футерные кнопки — размер XS (24px), чтобы три кнопки помещались без переноса. Меняется способ размещения: floating (тень --elevation-5) / inline (рамка --border-light, без тени).
- **Размеры · Радиус скругления** — Поверхность одна на оба режима; скругления ячеек различают день, месяц и год. поверхность — 8px (--radius-m) · заголовок месяца/года — 6px (--radius-s) · ячейка дня — 50% · ячейка панели месяцев и годов — 999px (--radius-pill).
- **Контент** — неделя с понедельника, дни Пн…Вс; заголовок — месяц в И.п. + год; дни соседних месяцев приглушены и кликабельны; min/max делают даты недоступными (disabled), не скрывают.
- **Поведение** — стрелки: ±1 месяц (day), ±1 год (month), ±12 лет (year) — видны во всех представлениях, включая month/year, чтобы можно было листать более ранние/поздние года; заголовок day→year→month→day. Диапазон: клик1 = начало (конец сброшен), клик2 = конец; клик раньше начала перезапускает. Floating — под полем, зазор 8px, авто-flip вверх, как Popover; один открытый календарь.
- **Состояния** — на уровне ячейки дня: default · hover (заливка кружка) · today (обводка --primary) · selected / концы диапазона (заливка --primary, белое число) · in-range (полоса --primary-bg) · disabled (приглушено, не реагирует) · outside (сосед. месяц, приглушено).
- **Доступность** — root `role="dialog"` + `aria-modal="false"` + `aria-label="Выбор даты"`; сетка `role="grid"`, ячейки `role="gridcell"` + полный `aria-label`. Выбор/недоступность ячейки дня красятся и по `[aria-selected="true"]`/`[aria-disabled="true"]` напрямую — классы `.dpk__day--selected`/`--disabled` нужны только для форс-состояний витрины (RulesAudit W1, 12.08.2026).даты + `aria-selected`; недоступные `aria-disabled="true"`. Клавиатура: ←→ день, ↑↓ неделя, PageUp/Down месяц, Home/End неделя, Enter/Space выбрать, Esc закрыть.
- **Типографика** — заголовок Body S Strong; числа и ячейки месяца/года Body S (табличные цифры); дни недели Body XS.
- **Цвета** — поверхность --bg-popup + --elevation-5; выбор/концы диапазона --primary (число --text-on-dark); полоса диапазона --primary-bg; сегодня — обводка --primary; дни недели/сосед. месяц --text-inactive; ховер --bgtable-row-hover; недоступно --st-disabled; радиус --radius-m.

## Для разработчиков (выжимка)

### Точные размеры (redline)
Рендерится на странице через getComputedStyle. Источник — styles/datepicker.css. Контейнер 304px / паддинг 12px / радиус 8px; шапка 40px; ячейка дня 40×40; кружок 36×36; дни недели 32px.

### Разметка · HTML (эталонная реализация ДС)

```
<div class="dpk" role="dialog" aria-modal="false" aria-label="Выбор даты">
  <div class="dpk__head">
    <button class="dpk__caption" aria-haspopup="true"><span>Октябрь 2025</span><span class="dpk__cap-icon">…chevron-down…</span></button>
    <div class="dpk__nav">
      <button class="ibtn ibtn--neutral ibtn--s dpk__prev" aria-label="Назад">…chevron-left…</button>
      <button class="ibtn ibtn--neutral ibtn--s dpk__next" aria-label="Вперёд">…chevron-right…</button>
    </div>
  </div>
  <div class="dpk__weekdays" aria-hidden="true"><span class="dpk__weekday">Пн</span>…<span class="dpk__weekday">Вс</span></div>
  <div class="dpk__grid" role="grid">
    <button class="dpk__day dpk__day--outside" role="gridcell" aria-label="29 сентября 2025" tabindex="-1"><span class="dpk__daynum">29</span></button>
    <button class="dpk__day dpk__day--today" role="gridcell" aria-label="15 октября 2025" aria-selected="false" tabindex="-1"><span class="dpk__daynum">15</span></button>
    <button class="dpk__day dpk__day--selected" role="gridcell" aria-selected="true" tabindex="0"><span class="dpk__daynum">21</span></button>
    <!-- диапазон: --range-start / --in-range / --range-end -->
  </div>
  <!-- опц. футер -->
  <div class="dpk__foot">
    <div class="dpk__foot-left"><button class="btn btn--transparent btn--xs dpk__today"><span class="btn__label">Сегодня</span></button></div>
    <div class="dpk__foot-right">
      <button class="btn btn--transparent btn--xs dpk__cancel"><span class="btn__label">Отменить</span></button>
      <button class="btn btn--accent btn--xs dpk__ok"><span class="btn__label">Применить</span></button>
    </div>
  </div>
</div>
<!-- панель месяца/года: root + .dpk--panel, тело .dpk__panel(.--years) > .dpk__panel-cell(.--current/.--selected/.--disabled) -->
```

### Поведение · псевдокод (framework-agnostic)
```
// Сетка: firstOfMonth; lead = (weekday+6)%7 (Пн=0); gridStart = first − lead; 42 ячейки (6 недель).
//   вне месяца → outside; today/selected/disabled(min,max); range-start/end + in-range между концами.
// Диапазон: клик1 → start, end=null; клик2 → dt<start ? start=dt : end=dt.
// Навигация: стрелки ±1 месяц(day)/±1 год(month)/±12 лет(year); заголовок day→year→month→day.
// Floating: под полем, gap 8px, авто-flip вверх (как Popover); один открытый; Esc — закрыть, фокус в поле.
// Клавиатура: ←→ день, ↑↓ неделя, PageUp/Down месяц, Home/End неделя, Enter/Space выбрать, Esc закрыть.
```

### Справочник классов и атрибутов

| Класс/атрибут | Назначение |
|---|---|
| `.dpk` (+ `--inline` / `--panel`) | корень; inline — встроенный без тени; panel — режим выбора месяца/года |
| `.dpk__head` / `.dpk__caption` / `.dpk__cap-icon` / `.dpk__nav` | шапка: заголовок-кнопка + стрелки (.ibtn) |
| `.dpk__weekdays` / `.dpk__weekday` | строка дней недели |
| `.dpk__grid` / `.dpk__day` / `.dpk__daynum` | сетка 6×7; ячейка-кнопка + кружок числа |
| `.dpk__day--outside/--today/--selected/--disabled` | сосед. месяц / сегодня / выбор / недоступно |
| `.dpk__day--range-start/--range-end/--in-range` | концы диапазона (заливка) и промежуток (полоса) |
| `.dpk__panel(.--years)` / `.dpk__panel-cell(.--current/--selected/--disabled)` | панель месяцев/годов |
| `.dpk__foot` / `.dpk__foot-left` / `.dpk__foot-right` | футер: «Сегодня» / «Отменить + Применить» |
| `role="dialog"` / `aria-modal="false"` | не блокирующая поверхность |
| `role="grid"` / `role="gridcell"` / `aria-selected` / `aria-disabled` | доступность сетки |
