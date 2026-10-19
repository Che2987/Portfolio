(function () {
  document.documentElement.classList.add('js');

  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  var links = Array.prototype.slice.call(document.querySelectorAll('.side-nav a'));
  if (!links.length) return;
  var sections = links
    .map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); })
    .filter(Boolean);
  var linkFor = {};
  sections.forEach(function (section, i) { linkFor[section.id] = links[i]; });

  var setActive = function (id) {
    links.forEach(function (l) { l.classList.remove('active'); });
    var link = id && linkFor[id];
    if (link) link.classList.add('active');
  };

  var REF_LINE = 120;
  var ticking = false;
  var lockId = null, lockTimer = null;
  function updateActive() {
    ticking = false;
    var exit = document.querySelector('.back-link');
    if (exit) {
      var er = exit.getBoundingClientRect();
      var my = er.top + er.height / 2;
      var onDark = false;
      document.querySelectorAll('.block.dark').forEach(function (d) {
        var r = d.getBoundingClientRect();
        if (my >= r.top && my <= r.bottom) onDark = true;
      });
      exit.classList.toggle('on-dark', onDark);
    }
    if (lockId) { setActive(lockId); return; }
    var current = null;
    for (var i = 0; i < sections.length; i++) {
      if (sections[i].getBoundingClientRect().top - REF_LINE <= 0) current = sections[i];
      else break;
    }
    // The last section can never scroll its top up to the reference line,
    // so at the bottom of the page the final section is the active one.
    var atBottom = window.innerHeight + window.pageYOffset >= document.documentElement.scrollHeight - 4;
    if (atBottom && sections.length) current = sections[sections.length - 1];
    setActive(current && current.id);
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { window.requestAnimationFrame(updateActive); ticking = true; }
  }, { passive: true });
  links.forEach(function (a) {
    a.addEventListener('click', function () {
      // Hold the clicked link as active while the smooth scroll runs, then
      // release the lock so the scroll-spy takes over again.
      lockId = a.getAttribute('href').slice(1);
      setActive(lockId);
      clearTimeout(lockTimer);
      lockTimer = setTimeout(function () { lockId = null; updateActive(); }, 1200);
    });
  });
  updateActive();
})();
