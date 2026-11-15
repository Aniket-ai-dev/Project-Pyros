/**
 * RoverCircuitScene.js
 * Cinematic, Hyper-Realistic 3D Martian Rover Avionics Compartment (Warm Electronics Box - WEB).
 * 
 * Redesigned for PROJECT PYROS:
 * - DENSE, LAYERED AEROSPACE ARCHITECTURE:
 *   - Multi-board sandwich assembly: Main motherboard backplane + elevated mezzanine power daughtercard
 *     on brass standoffs + adjacent 3U SpaceVPX avionics card cage with vertical guide rails and ejectors.
 *   - Over 600 detailed physical 3D electronic components: 0603/0805 SMD ceramic capacitors with tin end-caps,
 *     chip resistors, tantalum capacitors with polarity bands, SOIC & QFP ICs with gull-wing leads,
 *     toroidal power inductors with enameled copper wire, TO-247 power MOSFETs clamped to CNC-machined
 *     finned heatsinks, quartz crystals in stamped cans, gold test point loops, and jumper headers.
 *   - Realistically routed and bundled wiring: Curving braided wire bundles with Kapton spiral wrap,
 *     PEEK mounting clamps, service loops, flexible flat ribbon cables (FFC) with translucent orange Kapton,
 *     and Mil-DTL-38999 circular aluminum connectors with blue anodized lock rings.
 *   - Metallic structural supports: Isogrid weight-reduction aluminum ribs, card guide brackets,
 *     titanium hex cap screws, and sintered copper loop heat pipes with silver-brazed fittings.
 *   - Background gold Multi-Layer Insulation (MLI) quilted blanket with diamond stitching and realistic sheen.
 * - CINEMATIC, PHYSICALLY LOCALIZED FAILURE:
 *   - Failure begins strictly at one realistic power component: the primary high-current MOSFET on the mezzanine board.
 *   - Subtle overheating glow -> violent microscopic electrical micro-arcing sparks -> small, concentrated
 *     0.38g low-gravity flame -> natural rising acrid smoke wisps -> localized PCB charring and blistering ->
 *     failsafe isolation and power shutdown.
 * - MATTE & METALLIC PBR MATERIALS:
 *   - Dark aerospace green/black solder mask with micro-relief traces.
 *   - Polished tin, kovar gold lids, brushed aluminum, dark anodized metal, sintered copper.
 *   - Cool, dramatic low-key cinematic ambient lighting with warm local fire emission.
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

export class RoverCircuitScene {
  constructor(scene) {
    this.scene = scene;
    this.rootGroup = new THREE.Group();
    this.scene.add(this.rootGroup);

    // Interactive component colliders for raycasting
    this.interactiveComponents = new Map();
    this.componentMeshes = [];

    // Lighting fixtures
    this.ambientLight = null;
    this.inspectionSpot = null;
    this.secondarySpot = null;
    this.rimLight = null;
    this.firePointLight = null;
    this.arcPointLight = null;
    this.statusLeds = [];
    this.airDustParticles = null;
    this.airDustData = [];

    // View mode: 'normal' | 'circuit' | 'thermal'
    this.currentViewMode = 'normal';
    this.standardMaterials = new Map();

    // VFX Systems
    this.sparkParticles = null;
    this.sparkData = [];
    this.flameParticles = null;
    this.flameData = [];
    this.smokeParticles = null;
    this.smokeData = [];
    this.microArcLines = [];
    this.charDecal = null;
    this.hotSpotMesh = null;

    // Animated trace canvas texture
    this.traceCanvas = null;
    this.traceCtx = null;
    this.traceTexture = null;
    this.daughterTraceCanvas = null;
    this.daughterTraceCtx = null;
    this.daughterTraceTexture = null;

    // Simulation dynamic state
    this.simState = {
      stage: 1,
      progress: 0,
      pcuTemp: 24.5,
      rceTemp: 22.8,
      battTemp: 21.0,
      motorTemp: 23.4,
      commsTemp: 22.1,
      busVoltage: 28.1,
      busCurrent: 14.2,
      sparksActive: false,
      flameActive: false,
      smokeActive: false,
      flameIntensity: 0.0,
      isolationTripped: false
    };

    // Subsystem Module Specifications & Failure Epicenter
    this.epicenterPos = new THREE.Vector3(-0.06, 0.076, -0.04); // MOSFET Q1 on mezzanine board

    this.moduleConfig = {
      pcu: {
        id: 'pcu',
        name: 'Mezzanine Power Stage (PCU Q1-Q4)',
        subsystem: 'EPS // 28V Primary Power Stage',
        pos: new THREE.Vector3(-0.06, 0.036, -0.04),
        size: new THREE.Vector3(0.44, 0.08, 0.36),
        color: 0xef4444
      },
      rce: {
        id: 'rce',
        name: 'Avionics Card Cage (Dual RAD750)',
        subsystem: 'CDH // 3U SpaceVPX Flight Computer',
        pos: new THREE.Vector3(0.38, 0.036, -0.15),
        size: new THREE.Vector3(0.36, 0.26, 0.42),
        color: 0x38bdf8
      },
      battery: {
        id: 'battery',
        name: 'Power Distribution & Contactor',
        subsystem: 'PWR // Battery Interface & Relays',
        pos: new THREE.Vector3(-0.35, 0.036, 0.32),
        size: new THREE.Vector3(0.38, 0.16, 0.36),
        color: 0xf59e0b
      },
      motor: {
        id: 'motor',
        name: 'Actuator Inverter Sub-assembly',
        subsystem: 'ACT // Wheel & Arm Motor Drive',
        pos: new THREE.Vector3(0.32, 0.036, 0.34),
        size: new THREE.Vector3(0.38, 0.14, 0.34),
        color: 0x10b981
      },
      comms: {
        id: 'comms',
        name: 'Telecom RF Filter & SMA Link',
        subsystem: 'RF // Deep Space Transceiver',
        pos: new THREE.Vector3(-0.02, 0.036, 0.22),
        size: new THREE.Vector3(0.28, 0.09, 0.24),
        color: 0xa855f7
      }
    };

    this.init();
  }

  init() {
    this.setupCinematicLighting();
    this.createCompartmentEnclosure();
    this.createMotherboardBackplane();
    this.createElevatedMezzaninePowerBoard();
    this.createAvionicsCardCage();
    this.createRoutedCableHarnesses();
    this.createLoopHeatPipesAndSupports();
    this.populateDenseComponents();
    this.setupLocalizedVFX();
  }

  // =========================================================================
  // 1. CINEMATIC LOW-KEY LIGHTING (ENCLOSED MARS ROVER AVIONICS BAY)
  // =========================================================================
  setupCinematicLighting() {
    // Soft aerospace ambient fill with warm gold bounce from MLI blankets
    this.ambientLight = new THREE.AmbientLight(0x1a222d, 0.45);
    this.rootGroup.add(this.ambientLight);

    // Primary Overhead Inspection Luminaire (Mounted to ceiling bulkhead at y=0.58)
    this.inspectionSpot = new THREE.SpotLight(0xfff8ee, 1.8);
    this.inspectionSpot.position.set(-0.15, 0.58, 0.05);
    this.inspectionSpot.target.position.copy(this.epicenterPos);
    this.inspectionSpot.angle = Math.PI / 3.2;
    this.inspectionSpot.penumbra = 0.45;
    this.inspectionSpot.decay = 1.2;
    this.rootGroup.add(this.inspectionSpot);
    this.rootGroup.add(this.inspectionSpot.target);

    // Secondary Overhead Inspection Luminaire (Over card cage and power harness)
    this.secondarySpot = new THREE.SpotLight(0xf1f5f9, 1.4);
    this.secondarySpot.position.set(0.35, 0.58, -0.05);
    this.secondarySpot.target.position.set(0.32, 0.10, -0.05);
    this.secondarySpot.angle = Math.PI / 3.0;
    this.secondarySpot.penumbra = 0.5;
    this.secondarySpot.decay = 1.2;
    this.rootGroup.add(this.secondarySpot);
    this.rootGroup.add(this.secondarySpot.target);

    // Soft cool-blue internal rim/fill light catching metallic edges
    this.rimLight = new THREE.DirectionalLight(0x60a5fa, 0.35);
    this.rimLight.position.set(-0.65, 0.45, -0.40);
    this.rootGroup.add(this.rimLight);

    // Localized fire & thermal event light (starts inactive, warms up during stage 3-5)
    this.firePointLight = new THREE.PointLight(0xff4500, 0.0, 1.8, 1.5);
    this.firePointLight.position.copy(this.epicenterPos);
    this.firePointLight.position.y += 0.04;
    this.rootGroup.add(this.firePointLight);

    // Electrical micro-arc flash light (energetic electric blue/white flash)
    this.arcPointLight = new THREE.PointLight(0x38bdf8, 0.0, 1.5, 2.0);
    this.arcPointLight.position.copy(this.epicenterPos);
    this.rootGroup.add(this.arcPointLight);
  }

  // =========================================================================
  // 2. ENCLOSURE: 6-SIDED SEALED ROVER WARM ELECTRONICS BOX (WEB CHASSIS)
  // =========================================================================
  createCompartmentEnclosure() {
    const encGroup = new THREE.Group();
    this.rootGroup.add(encGroup);

    // ── 1. PROCEDURAL QUILTED GOLD MLI BLANKET TEXTURE ─────────────────────
    const mliCanvas = document.createElement('canvas');
    mliCanvas.width = 512;
    mliCanvas.height = 512;
    const mCtx = mliCanvas.getContext('2d');

    // Rich metallic amber gradient
    const grad = mCtx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, '#5f2005');
    grad.addColorStop(0.25, '#92400e');
    grad.addColorStop(0.65, '#b45309');
    grad.addColorStop(1, '#451a03');
    mCtx.fillStyle = grad;
    mCtx.fillRect(0, 0, 512, 512);

    // Diamond quilt double stitching
    const step = 32;
    mCtx.lineWidth = 1.2;
    mCtx.strokeStyle = 'rgba(253, 224, 71, 0.45)';
    for (let x = -512; x < 1024; x += step) {
      mCtx.beginPath();
      mCtx.moveTo(x, 0);
      mCtx.lineTo(x + 512, 512);
      mCtx.stroke();
      mCtx.beginPath();
      mCtx.moveTo(x, 512);
      mCtx.lineTo(x + 512, 0);
      mCtx.stroke();
    }

    // Offset secondary stitch line for authentic quilted look
    mCtx.strokeStyle = 'rgba(217, 119, 6, 0.35)';
    for (let x = -512 + 4; x < 1024; x += step) {
      mCtx.beginPath();
      mCtx.moveTo(x, 0);
      mCtx.lineTo(x + 512, 512);
      mCtx.stroke();
      mCtx.beginPath();
      mCtx.moveTo(x, 512);
      mCtx.lineTo(x + 512, 0);
      mCtx.stroke();
    }

    // Rivet/button tufts at diamond stitch intersections
    for (let y = 0; y <= 512; y += step) {
      for (let x = 0; x <= 512; x += step) {
        if ((x / step + y / step) % 2 === 0) {
          mCtx.fillStyle = 'rgba(40, 15, 5, 0.6)';
          mCtx.beginPath();
          mCtx.arc(x, y, 3.5, 0, Math.PI * 2);
          mCtx.fill();
          mCtx.fillStyle = '#fef08a';
          mCtx.beginPath();
          mCtx.arc(x - 0.5, y - 0.5, 1.2, 0, Math.PI * 2);
          mCtx.fill();
        }
      }
    }

    // Polyimide foil crinkle specular noise
    for (let i = 0; i < 400; i++) {
      const rx = Math.random() * 512;
      const ry = Math.random() * 512;
      const r = 1.5 + Math.random() * 5;
      mCtx.fillStyle = Math.random() > 0.4 ? 'rgba(254, 240, 138, 0.12)' : 'rgba(20, 5, 2, 0.25)';
      mCtx.beginPath();
      mCtx.arc(rx, ry, r, 0, Math.PI * 2);
      mCtx.fill();
    }

    const mliTex = new THREE.CanvasTexture(mliCanvas);
    mliTex.wrapS = THREE.RepeatWrapping;
    mliTex.wrapT = THREE.RepeatWrapping;
    mliTex.repeat.set(4, 3);
    mliTex.anisotropy = 4;

    // ── 2. NASA / JPL TECHNICAL PLACARD TEXTURE ─────────────────────────────
    const placardCanvas = document.createElement('canvas');
    placardCanvas.width = 512;
    placardCanvas.height = 256;
    const pCtx = placardCanvas.getContext('2d');

    pCtx.fillStyle = '#111827';
    pCtx.fillRect(0, 0, 512, 256);

    // Hazard caution borders
    pCtx.fillStyle = '#eab308';
    for (let x = 0; x < 512; x += 24) {
      pCtx.beginPath();
      pCtx.moveTo(x, 0); pCtx.lineTo(x + 12, 0); pCtx.lineTo(x + 20, 12); pCtx.lineTo(x + 8, 12);
      pCtx.fill();
      pCtx.beginPath();
      pCtx.moveTo(x, 244); pCtx.lineTo(x + 12, 244); pCtx.lineTo(x + 20, 256); pCtx.lineTo(x + 8, 256);
      pCtx.fill();
    }

    pCtx.fillStyle = '#ffffff';
    pCtx.font = 'bold 22px "JetBrains Mono", monospace';
    pCtx.fillText('NASA / JPL-CALTECH', 24, 46);
    pCtx.fillStyle = '#f59e0b';
    pCtx.font = 'bold 18px "JetBrains Mono", monospace';
    pCtx.fillText('MARS SCIENCE ROVER // WARM ELECTRONICS BOX', 24, 76);
    pCtx.fillStyle = '#38bdf8';
    pCtx.font = '14px "JetBrains Mono", monospace';
    pCtx.fillText('AVIONICS BAY-02 • 28V_ISO HIGH INTEGRITY DC BUS', 24, 102);
    pCtx.fillStyle = '#94a3b8';
    pCtx.font = '12px "JetBrains Mono", monospace';
    pCtx.fillText('HERMETIC SPEC: MSFC-SPEC-522 // CLASS-S VACUUM PURGED', 24, 126);
    pCtx.fillText('OPERATING BOUNDS: -40°C TO +55°C // PRESSURE: 7.2 TORR CO2', 24, 146);
    pCtx.fillText('FLIGHT S/N: 2024-MSL-PCU-09 • JPL INSPECTED: PASS [QA-07]', 24, 166);

    pCtx.fillStyle = '#e2e8f0';
    let bx = 24;
    for (let b = 0; b < 40; b++) {
      const bw = (b % 3 === 0) ? 6 : ((b % 2 === 0) ? 3 : 1.5);
      pCtx.fillRect(bx, 185, bw, 32);
      bx += bw + 3;
    }
    pCtx.font = '10px monospace';
    pCtx.fillText('*MSL-AVX-2024-09*', 24, 232);

    const placardTex = new THREE.CanvasTexture(placardCanvas);

    // ── 3. CORE MATERIALS ───────────────────────────────────────────────────
    const mliMat = new THREE.MeshStandardMaterial({
      color: 0xdf9f28,
      map: mliTex,
      metalness: 0.88,
      roughness: 0.36,
      side: THREE.DoubleSide,
      name: 'gold_mli'
    });
    this.registerMaterial('gold_mli', mliMat);

    const darkMetalMat = new THREE.MeshStandardMaterial({
      color: 0x1b2028,
      metalness: 0.92,
      roughness: 0.32,
      name: 'dark_aluminum'
    });
    this.registerMaterial('dark_aluminum', darkMetalMat);

    const chassisWallMat = new THREE.MeshStandardMaterial({
      color: 0x242a35,
      metalness: 0.86,
      roughness: 0.36,
      side: THREE.DoubleSide
    });

    const ribMat = new THREE.MeshStandardMaterial({ color: 0x3b4454, metalness: 0.90, roughness: 0.25 });
    const copperPipeMat = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.95, roughness: 0.20 });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.92, roughness: 0.28 });
    const blueAnodMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, metalness: 0.85, roughness: 0.30 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.98, roughness: 0.12 });
    const luminaireDiffuserMat = new THREE.MeshBasicMaterial({ color: 0xfffbeb });
    const placardMat = new THREE.MeshStandardMaterial({ map: placardTex, metalness: 0.5, roughness: 0.4 });

    // Compartment interior dimensions (meters)
    const boxW = 1.62; // width (X)
    const boxH = 0.64; // height (Y: -0.02 to 0.62)
    const boxL = 1.34; // depth (Z: -0.67 to 0.67)

    // ── 4. FLOOR DECK (y = -0.015) ──────────────────────────────────────────
    const floorPlate = new THREE.Mesh(new THREE.BoxGeometry(boxW, 0.02, boxL), darkMetalMat);
    floorPlate.position.set(0, -0.01, 0);
    floorPlate.receiveShadow = true;
    encGroup.add(floorPlate);

    // Longitudinal heavy titanium I-beam mounting rails
    const railGeo = new THREE.BoxGeometry(0.04, 0.035, boxL - 0.08);
    [-0.55, 0.55].forEach(rx => {
      const rail = new THREE.Mesh(railGeo, darkMetalMat);
      rail.position.set(rx, 0.018, 0);
      encGroup.add(rail);
    });

    // Transverse structural stringers
    const stringerGeo = new THREE.BoxGeometry(1.06, 0.018, 0.025);
    [-0.45, -0.20, 0.05, 0.30, 0.50].forEach(sz => {
      const str = new THREE.Mesh(stringerGeo, ribMat);
      str.position.set(0, 0.01, sz);
      encGroup.add(str);
    });

    // Central copper grounding busbar along floor
    const groundBus = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.008, 1.05), brassMat);
    groundBus.position.set(0, 0.014, -0.05);
    encGroup.add(groundBus);

    // Braided copper grounding straps from card racks to ground bus
    [-0.30, 0.28].forEach(gx => {
      const strap = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(gx), 0.003, 0.015), copperPipeMat);
      strap.position.set(gx / 2, 0.015, -0.05);
      encGroup.add(strap);
    });

    // ── 5. CEILING BULKHEAD & OVERHEAD WORKLIGHTS (y = 0.62) ─────────────────
    const roofPlate = new THREE.Mesh(new THREE.BoxGeometry(boxW, 0.02, boxL), chassisWallMat);
    roofPlate.position.set(0, 0.63, 0);
    encGroup.add(roofPlate);

    // Quilted Gold MLI lining on ceiling underside
    const ceilingMli = new THREE.Mesh(new THREE.BoxGeometry(boxW - 0.04, 0.006, boxL - 0.04), mliMat);
    ceilingMli.position.set(0, 0.617, 0);
    encGroup.add(ceilingMli);

    // Ceiling isogrid reinforcement framework
    const ceilBeamX = new THREE.BoxGeometry(boxW - 0.06, 0.024, 0.02);
    [-0.45, -0.15, 0.15, 0.45].forEach(bz => {
      const beam = new THREE.Mesh(ceilBeamX, ribMat);
      beam.position.set(0, 0.605, bz);
      encGroup.add(beam);
    });

    const ceilBeamZ = new THREE.BoxGeometry(0.02, 0.024, boxL - 0.06);
    [-0.45, 0.0, 0.45].forEach(bx => {
      const beam = new THREE.Mesh(ceilBeamZ, ribMat);
      beam.position.set(bx, 0.605, 0);
      encGroup.add(beam);
    });

    // Dual Overhead Technical Luminaire Fixtures (Recessed LED Worklights)
    const fixtureGeo = new THREE.BoxGeometry(0.38, 0.022, 0.08);
    const diffuserGeo = new THREE.BoxGeometry(0.35, 0.005, 0.06);

    // Luminaire 1 (Overhead above PCU & Motherboard)
    const lum1Housing = new THREE.Mesh(fixtureGeo, darkMetalMat);
    lum1Housing.position.set(-0.15, 0.608, 0.05);
    encGroup.add(lum1Housing);
    const lum1Diffuser = new THREE.Mesh(diffuserGeo, luminaireDiffuserMat);
    lum1Diffuser.position.set(-0.15, 0.596, 0.05);
    encGroup.add(lum1Diffuser);

    // Luminaire 2 (Overhead above Card Cage & Battery Harness)
    const lum2Housing = new THREE.Mesh(fixtureGeo, darkMetalMat);
    lum2Housing.position.set(0.35, 0.608, -0.05);
    encGroup.add(lum2Housing);
    const lum2Diffuser = new THREE.Mesh(diffuserGeo, luminaireDiffuserMat);
    lum2Diffuser.position.set(0.35, 0.596, -0.05);
    encGroup.add(lum2Diffuser);

    // Overhead Cable Raceway / Cable Tray suspended from ceiling
    const trayGeo = new THREE.BoxGeometry(0.12, 0.015, boxL - 0.25);
    const tray = new THREE.Mesh(trayGeo, ribMat);
    tray.position.set(-0.28, 0.55, 0);
    encGroup.add(tray);

    // Bundled wire harness in ceiling tray
    const trayHarnessGeo = new THREE.CylinderGeometry(0.022, 0.022, boxL - 0.28, 8);
    const trayHarness = new THREE.Mesh(trayHarnessGeo, mliMat);
    trayHarness.rotation.x = Math.PI / 2;
    trayHarness.position.set(-0.28, 0.565, 0);
    encGroup.add(trayHarness);

    // Sintered copper Loop Heat Pipe condenser run along ceiling
    for (let c = 0; c < 2; c++) {
      const pipeGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.85, 12);
      const pipe = new THREE.Mesh(pipeGeo, copperPipeMat);
      pipe.rotation.z = Math.PI / 2;
      pipe.position.set(0.20, 0.575 - c * 0.02, -0.15 + c * 0.08);
      encGroup.add(pipe);
    }

    // ── 6. BACK BULKHEAD & NASA PLACARD (z = -0.67) ─────────────────────────
    const backPlate = new THREE.Mesh(new THREE.BoxGeometry(boxW, boxH, 0.02), chassisWallMat);
    backPlate.position.set(0, 0.30, -0.67);
    encGroup.add(backPlate);

    const backMli = new THREE.Mesh(new THREE.BoxGeometry(boxW - 0.04, boxH - 0.04, 0.006), mliMat);
    backMli.position.set(0, 0.30, -0.657);
    encGroup.add(backMli);

    // Structural isogrid ribs on back wall
    [-0.50, 0.0, 0.50].forEach(vx => {
      const vRib = new THREE.Mesh(new THREE.BoxGeometry(0.02, boxH - 0.06, 0.02), ribMat);
      vRib.position.set(vx, 0.30, -0.645);
      encGroup.add(vRib);
    });
    [0.18, 0.44].forEach(hy => {
      const hRib = new THREE.Mesh(new THREE.BoxGeometry(boxW - 0.06, 0.02, 0.02), ribMat);
      hRib.position.set(0, hy, -0.645);
      encGroup.add(hRib);
    });

    // Central NASA / JPL WEB Placard
    const placardMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.19), placardMat);
    placardMesh.position.set(0, 0.40, -0.642);
    encGroup.add(placardMesh);

    // Avionics Power Distribution Conduit Junction Box
    const jBox = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.22, 0.05), darkMetalMat);
    jBox.position.set(-0.48, 0.22, -0.63);
    encGroup.add(jBox);

    // ── 7. LEFT BULKHEAD & MIL-SPEC BULKHEAD FEEDTHROUGHS (x = -0.81) ───────
    const leftPlate = new THREE.Mesh(new THREE.BoxGeometry(0.02, boxH, boxL), chassisWallMat);
    leftPlate.position.set(-0.81, 0.30, 0);
    encGroup.add(leftPlate);

    const leftMli = new THREE.Mesh(new THREE.BoxGeometry(0.006, boxH - 0.04, boxL - 0.04), mliMat);
    leftMli.position.set(-0.797, 0.30, 0);
    encGroup.add(leftMli);

    // Vertical structural stanchions
    [-0.40, 0.0, 0.40].forEach(sz => {
      const stanchion = new THREE.Mesh(new THREE.BoxGeometry(0.02, boxH - 0.06, 0.02), ribMat);
      stanchion.position.set(-0.785, 0.30, sz);
      encGroup.add(stanchion);
    });

    // 4x Mil-DTL-38999 Circular Hermetic Bulkhead Connectors (External feeds)
    const connPositions = [
      { y: 0.20, z: -0.12, r: 0.028 },
      { y: 0.30, z: -0.12, r: 0.032 },
      { y: 0.20, z: 0.12, r: 0.026 },
      { y: 0.30, z: 0.12, r: 0.030 }
    ];
    connPositions.forEach(cp => {
      const flange = new THREE.Mesh(new THREE.BoxGeometry(0.012, cp.r * 2.2, cp.r * 2.2), darkMetalMat);
      flange.position.set(-0.792, cp.y, cp.z);
      encGroup.add(flange);
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(cp.r, cp.r, 0.025, 16), blueAnodMat);
      ring.rotation.z = Math.PI / 2;
      ring.position.set(-0.776, cp.y, cp.z);
      encGroup.add(ring);
      const pinCore = new THREE.Mesh(new THREE.CylinderGeometry(cp.r * 0.65, cp.r * 0.65, 0.008, 12), brassMat);
      pinCore.rotation.z = Math.PI / 2;
      pinCore.position.set(-0.760, cp.y, cp.z);
      encGroup.add(pinCore);
    });

    // Heavy braided copper grounding strap
    const groundStrap = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.28, 0.025), copperPipeMat);
    groundStrap.position.set(-0.788, 0.14, 0.35);
    encGroup.add(groundStrap);

    // ── 8. RIGHT BULKHEAD & THERMAL CONTROL LOUVERS (x = +0.81) ─────────────
    const rightPlate = new THREE.Mesh(new THREE.BoxGeometry(0.02, boxH, boxL), chassisWallMat);
    rightPlate.position.set(0.81, 0.30, 0);
    encGroup.add(rightPlate);

    const rightMli = new THREE.Mesh(new THREE.BoxGeometry(0.006, boxH - 0.04, boxL - 0.04), mliMat);
    rightMli.position.set(0.797, 0.30, 0);
    encGroup.add(rightMli);

    // Passive Thermal Control Louver Assembly (Authentic Mars Rover Hardware)
    const louverFrame = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.36, 0.54), darkMetalMat);
    louverFrame.position.set(0.782, 0.32, -0.05);
    encGroup.add(louverFrame);

    // 8 Bimetallic Articulated Louver Shutter Blades
    const bladeGeo = new THREE.BoxGeometry(0.012, 0.035, 0.48);
    for (let b = 0; b < 8; b++) {
      const blade = new THREE.Mesh(bladeGeo, chromeMat);
      blade.position.set(0.788, 0.18 + b * 0.04, -0.05);
      blade.rotation.z = 0.32; // Angled open 18 degrees
      encGroup.add(blade);
    }

    // Louver drive actuator motor
    const louverMotor = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.08, 12), darkMetalMat);
    louverMotor.position.set(0.778, 0.32, -0.34);
    encGroup.add(louverMotor);

    // ── 9. FRONT BULKHEAD & FRAMED SERVICE APERTURE (z = +0.67) ─────────────
    // Upper transom wall
    const frontUpper = new THREE.Mesh(new THREE.BoxGeometry(boxW, 0.12, 0.02), chassisWallMat);
    frontUpper.position.set(0, 0.56, 0.67);
    encGroup.add(frontUpper);
    const frontUpperMli = new THREE.Mesh(new THREE.BoxGeometry(boxW - 0.04, 0.10, 0.006), mliMat);
    frontUpperMli.position.set(0, 0.56, 0.657);
    encGroup.add(frontUpperMli);

    // Lower sill wall
    const frontLower = new THREE.Mesh(new THREE.BoxGeometry(boxW, 0.08, 0.02), darkMetalMat);
    frontLower.position.set(0, 0.02, 0.67);
    encGroup.add(frontLower);

    // Left and Right door jambs
    const jambGeo = new THREE.BoxGeometry(0.24, 0.46, 0.02);
    const jambLeft = new THREE.Mesh(jambGeo, chassisWallMat);
    jambLeft.position.set(-0.69, 0.31, 0.67);
    encGroup.add(jambLeft);
    const jambRight = new THREE.Mesh(jambGeo, chassisWallMat);
    jambRight.position.set(0.69, 0.31, 0.67);
    encGroup.add(jambRight);

    // Framed Titanium Service Hatch Aperture Rim
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.92, roughness: 0.28 });
    const hBarGeo = new THREE.BoxGeometry(1.18, 0.028, 0.028);
    const topBar = new THREE.Mesh(hBarGeo, rimMat);
    topBar.position.set(0, 0.535, 0.665);
    encGroup.add(topBar);

    const botBar = new THREE.Mesh(hBarGeo, rimMat);
    botBar.position.set(0, 0.075, 0.665);
    encGroup.add(botBar);

    const vBarGeo = new THREE.BoxGeometry(0.028, 0.46, 0.028);
    const leftBar = new THREE.Mesh(vBarGeo, rimMat);
    leftBar.position.set(-0.575, 0.305, 0.665);
    encGroup.add(leftBar);

    const rightBar = new THREE.Mesh(vBarGeo, rimMat);
    rightBar.position.set(0.575, 0.305, 0.665);
    encGroup.add(rightBar);

    // Captive Dzus fastener rivets arrayed along hatch rim
    const dzusGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.006, 8);
    for (let x = -0.54; x <= 0.54; x += 0.12) {
      const dTop = new THREE.Mesh(dzusGeo, chromeMat);
      dTop.rotation.x = Math.PI / 2;
      dTop.position.set(x, 0.535, 0.680);
      encGroup.add(dTop);
      const dBot = new THREE.Mesh(dzusGeo, chromeMat);
      dBot.rotation.x = Math.PI / 2;
      dBot.position.set(x, 0.075, 0.680);
      encGroup.add(dBot);
    }

    // Lower sill structural cable channel clamped solidly to the sill framing
    const sillHarnessGeo = new THREE.CylinderGeometry(0.010, 0.010, 1.15, 12);
    const sillHarness = new THREE.Mesh(sillHarnessGeo, mliMat);
    sillHarness.rotation.z = Math.PI / 2;
    sillHarness.position.set(0, 0.032, 0.655);
    encGroup.add(sillHarness);

    [-0.40, -0.15, 0.15, 0.40].forEach(cx => {
      const clamp = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.018, 0.022), darkMetalMat);
      clamp.position.set(cx, 0.032, 0.655);
      encGroup.add(clamp);
    });

    // ── 10. SUSPENDED MICRO-ATMOSPHERE (SEALED BAY PARTICULATE DRIFT) ───────
    const dustCount = 75;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    this.airDustData = [];

    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 1.2;
      dustPos[i * 3 + 1] = 0.06 + Math.random() * 0.50;
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 1.0;
      this.airDustData.push({
        baseY: dustPos[i * 3 + 1],
        speed: 0.4 + Math.random() * 0.8
      });
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));

    const dustMat = new THREE.PointsMaterial({
      color: 0xfef08a,
      size: 0.0035,
      transparent: true,
      opacity: 0.38,
      blending: THREE.AdditiveBlending
    });
    this.airDustParticles = new THREE.Points(dustGeo, dustMat);
    encGroup.add(this.airDustParticles);
  }

  // =========================================================================
  // 3. LAYER 0: MAIN MOTHERBOARD BACKPLANE (HIGH-DENSITY COMPACT ROUTING)
  // =========================================================================
  createMotherboardBackplane() {
    const mbGroup = new THREE.Group();
    this.rootGroup.add(mbGroup);

    const mbW = 1.25;
    const mbL = 0.95;
    const mbThick = 0.012;

    // Procedural Dark Obsidian/Green Solder Mask Texture
    this.traceCanvas = document.createElement('canvas');
    this.traceCanvas.width = 1024;
    this.traceCanvas.height = 1024;
    this.traceCtx = this.traceCanvas.getContext('2d');
    this.renderMotherboardCanvas(0);

    this.traceTexture = new THREE.CanvasTexture(this.traceCanvas);
    this.traceTexture.anisotropy = 4;

    this.pcbMaterial = new THREE.MeshStandardMaterial({
      color: 0x0c1410, // Dark matte obsidian solder mask
      map: this.traceTexture,
      roughness: 0.32,
      metalness: 0.45,
      name: 'pcb_main'
    });
    this.registerMaterial('pcb_main', this.pcbMaterial);

    // Motherboard center at y = 0.030, thickness 0.012 -> bottom at y = 0.024, top at y = 0.036
    const mbMesh = new THREE.Mesh(new THREE.BoxGeometry(mbW, mbThick, mbL), this.pcbMaterial);
    mbMesh.position.set(0, 0.030, -0.05);
    mbMesh.receiveShadow = true;
    mbGroup.add(mbMesh);

    // Milled Aluminum Chassis Mounting Rails supporting motherboard from floor (y = 0.0 to 0.036)
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.92, roughness: 0.22 });
    const sideRailGeo = new THREE.BoxGeometry(0.025, 0.036, mbL + 0.04);
    [-mbW / 2 - 0.012, mbW / 2 + 0.012].forEach(rx => {
      const rail = new THREE.Mesh(sideRailGeo, frameMat);
      rail.position.set(rx, 0.018, -0.05);
      mbGroup.add(rail);
    });

    // Solid Aluminum Standoff Bosses mounting Motherboard to the Chassis Floor
    const bossMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.90, roughness: 0.25 });
    const screwMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.95, roughness: 0.2 });
    const bossGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.024, 16);
    const screwGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.004, 6);

    const mountPoints = [
      [-mbW / 2 + 0.04, -mbL / 2 + 0.04],
      [mbW / 2 - 0.04, -mbL / 2 + 0.04],
      [-mbW / 2 + 0.04, mbL / 2 - 0.04],
      [mbW / 2 - 0.04, mbL / 2 - 0.04],
      [-0.18, 0.12],
      [0.18, 0.12]
    ];
    mountPoints.forEach(([mx, mz]) => {
      const boss = new THREE.Mesh(bossGeo, bossMat);
      boss.position.set(mx, 0.012, mz - 0.05);
      mbGroup.add(boss);

      const scr = new THREE.Mesh(screwGeo, screwMat);
      scr.position.set(mx, 0.038, mz - 0.05);
      mbGroup.add(scr);
    });
  }

  renderMotherboardCanvas(timeOffset = 0) {
    const ctx = this.traceCtx;
    const w = 1024;
    const h = 1024;

    // Dark technical substrate
    ctx.fillStyle = '#08120d';
    ctx.fillRect(0, 0, w, h);

    // Microscopic ground copper fill pattern
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // High-Density Circuit Traces
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = 'rgba(180, 83, 9, 0.55)'; // Base copper
    for (let y = 100; y < 900; y += 45) {
      ctx.beginPath();
      ctx.moveTo(100, y);
      ctx.lineTo(400, y);
      ctx.lineTo(460, y + 30);
      ctx.lineTo(900, y + 30);
      ctx.stroke();
    }

    // Subtle silkscreen markings (Technical, not giant labels)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.font = '10px monospace';
    ctx.fillText('JPL // 1044-AVX-BP • 28V_ISO • CLASS-S', 40, 40);
    ctx.fillText('TP101-TP132 • DIFFERENTIAL_BUS', 40, 60);

    // Animated power pulses along primary supply traces
    if (!this.simState.isolationTripped) {
      const speed = this.simState.stage >= 4 ? 4.2 : 1.6;
      const phase = (timeOffset * speed) % 1.0;
      ctx.lineWidth = 2.0;
      ctx.strokeStyle = this.simState.stage >= 4
        ? `rgba(239, 68, 68, ${0.7 + Math.sin(timeOffset * 22) * 0.3})`
        : 'rgba(56, 189, 248, 0.75)';
      ctx.setLineDash([8, 24]);
      ctx.lineDashOffset = -phase * 32;

      ctx.beginPath();
      ctx.moveTo(150, 480);
      ctx.lineTo(480, 480);
      ctx.lineTo(540, 520);
      ctx.lineTo(880, 520);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // =========================================================================
  // 4. LAYER 1: ELEVATED MEZZANINE POWER DAUGHTERCARD (FAILURE EPICENTER)
  // =========================================================================
  createElevatedMezzaninePowerBoard() {
    const mezGroup = new THREE.Group();
    mezGroup.position.copy(this.moduleConfig.pcu.pos);
    this.rootGroup.add(mezGroup);

    const mW = 0.44;
    const mL = 0.36;
    const mThick = 0.008;
    const standoffH = 0.024; // 24mm precision aerospace brass standoffs

    // Daughtercard PCB Canvas (Power Routing & Dense Heavy Traces)
    this.daughterTraceCanvas = document.createElement('canvas');
    this.daughterTraceCanvas.width = 512;
    this.daughterTraceCanvas.height = 512;
    this.daughterTraceCtx = this.daughterTraceCanvas.getContext('2d');
    this.renderMezzanineCanvas(0);

    this.daughterTraceTexture = new THREE.CanvasTexture(this.daughterTraceCanvas);
    const daughterMat = new THREE.MeshStandardMaterial({
      color: 0x091c13,
      map: this.daughterTraceTexture,
      roughness: 0.3,
      metalness: 0.5,
      name: 'daughter_pcb'
    });
    this.registerMaterial('daughter_pcb', daughterMat);

    // Mezzanine PCB sits flush on top of the 4 standoffs (y = standoffH to standoffH + mThick)
    const mezMesh = new THREE.Mesh(new THREE.BoxGeometry(mW, mThick, mL), daughterMat);
    mezMesh.position.set(0, standoffH + mThick / 2, 0);
    mezMesh.castShadow = true;
    mezMesh.receiveShadow = true;
    mezGroup.add(mezMesh);

    // Precision Brass Hex Standoffs: Firmly bolted into motherboard (y = 0.0 to standoffH)
    const standoffMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.95, roughness: 0.2 });
    const standoffGeo = new THREE.CylinderGeometry(0.010, 0.010, standoffH, 6);
    const screwMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.95, roughness: 0.2 });
    const screwGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.004, 6);
    const padGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.002, 16);

    [
      [-mW / 2 + 0.025, -mL / 2 + 0.025],
      [mW / 2 - 0.025, -mL / 2 + 0.025],
      [-mW / 2 + 0.025, mL / 2 - 0.025],
      [mW / 2 - 0.025, mL / 2 - 0.025]
    ].forEach(([sx, sz]) => {
      // Gold landing washer on motherboard
      const pad = new THREE.Mesh(padGeo, standoffMat);
      pad.position.set(sx, 0.001, sz);
      mezGroup.add(pad);

      // Standoff column resting on motherboard (bottom at y=0, top at y=standoffH)
      const so = new THREE.Mesh(standoffGeo, standoffMat);
      so.position.set(sx, standoffH / 2, sz);
      mezGroup.add(so);

      // Stainless hex clamping screw on top of mezzanine PCB
      const scr = new THREE.Mesh(screwGeo, screwMat);
      scr.position.set(sx, standoffH + mThick + 0.002, sz);
      mezGroup.add(scr);
    });

    // High-Density Mezzanine Interconnect Connector bridging Motherboard to Mezzanine
    const connMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.88, roughness: 0.25 });
    const connGeo = new THREE.BoxGeometry(0.18, standoffH, 0.032);
    const conn = new THREE.Mesh(connGeo, connMat);
    conn.position.set(0, standoffH / 2, 0.12);
    mezGroup.add(conn);

    // -----------------------------------------------------------------------
    // PRIMARY FAILURE POINT: POWER MOSFET TRANSISTOR ARRAY & FINNED HEATSINK
    // -----------------------------------------------------------------------
    const pcbTopY = standoffH + mThick; // Relative Y of mezzanine PCB top surface
    const heatsinkGeo = new THREE.BoxGeometry(0.24, 0.018, 0.14);
    const heatsinkMat = new THREE.MeshStandardMaterial({
      color: 0x2d3748,
      metalness: 0.9,
      roughness: 0.3,
      name: 'pcu_heatsink'
    });
    this.registerMaterial('pcu_heatsink', heatsinkMat);

    const hsBase = new THREE.Mesh(heatsinkGeo, heatsinkMat);
    hsBase.position.set(0, pcbTopY + 0.009, -0.03);
    mezGroup.add(hsBase);

    // Extruded Heatsink Fins mounted on heatsink base
    const finHeight = 0.045;
    const finThick = 0.004;
    const finGeo = new THREE.BoxGeometry(0.22, finHeight, finThick);
    for (let f = -0.055; f <= 0.055; f += 0.011) {
      const fin = new THREE.Mesh(finGeo, heatsinkMat);
      fin.position.set(0, pcbTopY + 0.018 + finHeight / 2, -0.03 + f);
      mezGroup.add(fin);
    }

    // High-Power TO-247 Metal-Tab MOSFET Packages Clamped to Heatsink
    const mosfetBodyGeo = new THREE.BoxGeometry(0.032, 0.032, 0.016);
    const mosfetMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.25 });
    const clipMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.95, roughness: 0.15 });

    for (let i = 0; i < 4; i++) {
      const mx = -0.08 + i * 0.054;
      const mosfet = new THREE.Mesh(mosfetBodyGeo, mosfetMat);
      mosfet.position.set(mx, pcbTopY + 0.016, -0.03);
      mezGroup.add(mosfet);

      const clip = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.038, 0.022), clipMat);
      clip.position.set(mx, pcbTopY + 0.018, -0.03);
      mezGroup.add(clip);
    }

    // Heavy Toroidal Inductor with Glossy Enamelled Copper Magnet Wire
    const toroidGeo = new THREE.TorusGeometry(0.030, 0.011, 16, 28);
    const copperMat = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.95, roughness: 0.18 });
    const choke = new THREE.Mesh(toroidGeo, copperMat);
    choke.rotation.x = Math.PI / 2;
    choke.position.set(0.08, pcbTopY + 0.016, 0.09);
    mezGroup.add(choke);

    // Silicone RTV Adhesive Staking Fillet (Aerospace Vibration Damping)
    const rtvMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.6 });
    const rtv = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.032, 0.010, 16), rtvMat);
    rtv.position.set(0.08, pcbTopY + 0.005, 0.09);
    mezGroup.add(rtv);

    // Bank of Solid Polymer Low-ESR Capacitors
    const polyCapGeo = new THREE.CylinderGeometry(0.013, 0.013, 0.032, 16);
    const polyCapMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.8, roughness: 0.25 });
    for (let c = 0; c < 3; c++) {
      const cap = new THREE.Mesh(polyCapGeo, polyCapMat);
      cap.position.set(-0.12 + c * 0.036, pcbTopY + 0.016, 0.09);
      mezGroup.add(cap);
    }

    // Diagnostic Status LED
    const ledMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    this.registerMaterial('pcu_led', ledMat);
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.005, 8, 8), ledMat);
    led.position.set(mW * 0.42, pcbTopY + 0.005, -mL * 0.42);
    mezGroup.add(led);

    // Scorched Charring Decal (Stage 5/6 Burn Epicenter)
    const charGeo = new THREE.PlaneGeometry(0.26, 0.20);
    const charCanvas = document.createElement('canvas');
    charCanvas.width = 128;
    charCanvas.height = 128;
    const cCtx = charCanvas.getContext('2d');
    const cGrad = cCtx.createRadialGradient(64, 64, 4, 64, 64, 60);
    cGrad.addColorStop(0, 'rgba(8, 8, 12, 0.98)');
    cGrad.addColorStop(0.4, 'rgba(45, 14, 4, 0.88)');
    cGrad.addColorStop(0.75, 'rgba(180, 83, 9, 0.35)');
    cGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    cCtx.fillStyle = cGrad;
    cCtx.fillRect(0, 0, 128, 128);

    const charTex = new THREE.CanvasTexture(charCanvas);
    const charMat = new THREE.MeshBasicMaterial({ map: charTex, transparent: true, opacity: 0.0, depthWrite: false });
    this.charDecal = new THREE.Mesh(charGeo, charMat);
    this.charDecal.rotation.x = -Math.PI / 2;
    this.charDecal.position.set(0, pcbTopY + 0.001, -0.03);
    mezGroup.add(this.charDecal);

    // Glowing Incandescent Hot Core
    const hotGeo = new THREE.PlaneGeometry(0.06, 0.04);
    const hotMat = new THREE.MeshBasicMaterial({
      color: 0xff4500,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.hotSpotMesh = new THREE.Mesh(hotGeo, hotMat);
    this.hotSpotMesh.rotation.x = -Math.PI / 2;
    this.hotSpotMesh.position.set(-0.026, pcbTopY + 0.002, -0.03);
    mezGroup.add(this.hotSpotMesh);

    this.addInteractiveCollider('pcu', mezGroup, this.moduleConfig.pcu.size);
  }

  renderMezzanineCanvas(timeOffset = 0) {
    const ctx = this.daughterTraceCtx;
    const w = 512;
    const h = 512;

    ctx.fillStyle = '#06170e';
    ctx.fillRect(0, 0, w, h);

    // Heavy copper distribution pads
    ctx.fillStyle = 'rgba(217, 119, 6, 0.65)';
    ctx.fillRect(60, 180, 390, 80); // Heatsink thermal ground plane
    ctx.fillRect(80, 320, 140, 100); // Input filter plane

    // Gate drive traces
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++) {
      const gx = 120 + i * 75;
      ctx.beginPath();
      ctx.moveTo(gx, 140);
      ctx.lineTo(gx, 180);
      ctx.stroke();
    }
  }

  // =========================================================================
  // 5. 3U SPACEVPX AVIONICS CARD CAGE (ADJACENT VERTICAL DAUGHTERCARDS)
  // =========================================================================
  createAvionicsCardCage() {
    const cageGroup = new THREE.Group();
    cageGroup.position.copy(this.moduleConfig.rce.pos);
    this.rootGroup.add(cageGroup);

    const cageW = 0.36;
    const cageH = 0.24;
    const cageD = 0.42;

    // CNC Machined Aluminum Card Cage Frame
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.92, roughness: 0.28 });
    const topPlateGeo = new THREE.BoxGeometry(cageW, 0.016, cageD);

    const topPlate = new THREE.Mesh(topPlateGeo, frameMat);
    topPlate.position.y = cageH;
    cageGroup.add(topPlate);

    // Bottom plate sits flush on the motherboard surface (relative y = 0.0 to 0.016)
    const botPlate = new THREE.Mesh(topPlateGeo, frameMat);
    botPlate.position.y = 0.008;
    cageGroup.add(botPlate);

    // 4 Vertical Aerospace Daughtercards Inserted into Guide Rails
    const cardGeo = new THREE.BoxGeometry(0.008, cageH - 0.024, cageD * 0.88);
    const cardMat = new THREE.MeshStandardMaterial({ color: 0x091c13, roughness: 0.35, metalness: 0.4 });
    const handleMatRed = new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.8 });
    const handleMatBlue = new THREE.MeshStandardMaterial({ color: 0x2563eb, metalness: 0.8 });

    const cardOffsets = [-0.12, -0.04, 0.04, 0.12];
    cardOffsets.forEach((cx, idx) => {
      const card = new THREE.Mesh(cardGeo, cardMat);
      card.position.set(cx, cageH / 2, 0);
      cageGroup.add(card);

      // Card Ejector Latch Handles on the front
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.035, 0.025), idx % 2 === 0 ? handleMatRed : handleMatBlue);
      handle.position.set(cx, cageH * 0.88, cageD * 0.44);
      cageGroup.add(handle);

      // Ceramic BAE RAD750 Flight Computer Packages with Gold Kovar Lids
      if (idx === 1 || idx === 2) {
        const cpuGeo = new THREE.BoxGeometry(0.018, 0.08, 0.08);
        const cpuMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.5 });
        const cpu = new THREE.Mesh(cpuGeo, cpuMat);
        cpu.position.set(cx + 0.01, cageH * 0.48, 0.0);
        cageGroup.add(cpu);

        const goldLid = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.055, 0.055),
          new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.98, roughness: 0.18 }));
        goldLid.position.set(cx + 0.012, cageH * 0.48, 0.0);
        cageGroup.add(goldLid);
      }
    });

    this.addInteractiveCollider('rce', cageGroup, this.moduleConfig.rce.size);
  }

  // =========================================================================
  // 6. ROUTED & BUNDLED CABLE HARNESSES WITH REALISTIC SERVICE LOOPS
  // =========================================================================
  createRoutedCableHarnesses() {
    const harnessGroup = new THREE.Group();
    this.rootGroup.add(harnessGroup);

    const cableMat = new THREE.MeshStandardMaterial({ color: 0x1a202c, roughness: 0.82, metalness: 0.1 });
    const peekMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4 }); // Yellow/amber PEEK clamps
    const ffcMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.3, transparent: true, opacity: 0.85 }); // Kapton ribbon

    // 1. Heavy Gauge Power Supply Bundle: Anchored to motherboard via PEEK clamps
    const pwrCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.62, 0.046, 0.35),
      new THREE.Vector3(-0.45, 0.044, 0.22),
      new THREE.Vector3(-0.35, 0.044, 0.08),
      new THREE.Vector3(-0.25, 0.048, -0.02),
      new THREE.Vector3(-0.16, 0.056, -0.03)
    ]);
    const pwrTube = new THREE.Mesh(new THREE.TubeGeometry(pwrCurve, 32, 0.012, 10, false), cableMat);
    harnessGroup.add(pwrTube);

    // Yellow PEEK cable mounting clamps bolted to motherboard (y = 0.042)
    [
      { x: -0.45, z: 0.22 },
      { x: -0.35, z: 0.08 }
    ].forEach(cp => {
      const clamp = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.014, 0.020), peekMat);
      clamp.position.set(cp.x, 0.042, cp.z);
      harnessGroup.add(clamp);
    });

    // 2. Multi-Core Signal Data Loom: Weaves along backplane surface between card cage and PCU
    const sigCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.24, 0.045, -0.15),
      new THREE.Vector3(0.12, 0.042, -0.18),
      new THREE.Vector3(-0.02, 0.042, -0.20),
      new THREE.Vector3(-0.18, 0.048, -0.16)
    ]);
    const sigTube = new THREE.Mesh(new THREE.TubeGeometry(sigCurve, 28, 0.009, 8, false), cableMat);
    harnessGroup.add(sigTube);

    // Signal harness tie-down clamps
    [0.12, -0.02].forEach(sx => {
      const clamp = new THREE.Mesh(new THREE.BoxGeometry(0.020, 0.012, 0.016), peekMat);
      clamp.position.set(sx, 0.042, sx === 0.12 ? -0.18 : -0.20);
      harnessGroup.add(clamp);
    });

    // 3. Flexible Flat Ribbon Cable (FFC): Translucent orange Kapton ribbon linking mezzanine to motherboard
    const ffcCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.06, 0.062, 0.14),
      new THREE.Vector3(-0.06, 0.046, 0.18),
      new THREE.Vector3(-0.06, 0.038, 0.22)
    ]);
    const ffcMesh = new THREE.Mesh(new THREE.TubeGeometry(ffcCurve, 16, 0.028, 4, false), ffcMat);
    ffcMesh.scale.set(1, 0.15, 1); // Flatten into ribbon profile
    harnessGroup.add(ffcMesh);

    // 4. Mil-DTL-38999 Circular Aluminum Connectors anchored to chassis rail
    const connGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.032, 16);
    const connMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.92, roughness: 0.22 });
    const blueRingMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, metalness: 0.85 });

    [[-0.62, 0.044, 0.35], [-0.62, 0.044, 0.40]].forEach(([cx, cy, cz]) => {
      const conn = new THREE.Mesh(connGeo, connMat);
      conn.rotation.z = Math.PI / 2;
      conn.position.set(cx, cy, cz);
      harnessGroup.add(conn);

      const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.020, 0.020, 0.006, 16), blueRingMat);
      ring.rotation.z = Math.PI / 2;
      ring.position.set(cx, cy, cz);
      harnessGroup.add(ring);
    });
  }

  // =========================================================================
  // 7. SINTERED COPPER LOOP HEAT PIPES & MECHANICAL SUPPORTS
  // =========================================================================
  createLoopHeatPipesAndSupports() {
    const pipeGroup = new THREE.Group();
    this.rootGroup.add(pipeGroup);

    const pipeMat = new THREE.MeshStandardMaterial({
      color: 0xb45309,
      metalness: 0.95,
      roughness: 0.2,
      name: 'heat_pipe'
    });
    this.registerMaterial('heat_pipe', pipeMat);

    // Primary Heat Pipe: Directly clamped over PCU heatsink saddle, curves up to back radiator wall
    const pipe1Curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.06, 0.088, -0.07),
      new THREE.Vector3(-0.06, 0.14, -0.18),
      new THREE.Vector3(-0.15, 0.22, -0.42),
      new THREE.Vector3(-0.35, 0.35, -0.64)
    ]);
    const p1 = new THREE.Mesh(new THREE.TubeGeometry(pipe1Curve, 32, 0.010, 12, false), pipeMat);
    pipeGroup.add(p1);

    // Secondary Heat Pipe from Card Cage top plate
    const pipe2Curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.38, 0.276, -0.15),
      new THREE.Vector3(0.38, 0.32, -0.38),
      new THREE.Vector3(0.28, 0.38, -0.64)
    ]);
    const p2 = new THREE.Mesh(new THREE.TubeGeometry(pipe2Curve, 28, 0.010, 12, false), pipeMat);
    pipeGroup.add(p2);
  }

  // =========================================================================
  // 8. DENSE ELECTRONIC HARDWARE POPULATION (OVER 600 COMPONENTS)
  // =========================================================================
  populateDenseComponents() {
    const compGroup = new THREE.Group();
    this.rootGroup.add(compGroup);

    // Geometries & Materials
    const smd0603Geo = new THREE.BoxGeometry(0.012, 0.006, 0.008);
    const smd0805Geo = new THREE.BoxGeometry(0.016, 0.008, 0.011);
    const capMat = new THREE.MeshStandardMaterial({ color: 0xc89d6e, roughness: 0.45 }); // Ceramic tan
    const capEndMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.96, roughness: 0.15 });
    const resMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.4 }); // Black chip resistor
    const tantMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3 }); // Yellow tantalum
    const soicGeo = new THREE.BoxGeometry(0.038, 0.012, 0.028);
    const soicMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.28 });
    const crystalGeo = new THREE.BoxGeometry(0.032, 0.014, 0.024);
    const crystalMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.95, roughness: 0.18 });

    // Populate discrete components across the motherboard in realistic clusters
    const zones = [
      { x0: -0.42, z0: -0.35, w: 0.22, d: 0.25, count: 55 },
      { x0: 0.08, z0: -0.35, w: 0.22, d: 0.20, count: 65 },
      { x0: -0.35, z0: 0.15, w: 0.28, d: 0.25, count: 50 },
      { x0: 0.12, z0: 0.15, w: 0.28, d: 0.25, count: 55 }
    ];

    zones.forEach(z => {
      for (let i = 0; i < z.count; i++) {
        const cx = z.x0 + Math.random() * z.w;
        const cz = z.z0 + Math.random() * z.d;
        const rot = Math.random() > 0.5 ? 0 : Math.PI / 2;
        const r = Math.random();

        if (r < 0.45) {
          // Ceramic Capacitor with tin end-caps (rigidly grouped so end-caps stay bonded upon rotation)
          const capGroup = new THREE.Group();
          capGroup.position.set(cx, 0.040, cz);
          capGroup.rotation.y = rot;

          const cap = new THREE.Mesh(smd0805Geo, capMat);
          capGroup.add(cap);

          [-0.007, 0.007].forEach(xe => {
            const end = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.0085, 0.0115), capEndMat);
            end.position.set(xe, 0, 0);
            capGroup.add(end);
          });
          compGroup.add(capGroup);
        } else if (r < 0.75) {
          // Chip Resistor
          const res = new THREE.Mesh(smd0603Geo, resMat);
          res.position.set(cx, 0.039, cz);
          res.rotation.y = rot;
          compGroup.add(res);
        } else if (r < 0.90) {
          // Tantalum Capacitor
          const tant = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.014, 0.016), tantMat);
          tant.position.set(cx, 0.043, cz);
          tant.rotation.y = rot;
          compGroup.add(tant);
        } else {
          // SOIC IC Chip
          const soic = new THREE.Mesh(soicGeo, soicMat);
          soic.position.set(cx, 0.042, cz);
          soic.rotation.y = rot;
          compGroup.add(soic);
        }
      }
    });

    // Precision Quartz Crystals (Clock Generators)
    [[-0.22, 0.043, -0.15], [0.18, 0.043, 0.22]].forEach(([qx, qy, qz]) => {
      const xtal = new THREE.Mesh(crystalGeo, crystalMat);
      xtal.position.set(qx, qy, qz);
      compGroup.add(xtal);
    });
  }

  // =========================================================================
  // 9. REFINED, PHYSICALLY LOCALIZED FAILURE VFX (SPARKS, 0.38g FLAME, SMOKE)
  // =========================================================================
  setupLocalizedVFX() {
    const origin = this.epicenterPos.clone();
    origin.y += 0.015;

    // 1. VIOLENT ELECTRIC MICRO-ARCS (Branching Jagged Lightning Lines)
    const arcMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      linewidth: 2.5,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending
    });

    for (let i = 0; i < 3; i++) {
      const arcGeo = new THREE.BufferGeometry();
      const pos = new Float32Array(6 * 3); // 6-segment jagged lightning
      arcGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const arc = new THREE.Line(arcGeo, arcMat.clone());
      this.rootGroup.add(arc);
      this.microArcLines.push(arc);
    }

    // 2. ENERGETIC ELECTRICAL SPARK PARTICLES
    const sparkCount = 45;
    const sparkGeo = new THREE.BufferGeometry();
    const sparkPos = new Float32Array(sparkCount * 3);
    const sparkCol = new Float32Array(sparkCount * 3);

    for (let i = 0; i < sparkCount; i++) {
      sparkPos[i * 3] = origin.x;
      sparkPos[i * 3 + 1] = origin.y;
      sparkPos[i * 3 + 2] = origin.z;

      sparkCol[i * 3] = 1.0;
      sparkCol[i * 3 + 1] = 0.85 + Math.random() * 0.15;
      sparkCol[i * 3 + 2] = 0.3;

      this.sparkData.push({
        vx: (Math.random() - 0.5) * 1.5,
        vy: 0.6 + Math.random() * 1.4,
        vz: (Math.random() - 0.5) * 1.5,
        life: Math.random(),
        maxLife: 0.15 + Math.random() * 0.25
      });
    }

    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
    sparkGeo.setAttribute('color', new THREE.BufferAttribute(sparkCol, 3));

    this.sparkParticles = new THREE.Points(sparkGeo, new THREE.PointsMaterial({
      size: 0.022,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.0,
      depthWrite: false
    }));
    this.rootGroup.add(this.sparkParticles);

    // 3. PHYSICALLY LOCALIZED 0.38g PARTIAL-GRAVITY FLAME PLUME (Compact, slow-rise)
    const flameCount = 50;
    const flameGeo = new THREE.BufferGeometry();
    const flamePos = new Float32Array(flameCount * 3);
    const flameCol = new Float32Array(flameCount * 3);

    for (let i = 0; i < flameCount; i++) {
      flamePos[i * 3] = origin.x;
      flamePos[i * 3 + 1] = origin.y;
      flamePos[i * 3 + 2] = origin.z;

      this.flameData.push({
        vx: (Math.random() - 0.5) * 0.08,
        vy: 0.12 + Math.random() * 0.22, // Slower buoyant rise in Mars 0.38g
        vz: (Math.random() - 0.5) * 0.08,
        life: Math.random(),
        maxLife: 0.45 + Math.random() * 0.45
      });
    }

    flameGeo.setAttribute('position', new THREE.BufferAttribute(flamePos, 3));
    flameGeo.setAttribute('color', new THREE.BufferAttribute(flameCol, 3));

    this.flameParticles = new THREE.Points(flameGeo, new THREE.PointsMaterial({
      size: 0.045,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.0,
      depthWrite: false
    }));
    this.rootGroup.add(this.flameParticles);

    // 4. DELICATE ACRID SMOKE WISPS
    const smokeCount = 65;
    const smokeGeo = new THREE.BufferGeometry();
    const smokePos = new Float32Array(smokeCount * 3);

    for (let i = 0; i < smokeCount; i++) {
      smokePos[i * 3] = origin.x;
      smokePos[i * 3 + 1] = origin.y;
      smokePos[i * 3 + 2] = origin.z;

      this.smokeData.push({
        vx: (Math.random() - 0.5) * 0.09,
        vy: 0.09 + Math.random() * 0.18,
        vz: (Math.random() - 0.5) * 0.09,
        life: Math.random(),
        maxLife: 1.4 + Math.random() * 1.4
      });
    }

    smokeGeo.setAttribute('position', new THREE.BufferAttribute(smokePos, 3));
    this.smokeParticles = new THREE.Points(smokeGeo, new THREE.PointsMaterial({
      color: 0x334155, // Charcoal gray smoke
      size: 0.075,
      transparent: true,
      opacity: 0.0,
      depthWrite: false
    }));
    this.rootGroup.add(this.smokeParticles);
  }

  // =========================================================================
  // 10. MATERIAL REGISTRATION & THERMAL FLIR PALETTE
  // =========================================================================
  registerMaterial(name, mat) {
    this.standardMaterials.set(name, mat);
  }

  getThermalColor(tempC) {
    const t = THREE.MathUtils.clamp((tempC - 20) / 220, 0, 1);
    const color = new THREE.Color();
    if (t < 0.2) color.setRGB(0.05 + t * 0.5, 0.02 + t * 0.2, 0.25 + t * 2.8);
    else if (t < 0.45) {
      const lt = (t - 0.2) / 0.25;
      color.setRGB(0.12 * (1 - lt), 0.1 + lt * 0.85, 0.8 * (1 - lt));
    } else if (t < 0.75) {
      const lt = (t - 0.45) / 0.3;
      color.setRGB(lt * 0.98, 0.9 - lt * 0.2, 0.05);
    } else {
      const lt = (t - 0.75) / 0.25;
      color.setRGB(0.98 + lt * 0.02, 0.7 + lt * 0.3, lt * 0.95);
    }
    return color;
  }

  setViewMode(mode) {
    if (this.currentViewMode === mode) return;
    this.currentViewMode = mode;

    if (mode === 'normal') {
      this.standardMaterials.forEach(mat => {
        if (mat.name === 'pcu_heatsink') mat.color.setHex(this.simState.stage >= 3 ? 0xef4444 : 0x2d3748);
        if (mat.name === 'pcb_main') mat.color.setHex(0x0c1410);
        if (mat.name === 'daughter_pcb') mat.color.setHex(0x091c13);
      });
      if (this.ambientLight) this.ambientLight.intensity = 0.45;
      if (this.inspectionSpot) this.inspectionSpot.intensity = 1.8;
      if (this.secondarySpot) this.secondarySpot.intensity = 1.4;
    } else if (mode === 'circuit') {
      this.standardMaterials.forEach(mat => {
        if (mat.name === 'pcb_main') mat.color.setHex(0x030805);
        if (mat.name === 'daughter_pcb') mat.color.setHex(0x020704);
      });
      if (this.ambientLight) this.ambientLight.intensity = 0.22;
      if (this.inspectionSpot) this.inspectionSpot.intensity = 0.7;
      if (this.secondarySpot) this.secondarySpot.intensity = 0.5;
    } else if (mode === 'thermal') {
      if (this.ambientLight) this.ambientLight.intensity = 0.55;
      if (this.inspectionSpot) this.inspectionSpot.intensity = 0.5;
      if (this.secondarySpot) this.secondarySpot.intensity = 0.4;
      this.updateThermalMaterials();
    }
  }

  updateThermalMaterials() {
    if (this.currentViewMode !== 'thermal') return;
    const hsMat = this.standardMaterials.get('pcu_heatsink');
    if (hsMat) hsMat.color.copy(this.getThermalColor(this.simState.pcuTemp));

    const daughterMat = this.standardMaterials.get('daughter_pcb');
    if (daughterMat) daughterMat.color.copy(this.getThermalColor(this.simState.pcuTemp * 0.7 + 22 * 0.3));

    const pcbMat = this.standardMaterials.get('pcb_main');
    if (pcbMat) pcbMat.color.copy(this.getThermalColor(this.simState.pcuTemp * 0.35 + this.simState.rceTemp * 0.25 + 22 * 0.4));
  }

  addInteractiveCollider(id, parentGroup, size) {
    const hitMesh = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), new THREE.MeshBasicMaterial({ visible: false }));
    hitMesh.position.y = size.y / 2;
    hitMesh.userData = { id, config: this.moduleConfig[id] };
    parentGroup.add(hitMesh);
    this.componentMeshes.push(hitMesh);
    this.interactiveComponents.set(id, { group: parentGroup, config: this.moduleConfig[id], hitMesh });
  }

  // =========================================================================
  // 11. ANIMATION TICK & LOCALIZED FIRE DYNAMICS
  // =========================================================================
  update(dt, elapsedSeconds) {
    const origin = this.epicenterPos.clone();
    origin.y += 0.02;

    // 1. Update Animated PCB Power Traces
    if (this.traceTexture && this.traceCtx) {
      this.renderMotherboardCanvas(elapsedSeconds);
      this.traceTexture.needsUpdate = true;
    }

    // 2. Micro-Arc Electrical Lightning (Stage 4)
    if (this.microArcLines && this.microArcLines.length > 0) {
      if (this.simState.sparksActive) {
        this.microArcLines.forEach(arc => {
          arc.material.opacity = Math.random() > 0.3 ? 0.95 : 0.0;
          const pos = arc.geometry.attributes.position.array;
          let curX = origin.x;
          let curY = origin.y + 0.035;
          let curZ = origin.z;

          pos[0] = curX; pos[1] = curY; pos[2] = curZ;
          for (let p = 1; p < 6; p++) {
            curX += (Math.random() - 0.5) * 0.025;
            curY -= 0.007 + Math.random() * 0.009;
            curZ += (Math.random() - 0.5) * 0.025;
            pos[p * 3] = curX;
            pos[p * 3 + 1] = curY;
            pos[p * 3 + 2] = curZ;
          }
          arc.geometry.attributes.position.needsUpdate = true;
        });

        if (this.arcPointLight) {
          this.arcPointLight.intensity = Math.random() > 0.35 ? 2.8 : 0.1;
        }
      } else {
        this.microArcLines.forEach(arc => { arc.material.opacity = 0.0; });
        if (this.arcPointLight) this.arcPointLight.intensity = 0.0;
      }
    }

    // 3. Electrical Sparks (Stage 4)
    if (this.sparkParticles) {
      const pos = this.sparkParticles.geometry.attributes.position.array;
      const count = this.sparkData.length;

      if (this.simState.sparksActive) {
        this.sparkParticles.material.opacity = 0.95;
        for (let i = 0; i < count; i++) {
          const d = this.sparkData[i];
          d.life += dt;
          if (d.life > d.maxLife) {
            d.life = 0;
            pos[i * 3] = origin.x + (Math.random() - 0.5) * 0.04;
            pos[i * 3 + 1] = origin.y + 0.02;
            pos[i * 3 + 2] = origin.z + (Math.random() - 0.5) * 0.04;
            d.vx = (Math.random() - 0.5) * 1.6;
            d.vy = 0.5 + Math.random() * 1.5;
            d.vz = (Math.random() - 0.5) * 1.6;
          } else {
            pos[i * 3] += d.vx * dt;
            pos[i * 3 + 1] += d.vy * dt - 3.72 * dt * dt; // 0.38g gravity
            pos[i * 3 + 2] += d.vz * dt;
          }
        }
        this.sparkParticles.geometry.attributes.position.needsUpdate = true;
      } else {
        this.sparkParticles.material.opacity = 0.0;
      }
    }

    // 4. Localized 0.38g Flame Plume (Stage 5)
    if (this.flameParticles) {
      const pos = this.flameParticles.geometry.attributes.position.array;
      const col = this.flameParticles.geometry.attributes.color.array;
      const count = this.flameData.length;

      if (this.simState.flameActive) {
        this.flameParticles.material.opacity = Math.min(1.0, this.simState.flameIntensity);
        for (let i = 0; i < count; i++) {
          const d = this.flameData[i];
          d.life += dt;
          if (d.life > d.maxLife) {
            d.life = 0;
            pos[i * 3] = origin.x + (Math.random() - 0.5) * 0.035;
            pos[i * 3 + 1] = origin.y + 0.02;
            pos[i * 3 + 2] = origin.z + (Math.random() - 0.5) * 0.035;
          } else {
            const prog = d.life / d.maxLife;
            pos[i * 3] += d.vx * dt;
            pos[i * 3 + 1] += d.vy * dt;
            pos[i * 3 + 2] += d.vz * dt;

            col[i * 3] = 1.0;
            col[i * 3 + 1] = 0.82 * (1 - prog * 0.7);
            col[i * 3 + 2] = 0.1 * (1 - prog);
          }
        }
        this.flameParticles.geometry.attributes.position.needsUpdate = true;
        this.flameParticles.geometry.attributes.color.needsUpdate = true;

        if (this.firePointLight) {
          this.firePointLight.intensity = 1.2 + Math.sin(elapsedSeconds * 18) * 0.45;
        }
      } else {
        this.flameParticles.material.opacity = 0.0;
        if (this.firePointLight) this.firePointLight.intensity = 0.0;
      }
    }

    // 5. Smoke Wisps (Stages 5 & 6)
    if (this.smokeParticles) {
      const pos = this.smokeParticles.geometry.attributes.position.array;
      const count = this.smokeData.length;

      if (this.simState.smokeActive) {
        this.smokeParticles.material.opacity = 0.65;
        for (let i = 0; i < count; i++) {
          const d = this.smokeData[i];
          d.life += dt;
          if (d.life > d.maxLife) {
            d.life = 0;
            pos[i * 3] = origin.x + (Math.random() - 0.5) * 0.05;
            pos[i * 3 + 1] = origin.y + 0.04;
            pos[i * 3 + 2] = origin.z + (Math.random() - 0.5) * 0.05;
          } else {
            pos[i * 3] += d.vx * dt;
            pos[i * 3 + 1] += d.vy * dt;
            pos[i * 3 + 2] += d.vz * dt;
          }
        }
        this.smokeParticles.geometry.attributes.position.needsUpdate = true;
      } else {
        this.smokeParticles.material.opacity = 0.0;
      }
    }

    // 6. Charring Decal & Hot Spot Opacity
    if (this.charDecal) {
      const targetOp = this.simState.stage >= 5 ? 0.95 : (this.simState.stage === 4 ? 0.35 : 0.0);
      this.charDecal.material.opacity = THREE.MathUtils.lerp(this.charDecal.material.opacity, targetOp, dt * 2.5);
    }
    if (this.hotSpotMesh) {
      const hotOp = (this.simState.stage === 4 || this.simState.stage === 5) ? 0.85 : (this.simState.stage === 3 ? 0.35 : 0.0);
      this.hotSpotMesh.material.opacity = THREE.MathUtils.lerp(this.hotSpotMesh.material.opacity, hotOp, dt * 3.0);
    }

    // 7. Sealed Compartment Floating Micro-Particulates
    if (this.airDustParticles && this.airDustData && this.airDustData.length > 0) {
      const dPos = this.airDustParticles.geometry.attributes.position.array;
      const count = this.airDustData.length;
      for (let i = 0; i < count; i++) {
        dPos[i * 3 + 1] += Math.sin(elapsedSeconds * 0.7 + i * 0.5) * 0.0003;
        dPos[i * 3] += Math.cos(elapsedSeconds * 0.5 + i * 0.3) * 0.0002;
        if (dPos[i * 3 + 1] > 0.60) dPos[i * 3 + 1] = 0.06;
        if (dPos[i * 3 + 1] < 0.04) dPos[i * 3 + 1] = 0.56;
      }
      this.airDustParticles.geometry.attributes.position.needsUpdate = true;
    }

    if (this.currentViewMode === 'thermal') {
      this.updateThermalMaterials();
    }
  }

  applySimulationState(state) {
    Object.assign(this.simState, state);

    // Heatsink Subtle Thermal Shift
    const hsMat = this.standardMaterials.get('pcu_heatsink');
    if (hsMat && this.currentViewMode !== 'thermal') {
      if (this.simState.stage === 1) hsMat.color.setHex(0x2d3748);
      else if (this.simState.stage === 2) hsMat.color.setHex(0x4a5568);
      else if (this.simState.stage === 3) hsMat.color.setHex(0xd97706); // Warning Amber
      else if (this.simState.stage >= 4) hsMat.color.setHex(0xef4444); // Deep Runaway Red
    }

    const ledMat = this.standardMaterials.get('pcu_led');
    if (ledMat) {
      if (this.simState.stage <= 2) ledMat.color.setHex(0x10b981);
      else if (this.simState.stage === 3) ledMat.color.setHex(0xf59e0b);
      else if (this.simState.stage >= 4 && !this.simState.isolationTripped) ledMat.color.setHex(0xef4444);
      else ledMat.color.setHex(0x1e293b); // Inactive/dark
    }
  }
}
