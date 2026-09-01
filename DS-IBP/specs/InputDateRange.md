---
component: InputDateRange
title: "InputDateRange"
version: "1.006"
updated: "21.08.2026"
page: pages/molecules/InputDateRange.html
page_js: scripts/input-date-range.page.js
css: styles/input-range.css
deps: [input, label-helper, tooltip]
status: curated
---

> Спека для быстрого контекста. Источник истины — styles/input-range.css + styles/input.css и страница. При изменении обновляй эту спеку и блок в specs/_cheatsheet.md.

## Назначение
Поле ввода диапазона дат: два InputDate с префиксами «От» / «До», размещённых горизонтально и соединённых линией Range_Line, с общей меткой сверху и общим хелпером снизу. При фокусе на поле поднимается DatePicker. Каждое поле — самостоятельный экземпляр `.inp` со своими состояниями.

## Инварианты
- Минимальная ширина поля — 186px (дата + иконки крестика и календаря); меньше не сжимается.
- Календарь у каждого поля самоподключается независимо через `ds-datepicker.js`, как у одиночного InputDate.
- Поля независимы — состояния/ошибки не связаны, кроме логики диапазона (конец не раньше начала).
- Только размер M — размера S нет.

## Диагностика
- «Поле диапазона дат обрезает иконки при сужении» → `.inp-range--date .inp-range__field{min-width:186px}` не должен переопределяться

## Ключевые правила (из разделов страницы)
- **Использование** — диапазон дат «с … по …» в фильтрах/формах (период сделки, срок действия, окно отчётности); одно поле может быть пустым (открытая граница). Одиночная дата → InputDate; числовой диапазон → InputAmountRange.
- **Анатомия** — Label (общая) · два InputDate с префиксом «От»/«До» · Range_Line между ними · Helper (опц.). У каждого поля мин. ширина 186px (контент даты + иконки крестика и календаря). В полях всегда есть префикс. Толщина/цвет Range_Line = бордер инпута (1px, `--border-primary`).
- **Варианты** — С хелпером/без · Наполнение (пусто / одно поле / оба).
- **Размеры** — только M (высота поля 40px, Body M). Размера S нет. Мин. ширина поля 186px; общую ширину задаёт контейнер.
- **Размеры · Радиус скругления** — Единственный размер M, радиус как у InputText. поля «от» и «до» — 4px (--radius-field) · календарь — 8px (--radius-m).
- **Контент** — префикс «От»/«До» неизменяем и всегда присутствует; маска `ММ.ДД.ГГГГ` (единый шаблон на экране); пустое поле показывает маску как плейсхолдер; метка-существительное; хелпер = правило (в Error → текст ошибки).
- **Поведение** — плейсхолдер-маска до Focus; очищенное поле по blur → пустое. Вводятся цифры, точки автоматически; DatePicker при фокусе и по кнопке-календарю. Поля независимы: hover/focus/error одного поля не влияют на другое; оба поля могут быть в ошибке одновременно.
- **Состояния** — Default/Hover/Focus/Error/ErrorFocus/Warning/WarningFocus/Disabled — на каждом поле независимо. ПРАВИЛО: текст ошибки/предупреждения по умолчанию НЕ в хелпере — только в тултипе при *Focus; тултип не смещает хелпер (position:absolute, z-index выше поля). helperError:true — намеренное исключение.
- **Доступность** — метка/хелпер связаны через `label`/`aria-describedby`; `aria-invalid` только на невалидном поле; кнопка-календарь — button с `aria-haspopup="dialog"`; Range_Line — `aria-hidden="true"`; поля озвучиваются отдельно.
- **Типографика** — значение и префикс SB Sans Text с табличными цифрами маски (Body M); Label/Helper — Body XS.
- **Цвета** — токены InputDate; Range_Line = `--border-primary`, в Disabled = `--border-light`. Иконки (календарь/крестик) — Active · `--secondary`, hover → `--secondary-dark`.

## Для разработчиков (выжимка)

### Точные размеры (redline)
Рендерится на странице через getComputedStyle. Источник — styles/input.css + styles/input-range.css. Поле: высота 40px / паддинг 12px / gap 8px / радиус `--radius-field` / иконки 20px / мин. ширина 186px. Range_Line: зона 14px, линия 1px.

### Разметка · HTML (эталонная реализация ДС)

```
<div class="inp-range inp-range--date">
  <label class="ds-label"><span class="ds-label__text">Период сделки</span></label>
  <div class="inp-range__row">
    <div class="inp inp-range__field">
      <div class="inp__field">
        <span class="inp__prefix">От</span>
        <input class="inp__control" inputmode="numeric" placeholder="ММ.ДД.ГГГГ">
        <span class="inp__acts">
          <button class="inp__act" aria-label="Очистить поле">…✕…</button>
          <button class="inp__act" aria-label="Открыть календарь" aria-haspopup="dialog">…📅…</button>
        </span>
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
// каждое поле — независимый InputDate со своим статусом
// маска: цифры + автоточки после 2-го и 4-го знака; Backspace удаляет цифру+разделитель
// DatePicker: открыть при фокусе/по кнопке; выбор → значение, закрыть, фокус в поле
// валидация from<=to (если обе даты) → ошибка на невалидном поле; оба могут быть в ошибке
// плейсхолдер-маска до Focus; очищенное по blur → пустое; префикс «От»/«До» всегда присутствует
```

### Справочник классов и атрибутов

| Класс/атрибут | Назначение |
|---|---|
| `.inp-range / --m / --date` | корень диапазона дат: метка + строка полей + хелпер |
| `.inp-range--disabled` | весь диапазон заблокирован; красит Range_Line как бордер disabled |
| `.inp-range__row` | горизонтальная строка: поле · Range_Line · поле |
| `.inp-range__field` | поле — экземпляр `.inp.inp--m`, мин. ширина 186px |
| `.inp-range__line` | Range_Line; `aria-hidden="true"`, 1px, цвет `--border-primary` |
| `.inp__prefix` | префикс «От»/«До», всегда присутствует |
| `.inp__act[aria-label="Открыть календарь"]` | кнопка-календарь каждого поля, всегда последняя |
| `.inp--error / --warning / --disabled` | статус на каждом поле независимо (см. InputDate) |
