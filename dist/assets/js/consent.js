/* Bandeau d'information (aucun cookie non essentiel) et gestion des préférences. */
(function () {
  'use strict';
  var KEY = 'kame-notice';
  var YEAR = 365 * 24 * 3600 * 1000;
  var en = function () { return document.documentElement.lang === 'en'; };

  function seen() {
    try { var t = Number(localStorage.getItem(KEY)); return t && Date.now() - t < YEAR; } catch (e) { return true; }
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }

  function showNotice() {
    if (document.querySelector('.cookie-notice')) return;
    var box = el('div', 'cookie-notice');
    box.setAttribute('role', 'region');
    box.setAttribute('aria-label', en() ? 'Cookie information' : 'Information cookies');
    var p = el('p', '', en()
      ? 'This website uses no advertising or tracking cookies, only what it needs to work (your language and your login). '
      : 'Ce site n’utilise aucun cookie publicitaire ni de pistage, seulement le strict nécessaire (votre langue et votre connexion). ');
    var a = el('a', '', en() ? 'Learn more' : 'En savoir plus');
    a.href = 'cookies.html';
    p.appendChild(a);
    var b = el('button', 'btn btn-primary', 'OK');
    b.type = 'button';
    b.addEventListener('click', function () {
      try { localStorage.setItem(KEY, String(Date.now())); } catch (e) {}
      box.remove();
    });
    box.appendChild(p);
    box.appendChild(b);
    document.body.appendChild(box);
  }

  document.addEventListener('click', function (ev) {
    var t = ev.target.closest && ev.target.closest('[data-cookie-prefs],[data-cookie-clear]');
    if (!t) return;
    if (t.hasAttribute('data-cookie-prefs')) { showNotice(); return; }
    try {
      ['kame-lang', 'kame-notice', 'kame-auth', 'kame-profil'].forEach(function (k) {
        localStorage.removeItem(k); sessionStorage.removeItem(k);
      });
    } catch (e) {}
    document.documentElement.classList.remove('is-member');
    var s = document.querySelector('[data-cookie-status]');
    if (s) s.textContent = en() ? 'Done: nothing is stored anymore. You have been logged out.' : 'C’est fait : plus rien n’est enregistré. Vous avez été déconnecté(e).';
  });

  if (!seen()) showNotice();
})();
