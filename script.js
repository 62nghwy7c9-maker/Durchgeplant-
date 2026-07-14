/* durchgeplant · Interaktion & Animationen
   Absturzsicher: Jeder Abschnitt ist isoliert. Schlägt irgendetwas fehl,
   wird die js-Klasse entfernt und ALLER Inhalt ist sofort sichtbar. */
(function () {
  'use strict';

  function showEverything() {
    try {
      var root = document.documentElement;
      root.className = root.className.replace(/\bjs\b/g, ' ');
    } catch (e) { /* letzte Rettung unten */ }
    try {
      var els = document.querySelectorAll('.reveal');
      for (var i = 0; i < els.length; i++) {
        els[i].style.transition = 'none';
        els[i].style.opacity = '1';
        els[i].style.transform = 'none';
      }
    } catch (e2) {}
  }

  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var hasIO = typeof window.IntersectionObserver === 'function';

  /* Die js-Klasse (versteckt .reveal-Inhalte fürs Einblenden) wird NUR gesetzt,
     wenn dieses Script läuft und der Browser alles Nötige kann. Lädt das Script
     nicht oder fehlt die Technik, bleibt die Seite vollständig sichtbar. */
  if (!reduce && hasIO && typeof window.requestAnimationFrame === 'function') {
    try { document.documentElement.className += ' js'; } catch (e) {}
  }

  /* ---------- Sicherheitsnetz ZUERST: nach 2 s ist sichtbarer Inhalt garantiert da ---------- */
  try {
    setTimeout(function () {
      try {
        var els = document.querySelectorAll('.reveal');
        var vh = window.innerHeight || document.documentElement.clientHeight || 800;
        for (var i = 0; i < els.length; i++) {
          var r = els[i].getBoundingClientRect();
          var op = 1;
          try { op = parseFloat(getComputedStyle(els[i]).opacity); } catch (e0) {}
          // Was im sichtbaren Bereich liegt und immer noch (halb) unsichtbar
          // ist – egal warum – wird hart eingeblendet.
          if (r.top < vh && r.bottom > 0 && !(op >= 0.99)) {
            els[i].style.transition = 'none';
            els[i].style.opacity = '1';
            els[i].style.transform = 'none';
          }
        }
      } catch (e) { showEverything(); }
    }, 2000);
  } catch (e) { showEverything(); }

  /* ---------- Mobile-Navigation ---------- */
  try {
    var toggle = document.getElementById('navToggle');
    var links = document.getElementById('navLinks');
    if (toggle && links) {
      toggle.addEventListener('click', function () {
        var open = links.classList.toggle('open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        toggle.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
      });
      links.addEventListener('click', function (e) {
        if (e.target && e.target.tagName === 'A') {
          links.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
    }
  } catch (e) {}

  /* ---------- Reveal-Animationen ---------- */
  function inViewport(el, ratio) {
    var r = el.getBoundingClientRect();
    var vh = window.innerHeight || document.documentElement.clientHeight;
    return r.top < vh * (ratio || 0.92) && r.bottom > 0;
  }

  try {
    var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));

    if (reduce || !hasIO) {
      showEverything();
    } else {
      // Stagger: Position unter den .reveal-Geschwistern (ohne :scope – reine DOM-Iteration)
      reveals.forEach(function (el) {
        try {
          var kids = el.parentNode ? el.parentNode.children : [];
          var idx = 0, found = 0;
          for (var i = 0; i < kids.length; i++) {
            if (kids[i].classList && kids[i].classList.contains('reveal')) {
              if (kids[i] === el) { idx = found; break; }
              found++;
            }
          }
          el.style.setProperty('--stagger', Math.min(idx, 6) * 70 + 'ms');
        } catch (e) {}
      });

      var revealIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            revealIO.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });

      var initial = [];
      reveals.forEach(function (el) {
        if (inViewport(el)) { initial.push(el); }
        else { revealIO.observe(el); }
      });
      // Erst im nächsten Frame einblenden, damit die Eingangs-Animation
      // sauber abspielt (die js-Klasse wurde soeben erst gesetzt).
      window.requestAnimationFrame(function () {
        initial.forEach(function (el) { el.classList.add('in'); });
      });
    }
  } catch (e) { showEverything(); }

  /* ---------- Hochzählende Kennzahlen ----------
     HTML enthält bereits den Endwert – JS zählt nur sichtbar hoch. */
  try {
    function animateCount(el) {
      var to = parseFloat(el.getAttribute('data-to')) || 0;
      var suffix = el.getAttribute('data-suffix') || '';
      var dur = 1400, start = null;
      function frame(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.innerHTML = Math.round(to * eased) + suffix;
        if (p < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }
    var counters = Array.prototype.slice.call(document.querySelectorAll('.count'));
    if (!reduce && hasIO && typeof window.requestAnimationFrame === 'function') {
      var countIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { animateCount(entry.target); countIO.unobserve(entry.target); }
        });
      }, { threshold: 0.6 });
      counters.forEach(function (el) {
        if (inViewport(el, 1)) { animateCount(el); }
        else { countIO.observe(el); }
      });
    }
    // andernfalls: HTML zeigt bereits die Endwerte – nichts zu tun
  } catch (e) {}

  /* ---------- Scroll-Fortschritt + Header + Parallax ---------- */
  try {
    var progress = document.getElementById('scrollProgress');
    var header = document.querySelector('.site-header');
    var grid = document.querySelector('.hero-grid-bg');
    var cue = document.getElementById('scrollCue');
    var ticking = false;
    var raf = typeof window.requestAnimationFrame === 'function'
      ? window.requestAnimationFrame.bind(window)
      : function (fn) { fn(); };

    function onScroll() {
      var y = window.pageYOffset || document.documentElement.scrollTop || 0;
      var docH = (document.documentElement.scrollHeight || 0) - (window.innerHeight || 0);
      if (progress) progress.style.transform = 'scaleX(' + (docH > 0 ? y / docH : 0) + ')';
      if (header && header.classList) header.classList[y > 8 ? 'add' : 'remove']('scrolled');
      if (grid && !reduce) grid.style.transform = 'translateY(' + (y * 0.15) + 'px)';
      if (cue) cue.style.opacity = y > 120 ? '0' : '';
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { raf(onScroll); ticking = true; }
    }, { passive: true });
    onScroll();
  } catch (e) {}

  /* ---------- Jahr im Footer ---------- */
  try {
    var year = document.getElementById('year');
    if (year) { year.textContent = new Date().getFullYear(); }
  } catch (e) {}
})();
