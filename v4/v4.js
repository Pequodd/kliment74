/* Kliment v4 — interactions */
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
      if (lenis) lenis.scrollTo(el); else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  /* ---------- fit giant lines to the full width ---------- */
  function textWidth(el) { // the ink, not the box: grid items stretch to their track
    var r = document.createRange(); r.selectNodeContents(el);
    return r.getBoundingClientRect().width;
  }
  function fit(el, target) {
    el.style.fontSize = '100px';
    var w = textWidth(el);
    if (w) el.style.fontSize = (100 * target / w * 0.995) + 'px';
  }
  function fitAll() {
    var hero = $('.hero'), cs = getComputedStyle(hero);
    var inner = hero.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    var lines = $$('.hero__line'), title = $('.hero__title');
    title.style.fontSize = '100px';
    var widest = Math.max.apply(null, lines.map(function (l) { l.style.display = 'inline-block'; var w = l.scrollWidth; l.style.display = ''; return w; }));
    title.style.fontSize = (100 * inner / widest) + 'px';
    var ft = $('.factory__title'), fcs = getComputedStyle(ft.parentNode);
    fit(ft, ft.parentNode.clientWidth - parseFloat(fcs.paddingLeft) - parseFloat(fcs.paddingRight));
    var fw = $('.ftr__word');
    fw.style.fontSize = '100px';
    var ww = $$('span', fw).reduce(function (s, x) { return s + x.getBoundingClientRect().width; }, 0);
    if (ww) fw.style.fontSize = (100 * (fw.parentNode.clientWidth - 2 * parseFloat(getComputedStyle(fw.parentNode).paddingLeft)) / ww * 0.97) + 'px';
    if (hasGsap) ScrollTrigger.refresh();
  }

  /* ---------- split text into masked chars / words ---------- */
  $$('.hero__line').forEach(function (l) {
    l.innerHTML = l.textContent.split('').map(function (c) { return c === ' ' ? ' ' : '<span class="ch">' + c + '</span>'; }).join('');
  });
  $$('[data-split]:not(.hero__title)').forEach(function (h) {
    h.innerHTML = h.textContent.trim().split(/\s+/).map(function (w) { return '<span class="split-w"><span>' + w + '</span></span>'; }).join(' ');
  });

  /* ---------- loader: the cycle timer ---------- */
  var loader = $('.loader');
  function intro() {
    document.body.classList.remove('is-loading');
    if (!hasGsap || reduce) { loader.classList.add('is-done'); return; }
    gsap.timeline({ defaults: { ease: 'expo.out' } })
      .to(loader, { clipPath: 'inset(0 0 100% 0)', duration: 1, ease: 'expo.inOut', onComplete: function () { loader.classList.add('is-done'); } })
      .from('.hero__dirty, .hero__clean', { scale: 1.15, duration: 2 }, 0.3)
      .from('.hero__line .ch', { yPercent: 110, duration: 1.2, stagger: 0.025 }, 0.45)
      .from('.hero__kicker, .hero__aside, .badge, .top', { opacity: 0, y: 20, duration: 1, stagger: .08 }, 0.9)
      .add(autoWash, 1.2);
  }
  if (reduce || !loader) { if (loader) loader.classList.add('is-done'); document.body.classList.remove('is-loading'); }
  else {
    var t0 = performance.now(), loaded = document.readyState === 'complete', from = 0, at = 0;
    window.addEventListener('load', function () { loaded = true; });
    setTimeout(function () { loaded = true; }, 2200);
    (function tick(now) {
      var k = Math.min(1, (now - t0) / 1300), base = Math.min(88, (1 - Math.pow(1 - k, 3)) * 100);
      if (loaded && !at) { at = now; from = base; }
      var v = at ? Math.min(100, from + (now - at) / 5) : base;
      $('[data-t]', loader).textContent = Math.floor(v);
      loader.style.setProperty('--p', v / 100);
      $('.loader__bar span', loader).style.transform = 'scaleX(' + v / 100 + ')';
      if (v >= 100) { setTimeout(intro, 150); return; }
      requestAnimationFrame(tick);
    })(t0);
    setTimeout(function () { if (!loader.classList.contains('is-done')) intro(); }, 6000);
  }

  /* ---------- hero: the cursor is the jet ---------- */
  var clean = $('.hero__clean'), heroEl = $('.hero');
  var wash = { x: 50, y: 60, r: 0, tx: 50, ty: 60, tr: 0, auto: true };
  function autoWash() { // sweep once so the idea is obvious before anyone moves the mouse
    if (!hasGsap || reduce) { wash.tr = 0; return; }
    wash.auto = true;
    gsap.fromTo(wash, { tx: 8, ty: 70, tr: 0 }, { tx: 92, ty: 45, tr: Math.max(innerWidth, innerHeight) * 0.22, duration: 2.4, ease: 'power2.inOut',
      onComplete: function () { if (wash.auto) gsap.to(wash, { tr: 0, duration: 1.2, ease: 'power2.inOut' }); } });
  }
  heroEl.addEventListener('pointermove', function (e) {
    var r = heroEl.getBoundingClientRect();
    wash.auto = false;
    if (hasGsap) gsap.killTweensOf(wash);
    wash.tx = (e.clientX - r.left) / r.width * 100; wash.ty = (e.clientY - r.top) / r.height * 100;
    wash.tr = Math.max(innerWidth, innerHeight) * 0.16;
  });
  heroEl.addEventListener('pointerleave', function () { wash.tr = 0; });
  (function washLoop() {
    wash.x += (wash.tx - wash.x) * 0.12; wash.y += (wash.ty - wash.y) * 0.12; wash.r += (wash.tr - wash.r) * 0.08;
    clean.style.setProperty('--mx', wash.x + '%'); clean.style.setProperty('--my', wash.y + '%'); clean.style.setProperty('--r', wash.r + 'px');
    requestAnimationFrame(washLoop);
  })();

  /* ---------- header ---------- */
  var top = $('.top'), lastY = 0;
  window.addEventListener('scroll', function () {
    var y = window.scrollY;
    top.classList.toggle('is-solid', y > innerHeight * 0.6);
    top.classList.toggle('is-hidden', y > lastY && y > innerHeight);
    lastY = y;
  }, { passive: true });

  /* ---------- cursor + magnetic ---------- */
  if (fine && !reduce) {
    var cur = $('.cursor'), lab = $('.cursor__label');
    var cx = innerWidth / 2, cy = innerHeight / 2, mx = cx, my = cy;
    addEventListener('pointermove', function (e) { mx = e.clientX; my = e.clientY; }, { passive: true });
    (function loop() { cx += (mx - cx) * 0.18; cy += (my - cy) * 0.18; cur.style.transform = 'translate(' + cx + 'px,' + cy + 'px)'; requestAnimationFrame(loop); })();
    document.addEventListener('pointerover', function (e) {
      var t = e.target;
      var labelled = t.closest('[data-cursor]');
      cur.classList.toggle('is-label', !!labelled);
      lab.textContent = labelled ? labelled.dataset.cursor : '';
      cur.classList.toggle('is-link', !labelled && !!t.closest('a, button, summary, label, select, input'));
      cur.classList.toggle('is-wash', !labelled && !t.closest('a, button') && !!t.closest('.hero'));
    });
    $$('[data-magnetic]').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        b.style.setProperty('--mx', ((e.clientX - r.left - r.width / 2) * 0.3) + 'px');
        b.style.setProperty('--my', ((e.clientY - r.top - r.height / 2) * 0.3) + 'px');
      });
      b.addEventListener('pointerleave', function () { b.style.setProperty('--mx', '0px'); b.style.setProperty('--my', '0px'); });
    });
  }

  /* ---------- ribbon: drifts, and runs faster while you scroll ---------- */
  var track = $('.ribbon__track'), rx = 0, boost = 0;
  if (lenis) lenis.on('scroll', function (e) { boost = Math.min(30, Math.abs(e.velocity || 0)); });
  (function ribbon() {
    if (!reduce) {
      rx -= 0.6 + boost * 0.35; boost *= 0.92;
      var half = track.scrollWidth / 2;
      if (-rx >= half) rx += half;
      track.style.transform = 'translateX(' + rx + 'px) skewX(' + (-boost * 0.4) + 'deg)';
    }
    requestAnimationFrame(ribbon);
  })();

  /* ---------- cycle: six steps on one pinned screen ---------- */
  var steps = $$('.cycle__steps li'), imgs = $$('.cycle__img img'), num = $('[data-step-num]'), prog = $('.cycle__progress span');
  var curStep = 0;
  function setStep(i) {
    if (i === curStep) return;
    curStep = i;
    steps.forEach(function (s, k) { s.classList.toggle('is-on', k === i); });
    imgs.forEach(function (im, k) { im.classList.toggle('is-on', k === i); });
    num.textContent = '0' + (i + 1);
  }
  if (hasGsap) {
    gsap.matchMedia().add('(min-width: 861px)', function () {
      var st = ScrollTrigger.create({ trigger: '.cycle', start: 'top top', end: 'bottom bottom',
        onUpdate: function (s) { prog.style.transform = 'scaleX(' + s.progress + ')'; setStep(Math.min(5, Math.floor(s.progress * 6))); } });
      return function () { st.kill(); };
    });
  }

  /* ---------- models: four columns, one open ---------- */
  var cols = $$('.col');
  function openCol(i) {
    cols.forEach(function (c, k) {
      var on = k === i;
      c.classList.toggle('is-open', on);
      $('.col__tab', c).setAttribute('aria-selected', String(on));
      $('.col__tab', c).tabIndex = on ? 0 : -1;
    });
  }
  cols.forEach(function (c, k) {
    var tab = $('.col__tab', c);
    tab.addEventListener('click', function () { openCol(k); });
    if (fine) c.addEventListener('pointerenter', function () { if (!c.classList.contains('is-open')) openCol(k); });
    tab.addEventListener('keydown', function (e) {
      var d = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      var n = (k + d + cols.length) % cols.length; openCol(n); $('.col__tab', cols[n]).focus();
    });
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-order]');
    if (b) { var sel = $('#f-model'); if (sel) sel.value = b.dataset.order; }
  });

  /* ---------- inside: callouts light their pins ---------- */
  var pins = $$('.pin'), calls = $$('.callouts li');
  function lightPin(i) { pins.forEach(function (p, k) { p.classList.toggle('is-on', k === i); }); calls.forEach(function (c, k) { c.classList.toggle('is-on', k === i); }); }
  calls.forEach(function (c, k) { c.addEventListener('pointerenter', function () { lightPin(k); }); });
  if (hasGsap) calls.forEach(function (c, k) { ScrollTrigger.create({ trigger: c, start: 'top 60%', end: 'bottom 40%', onToggle: function (s) { if (s.isActive) lightPin(k); } }); });

  /* ---------- scroll reveals + parallax ---------- */
  if (hasGsap && !reduce) {
    $$('[data-split]:not(.hero__title)').forEach(function (h) {
      gsap.from($$('.split-w > span', h), { yPercent: 110, duration: 1.1, stagger: .05, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 85%' } });
    });
    $$('.ph').forEach(function (p) {
      gsap.fromTo(p, { clipPath: 'inset(20% 0 20% 0)' }, { clipPath: 'inset(0% 0 0% 0)', ease: 'none', scrollTrigger: { trigger: p, start: 'top 95%', end: 'top 45%', scrub: true } });
      gsap.to(p, { yPercent: +p.dataset.speed, ease: 'none', scrollTrigger: { trigger: '.factory', start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    gsap.from('.rows li', { opacity: 0, y: 40, duration: .9, stagger: .06, ease: 'expo.out', scrollTrigger: { trigger: '.rows', start: 'top 85%' } });
  }

  /* ---------- lead: a sentence you fill in ---------- */
  var form = $('[data-form]');
  var errEl = $('.madlib__err', form);
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var F = form.elements;
    var iName = F.namedItem('name'), iPhone = F.namedItem('phone'), iAgree = F.namedItem('agree'), iModel = F.namedItem('model'), iMsg = F.namedItem('msg');
    var name = iName.value.trim(), phone = iPhone.value.trim(), phoneOk = phone.replace(/\D/g, '').length >= 10;
    iName.parentNode.classList.toggle('is-bad', !name);
    iPhone.parentNode.classList.toggle('is-bad', !phoneOk);
    var msg = !name ? 'Впишите имя — так мы поймём, как к вам обращаться.' : !phoneOk ? 'Впишите телефон полностью — перезвоним по нему.' : !iAgree.checked ? 'Отметьте согласие на обработку данных.' : '';
    errEl.textContent = msg; errEl.hidden = !msg;
    if (msg) { (!name ? iName : !phoneOk ? iPhone : iAgree).focus(); return; }
    var model = iModel.selectedIndex === 0 ? 'Помогите подобрать' : iModel.value;
    var body = 'Имя: ' + name + '\nТелефон: ' + phone + '\nМодель: ' + model + (iMsg.value.trim() ? '\nДетали: ' + iMsg.value.trim() : '');
    window.location.href = 'mailto:klimentcompany@mail.ru?subject=' + encodeURIComponent('Заявка на КП — ' + model) + '&body=' + encodeURIComponent(body);
    $('.madlib__done', form).hidden = false;
  });

  /* fonts change metrics, so fit after they load */
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(fitAll);
  var rt; addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(fitAll, 150); });
})();
