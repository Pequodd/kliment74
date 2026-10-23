/* Kliment v5 — page choreography. The 3D machine lives in machine.js and reads window.kl.p. */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  window.kl = { p: 0, reduce: reduce };

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
      if (lenis) lenis.scrollTo(el, { duration: 1.6 }); else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  /* ---------- film: scroll progress drives the machine and the captions ---------- */
  var film = $('.film'), scenes = $$('.scene'), rails = $$('.rail li'), hint = $('.film__hint');
  var BOUNDS = [0, 0.14, 0.34, 0.52, 0.8]; // where each scene starts
  var cur = 0;
  function setScene(i) {
    if (i === cur) return;
    cur = i;
    scenes.forEach(function (s, k) { s.classList.toggle('is-on', k === i); });
    rails.forEach(function (r, k) { r.classList.toggle('is-on', k === i); });
  }
  function onFilm() {
    var r = film.getBoundingClientRect();
    var span = film.offsetHeight - innerHeight;
    var p = Math.min(1, Math.max(0, -r.top / span));
    window.kl.p = p;
    var i = 0; for (var k = 0; k < BOUNDS.length; k++) if (p >= BOUNDS[k]) i = k;
    setScene(i);
    hint.style.opacity = p > 0.02 ? 0 : 1;
  }
  addEventListener('scroll', onFilm, { passive: true });
  if (lenis) lenis.on('scroll', onFilm);
  onFilm();

  /* ---------- header ---------- */
  var top = $('.top'), lastY = 0;
  addEventListener('scroll', function () {
    var y = scrollY;
    top.classList.toggle('is-solid', y > film.offsetHeight - innerHeight);
    top.classList.toggle('is-hidden', y > lastY + 2 && y > film.offsetHeight);
    if (y < lastY - 2) top.classList.remove('is-hidden');
    lastY = y;
  }, { passive: true });

  /* ---------- magnetic buttons ---------- */
  if (fine && !reduce) {
    $$('[data-magnetic]').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        b.style.setProperty('--mx', ((e.clientX - r.left - r.width / 2) * 0.25) + 'px');
        b.style.setProperty('--my', ((e.clientY - r.top - r.height / 2) * 0.35) + 'px');
      });
      b.addEventListener('pointerleave', function () { b.style.setProperty('--mx', '0px'); b.style.setProperty('--my', '0px'); });
    });
    // bento: cards lean toward the pointer
    $$('[data-tilt]').forEach(function (c) {
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        c.style.transform = 'rotateY(' + (x * 6) + 'deg) rotateX(' + (-y * 6) + 'deg)';
      });
      c.addEventListener('pointerleave', function () { c.style.transform = ''; });
    });
  }

  /* ---------- models ---------- */
  var M = [
    { name: 'АМ 700', d: 700, w: 150, t: 60, p: 2.7, h: 450, W: 960, size: '960×970×1210 мм', pump: '1 × 2,2–3 бар, 90 л/мин', v: '220 / 380 В', desc: 'Самая компактная. Единственная работает и от 220 В.' },
    { name: 'АМ 800', d: 800, w: 200, t: 100, p: 5.7, h: 525, W: 1030, size: '1030×1040×1305 мм', pump: '1 × 3–3,5 бар, 90 л/мин', v: '380 В', desc: 'Универсальная. Два ТЭНа, давление до 3,5 бар.' },
    { name: 'АМ 1000', d: 1000, w: 300, t: 130, p: 7, h: 635, W: 1230, size: '1230×1240×1410 мм', pump: '2 × 3,5 бар, 90 л/мин', v: '380 В', desc: 'Для крупных узлов. Два насоса, три ТЭНа.' },
    { name: 'АМ 1200', d: 1200, w: 550, t: 190, p: 9.6, h: 700, W: 1550, size: '1550×1400×1500 мм', pump: '2 × 3–3,5 бар, 400 л/мин', v: '380 В', desc: 'Флагман: 550 кг на корзине и 400 л/мин подачи.' }
  ];
  var tabs = $$('.models__tabs [role="tab"]'), tabsBox = $('.models__tabs'), fig = $('.models__fig');
  var curM = 2;
  var fmt = function (v) { return (Math.round(v * 10) / 10).toString().replace('.', ','); };
  function morph(el, to) {
    var from = parseFloat(el.dataset.v || el.textContent.replace(',', '.')) || 0;
    el.dataset.v = to;
    if (!hasGsap || reduce) { el.textContent = fmt(to); return; }
    var o = { v: from };
    gsap.to(o, { v: to, duration: .9, ease: 'expo.out', onUpdate: function () { el.textContent = fmt(to % 1 ? o.v : Math.round(o.v)); } });
  }
  function setModel(i) {
    curM = i;
    var m = M[i];
    tabs.forEach(function (t, k) { t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1; });
    tabsBox.style.setProperty('--i', i);
    tabsBox.style.setProperty('--row', Math.floor(i / 2));
    tabsBox.style.setProperty('--col', i % 2);
    morph($('[data-k="d"]'), m.d); morph($('[data-k="w"]'), m.w); morph($('[data-k="t"]'), m.t); morph($('[data-k="p"]'), m.p);
    $('[data-k="desc"]').textContent = m.desc;
    $('[data-k="h"]').textContent = m.h + ' мм';
    $('[data-k="pump"]').textContent = m.pump;
    $('[data-k="size"]').textContent = m.size;
    $('[data-k="v"]').textContent = m.v;
    $('[data-k="W"]').textContent = m.W;
    fig.style.setProperty('--s', (m.W / 1550).toFixed(3));
    var cta = $('[data-k="cta"]'); cta.textContent = 'Запросить КП на ' + m.name; cta.dataset.order = m.name;
  }
  tabs.forEach(function (t, k) {
    t.addEventListener('click', function () { setModel(k); });
    t.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      var n = (curM + d + M.length) % M.length; setModel(n); tabs[n].focus();
    });
  });
  setModel(curM);
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-order]');
    if (!b) return;
    var r = document.querySelector('.chips input[value="' + b.dataset.order + '"]');
    if (r) r.checked = true;
  });

  /* ---------- reveals ---------- */
  if (hasGsap && !reduce) {
    $$('.h2').forEach(function (h) {
      gsap.from(h, { y: 50, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 88%' } });
    });
    gsap.from('.proof__row > div', { y: 30, opacity: 0, duration: 1, stagger: .08, ease: 'expo.out', scrollTrigger: { trigger: '.proof', start: 'top 85%' } });
    gsap.from('.bento .cell', { y: 60, opacity: 0, duration: 1.2, stagger: .1, ease: 'expo.out', scrollTrigger: { trigger: '.bento', start: 'top 85%' } });
    gsap.from('.terms__list li', { y: 30, opacity: 0, duration: .9, stagger: .07, ease: 'expo.out', scrollTrigger: { trigger: '.terms__list', start: 'top 85%' } });
    gsap.fromTo('.factory__img img', { yPercent: -10 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.factory', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.from('.factory__card', { y: 80, opacity: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: '.factory', start: 'top 70%' } });
    gsap.from('.card', { y: 60, opacity: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: '.lead', start: 'top 70%' } });
    gsap.from('.scene.is-on > *', { y: 30, opacity: 0, duration: 1.2, stagger: .08, ease: 'expo.out', delay: .2 });
  }

  /* ---------- counters ---------- */
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        var el = e.target, to = +el.dataset.count, t0 = performance.now();
        (function step(now) {
          var k = Math.min(1, (now - t0) / 1500); k = 1 - Math.pow(1 - k, 3);
          el.textContent = Math.round(to * k);
          if (k < 1) requestAnimationFrame(step);
        })(t0);
      });
    }, { threshold: .6 });
    $$('[data-count]').forEach(function (n) { n.textContent = '0'; io.observe(n); });
  }

  /* ---------- lead form (no backend on GitHub Pages: hand off to the mail client) ---------- */
  var form = $('[data-form]');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var F = form.elements;
    var iName = F.namedItem('name'), iPhone = F.namedItem('phone'), iAgree = F.namedItem('agree'), iMsg = F.namedItem('msg');
    var model = (form.querySelector('input[name="model"]:checked') || {}).value || 'Помогите подобрать';
    var name = iName.value.trim(), phone = iPhone.value.trim(), phoneOk = phone.replace(/\D/g, '').length >= 10;
    iName.closest('.fld').classList.toggle('is-invalid', !name);
    iPhone.closest('.fld').classList.toggle('is-invalid', !phoneOk);
    $('.err--agree', form).classList.toggle('is-shown', !iAgree.checked);
    if (!name) return iName.focus();
    if (!phoneOk) return iPhone.focus();
    if (!iAgree.checked) return iAgree.focus();
    var body = 'Имя: ' + name + '\nТелефон: ' + phone + '\nМодель: ' + model + (iMsg.value.trim() ? '\nДетали: ' + iMsg.value.trim() : '');
    window.location.href = 'mailto:klimentcompany@mail.ru?subject=' + encodeURIComponent('Заявка на КП — ' + model) + '&body=' + encodeURIComponent(body);
    $('.card__done', form).hidden = false;
  });

  addEventListener('load', function () { onFilm(); if (hasGsap) ScrollTrigger.refresh(); });
})();
