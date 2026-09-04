---
component: InputText
title: "InputText"
version: "1.009"
updated: "21.08.2026"
page: pages/molecules/InputText.html
page_js: scripts/input-text.page.js
css: styles/input.css
deps: [label-helper, tooltip, chip]
status: curated
---

> Спека для быстрого контекста. Источник истины — styles/input.css и страница. При изменении компонента обновляй эту спеку и блок в specs/_cheatsheet.md.

## Назначение
Базовое поле ввода произвольного текста. Собирается из компонентов подкачки LabelHelper (метка + хелпер) и Input_Content (поле с рамкой: текстовый слой + действия). База `.inp` общая для InputText / InputDate / InputAutocomplete. На той же основе — числовой InputAmount.

## Инварианты
- Текст ошибки/предупреждения показывается только в тултипе при *Focus (`.inp__box > .tip`), не дублируется в хелпере под полем.
- Очистка (`.inp__act[aria-label="Очистить поле"]`) скрывается целиком в Disabled — сброса значения быть не может.
- Фокус всегда даёт бордер 2px + halo-тень независимо от состояния error/warning — общий паттерн `*-focus`.
- Счётчик символов (`.inp__counter`) красится в error только при достижении лимита (`--limit`), не раньше.
- Многострочный вариант (`--multiline`) выравнивает действия по верхнему краю поля, не по центру.

## Диагностика
- «Ошибка показана и в хелпере, и в тултипе одновременно» → убрать текст ошибки из хелпера, оставить только тултип на фокусе
- «Крестик очистки виден на disabled-поле» → должен скрываться правилом `.inp--disabled .inp__act[aria-label="Очистить поле"]`

## Ключевые правила (из разделов страницы)
- **Использование** — свободный текст (наименование, комментарий, реквизит); числа — InputAmount; редактирование в ячейке — размер S (Table Edit). Выбор из справочника → InputAutocomplete/Select; дата → InputDate; показ без ввода → ReadOnlyField.
- **Анатомия** — Label · поле Input_Content (иконка слева `.inp__lead` (любая из библиотеки ДС, не только поиск) · префикс · `input.inp__control` · постфикс · действия `.inp__acts`) · Helper. Всё кроме поля опционально. Порядок действий слева направо: информер → крестик очистки (в пароле — «показать/скрыть» вместо крестика, информер всегда левее).
- **Варианты** — Текстовый слой (префикс/постфикс/иконка слева/иконка справа) · Многострочный (`--multiline`, textarea; опциональный resize по вертикали — `--resizable`, тянуть за правый нижний угол) · InputAmount (числовой) · Пароль (`--password`, действие «показать/скрыть» вместо крестика) · Ограничение длины (`maxLength` → счётчик `.inp__counter` справа под полем, Body XS) · Table Edit (размер S, без label/helper).
- **Размеры** — M (высота 40px, текст Body M) — основной; S (32px, Body S) — только Table Edit. Ширину задаёт контейнер.
- **Размеры · Радиус скругления** — Радиус поля не зависит от размера; поля — единственная группа контролов на 4px. поле M и S — 4px (--radius-field) · кнопка-действие в поле — 4px (--radius-xs) · textarea — inherit.
- **Контент** — метка-существительное без двоеточия; плейсхолдер = формат/пример, не дублирует метку; хелпер = правило (в Error → текст ошибки); префикс/постфикс — неизменяемые единицы.
- **Поведение** — плейсхолдер исчезает при вводе (не при фокусе); крестик только у заполненного поля; очищенное поле по blur возвращается в пустое; многострочный растёт по высоте.
- **Состояния** — Default/Hover/Focus/Error/ErrorFocus/Warning/WarningFocus/Disabled. Фокус — бордер 2px `--primary` + кольцо `--primary-bg-light`; `box-sizing:border-box` держит габариты. ПРАВИЛО: текст ошибки/предупреждения по умолчанию НЕ в хелпере — только в тултипе при *Focus; тултип не смещает хелпер (position:absolute, z-index выше поля). helperError:true — намеренное исключение.
- **Доступность** — `label[for]`, `aria-describedby`, `aria-invalid="true"`; ошибка не только цветом; крестик — button с aria-label.
- **Типографика** — значение SB Sans Text (M — Body M, S — Body S); Label/Helper — Body XS.
- **Цвета** — фон `--bg-tile`, рамка `--border-primary`, hover/focus `--primary` (+ тень `--primary-bg-light`), Error `--error`, Warning `--warning`, disabled `--st-disabled-light`,плейсхолдер/префикс/постфикс `--text-inactive`. Иконки в поле (ведущая + действия) — Active · `--secondary`, hover → `--secondary-dark`.

## Для разработчиков (выжимка)

### Точные размеры (redline)
Таблица рендерится на странице через getComputedStyle с живого экземпляра. Источник — styles/input.css. M: высота 40px, паддинг 12px, gap 8px, радиус `--radius-field` (4px). S: 32px / 10px / 6px / иконки 18px.

### Разметка · HTML (эталонная реализация ДС)

```
<div class="inp">
  <label class="ds-label" for="inn"><span class="ds-label__text">ИНН</span></label>
  <div class="inp__field">
    <span class="inp__lead">…search…</span>
    <span class="inp__prefix">От</span>
    <input class="inp__control" id="inn" aria-describedby="inn-h">
    <span class="inp__postfix">RUB</span>
    <span class="inp__acts">
      <button class="inp__act" aria-label="Очистить поле">…✕…</button>
      <button class="inp__act inp__act--static" aria-label="Подсказка">…ⓘ…</button>
    </span>
  </div>
  <span class="ds-helper ds-helper--left" id="inn-h">10 или 12 цифр</span>
</div>
```

### Поведение · псевдокод (framework-agnostic)
```
// крестик очистки — только когда поле непустое и не disabled; в Disabled не показывается; клик → очистить + фокус + onChange('')
// плейсхолдер исчезает при вводе; очищенное по blur → пустое состояние
// Error/Warning: тултип с текстом при фокусе поля, скрыть по blur
// InputAmount: фильтр [0-9.,-]; '.'→','; группировка целой части по 3; на blur обрезать нули/децималы
// Пароль: type='password' → 'text' по клику на действии справа (иконка visibility-on/off), крестика очистки нет
// Счётчик символов: при заданном maxLength показывать «n / max» справа под полем, обновлять на каждом вводе
// многострочный: авторост textarea по scrollHeight до max, затем внутренний скролл; с --resizable — вручную resize по вертикали за правый нижний угол
```

### Справочник классов и атрибутов

| Класс/атрибут | Назначение |
|---|---|
| `.inp` | корень: метка + поле + хелпер; ширина от контейнера |
| `.inp--m` / `.inp--s` | размер 40px / 32px (S — только Table Edit) |
| `.inp--error` / `--warning` / `--disabled` | статусы |
| `.inp--multiline` | многострочный (textarea) |
| `.is-hover` / `.is-focus` / `.is-open` | форсированные состояния |
| `.inp__field` | Input_Content: рамка, радиус, фон, flex-строка |
| `.inp__lead` | иконка поиска |
| `.inp__prefix` / `.inp__postfix` | неизменяемые части значения |
| `.inp__control` | нативный input/textarea; placeholder, id, aria-* |
| `.inp__acts` / `.inp__act` | группа действий / действие-иконка; `--static` — информер |
| `.ds-label` / `.ds-helper` | метка и хелпер (LabelHelper) |
