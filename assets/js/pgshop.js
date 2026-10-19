(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Scroll-reveal
  if (!reduce) {
    var targets = document.querySelectorAll('.sec-block, .case-context, .case-hero');
    targets.forEach(function (el) { el.classList.add('reveal'); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    targets.forEach(function (el) { io.observe(el); });
  }

  // Side nav scroll-spy
  var nav = document.querySelector('.side-nav');
  if (!nav) return;
  var links = Array.prototype.slice.call(nav.querySelectorAll('.side-link'));
  var sections = links
    .map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); })
    .filter(Boolean);
  var REF_LINE = 120;
  var locked = null, lockTimer = null, ticking = false;

  function setActive(id) {
    links.forEach(function (a) {
      var on = a.getAttribute('href') === '#' + id;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
  }

  var backLink = document.querySelector('.back-link');
  var darkSec = document.querySelector('.sec-block.dark');
  function updateBack() {
    if (!backLink || !darkSec) return;
    var r = backLink.getBoundingClientRect();
    var d = darkSec.getBoundingClientRect();
    var mid = (r.top + r.bottom) / 2;
    backLink.classList.toggle('on-dark', mid >= d.top && mid <= d.bottom);
  }

  function update() {
    ticking = false;
    updateBack();
    if (locked) { setActive(locked); return; }
    var last = sections[sections.length - 1];
    // The final section can never scroll its top up to the reference line,
    // so at the bottom of the page it is always the active one.
    var atBottom = (window.innerHeight + window.pageYOffset) >= (document.documentElement.scrollHeight - 4);
    if (atBottom && last) { setActive(last.id); return; }
    var current = null;
    for (var i = 0; i < sections.length; i++) {
      if (sections[i].getBoundingClientRect().top <= REF_LINE) current = sections[i];
      else break;
    }
    // At the very top the hero's edge can sit just below the line, so default to the first section.
    if (!current && sections.length) current = sections[0];
    if (current) setActive(current.id);
  }

  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  links.forEach(function (a) {
    a.addEventListener('click', function () {
      // Hold the clicked link while the smooth scroll runs, then hand back to the spy.
      var id = a.getAttribute('href').slice(1);
      locked = id;
      setActive(id);
      clearTimeout(lockTimer);
      lockTimer = setTimeout(function () { locked = null; update(); }, reduce ? 50 : 1200);
    });
  });

  update();
})();
