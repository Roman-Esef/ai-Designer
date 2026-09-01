---
component: Pagination
title: "Pagination"
version: "1.008"
updated: "21.08.2026"
page: pages/molecules/Pagination.html
page_js: scripts/pagination.page.js
runtime: scripts/ds-pagination.js
css: styles/pagination.css
deps: [dropdown-list, checkbox, label-helper, button, splitter]
status: auto
---

> Автоспека для быстрого контекста. Источник истины — CSS-файл и страница компонента. При изменении компонента обновляй эту спеку.

## Назначение
Нижняя строка многостраничной таблицы: переключение страниц, выбор количества строк на странице и счётчик диапазона. Та же строка может нести панель массового действия над выбранными строками (Action panel) или информационную сводку (Pagi counters) — но сам пагинатор всегда справа. Один фиксированный размер, совпадающий с высотой строки таблицы.

## Инварианты
- Инфо-сводка (`.pgn-row__left`) не обрезается никогда — при недостатке места сокращается сам пагинатор (`data-tier`), а не сводка.
- Bulk-панель (`.pgn-bulk`) и обычная строка пагинации не взаимоисключающие — bulk появляется НАД пагинатором, который остаётся видимым.
- Уровень `data-tier` считается по фактически доступному месту (`ds-pagination.js`), не по порогам вьюпорта.
- Строка целиком не участвует в горизонтальном скролле таблицы.

## Диагностика
- «Номера страниц то есть, то нет на одном экране» → тир считается по реальной ширине контейнера таблицы, не вьюпорта
- «Инфо-сводка обрезана» → нарушение инварианта — сокращать пагинатор (tier), не сводку

## Ключевые правила (из разделов страницы)
- **Использование** — Пагинатор встраивается в нижнюю строку таблицы и занимает её целиком. Ячейка с пагинатором не имеет отдельного состояния Selected/Focus — она не является строкой данных. Появляется, когда общее число строк превышает размер одной страницы; при единственной странице показывается статичный счётчик без интерактива (см. «Контент»).
- **Анатомия** — Строка состоит из левого информационного слота (опционально) и пагинатора справа: выбор размера страницы, счётчик диапазона и навигация — стрелки, номера, свёрнутый диапазон.
- **Размеры** — Один фиксированный размер: высота строки пагинатора равна высоте строки таблицы (единая сетка колонтитула), кнопки номеров и стрелок — квадрат 32 px. Отдельных размерных модификаций (M/S/XS) у компонента нет — под разную плотность таблицы меняется не пагинатор, а высота строки, к которой он подстраивается через --pgn-h.
- **Размеры · Радиус скругления** — Радиус кнопок совпадает с Button M/S. кнопка номера, стрелка, селект — 8px (--radius-control) · панель списка селекта — 12px (--radius-popup).
- **Поведение · Адаптивность** — Перестроение идёт не по порогам вьюпорта и не по фиксированным порогам ширины, а по фактически доступному месту (ResizeObserver + измерение): скрипт считает требуемую ширину пагинатора на каждом уровне и вычитает натуральную ширину инфо-сводки левого слота. Две независимые оси: `data-tier` на `.pgn` — уровень навигации (`l` полный набор до 7 → `m` сокращённый до 5 → `sm` только текущая страница между стрелок → `c` compact «N из M» → `xs` пагинатор в две строки), `data-layout` на `.pgn-row` — раскладка строки (`row` / `stack`). Компакт больше не связан с вертикалью: пагинатор умеет стать компактным, оставаясь в одной строке со сводкой. Раскладка выбирается по правилу «максимума номеров»: считаются лучший уровень в одну строку (по ширине, оставшейся после сводки) и лучший уровень в вертикали (по полной ширине строки); если строка не хуже — остаёмся в строке, иначе `stack`. Инфо-сводка никогда не обрезается и не выходит за границы слота, пагинатор — за правый край строки. Подъём к более полному набору требует запаса 24px (гистерезис против дребезга от скроллбара); RO реагирует только на изменение ширины — высоту меняет сам пересчёт.
- **Контент** — Размер страницы — фиксированный список вариантов: 5 · 10 · 15 · 20 · 50 · Все. «Все» — отдельное состояние: выводит все строки на одной странице (при большом объёме данных предупредите пользователя, что это может быть медленно — см. «Для разработчиков»).
- **Состояния** — Номер страницы проходит Default → Hover → Current. Current не имеет hover — он уже визуально выделен и не кликабелен. Стрелки получают Disabled на границах диапазона (первая/последняя страница). Отдельных состояний Disabled/Loading всего компонента нет (убраны 23.07.2026).
- **Доступность** — Навигация обёрнута в <nav aria-label="Страницы">; текущая страница помечена aria-current="page" и не является кнопкой-ссылкой на себя. Стрелки на границах — aria-disabled="true", а не просто визуально приглушены. Каждый интерактивный элемент — фокусируемая кнопка со стандартным фокус-кольцом ДС (2px solid var(--primary)). Выбор размера страницы — обычный триггер DropdownList: aria-haspopup="listbox", список — role="listbox"/option. Свёрнутый диапазон «…» не интерактивен и не должен получать фокус.
- **Цвета** — Номер страницы и стрелки — нейтральные IconButton размера M, квадратные (радиус --radius-control): текст/иконка StSecondary без заливки, при hover/active — стейт-слой currentColor (12% / 22%), рипл 32px. Текущая страница подсвечена --bgtable-row-focus (как выбранная строка таблицы). Стрелки на границе — StInactive.
- **Выбор размера (контент)** — «Показывать строк: N» — неинтерактивный текст (лейбл StSecondary, значение StPrimary). Единственный интерактивный элемент — IconButton-M чеврон (.pgn__pagesize-btn), открывающий DropdownList; aria-haspopup="listbox".
- **Варианты · Кнопки страниц и стрелки** — Навигация пагинатора собрана из трёх типов элементов: кнопка-номер страницы, кнопка-стрелка (prev/next) и неинтерактивный «…». Раздел описывает их структуру, состояния и поведение — отдельно от композиции строки, чтобы разработчик мог собрать кнопку как самостоятельный примитив.

## Для разработчиков (выжимка)

### Точные размеры (redline)

Требуемая ширина пагинатора по уровням (набор по умолчанию, pageSize 20 из 480): l ≈ 610 · m ≈ 540 · sm ≈ 405 · c ≈ 360 px. Зависит от контента (длина «Показывать строк: N», счётчика, числа кнопок).

Таблица рендерится на странице через getComputedStyle. Точные значения — в CSS-файле компонента (см. `css:` в шапке).

### Разметка · HTML (эталонная реализация ДС)

```
<div class="pgn-row">
  <!-- левый слот — опционален, пуст по умолчанию -->
  <div class="pgn-row__left">
    <div class="pgn-info">…</div>
  </div>

  <div class="pgn-row__right">
    <div class="pgn">
      <span class="pgn__pagesize"><span class="pgn__pagesize-label">Показывать строк: <b>50</b></span><button class="pgn__pagesize-btn" aria-haspopup="listbox"><i data-icon="chevron-down"></i></button></span>
      <span class="pgn__range">3 из 16</span>

      <nav class="pgn__nav" aria-label="Страницы">
        <button class="pgn__arrow" aria-label="Предыдущая страница">‹</button>
        <button class="pgn__num">1</button>
        <button class="pgn__num" aria-current="page">3</button>
        <span class="pgn__ellipsis" aria-hidden="true">…</span>
        <button class="pgn__num">16</button>
        <button class="pgn__arrow" aria-label="Следующая страница">›</button>
      </nav>
    </div>
  </div>
</div>

<!-- есть выбранные строки таблицы — Action panel добавляется НАД строкой пагинатора, -->
<!-- сама строка пагинатора (см. разметку выше) никуда не девается -->
<div class="pgn-footer">
  <div class="pgn-row pgn-row--bulk">
    <div class="pgn-bulk">
      <span class="pgn-bulk__count">Выбрано строк: <b>4</b></span>
      <div class="pgn-bulk__actions">…</div>
    </div>
  </div>
  <hr class="dvd dvd--h"><!-- разделитель Action panel / пагинатор -->
  <div class="pgn-row">…<!-- обычная строка pagesize/range/nav --></div>
</div>
```

### Рантайм ДС — `scripts/ds-pagination.js`

Весь движок пагинатора — в рантайме: окно номеров со свёрткой в «…», дропдаун
размера страницы, `aria-current` / `aria-disabled`, адаптивный подбор уровня
навигации измерением (ResizeObserver + гистерезис 24px), Action panel и
Pagi counters. Страница-витрина пользуется тем же публичным API.

Автоподключение — атрибут на пустом контейнере, дальше рантайм сам рисует и
перерисовывает колонтитул:

```
<div data-pagination data-total="800" data-page="3" data-page-size="50"></div>
```

События на контейнере: `pagechange` (`detail.page`), `pagesizechange`
(`detail.pageSize`) — всплывают.

| Метод | Возвращает |
|---|---|
| `DSPagination.pager(opts)` | сам пагинатор: pagesize + range + nav |
| `DSPagination.row(opts)` | строку колонтитула: левый слот + пагинатор |
| `DSPagination.footer(opts)` | колонтитул целиком: Action panel (опц.) + строка |
| `DSPagination.bulk(opts)` · `info(opts)` | Action panel и Pagi counters по отдельности |
| `DSPagination.pageWindow(cur, total, sibling, boundary)` | массив номеров и `'...'` |
| `DSPagination.totalPages(total, pageSize)` · `sizeLabel(v)` · `SIZES` | вспомогательные |

Опции: `total`, `page`, `pageSize`, `pageSizeOptions`, `showPageSize`,
`compact`, `onChange(page)`, `onPageSizeChange(size)`; у `row`/`footer`
дополнительно `left` (`'none'` | `'info'` | узел), `selectionCount`, `actions`.

### Поведение · псевдокод (framework-agnostic)

```
// 1. totalPages — из общего числа строк и размера страницы («Все» = 1 страница)
totalPages = pageSize === 'all' ? 1 : Math.ceil(totalRows / pageSize)
page = clamp(page, 1, totalPages)

// 2. Свёртывание номеров в «…» — boundaryCount (края) + siblingCount (вокруг текущей),
//    по умолчанию оба = 1. Если бы «…» скрывало ровно 1 страницу — показать её вместо «…».
function pageWindow(current, total, siblingCount = 1, boundaryCount = 1) {
  totalNumbers = boundaryCount*2 + siblingCount*2 + 3
  if (total <= totalNumbers) return range(1, total)     // всё помещается — без «…»

  leftSibling  = max(current - siblingCount, 1)
  rightSibling = min(current + siblingCount, total)
  showLeftEllipsis  = leftSibling  > boundaryCount + 2
  showRightEllipsis = rightSibling < total - boundaryCount - 1
  // комбинируем: [края] + [«…» либо доп. номера] + [соседи текущей] + [«…» либо доп. номера] + [края]
  // полную сборку веток см. ds-pagination.js → pageWindow()
}

// 3. Пересчитывать pageWindow при смене page / totalRows / pageSize.
// 4. Уровень навигации — измерением, без порогов ширины (ResizeObserver):
//      avail = rowInnerWidth − infoNaturalWidth − rowGap
//      levels = [full(7) → short(5) → onlyCurrent(1) → compact(«N из M»)]
//      need = pagesize + счётчик + кнопки·32 + «…» + gaps + 8px буфер
//      iRow   = первый уровень с need ≤ avail
//      iStack = первый уровень с need ≤ rowInnerWidth
//      iRow не хуже iStack → layout = 'row', иначе 'stack';
//      крайний уровень — xs (пагинатор в две строки).
//      Подъём к более полному набору — только с запасом 24px (гистерезис).

// 5. Массовый выбор строк таблицы добавляет панель НАД строкой пагинатора,
//    не заменяя её — обе видны и активны одновременно:
renderFooter({
  bulkPanel: selectedCount > 0 ? { count: selectedCount, actions } : null,
  pagerRow: { info, pager },
})
```

### Pagination.types.ts

```
type PageSize = 5 | 10 | 15 | 20 | 50 | 'all';

interface PaginationProps {
  totalRows: number;
  page: number;                       // controlled, 1-indexed
  pageSize: PageSize;
  pageSizeOptions?: PageSize[];       // по умолчанию [5,10,15,20,50,'all']
  showPageSize?: boolean;               // по умолчанию true
  compact?: boolean;                    // форс компактного режима; авто — по ширине, если не задан
  disabled?: boolean;
  loading?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: PageSize) => void;
}

interface PaginationRowProps extends PaginationProps {
  // левый слот строки — взаимоисключающий выбор на уровне таблицы:
  info?: { label: string; value: string }[];       // Pagi counters
  selection?: {                     // Action panel — если задан (count > 0), рендерится НАД строкой пагинатора
    count: number;
    actions: { label: string; onClick: () => void; tone?: 'default' | 'danger' }[];
  };
}
```

### Справочник классов и атрибутов

| Класс / атрибут | На чём | Назначение |
|---|---|---|
| .pgn-row | div | Строка колонтитула таблицы целиком, 100% ширины |
| .pgn-row__left / __right | div | Левый (опциональный) и правый (пагинатор) слоты строки |
| .pgn | div | Пагинатор: pagesize + range + nav |
| .pgn--compact | .pgn | Скрывает номера/«…», оставляет стрелки и счётчик |
| data-tier | .pgn (+ .pgn-row) | Уровень навигации: l · m · sm · c · xs (выставляет скрипт) |
| data-layout | .pgn-row | Раскладка строки: row (в ряд) · stack (сводка сверху, пагинатор снизу) |
| .pgn__pagesize | span | Контейнер выбора размера: текст-лейбл + чеврон-кнопка |
| .pgn__pagesize-label | span | Неинтерактивный текст «Показывать строк: N» |
| .pgn__pagesize-btn | button | IconButton-M (квадрат, радиус --radius-control) чеврон — aria-haspopup="listbox" |
| .pgn__range | span | Счётчик «N из M», tabular-nums |
| .pgn__nav | nav | Контейнер стрелок и номеров — aria-label="Страницы" |
| .pgn__arrow | button | Prev/Next — aria-disabled на границах диапазона |
| .pgn__num | button | Номер страницы — aria-current="page" на текущей |
| .pgn__ellipsis | span | Свёрнутый диапазон «…», не интерактивен |
| .pgn-footer | div | Обёртка колонтитула: опциональная строка Action panel + всегда строка пагинатора |
| .pgn-row--bulk | .pgn-row | Модификатор строки, несущей Action panel — белый фон, отделена разделителем от строки пагинатора |
| .pgn-bulk | div | Action panel — рендерится НАД строкой пагинатора, пока есть выбор, не заменяя её |
| .pgn-bulk__count / __actions | span / div | Счётчик выбранных строк и кнопки массовых действий (.btn) |
| .pgn-info | div | Pagi counters — информационная сводка в левом слоте |
| .pgn-info__item / __warn | span | Пункт сводки и предупреждающая пометка (тон Warning) |
