/**
 * roverMain.js
 * Coordinator for PROJECT PYROS - Martian Rover Internal Circuit Failure Simulation.
 * 
 * Controls:
 * - 3D WebGL rendering & OrbitControls
 * - 7-Stage Chronological Guided Simulation Timeline with Play/Pause/Scrub
 * - Realistic NASA FLIR / Ironbow Thermal Shader View
 * - Interactive Component Telemetry HUD & Raycasting Inspector
 * - Project Pyros Main Menu Navigation
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoverCircuitScene } from './RoverCircuitScene.js';
import { CriteriaAuditModal } from '../ui/CriteriaAuditModal.js';

export class RoverApp {
  constructor() {
    this.canvas = document.getElementById('canvas-rover');
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.controls = null;
    this.roverScene = null;
    this.isDestroyed = false;
    this.rafId = null;

    // Raycasting for interactive component inspection
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.selectedComponentId = 'pcu'; // default focus

    // Web Audio Synthesizer State
    this.audioCtx = null;
    this.isAudioMuted = false;
    this.ambientHumGain = null;
    this.prevStageIndex = 1;

    // Simulation Timeline State (Guided Chronological Progression)
    this.simTime = 0.0; // Current simulation elapsed time in seconds
    this.totalDuration = 35.0; // 35 seconds total sequence
    this.isPlaying = true;
    this.playbackSpeed = 1.0;
    this.currentStageIndex = 1; // 1 to 7

    // Stage definition breakdown (seconds)
    this.stages = [
      {
        index: 1,
        id: 'stage-1',
        name: 'Stage 1: Normal Operations',
        startTime: 0.0,
        endTime: 5.0,
        badge: 'NOMINAL',
        badgeClass: 'success',
        summary: 'All avionics systems nominal. Primary 28V DC bus operating at 28.1V, drawing 14.2A. Steady current flow along bus traces. Power Conditioning Unit operating at nominal 24.5°C.'
      },
      {
        index: 2,
        id: 'stage-2',
        name: 'Stage 2: Martian Dust & Cooling Stress',
        startTime: 5.0,
        endTime: 10.0,
        badge: 'THERMAL STRESS',
        badgeClass: 'warning',
        summary: 'Jezero Crater fine atmospheric dust accumulation insulates external heat rejection radiators. Internal cooling loop efficiency drops by 68%. Component temperatures begin steady climb.'
      },
      {
        index: 3,
        id: 'stage-3',
        name: 'Stage 3: Power Controller Overheating',
        startTime: 10.0,
        endTime: 15.0,
        badge: 'OVERHEATING',
        badgeClass: 'alert',
        summary: 'PCU power MOSFET switching stage surpasses safe junction threshold. Thermal dissipation stalls, triggering runaway heating. Heat sink color shifts to warning amber and deep thermal red (138°C).'
      },
      {
        index: 4,
        id: 'stage-4',
        name: 'Stage 4: Electrical Short & Micro-Arcs',
        startTime: 15.0,
        endTime: 20.0,
        badge: 'ELECTRICAL FAULT',
        badgeClass: 'danger',
        summary: 'Thermal stress causes dielectric breakdown in PCU secondary power stage. A dead short to ground generates intense electrical sparks. Bus voltage fluctuates wildly (14.2V - 31.5V) with jittering trace currents.'
      },
      {
        index: 5,
        id: 'stage-5',
        name: 'Stage 5: Localized Thermal Event / Fire',
        startTime: 20.0,
        endTime: 25.0,
        badge: 'INTERNAL FIRE',
        badgeClass: 'critical',
        summary: 'Sustained electrical arcing ignites localized conformal coating and potting resin around failed PCU. A 0.38g low-buoyancy micro-flame burns around the epicenter. Dense smoldering smoke begins rising to ceiling.'
      },
      {
        index: 6,
        id: 'stage-6',
        name: 'Stage 6: Cascading Heat Propagation',
        startTime: 25.0,
        endTime: 30.0,
        badge: 'CASCADING DROP',
        badgeClass: 'danger',
        summary: 'Conductive heat spreads rapidly along copper ground planes and busbars. Flight computer (RCE) temperature rises to 74°C. Motor controller power rails collapse; secondary bus traces lose power and go dark.'
      },
      {
        index: 7,
        id: 'stage-7',
        name: 'Stage 7: Autonomous Bus Isolation',
        startTime: 30.0,
        endTime: 35.0,
        badge: 'SAFE MODE ACTIVE',
        badgeClass: 'success',
        summary: 'Rover Fault Protection (FP) autonomy detects catastrophic bus short. Solid-state contactors instantly trip, isolating the PCU. Flame is starved of electrical energy. Rover enters low-power survival SAFE MODE.'
      }
    ];

    // Camera animation state
    this.isCameraTransitioning = false;
    this.camStartPos = new THREE.Vector3();
    this.camEndPos = new THREE.Vector3();
    this.targetStart = new THREE.Vector3();
    this.targetEnd = new THREE.Vector3();
    this.camTransStartTime = 0;
    this.camTransDuration = 1200;

    // Cinematic Viewpoints: Strictly 2 camera presets
    this.viewpoints = {
      overview: { pos: new THREE.Vector3(0.0, 0.32, 0.52), target: new THREE.Vector3(0.0, 0.06, -0.05) },
      pcu: { pos: new THREE.Vector3(-0.08, 0.14, 0.08), target: new THREE.Vector3(-0.06, 0.080, -0.06) }
    };

    this.lastTimestamp = 0;
    this.init();
  }

  init() {
    this.setupRenderer();
    this.setupCamera();
    this.setupScene();
    this.setupUI();
    this.setupRaycasting();
    this.setupPyrosMenu();
    this.setupScreenshot();

    this._onResize = () => this.onWindowResize();
    window.addEventListener('resize', this._onResize);
    this.rafId = requestAnimationFrame((t) => this.renderLoop(t));
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
  }

  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.02, 25);
    this.camera.position.set(0.0, 0.32, 0.52);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.target.set(0.0, 0.06, -0.05);
    this.controls.minDistance = 0.08;
    this.controls.maxDistance = 0.82; // Strictly inside the enclosed Warm Electronics Box
    this.controls.maxPolarAngle = Math.PI / 2 + 0.04; // Don't clip beneath floor
    this.controls.minPolarAngle = 0.15; // Don't clip through ceiling
  }

  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060911); // Dark sealed rover electronics bay
    this.roverScene = new RoverCircuitScene(this.scene);
  }

  // =========================================================================
  // PROCEDURAL WEB AUDIO SYNTHESIZER
  // =========================================================================
  initAudio() {
    if (this.audioCtx) {
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
      return;
    }
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.audioCtx = new AudioCtx();

      // Ambient low avionics cooling hum (60Hz with lowpass filter)
      const humOsc = this.audioCtx.createOscillator();
      humOsc.type = 'sine';
      humOsc.frequency.setValueAtTime(62.0, this.audioCtx.currentTime);

      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(240, this.audioCtx.currentTime);

      this.ambientHumGain = this.audioCtx.createGain();
      this.ambientHumGain.gain.setValueAtTime(this.isAudioMuted ? 0 : 0.035, this.audioCtx.currentTime);

      humOsc.connect(filter);
      filter.connect(this.ambientHumGain);
      this.ambientHumGain.connect(this.audioCtx.destination);
      humOsc.start();
    } catch (e) {
      console.warn('Web Audio could not be initialized:', e);
    }
  }

  playClickSound() {
    if (!this.audioCtx || this.isAudioMuted) return;
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, this.audioCtx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.05, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.06);
    } catch (e) {}
  }

  playContactorTrip() {
    if (!this.audioCtx || this.isAudioMuted) return;
    try {
      // Heavy mechanical isolation contactor latch clunk
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(140, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(32, this.audioCtx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.18, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.14);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.15);
    } catch (e) {}
  }

  playArcSparks() {
    if (!this.audioCtx || this.isAudioMuted || Math.random() > 0.45) return;
    try {
      const bufferSize = Math.floor(this.audioCtx.sampleRate * 0.035);
      const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.14;
      }
      const noise = this.audioCtx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2400 + Math.random() * 800, this.audioCtx.currentTime);
      const gain = this.audioCtx.createGain();
      gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.audioCtx.destination);
      noise.start();
    } catch (e) {}
  }

  // =========================================================================
  // UI SETUP & EVENT LISTENERS
  // =========================================================================
  setupUI() {
    // NASA Criteria Compliance Audit Modal
    this.auditModal = new CriteriaAuditModal();
    const btnCriteriaAudit = document.getElementById('btn-criteria-audit');
    if (btnCriteriaAudit) {
      btnCriteriaAudit.addEventListener('click', () => {
        if (this.auditModal) this.auditModal.open();
      });
    }

    // Enable audio on first user click anywhere
    window.addEventListener('click', () => this.initAudio(), { once: true });

    // Audio Mute/Unmute Toggle
    const btnToggleAudio = document.getElementById('btn-toggle-audio');
    if (btnToggleAudio) {
      btnToggleAudio.addEventListener('click', () => {
        this.initAudio();
        this.isAudioMuted = !this.isAudioMuted;
        btnToggleAudio.classList.toggle('active', !this.isAudioMuted);
        if (this.ambientHumGain && this.audioCtx) {
          this.ambientHumGain.gain.setValueAtTime(this.isAudioMuted ? 0 : 0.04, this.audioCtx.currentTime);
        }
        this.playClickSound();
      });
    }

    // 1. Play / Pause & Reset
    const btnPlayPause = document.getElementById('btn-play-pause');
    if (btnPlayPause) {
      btnPlayPause.addEventListener('click', () => {
        this.playClickSound();
        this.isPlaying = !this.isPlaying;
        btnPlayPause.innerHTML = this.isPlaying
          ? '<span>[PAUSE]</span>'
          : '<span>[PLAY]</span>';
      });
    }

    const btnReset = document.getElementById('btn-reset-sim');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        this.playClickSound();
        this.seekToTime(0.0);
      });
    }

    // Step Forward / Backward
    const btnStepNext = document.getElementById('btn-step-next');
    if (btnStepNext) {
      btnStepNext.addEventListener('click', () => {
        this.playClickSound();
        const nextStage = Math.min(7, this.currentStageIndex + 1);
        this.jumpToStage(nextStage);
      });
    }

    const btnStepPrev = document.getElementById('btn-step-prev');
    if (btnStepPrev) {
      btnStepPrev.addEventListener('click', () => {
        this.playClickSound();
        const prevStage = Math.max(1, this.currentStageIndex - 1);
        this.jumpToStage(prevStage);
      });
    }

    // Timeline Scrubber Slider
    const timelineSlider = document.getElementById('sim-timeline-slider');
    if (timelineSlider) {
      timelineSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.seekToTime(val);
      });
    }

    // Stage Jump Buttons
    document.querySelectorAll('.stage-pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const stageIdx = parseInt(btn.dataset.stage, 10);
        this.jumpToStage(stageIdx);
      });
    });

    // Speed Selector (0.5x, 1x, 2x)
    document.querySelectorAll('.speed-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.playbackSpeed = parseFloat(btn.dataset.speed);
      });
    });

    // View Mode Switcher (Normal / Circuit / Thermal)
    document.querySelectorAll('.view-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.view-mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.dataset.mode;
        this.roverScene.setViewMode(mode);

        const thermalLegend = document.getElementById('thermal-legend-panel');
        if (thermalLegend) {
          thermalLegend.style.display = mode === 'thermal' ? 'block' : 'none';
        }
      });
    });

    // Camera Viewpoint Switcher
    document.querySelectorAll('.rover-cam-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.rover-cam-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const vpKey = btn.dataset.view;
        const vp = this.viewpoints[vpKey];
        if (vp) this.startCameraFlight(vp.pos, vp.target);
      });
    });

    // HUD Collapse / Expand (Both panel chevron and navbar toggle button)
    const btnCollapseHud = document.getElementById('btn-collapse-hud');
    const hudToggle = document.getElementById('btn-toggle-hud');
    const hudPanel = document.getElementById('hud-unified-panel');

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

    const setHUDCollapsed = (collapsed) => {
      if (hudPanel) hudPanel.classList.toggle('collapsed', collapsed);
      if (hudToggle) hudToggle.classList.toggle('active', !collapsed);
    };

    if (btnCollapseHud) {
      btnCollapseHud.addEventListener('click', () => {
        setHUDCollapsed(true);
      });
    }

    if (hudToggle) {
      hudToggle.addEventListener('click', () => {
        const isCollapsed = hudPanel ? !hudPanel.classList.contains('collapsed') : true;
        setHUDCollapsed(isCollapsed);
      });
    }

    // Component Telemetry Card Click Switcher
    document.querySelectorAll('.component-select-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.component-select-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.selectedComponentId = pill.dataset.component;
        this.updateComponentDetailHUD();
      });
    });
  }

  // =========================================================================
  // INTERACTIVE 3D RAYCASTING
  // =========================================================================
  setupRaycasting() {
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.pointer, this.camera);
      const intersects = this.raycaster.intersectObjects(this.roverScene.componentMeshes, true);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hit.userData && hit.userData.id) {
          this.selectedComponentId = hit.userData.id;
          document.querySelectorAll('.component-select-pill').forEach(p => {
            p.classList.toggle('active', p.dataset.component === this.selectedComponentId);
          });
          this.updateComponentDetailHUD();
        }
      }
    });
  }

  // =========================================================================
  // CAMERA CINEMATIC FLIGHT
  // =========================================================================
  startCameraFlight(targetPos, targetLookAt) {
    this.camStartPos.copy(this.camera.position);
    this.camEndPos.copy(targetPos);
    this.targetStart.copy(this.controls.target);
    this.targetEnd.copy(targetLookAt);
    this.camTransStartTime = performance.now();
    this.isCameraTransitioning = true;
  }

  updateCameraFlight(now) {
    if (!this.isCameraTransitioning) return;
    const progress = Math.min(1.0, (now - this.camTransStartTime) / this.camTransDuration);
    // Smooth easeInOutCubic
    const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    this.camera.position.lerpVectors(this.camStartPos, this.camEndPos, ease);
    this.controls.target.lerpVectors(this.targetStart, this.targetEnd, ease);

    if (progress >= 1.0) {
      this.isCameraTransitioning = false;
    }
  }

  // =========================================================================
  // SIMULATION TIMELINE LOGIC & STAGE CALCULATIONS
  // =========================================================================
  jumpToStage(stageIdx) {
    const stage = this.stages.find(s => s.index === stageIdx);
    if (stage) {
      this.seekToTime(stage.startTime + 0.05);
    }
  }

  seekToTime(seconds) {
    this.simTime = THREE.MathUtils.clamp(seconds, 0, this.totalDuration);
    this.evaluateSimulationState();
    this.updateHUD();
  }

  evaluateSimulationState() {
    const t = this.simTime;
    let activeStage = this.stages[0];

    for (let s of this.stages) {
      if (t >= s.startTime && t <= s.endTime) {
        activeStage = s;
        break;
      }
    }
    if (t >= this.totalDuration) {
      activeStage = this.stages[this.stages.length - 1];
    }

    this.currentStageIndex = activeStage.index;
    const stageProgress = THREE.MathUtils.clamp((t - activeStage.startTime) / (activeStage.endTime - activeStage.startTime), 0, 1);

    // Compute dynamic physics parameters according to timeline stage
    let pcuTemp = 24.5;
    let rceTemp = 22.8;
    let battTemp = 21.0;
    let motorTemp = 23.4;
    let commsTemp = 22.1;
    let busVoltage = 28.1;
    let busCurrent = 14.2;
    let sparksActive = false;
    let flameActive = false;
    let smokeActive = false;
    let flameIntensity = 0.0;
    let isolationTripped = false;

    if (activeStage.index === 1) {
      // Stage 1: Nominal
      pcuTemp = 24.5 + Math.sin(t * 2) * 0.4;
      busVoltage = 28.1 + Math.sin(t * 3) * 0.05;
      busCurrent = 14.2 + Math.cos(t * 2) * 0.15;
    } else if (activeStage.index === 2) {
      // Stage 2: Environmental Stress (Dust & Cooling Failure)
      pcuTemp = THREE.MathUtils.lerp(25.0, 72.0, stageProgress);
      rceTemp = THREE.MathUtils.lerp(23.0, 38.0, stageProgress);
      battTemp = THREE.MathUtils.lerp(21.0, 27.0, stageProgress);
      busVoltage = 27.9;
      busCurrent = 15.6;
    } else if (activeStage.index === 3) {
      // Stage 3: Component Overheating (PCU Thermal Runaway)
      pcuTemp = THREE.MathUtils.lerp(72.0, 142.0, stageProgress);
      rceTemp = THREE.MathUtils.lerp(38.0, 52.0, stageProgress);
      battTemp = THREE.MathUtils.lerp(27.0, 36.0, stageProgress);
      busVoltage = THREE.MathUtils.lerp(27.8, 25.2, stageProgress);
      busCurrent = THREE.MathUtils.lerp(16.0, 26.5, stageProgress);
    } else if (activeStage.index === 4) {
      // Stage 4: Electrical Fault (Dielectric breakdown, short circuit, sparks)
      pcuTemp = THREE.MathUtils.lerp(142.0, 188.0, stageProgress);
      rceTemp = THREE.MathUtils.lerp(52.0, 64.0, stageProgress);
      // Wild electrical fluctuations
      busVoltage = 18.0 + (Math.random() - 0.5) * 12.0;
      busCurrent = 38.0 + (Math.random() - 0.5) * 16.0;
      sparksActive = true;
      this.playArcSparks();
    } else if (activeStage.index === 5) {
      // Stage 5: Localized Thermal Event / 0.38g Fire
      pcuTemp = THREE.MathUtils.lerp(188.0, 235.0, stageProgress);
      rceTemp = THREE.MathUtils.lerp(64.0, 76.0, stageProgress);
      motorTemp = THREE.MathUtils.lerp(26.0, 48.0, stageProgress);
      busVoltage = 14.5 + (Math.random() - 0.5) * 4.0;
      busCurrent = 42.0;
      flameActive = true;
      smokeActive = true;
      flameIntensity = Math.min(1.0, stageProgress * 1.5);
    } else if (activeStage.index === 6) {
      // Stage 6: Cascading Heat Propagation & Bus Drop
      pcuTemp = 240.0;
      rceTemp = THREE.MathUtils.lerp(76.0, 98.0, stageProgress);
      motorTemp = THREE.MathUtils.lerp(48.0, 78.0, stageProgress);
      battTemp = THREE.MathUtils.lerp(36.0, 58.0, stageProgress);
      busVoltage = THREE.MathUtils.lerp(14.0, 8.2, stageProgress); // power rail collapsing
      busCurrent = THREE.MathUtils.lerp(42.0, 18.0, stageProgress);
      flameActive = true;
      smokeActive = true;
      flameIntensity = 0.85;
    } else if (activeStage.index === 7) {
      // Stage 7: Emergency Response & Failsafe Isolation
      if (this.prevStageIndex !== 7) {
        this.playContactorTrip();
      }
      isolationTripped = true;
      busVoltage = 27.8; // Battery open circuit survival rail
      busCurrent = 0.85; // Low power quiescent draw
      pcuTemp = THREE.MathUtils.lerp(240.0, 110.0, stageProgress); // cooling off without electrical power
      rceTemp = THREE.MathUtils.lerp(98.0, 42.0, stageProgress);
      flameActive = false; // flame starved of energy
      smokeActive = stageProgress < 0.6; // lingering smoke clears
    }
    this.prevStageIndex = activeStage.index;

    const state = {
      stage: activeStage.index,
      progress: stageProgress,
      pcuTemp,
      rceTemp,
      battTemp,
      motorTemp,
      commsTemp,
      busVoltage,
      busCurrent,
      sparksActive,
      flameActive,
      smokeActive,
      flameIntensity,
      isolationTripped
    };

    this.roverScene.applySimulationState(state);
    this.latestState = state;
  }

  // =========================================================================
  // HUD TELEMETRY UPDATE
  // =========================================================================
  updateHUD() {
    if (!this.latestState) return;
    const s = this.latestState;
    const activeStage = this.stages[this.currentStageIndex - 1];

    // Stage pills
    document.querySelectorAll('.stage-pill-btn').forEach(btn => {
      const idx = parseInt(btn.dataset.stage, 10);
      btn.classList.toggle('active', idx === this.currentStageIndex);
    });

    // Timeline Slider
    const timelineSlider = document.getElementById('sim-timeline-slider');
    if (timelineSlider && document.activeElement !== timelineSlider) {
      timelineSlider.value = this.simTime;
    }

    // Time display
    const timeDisplay = document.getElementById('sim-time-display');
    if (timeDisplay) {
      timeDisplay.textContent = `T+${this.simTime.toFixed(1)}s // ${this.totalDuration.toFixed(0)}s`;
    }

    // Stage Header & Summary
    const stageTitle = document.getElementById('hud-stage-title');
    if (stageTitle) stageTitle.textContent = activeStage.name;

    const stageBadge = document.getElementById('hud-stage-badge');
    if (stageBadge) {
      stageBadge.textContent = activeStage.badge;
      stageBadge.className = `cd-trend-pill ${activeStage.badgeClass}`;
    }

    const stageDesc = document.getElementById('hud-stage-desc');
    if (stageDesc) stageDesc.textContent = activeStage.summary;

    // Bus Telemetry
    const valVoltage = document.getElementById('val-bus-voltage');
    if (valVoltage) valVoltage.textContent = s.busVoltage.toFixed(1);

    const valCurrent = document.getElementById('val-bus-current');
    if (valCurrent) valCurrent.textContent = s.busCurrent.toFixed(1);

    const valPcuTemp = document.getElementById('val-pcu-temp');
    if (valPcuTemp) valPcuTemp.textContent = s.pcuTemp.toFixed(1);

    // Contactor status indicator
    const contactorPill = document.getElementById('badge-contactor-status');
    if (contactorPill) {
      contactorPill.textContent = s.isolationTripped ? 'ISOLATED (OPEN)' : 'CLOSED (ENERGIZED)';
      contactorPill.className = s.isolationTripped ? 'status-tag tag-red' : 'status-tag tag-green';
    }

    this.updateComponentDetailHUD();
  }

  updateComponentDetailHUD() {
    if (!this.latestState) return;
    const s = this.latestState;
    const id = this.selectedComponentId;

    let name = 'Power Conditioning Unit (PCU)';
    let temp = s.pcuTemp;
    let voltage = s.busVoltage;
    let current = s.busCurrent;
    let health = 100;
    let statusText = 'NOMINAL';
    let statusClass = 'tag-green';
    let roleText = 'Primary 28V power regulation, battery charge management, and secondary DC-DC distribution.';

    if (id === 'pcu') {
      name = 'Power Conditioning Unit (PCU)';
      temp = s.pcuTemp;
      voltage = s.busVoltage;
      current = s.busCurrent;
      if (s.stage === 1) { health = 100; statusText = 'NOMINAL'; statusClass = 'tag-green'; }
      else if (s.stage === 2) { health = 85; statusText = 'THERMAL STRESS'; statusClass = 'tag-amber'; }
      else if (s.stage === 3) { health = 52; statusText = 'OVERHEATING'; statusClass = 'tag-amber'; }
      else if (s.stage === 4) { health = 15; statusText = 'SHORT CIRCUIT'; statusClass = 'tag-red'; }
      else if (s.stage === 5 || s.stage === 6) { health = 0; statusText = 'INTERNAL FIRE'; statusClass = 'tag-red'; }
      else { health = 0; statusText = 'ISOLATED (SAFE)'; statusClass = 'tag-red'; }
    } else if (id === 'rce') {
      name = 'Rover Compute Element (RAD750)';
      temp = s.rceTemp;
      voltage = s.isolationTripped ? 3.3 : (s.busVoltage > 20 ? 3.3 : 2.7);
      current = 2.4;
      if (s.stage <= 3) { health = 100; statusText = 'NOMINAL'; statusClass = 'tag-green'; }
      else if (s.stage <= 5) { health = 88; statusText = 'ELEVATED TEMP'; statusClass = 'tag-amber'; }
      else if (s.stage === 6) { health = 64; statusText = 'THERMAL RISK'; statusClass = 'tag-amber'; }
      else { health = 95; statusText = 'SAFE MODE'; statusClass = 'tag-blue'; }
      roleText = 'Dual redundant radiation-hardened PowerPC RAD750 flight computers managing guidance & autonomy.';
    } else if (id === 'battery') {
      name = 'Li-Ion Rover Battery & Contactor';
      temp = s.battTemp;
      voltage = 28.4;
      current = s.busCurrent;
      if (s.stage <= 4) { health = 98; statusText = 'NOMINAL'; statusClass = 'tag-green'; }
      else if (s.stage <= 6) { health = 82; statusText = 'HIGH DRAIN'; statusClass = 'tag-amber'; }
      else { health = 94; statusText = 'ISOLATED'; statusClass = 'tag-blue'; }
      roleText = '8-cell series lithium-ion chemistry powering avionics during Martian night and peak mobility loads.';
    } else if (id === 'motor') {
      name = 'Motor Controller (Mobility & Arm)';
      temp = s.motorTemp;
      voltage = s.isolationTripped ? 0.0 : (s.stage >= 6 ? 6.5 : 28.0);
      current = s.isolationTripped ? 0.0 : 4.8;
      if (s.stage <= 4) { health = 100; statusText = 'NOMINAL'; statusClass = 'tag-green'; }
      else if (s.stage <= 6) { health = 45; statusText = 'RAIL DROPOUT'; statusClass = 'tag-red'; }
      else { health = 0; statusText = 'SHED LOAD (OFF)'; statusClass = 'tag-gray'; }
      roleText = 'H-bridge power switches driving 6 rocker-bogie wheels, steering servos, and robotic sampling arm.';
    } else if (id === 'comms') {
      name = 'Telecom Transceiver (UHF/X-Band)';
      temp = s.commsTemp;
      voltage = s.isolationTripped ? 0.0 : 28.0;
      current = s.isolationTripped ? 0.0 : 1.2;
      health = s.stage >= 6 ? 65 : 100;
      statusText = s.isolationTripped ? 'STANDBY' : 'NOMINAL';
      statusClass = s.isolationTripped ? 'tag-gray' : 'tag-green';
      roleText = 'Electrically shielded transceiver communicating with Mars Reconnaissance Orbiter and Earth DSN.';
    }

    const compNameEl = document.getElementById('comp-detail-name');
    if (compNameEl) compNameEl.textContent = name;

    const compStatusEl = document.getElementById('comp-detail-status');
    if (compStatusEl) {
      compStatusEl.textContent = statusText;
      compStatusEl.className = `status-tag ${statusClass}`;
    }

    const compTempEl = document.getElementById('comp-detail-temp');
    if (compTempEl) compTempEl.textContent = `${temp.toFixed(1)} °C`;

    const compVoltEl = document.getElementById('comp-detail-volt');
    if (compVoltEl) compVoltEl.textContent = `${voltage.toFixed(1)} V`;

    const compCurrEl = document.getElementById('comp-detail-curr');
    if (compCurrEl) compCurrEl.textContent = `${current.toFixed(1)} A`;

    const compHealthEl = document.getElementById('comp-detail-health');
    if (compHealthEl) compHealthEl.textContent = `${health}%`;

    const compRoleEl = document.getElementById('comp-detail-role');
    if (compRoleEl) compRoleEl.textContent = roleText;
  }

  // =========================================================================
  // PYROS MAIN MENU SWITCHER
  // =========================================================================
  setupPyrosMenu() {
    const mainMenu = document.getElementById('pyros-main-menu');
    const btnOpenMenu = document.getElementById('btn-open-main-menu');
    const btnCloseMenu = document.getElementById('btn-close-main-menu');
    const btnResumeRover = document.getElementById('btn-resume-rover');
    const cardRover = document.getElementById('card-scene-rover');

    const openMenu = () => {
      if (!mainMenu) return;
      mainMenu.style.display = 'flex';
      requestAnimationFrame(() => {
        mainMenu.classList.add('active');
      });
      if (btnCloseMenu) btnCloseMenu.style.display = 'flex';
    };

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

    if (btnCloseMenu) btnCloseMenu.addEventListener('click', closeMenu);
    if (btnResumeRover) btnResumeRover.addEventListener('click', closeMenu);
    if (cardRover) cardRover.addEventListener('click', closeMenu);

    // Click backdrop to close
    const backdrop = mainMenu ? mainMenu.querySelector('.pyros-menu-backdrop') : null;
    if (backdrop) backdrop.addEventListener('click', closeMenu);

    // Escape key to close
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mainMenu && mainMenu.classList.contains('active')) {
        closeMenu();
      }
    });
  }

  // =========================================================================
  // SCREENSHOT CAPTURE UTILITY
  // =========================================================================
  setupScreenshot() {
    const btnScreenshot = document.getElementById('btn-screenshot');
    if (!btnScreenshot) return;

    btnScreenshot.addEventListener('click', () => {
      try {
        this.renderer.render(this.scene, this.camera);
        const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `pyros-rover-avionics-${ts}.png`;

        const triggerDownload = (url) => {
          const a = document.createElement('a');
          a.download = filename;
          a.href = url;
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            document.body.removeChild(a);
            if (url.startsWith('blob:')) URL.revokeObjectURL(url);
          }, 1500);

          // Visual tactile feedback
          btnScreenshot.style.transform = 'scale(0.85)';
          btnScreenshot.style.borderColor = '#10b981';
          setTimeout(() => {
            btnScreenshot.style.transform = '';
            btnScreenshot.style.borderColor = '';
          }, 350);
        };

        if (this.canvas.toBlob) {
          this.canvas.toBlob((blob) => {
            if (blob) {
              const objectUrl = URL.createObjectURL(blob);
              triggerDownload(objectUrl);
            } else {
              triggerDownload(this.canvas.toDataURL('image/png'));
            }
          }, 'image/png');
        } else {
          triggerDownload(this.canvas.toDataURL('image/png'));
        }
      } catch (err) {
        console.error('Screenshot failed:', err);
      }
    });
  }

  // =========================================================================
  // RENDER & ANIMATION LOOP
  // =========================================================================
  renderLoop(timestamp) {
    if (this.isDestroyed) return;
    this.rafId = requestAnimationFrame((t) => this.renderLoop(t));

    const dt = this.lastTimestamp ? Math.min(0.1, (timestamp - this.lastTimestamp) / 1000) : 0.016;
    this.lastTimestamp = timestamp;

    // Advance timeline if playing
    if (this.isPlaying) {
      this.simTime += dt * this.playbackSpeed;
      if (this.simTime > this.totalDuration) {
        this.simTime = this.totalDuration;
        this.isPlaying = false;
        const btnPlayPause = document.getElementById('btn-play-pause');
        if (btnPlayPause) {
          btnPlayPause.innerHTML = '<span>[REPLAY]</span>';
        }
      }
      this.evaluateSimulationState();
      this.updateHUD();
    }

    // Camera flight interpolation
    this.updateCameraFlight(timestamp);

    // OrbitControls update
    this.controls.update();

    // Scene animation & particle update
    if (this.roverScene) {
      this.roverScene.update(dt, timestamp * 0.001);
    }

    // Render WebGL frame
    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  destroy() {
    this.isDestroyed = true;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    if (this._onResize) window.removeEventListener('resize', this._onResize);
    if (this.audioCtx) {
      try { this.audioCtx.close(); } catch (e) {}
    }
    if (this.renderer) {
      try { this.renderer.dispose(); } catch (e) {}
    }
    if (this.controls) {
      try { this.controls.dispose(); } catch (e) {}
    }
    if (this.roverScene && typeof this.roverScene.dispose === 'function') {
      try { this.roverScene.dispose(); } catch (e) {}
    }
  }
}

