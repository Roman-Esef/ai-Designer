---
component: Typography
title: "Типографика"
version: "1.001"
updated: "07.08.2026"
page: pages/foundations/Typography.html
css: styles/typography.css
status: curated
---

## Структура
Три семейства: SB Sans Display (заголовки, 300/400/600), Text (боди, 400/600), Screen (кнопки, 400). Letter-spacing = 0. Рамп задан font-шортхендами `--type-*`; есть утилити-классы `.ds-*`.

## Оптическая нормализация метрик Display (05.08.2026)
У SB Sans Display метрики несимметричны относительно визуального блока (cap-height ↔ descender): заголовок вставал на 4% em выше оптического центра строки. В его `@font-face` добавлены `ascent-override: 80%` и `descent-override: 29%` (все веса 300/400/600), совмещающие центр content-area с оптическим центром глифов.

Сумма ascent+descent сохранена — `line-height: normal` и высоты строк не изменились, двигается только положение глифов внутри строки. SB Sans Text и SB Sans Screen — с исходными метриками, их не менять без отдельного решения.

## Токены

**---------- Font faces ----------------------------------------------------**: 
**---------- Design tokens -------------------------------------------------**: 
**Font families**: `--font-display` `--font-text` `--font-screen` 
**Weights**: `--weight-light` `--weight-regular` `--weight-semibold` 
**Headings — SB Sans Display**: `--type-h1` `--type-h2` `--type-h3-strong` `--type-h3` `--type-h4-strong` `--type-h4` `--type-h5-strong` `--type-h5` `--type-h6-strong` `--type-h6` 
**Body — SB Sans Text**: `--type-body-xl` `--type-body-xl-strong` `--type-body-l` `--type-body-l-strong` `--type-body-m` `--type-body-m-strong` `--type-body-s` `--type-body-s-strong` `--type-body-xs` 
**Buttons — SB Sans Screen**: `--type-button-m` `--type-button-s` `--type-button-xs` 
**---------- Utility classes ----------------------------------------------**: 
