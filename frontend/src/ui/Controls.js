/**
 * Controls.js
 * Comprehensive Laboratory Parameter Inspector for Students and Researchers.
 * Clean, tabbed scientific control interface with two-way data binding.
 */

import { FLIGHT_PRESETS } from './PresetManager.js';
import { GAS_PRESETS } from '../physics/CombustionPhysics.js';

export class Controls {
  constructor(domElement, config, onParamChange, onSpark, onReset) {
    this.domElement = domElement;
    this.config = config;
    this.onParamChange = onParamChange;
    this.onSpark = onSpark;
    this.onReset = onReset;

    this.sliders = {};
    this.displays = {};

    this.createDOM();
    this.bindEvents();
  }

  createDOM() {
    this.domElement.innerHTML = `
      <!-- Tab Navigation Strip -->
      <div class="inspector-tab-strip">
        <button class="inspector-tab-btn active" data-tab="env">Environment</button>
        <button class="inspector-tab-btn" data-tab="combustion">Combustion</button>
        <button class="inspector-tab-btn" data-tab="optics">Optics & Diagnostics</button>
      </div>

      <div class="tab-content">
        <!-- ======================================================== -->
        <!-- TAB 1: PHYSICAL ENVIRONMENT                             -->
        <!-- ======================================================== -->
        <div id="tab-pane-env" class="tab-pane active">
          <!-- Gravitational Acceleration -->
          <div class="ctrl-group">
            <div class="ctrl-label-row">
              <span class="ctrl-title">Gravitational Acceleration (g)</span>
              <span class="ctrl-badge" id="val-gravity">${this.config.gravity.toFixed(2)} m/s²</span>
            </div>
            <input type="range" id="slider-gravity" min="-12.0" max="25.0" step="0.1" value="${this.config.gravity}" class="clean-slider" />
            <div class="quick-btn-grid">
              <button class="mini-btn" data-g="0.0">0.0g (ISS)</button>
              <button class="mini-btn" data-g="1.62">0.165g (Moon)</button>
              <button class="mini-btn" data-g="3.72">0.38g (Mars)</button>
              <button class="mini-btn" data-g="9.81">1.0g (Earth)</button>
              <button class="mini-btn" data-g="24.5">2.5g (Hyper)</button>
              <button class="mini-btn" data-g="-9.81">-1.0g (Inverted)</button>
            </div>
          </div>

          <!-- Ambient Oxygen Concentration -->
          <div class="ctrl-group">
            <div class="ctrl-label-row">
              <span class="ctrl-title">Ambient Oxygen (X_O₂)</span>
              <span class="ctrl-badge" id="val-oxygen">${(this.config.ambientOxygen * 100).toFixed(1)}%</span>
            </div>
            <input type="range" id="slider-oxygen" min="0.02" max="1.0" step="0.01" value="${this.config.ambientOxygen}" class="clean-slider" />
            <div id="oxygen-warning" class="warning-box ${this.config.ambientOxygen < 0.14 ? 'active' : ''}">
              <strong>Hypoxic Zone (&lt; 14% O₂):</strong> Below Limiting Oxygen Index (LOI). Candle/flame starves and extinguishes.
            </div>
          </div>

          <!-- Ambient Temperature -->
          <div class="ctrl-group">
            <div class="ctrl-label-row">
              <span class="ctrl-title">Ambient Temperature (T_∞)</span>
              <span class="ctrl-badge" id="val-ambientTemp">${Math.round(this.config.ambientTemp)} K</span>
            </div>
            <input type="range" id="slider-ambientTemp" min="150" max="450" step="5" value="${this.config.ambientTemp}" class="clean-slider" />
          </div>

          <!-- Horizontal Wind Shear -->
          <div class="ctrl-group">
            <div class="ctrl-label-row">
              <span class="ctrl-title">Crosswind Shear (u_x)</span>
              <span class="ctrl-badge" id="val-windX">${this.config.windX.toFixed(2)} m/s</span>
            </div>
            <input type="range" id="slider-windX" min="-0.6" max="0.6" step="0.02" value="${this.config.windX}" class="clean-slider" />
          </div>
        </div>

        <!-- ======================================================== -->
        <!-- TAB 2: COMBUSTION & KINETICS                            -->
        <!-- ======================================================== -->
        <div id="tab-pane-combustion" class="tab-pane">
          <!-- Fuel Gas Mixture -->
          <div class="ctrl-group">
            <div class="ctrl-label-row">
              <span class="ctrl-title">Fuel Vapor Mixture</span>
            </div>
            <select id="select-fuel" class="form-select">
              ${Object.keys(GAS_PRESETS).map(k => `
                <option value="${k}" ${this.config.fuelType === k ? 'selected' : ''}>
                  ${GAS_PRESETS[k].name}
                </option>
              `).join('')}
            </select>
          </div>

          <!-- Burner Geometry -->
          <div class="ctrl-group">
            <div class="ctrl-label-row">
              <span class="ctrl-title">Apparatus Geometry</span>
            </div>
            <select id="select-burner" class="form-select">
              <option value="candle" ${this.config.burnerShape === 'candle' ? 'selected' : ''}>Candle Wick (Diffusion Laminar)</option>
              <option value="circle" ${this.config.burnerShape === 'circle' ? 'selected' : ''}>Aerospace Jet Nozzle (CIR CIR-2)</option>
              <option value="droplet" ${this.config.burnerShape === 'droplet' ? 'selected' : ''}>Spherical Droplet Tether (ISS FLEX)</option>
            </select>
          </div>

          <!-- Fuel Flow Rate -->
          <div class="ctrl-group">
            <div class="ctrl-label-row">
              <span class="ctrl-title">Fuel Supply / Evaporation Rate</span>
              <span class="ctrl-badge" id="val-fuelRate">${this.config.fuelRate.toFixed(2)}</span>
            </div>
            <input type="range" id="slider-fuelRate" min="0.1" max="2.0" step="0.05" value="${this.config.fuelRate}" class="clean-slider" />
          </div>

          <!-- Injection Jet Velocity -->
          <div class="ctrl-group">
            <div class="ctrl-label-row">
              <span class="ctrl-title">Injection Velocity</span>
              <span class="ctrl-badge" id="val-fuelVel">${this.config.fuelVelocity.toFixed(2)} m/s</span>
            </div>
            <input type="range" id="slider-fuelVel" min="0.0" max="0.5" step="0.01" value="${this.config.fuelVelocity}" class="clean-slider" />
          </div>

          <!-- Vorticity Confinement -->
          <div class="ctrl-group">
            <div class="ctrl-label-row">
              <span class="ctrl-title">Vorticity Confinement (Turbulence)</span>
              <span class="ctrl-badge" id="val-vorticity">${this.config.vorticityConfinement.toFixed(2)}</span>
            </div>
            <input type="range" id="slider-vorticity" min="0.0" max="0.8" step="0.02" value="${this.config.vorticityConfinement}" class="clean-slider" />
          </div>

          <!-- Master Action Buttons -->
          <div class="action-buttons-grid">
            <button id="btn-spark" class="btn-primary-action" title="Deliver an electric pilot spark">
              <span>[PILOT SPARK]</span>
            </button>
            <button id="btn-reset" class="btn-secondary-action" title="Clear fluid solver grid">
              <span>[RESET GRID]</span>
            </button>
          </div>
        </div>

        <!-- ======================================================== -->
        <!-- TAB 3: OPTICS & DIAGNOSTICS                             -->
        <!-- ======================================================== -->
        <div id="tab-pane-optics" class="tab-pane">
          <!-- Colormap Mode -->
          <div class="ctrl-group">
            <div class="ctrl-label-row">
              <span class="ctrl-title">Spectral Emission Mode</span>
            </div>
            <select id="select-colormap" class="form-select">
              <option value="blackbody" ${this.config.colorMapMode === 'blackbody' ? 'selected' : ''}>Planck Blackbody + CH* Radicals</option>
              <option value="chemiluminescence" ${this.config.colorMapMode === 'chemiluminescence' ? 'selected' : ''}>Chemiluminescence (Blue 431nm)</option>
              <option value="thermal" ${this.config.colorMapMode === 'thermal' ? 'selected' : ''}>Thermal FLIR False-Color</option>
              <option value="flame" ${this.config.colorMapMode === 'flame' ? 'selected' : ''}>High-Dynamic Range Fire</option>
            </select>
          </div>

          <!-- Flame Core Brightness -->
          <div class="ctrl-group">
            <div class="ctrl-label-row">
              <span class="ctrl-title">Radiative Intensity</span>
              <span class="ctrl-badge" id="val-brightness">${this.config.flameBrightness.toFixed(1)}</span>
            </div>
            <input type="range" id="slider-brightness" min="0.5" max="5.0" step="0.1" value="${this.config.flameBrightness}" class="clean-slider" />
          </div>

          <!-- Smoke Density -->
          <div class="ctrl-group">
            <div class="ctrl-label-row">
              <span class="ctrl-title">Soot Smoke Absorption</span>
              <span class="ctrl-badge" id="val-smoke">${this.config.smokeDensity.toFixed(1)}</span>
            </div>
            <input type="range" id="slider-smoke" min="0.0" max="4.0" step="0.1" value="${this.config.smokeDensity}" class="clean-slider" />
          </div>

          <!-- Raymarch Steps -->
          <div class="ctrl-group">
            <div class="ctrl-label-row">
              <span class="ctrl-title">Raymarching Steps</span>
              <span class="ctrl-badge" id="val-steps">${this.config.raymarchSteps}</span>
            </div>
            <input type="range" id="slider-steps" min="48" max="192" step="16" value="${this.config.raymarchSteps}" class="clean-slider" />
          </div>

          <!-- 2D Slice Field Selection -->
          <div class="ctrl-group">
            <div class="ctrl-label-row">
              <span class="ctrl-title">2D Diagnostic Field</span>
            </div>
            <select id="select-sliceField" class="form-select">
              <option value="temperature">Temperature Field (K)</option>
              <option value="velocity">Velocity Vectors & Updraft</option>
              <option value="oxygen">Oxygen Concentration (X_O₂)</option>
              <option value="fuel">Unburned Fuel Vapor (Y_F)</option>
              <option value="pressure">Pressure Gradient</option>
            </select>
          </div>

          <!-- Slice Z-Index -->
          <div class="ctrl-group">
            <div class="ctrl-label-row">
              <span class="ctrl-title">Slice Z-Plane</span>
              <span class="ctrl-badge" id="val-sliceZ">${this.config.sliceIndex} / 63</span>
            </div>
            <input type="range" id="slider-sliceZ" min="0" max="63" step="1" value="${this.config.sliceIndex}" class="clean-slider" />
          </div>

          <!-- Chamber Wireframe Toggle -->
          <div class="toggle-row" style="margin-top: 4px;">
            <span class="ctrl-title">Chamber Bounding Grid</span>
            <input type="checkbox" id="check-wireframe" checked class="toggle-switch" />
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    const d = this.domElement;

    // Tab switching
    d.querySelectorAll('.inspector-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        d.querySelectorAll('.inspector-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const tabKey = btn.dataset.tab;
        d.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        const activePane = d.querySelector(`#tab-pane-${tabKey}`);
        if (activePane) activePane.classList.add('active');
      });
    });

    // Helper for slider sync
    const linkSlider = (sliderId, valId, prop, formatter = v => v) => {
      const slider = d.querySelector(`#${sliderId}`);
      const valDisplay = d.querySelector(`#${valId}`);
      if (!slider || !valDisplay) return;

      this.sliders[prop] = slider;
      this.displays[prop] = valDisplay;

      slider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.config[prop] = val;
        valDisplay.textContent = formatter(val);

        if (prop === 'ambientOxygen') {
          const warn = d.querySelector('#oxygen-warning');
          if (warn) {
            warn.classList.toggle('active', val < 0.14);
          }
        }

        if (this.onParamChange) this.onParamChange();
      });
    };

    linkSlider('slider-gravity', 'val-gravity', 'gravity', v => `${v.toFixed(2)} m/s²`);
    linkSlider('slider-vorticity', 'val-vorticity', 'vorticityConfinement', v => v.toFixed(2));
    linkSlider('slider-oxygen', 'val-oxygen', 'ambientOxygen', v => `${(v * 100).toFixed(1)}%`);
    linkSlider('slider-ambientTemp', 'val-ambientTemp', 'ambientTemp', v => `${Math.round(v)} K`);
    linkSlider('slider-fuelRate', 'val-fuelRate', 'fuelRate', v => v.toFixed(2));
    linkSlider('slider-fuelVel', 'val-fuelVel', 'fuelVelocity', v => `${v.toFixed(2)} m/s`);
    linkSlider('slider-windX', 'val-windX', 'windX', v => `${v.toFixed(2)} m/s`);
    linkSlider('slider-brightness', 'val-brightness', 'flameBrightness', v => v.toFixed(1));
    linkSlider('slider-smoke', 'val-smoke', 'smokeDensity', v => v.toFixed(1));
    linkSlider('slider-steps', 'val-steps', 'raymarchSteps', v => `${Math.round(v)}`);
    linkSlider('slider-sliceZ', 'val-sliceZ', 'sliceIndex', v => `${Math.round(v)} / 63`);

    // Gravity quick mini buttons
    d.querySelectorAll('.mini-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const g = parseFloat(btn.dataset.g);
        this.config.gravity = g;
        if (this.sliders.gravity) this.sliders.gravity.value = g;
        if (this.displays.gravity) this.displays.gravity.textContent = `${g.toFixed(2)} m/s²`;
        if (this.onParamChange) this.onParamChange();
      });
    });

    // Selects
    const linkSelect = (id, prop) => {
      const el = d.querySelector(`#${id}`);
      if (!el) return;
      el.addEventListener('change', (e) => {
        this.config[prop] = e.target.value;
        if (this.onParamChange) this.onParamChange();
      });
    };
    linkSelect('select-fuel', 'fuelType');
    linkSelect('select-burner', 'burnerShape');
    linkSelect('select-colormap', 'colorMapMode');
    linkSelect('select-sliceField', 'sliceField');

    // Wireframe checkbox
    const checkWire = d.querySelector('#check-wireframe');
    if (checkWire) {
      checkWire.addEventListener('change', (e) => {
        if (this.onParamChange) this.onParamChange('wireframe', e.target.checked);
      });
    }

    // Master buttons
    const sparkBtn = d.querySelector('#btn-spark');
    if (sparkBtn) {
      sparkBtn.addEventListener('click', () => {
        if (this.onSpark) this.onSpark();
      });
    }

    const resetBtn = d.querySelector('#btn-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (this.onReset) this.onReset();
      });
    }

    // Top Header Apparatus Bar synchronization
    document.querySelectorAll('.apparatus-pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const shape = btn.dataset.shape;
        this.setApparatus(shape);
      });
    });
  }

  setApparatus(shape) {
    this.config.burnerShape = shape;
    if (shape === 'candle') {
      this.config.fuelType = 'candleWax';
      this.config.nozzleRadius = 0.025;
      this.config.fuelVelocity = 0.08;
    } else if (shape === 'circle') {
      this.config.fuelType = 'propane';
      this.config.nozzleRadius = 0.12;
      this.config.fuelVelocity = 0.18;
    } else if (shape === 'droplet') {
      this.config.fuelType = 'propane';
      this.config.nozzleRadius = 0.10;
      this.config.fuelVelocity = 0.02;
    }

    document.querySelectorAll('.apparatus-pill-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.shape === shape);
    });

    const burnerSelect = this.domElement.querySelector('#select-burner');
    if (burnerSelect) burnerSelect.value = shape;

    const fuelSelect = this.domElement.querySelector('#select-fuel');
    if (fuelSelect) fuelSelect.value = this.config.fuelType;

    this.syncAllUI();
    if (this.onParamChange) this.onParamChange('burnerShape', shape);
  }

  syncAllUI() {
    const c = this.config;
    const d = this.domElement;

    const setSlider = (prop, val, str) => {
      if (this.sliders[prop]) this.sliders[prop].value = val;
      if (this.displays[prop]) this.displays[prop].textContent = str;
    };

    setSlider('gravity', c.gravity, `${c.gravity.toFixed(2)} m/s²`);
    setSlider('vorticityConfinement', c.vorticityConfinement, c.vorticityConfinement.toFixed(2));
    setSlider('ambientOxygen', c.ambientOxygen, `${(c.ambientOxygen * 100).toFixed(1)}%`);
    setSlider('ambientTemp', c.ambientTemp, `${Math.round(c.ambientTemp)} K`);
    setSlider('fuelRate', c.fuelRate, c.fuelRate.toFixed(2));
    setSlider('fuelVelocity', c.fuelVelocity, `${c.fuelVelocity.toFixed(2)} m/s`);
    setSlider('flameBrightness', c.flameBrightness, c.flameBrightness.toFixed(1));
    setSlider('smokeDensity', c.smokeDensity, c.smokeDensity.toFixed(1));

    const warn = d.querySelector('#oxygen-warning');
    if (warn) {
      warn.classList.toggle('active', c.ambientOxygen < 0.14);
    }

    const selFuel = d.querySelector('#select-fuel');
    if (selFuel) selFuel.value = c.fuelType;

    const selBurner = d.querySelector('#select-burner');
    if (selBurner) selBurner.value = c.burnerShape;

    const selColor = d.querySelector('#select-colormap');
    if (selColor) selColor.value = c.colorMapMode;

    document.querySelectorAll('.apparatus-pill-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.shape === c.burnerShape);
    });
  }
}
