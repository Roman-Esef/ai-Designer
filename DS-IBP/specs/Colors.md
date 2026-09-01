---
component: Colors
title: "Цвета"
version: "1.002"
updated: "29.07.2026"
page: pages/foundations/Colors.html
css: styles/colors.css
status: curated
---

> Значения токенов — в styles/colors.css (10 KB). Ниже — имена, чтобы grep-ать точечно.

## Структура
Примитивы `--c-*` + семантика в 4 группах: Static (фоны/текст/бордеры/таблицы), Active (primary/secondary/tertiary интерактив), Situative (error/warning/success/info/link/disabled), Local (статусные рампы, rate-чипы, палитра графиков). Полупрозрачные — через color-mix.

## Токены

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
