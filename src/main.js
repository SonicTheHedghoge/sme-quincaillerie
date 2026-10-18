import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// --- Editorial Slides Data for Quincaillerie SME Djerba ---
const SLIDES = [
  {
    num: '01',
    line1: 'Quincaillerie',
    line2: 'SME Djerba.',
    description:
      'L’excellence de l’outillage professionnel, du bricolage et des matériaux de construction à Taourit, Houmt Souk 4180. Équipements de chantier certifiés 5.0★ et livraison express sur toute l’île de Djerba.',
    rotY: 0.22,
    rotX: 0.03,
    camZ: 4.15,
    camY: 0.25,
    flareOffset: new THREE.Vector3(0.18, 0.72, 0.55),
    speech: 'Marhba bik chez SME Djerba ! Scrollez pour visiter !',
  },
  {
    num: '02',
    line1: 'Outillage &',
    line2: 'Matériaux BTP.',
    description:
      'Brouettes renforcées, grillages galvanisés, peintures, plomberie, électricité et outillage de précision. Tout l’équipement nécessaire pour bâtir, rénover et réussir vos chantiers.',
    rotY: -0.45,
    rotX: 0.02,
    camZ: 3.92,
    camY: 0.2,
    flareOffset: new THREE.Vector3(-0.28, 0.54, 0.58),
    speech: 'Brouettes, grillages, peintures & outillage en stock !',
  },
  {
    num: '03',
    line1: 'Livraison',
    line2: 'Houmt Souk.',
    description:
      'Situé à Taourit (VVF9+XP Houmt Souk), ouvert tous les jours jusqu’à 20h00. Commandez au 23 435 363 pour une livraison rapide sur toute l’île de Djerba.',
    rotY: 0.58,
    rotX: -0.02,
    camZ: 4.05,
    camY: 0.28,
    flareOffset: new THREE.Vector3(0.26, 0.62, 0.48),
    speech: 'Livraison directe sur votre chantier jusqu’à 20h00 !',
  },
];

const SCROLL_GREETINGS = [
  '👋 Marhba ! Bienvenue chez Quincaillerie SME Taourit !',
  '🛠️ Prêt pour le chantier ! Regardez la vitrine 9:16 s’agrandir ↓',
  '🚚 Appelez le 23 435 363 — on livre partout à Djerba !',
  '⭐ Noté 5.0/5 à Houmt Souk 4180 • Ouvert jusqu’à 20h00 !',
];

let currentSlide = 0;
let isNoirMode = true;

// --- DOM Elements ---
const siteHeader = document.getElementById('site-header');
const scrollProgressBar = document.getElementById('scroll-progress-bar');
const viewport = document.getElementById('model-viewport');
const canvas = document.getElementById('felix-canvas');
const loaderEl = document.getElementById('model-loader');
const loaderTextEl = document.getElementById('loader-text');
const flareEl = document.getElementById('optical-flare');
const speechBadgeEl = document.getElementById('worker-speech-badge');
const speechTextEl = document.getElementById('worker-speech-text');
const headerWaveBtn = document.getElementById('header-wave-btn');

const stepCurrentEl = document.getElementById('step-current');
const titleLine1El = document.getElementById('title-line-1');
const titleLine2El = document.getElementById('title-line-2');
const descEl = document.getElementById('hero-description');
const pageBtns = document.querySelectorAll('.page-btn');
const footerItems = document.querySelectorAll('.footer-item');
const lightingBtn = document.getElementById('toggle-lighting-btn');
const lightingLabel = document.getElementById('lighting-label');
const dialogEl = document.getElementById('sme-dialog');
const dialogTriggers = document.querySelectorAll('[data-open-dialog]');

// --- Three.js Scene Setup ---
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  34,
  viewport.clientWidth / viewport.clientHeight,
  0.1,
  100
);
camera.position.set(0, SLIDES[0].camY, SLIDES[0].camZ);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(viewport.clientWidth, viewport.clientHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// --- Cinematic Studio Lighting ---
const ambientLight = new THREE.AmbientLight(0x9cb0d4, 0.78);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xf2f6ff, 2.8);
keyLight.position.set(-3.2, 4.2, 3.8);
keyLight.castShadow = true;
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0x4ea8ff, 3.2);
rimLight.position.set(3.5, 2.5, -3.2);
scene.add(rimLight);

const flareLight = new THREE.PointLight(0xff4b3e, 4.0, 6.5, 1.5);
flareLight.position.set(0.25, 0.75, 1.45);
scene.add(flareLight);

const bounceLight = new THREE.DirectionalLight(0xf5b041, 0.95);
bounceLight.position.set(0, -3.5, 2);
scene.add(bounceLight);

// --- 3D Model Group & Holographic Construction Halo ---
const heroGroup = new THREE.Group();
scene.add(heroGroup);

// Subtle golden architectural orbit ring around the worker that reacts on wave/scroll
const ringGeo = new THREE.RingGeometry(0.88, 0.905, 64);
const ringMat = new THREE.MeshBasicMaterial({
  color: 0xf5b041,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.24,
});
const holoRing = new THREE.Mesh(ringGeo, ringMat);
holoRing.rotation.x = Math.PI * 0.48;
holoRing.position.y = -0.35;
heroGroup.add(holoRing);

const modelMaterials = [];
const shaderUniformsList = [];
let modelLoaded = false;

// Wave / Greeting Animation State
let waveEnergy = 0;
let targetWaveEnergy = 0;
let waveToastTimeout = null;

function triggerWorkerWave(customMessage) {
  targetWaveEnergy = 1.0;
  speechBadgeEl.classList.add('is-waving');
  if (customMessage) {
    speechTextEl.textContent = customMessage;
  }
  clearTimeout(waveToastTimeout);
  waveToastTimeout = setTimeout(() => {
    targetWaveEnergy = 0;
    speechBadgeEl.classList.remove('is-waving');
  }, 2200);
}

headerWaveBtn?.addEventListener('click', () => {
  const randomMsg =
    SCROLL_GREETINGS[Math.floor(Math.random() * SCROLL_GREETINGS.length)];
  triggerWorkerWave(randomMsg);
});

// Load the new Construction Worker in Training GLB Model
const gltfLoader = new GLTFLoader();
gltfLoader.load(
  '/models/construction_worker_in_training.glb',
  (gltf) => {
    const model = gltf.scene;

    model.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    // Normalize height so the worker fills the left hero stage commandingly
    const targetHeight = 2.95;
    const scaleFactor = targetHeight / (size.y || 1);
    model.scale.setScalar(scaleFactor);

    model.updateMatrixWorld(true);
    const scaledBox = new THREE.Box3().setFromObject(model);
    const scaledCenter = new THREE.Vector3();
    scaledBox.getCenter(scaledCenter);

    model.position.x = -scaledCenter.x - 0.05;
    model.position.y = -scaledCenter.y - 0.22;
    model.position.z = -scaledCenter.z;

    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          const mat = child.material.clone();
          mat.roughness = 0.52;
          mat.metalness = 0.18;
          mat.userData.baseColor = mat.color.clone();
          mat.color.setRGB(0.86, 0.89, 0.95);

          // Inject GPU Vertex Shader for organic upper-body greeting wave & nod on scroll!
          const customUniforms = {
            uTime: { value: 0 },
            uWave: { value: 0 },
          };
          shaderUniformsList.push(customUniforms);

          mat.onBeforeCompile = (shader) => {
            shader.uniforms.uTime = customUniforms.uTime;
            shader.uniforms.uWave = customUniforms.uWave;

            shader.vertexShader =
              `
              uniform float uTime;
              uniform float uWave;
              ` + shader.vertexShader;

            shader.vertexShader = shader.vertexShader.replace(
              '#include <begin_vertex>',
              `
              #include <begin_vertex>
              // Smooth upper-body & arm greeting wave + head nod without mesh tearing
              float upperMask = smoothstep(-0.15, 0.75, transformed.y);
              float armMask = smoothstep(0.08, 0.28, abs(transformed.x)) * smoothstep(-0.2, 0.45, transformed.y);
              float waveOsc = sin(uTime * 7.5) * uWave;
              float nodOsc = sin(uTime * 5.0) * uWave;

              // Friendly upper-torso side sway & wave
              transformed.x += upperMask * waveOsc * 0.042;
              transformed.y += armMask * abs(waveOsc) * 0.055;
              transformed.z += upperMask * nodOsc * 0.032;
              `
            );
          };

          child.material = mat;
          modelMaterials.push(mat);
        }
      }
    });

    heroGroup.add(model);
    heroGroup.rotation.y = SLIDES[0].rotY;
    heroGroup.rotation.x = SLIDES[0].rotX;

    modelLoaded = true;
    loaderEl.classList.add('hidden');

    // Greet the user shortly after load
    setTimeout(() => {
      triggerWorkerWave('👋 Marhba bik chez Quincaillerie SME Djerba !');
    }, 600);
  },
  (xhr) => {
    if (xhr.total > 0 && loaderTextEl) {
      const pct = Math.min(100, Math.round((xhr.loaded / xhr.total) * 100));
      loaderTextEl.textContent = `CHARGEMENT DU MODÈLE 3D... ${pct}%`;
    }
  },
  (err) => {
    console.error('Erreur de chargement du modèle GLB:', err);
    loaderEl.classList.add('hidden');
  }
);

// --- Interactive Drag & Mouse Parallax State ---
let isDragging = false;
let prevPointerX = 0;
let prevPointerY = 0;
let userRotY = SLIDES[0].rotY;
let userRotX = SLIDES[0].rotX;
let targetRotY = SLIDES[0].rotY;
let targetRotX = SLIDES[0].rotX;
let targetCamZ = SLIDES[0].camZ;
let targetCamY = SLIDES[0].camY;

let mouseNormX = 0;
let mouseNormY = 0;

window.addEventListener('pointermove', (e) => {
  mouseNormX = (e.clientX / window.innerWidth - 0.5) * 2;
  mouseNormY = (e.clientY / window.innerHeight - 0.5) * 2;

  if (isDragging) {
    const dx = e.clientX - prevPointerX;
    const dy = e.clientY - prevPointerY;
    userRotY += dx * 0.0085;
    userRotX = Math.max(-0.35, Math.min(0.35, userRotX + dy * 0.005));
    targetRotY = userRotY;
    targetRotX = userRotX;
    prevPointerX = e.clientX;
    prevPointerY = e.clientY;
  }
});

viewport.addEventListener('pointerdown', (e) => {
  isDragging = true;
  prevPointerX = e.clientX;
  prevPointerY = e.clientY;
  triggerWorkerWave('🛠️ Pivot 360° actif — inspectez l’équipement !');
});

window.addEventListener('pointerup', () => {
  isDragging = false;
});

// --- Slide Switching (01 / 02 / 03) ---
function setSlide(index) {
  if (index < 0 || index >= SLIDES.length) return;
  currentSlide = index;
  const slide = SLIDES[index];

  pageBtns.forEach((btn, i) => {
    const active = i === index;
    btn.classList.toggle('active', active);
    if (active) {
      btn.setAttribute('aria-current', 'true');
    } else {
      btn.removeAttribute('aria-current');
    }
  });

  titleLine1El.style.opacity = '0';
  titleLine2El.style.opacity = '0';
  descEl.style.opacity = '0';

  setTimeout(() => {
    stepCurrentEl.textContent = slide.num;
    titleLine1El.textContent = slide.line1;
    titleLine2El.textContent = slide.line2;
    descEl.textContent = slide.description;
    titleLine1El.style.opacity = '1';
    titleLine2El.style.opacity = '1';
    descEl.style.opacity = '1';
  }, 160);

  userRotY = slide.rotY;
  userRotX = slide.rotX;
  targetRotY = slide.rotY;
  targetRotX = slide.rotX;
  targetCamZ = slide.camZ;
  targetCamY = slide.camY;

  triggerWorkerWave(slide.speech);
}

pageBtns.forEach((btn) => {
  btn.addEventListener('click', () => setSlide(Number(btn.dataset.slide)));
});

footerItems.forEach((item) => {
  item.addEventListener('click', () => setSlide(Number(item.dataset.slideTrigger)));
});

// --- Lighting Mode Toggle (Noir Studio vs Atelier Vif) ---
lightingBtn.addEventListener('click', () => {
  isNoirMode = !isNoirMode;
  lightingBtn.setAttribute('aria-pressed', String(!isNoirMode));

  if (isNoirMode) {
    lightingLabel.textContent = 'LUMIÈRE : NOIR STUDIO';
    ambientLight.intensity = 0.78;
    keyLight.intensity = 2.8;
    rimLight.intensity = 3.2;
    flareLight.intensity = 4.0;
    flareEl.style.opacity = '1';
    modelMaterials.forEach((mat) => {
      mat.color.setRGB(0.86, 0.89, 0.95);
      mat.roughness = 0.52;
      mat.metalness = 0.18;
    });
  } else {
    lightingLabel.textContent = 'LUMIÈRE : ATELIER VIF';
    ambientLight.intensity = 1.65;
    keyLight.intensity = 3.4;
    rimLight.intensity = 2.2;
    flareLight.intensity = 1.8;
    flareEl.style.opacity = '0.55';
    modelMaterials.forEach((mat) => {
      if (mat.userData.baseColor) {
        mat.color.copy(mat.userData.baseColor);
      } else {
        mat.color.setRGB(1, 1, 1);
      }
      mat.roughness = 0.65;
      mat.metalness = 0.08;
    });
  }
});

// --- Native Modal Dialog Controls ---
dialogTriggers.forEach((trigger) => {
  trigger.addEventListener('click', () => {
    if (typeof dialogEl.showModal === 'function') {
      dialogEl.showModal();
    }
  });
});

// =========================================================================
// SCROLL ENGINE:
// 1. Triggers 3D Worker Wave & Scroll Turntable
// 2. Drives the 9:16 -> 100vw x 100vh Fullscreen Expanding Portal (#vitrine)
// =========================================================================
const portalTrack = document.getElementById('vitrine');
const portalCard = document.getElementById('portal-card');
const portalFlankLeft = document.getElementById('portal-flank-left');
const portalFlankRight = document.getElementById('portal-flank-right');
const portalTopPrompt = document.getElementById('portal-top-prompt');
const frameCorners = document.getElementById('frame-corners');
const ratioBadge = document.getElementById('ratio-badge');
const portalHotspots = document.getElementById('portal-hotspots');
const portalExpandedHud = document.getElementById('portal-expanded-hud');

let lastScrollY = window.scrollY;
let scrollVelocity = 0;
let targetPortalProgress = 0;
let smoothPortalProgress = 0;

window.addEventListener(
  'scroll',
  () => {
    const sy = window.scrollY;
    const dy = sy - lastScrollY;
    lastScrollY = sy;

    // Update top scroll progress bar & sticky header state
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const totalPct = Math.min(100, Math.max(0, (sy / maxScroll) * 100));
    if (scrollProgressBar) {
      scrollProgressBar.style.width = `${totalPct}%`;
    }
    siteHeader?.classList.toggle('is-scrolled', sy > 40);

    // Boost 3D worker wave energy when scrolling in or near the hero
    scrollVelocity = Math.min(1.0, Math.abs(dy) / 28);
    if (sy < window.innerHeight * 1.1 && Math.abs(dy) > 4) {
      targetWaveEnergy = Math.min(1.0, targetWaveEnergy + scrollVelocity * 0.45);
      speechBadgeEl.classList.add('is-waving');

      const msgIdx = Math.min(
        SCROLL_GREETINGS.length - 1,
        Math.floor((sy / (window.innerHeight * 0.85)) * SCROLL_GREETINGS.length)
      );
      speechTextEl.textContent = SCROLL_GREETINGS[msgIdx];

      clearTimeout(waveToastTimeout);
      waveToastTimeout = setTimeout(() => {
        targetWaveEnergy = 0;
        speechBadgeEl.classList.remove('is-waving');
      }, 900);
    }

    // Compute target expansion progress [0..1] for the 9:16 Portal Section
    if (portalTrack) {
      const rect = portalTrack.getBoundingClientRect();
      const totalTrackScroll = Math.max(1, rect.height - window.innerHeight);
      const scrolledInTrack = -rect.top;
      // Reach full screen at ~72% of the sticky track so user enjoys the fullscreen state before scrolling on
      const rawProgress = scrolledInTrack / (totalTrackScroll * 0.72);
      targetPortalProgress = Math.max(0, Math.min(1, rawProgress));
    }
  },
  { passive: true }
);

// Portal View Switcher Buttons (01. Façade, 02. Outillage, 03. BTP)
const portalSlides = document.querySelectorAll('.portal-slide');
const portalViewBtns = document.querySelectorAll('[data-portal-btn]');

portalViewBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    const idx = Number(btn.dataset.portalBtn);
    portalViewBtns.forEach((b, i) => b.classList.toggle('active', i === idx));
    portalSlides.forEach((s, i) => s.classList.toggle('active', i === idx));
  });
});

// =========================================================================
// CATALOG FILTER & SEARCH (#produits)
// =========================================================================
const catPills = document.querySelectorAll('.cat-pill');
const searchInput = document.getElementById('product-search-input');
const productCards = document.querySelectorAll('.product-card');
let activeCategory = 'all';
let searchQuery = '';

function filterProducts() {
  productCards.forEach((card) => {
    const cat = card.dataset.category;
    const kw = (card.dataset.keywords + ' ' + card.textContent).toLowerCase();
    const matchesCat = activeCategory === 'all' || cat === activeCategory;
    const matchesSearch = !searchQuery || kw.includes(searchQuery);
    card.classList.toggle('is-hidden', !(matchesCat && matchesSearch));
  });
}

catPills.forEach((pill) => {
  pill.addEventListener('click', () => {
    activeCategory = pill.dataset.filter;
    catPills.forEach((p) => p.classList.toggle('active', p === pill));
    filterProducts();
  });
});

searchInput?.addEventListener('input', (e) => {
  searchQuery = e.target.value.trim().toLowerCase();
  filterProducts();
});

// =========================================================================
// SCROLL-ENTRY FALLBACK (Modern Web Guidance: scroll-entry-exit-effects)
// =========================================================================
if (!CSS.supports('(animation-timeline: view()) and (animation-range: entry)')) {
  const revealEls = document.querySelectorAll('.scroll-reveal');
  revealEls.forEach((el) => el.classList.add('js-reveal-init'));

  const revealObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-inview');
        }
      }
    },
    { threshold: 0.14 }
  );

  revealEls.forEach((el) => revealObserver.observe(el));
}

// =========================================================================
// MAIN 60FPS ANIMATION LOOP (3D Scene + Smooth 9:16 Portal Interpolation)
// =========================================================================
const clock = new THREE.Clock();
const flareWorldPos = new THREE.Vector3();
const helmetWorldPos = new THREE.Vector3();

function animate() {
  requestAnimationFrame(animate);

  const elapsed = clock.getElapsedTime();

  // 1. Update 3D Model & Wave Shader
  waveEnergy += (targetWaveEnergy - waveEnergy) * 0.08;
  for (const uniforms of shaderUniformsList) {
    uniforms.uTime.value = elapsed;
    uniforms.uWave.value = waveEnergy;
  }

  if (modelLoaded) {
    const scrollHeroRatio = Math.min(1, window.scrollY / Math.max(1, window.innerHeight));
    const parallaxY = mouseNormX * 0.16;
    const parallaxX = mouseNormY * 0.07;

    // Combine slide angle + mouse parallax + scroll turntable + wave salute tilt
    const waveSaluteY = Math.sin(elapsed * 6.5) * 0.11 * waveEnergy;
    const waveSaluteZ = Math.sin(elapsed * 6.5) * 0.045 * waveEnergy;

    const desiredY =
      targetRotY +
      parallaxY +
      scrollHeroRatio * 0.55 +
      waveSaluteY +
      Math.sin(elapsed * 0.7) * 0.04;
    const desiredX = targetRotX + parallaxX + Math.sin(elapsed * 4.5) * 0.04 * waveEnergy;

    heroGroup.rotation.y += (desiredY - heroGroup.rotation.y) * 0.07;
    heroGroup.rotation.x += (desiredX - heroGroup.rotation.x) * 0.07;
    heroGroup.rotation.z += (waveSaluteZ - heroGroup.rotation.z) * 0.08;
    heroGroup.position.y =
      Math.sin(elapsed * 1.3) * 0.032 + Math.abs(Math.sin(elapsed * 6.5)) * 0.045 * waveEnergy;

    // Spin & pulse the holographic construction ring faster when waving/scrolling
    holoRing.rotation.z = elapsed * (0.4 + waveEnergy * 2.5);
    ringMat.opacity = 0.2 + waveEnergy * 0.45;
    const ringScale = 1 + Math.sin(elapsed * 5) * 0.04 * waveEnergy;
    holoRing.scale.setScalar(ringScale);

    camera.position.z += (targetCamZ - camera.position.z) * 0.05;
    camera.position.y += (targetCamY - camera.position.y) * 0.05;

    // Project 3D flare anchor to 2D viewport coordinates
    const activeFlareOffset = SLIDES[currentSlide].flareOffset;
    flareWorldPos.copy(activeFlareOffset);
    flareWorldPos.applyEuler(heroGroup.rotation);
    flareWorldPos.y += heroGroup.position.y;

    flareLight.position.set(flareWorldPos.x, flareWorldPos.y, flareWorldPos.z + 0.65);

    const projected = flareWorldPos.clone().project(camera);
    const screenX = (projected.x * 0.5 + 0.5) * viewport.clientWidth;
    const screenY = (-projected.y * 0.5 + 0.5) * viewport.clientHeight;
    flareEl.style.left = `${screenX}px`;
    flareEl.style.top = `${screenY}px`;

    // Project 3D helmet position for the Speech / Greeting HUD Badge
    helmetWorldPos.set(0.05, 1.18, 0.2);
    helmetWorldPos.applyEuler(heroGroup.rotation);
    helmetWorldPos.y += heroGroup.position.y;
    const projHelmet = helmetWorldPos.project(camera);
    const badgeX = Math.max(140, Math.min(viewport.clientWidth - 140, (projHelmet.x * 0.5 + 0.5) * viewport.clientWidth));
    const badgeY = Math.max(95, Math.min(viewport.clientHeight - 120, (-projHelmet.y * 0.5 + 0.5) * viewport.clientHeight));
    speechBadgeEl.style.left = `${badgeX}px`;
    speechBadgeEl.style.top = `${badgeY}px`;
  }

  renderer.render(scene, camera);

  // 2. Smoothly Interpolate the 9:16 -> 100vw x 100vh Portal Expansion
  smoothPortalProgress += (targetPortalProgress - smoothPortalProgress) * 0.1;
  if (portalCard) {
    const p = smoothPortalProgress;
    // Start at 9:16 portrait (min 310px x 550px) and smoothly expand to 100vw x 100vh
    const startW = Math.min(330, window.innerWidth * 0.78);
    const startH = Math.min(586, window.innerHeight * 0.72);
    const curW = startW + (window.innerWidth - startW) * p;
    const curH = startH + (window.innerHeight - startH) * p;
    const curRadius = 24 * (1 - p);
    const imgScale = 1.24 - 0.24 * p;

    portalCard.style.setProperty('--portal-w', `${curW.toFixed(1)}px`);
    portalCard.style.setProperty('--portal-h', `${curH.toFixed(1)}px`);
    portalCard.style.setProperty('--portal-radius', `${curRadius.toFixed(1)}px`);
    portalCard.style.setProperty('--portal-img-scale', imgScale.toFixed(3));

    if (portalFlankLeft && portalFlankRight) {
      const shiftX = p * 280;
      const flankOpacity = Math.max(0, 1 - p * 1.65);
      portalFlankLeft.style.transform = `translate3d(${-shiftX}px, -50%, 0)`;
      portalFlankRight.style.transform = `translate3d(${shiftX}px, -50%, 0)`;
      portalFlankLeft.style.opacity = String(flankOpacity);
      portalFlankRight.style.opacity = String(flankOpacity);
    }

    if (portalTopPrompt) {
      portalTopPrompt.style.opacity = String(Math.max(0, 1 - p * 2.2));
    }

    if (frameCorners) {
      frameCorners.style.opacity = String(Math.max(0, 1 - p * 1.8));
    }

    if (ratioBadge) {
      ratioBadge.textContent = p > 0.6 ? 'PLEIN ÉCRAN 16:9' : `FORMAT 9:16 • ${Math.round(p * 100)}%`;
    }

    const isExpanded = p > 0.82;
    portalHotspots?.classList.toggle('is-active', isExpanded);
    portalExpandedHud?.classList.toggle('is-visible', isExpanded);
  }
}

animate();

// --- Resize Handler ---
window.addEventListener('resize', () => {
  const width = viewport.clientWidth;
  const height = viewport.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
});

// --- Ambient Stardust / Workshop Spark Particles Canvas ---
const pCanvas = document.getElementById('particles-canvas');
const pCtx = pCanvas.getContext('2d');
let particles = [];

function initParticles() {
  pCanvas.width = window.innerWidth;
  pCanvas.height = window.innerHeight;
  const count = Math.min(110, Math.floor((window.innerWidth * window.innerHeight) / 14000));
  particles = Array.from({ length: count }, () => ({
    x: Math.random() * pCanvas.width,
    y: Math.random() * pCanvas.height,
    r: Math.random() * 1.35 + 0.3,
    alpha: Math.random() * 0.55 + 0.1,
    vx: (Math.random() - 0.5) * 0.14,
    vy: -Math.random() * 0.18 - 0.03,
    warm: Math.random() > 0.84,
  }));
}

function drawParticles() {
  pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    if (p.y < 0) p.y = pCanvas.height;
    if (p.x < 0) p.x = pCanvas.width;
    if (p.x > pCanvas.width) p.x = 0;

    pCtx.beginPath();
    pCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    pCtx.fillStyle = p.warm
      ? `rgba(245, 176, 65, ${p.alpha})`
      : `rgba(225, 235, 255, ${p.alpha})`;
    pCtx.fill();
  }
  requestAnimationFrame(drawParticles);
}

initParticles();
drawParticles();
window.addEventListener('resize', initParticles);
