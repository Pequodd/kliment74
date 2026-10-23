/* Kliment v9 — the washer turns inside the dial. Scroll drives rotation and size (window.k9 = { rot, scale }).
   Procedural model in metres (AM 1000 proportions), lid held open so the basket shows. */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const canvas = document.querySelector('.dial__gl');
const box = document.querySelector('.dial');
const k9 = window.k9 || (window.k9 = { rot: 0, scale: 0.62 });
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); }
catch (e) { document.documentElement.classList.add('no-webgl'); }
if (renderer) build();

function build() {
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.88;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(renderer), 0.04).texture;
  const camera = new THREE.PerspectiveCamera(26, 1, 0.05, 50);

  const steel = new THREE.MeshPhysicalMaterial({ color: 0xa9b1b8, metalness: 1, roughness: 0.2, anisotropy: 0.9, clearcoat: 0.5, clearcoatRoughness: 0.2, envMapIntensity: 1.0 });
  const steelDark = new THREE.MeshPhysicalMaterial({ color: 0x8d959c, metalness: 1, roughness: 0.38, envMapIntensity: 0.6 });
  const inner = new THREE.MeshPhysicalMaterial({ color: 0x7a838a, metalness: 1, roughness: 0.3, side: THREE.DoubleSide, envMapIntensity: 0.55 });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.85 });
  const red = new THREE.MeshStandardMaterial({ color: 0xc7271d, roughness: 0.35 });

  const rig = new THREE.Group(); scene.add(rig);
  const M = new THREE.Group(); rig.add(M);
  const bx = (w, h, d, m, x, y, z, p = M) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; p.add(o); return o; };

  const L = 0.52, lt = 0.045;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) bx(lt, 0.6, lt, steelDark, sx * L, 0.3, sz * L);
  for (const y of [0.1, 0.56]) { bx(L * 2, lt, lt, steelDark, 0, y, L); bx(L * 2, lt, lt, steelDark, 0, y, -L); bx(lt, lt, L * 2, steelDark, L, y, 0); bx(lt, lt, L * 2, steelDark, -L, y, 0); }
  const W = 1.1, y0 = 0.58, y1 = 1.25, H = y1 - y0, t = 0.02;
  bx(W, H, t, steel, 0, y0 + H / 2, W / 2); bx(W, H, t, steel, 0, y0 + H / 2, -W / 2);
  bx(t, H, W, steel, W / 2, y0 + H / 2, 0); bx(t, H, W, steel, -W / 2, y0 + H / 2, 0);
  bx(W - t, t, W - t, inner, 0, y0 + 0.04, 0);
  for (const [w, d, x, z] of [[W - 2 * t, 0.002, 0, W / 2 - t], [W - 2 * t, 0.002, 0, -W / 2 + t], [0.002, W - 2 * t, W / 2 - t, 0], [0.002, W - 2 * t, -W / 2 + t, 0]]) bx(w, H - 0.06, d, inner, x, y0 + H / 2 + 0.02, z);
  const s = 0.04;
  bx(W + 0.02, s, s, rubber, 0, y1 + s / 2, W / 2); bx(W + 0.02, s, s, rubber, 0, y1 + s / 2, -W / 2);
  bx(s, s, W + 0.02, rubber, W / 2, y1 + s / 2, 0); bx(s, s, W + 0.02, rubber, -W / 2, y1 + s / 2, 0);
  bx(0.08, 0.12, 0.03, steelDark, -0.3, y1 - 0.12, W / 2 + 0.02);

  // logo on the front wall
  const lc = document.createElement('canvas'); lc.width = 512; lc.height = 128;
  const g = lc.getContext('2d'); g.strokeStyle = g.fillStyle = '#20262b'; g.lineWidth = 7;
  g.beginPath(); g.arc(64, 64, 40, 0, 6.283); g.stroke(); g.beginPath(); g.ellipse(64, 64, 16, 40, 0, 0, 6.283); g.stroke(); g.beginPath(); g.moveTo(24, 64); g.lineTo(104, 64); g.stroke();
  g.font = '600 76px "Onest", Arial, sans-serif'; g.textBaseline = 'middle'; g.fillText('Kliment', 124, 68);
  const lt2 = new THREE.CanvasTexture(lc); lt2.colorSpace = THREE.SRGBColorSpace;
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.085), new THREE.MeshBasicMaterial({ map: lt2, transparent: true }));
  logo.position.set(0.18, y1 - 0.2, W / 2 + 0.012); M.add(logo);

  // control box
  bx(0.22, 0.5, 0.44, steel, W / 2 + 0.12, 0.92, 0.22);
  const disp = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.1), new THREE.MeshBasicMaterial({ color: 0x0c1218 }));
  disp.rotation.y = Math.PI / 2; disp.position.set(W / 2 + 0.231, 1.0, 0.22); M.add(disp);
  const led = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.018), new THREE.MeshBasicMaterial({ color: 0x5aa8e6, toneMapped: false }));
  led.rotation.y = Math.PI / 2; led.position.set(W / 2 + 0.233, 0.98, 0.22); M.add(led);
  const es = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 24), red); es.rotation.z = Math.PI / 2; es.position.set(W / 2 + 0.245, 1.1, 0.34); M.add(es);

  // basket
  const basket = new THREE.Group(); basket.position.set(0, 0.98, 0); M.add(basket);
  const R = 0.48;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R, 0.014, 12, 96), steel); rim.rotation.x = Math.PI / 2; basket.add(rim);
  const bars = []; for (let k = -4; k <= 4; k++) { const c = k * 0.1, h2 = Math.sqrt(R * R - c * c); bars.push([2 * h2, c, 'x'], [2 * h2, c, 'z']); }
  const bar = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), steel, bars.length);
  const mt = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3();
  bars.forEach(([len, c, ax], i) => { if (ax === 'x') { ps.set(0, 0, c); sc.set(len, 0.045, 0.007); } else { ps.set(c, 0, 0); sc.set(0.007, 0.045, len); } mt.compose(ps, q, sc); bar.setMatrixAt(i, mt); });
  bar.castShadow = true; basket.add(bar);
  basket.add(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.07, 24), steelDark));

  // ramps
  const tube = 0.03, rx = 0.5, rb = 0.68, rt = 1.17;
  for (const [rot, top] of [[0, rt], [Math.PI / 2, rt - 0.04]]) {
    const gR = new THREE.Group(); gR.rotation.y = rot; M.add(gR);
    bx(tube, top - rb, tube, steel, rx, (rb + top) / 2, 0, gR); bx(tube, top - rb, tube, steel, -rx, (rb + top) / 2, 0, gR);
    bx(rx * 2 + tube, tube, tube, steel, 0, top, 0, gR); bx(rx * 2 + tube, tube, tube, steel, 0, rb, 0, gR);
  }

  // lid, open
  const lid = new THREE.Group(); lid.position.set(0, y1 + 0.04, -W / 2); M.add(lid);
  bx(W + 0.06, 0.025, W + 0.06, steel, 0, 0.012, W / 2, lid);
  bx(W - 0.12, 0.14, W - 0.2, steel, 0, 0.095, W / 2 + 0.02, lid);
  bx(W + 0.06, 0.07, 0.02, steel, 0, -0.02, W + 0.03, lid);
  lid.rotation.x = -1.78;

  M.position.set(0, 0, 0);

  // floor shadow
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.ShadowMaterial({ opacity: 0.22 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb8c0c4, 0.5));
  const key = new THREE.DirectionalLight(0xffffff, 2.8); key.position.set(2.5, 5, 3); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); Object.assign(key.shadow.camera, { left: -2, right: 2, top: 2, bottom: -2 }); key.shadow.bias = -0.0005; key.shadow.radius = 5;
  scene.add(key);

  function resize() {
    const w = box.clientWidth; if (!w) return;
    renderer.setSize(w, w, false);
    camera.aspect = 1; camera.updateProjectionMatrix();
  }
  resize(); addEventListener('resize', resize);
  camera.position.set(3.2, 2.6, 3.2); camera.lookAt(0, 1.08, 0);

  let visible = false;
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; }).observe(box);
  const clock = new THREE.Clock();
  let rot = 0, scl = k9.scale, spin = 0;
  (function frame() {
    requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!visible) return;
    rot += ((k9.rot || 0) - rot) * 0.08;
    scl += ((k9.scale || 0.62) - scl) * 0.08;
    spin += dt * (reduce ? 0 : 0.9);
    rig.rotation.y = -0.6 + rot + (reduce ? 0 : Math.sin(clock.elapsedTime * 0.3) * 0.05);
    basket.rotation.y = spin;
    const s2 = 0.48 + scl * 0.4; // keep every model readable inside the dial
    rig.scale.setScalar(s2);
    renderer.render(scene, camera);
  })();
}
