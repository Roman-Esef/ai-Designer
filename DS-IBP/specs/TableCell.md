---
component: TableCell
title: "TableCell"
version: "2.006"
updated: "02.09.2026"
page: pages/organisms/TableCell.html
runtime: scripts/ds-table.js, scripts/tbl-resize.js, scripts/tbl-reorder.js
css: styles/table-cell.css
deps: [checkbox, chip, icon-button, button, input, dropdown-list, tooltip, chart]
status: curated
---

> Спека для быстрого контекста. Источник истины — CSS-файл и страница компонента. При изменении компонента обновляй эту спеку и блок в specs/_cheatsheet.md.

## Назначение
Ячейка таблицы (`.tc`) и ячейка шапки — TableHeader (`.th`). Универсальный контейнер для любого типа контента строки: текст, числа, дерево, чипы, контролы, редактируемые поля. Используется как атом строки при сборке любой таблицы/реестра/дерева/формы-таблицы. Собственного фона и скруглений нет — наследует фон строки; скругления даёт контейнер таблицы (`.tbl`). Внутрь ставятся компоненты ДС (Checkbox, Chip, IconButton, Button, Input S), своих аналогов ячейка не рисует.

## Инварианты
- Высота строки фиксирована 48px, растёт только при явном разрешении переноса (`.tc--wrap`) — плотностей строки нет.
- Состояния hover/focus/selected — свойство строки (`.tbl__row`), не ячейки; ячейка только наследует фон.
- Disabled у ячейки/строки нет — таблица не делает записи недоступными.
- Разделительная ячейка (`--separator`) несёт только состояния строки/колонки — контентных признаков (текст, иконки) у неё быть не может.

## Диагностика
- «Hover подсвечивает только одну ячейку, а не строку» → фон должен задаваться через `.tbl__row:hover > .tc`, не точечным классом на ячейке
- «Ширина колонки выбора скачет между шапкой и строками» → класс `.th--select`/`.tc--select` должен стоять на всех ячейках колонки одинаково

## Ключевые правила (из разделов страницы)
- **Использование** — из ячеек разных типов собирается любая колонка: реестр (чекбокс, чипы-статусы, суммы, действия), дерево иерархии, редактируемая форма-таблица.
- **Анатомия** — `.tc`: иконка слева · prefix · значение · postfix · иконка справа; нижний бордер, без заливки. `.th`: подпись + `.th__tools` (закрепление + сортировка) + опц. действие (кебаб).
- **Размеры** — плотностей нет: высота строки фиксирована 48px, растёт только у `.tc--wrap` (перенос текста). Паддинг 16px (input-ячейка 4/8), зазор 10px, разделитель 8px, шаг дерева 20px.
- **Размеры · Радиус скругления** — Ячейка не скруглена — иначе на стыках были бы просветы. ячейка — 0 · твисти дерева — 6px (--radius-s) · обёртка .tbl — 12px (--radius-xl) · чипы и кнопки — по своему компоненту.
- **Варианты · Динамика** — единственный собственный вариант ячейки: слот `.tc__spark` (72×24px, ширина через `--tc-spark-w`) с компонентом Chart `type: 'spark'` — без осей, легенды и тултипа; точное значение стоит рядом отдельной колонкой, тон `auto` красит линию по знаку изменения. Полноразмерный график в ячейку не ставится (ломает высоту строки 48px).
- **Контент** — текст слева, усечение + Tooltip; числа — один класс `.tc--numbers` (справа + tabular-nums + разряды через Intl); иконки слева/справа по 16px идут **сразу за текстом**, не у границы; 2row = значение + subtext; пусто = «—»; действий max 2–3 → кебаб.
- **Состояния** — интерактивные (Hover · Focus · Selected) живут на **строке** и красят все её ячейки, включая разделители; служебные (Error +`--error-bg`, Empty, Skeleton, EditMark, фон колонки Accent/Pinned) — на ячейке. **Состояния Disabled у таблицы нет.**
- **Поведение · сортировка** — опция колонки; цикл none → asc → desc → none, глифы `arrow-up-down` → `arrow-narrow-up` → `arrow-narrow-down`; кнопка = IconButton neutral S; покой `--secondary`, hover шапки и активная — `--secondary-dark`; активна максимум одна колонка.
- **Колонка выбора** — чекбокс шапки центрируется по колонке ровно над чекбоксами строк: инструменты шапки (закрепление, сортировка) выводятся из потока и прижимаются к правому краю, а колонка не сужается ниже порога, на котором помещаются и чекбокс, и обе иконки. Порог ставится классом `.th--select` / `.tc--select` (min-width 124px) на **все** ячейки колонки — иначе строки окажутся уже шапки и чекбоксы разъедутся.
- **Поведение · закрепление** — опция колонки: фон Pinned у шапки и всех ячеек колонки + sticky при горизонтальном скролле (`.tbl--scroll`). Глиф `pin` появляется по hover шапки, закреплённая — `pin-filled` видна всегда (`--secondary-dark`), `aria-pressed`. Нет сортировки → закрепление занимает её место.
- **Поведение · ширина колонки** — ручка на правой границе шапки (`.th__resize`, зона захвата 9px, графика только по hover/focus); drag пересчитывает ширину вживую, минимум **96px**, клавиатура ← → шагом 16px. Свободное место справа забирает замыкающий разделитель (`grid: 8px … minmax(8px,1fr)`) — так строка всегда тянется до правой границы таблицы, без белого поля справа при малом числе колонок. Изменение ширины — не отключаемая опция: ручка есть у каждой колонки шапки всегда и функциональна из коробки — общий скрипт `scripts/tbl-resize.js` навешивает drag/клавиатуру на любую `.th__resize` без ручной инициализации на странице (ручки со своей логикой, помеченные `data-resize`, скрипт не трогает). Скрипт входит в `scripts/ds.js`, поэтому на собранном экране ресайз работает сразу — отдельно подключать `tbl-resize.js` не нужно (и линтер `A7` запретит: рантайм только через `ds.js`). Сборщик экрана обязан лишь поставить `<span class="th__resize" role="separator" aria-orientation="vertical" tabindex="0" aria-label="Изменить ширину колонки">` последним ребёнком каждой `.th` (кроме `.th--separator`).
- **Поведение · порядок колонок** — только перетаскивание: перенос за **подпись** шапки (порог 4px), колонка приглушается (`.th--dragging`/`.tc--dragging`), место вставки — линия `.tbl__guide` в тоне `--primary`. Переносятся все колонки, кроме разделителей (`.th--separator`) и закреплённых (`.th--pinned`); маркер не нужен — общий скрипт `scripts/tbl-reorder.js` навешивает drag на любую `.th__label` без ручной инициализации на странице, входит в `scripts/ds.js` (работает из коробки, как изменение ширины). Кнопок и пунктов меню, дублирующих перенос, у колонки нет.
- **Поведение · строка** — клик по любой ячейке = фокус всей строки: ячейки доступны для редактирования, видны скрытые действия и иконки полей. Выбор чекбоксом = Selected на всей строке; чекбокс шапки — выбрать все / промежуточное состояние.
- **Поведение · скрытые действия** — не тип контента, а настройка поверх ячейки (как EditMark): видны по hover/focus строки, на тач — всегда.
- **Поведение · редактирование** — внутри ячейки компонент **Input размера S**; в покое поле без рамки, hover строки проявляет рамку, фокус даёт `--primary` 2px. Иконки действий (очистка, календарь, шеврон) видны только в фокусе строки/ячейки, 16px, тон `--secondary`. Autocomplete: шеврон раскрывает DropdownList.
- **Поведение · дерево** — твисти toggle `aria-expanded`, раскрывает дочерние строки под собой; листья без твисти (место зарезервировано).
- **Разделитель** — структурная ячейка 8px в начале и конце строки; принимает только состояния строки и фон колонки, EditMark/Skeleton/Error-текста у неё не бывает; как тип контента не выбирается.
- **Доступность** — нативные table/th/td или role=grid; `aria-sort` на шапке, `aria-pressed` на закреплении; чекбокс + `aria-selected`; клавиатура grid-pattern, `:focus-visible` inset outline; Tooltip для усечения; `aria-expanded`/`aria-level` для дерева; `aria-busy` для skeleton. Фон выбранной строки красится и по `.tbl__row[aria-selected="true"]` напрямую — класс `.tbl__row--selected` нужен только для форс-состояния витрины (RulesAudit W1, 12.08.2026).
- **Цвета** — текст `--text-primary`/`--text-secondary`/`--text-inactive`; фон строки `--bgtable`/`-row-hover`/`-row-focus`/`--primary-bg`/`--error-bg-light`; фон колонки `--bgtable-accent*`/`--bgtable-pinned*`; границы `--border-light` (ячейка) / `--border-primary` (шапка); иконки шапки и полей `--secondary` → `--secondary-dark`; `--primary` (фокус ячейки, рамка Input), `--warning`/`--error`, `--chart-orange` (EditMark).

## Для разработчиков (выжимка)

### Точные размеры (redline)
Таблица на странице рендерится через getComputedStyle с реального экземпляра: высота 48px, паддинг 16px, зазор 10px, бордер 1px, значение `--type-body-s` (14/16), кнопки шапки 16×16 (IconButton S, зазор 4px), поле редактируемой ячейки — Input S (32px, радиус `--radius-field`).

### Разметка · HTML (эталонная реализация ДС)

```html
<!-- фон колонки: .tc--accent | .tc--pinned ; состояние строки — на .tbl__row/<tr> -->
<div class="tbl__row tbl__row--selected" style="grid-template-columns:8px 2fr 1fr 8px;">
  <div class="tc tc--separator"></div>
  <div class="tc">
    <span class="tc__row">
      <span class="tc__icon tc__icon--lead"><i data-icon="info-circle"></i></span>
      <span class="tc__prefix">от</span>
      <span class="tc__text tc__text--truncate">Значение</span>
      <span class="tc__postfix">₽</span>
      <span class="tc__icon tc__icon--warning"><i data-icon="alert-triangle"></i></span>
    </span>
  </div>
  <div class="tc tc--separator"></div>
</div>

<div class="tc tc--numbers"><span class="tc__row"><span class="tc__text">1 240 500,00</span></span></div>
<div class="tc"><span class="tc__body"><span class="tc__row"><span class="tc__text">ООО «Восток»</span></span><span class="tc__subtext">ИНН 7701234567</span></span></div>
<div class="tc tc--tree" style="--tc-level:1"><button class="tc__twisty" aria-expanded="true"><i data-icon="chevron-down"></i></button><span class="tc__row"><span class="tc__text">Дочернее ООО</span></span></div>
<div class="tc tc--center"><label class="cb cb--no-content cb--selected"><input type="checkbox" class="cb__input" checked><span class="cb__box"><span class="cb__mark"><i data-icon="check"></i></span></span></label></div>
<div class="tc"><div class="tc__hidden"><button class="ibtn ibtn--neutral ibtn--s" aria-label="Изменить"><i data-icon="edit"></i></button></div></div>
<div class="tc tc--input tc--edited"><div class="inp inp--s inp--fullwidth"><div class="inp__field"><input class="inp__control" value="12.05.2026"><span class="inp__acts"><button class="inp__act" aria-label="Открыть календарь"><i data-icon="calendar"></i></button></span></div></div></div>
<div class="tc"><span class="tc__empty">—</span></div>
<div class="tc tc--skeleton" aria-busy="true"><span class="sk-line sk-line--caption" style="--sk-w:60%"></span></div>

<div class="th th--sorted th--pinned" aria-sort="descending">
  <span class="th__label">Сумма, ₽</span>
  <span class="th__tools">
    <button class="ibtn ibtn--neutral ibtn--s th__pin" aria-pressed="true" aria-label="Открепить колонку"><i data-icon="pin-filled"></i></button>
    <button class="ibtn ibtn--neutral ibtn--s th__sort" aria-label="Сортировка от большего к меньшему"><i data-icon="arrow-narrow-down"></i></button>
  </span>
  <span class="th__resize" role="separator" aria-orientation="vertical" tabindex="0" aria-label="Изменить ширину колонки"></span>
</div>
```

### Рантайм ДС — `scripts/ds-table.js`

Интерактив строк и ячеек вынесен в рантайм. Подключение — `data-table` на
контейнере `.tbl`; всё работает делегированием, поэтому перерисовка строк
ничего не ломает.

| Что | Поведение |
|---|---|
| Сортировка | клик по `[data-sort]` в шапке: none → asc → desc → none, глиф и `aria-sort` синхронны, активна одна колонка; событие `sort` с `{ column, dir }` |
| Дерево | `.tc__twisty` переключает `aria-expanded` и показ дочерних строк (`[data-parent]` = id узла из `data-node`); закрытие прячет всё поддерево; событие `treetoggle` |
| Выбор строк | чекбокс строки красит `.tbl__row--selected`, чекбокс шапки выделяет все и держит промежуточное состояние; событие `rowselect` с `{ selected: [id…] }` |
| Фокус строки | клик по строке ставит `.tbl__row--focus`, клик вне таблицы снимает |
| Усечение | `.tc__text--truncate` получает тултип с полным текстом, показываемый только при реальном усечении (нужен `ds-tooltip.js`) |

API: `DSTable.wire(tblEl, opts) → { el, selected(), sort(column, dir), refresh() }`,
`DSTable.wireAll(root)`; тень липкой шапки (`.dtable--scrolled`) — `bind` / `bindAll` по `.dtable__body`.

### Поведение · псевдокод (framework-agnostic)
- **Состояние строки**: hover/focus/selected ставить на строку — ячейки (включая разделители) наследуют. Disabled нет.
- **Усечение + Tooltip**: `scrollWidth > clientWidth` → Tooltip с полным текстом (`.tc__text--truncate` = `flex: 0 1 auto`, поэтому постфикс и иконка стоят вплотную к тексту).
- **Числа**: `.tc--numbers` (справа + tabular-nums), форматировать Intl.NumberFormat('ru-RU').
- **Сортировка**: цикл none→asc→desc→none, глифы arrow-up-down / arrow-narrow-up / arrow-narrow-down, `aria-sort` синхронен, активна одна колонка.
- **Закрепление**: свойство колонки — фон Pinned + sticky; pin → pin-filled, `aria-pressed`.
- **Выбор строк**: чекбокс ДС без текста (`.cb--no-content`); заголовочный = выбрать все / indeterminate; клик по строке вне интерактивных элементов — фокус строки.
- **Дерево**: отступ `--tc-level`; твисти toggle `aria-expanded`, показывает дочерние строки; лист — `.tc__twisty--leaf`.
- **Клавиатура**: стрелки между ячейками; Enter/F2 — редактирование; Esc — отмена.
- **Скрытые действия**: `.tc__hidden` по hover/focus строки; на тач — постоянно.
- **EditMark**: `.tc--edited` до сохранения/сброса; ошибка — `.tc--error` (+ tooltip с причиной).
- **Ширина колонки**: drag правой границы шапки ⇢ `width = max(96, старт + dx)`, линия-указатель через всю таблицу; клавиатура ← → шагом 16px. Скрипт `tbl-resize.js` (в составе `ds.js`) вешает это делегированием — сборщику достаточно разметить `.th__resize` в каждой `.th`.
- **Порядок колонок**: только drag за подпись (порог 4px), место вставки — ближайшая граница по центрам колонок; разделители и закреплённые исключены. Общий скрипт `tbl-reorder.js` (в составе `ds.js`) — сборщику размечать ничего не нужно.

### Справочник классов и атрибутов

| Класс/атрибут | Назначение |
|---|---|
| `.tc` | ячейка: flex-строка, align-items center, нижний бордер, без фона |
| `.tc--right` / `--center` | горизонтальное выравнивание контента (center — служебное: чекбокс/кнопки) |
| `.tc--numbers` | числовая колонка: справа + tabular-nums (`.tc--right` не нужен) |
| `.tc--accent` / `--pinned` | фон колонки (акцент / закреплённая); pinned + `.tbl--scroll` = sticky |
| `.tbl__row--hover` / `--focus` / `--selected` | состояние СТРОКИ — красит все её ячейки, включая разделители |
| `.tc--hover` / `--focus` / `--selected` | те же тона на одиночной ячейке (для примеров в документации) |
| `.tc--error` / `--error-bg` / `--skeleton` | служебные состояния ячейки (disabled нет) |
| `.tc--edited` | EditMark — угловой маркер правки (chart-orange), правый верхний угол |
| `.tc__row` | строка значения: иконка слева · prefix · text · postfix · иконка справа |
| `.tc__text` / `--truncate` | значение (Body S); усечение в строку + Tooltip |
| `.tc__prefix` / `__postfix` | серые аффиксы (inactive) |
| `.tc__icon` / `--lead` | иконка 16px после значения / перед префиксом; тона `--warning/--error/--success` |
| `.tc__empty` | прочерк «—» пустого значения |
| `.tc--wrap` | перенос текста вместо усечения — ячейка растёт по высоте |
| `.tc__body` / `__subtext` | стек значения и вторая строка (Body XS) |
| `.tc--tree` + `--tc-level` | узел дерева; отступ = уровень × 20px |
| `.tc__twisty` / `--leaf` | твисти раскрытия; лист без иконки |
| `.tc__controls` | обёртка кнопок/чипов в ячейке |
| `.tc__hidden` | скрытые действия — настройка поверх ячейки, видны по hover/focus строки |
| `.tc--input` | редактируемая ячейка: внутрь ставится `.inp.inp--s` (Input S), своего поля нет |
| `.tc--separator` / `.th--separator` | структурная ячейка 8px в начале и конце строки |
| `.sk-line--caption` | плейсхолдер загрузки внутри ячейки — общий компонент Skeleton (styles/skeleton.css) |
| `.th` | ячейка шапки (TableHeader) |
| `.th__label` | подпись колонки (усекается) |
| `.th__tools` | группа кнопок шапки: закрепление + сортировка (IconButton neutral S) |
| `.th__sort` / `.th--sorted` | сортировка; активная — `--secondary-dark` |
| `.th__pin` / `.th--pinned` | закрепление колонки; закреплённая — pin-filled, фон Pinned, sticky |
| `.th__resize` / `.th--resizing` | ручка ширины на правой границе шапки (9px); минимум колонки 96px |
| `.th--dragging` / `.tc--dragging` | колонка приглушена во время переноса |
| `.tbl__guide` / `.tbl--resizing` / `.tbl--reordering` | линия-указатель границы и места вставки + режимы контейнера |
| `.th--select` / `.tc--select` | колонка выбора с инструментами в шапке: порог ширины 124px на всех её ячейках |
| `.th__action` | доп. действие шапки (кебаб) по hover |
| `aria-sort` / `aria-pressed` / `aria-busy` / `aria-expanded` | сортировка / закрепление / загрузка / раскрытие дерева |
| `.tbl` / `.tbl--scroll` / `.tbl__row` | утилита демо-раскладки (grid) + горизонтальный скролл; в проде — table |
