/* KAME GROUP — espace commerçant.
   Pensé d'abord pour le téléphone, et pour le commerçant qui est souvent lui-même son commerce :
   une vente notée en 2 touches, l'argent pris pour la maison noté à part, le carnet de crédits (clients et fournisseurs),
   le stock « acheté en gros, revendu au détail », l'épargne et la tontine, la vitrine vérifiée, les papiers et le dossier de financement.
   KAME ne touche jamais l'argent : il note, calcule et certifie.
   Version de démonstration : les chiffres sont fictifs et calculés dans le navigateur ; rien n'est envoyé. */
(function () {
  'use strict';

  var shell = document.getElementById('space-merchant');
  var U = window.KAME_UI;
  if (!shell || !U) return;
  var root = document.documentElement;

  // ------------------------------------------------------------ outils communs (kame-ui.js)
  var esc = U.esc, L = U.L, ic = U.ic, plain = U.plain, num = U.num, money = U.money, clamp = U.clamp, rng = U.rng, hex = U.hex,
      NOW = U.NOW, fmtDate = U.fmtDate, daysAgo = U.daysAgo, inDays = U.inDays, dateText = U.dateText, lvChip = U.lvChip,
      trendTag = U.trendTag, hexIcon = U.hexIcon, card = U.card, heading = U.heading, bars = U.bars, gauge = U.gauge,
      spark = U.spark, toast = U.toast, openModal = U.openModal, modal = U.modal;

  // Typographie française : espace insécable avant « : ; ! ? », dans les nombres et devant « FCFA » (évite « jour↵: 23 150 »)
  function nb(s) {
    return String(s).replace(/ ([:;!?»])/g, '\u00a0$1').replace(/« /g, '«\u00a0').replace(/(\d) (?=\d{3}\b)/g, '$1\u00a0').replace(/(\d) FCFA/g, '$1\u00a0FCFA');
  }
  function t(fr, en) { return U.t(nb(fr), en); }
  // Deux langues avec du HTML déjà sûr (noms échappés avant)
  function th(frHtml, enHtml) { return '<span class="t-fr">' + nb(frHtml) + '</span><span class="t-en" lang="en">' + enHtml + '</span>'; }
  // Montant masquable (mode discret)
  function amt(n) { return '<span class="c-amt">' + money(n) + '</span>'; }
  // Montants écrits dans les deux langues (notifications, messages)
  function fcfa(n, en) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, en ? ',' : ' ') + ' FCFA'; }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function hmFr(d) { return d.getHours() + '\u00a0h\u00a0' + pad2(d.getMinutes()); }
  function hmEn(d) { return d.getHours() + ':' + pad2(d.getMinutes()); }
  function hm(d) { return t(hmFr(d), hmEn(d)); }
  function chip(cls, icon, fr, en) { return '<span class="inv-chip ' + (cls || '') + '">' + (icon ? ic(icon, 14, 2.2) : '') + t(fr, en) + '</span>'; }
  function field(labelFr, labelEn, control, hintFr, hintEn) {
    return '<label class="inv-field"><span>' + t(labelFr, labelEn) + '</span>' + control + (hintFr ? '<small class="inv-meta">' + t(hintFr, hintEn) + '</small>' : '') + '</label>';
  }
  function input(name, attrs) { return '<input class="inv-input" name="' + name + '" ' + (attrs || '') + '>'; }
  function selectEl(name, opts, val, attrs) {
    return '<select class="inv-input" name="' + name + '" ' + (attrs || '') + '>' + opts.map(function (o) {
      return '<option value="' + esc(o[0]) + '"' + (o[0] === val ? ' selected' : '') + '>' + esc(L(o[1], o[2] || o[1])) + '</option>';
    }).join('') + '</select>';
  }
  function switchBtn(attr, on, fr, en) {
    return '<button type="button" class="biz-switch" ' + attr + ' aria-pressed="' + (on ? 'true' : 'false') + '"><span class="sw"></span>' + t(fr, en) + '</button>';
  }
  function fileBtn(attr, fr, en, accept) {
    return '<label class="btn btn-outline btn-sm btn-file">' + ic('upload', 16, 2) + t(fr, en) + '<input type="file" ' + attr + (accept ? ' accept="' + accept + '"' : '') + '></label>';
  }
  function disclaimer() {
    return '<p class="inv-disclaimer">' + ic('info', 16, 2) + t('Démonstration : ventes, clients et montants fictifs. KAME ne touche jamais votre argent : il note, calcule et certifie, avec votre accord.',
      'Demo: fictitious sales, customers and amounts. KAME never touches your money: it records, calculates and certifies, with your consent.') + '</p>';
  }
  function today0() { return new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate()); }
  // Date sans l'année quand c'est l'année en cours : « 8 novembre »
  function shortFr(dt) { return new Date(dt.ts).getFullYear() === NOW.getFullYear() ? dt.fr.replace(/ \d{4}$/, '') : dt.fr; }
  function shortEn(dt) { return new Date(dt.ts).getFullYear() === NOW.getFullYear() ? dt.en.replace(/, \d{4}$/, '') : dt.en; }
  // Jours de retard (0 si l'échéance n'est pas passée) et jours restants avant une échéance
  function lateDays(due) { return Math.max(0, Math.round((today0().getTime() - due.ts) / 86400000)); }
  function leftDays(due) { return Math.round((due.ts - today0().getTime()) / 86400000); }
  function whenFr(n) { return n === 0 ? 'aujourd\'hui' : (n === 1 ? 'demain' : 'dans ' + n + ' jours'); }
  function whenEn(n) { return n === 0 ? 'today' : (n === 1 ? 'tomorrow' : 'in ' + n + ' days'); }
  function daysFr(n) { return n + (n > 1 ? ' jours' : ' jour'); }
  function daysEn(n) { return n + (n > 1 ? ' days' : ' day'); }
  var WD_FR = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  var WD_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'], DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  function longToday() {
    var f = fmtDate(NOW);
    return t(WD_FR[NOW.getDay()] + ' ' + f.fr.replace(/ \d{4}$/, ''), WD_EN[NOW.getDay()] + ', ' + f.en.replace(/, \d{4}$/, ''));
  }
  // Pluriel des unités de vente : « 9 savons », « 3 tas », « 2 petits tas », « 2 seaux » ; « 2 boxes » en anglais
  function plural(word, n, en) {
    if (n < 2 && !en) return word;
    if (n === 1 && en) return word;
    if (en) return /(s|x|ch|sh)$/.test(word) ? word + 'es' : word + 's';
    if (word === 'petit tas') return 'petits tas';
    if (/eau$/.test(word)) return word + 'x';
    return /[sxz]$/.test(word) ? word : word + 's';
  }
  // « le kilo », « la boîte », « l'unité »
  function perUnitFr(u) {
    if (/^[aeiouyéèêàâh]/i.test(u)) return 'l\'' + u;
    return (u === 'boîte' || u === 'bouteille' ? 'la ' : 'le ') + u;
  }
  function unitsHtml(p, n) { return th(num(n) + ' ' + esc(plural(p.unit[0], n)), num(n) + ' ' + esc(plural(p.unit[1], n, true))); }
  function maskPhone(p) {
    var s = String(p || '').replace(/\s+/g, ' ').trim();
    if (s.replace(/\D/g, '').length < 6) return s;
    return s.slice(0, Math.max(4, s.length - 8)).trim() + ' •• •• ' + s.slice(-2);
  }
  var seq = 1;
  function nid(p) { return p + (seq++) + Date.now().toString(36).slice(-4); }

  // ------------------------------------------------------------ référentiels
  var VIEWS = ['c-journee', 'c-vendre', 'c-credits', 'c-stock', 'c-recus', 'c-score', 'c-financement', 'c-epargne', 'c-vitrine',
               'c-papiers', 'c-securite', 'c-agro', 'c-plus'];
  // [adresse, vue, icône, FR, EN, options]
  var NAV = [
    ['#c-journee', 'c-journee', 'home', 'Ma journée', 'My day'],
    ['#c-vendre', 'c-vendre', 'plus', 'Vendre', 'Sell'],
    ['#c-credits', 'c-credits', 'users', 'Crédits', 'Credit', 'late'],
    ['#c-stock', 'c-stock', 'box', 'Stock', 'Stock', 'low'],
    ['#c-recus', 'c-recus', 'receipt', 'Reçus', 'Receipts'],
    ['label', 'Grandir', 'Grow'],
    ['#c-score', 'c-score', 'score', 'Mon KAME Score', 'My KAME Score', 'sub'],
    ['#c-financement', 'c-financement', 'target', 'Financement', 'Funding', 'sub'],
    ['#c-epargne', 'c-epargne', 'coins', 'Épargne et tontine', 'Savings and tontine', 'sub'],
    ['#c-vitrine', 'c-vitrine', 'merchant', 'Ma vitrine', 'My shop window', 'sub'],
    ['label', 'Mon commerce', 'My shop'],
    ['#c-papiers', 'c-papiers', 'check', 'Mes papiers', 'My papers', 'sub'],
    ['#c-securite', 'c-securite', 'garde', 'Sécurité et aides', 'Security and helpers', 'sub'],
    ['#c-agro', 'c-agro', 'agro', 'KAME Agro', 'KAME Agro', 'sub agro']
  ];
  var BAR = [['#c-journee', 'c-journee', 'home', 'Ma journée', 'My day'], ['#c-credits', 'c-credits', 'users', 'Crédits', 'Credit'],
             ['#c-vendre', 'c-vendre', 'plus', 'Vendre', 'Sell', 'main'], ['#c-score', 'c-score', 'score', 'Score', 'Score'], ['#c-plus', 'c-plus', 'grid', 'Plus', 'More']];

  var PAY = {
    // c : couleur sur fond clair ; light : sur le bandeau foncé des ventes du jour
    cash: { fr: 'Espèces', en: 'Cash', icon: 'cash', c: '#B8734F', light: '#F2B48C' },
    airtel: { fr: 'Airtel Money', en: 'Airtel Money', icon: 'mobile', c: '#145B63', light: '#9FE1DA' },
    moov: { fr: 'Moov Money', en: 'Moov Money', icon: 'mobile', c: '#159E96', light: '#8FD0F2' },
    credit: { fr: 'À crédit', en: 'On credit', icon: 'users', c: '#C98A1E', light: '#F5C46A' }
  };
  var PAY_OUT = ['cash', 'airtel', 'moov'];
  var EXP = {
    marchandise: ['Marchandise', 'Goods for resale', 'box'], transport: ['Transport', 'Transport', 'truck'], marche: ['Ticket de marché', 'Market fee', 'merchant'],
    loyer: ['Loyer', 'Rent', 'home'], energie: ['Électricité et eau', 'Power and water', 'sun'], telephone: ['Téléphone et internet', 'Phone and data', 'mobile'],
    emballage: ['Sachets et emballages', 'Bags and packaging', 'cart'], autre: ['Autre', 'Other', 'tag']
  };
  var ME = {
    maison: ['Maison et repas', 'Home and meals', 'home'], ecole: ['École', 'School', 'book'], sante: ['Santé', 'Health', 'heart'],
    famille: ['Famille', 'Family', 'users'], perso: ['Pour moi', 'For me', 'user'], autre: ['Autre', 'Other', 'tag']
  };
  var KIND = {
    vente: { fr: 'Vente', en: 'Sale', icon: 'cart', c: '#159E96', dir: 1 },
    depense: { fr: 'Dépense', en: 'Expense', icon: 'minus', c: '#B8734F', dir: -1 },
    moi: { fr: 'Pour moi', en: 'For me', icon: 'home', c: '#C98A1E', dir: -1 },
    rembours: { fr: 'Remboursement reçu', en: 'Repayment received', icon: 'users', c: '#0E7C75', dir: 1 },
    fournisseur: { fr: 'Paiement fournisseur', en: 'Supplier payment', icon: 'truck', c: '#7A5236', dir: -1 },
    epargne: { fr: 'Épargne', en: 'Savings', icon: 'coins', c: '#145B63', dir: -1 },
    pret: { fr: 'Échéance du prêt', en: 'Loan instalment', icon: 'target', c: '#6E8C93', dir: -1 }
  };
  var UNDOABLE = { vente: true, depense: true, moi: true };
  var UNITS = { kilo: ['kilo', 'kilo'], litre: ['litre', 'litre'], unite: ['unité', 'unit'], boite: ['boîte', 'tin'], tas: ['tas', 'pile'],
                verre: ['verre', 'glass'], bouteille: ['bouteille', 'bottle'], sachet: ['sachet', 'sachet'], paquet: ['paquet', 'pack'] };
  var LOTS = { sac: ['sac', 'bag'], carton: ['carton', 'box'], bidon: ['bidon', 'can'], paquet: ['paquet', 'pack'], regime: ['régime', 'bunch'],
               seau: ['seau', 'bucket'], cageot: ['cageot', 'crate'], casier: ['casier', 'crate'] };
  var DUE = [['3', '3 jours', '3 days'], ['7', '1 semaine', '1 week'], ['14', '2 semaines', '2 weeks'], ['30', '1 mois', '1 month']];
  // Produits achetés en gros (lot) et revendus au détail (unité de vente). Prix fictifs.
  var STOCK_SHOP = [
    { id: 'p1', fr: 'Riz', en: 'Rice', lot: ['sac de 25 kg', '25 kg bag'], lotN: ['sac', 'bag'], per: 25, buy: 16500, unit: ['kilo', 'kilo'], sell: 800, left: 31, min: 10 },
    { id: 'p2', fr: 'Huile', en: 'Cooking oil', lot: ['bidon de 20 L', '20 L can'], lotN: ['bidon', 'can'], per: 20, buy: 21000, unit: ['litre', 'litre'], sell: 1300, left: 7, min: 5 },
    { id: 'p3', fr: 'Savon', en: 'Soap', lot: ['carton de 24', 'box of 24'], lotN: ['carton', 'box'], per: 24, buy: 6000, unit: ['savon', 'bar'], sell: 350, left: 9, min: 6 },
    { id: 'p4', fr: 'Sardines', en: 'Sardines', lot: ['carton de 50 boîtes', 'case of 50 tins'], lotN: ['carton', 'case'], per: 50, buy: 17500, unit: ['boîte', 'tin'], sell: 450, left: 4, min: 10 },
    { id: 'p5', fr: 'Bâtons de manioc', en: 'Cassava sticks', lot: ['paquet de 10', 'pack of 10'], lotN: ['paquet', 'pack'], per: 10, buy: 2000, unit: ['bâton', 'stick'], sell: 300, left: 14, min: 10 },
    { id: 'p6', fr: 'Sucre', en: 'Sugar', lot: ['sac de 50 kg', '50 kg bag'], lotN: ['sac', 'bag'], per: 50, buy: 32000, unit: ['kilo', 'kilo'], sell: 800, left: 12, min: 10 }
  ];
  var STOCK_AGRO = [
    { id: 'p1', fr: 'Bâtons de manioc', en: 'Cassava sticks', lot: ['paquet de 10', 'pack of 10'], lotN: ['paquet', 'pack'], per: 10, buy: 1800, unit: ['bâton', 'stick'], sell: 300, left: 36, min: 20 },
    { id: 'p2', fr: 'Banane plantain', en: 'Plantain', lot: ['régime (5 tas)', 'bunch (5 piles)'], lotN: ['régime', 'bunch'], per: 5, buy: 3500, unit: ['tas', 'pile'], sell: 1000, left: 8, min: 10 },
    { id: 'p3', fr: 'Piment', en: 'Chilli', lot: ['seau (40 petits tas)', 'bucket (40 small piles)'], lotN: ['seau', 'bucket'], per: 40, buy: 6000, unit: ['petit tas', 'small pile'], sell: 200, left: 52, min: 15 },
    { id: 'p4', fr: 'Huile de palme', en: 'Palm oil', lot: ['bidon de 20 L', '20 L can'], lotN: ['bidon', 'can'], per: 20, buy: 18000, unit: ['litre', 'litre'], sell: 1200, left: 11, min: 6 },
    { id: 'p5', fr: 'Arachide', en: 'Groundnuts', lot: ['sac de 25 kg', '25 kg bag'], lotN: ['sac', 'bag'], per: 25, buy: 22000, unit: ['kilo', 'kilo'], sell: 1100, left: 18, min: 8 }
  ];
  var TIPS = [
    ['Faites crédit surtout aux clients qui ont déjà remboursé une fois, et demandez-leur de confirmer leur dette : elle se récupère beaucoup plus facilement.',
     'Give credit mainly to customers who have already repaid once, and ask them to confirm their debt: it is much easier to recover.'],
    ['Comptez votre caisse chaque soir : une petite différence repérée tôt évite les grosses surprises.',
     'Count your cash every evening: a small gap spotted early avoids big surprises.'],
    ['Fixez-vous un salaire : prendre toujours la même somme pour la maison protège votre stock.',
     'Pay yourself a salary: always taking the same amount for home protects your stock.'],
    ['Quand vous achetez en gros, calculez le bénéfice par carton ou par sac avant de fixer votre prix de détail.',
     'When you buy in bulk, work out the profit per box or bag before setting your retail price.'],
    ['Payer vos fournisseurs à temps fait monter votre KAME Score, et ils vous feront plus facilement crédit.',
     'Paying your suppliers on time raises your KAME Score, and they will give you credit more easily.'],
    ['Mettre de côté un peu chaque jour, même 500 FCFA, prépare le stock des fêtes.',
     'Putting a little aside every day, even 500 FCFA, prepares your holiday stock.']
  ];
  var DOC_VIS = { private: ['Moi seul', 'Only me'], dossier: ['Dans mon dossier de financement', 'In my funding file'], request: ['Sur demande', 'On request'] };

  // ------------------------------------------------------------ le commerce (données de démonstration, reproductibles)
  var M = null, state = null, cache = {};

  function build(info) {
    var name = String(info.name || '').trim();
    var r = rng('com:' + plain(name || '-') + ':' + (info.agriculture ? 1 : 0));
    var m = { generic: !name, name: name, city: String(info.city || '').trim() || 'Libreville', r: r };
    m.agro = !!info.agriculture || info.sector === 'agriculture';
    m.nameFr = name || 'Mon commerce';
    m.nameEn = name || 'My shop';
    m.since = NOW.getFullYear() - (2 + Math.floor(r() * 4));
    m.base = (m.agro ? 38000 : 46000) + Math.round(r() * 22000);   // ventes d'une journée ordinaire
    m.slug = plain(m.nameFr).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'mon-commerce';
    return m;
  }

  // 34 jours passés : quelques jours sans ventes notées (maladie, deuil, voyage au village…)
  function genHistory(r) {
    var h = [];
    for (var k = 1; k <= 34; k++) {
      var d = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() - k);
      var wd = d.getDay();
      var f = wd === 6 ? 1.4 : (wd === 0 ? 0.55 : 0.85 + r() * 0.3);
      var sales = Math.round(M.base * f / 50) * 50;
      var rec = !(k === 5 || k === 12 || k === 23);
      h.push({ d: d, rec: rec, sales: rec ? sales : 0, charges: rec ? Math.round(sales * (0.04 + r() * 0.04) / 50) * 50 : 0,
               moi: rec && r() < 0.7 ? 1000 * (2 + Math.floor(r() * 5)) : 0 });
    }
    return h;
  }

  // Les ventes du jour, de 7 h 30 jusqu'à maintenant (le neveu tient la boutique en début d'après-midi)
  function genToday(s) {
    var r = rng('day:' + plain(M.nameFr) + ':' + today0().getTime());
    var nowMin = NOW.getHours() * 60 + NOW.getMinutes();
    var endMin = Math.min(nowMin, 19 * 60 + 30);
    var list = [];
    var AMOUNTS = [200, 300, 500, 500, 700, 1000, 1000, 1500, 2000, 2500, 3000, 3500, 5000];
    var tmin = 7 * 60 + 36;
    while (tmin <= endMin) {
      var at = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate(), Math.floor(tmin / 60), tmin % 60);
      var e = { id: nid('e'), kind: 'vente', at: at, by: tmin >= 13 * 60 && tmin <= 15 * 60 + 20 ? 'h1' : 'moi', cancelled: false, items: null };
      if (r() < 0.28) {
        var p = s.stock[Math.floor(r() * s.stock.length)];
        var q = 1 + Math.floor(r() * 3);
        e.items = [[p.id, q]];
        e.amount = q * p.sell;
      } else {
        e.amount = AMOUNTS[Math.floor(r() * AMOUNTS.length)];
      }
      var x = r();
      e.pay = x < 0.56 ? 'cash' : (x < 0.86 ? 'airtel' : 'moov');
      list.push(e);
      tmin += 12 + Math.floor(r() * 26);
    }
    // Autres mouvements de la journée, s'ils ont déjà eu lieu
    var extras = [
      [8 * 60 + 5, { kind: 'depense', cat: 'transport', amount: 1000, pay: 'cash', note: ['Taxi pour aller chez le grossiste', 'Taxi to the wholesaler'] }],
      [12 * 60 + 40, { kind: 'moi', cat: 'maison', amount: 3000, pay: 'cash' }],
      [15 * 60 + 10, { kind: 'rembours', amount: 5000, pay: 'airtel', ref: 'k1', who: 'Awa M.' }],
      [17 * 60 + 20, { kind: 'depense', cat: 'emballage', amount: 1500, pay: 'cash' }]
    ];
    extras.forEach(function (x) {
      if (x[0] > endMin) return;
      var e = x[1];
      e.id = nid('e');
      e.at = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate(), Math.floor(x[0] / 60), x[0] % 60);
      e.by = 'moi';
      e.cancelled = false;
      list.push(e);
    });
    return list.sort(function (a, b) { return b.at - a.at; });
  }

  function initState() {
    var r = M.r;
    var s = {
      unread: null, notifs: [], discreet: false, showAll: false, credTab: 'clients', lastReceipt: null, verifyResult: null, receiptSeq: 18,
      salary: { amount: 25000 },
      credHist: { onTime: 14, late: 2 }, supHist: { onTime: 11, late: 1 }, conf: { yes: 9, total: 22 }, savedThisMonth: 1,
      recovered: 46000, lastHelperCode: null, calc: null
    };
    s.stock = (M.agro ? STOCK_AGRO : STOCK_SHOP).map(function (p) { var c = {}; for (var k in p) c[k] = p[k]; return c; });
    s.hist = genHistory(r);
    var nowMin = NOW.getHours() * 60 + NOW.getMinutes();
    var opened = nowMin >= 8 * 60;
    s.day = { open: opened, closed: false, float: 10000, openedAt: new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate(), 7, 30), closedAt: null, counted: null };
    s.entries = opened ? genToday(s) : [];
    var awaPaid = s.entries.filter(function (e) { return e.kind === 'rembours' && e.ref === 'k1'; })[0];
    // Carnet de crédits : ce que les clients doivent
    s.credits = [
      { id: 'k1', name: 'Awa M.', phone: '+241 06 •• •• 21', what: ['Courses de la semaine', 'Weekly groceries'], total: 17000, paid: awaPaid ? 5000 : 0,
        since: daysAgo(9), due: daysAgo(2), confirmed: 'yes', counted: true, verified: true, payments: awaPaid ? [{ amount: 5000, at: awaPaid.at, pay: 'airtel' }] : [] },
      { id: 'k2', name: 'Maman Thérèse', phone: '+241 07 •• •• 64', what: ['Riz et huile', 'Rice and oil'], total: 23000, paid: 0, since: daysAgo(16), due: daysAgo(6),
        confirmed: 'no', verified: false, payments: [] },
      { id: 'k3', name: 'Jean-Paul O.', phone: '+241 07 •• •• 58', what: ['Boissons pour une fête', 'Drinks for a party'], total: 8500, paid: 0, since: daysAgo(4), due: inDays(3),
        confirmed: 'sent', verified: true, payments: [] },
      { id: 'k4', name: 'Kevin N.', phone: '+241 06 •• •• 33', what: ['Savon et sucre', 'Soap and sugar'], total: 3500, paid: 0, since: daysAgo(1), due: inDays(6),
        confirmed: 'no', verified: false, payments: [] }
    ];
    if (M.agro) s.credits[0].what = ['Manioc et piment', 'Cassava and chilli'];
    s.settled = [
      { name: 'Grâce E.', total: 15000, when: daysAgo(6), onTime: true },
      { name: 'Restaurant Chez Mama', total: 42000, when: daysAgo(13), onTime: true },
      { name: 'Patrick L.', total: 6000, when: daysAgo(20), onTime: false }
    ];
    // Ce que le commerçant doit à ses fournisseurs
    s.suppliers = M.agro ? [
      { id: 'f1', name: 'Coopérative de Ntoum', what: ['Manioc (bâtons)', 'Cassava sticks'], total: 54000, paid: 0, since: daysAgo(8), due: inDays(4), last: null },
      { id: 'f2', name: 'Producteur de Kango', what: ['Banane plantain (12 régimes)', 'Plantain (12 bunches)'], total: 28000, paid: 0, since: daysAgo(2), due: inDays(1), last: null },
      { id: 'f3', name: 'Moulin d\'Owendo', what: ['Huile de palme (2 bidons)', 'Palm oil (2 cans)'], total: 36000, paid: 0, since: daysAgo(5), due: inDays(2), last: null }
    ] : [
      { id: 'f1', name: 'Grossiste du marché Mont-Bouët', what: ['Riz, huile, sucre', 'Rice, oil, sugar'], total: 85000, paid: 0, since: daysAgo(9), due: inDays(5), last: null },
      { id: 'f2', name: 'Boulangerie du quartier', what: ['Pain livré chaque matin', 'Bread delivered every morning'], total: 6500, paid: 0, since: daysAgo(0), due: inDays(1), last: null },
      { id: 'f3', name: 'Dépôt de boissons d\'Akébé', what: ['Boissons (2 casiers)', 'Drinks (2 crates)'], total: 32000, paid: 0, since: daysAgo(6), due: inDays(2), last: null }
    ];
    s.supPaid = [
      { name: s.suppliers[0].name, amount: 64000, when: daysAgo(10), onTime: true, confirmed: true },
      { name: s.suppliers[1].name, amount: 6500, when: daysAgo(1), onTime: true, confirmed: true },
      { name: s.suppliers[2].name, amount: 28000, when: daysAgo(17), onTime: false, confirmed: false }
    ];
    // Reçus certifiés (KAME Registre)
    var rh = [hex(r, 64), hex(r, 64), hex(r, 64)];
    var yr = NOW.getFullYear();
    s.receipts = [
      { no: 'REC-' + yr + '-0017', client: 'Awa M.', object: M.agro ? 'Manioc pour une fête' : 'Courses du mois', amount: 46500, pay: 'airtel', date: daysAgo(1), code: rh[0].slice(0, 8).toUpperCase(), hash: rh[0], verified: true },
      { no: 'REC-' + yr + '-0016', client: 'Restaurant Chez Mama', object: M.agro ? 'Banane plantain (4 régimes)' : 'Sac de riz de 25 kg', amount: 20000, pay: 'cash', date: daysAgo(3), code: rh[1].slice(0, 8).toUpperCase(), hash: rh[1] },
      { no: 'REC-' + yr + '-0015', client: 'Jean-Paul O.', object: M.agro ? 'Huile de palme (5 L)' : 'Commande pour une fête', amount: 38000, pay: 'moov', date: daysAgo(6), code: rh[2].slice(0, 8).toUpperCase(), hash: rh[2] }
    ];
    // Épargne : l'argent reste chez le commerçant (Mobile Money, microfinance, tontine) ; KAME aide seulement à suivre
    s.goals = [
      { id: 'g1', fr: 'Stock pour les fêtes', en: 'Stock for the holidays', target: 150000, saved: 62000, icon: 'box' },
      { id: 'g2', fr: 'Loyer de janvier', en: 'January rent', target: 60000, saved: 35000, icon: 'home' },
      { id: 'g3', fr: 'Rentrée scolaire', en: 'Back to school', target: 120000, saved: 20000, icon: 'book' },
      { id: 'g4', fr: 'Patente', en: 'Business licence', target: 45000, saved: 30000, icon: 'check' }
    ];
    var toFri = (5 - NOW.getDay() + 7) % 7;
    s.tontine = { fr: 'Tontine des commerçantes du quartier', en: 'Neighbourhood traders\' tontine', members: 12, amount: 10000,
                  next: inDays(toFri), turn: inDays(toFri + 28), paid: false, hist: [1, 1, 1, 0, 1, 1, 1, 1, 1, 1] };
    // Financement : le prêt en cours et le dossier
    s.loan = { fr: 'Microcrédit pour le stock', en: 'Stock microloan', partnerFr: 'Établissement de microfinance partenaire (exemple)', partnerEn: 'Partner microfinance institution (example)',
               amount: 300000, inst: 55000, count: 6, paid: 2, next: inDays(5), late: 0 };
    s.dossier = { status: '', offer: null };
    s.lreqs = [];
    s.funders = [
      { fr: 'Établissement de microfinance partenaire (exemple)', en: 'Partner microfinance institution (example)', amount: 300000, status: 'current' },
      { fr: 'Programme d\'appui aux commerçantes (exemple)', en: 'Support programme for women traders (example)', amount: 150000, status: 'done', year: NOW.getFullYear() - 1 }
    ];
    // Papiers (KAME Check) : facultatifs, mais ils font monter le score
    s.papers = [
      { id: 'anpi', fr: 'Déclarer mon activité à l\'ANPI-Gabon (entreprise individuelle)', en: 'Register my business with ANPI-Gabon (sole proprietorship)',
        whyFr: 'Votre commerce existe officiellement : les banques et les microfinances vous prennent plus au sérieux.', whyEn: 'Your business officially exists: banks and microfinance institutions take you more seriously.', status: 'todo' },
      { id: 'nif', fr: 'Obtenir mon NIF (numéro d\'identification fiscale)', en: 'Get my tax ID number (NIF)',
        whyFr: 'Souvent demandé pour un prêt ou pour travailler avec une entreprise.', whyEn: 'Often requested for a loan or to work with a company.', status: 'todo' },
      { id: 'patente', fr: 'Patente ou impôt des petits commerces', en: 'Business licence or small-business tax',
        whyFr: 'À renouveler chaque année : gardez la quittance.', whyEn: 'Renewed every year: keep the receipt.', status: 'expiring', until: inDays(12) },
      { id: 'mairie', fr: 'Autorisation de la mairie ou droits de place', en: 'Town hall permit or market fees',
        whyFr: 'Vos reçus de droits de place prouvent que vous travaillez au même endroit depuis longtemps.', whyEn: 'Your market fee receipts prove you have worked in the same place for a long time.', status: 'ok', until: inDays(140) }
    ];
    s.docs = [
      { id: 'd1', fr: 'Pièce d\'identité (vérifiée par KAME)', en: 'ID document (verified by KAME)', vis: 'dossier', verified: true, added: daysAgo(64) },
      { id: 'd2', fr: 'Quittance de patente ' + (NOW.getFullYear()), en: (NOW.getFullYear()) + ' business licence receipt', vis: 'dossier', verified: true, added: daysAgo(40) },
      { id: 'd3', fr: 'Reçus des droits de place (mairie)', en: 'Market fee receipts (town hall)', vis: 'request', verified: true, added: daysAgo(21) },
      { id: 'd4', fr: 'Factures du grossiste', en: 'Wholesaler invoices', vis: 'private', verified: false, added: daysAgo(3) }
    ];
    // Sécurité : code, appareils, aides
    s.devices = [{ id: 'v1', fr: 'Ce téléphone', en: 'This phone', when: ['Maintenant', 'Now'], me: true },
                 { id: 'v2', fr: 'Ordinateur · Chrome', en: 'Computer · Chrome', when: ['Il y a 2 jours', '2 days ago'] }];
    s.helpers = [{ id: 'h1', name: 'Junior', rel: ['Neveu', 'Nephew'], role: 'vendeur' }];
    s.activity = [
      { icon: 'users', fr: 'Junior a noté des ventes pendant que vous étiez chez le grossiste.', en: 'Junior recorded sales while you were at the wholesaler.', when: ['Aujourd\'hui', 'Today'] },
      { icon: 'lock', fr: 'Connexion depuis Ordinateur · Chrome.', en: 'Login from Computer · Chrome.', when: ['Il y a 2 jours', '2 days ago'] },
      { icon: 'key', fr: 'Code à 4 chiffres changé.', en: '4-digit code changed.', when: ['Il y a 3 semaines', '3 weeks ago'] }
    ];
    // Vitrine vérifiée
    var show = {};
    s.stock.forEach(function (p, i) { show[p.id] = i < 4; });
    s.vitrine = { published: false, desc: M.agro ? L('Produits frais du champ : manioc, banane, piment, huile de palme. Prix justes, livraison possible.', 'Fresh farm produce: cassava, plantain, chilli, palm oil. Fair prices, delivery possible.')
                                                : L('Boutique de quartier : riz, huile, savon, sardines, sucre. Ouvert tôt, fermé tard.', 'Neighbourhood shop: rice, oil, soap, sardines, sugar. Open early, closes late.'),
                  quartier: M.city === 'Libreville' ? 'Akébé' : '', hours: L('Du lundi au samedi, 7 h 30 – 20 h', 'Monday to Saturday, 7:30 am – 8 pm'), wa: '', delivery: true, logo: '', show: show };
    s.agroLoss = [];
    // Score : 11 derniers mois (le mois en cours est calculé)
    s.scoreHist = [];
    for (var j = 0; j < 11; j++) s.scoreHist.push(clamp(Math.round(64 + j * 0.8 + (r() - 0.5) * 2), 40, 99));
    s.pad = { tab: 'vente', value: 0, picks: {}, pay: 'cash', cat: 'transport', meCat: 'maison', client: '', phone: '', due: '7', confirm: true, receipt: false, rclient: '', last: null };
    return s;
  }

  // ------------------------------------------------------------ calculs
  function pname(p) { return t(p.fr, p.en); }
  function lotRevenue(p) { return p.per * p.sell; }
  function lotProfit(p) { return lotRevenue(p) - p.buy; }
  function lotMargin(p) { return lotRevenue(p) ? lotProfit(p) / lotRevenue(p) : 0; }
  function avgMargin() {
    var rev = 0, pr = 0;
    state.stock.forEach(function (p) { rev += lotRevenue(p); pr += lotProfit(p); });
    return rev ? clamp(pr / rev, 0.05, 0.6) : 0.2;
  }
  function findProduct(id) { return state.stock.filter(function (p) { return p.id === id; })[0]; }
  function isLow(p) { return p.left <= p.min; }
  function leftC(c) { return Math.max(0, c.total - c.paid); }
  function isLate(c) { return leftC(c) > 0 && lateDays(c.due) > 0; }
  function lateCredits() { return state.credits.filter(isLate); }
  function toCollect() { return state.credits.reduce(function (s, c) { return s + leftC(c); }, 0); }
  function owed() { return state.suppliers.reduce(function (s, f) { return s + leftC(f); }, 0); }

  function todayStats() {
    var s = { sales: 0, count: 0, pay: { cash: 0, airtel: 0, moov: 0, credit: 0 }, charges: 0, goods: 0, moi: 0, rembours: 0,
              cashIn: 0, cashOut: 0, momoIn: 0, momoOut: 0, last: null, byWho: {} };
    state.entries.forEach(function (e) {
      if (e.cancelled) return;
      var cash = e.pay === 'cash', momo = e.pay === 'airtel' || e.pay === 'moov';
      if (e.kind === 'vente') {
        s.sales += e.amount; s.count++; s.pay[e.pay] += e.amount;
        if (!s.last || e.at > s.last) s.last = e.at;
        s.byWho[e.by] = (s.byWho[e.by] || 0) + 1;
        if (cash) s.cashIn += e.amount;
        if (momo) s.momoIn += e.amount;
        return;
      }
      if (e.kind === 'rembours') {
        s.rembours += e.amount;
        if (cash) s.cashIn += e.amount;
        if (momo) s.momoIn += e.amount;
        return;
      }
      if (e.kind === 'depense') { if (e.cat === 'marchandise') s.goods += e.amount; else s.charges += e.amount; }
      if (e.kind === 'moi') s.moi += e.amount;
      if (cash) s.cashOut += e.amount;
      if (momo) s.momoOut += e.amount;
    });
    s.margin = avgMargin();
    s.profit = Math.round((s.sales * s.margin - s.charges) / 50) * 50;
    s.drawer = state.day.float + s.cashIn - s.cashOut;
    s.momo = s.momoIn - s.momoOut;
    return s;
  }
  // Les 7 derniers jours, aujourd'hui compris
  function weekDays() {
    var list = [];
    for (var k = 6; k >= 1; k--) { var h = state.hist[k - 1]; list.push({ d: h.d, v: h.sales, rec: h.rec }); }
    var s = todayStats();
    list.push({ d: today0(), v: s.sales, rec: s.count > 0, today: true });
    return list;
  }
  function sinceMonday() { var wd = NOW.getDay(); return wd === 0 ? 6 : wd - 1; }
  function weekMoney() {
    var n = sinceMonday(), m = avgMargin(), moi = 0, profit = 0;
    for (var k = 1; k <= n; k++) { var h = state.hist[k - 1]; moi += h.moi; profit += h.sales * m - h.charges; }
    var s = todayStats();
    return { moi: moi + s.moi, profit: Math.round((profit + s.profit) / 50) * 50 };
  }

  // KAME Score du commerçant : le même calcul pour tous, expliqué au commerçant
  var WEIGHTS = [
    { id: 'reg', fr: 'Ventes notées chaque jour', en: 'Sales recorded every day', w: 20, go: '#c-vendre' },
    { id: 'cred', fr: 'Crédits clients récupérés', en: 'Customer credit recovered', w: 15, go: '#c-credits' },
    { id: 'four', fr: 'Fournisseurs et prêt payés à temps', en: 'Suppliers and loan paid on time', w: 15, go: '#c-credits/fournisseurs' },
    { id: 'epar', fr: 'Épargne et tontine régulières', en: 'Regular savings and tontine', w: 10, go: '#c-epargne' },
    { id: 'anc', fr: 'Ancienneté du commerce', en: 'Years in business', w: 10, go: '' },
    { id: 'pap', fr: 'Identité et papiers', en: 'Identity and papers', w: 15, go: '#c-papiers' },
    { id: 'conf', fr: 'Chiffres confirmés par d\'autres', en: 'Figures confirmed by others', w: 15, go: '#c-credits' }
  ];
  function scoreParts() {
    var p = {};
    var recDays = state.hist.slice(0, 29).filter(function (h) { return h.rec; }).length + (todayStats().count > 0 ? 1 : 0);
    p.reg = recDays / 30;
    p.cred = state.credHist.onTime / Math.max(1, state.credHist.onTime + state.credHist.late + lateCredits().length);
    var lateSup = state.suppliers.filter(isLate).length;
    p.four = state.supHist.onTime / Math.max(1, state.supHist.onTime + state.supHist.late + lateSup);
    var tont = state.tontine.hist;
    p.epar = (tont.filter(function (x) { return x; }).length + (state.savedThisMonth > 0 ? 1 : 0)) / (tont.length + 1);
    var years = NOW.getFullYear() - M.since;
    p.anc = Math.min(1, (40 + years * 12) / 100);
    p.pap = (40 + 15 * state.papers.filter(function (x) { return x.status === 'ok' || x.status === 'expiring'; }).length) / 100;
    p.conf = state.conf.yes / Math.max(1, state.conf.total);
    var total = 0;
    var list = WEIGHTS.map(function (w) {
      var v = clamp(p[w.id], 0, 1);
      total += w.w * v;
      return { id: w.id, fr: w.fr, en: w.en, w: w.w, go: w.go, pct: Math.round(v * 100), pts: w.w * v };
    });
    return { list: list, score: Math.round(total), recDays: recDays, years: years };
  }

  // Ce qu'il reste à faire, du plus urgent au moins urgent
  function todos() {
    var list = [];
    lateCredits().sort(function (a, b) { return lateDays(b.due) - lateDays(a.due); }).forEach(function (c) {
      var n = lateDays(c.due);
      list.push({ icon: 'users', go: '#c-credits', tag: ['Crédit', 'Credit'],
        html: th('Relancer ' + esc(c.name) + ' : ' + amt(leftC(c)) + ', en retard de ' + daysFr(n), 'Remind ' + esc(c.name) + ': ' + amt(leftC(c)) + ', ' + daysEn(n) + ' late') });
    });
    state.suppliers.filter(function (f) { return leftC(f) > 0 && leftDays(f.due) <= 2; }).forEach(function (f) {
      var n = leftDays(f.due);
      list.push({ icon: 'truck', go: '#c-credits/fournisseurs', tag: ['Fournisseur', 'Supplier'],
        html: n < 0 ? th('Payer ' + esc(f.name) + ' : ' + amt(leftC(f)) + ', en retard de ' + daysFr(-n), 'Pay ' + esc(f.name) + ': ' + amt(leftC(f)) + ', ' + daysEn(-n) + ' late')
                    : th('Payer ' + esc(f.name) + ' : ' + amt(leftC(f)) + ' ' + whenFr(n), 'Pay ' + esc(f.name) + ': ' + amt(leftC(f)) + ' ' + whenEn(n)) });
    });
    state.stock.filter(isLow).forEach(function (p) {
      list.push({ icon: 'box', go: '#c-stock', tag: ['Stock', 'Stock'],
        html: th('Racheter : ' + esc(p.fr) + ' (il reste ' + num(p.left) + ' ' + esc(plural(p.unit[0], p.left)) + ')', 'Restock: ' + esc(p.en) + ' (' + num(p.left) + ' ' + esc(plural(p.unit[1], p.left, true)) + ' left)') });
    });
    var tn = leftDays(state.tontine.next);
    if (!state.tontine.paid && tn <= 3) {
      list.push({ icon: 'coins', go: '#c-epargne', tag: ['Tontine', 'Tontine'],
        html: th('Cotisation de la tontine ' + whenFr(tn) + ' : ' + amt(state.tontine.amount), 'Tontine contribution ' + whenEn(tn) + ': ' + amt(state.tontine.amount)) });
    }
    if (state.loan && state.loan.paid < state.loan.count) {
      var ln = leftDays(state.loan.next);
      if (ln <= 7) list.push({ icon: 'target', go: '#c-financement', tag: ['Financement', 'Funding'],
        html: th('Échéance du microcrédit ' + whenFr(Math.max(0, ln)) + ' : ' + amt(state.loan.inst), 'Microloan instalment due ' + whenEn(Math.max(0, ln)) + ': ' + amt(state.loan.inst)) });
    }
    state.papers.filter(function (x) { return x.status === 'expiring'; }).forEach(function (x) {
      var n = leftDays(x.until);
      list.push({ icon: 'check', go: '#c-papiers', tag: ['Papiers', 'Papers'],
        html: th('Renouveler : ' + esc(x.fr.charAt(0).toLowerCase() + x.fr.slice(1)) + ' (expire ' + whenFr(n) + ')', 'Renew: ' + esc(x.en) + ' (expires ' + whenEn(n) + ')') });
    });
    return list;
  }

  // ------------------------------------------------------------ notifications (cloche du bandeau)
  function notifications() {
    var base = [];
    var awa = state.entries.filter(function (e) { return e.kind === 'rembours' && e.ref === 'k1' && !e.cancelled; })[0];
    if (awa) base.push({ icon: 'users', go: '#c-credits', when: ['Aujourd\'hui', 'Today'], fr: 'Awa M. a remboursé 5 000 FCFA par Airtel Money.', en: 'Awa M. repaid 5,000 FCFA via Airtel Money.' });
    var low = state.stock.filter(isLow)[0];
    if (low) base.push({ icon: 'box', go: '#c-stock', when: ['Il y a 3 h', '3 h ago'], fr: 'Stock bas : ' + low.fr + ' (il reste ' + low.left + ' ' + plural(low.unit[0], low.left) + ').',
                         en: 'Low stock: ' + low.en + ' (' + low.left + ' ' + plural(low.unit[1], low.left, true) + ' left).' });
    var rv = state.receipts.filter(function (x) { return x.verified; })[0];
    if (rv) base.push({ icon: 'registre', go: '#c-recus', when: ['Hier', 'Yesterday'], fr: rv.client + ' a vérifié votre reçu ' + rv.no + ' : il est authentique.',
                        en: rv.client + ' verified your receipt ' + rv.no + ': it is authentic.' });
    base.push({ icon: 'score', go: '#c-score', when: ['Il y a 2 j', '2 d ago'], fr: 'Votre KAME Score a gagné 2 points ce mois-ci.', en: 'Your KAME Score gained 2 points this month.' });
    base.push({ icon: 'check', go: '#c-papiers', when: ['Il y a 3 j', '3 d ago'], fr: 'Votre patente expire bientôt : pensez à la renouveler.', en: 'Your business licence expires soon: remember to renew it.' });
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
    var late = lateCredits().length, low = state.stock.filter(isLow).length;
    shell.querySelectorAll('[data-late-count]').forEach(function (el) { el.textContent = String(late); el.hidden = !late; });
    shell.querySelectorAll('[data-low-count]').forEach(function (el) { el.textContent = String(low); el.hidden = !low; });
  }

  // ------------------------------------------------------------ petits morceaux réutilisés
  function nameHtml() { return M.generic ? t(M.nameFr, M.nameEn) : esc(M.name); }
  function payChip(k) {
    if (!k || !PAY[k]) return '';
    return '<span class="com-paychip" style="--pc:' + PAY[k].c + '">' + t(PAY[k].fr, PAY[k].en) + '</span>';
  }
  function byChip(who) {
    var h = state.helpers.filter(function (x) { return x.id === who; })[0];
    return h ? '<span class="inv-chip">' + ic('user', 13, 2.2) + t('par ', 'by ') + esc(h.name) + '</span>' : '';
  }
  function itemsLabel(items) {
    return items.map(function (x) {
      var p = findProduct(x[0]);
      return p ? th(esc(p.fr) + ' × ' + x[1], esc(p.en) + ' × ' + x[1]) : '';
    }).join(', ');
  }
  function entryLabel(e) {
    if (e.kind === 'vente') {
      var base = e.items && e.items.length ? itemsLabel(e.items) : (e.label ? esc(e.label) : t('Vente', 'Sale'));
      return e.pay === 'credit' && e.who ? base + ' · ' + th('à crédit, ' + esc(e.who), 'on credit, ' + esc(e.who)) : base;
    }
    if (e.kind === 'depense') return t(EXP[e.cat][0], EXP[e.cat][1]) + (e.note ? ' · ' + t(e.note[0], e.note[1]) : '');
    if (e.kind === 'moi') return t('Pour moi · ' + ME[e.cat][0], 'For me · ' + ME[e.cat][1]);
    if (e.kind === 'rembours') return th('Remboursement · ' + esc(e.who), 'Repayment · ' + esc(e.who));
    if (e.kind === 'fournisseur') return th('Paiement · ' + esc(e.who), 'Payment · ' + esc(e.who));
    if (e.kind === 'epargne') return th('Épargne · ' + esc(e.goalFr || ''), 'Savings · ' + esc(e.goalEn || ''));
    if (e.kind === 'pret') return t('Échéance du microcrédit', 'Microloan instalment');
    return '';
  }
  function entryRow(e, withUndo) {
    var k = KIND[e.kind];
    var credit = e.kind === 'vente' && e.pay === 'credit';
    var sign = credit ? '' : (k.dir > 0 ? '+' : '−');
    return '<li class="com-entry' + (e.cancelled ? ' is-cancelled' : '') + '">' + hexIcon(k.icon, k.c) + '<span class="ce-main"><span class="ce-label">' + entryLabel(e) + '</span>' +
      '<span class="ce-meta"><span class="ce-time">' + hm(e.at) + '</span>' + payChip(e.pay) + (e.by && e.by !== 'moi' ? byChip(e.by) : '') +
      (e.receipt ? '<span class="inv-chip">' + ic('receipt', 13, 2.2) + esc(e.receipt) + '</span>' : '') + (e.cancelled ? chip('ko', '', 'Annulée', 'Cancelled') : '') +
      (withUndo && !e.cancelled && UNDOABLE[e.kind] ? '<button type="button" class="inv-link ce-undo" data-undo="' + e.id + '">' + ic('undo', 14, 2) + t('Annuler', 'Undo') + '</button>' : '') + '</span></span>' +
      '<span class="ce-amt ' + (credit ? 'credit' : (k.dir > 0 ? 'in' : 'out')) + '">' + sign + amt(e.amount) + '</span></li>';
  }
  function todoList() {
    var list = todos();
    if (!list.length) return '<p class="biz-all-done">' + ic('ok', 20, 2.4) + t('Tout est à jour. Bravo !', 'Everything is up to date. Well done!') + '</p>';
    return '<ul class="biz-todo">' + list.map(function (x) {
      return '<li><a href="' + x.go + '">' + hexIcon(x.icon, '#B8734F') + '<span><span class="n-text">' + x.html + '</span><span class="inv-chip">' + t(x.tag[0], x.tag[1]) +
        '</span></span>' + ic('right', 18, 2) + '</a></li>';
    }).join('') + '</ul>';
  }
  function weekBars() {
    var days = weekDays();
    var max = Math.max.apply(null, days.map(function (x) { return x.v; }).concat([1]));
    return '<div class="week-bars" role="img" aria-label="' + esc(L('Ventes des 7 derniers jours', 'Sales over the last 7 days')) + '">' + days.map(function (x) {
      var label = x.today ? t('Auj.', 'Today') : t(DAYS_FR[x.d.getDay()], DAYS_EN[x.d.getDay()]);
      if (!x.rec && !x.today) {
        return '<div class="wb wb-none"><span class="wb-val">—</span><span class="wb-col"><span class="wb-bar"></span></span><span class="wb-day">' + label + '</span></div>';
      }
      return '<div class="wb' + (x.today ? ' today' : '') + '"><span class="wb-val"><span class="c-amt">' + num(x.v / 1000) + ' k</span></span><span class="wb-col"><span class="wb-bar" style="height:' +
        Math.round(x.v / max * 100) + '%"></span></span><span class="wb-day">' + label + '</span></div>';
    }).join('') + '</div>';
  }
  function tipOfDay() {
    var i = Math.floor(today0().getTime() / 86400000) % TIPS.length;
    return '<article class="com-tip">' + hexIcon('bulb', '#C98A1E') + '<div><p class="com-tip-title">' + t('Astuce du jour', 'Tip of the day') + '</p><p>' + t(TIPS[i][0], TIPS[i][1]) + '</p></div></article>';
  }
  function eyeBtn() {
    return '<button type="button" class="com-eye" data-discreet aria-pressed="' + (state.discreet ? 'true' : 'false') + '">' + ic(state.discreet ? 'eye' : 'eyeoff', 18, 2) +
      (state.discreet ? t('Montrer les montants', 'Show amounts') : t('Cacher les montants', 'Hide amounts')) + '</button>';
  }
  function progress(pctVal, color) {
    return '<span class="b-track com-track"><span class="b-fill" style="width:' + clamp(Math.round(pctVal), 0, 100) + '%;--bc:' + (color || '#159E96') + '"></span></span>';
  }
  function kpiBox(icon, color, label, value, note) {
    return '<article class="inv-kpi"><div class="kpi-top">' + hexIcon(icon, color) + '<p class="kpi-label">' + label + '</p></div><p class="kpi-value">' + value + '</p>' +
      (note ? '<p class="kpi-delta kpi-note">' + note + '</p>' : '') + '</article>';
  }

  // ------------------------------------------------------------ Ma journée (KAME Data)
  function dayStatus() {
    var d = state.day;
    if (!d.open) return t('Journée pas encore ouverte', 'Day not opened yet');
    if (d.closed) return th('Journée fermée à ' + hmFr(d.closedAt), 'Day closed at ' + hmEn(d.closedAt));
    return th('Journée ouverte depuis ' + hmFr(d.openedAt), 'Day open since ' + hmEn(d.openedAt));
  }
  function viewJournee() {
    var sp = window.KAME_SPACE || {};
    var first = esc(sp.firstName || '');
    var head = '<div class="com-head"><div class="com-head-text"><p class="com-hello">' + th('Bonjour, ' + first + ' !', 'Hello, ' + first + '!') + '</p>' +
      '<h1 class="inv-h1" tabindex="-1">' + t('Ma journée', 'My day') + '</h1><p class="inv-meta">' + longToday() + ' · ' + nameHtml() + ' · ' + dayStatus() + '</p></div>' + eyeBtn() + '</div>';
    var weekTotal = weekDays().reduce(function (s, x) { return s + x.v; }, 0);
    var weekCard = card(ic('data', 20, 2) + t('Ma semaine', 'My week'), weekBars() + '<p class="inv-foot-note">' + th('7 derniers jours : ' + amt(weekTotal) + ' de ventes notées. « — » : jour sans ventes notées.',
      'Last 7 days: ' + amt(weekTotal) + ' in recorded sales. "—": day with no sales recorded.') + '</p>', '', 'com-week');
    var todoCard = card(ic('ok', 20, 2) + t('À faire', 'To do'), todoList());
    if (!state.day.open) {
      var y = state.hist[0];
      var open = '<section class="com-open">' + hexIcon('sun', '#E0A030') + '<div class="com-open-text"><h2>' + t('Ouvrez votre journée', 'Open your day') + '</h2><p>' +
        t('Indiquez l\'argent déjà dans la caisse ce matin (le fond de caisse) : le soir, KAME vous dira combien il doit y avoir.',
          'Enter the money already in the till this morning (the float): in the evening, KAME will tell you how much there should be.') + '</p>' +
        '<form class="com-open-form" data-form="open-day" novalidate>' + field('Fond de caisse (FCFA)', 'Float (FCFA)', input('float', 'type="number" min="0" max="10000000" step="25" inputmode="numeric" value="' + state.day.float + '" required')) +
        '<button type="submit" class="btn btn-primary">' + ic('sun', 18, 2) + t('Ouvrir ma journée', 'Open my day') + '</button></form></div></section>';
      var yest = card(ic('calendar', 20, 2) + t('Hier', 'Yesterday'), y.rec ? '<p class="inv-big">' + amt(y.sales) + '</p><p class="inv-meta">' + t('de ventes notées', 'in recorded sales') + '</p>'
        : '<p class="inv-meta">' + t('Aucune vente notée hier.', 'No sales recorded yesterday.') + '</p>');
      return head + open + '<div class="inv-grid com-grid">' + yest + todoCard + '</div>' + weekCard + tipOfDay() + disclaimer();
    }
    var s = todayStats();
    var payList = ['cash', 'airtel', 'moov', 'credit'].filter(function (k) { return s.pay[k] > 0; }).map(function (k) {
      return '<li><i style="--c:' + PAY[k].light + '"></i>' + t(PAY[k].fr, PAY[k].en) + ' <strong>' + amt(s.pay[k]) + '</strong></li>';
    }).join('');
    var hero = '<section class="com-today"><div class="ct-main"><p class="ct-label">' + t('Ventes du jour', 'Today\'s sales') + '</p><p class="ct-value">' + amt(s.sales) + '</p>' +
      '<p class="ct-sub">' + (s.count ? th(s.count + (s.count > 1 ? ' ventes' : ' vente') + ' · dernière à ' + hmFr(s.last), s.count + (s.count > 1 ? ' sales' : ' sale') + ' · last at ' + hmEn(s.last))
        : t('Pas encore de vente aujourd\'hui.', 'No sale yet today.')) + '</p>' + (payList ? '<ul class="ct-pay">' + payList + '</ul>' : '') + '</div>' +
      '<a class="com-sell-btn" href="#c-vendre">' + ic('plus', 30, 2.6) + '<span>' + t('Vendre', 'Sell') + '</span></a></section>';
    var wk = weekMoney();
    var over = wk.moi > Math.max(0, wk.profit);
    var kpis = '<div class="inv-kpis three com-kpis">' +
      kpiBox('trend', '#0E7C75', t('Bénéfice estimé', 'Estimated profit'), amt(s.profit), th('avec votre marge moyenne de ' + Math.round(s.margin * 100) + ' %, moins les frais du jour',
        'with your average margin of ' + Math.round(s.margin * 100) + '%, minus today\'s costs')) +
      kpiBox('cash', '#B8734F', t('Dans la caisse', 'In the till'), amt(s.drawer), th('espèces attendues · Mobile Money du jour : ' + amt(s.momo), 'expected cash · today\'s Mobile Money: ' + amt(s.momo))) +
      kpiBox('home', '#C98A1E', t('Pris pour moi', 'Taken for me'), amt(s.moi), th('cette semaine : ' + amt(wk.moi) + ' sur ' + amt(state.salary.amount) + ' (mon salaire)',
        'this week: ' + amt(wk.moi) + ' of ' + amt(state.salary.amount) + ' (my salary)') + (over ? ' ' + chip('warn', 'alert', 'Plus que le bénéfice', 'More than the profit') : '')) + '</div>';
    var quick = '<div class="com-quick">' + [
      ['#c-vendre/depense', 'minus', 'Dépense', 'Expense'], ['#c-vendre/moi', 'home', 'Pour moi', 'For me'],
      ['#c-vendre/credit', 'users', 'Vente à crédit', 'Credit sale'], ['#c-recus', 'receipt', 'Reçu', 'Receipt']
    ].map(function (q) { return '<a class="com-quick-btn" href="' + q[0] + '">' + hexIcon(q[1], '#145B63') + '<span>' + t(q[2], q[3]) + '</span></a>'; }).join('') + '</div>';
    var shown = state.showAll ? state.entries : state.entries.slice(0, 8);
    var listHtml = state.entries.length ? '<ul class="com-entries">' + shown.map(function (e) { return entryRow(e, true); }).join('') + '</ul>' +
      (state.entries.length > 8 ? '<button type="button" class="inv-link" data-show-all aria-expanded="' + (state.showAll ? 'true' : 'false') + '">' +
        (state.showAll ? t('Voir moins', 'Show less') : th('Voir toute la journée (' + state.entries.length + ')', 'See the whole day (' + state.entries.length + ')')) + '</button>' : '')
      : '<p class="inv-empty">' + t('Rien de noté pour l\'instant. Appuyez sur « Vendre » à chaque vente.', 'Nothing recorded yet. Tap "Sell" for every sale.') + '</p>';
    var whoHelp = Object.keys(s.byWho).filter(function (k) { return k !== 'moi'; }).map(function (k) {
      var h = state.helpers.filter(function (x) { return x.id === k; })[0];
      return h ? th(esc(h.name) + ' : ' + s.byWho[k] + ' ventes', esc(h.name) + ': ' + s.byWho[k] + ' sales') : '';
    }).filter(Boolean);
    var dayCard = card(ic('list', 20, 2) + t('Aujourd\'hui', 'Today'), listHtml + (whoHelp.length ? '<p class="inv-foot-note">' + ic('users', 15, 2) + th('Vous : ' + (s.byWho.moi || 0) + ' ventes · ', 'You: ' + (s.byWho.moi || 0) + ' sales · ') + whoHelp.join(' · ') + '</p>' : ''), '', 'com-day-card');
    var closeCard = state.day.closed ?
      card(ic('lock', 20, 2) + t('Journée fermée', 'Day closed'), '<p>' + th('Comptée à ' + hmFr(state.day.closedAt) + ' : ' + amt(state.day.counted) + ' dans la caisse.', 'Counted at ' + hmEn(state.day.closedAt) + ': ' + amt(state.day.counted) + ' in the till.') +
        ' ' + diffText(state.day.counted - state.day.expected) + '</p><div class="biz-form-foot"><button type="button" class="btn btn-outline btn-sm" data-reopen-day>' + ic('undo', 16, 2) + t('Rouvrir la journée', 'Reopen the day') + '</button></div>') :
      card(ic('lock', 20, 2) + t('Fermer ma journée', 'Close my day'), '<p>' + t('Le soir, comptez la caisse : KAME vous dit s\'il manque de l\'argent, et votre régularité compte dans votre KAME Score.',
        'In the evening, count the till: KAME tells you if money is missing, and your regularity counts in your KAME Score.') + '</p><div class="biz-form-foot"><button type="button" class="btn btn-primary btn-sm" data-close-day>' +
        ic('lock', 16, 2) + t('Fermer ma journée', 'Close my day') + '</button></div>');
    return head + hero + kpis + quick + '<div class="inv-grid com-grid">' + dayCard + '<div class="biz-stack">' + todoCard + closeCard + '</div></div>' +
      '<div class="inv-grid com-grid">' + weekCard + tipOfDay() + '</div>' + disclaimer();
  }
  function diffText(d) {
    if (Math.abs(d) < 25) return chip('ok', 'ok', 'Le compte est bon', 'The count is right');
    return d < 0 ? '<span class="inv-chip ko">' + ic('alert', 14, 2.2) + th('Il manque ' + amt(-d), amt(-d) + ' missing') + '</span>'
                 : '<span class="inv-chip warn">' + ic('info', 14, 2.2) + th(amt(d) + ' en plus', amt(d) + ' extra') + '</span>';
  }

  // ------------------------------------------------------------ Vendre : vente, dépense, pour moi
  function padValue() { return state.pad.value; }
  function viewVendre(arg) {
    var pad = state.pad;
    var tab = arg === 'depense' || arg === 'moi' ? arg : 'vente';
    if (pad.tab !== tab) { pad.tab = tab; pad.value = 0; pad.picks = {}; pad.pay = 'cash'; pad.last = null; }
    var tabsHtml = U.tabs([['#c-vendre', 'vente', 'Vente', 'Sale', 'cart'], ['#c-vendre/depense', 'depense', 'Dépense', 'Expense', 'minus'], ['#c-vendre/moi', 'moi', 'Pour moi', 'For me', 'home']],
      tab, 'Que voulez-vous noter ?', 'What do you want to record?');
    var titles = { vente: ['Noter une vente', 'Record a sale'], depense: ['Noter une dépense', 'Record an expense'], moi: ['Argent pris pour moi', 'Money taken for me'] };
    var subs = {
      vente: t('Le montant, puis comment c\'est payé : c\'est tout. Le stock et le carnet de crédits se mettent à jour tout seuls.', 'The amount, then how it was paid: that is all. Stock and credit book update by themselves.'),
      depense: t('Ce que le commerce dépense : transport, ticket de marché, sachets… L\'achat de marchandise se note de préférence dans Stock.', 'What the shop spends: transport, market fee, bags… Goods for resale are best recorded in Stock.'),
      moi: t('L\'argent pris pour la maison n\'est pas une dépense du commerce : notez-le à part pour savoir ce que votre commerce gagne vraiment.', 'Money taken for home is not a shop expense: record it separately to know what your shop really earns.')
    };
    var notice = '';
    if (!state.day.open || state.day.closed) {
      notice = '<div class="com-note warn">' + ic('info', 18, 2) + '<span>' + (state.day.closed ? t('Votre journée est fermée : ce que vous notez maintenant la rouvre.', 'Your day is closed: anything you record now reopens it.')
        : t('Votre journée n\'est pas encore ouverte : elle s\'ouvrira avec cette première opération.', 'Your day is not open yet: it will open with this first entry.')) + '</span></div>';
    }
    var amountBox = '<div class="com-amount"><span class="ca-label" id="ca-label">' + t('Montant', 'Amount') + '</span><output class="ca-value" data-pad-out aria-labelledby="ca-label">' +
      num(padValue()) + '</output><span class="ca-cur">FCFA</span></div>';
    var quickAdd = '<div class="com-addrow" role="group" aria-label="' + esc(L('Ajouter un montant', 'Add an amount')) + '">' + [100, 500, 1000, 5000].map(function (v) {
      return '<button type="button" data-add="' + v + '">+' + num(v) + '</button>';
    }).join('') + '</div>';
    var keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'back'];
    var keypad = '<div class="com-pad" role="group" aria-label="' + esc(L('Clavier du montant', 'Amount keypad')) + '">' + keys.map(function (k) {
      return '<button type="button" data-key="' + k + '"' + (k === 'back' ? ' aria-label="' + esc(L('Effacer un chiffre', 'Delete a digit')) + '"' : '') + '>' + (k === 'back' ? ic('backspace', 24, 2) : k) + '</button>';
    }).join('') + '</div><button type="button" class="inv-link com-clear" data-key="clear">' + ic('close', 15, 2) + t('Tout effacer', 'Clear all') + '</button>';
    // Colonne de gauche : le montant, les produits ou catégories (une ligne qui défile sur téléphone), puis le clavier
    var chips = '';
    var right = '';
    if (tab === 'vente') {
      var picks = state.stock.slice(0, 8).map(function (p) {
        var q = pad.picks[p.id] || 0;
        return '<button type="button" class="com-pick" data-pick="' + p.id + '" aria-pressed="' + (q ? 'true' : 'false') + '">' + pname(p) + ' <small>' + num(p.sell) + '</small>' + (q ? '<b>× ' + q + '</b>' : '') + '</button>';
      }).join('');
      var anyPick = Object.keys(pad.picks).length > 0;
      chips = '<div class="com-block"><p class="com-q">' + t('Quoi ?', 'What?') + ' <small>' + t('facultatif : le prix s\'ajoute et le stock baisse', 'optional: the price is added and stock goes down') + '</small></p>' +
        '<div class="com-chips com-scroll">' + picks + '</div>' + (anyPick ? '<button type="button" class="inv-link com-clear" data-clear-picks>' + ic('close', 14, 2) + t('Enlever les produits', 'Remove products') + '</button>' : '') + '</div>';
      right += payBlock(['cash', 'airtel', 'moov', 'credit'], t('Payé comment ?', 'Paid how?'));
      if (pad.pay === 'credit') right += creditBlock();
      else right += '<div class="com-block">' + switchBtn('data-pad-receipt', pad.receipt, 'Envoyer un reçu WhatsApp au client', 'Send the customer a WhatsApp receipt') +
        (pad.receipt ? '<label class="inv-field"><span>' + t('Nom du client', 'Customer name') + '</span><input class="inv-input" data-pad-field="rclient" value="' + esc(pad.rclient) + '" maxlength="60" autocomplete="off"></label>' : '') + '</div>';
    } else if (tab === 'depense') {
      chips = '<div class="com-block"><p class="com-q">' + t('Pour quoi ?', 'What for?') + '</p><div class="com-chips com-scroll">' + Object.keys(EXP).map(function (k) {
        return '<button type="button" class="com-pick" data-cat="' + k + '" aria-pressed="' + (pad.cat === k ? 'true' : 'false') + '">' + ic(EXP[k][2], 16, 2) + t(EXP[k][0], EXP[k][1]) + '</button>';
      }).join('') + '</div></div>';
      if (pad.cat === 'marchandise') right += '<p class="com-note">' + ic('info', 16, 2) + '<span>' + th('Acheté pour revendre ? Notez-le plutôt dans <a href="#c-stock">Stock</a> : le stock et la dépense se mettent à jour ensemble.',
        'Bought to resell? Record it in <a href="#c-stock">Stock</a> instead: stock and expense update together.') + '</span></p>';
      right += payBlock(PAY_OUT, t('Payé avec', 'Paid with'));
    } else {
      chips = '<div class="com-block"><p class="com-q">' + t('Pour quoi ?', 'What for?') + '</p><div class="com-chips com-scroll">' + Object.keys(ME).map(function (k) {
        return '<button type="button" class="com-pick" data-mecat="' + k + '" aria-pressed="' + (pad.meCat === k ? 'true' : 'false') + '">' + ic(ME[k][2], 16, 2) + t(ME[k][0], ME[k][1]) + '</button>';
      }).join('') + '</div></div>';
      right += payBlock(PAY_OUT, t('Pris dans', 'Taken from'));
      var wk = weekMoney();
      var pctS = state.salary.amount ? wk.moi / state.salary.amount * 100 : 0;
      right += '<div class="com-block com-salary"><p class="com-q">' + ic('wallet', 18, 2) + t('Mon salaire', 'My salary') + '</p><p>' + th('Je me paie ' + amt(state.salary.amount) + ' par semaine.', 'I pay myself ' + amt(state.salary.amount) + ' a week.') +
        ' <button type="button" class="inv-link" data-salary>' + ic('edit', 14, 2) + t('Modifier', 'Change') + '</button></p>' + progress(pctS, pctS > 100 ? '#B5452F' : '#C98A1E') +
        '<p class="inv-meta">' + th('Cette semaine : ' + amt(wk.moi) + ' pris · bénéfice estimé ' + amt(Math.max(0, wk.profit)), 'This week: ' + amt(wk.moi) + ' taken · estimated profit ' + amt(Math.max(0, wk.profit))) + '</p>' +
        (wk.moi > Math.max(0, wk.profit) ? '<p class="com-note warn">' + ic('alert', 16, 2) + '<span>' + t('Vous prenez plus que ce que le commerce gagne : c\'est le stock qui paie. Essayez de revenir à votre salaire.',
          'You are taking more than the shop earns: your stock is paying for it. Try to get back to your salary.') + '</span></p>' : '') + '</div>';
    }
    var left = amountBox + chips + quickAdd + keypad;
    var saveLabel = { vente: ['Enregistrer la vente', 'Save the sale'], depense: ['Enregistrer la dépense', 'Save the expense'], moi: ['Enregistrer', 'Save'] }[tab];
    var save = '<div class="com-save-wrap"><button type="button" class="btn btn-primary com-save" data-pad-save>' + ic('ok', 20, 2.4) + t(saveLabel[0], saveLabel[1]) + '</button></div>';
    var s = todayStats();
    var dayLine = '<p class="com-dayline">' + ic('data', 16, 2) + th('Aujourd\'hui : ' + amt(s.sales) + ' de ventes (' + s.count + ')', 'Today: ' + amt(s.sales) + ' in sales (' + s.count + ')') +
      ' · <a href="#c-journee">' + t('Voir ma journée', 'See my day') + '</a></p>';
    // Le bouton « Enregistrer » est un enfant direct du formulaire : sur téléphone, il reste visible en bas de l'écran
    return '<div class="inv-view-head"><h1 class="inv-h1" tabindex="-1">' + t(titles[tab][0], titles[tab][1]) + '</h1><p' + (tab === 'moi' ? '' : ' class="com-desc-opt"') + '>' + subs[tab] + '</p></div>' +
      tabsHtml + notice + savedBox() + '<div class="com-sell"><div class="com-sell-left">' + left + '</div><div class="com-sell-right">' + right + '</div>' + save + '</div>' + dayLine;
  }
  function payBlock(keys, title) {
    return '<div class="com-block"><p class="com-q">' + title + '</p><div class="com-pays">' + keys.map(function (k) {
      return '<button type="button" class="com-pay" data-pay="' + k + '" aria-pressed="' + (state.pad.pay === k ? 'true' : 'false') + '" style="--pc:' + PAY[k].c + '">' + ic(PAY[k].icon, 22, 2) +
        '<span>' + t(PAY[k].fr, PAY[k].en) + '</span></button>';
    }).join('') + '</div></div>';
  }
  function creditBlock() {
    var pad = state.pad;
    var known = state.credits.slice(0, 6).map(function (c) {
      return '<button type="button" class="com-pick" data-client-pick="' + c.id + '" aria-pressed="' + (plain(pad.client) === plain(c.name) ? 'true' : 'false') + '">' + ic('user', 15, 2) + esc(c.name) + '</button>';
    }).join('');
    var existing = state.credits.filter(function (c) { return plain(c.name) === plain(pad.client) && pad.client; })[0];
    var warn = '';
    if (existing) {
      warn = '<p class="com-note' + (isLate(existing) ? ' warn' : '') + '">' + ic(isLate(existing) ? 'alert' : 'info', 16, 2) + '<span>' + (isLate(existing)
        ? th(esc(existing.name) + ' doit déjà ' + amt(leftC(existing)) + ' et est en retard de ' + daysFr(lateDays(existing.due)) + '. Prudence avant un nouveau crédit.',
             esc(existing.name) + ' already owes ' + amt(leftC(existing)) + ' and is ' + daysEn(lateDays(existing.due)) + ' late. Be careful before giving more credit.')
        : th(esc(existing.name) + ' doit déjà ' + amt(leftC(existing)) + ' : le montant s\'ajoutera à sa dette.', esc(existing.name) + ' already owes ' + amt(leftC(existing)) + ': the amount will be added to the debt.')) + '</span></p>';
    }
    return '<div class="com-block com-credit-box"><p class="com-q">' + t('Qui achète à crédit ?', 'Who is buying on credit?') + '</p>' + (known ? '<div class="com-chips">' + known + '</div>' : '') +
      '<div class="biz-row"><label class="inv-field"><span>' + t('Nom du client', 'Customer name') + '</span><input class="inv-input" data-pad-field="client" value="' + esc(pad.client) + '" maxlength="60" autocomplete="off"></label>' +
      '<label class="inv-field"><span>' + t('WhatsApp (facultatif)', 'WhatsApp (optional)') + '</span><input class="inv-input" data-pad-field="phone" type="tel" inputmode="tel" value="' + esc(pad.phone) + '" maxlength="20" autocomplete="off"></label></div>' +
      '<label class="inv-field"><span>' + t('À rembourser dans', 'To be repaid within') + '</span>' + selectEl('pad-due', DUE, pad.due, 'data-pad-field="due"') + '</label>' + warn +
      switchBtn('data-pad-confirm', pad.confirm, 'Demander au client de confirmer sa dette (lien WhatsApp)', 'Ask the customer to confirm the debt (WhatsApp link)') + '</div>';
  }
  function savedBox() {
    var e = state.pad.last && state.entries.filter(function (x) { return x.id === state.pad.last; })[0];
    if (!e) return '';
    var rcpt = e.receipt && state.lastReceipt && state.lastReceipt.no === e.receipt ? receiptCard(state.lastReceipt) : '';
    var msg = e.kind === 'vente' ? ['Vente de ' + amt(e.amount) + ' notée', 'Sale of ' + amt(e.amount) + ' recorded']
      : (e.kind === 'depense' ? ['Dépense de ' + amt(e.amount) + ' notée', 'Expense of ' + amt(e.amount) + ' recorded'] : [amt(e.amount) + ' pris pour vous', amt(e.amount) + ' taken for you']);
    return '<div class="com-saved' + (e.cancelled ? ' is-cancelled' : '') + '" role="status">' + ic(e.cancelled ? 'undo' : 'ok', 20, 2.4) + '<span>' + (e.cancelled ? t('Annulé.', 'Cancelled.') + ' ' : '') +
      th(msg[0] + ' · ' + esc(PAY[e.pay].fr) + ' · ' + hmFr(e.at), msg[1] + ' · ' + esc(PAY[e.pay].en) + ' · ' + hmEn(e.at)) + '</span>' +
      (!e.cancelled ? '<button type="button" class="inv-link" data-undo="' + e.id + '">' + ic('undo', 15, 2) + t('Annuler', 'Undo') + '</button>' : '') + '</div>' + rcpt;
  }

  // ------------------------------------------------------------ Crédits : ce qu'on me doit, ce que je dois
  function confChip(c) {
    if (c.confirmed === 'yes') return chip('ok', 'registre', 'Confirmé par le client', 'Confirmed by the customer');
    if (c.confirmed === 'sent') return chip('', 'send', 'Confirmation envoyée', 'Confirmation sent');
    return chip('warn', 'info', 'Pas encore confirmé', 'Not confirmed yet');
  }
  function debtCard(c) {
    var lft = leftC(c), late = lateDays(c.due), dl = leftDays(c.due);
    var meta = late > 0 ? '<span class="com-late">' + ic('alert', 15, 2.2) + th('En retard de ' + daysFr(late), daysEn(late) + ' late') + '</span>'
      : th('À rembourser ' + whenFr(dl) + ' (' + esc(shortFr(c.due)) + ')', 'Due ' + whenEn(dl) + ' (' + esc(shortEn(c.due)) + ')');
    var actions = '<button type="button" class="btn btn-primary btn-sm" data-cpay="' + c.id + '">' + ic('cash', 16, 2) + t('Il a payé', 'Paid') + '</button>' +
      '<button type="button" class="btn btn-outline btn-sm" data-remind="' + c.id + '">' + ic('chat', 16, 2) + t('Rappel WhatsApp', 'WhatsApp reminder') + '</button>' +
      (c.confirmed === 'no' ? '<button type="button" class="btn btn-outline btn-sm" data-confirm-debt="' + c.id + '">' + ic('registre', 16, 2) + t('Faire confirmer', 'Get it confirmed') + '</button>' : '') +
      (!c.verified && lft >= 15000 ? '<button type="button" class="btn btn-outline btn-sm" data-verify-client="' + c.id + '">' + ic('id', 16, 2) + t('Vérifier son identité', 'Verify identity') + '</button>' : '');
    return '<article class="com-debt' + (late > 0 ? ' is-late' : '') + '"><div class="cd-top">' + hexIcon('user', late > 0 ? '#B5452F' : '#145B63') + '<div class="cd-who"><h3>' + esc(c.name) + '</h3>' +
      '<p class="inv-meta cd-sub">' + (c.phone ? '<span class="cd-phone">' + esc(c.phone) + '</span>' : '') + '<span>' + t(c.what[0], c.what[1]) + '</span></p></div><div class="cd-amt"><strong>' + amt(lft) + '</strong>' +
      (c.paid ? '<span class="inv-meta">' + th('sur ' + amt(c.total), 'of ' + amt(c.total)) + '</span>' : '') + '</div></div>' + progress(c.total ? c.paid / c.total * 100 : 0, '#0E7C75') +
      '<p class="cd-meta">' + meta + ' · ' + th('depuis le ' + esc(shortFr(c.since)), 'since ' + esc(shortEn(c.since))) + '</p><p class="cd-chips">' + confChip(c) +
      (c.verified === true ? chip('ok', 'id', 'Identité vérifiée', 'Identity verified') : (c.verified === 'sent' ? chip('', 'id', 'Vérification en cours', 'Verification in progress') : '')) +
      (lft > 30000 ? chip('warn', 'alert', 'Au-dessus du plafond conseillé', 'Above the advised limit') : '') + '</p><div class="req-actions">' + actions + '</div></article>';
  }
  function supplierCard(f) {
    var lft = leftC(f), dl = leftDays(f.due);
    var meta = dl < 0 ? '<span class="com-late">' + ic('alert', 15, 2.2) + th('En retard de ' + daysFr(-dl), daysEn(-dl) + ' late') + '</span>'
      : th('À payer ' + whenFr(dl) + ' (' + esc(shortFr(f.due)) + ')', 'Due ' + whenEn(dl) + ' (' + esc(shortEn(f.due)) + ')');
    var last = f.last ? '<p class="cd-chips">' + (f.last.confirmed === true ? chip('ok', 'registre', 'Paiement confirmé par le fournisseur', 'Payment confirmed by the supplier')
      : (f.last.confirmed === 'sent' ? chip('', 'send', 'Confirmation demandée', 'Confirmation requested') : chip('warn', 'info', 'Paiement pas encore confirmé', 'Payment not confirmed yet'))) + '</p>' : '';
    return '<article class="com-debt' + (dl < 0 && lft ? ' is-late' : '') + '"><div class="cd-top">' + hexIcon('truck', '#7A5236') + '<div class="cd-who"><h3>' + esc(f.name) + '</h3><p class="inv-meta">' +
      t(f.what[0], f.what[1]) + '</p></div><div class="cd-amt"><strong>' + amt(lft) + '</strong>' + (f.paid ? '<span class="inv-meta">' + th('sur ' + amt(f.total), 'of ' + amt(f.total)) + '</span>' : '') + '</div></div>' +
      progress(f.total ? f.paid / f.total * 100 : 0, '#7A5236') + '<p class="cd-meta">' + (lft ? meta : chip('ok', 'ok', 'Tout est payé', 'Fully paid')) + '</p>' + last + '<div class="req-actions">' +
      (lft ? '<button type="button" class="btn btn-primary btn-sm" data-fpay="' + f.id + '">' + ic('cash', 16, 2) + t('J\'ai payé', 'I paid') + '</button>' : '') +
      (f.last && f.last.confirmed === false ? '<button type="button" class="btn btn-outline btn-sm" data-fconfirm="' + f.id + '">' + ic('registre', 16, 2) + t('Demander une confirmation', 'Ask for confirmation') + '</button>' : '') +
      '</div></article>';
  }
  function viewCredits(arg) {
    var tab = arg === 'fournisseurs' ? 'fournisseurs' : 'clients';
    var tabsHtml = U.tabs([['#c-credits', 'clients', 'On me doit', 'Owed to me', 'users'], ['#c-credits/fournisseurs', 'fournisseurs', 'Je dois', 'I owe', 'truck']],
      tab, 'Carnet de crédits', 'Credit book');
    var head = heading('Carnet de crédits', 'Credit book', t('Ce que vos clients vous doivent, et ce que vous devez à vos fournisseurs. Une dette confirmée par lien est certifiée par KAME Registre : fini les « je ne te dois pas ça ».',
      'What your customers owe you, and what you owe your suppliers. A debt confirmed by link is certified by KAME Registre: no more "I don\'t owe you that".'));
    if (tab === 'fournisseurs') return head + tabsHtml + viewSuppliers();
    var late = lateCredits();
    var lateAmt = late.reduce(function (s, c) { return s + leftC(c); }, 0);
    var rate = Math.round(state.credHist.onTime / Math.max(1, state.credHist.onTime + state.credHist.late) * 100);
    var kpis = '<div class="inv-kpis com-kpis">' +
      kpiBox('users', '#145B63', t('À récupérer', 'To collect'), amt(toCollect()), th(state.credits.length + ' clients', state.credits.length + ' customers')) +
      kpiBox('alert', '#B5452F', t('En retard', 'Late'), amt(lateAmt), th(late.length + (late.length > 1 ? ' clients' : ' client'), late.length + (late.length > 1 ? ' customers' : ' customer'))) +
      kpiBox('cash', '#0E7C75', t('Récupéré ce mois', 'Collected this month'), amt(state.recovered), '') +
      kpiBox('ok', '#C98A1E', t('Remboursés à temps', 'Repaid on time'), rate + ' %', th('sur les ' + (state.credHist.onTime + state.credHist.late) + ' derniers crédits', 'of the last ' + (state.credHist.onTime + state.credHist.late) + ' credits')) + '</div>';
    var sorted = state.credits.slice().sort(function (a, b) { return (isLate(b) - isLate(a)) || (a.due.ts - b.due.ts); });
    var list = sorted.length ? '<div class="com-debts">' + sorted.map(debtCard).join('') + '</div>' : '<p class="inv-empty">' + t('Personne ne vous doit d\'argent. Bravo !', 'Nobody owes you money. Well done!') + '</p>';
    var form = '<form class="biz-form" data-form="credit-new" novalidate><div class="biz-row">' + field('Nom du client', 'Customer name', input('name', 'required maxlength="60" autocomplete="off"')) +
      field('WhatsApp (facultatif)', 'WhatsApp (optional)', input('phone', 'type="tel" inputmode="tel" maxlength="20" autocomplete="off"')) + '</div><div class="biz-row">' +
      field('Montant (FCFA)', 'Amount (FCFA)', input('amount', 'type="number" min="25" max="10000000" step="25" inputmode="numeric" required')) +
      field('Ce qu\'il a pris (facultatif)', 'What was taken (optional)', input('what', 'maxlength="80" autocomplete="off"')) + '</div>' +
      field('À rembourser dans', 'To be repaid within', selectEl('due', DUE, '7')) +
      '<label class="inv-choice"><input type="checkbox" name="confirm" value="1" checked><span>' + t('Envoyer au client un lien pour confirmer sa dette', 'Send the customer a link to confirm the debt') + '</span></label>' +
      '<div class="biz-form-foot"><button type="submit" class="btn btn-primary btn-sm">' + ic('plus', 16, 2.2) + t('Ajouter le crédit', 'Add the credit') + '</button></div></form>' +
      '<p class="inv-foot-note">' + t('Une vente à crédit se note aussi directement depuis « Vendre ».', 'A credit sale can also be recorded straight from "Sell".') + '</p>';
    var settled = '<ul class="inv-docs com-settled">' + state.settled.slice(0, 5).map(function (x) {
      return '<li>' + hexIcon(x.onTime ? 'ok' : 'clock', x.onTime ? '#0E7C75' : '#B8734F') + '<span><strong>' + esc(x.name) + ' · ' + amt(x.total) + '</strong><span class="inv-meta">' +
        (x.onTime ? t('Remboursé à temps', 'Repaid on time') : t('Remboursé en retard', 'Repaid late')) + ' · ' + dateText(x.when) + '</span></span></li>';
    }).join('') + '</ul>';
    var tip = '<article class="com-tip">' + hexIcon('bulb', '#C98A1E') + '<div><p class="com-tip-title">' + t('Faire crédit sans se faire avoir', 'Giving credit safely') + '</p><ul class="biz-bullets">' +
      '<li>' + t('Faites confirmer chaque dette par lien : c\'est une preuve, et votre KAME Score monte.', 'Get every debt confirmed by link: it is proof, and your KAME Score goes up.') + '</li>' +
      '<li>' + t('Plafond conseillé : 30 000 FCFA par client, tant qu\'il n\'a pas remboursé une première fois.', 'Advised limit: 30,000 FCFA per customer until they have repaid once.') + '</li>' +
      '<li>' + t('Pour un gros crédit, vérifiez d\'abord son identité avec KAME ID (avec son accord).', 'For a large credit, first verify their identity with KAME ID (with their consent).') + '</li></ul></div></article>';
    return head + tabsHtml + kpis + '<div class="inv-grid com-grid-wide"><div class="biz-stack">' + card(ic('users', 20, 2) + t('Mes clients à crédit', 'My credit customers'), list, '', 'com-list-card') + '</div>' +
      '<div class="biz-stack">' + card(ic('plus', 20, 2) + t('Nouveau crédit', 'New credit'), form) + card(ic('ok', 20, 2) + t('Réglés récemment', 'Recently settled'), settled) + tip + '</div></div>' + disclaimer();
  }
  function viewSuppliers() {
    var next = state.suppliers.filter(function (f) { return leftC(f) > 0; }).sort(function (a, b) { return a.due.ts - b.due.ts; })[0];
    var rate = Math.round(state.supHist.onTime / Math.max(1, state.supHist.onTime + state.supHist.late) * 100);
    var kpis = '<div class="inv-kpis three com-kpis">' +
      kpiBox('truck', '#7A5236', t('Je dois', 'I owe'), amt(owed()), th(state.suppliers.filter(function (f) { return leftC(f) > 0; }).length + ' fournisseurs', state.suppliers.filter(function (f) { return leftC(f) > 0; }).length + ' suppliers')) +
      kpiBox('calendar', '#C98A1E', t('Prochain paiement', 'Next payment'), next ? amt(leftC(next)) : '—', next ? th(esc(next.name) + ', ' + whenFr(leftDays(next.due)), esc(next.name) + ', ' + whenEn(leftDays(next.due))) : '') +
      kpiBox('ok', '#0E7C75', t('Payés à temps', 'Paid on time'), rate + ' %', th('sur les ' + (state.supHist.onTime + state.supHist.late) + ' derniers paiements', 'of the last ' + (state.supHist.onTime + state.supHist.late) + ' payments')) + '</div>';
    var list = '<div class="com-debts">' + state.suppliers.map(supplierCard).join('') + '</div>';
    var form = '<form class="biz-form" data-form="supplier-new" novalidate>' + field('Fournisseur', 'Supplier', input('name', 'required maxlength="60" autocomplete="off"')) +
      '<div class="biz-row">' + field('Montant (FCFA)', 'Amount (FCFA)', input('amount', 'type="number" min="25" max="50000000" step="25" inputmode="numeric" required')) +
      field('À payer dans', 'To be paid within', selectEl('due', DUE, '7')) + '</div>' + field('Pour quoi ? (facultatif)', 'What for? (optional)', input('what', 'maxlength="80" autocomplete="off"')) +
      '<div class="biz-form-foot"><button type="submit" class="btn btn-primary btn-sm">' + ic('plus', 16, 2.2) + t('Ajouter', 'Add') + '</button></div></form>';
    var paid = '<ul class="inv-docs com-settled">' + state.supPaid.slice(0, 6).map(function (x) {
      return '<li>' + hexIcon(x.onTime ? 'ok' : 'clock', x.onTime ? '#0E7C75' : '#B8734F') + '<span><strong>' + esc(x.name) + ' · ' + amt(x.amount) + '</strong><span class="inv-meta">' +
        (x.onTime ? t('Payé à temps', 'Paid on time') : t('Payé en retard', 'Paid late')) + ' · ' + dateText(x.when) + (x.confirmed ? ' · ' + t('confirmé', 'confirmed') : '') + '</span></span></li>';
    }).join('') + '</ul>';
    var why = '<article class="com-tip">' + hexIcon('score', '#145B63') + '<div><p class="com-tip-title">' + t('Pourquoi c\'est utile', 'Why it helps') + '</p><p>' +
      t('Un fournisseur qui confirme vos paiements prouve que vous êtes sérieux : votre KAME Score monte, et il vous fera plus facilement crédit sur la marchandise.',
        'A supplier who confirms your payments proves you are reliable: your KAME Score goes up, and they will more easily give you goods on credit.') + '</p></div></article>';
    return kpis + '<div class="inv-grid com-grid-wide"><div class="biz-stack">' + card(ic('truck', 20, 2) + t('Mes fournisseurs', 'My suppliers'), list, '', 'com-list-card') + '</div>' +
      '<div class="biz-stack">' + card(ic('plus', 20, 2) + t('Nouvelle dette fournisseur', 'New supplier debt'), form) + card(ic('ok', 20, 2) + t('Payés récemment', 'Recently paid'), paid) + why + '</div></div>' + disclaimer();
  }

  // ------------------------------------------------------------ Stock : acheté en gros, revendu au détail
  function prodCard(p) {
    var pct = clamp(p.left / Math.max(p.per, p.min * 2, p.left) * 100, 2, 100);
    var low = isLow(p);
    return '<article class="com-prod' + (low ? ' is-low' : '') + '"><div class="cp-top">' + hexIcon('box', low ? '#B5452F' : '#145B63') + '<div><h3>' + pname(p) + '</h3><p class="inv-meta">' +
      th('Acheté : ' + esc(p.lot[0]) + ' à ' + amt(p.buy) + ' · Vendu : ' + amt(p.sell) + ' ' + esc(perUnitFr(p.unit[0])),
         'Bought: ' + esc(p.lot[1]) + ' at ' + amt(p.buy) + ' · Sold: ' + amt(p.sell) + ' per ' + esc(p.unit[1])) + '</p></div></div>' +
      '<p class="cp-profit">' + th('Bénéfice : <strong>' + amt(lotProfit(p)) + '</strong> par ' + esc(p.lotN[0]) + ' (' + Math.round(lotMargin(p) * 100) + ' %)',
        'Profit: <strong>' + amt(lotProfit(p)) + '</strong> per ' + esc(p.lotN[1]) + ' (' + Math.round(lotMargin(p) * 100) + '%)') + '</p>' +
      progress(pct, low ? '#B5452F' : '#159E96') + '<p class="cp-left">' + th('Il reste ' + unitsHtml(p, p.left), unitsHtml(p, p.left) + ' left') + (low ? ' ' + chip('ko', 'alert', 'À racheter', 'Restock') : '') + '</p>' +
      '<div class="req-actions"><button type="button" class="btn btn-primary btn-sm" data-restock="' + p.id + '">' + ic('plus', 16, 2.2) + t('J\'ai racheté', 'I restocked') + '</button>' +
      '<button type="button" class="btn btn-outline btn-sm" data-recount="' + p.id + '">' + ic('edit', 16, 2) + t('Corriger', 'Correct') + '</button></div></article>';
  }
  function viewStock() {
    var value = state.stock.reduce(function (s, p) { return s + p.left * p.buy / p.per; }, 0);
    var low = state.stock.filter(isLow);
    var kpis = '<div class="inv-kpis three com-kpis">' +
      kpiBox('box', '#145B63', t('Valeur du stock', 'Stock value'), amt(Math.round(value / 50) * 50), t('au prix d\'achat', 'at purchase price')) +
      kpiBox('trend', '#0E7C75', t('Bénéfice moyen', 'Average margin'), Math.round(avgMargin() * 100) + ' %', t('sur ce que vous vendez', 'on what you sell')) +
      kpiBox('alert', '#B5452F', t('À racheter', 'To restock'), String(low.length), low.length ? th(low.map(function (p) { return esc(p.fr); }).join(', '), low.map(function (p) { return esc(p.en); }).join(', ')) : t('Rien d\'urgent', 'Nothing urgent')) + '</div>';
    var c = state.calc || { lot: 'carton', per: '', buy: '', unit: 'unite', sell: '' };
    var form = '<form class="biz-form" data-form="product-new" novalidate>' + field('Nom du produit', 'Product name', input('name', 'required maxlength="40" autocomplete="off" value="' + esc(c.name || '') + '"')) +
      '<p class="com-q">' + t('Je l\'achète en gros…', 'I buy it in bulk…') + '</p><div class="biz-row">' +
      field('Par', 'By the', selectEl('lot', Object.keys(LOTS).map(function (k) { return [k, LOTS[k][0], LOTS[k][1]]; }), c.lot, 'data-calc')) +
      field('Combien dedans ?', 'How many inside?', input('per', 'type="number" min="1" max="10000" step="1" inputmode="numeric" required data-calc value="' + esc(c.per) + '"'), 'Ex. : 24 savons, 25 kilos', 'E.g. 24 bars, 25 kilos') +
      field('Prix d\'achat (FCFA)', 'Purchase price (FCFA)', input('buy', 'type="number" min="25" max="50000000" step="25" inputmode="numeric" required data-calc value="' + esc(c.buy) + '"')) + '</div>' +
      '<p class="com-q">' + t('…et je le revends au détail', '…and I resell it retail') + '</p><div class="biz-row">' +
      field('À la / au', 'By the', selectEl('unit', Object.keys(UNITS).map(function (k) { return [k, UNITS[k][0], UNITS[k][1]]; }), c.unit, 'data-calc')) +
      field('Prix de vente (FCFA)', 'Selling price (FCFA)', input('sell', 'type="number" min="5" max="1000000" step="5" inputmode="numeric" required data-calc value="' + esc(c.sell) + '"')) + '</div>' +
      '<output class="com-calc" data-calc-out>' + calcText(c) + '</output>' +
      '<div class="biz-form-foot"><button type="submit" class="btn btn-primary btn-sm">' + ic('plus', 16, 2.2) + t('Ajouter au stock', 'Add to stock') + '</button></div></form>';
    var shop = low.length ? '<ul class="inv-docs">' + low.map(function (p) {
      var lots = Math.max(1, Math.ceil((p.min * 2 - p.left) / p.per));
      return '<li>' + hexIcon('cart', '#B8734F') + '<span><strong>' + th(lots + ' × ' + esc(p.lot[0]) + ' · ' + esc(p.fr), lots + ' × ' + esc(p.lot[1]) + ' · ' + esc(p.en)) + '</strong><span class="inv-meta">' +
        th('environ ' + amt(lots * p.buy), 'about ' + amt(lots * p.buy)) + '</span></span></li>';
    }).join('') + '</ul><div class="req-actions"><button type="button" class="btn btn-outline btn-sm" data-copy-list>' + ic('copy', 16, 2) + t('Copier la liste', 'Copy the list') + '</button>' +
      '<button type="button" class="btn btn-outline btn-sm" data-send-list>' + ic('chat', 16, 2) + t('Envoyer au grossiste', 'Send to the wholesaler') + '</button></div>'
      : '<p class="biz-all-done">' + ic('ok', 20, 2.4) + t('Rien à racheter pour l\'instant.', 'Nothing to restock for now.') + '</p>';
    return heading('Mon stock', 'My stock', t('Vous achetez en gros (sac, carton, bidon…) et revendez au détail (au kilo, à l\'unité, au tas…) : KAME calcule le bénéfice par carton et vous prévient avant la rupture.',
      'You buy in bulk (bag, box, can…) and resell retail (by the kilo, unit, pile…): KAME works out the profit per box and warns you before you run out.')) + kpis +
      '<div class="com-prods">' + state.stock.map(prodCard).join('') + '</div>' +
      '<div class="inv-grid g-two">' + card(ic('plus', 20, 2) + t('Ajouter un produit', 'Add a product'), form) + '<div class="biz-stack">' +
      card(ic('cart', 20, 2) + t('Liste pour le grossiste', 'List for the wholesaler'), shop) + tipCardStock() + '</div></div>' + disclaimer();
  }
  function tipCardStock() {
    return '<article class="com-tip">' + hexIcon('bulb', '#C98A1E') + '<div><p class="com-tip-title">' + t('Le bon prix de détail', 'The right retail price') + '</p><p>' +
      t('Divisez le prix du carton par le nombre d\'unités dedans : c\'est votre coût par unité. Votre prix de vente doit le dépasser assez pour payer le transport et vous payer vous.',
        'Divide the box price by the number of units inside: that is your cost per unit. Your selling price must beat it enough to cover transport and pay yourself.') + '</p></div></article>';
  }
  function calcText(c) {
    var per = parseInt(c.per, 10), buy = parseInt(c.buy, 10), sell = parseInt(c.sell, 10);
    if (!(per > 0 && buy > 0 && sell > 0)) return t('Remplissez les chiffres : le bénéfice s\'affiche ici.', 'Fill in the figures: the profit shows here.');
    var unitCost = buy / per, rev = per * sell, pr = rev - buy, m = rev ? pr / rev * 100 : 0;
    var lot = LOTS[c.lot] || LOTS.carton;
    if (pr <= 0) return '<span class="com-calc-bad">' + ic('alert', 16, 2.2) + th('Attention : à ce prix, vous perdez ' + amt(-pr) + ' par ' + esc(lot[0]) + '. Coût par unité : ' + money(Math.round(unitCost)) + '.',
      'Careful: at this price you lose ' + amt(-pr) + ' per ' + esc(lot[1]) + '. Cost per unit: ' + money(Math.round(unitCost)) + '.') + '</span>';
    return '<span class="com-calc-ok">' + ic('ok', 16, 2.4) + th('Coût par unité : ' + money(Math.round(unitCost)) + ' · bénéfice : <strong>' + amt(pr) + '</strong> par ' + esc(lot[0]) + ' (' + Math.round(m) + ' %)',
      'Cost per unit: ' + money(Math.round(unitCost)) + ' · profit: <strong>' + amt(pr) + '</strong> per ' + esc(lot[1]) + ' (' + Math.round(m) + '%)') + '</span>';
  }

  // ------------------------------------------------------------ Reçus (KAME Registre)
  function receiptCard(r) {
    var p = PAY[r.pay] || PAY.cash;
    return '<div class="biz-receipt"><div class="br-head">' + ic('receipt', 20, 2) + '<strong>' + t('Reçu certifié', 'Certified receipt') + '</strong><span>' + esc(r.no) + '</span></div><dl>' +
      '<div><dt>' + t('Client', 'Customer') + '</dt><dd>' + esc(r.client) + '</dd></div><div><dt>' + t('Objet', 'Description') + '</dt><dd>' + esc(r.object) + '</dd></div>' +
      '<div><dt>' + t('Montant', 'Amount') + '</dt><dd>' + amt(r.amount) + '</dd></div><div><dt>' + t('Paiement', 'Payment') + '</dt><dd>' + t(p.fr, p.en) + '</dd></div></dl>' +
      '<p class="br-code">' + t('Code de vérification :', 'Verification code:') + ' <code>' + esc(r.code.slice(0, 4) + '-' + r.code.slice(4)) + '</code></p>' +
      '<div class="biz-form-foot"><button type="button" class="btn btn-primary btn-sm" data-wa-receipt="' + esc(r.no) + '">' + ic('chat', 16, 2) + t('Envoyer sur WhatsApp', 'Send on WhatsApp') + '</button>' +
      (r.text ? '<button type="button" class="btn btn-outline btn-sm" data-download="' + esc(r.no) + '">' + ic('download', 16, 2) + t('Télécharger', 'Download') + '</button>' : '') + '</div></div>';
  }
  function viewRecus() {
    var form = '<form class="biz-form" data-form="receipt" novalidate><div class="biz-row">' + field('Client', 'Customer', input('client', 'required maxlength="60" autocomplete="off"')) +
      field('Montant (FCFA)', 'Amount (FCFA)', input('amount', 'type="number" min="25" max="50000000" step="25" inputmode="numeric" required')) + '</div>' +
      field('Objet', 'Description', input('object', 'required maxlength="80" autocomplete="off"'), 'Ex. : 2 sacs de riz, commande pour une fête', 'E.g. 2 bags of rice, party order') +
      field('Paiement', 'Payment', selectEl('pay', PAY_OUT.map(function (k) { return [k, PAY[k].fr, PAY[k].en]; }), 'cash')) +
      '<div class="biz-form-foot"><button type="submit" class="btn btn-primary btn-sm">' + ic('receipt', 16, 2) + t('Émettre le reçu', 'Issue the receipt') + '</button></div></form>';
    var last = state.lastReceipt ? receiptCard(state.lastReceipt) : '';
    var list = '<ul class="inv-docs com-receipts">' + state.receipts.slice(0, 8).map(function (r) {
      return '<li>' + hexIcon('receipt', '#145B63') + '<span><strong>' + esc(r.no) + ' · ' + amt(r.amount) + '</strong><span class="inv-meta">' + esc(r.client) + ' · ' + esc(r.object) + ' · ' + dateText(r.date) +
        (r.verified ? ' · ' + t('vérifié par le client', 'verified by the customer') : '') + '</span></span><code>' + esc(r.code.slice(0, 4) + '-' + r.code.slice(4)) + '</code></li>';
    }).join('') + '</ul>';
    var vr = state.verifyResult;
    var verify = '<form class="biz-form biz-search-form" data-form="code" novalidate><input class="inv-input inv-search" name="code" required maxlength="12" autocomplete="off" placeholder="' + esc(L('Code du reçu, ex. : 1A2B-3C4D', 'Receipt code, e.g. 1A2B-3C4D')) + '" aria-label="' +
      esc(L('Code du reçu', 'Receipt code')) + '"><button type="submit" class="btn btn-outline btn-sm">' + ic('search', 16, 2) + t('Vérifier', 'Check') + '</button></form>' +
      (vr ? (vr.ok ? '<p class="biz-all-done">' + ic('ok', 20, 2.4) + '<span>' + t('Reçu authentique : ', 'Authentic receipt: ') + vr.label + '</span></p>'
                   : '<p class="req-refused">' + ic('alert', 18, 2) + '<span>' + t('Aucun reçu avec ce code. Vérifiez les 8 caractères.', 'No receipt with this code. Check the 8 characters.') + '</span></p>') : '');
    var when = '<article class="com-tip">' + hexIcon('bulb', '#C98A1E') + '<div><p class="com-tip-title">' + t('Quand faire un reçu ?', 'When to issue a receipt?') + '</p><p>' +
      t('Pas pour chaque bâton de manioc ! Gardez les reçus pour les ventes qui comptent : gros achats, ventes à crédit, clients qui le demandent, commandes d\'entreprises. Chaque reçu vérifié par un client renforce votre KAME Score.',
        'Not for every cassava stick! Keep receipts for the sales that matter: big purchases, credit sales, customers who ask, business orders. Every receipt a customer verifies strengthens your KAME Score.') + '</p></div></article>';
    return heading('Reçus', 'Receipts', t('Des reçus certifiés par KAME Registre, envoyés sur WhatsApp. Votre client peut vérifier qu\'un reçu est vrai avec son code.',
      'Receipts certified by KAME Registre, sent on WhatsApp. Your customer can check a receipt is genuine with its code.')) +
      '<div class="inv-grid g-two"><div class="biz-stack">' + card(ic('plus', 20, 2) + t('Nouveau reçu', 'New receipt'), form + last) + when + '</div><div class="biz-stack">' +
      card(ic('receipt', 20, 2) + t('Mes derniers reçus', 'My latest receipts'), list) + card(ic('search', 20, 2) + t('Vérifier un reçu', 'Check a receipt'), verify) + '</div></div>' + disclaimer();
  }
  function issueReceipt(d) {
    var no = 'REC-' + NOW.getFullYear() + '-' + ('000' + (state.receiptSeq++)).slice(-4);
    var date = daysAgo(0);
    var en = U.isEn();
    var p = PAY[d.pay] || PAY.cash;
    var core = (en ? ['KAME REGISTRE - CERTIFIED RECEIPT', 'Number: ' + no, 'Date: ' + date.en, 'Issued by: ' + M.nameEn + ' (' + M.city + ')', 'Customer: ' + d.client, 'Description: ' + d.object,
                      'Amount: ' + fcfa(d.amount, true), 'Payment: ' + p.en]
                   : ['KAME REGISTRE - REÇU CERTIFIÉ', 'Numéro : ' + no, 'Date : ' + date.fr, 'Émis par : ' + M.nameFr + ' (' + M.city + ')', 'Client : ' + d.client, 'Objet : ' + d.object,
                      'Montant : ' + fcfa(d.amount), 'Paiement : ' + p.fr]).join('\n');
    return U.sha256(core).then(function (h1) {
      var code = h1.slice(0, 8).toUpperCase();
      var text = core + '\n' + (en ? 'Verification code: ' : 'Code de vérification : ') + code.slice(0, 4) + '-' + code.slice(4) + '\n' +
        (en ? 'Check this receipt on kamegroupe.com (KAME Registre) with this code.\nDemo version: this receipt is fictitious.\n'
            : 'Vérifiez ce reçu sur kamegroupe.com (KAME Registre) avec ce code.\nVersion de démonstration : ce reçu est fictif.\n');
      return U.sha256(text).then(function (h2) {
        var r = { no: no, client: d.client, object: d.object, amount: d.amount, pay: d.pay, date: date, code: code, hash: h2, text: text };
        state.receipts.unshift(r);
        state.lastReceipt = r;
        return r;
      });
    });
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

  // ------------------------------------------------------------ Mon KAME Score
  function viewScore() {
    var sp = scoreParts();
    var score = sp.score;
    var prev = state.scoreHist[state.scoreHist.length - 1];
    var hist = state.scoreHist.concat([score]);
    var toA = Math.max(0, 80 - score);
    var gaugeCard = card(ic('score', 20, 2) + t('Mon KAME Score', 'My KAME Score'), gauge(score) + '<p class="com-score-line">' + trendTag(score - prev) + ' ' + t('depuis le mois dernier', 'since last month') + '</p>' +
      (toA ? '<p class="inv-meta">' + th('Plus que <strong>' + toA + ' point' + (toA > 1 ? 's' : '') + '</strong> pour le niveau A.', 'Only <strong>' + toA + ' point' + (toA > 1 ? 's' : '') + '</strong> to reach level A.') + '</p>' : '') +
      '<div class="com-spark">' + spark(hist, '#159E96') + '</div><p class="inv-foot-note">' + t('Votre score sur les 12 derniers mois.', 'Your score over the last 12 months.') + '</p>');
    var parts = card(ic('pie', 20, 2) + t('Ce qui compte', 'What counts'), bars(sp.list.map(function (x) {
      return { label: t(x.fr, x.en), pct: x.pct, value: (Math.round(x.pts * 10) / 10).toString().replace('.', U.isEn() ? '.' : ',') + ' / ' + x.w, color: x.pct >= 75 ? '#0E7C75' : (x.pct >= 55 ? '#E0A030' : '#B5452F') };
    })) + '<p class="inv-foot-note">' + th('Ventes notées ' + sp.recDays + ' jours sur 30 · ' + sp.years + ' ans d\'activité.', 'Sales recorded ' + sp.recDays + ' days out of 30 · ' + sp.years + ' years in business.') + '</p>');
    var tips = [];
    var unconf = state.credits.filter(function (c) { return c.confirmed === 'no'; }).length;
    if (unconf) tips.push(['#c-credits', 'registre', th('Faites confirmer vos ' + unconf + ' crédit' + (unconf > 1 ? 's' : ''), 'Get your ' + unconf + ' credit' + (unconf > 1 ? 's' : '') + ' confirmed'),
      t('Une dette confirmée par lien compte comme un chiffre vérifié.', 'A debt confirmed by link counts as a verified figure.')]);
    var lc = lateCredits().length;
    if (lc) tips.push(['#c-credits', 'users', th('Récupérez ' + lc + ' crédit' + (lc > 1 ? 's' : '') + ' en retard', 'Collect ' + lc + ' late credit' + (lc > 1 ? 's' : '')), t('Un petit rappel poli par WhatsApp suffit souvent.', 'A short, polite WhatsApp reminder is often enough.')]);
    var todo = state.papers.filter(function (x) { return x.status === 'todo'; });
    if (todo.length) tips.push(['#c-papiers', 'check', t('Complétez vos papiers', 'Complete your papers'), th(esc(todo[0].fr), esc(todo[0].en))]);
    if (!state.tontine.paid) tips.push(['#c-epargne', 'coins', t('Cotisez à temps à votre tontine', 'Pay your tontine on time'), t('La régularité de votre épargne compte aussi.', 'Regular savings count too.')]);
    tips.push(['#c-vendre', 'cart', t('Notez vos ventes chaque jour', 'Record your sales every day'), t('Même les petits jours : c\'est la régularité qui compte.', 'Even on slow days: regularity is what counts.')]);
    var tipsCard = card(ic('trend', 20, 2) + t('Pour gagner des points', 'To earn points'), '<ul class="biz-tips">' + tips.map(function (x) {
      return '<li><a href="' + x[0] + '">' + hexIcon(x[1], '#145B63') + '<span><strong>' + x[2] + '</strong><span class="inv-meta">' + x[3] + '</span></span>' + ic('right', 16, 2) + '</a></li>';
    }).join('') + '</ul>');
    var shared = card(ic('shield', 20, 2) + t('Ce qu\'un financeur voit (avec votre accord)', 'What a lender sees (with your consent)'),
      '<ul class="biz-checklist com-two-lists"><li class="ok">' + ic('ok', 18, 2.4) + t('Votre score et son niveau', 'Your score and level') + '</li><li class="ok">' + ic('ok', 18, 2.4) + t('Votre régularité et vos ventes par mois (en fourchette)', 'Your regularity and monthly sales (as a range)') + '</li>' +
      '<li class="ok">' + ic('ok', 18, 2.4) + t('Votre identité vérifiée', 'Your verified identity') + '</li><li class="todo">' + ic('lock', 18, 2) + t('Jamais : les noms de vos clients', 'Never: your customers\' names') + '</li>' +
      '<li class="todo">' + ic('lock', 18, 2) + t('Jamais : le détail de chaque vente', 'Never: the details of each sale') + '</li><li class="todo">' + ic('lock', 18, 2) + t('Jamais : l\'argent pris pour la maison', 'Never: money taken for home') + '</li></ul>' +
      '<p class="inv-foot-note">' + t('Même calcul pour tous les commerçants. Les chiffres confirmés par d\'autres (clients, fournisseurs) comptent plus que ceux tapés seul.',
        'Same calculation for every merchant. Figures confirmed by others (customers, suppliers) count more than figures typed alone.') + '</p>', '<a class="inv-more" href="#c-financement">' + t('Mon dossier', 'My file') + ' ' + ic('right', 16, 2) + '</a>');
    return heading('Mon KAME Score', 'My KAME Score', t('Votre note de fiabilité sur 100, calculée à partir de ce que vous notez chaque jour. Elle aide à obtenir un crédit, sans montrer vos secrets.',
      'Your reliability score out of 100, calculated from what you record every day. It helps you get credit, without revealing your secrets.')) +
      '<div class="inv-grid g-two">' + gaugeCard + parts + tipsCard + shared + '</div>' + disclaimer();
  }

  // ------------------------------------------------------------ Financement (avec des partenaires agréés ; KAME ne prête pas)
  var OFFERS = [
    { id: 'o1', fr: 'Microcrédit pour le stock', en: 'Stock microloan', minA: 100000, maxA: 1000000, months: '3 – 12', every: ['Chaque mois', 'Monthly'] },
    { id: 'o2', fr: 'Avance pour les fêtes', en: 'Holiday advance', minA: 50000, maxA: 300000, months: '1 – 3', every: ['Chaque semaine ou chaque mois', 'Weekly or monthly'] },
    { id: 'o3', fr: 'Crédit de groupe (commerçants d\'un même marché)', en: 'Group loan (traders from the same market)', soon: true }
  ];
  function dossierItems() {
    var sp = scoreParts();
    var patente = state.papers.filter(function (x) { return x.id === 'patente'; })[0];
    return [
      [true, 'Identité vérifiée (KAME ID)', 'Verified identity (KAME ID)'],
      [sp.recDays >= 20, 'Ventes notées régulièrement (' + sp.recDays + ' jours sur 30)', 'Sales recorded regularly (' + sp.recDays + ' days out of 30)'],
      [sp.score >= 60, 'KAME Score de ' + sp.score + '/100', 'KAME Score of ' + sp.score + '/100'],
      [patente.status === 'ok' || patente.status === 'expiring', 'Patente à jour', 'Business licence up to date'],
      [state.conf.yes / Math.max(1, state.conf.total) >= 0.5, 'Chiffres confirmés par d\'autres (la moitié au moins)', 'Figures confirmed by others (at least half)']
    ];
  }
  function viewFinancement() {
    var items = dossierItems();
    var ok = items.filter(function (x) { return x[0]; }).length;
    var pctD = Math.round(ok / items.length * 100);
    var d = state.dossier;
    var dossier = card(ic('file', 20, 2) + t('Mon dossier de financement', 'My funding file'), '<div class="biz-progress"><p>' + th('Dossier prêt à <strong>' + pctD + ' %</strong>', 'File <strong>' + pctD + '%</strong> ready') + '</p>' + progress(pctD, '#0E7C75') + '</div>' +
      '<ul class="biz-checklist">' + items.map(function (x) { return '<li class="' + (x[0] ? 'ok' : 'todo') + '">' + ic(x[0] ? 'ok' : 'clock', 18, 2.4) + t(x[1], x[2]) + '</li>'; }).join('') + '</ul>' +
      '<div class="req-actions"><button type="button" class="btn btn-outline btn-sm" data-preview-dossier>' + ic('eye', 16, 2) + t('Voir mon dossier', 'See my file') + '</button>' +
      (d.status ? '' : '<button type="button" class="btn btn-primary btn-sm" data-send-dossier="o1">' + ic('send', 16, 2) + t('Envoyer à un partenaire', 'Send to a partner') + '</button>') + '</div>');
    var offers = card(ic('target', 20, 2) + t('Offres de nos partenaires (exemples)', 'Our partners\' offers (examples)'), '<div class="com-offers">' + OFFERS.map(function (o) {
      if (o.soon) return '<article class="com-offer is-soon"><h3>' + t(o.fr, o.en) + '</h3><p class="inv-meta">' + t('Les commerçants d\'un même marché se portent garants les uns des autres.', 'Traders from the same market vouch for one another.') + '</p><span class="badge-soon">' + t('Bientôt', 'Soon') + '</span></article>';
      return '<article class="com-offer"><h3>' + t(o.fr, o.en) + '</h3><p class="inv-meta">' + th(amt(o.minA) + ' à ' + amt(o.maxA) + ' · ' + o.months + ' mois', amt(o.minA) + ' to ' + amt(o.maxA) + ' · ' + o.months + ' months') + '</p>' +
        '<p class="inv-meta">' + t('Remboursement : ', 'Repayment: ') + t(o.every[0], o.every[1]) + '</p>' +
        (d.status ? '' : '<button type="button" class="btn btn-outline btn-sm" data-send-dossier="' + o.id + '">' + ic('send', 16, 2) + t('Demander avec mon dossier', 'Apply with my file') + '</button>') + '</article>';
    }).join('') + '</div><p class="inv-foot-note">' + t('Le taux et les conditions sont fixés par le partenaire agréé, qui décide seul. KAME ne prête pas d\'argent et ne touche pas votre argent.',
      'The rate and terms are set by the licensed partner, who alone decides. KAME does not lend money and never touches your money.') + '</p>');
    var status = '';
    if (d.status) {
      var steps = [['sent', 'Dossier envoyé', 'File sent'], ['question', 'Question du partenaire', 'Partner question'], ['study', 'Étude du dossier', 'File review'], ['answer', 'Réponse du partenaire', 'Partner answer']];
      var order = { sent: 0, question: 1, study: 2, answer: 3 };
      var cur = order[d.status];
      var o = OFFERS.filter(function (x) { return x.id === d.offer; })[0] || OFFERS[0];
      status = card(ic('send', 20, 2) + t('Ma demande', 'My request'), '<p><strong>' + t(o.fr, o.en) + '</strong> · ' + amt(d.amount) + ' · ' + th(d.months + ' mois', d.months + ' months') + '</p>' +
        '<ol class="req-steps">' + steps.map(function (s, i) {
          return '<li class="' + (i < cur ? 'done' : (i === cur ? 'current' : '')) + '"><span class="st-dot">' + (i < cur ? ic('ok', 13, 3) : '') + '</span><span class="st-txt"><strong>' + t(s[1], s[2]) + '</strong></span></li>';
        }).join('') + '</ol>' + lenderReqs() + (d.status === 'answer' ? '<p class="biz-all-done">' + ic('ok', 20, 2.4) + t('Le partenaire vous propose un rendez-vous pour finaliser (démonstration).', 'The partner offers you a meeting to finalise (demo).') + '</p>' : ''));
    }
    var L0 = state.loan;
    var loan = L0 ? card(ic('target', 20, 2) + t('Mon prêt en cours', 'My current loan'), '<p class="inv-big">' + amt(L0.amount) + '</p><p class="inv-meta">' + t(L0.fr, L0.en) + ' · ' + t(L0.partnerFr, L0.partnerEn) + '</p>' +
      '<ul class="com-dots" aria-label="' + esc(L(L0.paid + ' échéances payées sur ' + L0.count, L0.paid + ' of ' + L0.count + ' instalments paid')) + '">' + Array.apply(null, Array(L0.count)).map(function (x, i) {
        return '<li class="' + (i < L0.paid ? 'ok' : (i === L0.paid ? 'next' : '')) + '">' + (i + 1) + '</li>';
      }).join('') + '</ul>' + (L0.paid < L0.count ? '<p>' + th('Prochaine échéance : <strong>' + amt(L0.inst) + '</strong> ' + whenFr(Math.max(0, leftDays(L0.next))) + ' (' + esc(L0.next.fr) + ')',
        'Next instalment: <strong>' + amt(L0.inst) + '</strong> ' + whenEn(Math.max(0, leftDays(L0.next))) + ' (' + esc(L0.next.en) + ')') + '</p><div class="req-actions"><button type="button" class="btn btn-primary btn-sm" data-pay-loan>' +
        ic('cash', 16, 2) + t('J\'ai payé l\'échéance', 'I paid the instalment') + '</button></div>' : '<p class="biz-all-done">' + ic('ok', 20, 2.4) + t('Prêt remboursé. Bravo !', 'Loan repaid. Well done!') + '</p>')) : '';
    var funders = card(ic('investor', 20, 2) + t('Mes financeurs', 'My lenders'), '<ul class="inv-docs">' + state.funders.map(function (f) {
      return '<li>' + hexIcon(f.status === 'done' ? 'ok' : 'target', f.status === 'done' ? '#0E7C75' : '#145B63') + '<span><strong>' + t(f.fr, f.en) + '</strong><span class="inv-meta">' + amt(f.amount) + ' · ' +
        (f.status === 'done' ? th('remboursé en ' + f.year, 'repaid in ' + f.year) : (f.status === 'asked' ? t('demande envoyée', 'request sent') : th('en cours (' + L0.paid + '/' + L0.count + ')', 'in progress (' + L0.paid + '/' + L0.count + ')'))) + '</span></span></li>';
    }).join('') + '</ul>');
    return heading('Financement', 'Funding', t('Votre dossier se remplit tout seul quand vous notez vos ventes. Vous choisissez à qui l\'envoyer : rien ne part sans votre accord.',
      'Your file fills itself as you record your sales. You choose who to send it to: nothing leaves without your consent.')) +
      '<div class="inv-grid g-two">' + dossier + offers + status + loan + funders + '</div>' + disclaimer();
  }
  function lenderReqs() {
    if (!state.lreqs.length) return '';
    return '<div class="com-lreqs">' + state.lreqs.map(function (q) {
      var st = q.status === 'attente' ? chip('warn', 'clock', 'À répondre', 'To answer') : (q.status === 'refusee' ? chip('ko', 'close', 'Refusée avec un motif', 'Declined with a reason') : chip('ok', 'ok', 'Répondu', 'Answered'));
      return '<article class="inv-req"><div class="req-top">' + hexIcon('file', '#B8734F') + '<div class="req-title"><h3>' + t(q.fr, q.en) + '</h3><p class="inv-meta">' + t(q.noteFr, q.noteEn) + '</p></div>' + st + '</div>' +
        (q.status === 'attente' ? '<div class="req-actions"><button type="button" class="btn btn-primary btn-sm" data-lreq-answer="' + q.id + '">' + ic('upload', 16, 2) + t('Envoyer le document', 'Send the document') + '</button>' +
          '<button type="button" class="btn btn-outline btn-sm" data-lreq-decline="' + q.id + '">' + t('Refuser avec un motif', 'Decline with a reason') + '</button></div>' : '') + '</article>';
    }).join('') + '</div>';
  }

  // ------------------------------------------------------------ Épargne et tontine
  function viewEpargne() {
    var total = state.goals.reduce(function (s, g) { return s + g.saved; }, 0);
    var tn = state.tontine;
    var kpis = '<div class="inv-kpis three com-kpis">' +
      kpiBox('coins', '#145B63', t('Mis de côté', 'Put aside'), amt(total), th(state.goals.length + ' objectifs', state.goals.length + ' goals')) +
      kpiBox('calendar', '#C98A1E', t('Prochaine cotisation', 'Next contribution'), amt(tn.amount), tn.paid ? t('payée cette semaine', 'paid this week') : th(whenFr(leftDays(tn.next)), whenEn(leftDays(tn.next)))) +
      kpiBox('star', '#0E7C75', t('Mon tour de tontine', 'My tontine turn'), dateText(tn.turn), th('je reçois ' + amt(tn.amount * tn.members), 'I receive ' + amt(tn.amount * tn.members))) + '</div>';
    var goals = '<div class="com-goals">' + state.goals.map(function (g) {
      var p = g.saved / g.target * 100;
      return '<article class="com-goal">' + hexIcon(g.icon, '#145B63') + '<div class="cg-main"><h3>' + t(g.fr, g.en) + '</h3><p class="inv-meta">' + th(amt(g.saved) + ' sur ' + amt(g.target), amt(g.saved) + ' of ' + amt(g.target)) + '</p>' +
        progress(p, p >= 100 ? '#0E7C75' : '#159E96') + '</div>' + (p >= 100 ? chip('ok', 'ok', 'Atteint', 'Reached') : '<button type="button" class="btn btn-outline btn-sm" data-save-goal="' + g.id + '">' + ic('plus', 16, 2.2) + t('Mettre de côté', 'Put aside') + '</button>') + '</article>';
    }).join('') + '</div>';
    var form = '<form class="biz-form" data-form="goal-new" novalidate><div class="biz-row">' + field('Mon objectif', 'My goal', input('name', 'required maxlength="40" autocomplete="off"'), 'Ex. : machine à coudre, réfrigérateur', 'E.g. sewing machine, fridge') +
      field('Montant visé (FCFA)', 'Target amount (FCFA)', input('target', 'type="number" min="1000" max="50000000" step="500" inputmode="numeric" required')) + '</div>' +
      '<div class="biz-form-foot"><button type="submit" class="btn btn-primary btn-sm">' + ic('plus', 16, 2.2) + t('Créer l\'objectif', 'Create the goal') + '</button></div></form>';
    var dots = '<ul class="com-dots small" aria-label="' + esc(L('10 dernières cotisations', 'Last 10 contributions')) + '">' + tn.hist.map(function (x) { return '<li class="' + (x ? 'ok' : 'late') + '">' + (x ? '✓' : '!') + '</li>'; }).join('') + '</ul>';
    var tont = card(ic('users', 20, 2) + t('Ma tontine', 'My tontine'), '<p><strong>' + t(tn.fr, tn.en) + '</strong></p><p class="inv-meta">' + th(tn.members + ' membres · ' + amt(tn.amount) + ' chaque vendredi', tn.members + ' members · ' + amt(tn.amount) + ' every Friday') + '</p>' +
      dots + '<p class="inv-foot-note">' + t('Vos 10 dernières cotisations : ✓ à temps, ! en retard.', 'Your last 10 contributions: ✓ on time, ! late.') + '</p>' +
      (tn.paid ? '<p class="biz-all-done">' + ic('ok', 20, 2.4) + t('Cotisation de cette semaine payée.', 'This week\'s contribution paid.') + '</p>'
        : '<div class="req-actions"><button type="button" class="btn btn-primary btn-sm" data-tontine-pay>' + ic('coins', 16, 2) + t('J\'ai cotisé cette semaine', 'I paid this week') + '</button></div>'));
    var note = '<article class="com-tip">' + hexIcon('shield', '#145B63') + '<div><p class="com-tip-title">' + t('Votre argent reste chez vous', 'Your money stays with you') + '</p><p>' +
      t('KAME ne garde pas d\'argent : vous épargnez sur votre compte Mobile Money, à la microfinance ou dans votre tontine. KAME vous aide seulement à suivre vos objectifs, et votre régularité compte dans votre KAME Score.',
        'KAME holds no money: you save on your Mobile Money account, at your microfinance institution or in your tontine. KAME only helps you track your goals, and your regularity counts in your KAME Score.') + '</p></div></article>';
    return heading('Épargne et tontine', 'Savings and tontine', t('Mettez de côté pour vos projets : stock des fêtes, loyer, rentrée scolaire… et suivez votre tontine.',
      'Put money aside for your plans: holiday stock, rent, back to school… and keep track of your tontine.')) + kpis +
      '<div class="inv-grid g-two"><div class="biz-stack">' + card(ic('target', 20, 2) + t('Mes objectifs', 'My goals'), goals) + card(ic('plus', 20, 2) + t('Nouvel objectif', 'New goal'), form) + '</div>' +
      '<div class="biz-stack">' + tont + note + '</div></div>' + disclaimer();
  }

  // ------------------------------------------------------------ Ma vitrine vérifiée
  function viewVitrine() {
    var v = state.vitrine;
    var url = 'kamegroupe.com/v/' + M.slug;
    var status = '<div class="com-vit-status">' + (v.published ? chip('ok', 'ok', 'Vitrine publiée', 'Window published') : chip('warn', 'edit', 'Brouillon : pas encore visible', 'Draft: not visible yet')) +
      '<code>' + esc(url) + '</code>' + (v.published ? '<button type="button" class="btn btn-outline btn-sm" data-copy="https://' + esc(url) + '">' + ic('copy', 16, 2) + t('Copier le lien', 'Copy the link') + '</button>' +
        '<button type="button" class="btn btn-outline btn-sm" data-share-vitrine>' + ic('chat', 16, 2) + t('Partager sur mon statut WhatsApp', 'Share on my WhatsApp status') + '</button>' : '') + '</div>';
    var form = '<form class="biz-form" data-form="vitrine" novalidate>' + field('Présentation', 'Description', '<textarea class="inv-input" name="desc" rows="3" maxlength="300">' + esc(v.desc) + '</textarea>') +
      '<div class="biz-row">' + field('Quartier', 'Neighbourhood', input('quartier', 'maxlength="40" autocomplete="off" value="' + esc(v.quartier) + '"')) +
      field('Horaires', 'Opening hours', input('hours', 'maxlength="60" autocomplete="off" value="' + esc(v.hours) + '"')) + '</div>' +
      field('Numéro WhatsApp pour les commandes', 'WhatsApp number for orders', input('wa', 'type="tel" inputmode="tel" maxlength="20" autocomplete="off" value="' + esc(v.wa) + '"'), 'Obligatoire pour publier', 'Required to publish') +
      '<label class="inv-choice"><input type="checkbox" name="delivery" value="1"' + (v.delivery ? ' checked' : '') + '><span>' + t('Je peux livrer dans le quartier', 'I can deliver in the neighbourhood') + '</span></label>' +
      '<fieldset class="inv-choices"><legend>' + t('Produits montrés sur la vitrine', 'Products shown on the window') + '</legend>' + state.stock.map(function (p) {
        return '<label class="inv-choice"><input type="checkbox" data-vis-prod="' + p.id + '"' + (v.show[p.id] ? ' checked' : '') + '><span>' + pname(p) + ' <em>' + th(money(p.sell) + ' / ' + esc(p.unit[0]), money(p.sell) + ' / ' + esc(p.unit[1])) + '</em></span></label>';
      }).join('') + '</fieldset><div class="biz-form-foot">' + fileBtn('data-file="logo"', 'Photo ou logo', 'Photo or logo', 'image/png,image/jpeg,image/webp') +
      '<button type="submit" class="btn btn-outline btn-sm">' + ic('ok', 16, 2.2) + t('Enregistrer', 'Save') + '</button>' +
      '<button type="button" class="btn btn-primary btn-sm" data-publish>' + ic(v.published ? 'eyeoff' : 'send', 16, 2) + (v.published ? t('Retirer la vitrine', 'Unpublish') : t('Publier ma vitrine', 'Publish my window')) + '</button></div></form>';
    var prods = state.stock.filter(function (p) { return v.show[p.id]; });
    var logo = v.logo ? '<span class="biz-logo"><img src="' + v.logo + '" alt=""></span>' : hexIcon('merchant', '#145B63');
    var preview = '<div class="com-vit-preview"><div class="cvp-head">' + logo + '<div><strong>' + nameHtml() + '</strong><span class="inv-meta">' + ic('pin', 14, 2) + esc((v.quartier ? v.quartier + ', ' : '') + M.city) + '</span></div></div>' +
      '<span class="inv-verified">' + ic('shield', 15, 2) + t('Commerce vérifié par KAME', 'Business verified by KAME') + '</span><p>' + esc(v.desc) + '</p>' +
      '<p class="inv-meta">' + ic('clock', 14, 2) + esc(v.hours) + (v.delivery ? ' · ' + t('livraison possible', 'delivery available') : '') + '</p>' +
      (prods.length ? '<ul class="cvp-prods">' + prods.map(function (p) { return '<li><span>' + pname(p) + '</span><strong>' + th(money(p.sell) + ' / ' + esc(p.unit[0]), money(p.sell) + ' / ' + esc(p.unit[1])) + '</strong></li>'; }).join('') + '</ul>' : '') +
      '<button type="button" class="btn btn-primary btn-sm" data-vit-order>' + ic('chat', 16, 2) + t('Commander sur WhatsApp', 'Order on WhatsApp') + '</button></div>';
    var never = '<article class="com-tip">' + hexIcon('lock', '#145B63') + '<div><p class="com-tip-title">' + t('Ce que la vitrine ne montre jamais', 'What the window never shows') + '</p><p>' +
      t('Vos chiffres, vos crédits, votre KAME Score et l\'argent de votre caisse restent privés. La vitrine montre seulement vos produits, vos prix et le badge « Commerce vérifié ».',
        'Your figures, credits, KAME Score and till money stay private. The window only shows your products, your prices and the "Verified business" badge.') + '</p></div></article>';
    return heading('Ma vitrine', 'My shop window', t('Une petite page pour vendre sur WhatsApp et Facebook : vos produits, vos prix, un bouton pour commander, et le badge « Commerce vérifié par KAME » qui rassure les acheteurs.',
      'A small page to sell on WhatsApp and Facebook: your products, your prices, an order button, and the "Verified by KAME" badge that reassures buyers.')) + status +
      '<div class="inv-grid g-two">' + card(ic('edit', 20, 2) + t('Modifier ma vitrine', 'Edit my window'), form) + '<div class="biz-stack">' + card(ic('eye', 20, 2) + t('Ce que voient les acheteurs', 'What buyers see'), preview) + never + '</div></div>' + disclaimer();
  }

  // ------------------------------------------------------------ Mes papiers (KAME Check et KAME ID)
  function viewPapiers() {
    var sp = window.KAME_SPACE || {};
    var idc = sp.ids && sp.ids.commercant ? sp.ids.commercant : 'KG-COM-…';
    var me = card(ic('id', 20, 2) + t('Mon identité (KAME ID)', 'My identity (KAME ID)'), '<div class="biz-badge-big">' + hexIcon('shield', '#0E7C75') + '<div><strong>' + t('Identité vérifiée par KAME', 'Identity verified by KAME') + '</strong>' +
      '<span class="inv-meta">' + t('Identifiant commerçant : ', 'Merchant ID: ') + '<code>' + esc(idc) + '</code></span></div></div><p class="inv-meta">' +
      t('Pièces acceptées : carte nationale d\'identité, passeport, carte consulaire, carte de séjour. Vos documents ne sont jamais montrés à vos clients.',
        'Accepted documents: national ID card, passport, consular card, residence permit. Your documents are never shown to your customers.') + '</p>');
    var steps = '<ol class="com-steps">' + state.papers.map(function (x, i) {
      var st = x.status === 'ok' ? chip('ok', 'ok', 'Fait', 'Done') : (x.status === 'expiring' ? chip('warn', 'clock', 'À renouveler', 'To renew') : (x.status === 'review' ? chip('', 'clock', 'KAME vérifie', 'KAME is checking') : chip('', '', 'À faire', 'To do')));
      return '<li class="cs-' + x.status + '"><span class="how-n">' + (i + 1) + '</span><div class="cs-main"><h3>' + t(x.fr, x.en) + '</h3><p class="inv-meta">' + t(x.whyFr, x.whyEn) + '</p>' +
        (x.until && x.status !== 'todo' ? '<p class="inv-meta">' + th((x.status === 'expiring' ? 'Expire ' + whenFr(leftDays(x.until)) : 'Valable jusqu\'au ' + esc(x.until.fr)), (x.status === 'expiring' ? 'Expires ' + whenEn(leftDays(x.until)) : 'Valid until ' + esc(x.until.en))) + '</p>' : '') +
        '<div class="cs-foot">' + st + (x.status !== 'review' && x.status !== 'ok' ? fileBtn('data-file="paper:' + x.id + '"', 'Déposer le document', 'Upload the document', '.pdf,image/*') : '') + '</div></div></li>';
    }).join('') + '</ol>';
    var vault = '<ul class="inv-docs">' + state.docs.map(function (d) {
      return '<li>' + hexIcon('file', d.verified ? '#0E7C75' : '#9AA9AE') + '<span><strong>' + (d.custom ? esc(d.custom) : t(d.fr, d.en)) + '</strong><span class="inv-meta">' + (d.verified ? t('Vérifié par KAME', 'Verified by KAME') : t('Pas encore vérifié', 'Not checked yet')) +
        ' · ' + dateText(d.added) + '</span></span><label class="biz-vis"><span class="sr-only">' + t('Qui peut le voir', 'Who can see it') + '</span>' +
        selectEl('vis-' + d.id, Object.keys(DOC_VIS).map(function (k) { return [k, DOC_VIS[k][0], DOC_VIS[k][1]]; }), d.vis, 'data-docvis="' + d.id + '"') + '</label></li>';
    }).join('') + '</ul><div class="biz-form-foot">' + fileBtn('data-file="vault"', 'Ajouter un document', 'Add a document', '.pdf,image/*') + '</div>';
    var why = '<article class="com-tip">' + hexIcon('info', '#145B63') + '<div><p class="com-tip-title">' + t('Facultatif, mais utile', 'Optional, but useful') + '</p><p>' +
      t('Vous pouvez utiliser KAME sans RCCM ni NIF. Chaque papier ajouté fait monter votre KAME Score et ouvre plus de portes chez les financeurs. Démonstration : le fichier reste sur votre appareil, seule son empreinte est calculée.',
        'You can use KAME without a trade register entry or tax ID. Each paper you add raises your KAME Score and opens more doors with lenders. Demo: the file stays on your device, only its fingerprint is calculated.') + '</p></div></article>';
    return heading('Mes papiers', 'My papers', t('Votre identité vérifiée, et les étapes pour faire reconnaître votre commerce, à votre rythme.', 'Your verified identity, and the steps to get your business recognised, at your own pace.')) +
      '<div class="inv-grid g-two"><div class="biz-stack">' + me + card(ic('check', 20, 2) + t('Me formaliser, étape par étape', 'Getting formal, step by step'), steps) + '</div><div class="biz-stack">' +
      card(ic('lock', 20, 2) + t('Mes documents', 'My documents'), vault) + why + '</div></div>' + disclaimer();
  }

  // ------------------------------------------------------------ Sécurité et aides (KAME Garde)
  var HELPER_ROLES = { vendeur: ['Vendeur', 'Seller', 'Note les ventes', 'Records sales'], caissier: ['Caissier', 'Cashier', 'Note les ventes, les dépenses et les remboursements', 'Records sales, expenses and repayments'] };
  var RELS = [['enfant', 'Enfant', 'Child'], ['neveu', 'Neveu ou nièce', 'Nephew or niece'], ['frere', 'Frère ou sœur', 'Brother or sister'], ['conjoint', 'Conjoint(e)', 'Spouse'],
              ['employe', 'Employé(e)', 'Employee'], ['autre', 'Autre', 'Other']];
  function viewSecurite() {
    var s = todayStats();
    var code = card(ic('key', 20, 2) + t('Mon code à 4 chiffres', 'My 4-digit code'), '<p>' + t('Demandé à chaque ouverture de l\'espace sur ce téléphone : si quelqu\'un prend votre téléphone, il ne voit pas vos chiffres.',
      'Asked each time the space opens on this phone: if someone picks up your phone, they cannot see your figures.') + '</p><p class="biz-all-done">' + ic('ok', 20, 2.4) + t('Code activé', 'Code on') + '</p>' +
      '<div class="req-actions"><button type="button" class="btn btn-outline btn-sm" data-change-pin>' + ic('edit', 16, 2) + t('Changer mon code', 'Change my code') + '</button></div>');
    var discreet = card(ic('eyeoff', 20, 2) + t('Mode discret', 'Discreet mode'), '<p>' + t('Au marché, on regarde souvent l\'écran par-dessus votre épaule. Le mode discret floute tous les montants ; touchez l\'œil pour les revoir.',
      'At the market, people often look over your shoulder. Discreet mode blurs all amounts; tap the eye to see them again.') + '</p>' + switchBtn('data-discreet', state.discreet, 'Cacher les montants', 'Hide amounts'));
    var devices = card(ic('mobile', 20, 2) + t('Mes appareils', 'My devices'), '<ul class="inv-docs">' + state.devices.map(function (d) {
      return '<li>' + hexIcon(d.me ? 'mobile' : 'design', '#145B63') + '<span><strong>' + t(d.fr, d.en) + '</strong><span class="inv-meta">' + t(d.when[0], d.when[1]) + '</span></span>' +
        (d.me ? chip('ok', '', 'Cet appareil', 'This device') : '<button type="button" class="inv-link danger" data-logout-device="' + d.id + '">' + t('Déconnecter', 'Log out') + '</button>') + '</li>';
    }).join('') + '</ul><div class="com-note warn">' + ic('alert', 18, 2) + '<span>' + t('Téléphone perdu ou volé ? Bloquez l\'accès depuis un autre appareil : vos données restent protégées.',
      'Phone lost or stolen? Block access from another device: your data stays protected.') + '</span></div><div class="req-actions"><button type="button" class="btn btn-outline btn-sm" data-block-all>' +
      ic('lock', 16, 2) + t('Bloquer l\'accès sur les autres appareils', 'Block access on other devices') + '</button></div>');
    var helpers = '<ul class="inv-docs">' + state.helpers.map(function (h) {
      var r = HELPER_ROLES[h.role];
      var n = s.byWho[h.id] || 0;
      return '<li>' + hexIcon('user', '#B8734F') + '<span><strong>' + esc(h.name) + ' · ' + t(h.rel[0], h.rel[1]) + '</strong><span class="inv-meta">' + t(r[0], r[1]) + ' : ' + t(r[2], r[3]) +
        ' · ' + th(n + ' vente' + (n > 1 ? 's' : '') + ' aujourd\'hui', n + ' sale' + (n > 1 ? 's' : '') + ' today') + '</span></span><button type="button" class="inv-link danger" data-remove-helper="' + h.id + '">' + t('Retirer', 'Remove') + '</button></li>';
    }).join('') + '</ul>' + (state.lastHelperCode ? '<div class="biz-msg"><p class="biz-msg-head">' + ic('key', 16, 2) + th('Code de ' + esc(state.lastHelperCode.name) + ' : <strong>' + esc(state.lastHelperCode.code) + '</strong>',
      esc(state.lastHelperCode.name) + '\'s code: <strong>' + esc(state.lastHelperCode.code) + '</strong>') + '</p><p class="inv-meta">' + t('Donnez-le en main propre. Il ne s\'affichera plus (démonstration).', 'Give it in person. It will not be shown again (demo).') + '</p></div>' : '') +
      '<form class="biz-form biz-invite" data-form="helper-new" novalidate><div class="biz-row">' + field('Prénom', 'First name', input('name', 'required maxlength="40" autocomplete="off"')) +
      field('Lien avec vous', 'Relationship', selectEl('rel', RELS, 'enfant')) + '</div><div class="biz-row">' + field('Ce qu\'il peut faire', 'What they can do', selectEl('role', Object.keys(HELPER_ROLES).map(function (k) { return [k, HELPER_ROLES[k][0] + ' : ' + HELPER_ROLES[k][2].toLowerCase(), HELPER_ROLES[k][1] + ': ' + HELPER_ROLES[k][3].toLowerCase()]; }), 'vendeur')) + '</div>' +
      '<div class="biz-form-foot"><button type="submit" class="btn btn-primary btn-sm">' + ic('plus', 16, 2.2) + t('Ajouter une aide', 'Add a helper') + '</button></div></form>';
    var rights = '<div class="inv-table-wrap"><table class="inv-table com-rights"><thead><tr><th scope="col">' + t('Qui', 'Who') + '</th><th scope="col">' + t('Ventes', 'Sales') + '</th><th scope="col">' + t('Dépenses', 'Expenses') + '</th><th scope="col">' +
      t('Bénéfice et caisse', 'Profit and till') + '</th><th scope="col">' + t('Annuler', 'Undo') + '</th></tr></thead><tbody>' +
      [['Moi', 'Me', 1, 1, 1, 1], ['Caissier', 'Cashier', 1, 1, 0, 0], ['Vendeur', 'Seller', 1, 0, 0, 0]].map(function (r) {
        return '<tr><th scope="row">' + t(r[0], r[1]) + '</th>' + r.slice(2).map(function (x) { return '<td>' + (x ? '<span class="com-yes">' + ic('ok', 16, 2.6) + '<span class="sr-only">' + t('oui', 'yes') + '</span></span>' : '<span class="com-no">—<span class="sr-only">' + t('non', 'no') + '</span></span>') + '</td>'; }).join('') + '</tr>';
      }).join('') + '</tbody></table></div>';
    var act = '<ul class="biz-activity com-activity">' + state.activity.slice(0, 6).map(function (a) {
      return '<li class="biz-act">' + hexIcon(a.icon, '#145B63') + '<span><strong>' + t(a.fr, a.en) + '</strong><span class="inv-meta">' + t(a.when[0], a.when[1]) + '</span></span></li>';
    }).join('') + '</ul>';
    return heading('Sécurité et aides', 'Security and helpers', t('Protégez votre espace, et laissez un proche tenir la boutique sans lui montrer vos chiffres.', 'Protect your space, and let a relative run the shop without showing them your figures.')) +
      '<div class="inv-grid g-two">' + code + discreet + card(ic('users', 20, 2) + t('Mes aides et vendeurs', 'My helpers and sellers'), helpers + rights, '', 'wide') + devices +
      card(ic('clock', 20, 2) + t('Activité récente', 'Recent activity'), act) + '</div>' + disclaimer();
  }

  // ------------------------------------------------------------ KAME Agro (commerçants de produits agricoles)
  var MARKET = [['Bâtons de manioc', 'Cassava sticks', '250 – 350', 'bâton', 'stick'], ['Banane plantain', 'Plantain', '800 – 1 200', 'tas', 'pile'],
                ['Piment', 'Chilli', '150 – 250', 'petit tas', 'small pile'], ['Huile de palme', 'Palm oil', '1 000 – 1 400', 'litre', 'litre'], ['Arachide', 'Groundnuts', '900 – 1 300', 'kilo', 'kilo']];
  function viewAgro() {
    var losses = state.agroLoss.reduce(function (s, x) { return s + x.value; }, 0);
    var prodOpts = state.stock.map(function (p) { return [p.id, p.fr, p.en]; });
    var form = '<form class="biz-form" data-form="loss" novalidate><div class="biz-row">' + field('Produit', 'Product', selectEl('product', prodOpts, prodOpts.length ? prodOpts[0][0] : '')) +
      field('Quantité abîmée', 'Quantity spoiled', input('qty', 'type="number" min="1" max="10000" step="1" inputmode="numeric" required')) + '</div>' +
      '<div class="biz-form-foot"><button type="submit" class="btn btn-primary btn-sm">' + ic('minus', 16, 2.2) + t('Noter la perte', 'Record the loss') + '</button></div></form>' +
      (state.agroLoss.length ? '<ul class="inv-docs">' + state.agroLoss.map(function (x) {
        var p = findProduct(x.id);
        return '<li>' + hexIcon('alert', '#B5452F') + '<span><strong>' + (p ? pname(p) : '') + ' · ' + (p ? unitsHtml(p, x.qty) : x.qty) + '</strong><span class="inv-meta">' + th('perte de ' + amt(x.value), 'loss of ' + amt(x.value)) + '</span></span></li>';
      }).join('') + '</ul>' : '');
    var market = '<div class="inv-table-wrap"><table class="inv-table"><thead><tr><th scope="col">' + t('Produit', 'Product') + '</th><th scope="col">' + t('Prix au détail (FCFA)', 'Retail price (FCFA)') + '</th></tr></thead><tbody>' +
      MARKET.map(function (m) { return '<tr><th scope="row">' + t(m[0], m[1]) + '</th><td>' + esc(m[2]) + ' / ' + t(m[3], m[4]) + '</td></tr>'; }).join('') + '</tbody></table></div>' +
      '<p class="inv-foot-note">' + t('Exemple de démonstration. En version réelle, les prix viennent des relevés partagés par les commerçants membres.', 'Demo example. In the live version, prices come from readings shared by member traders.') + '</p>';
    var producers = '<ul class="inv-docs">' + state.suppliers.map(function (f) {
      return '<li>' + hexIcon('agro', '#159E96') + '<span><strong>' + esc(f.name) + '</strong><span class="inv-meta">' + t(f.what[0], f.what[1]) + '</span></span></li>';
    }).join('') + '</ul>';
    return heading('KAME Agro', 'KAME Agro', t('Pour les commerçants de produits agricoles : les pertes des produits frais, les prix du marché et vos producteurs.',
      'For farm-produce traders: fresh-produce losses, market prices and your producers.')) +
      '<div class="inv-kpis three com-kpis">' + kpiBox('alert', '#B5452F', t('Pertes notées', 'Losses recorded'), amt(losses), t('produits abîmés, au prix d\'achat', 'spoiled goods, at purchase price')) +
      kpiBox('agro', '#159E96', t('Producteurs', 'Producers'), String(state.suppliers.length), t('qui vous fournissent', 'who supply you')) +
      kpiBox('trend', '#0E7C75', t('Bénéfice moyen', 'Average margin'), Math.round(avgMargin() * 100) + ' %', t('avant les pertes', 'before losses')) + '</div>' +
      '<div class="inv-grid g-two">' + card(ic('minus', 20, 2) + t('Produits abîmés', 'Spoiled goods'), '<p class="inv-meta">' + t('Notez ce qui s\'abîme : vous verrez ce que les pertes vous coûtent vraiment, et le stock reste juste.',
        'Record what spoils: you will see what losses really cost you, and your stock stays accurate.') + '</p>' + form) +
      card(ic('trend', 20, 2) + t('Prix du jour au marché', 'Today\'s market prices'), market) + card(ic('agro', 20, 2) + t('Mes producteurs', 'My producers'), producers +
        '<p class="inv-foot-note">' + th('Ce que vous leur devez est dans <a href="#c-credits/fournisseurs">Crédits</a>.', 'What you owe them is in <a href="#c-credits/fournisseurs">Credit</a>.') + '</p>') + '</div>' + disclaimer();
  }

  // ------------------------------------------------------------ Plus (menu du téléphone)
  function viewPlus() {
    var sp = scoreParts();
    var tiles = [
      ['#c-stock', 'box', 'Stock', 'Stock', th(state.stock.filter(isLow).length + ' à racheter', state.stock.filter(isLow).length + ' to restock')],
      ['#c-recus', 'receipt', 'Reçus', 'Receipts', t('KAME Registre', 'KAME Registre')],
      ['#c-credits/fournisseurs', 'truck', 'Mes fournisseurs', 'My suppliers', th(amt(owed()) + ' à payer', amt(owed()) + ' to pay')],
      ['#c-financement', 'target', 'Financement', 'Funding', t('Mon dossier et mon prêt', 'My file and my loan')],
      ['#c-epargne', 'coins', 'Épargne et tontine', 'Savings and tontine', t('Mes objectifs', 'My goals')],
      ['#c-vitrine', 'merchant', 'Ma vitrine', 'My shop window', state.vitrine.published ? t('Publiée', 'Published') : t('Brouillon', 'Draft')],
      ['#c-score', 'score', 'Mon KAME Score', 'My KAME Score', th(sp.score + '/100', sp.score + '/100')],
      ['#c-papiers', 'check', 'Mes papiers', 'My papers', t('KAME Check et KAME ID', 'KAME Check and KAME ID')],
      ['#c-securite', 'garde', 'Sécurité et aides', 'Security and helpers', t('KAME Garde', 'KAME Garde')]
    ];
    if (M.agro) tiles.push(['#c-agro', 'agro', 'KAME Agro', 'KAME Agro', t('Pertes et prix du marché', 'Losses and market prices')]);
    return heading('Tous mes outils', 'All my tools', t('Tout ce dont votre commerce a besoin, au même endroit.', 'Everything your shop needs, in one place.')) +
      '<div class="com-tiles">' + tiles.map(function (x) {
        return '<a class="com-tile" href="' + x[0] + '">' + hexIcon(x[1], '#145B63') + '<span><strong>' + t(x[2], x[3]) + '</strong><span class="inv-meta">' + x[4] + '</span></span>' + ic('right', 18, 2) + '</a>';
      }).join('') + '</div>' + tipOfDay() +
      '<article class="inv-help">' + (shell.querySelector('.com-side-card svg') ? shell.querySelector('.com-side-card svg').outerHTML : '') + '<h2>' + t('Besoin d\'aide ?', 'Need help?') + '</h2><p>' +
      t('L\'équipe KAME vous accompagne : vos ventes, votre stock, votre dossier de financement.', 'The KAME team helps you: your sales, your stock, your funding file.') + '</p>' +
      '<a class="btn btn-light btn-sm" href="index.html#contact">' + t('Poser une question', 'Ask a question') + ' ' + ic('right', 16, 2) + '</a></article>' + disclaimer();
  }

  // ------------------------------------------------------------ menu de gauche, barre du bas, carte d'encouragement
  function renderNav() {
    var nav = shell.querySelector('[data-com-nav]');
    nav.setAttribute('aria-label', L('Espace commerçant', 'Merchant space'));
    nav.innerHTML = NAV.filter(function (x) { return !(x[5] && x[5].indexOf('agro') >= 0 && !M.agro); }).map(function (x) {
      if (x[0] === 'label') return '<p class="inv-nav-label">' + t(x[1], x[2]) + '</p>';
      var opt = x[5] || '';
      return '<a class="inv-nav-item' + (opt.indexOf('sub') >= 0 ? ' sub' : '') + (x[1] === 'c-vendre' ? ' com-nav-sell' : '') + '" href="' + x[0] + '" data-nav="' + x[1] + '">' + ic(x[2], 20, 1.9) + '<span>' + t(x[3], x[4]) + '</span>' +
        (opt.indexOf('late') >= 0 ? '<span class="inv-nav-count" data-late-count hidden></span>' : '') + (opt.indexOf('low') >= 0 ? '<span class="inv-nav-count" data-low-count hidden></span>' : '') + '</a>';
    }).join('');
    var txt = shell.querySelector('[data-com-side-text]'), btn = shell.querySelector('[data-com-side-btn]');
    if (txt) txt.innerHTML = t('Chaque vente notée fait monter votre KAME Score et remplit votre dossier de financement.', 'Every sale you record raises your KAME Score and fills your funding file.');
    if (btn) btn.innerHTML = t('Noter une vente', 'Record a sale');
    var bar = shell.querySelector('[data-com-bar]');
    bar.setAttribute('aria-label', L('Raccourcis de l\'espace commerçant', 'Merchant space shortcuts'));
    bar.innerHTML = BAR.map(function (x) {
      return '<a class="com-bar-item' + (x[5] ? ' is-main' : '') + '" href="' + x[0] + '" data-bar="' + x[1] + '"><span class="cb-ic">' + ic(x[2], x[5] ? 28 : 22, x[5] ? 2.6 : 2) + '</span><span class="cb-tx">' +
        t(x[3], x[4]) + '</span>' + (x[1] === 'c-credits' ? '<span class="cb-n" data-late-count hidden></span>' : '') + '</a>';
    }).join('');
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
    args = args || [view];
    if (view === 'c-agro' && !M.agro) view = 'c-journee';
    if (view === 'c-vendre' && args[1] === 'credit') {
      state.pad.tab = 'vente'; state.pad.value = 0; state.pad.picks = {}; state.pad.pay = 'credit'; state.pad.last = null;
      args = ['c-vendre'];
      history.replaceState(null, '', location.pathname + location.search + '#c-vendre');
    }
    var html;
    switch (view) {
      case 'c-vendre': html = viewVendre(args[1]); break;
      case 'c-credits': html = viewCredits(args[1]); break;
      case 'c-stock': html = viewStock(); break;
      case 'c-recus': html = viewRecus(); break;
      case 'c-score': html = viewScore(); break;
      case 'c-financement': html = viewFinancement(); break;
      case 'c-epargne': html = viewEpargne(); break;
      case 'c-vitrine': html = viewVitrine(); break;
      case 'c-papiers': html = viewPapiers(); break;
      case 'c-securite': html = viewSecurite(); break;
      case 'c-agro': html = viewAgro(); break;
      case 'c-plus': html = viewPlus(); break;
      default: html = viewJournee(); view = 'c-journee';
    }
    shell.querySelectorAll('.inv-view').forEach(function (v) {
      var on = v.getAttribute('data-view') === view;
      v.hidden = !on;
      v.innerHTML = on ? html : '';
    });
    shell.querySelectorAll('[data-nav]').forEach(function (a) {
      if (a.getAttribute('data-nav') === view) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    var inBar = BAR.some(function (x) { return x[1] === view; });
    shell.querySelectorAll('[data-bar]').forEach(function (a) {
      var k = a.getAttribute('data-bar');
      if (k === view || (!inBar && k === 'c-plus')) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    currentView = view;
    currentArgs = args;
    updateBadges();
  }
  function route(fromUser) {
    var parts = parse();
    if (!parts) { render('c-journee', ['c-journee']); return; }
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
  // Redessine la vue en cours en gardant le focus et ce qui était déjà tapé dans les formulaires
  var FOCUS_KEYS = ['data-key', 'data-add', 'data-pick', 'data-pay', 'data-cat', 'data-mecat', 'data-client-pick', 'data-pad-receipt', 'data-pad-confirm', 'data-discreet',
                    'data-show-all', 'data-vis-prod', 'data-docvis', 'data-pad-field', 'name'];
  function rerender(opts) {
    if (!active || !currentView || shell.hidden) return;
    opts = opts || {};
    var el = document.activeElement, key = null;
    if (el && shell.contains(el)) {
      FOCUS_KEYS.forEach(function (k) { if (!key && el.hasAttribute(k)) key = '[' + k + '="' + el.getAttribute(k) + '"]'; });
    }
    var snap = {};
    shell.querySelectorAll('form[data-form] [name]').forEach(function (f) {
      var form = f.form && f.form.getAttribute('data-form');
      if (!form || form === opts.reset || f.type === 'file') return;
      snap[form + '|' + f.name + (f.type === 'checkbox' || f.type === 'radio' ? '|' + f.value : '')] = f.type === 'checkbox' || f.type === 'radio' ? f.checked : f.value;
    });
    var y = window.pageYOffset;
    render(currentView, currentArgs);
    shell.querySelectorAll('form[data-form] [name]').forEach(function (f) {
      var form = f.form && f.form.getAttribute('data-form');
      var k = form + '|' + f.name + (f.type === 'checkbox' || f.type === 'radio' ? '|' + f.value : '');
      if (!(k in snap)) return;
      if (f.type === 'checkbox' || f.type === 'radio') f.checked = snap[k]; else f.value = snap[k];
    });
    var again = key && shell.querySelector(key);
    if (again) again.focus({ preventScroll: true });
    window.scrollTo(0, y);
  }

  // ------------------------------------------------------------ opérations
  function ensureDay() {
    var d = state.day;
    if (!d.open) { d.open = true; d.openedAt = new Date(); }
    if (d.closed) { d.closed = false; d.closedAt = null; }
  }
  function addEntry(o) {
    ensureDay();
    var e = { id: nid('e'), at: new Date(), by: 'moi', cancelled: false };
    for (var k in o) e[k] = o[k];
    state.entries.unshift(e);
    return e;
  }
  function lowAlert(p, before) {
    if (before > p.min && p.left <= p.min) {
      addNotif({ icon: 'box', go: '#c-stock', when: ['À l\'instant', 'Just now'], fr: 'Stock bas : ' + p.fr + ' (il reste ' + p.left + ' ' + plural(p.unit[0], p.left) + ').',
                 en: 'Low stock: ' + p.en + ' (' + p.left + ' ' + plural(p.unit[1], p.left, true) + ' left).' });
    }
  }
  // Confirmation d'une dette par le client : lien WhatsApp, puis certificat KAME Registre (simulé au bout de 5 secondes)
  function askConfirm(c) {
    c.confirmed = 'sent';
    setTimeout(function () {
      if (state.credits.indexOf(c) < 0) return;
      c.confirmed = 'yes';
      if (!c.counted) { c.counted = true; state.conf.yes++; }
      addNotif({ icon: 'registre', go: '#c-credits', when: ['À l\'instant', 'Just now'], fr: c.name + ' a confirmé sa dette de ' + fcfa(leftC(c)) + ' : elle est certifiée par KAME Registre.',
                 en: c.name + ' confirmed their debt of ' + fcfa(leftC(c), true) + ': it is certified by KAME Registre.' });
      rerender();
    }, 5000);
  }
  function saveFromPad() {
    var pad = state.pad, v = pad.value;
    if (!(v >= 25)) { toast(t('Tapez d\'abord le montant (25 FCFA au moins).', 'First type the amount (at least 25 FCFA).'), 'info'); return; }
    if (v > 10000000) { toast(t('Montant trop élevé pour une seule opération.', 'Amount too high for a single entry.'), 'info'); return; }
    var e;
    if (pad.tab === 'vente') {
      if (pad.pay === 'credit' && !pad.client.trim()) { toast(t('Indiquez le nom du client qui achète à crédit.', 'Enter the name of the customer buying on credit.'), 'info'); var f = shell.querySelector('[data-pad-field="client"]'); if (f) f.focus(); return; }
      var items = Object.keys(pad.picks).map(function (id) { return [id, pad.picks[id]]; });
      e = addEntry({ kind: 'vente', amount: v, pay: pad.pay, items: items.length ? items : null });
      items.forEach(function (x) { var p = findProduct(x[0]); if (p) { var before = p.left; p.left = Math.max(0, p.left - x[1]); lowAlert(p, before); } });
      if (pad.pay === 'credit') {
        var name = pad.client.trim().slice(0, 60);
        var c = state.credits.filter(function (x) { return plain(x.name) === plain(name); })[0];
        var whatFr = items.length ? items.map(function (x) { var p = findProduct(x[0]); return p ? p.fr : ''; }).join(', ') : 'Achats du ' + daysAgo(0).fr;
        var whatEn = items.length ? items.map(function (x) { var p = findProduct(x[0]); return p ? p.en : ''; }).join(', ') : 'Purchases on ' + daysAgo(0).en;
        if (c) { c.total += v; e.addedTo = c.id; } else {
          c = { id: nid('k'), name: name, phone: maskPhone(pad.phone), what: [whatFr, whatEn], total: v, paid: 0, since: daysAgo(0), due: inDays(parseInt(pad.due, 10) || 7),
                confirmed: 'no', verified: false, payments: [], fromEntry: e.id };
          state.credits.push(c);
          state.conf.total++;
        }
        e.ref = c.id; e.who = c.name;
        if (pad.confirm && c.confirmed !== 'yes') askConfirm(c);
        pad.client = ''; pad.phone = '';
      }
      toast(th('Vente de ' + amt(v) + ' notée · ' + esc(PAY[pad.pay].fr) + '.', 'Sale of ' + amt(v) + ' recorded · ' + esc(PAY[pad.pay].en) + '.'));
      if (pad.receipt && pad.pay !== 'credit') {
        var label = items.length ? items.map(function (x) { var p = findProduct(x[0]); return (p ? L(p.fr, p.en) : '') + ' × ' + x[1]; }).join(', ') : L('Achats', 'Purchases');
        issueReceipt({ client: pad.rclient.trim() || L('Client', 'Customer'), object: label, amount: v, pay: pad.pay }).then(function (r) {
          e.receipt = r.no;
          rerender();
        }).catch(function () { toast(t('Votre navigateur ne permet pas ce calcul.', 'Your browser cannot do this calculation.'), 'info'); });
      }
    } else if (pad.tab !== 'vente' && cashShort(v, pad.pay === 'credit' ? 'cash' : pad.pay)) {
      toast(cashShort(v, 'cash'), 'alert');
      return;
    } else if (pad.tab === 'depense') {
      e = addEntry({ kind: 'depense', amount: v, pay: pad.pay === 'credit' ? 'cash' : pad.pay, cat: pad.cat });
      toast(th('Dépense de ' + amt(v) + ' notée.', 'Expense of ' + amt(v) + ' recorded.'));
    } else {
      e = addEntry({ kind: 'moi', amount: v, pay: pad.pay === 'credit' ? 'cash' : pad.pay, cat: pad.meCat });
      var wk = weekMoney();
      if (wk.moi > state.salary.amount) toast(th('Noté. Cette semaine, vous avez pris ' + amt(wk.moi) + ', plus que votre salaire de ' + amt(state.salary.amount) + '.',
        'Recorded. This week you have taken ' + amt(wk.moi) + ', more than your salary of ' + amt(state.salary.amount) + '.'), 'alert');
      else toast(th(amt(v) + ' pris pour vous, notés à part.', amt(v) + ' taken for you, recorded separately.'));
    }
    pad.value = 0; pad.picks = {}; pad.last = e.id;
    rerender();
  }
  function undo(id) {
    var e = state.entries.filter(function (x) { return x.id === id; })[0];
    if (!e || e.cancelled) return;
    e.cancelled = true;
    if (e.items) e.items.forEach(function (x) { var p = findProduct(x[0]); if (p) p.left += x[1]; });
    if (e.kind === 'vente' && e.pay === 'credit' && e.ref) {
      var c = state.credits.filter(function (x) { return x.id === e.ref; })[0];
      if (c) {
        if (c.fromEntry === e.id && !c.paid) {
          state.credits = state.credits.filter(function (x) { return x !== c; });
          state.conf.total = Math.max(0, state.conf.total - 1);
          if (c.counted) state.conf.yes = Math.max(0, state.conf.yes - 1);
        } else c.total = Math.max(c.paid, c.total - e.amount);
      }
    }
    state.activity.unshift({ icon: 'undo', fr: 'Vous avez annulé : ' + KIND[e.kind].fr.toLowerCase() + ' de ' + fcfa(e.amount) + ' (' + hmFr(e.at) + ').', en: 'You cancelled: ' + KIND[e.kind].en.toLowerCase() + ' of ' + fcfa(e.amount, true) + ' (' + hmEn(e.at) + ').',
                             when: ['À l\'instant', 'Just now'] });
    rerender();
    toast(t('Annulé. L\'opération reste visible, barrée, dans votre journée.', 'Cancelled. The entry stays visible, crossed out, in your day.'), 'undo');
  }
  function payOptions(name, withCredit, def) {
    def = def || 'cash';
    return '<fieldset class="inv-choices inline"><legend>' + t('Payé comment ?', 'Paid how?') + '</legend>' + (withCredit ? PAY_OUT.concat(['credit']) : PAY_OUT).map(function (k) {
      return '<label class="inv-choice"><input type="radio" name="' + name + '" value="' + k + '"' + (k === def ? ' checked' : '') + '><span>' + t(PAY[k].fr, PAY[k].en) + '</span></label>';
    }).join('') + '</fieldset>';
  }
  // Les espèces qui sortent ne peuvent pas dépasser ce qu'il y a dans la caisse
  function cashShort(amount, pay) {
    if (pay !== 'cash') return '';
    var d = todayStats().drawer;
    if (amount <= d) return '';
    return th('La caisse ne contient que ' + amt(Math.max(0, d)) + ' en espèces. Si vous payez par téléphone, choisissez Airtel Money ou Moov Money.',
      'The till only holds ' + amt(Math.max(0, d)) + ' in cash. If you pay by phone, choose Airtel Money or Moov Money.');
  }
  function modalPay(name) { var r = modal.querySelector('[name="' + name + '"]:checked'); return r ? r.value : 'cash'; }
  function amountField(name, value) {
    return '<label class="inv-field"><span>' + t('Montant (FCFA)', 'Amount (FCFA)') + '</span><input class="inv-input" type="number" name="' + name + '" min="25" max="50000000" step="25" inputmode="numeric" value="' + value + '"></label>';
  }
  function readAmount(name) { return parseInt(modal.querySelector('[name="' + name + '"]').value, 10); }
  function checkAmount(name, max) {
    var v = readAmount(name);
    if (!(v >= 25)) return t('Indiquez un montant (25 FCFA au moins).', 'Enter an amount (at least 25 FCFA).');
    if (max && v > max) return th('Le montant dépasse ce qui reste : ' + amt(max) + '.', 'The amount is more than what is left: ' + amt(max) + '.');
    return '';
  }
  function openCreditPay(id) {
    var c = state.credits.filter(function (x) { return x.id === id; })[0];
    if (!c) return;
    openModal({
      title: th(esc(c.name) + ' a payé', esc(c.name) + ' paid'),
      confirm: t('Enregistrer le paiement', 'Save the payment'),
      body: '<p>' + th('Il reste ' + amt(leftC(c)) + ' à récupérer. Un paiement en plusieurs fois, c\'est possible.', amt(leftC(c)) + ' left to collect. Paying in several times is fine.') + '</p>' + amountField('cp-amount', leftC(c)) + payOptions('cp-pay'),
      check: function () { return checkAmount('cp-amount', leftC(c)); },
      done: function () {
        var v = readAmount('cp-amount');
        var pay = modal.querySelector('[name="cp-pay"]:checked').value;
        var e = addEntry({ kind: 'rembours', amount: v, pay: pay, ref: c.id, who: c.name });
        c.paid += v;
        c.payments.push({ amount: v, at: e.at, pay: pay });
        state.recovered += v;
        if (leftC(c) <= 0) {
          var onTime = lateDays(c.due) === 0;
          if (onTime) state.credHist.onTime++; else state.credHist.late++;
          state.settled.unshift({ name: c.name, total: c.total, when: daysAgo(0), onTime: onTime });
          state.credits = state.credits.filter(function (x) { return x !== c; });
          toast(th(esc(c.name) + ' a tout remboursé' + (onTime ? ', à temps. Bravo !' : '.'), esc(c.name) + ' repaid everything' + (onTime ? ', on time. Great!' : '.')));
        } else {
          toast(th('Paiement de ' + amt(v) + ' noté. Il reste ' + amt(leftC(c)) + '.', 'Payment of ' + amt(v) + ' recorded. ' + amt(leftC(c)) + ' left.'));
        }
        rerender();
      }
    });
  }
  function reminderText(c, en) {
    var shop = en ? M.nameEn : M.nameFr;
    var what = c.what ? (en ? c.what[1] : c.what[0]) : '';
    return en ? 'Hello ' + c.name + ', this is ' + shop + '. A friendly reminder: ' + fcfa(leftC(c), true) + ' is still to be paid for your purchases (' + what + '). You can pay in cash or by Airtel Money / Moov Money. Thank you and have a good day!'
              : 'Bonjour ' + c.name + ', c\'est ' + shop + '. Petit rappel : il reste ' + fcfa(leftC(c)) + ' à régler pour vos achats (' + what + '). Vous pouvez payer en espèces ou par Airtel Money / Moov Money. Merci et bonne journée !';
  }
  function openReminder(id) {
    var c = state.credits.filter(function (x) { return x.id === id; })[0];
    if (!c) return;
    openModal({
      title: th('Rappel à ' + esc(c.name), 'Reminder to ' + esc(c.name)),
      confirm: t('Envoyer sur WhatsApp', 'Send on WhatsApp'),
      body: '<div class="biz-msg"><p class="biz-msg-head">' + ic('chat', 16, 2) + t('Message proposé', 'Suggested message') + ' <em>(' + t('démo : rien n\'est envoyé', 'demo: nothing is sent') + ')</em></p>' +
        '<p class="biz-bubble">' + t(reminderText(c), reminderText(c, true)) + '</p></div><p class="inv-meta">' + t('Un message court et poli marche mieux qu\'une relance sèche.', 'A short, polite message works better than a blunt one.') + '</p>',
      done: function () {
        c.reminded = daysAgo(0);
        toast(th('Démo : rappel prêt pour ' + esc(c.name) + '. En version réelle, WhatsApp s\'ouvre avec ce message.', 'Demo: reminder ready for ' + esc(c.name) + '. In the live version, WhatsApp opens with this message.'), 'chat');
      }
    });
  }
  function openSupplierPay(id) {
    var f = state.suppliers.filter(function (x) { return x.id === id; })[0];
    if (!f) return;
    openModal({
      title: th('Payer ' + esc(f.name), 'Pay ' + esc(f.name)),
      confirm: t('Enregistrer le paiement', 'Save the payment'),
      body: '<p>' + th('Vous devez ' + amt(leftC(f)) + '.', 'You owe ' + amt(leftC(f)) + '.') + '</p>' + amountField('fp-amount', leftC(f)) + payOptions('fp-pay') +
        '<label class="inv-choice"><input type="checkbox" name="fp-confirm" value="1" checked><span>' + t('Demander au fournisseur de confirmer le paiement (lien WhatsApp)', 'Ask the supplier to confirm the payment (WhatsApp link)') + '</span></label>',
      check: function () { return checkAmount('fp-amount', leftC(f)) || cashShort(readAmount('fp-amount'), modalPay('fp-pay')); },
      done: function () {
        var v = readAmount('fp-amount');
        var pay = modal.querySelector('[name="fp-pay"]:checked').value;
        var ask = modal.querySelector('[name="fp-confirm"]').checked;
        addEntry({ kind: 'fournisseur', amount: v, pay: pay, ref: f.id, who: f.name });
        f.paid += v;
        state.conf.total++;
        var onTime = leftDays(f.due) >= 0;
        f.last = { amount: v, confirmed: false };
        if (leftC(f) <= 0) {
          if (onTime) state.supHist.onTime++; else state.supHist.late++;
          state.supPaid.unshift({ name: f.name, amount: f.total, when: daysAgo(0), onTime: onTime, confirmed: false });
        }
        if (ask) askSupplier(f);
        toast(th('Paiement de ' + amt(v) + ' noté.', 'Payment of ' + amt(v) + ' recorded.'));
        rerender();
      }
    });
  }
  function askSupplier(f) {
    if (!f.last) return;
    f.last.confirmed = 'sent';
    setTimeout(function () {
      f.last.confirmed = true;
      state.conf.yes++;
      if (state.supPaid[0] && state.supPaid[0].name === f.name) state.supPaid[0].confirmed = true;
      addNotif({ icon: 'registre', go: '#c-credits/fournisseurs', when: ['À l\'instant', 'Just now'], fr: f.name + ' a confirmé votre paiement de ' + fcfa(f.last.amount) + '.',
                 en: f.name + ' confirmed your payment of ' + fcfa(f.last.amount, true) + '.' });
      rerender();
    }, 5000);
  }
  function openRestock(id) {
    var p = findProduct(id);
    if (!p) return;
    var supOpts = state.suppliers.map(function (f) { return [f.id, f.name]; });
    openModal({
      title: th('J\'ai racheté : ' + esc(p.fr), 'I restocked: ' + esc(p.en)),
      confirm: t('Ajouter au stock', 'Add to stock'),
      body: '<p class="inv-meta">' + th(esc(p.lot[0]) + ' · ' + unitsHtml(p, p.per) + ' dedans', esc(p.lot[1]) + ' · ' + unitsHtml(p, p.per) + ' inside') + '</p>' +
        '<div class="biz-row"><label class="inv-field"><span>' + th('Nombre de ' + esc(plural(p.lotN[0], 2)), 'Number of ' + esc(plural(p.lotN[1], 2, true))) + '</span><input class="inv-input" type="number" name="rs-lots" min="1" max="1000" step="1" inputmode="numeric" value="1"></label>' +
        '<label class="inv-field"><span>' + th('Prix par ' + esc(p.lotN[0]) + ' (FCFA)', 'Price per ' + esc(p.lotN[1]) + ' (FCFA)') + '</span><input class="inv-input" type="number" name="rs-price" min="25" max="50000000" step="25" inputmode="numeric" value="' + p.buy + '"></label></div>' +
        payOptions('rs-pay', true) + '<label class="inv-field" data-rs-sup hidden><span>' + t('Chez quel fournisseur ?', 'Which supplier?') + '</span>' + selectEl('rs-sup', supOpts, supOpts.length ? supOpts[0][0] : '') + '</label>' +
        '<p class="inv-meta">' + t('Le stock augmente, et la dépense de marchandise est notée dans votre journée (ou dans ce que vous devez au fournisseur).', 'Stock goes up, and the goods expense is recorded in your day (or in what you owe the supplier).') + '</p>',
      opened: function (box) {
        box.querySelectorAll('[name="rs-pay"]').forEach(function (r) {
          r.addEventListener('change', function () { box.querySelector('[data-rs-sup]').hidden = box.querySelector('[name="rs-pay"]:checked').value !== 'credit'; });
        });
      },
      check: function () {
        var n = readAmount('rs-lots'), price = readAmount('rs-price');
        if (!(n >= 1)) return t('Indiquez combien vous en avez racheté.', 'Enter how many you bought.');
        if (!(price >= 25)) return t('Indiquez le prix d\'achat.', 'Enter the purchase price.');
        return cashShort(n * price, modalPay('rs-pay'));
      },
      done: function () {
        var n = readAmount('rs-lots'), price = readAmount('rs-price');
        var pay = modal.querySelector('[name="rs-pay"]:checked').value;
        var total = n * price;
        p.left += n * p.per;
        p.buy = price;
        if (pay === 'credit') {
          var f = state.suppliers.filter(function (x) { return x.id === modal.querySelector('[name="rs-sup"]').value; })[0];
          if (f) { f.total += total; if (leftDays(f.due) < 0) f.due = inDays(7); }
          toast(th('Stock mis à jour. ' + amt(total) + ' ajoutés à ce que vous devez à ' + esc(f ? f.name : '') + '.', 'Stock updated. ' + amt(total) + ' added to what you owe ' + esc(f ? f.name : '') + '.'));
        } else {
          addEntry({ kind: 'depense', amount: total, pay: pay, cat: 'marchandise', note: [n + ' × ' + p.lotN[0] + ' · ' + p.fr, n + ' × ' + p.lotN[1] + ' · ' + p.en] });
          toast(th('Stock mis à jour. Dépense de ' + amt(total) + ' notée.', 'Stock updated. Expense of ' + amt(total) + ' recorded.'));
        }
        rerender();
      }
    });
  }
  function openRecount(id) {
    var p = findProduct(id);
    if (!p) return;
    openModal({
      title: th('Corriger le stock : ' + esc(p.fr), 'Correct the stock: ' + esc(p.en)),
      confirm: t('Enregistrer', 'Save'),
      body: '<p>' + th('KAME compte ' + unitsHtml(p, p.left) + '. Combien en avez-vous vraiment ?', 'KAME counts ' + unitsHtml(p, p.left) + '. How many do you really have?') + '</p>' +
        '<label class="inv-field"><span>' + th('Nombre de ' + esc(plural(p.unit[0], 2)), 'Number of ' + esc(plural(p.unit[1], 2, true))) + '</span><input class="inv-input" type="number" name="rc-n" min="0" max="100000" step="1" inputmode="numeric" value="' + p.left + '"></label>',
      check: function () { var n = parseInt(modal.querySelector('[name="rc-n"]').value, 10); return n >= 0 ? '' : t('Indiquez un nombre.', 'Enter a number.'); },
      done: function () {
        var n = parseInt(modal.querySelector('[name="rc-n"]').value, 10);
        var diff = n - p.left;
        p.left = n;
        toast(diff < 0 ? th('Stock corrigé : ' + unitsHtml(p, -diff) + ' de moins que prévu (perte, vol ou erreur).', 'Stock corrected: ' + unitsHtml(p, -diff) + ' fewer than expected (loss, theft or mistake).')
                       : t('Stock corrigé.', 'Stock corrected.'), diff < 0 ? 'alert' : 'ok');
        rerender();
      }
    });
  }
  function openCloseDay() {
    var s = todayStats();
    var expected = s.drawer;
    openModal({
      title: t('Fermer ma journée', 'Close my day'),
      confirm: t('Fermer la journée', 'Close the day'),
      body: '<div class="com-close-sum"><p>' + th('Espèces attendues dans la caisse : <strong>' + amt(expected) + '</strong>', 'Cash expected in the till: <strong>' + amt(expected) + '</strong>') + '</p>' +
        '<p class="inv-meta">' + th('Fond de caisse ' + amt(state.day.float) + ' + ventes et remboursements en espèces ' + amt(s.cashIn) + ' − sorties en espèces ' + amt(s.cashOut),
          'Float ' + amt(state.day.float) + ' + cash sales and repayments ' + amt(s.cashIn) + ' − cash out ' + amt(s.cashOut)) + '</p>' +
        '<p class="inv-meta">' + th('Mobile Money du jour : ' + amt(s.momo) + '. Vérifiez dans votre application Airtel Money ou Moov Money.', 'Today\'s Mobile Money: ' + amt(s.momo) + '. Check in your Airtel Money or Moov Money app.') + '</p></div>' +
        '<label class="inv-field"><span>' + t('Combien avez-vous compté dans la caisse ? (FCFA)', 'How much did you count in the till? (FCFA)') + '</span><input class="inv-input" type="number" name="cd-count" min="0" max="100000000" step="5" inputmode="numeric"></label>' +
        (s.profit > 0 ? '<label class="inv-choice"><input type="checkbox" name="cd-save" value="1"><span>' + th('Mettre de côté 10 % du bénéfice estimé (' + amt(Math.round(s.profit / 10 / 50) * 50) + ') pour « ' + esc(state.goals[0].fr) + ' »',
          'Put aside 10% of the estimated profit (' + amt(Math.round(s.profit / 10 / 50) * 50) + ') for "' + esc(state.goals[0].en) + '"') + '</span></label>' : ''),
      check: function () { var v = parseInt(modal.querySelector('[name="cd-count"]').value, 10); return v >= 0 ? '' : t('Indiquez combien vous avez compté.', 'Enter how much you counted.'); },
      done: function () {
        var counted = parseInt(modal.querySelector('[name="cd-count"]').value, 10);
        var save = modal.querySelector('[name="cd-save"]');
        if (save && save.checked) {
          var g = state.goals[0], part = Math.round(s.profit / 10 / 50) * 50;
          if (part > 0) { addEntry({ kind: 'epargne', amount: part, pay: 'cash', goalFr: g.fr, goalEn: g.en }); g.saved += part; state.savedThisMonth++; }
        }
        var d = state.day;
        d.expected = todayStats().drawer;
        d.counted = counted;
        d.closed = true;
        d.closedAt = new Date();
        var diff = counted - d.expected;
        toast(Math.abs(diff) < 25 ? t('Journée fermée. Le compte est bon, bravo !', 'Day closed. The count is right, well done!')
          : (diff < 0 ? th('Journée fermée. Il manque ' + amt(-diff) + ' : vérifiez les ventes non notées ou la monnaie rendue.', 'Day closed. ' + amt(-diff) + ' missing: check unrecorded sales or change given.')
                      : th('Journée fermée. Il y a ' + amt(diff) + ' en plus : une vente oubliée ?', 'Day closed. ' + amt(diff) + ' extra: a forgotten sale?')), Math.abs(diff) < 25 ? 'ok' : 'info');
        rerender();
      }
    });
  }
  function openSaveGoal(id) {
    var g = state.goals.filter(function (x) { return x.id === id; })[0];
    if (!g) return;
    openModal({
      title: th('Mettre de côté : ' + esc(g.fr), 'Put aside: ' + esc(g.en)),
      confirm: t('Enregistrer', 'Save'),
      body: '<p>' + th('Il manque ' + amt(Math.max(0, g.target - g.saved)) + ' pour atteindre l\'objectif.', amt(Math.max(0, g.target - g.saved)) + ' left to reach the goal.') + '</p>' + amountField('sg-amount', 2000) +
        '<fieldset class="inv-choices inline"><legend>' + t('L\'argent vient de', 'The money comes from') + '</legend>' + PAY_OUT.map(function (k) {
          return '<label class="inv-choice"><input type="radio" name="sg-pay" value="' + k + '"' + (k === 'airtel' ? ' checked' : '') + '><span>' + t(k === 'cash' ? 'La caisse' : PAY[k].fr, k === 'cash' ? 'The till' : PAY[k].en) + '</span></label>';
        }).join('') + '</fieldset><p class="inv-meta">' + t('L\'argent reste chez vous (compte Mobile Money, microfinance, tontine). KAME note seulement.', 'The money stays with you (Mobile Money account, microfinance, tontine). KAME only records it.') + '</p>',
      check: function () { return checkAmount('sg-amount') || cashShort(readAmount('sg-amount'), modalPay('sg-pay')); },
      done: function () {
        var v = readAmount('sg-amount');
        addEntry({ kind: 'epargne', amount: v, pay: modal.querySelector('[name="sg-pay"]:checked').value, goalFr: g.fr, goalEn: g.en });
        g.saved += v;
        state.savedThisMonth++;
        toast(g.saved >= g.target ? th('Objectif « ' + esc(g.fr) + ' » atteint. Bravo !', 'Goal "' + esc(g.en) + '" reached. Well done!') : th(amt(v) + ' mis de côté.', amt(v) + ' put aside.'));
        rerender();
      }
    });
  }
  function openTontinePay() {
    var tn = state.tontine;
    openModal({
      title: t('Cotisation de la tontine', 'Tontine contribution'),
      confirm: t('J\'ai cotisé', 'I paid'),
      body: '<p>' + th('Cotisation de la semaine : <strong>' + amt(tn.amount) + '</strong>.', 'This week\'s contribution: <strong>' + amt(tn.amount) + '</strong>.') + '</p>' + payOptions('tp-pay') +
        '<p class="inv-meta">' + t('Vous donnez l\'argent à la tontine comme d\'habitude : KAME note seulement que vous avez cotisé à temps.', 'You give the money to the tontine as usual: KAME only records that you paid on time.') + '</p>',
      check: function () { return cashShort(tn.amount, modalPay('tp-pay')); },
      done: function () {
        addEntry({ kind: 'epargne', amount: tn.amount, pay: modalPay('tp-pay'), goalFr: 'Tontine', goalEn: 'Tontine' });
        tn.paid = true;
        tn.hist = tn.hist.slice(1).concat([1]);
        toast(th('Cotisation de ' + amt(tn.amount) + ' notée, à temps.', 'Contribution of ' + amt(tn.amount) + ' recorded, on time.'), 'coins');
        rerender();
      }
    });
  }
  function openSendDossier(offerId) {
    var o = OFFERS.filter(function (x) { return x.id === offerId; })[0] || OFFERS[0];
    openModal({
      title: t('Envoyer mon dossier', 'Send my file'),
      confirm: t('Envoyer mon dossier', 'Send my file'),
      wide: true,
      body: '<p><strong>' + t(o.fr, o.en) + '</strong> · ' + th(amt(o.minA) + ' à ' + amt(o.maxA), amt(o.minA) + ' to ' + amt(o.maxA)) + '</p><div class="biz-row">' + amountField('sd-amount', Math.min(o.maxA, Math.max(o.minA, 300000))) +
        '<label class="inv-field"><span>' + t('Durée', 'Term') + '</span>' + selectEl('sd-months', [['3', '3 mois', '3 months'], ['6', '6 mois', '6 months'], ['12', '12 mois', '12 months']], '6') + '</label></div>' +
        '<fieldset class="inv-choices"><legend>' + t('Ce qui sera partagé', 'What will be shared') + '</legend>' +
        '<label class="inv-choice"><input type="checkbox" checked disabled><span>' + t('Mon identité vérifiée (KAME ID)', 'My verified identity (KAME ID)') + '</span></label>' +
        '<label class="inv-choice"><input type="checkbox" checked disabled><span>' + t('Mon KAME Score et ce qui le compose', 'My KAME Score and what it is made of') + '</span></label>' +
        '<label class="inv-choice"><input type="checkbox" checked disabled><span>' + t('Le résumé de mes ventes (fourchette par mois, régularité)', 'My sales summary (monthly range, regularity)') + '</span></label>' +
        '<label class="inv-choice"><input type="checkbox" name="sd-papers" value="1" checked><span>' + t('Mes papiers marqués « Dans mon dossier de financement »', 'My papers marked "In my funding file"') + '</span></label></fieldset>' +
        '<p class="com-note">' + ic('lock', 16, 2) + '<span>' + t('Jamais partagé : les noms et numéros de vos clients, le détail de chaque vente, l\'argent pris pour la maison.',
          'Never shared: your customers\' names and numbers, the details of each sale, the money taken for home.') + '</span></p>' +
        '<label class="inv-choice"><input type="checkbox" name="sd-ok" value="1"><span>' + t('J\'accepte que KAME transmette ces informations à ce partenaire agréé.', 'I agree that KAME sends this information to this licensed partner.') + '</span></label>',
      check: function () {
        var v = readAmount('sd-amount');
        if (!(v >= o.minA && v <= o.maxA)) return th('Choisissez un montant entre ' + amt(o.minA) + ' et ' + amt(o.maxA) + '.', 'Choose an amount between ' + amt(o.minA) + ' and ' + amt(o.maxA) + '.');
        if (!modal.querySelector('[name="sd-ok"]').checked) return t('Cochez la case d\'accord pour envoyer votre dossier.', 'Tick the consent box to send your file.');
        return '';
      },
      done: function () {
        var d = state.dossier;
        d.status = 'sent'; d.offer = o.id; d.amount = readAmount('sd-amount'); d.months = parseInt(modal.querySelector('[name="sd-months"]').value, 10) || 6;
        state.funders.unshift({ fr: o.fr + ' · partenaire agréé (exemple)', en: o.en + ' · licensed partner (example)', amount: d.amount, status: 'asked' });
        toast(t('Dossier envoyé, avec votre accord. Le partenaire l\'étudie.', 'File sent, with your consent. The partner is reviewing it.'), 'send');
        rerender();
        setTimeout(function () {
          d.status = 'question';
          state.lreqs.unshift({ id: nid('q'), fr: 'Relevés Airtel Money des 3 derniers mois', en: 'Airtel Money statements for the last 3 months', noteFr: 'Pour confirmer vos ventes en Mobile Money.',
                                noteEn: 'To confirm your Mobile Money sales.', status: 'attente' });
          addNotif({ icon: 'file', go: '#c-financement', when: ['À l\'instant', 'Just now'], fr: 'Le partenaire a une question sur votre dossier : relevés Airtel Money.', en: 'The partner has a question about your file: Airtel Money statements.' });
          rerender();
        }, 6000);
      }
    });
  }
  function openLreqAnswer(id) {
    var q = state.lreqs.filter(function (x) { return x.id === id; })[0];
    if (!q) return;
    openModal({
      title: t('Envoyer : ', 'Send: ') + t(q.fr, q.en),
      confirm: t('Envoyer le document', 'Send the document'),
      body: '<p>' + t('KAME vérifie le document avant de le montrer au partenaire. Démonstration : le fichier reste sur votre appareil.', 'KAME checks the document before showing it to the partner. Demo: the file stays on your device.') + '</p>' +
        '<label class="inv-field"><span>' + t('Document', 'Document') + '</span><input class="inv-input" type="file" name="lq-file" accept=".pdf,image/*"></label>',
      check: function (box) {
        var f = box.querySelector('[name="lq-file"]');
        if (!f.files || !f.files[0]) return t('Choisissez le document à envoyer.', 'Choose the document to send.');
        if (f.files[0].size > 20 * 1024 * 1024) return t('Le fichier dépasse 20 Mo.', 'The file is over 20 MB.');
        return '';
      },
      done: function () {
        q.status = 'recue';
        state.dossier.status = 'study';
        toast(t('Document envoyé. Le partenaire poursuit l\'étude.', 'Document sent. The partner continues the review.'));
        rerender();
        setTimeout(function () {
          state.dossier.status = 'answer';
          addNotif({ icon: 'target', go: '#c-financement', when: ['À l\'instant', 'Just now'], fr: 'Bonne nouvelle : le partenaire vous propose un rendez-vous pour finaliser votre microcrédit.',
                     en: 'Good news: the partner offers you a meeting to finalise your microloan.' });
          rerender();
        }, 6000);
      }
    });
  }
  function openLreqDecline(id) {
    var q = state.lreqs.filter(function (x) { return x.id === id; })[0];
    if (!q) return;
    openModal({
      title: t('Refuser : ', 'Decline: ') + t(q.fr, q.en),
      confirm: t('Refuser la demande', 'Decline the request'),
      body: '<p>' + t('Expliquez pourquoi : le partenaire verra votre motif.', 'Explain why: the partner will see your reason.') + '</p><label class="inv-field"><span>' + t('Votre motif', 'Your reason') +
        '</span><textarea class="inv-input" name="lq-reason" rows="3" maxlength="300"></textarea></label>',
      check: function (box) { return box.querySelector('[name="lq-reason"]').value.trim().length < 10 ? t('Écrivez une courte phrase (10 caractères au moins).', 'Write a short sentence (at least 10 characters).') : ''; },
      done: function () { q.status = 'refusee'; state.dossier.status = 'study'; toast(t('Motif envoyé au partenaire.', 'Reason sent to the partner.')); rerender(); }
    });
  }
  function openPreviewDossier() {
    var sp = scoreParts();
    var avg = state.hist.slice(0, 30).reduce(function (s, h) { return s + h.sales; }, 0);
    var low = Math.floor(avg / 250000) * 250000, high = low + 250000;
    openModal({
      title: t('Ce que voit le partenaire', 'What the partner sees'),
      confirm: t('Fermer', 'Close'),
      noCancel: true,
      body: '<dl class="com-dossier"><div><dt>' + t('Commerce', 'Business') + '</dt><dd>' + nameHtml() + ' · ' + esc(M.city) + '</dd></div>' +
        '<div><dt>' + t('Activité depuis', 'In business since') + '</dt><dd>' + M.since + '</dd></div><div><dt>' + t('Identité', 'Identity') + '</dt><dd>' + t('Vérifiée par KAME', 'Verified by KAME') + '</dd></div>' +
        '<div><dt>' + t('Ventes par mois', 'Monthly sales') + '</dt><dd>' + th(money(low) + ' – ' + money(high), money(low) + ' – ' + money(high)) + '</dd></div>' +
        '<div><dt>' + t('Régularité', 'Regularity') + '</dt><dd>' + th(sp.recDays + ' jours notés sur 30', sp.recDays + ' days recorded out of 30') + '</dd></div>' +
        '<div><dt>KAME Score</dt><dd>' + sp.score + '/100 ' + lvChip(sp.score) + '</dd></div>' +
        '<div><dt>' + t('Crédits récupérés à temps', 'Credit recovered on time') + '</dt><dd>' + sp.list[1].pct + ' %</dd></div><div><dt>' + t('Fournisseurs payés à temps', 'Suppliers paid on time') + '</dt><dd>' + sp.list[2].pct + ' %</dd></div></dl>' +
        '<p class="com-note">' + ic('lock', 16, 2) + '<span>' + t('Pas de noms de clients, pas de détail des ventes, pas d\'argent de la maison.', 'No customer names, no sale details, no household money.') + '</span></p>'
    });
  }
  function openPayLoan() {
    var l = state.loan;
    if (!l || l.paid >= l.count) return;
    openModal({
      title: t('Échéance du microcrédit', 'Microloan instalment'),
      confirm: t('Enregistrer', 'Save'),
      body: '<p>' + th('Échéance ' + (l.paid + 1) + ' sur ' + l.count + ' : <strong>' + amt(l.inst) + '</strong>, à payer ' + whenFr(Math.max(0, leftDays(l.next))) + '.',
        'Instalment ' + (l.paid + 1) + ' of ' + l.count + ': <strong>' + amt(l.inst) + '</strong>, due ' + whenEn(Math.max(0, leftDays(l.next))) + '.') + '</p>' + payOptions('pl-pay', false, 'airtel') +
        '<p class="inv-meta">' + t('Vous payez directement le partenaire (agence ou Mobile Money). KAME note le paiement pour votre KAME Score.', 'You pay the partner directly (branch or Mobile Money). KAME records the payment for your KAME Score.') + '</p>',
      check: function () { return cashShort(l.inst, modalPay('pl-pay')); },
      done: function () {
        addEntry({ kind: 'pret', amount: l.inst, pay: modal.querySelector('[name="pl-pay"]:checked').value });
        l.paid++;
        l.next = fmtDate(new Date(l.next.ts + 30 * 86400000));
        state.supHist.onTime++;
        toast(l.paid >= l.count ? t('Dernière échéance payée : prêt remboursé. Bravo !', 'Last instalment paid: loan repaid. Well done!') : t('Échéance payée à temps. Votre KAME Score en tient compte.', 'Instalment paid on time. Your KAME Score takes it into account.'));
        rerender();
      }
    });
  }
  function openSalary() {
    openModal({
      title: t('Mon salaire', 'My salary'),
      confirm: t('Enregistrer', 'Save'),
      body: '<p>' + t('Combien voulez-vous prendre chaque semaine pour la maison ? Choisissez une somme que le commerce peut payer sans toucher au stock.',
        'How much do you want to take each week for home? Choose an amount the shop can pay without eating into stock.') + '</p>' + amountField('sa-amount', state.salary.amount),
      check: function () { return checkAmount('sa-amount'); },
      done: function () { state.salary.amount = readAmount('sa-amount'); toast(th('Salaire fixé à ' + amt(state.salary.amount) + ' par semaine.', 'Salary set to ' + amt(state.salary.amount) + ' a week.')); rerender(); }
    });
  }
  function openChangePin() {
    openModal({
      title: t('Changer mon code', 'Change my code'),
      confirm: t('Enregistrer', 'Save'),
      body: '<label class="inv-field"><span>' + t('Nouveau code (4 chiffres)', 'New code (4 digits)') + '</span><input class="inv-input" type="password" name="pin1" inputmode="numeric" maxlength="4" autocomplete="new-password"></label>' +
        '<label class="inv-field"><span>' + t('Encore une fois', 'Once more') + '</span><input class="inv-input" type="password" name="pin2" inputmode="numeric" maxlength="4" autocomplete="new-password"></label>' +
        '<p class="inv-meta">' + t('Évitez 0000, 1234 ou votre année de naissance.', 'Avoid 0000, 1234 or your year of birth.') + '</p>',
      check: function (box) {
        var a = box.querySelector('[name="pin1"]').value, b = box.querySelector('[name="pin2"]').value;
        if (!/^\d{4}$/.test(a)) return t('Le code doit avoir 4 chiffres.', 'The code must have 4 digits.');
        if (/^(\d)\1{3}$/.test(a) || a === '1234') return t('Ce code est trop facile à deviner.', 'This code is too easy to guess.');
        if (a !== b) return t('Les deux codes ne sont pas identiques.', 'The two codes do not match.');
        return '';
      },
      done: function () {
        state.activity.unshift({ icon: 'key', fr: 'Code à 4 chiffres changé.', en: '4-digit code changed.', when: ['À l\'instant', 'Just now'] });
        toast(t('Code changé (démonstration : rien n\'est enregistré).', 'Code changed (demo: nothing is stored).'), 'key');
        rerender();
      }
    });
  }
  function openBlockAll() {
    openModal({
      title: t('Bloquer les autres appareils', 'Block other devices'),
      confirm: t('Bloquer l\'accès', 'Block access'),
      body: '<p>' + t('Tous les appareils sauf celui-ci seront déconnectés. Il faudra votre mot de passe et votre code pour revenir.', 'All devices except this one will be logged out. Your password and code will be needed to come back.') + '</p>',
      done: function () {
        state.devices = state.devices.filter(function (d) { return d.me; });
        state.activity.unshift({ icon: 'lock', fr: 'Accès bloqué sur les autres appareils.', en: 'Access blocked on other devices.', when: ['À l\'instant', 'Just now'] });
        toast(t('Démo : les autres appareils sont déconnectés.', 'Demo: other devices are logged out.'), 'lock');
        rerender();
      }
    });
  }
  function selectCopy(text) {
    var ok = function () { toast(t('Copié.', 'Copied.'), 'copy'); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, function () { toast(text, 'info'); });
    else toast(text, 'info');
  }
  function shopListText() {
    var low = state.stock.filter(isLow);
    var en = U.isEn();
    return (en ? 'Order from ' + M.nameEn + ':\n' : 'Commande de ' + M.nameFr + ' :\n') + low.map(function (p) {
      var lots = Math.max(1, Math.ceil((p.min * 2 - p.left) / p.per));
      return '- ' + lots + ' x ' + (en ? p.lot[1] + ' ' + p.en : p.lot[0] + ' ' + p.fr);
    }).join('\n');
  }

  // ------------------------------------------------------------ formulaires
  function formData(form) {
    var o = {};
    new FormData(form).forEach(function (v, k) { o[k] = typeof v === 'string' ? v.trim() : v; });
    return o;
  }
  var FORMS = {
    'open-day': function (f, d) {
      var v = parseInt(d.float, 10);
      if (!(v >= 0)) return t('Indiquez le fond de caisse (0 si la caisse est vide).', 'Enter the float (0 if the till is empty).');
      state.day.open = true; state.day.closed = false; state.day.float = v; state.day.openedAt = new Date();
      toast(t('Journée ouverte. Bonne vente !', 'Day open. Good selling!'), 'sun');
      rerender({ reset: 'open-day' });
    },
    'credit-new': function (f, d) {
      var v = parseInt(d.amount, 10);
      if (!(v >= 25)) return t('Indiquez le montant (25 FCFA au moins).', 'Enter the amount (at least 25 FCFA).');
      var c = state.credits.filter(function (x) { return plain(x.name) === plain(d.name); })[0];
      if (c) { c.total += v; } else {
        c = { id: nid('k'), name: d.name.slice(0, 60), phone: maskPhone(d.phone), what: [d.what || 'Achats du ' + daysAgo(0).fr, d.what || 'Purchases on ' + daysAgo(0).en], total: v, paid: 0,
              since: daysAgo(0), due: inDays(parseInt(d.due, 10) || 7), confirmed: 'no', verified: false, payments: [] };
        state.credits.push(c);
        state.conf.total++;
      }
      if (d.confirm && c.confirmed !== 'yes') askConfirm(c);
      toast(th('Crédit de ' + amt(v) + ' ajouté pour ' + esc(c.name) + (d.confirm ? '. Lien de confirmation prêt (démo).' : '.'), 'Credit of ' + amt(v) + ' added for ' + esc(c.name) + (d.confirm ? '. Confirmation link ready (demo).' : '.')));
      rerender({ reset: 'credit-new' });
    },
    'supplier-new': function (f, d) {
      var v = parseInt(d.amount, 10);
      if (!(v >= 25)) return t('Indiquez le montant (25 FCFA au moins).', 'Enter the amount (at least 25 FCFA).');
      state.suppliers.push({ id: nid('f'), name: d.name.slice(0, 60), what: [d.what || 'Marchandise', d.what || 'Goods'], total: v, paid: 0, since: daysAgo(0), due: inDays(parseInt(d.due, 10) || 7), last: null });
      toast(th('Dette de ' + amt(v) + ' notée chez ' + esc(d.name) + '.', 'Debt of ' + amt(v) + ' recorded with ' + esc(d.name) + '.'));
      rerender({ reset: 'supplier-new' });
    },
    'product-new': function (f, d) {
      var per = parseInt(d.per, 10), buy = parseInt(d.buy, 10), sell = parseInt(d.sell, 10);
      if (!(per >= 1 && buy >= 25 && sell >= 5)) return t('Remplissez le nombre d\'unités, le prix d\'achat et le prix de vente.', 'Fill in the number of units, the purchase price and the selling price.');
      var lot = LOTS[d.lot] || LOTS.carton, unit = UNITS[d.unit] || UNITS.unite;
      var p = { id: nid('p'), fr: d.name.slice(0, 40), en: d.name.slice(0, 40), lot: [lot[0] + ' de ' + per, lot[1] + ' of ' + per], lotN: [lot[0], lot[1]], per: per, buy: buy,
                unit: [unit[0], unit[1]], sell: sell, left: per, min: Math.max(1, Math.round(per / 4)) };
      state.stock.push(p);
      state.vitrine.show[p.id] = true;
      state.calc = null;
      toast(th(esc(p.fr) + ' ajouté au stock (1 ' + esc(lot[0]) + ').', esc(p.en) + ' added to stock (1 ' + esc(lot[1]) + ').'));
      rerender({ reset: 'product-new' });
    },
    receipt: function (f, d) {
      var v = parseInt(d.amount, 10);
      if (!(v >= 25)) return t('Indiquez un montant d\'au moins 25 FCFA.', 'Enter an amount of at least 25 FCFA.');
      return issueReceipt({ client: d.client.slice(0, 60), object: d.object.slice(0, 80), amount: v, pay: d.pay }).then(function (r) {
        rerender({ reset: 'receipt' });
        toast(t('Reçu ' + r.no + ' émis et certifié par KAME Registre.', 'Receipt ' + r.no + ' issued and certified by KAME Registre.'), 'receipt');
      });
    },
    code: function (f, d) {
      var code = d.code.toUpperCase().replace(/[^0-9A-F]/g, '');
      var r = state.receipts.filter(function (x) { return x.code === code; })[0];
      state.verifyResult = r ? { ok: true, label: esc(r.no) + ' · ' + amt(r.amount) + ' · ' + esc(r.client) + ' · ' + dateText(r.date) } : { ok: false };
      rerender();
    },
    'goal-new': function (f, d) {
      var v = parseInt(d.target, 10);
      if (!(v >= 1000)) return t('Indiquez un montant d\'au moins 1 000 FCFA.', 'Enter an amount of at least 1,000 FCFA.');
      state.goals.push({ id: nid('g'), fr: d.name.slice(0, 40), en: d.name.slice(0, 40), target: v, saved: 0, icon: 'target' });
      toast(t('Objectif créé.', 'Goal created.'));
      rerender({ reset: 'goal-new' });
    },
    vitrine: function (f, d) {
      var v = state.vitrine;
      v.desc = d.desc.slice(0, 300); v.quartier = d.quartier.slice(0, 40); v.hours = d.hours.slice(0, 60); v.wa = d.wa.slice(0, 20); v.delivery = !!d.delivery;
      toast(t('Vitrine enregistrée.', 'Window saved.'));
      rerender({ reset: 'vitrine' });
    },
    'helper-new': function (f, d) {
      var rel = RELS.filter(function (x) { return x[0] === d.rel; })[0] || RELS[5];
      var code = String(1000 + Math.floor(Math.random() * 9000));
      var h = { id: nid('h'), name: d.name.slice(0, 40), rel: [rel[1], rel[2]], role: HELPER_ROLES[d.role] ? d.role : 'vendeur' };
      state.helpers.push(h);
      state.lastHelperCode = { name: h.name, code: code };
      state.activity.unshift({ icon: 'users', fr: h.name + ' a été ajouté comme aide.', en: h.name + ' was added as a helper.', when: ['À l\'instant', 'Just now'] });
      toast(th(esc(h.name) + ' peut maintenant noter les ventes avec son propre code.', esc(h.name) + ' can now record sales with their own code.'), 'users');
      rerender({ reset: 'helper-new' });
    },
    loss: function (f, d) {
      var p = findProduct(d.product), q = parseInt(d.qty, 10);
      if (!p || !(q >= 1)) return t('Indiquez la quantité abîmée.', 'Enter the quantity spoiled.');
      q = Math.min(q, p.left);
      var value = Math.round(q * p.buy / p.per);
      p.left -= q;
      state.agroLoss.unshift({ id: p.id, qty: q, value: value });
      toast(th('Perte notée : ' + amt(value) + '.', 'Loss recorded: ' + amt(value) + '.'), 'alert');
      rerender({ reset: 'loss' });
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

  // ------------------------------------------------------------ clavier du montant
  function press(k) {
    var pad = state.pad;
    var s = String(pad.value || '');
    if (k === 'back') s = s.slice(0, -1);
    else if (k === 'clear') { s = ''; pad.picks = {}; }
    else if (/^\d+$/.test(k)) s = (s === '0' ? '' : s) + k;
    var v = parseInt(s || '0', 10);
    if (v > 10000000) return;
    pad.value = v;
    var out = shell.querySelector('[data-pad-out]');
    if (out && k !== 'clear') { out.textContent = num(v); return; }
    rerender();
  }
  document.addEventListener('keydown', function (e) {
    if (!active || shell.hidden || currentView !== 'c-vendre' || !modal.hidden) return;
    var tg = e.target;
    if (tg && (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA' || tg.tagName === 'SELECT')) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (/^\d$/.test(e.key)) { e.preventDefault(); press(e.key); }
    else if (e.key === 'Backspace') { e.preventDefault(); press('back'); }
    else if (e.key === 'Enter' && !(tg && tg.tagName === 'BUTTON')) { e.preventDefault(); saveFromPad(); }
  });

  // ------------------------------------------------------------ clics
  shell.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b || !shell.contains(b)) return;
    var pad = state.pad;
    if (b.hasAttribute('data-key')) { press(b.getAttribute('data-key')); return; }
    if (b.hasAttribute('data-add')) { pad.value = Math.min(10000000, (pad.value || 0) + parseInt(b.getAttribute('data-add'), 10)); var o = shell.querySelector('[data-pad-out]'); if (o) o.textContent = num(pad.value); return; }
    if (b.hasAttribute('data-pick')) {
      var p = findProduct(b.getAttribute('data-pick'));
      if (!p) return;
      pad.picks[p.id] = (pad.picks[p.id] || 0) + 1;
      pad.value = Math.min(10000000, (pad.value || 0) + p.sell);
      rerender();
      return;
    }
    if (b.hasAttribute('data-clear-picks')) {
      Object.keys(pad.picks).forEach(function (id) { var q = findProduct(id); if (q) pad.value = Math.max(0, pad.value - q.sell * pad.picks[id]); });
      pad.picks = {};
      rerender();
      return;
    }
    if (b.hasAttribute('data-pay')) { pad.pay = b.getAttribute('data-pay'); rerender(); return; }
    if (b.hasAttribute('data-cat')) { pad.cat = b.getAttribute('data-cat'); rerender(); return; }
    if (b.hasAttribute('data-mecat')) { pad.meCat = b.getAttribute('data-mecat'); rerender(); return; }
    if (b.hasAttribute('data-client-pick')) {
      var c0 = state.credits.filter(function (x) { return x.id === b.getAttribute('data-client-pick'); })[0];
      if (c0) { pad.client = c0.name; pad.phone = ''; }
      rerender();
      return;
    }
    if (b.hasAttribute('data-pad-receipt')) { pad.receipt = !pad.receipt; rerender(); return; }
    if (b.hasAttribute('data-pad-confirm')) { pad.confirm = !pad.confirm; rerender(); return; }
    if (b.hasAttribute('data-pad-save')) { saveFromPad(); return; }
    if (b.hasAttribute('data-undo')) { undo(b.getAttribute('data-undo')); return; }
    if (b.hasAttribute('data-discreet')) {
      state.discreet = !state.discreet;
      root.classList.toggle('com-discreet', state.discreet);
      rerender();
      toast(state.discreet ? t('Mode discret : les montants sont cachés.', 'Discreet mode: amounts are hidden.') : t('Les montants sont visibles.', 'Amounts are visible.'), state.discreet ? 'eyeoff' : 'eye');
      return;
    }
    if (b.hasAttribute('data-show-all')) { state.showAll = !state.showAll; rerender(); return; }
    if (b.hasAttribute('data-close-day')) { openCloseDay(); return; }
    if (b.hasAttribute('data-reopen-day')) { state.day.closed = false; state.day.closedAt = null; rerender(); toast(t('Journée rouverte.', 'Day reopened.'), 'undo'); return; }
    if (b.hasAttribute('data-cpay')) { openCreditPay(b.getAttribute('data-cpay')); return; }
    if (b.hasAttribute('data-remind')) { openReminder(b.getAttribute('data-remind')); return; }
    if (b.hasAttribute('data-confirm-debt')) {
      var c1 = state.credits.filter(function (x) { return x.id === b.getAttribute('data-confirm-debt'); })[0];
      if (c1) { askConfirm(c1); rerender(); toast(th('Démo : lien de confirmation prêt pour ' + esc(c1.name) + '.', 'Demo: confirmation link ready for ' + esc(c1.name) + '.'), 'send'); }
      return;
    }
    if (b.hasAttribute('data-verify-client')) {
      var c2 = state.credits.filter(function (x) { return x.id === b.getAttribute('data-verify-client'); })[0];
      if (!c2) return;
      c2.verified = 'sent';
      rerender();
      toast(th('Démo : lien KAME ID prêt pour ' + esc(c2.name) + '. Ses documents ne vous sont pas transmis.', 'Demo: KAME ID link ready for ' + esc(c2.name) + '. Their documents are not shared with you.'), 'id');
      setTimeout(function () {
        c2.verified = true;
        addNotif({ icon: 'id', go: '#c-credits', when: ['À l\'instant', 'Just now'], fr: c2.name + ' a confirmé son identité avec KAME ID.', en: c2.name + ' confirmed their identity with KAME ID.' });
        rerender();
      }, 6000);
      return;
    }
    if (b.hasAttribute('data-fpay')) { openSupplierPay(b.getAttribute('data-fpay')); return; }
    if (b.hasAttribute('data-fconfirm')) {
      var f0 = state.suppliers.filter(function (x) { return x.id === b.getAttribute('data-fconfirm'); })[0];
      if (f0) { askSupplier(f0); rerender(); toast(t('Démo : demande de confirmation envoyée au fournisseur.', 'Demo: confirmation request sent to the supplier.'), 'send'); }
      return;
    }
    if (b.hasAttribute('data-restock')) { openRestock(b.getAttribute('data-restock')); return; }
    if (b.hasAttribute('data-recount')) { openRecount(b.getAttribute('data-recount')); return; }
    if (b.hasAttribute('data-copy-list')) { selectCopy(shopListText()); return; }
    if (b.hasAttribute('data-send-list')) { toast(t('Démo : la liste part au grossiste sur WhatsApp en version réelle.', 'Demo: in the live version, the list goes to the wholesaler on WhatsApp.'), 'chat'); return; }
    if (b.hasAttribute('data-wa-receipt')) { toast(t('Démo : rien n\'est envoyé. En version réelle, le reçu part sur WhatsApp avec son code.', 'Demo: nothing is sent. In the live version, the receipt goes out on WhatsApp with its code.'), 'chat'); return; }
    if (b.hasAttribute('data-download')) { download(b.getAttribute('data-download')); return; }
    if (b.hasAttribute('data-preview-dossier')) { openPreviewDossier(); return; }
    if (b.hasAttribute('data-send-dossier')) { openSendDossier(b.getAttribute('data-send-dossier')); return; }
    if (b.hasAttribute('data-lreq-answer')) { openLreqAnswer(b.getAttribute('data-lreq-answer')); return; }
    if (b.hasAttribute('data-lreq-decline')) { openLreqDecline(b.getAttribute('data-lreq-decline')); return; }
    if (b.hasAttribute('data-pay-loan')) { openPayLoan(); return; }
    if (b.hasAttribute('data-salary')) { openSalary(); return; }
    if (b.hasAttribute('data-save-goal')) { openSaveGoal(b.getAttribute('data-save-goal')); return; }
    if (b.hasAttribute('data-tontine-pay')) { openTontinePay(); return; }
    if (b.hasAttribute('data-publish')) {
      var v = state.vitrine;
      var form = shell.querySelector('form[data-form="vitrine"]');
      var wa = form ? form.querySelector('[name="wa"]').value.trim() : v.wa;
      if (!v.published && wa.replace(/\D/g, '').length < 8) {
        toast(t('Ajoutez d\'abord votre numéro WhatsApp pour recevoir les commandes.', 'First add your WhatsApp number to receive orders.'), 'info');
        var w = form && form.querySelector('[name="wa"]');
        if (w) w.focus();
        return;
      }
      if (form) { var d0 = formData(form); v.desc = d0.desc.slice(0, 300); v.quartier = d0.quartier.slice(0, 40); v.hours = d0.hours.slice(0, 60); v.wa = d0.wa.slice(0, 20); v.delivery = !!d0.delivery; }
      v.published = !v.published;
      rerender({ reset: 'vitrine' });
      toast(v.published ? t('Démo : vitrine publiée. En version réelle, le lien est public.', 'Demo: window published. In the live version, the link is public.') : t('Vitrine retirée.', 'Window unpublished.'), v.published ? 'send' : 'eyeoff');
      return;
    }
    if (b.hasAttribute('data-copy')) { selectCopy(b.getAttribute('data-copy')); return; }
    if (b.hasAttribute('data-share-vitrine') || b.hasAttribute('data-vit-order')) {
      toast(t('Démo : en version réelle, WhatsApp s\'ouvre avec le lien de votre vitrine.', 'Demo: in the live version, WhatsApp opens with your window link.'), 'chat');
      return;
    }
    if (b.hasAttribute('data-change-pin')) { openChangePin(); return; }
    if (b.hasAttribute('data-block-all')) { openBlockAll(); return; }
    if (b.hasAttribute('data-logout-device')) {
      var id = b.getAttribute('data-logout-device');
      state.devices = state.devices.filter(function (d) { return d.id !== id; });
      rerender();
      toast(t('Appareil déconnecté.', 'Device logged out.'), 'lock');
      return;
    }
    if (b.hasAttribute('data-remove-helper')) {
      var hid = b.getAttribute('data-remove-helper');
      var h = state.helpers.filter(function (x) { return x.id === hid; })[0];
      state.helpers = state.helpers.filter(function (x) { return x.id !== hid; });
      if (state.lastHelperCode && h && state.lastHelperCode.name === h.name) state.lastHelperCode = null;
      rerender();
      if (h) toast(th(esc(h.name) + ' n\'a plus accès à votre espace.', esc(h.name) + ' no longer has access to your space.'));
      return;
    }
  });

  // Champs du clavier (nom du client…), calcul du stock, visibilité, fichiers
  shell.addEventListener('input', function (e) {
    var el = e.target;
    var k = el.getAttribute('data-pad-field');
    if (k) { state.pad[k] = el.value; return; }
    if (el.hasAttribute('data-calc')) {
      var f = el.form;
      state.calc = { name: f.querySelector('[name="name"]').value, lot: f.querySelector('[name="lot"]').value, per: f.querySelector('[name="per"]').value,
                     buy: f.querySelector('[name="buy"]').value, unit: f.querySelector('[name="unit"]').value, sell: f.querySelector('[name="sell"]').value };
      var out = f.querySelector('[data-calc-out]');
      if (out) out.innerHTML = calcText(state.calc);
    }
  });
  shell.addEventListener('change', function (e) {
    var el = e.target;
    if (el.getAttribute('data-pad-field') === 'due') { state.pad.due = el.value; return; }
    if (el.hasAttribute('data-calc')) { el.dispatchEvent(new Event('input', { bubbles: true })); return; }
    if (el.hasAttribute('data-vis-prod')) { state.vitrine.show[el.getAttribute('data-vis-prod')] = el.checked; rerender(); return; }
    if (el.hasAttribute('data-docvis')) {
      var d = state.docs.filter(function (x) { return x.id === el.getAttribute('data-docvis'); })[0];
      if (d) d.vis = el.value;
      toast(t('Visibilité mise à jour : ', 'Visibility updated: ') + t(DOC_VIS[el.value][0], DOC_VIS[el.value][1]).toLowerCase());
      return;
    }
    var kind = el.getAttribute('data-file');
    if (!kind || !el.files || !el.files[0]) return;
    var file = el.files[0];
    if (kind === 'logo') {
      if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > 2 * 1024 * 1024) { toast(t('Choisissez une image PNG, JPEG ou WebP de moins de 2 Mo.', 'Choose a PNG, JPEG or WebP image under 2 MB.'), 'info'); return; }
      var fr = new FileReader();
      fr.onload = function () { if (/^data:image\/(png|jpeg|webp);base64,/.test(fr.result)) { state.vitrine.logo = fr.result; rerender(); toast(t('Photo ajoutée à la vitrine.', 'Photo added to the window.')); } };
      fr.readAsDataURL(file);
      return;
    }
    if (file.size > 20 * 1024 * 1024) { toast(t('Le fichier dépasse 20 Mo.', 'The file is over 20 MB.'), 'info'); return; }
    if (kind.indexOf('paper:') === 0) {
      var x = state.papers.filter(function (y) { return y.id === kind.slice(6); })[0];
      if (!x) return;
      x.status = 'review';
      rerender();
      toast(t('Document reçu. KAME le vérifie.', 'Document received. KAME is checking it.'));
      setTimeout(function () {
        x.status = 'ok';
        x.until = inDays(365);
        state.docs.unshift({ id: nid('d'), fr: x.fr, en: x.en, vis: 'dossier', verified: true, added: daysAgo(0) });
        addNotif({ icon: 'check', go: '#c-papiers', when: ['À l\'instant', 'Just now'], fr: 'KAME a vérifié votre document : ' + x.fr.charAt(0).toLowerCase() + x.fr.slice(1) + '. Votre KAME Score monte.',
                   en: 'KAME verified your document: ' + x.en + '. Your KAME Score goes up.' });
        rerender();
      }, 5000);
      return;
    }
    if (kind === 'vault') {
      U.fileHash(file).catch(function () { return ''; }).then(function () {
        state.docs.unshift({ id: nid('d'), custom: file.name.slice(0, 80), vis: 'private', verified: false, added: daysAgo(0) });
        rerender();
        toast(t('Document ajouté, visible par vous seul pour l\'instant.', 'Document added, visible only to you for now.'));
      });
    }
  });

  // ------------------------------------------------------------ démarrage
  function start() {
    var info = (window.KAME_SPACE && window.KAME_SPACE.business) || {};
    var key = (info.name || '') + ':' + (info.agriculture ? 1 : 0) + ':' + (info.sector || '');
    if (!cache[key]) {
      M = build({ name: info.name, city: info.city, sector: info.sector, agriculture: info.agriculture });
      state = initState();
      state.unread = notifications().length;
      cache[key] = { M: M, state: state };
    } else {
      M = cache[key].M;
      state = cache[key].state;
    }
    active = true;
    currentView = '';
    root.classList.toggle('com-discreet', !!state.discreet);
    renderNav();
    U.setNotifier(notifier);
    route(false);
  }
  function stop() { active = false; root.classList.remove('com-discreet'); }
  window.addEventListener('hashchange', function () { if (active && !shell.hidden) route(true); });
  document.addEventListener('kame:merchant', function () { start(); });
  document.addEventListener('kame:business', stop);
  document.addEventListener('kame:investor', stop);
  // Langue changée : les textes calculés et les listes déroulantes sont redessinés
  new MutationObserver(function () { if (active && !shell.hidden) { renderNav(); rerender(); } }).observe(root, { attributes: true, attributeFilter: ['lang'] });
})();
