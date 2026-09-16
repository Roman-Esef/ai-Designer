/* Реестр хаба проектов — источник меню и списка на корневой странице index.html.

   Новый проект или концепт = одна запись здесь. Хаб строит из реестра и меню,
   и три колонки; сама страница не правится. Полноту реестра проверяет сторож
   `.opencode/skills/screen-review/tooling/projects-hub.mjs` (шаг `projects`
   в `lessons-cli gate`): любой .html в Projects/ или Concepts/ вне папки
   зарегистрированной записи даёт FAIL.

   Обычный <script>, а не JSON: страницы открываются по file://, а fetch по
   file:// с кириллическим путём не работает (ds-rules §10).

   Группы (колонки хаба, в этом порядке):
     ds       — дизайн-система;
     projects — Projects/: файлы, соответствующие настоящей системе, строго на ДС;
     concepts — Concepts/: концепты на ДС, кастомные решения — только если ТЗ
                прямо их просит.

   Поля:
     id     — уникальный ключ, латиница;
     group  — 'ds' | 'projects' | 'concepts';
     title  — название строки на хабе и пункта меню;
     desc   — описание одной строкой;
     href   — стартовая страница, путь от корня (от папки этого файла);
     root   — папка записи от корня, лежит в папке своей группы (Projects/ или
              Concepts/); у группы 'ds' — null. Всё внутри неё — часть записи:
              остальным экранам своя запись не нужна, а экраны с меню обязаны
              вести строкой пользователя в футере на хаб;
     icon   — имя глифа из DS-IBP/specs/Icons.md. */
window.IBPHub = [
  {
    id: 'ds-ibp',
    group: 'ds',
    title: 'Дизайн-система IBP',
    desc: 'Документация основ и компонентов',
    href: 'DS-IBP/index.html',
    root: null,
    icon: 'layer-01'
  },
  {
    id: 'post',
    group: 'projects',
    title: 'Post — ДИД',
    desc: 'Финансист ДИД: главная, текущий портфель, страница сделки',
    href: 'Projects/post/mainPage/index.html',
    root: 'Projects/post',
    icon: 'folder'
  },
  {
    id: 'ai-bankster-prototype',
    group: 'concepts',
    title: 'Аналитические материалы',
    desc: 'Прототип модуля AI Pitcher: новый отчёт, история, журнал',
    href: 'Concepts/ai-bankster-prototype/index.html',
    root: 'Concepts/ai-bankster-prototype',
    icon: 'folder'
  },
  {
    id: 'ai-bankster-prototype-v02',
    group: 'concepts',
    title: 'AI Pitcher',
    desc: 'Прототип v02: чат с конструктором запроса и просмотром материала',
    href: 'Concepts/ai-bankster-prototype-v02/index.html',
    root: 'Concepts/ai-bankster-prototype-v02',
    icon: 'ai-stars'
  },
  {
    id: 'pipeline-manager-kanban',
    group: 'concepts',
    title: 'Pipeline Management',
    desc: 'Сделки и лиды всех pipeline: канбан по стадиям и дескам, таблица',
    href: 'Concepts/pipeline-manager-kanban/index.html',
    root: 'Concepts/pipeline-manager-kanban',
    icon: 'layout-grid-01'
  }
];
