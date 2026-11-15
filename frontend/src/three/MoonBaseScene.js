/**
 * MoonBaseScene.js
 * NASA Inflatable Ice Home Habitat on the Lunar Surface for PROJECT PYROS.
 * 
 * Replaces the complex base with the iconic NASA Inflatable Ice Home Habitat ("Mars House")
 * placed in the Moon's environment:
 * - Lunar Environment:
 *   - Realistic grey lunar regolith terrain with impact craters
 *   - Deep pitch-black space vacuum with 4,000+ stars
 *   - Earth ("The Blue Marble") in the lunar sky with atmospheric limb halo
 *   - Directional sunlight with sharp lunar shadows
 *   - Instanced lunar breccia rocks & boulders
 * - The Inflatable Ice Home Habitat ("Mars House"):
 *   - Scalloped foundation torus collar anchored into lunar regolith
 *   - Translucent frosted quilted ice membrane shell (bulbous lower belt + upper hemisphere)
 *   - Inner multi-level habitation decks & glowing laboratory workstation racks visible through the membrane
 *   - Powerful internal living core illumination (warm living quarters light + cyan ice-scattering glow)
 *   - Pressurized airlock vestibule with pressure hatch, viewing window, dog latch handle, and status LED
 *   - Dual flexible umbilical ducts snaking across the regolith
 *   - Left support module (telemetry container with NASA meatball logo, dials, 4 telescoping legs, and work floodlight)
 *   - Right support module (ECLSS power generator with dual tanks, 4 outriggers, and red inspection status light)
 *   - Surface combustion research chamber on a machined stand connected via life-support umbilical
 * - 5 Interactive Simulation Modes: Normal, Power, Life Support, Thermal, Emergency
 */

import * as THREE from 'three';

// Fast 2D Gradient Noise for Lunar Terrain
class FastPerlin {
  constructor(seed = 1969) {
    this.p = new Uint8Array(512);
    const perm = new Uint8Array(256);
    for (let i = 0; i < 256; i++) perm[i] = i;

    let s = seed;
    for (let i = 255; i > 0; i--) {
      s = (s * 16807) % 2147483647;
      const j = s % (i + 1);
      const tmp = perm[i];
      perm[i] = perm[j];
      perm[j] = tmp;
    }

    for (let i = 0; i < 512; i++) {
      this.p[i] = perm[i & 255];
    }
  }

  fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  lerp(t, a, b) { return a + t * (b - a); }

  grad(hash, x, y) {
    const h = hash & 7;
    const u = h < 4 ? x : y;
    const v = h < 4 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  noise2D(x, y) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    const u = this.fade(xf);
    const v = this.fade(yf);

    const A = this.p[X] + Y;
    const B = this.p[X + 1] + Y;

    return this.lerp(
      v,
      this.lerp(u, this.grad(this.p[A], xf, yf), this.grad(this.p[B], xf - 1, yf)),
      this.lerp(u, this.grad(this.p[A + 1], xf, yf - 1), this.grad(this.p[B - 1], xf - 1, yf - 1))
    );
  }

  fbm(x, y, octaves = 5, lacunarity = 2.0, gain = 0.5) {
    let sum = 0.0;
    let amp = 1.0;
    let freq = 1.0;
    let max = 0.0;

    for (let i = 0; i < octaves; i++) {
      sum += this.noise2D(x * freq, y * freq) * amp;
      max += amp;
      freq *= lacunarity;
      amp *= gain;
    }
    return sum / max;
  }
}

export class MoonBaseScene {
  constructor(scene) {
    this.scene = scene;
    this.rootGroup = new THREE.Group();
    this.scene.add(this.rootGroup);

    this.perlin = new FastPerlin(1969);

    // Environment & Lighting
    this.sunLight = null;
    this.ambientLight = null;
    this.earthMesh = null;
    this.earthGroup = null;

    // Habitat Entities & Lights
    this.habGroup = null;
    this.habCoreLight = null;
    this.habIceGlow = null;
    this.groundPoolLight = null;
    this.workFloodLight = null;
    this.redStatusLight = null;
    this.combustionFlame = null;
    this.combustionLight = null;

    // Animated Active Elements
    this.starMesh = null;
    this.apexBeaconMesh = null;
    this.apexBeaconLight = null;
    this.beaconMat = null;
    this.telemetryDishGimbal = null;
    this.eclssLedGreen = null;
    this.eclssLedAmber = null;

    // Simulation State
    this.simulationMode = 'normal';
    this.emergencyActive = false;
    this.emergencyTime = 0;

    this.textures = {};
    this.init();
  }

  init() {
    this.generateProceduralTextures();
    this.buildSpaceVacuumAndStars();
    this.buildLunarTerrain();
    this.buildNASAInflatableIceHome();
    this.buildSurfaceCombustionExperiment();
  }

  // =========================================================================
  // 1. PROCEDURAL PBR TEXTURES (Regolith + Ice Home Textures from Mars Scene)
  // =========================================================================
  generateProceduralTextures() {
    this.textures.regolith = this.createLunarRegolithPBR();
    this.textures.iceDome = this.createIceDomeAlbedoTexture();
    this.textures.iceDomeNormal = this.createIceDomeNormalTexture();
    this.textures.moduleGauges = this.createModuleGaugesTexture();
    this.textures.corrugated = this.createCorrugatedHoseTexture();
    this.textures.earth = this.createProceduralEarthTexture();
  }

  createLunarRegolithPBR() {
    const W = 1024;
    const H = 1024;
    const heightBuffer = new Float32Array(W * H);

    for (let y = 0; y < H; y++) {
      const ny = y / H;
      for (let x = 0; x < W; x++) {
        const nx = x / W;
        // Toroidal periodic noise wrapping for 100% seamless tiling without grid artifacts
        const s = nx;
        const t = ny;
        const v1 = this.perlin.fbm(s * 4.0, t * 4.0, 3, 2.0, 0.5);
        const v2 = this.perlin.fbm((s - 1.0) * 4.0, t * 4.0, 3, 2.0, 0.5);
        const v3 = this.perlin.fbm(s * 4.0, (t - 1.0) * 4.0, 3, 2.0, 0.5);
        const v4 = this.perlin.fbm((s - 1.0) * 4.0, (t - 1.0) * 4.0, 3, 2.0, 0.5);
        const wx = s * s * (3.0 - 2.0 * s);
        const wy = t * t * (3.0 - 2.0 * t);
        const macro = (1 - wx) * (1 - wy) * v1 + wx * (1 - wy) * v2 + (1 - wx) * wy * v3 + wx * wy * v4;
        const micro = (Math.random() - 0.5) * 0.04;
        heightBuffer[y * W + x] = macro * 0.65 + micro;
      }
    }

    const aCanvas = document.createElement('canvas'); aCanvas.width = W; aCanvas.height = H;
    const actx = aCanvas.getContext('2d');
    const aImg = actx.createImageData(W, H);

    const nCanvas = document.createElement('canvas'); nCanvas.width = W; nCanvas.height = H;
    const nctx = nCanvas.getContext('2d');
    const nImg = nctx.createImageData(W, H);

    const rCanvas = document.createElement('canvas'); rCanvas.width = W; rCanvas.height = H;
    const rctx = rCanvas.getContext('2d');
    const rImg = rctx.createImageData(W, H);

    const normalScale = 4.5;

    for (let y = 0; y < H; y++) {
      const ym1 = (y - 1 + H) % H;
      const yp1 = (y + 1) % H;

      for (let x = 0; x < W; x++) {
        const xm1 = (x - 1 + W) % W;
        const xp1 = (x + 1) % W;
        const idx = (y * W + x) * 4;

        const tl = heightBuffer[ym1 * W + xm1];
        const t = heightBuffer[ym1 * W + x];
        const tr = heightBuffer[ym1 * W + xp1];
        const l = heightBuffer[y * W + xm1];
        const r = heightBuffer[y * W + xp1];
        const bl = heightBuffer[yp1 * W + xm1];
        const b = heightBuffer[yp1 * W + x];
        const br = heightBuffer[yp1 * W + xp1];

        const dX = (tr + 2.0 * r + br) - (tl + 2.0 * l + bl);
        const dY = (bl + 2.0 * b + br) - (tl + 2.0 * t + tr);

        let nx = -dX * normalScale;
        let ny = -dY * normalScale;
        let nz = 1.0;
        const invLen = 1.0 / Math.hypot(nx, ny, nz);
        nx *= invLen; ny *= invLen; nz *= invLen;

        nImg.data[idx] = Math.floor((nx * 0.5 + 0.5) * 255);
        nImg.data[idx + 1] = Math.floor((ny * 0.5 + 0.5) * 255);
        nImg.data[idx + 2] = Math.floor((nz * 0.5 + 0.5) * 255);
        nImg.data[idx + 3] = 255;

        // Neutral lunar grey mineral coloration
        const hVal = heightBuffer[y * W + x];
        const baseGrey = 110 + Math.floor(hVal * 70);
        const speckle = (Math.random() - 0.5) * 12;
        const grey = Math.min(255, Math.max(0, baseGrey + speckle));

        aImg.data[idx] = grey;
        aImg.data[idx + 1] = grey;
        aImg.data[idx + 2] = Math.min(255, grey + 3);
        aImg.data[idx + 3] = 255;

        // Roughness
        rImg.data[idx] = 238;
        rImg.data[idx + 1] = 238;
        rImg.data[idx + 2] = 238;
        rImg.data[idx + 3] = 255;
      }
    }

    actx.putImageData(aImg, 0, 0);
    nctx.putImageData(nImg, 0, 0);
    rctx.putImageData(rImg, 0, 0);

    const albedoTex = new THREE.CanvasTexture(aCanvas);
    albedoTex.wrapS = albedoTex.wrapT = THREE.RepeatWrapping;
    albedoTex.repeat.set(16, 16);

    const normalTex = new THREE.CanvasTexture(nCanvas);
    normalTex.wrapS = normalTex.wrapT = THREE.RepeatWrapping;
    normalTex.repeat.set(16, 16);

    const roughTex = new THREE.CanvasTexture(rCanvas);
    roughTex.wrapS = roughTex.wrapT = THREE.RepeatWrapping;
    roughTex.repeat.set(16, 16);

    return { albedo: albedoTex, normal: normalTex, roughness: roughTex };
  }

  createIceDomeAlbedoTexture() {
    const W = 1024;
    const H = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Base frosted translucent ice-composite membrane
    const baseGrad = ctx.createLinearGradient(0, 0, 0, H);
    baseGrad.addColorStop(0.0, '#eaf4fd');
    baseGrad.addColorStop(0.5, '#dbeefe');
    baseGrad.addColorStop(1.0, '#b8dcfb');
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, W, H);

    // 16 vertical quilted pillow columns, 8 horizontal rings
    const cols = 16;
    const rows = 8;
    const colW = W / cols;
    const rowH = H / rows;

    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const x = c * colW;
        const y = r * rowH;

        const cellGrad = ctx.createRadialGradient(
          x + colW * 0.5, y + rowH * 0.5, 2,
          x + colW * 0.5, y + rowH * 0.5, Math.hypot(colW, rowH) * 0.6
        );
        cellGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.95)');
        cellGrad.addColorStop(0.4, 'rgba(235, 246, 255, 0.85)');
        cellGrad.addColorStop(0.8, 'rgba(180, 215, 245, 0.65)');
        cellGrad.addColorStop(1.0, 'rgba(120, 165, 205, 0.45)');

        ctx.fillStyle = cellGrad;
        ctx.fillRect(x + 2, y + 2, colW - 4, rowH - 4);
      }
    }

    // Structural reinforcement seam grid lines
    ctx.strokeStyle = 'rgba(70, 100, 135, 0.75)';
    ctx.lineWidth = 4;
    for (let c = 0; c <= cols; c++) {
      ctx.beginPath();
      ctx.moveTo(c * colW, 0); ctx.lineTo(c * colW, H); ctx.stroke();
    }
    for (let r = 0; r <= rows; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * rowH); ctx.lineTo(W, r * rowH); ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }

  createIceDomeNormalTexture() {
    const W = 512;
    const H = 512;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(W, H);
    const data = imgData.data;

    const cols = 16;
    const rows = 8;
    const colW = W / cols;
    const rowH = H / rows;

    for (let y = 0; y < H; y++) {
      const cellY = (y % rowH) / rowH;
      const dY = (cellY - 0.5) * 2.0;

      for (let x = 0; x < W; x++) {
        const cellX = (x % colW) / colW;
        const dX = (cellX - 0.5) * 2.0;

        let nx = dX * 0.85;
        let ny = -dY * 0.85;
        let nz = Math.sqrt(Math.max(0.1, 1.0 - nx * nx - ny * ny));

        const inv = 1.0 / Math.hypot(nx, ny, nz);
        nx *= inv; ny *= inv; nz *= inv;

        const idx = (y * W + x) * 4;
        data[idx]     = Math.floor((nx * 0.5 + 0.5) * 255);
        data[idx + 1] = Math.floor((ny * 0.5 + 0.5) * 255);
        data[idx + 2] = Math.floor((nz * 0.5 + 0.5) * 255);
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }

  createModuleGaugesTexture() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Base aerospace painted sand/tan finish
    ctx.fillStyle = '#dbd6ce';
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = '#9e978e';
    ctx.lineWidth = 3;
    ctx.strokeRect(8, 8, size - 16, size - 16);

    // NASA Meatball Logo
    const cx = size * 0.35;
    const cy = size * 0.45;

    ctx.fillStyle = '#0b3d91';
    ctx.beginPath();
    ctx.arc(cx, cy, 55, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(cx - 50, cy + 28);
    ctx.lineTo(cx, cy - 35);
    ctx.lineTo(cx + 50, cy + 28);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('NASA', cx, cy + 3);

    // Dial Gauges
    const g1x = size * 0.75;
    const g1y = size * 0.32;
    const gRad = 48;

    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(g1x, g1y, gRad, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#fef2f2';
    ctx.lineWidth = 2;
    for (let a = 0; a < Math.PI * 1.5; a += Math.PI * 0.2) {
      const ang = a + Math.PI * 0.75;
      ctx.beginPath();
      ctx.moveTo(g1x + Math.cos(ang) * (gRad - 8), g1y + Math.sin(ang) * (gRad - 8));
      ctx.lineTo(g1x + Math.cos(ang) * gRad, g1y + Math.sin(ang) * gRad);
      ctx.stroke();
    }

    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(g1x, g1y);
    ctx.lineTo(g1x + Math.cos(Math.PI * 1.2) * (gRad - 10), g1y + Math.sin(Math.PI * 1.2) * (gRad - 10));
    ctx.stroke();

    return new THREE.CanvasTexture(canvas);
  }

  createCorrugatedHoseTexture() {
    const W = 256; const H = 256;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#e8e4dc';
    ctx.fillRect(0, 0, W, H);

    for (let y = 0; y < H; y += 12) {
      const grad = ctx.createLinearGradient(0, y, 0, y + 12);
      grad.addColorStop(0.0, 'rgba(255, 255, 255, 0.6)');
      grad.addColorStop(0.5, 'rgba(120, 115, 105, 0.4)');
      grad.addColorStop(1.0, 'rgba(50, 45, 40, 0.55)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, y, W, 10);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 16);
    return tex;
  }

  createProceduralEarthTexture() {
    const W = 1024; const H = 512;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0b1938';
    ctx.fillRect(0, 0, W, H);

    for (let y = 0; y < H; y++) {
      const ny = y / H;
      for (let x = 0; x < W; x++) {
        const nx = x / W;
        const val = this.perlin.fbm(nx * 4.5, ny * 4.5, 4, 2.0, 0.5);
        if (val > 0.54) {
          const t = (val - 0.54) / 0.46;
          ctx.fillStyle = `rgb(${Math.floor(40 + t * 90)},${Math.floor(95 + t * 60)},${Math.floor(45 + t * 20)})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    for (let i = 0; i < 40; i++) {
      const cx = (i * 25.7) % W;
      const cy = 50 + ((i * 39.1) % (H - 100));
      ctx.beginPath();
      ctx.arc(cx, cy, 22 + (i % 5) * 15, 0, Math.PI * 2);
      ctx.fill();
    }

    return new THREE.CanvasTexture(canvas);
  }

  // =========================================================================
  // 2. SPACE VACUUM & STARS
  // =========================================================================
  buildSpaceVacuumAndStars() {
    this.scene.background = new THREE.Color(0x000003);

    // Stark directional sunlight
    this.sunLight = new THREE.DirectionalLight(0xfffaee, 3.4);
    this.sunLight.position.set(-75, 45, 65);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 1.0;
    this.sunLight.shadow.camera.far = 260;
    this.sunLight.shadow.camera.left = -55;
    this.sunLight.shadow.camera.right = 55;
    this.sunLight.shadow.camera.top = 55;
    this.sunLight.shadow.camera.bottom = -55;
    this.sunLight.shadow.bias = -0.0003;
    this.rootGroup.add(this.sunLight);

    // Dark space ambient bounce
    this.ambientLight = new THREE.AmbientLight(0x1a2130, 0.38);
    this.rootGroup.add(this.ambientLight);

    // Balanced celestial starfield: 640 stars, with high density directly across the panoramic sky
    const starCount = 640;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      let x, y, z;

      if (i < 380) {
        // Direct panorama sky field: behind the base, directly in camera sightline
        // Camera looks towards negative Z (around Z = -80 to -380), X in [-260, 260], Y in [14, 180]
        x = (Math.random() - 0.5) * 520;
        y = 12.0 + Math.random() * 190.0;
        z = -70.0 - Math.random() * 320.0;
        // Project onto distant celestial sphere r ~ 400
        const len = Math.hypot(x, y, z);
        const r = 390 + Math.random() * 30;
        x = (x / len) * r;
        y = Math.max(10.0, (y / len) * r);
        z = (z / len) * r;
      } else {
        // Upper celestial dome for 360 surround
        const theta = Math.random() * 2.0 * Math.PI;
        const phi = Math.acos(0.04 + Math.random() * 0.96); // Elevation from 2.3° to 90°
        const r = 410 + Math.random() * 25;
        x = r * Math.sin(phi) * Math.cos(theta);
        y = Math.max(10.0, r * Math.cos(phi));
        z = r * Math.sin(phi) * Math.sin(theta);
      }

      starPos[i * 3] = x;
      starPos[i * 3 + 1] = y;
      starPos[i * 3 + 2] = z;

      // Realistic stellar magnitude and subtle temperature variation
      const brightness = 0.55 + Math.random() * 0.45;
      const tint = Math.random();
      if (tint < 0.25) {
        // Pale blue (O/B type)
        starColors[i * 3] = brightness * 0.88;
        starColors[i * 3 + 1] = brightness * 0.95;
        starColors[i * 3 + 2] = brightness * 1.05;
      } else if (tint < 0.40) {
        // Pale warm (G/K type)
        starColors[i * 3] = brightness * 1.05;
        starColors[i * 3 + 1] = brightness * 0.95;
        starColors[i * 3 + 2] = brightness * 0.82;
      } else {
        // Crisp white
        starColors[i * 3] = brightness;
        starColors[i * 3 + 1] = brightness;
        starColors[i * 3 + 2] = brightness;
      }
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    this.starMesh = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({ size: 1.45, vertexColors: true, transparent: true, opacity: 0.88 })
    );
    this.rootGroup.add(this.starMesh);
  }

  // =========================================================================
  // 3. LUNAR TERRAIN & CRATERS
  // =========================================================================
  buildLunarTerrain() {
    const size = 260;
    const segs = 140;
    const geo = new THREE.PlaneGeometry(size, size, segs, segs);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getZ(i);

      let h = this.perlin.fbm(vx * 0.018, vz * 0.018, 4, 2.0, 0.45) * 5.5;

      // Subtle impact crater to the north-east
      const d1 = Math.hypot(vx - 45, vz + 35);
      if (d1 < 30.0) {
        const normD = d1 / 30.0;
        h -= (1.0 - normD * normD) * 5.0;
      }

      // Smooth foundation area under the Ice Home
      const baseDist = Math.hypot(vx, vz);
      if (baseDist < 20.0) {
        const blend = Math.max(0.0, (baseDist - 8.0) / 12.0);
        h = h * blend + 0.12 * (1.0 - blend);
      }

      pos.setY(i, h);
    }

    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      map: this.textures.regolith.albedo,
      normalMap: this.textures.regolith.normal,
      roughnessMap: this.textures.regolith.roughness,
      roughness: 0.95,
      metalness: 0.05
    });

    const terrain = new THREE.Mesh(geo, mat);
    terrain.receiveShadow = true;
    this.rootGroup.add(terrain);
  }

  // =========================================================================
  // 4. EARTH REMOVED (Per user request: clean deep-space background)
  // =========================================================================
  buildEarthInSky() {
    // Earth removed from background per user request
  }

  // =========================================================================
  // 5. LUNAR ROCKS REMOVED (Smooth crater regolith terrain)
  // =========================================================================
  buildInstancedLunarBoulders() {
    // All rocks removed from moon surface per user specification
  }

  // =========================================================================
  // 6. NASA MARS INFLATABLE ICE HOME HABITAT ("MARS HOUSE") ON THE MOON
  // =========================================================================
  buildNASAInflatableIceHome() {
    this.habGroup = new THREE.Group();
    this.habGroup.position.set(0, 0, 0);

    const darkFrameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.85 });
    const legMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.35, metalness: 0.85 });

    // --- A. CENTRAL INFLATABLE ICE HOME DOME ---
    const domeGroup = new THREE.Group();
    domeGroup.position.set(0, 0, 0);

    // 1. Pillow Foundation Torus Collar (Anchored into regolith)
    const baseCollarMat = new THREE.MeshStandardMaterial({
      color: 0x8892a0,
      roughness: 0.70,
      metalness: 0.25
    });
    const collarGeo = new THREE.TorusGeometry(5.3, 0.42, 16, 48);
    collarGeo.rotateX(Math.PI / 2);
    const collarMesh = new THREE.Mesh(collarGeo, baseCollarMat);
    collarMesh.position.y = 0.35;
    domeGroup.add(collarMesh);

    // 2. Translucent Frosted Quilted Ice Membrane Shell
    const iceDomeMat = new THREE.MeshPhysicalMaterial({
      map: this.textures.iceDome,
      normalMap: this.textures.iceDomeNormal,
      normalScale: new THREE.Vector2(1.2, 1.2),
      color: 0xf0f7fe,
      emissive: 0x7dd3fc,
      emissiveIntensity: 0.18,
      transparent: true,
      opacity: 0.84,
      transmission: 0.65,
      roughness: 0.28,
      metalness: 0.04,
      ior: 1.31,
      thickness: 1.5,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    // Inflatable double-curved bulbous dome: lower belt + upper hemisphere
    const lowerBulb = new THREE.Mesh(
      new THREE.CylinderGeometry(5.3, 5.65, 2.6, 36, 6, true),
      iceDomeMat
    );
    lowerBulb.position.y = 1.75;
    domeGroup.add(lowerBulb);

    const upperDome = new THREE.Mesh(
      new THREE.SphereGeometry(5.3, 36, 24, 0, Math.PI * 2, 0, Math.PI * 0.5),
      iceDomeMat
    );
    upperDome.position.y = 3.05;
    domeGroup.add(upperDome);

    // Apex Communication Mast & Warning Strobe Beacon
    const mastGeo = new THREE.CylinderGeometry(0.06, 0.09, 1.8, 8);
    const mastMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.85, roughness: 0.3 });
    const mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.set(0, 8.8, 0);
    domeGroup.add(mast);

    this.beaconMat = new THREE.MeshStandardMaterial({
      color: 0xff3b30,
      emissive: new THREE.Color(0xff2200),
      emissiveIntensity: 3.0,
      roughness: 0.1
    });
    this.apexBeaconMesh = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), this.beaconMat);
    this.apexBeaconMesh.position.set(0, 9.75, 0);
    domeGroup.add(this.apexBeaconMesh);

    this.beaconLight = new THREE.PointLight(0xff3b30, 3.2, 22.0, 1.2);
    this.beaconLight.position.set(0, 9.75, 0);
    domeGroup.add(this.beaconLight);

    // 3. Inner Habitation Decks & Workstation Silhouettes
    const deckMat = new THREE.MeshStandardMaterial({ color: 0x242e3d, roughness: 0.75, metalness: 0.3 });

    // Main Crew Deck Floor
    const groundDeck = new THREE.Mesh(new THREE.CylinderGeometry(5.1, 5.1, 0.15, 32), deckMat);
    groundDeck.position.y = 0.45;
    domeGroup.add(groundDeck);

    // Science Mezzanine Deck Floor
    const mezDeck = new THREE.Mesh(new THREE.CylinderGeometry(4.1, 4.1, 0.12, 32), deckMat);
    mezDeck.position.y = 2.95;
    domeGroup.add(mezDeck);

    // Central Core Tower / Avionics Column
    const corePillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.75, 0.85, 5.8, 16),
      new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.45, metalness: 0.65 })
    );
    corePillar.position.y = 3.2;
    domeGroup.add(corePillar);

    // Laboratory Equipment Racks & Glowing Workstation Screens
    const rackMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.8 });
    const screenCyan = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const screenAmber = new THREE.MeshBasicMaterial({ color: 0xfef08a });

    for (let r = 0; r < 7; r++) {
      const rAngle = (r / 7) * Math.PI * 2;
      const rx = Math.cos(rAngle) * 3.5;
      const rz = Math.sin(rAngle) * 3.5;

      const rack = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.1, 0.55), rackMat);
      rack.position.set(rx, 1.55, rz);
      rack.rotation.y = -rAngle + Math.PI / 2;
      domeGroup.add(rack);

      const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.32), r % 2 === 0 ? screenCyan : screenAmber);
      scr.position.set(rx * 0.93, 1.9, rz * 0.93);
      scr.rotation.y = -rAngle - Math.PI / 2;
      domeGroup.add(scr);
    }

    // 4. POWERFUL INTERNAL HABITAT ILLUMINATION
    // Primary warm incandescent living core light
    this.habCoreLight = new THREE.PointLight(0xfffae8, 5.5, 36, 1.1);
    this.habCoreLight.position.set(0, 3.6, 0);
    domeGroup.add(this.habCoreLight);

    // Secondary cool cyan ice-scattering glow
    this.habIceGlow = new THREE.PointLight(0x7dd3fc, 3.2, 24, 1.4);
    this.habIceGlow.position.set(0, 5.2, 0);
    domeGroup.add(this.habIceGlow);

    // Downward diffuse light casting glowing pool on the regolith
    this.groundPoolLight = new THREE.SpotLight(0xfff7ed, 4.2, 18, Math.PI / 2.2, 0.7, 1.2);
    this.groundPoolLight.position.set(0, 6.8, 0);
    this.groundPoolLight.target.position.set(0, 0, 0);
    domeGroup.add(this.groundPoolLight);
    domeGroup.add(this.groundPoolLight.target);

    // --- B. PRESSURIZED AIRLOCK VESTIBULE & PRESSURE HATCH (Front-Right) ---
    const airlockGroup = new THREE.Group();
    const alAngle = 0.78;
    const alDist = 5.1;
    airlockGroup.position.set(Math.sin(alAngle) * alDist, 0, Math.cos(alAngle) * alDist);
    airlockGroup.rotation.y = alAngle;

    const alHousingMat = new THREE.MeshStandardMaterial({ color: 0x828c9a, roughness: 0.50, metalness: 0.65 });
    const alHousing = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.2, 1.5), alHousingMat);
    alHousing.position.set(0, 1.2, 0.55);
    airlockGroup.add(alHousing);

    const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.25, 1.88, 0.12), darkFrameMat);
    doorFrame.position.set(0, 1.15, 1.34);
    airlockGroup.add(doorFrame);

    const hatchDoor = new THREE.Mesh(
      new THREE.BoxGeometry(1.02, 1.70, 0.08),
      new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.40, metalness: 0.55 })
    );
    hatchDoor.position.set(0, 1.15, 1.40);
    airlockGroup.add(hatchDoor);

    // Oval Window on Hatch
    const alWindow = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.16, 0.12, 20),
      new THREE.MeshPhysicalMaterial({ color: 0x0284c7, transmission: 0.85, roughness: 0.1, transparent: true, opacity: 0.8 })
    );
    alWindow.rotation.x = Math.PI / 2;
    alWindow.position.set(0, 1.38, 1.42);
    airlockGroup.add(alWindow);

    // Dog Latch Handle
    const latchHandle = new THREE.Mesh(
      new THREE.TorusGeometry(0.10, 0.02, 12, 24, Math.PI * 1.5),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.25, metalness: 0.9 })
    );
    latchHandle.position.set(0.32, 1.10, 1.46);
    airlockGroup.add(latchHandle);

    // Green Status LED
    const statusLed = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0x22c55e })
    );
    statusLed.position.set(-0.32, 1.78, 1.46);
    airlockGroup.add(statusLed);

    domeGroup.add(airlockGroup);
    this.habGroup.add(domeGroup);

    // --- C. DUAL FLEXIBLE UMBILICAL DUCTS ---
    const hoseMat = new THREE.MeshStandardMaterial({
      map: this.textures.corrugated,
      color: 0xe5e0d5,
      roughness: 0.62,
      metalness: 0.15
    });

    const curve1 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(3.8, 0.25, 4.2),
      new THREE.Vector3(4.7, 0.14, 4.6),
      new THREE.Vector3(5.8, 0.13, 4.2),
      new THREE.Vector3(6.7, 0.28, 3.4),
      new THREE.Vector3(7.3, 0.65, 2.5)
    ]);
    const hose1 = new THREE.Mesh(new THREE.TubeGeometry(curve1, 40, 0.11, 12, false), hoseMat);
    hose1.castShadow = true;
    this.habGroup.add(hose1);

    const curve2 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(4.0, 0.18, 3.9),
      new THREE.Vector3(5.0, 0.12, 4.2),
      new THREE.Vector3(6.1, 0.12, 3.7),
      new THREE.Vector3(6.9, 0.25, 3.0),
      new THREE.Vector3(7.4, 0.48, 2.2)
    ]);
    const hose2 = new THREE.Mesh(new THREE.TubeGeometry(curve2, 40, 0.08, 12, false), hoseMat);
    hose2.castShadow = true;
    this.habGroup.add(hose2);

    // --- D. LEFT SUPPORT MODULE (Telemetry & NASA Logo) ---
    const leftModGroup = new THREE.Group();
    leftModGroup.position.set(-8.6, 0, 0.6);
    leftModGroup.rotation.y = 0.25;

    const modMat = new THREE.MeshStandardMaterial({ color: 0xd6d0c4, roughness: 0.48, metalness: 0.35 });
    const boxBody = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.2, 2.5), modMat);
    boxBody.position.y = 1.55;
    boxBody.castShadow = true;
    boxBody.receiveShadow = true;
    leftModGroup.add(boxBody);

    const frontPanel = new THREE.Mesh(
      new THREE.PlaneGeometry(2.8, 1.8),
      new THREE.MeshStandardMaterial({ map: this.textures.moduleGauges, roughness: 0.4, metalness: 0.4 })
    );
    frontPanel.position.set(0, 1.55, 1.26);
    leftModGroup.add(frontPanel);

    // 4 Telescoping Legs with Footpads
    [-1.3, 1.3].forEach(lx => {
      [-1.0, 1.0].forEach(lz => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.8, 12), legMat);
        leg.position.set(lx, 0.4, lz);
        leftModGroup.add(leg);

        const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.08, 16), legMat);
        foot.position.set(lx, 0.04, lz);
        leftModGroup.add(foot);
      });
    });

    // Work Floodlight on Outrigger Arm
    const lampArm = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.8, 8), legMat);
    lampArm.rotation.z = Math.PI / 4;
    lampArm.position.set(1.7, 1.55, 1.1);
    leftModGroup.add(lampArm);

    const lampHead = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.16, 0.14),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, metalness: 0.9 })
    );
    lampHead.position.set(2.05, 1.85, 1.1);
    lampHead.rotation.z = -Math.PI / 6;
    leftModGroup.add(lampHead);

    this.workFloodLight = new THREE.SpotLight(0xfffaed, 3.8, 14, Math.PI / 3.5, 0.5, 1.2);
    this.workFloodLight.position.set(2.05, 1.80, 1.1);
    this.workFloodLight.target.position.set(3.5, 0, 2.5);
    leftModGroup.add(this.workFloodLight);
    leftModGroup.add(this.workFloodLight.target);

    // Articulated Telemetry Tracking Dish on Left Module Top
    const dishPedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.12, 0.5, 8),
      new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.25 })
    );
    dishPedestal.position.set(0, 2.9, 0);
    leftModGroup.add(dishPedestal);

    this.telemetryDishGimbal = new THREE.Group();
    this.telemetryDishGimbal.position.set(0, 3.15, 0);

    const dishMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.85, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.42),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.2, side: THREE.DoubleSide })
    );
    dishMesh.rotation.x = Math.PI * 0.45;
    this.telemetryDishGimbal.add(dishMesh);

    const feedArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.7, 8),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.9, roughness: 0.2 })
    );
    feedArm.position.set(0, 0, 0.4);
    feedArm.rotation.x = Math.PI / 2;
    this.telemetryDishGimbal.add(feedArm);

    const feedHorn = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: new THREE.Color(0x38bdf8), emissiveIntensity: 1.5 })
    );
    feedHorn.position.set(0, 0, 0.75);
    this.telemetryDishGimbal.add(feedHorn);

    leftModGroup.add(this.telemetryDishGimbal);

    this.habGroup.add(leftModGroup);

    // --- E. RIGHT SUPPORT MODULE (ECLSS / Generator with Red Status Light) ---
    const rightModGroup = new THREE.Group();
    rightModGroup.position.set(8.5, 0, 2.0);
    rightModGroup.rotation.y = -0.32;

    const eclssMat = new THREE.MeshStandardMaterial({ color: 0xcdc8bc, roughness: 0.45, metalness: 0.4 });
    [-0.85, 0.85].forEach(cx => {
      const tank = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.4, 2.3), eclssMat);
      tank.position.set(cx, 1.55, 0);
      tank.castShadow = true;
      tank.receiveShadow = true;
      rightModGroup.add(tank);
    });

    [-1.75, 1.75].forEach(ox => {
      [-1.05, 1.05].forEach(oz => {
        const jackBeam = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.16, 0.2), legMat);
        jackBeam.position.set(ox * 0.72, 0.4, oz);
        rightModGroup.add(jackBeam);

        const jackFoot = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.30, 0.1, 16), legMat);
        jackFoot.position.set(ox, 0.05, oz);
        rightModGroup.add(jackFoot);
      });
    });

    // Dual Circular Exhaust Ports
    [-0.3, 0.3].forEach(px => {
      const port = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.18, 0.08, 16),
        new THREE.MeshStandardMaterial({ color: 0x1e242c, roughness: 0.3, metalness: 0.9 })
      );
      port.rotation.x = Math.PI / 2;
      port.position.set(px, 0.75, 1.18);
      rightModGroup.add(port);
    });

    // Red Inspection Light casting crimson pool on the lunar regolith
    const redLightPanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.26, 0.06),
      new THREE.MeshBasicMaterial({ color: 0xff3b30 })
    );
    redLightPanel.position.set(0.85, 1.05, 1.18);
    rightModGroup.add(redLightPanel);

    this.redStatusLight = new THREE.PointLight(0xff1818, 3.6, 7.5, 1.4);
    this.redStatusLight.position.set(0.85, 0.85, 1.40);
    rightModGroup.add(this.redStatusLight);

    // Diagnostic Telemetry LED Indicators
    const ledMat1 = new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: new THREE.Color(0x10b981), emissiveIntensity: 2.2 });
    this.eclssLedGreen = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), ledMat1);
    this.eclssLedGreen.position.set(-0.85, 2.35, 1.18);
    rightModGroup.add(this.eclssLedGreen);

    const ledMat2 = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: new THREE.Color(0xf59e0b), emissiveIntensity: 2.2 });
    this.eclssLedAmber = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), ledMat2);
    this.eclssLedAmber.position.set(-0.65, 2.35, 1.18);
    rightModGroup.add(this.eclssLedAmber);

    this.habGroup.add(rightModGroup);
    this.rootGroup.add(this.habGroup);
  }

  // =========================================================================
  // 7. NASA PSI 0.166g COMBUSTION RESEARCH CHAMBER (LUCI / FM2 Testbed)
  // =========================================================================
  buildSurfaceCombustionExperiment() {
    const expGroup = new THREE.Group();
    expGroup.position.set(-2.8, 0.0, 6.8);

    const standMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35, metalness: 0.85 });
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.70, 0.82, 0.95, 32), standMat);
    stand.position.y = 0.475;
    stand.castShadow = true;
    stand.receiveShadow = true;
    expGroup.add(stand);

    // Cylindrical Combustion Chamber with Quartz Window
    const chamberBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.60, 0.60, 0.85, 24),
      standMat
    );
    chamberBody.position.y = 1.35;
    expGroup.add(chamberBody);

    const windowMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.32, 0.1, 20),
      new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.75, transmission: 0.9 })
    );
    windowMesh.rotation.x = Math.PI / 2;
    windowMesh.position.set(0, 1.35, 0.58);
    expGroup.add(windowMesh);

    // Elongated Lunar Flame (0.166g Roper scaling)
    const flameGeo = new THREE.ConeGeometry(0.14, 0.52, 16);
    this.combustionFlame = new THREE.Mesh(flameGeo, new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.9 }));
    this.combustionFlame.position.set(0, 1.25, 0.2);
    expGroup.add(this.combustionFlame);

    this.combustionLight = new THREE.PointLight(0x38bdf8, 1.6, 4.0);
    this.combustionLight.position.set(0, 1.35, 0.35);
    expGroup.add(this.combustionLight);

    this.rootGroup.add(expGroup);
  }

  // =========================================================================
  // 8. SIMULATION MODES
  // =========================================================================
  setSimulationMode(mode) {
    this.simulationMode = mode;

    switch (mode) {
      case 'normal':
        this.emergencyActive = false;
        if (this.habCoreLight) this.habCoreLight.intensity = 5.5;
        if (this.habIceGlow) { this.habIceGlow.color.setHex(0x7dd3fc); this.habIceGlow.intensity = 3.2; }
        if (this.sunLight) this.sunLight.intensity = 3.4;
        break;

      case 'power':
        this.emergencyActive = false;
        if (this.habCoreLight) this.habCoreLight.intensity = 6.8;
        if (this.habIceGlow) { this.habIceGlow.color.setHex(0x38bdf8); this.habIceGlow.intensity = 4.2; }
        break;

      case 'lifesupport':
        this.emergencyActive = false;
        if (this.habIceGlow) { this.habIceGlow.color.setHex(0x10b981); this.habIceGlow.intensity = 3.5; }
        break;

      case 'thermal':
        this.emergencyActive = false;
        if (this.habIceGlow) { this.habIceGlow.color.setHex(0xf59e0b); this.habIceGlow.intensity = 3.0; }
        break;

      case 'emergency':
        this.emergencyActive = true;
        this.emergencyTime = 0;
        if (this.habCoreLight) this.habCoreLight.intensity = 2.0;
        if (this.habIceGlow) { this.habIceGlow.color.setHex(0xef4444); this.habIceGlow.intensity = 4.0; }
        break;
    }
  }

  // =========================================================================
  // 9. ANIMATION LOOP
  // =========================================================================
  update(delta, elapsed) {
    // 1. Dynamic Twinkling Celestial Starfield
    if (this.starMesh) {
      this.starMesh.material.size = 1.45 + Math.sin(elapsed * 2.5) * 0.28;
      this.starMesh.material.opacity = 0.82 + Math.sin(elapsed * 3.2) * 0.12;
    }

    // 2. Apex Warning Strobe Flash (Realistic aerospace cadence: double flash every 1.4s)
    if (this.beaconLight && this.beaconMat) {
      const cycle = elapsed % 1.4;
      const isPulse = (cycle < 0.1) || (cycle > 0.2 && cycle < 0.3);
      const intensity = isPulse ? 3.8 : 0.05;
      this.beaconLight.intensity = intensity;
      this.beaconMat.emissiveIntensity = intensity * 1.5;
    }

    // 3. Telemetry Tracking Dish Gimbal Sweep on Left Support Module
    if (this.telemetryDishGimbal) {
      this.telemetryDishGimbal.rotation.y = Math.sin(elapsed * 0.35) * 0.5;
      this.telemetryDishGimbal.rotation.x = -0.22 + Math.sin(elapsed * 0.2) * 0.08;
    }

    // 4. ECLSS Diagnostic Status Blinkers on Right Support Module
    if (this.eclssLedGreen && this.eclssLedAmber) {
      this.eclssLedGreen.material.emissiveIntensity = Math.sin(elapsed * 3.8) > 0.2 ? 2.8 : 0.2;
      this.eclssLedAmber.material.emissiveIntensity = Math.cos(elapsed * 2.4) > 0.0 ? 2.8 : 0.2;
    }

    // 5. Living Core Internal Lighting Breathe & Ice Membrane Glow
    if (this.habCoreLight) {
      this.habCoreLight.intensity = 5.2 + Math.sin(elapsed * 1.4) * 0.8;
    }
    if (this.habIceGlow) {
      this.habIceGlow.intensity = 3.2 + Math.cos(elapsed * 1.1) * 0.5;
    }

    // 6. Right ECLSS Red Inspection Light Shimmer
    if (this.redStatusLight) {
      this.redStatusLight.intensity = 3.6 + Math.sin(elapsed * 1.8) * 0.7;
    }

    // 7. 0.166g Lunar Combustion Flame Organic Flicker & Quartz Window Glow
    if (this.combustionFlame) {
      const flickY = 1.0 + Math.sin(elapsed * 14.0) * 0.09 + Math.cos(elapsed * 22.0) * 0.06;
      const flickX = 1.0 + Math.sin(elapsed * 9.0) * 0.04;
      this.combustionFlame.scale.set(flickX, flickY, flickX);
    }
    if (this.combustionLight) {
      this.combustionLight.intensity = 1.6 + Math.sin(elapsed * 16.0) * 0.4;
    }

    if (this.emergencyActive) {
      this.emergencyTime += delta;
      const strobe = Math.sin(this.emergencyTime * 8.0) > 0.0 ? 4.5 : 0.5;
      if (this.habIceGlow) this.habIceGlow.intensity = strobe;
    }
  }
}
