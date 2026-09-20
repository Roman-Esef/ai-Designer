---
component: Colors
title: "Цвета"
version: "1.004"
updated: "20.09.2026"
page: pages/foundations/Colors.html
css: styles/colors.css, styles/palette.css
status: curated
---

> Значения — только в styles/colors.css (базовые токены). styles/palette.css держит семантику и состоит из ссылок на них. Ниже — имена и карта связи, чтобы grep-ать точечно.

## Структура

Два слоя, два файла.

| Слой | Файл | Что внутри |
|---|---|---|
| Базовые токены | `styles/colors.css` | 20 полных цветовых рамп из образцов: `--amber-500`, `--deep-orange-700`, `--swamp-A100`. Ступени 50…900 + A100/A200/A400/A700 (где есть). **Единственное место в ДС, где встречается hex** |
| Семантика | `styles/palette.css` | 119 токенов в 5 группах: Static, Active, Situative, Status, Chart. Значение — всегда `var(--<базовый>)` или `color-mix()` поверх него |

**Правило слоя.** В `palette.css` не бывает hex: правка базового токена обязана менять все
семантические, которые на него ссылаются, — ради этого слой и разведён. Исключение одно —
группа **Chart**: в спеке у всех двенадцати её строк колонка базового токена пустая, это
собственная палитра графиков, а не рампа общего назначения.

**В экранах и компонентах применяется семантика, а не базовые токены.** Цвет выбирается по
назначению: `var(--text-primary)`, а не `var(--cgrey-600)`. Базовый токен в разметке экрана —
это захардкоженный цвет с лишним шагом.

Имена базовых токенов — как в образцах `Uploads/Colors/*.png`: `палитра-ступень`,
A-ступени **заглавной** буквой (`--swamp-A100`). Образец CGrey подписан токеном `sgrey-*`,
записан как `--cgrey-*`. Имена семантических — из `Uploads/DS _ Swap _ Palette`.

## Базовые токены (styles/colors.css)

**Amber**: `--amber-50` `--amber-100` `--amber-200` `--amber-300` `--amber-400` `--amber-500` `--amber-600` `--amber-700` `--amber-800` `--amber-900` `--amber-A100` `--amber-A200` `--amber-A400` `--amber-A700` 
**Blue**: `--blue-50` `--blue-100` `--blue-200` `--blue-300` `--blue-400` `--blue-500` `--blue-600` `--blue-700` `--blue-800` `--blue-900` `--blue-A100` `--blue-A200` `--blue-A400` `--blue-A700` 
**Brown**: `--brown-50` `--brown-100` `--brown-200` `--brown-300` `--brown-400` `--brown-500` `--brown-600` `--brown-700` `--brown-800` `--brown-900` 
**CGrey**: `--cgrey-50` `--cgrey-100` `--cgrey-200` `--cgrey-300` `--cgrey-400` `--cgrey-500` `--cgrey-600` `--cgrey-700` `--cgrey-800` `--cgrey-900` 
**Cyan**: `--cyan-50` `--cyan-100` `--cyan-200` `--cyan-300` `--cyan-400` `--cyan-500` `--cyan-600` `--cyan-700` `--cyan-800` `--cyan-900` `--cyan-A100` `--cyan-A200` `--cyan-A400` `--cyan-A700` 
**DeepOrange**: `--deep-orange-50` `--deep-orange-100` `--deep-orange-200` `--deep-orange-300` `--deep-orange-400` `--deep-orange-500` `--deep-orange-600` `--deep-orange-700` `--deep-orange-800` `--deep-orange-900` `--deep-orange-A100` `--deep-orange-A200` `--deep-orange-A400` `--deep-orange-A700` 
**DeepPurple**: `--deep-purple-50` `--deep-purple-100` `--deep-purple-200` `--deep-purple-300` `--deep-purple-400` `--deep-purple-500` `--deep-purple-600` `--deep-purple-700` `--deep-purple-800` `--deep-purple-900` `--deep-purple-A100` `--deep-purple-A200` `--deep-purple-A400` `--deep-purple-A700` 
**Emerald**: `--emerald-50` `--emerald-100` `--emerald-200` `--emerald-300` `--emerald-400` `--emerald-500` `--emerald-600` `--emerald-700` `--emerald-800` `--emerald-900` `--emerald-A100` `--emerald-A200` `--emerald-A400` `--emerald-A700` 
**Green**: `--green-50` `--green-100` `--green-200` `--green-300` `--green-400` `--green-500` `--green-600` `--green-700` `--green-800` `--green-900` `--green-A100` `--green-A200` `--green-A400` `--green-A700` 
**Indigo**: `--indigo-50` `--indigo-100` `--indigo-200` `--indigo-300` `--indigo-400` `--indigo-500` `--indigo-600` `--indigo-700` `--indigo-800` `--indigo-900` `--indigo-A100` `--indigo-A200` `--indigo-A400` `--indigo-A700` 
**LightBlue**: `--light-blue-50` `--light-blue-100` `--light-blue-200` `--light-blue-300` `--light-blue-400` `--light-blue-500` `--light-blue-600` `--light-blue-700` `--light-blue-800` `--light-blue-900` `--light-blue-A100` `--light-blue-A200` `--light-blue-A400` `--light-blue-A700` 
**LightGreen**: `--light-green-50` `--light-green-100` `--light-green-200` `--light-green-300` `--light-green-400` `--light-green-500` `--light-green-600` `--light-green-700` `--light-green-800` `--light-green-900` `--light-green-A100` `--light-green-A200` `--light-green-A400` `--light-green-A700` 
**Lime**: `--lime-50` `--lime-100` `--lime-200` `--lime-300` `--lime-400` `--lime-500` `--lime-600` `--lime-700` `--lime-800` `--lime-900` `--lime-A100` `--lime-A200` `--lime-A400` `--lime-A700` 
**MGrey**: `--mgrey-50` `--mgrey-100` `--mgrey-200` `--mgrey-300` `--mgrey-400` `--mgrey-500` `--mgrey-600` `--mgrey-700` `--mgrey-800` `--mgrey-900` 
**Orange**: `--orange-50` `--orange-100` `--orange-200` `--orange-300` `--orange-400` `--orange-500` `--orange-600` `--orange-700` `--orange-800` `--orange-900` `--orange-A100` `--orange-A200` `--orange-A400` `--orange-A700` 
**Pink**: `--pink-50` `--pink-100` `--pink-200` `--pink-300` `--pink-400` `--pink-500` `--pink-600` `--pink-700` `--pink-800` `--pink-900` `--pink-A100` `--pink-A200` `--pink-A400` `--pink-A700` 
**Purple**: `--purple-50` `--purple-100` `--purple-200` `--purple-300` `--purple-400` `--purple-500` `--purple-600` `--purple-700` `--purple-800` `--purple-900` `--purple-A100` `--purple-A200` `--purple-A400` `--purple-A700` 
**Red**: `--red-50` `--red-100` `--red-200` `--red-300` `--red-400` `--red-500` `--red-600` `--red-700` `--red-800` `--red-900` `--red-A100` `--red-A200` `--red-A400` `--red-A700` 
**Swamp**: `--swamp-50` `--swamp-100` `--swamp-200` `--swamp-300` `--swamp-400` `--swamp-500` `--swamp-600` `--swamp-A100` `--swamp-A200` `--swamp-A400` `--swamp-A700` 
**Yellow**: `--yellow-50` `--yellow-100` `--yellow-200` `--yellow-300` `--yellow-400` `--yellow-500` `--yellow-600` `--yellow-700` `--yellow-800` `--yellow-900` `--yellow-A100` `--yellow-A200` `--yellow-A400` `--yellow-A700` 

## Карта: семантика → базовые (styles/palette.css)

### Static

**BG**  
`--bg-popup` → `--mgrey-50`  
`--bg-tile` → `--mgrey-50`  
`--bg-main-menu` → `--mgrey-100`  
`--bg-hint` → `--cgrey-800`  
`--bg-page` → `--swamp-A100`  
**BGTable**  
`--bg-table-default` → `--mgrey-50`  
`--bg-table-default-hover` → `--swamp-A400`  
`--bg-table-default-focus` → `--swamp-A700`  
`--bg-table-accent` → `--amber-50`  
`--bg-table-accent-hover` → `--amber-A100`  
`--bg-table-accent-focus` → `--amber-A200`  
`--bg-table-pinned` → `--swamp-A100`  
`--bg-table-pinned-hover` → `--swamp-50`  
`--bg-table-pinned-focus` → `--swamp-A700`  
**Border**  
`--border-primary` → `--swamp-300`  
`--border-light` → `--swamp-200`  
`--border-dark` → `--swamp-600`  
`--disabled-border` → `--cgrey-100`  
**Text**  
`--text-primary` → `--cgrey-600`  
`--text-secondary` → `--cgrey-500`  
`--text-inactive` → `--cgrey-300`  
`--text-on-dark` → `--mgrey-50`  

### Active

**Primary**  
`--primary` → `--emerald-500`  
`--primary-dark` → `--emerald-700`  
`--primary-light` → `--emerald-300`  
`--primary-bg` → `--emerald-500` 8%  
`--primary-bg-light` → `--emerald-500` 4%  
`--primary-bg-semy-transparent` → `--mgrey-50` 50%  
**Secondary**  
`--secondary` → `--emerald-200`  
`--secondary-dark` → `--emerald-600`  
`--secondary-light` → `--emerald-100`  
`--secondary-bg` → `--emerald-200` 32%  
`--secondary-bg-light` → `--emerald-200` 16%  
**Tertiary**  
`--tertiary` → `--swamp-100`  
`--tertiary-dark` → `--swamp-400`  
`--tertiary-light` → `--swamp-50`  
`--tertiary-bg` → `--swamp-500` 8%  
`--tertiary-bg-light` → `--swamp-500` 4%  

### Situative

**Error**  
`--error` → `--red-300`  
`--error-light` → `--red-200`  
`--error-dark` → `--red-700`  
`--error-bg` → `--red-A200`  
`--error-bg-light` → `--red-A100`  
`--error-bg-dark` → `--red-A400`  
**Warning**  
`--warning` → `--amber-600`  
`--warning-light` → `--amber-400`  
`--warning-dark` → `--amber-800`  
`--warning-bg` → `--amber-50`  
**Success**  
`--success` → `--light-green-600`  
`--success-light` → `--light-green-400`  
`--success-dark` → `--light-green-800`  
`--success-bg` → `--light-green-50`  
**Info**  
`--info` → `--light-blue-600`  
`--info-light` → `--light-blue-400`  
`--info-dark` → `--light-blue-900`  
`--info-bg` → `--light-blue-50`  
**Link**  
`--link` → `--emerald-500`  
`--link-light` → `--emerald-300`  
`--link-dark` → `--emerald-700`  
**Disabled**  
`--disabled` → `--cgrey-200`  
`--disabled-bg` → `--cgrey-50`  
`--disabled-bg-semy-transparent` → `--mgrey-50` 56%  

### Status

**Green**  
`--st-green-dark` → `--green-800`  
`--st-green` → `--green-500`  
`--st-green-mid` → `--green-500` 56%  
`--st-green-midlight` → `--green-500` 32%  
`--st-green-light` → `--green-500` 16%  
**Blue**  
`--st-blue-dark` → `--light-blue-900`  
`--st-blue` → `--light-blue-500`  
`--st-blue-mid` → `--light-blue-500` 56%  
`--st-blue-midlight` → `--light-blue-500` 32%  
`--st-blue-light` → `--light-blue-500` 16%  
**Orange**  
`--st-orange-dark` → `--amber-900`  
`--st-orange` → `--amber-700`  
`--st-orange-mid` → `--amber-700` 56%  
`--st-orange-midlight` → `--amber-700` 32%  
`--st-orange-light` → `--amber-700` 16%  
**Red**  
`--st-red-dark` → `--red-700`  
`--st-red` → `--red-400`  
`--st-red-mid` → `--red-400` 56%  
`--st-red-midlight` → `--red-400` 32%  
`--st-red-light` → `--red-400` 16%  
**Purple**  
`--st-dpurple-dark` → `--deep-purple-900`  
`--st-dpurple` → `--deep-purple-400`  
`--st-dpurple-mid` → `--deep-purple-400` 56%  
`--st-dpurple-midlight` → `--deep-purple-400` 32%  
`--st-dpurple-light` → `--deep-purple-400` 16%  
**Grey**  
`--st-grey-dark` → `--cgrey-900`  
`--st-grey` → `--cgrey-700`  
`--st-grey-mid` → `--cgrey-700` 56%  
`--st-grey-midlight` → `--cgrey-700` 32%  
`--st-grey-light` → `--cgrey-700` 16%  
**System**  
`--st-system-dark` → `--cgrey-600`  
`--st-system` → `--swamp-400`  
`--st-system-mid` → `--swamp-400` 56%  
`--st-system-midlight` → `--swamp-400` 32%  
`--st-system-light` → `--swamp-400` 16%  
**Disabled**  
`--st-disabled-dark` → `--cgrey-600` 40%  
`--st-disabled` → `--cgrey-600` 24%  
`--st-disabled-mid` → `--cgrey-600` 16%  
`--st-disabled-midlight` → `--cgrey-600` 8%  
`--st-disabled-light` → `--cgrey-600` 4%  
**Primary**  
`--st-primary-dark` → `--emerald-900`  
`--st-primary` → `--emerald-500`  
`--st-primary-mid` → `--emerald-500` 56%  
`--st-primary-midlight` → `--emerald-500` 32%  
`--st-primary-light` → `--emerald-500` 16%  

### Chart

`--ch-red` → #F99290 (без базового токена)  
`--ch-orange` → #F9A580 (без базового токена)  
`--ch-yellow` → #FFD081 (без базового токена)  
`--ch-shiny-green` → #8CCB5E (без базового токена)  
`--ch-pastel-green` → #76E385 (без базового токена)  
`--ch-turquoise` → #31D4A8 (без базового токена)  
`--ch-light-blue` → #7DCAFA (без базового токена)  
`--ch-blue` → #5B9CFA (без базового токена)  
`--ch-indigo` → #8D87F9 (без базового токена)  
`--ch-purple` → #CB88F8 (без базового токена)  
`--ch-pale-purple` → #F58BD8 (без базового токена)  
`--ch-pink-purple` → #EC7390 (без базового токена)  

## История значений

При переводе семантики на базовые токены (20.09.2026) изменился цвет восьми токенов и
прозрачность пяти — это следствие того, что актуальные рампы отличаются от старых
примитивов `--c-*`, а спека уточнила проценты.

| Токен | Было | Стало | Базовый |
|---|---|---|---|
| `--primary-light` | `#58DCCC` | `#82CDC6` | `--emerald-300` |
| `--primary-dark` | `#007A6D` | `#0A7D6D` | `--emerald-700` |
| `--link-dark` | `#007A6D` | `#0A7D6D` | `--emerald-700` |
| `--link-light` | `#B8D6D3` | `#82CDC6` | `--emerald-300` |
| `--st-primary-dark` | `#00635A` | `#055143` | `--emerald-900` |
| `--warning-light` | `#FFE54C` | `#FFCA28` | `--amber-400` |
| `--warning-dark` | `#C68400` | `#FF8F00` | `--amber-800` |
| `--info` | `#1E88E5` | `#039BE5` | `--light-blue-600` |
| `--primary-bg` | 6% | 8% | `--emerald-500` |
| `--primary-bg-light` | 3% | 4% | `--emerald-500` |
| `--secondary-bg` | 30% | 32% | `--emerald-200` |
| `--secondary-bg-light` | 15% | 16% | `--emerald-200` |
| `--disabled-bg-semy-transparent` | 50% | 56% | `--mgrey-50` |

Тогда же переименованы `--bgtable*` → `--bg-table-*`, `--chart-*` → `--ch-*`,
`--st-lblue-*` → `--st-blue-*`, `--bg-mainmenu` → `--bg-main-menu`,
`*-semitransparent` → `*-semy-transparent`; удалены `--bgtable-row-focus-hover` и группа
`--rate-*` (в актуальной спеке их нет); добавлены `--tertiary-bg` и `--tertiary-bg-light`.
