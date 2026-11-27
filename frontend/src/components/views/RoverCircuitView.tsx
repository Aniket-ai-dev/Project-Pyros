'use client';

import React, { useEffect, useRef, useState } from 'react';
import SimulationTopBar from '../layout/SimulationTopBar';
import { RoverApp } from '../../rover/RoverMain.js';

const ROVER_SHORTCUTS = [
  { keys: ['W', 'A', 'S', 'D'], action: 'Translate inside WEB bay' },
  { keys: ['Space', 'Shift'], action: 'Elevate / lower camera' },
  { keys: ['Drag'], action: 'Orbit avionics chassis' },
  { keys: ['Click'], action: 'Ray-select PCU / RCE / Battery' },
];

type RoverTab = 'timeline' | 'bus' | 'inspector';

export default function RoverCircuitView() {
  const appRef = useRef<RoverApp | null>(null);
  const [activeTab, setActiveTab] = useState<RoverTab>('timeline');

  useEffect(() => {
    const app = new RoverApp();
    appRef.current = app;
    return () => {
      app.destroy();
      appRef.current = null;
    };
  }, []);

  return (
    <div className="sim-viewport-page">
      <SimulationTopBar
        activeRoute="rover"
        envCode="WEB-FAULT"
        shortcuts={ROVER_SHORTCUTS}
        showAuditBtn
        showAudioBtn
        showScreenshotBtn
        showHudToggleBtn
        showResetCamBtn
        showFullscreenBtn
      />

      <canvas id="canvas-rover" className="sim-canvas" />

      <button type="button" id="tab-reopen-hud" className="hud-reopen-tab">
        <span>Open Avionics HUD</span>
      </button>

      {/* Right Top Floating Diagnostics Mode & FLIR Thermal Legend */}
      <div className="floating-env-widget">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
          <span className="cd-kpi-label">Rendering Diagnostic Mode</span>
          <div className="view-mode-switch">
            <button type="button" className="view-mode-btn active" data-mode="normal">
              Normal
            </button>
            <button type="button" className="view-mode-btn" data-mode="circuit">
              Circuit
            </button>
            <button type="button" className="view-mode-btn" data-mode="thermal">
              FLIR
            </button>
          </div>

          <div id="thermal-legend-panel" className="thermal-legend-box" style={{ display: 'none' }}>
            <div className="cd-section-head">
              <span className="cd-kpi-label">Ironbow IR Scale</span>
              <span className="cd-section-badge">C</span>
            </div>
            <div className="thermal-gradient-bar" />
            <div className="thermal-scale-labels">
              <span>20 C</span>
              <span>85 C</span>
              <span>150 C</span>
              <span>210+ C</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Camera Viewpoint Strip */}
      <div className="viewpoint-strip" role="toolbar" aria-label="Rover camera viewpoints">
        <button type="button" className="rover-cam-pill active" data-view="overview">
          Bay Overview
        </button>
        <button type="button" className="rover-cam-pill" data-view="pcu">
          PCU Q1-Q4
        </button>
        <button type="button" className="rover-cam-pill" data-view="regulator">
          Regulator
        </button>
        <button type="button" className="rover-cam-pill" data-view="thermal">
          Thermal Sweep
        </button>
        <button type="button" className="rover-cam-pill" data-view="rce">
          RAD750 CPU
        </button>
        <button type="button" className="rover-cam-pill" data-view="battery">
          Li-Ion Bus
        </button>
        <button type="button" className="rover-cam-pill" data-view="motor">
          Motor Drive
        </button>
        <button type="button" className="rover-cam-pill" data-view="comms">
          RF Link
        </button>
      </div>

      {/* Left Collapsible Avionics Fault HUD */}
      <aside id="hud-unified-panel" className="hud-panel-unified">
        <div className="hud-panel-header">
          <div className="hud-panel-title-wrap">
            <span className="hud-panel-title">Rover Warm Electronics Box</span>
            <span id="badge-contactor-status" className="status-tag tag-green">
              CLOSED (ENERGIZED)
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
            className={`cd-tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('timeline')}
          >
            Fault Timeline
          </button>
          <button
            type="button"
            className={`cd-tab-btn ${activeTab === 'bus' ? 'active' : ''}`}
            onClick={() => setActiveTab('bus')}
          >
            28V Power Bus
          </button>
          <button
            type="button"
            className={`cd-tab-btn ${activeTab === 'inspector' ? 'active' : ''}`}
            onClick={() => setActiveTab('inspector')}
          >
            Components
          </button>
        </div>

        <div className="cd-tabs-body">
          {/* Keep all panes mounted so RoverMain.js updates live values seamlessly */}
          <div className={`cd-tab-pane ${activeTab === 'timeline' ? 'active' : ''}`}>
            <div className="cd-control-card">
              <div className="cd-section-head">
                <span id="hud-stage-title" className="cd-section-title">
                  Stage 1: Nominal Avionics
                </span>
                <span id="hud-stage-badge" className="cd-trend-pill nominal">
                  NOMINAL
                </span>
              </div>
              <p id="hud-stage-desc" className="cd-section-hint">
                Primary 28V DC bus nominal at 28.1V, drawing 14.2A across steady traces.
              </p>

              <div className="stage-timeline-row">
                {[1, 2, 3, 4, 5, 6, 7].map((idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`stage-pill-btn ${idx === 1 ? 'active' : ''}`}
                    data-stage={idx}
                  >
                    S{idx}
                  </button>
                ))}
              </div>

              <div className="cd-slider-box">
                <div className="cd-slider-head">
                  <span className="label-text">Sequence scrubber</span>
                  <span id="sim-time-display" className="cd-slider-val">
                    T+0.0s // 35s
                  </span>
                </div>
                <input
                  type="range"
                  id="sim-timeline-slider"
                  className="cd-range"
                  min="0"
                  max="35"
                  step="0.1"
                  defaultValue="0"
                />
              </div>

              <div className="rover-transport-row">
                <div className="rover-transport-btns">
                  <button type="button" id="btn-step-prev" className="cd-mini-btn">
                    Prev
                  </button>
                  <button type="button" id="btn-play-pause" className="cd-mini-btn active">
                    <span>Pause</span>
                  </button>
                  <button type="button" id="btn-step-next" className="cd-mini-btn">
                    Next
                  </button>
                  <button type="button" id="btn-reset-sim" className="cd-mini-btn">
                    Reset
                  </button>
                </div>

                <div className="rover-transport-btns">
                  <button type="button" className="speed-btn" data-speed="0.5">
                    0.5x
                  </button>
                  <button type="button" className="speed-btn active" data-speed="1">
                    1x
                  </button>
                  <button type="button" className="speed-btn" data-speed="2">
                    2x
                  </button>
                </div>
              </div>
            </div>

            <div className="cd-chart-card">
              <div className="cd-section-head">
                <span className="cd-section-title">Fault Telemetry Curve (0–35 s)</span>
              </div>
              <svg id="rover-chart-svg" viewBox="0 0 316 112" width="100%" height="112" />
            </div>
          </div>

          <div className={`cd-tab-pane ${activeTab === 'bus' ? 'active' : ''}`}>
            <div className="cd-kpi-row">
              <div className="cd-kpi-card">
                <span className="cd-kpi-label">Bus Voltage</span>
                <span className="cd-kpi-val">
                  <span id="val-bus-voltage">28.1</span> V
                </span>
                <span className="cd-kpi-sub">28V MIL-STD DC rail</span>
              </div>
              <div className="cd-kpi-card">
                <span className="cd-kpi-label">Bus Current</span>
                <span className="cd-kpi-val">
                  <span id="val-bus-current">14.2</span> A
                </span>
                <span className="cd-kpi-sub">Trip limit: 40.0 A</span>
              </div>
              <div className="cd-kpi-card">
                <span className="cd-kpi-label">PCU Heatsink Temp</span>
                <span className="cd-kpi-val">
                  <span id="val-pcu-temp" style={{ color: '#3fb984' }}>
                    24.5
                  </span>{' '}
                  C
                </span>
                <span className="cd-kpi-sub">Max safe: 110 C</span>
              </div>
              <div className="cd-kpi-card">
                <span className="cd-kpi-label">Ambient Bay</span>
                <span className="cd-kpi-val">0.38 g</span>
                <span className="cd-kpi-sub">Natural convection</span>
              </div>
            </div>

            <div className="cd-chart-card">
              <span className="cd-section-title">Overcurrent Fault Isolation Physics</span>
              <p className="cd-section-hint">
                At 0.38 g inside the Warm Electronics Box, dust insulation stalls passive radiator rejection (Stage 2–3). Dielectric breakdown on Q1 creates short-circuit arcs (Stage 4–5) until autonomous fault protection opens solid-state contactors at T+30 s.
              </p>
            </div>
          </div>

          <div className={`cd-tab-pane ${activeTab === 'inspector' ? 'active' : ''}`}>
            <div className="cd-control-card">
              <span className="cd-section-title">Select Avionics Module</span>
              <div className="cd-chip-row">
                <button type="button" className="component-select-pill active" data-component="pcu">
                  PCU Power Stage
                </button>
                <button type="button" className="component-select-pill" data-component="rce">
                  RAD750 CPU
                </button>
                <button type="button" className="component-select-pill" data-component="battery">
                  Li-Ion Battery
                </button>
                <button type="button" className="component-select-pill" data-component="motor">
                  Motor Controller
                </button>
                <button type="button" className="component-select-pill" data-component="comms">
                  UHF / X-Band
                </button>
              </div>
            </div>

            <div className="comp-inspector-card">
              <div className="cd-section-head">
                <span id="comp-detail-name" className="cd-section-title">
                  Power Conditioning Unit (PCU)
                </span>
                <span id="comp-detail-status" className="status-tag tag-green">
                  NOMINAL
                </span>
              </div>
              <table className="cd-data-table">
                <tbody>
                  <tr>
                    <td>Surface Temp</td>
                    <td id="comp-detail-temp" className="mono-cell">
                      24.5 C
                    </td>
                  </tr>
                  <tr>
                    <td>Rail Voltage</td>
                    <td id="comp-detail-volt" className="mono-cell">
                      28.1 V
                    </td>
                  </tr>
                  <tr>
                    <td>Draw Current</td>
                    <td id="comp-detail-curr" className="mono-cell">
                      14.2 A
                    </td>
                  </tr>
                  <tr>
                    <td>Health Margin</td>
                    <td id="comp-detail-health" className="mono-cell">
                      100%
                    </td>
                  </tr>
                </tbody>
              </table>
              <p id="comp-detail-role" className="cd-section-hint">
                Primary 28V power regulation, battery charge management, and secondary DC-DC distribution.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
