/* KAME GROUP : comptes membres avec Netlify Identity.
   Inscription par e-mail ou Google, validation par l'équipe (rôle donné dans Netlify),
   puis accès à l'espace du profil : investisseur, commerçant, entreprise ou partenaire. */
(function () {
  'use strict';

  var API = '/.netlify/identity';
  var STORE = 'kame-auth';
  var PENDING_PROFILE = 'kame-profil';
  var ROLES = {
    investisseur: { prefix: 'KG-INV', fr: 'Investisseur', en: 'Investor' },
    entreprise: { prefix: 'KG-ENT', fr: 'Entreprise', en: 'Business' },
    commercant: { prefix: 'KG-COM', fr: 'Commerçant', en: 'Merchant' },
    partenaire: { prefix: 'KG-PAR', fr: 'Partenaire', en: 'Partner' }
  };
  var ROLE_ORDER = ['investisseur', 'entreprise', 'commercant', 'partenaire'];
  // Espaces qui ouvrent le tableau de bord entreprise (business.js)
  var BUSINESS_ROLES = ['entreprise', 'commercant'];
  var SPACE_KEY = 'kame-space';
  var INVESTOR_VIEWS = ['accueil', 'annuaire', 'opportunites', 'portefeuille', 'demandes', 'score', 'data', 'registre', 'profil', 'entreprise'];
  var HASH_KEYS = ['confirmation_token', 'recovery_token', 'invite_token', 'access_token', 'error', 'email_change_token'];

  // ------------------------------------------------------------ outils
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function tx(fr, en) { return '<span class="t-fr">' + esc(fr) + '</span><span class="t-en" lang="en">' + esc(en) + '</span>'; }
  function svg(name, size) {
    var icons = window.KAME_ICONS || {};
    if (!icons[name]) return '';
    return '<svg aria-hidden="true" focusable="false" width="' + (size || 18) + '" height="' + (size || 18) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + icons[name] + '</svg>';
  }
  function lang() { return document.documentElement.lang === 'en' ? 'en' : 'fr'; }
  function enc(o) {
    return Object.keys(o).map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(o[k] == null ? '' : o[k]); }).join('&');
  }
  function store(key, value) { try { if (value == null) localStorage.removeItem(key); else localStorage.setItem(key, value); } catch (e) {} }
  function read(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }

  // ------------------------------------------------------------ session
  function load() { try { return JSON.parse(read(STORE)) || null; } catch (e) { return null; } }
  function save(t) {
    var s = { access_token: t.access_token, refresh_token: t.refresh_token,
              expires_at: Date.now() + (parseInt(t.expires_in, 10) || 3600) * 1000 };
    store(STORE, JSON.stringify(s));
    document.documentElement.classList.add('is-member');
    return s;
  }
  function clear() { store(STORE, null); document.documentElement.classList.remove('is-member'); }

  // ------------------------------------------------------------ API Netlify Identity
  function request(path, opts) {
    return fetch(API + path, opts || {}).then(function (r) {
      return r.text().then(function (txt) {
        var d = {};
        try { d = txt ? JSON.parse(txt) : {}; } catch (e) { d = { raw: txt }; }
        if (!r.ok) {
          var err = new Error(d.error_description || d.msg || d.error || ('HTTP ' + r.status));
          err.status = r.status;
          err.data = d;
          throw err;
        }
        return d;
      });
    });
  }
  function json(method, path, body, tok) {
    var h = { 'Content-Type': 'application/json' };
    if (tok) h.Authorization = 'Bearer ' + tok;
    return request(path, { method: method, headers: h, body: body ? JSON.stringify(body) : undefined });
  }
  function token(params) {
    return request('/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: enc(params) });
  }
  function validToken() {
    var s = load();
    if (!s || !s.access_token) return Promise.resolve(null);
    if (Date.now() < s.expires_at - 60000) return Promise.resolve(s.access_token);
    if (!s.refresh_token) { clear(); return Promise.resolve(null); }
    return token({ grant_type: 'refresh_token', refresh_token: s.refresh_token })
      .then(function (t) { return save(t).access_token; })
      .catch(function (e) { if (e.status) clear(); return null; });
  }
  function getUser() {
    return validToken().then(function (tok) {
      if (!tok) return null;
      return request('/user', { headers: { Authorization: 'Bearer ' + tok } }).catch(function (e) {
        if (e.status === 401 || e.status === 403) { clear(); return null; }
        throw e;
      });
    });
  }
  function updateUser(body) {
    return validToken().then(function (tok) {
      if (!tok) { var e = new Error('not logged in'); e.status = 401; throw e; }
      return json('PUT', '/user', body, tok);
    });
  }
  function login(email, password) { return token({ grant_type: 'password', username: email, password: password }).then(save); }
  function signup(email, password, data) { return json('POST', '/signup', { email: email, password: password, data: data }); }
  function verify(type, tk, password) {
    var b = { type: type, token: tk };
    if (password) b.password = password;
    return json('POST', '/verify', b).then(save);
  }
  function recover(email) { return json('POST', '/recover', { email: email }); }
  function logout() {
    var s = load();
    clear();
    if (s && s.access_token) {
      return fetch(API + '/logout', { method: 'POST', headers: { Authorization: 'Bearer ' + s.access_token } }).catch(function () {});
    }
    return Promise.resolve();
  }
  function settings() { return request('/settings'); }

  // ------------------------------------------------------------ jetons dans l'adresse (#...)
  function parseHash() {
    var h = location.hash.replace(/^#\/?/, '');
    if (!h || h.indexOf('=') < 0) return null;
    var p = {};
    h.split('&').forEach(function (kv) {
      var i = kv.indexOf('=');
      if (i > 0) p[decodeURIComponent(kv.slice(0, i))] = decodeURIComponent(kv.slice(i + 1).replace(/\+/g, ' '));
    });
    for (var i = 0; i < HASH_KEYS.length; i++) if (p[HASH_KEYS[i]]) return p;
    return null;
  }

  var authRoot = document.getElementById('auth');
  var spaceRoot = document.getElementById('space');
  var hashData = parseHash();

  // Les liens des e-mails (confirmation, mot de passe) et le retour de Google arrivent sur la page d'accueil :
  // on les transmet à la page de connexion.
  if (hashData && !authRoot) {
    location.replace('/connexion.html' + location.hash);
    return;
  }

  // Les boutons « Se connecter » / « Mon espace » et « Devenir membre » sont affichés selon la classe
  // is-member (posée par lang.js et par save/clear ci-dessus), indépendamment de l'adresse des liens.

  if (authRoot) initAuth(authRoot);
  if (spaceRoot) initSpace(spaceRoot);

  // ------------------------------------------------------------ page de connexion / inscription
  function initAuth(root) {
    var msgEl = root.querySelector('.auth-msg');
    var tabs = root.querySelector('.auth-tabs');
    var params = new URLSearchParams(location.search);
    var inviteToken = null;

    function show(name) {
      root.querySelectorAll('.auth-panel').forEach(function (p) { p.hidden = p.id !== 'auth-' + name; });
      var tabbed = name === 'login' || name === 'signup';
      tabs.hidden = !tabbed;
      tabs.querySelectorAll('[data-show]').forEach(function (b) {
        b.setAttribute('aria-selected', String(b.getAttribute('data-show') === name));
      });
    }
    function message(html, kind) {
      if (!html) { msgEl.hidden = true; msgEl.innerHTML = ''; return; }
      msgEl.className = 'auth-msg ' + (kind || 'error');
      msgEl.innerHTML = html;
      msgEl.hidden = false;
      var r = msgEl.getBoundingClientRect();
      if (r.top < 70 || r.bottom > window.innerHeight) msgEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    function explain(e) {
      var m = (e && e.message) || '';
      if (/not confirmed/i.test(m)) return tx("Votre e-mail n'est pas encore confirmé : cliquez sur le lien reçu par e-mail (pensez à regarder dans les spams).", 'Your email is not confirmed yet: click the link we emailed you (check your spam folder).');
      if (/password invalid|no user found|invalid_grant|invalid login/i.test(m)) return tx('E-mail ou mot de passe incorrect.', 'Incorrect email or password.');
      if (/already been registered|already registered|already exists/i.test(m)) return tx('Un compte existe déjà avec cet e-mail. Connectez-vous, ou utilisez « Mot de passe oublié ? ».', 'An account already exists with this email. Log in, or use "Forgot your password?".');
      if (/signups? not allowed|signup.*disabled/i.test(m)) return tx('Les inscriptions sont fermées pour le moment.', 'Sign-ups are closed for now.');
      if (/expired|invalid.*token|not found/i.test(m)) return tx('Ce lien a expiré ou a déjà été utilisé. Recommencez depuis cette page.', 'This link has expired or was already used. Please start again from this page.');
      if (/rate limit|too many/i.test(m)) return tx('Trop de tentatives. Patientez quelques minutes avant de réessayer.', 'Too many attempts. Please wait a few minutes and try again.');
      if (e && !e.status) return tx('Impossible de joindre le serveur. Vérifiez votre connexion internet et réessayez.', 'Cannot reach the server. Check your internet connection and try again.');
      return tx('Une erreur est survenue. Réessayez dans un instant.', 'Something went wrong. Please try again in a moment.');
    }
    function preselect(profile) {
      root.querySelectorAll('input[name="profil"][value="' + profile + '"]').forEach(function (r) { r.checked = true; });
      root.querySelectorAll('form').forEach(function (f) { f.dispatchEvent(new Event('change')); });
    }
    function start() {
      var p = params.get('profil');
      if (p && ROLES[p]) { preselect(p); store(PENDING_PROFILE, p); }
      show(location.hash === '#inscription' || (p && ROLES[p]) ? 'signup' : 'login');
    }
    function route(u) {
      var m = (u && u.user_metadata) || {};
      if (!m.profil) {
        var f = document.getElementById('form-complete');
        if (m.full_name && !f.elements.nom.value) f.elements.nom.value = m.full_name;
        var p = read(PENDING_PROFILE);
        if (p && ROLES[p]) preselect(p);
        show('complete');
        return;
      }
      location.replace('/espace-membre.html');
    }
    function formData(form) {
      var o = {};
      new FormData(form).forEach(function (v, k) { o[k] = typeof v === 'string' ? v.trim() : v; });
      return o;
    }
    function profileData(d) {
      return {
        full_name: d.nom,
        profil: d.profil,
        profil2: d.profil2 && d.profil2 !== d.profil ? d.profil2 : '',
        structure: d.structure || '',
        telephone: d.telephone,
        ville: d.ville,
        agriculture: d.agriculture,
        agri_type: d.agriculture === 'oui' ? (d.agri_type || '') : '',
        activite: d.activite || '',
        consentement: new Date().toISOString(),
        langue: lang()
      };
    }
    // Alerte e-mail pour l'équipe KAME (formulaire Netlify « nouveau-compte »)
    function notify(meta, email, methode) {
      var f = { 'form-name': 'nouveau-compte', nom: meta.full_name, email: email, profil: meta.profil, profil2: meta.profil2,
                structure: meta.structure, telephone: meta.telephone, ville: meta.ville, agriculture: meta.agriculture,
                agri_type: meta.agri_type, activite: meta.activite, methode: methode, langue: meta.langue };
      return fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: enc(f) })
        .catch(function () {});
    }
    function onSubmit(id, handler) {
      var form = document.getElementById(id);
      if (!form) return;
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!form.reportValidity()) return;
        message('');
        var btn = form.querySelector('button[type="submit"]');
        if (btn) btn.disabled = true;
        Promise.resolve()
          .then(function () { return handler(form, formData(form)); })
          .catch(function (err) { console.warn('[KAME]', err); message(explain(err)); })
          .then(function () { if (btn) btn.disabled = false; });
      });
    }

    // Champs liés : type d'activité agricole, deuxième profil différent du premier
    root.querySelectorAll('form').forEach(function (f) {
      var wrap = f.querySelector('[data-agri-type]');
      var sel2 = f.querySelector('select[name="profil2"]');
      function sync() {
        var a = f.querySelector('input[name="agriculture"]:checked');
        if (wrap) wrap.hidden = !(a && a.value === 'oui');
        var p = f.querySelector('input[name="profil"]:checked');
        if (sel2) {
          Array.prototype.forEach.call(sel2.options, function (o) { o.disabled = !!(p && o.value && o.value === p.value); });
          if (p && sel2.value === p.value) sel2.value = '';
        }
      }
      f.addEventListener('change', sync);
      sync();
    });

    root.querySelectorAll('[data-show]').forEach(function (b) {
      b.addEventListener('click', function () { message(''); show(b.getAttribute('data-show')); });
    });
    root.querySelectorAll('[data-oauth]').forEach(function (b) {
      b.addEventListener('click', function () {
        var panel = b.closest('.auth-panel');
        var chosen = panel && panel.querySelector('input[name="profil"]:checked');
        if (chosen) store(PENDING_PROFILE, chosen.value);
        location.href = API + '/authorize?provider=' + encodeURIComponent(b.getAttribute('data-oauth'));
      });
    });
    root.querySelectorAll('[data-logout]').forEach(function (b) {
      b.addEventListener('click', function () { logout().then(function () { message(''); show('login'); }); });
    });

    onSubmit('form-login', function (f, d) {
      return login(d.email, d.password).then(getUser).then(route);
    });
    onSubmit('form-signup', function (f, d) {
      var meta = profileData(d);
      return signup(d.email, d.password, meta).then(function (u) {
        notify(meta, d.email, 'e-mail');
        if (u && u.confirmed_at) return login(d.email, d.password).then(getUser).then(route);
        root.querySelector('[data-check-email]').textContent = d.email;
        f.reset();
        show('check');
      });
    });
    onSubmit('form-complete', function (f, d) {
      var meta = profileData(d);
      return updateUser({ data: meta }).then(function (u) {
        var provider = (u && u.app_metadata && u.app_metadata.provider) || 'google';
        return notify(meta, u.email, provider).then(function () {
          store(PENDING_PROFILE, null);
          location.replace('/espace-membre.html');
        });
      });
    });
    onSubmit('form-forgot', function (f, d) {
      return recover(d.email).then(function () {
        f.reset();
        message(tx('Si un compte existe pour cette adresse, vous allez recevoir un e-mail pour choisir un nouveau mot de passe.',
                   'If an account exists for this address, you will receive an email to choose a new password.'), 'success');
      });
    });
    onSubmit('form-reset', function (f, d) {
      return updateUser({ password: d.password }).then(function () { location.replace('/espace-membre.html'); });
    });
    onSubmit('form-invite', function (f, d) {
      return verify('signup', inviteToken, d.password).then(getUser).then(route);
    });

    function handleHash(p) {
      if (p.error) {
        message(p.error === 'access_denied'
          ? tx('Connexion avec Google annulée.', 'Google sign-in was cancelled.')
          : tx("La connexion avec Google n'a pas abouti. Réessayez, ou utilisez votre e-mail.", 'Signing in with Google did not work. Try again, or use your email.'));
        start();
        return null;
      }
      if (p.access_token) {
        save(p);
        return getUser().then(function (u) { if (u) route(u); else start(); });
      }
      if (p.confirmation_token) {
        return verify('signup', p.confirmation_token).then(getUser).then(route)
          .catch(function (e) { message(explain(e)); start(); });
      }
      if (p.recovery_token) {
        return verify('recovery', p.recovery_token).then(function () { show('reset'); })
          .catch(function (e) { message(explain(e)); show('forgot'); });
      }
      if (p.invite_token) {
        inviteToken = p.invite_token;
        show('invite');
        return null;
      }
      if (p.email_change_token) {
        return updateUser({ email_change_token: p.email_change_token })
          .then(function () { message(tx('Votre nouvel e-mail est confirmé.', 'Your new email is confirmed.'), 'success'); start(); })
          .catch(function (e) { message(explain(e)); start(); });
      }
      start();
      return null;
    }

    show('loading');
    if (hashData) history.replaceState(null, '', location.pathname + location.search);
    settings().then(function (s) {
      root.setAttribute('data-google', s && s.external && s.external.google ? 'on' : 'off');
      if (hashData) return handleHash(hashData);
      return getUser().then(function (u) { if (u) route(u); else start(); });
    }).catch(function (e) {
      console.warn('[KAME] Netlify Identity indisponible', e);
      show('closed');
    });
  }

  // ------------------------------------------------------------ espace membre
  function initSpace(root) {
    var currentUser = null, currentRoles = [], activeRole = null;
    // Menu du compte : l'espace ouvert est marqué comme actuel
    function markSpaces() {
      document.querySelectorAll('[data-space-role]').forEach(function (el) {
        el.setAttribute('aria-current', String(el.getAttribute('data-space-role') === activeRole));
      });
    }
    function show(name) {
      root.querySelectorAll('.space-panel').forEach(function (p) { p.hidden = p.id !== 'space-' + name; });
      // Espaces investisseur et entreprise : mise en page large et éléments du bandeau réservés (recherche, notifications)
      var wide = name === 'investor' || name === 'business';
      root.classList.toggle('space-wide', wide);
      document.documentElement.classList.toggle('inv-on', name === 'investor');
      document.documentElement.classList.toggle('biz-on', name === 'business');
    }
    // Demandes d'espace en plus, enregistrées dans le compte (user_metadata) ; le rôle n'est donné que par l'équipe KAME
    function requestsOf(m) {
      return Array.isArray(m && m.espaces_demandes) ? m.espaces_demandes.filter(function (r) { return r && ROLES[r.role]; }) : [];
    }
    function pendingOf(m, roles) { return requestsOf(m).filter(function (r) { return roles.indexOf(r.role) < 0; }); }
    // Ce que l'espace entreprise affiche : la demande d'espace d'abord, sinon les informations de l'inscription
    function businessInfo(m, role) {
      var req = requestsOf(m).filter(function (r) { return r.role === role; })[0];
      var agri = req ? req.agriculture === 'oui' : m.agriculture === 'oui';
      return { role: role, name: (req && req.structure) || m.structure || '', sector: (req && req.secteur) || '',
               city: (req && req.ville) || m.ville || '', agriculture: agri, agriType: agri ? (m.agri_type || '') : '' };
    }
    function label(r) { return r && ROLES[r] ? tx(ROLES[r].fr, ROLES[r].en) : '—'; }
    function firstName(u) {
      var n = (u.user_metadata && u.user_metadata.full_name) || (u.email || '').split('@')[0];
      return n.split(' ')[0];
    }
    function memberId(u, role) { return ROLES[role].prefix + '-' + String(u.id || '').replace(/-/g, '').slice(0, 6).toUpperCase(); }
    function setField(name, html) {
      root.querySelectorAll('[data-field="' + name + '"]').forEach(function (el) { el.innerHTML = html || '—'; });
    }

    function render(u) {
      var m = u.user_metadata || {};
      if (!m.profil) { location.replace('/connexion.html'); return; }
      currentUser = u;
      var first = firstName(u);
      document.querySelectorAll('[data-first-name]').forEach(function (el) { el.textContent = first; });
      document.querySelectorAll('[data-initial]').forEach(function (el) { el.textContent = (first.charAt(0) || 'K').toUpperCase(); });
      document.querySelectorAll('[data-email]').forEach(function (el) { el.textContent = u.email || ''; });
      var roles = ((u.app_metadata && u.app_metadata.roles) || []).filter(function (r) { return ROLES[r]; });
      roles.sort(function (a, b) { return ROLE_ORDER.indexOf(a) - ROLE_ORDER.indexOf(b); });

      if (!roles.length) {
        setField('profil', label(m.profil));
        setField('profil2', m.profil2 ? label(m.profil2) : '');
        setField('structure', esc(m.structure));
        setField('email', esc(u.email));
        setField('telephone', esc(m.telephone));
        setField('ville', esc(m.ville));
        show('pending');
        return;
      }

      root.querySelector('[data-ids]').innerHTML = roles.map(function (r) {
        return '<span class="id-chip">' + label(r) + ' · <strong>' + esc(memberId(u, r)) + '</strong></span>';
      }).join('');
      var tabsEl = root.querySelector('.role-tabs');
      function pick(r) {
        root.querySelectorAll('.role-dash').forEach(function (d) { d.hidden = d.getAttribute('data-role') !== r; });
        tabsEl.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-role') === r)); });
      }
      if (roles.length > 1) {
        tabsEl.innerHTML = roles.map(function (r) {
          return '<button type="button" role="tab" data-role="' + r + '">' + label(r) + '</button>';
        }).join('');
        tabsEl.querySelectorAll('button').forEach(function (b) {
          b.addEventListener('click', function () { pick(b.getAttribute('data-role')); });
        });
        tabsEl.hidden = false;
      } else {
        tabsEl.hidden = true;
      }
      root.classList.toggle('has-agro', m.agriculture === 'oui');
      currentRoles = roles;

      // Espace investisseur (nouveau tableau de bord) ; les autres profils gardent leur espace actuel
      window.KAME_SPACE = {
        firstName: first, fullName: m.full_name || '', email: u.email || '', roles: roles,
        ids: roles.reduce(function (o, r) { o[r] = memberId(u, r); return o; }, {}),
        structure: m.structure || '', ville: m.ville || '', agriculture: m.agriculture === 'oui',
        pending: pendingOf(m, roles), business: null
      };
      function roleLabel(r) {
        document.querySelectorAll('[data-role-label]').forEach(function (el) { el.innerHTML = label(r); });
      }
      function showRole(r, fromUser) {
        activeRole = r;
        roleLabel(r);
        store(SPACE_KEY, r);
        markSpaces();
        // Changement d'espace demandé par la personne : on repart de l'accueil de l'espace, en haut de la page
        if (fromUser) {
          if (location.hash) history.replaceState(null, '', location.pathname + location.search);
          window.scrollTo(0, 0);
        }
        if (r === 'investisseur') {
          show('investor');
          document.dispatchEvent(new CustomEvent('kame:investor', { detail: window.KAME_SPACE }));
        } else if (BUSINESS_ROLES.indexOf(r) >= 0) {
          window.KAME_SPACE.business = businessInfo(m, r);
          show('business');
          document.dispatchEvent(new CustomEvent('kame:business', { detail: { role: r } }));
        } else {
          pick(r);
          show('dash');
        }
      }
      window.KAME_SHOW_ROLE = showRole;
      renderSpaces();
      if (spacesBox && !spacesBox.hasAttribute('data-ready')) {
        spacesBox.setAttribute('data-ready', '');
        spacesBox.addEventListener('click', function (e) {
          var b = e.target.closest('[data-space-role]');
          if (b) showRole(b.getAttribute('data-space-role'), true);
        });
      }
      if (roles.length > 1) {
        tabsEl.querySelectorAll('button').forEach(function (b) {
          var r = b.getAttribute('data-role');
          if (r === 'investisseur' || BUSINESS_ROLES.indexOf(r) >= 0) {
            b.addEventListener('click', function (e) { e.stopImmediatePropagation(); showRole(r, true); }, true);
          }
        });
      }
      // Espace ouvert au départ : celui de l'adresse (#e-… pour l'entreprise), sinon le dernier utilisé, sinon le premier
      var startRole = roles[0];
      var h = location.hash.replace(/^#\/?/, '').split('/')[0];
      var stored = read(SPACE_KEY);
      var biz = roles.filter(function (r) { return BUSINESS_ROLES.indexOf(r) >= 0; })[0];
      if (h.indexOf('e-') === 0 && biz) startRole = biz;
      else if (INVESTOR_VIEWS.indexOf(h) >= 0 && roles.indexOf('investisseur') >= 0) startRole = 'investisseur';
      else if (stored && roles.indexOf(stored) >= 0) startRole = stored;
      showRole(startRole);
    }

    // ------------------------------------------------------------ « Mes espaces » (menu du compte) et demande d'un espace en plus
    var spacesBox = document.querySelector('[data-other-spaces]');
    var ADD_ORDER = ['entreprise', 'commercant', 'partenaire', 'investisseur'];
    var SPACE_DESC = {
      entreprise: ['PME, startup, coopérative : pilotez votre activité, votre KAME Score et vos relations avec les investisseurs.',
                   'SME, startup, cooperative: run your business, your KAME Score and your relations with investors.'],
      commercant: ['Boutique, marché, vente en ligne : suivez vos ventes, émettez des reçus fiables, obtenez un financement.',
                   'Shop, market stall, online sales: track your sales, issue trusted receipts, get funding.'],
      partenaire: ['Banque, microfinance, fintech, institution : construisons des services ensemble.',
                   'Bank, microfinance, fintech, institution: let us build services together.'],
      investisseur: ['Repérez les entreprises fiables du Gabon et suivez leur progression.', 'Find reliable businesses in Gabon and follow their progress.']
    };
    var NAME_LABEL = {
      entreprise: ['Nom de l\'entreprise', 'Business name'], commercant: ['Nom de votre commerce (ou votre nom)', 'Name of your shop (or your name)'],
      partenaire: ['Nom de la structure', 'Organisation name'], investisseur: ['Société d\'investissement (facultatif)', 'Investment company (optional)']
    };
    function addable(m) {
      var pend = pendingOf(m, currentRoles).map(function (r) { return r.role; });
      return ADD_ORDER.filter(function (r) { return currentRoles.indexOf(r) < 0 && pend.indexOf(r) < 0; });
    }
    function renderSpaces() {
      if (!spacesBox || !currentUser) return;
      var m = currentUser.user_metadata || {};
      var pend = pendingOf(m, currentRoles);
      spacesBox.innerHTML = '<p class="mh-spaces-title">' + tx('Mes espaces', 'My spaces') + '</p>' +
        currentRoles.map(function (r) { return '<button type="button" data-space-role="' + r + '">' + label(r) + '</button>'; }).join('') +
        pend.map(function (r) {
          return '<p class="mh-space-pending">' + svg('clock', 17) + '<span>' + label(r.role) + '<small>' + tx('En attente de validation', 'Awaiting approval') + '</small></span></p>';
        }).join('') +
        (addable(m).length ? '<button type="button" class="mh-add-space" data-add-space>' + svg('plus', 18) + tx('Ajouter un espace', 'Add a space') + '</button>' : '');
      spacesBox.hidden = false;
      markSpaces();
    }
    function sectorOptions() {
      var U = window.KAME_UI;
      return '<option value="">' + esc(lang() === 'en' ? 'Choose…' : 'Choisir…') + '</option>' + U.SECTOR_ORDER.map(function (k) {
        return '<option value="' + k + '">' + esc(lang() === 'en' ? U.SECTORS[k].en : U.SECTORS[k].fr) + '</option>';
      }).join('');
    }
    function openAddSpace() {
      var U = window.KAME_UI;
      if (!U || !currentUser) return;
      var m = currentUser.user_metadata || {};
      var pend = pendingOf(m, currentRoles).map(function (r) { return r.role; });
      var choices = ADD_ORDER.map(function (r) {
        var has = currentRoles.indexOf(r) >= 0, wait = pend.indexOf(r) >= 0;
        return '<label class="inv-choice' + (has || wait ? ' is-taken' : '') + '"><input type="radio" name="sp-role" value="' + r + '"' + (has || wait ? ' disabled' : '') + '>' +
          '<span class="sp-choice"><strong>' + label(r) + (has ? ' <em>' + tx('(déjà ouvert)', '(already open)') + '</em>' : (wait ? ' <em>' + tx('(demande en cours)', '(request pending)') + '</em>' : '')) +
          '</strong><small>' + tx(SPACE_DESC[r][0], SPACE_DESC[r][1]) + '</small></span></label>';
      }).join('');
      U.openModal({
        title: tx('Ajouter un espace', 'Add a space'),
        confirm: tx('Envoyer ma demande', 'Send my request'),
        body: '<p>' + tx('Avec le même compte et le même e-mail, vous pouvez avoir plusieurs espaces. L\'équipe KAME vérifie chaque demande avant d\'ouvrir le nouvel espace.',
                         'With the same account and email, you can have several spaces. The KAME team checks each request before opening the new space.') + '</p>' +
          '<fieldset class="inv-choices"><legend>' + tx('Quel espace souhaitez-vous ajouter ?', 'Which space would you like to add?') + '</legend>' + choices + '</fieldset>' +
          '<div class="sp-details" hidden>' +
          '<label class="inv-field"><span data-sp-name-label></span><input class="inv-input" name="sp-structure" maxlength="120" autocomplete="organization"></label>' +
          '<label class="inv-field" data-sp-biz><span>' + tx('Secteur d\'activité', 'Sector') + '</span><select class="inv-input" name="sp-secteur">' + sectorOptions() + '</select></label>' +
          '<label class="inv-field"><span>' + tx('Ville', 'City') + '</span><input class="inv-input" name="sp-ville" maxlength="80" autocomplete="address-level2" value="' + esc(m.ville || '') + '"></label>' +
          '<fieldset class="inv-choices inline" data-sp-biz><legend>' + tx('Avez-vous une activité agricole ?', 'Do you have a farming activity?') + '</legend>' +
          '<label class="inv-choice"><input type="radio" name="sp-agri" value="oui"><span>' + tx('Oui', 'Yes') + '</span></label>' +
          '<label class="inv-choice"><input type="radio" name="sp-agri" value="non" checked><span>' + tx('Non', 'No') + '</span></label></fieldset>' +
          '<label class="inv-field"><span>' + tx('Message pour l\'équipe KAME (facultatif)', 'Message for the KAME team (optional)') + '</span><textarea name="sp-message" rows="2" maxlength="500"></textarea></label>' +
          '</div>' +
          '<p class="inv-foot-note">' + tx('Les justificatifs vous seront demandés plus tard, de façon sécurisée. N\'envoyez aucun document ici.',
                                           'Supporting documents will be requested later, securely. Do not send any documents here.') + '</p>',
        check: function (box) {
          var sel = box.querySelector('[name="sp-role"]:checked');
          if (!sel) return tx('Choisissez l\'espace à ajouter.', 'Choose the space to add.');
          var r = sel.value;
          if (r !== 'investisseur' && box.querySelector('[name="sp-structure"]').value.trim().length < 2) {
            return r === 'commercant' ? tx('Indiquez le nom de votre commerce, ou votre nom.', 'Enter the name of your shop, or your name.')
                                      : tx('Indiquez le nom de votre ' + (r === 'entreprise' ? 'entreprise' : 'structure') + '.', 'Enter the name of your ' + (r === 'entreprise' ? 'business' : 'organisation') + '.');
          }
          if (BUSINESS_ROLES.indexOf(r) >= 0 && !box.querySelector('[name="sp-secteur"]').value) return tx('Choisissez votre secteur d\'activité.', 'Choose your sector.');
          if (box.querySelector('[name="sp-ville"]').value.trim().length < 2) return tx('Indiquez votre ville.', 'Enter your city.');
          return '';
        },
        submit: function (box) {
          var r = box.querySelector('[name="sp-role"]:checked').value;
          var biz = BUSINESS_ROLES.indexOf(r) >= 0;
          var agri = box.querySelector('[name="sp-agri"]:checked');
          var req = { role: r, structure: box.querySelector('[name="sp-structure"]').value.trim(), secteur: biz ? box.querySelector('[name="sp-secteur"]').value : '',
                      ville: box.querySelector('[name="sp-ville"]').value.trim(), agriculture: biz && agri ? agri.value : '',
                      message: box.querySelector('[name="sp-message"]').value.trim(), date: new Date().toISOString() };
          var list = requestsOf(m).filter(function (x) { return x.role !== r; }).concat([req]);
          return updateUser({ data: { espaces_demandes: list } }).then(function (u2) {
            if (u2 && u2.user_metadata) currentUser = u2;
            else currentUser.user_metadata = Object.assign({}, m, { espaces_demandes: list });
            // Alerte e-mail pour l'équipe KAME (formulaire Netlify « nouvel-espace ») ; la demande reste enregistrée même si l'alerte échoue
            var f = { 'form-name': 'nouvel-espace', email: currentUser.email || '', nom: m.full_name || '', espace: r, structure: req.structure,
                      secteur: req.secteur, ville: req.ville, agriculture: req.agriculture, message: req.message, espaces_actuels: currentRoles.join(', '), langue: lang() };
            return fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: enc(f) })
              .catch(function () {}).then(function () { return req; });
          });
        },
        fail: function (e) {
          if (e && (e.status === 401 || e.status === 403)) return tx('Votre session a expiré. Reconnectez-vous, puis refaites la demande.', 'Your session has expired. Log in again, then send the request again.');
          if (e && !e.status) return tx('Impossible de joindre le serveur. Vérifiez votre connexion internet et réessayez.', 'Cannot reach the server. Check your internet connection and try again.');
          return tx('La demande n\'a pas pu être envoyée. Réessayez dans un instant.', 'The request could not be sent. Please try again in a moment.');
        },
        done: function (req) {
          var mm = currentUser.user_metadata || {};
          if (window.KAME_SPACE) window.KAME_SPACE.pending = pendingOf(mm, currentRoles);
          renderSpaces();
          markSpaces();
          document.dispatchEvent(new CustomEvent('kame:spaces'));
          U.toast(tx('Demande envoyée. L\'équipe KAME va la vérifier : vous recevrez un e-mail dès que votre espace ' + ROLES[req.role].fr + ' sera ouvert.',
                     'Request sent. The KAME team will check it: you will get an email as soon as your ' + ROLES[req.role].en + ' space is open.'));
        }
      });
      syncSpaceForm();
    }
    // Les champs suivent l'espace choisi : nom de l'entreprise, secteur et activité agricole pour l'entreprise et le commerçant
    function syncSpaceForm() {
      var U = window.KAME_UI;
      var box = U && U.modal;
      var details = box && box.querySelector('.sp-details');
      if (!details) return;
      var sel = box.querySelector('[name="sp-role"]:checked');
      details.hidden = !sel;
      if (!sel) return;
      var r = sel.value;
      box.querySelector('[data-sp-name-label]').innerHTML = tx(NAME_LABEL[r][0], NAME_LABEL[r][1]);
      box.querySelectorAll('[data-sp-biz]').forEach(function (el) { el.hidden = BUSINESS_ROLES.indexOf(r) < 0; });
    }
    if (window.KAME_UI) {
      window.KAME_UI.modal.addEventListener('change', function (e) { if (e.target.name === 'sp-role') syncSpaceForm(); });
    }
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-add-space]');
      if (!b) return;
      e.preventDefault();
      openAddSpace();
    });

    function refresh() {
      show('loading');
      return settings().then(getUser).then(function (u) {
        if (!u) { location.replace('/connexion.html'); return; }
        render(u);
      }).catch(function (e) {
        console.warn('[KAME] Netlify Identity indisponible', e);
        show('closed');
      });
    }

    root.querySelectorAll('[data-refresh]').forEach(function (b) { b.addEventListener('click', refresh); });
    document.querySelectorAll('[data-logout]').forEach(function (b) {
      b.addEventListener('click', function () {
        // Déconnexion : retour à l'accueil du site, dans la langue choisie
        logout().then(function () { location.replace(document.documentElement.lang === 'en' ? '/en/' : '/'); });
      });
    });
    refresh();
  }
})();
