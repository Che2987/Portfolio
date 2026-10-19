(function(){
  var rm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!rm) document.documentElement.classList.add('js');

  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !rm) {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, {threshold: .08});
    reveals.forEach(function(el){ io.observe(el); });
  } else {
    reveals.forEach(function(el){ el.classList.add('in'); });
  }

  var links = [].slice.call(document.querySelectorAll('.side-nav .side-link'));
  var secs = links.map(function(a){ return document.querySelector(a.getAttribute('href')); });
  var lock = false, lockTimer = 0, ticking = false;

  function setActive(i){
    links.forEach(function(a, j){
      var on = j === i;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
    });
  }
  function spy(){
    var ex = document.querySelector('.back-link'), dk = document.getElementById('impact');
    if (ex && dk) {
      var r = ex.getBoundingClientRect(), d = dk.getBoundingClientRect(), mid = r.top + r.height / 2;
      ex.classList.toggle('on-dark', mid >= d.top && mid <= d.bottom);
    }
    if (lock) return;
    var atBottom = window.innerHeight + window.pageYOffset >= document.documentElement.scrollHeight - 4;
    if (atBottom) { setActive(secs.length - 1); return; }
    var idx = 0;
    secs.forEach(function(s, i){
      if (s && s.getBoundingClientRect().top <= 120) idx = i;
    });
    setActive(idx);
  }
  window.addEventListener('scroll', function(){
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(function(){ ticking = false; spy(); });
    }
  }, {passive: true});
  window.addEventListener('resize', spy);
  links.forEach(function(a, i){
    a.addEventListener('click', function(){
      setActive(i);
      lock = true;
      clearTimeout(lockTimer);
      lockTimer = setTimeout(function(){ lock = false; spy(); }, 1200);
    });
  });
  spy();
})();
