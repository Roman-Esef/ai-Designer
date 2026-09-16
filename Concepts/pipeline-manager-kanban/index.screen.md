---
screen: HomePage
title: Главная (Pipeline Management)
file: Concepts/pipeline-manager-kanban/index.html
source: скриншот главной от дизайнера (16.09.2026) + тайл «Pipeline Management» (exports/image002.png)
version: "0.100"
created: "16.09.2026"
design_system: IBP DS
components: [Layout, NavPanel, Breadcrumbs, NavTile, Illustrations]
---

# Главная (Pipeline Management)

## 1. Назначение

Стартовая страница прототипа: точка входа в новый раздел «Pipeline Management».

## 2. Навигация

Меню: Главная (выбрана) · Origination · Pipeline (с новым пунктом «Pipeline
Management» первым пунктом → `PipelineManagement.html`) · Текущий портфель · Отчёты. Строка
пользователя ведёт на хаб.

## 3. Шапка страницы

Нет (правило стартовой страницы Layout). Крошка одна — «Главная».

## 4. Структура контента

Сетка `.grid12`, группы `.col-3 colw-6` (4 → 2 → 1), фон
`background-illustration`:

| Группа | Тайлы (NavTile) |
|---|---|
| Origination | Обязательные сделки · Возможные сделки · Лиды · Обязательные лиды · Возможные лиды |
| Pipeline | **Pipeline Management** (новый, первым) · Pipeline · Pipeline ЦКП · M&A Pipeline · Календарь КПКИ |
| Текущий портфель | Текущий портфель ДИД · CF СБИ · Корпоративные запросы |
| Отчёты | RWA |

## 5. Поведение

Рабочая ссылка только у «Pipeline Management»; остальные тайлы — `href="#"`.

## 6. Открытые вопросы и допущения

1. Иллюстрация тайла «Pipeline Management» — временно `ecm-pipeline` (своей в
   ДС нет).
2. Иллюстрация «Лиды» — `booked-deals` (ближайшая по смыслу), сверить с
   оригиналом.
3. Суммы в описаниях тайлов записаны кодом валюты («млн RUB») по правилу ДС
   вместо «млн руб.» со скриншота.
