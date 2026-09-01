---
component: Tile
title: "Tile"
version: "1.010"
updated: "30.08.2026"
page: pages/organisms/Tile.html
runtime: scripts/ds-tile.js
css: styles/tile.css
deps: [icon-button, button, link, chip, badge, alert, divider, read-only-field]
status: curated
---

> Спека для быстрого контекста. Источник истины — styles/tile.css и страница компонента. При изменении обновляй эту спеку и блок в specs/_cheatsheet.md.

## Назначение
Tile — основная плашка рабочей области страницы: группирует связанные поля и действия по объекту (сделка, продукт, инструмент, контрагент). Состоит из TileHeader (размер M) и контентной области; наполнение контента индивидуально под задачу и тип тайла. Родственники: TileHeadless (без хэдера) и Card (для модалок).

## Инварианты
- Высота тайла в ряду = высоте самого высокого тайла ряда (`align-self:stretch` + CSS Grid) — не задавать тайлам фиксированную высоту вручную.
- Собственных интерактивных состояний у тайла нет — активны только вложенные IconButton/Button/Link, сам контейнер не хочет hover/focus.
- Alert-слот между хэдером и контентом — полноширинный, без скруглений (совпадает с бордером тайла), не карточка внутри карточки.
- TileHeadless и AccordionTile — разные паддинг-схемы низа (32px vs 20/8px) — не смешивать варианты.

## Диагностика
- «Тайлы в одном ряду разной высоты» → ряд должен быть CSS Grid (`align-items:stretch` по умолчанию), не flex с `align-items:start`
- «У тайла есть свой hover-эффект» → нарушение инварианта — тайл не должен иметь собственных интерактивных состояний

## Ключевые правила (из разделов страницы)
- **Использование** — плашка рабочей области. Общие правила построения; под каждую конкретную плашку заводится локальный компонент. Контент любой. Не использовать в модалках (там Card) и для отдельного объекта в списке (там Entity).
- **Анатомия** — TileHeader (Title + опц. Addition, Subtitle, Chiplist, Actions) + опц. полноширинный Alert + контентная область. Паддинги хэдера 20/20/10/20 — зазор 10 до контента даёт сам хэдер.
- **Варианты** — обычный Tile; AccordionTile (полный/частичный коллапс); TileHeadless (без хэдера, отступы 20/20/32/20); Alert-слот (Warning · Info · Error).
- **Размеры** — ширина 3–12 колонок сетки контейнера; высота — по 3D. Основной паттерн — ряд: все тайлы ряда равны высоте самой высокой плашки (с учётом алертов; `.tile` несёт `align-self:stretch` сам по себе, независимо от `align-items` контейнера экрана — см. «Tile-раскладка» ниже). Два исключения, не требующие отдельной логики — просто следствие того, как устроен CSS Grid: тайл один на весь ряд (span 12) — высота по контенту (он единственный в своём ряду); тайлы в колонках/стопках (канбан-лейаут, напр. 3 стопки по 4 колонки) — высота каждого тайла по своему контенту, не по соседним стопкам — стопка это flex-column (`.tile-stack`), а у flex-column `align-self:stretch` тянет ширину, не высоту.
- **Размеры · Радиус скругления** — Радиус не зависит от числа колонок и высоты контента. тайл — 8px (--radius-m) · Alert внутри тайла — 0.
- **Контент** — текст, дивайдеры, ReadOnly-поля (компонент ReadOnlyField, `.rof`), кнопки, ссылки, вложенные плашки-аккордеоны. Отступы контента 0/20/24/20 (визуально 10 сверху — из паддинга хэдера); строки 16/24; колонки 16. Чипы в Chiplist — размер XS, зазор 4.
- **Поведение** — сворачивание аккордеона (шеврон, поворот 180°); выравнивание высоты в ряду — `align-self:stretch` на `.tile`, работает вне зависимости от `align-items` контейнера экрана (RulesAudit W2, 12.08.2026); усечение Title + Tooltip.
- **Состояния** — Tile собственных состояний НЕ имеет. Интерактивны только вложенные IconButton (хэдер), Button/Link (контент, алерт). AccordionTile collapsed/expanded — конфигурация, не состояние.
- **Доступность** — Title = семантический heading; иконка-предупреждение декоративна (aria-hidden); IconButton — aria-label; шеврон — поворот на 180° красится и по `[aria-expanded="false"]` на кнопке напрямую (RulesAudit W1, 12.08.2026); рантайм `ds-tile.js` остаётся class-authoritative — сам синхронизирует атрибут с `.tile--collapsed`, атрибутный CSS — фоллбэк для случаев без класса. aria-expanded + aria-controls; Alert — role по тону; reduced-motion отключает анимацию.
- **Типографика** — Title Tile: `--type-h5-strong`; Title Card: `--type-h6-strong`; Subtitle и метка поля: `--type-body-xs`; значение поля: `--type-body-m` (Strong — по месту, не дефолт).
- **Цвета** — фон `--bg-tile`, бордер `--border-light`; текст `--text-primary`/`--text-secondary`/`--text-inactive`; Addition-иконка `--warning`, иконка сабтайтла `--success`, ссылка `--link`; Alert-слот `--warning-bg`/`--info-bg`.

## Для разработчиков (выжимка)

### Точные размеры (redline)
Рендерятся на странице через getComputedStyle. Радиус 8 (`--radius-m`), бордер 1px `--border-light`, паддинг хэдера 20 сверху / 20 по бокам / 10 снизу, зазор Title↔Subtitle↔Chiplist 8, зазор действий в Actions 8, зазор чипов в Chiplist 4, паддинг контента 0/20/24/20 (headless 20/20/32/20), зазор строк 16 (или 24), колонок 16.

### Разметка · HTML (эталонная реализация ДС)

```
<section class="tile">
  <header class="tile__header">
    <div class="tile__header-main">
      <div class="tile__title-row"><h3 class="tile__title">Заголовок</h3><!-- Addition --></div>
      <p class="tile__subtitle"><span class="tile__subtitle-icon">…</span>Нерезидент</p>
      <div class="tile__chiplist">…Chip readonly XS…</div>
    </div>
    <div class="tile__actions"><button class="ibtn ibtn--neutral ibtn--m" aria-label="…">…</button></div>
  </header>
  <div class="tile__alert"><div class="alert alert--warning alert--m" role="status">…</div></div>  <!-- warning | info | error -->
  <div class="tile__body">…контент индивидуальный; поля значений — ReadOnlyField (.rof)…</div>
</section>
<!-- headless: .tile.tile--headless > .tile__body (без хэдера) -->
<!-- accordion: .tile.tile--accordion; toggle .tile__toggle (aria-expanded) над .tile__collapsible; свёрнуто — .tile--collapsed -->
```

### Рантайм ДС — `scripts/ds-tile.js`

Сворачивание аккордеона вынесено в рантайм и работает делегированно: любая
`.tile--accordion` с кнопкой `.tile__toggle` оживает сама, включая плашки,
перерисованные конструктором или пришедшие с сервера.

Рантайм переключает `.tile--collapsed` на корне, синхронизирует
`aria-expanded` и `aria-label` кнопки, связывает её с `.tile__collapsible`
через `aria-controls` (id проставляется, если его нет) и шлёт всплывающее
событие `tiletoggle` с `{ collapsed }`.

Свёрнутое по умолчанию состояние задаётся классом `.tile--collapsed` прямо в
разметке — рантайм подхватит его и выставит атрибуты.

API: `DSTile.wire(tileEl, { collapsed, onToggle })` → `{ el, toggle(v), collapsed() }`,
`DSTile.toggle(tileEl, v)`, `DSTile.wireAll(root)`.

### Поведение · псевдокод (framework-agnostic)
```
onToggle():                       # AccordionTile
  collapsed = !collapsed
  tile.classList.toggle('tile--collapsed', collapsed)
  toggle.setAttribute('aria-expanded', String(!collapsed))
# Полный коллапс: весь контент в .tile__collapsible.
# Частичный: постоянная сводка вне .tile__collapsible.
# Высота ряда: align-self:stretch на .tile (не align-items контейнера) — пересчёт автоматичен при смене наполнения, ничего на стороне экрана делать не нужно.
```

### Справочник классов и атрибутов

| Класс/атрибут | Назначение |
|---|---|
| `.tile` | корень: flex-колонка, фон `--bg-tile`, бордер 1px, радиус 8 |
| `.tile--headless` | без хэдера; отступы контента 20/20/32/20 |
| `.tile--accordion` | сворачиваемый тайл |
| `.tile--collapsed` | свёрнуто: `.tile__collapsible` скрыт (display:none) |
| `.tile__header` | TileHeader M: header-main + actions, padding 20 20 10 |
| `.tile__header-main` | колонка title-row · subtitle · chiplist, gap 8 |
| `.tile__title-row` | строка Title + Addition |
| `.tile__title` | заголовок, H5 Strong, усекается |
| `.tile__title-add` | Addition: link/icon/chip/badge; `--icon` = warning |
| `.tile__subtitle` | подзаголовок, Body XS, опц. `.tile__subtitle-icon` (success) |
| `.tile__chiplist` | ряд чипов-маркеров (Chip XS, зазор 4) |
| `.tile__actions` | трейлинг: 1–3 действия — IconButton (размер M, 20×20) и/или Button, зазор 8 |
| `.tile__toggle` / `.tile__chevron` | кнопка-шеврон аккордеона (aria-expanded) / поворот 180° |
| `.tile__alert` | полноширинный Alert-слот (углы прямые) |
| `.tile__body` | контентная область, padding 0/20/24/20 |
| `.tile__collapsible` | сворачиваемая часть контента |
| `.tile__grid` / `.tile__rows` | сетки контента: строки 16/24, колонки 16 |
| `.tile-row` | ряд нескольких тайлов — grid 12 колонок, gap 16. Ширина тайла — `style="grid-column:span N"` (ряд без перестроения) либо пара утилит Spacing `col-N` + `colw-N` (когда нужен адаптив: инлайн-стиль из CSS не переопределить). Своих классов ширины экран не заводит; узкий режим включается порогом `@container screen (max-width: …) { .tile-row > [class*="colw-"] { grid-column: span var(--colw) } }` |
| `.tile-group` | обёртка нескольких `.tile-row` — flex-колонка, зазор 16px. Обязательна, когда рядов больше одного: `.screen__content` имеет собственный `gap: 24px`, поэтому зазор нельзя задавать `margin`'ом на `.tile-row` (сложится в 40px). Группа — один ребёнок контентной области: 24px между крупными зонами, 16px внутри группы |
| `.tile__grid-full` | элемент на всю ширину сетки тайла (`grid-column:1/-1`) — длинное «Описание», комментарий, Alert: остаётся внутри `.tile__grid`, не выносится соседним блоком |
| `.tile-stack` | колонка/стопка внутри `.tile-row` (канбан) — flex-column, gap 16; вложенные тайлы высоту друг с другом не равняют |
