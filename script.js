/* durchgeplant · Interaktion & Animationen */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* ---------- Mobile-Navigation ---------- */
  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
    });
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- Gestaffelte Reveal-Animationen ---------- */
  var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  // Verzögerung je nach Position innerhalb der Geschwister-Gruppe (Stagger)
  if (!reduce) {
    reveals.forEach(function (el) {
      var sibs = el.parentNode.querySelectorAll(':scope > .reveal');
      var idx = Array.prototype.indexOf.call(sibs, el);
      el.style.setProperty('--stagger', Math.min(idx < 0 ? 0 : idx, 6) * 70 + 'ms');
    });
  }
  function inViewport(el, ratio) {
    var r = el.getBoundingClientRect();
    var vh = window.innerHeight || document.documentElement.clientHeight;
    return r.top < vh * (ratio || 0.92) && r.bottom > 0;
  }
  if (reduce || !hasIO) {
    reveals.forEach(function (el) { el.classList.add('in'); });
  } else {
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          revealIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });
    // Bereits sichtbare Elemente sofort einblenden (unabhängig vom IO-Timing),
    // den Rest beim Scrollen aufdecken.
    reveals.forEach(function (el) {
      if (inViewport(el)) { el.classList.add('in'); }
      else { revealIO.observe(el); }
    });
    // Sicherheitsnetz: sollte die Transition eines sichtbaren Elements hängen
    // bleiben, wird es nach 2,5 s per Inline-Stil garantiert eingeblendet.
    // Nur für Elemente im/nahe Viewport – Inhalte unterhalb bleiben fürs
    // Scroll-Reveal reserviert.
    setTimeout(function () {
      reveals.forEach(function (el) {
        if (inViewport(el)) { el.style.opacity = '1'; el.style.transform = 'none'; }
      });
    }, 2500);
  }

  /* ---------- Hochzählende Kennzahlen ---------- */
  function animateCount(el) {
    var to = parseFloat(el.getAttribute('data-to')) || 0;
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduce) { el.textContent = to + suffix; return; }
    var dur = 1400, start = null;
    function frame(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      el.textContent = Math.round(to * eased) + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  var counters = Array.prototype.slice.call(document.querySelectorAll('.count'));
  if (reduce || !hasIO) {
    counters.forEach(function (el) {
      el.textContent = (el.getAttribute('data-to') || '') + (el.getAttribute('data-suffix') || '');
    });
  } else {
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

  /* ---------- Scroll-Fortschrittsbalken + Header-Zustand + Parallax ---------- */
  var progress = document.getElementById('scrollProgress');
  var header = document.querySelector('.site-header');
  var grid = document.querySelector('.hero-grid-bg');
  var cue = document.getElementById('scrollCue');
  var ticking = false;

  function onScroll() {
    var y = window.pageYOffset || document.documentElement.scrollTop;
    var docH = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.transform = 'scaleX(' + (docH > 0 ? y / docH : 0) + ')';
    if (header) header.classList.toggle('scrolled', y > 8);
    if (grid && !reduce) grid.style.transform = 'translateY(' + (y * 0.15) + 'px)';
    if (cue) cue.style.opacity = y > 120 ? '0' : '';
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  /* ---------- Aktiver Navigationspunkt ---------- */
  var navAnchors = Array.prototype.slice.call(document.querySelectorAll('.nav-links a'));
  var sections = navAnchors
    .map(function (a) { return document.querySelector(a.getAttribute('href')); })
    .filter(Boolean);
  if (sections.length && hasIO) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var id = entry.target.getAttribute('id');
          navAnchors.forEach(function (a) {
            a.classList.toggle('active', a.getAttribute('href') === '#' + id);
          });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- Jahr im Footer ---------- */
  var year = document.getElementById('year');
  if (year) { year.textContent = new Date().getFullYear(); }
})();
