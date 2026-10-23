/* Kliment v6 — interactions */
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
      if (lenis) lenis.scrollTo(el, { offset: id === 'top' ? 0 : -64 }); else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  /* ---------- column guides ---------- */
  function drawGuides() {
    var n = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--cols'), 10) || 24;
    $$('[data-guides]').forEach(function (s) {
      var g = $(':scope > .guides', s);
      if (!g) { g = document.createElement('div'); g.className = 'guides'; g.setAttribute('aria-hidden', 'true'); s.prepend(g); }
      if (g.childElementCount !== n) g.innerHTML = new Array(n + 1).join('<i></i>');
    });
  }

  /* ---------- fit giant words to the content width (measure the ink, not the stretched box) ---------- */
  function fitAll() {
    $$('[data-fit]').forEach(function (el) {
      var host = el.closest('section, footer'), cs = getComputedStyle(host);
      var target = host.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      el.style.fontSize = '100px';
      var r = document.createRange(); r.selectNodeContents(el);
      var w = r.getBoundingClientRect().width;
      if (w) el.style.fontSize = (100 * target / w * 0.995) + 'px';
    });
    if (hasGsap) ScrollTrigger.refresh();
  }

  /* ---------- hero: the machine in strips ---------- */
  var box = $('[data-slices]'), N = innerWidth < 820 ? 10 : 16, slices = [];
  if (box) {
    document.documentElement.classList.add('has-slices');
    for (var i = 0; i < N; i++) {
      var s = document.createElement('div');
      s.className = 'slice';
      s.style.backgroundImage = 'url("../assets/img/machine-cut.webp")';
      var a = (i / N * 100).toFixed(3), b = (100 - (i + 1) / N * 100 - 0.15).toFixed(3);
      s.style.clipPath = 'inset(' + a + '% 0 ' + Math.max(0, b) + '% 0)';
      box.appendChild(s);
      slices.push({ el: s, x: 0, tx: 0, seed: Math.sin(i * 12.9898) * 0.5 + 0.5 });
    }
  }
  var hero = $('.hero'), mx = 0.5, my = 0.5, inHero = false, heroP = 0;
  hero.addEventListener('pointermove', function (e) {
    var r = box.getBoundingClientRect();
    mx = (e.clientX - r.left) / r.width; my = (e.clientY - r.top) / r.height; inHero = true;
  });
  hero.addEventListener('pointerleave', function () { inHero = false; });
  var intro = reduce ? 1 : 0, introStart = performance.now() + 250;
  (function sliceLoop(now) {
    if (!reduce) intro = Math.min(1, Math.max(0, (now - introStart) / 1600));
    var e = 1 - Math.pow(1 - intro, 4);
    var vw = innerWidth;
    slices.forEach(function (s, k) {
      var dir = k % 2 ? 1 : -1;
      var pos = (k + 0.5) / N;
      // the cursor is a jet: strips near it get pushed away from it
      var near = inHero ? Math.exp(-Math.pow((pos - my) * 5.5, 2)) : 0;
      var push = near * (mx < 0.5 ? 1 : -1) * 70 * (0.6 + s.seed);
      var load = (1 - e) * dir * vw * (0.4 + s.seed * 0.5);
      var explode = heroP * dir * vw * 0.22 * (0.3 + s.seed);
      s.tx = load + push + explode;
      s.x += (s.tx - s.x) * (intro < 1 ? 1 : 0.12);
      s.el.style.transform = 'translate3d(' + s.x.toFixed(1) + 'px,0,0)';
    });
    requestAnimationFrame(sliceLoop);
  })(performance.now());
  addEventListener('scroll', function () {
    heroP = Math.min(1, Math.max(0, scrollY / hero.offsetHeight));
  }, { passive: true });

  /* ---------- crosshair ---------- */
  if (fine && !reduce) {
    var cross = $('.cross'), cx = -10, cy = -10, tx = -10, ty = -10;
    addEventListener('pointermove', function (e) { tx = e.clientX; ty = e.clientY; }, { passive: true });
    (function crossLoop() { cx += (tx - cx) * 0.25; cy += (ty - cy) * 0.25; cross.style.setProperty('--cx', cx + 'px'); cross.style.setProperty('--cy', cy + 'px'); requestAnimationFrame(crossLoop); })();
  }

  /* ---------- header hides on the way down ---------- */
  var hd = $('.hd'), lastY = 0;
  addEventListener('scroll', function () {
    var y = scrollY;
    if (y > lastY + 4 && y > innerHeight * 0.8) hd.classList.add('is-hidden');
    else if (y < lastY - 4) hd.classList.remove('is-hidden');
    lastY = y;
  }, { passive: true });

  /* ---------- manifest: words light up ---------- */
  var mani = $('[data-words]');
  if (mani && hasGsap && !reduce) {
    var walk = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var frag = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(function (t) {
            if (!t) return;
            if (/^\s+$/.test(t)) frag.appendChild(document.createTextNode(t));
            else { var sp = document.createElement('span'); sp.className = 'w'; sp.textContent = t; frag.appendChild(sp); }
          });
          c.replaceWith(frag);
        } else if (c.nodeType === 1) walk(c);
      });
    };
    walk(mani);
    var words = $$('.w', mani);
    ScrollTrigger.create({ trigger: mani, start: 'top 80%', end: 'bottom 50%', scrub: true,
      onUpdate: function (st) { var k = Math.round(st.progress * words.length); words.forEach(function (w, i) { w.style.color = i < k ? (w.closest('b') ? 'var(--red)' : 'var(--ink)') : ''; }); } });
  }

  /* ---------- models ---------- */
  var M = [
    { name: 'АМ 700', W: 960, h: 450, pump: '1 × 2,2–3 бар · 90 л/мин', size: '960×970×1210', v: '220 / 380 В', desc: 'Самая компактная. Единственная работает и от 220 В.' },
    { name: 'АМ 800', W: 1030, h: 525, pump: '1 × 3–3,5 бар · 90 л/мин', size: '1030×1040×1305', v: '380 В', desc: 'Универсальная. Два ТЭНа, давление до 3,5 бар.' },
    { name: 'АМ 1000', W: 1230, h: 635, pump: '2 × 3,5 бар · 90 л/мин', size: '1230×1240×1410', v: '380 В', desc: 'Для крупных узлов. Два насоса, три ТЭНа.' },
    { name: 'АМ 1200', W: 1550, h: 700, pump: '2 × 3–3,5 бар · 400 л/мин', size: '1550×1400×1500', v: '380 В', desc: 'Флагман: 550 кг на корзине и 400 л/мин подачи.' }
  ];
  var rows = $$('.mrow'), photo = $('.models__photo'), cur = 2;
  function setModel(i) {
    cur = i; var m = M[i];
    rows.forEach(function (r, k) { r.setAttribute('aria-selected', String(k === i)); r.tabIndex = k === i ? 0 : -1; });
    photo.style.setProperty('--s', (m.W / 1550).toFixed(3));
    $('[data-k="ghost"]').textContent = m.name.replace('АМ ', '');
    $('[data-k="W"]').textContent = m.W;
    $('[data-k="desc"]').textContent = m.desc;
    $('[data-k="h"]').textContent = m.h + ' мм';
    $('[data-k="pump"]').textContent = m.pump;
    $('[data-k="size"]').textContent = m.size;
    $('[data-k="v"]').textContent = m.v;
    var cta = $('[data-k="cta"]'); cta.textContent = 'КП на ' + m.name + ' →'; cta.dataset.order = m.name;
  }
  rows.forEach(function (r, k) {
    r.addEventListener('click', function () { setModel(k); });
    if (fine) r.addEventListener('pointerenter', function () { setModel(k); });
    r.addEventListener('keydown', function (e) {
      var d = (e.key === 'ArrowDown' || e.key === 'ArrowRight') ? 1 : (e.key === 'ArrowUp' || e.key === 'ArrowLeft') ? -1 : 0;
      if (!d) return; e.preventDefault();
      var n = (cur + d + M.length) % M.length; setModel(n); rows[n].focus();
    });
  });
  setModel(cur);
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-order]');
    if (b) { var sel = $('select[name="model"]'); if (sel) sel.value = b.dataset.order; }
  });

  /* ---------- reveals ---------- */
  if (hasGsap && !reduce) {
    gsap.from('.hero__l1, .hero__l2', { yPercent: 40, opacity: 0, duration: 1.4, stagger: .12, ease: 'expo.out', delay: .3 });
    gsap.from('.stair span, .hd', { opacity: 0, y: 12, duration: .9, stagger: .05, ease: 'expo.out', delay: 1 });
    $$('.h2, .lead__h').forEach(function (h) {
      gsap.from(h, { clipPath: 'inset(0 0 100% 0)', y: 30, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 88%' } });
    });
    gsap.from('.cascade li', { opacity: 0, x: -40, duration: .9, stagger: .1, ease: 'expo.out', scrollTrigger: { trigger: '.cascade', start: 'top 80%' } });
    gsap.fromTo('.cycle__axis line', { strokeDashoffset: 400 }, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: '.cycle', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.from('.bc', { opacity: 0, y: 50, duration: 1, stagger: .08, ease: 'expo.out', scrollTrigger: { trigger: '.build', start: 'top 70%' } });
    gsap.fromTo('.factory__word', { backgroundPosition: '50% 30%' }, { backgroundPosition: '50% 80%', ease: 'none', scrollTrigger: { trigger: '.factory', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.from('.ttable li', { opacity: 0, y: 24, duration: .8, stagger: .06, ease: 'expo.out', scrollTrigger: { trigger: '.ttable', start: 'top 85%' } });
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

  /* ---------- form table (no backend on GitHub Pages: hand off to the mail client) ---------- */
  var form = $('[data-form]');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var F = form.elements;
    var iName = F.namedItem('name'), iPhone = F.namedItem('phone'), iAgree = F.namedItem('agree'), iModel = F.namedItem('model'), iMsg = F.namedItem('msg');
    var name = iName.value.trim(), phone = iPhone.value.trim(), phoneOk = phone.replace(/\D/g, '').length >= 10;
    iName.closest('.fc').classList.toggle('is-bad', !name);
    iPhone.closest('.fc').classList.toggle('is-bad', !phoneOk);
    iAgree.closest('.fc').classList.toggle('is-bad', !iAgree.checked);
    if (!name) return iName.focus();
    if (!phoneOk) return iPhone.focus();
    if (!iAgree.checked) return iAgree.focus();
    var body = 'Имя: ' + name + '\nТелефон: ' + phone + '\nМодель: ' + iModel.value + (iMsg.value.trim() ? '\nДетали: ' + iMsg.value.trim() : '');
    window.location.href = 'mailto:klimentcompany@mail.ru?subject=' + encodeURIComponent('Заявка на КП — ' + iModel.value) + '&body=' + encodeURIComponent(body);
    $('.ftable__done', form).hidden = false;
  });

  drawGuides();
  var rt; addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { drawGuides(); fitAll(); }, 150); });
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(fitAll);
})();
