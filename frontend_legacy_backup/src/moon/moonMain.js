/**
 * moonMain.js
 * Coordinator for PROJECT PYROS - NASA Inflatable Ice Home on the Moon 3D Simulation.
 * Controls WebGL rendering, camera kinematics, viewpoint presets, telemetry HUD, and Main Menu routing.
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/controls/OrbitControls.js';
import { MoonBaseScene } from './MoonBaseScene.js?v=v114_ice_home_on_moon';
import { CriteriaAuditModal } from '../ui/CriteriaAuditModal.js?v=v112_syntax_fix';

class MoonBaseApp {
  constructor() {
    this.canvas = document.getElementById('canvas-moon');
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.controls = null;
    this.moonScene = null;

    // Camera animation state
    this.isTransitioning = false;
    this.camStartPos = new THREE.Vector3();
    this.camEndPos = new THREE.Vector3();
    this.targetStart = new THREE.Vector3();
    this.targetEnd = new THREE.Vector3();
    this.transitionStart = 0;
    this.transitionDuration = 1800;

    // Movement state (WASD / Arrows)
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      up: false,
      down: false
    };

    this.lastTimestamp = 0;
    this.init();
  }

  init() {
    this.setupRenderer();
    this.setupCamera();
    this.setupKeyboardControls();
    this.setupScene();
    this.setupEvents();
    this.setupSimulationModes();
    this.setupPyrosMenu();
    this.setupCriteriaAudit();

    window.addEventListener('resize', () => this.onWindowResize());
    requestAnimationFrame((t) => this.renderLoop(t));
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
  }

  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      800
    );
    // Scenic elevated panorama view framing the Moon Base and open starry sky
    this.camera.position.set(-6.2, 6.8, 29.0);
    this.camera.lookAt(0.0, 2.4, 0.0);

    // Camera is completely fixed per user specification: disable all user movement
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enabled = false;
    this.controls.enableRotate = false;
    this.controls.enablePan = false;
    this.controls.enableZoom = false;
    this.controls.target.set(0.0, 2.4, 0.0);
    this.controls.update();
  }

  setupKeyboardControls() {
    // Camera is completely fixed per user specification; flight controls disabled
  }

  setupScene() {
    this.scene = new THREE.Scene();
    this.moonScene = new MoonBaseScene(this.scene);
  }

  setupEvents() {
    // 1. Viewpoint navigation buttons
    const viewButtons = document.querySelectorAll('.viewpoint-btn');
    viewButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        viewButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const viewType = btn.dataset.view;
        this.transitionToView(viewType);
      });
    });

    // 2. Camera Reset
    const btnReset = document.getElementById('btn-reset-cam');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        this.transitionToView('panorama');
        document.querySelectorAll('.viewpoint-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.view === 'panorama');
        });
      });
    }

    // 3. HUD Collapse / Toggle
    const btnToggleHud = document.getElementById('btn-toggle-hud');
    const hudPanel = document.getElementById('hud-moon-panel');
    const btnCollapse = document.getElementById('btn-collapse-hud');

    if (btnToggleHud && hudPanel) {
      btnToggleHud.addEventListener('click', () => {
        hudPanel.classList.toggle('collapsed');
        btnToggleHud.classList.toggle('active', !hudPanel.classList.contains('collapsed'));
      });
    }

    if (btnCollapse && hudPanel) {
      btnCollapse.addEventListener('click', () => {
        hudPanel.classList.add('collapsed');
        if (btnToggleHud) btnToggleHud.classList.remove('active');
      });
    }

    // 4. Fullscreen
    const btnFullscreen = document.getElementById('btn-fullscreen');
    if (btnFullscreen) {
      btnFullscreen.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });
    }
  }

  setupSimulationModes() {
    // Simulation modes removed per user specification; base operates in nominal mode
  }

  setupPyrosMenu() {
    const btnOpen = document.getElementById('btn-open-main-menu');
    const btnClose = document.getElementById('btn-close-main-menu');
    const menuOverlay = document.getElementById('pyros-main-menu');
    const btnResume = document.getElementById('btn-resume-moon');

    if (btnOpen && menuOverlay) {
      btnOpen.addEventListener('click', () => {
        menuOverlay.style.display = 'flex';
      });
    }

    if (btnClose && menuOverlay) {
      btnClose.addEventListener('click', () => {
        menuOverlay.style.display = 'none';
      });
    }

    if (btnResume && menuOverlay) {
      btnResume.addEventListener('click', () => {
        menuOverlay.style.display = 'none';
      });
    }

    if (menuOverlay) {
      menuOverlay.addEventListener('click', (e) => {
        if (e.target === menuOverlay || e.target.classList.contains('pyros-menu-backdrop')) {
          menuOverlay.style.display = 'none';
        }
      });
    }
  }

  setupCriteriaAudit() {
    const btnAudit = document.getElementById('btn-criteria-audit');
    if (btnAudit) {
      btnAudit.addEventListener('click', () => {
        const audit = new CriteriaAuditModal();
        audit.open();
      });
    }
  }

  transitionToView(viewType = 'panorama') {
    // Fixed panorama viewpoint
    this.camera.position.set(-6.2, 6.8, 29.0);
    this.camera.lookAt(0.0, 2.4, 0.0);
    if (this.controls) {
      this.controls.target.set(0.0, 2.4, 0.0);
      this.controls.enabled = false;
      this.controls.update();
    }
  }

  updateCameraTransition(now) {
    // Camera is fixed
  }

  updateFreeFlight(delta) {
    // Camera is fixed
  }

  onWindowResize() {
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.camera.lookAt(0.0, 2.4, 0.0);
  }

  renderLoop(timestamp) {
    requestAnimationFrame((t) => this.renderLoop(t));

    const delta = Math.min((timestamp - this.lastTimestamp) / 1000.0, 0.1);
    this.lastTimestamp = timestamp;

    const t = timestamp * 0.001;

    // Subtle, gentle cinematic panorama breathing (keeps camera fixed on base, but removes the frozen static feel)
    const driftX = Math.sin(t * 0.22) * 0.45;
    const driftY = Math.cos(t * 0.18) * 0.22;
    this.camera.position.set(-6.2 + driftX, 6.8 + driftY, 29.0);
    this.camera.lookAt(0.0, 2.4, 0.0);

    if (this.moonScene) {
      this.moonScene.update(delta, t);
    }

    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new MoonBaseApp();
});
