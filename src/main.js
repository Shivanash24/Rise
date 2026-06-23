import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Initialize core luxury interactive features
function initTheme() {
  console.log('RISE Premium Theme Initialized');
  
  initHero3D();
  initLeft3DBackground();
  initSignatureCollections();
  initProduct3DCards();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTheme);
} else {
  // DOM already loaded (common for deferred/module scripts)
  initTheme();
}

function initHero3D() {
  const container = document.getElementById('hero-tilt-container');
  const inner = document.getElementById('hero-tilt-inner');
  
  if (!container || !inner) return;

  // Track mouse movement over the container
  container.addEventListener('mousemove', (e) => {
    const rect = container.getBoundingClientRect();
    // Calculate mouse position relative to the center of the container (-1 to 1)
    const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);

    // Apply rotation based on mouse position (max 15 degrees)
    gsap.to(inner, {
      rotationY: x * 15,
      rotationX: -y * 15,
      duration: 0.5,
      ease: 'power2.out',
      transformPerspective: 1000
    });
  });

  // Reset rotation when mouse leaves
  container.addEventListener('mouseleave', () => {
    gsap.to(inner, {
      rotationY: 0,
      rotationX: 0,
      duration: 1,
      ease: 'power3.out'
    });
  });
}

function initLeft3DBackground() {
  const container = document.getElementById('hero-left-3d');
  if (!container) return;

  const scene = new THREE.Scene();
  
  // Full screen perspective camera
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 2, 12);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  // Generate particles in a beautiful wave grid
  const numX = 75;
  const numZ = 75;
  const count = numX * numZ;
  
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  
  const colorGold = new THREE.Color('#D4AF37');
  const colorChampagne = new THREE.Color('#F7E7CE');
  
  let i = 0;
  for (let x = 0; x < numX; x++) {
    for (let z = 0; z < numZ; z++) {
      // Spread grid wide enough to cover full screen
      positions[i] = (x - numX / 2) * 0.4; // X
      positions[i + 1] = 0;                // Y
      positions[i + 2] = (z - numZ / 2) * 0.4; // Z
      
      // Interpolate colors between gold and champagne
      const t = Math.random();
      const mixedColor = colorGold.clone().lerp(colorChampagne, t);
      colors[i] = mixedColor.r;
      colors[i + 1] = mixedColor.g;
      colors[i + 2] = mixedColor.b;
      
      i += 3;
    }
  }
  
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  
  // Custom circular canvas texture for smooth round particles
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 16, 16);
  
  const texture = new THREE.CanvasTexture(canvas);
  
  const material = new THREE.PointsMaterial({
    size: 0.12,
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
    map: texture,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  
  const particleSystem = new THREE.Points(geometry, material);
  scene.add(particleSystem);
  
  // Also add some random floating dust particles
  const dustCount = 200;
  const dustPositions = new Float32Array(dustCount * 3);
  for (let d = 0; d < dustCount * 3; d += 3) {
    dustPositions[d] = (Math.random() - 0.5) * 30;
    dustPositions[d + 1] = (Math.random() - 0.5) * 15;
    dustPositions[d + 2] = (Math.random() - 0.5) * 20;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
  const dustMat = new THREE.PointsMaterial({
    size: 0.08,
    color: '#D4AF37',
    transparent: true,
    opacity: 0.5,
    map: texture,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const dustSystem = new THREE.Points(dustGeo, dustMat);
  scene.add(dustSystem);

  let mouseX = 0;
  let mouseY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  const clock = new THREE.Clock();

  const animate = () => {
    requestAnimationFrame(animate);

    const elapsedTime = clock.getElapsedTime();
    
    // Animate the grid wave
    const positionAttr = geometry.attributes.position;
    const array = positionAttr.array;
    
    let index = 0;
    for (let x = 0; x < numX; x++) {
      for (let z = 0; z < numZ; z++) {
        const u = x / numX;
        const v = z / numZ;
        
        // Dynamic undulating wave pattern
        const y = Math.sin(u * 6 + elapsedTime) * 0.4 + 
                  Math.cos(v * 6 + elapsedTime) * 0.4 + 
                  Math.sin((u + v) * 12 + elapsedTime * 1.5) * 0.15;
                  
        array[index + 1] = y;
        index += 3;
      }
    }
    positionAttr.needsUpdate = true;

    // Slowly rotate particle system
    particleSystem.rotation.y = elapsedTime * 0.03;
    particleSystem.rotation.x = Math.sin(elapsedTime * 0.1) * 0.1;
    
    // Update dust positions (make them float and slowly fall)
    const dustPosAttr = dustGeo.attributes.position;
    const dustArray = dustPosAttr.array;
    for (let d = 0; d < dustCount * 3; d += 3) {
      dustArray[d + 1] -= 0.003; // slowly drift down
      dustArray[d] += Math.sin(elapsedTime + d) * 0.001; // slight sway
      if (dustArray[d + 1] < -8) {
        dustArray[d + 1] = 8; // reset to top
      }
    }
    dustPosAttr.needsUpdate = true;

    // Smooth camera mouse follow
    gsap.to(camera.position, {
      x: mouseX * 2,
      y: 2 + mouseY * 1.5,
      duration: 1.5,
      ease: 'power2.out'
    });
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  };

  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

function initSignatureCollections() {
  const cards = document.querySelectorAll('.collection-card-luxury');
  if (cards.length === 0) return;

  // 1. GSAP ScrollTrigger reveals
  gsap.from('.collections-header-wrapper', {
    opacity: 0,
    y: 50,
    duration: 1.2,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.collections-header-wrapper',
      start: 'top 85%',
    }
  });

  gsap.from('.divider-gold-line', {
    scaleX: 0,
    duration: 1.5,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.collections-header-wrapper',
      start: 'top 85%',
    }
  });

  gsap.from('.collection-card-luxury', {
    opacity: 0,
    y: 70,
    scale: 0.95,
    duration: 1.2,
    stagger: 0.15,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.collections-grid-wrapper',
      start: 'top 80%',
    }
  });

  gsap.from('.trust-item-luxe', {
    opacity: 0,
    y: 40,
    duration: 1.2,
    stagger: 0.15,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.collections-trust-bar',
      start: 'top 90%',
    }
  });

  // 2. Three.js scenes for each card
  cards.forEach(card => {
    const container = card.querySelector('.card-canvas-container');
    if (!container) return;

    // Prevent double initialization if already loaded (e.g. from Theme Editor reload)
    if (container.querySelector('canvas')) return;

    const imageUrl = container.getAttribute('data-image-url');
    const scent = container.getAttribute('data-scent') || 'gold';
    
    // Scene setup
    const scene = new THREE.Scene();
    
    const width = container.clientWidth || 350;
    const height = container.clientHeight || 350;
    
    // Perspective Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 7;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const fallbackImg = container.querySelector('.card-campaign-fallback-img');

    // Texture Loader
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = 'anonymous'; // Support CORS for shopify CDN hosting
    loader.load(
      imageUrl, 
      (texture) => {
        // Texture loaded successfully! Show the WebGL canvas, hide fallback image
        if (fallbackImg) {
          gsap.to(fallbackImg, {
            opacity: 0,
            duration: 0.5,
            onComplete: () => {
              fallbackImg.style.display = 'none';
            }
          });
        }

        texture.minFilter = THREE.LinearFilter;
        
        // Create plane matching aspect ratio
        const geometry = new THREE.PlaneGeometry(5.2, 5.2);
        const material = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          opacity: 0.95
        });
        const plane = new THREE.Mesh(geometry, material);
        scene.add(plane);

      // Mouse interactive tilt inside card
      let mx = 0;
      let my = 0;

      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        // mx, my from -1 to 1
        mx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        my = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

        // Highlight Glow coordinates
        const px = ((e.clientX - rect.left) / rect.width) * 100;
        const py = ((e.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty('--mouse-x', `${px}%`);
        card.style.setProperty('--mouse-y', `${py}%`);

        // Tilting card container with GSAP
        gsap.to(card, {
          rotationY: mx * 8,
          rotationX: my * 8,
          transformPerspective: 1000,
          duration: 0.4,
          ease: 'power2.out'
        });

        // Parallax plane inside canvas
        gsap.to(plane.position, {
          x: mx * 0.15,
          y: my * 0.15,
          duration: 0.4,
          ease: 'power2.out'
        });

        // Slight scale up the image plane
        gsap.to(plane.scale, {
          x: 1.03,
          y: 1.03,
          duration: 0.4
        });
      });

      card.addEventListener('mouseleave', () => {
        gsap.to(card, {
          rotationY: 0,
          rotationX: 0,
          duration: 0.8,
          ease: 'power3.out'
        });

        gsap.to(plane.position, {
          x: 0,
          y: 0,
          duration: 0.8,
          ease: 'power3.out'
        });

        gsap.to(plane.scale, {
          x: 1,
          y: 1,
          duration: 0.8
        });
      });
    });

    // Floating Scent Particles
    const pCount = 35;
    const pPositions = new Float32Array(pCount * 3);
    const pVelocities = [];
    
    // Choose colors based on scent profile
    let pColor = '#D4AF37'; // gold
    if (scent === 'rose') pColor = '#FF69B4'; // pink
    if (scent === 'amber') pColor = '#FF8C00'; // dark orange/amber
    if (scent === 'noir') pColor = '#E6E6FA'; // lavender/grey-white

    for (let c = 0; c < pCount * 3; c += 3) {
      pPositions[c] = (Math.random() - 0.5) * 5;      // X
      pPositions[c + 1] = (Math.random() - 0.5) * 5;  // Y
      pPositions[c + 2] = Math.random() * 1.5 + 0.2;  // Z (float in front of plane)

      pVelocities.push({
        y: Math.random() * 0.006 + 0.002,
        x: (Math.random() - 0.5) * 0.004,
        z: (Math.random() - 0.5) * 0.002
      });
    }

    const pGeometry = new THREE.BufferGeometry();
    pGeometry.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));

    // Custom circle particle texture
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 16;
    pCanvas.height = 16;
    const pCtx = pCanvas.getContext('2d');
    const pGrad = pCtx.createRadialGradient(8, 8, 0, 8, 8, 8);
    pGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    pGrad.addColorStop(0.5, pColor);
    pGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    pCtx.fillStyle = pGrad;
    pCtx.fillRect(0, 0, 16, 16);
    const pTexture = new THREE.CanvasTexture(pCanvas);

    const pMaterial = new THREE.PointsMaterial({
      size: 0.16,
      map: pTexture,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const particles = new THREE.Points(pGeometry, pMaterial);
    scene.add(particles);

    const clock = new THREE.Clock();

    const animate = () => {
      requestAnimationFrame(animate);

      const time = clock.getElapsedTime();
      
      // Animate Scent Particles
      const pAttr = pGeometry.attributes.position;
      const array = pAttr.array;
      
      let pIdx = 0;
      for (let c = 0; c < pCount; c++) {
        // Apply velocity
        array[pIdx + 1] += pVelocities[c].y; // Move up Y
        array[pIdx] += Math.sin(time + c) * 0.002; // Sway X
        
        // Wrap-around
        if (array[pIdx + 1] > 2.6) {
          array[pIdx + 1] = -2.6;
          array[pIdx] = (Math.random() - 0.5) * 5;
        }
        pIdx += 3;
      }
      pAttr.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    window.addEventListener('resize', () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
  });
}

function initProduct3DCards() {
  const cards = document.querySelectorAll('.product-card-wrapper');
  if (cards.length === 0) return;

  cards.forEach(cardWrapper => {
    // Prevent double binding if observer runs again
    if (cardWrapper.classList.contains('has-3d-tilt')) return;
    cardWrapper.classList.add('has-3d-tilt');

    const card = cardWrapper.querySelector('.card');
    if (!card) return;

    cardWrapper.addEventListener('mousemove', (e) => {
      const rect = cardWrapper.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const my = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      // Set CSS variables for mouse-follow glow highlight
      const px = ((e.clientX - rect.left) / rect.width) * 100;
      const py = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--mouse-x', `${px}%`);
      card.style.setProperty('--mouse-y', `${py}%`);

      // Tilt card
      gsap.to(card, {
        rotationY: mx * 8, // subtle rotation
        rotationX: my * 8,
        transformPerspective: 1000,
        duration: 0.4,
        ease: 'power2.out'
      });
    });

    cardWrapper.addEventListener('mouseleave', () => {
      gsap.to(card, {
        rotationY: 0,
        rotationX: 0,
        duration: 0.8,
        ease: 'power3.out'
      });
    });
  });

  // Re-initialize on dynamic filter/pagination updates using MutationObserver
  const gridContainer = document.querySelector('#ProductGridContainer') || document.querySelector('.product-grid');
  if (gridContainer && !gridContainer.hasAttribute('data-has-observer')) {
    gridContainer.setAttribute('data-has-observer', 'true');
    const observer = new MutationObserver(() => {
      initProduct3DCards();
    });
    observer.observe(gridContainer, { childList: true, subtree: true });
  }
}

// Re-initialize scripts when a section is loaded in the Shopify Theme Editor
document.addEventListener('shopify:section:load', (event) => {
  console.log('Shopify section reloaded:', event.detail.sectionId);
  initSignatureCollections();
  initProduct3DCards();
  initHero3D();
});


