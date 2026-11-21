(function () {
  var d = document.documentElement;
  d.classList.add('js');
  try {
    var l = localStorage.getItem('kame-lang');
    if (l === 'en' || l === 'fr') d.lang = l;
  } catch (e) {}
  // Membre connecté : le site affiche « Mon espace » et masque « Devenir membre » dès le chargement
  try {
    var s = JSON.parse(localStorage.getItem('kame-auth') || 'null');
    if (s && s.refresh_token) d.classList.add('is-member');
  } catch (e) {}
})();
