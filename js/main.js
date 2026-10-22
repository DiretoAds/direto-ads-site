(function () {
  'use strict';

  var reduceMotionQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  var finePointerQ = window.matchMedia('(pointer: fine)');
  var tiltEnabled = finePointerQ.matches && !reduceMotionQ.matches;

  /* ------------------------------------------------------------------ *
   * Sticky header: condense on scroll, hide on scroll-down, reveal on
   * scroll-up. Keeps the header visible while the mobile menu is open.
   * ------------------------------------------------------------------ */
  (function header() {
    var header = document.getElementById('siteHeader');
    var navToggle = document.getElementById('navToggle');
    var navLinks = document.getElementById('navLinks');
    if (!header) return;

    var lastY = window.scrollY;
    var ticking = false;

    function onScroll() {
      var y = window.scrollY;
      header.classList.toggle('is-scrolled', y > 16);

      var menuOpen = navLinks && navLinks.classList.contains('is-open');
      if (!menuOpen) {
        if (y > lastY && y > 140) {
          header.classList.add('is-hidden');
        } else {
          header.classList.remove('is-hidden');
        }
      }
      lastY = y;
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(onScroll);
        ticking = true;
      }
    }, { passive: true });

    if (navToggle && navLinks) {
      navToggle.addEventListener('click', function () {
        var open = navLinks.classList.toggle('is-open');
        navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      navLinks.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () {
          navLinks.classList.remove('is-open');
          navToggle.setAttribute('aria-expanded', 'false');
        });
      });
    }
  })();

  /* ------------------------------------------------------------------ *
   * Active section highlight in the nav
   * ------------------------------------------------------------------ */
  (function activeSection() {
    var links = Array.prototype.slice.call(document.querySelectorAll('[data-section-link]'));
    if (!links.length || !('IntersectionObserver' in window)) return;
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('data-section-link')] = a; });

    var sections = Object.keys(map)
      .map(function (id) { return document.getElementById(id); })
      .filter(Boolean);

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = map[entry.target.id];
        if (!link) return;
        if (entry.isIntersecting) {
          links.forEach(function (a) { a.removeAttribute('aria-current'); });
          link.setAttribute('aria-current', 'section');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sections.forEach(function (s) { observer.observe(s); });
  })();

  /* ------------------------------------------------------------------ *
   * Scroll reveal — single elements ([data-reveal]) and staggered
   * groups ([data-reveal-group] > *).
   * ------------------------------------------------------------------ */
  (function reveal() {
    var singles = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
    if (!singles.length) return;

    if (!('IntersectionObserver' in window)) {
      singles.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add('is-visible');
        obs.unobserve(el);

        if (el.hasAttribute('data-reveal-group')) {
          Array.prototype.forEach.call(el.children, function (child) {
            child.addEventListener('animationend', function handler() {
              child.classList.add('reveal-done');
              child.removeEventListener('animationend', handler);
            });
          });
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

    singles.forEach(function (el) { observer.observe(el); });
  })();

  /* ------------------------------------------------------------------ *
   * Bars that fill on reveal: ROAS bars, funnel bars, browser chart
   * ------------------------------------------------------------------ */
  (function fillBars() {
    var targets = Array.prototype.slice.call(
      document.querySelectorAll('.roas-fill, .funnel-fill, #trackChart')
    );
    if (!targets.length) return;

    function runFill(el) {
      if (el.id === 'trackChart') {
        el.querySelectorAll('span[data-h]').forEach(function (bar) {
          bar.style.height = bar.getAttribute('data-h') + '%';
        });
        return;
      }
      var w = parseFloat(el.getAttribute('data-width'));
      if (!isNaN(w)) el.style.width = w + '%';
    }

    if (!('IntersectionObserver' in window)) {
      targets.forEach(runFill);
      return;
    }

    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        runFill(entry.target);
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.4 });

    targets.forEach(function (el) { observer.observe(el); });
  })();

  /* ------------------------------------------------------------------ *
   * Flow section: fill the connecting line and light up each step in
   * sequence once the section scrolls into view.
   * ------------------------------------------------------------------ */
  (function flow() {
    var section = document.getElementById('como-funciona');
    var fill = document.getElementById('flowLineFill');
    var steps = document.querySelectorAll('#flowSteps .flow-step');
    if (!section || !steps.length) return;

    function run() {
      if (fill) fill.style.width = '100%';
      steps.forEach(function (step, i) {
        setTimeout(function () { step.classList.add('is-active'); }, i * 220);
      });
    }

    if (!('IntersectionObserver' in window)) { run(); return; }
    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { run(); obs.disconnect(); }
      });
    }, { threshold: 0.35 });
    observer.observe(section);
  })();

  /* ------------------------------------------------------------------ *
   * Pointer-reactive tilt for feature/benefit cards
   * ------------------------------------------------------------------ */
  (function tiltCards() {
    if (!tiltEnabled) return;
    document.querySelectorAll('[data-tilt]').forEach(function (el) {
      var max = 6;
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = 'perspective(800px) rotateX(' + (-py * max).toFixed(2) + 'deg) rotateY(' + (px * max).toFixed(2) + 'deg) translateY(-4px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  })();

  /* ------------------------------------------------------------------ *
   * Phone / device rig tilt — mockups react to pointer position
   * ------------------------------------------------------------------ */
  function attachRigTilt(stageId, rigId, restX, restY, max) {
    var stage = document.getElementById(stageId);
    var rig = document.getElementById(rigId);
    if (!rig) return;
    rig.style.setProperty('--rx', restX + 'deg');
    rig.style.setProperty('--ry', restY + 'deg');
    if (!tiltEnabled || !stage) return;
    stage.addEventListener('pointermove', function (e) {
      var r = stage.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      rig.style.setProperty('--rx', (restX - py * max).toFixed(2) + 'deg');
      rig.style.setProperty('--ry', (restY + px * max).toFixed(2) + 'deg');
    });
    stage.addEventListener('pointerleave', function () {
      rig.style.setProperty('--rx', restX + 'deg');
      rig.style.setProperty('--ry', restY + 'deg');
    });
  }
  attachRigTilt('heroStage', 'heroRig', 6, -18, 16);
  attachRigTilt('trackStage', 'trackRig', 4, -10, 12);
  attachRigTilt('payStage', 'payRig', 4, 10, 12);
  attachRigTilt('payStage2', 'payRig2', 4, 10, 12);

  /* ------------------------------------------------------------------ *
   * Subtle scroll parallax for device mockups
   * ------------------------------------------------------------------ */
  (function parallax() {
    if (reduceMotionQ.matches) return;
    var els = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
    if (!els.length) return;
    var ticking = false;

    function update() {
      var vh = window.innerHeight;
      els.forEach(function (el) {
        var speed = parseFloat(el.getAttribute('data-parallax-speed')) || 0.06;
        var r = el.getBoundingClientRect();
        var center = r.top + r.height / 2 - vh / 2;
        el.style.transform = 'translateY(' + (center * -speed).toFixed(2) + 'px)';
      });
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  })();

  /* ------------------------------------------------------------------ *
   * Contact form — front-end only demonstration
   * ------------------------------------------------------------------ */
  (function contactForm() {
    var form = document.getElementById('contactForm');
    var formCard = document.getElementById('formCard');
    var success = document.getElementById('formSuccess');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      formCard.classList.add('submitted');
      success.classList.add('show');
      success.setAttribute('tabindex', '-1');
      success.focus();
    });
  })();

})();
