---
component: InputDate
title: "InputDate"
version: "1.009"
updated: "21.08.2026"
page: pages/molecules/InputDate.html
page_js: scripts/input-date.page.js
css: styles/input.css
deps: [label-helper, tooltip]
status: curated
---

> Спека для быстрого контекста. Источник истины — styles/input.css и страница. При изменении обновляй эту спеку и блок в specs/_cheatsheet.md.

## Назначение
Поле ввода даты: маска ММ.ДД.ГГГГ (в placeholder) + кнопка-календарь, поднимающая DatePicker (рантайм `scripts/ds-datepicker.js`, модуль `openPicker`, автоподключение по кнопке-календарю). База `.inp` общая с InputText — состояния и размеры общие.

## Инварианты
- База `.inp` общая с InputText — токены и состояния наследуются целиком, отдельного визуального языка у поля даты нет.
- Календарь самоподключается по `.inp__act[aria-label="Открыть календарь"]` через рантайм `ds-datepicker.js` — кнопке не нужен отдельный обработчик в разметке экрана.
- Маска-плейсхолдер (ММ.ДД.ГГГГ) — только placeholder, не значение; цвет `--text-inactive`, пока поле пустое.
- Разворот шеврона/действий поля реагирует на `aria-expanded`/`.is-open` на `.inp`, не на отдельный класс на кнопке.

## Диагностика
- «Календарь не открывается по клику на кнопку» → кнопка должна иметь `aria-label="Открыть календарь"` — по нему рантайм биндит `ds-datepicker.js`
- «Маска выглядит как введённое значение» → это должен быть `placeholder`, не `value`

## Ключевые правила (из разделов страницы)
- **Использование** — ввод конкретной даты (подписание, транш, план); редактирование даты в ячейке — размер S. Диапазон — два InputDate «От»/«До». Текст → InputText; справочник → InputAutocomplete.
- **Анатомия** — Label · поле (значение/маска + действия: информер опц. · крестик очистки · календарь) · Helper. Порядок слева направо: информер → крестик → календарь; информер всегда левее крестика; календарь всегда последний.
- **Варианты** — С хелпером/без · Информер (опц., по умолчанию нет) · Table Edit (размер S, с иконкой поиска слева, без label/helper).
- **Размеры** — M (40px, Body M) — основной; S (32px, Body S) — только Table Edit. Ширину задаёт контейнер.
- **Размеры · Радиус скругления** — Радиус поля одинаков в M и S. поле M и S — 4px (--radius-field) · календарь — 8px (--radius-m).
- **Контент** — маска ММ.ДД.ГГГГ (шаблон единый на экране); пустое поле показывает маску как плейсхолдер; метка-существительное; хелпер = правило (в Error → ошибка).
- **Поведение** — вводятся только цифры, точки-разделители автоматически; Backspace удаляет цифру с разделителем; DatePicker открывается при фокусе и по кнопке-календарю; выбор даты пишет значение и закрывает.
- **Состояния** — Default/Hover/Focus/Error/ErrorFocus/Warning/WarningFocus/Disabled. Фокус — бордер 2px. ПРАВИЛО: текст ошибки/предупреждения по умолчанию НЕ в хелпере — только в тултипе при *Focus; тултип не смещает хелпер (position:absolute, z-index выше поля). Исключение — намеренно при разработке.
- **Доступность** — `label[for]`, `aria-describedby`, `aria-invalid`; кнопка-календарь — button с aria-label и `aria-haspopup="dialog"`; дата вводима с клавиатуры без календаря; `inputmode="numeric"`.
- **Типографика** — значение SB Sans Text с табличными цифрами (M — Body M, S — Body S); Label/Helper — Body XS.
- **Цвета** — токены совпадают с InputText: рамка `--border-primary`, фокус `--primary`, Error `--error`, Warning `--warning`, маска-плейсхолдер `--text-inactive`. Иконки (календарь/крестик) — Active · `--secondary`, hover → `--secondary-dark`.t-inactive`.

## Для разработчиков (выжимка)

### Точные размеры (redline)
Рендерится на странице через getComputedStyle. Источник — styles/input.css. M: 40px / паддинг 12px / gap 8px / иконки 20px. S: 32px / 10px / 6px / 18px.

### Разметка · HTML (эталонная реализация ДС)

```
<div class="inp">
  <label class="ds-label" for="d1"><span class="ds-label__text">Дата подписания</span></label>
  <div class="inp__field">
    <input class="inp__control" id="d1" placeholder="ММ.ДД.ГГГГ" inputmode="numeric">
    <span class="inp__acts">
      <button class="inp__act" aria-label="Очистить поле">…✕…</button>
      <button class="inp__act" aria-label="Открыть календарь" aria-haspopup="dialog">…📅…</button>
    </span>
  </div>
  <span class="ds-helper ds-helper--left">Helper</span>
</div>
```

### Поведение · псевдокод (framework-agnostic)
```
// маска: пропускать цифры; после 2-го и 4-го знака вставлять '.'; Backspace удаляет цифру+разделитель
// blur: валидировать существование даты и min/max → иначе status='error'
// DatePicker: открыть при фокусе/по кнопке; выбор → значение, закрыть, фокус в поле
// крестик — только у заполненного поля; клик → пусто + фокус
```

### Справочник классов и атрибутов

| Класс/атрибут | Назначение |
|---|---|
| `.inp / --m / --s / --error / --warning / --disabled` | база — общая с InputText |
| `.inp__act[aria-label="Открыть календарь"]` | кнопка-календарь, всегда последняя |
| `input[inputmode="numeric"]` | цифровая клавиатура; маска в placeholder |
| `aria-haspopup="dialog"` / `aria-expanded` | связь с DatePicker |
