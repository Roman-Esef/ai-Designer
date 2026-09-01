/* ============================================================
   DS TOC — якорные ссылки по разделам страницы + scrollspy
   Собирает разделы из main section.section > h2, строит
   вертикальную панель в правой верхней части экрана,
   подсвечивает текущий раздел при скролле.
   Требует: styles/ds-toc.css
   ============================================================ */
(function () {
  var TR = { 'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'c','ч':'ch','ш':'sh','щ':'sch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya' };
  function slugify(s) {
    var out = '';
    s = String(s).toLowerCase();
    for (var i = 0; i < s.length; i++) out += (TR[s[i]] !== undefined ? TR[s[i]] : s[i]);
    out = out.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return out || 'section';
  }

  function headingText(h) {
    var clone = h.cloneNode(true);
    var junk = clone.querySelectorAll('.badge-new, .badge-proposal, .addon, .req, sup');
    for (var i = 0; i < junk.length; i++) junk[i].parentNode.removeChild(junk[i]);
    return (clone.textContent || '').replace(/\s+/g, ' ').trim();
  }


  // самодостаточность: подтягиваем свой стиль, если страница его не подключила
  function ensureCss() {
    if (document.querySelector('link[rel="stylesheet"][href$="ds-toc.css"]')) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = (window.__DS_ROOT || '') + 'styles/ds-toc.css';
    document.head.appendChild(l);
  }

  function init() {
    // no-op guard: только на страницах-хостах (<main class="page">); на карточках @dsCard,
    // тянущих ds-toc.js через _ds_bundle.js, контейнера нет — молча выходим.
    if (!document.querySelector('main.page')) return;
    ensureCss();
    var sections = document.querySelectorAll('main section.section');
    if (!sections.length) sections = document.querySelectorAll('main section');
    if (sections.length < 2) return;

    var used = {};
    var items = [];
    for (var i = 0; i < sections.length; i++) {
      var sec = sections[i];
      var h = sec.querySelector('h2');
      if (!h) continue;
      var text = headingText(h);
      if (!text) continue;
      if (!sec.id) {
        var base = 'sec-' + slugify(sec.getAttribute('data-screen-label') || text);
        var id = base, n = 2;
        while (used[id] || document.getElementById(id)) { id = base + '-' + (n++); }
        sec.id = id;
      }
      used[sec.id] = true;
      items.push({ sec: sec, text: text });
    }
    if (items.length < 2) return;

    var toc = document.createElement('nav');
    toc.className = 'ds-toc';
    toc.setAttribute('aria-label', 'Содержание страницы');

    var label = document.createElement('p');
    label.className = 'ds-toc__label';
    label.textContent = 'На этой странице';
    toc.appendChild(label);

    var list = document.createElement('ul');
    list.className = 'ds-toc__list';
    toc.appendChild(list);

    items.forEach(function (it) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.className = 'ds-toc__link';
      a.href = '#' + it.sec.id;
      a.textContent = it.text;
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var top = it.sec.getBoundingClientRect().top + window.pageYOffset - 36;
        window.scrollTo({ top: top, behavior: 'smooth' });
        if (history.replaceState) history.replaceState(null, '', '#' + it.sec.id);
      });
      li.appendChild(a);
      list.appendChild(li);
      it.link = a;
    });

    document.body.appendChild(toc);
    document.body.classList.add('ds-has-toc');

    /* ---- scrollspy ---- */
    var ticking = false;
    function spy() {
      ticking = false;
      var line = 140; /* «линия чтения» от верха вьюпорта */
      var current = items[0];
      for (var i = 0; i < items.length; i++) {
        if (items[i].sec.getBoundingClientRect().top <= line) current = items[i];
      }
      var doc = document.documentElement;
      if (window.innerHeight + window.pageYOffset >= doc.scrollHeight - 4) {
        current = items[items.length - 1];
      }
      items.forEach(function (it) {
        it.link.classList.toggle('is-active', it === current);
        if (it === current) it.link.setAttribute('aria-current', 'location');
        else it.link.removeAttribute('aria-current');
      });
    }
    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(spy); }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    spy();

    /* переход по хэшу при загрузке (id присваиваются здесь же) */
    if (location.hash) {
      var target = document.getElementById(location.hash.slice(1));
      if (target) {
        var top = target.getBoundingClientRect().top + window.pageYOffset - 36;
        window.scrollTo({ top: top });
        spy();
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
