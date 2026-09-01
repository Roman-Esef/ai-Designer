# IBP DS — дизайн-система

Дизайн-система продукта **IBP (Investment Banking Platform)** — визуальный язык интерфейса: токены (цвета, типографика, скругления, тени), шрифты SB Sans, иконки, иллюстрации и документация компонентов.

## Контекст
IBP — внутренняя платформа инвестиционного банкинга (пайплайны сделок, клиенты, риск-метрики, отчётность). Интерфейс — плотный, деловой, на русском; акцентный цвет — изумрудно-зелёный. Тон документации — точный и однозначный (таблицы вместо прозы, явные значения токенов), рассчитан на дизайнеров и разработчиков.

## Формат: ванильный HTML/CSS
Эта ДС — **чистый HTML + CSS**. Источник истины: `styles/*.css` (токены и классы) и HTML-страницы документации в `pages/`. React-компонентов (`.jsx`/`.d.ts`) здесь нет намеренно — так с файлами напрямую работает любой агент или харнес. Витрина (вкладка Design System) собирается компилятором из карточек `@dsCard`, размещённых первой строкой каждой страницы; реестр токенов — из CSS, доступного через корневой `styles.css`.

> Ранее планировался этап A→C (страницы на общем CSS → перевод демо-зон на React-компоненты из бандла). После разворота на ванильный HTML/CSS **этап C неактуален**: страницы документации и есть компоненты — отдельного слоя React-обёрток не будет.


## Структура
```
styles.css               ← корневая точка входа компилятора (@import токенов и стилей)
ds.css                   ← точка подключения ДС для экранов (зеркало styles.css)
thumbnail.html           ← иконка ДС для домашней витрины
index.html               ← обзор ДС (карточки компонентов)
tokens → см. styles/     ← colors.css, typography.css, radius.css, shadow.css
styles/                  ← CSS фундамента и по файлу на компонент
fonts/                   ← SB Sans Display / Text / Screen (.otf)
assets/                  ← logo.svg, illustrations/ (иллюстрации-заглушки)
scripts/                 ← ds-nav, ds-toc, ds-icons, pg-kit, icons-data, per-page *.page.js
pages/foundations|atoms|molecules|organisms|patterns/  ← документация
specs/                   ← md-спеки компонентов (экономят контекст) + _index.md, _cheatsheet.md
templates/screen/        ← Screen.html — стартовый шаблон экрана
CLAUDE.md                ← правила ведения ДС (инжектится в каждый разговор)
```

## Компоненты
- **Основы:** Типографика, Цвета, Иконки, Иллюстрации, Скругления, Тени.
- **Атомы (12):** Avatar, Badge, Button, Checkbox, Chip, Divider, IconButton, Label + Helper, Link, ProgressBar, Radiobutton, Switch.
- **Молекулы (18):** Alert, Breadcrumbs, ButtonGroup, ContextMenu, InputAmountRange, InputAutocomplete, InputDate, InputDateRange, InputText, NavTile, Pagination, ReadOnlyField, SegmentControl, Select, Splitter, Tab, Toast, Tooltip.
- **Организмы (10):** Entity, Modal, NavPanel, PageHeader, Popover, RiskMetric, SnackBar, TableCell, TableFilter, Tile.

## Шрифты
SB Sans Display / Text / Screen (`.otf` в `fonts/`, `@font-face` в `styles/typography.css`). Оригинальные файлы перенесены 1:1.

## Иконки и иллюстрации
- Иконки — глиф-сет в `scripts/icons-data.js` (671 KB), вставляются как `<i data-icon="имя"></i>` через `scripts/ds-icons.js` (SVG в `currentColor`). Имена глифов — `specs/Icons.md`.
- Иллюстрации — SVG-заглушки продукта в `assets/illustrations/`.
- Логотип — `assets/logo.svg`.

## Как пользоваться
- Правила ведения, чек-листы (новый компонент / правка / экран) и запреты — в `CLAUDE.md`.
- Быстрый обзор всех компонентов для сборки экрана — `specs/_cheatsheet.md`.
- Новый экран — копия `templates/screen/Screen.html` + компоненты из спек.
