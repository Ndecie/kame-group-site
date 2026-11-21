/* KAME GROUP — espace investisseur.
   Version de démonstration : les entreprises, montants et scores sont fictifs et restent dans ce fichier.
   Aucune donnée n'est envoyée : suivre, manifester son intérêt ou vérifier un document se passe dans le navigateur. */
(function () {
  'use strict';

  var shell = document.getElementById('space-investor');
  if (!shell) return;
  var ICONS = window.KAME_ICONS || {};
  var root = document.documentElement;

  // ------------------------------------------------------------ outils
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
  function plain(s) { return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
  // Nombres au format de la langue : 28 690 000 et 28,7 en français ; 28,690,000 et 28.7 en anglais
  function num(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, isEn() ? ',' : '\u00A0'); }
  function dec(v) { return isEn() ? String(v) : String(v).replace('.', ','); }
  function money(n) { return num(n) + '\u00A0FCFA'; }
  function millions(n) { var m = n / 1e6; return dec(m >= 100 ? Math.round(m) : Math.round(m * 10) / 10) + '\u00A0M'; }
  function pct(n, signed) { return (signed && n > 0 ? '+' : '') + dec(Math.round(n * 10) / 10) + (isEn() ? '%' : '\u00A0%'); }
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

  // Les 12 derniers mois, jusqu'au mois en cours
  var MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
  var MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var NOW = new Date();
  var LAST12 = [];
  for (var mi = 11; mi >= 0; mi--) {
    var d = new Date(NOW.getFullYear(), NOW.getMonth() - mi, 1);
    LAST12.push({ fr: MONTHS_FR[d.getMonth()], en: MONTHS_EN[d.getMonth()], y: d.getFullYear(), m: d.getMonth() });
  }
  function dateLabel(monthsAgo, day) {
    var d = new Date(NOW.getFullYear(), NOW.getMonth() - monthsAgo, day);
    var fr = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    var en = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return { fr: d.getDate() + ' ' + fr[d.getMonth()] + ' ' + d.getFullYear(), en: en[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear(), ts: d.getTime() };
  }

  // ------------------------------------------------------------ données de démonstration (fictives)
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

  function co(id, name, sector, city, since, staff, legal, score, trend, revenue, growth, fr, en) {
    return { id: id, name: name, sector: sector, city: city, since: since, staff: staff, legal: legal, score: score, trend: trend,
             revenue: revenue * 1e6, growth: growth, fr: fr, en: en };
  }
  var COMPANIES = [
    co('okoume-data', 'Okoumé Data Labs', 'tech', 'Libreville', 2020, 18, 'SAS', 88, 5, 22, 24,
       "Hébergement de données et logiciels de gestion pour les PME gabonaises.", 'Data hosting and management software for Gabonese SMEs.'),
    co('mvett-paiements', 'Mvett Paiements', 'fintech', 'Libreville', 2021, 26, 'SA', 81, 2, 31, 31,
       'Paiements mobiles pour les commerçants, du marché à la boutique en ligne.', 'Mobile payments for merchants, from market stalls to online shops.'),
    co('ndjole-agro', 'Coopérative Agro de Ndjolé', 'agriculture', 'Ndjolé', 2017, 40, 'Coopérative', 76, 3, 14, 12,
       'Production et transformation de manioc et de banane plantain avec 120 planteurs.', 'Cassava and plantain growing and processing with 120 farmers.'),
    co('franceville-sante', 'Franceville Santé Plus', 'sante', 'Franceville', 2014, 35, 'SARL', 79, 0, 19, 8,
       "Cliniques de proximité et pharmacie, avec un service de téléconsultation.", 'Local clinics and a pharmacy, with a teleconsultation service.'),
    co('mitzic-cacao', 'Mitzic Cacao', 'agriculture', 'Mitzic', 2018, 22, 'SARL', 74, 1, 9, 15,
       "Achat, fermentation et séchage de cacao auprès des planteurs du Woleu-Ntem.", 'Buying, fermenting and drying cocoa from Woleu-Ntem growers.'),
    co('akanda-logistique', 'Akanda Logistique', 'services', 'Akanda', 2015, 48, 'SARL', 72, -1, 27, 6,
       "Transport et entreposage pour les commerces de l'Estuaire.", 'Transport and warehousing for businesses in the Estuaire province.'),
    co('ivindo-solaire', 'Ivindo Énergie Solaire', 'energie', 'Makokou', 2019, 15, 'SARL', 69, 6, 11, 38,
       'Installation de kits solaires pour les foyers et les petits commerces.', 'Solar kits for homes and small shops.'),
    co('ogooue-marches', 'Ogooué Marchés', 'commerce', 'Lambaréné', 2016, 30, 'SARL', 67, 2, 16, 9,
       "Supérettes de quartier et vente en gros de produits du quotidien.", 'Neighbourhood mini-markets and wholesale of everyday goods.'),
    co('nyonie-peche', 'Nyonié Pêche et Froid', 'agriculture', 'Port-Gentil', 2016, 28, 'SARL', 64, 4, 12, 18,
       'Pêche artisanale, conservation au froid et livraison aux restaurants.', 'Small-scale fishing, cold storage and delivery to restaurants.'),
    co('oyem-boutiques', "Boutiques Réunies d'Oyem", 'commerce', 'Oyem', 2019, 12, 'GIE', 61, 3, 6, 11,
       "Groupement de six boutiques qui achètent ensemble pour vendre moins cher.", 'Six shops buying together to sell for less.'),
    co('moanda-materiaux', 'Moanda Matériaux', 'industrie', 'Moanda', 2012, 55, 'SA', 58, -2, 34, -3,
       'Fabrication de briques et de matériaux de construction.', 'Bricks and building materials manufacturing.')
  ];
  var BY_ID = {};
  COMPANIES.forEach(function (c) { BY_ID[c.id] = c; });

  var SECTOR_GROWTH = { agriculture: 11, commerce: 7, fintech: 26, services: 5, industrie: 2, tech: 19, energie: 29, sante: 9 };

  var REG_TYPES = [
    ['Immatriculation au RCCM', 'Trade register entry'], ['Contrat fournisseur signé', 'Supplier contract signed'],
    ['Paiement reçu d\'un client', 'Customer payment received'], ['Bilan annuel déposé', 'Annual accounts filed'],
    ['Augmentation de capital', 'Capital increase'], ['Livraison confirmée', 'Delivery confirmed']
  ];
  var DEMO_DOC_HASH = '5f23d25d017feca22089b8f11ed06f3641368184c490ad72edcf1461c353104b';

  // Courbes et détails calculés une fois, de façon reproductible
  COMPANIES.forEach(function (c) {
    var r = rng(c.id);
    var start = c.revenue / (1 + c.growth / 100);
    c.rev = LAST12.map(function (m, i) { return (start + (c.revenue - start) * i / 11) * (0.95 + r() * 0.1); });
    c.rev[11] = c.revenue;
    var g = SECTOR_GROWTH[c.sector];
    var avgEnd = c.revenue * (0.72 + r() * 0.16);
    var avgStart = avgEnd / (1 + g / 100);
    c.avg = LAST12.map(function (m, i) { return (avgStart + (avgEnd - avgStart) * i / 11) * (0.97 + r() * 0.06); });
    var sh = [];
    var v = c.score - c.trend;
    for (var i = 10; i >= 0; i--) { sh.unshift(clamp(Math.round(v), 30, 99)); v -= (c.trend / 4) + (r() - 0.5) * 2.4; }
    sh.push(c.score);
    c.scoreHist = sh;
    c.sub = [
      ['Régularité des revenus', 'Revenue regularity', clamp(Math.round(c.score + (r() - 0.4) * 14), 35, 98)],
      ['Historique de paiement', 'Payment history', clamp(Math.round(c.score + (r() - 0.5) * 12), 35, 98)],
      ['Niveau d\'endettement', 'Debt level', clamp(Math.round(c.score - 6 + r() * 12), 30, 97)],
      ['Ancienneté', 'Track record', clamp(Math.round(45 + (2026 - c.since) * 5 + r() * 6), 40, 98)],
      ['Conformité et identité', 'Compliance and identity', clamp(Math.round(86 + r() * 10), 80, 99)]
    ];
    c.clients = Math.round(c.revenue / (60000 + r() * 90000));
    c.margin = Math.round(12 + r() * 16);
    c.events = [];
    var ago = 1 + Math.floor(r() * 2);
    var types = REG_TYPES.slice(1);
    for (var k = 0; k < 4; k++) {
      var ty = types[Math.floor(r() * types.length)];
      c.events.push({ when: dateLabel(ago, 3 + Math.floor(r() * 24)), fr: ty[0], en: ty[1], hash: hex(r, 64) });
      ago += 1 + Math.floor(r() * 4);
    }
    c.events.push({ when: dateLabel(ago + 18, 10), fr: REG_TYPES[0][0], en: REG_TYPES[0][1], hash: hex(r, 64) });
  });
  BY_ID['ndjole-agro'].events.push({ when: dateLabel(1, 14), fr: 'Livraison confirmée (12 tonnes de manioc)', en: 'Delivery confirmed (12 tonnes of cassava)',
                                     hash: DEMO_DOC_HASH, demo: true });
  COMPANIES.forEach(function (c) { c.events.sort(function (a, b) { return b.when.ts - a.when.ts; }); });

  var DOCS = [
    ['Statuts de l\'entreprise', 'Articles of association', false], ['Extrait du registre du commerce', 'Trade register extract', false],
    ['Attestation de situation fiscale', 'Tax compliance certificate', false], ['États financiers 2025', '2025 financial statements', true],
    ['Relevés Mobile Money et bancaires', 'Mobile Money and bank statements', true]
  ];

  var OPPS = [
    { id: 'opp-nyonie', company: 'nyonie-peche', fr: 'Chambre froide et camion frigorifique', en: 'Cold room and refrigerated truck',
      amount: 35e6, type: 'loan', months: 18, days: 9, interested: 9 },
    { id: 'opp-ndjole', company: 'ndjole-agro', fr: 'Unité de transformation du manioc', en: 'Cassava processing unit',
      amount: 45e6, type: 'equity', months: 36, days: 18, interested: 7 },
    { id: 'opp-ivindo', company: 'ivindo-solaire', fr: 'Kits solaires pour 300 foyers', en: 'Solar kits for 300 homes',
      amount: 60e6, type: 'loan', months: 24, days: 25, interested: 11 },
    { id: 'opp-okoume', company: 'okoume-data', fr: 'Centre de données local', en: 'Local data centre',
      amount: 120e6, type: 'equity', months: 48, days: 40, interested: 5 }
  ];
  var OPP_TYPES = { loan: ['Prêt', 'Loan'], equity: ['Prise de participation', 'Equity stake'] };

  // Portefeuille déclaré par l'investisseur (investissements faits en dehors de la plateforme)
  var PORTFOLIO = [
    { company: 'okoume-data', invested: 8e6, perf: 18 }, { company: 'mvett-paiements', invested: 6e6, perf: 22 },
    { company: 'ndjole-agro', invested: 5e6, perf: 9 }, { company: 'mitzic-cacao', invested: 3e6, perf: 11 },
    { company: 'franceville-sante', invested: 3e6, perf: 5 }
  ];
  var state = {
    followed: ['okoume-data', 'mvett-paiements', 'ndjole-agro', 'mitzic-cacao', 'franceville-sante', 'ivindo-solaire', 'akanda-logistique', 'ogooue-marches'],
    interest: {}, requested: {}, read: false,
    q: '', sector: '', city: '', level: '', sort: 'score', oppType: '', scoreSector: ''
  };
  var invested = PORTFOLIO.reduce(function (s, p) { return s + p.invested; }, 0);
  var valueNow = PORTFOLIO.reduce(function (s, p) { return s + p.invested * (1 + p.perf / 100); }, 0);
  var valueHist = (function () {
    var r = rng('portefeuille');
    return LAST12.map(function (m, i) { return i === 11 ? valueNow : (invested + (valueNow - invested) * i / 11) * (0.985 + r() * 0.03); });
  })();

  // Niveaux du KAME Score : couleur vive pour les graphiques, pastille lisible (classe lv-a … lv-e) pour le texte
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
  function notifications() {
    var o = BY_ID['okoume-data'], iv = BY_ID['ivindo-solaire'], mc = BY_ID['mitzic-cacao'];
    return [
      { icon: 'score', go: '#entreprise/okoume-data/score', when: ['Il y a 1 h', '1 h ago'],
        fr: 'Le KAME Score de ' + o.name + ' est passé à ' + o.score + '/100 (+' + o.trend + ' pts).',
        en: o.name + "'s KAME Score rose to " + o.score + '/100 (+' + o.trend + ' pts).' },
      { icon: 'target', go: '#opportunites', when: ['Il y a 3 h', '3 h ago'],
        fr: 'Nouvelle opportunité : ' + iv.name + ' recherche ' + money(60e6) + '.',
        en: 'New opportunity: ' + iv.name + ' is seeking ' + money(60e6) + '.' },
      { icon: 'file', go: '#entreprise/mitzic-cacao/documents', when: ['Il y a 1 j', '1 d ago'],
        fr: 'Un nouveau document est disponible pour ' + mc.name + '.', en: 'A new document is available for ' + mc.name + '.' }
    ];
  }

  // ------------------------------------------------------------ petits éléments réutilisables
  function scoreBadge(c, big) {
    return '<span class="inv-score' + (big ? ' big' : '') + '"><strong>' + c.score + '</strong>/100 ' + lvChip(c.score) + '</span>';
  }
  function trendTag(n, unit) {
    var cls = n > 0 ? 'up' : (n < 0 ? 'down' : 'flat');
    var sign = n > 0 ? '+' : '';
    var txt = n === 0 ? t('Stable', 'Steady') : (unit === '%' ? pct(n, true) : sign + n + ' pts');
    return '<span class="inv-trend ' + cls + '">' + (n !== 0 ? ic(n > 0 ? 'trend' : 'trenddown', 15, 2.2) : '') + txt + '</span>';
  }
  function hexIcon(name, color) {
    return '<span class="inv-hex" style="--hx:' + (color || '#159E96') + '">' + ic(name, 20, 1.9) + '</span>';
  }
  function sectorName(k) { var s = SECTORS[k]; return t(s.fr, s.en); }
  function verified() { return '<span class="inv-verified" title="' + esc(L('Entreprise vérifiée par KAME ID', 'Company verified by KAME ID')) + '">' + ic('shield', 15, 2) + t('Vérifiée', 'Verified') + '</span>'; }
  function card(title, body, action, cls) {
    return '<article class="inv-card' + (cls ? ' ' + cls : '') + '"><header class="inv-card-head"><h2>' + title + '</h2>' + (action || '') + '</header>' + body + '</article>';
  }
  function seeAll(href) { return '<a class="inv-more" href="' + href + '">' + t('Voir tout', 'See all') + ' ' + ic('right', 16, 2) + '</a>'; }
  function disclaimer() {
    return '<p class="inv-disclaimer">' + ic('info', 16, 2) + t('Indicateurs fournis à titre d\'information, ne constituent pas un conseil en investissement. Entreprises et chiffres fictifs (démonstration).',
      'Indicators provided for information only; they are not investment advice. Fictitious companies and figures (demo).') + '</p>';
  }
  function heading(fr, en, sub) {
    return '<div class="inv-view-head"><h1 class="inv-h1" tabindex="-1">' + t(fr, en) + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') + '</div>';
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
      var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
      if (s.fill) {
        svg += '<path d="' + d + ' L' + pts[pts.length - 1][0].toFixed(1) + ' ' + (H - P) + ' L' + pts[0][0].toFixed(1) + ' ' + (H - P) + ' Z" fill="' + s.color + '" fill-opacity=".14"/>';
      }
      svg += '<path d="' + d + '" fill="none" stroke="' + s.color + '" stroke-width="' + (s.dash ? 2 : 3) + '"' + (s.dash ? ' stroke-dasharray="6 6"' : '') +
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
    var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
    return '<svg class="spark" viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true"><path d="' + d + '" fill="none" stroke="' + (color || '#159E96') +
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
  function gauge(c) {
    var lv = level(c.score);
    var a = Math.PI * (1 - c.score / 100);
    var x = 100 + 80 * Math.cos(a), y = 100 - 80 * Math.sin(a);
    return '<div class="gauge"><svg viewBox="0 0 200 112" role="img" aria-label="' + esc(L('KAME Score : ', 'KAME Score: ') + c.score + '/100, ' + L('niveau ', 'level ') + lv.l) + '">' +
      '<path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="#E6F0F0" stroke-width="16" stroke-linecap="round"/>' +
      '<path d="M20 100 A80 80 0 0 1 ' + x.toFixed(1) + ' ' + y.toFixed(1) + '" fill="none" stroke="' + lv.c + '" stroke-width="16" stroke-linecap="round"/>' +
      '</svg><div class="gauge-val" aria-hidden="true"><p class="g-num"><strong>' + c.score + '</strong>/100</p>' + lvChip(c.score, L('Niveau ', 'Level ')) + '</div></div>';
  }
  function bars(items) {
    return '<ul class="inv-bars">' + items.map(function (it) {
      return '<li><span class="b-label">' + it.label + '</span><span class="b-track"><span class="b-fill" style="width:' + clamp(it.pct, 2, 100) + '%;--bc:' + (it.color || '#159E96') +
        '"></span></span><span class="b-val">' + it.value + '</span></li>';
    }).join('') + '</ul>';
  }

  // ------------------------------------------------------------ vues
  var VIEWS = ['accueil', 'annuaire', 'opportunites', 'portefeuille', 'score', 'data', 'registre', 'profil', 'entreprise'];
  var space = function () { return window.KAME_SPACE || {}; };

  function oppCard(o, compact) {
    var c = BY_ID[o.company], s = SECTORS[c.sector];
    var closing = o.days <= 10;
    return '<article class="inv-opp' + (compact ? ' compact' : '') + '">' +
      '<div class="inv-opp-art" style="--sc:' + s.color + '">' + ic(s.icon, compact ? 42 : 48, 1.5) + '</div>' +
      '<div class="inv-opp-body"><p class="inv-chip ' + (closing ? 'warn' : 'ok') + '">' + (closing ? t('Clôture proche', 'Closing soon') : t('Ouvert', 'Open')) + '</p>' +
      '<h3>' + t(o.fr, o.en) + '</h3>' +
      '<p class="inv-meta">' + esc(c.name) + ' · ' + ic('pin', 14, 2) + esc(c.city) + '</p>' +
      '<dl class="inv-facts"><div><dt>' + t('Montant recherché', 'Amount sought') + '</dt><dd>' + money(o.amount) + '</dd></div>' +
      '<div><dt>' + t('Type', 'Type') + '</dt><dd>' + t(OPP_TYPES[o.type][0], OPP_TYPES[o.type][1]) + '</dd></div>' +
      '<div><dt>' + t('Durée', 'Term') + '</dt><dd>' + t(o.months + ' mois', o.months + ' months') + '</dd></div>' +
      '<div><dt>KAME Score</dt><dd>' + scoreBadge(c) + '</dd></div></dl>' +
      '<div class="inv-opp-foot"><span class="inv-meta">' + ic('clock', 15, 2) + t('Clôture dans ' + o.days + ' jours', 'Closes in ' + o.days + ' days') + ' · ' +
      t(o.interested + ' investisseurs intéressés', o.interested + ' interested investors') + '</span>' +
      '<a class="btn btn-primary btn-sm" href="#entreprise/' + c.id + '">' + t('Voir le projet', 'View project') + '</a></div></div></article>';
  }

  function followRow(id) {
    var c = BY_ID[id];
    return '<li><a class="inv-follow" href="#entreprise/' + c.id + '">' + hexIcon(SECTORS[c.sector].icon, SECTORS[c.sector].color) +
      '<span class="f-main"><strong>' + esc(c.name) + '</strong><span class="inv-meta">' + esc(c.city) + ' · ' + sectorName(c.sector) + '</span></span>' +
      '<span class="f-spark">' + spark(c.scoreHist, level(c.score).c) + '</span><span class="f-score">' + scoreBadge(c) + trendTag(c.trend) + '</span>' +
      '<span class="f-go">' + ic('right', 18, 2) + '</span></a></li>';
  }

  function viewAccueil() {
    var sp = space();
    var followedScores = state.followed.map(function (id) { return BY_ID[id].score; });
    var avg = Math.round(followedScores.reduce(function (a, b) { return a + b; }, 0) / (followedScores.length || 1));
    var avgPrev = Math.round(state.followed.map(function (id) { return BY_ID[id].scoreHist[10]; }).reduce(function (a, b) { return a + b; }, 0) / (followedScores.length || 1));
    var change = (valueNow / invested - 1) * 100;
    var bee = document.querySelector('.inv-side-card svg');
    var notifs = notifications();
    var bySector = {};
    PORTFOLIO.forEach(function (p) { var k = BY_ID[p.company].sector; bySector[k] = (bySector[k] || 0) + p.invested; });
    var parts = Object.keys(bySector).map(function (k) { return { k: k, v: bySector[k], c: SECTORS[k].color }; }).sort(function (a, b) { return b.v - a.v; });

    var html = '<div class="inv-welcome"><div class="inv-welcome-text">' +
      '<p class="inv-hello">' + t('Bonjour, ' + (sp.firstName || '') + '\u00A0!', 'Hello, ' + (sp.firstName || '') + '!') + '</p>' +
      '<h1 class="inv-title" tabindex="-1">' + t('Bienvenue dans votre', 'Welcome to your') + ' <em>' + t('espace investisseur', 'investor space') + '</em></h1>' +
      '<p class="inv-lead">' + t('Découvrez, analysez et suivez les meilleures opportunités d\'investissement au Gabon.', 'Discover, analyse and follow the best investment opportunities in Gabon.') + '</p>' +
      '<a class="btn btn-light" href="#opportunites">' + t('Explorer les opportunités', 'Explore opportunities') + ' ' + ic('right', 18, 2) + '</a></div>' +
      '<div class="inv-welcome-art" aria-hidden="true"><span class="h h1"></span><span class="h h2"></span><span class="h h3"></span>' + (bee ? bee.outerHTML : '') + '</div>' +
      '<blockquote class="inv-quote">' + t('Investir intelligemment, construire ensemble un Gabon prospère.', 'Investing wisely, building a prosperous Gabon together.') + '</blockquote></div>';

    html += '<div class="inv-kpis">' +
      kpi('trend', '#159E96', t('Valeur estimée du portefeuille', 'Estimated portfolio value'), millions(valueNow) + ' FCFA', trendTag(Math.round(change * 10) / 10, '%') + '<span class="kpi-note">' + t('sur 12 mois', 'over 12 months') + '</span>', spark(valueHist, '#159E96')) +
      kpi('building', '#145B63', t('Entreprises suivies', 'Companies followed'), String(state.followed.length), '<span class="inv-trend up">' + ic('trend', 15, 2.2) + t('+1 cette semaine', '+1 this week') + '</span>') +
      kpi('score', '#B8734F', t('KAME Score moyen', 'Average KAME Score'), avg + '/100 ' + lvChip(avg), trendTag(avg - avgPrev)) +
      kpi('bell', '#C98A1E', t('Alertes récentes', 'Recent alerts'), String(notifs.length), '<button type="button" class="inv-link" data-open-notifs>' + t('Voir les alertes', 'See alerts') + ' ' + ic('right', 15, 2) + '</button>') +
      '</div>';

    html += '<div class="inv-grid g-main">' +
      card(ic('trend', 20, 2) + t('Performance de votre portefeuille', 'Your portfolio performance'),
        '<p class="inv-big">' + money(valueNow) + ' ' + trendTag(Math.round(change * 10) / 10, '%') + '</p>' +
        lineChart([{ values: valueHist, color: '#159E96', fill: true }], { h: 190, label: L('Valeur estimée du portefeuille sur 12 mois', 'Estimated portfolio value over 12 months') }) +
        '<p class="inv-foot-note">' + t('Montants investis déclarés par vous : ', 'Amounts invested, as declared by you: ') + money(invested) + '</p>', '', 'perf') +
      card(ic('pie', 20, 2) + t('Répartition de votre portefeuille', 'Portfolio breakdown'),
        '<div class="inv-split">' + donut(parts.map(function (p) { return { v: p.v, c: p.c }; }), '<strong>' + PORTFOLIO.length + '</strong><span>' + t('entreprises', 'companies') + '</span>',
          L('Répartition par secteur', 'Breakdown by sector')) +
        '<ul class="inv-legend">' + parts.map(function (p) {
          return '<li><span class="dot" style="background:' + p.c + '"></span>' + sectorName(p.k) + '<strong>' + pct(Math.round(p.v / invested * 100)) + '</strong></li>';
        }).join('') + '</ul></div>') +
      card(ic('bell', 20, 2) + t('Notifications', 'Notifications'),
        '<ul class="inv-notifs">' + notifs.map(notifItem).join('') + '</ul>') +
      '</div>';

    html += '<div class="inv-grid g-bottom">' +
      card(ic('target', 20, 2) + t('Opportunités d\'investissement', 'Investment opportunities'), oppCard(OPPS[1], true), seeAll('#opportunites')) +
      card(ic('star', 20, 2) + t('Mes entreprises suivies', 'Companies I follow'),
        '<ul class="inv-follows">' + state.followed.slice(0, 4).map(followRow).join('') + '</ul>', seeAll('#portefeuille')) +
      '<article class="inv-help">' + (bee ? bee.outerHTML : '') + '<h2>' + t('Besoin d\'aide ?', 'Need help?') + '</h2><p>' +
      t('L\'équipe KAME répond à vos questions sur la plateforme et les entreprises.', 'The KAME team answers your questions about the platform and the companies.') + '</p>' +
      '<a class="btn btn-light btn-sm" href="index.html#contact">' + t('Poser une question', 'Ask a question') + ' ' + ic('right', 16, 2) + '</a></article>' +
      '</div>' + disclaimer();
    return html;
  }
  function kpi(icon, color, label, value, delta, extra) {
    return '<article class="inv-kpi"><div class="kpi-top">' + hexIcon(icon, color) + '<p class="kpi-label">' + label + '</p></div>' +
      '<p class="kpi-value">' + value + '</p>' + (delta || extra ? '<div class="kpi-foot"><p class="kpi-delta">' + (delta || '') + '</p>' +
      (extra ? '<div class="kpi-spark">' + extra + '</div>' : '') + '</div>' : '') + '</article>';
  }
  function notifItem(n) {
    return '<li><a href="' + n.go + '">' + hexIcon(n.icon, '#159E96') + '<span><span class="n-text">' + t(n.fr, n.en) + '</span><span class="inv-meta">' + t(n.when[0], n.when[1]) + '</span></span></a></li>';
  }

  function viewAnnuaire() {
    var cities = COMPANIES.map(function (c) { return c.city; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).sort();
    var q = plain(state.q.trim());
    var list = COMPANIES.filter(function (c) {
      var hay = plain([c.name, c.city, SECTORS[c.sector].fr, SECTORS[c.sector].en, c.fr, c.en].join(' '));
      return (!q || hay.indexOf(q) >= 0) && (!state.sector || c.sector === state.sector) && (!state.city || c.city === state.city) &&
        (!state.level || 'ABCDE'.indexOf(level(c.score).l) <= 'ABCDE'.indexOf(state.level));
    });
    list.sort(function (a, b) { return state.sort === 'name' ? a.name.localeCompare(b.name) : (state.sort === 'growth' ? b.growth - a.growth : b.score - a.score); });
    var chips = '<div class="inv-chips" role="group" aria-label="' + esc(L('Catégories', 'Categories')) + '">' +
      '<button type="button" data-sector="" aria-pressed="' + (!state.sector) + '">' + t('Toutes', 'All') + '</button>' +
      SECTOR_ORDER.map(function (k) { return '<button type="button" data-sector="' + k + '" aria-pressed="' + (state.sector === k) + '">' + ic(SECTORS[k].icon, 16, 2) + sectorName(k) + '</button>'; }).join('') + '</div>';
    var tools = '<div class="inv-toolbar"><label class="inv-search">' + ic('search', 18, 2) + '<span class="sr-only">' + t('Rechercher', 'Search') + '</span>' +
      '<input type="search" data-filter="q" value="' + esc(state.q) + '" placeholder="' + esc(L('Nom, secteur ou ville…', 'Name, sector or city…')) + '"></label>' +
      select('city', L('Ville', 'City'), [['', L('Toutes les villes', 'All cities')]].concat(cities.map(function (c) { return [c, c]; })), state.city) +
      select('level', L('Score minimum', 'Minimum score'), [['', L('Tous les scores', 'All scores')], ['A', 'A'], ['B', L('B ou plus', 'B or better')], ['C', L('C ou plus', 'C or better')]], state.level) +
      select('sort', L('Trier par', 'Sort by'), [['score', L('Meilleur score', 'Best score')], ['growth', L('Plus forte croissance', 'Fastest growth')], ['name', L('Nom', 'Name')]], state.sort) + '</div>';
    var grid = list.length ? '<div class="inv-companies">' + list.map(companyCard).join('') + '</div>' :
      '<p class="inv-empty">' + t('Aucune entreprise ne correspond à votre recherche.', 'No company matches your search.') + '</p>';
    var n = list.length;
    var sub = n === 0 ? t('Aucun résultat', 'No results') : (n === 1 ? t('1 entreprise vérifiée', '1 verified company') : t(n + ' entreprises vérifiées', n + ' verified companies'));
    return heading('Annuaire des entreprises', 'Company directory', sub) + chips + tools + grid + disclaimer();
  }
  function select(key, label, opts, val) {
    return '<label class="inv-select"><span class="sr-only">' + esc(label) + '</span><select data-filter="' + key + '" aria-label="' + esc(label) + '">' +
      opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (o[0] === val ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></label>';
  }
  function companyCard(c) {
    var s = SECTORS[c.sector];
    var following = state.followed.indexOf(c.id) >= 0;
    return '<article class="inv-company"><div class="ic-top">' + hexIcon(s.icon, s.color) + '<div><h3><a href="#entreprise/' + c.id + '">' + esc(c.name) + '</a></h3>' +
      '<p class="inv-meta">' + sectorName(c.sector) + ' · ' + esc(c.city) + '</p></div></div>' + verified() +
      '<div class="ic-score">' + scoreBadge(c) + trendTag(c.trend) + '</div><div class="ic-spark">' + spark(c.rev, s.color) + '<span class="inv-meta">' +
      t('Chiffre d\'affaires ', 'Revenue ') + pct(c.growth, true) + t(' sur 12 mois', ' over 12 months') + '</span></div>' +
      '<div class="ic-actions"><a class="btn btn-primary btn-sm" href="#entreprise/' + c.id + '">' + t('Voir le profil', 'View profile') + '</a>' +
      followBtn(c, following) + '</div></article>';
  }
  function followBtn(c, following) {
    return '<button type="button" class="btn btn-outline btn-sm inv-follow-btn" data-follow="' + c.id + '" aria-pressed="' + following + '">' + ic('bookmark', 16, 2) +
      (following ? t('Suivie', 'Following') : t('Suivre', 'Follow')) + '</button>';
  }

  function viewEntreprise(id, tab) {
    var c = BY_ID[id];
    if (!c) return heading('Entreprise introuvable', 'Company not found') + '<p><a href="#annuaire">' + t('Retour à l\'annuaire', 'Back to the directory') + '</a></p>';
    var s = SECTORS[c.sector];
    tab = ['apercu', 'score', 'data', 'registre', 'documents'].indexOf(tab) >= 0 ? tab : 'apercu';
    var opp = OPPS.filter(function (o) { return o.company === c.id; })[0];
    var tabs = [['apercu', 'Aperçu', 'Overview'], ['score', 'KAME Score', 'KAME Score'], ['data', 'KAME Data', 'KAME Data'], ['registre', 'KAME Registre', 'KAME Registre'], ['documents', 'Documents', 'Documents']];
    var head = '<a class="inv-back" href="#annuaire">' + ic('left', 18, 2) + t('Annuaire', 'Directory') + '</a>' +
      '<section class="inv-co-head"><div class="co-id">' + hexIcon(s.icon, s.color) + '<div><h1 class="inv-h1" tabindex="-1">' + esc(c.name) + '</h1>' +
      '<p class="inv-meta">' + sectorName(c.sector) + ' · ' + ic('pin', 14, 2) + esc(c.city) + ' · ' + esc(c.legal) + ' · ' + t('depuis ', 'since ') + c.since + '</p>' +
      '<p class="co-badges">' + verified() + '<span class="inv-tag">' + ic('id', 15, 2) + t('Dirigeants vérifiés', 'Directors verified') + '</span></p></div></div>' +
      '<div class="co-score">' + scoreBadge(c, true) + trendTag(c.trend) + '</div>' +
      '<div class="co-actions">' + followBtn(c, state.followed.indexOf(c.id) >= 0) +
      '<button type="button" class="btn btn-primary btn-sm" data-interest="' + c.id + '">' + (state.interest[c.id] ? t('Intérêt envoyé', 'Interest sent') : t('Manifester mon intérêt', 'Express interest')) + '</button></div></section>';
    var tabsHtml = '<nav class="inv-tabs" aria-label="' + esc(L('Rubriques de l\'entreprise', 'Company sections')) + '">' + tabs.map(function (tb) {
      return '<a href="#entreprise/' + c.id + '/' + tb[0] + '"' + (tb[0] === tab ? ' aria-current="page"' : '') + '>' + t(tb[1], tb[2]) + '</a>';
    }).join('') + '</nav>';
    var body = '';
    if (tab === 'apercu') {
      body = '<div class="inv-grid g-two">' + card(t('Présentation', 'About'), '<p>' + t(c.fr, c.en) + '</p><dl class="inv-facts wide">' +
        '<div><dt>' + t('Employés', 'Employees') + '</dt><dd>' + c.staff + '</dd></div><div><dt>' + t('Clients actifs', 'Active customers') + '</dt><dd>' + num(c.clients) + '</dd></div>' +
        '<div><dt>' + t('Chiffre d\'affaires mensuel', 'Monthly revenue') + '</dt><dd>' + money(c.revenue) + '</dd></div><div><dt>' + t('Croissance sur 12 mois', '12-month growth') + '</dt><dd>' + pct(c.growth, true) + '</dd></div></dl>') +
        (opp ? card(t('Opportunité ouverte', 'Open opportunity'), oppCard(opp, true)) :
          card(t('Opportunité', 'Opportunity'), '<p class="inv-empty">' + t('Pas de levée de fonds ouverte pour le moment. Suivez l\'entreprise pour être prévenu.', 'No open fundraising right now. Follow the company to be notified.') + '</p>')) + '</div>';
    } else if (tab === 'score') {
      body = '<div class="inv-grid g-two">' + card(t('KAME Score', 'KAME Score'), gauge(c) + '<p class="inv-center">' + trendTag(c.trend) + ' ' + t('en un mois', 'in one month') + '</p>' +
        lineChart([{ values: c.scoreHist, color: level(c.score).c }], { h: 150, fmt: function (v) { return String(Math.round(v)); }, label: L('Évolution du KAME Score', 'KAME Score history') })) +
        card(t('Ce qui compose le score', 'What makes up the score'), bars(c.sub.map(function (x) { return { label: t(x[0], x[1]), pct: x[2], value: x[2] + '/100', color: level(x[2]).c }; })) +
          '<p class="inv-foot-note">' + t('Calculé à partir des données que l\'entreprise partage avec son accord. Mis à jour chaque mois.', 'Computed from data the company shares with its consent. Updated monthly.') + '</p>') + '</div>';
    } else if (tab === 'data') {
      var avgG = SECTOR_GROWTH[c.sector];
      body = '<div class="inv-kpis three">' + kpi('trend', s.color, t('Chiffre d\'affaires (12 mois)', 'Revenue (12 months)'), millions(c.rev.reduce(function (a, b) { return a + b; }, 0)) + ' FCFA', trendTag(c.growth, '%')) +
        kpi('user', '#145B63', t('Clients actifs', 'Active customers'), num(c.clients), '') +
        kpi('pie', '#B8734F', t('Marge', 'Margin'), pct(c.margin), '') + '</div>' +
        card(t('Chiffre d\'affaires mensuel comparé au secteur', 'Monthly revenue compared with the sector'),
          '<p class="inv-legend-line"><span><i style="background:' + s.color + '"></i>' + esc(c.name) + '</span><span><i class="dash"></i>' + t('Moyenne du secteur', 'Sector average') + ' (' + pct(avgG, true) + ')</span></p>' +
          lineChart([{ values: c.avg, color: '#9AA9AE', dash: true }, { values: c.rev, color: s.color, fill: true }], { h: 230, label: L('Chiffre d\'affaires comparé au secteur', 'Revenue compared with the sector') }));
    } else if (tab === 'registre') {
      body = card(t('Historique vérifié', 'Verified history'), '<ol class="inv-timeline">' + c.events.map(function (e) {
        return '<li><span class="tl-seal">' + ic('shield', 16, 2.2) + '</span><div><strong>' + t(e.fr, e.en) + '</strong><span class="inv-meta">' + t(e.when.fr, e.when.en) +
          ' · ' + t('Empreinte ', 'Fingerprint ') + '<code>' + e.hash.slice(0, 10) + '…' + e.hash.slice(-6) + '</code></span></div><span class="inv-chip ok">' + t('Vérifié', 'Verified') + '</span></li>';
      }).join('') + '</ol><p class="inv-foot-note">' + t('Chaque opération est enregistrée avec une empreinte numérique : elle ne peut plus être modifiée sans que cela se voie.',
        'Each operation is recorded with a digital fingerprint: it cannot be changed without it showing.') + ' <a href="#registre">' + t('Vérifier un document', 'Verify a document') + '</a></p>');
    } else {
      body = card(t('Documents', 'Documents'), '<ul class="inv-docs">' + DOCS.map(function (dd, i) {
        var key = c.id + ':' + i;
        var action = !dd[2] ? '<span class="inv-chip ok">' + t('Libre accès', 'Open access') + '</span>' :
          (state.requested[key] ? '<span class="inv-chip warn">' + t('Demande envoyée', 'Request sent') + '</span>' :
            '<button type="button" class="btn btn-outline btn-sm" data-request="' + key + '">' + t('Demander l\'accès', 'Request access') + '</button>');
        return '<li>' + hexIcon(dd[2] ? 'lock' : 'file', dd[2] ? '#B8734F' : '#159E96') + '<span><strong>' + t(dd[0], dd[1]) + '</strong><span class="inv-meta">' +
          (dd[2] ? t('Accès sur demande, accordé par l\'entreprise', 'Access on request, granted by the company') : t('Consultable par les membres vérifiés', 'Available to verified members')) + '</span></span>' + action + '</li>';
      }).join('') + '</ul>');
    }
    return head + tabsHtml + '<div class="inv-tabpanel">' + body + '</div>' +
      '<p class="inv-disclaimer">' + ic('info', 16, 2) + t('Entreprise fictive, présentée pour la démonstration. Les indicateurs ne constituent pas un conseil en investissement.',
        'Fictitious company shown for the demo. Indicators are not investment advice.') + '</p>';
  }

  function viewOpportunites() {
    var list = OPPS.filter(function (o) { return !state.oppType || o.type === state.oppType; });
    var chips = '<div class="inv-chips" role="group" aria-label="' + esc(L('Type de financement', 'Funding type')) + '">' +
      [['', 'Tous', 'All'], ['loan', 'Prêts', 'Loans'], ['equity', 'Prises de participation', 'Equity stakes']].map(function (o) {
        return '<button type="button" data-opptype="' + o[0] + '" aria-pressed="' + (state.oppType === o[0]) + '">' + t(o[1], o[2]) + '</button>';
      }).join('') + '</div>';
    return heading('Opportunités d\'investissement', 'Investment opportunities',
      t('Les entreprises vérifiées publient ici leurs besoins de financement. Aucun paiement ne passe par la plateforme : KAME vous met en relation.',
        'Verified companies post their funding needs here. No payment goes through the platform: KAME puts you in touch.')) +
      chips + '<div class="inv-opps">' + list.map(function (o) { return oppCard(o); }).join('') + '</div>' + disclaimer();
  }

  function viewPortefeuille() {
    var change = (valueNow / invested - 1) * 100;
    var rows = state.followed.map(function (id) {
      var c = BY_ID[id];
      var p = PORTFOLIO.filter(function (x) { return x.company === id; })[0];
      return '<tr><td><a href="#entreprise/' + c.id + '">' + esc(c.name) + '</a><span class="inv-meta">' + sectorName(c.sector) + '</span></td>' +
        '<td>' + (p ? money(p.invested) : '<span class="inv-chip">' + t('Suivie', 'Following') + '</span>') + '</td>' +
        '<td>' + (p ? trendTag(p.perf, '%') : '—') + '</td><td>' + scoreBadge(c) + '</td><td>' + trendTag(c.trend) + '</td><td class="td-spark">' + spark(c.scoreHist, level(c.score).c) + '</td></tr>';
    }).join('');
    return heading('Mon portefeuille', 'My portfolio', t('Les entreprises que vous suivez et celles où vous avez investi.', 'The companies you follow and the ones you have invested in.')) +
      '<div class="inv-kpis three">' + kpi('briefcase', '#145B63', t('Montants investis (déclarés)', 'Amounts invested (declared)'), money(invested), '') +
      kpi('trend', '#159E96', t('Valeur estimée', 'Estimated value'), money(valueNow), trendTag(Math.round(change * 10) / 10, '%')) +
      kpi('building', '#B8734F', t('Entreprises suivies', 'Companies followed'), String(state.followed.length), '') + '</div>' +
      card(t('Mes entreprises', 'My companies'), '<div class="inv-table-wrap"><table class="inv-table"><thead><tr><th>' + t('Entreprise', 'Company') + '</th><th>' + t('Investi', 'Invested') +
        '</th><th>' + t('Performance', 'Performance') + '</th><th>KAME Score</th><th>' + t('Sur 1 mois', '1 month') + '</th><th>' + t('Tendance', 'Trend') + '</th></tr></thead><tbody>' + rows + '</tbody></table></div>') +
      '<p class="inv-foot-note">' + t('Vos investissements se font en dehors de la plateforme : vous les déclarez ici pour suivre leur évolution.',
        'Your investments are made outside the platform: you declare them here to track them.') + '</p>' + disclaimer();
  }

  function viewScore() {
    var list = COMPANIES.filter(function (c) { return !state.scoreSector || c.sector === state.scoreSector; }).slice().sort(function (a, b) { return b.score - a.score; });
    var chips = '<div class="inv-chips" role="group" aria-label="' + esc(L('Secteur', 'Sector')) + '"><button type="button" data-scoresector="" aria-pressed="' + (!state.scoreSector) + '">' + t('Tous les secteurs', 'All sectors') + '</button>' +
      SECTOR_ORDER.map(function (k) { return '<button type="button" data-scoresector="' + k + '" aria-pressed="' + (state.scoreSector === k) + '">' + sectorName(k) + '</button>'; }).join('') + '</div>';
    var rows = list.map(function (c, i) {
      return '<tr><td class="rank">' + (i + 1) + '</td><td><a href="#entreprise/' + c.id + '/score">' + esc(c.name) + '</a><span class="inv-meta">' + esc(c.city) + '</span></td><td>' + sectorName(c.sector) + '</td>' +
        '<td class="td-bar"><span class="b-track"><span class="b-fill" style="width:' + c.score + '%;--bc:' + level(c.score).c + '"></span></span></td><td>' + scoreBadge(c) + '</td><td>' + trendTag(c.trend) + '</td></tr>';
    }).join('');
    return heading('KAME Score', 'KAME Score', t('La note de fiabilité des entreprises, sur 100. Comparez-les et repérez celles qui progressent.', 'The reliability rating of companies, out of 100. Compare them and spot the ones that are improving.')) +
      chips + card(t('Classement', 'Ranking'), '<div class="inv-table-wrap"><table class="inv-table"><thead><tr><th>#</th><th>' + t('Entreprise', 'Company') + '</th><th>' + t('Secteur', 'Sector') +
        '</th><th>' + t('Score', 'Score') + '</th><th>' + t('Niveau', 'Level') + '</th><th>' + t('Sur 1 mois', '1 month') + '</th></tr></thead><tbody>' + rows + '</tbody></table></div>') +
      card(t('Comment lire le KAME Score', 'How to read the KAME Score'), '<div class="inv-levels">' + ['A', 'B', 'C', 'D', 'E'].map(function (l, i) {
        var min = [80, 70, 60, 50, 0][i], max = [100, 79, 69, 59, 49][i];
        return '<span>' + lvChip(max) + min + '–' + max + '</span>';
      }).join('') + '</div><p>' + t('Le score combine la régularité des revenus, l\'historique de paiement, le niveau d\'endettement, l\'ancienneté et la conformité (identité et documents vérifiés). Il est calculé à partir des données que chaque entreprise partage avec son accord.',
        'The score combines revenue regularity, payment history, debt level, track record and compliance (verified identity and documents). It is computed from the data each company shares with its consent.') + '</p>') + disclaimer();
  }

  function viewData() {
    var rows = SECTOR_ORDER.map(function (k) {
      var cs = COMPANIES.filter(function (c) { return c.sector === k; });
      var avg = cs.length ? Math.round(cs.reduce(function (a, c) { return a + c.score; }, 0) / cs.length) : 0;
      return { k: k, n: cs.length, g: SECTOR_GROWTH[k], avg: avg };
    }).sort(function (a, b) { return b.g - a.g; });
    var maxG = Math.max.apply(null, rows.map(function (r) { return Math.abs(r.g); }));
    var market = LAST12.map(function (m, i) { return COMPANIES.reduce(function (s, c) { return s + c.rev[i]; }, 0); });
    var gm = (market[11] / market[0] - 1) * 100;
    return heading('KAME Data', 'KAME Data', t('Les tendances des entreprises inscrites, secteur par secteur.', 'Trends of the registered companies, sector by sector.')) +
      '<div class="inv-kpis three">' + kpi('building', '#145B63', t('Entreprises vérifiées', 'Verified companies'), String(COMPANIES.length), '') +
      kpi('trend', '#159E96', t('Chiffre d\'affaires cumulé (mensuel)', 'Combined monthly revenue'), millions(market[11]) + ' FCFA', trendTag(Math.round(gm * 10) / 10, '%')) +
      kpi('score', '#B8734F', t('KAME Score moyen', 'Average KAME Score'), Math.round(COMPANIES.reduce(function (a, c) { return a + c.score; }, 0) / COMPANIES.length) + '/100', '') + '</div>' +
      '<div class="inv-grid g-two">' + card(t('Croissance par secteur (12 mois)', 'Growth by sector (12 months)'), bars(rows.map(function (r) {
        return { label: sectorName(r.k), pct: Math.abs(r.g) / maxG * 100, value: pct(r.g, true), color: SECTORS[r.k].color };
      }))) + card(t('Chiffre d\'affaires des entreprises inscrites', 'Revenue of registered companies'),
        lineChart([{ values: market, color: '#145B63', fill: true }], { h: 220, label: L('Chiffre d\'affaires cumulé sur 12 mois', 'Combined revenue over 12 months') })) + '</div>' +
      card(t('Secteurs en détail', 'Sectors in detail'), '<div class="inv-table-wrap"><table class="inv-table"><thead><tr><th>' + t('Secteur', 'Sector') + '</th><th>' + t('Entreprises', 'Companies') + '</th><th>' +
        t('Croissance', 'Growth') + '</th><th>' + t('Score moyen', 'Average score') + '</th></tr></thead><tbody>' + rows.map(function (r) {
          return '<tr><td>' + hexIcon(SECTORS[r.k].icon, SECTORS[r.k].color) + ' ' + sectorName(r.k) + '</td><td>' + r.n + '</td><td>' + trendTag(r.g, '%') + '</td><td>' + (r.avg ? r.avg + '/100' : '—') + '</td></tr>';
        }).join('') + '</tbody></table></div>') + disclaimer();
  }

  function viewRegistre() {
    var feed = [];
    COMPANIES.forEach(function (c) { c.events.slice(0, 2).forEach(function (e) { feed.push({ c: c, e: e }); }); });
    feed.sort(function (a, b) { return b.e.when.ts - a.e.when.ts; });
    feed = feed.slice(0, 8);
    return heading('KAME Registre', 'KAME Registre', t('Les opérations clés des entreprises, enregistrées de façon infalsifiable.', 'Key company operations, recorded in a tamper-proof way.')) +
      '<div class="inv-grid g-two">' + card(t('Vérifier un document', 'Verify a document'),
        '<p>' + t('Choisissez un document : son empreinte numérique est calculée sur votre appareil, puis comparée au registre. Le fichier n\'est envoyé nulle part.',
          'Choose a document: its digital fingerprint is computed on your device, then compared with the registry. The file is not sent anywhere.') + '</p>' +
        '<label class="inv-drop">' + ic('upload', 26, 1.8) + '<span>' + t('Choisir un fichier', 'Choose a file') + '</span><input type="file" data-verify></label>' +
        '<div class="inv-verify-result" role="status" aria-live="polite"></div>' +
        '<p class="inv-foot-note">' + t('Pour essayer : ', 'To try it: ') + '<a href="assets/demo/attestation-kame-demo.txt" download>' + t('téléchargez le document de démonstration', 'download the demo document') +
        '</a>' + t(', puis vérifiez-le. Modifiez-le d\'une seule lettre : il ne sera plus reconnu.', ', then verify it. Change a single letter: it will no longer be recognised.') + '</p>') +
      card(t('Dernières opérations enregistrées', 'Latest recorded operations'), '<ol class="inv-timeline">' + feed.map(function (f) {
        return '<li><span class="tl-seal">' + ic('shield', 16, 2.2) + '</span><div><strong>' + t(f.e.fr, f.e.en) + '</strong><span class="inv-meta"><a href="#entreprise/' + f.c.id + '/registre">' + esc(f.c.name) +
          '</a> · ' + t(f.e.when.fr, f.e.when.en) + '</span></div></li>';
      }).join('') + '</ol>') + '</div>' + disclaimer();
  }

  function viewProfil() {
    var sp = space();
    var ids = sp.ids || {};
    var roles = (sp.roles || []).map(function (r) {
      var lb = { investisseur: ['Investisseur', 'Investor'], entreprise: ['Entreprise', 'Business'], commercant: ['Commerçant', 'Merchant'], partenaire: ['Partenaire', 'Partner'] }[r];
      return '<span class="inv-tag">' + t(lb[0], lb[1]) + ' · <strong>' + esc(ids[r] || '') + '</strong></span>';
    }).join('');
    return heading('Mon profil', 'My profile') + '<div class="inv-grid g-two">' +
      card(t('Mon compte', 'My account'), '<div class="inv-me"><span class="mh-avatar big">' + esc((sp.firstName || 'K').charAt(0).toUpperCase()) + '</span><div><strong>' + esc(sp.fullName || sp.firstName || '') +
        '</strong><span class="inv-meta">' + esc(sp.email || '') + '</span><p class="co-badges"><span class="inv-chip ok">' + t('Membre validé', 'Approved member') + '</span>' + roles + '</p></div></div>' +
        (sp.structure || sp.ville ? '<dl class="inv-facts wide">' + (sp.structure ? '<div><dt>' + t('Structure', 'Organisation') + '</dt><dd>' + esc(sp.structure) + '</dd></div>' : '') +
          (sp.ville ? '<div><dt>' + t('Ville', 'City') + '</dt><dd>' + esc(sp.ville) + '</dd></div>' : '') + '</dl>' : '')) +
      card('KAME ID', '<p class="inv-kid">' + hexIcon('id', '#145B63') + '<span><strong>' + t('Vérification d\'identité', 'Identity verification') + '</strong><span class="inv-meta">' +
        t('Bientôt disponible : pièce d\'identité et selfie, pour obtenir votre badge « Identité vérifiée » et accéder aux données détaillées.',
          'Coming soon: ID document and selfie, to get your "Verified identity" badge and access detailed data.') + '</span></span></p>' +
        '<span class="inv-chip warn">' + t('Bientôt', 'Soon') + '</span>') +
      card(t('Préférences d\'investissement', 'Investment preferences'), '<p>' + t('Secteurs suivis', 'Sectors followed') + '</p><div class="inv-chips static">' +
        state.followed.map(function (id) { return BY_ID[id].sector; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).map(function (k) { return '<span>' + sectorName(k) + '</span>'; }).join('') + '</div>' +
        '<p class="inv-foot-note">' + t('Bientôt : choisissez vos secteurs et vos montants pour recevoir les opportunités qui vous correspondent.', 'Coming soon: choose your sectors and amounts to receive matching opportunities.') + '</p>') +
      card(t('Sécurité du compte', 'Account security'), '<ul class="inv-docs"><li>' + hexIcon('lock', '#145B63') + '<span><strong>' + t('Mot de passe', 'Password') + '</strong><span class="inv-meta">' +
        t('Pour le changer, utilisez « Mot de passe oublié » sur la page de connexion.', 'To change it, use "Forgot password" on the login page.') + '</span></span></li><li>' + hexIcon('shield', '#145B63') + '<span><strong>' +
        t('Double authentification', 'Two-step verification') + '</strong><span class="inv-meta">' + t('Bientôt disponible', 'Coming soon') + '</span></span></li></ul>') + '</div>';
  }

  // ------------------------------------------------------------ navigation
  var active = false, currentView = '', currentArgs = [];
  function parse() {
    var h = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
    var parts = h.split('/');
    if (VIEWS.indexOf(parts[0]) < 0) return null;
    return parts;
  }
  function render(view, args) {
    var html;
    switch (view) {
      case 'annuaire': html = viewAnnuaire(); break;
      case 'opportunites': html = viewOpportunites(); break;
      case 'portefeuille': html = viewPortefeuille(); break;
      case 'score': html = viewScore(); break;
      case 'data': html = viewData(); break;
      case 'registre': html = viewRegistre(); break;
      case 'profil': html = viewProfil(); break;
      case 'entreprise': html = viewEntreprise(args[1], args[2]); break;
      default: html = viewAccueil(); view = 'accueil';
    }
    shell.querySelectorAll('.inv-view').forEach(function (v) {
      var on = v.getAttribute('data-view') === view;
      v.hidden = !on;
      if (on) v.innerHTML = html; else v.innerHTML = '';
    });
    var navKey = view === 'entreprise' ? 'annuaire' : view;
    shell.querySelectorAll('[data-nav]').forEach(function (a) {
      if (a.getAttribute('data-nav') === navKey) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    currentView = view; currentArgs = args || [];
  }
  var keepFocus = false;
  function route(fromUser) {
    var parts = parse();
    if (!parts) { if (!currentView) render('accueil', []); return; }
    var sameCompany = currentView === 'entreprise' && parts[0] === 'entreprise' && currentArgs[1] === parts[1];
    render(parts[0], parts);
    if (fromUser && !sameCompany) {
      // Nouvelle vue : on remonte en haut de l'espace et on place le lecteur d'écran sur le titre
      var top = shell.getBoundingClientRect().top + window.pageYOffset - 110;
      if (window.pageYOffset > top) window.scrollTo(0, Math.max(0, top));
      var view = shell.querySelector('.inv-view:not([hidden])');
      var h = view && view.querySelector('[tabindex="-1"]');
      if (h && !keepFocus) h.focus({ preventScroll: true });
    }
    keepFocus = false;
  }
  // Redessine la vue en cours en gardant le focus sur le même contrôle
  var FOCUS_KEYS = ['data-filter', 'data-sector', 'data-opptype', 'data-scoresector', 'data-follow', 'data-interest', 'data-request'];
  function rerender() {
    if (!active || !currentView) return;
    var el = document.activeElement, key = null;
    if (el && shell.contains(el)) {
      FOCUS_KEYS.forEach(function (k) { if (!key && el.hasAttribute(k)) key = '[' + k + '="' + el.getAttribute(k) + '"]'; });
    }
    render(currentView, currentArgs.length ? currentArgs : [currentView]);
    var again = key && shell.querySelector(key);
    if (again) again.focus({ preventScroll: true });
  }

  // ------------------------------------------------------------ actions dans les vues
  var toastEl = document.createElement('div');
  toastEl.className = 'inv-toast';
  toastEl.setAttribute('role', 'status');
  toastEl.setAttribute('aria-live', 'polite');
  document.body.appendChild(toastEl);
  var toastTimer;
  function toast(html) {
    toastEl.innerHTML = html;
    toastEl.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('on'); }, 4200);
  }

  var modal = document.createElement('div');
  modal.className = 'inv-modal';
  modal.hidden = true;
  modal.innerHTML = '<div class="inv-dialog" role="dialog" aria-modal="true" aria-labelledby="inv-modal-title"><h2 id="inv-modal-title"></h2><div class="inv-dialog-body"></div>' +
    '<div class="inv-dialog-actions"><button type="button" class="btn btn-outline btn-sm" data-close>' + t('Annuler', 'Cancel') + '</button>' +
    '<button type="button" class="btn btn-primary btn-sm" data-confirm>' + t('Envoyer', 'Send') + '</button></div></div>';
  document.body.appendChild(modal);
  var modalFor = null, lastFocus = null;
  function openInterest(id) {
    var c = BY_ID[id];
    modalFor = id;
    lastFocus = document.activeElement;
    modal.querySelector('h2').innerHTML = t('Manifester mon intérêt', 'Express interest');
    modal.querySelector('.inv-dialog-body').innerHTML = '<p>' + t('KAME transmettra votre intérêt à ', 'KAME will pass your interest on to ') + '<strong>' + esc(c.name) + '</strong>' +
      t(' et organisera la mise en relation. Aucun paiement ne passe par la plateforme.', ' and arrange an introduction. No payment goes through the platform.') + '</p>' +
      '<label class="inv-field"><span>' + t('Message (facultatif)', 'Message (optional)') + '</span><textarea rows="3" maxlength="600"></textarea></label>' +
      '<p class="inv-foot-note">' + t('Démonstration : rien n\'est envoyé pour le moment.', 'Demo: nothing is sent for now.') + '</p>';
    modal.hidden = false;
    modal.querySelector('textarea').focus();
  }
  function closeModal() { modal.hidden = true; modalFor = null; if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  modal.addEventListener('click', function (e) {
    if (e.target === modal || e.target.closest('[data-close]')) closeModal();
    else if (e.target.closest('[data-confirm]')) {
      var c = BY_ID[modalFor];
      state.interest[modalFor] = true;
      closeModal();
      rerender();
      toast(ic('ok', 18, 2.4) + '<span>' + t('Démo : votre intérêt pour ' + c.name + ' est noté. En version réelle, KAME vous mettra en relation.',
        'Demo: your interest in ' + c.name + ' is noted. In the live version, KAME will put you in touch.') + '</span>');
    }
  });

  shell.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b || !shell.contains(b)) return;
    if (b.hasAttribute('data-sector')) { state.sector = b.getAttribute('data-sector'); rerender(); return; }
    if (b.hasAttribute('data-opptype')) { state.oppType = b.getAttribute('data-opptype'); rerender(); return; }
    if (b.hasAttribute('data-scoresector')) { state.scoreSector = b.getAttribute('data-scoresector'); rerender(); return; }
    if (b.hasAttribute('data-follow')) {
      var id = b.getAttribute('data-follow'), i = state.followed.indexOf(id);
      if (i >= 0) state.followed.splice(i, 1); else state.followed.push(id);
      rerender();
      toast(ic('bookmark', 18, 2.2) + '<span>' + (i >= 0 ? t('Vous ne suivez plus ' + BY_ID[id].name + '.', 'You no longer follow ' + BY_ID[id].name + '.') :
        t('Vous suivez maintenant ' + BY_ID[id].name + '.', 'You now follow ' + BY_ID[id].name + '.')) + '</span>');
      return;
    }
    if (b.hasAttribute('data-interest')) { if (!state.interest[b.getAttribute('data-interest')]) openInterest(b.getAttribute('data-interest')); return; }
    if (b.hasAttribute('data-request')) {
      state.requested[b.getAttribute('data-request')] = true;
      rerender();
      toast(ic('ok', 18, 2.4) + '<span>' + t('Démo : demande d\'accès notée. En version réelle, l\'entreprise décide de l\'accorder.',
        'Demo: access request noted. In the live version, the company decides whether to grant it.') + '</span>');
      return;
    }
    if (b.hasAttribute('data-open-notifs')) {
      // Le clic ne doit pas atteindre le document, qui refermerait aussitôt le panneau
      e.stopPropagation();
      window.scrollTo(0, 0);
      openPanel('notifs');
    }
  });
  shell.addEventListener('change', function (e) {
    var f = e.target.getAttribute && e.target.getAttribute('data-filter');
    if (f && f !== 'q') { state[f] = e.target.value; rerender(); }
    if (e.target.hasAttribute && e.target.hasAttribute('data-verify')) verifyFile(e.target);
  });
  var qTimer;
  shell.addEventListener('input', function (e) {
    if (e.target.getAttribute && e.target.getAttribute('data-filter') === 'q') {
      state.q = e.target.value;
      syncSearch(e.target);
      clearTimeout(qTimer);
      qTimer = setTimeout(function () { refreshList(); }, 180);
    }
  });
  // Ne redessine que la liste, pour garder le curseur dans la recherche
  function refreshList() {
    if (currentView !== 'annuaire') return;
    var view = shell.querySelector('.inv-view[data-view="annuaire"]');
    var tmp = document.createElement('div');
    tmp.innerHTML = viewAnnuaire();
    var newGrid = tmp.querySelector('.inv-companies, .inv-empty');
    var oldGrid = view.querySelector('.inv-companies, .inv-empty');
    var newHead = tmp.querySelector('.inv-view-head p'), oldHead = view.querySelector('.inv-view-head p');
    if (oldGrid && newGrid) oldGrid.replaceWith(newGrid);
    if (oldHead && newHead) oldHead.innerHTML = newHead.innerHTML;
  }

  function verifyFile(input) {
    var out = shell.querySelector('.inv-verify-result');
    var file = input.files && input.files[0];
    if (!file || !out) return;
    if (!(window.crypto && crypto.subtle)) {
      out.innerHTML = '<p class="inv-chip warn">' + t('Votre navigateur ne permet pas ce calcul.', 'Your browser cannot compute this.') + '</p>';
      return;
    }
    out.innerHTML = '<p class="inv-meta">' + t('Calcul de l\'empreinte…', 'Computing the fingerprint…') + '</p>';
    file.arrayBuffer().then(function (buf) { return crypto.subtle.digest('SHA-256', buf); }).then(function (h) {
      var hx = Array.prototype.map.call(new Uint8Array(h), function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
      var match = null;
      COMPANIES.forEach(function (c) { c.events.forEach(function (e) { if (e.hash === hx) match = { c: c, e: e }; }); });
      out.innerHTML = match ?
        '<div class="inv-verify ok">' + ic('shield', 22, 2) + '<div><strong>' + t('Document authentique', 'Authentic document') + '</strong><span>' + t(match.e.fr, match.e.en) + ' · ' + esc(match.c.name) + ' · ' +
          t(match.e.when.fr, match.e.when.en) + '</span><code>' + hx + '</code></div></div>' :
        '<div class="inv-verify ko">' + ic('info', 22, 2) + '<div><strong>' + t('Document non reconnu', 'Document not recognised') + '</strong><span>' +
          t('Cette empreinte ne figure pas dans le registre : le document n\'y a jamais été enregistré, ou il a été modifié.', 'This fingerprint is not in the registry: the document was never recorded, or it has been changed.') +
          '</span><code>' + hx + '</code></div></div>';
    }).catch(function () {
      out.innerHTML = '<p class="inv-chip warn">' + t('Impossible de lire ce fichier.', 'This file cannot be read.') + '</p>';
    });
  }

  // ------------------------------------------------------------ bandeau : recherche, notifications, menu du compte
  var header = document.querySelector('.member-header');
  var panels = {
    notifs: { btn: header && header.querySelector('.mh-bell'), el: document.getElementById('mh-notifs') },
    menu: { btn: header && header.querySelector('.mh-me'), el: document.getElementById('mh-menu') }
  };
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
      p.el.innerHTML = '<p class="mh-panel-title">' + t('Notifications', 'Notifications') + '</p><ul class="inv-notifs">' + notifications().map(notifItem).join('') + '</ul>';
      state.read = true;
      var cnt = document.querySelector('[data-notif-count]');
      if (cnt) cnt.hidden = true;
    }
    p.el.hidden = !open;
    if (p.btn) p.btn.setAttribute('aria-expanded', String(open));
    if (open && toggle === undefined) { var first = p.el.querySelector('a, button'); if (first) first.focus(); }
  }
  if (panels.menu.btn) panels.menu.btn.addEventListener('click', function () { openPanel('menu', true); });
  if (panels.notifs.btn) panels.notifs.btn.addEventListener('click', function () { openPanel('notifs', true); });
  document.addEventListener('click', function (e) {
    if (e.target.closest('.mh-pop')) {
      if (e.target.closest('.mh-panel a, .mh-panel [data-space-role]')) closePanels();
      return;
    }
    closePanels();
  });
  document.addEventListener('keydown', function (e) {
    // Tabulation gardée dans la fenêtre « Manifester mon intérêt » tant qu'elle est ouverte
    if (e.key === 'Tab' && !modal.hidden) {
      var f = modal.querySelectorAll('textarea, button');
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

  var searches = [document.getElementById('mh-q'), document.getElementById('inv-q2')].filter(Boolean);
  function syncSearch(src) {
    searches.forEach(function (s) { if (s !== src) s.value = state.q; });
    shell.querySelectorAll('[data-filter="q"]').forEach(function (s) { if (s !== src) s.value = state.q; });
  }
  // Recherche du bandeau : ouvre l'annuaire sans sortir le curseur du champ
  searches.forEach(function (s) {
    s.addEventListener('input', function () {
      state.q = s.value;
      syncSearch(s);
      if (currentView !== 'annuaire') { keepFocus = true; location.hash = '#annuaire'; }
      else { clearTimeout(qTimer); qTimer = setTimeout(refreshList, 180); }
    });
    var form = s.closest('form');
    if (form) form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (currentView !== 'annuaire') { keepFocus = true; location.hash = '#annuaire'; }
    });
  });

  // ------------------------------------------------------------ démarrage
  function start() {
    if (active || !shell || shell.hidden) return;
    active = true;
    var cnt = document.querySelector('[data-notif-count]');
    if (cnt && !state.read) { cnt.textContent = String(notifications().length); cnt.hidden = false; }
    route(false);
  }
  if (shell) {
    window.addEventListener('hashchange', function () { if (active && !shell.hidden) route(true); });
    document.addEventListener('kame:investor', function () { active = false; start(); });
    if (window.KAME_SPACE && root.classList.contains('inv-on')) start();
    // Langue changée : les listes déroulantes et les textes calculés sont redessinés
    new MutationObserver(function () { rerender(); }).observe(root, { attributes: true, attributeFilter: ['lang'] });
  }
})();
