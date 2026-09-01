---
component: LabelHelper
title: "Label / Helper"
version: "1.004"
updated: "12.08.2026"
page: pages/atoms/LabelHelper.html
page_js: scripts/label-helper.page.js
css: styles/label-helper.css
deps: [checkbox, radio, switch, icon-button]
status: auto
---

> Автоспека для быстрого контекста. Источник истины — CSS-файл и страница компонента. При изменении компонента обновляй эту спеку.

## Назначение
Общие вспомогательные текстовые слоты, вынесенные из нескольких родительских компонентов в отдельную группу. Label подписывает поле ввода, Helper поясняет назначение или ограничение контрола. Оба переиспользуются в разных компонентах, но не имеют собственного визуального контейнера.

## Инварианты
- Не самостоятельные компоненты — нет своего контейнера, не выводятся на экран без родителя.
- Выравнивание (left/right) Label и Helper всегда синхронизировано в паре — не задавать им разное направление у одного родителя.
- Ошибка — только у Helper (`--error`, опц. иконка); у Label собственного состояния ошибки нет.
- Иконки в Label — редкий кейс, IconButton S сжимается до 16px под высоту строки Body XS.

## Диагностика
- «Label и Helper выровнены в разные стороны» → привести оба к одному направлению (`--left`/`--right`)
- «Ошибка не видна» → она рендерится только в Helper (`.ds-helper--error`), не в Label

## Ключевые правила (из разделов страницы)
- **Использование** — Label и Helper — два переиспользуемых текстовых слота, которые каждый компонент подключает по необходимости:
- **Использование · Правило зависимости** — Label и Helper — не самостоятельные компоненты дизайн-системы. У них нет собственного узнаваемого контейнера: вне контекста родителя их невозможно опознать на экране. Публикуются только как часть композиции Checkbox, Radiobutton, Switch или полей ввода.
- **Использование · Используется в компонентах** — Каждый слот переиспользуется независимо — компонент может задействовать только Helper, только Label, или ни одного из них.
- **Анатомия** — Оба слота набираются одним и тем же типографским токеном Body XS и отличаются только цветом и составом; выравнивание задаётся одной общей настройкой на оба слота.
- **Размеры** — У Label и Helper нет собственной шкалы размеров — оба слота всегда набираются одним и тем же токеном Body XS, независимо от размера родительского компонента. Значения ниже измерены на живом экземпляре.
- **Контент · Label** — Подпись над полем ввода. Используется в InputText, InputAutocomplete, InputDate, ReadOnlyField. Может содержать одну или две дополнительные иконки любого назначения (редкий кейс) — каждая иконка рендерится как IconButton размера S, тон neutral, с обязательным aria-label.
- **Контент · Helper** — Пояснительный текст под контролом или полем. Используется в Checkbox, Radiobutton, Switch, InputText, InputAutocomplete, InputDate, ReadOnlyField, а также как вторая строка опции в Select · DropdownList. Выравнивание задаётся одной настройкой на всю пару — Label и Helper одного поля всегда идут в одной ориентации: left — базовое, right — когда этого требует ориентация родителя (например, поле с выравниванием значения по правому краю).
- **Состояния** — Оба слота синхронизированы с состоянием родительского компонента: Default и Disabled — у обоих слотов, Error — только у Helper: Label визуально не меняется при ошибке родителя — сообщение об ошибке несёт только Helper.
- **Контент** — Текстовые правила для обоих слотов:
- **Использование · Композиция с родителем** — Одни и те же слоты выглядят одинаково независимо от родителя — меняется только то, что их окружает.
- **Типографика** — Label и Helper набираются одним токеном --type-body-xs — различие только в цвете.
- **Цвета** — Компонент использует только семантические токены текста и ситуативные токены ошибки.
- **Доступность** — Label и Helper — вспомогательный текст, который должен быть программно связан с элементом управления, а не просто визуально расположен рядом.

## Для разработчиков (выжимка)

### Таблица

| Параметр | Значение |
|---|---|

### Разметка · HTML (поле с Label + Helper в состоянии Error)

```
<label class="ds-label" for="field-inn">
  <span class="ds-label__text">ИНН контрагента</span>
</label>

<input id="field-inn" aria-describedby="field-inn-helper" aria-invalid="true" />

<span id="field-inn-helper" class="ds-helper ds-helper--left ds-helper--error ds-helper--with-icon" role="alert">
  <span class="ds-helper__icon" aria-hidden="true"><i data-icon="alert-triangle"></i></span>
  <span class="ds-helper__text">Нужно 10 или 12 цифр</span>
</span>
```

### Поведение · псевдокод (framework-agnostic)

```
// 1. Генерировать общий id для пары поле↔helper (например useId() в React) —
//    не хардкодить строку, чтобы избежать коллизий при повторном использовании формы

// 2. label[for] ИЛИ обёртка … — оба варианта равнозначны,
//    не делайте и то и другое одновременно (двойное объявление связи)

// 3. При status === 'error': aria-invalid="true" на поле, role="alert" на Helper —
//    текст должен реально измениться (React/DOM diff), чтобы alert прозвучал повторно

// 4. Иконка Error — всегда aria-hidden, смысл несёт исключительно текст Helper
```

### LabelHelper.types.ts

```
type LabelHelperAlign = 'left' | 'right';   // общий тип — задаётся один раз на пару

interface LabelIcon {
  icon: React.ReactNode;                // любой глиф — на усмотрение конкретного поля
  interactive?: boolean;             // true → нужен onAction + aria-label
  onAction?(): void;
  'aria-label'?: string;               // обязателен, если interactive=true
}

interface LabelProps {
  text: string;
  icons?: LabelIcon[];                  // 0–2 элемента, редкий кейс
  disabled?: boolean;
}

interface HelperProps {
  text: React.ReactNode;
  status?: 'default' | 'error' | 'disabled';
  withIcon?: boolean;                    // только при status='error'
}

// align — общий проп родителя, применяется сразу к label и helper;
// не должно быть независимого align на каждом из слотов
interface InputTextProps {
  align?: LabelHelperAlign;              // по умолчанию 'left'
  label?: LabelProps;
  helper?: HelperProps;
  // … остальные пропсы поля
}
```

### Таблица

| Класс / атрибут | На чём | Назначение |
|---|---|---|
| .ds-label | label/span | Подпись; for связывает с полем |
| .ds-label__text | span | Текст — обрезается многоточием, не переносится |
| .ds-label--right | label | Выравнивание вправо (left — база, класса нет). Выравнивание — общее с Helper той же пары, задаётся синхронно |
| .ds-label__icons .is-action | span | Иконка (0–2, любое назначение) — IconButton S neutral (классы .ibtn .ibtn--s .ibtn--neutral), aria-label обязателен |
| .ds-label--disabled | label | Цвет — --text-inactive |
| .ds-helper | span | Пояснение; id + aria-describedby на поле |
| .ds-helper--left / --right | span | Выравнивание — по ориентации родителя |
| .ds-helper--error | span | Цвет --error; добавляйте role="alert" |
| .ds-helper--with-icon | span | Иконка предупреждения перед текстом (только Error) |
| .ds-helper__icon | span | Декоративная — aria-hidden="true" |
