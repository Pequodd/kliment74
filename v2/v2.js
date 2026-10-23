/* Kliment v2 — interactions */
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
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href').slice(1);
      var el = id && document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      closeMenu();
      if (lenis) lenis.scrollTo(el); else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  /* ---------- column guides: one dashed line per column, drawn in every section ---------- */
  function drawGuides() {
    var n = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--cols'), 10) || 12;
    $$('[data-guides]').forEach(function (s) {
      var g = $(':scope > .guides', s);
      if (!g) { g = document.createElement('div'); g.className = 'guides'; g.setAttribute('aria-hidden', 'true'); s.prepend(g); }
      if (g.childElementCount === n) return;
      g.innerHTML = new Array(n + 1).join('<i></i>');
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
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeMenu(); pillBtn.focus(); } });

  /* ---------- hero: words part, machine comes closer ---------- */
  if (hasGsap && !reduce) {
    var intro = gsap.timeline({ defaults: { ease: 'expo.out', duration: 1.4 } });
    intro.from('.hero__w--l', { xPercent: -40, opacity: 0 }, 0)
      .from('.hero__w--r', { xPercent: 40, opacity: 0 }, 0)
      .from('.hero__machine', { yPercent: 12, opacity: 0, duration: 1.6 }, 0.1)
      .from('.topline, .hero__note, .hero__foot', { y: 16, opacity: 0, stagger: .06, duration: 1 }, 0.4)
      .from('.pill', { y: 80, duration: 1 }, 0.6);

    var mm = gsap.matchMedia();
    mm.add('(min-width: 861px)', function () {
      var st = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true };
      gsap.to('.hero__w--l', { xPercent: -55, ease: 'none', scrollTrigger: st });
      gsap.to('.hero__w--r', { xPercent: 55, ease: 'none', scrollTrigger: st });
      gsap.to('.hero__machine', { scale: 1.32, yPercent: 8, ease: 'none', scrollTrigger: st });
      gsap.to('.hero__machine', { '--dial': '90deg', ease: 'none', scrollTrigger: st });
    });

    // big headings: a block wipes off them once
    $$('.h2, .process__title, .lead__title, .factory__word').forEach(function (h) {
      gsap.from(h, { clipPath: 'inset(0 100% 0 0)', duration: 1.2, ease: 'expo.inOut', scrollTrigger: { trigger: h, start: 'top 85%' } });
    });
    gsap.from('.ftr__word', { yPercent: 40, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.ftr', start: 'top 80%' } });
    gsap.fromTo('.factory__photo img', { scale: 1.2 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.factory__photo', start: 'top bottom', end: 'bottom top', scrub: true } });
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
    { name: 'АМ 700', d: 700, w: 150, t: 60, p: 2.7, W: 960, H: 1210, desc: 'Самая компактная. Работает от 220 и от 380 В.' },
    { name: 'АМ 800', d: 800, w: 200, t: 100, p: 5.7, W: 1030, H: 1305, desc: 'Универсальная. Два ТЭНа, давление до 3,5 бар.' },
    { name: 'АМ 1000', d: 1000, w: 300, t: 130, p: 7, W: 1230, H: 1410, desc: 'Для крупных узлов. Два насоса, три ТЭНа.' },
    { name: 'АМ 1200', d: 1200, w: 550, t: 190, p: 9.6, W: 1550, H: 1500, desc: 'Флагман: 550 кг на корзине и 400 л/мин подачи.' }
  ];
  var tabs = $$('.tabs [role="tab"]');
  var current = 2;
  var fmt = function (v) { return (Math.round(v * 10) / 10).toString().replace('.', ','); };
  function morph(el, to) {
    var from = parseFloat((el.dataset.v || el.textContent).replace(',', '.')) || 0;
    el.dataset.v = to;
    if (!hasGsap || reduce) { el.textContent = fmt(to); return; }
    var o = { v: from };
    gsap.to(o, { v: to, duration: .8, ease: 'expo.out', onUpdate: function () { el.textContent = fmt(to % 1 ? o.v : Math.round(o.v)); } });
  }
  function setModel(i, fromFinder) {
    current = i;
    var m = M[i];
    tabs.forEach(function (t, k) { t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1; });
    morph($('[data-k="d"]'), m.d); morph($('[data-k="w"]'), m.w); morph($('[data-k="t"]'), m.t); morph($('[data-k="p"]'), m.p);
    $('[data-k="name"]').textContent = m.name;
    $('[data-k="desc"]').textContent = m.desc;
    $('[data-k="W"]').textContent = m.W + ' мм';
    $('[data-k="H"]').textContent = m.H + ' мм';
    $('.drawing__box').style.setProperty('--s', (m.W / 1550).toFixed(3));
    $$('.rings [data-r]').forEach(function (c) { c.classList.toggle('is-on', +c.dataset.r === i); });
    var cta = $('.finder__cta [data-order]');
    cta.textContent = 'Запросить КП на ' + m.name; cta.dataset.order = m.name;
    if (!fromFinder) { // keep the slider honest: a part that no longer fits gets clamped
      var part = $('#part');
      if (+part.value > m.d) { part.value = m.d; updatePart(false); }
    }
  }
  tabs.forEach(function (t, k) {
    t.addEventListener('click', function () { setModel(k); });
    t.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      var n = (current + d + M.length) % M.length; setModel(n); tabs[n].focus();
    });
  });

  var part = $('#part'), partOut = $('#part-out'), rings = $('.rings');
  function updatePart(pick) {
    var v = +part.value;
    part.style.setProperty('--p', ((v - part.min) / (part.max - part.min) * 100) + '%');
    partOut.textContent = v + ' мм';
    $('.rings__part').setAttribute('r', (v / 1200 * 130).toFixed(1));
    var fit = -1;
    for (var i = 0; i < M.length; i++) if (v <= M[i].d) { fit = i; break; }
    rings.classList.toggle('is-over', fit < 0);
    if (pick !== false && fit >= 0 && fit !== current) setModel(fit, true);
  }
  part.addEventListener('input', function () { updatePart(true); });
  setModel(current, true);
  updatePart(false);

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

  /* ---------- lead form: GitHub Pages has no backend, so hand off to the mail client ---------- */
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
