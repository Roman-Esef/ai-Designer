---
belongs_to: docs-split
purpose: Структурная карта doc-страниц IBP. Читай карту вместо файла целиком. Генерируется командой map, руками не править.
generated: 2026-09-01
---

# Карта страниц документации

Статус: ✅ — раскатано на docs-split, ⬜ — старый формат. Конструктор: dynamic — контролы строит page.js в `#pg-controls` (docs-split.js сам делает две колонки); static — разметка `.ctl-col`/`.toggles` вручную; grouped — `.ctl-group` с двумя колонками в каждой.

## Foundations (8)

| Страница | Конструктор | Демо | page.js | CSS | Секций | Статус |
|---|---|---|---|---|---|---|
| Colors | — | — | — | — | 0 | ⬜ |
| Elevation | static | — | — | — | 4 | ✅ |
| Icons | — | — | — | — | 0 | ⬜ |
| Illustrations | — | — | — | styles/illustration.css | 4 | ⬜ |
| Layout | static | — | layout.page.js | styles/layout.css | 12 | ✅ |
| Radius | static | — | — | — | 4 | ✅ |
| Spacing | static | — | — | styles/spacing.css | 7 | ✅ |
| Typography | — | — | — | — | 4 | ⬜ |

## Atoms (15)

| Страница | Конструктор | Демо | page.js | CSS | Секций | Статус |
|---|---|---|---|---|---|---|
| Avatar | dynamic | — | — | styles/avatar.css | 12 | ✅ |
| Badge | dynamic | — | — | styles/badge.css | 12 | ✅ |
| ButtonTest | dynamic | — | — | styles/button.css | 15 | ✅ |
| Buttons | dynamic | — | — | styles/button.css | 12 | ✅ |
| Checkbox | dynamic | — | — | styles/checkbox.css | 12 | ✅ |
| Chip | dynamic | — | chip.page.js | styles/chip.css | 12 | ✅ |
| Divider | dynamic | pg-stage | divider.page.js | styles/divider.css | 12 | ✅ |
| IconButton | dynamic | — | — | styles/icon-button.css | 12 | ✅ |
| LabelHelper | dynamic | — | label-helper.page.js | styles/label-helper.css | 12 | ✅ |
| Link | dynamic | — | — | styles/link.css | 12 | ✅ |
| ProgressBar | dynamic | — | — | styles/progress-bar.css | 12 | ✅ |
| Radiobutton | dynamic | — | — | styles/radio.css | 12 | ✅ |
| Skeleton | dynamic | — | — | styles/skeleton.css | 12 | ✅ |
| Spinner | dynamic | pg-stage | — | styles/spinner.css | 12 | ✅ |
| Switch | dynamic | — | — | styles/switch.css | 12 | ✅ |

## Molecules (20)

| Страница | Конструктор | Демо | page.js | CSS | Секций | Статус |
|---|---|---|---|---|---|---|
| Alert | dynamic | — | alert.page.js | styles/alert.css | 12 | ✅ |
| Breadcrumbs | dynamic | — | breadcrumbs.page.js | styles/breadcrumbs.css | 12 | ✅ |
| ButtonGroup | dynamic | — | — | styles/button-group.css | 12 | ✅ |
| ContextMenu | dynamic | pg-stage | context-menu.page.js | styles/context-menu.css | 12 | ✅ |
| DatePicker | dynamic | pg-stage | datepicker.page.js | styles/datepicker.css | 11 | ✅ |
| DropdownList | dynamic | pg-stage | dropdown-list.page.js | styles/dropdown-list.css | 12 | ✅ |
| EmptyState | dynamic | — | — | styles/empty-state.css | 12 | ✅ |
| InputAmountRange | dynamic | pg-stage | input-amount-range.page.js | styles/input-range.css | 11 | ✅ |
| InputAutocomplete | dynamic | pg-stage | input-autocomplete.page.js | styles/input.css | 11 | ✅ |
| InputDate | dynamic | pg-stage | input-date.page.js | styles/input.css | 11 | ✅ |
| InputDateRange | dynamic | pg-stage | input-date-range.page.js | styles/input-range.css | 11 | ✅ |
| InputText | dynamic | pg-stage | input-text.page.js | styles/input.css | 11 | ✅ |
| NavTile | dynamic | pg-stage | nav-tile.page.js | styles/nav-tile.css | 11 | ✅ |
| Pagination | dynamic | demo-hscroll | pagination.page.js | styles/pagination.css | 12 | ✅ |
| ReadOnlyField | dynamic | — | read-only-field.page.js | styles/read-only-field.css | 12 | ✅ |
| SegmentControl | dynamic | — | segment-control.page.js | styles/segment-control.css | 12 | ✅ |
| Splitter | dynamic | pg-stage | splitter.page.js | styles/splitter.css | 12 | ✅ |
| Tab | dynamic | — | tab.page.js | styles/tab.css | 12 | ✅ |
| Toast | dynamic | — | toast.page.js | styles/toast.css | 12 | ✅ |
| Tooltip | dynamic | pg-stage | tooltip.page.js | styles/tooltip.css | 12 | ✅ |

## Organisms (13)

| Страница | Конструктор | Демо | page.js | CSS | Секций | Статус |
|---|---|---|---|---|---|---|
| AllocationBar | dynamic | pg-stage | allocation-bar.page.js | styles/allocation-bar.css | 12 | ✅ |
| Chart | dynamic | pg-stage | chart.page.js | styles/chart.css | 12 | ✅ |
| Entity | static | demo-entity | — | styles/entity.css | 12 | ✅ |
| Modal | dynamic | pg-stage | modal.page.js | styles/modal.css | 12 | ✅ |
| NavPanel | dynamic | pg-stage | nav-panel.page.js | styles/nav-panel.css | 12 | ✅ |
| PageHeader | static | demo-scale | page-header.page.js | styles/page-header.css | 12 | ✅ |
| Popover | dynamic | pg-stage | popover.page.js | styles/popover.css | 12 | ✅ |
| RiskMetric | dynamic | pg-stage | riskmetric.page.js | styles/riskmetric.css | 12 | ✅ |
| SnackBar | static | demo-layer | — | styles/snackbar.css | 12 | ✅ |
| Table | static | demo-dtable | table.page.js | styles/table.css | 12 | ✅ |
| TableCell | grouped | demo-tbl | table-cell.page.js | styles/table-cell.css | 12 | ✅ |
| TableFilter | dynamic | pg-stage | table-filter.page.js | styles/table-filter.css | 11 | ✅ |
| Tile | static | demo-tile-wrap | — | styles/tile.css | 12 | ✅ |

## Patterns (1)

| Страница | Конструктор | Демо | page.js | CSS | Секций | Статус |
|---|---|---|---|---|---|---|
| LocalComponents | — | — | — | — | 11 | ⬜ |

<!-- Примечания (дописывать руками при необходимости) -->
