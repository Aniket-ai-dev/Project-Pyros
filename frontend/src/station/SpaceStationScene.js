/**
 * SpaceStationScene.js
 * Photorealistic 3D International Space Station (ISS) Laboratory Module.
 * Inspired by NASA Destiny, ESA Columbus, and the Microgravity Science Glovebox (MSG).
 * 
 * Features:
 * - Octagonal pressurized cylinder with 45° corner utility standoffs.
 * - International Standard Payload Racks (ISPR) with modular lockers, latches, switches, and LEDs.
 * - Microgravity Science Glovebox (MSG) bay with glass viewport, glove ports, and articulation arm.
 * - Non-slip aluminum diamond tread floor with Foot Restraint (WIF) guide tracks and foot loops.
 * - Quilted Beta-cloth thermal insulation ceiling with storage cargo bags (CTBs) and wire trays.
 * - Iconic blue anodized crew handrails bolted along rack corners.
 * - Pressure bulkhead rings and circular hatchways at both ends.
 * - High-resolution procedural PBR canvas textures (rivets, caution decals, velcro patches).
 * - Multi-regime laboratory lighting: Nominal Daylight, Crew Sleep, and Emergency Warning.
 */

import * as THREE from 'three';

export class SpaceStationScene {
  constructor(scene) {
    this.scene = scene;
    this.rootGroup = new THREE.Group();
    this.scene.add(this.rootGroup);

    // Lighting fixtures & groups
    this.lights = [];
    this.ambientLight = null;
    this.gloveboxLight = null;
    this.hatchGlow = null;
    this.ledMaterials = [];
    this.stripLightMaterials = [];
    this.currentLightingMode = 'nominal';
    this.baseLightingMode = 'nominal';

    // Interactive / animated elements
    this.animatedItems = [];
    this.floatingItems = [];      // Zero-g floating science gear (tablet, checklist)

    // Active Ventilation & Life Support (ECLSS)
    this.activeLouvers = [];      // Array of Mesh objects (slats)
    this.activeFans = [];         // Array of Group objects (fan rotors)
    this.activeVents = [];        // Vent metadata
    this.ventLedMaterials = [];   // Status LED materials for color shifting
    this.oxygenParticles = null;  // THREE.Points
    this.oxygenParticleData = []; // Particle dynamics state
    this.streamlineMeshes = [];   // Aerodynamic flowing airflow streamlines
    this.oxygenLevel = 21.05;     // Percentage O2 (0 - 100)
    this.targetLouverAngle = 0.42; // Radian tilt (~24 deg nominal)
    this.currentLouverAngle = 0.42;
    this.targetFanSpeed = 18.0;   // Rotational speed (rad/sec)
    this.currentFanSpeed = 18.0;
    this.vaporMaterial = null;
    this.laptopScreenCanvas = null;
    this.laptopScreenCtx = null;
    this.laptopScreenTexture = null;
    this.gloveboxExperimentLight = null;

    // Microgravity Science Glovebox (MSG) & Room Candle Combustion Physics
    this.candleInstances = [];
    this.candleGroup = null;
    this.roomCandleGroup = null;
    this.candleFlameGroup = null;
    this.innerFlameMesh = null;
    this.midFlameMesh = null;
    this.outerFlameMesh = null;
    this.innerFlameMat = null;
    this.midFlameMat = null;
    this.outerFlameMat = null;
    this.candleFlameLight = null;
    this.candleEmberTip = null;
    this.flamePhysicsParams = {
      gravity_g: 0.0,
      o2_pct: 21.0,
      pressure_psi: 14.7,
      buoyancy: 0.0,
      convectionVel: 0.0,
      o2Factor: 1.0,
      flameHeightMm: 22.0
    };

    // Real Physics Interactive Daily Objects
    this.physicsObjects = [];
    this.currentGravity = 0.0; // Starts in ISS Zero-G (0.00g)

    this.init();
  }

  init() {
    this.generateTextures();
    this.buildLighting();
    this.buildStructuralHull();
    this.buildFloorAssembly();
    this.buildCeilingAssembly();
    this.buildStandoffUtilityChases();
    this.buildPayloadRacks();
    this.buildMicrogravityScienceGlovebox();
    this.buildBulkheadAndHatches();
    this.buildCrewHandrails();
    this.buildCargoTransferBags();
    this.buildLaptopsAndScienceGear();
    this.buildPhysicsObjects();
    this.buildRoomCandleWorkstation();
  }

  // =========================================================================
  // 1. PROCEDURAL PBR TEXTURE GENERATION
  // =========================================================================
  generateTextures() {
    this.textures = {
      rack: this.createRackTexture(),
      rackBump: this.createRackBumpMap(),
      diamondPlate: this.createDiamondPlateTexture(),
      quiltedCeiling: this.createQuiltedCeilingTexture(),
      hazardStripe: this.createHazardStripeTexture(),
      hatchDoor: this.createHatchDoorTexture(),
      ctb: this.createCTBTexture(),
      breadboard: this.createBreadboardTexture(),
      glovebox: this.createGloveboxTexture(),
      cameraLabel: this.createCameraLabelTexture()
    };
  }

  createRackTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Base off-white aerospace painted aluminum
    ctx.fillStyle = '#e2e6eb';
    ctx.fillRect(0, 0, 1024, 1024);

    // Subtle brushed metal gradient
    const grad = ctx.createLinearGradient(0, 0, 1024, 1024);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
    grad.addColorStop(0.5, 'rgba(210, 220, 230, 0.1)');
    grad.addColorStop(1, 'rgba(180, 195, 210, 0.35)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 1024);

    // Rack Sub-panel Divisions (Standard 19-inch sub-rack bays)
    ctx.strokeStyle = '#8a94a0';
    ctx.lineWidth = 2.5;

    const rowCount = 6;
    const colCount = 2;
    const rowH = 1024 / rowCount;
    const colW = 1024 / colCount;

    for (let r = 0; r < rowCount; r++) {
      for (let c = 0; c < colCount; c++) {
        const x = c * colW + 8;
        const y = r * rowH + 8;
        const w = colW - 16;
        const h = rowH - 16;

        // Sub-panel bevel
        ctx.fillStyle = (r % 2 === 0) ? '#e9edf2' : '#dfe4ea';
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);

        // Panel mounting hex bolts along perimeter
        ctx.fillStyle = '#556070';
        const boltSpacing = 36;
        for (let bx = x + 10; bx < x + w; bx += boltSpacing) {
          ctx.beginPath();
          ctx.arc(bx, y + 6, 2.2, 0, Math.PI * 2);
          ctx.arc(bx, y + h - 6, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }

        // Quarter-turn mechanical latches (2 per panel)
        ctx.fillStyle = '#404a56';
        ctx.fillRect(x + 14, y + h * 0.5 - 6, 18, 12);
        ctx.fillRect(x + w - 32, y + h * 0.5 - 6, 18, 12);
        ctx.fillStyle = '#a0acba';
        ctx.fillRect(x + 18, y + h * 0.5 - 2, 10, 4);
        ctx.fillRect(x + w - 28, y + h * 0.5 - 2, 10, 4);

        // Velcro mounting squares (black loop fabric)
        ctx.fillStyle = '#1e242c';
        ctx.fillRect(x + w * 0.5 - 28, y + 16, 56, 18);

        // Technical stencil labels
        ctx.fillStyle = '#2c3642';
        ctx.font = 'bold 11px monospace';
        ctx.fillText(`ISPR-BAY ${r + 1}0${c + 1}`, x + 24, y + 26);

        ctx.fillStyle = '#5c6878';
        ctx.font = '9px monospace';
        ctx.fillText(`PWR: 28V DC // DATA: MIL-STD-1553B`, x + 24, y + h - 14);

        // Circuit breaker toggle dots
        for (let cb = 0; cb < 5; cb++) {
          ctx.fillStyle = (cb === 1 && r === 2) ? '#ff4422' : '#22bb55';
          ctx.beginPath();
          ctx.arc(x + w - 50 + cb * 8, y + 24, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // NASA & ESA Equipment Identification Placards
    ctx.fillStyle = '#0b3d91'; // NASA Blue
    ctx.fillRect(40, 40, 110, 32);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('NASA', 52, 62);

    ctx.fillStyle = '#e03a3e'; // Meatball red swoosh
    ctx.beginPath();
    ctx.arc(120, 56, 8, 0, Math.PI * 2);
    ctx.fill();

    // Barcodes & Calibration Stickers
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(800, 40, 140, 40);
    ctx.fillStyle = '#111111';
    for (let bc = 0; bc < 30; bc++) {
      const bw = (bc % 3 === 0) ? 3 : 1.5;
      ctx.fillRect(810 + bc * 4, 46, bw, 22);
    }
    ctx.font = '8px monospace';
    ctx.fillText('SN: ISS-ISPR-08842-A', 814, 76);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  createRackBumpMap() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 512, 512);

    // Embossed seams
    ctx.strokeStyle = '#202020';
    ctx.lineWidth = 3;
    ctx.strokeRect(4, 4, 504, 504);
    ctx.strokeRect(4, 256, 504, 2);

    // Fasteners
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 512; i += 32) {
      ctx.beginPath();
      ctx.arc(i + 8, 8, 2, 0, Math.PI * 2);
      ctx.arc(i + 8, 504, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  createDiamondPlateTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Milled Aluminum base
    ctx.fillStyle = '#65707c';
    ctx.fillRect(0, 0, 256, 256);

    // Grid panels
    ctx.strokeStyle = '#424a54';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, 256, 256);

    // Diamond tread embossing
    const drawTread = (cx, cy, angle) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);

      // Shadow
      ctx.fillStyle = '#3a424a';
      ctx.beginPath();
      ctx.ellipse(1, 1, 9, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Highlight
      ctx.fillStyle = '#9aa7b5';
      ctx.beginPath();
      ctx.ellipse(0, 0, 8.5, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const step = 32;
    for (let y = 8; y < 256; y += step) {
      for (let x = 8; x < 256; x += step) {
        drawTread(x, y, Math.PI / 4);
        drawTread(x + 16, y + 16, -Math.PI / 4);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 16);
    return texture;
  }

  createQuiltedCeilingTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // White Beta-Cloth MLI blanket
    ctx.fillStyle = '#eceff2';
    ctx.fillRect(0, 0, 512, 512);

    // Quilted grid pattern with stitch shadows
    const pad = 64;
    for (let y = 0; y < 512; y += pad) {
      for (let x = 0; x < 512; x += pad) {
        // Quilted pillow bulge gradient
        const radGrad = ctx.createRadialGradient(x + 32, y + 32, 2, x + 32, y + 32, 42);
        radGrad.addColorStop(0, '#ffffff');
        radGrad.addColorStop(0.7, '#e4e8ed');
        radGrad.addColorStop(1, '#c8d0da');

        ctx.fillStyle = radGrad;
        ctx.fillRect(x + 2, y + 2, pad - 4, pad - 4);

        // Stitched seams
        ctx.strokeStyle = '#a4b0be';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, pad, pad);

        // Fastener button at corner
        ctx.fillStyle = '#606a75';
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Orange/Gold Kapton tape repair strips
    ctx.fillStyle = 'rgba(215, 120, 20, 0.75)';
    ctx.fillRect(110, 80, 75, 18);
    ctx.fillRect(320, 260, 95, 20);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 8);
    return texture;
  }

  createHazardStripeTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffb800'; // Safety Yellow
    ctx.fillRect(0, 0, 256, 64);

    ctx.fillStyle = '#14171c'; // Black hazard stripes
    const stripeW = 24;
    for (let x = -64; x < 320; x += stripeW * 2) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + stripeW, 0);
      ctx.lineTo(x + stripeW - 24, 64);
      ctx.lineTo(x - 24, 64);
      ctx.closePath();
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  createHatchDoorTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Metallic Hatch Face
    ctx.fillStyle = '#cbd3db';
    ctx.fillRect(0, 0, 1024, 1024);

    // Circular outer frame
    ctx.beginPath();
    ctx.arc(512, 512, 450, 0, Math.PI * 2);
    ctx.fillStyle = '#b8c2cc';
    ctx.fill();
    ctx.strokeStyle = '#4d5763';
    ctx.lineWidth = 14;
    ctx.stroke();

    // Inner hatch ring
    ctx.beginPath();
    ctx.arc(512, 512, 380, 0, Math.PI * 2);
    ctx.fillStyle = '#dde2e8';
    ctx.fill();
    ctx.strokeStyle = '#606c7a';
    ctx.lineWidth = 8;
    ctx.stroke();

    // Central Glass Viewing Port
    ctx.beginPath();
    ctx.arc(512, 512, 110, 0, Math.PI * 2);
    ctx.fillStyle = '#081220';
    ctx.fill();
    ctx.strokeStyle = '#2c3642';
    ctx.lineWidth = 12;
    ctx.stroke();

    // Glass glare reflection
    ctx.beginPath();
    ctx.arc(512, 512, 98, Math.PI * 1.1, Math.PI * 1.6);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 8;
    ctx.stroke();

    // 8 Mechanical Hatch Locking Dogs
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const x = 512 + Math.cos(angle) * 350;
      const y = 512 + Math.sin(angle) * 350;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle + Math.PI / 2);
      ctx.fillStyle = '#323c46';
      ctx.fillRect(-18, -12, 36, 24);
      ctx.fillStyle = '#ffaa00';
      ctx.fillRect(-12, -4, 24, 8);
      ctx.restore();
    }

    // Manual Rotary Actuator Handwheel (Center)
    ctx.strokeStyle = '#cc3322'; // High visibility red
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(512, 512, 190, 0, Math.PI * 2);
    ctx.stroke();

    // 3 Spokes on wheel
    for (let s = 0; s < 3; s++) {
      const sa = (s / 3) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(512 + Math.cos(sa) * 115, 512 + Math.sin(sa) * 115);
      ctx.lineTo(512 + Math.cos(sa) * 190, 512 + Math.sin(sa) * 190);
      ctx.stroke();
    }

    // Hatch Pressure Equalization Warning Placard
    ctx.fillStyle = '#ffaa00';
    ctx.fillRect(400, 240, 224, 42);
    ctx.fillStyle = '#111111';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('CAUTION: EQUALIZE PRESSURE', 412, 266);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  createCTBTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Nomex canvas beige/off-white fabric
    ctx.fillStyle = '#dde2e8';
    ctx.fillRect(0, 0, 512, 512);

    // Fabric weave texture
    ctx.fillStyle = 'rgba(210, 218, 226, 0.4)';
    for (let y = 0; y < 512; y += 4) {
      ctx.fillRect(0, y, 512, 1.5);
    }
    for (let x = 0; x < 512; x += 4) {
      ctx.fillRect(x, 0, 1.5, 512);
    }

    // Heavy stitched perimeter reinforcement
    ctx.strokeStyle = '#a0aec0';
    ctx.lineWidth = 4;
    ctx.strokeRect(16, 16, 480, 480);

    // Blue NASA Webbing handles across top and sides
    ctx.fillStyle = '#0055bb';
    ctx.fillRect(40, 32, 432, 28);
    ctx.fillRect(40, 452, 432, 28);
    ctx.fillRect(32, 40, 28, 432);
    ctx.fillRect(452, 40, 28, 432);

    // Black velcro patch
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(130, 140, 252, 60);

    // Inventory label placard (Clear PVC window with barcode)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(110, 240, 292, 160);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.strokeRect(110, 240, 292, 160);

    // NASA Meatball and Stencil
    ctx.fillStyle = '#0b3d91';
    ctx.fillRect(124, 254, 70, 24);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('NASA', 138, 271);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('CARGO TRANSFER BAG', 124, 305);
    ctx.font = '11px monospace';
    ctx.fillText('CTB-HALF // SCI-EXP-0884', 124, 325);
    ctx.fillText('LOC: COLUMBUS / DESTINY', 124, 342);

    // Barcode stripes
    for (let bc = 0; bc < 36; bc++) {
      const bw = (bc % 4 === 0) ? 3 : 1.5;
      ctx.fillRect(124 + bc * 7, 355, bw, 28);
    }

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  createBreadboardTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Satin brushed aluminum optical breadboard plate
    ctx.fillStyle = '#a8b4c2';
    ctx.fillRect(0, 0, 512, 512);

    // Metric 25mm tapped grid lines
    ctx.strokeStyle = '#718096';
    ctx.lineWidth = 1;

    const step = 32;
    for (let i = 0; i <= 512; i += step) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
    }

    // M6 tapped threaded holes at every intersection
    for (let y = step; y < 512; y += step) {
      for (let x = step; x < 512; x += step) {
        // Chamfer outer ring
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.arc(x, y, 5.5, 0, Math.PI * 2);
        ctx.fill();

        // Dark tapped hole
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Inner thread shadow
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(x - 0.5, y - 0.5, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Alphanumeric coordinate markers along borders
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 9px monospace';
    const letters = 'ABCDEFGHJKLMNPQR';
    for (let c = 0; c < 15; c++) {
      ctx.fillText(letters[c], (c + 1) * step - 3, 14);
      ctx.fillText(String(c + 1), 6, (c + 1) * step + 3);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  createGloveboxTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Base light aerospace anodized aluminum finish
    ctx.fillStyle = '#dbe2ea';
    ctx.fillRect(0, 0, 1024, 1024);

    // Subtle brushed metallic gradient
    const grad = ctx.createLinearGradient(0, 0, 1024, 1024);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
    grad.addColorStop(0.5, 'rgba(215, 225, 235, 0.15)');
    grad.addColorStop(1, 'rgba(190, 205, 220, 0.4)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 1024);

    // Top Mission Identification Header Bar
    ctx.fillStyle = '#0b3d91'; // NASA Deep Blue
    ctx.fillRect(30, 30, 964, 52);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('MICROGRAVITY SCIENCE GLOVEBOX (MSG)', 54, 65);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('NASA / ESA JOINT FACILITY // CLASS 100 ENVIRONMENT', 560, 64);

    // Sub-rack bay frames (Lower drawers and utility bay)
    ctx.strokeStyle = '#7a8898';
    ctx.lineWidth = 3;

    // Drawer 1
    ctx.fillStyle = '#e8edf3';
    ctx.fillRect(40, 110, 460, 250);
    ctx.strokeRect(40, 110, 460, 250);

    // Drawer 2
    ctx.fillRect(524, 110, 460, 250);
    ctx.strokeRect(524, 110, 460, 250);

    // Gas Delivery Utility Bay
    ctx.fillStyle = '#e0e6ee';
    ctx.fillRect(40, 390, 944, 280);
    ctx.strokeRect(40, 390, 944, 280);

    // Gas QD Panel Placards
    const gases = [
      { name: 'GN2 (NITROGEN)', p: '101.3 kPa', color: '#8b5cf6', x: 80 },
      { name: 'O2 (OXYGEN)', p: 'HIGH PURITY', color: '#10b981', x: 310 },
      { name: 'CO2 (SUPPRESSION)', p: 'QUENCH SYS', color: '#64748b', x: 540 },
      { name: 'VAC (EVACUATION)', p: '-101 kPa', color: '#f59e0b', x: 770 }
    ];

    gases.forEach(g => {
      // Panel box
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(g.x, 420, 190, 220);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(g.x, 420, 190, 220);

      // Color banner
      ctx.fillStyle = g.color;
      ctx.fillRect(g.x, 420, 190, 26);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(g.name, g.x + 12, 438);

      // Port circular bezel
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(g.x + 95, 520, 36, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(g.x + 95, 520, 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#334155';
      ctx.font = '10px monospace';
      ctx.fillText(g.p, g.x + 36, 610);
    });

    // Lower Airflow / HEPA Recirculation Intake Louvers
    ctx.fillStyle = '#1a222c';
    ctx.fillRect(40, 700, 944, 280);

    ctx.fillStyle = '#334155';
    for (let l = 0; l < 18; l++) {
      ctx.fillRect(60, 720 + l * 14, 904, 7);
    }

    // Safety and Warning Placards
    ctx.fillStyle = '#ffb800';
    ctx.fillRect(60, 940, 280, 32);
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('WARNING: SEAL INTEGRITY VERIFIED', 72, 961);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  createCameraLabelTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, 256, 64);

    // Stencil borders
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(4, 4, 248, 56);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('ZOOM LENS', 20, 32);

    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('16-100mm 1:2.0 // NASA HD-CAM', 20, 48);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  createCosmicStarfieldTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Deep space pitch black void
    ctx.fillStyle = '#010308';
    ctx.fillRect(0, 0, 1024, 1024);

    // Cosmic Nebula Dust Clouds (Ethereal multi-layered celestial gas)
    // 1. Deep Violet / Purple Nebula
    const neb1 = ctx.createRadialGradient(380, 420, 30, 380, 420, 520);
    neb1.addColorStop(0.0, 'rgba(126, 34, 206, 0.32)');
    neb1.addColorStop(0.4, 'rgba(88, 28, 135, 0.18)');
    neb1.addColorStop(0.8, 'rgba(30, 10, 60, 0.06)');
    neb1.addColorStop(1.0, 'transparent');
    ctx.fillStyle = neb1;
    ctx.fillRect(0, 0, 1024, 1024);

    // 2. Sapphire / Cyan Cosmic Gas Ribbon
    const neb2 = ctx.createRadialGradient(680, 320, 20, 680, 320, 480);
    neb2.addColorStop(0.0, 'rgba(6, 182, 212, 0.28)');
    neb2.addColorStop(0.35, 'rgba(14, 116, 144, 0.16)');
    neb2.addColorStop(0.7, 'rgba(8, 47, 73, 0.05)');
    neb2.addColorStop(1.0, 'transparent');
    ctx.fillStyle = neb2;
    ctx.fillRect(0, 0, 1024, 1024);

    // 3. Magenta / Rose Starburst Dust
    const neb3 = ctx.createRadialGradient(480, 240, 10, 480, 240, 340);
    neb3.addColorStop(0.0, 'rgba(236, 72, 153, 0.22)');
    neb3.addColorStop(0.5, 'rgba(157, 23, 77, 0.10)');
    neb3.addColorStop(1.0, 'transparent');
    ctx.fillStyle = neb3;
    ctx.fillRect(0, 0, 1024, 1024);

    // Dense Field of 1,200 Distant Stars (Magnitudes 3-6)
    let seed = 42;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    const starColors = ['#ffffff', '#f8fafc', '#e0f2fe', '#bae6fd', '#fef3c7', '#fed7aa'];
    for (let i = 0; i < 1200; i++) {
      const sx = rnd() * 1024;
      const sy = rnd() * 1024;
      const size = 0.5 + rnd() * 1.6;
      const alpha = 0.35 + rnd() * 0.65;
      const col = starColors[Math.floor(rnd() * starColors.length)];

      ctx.fillStyle = col;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(sx, sy, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // 25 Bright Foreground Stars with Soft Halos & 4-Point Diffraction Spikes
    for (let b = 0; b < 25; b++) {
      const bx = 80 + rnd() * 864;
      const by = 60 + rnd() * 640;
      const bRad = 2.0 + rnd() * 2.2;

      // Soft stellar aura
      const aura = ctx.createRadialGradient(bx, by, 0.5, bx, by, bRad * 7);
      aura.addColorStop(0.0, 'rgba(255, 255, 255, 0.95)');
      aura.addColorStop(0.2, 'rgba(186, 230, 253, 0.55)');
      aura.addColorStop(0.6, 'rgba(56, 189, 248, 0.15)');
      aura.addColorStop(1.0, 'transparent');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(bx, by, bRad * 7, 0, Math.PI * 2);
      ctx.fill();

      // Sharp star core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(bx, by, bRad, 0, Math.PI * 2);
      ctx.fill();

      // 4-point astrophotography diffraction spikes
      const spikeLen = bRad * 10;
      ctx.strokeStyle = 'rgba(224, 242, 254, 0.65)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(bx - spikeLen, by);
      ctx.lineTo(bx + spikeLen, by);
      ctx.moveTo(bx, by - spikeLen);
      ctx.lineTo(bx, by + spikeLen);
      ctx.stroke();
    }

    // Majestic Planet Earth Atmospheric Curve along bottom
    const earthGrad = ctx.createRadialGradient(512, 1260, 420, 512, 1260, 780);
    earthGrad.addColorStop(0.0, '#ffffff');
    earthGrad.addColorStop(0.08, '#7dd3fc');
    earthGrad.addColorStop(0.25, '#0284c7');
    earthGrad.addColorStop(0.55, '#0c4a6e');
    earthGrad.addColorStop(0.82, '#030712');
    earthGrad.addColorStop(1.0, 'transparent');
    ctx.fillStyle = earthGrad;
    ctx.fillRect(0, 580, 1024, 444);

    // City lights on night side of Earth
    ctx.fillStyle = '#fef08a';
    for (let c = 0; c < 120; c++) {
      const cx = 120 + rnd() * 784;
      const cy = 760 + rnd() * 220;
      ctx.globalAlpha = 0.25 + rnd() * 0.55;
      ctx.beginPath();
      ctx.arc(cx, cy, 1.2 + rnd() * 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  createAirVaporTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Multi-lobed soft wispy smoke/air puff
    ctx.clearRect(0, 0, 128, 128);

    // Center primary puff
    const centerGrad = ctx.createRadialGradient(64, 64, 4, 64, 64, 58);
    centerGrad.addColorStop(0.0, 'rgba(235, 244, 255, 0.45)');
    centerGrad.addColorStop(0.35, 'rgba(215, 230, 248, 0.25)');
    centerGrad.addColorStop(0.70, 'rgba(195, 215, 238, 0.08)');
    centerGrad.addColorStop(1.0, 'rgba(180, 205, 230, 0.0)');
    ctx.fillStyle = centerGrad;
    ctx.beginPath();
    ctx.arc(64, 64, 60, 0, Math.PI * 2);
    ctx.fill();

    // 5 overlapping organic turbulent lobes for wispy, non-circular smoke look
    const lobes = [
      { x: 50, y: 52, r: 38, alpha: 0.28 },
      { x: 76, y: 54, r: 36, alpha: 0.26 },
      { x: 58, y: 76, r: 40, alpha: 0.24 },
      { x: 74, y: 72, r: 34, alpha: 0.22 },
      { x: 62, y: 44, r: 32, alpha: 0.25 }
    ];

    lobes.forEach(l => {
      const g = ctx.createRadialGradient(l.x, l.y, 2, l.x, l.y, l.r);
      g.addColorStop(0.0, `rgba(240, 248, 255, ${l.alpha})`);
      g.addColorStop(0.5, `rgba(210, 228, 245, ${l.alpha * 0.45})`);
      g.addColorStop(1.0, 'rgba(190, 215, 240, 0.0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(l.x, l.y, l.r, 0, Math.PI * 2);
      ctx.fill();
    });

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  createStreamlineTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 64, 256);

    // Vertical laminar airflow streamer trails
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0.0, 'rgba(235, 245, 255, 0.0)');
    grad.addColorStop(0.15, 'rgba(235, 245, 255, 0.55)');
    grad.addColorStop(0.55, 'rgba(215, 235, 255, 0.32)');
    grad.addColorStop(0.85, 'rgba(200, 225, 250, 0.12)');
    grad.addColorStop(1.0, 'rgba(190, 215, 245, 0.0)');

    ctx.fillStyle = grad;
    // 3 parallel wispy streak lanes
    [16, 32, 48].forEach(cx => {
      const streakGrad = ctx.createLinearGradient(cx - 10, 0, cx + 10, 0);
      streakGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.0)');
      streakGrad.addColorStop(0.5, 'rgba(240, 248, 255, 0.45)');
      streakGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
      ctx.fillStyle = streakGrad;
      ctx.fillRect(cx - 10, 0, 20, 256);
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  // =========================================================================
  // 2. LIGHTING & ENVIRONMENT
  // =========================================================================
  buildLighting() {
    // Ambient soft fill (reflects from bright white rack walls and quilted ceilings)
    this.ambientLight = new THREE.AmbientLight(0xedf4fc, 1.40);
    this.scene.add(this.ambientLight);

    // 4 Longitudinal Angled Overhead Fixture Rows (The core ISS light source - optimized for 60fps)
    const zPositions = [-2.6, 2.6];

    zPositions.forEach(z => {
      // Upper Left 45° Fixture Point Light (Consolidated count for silky-smooth 60fps)
      const pLightL = new THREE.PointLight(0xf2f7ff, 2.2, 8.5, 1.2);
      pLightL.position.set(-1.35, 1.35, z);
      this.rootGroup.add(pLightL);
      this.lights.push(pLightL);

      // Upper Right 45° Fixture Point Light (Consolidated count for silky-smooth 60fps)
      const pLightR = new THREE.PointLight(0xf2f7ff, 2.2, 8.5, 1.2);
      pLightR.position.set(1.35, 1.35, z);
      this.rootGroup.add(pLightR);
      this.lights.push(pLightR);
    });

    // Directional downward fill
    const dirDown = new THREE.DirectionalLight(0xf5f8fc, 1.0);
    dirDown.position.set(0, 3, 0);
    this.scene.add(dirDown);
    this.lights.push(dirDown);

    // Glovebox internal fluorescent blue/white inspection lamp
    this.gloveboxLight = new THREE.PointLight(0xdff0ff, 2.4, 2.5, 1.2);
    this.gloveboxLight.position.set(-1.80, 0.45, -0.80);
    this.rootGroup.add(this.gloveboxLight);

    // Space Observation Window celestial blue ambient glow
    this.hatchGlow = new THREE.PointLight(0x60a5fa, 1.2, 5.0, 1.4);
    this.hatchGlow.position.set(0, 0, 5.7);
    this.rootGroup.add(this.hatchGlow);
  }

  // =========================================================================
  // 3. STRUCTURAL HULL & MODULE CORRIDOR (Octagonal Cylindrical)
  // =========================================================================
  buildStructuralHull() {
    // Length: 12.0m, Width: 4.2m, Height: 3.8m
    const moduleLength = 12.0;

    // 1. Solid Outer Pressure Shell Cylinder (Encloses entire module)
    const shellGeo = new THREE.CylinderGeometry(2.15, 2.15, moduleLength, 24, 1, true);
    const shellMat = new THREE.MeshStandardMaterial({
      color: 0xd0d8e2,
      roughness: 0.45,
      metalness: 0.35,
      side: THREE.DoubleSide
    });
    const shell = new THREE.Mesh(shellGeo, shellMat);
    shell.rotation.x = Math.PI / 2;
    this.rootGroup.add(shell);

    // Continuous Solid Port & Starboard Cabin Hull Liner Walls (Guarantees ZERO black void behind racks)
    const wallLinerMat = new THREE.MeshStandardMaterial({
      color: 0xdce2ea,
      roughness: 0.38,
      metalness: 0.32,
      side: THREE.DoubleSide
    });

    // Port Wall Liner (Behind racks at X = -2.06m)
    const portLiner = new THREE.Mesh(new THREE.PlaneGeometry(moduleLength, 2.8), wallLinerMat);
    portLiner.rotation.y = Math.PI / 2;
    portLiner.position.set(-2.06, 0, 0);
    this.rootGroup.add(portLiner);

    // Starboard Wall Liner (Behind racks at X = +2.06m)
    const stbdLiner = new THREE.Mesh(new THREE.PlaneGeometry(moduleLength, 2.8), wallLinerMat);
    stbdLiner.rotation.y = -Math.PI / 2;
    stbdLiner.position.set(2.06, 0, 0);
    this.rootGroup.add(stbdLiner);

    // 2. Structural Outer Frame Ribs (Instanced for batching)
    const railMat = new THREE.MeshStandardMaterial({
      color: 0x3d4752,
      roughness: 0.35,
      metalness: 0.85
    });

    const ribCount = 13;
    const ringGeo = new THREE.RingGeometry(2.05, 2.18, 8);
    const ringInst = new THREE.InstancedMesh(ringGeo, railMat, ribCount);
    const dummyRing = new THREE.Object3D();
    dummyRing.rotation.z = Math.PI / 8; // Align flat floor

    for (let i = 0; i < ribCount; i++) {
      const z = -moduleLength * 0.5 + (i / (ribCount - 1)) * moduleLength;
      dummyRing.position.set(0, 0, z);
      dummyRing.updateMatrix();
      ringInst.setMatrixAt(i, dummyRing.matrix);
    }
    ringInst.instanceMatrix.needsUpdate = true;
    this.rootGroup.add(ringInst);
  }

  // =========================================================================
  // 4. FLOOR ASSEMBLY (Diamond Plate Aluminum & Foot Restraints)
  // =========================================================================
  buildFloorAssembly() {
    const floorWidth = 1.95;
    const floorLength = 11.8;
    const floorY = -1.52;

    // 1. Primary Aluminum Diamond Treadway
    const floorGeo = new THREE.PlaneGeometry(floorWidth, floorLength);
    const floorMat = new THREE.MeshStandardMaterial({
      map: this.textures.diamondPlate,
      roughness: 0.30,
      metalness: 0.75
    });

    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, floorY, 0);
    this.rootGroup.add(floor);

    // 2. Central Foot Restraint Guide Rail (WIF - Work Interface Foot Restraint Track)
    const trackGeo = new THREE.BoxGeometry(0.14, 0.035, floorLength);
    const trackMat = new THREE.MeshStandardMaterial({
      color: 0x1f2730,
      roughness: 0.25,
      metalness: 0.90
    });
    const track = new THREE.Mesh(trackGeo, trackMat);
    track.position.set(0, floorY + 0.02, 0);
    this.rootGroup.add(track);

    // Socket holes along the foot track (Instanced)
    const socketMat = new THREE.MeshBasicMaterial({ color: 0x0a0e14 });
    const socketGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.04, 12);
    const socketZList = [];
    for (let z = -5.0; z <= 5.0; z += 0.8) socketZList.push(z);

    const socketInst = new THREE.InstancedMesh(socketGeo, socketMat, socketZList.length);
    const dummySocket = new THREE.Object3D();
    socketZList.forEach((z, i) => {
      dummySocket.position.set(0, floorY + 0.03, z);
      dummySocket.updateMatrix();
      socketInst.setMatrixAt(i, dummySocket.matrix);
    });
    socketInst.instanceMatrix.needsUpdate = true;
    this.rootGroup.add(socketInst);

    // 3. Crew Foot Restraints (Pair of adjustable blue nylon foot anchors)
    const loopMat = new THREE.MeshStandardMaterial({
      color: 0x0055bb,
      roughness: 0.6,
      metalness: 0.2
    });
    const loopGeo = new THREE.TorusGeometry(0.07, 0.018, 12, 18, Math.PI);

    const footLoop1 = new THREE.Mesh(loopGeo, loopMat);
    footLoop1.rotation.x = -Math.PI / 2;
    footLoop1.position.set(-0.16, floorY + 0.05, 0.2);
    this.rootGroup.add(footLoop1);

    const footLoop2 = new THREE.Mesh(loopGeo, loopMat);
    footLoop2.rotation.x = -Math.PI / 2;
    footLoop2.position.set(0.16, floorY + 0.05, 0.2);
    this.rootGroup.add(footLoop2);

    // 4. Subfloor Translucent Acrylic Inspection Windows (Showing avionics below)
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x88bbdd,
      transmission: 0.70,
      roughness: 0.15,
      ior: 1.45,
      thickness: 0.08
    });
    const panelGeo = new THREE.PlaneGeometry(0.70, 1.2);

    for (let z of [-2.4, 2.4]) {
      const glass = new THREE.Mesh(panelGeo, glassMat);
      glass.rotation.x = -Math.PI / 2;
      glass.position.set(-0.45, floorY + 0.005, z);
      this.rootGroup.add(glass);

      // Yellow caution border frame
      const borderGeo = new THREE.EdgesGeometry(panelGeo);
      const borderMat = new THREE.LineBasicMaterial({ color: 0xffaa00 });
      const border = new THREE.LineSegments(borderGeo, borderMat);
      border.rotation.x = -Math.PI / 2;
      border.position.set(-0.45, floorY + 0.008, z);
      this.rootGroup.add(border);
    }
  }

  // =========================================================================
  // 5. CEILING ASSEMBLY (Quilted Beta-Cloth & Longitudinal Light Strips)
  // =========================================================================
  buildCeilingAssembly() {
    const ceilWidth = 1.95;
    const ceilLength = 11.8;
    const ceilY = 1.55;

    // 1. Quilted Beta-Cloth Thermal Blanket Ceiling
    const ceilGeo = new THREE.PlaneGeometry(ceilWidth, ceilLength);
    const ceilMat = new THREE.MeshStandardMaterial({
      map: this.textures.quiltedCeiling,
      roughness: 0.75,
      metalness: 0.08
    });
    const ceiling = new THREE.Mesh(ceilGeo, ceilMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, ceilY, 0);
    this.rootGroup.add(ceiling);

    // 2. Active Motorized Ventilation Diffusers & ECLSS Injection System
    this.buildActiveVentilationSystem(ceilY);

    // 3. Dual Longitudinal Fluorescent / LED Strip Fixtures (Angled at 45°)
    const fixtureMat = new THREE.MeshStandardMaterial({
      color: 0x48525e,
      roughness: 0.25,
      metalness: 0.85
    });

    const diffuserMat = new THREE.MeshBasicMaterial({
      color: 0xf8fbff
    });
    this.stripLightMaterials.push(diffuserMat);

    const fixtureLength = 11.2;
    const bodyGeo = new THREE.BoxGeometry(0.12, 0.06, fixtureLength);
    const bulbGeo = new THREE.BoxGeometry(0.08, 0.025, fixtureLength);

    // Left Light Fixture
    const fixL = new THREE.Mesh(bodyGeo, fixtureMat);
    fixL.position.set(-1.42, 1.42, 0);
    fixL.rotation.z = Math.PI / 4;
    this.rootGroup.add(fixL);

    const bulbL = new THREE.Mesh(bulbGeo, diffuserMat);
    bulbL.position.set(-1.40, 1.40, 0);
    bulbL.rotation.z = Math.PI / 4;
    this.rootGroup.add(bulbL);

    // Right Light Fixture
    const fixR = new THREE.Mesh(bodyGeo, fixtureMat);
    fixR.position.set(1.42, 1.42, 0);
    fixR.rotation.z = -Math.PI / 4;
    this.rootGroup.add(fixR);

    const bulbR = new THREE.Mesh(bulbGeo, diffuserMat);
    bulbR.position.set(1.40, 1.40, 0);
    bulbR.rotation.z = -Math.PI / 4;
    this.rootGroup.add(bulbR);
  }

  // =========================================================================
  // 5B. ACTIVE MOTORIZED VENTILATION DIFFUSERS & ECLSS OXYGEN INJECTION
  // =========================================================================
  buildActiveVentilationSystem(ceilY) {
    const ventPositionsZ = [-4.0, -2.0, 0.0, 2.0, 4.0];

    // Shared materials for vents
    const housingMat = new THREE.MeshStandardMaterial({
      color: 0x1f242d,
      roughness: 0.35,
      metalness: 0.82
    });

    const ductInteriorMat = new THREE.MeshStandardMaterial({
      color: 0x0c0f14,
      roughness: 0.9,
      metalness: 0.2
    });

    const louverMat = new THREE.MeshStandardMaterial({
      color: 0x9ba6b5,
      roughness: 0.28,
      metalness: 0.85
    });

    const actuatorMat = new THREE.MeshStandardMaterial({
      color: 0x333b48,
      roughness: 0.4,
      metalness: 0.75
    });

    // Outer frame dimensions: 0.66m wide (X), 0.94m long (Z)
    const frameW = 0.66;
    const frameL = 0.94;
    const ductW = 0.52;
    const ductL = 0.80;

    ventPositionsZ.forEach((vz, vIdx) => {
      const ventGroup = new THREE.Group();
      ventGroup.position.set(0, ceilY, vz);

      // 1. Recessed Duct Cavity
      const ductBox = new THREE.Mesh(
        new THREE.BoxGeometry(ductW, 0.08, ductL),
        ductInteriorMat
      );
      ductBox.position.set(0, 0.03, 0);
      ventGroup.add(ductBox);

      // 2. Beveled Outer Bezel Frame
      // Fore/Aft Crossbars
      const barFore = new THREE.Mesh(new THREE.BoxGeometry(frameW, 0.024, 0.07), housingMat);
      barFore.position.set(0, -0.01, ductL * 0.5 + 0.035);
      ventGroup.add(barFore);

      const barAft = new THREE.Mesh(new THREE.BoxGeometry(frameW, 0.024, 0.07), housingMat);
      barAft.position.set(0, -0.01, -(ductL * 0.5 + 0.035));
      ventGroup.add(barAft);

      // Left/Right Bezel Rails
      const railL = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.024, frameL), housingMat);
      railL.position.set(-(ductW * 0.5 + 0.035), -0.01, 0);
      ventGroup.add(railL);

      const railR = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.024, frameL), housingMat);
      railR.position.set(ductW * 0.5 + 0.035, -0.01, 0);
      ventGroup.add(railR);

      // Hazard Warning Decal Strips along rails
      const hazardGeo = new THREE.PlaneGeometry(0.024, frameL - 0.06);
      const hazardMat = new THREE.MeshBasicMaterial({ map: this.textures.hazardStripe });

      const hazardL = new THREE.Mesh(hazardGeo, hazardMat);
      hazardL.rotation.x = Math.PI / 2;
      hazardL.position.set(-(ductW * 0.5 + 0.04), -0.023, 0);
      ventGroup.add(hazardL);

      const hazardR = new THREE.Mesh(hazardGeo, hazardMat);
      hazardR.rotation.x = Math.PI / 2;
      hazardR.position.set(ductW * 0.5 + 0.04, -0.023, 0);
      ventGroup.add(hazardR);

      // 3. Dual Servo Actuator Pods with Status LEDs
      [-ductW * 0.5 - 0.075, ductW * 0.5 + 0.075].forEach(sideX => {
        // Actuator motor casing
        const pod = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.028, 0.52), actuatorMat);
        pod.position.set(sideX, -0.012, 0);
        ventGroup.add(pod);

        // LED Indicator Bar
        const ledMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
        this.ventLedMaterials.push(ledMat);
        const ledBar = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.008, 0.44), ledMat);
        ledBar.position.set(sideX, -0.024, 0);
        ventGroup.add(ledBar);
      });

      // 4. Motorized Louver Slats (7 slats hinged along X-axis)
      const numSlats = 7;
      const slatSpan = ductL - 0.10;
      const slatGeo = new THREE.BoxGeometry(ductW - 0.04, 0.0035, 0.088);

      for (let s = 0; s < numSlats; s++) {
        const zLocal = -slatSpan * 0.5 + (s / (numSlats - 1)) * slatSpan;
        const pivot = new THREE.Group();
        pivot.position.set(0, -0.016, zLocal);

        const slatMesh = new THREE.Mesh(slatGeo, louverMat);
        // Hinge offset so it pivots along its edge
        slatMesh.position.set(0, 0, 0.044);
        pivot.add(slatMesh);

        pivot.rotation.x = this.currentLouverAngle;
        ventGroup.add(pivot);
        this.activeLouvers.push(pivot);
      }

      this.rootGroup.add(ventGroup);
      this.activeVents.push({ group: ventGroup, z: vz });
    });

    // 6. Realistic Airflow Streamlines & Wispy Air Mist System
    this.buildAirflowSystem(ventPositionsZ, ceilY);
  }

  buildAirflowSystem(ventPositionsZ, ceilY) {
    // 1. Aerodynamic Laminar Airflow Streamline Ribbons
    const streamTex = this.createStreamlineTexture();

    ventPositionsZ.forEach(vz => {
      // 4 aerodynamic streamer ribbons hanging down from between the louver slats
      const xOffsets = [-0.14, -0.05, 0.05, 0.14];
      xOffsets.forEach((ox, sIdx) => {
        const streamGeo = new THREE.PlaneGeometry(0.045, 0.72);
        const sMat = new THREE.MeshBasicMaterial({
          map: streamTex,
          transparent: true,
          opacity: 0.16,
          depthWrite: false,
          side: THREE.DoubleSide
        });
        const streamMesh = new THREE.Mesh(streamGeo, sMat);
        streamMesh.position.set(ox, ceilY - 0.38, vz + (sIdx - 1.5) * 0.12);
        this.rootGroup.add(streamMesh);
        this.streamlineMeshes.push(streamMesh);
      });
    });

    // 2. High-Fidelity Wispy Air Mist Particles (Normal Blending, Organic Smoke/Air Puff Texture)
    const particleCount = 650;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    this.oxygenParticleData = [];

    for (let i = 0; i < particleCount; i++) {
      const ventZ = ventPositionsZ[i % ventPositionsZ.length];
      const originX = (Math.random() - 0.5) * 0.38;
      const originZ = ventZ + (Math.random() - 0.5) * 0.55;
      const y = 0.22 + Math.random() * (ceilY - 0.25);

      positions[i * 3] = originX;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = originZ;

      this.oxygenParticleData.push({
        originX: originX,
        originZ: originZ,
        ventZ: ventZ,
        lateralSpread: (Math.random() - 0.5) * 0.0025,
        curlPhase: Math.random() * Math.PI * 2,
        speedMult: 0.70 + Math.random() * 0.60,
        life: Math.random()
      });
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Authentically rendered air mist: NormalBlending with soft wispy smoke texture
    this.vaporMaterial = new THREE.PointsMaterial({
      size: 0.40,
      map: this.createAirVaporTexture(),
      transparent: true,
      opacity: 0.18,
      blending: THREE.NormalBlending,
      depthWrite: false,
      color: 0xe5eef7
    });

    this.oxygenParticles = new THREE.Points(geo, this.vaporMaterial);
    this.rootGroup.add(this.oxygenParticles);
  }

  // =========================================================================
  // 6. 45° CORNER STANDOFFS & UTILITY CABLE CHASES (Seamless Cabin Enclosure)
  // =========================================================================
  buildStandoffUtilityChases() {
    const chaseLength = 11.8;

    // Materials
    const upperBlanketMat = new THREE.MeshStandardMaterial({
      map: this.textures.quiltedCeiling,
      roughness: 0.80,
      metalness: 0.05
    });

    const lowerPanelMat = new THREE.MeshStandardMaterial({
      color: 0x505b68,
      roughness: 0.35,
      metalness: 0.80
    });

    const racewayMat = new THREE.MeshStandardMaterial({
      color: 0x222a35,
      roughness: 0.38,
      metalness: 0.85
    });

    // Specialized aerospace fluid line materials
    const o2LineMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.3, metalness: 0.7 }); // Green O2
    const coolantLineMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.25, metalness: 0.8 }); // Blue Coolant
    const vacuumLineMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.35, metalness: 0.6 }); // Yellow Vac
    const flexBraidedMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.2, metalness: 0.95 }); // Braided Steel
    const clampMat = new THREE.MeshStandardMaterial({ color: 0x0055cc, roughness: 0.3, metalness: 0.85 }); // Mil-Spec P-Clamp Blue
    const clampRubberMat = new THREE.MeshBasicMaterial({ color: 0x111827 });

    const standoffs = [
      { x: -1.285, y:  1.295, rot:  0.679, isUpper: true,  signX: -1, signY:  1 }, // Upper Left
      { x:  1.285, y:  1.295, rot: -0.679, isUpper: true,  signX:  1, signY:  1 }, // Upper Right
      { x: -1.285, y: -1.265, rot: -0.679, isUpper: false, signX: -1, signY: -1 }, // Lower Left
      { x:  1.285, y: -1.265, rot:  0.679, isUpper: false, signX:  1, signY: -1 }  // Lower Right
    ];

    const clampMatrices = [];
    const boltMatrices = [];
    const dummyClamp = new THREE.Object3D();
    const dummyBolt = new THREE.Object3D();

    standoffs.forEach(s => {
      // 1. Continuous Solid 45° Standoff Closure Panel (Guarantees ZERO black void between racks & ceiling/floor)
      const mat = s.isUpper ? upperBlanketMat : lowerPanelMat;
      const closurePanel = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.04, chaseLength), mat);
      closurePanel.position.set(s.x, s.y, 0);
      closurePanel.rotation.z = s.rot;
      this.rootGroup.add(closurePanel);

      // Normal vector pointing inward toward the habitable corridor
      const normX = -s.signX * Math.sin(Math.abs(s.rot));
      const normY = -s.signY * Math.cos(Math.abs(s.rot));

      // Tangent vector along the standoff face
      const tanX = Math.cos(s.rot);
      const tanY = Math.sin(s.rot);

      // 2. Extruded Aluminum Unistrut Cable Raceway Trunk (Mounted flush onto standoff face)
      const raceway = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.024, chaseLength - 0.2), racewayMat);
      raceway.position.set(s.x + normX * 0.026, s.y + normY * 0.026, 0);
      raceway.rotation.z = s.rot;
      this.rootGroup.add(raceway);

      // 3. Color-Coded Aerospace Fluid Lines (Firmly nestled into the raceway channel)
      const lineOffsets = [
        { mat: o2LineMat,      r: 0.014, offsetTan: -0.11 },
        { mat: coolantLineMat, r: 0.018, offsetTan: -0.04 },
        { mat: vacuumLineMat,  r: 0.016, offsetTan:  0.03 },
        { mat: flexBraidedMat, r: 0.013, offsetTan:  0.10 }
      ];

      lineOffsets.forEach(line => {
        const pipe = new THREE.Mesh(new THREE.CylinderGeometry(line.r, line.r, chaseLength - 0.3, 16), line.mat);
        pipe.rotation.x = Math.PI / 2;
        pipe.position.set(
          s.x + normX * 0.045 + tanX * line.offsetTan,
          s.y + normY * 0.045 + tanY * line.offsetTan,
          0
        );
        this.rootGroup.add(pipe);
      });

      // 4. Heavy-Duty Mil-Spec P-Clamps Bolted to Raceway (Accumulated for InstancedMesh)
      for (let z = -5.2; z <= 5.2; z += 0.8) {
        dummyClamp.position.set(s.x + normX * 0.056, s.y + normY * 0.056, z);
        dummyClamp.rotation.z = s.rot;
        dummyClamp.updateMatrix();
        clampMatrices.push(dummyClamp.matrix.clone());

        dummyBolt.rotation.z = s.rot;

        dummyBolt.position.set(
          s.x + normX * 0.062 + tanX * -0.13,
          s.y + normY * 0.062 + tanY * -0.13,
          z
        );
        dummyBolt.updateMatrix();
        boltMatrices.push(dummyBolt.matrix.clone());

        dummyBolt.position.set(
          s.x + normX * 0.062 + tanX * 0.13,
          s.y + normY * 0.062 + tanY * 0.13,
          z
        );
        dummyBolt.updateMatrix();
        boltMatrices.push(dummyBolt.matrix.clone());
      }
    });

    const clampGeo = new THREE.BoxGeometry(0.30, 0.012, 0.035);
    const clampInst = new THREE.InstancedMesh(clampGeo, clampMat, clampMatrices.length);
    clampMatrices.forEach((mat, idx) => clampInst.setMatrixAt(idx, mat));
    clampInst.instanceMatrix.needsUpdate = true;
    this.rootGroup.add(clampInst);

    const boltGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.016, 6);
    const boltInst = new THREE.InstancedMesh(boltGeo, clampRubberMat, boltMatrices.length);
    boltMatrices.forEach((mat, idx) => boltInst.setMatrixAt(idx, mat));
    boltInst.instanceMatrix.needsUpdate = true;
    this.rootGroup.add(boltInst);
  }

  // =========================================================================
  // 7. PAYLOAD RACKS (ISPR - Modular 19" Space Station Racks)
  // =========================================================================
  buildPayloadRacks() {
    const rackWidth = 1.05;
    const rackHeight = 2.05;
    const rackDepth = 0.42;

    const rackMat = new THREE.MeshStandardMaterial({
      map: this.textures.rack,
      bumpMap: this.textures.rackBump,
      bumpScale: 0.025,
      roughness: 0.40,
      metalness: 0.38
    });

    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x1e242c,
      roughness: 0.28,
      metalness: 0.92
    });

    const handleMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.25,
      metalness: 0.90
    });

    // 11 contiguous ISPR rack positions (exactly 1.05m pitch, ZERO gaps anywhere)
    const rackPositions = [-5.00, -3.95, -2.90, -1.85, -0.80, 0.25, 1.30, 2.35, 3.40, 4.45, 5.50];

    const rackMatrices = [];
    const postMatrices = [];
    const handleMatrices = [];
    const ledItems = []; // { matrix, color }
    const cordMatrices = [];

    const dummyRack = new THREE.Object3D();
    const dummyPost = new THREE.Object3D();
    const dummyHandle = new THREE.Object3D();
    const dummyLed = new THREE.Object3D();
    const dummyCord = new THREE.Object3D();

    // Left Wall Payload Racks (X = -1.82, facing +X)
    rackPositions.forEach((z, idx) => {
      // Skip position -0.8 on left side for the Microgravity Science Glovebox!
      if (Math.abs(z - (-0.8)) < 0.2) return;

      dummyRack.position.set(-1.82, 0.02, z);
      dummyRack.rotation.set(0, 0, 0);
      dummyRack.updateMatrix();
      rackMatrices.push(dummyRack.matrix.clone());

      // Structural Vertical Posts (Machined corner extrusions between racks)
      dummyPost.position.set(-1.60, 0.02, z + rackWidth * 0.5);
      dummyPost.updateMatrix();
      postMatrices.push(dummyPost.matrix.clone());

      if (idx === 0) {
        dummyPost.position.set(-1.60, 0.02, z - rackWidth * 0.5);
        dummyPost.updateMatrix();
        postMatrices.push(dummyPost.matrix.clone());
      }

      // Physical Sub-tier Drawer Handles (4 tiers per rack)
      for (let tier = 0; tier < 4; tier++) {
        const tierY = -0.70 + tier * 0.46;
        dummyHandle.position.set(-1.595, tierY, z + 0.18);
        dummyHandle.updateMatrix();
        handleMatrices.push(dummyHandle.matrix.clone());

        dummyHandle.position.set(-1.595, tierY, z - 0.18);
        dummyHandle.updateMatrix();
        handleMatrices.push(dummyHandle.matrix.clone());
      }

      // 3D Status LED Indicator Board on top tier
      dummyLed.rotation.set(0, 0, Math.PI / 2);
      [-0.15, 0.0, 0.15].forEach((lz, lIdx) => {
        const ledCol = lIdx === 0 ? 0x22c55e : (lIdx === 1 ? 0x38bdf8 : 0xf59e0b);
        dummyLed.position.set(-1.598, 0.88, z + lz);
        dummyLed.updateMatrix();
        ledItems.push({ matrix: dummyLed.matrix.clone(), color: new THREE.Color(ledCol) });
      });

      // Horizontal Bungee Retention Cord across lower lockers
      dummyCord.position.set(-1.59, -0.42, z);
      dummyCord.updateMatrix();
      cordMatrices.push(dummyCord.matrix.clone());
    });

    // Right Wall Payload Racks (X = +1.82, facing -X)
    rackPositions.forEach((z, idx) => {
      dummyRack.position.set(1.82, 0.02, z);
      dummyRack.rotation.set(0, Math.PI, 0);
      dummyRack.updateMatrix();
      rackMatrices.push(dummyRack.matrix.clone());

      // Structural Vertical Posts
      dummyPost.position.set(1.60, 0.02, z + rackWidth * 0.5);
      dummyPost.updateMatrix();
      postMatrices.push(dummyPost.matrix.clone());

      if (idx === 0) {
        dummyPost.position.set(1.60, 0.02, z - rackWidth * 0.5);
        dummyPost.updateMatrix();
        postMatrices.push(dummyPost.matrix.clone());
      }

      // Physical Sub-tier Drawer Handles
      for (let tier = 0; tier < 4; tier++) {
        const tierY = -0.70 + tier * 0.46;
        dummyHandle.position.set(1.595, tierY, z + 0.18);
        dummyHandle.updateMatrix();
        handleMatrices.push(dummyHandle.matrix.clone());

        dummyHandle.position.set(1.595, tierY, z - 0.18);
        dummyHandle.updateMatrix();
        handleMatrices.push(dummyHandle.matrix.clone());
      }

      // Status LED indicators
      dummyLed.rotation.set(0, 0, -Math.PI / 2);
      [-0.15, 0.0, 0.15].forEach((lz, lIdx) => {
        const ledCol = lIdx === 0 ? 0x22c55e : (lIdx === 1 ? 0x38bdf8 : 0x10b981);
        dummyLed.position.set(1.598, 0.88, z + lz);
        dummyLed.updateMatrix();
        ledItems.push({ matrix: dummyLed.matrix.clone(), color: new THREE.Color(ledCol) });
      });

      // Horizontal Bungee Retention Cord
      dummyCord.position.set(1.59, -0.42, z);
      dummyCord.updateMatrix();
      cordMatrices.push(dummyCord.matrix.clone());
    });

    // 1. ISPR Rack Bodies (InstancedMesh)
    const rackGeo = new THREE.BoxGeometry(rackDepth, rackHeight, rackWidth);
    const rackInst = new THREE.InstancedMesh(rackGeo, rackMat, rackMatrices.length);
    rackMatrices.forEach((mat, i) => rackInst.setMatrixAt(i, mat));
    rackInst.instanceMatrix.needsUpdate = true;
    this.rootGroup.add(rackInst);

    // 2. Corner Structural Posts (InstancedMesh)
    const postGeo = new THREE.BoxGeometry(0.045, rackHeight + 0.06, 0.045);
    const postInst = new THREE.InstancedMesh(postGeo, frameMat, postMatrices.length);
    postMatrices.forEach((mat, i) => postInst.setMatrixAt(i, mat));
    postInst.instanceMatrix.needsUpdate = true;
    this.rootGroup.add(postInst);

    // 3. Physical Sub-tier Drawer Handles (InstancedMesh)
    const handleGeo = new THREE.BoxGeometry(0.016, 0.08, 0.016);
    const handleInst = new THREE.InstancedMesh(handleGeo, handleMat, handleMatrices.length);
    handleMatrices.forEach((mat, i) => handleInst.setMatrixAt(i, mat));
    handleInst.instanceMatrix.needsUpdate = true;
    this.rootGroup.add(handleInst);

    // 4. Status LEDs with per-instance color (InstancedMesh)
    const ledGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.008, 12);
    const ledMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const ledInst = new THREE.InstancedMesh(ledGeo, ledMat, ledItems.length);
    ledItems.forEach((item, i) => {
      ledInst.setMatrixAt(i, item.matrix);
      ledInst.setColorAt(i, item.color);
    });
    ledInst.instanceMatrix.needsUpdate = true;
    if (ledInst.instanceColor) ledInst.instanceColor.needsUpdate = true;
    this.rootGroup.add(ledInst);

    // 5. Horizontal Bungee Retention Cords (InstancedMesh)
    const cordGeo = new THREE.CylinderGeometry(0.004, 0.004, rackWidth - 0.08, 8);
    const cordMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
    const cordInst = new THREE.InstancedMesh(cordGeo, cordMat, cordMatrices.length);
    cordMatrices.forEach((mat, i) => cordInst.setMatrixAt(i, mat));
    cordInst.instanceMatrix.needsUpdate = true;
    this.rootGroup.add(cordInst);
  }

  // =========================================================================
  // 8. MICROGRAVITY SCIENCE GLOVEBOX (MSG) (High-Fidelity ISS Payload Bay)
  // =========================================================================
  buildMicrogravityScienceGlovebox() {
    const msgGroup = new THREE.Group();
    // Flush center of left ISPR payload rack bay
    const bayX = -1.82;
    const bayY = 0.02;
    const bayZ = -0.80;
    msgGroup.position.set(bayX, bayY, bayZ);

    const rackW = 1.05; // Width along Z (flush with 1.05m ISPR pitch)
    const rackH = 2.05; // Height along Y
    const rackD = 0.44; // Depth along X (front face at local X = +0.22)

    // Authentic aerospace materials
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0xdce3eb,
      roughness: 0.42,
      metalness: 0.35
    });

    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x1e242c,
      roughness: 0.28,
      metalness: 0.92
    });

    const bezelMat = new THREE.MeshStandardMaterial({
      color: 0x242e3a,
      roughness: 0.30,
      metalness: 0.75
    });

    const gloveMat = new THREE.MeshStandardMaterial({
      color: 0x141820,
      roughness: 0.85,
      metalness: 0.10
    });

    // 1. ISPR Modular Enclosure for Microgravity Science Glovebox (Hollow working chamber)
    // Lower Avionics / Utility Cabinet Base (Y = -0.55m)
    const lowerCasing = new THREE.Mesh(new THREE.BoxGeometry(rackD, 0.95, rackW), chassisMat);
    lowerCasing.position.set(0, -0.55, 0);
    msgGroup.add(lowerCasing);

    // Upper Avionics Header Enclosure (Y = +0.86m)
    const upperCasing = new THREE.Mesh(new THREE.BoxGeometry(rackD, 0.33, rackW), chassisMat);
    upperCasing.position.set(0, 0.86, 0);
    msgGroup.add(upperCasing);

    // Rear Chamber Wall (X = -0.20m)
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.77, rackW), chassisMat);
    backWall.position.set(-rackD * 0.5 + 0.02, 0.31, 0);
    msgGroup.add(backWall);

    // Side Chamber Enclosure Walls
    const sideWallFore = new THREE.Mesh(new THREE.BoxGeometry(rackD, 0.77, 0.04), chassisMat);
    sideWallFore.position.set(0, 0.31, -rackW * 0.5 + 0.02);
    msgGroup.add(sideWallFore);

    const sideWallAft = new THREE.Mesh(new THREE.BoxGeometry(rackD, 0.77, 0.04), chassisMat);
    sideWallAft.position.set(0, 0.31, rackW * 0.5 - 0.02);
    msgGroup.add(sideWallAft);

    // Front Working Apron Plate below the window for glove ports
    const frontApron = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.22, rackW), chassisMat);
    frontApron.position.set(rackD * 0.5 - 0.012, 0.11, 0);
    msgGroup.add(frontApron);

    // Front Structural Posts (ISPR rack corner extrusions)
    const postGeo = new THREE.BoxGeometry(0.045, rackH + 0.04, 0.045);
    const postL = new THREE.Mesh(postGeo, frameMat);
    postL.position.set(rackD * 0.5, 0, -rackW * 0.5 + 0.022);
    msgGroup.add(postL);

    const postR = new THREE.Mesh(postGeo, frameMat);
    postR.position.set(rackD * 0.5, 0, rackW * 0.5 - 0.022);
    msgGroup.add(postR);

    // Top Header Structural Tie Plate
    const topHeader = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, rackW), frameMat);
    topHeader.position.set(rackD * 0.5, rackH * 0.5 - 0.03, 0);
    msgGroup.add(topHeader);

    // 2. Lower Avionics & Gas Delivery Bay (Y = -0.52, height 0.94m)
    const lowerPanel = new THREE.Mesh(
      new THREE.PlaneGeometry(0.92, 0.88),
      new THREE.MeshStandardMaterial({ map: this.textures.glovebox, roughness: 0.4, metalness: 0.35 })
    );
    lowerPanel.rotation.y = Math.PI / 2;
    lowerPanel.position.set(rackD * 0.5 + 0.005, -0.48, 0);
    msgGroup.add(lowerPanel);

    // Drawer Pull Handles (3 tiers)
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.25, metalness: 0.90 });
    [-0.22, -0.48, -0.74].forEach(hy => {
      const hBarL = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.06, 0.016), handleMat);
      hBarL.position.set(rackD * 0.5 + 0.02, hy, -0.22);
      msgGroup.add(hBarL);

      const hBarR = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.06, 0.016), handleMat);
      hBarR.position.set(rackD * 0.5 + 0.02, hy, 0.22);
      msgGroup.add(hBarR);
    });

    // 3. Sealed Core Science Working Chamber (Interior Cavity)
    // Cavity dimensions: width 0.94m (Z), height 0.70m (Y), depth 0.38m (X)
    const cavityGroup = new THREE.Group();
    cavityGroup.position.set(0.02, 0.36, 0);

    // Optical Breadboard Base Stage (M6 tapped grid)
    const breadboard = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.025, 0.92),
      new THREE.MeshStandardMaterial({ map: this.textures.breadboard, roughness: 0.35, metalness: 0.75 })
    );
    breadboard.position.set(0, -0.33, 0);
    cavityGroup.add(breadboard);

    // =======================================================================
    // PHOTOREALISTIC NASA CANDLE COMBUSTION EXPERIMENT APPARATUS (BASS/SPICE/CFI-G)
    // Elevated on a Lab-Jack Stage to sit directly centered at the Viewing Window Sweet Spot
    // =======================================================================
    // Precision Lab-Jack Elevator Stage
    const jackStage = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.20, 0.24), frameMat);
    jackStage.position.set(0, -0.22, 0);
    cavityGroup.add(jackStage);

    // Microgravity Science Glovebox Sealed Candle Apparatus (Y = -0.11m puts flame at window eye-level Y = 0.44m)
    const gloveboxCandle = this.createCandleApparatus(false);
    gloveboxCandle.candleGroup.position.set(0, -0.11, 0);
    cavityGroup.add(gloveboxCandle.candleGroup);
    this.candleGroup = gloveboxCandle.candleGroup;

    // Overhead Chamber Daylight LED Lighting Strips (Twin Linear Tubes)
    const ceilStripMat = new THREE.MeshBasicMaterial({ color: 0xf8fbff });
    [-0.18, 0.18].forEach(sz => {
      const ceilStrip = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.012, 0.04), ceilStripMat);
      ceilStrip.position.set(0, 0.33, sz);
      cavityGroup.add(ceilStrip);
    });

    // Clean internal chamber illumination (balanced for candle visibility)
    const chamberIllum = new THREE.PointLight(0xdbeafe, 0.55, 2.5, 1.5);
    chamberIllum.position.set(0.05, 0.30, 0);
    cavityGroup.add(chamberIllum);
    this.lights.push(chamberIllum);

    msgGroup.add(cavityGroup);

    // 4. Ergonomic Slanted Viewing Window Assembly (Tilted 22° back)
    // Sits seamlessly from Y = 0.22 (front X = +0.22) to Y = 0.68 (top X = +0.03)
    const windowGroup = new THREE.Group();
    windowGroup.position.set(0.125, 0.45, 0);
    windowGroup.rotation.z = 0.392; // 22.4 degree tilt back

    const frameW = 0.90;
    const frameH = 0.50;
    const barThick = 0.032;

    // Precision CNC Beveled Dark Aluminum Frame Bars
    // Top Bar
    const barTop = new THREE.Mesh(new THREE.BoxGeometry(barThick, 0.035, frameW), bezelMat);
    barTop.position.set(0, frameH * 0.5 - 0.017, 0);
    windowGroup.add(barTop);

    // Bottom Bar
    const barBtm = new THREE.Mesh(new THREE.BoxGeometry(barThick, 0.035, frameW), bezelMat);
    barBtm.position.set(0, -frameH * 0.5 + 0.017, 0);
    windowGroup.add(barBtm);

    // Left Bar
    const barL = new THREE.Mesh(new THREE.BoxGeometry(barThick, frameH, 0.035), bezelMat);
    barL.position.set(0, 0, -frameW * 0.5 + 0.017);
    windowGroup.add(barL);

    // Right Bar
    const barR = new THREE.Mesh(new THREE.BoxGeometry(barThick, frameH, 0.035), bezelMat);
    barR.position.set(0, 0, frameW * 0.5 - 0.017);
    windowGroup.add(barR);

    // Multi-layer Laminated Optical Glass Window (Crystal clear view into combustion experiment)
    const glassPane = new THREE.Mesh(
      new THREE.BoxGeometry(0.008, 0.44, 0.84),
      new THREE.MeshStandardMaterial({
        color: 0xd8eeff,
        transparent: true,
        opacity: 0.08,
        roughness: 0.04,
        metalness: 0.1,
        depthWrite: false
      })
    );
    glassPane.position.set(0, 0, 0);
    windowGroup.add(glassPane);

    // Perimeter Socket Head Cap Screws (Hex fasteners)
    const screwMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.9, roughness: 0.2 });
    const screwGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.01, 6);

    for (let sz = -0.41; sz <= 0.41; sz += 0.082) {
      const scT = new THREE.Mesh(screwGeo, screwMat);
      scT.rotation.z = Math.PI / 2;
      scT.position.set(barThick * 0.5 + 0.002, frameH * 0.5 - 0.017, sz);
      windowGroup.add(scT);

      const scB = new THREE.Mesh(screwGeo, screwMat);
      scB.rotation.z = Math.PI / 2;
      scB.position.set(barThick * 0.5 + 0.002, -frameH * 0.5 + 0.017, sz);
      windowGroup.add(scB);
    }

    msgGroup.add(windowGroup);

    // 5. Front Circular Glove Ports (Below the window on vertical apron)
    [-0.22, 0.22].forEach(zOffset => {
      // Machined Aluminum Circular Flange Ring
      const portRing = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.016, 16, 32), bezelMat);
      portRing.rotation.y = Math.PI / 2;
      portRing.position.set(rackD * 0.5 + 0.015, 0.09, zOffset);
      msgGroup.add(portRing);

      // Flexible Accordion-Pleated Neoprene Glove Cuff
      const gloveCuff = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.088, 0.06, 24), gloveMat);
      gloveCuff.rotation.z = Math.PI / 2;
      gloveCuff.position.set(rackD * 0.5 - 0.01, 0.09, zOffset);
      msgGroup.add(gloveCuff);

      // Deep Arm Gauntlet Entry Cone into chamber
      const gloveCone = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.078, 0.10, 20), gloveMat);
      gloveCone.rotation.z = Math.PI / 2;
      gloveCone.position.set(rackD * 0.5 - 0.08, 0.09, zOffset);
      msgGroup.add(gloveCone);

      // Bayonet Clamp Latch Pins
      for (let bp = 0; bp < 4; bp++) {
        const bAngle = (bp / 4) * Math.PI * 2;
        const bPin = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.012, 0.02), screwMat);
        bPin.position.set(
          rackD * 0.5 + 0.02,
          0.09 + Math.sin(bAngle) * 0.105,
          zOffset + Math.cos(bAngle) * 0.105
        );
        msgGroup.add(bPin);
      }
    });

    this.rootGroup.add(msgGroup);
  }

  // =========================================================================
  // 8B. PHOTOREALISTIC CANDLE APPARATUS (Single Central Wick & True Wax Optics)
  // =========================================================================
  createCandleFlameGeometry() {
    const radialSegments = 32;
    const heightSegments = 32;
    const positions = [];
    const normals = [];
    const uvs = [];
    const indices = [];

    for (let y = 0; y <= heightSegments; y++) {
      const v = y / heightSegments; // 0.0 at base, 1.0 at apex

      for (let x = 0; x <= radialSegments; x++) {
        const u = x / radialSegments;
        const theta = u * Math.PI * 2.0;
        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);

        // Unit parametric cylinder: vertex shader calculates aerodynamic 0g/1g envelope
        positions.push(cosT, v, sinT);

        const nx = cosT;
        const nz = sinT;
        const ny = v > 0.85 ? 0.7 : -0.15;
        const nLen = Math.hypot(nx, ny, nz) || 1.0;
        normals.push(nx / nLen, ny / nLen, nz / nLen);

        uvs.push(u, v);
      }
    }

    for (let y = 0; y < heightSegments; y++) {
      for (let x = 0; x < radialSegments; x++) {
        const a = (radialSegments + 1) * y + x;
        const b = (radialSegments + 1) * (y + 1) + x;
        const c = (radialSegments + 1) * (y + 1) + (x + 1);
        const d = (radialSegments + 1) * y + (x + 1);

        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    return geo;
  }

  createCandleFlameMaterial(isRoom = false) {
    return new THREE.ShaderMaterial({
      uniforms: {
        u_time: { value: 0.0 },
        u_gravity: { value: 0.0 },
        u_oxygenPct: { value: 21.0 },
        u_brightness: { value: isRoom ? 1.55 : 1.40 },
        u_windX: { value: 0.0 },
        u_windZ: { value: 0.0 }
      },
      vertexShader: `
        uniform float u_time;
        uniform float u_gravity;
        uniform float u_oxygenPct;
        uniform float u_windX;
        uniform float u_windZ;

        varying vec3 v_worldNormal;
        varying vec3 v_viewDir;
        varying float v_yNorm;

        void main() {
          float yNorm = clamp(position.y, 0.0, 1.0);
          v_yNorm = yNorm;

          float gRatio = clamp(u_gravity, 0.0, 1.0);
          float o2Ratio = clamp(u_oxygenPct / 21.0, 0.25, 1.8);

          // 1g Teardrop profile (Left NASA photo: slender buoyant teardrop with needle tip)
          float teardrop = (0.18 + 1.25 * sqrt(yNorm)) * pow(max(0.0, 1.0 - yNorm), 0.78);

          // 0g Microgravity Dome profile (Right NASA photo: pure smooth hemispherical bell dome)
          float zeroGDome = sqrt(max(0.001, 1.0 - pow(yNorm, 1.85)));

          // Smooth aerodynamic morphing based on gravity
          float envelope = mix(zeroGDome, teardrop, sqrt(gRatio));

          // Physical radial and vertical dimensioning
          float actualRadius = mix(0.022, 0.010, gRatio) * (0.80 + 0.20 * min(1.2, o2Ratio));

          // Vertical span:
          // In 0g (microgravity): base reaches down to wax pool (-0.032m), top curves over wick (+0.022m)
          // In 1g (Earth): base starts right at wick tip (-0.005m), extends upward (+0.058m)
          float baseOffset = mix(-0.032, -0.005, sqrt(gRatio));
          float topHeight = mix(0.022, 0.058, sqrt(gRatio));
          float totalSpan = (topHeight - baseOffset) * (0.75 + 0.25 * min(1.2, o2Ratio));

          vec3 localP = vec3(0.0);
          localP.xz = position.xz * (actualRadius * envelope);
          localP.y = baseOffset + yNorm * totalSpan;

          // Convective waver & flicker (strictly buoyant draft: ZERO waver in 0.0g!)
          float flickerFreq = 11.5 * sqrt(gRatio);
          float waverAmp = 0.0014 * sqrt(gRatio) * yNorm;
          float waverX = sin(u_time * flickerFreq + localP.y * 35.0) * waverAmp + sin(u_time * (flickerFreq * 2.1)) * (waverAmp * 0.4);
          float waverZ = cos(u_time * (flickerFreq * 0.85) + localP.y * 28.0) * (waverAmp * 0.7);

          localP.x += waverX + u_windX * yNorm * 0.025;
          localP.z += waverZ + u_windZ * yNorm * 0.025;

          vec4 worldP = modelMatrix * vec4(localP, 1.0);
          v_worldNormal = normalize(mat3(modelMatrix) * normal);
          v_viewDir = normalize(cameraPosition - worldP.xyz);

          gl_Position = projectionMatrix * viewMatrix * worldP;
        }
      `,
      fragmentShader: `
        uniform float u_time;
        uniform float u_gravity;
        uniform float u_oxygenPct;
        uniform float u_brightness;

        varying vec3 v_worldNormal;
        varying vec3 v_viewDir;
        varying float v_yNorm;

        void main() {
          float o2 = u_oxygenPct;

          // =========================================================================
          // 1. LOW OXYGEN EXTINCTION: "in low oxygen the candle flame just go out"
          // Below limiting oxygen index (10% O2), flame suffocates & extinguishes!
          // =========================================================================
          if (o2 < 10.0) {
            discard; // Flame completely goes out!
          }

          float y = v_yNorm;
          float gRatio = clamp(u_gravity, 0.0, 1.0);
          float o2Ratio = o2 / 21.0;

          // View grazing angle (Fresnel) for rich 3D volumetric depth
          float NdotV = max(0.0, dot(v_worldNormal, v_viewDir));
          float rim = 1.0 - NdotV;

          // =========================================================================
          // 2. MICROGRAVITY PURE BLUE DOME (Right photo: 100% Cobalt / Azure Blue)
          // NASA ISS FLEX / CFE / BASS: pure CH* & C2* chemiluminescence, ZERO soot!
          // =========================================================================
          // Outer shell / limb brightening (outer perimeter of the dome in right photo)
          vec3 colZeroGOuter = vec3(0.10, 0.52, 1.85); // Brilliant electric cyan-blue
          vec3 colZeroGInner = vec3(0.04, 0.32, 1.35); // Deep cobalt / azure blue
          vec3 zeroGFlame = mix(colZeroGInner, colZeroGOuter, pow(rim, 1.35));

          // =========================================================================
          // 3. EARTH 1g BUOYANT TEARDROP (Left photo: Blue base + Golden incandescent mantle)
          // =========================================================================
          // Base cup: sapphire-cyan blue cradle wrapping lower wick
          vec3 col1gBlue = vec3(0.07, 0.44, 1.45);

          // Golden incandescent body & white-hot soot core
          vec3 col1gYellow = vec3(1.0, 0.72, 0.10);
          vec3 col1gCoreWhite = vec3(1.48, 1.42, 1.25);
          vec3 col1gTipAmber = vec3(1.0, 0.40, 0.03);

          // 1g Height distribution:
          // Lower 22%: Blue base cup
          float blue1gFactor = smoothstep(0.24, 0.02, y);

          // 1g Body gradient: Golden yellow to amber tip
          vec3 body1g = mix(col1gYellow, col1gTipAmber, smoothstep(0.35, 0.95, y));
          // White-hot core in the center of 1g flame
          float core1g = smoothstep(0.12, 0.28, y) * (1.0 - smoothstep(0.55, 0.82, y)) * (1.0 - rim * 0.7);
          body1g = mix(body1g, col1gCoreWhite, core1g * 0.75);

          // 1g combined flame (seamless transition from blue base to golden flame)
          vec3 oneGFlame = mix(body1g, col1gBlue, blue1gFactor);

          // =========================================================================
          // 4. DYNAMIC PHYSICS-BASED GRAVITY BLEND (0g Pure Blue <--> 1g Golden Teardrop)
          // =========================================================================
          // In 0g (ISS): zeroGFactor = 1.0 -> 100% pure blue dome (matches right photo!)
          // In 1g (Earth): zeroGFactor = 0.0 -> Golden teardrop with blue base (matches left photo!)
          // In 0.16g (Moon): mostly blue dome with faint golden luminescence at crown
          // In 0.38g (Mars): intermediate buoyant flame
          float zeroGFactor = clamp(1.0 - sqrt(gRatio) / 0.70, 0.0, 1.0);
          vec3 flameColor = mix(oneGFlame, zeroGFlame, zeroGFactor);

          // Oxygen enrichment (> 35% O2) acceleration
          if (o2 > 35.0) {
            float hyper = clamp((o2 - 35.0) / 65.0, 0.0, 1.0);
            flameColor = mix(flameColor, vec3(1.15, 1.30, 1.60), hyper * 0.50);
          }

          // =========================================================================
          // 5. TRANSPARENCY & VOLUMETRIC OPACITY
          // =========================================================================
          // Soft fade at bottom contact and top tip
          float alphaBase = smoothstep(0.0, 0.06, y);
          float alphaTip = 1.0 - pow(smoothstep(0.72, 1.0, y), 2.0);
          // Volumetric rim thickness
          float alphaRim = pow(rim, 1.25) * 0.55 + 0.45;

          // In 0g microgravity, limb brightening is prominent around the dome perimeter
          if (zeroGFactor > 0.5) {
            alphaRim = pow(rim, 1.1) * 0.70 + 0.30;
          }

          float alpha = alphaBase * alphaTip * alphaRim;

          // Low oxygen distress fade before cutoff (10% to 14% O2)
          if (o2 < 14.0) {
            alpha *= smoothstep(10.0, 14.0, o2);
          }

          vec3 finalRgb = flameColor * (u_brightness * (0.95 + 0.20 * min(1.2, o2Ratio)));
          gl_FragColor = vec4(finalRgb, alpha * 0.96);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      side: THREE.DoubleSide
    });
  }

  createCandleApparatus(isRoom = false) {
    const candleGroup = new THREE.Group();

    // 1. Sleek Laboratory Anodized Dish Plate (Catches wax and anchors to breadboard)
    const plateMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.85,
      roughness: 0.25
    });
    const saucer = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.068, 0.010, 32), plateMat);
    saucer.position.y = 0.005;
    candleGroup.add(saucer);

    // Beveled Outer Lip
    const lipGeo = new THREE.TorusGeometry(0.070, 0.003, 12, 32);
    const lipMesh = new THREE.Mesh(lipGeo, plateMat);
    lipMesh.rotation.x = Math.PI / 2;
    lipMesh.position.y = 0.010;
    candleGroup.add(lipMesh);

    // Three flush M4 mounting screws
    const screwMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
    for (let a = 0; a < 3; a++) {
      const ang = (a / 3) * Math.PI * 2;
      const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.012, 12), screwMat);
      screw.position.set(Math.cos(ang) * 0.058, 0.008, Math.sin(ang) * 0.058);
      candleGroup.add(screw);
    }

    // 2. Translucent Paraffin Wax Pillar Body (Natural Warm Ivory with Subsurface Scattering)
    const waxRadius = 0.048;
    const waxHeight = 0.125;
    const waxGeo = new THREE.CylinderGeometry(waxRadius, waxRadius * 1.03, waxHeight, 48);
    const waxMat = new THREE.MeshPhysicalMaterial({
      color: 0xf6eee3,          // Natural warm ivory paraffin wax
      emissive: 0x3d2008,       // Warm internal subsurface scattering glow
      roughness: 0.32,
      metalness: 0.01,
      transmission: 0.45,
      thickness: 0.85,
      ior: 1.46
    });
    const waxPillar = new THREE.Mesh(waxGeo, waxMat);
    waxPillar.position.y = 0.0725;
    candleGroup.add(waxPillar);

    // Soft Melted Top Rim Collar
    const rimGeo = new THREE.TorusGeometry(waxRadius * 0.96, 0.003, 16, 48);
    const rimMesh = new THREE.Mesh(rimGeo, waxMat);
    rimMesh.rotation.x = Math.PI / 2;
    rimMesh.position.y = 0.134;
    candleGroup.add(rimMesh);

    // 3. Concave Melted Liquid Wax Pool on Top (Shallow liquid depression below rim)
    const poolGeo = new THREE.CylinderGeometry(waxRadius * 0.93, waxRadius * 0.88, 0.006, 48);
    const poolMat = new THREE.MeshPhysicalMaterial({
      color: 0xfad598,          // Warm liquefied golden wax
      emissive: 0x5a2d04,
      roughness: 0.04,          // Glistening fluid surface
      metalness: 0.02,
      transmission: 0.65,
      ior: 1.42
    });
    const pool = new THREE.Mesh(poolGeo, poolMat);
    pool.position.y = 0.131;
    candleGroup.add(pool);

    // Single Source of Truth for Wick Tip
    const WICK_TIP = new THREE.Vector3(0.0030, 0.168, 0.0010);

    // 4. Single Authentic Braided Cotton Wick (ONLY ONE WICK PER CANDLE)
    // Rises from the center of the melt pool and curls naturally at the tip
    const wickCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.131, 0),
      new THREE.Vector3(0.0006, 0.143, 0.0002),
      new THREE.Vector3(0.0018, 0.155, 0.0006),
      WICK_TIP.clone()
    ]);
    const wickGeo = new THREE.TubeGeometry(wickCurve, 20, 0.0022, 10, false);
    const wickMat = new THREE.MeshStandardMaterial({
      color: 0x141414,          // Charcoal black braided cotton
      roughness: 0.95,
      metalness: 0.05
    });
    const wick = new THREE.Mesh(wickGeo, wickMat);
    candleGroup.add(wick);

    // 5. Glowing Carbon Ember Tip (Incandescent reaction zone at the single wick tip)
    const tipGeo = new THREE.SphereGeometry(0.0025, 12, 12);
    const tipEmberMat = new THREE.MeshBasicMaterial({ color: 0xff3800 });
    const tipEmber = new THREE.Mesh(tipGeo, tipEmberMat);
    tipEmber.position.copy(WICK_TIP);
    candleGroup.add(tipEmber);

    // 6. Dynamic Flame Point Light (Anchored right above wick tip)
    const candleLight = new THREE.PointLight(0xff9933, isRoom ? 2.6 : 1.8, isRoom ? 3.5 : 2.0, 2.0);
    candleLight.position.set(WICK_TIP.x, WICK_TIP.y + 0.015, WICK_TIP.z);
    candleGroup.add(candleLight);

    // 7. SINGLE COHESIVE CANDLE FLAME SYSTEM (Anchored precisely to WICK_TIP with zero gap)
    const flameGeo = this.createCandleFlameGeometry();
    const flameMat = this.createCandleFlameMaterial(isRoom);
    const flameMesh = new THREE.Mesh(flameGeo, flameMat);
    flameMesh.position.copy(WICK_TIP);
    flameMesh.renderOrder = 999;
    candleGroup.add(flameMesh);

    const candleData = {
      candleGroup,
      wickTip: WICK_TIP,
      flameMesh,
      flameMat,
      light: candleLight,
      ember: tipEmber,
      tipEmberMat,
      isRoom
    };

    this.candleInstances.push(candleData);

    return candleData;
  }

  // =========================================================================
  // 8C. CORRIDOR ROOM CANDLE WORKSTATION (Photorealistic Science Island)
  // =========================================================================
  buildRoomCandleWorkstation() {
    const stationGroup = new THREE.Group();
    // Positioned right in the corridor, in clear view from default corridor camera
    const stationX = 0.38;
    const stationY = -1.52; // Anchored to diamond plate floor
    const stationZ = -2.20;
    stationGroup.position.set(stationX, stationY, stationZ);

    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.85,
      roughness: 0.25
    });

    const brushedMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.90,
      roughness: 0.20
    });

    const tableTopMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.80,
      roughness: 0.30
    });

    // 1. Heavy Weighted Base Flange bolted to ISS floor restraint tracks
    const baseGeo = new THREE.CylinderGeometry(0.24, 0.26, 0.04, 32);
    const baseMesh = new THREE.Mesh(baseGeo, metalMat);
    baseMesh.position.y = 0.02;
    stationGroup.add(baseMesh);

    // Bolting lugs
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      const lug = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.02, 12), brushedMat);
      lug.position.set(Math.cos(ang) * 0.21, 0.045, Math.sin(ang) * 0.21);
      stationGroup.add(lug);
    }

    // 2. Telescopic Stanchion Column (Waist height, 1.05m tall)
    const colGeo = new THREE.CylinderGeometry(0.05, 0.065, 1.02, 32);
    const colMesh = new THREE.Mesh(colGeo, brushedMat);
    colMesh.position.y = 0.55;
    stationGroup.add(colMesh);

    // Cable wrap / conduit coil around stanchion
    const ringGeo = new THREE.TorusGeometry(0.068, 0.008, 12, 32);
    [0.25, 0.50, 0.75].forEach(ry => {
      const ring = new THREE.Mesh(ringGeo, metalMat);
      ring.position.y = ry;
      ring.rotation.x = Math.PI / 2;
      stationGroup.add(ring);
    });

    // 3. Milled Octagonal Aerospace Instrument Table Top (0.50m across, 0.035m thick)
    const tableGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.035, 8);
    const tableMesh = new THREE.Mesh(tableGeo, tableTopMat);
    tableMesh.position.y = 1.08;
    stationGroup.add(tableMesh);

    // Technical M6 Optical Breadboard Grid Plate on top
    const breadboardMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.23, 0.23, 0.008, 16),
      new THREE.MeshStandardMaterial({ map: this.textures.breadboard, roughness: 0.35, metalness: 0.75 })
    );
    breadboardMesh.position.y = 1.102;
    stationGroup.add(breadboardMesh);

    // Hazard Caution Ring Border around table edge
    const hazardRing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.262, 0.262, 0.012, 8, 1, true),
      new THREE.MeshStandardMaterial({ map: this.textures.hazardStripe, roughness: 0.4 })
    );
    hazardRing.position.y = 1.08;
    stationGroup.add(hazardRing);

    // 4. Mount Candle Apparatus onto the workstation table top (Open flame, glass shield removed)
    const roomCandle = this.createCandleApparatus(true);
    roomCandle.candleGroup.position.set(0, 1.11, 0);
    stationGroup.add(roomCandle.candleGroup);
    this.roomCandleGroup = roomCandle.candleGroup;

    this.rootGroup.add(stationGroup);
  }

  // =========================================================================
  // 9. BULKHEADS & HATCHWAYS (Both Ends of the Module)
  // =========================================================================
  buildBulkheadAndHatches() {
    const bulkheadMat = new THREE.MeshStandardMaterial({
      color: 0xd8dfe6,
      roughness: 0.45,
      metalness: 0.35,
      side: THREE.DoubleSide
    });

    const hatchMat = new THREE.MeshStandardMaterial({
      map: this.textures.hatchDoor,
      roughness: 0.35,
      metalness: 0.65
    });

    // --- AFT BULKHEAD (Z = -5.99m) [Closed Hatch] ---
    // Single solid aft bulkhead wall
    const aftWall = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 3.8), bulkheadMat);
    aftWall.position.set(0, 0, -5.99);
    this.rootGroup.add(aftWall);

    // Aft Hatch Door (Firmly offset forward to Z = -5.96m to eliminate ANY depth conflict)
    const aftHatch = new THREE.Mesh(new THREE.CircleGeometry(0.95, 36), hatchMat);
    aftHatch.position.set(0, 0, -5.96);
    this.rootGroup.add(aftHatch);

    // Hazard Stripes around Door Threshold (Offset forward to Z = -5.94m)
    const stripeMat = new THREE.MeshBasicMaterial({ map: this.textures.hazardStripe });
    const threshold = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 0.12), stripeMat);
    threshold.position.set(0, -1.48, -5.94);
    this.rootGroup.add(threshold);

    // --- FORWARD BULKHEAD (Z = +5.98m) [Panoramic Deep Space Observation Window & Stars] ---
    // 1. Bulkhead Wall with Large Circular Observation Aperture (r = 1.15m)
    const fwdShape = new THREE.Shape();
    fwdShape.moveTo(-2.1, -1.9);
    fwdShape.lineTo(2.1, -1.9);
    fwdShape.lineTo(2.1, 1.9);
    fwdShape.lineTo(-2.1, 1.9);
    fwdShape.closePath();

    // Large circular portal cutout (r = 1.15m) for panoramic space view
    const portalHole = new THREE.Path();
    portalHole.absarc(0, 0, 1.15, 0, Math.PI * 2, true);
    fwdShape.holes.push(portalHole);

    const fwdWallGeo = new THREE.ShapeGeometry(fwdShape, 48);
    const fwdWall = new THREE.Mesh(fwdWallGeo, bulkheadMat);
    fwdWall.rotation.y = Math.PI;
    fwdWall.position.set(0, 0, 5.98);
    this.rootGroup.add(fwdWall);

    // 2. Heavy-Duty Machined Titanium Beveled Window Frame Outer Rim
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x222a36,
      roughness: 0.32,
      metalness: 0.85
    });
    const outerRim = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.075, 16, 48), rimMat);
    outerRim.position.set(0, 0, 5.95);
    this.rootGroup.add(outerRim);

    // Inner Retention Seal Bezel
    const innerRimMat = new THREE.MeshStandardMaterial({
      color: 0x3d4754,
      roughness: 0.28,
      metalness: 0.90
    });
    const innerRim = new THREE.Mesh(new THREE.TorusGeometry(1.08, 0.035, 12, 48), innerRimMat);
    innerRim.position.set(0, 0, 5.955);
    this.rootGroup.add(innerRim);

    // 24 Machined Aerospace Socket-Head Hex Fasteners around perimeter (InstancedMesh for 1 draw call)
    const hexBoltMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.95, roughness: 0.18 });
    const hexBoltGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.02, 6);
    const boltInstanced = new THREE.InstancedMesh(hexBoltGeo, hexBoltMat, 24);
    const dummyMat = new THREE.Matrix4();
    const dummyPos = new THREE.Vector3();
    const dummyQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
    const dummyScale = new THREE.Vector3(1, 1, 1);
    for (let b = 0; b < 24; b++) {
      const bAngle = (b / 24) * Math.PI * 2;
      dummyPos.set(Math.cos(bAngle) * 1.18, Math.sin(bAngle) * 1.18, 5.95);
      dummyMat.compose(dummyPos, dummyQuat, dummyScale);
      boltInstanced.setMatrixAt(b, dummyMat);
    }
    boltInstanced.instanceMatrix.needsUpdate = true;
    this.rootGroup.add(boltInstanced);

    // 3. Multi-Layer Fused Silica Optical Window Glass Pane
    const windowGlass = new THREE.Mesh(
      new THREE.CircleGeometry(1.08, 64),
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transmission: 0.98,
        roughness: 0.04,
        metalness: 0.08,
        ior: 1.50,
        thickness: 0.03,
        transparent: true,
        opacity: 0.22,
        specularIntensity: 1.0
      })
    );
    windowGlass.rotation.y = Math.PI;
    windowGlass.position.set(0, 0, 5.96);
    this.rootGroup.add(windowGlass);

    // Optical Anti-Reflective Glare Ring
    const glareRing = new THREE.Mesh(
      new THREE.RingGeometry(0.85, 1.06, 64),
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.05,
        side: THREE.DoubleSide
      })
    );
    glareRing.position.set(0, 0, 5.958);
    this.rootGroup.add(glareRing);

    // 4. Observation Window Safety Caution Placard
    const warningPlate = new THREE.Mesh(
      new THREE.PlaneGeometry(0.55, 0.06),
      new THREE.MeshBasicMaterial({ color: 0xffb800 })
    );
    warningPlate.position.set(0, 1.26, 5.95);
    this.rootGroup.add(warningPlate);

    // 5. Curved NASA Anodized Blue Crew Handrail below window for astronaut stargazing
    const handrailMat = new THREE.MeshStandardMaterial({
      color: 0x0066ee,
      roughness: 0.20,
      metalness: 0.85
    });
    const crewRail = new THREE.Mesh(
      new THREE.TorusGeometry(1.24, 0.016, 12, 32, Math.PI * 0.7),
      handrailMat
    );
    crewRail.rotation.z = Math.PI * 1.15;
    crewRail.position.set(0, 0, 5.91);
    this.rootGroup.add(crewRail);

    // Handrail mounting stanchions
    [-0.45, 0.0, 0.45].forEach(rx => {
      const stanchion = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 0.07, 12),
        innerRimMat
      );
      stanchion.rotation.x = Math.PI / 2;
      stanchion.position.set(rx, -1.02, 5.94);
      this.rootGroup.add(stanchion);
    });

    // 6. Photorealistic High-Altitude Orbital Observation Backdrop (36880.png)
    // Depicting real deep space stars, electric-blue atmospheric limb, and Earth's topography
    const texLoader = new THREE.TextureLoader();
    const spaceTex = texLoader.load('/36880.png', (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.needsUpdate = true;
    });
    spaceTex.colorSpace = THREE.SRGBColorSpace;

    // Sized to native 927:1648 aspect ratio (5.4m x 9.6m).
    // The atmospheric horizon in 36880.png is at y = 740px from top (55.1% from bottom).
    // Placing the quad center at Y = -0.65m perfectly positions the glowing blue atmospheric limb
    // across the lower-center of the circular window aperture (Y = -0.16m), framing deep starry space
    // above and majestic snow-capped mountain terrain below.
    const skyGeo = new THREE.PlaneGeometry(5.4, 9.6);
    const skyMat = new THREE.MeshBasicMaterial({
      map: spaceTex,
      side: THREE.DoubleSide
    });
    const skyQuad = new THREE.Mesh(skyGeo, skyMat);
    // Unrotated so horizontal and vertical orientation match the original photograph
    skyQuad.position.set(0, -0.65, 6.45);
    this.rootGroup.add(skyQuad);
  }

  // =========================================================================
  // 10. ICONIC BLUE ANODIZED CREW HANDRAILS (Image 1 & Image 3)
  // =========================================================================
  buildCrewHandrails() {
    // Beautiful royal-blue metallic anodized finish
    const railMat = new THREE.MeshStandardMaterial({
      color: 0x0066ee,
      roughness: 0.20,
      metalness: 0.85
    });

    const standoffMat = new THREE.MeshStandardMaterial({
      color: 0x242c36,
      roughness: 0.3,
      metalness: 0.9
    });

    const railRadius = 0.016;
    const railLength = 0.88;

    // Mount handrails directly onto structural ISPR vertical rack posts (Instanced for 60fps)
    const railPositionsZ = [-4.475, -2.375, -0.275, 0.775, 2.875, 4.975];
    const rails = [];
    railPositionsZ.forEach(z => {
      // Vertical blue handrail on Left Wall post (skip glovebox bay so glovebox is completely clean and unobstructed)
      if (Math.abs(z - (-0.275)) > 0.05 && Math.abs(z - (-1.325)) > 0.05) {
        rails.push({ x: -1.57, y: 0.20, z, rotY: 0 });
      }

      // Vertical blue handrail on Right Wall post
      rails.push({ x: 1.57, y: 0.20, z, rotY: Math.PI });
    });

    const barMatrices = [];
    const studMatrices = [];

    const parent = new THREE.Object3D();
    const dBar = new THREE.Object3D();
    parent.add(dBar);

    const dStud1 = new THREE.Object3D();
    dStud1.rotation.z = Math.PI / 2;
    dStud1.position.set(-0.035, railLength * 0.45, 0);
    parent.add(dStud1);

    const dStud2 = new THREE.Object3D();
    dStud2.rotation.z = Math.PI / 2;
    dStud2.position.set(-0.035, -railLength * 0.45, 0);
    parent.add(dStud2);

    rails.forEach(r => {
      parent.position.set(r.x, r.y, r.z);
      parent.rotation.set(0, r.rotY, 0);
      parent.updateMatrixWorld(true);

      barMatrices.push(dBar.matrixWorld.clone());
      studMatrices.push(dStud1.matrixWorld.clone());
      studMatrices.push(dStud2.matrixWorld.clone());
    });

    const barGeo = new THREE.CylinderGeometry(railRadius, railRadius, railLength, 16);
    const barInst = new THREE.InstancedMesh(barGeo, railMat, barMatrices.length);
    barMatrices.forEach((mat, i) => barInst.setMatrixAt(i, mat));
    barInst.instanceMatrix.needsUpdate = true;
    this.rootGroup.add(barInst);

    const studGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.065, 12);
    const studInst = new THREE.InstancedMesh(studGeo, standoffMat, studMatrices.length);
    studMatrices.forEach((mat, i) => studInst.setMatrixAt(i, mat));
    studInst.instanceMatrix.needsUpdate = true;
    this.rootGroup.add(studInst);
  }

  // =========================================================================
  // 11. CARGO TRANSFER BAGS (CTBs) & ELASTIC RESTRAINTS (Authentic Flight Stowage)
  // =========================================================================
  buildCargoTransferBags() {
    const ctbMat = new THREE.MeshStandardMaterial({
      map: this.textures.ctb,
      roughness: 0.75,
      metalness: 0.10
    });

    const ctbGeo = new THREE.BoxGeometry(0.48, 0.28, 0.42);

    // Place CTBs inside dedicated payload rack stowage bays (grounded inside racks)
    const ctb1 = new THREE.Mesh(ctbGeo, ctbMat);
    ctb1.position.set(1.62, 0.68, -2.90);
    this.rootGroup.add(ctb1);

    const ctb2 = new THREE.Mesh(ctbGeo, ctbMat);
    ctb2.position.set(1.62, 0.68, -3.45);
    this.rootGroup.add(ctb2);

    const ctb3 = new THREE.Mesh(ctbGeo, ctbMat);
    ctb3.position.set(-1.62, 0.68, 2.35);
    this.rootGroup.add(ctb3);

    const ctb4 = new THREE.Mesh(ctbGeo, ctbMat);
    ctb4.position.set(-1.62, 0.68, 2.90);
    this.rootGroup.add(ctb4);
  }

  // =========================================================================
  // 12. LAPTOPS & WORKSTATION GEAR & FLIGHT ARTIFACTS
  // =========================================================================
  buildLaptopsAndScienceGear() {
    // 1. Halon Fire Extinguisher firmly bolted to starboard structural rack post at Z = 0.775
    const extGroup = new THREE.Group();
    extGroup.position.set(1.59, -0.35, 0.775);

    // Wall mounting bracket firmly bolted to post
    const bracketMat = new THREE.MeshStandardMaterial({ color: 0x222933, roughness: 0.4, metalness: 0.8 });
    const bracketBack = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.44, 0.16), bracketMat);
    bracketBack.position.set(0.015, 0, 0);
    extGroup.add(bracketBack);

    // Upper and lower metal retention straps with release buckle
    const strapMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.2 });
    [-0.12, 0.10].forEach(sy => {
      const strap = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.008, 8, 24, Math.PI), strapMat);
      strap.position.set(-0.04, sy, 0);
      strap.rotation.y = -Math.PI / 2;
      extGroup.add(strap);
    });

    // Fire extinguisher red cylinder
    const extBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.065, 0.38, 20),
      new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.28, metalness: 0.5 })
    );
    extBody.position.set(-0.05, 0, 0);
    extGroup.add(extBody);

    // Pressure gauge & trigger handle
    const extHead = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.08, 12),
      new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.9, roughness: 0.2 })
    );
    extHead.position.set(-0.05, 0.22, 0);
    extGroup.add(extHead);

    const gauge = new THREE.Mesh(
      new THREE.CircleGeometry(0.016, 12),
      new THREE.MeshBasicMaterial({ color: 0x22c55e })
    );
    gauge.rotation.y = -Math.PI / 2;
    gauge.position.set(-0.082, 0.22, 0);
    extGroup.add(gauge);

    this.rootGroup.add(extGroup);

    // 3. Crew Flight Operations Checklist Folder attached to rack via Velcro
    const manualGroup = new THREE.Group();
    manualGroup.position.set(-1.58, -0.32, 0.25);

    const binderMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.6, metalness: 0.1 });
    const binder = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.28, 0.22), binderMat);
    manualGroup.add(binder);

    // Label on spine/face
    const labelMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.24, 0.08),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    labelMesh.rotation.y = Math.PI / 2;
    labelMesh.position.set(0.012, 0.06, 0);
    manualGroup.add(labelMesh);

    this.rootGroup.add(manualGroup);

    // 4. Bulkhead Emergency Breathing Apparatus (PBE Container on Aft Wall)
    const pbeBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.44, 0.16),
      new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.35, metalness: 0.4 })
    );
    pbeBox.position.set(0.92, -0.22, -5.91);
    this.rootGroup.add(pbeBox);

    // PBE Hazard Stencil
    const pbeLabel = new THREE.Mesh(
      new THREE.PlaneGeometry(0.28, 0.12),
      new THREE.MeshBasicMaterial({ map: this.textures.hazardStripe })
    );
    pbeLabel.position.set(0.92, -0.15, -5.82);
    this.rootGroup.add(pbeLabel);
  }

  createFlightLaptopScreenTexture() {
    this.laptopScreenCanvas = document.createElement('canvas');
    this.laptopScreenCanvas.width = 512;
    this.laptopScreenCanvas.height = 320;
    this.laptopScreenCtx = this.laptopScreenCanvas.getContext('2d');
    this.laptopScreenTexture = new THREE.CanvasTexture(this.laptopScreenCanvas);
    this.updateLaptopScreen();
    return this.laptopScreenTexture;
  }

  updateLaptopScreen() {
    if (!this.laptopScreenCtx || !this.laptopScreenTexture) return;
    const ctx = this.laptopScreenCtx;
    const o2 = this.oxygenLevel.toFixed(1);
    const rpm = Math.round(this.currentFanSpeed * 9.55);
    const apertureDeg = Math.round((this.targetLouverAngle * 180) / Math.PI);

    if (this.currentLightingMode === 'emergency') {
      ctx.fillStyle = '#160404';
      ctx.fillRect(0, 0, 512, 320);

      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 15px monospace';
      ctx.fillText('[EMERGENCY] RED ALERT // EMERGENCY PROTOCOL ACTIVE', 18, 30);

      ctx.fillStyle = '#f87171';
      ctx.font = '12px monospace';
      ctx.fillText(`CABIN PRESSURE: 101.3 kPa // OXYGEN: ${o2}%`, 18, 56);
      ctx.fillText(`VENTILATION: EMERGENCY ISOLATION // ${rpm} RPM`, 18, 76);

      ctx.fillStyle = '#dc2626';
      ctx.fillRect(18, 100, 476, 26);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('WARNING: HAZARDOUS COMBUSTION / LIFE SUPPORT ALARM', 26, 118);

      // Warning alert wave
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(18, 200);
      for (let x = 18; x < 490; x += 10) {
        const y = 200 + Math.sin(x * 0.1) * 25;
        ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.fillStyle = '#fca5a5';
      ctx.fillText('ALL CREW VERIFY PBE MASKS & REPORT TO HATCH 08', 18, 260);

      this.laptopScreenTexture.needsUpdate = true;
      return;
    }

    ctx.fillStyle = '#0a101a';
    ctx.fillRect(0, 0, 512, 320);

    ctx.fillStyle = '#00d2ff';
    ctx.font = 'bold 15px monospace';
    ctx.fillText('NASA ISS // COLUMBUS LAB TELEMETRY', 18, 30);

    const isHypoxia = this.oxygenLevel < 14.0;
    const isWarn = this.oxygenLevel < 19.5 || this.oxygenLevel > 35.0;
    ctx.fillStyle = isHypoxia ? '#ef4444' : (isWarn ? '#f59e0b' : '#4ade80');
    ctx.font = '12px monospace';
    const statusText = isHypoxia ? 'ALERT: HYPOXIA' : (isWarn ? 'CAUTION: OFF-NOMINAL' : 'STATUS: NOMINAL');
    ctx.fillText(`${statusText} // ECLSS 101.3 kPa`, 18, 56);
    ctx.fillText(`OXYGEN: ${o2}% | VENT TURBINE: ${rpm} RPM | 21.8°C`, 18, 76);

    // Live oscillogram curve
    ctx.strokeStyle = isHypoxia ? '#ef4444' : '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(18, 160);
    const freq = 0.04 + (this.oxygenLevel / 100.0) * 0.06;
    for (let x = 18; x < 490; x += 10) {
      const y = 160 + Math.sin(x * freq) * 35 + Math.cos(x * 0.12) * 12;
      ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    ctx.fillText(`CEILING DIFFUSERS: ${apertureDeg}° APERTURE // O2 INLET`, 18, 250);

    this.laptopScreenTexture.needsUpdate = true;
  }

  // =========================================================================
  // 13. OXYGEN FLOW & VENTILATION ADJUSTMENT (ECLSS)
  // =========================================================================
  setOxygenLevel(percent) {
    this.oxygenLevel = Math.max(0, Math.min(100, percent));
    this.flamePhysicsParams.o2_pct = this.oxygenLevel;

    // Automated Emergency Mode Activation:
    // When room oxygen goes down to 10% or less, activate emergency mode.
    // When it goes above 10%, return to normal (nominal or base mode).
    if (this.oxygenLevel <= 10.0) {
      if (this.currentLightingMode !== 'emergency') {
        this.setLightingMode('emergency');
      }
    } else {
      if (this.currentLightingMode === 'emergency') {
        this.setLightingMode(this.baseLightingMode || 'nominal');
      }
    }

    // Louver angle calculation:
    // 0% -> 0.02 rad (almost completely sealed)
    // 21% -> 0.42 rad (~24 deg nominal)
    // 100% -> 1.30 rad (~74.5 deg wide open)
    const norm = this.oxygenLevel / 100.0;
    this.targetLouverAngle = 0.02 + Math.pow(norm, 0.75) * 1.28;

    // Turbine fan speed calculation:
    // 0% -> 0.2 rad/s (standstill / idle creep)
    // 21% -> 18.0 rad/s (~172 RPM)
    // 100% -> 60.0 rad/s (~573 RPM)
    this.targetFanSpeed = 0.2 + norm * 58.0;

    // Status LED and Air Mist Tint
    let ledColor = 0x00e5ff; // Nominal cyan
    let mistColor = 0xe5eef7;
    if (this.oxygenLevel < 14.0) {
      ledColor = 0xef4444; // Emergency red
      mistColor = 0xfecaca;
    } else if (this.oxygenLevel < 19.5) {
      ledColor = 0xf59e0b; // Caution amber
      mistColor = 0xfef3c7;
    } else if (this.oxygenLevel > 30.0) {
      ledColor = 0x3b82f6; // High-energy electric blue
      mistColor = 0xdbeafe;
    }

    this.ventLedMaterials.forEach(mat => {
      mat.color.setHex(ledColor);
    });

    // Update physical airflow streamlines opacity
    const streamOpacity = norm < 0.02 ? 0.0 : Math.min(0.38, 0.05 + norm * 0.33);
    this.streamlineMeshes.forEach(mesh => {
      mesh.material.opacity = streamOpacity;
    });

    if (this.vaporMaterial) {
      this.vaporMaterial.opacity = norm < 0.02 ? 0.0 : Math.min(0.26, 0.06 + norm * 0.20);
      this.vaporMaterial.color.setHex(mistColor);
    }

    this.updateLaptopScreen();
  }

  // =========================================================================
  // 14. LIGHTING MODES (Nominal Laboratory, Crew Sleep, Emergency Caution)
  // =========================================================================
  setLightingMode(mode) {
    if (mode !== 'emergency') {
      this.baseLightingMode = mode;
    }
    this.currentLightingMode = mode;
    if (mode === 'nominal') {
      // Full bright daylight operations (5500K)
      this.ambientLight.color.setRGB(0.85, 0.90, 0.98);
      this.ambientLight.intensity = 1.25;

      this.lights.forEach(l => {
        if (l.isPointLight) {
          l.color.setRGB(0.95, 0.97, 1.0);
          l.intensity = 1.4;
        } else if (l.isDirectionalLight) {
          l.color.setRGB(0.96, 0.97, 1.0);
          l.intensity = 1.0;
        }
      });

      this.stripLightMaterials.forEach(m => m.color.setHex(0xf8fbff));
      if (this.gloveboxLight) {
        this.gloveboxLight.color.setHex(0x88ccff);
        this.gloveboxLight.intensity = 2.2;
      }
      if (this.hatchGlow) {
        this.hatchGlow.color.setHex(0x60a5fa);
        this.hatchGlow.intensity = 1.2;
      }
      // Restore vent LEDs to nominal
      const isWarn = this.oxygenLevel < 19.5;
      this.ventLedMaterials.forEach(mat => {
        mat.color.setHex(isWarn ? 0xf59e0b : 0x00ff88);
      });
    } else if (mode === 'sleep') {
      // Crew Sleep Mode (Dim night lighting)
      this.ambientLight.color.setRGB(0.12, 0.16, 0.28);
      this.ambientLight.intensity = 0.35;

      this.lights.forEach(l => {
        if (l.isPointLight) {
          l.color.setRGB(0.2, 0.3, 0.6);
          l.intensity = 0.25;
        } else if (l.isDirectionalLight) {
          l.color.setRGB(0.1, 0.2, 0.4);
          l.intensity = 0.2;
        }
      });

      this.stripLightMaterials.forEach(m => m.color.setHex(0x224488));
      if (this.gloveboxLight) {
        this.gloveboxLight.color.setHex(0x38bdf8);
        this.gloveboxLight.intensity = 0.4;
      }
      if (this.hatchGlow) {
        this.hatchGlow.color.setHex(0x38bdf8);
        this.hatchGlow.intensity = 0.8;
      }
      this.ventLedMaterials.forEach(mat => {
        mat.color.setHex(0x0284c7);
      });
    } else if (mode === 'emergency') {
      // Emergency Red Alert Hazard Mode (Instant glowing red alert wash)
      this.ambientLight.color.setRGB(0.85, 0.03, 0.03);
      this.ambientLight.intensity = 0.95;

      this.lights.forEach(l => {
        if (l.isPointLight) {
          l.color.setRGB(1.0, 0.03, 0.03);
          l.intensity = 2.2;
        } else if (l.isDirectionalLight) {
          l.color.setRGB(0.92, 0.02, 0.02);
          l.intensity = 0.8;
        }
      });

      this.stripLightMaterials.forEach(m => m.color.setRGB(1.0, 0.04, 0.04));
      if (this.gloveboxLight) {
        this.gloveboxLight.color.setRGB(1.0, 0.04, 0.04);
        this.gloveboxLight.intensity = 2.4;
      }
      if (this.hatchGlow) {
        this.hatchGlow.color.setRGB(1.0, 0.08, 0.16);
        this.hatchGlow.intensity = 1.6;
      }
      this.ventLedMaterials.forEach(mat => {
        mat.color.setRGB(1.0, 0.02, 0.02);
      });
    }

    this.updateLaptopScreen();
  }

  // =========================================================================
  // 13. REAL PHYSICS INTERACTIVE DAILY OBJECTS (Apple, Drink Pouch, Tablet, Flask, Tool)
  // =========================================================================
  buildPhysicsObjects() {
    this.physicsObjects = [];

    // Helper to register physics object
    const registerObj = (mesh, x, y, z, r, mass, restitution = 0.58) => {
      mesh.position.set(x, y, z);
      this.rootGroup.add(mesh);

      const physObj = {
        mesh,
        pos: new THREE.Vector3(x, y, z),
        vel: new THREE.Vector3(0, 0, 0),
        rot: new THREE.Euler(0, 0, 0),
        rotVel: new THREE.Vector3(
          (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.4
        ),
        radius: r,
        mass,
        restitution,
        nominalPos: new THREE.Vector3(x, y, z),
        hoverPhase: Math.random() * Math.PI * 2,
        hoverFreq: 0.8 + Math.random() * 0.5
      };

      mesh.traverse(child => {
        if (child.isMesh) {
          child.userData = { isPhysicsObject: true, physIndex: this.physicsObjects.length };
        }
      });

      this.physicsObjects.push(physObj);
      return physObj;
    };

    // 1. Fresh Resupply Honeycrisp Apple (Crisp red fruit from cargo resupply)
    const appleGroup = new THREE.Group();
    const appleGeo = new THREE.SphereGeometry(0.044, 24, 20);
    appleGeo.scale(1.0, 0.94, 1.0);
    const appleMat = new THREE.MeshPhysicalMaterial({
      color: 0xcc181e,
      roughness: 0.28,
      metalness: 0.04,
      clearcoat: 0.45,
      clearcoatRoughness: 0.15
    });
    const appleMesh = new THREE.Mesh(appleGeo, appleMat);
    appleGroup.add(appleMesh);

    const stemGeo = new THREE.CylinderGeometry(0.0018, 0.0022, 0.018, 8);
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x4a2e18, roughness: 0.8 });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.set(0, 0.043, 0);
    stem.rotation.z = 0.2;
    appleGroup.add(stem);
    registerObj(appleGroup, -0.15, 0.15, -0.25, 0.048, 0.18, 0.55);

    // 2. NASA Astronaut Hydration Drink Pouch (Foil pouch with valve straw)
    const pouchGroup = new THREE.Group();
    const pouchGeo = new THREE.BoxGeometry(0.10, 0.16, 0.035);
    const pouchMat = new THREE.MeshStandardMaterial({
      color: 0xd4d4d8,
      metalness: 0.85,
      roughness: 0.22
    });
    const pouchBody = new THREE.Mesh(pouchGeo, pouchMat);
    pouchGroup.add(pouchBody);

    const labelMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
    const labelMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.05), labelMat);
    labelMesh.position.set(0, 0, 0.0185);
    pouchGroup.add(labelMesh);

    const strawGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.045, 10);
    const strawMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.4 });
    const straw = new THREE.Mesh(strawGeo, strawMat);
    straw.position.set(0, 0.095, 0);
    straw.rotation.z = -0.15;
    pouchGroup.add(straw);
    registerObj(pouchGroup, 0.22, 0.05, -0.65, 0.08, 0.22, 0.50);

    // 3. Crew Flight Operations Digital Tablet (Carbon case with diagnostic screen)
    const tabletGroup = new THREE.Group();
    const tabGeo = new THREE.BoxGeometry(0.20, 0.26, 0.015);
    const tabMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      metalness: 0.70,
      roughness: 0.35
    });
    const tabBody = new THREE.Mesh(tabGeo, tabMat);
    tabletGroup.add(tabBody);

    const screenMat = new THREE.MeshBasicMaterial({ color: 0x0ea5e9 });
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.22), screenMat);
    screen.position.set(0, 0, 0.0085);
    tabletGroup.add(screen);
    registerObj(tabletGroup, -0.32, -0.05, -1.15, 0.13, 0.45, 0.42);

    // 4. Anodized Spun Aluminum Water Flask (Silicone grip, carabiner loop cap)
    const flaskGroup = new THREE.Group();
    const flaskGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.18, 24);
    const flaskMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      metalness: 0.88,
      roughness: 0.20
    });
    const flaskBody = new THREE.Mesh(flaskGeo, flaskMat);
    flaskGroup.add(flaskBody);

    const gripGeo = new THREE.CylinderGeometry(0.036, 0.036, 0.065, 24);
    const gripMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.85 });
    const grip = new THREE.Mesh(gripGeo, gripMat);
    flaskGroup.add(grip);

    const capGeo = new THREE.CylinderGeometry(0.022, 0.024, 0.028, 20);
    const capMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.95, roughness: 0.15 });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 0.10;
    flaskGroup.add(cap);
    registerObj(flaskGroup, 0.28, -0.18, -0.05, 0.09, 0.35, 0.62);

    // 5. ISS Metric Titanium Torque Multitool
    const toolGroup = new THREE.Group();
    const toolMat = new THREE.MeshStandardMaterial({
      color: 0xa1a1aa,
      metalness: 0.95,
      roughness: 0.18
    });
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.18, 16), toolMat);
    toolGroup.add(shaft);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.025, 0.045), toolMat);
    head.position.set(0, 0.09, 0.012);
    toolGroup.add(head);

    const knurlMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46, metalness: 0.8, roughness: 0.7 });
    const knurl = new THREE.Mesh(new THREE.CylinderGeometry(0.010, 0.010, 0.08, 16), knurlMat);
    knurl.position.set(0, -0.04, 0);
    toolGroup.add(knurl);
    registerObj(toolGroup, 0.08, -0.25, -1.65, 0.09, 0.30, 0.58);
  }

  // Physics Manipulation Actions
  nudgeObjects() {
    this.physicsObjects.forEach(obj => {
      // Upward impulse + random lateral throw
      obj.vel.y += 1.8 + Math.random() * 1.6;
      obj.vel.x += (Math.random() - 0.5) * 1.5;
      obj.vel.z += (Math.random() - 0.5) * 1.5;
      obj.rotVel.x += (Math.random() - 0.5) * 5.0;
      obj.rotVel.y += (Math.random() - 0.5) * 5.0;
      obj.rotVel.z += (Math.random() - 0.5) * 5.0;
    });
  }

  resetObjects() {
    this.physicsObjects.forEach(obj => {
      obj.pos.copy(obj.nominalPos);
      obj.vel.set(0, 0, 0);
      obj.rot.set(0, 0, 0);
      obj.rotVel.set(
        (Math.random() - 0.5) * 0.4,
        (Math.random() - 0.5) * 0.4,
        (Math.random() - 0.5) * 0.4
      );
      obj.mesh.position.copy(obj.pos);
      obj.mesh.rotation.copy(obj.rot);
    });
  }

  applyImpulseToObject(index, dir, strength = 2.5) {
    if (this.physicsObjects[index]) {
      const obj = this.physicsObjects[index];
      obj.vel.addScaledVector(dir, strength / obj.mass);
      obj.rotVel.add(new THREE.Vector3(
        (Math.random() - 0.5) * 4.0,
        (Math.random() - 0.5) * 4.0,
        (Math.random() - 0.5) * 4.0
      ));
    }
  }

  interactWithObject(raycaster) {
    if (!this.physicsObjects || this.physicsObjects.length === 0) return;
    const meshes = this.physicsObjects.map(o => o.mesh);
    const intersects = raycaster.intersectObjects(meshes, true);
    if (intersects.length > 0) {
      let hitMesh = intersects[0].object;
      while (hitMesh && !hitMesh.userData.isPhysicsObject && hitMesh.parent && hitMesh.parent !== this.rootGroup) {
        hitMesh = hitMesh.parent;
      }
      const idx = hitMesh?.userData?.physIndex;
      if (idx !== undefined && this.physicsObjects[idx]) {
        const pushDir = raycaster.ray.direction.clone().normalize();
        pushDir.y += 0.35;
        pushDir.normalize();
        this.applyImpulseToObject(idx, pushDir, 2.8);
      }
    }
  }

  setGravity(g) {
    this.currentGravity = Math.max(0.0, Number(g));
    this.flamePhysicsParams.gravity_g = this.currentGravity;
  }

  setFlamePhysicsParams(params = {}) {
    Object.assign(this.flamePhysicsParams, params);
    if (params.gravity_g !== undefined) {
      this.currentGravity = Math.max(0.0, Number(params.gravity_g));
    }
  }

  updatePhysicsObjects(dt, time) {
    const isZeroG = this.currentGravity <= 0.005;
    const gAccel = this.currentGravity * 9.81; // m/s^2

    // Habitable cabin spatial boundaries for physical objects
    const minY = -1.48; // Floor deck
    const maxY = 1.48;  // Ceiling
    const minX = -1.35; // Port racks
    const maxX = 1.35;  // Starboard racks
    const minZ = -5.00; // Aft bulkhead
    const maxZ = 5.00;  // Forward window

    for (let i = 0; i < this.physicsObjects.length; i++) {
      const obj = this.physicsObjects[i];
      const r = obj.radius;

      if (!isZeroG) {
        // Under Gravity: fall downwards with Newtonian physics
        obj.vel.y -= gAccel * dt;

        // Aerodynamic cabin air drag
        obj.vel.x *= Math.pow(0.92, dt * 60);
        obj.vel.y *= Math.pow(0.96, dt * 60);
        obj.vel.z *= Math.pow(0.92, dt * 60);

        // Angular drag
        obj.rotVel.x *= Math.pow(0.94, dt * 60);
        obj.rotVel.y *= Math.pow(0.94, dt * 60);
        obj.rotVel.z *= Math.pow(0.94, dt * 60);

        // Position & rotation integration
        obj.pos.addScaledVector(obj.vel, dt);
        obj.rot.x += obj.rotVel.x * dt;
        obj.rot.y += obj.rotVel.y * dt;
        obj.rot.z += obj.rotVel.z * dt;

        // Floor collision & bounce
        const floorLimit = minY + r;
        if (obj.pos.y <= floorLimit) {
          obj.pos.y = floorLimit;
          if (obj.vel.y < 0) {
            obj.vel.y = -obj.vel.y * obj.restitution;
            if (Math.abs(obj.vel.y) < 0.08) {
              obj.vel.y = 0;
            }
          }
          // Ground friction
          obj.vel.x *= 0.82;
          obj.vel.z *= 0.82;
          obj.rotVel.x *= 0.75;
          obj.rotVel.z *= 0.75;
        }

        // Ceiling collision
        const ceilLimit = maxY - r;
        if (obj.pos.y >= ceilLimit) {
          obj.pos.y = ceilLimit;
          if (obj.vel.y > 0) obj.vel.y = -obj.vel.y * obj.restitution;
        }

        // Lateral walls collision
        if (obj.pos.x <= minX + r) {
          obj.pos.x = minX + r;
          if (obj.vel.x < 0) obj.vel.x = -obj.vel.x * obj.restitution;
        } else if (obj.pos.x >= maxX - r) {
          obj.pos.x = maxX - r;
          if (obj.vel.x > 0) obj.vel.x = -obj.vel.x * obj.restitution;
        }

        // Longitudinal bulkheads collision
        if (obj.pos.z <= minZ + r) {
          obj.pos.z = minZ + r;
          if (obj.vel.z < 0) obj.vel.z = -obj.vel.z * obj.restitution;
        } else if (obj.pos.z >= maxZ - r) {
          obj.pos.z = maxZ - r;
          if (obj.vel.z > 0) obj.vel.z = -obj.vel.z * obj.restitution;
        }
      } else {
        // Under Zero-G: free floating and gentle microgravity bobbing
        if (obj.vel.lengthSq() > 0.0001) {
          obj.pos.addScaledVector(obj.vel, dt);
          obj.rot.x += obj.rotVel.x * dt;
          obj.rot.y += obj.rotVel.y * dt;
          obj.rot.z += obj.rotVel.z * dt;

          // Drag in cabin air
          obj.vel.multiplyScalar(Math.pow(0.97, dt * 60));
          obj.rotVel.multiplyScalar(Math.pow(0.97, dt * 60));

          // Soft bouncing off boundaries in zero-g
          if (obj.pos.y <= minY + r || obj.pos.y >= maxY - r) {
            obj.vel.y *= -0.7;
            obj.pos.y = THREE.MathUtils.clamp(obj.pos.y, minY + r, maxY - r);
          }
          if (obj.pos.x <= minX + r || obj.pos.x >= maxX - r) {
            obj.vel.x *= -0.7;
            obj.pos.x = THREE.MathUtils.clamp(obj.pos.x, minX + r, maxX - r);
          }
          if (obj.pos.z <= minZ + r || obj.pos.z >= maxZ - r) {
            obj.vel.z *= -0.7;
            obj.pos.z = THREE.MathUtils.clamp(obj.pos.z, minZ + r, maxZ - r);
          }
        } else {
          // Zero-g serene equilibrium bobbing
          const bobY = Math.sin(time * obj.hoverFreq + obj.hoverPhase) * 0.0012;
          const bobX = Math.cos(time * obj.hoverFreq * 0.7 + obj.hoverPhase) * 0.0008;
          obj.pos.y += bobY;
          obj.pos.x += bobX;
          obj.rot.x += 0.001;
          obj.rot.y += 0.0014;
        }
      }

      // Sync Three.js transform
      obj.mesh.position.copy(obj.pos);
      obj.mesh.rotation.copy(obj.rot);
    }
  }

  // =========================================================================
  // 14. DYNAMIC CANDLE ILLUMINATION & SINGLE FLAME PHYSICS SYNCHRONIZATION
  // =========================================================================
  updateCandleFlame(time, dt) {
    if (!this.candleInstances || this.candleInstances.length === 0) return;

    const g = Math.max(0.0, this.flamePhysicsParams.gravity_g);
    const o2 = Math.max(0.0, this.flamePhysicsParams.o2_pct);
    const gRatio = Math.min(1.0, g);
    const o2Ratio = o2 / 21.0;

    // Convective flicker frequency: f = 11.5 * sqrt(g) Hz (0Hz in zero-g)
    const flickerFreq = 11.5 * Math.sqrt(gRatio);
    let flicker = 1.0;
    if (gRatio > 0.01) {
      flicker = 1.0 + (0.09 * Math.sqrt(gRatio) * Math.sin(time * flickerFreq * Math.PI * 2) +
                       0.04 * Math.sin(time * flickerFreq * 3.7));
    }

    // In low oxygen (< 10%), the flame completely goes out!
    const isExtinguished = (o2 < 10.0);

    for (let c = 0; c < this.candleInstances.length; c++) {
      const inst = this.candleInstances[c];
      const { light, ember, tipEmberMat, flameMat, flameMesh, isRoom } = inst;

      // 1. Control flame visibility & physics uniforms
      if (flameMesh) {
        flameMesh.visible = !isExtinguished;
      }

      if (flameMat && flameMat.uniforms) {
        flameMat.uniforms.u_time.value = time;
        flameMat.uniforms.u_gravity.value = gRatio;
        flameMat.uniforms.u_oxygenPct.value = o2;
        flameMat.uniforms.u_brightness.value = isRoom ? 1.55 : 1.40;
      }

      // 2. Synchronize dynamic firelight to flame physics (matching 1g vs 0g photos!)
      if (light) {
        if (isExtinguished) {
          // Flame is out: zero illumination
          light.intensity = 0.0;
        } else if (gRatio < 0.05) {
          // Microgravity ISS zero-g pure cobalt/sapphire blue luminescence (Right Photo)
          light.color.setRGB(0.10, 0.45, 1.0);
          light.intensity = (isRoom ? 2.4 : 1.6) * (0.8 + 0.2 * Math.min(1.2, o2Ratio));
        } else if (o2 > 40.0) {
          // Hyperoxic intense radiance
          light.color.setRGB(0.9, 0.96, 1.0);
          light.intensity = (isRoom ? 3.6 : 2.4) * flicker;
        } else {
          // Standard terrestrial / partial gravity golden amber firelight (Left Photo)
          light.color.setRGB(1.0, 0.65, 0.18);
          const baseIntensity = (isRoom ? 2.8 : 1.8) * Math.min(1.5, 0.6 + 0.4 * Math.sqrt(gRatio));
          light.intensity = baseIntensity * Math.min(1.4, o2Ratio) * flicker;
        }
      }

      // 3. Carbon ember tip glow
      if (tipEmberMat) {
        if (isExtinguished) {
          // Flame is out: smoldering dark crimson wick ember slowly fading
          const smolder = Math.max(0.0, (o2 - 2.0) / 8.0);
          tipEmberMat.color.setRGB(0.35 * smolder, 0.05 * smolder, 0.0);
        } else if (gRatio < 0.05) {
          // 0g ISS: cool wick tip inside pure blue dome
          tipEmberMat.color.setRGB(0.12, 0.25, 0.55);
        } else {
          // 1g active glowing incandescent ember tip
          const embPulse = 0.75 + 0.25 * Math.sin(time * (flickerFreq > 0 ? flickerFreq * 2.0 : 4.0));
          tipEmberMat.color.setRGB(0.95 * embPulse, 0.28 * embPulse, 0.0);
        }
      }

      if (ember) {
        if (isExtinguished) {
          ember.scale.setScalar(0.7);
        } else {
          ember.scale.setScalar(0.95 + 0.10 * Math.sin(time * 5.0));
        }
      }
    }
  }

  update(time, dt = 0.016) {
    const clampedDt = Math.min(dt || 0.016, 0.05);

    // 1. Lighting Control & Rhythmic Emergency Red Alert Pulse
    if (this.currentLightingMode === 'emergency') {
      // Dynamic Red Alert Pulse (Frequency ~0.65 Hz / ~1.5s period with natural bell curve swell)
      const alertWave = 0.5 + 0.5 * Math.sin(time * 4.2);
      const alertPulse = Math.pow(alertWave, 1.6); // 0.0 to 1.0

      // Ambient light breathes in rich ruby red
      if (this.ambientLight) {
        this.ambientLight.color.setRGB(0.70 + 0.30 * alertPulse, 0.02, 0.02);
        this.ambientLight.intensity = 0.45 + 0.70 * alertPulse;
      }

      // Point fixtures and downward directional beam flare synchronously in pure emergency red
      this.lights.forEach(l => {
        if (l.isPointLight) {
          l.color.setRGB(1.0, 0.03 * (1.0 - alertPulse), 0.03 * (1.0 - alertPulse));
          l.intensity = 0.70 + 1.90 * alertPulse;
        } else if (l.isDirectionalLight) {
          l.color.setRGB(0.92, 0.02, 0.02);
          l.intensity = 0.30 + 0.70 * alertPulse;
        }
      });

      // Ceiling longitudinal diffuser strip tubes pulse with glowing red luminescence
      const stripR = 0.60 + 0.40 * alertPulse;
      const stripG = 0.03 * (1.0 - alertPulse);
      const stripB = 0.03 * (1.0 - alertPulse);
      this.stripLightMaterials.forEach(m => {
        m.color.setRGB(stripR, stripG, stripB);
      });

      // Glovebox inspection lamp glows intense pulsing crimson
      if (this.gloveboxLight) {
        this.gloveboxLight.color.setRGB(1.0, 0.04, 0.04);
        this.gloveboxLight.intensity = 0.90 + 1.80 * alertPulse;
      }

      // Space hatch observation window rim glow pulses in danger red
      if (this.hatchGlow) {
        this.hatchGlow.color.setRGB(1.0, 0.08, 0.16);
        this.hatchGlow.intensity = 0.70 + 1.30 * alertPulse;
      }

      // Vent status LEDs flash synchronously in red alert
      this.ventLedMaterials.forEach(mat => {
        mat.color.setRGB(0.20 + 0.80 * alertPulse, 0.02, 0.02);
      });
    } else {
      // Nominal / Sleep mode subtle glovebox inspection light flicker
      if (this.gloveboxLight) {
        const baseIntensity = this.currentLightingMode === 'sleep' ? 0.4 : 2.2;
        const flicker = 0.98 + 0.02 * Math.sin(time * 8.0);
        this.gloveboxLight.intensity = baseIntensity * flicker;
      }
    }

    // 2. Smooth Louver Slat Rotation Lerp + Micro-vibration
    this.currentLouverAngle += (this.targetLouverAngle - this.currentLouverAngle) * 0.08;
    const microFlutter = Math.sin(time * 24.0) * 0.012 * (this.oxygenLevel / 100.0);
    const activeAngle = this.currentLouverAngle + microFlutter;

    for (let i = 0; i < this.activeLouvers.length; i++) {
      this.activeLouvers[i].rotation.x = activeAngle;
    }

    // 3. Smooth Fan Speed Interpolation (For telemetry HUD readings)
    this.currentFanSpeed += (this.targetFanSpeed - this.currentFanSpeed) * 0.06;

    // 4. LED Pulse under alarm/warning conditions (when not in station emergency mode)
    if (this.currentLightingMode !== 'emergency' && this.oxygenLevel < 19.5) {
      const pulse = 0.5 + 0.5 * Math.sin(time * 6.0);
      const isCritical = this.oxygenLevel < 14.0;
      this.ventLedMaterials.forEach(mat => {
        mat.color.setRGB(
          (isCritical ? 1.0 : 0.96) * pulse,
          (isCritical ? 0.1 : 0.62) * pulse,
          0.1 * pulse
        );
      });
    }

    // 5. Scroll Aerodynamic Airflow Streamline Ribbons downwards
    const streamScroll = this.currentFanSpeed * 0.0028;
    for (let s = 0; s < this.streamlineMeshes.length; s++) {
      const sm = this.streamlineMeshes[s];
      sm.material.map.offset.y -= streamScroll;
      sm.rotation.z = Math.sin(time * 2.8 + s) * 0.03;
    }

    // 6. Zero-G Floating Items Bobbing & Drift (Tablet, Checklist)
    this.floatingItems.forEach(item => {
      item.group.position.y = item.baseY + Math.sin(time * item.freqY + item.phase) * item.ampY;
      item.group.position.x = item.baseX + Math.cos(time * item.freqX + item.phase) * item.ampX;
      item.group.rotation.x = item.baseRotX + Math.sin(time * 0.8 + item.phase) * 0.05;
      item.group.rotation.y = item.baseRotY + Math.cos(time * 0.6 + item.phase) * 0.06;
      item.group.rotation.z = item.baseRotZ + Math.sin(time * 0.7 + item.phase) * 0.04;
    });

    // 7. Active Physical Air Mist Particles (Normal Blending, expanding billowing drift)
    if (this.oxygenParticles && this.oxygenParticleData.length > 0) {
      const posAttr = this.oxygenParticles.geometry.attributes.position;
      const positions = posAttr.array;
      const o2Norm = this.oxygenLevel / 100.0;
      const downwardSpeed = 0.006 + o2Norm * 0.020;

      for (let p = 0; p < this.oxygenParticleData.length; p++) {
        const pd = this.oxygenParticleData[p];
        const idx = p * 3;

        // Downward momentum from louvers
        positions[idx + 1] -= downwardSpeed * pd.speedMult;
        // Lateral billowing and micro-swirl as air mixes with cabin atmosphere
        positions[idx] += pd.lateralSpread + Math.sin(time * 2.2 + pd.curlPhase) * 0.0016;
        positions[idx + 2] += Math.cos(time * 1.8 + pd.curlPhase) * 0.0016;

        // Reset if reached floor level or expired
        if (positions[idx + 1] < 0.20 || pd.life <= 0) {
          positions[idx] = pd.originX + (Math.random() - 0.5) * 0.36;
          positions[idx + 1] = 1.52;
          positions[idx + 2] = pd.originZ + (Math.random() - 0.5) * 0.52;
          pd.life = 1.0;
        } else {
          pd.life -= 0.005 * pd.speedMult;
        }
      }
      posAttr.needsUpdate = true;
    }

    // 8. Dynamic Microgravity Combustion Candle Physics Update
    this.updateCandleFlame(time, clampedDt);

    // 9. Real Physics Interactive Daily Objects
    this.updatePhysicsObjects(clampedDt, time);
  }
}

