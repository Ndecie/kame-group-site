(function () {
  var d = document.documentElement;
  d.classList.add('js');
  try {
    var l = localStorage.getItem('kame-lang');
    if (l === 'en' || l === 'fr') d.lang = l;
  } catch (e) {}
})();
