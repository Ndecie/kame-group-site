(function () {
  var d = document.documentElement;
  d.classList.add('js');
  try {
    if (d.hasAttribute('data-lang-fixed')) {
      // Page publique déjà écrite dans sa langue (racine en français, /en/ en anglais) :
      // on retient cette langue pour la connexion et l'espace membre
      localStorage.setItem('kame-lang', d.lang);
    } else {
      var l = localStorage.getItem('kame-lang');
      if (l === 'en' || l === 'fr') d.lang = l;
    }
  } catch (e) {}
  // Membre connecté : le site affiche « Mon espace » et masque « Devenir membre » dès le chargement
  try {
    var s = JSON.parse(localStorage.getItem('kame-auth') || 'null');
    if (s && s.refresh_token) d.classList.add('is-member');
  } catch (e) {}
})();
