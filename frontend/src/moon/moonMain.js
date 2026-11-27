/**
 * moonMain.js
 * Coordinator for PROJECT PYROS - NASA Inflatable Ice Home on the Moon 3D Simulation.
 * Controls WebGL rendering, camera kinematics, viewpoint presets, telemetry HUD, and Main Menu routing.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MoonBaseScene } from './MoonBaseScene.js';
import { CriteriaAuditModal } from '../ui/CriteriaAuditModal.js';

export class MoonBaseApp {
  constructor() {
    this.canvas = document.getElementById('canvas-moon');
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.controls = null;
    this.moonScene = null;
    this.isDestroyed = false;
    this.rafId = null;

    // Camera animation state
    this.isTransitioning = false;
    this.currentView = 'panorama';
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

    this._onResize = () => this.onWindowResize();
    window.addEventListener('resize', this._onResize);
    this.rafId = requestAnimationFrame((t) => this.renderLoop(t));
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.shadowMap.autoUpdate = false;
    this.renderer.shadowMap.needsUpdate = true;
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

    this.userInteracted = false;
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.enableRotate = true;
    this.controls.enablePan = true;
    this.controls.enableZoom = true;
    this.controls.minDistance = 2.0;
    this.controls.maxDistance = 68.0;
    this.controls.maxPolarAngle = Math.PI * 0.48;
    this.controls.target.set(0.0, 2.4, 0.0);
    this.controls.addEventListener('start', () => {
      this.userInteracted = true;
    });
    this.controls.update();
  }

  setupKeyboardControls() {
    this._onKeyDown = (e) => {
      const tag = e.target && e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': this.keys.forward = true; this.userInteracted = true; break;
        case 'KeyS': case 'ArrowDown': this.keys.backward = true; this.userInteracted = true; break;
        case 'KeyA': case 'ArrowLeft': this.keys.left = true; this.userInteracted = true; break;
        case 'KeyD': case 'ArrowRight': this.keys.right = true; this.userInteracted = true; break;
        case 'Space':
          this.keys.up = true;
          this.userInteracted = true;
          e.preventDefault();
          break;
        case 'ShiftLeft': case 'ShiftRight': this.keys.down = true; this.userInteracted = true; break;
      }
    };
    this._onKeyUp = (e) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': this.keys.forward = false; break;
        case 'KeyS': case 'ArrowDown': this.keys.backward = false; break;
        case 'KeyA': case 'ArrowLeft': this.keys.left = false; break;
        case 'KeyD': case 'ArrowRight': this.keys.right = false; break;
        case 'Space': this.keys.up = false; break;
        case 'ShiftLeft': case 'ShiftRight': this.keys.down = false; break;
      }
    };
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
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
    const resetButtons = document.querySelectorAll('#btn-reset-cam, [data-action="reset-view"]');
    resetButtons.forEach(btnReset => {
      btnReset.addEventListener('click', () => {
        this.userInteracted = false;
        this.transitionToView('panorama');
        btnReset.classList.add('active');
        setTimeout(() => {
          btnReset.classList.remove('active');
        }, 500);
        document.querySelectorAll('.viewpoint-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.view === 'panorama');
        });
      });
    });

    // 3. HUD Collapse / Toggle / Reopen
    const btnToggleHud = document.getElementById('btn-toggle-hud');
    const hudPanel = document.getElementById('hud-moon-panel');
    const btnCollapse = document.getElementById('btn-collapse-hud');
    const tabReopen = document.getElementById('tab-reopen-hud');

    if (hudPanel) {
      hudPanel.addEventListener('wheel', (e) => {
        e.stopPropagation();
      }, { passive: true });
      hudPanel.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
      });
      hudPanel.addEventListener('touchstart', (e) => {
        e.stopPropagation();
      }, { passive: true });
      hudPanel.addEventListener('touchmove', (e) => {
        e.stopPropagation();
      }, { passive: true });
    }

    const setCollapsed = (collapsed) => {
      if (hudPanel) hudPanel.classList.toggle('collapsed', collapsed);
      if (btnToggleHud) btnToggleHud.classList.toggle('active', !collapsed);
      if (tabReopen) tabReopen.classList.toggle('visible', collapsed);
    };

    if (btnToggleHud && hudPanel) {
      btnToggleHud.addEventListener('click', () => {
        setCollapsed(!hudPanel.classList.contains('collapsed'));
      });
    }

    if (btnCollapse && hudPanel) {
      btnCollapse.addEventListener('click', () => setCollapsed(true));
    }

    if (tabReopen) {
      tabReopen.addEventListener('click', () => setCollapsed(false));
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

    // 5. Chamber Venting / Hard Vacuum Extinction Interactive Simulation
    const btnVent = document.getElementById('btn-vent-chamber');
    const chamberBadge = document.getElementById('chamber-status-badge');
    const btnVentLabel = document.getElementById('btn-vent-label');

    let isChamberVented = false;

    if (btnVent) {
      btnVent.addEventListener('click', () => {
        isChamberVented = !isChamberVented;

        // Smoothly glide camera to frame the combustion testbed so the user clearly sees the action!
        this.currentView = 'combustion';
        this.startCinematicTransition(
          new THREE.Vector3(-2.8, 1.65, 9.6),
          new THREE.Vector3(-2.8, 1.35, 6.8)
        );

        if (isChamberVented) {
          // Vent chamber to ambient Lunar hard vacuum (10^-10 Pa, 0.0% O2) -> Instant flame extinction
          if (this.moonScene) {
            this.moonScene.extinguishFlame();
          }

          if (chamberBadge) {
            chamberBadge.className = 'chamber-status-badge vented';
            chamberBadge.innerHTML = '<span class="status-dot warn"></span><span id="chamber-status-text">VENTED // VACUUM EXTINCTION (0% O2)</span>';
          }
          btnVent.classList.add('reignite');
          if (btnVentLabel) {
            btnVentLabel.textContent = 'Re-pressurize & Reignite (21% O2)';
          }
        } else {
          // Re-seal & re-pressurize with habitat air (21% O2, 101.3 kPa) -> Reignite flame
          if (this.moonScene) {
            this.moonScene.reigniteFlame();
          }

          if (chamberBadge) {
            chamberBadge.className = 'chamber-status-badge sealed';
            chamberBadge.innerHTML = '<span class="status-dot online"></span><span id="chamber-status-text">SEALED (21% O2 // 101.3 kPa)</span>';
          }
          btnVent.classList.remove('reignite');
          if (btnVentLabel) {
            btnVentLabel.textContent = 'Vent Chamber to Lunar Vacuum';
          }
        }
      });
    }
  }

  setupSimulationModes() {
    const modeSpecs = {
      normal: { label: 'NOMINAL', pill: 'hud-pill online', solar: '14.8 kW', load: '8.4 kW', batt: '94%', o2: '21.3 kPa (21%)', ice: '-22.4 C' },
      power: { label: 'PEAK SOLAR', pill: 'hud-pill eva', solar: '22.4 kW', load: '9.1 kW', batt: '99%', o2: '21.3 kPa (21%)', ice: '-19.8 C' },
      lifesupport: { label: 'ECLSS BOOST', pill: 'hud-pill online', solar: '14.8 kW', load: '11.6 kW', batt: '91%', o2: '23.1 kPa (22.8%)', ice: '-21.0 C' },
      thermal: { label: 'THERMAL LOOP', pill: 'hud-pill', solar: '14.2 kW', load: '10.8 kW', batt: '89%', o2: '21.2 kPa (20.9%)', ice: '-14.2 C' },
      emergency: { label: 'EMERGENCY', pill: 'hud-pill critical', solar: '6.2 kW', load: '4.1 kW', batt: '62%', o2: '18.6 kPa (18.4%)', ice: '-24.8 C' },
    };

    document.querySelectorAll('.moon-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        if (!mode) return;
        document.querySelectorAll('.moon-mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (this.moonScene) {
          this.moonScene.setSimulationMode(mode);
        }
        const spec = modeSpecs[mode] || modeSpecs.normal;
        const badge = document.getElementById('moon-mode-badge');
        if (badge) { badge.textContent = spec.label; badge.className = spec.pill; }
        const sEl = document.getElementById('moon-solar-kw');
        if (sEl) sEl.textContent = spec.solar;
        const lEl = document.getElementById('moon-load-kw');
        if (lEl) lEl.textContent = spec.load;
        const bEl = document.getElementById('moon-battery-pct');
        if (bEl) bEl.textContent = spec.batt;
        const oEl = document.getElementById('moon-o2-kpa');
        if (oEl) oEl.textContent = spec.o2;
        const iEl = document.getElementById('moon-ice-temp');
        if (iEl) iEl.textContent = spec.ice;
      });
    });
  }

  setupPyrosMenu() {
    const btnOpen = document.getElementById('btn-open-main-menu');
    const btnClose = document.getElementById('btn-close-main-menu');
    const menuOverlay = document.getElementById('pyros-main-menu');
    const btnResume = document.getElementById('btn-resume-moon');

    if (btnOpen) {
      btnOpen.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.location.href = '/';
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

  startCinematicTransition(targetPos, targetLookAt) {
    this.isTransitioning = true;
    this.camStartPos.copy(this.camera.position);
    this.camEndPos.copy(targetPos);
    this.targetStart.copy(this.controls ? this.controls.target : new THREE.Vector3(0.0, 2.4, 0.0));
    this.targetEnd.copy(targetLookAt);
    this.transitionStart = performance.now();
  }

  updateCinematicTransition(now) {
    if (!this.isTransitioning) return;

    const elapsed = now - this.transitionStart;
    const progress = Math.min(1.0, elapsed / this.transitionDuration);
    const ease = progress < 0.5
      ? 2 * progress * progress
      : -1 + (4 - 2 * progress) * progress;

    this.camera.position.lerpVectors(this.camStartPos, this.camEndPos, ease);
    if (this.controls) {
      this.controls.target.lerpVectors(this.targetStart, this.targetEnd, ease);
      this.controls.update();
    } else {
      const currentTarget = new THREE.Vector3().lerpVectors(this.targetStart, this.targetEnd, ease);
      this.camera.lookAt(currentTarget);
    }

    if (progress >= 1.0) {
      this.isTransitioning = false;
    }
  }

  transitionToView(viewType = 'panorama') {
    this.currentView = viewType;
    if (viewType === 'combustion') {
      this.startCinematicTransition(
        new THREE.Vector3(-2.8, 1.65, 9.6),
        new THREE.Vector3(-2.8, 1.35, 6.8)
      );
    } else if (viewType === 'habitat') {
      this.startCinematicTransition(
        new THREE.Vector3(3.6, 4.4, 14.0),
        new THREE.Vector3(0.0, 2.4, 0.0)
      );
    } else if (viewType === 'power') {
      this.startCinematicTransition(
        new THREE.Vector3(14.5, 5.8, 11.8),
        new THREE.Vector3(6.2, 2.0, 1.5)
      );
    } else {
      this.startCinematicTransition(
        new THREE.Vector3(-6.2, 6.8, 29.0),
        new THREE.Vector3(0.0, 2.4, 0.0)
      );
    }
  }

  updateCameraTransition(now) {
    this.updateCinematicTransition(now);
  }

  updateFreeFlight(delta) {
    if (this.isTransitioning || !this.camera || !this.controls) return;
    if (!this._fwd) {
      this._fwd = new THREE.Vector3();
      this._right = new THREE.Vector3();
      this._up = new THREE.Vector3(0, 1, 0);
      this._delta = new THREE.Vector3();
    }
    const speed = 12.0 * delta;
    this.camera.getWorldDirection(this._fwd);
    this._fwd.y = 0;
    if (this._fwd.lengthSq() > 0.0001) this._fwd.normalize();
    else this._fwd.set(0, 0, -1);
    this._right.crossVectors(this._fwd, this._up).normalize();

    let moved = false;
    this._delta.set(0, 0, 0);
    if (this.keys.forward) { this._delta.addScaledVector(this._fwd, speed); moved = true; }
    if (this.keys.backward) { this._delta.addScaledVector(this._fwd, -speed); moved = true; }
    if (this.keys.right) { this._delta.addScaledVector(this._right, speed); moved = true; }
    if (this.keys.left) { this._delta.addScaledVector(this._right, -speed); moved = true; }
    if (this.keys.up) { this._delta.y += speed; moved = true; }
    if (this.keys.down) { this._delta.y -= speed; moved = true; }

    if (moved) {
      this.camera.position.add(this._delta);
      this.controls.target.add(this._delta);
      if (this.camera.position.y < 0.8) this.camera.position.y = 0.8;
    }
  }

  onWindowResize() {
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  renderLoop(timestamp) {
    if (this.isDestroyed) return;
    this.rafId = requestAnimationFrame((t) => this.renderLoop(t));

    const delta = Math.min((timestamp - this.lastTimestamp) / 1000.0, 0.1);
    this.lastTimestamp = timestamp;

    const t = timestamp * 0.001;

    // Update cinematic glide and free flight
    this.updateCinematicTransition(timestamp);
    this.updateFreeFlight(delta);

    // Subtle cinematic panorama breathing until user interacts manually
    if (!this.isTransitioning && !this.userInteracted && this.currentView === 'panorama') {
      const driftX = Math.sin(t * 0.22) * 0.45;
      const driftY = Math.cos(t * 0.18) * 0.22;
      this.camera.position.set(-6.2 + driftX, 6.8 + driftY, 29.0);
      this.camera.lookAt(0.0, 2.4, 0.0);
    } else if (!this.isTransitioning && this.controls) {
      this.controls.update();
    }

    if (this.moonScene) {
      this.moonScene.update(delta, t);
    }

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    this.isDestroyed = true;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    if (this._onResize) window.removeEventListener('resize', this._onResize);
    if (this._onKeyDown) window.removeEventListener('keydown', this._onKeyDown);
    if (this._onKeyUp) window.removeEventListener('keyup', this._onKeyUp);
    if (this.renderer) {
      try { this.renderer.dispose(); } catch (e) {}
    }
    if (this.controls) {
      try { this.controls.dispose(); } catch (e) {}
    }
    if (this.moonScene && typeof this.moonScene.dispose === 'function') {
      try { this.moonScene.dispose(); } catch (e) {}
    }
  }
}

