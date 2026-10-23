/* Kliment v7 — a pool of water over the basket. The cursor makes ripples; drops fall on their own.
   Height field simulated on the GPU (ping-pong render targets), then used to refract and light the photo. */
import * as THREE from 'three';

const canvas = document.querySelector('.hero__water');
const hero = document.querySelector('.hero');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
  if (!renderer.capabilities.isWebGL2) throw new Error('webgl2');
} catch (e) { document.documentElement.classList.add('no-webgl'); renderer = null; }
if (renderer) run();

function run() {
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  const quad = new THREE.PlaneGeometry(2, 2);
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const vert = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`;

  /* ---------- simulation ---------- */
  const SW = 384, SH = 256;
  const rtOpts = { type: THREE.HalfFloatType, format: THREE.RGBAFormat, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false, wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping };
  let rtA = new THREE.WebGLRenderTarget(SW, SH, rtOpts), rtB = new THREE.WebGLRenderTarget(SW, SH, rtOpts);
  const simMat = new THREE.ShaderMaterial({
    uniforms: { tPrev: { value: null }, texel: { value: new THREE.Vector2(1 / SW, 1 / SH) }, uDrop: { value: new THREE.Vector3(-1, -1, 0) }, uRadius: { value: 0.02 }, uAspect: { value: SW / SH } },
    vertexShader: vert,
    fragmentShader: `
      uniform sampler2D tPrev; uniform vec2 texel; uniform vec3 uDrop; uniform float uRadius; uniform float uAspect;
      varying vec2 vUv;
      void main(){
        vec4 c = texture2D(tPrev, vUv);
        float n = texture2D(tPrev, vUv + vec2(0., texel.y)).r;
        float s = texture2D(tPrev, vUv - vec2(0., texel.y)).r;
        float e = texture2D(tPrev, vUv + vec2(texel.x, 0.)).r;
        float w = texture2D(tPrev, vUv - vec2(texel.x, 0.)).r;
        float next = (n + s + e + w) * 0.5 - c.g;
        next *= 0.984;
        vec2 d = (vUv - uDrop.xy) * vec2(uAspect, 1.);
        next += uDrop.z * smoothstep(uRadius, 0., length(d));
        gl_FragColor = vec4(next, c.r, 0., 1.);
      }`
  });
  const simScene = new THREE.Scene(); simScene.add(new THREE.Mesh(quad, simMat));

  /* ---------- render ---------- */
  const tex = new THREE.TextureLoader().load('../assets/img/basket.webp', (t) => { renderMat.uniforms.uImgAspect.value = t.image.width / t.image.height; });
  tex.colorSpace = THREE.SRGBColorSpace;
  const renderMat = new THREE.ShaderMaterial({
    uniforms: { tH: { value: null }, tImg: { value: tex }, texel: { value: new THREE.Vector2(1 / SW, 1 / SH) }, uView: { value: 1 }, uImgAspect: { value: 0.75 }, uTime: { value: 0 } },
    vertexShader: vert,
    fragmentShader: `
      uniform sampler2D tH; uniform sampler2D tImg; uniform vec2 texel; uniform float uView; uniform float uImgAspect; uniform float uTime;
      varying vec2 vUv;
      vec2 cover(vec2 uv){
        vec2 s = uView > uImgAspect ? vec2(1., uImgAspect / uView) : vec2(uView / uImgAspect, 1.);
        return (uv - .5) * s + .5;
      }
      void main(){
        float hL = texture2D(tH, vUv - vec2(texel.x, 0.)).r;
        float hR = texture2D(tH, vUv + vec2(texel.x, 0.)).r;
        float hD = texture2D(tH, vUv - vec2(0., texel.y)).r;
        float hU = texture2D(tH, vUv + vec2(0., texel.y)).r;
        vec3 n = normalize(vec3(hL - hR, hD - hU, .35));
        // a slow idle swell so the surface is never dead still
        vec2 swell = vec2(sin(vUv.y * 9. + uTime * .6), cos(vUv.x * 7. + uTime * .5)) * .004;
        vec2 uv = cover(vUv) + n.xy * .055 + swell;
        vec3 col = texture2D(tImg, uv).rgb;
        col = mix(col, col * vec3(.62, .82, 1.), .55);          // underwater tint
        vec3 L = normalize(vec3(-.45, .55, .7));
        float spec = pow(max(dot(n, L), 0.), 70.);
        float caust = smoothstep(.0, .25, abs(hL + hR + hU + hD) * .25);
        col += spec * vec3(.9, .97, 1.) * 1.1 + caust * vec3(.25, .45, .55) * .35;
        col *= .78 + .22 * n.z;
        gl_FragColor = vec4(col, 1.);
      }`
  });
  const scene = new THREE.Scene(); scene.add(new THREE.Mesh(quad, renderMat));

  /* ---------- input ---------- */
  let drop = null;
  const queue = [];
  let lx = -1, ly = -1;
  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = 1 - (e.clientY - r.top) / r.height;
    const v = lx < 0 ? 0 : Math.min(1, Math.hypot(x - lx, y - ly) * 30);
    lx = x; ly = y;
    queue.push([x, y, 0.35 + v * 0.9, 0.018]);
  }, { passive: true });
  hero.addEventListener('pointerdown', (e) => {
    const r = hero.getBoundingClientRect();
    queue.push([(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height, 2.2, 0.035]);
  });
  // rain: a drop now and then, more at the start so the water is alive on arrival
  let rainT = 0;

  function resize() {
    const w = hero.clientWidth, h = hero.clientHeight;
    renderer.setSize(w, h, false);
    renderMat.uniforms.uView.value = w / h;
  }
  resize(); addEventListener('resize', resize);

  let visible = true;
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; }).observe(hero);

  const clock = new THREE.Clock();
  (function frame() {
    requestAnimationFrame(frame);
    if (!visible) { clock.getDelta(); return; }
    const dt = clock.getDelta();
    renderMat.uniforms.uTime.value += dt;
    rainT -= dt;
    if (!reduce && rainT <= 0) {
      queue.push([Math.random(), Math.random() * 0.8 + 0.1, 1.2 + Math.random(), 0.012 + Math.random() * 0.01]);
      rainT = clock.elapsedTime < 3 ? 0.18 : 0.7 + Math.random() * 0.9;
    }
    const steps = reduce ? 0 : 2;
    for (let i = 0; i < steps; i++) {
      drop = queue.shift();
      simMat.uniforms.uDrop.value.set(drop ? drop[0] : -1, drop ? drop[1] : -1, drop ? drop[2] : 0);
      simMat.uniforms.uRadius.value = drop ? drop[3] : 0.02;
      simMat.uniforms.tPrev.value = rtA.texture;
      renderer.setRenderTarget(rtB); renderer.render(simScene, cam);
      const t = rtA; rtA = rtB; rtB = t;
    }
    if (queue.length > 12) queue.splice(0, queue.length - 12);
    renderer.setRenderTarget(null);
    renderMat.uniforms.tH.value = rtA.texture;
    renderer.render(scene, cam);
  })();
}
