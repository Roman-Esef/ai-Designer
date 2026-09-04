---
purpose: Чит-шит по всем компонентам для сборки экранов. Читай ЭТОТ файл вместо набора спек; спеку specs/<Имя>.md — только для компонента со сложным поведением.
---

# IBP DS — чит-шит компонентов

Подключение на экране: один `<link rel="stylesheet" href="ds.css">` (всё включено) + один `<script src="ds.js"></script>` в конце body (единая точка входа, RulesAudit W0 · K0 — сам догружает icons-data.js/ds-icons.js и все остальные рантаймы ДС в нужном порядке; напрямую эти файлы больше не подключать). Иконки: `<i data-icon="имя"></i>`, имена — specs/Icons.md. **Слот иконки принимает обе формы** — вставленный `<svg>` и `<i data-icon>`: размер задаёт слот (правила CSS написаны на `:is(svg,[data-icon])`), замена одной формы на другую вид не меняет и правки CSS не требует (RulesAudit W0 · K2, 12.08.2026). Экранный скрипт с данными/логикой конкретного экрана (если есть) — отдельным тегом сразу после `ds.js`. Токены: цвета — specs/Colors.md, типографика — specs/Typography.md, радиусы — specs/Radius.md, тени — specs/Elevation.md. Начинай экран с копии `_template/Screen.html`.

## AllocationBar
css: `styles/allocation-bar.css` · deps: [alert, button]
**Оси:** контейнерные брейкпоинты (600/480/320/200/160) · состояния (loaded/loading fast/slow/error/empty/partial/overflow) · предупреждение (поверх любого состояния) · ограничение по высоте (`data-height="A|B|C"`) · растяжение (`--stretch`).
**Инварианты:** хост обязан иметь `container-type: inline-size`; цвета сегментов — только `--chart-*` по индексу; высота бара всегда 8px.
**Диагностика:** «Компонент не подстраивается под сужение контейнера» → на хосте не выставлен `container-type: inline-size` · «Цвет сегмента не совпадает со строкой списка» → сверить индекс позиции с палитрой `--chart-*`, не задавать цвет напрямую

Итог + стек-бар распределения + список позиций с долями. Read-only, предметной области не знает. Хост обязан иметь `container-type: inline-size` — весь адаптив на контейнерных запросах (480 / 320 / 200px). Цвета сегментов — только токены `--chart-*` по индексу, без цикла (13-я и далее → «Прочее»). Свыше `maxVisibleItems` (5) — «Показать ещё N», внутреннего скролла нет. Высота бара всегда 8px, зазор сегментов 2px, минимальный сегмент 2px.

```html
<div class="albar-host">
  <div class="albar">
    <div class="albar__head">
      <div class="albar__titles"><div class="albar__label">ВБС по сделке на 25.02.2026, RUB</div></div>
      <div class="albar__total"><span>1 000 000 000,00</span><span class="albar__unit">RUB</span></div>
    </div>
    <div class="albar__bar" role="img" aria-label="Распределение: Кредит 35,00%, Акции 35,00%, РЕПО 30,00%">
      <div class="albar__seg" data-id="kr" style="background:var(--chart-indigo);flex-grow:35"></div>
      <div class="albar__seg" data-id="ak" style="background:var(--chart-shiny-green);flex-grow:35"></div>
      <div class="albar__seg" data-id="rp" style="background:var(--chart-light-blue);flex-grow:30"></div>
    </div>
    <div class="albar__list">
      <div class="albar__row" data-id="kr">
        <span class="albar__dot" style="background:var(--chart-indigo)"></span>
        <span class="albar__name">Кредит</span><span class="albar__pct">35,00%</span><span class="albar__val">350 000 000,00</span>
      </div>
    </div>
  </div>
</div>
```

Состояния: loading — `.albar__sk` (шиммер) на итоге/баре/строках, долгий расчёт — плашка `.albar__calc`; error — Alert error + Button Outline XS «Повторить»; empty — итог «—» + `.albar__empty` «Нет данных»; partial/overflow — Alert warning/error в `.albar__foot` (+ серый `.albar__seg--rest`). Ограничение высоты — `data-height="A|B|C"` на хосте. Растяжение — `.albar--stretch`. Рантайм-референс: `window.AllocationBar.make(cfg)`. Полная спека: specs/AllocationBar.md.

## Alert
css: `styles/alert.css` · deps: [button, link]
**Оси:** тон (info/warning/error/success) · состав (иконка/заголовок/текст/кнопки/действия — независимо) · кнопки-ссылки (1/2/текстовая ссылка) · раскладка (`--row`/`--flush`) · сворачивание/закрытие.
**Инварианты:** тон красит заливку и акцент одновременно; кнопки/ссылки — только `.btn--<тон>`/`.link--<тон>`, совпадающий с тоном плашки.
**Классы:** `.alert` · `.alert--info/--warning/--error/--success` · `.alert--m` · `.alert--collapsed` · `.alert--row` · `.alert--flush` · `.alert__icon` · `.alert__body` · `.alert__title` · `.alert__text` · `.alert__buttons` · `.alert__actions` · `.alert__act` · `.alert__collapse / .alert__close` · `[role][aria-live]`
**Диагностика:** «Цвет кнопки не совпадает с тоном плашки» → на кнопке не тот `.btn--<тон>`/`.link--<тон>` · «У свёрнутого алерта не поворачивается шеврон» → рантайм должен писать `aria-expanded` на `.alert__collapse`, CSS реагирует на атрибут

Инлайновое сообщение о состоянии в потоке контента (не всплывает, статично). Тоны info/warning/error/success, один размер M; опциональные иконка, заголовок, текст, кнопки, действия (свернуть/закрыть).

```html
<!-- глиф иконки по тону: Info-circle-filled | alert-triangle-filled | alert-circle-filled | check-circle-filled -->
<div class="alert alert--info alert--m" role="status" aria-live="polite">
  <span class="alert__icon" aria-hidden="true"><i data-icon="Info-circle-filled"></i></span>
  <div class="alert__body">
    <p class="alert__title">Заголовок компонента</p>
    <p class="alert__text">Добавление холдинга в разработке…</p>
    <div class="alert__buttons">
      <button class="btn btn--outline btn--xs btn--info"><span class="btn__label">Завести сделку</span></button>
      <a class="link link--info link--s" href="#">Подробнее</a>
    </div>
  </div>
  <div class="alert__actions">
    <button class="alert__act alert__collapse" aria-label="Свернуть" aria-expanded="true"><i data-icon="chevron-up"></i></button>
    <button class="alert__act alert__close" aria-label="Закрыть"><i data-icon="close"></i></button>
  </div>
</div>
```

Тоны — заливка/акцент: `--info-bg/--info` · `--warning-bg/--warning` · `--error-bg-light/--error` · `--success-bg/--success`. role/aria-live: error·warning → alert/assertive, info·success → status/polite. Кнопки и ссылки несут явный тон-класс Button (`.btn--info/--warning/--error/--success`, совпадающий с тоном Алерта); переопределение --primary/--link на .alert остаётся для ссылок. Свёрнуто — `.alert--collapsed`. Заголовок/текст независимы (можно только один из них — для любых тонов, размеров, раскладок). Раскладка в строку — `.alert--row`: текст+кнопки в одну строку, кнопки прижаты вправо, без действий; иконка top-aligned рядом с заголовком, центрируется только блок кнопок; рамка 1px + радиус 8px в цвете тона (16% непрозрачности); при двух кнопках прозрачная — слева, аутлайн (основная) — справа. Встроенный в Плитку/Модалку без скруглений и отступов — `.alert--flush`. Полная анатомия: specs/Alert.md.

Тон задаётся классом `.alert--info/--warning/--error/--success` — класс самодостаточен. Атрибут `data-alert-tone="<тон>"` равнозначен и оставлен для совместимости; дублировать оба не нужно.

## Avatar
css: `styles/avatar.css` · deps: [badge]
**Оси:** форма (circular/rounded) · размер (XL/L/M/S) · тип содержимого (фото→инициалы→иконка, по цепочке деградации) · бейдж (counter/dot через `.av-stack`) · группа (стек + чип «+N») · интерактивность (hover/focus/pressed).
**Инварианты:** деградация контента фото→инициалы→иконка не смешивается; счётчик-бейдж — только у L/XL.
**Корнер-кейсы:** `.av__text` — ellipsis в фикс. боксе.
**Диагностика:** «Инициалы вылезают за круг» → `.av__text` должен обрезаться эллипсисом в фикс. боксе, не растягивать шрифт · «Счётчик-бейдж не виден на M/S аватаре» → по спеке не поддерживается — заменить на dot либо увеличить аватар до L/XL

Аватар — компактное визуальное представление пользователя или сущности.

```html
<span class="av av--circular av--l">
  <span class="av__text">ИБ</span>
</span>
<span class="av-stack" aria-label="Мария А., в сети">
  <span class="av av--circular av--xl" aria-hidden="true">…</span>
  <span class="badge badge--dot badge--success badge--bordered" aria-hidden="true"></span>
</span>
<span class="av-group av-group--m" role="group" aria-label="Участники: ИБ, ВБ, МА, КГ и ещё 3">
  <span class="av av--circular av--m" aria-hidden="true">…</span>
  <span class="av-group__more" aria-hidden="true">+3</span>
</span>
<button type="button" class="av av--circular av--l av--button" aria-label="Открыть профиль Игоря Белова">…</button>
```

Badge на аватаре: Counter — правый верхний угол описанного квадрата (top:0/right:0), только L/XL; Dot — правый нижний угол (right:0/bottom:0), на всех размерах, размер точки XL 22 / L 12 / M 10 / S 8.

Полная анатомия: specs/Avatar.md.

## Badge
css: `styles/badge.css`
**Оси:** тип (counter/dot) · размер (M/S/XS/XXS/dot) · тон (neutral/accent/статусные) · позиционирование (`.badge-anchor`, top-right counter / bottom-right dot) · переполнение (max 99 → «99+», безфоновый `--text` вариант «+N»).
**Инварианты:** dot не входит в размерный ряд counter; `.badge--muted` гасит тон через `!important`.
**Классы:** .badge · .badge--m / --s / --xs / --xxs · .badge--dot · .badge--neutral / --accent / --success / --info / --warning / --error · .badge--text · .badge--bordered · .badge--muted · .badge--animate · .badge-anchor · .badge-anchor--dot-tr · aria-hidden="true"
**Диагностика:** «Бейдж не встаёт в угол родителя» → родитель не обёрнут в `.badge-anchor`/`.av-stack` · «Цвет бейджа не гаснет на disabled родителе» → не добавлен класс `.badge--muted`

Бейдж — небольшой дочерний элемент, который накладывается на родительский компонент или ставится рядом с ним.

```html
<span class="badge-anchor" aria-label="Уведомления, 7">
  <span class="ibtn ibtn--neutral ibtn--m"><i data-icon="mail"></i></span>
  <span class="badge badge--xs badge--accent badge--bordered" aria-hidden="true">7</span>
</span>
<span class="badge-anchor" aria-label="Иван Белов, онлайн">
  <span class="av av--m"><span class="av__text">ИБ</span></span>
  <span class="badge badge--dot badge--success badge--bordered" aria-hidden="true"></span>
</span>
<span class="badge badge--m badge--neutral badge--text">+99</span>
```

Полная анатомия: specs/Badge.md.

## Breadcrumbs
css: `styles/breadcrumbs.css` · js: `scripts/ds-menu.js` (меню «…»), `scripts/ds-tooltip.js` (тултип обрезанной крошки), `scripts/ds-breadcrumbs.js` (авто-сворацивание по ширине, opt-in `data-breadcrumbs`) · deps: [link, context-menu, tooltip]
**Оси:** длина трейла (норм / срединные звенья схлопнуты в «…» / текущая крошка усечена тултипом) · размер (единственный S).
**Инварианты:** компонент сам держит зону 44px над контентом — padding 16px сверху / 12px снизу / 24px по бокам (16+16+12=44), поля совпадают с полями контентной области экрана (см. Layout); первое и текущее звено видимы всегда, схлопывается только середина; пересчёт по ResizeObserver на каждый ресайз, не только при первом рендере.
**Классы:** .crumbs · .crumbs__item · .crumbs__item--current · .link.link--muted · .crumbs__current + aria-current="page" · .crumbs__more + aria-haspopup / aria-expanded · .menu.menu--floating.crumbs__popup · .tip.tip--floating
**Диагностика:** «При сужении трейл не схлопывается в «…»» → на контейнер не навешен ResizeObserver (рантайм `ds-menu.js`/скрипт крошек) · «Разделитель озвучивается скринридером» → он должен быть чисто CSS `::after`, а не текстовый узел в разметке

Хлебные крошки — трейл ссылок в шапке страницы, показывающий путь до текущего раздела.

```html
<nav class="crumbs" aria-label="Хлебные крошки">
  <li class="crumbs__item"><a class="link link--muted" href="/">Главная</a></li>
  <li class="crumbs__item"><a class="link link--muted" href="/deals">Сделки</a></li>
  <li class="crumbs__item crumbs__item--current">
    <span class="crumbs__current" aria-current="page">Договор №4521</span>
  </li>
</nav>
<nav class="crumbs" aria-label="Хлебные крошки">
  <li class="crumbs__item"><a class="link link--muted" href="/">Главная</a></li>
  <li class="crumbs__item">
    <button class="crumbs__more" aria-haspopup="true" aria-expanded="false">…</button>
  </li>
  <li class="crumbs__item crumbs__item--current">
    <span class="crumbs__current" aria-current="page" title="Полное название страницы">Полное название страницы</span>
  </li>
</nav>
```

Свёртка длинного трейла — только `.crumbs__more` (кнопка «…», раскрывает ContextMenu со скрытыми уровнями). Другого элемента свёртки в ДС нет.

Полная анатомия: specs/Breadcrumbs.md.

## ButtonGroup
css: `styles/button-group.css` · js: `scripts/ds-buttongroup.js` (toggle: клик по `.btn[aria-pressed]` в `.btn-group--toggle` — `role="radiogroup"` эксклюзивно, `role="group"` независимо) · deps: [button] · Split Button: реальный ContextMenu + `DSMenu.bind` (`scripts/ds-menu.js`), не своя разметка меню.
**Оси:** тип (accent/outline/transparent) · размер (M/S/XS, один на всю группу) · ориентация (horizontal/vertical) · Split Button · сегментированный выбор (одиночный radio-like / множественный checkbox-like) · fullwidth.
**Инварианты:** все кнопки группы — один тип и размер; Disabled — только на всю группу целиком; Split Button — текст+стрелка всегда вдвоём.
**Корнер-кейсы:** наследуется от Button (`.btn`/`.btn__label` min-width:0 + ellipsis), держит fullwidth-группу.
**Классы:** .btn-group · .btn-group--accent / --outline / --transparent · .btn-group--vertical · .btn-group--fullwidth · .btn-group--disabled · .btn-group--toggle · .btn-group--split · .menu.menu--floating / .menu__item · role="group" / aria-label · aria-pressed · aria-haspopup / aria-expanded
**Диагностика:** «В группе кнопки разного размера/типа» → не поддерживается, привести к одному · «Стрелка Split Button не открывает меню» → отсутствует парный `.menu` + `DSMenu.bind(chev, {menu, …})` · «В тоггл-режиме выбрано два сегмента одновременно» → смешаны схемы radio-like/checkbox-like — выбрать одну на группу

Объединяет связанные кнопки в единый визуальный блок с общим фоном или обводкой.

```html
<div class="btn-group btn-group--accent" role="group" aria-label="Режим отображения">
  <button class="btn btn--accent btn--m">Список</button>
  <button class="btn btn--accent btn--m">Плитка</button>
</div>
<div class="btn-group btn-group--accent btn-group--split" role="group">
  <button class="btn btn--accent btn--m">Сохранить</button>
  <button class="btn btn--accent btn--m btn--icon-only" aria-haspopup="menu" aria-expanded="false">…</button>
  <div class="menu" role="menu" hidden>…</div>
</div>
<div class="btn-group btn-group--outline btn-group--toggle" role="group" aria-label="Форматирование">
  <button class="btn btn--outline btn--m" aria-pressed="true">…</button>
  <button class="btn btn--outline btn--m" aria-pressed="false">…</button>
</div>
<div class="btn-group btn-group--outline btn-group--vertical btn-group--disabled" role="group" aria-disabled="true">…</div>
```

Полная анатомия: specs/ButtonGroup.md.

## Buttons
css: `styles/button.css` · deps: [spinner]
**Оси:** type (accent/outline/transparent) · тон-модификатор (error/warning/success/info) · размер (M/S/XS) · кнопка-меню (chevron) · fullwidth · loader · icon-only.
**Инварианты:** справа — либо шеврон, либо иконка, не одновременно; на области экрана — только один Accent.
**Корнер-кейсы:** `.btn{min-width:0}` + `.btn__label` ellipsis — длинный текст не распирает fullwidth/flex-родителя.
**Классы:** .btn · .btn--accent / --outline / --transparent · .btn--error / --warning / --success / --info · .btn--danger · .btn--m / --s / --xs · .btn--icon-only · .btn--fullwidth · .btn--loading · disabled / .btn--disabled · .is-hover / .is-active · .btn__label · .btn__chevron · .spin.spin--current
**Диагностика:** «Текст кнопки распирает контейнер» → на родителе-flex/grid между кнопкой и краем не хватает `min-width:0` · «На экране рядом два синих Accent» → нарушение инварианта — один должен стать Outline/Transparent

Кнопка инициирует действие.

```html
<button type="button" class="btn btn--accent btn--m">
  <i data-icon="check"></i>                <!-- иконка слева, 20/18/16 px -->
  <span class="btn__label">Применить</span>
</button>
<button type="button" class="btn btn--outline btn--m" aria-haspopup="menu" aria-expanded="false">
  <span class="btn__label">Действия</span>
  <i class="btn__chevron" data-icon="chevron-down"></i>
</button>
<button type="button" class="btn btn--outline btn--s btn--icon-only" aria-label="Скачать">
  <i data-icon="download"></i>
</button>
<button type="button" class="btn btn--accent btn--m btn--loading" disabled aria-busy="true">
  <span class="spin spin--current"></span>
  <span class="btn__label">Применить</span>
</button>
<!-- Тон: Error/Warning/Success/Info — модификатор поверх любого типа; переиспользуется в Alert и SnackBar; .btn--danger = алиас .btn--error, для диалогов подтверждения удаления -->
<button type="button" class="btn btn--accent btn--m btn--error"><span class="btn__label">Удалить</span></button>
```

Полная анатомия: specs/Buttons.md.

## Chart
css: `styles/chart.css` · js: `scripts/ds-chart.js` · deps: [tooltip, alert, skeleton, segment-control, icon-button, button, table-cell]
**Оси:** тип (bar/hbar/grouped/stacked/stacked100/line/area/stackedArea/combo/pie/donut/scatter/waterfall/spark) · размер (S 132px / M 220px / L 320px) · анатомия (заголовок, тулбар, легенда, сетка, тултип, кросс-хэйр, подписи значений, опорная линия, brush) · состояния (loaded/loading fast/slow/error/empty) · признаки данных (пропуски, прогноз).
**Инварианты:** ширина от контейнера, высота от размера (`data-size` → `--chart-h`); цвет серии — токен на группе `.chart__ser { --chart-c }`, не на элементе; палитра `--chart-*` по индексу и не циклится; `null` — разрыв ряда, `0` — точка на нулевой линии; минимальный столбец 2px; тултип — компонент Tooltip, не своя плашка.
**Классы:** `.chart-host` (+`[data-size]`,`[data-type]`,`--spark`) · `.chart` (+`--stretch`,`--spark`,`[data-hover]`) · `.chart__head` / `__titles` / `__title` / `__subtitle` / `__toolbar` · `.chart__legend` (+`--bottom`) / `__legend-item` / `__legend-name` / `__legend-val` · `.chart__marker` (+`--line`,`--dot`,`--dashed`) · `.chart__plot` / `__svg` · `.chart__grid` / `__axis` / `__tick` / `__vlabel` / `__axis-title` · `.chart__ser` / `__bar` (+`--forecast`) / `__line` (+`--dashed`) / `__area` / `__dot` (+`--solid`) / `__slice` / `__spark-dot` · `.chart__ref` / `__ref-label` / `__band` / `__hit` / `__cursor` · `.chart__tip` / `__tip-title` / `__tip-row` / `__tip-name` / `__tip-val` / `__tip-total` · `.chart__brush` / `__brush-svg` / `__brush-spark` / `__brush-window` / `__brush-handle` (+`--l`,`--r`) · `.chart__foot` / `__empty` / `__calc` / `__calc-title` / `__calc-sub` / `__sk` / `__sk-bars` · `.chart__gap-note` · `.chart__zero`
**Диагностика:** «Поле пустое, график не появился» → узел вставлен в DOM после `make()` при нулевой ширине контейнера; рантайм ждёт ненулевую ширину до 2 сек, дальше нужен `inst.redraw()` · «Серии одного цвета» → цвет назначен на элемент, а не на группу `.chart__ser` · «Подписи категорий налезают» → взять тип `hbar` или сократить подписи

Графики данных на одной анатомии. Разметку строит рантайм: `DSChart.make(cfg)` возвращает готовый `.chart-host`, руками SVG не верстается. Ширину берёт у контейнера (ResizeObserver, дебаунс кадр, полная перестройка SVG), высоту — у размера. Числа: ru-RU, на осях компактный формат (тыс./млн/млрд), в тултипе полный. Подписи категорий прореживаются по измеренной ширине текста. Спарклайн в таблице — вариант ячейки TableCell (`.tc__spark`), не отдельный компонент.

```html
<!-- на экране: контейнер + вызов рантайма -->
<div id="cf-chart"></div>
<script>
  document.getElementById('cf-chart').appendChild(DSChart.make({
    type: 'combo', size: 'l',
    title: 'Движение средств по месяцам', subtitle: 'RUB',
    categories: ['Янв','Фев','Мар','Апр','Май','Июн'],
    series: [
      { id: 'in',  name: 'Поступления', data: [420e6,380e6,510e6,470e6,620e6,590e6], type: 'bar' },
      { id: 'out', name: 'Списания',    data: [210e6,260e6,240e6,300e6,280e6,340e6], type: 'bar' },
      { id: 'r',   name: 'Остаток',     data: [120e6,160e6,150e6,190e6,210e6,240e6], type: 'line', color: '--chart-indigo' }
    ],
    crosshair: true, refLine: { value: 500e6, label: 'Цель' },
    toolbar: { periods: ['М','Кв','Г'], active: 'М' }
  }));
</script>

<!-- спарклайн в ячейке таблицы -->
<div class="tc"><span class="tc__row"><span class="tc__spark" id="spk-1"></span></span></div>
<script>
  document.getElementById('spk-1').appendChild(DSChart.make({
    type: 'spark', spark: 'line', tone: 'auto',
    series: [{ id: 'k', data: [120,160,150,190,210,240,260,300] }],
    ariaLabel: 'Динамика показателя: рост'
  }));
</script>
```

Типы: сравнение — `bar`/`hbar`/`grouped`; состав — `stacked`/`stacked100`/`pie`/`donut`; динамика — `line`/`area`/`stackedArea`; разнородные величины — `combo`; связь двух чисел — `scatter`; вклад в итог — `waterfall`; форма тренда в строке — `spark`. Серий: линейный и стек до 6, группированные до 3, круговой 2–6 секторов; `bar`/`hbar` с двумя и более сериями сами становятся группами (наложения серий не бывает). Цвет: по индексу из `--chart-*` либо семантика (`--success`/`--error` — рост/падение, `--primary` + `--st-grey-midlight` — факт/план, `--primary` — итог водопада); смешивать оба принципа в одном графике нельзя. Прогноз — `series[].forecastFrom` (штрих у линии, штриховка у столбцов). Легенда: клик выключает серию (последнюю нельзя), наведение гасит остальные до .28. Brush включать от 12 точек. Подписи значений — до 8 точек и не на стеках.

Полная анатомия: specs/Chart.md.

## Checkbox
css: `styles/checkbox.css` · deps: [label-helper]
**Оси:** состояние выбора (unselected/selected/indeterminate) · интерактивное состояние (default/hover/focus/pressed/disabled/error) · состав (label/helper/icon-only) · группа + обязательность (независимые опции).
**Инварианты:** три состояния выбора взаимоисключающие; активная область — весь `.cb`, не только визуальная метка.
**Классы:** .cb · .cb--unselected / --selected / --indeterminate · .cb--hover / --focus / --pressed · .cb--error · .cb--disabled · .cb--no-content · .cb__input · .cb__box · .cb__mark · .cb__content · .cb__label · .cb__req · .ds-helper.ds-helper--left · .cb-group · .cb-group__title · .cb-group__items · .cb-group--indent · .cb-group__error · aria-invalid / role="group" / aria-labelledby
**Диагностика:** «Клик рядом с текстом не переключает чекбокс» → активная область должна быть весь `.cb`, не только `.cb__box` · «У обязательного чекбокса нет звёздочки» → добавить `.cb__req` после лейбла

Чекбокс используется, когда доступен список опций и пользователю нужно выбрать одну или несколько из них. CSS красит `.cb__mark` по нативным `:checked`/`:indeterminate`/`:disabled` на `.cb__input` — классы `.cb--selected`/`--indeterminate`/`--disabled` нужны только для форс-состояний, в реальной разметке достаточно атрибутов input.

```html
<label class="cb cb--selected">
  <input type="checkbox" class="cb__input" checked>
  <span class="cb__box"><span class="cb__mark"><i data-icon="check"></i></span></span>
  <span class="cb__content">
    <span class="cb__label">Получать уведомления</span>
    <span class="ds-helper ds-helper--left">Не чаще раза в день</span>
  </span>
</label>
<label class="cb cb--indeterminate">…</label>
<label class="cb cb--error">
  <input type="checkbox" class="cb__input" required aria-invalid="true">
  <span class="cb__box"><span class="cb__mark"></span></span>
  <span class="cb__content"><span class="cb__label">Я принимаю условия<span class="cb__req">*</span></span></span>
</label>
<div class="cb-group" role="group" aria-labelledby="grp-t">
  <p class="cb-group__title" id="grp-t">Выберите каналы</p>
<!-- … полная анатомия: specs/Checkbox.md -->
```

Классы состояния выбора (`cb--unselected` / `--selected` / `--indeterminate`) собственных правил в CSS не имеют — их вешает рантайм как маркер состояния; в стартовом сниппете не нужны.

## Chip
css: `styles/chip.css` · deps: [label-helper, avatar, spinner]
**Оси:** тип (edit/readonly) · стиль (fill/outline) · размер (L/M/S/XS) · тон (системный StSystem · семантический success/info/warning/error · тональный по имени рампы green/lblue/orange/red/dpurple/grey/primary · алиасы accent=primary, dark=grey · solid-модификатор `-solid` на любой тон) · ведущий элемент (иконка/маркер/аватар) · действие (крестик ИЛИ шеврон — взаимоисключающе).
**Инварианты:** max-width 320px фиксирован на всех размерах; чип сжимаем (`min-width: 0`) — в чужой flex-строке уступает место и усекает подпись внутри плашки, а не вылезает за границу контейнера; `.chip--fit` — несжимаемый вариант для коротких фиксированных значений (код валюты, PE, «Применено: N»): подпись показывается целиком, не усекается до «R…»; hover/selected — только у Edit, Readonly не реагирует на курсор.
**Диагностика:** «Тултип не показывается на обрезанном disabled-чипе» → добавить класс `.chip--has-tooltip` · «Инфо-кнопка внутри readonly-чипа не фокусируется» → она должна быть отдельным `<button class="chip__info">`, не декоративным span

Чип — компактный интерактивный элемент для фильтрации и группировки данных.

```html
<span class="chip chip--edit chip--m chip--rounded" tabindex="0">
  <span class="chip__marker"><i data-icon="circle-filled"></i></span>
  <span class="chip__label">Активна</span>
  <span class="chip__remove" role="button" aria-label="Удалить Активна"><i data-icon="close"></i></span>
</span>
<!-- ведущий аватар = компонент Avatar (.av), содержимое text/icon/image -->
<span class="chip chip--edit chip--m"><span class="chip__avatar av av--circular"><span class="av__text">И</span></span><span class="chip__label">Иван Б.</span></span>
<span class="chip chip--m"><span class="chip__label">Договор</span></span>
<div class="chiplist" role="group" aria-label="Фильтры">…</div>
```

Ведущие слоты: `.chip__marker` / `.chip__icon` / `.chip__avatar` (Avatar-компонент; бейдж объединён с аватаром). Trailing `.chip__remove` И `.chip__dropdown` — взаимоисключающие. Отступы по слотам (как у кнопок): сторона с иконкой/аватаром/действием — меньше. Outline (`.chip--outline`) — без заливки даже у тонов. Тона: семантические `--success/--info/--warning/--error` · тональные `--green/--lblue/--orange/--red/--dpurple/--grey/--primary` (все — фон `-light` + обводка `-light`, текст `-dark`, иконка base) · алиасы `--accent`(=primary) `--dark`(=grey) · solid: модификатор `-solid` на любой тон (`chip--<tone>-solid`, base-заливка + белый текст). `--rounded` = pill — **статусные чипы всегда rounded**; **теги/флаг-категории (PE, валюта) — не статусы: не rounded, цвет кастомный по кейсу, и не сжимаются (`.chip--fit` — подпись показывается целиком)**. Аватар в статусном чипе: фон `-mid`, текст/иконка белые (`--text-on-dark`). Trailing `.chip__info` (button) — открывает Popover.

ReadOnly-чип — база `.chip`: модификатора `chip--readonly` в CSS нет, редактируемый вариант помечается `.chip--edit`.

Полная анатомия: specs/Chip.md.

## ContextMenu
css: `styles/context-menu.css` · js: `scripts/ds-menu.js` · deps: [button]
**Оси:** тип пункта (текст/иконка/шорткат/каретка-подменю/чекбокс-радио выбор) · позиционирование (start/end, авто-flip вверх/по горизонтали) · подменю (flyout по наведению) · переполнение (скролл, группировка, ~10 пунктов — предел).
**Инварианты:** галочка выбранного пункта — справа (trailing), не слева; до открытия меню невидимо и не участвует в layout.
**Классы:** .menu · .menu--scroll · .menu--floating · .menu__item · .menu__item--danger · .menu__item--wrap · .menu__item--sub · .menu__item-icon / -label / -hint / -caret / -check · .menu__label · .menu__divider · .is-hover / .is-focus / .is-active · role / aria-haspopup / aria-expanded / aria-checked / aria-disabled
**Диагностика:** «Меню открывается не из того угла» → `--menu-origin` не проставлен рантаймом относительно триггера · «Подменю уходит за край экрана» → должен появиться `.menu__sub--left`, разворот считает `ds-menu.js`

Контекстное меню — всплывающий список действий над объектом. Поведение out-of-box:
подключите `ds-menu.js` и оберните триггер+меню в `.menu-anchor`, атрибут
`data-menu="<id меню>"` на триггере — рантайм сам вешает aria, открытие/закрытие,
позиционирование с разворотом вверх и флипом выравнивания, клавиатуру
(↑ ↓ Home End Enter Space → ← Esc + typeahead) и подменю по наведению.
Настройки на триггере: `data-menu-placement` (bottom|top), `data-menu-align`
(start|end), `data-menu-gap` (6), `data-menu-flip="no"`, `data-menu-boundary`
(селектор границы), `data-menu-keep-open` (меню-выбор не закрывается по клику).
API: `DSMenu.bind(trigger, opts)` · `bindAll(root)` · `place(menu, trigger, opts)` ·
`wireKeys(menu)` · `wireSubs(menu)` · `closeAll()`.

```html
<span class="menu-anchor">
<button type="button" class="ibtn ibtn--neutral ibtn--l" aria-label="Действия"
        data-menu="m1" data-menu-align="end">⋮</button>
<div id="m1" class="menu" role="menu">
  <div class="menu__label">Действия</div>
  <button type="button" class="menu__item" role="menuitem">
    <span class="menu__item-icon"><i data-icon="edit"></i></span>
    <span class="menu__item-label">Изменить</span>
    <span class="menu__item-hint">⌘C</span>
  </button>
  <button class="menu__item" role="menuitemradio" aria-checked="true">…</button>
  <hr class="menu__divider">
  <button class="menu__item menu__item--danger" role="menuitem">Удалить</button>
  <button class="menu__item" role="menuitem" aria-disabled="true">Архив</button>
</div>
</span>
<script src="scripts/ds-menu.js"></script>
```

Полная анатомия: specs/ContextMenu.md.

## EmptyState
css: `styles/empty-state.css` · deps: [illustration, button]
**Оси:** размер (M/L) · поверхность (обычная/`--card`) · действия (0/1/2 кнопки).
**Инварианты:** рендерится только после завершения запроса, не как промежуточное состояние; при подстановке в ответ на действие пользователя — `role="status" aria-live="polite"` на родителе.
**Корнер-кейсы:** `.es__title` ellipsis (одна строка по спеке), `.es__text` overflow-wrap.
**Классы:** `.es` · `.es--m` / `.es--l` · `.es--card` · `.es__illu` · `.es__body` · `.es__title` / `.es__text` · `.es__actions`
**Диагностика:** «Заголовок обрезается неожиданно» → по спеке он всегда однострочный эллипсис — сократить текст, не менять CSS · «Компонент показан во время загрузки» → заменить на Spinner/Skeleton, EmptyState — только финальное состояние

Иллюстрация + заголовок + опциональный текст + опциональные действия (до 2 кнопок) — пустой список/таблица, нет результатов поиска, первый вход без данных, полноэкранная ошибка. Размер M (96px илл., встроен в контейнер) / L (160px, полноэкранный). `.es--card` — своя рамка/фон для отдельно стоящего состояния.

```html
<div class="es es--m">
  <span class="illu es__illu" data-illu="empty-folder" aria-hidden="true"></span>
  <div class="es__body">
    <p class="es__title">Нет сделок</p>
    <p class="es__text">По заданным фильтрам сделки не найдены. Попробуйте изменить условия поиска.</p>
  </div>
  <div class="es__actions">
    <button class="btn btn--accent btn--m">Сбросить фильтры</button>
    <button class="btn btn--transparent btn--m">Завести сделку</button>
  </div>
</div>
<!-- … полная анатомия: specs/EmptyState.md -->
```

## DatePicker
css: `styles/datepicker.css` · deps: [icon-button, button]
**Оси:** режим (single/range/month) · представление (day/month/year) · футер (нет/кнопки/«Сегодня») · размещение (floating/inline).
**Инварианты:** один открытый календарь одновременно; клик раньше начала диапазона перезапускает выбор.
**Корнер-кейсы:** `.dpk__caption` текст-заголовок ellipsis.
**Классы:** `.dpk` (+ `--inline` / `--panel`) · `.dpk__head` / `.dpk__caption` / `.dpk__cap-icon` / `.dpk__nav` · `.dpk__weekdays` / `.dpk__weekday` · `.dpk__grid` / `.dpk__day` / `.dpk__daynum` · `.dpk__day--outside/--today/--selected/--disabled` · `.dpk__day--range-start/--range-end/--in-range` · `.dpk__panel(.--years)` / `.dpk__panel-cell(.--current/--selected/--disabled)` · `.dpk__foot` / `.dpk__foot-left` / `.dpk__foot-right` · `role="dialog"` / `aria-modal="false"` · `role="grid"` / `role="gridcell"` / `aria-selected` / `aria-disabled`
**Диагностика:** «Заголовок календаря обрезается непредсказуемо» → `.dpk__caption` требует ellipsis на первом `span` внутри `max-width:100%` · «Клик по дате раньше начала диапазона не перезапускает выбор» → проверить логику рантайма выбора диапазона

Рантайм `scripts/ds-datepicker.js` (out-of-box): `makeCalendar` · `openPicker(anchor, spec)` · автоподключение кнопки-календаря полей InputDate / InputDateRange.

Календарь — всплывающая поверхность выбора даты/диапазона. Поднимается InputDate / InputDateRange (floating) или встраивается в панель/модалку (inline). Material в токенах ДС, неделя с Пн, локаль RU. Ширина 304px, ячейка дня 40×40 (единая для всех вариантов футера, футерные кнопки — XS).

```html
<div class="dpk" role="dialog" aria-modal="false" aria-label="Выбор даты">
  <div class="dpk__head">
    <button class="dpk__caption" aria-haspopup="true"><span>Октябрь 2025</span><span class="dpk__cap-icon"><i data-icon="chevron-down"></i></span></button>
    <div class="dpk__nav">
      <button class="ibtn ibtn--neutral ibtn--s dpk__prev" aria-label="Назад"><i data-icon="chevron-left"></i></button>
      <button class="ibtn ibtn--neutral ibtn--s dpk__next" aria-label="Вперёд"><i data-icon="chevron-right"></i></button>
    </div>
  </div>
  <div class="dpk__weekdays" aria-hidden="true"><span class="dpk__weekday">Пн</span>…<span class="dpk__weekday">Вс</span></div>
  <div class="dpk__grid" role="grid">
    <button class="dpk__day dpk__day--outside" role="gridcell" tabindex="-1"><span class="dpk__daynum">29</span></button>
    <button class="dpk__day dpk__day--today" role="gridcell" aria-selected="false" tabindex="-1"><span class="dpk__daynum">15</span></button>
    <button class="dpk__day dpk__day--selected" role="gridcell" aria-selected="true" tabindex="0"><span class="dpk__daynum">21</span></button>
    <!-- диапазон: dpk__day--range-start / --in-range / --range-end -->
  </div>
  <!-- опц. футер -->
  <div class="dpk__foot">
    <div class="dpk__foot-left"><button class="btn btn--transparent btn--xs dpk__today"><span class="btn__label">Сегодня</span></button></div>
    <div class="dpk__foot-right">
      <button class="btn btn--transparent btn--xs dpk__cancel"><span class="btn__label">Отменить</span></button>
      <button class="btn btn--accent btn--xs dpk__ok"><span class="btn__label">Применить</span></button>
    </div>
  </div>
</div>
```

Режимы: single / range / month · представления: day / month / year (`.dpk--panel` + `.dpk__panel(.--years)` > `.dpk__panel-cell`, переключаются заголовком/стрелками — стрелки навигации остаются видимыми и в month/year, листая блок ±1 год / ±12 лет). Состояния дня: default · hover · today (обводка `--primary`) · selected/концы диапазона (заливка `--primary`, число `--text-on-dark`) · in-range (полоса `--primary-bg`) · disabled (`--st-disabled`) · outside. Размещение: `--inline` (рамка, без тени) vs floating (`--elevation-5`, под полем, авто-flip как Popover). Полная анатомия: specs/DatePicker.md.

## Divider
css: `styles/divider.css` · deps: [button]
**Оси:** ориентация (horizontal/vertical) · отступы (full/inset/middle) · толщина/контраст (`--border-light`/`--border-primary`/блок-секция 8px) · подпись (центр/край).
**Инварианты:** `.dvd--section` — заливка фоном, не бордер; inset-модификаторы работают только у horizontal.
**Корнер-кейсы:** `.dvd-text__label` сжимается с ellipsis вместо распирания шва.
**Классы:** .dvd · .dvd--h / --v · .dvd--inset / --middle · .dvd--section · .dvd--strong · .dvd--dashed · .dvd-text / --left / --center / --right · .dvd-text__label · role="separator" / aria-orientation · aria-hidden="true"
**Диагностика:** «Подпись распирает разделитель по ширине» → `.dvd-text__label` должен получить min-width:0 + ellipsis, а не фиксированную ширину · «Вертикальный разделитель нулевой высоты» → родитель не flex-контейнер или не даёт `align-self:stretch`
Разделительная черта — тонкая линия, которая визуально отделяет одни части интерфейса от других.

```html
<hr class="dvd dvd--h">
<hr class="dvd dvd--h dvd--inset">   <!-- Inset -->
<hr class="dvd dvd--h dvd--middle">  <!-- Middle -->
<hr class="dvd dvd--h dvd--section"> <!-- блок-секция 8px -->
<div class="dvd dvd--v" role="separator" aria-orientation="vertical"></div>
<div class="dvd-text" role="separator">
  <span class="dvd-text__label">или</span>
</div>
<hr class="dvd dvd--h" aria-hidden="true">
```

Текст по центру — база `.dvd-text`: класса `dvd-text--center` в CSS нет, смещения — `--left` / `--right`.

Полная анатомия: specs/Divider.md.

## IconButton
css: `styles/icon-button.css` · deps: [badge, spinner]
**Оси:** тон (neutral/primary/danger/contrast) · размер (L/M/S = размеру иконки) · режим-переключатель (selected) · встроенный вариант (`--embedded`, без рипла) · бейдж.
**Инварианты:** обязателен `aria-label` — нет видимого текста.
**Корнер-кейсы:** `.ibtn{flex:none}` — не сжимается в тесном flex-ряду.
**Классы:** .ibtn · .ibtn--neutral / --primary / --danger / --contrast · .ibtn--l / --m / --s · .ibtn--square · .ibtn--embedded · .ibtn--selected · .ibtn--loading · disabled · .is-hover / .is-pressed / .is-focus · .spin.spin--current · .ibtn__badge · aria-label · aria-pressed
**Диагностика:** «Кнопка сжимается в тесном flex-ряду» → `.ibtn{flex:none}` — по спеке не должна сжиматься, проверить переопределение flex · «Скринридер не озвучивает кнопку» → отсутствует `aria-label`

Безрамочная кнопка с одной иконкой и круглым стейт-слоем (риплом).

```html
<button type="button" class="ibtn ibtn--neutral ibtn--s" aria-label="Редактировать">
  <i data-icon="edit"></i>          <!-- 24/20/16 px по размеру кнопки -->
</button>
<button type="button" class="ibtn ibtn--primary ibtn--l ibtn--selected" aria-pressed="true" aria-label="В избранном">
  <i data-icon="star-filled"></i>
</button>
<button type="button" class="ibtn ibtn--neutral ibtn--s ibtn--loading" aria-busy="true" aria-label="Ещё">
  <span class="spin spin--current"></span>
</button>
<button type="button" class="ibtn ibtn--neutral ibtn--l" aria-label="Сделки">
  <i data-icon="folder"></i>
  <span class="ibtn__badge"><span class="badge badge--xs badge--accent">3</span></span>
</button>
```

`.ibtn__badge` — правый верхний угол рамки (top:0/right:0), не выходит за габарит; счётчик ≤ 2 символов, при значении > 99 показываем «9+».

Полная анатомия: specs/IconButton.md.

## Illustrations (Иллюстрации)
css: styles/illustration.css · deps: — · 1.003
Слот продуктовой иллюстрации; scripts/ds-illustrations.js подставляет реальный SVG из assets/illustrations/<data-illu>.svg (32 тайловых 195×140 + 4 состояния + 1 фоновая). Размер = width/height слота, object-fit:contain. Неизвестное имя → штриховая заглушка (.illu:empty). Скрипт авто-дорендерит слоты, добавленные в DOM позже (MutationObserver) — динамически пересобранные конструкторы/тайквики не остаются без иллюстрации; рендер также через window.DSIllustrations.render().dth/height слота (дефолт 96×96). Всегда aria-hidden. Имена: deals, partners, reports, tasks, admin, empty-search.
```
<span class="illu" data-illu="deals" aria-hidden="true"></span>
```

Полная анатомия: specs/Illustrations.md.

## Layout (Каркас экрана)
css: `styles/layout.css` · deps: [nav-panel, breadcrumbs, spacing] · 1.009
**Оси:** режим навигации (rail 56 / drawer оверлей / fixed 272) · тип контента (тайлы .grid12 / таблица во всю ширину / карточка сущности) · высота вьюпорта (обычный / app-shell `.screen--app`).
**Инварианты:** между панелью и рабочей областью отступа нет; между крошками и контентом отступ 8px (--layout-pad-top); поля контентной области — 8px сверху, 24px слева/справа и 24px снизу; зона крошек 44px и её поля 24px принадлежат компоненту Breadcrumbs, экран их не задаёт; крошки и контент выровнены по одной вертикали; **у экрана горизонтального скролла не бывает никогда — адаптивная вёрстка закладывается при проектировании, объект за границей экрана — баг**; исключение — контейнер со скроллом в собственной раскладке (тело таблицы, отдельный тайл), не сама рабочая область; скроллится только контент — крошки sticky, панель fixed на 100vh со своим внутренним скроллом списка; сетка не дублируется — .grid12/.col-N из Spacing; **единственная/основная таблица страницы занимает всю свободную высоту** (минус крошки/шапка/тулбар) — `.screen--app` на `.screen` + `.dtable--fill` на таблице, тело скроллится внутри; тайлы над/под таблицей — индивидуально, но таблица по умолчанию всё равно на оставшуюся высоту.
**Классы:** .nav-layout · .screen · .screen--app (фикс. вьюпорт 100vh, overflow:hidden; .screen__content min-height:0) · .screen > .crumbs (sticky) · .screen__content · .grid12 / .col-N · токены --layout-pad-top 8 / --layout-pad-x 24 / --layout-pad-bottom 24 / --layout-crumbs-h 44 / --layout-block-gap 24.
**Диагностика:** «крошки и заголовок на разных вертикалях» → переопределены поля, должно быть 24 и там, и там · «зазор между крошками и контентом не 8px» → у .screen__content переопределён padding-top (должен быть var(--space-8)) или у .crumbs задан margin-bottom (должен быть 0) · «крошки уезжают при скролле» → .crumbs не прямой ребёнок .screen · «контент прижат к панели» → потерян .nav-layout · «главная таблица не заполняет высоту / тело не скроллится» → нет `.screen--app` (родитель без фикс. высоты) или на таблице нет `.dtable--fill`.

```html
<div class="nav-layout">
  <nav class="nav nav--rail" aria-label="Главное меню">…</nav>
  <div class="screen">
    <nav class="crumbs" aria-label="Хлебные крошки" data-breadcrumbs>…</nav>
    <main class="screen__content">
      <header class="phead">…PageHeader…</header>
      <div class="grid12"><section class="col-3">…</section></div>
    </main>
  </div>
</div>
```

Полная анатомия: specs/Layout.md.

## InputText
css: `styles/input.css` · deps: [label-helper, tooltip, chip]
**Оси:** слой (текст/пароль/многострочный/InputAmount) · размер (M/S Table Edit) · ограничение длины (`maxLength` → счётчик) · resizable.
**Инварианты:** текст ошибки/предупреждения — только в тултипе при *Focus, не в хелпере.
**Классы:** `.inp` · `.inp--m` / `.inp--s` · `.inp--error` / `--warning` / `--disabled` · `.inp--multiline` · `.is-hover` / `.is-focus` / `.is-open` · `.inp__field` · `.inp__lead` · `.inp__prefix` / `.inp__postfix` · `.inp__control` · `.inp__acts` / `.inp__act` · `.ds-label` / `.ds-helper`
**Диагностика:** «Ошибка показана и в хелпере, и в тултипе одновременно» → убрать текст ошибки из хелпера, оставить только тултип на фокусе · «Крестик очистки виден на disabled-поле» → должен скрываться правилом `.inp--disabled .inp__act[aria-label="Очистить поле"]`

Базовое поле ввода текста. База `.inp` (метка + поле Input_Content + хелпер) общая для InputText / InputDate / InputAutocomplete. Текстовый слой: иконка слева (любая из библиотеки ДС, не привязана к поиску), префикс, значение, постфикс. Действия справа: информер → крестик очистки (или «показать/скрыть» для пароля — крестика тогда нет) → календарь → шеврон. Опционально — счётчик символов (`maxLength`, справа под полем) и resize по вертикали у многострочного (`--resizable`). Размеры M (40px) / S (32px, только Table Edit). Состояния: Default/Hover/Focus/Error/ErrorFocus/Warning/WarningFocus/Disabled.

```html
<div class="inp">
  <label class="ds-label" for="inn"><span class="ds-label__text">ИНН</span></label>
  <div class="inp__field">
    <span class="inp__lead">…search…</span>
    <span class="inp__prefix">От</span>
    <input class="inp__control" id="inn" placeholder="Например, 7707083893" aria-describedby="inn-h">
    <span class="inp__postfix">RUB</span>
    <span class="inp__acts">
      <button class="inp__act" aria-label="Очистить поле">…✕…</button>
      <button class="inp__act inp__act--static" aria-label="Подсказка">…ⓘ…</button>
    </span>
  </div>
  <span class="ds-helper ds-helper--left" id="inn-h">10 или 12 цифр</span>
</div>
<!-- многострочный: .inp--multiline + textarea.inp__control -->
```

Размер M — база: классов `inp--m` / `inp-range--m` в CSS нет, компактный вариант — `.inp--s`. Рантайм `input-kit.js` модификатор размера при M не выдаёт.

Полная анатомия: specs/InputText.md.

## InputDate
css: `styles/input.css` · deps: [label-helper, tooltip]
**Оси:** размер (M/S Table Edit) · информер (опц.).
**Инварианты:** база `.inp` общая с InputText; календарь самоподключается по `.inp__act[aria-label="Открыть календарь"]` — через `ds-datepicker.js`, без глу-кода на странице.
**Классы:** `.inp / --m / --s / --error / --warning / --disabled` · `.inp__act[aria-label="Открыть календарь"]` · `input[inputmode="numeric"]` · `aria-haspopup="dialog"` / `aria-expanded`
**Диагностика:** «Календарь не открывается по клику на кнопку» → кнопка должна иметь `aria-label="Открыть календарь"` — по нему рантайм биндит `ds-datepicker.js` · «Маска выглядит как введённое значение» → это должен быть `placeholder`, не `value`

Поле ввода даты: маска ММ.ДД.ГГГГ (в placeholder) + кнопка-календарь, поднимающая DatePicker (отдельный компонент, TBD). База `.inp` общая с InputText. Действия: крестик очистки · информер (опц.) · календарь (фиксированный, всегда последний). `input[inputmode="numeric"]`, разделители подставляются автоматически. Размеры и состояния — как у InputText.

```html
<div class="inp">
  <label class="ds-label" for="d1"><span class="ds-label__text">Дата подписания</span></label>
  <div class="inp__field">
    <input class="inp__control" id="d1" placeholder="ММ.ДД.ГГГГ" inputmode="numeric">
    <span class="inp__acts">
      <button class="inp__act" aria-label="Очистить поле">…✕…</button>
      <button class="inp__act" aria-label="Открыть календарь" aria-haspopup="dialog">…📅…</button>
    </span>
  </div>
  <span class="ds-helper ds-helper--left">Не раньше даты договора</span>
</div>
```

Полная анатомия: specs/InputDate.md.

## InputAutocomplete
css: `styles/input.css` · deps: [label-helper, checkbox, chip, tooltip, dropdown-list]
**Оси:** показ выбора (сводка/чипы в поле/внешний стек) · наполнение списка (текст/чекбоксы) · размер (M/S Table Edit).
**Инварианты:** список опций и способ показа выбранного — по одному варианту на инстанс, не смешиваются.
**Классы:** `.inp / --m / --s / --error / --warning / --disabled` · `.inp.is-open` · `.inp__summary` · `.inp__chips` · `.inp-ext` · `.inp__act--chev` · `.chip.chip--edit.chip--s / --xs` · `.ddl / .ddl__item / .ddl__item--checkbox / .ddl__match` · `role="combobox"/listbox/option` · `aria-expanded/-controls/-multiselectable/-selected/-checked`
**Диагностика:** «Список открывается своей ширины, не по полю» → DropdownList должен наследовать ширину триггера, не `--ddl-min/max` · «Выбранные значения показаны и чипами, и сводкой одновременно» → оставить один способ показа на инстанс
**Из коробки:** подключить `scripts/ds-dropdownlist.js` — `DSDropdownList.bind(field, {...})` даёт открытие/закрытие/фильтрацию/клавиатуру.

Поле-триггер + DropdownList под ним. Список: текстовые опции (одиночный выбор) ИЛИ опции с чекбоксами (`ddl__item--checkbox`, множественный). Показ выбора — три способа: сводка `.inp__summary` («Value 1, +4»), чипы в поле `.inp__chips` (при переполнении чип-счётчик «+N» — без крестика удаления), внешний стек чипов `.inp-ext` под полем. Чип берётся на размер меньше поля (M→S, S→XS). Обязательный шеврон `.inp__act--chev` (поворот в `.is-open`). Фильтрация по вводу с подсветкой `.ddl__match`. Устройство списка — см. Select · DropdownList. Размеры M / S (Table Edit — только сводкой). Состояния — как у InputText.
Корнер-кейс: живой filter-демо (`input-autocomplete.page.js`) закрывается по клику вне/Esc; стрелочная клавиатура (↑↓/Enter активной опции) в демо ещё не реализована — только клик (13.08.2026).

```html
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
    <button class="ddl__item ddl__item--checkbox ddl__item--all" role="option" aria-checked="mixed">
    <span class="ddl__item-check"><span class="cb__box"><span class="cb__mark">…</span></span></span>
    <span class="ddl__item-body"><span class="ddl__item-label">Выбрать всё</span></span>
  </button>
  <hr class="ddl__divider">
  <button class="ddl__item ddl__item--checkbox" role="option" aria-checked="true">…</button>
  </div>
  <!-- вариант Chips Ext: <div class="inp-ext" role="group">…чипы…</div> вместо .inp__chips -->
</div>
```

Полная анатомия: specs/InputAutocomplete.md.

## InputAmountRange
css: `styles/input-range.css` · deps: [input, label-helper, tooltip]
**Оси:** наполнение (пусто/одно поле/оба) · только размер M.
**Инварианты:** поля независимы — hover/focus/error одного не влияют на другое, оба могут быть в ошибке одновременно.
**Классы:** `.inp-range / --m` · `.inp-range--disabled` · `.inp-range__row` · `.inp-range__field` · `.inp-range__line` · `.inp__prefix` · `.inp--error / --warning / --disabled`
**Диагностика:** «Фокус одного поля окрашивает оба» → состояния должны быть заданы на каждом `.inp` отдельно, не на общем `.inp-range`

Поле ввода числового диапазона: два InputAmount с префиксами «От»/«До» + Range_Line между ними, общая метка сверху и общий хелпер снизу. Только размер M (40px), размера S нет. Каждое поле — независимый `.inp` со своими состояниями (hover/focus/error одного не влияют на другое; оба могут быть в ошибке). В полях всегда префикс. Range_Line — 1px, цвет `--border-primary` (в disabled `--border-light`), `aria-hidden`.

```html
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

Полная анатомия: specs/InputAmountRange.md.

## InputDateRange
css: `styles/input-range.css` · deps: [input, label-helper, tooltip]
**Оси:** наполнение (пусто/одно поле/оба) · только размер M (мин. ширина поля 186px).
**Инварианты:** календарь самоподключается через `ds-datepicker.js` (как InputDate); поля независимы между собой.
**Классы:** `.inp-range / --m / --date` · `.inp-range--disabled` · `.inp-range__row` · `.inp-range__field` · `.inp-range__line` · `.inp__prefix` · `.inp__act[aria-label="Открыть календарь"]` · `.inp--error / --warning / --disabled`
**Диагностика:** «Поле диапазона дат обрезает иконки при сужении» → `.inp-range--date .inp-range__field{min-width:186px}` не должен переопределяться

Поле ввода диапазона дат: два InputDate (маска ММ.ДД.ГГГГ + календарь) с префиксами «От»/«До» + Range_Line, общая метка/хелпер. Только размер M (40px), размера S нет. Мин. ширина каждого поля 186px. Поля независимы (см. InputAmountRange). Префикс всегда присутствует. Range_Line — 1px `--border-primary`, `aria-hidden`.

```html
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

Полная анатомия: specs/InputDateRange.md.

## LabelHelper
css: `styles/label-helper.css` · deps: [checkbox, radio, switch, icon-button]
**Оси:** независимое подключение (только Label / только Helper / оба) · выравнивание (left/right, одно на оба слота).
**Инварианты:** не самостоятельный компонент, без своего контейнера — только в составе родителя.
**Диагностика:** «Label и Helper выровнены в разные стороны» → привести оба к одному направлению (`--left`/`--right`) · «Ошибка не видна» → она рендерится только в Helper (`.ds-helper--error`), не в Label

Общие вспомогательные текстовые слоты, вынесенные из нескольких родительских компонентов в отдельную группу.

```html
<label class="ds-label" for="field-inn">
  <span class="ds-label__text">ИНН контрагента</span>
</label>
<input id="field-inn" aria-describedby="field-inn-helper" aria-invalid="true" />
<span id="field-inn-helper" class="ds-helper ds-helper--left ds-helper--error ds-helper--with-icon" role="alert">
  <span class="ds-helper__icon" aria-hidden="true"><i data-icon="alert-triangle"></i></span>
  <span class="ds-helper__text">Нужно 10 или 12 цифр</span>
</span>
```

Иконки в Label (редкий кейс, 0–2) — IconButton S neutral (`.ibtn .ibtn--s .ibtn--neutral`), aria-label обязателен.

Выравнивание влево — база `.ds-label` / `.ds-helper`: класса `--left` в CSS нет, вправо — `--right`.

Полная анатомия: specs/LabelHelper.md.

## Link
css: `styles/link.css` · deps: [breadcrumbs]
**Оси:** тон (accent/muted/neutral/info/warning/error/success) · размер (M/S) · инлайн/standalone.
**Инварианты:** тон Neutral (Breadcrumbs_2) не кликабелен — только Default.
**Классы:** .link · .link--accent / --muted / --neutral · .link--m / --s · .link--inline · .link--with-icon · .link--truncate · .link--disabled / aria-disabled="true" · .is-hover / .is-pressed / .is-focus · .link__icon · target="_blank" · rel="noopener" · .crumbs · разделитель «/» · .crumbs__current + aria-current="page" · .crumbs__more
**Диагностика:** «Ссылка визуально неактивна при hover» → проверить тон — Neutral специально без hover · «На клавиатурном фокусе рамка вместо подчёркивания» → должно быть подчёркивание, как на hover, без отдельного outline

Текстовая ссылка для навигации внутри лайаута и модальных окон, а также в Хлебных крошках.
Тоны: `accent` (осн.), `muted`/`neutral` (Хлебные крошки), `info`/`warning`/`error`/`success` — тон в цвет плашки Alert/SnackBar (`.link--<tone>`).

```html
<a class="link link--accent link--m" href="/deals/4521">Открыть договор</a>
… подробнее в <a class="link link--accent link--inline" href="/help">справке</a> …
<a class="link link--accent link--m link--with-icon" href="/report.pdf">
  <span class="link__icon"><i data-icon="download"></i></span>
  Скачать PDF
</a>
<a class="link link--accent link--m link--with-icon" href="https://…"
   target="_blank" rel="noopener" aria-label="Открыть в реестре (открывается в новой вкладке)">
  Открыть в реестре
  <span class="link__icon"><i data-icon="link-external"></i></span>
</a>
<nav class="crumbs" aria-label="Хлебные крошки">
  <li class="crumbs__item"><a class="link link--muted" href="/">Главная</a></li>
  <li class="crumbs__item crumbs__item--current">
    <span class="crumbs__current" aria-current="page">Договор №4521</span>
  </li>
<!-- … полная анатомия: specs/Link.md -->
```

## Modal
css: `styles/modal.css` · js: `scripts/ds-modal.js` · deps: [button, icon-button, label-helper, checkbox, alert]
**Оси:** ширина (`--modal-w-2…12`, шаг колонок, 3–9 типичны) · подвал (слева опц./справа Primary обязателен) · `--body--roomy`.
**Инварианты:** варианта в одну колонку нет и не может быть; левые+правые кнопки одновременно не используются.
**Классы:** `.modal-scrim` · `.modal-scrim--nested` · `.modal-scrim--inline` · `.modal` · `.modal--w2 … --w12` · `.modal__alert` · `.modal--saving` · `.modal__head` / `.modal__foot` · `.modal__title` · `.modal__close` · `.modal__body` · `.modal__body--flush` · `.modal__body--roomy` · `.sk-line` / `.sk-group` · `.modal__foot-left` / `-right` · `.btn--danger` · `role="dialog"` / `alertdialog` · `aria-modal`, `aria-labelledby`
**Диагностика:** «Модалка выше экрана» → тело должно скроллиться (`.modal__body{overflow-y:auto}`), шапка/подвал не сжимаются (`flex:none`) · «Кнопки подвала не влезают в ряд» → увеличить ширину модалки (`--modal-w-*`), не переносить кнопки на вторую строку

Не компонент в привычном смысле — свод правил построения модальных форм. Обязательны шапка (Modal_Top: заголовок H4 Strong 22/24 + крестик IconButton Neutral L; строка 24px, зазор 24px, паддинги 20/20/20/24) и подвал (Modal_Bottom, паддинги 16px, всегда один ряд: опционально слева, обязательно Primary справа); между ними — необязательный Alert уровня модалки (`.modal__alert` + `.alert--flush`) и Modal_Body (паддинги 16/24/24, зазор 16px) — произвольный прокручиваемый контент. Радиус 8px. Ширина — шаги шкалы колонок 2–12 (`--modal-w-2…12`, 289–1816px на 1920; варианта в 1 колонку нет). Высота — по контенту до 80vh, дальше скролл тела. Закрытие: крестик/Esc/скрим — кроме guarded-форм с несохранённым вводом (скрим игнорируется). Диалог подтверждения удаления — вложенный `.modal-scrim--nested` с Primary в тоне `.btn--danger`.

```html
<div class="modal-scrim">
  <div class="modal modal--w6" role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <header class="modal__head">
      <h2 class="modal__title" id="modal-title">Новая сделка</h2>
      <button type="button" class="ibtn ibtn--neutral ibtn--l" aria-label="Закрыть"><i data-icon="close"></i></button>
    </header>
    <!-- опционально: ошибка/предупреждение уровня всей модалки -->
    <div class="modal__alert"><div class="alert alert--error alert--m alert--flush" data-alert-tone="error" role="alert">…</div></div>
    <div class="modal__body">…любой контент — форма, таблица, пустое состояние…</div>
    <footer class="modal__foot">
      <div class="modal__foot-left">
        <button class="btn btn--transparent btn--s"><i data-icon="edit"></i><span class="btn__label">Изменить</span></button>
      </div>
      <div class="modal__foot-right">
        <button class="btn btn--transparent btn--m"><span class="btn__label">Очистить фильтр</span></button>
        <button class="btn btn--accent btn--m"><span class="btn__label">Сохранить</span></button>
      </div>
    </footer>
  </div>
</div>
<!-- диалог подтверждения — вложенный поверх открытой модалки -->
<div class="modal-scrim modal-scrim--nested">
  <div class="modal modal--w3" role="alertdialog" aria-modal="true">
    …заголовок + сообщение + <button class="btn btn--accent btn--m btn--danger"><span class="btn__label">Удалить</span></button>
  </div>
</div>
<!-- … полная анатомия: specs/Modal.md -->
```

**Из коробки:** подключить `scripts/ds-modal.js`. Триггер — `data-modal="<id скрима>"`, скрим лежит в разметке с `hidden`; рантайм даёт портал в body, блокировку прокрутки, inert фона, focus trap, закрытие крестиком/Esc/скримом, тени шапки и подвала, стек вложенных диалогов. `data-modal-guarded` — форма с несохранённым вводом (скрим не закрывает), `data-modal-nested` — слой поверх текущего, `data-modal-close` — кнопка закрытия.

## NavPanel
css: `styles/nav-panel.css` · deps: [icon-button, badge, avatar]
**Оси:** режим (rail/drawer/fixed) · элементы (burger/item/item+badge/footer/divider/пункт-родитель, каждый в двух обликах Rail/Drawer) · сворачивание drawer кликом вне / Esc (только не-fixed).
**Инварианты:** три режима — один компонент, не три разных; в Rail подпись скрыта и появляется только тултипом. **Хост-контракт — из коробки:** оборачивать `.nav` + контент в `.nav-layout` (сам компонент это уже умеет через CSS `:has()`) — `.nav` всегда `position:fixed;height:100vh`, отступ контента = ширине Rail и в Rail, и в Drawer (оверлей, не раздвигает), увеличивается до 272px только в `nav--fixed`.
**Классы:** `.nav` · `.nav--rail` / `.nav--drawer` / `.nav--fixed` · `.nav__top` · `.nav__burger` / `.nav__pin` · `.nav__list` · `.nav__block` · `.nav__block-label` · `.nav__item` · `.nav__item--selected` / `.nav__item--disabled` · `.nav__item--acc` · `.nav__caret` · `.nav__sub` / `.nav__sub-in` · `.nav__ico` / `.nav__label` / `.nav__badge` · `.nav__footer` / `.nav__user` / `.nav__logout`
**Диагностика:** «В Rail подпись пункта видна постоянно» → должна быть скрыта, появляться только тултипом на hover/focus · «Иконки/бургер/аватар не на одной вертикальной линии» → все три должны считаться от общей оси 28px, не выравниваться по отдельности

Главная навигация приложения слева. Три режима: `nav--rail` (56px, иконки, тултип по hover, без тени), `nav--drawer` (272px, оверлей, тень Shadow4.0_modalform), `nav--fixed` (272px, закреплён, шов справа). Drawer (не fixed) сворачивается в rail кликом вне `.nav` или по Esc; клики внутри открытых модалок (например, смена роли из футера) панель не сворачивают. Список = «Главная» + navigation-block'и (заголовок-секция + пункты), внизу футер: строка пользователя — ссылка на личный кабинет + кнопка выхода. Иконки пунктов — глифы раздела Menu (specs/Icons.md). Пункт с тайлом-со-ссылками (`item.tile.links`) — аккордеон-родитель `.nav__item--acc`: ссылки тайла — под-пунктами `.nav__sub` (без иконок, по умолчанию свёрнуты).

```html
<nav class="nav nav--rail" aria-label="Главное меню">
  <div class="nav__top">
    <button class="ibtn ibtn--neutral ibtn--m nav__burger" aria-label="Свернуть меню"><i data-icon="left-menu"></i></button>
    <button class="ibtn ibtn--neutral ibtn--m nav__pin" aria-pressed="false" aria-label="Закрепить панель"><i data-icon="pin-menu"></i></button>
  </div>
  <div class="nav__list">
    <a class="nav__item nav__item--selected" href="#" aria-current="page"><span class="nav__ico"><i data-icon="main-page"></i></span><span class="nav__label">Главная</span></a>
    <div class="nav__block">
      <div class="nav__block-label">Отчёты</div>
      <!-- пункт-родитель с вложенным под-списком (аккордеон; в Rail каретка и под-список скрыты; по умолчанию свёрнут): -->
      <a class="nav__item nav__item--acc" href="#" aria-expanded="false" aria-controls="nested-sub"><span class="nav__ico"><i data-icon="rwa"></i></span><span class="nav__label">Отчёты для Рисков</span><span class="nav__caret"><i data-icon="chevron-down"></i></span></a>
      <div class="nav__sub" id="nested-sub"><div class="nav__sub-in">
        <a class="nav__item" href="#"><span class="nav__label">Коды RWA</span></a>
        <a class="nav__item" href="#"><span class="nav__label">Расчет RWA</span></a>
        <a class="nav__item" href="#"><span class="nav__label">Расчет ОВП</span></a>
      </div></div>
      <a class="nav__item" href="#" aria-label="Задачи, 7"><span class="nav__ico"><i data-icon="tasks"></i></span><span class="nav__label">Задачи</span><span class="nav__badge"><span class="badge badge--xs badge--accent" aria-hidden="true">7</span></span></a>
    </div>
  </div>
  <div class="nav__footer">
    <a class="nav__user" href="#" aria-label="Открыть личный кабинет">
      <span class="av av--circular av--m"><span class="av__text">АП</span></span>
      <span class="nav__user-text"><span class="nav__user-name">Александров Петр</span><span class="nav__user-role">Финансист ДИД</span><span class="nav__user-org">SMB Недвижимость +2</span></span>
    </a>
    <button class="ibtn ibtn--neutral ibtn--m nav__logout" data-modal="nav-role-modal" aria-label="Сменить роль / выйти"><i data-icon="logout"></i></button>
  </div>
</nav>
<!-- Развёрнутый вид — nav--drawer (подписи видимы, тень, оверлей). Fixed: nav--fixed (шов справа, без тени). -->
```

Пункт: Default текст/иконка `--text-secondary`; Hover заливка `--bgtable-row-hover`; Selected заливка `--bgtable-row-focus` + подпись Strong; Disabled `--text-inactive` + бейдж `badge--muted`. Высота пункта 44px, иконка 24, badge XS accent. **Бургер, пин и выход — строго `ibtn--m`**: вертикальная ось панели (28px от левого края во всех режимах) рассчитана в `styles/nav-panel.css` именно от него (`top 18 + 10 = 28`); `ibtn--s` ломает выравнивание бургера с иконками пунктов и аватаром. **Строка пользователя в футере — ссылка на личный кабинет** (`<a class="nav__user" aria-label="Открыть личный кабинет">`), ховер фоном по всей полосе (`.nav__footer:hover`); должность — заглушка по текущей роли; **кнопка `.nav__logout` открывает модалку смены ролей** (`data-modal`). Состав меню — по роли из `scripts/ibp-home.js` (`window.IBPHome`, единый каталог с тайлами главной; `tile: null` — пункт без тайла); мастер-состав групп и модель ролей (full/partial) — в specs/NavPanel.md. Полная анатомия: specs/NavPanel.md.

**Из коробки:** подключить `scripts/ds-nav-panel.js` — самоинициализация по `.nav`: бургер сворачивает/разворачивает панель (rail ↔ последний развёрнутый режим), пин переключает drawer ↔ fixed (aria-pressed и иконка pin-menu/unpin-menu меняются сами), подписи пунктов в rail позиционируются как тултипы (`position:fixed`, пересчёт по hover/focus, скроллу списка и resize), пункт-родитель `.nav__item--acc` (рендер — по `item.tile.links`, по умолчанию свёрнут) раскрывает/сворачивает под-список (в rail клик разворачивает панель). Настройки на панели: `data-nav-collapsed-mode` (drawer|fixed — куда разворачивает бургер), `data-nav-modes="no"` (только rail-тултипы, режимы не переключаются), `data-nav-auto="no"` (не подключать). API: `DSNavPanel.bind(nav, opts)`, `bindAll(root)`, `setMode(nav, mode)`, `placeRailLabels(nav)`. Событие `ds-nav-mode` на `.nav` с `detail {mode, prev}`.

## NavTile
css: styles/nav-tile.css · deps: illustration, link · 1.010
**Оси:** вариант (базовая-ссылка/со ссылками — div без hover) · состояния (default/hover/focus/disabled).
**Инварианты:** плитка не сжимается меньше 400px; вариант «со ссылками» — `<div>`, не `<a>`.
**Корнер-кейсы:** `.ntile__title` ellipsis, `.ntile__desc` clamp 2 строки.
**Диагностика:** «Текст наезжает на иллюстрацию при сужении» → не опускать ширину контейнера ниже `min-width:400px` · «В варианте со ссылками кликабельна вся плитка» → контейнер должен быть `<div>`, кликабелен только `.ntile__title-link`
Навигационная плитка главной страницы: слева название (H4 Strong) + описание (Body M), справа иллюстрация фиксированного размера 195×140, прижатая к правому краю плитки и центрированная по вертикали. Клик — переход в раздел. По умолчанию (вне сетки) 442×190px, минимальная ширина 400px; внутри `.ntile-grid` — `repeat(auto-fill, minmax(400px, 1fr))`, гэп 16px, перенос на следующий ряд автоматически (без контейнерных запросов), мин. высота 190 (полная, с паддингами — `box-sizing: border-box`; выше — только под контент, плитки в ряду не выравниваются по высоте), паддинг 32, справа фиксированные 160px под текст (чуть меньше ширины иллюстрации — текст ложится поверх, картинка не перекрывает текст), радиус `--radius-control` (8px). Состояния: hover (рамка --border-primary + elevation-2), focus (outline --primary), disabled (.is-disabled: текст --text-inactive, illu grayscale). Вариант --links: контейнер div (не <a> в <a>), название-ссылка .ntile__title-link + до 4 ссылок .link--m сразу за описанием (не внизу). НЕ дашборд — без данных и графиков.
**Каталог тайлов:** полный список тайлов главной страницы по группам — единый источник `scripts/ibp-home.js` (`window.IBPHome`), витрина на странице («Варианты → Каталог тайлов»); сборщик экрана берёт тайлы отсюда; пункт меню без тайла — `tile: null`.
```
<a class="ntile" href="/deals">
  <span class="illu ntile__illu" data-illu="deals" aria-hidden="true"></span>
  <h3 class="ntile__title">Сделки</h3>
  <p class="ntile__desc">Кредитные линии, договоры и график платежей</p>
</a>
<div class="ntile-grid"> …плитки… </div>
```

Полная анатомия: specs/NavTile.md.

## PageHeader
css: `styles/page-header.css` · js: `scripts/ds-menu.js` (MenuButton «Ещё действия»), `scripts/ds-actions-overflow.js` (переполнение `.phead__actions` в меню «Ещё», opt-in `data-actions-overflow`) · deps: [button, icon-button, chip, badge, context-menu, tooltip, breadcrumbs]
**Оси:** состав (title±icon±edit, chips, return, subtitle, actions±menu — 16 комбинаций) · dashboard-подложка (`--dashboard`).
**Инварианты:** IconLeft+Title+Edit — неразрывная группа; заголовок не усекается никогда.
**Классы:** `.phead` · `.phead__main` · `.phead__title-row` · `.phead__title-group` · `.phead__title-ico` · `.phead__title` · `.phead__edit` · `.phead__chips` · `.phead__return` · `.phead__subtitle` · `.phead__subtitle-ico` · `.phead__meta` / `.phead__meta-ico(--ok)` · `.phead__actions` · `.phead__extras` · `.phead--dashboard` · `.phead--stack`
**Диагностика:** «Заголовок обрезается многоточием» → по спеке не должен — убрать ellipsis, дать переноситься · «Return в мобильной раскладке остаётся в строке заголовка» → переместить в `.phead__extras`

Заголовок страницы рабочей области: наименование сущности (h1) + основные действия. Части независимы и опциональны: IconLeft, Edit, Chips, Return, Subtitle (стандартный/кастомный), Actions (max 3 кнопки) + MenuButton. Ставится под Breadcrumbs. Варианты: `--dashboard` (белая подложка `--bg-tile`), `--stack` (мобильная раскладка).

```html
<div class="phead">
  <div class="phead__main">
    <div class="phead__title-row">
      <div class="phead__title-group"><!-- неразрывная группа: IconLeft + Title + Edit -->
        <span class="phead__title-ico" aria-hidden="true"><i data-icon="drag-dots"></i></span><!-- опц. -->
        <h1 class="phead__title">D-007. ПАО «Газпром»</h1>
        <button class="ibtn ibtn--neutral ibtn--s phead__edit" aria-label="Переименовать"><i data-icon="edit"></i></button><!-- опц. -->
      </div>
      <div class="phead__chips"><span class="chip chip--rounded chip--s"><span class="chip__label">Черновик</span></span></div><!-- опц. -->
      <span class="phead__return"><button class="btn btn--outline btn--xs"><i data-icon="flip-backward"></i><span class="btn__label">В сделку</span></button></span><!-- опц. -->
    </div>
    <div class="phead__subtitle"><!-- опц.: стандартный (иконка+текст Body S) или кастомный (мета-элементы) -->
      <span class="phead__meta"><span class="phead__meta-ico"><i data-icon="copy"></i></span>7</span>
      <span class="phead__meta"><span class="phead__meta-ico phead__meta-ico--ok"><i data-icon="check-circle"></i></span>Версия 12 (07.02.2021)</span>
    </div>
  </div>
  <div class="phead__actions"><!-- опц.; max 3 кнопки M, MenuButton последняя -->
    <button class="btn btn--outline btn--m"><i data-icon="star"></i><span class="btn__label">В избранное</span></button>
    <button class="btn btn--accent btn--m"><i data-icon="download"></i><span class="btn__label">Выгрузить</span></button>
    <button class="btn btn--outline btn--m btn--icon-only" aria-label="Ещё действия" aria-haspopup="menu" aria-expanded="false"><i data-icon="more-dots"></i></button>
  </div>
</div>
```

Title `--type-h3-strong` (28/32), усечение + Tooltip; Subtitle Body S; мета Body XS `--text-inactive`. Адаптивность: <1024 второстепенные actions → MenuButton, чипы и Return — отдельной строкой под Subtitle (`.phead__extras`); <720 `.phead--stack`. Полная анатомия: specs/PageHeader.md.

## Pagination
css: `styles/pagination.css` · js: `scripts/ds-pagination.js` · deps: [dropdown-list, checkbox, label-helper, button, splitter]
**Оси:** уровень навигации (`data-tier` l/m/sm/c/xs) · раскладка (`data-layout` row/stack) · инфо-слот слева (opt).
**Инварианты:** инфо-сводка не обрезается никогда — сокращается сам пагинатор; bulk-панель и пагинатор не взаимоисключающие.
**Классы:** .pgn-row · .pgn-row__left / __right · .pgn · .pgn--compact · data-tier · data-layout · .pgn__pagesize · .pgn__pagesize-label · .pgn__pagesize-btn · .pgn__range · .pgn__nav · .pgn__arrow · .pgn__num · .pgn__ellipsis · .pgn-footer · .pgn-row--bulk · .pgn-bulk · .pgn-bulk__count / __actions · .pgn-info · .pgn-info__item / __warn
**Диагностика:** «Номера страниц то есть, то нет на одном экране» → тир считается по реальной ширине контейнера таблицы, не вьюпорта · «Инфо-сводка обрезана» → нарушение инварианта — сокращать пагинатор (tier), не сводку

Нижняя строка многостраничной таблицы: переключение страниц, выбор количества строк на странице и счётчик диапазона. Адаптив — измерением доступного места (не пороги ширины): `data-tier` на `.pgn` (l → m → sm «только текущая» → c compact → xs) и `data-layout` на `.pgn-row` (row / stack). Раскладка — по правилу «максимума номеров»: одна строка, пока в неё помещается не худший уровень, чем в вертикали. Инфо-сводка никогда не обрезается, пагинатор не выходит за правый край.

```html
<div class="pgn-row">
  <div class="pgn-row__left">
    <div class="pgn-info">…</div>
  </div>
  <div class="pgn-row__right">
    <div class="pgn">
      <span class="pgn__pagesize"><span class="pgn__pagesize-label">Показывать строк: <b>50</b></span><button class="pgn__pagesize-btn" aria-haspopup="listbox"><i data-icon="chevron-down"></i></button></span>
      <span class="pgn__range">3 из 16</span>
      <nav class="pgn__nav" aria-label="Страницы">
        <button class="pgn__arrow" aria-label="Предыдущая страница">‹</button>
        <button class="pgn__num">1</button>
        <button class="pgn__num" aria-current="page">3</button>
        <span class="pgn__ellipsis" aria-hidden="true">…</span>
        <button class="pgn__num">16</button>
        <button class="pgn__arrow" aria-label="Следующая страница">›</button>
      </nav>
<!-- … полная анатомия: specs/Pagination.md -->
```

**Из коробки:** подключить `scripts/ds-pagination.js`. Либо разметкой — `<div data-pagination data-total="800" data-page="3" data-page-size="50"></div>` (события `pagechange` / `pagesizechange`), либо из кода — `DSPagination.footer({total,page,pageSize,onChange,onPageSizeChange})` / `.row()` / `.pager()`. Внутри: окно номеров со свёрткой «…», дропдаун размера страницы, адаптивный уровень навигации измерением.

## Popover
css: `styles/popover.css` · deps: [button, icon-button, link, chip, label-helper]
**Оси:** ширина (5 шагов `--pop-w-s…max`, 240–560px) · состав (header/body/footer/arrow) · размещение (floating/pinned).
**Инварианты:** >560px — переход на Modal.
**Классы:** `.pop-anchor` · `.pop` · `.pop--w-s … --w-max` · `.pop--floating` / `.pop--pinned` · `.pop--top/-bottom/-left/-right` + `--start/-center/-end` · `.pop--arrow` · `.pop__head` / `.pop__foot` · `.pop__head-main` · `.pop__title` · `.pop__close` · `.pop__body` (+ `--flush`) · `.pop__foot-left` / `-right` · `.sk-line` / `.sk-group` · `role="dialog"` / `aria-modal="false"` · `aria-haspopup` / `aria-expanded` / `aria-controls`
**Диагностика:** «В поповере не хватает места, скроллит вся страница» → сигнал заменить на Modal, не увеличивать `--pop-w-max` · «Стрелка не совпадает цветом с зоной» → проверить, к какой зоне она примыкает по стороне размещения

Рантайм `scripts/ds-popover.js` (out-of-box): авто-инициализация любого триггера с `data-popover="<id поповера>"` (настройки — `data-popover-placement/-align/-gap/-flip/-boundary`), императивно `DSPopover.bind(trigger, opts)` · `place(pop, trigger, opts) → {placement, align}` · `bindAll(root)` · `watchScroll(pop)` · `closeAll()`. Из коробки: 12 позиций, авто-flip стороны и выравнивания, clamp 8px, стрелка по центру триггера, один открытый поповер, 5 способов закрытия (✕ / клик вне / Esc / Tab-out / `[data-pop-close]`), тени `.is-scrolled` шапки и подвала, репозиция по resize/scroll. Экрану нужны только этот скрипт и разметка ниже.

Нон-модальный всплывающий контейнер, привязанный к триггеру: расширенный контекстный контент — почти любой, без жёстких ограничений (текст, интерактив, формы, легенды), лишь бы умещался в шкалу ширины/высоты. В отличие от Tooltip — открывается по клику; в отличие от Modal — не блокирует страницу. Header — высота 48px, фон Pinned Default (--bgtable-pinned), заголовок Body S Strong 14px по центру вертикали + опц. чип/ссылка (gap 8px) + ✕ (без кнопок действий). Footer — тот же фон, foot-left и foot-right включаются независимо (инфо/ссылка/кнопка слева, Secondary+Primary справа). 5 ширин (240–560px), 12 позиций размещения, опциональная стрелка (по умолчанию выключена). Радиус 8px (--radius-m), тень --elevation-5, без внешнего бордера.

```html
<span class="pop-anchor">
  <button type="button" data-popover="pop-1">…</button>
  <div id="pop-1" class="pop pop--w-m pop--bottom pop--start pop--floating" role="dialog" aria-modal="false" aria-labelledby="pop-1-title">
    <div class="pop__head">
      <div class="pop__head-main">
        <h3 class="pop__title" id="pop-1-title">Изменить тег</h3>
        <!-- опц.: chip/link, gap 8px -->
      </div>
      <span class="pop__close"><button type="button" class="ibtn ibtn--neutral ibtn--s" aria-label="Закрыть">…</button></span>
    </div>
    <div class="pop__body">…почти любой контент…</div>
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
<!-- … полная анатомия: specs/Popover.md -->
```

## SnackBar
css: `styles/snackbar.css` · js: `scripts/ds-notify.js` · deps: [button, link]
**Оси:** тон (info/warning/error/success) · состав (иконка/заголовок/текст/кнопки/ссылка).
**Инварианты:** видимых ≤ 5, дальше — overflow-плашка «+N»; дубликаты (тон+заголовок+текст) схлопываются в один со счётчиком ×N.
**Классы:** .snackbar-layer · .snack · .snack--info/warning/error/success · .snack--leave · .snack__icon · .snack__body · .snack__title · .snack__dupe · .snack__text · .snack__buttons · .snack__close · .snack-more · role="alert" · role="status"
**Диагностика:** «Одинаковые уведомления копятся стеком» → должен расти счётчик `.snack__dupe` на существующей карточке, не плодиться новые · «Цвет кнопки внутри снека не совпадает с тоном» → проверить `.btn--<тон>`/`.link--<тон>`, совпадающий с `.snack--<тон>`
Стек уведомлений в правом верхнем углу (fixed, z-9900, 320px, top/right 24px). Поверх Modal/ToastBar, ниже ToastLoader.
Авто-скрытие: без кнопок — 5 с, с кнопками — persistent. Hover/focus — пауза. Esc — закрыть верхний. Лимит 5; overflow → `.snack-more` «+N». Дедупликация — счётчик ×N в `.snack__dupe`.

```html
<!-- слой-контейнер: 1 раз на уровне app -->
<div class="snackbar-layer" aria-label="Уведомления">

  <!-- тон: info | warning | error | success -->
  <!-- role=alert (error/warning) | role=status (info/success) -->
  <div class="snack snack--error" data-snack-tone="error" role="alert" aria-live="assertive">
    <span class="snack__icon" aria-hidden="true"><i data-icon="alert-circle-filled"></i></span>
    <div class="snack__body">
      <div class="snack__title">Ошибка <span class="snack__dupe">×2</span></div>
      <div class="snack__text">Плановая дата подписания просрочена.</div><!-- опционально -->
      <div class="snack__buttons"><!-- опционально; кнопки несут явный тон-класс Button (.btn--error/--warning/--success/--info) по тону снека -->
        <button type="button" class="btn btn--outline btn--xs btn--error"><span class="btn__label">Изменить</span></button>
        <button type="button" class="btn btn--transparent btn--xs btn--error"><span class="btn__label">Отмена</span></button>
      </div>
    </div>
    <button type="button" class="snack__close" aria-label="Закрыть"><i data-icon="close"></i></button>
  </div>

  <!-- overflow при > 5 снеков -->
  <div class="snack-more">
    Ещё <span class="snack-more__count">3</span> уведомл.
    <div class="snack-more__actions">
      <button class="snack-more__btn" aria-label="Развернуть"><i data-icon="chevron-down"></i></button>
      <button class="snack-more__btn" aria-label="Закрыть все"><i data-icon="close"></i></button>
    </div>
  </div>

</div>
```

Тона — фон/иконка/кнопки: `--info-bg/--info` · `--warning-bg/--warning` · `--error-bg-light/--error` · `--success-bg/--success`. Заголовок: Body S 400 `--text-primary`. Текст: Body XS `--text-secondary`. Кнопки несут явный тон-класс Button (`.btn--info/--warning/--error/--success`, совпадающий с тоном снека); переопределение `--primary` в `.snack__buttons` остаётся для ссылок.

**Из коробки:** подключить `scripts/ds-notify.js`. `DSSnack.show({tone,title,text,buttons,dedup})` → id; слой создаётся сам (или элемент с `data-ds-snackbar`). Внутри: стек новым сверху, видимых ≤5 и плашка «+N уведомл.», авто-скрытие 5с с паузой на hover/focus, дедупликация `×N`, Esc закрывает верхний. `DSSnack.dismiss(id)` / `dismissAll()` / `expand()`.

Полная анатомия: specs/SnackBar.md.

## Entity
css: `styles/entity.css` · deps: [avatar, chip, icon-button, button, badge]
**Оси:** размер (S 32/M 40/L 96) · ведущий элемент (иконка/аватар/чекбокс/грип) · состав (chips/actions ≤в кебаб/subheaders с клэмпом 2 строк).
**Инварианты:** Label — только одна строка; действия — максимум 2, больше → кебаб.
**Классы:** .entity · .entity--s/--m/--l · .entity--inline · .entity__lead · .entity__icon · .entity__main · .entity__titles · .entity__header · .entity__labelrow · .entity__label · .entity__label--truncate · .entity__prefix / __postfix · .entity__bookmark · .entity__subs · .entity__subs--single · .entity__subs-more · .entity__chips · .entity__icons · .entity__actions · .entity__drag · .entity--interactive · .entity--selected · .entity--skeleton · .entity--empty · .entity--error
**Диагностика:** «Заголовок вылезает/переносится на 3+ строки» → `.entity__label--truncate` · «Больше двух кнопок в блоке действий теснятся» → кебаб `[data-menu]` + `scripts/ds-menu.js`, не свой список · «Subheaders занимают лишние строки» → клэмп `.entity__subs` (2 строки) + счётчик `.entity__subs-more` · «Аватар/иконка пуста в скелетоне» → `.entity--skeleton` (`.sk-surface` на иконке, сохраняет размер/радиус) · «Клик по вложенной кнопке выбирает/открывает строку» → проверить stopPropagation — элемент должен быть настоящей кнопкой, не div

Отображение объектов (компании, люди, файлы, метрики) в тайлах, списках и формах. Ведущий элемент + Header · Label · Subheaders + Chips + IconButton-группа + действия. Собственного фона нет, тянется на ширину контейнера. Размеры: `--s` 32 · `--m` 40 · `--l` 96.

```html
<div class="entity">
  <div class="entity__lead"><span class="entity__icon" aria-hidden="true"><i data-icon="bank"></i></span></div>
  <div class="entity__main">
    <div class="entity__titles">
      <p class="entity__header">Контрагент</p>
      <div class="entity__labelrow">
        <span class="entity__label entity__label--truncate">ООО ЮгСтрой</span>
        <span class="entity__postfix">Postf</span>
        <button class="entity__bookmark" aria-label="В избранное"><i data-icon="bookmark-add"></i></button>
      </div>
    </div>
    <div class="entity__subs">
      <span class="entity__subs-icon"><i data-icon="check-circle"></i></span>
      <span class="entity__subs-list">Subheader, Subheader, Subheader</span>
      <span class="entity__subs-more">+99</span>
    </div>
    <div class="entity__chips"><span class="chip chip--s"><span class="chip__label">Text</span></span></div>
    <div class="entity__icons"><button class="ibtn ibtn--neutral ibtn--s" aria-label="Позвонить"><i data-icon="phone"></i></button></div>
  </div>
  <div class="entity__actions">
    <button class="btn btn--outline btn--xs" aria-haspopup="menu"><span class="btn__label">Button</span><i data-icon="chevron-down"></i></button>
    <button class="ibtn ibtn--neutral ibtn--s" aria-label="Убрать"><i data-icon="close"></i></button>
  </div>
</div>
```

Ведущий: `.entity__icon` (тон `--accent`/`--neutral`) или `.av` из ДС. Состояния: `--interactive` (hover-тайл) · `--selected` (--primary-bg) · `--skeleton` (иконка `.sk-surface` + строки `.sk-line`, компонент Skeleton) · `--empty` (Label «—») · `--error` (зачёркнут, иконка error).ка + шиммер, aria-busy) · `--empty` (Label «—») · `--error` (объект удалён, зачёркнут). Label усекается (`--truncate`) + Tooltip. Действий max 2 → иначе кебаб. Полная анатомия: specs/Entity.md.

Размер M — дефолт: `.entity` без модификатора, отдельных правил не требует.

**Из коробки:** своего рантайма нет — вёрстка статична. Усечение заголовка закрывает `ds-tooltip.js` (`data-tooltip` + `data-tooltip-truncated="only"`), кебаб при >2 действиях — `ds-menu.js` (`[data-menu]` + `.menu`).

## Table
css: `styles/table.css` · deps: [table-cell, pagination, table-filter, button, button-group, icon-button, chip, checkbox, illustration, modal, context-menu]
**Оси:** toolbar (вкл/выкл) · массовые действия (Footer) · настройка колонок (Modal --w4) · сохранённые фильтры (Split Button меню пресетов, см. TableFilter) · высота: по контенту / `--fill` (на всю свободную высоту) · положение тулбара: внутри таблицы / над таблицей (`.dtable-toolbar`).
**Инварианты:** Table добавляет только обёртку/тулбар/липкую шапку — строки и ячейки строит TableCell; Disabled у таблицы нет.
**Классы:** `.dtable` · `.dtable__toolbar` / `-left` / `-right` · `.dtable-toolbar` (зона над таблицей, без подложки) · `.dtable__title` / `__count` · `.dtable__body` · `.dtable--scrolled` · `.dtable--fill` · `.dtable__footer` · `.dtable__empty` / `-title` / `-text` · `aria-busy="true"` · `.tbl` / `.tbl__row` / `.th` / `.tc` · `.pgn-row` / `.pgn-bulk`
**Диагностика:** «Тень под шапкой видна без скролла» → нужен класс `.dtable--scrolled`, навешиваемый по факту scrollTop>0 · «Таблица выглядит disabled целиком» → у Table такого состояния нет, приглушать нужно точечно (тулбар/инструменты) · «`--fill` не растягивает таблицу / тело не скроллится» → у родителя нет фиксированной высоты: нужен `.screen--app` (Layout), иначе flex-цепочка не ограничена

Контейнер-организм: Toolbar (заголовок+счётчик слева, TableFilter+действия справа, опц.) → прокручиваемое тело (липкая шапка + строки TableCell) → Footer (Pagination, опц.). Своего оформления строк/ячеек не рисует. Массовые действия — существующий `.pgn-bulk` из `pagination.css` (ряд над `.pgn-row`, показывается при выборе строк).

```html
<div class="dtable">
  <div class="dtable__toolbar">
    <div class="dtable__toolbar-left"><h3 class="dtable__title">Заявки</h3><span class="dtable__count">128</span></div>
    <div class="dtable__toolbar-right"><div class="tfilter">…</div><button class="btn btn--accent btn--s">Добавить</button></div>
  </div>
  <div class="dtable__body">
    <div class="tbl"><!-- .tbl__row/.th/.tc — TableCell --></div>
  </div>
  <div class="dtable__footer">
    <div class="pgn-row pgn-row--bulk"><div class="pgn-bulk"><span class="pgn-bulk__count" aria-live="polite">Выбрано: <b>6</b></span><span class="pgn-bulk__actions">…</span></div></div>
    <div class="pgn-row"><!-- Pagination --></div>
  </div>
</div>
<!-- Empty: .dtable__body → только .dtable__empty (illu empty-folder + текст + действие) -->
<!-- Loading: .dtable__body → .tbl с N строками .tc--skeleton (плейсхолдер .sk-line--caption) -->
```

Липкая шапка не отключаема (пока есть вертикальный скролл тела). Теней-градиентов по левому/правому краю при горизонтальном скролле нет — скрытые колонки обозначает скроллбар (прежний `.dtable__edge` убран 27.08.2026: уезжал вместе с контентом). Toolbar/Footer не скрываются в Loading/Empty — подменяется только тело.

**Вариант «на всю высоту» (`.dtable--fill`)**: таблица — основной контент экрана, занимает всю свободную высоту (минус крошки/шапка/тулбар), тело скроллится внутри (тулбар/футер закреплены). Ставится вместе с `.screen--app` на рабочей области (Layout) — тот даёт фиксированную высоту вьюпорта; без него `flex:1; min-height:0` не ограничивает высоту. Использование: единственная таблица страницы/реестра; при тайлах над/под таблицей — индивидуальный кейс, по умолчанию таблица всё равно на оставшуюся высоту.

**Вариант «тулбар над таблицей» (`.dtable-toolbar`)**: зона фильтра и настроек вынесена из таблицы — контейнер `.dtable-toolbar` БЕЗ подложки стоит над `.dtable`: слева TableFilter, справа кнопка настройки колонок; таблица headless (без `.dtable__toolbar`: сразу шапка, ни заголовка, ни счётчика). Вертикальный ритм варианта — 12px (заголовок → зона → таблица), задаёт экран (`.screen__content { gap: var(--space-12) }`).

**Из коробки:** подключить `scripts/ds-table.js` — самоинициализация по `.dtable__body` (scroll + ResizeObserver), выставляет `.dtable--scrolled` (тень под липкой шапкой при вертикальном скролле). Императивно на динамически вставленный узел — `DSTable.bind(bodyEl)` или `DSTable.bindAll(root)`. **Изменение ширины колонки работает из коробки** — ручка `.th__resize` стоит в каждой `.th`, скрипт `scripts/tbl-resize.js` входит в `scripts/ds.js` (делегирование на document, инициализация не нужна). **Перетаскивание колонок — тоже из коробки** — перенос за подпись шапки `.th__label`, скрипт `scripts/tbl-reorder.js` входит в `scripts/ds.js` (исключаются только разделители; закреплённые переносятся — класс pin едет с колонкой, маркер не нужен). **Закрепление колонок — из коробки** — клик по `.th__pin`; удержание при скролле — нативный `position: sticky`, рантайм `scripts/tbl-pin.js` (входит в `scripts/ds.js`) считает только инсеты `left`/`right` и на скролл не подписан: left-pinned у левого края, right-pinned (хвостовой блок) у правого, примыкающий сепаратор прилипает. Сортировка — `data-sort`/`data-table` (ds-table.js). Выбор строк и bulk-режим — модель данных на стороне потребителя. Отдельная колонка «Действие» — кнопки видны всегда (не по hover, в отличие от `.tc__hidden`); действие массового удаления в `.pgn-bulk` обязательно дублируется на уровне строки в этой колонке.

Полная анатомия: specs/Table.md.

## TableCell
css: `styles/table-cell.css` · js: `scripts/ds-table.js`, `scripts/tbl-pin.js` · deps: [checkbox, chip, icon-button, button, input, dropdown-list, tooltip]
**Оси:** тип содержимого (текст/числа/дерево/чипы/контролы) · сортировка (none→asc→desc→none, активна максимум одна колонка) · закрепление (тогл `.th__pin` из коробки; удержание — нативный `position: sticky`, инсеты `left`/`right` пишет `tbl-pin.js` при изменении состава/ширин колонок, на скролл не подписан: left-pinned у левого края, right-pinned — хвостовой блок у правого; сепаратор прилипает с примыкающей закреплённой — заливка `--bgtable` в покое, `--bgtable-pinned` при прилипании; условие работы sticky — `min-width: max-content` у строки **прокручиваемой** таблицы (`.tbl--scroll .tbl__row`, `.dtable__body .tbl__row`), иначе grid ужмёт треки под контейнер и прокручивать будет нечего).
**Инварианты:** интерактивные состояния — на строке, служебные — на ячейке; Disabled у таблицы нет. Подпись колонки (`.th__label`) переносится до 2 строк, затем усечение ellipsis + тултип с полным текстом.
**Классы:** `.tc` · `.tc--right` / `--center` · `.tc--numbers` · `.tc--accent` / `--pinned` · `.tbl__row--hover` / `--focus` / `--selected` · `.tc--hover` / `--focus` / `--selected` · `.tc--error` / `--error-bg` / `--skeleton` · `.tc--edited` · `.tc__row` · `.tc__text` / `--truncate` · `.tc__prefix` / `__postfix` · `.tc__icon` / `--lead` · `.tc__empty` · `.tc--wrap` · `.tc__body` / `__subtext` · `.tc--tree` + `--tc-level` · `.tc__twisty` / `--leaf` · `.tc__controls` · `.tc__hidden` · `.tc--input` · `.tc--separator` / `.th--separator` (заливка `--bgtable`, при прилипании `--bgtable-pinned`) · `.tc__spark` · `.sk-line--caption` · `.th` · `.th__label` · `.th__tools` · `.th__sort` / `.th--sorted` · `.th__pin` / `.th--pinned` · `data-pin-side` (left/right) · `.th__resize` / `.th--resizing` · `.th--dragging` / `.tc--dragging` · `.tbl__guide` / `.tbl--resizing` / `.tbl--reordering` · `.th--select` / `.tc--select` · `.th__action` · `aria-sort` / `aria-pressed` / `aria-busy` / `aria-expanded` · `.tbl` / `.tbl--scroll` / `.tbl__row`
**Диагностика:** «Hover подсвечивает только одну ячейку, а не строку» → фон должен задаваться через `.tbl__row:hover > .tc`, не точечным классом на ячейке · «Ширина колонки выбора скачет между шапкой и строками» → класс `.th--select`/`.tc--select` должен стоять на всех ячейках колонки одинаково · «Закреплённые колонки дрожат при горизонтальном скролле — уезжают и возвращаются» → удержание считается на событии `scroll`, а не через `position: sticky`: компоновщик применяет скролл раньше JS-обработчика, коррекция всегда на кадр позади. На Windows дискретное колесо это скрывает, на трекпаде macOS видно на каждом кадре (инцидент 04.09.2026, TableCell 2.013) · «Закрепление не работает вовсе» → строка не шире скроллпорта: нет `min-width: max-content` у `.tbl--scroll .tbl__row` / `.dtable__body .tbl__row`

Ячейка таблицы (`.tc`) и ячейка шапки (`.th`, TableHeader). Универсальный контейнер контента строки: текст, дерево, чипы, контролы, редактируемые поля. Фона нет — наследует фон строки; скругления даёт контейнер таблицы. Нет плотностей — высота строки фикс. **48px**, растёт только у `.tc--wrap`. Каждая строка начинается/заканчивается структурной ячейкой-разделителем `.tc--separator`/`.th--separator` (8px, не выбирается как тип контента). Внутрь ставятся компоненты ДС (Checkbox, Chip, IconButton, Input S) — своих аналогов ячейка не рисует.

```html
<!-- в проде — нативные table/th/td; .tc/.th — оформление. Состояние — на СТРОКЕ -->
<div class="tbl">
  <div class="tbl__row" style="grid-template-columns:8px 2fr 1fr 96px minmax(8px,1fr);">
    <div class="th th--separator"></div>
    <div class="th" aria-sort="none"><span class="th__label">Контрагент</span><span class="th__tools"><button class="ibtn ibtn--neutral ibtn--s th__pin" aria-pressed="false" aria-label="Закрепить колонку"><i data-icon="pin"></i></button><button class="ibtn ibtn--neutral ibtn--s th__sort" aria-label="Сортировать"><i data-icon="arrow-up-down"></i></button></span><span class="th__resize" role="separator" aria-orientation="vertical" tabindex="0" aria-label="Изменить ширину колонки"></span></div>
    <div class="th th--right th--sorted" aria-sort="descending"><span class="th__label">Сумма, RUB</span><span class="th__tools"><button class="ibtn ibtn--neutral ibtn--s th__sort"><i data-icon="arrow-narrow-down"></i></button></span><span class="th__resize" role="separator" aria-orientation="vertical" tabindex="0" aria-label="Изменить ширину колонки"></span></div>
    <div class="th th--center"><span class="th__label">Действия</span><span class="th__resize" role="separator" aria-orientation="vertical" tabindex="0" aria-label="Изменить ширину колонки"></span></div>
    <div class="th th--separator"></div>
  </div>
  <div class="tbl__row tbl__row--selected" style="grid-template-columns:8px 2fr 1fr 96px minmax(8px,1fr);">
    <div class="tc tc--separator"></div>
    <div class="tc"><span class="tc__row"><span class="tc__text tc__text--truncate">ООО ЮгСтрой</span><span class="tc__icon tc__icon--warning"><i data-icon="alert-triangle"></i></span></span></div>
    <div class="tc tc--numbers"><span class="tc__row"><span class="tc__text">1 240 500,00</span></span></div>
    <div class="tc"><div class="tc__hidden"><button class="ibtn ibtn--neutral ibtn--s" aria-label="Изменить"><i data-icon="edit"></i></button></div></div>
    <div class="tc tc--separator"></div>
  </div>
</div>
```

Значение всегда в `.tc__row` (иконка слева · prefix · text · postfix · иконка справа — каждый независимая опция; иконки 16px стоят вплотную к тексту, не у границы). Выравнивание: слева / справа (по центру — только служебное для контролов). Числа: `.tc--numbers` — один класс даёт и правое выравнивание, и tabular-nums; разряды через Intl.NumberFormat('ru-RU'). Вторая строка — опция любого типа: `.tc__body` > `.tc__row` + `.tc__subtext`. Дерево: `--tree` (`.tc__twisty` + `--tc-level`, лист `.tc__twisty--leaf`), раскрывает дочерние строки. Чекбокс — компонент Checkbox `.cb--no-content` (галочка/минус — инлайн-глиф, не иконка 24px); в колонке выбора чекбокс шапки центрирован по колонке над чекбоксами строк, инструменты шапки прижаты к правому краю абсолютом, колонке ставится порог ширины классом `.th--select`/`.tc--select` (124px) на всех её ячейках. Чипы/кнопки в `.tc__controls`. Динамика показателя — слот `.tc__spark` (72×24px, `--tc-spark-w` меняет ширину), внутрь ставится Chart с `type: 'spark'`: без осей, легенды и тултипа, значение всегда рядом отдельной колонкой. Редактируемая ячейка: `.tc--input` + `.inp.inp--s` (Input «Table Edit»); в покое поле без рамки, иконки действий (очистка/календарь/шеврон, 16px, тон `--secondary`) видны только в фокусе строки. `.tc__hidden` — скрытые действия: настройка поверх ячейки, появляются по hover/focus строки. Усечение по умолчанию вкл. (`.tc__text--truncate` + floating Tooltip по scrollWidth>clientWidth); выкл. → `.tc--wrap`. Подпись шапки (`.th__label`) переносится до 2 строк (line-clamp), затем ellipsis + тултип с полным текстом. Контент не выходит за границу ячейки: любой элемент `.tc__row` сжимается (`min-width: 0`) и усекается внутри колонки — у Chip подпись уходит в многоточие в самой плашке, а не выезжает под соседнюю колонку (её непрозрачный фон обрезал бы текст без многоточия). Идентификатор (номер сделки, ИНН) выравнивается по ЛЕВОМУ краю как текст; `.tc--numbers` — только для величин, которые сравнивают по столбцу. Фон колонки: `--accent` / `--pinned` (закреплённая; удержание при скролле — нативный `position: sticky`, инсеты `left`/`right` пишет рантайм `tbl-pin.js`: left-pinned у левого края, right-pinned — хвостовой блок у правого). Сепаратор — структурная ячейка 8px с заливкой `--bgtable`; прилипая к закреплённой колонке, красится `--bgtable-pinned` (`data-pin-side` на сепараторе, по факту прилипания) и сливается с ней в сплошную полосу; несёт z-index закреплённой колонки (рисуется поверх проезжающих ячеек) и наследует её hover/focus/selected. Тень-разделитель блока — только на граничной колонке (`data-pin-side="left"`→справа, `"right"`→слева), внутренние колонки — без тени. `min-width: max-content` у строки **прокручиваемой** таблицы (`.tbl--scroll .tbl__row`, `.dtable__body .tbl__row`) — условие работы закрепления: строка обязана быть шире скроллпорта, иначе grid ужимает треки под контейнер и sticky ездить не от чего. Состояния Hover/Focus/Selected — на строке (`.tbl__row--hover/--focus/--selected`), красят ВСЕ ячейки строки включая разделители; служебные Error(+`--error-bg`)/Empty/Skeleton/EditMark(`--edited`, правый верхний угол) — на ячейке. **Disabled у таблицы нет.** Шапка — Body S: `.th__label` · `.th__tools` (`.th__pin` pin→pin-filled, `.th__sort` arrow-up-down→arrow-narrow-up/down; обе IconButton neutral S, активные `--secondary-dark`) · `.th__action` (кебаб по hover), `aria-sort`/`aria-pressed`. Настройка колонок: ширина — ручка `.th__resize` на правой границе шапки (9px, минимум 96px, клавиши ← → шагом 16px), не отключаемая опция — есть у каждой колонки шапки всегда и работает функционально из коробки (`scripts/tbl-resize.js`, делегирование на document, скрипт входит в `scripts/ds.js` — на экране подключать отдельно не нужно); свободное место справа забирает замыкающий разделитель (`grid: 8px … minmax(8px,1fr)`), строка всегда тянется до правой границы таблицы без пустого поля; порядок — ТОЛЬКО перетаскивание за `.th__label` (порог 4px, `.th--dragging`/`.tc--dragging` + линия `.tbl__guide`); переносятся все колонки, кроме разделителей и закреплённых, автоматически — маркер не нужен (`scripts/tbl-reorder.js` в `ds.js`); кнопок/меню, дублирующих перенос, у колонки нет. Полная анатомия: specs/TableCell.md.

**Из коробки:** подключить `scripts/ds-table.js` и поставить `data-table` на `.tbl`. Делегированием: сортировка по `[data-sort]` (none→asc→desc, `aria-sort`, событие `sort`), дерево по `.tc__twisty` (`[data-node]`/`[data-parent]`, прячет всё поддерево), выбор строк чекбоксами с промежуточным состоянием в шапке (событие `rowselect`), фокус строки, тултип на усечённом тексте — `.tc__text--truncate`, `.th__label` и `.chip__label` внутри ячейки — только при реальном усечении, с переносом полного значения (нужен `ds-tooltip.js`).

## RiskMetric
css: `styles/riskmetric.css` · deps: [chip, popover, icon-button, divider] · runtime: `scripts/ds-riskmetric.js` (+ `ds-popover.js`)
**Инварианты:** композиция, не самостоятельный компонент — Chip+`.chip__info`+Popover; цвет чипа — только Local-токены по зоне.
**Классы:** `.chip.chip--rounded.chip--s` · `.chip--success / --warning` · `.chip--error-solid / --dark-solid` · `.chip--outline` · `.chip__label` · `.chip__info` · `.pop-anchor` · `.pop.pop--w-m` · `.rm-blocks` · `.rm-block / .rm-block__row / .rm-block__label / .rm-block__value` · `.rm-field / .rm-field__label / .rm-field__value` · `aria-busy="true"` (на `.pop__body`) · `role="alert"` (на `.pop__body`)
**Диагностика:** «Клик по информеру не открывает Popover» → проверить, что `.chip__info` — настоящий `<button>`, привязанный к Popover через `ds-popover.js` · «Цвет чипа не совпадает с зоной риска» → сверить с таблицей алиасов Local-токенов, не задавать цвет напрямую
Из коробки: `<span data-riskmetric data-risk="26" data-zone="red" data-rating-date="…" data-zone-date="…" data-segment="…" data-profile="…">` — рантайм сам собирает Chip+Popover и навешивает `DSPopover.bind` на `.chip__info` (open/close/single-open/Esc/клик-вне/позиционирование). `data-loading` / `data-error="текст"` — состояния Body. Нет ни зоны, ни рейтинга, ни сегмента/профиля → без информера, поповер не собирается.
**Корнер-кейсы:** `.rm-block__value`/`.rm-field__value` overflow-wrap — свободный текст риск-сегмента без лимита.

Рейтинг + зона проблемности контрагента. Chip (ReadOnly, S, pill), тон — по зоне: зелёная=success, watchlist=warning (светлые); красная=error-solid, чёрная=dark-solid (белый текст); без зоны — outline. Клик по `.chip__info` открывает Popover_RiskMetric (w-m, без Footer) — неотъемлемая часть компонента. Body (`.rm-body`, gap 16): `.rm-blocks` (gap 8) с двумя блоками «Зона»/«Рейтинг» + дата расчёта, ниже Риск-сегмент/Риск-профиль. Отсутствующие значения — прочерк «—», поля не скрываются. Информер есть, если есть хоть что-то (зона, рейтинг, сегмент или профиль); нет вообще ничего → информера нет и поповер не открывается.

```html
<span class="pop-anchor">
  <span class="chip chip--rounded chip--s chip--error-solid" aria-label="Риск-метрика. Рейтинг 26, зона проблемности — красная.">
    <span class="chip__label">26</span>
    <button type="button" class="chip__info" aria-haspopup="dialog" aria-expanded="false" aria-controls="rm-pop-1" aria-label="Показать детали риск-метрики"><i data-icon="info-circle"></i></button>
  </span>
  <div id="rm-pop-1" class="pop pop--w-m pop--bottom pop--start pop--floating" role="dialog" aria-modal="false" aria-labelledby="rm-pop-1-title">
    <div class="pop__head">
      <h3 class="pop__title" id="rm-pop-1-title">Рейтинг и зона проблемности</h3>
      <button type="button" class="ibtn ibtn--neutral ibtn--s" aria-label="Закрыть">…</button>
    </div>
    <div class="pop__body rm-body">
      <div class="rm-blocks"><div class="rm-block"><div class="rm-block__row"><span class="rm-block__label">Зона проблемности</span><span class="rm-block__value rm-block__value--strong">Красная</span></div><div class="rm-block__row"><span class="rm-block__label">Дата расчета</span><span class="rm-block__value">24.10.2025</span></div></div>
      <div class="rm-block"><!-- Рейтинг контрагента + дата --></div></div>
      <div class="rm-field"><p class="rm-field__label">Риск-сегмент</p><p class="rm-field__value">…</p></div>
      <div class="rm-field"><p class="rm-field__label">Риск-профиль</p><p class="rm-field__value">Непроектный</p></div>
    </div>
  </div>
</span>
<!-- полная анатомия: specs/RiskMetric.md -->
```

## Skeleton
css: `styles/skeleton.css`
**Оси:** форма (Line/Block/Surface) · высота строки (title 20/body 16/caption 12) · форма блока (rect/rounded/circle) · состав (одиночная/`.sk-group`/`.sk-row`/`.sk-surface`).
**Инварианты:** повторяет геометрию будущего контента; не для короткой мгновенной паузы — там Spinner.
**Классы:** `.sk-line` · `.sk-line--title` / `--caption` · `.sk-block` · `.sk-block--rounded` / `--circle` · `.sk-group` · `.sk-row` · `.sk-surface` · `aria-hidden="true"` · `aria-busy="true"`
**Диагностика:** «Скелетон другого размера, чем реальный контент» → задать `--sk-h`/`--sk-w` под фактическую геометрию, не оставлять дефолт

Переиспользуемый плейсхолдер загрузки: строка текста (`.sk-line`, высоты Title/Body/Caption — 20/16/12px) и форма (`.sk-block`, Rect/Rounded/Circle), общий шиммер. `.sk-group` — стопка строк; `.sk-row` — ведущий блок + группа строк (аватар + текст). `.sk-surface` — тот же шиммер прямо на существующем элементе (сохраняет его размер/радиус, скрывает детей) — так задействуют Entity, Modal, Popover, ReadOnlyField, TableCell/Table.

```html
<div class="sk-row" aria-busy="true">
  <span class="sk-block sk-block--circle" style="--sk-w:40px;--sk-h:40px" aria-hidden="true"></span>
  <div class="sk-group">
    <span class="sk-line sk-line--title" style="--sk-w:48%" aria-hidden="true"></span>
    <span class="sk-line" style="--sk-w:72%" aria-hidden="true"></span>
  </div>
</div>
<!-- … полная анатомия: specs/Skeleton.md -->
```

## Spinner
css: `styles/spinner.css`
**Оси:** тон (accent/success/warning/error/info/system/inverse) · размер (XS/S/M/L) · состав (кольцо/кольцо+подпись row/stack/оверлей).
**Инварианты:** для неизвестной длительности; известное значение — ProgressBar.
**Корнер-кейсы:** `.spin-group__label`/`.spin-overlay__label` overflow-wrap.
**Классы:** `.spin` · `.spin--xs/s/m/l` · `.spin--accent/success/warning/error/info/system/inverse` · `.spin-group` / `.spin-group--stack` · `.spin-group__label` · `.spin-overlay` / `.spin-overlay__label`
**Диагностика:** «Оверлей спиннера растянулся на весь экран» → родитель должен быть `position:relative`, оверлей берёт `inset:0` именно от него · «Спиннер внутри кнопки не того цвета» → использовать `.spin--current` (currentColor), не тоновый `.spin--accent` и т.п.

Круговой индикатор загрузки неопределённой длительности — инлайн рядом с текстом, голое кольцо, или блокирующий оверлей поверх области. 7 тонов (accent/success/warning/error/info/system/inverse), 4 размера (XS 16 / S 20 / M 24 / L 32). Не несёт значения (для этого — ProgressBar).

```html
<span class="spin spin--m spin--accent" role="status" aria-label="Загрузка"></span>
<div class="spin-group" role="status">
  <span class="spin spin--m spin--accent" aria-hidden="true"></span>
  <span class="spin-group__label">Сохранение…</span>
</div>
<!-- оверлей: родитель обязан быть position:relative -->
<div class="spin-overlay" role="status" aria-live="polite">
  <span class="spin spin--l spin--accent" aria-hidden="true"></span>
  <span class="spin-overlay__label">Обновление…</span>
</div>
<!-- … полная анатомия: specs/Spinner.md -->
```

## ProgressBar
css: `styles/progress-bar.css` · deps: [label-helper]
**Оси:** размер (S 4/M 6/L 8px) · состав (bare/заголовок+значение/+хелпер/плавающее значение/компактный) · тон · состояние (default/empty/complete/indeterminate).
**Инварианты:** track всегда нейтрален, цвет несёт только Fill; sliver — только явно, не на 0% автоматически.
**Классы:** `.pbar` · `.pbar--s / --m / --l` · `.pbar--accent/--success/--warning/--error/--info/--system` · `.pbar--indeterminate` · `.pbar--floating` · `.pbar--compact` · `.pbar__head` · `.pbar__label` / `.pbar__value` · `.pbar__track` · `.pbar__fill` · `.pbar__fill--sliver` · `.pbar__marker` · `.pbar__helper` · `.pbar__track--stack` / `.pbar__seg-stack` · `role="progressbar"` / `aria-valuenow/min/max/text`
**Диагностика:** «Полоска не видна при очень маленьком значении» → добавить `.pbar__fill--sliver` явно, не рассчитывать на авто-минимум · «Маркер значения обрезается сверху» → трек должен быть `overflow:visible`, родитель не должен клипать

Линейный индикатор прогресса: заливка трека = доля значения от максимума. Определённый / неопределённый (Indeterminate) режимы, шесть тонов, три размера. Вариант Disabled убран (индикатор неинтерактивен). У плавающего значения хелпер опционален и по умолчанию выключен.

**Какой вариант брать (не на глаз):**

| Случай | Вариант | Почему |
|---|---|---|
| **Значение по умолчанию — любое именованное поле** (Прогресс, Вероятность сделки, Заполненность лимита), особенно когда значение качественное («Высокая») | **обычный** — `.pbar__head`: подпись слева, значение справа над треком | Читается как обычная пара «поле — значение», выравнивается с соседними полями и с соседними барами по правому краю |
| Только когда важна **позиция числа на шкале** и подписи-заголовка нет: одиночный бар-шкала, бар в плотной строке таблицы | `.pbar--floating` (метка едет за краем заливки) | Метка привязана к точке шкалы; заголовочной строки у такого бара нет по построению |

**Не ставить `--floating` только потому, что поле называется «Вероятность».** Ключ — есть ли у бара подпись: если подпись есть, она идёт в `.pbar__label` слева, значение — в `.pbar__value` справа. У `--floating` подпись уезжает в мелкий серый хелпер ПОД трек, а значение встаёт слева жирным — пара «поле → значение» читается наоборот и расходится с соседними полями блока.

Тон выбирается отдельно от варианта: `--accent` — выполнение, `--system` — нейтральная шкала оценки.

Обе ошибки реальны (DealPipelineCard, 26.08.2026): сначала `--floating` стоял на «Прогрессе», а «Вероятность» была голым текстом; после починки `--floating` переехал на «Вероятность» — и подпись ушла под трек, что тоже неверно. Правило переписано по результату, а не по примеру из доки.

```html
<div class="pbar pbar--accent" role="progressbar" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100" aria-label="Label">
  <div class="pbar__head">
    <span class="pbar__label">Label</span>
    <span class="pbar__value">50/100</span>
  </div>
  <div class="pbar__track"><div class="pbar__fill" style="width:50%"></div></div>
  <span class="ds-helper ds-helper--left pbar__helper">Helper</span>
</div>
<!-- плавающее значение: метка следует за краем заливки -->
<div class="pbar pbar--system pbar--floating" role="progressbar" aria-valuenow="85" aria-valuemin="0" aria-valuemax="100" aria-label="Вероятность сделки">
  <div class="pbar__track"><div class="pbar__fill" style="width:85%"><span class="pbar__marker">85%</span></div></div>
  <span class="ds-helper ds-helper--left pbar__helper">Вероятность сделки</span>
</div>
<!-- неопределённый: aria-valuenow не указывается -->
<div class="pbar pbar--accent pbar--indeterminate" role="progressbar" aria-valuetext="Загрузка">
  <div class="pbar__track"><div class="pbar__fill"></div></div>
</div>
<!-- … полная анатомия: specs/ProgressBar.md -->
```

Размер M — дефолт: `.pbar` без модификатора, отдельных правил не требует.

## Radiobutton
css: `styles/radio.css` · deps: [label-helper]
**Оси:** состояние выбора (unselected/selected) · интерактивное состояние (default/hover/focus/pressed/disabled/error) · состав (label/helper/icon-only).
**Инварианты:** только в составе группы, не как единственная опция.
**Классы:** .rb · .rb--unselected / --selected · .rb--hover / --focus / --pressed · .rb--error · .rb--disabled · .rb--no-content · .rb__input · .rb__box · .rb__mark · .rb__content · .rb__label · .rb__req · .ds-helper.ds-helper--left · .rb-group · .rb-group--horizontal · .rb-group__title · .rb-group__items · .rb-group--indent · .rb-group__error · role="radiogroup" / aria-labelledby / aria-describedby
**Диагностика:** «Радиокнопка используется одна, без группы» → нарушение инварианта — добавить группу или заменить на Checkbox/Switch · «Клик рядом с текстом не выбирает радиокнопку» → активная область должна быть весь `.rb`, не только `.rb__box`

Радиокнопка позволяет выбрать всего один пункт из списка взаимоисключающих вариантов. CSS красит `.rb__mark` по нативным `:checked`/`:disabled` на `.rb__input` — классы `.rb--selected`/`--disabled` нужны только для форс-состояний.

```html
<div class="rb-group" role="radiogroup" aria-labelledby="grp-t">
  <p class="rb-group__title" id="grp-t">Обновлять список</p>
  <div class="rb-group__items">
    <label class="rb rb--selected">
      <input type="radio" class="rb__input" name="refresh" checked>
      <span class="rb__box"><i class="rb__mark" data-icon="radio-button-checked"></i></span>
      <span class="rb__content"><span class="rb__label">Ежеминутно</span></span>
    </label>
    <label class="rb">
      <input type="radio" class="rb__input" name="refresh">
      <span class="rb__box"><i class="rb__mark" data-icon="radio-button-unchecked"></i></span>
      <span class="rb__content"><span class="rb__label">Ежечасно</span></span>
    </label>
  </div>
</div>
<div class="rb-group" role="radiogroup" aria-labelledby="grp-t2" aria-describedby="grp-e2">
<!-- … полная анатомия: specs/Radiobutton.md -->
```

Классы состояния (`rb--unselected` / `--selected`) собственных правил в CSS не имеют — их вешает рантайм; в стартовом сниппете не нужны.

## ReadOnlyField
css: `styles/read-only-field.css` · js: `scripts/ds-copy.js` (`DSCopy.write`/`.flash` — копирование значения по иконке-действию `copy`) · deps: [label-helper, chip, link, tooltip, segment-control, splitter]
**Оси:** тип значения (текст/чипы/ссылка) · доп. слоты (иконка слева/справа, префикс/постфикс, скрытие лейбла, выравнивание — независимы, любая комбинация).
**Инварианты:** аффиксы — только у типа «текст».
**Диагностика:** «Ссылка-значение окрашена в error/success» → семантический цвет применяется только к text/chips, ссылка держит свой цвет Link · «Префикс распирает строку» → должен обрезаться эллипсисом при `max-width:12ch`, не расти

Поле для отображения данных без возможности редактирования. Аффиксы (prefix/postfix) и цвет значения — только у типа «Текст»; чипам доступны иконки слева/справа, лейбл и хэлпер. Чип-счётчик «+N» обязан иметь тултип со списком скрытых чипов.

```html
<div class="rof">
  <span class="ds-label"><span class="ds-label__text">ID во внешней АС</span></span>
  <div class="rof__row">
    <span class="rof__icon"><i data-icon="info-circle"></i></span>
    <span class="rof__value">123456789012</span>
    <span class="rof__icon rof__icon--interactive" role="button" tabindex="0" aria-label="Скопировать значение"><i data-icon="copy"></i></span>
  </div>
</div>
<div class="rof">
  <span class="ds-label"><span class="ds-label__text">Регионы присутствия</span></span>
  <div class="rof__row"><div class="rof__value rof__value--chips"><div class="chiplist chiplist--s">…</div></div></div>
</div>
```

Полная анатомия: specs/ReadOnlyField.md.

## SegmentControl
css: `styles/segment-control.css` · js: `scripts/ds-tabs.js` · deps: [tab, button, button-group, badge]
**Оси:** размер (M/S/XS) · состав сегмента (текст/иконка+текст/иконка/+счётчик) · fullwidth.
**Инварианты:** 2–6 сегментов — больше замена на Select. · Полная высота контрола = высота сегмента + обводка трека (padding) сверху и снизу, совпадает с Button того же размера. M: 34+2×3=40 · S: 28+2×2=32 · XS: 20+2×2=24. `--seg-h` — высота внутреннего сегмента, не контрола.
**Классы:** .segctrl · .segctrl--s / --xs · .segctrl--fullwidth · .segctrl--disabled / [aria-disabled="true"] · .segctrl__thumb · .segctrl__item · .segctrl__item--icon-only · .segctrl__label · [aria-checked="true"] · [aria-disabled="true"] · .badge.badge--text.badge--{s\
**Диагностика:** «Разделитель между сегментами виден рядом с выбранным» → должен гаснуть у выбранного сегмента и его соседей (правило `::before`) · «CSS для первого сегмента не применяется» → искать через `:first-of-type`, не `:first-child` (thumb — реальный первый child)

Компактный контрол для переключения одного значения параметра — периода, единиц, режима отображения — из 2–6 взаимоисключающих опций.

```html
<div class="segctrl" role="radiogroup" aria-label="Период">
  <div class="segctrl__thumb"></div>
  <button type="button" class="segctrl__item" role="radio" aria-checked="false" tabindex="-1">
    <span class="segctrl__label">Неделя</span>
  </button>
  <button type="button" class="segctrl__item" role="radio" aria-checked="true" tabindex="0">
    <span class="segctrl__label">Месяц</span>
    <span class="badge badge--text badge--s">12</span>
  </button>
  <button type="button" class="segctrl__item" role="radio" aria-checked="false" tabindex="-1">
    <span class="segctrl__label">Год</span>
  </button>
</div>
```

Размер M — дефолт: `.segctrl` без модификатора, отдельных правил не требует; компактные — `.segctrl--s` / `--xs`.

**Из коробки:** подключить `scripts/ds-tabs.js` и поставить `data-tabs` / `data-segctrl` на контейнер — рантайм даёт roving tabindex, стрелки, Home/End, пропуск отключённых; у сегмент-контрола сам измеряет и двигает индикатор, у табов подскролливает выбранный. API: `DSTabs.tabs(el,{onChange})`, `DSTabs.segment(el,{onChange})`, `DSTabs.positionThumb(el)`.

Полная анатомия: specs/SegmentControl.md.

## DropdownList
css: `styles/dropdown-list.css` · deps: [checkbox, label-helper, spinner] · runtime: `scripts/ds-dropdownlist.js`
**Инварианты:** одиночный выбор — заливка строки; множественный — только чекбокс, без заливки; «Выбрать всё» всегда первая строка.
**Классы:** .ddl · .ddl--scroll · .ddl--floating · .ddl__item · .ddl__item--checkbox · .ddl__item--wrap · .ddl__item--action · .ddl__item-check / -icon / -body / -label / -trail · .ds-helper · .ddl__match · .ddl__group · .ddl__divider · .ddl__state (--loading / --empty / --error) · .is-hover / .is-focus / .is-active · role=listbox / option · aria-selected / -checked / -disabled / -activedescendant
**Диагностика:** «В множественном выборе строка красится целиком» → снять фон, состояние должен нести только чекбокс (`.ddl__item--checkbox`) · «Список у́же текста своих опций» → длинная подпись должна обрезаться эллипсисом, список не растягивается сверх `--ddl-max`
Из коробки: `DSDropdownList.bind(field, { list, multiple, onSelect, onToggle, onAction, boundary })` — открытие/закрытие/позиционирование (ширина=полю, авто-flip вверх)/клавиатура (↑↓ Home End Enter Space typeahead Esc, aria-activedescendant + `.is-focus`, фокус остаётся в поле)/single-open/клик-вне. `multiple:true` включает три-стейт «Выбрать всё» (`DSDropdownList.wireMulti` — доступна и отдельно для статичных/pinned списков). Клик по `.ddl__item` — выбор и закрытие (кроме multiple); `.ddl__item--checkbox` — тоггл, список остаётся открытым; `.ddl__item--action` — свой callback `onAction`.

Выпадающий список — всплывающая поверхность со списком опций, которая раскрывается под полем Select или InputAutocomplete. Мультивыбор — ведущие чекбоксы + опциональная первая строка «Выбрать всё» (`.ddl__item--all`, три-стейт `aria-checked="mixed"`).

```html
<div role="combobox" aria-expanded="true" aria-controls="ccy">…</div>
<div id="ccy" class="ddl ddl--floating ddl--scroll" role="listbox">
  <div class="ddl__group">Популярные</div>
  <button class="ddl__item" role="option" aria-selected="true">
    <span class="ddl__item-body">
      <span class="ddl__item-label">Доллар <span class="ddl__match">США</span></span>
      <span class="ds-helper">USD · 840</span>
    </span>
  </button>
  <button class="ddl__item ddl__item--checkbox ddl__item--all" role="option" aria-checked="mixed">
    <span class="ddl__item-check"><span class="cb__box"><span class="cb__mark">…</span></span></span>
    <span class="ddl__item-body"><span class="ddl__item-label">Выбрать всё</span></span>
  </button>
  <hr class="ddl__divider">
  <button class="ddl__item ddl__item--checkbox" role="option" aria-checked="true">
    <span class="ddl__item-check"><span class="cb__box"><span class="cb__mark">…</span></span></span>
    <span class="ddl__item-body">…</span>
  </button>
  <button class="ddl__item" role="option" aria-disabled="true">Евро</button>
  <div class="ddl__state ddl__state--empty">…Ничего не найдено</div>
</div>
```

Полная анатомия: specs/DropdownList.md.

## Splitter
css: `styles/splitter.css` · js: `scripts/ds-splitter.js` · deps: [button]
**Оси:** ориентация (vertical col-resize / horizontal row-resize) · состояния (default/hover/move/focus/disabled).
**Инварианты:** мин/макс панелей (25%/75%) — ни одна не схлопывается.
**Диагностика:** «Курсор resize пропадает при быстром драге» → должен держаться класс `body.spl-dragging`/`spl-dragging-h` на всё время перетаскивания · «Сплиттер не реагирует на клик рядом с линией» → зона захвата 11px, а не 1px видимой линии

Функциональный разделитель контейнера: пользователь тащит сплиттер и регулирует размеры соседних панелей.

```html
<div class="splitpane">
  <div class="splitpane__panel splitpane__a">…</div>
  <div class="spl" role="separator" aria-orientation="vertical"
       aria-valuemin="20" aria-valuemax="80" aria-valuenow="50"
       aria-label="Изменить ширину панелей" tabindex="0">
    <span class="spl__grip"><i></i><i></i><i></i><i></i><i></i><i></i></span>
  </div>
  <div class="splitpane__panel splitpane__b">…</div>
</div>
```

**Из коробки:** подключить `scripts/ds-splitter.js` и поставить `data-splitter` на `.splitpane` (`data-min` / `data-max` / `data-initial`) — рантайм даёт перетаскивание, min/max, стрелки, Home/End, `aria-value*`, сброс двойным кликом. Из кода: `DSSplitter.pane({orientation,min,max,initial,onChange})` или `DSSplitter.wire(splEl)` для готовой разметки. Композиция `.splitpane*` — в `styles/splitter.css`.

Полная анатомия: specs/Splitter.md.

## Switch
css: `styles/switch.css` · deps: [label-helper, spinner]
**Оси:** состояние (off/on) · интерактивное состояние (default/hover/focus/pressed/disabled/loading) · состав (label/helper) · группа+обязательность (независимы).
**Инварианты:** мгновенное действие без подтверждения; Loading сохраняет текущий цвет on/off.
**Классы:** .sw · .sw--off / --on · .sw--hover / --focus / --pressed · .sw--loading · .sw--disabled · .sw--no-content · .sw__input · .sw__control · .sw__thumb · .spin · .sw__content · .sw__label · .sw__req · .ds-helper.ds-helper--left · .sw-row · .sw-group · .sw-group__title · role="switch" / aria-checked
**Диагностика:** «Свитч на секунду меняет цвет во время загрузки» → должен держать текущее on/off состояние, спиннер накладывается поверх, не заменяет цвет · «Клик по названию не переключает свитч» → активная область — весь `.sw`, не только `.sw__control`

Свитч мгновенно переключает состояние — например, включает или отключает определённую опцию. CSS красит трек/ползунок по нативным `:checked`/`:disabled` на `.sw__input` — классы `.sw--on`/`--disabled` нужны только для форс-состояний.

```html
<label class="sw sw--on">
  <input type="checkbox" class="sw__input" role="switch" aria-checked="true" checked>
  <span class="sw__control"><span class="sw__thumb"></span></span>
  <span class="sw__content">
    <span class="sw__label">Тёмная тема</span>
    <span class="ds-helper ds-helper--left">Применяется ко всему интерфейсу</span>
  </span>
</label>
<label class="sw sw--loading">
  <input type="checkbox" class="sw__input" role="switch" disabled>
  <span class="sw__control"><span class="sw__thumb"><span class="spin"></span></span></span>
</label>
<div class="sw-row">
  <label class="sw sw--on">…</label> <!-- .sw-row разворачивает .sw в row-reverse -->
</div>
<!-- группа + обязательный выбор (независимы): звёздочка .sw__req -->
<div class="sw-group">
  <p class="sw-group__title">Уведомления<span class="sw__req">*</span></p>
  <div class="sw-group__items">…</div>
</div>
```

Классы состояния (`sw--off` / `--on`) собственных правил в CSS не имеют — их вешает рантайм; в стартовом сниппете не нужны.

Полная анатомия: specs/Switch.md.

## Tab
css: `styles/tab.css`
**Оси:** ориентация (horizontal/vertical) · размер (M/S) · бейдж-счётчик · переполнение (`ds-tabs.js`: скролл со стрелками / fit+меню «Ещё» через `data-tabs-overflow`).
**Инварианты:** hover=focus держится после клика до `mouseleave`; роль — переключение вьюх страницы, не значения параметра (это SegmentControl).
**Диагностика:** «После клика подсветка не гаснет при уходе курсора» → ожидаемо: hover держится до `mouseleave`, не сбрасывается кликом · «Disabled-таб выпадает из клавиатурной навигации» → должен быть `aria-disabled`, не атрибут `disabled`

Таб — инструмент переключения между разными вьюхами одного экрана.

```html
<div class="tabs tabs--horiz" role="tablist">
  <button type="button" class="tab tab--m" role="tab" aria-selected="false" tabindex="-1">
    <span class="tab__label">Обзор</span>
  </button>
  <button type="button" class="tab tab--m tab--selected" role="tab" aria-selected="true" tabindex="0">
    <span class="tab__icon"><i data-icon="layout-grid-01"></i></span>
    <span class="tab__label">Сделки</span>
    <span class="tab__badge">12</span>
  </button>
</div>
```

Ориентацию задаёт контейнер `.tabs--horiz`; на кнопке `.tab` модификатора ориентации нет.

**Из коробки:** подключить `scripts/ds-tabs.js` и поставить `data-tabs` / `data-segctrl` на контейнер — рантайм даёт roving tabindex, стрелки, Home/End, пропуск отключённых; у сегмент-контрола сам измеряет и двигает индикатор, у табов подскролливает выбранный. У горизонтальной группы (`.tabs--horiz`) рантайм сам оборачивает переполнение — скролл со стрелками по умолчанию, `data-tabs-overflow="menu"` — fit + меню «Ещё» (`"none"` выключает). API: `DSTabs.tabs(el,{onChange})`, `DSTabs.segment(el,{onChange})`, `DSTabs.positionThumb(el)`.

Полная анатомия: specs/Tab.md.

## Toast
css: `styles/toast.css` · js: `scripts/ds-notify.js` · deps: [button, spinner]
**Оси:** режим (ToastBar фоновый / ToastLoader блокирующий) · тон (neutral/success/error/info) · ведущий слот (спиннер/иконка, взаимоисключающе).
**Инварианты:** ведущий слот — спиннер ИЛИ иконка, не оба; ширина ≤60% рабочей области.
**Классы:** .toast-layer · .toast-layer--bar / --loader · .toast-scrim · .toast-stack · .toast · .toast--success / --error / --info · .toast--enter / --leave · .toast__lead · .spin.spin--current · .toast__icon · .toast__msg · [role="status"] / [role="alert"]
**Диагностика:** «Тост слишком широкий, текст не помещается по высоте» → ширина ограничена 60% рабочей области — переносить текст, не увеличивать `--toast-maxw` · «Не понятно, блокирует ли тост страницу» → проверить слой: `.toast-layer--loader` (с `.toast-scrim`) блокирует, `--bar` — нет

Тёмная пилюля-уведомление, всплывающая у верхней границы рабочей области по центру, — индикатор запуска фонового или блокирующего процесса.

```html
<div class="toast-layer toast-layer--bar">
  <div class="toast-stack">
    <div class="toast toast--enter" role="status" aria-live="polite">
      <span class="toast__lead">
        <span class="spin spin--current" aria-hidden="true"></span>
      </span>
      <span class="toast__msg">Выполняется маршрутизация</span>
    </div>
    <div class="toast toast--success" role="status" aria-live="polite">
      <span class="toast__lead">
        <span class="toast__icon" aria-hidden="true"><i data-icon="check-circle"></i></span>
      </span>
      <span class="toast__msg">Маршрутизация завершена</span>
    </div>
  </div>
</div>
<!-- … полная анатомия: specs/Toast.md -->
```

**Из коробки:** подключить `scripts/ds-notify.js`. `DSToast.show({message, kind:"bar"|"loader", tone, duration})` → `handle`; стек ≤3 с вытеснением нижнего, авто-скрытие 3с у bar без спиннера, loader единичен и добавляет затемнение, `handle.update({tone:"success"})` меняет спиннер на иконку и уводит через 1с. `DSToast.make(opts)` — только узел для статичных примеров.

## Tooltip
css: `styles/tooltip.css` · deps: [button]
**Оси:** позиция (12) · тип (main/error) · триггер (hover 400мс/focus мгновенно) · усечение (`data-tooltip-truncated="only"`) · перенос (`data-tooltip-multiline="yes"` / `.tip--multiline`).
**Инварианты:** по умолчанию одна строка с эллипсисом, перенос — только `.tip--multiline`; `.tip--rich` — единственный интерактивный вариант.
**Корнер-кейсы:** `.tip` ellipsis-фолбэк, если контент длиннее `--tip-max` и JS не включил `--multiline`.
**Классы:** .tip · .tip--main / --error · .tip--top / --bottom / --left / --right · .tip--start / --center / --end · .tip--no-arrow · .tip--multiline · .tip--rich · .tip__title / .tip__text · .tip__actions / .tip__action · .tip--floating · .tip__arrow · .tip-anchor · role="tooltip" / aria-describedby
**Диагностика:** «Длинный текст в тултипе обрезается многоточием» → добавить `.tip--multiline`, иначе текст ограничен одной строкой по спеке · «Тултип закрывается при наведении на его содержимое» → ожидаемо для обычного тултипа; для интерактивного контента использовать `.tip--rich`

Всплывающая подсказка при наведении или фокусе на объект — иконку, IconButton, обрезанный текст или поле с ошибкой.

```html
<button type="button" class="ibtn ibtn--neutral ibtn--m" aria-label="Удалить" aria-describedby="tip-1">…</button>
<span class="tip tip--main tip--top tip--center tip--floating" role="tooltip" id="tip-1">
  Удалить
  <span class="tip__arrow"></span>
</span>
<span class="tip tip--error tip--bottom tip--start tip--no-arrow tip--multiline" role="tooltip">…</span>

<!-- rich: заголовок + описание + одно действие; интерактивен (курсор может зайти внутрь) -->
<span class="tip tip--main tip--rich tip--bottom tip--center tip--floating" role="tooltip">
  <span class="tip__title">Лимит риска</span>
  <span class="tip__text">Максимальная сумма на одном контрагенте.</span>
  <span class="tip__actions"><button type="button" class="tip__action">Открыть методику</button></span>
  <span class="tip__arrow"></span>
</span>
```

**Из коробки:** подключить `scripts/ds-tooltip.js`. Автоподключение: `<button data-tooltip="Удалить">` (рантайм сам оборачивает цель в `.tip-anchor` и строит тултип) либо своя разметка — цель с `aria-describedby` на `.tip` внутри `.tip-anchor`. Настройки на цели: `data-tooltip-placement` (top|bottom|left|right, деф. top), `data-tooltip-align` (start|center|end, center), `data-tooltip-type` (main|error), `data-tooltip-gap` (8), `data-tooltip-delay` (400), `data-tooltip-flip="no"`, `data-tooltip-boundary="<селектор>"`, `data-tooltip-truncated="only"` — показывать только при усечении текста цели, `data-tooltip-multiline="yes"` — переносить длинный текст по `--tip-max` вместо усечения самого тултипа. Якорь `.tip-anchor` раскладочно прозрачен (`min-width:0; max-width:100%`) — он не мешает цели сжиматься и усекаться. Императивно: `DSTooltip.bind(target, {tip, placement, align, offsetParent})`, `DSTooltip.make(text, opts)`, `DSTooltip.place(tip, target, opts)`, `DSTooltip.hideAll()`. Из коробки: 12 позиций, авто-flip стороны и выравнивания, стрелка доводится до центра цели, 400 мс по hover / мгновенно по focus, мгновенное скрытие, Esc, один показанный тултип одновременно, rich остаётся открытым под курсором (300 мс).

Полная анатомия: specs/Tooltip.md.

## TableFilter
css: `styles/table-filter.css` · js: `scripts/ds-menu.js` (меню пресетов), `scripts/ds-table-filter.js` (сброс чипа «Применено: N» — клик/Backspace-Delete, всплывает `tfilter:reset`) · deps: [button, button-group, context-menu, chip, modal, tab, input, input-date-range, checkbox, icon-button]
**Оси:** состояние бара (Filtered No/Yes) · с пресетами (ButtonGroup Split + ContextMenu) · чип «Применено: N».
**Инварианты:** крестик чипа-счётчика сбрасывает ВСЕ параметры фильтра, не один.
**Классы:** `.tfilter` · `.tfilter--disabled` · `.tfilter__open` · `.tfilter__applied` · `.tfilter__split` / `.tfilter__presets` / `.tfilter__menu` · `.tfm__grid` / `.tfm__span-2` · `.tfm__panel` · `.tfm` · `.tfm__body` / `.tfm__nav` / `.tfm__panel` / `.tfm__sec` · `.preset-item` / `.preset-row` / `.preset-item__body` / `.preset-params` · LEGACY: `.tfilter__trigger`, `.tfilter__chips`, `.tfilter__tail`, `.tfilter__more`, `.tfilter__toggle`, `.tfilter--collapsed`
**Диагностика:** «Крестик на чипе снимает только один параметр» → по спеке сбрасывает все параметры сразу · «Новый экран использует legacy-чиплист» → перейти на актуальную разметку: кнопка + один чип «Применено: N»

Панель фильтра над таблицей. Кнопка «Фильтр» (Button Outline S, ведущая воронка тонирована в `--primary`) открывает модалку; применённый фильтр возвращается в бар ОДНИМ чипом-счётчиком «Применено: N» (Chip Edit M) — крестик чипа сбрасывает фильтр целиком. Отдельной кнопки сброса нет, чиплиста отдельных параметров и «+N» с аккордеоном больше нет (legacy-правила в CSS оставлены только для старых экранов-мокапов). Зазор в баре — 4px.

```html
<!-- применён: кнопка + один чип-счётчик -->
<div class="tfilter" role="group" aria-label="Фильтр таблицы">
  <button class="btn btn--outline btn--s tfilter__open" aria-haspopup="dialog" aria-expanded="false"><i data-icon="filter"></i><span class="btn__label">Фильтр</span></button>
  <span class="chip chip--edit chip--m tfilter__applied" tabindex="0"><span class="chip__label">Применено: 3</span><span class="chip__remove" role="button" aria-label="Сбросить все фильтры"><i data-icon="close"></i></span></span>
</div>
<!-- не применён: только кнопка .tfilter__open внутри .tfilter -->

<!-- есть сохранённые пресеты → ButtonGroup Split вместо одиночной кнопки -->
<div class="tfilter" role="group" aria-label="Фильтр таблицы">
  <span class="menu-anchor tfilter__split">
    <span class="btn-group btn-group--outline btn-group--split" role="group" aria-label="Фильтр">
      <button class="btn btn--outline btn--s tfilter__open" aria-haspopup="dialog" aria-expanded="false"><i data-icon="filter"></i><span class="btn__label">Фильтр</span></button>
      <button class="btn btn--outline btn--s btn--icon-only tfilter__presets" aria-haspopup="menu" aria-expanded="false" aria-label="Сохранённые пресеты"><i class="btn__chevron" data-icon="chevron-down"></i></button>
    </span>
    <div class="menu menu--floating tfilter__menu" role="menu" hidden>
      <div class="menu__label">Сохранённые пресеты</div>
      <button class="menu__item" role="menuitem"><span class="menu__item-label">Мои сделки ЦА</span><span class="menu__item-hint">3</span></button>
    </div>
  </span>
</div>
```

Модалка фильтра (Modal w6): Modal_Top «Фильтр» + крестик; Modal_Body `--flush` = сетка [nav 232px | контентная область]; Modal_Bottom — слева «Сохранить пресет», справа «Очистить» + «Применить». Высота модалки не задаётся: контент до 80vh, прокручивается сам `.modal__body`, `.tfm__nav` — sticky, head/foot получают `.is-scrolled`. Вертикальные табы (`.tabs--vert`, Tab M vertical) прижаты вплотную к левой границе модалки (padding: 16px 0) и работают как ЯКОРНЫЕ ССЫЛКИ: контентная область содержит все разделы подряд и прокручивается, клик доводит до раздела, scroll spy ставит `aria-current="true"`; бейдж таба = число заполненных параметров раздела. Форма внутри разделов — двухколоночная сетка `.tfm__grid` (grid 2×minmax(0,1fr), gap 16px), широкое поле — `.tfm__span-2`. Раздел «Даты» — два InputDateRange («Дата сделки», «Дата изменения») на всю ширину. Разделы: «Общая информация», «Даты», «Сохранённые пресеты». Пока модалка открыта, скролл страницы под скримом заблокирован (body overflow:hidden + компенсация ширины скроллбара, счётчик замков для вложенных диалогов). Карточка пресета — шеврон-аккордеон (IconButton Neutral S, `aria-expanded`/`aria-controls`) раскрывает таблицу «Параметр — значение», рядом «Применить» (Button Outline XS) и корзина (IconButton Neutral S). Сохранение пресета — кнопка «Сохранить пресет» в подвале → вложенный диалог w3 с одним полем. Открытие модалки: скролл body заблокирован, фон inert/aria-hidden, focus trap, возврат фокуса на инициатор.

Полная анатомия: specs/TableFilter.md.

## Tile
css: `styles/tile.css` · js: `scripts/ds-tile.js` · deps: [icon-button, button, link, chip, badge, alert, divider, read-only-field]
**Оси:** вариант (обычный/Accordion/Headless) · alert-слот (warning/info/error) · ширина (3–12 колонок).
**Инварианты:** высота тайла в ряду = высоте самого высокого (`align-self:stretch`+Grid); своих интерактивных состояний у тайла нет.
**Классы:** `.tile` · `.tile--headless` · `.tile--accordion` · `.tile--collapsed` · `.tile__header` · `.tile__header-main` · `.tile__title-row` · `.tile__title` · `.tile__title-add` · `.tile__subtitle` · `.tile__chiplist` · `.tile__actions` · `.tile__toggle` / `.tile__chevron` · `.tile__alert` · `.tile__body` · `.tile__collapsible` · `.tile__grid` / `.tile__rows` · `.tile__grid-full` (элемент на всю ширину сетки) · `.tile-row` · `.tile-group` (обёртка рядов, зазор 16px) · `.tile-stack`
**Диагностика:** «Тайлы в одном ряду разной высоты» → ряд должен быть CSS Grid (`align-items:stretch` по умолчанию), не flex с `align-items:start` · «У тайла есть свой hover-эффект» → нарушение инварианта — тайл не должен иметь собственных интерактивных состояний

Основная плашка рабочей области: TileHeader (M) + опц. Alert + контентная область (наполнение индивидуально). Ширина 3–12 колонок, отступы контента 10/20/24/20. Собственных состояний нет. Варианты: `--headless` (без хэдера, отступы 24/24/32/24), `--accordion` (+ `--collapsed`).

Раскладка ряда тайлов — `.tile-row` (grid 12 колонок, `.tile` сам растягивается по высоте ряда через `align-self:stretch`, экрану ничего дополнительно писать не нужно); канбан-колонки — `.tile-stack` внутри `.tile-row` (flex-column, вложенные тайлы высоту друг с другом не делят):
```html
<div class="tile-row">
  <section class="tile" style="grid-column:span 4">…</section>
  <section class="tile" style="grid-column:span 4">…</section>
  <div class="tile-stack" style="grid-column:span 4"><section class="tile">…</section><section class="tile">…</section></div>
</div>
```

**Ширина тайла задаётся только средствами ДС**, свои классы (`.dpc-half`, `.xxx-full`) экран не заводит — из-за них ширина перестаёт читаться из разметки. Два штатных способа:

| Способ | Когда | Как |
|---|---|---|
| Инлайн | ряд не перестраивается при сужении | `<section class="tile" style="grid-column:span 4">` |
| Классы Spacing | нужно перестроение (**обычный случай для экрана с несколькими рядами**) | `<section class="tile col-4 colw-12">` — `col-N` широкая ширина, `colw-N` узкая |

Узкие ширины включает экран порогом (`.col-N`/`.colw-N` — обычные утилиты Spacing, работают в любой 12-колоночной сетке, в том числе в `.tile-row`):
```css
@container screen (max-width: 1240px) {
  .tile-row > [class*="colw-"] { grid-column: span var(--colw); }
}
```
Инлайн `style="grid-column:span N"` из CSS не переопределяется без `!important` — если нужен адаптив, бери пару `col-N`/`colw-N`, а не изобретай свой класс.

Число колонок подбирается под объём контента, а не «по умолчанию 6»: блок на 3–4 коротких поля — 4 колонки (три в ряд), плотный блок — 6, таблица/длинный текст — 12. Пустое место справа внутри тайла — признак, что взято слишком много колонок.

**Несколько рядов — оборачиваются в `.tile-group`** (flex-колонка, зазор 16px). Зазор между рядами руками не выставляется: `.screen__content` — flex с `gap: 24px`, и `margin` на `.tile-row` сложился бы с ним в 40px. Группа решает это тем, что она — один ребёнок контентной области: 24px остаётся между крупными зонами (PageHeader ↔ группа), 16px работает внутри группы.
```html
<div class="tile-group">
  <div class="tile-row">…</div>
  <div class="tile-row">…</div>
</div>
```

**Элемент на всю ширину сетки тайла** (длинное «Описание», комментарий, вложенный Alert) — `.tile__grid-full` внутри того же `.tile__grid`, не соседний блок со своими паддингами:
```html
<div class="tile__grid" style="grid-template-columns:repeat(4,1fr)">
  <div class="rof">…поле…</div>
  <div class="rof tile__grid-full"><span class="ds-label"><span class="ds-label__text">Описание</span></span>…</div>
</div>
```

```html
<section class="tile">
  <header class="tile__header">
    <div class="tile__header-main">
      <div class="tile__title-row">
        <h3 class="tile__title">Проектное финансирование</h3>
        <!-- Addition: link | icon(--icon=warning) | chip | badge -->
        <span class="tile__title-add tile__title-add--icon" aria-hidden="true"><i data-icon="alert-triangle-filled"></i></span>
      </div>
      <p class="tile__subtitle"><span class="tile__subtitle-icon"><i data-icon="check-circle-filled"></i></span>Нерезидент</p>
      <div class="tile__chiplist"><span class="chip chip--xs"><span class="chip__label">Погашен</span></span></div>
    </div>
    <div class="tile__actions"><!-- 1..3 действия: IconButton M (20×20) и/или Button, зазор 8 -->
      <button class="ibtn ibtn--neutral ibtn--m" aria-label="Редактировать"><i data-icon="edit"></i></button>
    </div>
  </header>
  <!-- опц. полноширинный Alert между хэдером и контентом (в Card не бывает) -->
  <div class="tile__alert"><div class="alert alert--warning alert--m" role="status">…</div></div>  <!-- warning | info | error -->
  <div class="tile__body"><div class="tile__grid" style="grid-template-columns:1fr 1fr;">…поля ReadOnlyField (.rof)…</div></div>
</section>

<!-- headless -->
<section class="tile tile--headless"><div class="tile__body">…</div></section>

<!-- accordion: toggle .tile__toggle (aria-expanded) над .tile__collapsible; свёрнуто — .tile--collapsed -->
<section class="tile tile--accordion">
  <header class="tile__header">… <button class="ibtn ibtn--neutral ibtn--m tile__toggle" aria-expanded="true" aria-controls="acc-1"><span class="tile__chevron"><i data-icon="chevron-up"></i></span></button></header>
  <div class="tile__collapsible" id="acc-1"><div class="tile__body">…</div></div>
</section>
```

Паддинги хэдера 20/20/10/20 · отступы контента 0/20/24/20 — визуально 10/20/24/20 (headless 20/20/32/20) · строки 16/24 · колонки 16 · зазор в header-main 8, в actions 8, в chiplist 4. Title `--type-h5-strong`, Subtitle Body XS. Полная анатомия: specs/Tile.md.


`.tile__toggle` — JS-хук на кнопке-шевроне (собственных правил в CSS нет, стилизует IconButton), обязателен: обработчик аккордеона делегирует по нему.

**Из коробки:** подключить `scripts/ds-tile.js` — любая `.tile--accordion` с `.tile__toggle` сворачивается сама (делегированно, переживает перерисовку). Рантайм держит `.tile--collapsed`, `aria-expanded`/`aria-label`/`aria-controls` и шлёт событие `tiletoggle`. Свёрнуто по умолчанию — просто добавить класс в разметке. API: `DSTile.wire(el,{collapsed,onToggle})`, `DSTile.toggle(el,v)`.

## Spacing (Сетка и отступы)
css: `styles/spacing.css` · deps: — · 1.004
Модуль 4 px: все отступы/зазоры/размеры кратны 4 (основной шаг 8). Полушаги 2/6/10/14 — только микро-оптика. Шкала `--space-0…96` (0·4·8·12·16·20·24·32·40·48·64·80·96) + алиасы: `--gap-icon-text` 8 · `--gap-label-field` 4 · `--gap-inline` 8 · `--gap-stack` 16 · `--gap-group` 24 · `--gap-section` 40 · `--pad-control-s` 8 · `--pad-control` 12 · `--pad-card` 16 · `--pad-panel` 24 · `--pad-page` 32. Сетка: контентная область = 12 резиновых колонок, зазор `--grid-gutter` 16 px постоянный, поля `--grid-margin` 0 (задаёт лайаут). col = (W − 2·margin − 11·gutter)/12, дробная ширина — норма. Раскладки: 12 · 8+4 · 6+6 · 4+4+4 · 3+3+3+3. Утилиты: `.grid12` + `.col-1…12`; подмена зазора — инлайн `style="--grid-gutter:var(--space-16)"`.

```html
<div class="grid12">
  <section class="col-8">контент</section>
  <aside class="col-4">панель</aside>
</div>
<!-- зазор внутри блока — из шкалы: gap: var(--gap-stack) -->
```

Ширина блока — любое число колонок 1–12; правило — привязка к колонке, исключение (редко) — кастомный фиксированный размер или ширина по контенту, помеченный `data-off-grid="причина"`. Перестроение при сужении — пара span'ов на блоке: `class="col-3 colw-6"` (основная / узкая ширина). `.colw-N` сама ничего не меняет — узкие ширины включает экран: `@container screen (max-width: …) { .grid12 > [class*="colw-"] { grid-column: span var(--colw) } }` либо класс `.grid12--narrow` на сетке. Общих брейкпоинтов в ДС нет — порог задаёт экран.

Полная анатомия: specs/Spacing.md.
