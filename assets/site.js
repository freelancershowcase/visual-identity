(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. Put each mark where it is asked for: <div data-mark="fold"></div>
  document.querySelectorAll('[data-mark]').forEach(function (el) {
    el.innerHTML = window.MARKS[el.getAttribute('data-mark')];
  });

  // 2. The move: replays on hover, focus or tap, and once when a tile first comes into view.
  function play(el) {
    if (reduce) return;
    el.classList.remove('play');
    void el.offsetWidth;
    el.classList.add('play');
  }
  document.querySelectorAll('.tile, [data-play]').forEach(function (el) {
    el.addEventListener('mouseenter', function () { play(el); });
    el.addEventListener('focus', function () { play(el); });
  });
  if ('IntersectionObserver' in window) {
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { setTimeout(function () { play(e.target); }, 250); seen.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    document.querySelectorAll('.tile').forEach(function (t) { seen.observe(t); });
  }

  // 3. Brand page opener: start on one detail, pull back to the whole mark as you scroll.
  var opener = document.querySelector('.opener');
  if (opener) {
    var svg = opener.querySelector('svg');
    var from = opener.getAttribute('data-from').split(' ').map(Number);
    var to = svg.getAttribute('viewBox').split(' ').map(Number);
    var played = false;
    function ease(t) { return 1 - Math.pow(1 - t, 3); }
    function frame() {
      var r = opener.getBoundingClientRect();
      var span = opener.offsetHeight - window.innerHeight;
      var p = reduce ? 1 : Math.min(1, Math.max(0, (58 - r.top) / (span * 0.8)));
      // zoom in log space so the pull-back feels even
      var k = ease(p), vb = [];
      for (var i = 0; i < 4; i++) {
        vb[i] = i < 2 ? from[i] + (to[i] - from[i]) * k : Math.exp(Math.log(from[i]) + (Math.log(to[i]) - Math.log(from[i])) * k);
      }
      // keep the detail's centre steady early on
      svg.setAttribute('viewBox', vb.map(function (n) { return n.toFixed(2); }).join(' '));
      opener.style.setProperty('--p', Math.min(1, p * 2.2).toFixed(3));
      opener.classList.toggle('done', p >= 1);
      if (p >= 1 && !played) { played = true; play(opener); }
      if (p < 0.9) played = false;
    }
    window.addEventListener('scroll', frame, { passive: true });
    window.addEventListener('resize', frame);
    frame();
  }

  // 4. Lightbox for every zoomable image
  var items = Array.prototype.slice.call(document.querySelectorAll('[data-full]'));
  if (items.length) {
    var lb = document.createElement('div');
    lb.className = 'lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Image viewer');
    lb.innerHTML = '<div class="bar"><span class="t"></span><span><button type="button" class="pv" aria-label="Previous image">←</button> <button type="button" class="nx" aria-label="Next image">→</button> <button type="button" class="x">Close</button></span></div><div class="pic"><img alt=""></div>';
    document.body.appendChild(lb);
    var img = lb.querySelector('img'), title = lb.querySelector('.t'), cur = 0, back = null;
    function show(i) {
      cur = (i + items.length) % items.length;
      var it = items[cur];
      img.src = it.getAttribute('data-full');
      img.alt = it.querySelector('img') ? it.querySelector('img').alt : '';
      title.textContent = (it.getAttribute('data-title') || img.alt) + '  ·  ' + (cur + 1) + ' / ' + items.length;
      lb.querySelector('.pic').scrollTop = 0;
    }
    function open(i) { back = document.activeElement; show(i); lb.classList.add('on'); document.body.style.overflow = 'hidden'; lb.querySelector('.x').focus(); }
    function close() { lb.classList.remove('on'); document.body.style.overflow = ''; if (back) back.focus(); }
    items.forEach(function (it, i) { it.addEventListener('click', function () { open(i); }); });
    lb.querySelector('.x').addEventListener('click', close);
    lb.querySelector('.pv').addEventListener('click', function () { show(cur - 1); });
    lb.querySelector('.nx').addEventListener('click', function () { show(cur + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.classList.contains('pic')) close(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('on')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') show(cur + 1);
      if (e.key === 'ArrowLeft') show(cur - 1);
    });
  }
})();
