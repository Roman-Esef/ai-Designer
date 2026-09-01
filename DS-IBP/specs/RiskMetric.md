---
component: RiskMetric
title: "Риск-метрика"
version: "1.006"
updated: "30.08.2026"
page: pages/organisms/RiskMetric.html
page_js: scripts/riskmetric.page.js
runtime: scripts/ds-riskmetric.js
css: styles/riskmetric.css
deps: [chip, popover, icon-button, divider]
status: curated
---

> Спека для быстрого контекста. Источник истины — CSS-файлы Chip/Popover и страница компонента.

## Назначение
Компактный индикатор надёжности контрагента в таблицах/списках: рейтинг (число) + зона проблемности (цвет). Композиция — не отдельный CSS-компонент: Chip (ReadOnly, S, pill) + Popover, без собственных стилей. **Popover_RiskMetric — неотъемлемая часть компонента**, а не опциональная зависимость.

## Инварианты
- Композиция, не самостоятельный компонент — Chip (readonly, S, pill) + `.chip__info` (кнопка) + Popover; собственных стилей поверхности нет, кроме `.rm-*` для внутренних блоков Popover.
- `.chip__info` — настоящая кнопка, фокусируется отдельно от чипа даже в readonly.
- Цвет чипа — только Local-токены (StGreen/StOrange/StRed/StGrey) по зоне проблемности, не произвольный.

## Диагностика
- «Клик по информеру не открывает Popover» → проверить, что `.chip__info` — настоящий `<button>`, привязанный к Popover через `ds-popover.js`
- «Цвет чипа не совпадает с зоной риска» → сверить с таблицей алиасов Local-токенов, не задавать цвет напрямую

## Ключевые правила; клик по информеру раскрывает даты расчёта и риск-сегмент/профиль без ухода со страницы. Один открытый Popover одновременно (как у базового Popover).
- **Анатомия** — Chip (ReadOnly, S, pill) → label (число/«—») + `.chip__info` (button, открывает Popover) → Popover_RiskMetric: Header (заголовок + ✕) + Body `.pop__body.rm-body` (gap 16px): `.rm-blocks` (зазор 8px) с 2× `.rm-block` + 2× `.rm-field`. **Footer отсутствует.** Маржинов у блоков и полей нет — раскладка только на gap.
- **Размеры** — фиксированный: только Chip S (24px). Ширина растёт по контенту. Popover фиксирован на `pop--w-m` (320px).
- **Размеры · Радиус скругления** — Пропса размера нет, радиусы фиксированы. чип (Chip S) — 6px (--radius-control-s) · поповер и блок в нём — 8px (--radius-m).
- **Контент** — рейтинг: целое 1–26 или «—». Зона: green/watchlist/red/black или нет данных. Риск-сегмент/профиль — свободный текст без лимита; при отсутствии — прочерк, поле не скрывается.
- **Типографика** — метки строк блока Body S `--text-secondary`; значения и даты Body S `--text-primary`; выделенное значение (зона/рейтинг) Body S Strong.
- **Состояния** — 4 зоны × (Rate+Zone / Zone / Rate) + Details + None. Rate, Details и None не зависят от зоны. Popover: default / loading (skeleton, `aria-busy`) / error (`role="alert"`). Нет зоны и рейтинга, но есть риск-сегмент/профиль (Details) → информер остаётся, зона, рейтинг и даты в поповере — прочерки. Нет вообще ничего (None) → информер отсутствует, поповер не открывается. Нет риск-сегмента/профиля при наличии зоны или рейтинга → поля остаются с прочерками.
- **Доступность** — сам чип вне таб-порядка, несёт описательный `aria-label`. Единственный фокусируемый элемент — `.chip__info` (`aria-haspopup="dialog"`, `aria-expanded`, `aria-controls`). Esc закрывает, фокус возвращается на информер. Зона никогда не кодируется только цветом — текстовое название всегда рядом.
- **Цвета** — только Local-токены: StGreen/StOrange/StRed/StGrey (алиасы success/warning/error/dark в Chip), плюс StSystem для outline без данных. Значение зоны в поповере окрашено базовым тоном (`--st-green/--st-orange/--st-red/--st-grey`, без `-dark`). Фон блоков «Зона»/«Рейтинг» — `--bg-page`. Новых цветов нет.

## Для разработчиков (выжимка)

### Точные размеры (redline)
Таблица рендерится на странице через `getComputedStyle` на живом инстансе (Chip S + Popover w-m). Точные значения — в `styles/chip.css` (`.chip--s`) и `styles/popover.css` (`.pop--w-m`).

### Разметка · HTML (эталонная реализация ДС)
```html
<span class="pop-anchor">
  <span class="chip chip--s chip--error" aria-label="Риск-метрика. Рейтинг 26, зона проблемности — красная.">
    <span class="chip__label">26</span>
    <button type="button" class="chip__info" aria-haspopup="dialog" aria-expanded="false" aria-controls="rm-pop-1" aria-label="Показать детали риск-метрики"><i data-icon="info-circle"></i></button>
  </span>
  <div id="rm-pop-1" class="pop pop--w-m pop--bottom pop--start pop--floating" role="dialog" aria-modal="false" aria-labelledby="rm-pop-1-title">
    <div class="pop__head">
      <h3 class="pop__title" id="rm-pop-1-title">Рейтинг и зона проблемности</h3>
      <span class="pop__close"><button type="button" class="ibtn ibtn--neutral ibtn--s" aria-label="Закрыть"><i data-icon="close"></i></button></span>
    </div>
    <div class="pop__body">
      <div class="rm-block"><div class="rm-block__row"><span class="rm-block__label">Зона проблемности</span><span class="rm-block__value rm-block__value--strong" style="color:var(--st-red-dark)">Красная</span></div><div class="rm-block__row"><span class="rm-block__label">Дата расчета</span><span class="rm-block__value">24.10.2025</span></div></div>
      <div class="rm-block"><div class="rm-block__row"><span class="rm-block__label">Рейтинг контрагента</span><span class="rm-block__value rm-block__value--strong">26</span></div><div class="rm-block__row"><span class="rm-block__label">Дата расчета</span><span class="rm-block__value">24.10.2025</span></div></div>
      <div class="rm-field"><p class="rm-field__label">Риск-сегмент</p><p class="rm-field__value">…</p></div>
      <div class="rm-field"><p class="rm-field__label">Риск-профиль</p><p class="rm-field__value">Непроектный</p></div>
    </div>
  </div>
</span>
```

### Поведение · псевдокод (framework-agnostic)
Сборка и поведение — рантайм `scripts/ds-riskmetric.js` (Chip+Popover из `data-riskmetric`/`data-risk`/`data-zone`/…) поверх `scripts/ds-popover.js` (позиционирование/open-close/single-open/Esc/клик-вне — общие для всех Popover, не переизобретаются).
```
function resolveChip(rating, zone):
  hasZone = zone != null
  hasInfo = hasZone || rating != null
  label = rating != null ? String(rating) : '—'
  tone  = hasZone ? ZONE_TONE[zone] : null      // null → chip--outline; красная/чёрная → *-solid
  return { label, tone, showInfoButton: hasInfo, rounded: true }
  // hasInfo = hasZone || rating != null || riskSegment != null || riskProfile != null
  // ничего из этого нет — информера нет, поповер не открывается

// Открытие/позиционирование/single-open/закрытие (✕, клик вне, Esc, Tab-out) —
// делегированы базовому Popover: bind(infoButton, { pop, placement:'bottom', align:'start' }).
// Body: loading (aria-busy + skeleton) | error (role="alert") | default (rm-block×2 + rm-field×2, без Divider).
```

### Рекомендуемый API компонента (React) — предложение
```ts
type RiskZone = 'green' | 'watchlist' | 'red' | 'black';
interface RiskMetricProps {
  rating?: number;                 // 1–26; не задан → «—»
  zone?: RiskZone;                 // не задан → outline
  ratingCalculatedAt?: string;
  zoneCalculatedAt?: string;
  riskSegment?: string;
  riskProfile?: string;
  loadPopoverDetails?(): Promise<{ zone: RiskZone; rating: number }>;
  'aria-label'?: string;
}
```

### Справочник классов и атрибутов
| Класс/атрибут | Назначение |
|---|---|
| `.chip.chip--rounded.chip--s` | Корень метрики (pill) |
| `.chip--success / --warning` | Светлая заливка: зелёная / watchlist |
| `.chip--error-solid / --dark-solid` | Solid-заливка + белый текст: красная / чёрная зона |
| `.chip--outline` | Нет данных о зоне |
| `.chip__label` | Число рейтинга или «—» |
| `.chip__info` | Кнопка-информер (button, не span) — открывает Popover; отсутствует без данных |
| `.pop-anchor` | position:relative обёртка, точка отсчёта позиционирования |
| `.pop.pop--w-m` | Popover_RiskMetric, без Footer |
| `.rm-blocks` | Обёртка блоков «Зона»/«Рейтинг», зазор 8px |
| `.rm-block / .rm-block__row / .rm-block__label / .rm-block__value` | Серый блок «Зона»/«Рейтинг»: значение + дата расчёта (`--strong` — жирное значение, у зоны окрашено) |
| `.rm-field / .rm-field__label / .rm-field__value` | Текстовое поле (Риск-сегмент/Риск-профиль) |
| `aria-busy="true"` (на `.pop__body`) | Состояние загрузки |
| `role="alert"` (на `.pop__body`) | Ошибка загрузки деталей |

## Бэклог
- Disabled/нет доступа к риск-данным.
- Индикатор тренда (стрелка вверх/вниз) рядом с рейтингом.
- Компактный вариант «только зона» (без числа) для узких колонок.
