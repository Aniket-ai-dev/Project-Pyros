/**
 * ChamberScene.js
 * 3D Scene Environment featuring:
 * - Photorealistic Candle Apparatus (Image 1): Cylindrical wax pillar with melted wax pool,
 *   subsurface scattering illumination, and braided wick with glowing ember tip.
 * - NASA CIR Aerospike Nozzle with dual tungsten electrodes.
 * - NASA Microgravity FLEX-2 Droplet suspension tether.
 * - Rising Fiery Embers & Sparks (Image 2).
 * - Dynamic Flame Point Light illuminating the candle top rim and chamber.
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

export class ChamberScene {
  constructor(scene, config) {
    this.scene = scene;
    this.config = config;

    this.flameLight = null;
    this.candleGroup = null;
    this.burnerGroup = null;
    this.dropletWires = null;
    this.boxHelper = null;
    this.embers = null;
    this.emberPositions = null;
    this.emberVelocities = null;

    this.init();
  }

  init() {
    this.createLighting();
    this.createTestBench();
    this.createCandleApparatus();
    this.createBurnerNozzle();
    this.createDropletSupport();
    this.createChamberEnclosure();
    this.createBoundingWireframe();
    this.createRisingEmbers();
  }

  createLighting() {
    // Aerospace dark ambient
    const ambient = new THREE.AmbientLight(0x0a1018, 1.4);
    this.scene.add(ambient);

    // Subtle rim lighting
    const rim1 = new THREE.DirectionalLight(0x386088, 1.2);
    rim1.position.set(4, 7, 5);
    this.scene.add(rim1);

    const rim2 = new THREE.DirectionalLight(0x182230, 0.8);
    rim2.position.set(-4, 3, -4);
    this.scene.add(rim2);

    // Primary Dynamic Flame Light (Casts warm glow onto wax candle top and surroundings)
    this.flameLight = new THREE.PointLight(0xff9933, 2.6, 5.0, 2.0);
    this.flameLight.position.set(0, 0.32, 0);
    this.scene.add(this.flameLight);
  }

  createTestBench() {
    // Optical breadboard table
    const benchGeo = new THREE.BoxGeometry(4.2, 0.12, 4.2);
    const benchMat = new THREE.MeshStandardMaterial({
      color: 0x0f151e,
      roughness: 0.35,
      metalness: 0.85
    });
    const bench = new THREE.Mesh(benchGeo, benchMat);
    bench.position.y = -0.66;
    this.scene.add(bench);

    // Precision alignment grid
    const gridHelper = new THREE.GridHelper(4.0, 40, 0x00d2ff, 0x162436);
    gridHelper.position.y = -0.595;
    this.scene.add(gridHelper);
  }

  createCandleApparatus() {
    // --- PHOTOREALISTIC WAX CANDLE (Matching User Image 1) ---
    this.candleGroup = new THREE.Group();

    // 1. Wax Pillar Body (Warm Translucent Honey-Amber Wax)
    const candleRadius = 0.42;
    const candleHeight = 0.72;
    const waxGeo = new THREE.CylinderGeometry(candleRadius, candleRadius, candleHeight, 64);

    // Wax material with warm translucent subsurface glow
    const waxMat = new THREE.MeshPhysicalMaterial({
      color: 0xc8701e,
      emissive: 0x301502,
      roughness: 0.30,
      metalness: 0.02,
      transmission: 0.35,
      thickness: 0.85,
      ior: 1.45
    });

    const waxPillar = new THREE.Mesh(waxGeo, waxMat);
    waxPillar.position.y = -0.24;
    this.candleGroup.add(waxPillar);

    // 2. Concave Melted Wax Pool on Top (Shallow liquid depression)
    const poolGeo = new THREE.CylinderGeometry(candleRadius * 0.97, candleRadius * 0.94, 0.02, 64);
    const poolMat = new THREE.MeshPhysicalMaterial({
      color: 0xdf8425,
      emissive: 0x481c00,
      roughness: 0.08,
      metalness: 0.05,
      transmission: 0.50,
      ior: 1.42
    });
    const pool = new THREE.Mesh(poolGeo, poolMat);
    pool.position.y = 0.12;
    this.candleGroup.add(pool);

    // 3. Braided Cotton Wick (Fine slender black cotton cord, radius 0.006, height 0.12 to 0.23)
    const wickCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.12, 0),
      new THREE.Vector3(0.002, 0.155, 0.001),
      new THREE.Vector3(0.006, 0.195, 0.003),
      new THREE.Vector3(0.010, 0.23, 0.005)
    ]);
    const wickGeo = new THREE.TubeGeometry(wickCurve, 24, 0.006, 12, false);
    const wickMat = new THREE.MeshStandardMaterial({
      color: 0x141414,
      roughness: 0.95,
      metalness: 0.05
    });
    const wick = new THREE.Mesh(wickGeo, wickMat);
    this.candleGroup.add(wick);

    // 4. Subtle Wick Ember Tip (Microscopic glowing tip, only prominent when candle is smoldering/extinguished)
    const tipGeo = new THREE.SphereGeometry(0.007, 12, 12);
    this.tipEmberMat = new THREE.MeshBasicMaterial({ color: 0x220500 });
    const tipEmber = new THREE.Mesh(tipGeo, this.tipEmberMat);
    tipEmber.position.set(0.010, 0.23, 0.005);
    this.candleGroup.add(tipEmber);

    this.scene.add(this.candleGroup);
  }

  createBurnerNozzle() {
    // NASA Aerospace CIR Burner Nozzle
    this.burnerGroup = new THREE.Group();

    const flangeGeo = new THREE.CylinderGeometry(0.38, 0.42, 0.08, 32);
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x242a34, roughness: 0.25, metalness: 0.9 });
    const flange = new THREE.Mesh(flangeGeo, steelMat);
    flange.position.y = -0.55;
    this.burnerGroup.add(flange);

    const tubeGeo = new THREE.CylinderGeometry(0.18, 0.24, 0.65, 32);
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0x5a6572, roughness: 0.15, metalness: 0.92 });
    const tube = new THREE.Mesh(tubeGeo, chromeMat);
    tube.position.y = -0.22;
    this.burnerGroup.add(tube);

    const tipGeo = new THREE.CylinderGeometry(0.12, 0.16, 0.08, 32);
    const ceramicMat = new THREE.MeshStandardMaterial({ color: 0xe0e6ed, roughness: 0.6 });
    const tip = new THREE.Mesh(tipGeo, ceramicMat);
    tip.position.y = 0.14;
    this.burnerGroup.add(tip);

    // Orifice
    const orificeGeo = new THREE.RingGeometry(0.04, 0.10, 32);
    const orificeMat = new THREE.MeshBasicMaterial({ color: 0x111111, side: THREE.DoubleSide });
    const orifice = new THREE.Mesh(orificeGeo, orificeMat);
    orifice.rotation.x = -Math.PI / 2;
    orifice.position.y = 0.181;
    this.burnerGroup.add(orifice);

    this.burnerGroup.visible = false; // Candle is default
    this.scene.add(this.burnerGroup);
  }

  createDropletSupport() {
    this.dropletWires = new THREE.Group();

    const wireMat = new THREE.LineBasicMaterial({ color: 0x88aacc, transparent: true, opacity: 0.6 });
    const ptsX = [new THREE.Vector3(-0.6, 0.95, 0), new THREE.Vector3(0.6, 0.95, 0)];
    this.dropletWires.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ptsX), wireMat));

    const ptsZ = [new THREE.Vector3(0, 0.95, -0.6), new THREE.Vector3(0, 0.95, 0.6)];
    this.dropletWires.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ptsZ), wireMat));

    const dropGeo = new THREE.SphereGeometry(0.05, 24, 24);
    const dropMat = new THREE.MeshPhysicalMaterial({ color: 0x66ccff, transmission: 0.85, roughness: 0.1 });
    const droplet = new THREE.Mesh(dropGeo, dropMat);
    droplet.position.set(0, 0.95, 0);
    this.dropletWires.add(droplet);

    this.dropletWires.visible = false;
    this.scene.add(this.dropletWires);
  }

  createChamberEnclosure() {
    const chamberGroup = new THREE.Group();
    const strutGeo = new THREE.CylinderGeometry(0.035, 0.035, 2.8, 16);
    const strutMat = new THREE.MeshStandardMaterial({ color: 0x18202c, metalness: 0.85, roughness: 0.3 });

    const strutPositions = [
      [-1.15, 0.7, -1.15],
      [ 1.15, 0.7, -1.15],
      [-1.15, 0.7,  1.15],
      [ 1.15, 0.7,  1.15]
    ];
    strutPositions.forEach(p => {
      const s = new THREE.Mesh(strutGeo, strutMat);
      s.position.set(...p);
      chamberGroup.add(s);
    });

    const ringGeo = new THREE.TorusGeometry(1.25, 0.025, 16, 48);
    const ring = new THREE.Mesh(ringGeo, strutMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 2.1;
    chamberGroup.add(ring);

    this.scene.add(chamberGroup);
  }

  createBoundingWireframe() {
    const boxGeo = new THREE.BoxGeometry(1.3, 1.82, 1.3);
    const edges = new THREE.EdgesGeometry(boxGeo);
    const lineMat = new THREE.LineBasicMaterial({ color: 0x00d2ff, transparent: true, opacity: 0.25 });
    this.boxHelper = new THREE.LineSegments(edges, lineMat);
    this.boxHelper.position.set(0, 1.08, 0);
    this.scene.add(this.boxHelper);
  }

  createEmberTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.3, 'rgba(255, 190, 60, 0.85)');
    grad.addColorStop(0.7, 'rgba(255, 90, 10, 0.35)');
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  createRisingEmbers() {
    // Glowing Sparks for Jet Burner mode only (Candle has zero embers)
    const emberCount = 80;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(emberCount * 3);
    const colors = new Float32Array(emberCount * 3);
    const scales = new Float32Array(emberCount);

    this.emberVelocities = [];

    for (let i = 0; i < emberCount; i++) {
      // Spawn around burner nozzle orifice
      positions[i * 3 + 0] = (Math.random() - 0.5) * 0.16;
      positions[i * 3 + 1] = 0.22 + Math.random() * 1.4;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.16;

      // Fiery glowing colors (gold, orange, yellow-white)
      colors[i * 3 + 0] = 1.0;
      colors[i * 3 + 1] = 0.55 + Math.random() * 0.4;
      colors[i * 3 + 2] = Math.random() * 0.12;

      scales[i] = 0.02 + Math.random() * 0.03;

      this.emberVelocities.push({
        vx: (Math.random() - 0.5) * 0.06,
        vy: 0.4 + Math.random() * 0.6,
        vz: (Math.random() - 0.5) * 0.06,
        life: Math.random()
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const emberMat = new THREE.PointsMaterial({
      size: 0.038,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      map: this.createEmberTexture(),
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.embers = new THREE.Points(geometry, emberMat);
    this.embers.visible = false; // Hidden by default (Candle is default)
    this.scene.add(this.embers);
  }

  update(time, peakTempNorm = 0.75, gravity = 9.81, burnerShape = 'candle', showWireframe = true) {
    if (this.boxHelper) {
      this.boxHelper.visible = showWireframe;
    }

    const isCandle = (burnerShape === 'candle');
    const isDroplet = (burnerShape === 'droplet');

    // Toggle Burner Nozzle vs Candle vs Droplet
    if (isCandle) {
      this.candleGroup.visible = true;
      this.burnerGroup.visible = false;
      this.dropletWires.visible = false;
      this.flameLight.position.set(0, 0.32, 0);
      if (this.embers) this.embers.visible = false; // Candles NEVER emit embers!
    } else if (isDroplet) {
      this.candleGroup.visible = false;
      this.burnerGroup.visible = false;
      this.dropletWires.visible = true;
      this.flameLight.position.set(0, 0.95, 0);
      if (this.embers) this.embers.visible = false;
    } else { // circle (industrial jet burner)
      this.candleGroup.visible = false;
      this.burnerGroup.visible = true;
      this.dropletWires.visible = false;
      this.flameLight.position.set(0, 0.38, 0);
      if (this.embers) this.embers.visible = (gravity > 0.5);
    }

    // Dynamic Flame Light Color (Rich amber for Earth candle, deep blue for Zero-G, white-blue for hyperoxic)
    const o2 = this.config.ambientOxygen;

    if (o2 < 0.09) {
      // Extinguished / smoldering wick ember
      this.flameLight.color.setRGB(0.5, 0.08, 0.0);
      this.flameLight.intensity = 0.15;
      if (this.tipEmberMat) this.tipEmberMat.color.setRGB(1.0, 0.18, 0.0);
    } else if (Math.abs(gravity) < 0.2) {
      // Microgravity blue radical dome
      this.flameLight.color.setRGB(0.15, 0.55, 1.0);
      this.flameLight.intensity = 1.8;
      if (this.tipEmberMat) this.tipEmberMat.color.setRGB(0.15, 0.04, 0.0);
    } else if (o2 > 0.45) {
      // Hyperoxic blue-white intense flame
      this.flameLight.color.setRGB(0.85, 0.95, 1.0);
      this.flameLight.intensity = 3.6;
      if (this.tipEmberMat) this.tipEmberMat.color.setRGB(0.2, 0.05, 0.0);
    } else {
      // Standard luminous warm candle amber
      const flicker = 0.95 + 0.06 * Math.sin(time * 14.0) + 0.03 * Math.cos(time * 22.0);
      this.flameLight.color.setRGB(1.0, 0.60, 0.15);
      this.flameLight.intensity = 2.6 * flicker;
      if (this.tipEmberMat) this.tipEmberMat.color.setRGB(0.2, 0.05, 0.0);
    }

    // Update Rising Embers (Only active for circular jet burner)
    if (this.embers && this.emberVelocities && this.embers.visible) {
      const pos = this.embers.geometry.attributes.position.array;
      const count = this.emberVelocities.length;
      const gRatio = Math.max(0.0, gravity / 9.81);

      for (let i = 0; i < count; i++) {
        const vel = this.emberVelocities[i];
        vel.life += 0.016;

        // Upward buoyant movement
        pos[i * 3 + 1] += vel.vy * gRatio * 0.018;
        pos[i * 3 + 0] += Math.sin(time * 4.0 + i) * 0.003;
        pos[i * 3 + 2] += Math.cos(time * 4.0 + i) * 0.003;

        // Reset ember when it rises out of the flame
        if (pos[i * 3 + 1] > 1.8 || vel.life > 1.0 || gRatio < 0.1) {
          pos[i * 3 + 0] = (Math.random() - 0.5) * 0.14;
          pos[i * 3 + 1] = 0.25 + Math.random() * 0.1;
          pos[i * 3 + 2] = (Math.random() - 0.5) * 0.14;
          vel.life = 0.0;
        }
      }
      this.embers.geometry.attributes.position.needsUpdate = true;
    }
  }
}
