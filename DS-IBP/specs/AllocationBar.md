---
component: AllocationBar
title: "AllocationBar"
version: "1.001"
updated: "30.08.2026"
page: pages/organisms/AllocationBar.html
runtime: scripts/ds-allocationbar.js
css: styles/allocation-bar.css
deps: [alert, button]
status: curated
---

## Назначение
Итоговое число и его разбивка по составляющим: шапка (заголовок + итог), стек-бар распределения, список позиций с долей и абсолютным значением. Предметной области не знает — названия позиций и значения приходят данными. Read-only: без сортировки, фильтрации, drill-down и редактирования.

Не путать с ProgressBar: тот показывает одну величину относительно максимума, AllocationBar — состав целого (сегменты делят 100%).

## Инварианты
- Хост обязан иметь `container-type: inline-size` (`.albar-host`) — без него контейнерные брейкпоинты не работают.
- Цвета сегментов — только токены `--chart-*` по индексу позиции, без произвольного цвета; 13-я позиция и далее сворачиваются в «Прочее».
- Свыше `maxVisibleItems` (5) — «Показать ещё N», внутреннего скролла у списка нет.
- Высота бара фиксирована 8px на любом брейкпоинте; зазор между сегментами 2px, минимальный сегмент 2px.
- При ограничении высоты (`data-height`) список пропадает первым, затем бар — итог не обрезается никогда.

## Диагностика
- «Компонент не подстраивается под сужение контейнера» → на хосте не выставлен `container-type: inline-size`
- «Цвет сегмента не совпадает со строкой списка» → сверить индекс позиции с палитрой `--chart-*`, не задавать цвет напрямую

## Правила
| Тема | Правило |
|---|---|
| Хост | `.albar-host` обязан иметь `container-type: inline-size` — иначе адаптив не работает |
| Максимальная ширина | 600px (`--albar-max-w`); в резиновой сетке — `.albar--stretch` |
| Позиций | 1–12; свыше `maxVisibleItems` (по умолчанию 5) — кнопка «Показать ещё N», внутреннего скролла нет |
| Палитра | только 12 токенов `--chart-*` по индексу позиции, без цикла; с 13-й — виртуальная «Прочее» |
| Явный цвет | `items[].color` = имя токена (`--chart-indigo`), не hex |
| Высота бара | всегда 8px на любом брейкпоинте |
| Мин. ширина сегмента | 2px, добивается через ResizeObserver, остаток делится пропорционально |
| Нулевая позиция | строка есть, сегмента нет; все значения = 0 → состояние Empty |
| Числа | `Intl.NumberFormat('ru-RU')`, 2 знака у итога и значений, 2 знака у процентов, tabular-nums |

## Контейнерные брейкпоинты (`@container albar`)
| Ширина | Итог | Строки | Что меняется |
|---|---|---|---|
| > 480px | body-m-strong 16/20 | body-s 14/16 | база; % 64px, значение 96px |
| 320–480px | body-s-strong 14/16 | body-xs 12/16 | числовые колонки 56 / 80px |
| < 320px | body-s-strong | body-xs | % скрыт, строка в 2 ряда, значение Secondary |
| < 200px | body-s-strong | — | бар и список скрыты, шапка в колонку |
| < 160px | — | — | компонент не использовать |

## Состояния
| Состояние | Реализация |
|---|---|
| loaded | обычный рендер |
| loading (fast) | скелетон-шиммер: итог, бар, 3 строки |
| loading (slow, ≥3 сек) | скелетон итога и бара + плашка `.albar__calc` «Данные рассчитываются» на `--bg-page` |
| error | шапка без итога + Alert error + Button Outline XS «Повторить» |
| empty | итог «—» + строка `.albar__empty` «Нет данных» (не плашка) |
| partial (сумма < 99,5%) | серый сегмент остатка `--st-grey-midlight` + Alert warning в подвале |
| overflow (сумма > 100,5%) | бар нормализуется по сумме + Alert error в подвале |
| предупреждение | `.albar__warn` — `alert-triangle-filled` 16px в `--warning` + тултип; поверх любого состояния |

Наведение: `root[data-hover]` гасит всё до `opacity .4`, строка и сегмент с этим id получают `.is-active`.

## Ограничение по высоте
Приоритет: итог не обрезается → бар исчезает вторым → строки первыми. `data-height` на хосте: `A` — fade-маска на списке + ссылка «Ещё N», `B` — только шапка и бар, `C` — только шапка. Ниже 48px не использовать.

## DOM-анатомия
```html
<div class="albar-host">
  <div class="albar">
    <div class="albar__head">
      <div class="albar__titles">
        <div class="albar__label">ВБС по сделке на 25.02.2026, RUB</div>
        <div class="albar__sublabel">опционально</div>
      </div>
      <span class="albar__warn" title="Просроченная задолженность"><i data-icon="alert-triangle-filled"></i></span>
      <div class="albar__total"><span>1 000 000 000,00</span><span class="albar__unit">RUB</span></div>
    </div>
    <div class="albar__bar" role="img" aria-label="Распределение: Кредит 35,00%, …">
      <div class="albar__seg" data-id="kr" style="background:var(--chart-indigo);flex-grow:35"></div>
      <div class="albar__seg albar__seg--rest" style="flex-grow:5"></div>
    </div>
    <div class="albar__list">
      <div class="albar__row" data-id="kr">
        <span class="albar__dot" style="background:var(--chart-indigo)"></span>
        <span class="albar__name">Кредит</span>
        <span class="albar__pct">35,00%</span>
        <span class="albar__val">350 000 000,00</span>
      </div>
    </div>
    <button class="btn btn--transparent btn--xs albar__more"><span class="btn__label">Показать ещё 3</span></button>
    <div class="albar__foot"><div class="alert alert--warning alert--m">…</div></div>
  </div>
</div>
```

## Классы
`.albar-host` (+ `[data-height="A|B|C"]`) · `.albar` (+ `--stretch`) · `.albar__head` `__titles` `__label` `__sublabel` `__warn` `__total` (+ `--empty`) `__unit` · `.albar__bar` `__seg` (+ `--rest`, `.is-active`) · `.albar__list` `__row` (+ `--sk`, `.is-active`) `__dot` (+ `--sk`) `__name` `__pct` `__val` · `.albar__more` `__foot` `__empty` `__calc` `__calc-title` `__calc-sub` `__expand` · `.albar__sk` (+ `--total` `--bar` `--name` `--num`)

## Доменный маппинг продукта (финансовые метрики сделки)
Кредит → indigo · Фондирующий кредит → pastel-green · Внутригрупповой кредит → blue · РЕПО → light-blue · Акции → shiny-green · Облигации → turquoise · Корп. контроль → red · Доп. доходность → orange · Комиссия → yellow · Дебиторская задолженность → purple. Прикладное соглашение, не правило ДС.

## Рантайм
`scripts/allocation-bar.page.js` → `window.AllocationBar.make(cfg)`, `.palette`, `.fmtNumber`, `.fmtPercent`, `.fmtCompact`. `scripts/ds-allocationbar.js` — связь бара со строкой по hover (`root[data-hover]`/`.is-active`), подключается через единую точку входа `ds.js`. Для статичных экранов достаточно разметки выше.

- **Размеры · Радиус скругления** — Пропса размера нет, радиусы одинаковы во всех раскладках. полоса — 999px (--radius-pill) · строка легенды — 4px (--radius-xs) · точка-маркер — 50% · блок «Расчёт» — 8px (--radius-control).
