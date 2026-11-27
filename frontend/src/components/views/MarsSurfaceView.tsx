'use client';

import React, { useEffect, useRef, useState } from 'react';
import SimulationTopBar from '../layout/SimulationTopBar';
import { MarsApp } from '../../mars/marsMain.js';

const MARS_SHORTCUTS = [
  { keys: ['W', 'A', 'S', 'D'], action: 'Traverse Jezero terrain' },
  { keys: ['Space', 'Shift'], action: 'Adjust camera altitude' },
  { keys: ['Drag'], action: 'Orbit planetary scene' },
  { keys: ['Scroll'], action: 'Zoom camera' },
];

type MarsTab = 'atmo' | 'combustion' | 'geology' | 'physics';

export default function MarsSurfaceView() {
  const appRef = useRef<MarsApp | null>(null);
  const [activeTab, setActiveTab] = useState<MarsTab>('atmo');

  useEffect(() => {
    const app = new MarsApp();
    appRef.current = app;
    return () => {
      app.destroy();
      appRef.current = null;
    };
  }, []);

  return (
    <div className="sim-viewport-page">
      <SimulationTopBar
        activeRoute="mars"
        envCode="MARS-0.38G"
        shortcuts={MARS_SHORTCUTS}
        showAuditBtn
        showHudToggleBtn
        showResetCamBtn
        showFullscreenBtn
      />

      <canvas id="canvas-mars" className="sim-canvas" />

      <button type="button" id="tab-reopen-hud" className="hud-reopen-tab">
        <span>Open Mars Telemetry</span>
      </button>

      {/* External Chamber Venting Control */}
      <div className="floating-env-widget">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span className="cd-kpi-label">Combustion Test Chamber</span>
          <div id="chamber-status-badge" className="chamber-status-badge sealed">
            <span className="status-dot online" />
            <span id="chamber-status-text">SEALED (21% O2 // 101.3 kPa)</span>
          </div>
        </div>
        <button type="button" id="btn-vent-chamber" className="chamber-vent-btn">
          <span id="btn-vent-label">Vent Chamber to Mars Air</span>
        </button>
      </div>

      {/* Bottom Camera Viewpoint Strip */}
      <div className="viewpoint-strip" role="toolbar" aria-label="Mars viewpoints">
        <button type="button" className="viewpoint-btn active" data-view="panorama">
          Panorama
        </button>
        <button type="button" className="viewpoint-btn" data-view="habitat">
          Habitat Dome
        </button>
        <button type="button" className="viewpoint-btn" data-view="combustion">
          Combustion Cell
        </button>
        <button type="button" className="viewpoint-btn" data-view="lander">
          Lander Site
        </button>
        <button type="button" className="viewpoint-btn" data-view="avionics">
          Avionics Bay
        </button>
        <button type="button" className="viewpoint-btn" data-view="crater">
          Jezero Rim
        </button>
      </div>

      {/* Left Collapsible Mars Surface Telemetry HUD */}
      <aside id="hud-mars-panel" className="hud-panel-unified">
        <div className="hud-panel-header">
          <div className="hud-panel-title-wrap">
            <span className="hud-panel-title">Jezero Crater Surface</span>
            <span className="hud-pill online">0.38 G</span>
          </div>
          <button
            type="button"
            id="btn-collapse-hud"
            className="hud-collapse-btn"
            title="Collapse HUD"
            aria-label="Collapse HUD"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </div>

        <div className="cd-tabs-header" role="tablist">
          <button
            type="button"
            className={`cd-tab-btn ${activeTab === 'atmo' ? 'active' : ''}`}
            onClick={() => setActiveTab('atmo')}
          >
            Atmosphere
          </button>
          <button
            type="button"
            className={`cd-tab-btn ${activeTab === 'combustion' ? 'active' : ''}`}
            onClick={() => setActiveTab('combustion')}
          >
            Combustion
          </button>
          <button
            type="button"
            className={`cd-tab-btn ${activeTab === 'geology' ? 'active' : ''}`}
            onClick={() => setActiveTab('geology')}
          >
            Environment
          </button>
          <button
            type="button"
            className={`cd-tab-btn ${activeTab === 'physics' ? 'active' : ''}`}
            onClick={() => setActiveTab('physics')}
          >
            Scaling
          </button>
        </div>

        <div className="cd-tabs-body">
          {activeTab === 'atmo' && (
            <div className="cd-tab-pane active">
              <div className="cd-kpi-row">
                <div className="cd-kpi-card">
                  <span className="cd-kpi-label">Ambient Pressure</span>
                  <span className="cd-kpi-val">0.636 kPa</span>
                  <span className="cd-kpi-sub">0.63% of Earth sea-level</span>
                </div>
                <div className="cd-kpi-card">
                  <span className="cd-kpi-label">Surface Gravity</span>
                  <span className="cd-kpi-val">3.72 m/s²</span>
                  <span className="cd-kpi-sub">0.38 g partial buoyancy</span>
                </div>
              </div>

              <div className="cd-chart-card">
                <div className="cd-section-head">
                  <span className="cd-section-title">Martian Gas Composition</span>
                  <span className="cd-section-badge">UNBREATHABLE</span>
                </div>
                <table className="cd-data-table">
                  <thead>
                    <tr>
                      <th>Species</th>
                      <th style={{ textAlign: 'right' }}>Molar %</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Carbon Dioxide (CO2)</td>
                      <td className="mono-cell">95.32%</td>
                    </tr>
                    <tr>
                      <td>Molecular Nitrogen (N2)</td>
                      <td className="mono-cell">2.70%</td>
                    </tr>
                    <tr>
                      <td>Argon (Ar)</td>
                      <td className="mono-cell">1.60%</td>
                    </tr>
                    <tr>
                      <td>Molecular Oxygen (O2)</td>
                      <td className="mono-cell">0.13%</td>
                    </tr>
                    <tr>
                      <td>Carbon Monoxide (CO)</td>
                      <td className="mono-cell">0.08%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="cd-alert-banner info">
                <span>
                  External Martian air cannot sustain hydrocarbon combustion. Only pressurized habitat chambers support open flame propagation.
                </span>
              </div>
            </div>
          )}

          {activeTab === 'combustion' && (
            <div className="cd-tab-pane active">
              <div className="cd-chart-card">
                <div className="cd-section-head">
                  <span className="cd-section-title">Sealed Chamber vs Ambient Vent</span>
                  <span className="cd-section-badge">CH4 / CELLULOSE</span>
                </div>
                <p className="cd-section-hint">
                  Use the top-right Combustion Test Chamber button to vent the rig to Jezero Crater air (0.636 kPa, 0.13% O2) and observe immediate hypoxic flame extinction.
                </p>
                <table className="cd-data-table">
                  <tbody>
                    <tr>
                      <td>Sealed habitat gas</td>
                      <td className="mono-cell">21% O2 / 101.3 kPa</td>
                    </tr>
                    <tr>
                      <td>Buoyancy ratio (g/g0)</td>
                      <td className="mono-cell">0.38x</td>
                    </tr>
                    <tr>
                      <td>Convective flow factor</td>
                      <td className="mono-cell">0.62x Earth</td>
                    </tr>
                    <tr>
                      <td>Vented ambient pO2</td>
                      <td className="mono-cell">0.0008 kPa</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="cd-chart-card">
                <span className="cd-section-title">Reduced-Gravity Flame Morphology</span>
                <p className="cd-section-hint">
                  At 0.38 g, natural convection velocities drop by approximately sqrt(0.38) = 0.616x relative to 1.00 g Earth, broadening the preheat zone and slowing opposing buoyant flicker.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'geology' && (
            <div className="cd-tab-pane active">
              <div className="cd-kpi-row">
                <div className="cd-kpi-card">
                  <span className="cd-kpi-label">Coordinates</span>
                  <span className="cd-kpi-val" style={{ fontSize: 15 }}>18.38 N</span>
                  <span className="cd-kpi-sub">77.58 E Jezero Delta</span>
                </div>
                <div className="cd-kpi-card">
                  <span className="cd-kpi-label">Mean Temp</span>
                  <span className="cd-kpi-val">-63 C</span>
                  <span className="cd-kpi-sub">Range -110 to +20 C</span>
                </div>
              </div>

              <div className="cd-chart-card">
                <span className="cd-section-title">Planetary Surface Conditions</span>
                <table className="cd-data-table">
                  <tbody>
                    <tr>
                      <td>Solar irradiance (top of atmo)</td>
                      <td className="mono-cell">590 W/m2</td>
                    </tr>
                    <tr>
                      <td>Dust optical depth (tau)</td>
                      <td className="mono-cell">0.45 nominal</td>
                    </tr>
                    <tr>
                      <td>Regolith thermal inertia</td>
                      <td className="mono-cell">290 J/m2/K/s0.5</td>
                    </tr>
                    <tr>
                      <td>Habitat internal shielding</td>
                      <td className="mono-cell">Kevlar + Water Wall</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'physics' && (
            <div className="cd-tab-pane active">
              <div className="cd-chart-card">
                <span className="cd-section-title">Mars vs Earth vs ISS Scaling</span>
                <table className="cd-data-table">
                  <thead>
                    <tr>
                      <th>Parameter</th>
                      <th style={{ textAlign: 'right' }}>ISS (0g)</th>
                      <th style={{ textAlign: 'right' }}>Mars (0.38g)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Grashof Gr / Gr_earth</td>
                      <td className="mono-cell">0.00</td>
                      <td className="mono-cell">0.38</td>
                    </tr>
                    <tr>
                      <td>Buoyant velocity</td>
                      <td className="mono-cell">0.00 m/s</td>
                      <td className="mono-cell">0.17 m/s</td>
                    </tr>
                    <tr>
                      <td>Radiation loss Share</td>
                      <td className="mono-cell">Dominant</td>
                      <td className="mono-cell">Mixed</td>
                    </tr>
                    <tr>
                      <td>Extinguish O2 limit</td>
                      <td className="mono-cell">~17.5%</td>
                      <td className="mono-cell">~15.8%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
