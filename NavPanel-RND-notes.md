---
type: temporary-notes
purpose: Подсказки для раскатки варианта «Вложенные разделы» NavPanel (бэклог) — чтобы в новом чате ничего не потерять. ВРЕМЕННЫЙ ФАЙЛ: удалить после раскатки выбранного варианта в компонент.
created: "01.09.2026"
---

# NavPanel — вложенные разделы: подсказки для раскатки (удалить после раскатки)

## 1. Контекст

- Задача бэклога: **«Вложенные разделы — раскрывающийся под-список у пункта (аккордеон) для разделов с подстраницами»**.
- В разделе **RND** страницы `DS-IBP/pages/organisms/NavPanel.html` сделано ДВА интерактивных варианта на пункте **«Обязательные сделки»** (первый пункт блока Origination, иконка `Important-deals`). Пользователь выберет один в новом чате.
- Где живёт код (только страница, компонент НЕ тронут):
  - `DS-IBP/scripts/nav-panel.page.js` → функции RND: `RND_PARENT`, `rndSubItem`, `rndMenuItem`, `rndParentHTML`, `buildNestedNav`, `rndFrame`, `buildFlyoutMenu`, `bindFlyout`, `bindRndNav`, `initRnd` (вызов в `ready()`); рефактор: `topHTML`/`footerHTML` вынесены из `buildNav` и переиспользуются.
  - `DS-IBP/pages/organisms/NavPanel.html` → секция `<section class="section" data-screen-label="Rnd">` (между «Для разработчиков» и «Бэклог») + RND-стили в `<style>` (классы `.rnd*`, `.nav__caret`, `.nav__sub`, `.nav__item--acc/--fly`); подключён `context-menu.css`; `ds-menu.js` НЕ подключён (не нужен).

## 2. Общее для обоих вариантов

- **Родитель** — «Обязательные сделки»: `RND_PARENT = { icon: 'Important-deals', label: 'Обязательные сделки', selected: true }` (состояние — данными, как в `itemHTML`).
- **Разметка родителя** — тот же `<a class="nav__item …">`, что и обычные пункты (НЕ `button`! инцидент с `button.nav__item{background:none}`, перебивавшим `.nav__item--selected`):
  `<a href="#" class="nav__item [nav__item--selected] nav__item--parent <мод>" …><span class="nav__ico">…</span><span class="nav__label">Обязательные сделки</span><span class="nav__caret">…</span></a>`
- **Семантика выделения** (важно!):
  - Текущая страница — «Подстраница 2» → она несёт `nav__item--selected` + `aria-current="page"` (в меню флайаута — `menu__item--selected` + `aria-current="page"`).
  - Родитель — **`nav__item--selected` БЕЗ `aria-current`** (родитель — не текущая страница, а контейнер раздела; текущая определяется у подстраницы; именно для этого случая в спеке существует форс-класс `nav__item--selected`).
  - «Главная» в RND-демо НЕ выделена: `buildNestedNav` рендерит её через `itemHTML({ icon: HOME.icon, label: HOME.label }, opts)` (без `selected`). Глобальный `HOME.selected = true` НЕ трогать — он нужен `buildNav` (плейграунд/анатомия/варианты).
  - В rail подсвечен ТОЛЬКО родитель (под-список и каретка скрыты CSS), в развёрнутом — родитель + подстраница.
- **Бургер drawer ↔ rail** работает у обоих демо через штатный рантайм `DSNavPanel.bind(nav)` (функция `bindRndNav`). Старт — drawer.
- **Правила, уже записанные ПОСТОЯННО (НЕ удалять!):**
  - `.opencode/rules/ds-rules.md` §4 «Жёсткие запреты» → «Не переопределять состояния компонентов извне» (страничный CSS — только раскладка; без селекторов, перебивающих состояния по специфичности; состояние — данными).
  - `.opencode/skills/screen-assembly/SKILL.md` §12 → пункт про `button.<класс>`/`a.<класс>`/`input.<класс>` и сбросы background/display/color.
  - `.opencode/skills/screen-review/SKILL.md` → блокер **Б21** + grep-подсказка.
  - `.opencode/skills/screen-review/references/lessons-raw.md` → урок **Л23** (01.09.2026).

## 3. Вариант A — аккордеон (раскрытие в потоке списка)

- Модификатор родителя `.nav__item--acc`; каретка **`chevron-down`**, при `aria-expanded="true"` поворачивается на 180° (CSS: `.nav__item--acc[aria-expanded="true"] .nav__caret { transform: rotate(180deg); color: var(--text-secondary); }`).
- Родитель: `aria-expanded="true"` (раскрыт по умолчанию — результат виден сразу), `aria-controls="rnd-nested-sub"`.
- Под-список: `.nav__sub` (grid `grid-template-rows: 0fr → 1fr`, переход `.2s`) > `.nav__sub-in` (`overflow:hidden; min-height:0; display:flex; flex-direction:column; gap:2px`) > под-пункты.
- Под-пункты: `<a class="nav__item [nav__item--selected]" href="#" [aria-current="page"]><span class="nav__label">…</span></a>`, БЕЗ иконок, индент `.nav__sub .nav__item { padding-left: 48px }` (= 12 отступ + 24 иконка родителя + 12 зазор — под текст родителя). Пример: «Подстраница 1..4», «Подстраница 2» — текущая.
- JS (клик по родителю): `e.preventDefault()`; если панель в rail (класс `nav--rail`) → `DSNavPanel.setMode(nav, 'drawer')` (в rail аккордеон скрыт, клик разворачивает панель); иначе — toggle `aria-expanded`.
- Rail: `.nav--rail .nav__caret { display:none }` и `.nav--rail .nav__sub { display:none }`.

## 4. Вариант B — флайаут (контекстное меню справа от панели)

- Модификатор родителя `.nav__item--fly`; каретка **`chevron-right`**, СТАТИЧНА (никакого поворота — правило `.nav__item--acc[…]` на неё не действует).
- Родитель: `aria-haspopup="menu" aria-expanded="false" aria-controls="rnd-flyout-1"`.
- Меню: `#rnd-flyout-1` → `<div class="menu menu--floating menu--scroll" role="menu" hidden>` с пунктами `.menu__item` (`role="menuitem"`), БЕЗ иконок; «Подстраница 2» — `menu__item--selected` + `aria-current="page"`. Сейчас 8 пунктов («Подстраница 1..8») — чтобы был виден собственный скролл.
- **`menu--scroll`** — наследуется из компонента ContextMenu (`context-menu.css`: `max-height: var(--menu-max-h, 280px); overflow-y:auto` + тонкий скроллбар). Странично НЕ дублировать.
- **Меню — прямой ребёнок `.rnd-stage`** (`dd.appendChild(flyMenu)`), НЕ внутри `.nav`/`.nav__list` — иначе `overflow:hidden` панели обрежет его. `.rnd-stage` имеет `position:relative` (и `display:flex; justify-content:center`).
- **Позиционирование** (`bindFlyout`, страничное — рантайм ds-menu умеет только `bottom|top`, правого placement НЕТ): `left = триггер.right − стадия.left + 8` (clamp `min(x, window.innerWidth − menu.offsetWidth − 8)`), `top = триггер.top − стадия.top`, `--menu-origin: left top`. `place()` только на открытие и на `resize`.
- **Закрытие**: клик вне (document click) / `Esc` / клик по пункту / событие `ds-nav-mode` (смена режима панели) / **скролл списка панели**.
- **Скролл панели**: `list = trigger.closest('.nav__list')`; при открытии фиксируется `openScrollTop = list.scrollTop`; на `scroll` списка — если `Math.abs(list.scrollTop − openScrollTop) > 60` (константа `SCROLL_CLOSE`) → `closeMenu(false)`. Порог 60px (диапазон 50–100 из ТЗ), случайный мелкий скролл меню не закрывает. **Никакого перепозиционирования по скроллу** (убран `window scroll → place`) — иначе меню уезжает за границу экрана. Внутренний скролл самого меню закрытие НЕ вызывает (слушатель висит на `.nav__list`, не на меню).
- **Rail**: клик по иконке родителя → меню открывается справа СРАЗУ, без разворота панели (работает в обоих режимах).
- **Наследование**: клавиатурная навигация стрелками в меню НЕ подключена (RND, только Esc/клик) — при раскатке решить, куда едет: расширить `ds-menu.js` (добавить `placement: 'right'` в `place()`) или сделать отдельный flyout-слой в `ds-nav-panel.js`. `menu--scroll` берётся из ContextMenu.

## 5. Чек-лист раскатки (когда вариант утверждён в новом чате)

1. Удалить раздел RND из `NavPanel.html` (секцию + все `.rnd*`/`.nav__caret`/`.nav__sub`/`.nav__item--acc/--fly` стили из `<style>`) и RND-функции из `nav-panel.page.js` (`initRnd` + хелперы; `topHTML`/`footerHTML` ОСТАВИТЬ — они переиспользуются `buildNav`).
2. Вписать выбранный вариант в компонент:
   - аккордеон → `styles/nav-panel.css` (`.nav__caret`, `.nav__sub`, индент, поворот, скрытие в rail) + рантайм `scripts/ds-nav-panel.js` (toggle/rail→drawer);
   - флайаут → `styles/nav-panel.css` (модификатор `--fly`, каретка) + рантайм (right-placement в `ds-menu.js` ИЛИ отдельный flyout-слой) + `menu--scroll` из ContextMenu.
3. Обновить `specs/NavPanel.md` (состояния родителя, rail-поведение, a11y, «Из коробки») и блок NavPanel в `specs/_cheatsheet.md`.
4. Убрать из бэклога пункт «Вложенные разделы» (или пометить реализованным).
5. Версия `1.009 → 1.010` (шапка страницы + YAML спеки + `specs/_index.md` — три реестра одним числом), дата «Обновлено», строка в `CHANGELOG.md`.
6. Проверки: `docs-split.mjs check DS-IBP/pages/organisms/NavPanel.html`, `node --check`, приёмка `screen-reviewer`.
7. **Удалить этот файл `NavPanel-RND-notes.md`**.
