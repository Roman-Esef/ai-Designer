---
component: SnackBar
title: "SnackBar"
version: "1.004"
updated: "30.08.2026"
page: pages/organisms/SnackBar.html
runtime: scripts/ds-notify.js
css: styles/snackbar.css
deps: [button, link]
status: auto
---

> Автоспека для быстрого контекста. Источник истины — CSS-файл и страница компонента. При изменении компонента обновляй эту спеку.

## Назначение
Стек всплывающих уведомлений в правом верхнем углу экрана, поверх всех слоёв (z-index 9900 — выше Modal 900 и ToastBar 800, ниже ToastLoader 9999). Четыре тона: Info · Warning · Error · Success. Каждый снек: иконка тона + заголовок + опциональный текст + опциональные кнопки/ссылка + кнопка закрытия.

## Инварианты
- Стек — максимум 3 видимых снека, переполнение сворачивается в pill «+N» (`.snack-more`), не бесконечная лента.
- Слой `z-index:9900` — выше Modal (900) и ToastBar (800), ниже ToastLoader (9999); фиксированный порядок z-слоёв.
- Кнопки/ссылки внутри снека — только штатные тоновые классы `.btn--<тон>`/`.link--<тон>`, совпадающие с тоном снека.
- Счётчик дублей (`.snack__dupe`) заменяет повтор одинакового уведомления, а не добавляет новую карточку в стек.

## Диагностика
- «Одинаковые уведомления копятся стеком» → должен расти счётчик `.snack__dupe` на существующей карточке, не плодиться новые
- «Цвет кнопки внутри снека не совпадает с тоном» → проверить `.btn--<тон>`/`.link--<тон>`, совпадающий с `.snack--<тон>`

## Ключевые правила
- **Ширина** — фиксированная 320px (.snackbar-layer). Снек заполняет контейнер (width: 100%).
- **Авто-скрытие** — снек без кнопок: 5 с; снек с кнопками: до ручного закрытия. Hover/focus — пауза таймера.
- **Поведение · Переполнение** — видимых ≤ 5; при превышении старые скрываются за overflow-плашкой «+N уведомл.» с кнопками «развернуть» и «закрыть все».
- **Дедупликация** — одинаковые снеки (тон+заголовок+текст) схлопываются в один со счётчиком ×N в заголовке; повторный показ перезапускает таймер.
- **Esc** — закрывает верхний снек стека.
- **Кнопки** — переиспользуют Button xs из ДС с явным тон-классом (`.btn--info/--warning/--error/--success`), совпадающим с тоном снека; переопределение --primary в контексте .snack__buttons остаётся для ссылок.
- **Ссылки** — Link из ДС; перекраска через --link-fg / --link-fg-hover.
- **Слои** — ToastBar < Modal < SnackBar < ToastLoader. Описано в specs/Toast.md.

## Токены

| Тон     | Фон                | Иконка / close / кнопки | Hover       |
|---|---|---|---|
| Info    | --info-bg          | --info                  | --info-dark    |
| Warning | --warning-bg       | --warning               | --warning-dark |
| Error   | --error-bg-light   | --error                 | --error-dark   |
| Success | --success-bg       | --success               | --success-dark |

- Заголовок: `--type-body-s` (400), `--text-primary`
- Текст: `--type-body-xs`, `--text-secondary`
- Border-radius: `--radius-card` (→ --radius-2xl → 16px)
- Shadow: `--elevation-2`

- **Размеры · Радиус скругления** — Один размер; радиус карточный, крупнее, чем у Toast. плашка — 16px (--radius-card) · бейдж-счётчик — 999px (--radius-pill) · кнопка закрытия — 4px (--radius-xs).

## Для разработчиков (выжимка)

### Разметка · HTML

```html
<div class="snackbar-layer" aria-label="Уведомления">
  <div class="snack snack--error" role="alert" aria-live="assertive">
    <span class="snack__icon" aria-hidden="true"><svg…></svg></span>
    <div class="snack__body">
      <div class="snack__title">Ошибка <span class="snack__dupe">×2</span></div>
      <div class="snack__text">Плановая дата просрочена.</div>
      <div class="snack__buttons">
        <button type="button" class="btn btn--outline btn--xs btn--error">
          <span class="btn__label">Изменить сроки</span>
        </button>
      </div>
    </div>
    <button type="button" class="snack__close" aria-label="Закрыть"><svg…></svg></button>
  </div>
  <!-- overflow при > 5 -->
  <div class="snack-more">
    Ещё <span class="snack-more__count">3</span> уведомл.
    <div class="snack-more__actions">
      <button class="snack-more__btn" aria-label="Развернуть"><svg…></svg></button>
      <button class="snack-more__btn" aria-label="Закрыть все"><svg…></svg></button>
    </div>
  </div>
</div>
```

### Рантайм ДС — `scripts/ds-notify.js`

Контроллер снекбара вынесен в рантайм; слой создаётся сам при первом показе
(или берётся элемент с атрибутом `data-ds-snackbar`, если страница задаёт свой).

```
DSSnack.show({ tone: 'error', title: 'Ошибка', text: 'Плановая дата просрочена.',
               buttons: [{ label: 'Изменить сроки', onClick: () => … }] });
```

| Что | Поведение |
|---|---|
| Стек | новый сверху, видимых ≤ 5, остальные — под плашкой «+N уведомл.» |
| Плашка | кнопки «развернуть» (`DSSnack.expand()`) и «закрыть все» (`dismissAll()`) |
| Авто-скрытие | 5с у снека без кнопок; hover и фокус ставят таймер на паузу |
| Дедупликация | одинаковые тон+заголовок+текст схлопываются в `×N` и перезапускают таймер (`dedup: false` отключает) |
| Esc | закрывает верхний снек стека |
| Live-region | error и warning — `alert`/`assertive`, info и success — `status`/`polite` |

API: `DSSnack.show(opts) → id`, `dismiss(id)`, `dismissAll()`, `expand()`,
`layer()`, `stack()`. Опции: `tone`, `title`, `text`, `buttons`
(`[{label, variant, href, onClick}]` — красятся тоновым классом снека),
`dedup`, `duration` (`null` — не скрывать).

### React API (предложение)

```typescript
type SnackTone = 'info' | 'warning' | 'error' | 'success';
interface SnackOptions {
  tone: SnackTone;
  title: string;
  text?: string;
  buttons?: React.ReactNode;
  dedup?: boolean; // default true
}
interface SnackbarController {
  show(opts: SnackOptions): string;
  dismiss(id: string): void;
  dismissAll(): void;
}
// const { show } = useSnackbar();
```

### Справочник классов

| Класс / атрибут | На чём | Назначение |
|---|---|---|
| .snackbar-layer | div | fixed-контейнер, z-9900, 320px, top/right 24px |
| .snack | div | Карточка, grid 3-col, анимация snack-in |
| .snack--info/warning/error/success | div | Тон: фон + цвета элементов |
| .snack--leave | div | Триггер анимации ухода; удалить по animationend |
| .snack__icon | span | 20px, aria-hidden |
| .snack__body | div | flex-col, gap 4px |
| .snack__title | div | Body S 400, --text-primary |
| .snack__dupe | span | Счётчик ×N, встраивается в конец .snack__title |
| .snack__text | div | Body XS, --text-secondary; опционален |
| .snack__buttons | div | Содержит кнопки с явным `.btn--<тон>`; --primary/--link-fg — для ссылок |
| .snack__close | button | aria-label="Закрыть" обязателен |
| .snack-more | div | Overflow-плашка "+N уведомл." |
| role="alert" | snack | error/warning → assertive |
| role="status" | snack | info/success → polite |

> 1.002 (17.07.2026): кнопки и ссылки внутри снека красятся штатными тоновыми классами `.btn--<tone>` / `.link--<tone>`. Переопределения `--primary`/`--link-fg` на `.snack__buttons` убраны — предупреждение компилятора о 37 токенах устранено.
