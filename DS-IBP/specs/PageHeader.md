---
component: PageHeader
title: "PageHeader"
version: "1.008"
updated: "21.08.2026"
page: pages/organisms/PageHeader.html
runtime: scripts/ds-menu.js, scripts/ds-actions-overflow.js
css: styles/page-header.css
deps: [button, icon-button, chip, badge, context-menu, tooltip, breadcrumbs]
status: curated
---

> Спека для быстрого контекста. Источник истины — styles/page-header.css и страница компонента. При изменении обновляй эту спеку и блок в specs/_cheatsheet.md.

## Назначение
PageHeader — заголовок страницы рабочей области: идентифицирует открытую сущность (сделка, инструмент, раздел) и несёт основные действия страницы. Состоит из независимых частей: неразрывная группа Title (+IconLeft, +Edit), Chips, кнопка возврата (Return), Subtitle, Actions (+MenuButton). Адаптируется вплоть до мобильной раскладки. Breadcrumbs — отдельный компонент, ставится строкой НАД PageHeader.

## Инварианты
- Заголовок многострочный, без усечения (`.phead__title{white-space:normal}`) — эллипсиса и тултипа по обрезке у него нет и не планируется.
- Переполнение `.phead__actions` в меню «Ещё» — общий рантайм `scripts/ds-actions-overflow.js` (opt-in `data-actions-overflow`), тот же принцип, что у переполнения табов (`ds-tabs.js`).
- IconLeft + Title + Edit — неразрывная группа (`.phead__title-group`), не переносится отдельно от заголовка при wrap.
- Заголовок не усекается никогда — многострочный, полностью виден (`white-space:normal`, без ellipsis).
- Return и Chips прижаты к заголовку в основной раскладке; на мобильной (`--stack`) переезжают в `.phead__extras` отдельной строкой.
- `.phead--stack` растягивает action-кнопки на всю ширину, кроме icon-only — те сохраняют квадратные пропорции.

## Диагностика
- «Заголовок обрезается многоточием» → по спеке не должен — убрать ellipsis, дать переноситься
- «Return в мобильной раскладке остаётся в строке заголовка» → переместить в `.phead__extras`

## Ключевые правила (исключения описываются индивидуально), всегда сверху, под Breadcrumbs. Один на страницу. Title = семантический h1 страницы. Не путать с TileHeader (заголовок плашки) и Modal_Top (шапка модалки).
- **Анатомия** — `.phead` = `.phead__main` (колонка: `.phead__title-row` → `.phead__subtitle`) + `.phead__actions`. В title-row: `.phead__title-group` (неразрывная группа: `.phead__title-ico` опц. · `.phead__title` · `.phead__edit` опц.) · `.phead__chips` (опц.) · `.phead__return` (опц.).
- **Варианты** — все части независимо опциональны (16 комбинаций Subtitle×Chips×Return×Actions); Dashboard=Yes → `.phead--dashboard` (белая подложка `--bg-tile`, радиус 8, паддинг 12/16) — дашборды и кейсы с заголовком на отдельной белой панели.
- **Title** — токен `--type-h3-strong` (28/32), многострочный: усечения нет, длинный заголовок переносится по словам на нужное число строк. Иконка слева 24px `--text-inactive` — информационная. Edit — IconButton neutral S 24×24 (глиф `edit`), открывает модальное окно переименования (инлайн-редактирования нет).
- **Chips** — Chip ReadOnly S **rounded** (`chip--rounded`): чипы заголовка — статусы, а статусы всегда скруглённые. Один или список. Стоят после Title/Edit.
- **Return** — Button Outline XS с глифом `flip-backward`: возврат на уровень выше (из таблицы сделки — к списку сделок). Обычно одна; в редких кейсах больше.
- **Subtitle** — Body S `--text-secondary`, три вида: просто текст, текст с иконкой (опц. 16 слева/справа, `--success`), или кастомный — встроенные мета-элементы `.phead__meta` (Body XS `--text-inactive`, иконка+текст), например «7 · Версия 12 (07.02.2021)».
- **Actions** — справа, кнопки M; максимум 3, при большем — остальные в MenuButton (`btn--outline btn--m btn--icon-only`, глиф `more-dots` + ContextMenu). MenuButton всегда последняя.
- **Поведение** — адаптивность: <1024 второстепенные actions уходят в MenuButton, а чипы и Return переносятся отдельной строкой под Subtitle (`.phead__extras`); <720 — `.phead--stack` (actions вниз, на всю ширину). Title на любой ширине показывается целиком (перенос строк, без Tooltip). MenuButton открывает ContextMenu поверх страницы. Переполнение chips — чип-счётчик «+N».
- **Состояния** — собственных нет; интерактивны только вложенные компоненты (Edit, Return, Actions, MenuButton, chip__info).
- **Доступность** — Title = h1; Edit/MenuButton — aria-label; MenuButton — aria-haspopup="menu"/aria-expanded; Return — текст или aria-label с указанием куда ведёт; декоративные иконки aria-hidden.
- **Типографика** — Title `--type-h3-strong`; Subtitle `--type-body-s`; мета `--type-body-xs`.
- **Цвета** — Title `--text-primary`; иконка слева и мета `--text-inactive`; Subtitle `--text-secondary`; иконка сабтайтла/мета-ок `--success`; подложка Dashboard `--bg-tile`.

## DOM-анатомия
```
<div class="phead">
  <div class="phead__main">
    <div class="phead__title-row">
      <div class="phead__title-group"><!-- неразрывная группа: IconLeft + Title + Edit -->
        <span class="phead__title-ico" aria-hidden="true"><i data-icon="drag-dots"></i></span>  <!-- опц. -->
        <h1 class="phead__title">D-007. ПАО «Газпром»</h1>
        <button class="ibtn ibtn--neutral ibtn--s phead__edit" aria-label="Переименовать"><i data-icon="edit"></i></button>  <!-- опц. -->
      </div>
      <div class="phead__chips"><span class="chip chip--rounded chip--s"><span class="chip__label">Черновик</span></span></div>  <!-- опц. -->
      <span class="phead__return"><button class="btn btn--outline btn--xs"><i data-icon="flip-backward"></i><span class="btn__label">В сделку</span></button></span>  <!-- опц. -->
    </div>
    <div class="phead__subtitle">  <!-- опц.; стандартный ИЛИ кастомный -->
      <span class="phead__subtitle-ico" aria-hidden="true"><i data-icon="check-circle-filled"></i></span>
      Дата фактического погашения 12.01.2021
      <!-- кастомный: <span class="phead__meta"><span class="phead__meta-ico"><i data-icon="copy"></i></span>7</span>
                      <span class="phead__meta"><span class="phead__meta-ico phead__meta-ico--ok"><i data-icon="check-circle"></i></span>Версия 12 (07.02.2021)</span> -->
    </div>
  </div>
  <div class="phead__actions">  <!-- опц.; max 3 кнопки + MenuButton -->
    <button class="btn btn--outline btn--m"><i data-icon="star"></i><span class="btn__label">В избранное</span></button>
    <button class="btn btn--accent btn--m"><i data-icon="download"></i><span class="btn__label">Выгрузить</span></button>
    <button class="btn btn--outline btn--m btn--icon-only" aria-label="Ещё действия" aria-haspopup="menu" aria-expanded="false"><i data-icon="more-dots"></i></button>
  </div>
</div>
<!-- Dashboard: .phead--dashboard · Мобильная раскладка: .phead--stack -->
```

## Справочник классов
| Класс | Назначение |
|---|---|
| `.phead` | корень: flex-строка main + actions, gap 16 |
| `.phead__main` | колонка title-row → subtitle, gap 6, min-width:0 |
| `.phead__title-row` | строка частей заголовка, gap 8, min-height 32, wrap при переполнении |
| `.phead__title-group` | неразрывная группа IconLeft + Title + Edit, gap 8, min-width:0 |
| `.phead__title-ico` | иконка слева 24, `--text-inactive` |
| `.phead__title` | h1, `--type-h3-strong`, многострочный (без усечения), min-width 120px |
| `.phead__edit` | слот IconButton neutral S (edit) |
| `.phead__chips` | ряд Chip ReadOnly S rounded, gap 8 |
| `.phead__return` | слот кнопки возврата (Outline XS) |
| `.phead__subtitle` | Body S `--text-secondary`, gap 8/12, wrap |
| `.phead__subtitle-ico` | иконка 16, `--success` |
| `.phead__meta` / `.phead__meta-ico(--ok)` | мета-элемент кастомного сабтайтла, Body XS |
| `.phead__actions` | кнопки справа, gap 8, margin-left:auto |
| `.phead__extras` | чипы + Return отдельной строкой под Subtitle (tablet/mobile) |
| `.phead--dashboard` | белая подложка `--bg-tile`, радиус 8, паддинг 12/16 |
| `.phead--stack` | мобильная раскладка: колонка, actions вниз на всю ширину |

## Тестовая среда (не часть компонента)
В разделе «Бэклог» страницы живёт экспериментальная раскладка `.phx` (стили в самой странице): Return над заголовком транспарентной кнопкой; подзаголовок неразрывен с заголовком и ограничен его шириной (`width:0;min-width:100%`), поэтому переносится в 2+ строки; чипы, не влезшие в строку заголовка, уходят под подзаголовок (класс `.phx--chips-below`, раскладка считается в `layoutPhx()`).

- **Размеры · Радиус скругления** — У обычного заголовка фона нет; плашка только в Dashboard. заголовок — 0 · вариант Dashboard — 8px (--radius-m).
