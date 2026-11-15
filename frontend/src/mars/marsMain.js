/**
 * marsMain.js
 * Coordinator for the PROJECT PYROS - Mars Planet Surface 3D Environment.
 * Controls WebGL rendering, orbital & WASD cameras, telemetry HUD, and Main Menu routing.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MarsSurfaceScene } from './MarsSurfaceScene.js';
import { CriteriaAuditModal } from '../ui/CriteriaAuditModal.js';

export class MarsApp {
  constructor() {
    this.canvas = document.getElementById('canvas-mars');
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.controls = null;
    this.marsScene = null;
    this.isDestroyed = false;
    this.rafId = null;

    // Camera animation state
    this.isTransitioning = false;
    this.camStartPos = new THREE.Vector3();
    this.camEndPos = new THREE.Vector3();
    this.targetStart = new THREE.Vector3();
    this.targetEnd = new THREE.Vector3();
    this.transitionStart = 0;
    this.transitionDuration = 1800;

    // Movement state
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      up: false,
      down: false
    };

    this.lastTimestamp = 0;
    this.solTime = 142.42;

    this.init();
  }

  init() {
    this.setupRenderer();
    this.setupCamera();
    // Keyboard translation disabled: camera locked strictly to OrbitControls
    this.setupScene();
    this.setupEvents();
    this.setupPyrosMenu();

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
      52,
      window.innerWidth / window.innerHeight,
      0.1,
      600
    );
    // Initial scenic panorama viewpoint framing the NASA Ice Home complex
    this.camera.position.set(0.5, 3.8, 19.5);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.target.set(0.0, 3.0, 0.0);
    this.controls.maxPolarAngle = Math.PI * 0.49; // Don't clip below ground
    this.controls.minDistance = 1.2;
    this.controls.maxDistance = 140;
    this.controls.update();
  }

  setupKeyboardControls() {
    this._onKeyDown = (e) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': this.keys.forward = true; break;
        case 'KeyS': case 'ArrowDown': this.keys.backward = true; break;
        case 'KeyA': case 'ArrowLeft': this.keys.left = true; break;
        case 'KeyD': case 'ArrowRight': this.keys.right = true; break;
        case 'Space': this.keys.up = true; break;
        case 'ShiftLeft': case 'ShiftRight': this.keys.down = true; break;
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
    this.marsScene = new MarsSurfaceScene(this.scene);
  }

  setupEvents() {
    // Viewpoint presets (calibrated to frame the NASA Ice Home complex)
    const viewpoints = {
      panorama: {
        pos: new THREE.Vector3(0.5, 3.8, 19.5),
        target: new THREE.Vector3(-0.5, 2.2, 3.0)
      },
      avionics: {
        pos: new THREE.Vector3(-10.8, 2.8, 5.8),
        target: new THREE.Vector3(-8.6, 1.8, 0.6)
      },
      lander: {
        pos: new THREE.Vector3(-10.8, 2.8, 5.8),
        target: new THREE.Vector3(-8.6, 1.8, 0.6)
      },
      habitat: {
        pos: new THREE.Vector3(4.8, 2.8, 11.2),
        target: new THREE.Vector3(0.5, 2.6, 0.5)
      },
      combustion: {
        pos: new THREE.Vector3(-2.8, 1.65, 9.6),
        target: new THREE.Vector3(-2.8, 1.35, 6.8)
      },
      crater: {
        pos: new THREE.Vector3(28, 8.5, -6),
        target: new THREE.Vector3(16, 0.0, -18)
      }
    };

    document.querySelectorAll('.viewpoint-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        if (viewpoints[view]) {
          this.startCinematicTransition(viewpoints[view].pos, viewpoints[view].target);
          document.querySelectorAll('.viewpoint-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        }
      });
    });

    // Reset Camera
    const resetBtn = document.getElementById('btn-reset-cam');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.startCinematicTransition(viewpoints.panorama.pos, viewpoints.panorama.target);
        document.querySelectorAll('.viewpoint-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.view === 'panorama');
        });
      });
    }

    // Fullscreen toggle
    const fsBtn = document.getElementById('btn-fullscreen');
    if (fsBtn) {
      fsBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => { });
        } else {
          document.exitFullscreen().catch(() => { });
        }
      });
    }

    // Toggle HUD Panel
    const toggleHudBtn = document.getElementById('btn-toggle-hud');
    const hudPanel = document.getElementById('hud-mars-panel');
    const collapseBtn = document.getElementById('btn-collapse-hud');

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

    if (toggleHudBtn && hudPanel) {
      toggleHudBtn.addEventListener('click', () => {
        const isCollapsed = hudPanel.classList.toggle('collapsed');
        toggleHudBtn.classList.toggle('active', !isCollapsed);
      });
    }

    if (collapseBtn && hudPanel) {
      collapseBtn.addEventListener('click', () => {
        hudPanel.classList.add('collapsed');
        if (toggleHudBtn) toggleHudBtn.classList.remove('active');
      });
    }

    // Chamber Venting / Hypoxic Extinction Interactive Simulation
    const btnVent = document.getElementById('btn-vent-chamber');
    const chamberBadge = document.getElementById('chamber-status-badge');
    const btnVentLabel = document.getElementById('btn-vent-label');

    let isChamberVented = false;

    if (btnVent) {
      btnVent.addEventListener('click', () => {
        isChamberVented = !isChamberVented;

        // Smoothly glide camera to frame the combustion testbed so the user clearly sees the action!
        this.startCinematicTransition(viewpoints.combustion.pos, viewpoints.combustion.target);
        document.querySelectorAll('.viewpoint-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.view === 'combustion');
        });

        if (isChamberVented) {
          // Vent chamber to ambient Mars air (0.13% O2, 0.636 kPa) -> Instant flame extinction
          if (this.marsScene) {
            this.marsScene.extinguishFlame();
          }

          if (chamberBadge) {
            chamberBadge.className = 'chamber-status-badge vented';
            chamberBadge.innerHTML = '<span class="pulse-dot-red"></span><span id="chamber-status-text">VENTED // 0.13% O₂ HYPOXIA EXTINCTION</span>';
          }
          btnVent.classList.add('reignite');
          if (btnVentLabel) {
            btnVentLabel.innerHTML = 'Re-pressurize & Reignite (21% O₂)';
          }
        } else {
          // Re-seal & re-pressurize with habitat air (21% O2, 101.3 kPa) -> Reignite flame
          if (this.marsScene) {
            this.marsScene.reigniteFlame();
          }

          if (chamberBadge) {
            chamberBadge.className = 'chamber-status-badge sealed';
            chamberBadge.innerHTML = '<span class="pulse-dot-green"></span><span id="chamber-status-text">SEALED (21% O₂ // 101.3 kPa)</span>';
          }
          btnVent.classList.remove('reignite');
          if (btnVentLabel) {
            btnVentLabel.innerHTML = 'Vent Chamber to Mars Air (Simulate Extinction)';
          }
        }
      });
    }

    // NASA Space Apps Challenge Criteria Audit & Evaluator Tour
    this.auditModal = new CriteriaAuditModal();
    const btnCriteriaAudit = document.getElementById('btn-criteria-audit');
    if (btnCriteriaAudit) {
      btnCriteriaAudit.addEventListener('click', () => {
        if (this.auditModal) this.auditModal.open();
      });
    }
  }

  setupPyrosMenu() {
    const mainMenu = document.getElementById('pyros-main-menu');
    const btnOpenMenu = document.getElementById('btn-open-main-menu');
    const btnCloseMenu = document.getElementById('btn-close-main-menu');
    const btnResumeMars = document.getElementById('btn-resume-mars');

    const closeMenu = () => {
      if (!mainMenu) return;
      mainMenu.classList.remove('active');
      setTimeout(() => {
        mainMenu.style.display = 'none';
      }, 400);
    };

    if (btnOpenMenu) {
      btnOpenMenu.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.location.href = '/';
      });
    }

    if (btnCloseMenu && mainMenu) {
      btnCloseMenu.addEventListener('click', closeMenu);
    }

    if (btnResumeMars && mainMenu) {
      btnResumeMars.addEventListener('click', closeMenu);
    }
  }

  startCinematicTransition(targetPos, targetLookAt) {
    this.isTransitioning = true;
    this.camStartPos.copy(this.camera.position);
    this.camEndPos.copy(targetPos);
    this.targetStart.copy(this.controls.target);
    this.targetEnd.copy(targetLookAt);
    this.transitionStart = performance.now();
  }

  updateCinematicTransition(now) {
    if (!this.isTransitioning) return;

    const elapsed = now - this.transitionStart;
    const progress = Math.min(1.0, elapsed / this.transitionDuration);

    // Smooth cubic ease-out
    const t = 1.0 - Math.pow(1.0 - progress, 3);

    this.camera.position.lerpVectors(this.camStartPos, this.camEndPos, t);
    this.controls.target.lerpVectors(this.targetStart, this.targetEnd, t);
    this.controls.update();

    if (progress >= 1.0) {
      this.isTransitioning = false;
    }
  }

  updateKeyboardMovement(dt) {
    if (this.isTransitioning) return;

    if (!this._scratchForward) {
      this._scratchForward = new THREE.Vector3();
      this._scratchRight = new THREE.Vector3();
      this._scratchUp = new THREE.Vector3(0, 1, 0);
      this._scratchDelta = new THREE.Vector3();
    }

    const moveSpeed = 12.0 * dt;
    const forward = this._scratchForward;
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = this._scratchRight.crossVectors(forward, this._scratchUp).normalize();

    let moved = false;
    const delta = this._scratchDelta.set(0, 0, 0);

    if (this.keys.forward) { delta.addScaledVector(forward, moveSpeed); moved = true; }
    if (this.keys.backward) { delta.addScaledVector(forward, -moveSpeed); moved = true; }
    if (this.keys.left) { delta.addScaledVector(right, -moveSpeed); moved = true; }
    if (this.keys.right) { delta.addScaledVector(right, moveSpeed); moved = true; }
    if (this.keys.up) { delta.y += moveSpeed; moved = true; }
    if (this.keys.down) { delta.y -= moveSpeed; moved = true; }

    if (moved) {
      this.camera.position.add(delta);
      this.controls.target.add(delta);
      // Clamp altitude so camera stays above terrain
      if (this.camera.position.y < 0.6) this.camera.position.y = 0.6;
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

    const now = performance.now();
    const dt = Math.min((now - this.lastTimestamp) / 1000, 0.05);
    this.lastTimestamp = now;

    this.updateCinematicTransition(now);
    // Keyboard translation disabled: locked strictly to OrbitControls

    if (this.marsScene) {
      this.marsScene.update(now * 0.001, dt);
    }

    if (!this.isTransitioning) {
      this.controls.update();
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
    if (this.marsScene && typeof this.marsScene.dispose === 'function') {
      try { this.marsScene.dispose(); } catch (e) {}
    }
  }
}

