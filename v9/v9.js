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

  /* ---------- models: the pinned dial ---------- */
  var M = [
    { name: 'АМ 700', d: 700, w: 150, h: 450, t: 60, pump: '1 × 2,2–3 бар', p: '2,7 кВт', v: '220 / 380 В', size: '960×970×1210', W: 960, desc: 'Самая компактная. Единственная работает и от 220 В.' },
    { name: 'АМ 800', d: 800, w: 200, h: 525, t: 100, pump: '1 × 3–3,5 бар', p: '5,7 кВт', v: '380 В', size: '1030×1040×1305', W: 1030, desc: 'Универсальная. Два ТЭНа, давление до 3,5 бар.' },
    { name: 'АМ 1000', d: 1000, w: 300, h: 635, t: 130, pump: '2 × 3,5 бар', p: '7 кВт', v: '380 В', size: '1230×1240×1410', W: 1230, desc: 'Для крупных узлов. Два насоса, три ТЭНа.' },
    { name: 'АМ 1200', d: 1200, w: 550, h: 700, t: 190, pump: '2 × 3–3,5 бар, 400 л/мин', p: '9,6 кВт', v: '380 В', size: '1550×1400×1500', W: 1550, desc: 'Флагман: 550 кг на корзине и 400 л/мин подачи.' }
  ];
  var tabs = $$('.msizes [role="tab"]'), models = $('.models'), bar = $('.msizes'), fig = $('.mstage__fig'), curM = -1;
  function setModel(i) {
    if (i === curM) return; curM = i; var m = M[i];
    tabs.forEach(function (t, k) { t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1; });
    bar.style.setProperty('--i', i);
    $('[data-k="name"]').textContent = m.name;
    $('[data-k="d"]').textContent = m.d;
    $('[data-k="w"]').textContent = m.w + ' кг';
    $('[data-k="h"]').textContent = m.h + ' мм';
    $('[data-k="t"]').textContent = m.t + ' л';
    $('[data-k="pump"]').textContent = m.pump;
    $('[data-k="p"]').textContent = m.p;
    $('[data-k="v"]').textContent = m.v;
    $('[data-k="size"]').textContent = m.size;
    $('[data-k="desc"]').textContent = m.desc;
    $('[data-k="W"]').textContent = m.W;
    fig.style.setProperty('--s', (m.W / 1550).toFixed(3));
    var cta = $('[data-k="cta"]'); cta.innerHTML = 'КП на ' + m.name + ' <i>→</i>'; cta.dataset.order = m.name;
    if (hasGsap && !reduce) gsap.fromTo('.mstage__name, .mstage__desc, .mstage__spec > div', { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: .6, stagger: .03, ease: 'expo.out', overwrite: true });
  }
  setModel(0);
  var pinned = false;
  function modelsProgress() {
    if (!pinned) return;
    var r = models.getBoundingClientRect(), span = models.offsetHeight - innerHeight;
    var p = Math.min(1, Math.max(0, -r.top / span));
    setModel(Math.min(3, Math.floor(p * 4 * 0.999)));
  }
  function checkPin() { pinned = !reduce && innerWidth > 760; modelsProgress(); }
  checkPin(); addEventListener('resize', checkPin);
  addEventListener('scroll', modelsProgress, { passive: true });
  tabs.forEach(function (t, k) {
    t.addEventListener('click', function () {
      if (pinned) { var span = models.offsetHeight - innerHeight; goTo(models.getBoundingClientRect().top + scrollY + span * (k + 0.5) / 4); }
      else setModel(k);
    });
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
    gsap.from('.fcard', { y: 60, opacity: 0, duration: 1.1, stagger: .1, ease: 'expo.out', scrollTrigger: { trigger: '.fcards', start: 'top 85%' } });
    gsap.from('.claim__big', { scale: .9, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.claim', start: 'top 75%' } });
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
