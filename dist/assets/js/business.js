/* KAME GROUP — espace entreprise et espace commerçant.
   Version de démonstration : les chiffres, clients, investisseurs et documents sont fictifs et calculés dans le navigateur.
   Rien n'est envoyé : un fichier choisi reste sur l'appareil, seule son empreinte numérique (SHA-256) est calculée.
   Un outil = une page ; KAME ID, KAME Check et KAME Registre ont deux onglets : « Pour mon entreprise » et « Pour mes clients ». */
(function () {
  'use strict';

  var shell = document.getElementById('space-business');
  var U = window.KAME_UI;
  if (!shell || !U) return;
  var root = document.documentElement;

  // ------------------------------------------------------------ outils communs (kame-ui.js)
  var esc = U.esc, t = U.t, L = U.L, ic = U.ic, plain = U.plain, num = U.num, money = U.money, millions = U.millions, pct = U.pct,
      clamp = U.clamp, rng = U.rng, hex = U.hex, NOW = U.NOW, LAST12 = U.LAST12, fmtDate = U.fmtDate, dateLabel = U.dateLabel,
      daysAgo = U.daysAgo, inDays = U.inDays, daysBetween = U.daysBetween, dateText = U.dateText, SECTORS = U.SECTORS, SECTOR_GROWTH = U.SECTOR_GROWTH,
      sectorName = U.sectorName, level = U.level, lvChip = U.lvChip, trendTag = U.trendTag, hexIcon = U.hexIcon, card = U.card, seeAll = U.seeAll,
      heading = U.heading, kpi = U.kpi, notifItem = U.notifItem, lineChart = U.lineChart, spark = U.spark, donut = U.donut, bars = U.bars,
      toast = U.toast, openModal = U.openModal, modal = U.modal;

  // Deux langues avec du HTML déjà sûr (noms échappés avant)
  function th(frHtml, enHtml) { return '<span class="t-fr">' + frHtml + '</span><span class="t-en" lang="en">' + enHtml + '</span>'; }
  function chip(cls, icon, fr, en) { return '<span class="inv-chip ' + cls + '">' + (icon ? ic(icon, 14, 2.2) : '') + t(fr, en) + '</span>'; }
  function fileBtn(attr, fr, en, accept, style) {
    return '<label class="btn ' + (style || 'btn-outline') + ' btn-sm btn-file">' + ic('upload', 16, 2) + t(fr, en) +
      '<input type="file" ' + attr + (accept ? ' accept="' + accept + '"' : '') + '></label>';
  }
  function kilo(n) { return num(n / 1000) + ' k'; }
  function pad(n, w) { var s = String(n); while (s.length < w) s = '0' + s; return s; }
  function disclaimer() {
    return '<p class="inv-disclaimer">' + ic('info', 16, 2) + t('Chiffres fictifs, présentés pour la démonstration. En version réelle, ils viennent des données que vous connectez à KAME, avec votre accord.',
      'Fictitious figures, shown for the demo. In the live version, they come from the data you connect to KAME, with your consent.') + '</p>';
  }
  function field(labelFr, labelEn, control, hintFr, hintEn) {
    return '<label class="inv-field"><span>' + t(labelFr, labelEn) + '</span>' + control + (hintFr ? '<small class="inv-meta">' + t(hintFr, hintEn) + '</small>' : '') + '</label>';
  }
  function input(name, attrs) { return '<input class="inv-input" name="' + name + '" ' + (attrs || '') + '>'; }
  function selectEl(name, opts, val, attrs) {
    return '<select class="inv-input" name="' + name + '" ' + (attrs || '') + '>' + opts.map(function (o) {
      return '<option value="' + esc(o[0]) + '"' + (o[0] === val ? ' selected' : '') + '>' + esc(L(o[1], o[2] || o[1])) + '</option>';
    }).join('') + '</select>';
  }

  // ------------------------------------------------------------ référentiels
  var VIEWS = ['e-accueil', 'e-entreprise', 'e-id', 'e-data', 'e-score', 'e-check', 'e-registre', 'e-garde', 'e-investisseurs', 'e-demandes',
               'e-levees', 'e-documents', 'e-agro'];
  // [adresse, clé de la vue, icône, texte FR, texte EN, options] ; 'label' : titre de groupe
  var NAV = {
    entreprise: [
      ['#e-accueil', 'e-accueil', 'home', 'Accueil', 'Home'],
      ['#e-entreprise', 'e-entreprise', 'building', 'Mon entreprise', 'My business'],
      ['label', 'Outils KAME', 'KAME tools'],
      ['#e-id', 'e-id', 'id', 'KAME ID', 'KAME ID', 'sub'],
      ['#e-data', 'e-data', 'data', 'KAME Data', 'KAME Data', 'sub'],
      ['#e-score', 'e-score', 'score', 'KAME Score', 'KAME Score', 'sub'],
      ['#e-check', 'e-check', 'check', 'KAME Check', 'KAME Check', 'sub'],
      ['#e-registre', 'e-registre', 'registre', 'KAME Registre', 'KAME Registre', 'sub'],
      ['#e-garde', 'e-garde', 'garde', 'KAME Garde', 'KAME Garde', 'sub'],
      ['#e-agro', 'e-agro', 'agro', 'KAME Agro', 'KAME Agro', 'sub agro'],
      ['label', 'Investisseurs', 'Investors'],
      ['#e-investisseurs', 'e-investisseurs', 'investor', 'Mes investisseurs', 'My investors'],
      ['#e-demandes', 'e-demandes', 'file', 'Demandes reçues', 'Requests received', 'count'],
      ['#e-levees', 'e-levees', 'target', 'Mes levées de fonds', 'My fundraising'],
      ['#e-documents', 'e-documents', 'lock', 'Documents', 'Documents']
    ],
    commercant: [
      ['#e-accueil', 'e-accueil', 'home', 'Accueil', 'Home'],
      ['#e-data', 'e-data', 'cart', 'Mes ventes', 'My sales'],
      ['#e-registre/clients', 'e-registre', 'receipt', 'Reçus clients', 'Customer receipts'],
      ['#e-id/clients', 'e-id', 'id', 'Vérifier un client', 'Verify a customer'],
      ['#e-score', 'e-score', 'score', 'Mon KAME Score', 'My KAME Score'],
      ['#e-levees', 'e-levees', 'target', 'Financement', 'Funding'],
      ['#e-demandes', 'e-demandes', 'file', 'Demandes reçues', 'Requests received', 'count'],
      ['label', 'Mon commerce', 'My shop'],
      ['#e-entreprise', 'e-entreprise', 'merchant', 'Ma boutique', 'My shop', 'sub'],
      ['#e-check', 'e-check', 'check', 'Conformité', 'Compliance', 'sub'],
      ['#e-documents', 'e-documents', 'lock', 'Documents', 'Documents', 'sub'],
      ['#e-garde', 'e-garde', 'garde', 'Sécurité', 'Security', 'sub'],
      ['#e-agro', 'e-agro', 'agro', 'KAME Agro', 'KAME Agro', 'sub agro']
    ]
  };

  // Documents qu'un investisseur ou un financeur peut demander (les données personnelles des employés sont exclues)
  var REQ_ITEMS = {
    cnss: ['Attestation CNSS (cotisations sociales à jour)', 'CNSS certificate (social contributions up to date)'],
    'etats-certifies': ['États financiers certifiés par un expert-comptable', 'Financial statements certified by an accountant'],
    dettes: ['Liste des prêts et dettes en cours', 'List of current loans and debts'],
    releves: ['Relevés Mobile Money des 6 derniers mois', 'Mobile Money statements for the last 6 months'],
    patente: ['Patente ou autorisation d\'exercer', 'Business licence or permit'],
    stock: ['Inventaire du stock', 'Stock inventory']
  };
  var VIS = { members: ['Membres vérifiés', 'Verified members'], request: ['Sur demande', 'On request'], private: ['Privé', 'Private'] };
  var TEAM_ROLES = {
    owner: ['Propriétaire', 'Owner', 'Tous les droits', 'Full access'],
    accountant: ['Comptable', 'Accountant', 'Voir les données et les documents', 'View data and documents'],
    sales: ['Commercial', 'Sales', 'Émettre des reçus, vérifier des clients', 'Issue receipts, verify customers'],
    viewer: ['Lecture seule', 'Read only', 'Voir le tableau de bord', 'View the dashboard']
  };
  var PAY = { momo: ['Mobile Money', 'Mobile Money', '#159E96'], cash: ['Espèces', 'Cash', '#B8734F'], transfer: ['Virement bancaire', 'Bank transfer', '#145B63'],
              card: ['Carte bancaire', 'Bank card', '#E0A030'] };
  var ID_REASONS = { compte: ['Ouverture d\'un compte client', 'Opening a customer account'], credit: ['Vente à crédit', 'Sale on credit'],
                     livraison: ['Livraison de valeur', 'High-value delivery'], autre: ['Autre', 'Other'] };
  var OPP_TYPES = { loan: ['Prêt', 'Loan'], equity: ['Prise de participation', 'Equity stake'], micro: ['Microcrédit (partenaire agréé)', 'Microcredit (licensed partner)'] };
  // Entreprises membres (fictives) que l'on peut vérifier avec KAME Check : nom, ville, secteur, score, RCCM, documents à jour, membre depuis
  var PARTNERS = [
    ['Okoumé Data Labs', 'Libreville', 'tech', 88, 'GA-LBV-2020-B-04512', true, 2024],
    ['Mvett Paiements', 'Libreville', 'fintech', 81, 'GA-LBV-2021-B-07733', true, 2024],
    ['Coopérative Agro de Ndjolé', 'Ndjolé', 'agriculture', 76, 'GA-NDJ-2017-C-00128', true, 2025],
    ['Franceville Santé Plus', 'Franceville', 'sante', 79, 'GA-FCV-2014-B-00961', true, 2025],
    ['Akanda Logistique', 'Akanda', 'services', 72, 'GA-LBV-2015-B-02210', false, 2024],
    ['Ogooué Marchés', 'Lambaréné', 'commerce', 67, 'GA-LAM-2016-B-00342', true, 2025],
    ['Nyonié Pêche et Froid', 'Port-Gentil', 'agriculture', 64, 'GA-POG-2016-B-01187', true, 2025],
    ['Moanda Matériaux', 'Moanda', 'industrie', 58, 'GA-MOA-2012-B-00075', false, 2024]
  ];
  // Document de démonstration du registre (le même que dans l'espace investisseur)
  var DEMO_DOC_HASH = '5f23d25d017feca22089b8f11ed06f3641368184c490ad72edcf1461c353104b';
  var DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'], DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  // KAME Agro : productions selon le type d'activité agricole
  var AGRO = {
    culture: [
      { fr: 'Manioc', en: 'Cassava', size: 4.5, unit: ['t', 't'], stageFr: 'En croissance', stageEn: 'Growing', inMonths: 2, expected: 36, stock: 3.2, cap: 8 },
      { fr: 'Banane plantain', en: 'Plantain', size: 2, unit: ['t', 't'], stageFr: 'Récolte en cours', stageEn: 'Harvesting', inMonths: 0, expected: 9, stock: 2.6, cap: 5 },
      { fr: 'Arachide', en: 'Groundnut', size: 1.5, unit: ['t', 't'], stageFr: 'Semis', stageEn: 'Sowing', inMonths: 4, expected: 3, stock: 0.7, cap: 3 }
    ],
    elevage: [
      { fr: 'Poulets de chair', en: 'Broiler chickens', size: 1200, unit: ['têtes', 'head'], stageFr: 'Engraissement', stageEn: 'Fattening', inMonths: 1, expected: 1150, stock: 380, cap: 1500 },
      { fr: 'Porcs', en: 'Pigs', size: 45, unit: ['têtes', 'head'], stageFr: 'Croissance', stageEn: 'Growing', inMonths: 3, expected: 40, stock: 12, cap: 60 },
      { fr: 'Œufs', en: 'Eggs', size: 300, unit: ['plateaux', 'trays'], stageFr: 'Production continue', stageEn: 'Ongoing production', inMonths: 0, expected: 300, stock: 85, cap: 200 }
    ],
    transformation: [
      { fr: 'Farine de manioc', en: 'Cassava flour', size: 6, unit: ['t', 't'], stageFr: 'Production continue', stageEn: 'Ongoing production', inMonths: 0, expected: 6, stock: 2.1, cap: 5 },
      { fr: 'Huile de palme', en: 'Palm oil', size: 1800, unit: ['L', 'L'], stageFr: 'Pressage', stageEn: 'Pressing', inMonths: 1, expected: 1800, stock: 640, cap: 2500 },
      { fr: 'Jus de fruits', en: 'Fruit juice', size: 900, unit: ['L', 'L'], stageFr: 'Mise en bouteille', stageEn: 'Bottling', inMonths: 0, expected: 900, stock: 210, cap: 1000 }
    ]
  };

  // ------------------------------------------------------------ l'entreprise (données de démonstration, reproductibles)
  var role = 'entreprise';
  var B = null, state = null;
  var cache = {};

  function build(info) {
    var com = info.role === 'commercant';
    var name = String(info.name || '').trim();
    var r = rng('biz:' + info.role + ':' + plain(name || '-'));
    var b = { generic: !name, name: name, role: info.role, com: com };
    b.nameFr = name || (com ? 'Mon commerce' : 'Mon entreprise');
    b.nameEn = name || (com ? 'My shop' : 'My business');
    b.sector = SECTORS[info.sector] ? info.sector : (com ? 'commerce' : 'services');
    b.city = String(info.city || '').trim() || 'Libreville';
    b.agro = !!info.agriculture || b.sector === 'agriculture';
    b.agroType = AGRO[info.agriType] ? info.agriType : 'culture';
    b.legal = com ? 'Entreprise individuelle' : 'SARL';
    b.since = NOW.getFullYear() - (2 + Math.floor(r() * 5));
    b.staff = com ? 1 + Math.floor(r() * 3) : 6 + Math.floor(r() * 18);

    // Chiffre d'affaires des 12 derniers mois, avec un mois en baisse (les baisses font partie de la vie d'une entreprise)
    var base = com ? 2.4e6 + r() * 1.4e6 : 12e6 + r() * 10e6;
    var g = 10 + r() * 9;
    var mom = Math.round((2.5 + r() * 4) * 10) / 10;
    var start = base / (1 + g / 100);
    var rev = LAST12.map(function (m, i) { return (start + (base - start) * i / 11) * (0.96 + r() * 0.07); });
    var dip = 5 + Math.floor(r() * 3);
    rev[dip] = rev[dip - 1] * (0.93 + r() * 0.02);
    rev[11] = base;
    rev[10] = base / (1 + mom / 100);
    b.rev = rev;
    b.mom = mom;
    b.g12 = (rev[11] / rev[0] - 1) * 100;
    var sg = SECTOR_GROWTH[b.sector];
    var avgEnd = base * (0.74 + r() * 0.14), avgStart = avgEnd / (1 + sg / 100);
    b.avg = LAST12.map(function (m, i) { return (avgStart + (avgEnd - avgStart) * i / 11) * (0.97 + r() * 0.06); });
    b.sectorGrowth = sg;
    b.changes = [];
    for (var i = 6; i < 12; i++) b.changes.push({ m: LAST12[i], v: (rev[i] / rev[i - 1] - 1) * 100 });
    b.clients = Math.round(com ? 160 + r() * 120 : 55 + r() * 70);
    b.clientsDelta = 3 + Math.floor(r() * 9);
    b.tickets = Math.round(b.clients * (com ? 3.4 : 1.7));
    b.basket = base / b.tickets;
    var mix = com ? [['momo', 50 + r() * 8], ['cash', 34 + r() * 6], ['card', 4 + r() * 3], ['transfer', 2 + r() * 3]]
                  : [['transfer', 40 + r() * 8], ['momo', 33 + r() * 8], ['cash', 9 + r() * 5], ['card', 5 + r() * 4]];
    var tot = mix.reduce(function (s, x) { return s + x[1]; }, 0);
    b.pay = mix.map(function (x) { return { k: x[0], v: x[1] / tot * 100 }; });
    // Ventes des 7 derniers jours (commerçant) : plus fortes le samedi, jour de marché
    b.week = [];
    var daily = base / 30;
    for (var k = 6; k >= 0; k--) {
      var dd = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() - k);
      var w = dd.getDay() === 6 ? 1.45 : (dd.getDay() === 0 ? 0.55 : 0.85 + r() * 0.3);
      b.week.push({ d: dd, v: daily * w });
    }
    b.weekTotal = b.week.reduce(function (s, x) { return s + x.v; }, 0);
    b.weekPrev = b.weekTotal / (1 + (2 + r() * 6) / 100);
    b.today = b.week[6].v;
    b.todayCount = Math.max(4, Math.round(b.today / b.basket));

    // KAME Score
    b.score = 72 + Math.floor(r() * 6);
    b.trend = 3;
    var sh = [];
    for (var j = 0; j < 11; j++) sh.push(clamp(Math.round(b.score - b.trend - (10 - j) * 0.45 + (r() - 0.5) * 1.6), 40, 99));
    sh.push(b.score);
    b.scoreHist = sh;
    b.sub = [
      ['Régularité des revenus', 'Revenue regularity', clamp(Math.round(b.score + 2 + r() * 8), 50, 95)],
      ['Historique de paiement', 'Payment history', clamp(Math.round(b.score + 4 + r() * 9), 50, 96)],
      ['Niveau d\'endettement', 'Debt level', clamp(Math.round(b.score - 12 + r() * 6), 45, 90)],
      ['Ancienneté', 'Track record', clamp(Math.round(48 + (NOW.getFullYear() - b.since) * 5 + r() * 6), 40, 95)],
      ['Conformité et identité', 'Compliance and identity', clamp(Math.round(84 + r() * 6), 80, 95)]
    ];
    b.betterThan = 55 + Math.floor(r() * 20);

    // Investisseurs (entreprise)
    b.followers = 23;
    b.followersHist = LAST12.map(function (m, i) { return Math.round(6 + (17 * Math.pow(i / 11, 1.3))); });
    b.views = 312;
    b.regHashes = [hex(r, 64), hex(r, 64), hex(r, 64), hex(r, 64), hex(r, 64)];
    b.receiptHashes = [hex(r, 64), hex(r, 64), hex(r, 64)];
    return b;
  }

  function initState() {
    var com = B.com;
    var s = {
      unread: null, notifs: [], reqFilter: '', idTab: '', alerts: true, director2: 'invited', showRev: 'range', showClients: true,
      profile: { desc: com ? L('Boutique de quartier : alimentation, produits du quotidien et recharges Mobile Money.', 'Neighbourhood shop: groceries, everyday goods and Mobile Money top-ups.')
                           : L('Nous accompagnons les entreprises et les particuliers de ' + B.city + ' avec des services fiables et des délais tenus.',
                               'We serve businesses and households in ' + B.city + ' with reliable services and on-time delivery.'),
                 staff: B.staff, since: B.since, legal: B.legal, web: '', phone: '', logo: '' },
      sources: [{ id: 'momo', on: true, sync: ['Il y a 2 h', '2 h ago'] }, { id: 'bank', on: !com, sync: ['Hier', 'Yesterday'] }, { id: 'caisse', on: true, manual: true, sync: ['Aujourd\'hui', 'Today'] }],
      share: null, pendingReg: null, checkQuery: '', checkResult: null, checks: [], verifyResult: null, lastReceipt: null,
      receiptSeq: 42, idUsage: com ? 12 : 37
    };
    // Demandes reçues des investisseurs ou des financeurs (déjà vérifiées par KAME)
    s.reqs = com ? [
      { id: 'q1', item: 'releves', from: ['une institution de microfinance', 'a microfinance institution'], city: 'Libreville', received: daysAgo(3), status: 'attente',
        note: ['Pour étudier votre demande de microcrédit.', 'To review your microcredit application.'] },
      { id: 'q2', item: 'patente', from: ['une banque', 'a bank'], city: 'Libreville', received: daysAgo(6), status: 'attente', note: null },
      { id: 'q3', item: 'stock', from: ['un investisseur particulier', 'an individual investor'], city: 'Oyem', received: daysAgo(20), answered: daysAgo(16), status: 'verifiee', visibility: 'all', note: null }
    ] : [
      { id: 'q1', item: 'cnss', from: ['un business angel', 'a business angel'], city: 'Libreville', received: daysAgo(3), status: 'attente',
        note: ['Je souhaite vérifier que les cotisations sociales sont à jour avant de proposer un prêt.', 'I would like to check that social contributions are up to date before offering a loan.'] },
      { id: 'q2', item: 'etats-certifies', from: ['un fonds d\'investissement', 'an investment fund'], city: 'Douala (Cameroun)', received: daysAgo(6), status: 'attente', note: null },
      { id: 'q3', item: 'dettes', from: ['un investisseur particulier', 'an individual investor'], city: 'Paris, diaspora', received: daysAgo(20), answered: daysAgo(16), status: 'verifiee', visibility: 'all', note: null }
    ];
    s.compliance = com ? [
      { id: 'rccm', fr: 'Immatriculation au RCCM (entreprise individuelle)', en: 'Trade register entry (sole proprietorship)', status: 'ok', checked: daysAgo(60) },
      { id: 'nif', fr: 'Numéro d\'identification fiscale (NIF)', en: 'Tax identification number (NIF)', status: 'ok', checked: daysAgo(60) },
      { id: 'patente', fr: 'Patente', en: 'Business licence', status: 'expiring', until: inDays(12) },
      { id: 'identite', fr: 'Pièce d\'identité du gérant', en: 'Manager\'s ID document', status: 'ok', until: inDays(900) },
      { id: 'local', fr: 'Bail ou autorisation d\'occupation du local', en: 'Lease or permit for the premises', status: 'missing' }
    ] : [
      { id: 'rccm', fr: 'Extrait du registre du commerce (RCCM)', en: 'Trade register extract (RCCM)', status: 'ok', checked: daysAgo(40) },
      { id: 'nif', fr: 'Numéro d\'identification fiscale (NIF)', en: 'Tax identification number (NIF)', status: 'ok', checked: daysAgo(40) },
      { id: 'fiscale', fr: 'Attestation de situation fiscale', en: 'Tax compliance certificate', status: 'ok', until: inDays(129) },
      { id: 'cnss', fr: 'Attestation CNSS', en: 'CNSS certificate', status: 'expiring', until: inDays(12) },
      { id: 'statuts', fr: 'Statuts de l\'entreprise', en: 'Articles of association', status: 'ok', checked: daysAgo(40) },
      { id: 'assurance', fr: 'Attestation d\'assurance (responsabilité civile)', en: 'Insurance certificate (liability)', status: 'missing' }
    ];
    s.clients = [
      { id: 'c1', name: 'Awa M.', phone: '+241 06 •• •• 21', reason: 'credit', status: 'verifiee', date: daysAgo(1) },
      { id: 'c2', name: 'Jean-Paul O.', phone: '+241 07 •• •• 58', reason: 'compte', status: 'verifiee', date: daysAgo(4) },
      { id: 'c3', name: com ? 'Restaurant Chez Mama' : 'Ndong et Fils SARL', phone: '+241 01 •• •• 90', reason: 'livraison', status: 'verifiee', date: daysAgo(9) },
      { id: 'c4', name: 'Grâce E.', phone: '+241 06 •• •• 07', reason: 'credit', status: 'expiree', date: daysAgo(12) }
    ];
    s.regs = [
      { fr: 'Immatriculation au RCCM', en: 'Trade register entry', when: dateLabel(26, 10), hash: B.regHashes[0] },
      { fr: com ? 'Bail du local signé' : 'Statuts mis à jour', en: com ? 'Premises lease signed' : 'Articles of association updated', when: dateLabel(14, 3), hash: B.regHashes[1] },
      { fr: 'Contrat fournisseur signé', en: 'Supplier contract signed', when: dateLabel(7, 18), hash: B.regHashes[2] },
      { fr: com ? 'Inventaire annuel du stock' : 'Bilan annuel 2025 déposé', en: com ? 'Annual stock inventory' : '2025 annual accounts filed', when: dateLabel(4, 28), hash: B.regHashes[3] },
      { fr: 'Livraison confirmée', en: 'Delivery confirmed', when: dateLabel(1, 12), hash: B.regHashes[4] }
    ].sort(function (a, b) { return b.when.ts - a.when.ts; });
    s.receipts = [
      { no: 'REC-' + NOW.getFullYear() + '-0041', client: 'Awa M.', object: { fr: com ? 'Courses du mois' : 'Prestation de service', en: com ? 'Monthly groceries' : 'Service' },
        amount: com ? 46500 : 185000, payment: 'momo', date: daysAgo(0), code: B.receiptHashes[0].slice(0, 8).toUpperCase(), hash: B.receiptHashes[0] },
      { no: 'REC-' + NOW.getFullYear() + '-0040', client: 'Jean-Paul O.', object: { fr: com ? 'Sacs de riz (5 × 25 kg)' : 'Livraison de matériel', en: com ? 'Rice bags (5 × 25 kg)' : 'Equipment delivery' },
        amount: com ? 92000 : 640000, payment: com ? 'cash' : 'transfer', date: daysAgo(2), code: B.receiptHashes[1].slice(0, 8).toUpperCase(), hash: B.receiptHashes[1] },
      { no: 'REC-' + NOW.getFullYear() + '-0039', client: com ? 'Restaurant Chez Mama' : 'Ndong et Fils SARL', object: { fr: 'Commande groupée', en: 'Bulk order' },
        amount: com ? 138000 : 1250000, payment: 'momo', date: daysAgo(5), code: B.receiptHashes[2].slice(0, 8).toUpperCase(), hash: B.receiptHashes[2] }
    ];
    var me = window.KAME_SPACE || {};
    s.team = [
      { id: 'm1', name: me.fullName || me.firstName || L('Vous', 'You'), email: me.email || '', role: 'owner', last: ['Maintenant', 'Now'], me: true },
      { id: 'm2', name: com ? 'Rodrigue K.' : L('Cabinet comptable (externe)', 'Accounting firm (external)'), email: com ? 'r•••@gmail.com' : 'c•••@cabinet-exemple.ga',
        role: com ? 'sales' : 'accountant', last: ['Il y a 2 jours', '2 days ago'] }
    ];
    if (!com) s.team.push({ id: 'm3', name: 'Rodrigue K.', email: 'r•••@gmail.com', role: 'sales', last: ['Il y a 3 h', '3 h ago'] });
    s.intros = [
      { id: 'i1', name: 'Paul-Henri M.', type: ['Business angel', 'Business angel'], city: 'Libreville', status: 'done', date: daysAgo(10) },
      { id: 'i2', name: 'Clarisse N.', type: ['Investisseuse particulière', 'Individual investor'], city: 'Port-Gentil', status: 'done', date: daysAgo(24) },
      { id: 'i3', type: ['Fonds d\'investissement', 'Investment fund'], city: 'Douala (Cameroun)', status: 'interest', date: daysAgo(2) },
      { id: 'i4', type: ['Business angel', 'Business angel'], city: 'Paris (diaspora)', status: 'interest', date: daysAgo(5) },
      { id: 'i5', type: ['Institution de microfinance', 'Microfinance institution'], city: 'Libreville', status: 'interest', date: daysAgo(8) }
    ];
    s.opps = [com ?
      { id: 'o1', fr: 'Fonds de roulement pour le stock de fin d\'année', en: 'Working capital for year-end stock', amount: 3e6, type: 'micro', months: 12, status: 'online', views: 64, interested: 2, days: 18, use: null } :
      { id: 'o1', fr: 'Extension de l\'atelier et nouvel équipement', en: 'Workshop extension and new equipment', amount: 25e6, type: 'loan', months: 24, status: 'online', views: 184, interested: 5, days: 21, use: null }];
    s.docs = [
      { id: 'd1', fr: com ? 'Immatriculation au RCCM' : 'Statuts de l\'entreprise', en: com ? 'Trade register entry' : 'Articles of association', vis: 'members', verified: true, added: dateLabel(8, 3) },
      { id: 'd2', fr: com ? 'Patente' : 'Extrait RCCM', en: com ? 'Business licence' : 'Trade register extract', vis: 'members', verified: true, added: dateLabel(8, 3) },
      { id: 'd3', fr: com ? 'Relevés Mobile Money (3 mois)' : 'Attestation de situation fiscale', en: com ? 'Mobile Money statements (3 months)' : 'Tax compliance certificate',
        vis: com ? 'request' : 'members', verified: true, added: dateLabel(3, 14) },
      { id: 'd4', fr: com ? 'Inventaire du stock' : 'États financiers 2025', en: com ? 'Stock inventory' : '2025 financial statements', vis: 'request', verified: true, added: dateLabel(2, 20), fromReq: com },
      { id: 'd5', fr: com ? 'Factures fournisseurs' : 'Relevés Mobile Money et bancaires', en: com ? 'Supplier invoices' : 'Mobile Money and bank statements', vis: 'private', verified: false, added: dateLabel(0, 2) }
    ];
    if (!com) s.docs.push({ id: 'd6', fr: 'Liste des prêts et dettes en cours', en: 'List of current loans and debts', vis: 'members', verified: true, added: daysAgo(16), fromReq: true });
    s.agro = AGRO[B.agroType].map(function (p) { return { p: p, stock: p.stock }; });
    s.harvests = [];
    return s;
  }

  // ------------------------------------------------------------ calculs
  function pendingReqs() { return state.reqs.filter(function (r) { return r.status === 'attente'; }); }
  // Transparence : même calcul que dans l'espace investisseur, pour toutes les entreprises.
  // Taux de réponse 60 %, rapidité 25 % (3 jours ou moins : maximum ; 14 jours ou plus : zéro), documents vérifiés 15 % (5 au maximum).
  // Un refus motivé compte comme une réponse ; sans aucune demande reçue, le critère ne compte pas encore.
  function transparency() {
    var received = state.reqs.length;
    var answered = state.reqs.filter(function (r) { return r.status !== 'attente'; });
    var days = answered.length ? answered.reduce(function (s, r) { return s + Math.max(0, daysBetween(r.received, r.answered)); }, 0) / answered.length : 0;
    var docs = state.reqs.filter(function (r) { return r.status === 'verifiee'; }).length;
    var d = { received: received, answered: answered.length, days: Math.round(days * 10) / 10, docs: docs, score: null };
    if (received) {
      var speed = days <= 3 ? 1 : (days >= 14 ? 0 : (14 - days) / 11);
      d.score = Math.round(60 * answered.length / received + 25 * (answered.length ? speed : 0) + 15 * Math.min(docs, 5) / 5);
      d.parts = { rate: Math.round(answered.length / received * 100), speed: Math.round(speed * 100) };
    }
    return d;
  }
  function compliancePct() {
    var ok = state.compliance.filter(function (c) { return c.status === 'ok' || c.status === 'expiring'; }).length;
    return Math.round(ok / state.compliance.length * 100);
  }
  function nextCalc() { return fmtDate(new Date(NOW.getFullYear(), NOW.getMonth() + 1, 1)); }
  function revRange(v) {
    var b = [[0, 1e6], [1e6, 5e6], [5e6, 10e6], [10e6, 20e6], [20e6, 50e6], [50e6, 0]];
    for (var i = 0; i < b.length; i++) {
      if (!b[i][1] || v < b[i][1]) return b[i][1] ? num(b[i][0] / 1e6) + '–' + num(b[i][1] / 1e6) + ' M FCFA' : t('Plus de 50 M FCFA', 'Over 50 M FCFA');
    }
    return '';
  }
  function nameHtml() { return B.generic ? t(B.nameFr, B.nameEn) : esc(B.name); }
  function todos() {
    var list = [];
    var p = pendingReqs().length;
    if (p) list.push({ icon: 'file', go: '#e-demandes', tag: ['Transparence', 'Transparency'],
      fr: p > 1 ? 'Répondre à ' + p + ' demandes ' + (B.com ? 'de financeurs' : 'd\'investisseurs') : 'Répondre à 1 demande ' + (B.com ? 'd\'un financeur' : 'd\'un investisseur'),
      en: p > 1 ? 'Answer ' + p + (B.com ? ' lender requests' : ' investor requests') : 'Answer 1 ' + (B.com ? 'lender request' : 'investor request') });
    state.compliance.forEach(function (c) {
      if (c.status === 'expiring') list.push({ icon: 'check', go: '#e-check', tag: ['Conformité', 'Compliance'],
        fr: 'Renouveler : ' + c.fr.charAt(0).toLowerCase() + c.fr.slice(1) + ' (expire dans ' + daysBetween(daysAgo(0), c.until) + ' jours)',
        en: 'Renew: ' + c.en + ' (expires in ' + daysBetween(daysAgo(0), c.until) + ' days)' });
      if (c.status === 'missing') list.push({ icon: 'upload', go: '#e-check', tag: ['Conformité', 'Compliance'], fr: 'Déposer : ' + c.fr.charAt(0).toLowerCase() + c.fr.slice(1), en: 'Upload: ' + c.en });
    });
    if (!B.com && state.director2 !== 'done') list.push({ icon: 'id', go: '#e-id', tag: ['Identité', 'Identity'], fr: 'Faire vérifier votre second dirigeant', en: 'Get your second director verified' });
    var bank = state.sources.filter(function (s) { return s.id === 'bank'; })[0];
    if (bank && !bank.on) list.push({ icon: 'data', go: '#e-data', tag: ['Régularité', 'Regularity'], fr: 'Connecter votre compte bancaire', en: 'Connect your bank account' });
    return list;
  }

  // ------------------------------------------------------------ notifications (cloche du bandeau)
  function notifications() {
    var base = B.com ? [
      { icon: 'file', go: '#e-demandes', when: ['Il y a 2 h', '2 h ago'], fr: 'Nouvelle demande d\'une institution de microfinance : relevés Mobile Money.', en: 'New request from a microfinance institution: Mobile Money statements.' },
      { icon: 'receipt', go: '#e-registre/clients', when: ['Il y a 5 h', '5 h ago'], fr: 'Un client a vérifié votre reçu ' + state.receipts[1].no + ' : il est authentique.', en: 'A customer verified your receipt ' + state.receipts[1].no + ': it is authentic.' },
      { icon: 'score', go: '#e-score', when: ['Hier', 'Yesterday'], fr: 'Votre KAME Score est passé à ' + B.score + '/100 (+' + B.trend + ' pts).', en: 'Your KAME Score rose to ' + B.score + '/100 (+' + B.trend + ' pts).' },
      { icon: 'check', go: '#e-check', when: ['Il y a 2 j', '2 d ago'], fr: 'Votre patente expire dans 12 jours.', en: 'Your business licence expires in 12 days.' }
    ] : [
      { icon: 'file', go: '#e-demandes', when: ['Il y a 2 h', '2 h ago'], fr: 'Nouvelle demande d\'un investisseur : attestation CNSS.', en: 'New investor request: CNSS certificate.' },
      { icon: 'investor', go: '#e-investisseurs', when: ['Il y a 6 h', '6 h ago'], fr: '4 nouveaux investisseurs suivent votre entreprise ce mois-ci.', en: '4 new investors are following your business this month.' },
      { icon: 'score', go: '#e-score', when: ['Hier', 'Yesterday'], fr: 'Votre KAME Score est passé à ' + B.score + '/100 (+' + B.trend + ' pts).', en: 'Your KAME Score rose to ' + B.score + '/100 (+' + B.trend + ' pts).' },
      { icon: 'check', go: '#e-check', when: ['Il y a 2 j', '2 d ago'], fr: 'Votre attestation CNSS expire dans 12 jours.', en: 'Your CNSS certificate expires in 12 days.' }
    ];
    return state.notifs.concat(base);
  }
  var notifier = {
    list: function () { return notifications(); },
    unread: function () { return state ? state.unread || 0 : 0; },
    markRead: function () { if (state) state.unread = 0; }
  };
  function addNotif(n) {
    state.notifs.unshift(n);
    state.unread = (state.unread || 0) + 1;
    updateBadges();
  }
  function updateBadges() {
    if (active && !shell.hidden) U.updateBell();
    var p = pendingReqs().length;
    shell.querySelectorAll('[data-req-count]').forEach(function (el) { el.textContent = String(p); el.hidden = !p; });
  }

  // ------------------------------------------------------------ vues : accueil
  function viewAccueil() {
    var sp = window.KAME_SPACE || {};
    var bee = shell.querySelector('.biz-side-card svg');
    var first = esc(sp.firstName || '');
    var welcome = '<div class="inv-welcome biz-welcome"><div class="inv-welcome-text">' +
      '<p class="inv-hello">' + th('Bonjour, ' + first + ' !', 'Hello, ' + first + '!') + '</p>' +
      '<h1 class="inv-title" tabindex="-1">' + (B.generic ? th('Bienvenue dans votre <em>espace ' + (B.com ? 'commerçant' : 'entreprise') + '</em>', 'Welcome to your <em>' + (B.com ? 'merchant' : 'business') + ' space</em>')
        : th('Bienvenue dans l\'espace ' + (/^[aeiouyàâäéèêëîïôöûüœæ]/i.test(B.name) ? 'd\'' : 'de ') + '<em>' + esc(B.name) + '</em>', 'Welcome to <em>' + esc(B.name) + '</em>')) + '</h1>' +
      '<p class="inv-lead">' + (B.com ? t('Suivez vos ventes, émettez des reçus fiables et montrez votre sérieux pour obtenir un financement.',
        'Track your sales, issue trusted receipts and show lenders you are reliable.') : t('Pilotez votre activité, renforcez votre KAME Score et gagnez la confiance des investisseurs.',
        'Run your business, build your KAME Score and earn investors\' trust.')) + '</p>' +
      (B.com ? '<a class="btn btn-light" href="#e-registre/clients">' + ic('receipt', 18, 2) + t('Émettre un reçu', 'Issue a receipt') + '</a>'
             : '<a class="btn btn-light" href="#e-score">' + t('Voir mon KAME Score', 'See my KAME Score') + ' ' + ic('right', 18, 2) + '</a>') + '</div>' +
      '<div class="inv-welcome-art" aria-hidden="true"><span class="h h1"></span><span class="h h2"></span><span class="h h3"></span>' + (bee ? bee.outerHTML : '') + '</div>' +
      '<blockquote class="inv-quote">' + (B.com ? t('Chaque reçu certifié renforce la confiance de vos clients et de vos financeurs.', 'Every certified receipt builds the trust of your customers and lenders.')
        : t('Une entreprise transparente est une entreprise finançable.', 'A transparent business is a fundable business.')) + '</blockquote></div>';
    var p = pendingReqs().length;
    var kpis, main, bottom;
    var todoCard = card(ic('ok', 20, 2) + t('À faire', 'To do'), todoList());
    var notifCard = card(ic('bell', 20, 2) + t('Notifications', 'Notifications'), '<ul class="inv-notifs">' + notifications().slice(0, 4).map(notifItem).join('') + '</ul>',
      '<button type="button" class="inv-link" data-open-notifs>' + t('Tout voir', 'See all') + ' ' + ic('right', 15, 2) + '</button>');
    if (B.com) {
      kpis = '<div class="inv-kpis">' +
        kpi('cart', '#159E96', t('Ventes du jour', 'Today\'s sales'), money(B.today), '<span class="kpi-note">' + t(B.todayCount + ' ventes', B.todayCount + ' sales') + '</span>') +
        kpi('calendar', '#145B63', t('Ventes de la semaine', 'This week\'s sales'), money(B.weekTotal), trendTag(Math.round((B.weekTotal / B.weekPrev - 1) * 1000) / 10, '%') +
          '<span class="kpi-note">' + t('vs semaine dernière', 'vs last week') + '</span>') +
        kpi('trend', '#B8734F', t('Ventes du mois', 'This month\'s sales'), millions(B.rev[11]) + ' FCFA', trendTag(B.mom, '%') + '<span class="kpi-note">' + t('vs mois dernier', 'vs last month') + '</span>',
          spark(B.rev, '#B8734F')) +
        kpi('score', '#C98A1E', 'KAME Score', B.score + '/100 ' + lvChip(B.score), trendTag(B.trend)) + '</div>';
      var quick = '<div class="biz-quick">' + [
        ['#e-registre/clients', 'receipt', 'Émettre un reçu', 'Issue a receipt', 'Certifié, vérifiable par votre client', 'Certified, verifiable by your customer'],
        ['#e-id/clients', 'id', 'Vérifier un client', 'Verify a customer', 'Avant une vente à crédit', 'Before a sale on credit'],
        ['#e-levees', 'target', 'Demander un financement', 'Request funding', 'Auprès de partenaires agréés', 'From licensed partners']
      ].map(function (q) {
        return '<a class="biz-quick-btn" href="' + q[0] + '">' + hexIcon(q[1], '#145B63') + '<span><strong>' + t(q[2], q[3]) + '</strong><small>' + t(q[4], q[5]) + '</small></span>' + ic('right', 18, 2) + '</a>';
      }).join('') + '</div>';
      main = quick + '<div class="inv-grid g-main">' +
        card(ic('data', 20, 2) + t('Ventes des 7 derniers jours', 'Sales over the last 7 days'), weekBars() +
          '<p class="inv-foot-note">' + t('Total de la semaine : ', 'Week total: ') + money(B.weekTotal) + '</p>', seeAll('#e-data', 'Mes ventes', 'My sales'), 'perf') +
        todoCard + notifCard + '</div>';
      bottom = '<div class="inv-grid g-bottom">' + card(ic('receipt', 20, 2) + t('Derniers reçus', 'Latest receipts'), receiptList(state.receipts.slice(0, 3), true), seeAll('#e-registre/clients')) +
        card(ic('target', 20, 2) + t('Mon financement', 'My funding'), oppCompact(state.opps[0]), seeAll('#e-levees')) + helpCard(bee) + '</div>';
    } else {
      kpis = '<div class="inv-kpis">' +
        kpi('trend', '#159E96', t('Chiffre d\'affaires du mois', 'This month\'s revenue'), millions(B.rev[11]) + ' FCFA', trendTag(B.mom, '%') + '<span class="kpi-note">' + t('vs mois dernier', 'vs last month') + '</span>',
          spark(B.rev, '#159E96')) +
        kpi('score', '#145B63', 'KAME Score', B.score + '/100 ' + lvChip(B.score), trendTag(B.trend) + '<span class="kpi-note">' + t('en un mois', 'in one month') + '</span>') +
        kpi('investor', '#B8734F', t('Investisseurs qui vous suivent', 'Investors following you'), String(B.followers), '<span class="inv-trend up">' + ic('trend', 15, 2.2) + t('+4 ce mois', '+4 this month') + '</span>') +
        kpi('file', '#C98A1E', t('Demandes à traiter', 'Requests to answer'), String(p), p ? '<a class="inv-link" href="#e-demandes">' + t('Répondre', 'Answer') + ' ' + ic('right', 15, 2) + '</a>' :
          '<span class="kpi-note">' + t('Tout est à jour', 'All up to date') + '</span>') + '</div>';
      main = '<div class="inv-grid g-main">' +
        card(ic('trend', 20, 2) + t('Votre activité sur 12 mois', 'Your activity over 12 months'),
          '<p class="inv-big">' + money(B.rev[11]) + ' ' + trendTag(B.mom, '%') + '</p>' + legendLine() +
          lineChart([{ values: B.avg, color: '#9AA9AE', dash: true }, { values: B.rev, color: SECTORS[B.sector].color, fill: true }],
            { h: 180, label: L('Chiffre d\'affaires mensuel comparé à la moyenne du secteur', 'Monthly revenue compared with the sector average') }), seeAll('#e-data', 'KAME Data', 'KAME Data'), 'perf') +
        todoCard + notifCard + '</div>';
      bottom = '<div class="inv-grid g-bottom">' + card(ic('grid', 20, 2) + t('Mes outils KAME', 'My KAME tools'), toolTiles()) +
        card(ic('target', 20, 2) + t('Ma levée de fonds', 'My fundraising'), oppCompact(state.opps[0]), seeAll('#e-levees')) + helpCard(bee) + '</div>';
    }
    return welcome + kpis + main + bottom + disclaimer();
  }
  function legendLine() {
    var sc = SECTORS[B.sector];
    return '<p class="inv-legend-line"><span><i style="background:' + sc.color + '"></i>' + nameHtml() + '</span><span><i class="dash"></i>' +
      esc(L('Moyenne du secteur (' + sc.fr + ')', 'Sector average (' + sc.en + ')')) + '</span></p>';
  }
  function todoList() {
    var list = todos();
    if (!list.length) return '<p class="biz-all-done">' + ic('ok', 20, 2.4) + t('Tout est à jour. Bravo !', 'Everything is up to date. Well done!') + '</p>';
    return '<ul class="biz-todo">' + list.map(function (x) {
      return '<li><a href="' + x.go + '">' + hexIcon(x.icon, '#B8734F') + '<span><span class="n-text">' + t(x.fr, x.en) + '</span><span class="inv-chip">' + t(x.tag[0], x.tag[1]) +
        '</span></span>' + ic('right', 18, 2) + '</a></li>';
    }).join('') + '</ul>';
  }
  function toolTiles() {
    var verifiedClients = state.clients.filter(function (c) { return c.status === 'verifiee'; }).length;
    var tiles = [
      ['#e-id', 'id', 'KAME ID', t('Entreprise vérifiée', 'Verified business'), t(verifiedClients + ' clients vérifiés', verifiedClients + ' verified customers')],
      ['#e-check', 'check', 'KAME Check', t('Conformité ' + compliancePct() + ' %', 'Compliance ' + compliancePct() + '%'), t('Documents et partenaires', 'Documents and partners')],
      ['#e-registre', 'registre', 'KAME Registre', t(state.regs.length + ' opérations enregistrées', state.regs.length + ' recorded operations'), t(state.receipts.length + ' reçus certifiés', state.receipts.length + ' certified receipts')],
      ['#e-garde', 'garde', 'KAME Garde', t(state.team.length + ' membres d\'équipe', state.team.length + ' team members'), t('Accès et sécurité', 'Access and security')]
    ];
    return '<div class="biz-tools">' + tiles.map(function (x) {
      return '<a class="biz-tool" href="' + x[0] + '">' + hexIcon(x[1], '#145B63') + '<span><strong>' + x[2] + '</strong><span class="inv-meta">' + x[3] + '</span><span class="inv-meta">' + x[4] + '</span></span></a>';
    }).join('') + '</div>';
  }
  function helpCard(bee) {
    return '<article class="inv-help">' + (bee ? bee.outerHTML : '') + '<h2>' + t('Besoin d\'aide ?', 'Need help?') + '</h2><p>' +
      t('L\'équipe KAME vous accompagne : score, documents, levée de fonds.', 'The KAME team helps you: score, documents, fundraising.') + '</p>' +
      '<a class="btn btn-light btn-sm" href="index.html#contact">' + t('Poser une question', 'Ask a question') + ' ' + ic('right', 16, 2) + '</a></article>';
  }
  function weekBars() {
    var max = Math.max.apply(null, B.week.map(function (x) { return x.v; }));
    return '<div class="week-bars" role="img" aria-label="' + esc(L('Ventes des 7 derniers jours', 'Sales over the last 7 days')) + '">' + B.week.map(function (x, i) {
      var today = i === B.week.length - 1;
      return '<div class="wb' + (today ? ' today' : '') + '"><span class="wb-val">' + kilo(x.v) + '</span><span class="wb-col"><span class="wb-bar" style="height:' + Math.round(x.v / max * 100) +
        '%"></span></span><span class="wb-day">' + (today ? t('Auj.', 'Today') : t(DAYS_FR[x.d.getDay()], DAYS_EN[x.d.getDay()])) + '</span></div>';
    }).join('') + '</div>';
  }

  // ------------------------------------------------------------ Mon entreprise
  function viewEntreprise() {
    var pr = state.profile, s = SECTORS[B.sector];
    var checks = [
      [!!pr.desc, 'Description de l\'activité', 'Business description'], [!!pr.logo, 'Logo', 'Logo'], [!!pr.staff, 'Nombre d\'employés', 'Number of employees'],
      [!!pr.web, 'Site web ou page de réseau social', 'Website or social media page'], [!!pr.phone, 'Téléphone public', 'Public phone number']
    ];
    var done = checks.filter(function (c) { return c[0]; }).length;
    var pctDone = Math.round(done / checks.length * 100);
    var revShown = state.showRev === 'exact' ? money(B.rev[11]) : (state.showRev === 'range' ? revRange(B.rev[11]) : t('Masqué', 'Hidden'));
    var logo = pr.logo ? '<span class="biz-logo"><img src="' + esc(pr.logo) + '" alt=""></span>' : hexIcon(s.icon, s.color);
    var preview = '<section class="inv-co-head biz-preview"><div class="co-id">' + logo + '<div><h2 class="biz-co-name">' + nameHtml() + '</h2>' +
      '<p class="inv-meta">' + sectorName(B.sector) + ' · ' + ic('pin', 14, 2) + esc(B.city) + ' · ' + esc(L(pr.legal, legalEn(pr.legal))) + ' · ' + t('depuis ', 'since ') + esc(pr.since) + '</p>' +
      '<p class="co-badges"><span class="inv-verified">' + ic('shield', 15, 2) + t('Vérifiée', 'Verified') + '</span>' + (B.com ? '' : '<span class="inv-tag">' + ic('id', 15, 2) + t('Dirigeant vérifié', 'Director verified') + '</span>') + '</p></div></div>' +
      '<div class="co-score"><span class="inv-score big"><strong>' + B.score + '</strong>/100 ' + lvChip(B.score) + '</span>' + trendTag(B.trend) + '</div></section>' +
      '<p class="biz-preview-desc">' + esc(pr.desc) + '</p>' +
      '<dl class="inv-facts wide"><div><dt>' + t('Employés', 'Employees') + '</dt><dd>' + esc(pr.staff) + '</dd></div>' +
      '<div><dt>' + t('Chiffre d\'affaires mensuel', 'Monthly revenue') + '</dt><dd>' + revShown + '</dd></div>' +
      '<div><dt>' + t('Clients actifs', 'Active customers') + '</dt><dd>' + (state.showClients ? num(B.clients) : t('Masqué', 'Hidden')) + '</dd></div>' +
      (pr.web ? '<div><dt>' + t('Site web', 'Website') + '</dt><dd>' + esc(pr.web) + '</dd></div>' : '') +
      (pr.phone ? '<div><dt>' + t('Téléphone', 'Phone') + '</dt><dd>' + esc(pr.phone) + '</dd></div>' : '') + '</dl>';
    var completeness = '<div class="biz-progress"><p><strong>' + pctDone + ' %</strong> ' + t('de votre fiche est remplie', 'of your profile is complete') + '</p>' +
      '<span class="b-track"><span class="b-fill" style="width:' + pctDone + '%;--bc:' + (pctDone === 100 ? '#0E7C75' : '#E0A030') + '"></span></span></div>' +
      '<ul class="biz-checklist">' + checks.map(function (c) {
        return '<li class="' + (c[0] ? 'ok' : 'todo') + '">' + ic(c[0] ? 'ok' : 'plus', 16, 2.4) + t(c[1], c[2]) + '</li>';
      }).join('') + '</ul>' +
      '<p class="inv-foot-note">' + t('Une fiche complète inspire confiance : les investisseurs la consultent avant de vous contacter.', 'A complete profile inspires trust: investors read it before contacting you.') + '</p>';
    var legalOpts = (B.com ? [['Entreprise individuelle', 'Entreprise individuelle', 'Sole proprietorship'], ['GIE', 'GIE', 'Economic interest group (GIE)'], ['SARL', 'SARL', 'Limited company (SARL)']]
      : [['SARL', 'SARL', 'Limited company (SARL)'], ['SA', 'SA', 'Public limited company (SA)'], ['SAS', 'SAS', 'Simplified company (SAS)'], ['GIE', 'GIE', 'Economic interest group (GIE)'],
         ['Coopérative', 'Coopérative', 'Cooperative'], ['Entreprise individuelle', 'Entreprise individuelle', 'Sole proprietorship']]);
    var form = '<form class="biz-form" data-form="profile" novalidate>' +
      field('Description de l\'activité', 'Business description', '<textarea class="inv-input" name="desc" rows="3" maxlength="400" required minlength="20">' + esc(pr.desc) + '</textarea>') +
      '<div class="biz-row">' + field('Nombre d\'employés', 'Number of employees', input('staff', 'type="number" min="1" max="5000" required value="' + esc(pr.staff) + '"')) +
      field('Année de création', 'Year founded', input('since', 'type="number" min="1950" max="' + NOW.getFullYear() + '" required value="' + esc(pr.since) + '"')) +
      field('Forme juridique', 'Legal form', selectEl('legal', legalOpts, pr.legal)) + '</div>' +
      '<div class="biz-row">' + field('Site web ou page de réseau social', 'Website or social media page', input('web', 'type="url" maxlength="120" placeholder="https://…" value="' + esc(pr.web) + '"')) +
      field('Téléphone public', 'Public phone number', input('phone', 'type="tel" maxlength="20" placeholder="+241 …" value="' + esc(pr.phone) + '"')) + '</div>' +
      '<div class="biz-form-foot">' + fileBtn('data-file="logo"', pr.logo ? 'Changer le logo' : 'Ajouter un logo', pr.logo ? 'Change the logo' : 'Add a logo', 'image/png,image/jpeg,image/webp') +
      '<button type="submit" class="btn btn-primary btn-sm">' + t('Enregistrer', 'Save') + '</button></div></form>';
    var vis = '<fieldset class="inv-choices"><legend>' + t('Chiffre d\'affaires', 'Revenue') + '</legend>' + [['exact', 'Montant exact', 'Exact amount'], ['range', 'Tranche (recommandé)', 'Range (recommended)'],
      ['hidden', 'Masqué', 'Hidden']].map(function (o) {
        return '<label class="inv-choice"><input type="radio" name="showrev" data-showrev value="' + o[0] + '"' + (state.showRev === o[0] ? ' checked' : '') + '><span>' + t(o[1], o[2]) + '</span></label>';
      }).join('') + '</fieldset>' +
      '<label class="inv-choice"><input type="checkbox" data-showclients' + (state.showClients ? ' checked' : '') + '><span>' + t('Afficher le nombre de clients actifs', 'Show the number of active customers') + '</span></label>' +
      '<p class="inv-foot-note">' + t('Le KAME Score et le badge de vérification sont toujours visibles : ils sont calculés de la même façon pour toutes les entreprises.',
        'The KAME Score and the verification badge are always visible: they are computed the same way for every business.') + '</p>';
    return heading(B.com ? 'Ma boutique' : 'Mon entreprise', B.com ? 'My shop' : 'My business', t('Votre fiche telle que la voient les membres vérifiés, et ce que vous choisissez de montrer.',
      'Your profile as verified members see it, and what you choose to show.')) +
      '<div class="inv-grid g-two">' + card(ic('eye', 20, 2) + t('Ce que voient les investisseurs', 'What investors see'), preview, '', 'wide') +
      card(ic('edit', 20, 2) + t('Modifier mes informations', 'Edit my information'), form) +
      '<div class="biz-stack">' + card(ic('ok', 20, 2) + t('Fiche complète', 'Profile completeness'), completeness) +
      card(ic('lock', 20, 2) + t('Ce que je rends visible', 'What I make visible'), vis) + '</div></div>' + disclaimer();
  }
  function legalEn(v) {
    return { 'Entreprise individuelle': 'Sole proprietorship', 'Coopérative': 'Cooperative' }[v] || v;
  }

  // ------------------------------------------------------------ KAME ID
  function viewId(tab) {
    var clients = tab === 'clients';
    var tabsHtml = U.tabs([['#e-id', '', 'Pour mon entreprise', 'For my business', 'building'], ['#e-id/clients', 'clients', 'Pour mes clients', 'For my customers', 'users']],
      clients ? 'clients' : '', 'Rubriques de KAME ID', 'KAME ID sections');
    var body;
    var sp = window.KAME_SPACE || {};
    var memberId = (sp.ids && sp.ids[role]) || '';
    if (!clients) {
      var items = B.com ? [
        ['ok', 'Immatriculation (RCCM)', 'Trade register (RCCM)', 'Vérifiée', 'Verified', daysAgo(60)],
        ['ok', 'Numéro fiscal (NIF)', 'Tax number (NIF)', 'Vérifié', 'Verified', daysAgo(60)],
        ['ok', 'Identité du gérant', 'Manager\'s identity', 'Vérifiée (pièce d\'identité et selfie)', 'Verified (ID document and selfie)', daysAgo(58)],
        ['ok', 'Adresse du commerce', 'Shop address', 'Vérifiée', 'Verified', daysAgo(55)]
      ] : [
        ['ok', 'Existence légale (RCCM)', 'Legal existence (RCCM)', 'Vérifiée', 'Verified', daysAgo(40)],
        ['ok', 'Numéro fiscal (NIF)', 'Tax number (NIF)', 'Vérifié', 'Verified', daysAgo(40)],
        ['ok', 'Dirigeant principal (vous)', 'Main director (you)', 'Identité vérifiée (pièce d\'identité et selfie)', 'Identity verified (ID document and selfie)', daysAgo(38)],
        [state.director2 === 'done' ? 'ok' : 'wait', 'Second dirigeant', 'Second director', state.director2 === 'done' ? 'Identité vérifiée' : 'Invitation envoyée, en attente',
          state.director2 === 'done' ? 'Identity verified' : 'Invitation sent, pending', state.director2 === 'done' ? daysAgo(0) : daysAgo(5)],
        ['ok', 'Adresse du siège', 'Head office address', 'Vérifiée', 'Verified', daysAgo(36)]
      ];
      body = '<div class="inv-grid g-two">' + card(ic('shield', 20, 2) + t('Statut de vérification', 'Verification status'),
        '<div class="biz-badge-big">' + hexIcon('shield', '#0E7C75') + '<div><strong>' + t(B.com ? 'Commerce vérifié' : 'Entreprise vérifiée', B.com ? 'Verified shop' : 'Verified business') + '</strong>' +
          (memberId ? '<span class="inv-meta">' + t('Identifiant membre : ', 'Member ID: ') + '<code>' + esc(memberId) + '</code></span>' : '') + '</div></div>' +
        '<ul class="inv-docs">' + items.map(function (x) {
          var ok = x[0] === 'ok';
          return '<li class="' + (ok ? '' : 'doc-pending') + '">' + hexIcon(ok ? 'ok' : 'clock', ok ? '#0E7C75' : '#C98A1E') + '<span><strong>' + t(x[1], x[2]) + '</strong><span class="inv-meta">' +
            t(x[3], x[4]) + ' · ' + dateText(x[5]) + '</span></span>' + (ok ? chip('ok', '', 'Vérifié', 'Verified') :
            '<button type="button" class="btn btn-outline btn-sm" data-relance>' + t('Relancer', 'Remind') + '</button>') + '</li>';
        }).join('') + '</ul>') +
        card(ic('id', 20, 2) + t('Votre badge', 'Your badge'), '<p>' + t('Le badge apparaît sur votre fiche, vos reçus certifiés et vos documents. Il rassure les investisseurs, les banques et vos clients.',
          'The badge appears on your profile, your certified receipts and your documents. It reassures investors, banks and your customers.') + '</p>' +
          '<p class="biz-badge-demo"><span class="inv-verified">' + ic('shield', 15, 2) + t('Vérifiée par KAME ID', 'Verified by KAME ID') + '</span></p>' +
          '<h3 class="biz-h3">' + t('Qui voit quoi ?', 'Who sees what?') + '</h3><ul class="biz-bullets">' +
          '<li>' + t('Les membres vérifiés voient le badge et la liste des éléments vérifiés.', 'Verified members see the badge and the list of verified items.') + '</li>' +
          '<li>' + t('Personne ne voit vos pièces d\'identité : elles restent chez KAME, chiffrées.', 'Nobody sees your ID documents: they stay with KAME, encrypted.') + '</li>' +
          '<li>' + t('Un changement de dirigeant ou d\'adresse ? Mettez-le à jour pour garder le badge.', 'A change of director or address? Update it to keep the badge.') + '</li></ul>') + '</div>';
    } else {
      var reasons = Object.keys(ID_REASONS).map(function (k) { return [k, ID_REASONS[k][0], ID_REASONS[k][1]]; });
      var form = '<form class="biz-form" data-form="idclient" novalidate><div class="biz-row">' +
        field('Nom du client', 'Customer name', input('name', 'maxlength="80" required minlength="2" autocomplete="off"')) +
        field('Numéro WhatsApp', 'WhatsApp number', input('phone', 'type="tel" maxlength="20" required placeholder="+241 06 12 34 56" autocomplete="off"')) + '</div>' +
        field('Pourquoi vérifier ?', 'Why verify?', selectEl('reason', reasons, 'credit')) +
        '<div class="biz-form-foot"><button type="submit" class="btn btn-primary btn-sm">' + ic('send', 16, 2) + t('Envoyer la demande de vérification', 'Send the verification request') + '</button></div></form>' +
        '<div class="biz-msg-slot" aria-live="polite">' + (state.lastIdMsg ? state.lastIdMsg : '') + '</div>';
      var verified = state.clients.filter(function (c) { return c.status === 'verifiee'; }).length;
      var list = '<ul class="inv-docs">' + state.clients.map(function (c) {
        var st = c.status === 'verifiee' ? chip('ok', 'shield', 'Identité confirmée', 'Identity confirmed') : (c.status === 'envoyee' ? chip('warn', 'clock', 'En attente du client', 'Waiting for the customer') :
          '<button type="button" class="btn btn-outline btn-sm" data-resend="' + c.id + '">' + t('Renvoyer', 'Resend') + '</button>');
        return '<li>' + hexIcon(c.status === 'verifiee' ? 'user' : 'clock', c.status === 'verifiee' ? '#0E7C75' : '#C98A1E') + '<span><strong>' + esc(c.name) + '</strong><span class="inv-meta">' +
          esc(c.phone) + ' · ' + t(ID_REASONS[c.reason][0], ID_REASONS[c.reason][1]) + ' · ' + (c.status === 'expiree' ? t('lien expiré', 'link expired') : dateText(c.date)) + '</span></span>' + st + '</li>';
      }).join('') + '</ul>';
      body = '<div class="inv-grid g-two">' + card(ic('send', 20, 2) + t('Vérifier l\'identité d\'un client', 'Verify a customer\'s identity'),
        '<p>' + t('Votre client reçoit un lien sur WhatsApp, prend en photo sa pièce d\'identité et fait un selfie. Vous recevez seulement la réponse : identité confirmée ou non.',
          'Your customer gets a link on WhatsApp, takes a photo of their ID and a selfie. You only receive the answer: identity confirmed or not.') + '</p>' + form) +
        card(ic('users', 20, 2) + t('Mes clients vérifiés', 'My verified customers'), list + '<p class="inv-foot-note">' + t('Les pièces d\'identité restent chez KAME : vous ne les voyez jamais.',
          'ID documents stay with KAME: you never see them.') + '</p>') +
        card(ic('pie', 20, 2) + t('Utilisation ce mois-ci', 'Usage this month'), '<div class="biz-progress"><p><strong>' + (state.idUsage) + '</strong> ' +
          t('vérifications sur 100 incluses', 'checks out of 100 included') + '</p><span class="b-track"><span class="b-fill" style="width:' + state.idUsage + '%;--bc:#159E96"></span></span></div>' +
          '<p class="inv-meta">' + t(verified + ' clients vérifiés au total', verified + ' verified customers in total') + '</p>') +
        (B.com ? '' : card(ic('code', 20, 2) + t('Intégrer KAME ID à votre site ou application', 'Add KAME ID to your website or app'),
          '<p>' + t('Exemple de demande à l\'API KAME ID (bientôt disponible). La clé ci-dessous est fictive.', 'Example request to the KAME ID API (coming soon). The key below is fictitious.') + '</p>' +
          '<pre class="biz-code"><code>curl https://api.kamegroupe.com/v1/id/verifications \\\n  -H "Authorization: Bearer kame_test_4f9c••••e21a" \\\n  -d name="Awa M." \\\n  -d phone="+241 06 00 00 00"</code></pre>' +
          '<p class="inv-foot-note">' + t('Les vraies clés se gèreront dans une page « Développeurs », avec des droits limités et la possibilité de les révoquer.',
            'Real keys will be managed on a "Developers" page, with limited rights and the option to revoke them.') + '</p>')) + '</div>';
    }
    return heading('KAME ID', 'KAME ID', t('L\'identité numérique vérifiée : celle de votre ' + (B.com ? 'commerce' : 'entreprise') + ', et celle de vos clients, en toute sécurité.',
      'Verified digital identity: your ' + (B.com ? 'shop' : 'business') + '\'s, and your customers\', securely.')) + tabsHtml + '<div class="inv-tabpanel">' + body + '</div>' + disclaimer();
  }

  // ------------------------------------------------------------ KAME Data
  function viewData() {
    var s = SECTORS[B.sector];
    var rev12 = B.rev.reduce(function (a, b) { return a + b; }, 0);
    var worst = B.changes.slice().sort(function (a, b) { return a.v - b.v; })[0];
    var faster = B.g12 >= B.sectorGrowth;
    var compare = '<ul class="biz-compare">' +
      '<li>' + hexIcon(B.mom >= 0 ? 'trend' : 'trenddown', B.mom >= 0 ? '#0E7C75' : '#B5452F') + '<span><span class="inv-meta">' + t('Par rapport au mois dernier', 'Compared with last month') + '</span><strong>' + trendTag(B.mom, '%') + '</strong></span></li>' +
      '<li>' + hexIcon('calendar', '#145B63') + '<span><span class="inv-meta">' + t('Sur 12 mois', 'Over 12 months') + '</span><strong>' + trendTag(Math.round(B.g12 * 10) / 10, '%') + '</strong></span></li>' +
      '<li>' + hexIcon(s.icon, s.color) + '<span><span class="inv-meta">' + t('Votre secteur sur 12 mois', 'Your sector over 12 months') + '</span><strong>' + trendTag(B.sectorGrowth, '%') + '</strong></span></li></ul>' +
      '<p class="biz-verdict ' + (faster ? 'up' : 'down') + '">' + (faster ? t('Vous progressez plus vite que la moyenne de votre secteur.', 'You are growing faster than your sector average.')
        : t('Vous progressez moins vite que la moyenne de votre secteur.', 'You are growing more slowly than your sector average.')) + '</p>' +
      (worst && worst.v < 0 ? '<p class="inv-foot-note">' + t('Mois le plus faible : ' + worst.m.longFr + ' (' + pct(worst.v, true) + '). Une baisse ponctuelle est normale ; c\'est la tendance sur plusieurs mois qui compte.',
        'Weakest month: ' + worst.m.longEn + ' (' + pct(worst.v, true) + '). A one-off dip is normal; the trend over several months is what counts.') + '</p>' : '');
    var mom = '<ul class="mom-bars">' + (function () {
      var max = Math.max.apply(null, B.changes.map(function (c) { return Math.abs(c.v); })) || 1;
      return B.changes.map(function (c) {
        var w = Math.abs(c.v) / max * 50;
        return '<li><span class="m-label">' + t(c.m.fr, c.m.en) + '</span><span class="m-track"><span class="m-fill ' + (c.v >= 0 ? 'pos' : 'neg') + '" style="width:' + w.toFixed(1) +
          '%"></span></span><span class="m-val ' + (c.v >= 0 ? 'up' : 'down') + '">' + pct(c.v, true) + '</span></li>';
      }).join('');
    })() + '</ul>';
    var payParts = B.pay.map(function (p) { return { v: p.v, c: PAY[p.k][2] }; });
    var payCard = '<div class="inv-split">' + donut(payParts, '<strong>' + num(B.tickets) + '</strong><span>' + t('ventes', 'sales') + '</span>', L('Ventes par moyen de paiement', 'Sales by payment method')) +
      '<ul class="inv-legend">' + B.pay.map(function (p) {
        return '<li><span class="dot" style="background:' + PAY[p.k][2] + '"></span>' + t(PAY[p.k][0], PAY[p.k][1]) + '<strong>' + pct(Math.round(p.v)) + '</strong></li>';
      }).join('') + '</ul></div>';
    var SRC = { momo: ['Mobile Money', 'Mobile Money', 'pay'], bank: ['Compte bancaire', 'Bank account', 'building'], caisse: ['Caisse (ventes en boutique)', 'Till (in-store sales)', 'cart'] };
    var sources = '<ul class="inv-docs">' + state.sources.map(function (src) {
      var d = SRC[src.id];
      return '<li>' + hexIcon(d[2], src.on ? '#0E7C75' : '#9AA9AE') + '<span><strong>' + t(d[0], d[1]) + '</strong><span class="inv-meta">' +
        (src.on ? (src.manual ? t('Saisie manuelle · ', 'Manual entry · ') : t('Connecté · synchronisé ', 'Connected · synced ')) + t(src.sync[0], src.sync[1]).toLowerCase() : t('Pas encore connecté', 'Not connected yet')) +
        '</span></span>' + (src.on ? chip('ok', 'ok', 'Actif', 'Active') : '<button type="button" class="btn btn-primary btn-sm" data-connect="' + src.id + '">' + t('Connecter', 'Connect') + '</button>') + '</li>';
    }).join('') + '</ul><p class="inv-foot-note">' + t('KAME lit vos données avec votre accord, sans jamais pouvoir faire un paiement. Les investisseurs ne voient que les indicateurs que vous rendez visibles.',
      'KAME reads your data with your consent, and can never make a payment. Investors only see the indicators you make visible.') + ' <a href="#e-entreprise">' + t('Régler la visibilité', 'Set visibility') + '</a></p>';
    var kpis = B.com ?
      '<div class="inv-kpis">' + kpi('cart', '#159E96', t('Ventes du jour', 'Today\'s sales'), money(B.today), '<span class="kpi-note">' + t(B.todayCount + ' ventes', B.todayCount + ' sales') + '</span>') +
        kpi('calendar', '#145B63', t('Ventes de la semaine', 'This week\'s sales'), money(B.weekTotal), trendTag(Math.round((B.weekTotal / B.weekPrev - 1) * 1000) / 10, '%')) +
        kpi('trend', '#B8734F', t('Ventes du mois', 'This month\'s sales'), millions(B.rev[11]) + ' FCFA', trendTag(B.mom, '%')) +
        kpi('user', '#C98A1E', t('Panier moyen', 'Average basket'), money(B.basket), '<span class="kpi-note">' + t(num(B.clients) + ' clients ce mois', num(B.clients) + ' customers this month') + '</span>') + '</div>'
      : '<div class="inv-kpis">' + kpi('trend', '#159E96', t('Chiffre d\'affaires du mois', 'This month\'s revenue'), millions(B.rev[11]) + ' FCFA', trendTag(B.mom, '%') + '<span class="kpi-note">' + t('vs mois dernier', 'vs last month') + '</span>') +
        kpi('calendar', '#145B63', t('Chiffre d\'affaires sur 12 mois', 'Revenue over 12 months'), millions(rev12) + ' FCFA', trendTag(Math.round(B.g12 * 10) / 10, '%')) +
        kpi('users', '#B8734F', t('Clients actifs', 'Active customers'), num(B.clients), '<span class="inv-trend up">' + ic('trend', 15, 2.2) + t('+' + B.clientsDelta + ' ce mois', '+' + B.clientsDelta + ' this month') + '</span>') +
        kpi('cart', '#C98A1E', t('Panier moyen', 'Average basket'), money(B.basket), '') + '</div>';
    return heading(B.com ? 'Mes ventes' : 'KAME Data', B.com ? 'My sales' : 'KAME Data', t('Votre activité en chiffres : croissance ou baisse, comparée au mois dernier et à votre secteur.',
      'Your activity in figures: growth or decline, compared with last month and with your sector.')) + kpis +
      (B.com ? card(ic('data', 20, 2) + t('Ventes des 7 derniers jours', 'Sales over the last 7 days'), weekBars()) : '') +
      '<div class="inv-grid g-two">' + card(ic('trend', 20, 2) + t('Croissance ou baisse ?', 'Growth or decline?'), compare) +
      card(ic('data', 20, 2) + t('Variation d\'un mois à l\'autre', 'Month-to-month change'), mom + '<p class="inv-foot-note">' + t('Vert : hausse par rapport au mois précédent. Cuivre : baisse.',
        'Green: up on the previous month. Copper: down.') + '</p>') +
      card(ic('trend', 20, 2) + t('Chiffre d\'affaires mensuel comparé au secteur', 'Monthly revenue compared with the sector'), legendLine() +
        lineChart([{ values: B.avg, color: '#9AA9AE', dash: true }, { values: B.rev, color: s.color, fill: true }], { h: 230, label: L('Chiffre d\'affaires comparé au secteur', 'Revenue compared with the sector') }), '', 'wide') +
      card(ic('pay', 20, 2) + t('Ventes par moyen de paiement', 'Sales by payment method'), payCard) +
      card(ic('link', 20, 2) + t('Sources de données', 'Data sources'), sources) + '</div>' + disclaimer();
  }

  // ------------------------------------------------------------ KAME Score
  function viewScore() {
    var tr = transparency();
    var subs = B.sub.map(function (x) { return { label: t(x[0], x[1]), pct: x[2], value: x[2] + '/100', color: level(x[2]).c }; });
    subs.push(tr.score === null ? { label: t('Transparence', 'Transparency'), pct: 0, value: t('Pas encore évaluée', 'Not rated yet'), color: '#9AA9AE' }
                                : { label: t('Transparence', 'Transparency'), pct: tr.score, value: tr.score + '/100', color: level(tr.score).c });
    var nc = nextCalc();
    var tips = [];
    var p = pendingReqs().length;
    if (p) tips.push(['file', '#e-demandes', 'Transparence', 'Transparency', 'Répondez aux ' + p + ' demandes en attente', 'Answer the ' + p + ' pending requests',
      'Envoyez le document ou refusez en expliquant pourquoi : les deux comptent comme une réponse.', 'Send the document or decline with a reason: both count as an answer.']);
    state.compliance.forEach(function (c) {
      if (c.status === 'expiring' || c.status === 'missing') tips.push(['check', '#e-check', 'Conformité', 'Compliance', (c.status === 'missing' ? 'Déposez : ' : 'Renouvelez : ') + c.fr.charAt(0).toLowerCase() + c.fr.slice(1),
        (c.status === 'missing' ? 'Upload: ' : 'Renew: ') + c.en, 'Un document manquant ou expiré fait baisser le critère Conformité.', 'A missing or expired document lowers the Compliance criterion.']);
    });
    var bank = state.sources.filter(function (s) { return s.id === 'bank'; })[0];
    if (bank && !bank.on) tips.push(['data', '#e-data', 'Régularité des revenus', 'Revenue regularity', 'Connectez votre compte bancaire', 'Connect your bank account',
      'Plus KAME voit de revenus réguliers, plus ce critère est solide.', 'The more regular income KAME sees, the stronger this criterion.']);
    tips.push(['clock', '', 'Historique de paiement', 'Payment history', 'Payez vos échéances à temps', 'Pay your instalments on time',
      'Fournisseurs, crédits, loyers : chaque retard compte.', 'Suppliers, loans, rent: every delay counts.']);
    tips.push(['pie', '', 'Niveau d\'endettement', 'Debt level', 'Gardez vos dettes à court terme sous contrôle', 'Keep your short-term debts under control',
      'Le critère compare vos dettes à vos revenus réguliers.', 'This criterion compares your debts with your regular income.']);
    var tipsHtml = '<ul class="biz-tips">' + tips.map(function (x) {
      var inner = hexIcon(x[0], '#145B63') + '<span><span class="inv-chip">' + t(x[2], x[3]) + '</span><strong>' + t(x[4], x[5]) + '</strong><span class="inv-meta">' + t(x[6], x[7]) + '</span></span>';
      return '<li>' + (x[1] ? '<a href="' + x[1] + '">' + inner + ic('right', 18, 2) + '</a>' : '<div>' + inner + '</div>') + '</li>';
    }).join('') + '</ul>';
    var share = state.share ? '<div class="biz-share"><label class="sr-only" for="biz-share-link">' + t('Lien de partage', 'Share link') + '</label>' +
      '<input id="biz-share-link" class="inv-input" readonly value="' + esc(state.share.url) + '"><button type="button" class="btn btn-outline btn-sm" data-copy="' + esc(state.share.url) + '">' + ic('copy', 16, 2) +
      t('Copier', 'Copy') + '</button></div><p class="inv-meta">' + t('Valable jusqu\'au ' + state.share.until.fr + '. Démo : ce lien n\'est pas actif.', 'Valid until ' + state.share.until.en + '. Demo: this link is not active.') + '</p>'
      : '<button type="button" class="btn btn-primary btn-sm" data-share>' + ic('link', 16, 2) + t('Créer un lien de partage', 'Create a share link') + '</button>';
    return heading(B.com ? 'Mon KAME Score' : 'KAME Score', B.com ? 'My KAME Score' : 'KAME Score', t('Votre note de fiabilité sur 100 : ce qui la compose, et comment l\'améliorer.',
      'Your reliability rating out of 100: what makes it up, and how to improve it.')) +
      '<div class="inv-grid g-two">' + card(t('Votre KAME Score', 'Your KAME Score'), U.gauge(B.score) + '<p class="inv-center">' + trendTag(B.trend) + ' ' + t('en un mois', 'in one month') + '</p>' +
        lineChart([{ values: B.scoreHist, color: level(B.score).c }], { h: 140, fmt: function (v) { return String(Math.round(v)); }, label: L('Évolution de votre KAME Score', 'Your KAME Score history') }) +
        '<p class="inv-foot-note">' + t('Mieux que ' + B.betterThan + ' % des entreprises de votre secteur. Prochain calcul : ' + nc.fr + '.',
          'Better than ' + B.betterThan + '% of businesses in your sector. Next calculation: ' + nc.en + '.') + '</p>') +
      card(t('Ce qui compose votre score', 'What makes up your score'), bars(subs) + '<p class="inv-foot-note">' + t('Le critère Transparence se met à jour dès que KAME a vérifié votre réponse ; le score total est recalculé chaque mois, de la même façon pour toutes les entreprises.',
        'The Transparency criterion updates as soon as KAME has verified your answer; the total score is recalculated every month, the same way for every business.') + '</p>') +
      card(ic('trend', 20, 2) + t('Comment améliorer votre score', 'How to improve your score'), tipsHtml, '', 'wide') +
      card(ic('link', 20, 2) + t('Partager mon score', 'Share my score'), '<p>' + t('Envoyez un lien sécurisé à une banque, une microfinance ou un investisseur : il verra votre score et son détail pendant 7 jours.',
        'Send a secure link to a bank, a microfinance institution or an investor: they will see your score and its breakdown for 7 days.') + '</p>' + share) +
      card(ic('info', 20, 2) + t('Comment le score est calculé', 'How the score is calculated'), '<ul class="biz-bullets">' +
        '<li>' + t('Six critères, à partir des données que vous partagez avec votre accord.', 'Six criteria, from the data you share with your consent.') + '</li>' +
        '<li>' + t('Transparence : 60 % taux de réponse, 25 % rapidité, 15 % documents vérifiés. Un refus motivé compte comme une réponse.',
          'Transparency: 60% response rate, 25% speed, 15% verified documents. A refusal with a reason counts as an answer.') + '</li>' +
        '<li>' + t('Même calcul pour toutes les entreprises : un score ne s\'achète pas et ne se négocie pas.', 'Same calculation for every business: a score cannot be bought or negotiated.') + '</li></ul>') +
      '</div>' + disclaimer();
  }

  // ------------------------------------------------------------ KAME Check
  function viewCheck(tab) {
    var clients = tab === 'clients';
    var tabsHtml = U.tabs([['#e-check', '', 'Pour mon entreprise', 'For my business', 'building'], ['#e-check/clients', 'clients', 'Pour mes clients', 'For my customers', 'users']],
      clients ? 'clients' : '', 'Rubriques de KAME Check', 'KAME Check sections');
    var body;
    if (!clients) {
      var cp = compliancePct();
      var rows = state.compliance.map(function (c) {
        var st, meta, action = '';
        if (c.status === 'ok') {
          st = chip('ok', 'ok', 'Valide', 'Valid');
          meta = c.until ? t('Valide jusqu\'au ' + c.until.fr, 'Valid until ' + c.until.en) : t('Vérifié le ' + c.checked.fr, 'Checked on ' + c.checked.en);
        } else if (c.status === 'expiring') {
          var n = daysBetween(daysAgo(0), c.until);
          st = chip('warn', 'alert', 'Expire bientôt', 'Expiring soon');
          meta = t('Expire dans ' + n + ' jours (' + c.until.fr + ')', 'Expires in ' + n + ' days (' + c.until.en + ')');
          action = fileBtn('data-file="check:' + c.id + '"', 'Renouveler', 'Renew', '.pdf,image/*', 'btn-primary');
        } else if (c.status === 'review') {
          st = chip('warn', 'clock', 'En vérification', 'Being checked');
          meta = t('Déposé aujourd\'hui · KAME vérifie le document', 'Uploaded today · KAME is checking the document');
        } else {
          st = chip('ko', 'alert', 'Manquant', 'Missing');
          meta = t('Pas encore déposé', 'Not uploaded yet');
          action = fileBtn('data-file="check:' + c.id + '"', 'Déposer', 'Upload', '.pdf,image/*', 'btn-primary');
        }
        return '<li class="' + (c.status === 'ok' ? '' : (c.status === 'missing' ? 'doc-missing' : 'doc-pending')) + '">' + hexIcon('file', c.status === 'ok' ? '#0E7C75' : (c.status === 'missing' ? '#B5452F' : '#C98A1E')) +
          '<span><strong>' + t(c.fr, c.en) + '</strong><span class="inv-meta">' + meta + '</span></span><span class="biz-row-end">' + st + action + '</span></li>';
      }).join('');
      body = '<div class="inv-grid g-two">' + card(ic('check', 20, 2) + t('Votre conformité', 'Your compliance'),
        '<div class="biz-progress"><p><strong>' + cp + ' %</strong> ' + t('de vos documents sont valides', 'of your documents are valid') + '</p><span class="b-track"><span class="b-fill" style="width:' + cp +
          '%;--bc:' + (cp === 100 ? '#0E7C75' : '#E0A030') + '"></span></span></div><ul class="inv-docs">' + rows + '</ul>' +
        '<p class="inv-foot-note">' + t('Démonstration : le fichier choisi reste sur votre appareil, seule son empreinte numérique est calculée.', 'Demo: the chosen file stays on your device; only its digital fingerprint is computed.') + '</p>', '', 'wide') +
        card(ic('bell', 20, 2) + t('Rappels', 'Reminders'), '<p>' + t('KAME vous prévient 30 jours puis 7 jours avant l\'expiration d\'un document, par e-mail et dans vos notifications.',
          'KAME reminds you 30 days and then 7 days before a document expires, by email and in your notifications.') + '</p>' +
          '<button type="button" class="biz-switch" data-alerts aria-pressed="' + state.alerts + '"><span class="sw" aria-hidden="true"></span>' + t('Rappels d\'expiration', 'Expiry reminders') + '</button>') +
        card(ic('score', 20, 2) + t('Pourquoi c\'est important', 'Why it matters'), '<ul class="biz-bullets"><li>' + t('Des documents à jour font partie du critère « Conformité et identité » de votre KAME Score.',
          'Up-to-date documents are part of the "Compliance and identity" criterion of your KAME Score.') + '</li><li>' + t('Les banques et les investisseurs les demandent presque toujours avant un financement.',
          'Banks and investors almost always ask for them before funding.') + '</li></ul>') + '</div>';
    } else {
      var res = state.checkResult;
      var result = '';
      if (res) {
        result = res.length ? res.map(function (pr) {
          return '<article class="biz-check-card">' + hexIcon(SECTORS[pr[2]].icon, SECTORS[pr[2]].color) + '<div><h3>' + esc(pr[0]) + '</h3><p class="inv-meta">' + sectorName(pr[2]) + ' · ' + ic('pin', 14, 2) + esc(pr[1]) +
            ' · RCCM ' + esc(pr[4]) + '</p><p class="co-badges"><span class="inv-verified">' + ic('shield', 15, 2) + t('Vérifiée par KAME ID', 'Verified by KAME ID') + '</span>' +
            (pr[5] ? chip('ok', 'ok', 'Documents à jour', 'Documents up to date') : chip('warn', 'alert', '1 document expiré', '1 expired document')) +
            '<span class="inv-tag">KAME Score ' + lvChip(pr[3], L('Niveau ', 'Level ')) + '</span></p><p class="inv-meta">' + t('Membre KAME depuis ' + pr[6], 'KAME member since ' + pr[6]) + '</p></div></article>';
        }).join('') : '<div class="inv-verify ko">' + ic('info', 22, 2) + '<div><strong>' + t('Aucune entreprise trouvée sur KAME', 'No business found on KAME') + '</strong><span>' +
          t('Elle n\'est peut-être pas encore inscrite. Soyez prudent avant une vente à crédit, ou invitez-la à rejoindre KAME.', 'It may not be registered yet. Be careful before a sale on credit, or invite it to join KAME.') +
          '</span><button type="button" class="btn btn-outline btn-sm" data-invite-partner>' + t('Inviter cette entreprise', 'Invite this business') + '</button></div></div>';
      }
      body = '<div class="inv-grid g-req"><div class="biz-stack">' + card(ic('search', 20, 2) + t('Vérifier un client ou un fournisseur', 'Check a customer or a supplier'),
        '<p>' + t('Avant une vente à crédit ou un contrat, vérifiez que l\'entreprise existe, que ses documents sont à jour et quel est son niveau de fiabilité.',
          'Before a sale on credit or a contract, check that the business exists, that its documents are up to date and how reliable it is.') + '</p>' +
        '<form class="biz-form biz-search-form" data-form="partner" novalidate role="search"><label class="inv-search">' + ic('search', 18, 2) + '<span class="sr-only">' + t('Nom ou numéro RCCM', 'Name or RCCM number') + '</span>' +
        '<input type="search" name="q" required minlength="2" value="' + esc(state.checkQuery) + '" placeholder="' + esc(L('Nom ou numéro RCCM…', 'Name or RCCM number…')) + '"></label>' +
        '<button type="submit" class="btn btn-primary btn-sm">' + t('Vérifier', 'Check') + '</button></form>' +
        '<p class="inv-foot-note">' + t('Pour essayer : « Mvett », « Akanda » ou « Moanda ».', 'To try it: "Mvett", "Akanda" or "Moanda".') + '</p>') +
        (res ? '<div class="biz-check-results" aria-live="polite">' + result + '</div>' : '') + '</div>' +
        card(ic('clock', 20, 2) + t('Mes dernières vérifications', 'My latest checks'), state.checks.length ? '<ul class="inv-docs">' + state.checks.map(function (c) {
          return '<li>' + hexIcon(c.found ? 'shield' : 'info', c.found ? '#0E7C75' : '#B5452F') + '<span><strong>' + esc(c.q) + '</strong><span class="inv-meta">' + (c.found ? t('Trouvée et vérifiée', 'Found and verified') :
            t('Introuvable sur KAME', 'Not found on KAME')) + ' · ' + t('aujourd\'hui', 'today') + '</span></span></li>';
        }).join('') + '</ul>' : '<p class="inv-meta">' + t('Aucune vérification pour le moment.', 'No checks yet.') + '</p>') + '</div>';
    }
    return heading(B.com ? 'Conformité' : 'KAME Check', B.com ? 'Compliance' : 'KAME Check', t('Vos documents à jour, et la vérification de vos clients et fournisseurs avant de travailler avec eux.',
      'Your documents up to date, and checks on your customers and suppliers before you work with them.')) + tabsHtml + '<div class="inv-tabpanel">' + body + '</div>' + disclaimer();
  }

  // ------------------------------------------------------------ KAME Registre
  function receiptList(list, compact) {
    return '<ul class="inv-docs biz-receipts">' + list.map(function (r) {
      return '<li>' + hexIcon('receipt', '#145B63') + '<span><strong>' + esc(r.no) + ' · ' + money(r.amount) + '</strong><span class="inv-meta">' + esc(r.client) + ' · ' +
        (typeof r.object === 'string' ? esc(r.object) : t(r.object.fr, r.object.en)) + ' · ' + dateText(r.date) + '</span>' + (compact ? '' : '<span class="inv-meta">' + t('Code ', 'Code ') +
        '<code>' + esc(r.code.slice(0, 4) + '-' + r.code.slice(4)) + '</code></span>') + '</span>' + (compact ? chip('ok', 'shield', 'Certifié', 'Certified') :
        (r.text ? '<button type="button" class="btn btn-outline btn-sm" data-download="' + esc(r.no) + '">' + ic('download', 16, 2) + t('Télécharger', 'Download') + '</button>' : chip('ok', 'shield', 'Certifié', 'Certified'))) + '</li>';
    }).join('') + '</ul>';
  }
  function viewRegistre(tab) {
    var clients = tab === 'clients';
    var tabsHtml = U.tabs([['#e-registre', '', 'Pour mon entreprise', 'For my business', 'building'], ['#e-registre/clients', 'clients', 'Pour mes clients', 'For my customers', 'users']],
      clients ? 'clients' : '', 'Rubriques de KAME Registre', 'KAME Registre sections');
    var body;
    if (!clients) {
      var pend = state.pendingReg;
      var types = [['contrat', 'Contrat signé', 'Signed contract'], ['facture', 'Facture', 'Invoice'], ['bilan', 'Bilan ou comptes', 'Accounts'], ['livraison', 'Bon de livraison', 'Delivery note'], ['autre', 'Autre document', 'Other document']];
      var reg = pend ? '<div class="biz-reg-pending"><p class="inv-meta">' + t('Fichier : ', 'File: ') + '<strong>' + esc(pend.name) + '</strong></p><p class="inv-meta">' + t('Empreinte : ', 'Fingerprint: ') +
          '<code>' + pend.hash.slice(0, 16) + '…' + pend.hash.slice(-8) + '</code></p>' + (pend.dup ? '<p class="inv-chip warn">' + ic('info', 14, 2) + t('Ce document est déjà enregistré (' + pend.dup.fr + ').', 'This document is already recorded (' + pend.dup.en + ').') + '</p>' :
          '<form class="biz-form" data-form="register" novalidate>' + field('Type d\'opération', 'Type of operation', selectEl('type', types, 'contrat')) +
          '<div class="biz-form-foot"><button type="button" class="btn btn-outline btn-sm" data-cancel-reg>' + t('Annuler', 'Cancel') + '</button><button type="submit" class="btn btn-primary btn-sm">' + ic('registre', 16, 2) +
          t('Enregistrer dans le registre', 'Record in the registry') + '</button></div></form>') + '</div>'
        : '<label class="inv-drop">' + ic('upload', 26, 1.8) + '<span>' + t('Choisir un document à enregistrer', 'Choose a document to record') + '</span><input type="file" data-file="register"></label>';
      var vr = state.verifyResult;
      var verifyOut = vr ? (vr.ok ? '<div class="inv-verify ok">' + ic('shield', 22, 2) + '<div><strong>' + t('Document authentique', 'Authentic document') + '</strong><span>' + vr.label + '</span>' + (vr.hash ? '<code>' + vr.hash + '</code>' : '') + '</div></div>'
        : '<div class="inv-verify ko">' + ic('info', 22, 2) + '<div><strong>' + t('Non reconnu', 'Not recognised') + '</strong><span>' + t('Ce document ou ce code ne figure pas dans le registre : il n\'y a jamais été enregistré, ou il a été modifié.',
          'This document or code is not in the registry: it was never recorded, or it has been changed.') + '</span>' + (vr.hash ? '<code>' + vr.hash + '</code>' : '') + '</div></div>') : '';
      body = '<div class="inv-grid g-two">' + card(ic('registre', 20, 2) + t('Enregistrer un document', 'Record a document'),
        '<p>' + t('Contrat, facture, bilan, bon de livraison : son empreinte numérique est enregistrée avec la date. Ensuite, toute modification du document se voit.',
          'Contract, invoice, accounts, delivery note: its digital fingerprint is recorded with the date. After that, any change to the document shows.') + '</p>' + reg) +
        card(ic('shield', 20, 2) + t('Vérifier un document ou un reçu', 'Verify a document or a receipt'), '<label class="inv-drop">' + ic('upload', 26, 1.8) + '<span>' + t('Choisir un fichier', 'Choose a file') +
          '</span><input type="file" data-file="verify"></label><form class="biz-form biz-code-form" data-form="code" novalidate>' + field('Ou entrez le code d\'un reçu', 'Or enter a receipt code',
          input('code', 'maxlength="12" required placeholder="ex. 4F2A-9C1B" autocomplete="off" spellcheck="false"')) + '<div class="biz-form-foot"><button type="submit" class="btn btn-outline btn-sm">' + t('Vérifier le code', 'Check the code') +
          '</button></div></form><div class="biz-verify-out" aria-live="polite">' + verifyOut + '</div>' +
          '<p class="inv-foot-note">' + t('Le fichier n\'est envoyé nulle part : son empreinte est calculée sur votre appareil. ', 'The file is not sent anywhere: its fingerprint is computed on your device. ') +
          '<a href="assets/demo/attestation-kame-demo.txt" download>' + t('Document de démonstration', 'Demo document') + '</a></p>') +
        card(ic('clock', 20, 2) + t('Historique enregistré', 'Recorded history'), '<ol class="inv-timeline">' + state.regs.map(function (e) {
          return '<li><span class="tl-seal">' + ic('shield', 16, 2.2) + '</span><div><strong>' + t(e.fr, e.en) + '</strong><span class="inv-meta">' + dateText(e.when) + ' · ' + t('Empreinte ', 'Fingerprint ') +
            '<code>' + e.hash.slice(0, 10) + '…' + e.hash.slice(-6) + '</code></span></div>' + chip('ok', '', 'Enregistré', 'Recorded') + '</li>';
        }).join('') + '</ol>', '', 'wide') + '</div>';
    } else {
      var last = state.lastReceipt;
      var payOpts = Object.keys(PAY).map(function (k) { return [k, PAY[k][0], PAY[k][1]]; });
      var form = '<form class="biz-form" data-form="receipt" novalidate><div class="biz-row">' +
        field('Client', 'Customer', input('client', 'maxlength="80" required minlength="2" autocomplete="off"')) +
        field('Montant (FCFA)', 'Amount (FCFA)', input('amount', 'type="number" min="100" max="1000000000" step="1" required inputmode="numeric"')) + '</div>' +
        field('Objet', 'Description', input('object', 'maxlength="100" required minlength="2" placeholder="' + esc(L('ex. 2 sacs de ciment', 'e.g. 2 bags of cement')) + '"')) +
        field('Moyen de paiement', 'Payment method', selectEl('payment', payOpts, 'momo')) +
        '<div class="biz-form-foot"><button type="submit" class="btn btn-primary btn-sm">' + ic('receipt', 16, 2) + t('Émettre le reçu certifié', 'Issue the certified receipt') + '</button></div></form>';
      var preview = last ? '<div class="biz-receipt" aria-live="polite"><p class="br-head">' + ic('shield', 18, 2) + '<strong>' + t('Reçu certifié', 'Certified receipt') + '</strong><span>' + esc(last.no) + '</span></p>' +
        '<dl><div><dt>' + t('Émis par', 'Issued by') + '</dt><dd>' + nameHtml() + '</dd></div><div><dt>' + t('Client', 'Customer') + '</dt><dd>' + esc(last.client) + '</dd></div>' +
        '<div><dt>' + t('Objet', 'Description') + '</dt><dd>' + esc(last.object) + '</dd></div><div><dt>' + t('Montant', 'Amount') + '</dt><dd><strong>' + money(last.amount) + '</strong></dd></div>' +
        '<div><dt>' + t('Paiement', 'Payment') + '</dt><dd>' + t(PAY[last.payment][0], PAY[last.payment][1]) + '</dd></div><div><dt>' + t('Date', 'Date') + '</dt><dd>' + dateText(last.date) + '</dd></div></dl>' +
        '<p class="br-code">' + t('Code de vérification', 'Verification code') + ' <code>' + esc(last.code.slice(0, 4) + '-' + last.code.slice(4)) + '</code></p>' +
        '<div class="biz-form-foot"><button type="button" class="btn btn-primary btn-sm" data-download="' + esc(last.no) + '">' + ic('download', 16, 2) + t('Télécharger le reçu', 'Download the receipt') + '</button>' +
        '<button type="button" class="btn btn-outline btn-sm" data-wa="' + esc(last.no) + '">' + ic('chat', 16, 2) + t('Envoyer par WhatsApp', 'Send by WhatsApp') + '</button></div></div>' : '';
      body = '<div class="inv-grid g-two">' + card(ic('receipt', 20, 2) + t('Émettre un reçu certifié', 'Issue a certified receipt'),
        '<p>' + t('Votre client reçoit un reçu avec un code : il peut vérifier à tout moment qu\'il vient bien de vous et qu\'il n\'a pas été modifié.',
          'Your customer gets a receipt with a code: they can check at any time that it really comes from you and has not been changed.') + '</p>' + form + preview) +
        '<div class="biz-stack">' + card(ic('info', 20, 2) + t('Comment votre client vérifie', 'How your customer verifies'), '<ol class="inv-how">' + [
          ['Il garde le reçu', 'They keep the receipt', 'Fichier, capture ou papier : le code suffit.', 'File, screenshot or paper: the code is enough.'],
          ['Il va sur kamegroupe.com', 'They go to kamegroupe.com', 'Rubrique KAME Registre.', 'KAME Registre section.'],
          ['Il dépose le fichier ou tape le code', 'They upload the file or type the code', 'Le résultat s\'affiche aussitôt.', 'The result shows straight away.'],
          ['KAME confirme', 'KAME confirms', 'Reçu authentique, ou non reconnu s\'il a été modifié.', 'Authentic receipt, or not recognised if it was changed.']
        ].map(function (x, i) { return '<li><span class="how-n">' + (i + 1) + '</span><span><strong>' + t(x[0], x[1]) + '</strong><span>' + t(x[2], x[3]) + '</span></span></li>'; }).join('') + '</ol>' +
          '<p class="inv-foot-note"><a href="#e-registre">' + t('Essayer la vérification', 'Try the verification') + '</a></p>') + '</div>' +
        card(ic('clock', 20, 2) + t('Reçus émis', 'Receipts issued'), receiptList(state.receipts, false), '', 'wide') + '</div>';
    }
    return heading('KAME Registre', 'KAME Registre', t('Vos opérations clés enregistrées de façon infalsifiable, et des reçus certifiés pour vos clients.',
      'Your key operations recorded in a tamper-proof way, and certified receipts for your customers.')) + tabsHtml + '<div class="inv-tabpanel">' + body + '</div>' + disclaimer();
  }

  // ------------------------------------------------------------ KAME Garde
  function viewGarde() {
    var protections = [
      [true, 'E-mail confirmé', 'Email confirmed', 'Votre adresse e-mail a été vérifiée.', 'Your email address has been verified.'],
      [true, 'Mot de passe solide', 'Strong password', 'Au moins 8 caractères. Changez-le si vous pensez qu\'il est connu.', 'At least 8 characters. Change it if you think someone knows it.'],
      [null, 'Double authentification', 'Two-step verification', 'Un code en plus du mot de passe. Bientôt disponible.', 'A code on top of your password. Coming soon.'],
      [true, 'Accès de l\'équipe limités', 'Limited team access', 'Chaque membre n\'a que les droits dont il a besoin.', 'Each member only has the rights they need.'],
      [state.alerts, 'Alertes de connexion', 'Sign-in alerts', 'Un e-mail à chaque connexion depuis un nouvel appareil.', 'An email for each sign-in from a new device.']
    ];
    var okCount = protections.filter(function (p) { return p[0] === true; }).length;
    var prot = '<div class="biz-progress"><p><strong>' + okCount + '/5</strong> ' + t('protections actives', 'protections active') + '</p><span class="b-track"><span class="b-fill" style="width:' + okCount * 20 +
      '%;--bc:' + (okCount >= 4 ? '#0E7C75' : '#E0A030') + '"></span></span></div><ul class="inv-docs">' + protections.map(function (p, i) {
        var st = p[0] === true ? chip('ok', 'ok', 'Actif', 'On') : (p[0] === null ? chip('warn', 'clock', 'Bientôt', 'Soon') : chip('ko', '', 'Désactivé', 'Off'));
        var action = i === 4 ? '<button type="button" class="biz-switch" data-alerts aria-pressed="' + state.alerts + '"><span class="sw" aria-hidden="true"></span><span class="sr-only">' + t('Alertes de connexion', 'Sign-in alerts') + '</span></button>' : st;
        return '<li>' + hexIcon(p[0] === true ? 'shield' : 'lock', p[0] === true ? '#0E7C75' : '#9AA9AE') + '<span><strong>' + t(p[1], p[2]) + '</strong><span class="inv-meta">' + t(p[3], p[4]) + '</span></span>' + action + '</li>';
      }).join('') + '</ul>';
    var roleOpts = ['accountant', 'sales', 'viewer'].map(function (k) { return [k, TEAM_ROLES[k][0], TEAM_ROLES[k][1]]; });
    var team = '<div class="inv-table-wrap"><table class="inv-table biz-team"><thead><tr><th>' + t('Membre', 'Member') + '</th><th>' + t('Rôle', 'Role') + '</th><th>' + t('Dernier accès', 'Last access') +
      '</th><th><span class="sr-only">' + t('Actions', 'Actions') + '</span></th></tr></thead><tbody>' + state.team.map(function (m) {
        var r = TEAM_ROLES[m.role];
        return '<tr><td><strong>' + esc(m.name) + (m.me ? ' <span class="inv-chip">' + t('Vous', 'You') + '</span>' : '') + '</strong><span class="inv-meta">' + esc(m.email) + '</span></td>' +
          '<td>' + t(r[0], r[1]) + '<span class="inv-meta">' + t(r[2], r[3]) + '</span></td><td>' + (m.invited ? chip('warn', 'clock', 'Invitation envoyée', 'Invitation sent') : t(m.last[0], m.last[1])) + '</td>' +
          '<td>' + (m.me ? '' : '<button type="button" class="inv-link danger" data-remove-member="' + m.id + '">' + t('Retirer', 'Remove') + '<span class="sr-only"> ' + esc(m.name) + '</span></button>') + '</td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<form class="biz-form biz-invite" data-form="member" novalidate><div class="biz-row">' + field('E-mail du nouveau membre', 'New member\'s email', input('email', 'type="email" required maxlength="120" autocomplete="off"')) +
      field('Rôle', 'Role', selectEl('role', roleOpts, 'viewer')) + '</div><div class="biz-form-foot"><button type="submit" class="btn btn-primary btn-sm">' + ic('plus', 16, 2.2) + t('Inviter', 'Invite') +
      '</button></div></form>';
    var me = state.team[0].name.split(' ')[0];
    var acts = [
      ['user', 'Connexion de ' + me + ' · Libreville · Chrome sur Android', me + ' signed in · Libreville · Chrome on Android', ['Il y a 5 min', '5 min ago']],
      ['receipt', 'Reçu ' + state.receipts[0].no + ' émis par Rodrigue K.', 'Receipt ' + state.receipts[0].no + ' issued by Rodrigue K.', ['Il y a 3 h', '3 h ago']],
      ['alert', 'Connexion bloquée : appareil inconnu à Douala (5 mots de passe faux)', 'Sign-in blocked: unknown device in Douala (5 wrong passwords)', ['Hier', 'Yesterday'], true],
      ['registre', 'Opération enregistrée dans KAME Registre (' + state.regs[0].fr + ')', 'Operation recorded in KAME Registre (' + state.regs[0].en + ')', ['Il y a 4 j', '4 d ago']],
      ['users', 'Droits du comptable limités à la lecture', 'Accountant\'s rights limited to read-only', ['Il y a 9 j', '9 d ago']]
    ];
    var activity = '<ul class="inv-notifs biz-activity">' + acts.map(function (a) {
      return '<li><div class="biz-act' + (a[4] ? ' warn' : '') + '">' + hexIcon(a[0], a[4] ? '#B5452F' : '#145B63') + '<span><span class="n-text">' + t(a[1], a[2]) + '</span><span class="inv-meta">' + t(a[3][0], a[3][1]) +
        '</span></span></div></li>';
    }).join('') + '</ul>';
    return heading(B.com ? 'Sécurité' : 'KAME Garde', B.com ? 'Security' : 'KAME Garde', t('La sécurité de votre compte et de votre équipe : qui a accès à quoi, et ce qui se passe sur votre compte.',
      'The security of your account and your team: who can access what, and what happens on your account.')) +
      '<div class="inv-grid g-two">' + card(ic('garde', 20, 2) + t('Niveau de protection', 'Protection level'), prot) +
      card(ic('clock', 20, 2) + t('Activité récente', 'Recent activity'), activity) +
      card(ic('users', 20, 2) + t('Mon équipe', 'My team'), team, '', 'wide') + '</div>' + disclaimer();
  }

  // ------------------------------------------------------------ Mes investisseurs
  function viewInvestisseurs() {
    var types = [['Particuliers', 'Individuals', 9, '#159E96'], ['Business angels', 'Business angels', 7, '#145B63'], ['Fonds d\'investissement', 'Investment funds', 4, '#B8734F'], ['Institutions', 'Institutions', 3, '#E0A030']];
    var origins = [['Gabon', 'Gabon', 14], ['Diaspora', 'Diaspora', 6], ['International', 'International', 3]];
    var interests = state.intros.filter(function (i) { return i.status !== 'done'; });
    var done = state.intros.filter(function (i) { return i.status === 'done'; });
    var introHtml = '<ul class="inv-docs biz-intros">' + done.map(function (i) {
      return '<li>' + hexIcon('user', '#0E7C75') + '<span><strong>' + esc(i.name) + '</strong><span class="inv-meta">' + t(i.type[0], i.type[1]) + ' · ' + esc(i.city) + ' · ' +
        t('mise en relation le ' + i.date.fr, 'introduced on ' + i.date.en) + '</span></span>' + chip('ok', 'ok', 'Accord des deux côtés', 'Both agreed') + '</li>';
    }).join('') + interests.map(function (i) {
      var action = i.status === 'interest' ? '<span class="biz-row-end"><button type="button" class="btn btn-primary btn-sm" data-intro-yes="' + i.id + '">' + t('Accepter la mise en relation', 'Accept the introduction') +
        '</button><button type="button" class="btn btn-outline btn-sm" data-intro-no="' + i.id + '">' + t('Pas maintenant', 'Not now') + '</button></span>' :
        (i.status === 'accepted' ? chip('warn', 'clock', 'KAME organise la mise en relation', 'KAME is arranging the introduction') : chip('', '', 'Refusée', 'Declined'));
      return '<li class="' + (i.status === 'interest' ? 'doc-pending' : '') + '">' + hexIcon('investor', '#C98A1E') + '<span><strong>' + t('Un investisseur (' + i.type[0].toLowerCase() + ')', 'An investor (' + i.type[1].toLowerCase() + ')') +
        '</strong><span class="inv-meta">' + esc(i.city) + ' · ' + t('intéressé depuis le ' + i.date.fr, 'interested since ' + i.date.en) + '</span></span>' + action + '</li>';
    }).join('') + '</ul>';
    var pending = interests.filter(function (i) { return i.status === 'interest'; }).length;
    return heading('Mes investisseurs', 'My investors', t('Qui s\'intéresse à votre entreprise. Les noms n\'apparaissent qu\'avec l\'accord de l\'investisseur.',
      'Who is interested in your business. Names only appear with the investor\'s consent.')) +
      '<div class="inv-kpis">' + kpi('investor', '#159E96', t('Investisseurs qui vous suivent', 'Investors following you'), String(B.followers), '<span class="inv-trend up">' + ic('trend', 15, 2.2) + t('+4 ce mois', '+4 this month') + '</span>', spark(B.followersHist, '#159E96')) +
      kpi('eye', '#145B63', t('Vues de votre fiche', 'Profile views'), num(B.views), trendTag(18, '%') + '<span class="kpi-note">' + t('ce mois', 'this month') + '</span>') +
      kpi('star', '#B8734F', t('Intérêts manifestés', 'Expressions of interest'), String(interests.length + done.length), pending ? '<span class="kpi-note">' + t(pending + ' en attente de votre réponse', pending + ' awaiting your answer') + '</span>' : '') +
      kpi('users', '#C98A1E', t('Mises en relation', 'Introductions'), String(done.length), '') + '</div>' +
      '<div class="inv-grid g-two">' + card(ic('star', 20, 2) + t('Intérêts et mises en relation', 'Interest and introductions'), introHtml, '', 'wide') +
      card(ic('trend', 20, 2) + t('Investisseurs qui vous suivent', 'Investors following you'), lineChart([{ values: B.followersHist, color: '#145B63', fill: true }],
        { h: 170, fmt: function (v) { return String(Math.round(v)); }, label: L('Nombre d\'investisseurs qui vous suivent sur 12 mois', 'Number of investors following you over 12 months') })) +
      card(ic('pie', 20, 2) + t('Qui vous suit', 'Who follows you'), '<div class="inv-split">' + donut(types.map(function (x) { return { v: x[2], c: x[3] }; }), '<strong>' + B.followers + '</strong><span>' +
        t('investisseurs', 'investors') + '</span>', L('Investisseurs par type', 'Investors by type')) + '<ul class="inv-legend">' + types.map(function (x) {
          return '<li><span class="dot" style="background:' + x[3] + '"></span>' + t(x[0], x[1]) + '<strong>' + x[2] + '</strong></li>';
        }).join('') + '</ul></div><p class="inv-meta biz-origins">' + origins.map(function (o) { return t(o[0], o[1]) + ' : <strong>' + o[2] + '</strong>'; }).join(' · ') + '</p>') +
      card(ic('lock', 20, 2) + t('Votre vie privée, et la leur', 'Your privacy, and theirs'), '<ul class="biz-bullets"><li>' + t('Vous voyez des chiffres, pas des noms.', 'You see figures, not names.') + '</li><li>' +
        t('Un nom n\'apparaît que si l\'investisseur a manifesté son intérêt ET accepté d\'être présenté.', 'A name only appears if the investor has expressed interest AND agreed to be introduced.') + '</li><li>' +
        t('De votre côté, les investisseurs ne voient que ce que vous rendez visible.', 'On your side, investors only see what you make visible.') + '</li></ul>', '', 'wide') + '</div>' + disclaimer();
  }

  // ------------------------------------------------------------ Demandes reçues
  var R_STEPS = [['Reçue', 'Received', 'Vérifiée par KAME', 'Checked by KAME'], ['Votre réponse', 'Your answer', 'Document ou refus motivé', 'Document or reasoned refusal'],
                 ['Vérification', 'Verification', 'KAME vérifie le document', 'KAME verifies the document'], ['Publié', 'Published', 'Ajouté à vos documents', 'Added to your documents']];
  function reqCard(r) {
    var item = REQ_ITEMS[r.item];
    var refused = r.status === 'refusee';
    var reached = { attente: 1, recue: 2, verifiee: 4, refusee: 1 }[r.status];
    var steps = R_STEPS.map(function (st, i) {
      var cls = i < reached ? 'done' : (i === reached ? (refused ? 'stopped' : 'current') : '');
      if (refused && i === 1) cls = 'done';
      if (refused && i > 1) cls = '';
      return '<li class="' + cls + '"><span class="st-dot" aria-hidden="true">' + (cls === 'done' ? ic('ok', 12, 3) : '') + '</span><span class="st-txt"><strong>' + t(st[0], st[1]) + '</strong><span>' + t(st[2], st[3]) +
        '</span></span>' + (cls === 'current' ? '<span class="sr-only">' + t('(étape en cours)', '(current step)') + '</span>' : '') + '</li>';
    }).join('');
    var age = daysBetween(r.received, daysAgo(0));
    var chipHtml = r.status === 'attente' ? chip('warn', 'clock', 'À traiter', 'To answer') : (r.status === 'recue' ? chip('warn', 'clock', 'KAME vérifie', 'KAME is checking') :
      (r.status === 'verifiee' ? chip('ok', 'shield', 'Envoyé et vérifié', 'Sent and verified') : chip('ko', '', 'Refusée', 'Declined')));
    return '<article class="inv-req' + (refused ? ' is-refused' : '') + '"><div class="req-top">' + hexIcon('file', '#145B63') + '<div class="req-title"><h3>' + t(item[0], item[1]) + '</h3>' +
      '<p class="inv-meta">' + t('Demandée par ' + r.from[0] + ' · ' + r.city, 'Requested by ' + r.from[1] + ' · ' + r.city) + '</p>' +
      '<p class="inv-meta">' + t('Reçue le ' + r.received.fr, 'Received on ' + r.received.en) + '</p></div>' + chipHtml + '</div>' +
      (r.note ? '<p class="req-note">' + t('Son message : ', 'Their message: ') + t(r.note[0], r.note[1]) + '</p>' : '') +
      '<ol class="req-steps">' + steps + '</ol>' +
      (r.status === 'attente' ? '<div class="req-deadline">' + ic('clock', 16, 2) + t('À traiter sous ' + Math.max(0, 14 - age) + ' jours pour garder une bonne note de rapidité.',
        'Answer within ' + Math.max(0, 14 - age) + ' days to keep a good speed rating.') + '</div><div class="req-actions"><button type="button" class="btn btn-primary btn-sm" data-answer="' + r.id + '">' + ic('upload', 16, 2) +
        t('Envoyer le document', 'Send the document') + '</button><button type="button" class="btn btn-outline btn-sm" data-decline="' + r.id + '">' + t('Refuser', 'Decline') + '</button></div>' : '') +
      (refused ? '<div class="req-refused">' + ic('info', 18, 2) + '<div><strong>' + t('Votre motif', 'Your reason') + '</strong><span>' + esc(r.reason) + '</span></div></div>' : '') +
      (r.status === 'verifiee' || r.status === 'recue' ? '<p class="inv-meta">' + (r.file ? t('Fichier : ', 'File: ') + esc(r.file) + ' · ' : '') + (r.visibility === 'all' ? t('visible par tous les membres vérifiés', 'visible to all verified members') :
        t('visible par cet investisseur seulement', 'visible to this investor only')) + '</p>' : '') + '</article>';
  }
  function viewDemandes() {
    var counts = { '': state.reqs.length, attente: pendingReqs().length, envoyee: state.reqs.filter(function (r) { return r.status === 'recue' || r.status === 'verifiee'; }).length,
                   refusee: state.reqs.filter(function (r) { return r.status === 'refusee'; }).length };
    var list = state.reqs.filter(function (r) {
      if (!state.reqFilter) return true;
      if (state.reqFilter === 'envoyee') return r.status === 'recue' || r.status === 'verifiee';
      return r.status === state.reqFilter;
    }).sort(function (a, b) { return (a.status === 'attente' ? 0 : 1) - (b.status === 'attente' ? 0 : 1) || b.received.ts - a.received.ts; });
    var chips = '<div class="inv-chips" role="group" aria-label="' + esc(L('Filtrer les demandes', 'Filter requests')) + '">' +
      [['', 'Toutes', 'All'], ['attente', 'À traiter', 'To answer'], ['envoyee', 'Envoyées', 'Sent'], ['refusee', 'Refusées', 'Declined']].map(function (o) {
        return '<button type="button" data-reqfilter="' + o[0] + '" aria-pressed="' + (state.reqFilter === o[0]) + '">' + t(o[1], o[2]) + ' <span class="chip-n">' + counts[o[0]] + '</span></button>';
      }).join('') + '</div>';
    var tr = transparency();
    var side = card(ic('score', 20, 2) + t('Votre transparence', 'Your transparency'),
      (tr.score === null ? '<p>' + t('Pas encore évaluée : aucune demande reçue.', 'Not rated yet: no requests received.') + '</p>' :
        '<p class="biz-transp-score"><strong>' + tr.score + '</strong>/100 ' + lvChip(tr.score) + '</p>' + bars([
          { label: t('Taux de réponse', 'Response rate'), pct: tr.parts.rate, value: pct(tr.parts.rate), color: '#159E96' },
          { label: t('Rapidité', 'Speed'), pct: tr.parts.speed, value: tr.answered ? t(U.dec(tr.days) + ' j', U.dec(tr.days) + ' d') : '—', color: '#145B63' },
          { label: t('Documents vérifiés', 'Verified documents'), pct: Math.min(tr.docs, 5) * 20, value: String(tr.docs), color: '#B8734F' }])) +
      '<p class="inv-foot-note">' + t('Même calcul pour toutes les entreprises : 60 % taux de réponse, 25 % rapidité, 15 % documents vérifiés. Un refus motivé compte comme une réponse : vous n\'êtes jamais obligé de tout donner.',
        'Same calculation for every business: 60% response rate, 25% speed, 15% verified documents. A refusal with a reason counts as an answer: you are never forced to share everything.') + '</p>');
    return heading('Demandes reçues', 'Requests received', t('Les investisseurs vous demandent des documents ou des informations. Vous décidez : envoyer, ou refuser en expliquant pourquoi.',
      'Investors ask you for documents or information. You decide: send it, or decline and explain why.')) + chips +
      '<div class="inv-grid g-req"><div class="inv-reqs">' + (list.length ? list.map(reqCard).join('') : '<p class="inv-empty">' + t('Aucune demande ici.', 'No requests here.') + '</p>') + '</div>' + side + '</div>' + disclaimer();
  }

  // ------------------------------------------------------------ Levées de fonds / financement
  function oppCompact(o) {
    if (!o) return '<p class="inv-empty">' + t('Aucune demande de financement en cours.', 'No funding request in progress.') + '</p>';
    return '<div class="biz-opp"><p class="inv-chip ' + (o.status === 'online' ? 'ok' : 'warn') + '">' + (o.status === 'online' ? t('En ligne · validée par KAME', 'Online · approved by KAME') :
      t('En vérification par KAME', 'Being checked by KAME')) + '</p><h3>' + (o.custom ? esc(o.custom) : t(o.fr, o.en)) + '</h3><dl class="inv-facts"><div><dt>' + t('Montant recherché', 'Amount sought') + '</dt><dd>' + money(o.amount) +
      '</dd></div><div><dt>' + t('Type', 'Type') + '</dt><dd>' + t(OPP_TYPES[o.type][0], OPP_TYPES[o.type][1]) + '</dd></div><div><dt>' + t('Durée', 'Term') + '</dt><dd>' + t(o.months + ' mois', o.months + ' months') +
      '</dd></div>' + (o.status === 'online' ? '<div><dt>' + t('Intérêts', 'Interest') + '</dt><dd>' + t(o.interested + ' ' + (B.com ? 'financeurs' : 'investisseurs'), o.interested + (B.com ? ' lenders' : ' investors')) + '</dd></div>' : '') +
      '</dl>' + (o.status === 'online' ? '<p class="inv-meta">' + ic('eye', 15, 2) + t(o.views + ' vues', o.views + ' views') + ' · ' + ic('clock', 15, 2) + t('clôture dans ' + o.days + ' jours', 'closes in ' + o.days + ' days') + '</p>' : '') + '</div>';
  }
  function viewLevees() {
    var typeOpts = (B.com ? ['micro', 'loan'] : ['loan', 'equity']).map(function (k) { return [k, OPP_TYPES[k][0], OPP_TYPES[k][1]]; });
    var form = '<form class="biz-form" data-form="opp" novalidate>' + field('Titre du projet', 'Project title', input('title', 'maxlength="90" required minlength="5" placeholder="' + esc(L('ex. Achat d\'un camion de livraison', 'e.g. Buying a delivery truck')) + '"')) +
      '<div class="biz-row">' + field('Montant recherché (FCFA)', 'Amount sought (FCFA)', input('amount', 'type="number" min="100000" max="5000000000" step="1000" required inputmode="numeric"')) +
      field('Type de financement', 'Type of funding', selectEl('type', typeOpts, typeOpts[0][0])) +
      field('Durée (mois)', 'Term (months)', input('months', 'type="number" min="3" max="120" required value="' + (B.com ? 12 : 24) + '"')) + '</div>' +
      field('À quoi serviront les fonds ?', 'What will the funds be used for?', '<textarea class="inv-input" name="use" rows="3" maxlength="600" required minlength="20"></textarea>') +
      '<div class="biz-form-foot"><button type="submit" class="btn btn-primary btn-sm">' + ic('send', 16, 2) + t('Envoyer à KAME pour vérification', 'Send to KAME for checking') + '</button></div></form>';
    var mine = state.opps.map(function (o) {
      return '<article class="inv-card biz-opp-card">' + oppCompact(o) + (o.status === 'online' ? '<div class="req-actions">' + (B.com ? '' : '<a class="btn btn-outline btn-sm" href="#e-investisseurs">' +
        t('Voir les intérêts', 'See interest') + '</a>') + '<button type="button" class="btn btn-outline btn-sm" data-edit-opp>' + ic('edit', 16, 2) + t('Modifier', 'Edit') + '</button></div>' :
        '<p class="inv-foot-note">' + t('KAME vérifie votre demande (2 à 5 jours ouvrés) avant de la publier.', 'KAME checks your request (2 to 5 working days) before publishing it.') + '</p>') + '</article>';
    }).join('');
    return heading(B.com ? 'Financement' : 'Mes levées de fonds', B.com ? 'Funding' : 'My fundraising', B.com ?
      t('Demandez un financement : après vérification par KAME, votre demande est présentée à des partenaires agréés (microfinances, banques).',
        'Request funding: once checked by KAME, your request is shown to licensed partners (microfinance institutions, banks).') :
      t('Publiez un besoin de financement : après vérification par KAME, il apparaît dans les opportunités des investisseurs.',
        'Post a funding need: once checked by KAME, it appears in investors\' opportunities.')) +
      '<div class="inv-grid g-two"><div class="biz-stack">' + mine + '</div>' + card(ic('plus', 20, 2) + (B.com ? t('Nouvelle demande de financement', 'New funding request') : t('Publier un nouveau besoin', 'Post a new need')), form) +
      card(ic('info', 20, 2) + t('Les règles', 'The rules'), '<ul class="biz-bullets"><li>' + t('KAME Score de niveau C ou plus pour publier.', 'A KAME Score of level C or better to post.') + '</li><li>' +
        t('Aucun argent ne passe par KAME : le financement se fait directement, ou par un partenaire agréé.', 'No money goes through KAME: funding happens directly, or through a licensed partner.') + '</li><li>' +
        t('Des informations exactes : une fausse déclaration entraîne le retrait de la demande.', 'Accurate information: a false statement means the request is removed.') + '</li><li>' +
        t('Pas de promesse de rendement garanti.', 'No promise of guaranteed returns.') + '</li></ul>', '', 'wide') + '</div>' + disclaimer();
  }

  // ------------------------------------------------------------ Documents
  function viewDocuments() {
    var opts = Object.keys(VIS).map(function (k) { return [k, VIS[k][0], VIS[k][1]]; });
    var rows = state.docs.map(function (d) {
      return '<li>' + hexIcon(d.vis === 'private' ? 'lock' : 'file', d.vis === 'private' ? '#9AA9AE' : '#145B63') + '<span><strong>' + (d.custom ? esc(d.custom) : t(d.fr, d.en)) + '</strong><span class="inv-meta">' +
        t('Ajouté le ' + d.added.fr, 'Added on ' + d.added.en) + (d.fromReq ? ' · ' + t('suite à une demande', 'after a request') : '') + (d.shared ? ' · ' + t('partagé avec l\'investisseur qui l\'a demandé', 'shared with the investor who asked for it') : '') +
        '</span></span><span class="biz-row-end">' + (d.verified ? chip('ok', 'shield', 'Vérifié', 'Verified') : chip('warn', 'clock', 'En vérification', 'Being checked')) +
        '<label class="inv-select biz-vis"><span class="sr-only">' + t('Qui peut voir : ', 'Who can see: ') + (d.custom ? esc(d.custom) : t(d.fr, d.en)) + '</span>' +
        selectEl('vis-' + d.id, opts, d.vis, 'data-docvis="' + d.id + '"') + '</label></span></li>';
    }).join('');
    return heading('Documents', 'Documents', t('Votre coffre-fort : choisissez, pour chaque document, qui peut le voir.', 'Your vault: choose, for each document, who can see it.')) +
      '<div class="inv-grid g-req">' + card(ic('lock', 20, 2) + t('Mes documents', 'My documents'), '<ul class="inv-docs biz-vault">' + rows + '</ul><div class="biz-form-foot">' +
        fileBtn('data-file="vault"', 'Ajouter un document', 'Add a document', '.pdf,image/*,.doc,.docx,.xls,.xlsx', 'btn-primary') + '</div>') +
      card(ic('eye', 20, 2) + t('Qui peut voir ?', 'Who can see?'), '<ul class="biz-legend-vis"><li><strong>' + t('Membres vérifiés', 'Verified members') + '</strong>' +
        t('Tout investisseur vérifié peut le consulter.', 'Any verified investor can view it.') + '</li><li><strong>' + t('Sur demande', 'On request') + '</strong>' +
        t('L\'investisseur demande l\'accès, vous décidez.', 'The investor asks for access, you decide.') + '</li><li><strong>' + t('Privé', 'Private') + '</strong>' +
        t('Vous seul, et les membres de votre équipe autorisés.', 'Only you, and your authorised team members.') + '</li></ul>' +
        '<p class="inv-foot-note">' + t('Démonstration : un fichier ajouté reste sur votre appareil.', 'Demo: an added file stays on your device.') + '</p>') + '</div>' + disclaimer();
  }

  // ------------------------------------------------------------ KAME Agro
  function viewAgro() {
    var items = state.agro;
    var unit = function (p) { return t(p.unit[0], p.unit[1]); };
    var culture = B.agroType === 'culture';
    var kpis = '<div class="inv-kpis">' +
      (culture ? kpi('agro', '#159E96', t('Surface cultivée', 'Area farmed'), U.dec(items.reduce(function (s, x) { return s + x.p.size; }, 0)) + ' ha', '') :
        kpi('agro', '#159E96', t('Productions suivies', 'Products tracked'), String(items.length), '')) +
      kpi('calendar', '#145B63', t('Prochaine récolte', 'Next harvest'), (function () {
        var n = items.slice().sort(function (a, b) { return a.p.inMonths - b.p.inMonths; })[0];
        return n.p.inMonths === 0 ? t('En cours', 'Under way') : t(monthIn(n.p.inMonths).fr, monthIn(n.p.inMonths).en);
      })(), '') +
      kpi('box', '#B8734F', t('Produits en stock', 'Products in stock'), String(items.filter(function (x) { return x.stock > 0; }).length) + '/' + items.length, '') +
      kpi('trend', '#C98A1E', t('Ventes agricoles du mois', 'Farm sales this month'), millions(B.rev[11] * 0.6) + ' FCFA', trendTag(B.mom, '%')) + '</div>';
    var table = '<div class="inv-table-wrap"><table class="inv-table"><thead><tr><th>' + t('Production', 'Product') + '</th><th>' + (culture ? t('Surface', 'Area') : t('Volume', 'Volume')) + '</th><th>' +
      t('Stade', 'Stage') + '</th><th>' + t('Récolte prévue', 'Expected harvest') + '</th><th>' + t('Quantité prévue', 'Expected quantity') + '</th></tr></thead><tbody>' + items.map(function (x) {
        var p = x.p, m = monthIn(p.inMonths);
        return '<tr><td><strong>' + t(p.fr, p.en) + '</strong></td><td>' + (culture ? U.dec(p.size) + ' ha' : num(p.size) + ' ' + unit(p)) + '</td><td>' + t(p.stageFr, p.stageEn) + '</td><td>' +
          (p.inMonths === 0 ? chip('ok', '', 'En cours', 'Under way') : t(m.fr, m.en)) + '</td><td>' + num(p.expected) + ' ' + unit(p) + '</td></tr>';
      }).join('') + '</tbody></table></div>';
    var stock = bars(items.map(function (x) {
      return { label: t(x.p.fr, x.p.en), pct: x.stock / x.p.cap * 100, value: U.dec(Math.round(x.stock * 10) / 10) + ' ' + L(x.p.unit[0], x.p.unit[1]), color: x.stock / x.p.cap > 0.8 ? '#B8734F' : '#159E96' };
    }));
    var prodOpts = items.map(function (x, i) { return [String(i), x.p.fr, x.p.en]; });
    var form = '<form class="biz-form" data-form="harvest" novalidate><div class="biz-row">' + field('Production', 'Product', selectEl('product', prodOpts, '0')) +
      field('Quantité', 'Quantity', input('qty', 'type="number" min="0.1" max="100000" step="0.1" required inputmode="decimal"')) + '</div>' +
      '<div class="biz-form-foot"><button type="submit" class="btn btn-primary btn-sm">' + ic('plus', 16, 2.2) + t('Ajouter au stock', 'Add to stock') + '</button></div></form>' +
      (state.harvests.length ? '<ul class="inv-docs">' + state.harvests.map(function (h) {
        return '<li>' + hexIcon('agro', '#159E96') + '<span><strong>' + t(h.p.fr, h.p.en) + ' · ' + U.dec(h.qty) + ' ' + t(h.p.unit[0], h.p.unit[1]) + '</strong><span class="inv-meta">' + t('ajouté aujourd\'hui', 'added today') + '</span></span></li>';
      }).join('') + '</ul>' : '');
    return heading('KAME Agro', 'KAME Agro', t('Le suivi de votre activité agricole : productions, récoltes, stocks et ventes.', 'Tracking your farming activity: products, harvests, stock and sales.')) + kpis +
      '<div class="inv-grid g-two">' + card(ic('agro', 20, 2) + t('Mes productions', 'My products'), table, '', 'wide') + card(ic('box', 20, 2) + t('Stock disponible', 'Stock available'), stock +
        '<p class="inv-foot-note">' + t('Cuivre : stock presque plein, pensez à vendre ou à livrer.', 'Copper: stock nearly full, plan to sell or deliver.') + '</p>') +
      card(ic('plus', 20, 2) + t('Enregistrer une récolte', 'Record a harvest'), form) +
      card(ic('score', 20, 2) + t('Pourquoi c\'est utile', 'Why it helps'), '<p>' + t('Des récoltes régulières et des ventes suivies montrent la solidité de votre activité : elles renforcent votre KAME Score et rassurent les financeurs, qui connaissent mieux vos saisons.',
        'Regular harvests and tracked sales show how solid your activity is: they strengthen your KAME Score and reassure lenders, who better understand your seasons.') + '</p>', '', 'wide') + '</div>' + disclaimer();
  }
  function monthIn(n) {
    var d = new Date(NOW.getFullYear(), NOW.getMonth() + n, 1);
    var FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    var EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return { fr: FR[d.getMonth()] + ' ' + d.getFullYear(), en: EN[d.getMonth()] + ' ' + d.getFullYear() };
  }

  // ------------------------------------------------------------ menu de gauche et carte d'encouragement
  function renderNav() {
    var nav = shell.querySelector('[data-biz-nav]');
    nav.setAttribute('aria-label', L(B.com ? 'Espace commerçant' : 'Espace entreprise', B.com ? 'Merchant space' : 'Business space'));
    nav.innerHTML = NAV[role].filter(function (x) { return !(x[5] && x[5].indexOf('agro') >= 0 && !B.agro); }).map(function (x) {
      if (x[0] === 'label') return '<p class="inv-nav-label">' + t(x[1], x[2]) + '</p>';
      var opt = x[5] || '';
      return '<a class="inv-nav-item' + (opt.indexOf('sub') >= 0 ? ' sub' : '') + '" href="' + x[0] + '" data-nav="' + x[1] + '">' + ic(x[2], 20, 1.9) + '<span>' + t(x[3], x[4]) + '</span>' +
        (opt.indexOf('count') >= 0 ? '<span class="inv-nav-count" data-req-count hidden></span>' : '') + '</a>';
    }).join('');
    var txt = shell.querySelector('[data-biz-side-text]'), btn = shell.querySelector('[data-biz-side-btn]');
    if (txt) txt.innerHTML = B.com ? t('Un commerce fiable obtient plus facilement un financement.', 'A reliable shop gets funding more easily.') : t('Une entreprise transparente attire les financements.', 'A transparent business attracts funding.');
    if (btn) { btn.innerHTML = t('Améliorer mon score', 'Improve my score'); btn.setAttribute('href', '#e-score'); }
    // Menu du compte : le lien « Mon entreprise » devient « Ma boutique » pour un commerçant
    document.querySelectorAll('[data-biz-menu-label] > span:last-child').forEach(function (el) {
      el.innerHTML = B.com ? t('Ma boutique', 'My shop') : t('Mon entreprise', 'My business');
    });
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
    if (view === 'e-agro' && !B.agro) view = 'e-accueil';
    if (view === 'e-investisseurs' && B.com) view = 'e-accueil';
    var html;
    switch (view) {
      case 'e-entreprise': html = viewEntreprise(); break;
      case 'e-id': html = viewId(args[1]); break;
      case 'e-data': html = viewData(); break;
      case 'e-score': html = viewScore(); break;
      case 'e-check': html = viewCheck(args[1]); break;
      case 'e-registre': html = viewRegistre(args[1]); break;
      case 'e-garde': html = viewGarde(); break;
      case 'e-investisseurs': html = viewInvestisseurs(); break;
      case 'e-demandes': html = viewDemandes(); break;
      case 'e-levees': html = viewLevees(); break;
      case 'e-documents': html = viewDocuments(); break;
      case 'e-agro': html = viewAgro(); break;
      default: html = viewAccueil(); view = 'e-accueil';
    }
    shell.querySelectorAll('.inv-view').forEach(function (v) {
      var on = v.getAttribute('data-view') === view;
      v.hidden = !on;
      v.innerHTML = on ? html : '';
    });
    shell.querySelectorAll('[data-nav]').forEach(function (a) {
      if (a.getAttribute('data-nav') === view) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    currentView = view;
    currentArgs = args || [view];
    updateBadges();
  }
  function route(fromUser) {
    var parts = parse();
    if (!parts) { render('e-accueil', ['e-accueil']); return; }
    var sameView = currentView === parts[0];
    render(parts[0], parts);
    if (fromUser) {
      // Nouvelle vue : on remonte en haut de l'espace et on place le lecteur d'écran sur le titre
      var top = shell.getBoundingClientRect().top + window.pageYOffset - 110;
      if (!sameView && window.pageYOffset > top) window.scrollTo(0, Math.max(0, top));
      var view = shell.querySelector('.inv-view:not([hidden])');
      var h = view && view.querySelector('[tabindex="-1"]');
      if (h && !sameView) h.focus({ preventScroll: true });
    }
  }
  // Redessine la vue en cours en gardant le focus sur le même contrôle
  var FOCUS_KEYS = ['data-reqfilter', 'data-answer', 'data-decline', 'data-intro-yes', 'data-intro-no', 'data-docvis', 'data-share', 'data-connect', 'data-alerts', 'data-showrev',
                    'data-showclients', 'data-resend', 'data-download', 'name'];
  function rerender() {
    if (!active || !currentView || shell.hidden) return;
    var el = document.activeElement, key = null;
    if (el && shell.contains(el)) {
      FOCUS_KEYS.forEach(function (k) {
        if (!key && el.hasAttribute(k)) key = '[' + k + '="' + el.getAttribute(k) + '"]' + (k === 'data-showrev' ? '[value="' + el.value + '"]' : '');
      });
    }
    var y = window.pageYOffset;
    render(currentView, currentArgs);
    var again = key && shell.querySelector(key);
    if (again) again.focus({ preventScroll: true });
    window.scrollTo(0, y);
  }

  // ------------------------------------------------------------ actions
  function maskPhone(p) {
    var s = String(p).replace(/\s+/g, ' ').trim();
    if (s.replace(/\D/g, '').length < 6) return s;
    return s.slice(0, Math.max(4, s.length - 8)).trim() + ' •• •• ' + s.slice(-2);
  }
  function download(no) {
    var r = state.receipts.filter(function (x) { return x.no === no; })[0];
    if (!r || !r.text) return;
    var url = URL.createObjectURL(new Blob([r.text], { type: 'text/plain;charset=utf-8' }));
    var a = document.createElement('a');
    a.href = url;
    a.download = 'recu-' + r.no + '.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }
  // Reçu certifié : le texte est fixé, son empreinte donne le code ; l'empreinte du fichier final sert à le vérifier
  function issueReceipt(d) {
    var no = 'REC-' + NOW.getFullYear() + '-' + pad(state.receiptSeq++, 4);
    var date = daysAgo(0);
    var en = U.isEn();
    var payLabel = en ? PAY[d.payment][1] : PAY[d.payment][0];
    var core = (en ? ['KAME REGISTRE - CERTIFIED RECEIPT', 'Number: ' + no, 'Date: ' + date.en, 'Issued by: ' + B.nameEn + ' (' + B.city + ')', 'Customer: ' + d.client, 'Description: ' + d.object,
                      'Amount: ' + num(d.amount).replace(/ /g, ' ') + ' FCFA', 'Payment: ' + payLabel]
                   : ['KAME REGISTRE - REÇU CERTIFIÉ', 'Numéro : ' + no, 'Date : ' + date.fr, 'Émis par : ' + B.nameFr + ' (' + B.city + ')', 'Client : ' + d.client, 'Objet : ' + d.object,
                      'Montant : ' + num(d.amount).replace(/ /g, ' ') + ' FCFA', 'Paiement : ' + payLabel]).join('\n');
    return U.sha256(core).then(function (h1) {
      var code = h1.slice(0, 8).toUpperCase();
      var text = core + '\n' + (en ? 'Verification code: ' : 'Code de vérification : ') + code.slice(0, 4) + '-' + code.slice(4) + '\n' +
        (en ? 'Check this receipt on kamegroupe.com (KAME Registre) with this code, or by uploading this file.\nDemo version: this receipt is fictitious.\n'
            : 'Vérifiez ce reçu sur kamegroupe.com (KAME Registre) avec ce code, ou en déposant ce fichier.\nVersion de démonstration : ce reçu est fictif.\n');
      return U.sha256(text).then(function (h2) {
        var r = { no: no, client: d.client, object: d.object, amount: d.amount, payment: d.payment, date: date, code: code, hash: h2, text: text };
        state.receipts.unshift(r);
        state.lastReceipt = r;
        return r;
      });
    });
  }
  function verifyHash(hx) {
    var found = null;
    state.regs.forEach(function (e) { if (e.hash === hx) found = { label: t(e.fr, e.en) + ' · ' + nameHtml() + ' · ' + dateText(e.when) }; });
    state.receipts.forEach(function (r) { if (r.hash === hx) found = { label: t('Reçu ', 'Receipt ') + esc(r.no) + ' · ' + money(r.amount) + ' · ' + esc(r.client) + ' · ' + dateText(r.date) }; });
    if (hx === DEMO_DOC_HASH) found = { label: t('Livraison confirmée (12 tonnes de manioc) · enregistré par Coopérative Agro de Ndjolé', 'Delivery confirmed (12 tonnes of cassava) · recorded by Coopérative Agro de Ndjolé') };
    state.verifyResult = found ? { ok: true, label: found.label, hash: hx } : { ok: false, hash: hx };
  }
  function openAnswer(id) {
    var r = state.reqs.filter(function (x) { return x.id === id; })[0];
    if (!r) return;
    var item = REQ_ITEMS[r.item];
    openModal({
      title: t('Envoyer : ', 'Send: ') + t(item[0], item[1]),
      confirm: t('Envoyer le document', 'Send the document'),
      body: '<p>' + t('KAME vérifie le document avant de le montrer. Démonstration : le fichier reste sur votre appareil.', 'KAME verifies the document before showing it. Demo: the file stays on your device.') + '</p>' +
        '<label class="inv-field"><span>' + t('Document', 'Document') + '</span><input class="inv-input" type="file" name="ans-file" accept=".pdf,image/*,.doc,.docx,.xls,.xlsx"></label>' +
        '<fieldset class="inv-choices"><legend>' + t('Qui pourra le voir ?', 'Who will be able to see it?') + '</legend>' +
        '<label class="inv-choice"><input type="radio" name="ans-vis" value="all" checked><span>' + t('Tous les membres vérifiés', 'All verified members') + ' <em>' + t('(recommandé : une seule réponse pour tous)', '(recommended: one answer for everyone)') + '</em></span></label>' +
        '<label class="inv-choice"><input type="radio" name="ans-vis" value="one"><span>' + t('Seulement l\'investisseur qui l\'a demandé', 'Only the investor who asked for it') + '</span></label></fieldset>' +
        '<label class="inv-field"><span>' + t('Message (facultatif)', 'Message (optional)') + '</span><textarea name="ans-msg" rows="2" maxlength="400"></textarea></label>',
      check: function (box) {
        var f = box.querySelector('[name="ans-file"]');
        if (!f.files || !f.files[0]) return t('Choisissez le document à envoyer.', 'Choose the document to send.');
        if (f.files[0].size > 20 * 1024 * 1024) return t('Le fichier dépasse 20 Mo.', 'The file is over 20 MB.');
        return '';
      },
      done: function () {
        var file = modal.querySelector('[name="ans-file"]').files[0];
        r.status = 'recue';
        r.answered = daysAgo(0);
        r.file = file.name;
        r.visibility = modal.querySelector('[name="ans-vis"]:checked').value;
        var doc = { id: 'd' + Date.now(), fr: item[0], en: item[1], vis: r.visibility === 'all' ? 'members' : 'private', verified: false, added: daysAgo(0), fromReq: true, shared: r.visibility !== 'all' };
        state.docs.unshift(doc);
        rerender();
        toast(t('Document envoyé. KAME le vérifie avant de le montrer à l\'investisseur.', 'Document sent. KAME verifies it before showing it to the investor.'));
        setTimeout(function () {
          r.status = 'verifiee';
          doc.verified = true;
          addNotif({ icon: 'shield', go: '#e-demandes', when: ['À l\'instant', 'Just now'], fr: 'KAME a vérifié votre document « ' + item[0] + ' ». Votre critère Transparence est mis à jour.',
                     en: 'KAME verified your document "' + item[1] + '". Your Transparency criterion is updated.' });
          rerender();
        }, 5000);
      }
    });
  }
  var SUGGEST = [['Information confidentielle (contrat avec un client).', 'Confidential information (contract with a customer).'],
                 ['Document pas encore disponible : je l\'enverrai dès que possible.', 'Document not available yet: I will send it as soon as possible.'],
                 ['Je propose un autre document à la place.', 'I am offering another document instead.']];
  function openDecline(id) {
    var r = state.reqs.filter(function (x) { return x.id === id; })[0];
    if (!r) return;
    var item = REQ_ITEMS[r.item];
    openModal({
      title: t('Refuser : ', 'Decline: ') + t(item[0], item[1]),
      confirm: t('Refuser la demande', 'Decline the request'),
      body: '<p>' + t('Expliquez pourquoi : l\'investisseur verra votre motif. Un refus motivé compte comme une réponse dans votre critère Transparence.',
          'Explain why: the investor will see your reason. A refusal with a reason counts as an answer in your Transparency criterion.') + '</p>' +
        '<div class="biz-suggest" role="group" aria-label="' + esc(L('Motifs fréquents', 'Common reasons')) + '">' + SUGGEST.map(function (s, i) {
          return '<button type="button" class="biz-suggest-btn" data-suggest="' + i + '">' + t(s[0], s[1]) + '</button>';
        }).join('') + '</div>' +
        '<label class="inv-field"><span>' + t('Votre motif', 'Your reason') + '</span><textarea name="dec-reason" rows="3" maxlength="400"></textarea></label>',
      check: function (box) {
        return box.querySelector('[name="dec-reason"]').value.trim().length < 15 ? t('Expliquez votre refus en une phrase (15 caractères au moins).', 'Explain your refusal in one sentence (at least 15 characters).') : '';
      },
      done: function () {
        r.status = 'refusee';
        r.answered = daysAgo(0);
        r.reason = modal.querySelector('[name="dec-reason"]').value.trim();
        rerender();
        toast(t('Refus envoyé avec votre motif. Il compte comme une réponse.', 'Refusal sent with your reason. It counts as an answer.'));
      }
    });
  }
  modal.addEventListener('click', function (e) {
    var b = e.target.closest('[data-suggest]');
    if (!b) return;
    var s = SUGGEST[+b.getAttribute('data-suggest')];
    var ta = modal.querySelector('[name="dec-reason"]');
    if (ta) { ta.value = U.isEn() ? s[1] : s[0]; ta.focus(); }
  });

  function formData(form) {
    var o = {};
    new FormData(form).forEach(function (v, k) { o[k] = typeof v === 'string' ? v.trim() : v; });
    return o;
  }
  var FORMS = {
    profile: function (f, d) {
      var pr = state.profile;
      pr.desc = d.desc; pr.staff = parseInt(d.staff, 10) || pr.staff; pr.since = parseInt(d.since, 10) || pr.since; pr.legal = d.legal; pr.web = d.web; pr.phone = d.phone;
      rerender();
      toast(t('Démo : vos informations sont enregistrées le temps de votre visite.', 'Demo: your information is saved for this visit.'));
    },
    idclient: function (f, d) {
      var digits = d.phone.replace(/\D/g, '');
      if (digits.length < 8) return t('Le numéro WhatsApp doit compter au moins 8 chiffres.', 'The WhatsApp number must have at least 8 digits.');
      var c = { id: 'c' + Date.now(), name: d.name, phone: maskPhone(d.phone), reason: d.reason, status: 'envoyee', date: daysAgo(0) };
      state.clients.unshift(c);
      state.idUsage = Math.min(100, state.idUsage + 1);
      var nm = esc(B.generic ? L(B.com ? 'votre commerçant' : 'votre fournisseur', B.com ? 'your shop' : 'your supplier') : B.name);
      state.lastIdMsg = '<div class="biz-msg"><p class="biz-msg-head">' + ic('chat', 16, 2) + t('Message envoyé à ', 'Message sent to ') + esc(d.name) + ' <em>(' + t('démo : rien n\'est envoyé', 'demo: nothing is sent') + ')</em></p>' +
        '<p class="biz-bubble">' + th('Bonjour ' + esc(d.name) + ', ' + nm + ' vous invite à confirmer votre identité avec KAME ID. C\'est rapide et sécurisé : kamegroupe.com/id/v/' + hex(rng(c.id), 6).toUpperCase() +
          '. Vos documents ne sont pas transmis à ' + nm + '.', 'Hello ' + esc(d.name) + ', ' + nm + ' invites you to confirm your identity with KAME ID. It is quick and secure: kamegroupe.com/id/v/' +
          hex(rng(c.id), 6).toUpperCase() + '. Your documents are not shared with ' + nm + '.') + '</p></div>';
      rerender();
      toast(t('Demande de vérification envoyée à ' + d.name + '.', 'Verification request sent to ' + d.name + '.'));
      setTimeout(function () {
        c.status = 'verifiee';
        addNotif({ icon: 'id', go: '#e-id/clients', when: ['À l\'instant', 'Just now'], fr: d.name + ' a confirmé son identité avec KAME ID.', en: d.name + ' confirmed their identity with KAME ID.' });
        if (currentView === 'e-id') rerender();
      }, 6000);
    },
    partner: function (f, d) {
      var q = plain(d.q);
      var res = PARTNERS.filter(function (p) { return plain(p[0] + ' ' + p[4] + ' ' + p[1]).indexOf(q) >= 0; });
      state.checkQuery = d.q;
      state.checkResult = res;
      state.checks.unshift({ q: d.q, found: res.length > 0 });
      state.checks = state.checks.slice(0, 5);
      rerender();
    },
    receipt: function (f, d) {
      var amount = parseInt(d.amount, 10);
      if (!(amount >= 100)) return t('Indiquez un montant d\'au moins 100 FCFA.', 'Enter an amount of at least 100 FCFA.');
      return issueReceipt({ client: d.client, object: d.object, amount: amount, payment: d.payment }).then(function (r) {
        rerender();
        toast(t('Reçu ' + r.no + ' émis et enregistré dans KAME Registre.', 'Receipt ' + r.no + ' issued and recorded in KAME Registre.'));
        var dl = shell.querySelector('[data-download="' + r.no + '"]');
        if (dl) dl.focus();
      });
    },
    code: function (f, d) {
      var code = d.code.toUpperCase().replace(/[^0-9A-F]/g, '');
      var r = state.receipts.filter(function (x) { return x.code === code; })[0];
      state.verifyResult = r ? { ok: true, label: t('Reçu ', 'Receipt ') + esc(r.no) + ' · ' + money(r.amount) + ' · ' + esc(r.client) + ' · ' + dateText(r.date) } : { ok: false };
      rerender();
    },
    register: function (f, d) {
      var pend = state.pendingReg;
      if (!pend) return;
      var types = { contrat: ['Contrat signé', 'Signed contract'], facture: ['Facture', 'Invoice'], bilan: ['Bilan ou comptes', 'Accounts'], livraison: ['Bon de livraison', 'Delivery note'], autre: ['Document', 'Document'] };
      var ty = types[d.type] || types.autre;
      state.regs.unshift({ fr: ty[0] + ' : ' + pend.name, en: ty[1] + ': ' + pend.name, when: daysAgo(0), hash: pend.hash });
      state.pendingReg = null;
      rerender();
      toast(t('Enregistré dans KAME Registre. Toute modification future du document se verra.', 'Recorded in KAME Registre. Any future change to the document will show.'));
    },
    member: function (f, d) {
      state.team.push({ id: 'm' + Date.now(), name: d.email.split('@')[0], email: d.email, role: d.role, invited: true });
      rerender();
      toast(t('Démo : invitation préparée pour ' + d.email + '. En version réelle, la personne reçoit un e-mail.', 'Demo: invitation prepared for ' + d.email + '. In the live version, the person gets an email.'));
    },
    opp: function (f, d) {
      var amount = parseInt(d.amount, 10);
      if (!(amount >= 100000)) return t('Indiquez un montant d\'au moins 100 000 FCFA.', 'Enter an amount of at least 100,000 FCFA.');
      state.opps.unshift({ id: 'o' + Date.now(), custom: d.title, amount: amount, type: d.type, months: parseInt(d.months, 10) || 12, status: 'review', use: d.use });
      rerender();
      toast(t('Demande envoyée à KAME. Elle sera publiée après vérification.', 'Request sent to KAME. It will be published once checked.'));
    },
    harvest: function (f, d) {
      var x = state.agro[parseInt(d.product, 10) || 0];
      var q = parseFloat(String(d.qty).replace(',', '.'));
      if (!(q > 0)) return t('Indiquez une quantité.', 'Enter a quantity.');
      x.stock += q;
      state.harvests.unshift({ p: x.p, qty: q });
      rerender();
      toast(t('Récolte ajoutée au stock.', 'Harvest added to stock.'));
    }
  };
  shell.addEventListener('submit', function (e) {
    var f = e.target.closest('form[data-form]');
    if (!f) return;
    e.preventDefault();
    var err = f.querySelector('.biz-form-error');
    if (err) err.remove();
    if (!f.checkValidity()) { f.reportValidity(); return; }
    var handler = FORMS[f.getAttribute('data-form')];
    if (!handler) return;
    var out = handler(f, formData(f));
    var showErr = function (msg) {
      var p = document.createElement('p');
      p.className = 'inv-form-error biz-form-error';
      p.setAttribute('role', 'alert');
      p.innerHTML = msg;
      f.appendChild(p);
    };
    if (typeof out === 'string' && out) showErr(out);
    else if (out && out.then) out.catch(function () { showErr(t('Votre navigateur ne permet pas ce calcul.', 'Your browser cannot do this calculation.')); });
  });

  shell.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b || !shell.contains(b)) return;
    if (b.hasAttribute('data-reqfilter')) { state.reqFilter = b.getAttribute('data-reqfilter'); rerender(); return; }
    if (b.hasAttribute('data-answer')) { openAnswer(b.getAttribute('data-answer')); return; }
    if (b.hasAttribute('data-decline')) { openDecline(b.getAttribute('data-decline')); return; }
    if (b.hasAttribute('data-relance')) { toast(t('Démo : rappel envoyé à votre second dirigeant.', 'Demo: reminder sent to your second director.'), 'send'); return; }
    if (b.hasAttribute('data-intro-yes') || b.hasAttribute('data-intro-no')) {
      var yes = b.hasAttribute('data-intro-yes');
      var it = state.intros.filter(function (x) { return x.id === (b.getAttribute('data-intro-yes') || b.getAttribute('data-intro-no')); })[0];
      if (it) it.status = yes ? 'accepted' : 'declined';
      rerender();
      toast(yes ? t('Accepté. KAME contacte l\'investisseur : si lui aussi est d\'accord, vous recevrez ses coordonnées par e-mail.', 'Accepted. KAME contacts the investor: if they agree too, you will get their contact details by email.')
                : t('Noté. L\'investisseur ne recevra pas vos coordonnées.', 'Noted. The investor will not receive your contact details.'));
      return;
    }
    if (b.hasAttribute('data-share')) {
      var code = hex(rng('share:' + Date.now()), 8).toUpperCase();
      state.share = { url: 'https://kamegroupe.com/score/' + code.slice(0, 4) + '-' + code.slice(4), until: inDays(7) };
      rerender();
      var cp = shell.querySelector('[data-copy]');
      if (cp) cp.focus();
      return;
    }
    if (b.hasAttribute('data-copy')) {
      var text = b.getAttribute('data-copy');
      var ok = function () { toast(t('Lien copié.', 'Link copied.'), 'copy'); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, function () { selectShare(); });
      else selectShare();
      return;
    }
    if (b.hasAttribute('data-connect')) {
      var src = state.sources.filter(function (s) { return s.id === b.getAttribute('data-connect'); })[0];
      if (src) { src.on = true; src.sync = ['À l\'instant', 'Just now']; }
      rerender();
      toast(t('Démo : connexion simulée. En version réelle, vous donnez votre accord auprès de votre banque.', 'Demo: simulated connection. In the live version, you give your consent with your bank.'));
      return;
    }
    if (b.hasAttribute('data-invite-partner')) { toast(t('Démo : invitation préparée. En version réelle, l\'entreprise reçoit un message de votre part.', 'Demo: invitation prepared. In the live version, the business gets a message from you.'), 'send'); return; }
    if (b.hasAttribute('data-remove-member')) {
      var id = b.getAttribute('data-remove-member');
      var m = state.team.filter(function (x) { return x.id === id; })[0];
      state.team = state.team.filter(function (x) { return x.id !== id; });
      rerender();
      if (m) toast(t(m.name + ' n\'a plus accès à votre espace.', m.name + ' no longer has access to your space.'));
      return;
    }
    if (b.hasAttribute('data-edit-opp')) { toast(t('Démo : la modification d\'une demande publiée passe par une nouvelle vérification de KAME.', 'Demo: editing a published request goes through a new KAME check.'), 'info'); return; }
    if (b.hasAttribute('data-download')) { download(b.getAttribute('data-download')); return; }
    if (b.hasAttribute('data-wa')) { toast(t('Démo : rien n\'est envoyé. En version réelle, le reçu part sur WhatsApp avec son code.', 'Demo: nothing is sent. In the live version, the receipt goes out on WhatsApp with its code.'), 'chat'); return; }
    if (b.hasAttribute('data-resend')) {
      var c = state.clients.filter(function (x) { return x.id === b.getAttribute('data-resend'); })[0];
      if (c) { c.status = 'envoyee'; c.date = daysAgo(0); }
      rerender();
      toast(t('Nouveau lien envoyé.', 'New link sent.'), 'send');
      setTimeout(function () { if (c) { c.status = 'verifiee'; if (currentView === 'e-id') rerender(); } }, 6000);
      return;
    }
    if (b.hasAttribute('data-alerts')) { state.alerts = !state.alerts; rerender(); return; }
    if (b.hasAttribute('data-cancel-reg')) { state.pendingReg = null; rerender(); return; }
    if (b.hasAttribute('data-open-notifs')) {
      // Le clic ne doit pas atteindre le document, qui refermerait aussitôt le panneau
      e.stopPropagation();
      window.scrollTo(0, 0);
      U.openPanel('notifs');
    }
  });
  function selectShare() {
    var inp = shell.querySelector('#biz-share-link');
    if (inp) { inp.focus(); inp.select(); }
    toast(t('Sélectionnez le lien et copiez-le.', 'Select the link and copy it.'), 'info');
  }

  shell.addEventListener('change', function (e) {
    var el = e.target;
    if (el.hasAttribute('data-showrev')) { state.showRev = el.value; rerender(); return; }
    if (el.hasAttribute('data-showclients')) { state.showClients = el.checked; rerender(); return; }
    if (el.hasAttribute('data-docvis')) {
      var d = state.docs.filter(function (x) { return x.id === el.getAttribute('data-docvis'); })[0];
      if (d) d.vis = el.value;
      rerender();
      toast(t('Visibilité mise à jour : ', 'Visibility updated: ') + t(VIS[el.value][0], VIS[el.value][1]).toLowerCase());
      return;
    }
    var kind = el.getAttribute('data-file');
    if (!kind || !el.files || !el.files[0]) return;
    var file = el.files[0];
    if (kind === 'logo') {
      if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > 2 * 1024 * 1024) { toast(t('Choisissez une image PNG, JPEG ou WebP de moins de 2 Mo.', 'Choose a PNG, JPEG or WebP image under 2 MB.'), 'info'); return; }
      var fr = new FileReader();
      fr.onload = function () { if (/^data:image\/(png|jpeg|webp);base64,/.test(fr.result)) { state.profile.logo = fr.result; rerender(); toast(t('Logo ajouté.', 'Logo added.')); } };
      fr.readAsDataURL(file);
      return;
    }
    if (kind.indexOf('check:') === 0) {
      var c = state.compliance.filter(function (x) { return x.id === kind.slice(6); })[0];
      if (!c) return;
      c.status = 'review';
      rerender();
      toast(t('Document reçu. KAME le vérifie.', 'Document received. KAME is checking it.'));
      setTimeout(function () {
        c.status = 'ok';
        c.until = inDays(365);
        addNotif({ icon: 'check', go: '#e-check', when: ['À l\'instant', 'Just now'], fr: 'KAME a vérifié votre document : ' + c.fr.charAt(0).toLowerCase() + c.fr.slice(1) + '.',
                   en: 'KAME verified your document: ' + c.en + '.' });
        rerender();
      }, 5000);
      return;
    }
    if (kind === 'vault') {
      state.docs.unshift({ id: 'd' + Date.now(), custom: file.name, vis: 'private', verified: false, added: daysAgo(0) });
      rerender();
      toast(t('Document ajouté, visible par vous seul pour l\'instant.', 'Document added, visible only to you for now.'));
      return;
    }
    if (kind === 'register' || kind === 'verify') {
      U.fileHash(file).then(function (hx) {
        if (kind === 'register') {
          var dup = state.regs.filter(function (r) { return r.hash === hx; })[0];
          state.pendingReg = { name: file.name, hash: hx, dup: dup ? dup.when : null };
        } else {
          verifyHash(hx);
        }
        rerender();
      }).catch(function () { toast(t('Votre navigateur ne permet pas ce calcul.', 'Your browser cannot do this calculation.'), 'info'); });
    }
  });

  // ------------------------------------------------------------ démarrage
  function start(r) {
    role = r === 'commercant' ? 'commercant' : 'entreprise';
    var info = (window.KAME_SPACE && window.KAME_SPACE.business) || {};
    var key = role + ':' + (info.name || '') + ':' + (info.sector || '') + ':' + (info.agriculture ? 1 : 0);
    if (!cache[key]) {
      B = build({ role: role, name: info.name, sector: info.sector, city: info.city, agriculture: info.agriculture, agriType: info.agriType });
      state = initState();
      state.unread = notifications().length;
      cache[key] = { B: B, state: state };
    } else {
      B = cache[key].B;
      state = cache[key].state;
    }
    active = true;
    currentView = '';
    renderNav();
    U.setNotifier(notifier);
    route(false);
  }
  window.addEventListener('hashchange', function () { if (active && !shell.hidden) route(true); });
  document.addEventListener('kame:business', function (e) { start(e.detail && e.detail.role); });
  document.addEventListener('kame:investor', function () { active = false; });
  // Langue changée : les textes calculés et les listes déroulantes sont redessinés
  new MutationObserver(function () { if (active && !shell.hidden) { renderNav(); rerender(); } }).observe(root, { attributes: true, attributeFilter: ['lang'] });
})();
