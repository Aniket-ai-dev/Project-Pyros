'use client';

import React, { useEffect, useRef, useState } from 'react';
import SimulationTopBar from '../layout/SimulationTopBar';
import { MoonBaseApp } from '../../moon/moonMain.js';

const MOON_SHORTCUTS = [
  { keys: ['W', 'A', 'S', 'D'], action: 'Traverse lunar crater' },
  { keys: ['Space', 'Shift'], action: 'Adjust camera altitude' },
  { keys: ['Drag'], action: 'Orbit Ice Home base' },
  { keys: ['Scroll'], action: 'Zoom camera' },
];

type MoonTab = 'grid' | 'eclss' | 'luci';

export default function MoonBaseView() {
  const appRef = useRef<MoonBaseApp | null>(null);
  const [activeTab, setActiveTab] = useState<MoonTab>('grid');

  useEffect(() => {
    const app = new MoonBaseApp();
    appRef.current = app;
    return () => {
      app.destroy();
      appRef.current = null;
    };
  }, []);

  return (
    <div className="sim-viewport-page">
      <SimulationTopBar
        activeRoute="moon"
        envCode="LUNA-0.17G"
        shortcuts={MOON_SHORTCUTS}
        showAuditBtn
        showHudToggleBtn
        showResetCamBtn
        showFullscreenBtn
      />

      {/* Interactive WebGL Canvas (pointer-events enabled for OrbitControls) */}
      <canvas id="canvas-moon" className="sim-canvas" style={{ pointerEvents: 'auto' }} />

      <button type="button" id="tab-reopen-hud" className="hud-reopen-tab">
        <span>Open Lunar HUD</span>
      </button>

      {/* External LUCI Vacuum Chamber Control */}
      <div className="floating-env-widget">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span className="cd-kpi-label">LUCI Reduced-G Chamber</span>
          <div id="chamber-status-badge" className="chamber-status-badge sealed">
            <span className="status-dot online" />
            <span id="chamber-status-text">SEALED (21% O2 // 101.3 kPa)</span>
          </div>
        </div>
        <button type="button" id="btn-vent-chamber" className="chamber-vent-btn">
          <span id="btn-vent-label">Vent Chamber to Lunar Vacuum</span>
        </button>
      </div>

      {/* Bottom Camera Viewpoint Strip */}
      <div className="viewpoint-strip" role="toolbar" aria-label="Lunar base viewpoints">
        <button type="button" className="viewpoint-btn active" data-view="panorama">
          Panorama
        </button>
        <button type="button" className="viewpoint-btn" data-view="habitat">
          Ice Home Dome
        </button>
        <button type="button" className="viewpoint-btn" data-view="power">
          SOLA Power Grid
        </button>
        <button type="button" className="viewpoint-btn" data-view="combustion">
          LUCI Chamber
        </button>
      </div>

      {/* Left Collapsible Habitat Telemetry HUD */}
      <aside id="hud-moon-panel" className="hud-panel-unified">
        <div className="hud-panel-header">
          <div className="hud-panel-title-wrap">
            <span className="hud-panel-title">Shackleton Lunar Ice Home</span>
            <span id="moon-mode-badge" className="hud-pill online">
              NOMINAL
            </span>
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

        <div className="cd-tabs-header" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }} role="tablist">
          <button
            type="button"
            className={`cd-tab-btn ${activeTab === 'grid' ? 'active' : ''}`}
            onClick={() => setActiveTab('grid')}
          >
            Power Grid
          </button>
          <button
            type="button"
            className={`cd-tab-btn ${activeTab === 'eclss' ? 'active' : ''}`}
            onClick={() => setActiveTab('eclss')}
          >
            ECLSS &amp; Ice
          </button>
          <button
            type="button"
            className={`cd-tab-btn ${activeTab === 'luci' ? 'active' : ''}`}
            onClick={() => setActiveTab('luci')}
          >
            LUCI Physics
          </button>
        </div>

        <div className="cd-tabs-body">
          {/* Keep panes mounted so moonMain mode switchers update telemetry regardless of active tab */}
          <div className={`cd-tab-pane ${activeTab === 'grid' ? 'active' : ''}`}>
            <div className="cd-control-card">
              <div className="cd-section-head">
                <span className="cd-section-title">Habitat Simulation Mode</span>
                <span className="cd-section-badge">3D SCENE SYNC</span>
              </div>
              <div className="cd-chip-row">
                <button type="button" className="cd-mini-btn moon-mode-btn active" data-mode="normal">
                  Nominal
                </button>
                <button type="button" className="cd-mini-btn moon-mode-btn" data-mode="power">
                  Peak Solar
                </button>
                <button type="button" className="cd-mini-btn moon-mode-btn" data-mode="lifesupport">
                  Life Support
                </button>
                <button type="button" className="cd-mini-btn moon-mode-btn" data-mode="thermal">
                  Thermal Loop
                </button>
                <button type="button" className="cd-mini-btn moon-mode-btn" data-mode="emergency">
                  Emergency
                </button>
              </div>
            </div>

            <div className="cd-kpi-row">
              <div className="cd-kpi-card">
                <span className="cd-kpi-label">Solar Array Gen</span>
                <span id="moon-solar-kw" className="cd-kpi-val">
                  14.8 kW
                </span>
                <span className="cd-kpi-sub">SOLA rim illumination</span>
              </div>
              <div className="cd-kpi-card">
                <span className="cd-kpi-label">Habitat Draw</span>
                <span id="moon-load-kw" className="cd-kpi-val">
                  8.4 kW
                </span>
                <span className="cd-kpi-sub">Net surplus routing</span>
              </div>
              <div className="cd-kpi-card">
                <span className="cd-kpi-label">Regenerative FC</span>
                <span id="moon-battery-pct" className="cd-kpi-val">
                  94%
                </span>
                <span className="cd-kpi-sub">H2 / O2 storage reserve</span>
              </div>
              <div className="cd-kpi-card">
                <span className="cd-kpi-label">Ice Shield Temp</span>
                <span id="moon-ice-temp" className="cd-kpi-val">
                  -22.4 C
                </span>
                <span className="cd-kpi-sub">Water-ice membrane</span>
              </div>
            </div>

            <div className="cd-chart-card">
              <span className="cd-section-title">Lunar South Pole Environment</span>
              <table className="cd-data-table">
                <tbody>
                  <tr>
                    <td>Surface gravity</td>
                    <td className="mono-cell">1.62 m/s2 (0.165 g)</td>
                  </tr>
                  <tr>
                    <td>Ambient exosphere pressure</td>
                    <td className="mono-cell">3.0 x 10^-10 Pa</td>
                  </tr>
                  <tr>
                    <td>Sunlight availability (crater rim)</td>
                    <td className="mono-cell">86% annual</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className={`cd-tab-pane ${activeTab === 'eclss' ? 'active' : ''}`}>
            <div className="cd-chart-card">
              <div className="cd-section-head">
                <span className="cd-section-title">Radiation Shielding &amp; ECLSS</span>
                <span className="cd-section-badge">ICE SHELL</span>
              </div>
              <table className="cd-data-table">
                <tbody>
                  <tr>
                    <td>Habitat internal O2 pressure</td>
                    <td id="moon-o2-kpa" className="mono-cell">
                      21.3 kPa (21%)
                    </td>
                  </tr>
                  <tr>
                    <td>Total cabin pressure</td>
                    <td className="mono-cell">101.3 kPa (Nominal)</td>
                  </tr>
                  <tr>
                    <td>Water-ice shell thickness</td>
                    <td className="mono-cell">1.20 m frozen matrix</td>
                  </tr>
                  <tr>
                    <td>GCR dose attenuation</td>
                    <td className="mono-cell">-48% vs aluminum</td>
                  </tr>
                </tbody>
              </table>
              <p className="cd-section-hint">
                Hydrogen-rich water ice encapsulated in Vectran bladder pockets suppresses secondary neutron spallation from galactic cosmic rays and solar particle events while passively regulating thermal mass.
              </p>
            </div>
          </div>

          <div className={`cd-tab-pane ${activeTab === 'luci' ? 'active' : ''}`}>
            <div className="cd-chart-card">
              <div className="cd-section-head">
                <span className="cd-section-title">Lunar Combustion Investigation</span>
                <span className="cd-section-badge">0.165 G</span>
              </div>
              <p className="cd-section-hint">
                Buoyancy-driven convection at 0.165 g yields intermediate flame morphologies between Earth plumes and ISS spherical diffusion flames. Venting the test cell exposes active combustion to lunar hard vacuum, extinguishing flames in milliseconds.
              </p>
              <table className="cd-data-table">
                <tbody>
                  <tr>
                    <td>Buoyancy ratio (g/g0)</td>
                    <td className="mono-cell">0.165x Earth</td>
                  </tr>
                  <tr>
                    <td>Natural convection velocity</td>
                    <td className="mono-cell">0.11 m/s (0.41x Earth)</td>
                  </tr>
                  <tr>
                    <td>Exploration atmosphere target</td>
                    <td className="mono-cell">34% O2 / 56.5 kPa</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
