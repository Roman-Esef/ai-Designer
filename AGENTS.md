---
type: rules
title: Правила проекта для opencode
scope: корневой файл правил; наличие AGENTS.md отключает подхват CLAUDE.md
updated: "01.09.2026"
---

# IBP — правила для opencode

Этот файл читает **opencode** из корня воркспейса `aiDesigner`. Он намеренно
короткий: подробные правила вынесены в `.opencode/rules/ds-rules.md`
(подключается через `instructions` в `opencode.json`).

Наличие `AGENTS.md` отключает подхват `CLAUDE.md` — это сделано специально:
`CLAUDE.md` написан под другой инструментарий (свои названия инструментов,
`run_script`, `ready_for_verification`) и в opencode вводит модель в заблуждение.
`CLAUDE.md` остаётся источником истины для Claude Code, `AGENTS.md` +
`.opencode/rules/ds-rules.md` — для opencode.

## Структура воркспейса

```
aiDesigner/
├── .opencode/          ← агенты, скиллы, команды, правила (этот файл рядом)
├── DS-IBP/             ← дизайн-система: токены styles/, спеки specs/, страницы pages/
├── Projects/
│   ├── post/           ← проект направления Post (локальные компоненты — в components/)
│   └── test/           ← сюда кладутся экраны, собранные агентом
```

## Что это за репозиторий

Дизайн-система IBP: **ванильный HTML/CSS, без React**. Источник истины — токены
в `DS-IBP/styles/*.css`, классы компонентов и страницы документации в
`DS-IBP/pages/`.

## Главное правило

Ничего не выдумывать. Цвет, размер, отступ, радиус, шрифт, класс, имя иконки —
только из дизайн-системы. Нет нужного — спросить, а не изобрести.

## Агенты

Ведущий агент — **`ai-designer`** (единственный, который выбирается вручную).
Он говорит с пользователем и распределяет работу по субагентам:
`ux-researcher` (база знаний продукта), `screen-builder` (сборка экрана),
`screen-reviewer` (приёмка). Субагентов вручную не выбирают.

Команды: `/screen` — собрать экран, `/research` — сначала исследование,
`/screen-check` — приёмка готового.

Результат сборки — `Projects/test/<Имя>.html` +
`Projects/test/<Имя>.screen.md`.

## Макет живой

Экран подключает `../../DS-IBP/scripts/ds.js` — все рантаймы ДС работают, если в
разметке стоят их хуки (`data-table`, `data-modal`, `data-tabs`, `data-popover`,
`data-riskmetric` и т.д.). Свой JavaScript вместо рантайма ДС не пишется.
Таблица хуков — `.opencode/skills/screen-assembly/references/runtime-hooks.md`.
