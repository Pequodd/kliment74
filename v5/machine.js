/* Kliment v5 — a procedural stainless parts washer that runs one cycle as you scroll.
   Units are metres, modelled on the AM 1000: body 1.1 × 1.1, rim at 1.25 m. */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const canvas = document.querySelector('.film__gl');
const stick = document.querySelector('.film__stick');
const kl = window.kl || { p: 0 };
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
} catch (e) { document.documentElement.classList.add('no-webgl'); }
if (renderer) build();


function build() {
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 50);

  /* ---------- materials ---------- */
  const steel = new THREE.MeshPhysicalMaterial({ color: 0x9aa2a9, metalness: 1, roughness: 0.24, anisotropy: 0.8, clearcoat: 0.3, clearcoatRoughness: 0.35, envMapIntensity: 0.55 });
  const steelDark = new THREE.MeshPhysicalMaterial({ color: 0x7f878e, metalness: 1, roughness: 0.38, anisotropy: 0.5, envMapIntensity: 0.5 });
  const steelInner = new THREE.MeshPhysicalMaterial({ color: 0x6d757c, metalness: 1, roughness: 0.3, side: THREE.DoubleSide, envMapIntensity: 0.45 });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.85 });
  const red = new THREE.MeshStandardMaterial({ color: 0xc7271d, roughness: 0.35 });

  const M = new THREE.Group();
  scene.add(M);
  const box = (w, h, d, mat, x, y, z, parent = M) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  };

  /* ---------- frame + legs ---------- */
  const L = 0.52, legT = 0.045;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(legT, 0.6, legT, steelDark, sx * L, 0.3, sz * L);
  for (const y of [0.1, 0.56]) {
    box(L * 2, legT, legT, steelDark, 0, y, L); box(L * 2, legT, legT, steelDark, 0, y, -L);
    box(legT, legT, L * 2, steelDark, L, y, 0); box(legT, legT, L * 2, steelDark, -L, y, 0);
  }

  /* ---------- tank: four walls and a floor, open at the top ---------- */
  const W = 1.1, y0 = 0.58, y1 = 1.25, H = y1 - y0, t = 0.02;
  box(W, H, t, steel, 0, y0 + H / 2, W / 2);
  box(W, H, t, steel, 0, y0 + H / 2, -W / 2);
  box(t, H, W, steel, W / 2, y0 + H / 2, 0);
  box(t, H, W, steel, -W / 2, y0 + H / 2, 0);
  box(W - t, t, W - t, steelInner, 0, y0 + 0.04, 0);
  // inner faces a touch darker so the chamber reads as a volume
  for (const [w, d, x, z] of [[W - 2 * t, 0.002, 0, W / 2 - t], [W - 2 * t, 0.002, 0, -W / 2 + t], [0.002, W - 2 * t, W / 2 - t, 0], [0.002, W - 2 * t, -W / 2 + t, 0]])
    box(w, H - 0.06, d, steelInner, x, y0 + H / 2 + 0.02, z);
  // rubber seal around the rim
  const s = 0.04;
  box(W + 0.02, s, s, rubber, 0, y1 + s / 2, W / 2); box(W + 0.02, s, s, rubber, 0, y1 + s / 2, -W / 2);
  box(s, s, W + 0.02, rubber, W / 2, y1 + s / 2, 0); box(s, s, W + 0.02, rubber, -W / 2, y1 + s / 2, 0);
  // front latch + drain
  box(0.08, 0.12, 0.03, steelDark, -0.3, y1 - 0.12, W / 2 + 0.02);
  const drain = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.12, 16), steelDark);
  drain.rotation.x = Math.PI / 2; drain.position.set(-0.35, y0 + 0.06, W / 2 + 0.06); M.add(drain);

  // logo on the front wall
  const lc = document.createElement('canvas'); lc.width = 512; lc.height = 128;
  const lg = lc.getContext('2d');
  lg.fillStyle = '#20262b'; lg.font = '600 76px "Golos Text", Arial, sans-serif'; lg.textBaseline = 'middle';
  lg.beginPath(); lg.arc(64, 64, 40, 0, Math.PI * 2); lg.lineWidth = 7; lg.strokeStyle = '#20262b'; lg.stroke();
  lg.beginPath(); lg.ellipse(64, 64, 16, 40, 0, 0, Math.PI * 2); lg.stroke();
  lg.beginPath(); lg.moveTo(24, 64); lg.lineTo(104, 64); lg.stroke();
  lg.fillText('Kliment', 124, 68);
  const logoTex = new THREE.CanvasTexture(lc); logoTex.colorSpace = THREE.SRGBColorSpace; logoTex.anisotropy = 4;
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.085), new THREE.MeshBasicMaterial({ map: logoTex, transparent: true }));
  logo.position.set(0.18, y1 - 0.2, W / 2 + 0.012); M.add(logo);

  /* ---------- control box with the display and the e-stop ---------- */
  const cb = box(0.22, 0.5, 0.44, steel, W / 2 + 0.12, 0.92, 0.22);
  const dc = document.createElement('canvas'); dc.width = 256; dc.height = 128;
  const dg = dc.getContext('2d');
  const dispTex = new THREE.CanvasTexture(dc); dispTex.colorSpace = THREE.SRGBColorSpace;
  function drawDisplay(prog, on) {
    dg.fillStyle = '#05080b'; dg.fillRect(0, 0, 256, 128);
    dg.fillStyle = on ? '#7cc4ff' : '#25313b';
    dg.font = '600 34px "JetBrains Mono", monospace'; dg.textBaseline = 'top';
    dg.fillText(on ? 'ЦИКЛ' : 'ГОТОВ', 18, 18);
    dg.fillStyle = '#16202a'; dg.fillRect(18, 80, 220, 18);
    dg.fillStyle = '#7cc4ff'; dg.fillRect(18, 80, 220 * prog, 18);
    dispTex.needsUpdate = true;
  }
  drawDisplay(0, false);
  const disp = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.1), new THREE.MeshBasicMaterial({ map: dispTex, toneMapped: false }));
  disp.rotation.y = Math.PI / 2; disp.position.set(W / 2 + 0.231, 1.0, 0.22); M.add(disp);
  const estop = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 24), red);
  estop.rotation.z = Math.PI / 2; estop.position.set(W / 2 + 0.245, 1.1, 0.34); M.add(estop);
  for (const z of [0.1, 0.16]) { const k = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.025, 16), rubber); k.rotation.z = Math.PI / 2; k.position.set(W / 2 + 0.24, 0.86, z); M.add(k); }

  /* ---------- basket: rim, lattice, hub — it spins ---------- */
  const basket = new THREE.Group(); basket.position.set(0, 0.98, 0); M.add(basket);
  const R = 0.48;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R, 0.014, 12, 96), steel); rim.rotation.x = Math.PI / 2; rim.castShadow = true; basket.add(rim);
  const bars = [];
  for (let k = -4; k <= 4; k++) {
    const c = k * 0.1, half = Math.sqrt(R * R - c * c);
    bars.push([2 * half, c, 'x'], [2 * half, c, 'z']);
  }
  const bar = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), steel, bars.length);
  const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3();
  bars.forEach(([len, c, ax], i) => {
    if (ax === 'x') { ps.set(0, 0, c); sc.set(len, 0.045, 0.007); } else { ps.set(c, 0, 0); sc.set(0.007, 0.045, len); }
    mtx.compose(ps, q, sc); bar.setMatrixAt(i, mtx);
  });
  bar.castShadow = true; basket.add(bar);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.07, 24), steelDark); basket.add(hub);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.36, 12), steelDark); shaft.position.set(0, 0.8, 0); M.add(shaft);
  // something to wash: two dark parts on the basket
  const grime = new THREE.MeshStandardMaterial({ color: 0x3a3430, roughness: 0.7, metalness: 0.5 });
  const partA = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.09, 32), grime); partA.position.set(-0.18, 0.07, 0.1); basket.add(partA);
  const partB = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.14), grime); partB.position.set(0.2, 0.08, -0.12); partB.rotation.y = 0.5; basket.add(partB);
  partA.castShadow = partB.castShadow = true;

  /* ---------- two U-shaped ramps with nozzles ---------- */
  const tube = 0.03, rx = 0.5, rb = 0.68, rt = 1.17, nozzles = [];
  function ramp(rot, topY) {
    const g = new THREE.Group(); g.rotation.y = rot; M.add(g);
    box(tube, topY - rb, tube, steel, rx, (rb + topY) / 2, 0, g);
    box(tube, topY - rb, tube, steel, -rx, (rb + topY) / 2, 0, g);
    box(rx * 2 + tube, tube, tube, steel, 0, topY, 0, g);
    box(rx * 2 + tube, tube, tube, steel, 0, rb, 0, g);
    const c = Math.cos(rot), sn = Math.sin(rot);
    const P = (x, y) => new THREE.Vector3(x * c, y, -x * sn);
    const D = (x, y, z) => new THREE.Vector3(x * c + z * sn, y, -x * sn + z * c);
    for (let i = 0; i < 6; i++) { const x = -0.38 + i * 0.152; nozzles.push({ p: P(x, topY - 0.02), d: D(0, -1, 0) }); nozzles.push({ p: P(x, rb + 0.02), d: D(0, 1, 0) }); }
    for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) nozzles.push({ p: P(sx * (rx - 0.02), 0.86 + i * 0.1), d: D(-sx, -0.15, 0) });
  }
  ramp(0, rt); ramp(Math.PI / 2, rt - 0.04);

  /* ---------- lid on a hinge at the back ---------- */
  const lid = new THREE.Group(); lid.position.set(0, y1 + 0.04, -W / 2); M.add(lid);
  box(W + 0.06, 0.025, W + 0.06, steel, 0, 0.012, W / 2, lid);
  const hood = new THREE.Mesh(new THREE.BoxGeometry(W - 0.12, 0.14, W - 0.2), steel);
  hood.position.set(0, 0.095, W / 2 + 0.02); hood.castShadow = true; lid.add(hood);
  box(W + 0.06, 0.07, 0.02, steel, 0, -0.02, W + 0.03, lid);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.014, 10, 24, Math.PI), rubber);
  handle.position.set(-0.25, 0.17, W / 2 - 0.3); handle.rotation.y = Math.PI / 2; lid.add(handle);

  /* ---------- floor + shadow catcher ---------- */
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.ShadowMaterial({ opacity: 0.45 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const glowC = document.createElement('canvas'); glowC.width = glowC.height = 128;
  const gg = glowC.getContext('2d'); const grd = gg.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(110,170,230,.35)'); grd.addColorStop(1, 'rgba(110,170,230,0)'); gg.fillStyle = grd; gg.fillRect(0, 0, 128, 128);
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3.2), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(glowC), transparent: true, depthWrite: false }));
  glow.rotation.x = -Math.PI / 2; glow.position.y = 0.002; scene.add(glow);

  /* ---------- lights ---------- */
  scene.add(new THREE.HemisphereLight(0xcfe3ff, 0x0b0e12, 0.35));
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(2.5, 4.5, 3); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); key.shadow.camera.left = -2; key.shadow.camera.right = 2; key.shadow.camera.top = 2; key.shadow.camera.bottom = -2; key.shadow.bias = -0.0005; key.shadow.radius = 4;
  scene.add(key);
  const rimLight = new THREE.DirectionalLight(0x6aa8ff, 2.4); rimLight.position.set(-3, 2.5, -2.5); scene.add(rimLight);
  const inner = new THREE.PointLight(0x8cc8ff, 0, 1.6); inner.position.set(0, 1.1, 0); scene.add(inner);

  /* ---------- water ---------- */
  const N = innerWidth < 820 ? 1400 : 2800;
  const pos = new Float32Array(N * 3), vel = new Float32Array(N * 3), life = new Float32Array(N);
  const spr = document.createElement('canvas'); spr.width = spr.height = 32;
  const sg = spr.getContext('2d'); const sgr = sg.createRadialGradient(16, 16, 0, 16, 16, 16);
  sgr.addColorStop(0, 'rgba(255,255,255,1)'); sgr.addColorStop(.4, 'rgba(200,230,255,.7)'); sgr.addColorStop(1, 'rgba(200,230,255,0)'); sg.fillStyle = sgr; sg.fillRect(0, 0, 32, 32);
  const waterGeo = new THREE.BufferGeometry(); waterGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const waterMat = new THREE.PointsMaterial({ size: 0.018, map: new THREE.CanvasTexture(spr), color: 0x9fd2ff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 });
  const water = new THREE.Points(waterGeo, waterMat); M.add(water);
  function spawn(i) {
    const n = nozzles[(Math.random() * nozzles.length) | 0], sp = 2.2 + Math.random() * 1.2, j = 0.18;
    pos[i * 3] = n.p.x; pos[i * 3 + 1] = n.p.y; pos[i * 3 + 2] = n.p.z;
    vel[i * 3] = (n.d.x + (Math.random() - .5) * j) * sp; vel[i * 3 + 1] = (n.d.y + (Math.random() - .5) * j) * sp; vel[i * 3 + 2] = (n.d.z + (Math.random() - .5) * j) * sp;
    life[i] = 0.25 + Math.random() * 0.35;
  }
  for (let i = 0; i < N; i++) { spawn(i); life[i] = Math.random() * 0.5; }

  /* ---------- camera path: one key per scene ---------- */
  const keys = [
    { p: 0.0, pos: [2.9, 2.0, 3.4], at: [0, 0.82, 0] },
    { p: 0.22, pos: [2.6, 2.7, 3.0], at: [0, 1.05, 0] },
    { p: 0.42, pos: [0.8, 4.0, 1.7], at: [0, 1.0, 0] },
    { p: 0.66, pos: [1.9, 2.6, 2.3], at: [0, 1.0, 0] },
    { p: 0.9, pos: [3.2, 1.8, 2.3], at: [0.3, 0.9, 0.1] },
    { p: 1.0, pos: [3.4, 1.9, 2.6], at: [0.25, 0.9, 0.1] }
  ];
  const vA = new THREE.Vector3(), vB = new THREE.Vector3(), tA = new THREE.Vector3(), tB = new THREE.Vector3();
  function camAt(p, out, outT) {
    let i = 0; while (i < keys.length - 2 && p > keys[i + 1].p) i++;
    const a = keys[i], b = keys[i + 1], k = smooth(a.p, b.p, p);
    out.copy(vA.fromArray(a.pos)).lerp(vB.fromArray(b.pos), k);
    outT.copy(tA.fromArray(a.at)).lerp(tB.fromArray(b.at), k);
  }

  /* ---------- sizing ---------- */
  let w = 0, h = 0, mobile = false;
  function resize() {
    w = stick.clientWidth; h = stick.clientHeight; mobile = w < 820;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = mobile ? 40 : 30;
    // desktop: machine sits right of the captions; mobile: above them
    if (mobile) camera.setViewOffset(w, h, 0, h * 0.2, w, h); else camera.setViewOffset(w, h, -w * 0.2, 0, w, h);
    camera.updateProjectionMatrix();
  }
  resize(); addEventListener('resize', resize);

  let mx = 0, my = 0, smx = 0, smy = 0;
  addEventListener('pointermove', (e) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; }, { passive: true });
  let visible = true;
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; }).observe(stick);

  /* ---------- loop ---------- */
  const clock = new THREE.Clock();
  const cp = new THREE.Vector3(), ct = new THREE.Vector3();
  let sp = kl.p, spin = 0, lastDisp = -1;
  function frame() {
    requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!visible) return;
    sp += (kl.p - sp) * 0.08; // eased progress so the camera never jerks
    const p = kl.reduce ? 0 : sp, time = clock.elapsedTime;

    const open = smooth(0.1, 0.27, p) - smooth(0.78, 0.9, p);
    lid.rotation.x = -1.92 * open;
    const spinSpeed = 0.15 + smooth(0.32, 0.45, p) * 2.2;
    spin += dt * spinSpeed; basket.rotation.y = spin;
    const jets = smooth(0.5, 0.58, p) * (1 - smooth(0.75, 0.8, p));
    waterMat.opacity = jets * 0.95; inner.intensity = jets * 2.5;
    // parts come clean while the jets run
    const clean = smooth(0.55, 0.76, p);
    grime.color.setRGB(0.23 + clean * 0.55, 0.2 + clean * 0.6, 0.19 + clean * 0.64); grime.roughness = 0.7 - clean * 0.45; grime.metalness = 0.5 + clean * 0.5;

    if (jets > 0.01) {
      const a = waterGeo.attributes.position.array;
      for (let i = 0; i < N; i++) {
        life[i] -= dt; vel[i * 3 + 1] -= 3.2 * dt;
        a[i * 3] += vel[i * 3] * dt; a[i * 3 + 1] += vel[i * 3 + 1] * dt; a[i * 3 + 2] += vel[i * 3 + 2] * dt;
        const x = a[i * 3], y = a[i * 3 + 1], z = a[i * 3 + 2];
        if (life[i] <= 0 || y < y0 + 0.05 || Math.abs(x) > W / 2 - 0.03 || Math.abs(z) > W / 2 - 0.03) spawn(i);
      }
      waterGeo.attributes.position.needsUpdate = true;
    }

    const cycle = smooth(0.85, 1, p), on = p > 0.82;
    const dk = Math.round(cycle * 40);
    if (dk !== lastDisp) { lastDisp = dk; drawDisplay(cycle, on); }

    camAt(p, cp, ct);
    smx += (mx - smx) * 0.05; smy += (my - smy) * 0.05;
    const idle = kl.reduce ? 0 : Math.sin(time * 0.25) * 0.08;
    camera.position.set(cp.x + smx * 0.5 + idle, cp.y - smy * 0.3, cp.z - smx * 0.3);
    if (mobile) camera.position.multiplyScalar(1.12);
    camera.lookAt(ct);
    renderer.render(scene, camera);
  }
  frame();
  document.documentElement.classList.add('has-machine');
}
