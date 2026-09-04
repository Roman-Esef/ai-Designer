---
component: Chart
title: "Chart"
version: "1.000"
updated: "30.08.2026"
page: pages/organisms/Chart.html
page_js: scripts/chart.page.js
runtime: scripts/ds-chart.js
css: styles/chart.css
deps: [tooltip, alert, skeleton, segment-control, icon-button, button, table-cell]
status: curated
---

## Назначение
Графики данных на одной анатомии: 14 типов от столбчатого до водопада и спарклайна. Отвечает на вопрос «как величина ведёт себя по шкале» — по времени, по категориям или относительно другой величины. Предметной области не знает: названия серий, категории и числа приходят данными. Read-only — данные не редактирует, переключатель периода только сообщает выбор наружу.

Не путать с AllocationBar: тот показывает состав одного итога в один момент; Chart — поведение по шкале (состав в динамике — это `stacked` или `stackedArea`).

## Инварианты
- Ширину компонент всегда берёт у контейнера, высоту — у размера (`data-size` → `--chart-h`): S 132px · M 220px · L 320px. Автоматической смены размера по ширине нет.
- Цвета серий — только токены (`--chart-*` по индексу или семантические). Произвольный hex запрещён; палитра из 12 токенов не циклится — с 13-й серии свёртка в «Прочее».
- Цвет ставится один раз на группу серии (`.chart__ser { --chart-c }`), а не на каждый элемент.
- Ноль и пропуск различаются: `null` — разрыв ряда, `0` — точка на нулевой линии. Подменять одно другим нельзя.
- Минимальная высота/ширина столбца — 2px: ненулевое значение обязано быть видно.
- Опорная линия всегда входит в расчёт шкалы.
- Последняя видимая серия не выключается кликом по легенде.
- Тултип — компонент Tooltip (`.tip .tip--main`), не собственная плашка (инцидент `cf-tip`, SectionsAudit).
- Спарклайн в таблице — вариант ячейки TableCell (`.tc__spark`), не самостоятельный компонент: геометрию слота задаёт таблица.

## Диагностика
- «График не появился, поле пустое» → узел вставлен в DOM после `make()` и контейнер имел нулевую ширину: рантайм ждёт ненулевую ширину до 2 сек, дальше нужен `inst.redraw()`
- «Столбцы одного цвета сливаются с соседней серией» → цвет назначен на элемент, а не на `.chart__ser`; либо серии заданы одним токеном
- «Подписи категорий налезают друг на друга» → прореживание считает ширину текста; проверьте, что подписи короткие, иначе тип `hbar`
- «Тултип показывает 0 там, где данных нет» → в ряду вместо `null` подставлен ноль

## Правила
| Тема | Правило |
|---|---|
| Типы | `bar` `hbar` `grouped` `stacked` `stacked100` `line` `area` `stackedArea` `combo` `pie` `donut` `scatter` `waterfall` `spark` |
| Выбор типа | сравнение — столбцы; динамика — линия; состав — стек или круговой; связь — точечный; вклад в итог — водопад |
| Несколько серий у `bar`/`hbar` | рисуются группами автоматически — серии никогда не накладываются друг на друга; нужен стек — задайте `stacked` явно |
| Серий | линейный и стек — до 6; группированные — до 3; круговой — 2–6 секторов; больше — свёртка «Прочее» или несколько графиков |
| Точек | от 4; brush включается от 12 |
| Минимальная ширина | 200px с осями, 64px для спарклайна |
| Числа | `Intl.NumberFormat('ru-RU')`, `tabular-nums`; на осях компактный формат (тыс. от 1e4, млн от 1e6, млрд от 1e9), в тултипе полный |
| Подписи значений | до 8 точек и только вне стеков |
| Палитра | `--chart-*` по индексу серии; семантика (`--success`/`--error`/`--primary`/`--st-grey-midlight`) — когда цвет несёт смысл; смешивать оба принципа в одном графике нельзя |
| Прогноз | `series[].forecastFrom = i` — штрих у линии, штриховка у столбцов; разрыва между фактом и прогнозом нет |
| Анимация | появление не анимируется; переход прозрачности при выделении 120 мс, снимается по `prefers-reduced-motion` |

## Размеры
| Размер | Высота поля | Подписи осей | Где |
|---|---|---|---|
| S | 132px | Body XS | контентная область тайла, сводка; легенду обычно снимают |
| M | 220px | Body XS | база: карточка, модалка, половина ширины страницы |
| L | 320px | Body S | самостоятельный блок, полноэкранный разбор |
| spark | 24px | нет | ячейка таблицы, строка списка |

## Состояния
| Состояние | Реализация |
|---|---|
| loaded | обычный рендер |
| loading (fast) | скелетон: шесть столбцов разной высоты + строка подписей (`.chart__sk`) |
| loading (slow, ≥3 сек) | плашка `.chart__calc` «Данные рассчитываются» на `--bg-page` |
| error | шапка + Alert error + Button Outline XS «Повторить»; поле не рисуется |
| empty | плашка `.chart__empty` «Нет данных за выбранный период» (не Alert) |
| пропуски в ряду | разрыв линии, точки на краях сегментов, причина — Alert info в подвале |
| прогноз | штрих/штриховка с индекса `forecastFrom` |
| выделение серии | `root[data-hover]` гасит остальные группы до `opacity .28` |

## Поведение
- **Наведение** — курсор ловят прозрачные зоны категорий (`.chart__hit`) поверх поля, а подсветка полосы (`.chart__band`) лежит под сериями, чтобы не закрывать их; тултип собирается по всем видимым сериям, «Итого» — при 2+ сериях (кроме `stacked100`).
- **Легенда** — клик выключает серию и пересчитывает шкалу; у `pie`/`donut` тем же кликом скрывается сектор и пересчитываются доли (у скрытого в легенде «—»); последний видимый элемент не выключается. Наведение выделяет серию в поле.
- **Brush** — окно хранится как `[i0, i1]` в индексах категорий; drag окна двигает оба края, ручки — один, dblclick сбрасывает.
- **Перерисовка** — ResizeObserver на поле построения, дебаунс один кадр, полная перестройка SVG (инкрементальных обновлений нет).
- **Экспорт** — кнопка тулбара отдаёт текущее поле построения как SVG.

## DOM-анатомия
```html
<div class="chart-host" data-size="m" data-type="bar">
  <div class="chart">
    <div class="chart__head">
      <div class="chart__titles">
        <div class="chart__title">Движение средств по месяцам</div>
        <div class="chart__subtitle">RUB</div>
      </div>
      <div class="chart__toolbar">
        <div class="segctrl segctrl--xs" role="radiogroup" aria-label="Период">…</div>
        <button class="ibtn ibtn--neutral ibtn--s" aria-label="Скачать график"><i data-icon="download"></i></button>
      </div>
    </div>
    <div class="chart__legend">
      <button class="chart__legend-item" aria-pressed="true">
        <span class="chart__marker" style="--chart-c:var(--chart-blue)"></span>
        <span class="chart__legend-name">Поступления</span>
        <span class="chart__legend-val">810 млн</span>
      </button>
    </div>
    <div class="chart__plot">
      <svg class="chart__svg" role="img" aria-label="Столбчатый график: Поступления от 420 млн (Янв) до 760 млн (Дек)">
        <g class="chart__grid"><line/></g>
        <g class="chart__ser" data-id="in" style="--chart-c:var(--chart-blue)"><rect class="chart__bar"/></g>
        <g class="chart__axis"><text/><line/></g>
        <g><line class="chart__ref"/><text class="chart__ref-label"/><text class="chart__vlabel"/></g>
        <g><rect class="chart__band" data-i="0"/></g>
        <g><rect class="chart__hit" data-i="0"/></g>
      </svg>
      <div class="chart__cursor"></div>
      <div class="tip tip--main tip--multiline tip--no-arrow chart__tip" role="tooltip">
        <span class="chart__tip-title">Июл</span>
        <div class="chart__tip-row"><span class="chart__marker"></span><span class="chart__tip-name">Поступления</span><span class="chart__tip-val">700 млн</span></div>
      </div>
    </div>
    <div class="chart__brush"><svg class="chart__brush-svg"><rect class="chart__brush-spark"/></svg><div class="chart__brush-window"><span class="chart__brush-handle chart__brush-handle--l"></span><span class="chart__brush-handle chart__brush-handle--r"></span></div></div>
    <div class="chart__foot"><div class="alert alert--info alert--m">…</div></div>
  </div>
</div>
```

## Классы
`.chart-host` (+ `[data-size="s|m|l"]`, `[data-type]`, `--spark`) · `.chart` (+ `--stretch`, `--spark`, `[data-hover]`) · `.chart__head` `__titles` `__title` `__subtitle` `__toolbar` · `.chart__legend` (+ `--bottom`) `__legend-item` `__legend-name` `__legend-val` · `.chart__marker` (+ `--line` `--dot` `--dashed`) · `.chart__plot` `__svg` · `.chart__grid` (+ `.chart__zero`) `__axis` `__axis-title` `__tick` `__vlabel` · `.chart__ser` (+ `.is-active`) `__bar` (+ `--forecast`) `__line` (+ `--dashed`) `__area` `__dot` (+ `--solid`, `.is-active`) `__slice` `__spark-dot` · `.chart__ref` `__ref-label` `__band` (+ `.is-active`) `__hit` `__cursor` · `.chart__tip` `__tip-title` `__tip-row` `__tip-name` `__tip-val` `__tip-total` · `.chart__brush` `__brush-svg` `__brush-spark` `__brush-window` `__brush-handle` (+ `--l` `--r`) · `.chart__foot` `__empty` `__calc` `__calc-title` `__calc-sub` `__sk` `__sk-bars`

## Рантайм
`scripts/ds-chart.js` → `window.DSChart.make(cfg)`, `.palette` (12 токенов), `.fmt.number` / `.fmt.compact` / `.fmt.percent`. Подключается единой точкой входа `scripts/ds.js`. Ключи `cfg`: `type` `size` `title` `subtitle` `categories` `series[]` `legend` `tooltip` `crosshair` `grid` `valueLabels` `refLine` `brush` `initialRange` `toolbar` `format` `yTicks` `status` `totalIndexes` `centerLabel` `centerSub` `spark` `tone` `footNote`. Серия: `{ id, name, data[], type, color, dashed, forecastFrom, legendValue }`.

- **Размеры · Радиус скругления** — Радиусы не зависят от размера — привязаны к типу элемента. столбец — 2px (--chart-bar-r = --radius-2xs) · маркер линии — 999px · маркер точки — 50% · пункт легенды, brush, Empty, «Расчёт» — 4px (--radius-xs).
