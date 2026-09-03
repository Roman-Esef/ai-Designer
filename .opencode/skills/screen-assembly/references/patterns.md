---
belongs_to: screen-assembly
purpose: Готовые куски разметки типовых узлов экрана — копировать дословно
source: DS-IBP/specs/_cheatsheet.md
updated: "26.08.2026"
---

# Рецепты разметки — типовые узлы экрана

Разметка ниже взята из чит-шита ДС дословно. Меняй в ней только тексты,
количество строк/колонок и перечисленные модификаторы. Структуру не переверстывай.

Если нужного узла тут нет — достань блок компонента командой
`sed -n '/^## Имя$/,/^## /p' DS-IBP/specs/_cheatsheet.md`.

---

## Таблица целиком

```html
<div class="dtable">
  <div class="dtable__toolbar">
    <div class="dtable__toolbar-left">
      <h3 class="dtable__title">Заявки</h3>
      <span class="dtable__count">128</span>
    </div>
    <div class="dtable__toolbar-right">
      <div class="tfilter" role="group" aria-label="Фильтр таблицы">
        <button class="btn btn--outline btn--s tfilter__open" aria-haspopup="dialog" aria-expanded="false" data-modal="filter-scrim">
          <i data-icon="filter"></i><span class="btn__label">Фильтр</span>
        </button>
        <span class="chip chip--edit chip--m tfilter__applied" tabindex="0">
          <span class="chip__label">Применено: 3</span>
          <span class="chip__remove" role="button" aria-label="Сбросить все фильтры"><i data-icon="close"></i></span>
        </span>
      </div>
      <button class="ibtn ibtn--neutral ibtn--m" aria-label="Настроить колонки" data-modal="cols-scrim"><i data-icon="settings"></i></button>
      <button class="btn btn--accent btn--s"><i data-icon="add"></i><span class="btn__label">Добавить</span></button>
    </div>
  </div>

  <div class="dtable__body">
    <div class="tbl" data-table>
      <!-- Шапка. grid-template-columns ОДИНАКОВЫЙ у шапки и у всех строк.
           Первая и последняя ячейки — служебные разделители по 8px.
           Замыкающий разделитель забирает остаток: minmax(8px,1fr). -->
      <div class="tbl__row" style="grid-template-columns:8px 44px 2fr 1.5fr 1fr 120px 96px minmax(8px,1fr);">
        <div class="th th--separator"></div>
        <div class="th th--select">
          <label class="cb cb--no-content"><input type="checkbox" class="cb__input" aria-label="Выбрать все"><span class="cb__box"><span class="cb__mark"><i data-icon="check"></i></span></span></label>
          <span class="th__resize" role="separator" aria-orientation="vertical" tabindex="0" aria-label="Изменить ширину колонки"></span>
        </div>
        <div class="th" aria-sort="none">
          <span class="th__label">Контрагент</span>
          <span class="th__tools">
            <button class="ibtn ibtn--neutral ibtn--s th__pin" aria-pressed="false" aria-label="Закрепить колонку"><i data-icon="pin"></i></button>
            <button class="ibtn ibtn--neutral ibtn--s th__sort" data-sort aria-label="Сортировать"><i data-icon="arrow-up-down"></i></button>
          </span>
          <span class="th__resize" role="separator" aria-orientation="vertical" tabindex="0" aria-label="Изменить ширину колонки"></span>
        </div>
        <div class="th"><span class="th__label">Продукт</span><span class="th__resize" role="separator" aria-orientation="vertical" tabindex="0" aria-label="Изменить ширину колонки"></span></div>
        <div class="th th--right th--sorted" aria-sort="descending">
          <span class="th__label">Сумма, ₽</span>
          <span class="th__tools"><button class="ibtn ibtn--neutral ibtn--s th__sort" data-sort><i data-icon="arrow-narrow-down"></i></button></span>
          <span class="th__resize" role="separator" aria-orientation="vertical" tabindex="0" aria-label="Изменить ширину колонки"></span>
        </div>
        <div class="th"><span class="th__label">Статус</span><span class="th__resize" role="separator" aria-orientation="vertical" tabindex="0" aria-label="Изменить ширину колонки"></span></div>
        <div class="th th--center"><span class="th__label">Действия</span><span class="th__resize" role="separator" aria-orientation="vertical" tabindex="0" aria-label="Изменить ширину колонки"></span></div>
        <div class="th th--separator"></div>
      </div>

      <!-- Строка. Состояния — на строке: --hover / --focus / --selected -->
      <div class="tbl__row" style="grid-template-columns:8px 44px 2fr 1.5fr 1fr 120px 96px minmax(8px,1fr);">
        <div class="tc tc--separator"></div>
        <div class="tc tc--select">
          <label class="cb cb--no-content"><input type="checkbox" class="cb__input" aria-label="Выбрать строку"><span class="cb__box"><span class="cb__mark"><i data-icon="check"></i></span></span></label>
        </div>
        <div class="tc"><span class="tc__row"><span class="tc__text tc__text--truncate">ООО «ЮгСтрой»</span></span></div>
        <div class="tc"><span class="tc__row"><span class="tc__text">Кредитная линия</span></span></div>
        <div class="tc tc--numbers"><span class="tc__row"><span class="tc__text">1 240 500,00</span></span></div>
        <div class="tc"><span class="tc__row"><span class="chip chip--s chip--success"><span class="chip__label">Активна</span></span></span></div>
        <div class="tc tc--center">
          <div class="tc__controls">
            <button class="ibtn ibtn--neutral ibtn--s" aria-label="Изменить" data-modal="row-scrim"><i data-icon="edit"></i></button>
            <button class="ibtn ibtn--neutral ibtn--s" aria-label="Удалить"><i data-icon="trash"></i></button>
          </div>
        </div>
        <div class="tc tc--separator"></div>
      </div>
      <!-- ...остальные строки: минимум 6–8 штук с правдоподобными данными -->
    </div>
  </div>

  <div class="dtable__footer">
    <!-- Панель массовых действий — только когда строки выбраны -->
    <div class="pgn-row pgn-row--bulk">
      <div class="pgn-bulk">
        <span class="pgn-bulk__count" aria-live="polite">Выбрано: <b>3</b></span>
        <span class="pgn-bulk__actions">
          <button class="btn btn--transparent btn--s"><i data-icon="download"></i><span class="btn__label">Выгрузить</span></button>
          <button class="btn btn--transparent btn--s"><i data-icon="trash"></i><span class="btn__label">Удалить</span></button>
        </span>
      </div>
    </div>
    <div class="pgn-row">
      <div class="pgn-row__right">
        <div class="pgn">
          <span class="pgn__pagesize"><span class="pgn__pagesize-label">Показывать строк: <b>50</b></span><button class="pgn__pagesize-btn" aria-haspopup="listbox"><i data-icon="chevron-down"></i></button></span>
          <span class="pgn__range">1 из 3</span>
          <nav class="pgn__nav" aria-label="Страницы">
            <button class="pgn__arrow" aria-label="Предыдущая страница">‹</button>
            <button class="pgn__num" aria-current="page">1</button>
            <button class="pgn__num">2</button>
            <button class="pgn__num">3</button>
            <button class="pgn__arrow" aria-label="Следующая страница">›</button>
          </nav>
        </div>
      </div>
    </div>
  </div>
</div>
```

**Про ширины колонок.** `grid-template-columns` пишется на каждой строке и в
шапке — значения обязаны совпадать посимвольно. Схема: `8px` (разделитель) →
колонки данных → `minmax(8px,1fr)` (замыкающий разделитель забирает остаток,
чтобы строка всегда доходила до правой границы).

**Ручка ресайза — обязательна в каждой `.th`.** Последним ребёнком каждой
`.th` (кроме `.th--separator`) ставится
`<span class="th__resize" role="separator" aria-orientation="vertical" tabindex="0" aria-label="Изменить ширину колонки"></span>`.
Изменение ширины колонки — базовое поведение любой таблицы, работает из коробки:
скрипт `tbl-resize.js` входит в `ds.js`, свой JS и `data-`-атрибуты не нужны.
Отдельно подключать `tbl-resize.js` нельзя — линтер `A7` отклонит (рантайм только через `ds.js`).

**Порядок колонок — тоже базовое поведение.** Колонку перетаскивают за подпись
шапки (`.th__label`); переносятся все колонки, кроме разделителей и закреплённых.
Маркер не нужен: скрипт `tbl-reorder.js` входит в `ds.js`, свой JS и
`data-`-атрибуты не нужны.

Единицы: `2fr` / `1fr` — резиновые текстовые колонки, `120px` / `96px` — колонки
фиксированной ширины (статус, действия), `44px` — колонка чекбоксов.

**Про сортировку.** Активна максимум одна колонка: у неё `th--sorted` и
`aria-sort="ascending|descending"`, глиф `arrow-narrow-up` / `arrow-narrow-down`.
У остальных сортируемых — `aria-sort="none"` и глиф `arrow-up-down`.
Несортируемая колонка кнопки `th__sort` не имеет вовсе.

---

## Строка, редактируемая по двойному клику

Мокап статичен, поэтому показывают результат, а не событие:

```html
<div class="tbl__row tbl__row--selected" style="…">…</div>
```

и рядом — открытая модалка редактирования. Само поведение («двойной клик по
строке или кнопка «Изменить» открывает модальное окно редактирования») —
описывается словами в `<Имя>.screen.md`, разделы «Поведение» и «Модальные окна».

Редактирование прямо в ячейке (без модалки) — `.tc--input` + `.inp.inp--s`.

---

## Модальное окно

```html
<div class="modal-scrim" id="row-scrim" hidden>
  <div class="modal modal--w6" role="dialog" aria-modal="true" aria-labelledby="row-title">
    <header class="modal__head">
      <h2 class="modal__title" id="row-title">Редактирование заявки</h2>
      <button type="button" class="ibtn ibtn--neutral ibtn--l" aria-label="Закрыть" data-modal-close><i data-icon="close"></i></button>
    </header>
    <div class="modal__body">
      <!-- поля формы: InputText, InputDate, Select, Checkbox -->
    </div>
    <footer class="modal__foot">
      <div class="modal__foot-right">
        <button class="btn btn--transparent btn--m" data-modal-close><span class="btn__label">Отмена</span></button>
        <button class="btn btn--accent btn--m"><span class="btn__label">Сохранить</span></button>
      </div>
    </footer>
  </div>
</div>
```

Ширины: `--w3` — подтверждение, `--w4` — настройка колонок, `--w6` — форма и
фильтр, `--w8` / `--w9` — таблица внутри модалки. Варианта в одну колонку нет.

Подтверждение удаления — вложенный слой `modal-scrim--nested`, главная кнопка
`btn--accent btn--danger`.

---

## Модалка настройки колонок

`.modal--w4`, в теле — список колонок с Checkbox и ручкой перетаскивания
(глиф `drag-dots`), в подвале слева «Сбросить», справа «Применить».

---

## Пустое состояние таблицы

Тулбар и футер остаются, подменяется только тело:

```html
<div class="dtable__body">
  <div class="dtable__empty">
    <div class="dtable__empty-title">Ничего не найдено</div>
    <div class="dtable__empty-text">Измените параметры фильтра или сбросьте его.</div>
    <button class="btn btn--outline btn--m"><span class="btn__label">Сбросить фильтр</span></button>
  </div>
</div>
```

---

## Ряд тайлов с колонкой из двух тайлов

```html
<div class="tile-row">
  <section class="tile" style="grid-column:span 8">…</section>
  <div class="tile-stack" style="grid-column:span 4">
    <section class="tile">…</section>
    <section class="tile">…</section>
  </div>
</div>
```

`.tile-row` уже выравнивает тайлы по высоте — `align-items` дописывать не нужно.

---

## Тайл с предупреждением

```html
<section class="tile">
  <header class="tile__header">…</header>
  <div class="tile__alert">
    <div class="alert alert--warning alert--m" role="status">…</div>
  </div>
  <div class="tile__body">…</div>
</section>
```

Тон: `alert--info` / `--warning` / `--error`.

---

## Статусы

Статус — всегда Chip, не текст:

| Смысл | Класс |
|---|---|
| Нейтральный, черновик | `chip chip--s` |
| Успех, активна, согласовано | `chip chip--s chip--success` |
| Внимание, на доработке | `chip chip--s chip--warning` |
| Ошибка, отклонено, просрочено | `chip chip--s chip--error` |
| Информация, на рассмотрении | `chip chip--s chip--info` |

В шапке страницы — `chip--rounded chip--s`, в таблице — `chip--s`, в тайле —
`chip--xs`.

Число (количество) — это Badge, не Chip:
`<span class="badge badge--xs badge--accent">7</span>`.

---

## Поле только для чтения

```html
<div class="rof">
  <span class="ds-label"><span class="ds-label__text">ID во внешней АС</span></span>
  <div class="rof__row">
    <span class="rof__value">123456789012</span>
    <span class="rof__icon rof__icon--interactive" role="button" tabindex="0" aria-label="Скопировать значение"><i data-icon="copy"></i></span>
  </div>
</div>
```
