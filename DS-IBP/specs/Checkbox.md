---
component: Checkbox
title: "Checkbox"
version: "1.006"
updated: "21.08.2026"
page: pages/atoms/Checkbox.html
css: styles/checkbox.css
deps: [label-helper]
status: auto
---

> Автоспека для быстрого контекста. Источник истины — CSS-файл и страница компонента. При изменении компонента обновляй эту спеку.

## Назначение
Чекбокс используется, когда доступен список опций и пользователю нужно выбрать одну или несколько из них. Три состояния выбора — Unselected / Selected / Indeterminate — и интерактивные состояния Default / Hover / Focus / Pressed / Disabled / Error.

## Инварианты
- Три состояния выбора взаимоисключающие: unselected/selected/indeterminate — не комбинировать одновременно.
- Активная область клика — весь `.cb` (метка+бокс), не только 16px визуальная метка.
- В группе (`.cb-group`) активная область растягивается на всю высоту строки, выравнивание всегда по левому краю.
- Error — независимая ось от состояния выбора: чекбокс может быть одновременно error и selected.
- Disabled гасит метку и текст цветом `--text-inactive` и блокирует клики на уровне всего `.cb`, не только input.

## Диагностика
- «Клик рядом с текстом не переключает чекбокс» → активная область должна быть весь `.cb`, не только `.cb__box`
- «У обязательного чекбокса нет звёздочки» → добавить `.cb__req` после лейбла

## Ключевые правила (из разделов страницы)
- **Использование** — Используйте чекбокс для обозначения и управления состоянием или свойством параметра, которое требует дополнительного подтверждения (например, кнопкой «Отправить» в формах).
- **Поведение · Описание работы** — Клик по названию или по самому чекбоксу приводит к его выбору или снятию выбора.
- **Анатомия** — Чекбокс состоит из обязательного бокса-метки и опциональных текстовых частей; в группе сверху может быть заголовок.
- **Размеры** — У чекбокса один размер. Геометрия бокса привязана к интерлиньяжу Body M (20px): видимый бокс — 16px в зоне выравнивания 20px, чтобы бокс центрировался по первой строке названия. Значения ниже измерены на живом экземпляре.
- **Размеры · Радиус скругления** — Один размер, один радиус. бокс — 2px (--radius-2xs).
- **Состояния** — Три состояния выбора по вертикали и интерактивные состояния по горизонтали. Состояния Hover, Focus, Pressed и Error добавлены к исходной матрице Default / DisabledНовое CSS реагирует на нативные `checked`/`indeterminate`/`disabled` на `.cb__input` напрямую (`:checked ~`, `:indeterminate ~`, `:disabled ~`) — классы `.cb--selected`/`--indeterminate`/`--disabled` не обязательны для реального контрола, нужны только для форс-состояний витрины (RulesAudit W1, 12.08.2026).
- **Варианты · Состав** — Чекбокс рендерится с названием, без названия (icon-only — например, в шапке таблицы) и с хелпером. Бокс всегда выровнен по первой строке текста.
- **Ошибка и валидацияНовое** — Состояние Error появляется, когда обязательный чекбокс не выбран при отправке формы, или когда группа не прошла валидацию. Бокс и хелпер окрашиваются в --error; рядом с обязательным названием ставится звёздочка. **Группа и обязательный выбор — две независимые опции**: чекбоксы можно сгруппировать без обязательности, а маркер обязательного выбора (.cb__req) — отдельная опция (на заголовке группы или на названии одиночного чекбокса).
- **Контент** — Текстовый контент чекбокса — название, опциональный хелпер и заголовок группы. Краткий свод правил (подробно — в разделах ниже):
- **Контент · Название чекбокса** — Название пишется с заглавной буквы, без знаков пунктуации в конце, и всегда располагается справа от чекбокса.
- **Контент · Заголовок группы** — Добавляйте заголовок к группе для ясности, если взаимосвязь пунктов неочевидна, или чтобы вынести в него повторяющиеся в пунктах слова. Заголовок пишется с заглавной буквы, начертанием Strong того же кегля, что и название.
- **Область клика и доступностьНовое** — Видимый бокс — 16px, но кликабельная область шире: она включает название и хелпер. В группе активная область чекбокса вытягивается на всю высоту строки, чтобы её было легче нажать. Управление возможно с клавиатуры: фокус показывается обводкой --primary, переключение — пробелом.
- **Типографика** — Название набирается гарнитурой SB Sans Text токеном --type-body-m, хелпер — --type-body-xs, заголовок группы — --type-h6-strong.
- **Цвета** — Компонент использует только семантические токены. Производные оттенки (hover) и state-слои вычисляются из --primary через color-mix.

## Для разработчиков (выжимка)

### Точные размеры (redline)

Таблица рендерится на странице через getComputedStyle. Точные значения — в CSS-файле компонента (см. `css:` в шапке).

### Разметка · HTML (эталонная реализация ДС)

```
<!-- чекбокс с названием и хелпером; бокс и текст — внутри <label> -->
<label class="cb cb--selected">
  <input type="checkbox" class="cb__input" checked>
  <span class="cb__box"><span class="cb__mark"><i data-icon="check"></i></span></span>
  <span class="cb__content">
    <span class="cb__label">Получать уведомления</span>
    <span class="ds-helper ds-helper--left">Не чаще раза в день</span>
  </span>
</label>

<!-- indeterminate (родитель группы): input.indeterminate = true, внутри «минус» -->
<label class="cb cb--indeterminate">…</label>

<!-- обязательный + ошибка: звёздочка у названия, aria-invalid -->
<label class="cb cb--error">
  <input type="checkbox" class="cb__input" required aria-invalid="true">
  <span class="cb__box"><span class="cb__mark"></span></span>
  <span class="cb__content"><span class="cb__label">Я принимаю условия<span class="cb__req">*</span></span></span>
</label>

<!-- группа: заголовок + пункты + ошибка уровня группы -->
<div class="cb-group" role="group" aria-labelledby="grp-t">
  <p class="cb-group__title" id="grp-t">Выберите каналы</p>
  <div class="cb-group__items">…</div>
  <p class="cb-group__error"><i data-icon="alert-triangle"></i><span>Нужно выбрать хотя бы один</span></p>
</div>
```

### Поведение · псевдокод (framework-agnostic)

```
// 1. Состояние выбора — три значения, отражаются на нативном input:
//    unselected → checked=false, indeterminate=false
//    selected   → checked=true
//    indeterminate → input.indeterminate=true (визуально «минус»)
//    indeterminate — только промежуточное состояние, не самостоятельное значение
//    CSS красит .cb__mark по :checked/:indeterminate/:disabled самого input —
//    класс .cb--selected/--indeterminate/--disabled не нужен для реального контрола

// 2. Клик по названию ИЛИ боксу переключает выбор (<label> оборачивает input)

// 3. Родитель ↔ дети (select all):
//    parent selected → все дети selected; parent unselected → все дети unselected
//    часть детей выбрана → parent = indeterminate
//    после клика по ребёнку пересчитать состояние родителя

// 4. Интерактивные состояния — чистый CSS (:hover / :active / :focus-visible);
//    hover: рамка primary + halo 4px; pressed: halo 6px
//    классы .cb--hover / .cb--focus / .cb--pressed — только для документации

// 5. Клавиатура: Tab фокусирует input, Space переключает;
//    :focus-visible → outline 2px --primary, offset 2px

// 6. Error: класс .cb--error (required не выбран при сабмите или группа
//    не прошла валидацию). Добавить aria-invalid="true";
//    сообщение об ошибке группы — .cb-group__error (Body XS, --error)

// 7. Disabled: input.disabled + .cb--disabled (pointer-events: none)
```

### Checkbox.types.ts

```
type CheckState = 'unselected' | 'selected' | 'indeterminate';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  state?: CheckState;             // по умолчанию 'unselected'
  label?: React.ReactNode;        // название справа от бокса
  helper?: React.ReactNode;       // подпись Body XS под названием
  required?: boolean;            // звёздочка * у названия
  error?: boolean;               // невалидно → красный бокс + aria-invalid
  disabled?: boolean;
  onChange?(next: CheckState): void;
}

interface CheckboxGroupProps {
  title?: React.ReactNode;        // заголовок группы (H6 Strong)
  error?: React.ReactNode;        // сообщение об ошибке уровня группы
  indent?: boolean;              // отступ дочерних (28px) под родителем
  children: React.ReactNode;      // Checkbox[]
}
```

### Справочник классов и атрибутов

| Класс / атрибут | На чём | Назначение |
|---|---|---|
| .cb | label | Корень: inline-flex, зазор 8px, выравнивание по верхней строке |
| .cb--unselected / --selected / --indeterminate | label | Состояние выбора (пустой / галочка / минус) |
| .cb--hover / --focus / --pressed | label | Форс-состояния — только для спецификаций в документации, не для продакшена |
| .cb--error | label | Невалидно: красный бокс и хелпер (--error); парой идёт aria-invalid |
| .cb--disabled | label | Отключено: pointer-events: none, текст/бокс в --disabled |
| .cb--no-content | label | Бокс без названия/хелпера (icon-only, напр. шапка таблицы) |
| .cb__input | input | Визуально скрытый нативный checkbox — фокус и доступность |
| .cb__box | span | Зона выравнивания 20px, центрирует бокс |
| .cb__mark | span | Видимый бокс 16px: рамка, фон, галочка/минус; все state-слои на нём |
| .cb__content | span | Колонка название + хелпер (зазор 2px) |
| .cb__label | span | Название (Body M) |
| .cb__req | span | Звёздочка обязательного поля (--error) |
| .ds-helper.ds-helper--left | span | Хелпер (Body XS) — общий компонент, см. Label / Helper |
| .cb-group | div | Контейнер группы (колонка); парой — role="group" + aria-labelledby |
| .cb-group__title | p | Заголовок группы (H6 Strong) |
| .cb-group__items | div | Колонка пунктов |
| .cb-group--indent | div | Отступ дочерних 28px (группа под родительским чекбоксом) |
| .cb-group__error | p | Сообщение об ошибке уровня группы (Body XS, --error) |
| aria-invalid / role="group" / aria-labelledby | input / div | Доступность: пометка ошибки и связь группы с её заголовком |
