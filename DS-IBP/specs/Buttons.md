---
component: Buttons
title: "Button"
version: "1.011"
updated: "21.08.2026"
page: pages/atoms/Buttons.html
css: styles/button.css
deps: [spinner]
status: auto
---

> Автоспека для быстрого контекста. Источник истины — CSS-файл и страница компонента. При изменении компонента обновляй эту спеку.

## Назначение
Кнопка инициирует действие. Три типа, три размера, состояния Default / Hover / Active / Disabled, лоадер и режим Fullwidth. Модификатор Тон (Error / Warning / Success / Info) комбинируется с любым типом — Error используется для деструктивных действий (диалог подтверждения удаления), остальные тоны переиспользуются в Alert и SnackBar. Текст кнопок набран токенами Button M / S / XS (SB Sans Screen).

## Инварианты
- Справа у кнопки — либо шеврон (открывает меню), либо иконка, не одновременно.
- На одной области экрана — только одна кнопка Accent; соседние действия — Outline/Transparent.
- `.btn{min-width:0}` + `.btn__label` ellipsis — длинный текст обрезается, не распирает fullwidth/flex-родителя.
- `.btn--icon-only` не растягивается в `.btn--fullwidth` контексте — сохраняет квадратные пропорции.
- Тон-модификатор (error/warning/success/info) комбинируется с type (accent/outline/transparent), но меняет только цвет — не форму и не размер.
- `.btn--loading` недоступна для взаимодействия (`pointer-events:none`), как disabled.

## Диагностика
- «Текст кнопки распирает контейнер» → на родителе-flex/grid между кнопкой и краем не хватает `min-width:0`
- «На экране рядом два синих Accent» → нарушение инварианта — один должен стать Outline/Transparent

## Ключевые правила (из разделов страницы)
- **Использование** — Тип кнопки отражает вес действия. На одной области экрана — только один Accent; рядом с ним второстепенные действия — Outline, третичные — Transparent. Справа от текста может быть либо шеврон (кнопка-меню), либо иконка — но не одновременно.
- **Варианты · Type** — Свойство Type определяет общий вид кнопки: Accent, Outline, Transparent.
- **Варианты · Тон** — Модификатор (не отдельный тип), комбинируется с Accent/Outline/Transparent, меняет цвет на токены одного из четырёх тонов палитры Situative: Error, Warning, Success, Info. Error — для деструктивного действия в диалоге подтверждения (см. Modal) — не для обычного «Удалить» в подвале формы, которое остаётся Transparent. `.btn--danger` — алиас `.btn--error` для обратной совместимости (Modal, TableFilter). Warning/Success/Info переиспользуются в Alert и SnackBar — тон кнопки совпадает с тоном компонента.
- **Варианты · Кнопка с меню (chevron)** — Если кнопка содержит шеврон — она открывает контекстное меню. Клик по самой кнопке только показывает меню; действия выполняются исключительно по пунктам меню. Справа может быть либо шеврон, либо иконка — но не одновременно. Нажмите, чтобы открыть.
- **Анатомия** — Кнопка может содержать иконку слева и/или справа от текста, и/или сам текст. Иконки допускаются с обеих сторон одновременно.
- **Размеры** — Три размера. Ширина зависит от контента, высота фиксирована. M — 40 · кнопки в модальных окнах · S — 32 · в таблицах, на тайлах · XS — 24 · фильтры и экшены на одном уровне с фильтром.
- **Размеры · Отступы** — Боковой padding зависит от наличия иконки/шеврона у соответствующего края кнопки: сторона с иконкой уже, сторона с текстом — шире (M 16/12 · S 12/10 · XS 8/6). Отступы внутри кнопок разного типа, но одного состава — идентичны.
- **Размеры · Радиус скругления** — Радиус зависит только от размера кнопки; тип (Accent / Outline / Transparent), иконки и Loader его не меняют. M — 8px (--radius-control) · S — 8px (--radius-control) · XS — 6px (--radius-control-s) · icon-only — как у своего размера.
- **Контент** — Текст кнопки — короткая глагольная формулировка действия. Ширина кнопки следует за текстом, поэтому правило одно: короче текст — лучше.
- **Варианты · Fullwidth** — Кнопки со свойством Fullwidth заполняют весь контейнер: боковые паддинги убираются, контент центрируется. Кнопки, содержащие только иконку, не растягиваются.
- **Состояния** — Default, Hover, Active, Disabled — для каждого типа.
- **Поведение · Loader** — Сообщает, что идёт процесс, вызванный кликом. На время процесса кнопка переходит в Disabled. Если в кнопке есть иконка — лоадер заменяет её (при иконках с обеих сторон заменяется левая). Если иконок нет — лоадер появляется слева от текста и увеличивает ширину. В IconOnly иконка заменяется лоадером. Нажмите на любую кнопку, чтобы увидеть.
- **Типографика** — Текст кнопок набран гарнитурой SB Sans Screen. Размер текста привязан к размеру кнопки через токены --type-button-*.
- **Доступность** — Кнопка — нативный <button type="button">: Enter и Space работают из коробки. Фокус — outline: 2px var(--primary) с отступом 2px, только по :focus-visible. Disabled задаётся атрибутом disabled. В состоянии Loader кнопка не интерактивна (pointer-events: none) — дополнительно ставьте aria-busy="true" и держите её disabled до конца процесса. Icon-only обязана иметь aria-label. Кнопка с шевроном получает aria-haspopup="menu" и aria-expanded; меню — role="menu" с пунктами role="menuitem", Esc закрывает меню и возвращает фокус на кнопку. Разворот шеврона на 180° живёт в CSS на `[aria-expanded="true"] .btn__chevron` — рантайм (ds-menu.js/ds-popover.js) уже пишет атрибут, доп. классов и inline-стилей не требуется (RulesAudit W1, 12.08.2026). Спиннер замедляется при prefers-reduced-motion.
- **Цвета** — Компонент использует только семантические токены из палитры; hex резолвится из живого значения токена. Заливки Hover/Active у Outline и Transparent и Active у Accent — производные от --primary через color-mix (--btn-hover-bg, --btn-active-bg, --btn-pale); Hover у Accent — самостоятельный токен --primary-dark. Тон (Error/Warning/Success/Info) переопределяет те же роли токенами палитры Situative: Accent — фон/граница `--<тон>`, Hover `--<тон>-dark`, Active `--<тон>-light`, текст `--text-on-dark`; Outline/Transparent — текст/граница `--<тон>`, Hover `--<тон>-bg` (Error — `--error-bg-light`), Active — усиленный color-mix к `--<тон>-dark`.

## Для разработчиков (выжимка)

### Точные размеры (redline)

Таблица рендерится на странице через getComputedStyle. Точные значения — в CSS-файле компонента (см. `css:` в шапке).

### Разметка · HTML (эталонная реализация ДС)

```
<!-- иконка слева и/или текст и/или иконка справа; справа — иконка ИЛИ шеврон, не оба -->
<button type="button" class="btn btn--accent btn--m">
  <i data-icon="check"></i>                <!-- иконка слева, 20/18/16 px -->
  <span class="btn__label">Применить</span>
</button>

<!-- Тон: Error/Warning/Success/Info — модификатор поверх любого типа; .btn--danger = алиас .btn--error -->
<button type="button" class="btn btn--accent btn--m btn--error"><span class="btn__label">Удалить</span></button>
<button type="button" class="btn btn--outline btn--m" aria-haspopup="menu" aria-expanded="false">
  <span class="btn__label">Действия</span>
  <i class="btn__chevron" data-icon="chevron-down"></i>
</button>

<!-- icon-only: квадратный паддинг, обязателен aria-label -->
<button type="button" class="btn btn--outline btn--s btn--icon-only" aria-label="Скачать">
  <i data-icon="download"></i>
</button>

<!-- loading: спиннер на месте левой иконки, кнопка удерживается в disabled -->
<button type="button" class="btn btn--accent btn--m btn--loading" disabled aria-busy="true">
  <span class="spin spin--current"></span>
  <span class="btn__label">Применить</span>
</button>
```

### Поведение · псевдокод (framework-agnostic)

```
// 1. Loader — спиннер занимает место ЛЕВОЙ иконки:
//    есть левая иконка → заменить её на .spin.spin--current — общий Spinner (правая иконка/шеврон остаются)
//    нет левой иконки → вставить спиннер перед .btn__label (ширина кнопки растёт)
//    icon-only → заменить иконку на спиннер
// На время загрузки: .btn--loading + disabled + aria-busy="true";
// текст кнопки не меняется, по завершении вернуть исходный состав.

// React: loading — просто пропс, состав рендерится декларативно:
leftSlot = loading ? Spinner : iconLeft

// 2. Кнопка-меню (шеврон):
//    клик по кнопке ТОЛЬКО открывает/закрывает меню — действие не выполняет
//    действия выполняются исключительно по пунктам меню
//    клик вне меню и Esc — закрывают; aria-expanded синхронизируется
//    при открытом меню шеврон поворачивается на 180° (transform .15s ease)
//    справа либо шеврон, либо иконка — никогда оба (шеврон имеет приоритет)

// 3. Состояния hover/active — чистый CSS (:hover/:active);
//    классы .is-hover/.is-active существуют только для спецификаций в документации.
```

### Button.types.ts

```
type ButtonVariant = 'accent' | 'outline' | 'transparent';
type ButtonTone = 'error' | 'warning' | 'success' | 'info'; // модификатор, комбинируется с любым ButtonVariant
type ButtonSize = 'm' | 's' | 'xs';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;     // по умолчанию 'accent'
  size?: ButtonSize;           // по умолчанию 'm'
  children?: React.ReactNode;  // текст; не задан → icon-only (обязателен aria-label)
  iconLeft?: React.ReactNode;  // 20/18/16 px по размеру
  iconRight?: React.ReactNode; // взаимоисключим с chevron
  chevron?: boolean;           // кнопка-меню; исключает iconRight
  loading?: boolean;           // спиннер + disabled + aria-busy
  fullWidth?: boolean;         // icon-only не растягивается
  tone?: ButtonTone;           // модификатор поверх variant — токены Situative; 'error' = легаси .btn--danger
}
```

### Справочник классов и атрибутов

| Класс / атрибут | На чём | Назначение |
|---|---|---|
| .btn | button | Базовый класс: флекс-раскладка, типографика, переходы, focus-visible |
| .btn--accent / --outline / --transparent | button | Тип кнопки — заливка, граница, цвет текста и состояния |
| .btn--error / --warning / --success / --info | button | Модификатор Тон (не тип) — меняет цвет любого типа на токены Situative; переиспользуется в Alert/SnackBar |
| .btn--danger | button | Легаси-алиас .btn--error, для обратной совместимости (Modal, TableFilter) |
| .btn--m / --s / --xs | button | Размер: высота, паддинги, иконка, радиус, токен типографики |
| .btn--icon-only | button | Кнопка без текста — квадратный паддинг, обязателен aria-label |
| .btn--fullwidth | button | Растягивает кнопку на 100% контейнера; icon-only не растягивается |
| .btn--loading | button | Состояние загрузки — pointer-events: none, внутри .btn__spinner |
| disabled / .btn--disabled | button | Отключённое состояние; класс — для не-button элементов (например ссылок) |
| .is-hover / .is-active | button | Форсированные состояния — только для спецификаций в документации, не для продакшена |
| .btn__label | span | Текст кнопки, не переносится |
| .btn__chevron | svg | Шеврон кнопки-меню — 80% размера иконки, поворачивается при открытом меню |
| .spin.spin--current | span | Лоадер — общий компонент Spinner (styles/spinner.css), currentColor, размер = размеру иконки |

> Обновление 17.07.2026: в Конструктор добавлен выбор тона (Без тона / Error / Warning / Success / Info). Сами тоновые классы `.btn--<tone>` не менялись.
