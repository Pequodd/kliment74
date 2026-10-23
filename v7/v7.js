/* Kliment v7 — page interactions: bubbles, filling tanks, wet glass, the start button. */
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
    lenis = new Lenis({ duration: 1.2, smoothWheel: true });
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
      if (lenis) lenis.scrollTo(el); else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  /* ---------- nav hides on the way down ---------- */
  var nav = $('.nav'), lastY = 0;
  addEventListener('scroll', function () {
    var y = scrollY;
    if (y > lastY + 4 && y > innerHeight * 0.7) nav.classList.add('is-hidden');
    else if (y < lastY - 4) nav.classList.remove('is-hidden');
    lastY = y;
  }, { passive: true });

  /* ---------- magnetic ---------- */
  if (fine && !reduce) $$('[data-magnetic]').forEach(function (b) {
    b.addEventListener('pointermove', function (e) {
      var r = b.getBoundingClientRect();
      b.style.setProperty('--mx', ((e.clientX - r.left - r.width / 2) * 0.25) + 'px');
      b.style.setProperty('--my', ((e.clientY - r.top - r.height / 2) * 0.3) + 'px');
    });
    b.addEventListener('pointerleave', function () { b.style.setProperty('--mx', '0px'); b.style.setProperty('--my', '0px'); });
  });

  /* ---------- soap bubbles rising ---------- */
  $$('canvas.bubbles').forEach(function (cv) {
    if (reduce) return;
    var ctx = cv.getContext('2d'), n = +cv.dataset.bubbles || 20, bs = [], w = 0, h = 0, dpr = Math.min(devicePixelRatio || 1, 2), on = false;
    var dark = !!cv.closest('.hero, .lead');
    function size() { w = cv.clientWidth; h = cv.clientHeight; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    function spawn(b, any) { b.r = 4 + Math.random() * 22; b.x = Math.random() * w; b.y = any ? Math.random() * h : h + b.r + Math.random() * 80; b.v = 12 + Math.random() * 30 * (12 / b.r); b.ph = Math.random() * 6.28; return b; }
    size(); for (var i = 0; i < n; i++) bs.push(spawn({}, true));
    addEventListener('resize', size);
    new IntersectionObserver(function (es) { on = es[0].isIntersecting; }).observe(cv);
    var t0 = performance.now();
    (function loop(now) {
      requestAnimationFrame(loop);
      if (!on) { t0 = now; return; }
      var dt = Math.min(0.05, (now - t0) / 1000); t0 = now;
      ctx.clearRect(0, 0, w, h);
      bs.forEach(function (b) {
        b.y -= b.v * dt; b.ph += dt * 1.5;
        var x = b.x + Math.sin(b.ph) * b.r * 0.6;
        if (b.y < -b.r * 2) spawn(b, false);
        ctx.beginPath(); ctx.arc(x, b.y, b.r, 0, 6.283);
        ctx.strokeStyle = dark ? 'rgba(200,235,255,.35)' : 'rgba(70,140,200,.25)'; ctx.lineWidth = 1.2; ctx.stroke();
        var g = ctx.createRadialGradient(x - b.r * .35, b.y - b.r * .35, 0, x, b.y, b.r);
        g.addColorStop(0, dark ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.8)'); g.addColorStop(.35, 'rgba(255,255,255,0)'); g.addColorStop(1, dark ? 'rgba(150,220,255,.12)' : 'rgba(120,190,240,.12)');
        ctx.fillStyle = g; ctx.fill();
      });
    })(t0);
  });

  /* ---------- tanks fill when they come into view ---------- */
  if ('IntersectionObserver' in window) {
    var tio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-filled'); tio.unobserve(e.target); } });
    }, { threshold: .4 });
    $$('.tank').forEach(function (t, i) { t.style.transitionDelay = (i * 0.08) + 's'; $('.tank__water', t).style.transitionDelay = (0.2 + i * 0.15) + 's'; tio.observe(t); });
  } else $$('.tank').forEach(function (t) { t.classList.add('is-filled'); });

  /* ---------- drop numbers stay upright inside the rotated drop ---------- */
  $$('.drop').forEach(function (d) { d.innerHTML = '<span>' + d.textContent + '</span>'; });

  /* ---------- wet glass on the factory photo ---------- */
  var wet = $('.factory__drops');
  if (wet) {
    var seed = 3, rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (var k = 0; k < 46; k++) {
      var d = document.createElement('i'), s = 4 + Math.pow(rnd(), 2.4) * 34;
      d.style.cssText = 'left:' + (rnd() * 100) + '%;top:' + (rnd() * 100) + '%;width:' + s + 'px;height:' + (s * (1 + rnd() * .25)) + 'px';
      wet.appendChild(d);
    }
    if (hasGsap && !reduce) $$('i', wet).forEach(function (d) {
      if (Math.random() < .25) gsap.to(d, { y: 40 + Math.random() * 120, duration: 4 + Math.random() * 6, ease: 'power1.in', repeat: -1, delay: Math.random() * 6, repeatDelay: Math.random() * 3 });
    });
  }

  /* ---------- reveals ---------- */
  if (hasGsap && !reduce) {
    gsap.from('.hero__h1 span', { yPercent: 60, opacity: 0, duration: 1.4, stagger: .12, ease: 'expo.out', delay: .2 });
    gsap.from('.hero .kicker, .hero__p, .hero__ctas', { y: 24, opacity: 0, duration: 1, stagger: .08, ease: 'expo.out', delay: .6 });
    $$('.h2').forEach(function (h) { gsap.from(h, { y: 40, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 88%' } }); });
    gsap.from('.vs__row', { x: -30, opacity: 0, duration: .9, stagger: .08, ease: 'expo.out', scrollTrigger: { trigger: '.vs', start: 'top 80%' } });
    gsap.from('.drops li', { y: -60, opacity: 0, duration: 1.1, stagger: .1, ease: 'bounce.out', scrollTrigger: { trigger: '.drops', start: 'top 80%' } });
    gsap.from('.pills li', { scale: .85, opacity: 0, duration: .9, stagger: .07, ease: 'back.out(1.7)', scrollTrigger: { trigger: '.pills', start: 'top 85%' } });
    gsap.from('.panel', { y: 60, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.lead', start: 'top 70%' } });
  }

  /* ---------- model buttons preselect the form ---------- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-order]');
    if (b) { var sel = $('select[name="model"]'); if (sel) sel.value = b.dataset.order; }
  });

  /* ---------- the start button (no backend on GitHub Pages: hand off to the mail client) ---------- */
  var form = $('[data-form]');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var F = form.elements;
    var iName = F.namedItem('name'), iPhone = F.namedItem('phone'), iAgree = F.namedItem('agree'), iModel = F.namedItem('model'), iMsg = F.namedItem('msg');
    var name = iName.value.trim(), phone = iPhone.value.trim(), phoneOk = phone.replace(/\D/g, '').length >= 10;
    iName.closest('.pf').classList.toggle('is-bad', !name);
    iPhone.closest('.pf').classList.toggle('is-bad', !phoneOk);
    iAgree.closest('.agree').classList.toggle('is-bad', !iAgree.checked);
    if (!name) return iName.focus();
    if (!phoneOk) return iPhone.focus();
    if (!iAgree.checked) return iAgree.focus();
    form.classList.add('is-running');
    var body = 'Имя: ' + name + '\nТелефон: ' + phone + '\nМодель: ' + iModel.value + (iMsg.value.trim() ? '\nДетали: ' + iMsg.value.trim() : '');
    setTimeout(function () {
      window.location.href = 'mailto:klimentcompany@mail.ru?subject=' + encodeURIComponent('Заявка на КП — ' + iModel.value) + '&body=' + encodeURIComponent(body);
      $('.panel__done', form).hidden = false;
    }, reduce ? 0 : 700);
  });
})();
