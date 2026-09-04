---
component: InputAmountRange
title: "InputAmountRange"
version: "1.005"
updated: "21.08.2026"
page: pages/molecules/InputAmountRange.html
page_js: scripts/input-amount-range.page.js
css: styles/input-range.css
deps: [input, label-helper, tooltip]
status: curated
---

> Спека для быстрого контекста. Источник истины — styles/input-range.css + styles/input.css и страница. При изменении обновляй эту спеку и блок в specs/_cheatsheet.md.

## Назначение
Поле ввода числового диапазона: два InputAmount с префиксами «От» / «До», размещённых горизонтально и соединённых линией Range_Line, с общей меткой сверху и общим хелпером снизу. Каждое поле — самостоятельный экземпляр `.inp` со своими состояниями.

## Инварианты
- Только размер M (40px) — размера S нет.
- Поля независимы — hover/focus/error одного не влияют на другое; оба могут быть в ошибке одновременно.
- Range_Line — декоративная линия между полями (`::before`), не интерактивна, не участвует в фокусе/табе.
- В Disabled линия светлеет вместе с бордерами полей — единое визуальное состояние диапазона.

## Диагностика
- «Фокус одного поля окрашивает оба» → состояния должны быть заданы на каждом `.inp` отдельно, не на общем `.inp-range`

## Ключевые правила (из разделов страницы)
- **Использование** — числовой диапазон «от … до …» в фильтрах/формах (сумма, лимит, объём); одно поле может быть пустым (открытая граница). Одиночное число → InputAmount; диапазон дат → InputDateRange; выбор из списка → InputAutocomplete.
- **Анатомия** — Label (общая) · два InputAmount с префиксом «От»/«До» · Range_Line между ними · Helper (опц.). В полях всегда есть префикс. Толщина/цвет Range_Line = бордер инпута (1px, `--border-primary`).
- **Варианты** — С хелпером/без · Наполнение (пусто / одно поле / оба).
- **Размеры** — только M (высота поля 40px, Body M). Размера S нет. Ширину задаёт контейнер, поля делят её поровну.
- **Размеры · Радиус скругления** — Единственный размер M, радиус как у InputText. поля «от» и «до» — 4px (--radius-field).
- **Контент** — префикс «От»/«До» неизменяем и всегда присутствует; пустое поле остаётся без плейсхолдера; метка-существительное с единицей; хелпер = правило (в Error → текст ошибки).
- **Поведение** — правила InputAmount (фильтр `[0-9.,-]`, `.`→`,`, группировка по 3, обрезка нулей на blur). Поля независимы: hover/focus/error одного поля не влияют на другое; оба поля могут быть в ошибке одновременно. Крестик — только у заполненного поля.
- **Состояния** — Default/Hover/Focus/Error/ErrorFocus/Warning/WarningFocus/Disabled — на каждом поле независимо. ПРАВИЛО: текст ошибки/предупреждения по умолчанию НЕ в хелпере — только в тултипе при *Focus; тултип не смещает хелпер (position:absolute, z-index выше поля). helperError:true — намеренное исключение.
- **Доступность** — метка/хелпер связаны через `label`/`aria-describedby`; `aria-invalid` только на невалидном поле; Range_Line — `aria-hidden="true"`; поля озвучиваются отдельно.
- **Типографика** — значение и префикс SB Sans Text с табличными цифрами (Body M); Label/Helper — Body XS.
- **Цвета** — токены InputAmount; Range_Line = `--border-primary`, в Disabled = `--border-light`. Иконки в поле — Active · `--secondary`, hover → `--secondary-dark`.

## Для разработчиков (выжимка)

### Точные размеры (redline)
Рендерится на странице через getComputedStyle. Источник — styles/input.css + styles/input-range.css. Поле: высота 40px / паддинг 12px / gap 8px / радиус `--radius-field` / иконки 20px. Range_Line: зона 14px, линия 1px.

### Разметка · HTML (эталонная реализация ДС)

```
<div class="inp-range">
  <label class="ds-label"><span class="ds-label__text">Сумма, RUB</span></label>
  <div class="inp-range__row">
    <div class="inp inp-range__field">
      <div class="inp__field">
        <span class="inp__prefix">От</span>
        <input class="inp__control" inputmode="decimal">
        <span class="inp__acts"><button class="inp__act" aria-label="Очистить поле">…✕…</button></span>
      </div>
    </div>
    <span class="inp-range__line" aria-hidden="true"></span>
    <div class="inp inp-range__field">…префикс «До»…</div>
  </div>
  <span class="ds-helper ds-helper--left">Helper</span>
</div>
```

### Поведение · псевдокод (framework-agnostic)
```
// каждое поле — независимый InputAmount со своим статусом
// фильтр [0-9.,-]; '.'→','; группировка по 3; на blur обрезать нули/децималы
// валидация from<=to (если оба заполнены) → ошибка на невалидном поле; оба могут быть в ошибке
// крестик — только у заполненного поля; префикс «От»/«До» всегда присутствует
```

### Справочник классов и атрибутов

| Класс/атрибут | Назначение |
|---|---|
| `.inp-range / --m` | корень диапазона: метка + строка полей + хелпер |
| `.inp-range--disabled` | весь диапазон заблокирован; красит Range_Line как бордер disabled |
| `.inp-range__row` | горизонтальная строка: поле · Range_Line · поле |
| `.inp-range__field` | поле — экземпляр `.inp.inp--m`, гибкая ширина (min-width от контента) |
| `.inp-range__line` | Range_Line; `aria-hidden="true"`, 1px, цвет `--border-primary` |
| `.inp__prefix` | префикс «От»/«До», всегда присутствует |
| `.inp--error / --warning / --disabled` | статус на каждом поле независимо (см. InputText) |
