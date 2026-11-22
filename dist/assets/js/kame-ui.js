/* KAME GROUP — outils communs aux espaces membres (investisseur, entreprise, commerçant).
   Textes bilingues, nombres, dates, graphiques, fenêtre, message de confirmation et bandeau (menu du compte, notifications).
   Chaque espace (investor.js, business.js) s'appuie sur window.KAME_UI. */
(function () {
  'use strict';

  var ICONS = window.KAME_ICONS || {};
  var root = document.documentElement;

  // ------------------------------------------------------------ textes et nombres
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  // Texte bilingue : les deux langues sont dans la page, la feuille de style affiche la bonne
  function t(fr, en) { return '<span class="t-fr">' + esc(fr) + '</span><span class="t-en" lang="en">' + esc(en) + '</span>'; }
  function isEn() { return root.lang === 'en'; }
  function L(fr, en) { return isEn() ? en : fr; }
  function ic(name, size, sw) {
    var s = size || 20;
    return '<svg aria-hidden="true" focusable="false" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' +
      (sw || 1.9) + '" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[name] || '') + '</svg>';
  }
  // Recherche sans tenir compte des accents ni des majuscules (« energie » trouve « Énergie »)
  function plain(s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
  // Nombres au format de la langue : 28 690 000 et 28,7 en français ; 28,690,000 et 28.7 en anglais
  function num(n) {
    var neg = n < 0;
    var s = String(Math.round(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, isEn() ? ',' : ' ');
    return (neg ? '−' : '') + s;
  }
  function dec(v) { return isEn() ? String(v) : String(v).replace('.', ','); }
  function money(n) { return num(n) + ' FCFA'; }
  function millions(n) { var m = n / 1e6; return dec(m >= 100 ? Math.round(m) : Math.round(m * 10) / 10) + ' M'; }
  function pct(n, signed) {
    var v = Math.round(n * 10) / 10;
    var sign = signed && v > 0 ? '+' : (v < 0 ? '−' : '');
    return sign + dec(Math.abs(v)) + (isEn() ? '%' : ' %');
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  // Hasard reproductible : les mêmes courbes à chaque visite
  function rng(seed) {
    var h = 2166136261;
    for (var i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
    return function () {
      h += 0x6D2B79F5;
      var x = h;
      x = Math.imul(x ^ (x >>> 15), x | 1);
      x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hex(r, n) { var s = ''; for (var i = 0; i < n; i++) s += '0123456789abcdef'.charAt(Math.floor(r() * 16)); return s; }

  // ------------------------------------------------------------ dates
  var MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
  var MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var LONG_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  var LONG_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var NOW = new Date();
  // Les 12 derniers mois, jusqu'au mois en cours
  var LAST12 = [];
  for (var mi = 11; mi >= 0; mi--) {
    var d = new Date(NOW.getFullYear(), NOW.getMonth() - mi, 1);
    LAST12.push({ fr: MONTHS_FR[d.getMonth()], en: MONTHS_EN[d.getMonth()], y: d.getFullYear(), m: d.getMonth(),
                  longFr: LONG_FR[d.getMonth()], longEn: LONG_EN[d.getMonth()] });
  }
  function fmtDate(dt) {
    // « 1er décembre » en français
    return { fr: (dt.getDate() === 1 ? '1er' : dt.getDate()) + ' ' + LONG_FR[dt.getMonth()] + ' ' + dt.getFullYear(), en: LONG_EN[dt.getMonth()] + ' ' + dt.getDate() + ', ' + dt.getFullYear(),
             ts: dt.getTime() };
  }
  function dateLabel(monthsAgo, day) { return fmtDate(new Date(NOW.getFullYear(), NOW.getMonth() - monthsAgo, day)); }
  function daysAgo(n) { return fmtDate(new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() - n)); }
  function inDays(n) { return fmtDate(new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() + n)); }
  // Nombre de jours entiers entre deux dates (objets renvoyés par fmtDate)
  function daysBetween(a, b) { return Math.round((b.ts - a.ts) / 86400000); }
  function dateText(dt) { return t(dt.fr, dt.en); }

  // ------------------------------------------------------------ secteurs d'activité
  var SECTORS = {
    // Une couleur bien distincte par secteur (graphiques, icônes), tirée de la palette KAME
    agriculture: { fr: 'Agriculture et pêche', en: 'Farming and fishing', icon: 'agro', color: '#159E96' },
    commerce: { fr: 'Commerce', en: 'Retail and trade', icon: 'merchant', color: '#B8734F' },
    fintech: { fr: 'Fintech', en: 'Fintech', icon: 'pay', color: '#145B63' },
    services: { fr: 'Services', en: 'Services', icon: 'truck', color: '#6E8C93' },
    industrie: { fr: 'Industrie', en: 'Industry', icon: 'business', color: '#7A5236' },
    tech: { fr: 'Technologie', en: 'Technology', icon: 'data', color: '#2F6FA3' },
    energie: { fr: 'Énergie', en: 'Energy', icon: 'sun', color: '#E0A030' },
    sante: { fr: 'Santé', en: 'Health', icon: 'heart', color: '#C2695A' }
  };
  var SECTOR_ORDER = ['agriculture', 'commerce', 'fintech', 'services', 'industrie', 'tech', 'energie', 'sante'];
  // Croissance moyenne sur 12 mois par secteur (démonstration)
  var SECTOR_GROWTH = { agriculture: 11, commerce: 7, fintech: 26, services: 5, industrie: 2, tech: 19, energie: 29, sante: 9 };
  function sectorName(k) { var s = SECTORS[k] || SECTORS.services; return t(s.fr, s.en); }

  // ------------------------------------------------------------ KAME Score : niveaux
  // Couleur vive pour les graphiques, pastille lisible (classe lv-a … lv-e) pour le texte
  function level(score) {
    if (score >= 80) return { l: 'A', c: '#0E7C75' };
    if (score >= 70) return { l: 'B', c: '#159E96' };
    if (score >= 60) return { l: 'C', c: '#E0A030' };
    if (score >= 50) return { l: 'D', c: '#B8734F' };
    return { l: 'E', c: '#B5452F' };
  }
  function lvChip(score, label) {
    var lv = level(score);
    return '<span class="lv lv-' + lv.l.toLowerCase() + (label ? ' wide' : '') + '">' + (label ? label + lv.l : lv.l) + '</span>';
  }

  // ------------------------------------------------------------ petits éléments réutilisables
  function trendTag(n, unit) {
    var cls = n > 0 ? 'up' : (n < 0 ? 'down' : 'flat');
    var txt = n === 0 ? t('Stable', 'Steady') : (unit === '%' ? pct(n, true) : (n > 0 ? '+' : '−') + Math.abs(n) + ' pts');
    return '<span class="inv-trend ' + cls + '">' + (n !== 0 ? ic(n > 0 ? 'trend' : 'trenddown', 15, 2.2) : '') + txt + '</span>';
  }
  function hexIcon(name, color) {
    return '<span class="inv-hex" style="--hx:' + (color || '#159E96') + '">' + ic(name, 20, 1.9) + '</span>';
  }
  function card(title, body, action, cls) {
    return '<article class="inv-card' + (cls ? ' ' + cls : '') + '"><header class="inv-card-head"><h2>' + title + '</h2>' + (action || '') + '</header>' + body + '</article>';
  }
  function seeAll(href, fr, en) { return '<a class="inv-more" href="' + href + '">' + t(fr || 'Voir tout', en || 'See all') + ' ' + ic('right', 16, 2) + '</a>'; }
  function heading(fr, en, sub) {
    return '<div class="inv-view-head"><h1 class="inv-h1" tabindex="-1">' + t(fr, en) + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') + '</div>';
  }
  function kpi(icon, color, label, value, delta, extra) {
    return '<article class="inv-kpi"><div class="kpi-top">' + hexIcon(icon, color) + '<p class="kpi-label">' + label + '</p></div>' +
      '<p class="kpi-value">' + value + '</p>' + (delta || extra ? '<div class="kpi-foot"><p class="kpi-delta">' + (delta || '') + '</p>' +
      (extra ? '<div class="kpi-spark">' + extra + '</div>' : '') + '</div>' : '') + '</article>';
  }
  function notifItem(n) {
    return '<li><a href="' + n.go + '">' + hexIcon(n.icon, '#159E96') + '<span><span class="n-text">' + t(n.fr, n.en) + '</span><span class="inv-meta">' +
      t(n.when[0], n.when[1]) + '</span></span></a></li>';
  }
  // Onglets d'une page (liens vers des adresses #…), l'onglet ouvert est marqué
  function tabs(items, current, labelFr, labelEn) {
    return '<nav class="inv-tabs" aria-label="' + esc(L(labelFr, labelEn)) + '">' + items.map(function (x) {
      return '<a href="' + x[0] + '"' + (x[1] === current ? ' aria-current="page"' : '') + '>' + (x[4] ? ic(x[4], 18, 2) : '') + t(x[2], x[3]) + '</a>';
    }).join('') + '</nav>';
  }

  // ------------------------------------------------------------ graphiques (SVG)
  function linePath(values, w, h, pad, min, max) {
    var step = (w - pad * 2) / (values.length - 1);
    return values.map(function (v, i) {
      var x = pad + i * step;
      var y = h - pad - (v - min) / (max - min || 1) * (h - pad * 2);
      return [x, y];
    });
  }
  // Courbe sur 12 mois : le dessin s'étire à la largeur de la carte avec une hauteur fixe ;
  // traits d'épaisseur constante, points en HTML pour rester bien ronds
  function lineChart(series, opts) {
    opts = opts || {};
    var W = 600, H = 200, P = 10;
    var all = [];
    series.forEach(function (s) { all = all.concat(s.values); });
    var min = Math.min.apply(null, all), max = Math.max.apply(null, all);
    var span = max - min || 1;
    min = Math.max(0, min - span * 0.25); max = max + span * 0.12;
    var NS = ' vector-effect="non-scaling-stroke"';
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" role="img" aria-label="' + esc(opts.label || '') + '">';
    for (var gi = 0; gi <= 2; gi++) {
      var gy = P + (H - P * 2) * gi / 2;
      svg += '<line x1="0" x2="' + W + '" y1="' + gy + '" y2="' + gy + '" class="grid"' + NS + '/>';
    }
    var dots = '';
    series.forEach(function (s) {
      var pts = linePath(s.values, W, H, P, min, max);
      var dd = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
      if (s.fill) {
        svg += '<path d="' + dd + ' L' + pts[pts.length - 1][0].toFixed(1) + ' ' + (H - P) + ' L' + pts[0][0].toFixed(1) + ' ' + (H - P) + ' Z" fill="' + s.color + '" fill-opacity=".14"/>';
      }
      svg += '<path d="' + dd + '" fill="none" stroke="' + s.color + '" stroke-width="' + (s.dash ? 2 : 3) + '"' + (s.dash ? ' stroke-dasharray="6 6"' : '') +
        ' stroke-linejoin="round" stroke-linecap="round"' + NS + '/>';
      if (!s.dash && opts.dots !== false) {
        pts.forEach(function (p, i) {
          dots += '<span class="chart-dot' + (i === pts.length - 1 ? ' last' : '') + '" style="left:' + (p[0] / W * 100).toFixed(2) + '%;top:' + (p[1] / H * 100).toFixed(2) +
            '%;--dc:' + s.color + '"></span>';
        });
      }
    });
    svg += '</svg>' + dots;
    // Graduations placées exactement sur les lignes et les points du dessin
    var fmt = opts.fmt || function (v) { return millions(v); };
    var yPos = [P / H * 100, 50, (H - P) / H * 100];
    var y = '<div class="chart-y" aria-hidden="true">' + [max, (max + min) / 2, min].map(function (v, i) {
      return '<span style="top:' + yPos[i].toFixed(2) + '%">' + esc(fmt(v)) + '</span>';
    }).join('') + '</div>';
    var step = (W - P * 2) / 11;
    var x = '<div class="chart-x" aria-hidden="true">' + LAST12.map(function (m, i) {
      return '<span style="left:' + ((P + i * step) / W * 100).toFixed(2) + '%">' + t(m.fr, m.en) + '</span>';
    }).join('') + '</div>';
    return '<div class="chart" style="--ch:' + (opts.h || 200) + 'px">' + y + '<div class="chart-svg">' + svg + '</div>' + x + '</div>';
  }
  function spark(values, color) {
    var min = Math.min.apply(null, values), max = Math.max.apply(null, values);
    var pts = linePath(values, 100, 32, 3, min, max);
    var dd = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
    return '<svg class="spark" viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true"><path d="' + dd + '" fill="none" stroke="' + (color || '#159E96') +
      '" stroke-width="2.2" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round"/></svg>';
  }
  function donut(parts, centerHtml, label) {
    var total = parts.reduce(function (s, p) { return s + p.v; }, 0);
    var C = 2 * Math.PI * 15.9155, off = 0;
    var rings = parts.map(function (p) {
      var len = p.v / total * C;
      var seg = '<circle cx="21" cy="21" r="15.9155" fill="none" stroke="' + p.c + '" stroke-width="5.5" stroke-dasharray="' + (len - 0.6).toFixed(2) + ' ' + (C - len + 0.6).toFixed(2) +
        '" stroke-dashoffset="' + (-off + C / 4).toFixed(2) + '"/>';
      off += len;
      return seg;
    }).join('');
    return '<div class="donut"><svg viewBox="0 0 42 42" role="img" aria-label="' + esc(label) + '"><circle cx="21" cy="21" r="15.9155" fill="none" stroke="#EEF5F5" stroke-width="5.5"/>' +
      rings + '</svg><div class="donut-center">' + centerHtml + '</div></div>';
  }
  function gauge(score) {
    var lv = level(score);
    var a = Math.PI * (1 - score / 100);
    var x = 100 + 80 * Math.cos(a), y = 100 - 80 * Math.sin(a);
    return '<div class="gauge"><svg viewBox="0 0 200 112" role="img" aria-label="' + esc(L('KAME Score : ', 'KAME Score: ') + score + '/100, ' + L('niveau ', 'level ') + lv.l) + '">' +
      '<path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="#E6F0F0" stroke-width="16" stroke-linecap="round"/>' +
      '<path d="M20 100 A80 80 0 0 1 ' + x.toFixed(1) + ' ' + y.toFixed(1) + '" fill="none" stroke="' + lv.c + '" stroke-width="16" stroke-linecap="round"/>' +
      '</svg><div class="gauge-val" aria-hidden="true"><p class="g-num"><strong>' + score + '</strong>/100</p>' + lvChip(score, L('Niveau ', 'Level ')) + '</div></div>';
  }
  function bars(items) {
    return '<ul class="inv-bars">' + items.map(function (it) {
      return '<li><span class="b-label">' + it.label + '</span><span class="b-track"><span class="b-fill" style="width:' + clamp(it.pct, 2, 100) + '%;--bc:' + (it.color || '#159E96') +
        '"></span></span><span class="b-val">' + it.value + '</span></li>';
    }).join('') + '</ul>';
  }

  // ------------------------------------------------------------ empreinte numérique (SHA-256), calculée sur l'appareil
  function sha256(data) {
    if (!(window.crypto && crypto.subtle)) return Promise.reject(new Error('no-crypto'));
    var buf = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    return crypto.subtle.digest('SHA-256', buf).then(function (h) {
      return Array.prototype.map.call(new Uint8Array(h), function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
    });
  }
  function fileHash(file) { return file.arrayBuffer().then(sha256); }

  // ------------------------------------------------------------ message de confirmation
  var toastEl = document.createElement('div');
  toastEl.className = 'inv-toast';
  toastEl.setAttribute('role', 'status');
  toastEl.setAttribute('aria-live', 'polite');
  document.body.appendChild(toastEl);
  var toastTimer;
  function toast(html, icon) {
    toastEl.innerHTML = (icon === false ? '' : ic(icon || 'ok', 18, 2.4)) + '<span>' + html + '</span>';
    toastEl.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('on'); }, 4600);
  }

  // ------------------------------------------------------------ fenêtre (dialogue)
  var modal = document.createElement('div');
  modal.className = 'inv-modal';
  modal.hidden = true;
  modal.innerHTML = '<div class="inv-dialog" role="dialog" aria-modal="true" aria-labelledby="inv-modal-title"><h2 id="inv-modal-title"></h2><div class="inv-dialog-body"></div>' +
    '<div class="inv-dialog-actions"><button type="button" class="btn btn-outline btn-sm" data-close>' + t('Annuler', 'Cancel') + '</button>' +
    '<button type="button" class="btn btn-primary btn-sm" data-confirm>' + t('Envoyer', 'Send') + '</button></div></div>';
  document.body.appendChild(modal);
  var modalCfg = null, lastFocus = null, busy = false;
  // cfg : title, body, confirm (texte du bouton), check() → message d'erreur ou rien,
  //       submit() → promesse (la fenêtre attend la réponse) et fail(err) → message, done() après fermeture
  function openModal(cfg) {
    modalCfg = cfg;
    busy = false;
    toastEl.classList.remove('on');   // le message ne doit pas cacher les boutons de la fenêtre
    lastFocus = document.activeElement;
    modal.querySelector('h2').innerHTML = cfg.title;
    modal.querySelector('.inv-dialog-body').innerHTML = cfg.body + '<p class="inv-form-error" role="alert" hidden></p>';
    modal.querySelector('[data-confirm]').innerHTML = cfg.confirm || t('Envoyer', 'Send');
    modal.querySelector('[data-close]').hidden = cfg.noCancel === true;
    modal.querySelector('.inv-dialog').classList.toggle('wide', !!cfg.wide);
    setBusy(false);
    modal.hidden = false;
    var first = modal.querySelector('input:not([disabled]):not([type="hidden"]), textarea, select');
    if (first) first.focus();
    if (cfg.opened) cfg.opened(modal);
  }
  function closeModal() {
    if (busy) return;
    modal.hidden = true;
    modalCfg = null;
    if (lastFocus && lastFocus.focus && document.contains(lastFocus)) lastFocus.focus();
  }
  function setBusy(on) {
    var ok = modal.querySelector('[data-confirm]');
    ok.disabled = on;
    modal.querySelector('[data-close]').disabled = on;
    ok.classList.toggle('is-busy', on);
    modal.querySelector('.inv-dialog').setAttribute('aria-busy', String(on));
  }
  function modalError(html) {
    var box = modal.querySelector('.inv-form-error');
    box.innerHTML = html;
    box.hidden = !html;
  }
  modal.addEventListener('click', function (e) {
    if (busy) return;
    if (e.target === modal || e.target.closest('[data-close]')) { closeModal(); return; }
    if (!e.target.closest('[data-confirm]') || !modalCfg) return;
    var cfg = modalCfg;
    var err = cfg.check ? cfg.check(modal) : '';
    if (err) { modalError(err); return; }
    modalError('');
    if (cfg.submit) {
      busy = true;
      setBusy(true);
      Promise.resolve().then(function () { return cfg.submit(modal); }).then(function (res) {
        busy = false;
        setBusy(false);
        closeModal();
        if (cfg.done) cfg.done(res);
      }, function (er) {
        busy = false;
        setBusy(false);
        modalError(cfg.fail ? cfg.fail(er) : t('Une erreur est survenue. Réessayez dans un instant.', 'Something went wrong. Please try again in a moment.'));
      });
      return;
    }
    closeModal();
    if (cfg.done) cfg.done();
  });
  // Entrée dans un champ d'une ligne : même effet que le bouton principal
  modal.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'radio' && e.target.type !== 'checkbox' && e.target.type !== 'file') {
      e.preventDefault();
      modal.querySelector('[data-confirm]').click();
    }
  });

  // ------------------------------------------------------------ bandeau : menu du compte et notifications
  // Chaque espace fournit ses notifications : { list() → [{icon, go, when, fr, en}], unread() → nombre, markRead() }
  var notifier = null;
  var header = document.querySelector('.member-header');
  var panels = {
    notifs: { btn: header && header.querySelector('.mh-bell'), el: document.getElementById('mh-notifs') },
    menu: { btn: header && header.querySelector('.mh-me'), el: document.getElementById('mh-menu') }
  };
  function setNotifier(n) { notifier = n; updateBell(); }
  function updateBell() {
    var cnt = document.querySelector('[data-notif-count]');
    var n = notifier ? notifier.unread() : 0;
    if (cnt) { cnt.textContent = String(n); cnt.hidden = !n; }
  }
  function closePanels(except) {
    Object.keys(panels).forEach(function (k) {
      var p = panels[k];
      if (!p.el || k === except) return;
      p.el.hidden = true;
      if (p.btn) p.btn.setAttribute('aria-expanded', 'false');
    });
  }
  function openPanel(k, toggle) {
    var p = panels[k];
    if (!p || !p.el) return;
    var open = toggle ? p.el.hidden : true;
    closePanels(k);
    if (k === 'notifs' && open) {
      var items = notifier ? notifier.list() : [];
      p.el.innerHTML = '<p class="mh-panel-title">' + t('Notifications', 'Notifications') + '</p>' + (items.length ?
        '<ul class="inv-notifs">' + items.map(notifItem).join('') + '</ul>' : '<p class="inv-meta mh-empty">' + t('Aucune notification.', 'No notifications.') + '</p>');
      if (notifier) notifier.markRead();
      updateBell();
    }
    p.el.hidden = !open;
    if (p.btn) p.btn.setAttribute('aria-expanded', String(open));
    if (open && toggle === undefined) { var first = p.el.querySelector('a, button'); if (first) first.focus(); }
  }
  if (panels.menu.btn) panels.menu.btn.addEventListener('click', function () { openPanel('menu', true); });
  if (panels.notifs.btn) panels.notifs.btn.addEventListener('click', function () { openPanel('notifs', true); });
  document.addEventListener('click', function (e) {
    if (e.target.closest('.mh-pop')) {
      if (e.target.closest('.mh-panel a, .mh-panel [data-space-role], .mh-panel [data-add-space]')) closePanels();
      return;
    }
    closePanels();
  });
  document.addEventListener('keydown', function (e) {
    // Tabulation gardée dans la fenêtre tant qu'elle est ouverte
    if (e.key === 'Tab' && !modal.hidden) {
      var f = Array.prototype.filter.call(modal.querySelectorAll('input, textarea, select, button'), function (el) {
        return !el.disabled && !el.hidden && el.getClientRects().length;
      });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      return;
    }
    if (e.key !== 'Escape') return;
    if (!modal.hidden) { closeModal(); return; }
    var openK = Object.keys(panels).filter(function (k) { return panels[k].el && !panels[k].el.hidden; })[0];
    if (openK) { closePanels(); if (panels[openK].btn) panels[openK].btn.focus(); }
  });

  window.KAME_UI = {
    esc: esc, t: t, isEn: isEn, L: L, ic: ic, plain: plain, num: num, dec: dec, money: money, millions: millions, pct: pct, clamp: clamp,
    rng: rng, hex: hex,
    NOW: NOW, LAST12: LAST12, fmtDate: fmtDate, dateLabel: dateLabel, daysAgo: daysAgo, inDays: inDays, daysBetween: daysBetween, dateText: dateText,
    SECTORS: SECTORS, SECTOR_ORDER: SECTOR_ORDER, SECTOR_GROWTH: SECTOR_GROWTH, sectorName: sectorName,
    level: level, lvChip: lvChip, trendTag: trendTag, hexIcon: hexIcon, card: card, seeAll: seeAll, heading: heading, kpi: kpi, notifItem: notifItem, tabs: tabs,
    lineChart: lineChart, spark: spark, donut: donut, gauge: gauge, bars: bars,
    sha256: sha256, fileHash: fileHash,
    toast: toast, openModal: openModal, closeModal: closeModal, modal: modal, modalError: modalError,
    setNotifier: setNotifier, updateBell: updateBell, openPanel: openPanel, closePanels: closePanels
  };
})();
