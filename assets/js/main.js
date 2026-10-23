/* KLIMENT — page interactions */
(function () {
  'use strict';

  var doc = document.documentElement;
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
    } else {
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })();
    }
  }
  function scrollToTarget(el) {
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: -8 });
    else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var el = document.getElementById(id.slice(1));
      if (!el) return;
      e.preventDefault();
      closeMenu();
      scrollToTarget(el);
      if (id === '#lead') setTimeout(function () { var n = $('#f-name'); if (n) n.focus({ preventScroll: true }); }, 900);
    });
  });

  /* ---------- preloader: the tank fills ---------- */
  var loader = $('.loader');
  function startIntro() {
    if (!hasGsap || reduce) return;
    var tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.from('.hero__title .line > span', { yPercent: 110, duration: 1.3, stagger: .09 })
      .from('.hero__word', { yPercent: 40, opacity: 0, duration: 1.6 }, 0.1)
      .from('.hero__meta, .hero__aside, .hero__specs', { y: 24, opacity: 0, duration: 1, stagger: .08 }, 0.45)
      .from('.hdr', { opacity: 0, duration: 1, clearProps: 'opacity' }, 0.3); // opacity, not transform: the hide-on-scroll class owns transform
  }
  if (loader && !reduce) {
    document.body.classList.add('is-loading');
    var countEl = $('[data-count]', loader);
    var start = performance.now();
    var loaded = document.readyState === 'complete';
    window.addEventListener('load', function () { loaded = true; });
    setTimeout(function () { loaded = true; }, 2200); // slow CDN shouldn't hold the page
    var shown = 0, loadedAt = 0, from = 0;
    (function tick(now) { // time-based, so a slow frame rate can't stall it
      var t = (now - start) / 1400;
      var capped = Math.min(90, (1 - Math.pow(1 - Math.min(t, 1), 3)) * 100);
      if (loaded && !loadedAt) { loadedAt = now; from = capped; }
      shown = loadedAt ? Math.min(100, from + (now - loadedAt) / 4) : capped;
      countEl.textContent = Math.floor(shown);
      loader.style.setProperty('--lvl', shown + '%');
      $('.loader__water', loader).style.height = shown + '%';
      if (shown >= 100 && t > 0.9) {
        document.body.classList.remove('is-loading');
        if (hasGsap) {
          gsap.to(loader, { clipPath: 'inset(0 0 100% 0)', duration: .9, ease: 'expo.inOut', onComplete: function () { loader.classList.add('is-done'); } });
          gsap.delayedCall(.35, startIntro);
        } else loader.classList.add('is-done');
        return;
      }
      requestAnimationFrame(tick);
    })(start);
    // never trap the visitor behind the loader
    setTimeout(function () { if (!loader.classList.contains('is-done')) { loader.classList.add('is-done'); document.body.classList.remove('is-loading'); } }, 6000);
  } else if (loader) loader.classList.add('is-done');

  /* ---------- header: colour by section under it, hide on scroll down ---------- */
  var hdr = $('[data-hdr]');
  var darkSecs = $$('.hero, .models, .how, .factory, .lead, .ftr');
  var lastY = window.scrollY;
  var menuOpen = false;
  function onScroll() {
    var y = window.scrollY;
    var probe = 36, dark = false;
    for (var i = 0; i < darkSecs.length; i++) {
      var r = darkSecs[i].getBoundingClientRect();
      if (r.top <= probe && r.bottom > probe) { dark = true; break; }
    }
    hdr.classList.toggle('is-dark', dark && y > 40);
    hdr.classList.toggle('is-light', !dark);
    if (!menuOpen) hdr.classList.toggle('is-hidden', y > lastY && y > window.innerHeight * 0.8);
    lastY = y;
    var mbar = $('.mbar');
    if (mbar) {
      var lead = $('#lead').getBoundingClientRect();
      mbar.classList.toggle('is-on', y > window.innerHeight * 0.7 && lead.top > window.innerHeight * 0.5);
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // active nav item
  var navLinks = $$('.hdr__nav a');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        navLinks.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navLinks.forEach(function (a) { var s = document.getElementById(a.getAttribute('href').slice(1)); if (s) io.observe(s); });
  }

  /* ---------- mobile menu ---------- */
  var burger = $('.hdr__burger'), menu = $('#menu');
  function closeMenu() {
    if (!menuOpen) return;
    menuOpen = false; menu.hidden = true;
    burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Открыть меню');
    if (lenis) lenis.start();
  }
  burger.addEventListener('click', function () {
    if (menuOpen) return closeMenu();
    menuOpen = true; menu.hidden = false;
    hdr.classList.remove('is-hidden'); hdr.classList.add('is-dark');
    burger.setAttribute('aria-expanded', 'true'); burger.setAttribute('aria-label', 'Закрыть меню');
    if (lenis) lenis.stop();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  /* ---------- cursor + magnetic buttons ---------- */
  if (fine && !reduce) {
    var cur = $('.cursor');
    var cx = innerWidth / 2, cy = innerHeight / 2, tx = cx, ty = cy;
    window.addEventListener('pointermove', function (e) { tx = e.clientX; ty = e.clientY; }, { passive: true });
    (function loop() {
      cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2;
      cur.style.transform = 'translate(' + cx + 'px,' + cy + 'px)';
      requestAnimationFrame(loop);
    })();
    document.addEventListener('pointerover', function (e) {
      cur.classList.toggle('is-hover', !!e.target.closest('a, button, summary, label, input[type=range], .hot'));
    });
    $$('[data-magnetic]').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        b.style.setProperty('--mx', ((e.clientX - r.left - r.width / 2) * 0.25) + 'px');
        b.style.setProperty('--my', ((e.clientY - r.top - r.height / 2) * 0.35) + 'px');
      });
      b.addEventListener('pointerleave', function () { b.style.setProperty('--mx', '0px'); b.style.setProperty('--my', '0px'); });
    });
  }

  /* ---------- scroll choreography ---------- */
  if (hasGsap && !reduce) {
    var mm = gsap.matchMedia();

    // models: vertical scroll drives a horizontal track
    mm.add('(min-width: 961px)', function () {
      var track = $('.models__track');
      var dist = function () { return track.scrollWidth - window.innerWidth; };
      var tween = gsap.to(track, {
        x: function () { return -dist(); }, ease: 'none',
        scrollTrigger: {
          trigger: '.models', pin: true, scrub: 0.8, invalidateOnRefresh: true,
          end: function () { return '+=' + dist(); },
          onUpdate: function (st) { $('.models__progress span').style.transform = 'scaleX(' + st.progress + ')'; }
        }
      });
      $$('.mpanel:not(.mpanel--intro)').forEach(function (p) {
        gsap.fromTo($('.mpanel__img img', p), { scale: 1.3, xPercent: 8 }, { scale: 1.05, xPercent: -4, ease: 'none',
          scrollTrigger: { trigger: p, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
        gsap.fromTo($('.mpanel__img', p), { clipPath: 'inset(0 0 0 100%)' }, { clipPath: 'inset(0 0 0 0%)', ease: 'power2.out',
          scrollTrigger: { trigger: p, containerAnimation: tween, start: 'left 85%', end: 'left 25%', scrub: true } });
        gsap.fromTo($('.mpanel__num', p), { xPercent: 30 }, { xPercent: -20, ease: 'none',
          scrollTrigger: { trigger: p, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
      });
    });

    // images unveil like a lid opening
    $$('.reveal-img').forEach(function (f) {
      gsap.fromTo(f, { clipPath: 'inset(18% 0 18% 0)' }, { clipPath: 'inset(0% 0 0% 0)', ease: 'none',
        scrollTrigger: { trigger: f, start: 'top 95%', end: 'top 40%', scrub: true } });
      var img = $('img', f);
      if (img) gsap.fromTo(img, { scale: 1.2 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: f, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    // section headlines rise line by line, once
    $$('.sec .h2').forEach(function (h) {
      gsap.from(h, { y: 60, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 85%' } });
    });

    // delivery routes draw from Miass
    $$('.route').forEach(function (p, i) {
      var len = p.getTotalLength();
      gsap.fromTo(p, { strokeDashoffset: len, strokeDasharray: '6 8' }, { strokeDashoffset: 0, duration: 2.2, delay: i * .12, ease: 'power2.out',
        scrollTrigger: { trigger: '.delivery', start: 'top 70%' } });
    });

    // big footer word squeezes in
    gsap.fromTo('.ftr__word', { letterSpacing: '0.05em', opacity: .2 }, { letterSpacing: '-0.065em', opacity: 1, ease: 'none',
      scrollTrigger: { trigger: '.ftr', start: 'top bottom', end: 'bottom bottom', scrub: true } });
  }

  /* ---------- counters ---------- */
  var nums = $$('[data-num]');
  if (nums.length && 'IntersectionObserver' in window && !reduce) {
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        cio.unobserve(e.target);
        var el = e.target, to = +el.dataset.num, t0 = performance.now();
        (function step(now) {
          var k = Math.min(1, (now - t0) / 1600); k = 1 - Math.pow(1 - k, 4);
          el.textContent = Math.round(to * k);
          if (k < 1) requestAnimationFrame(step);
        })(t0);
      });
    }, { threshold: .6 });
    nums.forEach(function (n) { n.textContent = '0'; cio.observe(n); });
  }

  /* ---------- picker ---------- */
  var MODELS = [
    { name: 'АМ 700', d: 700, h: 450, w: 150, v220: true },
    { name: 'АМ 800', d: 800, h: 525, w: 200 },
    { name: 'АМ 1000', d: 1000, h: 635, w: 300 },
    { name: 'АМ 1200', d: 1200, h: 700, w: 550 }
  ];
  var rD = $('#r-d'), rH = $('#r-h'), rW = $('#r-w');
  var gridG = $('.b-grid');
  if (gridG) { // square lattice like the real basket
    var svgNS = 'http://www.w3.org/2000/svg';
    for (var gx = -100; gx <= 100; gx += 20) {
      var half = Math.sqrt(Math.max(0, 110 * 110 - gx * gx));
      [[120 + gx, 120 - half, 120 + gx, 120 + half], [120 - half, 120 + gx, 120 + half, 120 + gx]].forEach(function (c) {
        var l = document.createElementNS(svgNS, 'line');
        l.setAttribute('x1', c[0]); l.setAttribute('y1', c[1]); l.setAttribute('x2', c[2]); l.setAttribute('y2', c[3]);
        gridG.appendChild(l);
      });
    }
  }
  function setFill(r) { r.style.setProperty('--p', ((r.value - r.min) / (r.max - r.min) * 100) + '%'); }
  function pick() {
    if (!rD) return;
    var d = +rD.value, h = +rH.value, w = +rW.value;
    var v220 = $('input[name="power"]:checked').value === '220';
    $('#o-d').textContent = d + ' мм'; $('#o-h').textContent = h + ' мм'; $('#o-w').textContent = w + ' кг';
    [rD, rH, rW].forEach(setFill);
    var fit = null;
    for (var i = 0; i < MODELS.length; i++) {
      var m = MODELS[i];
      if (d <= m.d && h <= m.h && w <= m.w) { fit = m; break; }
    }
    var modelEl = $('[data-pick-model]'), whyEl = $('[data-pick-why]'), cta = $('[data-pick-cta]');
    var basket = $('.pick__basket');
    var ref = fit || MODELS[3];
    var why;
    if (!fit) {
      modelEl.textContent = 'Под заказ';
      why = 'Деталь больше, чем помещается в АМ 1200 (Ø1200 × 700 мм, до 550 кг). Расскажите о задаче — обсудим решение.';
      cta.dataset.order = 'Помогите подобрать';
    } else if (v220 && !fit.v220) {
      modelEl.textContent = fit.name;
      why = 'От 220 В работает только АМ 700, а вашим деталям нужна ' + fit.name + ' на 380 В. Подскажем, как решить вопрос с питанием.';
      cta.dataset.order = fit.name;
    } else {
      modelEl.textContent = fit.name;
      why = 'Корзина Ø' + fit.d + ' мм, высота ' + fit.h + ' мм, нагрузка до ' + fit.w + ' кг — запас по весу ' + Math.round((1 - w / fit.w) * 100) + '%.';
      cta.dataset.order = fit.name;
    }
    whyEl.textContent = why;
    cta.textContent = fit ? 'Запросить КП на ' + fit.name : 'Обсудить задачу';
    var r = Math.min(118, 110 * (d / ref.d));
    $('.b-part').setAttribute('r', r);
    basket.classList.toggle('is-over', !fit);
    $$('.compare th, .compare td').forEach(function (c) { c.classList.remove('is-pick'); });
    if (fit) {
      var col = MODELS.indexOf(fit) + 2;
      $$('.compare tr').forEach(function (tr) {
        var cell = tr.children[col - 1];
        if (cell && tr.children.length === 5) cell.classList.add('is-pick');
      });
    }
  }
  [rD, rH, rW].forEach(function (r) { if (r) r.addEventListener('input', pick); });
  $$('input[name="power"]').forEach(function (r) { r.addEventListener('change', pick); });
  pick();

  // any "request a quote for model X" button preselects the form
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-order]');
    if (!b) return;
    var sel = $('#f-model');
    if (sel) sel.value = b.dataset.order;
  });

  /* ---------- how: steps light up ---------- */
  var steps = $$('.steps li');
  if ('IntersectionObserver' in window) {
    var sio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { e.target.classList.toggle('is-on', e.isIntersecting); });
    }, { rootMargin: '-35% 0px -35% 0px' });
    steps.forEach(function (s) { sio.observe(s); });
  }

  /* ---------- grime wipe: scroll rotates a cleaning sweep, the pointer scrubs ---------- */
  var wipe = $('[data-wipe]');
  if (wipe) {
    var cv = $('canvas', wipe), ctx = cv.getContext('2d');
    var W = 0, H = 0, lastSweep = 0, cleaned = false;
    function paintGrime() {
      var r = wipe.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = cv.width = Math.round(r.width * dpr); H = cv.height = Math.round(r.height * dpr);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgb(96,78,52)';
      ctx.fillRect(0, 0, W, H);
      var seed = 7;
      var rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      for (var i = 0; i < 220; i++) { // oil stains
        var x = rnd() * W, y = rnd() * H, rr = (20 + rnd() * 140) * dpr;
        var g = ctx.createRadialGradient(x, y, 0, x, y, rr);
        var dark = rnd() > .5;
        g.addColorStop(0, dark ? 'rgba(34,26,14,.6)' : 'rgba(150,124,84,.5)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.fill();
      }
      for (var j = 0; j < 2600; j++) { // grit
        ctx.fillStyle = rnd() > .5 ? 'rgba(15,12,8,.6)' : 'rgba(140,118,84,.5)';
        ctx.fillRect(rnd() * W, rnd() * H, (1 + rnd() * 2.5) * dpr, (1 + rnd() * 2.5) * dpr);
      }
      ctx.globalCompositeOperation = 'destination-out';
      lastSweep = 0;
    }
    function sweepTo(p) { // erase a growing wedge, like the basket turning under the jets
      var a1 = p * Math.PI * 2;
      if (a1 <= lastSweep) return;
      ctx.beginPath(); ctx.moveTo(W / 2, H / 2);
      ctx.arc(W / 2, H / 2, Math.hypot(W, H), lastSweep - Math.PI / 2 - 0.02, a1 - Math.PI / 2);
      ctx.closePath(); ctx.fillStyle = 'rgba(0,0,0,1)'; ctx.fill();
      lastSweep = a1;
      if (p >= 1 && !cleaned) { cleaned = true; wipe.classList.add('is-clean'); }
    }
    function scrub(e) {
      var r = cv.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width * W, y = (e.clientY - r.top) / r.height * H;
      var rad = 46 * (W / r.width);
      var g = ctx.createRadialGradient(x, y, 0, x, y, rad);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill();
    }
    paintGrime();
    cv.addEventListener('pointermove', scrub);
    cv.addEventListener('pointerdown', scrub);
    if (reduce) { sweepTo(1); }
    else if (hasGsap) {
      ScrollTrigger.create({ trigger: '.how__stage', start: 'top 70%', end: 'bottom 60%', onUpdate: function (st) { sweepTo(st.progress); } });
    } else sweepTo(1);
    var rw; window.addEventListener('resize', function () { clearTimeout(rw); rw = setTimeout(function () { if (!cleaned) paintGrime(); }, 250); });
  }

  /* ---------- hotspots ---------- */
  var hots = $$('.hot'), items = $$('[data-hot-item]');
  function setHot(i) {
    hots.forEach(function (h) { h.classList.toggle('is-on', h.dataset.hot === String(i)); });
    items.forEach(function (it) { it.classList.toggle('is-on', it.dataset.hotItem === String(i)); });
  }
  hots.forEach(function (h) {
    h.addEventListener('click', function () { setHot(h.dataset.hot); });
    h.addEventListener('pointerenter', function () { setHot(h.dataset.hot); });
  });
  items.forEach(function (it) { it.addEventListener('pointerenter', function () { setHot(it.dataset.hotItem); }); });
  setHot(0);

  /* ---------- lead form: no backend on GitHub Pages, so hand off to the mail client ---------- */
  var form = $('[data-form]');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true, F = form.elements;
      var iName = F.namedItem('name'), iPhone = F.namedItem('phone'), iAgree = F.namedItem('agree'), iModel = F.namedItem('model'), iMsg = F.namedItem('msg');
      var name = iName.value.trim(), phone = iPhone.value.trim();
      var fName = iName.closest('.fld'), fPhone = iPhone.closest('.fld');
      fName.classList.toggle('is-invalid', !name);
      var phoneOk = phone.replace(/\D/g, '').length >= 10;
      fPhone.classList.toggle('is-invalid', !phoneOk);
      var agree = iAgree.checked;
      $('.err--agree', form).classList.toggle('is-shown', !agree);
      if (!name) { ok = false; iName.focus(); }
      else if (!phoneOk) { ok = false; iPhone.focus(); }
      else if (!agree) { ok = false; iAgree.focus(); }
      if (!ok) return;
      var body = 'Имя: ' + name + '\nТелефон: ' + phone + '\nМодель: ' + iModel.value + (iMsg.value.trim() ? '\nДетали: ' + iMsg.value.trim() : '');
      window.location.href = 'mailto:klimentcompany@mail.ru?subject=' + encodeURIComponent('Заявка на КП — ' + iModel.value) + '&body=' + encodeURIComponent(body);
      $('.form__done', form).hidden = false;
    });
  }

  window.addEventListener('load', function () { if (hasGsap) ScrollTrigger.refresh(); });
})();
