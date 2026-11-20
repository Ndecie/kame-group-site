/* KAME GROUP — interactions du site */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var LANG_KEY = 'kame-lang';

  /* ---------- Langue FR / EN ---------- */
  function applyLang(lang) {
    root.lang = lang;
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
    document.querySelectorAll('[data-set-lang]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-set-lang') === lang));
    });
    document.querySelectorAll('[data-text-fr]').forEach(function (el) {
      var v = el.getAttribute('data-text-' + lang);
      if (v !== null) el.textContent = v;
    });
    ['placeholder', 'aria-label', 'title', 'alt'].forEach(function (attr) {
      document.querySelectorAll('[data-' + attr + '-fr]').forEach(function (el) {
        var v = el.getAttribute('data-' + attr + '-' + lang);
        if (v !== null) el.setAttribute(attr, v);
      });
    });
    var t = document.querySelector('meta[name="title-' + lang + '"]');
    if (t) document.title = t.getAttribute('content');
    document.querySelectorAll('input[name="langue"]').forEach(function (i) { i.value = lang; });
    scheduleShapes();
  }
  document.querySelectorAll('[data-set-lang]').forEach(function (b) {
    b.addEventListener('click', function () { applyLang(b.getAttribute('data-set-lang')); });
  });

  /* ---------- Menu à trois traits ---------- */
  var drawer = document.getElementById('drawer');
  var backdrop = document.querySelector('.drawer-backdrop');
  var toggles = document.querySelectorAll('.menu-toggle');
  function setDrawer(open) {
    if (!drawer) return;
    document.body.classList.toggle('drawer-open', open);
    drawer.inert = !open;
    drawer.setAttribute('aria-hidden', String(!open));
    toggles.forEach(function (t) { t.setAttribute('aria-expanded', String(open)); });
    if (open) {
      var first = drawer.querySelector('a, button');
      if (first) first.focus();
    } else if (toggles[0]) {
      toggles[0].focus({ preventScroll: true });
    }
  }
  if (drawer) {
    drawer.inert = true;
    toggles.forEach(function (t) { t.addEventListener('click', function () { setDrawer(true); }); });
    drawer.querySelectorAll('.drawer-close, nav a, .drawer-foot a').forEach(function (el) {
      el.addEventListener('click', function () { setDrawer(false); });
    });
    if (backdrop) backdrop.addEventListener('click', function () { setDrawer(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('drawer-open')) setDrawer(false);
    });
  }

  /* ---------- Contours en alvéoles ---------- */
  function honeycombPath(W, H, s) {
    var hh = Math.sqrt(3) / 2 * s;
    var dx = 1.5 * s, dy = 2 * hh;
    var cols = Math.floor((W - 2 * s) / dx) + 1;
    if (cols < 2 || H < 4 * hh) return null;
    var x0 = (W - (cols - 1) * dx) / 2;
    var usable = H - 2 * hh;
    var rows = Math.floor(usable / dy);
    var y0 = hh + (usable - rows * dy) / 2;
    var edges = new Map();
    function k(x, y) { return Math.round(x * 20) + ',' + Math.round(y * 20); }
    for (var c = 0; c < cols; c++) {
      var cx = x0 + c * dx;
      var off = (c % 2) ? hh : 0;
      for (var r = -1; r <= rows + 1; r++) {
        var cy = y0 + off + r * dy;
        if (cy < hh - 0.01 || cy > H - hh + 0.01) continue;
        var v = [
          [cx + s, cy], [cx + s / 2, cy + hh], [cx - s / 2, cy + hh],
          [cx - s, cy], [cx - s / 2, cy - hh], [cx + s / 2, cy - hh]
        ];
        for (var i = 0; i < 6; i++) {
          var a = v[i], b = v[(i + 1) % 6];
          var ka = k(a[0], a[1]), kb = k(b[0], b[1]);
          var ek = ka < kb ? ka + '|' + kb : kb + '|' + ka;
          var e = edges.get(ek);
          if (e) e.n++; else edges.set(ek, { a: a, b: b, ka: ka, kb: kb, n: 1 });
        }
      }
    }
    var adj = new Map(), list = [];
    edges.forEach(function (e) {
      if (e.n !== 1) return;
      list.push(e);
      [e.ka, e.kb].forEach(function (kk) {
        if (!adj.has(kk)) adj.set(kk, []);
        adj.get(kk).push(e);
      });
    });
    if (!list.length) return null;
    var used = new Set();
    var start = list[0];
    used.add(start);
    var pts = [start.a];
    var curKey = start.kb, cur = start.b;
    var guard = 0;
    while (curKey !== start.ka && guard++ < 20000) {
      pts.push(cur);
      var nexts = adj.get(curKey) || [];
      var nx = null;
      for (var j = 0; j < nexts.length; j++) { if (!used.has(nexts[j])) { nx = nexts[j]; break; } }
      if (!nx) break;
      used.add(nx);
      if (nx.ka === curKey) { curKey = nx.kb; cur = nx.b; } else { curKey = nx.ka; cur = nx.a; }
    }
    return 'M' + pts.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join('L') + 'Z';
  }

  var shapes = Array.prototype.slice.call(document.querySelectorAll('.hc'));
  function drawShape(el) {
    var svg = el.querySelector(':scope > .hc-shape');
    if (!svg) return;
    var W = el.offsetWidth, H = el.offsetHeight;
    if (!W || !H) return;
    var s = parseFloat(el.getAttribute('data-hc')) || 14;
    if (W < 520) s = Math.max(6, Math.min(s, W / 24));
    var d = honeycombPath(W, H, s);
    if (!d) { el.classList.remove('hc-ready'); return; }
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.querySelector('path').setAttribute('d', d);
    el.classList.add('hc-ready');
  }
  var shapeQueued = false;
  function scheduleShapes() {
    if (shapeQueued) return;
    shapeQueued = true;
    requestAnimationFrame(function () { shapeQueued = false; shapes.forEach(drawShape); });
  }
  if ('ResizeObserver' in window) {
    var ro = new ResizeObserver(function (entries) { entries.forEach(function (en) { drawShape(en.target); }); });
    shapes.forEach(function (el) { ro.observe(el); });
  } else {
    window.addEventListener('resize', scheduleShapes);
  }
  shapes.forEach(drawShape);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(scheduleShapes);

  /* ---------- Défilement : abeilles de la ruche, miel, motif ---------- */
  var header = document.querySelector('.site-header');
  var hive = document.querySelector('.hive-scene');
  var flights = Array.prototype.slice.call(document.querySelectorAll('.hive-bee')).map(function (b) {
    return {
      bee: b, el: b.querySelector('.bee-fly'),
      start: parseFloat(b.getAttribute('data-start')) || 0,
      dx: parseFloat(b.getAttribute('data-dx')) || 0,
      dy: parseFloat(b.getAttribute('data-dy')) || -300,
      rot: parseFloat(b.getAttribute('data-rot')) || 0,
      flying: false
    };
  });
  var ambient = document.querySelectorAll('.ambient-bee');
  var honeys = document.querySelectorAll('.honey');
  var patterns = document.querySelectorAll('.hex-pattern');

  function updateHive() {
    if (!hive || !flights.length) return;
    var r = hive.getBoundingClientRect();
    var hh = header ? header.offsetHeight : 76;
    var p = (hh + 40 - r.top) / (r.height * 0.85);
    p = Math.max(0, Math.min(1, p));
    flights.forEach(function (f) {
      var t = (p - f.start) / 0.5;
      t = Math.max(0, Math.min(1, t));
      var e = t * t * (3 - 2 * t);
      if (t > 0) {
        var x = f.dx * e + Math.sin(e * Math.PI) * 22;
        var y = f.dy * e - Math.sin(e * Math.PI) * 26;
        f.el.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') rotate(' + (f.rot * e).toFixed(1) + ')');
      } else {
        f.el.removeAttribute('transform');
      }
      var fl = t > 0.001;
      if (fl !== f.flying) { f.flying = fl; f.bee.classList.toggle('is-flying', fl); }
    });
    ambient.forEach(function (a) { a.style.opacity = String(Math.max(0, 1 - p * 2.2)); });
  }
  function updateHoney() {
    if (!honeys.length) return;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var p = max > 0 ? window.scrollY / max : 0;
    p = Math.max(0, Math.min(1, p));
    honeys.forEach(function (h) { h.style.setProperty('--p', p.toFixed(4)); });
  }
  function updateParallax() {
    patterns.forEach(function (pt) {
      var r = pt.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      pt.style.setProperty('--py', (-r.top * 0.18).toFixed(1) + 'px');
    });
  }
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      if (!reduced) { updateHive(); updateHoney(); updateParallax(); }
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  if (!reduced) { updateHive(); updateHoney(); updateParallax(); }

  /* ---------- Apparitions douces ---------- */
  var revealEls = document.querySelectorAll('[data-reveal]');
  function hopValues(scope) {
    scope.querySelectorAll('.value-hex').forEach(function (h) {
      h.classList.remove('hop'); void h.offsetWidth; h.classList.add('hop');
      h.addEventListener('animationend', function done() { h.classList.remove('hop'); h.removeEventListener('animationend', done); });
    });
  }
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        if (en.target.querySelector('.value-hex')) hopValues(en.target);
        io.unobserve(en.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* L'abeille qui revient se poser près de « Rejoignez KAME GROUP » */
  var returnBee = document.querySelector('.return-bee');
  if (returnBee && 'IntersectionObserver' in window && !reduced) {
    var io2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { returnBee.classList.toggle('landed', en.isIntersecting); });
    }, { threshold: 0.3 });
    io2.observe(returnBee.closest('section'));
  }

  /* ---------- Nos outils et services : carrousel + mode « tout voir » ---------- */
  var tools = document.querySelector('[data-tools]');
  if (tools) {
    var carousel = tools.querySelector('.tools-carousel');
    var track = tools.querySelector('.tools-track');
    var slides = Array.prototype.slice.call(tools.querySelectorAll('.tool-slide'));
    var prev = tools.querySelector('.nav-arrow.prev');
    var next = tools.querySelector('.nav-arrow.next');
    var counter = tools.querySelector('.tools-counter');
    var gridWrap = tools.querySelector('.tools-grid-wrap');
    var minis = Array.prototype.slice.call(tools.querySelectorAll('.tool-mini'));
    var modeBtn = tools.querySelector('.mode-toggle');
    var windowEl = tools.querySelector('.tools-window');
    var index = 0, busy = false, mode = 'single';

    function render(instant) {
      if (instant) track.style.transition = 'none';
      track.style.transform = 'translate3d(' + (-index * 100) + '%,0,0)';
      if (instant) { void track.offsetWidth; track.style.transition = ''; }
      prev.disabled = index === 0;
      next.disabled = index === slides.length - 1;
      counter.textContent = (index + 1) + ' / ' + slides.length;
      slides.forEach(function (s, i) {
        var on = i === index;
        s.setAttribute('aria-hidden', String(!on));
        s.inert = !on;
      });
    }
    function actor(i) { return slides[i] ? slides[i].querySelector('.bee-actor') : null; }
    function go(to) {
      if (busy || to < 0 || to >= slides.length || to === index) return;
      var dir = to > index ? 1 : -1;
      var out = actor(index), inc = actor(to);
      busy = true;
      if (!reduced) {
        if (dir > 0) { inc.classList.add('pose-push'); out.classList.add('pose-leave'); }
        else { out.classList.add('pose-pull'); inc.classList.add('pose-arrive'); }
      }
      index = to;
      render(false);
      setTimeout(function () {
        [out, inc].forEach(function (b) { b.classList.remove('pose-push', 'pose-leave', 'pose-pull', 'pose-arrive'); });
        busy = false;
      }, reduced ? 0 : 950);
    }
    prev.addEventListener('click', function () { go(index - 1); });
    next.addEventListener('click', function () { go(index + 1); });
    carousel.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1); }
    });
    var sx = null, sy = null;
    windowEl.addEventListener('pointerdown', function (e) { sx = e.clientX; sy = e.clientY; });
    windowEl.addEventListener('pointerup', function (e) {
      if (sx === null) return;
      var ddx = e.clientX - sx, ddy = e.clientY - sy;
      sx = null;
      if (Math.abs(ddx) > 50 && Math.abs(ddx) > Math.abs(ddy) * 1.2) go(index + (ddx < 0 ? 1 : -1));
    });

    function setModeButton() {
      var grid = mode === 'grid';
      modeBtn.setAttribute('aria-pressed', String(grid));
      modeBtn.querySelector('.when-single').hidden = grid;
      modeBtn.querySelector('.when-grid').hidden = !grid;
      counter.style.visibility = grid ? 'hidden' : 'visible';
    }
    function flip(el, from) {
      if (reduced || !el.animate) return;
      var to = el.getBoundingClientRect();
      if (!to.width || !to.height) return;
      el.animate([
        { transformOrigin: '0 0', transform: 'translate(' + (from.left - to.left) + 'px,' + (from.top - to.top) + 'px) scale(' + (from.width / to.width) + ',' + (from.height / to.height) + ')' },
        { transformOrigin: '0 0', transform: 'none' }
      ], { duration: 650, easing: 'cubic-bezier(.2,.8,.2,1)' });
    }
    function toGrid() {
      if (mode === 'grid') return;
      var big = slides[index].querySelector('.tool-panel');
      var from = big.getBoundingClientRect();
      carousel.hidden = true;
      gridWrap.hidden = false;
      mode = 'grid';
      setModeButton();
      shapes.forEach(drawShape);
      flip(minis[index], from);
      if (!reduced && minis[0].animate) {
        minis.forEach(function (m, i) {
          if (i === index) return;
          var side = i < index ? -1 : 1;
          m.animate([{ opacity: 0, transform: 'translateX(' + (side * 46) + 'px) scale(.92)' }, { opacity: 1, transform: 'none' }],
            { duration: 520, delay: 140 + Math.abs(i - index) * 60, easing: 'ease-out', fill: 'backwards' });
        });
        var gb = gridWrap.querySelector('.grid-bee');
        if (gb && gb.animate) gb.animate([{ opacity: 0, transform: 'translate(-60px,-40px) rotate(-18deg)' }, { opacity: 1, transform: 'none' }], { duration: 800, delay: 300, easing: 'ease-out', fill: 'backwards' });
      }
    }
    function toSingle(i) {
      var fromEl = mode === 'grid' ? minis[i] : null;
      var from = fromEl ? fromEl.getBoundingClientRect() : null;
      gridWrap.hidden = true;
      carousel.hidden = false;
      mode = 'single';
      index = i;
      setModeButton();
      render(true);
      shapes.forEach(drawShape);
      var big = slides[index].querySelector('.tool-panel');
      if (from) flip(big, from);
      var a = actor(index);
      if (a && !reduced) { a.classList.add('pose-arrive'); setTimeout(function () { a.classList.remove('pose-arrive'); }, 900); }
      var r = carousel.getBoundingClientRect();
      if (r.top < 0 || r.top > window.innerHeight * 0.6) carousel.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    }
    modeBtn.addEventListener('click', function () { if (mode === 'single') toGrid(); else toSingle(index); });
    minis.forEach(function (m, i) { m.addEventListener('click', function () { toSingle(i); }); });

    // À chaque visite, on commence en mode 1 (un outil à la fois).
    gridWrap.hidden = true;
    setModeButton();
    render(true);
  }

  /* ---------- Formulaires (Netlify Forms) ---------- */
  var isPreview = window.self !== window.top || location.protocol === 'file:';
  document.querySelectorAll('form[data-form]').forEach(function (form) {
    var lang = form.querySelector('input[name="langue"]');
    if (lang) lang.value = root.lang || 'fr';
    form.querySelectorAll('[data-show-when]').forEach(function (dep) {
      var rule = dep.getAttribute('data-show-when').split('=');
      var inputs = form.querySelectorAll('[name="' + rule[0] + '"]');
      function sync() {
        var val = '';
        inputs.forEach(function (inp) { if (inp.checked) val = inp.value; });
        dep.hidden = val !== rule[1];
      }
      inputs.forEach(function (inp) { inp.addEventListener('change', sync); });
      sync();
    });
    form.addEventListener('submit', function (e) {
      if (!isPreview) return;
      e.preventDefault();
      var st = form.querySelector('.form-status');
      if (st) { st.classList.add('show'); st.focus && st.focus(); }
    });
  });

  /* Langue de départ (déjà posée dans <head>, on synchronise les textes) */
  applyLang(root.lang === 'en' ? 'en' : 'fr');
})();
