'use client';

import React, { useEffect, useRef } from 'react';
import { initVerticalControls } from '@/ui/VerticalControlsController';

const HTML_CONTENT = `<!-- 3D Three.js WebGL/WebGPU Viewport Canvas -->
  <canvas id="canvas-3d"></canvas>

  <!-- Top Scientific Navigation Bar -->
    <!-- FLOATING SWIPEABLE CAPSULE NAVBAR (Reference Match) -->
  <header class="pyros-capsule-navbar">
    <a href="/" class="capsule-brand-circle" title="Project Pyros Home">
      <svg viewBox="0 0 24 24"><path d="M12 2c1.1 0 2 .9 2 2 0 1.2-.8 2.1-1.8 2.6C16.4 8.2 19 11.8 19 16c0 3.9-3.1 7-7 7s-7-3.1-7-7c0-4.2 2.6-7.8 6.8-9.4C10.8 6.1 10 5.2 10 4c0-1.1.9-2 2-2z"/></svg>
    </a>

    <div class="capsule-slide-track">
      <a href="/" class="capsule-item" title="Home Screen">
        <div class="capsule-item-icon"><svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>
        <span class="capsule-item-label">Home</span>
      </a>

      <button class="capsule-item apparatus-pill-btn active" data-shape="candle" title="Candle Flame">
        <div class="capsule-item-icon"><svg viewBox="0 0 24 24"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg></div>
        <span class="capsule-item-label">Candle</span>
      </button>

      <button class="capsule-item apparatus-pill-btn" data-shape="circle" title="Burner Jet">
        <div class="capsule-item-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></svg></div>
        <span class="capsule-item-label">Burner</span>
      </button>

      <button class="capsule-item apparatus-pill-btn" data-shape="droplet" title="Droplet Combustion">
        <div class="capsule-item-icon"><svg viewBox="0 0 24 24"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg></div>
        <span class="capsule-item-label">Droplet</span>
      </button>

      <a href="/station" class="capsule-item" title="Explore Space Station">
        <div class="capsule-item-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M3 12h6M15 12h6M12 3v6M12 15v6"/></svg></div>
        <span class="capsule-item-label">Station</span>
      </a>

      <button id="btn-toggle-telemetry" class="capsule-item active" title="Toggle Telemetry">
        <div class="capsule-item-icon"><svg viewBox="0 0 24 24"><path d="M18 20V10M12 20V4M6 20v-6"/></svg></div>
        <span class="capsule-item-label">Telemetry</span>
      </button>

      <button id="btn-toggle-controls" class="capsule-item active" title="Toggle Parameters">
        <div class="capsule-item-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></div>
        <span class="capsule-item-label">Params</span>
      </button>

      <button id="btn-open-guide" class="capsule-item" title="Physics Guide">
        <div class="capsule-item-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>
        <span class="capsule-item-label">Guide</span>
      </button>
    </div>
  </header>

  <!-- Workspace Floating Panels Container -->
  <main class="lab-workspace">
    <!-- Left Dock: Telemetry HUD & 2D Diagnostic Slice -->
    <div class="left-dock" id="left-dock-container">
      <!-- Scientific Telemetry HUD -->
      <section id="telemetry-hud" class="sci-panel"></section>

      <!-- 2D Eulerian Diagnostic Slice Visualizer -->
      <section id="slice-panel" class="sci-panel slice-card">
        <div class="slice-meta-row">
          <span style="font-weight: 700; color: var(--accent-cyan);">2D VOXEL CROSS-SECTION</span>
          <span style="color: var(--text-tertiary);">HOVER TO PROBE</span>
        </div>
        <canvas id="canvas-slice" width="300" height="180"></canvas>
        <div class="slice-footer">
          <span>64 × 96 × 64 (393K CELLS)</span>
          <span>EULERIAN SOLVER</span>
        </div>
      </section>
    </div>

    <!-- Right Dock: Scientific Parameters Inspector -->
    <div class="right-dock" id="right-dock-container">
      <aside id="controls-panel" class="sci-panel"></aside>
    </div>
  </main>

  <!-- Vertical Collapsible Navigation & Flight Controls Menu (Right Side) -->
  <aside class="pyros-vertical-controls" aria-label="Flight & Camera Navigation Controls">
    <div class="controls-header">
      <div class="controls-title-group">
        <span class="controls-title-dot"></span>
        <span class="controls-title">Physics Controls</span>
      </div>
      <button class="controls-hide-btn" title="Hide controls (Press H)">[HIDE ⮞]</button>
    </div>
    <div class="controls-body">
      <div class="control-row">
        <div class="control-keys">
          <kbd class="key-cap">Left Drag</kbd>
        </div>
        <span class="control-label">Orbit Flame</span>
      </div>
      <div class="control-row">
        <div class="control-keys">
          <kbd class="key-cap">Right Drag</kbd>
        </div>
        <span class="control-label">Pan Chamber</span>
      </div>
      <div class="control-row">
        <div class="control-keys">
          <kbd class="key-cap">Scroll</kbd>
        </div>
        <span class="control-label">Zoom In / Out</span>
      </div>
      <div class="control-row">
        <div class="control-keys">
          <kbd class="key-cap">1 - 6</kbd>
        </div>
        <span class="control-label">Gravity Presets</span>
      </div>
    </div>
  </aside>

  <!-- Collapsed Right-Edge Floating Reopen Tab -->
  <button class="controls-reopen-tab" title="Show controls (Press H)">
    <span>⌨ CONTROLS</span>
    <span>⮜</span>
  </button>

  <!-- Educational Scientific Reference Modal for Students & Researchers -->
  <div id="physics-guide-modal" class="modal-overlay">
    <div class="modal-card">
      <div class="modal-header">
        <div class="modal-title">
          <span>Microgravity Combustion Physics // Student & Research Guide</span>
        </div>
        <button id="btn-close-guide" class="modal-close-btn" aria-label="Close modal">[CLOSE]</button>
      </div>

      <div class="modal-body">
        <!-- Topic 1: Navier-Stokes Buoyancy -->
        <div class="theory-box">
          <div class="theory-heading">1. Navier-Stokes Buoyancy & Convection</div>
          <p>
            In normal Earth gravity, flames are shaped by buoyant natural convection. Thermal expansion decreases the gas density in the flame zone, creating an upward buoyant force described by the Boussinesq approximation:
          </p>
          <div class="formula-block">
            ρ (∂u/∂t + u · ∇u) = -∇p + μ ∇²u + ρ₀ β (T - T₀) g
          </div>
          <p>
            The buoyant upward acceleration draws surrounding air inward and upward, stretching the flame into its familiar <strong>teardrop shape</strong> and driving convective flickering at 10–14 Hz.
          </p>
        </div>

        <!-- Topic 2: Microgravity Diffusion Flame -->
        <div class="theory-box">
          <div class="theory-heading">2. The ISS Microgravity Spherical Diffusion Regime (g = 0.0)</div>
          <p>
            In orbital freefall aboard the International Space Station (ISS), the effective gravitational acceleration is zero (<strong>g = 0.0 m/s²</strong>). The buoyant term drops out entirely.
          </p>
          <div class="formula-block">
            Gr → 0  ⟹  ∂Y/∂t = D ∇²Y - ω̇
          </div>
          <p>
            Combustion becomes purely governed by <strong>isotropic molecular diffusion</strong>. Oxygen diffuses symmetrically from all radial directions toward the wick, and combustion products diffuse outward. Because there is no buoyant draft to stretch the gas, the flame naturally settles into a calm, ethereal <strong>spherical blue diffusion dome</strong>.
          </p>
        </div>

        <!-- Topic 3: Candle Flame Anatomy -->
        <div class="theory-box">
          <div class="theory-heading">3. The 4 Anatomical Zones of a Wax Candle Flame</div>
          <p>
            A real candle flame consists of four distinct physical zones established by diffusion kinetics:
          </p>
          <ul style="padding-left: 18px; margin: 6px 0;">
            <li><strong>Zone 1: Sapphire-Blue Radical Base Cup:</strong> Hugs the lower 20% of the wick. Rich in excited CH* (431 nm) and C₂* (516 nm) radicals formed where incoming fresh ambient oxygen first meets vaporized wax.</li>
            <li><strong>Zone 2: Dark Non-Luminous Pyrolysis Core:</strong> Located directly above the black wick. Solid paraffin is vaporized into hydrocarbon gas (C₂₀H₄₂ to C₃₀H₆₂). Oxygen has not penetrated here, and temperature is too low for soot incandescence.</li>
            <li><strong>Zone 3: Luminous Golden-White Incandescent Core:</strong> Carbon nanoparticles (soot) form and are heated to 1,600 K–1,850 K, glowing brilliantly via Planck blackbody radiation.</li>
            <li><strong>Zone 4: Warm Amber Mantle & Tip:</strong> The outer envelope where soot particles meet sufficient oxygen and are fully combusted into CO₂ and H₂O.</li>
          </ul>
        </div>

        <!-- Topic 4: Dimensionless Hydrodynamics -->
        <div class="theory-box">
          <div class="theory-heading">4. Dimensionless Numbers Reference</div>
          <div class="dim-explainer-list">
            <div class="dim-explainer-item">
              <strong>Grashof Number (Gr = g β ΔT L³ / ν²):</strong> Measures the ratio of buoyant forces to viscous friction. On Earth, Gr ≈ 10⁵ (strong convection); on the ISS, Gr = 0 (zero convection).
            </div>
            <div class="dim-explainer-item">
              <strong>Rayleigh Number (Ra = Gr · Pr):</strong> Governs the transition to free natural convection. Below the critical threshold (Ra &lt; 10³), convection is suppressed and diffusion dominates.
            </div>
            <div class="dim-explainer-item">
              <strong>Froude Number (Fr = u / √(gL)):</strong> Compares inertial momentum from injection velocity to gravitational buoyancy forces.
            </div>
            <div class="dim-explainer-item">
              <strong>Péclet Number (Pe = u L / α):</strong> Ratio of advective transport rate to thermal/mass diffusivity.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Global Preset Trigger Bridge -->
  <script>
    function triggerPreset(presetId) {
      const btn = document.querySelector(\`[data-preset="\${presetId}"]\`);
      if (btn) btn.click();
      const select = document.getElementById('global-preset-select');
      if (select && select.value !== presetId) {
        select.value = presetId;
      }
    }
  </script>

  <!-- Application Entry Point -->`;

export default function CombustionLabView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<any>(null);

  useEffect(() => {
    initVerticalControls();
    let isMounted = true;

    (window as any).triggerPreset = (presetId: string) => {
      const btn = document.querySelector(`[data-preset="${presetId}"]`) as HTMLElement | null;
      if (btn) btn.click();
      const select = document.getElementById('global-preset-select') as HTMLSelectElement | null;
      if (select && select.value !== presetId) {
        select.value = presetId;
      }
    };

    import('../../main.js')
      .then(({ AeroFireApp }) => {
        if (!isMounted) return;
        if (appRef.current) {
          appRef.current.destroy();
        }
        appRef.current = new AeroFireApp();
      })
      .catch((err) => console.error('Failed to init AeroFireApp:', err));

    return () => {
      isMounted = false;
      if (appRef.current && typeof appRef.current.destroy === 'function') {
        appRef.current.destroy();
        appRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="combustion-view-root"
      dangerouslySetInnerHTML={{ __html: HTML_CONTENT }}
    />
  );
}
