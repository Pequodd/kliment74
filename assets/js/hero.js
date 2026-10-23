/* KLIMENT — hero: the washer basket as a live point cloud, jets spraying from the U-ramps */
import * as THREE from 'three';

const canvas = document.querySelector('.hero__gl');
const hero = document.querySelector('.hero');
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function fail() { document.documentElement.classList.add('no-webgl'); }

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' });
} catch (e) { fail(); }

if (renderer) init();

function dotTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(.35, 'rgba(255,255,255,.8)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function init() {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0D1418, 6, 13);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
  const sprite = dotTexture();

  const R = 1.6; // basket radius in scene units
  const rig = new THREE.Group(); scene.add(rig);

  /* --- basket: outer rings + square lattice clipped to the circle, like the real one --- */
  const bp = [];
  const ringN = 360;
  for (const [rr, yy] of [[R, 0], [R * 0.985, -0.05], [R * 0.5, 0], [0.16, 0]]) {
    for (let i = 0; i < ringN * (rr / R); i++) {
      const a = (i / (ringN * (rr / R))) * Math.PI * 2;
      bp.push(Math.cos(a) * rr, yy, Math.sin(a) * rr);
    }
  }
  const step = R / 6;
  for (let k = -6; k <= 6; k++) {
    const c = k * step, half = Math.sqrt(Math.max(0, R * R - c * c));
    for (let s = -half; s <= half; s += 0.035) { bp.push(c, 0, s); bp.push(s, 0, c); }
  }
  const basketGeo = new THREE.BufferGeometry();
  basketGeo.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3));
  const basket = new THREE.Points(basketGeo, new THREE.PointsMaterial({
    size: 0.035, map: sprite, color: 0xC9D2D8, transparent: true, depthWrite: false, opacity: .95
  }));
  rig.add(basket);

  /* --- tank: a faint box of steel around everything --- */
  const tp = [];
  const bx = R + 0.35, by0 = -0.9, by1 = 0.25;
  const edge = (x0, y0, z0, x1, y1, z1, n) => { for (let i = 0; i <= n; i++) { const t = i / n; tp.push(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, z0 + (z1 - z0) * t); } };
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) edge(sx * bx, by0, sz * bx, sx * bx, by1, sz * bx, 40);
  for (const yy of [by0, by1]) { edge(-bx, yy, -bx, bx, yy, -bx, 90); edge(-bx, yy, bx, bx, yy, bx, 90); edge(-bx, yy, -bx, -bx, yy, bx, 90); edge(bx, yy, -bx, bx, yy, bx, 90); }
  const tankGeo = new THREE.BufferGeometry();
  tankGeo.setAttribute('position', new THREE.Float32BufferAttribute(tp, 3));
  rig.add(new THREE.Points(tankGeo, new THREE.PointsMaterial({ size: 0.025, map: sprite, color: 0x5F7480, transparent: true, depthWrite: false, opacity: .7 })));

  /* --- two U-shaped ramps: down the side, across the top --- */
  const rp = [], nozzles = [];
  const top = 1.35, side = R + 0.15;
  function ramp(angle) {
    const ca = Math.cos(angle), sa = Math.sin(angle);
    const P = (u, y) => [u * ca, y, u * sa];
    for (let y = -0.35; y <= top; y += 0.03) { rp.push(...P(-side, y)); rp.push(...P(side, y)); }
    for (let u = -side; u <= side; u += 0.03) rp.push(...P(u, top));
    for (let i = 0; i < 7; i++) { // nozzles along the top bar and the sides
      const u = -R * 0.85 + (i / 6) * R * 1.7;
      nozzles.push({ p: P(u, top - 0.02), d: [0, -1, 0] });
    }
    for (const sgn of [-1, 1]) for (let i = 0; i < 3; i++) {
      nozzles.push({ p: P(sgn * side, 0.25 + i * 0.32), d: [-sgn * ca, -0.25, -sgn * sa] });
    }
    for (let i = 0; i < 4; i++) { // bottom jets
      const u = -R * 0.7 + (i / 3) * R * 1.4;
      nozzles.push({ p: P(u, -0.35), d: [0, 1, 0] });
    }
  }
  ramp(0); ramp(Math.PI / 2);
  const rampGeo = new THREE.BufferGeometry();
  rampGeo.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3));
  const ramps = new THREE.Points(rampGeo, new THREE.PointsMaterial({ size: 0.05, map: sprite, color: 0xE8EDF0, transparent: true, depthWrite: false }));
  rig.add(ramps);

  /* --- spray --- */
  const N = window.innerWidth < 700 ? 2200 : 4200;
  const pos = new Float32Array(N * 3), vel = new Float32Array(N * 3), life = new Float32Array(N);
  const col = new Float32Array(N * 3);
  const cA = new THREE.Color(0x5FB4F2), cB = new THREE.Color(0xE6F4FF);
  function spawn(i, randomAge) {
    const nz = nozzles[(Math.random() * nozzles.length) | 0];
    pos[i * 3] = nz.p[0]; pos[i * 3 + 1] = nz.p[1]; pos[i * 3 + 2] = nz.p[2];
    const sp = 3.2 + Math.random() * 1.4, j = 0.1;
    vel[i * 3] = (nz.d[0] + (Math.random() - .5) * j) * sp;
    vel[i * 3 + 1] = (nz.d[1] + (Math.random() - .5) * j) * sp;
    vel[i * 3 + 2] = (nz.d[2] + (Math.random() - .5) * j) * sp;
    life[i] = randomAge ? Math.random() * 0.7 : 0.7;
    const c = Math.random() < .25 ? cB : cA;
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  for (let i = 0; i < N; i++) {
    spawn(i, true);
    const k = Math.random() * 0.5; // pre-advance so the first frame is already mid-spray
    pos[i * 3] += vel[i * 3] * k; pos[i * 3 + 1] += vel[i * 3 + 1] * k; pos[i * 3 + 2] += vel[i * 3 + 2] * k;
  }
  const sprayGeo = new THREE.BufferGeometry();
  sprayGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  sprayGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const sprayMat = new THREE.PointsMaterial({ size: 0.04, map: sprite, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .85 });
  const spray = new THREE.Points(sprayGeo, sprayMat);
  rig.add(spray);

  /* --- layout --- */
  let w = 0, h = 0, mobile = false;
  function resize() {
    const r = hero.getBoundingClientRect();
    w = r.width; h = r.height; mobile = w < 960;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    // push the basket to the right on desktop (text lives left), up on mobile (text lives below)
    if (mobile) camera.setViewOffset(w, h, 0, h * 0.2, w, h);
    else camera.setViewOffset(w, h, -w * 0.27, -h * 0.02, w, h);
    rig.scale.setScalar(mobile ? 0.8 : 0.82);
  }
  resize();
  window.addEventListener('resize', resize);

  let mx = 0, my = 0, smx = 0, smy = 0;
  window.addEventListener('pointermove', (e) => { mx = e.clientX / window.innerWidth - .5; my = e.clientY / window.innerHeight - .5; }, { passive: true });

  let visible = true;
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; }, { threshold: 0 }).observe(hero);

  const clock = new THREE.Clock();
  let spin = 0;
  function frame() {
    requestAnimationFrame(frame);
    if (!visible) { clock.getDelta(); return; }
    const dt = Math.min(clock.getDelta(), 0.05);
    const sp = Math.min(1, Math.max(0, window.scrollY / (h || 1))); // hero scroll progress

    spin += dt * (reduce ? 0 : 0.45 + sp * 1.2);
    basket.rotation.y = spin;

    if (!reduce) {
      const g = 4.2;
      const p = sprayGeo.attributes.position.array;
      for (let i = 0; i < N; i++) {
        life[i] -= dt * 1.25;
        vel[i * 3 + 1] -= g * dt;
        p[i * 3] += vel[i * 3] * dt; p[i * 3 + 1] += vel[i * 3 + 1] * dt; p[i * 3 + 2] += vel[i * 3 + 2] * dt;
        const x = p[i * 3], y = p[i * 3 + 1], z = p[i * 3 + 2];
        // hits the basket plane: bounce as a small splash once, then die
        if (y < 0.02 && y > -0.08 && x * x + z * z < R * R && vel[i * 3 + 1] < 0) {
          if (Math.random() < 0.6) { spawn(i, false); continue; }
          vel[i * 3 + 1] *= -0.3; vel[i * 3] *= 0.3; vel[i * 3 + 2] *= 0.3;
          vel[i * 3] += (Math.random() - .5) * 1.4; vel[i * 3 + 2] += (Math.random() - .5) * 1.4;
          life[i] = Math.min(life[i], 0.18);
        }
        if (life[i] <= 0 || y < by0 || Math.abs(x) > bx + .4 || Math.abs(z) > bx + .4) spawn(i, false);
      }
      sprayGeo.attributes.position.needsUpdate = true;
    }

    // camera: three-quarter view that rises to look straight into the tank as you scroll
    smx += (mx - smx) * 0.05; smy += (my - smy) * 0.05;
    const elev = 0.5 + sp * 0.85 + smy * 0.15;  // radians above horizon
    const azim = 0.65 + smx * 0.35;
    const dist = (mobile ? 7.4 : 6.6) - sp * 1.6;
    const target = new THREE.Vector3(0, -0.1, 0);
    camera.position.set(
      target.x + Math.cos(elev) * Math.sin(azim) * dist,
      target.y + Math.sin(elev) * dist,
      Math.cos(elev) * Math.cos(azim) * dist
    );
    camera.lookAt(target);
    sprayMat.opacity = 0.85 * (1 - sp * 0.3);

    renderer.render(scene, camera);
  }
  frame();
}
