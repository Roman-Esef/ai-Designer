---
component: Illustrations
title: "Иллюстрации"
version: "1.004"
updated: "05.09.2026"
page: pages/foundations/Illustrations.html
runtime: scripts/ds-illustrations.js
css: styles/illustration.css
deps: [colors, radius, typography]
status: curated
---

# Иллюстрации — библиотека продуктовых иллюстраций

SVG-библиотека для NavTile, пустых состояний, ошибок и онбординга. Файлы лежат в `assets/illustrations/*.svg`, скрипт `scripts/ds-illustrations.js` подставляет SVG при загрузке и автоматически дорендерит новые слоты, добавленные в DOM позже (MutationObserver на `document.documentElement`) — без этого слоты, пересобранные динамически (конструкторы/тайквики) после первого рендера страницы, оставались пустыми (заглушка). Рендер также доступен напрямую через `window.DSIllustrations.render()`.tions.js` подставляет их в слоты `.illu[data-illu]` (fallback на штриховую заглушку, если имени нет в библиотеке).

> Корень компонента объявляет парное `[hidden] { display: none }`: браузерное правило имеет специфичность (0,0,0) и приходит из UA-стиля, а `display` компонента — (0,1,0) и перебивает его, из-за чего атрибут `hidden` молча перестаёт работать. Соглашение ДС от 05.09.2026, охраняется правилом B11 линтера.

## Слот
```
<span class="illu" data-illu="deals" aria-hidden="true"></span>
<script src="scripts/ds-illustrations.js"></script>
```
- Размер — width/height слота (дефолт 96×96); SVG внутри — `object-fit: contain` (не обрезается).
- Исходные пропорции тайловых файлов — 195×140, не 1:1.
- Всегда декоративна: `aria-hidden="true"`.
- Неизвестное имя (нет файла в assets/illustrations) → `img` удаляет себя по onerror → `.illu:empty` рисует штриховую заглушку с именем.
- Цвета SVG — собственная палитра, НЕ currentColor (в отличие от иконок).

## Библиотека — тайловые (195×140, 32 шт.)
`deals`, `booked-deals`, `calclate-fv`, `cash-flow`, `ckp-pipeline`, `clients`, `corporate-transactions`, `current-depo`, `dcm-pipeline`, `dcm-potentials`, `ecm-pipeline`, `empty-check`, `empty-folder`, `empty-loading`, `important-deals`, `important-leads`, `kpki-cal`, `mna-pipeline`, `payment-ib`, `pipeline`, `possible-deals`, `possible-leads`, `potentials-rd`, `qliksense-reports`, `registry`, `reports-1-c`, `reserve`, `rwa`, `sales-company`, `sales-projects`, `settings`, `tasks`.

## Библиотека — состояния (крупные, для полноэкранных ошибок, 4 шт.)
`error-page-not-found`, `error-page-not-found-light`, `error-page-unavailable`, `error-server-unavailable`.

## Фоновая иллюстрация
`background-illustration` (1066×777) — декоративный фон, используется через CSS `background-image` / `background-size: cover`, не через слот `.illu`.
