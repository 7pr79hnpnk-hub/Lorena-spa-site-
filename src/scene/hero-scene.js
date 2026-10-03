/**
 * LORENSA hero — real-time 3D gold wordmark beneath a golden head-spa halo.
 *
 *  · Per-letter extruded serif glyphs (Cormorant Garamond 600) in brushed PBR gold,
 *    tinted top→bottom like the printed logo (rich gold → champagne).
 *  · A studio environment built from emissive "LED" strips, so the gold reflects
 *    the same vertical light rails that frame the page.
 *  · A halo ring with nozzles and shimmering water threads falling through the letters.
 *  · Pointer: the wordmark leans, reflections slide, and a soft ripple lifts the
 *    letters nearest the cursor. Scroll: the mark tilts back and lingers.
 *
 * The scene fits itself to the DOM slot ([data-hero-mark]) so layout stays in CSS.
 */
import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  BackSide,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  DirectionalLight,
  DoubleSide,
  Euler,
  Group,
  InstancedMesh,
  LineSegments,
  MathUtils,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  NoColorSpace,
  Object3D,
  PerspectiveCamera,
  Plane,
  PlaneGeometry,
  PMREMGenerator,
  PointLight,
  Points,
  RepeatWrapping,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  Timer,
  TorusGeometry,
  Vector3,
  WebGLRenderer,
} from 'three';
import { Font } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import typeface from './wordmark.typeface.json';

const WORD = 'LORENSA';
const WORDMARK_RATIO = 7.4; // keep in sync with .hero__wordmark in sections.css
const GOLD_TOP = new Color('#efb84c');
const GOLD_BOTTOM = new Color('#e4c78f');
const RING_GOLD = new Color('#efcd86');
const WATER = new Color('#fff1d2');

const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const clamp01 = (t) => Math.min(1, Math.max(0, t));
const damp = (current, target, lambda, dt) => MathUtils.lerp(current, target, 1 - Math.exp(-lambda * dt));

/* ── Environment: dark studio lit by warm LED strips ─────────────────── */

function buildEnvironment(renderer) {
  const env = new Scene();
  const disposables = [];
  const add = (mesh) => {
    disposables.push(mesh.geometry, mesh.material);
    env.add(mesh);
    return mesh;
  };

  add(new Mesh(new BoxGeometry(26, 16, 26), new MeshBasicMaterial({ color: new Color(0.012, 0.009, 0.006), side: BackSide })));

  const panel = (w, h, hex, intensity, position) => {
    const mesh = add(
      new Mesh(
        new PlaneGeometry(w, h),
        new MeshBasicMaterial({ color: new Color(hex).multiplyScalar(intensity), side: DoubleSide }),
      ),
    );
    mesh.position.set(...position);
    mesh.lookAt(0, 0, 0);
  };

  // Large front scrim behind the camera, graded top→bottom, so the flat faces
  // of the letters read as polished gold instead of mirroring a black room.
  // (kept well inside the room box so no strip is hidden by its walls)
  panel(22, 2.3, '#fff1d6', 2.7, [0, 4.6, 10.5]);
  panel(22, 2.3, '#ffe6be', 1.95, [0, 2.4, 10.8]);
  panel(22, 2.3, '#ffdcaa', 1.3, [0, 0.2, 11]);
  panel(22, 2.3, '#f5c98a', 0.75, [0, -2, 10.8]);
  panel(22, 2.6, '#c99a5c', 0.36, [0, -4.3, 10.5]);

  panel(14, 3.2, '#fff0d8', 5.5, [0, 7, 3]); // overhead softbox
  panel(0.32, 13, '#ffc56e', 14, [-9.5, 0, 1.5]); // LED rail — left
  panel(0.32, 13, '#ffc56e', 14, [9.5, 0, 1.5]); // LED rail — right
  panel(18, 1.1, '#ffab52', 6, [0, 2.6, -11]); // warm rim behind
  panel(12, 3, '#6b4524', 2.2, [0, -7, 4]); // bounce from below
  panel(1.4, 1.4, '#ffffff', 34, [5.5, 3.2, 9]); // specular kicker
  panel(5, 0.18, '#ffe2a8', 24, [-3, -1.5, 10]); // horizontal glint strip

  const pmrem = new PMREMGenerator(renderer);
  const texture = pmrem.fromScene(env, 0.025).texture;
  pmrem.dispose();
  disposables.forEach((d) => d.dispose());
  return texture;
}

/* ── Brushed-metal roughness map ─────────────────────────────────────── */

function brushedRoughness() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgb(66,66,66)';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 2600; i++) {
    const v = 40 + Math.random() * 60;
    ctx.fillStyle = `rgba(${v},${v},${v},${0.18 + Math.random() * 0.25})`;
    ctx.fillRect(Math.random() * size - 60, Math.random() * size, 30 + Math.random() * 260, 1);
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(1.4, 1.4);
  texture.colorSpace = NoColorSpace;
  return texture;
}

/* ── Wordmark ────────────────────────────────────────────────────────── */

function buildWordmark(material) {
  const font = new Font(typeface);
  const size = 1;
  const depth = 0.2;
  const tracking = 0.11;
  const resolution = typeface.resolution;

  const group = new Group();
  const letters = [];
  let cursor = 0;
  let capTop = -Infinity;
  let capBottom = Infinity;

  const geometries = [...WORD].map((char) => {
    const geometry = new TextGeometry(char, {
      font,
      size,
      depth,
      curveSegments: 10,
      bevelEnabled: true,
      bevelThickness: 0.035,
      bevelSize: 0.016,
      bevelOffset: 0,
      bevelSegments: 4,
    });
    geometry.computeBoundingBox();
    capTop = Math.max(capTop, geometry.boundingBox.max.y);
    capBottom = Math.min(capBottom, geometry.boundingBox.min.y);
    return { char, geometry };
  });

  const capHeight = capTop - capBottom;
  const midY = (capTop + capBottom) / 2;

  for (const { char, geometry } of geometries) {
    const box = geometry.boundingBox;
    const advance = (typeface.glyphs[char].ha / resolution) * size;
    const centerX = (box.min.x + box.max.x) / 2;
    geometry.translate(-centerX, -midY, -depth / 2);

    // Vertical tint like the printed logo: rich gold on top, champagne below.
    const position = geometry.attributes.position;
    const colors = new Float32Array(position.count * 3);
    const tint = new Color();
    for (let i = 0; i < position.count; i++) {
      const t = clamp01((position.getY(i) + capHeight / 2) / capHeight);
      tint.copy(GOLD_BOTTOM).lerp(GOLD_TOP, Math.pow(t, 0.85));
      colors[i * 3] = tint.r;
      colors[i * 3 + 1] = tint.g;
      colors[i * 3 + 2] = tint.b;
    }
    geometry.setAttribute('color', new BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const mesh = new Mesh(geometry, material);
    mesh.position.x = cursor + centerX;
    mesh.userData.restX = mesh.position.x;
    group.add(mesh);
    letters.push(mesh);
    cursor += advance + tracking;
  }

  const first = letters[0];
  const last = letters[letters.length - 1];
  const left = first.position.x + first.geometry.boundingBox.min.x;
  const right = last.position.x + last.geometry.boundingBox.max.x;
  const width = right - left;
  const shift = left + width / 2;
  for (const letter of letters) {
    letter.position.x -= shift;
    letter.userData.restX = letter.position.x;
  }

  return { group, letters, width, capHeight, depth };
}

/* ── Halo ring, nozzles, water threads ───────────────────────────────── */

function buildHalo({ radius, tilt, nozzleCount, ringMaterial }) {
  const group = new Group();
  group.rotation.x = tilt;

  const ring = new Mesh(new TorusGeometry(radius, 0.022, 20, 260), ringMaterial);
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  const inner = new Mesh(new TorusGeometry(radius * 0.965, 0.009, 12, 220), ringMaterial);
  inner.rotation.x = Math.PI / 2;
  inner.position.y = -0.02;
  group.add(inner);

  const nozzles = new InstancedMesh(new SphereGeometry(0.026, 10, 8), ringMaterial, nozzleCount);
  const dummy = new Object3D();
  const localNozzles = [];
  for (let i = 0; i < nozzleCount; i++) {
    const a = (i / nozzleCount) * Math.PI * 2;
    const p = new Vector3(Math.cos(a) * radius * 0.982, -0.03, Math.sin(a) * radius * 0.982);
    localNozzles.push(p);
    dummy.position.copy(p);
    dummy.updateMatrix();
    nozzles.setMatrixAt(i, dummy.matrix);
  }
  group.add(nozzles);

  return { group, localNozzles };
}

function buildThreads(points, bottomY) {
  const count = points.length;
  const positions = new Float32Array(count * 2 * 3);
  const t = new Float32Array(count * 2);
  const seeds = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    const p = points[i];
    const seed = Math.random();
    positions.set([p.x, p.y, p.z, p.x, bottomY - Math.random() * 0.35, p.z], i * 6);
    t.set([0, 1], i * 2);
    seeds.set([seed, seed], i * 2);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('aT', new BufferAttribute(t, 1));
  geometry.setAttribute('aSeed', new BufferAttribute(seeds, 1));

  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uIntro: { value: 0 },
      uOpacity: { value: 1 },
      uColor: { value: WATER.clone() },
    },
    vertexShader: /* glsl */ `
      attribute float aT;
      attribute float aSeed;
      varying float vT;
      varying float vSeed;
      void main() {
        vT = aT;
        vSeed = aSeed;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uIntro;
      uniform float uOpacity;
      uniform vec3 uColor;
      varying float vT;
      varying float vSeed;
      void main() {
        float speed = 0.42 + vSeed * 0.38;
        float f = fract(vT * 2.6 - uTime * speed - vSeed * 7.0);
        float drop = smoothstep(0.7, 0.95, f) * (1.0 - smoothstep(0.95, 1.0, f));
        float fade = smoothstep(0.0, 0.07, vT) * (1.0 - smoothstep(0.62, 1.0, vT));
        float grow = 1.0 - smoothstep(uIntro * 1.15 - 0.15, uIntro * 1.15, vT);
        float alpha = (0.07 + drop * 0.75) * fade * grow * uOpacity;
        gl_FragColor = vec4(uColor * (0.55 + drop * 0.9), alpha);
      }
    `,
  });

  return new LineSegments(geometry, material);
}

/* ── Floating motes ──────────────────────────────────────────────────── */

function buildMotes(count, spread) {
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * spread.x;
    positions[i * 3 + 1] = (Math.random() - 0.5) * spread.y;
    positions[i * 3 + 2] = (Math.random() - 0.5) * spread.z;
    seeds[i] = Math.random();
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('aSeed', new BufferAttribute(seeds, 1));

  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uPixelRatio: { value: 1 },
      uScale: { value: 1 },
      uHeight: { value: spread.y },
    },
    vertexShader: /* glsl */ `
      attribute float aSeed;
      uniform float uTime;
      uniform float uPixelRatio;
      uniform float uScale;
      uniform float uHeight;
      varying float vTwinkle;
      varying float vEdge;
      void main() {
        vec3 p = position;
        float rise = uTime * (0.04 + aSeed * 0.06);
        p.y = mod(p.y + rise + uHeight * 0.5, uHeight) - uHeight * 0.5;
        p.x += sin(uTime * 0.3 + aSeed * 40.0) * 0.12;
        vEdge = 1.0 - smoothstep(uHeight * 0.32, uHeight * 0.5, abs(p.y));
        vTwinkle = 0.45 + 0.55 * sin(uTime * (0.8 + aSeed * 1.6) + aSeed * 60.0);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = (1.4 + aSeed * 3.2) * uPixelRatio * uScale * (14.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uOpacity;
      varying float vTwinkle;
      varying float vEdge;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float soft = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(vec3(1.0, 0.86, 0.6) * soft, soft * vTwinkle * vEdge * uOpacity * 0.55);
      }
    `,
  });

  return new Points(geometry, material);
}

/* ── Scene controller ────────────────────────────────────────────────── */

export async function createHeroScene({ canvas, slot, hero, reducedMotion }) {
  const small = window.matchMedia('(max-width: 899px)').matches;

  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  let pixelRatio = Math.min(window.devicePixelRatio || 1, small ? 1.75 : 2);
  renderer.setPixelRatio(pixelRatio);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.localClippingEnabled = true;

  const scene = new Scene();
  scene.environment = buildEnvironment(renderer);
  scene.environmentRotation = new Euler(0, 0, 0);

  const camera = new PerspectiveCamera(26, 1, 0.1, 100);
  camera.position.set(0, 0, 18);

  // Lights: the environment does most of the work; a warm point light follows the pointer.
  const glint = new PointLight('#ffd9a1', 26, 0, 2);
  glint.position.set(2, 1.5, 4.5);
  scene.add(glint);
  const key = new DirectionalLight('#fff1dc', 0.55);
  key.position.set(-3, 5, 6);
  scene.add(key);

  const revealPlane = new Plane(new Vector3(0, 1, 0), 0);
  const roughnessMap = brushedRoughness();

  const goldMaterial = new MeshStandardMaterial({
    color: '#ffffff',
    vertexColors: true,
    metalness: 1,
    roughness: 0.28,
    roughnessMap,
    envMapIntensity: 1.3,
    clippingPlanes: reducedMotion ? null : [revealPlane],
  });

  const ringMaterial = new MeshStandardMaterial({
    color: RING_GOLD,
    metalness: 1,
    roughness: 0.2,
    envMapIntensity: 1.5,
    transparent: true,
    opacity: reducedMotion ? 1 : 0,
  });

  const anchor = new Group();
  const rig = new Group();
  anchor.add(rig);
  scene.add(anchor);

  const wordmark = buildWordmark(goldMaterial);
  rig.add(wordmark.group);

  const haloRadius = wordmark.width * 0.23;
  const haloY = wordmark.capHeight * 0.96;
  const halo = buildHalo({
    radius: haloRadius,
    tilt: -0.16,
    nozzleCount: small ? 40 : 56,
    ringMaterial,
  });
  halo.group.position.set(wordmark.width * 0.06, haloY, 0);
  rig.add(halo.group);

  // Thread origins, expressed in the rig's space so water always falls straight down.
  halo.group.updateMatrix();
  const threadOrigins = halo.localNozzles.map((p) => p.clone().applyMatrix4(halo.group.matrix));
  const threads = buildThreads(threadOrigins, -wordmark.capHeight * 0.62);
  rig.add(threads);

  const motes = buildMotes(small ? 70 : 130, new Vector3(wordmark.width * 1.25, wordmark.capHeight * 4.2, 3.5));
  motes.material.uniforms.uPixelRatio.value = pixelRatio;
  anchor.add(motes);

  /* Layout: fit the wordmark exactly into the DOM slot */
  let unit = 0.01;
  let scale = 1;
  let viewW = 1;
  let viewH = 1;
  let canvasRect = canvas.getBoundingClientRect();

  const layout = () => {
    canvasRect = canvas.getBoundingClientRect();
    const slotRect = slot.getBoundingClientRect();
    viewW = Math.max(1, canvasRect.width);
    viewH = Math.max(1, canvasRect.height);
    renderer.setSize(viewW, viewH, false);
    camera.aspect = viewW / viewH;
    camera.updateProjectionMatrix();

    const visibleHeight = 2 * Math.tan(MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    unit = visibleHeight / viewH;
    scale = (slotRect.width * unit * 0.97) / wordmark.width;
    anchor.scale.setScalar(scale);
    // The slot reserves headroom for the halo; the letters sit on its bottom band,
    // matching the DOM fallback wordmark (height = slot width / WORDMARK_RATIO).
    const letterBandCenter = slotRect.bottom - slotRect.width / WORDMARK_RATIO / 2;
    anchor.position.set(
      (slotRect.left + slotRect.width / 2 - canvasRect.left - viewW / 2) * unit,
      -(letterBandCenter - canvasRect.top - viewH / 2) * unit,
      0,
    );
    motes.material.uniforms.uScale.value = scale * (viewH / 900);
  };

  layout();
  const resizeObserver = new ResizeObserver(() => {
    layout();
    if (!running) render(0);
  });
  resizeObserver.observe(hero);
  resizeObserver.observe(slot);

  /* Pointer */
  const pointer = { x: 0, y: 0, tx: 0, ty: 0, active: 0, targetActive: 0, localX: 0 };
  const onPointerMove = (event) => {
    if (event.pointerType === 'touch') return;
    pointer.tx = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.ty = (event.clientY / window.innerHeight) * 2 - 1;
    const worldX = (event.clientX - canvasRect.left - viewW / 2) * unit;
    pointer.localX = (worldX - anchor.position.x) / scale;
    const worldY = -(event.clientY - canvasRect.top - viewH / 2) * unit;
    const localY = (worldY - anchor.position.y) / scale;
    pointer.targetActive = Math.abs(localY) < wordmark.capHeight * 2.4 ? 1 : 0.25;
  };
  const onPointerLeave = () => {
    pointer.tx = 0;
    pointer.ty = 0;
    pointer.targetActive = 0;
  };
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  document.documentElement.addEventListener('pointerleave', onPointerLeave);

  /* Scroll progress (0 → hero top at viewport top, 1 → hero scrolled away) */
  let progress = 0;
  let smoothProgress = 0;

  /* Render loop */
  const timer = new Timer();
  let elapsed = 0;
  let introTime = reducedMotion ? 10 : 0;
  let introDone = reducedMotion;
  let running = false;
  let frameId = 0;
  const worldBase = new Vector3();
  const tmpMatrix = new Matrix4();

  const render = (dt) => {
    elapsed += dt;
    introTime += dt;

    smoothProgress = reducedMotion ? progress : damp(smoothProgress, progress, 6, dt);
    pointer.x = damp(pointer.x, pointer.tx, 3.2, dt);
    pointer.y = damp(pointer.y, pointer.ty, 3.2, dt);
    pointer.active = damp(pointer.active, pointer.targetActive, 2.5, dt);

    const p = smoothProgress;
    const idle = reducedMotion ? 0 : 1;

    // Letters rise through the reveal plane, staggered.
    wordmark.letters.forEach((letter, i) => {
      const start = 0.25 + i * 0.085;
      const k = reducedMotion ? 1 : easeOutExpo(clamp01((introTime - start) / 1.5));
      const restY = -wordmark.capHeight * 1.15 * (1 - k);
      const ripple = Math.exp(-Math.pow(letter.userData.restX - pointer.localX, 2) / 1.1) * pointer.active;
      letter.position.y = restY + ripple * 0.09 * idle;
      letter.position.z = ripple * 0.28 * idle;
      letter.rotation.x = (1 - k) * 0.55 - ripple * 0.12 * idle;
      letter.position.x = letter.userData.restX * (1 + p * 0.16);
    });

    // Rig: pointer lean, idle float, scroll tilt.
    rig.rotation.y = pointer.x * 0.26 + Math.sin(elapsed * 0.32) * 0.045 * idle;
    rig.rotation.x = pointer.y * 0.12 + p * 0.75;
    rig.position.y = Math.sin(elapsed * 0.7) * 0.035 * idle - p * wordmark.capHeight * 2.2;
    rig.position.z = -p * 1.5;

    // Halo: slow spin, eases in after the letters.
    const haloK = reducedMotion ? 1 : easeOutCubic(clamp01((introTime - 0.7) / 1.6));
    halo.group.rotation.y = elapsed * 0.12 * idle + p * 1.4;
    halo.group.scale.setScalar(0.72 + haloK * 0.28 + p * 0.2);
    ringMaterial.opacity = haloK * (1 - p * 0.6);

    threads.material.uniforms.uTime.value = elapsed;
    threads.material.uniforms.uIntro.value = reducedMotion ? 1 : clamp01((introTime - 1.1) / 1.8);
    threads.material.uniforms.uOpacity.value = 1 - clamp01(p * 2.2);

    motes.material.uniforms.uTime.value = elapsed;
    motes.material.uniforms.uOpacity.value = (reducedMotion ? 1 : clamp01((introTime - 0.8) / 2)) * (1 - p);

    // Reflections slide with the pointer and breathe slowly on their own.
    scene.environmentRotation.y = pointer.x * 0.55 + Math.sin(elapsed * 0.22) * 0.35 * idle;
    scene.environmentRotation.x = pointer.y * 0.18;

    glint.position.set(pointer.x * 5 + 1.5, -pointer.y * 2.4 + 1.2, 4.2);
    glint.position.applyMatrix4(tmpMatrix.makeScale(scale, scale, 1)).add(anchor.position);

    // Keep the reveal plane on the letters' baseline while they rise.
    if (!introDone) {
      worldBase.set(0, -wordmark.capHeight / 2 - 0.06, 0);
      rig.updateMatrixWorld(true);
      worldBase.applyMatrix4(rig.matrixWorld);
      revealPlane.constant = -worldBase.y;
      if (introTime > 0.25 + WORD.length * 0.085 + 1.6) {
        introDone = true;
        goldMaterial.clippingPlanes = null;
        goldMaterial.needsUpdate = true;
      }
    }

    renderer.render(scene, camera);
  };

  // Quality governor: if frames are slow, step the pixel ratio down; if the device
  // still can't keep up at 1×, settle the scene and only re-render on scroll.
  const frameTimes = [];
  let degraded = false;
  const govern = (dt) => {
    if (degraded || introTime < 1) return;
    frameTimes.push(dt);
    if (frameTimes.length < 40) return;
    const average = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
    frameTimes.length = 0;
    if (average < 1 / 40) return;
    if (pixelRatio > 1.01) {
      pixelRatio = Math.max(1, pixelRatio * 0.75);
      renderer.setPixelRatio(pixelRatio);
      motes.material.uniforms.uPixelRatio.value = pixelRatio;
      layout();
    } else if (average > 1 / 15 && introDone) {
      degraded = true;
      stop();
    }
  };

  const tick = () => {
    frameId = requestAnimationFrame(tick);
    // performance.now() rather than the rAF timestamp: after a long shader compile the
    // frame timestamp can predate reset(), which would yield a negative delta.
    timer.update();
    const dt = Math.max(0, timer.getDelta());
    render(Math.min(dt, 1 / 10));
    govern(dt);
  };

  const start = () => {
    if (running || reducedMotion || degraded) return;
    running = true;
    timer.reset();
    frameId = requestAnimationFrame(tick);
  };

  const stop = () => {
    running = false;
    cancelAnimationFrame(frameId);
  };

  // Run only while the hero is on screen and the tab is visible.
  let visible = true;
  const visibility = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    visible && !document.hidden ? start() : stop();
  });
  visibility.observe(hero);
  const onVisibilityChange = () => (document.hidden || !visible ? stop() : start());
  document.addEventListener('visibilitychange', onVisibilityChange);

  // First frame (compiles shaders), then hand over to the loop.
  renderer.compile(scene, camera);
  render(0);
  start();

  return {
    setProgress(value) {
      progress = clamp01(value);
      if (!running) render(reducedMotion ? 0 : 1 / 30);
    },
    relayout() {
      layout();
      if (!running) render(0);
    },
    dispose() {
      stop();
      resizeObserver.disconnect();
      visibility.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      renderer.dispose();
    },
  };
}
