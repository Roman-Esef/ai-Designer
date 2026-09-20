---
component: Colors
title: "Цвета"
version: "1.003"
updated: "19.09.2026"
page: pages/foundations/Colors.html
css: styles/colors.css, styles/palette.css
status: curated
---

> Значения токенов — в styles/colors.css (базовые, 7 KB) и styles/palette.css (палитра, 10 KB). Ниже — имена, чтобы grep-ать точечно.

## Структура

Два слоя, два файла. Страница показывает их двумя вкладками.

| Слой | Файл | Что внутри |
|---|---|---|
| Базовые токены | `styles/colors.css` | 20 полных цветовых рамп из образцов: `--amber-500`, `--deep-orange-700`, `--swamp-A100`. Ступени 50…900 + A100/A200/A400/A700 (где есть) |
| Палитра | `styles/palette.css` | примитивы `--c-*` + семантика в 4 группах: Static (фоны/текст/бордеры/таблицы), Active (primary/secondary/tertiary интерактив), Situative (error/warning/success/info/link/disabled), Local (статусные рампы, rate-чипы, палитра графиков). Полупрозрачные — через color-mix |

**Связь между слоями ещё не проведена.** Семантика берёт значения из `--c-*`, прописанных
hex-ами, а не из базовых токенов. Целевая схема — `--primary: var(--emerald-500)`: правка
базового токена меняет все семантические, которые на него ссылаются. См. «Переход на
базовые токены».

Имена базовых токенов — как в образцах `Uploads/Colors/*.png`: `палитра-ступень`,
A-ступени **заглавной** буквой (`--swamp-A100`, не `--swamp-a100`; примитивы `--c-*` пишут
её строчной — не путать). Образец CGrey подписан токеном `sgrey-*`, записан как `--cgrey-*`.

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

## Токены палитры (styles/palette.css)

**Mono / Greys**: `--c-mgrey-50` `--c-mgrey-100` `--c-cgrey-50` `--c-cgrey-100` `--c-cgrey-200` `--c-cgrey-300` `--c-cgrey-500` `--c-cgrey-600` `--c-cgrey-700` `--c-cgrey-800` `--c-cgrey-900` 
**Swamp (cool grey-green)**: `--c-swamp-50` `--c-swamp-100` `--c-swamp-200` `--c-swamp-300` `--c-swamp-400` `--c-swamp-500` `--c-swamp-600` `--c-swamp-a100` `--c-swamp-a400` `--c-swamp-a700` 
**Emerald (brand teal)**: `--c-emerald-100` `--c-emerald-200` `--c-emerald-300` `--c-emerald-500` `--c-emerald-600` `--c-emerald-700` `--c-emerald-900` 
**Red**: `--c-red-200` `--c-red-300` `--c-red-400` `--c-red-700` `--c-red-a100` `--c-red-a200` `--c-red-a400` 
**Amber**: `--c-amber-50` `--c-amber-400` `--c-amber-600` `--c-amber-700` `--c-amber-800` `--c-amber-900` `--c-amber-a100` `--c-amber-a200` 
**Greens**: `--c-lightgreen-50` `--c-lightgreen-200` `--c-lightgreen-400` `--c-lightgreen-600` `--c-lightgreen-800` `--c-green-50` `--c-green-500` `--c-green-800` 
**Blues**: `--c-lightblue-50` `--c-lightblue-400` `--c-lightblue-500` `--c-lightblue-600` `--c-lightblue-800` `--c-lightblue-900` `--c-blue-200` 
**Purples**: `--c-deeppurple-50` `--c-deeppurple-200` `--c-deeppurple-400` `--c-deeppurple-900` 
**Orange**: `--c-orange-50` `--c-orange-200` 
**BG**: `--bg-popup` `--bg-tile` `--bg-mainmenu` `--bg-hint` `--bg-page` 
**Border**: `--border-primary` `--border-light` `--border-dark` 
**Text**: `--text-primary` `--text-secondary` `--text-inactive` `--text-primary` `--text-primary` `--text-on-dark` 
**BGTable**: `--bgtable` `--bgtable-row-hover` `--bgtable-row-focus` `--bgtable-row-focus-hover` `--bgtable-pinned` `--bgtable-pinned-hover` `--bgtable-pinned-focus` `--bgtable-accent` `--bgtable-accent-hover` `--bgtable-accent-focus` 
**Primary**: `--primary` `--primary-dark` `--primary-light` `--primary-bg` `--primary-bg-light` `--primary-bg-semitransparent` 
**Secondary**: `--secondary` `--secondary-dark` `--secondary-light` `--secondary-bg` `--secondary-bg-light` 
**Tertiary**: `--tertiary` `--tertiary-dark` `--tertiary-light` 
**Error**: `--error` `--error-dark` `--error-light` `--error-bg-light` `--error-bg` `--error-bg-dark` 
**Warning**: `--warning` `--warning-dark` `--warning-light` `--warning-bg` 
**Success**: `--success` `--success-dark` `--success-light` `--success-bg` 
**Info**: `--info` `--info-dark` `--info-light` `--info-bg` 
**Link**: `--link` `--link-dark` `--link-light` 
**Disabled**: `--disabled` `--disabled-bg` `--disabled-bg-semitransparent` `--disabled-border` 
**Status — base + opacity ramp (Dark / base / Mid 56% / MidLight 32% / Light 16%)**: `--st-green-dark` `--st-green` `--st-green-mid` `--st-green-midlight` `--st-green-light` `--st-lblue-dark` `--st-lblue` `--st-lblue-mid` `--st-lblue-midlight` `--st-lblue-light` `--st-orange-dark` `--st-orange` `--st-orange-mid` `--st-orange-midlight` `--st-orange-light` `--st-red-dark` `--st-red` `--st-red-mid` `--st-red-midlight` `--st-red-light` `--st-dpurple-dark` `--st-dpurple` `--st-dpurple-mid` `--st-dpurple-midlight` `--st-dpurple-light` `--st-grey-dark` `--st-grey` `--st-grey-mid` `--st-grey-midlight` `--st-grey-light` `--st-system-dark` `--st-system` `--st-system-mid` `--st-system-midlight` `--st-system-light` `--st-disabled-dark` `--st-disabled` `--st-disabled-mid` `--st-disabled-midlight` `--st-disabled-light` `--st-primary-dark` `--st-primary` `--st-primary-mid` `--st-primary-midlight` `--st-primary-light` 
**Rate**: `--rate-green` `--rate-light-green` `--rate-blue` `--rate-light-blue` `--rate-purple` `--rate-light-purple` `--rate-orange` `--rate-light-orange` 
**Chart**: `--chart-red` `--chart-orange` `--chart-yellow` `--chart-shiny-green` `--chart-pastel-green` `--chart-turquoise` `--chart-light-blue` `--chart-blue` `--chart-indigo` `--chart-purple` `--chart-pale-purple` `--chart-pink-purple` 

## Переход на базовые токены

Заготовка для следующей правки: семантика переводится с hex-ов `--c-*` на `var(--<базовый>)`,
после чего слой `--c-*` исчезает. Сверка сделана 19.09.2026, ничего ещё не менялось.

Из 64 примитивов `--c-*` **57 совпадают** с базовым токеном один в один и переводятся
механически (`--c-swamp-a100` → `--swamp-A100`, `--c-lightgreen-600` → `--light-green-600`).
Расходятся семь — каждый требует решения человека:

| `--c-*` | Сейчас | Базовый токен | В рампе | Кто использует |
|---|---|---|---|---|
| `--c-emerald-300` | `#58DCCC` | `--emerald-300` | `#82CDC6` | `--primary-light` |
| `--c-emerald-700` | `#007A6D` | `--emerald-700` | `#0A7D6D` | `--primary-dark`, `--link-dark` |
| `--c-emerald-900` | `#00635A` | `--emerald-900` | `#055143` | `--st-primary-dark` |
| `--c-amber-400` | `#FFE54C` | `--amber-400` | `#FFCA28` | `--warning-light` |
| `--c-amber-800` | `#C68400` | `--amber-800` | `#FF8F00` | `--warning-dark` |
| `--c-lightblue-600` | `#1E88E5` | `--light-blue-600` | `#039BE5` | `--info` |
| `--c-lightblue-800` | `#01579B` | `--light-blue-800` | `#0277BD` | `--info-dark` |

Два последних объясняются просто: `#1E88E5` — это `--blue-600`, а `#01579B` —
`--light-blue-900`. Семантика `--info*` собрана из двух синих рамп, и при переводе надо
решить, на какую она садится.

Два хвоста вне таблицы:
- `--bg-page: #F5F7F7` прописан hex-ом мимо `--c-*`; значение совпадает с `--swamp-A100`.
- 12 токенов `--chart-*` — hex без примитивов, эквивалентов в базовых рампах нет. Либо
  остаются собственной палитрой графиков, либо им нужны свои базовые токены.
