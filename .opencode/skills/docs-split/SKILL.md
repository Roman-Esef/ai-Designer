---
belongs_to: docs-split
purpose: Раскатка страниц документации IBP (DS-IBP/pages/**) на паттерн «сплиттер + табы» (docs-split) — процедура, тулчейн, правила чтения
checked: "30.08.2026 — пилот AllocationBar2, тулчейн check/inject/verify/map работает"
---

# Раскатка `DS-IBP/pages/**` на docs-split

## Когда применять

Поручение касается страниц документации (`DS-IBP/pages/foundations|atoms|molecules|organisms/**`).
Сценарий ведёт `ai-designer` сам (страницы документации не собираются через
`screen-builder` и не имеют `.screen.md`). Приёмку делает `screen-reviewer`.

Правила паттерна — раздел 11 `ds-rules.md`. Общий слой —
`DS-IBP/styles/docs-split.css` + `DS-IBP/scripts/docs-split.js` (не трогать).

## Правила чтения (экономия контекста)

1. **Карта вместо файла.** Сначала читай
   `references/pages-index.md` (генерируется `map`): тип конструктора,
   демо-хост, page.js, css-маппинг, статус. Целевую страницу целиком **не читай**.
2. **Точечное чтение.** Целевая страница читается `grep`-ом по якорям +
   `read` с `offset/limit` на: head (`<link>`), `<style>` (playground-правила),
   секцию конструктора, футер, хвост скриптов. **Docs-секции (Usage…Backlog)
   не читаются** — при раскатке они проходят насквозь.
3. **CSS не читать и не перепечатывать.** Вкладку «Код» заполняет
   `node …docs-split.mjs inject <page>`, который вставляет полный
   `DS-IBP/styles/<компонент>.css` в `src-code-css` из файла. Модель CSS не видит.
4. **Эталон — `references/skeleton.md`**, не Entity.html и не другие готовые
   страницы (их не перечитывать).

## Тулчейн

```
node .opencode/skills/docs-split/tooling/docs-split.mjs <cmd> [page] [--css DS-IBP/styles/x.css]
```

| Команда | Что делает |
|---|---|
| `map` | перегенерирует `references/pages-index.md` (структурная карта всех doc-страниц) |
| `inject <page>` | вставляет полный CSS компонента в `src-code-css` (маппинг имя→css из `DS-IBP/specs/_index.md`; для страниц без спеки — `--css`) |
| `check <page>` | баланс тегов (вне `<script>`), остатки `ds-toc.js`/`pg-kit.js`/`ds-toc.css`, `.splitpane--app`, один `</body></html>`, 3 `src-code`, panes. Код выхода 1 при FAIL |
| `verify <page>` | temp-копия в ту же папку + харнесс + headless Chrome `--dump-dom` → компактная диагностика + автоассерты (main.ds-split, TOC, код). Копия удаляется |

## Шаги раскатки (по странице)

1. `map` — сверить статус/тип конструктора.
2. Ручная структура (следую `skeleton.md`):
   - head: `ds-toc.css` → `splitter.css` + `segment-control.css` + `tab.css` + `docs-split.css`;
   - `<style>`: playground `.panel.pg` → демо-стадия на `flex:1`; убрать
     `#pg-controls` grid-правила (их место занимает docs-split.css);
   - `main.page` → `main.page.ds-split` + обёртка `splitpane--h[data-splitter]`:
     панель A — демо, `.spl--h`, панель B — `.tabs[data-tabs]` + `.tabs-body` + три `.tabpane`;
   - секцию «Конструктор» из документации убрать (демо — наверх, контролы — во вкладку);
   - после футера: закрыть `docs-main` + `nav#docs-toc` + panes конструктора и кода;
   - скрипты: `ds-toc.js`/`pg-kit.js` → `ds-splitter.js` + `ds-tabs.js` + `docs-split.js`
     (после `page.js`); `pg-kit.css` остаётся;
   - динамический конструктор: `<div class="pg__controls" id="pg-controls"></div>`
     пустой — `docs-split.js` сам разложит по колонкам (бинарные селекты → свитчи);
     при бинарных селектах — словарь `DS_SPLIT_SWITCH_LABELS` перед `docs-split.js`:
     статичная строка (`'Тултип': 'Показывать тултип'`) или `{ label, on? }`
     (для выборов вида [y, none], где эвристика направления врёт);
     **подпись свитча статична** — не меняется от положения (правило Switch);
   - статический: сразу `.ctl-col`/`.toggles` (и `.ctl-group` при группах);
   - вкладка «Код»: `src-code-html` (эталон из спеки) + пустой
     `<script type="text/plain" id="src-code-css"></script>` + `src-code-js`
     (выжимка API из page.js) + `segctrl[data-segctrl]` + три `code-view`.
3. `inject <page>` — вставить CSS (если нужен `--css`, укажи).
4. `check <page>` — должен дать ВЕРДИКТ: OK.
5. `verify <page>` — зелёные автоассерты; глазами — табы, TOC≥11, две колонки
   конструктора, демо живо, код заполнен.
6. Приёмка `screen-reviewer` — со скопом из карты, не «прочитай страницу целиком».

## Границы

- `DS-IBP/styles/`, `DS-IBP/scripts/`, `DS-IBP/specs/`, `DS-IBP/pages/**` (кроме раскатываемой страницы) —
  не трогать. Тулчейн — рабочий инструмент opencode, живёт под `.opencode/`.
- Один `</body></html>` в конце файла; перед инлайн-скриптами страницы дубликатов
  не создавать (урок Entity).
- Предсуществующую битую разметку (лишние `</div>`/`</section>`) при встрече —
  чинить (пример: redline-таблица Tile, лишний `</section>` Modal).
