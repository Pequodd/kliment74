/* Kliment v9 — page interactions. Shares window.k9 with washer.js. */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  /* ---------- smooth scroll ---------- */
  var lenis = null;
  if (!reduce && typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({ duration: 1.2, smoothWheel: true });
    if (hasGsap) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })();
  }
  function goTo(y) { if (lenis) lenis.scrollTo(y, { duration: 1.4 }); else window.scrollTo({ top: typeof y === 'number' ? y : y.getBoundingClientRect().top + scrollY, behavior: reduce ? 'auto' : 'smooth' }); }
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href').slice(1), el = id && document.getElementById(id);
      if (!el) return;
      e.preventDefault(); closeMenu(); goTo(el);
    });
  });

  /* ---------- header: light over light sections, hides on the way down ---------- */
  var top = $('.top'), hero = $('.hero'), lastY = 0, darkSecs = $$('.hero, .factory, .lead, .ft');
  function onScroll() {
    var y = scrollY, dark = false;
    for (var i = 0; i < darkSecs.length; i++) { var r = darkSecs[i].getBoundingClientRect(); if (r.top <= 30 && r.bottom > 30) { dark = true; break; } }
    top.classList.toggle('is-light', !dark);
    if (!menuOpen) {
      if (y > lastY + 4 && y > innerHeight * 0.8) top.classList.add('is-hidden');
      else if (y < lastY - 4) top.classList.remove('is-hidden');
    }
    lastY = y;
  }
  addEventListener('scroll', onScroll, { passive: true });

  /* ---------- menu ---------- */
  var mBtn = $('.menu-btn'), menu = $('#menu'), menuOpen = false;
  function openMenu() { menuOpen = true; menu.hidden = false; requestAnimationFrame(function () { menu.classList.add('is-open'); }); mBtn.setAttribute('aria-expanded', 'true'); document.body.classList.add('menu-open'); top.classList.remove('is-hidden', 'is-light'); if (lenis) lenis.stop(); }
  function closeMenu() { if (!menuOpen) return; menuOpen = false; menu.classList.remove('is-open'); mBtn.setAttribute('aria-expanded', 'false'); document.body.classList.remove('menu-open'); setTimeout(function () { if (!menuOpen) menu.hidden = true; }, 800); if (lenis) lenis.start(); onScroll(); }
  mBtn.addEventListener('click', function () { menuOpen ? closeMenu() : openMenu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  /* ---------- hero reel: stills cross-fade with a slow push-in, like footage ---------- */
  var shots = $$('.reel img'), bars = $$('.reel__bar span'), cur = 0;
  function show(i) {
    shots.forEach(function (s, k) { s.classList.toggle('is-on', k === i); });
    bars.forEach(function (b, k) { b.classList.remove('is-on'); b.classList.toggle('is-done', k < i); });
    void bars[i].offsetWidth; bars[i].classList.add('is-on');
  }
  show(0);
  if (!reduce) setInterval(function () { cur = (cur + 1) % shots.length; show(cur); }, 5000);

  /* ---------- words light up as you read ---------- */
  $$('[data-words]').forEach(function (p) {
    p.innerHTML = p.textContent.trim().split(/\s+/).map(function (w) { return '<span class="w">' + w + '</span>'; }).join(' ');
    var ws = $$('.w', p);
    if (!hasGsap || reduce) { ws.forEach(function (w) { w.classList.add('on'); }); return; }
    ScrollTrigger.create({ trigger: p, start: 'top 85%', end: 'bottom 55%', scrub: true,
      onUpdate: function (s) { var k = Math.round(s.progress * ws.length); ws.forEach(function (w, i) { w.classList.toggle('on', i < k); }); } });
  });

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-order]');
    if (b) { var sel = $('select[name="model"]'); if (sel) sel.value = b.dataset.order; }
  });

  /* ---------- reveals ---------- */
  if (hasGsap && !reduce) {
    gsap.from('.hero__h1 span, .hero__p, .hero__ctas, .hero__tag, .reel__bar', { y: 30, opacity: 0, duration: 1.3, stagger: .08, ease: 'expo.out', delay: .2 });
    gsap.from('.tiles .tile', { y: 40, opacity: 0, duration: 1, stagger: .06, ease: 'expo.out', scrollTrigger: { trigger: '.tiles', start: 'top 85%' } });
    gsap.from('.stats > div', { y: 24, opacity: 0, duration: .9, stagger: .06, ease: 'expo.out', scrollTrigger: { trigger: '.stats', start: 'top 85%' } });
    gsap.from('.mcol', { y: 50, opacity: 0, duration: 1.1, stagger: .08, ease: 'expo.out', scrollTrigger: { trigger: '.cmp', start: 'top 80%' } });
    gsap.from('.fcard', { y: 60, opacity: 0, duration: 1.1, stagger: .1, ease: 'expo.out', scrollTrigger: { trigger: '.fcards', start: 'top 85%' } });
    gsap.from('.claim__big', { scale: .9, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.claim', start: 'top 75%' } });
    gsap.fromTo('.claim__bg', { yPercent: -10 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.claim', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.fromTo('.quote__img img', { scale: 1.15 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.quote', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.fromTo('.about__img img', { scale: 1.15 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.about__img', start: 'top bottom', end: 'bottom top', scrub: true } });
  }

  /* ---------- counters ---------- */
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        var el = e.target, to = +el.dataset.count, t0 = performance.now();
        (function step(now) { var k = Math.min(1, (now - t0) / 1500); k = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(to * k); if (k < 1) requestAnimationFrame(step); })(t0);
      });
    }, { threshold: .6 });
    $$('[data-count]').forEach(function (n) { n.textContent = '0'; io.observe(n); });
  }

  /* ---------- form (no backend on GitHub Pages: hand off to the mail client) ---------- */
  var form = $('[data-form]');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var F = form.elements;
    var iName = F.namedItem('name'), iPhone = F.namedItem('phone'), iAgree = F.namedItem('agree'), iModel = F.namedItem('model'), iMsg = F.namedItem('msg');
    var name = iName.value.trim(), phone = iPhone.value.trim(), phoneOk = phone.replace(/\D/g, '').length >= 10;
    iName.closest('.f').classList.toggle('is-bad', !name);
    iPhone.closest('.f').classList.toggle('is-bad', !phoneOk);
    iAgree.closest('.agree').classList.toggle('is-bad', !iAgree.checked);
    if (!name) return iName.focus();
    if (!phoneOk) return iPhone.focus();
    if (!iAgree.checked) return iAgree.focus();
    var body = 'Имя: ' + name + '\nТелефон: ' + phone + '\nМодель: ' + iModel.value + (iMsg.value.trim() ? '\nДетали: ' + iMsg.value.trim() : '');
    window.location.href = 'mailto:klimentcompany@mail.ru?subject=' + encodeURIComponent('Заявка на КП — ' + iModel.value) + '&body=' + encodeURIComponent(body);
    $('.card__done', form).hidden = false;
  });

  onScroll();
  addEventListener('load', function () { if (hasGsap) ScrollTrigger.refresh(); });
})();
