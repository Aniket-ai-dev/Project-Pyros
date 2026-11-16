/**
 * stationMain.js
 * Coordinator for the Space Station Laboratory Module 3D Viewer.
 * Manages Three.js scene, camera kinematics, viewpoint transitions,
 * lighting regime states, and environment telemetry HUD.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SpaceStationScene } from './SpaceStationScene.js';
import { NASADataService } from '../services/NASADataService.js';
import { ScenarioSimulationMapper } from '../services/ScenarioSimulationMapper.js';
import { InvestigationExplorer } from '../ui/InvestigationExplorer.js';
import { CriteriaAuditModal } from '../ui/CriteriaAuditModal.js';
import { SimulationConfig, GAS_PRESETS } from '../physics/CombustionPhysics.js';
import { WebGL2FluidSolver } from '../physics/WebGL2FluidSolver.js';
import { VolumetricFirePass } from '../rendering/VolumetricFirePass.js';

export class SpaceStationApp {
  constructor() {
    this.canvas = document.getElementById('canvas-station');
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.controls = null;
    this.stationScene = null;

    // Navier-Stokes Combustion Fluid Physics (Direct from Combustion Lab)
    this.fluidConfig = new SimulationConfig();
    this.fluidConfig.fuelType = 'candleWax';
    this.fluidConfig.burnerShape = 'candle';
    this.fluidConfig.gravity = 0.0; // Starts in ISS Zero-G
    this.fluidConfig.ambientOxygen = 0.21;
    this.fluidConfig.ambientTemp = 295.0;
    this.fluidConfig.flameBrightness = 1.35;
    this.fluidConfig.raymarchSteps = 48;
    this.gasConfig = GAS_PRESETS.candleWax;

    this.fluidSolver = null;
    this.firePassRoom = null;
    this.firePassGlovebox = null;
    this.sparkActive = false;
    this.sparkTimer = 0.0;

    // NASA Backend Service & Investigation Explorer
    this.apiUrl = ((typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) || 'http://localhost:8000').replace(/\/+$/, '');
    this.nasaDataService = new NASADataService(this.apiUrl);
    this.explorer = null;
    this.nasaDebounceTimer = null;
    this.nasaParams = {
      gravity_g: 0.00,
      o2_pct: 21.0,
      pressure_psi: 14.7
    };

    // Scenario Intelligence State & Active Simulation Bridge
    this.scenarioAnalysisState = {
      originalScenario: null,
      backendResponse: null,
      analyzedAt: null,
      status: 'idle', // 'idle' | 'analyzing' | 'success' | 'error'
      normalizedConfig: null
    };
    this.activeScenarioConfig = null;
    this.isScenarioActive = false;

    // Camera animation state (Smooth Cinematic Transitions)
    this.cameraTargetPos = new THREE.Vector3(0, 0.08, -4.2);
    this.cameraLookTarget = new THREE.Vector3(0.18, -0.05, 0.50);
    this.startCamPos = new THREE.Vector3();
    this.startLookPos = new THREE.Vector3();
    this.transitionMidPos = new THREE.Vector3();
    this.isTransitioning = false;
    this.transitionTime = 0.0;
    this.transitionDuration = 1.8;

    // Free 6-DOF Astronaut Movement & Flight Physics
    this.flightVelocity = new THREE.Vector3();
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      up: false,
      down: false
    };

    // Physics raycasting & timing
    this.lastTimestamp = 0;
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this.init();
  }

  init() {
    this.setupRenderer();
    this.setupCamera();
    // Keyboard translation disabled: camera locked strictly to OrbitControls
    this.setupFluidPhysics();
    this.setupScene();
    this.setupEvents();
    this.setupNASAIntegration();
    this.setupScenarioIntelligence();
    this.setupPyrosLoadingAndMenu();

    this._onResize = () => this.onWindowResize();
    window.addEventListener('resize', this._onResize);
    this.rafId = requestAnimationFrame((t) => this.renderLoop(t));
  }

  setupFluidPhysics() {
    // Space Station uses direct unified shader candle flame simulation;
    // GPGPU solver offloaded to prevent 35+ redundant FBO passes per frame.
    this.fluidSolver = null;
    this.triggerSpark();
  }

  triggerSpark() {
    this.sparkActive = true;
    this.sparkTimer = 0.40; // 400ms pilot spark for guaranteed self-sustaining ignition
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
  }

  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.05, 50);
    // Initial Astronaut perspective standing in the aft section looking down the corridor
    this.camera.position.set(0, 0.08, -4.2);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.target.set(0.18, -0.05, 0.50);
    this.controls.minDistance = 0.15;
    this.controls.maxDistance = 10.0;
    this.controls.maxPolarAngle = Math.PI * 0.96;
    this.controls.minPolarAngle = Math.PI * 0.04;
    this.controls.rotateSpeed = 0.80;
    this.controls.panSpeed = 0.90;
    this.controls.screenSpacePanning = true;
  }

  setupKeyboardControls() {
    this._onKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.keys.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.keys.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.keys.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.keys.right = true;
          break;
        case 'Space':
        case 'KeyE':
          this.keys.up = true;
          e.preventDefault();
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
        case 'KeyQ':
        case 'KeyC':
          this.keys.down = true;
          break;
      }
    };

    this._onKeyUp = (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.keys.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.keys.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.keys.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.keys.right = false;
          break;
        case 'Space':
        case 'KeyE':
          this.keys.up = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
        case 'KeyQ':
        case 'KeyC':
          this.keys.down = false;
          break;
      }
    };

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
  }

  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x06090f);

    // Build complete photorealistic space station room
    this.stationScene = new SpaceStationScene(this.scene);

    // SpaceStationScene owns the unified cohesive candle flame systems anchored strictly to the wick tips
  }

  setupEvents() {
    // 1. Refined Cinematic Viewpoint Presets
    const viewpoints = {
      corridor: {
        pos: new THREE.Vector3(0, 0.08, -4.20),
        target: new THREE.Vector3(0.18, -0.05, 0.50)
      },
      candle: {
        pos: new THREE.Vector3(0.10, -0.05, -3.10),
        target: new THREE.Vector3(0.38, -0.22, -2.20)
      },
      glovebox: {
        pos: new THREE.Vector3(-1.05, 0.48, -0.80),
        target: new THREE.Vector3(-1.80, 0.48, -0.80)
      },
      vents: {
        pos: new THREE.Vector3(0, -0.35, 0.35),
        target: new THREE.Vector3(0, 1.50, -0.40)
      },
      racks: {
        pos: new THREE.Vector3(0.45, 0.10, 1.80),
        target: new THREE.Vector3(1.55, 0.10, 1.80)
      },
      floor: {
        pos: new THREE.Vector3(0, -0.80, 0.60),
        target: new THREE.Vector3(0, -1.48, 0.10)
      },
      hatch: {
        pos: new THREE.Vector3(0, 0.05, 4.20),
        target: new THREE.Vector3(0, 0.0, 9.50)
      }
    };

    document.querySelectorAll('.viewpoint-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const vpKey = btn.dataset.view;
        const vp = viewpoints[vpKey];
        if (vp) {
          this.startCinematicTransition(vp.pos, vp.target);
          document.querySelectorAll('.viewpoint-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.view === vpKey);
          });
        }
      });
    });

    // 2. ECLSS Oxygen Flow & Ventilation Adjuster
    const o2Slider = document.getElementById('slider-station-oxygen');
    if (o2Slider) {
      o2Slider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.updateOxygenUI(val);
      });
    }

    document.querySelectorAll('.o2-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const o2Val = parseFloat(btn.dataset.o2);
        if (o2Slider) o2Slider.value = o2Val;
        this.updateOxygenUI(o2Val);
      });
    });

    document.querySelectorAll('.cd-bar-col').forEach(col => {
      col.addEventListener('click', () => {
        const o2Val = parseFloat(col.dataset.o2);
        if (!isNaN(o2Val)) {
          if (o2Slider) o2Slider.value = o2Val;
          this.updateOxygenUI(o2Val);
        }
      });
    });

    // 3. Artificial Gravity Manipulation Controls
    const gSlider = document.getElementById('slider-station-gravity');
    if (gSlider) {
      gSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.updateGravityUI(val);
      });
    }

    document.querySelectorAll('.gravity-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const gVal = parseFloat(btn.dataset.g);
        if (gSlider) gSlider.value = gVal;
        this.updateGravityUI(gVal);
      });
    });

    const btnNudge = document.getElementById('btn-nudge-objects');
    if (btnNudge) {
      btnNudge.addEventListener('click', () => {
        if (this.stationScene) {
          this.stationScene.nudgeObjects();
        }
      });
    }

    const btnResetObj = document.getElementById('btn-reset-objects');
    if (btnResetObj) {
      btnResetObj.addEventListener('click', () => {
        if (this.stationScene) {
          this.stationScene.resetObjects();
        }
      });
    }

    // 4. Interactive pointer click on floating physics objects
    this.canvas.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return; // Only primary left-click
      const rect = this.canvas.getBoundingClientRect();
      this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.pointer, this.camera);
      if (this.stationScene) {
        this.stationScene.interactWithObject(this.raycaster);
      }
    });

    // 5. Lighting Mode Switchers (User manual Day / Sleep selection with localStorage persistence)
    try {
      const savedLightMode = typeof window !== 'undefined' ? localStorage.getItem('pyros_station_lighting_mode') : null;
      if (savedLightMode && (savedLightMode === 'nominal' || savedLightMode === 'emergency' || savedLightMode === 'sleep')) {
        if (this.stationScene) {
          this.stationScene.baseLightingMode = savedLightMode;
          this.stationScene.setLightingMode(savedLightMode);
          document.querySelectorAll('.light-mode-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.mode === savedLightMode);
          });
        }
      }
    } catch (e) {}

    document.querySelectorAll('.light-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        if (this.stationScene) {
          this.stationScene.baseLightingMode = mode;
          try { localStorage.setItem('pyros_station_lighting_mode', mode); } catch (e) {}
          // Only switch 3D scene immediately if not locked in O2 emergency (O2 <= 10%)
          if (this.stationScene.oxygenLevel > 10.0) {
            this.stationScene.setLightingMode(mode);
            document.querySelectorAll('.light-mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
          }
        }
      });
    });

    // 6. Reset Camera (Cinematic Return to Corridor Center)
    const resetBtn = document.getElementById('btn-reset-cam');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.startCinematicTransition(viewpoints.corridor.pos, viewpoints.corridor.target);
        document.querySelectorAll('.viewpoint-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.view === 'corridor');
        });
      });
    }

    // 7. Unified Single-Side HUD & Tab Interactions
    const hudPanel = document.getElementById('hud-unified-panel');
    const btnCollapse = document.getElementById('btn-collapse-hud');
    const tabReopen = document.getElementById('tab-reopen-hud');
    const hudToggle = document.getElementById('btn-toggle-hud');

    if (hudPanel) {
      // Isolate wheel, pointer, and touch gestures inside HUD panel so OrbitControls does not steal scrolling
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

    // Tab Switching
    document.querySelectorAll('.cd-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.tab;
        document.querySelectorAll('.cd-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.cd-tab-pane').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const targetPane = document.getElementById(targetId);
        if (targetPane) targetPane.classList.add('active');
      });
    });

    const setHUDCollapsed = (collapsed) => {
      if (hudPanel) {
        hudPanel.style.opacity = '1';
        hudPanel.classList.toggle('collapsed', collapsed);
      }
      if (tabReopen) tabReopen.classList.toggle('visible', collapsed);
      if (hudToggle) hudToggle.classList.toggle('active', !collapsed);
    };

    if (btnCollapse) {
      btnCollapse.addEventListener('click', () => setHUDCollapsed(true));
    }
    if (tabReopen) {
      tabReopen.addEventListener('click', () => {
        if (hudPanel) hudPanel.style.opacity = '1';
        setHUDCollapsed(false);
      });
    }
    if (hudToggle) {
      hudToggle.addEventListener('click', () => {
        const isCollapsed = hudPanel ? !hudPanel.classList.contains('collapsed') : true;
        setHUDCollapsed(isCollapsed);
      });
    }

    // 8. Fullscreen toggle
    const fsBtn = document.getElementById('btn-fullscreen');
    if (fsBtn) {
      fsBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });
    }

    // Initial Telemetry & Physics Sync
    this.updateOxygenUI(21.05);
    this.updateGravityUI(0.00);
  }

  // =========================================================================
  // PROJECT PYROS: DIRECT INSTANT ENTRY & IN-SCENE MAIN MENU
  // =========================================================================
  setupPyrosLoadingAndMenu() {
    const loadingScreen = document.getElementById('pyros-loading-screen');
    const mainMenu = document.getElementById('pyros-main-menu');
    const btnEnterStation = document.getElementById('btn-enter-station');
    const cardStation = document.getElementById('card-scene-station');
    const btnOpenMenu = document.getElementById('btn-open-main-menu');
    const btnCloseMenu = document.getElementById('btn-close-main-menu');
    const txtEnterStationBtn = document.getElementById('txt-enter-station-btn');

    const topDock = document.querySelector('.cd-top-dock');
    const hudPanel = document.getElementById('hud-unified-panel');

    // Reveal top dock and HUD panel directly for instant station access
    if (loadingScreen) {
      loadingScreen.style.display = 'none';
      loadingScreen.classList.add('hidden');
    }
    if (mainMenu) {
      mainMenu.style.display = 'none';
      mainMenu.classList.remove('active');
    }
    if (topDock) {
      topDock.style.opacity = '1';
      topDock.style.pointerEvents = 'auto';
    }
    if (hudPanel) {
      hudPanel.style.opacity = '1';
      hudPanel.style.pointerEvents = 'auto';
    }

    let hasEnteredStation = true;

    // Launch/Resume Space Station Handler
    const launchStation = () => {
      hasEnteredStation = true;
      if (mainMenu) {
        mainMenu.classList.remove('active');
        setTimeout(() => {
          mainMenu.style.display = 'none';
        }, 450);
      }

      if (topDock) {
        topDock.style.transition = 'opacity 0.4s ease';
        topDock.style.opacity = '1';
        topDock.style.pointerEvents = 'auto';
      }
      if (hudPanel) {
        hudPanel.style.transition = 'opacity 0.4s ease';
        hudPanel.style.opacity = '1';
        hudPanel.style.pointerEvents = 'auto';
      }

      if (btnCloseMenu) {
        btnCloseMenu.style.display = 'flex';
      }
      if (txtEnterStationBtn) {
        txtEnterStationBtn.textContent = 'Resume Space Station';
      }
    };

    if (btnEnterStation) {
      btnEnterStation.addEventListener('click', (e) => {
        e.stopPropagation();
        launchStation();
      });
    }

    if (cardStation) {
      cardStation.addEventListener('click', (e) => {
        if (cardStation.classList.contains('active')) {
          launchStation();
        }
      });
    }

    // Return to Home screen from station
    if (btnOpenMenu) {
      btnOpenMenu.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.location.href = '/';
      });
    }

    // Close Main Menu to return to station
    if (btnCloseMenu) {
      btnCloseMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        launchStation();
      });
    }

    const backdrop = mainMenu ? mainMenu.querySelector('.pyros-menu-backdrop') : null;
    if (backdrop) {
      backdrop.addEventListener('click', () => launchStation());
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mainMenu && mainMenu.classList.contains('active')) {
        launchStation();
      }
    });
  }

  // =========================================================================
  // NASA PARTIAL-GRAVITY INTEGRATION & INVESTIGATION EXPLORER
  // =========================================================================
  setupNASAIntegration() {
    // 1. Initialize 22-Investigation Explorer Modal
    this.explorer = new InvestigationExplorer(
      this.nasaDataService,
      (atmosphere) => this.applyAtmosphereFromInvestigation(atmosphere)
    );

    // 1b. Initialize NASA Criteria Compliance Audit Modal
    this.auditModal = new CriteriaAuditModal(this.nasaDataService);
    const btnCriteriaAudit = document.getElementById('btn-criteria-audit');
    if (btnCriteriaAudit) {
      btnCriteriaAudit.addEventListener('click', () => {
        if (this.auditModal) this.auditModal.open();
      });
    }

    const btnOpenExplorer = document.getElementById('btn-open-nasa-explorer');
    if (btnOpenExplorer) {
      btnOpenExplorer.addEventListener('click', () => {
        if (this.explorer) this.explorer.open();
        // Also ensure left panel is open and on Missions tab
        const hudPanel = document.getElementById('hud-unified-panel');
        if (hudPanel) hudPanel.classList.remove('collapsed');
        const tabReopen = document.getElementById('tab-reopen-hud');
        if (tabReopen) tabReopen.classList.remove('visible');
        const missionsTabBtn = document.querySelector('.cd-tab-btn[data-tab="tab-missions"]');
        if (missionsTabBtn) missionsTabBtn.click();
      });
    }

    const btnBrowse22 = document.getElementById('btn-browse-22-missions');
    if (btnBrowse22) {
      btnBrowse22.addEventListener('click', () => {
        if (this.explorer) this.explorer.open();
      });
    }

    // 2. Curated Mission Preset Cards in HUD
    document.querySelectorAll('.mission-item-card').forEach(card => {
      card.addEventListener('click', () => {
        const missionName = card.dataset.mission;
        const g = parseFloat(card.dataset.g);
        const o2 = parseFloat(card.dataset.o2);
        const psi = parseFloat(card.dataset.psi);

        document.querySelectorAll('.mission-item-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');

        this.applyAtmosphereFromInvestigation({
          gravity_g: g,
          o2_pct: o2,
          pressure_psi: psi,
          sourceMission: missionName
        });
      });
    });

    // 3. NASA Parameter Sliders
    const gSlider = document.getElementById('slider-nasa-gravity');
    const o2Slider = document.getElementById('slider-nasa-o2');
    const pSlider = document.getElementById('slider-nasa-pressure');

    if (gSlider) {
      gSlider.addEventListener('input', (e) => {
        this.nasaParams.gravity_g = parseFloat(e.target.value);
        this.onNASAInputChanged();
      });
    }

    if (o2Slider) {
      o2Slider.addEventListener('input', (e) => {
        this.nasaParams.o2_pct = parseFloat(e.target.value);
        this.onNASAInputChanged();
      });
    }

    if (pSlider) {
      pSlider.addEventListener('input', (e) => {
        this.nasaParams.pressure_psi = parseFloat(e.target.value);
        this.onNASAInputChanged();
      });
    }

    // 3. Official NASA Presets
    const presets = {
      iss:   { gravity_g: 0.00, o2_pct: 21.0,  pressure_psi: 14.7 },
      moon:  { gravity_g: 0.16, o2_pct: 34.0,  pressure_psi: 10.2 },
      mars:  { gravity_g: 0.38, o2_pct: 21.0,  pressure_psi: 14.7 },
      eva:   { gravity_g: 0.16, o2_pct: 100.0, pressure_psi: 4.3  },
      cfig:  { gravity_g: 0.00, o2_pct: 85.0,  pressure_psi: 14.7 },
      earth: { gravity_g: 1.00, o2_pct: 21.0,  pressure_psi: 14.7 }
    };

    document.querySelectorAll('.nasa-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.preset;
        const p = presets[key];
        if (p) {
          this.nasaParams = { ...p };
          if (gSlider) gSlider.value = this.nasaParams.gravity_g;
          if (o2Slider) o2Slider.value = this.nasaParams.o2_pct;
          if (pSlider) pSlider.value = this.nasaParams.pressure_psi;

          document.querySelectorAll('.nasa-preset-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');

          if (this.isScenarioActive) {
            this.notifyManualOverride();
          }

          this.triggerNASABoundsCalculation();
        }
      });
    });

    // 4. Initial Trigger on Module Load: Active preset is ISS Microgravity (0.00g // 21% // 14.7 psi)
    this.triggerNASABoundsCalculation();
  }

  onNASAInputChanged() {
    // Clear active preset buttons if custom slider moved
    document.querySelectorAll('.nasa-preset-btn').forEach(b => b.classList.remove('active'));

    if (this.isScenarioActive) {
      this.notifyManualOverride();
    }

    // Debounce backend calculation to preserve network and framerate
    clearTimeout(this.nasaDebounceTimer);
    this.nasaDebounceTimer = setTimeout(() => {
      this.triggerNASABoundsCalculation();
    }, 120);
  }

  async triggerNASABoundsCalculation() {
    const { gravity_g, o2_pct, pressure_psi } = this.nasaParams;

    // 1. Update text displays for sliders
    const gEl = document.getElementById('val-nasa-gravity');
    const o2El = document.getElementById('val-nasa-o2');
    const pEl = document.getElementById('val-nasa-pressure');
    if (gEl) gEl.textContent = gravity_g.toFixed(2);
    if (o2El) o2El.textContent = o2_pct.toFixed(1);
    if (pEl) pEl.textContent = pressure_psi.toFixed(1);

    // 2. Sync room environmental UI and physical gravity
    this.updateGravityUI(gravity_g);
    this.updateOxygenUI(o2_pct);
    if (this.stationScene) {
      this.stationScene.setFlamePhysicsParams(this.nasaParams);
    }

    // 3. Call NASADataService calculateBounds (REST API POST /physics/bounds or empirical model)
    try {
      const res = await this.nasaDataService.calculateBounds(gravity_g, o2_pct, pressure_psi);
      const b = res.bounds;

      // Update Telemetry Cards
      const bStrength = document.getElementById('nasa-metric-buoyancy');
      if (bStrength && b.buoyancy_strength) {
        bStrength.textContent = `${(b.buoyancy_strength.value * 100).toFixed(1)}%`;
      }

      const convEl = document.getElementById('nasa-metric-convection');
      if (convEl && b.natural_convection_velocity_m_s) {
        convEl.textContent = b.natural_convection_velocity_m_s.value.toFixed(3);
      }

      const o2FacEl = document.getElementById('nasa-metric-o2-factor');
      if (o2FacEl && b.oxygen_enhancement_factor) {
        o2FacEl.textContent = `${b.oxygen_enhancement_factor.value.toFixed(2)}x`;
      }

      const hEl = document.getElementById('nasa-metric-flame-height');
      if (hEl && b.flame_height_scaling) {
        hEl.textContent = b.flame_height_scaling.estimated_mm.toFixed(1);
      }

      const spreadEl = document.getElementById('nasa-metric-flame-spread');
      if (spreadEl && b.flame_spread_rate_mm_s) {
        spreadEl.textContent = `${b.flame_spread_rate_mm_s.lower_bound.toFixed(2)} – ${b.flame_spread_rate_mm_s.upper_bound.toFixed(2)} mm/s`;
      }

      // Backend Connection Pill
      const pill = document.getElementById('nasa-backend-status-pill');
      if (pill) {
        if (res.source === 'live_backend') {
          pill.textContent = 'ONLINE (PORT 8000)';
          pill.className = 'hud-pill online';
        } else {
          pill.textContent = 'STANDALONE (NASA MODEL)';
          pill.className = 'hud-pill';
        }
      }

      // 4. Send computed aerodynamics and combustion parameters to fluid solver & candle
      if (this.fluidConfig) {
        this.fluidConfig.gravity = gravity_g * 9.81;
        this.fluidConfig.ambientOxygen = o2_pct / 100.0;
        // In case flame starved and O2 restored, re-spark if oxygen adequate
        if (this.fluidConfig.ambientOxygen >= 0.12 && !this.sparkActive) {
          this.triggerSpark();
        }
      }

      if (this.stationScene) {
        this.stationScene.setFlamePhysicsParams({
          gravity_g,
          o2_pct,
          pressure_psi,
          buoyancy: b.buoyancy_strength ? b.buoyancy_strength.value : gravity_g,
          convectionVel: b.natural_convection_velocity_m_s ? b.natural_convection_velocity_m_s.value : 0.0,
          o2Factor: b.oxygen_enhancement_factor ? b.oxygen_enhancement_factor.value : 1.0,
          flameHeightMm: b.flame_height_scaling ? b.flame_height_scaling.estimated_mm : 22.0
        });
      }
    } catch (err) {
      console.warn('NASA bounds calculation error:', err);
    }
  }

  applyAtmosphereFromInvestigation(data) {
    if (!data) return;

    const rawO2 = data.o2_pct !== undefined ? data.o2_pct : (data.oxygen_pct !== undefined ? data.oxygen_pct : 21.0);
    const o2 = parseFloat(rawO2) || 21.0;
    const rawG = data.gravity_g !== undefined ? data.gravity_g : (data.gravity !== undefined ? data.gravity : 0.0);
    const g = parseFloat(rawG) || 0.0;
    const rawPsi = data.pressure_psi !== undefined ? data.pressure_psi : 14.7;
    const psi = parseFloat(rawPsi) || 14.7;
    const missionName = data.sourceMission || 'Custom Empirical Condition';

    this.nasaParams.o2_pct = o2;
    this.nasaParams.gravity_g = g;
    this.nasaParams.pressure_psi = psi;

    const o2Slider = document.getElementById('slider-nasa-o2');
    if (o2Slider) o2Slider.value = this.nasaParams.o2_pct;
    const gSlider = document.getElementById('slider-nasa-gravity');
    if (gSlider) gSlider.value = this.nasaParams.gravity_g;
    const pSlider = document.getElementById('slider-nasa-pressure');
    if (pSlider) pSlider.value = this.nasaParams.pressure_psi;

    // 1. Immediately apply to 3D world physics & UI
    this.updateGravityUI(g);
    this.updateOxygenUI(o2);

    // 2. Dynamic Flame Physics in 3D Scene
    if (this.stationScene) {
      this.stationScene.setFlamePhysicsParams({
        gravity_g: g,
        o2_pct: o2,
        pressure_psi: psi,
        buoyancy: g,
        convectionVel: g > 0.01 ? 0.28 * Math.sqrt(g) : 0.0,
        o2Factor: o2 / 21.0,
        flameHeightMm: g < 0.05 ? 26.0 : (26.0 + (1.0 - g) * 10.0 + (o2 / 21.0) * 12.0)
      });
    }

    // 3. Fluid GPGPU Combustion Solver
    if (this.fluidConfig) {
      this.fluidConfig.gravity = g * 9.81;
      this.fluidConfig.ambientOxygen = o2 / 100.0;
      if (this.fluidConfig.ambientOxygen >= 0.14) {
        this.triggerSpark();
      }
    }

    // 4. Update HUD Active Mission Banner
    const activeNameEl = document.getElementById('active-mission-name');
    if (activeNameEl) {
      activeNameEl.textContent = missionName;
    }
    const activeDescEl = document.getElementById('active-mission-desc');
    if (activeDescEl) {
      const gLabel = g < 0.01 ? '0.00g ISS Zero-G' : (g < 0.25 ? `${g.toFixed(2)}g Lunar Gateway` : `${g.toFixed(2)}g Terrestrial`);
      activeDescEl.textContent = `${gLabel} // ${o2.toFixed(1)}% O₂ // ${psi.toFixed(1)} psi active flame dynamics`;
    }

    // 5. Smoothly fly camera to Candle Experiment in Glovebox
    const gloveboxVp = {
      pos: new THREE.Vector3(-1.05, 0.48, -0.80),
      target: new THREE.Vector3(-1.80, 0.48, -0.80)
    };
    this.startCinematicTransition(gloveboxVp.pos, gloveboxVp.target);
    document.querySelectorAll('.viewpoint-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.view === 'glovebox');
    });

    // 6. Trigger calculation
    this.triggerNASABoundsCalculation();
  }

  // =========================================================================
  // SCENARIO INTELLIGENCE UI & ANALYSIS WORKFLOW (PHASE 2 DATA CONTRACT)
  // =========================================================================
  setupScenarioIntelligence() {
    const inputEl = document.getElementById('scenario-text-input');
    const analyzeBtn = document.getElementById('btn-analyze-scenario');
    const analyzeText = document.getElementById('btn-analyze-text');
    const clearBtn = document.getElementById('btn-clear-scenario');
    const loadingState = document.getElementById('scenario-loading-state');
    const errorState = document.getElementById('scenario-error-state');
    const errorTitle = document.getElementById('scenario-error-title');
    const errorDesc = document.getElementById('scenario-error-desc');
    const resultsContainer = document.getElementById('scenario-results-container');
    const simulateBtn = document.getElementById('btn-simulate-scenario');

    // Quick Example Chips
    document.querySelectorAll('.scenario-chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = btn.dataset.scenario;
        if (inputEl && text) {
          inputEl.value = text;
          inputEl.focus();
        }
      });
    });

    // Clear Button
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (inputEl) inputEl.value = '';
        if (loadingState) loadingState.style.display = 'none';
        if (errorState) errorState.style.display = 'none';
        if (resultsContainer) resultsContainer.style.display = 'none';
        this.scenarioAnalysisState.status = 'idle';
      });
    }

    // Analyze Scenario Handler
    if (analyzeBtn && inputEl) {
      analyzeBtn.addEventListener('click', async () => {
        const scenarioText = inputEl.value.trim();
        if (!scenarioText) {
          inputEl.focus();
          return;
        }

        // Set state
        this.scenarioAnalysisState.originalScenario = scenarioText;
        this.scenarioAnalysisState.status = 'analyzing';

        // Clear active scenario banner while evaluating new analysis
        const simStatusBanner = document.getElementById('scenario-sim-status-banner');
        if (simStatusBanner) simStatusBanner.style.display = 'none';

        // Update UI for loading state (non-blocking)
        analyzeBtn.disabled = true;
        if (analyzeText) analyzeText.textContent = 'Analyzing...';
        if (loadingState) loadingState.style.display = 'flex';
        if (errorState) errorState.style.display = 'none';
        if (resultsContainer) resultsContainer.style.display = 'none';

        try {
          // Call dedicated service method with direct fallback if browser cache delayed module reload
          let res;
          if (this.nasaDataService && typeof this.nasaDataService.analyzeScenario === 'function') {
            res = await this.nasaDataService.analyzeScenario(scenarioText);
          } else {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 90000);
            const fetchRes = await fetch(`${this.apiUrl || 'http://localhost:8000'}/scenario`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ scenario: scenarioText.trim() }),
              signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!fetchRes.ok) {
              const errJson = await fetchRes.json().catch(() => ({}));
              throw new Error(errJson.detail || `Server returned HTTP ${fetchRes.status}`);
            }
            res = { success: true, data: await fetchRes.json() };
          }
          const data = res.data;

          // Store clean analysis state
          this.scenarioAnalysisState.backendResponse = data;
          this.scenarioAnalysisState.analyzedAt = new Date().toISOString();
          this.scenarioAnalysisState.status = 'success';

          // Render backend response into UI
          this.renderScenarioResults(data);

          // Reveal results
          if (loadingState) loadingState.style.display = 'none';
          if (resultsContainer) resultsContainer.style.display = 'flex';
        } catch (err) {
          console.warn('Scenario Analysis Error:', err);
          this.scenarioAnalysisState.status = 'error';

          if (loadingState) loadingState.style.display = 'none';
          if (errorState) {
            errorState.style.display = 'flex';
            if (errorTitle) errorTitle.textContent = 'Analysis Request Failed';
            if (errorDesc) {
              errorDesc.textContent = (err && err.message)
                ? err.message
                : 'Unable to connect to PYROS Engine on port 8000. Ensure the backend server is running.';
            }
          }
        } finally {
          analyzeBtn.disabled = false;
          if (analyzeText) analyzeText.textContent = 'Analyze Scenario';
        }
      });
    }

    // Phase 3 Active Simulation Handler
    if (simulateBtn) {
      simulateBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const normConfig = this.scenarioAnalysisState.normalizedConfig;
        if (!normConfig || !normConfig.canSimulate) {
          alert(`Cannot simulate scenario: ${((normConfig && normConfig.errors) || ['Missing required parameters']).join(', ')}`);
          return;
        }
        this.applyScenarioSimulation(normConfig);
      });
    }
  }

  notifyManualOverride() {
    if (!this.isScenarioActive) return; // Only notify if a scenario was actively simulated

    const simStatusBanner = document.getElementById('scenario-sim-status-banner');
    const simStatusDot = document.getElementById('sim-status-dot');
    const simStatusText = document.getElementById('sim-status-text');
    const simulateBtn = document.getElementById('btn-simulate-scenario');
    const simBtnLabel = document.getElementById('sim-btn-label');
    const simBtnBadge = document.getElementById('sim-btn-badge');

    if (simStatusBanner) {
      simStatusBanner.style.display = 'flex';
      simStatusBanner.className = 'sim-status-banner status-override';
    }
    if (simStatusDot) simStatusDot.className = 'sim-status-dot override';
    if (simStatusText) simStatusText.textContent = 'MANUAL OVERRIDE (Scenario modified by user controls)';

    if (simulateBtn) {
      simulateBtn.disabled = false;
      simulateBtn.classList.remove('simulating');
      if (simBtnLabel) simBtnLabel.textContent = 'RE-APPLY SCENARIO';
      if (simBtnBadge) simBtnBadge.textContent = 'Modified';
    }
  }

  applyScenarioSimulation(config) {
    if (!config || !config.canSimulate) {
      console.warn('Cannot apply invalid simulation config:', config);
      return;
    }

    const env = config.environment;
    const phys = config.physics;
    const vis = config.visualization;
    const telem = config.telemetry;

    // 1. Direct simulation parameters to active NASA parameter state
    this.nasaParams.gravity_g = env.gravity_g;
    this.nasaParams.o2_pct = env.oxygen_pct;
    this.nasaParams.pressure_psi = env.pressure_psi;

    // 2. Sync UI sliders & value displays
    const gSlider = document.getElementById('slider-nasa-gravity');
    const o2Slider = document.getElementById('slider-nasa-o2');
    const pSlider = document.getElementById('slider-nasa-pressure');
    if (gSlider) gSlider.value = env.gravity_g;
    if (o2Slider) o2Slider.value = env.oxygen_pct;
    if (pSlider) pSlider.value = env.pressure_psi;

    const gEl = document.getElementById('val-nasa-gravity');
    const o2El = document.getElementById('val-nasa-o2');
    const pEl = document.getElementById('val-nasa-pressure');
    if (gEl) gEl.textContent = env.gravity_g.toFixed(2);
    if (o2El) o2El.textContent = env.oxygen_pct.toFixed(1);
    if (pEl) pEl.textContent = env.pressure_psi.toFixed(1);

    // 3. Direct physics updates to Navier-Stokes fluid configuration
    if (this.fluidConfig) {
      this.fluidConfig.gravity = env.gravity_m_s2;
      this.fluidConfig.ambientOxygen = env.oxygen_fraction;
      this.fluidConfig.fuelType = vis.fuel_preset;
      this.fluidConfig.flameBrightness = 1.35 * vis.emission_modifier;
      this.fluidConfig.smokeDensity = vis.smoke_density;
      this.gasConfig = GAS_PRESETS[vis.fuel_preset] || GAS_PRESETS.candleWax;
    }

    // 4. Update Space Station Habitat & Candle Scene
    if (this.stationScene) {
      this.stationScene.setGravity(env.gravity_g);
      this.stationScene.setOxygenLevel(env.oxygen_pct);
      this.stationScene.setFlamePhysicsParams({
        gravity_g: env.gravity_g,
        o2_pct: env.oxygen_pct,
        pressure_psi: env.pressure_psi,
        buoyancy: phys.buoyancy_strength,
        convectionVel: phys.convection_velocity_m_s,
        o2Factor: telem.flammability_factor,
        flameHeightMm: vis.flame_height_mm
      });
    }

    // 5. Extinction & Reignite logic
    if (phys.extinction_risk.isExtinguished) {
      this.sparkActive = false;
    } else if (this.fluidConfig && this.fluidConfig.ambientOxygen >= 0.12 && !this.sparkActive) {
      this.triggerSpark();
    }

    // 6. Update Simulation Status UI
    this.isScenarioActive = true;
    this.activeScenarioConfig = config;

    const simStatusBanner = document.getElementById('scenario-sim-status-banner');
    const simStatusDot = document.getElementById('sim-status-dot');
    const simStatusText = document.getElementById('sim-status-text');
    const simulateBtn = document.getElementById('btn-simulate-scenario');
    const simBtnLabel = document.getElementById('sim-btn-label');
    const simBtnBadge = document.getElementById('sim-btn-badge');

    if (simStatusBanner) {
      simStatusBanner.style.display = 'flex';
      simStatusBanner.className = 'sim-status-banner status-active';
    }
    if (simStatusDot) simStatusDot.className = 'sim-status-dot active';
    if (simStatusText) {
      simStatusText.textContent = `SCENARIO ACTIVE: ${env.gravity_g.toFixed(2)}g • ${env.oxygen_pct.toFixed(1)}% O₂ (${vis.fuel_preset})`;
    }

    if (simulateBtn) {
      simulateBtn.classList.add('simulating');
      if (simBtnLabel) simBtnLabel.textContent = 'SCENARIO SIMULATING';
      if (simBtnBadge) simBtnBadge.textContent = 'Active in 3D';
    }

    // 7. Update station ECLSS/dock displays
    this.updateGravityUI(env.gravity_g);
    this.updateOxygenUI(env.oxygen_pct);
  }

  renderScenarioResults(data) {
    if (!data) return;

    const extrapolation = data.extrapolation || null;
    const answer = data.answer || data.comparison || {};
    const rankedInvs = data.ranked_investigations || [];
    const sources = data.sources || [];

    // Phase 3: Run ScenarioSimulationMapper as the SINGLE SOURCE OF TRUTH
    const mapperResult = ScenarioSimulationMapper.map(data, this.scenarioAnalysisState.originalScenario);
    this.scenarioAnalysisState.normalizedConfig = mapperResult;

    // Phase 3: Update Simulate Action button & warnings based on mapperResult
    const simulateBtn = document.getElementById('btn-simulate-scenario');
    const simBtnLabel = document.getElementById('sim-btn-label');
    const simBtnBadge = document.getElementById('sim-btn-badge');
    const warningContainer = document.getElementById('scenario-sim-warning-container');
    const simStatusBanner = document.getElementById('scenario-sim-status-banner');

    if (mapperResult && mapperResult.canSimulate) {
      if (simulateBtn) {
        simulateBtn.disabled = false;
        simulateBtn.title = 'Click to apply scientifically validated scenario parameters to 3D simulation';
      }
      if (simBtnLabel) simBtnLabel.textContent = 'SIMULATE SCENARIO';
      if (simBtnBadge) simBtnBadge.textContent = mapperResult.modeLabel;

      if (warningContainer) {
        if (mapperResult.warnings && mapperResult.warnings.length > 0) {
          warningContainer.style.display = 'block';
          warningContainer.innerHTML = mapperResult.warnings.map(w => `
            <div class="scenario-sim-warning-box">
              <span class="warning-icon">ℹ️</span>
              <span class="warning-msg">${w}</span>
            </div>
          `).join('');
        } else {
          warningContainer.style.display = 'none';
        }
      }
    } else {
      // Simulation is genuinely unavailable due to missing required parameters
      if (simulateBtn) {
        simulateBtn.disabled = true;
        simulateBtn.title = 'Scenario missing required physical parameters (gravity and/or oxygen concentration).';
      }
      if (simBtnLabel) simBtnLabel.textContent = 'SIMULATION UNAVAILABLE';
      if (simBtnBadge) simBtnBadge.textContent = 'Missing Requirements';

      // UI Consistency Rule: Deactivate and hide scenario active banner so SCENARIO ACTIVE and SIMULATION UNAVAILABLE never appear together
      this.isScenarioActive = false;
      this.activeScenarioConfig = null;
      if (simStatusBanner) simStatusBanner.style.display = 'none';

      if (warningContainer) {
        warningContainer.style.display = 'block';
        const errors = (mapperResult && mapperResult.errors) || ['Missing required simulation parameters'];
        warningContainer.innerHTML = errors.map(err => `
          <div class="scenario-sim-warning-box">
            <span class="warning-icon">[ALERT]</span>
            <span class="warning-msg"><strong>Simulation Guard:</strong> ${err}</span>
          </div>
        `).join('');
      }
    }

    // ── 1. TARGET CONDITIONS & PHYSICS BOUNDS ──────────────────────────────
    const targetCard = document.getElementById('scenario-target-conditions-card');
    const physicsCard = document.getElementById('scenario-physics-bounds-card');
    const missingCard = document.getElementById('scenario-missing-extrapolation-card');
    const boundsListEl = document.getElementById('scenario-physics-bounds-list');

    if (mapperResult && mapperResult.canSimulate) {
      if (targetCard) targetCard.style.display = 'block';

      // Fill Target Conditions from normalized environment
      const env = mapperResult.environment;
      const g = env.gravity_g;
      let gLabel = `${g.toFixed(2)}g Partial`;
      if (g < 0.01) gLabel = 'Microgravity';
      else if (Math.abs(g - 0.16) < 0.05) gLabel = 'Lunar Surface';
      else if (Math.abs(g - 0.38) < 0.05) gLabel = 'Mars Surface';
      else if (g >= 0.95 && g <= 1.05) gLabel = 'Earth Baseline';
      const gEl = document.getElementById('res-target-gravity');
      const gSubEl = document.getElementById('res-target-gravity-sub');
      if (gEl) gEl.textContent = `${g.toFixed(2)} g`;
      if (gSubEl) gSubEl.textContent = gLabel;

      const o2 = env.oxygen_pct;
      const o2El = document.getElementById('res-target-o2');
      const o2SubEl = document.getElementById('res-target-o2-sub');
      if (o2El) o2El.textContent = `${o2.toFixed(1)}%`;
      if (o2SubEl) o2SubEl.textContent = o2 > 30 ? 'Elevated Flammability' : (o2 < 14 ? 'Hypoxic Extinction' : 'Normoxic Norm');

      const psi = env.pressure_psi;
      const pEl = document.getElementById('res-target-pressure');
      const pSubEl = document.getElementById('res-target-pressure-sub');
      if (pEl) pEl.textContent = `${psi.toFixed(1)} psi`;
      if (pSubEl) pSubEl.textContent = `${(psi * 6.89476).toFixed(1)} kPa`;

      const fuelEl = document.getElementById('res-target-fuel');
      if (fuelEl) fuelEl.textContent = env.fuel_description || 'General Solid Material';
    } else {
      if (targetCard) targetCard.style.display = 'none';
    }

    // ── 2. DETERMINISTIC PHYSICS BOUNDS vs DIRECT SCENARIO FALLBACK ────────
    if (mapperResult && mapperResult.physics && mapperResult.physics.hasExtrapolatedBounds) {
      if (physicsCard) physicsCard.style.display = 'block';
      if (missingCard) missingCard.style.display = 'none';

      // Fill Physics Bounds by matching actual parameter name (NOT array index!)
      if (boundsListEl) {
        boundsListEl.innerHTML = '';
        const bounds = (extrapolation && extrapolation.physics_bounds) || [];

        // Helper to format bound value with scientific transparency badge
        const renderBoundItem = (paramName, displayVal, basisText, confidence, pillType, pillLabel) => {
          const item = document.createElement('div');
          item.className = 'physics-bound-item';
          item.innerHTML = `
            <div class="bound-item-head">
              <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                <span class="bound-param-name">${paramName}</span>
                ${pillType ? `<span class="transparency-pill ${pillType}">${pillLabel}</span>` : ''}
              </div>
              <span class="bound-val-badge">${displayVal}</span>
            </div>
            ${basisText ? `<p class="bound-basis-text">${basisText}</p>` : ''}
            ${confidence !== undefined ? `
              <div class="bound-confidence-row">
                <span>Deterministic Constraint</span>
                <span>Confidence: ${Math.round(confidence * 100)}%</span>
              </div>
            ` : ''}
          `;
          boundsListEl.appendChild(item);
        };

        // Match parameters by substring
        const findBound = (substr) => bounds.find(b => (b.parameter_name || '').toLowerCase().includes(substr.toLowerCase()));

        const bBuoyancy = findBound('buoyancy');
        if (bBuoyancy) {
          renderBoundItem(
            bBuoyancy.parameter_name,
            `${(bBuoyancy.lower_bound * 100).toFixed(0)}% of Earth`,
            bBuoyancy.physical_basis,
            bBuoyancy.confidence,
            'pill-direct',
            'DIRECT PHYSICS INPUT'
          );
        }

        const bConv = findBound('convection');
        if (bConv) {
          renderBoundItem(
            bConv.parameter_name,
            `${bConv.lower_bound.toFixed(3)} – ${bConv.upper_bound.toFixed(3)} m/s`,
            bConv.physical_basis,
            bConv.confidence,
            'pill-telemetry',
            'SCIENTIFIC TELEMETRY ONLY'
          );
        }

        const bO2 = findBound('oxygen');
        if (bO2) {
          renderBoundItem(
            bO2.parameter_name,
            `${bO2.lower_bound.toFixed(2)}x – ${bO2.upper_bound.toFixed(2)}x`,
            bO2.physical_basis,
            bO2.confidence,
            'pill-derived',
            'DERIVED VISUAL MODIFIER'
          );
        }

        const bHeight = findBound('height');
        if (bHeight) {
          renderBoundItem(
            bHeight.parameter_name,
            `${bHeight.lower_bound.toFixed(1)} – ${bHeight.upper_bound.toFixed(1)} mm`,
            bHeight.physical_basis,
            bHeight.confidence,
            'pill-derived',
            'DERIVED VISUAL CONSTRAINT'
          );
        }

        const bSpread = findBound('spread');
        if (bSpread) {
          renderBoundItem(
            bSpread.parameter_name,
            `${bSpread.lower_bound.toFixed(2)} – ${bSpread.upper_bound.toFixed(2)} mm/s`,
            bSpread.physical_basis,
            bSpread.confidence,
            'pill-telemetry',
            'SCIENTIFIC TELEMETRY ONLY'
          );
        }

        // If no bounds matched or empty
        if (bounds.length === 0) {
          boundsListEl.innerHTML = '<p class="insight-body-text" style="color: #94a3b8; font-style: italic;">No physics bounds returned for this scenario.</p>';
        }
      }
    } else {
      // Extrapolated bounds are not present: show informative fallback card
      if (physicsCard) physicsCard.style.display = 'none';
      if (missingCard) {
        missingCard.style.display = 'block';
        const missingTitle = missingCard.querySelector('.missing-title');
        const missingDesc = missingCard.querySelector('.missing-desc');
        if (mapperResult && mapperResult.canSimulate) {
          if (missingTitle) missingTitle.textContent = 'Direct Scenario Simulation Ready';
          if (missingDesc) {
            missingDesc.textContent = `Direct scenario conditions (${mapperResult.environment.gravity_g.toFixed(2)}g, ${mapperResult.environment.oxygen_pct.toFixed(1)}% O₂, ${mapperResult.visualization.fuel_preset}) are ready for 3D simulation. Extrapolated visualization bounds are omitted; the Navier-Stokes fluid solver will compute buoyant convection and oxidizer kinetics natively.`;
          }
        } else {
          if (missingTitle) missingTitle.textContent = 'General Scenario Knowledge Archive';
          if (missingDesc) {
            missingDesc.textContent = `This scenario does not contain sufficient physical parameters (gravity, oxygen concentration) to drive the 3D combustion solver. NASA flight investigation precedents, synthesis, and research gaps are displayed above for scientific reference.`;
          }
        }
      }
    }

    // ── 2. SCIENTIFIC ASSESSMENT & INSIGHT ──────────────────────────────────
    const combinedEl = document.getElementById('res-combined-insight');
    if (combinedEl) {
      const insight = answer?.combined_insight || extrapolation?.llm_hypothesis || 'Scientific synthesis completed across retrieved investigations.';
      combinedEl.textContent = insight;
    }

    const gapEl = document.getElementById('res-gap-analysis');
    const gapWrap = document.getElementById('wrap-res-gap-analysis');
    if (gapEl && gapWrap) {
      if (answer && answer.gap_analysis) {
        gapWrap.style.display = 'block';
        gapEl.textContent = answer.gap_analysis;
      } else {
        gapWrap.style.display = 'none';
      }
    }

    const recList = document.getElementById('res-recommendations-list');
    const recWrap = document.getElementById('wrap-res-recommendations');
    if (recList && recWrap) {
      if (answer && Array.isArray(answer.recommendations) && answer.recommendations.length > 0) {
        recWrap.style.display = 'block';
        recList.innerHTML = answer.recommendations.map(r => `<li>${r}</li>`).join('');
      } else {
        recWrap.style.display = 'none';
      }
    }

    // ── 3. NASA FLIGHT EVIDENCE (Ranked investigations) ─────────────────────
    const countEl = document.getElementById('res-ranked-count');
    if (countEl) countEl.textContent = `${rankedInvs.length} PRECEDENTS`;

    const invListEl = document.getElementById('res-investigations-list');
    if (invListEl) {
      invListEl.innerHTML = '';
      if (rankedInvs.length === 0) {
        invListEl.innerHTML = '<p class="insight-body-text" style="color: #94a3b8; font-style: italic;">No specific ranked investigations matched.</p>';
      } else {
        rankedInvs.forEach(inv => {
          const card = document.createElement('div');
          card.className = 'ranked-inv-card';
          const matchTags = (inv.matching_conditions || []).map(c => `<span class="tag-item matched">[MATCH] ${c}</span>`).join('');
          const gapTags = (inv.gaps || []).map(g => `<span class="tag-item gap">[GAP] ${g}</span>`).join('');
          const scorePercent = Math.round((inv.relevance_score || 0) * 100);

          card.innerHTML = `
            <div class="ranked-inv-head">
              <span class="ranked-inv-title">${inv.investigation_id ? inv.investigation_id.toUpperCase() : 'INVESTIGATION'}</span>
              <span class="score-pill">${scorePercent}% Match</span>
            </div>
            ${inv.justification ? `<p class="ranked-inv-justification">${inv.justification}</p>` : ''}
            ${(matchTags || gapTags) ? `<div class="tag-cluster">${matchTags}${gapTags}</div>` : ''}
          `;
          invListEl.appendChild(card);
        });
      }
    }

    // Citations / Sources
    const sourcesWrap = document.getElementById('wrap-res-sources');
    const sourcesChips = document.getElementById('res-sources-chips');
    if (sourcesWrap && sourcesChips) {
      if (sources.length > 0) {
        sourcesWrap.style.display = 'flex';
        sourcesChips.innerHTML = sources.map(s => `<span class="source-badge">${s}</span>`).join('');
      } else {
        sourcesWrap.style.display = 'none';
      }
    }

    // ── 4. CONFIDENCE & CAVEATS ─────────────────────────────────────────────
    const confBadge = document.getElementById('res-confidence-badge');
    const confText = document.getElementById('res-confidence-text');
    const caveatsList = document.getElementById('res-caveats-list');
    const caveatsWrap = document.getElementById('wrap-res-caveats');

    if (extrapolation) {
      const confStr = extrapolation.confidence_assessment || 'Confidence assessed from empirical data count and deterministic physics bounds.';
      if (confText) confText.textContent = confStr;
      if (confBadge) confBadge.textContent = confStr.includes('HIGH') ? 'HIGH CONFIDENCE' : 'MEDIUM CONFIDENCE';

      const caveats = extrapolation.caveats || [];
      if (caveatsList && caveatsWrap) {
        if (caveats.length > 0) {
          caveatsWrap.style.display = 'block';
          caveatsList.innerHTML = caveats.map(c => `<li>${c}</li>`).join('');
        } else {
          caveatsWrap.style.display = 'none';
        }
      }
    } else {
      if (confBadge) confBadge.textContent = 'PEER-REVIEWED';
      if (confText) confText.textContent = 'Verified NASA PSI combustion flight knowledge archive.';
      if (caveatsWrap) caveatsWrap.style.display = 'none';
    }
  }

  updateOxygenUI(val) {
    if (!this.stationScene) return;

    // Send to 3D scene and fluid combustion physics
    this.stationScene.setOxygenLevel(val);
    if (this.fluidConfig) {
      this.fluidConfig.ambientOxygen = val / 100.0;
    }

    // Update Slider text & Hero display
    const o2ValEl = document.getElementById('val-oxygen-percent');
    if (o2ValEl) o2ValEl.textContent = val.toFixed(1);

    const o2ValEl2 = document.getElementById('val-oxygen-percent-2');
    if (o2ValEl2) o2ValEl2.textContent = `${Math.round(val)}%`;

    // Controls card & Floating dock telemetry
    const hudO2Cell = document.getElementById('hud-cell-o2-val');
    if (hudO2Cell) hudO2Cell.textContent = `${val.toFixed(1)}%`;

    const dockO2 = document.getElementById('dock-o2-val');
    if (dockO2) dockO2.textContent = `${val.toFixed(1)}%`;

    const o2Slider = document.getElementById('slider-station-oxygen');
    if (o2Slider && Math.abs(parseFloat(o2Slider.value) - val) > 0.4) {
      o2Slider.value = val;
    }

    // Segmented capsule pill bar (24 capsules)
    const o2Pills = document.querySelectorAll('#pill-bar-oxygen .capsule-seg');
    if (o2Pills.length > 0) {
      const activeO2Count = Math.round((val / 100.0) * o2Pills.length);
      o2Pills.forEach((p, idx) => p.classList.toggle('active', idx < activeO2Count));
    }

    // Dynamic Donut SVG stroke-dasharray update
    const donutO2 = document.getElementById('donut-segment-o2');
    if (donutO2) {
      const circ = 2 * Math.PI * 58; // 364.42
      const o2Arc = Math.max(3, (val / 100.0) * (circ * 0.75));
      donutO2.setAttribute('stroke-dasharray', `${o2Arc.toFixed(1)} ${circ.toFixed(1)}`);
    }

    const hudPo2Cell = document.getElementById('hud-cell-po2-val');
    const po2Val = (val / 100.0) * 101.3;
    if (hudPo2Cell) hudPo2Cell.textContent = `pO₂: ${po2Val.toFixed(1)} kPa`;

    // Louver Aperture angle
    const apertureEl = document.getElementById('val-vent-aperture');
    if (apertureEl) {
      const deg = Math.round((this.stationScene.targetLouverAngle * 180) / Math.PI);
      apertureEl.textContent = `${deg}°`;
    }

    // Turbine Fan RPM
    const fanRpmEl = document.getElementById('val-vent-rpm');
    if (fanRpmEl) {
      const rpm = Math.round(this.stationScene.targetFanSpeed * 9.55);
      fanRpmEl.textContent = `${rpm.toLocaleString()} RPM`;
    }

    // O2 Mass Flow
    const flowEl = document.getElementById('val-vent-flow');
    if (flowEl) {
      const flow = (val / 100.0) * 135.0;
      flowEl.textContent = `${flow.toFixed(1)} L/min`;
    }

    // Partial pO2 in grid
    const po2El = document.getElementById('val-oxygen-po2');
    if (po2El) {
      po2El.textContent = `${po2Val.toFixed(1)} kPa`;
    }

    // Preset button active state
    document.querySelectorAll('.o2-preset-btn').forEach(b => {
      const bVal = parseFloat(b.dataset.o2);
      b.classList.toggle('active', Math.abs(bVal - val) < 2.0);
    });

    // Synchronize 5 stepped pedestals (Matching Image 2)
    let activeStep = 2;
    let badgeText = '+21% Nom';
    if (val < 5.5) { activeStep = 0; badgeText = '0% Vac'; }
    else if (val < 16.0) { activeStep = 1; badgeText = '11% Hyp'; }
    else if (val < 26.5) { activeStep = 2; badgeText = '+21% Nom'; }
    else if (val < 66.0) { activeStep = 3; badgeText = '32% EVA'; }
    else { activeStep = 4; badgeText = '100% Pure'; }

    document.querySelectorAll('.cd-bar-col').forEach(col => {
      const stepIdx = parseInt(col.dataset.step, 10);
      const isActive = stepIdx === activeStep;
      col.classList.toggle('active', isActive);
      const badge = col.querySelector('.cd-bar-badge');
      if (badge && isActive) {
        badge.textContent = badgeText;
      }
    });

    // Alert status badge & trend pill wrap
    const badgeStatus = document.getElementById('badge-o2-status');
    const badgeWrap = document.getElementById('badge-o2-status-wrap');
    const alertBanner = document.getElementById('o2-alert-banner');
    const alertText = document.getElementById('o2-alert-text');
    const statusDot = document.getElementById('o2-status-dot');

    if (val <= 10.0) {
      // Automatic Red Alert Emergency Mode (O2 <= 10%)
      if (badgeStatus) badgeStatus.textContent = '[EMERGENCY] RED ALERT (≤10% O₂)';
      if (badgeWrap) badgeWrap.className = 'cd-trend-pill danger';
      if (alertBanner) alertBanner.className = 'o2-alert-banner critical';
      if (alertText) alertText.textContent = `EMERGENCY: O₂ critical (${val.toFixed(1)}%). Station Red Alert protocol active.`;
      if (statusDot) { statusDot.style.background = '#ef4444'; statusDot.style.boxShadow = '0 0 10px #ef4444'; }
    } else if (val < 14.0) {
      // Hypoxia critical
      if (badgeStatus) badgeStatus.textContent = 'CRITICAL HYPOXIA';
      if (badgeWrap) badgeWrap.className = 'cd-trend-pill danger';
      if (alertBanner) alertBanner.className = 'o2-alert-banner critical';
      if (alertText) alertText.textContent = `WARNING: Severe hypoxia (${val.toFixed(1)}% O₂). Louvers sealed to prevent outgassing.`;
      if (statusDot) { statusDot.style.background = '#ef4444'; statusDot.style.boxShadow = '0 0 6px #ef4444'; }
    } else if (val < 19.5) {
      // Depleted / Warning
      if (badgeStatus) badgeStatus.textContent = 'LOW O₂ WARNING';
      if (badgeWrap) badgeWrap.className = 'cd-trend-pill warning';
      if (alertBanner) alertBanner.className = 'o2-alert-banner warning';
      if (alertText) alertText.textContent = `Sub-nominal atmosphere: O₂ deficit detected. Diffusers throttling flow.`;
      if (statusDot) { statusDot.style.background = '#f59e0b'; statusDot.style.boxShadow = '0 0 6px #f59e0b'; }
    } else if (val <= 24.0) {
      // Nominal
      if (badgeStatus) badgeStatus.textContent = 'NOMINAL';
      if (badgeWrap) badgeWrap.className = 'cd-trend-pill success';
      if (alertBanner) alertBanner.className = 'o2-alert-banner nominal';
      if (alertText) alertText.textContent = 'Atmosphere nominal: Life support active at 101.3 kPa sea-level equivalent.';
      if (statusDot) { statusDot.style.background = '#10b981'; statusDot.style.boxShadow = '0 0 6px #10b981'; }
    } else if (val <= 35.0) {
      // EVA / Enriched
      if (badgeStatus) badgeStatus.textContent = 'EVA PROTOCOL';
      if (badgeWrap) badgeWrap.className = 'cd-trend-pill info';
      if (alertBanner) alertBanner.className = 'o2-alert-banner eva';
      if (alertText) alertText.textContent = `Enriched O₂ (${val.toFixed(1)}%): Astronaut pre-breathe protocol for EVA egress.`;
      if (statusDot) { statusDot.style.background = '#38bdf8'; statusDot.style.boxShadow = '0 0 6px #38bdf8'; }
    } else {
      // Pure O2 / Hyperoxia / Flammability Hazard
      if (badgeStatus) badgeStatus.textContent = 'HYPEROXIA HAZARD';
      if (badgeWrap) badgeWrap.className = 'cd-trend-pill danger';
      if (alertBanner) alertBanner.className = 'o2-alert-banner critical';
      if (alertText) alertText.textContent = `CRITICAL FIRE RISK: ${val.toFixed(1)}% O₂. Ceiling diffusers open at maximum flow.`;
      if (statusDot) { statusDot.style.background = '#f97316'; statusDot.style.boxShadow = '0 0 6px #f97316'; }
    }

    // Synchronize Emergency Mode UI indicator with O2 threshold (<= 10%)
    const emergIndicator = document.getElementById('pill-emergency-indicator');
    const dayBtn = document.querySelector('.light-mode-btn[data-mode="nominal"]');
    const sleepBtn = document.querySelector('.light-mode-btn[data-mode="sleep"]');

    if (val <= 10.0) {
      if (emergIndicator) emergIndicator.style.display = 'inline-flex';
      if (dayBtn) dayBtn.classList.remove('active');
      if (sleepBtn) sleepBtn.classList.remove('active');
    } else {
      if (emergIndicator) emergIndicator.style.display = 'none';
      const baseMode = this.stationScene ? (this.stationScene.baseLightingMode || 'nominal') : 'nominal';
      if (dayBtn) dayBtn.classList.toggle('active', baseMode === 'nominal');
      if (sleepBtn) sleepBtn.classList.toggle('active', baseMode === 'sleep');
    }
  }

  updateGravityUI(val) {
    if (!this.stationScene) return;

    this.stationScene.setGravity(val);
    if (this.fluidConfig) {
      this.fluidConfig.gravity = val * 9.81;
    }

    // Main display number in gravity card
    const gValEl = document.getElementById('val-gravity-g');
    if (gValEl) gValEl.textContent = val.toFixed(2);

    const dockG = document.getElementById('dock-gravity-val');
    if (dockG) dockG.textContent = `${val.toFixed(2)}g`;

    const gSlider = document.getElementById('slider-station-gravity');
    if (gSlider && Math.abs(parseFloat(gSlider.value) - val) > 0.02) {
      gSlider.value = val;
    }

    // Segmented capsule pill bar for gravity (24 capsules, max 2.0g)
    const gPills = document.querySelectorAll('#pill-bar-gravity .capsule-seg');
    if (gPills.length > 0) {
      const activeGCount = Math.round((val / 2.0) * gPills.length);
      gPills.forEach((p, idx) => p.classList.toggle('active', idx < activeGCount));
    }

    // Top HUD metric cell
    const hudValEl = document.getElementById('hud-cell-gravity-val');
    if (hudValEl) hudValEl.textContent = `${val.toFixed(2)} g`;

    const hudSubEl = document.getElementById('hud-cell-gravity-sub');
    const badgeStatus = document.getElementById('badge-gravity-status');
    const statusDot = document.getElementById('gravity-status-dot');

    let subText = 'Weightless Microgravity';
    let badgeText = '0.00 g // ZERO-G';
    let badgeClass = 'hud-pill nominal';
    let dotColor = '#10b981';

    if (val < 0.01) {
      subText = 'Weightless Microgravity';
      badgeText = '0.00 g // ZERO-G';
      badgeClass = 'hud-pill nominal';
      dotColor = '#10b981';
    } else if (val < 0.25) {
      subText = 'Lunar Surface Equivalent (0.17g)';
      badgeText = `${val.toFixed(2)} g // LUNAR`;
      badgeClass = 'hud-pill eva';
      dotColor = '#38bdf8';
    } else if (val < 0.60) {
      subText = 'Martian Gravity (0.38g)';
      badgeText = `${val.toFixed(2)} g // MARS`;
      badgeClass = 'hud-pill eva';
      dotColor = '#f59e0b';
    } else if (val < 1.25) {
      subText = 'Standard Terrestrial 1.0g';
      badgeText = `${val.toFixed(2)} g // EARTH`;
      badgeClass = 'hud-pill';
      dotColor = '#3b82f6';
    } else {
      subText = 'Hypergravity Stress Regime';
      badgeText = `${val.toFixed(2)} g // HYPER`;
      badgeClass = 'hud-pill critical';
      dotColor = '#ef4444';
    }

    if (hudSubEl) hudSubEl.textContent = subText;
    if (badgeStatus) {
      badgeStatus.textContent = badgeText;
      badgeStatus.className = badgeClass;
    }
    if (statusDot) {
      statusDot.style.background = dotColor;
      statusDot.style.boxShadow = `0 0 6px ${dotColor}`;
    }

    // Presets active highlight
    document.querySelectorAll('.gravity-preset-btn').forEach(btn => {
      const bG = parseFloat(btn.dataset.g);
      btn.classList.toggle('active', Math.abs(bG - val) < 0.05);
    });
  }

  // =========================================================================
  // CAMERA BOUNDARY CONSTRAINTS (Clamps camera strictly inside module without clipping)
  // =========================================================================
  clampCameraInsideCabin(pos, isTarget = false) {
    if (isTarget) {
      pos.x = THREE.MathUtils.clamp(pos.x, -1.88, 1.88);
      pos.y = THREE.MathUtils.clamp(pos.y, -1.50, 1.50);
      pos.z = THREE.MathUtils.clamp(pos.z, -5.45, 5.45);
      return;
    }

    const colRadius = 0.22; // Physical camera collision buffer

    // Vertical boundary (Floor at -1.52m, Ceiling at +1.55m)
    const minY = -1.52 + colRadius; // -1.30m
    const maxY = 1.52 - colRadius;  //  1.30m
    pos.y = THREE.MathUtils.clamp(pos.y, minY, maxY);

    // Longitudinal boundary (Aft hatch at -5.50m, Forward window at +5.50m)
    const minZ = -5.35 + colRadius; // -5.13m
    const maxZ = 5.35 - colRadius;  //  5.13m
    pos.z = THREE.MathUtils.clamp(pos.z, minZ, maxZ);

    // Lateral boundary (ISPR Racks at X = +/-1.45m)
    // At glovebox bay (Z between -1.45m and -0.15m on Port side X < 0), allow deeper inspection
    const isGloveboxBay = (pos.z > -1.45 && pos.z < -0.15 && pos.x < 0);
    const minX = isGloveboxBay ? (-1.58 + colRadius) : (-1.45 + colRadius); // -1.36m or -1.23m
    const maxX = 1.45 - colRadius; // 1.23m
    pos.x = THREE.MathUtils.clamp(pos.x, minX, maxX);

    // 45° Octagonal Utility Standoff Chamfers:
    // Equation of 45-deg corner walls: |X| + |Y| <= 2.08m
    const cornerMax = 2.08;
    const absX = Math.abs(pos.x);
    const absY = Math.abs(pos.y);
    if (absX + absY > cornerMax) {
      const excess = (absX + absY - cornerMax) * 0.5;
      pos.x -= Math.sign(pos.x) * excess;
      pos.y -= Math.sign(pos.y) * excess;
    }
  }

  // =========================================================================
  // CINEMATIC CAMERA FLIGHT (Smooth Steadicam curved transition between views)
  // =========================================================================
  startCinematicTransition(targetCamPos, targetLookAt, customDuration = null) {
    this.startCamPos.copy(this.camera.position);
    this.startLookPos.copy(this.controls.target);
    this.cameraTargetPos.copy(targetCamPos);
    this.cameraLookTarget.copy(targetLookAt);

    // Stop ongoing user flight momentum
    this.flightVelocity.set(0, 0, 0);

    const dist = this.startCamPos.distanceTo(targetCamPos);

    // Calculate curved midpoint control point:
    // Curves gracefully along the central habitable corridor axis (X near 0)
    this.transitionMidPos = new THREE.Vector3(
      (this.startCamPos.x + targetCamPos.x) * 0.20,
      (this.startCamPos.y + targetCamPos.y) * 0.5 + (dist > 1.8 ? 0.08 : 0.0),
      (this.startCamPos.z + targetCamPos.z) * 0.5
    );
    this.clampCameraInsideCabin(this.transitionMidPos);

    // Smooth cinematic duration scaled by flight distance: 1.4s to 2.2s
    this.transitionDuration = customDuration || Math.max(1.4, Math.min(2.3, 0.9 + dist * 0.26));
    this.transitionTime = 0.0;
    this.isTransitioning = true;
    this.controls.enabled = false;
  }

  // =========================================================================
  // FREE 6-DOF ASTRONAUT FLIGHT CONTROLS (WASD / Arrows / Space / Shift)
  // =========================================================================
  updateFreeMovement(dt) {
    if (!this._scratchForward) {
      this._scratchForward = new THREE.Vector3();
      this._scratchForwardH = new THREE.Vector3();
      this._scratchRightH = new THREE.Vector3();
      this._scratchMoveDir = new THREE.Vector3();
      this._scratchDelta = new THREE.Vector3();
      this._scratchPrevCam = new THREE.Vector3();
      this._scratchActualDelta = new THREE.Vector3();
      this._scratchCurLook = new THREE.Vector3();
    }

    const forward = this._scratchForward;
    this.camera.getWorldDirection(forward);

    // Project forward onto horizontal XZ plane for natural corridor flight
    const forwardH = this._scratchForwardH.set(forward.x, 0, forward.z);
    if (forwardH.lengthSq() > 0.001) {
      forwardH.normalize();
    } else {
      forwardH.set(0, 0, -1);
    }
    const rightH = this._scratchRightH.set(-forwardH.z, 0, forwardH.x).normalize();

    const moveDir = this._scratchMoveDir.set(0, 0, 0);
    if (this.keys.forward) moveDir.add(forwardH);
    if (this.keys.backward) moveDir.sub(forwardH);
    if (this.keys.right) moveDir.add(rightH);
    if (this.keys.left) moveDir.sub(rightH);
    if (this.keys.up) moveDir.y += 1.0;
    if (this.keys.down) moveDir.y -= 1.0;

    if (moveDir.lengthSq() > 0.001) {
      moveDir.normalize();
      const accel = 6.2; // Acceleration in m/s^2
      this.flightVelocity.addScaledVector(moveDir, accel * dt);
    }

    // Microgravity fluid inertia damping
    this.flightVelocity.multiplyScalar(Math.pow(0.86, dt * 60));

    // Clamp maximum flight speed
    if (this.flightVelocity.lengthSq() > 16.0) {
      this.flightVelocity.setLength(4.0);
    }

    // Displace camera and OrbitControls target in tandem
    if (this.flightVelocity.lengthSq() > 0.00001) {
      const delta = this._scratchDelta.copy(this.flightVelocity).multiplyScalar(dt);

      const prevCam = this._scratchPrevCam.copy(this.camera.position);
      this.camera.position.add(delta);
      this.clampCameraInsideCabin(this.camera.position, false);

      const actualDelta = this._scratchActualDelta.copy(this.camera.position).sub(prevCam);
      this.controls.target.add(actualDelta);
      this.clampCameraInsideCabin(this.controls.target, true);
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
    if (!this.lastTimestamp) this.lastTimestamp = timestamp;
    const dt = Math.min((timestamp - this.lastTimestamp) * 0.001, 0.05);
    this.lastTimestamp = timestamp;

    if (this.isTransitioning) {
      this.transitionTime += dt;
      const rawT = Math.min(1.0, this.transitionTime / this.transitionDuration);

      // Luxurious smooth cubic ease-in-out curve
      const ease = rawT < 0.5
        ? 4 * rawT * rawT * rawT
        : 1 - Math.pow(-2 * rawT + 2, 3) / 2;

      // 3D Quadratic Bezier flight curve
      const invEase = 1.0 - ease;
      const curX = invEase * invEase * this.startCamPos.x + 2 * invEase * ease * this.transitionMidPos.x + ease * ease * this.cameraTargetPos.x;
      const curY = invEase * invEase * this.startCamPos.y + 2 * invEase * ease * this.transitionMidPos.y + ease * ease * this.cameraTargetPos.y;
      const curZ = invEase * invEase * this.startCamPos.z + 2 * invEase * ease * this.transitionMidPos.z + ease * ease * this.cameraTargetPos.z;

      this.camera.position.set(curX, curY, curZ);

      // Smooth look-at target interpolation (zero-allocation)
      if (!this._scratchCurLook) this._scratchCurLook = new THREE.Vector3();
      const curLook = this._scratchCurLook.lerpVectors(this.startLookPos, this.cameraLookTarget, ease);
      this.camera.lookAt(curLook);
      this.controls.target.copy(curLook);

      if (rawT >= 1.0) {
        this.isTransitioning = false;
        this.camera.position.copy(this.cameraTargetPos);
        this.controls.target.copy(this.cameraLookTarget);
        this.camera.lookAt(this.cameraLookTarget);
        this.controls.enabled = true;
        this.controls.update();
      }
    } else {
      // 1. Update OrbitControls for mouse interaction (Camera locked strictly to OrbitControls)
      this.controls.update();

      // 2. Cabin boundaries protection: prevents clipping through walls, ceiling, floor, standoffs
      this.clampCameraInsideCabin(this.camera.position, false);

      // Keep target within safe cabin zone
      this.clampCameraInsideCabin(this.controls.target, true);
    }

    // 1. Pilot spark countdown
    if (this.sparkActive) {
      this.sparkTimer -= dt;
      if (this.sparkTimer <= 0) {
        this.sparkActive = false;
      }
    }

    // Station candle & environmental dynamics
    if (this.stationScene) {
      this.stationScene.update(time, dt);
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
    if (this.stationScene && typeof this.stationScene.dispose === 'function') {
      try { this.stationScene.dispose(); } catch (e) {}
    }
    const explorerEl = document.getElementById('nasa-explorer-modal');
    if (explorerEl) explorerEl.remove();
    const detailEl = document.getElementById('nasa-detail-modal');
    if (detailEl) detailEl.remove();
    const auditEl = document.getElementById('criteria-audit-modal');
    if (auditEl) auditEl.remove();
  }
}


