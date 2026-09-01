---
component: Popover
title: "Popover"
version: "1.006"
updated: "30.08.2026"
page: pages/organisms/Popover.html
page_js: scripts/popover.page.js
runtime: scripts/ds-popover.js
css: styles/popover.css
deps: [button, icon-button, link, chip, label-helper]
status: curated
---

> Спека для быстрого контекста. Источник истины — CSS-файл и страница компонента. При изменении компонента обновляй эту спеку и блок в specs/_cheatsheet.md.

## Назначение
Popover — нон-модальный всплывающий контейнер, привязанный к триггеру. Показывает расширенный контекстный контент (текст с форматированием, интерактив, формы, легенды, списки). В отличие от Tooltip — открывается по клику и не закрывается при уходе курсора; в отличие от Modal — не блокирует страницу, не имеет скрима, закрывается кликом вне себя.

## Инварианты
- Ровно одна прокручиваемая зона — Body; Header/Footer зафиксированы по высоте и не скроллятся.
- Кнопки действий не кладутся в Header — только в Footer (foot-right); Header — заголовок + ✕.
- Свыше `--pop-w-max` (560px) или когда контенту не хватает высоты со скроллом — сигнал переключиться на Modal, не растягивать Popover.
- Стрелка (`.pop__arrow`) красится в цвет зоны, к которой примыкает (Header/Footer/Body) — не фиксированный цвет.

## Диагностика
- «В поповере не хватает места, скроллит вся страница» → сигнал заменить на Modal, не увеличивать `--pop-w-max`
- «Стрелка не совпадает цветом с зоной» → проверить, к какой зоне она примыкает по стороне размещения

## Ключевые правила (из разделов страницы)
- **Использование** — Клик/Enter/Space открывает, контент — текст+интерактив/формы/медиа (не только строка, как у Tooltip), страницу не блокирует (в отличие от Modal). Правило переключения на Modal: ширина контенту нужна больше 560px, либо вертикальной прокрутки тела недостаточно.
- **Анатомия** — 2 обязательные + 3 опциональные части: Trigger (обязателен, вне поповера) → Header (опц.: высота 48px, содержимое по центру по вертикали, фон --bgtable-pinned; заголовок Body S Strong 14px + опц. чип/ссылка (чип примыкает с gap 8px) + ✕, **без кнопок действий** — как и в шапке Modal; отличие поповера в том, что рядом с заголовком допустим примыкающий чип или служебная ссылка) → Body (обязателен, единственная гибкая/прокручиваемая зона; содержимое почти любое, жёстких ограничений по типу контента нет) → Footer (опц.: foot-left и foot-right — независимо включаемые группы, фон --bgtable-pinned; слева инфо/ссылка/кнопка, справа Secondary+Primary) → Arrow (опц., по умолчанию выключена, как у Menu/DropdownList).
- **Размеры** — 5 фиксированных шагов ширины (--pop-w-s…max, 240–560px), не резиновая. Каждый шаг задаёт свой max-height тела (auto/320/440/520/600px) — дальше только тело прокручивается, Header/Footer закреплены. Свыше 560px — переключение на Modal.
- **Размеры · Радиус скругления** — Радиус одинаков на всех пяти шагах ширины; header и footer наследуют углы. поверхность, header (верхние), footer (нижние) — 8px (--pop-radius = --radius-m) · стрелка — 0.
- **Контент** — Body не диктует состав (текст+ссылка, легенда/список, форма, карточка данных, таблица). Header добавляется при метке/группировке, форме с несколькими полями или ширине >320px. Footer — когда есть форма/выбор, требующий подтверждения, или деструктивное действие. Порядок кнопок Footer идентичен Modal: справа Secondary+Primary, слева — только информация/ссылки, никогда действия.
- **Состояния** — Открытие: click/Enter/Space (primary), hover/focus — опционально и никогда единственным способом. Закрытие — 5 равнозначно обязательных способов: ✕, клик вне, Esc, Tab за последний интерактивный элемент (нет focus trap — отличие от Modal), контекстно кнопка-действие в Footer. Одновременно открыт только один поповер — новый закрывает предыдущий. Запрещено автозакрытие по таймеру и открытие при загрузке страницы. Есть loading (skeleton в Body, aria-busy) и error (role="alert") состояния тела, disabled-триггер (не открывается), тень у Header/Footer при прокрутке тела (.is-scrolled, как у Modal).
- **Placement** — 4 стороны × 3 выравнивания = 12 позиций, приём идентичен Tooltip (ARROW_INSET-подобная логика). Авто-flip: не хватает места по предпочтительному align — перевыравнивание на противоположный край; не хватает места по стороне — пробуются противоположная и перпендикулярные стороны. Поповер не выходит за границы контейнера (clamp 8px), а стрелка после clamp/flip доводится до центра триггера (смещение вдоль стороны, ограничение 12px от углов).
- **Доступность** — Триггер: aria-haspopup="dialog", aria-expanded, aria-controls. Контейнер: role="dialog", aria-modal="false" (не блокирует), aria-labelledby на заголовок при наличии Header. Фокус переходит внутрь при открытии, но НЕ заперт (нет focus trap) — Tab с последнего элемента уводит из поповера и закрывает его. Esc закрывает и возвращает фокус на триггер. Контент страницы за поповером НЕ получает aria-hidden/inert (в отличие от Modal).
- **Цвета** — Только семантические токены. Фон Body — --bg-popup; фон Header/Footer — --bgtable-pinned (Pinned Default, #F5F7F7); радиус --radius-m (8px); тень --elevation-5, внешнего бордера нет. Не собственный rgba().

## Рантайм из коробки — `scripts/ds-popover.js`
Поведение вынесено из витрины в общий рантайм (Фаза 3, 11.08.2026): экрану достаточно подключить скрипт и разметку.

- **Авто-инициализация**: любой триггер с `data-popover="<id поповера>"` (пустое значение — ближайший `.pop` внутри `.pop-anchor`). Рантайм сам проставляет `aria-haspopup`/`aria-expanded`/`aria-controls`, `role="dialog"`, `aria-modal="false"` и класс `.pop--floating`.
- **Настройки атрибутами триггера**: `data-popover-placement` (top|bottom|left|right, по умолчанию bottom), `data-popover-align` (start|center|end, start), `data-popover-gap` (8), `data-popover-flip="no"` (выключить авто-flip), `data-popover-boundary` (CSS-селектор контейнера-границы, по умолчанию вьюпорт).
- **API**: `DSPopover.bind(trigger, opts) → {open, close, toggle, place, isOpen}` · `DSPopover.place(pop, trigger, {placement, align, gap, flip, boundary, offsetParent}) → {placement, align}` · `DSPopover.bindAll(root)` · `DSPopover.watchScroll(pop) → sync()` · `DSPopover.closeAll()` · `DSPopover.current()`.
- **Реализовано**: 12 позиций, авто-flip стороны (противоположная → перпендикулярные) и выравнивания (start↔end), clamp 8px от границ, стрелка доводится до центра триггера (12px от углов), один открытый поповер одновременно, 5 способов закрытия (✕ / клик вне / Esc с возвратом фокуса / Tab за последний элемент / `[data-pop-close]`), тени `.is-scrolled` у шапки и подвала, репозиционирование по resize/scroll.
- Страница компонента использует тот же рантайм: `popover.page.js` собирает только демо-разметку.

## Для разработчиков (выжимка)

### Точные размеры (redline)
Таблица рендерится на странице через getComputedStyle. Точные значения — в CSS-файле компонента (см. `css:` в шапке): радиус контейнера, паддинги Header/Body/Footer, зазор кнопок подвала, зазор от триггера (8px), толщина разделителя.

### Разметка · HTML (эталонная реализация ДС)

```
<span class="pop-anchor">
  <button type="button" data-popover="pop-1">…</button>
  <!-- aria-haspopup/aria-expanded/aria-controls проставит ds-popover.js -->

  <div id="pop-1" class="pop pop--w-m pop--bottom pop--start pop--floating" role="dialog" aria-modal="false" aria-labelledby="pop-1-title">
    <div class="pop__head">
      <div class="pop__head-main">
        <h3 class="pop__title" id="pop-1-title">Изменить тег</h3>
        <!-- опц.: chip/link, gap 8px от заголовка -->
      </div>
      <span class="pop__close"><button type="button" class="ibtn ibtn--neutral ibtn--s" aria-label="Закрыть"><i data-icon="close"></i></button></span>
    </div>
    <div class="pop__body">…форма, легенда, карточка, таблица…</div>
    <div class="pop__foot">
      <div class="pop__foot-left"></div>
      <div class="pop__foot-right">
        <button class="btn btn--transparent btn--s">Отмена</button>
        <button class="btn btn--accent btn--s">Применить</button>
      </div>
    </div>
    <span class="pop__arrow"></span>
  </div>
</span>
```

### Поведение · псевдокод (framework-agnostic)

Рабочая реализация алгоритма — `scripts/ds-popover.js`.

```
// 1. Реестр единственного открытого поповера — новый открывающийся закрывает предыдущий
// 2. Позиционирование: rect триггера/поповера, gap 8px, align сдвигает по вторичной оси
//    (отступ под стрелку: 18px top/bottom, 14px left/right)
// 3. Авто-flip align (start↔end) и placement (противоположная → перпендикулярные), как у Tooltip
//    после clamp по краям контейнера сместить стрелку к центру триггера (clamp 12px от углов)
// 4. Закрытие — 5 способов: ✕ / клик вне / Esc / Tab за последний элемент (без focus trap) / кнопка-действие
// 5. Тень Header/Footer по scrollTop тела — идентично Modal (.is-scrolled)
// 6. prefers-reduced-motion — анимация выключается, мгновенный показ/скрытие
```

### Popover.types.ts

```
type PopoverWidth = 's' | 'm' | 'l' | 'xl' | 'max';
type PopoverPlacement = 'top' | 'bottom' | 'left' | 'right';
type PopoverAlign = 'start' | 'center' | 'end';

interface PopoverFooterAction { label: string; onClick(): void; disabled?: boolean; }

interface PopoverProps {
  open: boolean;
  onOpenChange(open: boolean): void;
  trigger: React.ReactElement;           // клонируется с aria-haspopup/aria-expanded/aria-controls
  title?: string;                        // задан → рендерит Header с заголовком и ✕
  width?: PopoverWidth;                  // по умолчанию 'm' (320px)
  placement?: PopoverPlacement;          // по умолчанию 'bottom'; авто-flip
  align?: PopoverAlign;                  // по умолчанию 'start'
  arrow?: boolean;                       // по умолчанию false
  offset?: number;                       // зазор от триггера, по умолчанию 8
  children: React.ReactNode;             // Body
  primaryAction?: PopoverFooterAction;   // правый Primary — рендерит Footer
  secondaryAction?: PopoverFooterAction; // правый Secondary
  footerLeft?: React.ReactNode;          // служебная информация/ссылка слева — НЕ действие
  closeOnOutsideClick?: boolean;         // по умолчанию true, отключать запрещено
  closeOnEsc?: boolean;                  // по умолчанию true, отключать запрещено
}
```

### Справочник классов и атрибутов

| Класс/атрибут | Назначение |
|---|---|
| `.pop-anchor` | position:relative обёртка вокруг триггера |
| `.pop` | Корень: фон, радиус 8px (--radius-m), тень --elevation-5, без внешнего бордера |
| `.pop--w-s … --w-max` | Ширина — 5 шагов (240–560px), задаёт и max-height тела |
| `.pop--floating` / `.pop--pinned` | JS-позиционирование + `.is-open` / всегда открыт (демо) |
| `.pop--top/-bottom/-left/-right` + `--start/-center/-end` | 12 позиций размещения |
| `.pop--arrow` | Включает стрелку-указатель `.pop__arrow` (по умолчанию выключена) |
| `.pop__head` / `.pop__foot` | Фиксированные зоны, фон --bgtable-pinned; Header — 48px, центрирован по вертикали; тень при `.is-scrolled` |
| `.pop__head-main` | Заголовок + опц. чип/ссылка, газап 8px |
| `.pop__title` | Заголовок — Body S Strong 14px, 1 строка |
| `.pop__close` | Обёртка ✕ — кнопка `.ibtn.ibtn--neutral.ibtn--s` |
| `.pop__body` (+ `--flush`) | Единственная гибкая/прокручиваемая зона; содержать может почти что угодно |
| `.pop__foot-left` / `-right` | Независимо включаемые группы: слева инфо/ссылка/кнопка, справа Secondary+Primary |
| `.sk-line` / `.sk-group` | Loading-плейсхолдер (общий компонент Skeleton, styles/skeleton.css) |
| `role="dialog"` / `aria-modal="false"` | Не блокирующий диалог |
| `aria-haspopup` / `aria-expanded` / `aria-controls` | На триггере — связь с поповером |
