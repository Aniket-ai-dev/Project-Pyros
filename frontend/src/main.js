/**
 * main.js
 * NASA Aero-Fire 3D Coordinator.
 * Manages WebGPU/WebGL2 fluid physics, Three.js volumetric raymarching,
 * chamber environment, and interactive telemetry HUD.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { SimulationConfig, GAS_PRESETS } from './physics/CombustionPhysics.js';
import { WebGPUFluidSolver } from './physics/WebGPUFluidSolver.js';
import { WebGL2FluidSolver } from './physics/WebGL2FluidSolver.js';
import { VolumetricFirePass } from './rendering/VolumetricFirePass.js';
import { ChamberScene } from './rendering/ChamberScene.js';
import { TelemetryHUD } from './ui/TelemetryHUD.js';
import { SliceInspector } from './ui/SliceInspector.js';
import { Controls } from './ui/Controls.js';

export class AeroFireApp {
  constructor() {
    this.config = new SimulationConfig();
    this.canvas3D = document.getElementById('canvas-3d');
    this.sliceCanvas = document.getElementById('canvas-slice');

    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.controls = null;
    this.isDestroyed = false;
    this.rafId = null;

    this.solver = null;
    this.engineType = 'WebGL2'; // 'WebGPU' or 'WebGL2'
    this.chamber = null;
    this.firePass = null;
    this.telemetryHUD = null;
    this.sliceInspector = null;
    this.controlsUI = null;

    this.sparkActive = false;
    this.sparkTimer = 0;
    this.sparkMesh = null;
    this.showWireframe = true;

    this.init();
  }

  async init() {
    this.setupThreeScene();
    await this.setupSolver();
    this.setupChamberAndFire();
    this.setupUI();
    this.setupSparkEffect();

    this._onResize = () => this.onWindowResize();
    window.addEventListener('resize', this._onResize);

    // Auto-ignite initial flame with a spark
    this.triggerSpark();

    // Start render loop
    this.rafId = requestAnimationFrame((t) => this.renderLoop(t));
  }

  setupThreeScene() {
    // Setup Three.js WebGL2 Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas3D,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x06090e);

    // Camera setup - positioned for close-up view of the flame & candle
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 50);
    this.camera.position.set(0.0, 0.50, 1.85);

    // Orbit Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.target.set(0, 0.32, 0);
    this.controls.maxPolarAngle = Math.PI * 0.55;
    this.controls.minDistance = 0.5;
    this.controls.maxDistance = 8.0;
  }

  async setupSolver() {
    // Attempt WebGPU detection first
    let webgpuSupported = false;
    if (navigator.gpu) {
      try {
        const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
        if (adapter) {
          const device = await adapter.requestDevice();
          const gpuSolver = new WebGPUFluidSolver(this.config);
          const ok = await gpuSolver.init(device);
          if (ok) {
            this.solver = gpuSolver;
            this.engineType = 'WebGPU';
            webgpuSupported = true;
            console.log('[ENGAGED] WebGPU Compute Shader Navier-Stokes Engine Engaged.');
          }
        }
      } catch (e) {
        console.warn('WebGPU init failed, falling back to WebGL2:', e);
      }
    }

    if (!webgpuSupported) {
      // Use WebGL2 Solver (Three.js GPGPU)
      this.solver = new WebGL2FluidSolver(this.renderer, this.config);
      this.engineType = 'WebGL2';
      console.log('[ENGAGED] WebGL2 GPGPU Navier-Stokes Engine Engaged.');
    }
  }

  setupChamberAndFire() {
    // Build NASA chamber apparatus & burner nozzle
    this.chamber = new ChamberScene(this.scene, this.config);

    // Build Volumetric Raymarching Pass
    this.firePass = new VolumetricFirePass(this.config, this.solver);
    this.scene.add(this.firePass.mesh);
  }

  setupSparkEffect() {
    // Visual electric spark between tungsten electrodes
    const sparkGeo = new THREE.BufferGeometry();
    const positions = new Float32Array([
      0.12 * Math.cos(Math.PI * 0.25), 0.26, 0.12 * Math.sin(Math.PI * 0.25),
      0, 0.26, 0,
      0.12 * Math.cos(Math.PI * 1.25), 0.26, 0.12 * Math.sin(Math.PI * 1.25)
    ]);
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const sparkMat = new THREE.LineBasicMaterial({
      color: 0x88e0ff,
      linewidth: 3,
      transparent: true,
      opacity: 0.0
    });
    this.sparkMesh = new THREE.Line(sparkGeo, sparkMat);
    this.scene.add(this.sparkMesh);
  }

  setupUI() {
    // Telemetry HUD
    const hudContainer = document.getElementById('telemetry-hud');
    this.telemetryHUD = new TelemetryHUD(hudContainer, this.config);
    this.telemetryHUD.setEngine(
      this.engineType === 'WebGPU' ? 'WebGPU Compute (WGSL)' : 'WebGL2 GPGPU'
    );

    // 2D Cross-section Slice Inspector
    this.sliceInspector = new SliceInspector(this.sliceCanvas, this.config, this.solver);

    // Controls Panel
    const controlsContainer = document.getElementById('controls-panel');
    this.controlsUI = new Controls(
      controlsContainer,
      this.config,
      (type, val) => {
        if (type === 'wireframe') {
          this.showWireframe = val;
        } else if (type === 'preset') {
          this.triggerSpark();
        }
      },
      () => this.triggerSpark(),
      () => this.resetSimulation()
    );

    // Header Toolbar Event Listeners
    const btnToggleTelemetry = document.getElementById('btn-toggle-telemetry');
    const leftDock = document.getElementById('left-dock-container');
    const btnToggleControls = document.getElementById('btn-toggle-controls');
    const rightDock = document.getElementById('right-dock-container');

    // On mobile screens (< 840px), keep left telemetry collapsed by default for full 3D flame viewport visibility
    if (window.innerWidth < 840) {
      if (leftDock) leftDock.classList.add('collapsed');
      if (btnToggleTelemetry) btnToggleTelemetry.classList.remove('active');
    }

    if (btnToggleTelemetry && leftDock) {
      btnToggleTelemetry.addEventListener('click', () => {
        const isCollapsed = leftDock.classList.toggle('collapsed');
        btnToggleTelemetry.classList.toggle('active', !isCollapsed);
        // On mobile, collapse controls dock if opening telemetry dock
        if (!isCollapsed && window.innerWidth < 840 && rightDock) {
          rightDock.classList.add('collapsed');
          if (btnToggleControls) btnToggleControls.classList.remove('active');
        }
      });
    }

    if (btnToggleControls && rightDock) {
      btnToggleControls.addEventListener('click', () => {
        const isCollapsed = rightDock.classList.toggle('collapsed');
        btnToggleControls.classList.toggle('active', !isCollapsed);
        // On mobile, collapse telemetry dock if opening controls dock
        if (!isCollapsed && window.innerWidth < 840 && leftDock) {
          leftDock.classList.add('collapsed');
          if (btnToggleTelemetry) btnToggleTelemetry.classList.remove('active');
        }
      });
    }

    // Physics Guide Modal Listeners
    const guideModal = document.getElementById('physics-guide-modal');
    const btnOpenGuide = document.getElementById('btn-open-guide');
    const btnCloseGuide = document.getElementById('btn-close-guide');

    if (btnOpenGuide && guideModal) {
      btnOpenGuide.addEventListener('click', () => {
        guideModal.classList.add('open');
      });
    }

    if (btnCloseGuide && guideModal) {
      btnCloseGuide.addEventListener('click', () => {
        guideModal.classList.remove('open');
      });
    }

    if (guideModal) {
      guideModal.addEventListener('click', (e) => {
        if (e.target === guideModal) {
          guideModal.classList.remove('open');
        }
      });
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          guideModal.classList.remove('open');
        }
      });
    }
  }

  triggerSpark() {
    this.sparkActive = true;
    this.sparkTimer = 0.35; // 350ms spark duration
    if (this.sparkMesh) {
      this.sparkMesh.material.opacity = 1.0;
    }
  }

  resetSimulation() {
    if (this.solver) {
      this.solver.reset();
    }
  }

  onWindowResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  renderLoop(timestamp) {
    if (this.isDestroyed) return;
    this.rafId = requestAnimationFrame((t) => this.renderLoop(t));

    const time = timestamp * 0.001;

    // Update Spark Timer
    if (this.sparkActive) {
      this.sparkTimer -= 0.016;
      if (this.sparkMesh) {
        // Flickering electrical spark
        const pos = this.sparkMesh.geometry.attributes.position.array;
        pos[3] = (Math.random() - 0.5) * 0.04;
        pos[4] = 0.26 + (Math.random() - 0.5) * 0.04;
        pos[5] = (Math.random() - 0.5) * 0.04;
        this.sparkMesh.geometry.attributes.position.needsUpdate = true;
        this.sparkMesh.material.opacity = Math.random() > 0.2 ? 1.0 : 0.3;
      }
      if (this.sparkTimer <= 0) {
        this.sparkActive = false;
        if (this.sparkMesh) this.sparkMesh.material.opacity = 0.0;
      }
    }

    const gasConfig = GAS_PRESETS[this.config.fuelType] || GAS_PRESETS.propane;

    // 1. Advance Navier-Stokes Fluid Physics
    if (this.solver && !this.config.paused) {
      this.solver.step(gasConfig, this.sparkActive);
    }

    // 2. Update Volumetric Raymarching Texture
    if (this.firePass) {
      if (this.engineType === 'WebGL2') {
        const tex = this.solver.getScalarTexture();
        this.firePass.update(time, tex, false);
      } else {
        // WebGPU volume texture
        this.firePass.update(time, null, true);
      }
    }

    // 3. Update Dynamic Chamber & Flame Point Lighting
    if (this.chamber) {
      this.chamber.update(
        time,
        0.75, // normalized peak temp
        this.config.gravity,
        this.config.burnerShape,
        this.showWireframe
      );
    }

    // 4. Update Orbit Controls & Render 3D Scene
    this.controls.update();
    this.renderer.render(this.scene, this.camera);

    // 5. Update 2D Slice Visualizer
    if (this.sliceInspector) {
      this.sliceInspector.render();
    }

    // 6. Update Telemetry HUD
    if (this.telemetryHUD) {
      this.telemetryHUD.update(gasConfig);
    }
  }

  destroy() {
    this.isDestroyed = true;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    if (this._onResize) window.removeEventListener('resize', this._onResize);
    if (this.renderer) {
      try { this.renderer.dispose(); } catch (e) {}
    }
    if (this.controls) {
      try { this.controls.dispose(); } catch (e) {}
    }
    if (this.solver && typeof this.solver.dispose === 'function') {
      try { this.solver.dispose(); } catch (e) {}
    }
  }
}


