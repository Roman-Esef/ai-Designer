---
component: NavPanel
title: "Панель навигации"
version: "1.011"
updated: "01.09.2026"
page: pages/organisms/NavPanel.html
page_js: scripts/nav-panel.page.js
runtime: scripts/ds-nav-panel.js
css: styles/nav-panel.css
deps: [icon-button, badge, avatar]
status: curated
---

> Спека для быстрого контекста. Источник истины — CSS-файл и страница компонента. При изменении компонента обновляй эту спеку и блок в specs/_cheatsheet.md.

## Назначение
NavPanel — главная навигация приложения в левой части каждой страницы: отображает все главные страницы продукта, сгруппированные по разделам, и подсвечивает текущую. Один компонент, три режима: свёрнутый **Rail** (только иконки, без тени, подпись — тултипом по hover), развёрнутый-оверлей **Drawer** (подписи, тень Shadow4.0_modalform) и закреплённый **Fixed** (тени нет, шов справа, контент ужимается под ширину панели).

## Инварианты
- Три режима (rail/drawer/fixed) — один компонент, не три разных; переключение — сменой класса `.nav--*`, разметка пунктов не меняется.
- В Rail подпись пункта скрыта и появляется только тултипом по hover/focus — не показывается статично.
- Вертикальная ось пунктов/бургера/аватара — фиксированные 28px от левого края во всех режимах; менять по отдельности нельзя.
- Rail и Drawer/Fixed — взаимоисключающие по ширине (56px vs 272px), промежуточной ширины нет.

## Диагностика
- «В Rail подпись пункта видна постоянно» → должна быть скрыта, появляться только тултипом на hover/focus
- «Иконки/бургер/аватар не на одной вертикальной линии» → все три должны считаться от общей оси 28px, не выравниваться по отдельности
- «Drawer сдвигает контент экрана вместо оверлея» / «Панель обрезается или скроллится со страницей» → хост-контракт ниже не выполнен

## Хост-контракт (интеграция на экране)
Обёртка `.nav-layout` (сам компонент, `styles/nav-panel.css`) — работает из коробки, экран ничего не пишет сам:
```html
<div class="nav-layout"><nav class="nav nav--rail" aria-label="Главное меню">…</nav><main>…контент экрана…</main></div>
```
`.nav` внутри неё всегда `position:fixed; top:0; left:0; height:100vh` — растянута на весь вьюпорт, не скроллится со страницей и не участвует в потоке. Контент (`.nav-layout > *:not(.nav)`) резервирует отступ слева = ширине Rail (56px) и в Rail, и в Drawer (Drawer — оверлей поверх этого отступа, не раздвигает контент); отступ увеличивается до ширины Fixed (272px) только когда `.nav` в режиме `nav--fixed` — это чистый CSS (`:has()`), без JS на экране.

## Ключевые правила (из разделов страницы)
- **Использование** — Основная навигация по разделам всего приложения, когда разделов много и они делятся на смысловые блоки; сюда же профиль и выход.
- **Анатомия** — Сверху шапка: Burger (глиф left-menu; + Pin в Drawer/Fixed). Ниже прокручиваемый список: пункт «Главная», затем navigation-block'и (заголовок-секция + пункты Navigation_Item). Внизу закреплён Footer: строка пользователя (Avatar + ФИО/должность/организация) — **ссылка на личный кабинет** (клик по всей строке, hover фоном по всей полосе) + справа IconButton выхода. **Burger, Pin и выход — строго `ibtn--m`**: вертикальная ось панели (28px от левого края во всех режимах) рассчитана в `styles/nav-panel.css` именно от него (`top 18 + 10 = 28`); `ibtn--s` ломает выравнивание бургера с иконками пунктов и аватаром (расхождение чит-шита и спеки, исправлено 26.08.2026).
- **Варианты · Режимы** — Rail (56px, иконки, тултип, без тени) · Drawer (272px, оверлей, тень Shadow4.0_modalform) · Fixed (272px, закреплён, шов 1px справа, тени нет).
- **Варианты · Элементы** — Burger, Menu Item, Menu Item + Badge, Footer, Divider — каждый в двух обликах (Rail / Drawer).
- **Размеры** — Ширина Rail 56px, Drawer/Fixed 272px. Пункт: высота 44px во всех режимах, в Rail — квадрат 44×44. Иконка 24×24. Высота шапки 56px. Badge — XS (20px). Единая вертикальная ось иконок — 28px от левого края панели в любом режиме (список: боковой отступ 4px + отступ пункта 12px; шапка 18px слева под ibtn--m; футер 12px под аватар 32). Значения измеряются на живом экземпляре.
- **Размеры · Радиус скругления** — Радиус пункта одинаков во всех режимах панели (Rail / Drawer / Fixed). пункт — 8px (--radius-m) · drawer правые углы — 10px (--radius-l), левые — 0.
- **Контент** — Подпись пункта — короткое существительное/название раздела, усечение многоточием + тултип (в Rail подпись всегда в тултипе). Иконка — глиф 24×24 из раздела Icons (Menu), уникальна для пункта (опознаёт раздел в Rail). Заголовок блока — название подразделения/типа (в Rail — короткая черта той же высоты (пункты не смещаются)). Badge — только целое число сущностей, опционален, без пустых/декоративных. Футер — ФИО (усечение), должность, организация «+N».
- **Поведение** — Rail: тени нет, тултип справа по hover, бургер → Drawer. Drawer: оверлей + тень, сворачивается бургером или кликом вне области; logout деавторизует. Fixed: пин закрепляет панель (контент ужимается, pin-menu → unpin-menu), повторный клик открепляет → Drawer. **Строка пользователя в футере — ссылка на личный кабинет** (клик по всей области; в Rail кликабелен аватар); должность в строке — заглушка, меняется по текущей роли. **Кнопка выхода открывает модалку смены роли** (`data-modal`, список ролей); выбор роли перерисовывает состав групп меню (данные — `ibp-home.js`).
- **Состояния** — Пункт (.Navigation_Item): Default (Text_Secondary), Hover (заливка Table Row Hover, Text_Primary), Selected (заливка Table Row Focus, подпись Strong, aria-current), Disabled (Text_Inactive, вне таб-порядка, бейдж muted). Футер: Default + Hover (заливка `--bgtable-row-hover` по ВСЕЙ полосе, как у пункта меню) + Focus (кольцо `--primary` на строке пользователя).
- **Доступность** — `<nav aria-label="Главное меню">`; текущая страница `aria-current="page"`. Бургер/пин/выход — `aria-label`; пин — `aria-pressed`. Строка пользователя — ссылка с `aria-label="Открыть личный кабинет"`, кнопка выхода отдельная. Выбранный/отключённый пункт красится и по `[aria-current]`/`[aria-disabled="true"]` напрямую — классы `.nav__item--selected`/`--disabled` нужны только там, где текущая страница не определяется атрибутом (RulesAudit W1, 12.08.2026). Disabled-пункт — `aria-disabled="true"` + `tabindex="-1"`. Значение Badge включается в подпись пункта. Фокус — кольцо `--primary`.
- **Типографика** — Подпись пункта Body M (Selected — Body M Strong); заголовок блока Body XS (Text_Inactive); ФИО Body S Strong; должность/организация Body XS; тултип Rail Body S (Text_on_dark).
- **Цвета** — Фон панели `--bg-mainmenu`; шов/разделители `--border-light`; тень Drawer `--shadow-modal-form`. Пункт: текст `--text-secondary`/`--text-primary`, иконка `--secondary` (Default) → `--secondary-dark` (Hover/Selected), заливка `--bgtable-row-hover` (Hover) / `--bgtable-row-focus` (Selected), `--text-inactive` (Disabled). Заголовок блока `--text-inactive`. Badge — `--primary` (accent). Тултип Rail — фон `--bg-hint`, текст `--text-on-dark`.

## Состав групп (эталон)
Мастер-каталог групп и пунктов меню (названия + иконки) — источник истины для сборки меню; фактический состав на панели определяется ролью (см. «Роли»). Порядок групп настраивается данными. Данные — единый каталог `scripts/ibp-home.js` (`window.IBPHome`), из него же строятся тайлы главной страницы (NavTile).

| Группа | Пункты (название → иконка) |
|---|---|
| Origination | Обязательные сделки `Important-deals` · Возможные сделки `deals-possible-deals` · Потенциалы РД `potentials-rd` · Обязательные лиды `important-leads` · Возможные лиды `possible-leads` · Проекты продаж CIB `sales-projects` · Кампании продаж `sales-company` · Потенциалы DCM `dcm-potentials` · Калькулятор `calc` · Фонды `funds` |
| Pipeline | Pipeline `pipeline` · Pipeline ЦКП `ckp-pipeline` · M&A Pipeline `mna-pipeline` · DCM Pipeline `dcm-pipeline` · ECM Pipeline `ecm-pipeline` · Календарь КПКИ `kpki-cal` · Дашборды по Pipeline `pmc-dashboard` · Реестр платежей IB `payments-ib` |
| Текущий портфель ДИД | Текущий портфель `current-depo` · CF СБИ `cash-flow` · Корпоративные запросы `corporate-transactions` |
| Отчёты | Отчёты 1C/Navision `reports-1-c` · Реестр выписок `registry` · Расчет резерва `reserve` · Расчет FV `calclate-fv` · Отчёты для Рисков `rwa` (canDisable) |
| Клиенты и задачи | Клиенты `factory-01` · Поиск клиентов в ЕПК `client-search` (без тайла) · Задачи `tasks` (Badge) |
| Администрирование | Администрирование `admin-panel-settings` · Администратор ЦКП `admin-ckp` |

## Роли
Роль определяет доступный набор групп меню; группа доступна целиком (**full**) или частично (**partial** — список id пунктов). Модель: `role → { groups: { groupId: 'full' | [itemId, …] } }`; недоступные группы и пункты не рендерятся. Набор по ролям — в `ibp-home.js`.

- **Финансист ДИД**: Текущий портфель ДИД (full) · Отчёты (full) · Клиенты и задачи (full) · Администрирование (partial: только «Администрирование», без «Администратор ЦКП»). Origination и Pipeline — не входят.

## Соответствие главной странице (отложено)
Каждая группа и каждый пункт меню соответствуют группе и тайлу стартовой главной страницы (зеркально 1:1); исключение — пункт «Поиск клиентов в ЕПК» (тайла нет). Пункт меню без тайла на главной странице — ошибка. Соответствие реализовано единым каталогом `ibp-home.js` (item = и меню-поля, и тайл-поля; `tile: null` — пункт без тайла); правило и валидация закрепляются при создании главной страницы.

## Из коробки
Рантайм `scripts/ds-nav-panel.js` (`window.DSNavPanel`) — самоинициализация по `.nav`, кода на экране не требуется.

| Что | Как |
|---|---|
| Переключение режимов | Бургер: rail ↔ последний развёрнутый режим. Пин: drawer ↔ fixed; `aria-pressed` и глиф `pin-menu`/`unpin-menu` обновляются рантаймом, `aria-label` бургера — «Развернуть/Свернуть меню» |
| Rail-тултипы | Подписи `.nav__label` позиционируются `position:fixed` справа от панели (зазор 10px); пересчёт по hover, focus, скроллу списка и resize |
| Настройки на панели | `data-nav-collapsed-mode` (drawer\|fixed — куда разворачивает бургер) · `data-nav-modes="no"` (только тултипы, режимы не переключаются) · `data-nav-auto="no"` (не подключать) |
| API | `bind(nav, opts)` · `bindAll(root)` · `setMode(nav, mode)` · `placeRailLabels(nav)` |
| Событие | `ds-nav-mode` на `.nav`, `detail {mode, prev}` |

`nav-panel.page.js` после экстракции только собирает демо-разметку и вызывает этот рантайм.

## Для разработчиков (выжимка)

### Точные размеры (redline)
Таблица рендерится на странице через getComputedStyle на живом экземпляре (drawer + rail). Значения — токены в `styles/nav-panel.css`, `styles/badge.css`, `styles/icon-button.css`.

### Разметка · HTML (эталонная реализация ДС)

```
<nav class="nav nav--drawer" aria-label="Главное меню">
  <div class="nav__top">
    <button class="ibtn ibtn--neutral ibtn--m nav__burger" aria-label="Свернуть меню"><i data-icon="left-menu"></i></button>
    <button class="ibtn ibtn--neutral ibtn--m nav__pin" aria-pressed="false" aria-label="Закрепить панель"><i data-icon="pin-menu"></i></button>
  </div>
  <div class="nav__list">
    <a class="nav__item nav__item--selected" href="#" aria-current="page"><span class="nav__ico"><i data-icon="main-page"></i></span><span class="nav__label">Главная</span></a>
    <div class="nav__block">
      <div class="nav__block-label">Origination</div>
      <a class="nav__item" href="#"><span class="nav__ico"><i data-icon="Important-deals"></i></span><span class="nav__label">Обязательные сделки</span></a>
      <!-- … пункт с бейджем: -->
      <a class="nav__item" href="#" aria-label="Задачи, 7"><span class="nav__ico"><i data-icon="tasks"></i></span><span class="nav__label">Задачи</span><span class="nav__badge"><span class="badge badge--xs badge--accent" aria-hidden="true">7</span></span></a>
    </div>
  </div>
  <div class="nav__footer">
    <a class="nav__user" href="#" aria-label="Открыть личный кабинет">
      <span class="av av--circular av--m"><span class="av__text">АП</span></span>
      <span class="nav__user-text">
        <span class="nav__user-name">Александров Петр Константинович</span>
        <span class="nav__user-role">Консультант-аналитик ДИД</span>
        <span class="nav__user-org">SMB Недвижимость +2</span>
      </span>
    </a>
    <button class="ibtn ibtn--neutral ibtn--m nav__logout" aria-label="Выйти"><i data-icon="logout"></i></button>
  </div>
</nav>
<!-- Rail: nav--rail (подписи → тултип, бейдж на угол иконки, футер = только аватар).
     Fixed: nav--fixed (шов справа, без тени). -->
```

### Поведение · псевдокод (framework-agnostic)

```
// mode ∈ { rail, drawer, fixed }; current = id активного пункта.
// 1. Burger: rail→drawer, drawer→rail; в fixed скрыт.
// 2. Pin (drawer/fixed): drawer→fixed (ужать контент, pin-menu→unpin-menu, aria-pressed=true);
//    fixed→drawer (вернуть оверлей).
// 3. Drawer-оверлей: тень Shadow4.0_modalform; клик вне области ИЛИ Esc → rail.
//    Fixed тени не имеет и не сворачивается кликом-снаружи.
// 4. Rail-тултип: hover/focus пункта → всплывающая подпись справа.
// 5. Выбор: клик → навигация, current=id → nav__item--selected + aria-current.
// 6. Logout: клик → деавторизация.
```

### Справочник классов и атрибутов

| Класс/атрибут | Назначение |
|---|---|
| `.nav` | Корень панели (flex-колонка, фон `--bg-mainmenu`) |
| `.nav--rail` / `.nav--drawer` / `.nav--fixed` | Режим: свёрнутый / оверлей / закреплённый |
| `.nav__top` | Шапка: Burger (+ Pin в развёрнутых режимах) |
| `.nav__burger` / `.nav__pin` | IconButton сворачивания / закрепления |
| `.nav__list` | Прокручиваемая область пунктов |
| `.nav__block` | Блок-секция разделов. В Rail черта рисуется у каждого блока (`.nav--rail .nav__block-label::before`), исключения для первого нет |
| `.nav__block-label` | Заголовок блока (в Rail скрыт, заменён чертой) |
| `.nav__item` | Пункт меню (.Navigation_Item) |
| `.nav__item--selected` / `.nav__item--disabled` | Текущая страница / недоступный пункт |
| `.nav__ico` / `.nav__label` / `.nav__badge` | Иконка 24 / подпись / Badge |
| `.nav__footer` / `.nav__user` / `.nav__logout` | Футер: профиль (Avatar + текст) + выход |
