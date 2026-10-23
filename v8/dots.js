/* Kliment v8 — LED dot-matrix type. Text is rasterised offscreen and sampled on a grid;
   lit dots are drawn each frame. Pointer and "rain" drop rings that travel through the dots like ripples on water. */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FONT = 'Commissioner';
  var RED = 'oklch(0.6 0.22 27)';

  function Board(cv) {
    this.cv = cv;
    this.ctx = cv.getContext('2d');
    this.lines = cv.dataset.text.split('|');
    this.cellBase = +cv.dataset.cell || 8;
    this.weight = cv.dataset.weight || 800;
    this.interactive = cv.hasAttribute('data-interactive');
    this.ripples = [];
    this.introT = -1;
    this.visible = false;
    this.hover = null;
    this.lastDrop = null;
    this.running = false;
    this.build();
    var self = this;
    new IntersectionObserver(function (es) {
      self.visible = es[0].isIntersecting;
      if (self.visible && self.introT < 0) self.introT = performance.now();
      if (self.visible) self.wake();
    }, { threshold: 0.15 }).observe(cv);
    if (this.interactive && !reduce) this.bind();
  }

  Board.prototype.build = function () {
    var cv = this.cv, W = cv.clientWidth;
    if (!W) return;
    this.W = W;
    var cell = this.cell = Math.max(3.4, this.cellBase * Math.min(1, W / 1200) * (W < 600 ? 1.25 : 1));
    var off = document.createElement('canvas'), o = off.getContext('2d');
    var font = function (px) { return this.weight + ' ' + px + 'px "' + FONT + '", sans-serif'; }.bind(this);
    o.font = font(100);
    var widest = Math.max.apply(null, this.lines.map(function (l) { return o.measureText(l).width; }));
    var fs = 100 * W / widest * 0.985, lineH = fs * 0.9, padTop = fs * 0.16;
    var H = Math.ceil(padTop + lineH * this.lines.length + fs * 0.04);
    off.width = W; off.height = H;
    o.font = font(fs); o.fillStyle = '#000'; o.textBaseline = 'alphabetic';
    this.lines.forEach(function (l, i) { o.fillText(l, (W - o.measureText(l).width) / 2, padTop + fs * 0.74 + i * lineH); });
    var data = o.getImageData(0, 0, W, H).data;
    var xs = [], ys = [], seeds = [], allX = [], allY = [];
    for (var y = cell / 2; y < H; y += cell) for (var x = cell / 2; x < W; x += cell) {
      allX.push(x); allY.push(y);
      if (data[((y | 0) * W + (x | 0)) * 4 + 3] > 110) { xs.push(x); ys.push(y); seeds.push(Math.random()); }
    }
    this.xs = xs; this.ys = ys; this.seeds = seeds; this.H = H;
    var dpr = this.dpr = Math.min(devicePixelRatio || 1, 2);
    cv.style.height = H + 'px'; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    // unlit grid, drawn once
    var bg = this.bg = document.createElement('canvas'); bg.width = cv.width; bg.height = cv.height;
    var b = bg.getContext('2d'); b.scale(dpr, dpr);
    b.fillStyle = getComputedStyle(cv).color; b.globalAlpha = 0.07; b.beginPath();
    for (var i = 0; i < allX.length; i++) { b.moveTo(allX[i] + cell * 0.16, allY[i]); b.arc(allX[i], allY[i], cell * 0.16, 0, 6.283); }
    b.fill();
    this.wake();
  };

  Board.prototype.bind = function () {
    var self = this, cv = this.cv;
    function pos(e) { var r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
    cv.addEventListener('pointermove', function (e) {
      var p = pos(e); self.hover = p;
      if (!self.lastDrop || Math.hypot(p[0] - self.lastDrop[0], p[1] - self.lastDrop[1]) > 70) { self.drop(p[0], p[1], 0.9); self.lastDrop = p; }
      self.wake();
    });
    cv.addEventListener('pointerleave', function () { self.hover = null; self.lastDrop = null; });
    cv.addEventListener('pointerdown', function (e) { var p = pos(e); self.drop(p[0], p[1], 1.8); self.wake(); });
  };

  Board.prototype.drop = function (x, y, amp) { this.ripples.push({ x: x, y: y, t0: performance.now(), amp: amp }); if (this.ripples.length > 14) this.ripples.shift(); };

  Board.prototype.wake = function () {
    if (this.running) return;
    this.running = true;
    var self = this;
    requestAnimationFrame(function f(now) { if (self.draw(now)) requestAnimationFrame(f); else self.running = false; });
  };

  Board.prototype.draw = function (now) {
    if (!this.xs) return false;
    var ctx = this.ctx, cell = this.cell, base = cell * 0.36, dpr = this.dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.cv.width, this.cv.height);
    ctx.drawImage(this.bg, 0, 0);
    ctx.setTransform(dpr, dpr ? 0 : 0, 0, dpr, 0, 0);
    var t = this.introT < 0 ? -1 : (now - this.introT) / 1000;
    if (reduce && t >= 0) t = 99;
    var introDone = t > 1.6;
    // keep only living ripples
    this.ripples = this.ripples.filter(function (r) { return now - r.t0 < 2600; });
    var R = this.ripples, hv = this.hover, W = this.W;
    var ink = getComputedStyle(this.cv).color;
    var path = new Path2D(), crest = new Path2D();
    for (var i = 0; i < this.xs.length; i++) {
      var x = this.xs[i], y = this.ys[i];
      var rev = t < 0 ? 0 : Math.min(1, Math.max(0, (t - this.seeds[i] * 0.9 - (x / W) * 0.5) / 0.22));
      if (rev <= 0) continue;
      var k = 0;
      for (var j = 0; j < R.length; j++) {
        var age = (now - R[j].t0) / 1000, rad = age * 520, d = Math.hypot(x - R[j].x, y - R[j].y);
        k += R[j].amp * Math.exp(-Math.pow((d - rad) / (cell * 2.6), 2)) * Math.exp(-age * 1.4);
      }
      if (hv) { var dh = Math.hypot(x - hv[0], y - hv[1]); if (dh < 80) k += (1 - dh / 80) * 0.7; }
      var r = base * rev * (1 + Math.min(k, 1.6) * 0.9);
      var target = k > 0.55 ? crest : path;
      target.moveTo(x + r, y); target.arc(x, y, r, 0, 6.283);
    }
    ctx.fillStyle = ink; ctx.fill(path);
    ctx.fillStyle = RED; ctx.fill(crest);
    return this.visible && (!introDone || R.length > 0 || !!hv);
  };

  var boards = [];
  function init() {
    document.querySelectorAll('canvas[data-dots]').forEach(function (cv) { boards.push(new Board(cv)); });
    window.KlDots = boards;
    // ambient rain on interactive boards so the display is never dead
    if (!reduce) setInterval(function () {
      boards.forEach(function (b) { if (b.interactive && b.visible && !b.hover && b.xs && b.xs.length) { var i = (Math.random() * b.xs.length) | 0; b.drop(b.xs[i], b.ys[i], 0.7); b.wake(); } });
    }, 1800);
    var rt; addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { boards.forEach(function (b) { if (b.cv.clientWidth !== b.W) b.build(); }); }, 150); });
  }
  var fontReq = document.fonts && document.fonts.load ? Promise.all([document.fonts.load('800 100px "' + FONT + '"'), document.fonts.load('700 100px "' + FONT + '"')]) : Promise.resolve();
  fontReq.then(init, init);
})();
