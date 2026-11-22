/* KAME GROUP — espace investisseur.
   Version de démonstration : les entreprises, montants et scores sont fictifs et restent dans ce fichier.
   Aucune donnée n'est envoyée : suivre, manifester son intérêt ou vérifier un document se passe dans le navigateur. */
(function () {
  'use strict';

  var shell = document.getElementById('space-investor');
  var U = window.KAME_UI;
  if (!shell || !U) return;
  var root = document.documentElement;

  // ------------------------------------------------------------ outils communs (kame-ui.js)
  var esc = U.esc, t = U.t, L = U.L, ic = U.ic, plain = U.plain, num = U.num, money = U.money, millions = U.millions, pct = U.pct,
      clamp = U.clamp, rng = U.rng, hex = U.hex, LAST12 = U.LAST12, dateLabel = U.dateLabel, daysAgo = U.daysAgo,
      level = U.level, lvChip = U.lvChip, trendTag = U.trendTag, hexIcon = U.hexIcon, card = U.card, seeAll = U.seeAll, heading = U.heading,
      kpi = U.kpi, notifItem = U.notifItem, lineChart = U.lineChart, spark = U.spark, donut = U.donut, bars = U.bars, toast = U.toast,
      openModal = U.openModal, modal = U.modal, sectorName = U.sectorName;
  function gauge(c) { return U.gauge(c.score); }

  // ------------------------------------------------------------ données de démonstration (fictives)
  var SECTORS = U.SECTORS, SECTOR_ORDER = U.SECTOR_ORDER;

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

  var SECTOR_GROWTH = U.SECTOR_GROWTH;

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

  // Demandes d'information : l'investisseur demande, KAME vérifie la demande et la transmet, l'entreprise répond,
  // KAME vérifie le document. Les données personnelles des employés ne peuvent pas être demandées.
  var REQ_ITEMS = [
    { id: 'cnss', fr: 'Attestation CNSS (cotisations sociales à jour)', en: 'CNSS certificate (social contributions up to date)' },
    { id: 'etats-certifies', fr: 'États financiers certifiés par un expert-comptable', en: 'Financial statements certified by an accountant' },
    { id: 'contrat-client', fr: 'Contrat ou bon de commande d\'un client important', en: 'Contract or purchase order from a major customer' },
    { id: 'assurance', fr: 'Attestation d\'assurance', en: 'Insurance certificate' },
    { id: 'dettes', fr: 'Liste des prêts et dettes en cours', en: 'List of current loans and debts' },
    { id: 'local', fr: 'Titre de propriété ou bail du local', en: 'Property title or lease for the premises' }
  ];
  var REQ_BY_ID = {};
  REQ_ITEMS.forEach(function (x) { REQ_BY_ID[x.id] = x; });
  var REQ_STEPS = [
    ['envoyee', 'Envoyée', 'Sent', 'KAME vérifie la demande', 'KAME checks the request'],
    ['transmise', 'Transmise à l\'entreprise', 'Sent to the business', 'L\'entreprise accepte ou refuse', 'The business accepts or declines'],
    ['recue', 'Document reçu', 'Document received', 'KAME vérifie le document', 'KAME verifies the document'],
    ['verifiee', 'Vérifié et ajouté', 'Verified and added', 'Visible dans les documents', 'Visible in the documents']
  ];
  var REQ_ORDER = REQ_STEPS.map(function (x) { return x[0]; });

  // Transparence (fictif) : [demandes reçues, réponses, délai moyen en jours, documents vérifiés].
  // Même calcul pour toutes les entreprises : taux de réponse 60 %, rapidité 25 %, documents vérifiés 15 % ;
  // un refus motivé compte comme une réponse ; sans aucune demande reçue, le critère ne compte pas encore.
  var TRANSP = {
    'okoume-data': [4, 4, 2, 3], 'mvett-paiements': [5, 5, 3, 4], 'ndjole-agro': [3, 2, 6, 1], 'franceville-sante': [2, 2, 4, 2],
    'mitzic-cacao': [1, 1, 9, 1], 'akanda-logistique': [3, 3, 5, 1], 'ivindo-solaire': [2, 1, 12, 1], 'ogooue-marches': [0, 0, 0, 0],
    'nyonie-peche': [1, 1, 2, 1], 'oyem-boutiques': [0, 0, 0, 0], 'moanda-materiaux': [4, 2, 13, 0]
  };
  function transparency(c) {
    var x = TRANSP[c.id] || [0, 0, 0, 0];
    var d = { received: x[0], answered: x[1], days: x[2], docs: x[3], score: null };
    if (d.received) {
      var speed = d.days <= 3 ? 1 : (d.days >= 14 ? 0 : (14 - d.days) / 11);
      d.score = Math.round(60 * d.answered / d.received + 25 * speed + 15 * Math.min(d.docs, 5) / 5);
    }
    return d;
  }

  // Portefeuille déclaré par l'investisseur (investissements faits en dehors de la plateforme)
  var PORTFOLIO = [
    { company: 'okoume-data', invested: 8e6, perf: 18 }, { company: 'mvett-paiements', invested: 6e6, perf: 22 },
    { company: 'ndjole-agro', invested: 5e6, perf: 9 }, { company: 'mitzic-cacao', invested: 3e6, perf: 11 },
    { company: 'franceville-sante', invested: 3e6, perf: 5 }
  ];
  var state = {
    followed: ['okoume-data', 'mvett-paiements', 'ndjole-agro', 'mitzic-cacao', 'franceville-sante', 'ivindo-solaire', 'akanda-logistique', 'ogooue-marches'],
    interest: {}, requested: {}, unread: null, notifs: [],
    q: '', sector: '', city: '', level: '', sort: 'score', oppType: '', scoreSector: '', reqFilter: '',
    // Demandes déjà faites par l'investisseur (démo) : une vérifiée, une refusée avec un motif, une chez l'entreprise
    requests: [
      { id: 'r1', company: 'mvett-paiements', item: 'cnss', note: '', status: 'verifiee', sent: daysAgo(9), answered: daysAgo(6), visibility: 'all' },
      { id: 'r2', company: 'akanda-logistique', item: 'contrat-client', note: '', status: 'refusee', stoppedAt: 'transmise', by: 'entreprise',
        sent: daysAgo(12), answered: daysAgo(8),
        reason: { fr: 'Contrat confidentiel avec un client public. L\'entreprise propose à la place une attestation de service fait, signée par ce client.',
                  en: 'Confidential contract with a public-sector client. The business offers instead a certificate of completed work, signed by that client.' } },
      { id: 'r3', company: 'ndjole-agro', item: 'etats-certifies', note: '', status: 'transmise', sent: daysAgo(2) }
    ]
  };
  var invested = PORTFOLIO.reduce(function (s, p) { return s + p.invested; }, 0);
  var valueNow = PORTFOLIO.reduce(function (s, p) { return s + p.invested * (1 + p.perf / 100); }, 0);
  var valueHist = (function () {
    var r = rng('portefeuille');
    return LAST12.map(function (m, i) { return i === 11 ? valueNow : (invested + (valueNow - invested) * i / 11) * (0.985 + r() * 0.03); });
  })();

  function notifications() {
    var o = BY_ID['okoume-data'], iv = BY_ID['ivindo-solaire'], mc = BY_ID['mitzic-cacao'];
    return state.notifs.concat([
      { icon: 'ok', go: '#demandes', when: ['Il y a 20 min', '20 min ago'],
        fr: 'Mvett Paiements a répondu à votre demande : l\'attestation CNSS est vérifiée et ajoutée à ses documents.',
        en: 'Mvett Paiements answered your request: the CNSS certificate is verified and added to its documents.' },
      { icon: 'score', go: '#entreprise/okoume-data/score', when: ['Il y a 1 h', '1 h ago'],
        fr: 'Le KAME Score de ' + o.name + ' est passé à ' + o.score + '/100 (+' + o.trend + ' pts).',
        en: o.name + "'s KAME Score rose to " + o.score + '/100 (+' + o.trend + ' pts).' },
      { icon: 'target', go: '#opportunites', when: ['Il y a 3 h', '3 h ago'],
        fr: 'Nouvelle opportunité : ' + iv.name + ' recherche ' + money(60e6) + '.',
        en: 'New opportunity: ' + iv.name + ' is seeking ' + money(60e6) + '.' },
      { icon: 'file', go: '#entreprise/mitzic-cacao/documents', when: ['Il y a 1 j', '1 d ago'],
        fr: 'Un nouveau document est disponible pour ' + mc.name + '.', en: 'A new document is available for ' + mc.name + '.' }
    ]);
  }
  function addNotif(n) {
    state.notifs.unshift(n);
    state.unread = (state.unread || 0) + 1;
    updateBadges();
  }
  // Pastilles : notifications non lues (cloche, via kame-ui.js) et demandes en cours (menu de gauche)
  var notifier = {
    list: function () { return notifications(); },
    unread: function () { return state.unread || 0; },
    markRead: function () { state.unread = 0; }
  };
  function updateBadges() {
    if (active) U.updateBell();
    var pending = state.requests.filter(function (r) { return r.status !== 'verifiee' && r.status !== 'refusee'; }).length;
    var rc = shell.querySelector('[data-req-count]');
    if (rc) { rc.textContent = String(pending); rc.hidden = !pending; }
  }

  // ------------------------------------------------------------ petits éléments réutilisables
  function scoreBadge(c, big) {
    return '<span class="inv-score' + (big ? ' big' : '') + '"><strong>' + c.score + '</strong>/100 ' + lvChip(c.score) + '</span>';
  }
  function verified() { return '<span class="inv-verified" title="' + esc(L('Entreprise vérifiée par KAME ID', 'Company verified by KAME ID')) + '">' + ic('shield', 15, 2) + t('Vérifiée', 'Verified') + '</span>'; }
  function disclaimer() {
    return '<p class="inv-disclaimer">' + ic('info', 16, 2) + t('Indicateurs fournis à titre d\'information, ne constituent pas un conseil en investissement. Entreprises et chiffres fictifs (démonstration).',
      'Indicators provided for information only; they are not investment advice. Fictitious companies and figures (demo).') + '</p>';
  }

  // ------------------------------------------------------------ vues
  var VIEWS = ['accueil', 'annuaire', 'opportunites', 'portefeuille', 'demandes', 'score', 'data', 'registre', 'profil', 'entreprise'];
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
      '<div class="co-actions">' + followBtn(c, state.followed.indexOf(c.id) >= 0) + askBtn(c, 'btn-outline') +
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
      var tr = transparency(c);
      body = '<div class="inv-grid g-two">' + card(t('KAME Score', 'KAME Score'), gauge(c) + '<p class="inv-center">' + trendTag(c.trend) + ' ' + t('en un mois', 'in one month') + '</p>' +
        lineChart([{ values: c.scoreHist, color: level(c.score).c }], { h: 150, fmt: function (v) { return String(Math.round(v)); }, label: L('Évolution du KAME Score', 'KAME Score history') })) +
        card(t('Ce qui compose le score', 'What makes up the score'), bars(c.sub.map(function (x) { return { label: t(x[0], x[1]), pct: x[2], value: x[2] + '/100', color: level(x[2]).c }; })
          .concat([tr.score === null ? { label: t('Transparence', 'Transparency'), pct: 0, value: t('Pas encore évaluée', 'Not rated yet'), color: '#9AA9AE' }
                                     : { label: t('Transparence', 'Transparency'), pct: tr.score, value: tr.score + '/100', color: level(tr.score).c }])) +
          '<p class="inv-foot-note">' + t('Calculé à partir des données que l\'entreprise partage avec son accord, de la même façon pour toutes les entreprises. Mis à jour chaque mois.',
            'Computed from data the company shares with its consent, the same way for every business. Updated monthly.') + '</p>') +
        card(ic('file', 20, 2) + t('Transparence : réponses aux demandes des investisseurs', 'Transparency: answers to investor requests'),
          (tr.score === null ?
            '<p>' + t('Cette entreprise n\'a encore reçu aucune demande d\'information : ce critère ne compte pas encore dans son score.',
              'This business has not received any information request yet: this criterion does not count in its score yet.') + '</p>' :
            '<dl class="inv-facts wide">' +
            '<div><dt>' + t('Demandes reçues', 'Requests received') + '</dt><dd>' + tr.received + '</dd></div>' +
            '<div><dt>' + t('Réponses', 'Answers') + '</dt><dd>' + tr.answered + ' (' + pct(Math.round(tr.answered / tr.received * 100)) + ')</dd></div>' +
            '<div><dt>' + t('Délai moyen de réponse', 'Average response time') + '</dt><dd>' + t(tr.days + (tr.days > 1 ? ' jours' : ' jour'), tr.days + (tr.days > 1 ? ' days' : ' day')) + '</dd></div>' +
            '<div><dt>' + t('Documents vérifiés', 'Verified documents') + '</dt><dd>' + tr.docs + '</dd></div></dl>') +
          '<p class="inv-foot-note">' + t('Même calcul pour toutes les entreprises : taux de réponse, rapidité et documents vérifiés par KAME. Un refus motivé compte comme une réponse : une entreprise n\'est jamais obligée de tout donner.',
            'Same calculation for every business: response rate, speed and documents verified by KAME. A refusal with a reason counts as an answer: a business is never forced to share everything.') + '</p>' +
          '<div>' + askBtn(c, 'btn-primary') + '</div>', '', 'wide') + '</div>';
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
      }).join('') + state.requests.filter(function (r) { return r.company === c.id && r.status !== 'refusee'; }).map(function (r) {
        var done = r.status === 'verifiee';
        return '<li class="' + (done ? 'doc-added' : 'doc-pending') + '">' + hexIcon(done ? 'shield' : 'clock', done ? '#0E7C75' : '#C98A1E') +
          '<span><strong>' + reqName(r) + '</strong><span class="inv-meta">' +
          (done ? t('Ajouté à la suite de votre demande, vérifié par KAME · ', 'Added after your request, verified by KAME · ') +
                  (r.visibility === 'all' ? t('visible par tous les investisseurs', 'visible to all investors') : t('visible par vous seulement', 'visible to you only'))
                : t('Votre demande est en cours : ', 'Your request is in progress: ') + reqStatusText(r)) + '</span></span>' +
          (done ? '<span class="inv-chip ok">' + t('Vérifié', 'Verified') + '</span>' : '<a class="inv-chip warn" href="#demandes">' + t('Suivre', 'Track') + '</a>') + '</li>';
      }).join('') + '</ul>' +
        '<div class="inv-ask-more">' + ic('info', 18, 2) + '<p>' + t('Il vous manque une information ? Demandez-la : KAME vérifie la demande et la transmet à l\'entreprise, qui peut accepter ou refuser.',
          'Missing something? Ask for it: KAME checks the request and passes it on to the business, which can accept or decline.') + '</p>' + askBtn(c, 'btn-outline') + '</div>');
    }
    return head + tabsHtml + '<div class="inv-tabpanel">' + body + '</div>' +
      '<p class="inv-disclaimer">' + ic('info', 16, 2) + t('Entreprise fictive, présentée pour la démonstration. Les indicateurs ne constituent pas un conseil en investissement.',
        'Fictitious company shown for the demo. Indicators are not investment advice.') + '</p>';
  }

  // ------------------------------------------------------------ demandes d'information
  function askBtn(c, style) {
    return '<button type="button" class="btn ' + style + ' btn-sm" data-ask="' + c.id + '">' + ic('file', 16, 2) + t('Demander une information', 'Request information') + '</button>';
  }
  function reqName(r) {
    if (r.item === 'autre') return t(r.custom, r.custom);
    var x = REQ_BY_ID[r.item];
    return t(x.fr, x.en);
  }
  function reqStatusText(r) {
    return {
      envoyee: t('KAME vérifie la demande', 'KAME is checking the request'),
      transmise: t('chez l\'entreprise', 'with the business'),
      recue: t('KAME vérifie le document', 'KAME is verifying the document'),
      verifiee: t('vérifié', 'verified'),
      refusee: t('refusée', 'declined')
    }[r.status];
  }
  function reqChip(r) {
    if (r.status === 'verifiee') return '<span class="inv-chip ok">' + ic('shield', 14, 2.2) + t('Vérifié', 'Verified') + '</span>';
    if (r.status === 'refusee') return '<span class="inv-chip ko">' + t('Refusée', 'Declined') + '</span>';
    return '<span class="inv-chip warn">' + ic('clock', 14, 2.2) + t('En cours', 'In progress') + '</span>';
  }
  function reqCard(r) {
    var c = BY_ID[r.company];
    var refused = r.status === 'refusee';
    var reached = REQ_ORDER.indexOf(refused ? r.stoppedAt : r.status);
    var steps = REQ_STEPS.map(function (st, i) {
      var cls = i < reached || (i === reached && (r.status === 'verifiee')) ? 'done' : (i === reached ? (refused ? 'stopped' : 'current') : '');
      return '<li class="' + cls + '"><span class="st-dot" aria-hidden="true">' + (cls === 'done' ? ic('ok', 12, 3) : '') + '</span><span class="st-txt"><strong>' + t(st[1], st[2]) +
        '</strong><span>' + t(st[3], st[4]) + '</span></span>' + (cls === 'current' ? '<span class="sr-only">' + t('(étape en cours)', '(current step)') + '</span>' : '') + '</li>';
    }).join('');
    return '<article class="inv-req' + (refused ? ' is-refused' : '') + '"><div class="req-top">' + hexIcon(SECTORS[c.sector].icon, SECTORS[c.sector].color) +
      '<div class="req-title"><h3>' + reqName(r) + '</h3><p class="inv-meta"><a href="#entreprise/' + c.id + '">' + esc(c.name) + '</a> · ' + t('demandée le ', 'requested on ') +
      t(r.sent.fr, r.sent.en) + '</p></div>' + reqChip(r) + '</div>' +
      (r.note ? '<p class="req-note">' + t('Votre message : ', 'Your message: ') + esc(r.note) + '</p>' : '') +
      '<ol class="req-steps">' + steps + '</ol>' +
      (refused ? '<div class="req-refused">' + ic('info', 18, 2) + '<div><strong>' + (r.by === 'kame' ? t('Refusée par KAME', 'Declined by KAME') : t('Refusée par l\'entreprise', 'Declined by the business')) +
        '</strong><span>' + t(r.reason.fr, r.reason.en) + '</span></div></div>' : '') +
      (r.status === 'verifiee' ? '<div class="req-actions"><a class="btn btn-outline btn-sm" href="#entreprise/' + c.id + '/documents">' + t('Voir le document', 'View the document') + '</a></div>' : '') +
      '</article>';
  }
  function viewDemandes() {
    var isPending = function (r) { return r.status !== 'verifiee' && r.status !== 'refusee'; };
    var counts = { '': state.requests.length, encours: state.requests.filter(isPending).length,
                   verifiee: state.requests.filter(function (r) { return r.status === 'verifiee'; }).length,
                   refusee: state.requests.filter(function (r) { return r.status === 'refusee'; }).length };
    var list = state.requests.filter(function (r) {
      return !state.reqFilter || (state.reqFilter === 'encours' ? isPending(r) : r.status === state.reqFilter);
    }).sort(function (a, b) { return b.sent.ts - a.sent.ts; });
    var chips = '<div class="inv-chips" role="group" aria-label="' + esc(L('Filtrer les demandes', 'Filter requests')) + '">' +
      [['', 'Toutes', 'All'], ['encours', 'En cours', 'In progress'], ['verifiee', 'Vérifiées', 'Verified'], ['refusee', 'Refusées', 'Declined']].map(function (o) {
        return '<button type="button" data-reqfilter="' + o[0] + '" aria-pressed="' + (state.reqFilter === o[0]) + '">' + t(o[1], o[2]) + ' <span class="chip-n">' + counts[o[0]] + '</span></button>';
      }).join('') + '</div>';
    var how = card(t('Comment ça marche', 'How it works'), '<ol class="inv-how">' + [
      ['Vous demandez', 'You ask', 'Sur la fiche d\'une entreprise, bouton « Demander une information ».', 'On a business page, "Request information" button.'],
      ['KAME vérifie la demande', 'KAME checks the request', 'Pas de demande abusive, ni de données personnelles des employés.', 'No abusive requests, no personal data about employees.'],
      ['L\'entreprise répond', 'The business answers', 'Elle envoie le document ou refuse en expliquant pourquoi.', 'It sends the document or declines with a reason.'],
      ['KAME vérifie le document', 'KAME verifies the document', 'Il apparaît dans ses documents avec le badge « Vérifié ».', 'It appears in its documents with the "Verified" badge.']
    ].map(function (x, i) { return '<li><span class="how-n">' + (i + 1) + '</span><span><strong>' + t(x[0], x[1]) + '</strong><span>' + t(x[2], x[3]) + '</span></span></li>'; }).join('') + '</ol>' +
      '<p class="inv-foot-note">' + t('Les réponses des entreprises comptent dans le critère Transparence de leur KAME Score, calculé de la même façon pour toutes.',
        'Business answers count in the Transparency criterion of their KAME Score, calculated the same way for all.') + '</p>');
    return heading('Mes demandes', 'My requests', t('Les documents et informations que vous avez demandés aux entreprises, et où en est chaque demande.',
      'The documents and information you have asked businesses for, and where each request stands.')) + chips +
      '<div class="inv-grid g-req"><div class="inv-reqs">' + (list.length ? list.map(reqCard).join('') :
        '<p class="inv-empty">' + t('Aucune demande ici. Ouvrez la fiche d\'une entreprise et cliquez sur « Demander une information ».',
          'No requests here. Open a business page and click "Request information".') + '</p>') + '</div>' + how + '</div>' + disclaimer();
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
      }).join('') + '</div><p>' + t('Le score combine la régularité des revenus, l\'historique de paiement, le niveau d\'endettement, l\'ancienneté, la conformité (identité et documents vérifiés) et la transparence (réponses aux demandes des investisseurs). Il est calculé à partir des données que chaque entreprise partage avec son accord, de la même façon pour toutes.',
        'The score combines revenue regularity, payment history, debt level, track record, compliance (verified identity and documents) and transparency (answers to investor requests). It is computed from the data each company shares with its consent, the same way for all.') + '</p>') + disclaimer();
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
    var LB = { investisseur: ['Investisseur', 'Investor'], entreprise: ['Entreprise', 'Business'], commercant: ['Commerçant', 'Merchant'], partenaire: ['Partenaire', 'Partner'] };
    var roles = (sp.roles || []).map(function (r) {
      var lb = LB[r];
      return '<span class="inv-tag">' + t(lb[0], lb[1]) + ' · <strong>' + esc(ids[r] || '') + '</strong></span>';
    }).join('');
    // Espaces demandés en plus (entreprise, commerçant…), en attente de validation par l'équipe KAME
    var pending = (sp.pending || []).map(function (r) {
      var lb = LB[r.role] || [r.role, r.role];
      var d = r.date ? new Date(r.date) : null;
      var when = d && !isNaN(d) ? U.fmtDate(d) : null;
      return '<li class="doc-pending">' + hexIcon('clock', '#C98A1E') + '<span><strong>' + t('Espace ' + lb[0].toLowerCase(), lb[1] + ' space') + (r.structure ? ' · ' + esc(r.structure) : '') +
        '</strong><span class="inv-meta">' + t('En attente de validation par l\'équipe KAME', 'Awaiting approval by the KAME team') + (when ? ' · ' + t('demandé le ' + when.fr, 'requested on ' + when.en) : '') +
        '</span></span><span class="inv-chip warn">' + t('En attente', 'Pending') + '</span></li>';
    }).join('');
    var spacesCard = card(t('Mes espaces', 'My spaces'), '<p>' + t('Avec le même compte et le même e-mail, ajoutez un espace entreprise, commerçant ou partenaire. L\'équipe KAME vérifie chaque demande avant d\'ouvrir l\'espace.',
        'With the same account and email, add a business, merchant or partner space. The KAME team checks each request before opening the space.') + '</p>' +
      (pending ? '<ul class="inv-docs">' + pending + '</ul>' : '') +
      '<div><button type="button" class="btn btn-outline btn-sm" data-add-space>' + ic('plus', 16, 2.2) + t('Ajouter un espace', 'Add a space') + '</button></div>');
    return heading('Mon profil', 'My profile') + '<div class="inv-grid g-two">' +
      card(t('Mon compte', 'My account'), '<div class="inv-me"><span class="mh-avatar big">' + esc((sp.firstName || 'K').charAt(0).toUpperCase()) + '</span><div><strong>' + esc(sp.fullName || sp.firstName || '') +
        '</strong><span class="inv-meta">' + esc(sp.email || '') + '</span><p class="co-badges"><span class="inv-chip ok">' + t('Membre validé', 'Approved member') + '</span>' + roles + '</p></div></div>' +
        (sp.structure || sp.ville ? '<dl class="inv-facts wide">' + (sp.structure ? '<div><dt>' + t('Structure', 'Organisation') + '</dt><dd>' + esc(sp.structure) + '</dd></div>' : '') +
          (sp.ville ? '<div><dt>' + t('Ville', 'City') + '</dt><dd>' + esc(sp.ville) + '</dd></div>' : '') + '</dl>' : '')) +
      spacesCard +
      card('KAME ID', '<p class="inv-kid">' + hexIcon('id', '#145B63') + '<span><strong>' + t('Vérification d\'identité', 'Identity verification') + '</strong><span class="inv-meta">' +
        t('Bientôt disponible : pièce d\'identité et selfie, pour obtenir votre badge « Identité vérifiée » et accéder aux données détaillées.',
          'Coming soon: ID document and selfie, to get your "Verified identity" badge and access detailed data.') + '</span></span></p>' +
        '<span class="inv-chip warn">' + t('Bientôt', 'Soon') + '</span>') +
      card(t('Préférences d\'investissement', 'Investment preferences'), '<p>' + t('Secteurs suivis', 'Sectors followed') + '</p><div class="inv-chips static">' +
        state.followed.map(function (id) { return BY_ID[id].sector; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).map(function (k) { return '<span>' + sectorName(k) + '</span>'; }).join('') + '</div>' +
        '<p class="inv-foot-note">' + t('Bientôt : choisissez vos secteurs et vos montants pour recevoir les opportunités qui vous correspondent.', 'Coming soon: choose your sectors and amounts to receive matching opportunities.') + '</p>') +
      card(t('Sécurité du compte', 'Account security'), '<ul class="inv-docs"><li>' + hexIcon('lock', '#145B63') + '<span><strong>' + t('Mot de passe', 'Password') + '</strong><span class="inv-meta">' +
        t('Pour le changer, utilisez « Mot de passe oublié » sur la page de connexion.', 'To change it, use "Forgot password" on the login page.') + '</span></span></li><li>' + hexIcon('shield', '#145B63') + '<span><strong>' +
        t('Double authentification', 'Two-step verification') + '</strong><span class="inv-meta">' + t('Bientôt disponible', 'Coming soon') + '</span></span></li></ul>', '', 'wide') + '</div>';
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
      case 'demandes': html = viewDemandes(); break;
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
  var FOCUS_KEYS = ['data-filter', 'data-sector', 'data-opptype', 'data-scoresector', 'data-reqfilter', 'data-ask', 'data-follow', 'data-interest', 'data-request'];
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
  // « Autre » : le champ pour préciser n'apparaît que si on le choisit
  modal.addEventListener('change', function (e) {
    if (e.target.name !== 'req-item') return;
    var other = modal.querySelector('[name="req-custom"]');
    if (!other) return;
    other.hidden = e.target.value !== 'autre';
    if (!other.hidden) other.focus();
  });

  function openInterest(id) {
    var c = BY_ID[id];
    openModal({
      title: t('Manifester mon intérêt', 'Express interest'),
      body: '<p>' + t('KAME transmettra votre intérêt à ', 'KAME will pass your interest on to ') + '<strong>' + esc(c.name) + '</strong>' +
        t(' et organisera la mise en relation. Aucun paiement ne passe par la plateforme.', ' and arrange an introduction. No payment goes through the platform.') + '</p>' +
        '<label class="inv-field"><span>' + t('Message (facultatif)', 'Message (optional)') + '</span><textarea rows="3" maxlength="600"></textarea></label>' +
        '<p class="inv-foot-note">' + t('Démonstration : rien n\'est envoyé pour le moment.', 'Demo: nothing is sent for now.') + '</p>',
      done: function () {
        state.interest[id] = true;
        rerender();
        toast(t('Démo : votre intérêt pour ' + c.name + ' est noté. En version réelle, KAME vous mettra en relation.',
          'Demo: your interest in ' + c.name + ' is noted. In the live version, KAME will put you in touch.'));
      }
    });
  }

  function openRequest(id) {
    var c = BY_ID[id];
    // Un document déjà demandé (en cours ou vérifié) ne peut pas être redemandé
    var taken = {};
    state.requests.forEach(function (r) { if (r.company === id && r.status !== 'refusee' && r.item !== 'autre') taken[r.item] = true; });
    var choices = REQ_ITEMS.map(function (x) {
      return '<label class="inv-choice' + (taken[x.id] ? ' is-taken' : '') + '"><input type="radio" name="req-item" value="' + x.id + '"' + (taken[x.id] ? ' disabled' : '') + '><span>' +
        t(x.fr, x.en) + (taken[x.id] ? ' <em>' + t('(déjà demandé)', '(already requested)') + '</em>' : '') + '</span></label>';
    }).join('') + '<label class="inv-choice"><input type="radio" name="req-item" value="autre"><span>' + t('Autre document ou information', 'Another document or information') + '</span></label>' +
      '<input type="text" class="inv-input" name="req-custom" maxlength="120" hidden aria-label="' + esc(L('Précisez le document ou l\'information', 'Specify the document or information')) +
      '" placeholder="' + esc(L('Précisez : par exemple, la liste des principaux fournisseurs', 'Specify: for example, the list of main suppliers')) + '">';
    openModal({
      title: t('Demander une information à ', 'Request information from ') + esc(c.name),
      confirm: t('Envoyer la demande', 'Send the request'),
      body: '<p>' + t('KAME vérifie chaque demande avant de la transmettre à l\'entreprise. L\'entreprise peut accepter ou refuser en expliquant pourquoi.',
          'KAME checks each request before passing it on to the business. The business can accept or decline with a reason.') + '</p>' +
        '<fieldset class="inv-choices"><legend>' + t('Que souhaitez-vous obtenir ?', 'What would you like to receive?') + '</legend>' + choices + '</fieldset>' +
        '<label class="inv-field"><span>' + t('Pourquoi en avez-vous besoin ? (facultatif)', 'Why do you need it? (optional)') + '</span><textarea name="req-note" rows="2" maxlength="400"></textarea></label>' +
        '<p class="inv-foot-note">' + t('Les données personnelles des employés ne peuvent pas être demandées. Démonstration : rien n\'est envoyé à l\'entreprise.',
          'Personal data about employees cannot be requested. Demo: nothing is sent to the business.') + '</p>',
      check: function () {
        var sel = modal.querySelector('[name="req-item"]:checked');
        if (!sel) return t('Choisissez un document ou une information.', 'Choose a document or piece of information.');
        if (sel.value === 'autre' && modal.querySelector('[name="req-custom"]').value.trim().length < 4) {
          return t('Précisez ce que vous souhaitez obtenir.', 'Specify what you would like to receive.');
        }
        return '';
      },
      // La fenêtre est seulement masquée à la fermeture : ses champs se lisent encore ici
      done: function () {
        sendRequest({ id: 'r' + Date.now(), company: id, item: modal.querySelector('[name="req-item"]:checked').value,
                      custom: modal.querySelector('[name="req-custom"]').value.trim(), note: modal.querySelector('[name="req-note"]').value.trim(),
                      status: 'envoyee', sent: daysAgo(0) });
      }
    });
  }

  // Démo : la demande passe « transmise » quelques secondes après, avec une notification
  function sendRequest(r) {
    var c = BY_ID[r.company];
    state.requests.unshift(r);
    updateBadges();
    rerender();
    toast(t('Demande envoyée. KAME la vérifie avant de la transmettre à ' + c.name + '. Suivez-la dans « Mes demandes ».',
      'Request sent. KAME checks it before passing it on to ' + c.name + '. Track it in "My requests".'));
    setTimeout(function () {
      if (r.status !== 'envoyee') return;
      r.status = 'transmise';
      addNotif({ icon: 'file', go: '#demandes', when: ['À l\'instant', 'Just now'],
        fr: 'Votre demande à ' + c.name + ' a été vérifiée par KAME et transmise à l\'entreprise.',
        en: 'Your request to ' + c.name + ' was checked by KAME and passed on to the business.' });
      if (currentView === 'demandes' || currentView === 'entreprise') rerender();
    }, 5000);
  }

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
      toast((i >= 0 ? t('Vous ne suivez plus ' + BY_ID[id].name + '.', 'You no longer follow ' + BY_ID[id].name + '.') :
        t('Vous suivez maintenant ' + BY_ID[id].name + '.', 'You now follow ' + BY_ID[id].name + '.')), 'bookmark');
      return;
    }
    if (b.hasAttribute('data-interest')) { if (!state.interest[b.getAttribute('data-interest')]) openInterest(b.getAttribute('data-interest')); return; }
    if (b.hasAttribute('data-ask')) { openRequest(b.getAttribute('data-ask')); return; }
    if (b.hasAttribute('data-reqfilter')) { state.reqFilter = b.getAttribute('data-reqfilter'); rerender(); return; }
    if (b.hasAttribute('data-request')) {
      state.requested[b.getAttribute('data-request')] = true;
      rerender();
      toast(t('Démo : demande d\'accès notée. En version réelle, l\'entreprise décide de l\'accorder.',
        'Demo: access request noted. In the live version, the company decides whether to grant it.'));
      return;
    }
    if (b.hasAttribute('data-open-notifs')) {
      // Le clic ne doit pas atteindre le document, qui refermerait aussitôt le panneau
      e.stopPropagation();
      window.scrollTo(0, 0);
      U.openPanel('notifs');
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
    out.innerHTML = '<p class="inv-meta">' + t('Calcul de l\'empreinte…', 'Computing the fingerprint…') + '</p>';
    U.fileHash(file).then(function (hx) {
      var match = null;
      COMPANIES.forEach(function (c) { c.events.forEach(function (e) { if (e.hash === hx) match = { c: c, e: e }; }); });
      out.innerHTML = match ?
        '<div class="inv-verify ok">' + ic('shield', 22, 2) + '<div><strong>' + t('Document authentique', 'Authentic document') + '</strong><span>' + t(match.e.fr, match.e.en) + ' · ' + esc(match.c.name) + ' · ' +
          t(match.e.when.fr, match.e.when.en) + '</span><code>' + hx + '</code></div></div>' :
        '<div class="inv-verify ko">' + ic('info', 22, 2) + '<div><strong>' + t('Document non reconnu', 'Document not recognised') + '</strong><span>' +
          t('Cette empreinte ne figure pas dans le registre : le document n\'y a jamais été enregistré, ou il a été modifié.', 'This fingerprint is not in the registry: the document was never recorded, or it has been changed.') +
          '</span><code>' + hx + '</code></div></div>';
    }).catch(function (er) {
      out.innerHTML = '<p class="inv-chip warn">' + (er && er.message === 'no-crypto' ? t('Votre navigateur ne permet pas ce calcul.', 'Your browser cannot compute this.') :
        t('Impossible de lire ce fichier.', 'This file cannot be read.')) + '</p>';
    });
  }

  // ------------------------------------------------------------ bandeau : recherche (menu et notifications : kame-ui.js)

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
    if (state.unread === null) state.unread = notifications().length;
    U.setNotifier(notifier);
    updateBadges();
    route(false);
  }
  if (shell) {
    window.addEventListener('hashchange', function () { if (active && !shell.hidden) route(true); });
    document.addEventListener('kame:investor', function () { active = false; currentView = ''; start(); });
    // Demande d'un nouvel espace envoyée : la page « Mon profil » affiche la demande en attente
    document.addEventListener('kame:spaces', function () { if (currentView === 'profil') rerender(); });
    if (window.KAME_SPACE && root.classList.contains('inv-on')) start();
    // Langue changée : les listes déroulantes et les textes calculés sont redessinés
    new MutationObserver(function () { rerender(); }).observe(root, { attributes: true, attributeFilter: ['lang'] });
  }
})();
