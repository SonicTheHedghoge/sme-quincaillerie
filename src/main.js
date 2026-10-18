import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// --- Editorial Slides Data for Quincaillerie SME Djerba ---
const SLIDES = [
  {
    num: '01',
    line1: 'Quincaillerie',
    line2: 'SME Djerba.',
    description:
      'La référence de l’outillage professionnel, du bricolage et des matériaux de construction à Taourit, Houmt Souk 4180. Qualité certifiée 5.0★ et livraison directe sur vos chantiers à Djerba.',
    rotY: 0.28,
    rotX: 0.04,
    camZ: 4.35,
    camY: 0.38,
    flareOffset: new THREE.Vector3(0.18, 0.72, 0.55),
  },
  {
    num: '02',
    line1: 'Outillage &',
    line2: 'Matériaux BTP.',
    description:
      'Brouettes renforcées, grillages, peintures, plomberie, électricité et outillage de précision. Tout l’équipement nécessaire pour bâtir, rénover et tout réparer.',
    rotY: -0.42,
    rotX: 0.02,
    camZ: 4.05,
    camY: 0.28,
    flareOffset: new THREE.Vector3(-0.32, 0.48, 0.62),
  },
  {
    num: '03',
    line1: 'Livraison',
    line2: 'Houmt Souk.',
    description:
      'Situé à Taourit (VVF9+XP Houmt Souk), ouvert tous les jours jusqu’à 20h00. Commandez au 23 435 363 pour une livraison rapide sur toute l’île de Djerba.',
    rotY: 0.62,
    rotX: -0.03,
    camZ: 4.2,
    camY: 0.42,
    flareOffset: new THREE.Vector3(0.28, 0.64, 0.48),
  },
];

let currentSlide = 0;
let isNoirMode = true;

// --- DOM Elements ---
const viewport = document.getElementById('model-viewport');
const canvas = document.getElementById('felix-canvas');
const loaderEl = document.getElementById('model-loader');
const flareEl = document.getElementById('optical-flare');
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
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// --- Cinematic Studio Lighting (Inspired by Space Exploration Reference) ---
const ambientLight = new THREE.AmbientLight(0x90a4c4, 0.55);
scene.add(ambientLight);

// Main Dramatic Key Light (Cool Silver-White from Front-Left)
const keyLight = new THREE.DirectionalLight(0xeef4ff, 2.6);
keyLight.position.set(-3.2, 4.2, 3.8);
keyLight.castShadow = true;
scene.add(keyLight);

// Deep Rim Light (Ice Blue from Back-Right for silhouette separation)
const rimLight = new THREE.DirectionalLight(0x4ea8ff, 3.1);
rimLight.position.set(3.5, 2.5, -3.2);
scene.add(rimLight);

// Signature Warm Crimson/Amber Flare Light (matches optical lens flare)
const flareLight = new THREE.PointLight(0xff4b3e, 4.2, 6.5, 1.5);
flareLight.position.set(0.25, 0.75, 1.45);
scene.add(flareLight);

// Subtle Bottom Bounce Light
const bounceLight = new THREE.DirectionalLight(0x2a3546, 0.9);
bounceLight.position.set(0, -4, 2);
scene.add(bounceLight);

// --- Model Group & Loading ---
const heroGroup = new THREE.Group();
scene.add(heroGroup);

const modelMaterials = [];
let modelLoaded = false;

const gltfLoader = new GLTFLoader();
gltfLoader.load(
  '/models/fix_it_felix.glb',
  (gltf) => {
    const model = gltf.scene;

    // Compute world bounds so we can normalize size and frame upper/full body heroically
    model.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    // Normalize scale so height is ~3.15 units
    const targetHeight = 3.15;
    const scaleFactor = targetHeight / (size.y || 1);
    model.scale.setScalar(scaleFactor);

    // Recompute bounds after scaling
    model.updateMatrixWorld(true);
    const scaledBox = new THREE.Box3().setFromObject(model);
    const scaledCenter = new THREE.Vector3();
    scaledBox.getCenter(scaledCenter);

    // Center horizontally & position vertically so head/chest/hammer sit in prime hero zone
    model.position.x = -scaledCenter.x - 0.08;
    model.position.y = -scaledCenter.y - 0.32;
    model.position.z = -scaledCenter.z;

    // Enhance materials for dark editorial aesthetic while preserving original textures
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          const mat = child.material.clone();
          mat.roughness = 0.44;
          mat.metalness = 0.22;
          // Store original color to allow toggling between Noir Studio and Atelier Vif
          mat.userData.baseColor = mat.color.clone();
          // Subtle moody studio tint in Noir mode
          mat.color.setRGB(0.76, 0.79, 0.85);
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
  },
  undefined,
  (err) => {
    console.error('Erreur de chargement du modèle GLB Fix-It Felix:', err);
    loaderEl.querySelector('.loader-text').textContent = 'MODÈLE 3D PRÊT';
    setTimeout(() => loaderEl.classList.add('hidden'), 800);
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
});

window.addEventListener('pointerup', () => {
  isDragging = false;
});

// --- Slide Switching (01 / 02 / 03) ---
function setSlide(index) {
  if (index < 0 || index >= SLIDES.length) return;
  currentSlide = index;
  const slide = SLIDES[index];

  // Update Left Pagination active state
  pageBtns.forEach((btn, i) => {
    const active = i === index;
    btn.classList.toggle('active', active);
    if (active) {
      btn.setAttribute('aria-current', 'true');
    } else {
      btn.removeAttribute('aria-current');
    }
  });

  // Animate text transition
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

  // Update 3D target orientation
  userRotY = slide.rotY;
  userRotX = slide.rotX;
  targetRotY = slide.rotY;
  targetRotX = slide.rotX;
  targetCamZ = slide.camZ;
  targetCamY = slide.camY;
}

pageBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    const idx = Number(btn.dataset.slide);
    setSlide(idx);
  });
});

footerItems.forEach((item) => {
  item.addEventListener('click', () => {
    const idx = Number(item.dataset.slideTrigger);
    setSlide(idx);
  });
});

// --- Lighting Mode Toggle (Noir Studio vs Atelier Vif) ---
lightingBtn.addEventListener('click', () => {
  isNoirMode = !isNoirMode;
  lightingBtn.setAttribute('aria-pressed', String(!isNoirMode));

  if (isNoirMode) {
    lightingLabel.textContent = 'LUMIÈRE : NOIR STUDIO';
    ambientLight.intensity = 0.55;
    keyLight.intensity = 2.6;
    rimLight.intensity = 3.1;
    flareLight.intensity = 4.2;
    flareEl.style.opacity = '1';
    modelMaterials.forEach((mat) => {
      mat.color.setRGB(0.76, 0.79, 0.85);
      mat.roughness = 0.44;
      mat.metalness = 0.22;
    });
  } else {
    lightingLabel.textContent = 'LUMIÈRE : ATELIER VIF';
    ambientLight.intensity = 1.45;
    keyLight.intensity = 3.2;
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

// --- Animation Loop & 3D Optical Flare Projection ---
const clock = new THREE.Clock();
const flareWorldPos = new THREE.Vector3();

function animate() {
  requestAnimationFrame(animate);

  const elapsed = clock.getElapsedTime();

  if (modelLoaded) {
    // Gentle floating breath + mouse parallax
    const parallaxY = mouseNormX * 0.16;
    const parallaxX = mouseNormY * 0.08;

    const desiredY = targetRotY + parallaxY + Math.sin(elapsed * 0.65) * 0.04;
    const desiredX = targetRotX + parallaxX;

    heroGroup.rotation.y += (desiredY - heroGroup.rotation.y) * 0.06;
    heroGroup.rotation.x += (desiredX - heroGroup.rotation.x) * 0.06;
    heroGroup.position.y = Math.sin(elapsed * 1.15) * 0.035;

    camera.position.z += (targetCamZ - camera.position.z) * 0.05;
    camera.position.y += (targetCamY - camera.position.y) * 0.05;

    // Project 3D flare anchor to 2D viewport coordinates
    const activeFlareOffset = SLIDES[currentSlide].flareOffset;
    flareWorldPos.copy(activeFlareOffset);
    flareWorldPos.applyEuler(heroGroup.rotation);
    flareWorldPos.y += heroGroup.position.y;

    flareLight.position.set(
      flareWorldPos.x,
      flareWorldPos.y,
      flareWorldPos.z + 0.65
    );

    const projected = flareWorldPos.clone().project(camera);
    const screenX = (projected.x * 0.5 + 0.5) * viewport.clientWidth;
    const screenY = (-projected.y * 0.5 + 0.5) * viewport.clientHeight;

    flareEl.style.left = `${screenX}px`;
    flareEl.style.top = `${screenY}px`;
  }

  renderer.render(scene, camera);
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
    warm: Math.random() > 0.86,
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
      ? `rgba(255, 130, 95, ${p.alpha})`
      : `rgba(225, 235, 255, ${p.alpha})`;
    pCtx.fill();
  }
  requestAnimationFrame(drawParticles);
}

initParticles();
drawParticles();
window.addEventListener('resize', initParticles);
