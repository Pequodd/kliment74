/* Kliment v8 — page interactions */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  /* ---------- smooth scroll ---------- */
  var lenis = null;
  if (!reduce && typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    if (hasGsap) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })();
  }
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href').slice(1), el = id && document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(el, { offset: id === 'top' ? 0 : -60 }); else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  /* ---------- bar ---------- */
  var bar = $('.bar'), lastY = 0;
  addEventListener('scroll', function () {
    var y = scrollY;
    bar.classList.toggle('is-solid', y > 40);
    if (y > lastY + 4 && y > innerHeight) bar.classList.add('is-hidden');
    else if (y < lastY - 4) bar.classList.remove('is-hidden');
    lastY = y;
  }, { passive: true });

  /* ---------- magnetic ---------- */
  if (fine && !reduce) $$('[data-magnetic]').forEach(function (b) {
    b.addEventListener('pointermove', function (e) {
      var r = b.getBoundingClientRect();
      b.style.setProperty('--mx', ((e.clientX - r.left - r.width / 2) * 0.25) + 'px');
      b.style.setProperty('--my', ((e.clientY - r.top - r.height / 2) * 0.35) + 'px');
    });
    b.addEventListener('pointerleave', function () { b.style.setProperty('--mx', '0px'); b.style.setProperty('--my', '0px'); });
  });

  /* ---------- liquid hover on photos: the displacement swells in, then drains ---------- */
  var disp = document.querySelector('#liquid feDisplacementMap');
  if (fine && !reduce && disp && hasGsap) {
    var amt = { v: 0 };
    $$('[data-liquid]').forEach(function (f) {
      f.addEventListener('pointerenter', function () {
        f.classList.add('is-wet');
        gsap.fromTo(amt, { v: 0 }, { v: 26, duration: .5, ease: 'power2.out', onUpdate: function () { disp.setAttribute('scale', amt.v); } });
        gsap.to(amt, { v: 0, duration: 1.4, delay: .5, ease: 'power2.inOut', onUpdate: function () { disp.setAttribute('scale', amt.v); } });
      });
      f.addEventListener('pointerleave', function () { f.classList.remove('is-wet'); });
    });
  }

  /* ---------- choreography ---------- */
  if (hasGsap && !reduce) {
    gsap.from('.hero__machine', { yPercent: 18, opacity: 0, duration: 1.6, ease: 'expo.out', delay: .4 });
    gsap.from('.hero__foot > *, .hero__meta li', { y: 18, opacity: 0, duration: 1, stagger: .06, ease: 'expo.out', delay: .9 });
    gsap.to('.hero__machine', { yPercent: -12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

    $$('.h2').forEach(function (h) { gsap.from(h, { y: 40, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 88%' } }); });
    gsap.from('.say__text', { y: 50, opacity: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: '.say', start: 'top 75%' } });
    $$('.chip').forEach(function (c, i) { gsap.from(c, { width: 0, duration: 1.1, ease: 'expo.out', delay: .3 + i * .12, scrollTrigger: { trigger: '.say', start: 'top 75%' } }); });

    // the stack: each card sinks back a little as the next one slides over it
    var cards = $$('.card');
    cards.forEach(function (c, i) {
      var next = cards[i + 1];
      if (!next) return;
      gsap.to(c, { scale: .94, opacity: .55, ease: 'none', scrollTrigger: { trigger: next, start: 'top bottom', end: 'top 20%', scrub: true } });
    });

    gsap.from('.rows li', { y: 24, opacity: 0, duration: .8, stagger: .06, ease: 'expo.out', scrollTrigger: { trigger: '.rows', start: 'top 85%' } });
    $$('.ph').forEach(function (p) {
      gsap.fromTo(p, { clipPath: 'inset(12% 12% 12% 12% round 16px)' }, { clipPath: 'inset(0% 0% 0% 0% round 16px)', ease: 'none', scrollTrigger: { trigger: p, start: 'top 95%', end: 'top 50%', scrub: true } });
    });
  }

  /* ---------- counters ---------- */
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        var el = e.target, to = +el.dataset.count, t0 = performance.now();
        (function step(now) { var k = Math.min(1, (now - t0) / 1400); k = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(to * k); if (k < 1) requestAnimationFrame(step); })(t0);
      });
    }, { threshold: .6 });
    $$('[data-count]').forEach(function (n) { n.textContent = '0'; io.observe(n); });
  }

  /* ---------- model buttons preselect the form ---------- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-order]');
    if (b) { var sel = $('select[name="model"]'); if (sel) sel.value = b.dataset.order; }
  });

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
    $('.form__done', form).hidden = false;
  });

  addEventListener('load', function () { if (hasGsap) ScrollTrigger.refresh(); });
})();
