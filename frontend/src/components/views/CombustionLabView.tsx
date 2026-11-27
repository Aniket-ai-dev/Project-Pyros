'use client';

import React, { useEffect, useRef } from 'react';
import SimulationTopBar from '../layout/SimulationTopBar';
import { AeroFireApp } from '../../main.js';

const PHYSICS_SHORTCUTS = [
  { keys: ['1', '–', '6'], action: 'Switch gravity regime preset' },
  { keys: ['Drag'], action: 'Orbit burner apparatus' },
  { keys: ['Scroll'], action: 'Zoom chamber viewport' },
  { keys: ['H'], action: 'Toggle shortcuts panel' },
];

export default function CombustionLabView() {
  const appRef = useRef<AeroFireApp | null>(null);

  useEffect(() => {
    const app = new AeroFireApp();
    appRef.current = app;
    return () => {
      app.destroy();
      appRef.current = null;
    };
  }, []);

  return (
    <div className="sim-viewport-page">
      <SimulationTopBar
        activeRoute="combustion"
        envCode="GPU-CFD"
        shortcuts={PHYSICS_SHORTCUTS}
        showGuideBtn
        showCombustionDockToggles
        showHudToggleBtn={false}
        showResetCamBtn
        showFullscreenBtn
      />

      {/* Fullscreen Volumetric Solver Canvas */}
      <canvas id="canvas-3d" className="sim-canvas" />

      {/* Left Dock: Live Telemetry HUD + 2D Thermal Slice + Multi-Gravity Roper Comparison */}
      <aside id="left-dock-container" className="dock-container dock-left">
        <div className="telemetry-hud">
          <div id="telemetry-hud" />

          <div className="slice-section">
            <div className="cd-section-head">
              <span className="cd-section-title">2D Axial Cross-Section</span>
              <span className="cd-section-badge">REAL-TIME SLICE</span>
            </div>
            <canvas id="canvas-slice" width="290" height="220" />
          </div>

          <div className="dimensionless-section">
            <div className="cd-section-head">
              <span className="cd-section-title">Multi-Gravity Roper Comparison</span>
              <span className="cd-section-badge">0g – 3g</span>
            </div>
            <svg
              id="roper-lab-svg"
              viewBox="0 0 284 114"
              width="100%"
              height="114"
              aria-label="Multi-gravity flame scaling comparison chart"
            />
          </div>
        </div>
      </aside>

      {/* Right Dock: Simulation Parameters & Apparatus Selector */}
      <aside id="right-dock-container" className="dock-container dock-right">
        <div className="controls-panel">
          <div className="panel-header">
            <h2>Solver Parameters</h2>
            <span className="cd-section-badge">64x64x64 CFD</span>
          </div>

          <div className="cd-chip-row">
            <button type="button" className="apparatus-pill-btn active" data-shape="candle">
              Candle
            </button>
            <button type="button" className="apparatus-pill-btn" data-shape="circle">
              Cylindrical
            </button>
            <button type="button" className="apparatus-pill-btn" data-shape="droplet">
              Droplet
            </button>
          </div>

          <div id="controls-panel" />
        </div>
      </aside>

      {/* Physics Reference Guide Modal */}
      <div id="physics-guide-modal" className="modal-overlay" role="dialog" aria-label="Combustion Physics Reference">
        <div className="modal-box" style={{ maxWidth: 680 }}>
          <div className="modal-header">
            <h2>Multi-Gravity Combustion Physics Guide</h2>
            <button type="button" id="btn-close-guide" className="nasa-modal-close" aria-label="Close modal">
              x
            </button>
          </div>
          <div className="modal-body-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="cd-chart-card">
              <span className="cd-section-title">Grashof (Gr) &amp; Rayleigh (Ra) Numbers</span>
              <p className="cd-section-hint">
                Gr = g · beta · dT · L^3 / nu^2 compares buoyant thermal lift to viscous damping. In Earth gravity (9.81 m/s2), high Gr drives an elongated teardrop plume. In ISS microgravity (0.00 g), Gr vanishes and molecular diffusion creates a cool, quasi-spherical flame.
              </p>
            </div>
            <div className="cd-chart-card">
              <span className="cd-section-title">Froude (Fr) &amp; Peclet (Pe) Numbers</span>
              <p className="cd-section-hint">
                Fr = u^2 / (g · L) weighs forced injection inertia against gravity, while Pe = u · L / alpha measures advective heat transport vs thermal diffusivity.
              </p>
            </div>
            <div className="cd-chart-card">
              <span className="cd-section-title">Keyboard Shortcuts</span>
              <p className="cd-section-hint">
                Press keys 1 through 6 to jump across gravity presets: 1 (0.0g ISS), 2 (0.165g Moon), 3 (0.38g Mars), 4 (1.0g Earth), 5 (2.5g Hypergravity), 6 (-1.0g Inverted).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
