/* =========================================================================
   DS RiskMetric — рантайм композиции Chip + Popover (out-of-box, RulesAudit W3).
   Спека прямо говорит: компонент — это Chip (ReadOnly, S, pill) + Popover,
   без собственных стилей (styles/riskmetric.css — только классы .rm-*).
   Без рантайма сборка руками теряет вторую половину композиции незаметно.

   Разметка на экране:
     <span class="pop-anchor" data-riskmetric
           data-risk="26" data-zone="red"
           data-rating-date="24.10.2025" data-zone-date="24.10.2025"
           data-segment="…" data-profile="Непроектный"></span>
   data-zone: green|watchlist|red|black (нет атрибута — нет данных о зоне).
   data-loading — показать skeleton вместо данных; data-error="текст" — role="alert".
   Класс pop-anchor можно не указывать — рантайм добавляет сам.
   ========================================================================= */
(function () {
  'use strict';

  var ZONE = {
    green: { cls: 'chip--success', name: 'Зелёная' },
    watchlist: { cls: 'chip--warning', name: 'Watchlist' },
    red: { cls: 'chip--error-solid', name: 'Красная' },
    black: { cls: 'chip--dark-solid', name: 'Чёрная' }
  };
  var ZONE_COLOR = { green: 'var(--st-green)', watchlist: 'var(--st-orange)', red: 'var(--st-red)', black: 'var(--st-grey)' };
  var uid = 0;

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    for (var k in (attrs || {})) { if (attrs[k] != null) n.setAttribute(k, attrs[k]); }
    (kids || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }
  function txt(tag, cls, str) { var n = document.createElement(tag); if (cls) n.className = cls; n.textContent = str; return n; }

  function resolve(d) {
    var rating = (d.risk != null && d.risk !== '') ? parseInt(d.risk, 10) : null;
    var zone = (d.zone && ZONE[d.zone]) ? d.zone : null;
    var hasInfo = !!(zone || rating != null || d.segment || d.profile);
    return {
      rating: rating, zone: zone, hasInfo: hasInfo,
      label: rating != null ? String(rating) : '—',
      toneClass: zone ? ZONE[zone].cls : 'chip--outline'
    };
  }

  function ariaLabel(r, d) {
    if (d.label) return d.label;
    if (!r.hasInfo) return 'Риск-метрика. Данных нет.';
    var parts = ['Риск-метрика.'];
    if (r.rating != null) parts.push('Рейтинг ' + r.rating + (r.zone ? ',' : '.'));
    if (r.zone) parts.push('зона проблемности — ' + ZONE[r.zone].name.toLowerCase() + '.');
    return parts.join(' ');
  }

  function buildChip(r, d, popId) {
    var chip = el('span', { class: 'chip chip--rounded chip--s ' + r.toneClass, 'aria-label': ariaLabel(r, d) },
      [txt('span', 'chip__label', r.label)]);
    if (r.hasInfo) {
      chip.appendChild(el('button', {
        type: 'button', class: 'chip__info', 'aria-haspopup': 'dialog', 'aria-expanded': 'false',
        'aria-controls': popId, 'aria-label': 'Показать детали риск-метрики'
      }, [el('i', { 'data-icon': 'info-circle' })]));
    }
    return chip;
  }

  function row(label, valueNode) {
    return el('div', { class: 'rm-block__row' }, [txt('span', 'rm-block__label', label), valueNode]);
  }
  function value(str, strong, color) {
    var span = txt('span', 'rm-block__value' + (strong ? ' rm-block__value--strong' : ''), str);
    if (color) span.style.color = color;
    return span;
  }

  function buildBody(r, d) {
    if (d.loading != null) {
      var loading = el('div', { class: 'pop__body', 'aria-busy': 'true' });
      [100, 60, 100, 40].forEach(function (w) { loading.appendChild(el('span', { class: 'sk-line', style: '--sk-w:' + w + '%' })); });
      return loading;
    }
    if (d.error) return el('div', { class: 'pop__body', role: 'alert' }, [txt('p', 'rm-field__value', d.error)]);
    var blocks = el('div', { class: 'rm-blocks' }, [
      el('div', { class: 'rm-block' }, [
        row('Зона проблемности', r.zone ? value(ZONE[r.zone].name, true, ZONE_COLOR[r.zone]) : value('—', true)),
        row('Дата расчета', value(d.zoneDate || '—'))
      ]),
      el('div', { class: 'rm-block' }, [
        row('Рейтинг контрагента', value(r.rating != null ? String(r.rating) : '—', true)),
        row('Дата расчета', value(d.ratingDate || '—'))
      ])
    ]);
    return el('div', { class: 'pop__body' }, [
      blocks,
      el('div', { class: 'rm-field' }, [txt('p', 'rm-field__label', 'Риск-сегмент'), txt('p', 'rm-field__value', d.segment || '—')]),
      el('div', { class: 'rm-field' }, [txt('p', 'rm-field__label', 'Риск-профиль'), txt('p', 'rm-field__value', d.profile || '—')])
    ]);
  }

  function buildPopover(id, r, d) {
    var titleId = id + '-title';
    var title = txt('h3', 'pop__title', 'Рейтинг и зона проблемности');
    title.id = titleId;
    var head = el('div', { class: 'pop__head' }, [title,
      el('span', { class: 'pop__close' }, [el('button', { type: 'button', class: 'ibtn ibtn--neutral ibtn--s', 'aria-label': 'Закрыть' }, [el('i', { 'data-icon': 'close' })])])
    ]);
    return el('div', {
      id: id, class: 'pop pop--w-m pop--bottom pop--start pop--floating',
      role: 'dialog', 'aria-modal': 'false', 'aria-labelledby': titleId
    }, [head, buildBody(r, d)]);
  }

  function build(host) {
    if (host.__dsRiskMetric) return;
    host.classList.add('pop-anchor');
    var d = host.dataset;
    var id = host.id ? host.id + '-pop' : 'rm-pop-' + (++uid);
    var r = resolve(d);
    host.innerHTML = '';
    var chip = buildChip(r, d, id);
    host.appendChild(chip);
    if (r.hasInfo) {
      var pop = buildPopover(id, r, d);
      host.appendChild(pop);
      var btn = chip.querySelector('.chip__info');
      if (window.DSPopover && btn) window.DSPopover.bind(btn, { pop: pop, placement: 'bottom', align: 'start' });
    }
    if (window.dsIcons) window.dsIcons.apply(host);
    host.__dsRiskMetric = true;
  }

  function mount(root) { (root || document).querySelectorAll('[data-riskmetric]').forEach(build); }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { mount(document); });
  else mount(document);

  window.DSRiskMetric = { mount: mount, build: build };
})();
