/* Kliment v3 — interactions */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  /* ---------- smooth scroll + anchors ---------- */
  var lenis = null;
  if (!reduce && typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    if (hasGsap) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })();
  }
  function goTo(el) { if (lenis) lenis.scrollTo(el); else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); }
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href').slice(1);
      var el = id && document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      closeMenu();
      if (a.dataset.goto) setModel(+a.dataset.goto);
      goTo(el);
    });
  });

  /* ---------- column guides ---------- */
  function drawGuides() {
    var n = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--cols'), 10) || 12;
    $$('[data-guides]').forEach(function (s) {
      var g = $(':scope > .guides', s);
      if (!g) { g = document.createElement('div'); g.className = 'guides'; g.setAttribute('aria-hidden', 'true'); s.prepend(g); }
      if (g.childElementCount !== n) g.innerHTML = new Array(n + 1).join('<i></i>');
    });
  }
  drawGuides();
  window.addEventListener('resize', drawGuides);

  /* ---------- pill menu ---------- */
  var pillBtn = $('.pill__btn'), pillList = $('#pill-list');
  function closeMenu() { if (!pillList.hidden) { pillList.hidden = true; pillBtn.setAttribute('aria-expanded', 'false'); } }
  pillBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    var open = pillList.hidden;
    pillList.hidden = !open; pillBtn.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', function (e) { if (!e.target.closest('.pill__menu')) closeMenu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  /* ---------- motion ---------- */
  if (hasGsap && !reduce) {
    gsap.timeline({ defaults: { ease: 'expo.out' } })
      .from('.hero__shot', { clipPath: 'inset(0 0 0 100%)', duration: 1.4, ease: 'expo.inOut' }, 0)
      .from('.hero__shot img', { scale: 1.3, duration: 2 }, 0)
      .from('.hero__ln', { yPercent: 60, opacity: 0, duration: 1.2, stagger: .08 }, 0.3)
      .from('.hero__kicker, .hero__lead, .hero__facts, .hero__ctas, .topline', { y: 20, opacity: 0, duration: .9, stagger: .07 }, 0.55)
      .from('.tag', { scale: .6, opacity: 0, duration: .8, stagger: .12, ease: 'back.out(1.7)' }, 1)
      .from('.pill', { y: 80, duration: 1 }, 0.7);

    // the basket keeps turning; scrolling spins it faster
    var dial = $('.hero__dial'), rot = 0, spinBoost = 0;
    if (lenis) lenis.on('scroll', function (e) { spinBoost = Math.min(20, Math.abs(e.velocity || 0)); });
    gsap.ticker.add(function () { rot += 0.12 + spinBoost * 0.25; spinBoost *= 0.92; dial.style.setProperty('--rot', rot + 'deg'); });
    gsap.to('.hero__shot img', { yPercent: 8, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

    $$('.h2, .process__title, .lead__title').forEach(function (h) {
      gsap.from(h, { y: 40, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 88%' } });
    });
    gsap.from('.steps li', { y: 30, opacity: 0, duration: .9, stagger: .08, ease: 'expo.out', scrollTrigger: { trigger: '.steps', start: 'top 85%' } });
    gsap.from('.bento .b', { y: 30, opacity: 0, duration: .9, stagger: .06, ease: 'expo.out', scrollTrigger: { trigger: '.bento', start: 'top 85%' } });
    gsap.from('.ftr__word', { yPercent: 40, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.ftr', start: 'top 80%' } });
  }

  /* ---------- statement: words light up as you read ---------- */
  var para = $('[data-words]');
  if (para) {
    para.innerHTML = para.textContent.trim().split(/\s+/).map(function (w) { return '<span class="w">' + w + '</span>'; }).join(' ');
    var words = $$('.w', para);
    if (hasGsap && !reduce) {
      ScrollTrigger.create({
        trigger: para, start: 'top 80%', end: 'bottom 45%', scrub: true,
        onUpdate: function (s) { var k = Math.round(s.progress * words.length); words.forEach(function (w, i) { w.classList.toggle('on', i < k); }); }
      });
    } else words.forEach(function (w) { w.classList.add('on'); });
  }

  /* ---------- models ---------- */
  var M = [
    { name: 'АМ 700', d: 700, w: 150, t: 60, p: 2.7, h: 450, W: 960, size: '960×970×1210 мм', pump: '1 × 2,2–3 бар, 90 л/мин', v: '220 / 380 В', desc: 'Самая компактная. Единственная работает и от 220 В.' },
    { name: 'АМ 800', d: 800, w: 200, t: 100, p: 5.7, h: 525, W: 1030, size: '1030×1040×1305 мм', pump: '1 × 3–3,5 бар, 90 л/мин', v: '380 В', desc: 'Универсальная. Два ТЭНа, давление до 3,5 бар.' },
    { name: 'АМ 1000', d: 1000, w: 300, t: 130, p: 7, h: 635, W: 1230, size: '1230×1240×1410 мм', pump: '2 × 3,5 бар, 90 л/мин', v: '380 В', desc: 'Для крупных узлов. Два насоса, три ТЭНа.' },
    { name: 'АМ 1200', d: 1200, w: 550, t: 190, p: 9.6, h: 700, W: 1550, size: '1550×1400×1500 мм', pump: '2 × 3–3,5 бар, 400 л/мин', v: '380 В', desc: 'Флагман: 550 кг на корзине и 400 л/мин подачи.' }
  ];
  var tabs = $$('.models__list [role="tab"]');
  var current = 2;
  var fmt = function (v) { return (Math.round(v * 10) / 10).toString().replace('.', ','); };
  function morph(el, to) {
    var from = parseFloat(el.dataset.v || el.textContent.replace(',', '.')) || 0;
    el.dataset.v = to;
    if (!hasGsap || reduce) { el.textContent = fmt(to); return; }
    var o = { v: from };
    gsap.to(o, { v: to, duration: .8, ease: 'expo.out', onUpdate: function () { el.textContent = fmt(to % 1 ? o.v : Math.round(o.v)); } });
  }
  function setModel(i) {
    current = i;
    var m = M[i];
    tabs.forEach(function (t, k) { t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1; });
    morph($('[data-k="d"]'), m.d); morph($('[data-k="w"]'), m.w); morph($('[data-k="t"]'), m.t); morph($('[data-k="p"]'), m.p);
    $('[data-k="desc"]').textContent = m.desc;
    $('[data-k="h"]').textContent = m.h + ' мм';
    $('[data-k="pump"]').textContent = m.pump;
    $('[data-k="size"]').textContent = m.size;
    $('[data-k="v"]').textContent = m.v;
    $('[data-k="W"]').textContent = m.W + ' мм';
    $('.models__box').style.setProperty('--s', (m.W / 1550).toFixed(3));
    var cta = $('[data-k="cta"]');
    cta.textContent = 'Запросить КП на ' + m.name; cta.dataset.order = m.name;
  }
  tabs.forEach(function (t, k) {
    t.addEventListener('click', function () { setModel(k); });
    t.addEventListener('keydown', function (e) {
      var d = (e.key === 'ArrowDown' || e.key === 'ArrowRight') ? 1 : (e.key === 'ArrowUp' || e.key === 'ArrowLeft') ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      var n = (current + d + M.length) % M.length; setModel(n); tabs[n].focus();
    });
  });
  setModel(current);

  // full spec sheet in a dialog
  var sheet = $('#sheet');
  $('[data-open-table]').addEventListener('click', function () {
    if (sheet.showModal) { sheet.showModal(); if (lenis) lenis.stop(); } else sheet.setAttribute('open', '');
  });
  $('[data-close]', sheet).addEventListener('click', function () { sheet.close(); });
  sheet.addEventListener('close', function () { if (lenis) lenis.start(); });
  sheet.addEventListener('click', function (e) { if (e.target === sheet) sheet.close(); });

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-order]');
    if (b && b.dataset.order) { var sel = $('#f-model'); if (sel) sel.value = b.dataset.order; }
  });

  /* ---------- counters ---------- */
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        var el = e.target, to = +el.dataset.count, t0 = performance.now();
        (function step(now) {
          var k = Math.min(1, (now - t0) / 1400); k = 1 - Math.pow(1 - k, 4);
          el.textContent = Math.round(to * k);
          if (k < 1) requestAnimationFrame(step);
        })(t0);
      });
    }, { threshold: .6 });
    $$('[data-count]').forEach(function (n) { n.textContent = '0'; io.observe(n); });
  }

  /* ---------- lead form: no backend on GitHub Pages, so hand off to the mail client ---------- */
  var form = $('[data-form]');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var F = form.elements;
    var iName = F.namedItem('name'), iPhone = F.namedItem('phone'), iAgree = F.namedItem('agree'), iModel = F.namedItem('model'), iMsg = F.namedItem('msg');
    var name = iName.value.trim(), phone = iPhone.value.trim(), phoneOk = phone.replace(/\D/g, '').length >= 10;
    iName.closest('.fld').classList.toggle('is-invalid', !name);
    iPhone.closest('.fld').classList.toggle('is-invalid', !phoneOk);
    $('.err--agree', form).classList.toggle('is-shown', !iAgree.checked);
    if (!name) return iName.focus();
    if (!phoneOk) return iPhone.focus();
    if (!iAgree.checked) return iAgree.focus();
    var body = 'Имя: ' + name + '\nТелефон: ' + phone + '\nМодель: ' + iModel.value + (iMsg.value.trim() ? '\nДетали: ' + iMsg.value.trim() : '');
    window.location.href = 'mailto:klimentcompany@mail.ru?subject=' + encodeURIComponent('Заявка на КП — ' + iModel.value) + '&body=' + encodeURIComponent(body);
    $('.form__done', form).hidden = false;
  });

  window.addEventListener('load', function () { if (hasGsap) ScrollTrigger.refresh(); });
})();
