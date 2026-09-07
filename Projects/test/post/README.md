# Пилот: модульная структура экрана (папка + отдельные файлы модалок и таблиц)

Проверяем перенос файловой архитектуры разработчиков в макеты IBP DS:
отдельная папка страницы, внутри — файл страницы и **отдельные файлы** модалок
и таблиц, которые «подгружаются» в страницу.

## Почему так

У разработчиков каждый экран на TypeScript: страница `import`-ит модалки и
таблицы. У нас ванильный HTML без сборщика, поэтому аналог `import` — маленький
**ассемблер**, который вшивает фрагменты в самодостаточный `index.preview.html`
(его открывают двойным кликом — `fetch` по `file://` не работает, поэтому
рантайм-инклуд `<ds-include>` из `ds-include.js` здесь не годится).

Агент, переводящий макет в код, мапит наши файлы один к одному на свои:
`tables/DealsTable.html` → `tables/DealsTable.tsx`, `modals/EditDeal.html` →
`modals/EditDeal.tsx`.

## Состав

```
Projects/test/post/
├── index.html              ← источник: каркас страницы + метки <ds-include src="…">
├── index.preview.html      ← СОБРАННЫЙ экран (генерируется), открывать двойным кликом
├── post.screen.md          ← спека экрана для агента-разработчика
├── assemble.mjs            ← ассемблер: index.html + фрагменты → index.preview.html
├── verify.mjs              ← самопроверка собранного файла
├── tables/
│   └── DealsTable.html     ← фрагмент таблицы (реестр)
└── modals/
    ├── Filter.html         ← модалка фильтра .tfm  (#filter-scrim)
    ├── EditDeal.html       ← форма сделки .modal--w6 (#deal-form-scrim)
    └── DeleteConfirm.html  ← подтверждение .modal--w3 (#delete-scrim)
```

## Правила фрагментов

- Фрагмент — **чистый кусок разметки с одним корневым элементом**: без
  `<html>/<head>/<link>/<script>`. Стили даёт единственный `ds.css` страницы.
- `id` скримов/полей уникальны в пределах всего экрана (проверяет `verify.mjs`).
- Собственные классы раскладки фрагментов (например `.frm-grid` у формы)
  объявляются в `<style>` страницы `index.html` — только grid/flex/gap на токенах.
- Модалки вшиваются в конец `body` (до `ds.js`) — рантайм видит скримы при загрузке.

## Команды

```bash
# собрать (index.html + фрагменты → index.preview.html)
node Projects/test/post/assemble.mjs

# проверить собранный файл (метки, id, узлы фрагментов, подключения)
node Projects/test/post/verify.mjs

# статический сенсор раскладки (из корня aiDesigner)
node .opencode/skills/screen-review/tooling/layout-check.mjs Projects/test/post/index.preview.html
```

После правки любого фрагмента или `index.html` — пересобрать (`assemble.mjs`),
затем `verify.mjs`. `index.preview.html` не правится руками.

## Статус

Пилот в `Projects/test/` — основные файлы (`Projects/post/operations-did/`,
`DS-IBP/`, скиллы `.opencode/`) не тронуты. По итогам приёмки решаем, как
переносить структуру в `Projects/post` и обновлять скиллы сборки.
