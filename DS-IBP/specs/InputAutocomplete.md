---
component: InputAutocomplete
title: "InputAutocomplete"
version: "1.016"
updated: "06.09.2026"
page: pages/molecules/InputAutocomplete.html
page_js: scripts/input-autocomplete.page.js
runtime: scripts/ds-dropdownlist.js, scripts/ds-input.js
css: styles/input.css
deps: [label-helper, checkbox, chip, tooltip, dropdown-list]
status: curated
---

> Спека для быстрого контекста. Источник истины — styles/input.css, styles/dropdown-list.css и страница. При изменении обновляй эту спеку и блок в specs/_cheatsheet.md.

## Назначение
Поле-триггер + раскрывающийся под ним DropdownList. Пользователь вводит запрос, список фильтруется. Список содержит текстовые опции (одиночный выбор) или опции с чекбоксами (множественный). База `.inp` общая с InputText/InputDate; устройство списка — компонент Select · DropdownList.

## Инварианты
- Корень компонента объявляет парное `[hidden] { display: none }`: браузерное правило имеет специфичность (0,0,0) и приходит из UA-стиля, а `display` компонента — (0,1,0) и перебивает его, из-за чего атрибут `hidden` молча перестаёт работать. Соглашение ДС от 05.09.2026, охраняется правилом B11 линтера.
- Список опций — текстовые (одиночный выбор) ИЛИ с чекбоксами (множественный) — режимы не смешиваются в одном инстансе.
- Список подключается штатным рантаймом `scripts/ds-dropdownlist.js` (`DSDropdownList.bind(field, {...})`) — открытие/закрытие/фильтрация/клавиатура не пишутся заново на странице.
- Показ выбранного — сводка (`.inp__summary`) ИЛИ чипы в поле (`.inp__chips`) ИЛИ внешний стек (`.inp-ext`) — один способ на инстанс, не два одновременно.
- Ширина DropdownList под автокомплитом равна ширине поля-триггера (в отличие от самостоятельного DropdownList с собственной шириной).
- Крестик очистки и шеврон в `.inp__acts` могут быть одновременно (в отличие от Button, где это взаимоисключающая пара).
- **«+N» считает рантайм, а не разметка.** Чипы, не помещающиеся в ширину стека, скрываются атрибутом `hidden`, и последним встаёт чип-счётчик — `ds-input.js` пересчитывает его при изменении состава чипов и при изменении ширины поля (ResizeObserver). Раньше `+N` был нарисованным чипом в демо, а на живом поле `.inp__chips { overflow: hidden }` просто обрезал лишнее.
- Счётчик — `.chip--fit` с `data-inp-count`: без крестика удаления, целиком видимый, из числа значений исключён. Последнее видимое значение помечается `data-inp-last` и единственное из чипов сжимается — иначе одно длинное значение вытолкнуло бы счётчик за границу поля.
- **Тултип счётчика обязателен** (общее правило «+N», см. ReadOnlyField): по наведению и по фокусу перечисляет скрытые значения через запятую — иначе видно только их количество. Ставит `ds-input.js` (с 1.015), то же значение дублируется в `aria-label` («Ещё N: …»). Разметка тултипа строится заранее и передаётся в `DSTooltip.bind` параметром `tip` — привязка «по умолчанию» обернула бы счётчик в `.tip-anchor`, а на прямых детях `.inp__chips` завязаны и рантайм (перебор `children`, наблюдатель состава), и CSS (`.inp__chips .chip--fit:last-child`). `overflow: hidden` стека тултип не режет: на показе `ds-tooltip.js` уносит его в общий слой `DSFloat`.
- Тултип на усечённой подписи самого значения — правило Chip, его держит `ds-chip.js`; поле его не дублирует.
- Крестик очистки поля — общее правило семейства, см. InputText (виден только при наличии значения; чипы считаются значением).

## Диагностика
- «Список открывается своей ширины, не по полю» → DropdownList должен наследовать ширину триггера, не `--ddl-min/max`
- «Выбранные значения показаны и чипами, и сводкой одновременно» → оставить один способ показа на инстанс
- «Чипы обрезаются краем поля, счётчика «+N» нет» → не подключён `scripts/ds-input.js`, либо поле помечено `data-input-static`
- «Счётчик «+N» вылезает за границу поля» → последнему видимому чипу не досталось `data-inp-last`; сжимается именно он, остальные чипы `flex: none`
- «У счётчика «+N» нет тултипа со скрытыми значениями» → рантайм старше 1.015: тултипов поле не навешивало вовсе, у счётчика был только `aria-label`
- «После появления тултипа сломался счёт чипов / «+N» задвоился» → тултип счётчика привязан обычным `DSTooltip.bind(counter)` без параметра `tip`: обёртка `.tip-anchor` встала прямым ребёнком `.inp__chips`, и перебор `children` перестал видеть чипы

## Ключевые правила (из разделов страницы)
- **Использование** — выбор из большого справочника с поиском; множественный выбор с чипами/сводкой; допустим свободный ввод (action-строка). Мало вариантов без поиска → Select; свободный текст → InputText.
- **Анатомия** — Label · поле-триггер (сводка/чипы + `input.inp__control` + действия: крестик · шеврон) · DropdownList · опц. внешний стек чипов `.inp-ext`.
- **Варианты** — Показ выбора: сводка `.inp__summary` / чипы в поле `.inp__chips` / внешний стек `.inp-ext`. Наполнение списка: текст / чекбоксы (`ddl__item--checkbox`). Table Edit (размер S, только сводкой).
- **Размеры** — M / S (Table Edit). Чип в поле на размер меньше поля: M→чип S (24px), S→чип XS (20px).
- **Размеры · Радиус скругления** — Радиус поля одинаков в M и S; вложенные элементы сохраняют свои радиусы. поле M и S — 4px (--radius-field) · чип S/XS — 6px (--radius-control-s) · панель списка — 12px (--radius-popup).
- **Контент** — плейсхолдер = приглашение к поиску; сводка «первое, +N»; подсветка совпадения `.ddl__match`; текст чипа обрезается (тултип); системные строки списка — по DropdownList.
- **Поведение** — раскрытие при фокусе/по шеврону, ширина списка = ширине поля, авто-разворот; фильтрация с подсветкой; одиночный выбор закрывает список, множественный — нет; чипы: крестик/повтор удаляет, Backspace в пустом поле — последний; переполнение поля → чип-счётчик «+N» (без крестика удаления; по клику раскрывает полный список).
- **Состояния** — Default/Hover/Focus/Error/ErrorFocus/Warning/WarningFocus/Disabled (поле-триггер). ПРАВИЛО: текст ошибки/предупреждения по умолчанию НЕ в хелпере — только в тултипе при *Focus; тултип не смещает хелпер (position:absolute, z-index выше поля). Состояния опций — на странице DropdownList.
- **Доступность** — поле `role="combobox"` + `aria-expanded`/`aria-controls`; список `role="listbox"` (+ `aria-multiselectable`); опции `role="option"` + `aria-selected`/`aria-checked`; `aria-activedescendant`; чипы и шеврон озвучены.
- **Типографика** — ввод/сводка SB Sans Text (M — Body M, S — Body S); чипы по своим токенам (S/XS); опции Body M, helper/группа Body XS.
- **Цвета** — поле = токены InputText (иконки шеврон/крестик — Active · `--secondary`, hover → `--secondary-dark`); список: фон `--bg-popup`, hover `--tertiary-light`, выбранная строка `--bgtable-row-focus`, подсветка `--primary`.

## Для разработчиков (выжимка)

### Точные размеры (redline)
Рендерится на странице через getComputedStyle с живых поля и списка. Источник — input.css и dropdown-list.css. Поле M 40px / S 32px; чип S 24px / XS 20px; опция списка 40px (52px с helper); радиус списка `--radius-popup` 12px.

### Разметка · HTML (эталонная реализация ДС)

```
<div class="inp is-open">
  <label class="ds-label" for="ac"><span class="ds-label__text">Контрагент</span></label>
  <div class="inp__field" role="combobox" aria-expanded="true" aria-controls="ac-list">
    <span class="inp__chips"><span class="chip chip--edit chip--s"><span class="chip__label">Value 1</span><span class="chip__remove" role="button">…✕…</span></span></span>
    <input class="inp__control" id="ac" placeholder="Поиск…">
    <span class="inp__acts">
      <button class="inp__act" aria-label="Очистить">…✕…</button>
      <button class="inp__act inp__act--chev" aria-label="Показать список">…⌄…</button>
    </span>
  </div>
  <div id="ac-list" class="ddl ddl--floating ddl--scroll" role="listbox" aria-multiselectable="true">
    <button class="ddl__item ddl__item--checkbox" role="option" aria-checked="true">…</button>
    <button class="ddl__item" role="option"><span class="ddl__item-label">Дол<span class="ddl__match">лар</span></span></button>
  </div>
  <!-- Chips Ext: <div class="inp-ext" role="group">…чипы…</div> вместо .inp__chips -->
</div>
```

### Поведение · псевдокод (framework-agnostic)
```
// раскрытие: фокус/шеврон → открыть, список примыкает к полю вплотную (отступ 0), ширина = ширине поля, авто-разворот вверх
// фильтрация: дебаунс, фильтр опций, подсветка .ddl__match; пусто → ddl__state--empty
// одиночный: клик → значение в поле, закрыть. множественный: клик → toggle чекбокс+чип, НЕ закрывать
// чипы: крестик/повтор — удалить; Backspace в пустом поле — последний; переполнение → «+N»
// клавиатура: ↓/↑ активная опция (aria-activedescendant), Enter — выбор, Esc — закрыть
```

### Справочник классов и атрибутов

| Класс/атрибут | Назначение |
|---|---|
| `.inp / --m / --s / --error / --warning / --disabled` | база поля — общая с InputText |
| `.inp.is-open` | список раскрыт; поворачивает шеврон |
| `.inp__summary` | сводка выбора «Value 1, +4» |
| `.inp__chips` | стек чипов в поле; overflow → «+N» |
| `.inp-ext` | внешний стек чипов под полем (Chips Ext) |
| `.inp__act--chev` | шеврон раскрытия; поворот в `.is-open` |
| `.chip.chip--edit.chip--s / --xs` | чип выбранного значения (см. Chip) |
| `.ddl / .ddl__item / .ddl__item--checkbox / .ddl__match` | DropdownList (см. Select) |
| `role="combobox"/listbox/option` · `aria-expanded/-controls/-multiselectable/-selected/-checked` | доступность |
