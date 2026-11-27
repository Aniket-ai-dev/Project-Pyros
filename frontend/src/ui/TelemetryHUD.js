/**
 * TelemetryHUD.js
 * Scientific Telemetry HUD displaying Navier-Stokes fluid mechanics numbers,
 * Grashof/Rayleigh/Froude dimensionless parameters, temperature readouts, and regime states.
 */

export class TelemetryHUD {
  constructor(domElement, config) {
    this.domElement = domElement;
    this.config = config;

    this.fpsCounter = 60;
    this.frameTime = 16.6;
    this.lastTime = performance.now();
    this.frames = 0;

    this.engineName = 'WebGPU Compute (WGSL)';

    this.createDOM();
  }

  setEngine(name) {
    this.engineName = name;
    if (this.engineBadge) {
      this.engineBadge.textContent = name;
      if (name.includes('WebGPU')) {
        this.engineBadge.className = 'engine-pill badge-webgpu';
      } else {
        this.engineBadge.className = 'engine-pill badge-webgl2';
      }
    }
  }

  createDOM() {
    this.domElement.innerHTML = `
      <div class="panel-header">
        <div class="panel-header-title">
          <span class="status-dot"></span>
          <span>Live Telemetry</span>
        </div>
        <span id="engineBadge" class="engine-pill badge-webgpu">WebGPU Compute</span>
      </div>

      <div class="telemetry-body">
        <!-- 2x2 Primary Thermodynamic & Physical Metric Cards -->
        <div class="metrics-2col">
          <div class="metric-cell">
            <div class="metric-title">Flame Core Temp</div>
            <div class="metric-val" id="metricTemp" style="color: #fb923c;">1,850 K</div>
            <div class="metric-desc" id="metricTempC">1,577 °C</div>
          </div>

          <div class="metric-cell">
            <div class="metric-title">Thermal Power</div>
            <div class="metric-val" id="metricHeat" style="color: #facc15;">1.42 kW</div>
            <div class="metric-desc" id="metricStoich">Reaction: Normal</div>
          </div>

          <div class="metric-cell">
            <div class="metric-title">Effective Gravity</div>
            <div class="metric-val" id="metricGravity" style="color: #4ade80;">9.81 m/s²</div>
            <div class="metric-desc" id="metricRegime">Earth (1.00g)</div>
          </div>

          <div class="metric-cell">
            <div class="metric-title">Solver Loop</div>
            <div class="metric-val" id="metricFPS" style="color: #38bdf8;">60 FPS</div>
            <div class="metric-desc" id="metricLatency">16.6 ms/frame</div>
          </div>
        </div>

        <!-- Regime Status Banner -->
        <div class="regime-status-banner regime-earth" id="regimeBanner">
          <span style="font-size: 8px;">●</span>
          <span id="regimeText">Regime: Buoyant Convection (Earth 1.00g)</span>
        </div>

        <!-- Dimensionless Numbers for Students & Fluid Mechanics -->
        <div class="dimensionless-section">
          <div class="dim-section-title">Hydrodynamic Numbers</div>
          <div class="dim-grid">
            <div class="dim-item" title="Grashof Number: Gr = g·β·ΔT·L³ / ν² (Ratio of buoyancy force to viscous force)">
              <span class="dim-name">Grashof (Gr):</span>
              <span class="dim-num" id="numGrashof">2.84 × 10⁵</span>
            </div>
            <div class="dim-item" title="Rayleigh Number: Ra = Gr · Pr (Predicts convective roll instability)">
              <span class="dim-name">Rayleigh (Ra):</span>
              <span class="dim-num" id="numRayleigh">1.99 × 10⁵</span>
            </div>
            <div class="dim-item" title="Péclet Number: Pe = u·L / α (Ratio of advection to thermal diffusion)">
              <span class="dim-name">Péclet (Pe):</span>
              <span class="dim-num" id="numPeclet">420.5</span>
            </div>
            <div class="dim-item" title="Froude Number: Fr = u / √(g·L) (Ratio of flow inertia to gravity)">
              <span class="dim-name">Froude (Fr):</span>
              <span class="dim-num" id="numFroude">1.12</span>
            </div>
          </div>
        </div>
      </div>
    `;

    this.engineBadge = this.domElement.querySelector('#engineBadge');
    this.metricFPS = this.domElement.querySelector('#metricFPS');
    this.metricLatency = this.domElement.querySelector('#metricLatency');
    this.metricTemp = this.domElement.querySelector('#metricTemp');
    this.metricTempC = this.domElement.querySelector('#metricTempC');
    this.metricGravity = this.domElement.querySelector('#metricGravity');
    this.metricRegime = this.domElement.querySelector('#metricRegime');
    this.metricHeat = this.domElement.querySelector('#metricHeat');
    this.metricStoich = this.domElement.querySelector('#metricStoich');
    this.numGrashof = this.domElement.querySelector('#numGrashof');
    this.numRayleigh = this.domElement.querySelector('#numRayleigh');
    this.numPeclet = this.domElement.querySelector('#numPeclet');
    this.numFroude = this.domElement.querySelector('#numFroude');
    this.regimeBanner = this.domElement.querySelector('#regimeBanner');
    this.regimeText = this.domElement.querySelector('#regimeText');
  }

  update(gasConfig) {
    const now = performance.now();
    this.frames++;
    if (now - this.lastTime >= 500) {
      this.fpsCounter = Math.round((this.frames * 1000) / (now - this.lastTime));
      this.frameTime = ((now - this.lastTime) / this.frames).toFixed(1);
      this.frames = 0;
      this.lastTime = now;

      if (this.metricFPS) {
        this.metricFPS.textContent = `${this.fpsCounter} FPS`;
        this.metricLatency.textContent = `${this.frameTime} ms`;
      }
    }

    const c = this.config;
    const g = c.gravity;

    // Fluid dynamics dimensionless calculations
    const deltaT = Math.max(0, gasConfig.flameTempMax - c.ambientTemp);
    const beta = 1.0 / c.ambientTemp;
    const L = 0.08; // 8 cm flame length
    const nu = 1.5e-5; // kinematic viscosity of air
    const Pr = 0.7; // Prandtl number of air
    const Gr = (Math.abs(g) * beta * deltaT * (L * L * L)) / (nu * nu);
    const Ra = Gr * Pr;
    const Fr = (c.fuelVelocity * c.fuelVelocity) / (Math.max(0.01, Math.abs(g)) * L);
    const Pe = (c.fuelVelocity * L) / gasConfig.diffusionRate;

    // Temperature calculations
    let currentPeakTemp = gasConfig.flameTempMax;
    if (c.ambientOxygen < 0.14) {
      currentPeakTemp *= (c.ambientOxygen / 0.14);
    }
    if (Math.abs(g) < 0.1) {
      currentPeakTemp *= 0.88;
    }
    const tempC = Math.round(currentPeakTemp - 273.15);

    if (this.metricTemp) this.metricTemp.textContent = `${Math.round(currentPeakTemp).toLocaleString()} K`;
    if (this.metricTempC) this.metricTempC.textContent = `${tempC.toLocaleString()} °C`;
    if (this.metricGravity) this.metricGravity.textContent = `${g.toFixed(2)} m/s²`;
    
    // Gravitational regime description
    if (Math.abs(g) < 0.05) {
      this.metricRegime.textContent = 'ISS Zero-G (0.00g)';
      this.regimeText.textContent = 'Regime: Pure Molecular Diffusion (0.00g)';
      this.regimeBanner.className = 'regime-status-banner regime-microgravity';
      this.numGrashof.textContent = '0.00 (Diffusive)';
      this.numRayleigh.textContent = '0.00 (No Conv.)';
    } else if (Math.abs(g - 1.62) < 0.1) {
      this.metricRegime.textContent = 'Lunar Surface (0.165g)';
      this.regimeText.textContent = 'Regime: Weak Buoyancy (0.165g Bulbous)';
      this.regimeBanner.className = 'regime-status-banner regime-lunar';
      this.numGrashof.textContent = (Gr).toExponential(2);
      this.numRayleigh.textContent = (Ra).toExponential(2);
    } else if (Math.abs(g - 3.72) < 0.1) {
      this.metricRegime.textContent = 'Mars Atmosphere (0.38g)';
      this.regimeText.textContent = 'Regime: Intermediate Buoyancy (0.38g)';
      this.regimeBanner.className = 'regime-status-banner regime-mars';
      this.numGrashof.textContent = (Gr).toExponential(2);
      this.numRayleigh.textContent = (Ra).toExponential(2);
    } else if (g > 15.0) {
      this.metricRegime.textContent = 'Hypergravity (>2.0g)';
      this.regimeText.textContent = 'Regime: High-Velocity Needle Shear';
      this.regimeBanner.className = 'regime-status-banner regime-hyper';
      this.numGrashof.textContent = (Gr).toExponential(2);
      this.numRayleigh.textContent = (Ra).toExponential(2);
    } else {
      this.metricRegime.textContent = 'Earth Gravity (1.00g)';
      this.regimeText.textContent = 'Regime: Buoyant Convection (1.00g)';
      this.regimeBanner.className = 'regime-status-banner regime-earth';
      this.numGrashof.textContent = (Gr).toExponential(2);
      this.numRayleigh.textContent = (Ra).toExponential(2);
    }

    if (c.ambientOxygen < 0.12) {
      this.regimeText.textContent = 'Critical Alert: Hypoxic Starvation (<14% O2)';
      this.regimeBanner.className = 'regime-status-banner regime-critical';
    }

    // Dimensionless numbers
    if (this.numPeclet) this.numPeclet.textContent = Pe.toFixed(1);
    if (this.numFroude) this.numFroude.textContent = Fr.toFixed(2);

    // Heat release
    const power = (c.fuelRate * gasConfig.heatOfCombustion * (c.ambientOxygen / 0.21) * 1.5).toFixed(2);
    if (this.metricHeat) this.metricHeat.textContent = `${power} kW`;

    this.updateRoperComparison();
  }

  updateRoperComparison() {
    const svg = document.getElementById('roper-lab-svg');
    if (!svg) return;
    const gCurr = Math.abs(this.config.gravity) / 9.81;
    const o2Ratio = Math.max(0.25, this.config.ambientOxygen / 0.21);
    const fuelRate = this.config.fuelRate || 1.0;

    const w = 284;
    const h = 114;
    const padL = 28;
    const padR = 10;
    const padT = 16;
    const padB = 20;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    const regimes = [
      { label: '0g', g: 0.0, col: '#38bdf8' },
      { label: 'Moon', g: 0.165, col: '#9aa4b4' },
      { label: 'Mars', g: 0.38, col: '#ea7a31' },
      { label: 'Earth', g: 1.0, col: '#e5a03b' },
      { label: 'Hyper', g: 2.5, col: '#e5484d' },
    ];

    const calcScaledH = (g) => {
      if (g < 0.03) return Math.min(68, (22 + o2Ratio * 6) * Math.sqrt(fuelRate));
      return Math.min(68, (26 + o2Ratio * 12) * Math.sqrt(fuelRate) * Math.pow(g + 0.1, -0.2));
    };

    const barW = 30;
    const gap = (plotW - regimes.length * barW) / (regimes.length + 1);
    let barsSvg = '';
    regimes.forEach((r, idx) => {
      const val = calcScaledH(r.g);
      const bh = (val / 70) * plotH;
      const x = padL + gap + idx * (barW + gap);
      const y = padT + plotH - bh;
      const isNear = Math.abs(gCurr - r.g) < 0.12;
      barsSvg += `
        <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW}" height="${bh.toFixed(1)}" rx="3"
          fill="${isNear ? r.col : 'rgba(236,240,246,0.14)'}"
          stroke="${r.col}" stroke-width="${isNear ? 1.5 : 0.8}" />
        <text x="${(x + barW / 2).toFixed(1)}" y="${(y - 3).toFixed(1)}" text-anchor="middle" fill="#9aa4b4" font-family="JetBrains Mono, monospace" font-size="8.5">${val.toFixed(0)}mm</text>
        <text x="${(x + barW / 2).toFixed(1)}" y="${h - 5}" text-anchor="middle" fill="${isNear ? '#ecf0f6' : '#697487'}" font-family="JetBrains Mono, monospace" font-size="8.5">${r.label}</text>
      `;
    });

    svg.innerHTML = `
      <line x1="${padL}" y1="${padT + plotH}" x2="${padL + plotW}" y2="${padT + plotH}" stroke="rgba(236, 240, 246, 0.14)" stroke-width="1" />
      <text x="${padL}" y="10" fill="#9aa4b4" font-family="JetBrains Mono, monospace" font-size="8.5">Estimated flame length across g (O2=${(this.config.ambientOxygen * 100).toFixed(0)}%)</text>
      ${barsSvg}
    `;
  }
}
