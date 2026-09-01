# Скелет страницы docs-split (эталон структуры)

Каноническая структура страницы документации IBP, раскатанной на паттерн
«сплиттер + табы». Вместо чтения готовых страниц (Entity.html и др.) — сверяйся
с этим файлом. `{{…}}` — то, что у страницы своё.

## head — подключения

Порядок: компонентные CSS → служебные. Обязательная замена `ds-toc.css`:

```html
<link rel="stylesheet" href="../../styles/<компонент>.css">
<link rel="stylesheet" href="../../styles/splitter.css">
<link rel="stylesheet" href="../../styles/segment-control.css">
<link rel="stylesheet" href="../../styles/tab.css">
<link rel="stylesheet" href="../../styles/docs-split.css">
<link rel="stylesheet" href="../../styles/pg-kit.css">
<link rel="stylesheet" href="../../styles/ds-nav.css">
<link rel="stylesheet" href="../../styles/ds-docs.css">
```

`ds-toc.css` отсутствует; `pg-kit.css` остаётся (CSS), `pg-kit.js` — нет.

## body — каркас

```html
<main class="page ds-split" data-screen-label="{{Компонент}}">

  <div class="splitpane splitpane--h" data-splitter data-min="25" data-max="75" data-initial="42">
    <div class="splitpane__panel splitpane__a app-pane-demo">
      <div class="demo-stage">
        <!-- {{демо: #pg-stage или .pg__stage > … или #demo-…}} -->
      </div>
    </div>

    <div class="spl spl--h" role="separator" aria-orientation="horizontal" aria-label="Изменить высоту демо" tabindex="0"><span class="spl__grip"><i></i><i></i><i></i><i></i><i></i><i></i></span></div>

    <div class="splitpane__panel splitpane__b app-pane-docs">
      <div class="tabs tabs--horiz" role="tablist" data-tabs aria-label="Разделы страницы">
        <button type="button" class="tab tab--m" id="tab-constructor" role="tab" aria-selected="false" tabindex="-1" data-pane="pane-constructor" aria-controls="pane-constructor"><span class="tab__label">Конструктор</span></button>
        <button type="button" class="tab tab--m tab--selected" id="tab-docs" role="tab" aria-selected="true" tabindex="0" data-pane="pane-docs" aria-controls="pane-docs"><span class="tab__label">Документация</span></button>
        <button type="button" class="tab tab--m" id="tab-code" role="tab" aria-selected="false" tabindex="-1" data-pane="pane-code" aria-controls="pane-code"><span class="tab__label">Код</span></button>
      </div>

      <div class="tabs-body">
        <div class="tabpane" id="pane-docs" role="tabpanel" aria-labelledby="tab-docs">
          <div class="docs-layout">
            <div class="docs-main">

<header class="masthead">…(crumb | meta | eyebrow | h1 | lead)…</header>

<!-- 1. КОНСТРУКТОР: демо — в верхнюю панель, контролы — во вкладку «Конструктор» -->

<!-- N. СЕКЦИИ документации (Usage … Backlog) — проходят насквозь, не читать -->

<footer class="page-foot">…</footer>

            </div><!-- /docs-main -->
            <nav class="docs-toc" id="docs-toc" aria-label="Содержание страницы"></nav>
          </div><!-- /docs-layout -->
        </div><!-- /pane-docs -->
```

## pane-constructor — две колонки

Динамический (контролы строит `page.js`; `docs-split.js` сам разложит по
колонкам и сконвертирует бинарные селекты):

```html
        <div class="tabpane" id="pane-constructor" role="tabpanel" aria-labelledby="tab-constructor" hidden>
          <div class="docs-layout">
            <div class="docs-main">
              <h2>Конструктор</h2>
              <p class="desc">{{описание}}</p>
              <div class="pg__controls" id="pg-controls"></div>
            </div>
          </div>
        </div>
```

Статический (разметка сразу): внутри `.pg__controls` (без id) —
`.ctl-col` (селекты/инпуты, `.ctl` с `.lbl`) + `.toggles` (свитчи
`label.pg-toggle` с самодостаточной подписью, без `.lbl` сверху). Слайдер —
в `.toggles`, без `ctl--span`. Группы — `.ctl-group` (внутри свои
`.ctl-col`/`.toggles`; заголовок — `h3.ctl-group__head`). Один тип — слева.
`segctrl` в конструкторе не используется.

## pane-code

```html
        <div class="tabpane" id="pane-code" role="tabpanel" aria-labelledby="tab-code" hidden>
          <div class="docs-layout">
            <div class="docs-main">
              <h2>Код компонента</h2>
              <p class="desc">{{описание}}</p>
              <div class="segctrl segctrl--s code-switch" role="radiogroup" aria-label="Язык кода" data-segctrl>
                <div class="segctrl__thumb"></div>
                <button type="button" class="segctrl__item" role="radio" aria-checked="true" data-lang="html"><span class="segctrl__label">HTML</span></button>
                <button type="button" class="segctrl__item" role="radio" aria-checked="false" data-lang="css"><span class="segctrl__label">CSS</span></button>
                <button type="button" class="segctrl__item" role="radio" aria-checked="false" data-lang="js"><span class="segctrl__label">JS</span></button>
              </div>
              <div class="code-panel code-view" data-view="html"><pre><code id="code-out-html"></code></pre></div>
              <div class="code-panel code-view" data-view="css" hidden><pre><code id="code-out-css"></code></pre></div>
              <div class="code-panel code-view" data-view="js" hidden><pre><code id="code-out-js"></code></pre></div>
            </div>
          </div>
        </div>
      </div><!-- /tabs-body -->
    </div><!-- /app-pane-docs -->
  </div><!-- /splitpane -->
</main>
```

## скрипты (конец файла)

```html
<script src="../../scripts/icons-data.js"></script>
<script src="../../scripts/ds-icons.js"></script>
<script src="../../scripts/ds-nav.js"></script>
<script src="../../scripts/ds-splitter.js"></script>
<script src="../../scripts/ds-tabs.js"></script>
<script src="../../scripts/tbl-resize.js"></script>
<!-- + рантаймы компонента: ds-<comp>.js / ds-notify.js / … -->
<script src="../../scripts/<компонент>.page.js"></script>  <!-- если есть -->
<!-- при бинарных селектах конструктора (подпись СТАТИЧНА, не меняется от положения):
     строка — статичная подпись; объект { label, on? } — подпись + явное on-значение селекта -->
<script>window.DS_SPLIT_SWITCH_LABELS = { '{{Лейбл}}': 'Показывать {{что}}' };</script>
<!-- или: { 'Сетка': { label: 'Показывать сетку', on: 'y' } } — когда эвристика направления врёт -->
<script src="../../scripts/docs-split.js"></script>

<!-- ===== исходники для вкладки «Код» (статично) ===== -->
<script type="text/plain" id="src-code-html">{{эталон из спеки}}</script>
<script type="text/plain" id="src-code-js">{{выжимка API из page.js}}</script>
<script type="text/plain" id="src-code-css"></script>  <!-- заполняет inject -->
```

Порядок обязателен: рантаймы → page.js → docs-split.js. Инлайн-JS страницы —
после всех `<script src>`, один `</body></html>` в конце.

## Проверка живости (verify)

Автоассерты харнесса: `main.ds-split: yes`, TOC ≥ 11, код заполнен
(`code-out lengths: N/N/N`). Глазами: табы `[118,132,46]` (эталон),
panes hidden `false/true/true`, демо живо, свитчи без `.lbl`, две колонки
конструктора.
