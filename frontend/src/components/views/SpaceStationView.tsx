'use client';

import React, { useEffect, useRef } from 'react';
import SimulationTopBar from '../layout/SimulationTopBar';
import { SpaceStationApp } from '../../station/stationMain.js';

const STATION_SHORTCUTS = [
  { keys: ['W', 'A', 'S', 'D'], action: 'Translate through module' },
  { keys: ['Space', 'Shift'], action: 'Elevate / descend' },
  { keys: ['Drag'], action: 'Orbit cabin view' },
  { keys: ['Scroll'], action: 'Zoom in / out' },
  { keys: ['Click'], action: 'Inspect flame / louver' },
];

const CURATED_MISSIONS = [
  {
    id: 'ISS Baseline (Saffire-I)',
    badge: '0.00g // 21% O2',
    desc: 'Large-scale solid fuel flame spread across Cotton-Fiberglass in Destiny microgravity.',
    g: '0.00',
    o2: '21.0',
    psi: '14.7',
  },
  {
    id: 'BASS-II Solid Fuel',
    badge: '0.00g // 21% O2',
    desc: 'Opposed vs concurrent low-speed ventilation flame extinction limits in Microgravity Glovebox.',
    g: '0.00',
    o2: '21.0',
    psi: '14.7',
  },
  {
    id: 'ACME Cool Flame / FLEX-2',
    badge: '0.00g // 30% O2',
    desc: 'Spherical heptane droplet two-stage low-temperature combustion above Earth stoichiometric air.',
    g: '0.00',
    o2: '30.0',
    psi: '14.7',
  },
  {
    id: 'Artemis Exploration Atmosphere',
    badge: '0.16g // 34% O2',
    desc: 'Lunar Gateway / Habitat reduced pressure 8.2 psi enriched O2 flammability screening.',
    g: '0.16',
    o2: '34.0',
    psi: '8.2',
  },
  {
    id: 'Skylab / EVA Pure Oxygen',
    badge: '0.00g // 100% O2',
    desc: 'Low-pressure pure oxygen pre-breathe chamber test envelope (34.5 kPa total pressure).',
    g: '0.00',
    o2: '100.0',
    psi: '5.0',
  },
];

const O2_BAR_STEPS = [
  { step: 0, o2: 0, badge: '0% Vac', label: '0%', heightPct: 14 },
  { step: 1, o2: 11, badge: '11% Hyp', label: '11%', heightPct: 28 },
  { step: 2, o2: 21, badge: '+21% Nom', label: '21%', heightPct: 48 },
  { step: 3, o2: 32, badge: '32% EVA', label: '32%', heightPct: 68 },
  { step: 4, o2: 100, badge: '100% Pure', label: '100%', heightPct: 96 },
];

export default function SpaceStationView() {
  const appRef = useRef<SpaceStationApp | null>(null);

  useEffect(() => {
    const app = new SpaceStationApp();
    appRef.current = app;
    return () => {
      app.destroy();
      appRef.current = null;
    };
  }, []);

  return (
    <div className="sim-viewport-page">
      <SimulationTopBar
        activeRoute="station"
        envCode="ISS-0G"
        shortcuts={STATION_SHORTCUTS}
        showExplorerBtn
        showAuditBtn
        showHudToggleBtn
        showResetCamBtn
        showFullscreenBtn
      />

      {/* Fullscreen Three.js Canvas */}
      <canvas id="canvas-station" className="sim-canvas" />

      {/* Reopen Tab (shown when HUD is collapsed) */}
      <button type="button" id="tab-reopen-hud" className="hud-reopen-tab">
        <span>Open ECLSS HUD</span>
      </button>

      {/* Bottom Camera Viewpoint Strip */}
      <div className="viewpoint-strip" role="toolbar" aria-label="Station camera viewpoints">
        <button type="button" className="viewpoint-btn active" data-view="corridor">
          Corridor
        </button>
        <button type="button" className="viewpoint-btn" data-view="glovebox">
          Glovebox MSG
        </button>
        <button type="button" className="viewpoint-btn" data-view="candle">
          Flame Rig
        </button>
        <button type="button" className="viewpoint-btn" data-view="vents">
          ECLSS Louvers
        </button>
        <button type="button" className="viewpoint-btn" data-view="hatch">
          Crew Hatch
        </button>
      </div>

      {/* Left Collapsible Telemetry & Control HUD */}
      <aside id="hud-unified-panel" className="hud-panel-unified">
        <div className="hud-panel-header">
          <div className="hud-panel-title-wrap">
            <span className="hud-panel-title">ISS Destiny &amp; Columbus</span>
            <span id="nasa-backend-status-pill" className="hud-pill">
              EMBEDDED MODEL
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

        {/* 4 Navigation Tabs */}
        <div className="cd-tabs-header" role="tablist">
          <button type="button" role="tab" className="cd-tab-btn active" data-tab="tab-atmosphere">
            Atmosphere
          </button>
          <button type="button" role="tab" className="cd-tab-btn" data-tab="tab-missions">
            Missions
          </button>
          <button type="button" role="tab" className="cd-tab-btn" data-tab="tab-combustion">
            Combustion
          </button>
          <button type="button" role="tab" className="cd-tab-btn" data-tab="tab-scenario">
            Scenario SI
          </button>
        </div>

        <div className="cd-tabs-body">
          {/* TAB 1: ATMOSPHERE & ECLSS */}
          <div id="tab-atmosphere" className="cd-tab-pane active">
            <div className="cd-kpi-row">
              <div className="cd-kpi-card">
                <div className="cd-kpi-top">
                  <span className="cd-kpi-label">Cabin O2</span>
                  <span id="badge-o2-status-wrap" className="cd-trend-pill success">
                    <span id="o2-status-dot" className="status-dot online" />
                    <span id="badge-o2-status">NOMINAL</span>
                  </span>
                </div>
                <div id="hud-cell-o2-val" className="cd-kpi-val">
                  21.0%
                </div>
                <div id="hud-cell-po2-val" className="cd-kpi-sub">
                  pO2: 21.3 kPa
                </div>
              </div>

              <div className="cd-kpi-card">
                <div className="cd-kpi-top">
                  <span className="cd-kpi-label">Gravity Field</span>
                  <span className="cd-trend-pill info">
                    <span id="gravity-status-dot" className="status-dot online" />
                    <span id="badge-gravity-status">0.00 g</span>
                  </span>
                </div>
                <div id="hud-cell-gravity-val" className="cd-kpi-val">
                  0.00 g
                </div>
                <div id="hud-cell-gravity-sub" className="cd-kpi-sub">
                  Microgravity
                </div>
              </div>
            </div>

            {/* Dynamic N2 / O2 / Ar Gas Donut Composition */}
            <div className="cd-donut-card">
              <div className="cd-section-head">
                <span className="cd-section-title">Gas Composition</span>
                <span className="cd-section-badge">ECLSS MIX</span>
              </div>
              <div className="cd-donut-row">
                <div className="cd-donut-svg-wrap">
                  <svg viewBox="0 0 136 136" className="cd-donut-svg" aria-label="Cabin gas breakdown">
                    <circle
                      cx="68"
                      cy="68"
                      r="58"
                      fill="none"
                      stroke="rgba(236, 240, 246, 0.08)"
                      strokeWidth="12"
                    />
                    <circle
                      id="donut-segment-n2"
                      cx="68"
                      cy="68"
                      r="58"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="12"
                      strokeDasharray="284.6 364.4"
                      strokeDashoffset="0"
                    />
                    <circle
                      id="donut-segment-o2"
                      cx="68"
                      cy="68"
                      r="58"
                      fill="none"
                      stroke="#e5a03b"
                      strokeWidth="12"
                      strokeDasharray="76.5 364.4"
                      strokeDashoffset="-284.6"
                    />
                    <circle
                      id="donut-segment-trace"
                      cx="68"
                      cy="68"
                      r="58"
                      fill="none"
                      stroke="#3fb984"
                      strokeWidth="12"
                      strokeDasharray="3.3 364.4"
                      strokeDashoffset="-361.1"
                    />
                  </svg>
                  <div className="cd-donut-center">
                    <strong id="val-total-pressure-kpa">101.3 kPa</strong>
                    <span id="val-total-pressure-atm">1.00 atm</span>
                  </div>
                </div>

                <div className="cd-donut-legend">
                  <div className="cd-legend-item">
                    <span className="cd-legend-left">
                      <span className="cd-legend-dot" style={{ background: '#38bdf8' }} />
                      <span>N2 (<span id="val-n2-percent">78.1%</span>)</span>
                    </span>
                    <span id="val-n2-kpa" className="mono">79.1 kPa</span>
                  </div>
                  <div className="cd-legend-item">
                    <span className="cd-legend-left">
                      <span className="cd-legend-dot" style={{ background: '#e5a03b' }} />
                      <span>O2 (<span id="val-oxygen-percent-2">21%</span>)</span>
                    </span>
                    <span className="mono">
                      <span id="val-oxygen-po2-legend">21.3</span> kPa
                    </span>
                  </div>
                  <div className="cd-legend-item">
                    <span className="cd-legend-left">
                      <span className="cd-legend-dot" style={{ background: '#3fb984' }} />
                      <span>Ar (<span id="val-trace-percent">0.9%</span>)</span>
                    </span>
                    <span id="val-trace-kpa" className="mono">0.9 kPa</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Oxygen Control & Envelope Alert */}
            <div className="cd-control-card">
              <div className="cd-slider-box">
                <div className="cd-slider-head">
                  <span className="label-text">Oxygen fraction (%)</span>
                  <span className="cd-slider-val">
                    <span id="val-oxygen-percent">21.0</span>%
                  </span>
                </div>
                <input
                  type="range"
                  id="slider-station-oxygen"
                  className="cd-range"
                  min="0"
                  max="100"
                  step="0.5"
                  defaultValue="21.0"
                />
              </div>

              <div className="cd-chip-row">
                <button type="button" className="o2-preset-btn" data-o2="0">
                  0% Vac
                </button>
                <button type="button" className="o2-preset-btn" data-o2="11">
                  11% Hyp
                </button>
                <button type="button" className="o2-preset-btn active" data-o2="21">
                  21% Air
                </button>
                <button type="button" className="o2-preset-btn" data-o2="32">
                  32% EVA
                </button>
                <button type="button" className="o2-preset-btn" data-o2="100">
                  100% O2
                </button>
              </div>

              <div className="cd-bar-chart-row">
                {O2_BAR_STEPS.map((b) => (
                  <button
                    type="button"
                    key={b.step}
                    className={`cd-bar-col ${b.step === 2 ? 'active' : ''}`}
                    data-step={b.step}
                    data-o2={b.o2}
                  >
                    <span className="cd-bar-badge">{b.badge}</span>
                    <div className="cd-bar-fill" style={{ height: `${b.heightPct}%` }} />
                    <span className="cd-bar-label">{b.label}</span>
                  </button>
                ))}
              </div>

              <div id="o2-alert-banner" className="o2-alert-banner nominal">
                <span id="o2-alert-text">
                  Atmosphere nominal: Life support active at 101.3 kPa sea-level equivalent.
                </span>
              </div>
            </div>

            {/* ECLSS Mechanical Telemetry */}
            <div className="cd-chart-card">
              <div className="cd-section-head">
                <span className="cd-section-title">ECLSS Hardware &amp; Flammability</span>
              </div>
              <table className="cd-data-table">
                <tbody>
                  <tr>
                    <td>Partial pressure pO2</td>
                    <td id="val-oxygen-po2" className="mono-cell">
                      21.3 kPa
                    </td>
                  </tr>
                  <tr>
                    <td>Oxidizer index</td>
                    <td id="val-flammability-index" className="mono-cell">
                      Phi = 0.21
                    </td>
                  </tr>
                  <tr>
                    <td>LOI margin (17.5% ref)</td>
                    <td id="val-loi-margin" className="mono-cell">
                      +3.5% vs LOI
                    </td>
                  </tr>
                  <tr>
                    <td>Louver aperture</td>
                    <td id="val-vent-aperture" className="mono-cell">
                      45 deg
                    </td>
                  </tr>
                  <tr>
                    <td>Turbine speed</td>
                    <td id="val-vent-rpm" className="mono-cell">
                      2,400 RPM
                    </td>
                  </tr>
                  <tr>
                    <td>O2 mass flow</td>
                    <td id="val-vent-flow" className="mono-cell">
                      28.4 L/min
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Artificial Gravity & Cabin State */}
            <div className="cd-control-card">
              <div className="cd-slider-box">
                <div className="cd-slider-head">
                  <span className="label-text">Centrifugal / artificial gravity</span>
                  <span className="cd-slider-val">
                    <span id="val-gravity-g">0.00</span> g
                  </span>
                </div>
                <input
                  type="range"
                  id="slider-station-gravity"
                  className="cd-range"
                  min="0"
                  max="2.0"
                  step="0.01"
                  defaultValue="0.0"
                />
              </div>

              <div className="cd-chip-row">
                <button type="button" className="gravity-preset-btn active" data-g="0.00">
                  0.00g
                </button>
                <button type="button" className="gravity-preset-btn" data-g="0.17">
                  0.17g
                </button>
                <button type="button" className="gravity-preset-btn" data-g="0.38">
                  0.38g
                </button>
                <button type="button" className="gravity-preset-btn" data-g="1.00">
                  1.00g
                </button>
                <button type="button" className="gravity-preset-btn" data-g="1.50">
                  1.50g
                </button>
              </div>

              <div className="cd-sub-row">
                <span>Cabin payloads</span>
                <div className="cd-chip-row">
                  <button type="button" id="btn-nudge-objects" className="cd-mini-btn">
                    Impulse
                  </button>
                  <button type="button" id="btn-reset-objects" className="cd-mini-btn">
                    Reset Objects
                  </button>
                </div>
              </div>

              <div className="cd-sub-row">
                <span>Cabin lighting</span>
                <div className="cd-chip-row">
                  <button type="button" className="light-mode-btn active" data-mode="nominal">
                    Daylight
                  </button>
                  <button type="button" className="light-mode-btn" data-mode="sleep">
                    Night
                  </button>
                  <span id="pill-emergency-indicator" className="tag-pill badge-red" style={{ display: 'none' }}>
                    RED ALERT
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* TAB 2: NASA MISSIONS & PRESETS */}
          <div id="tab-missions" className="cd-tab-pane">
            <div className="mission-active-card">
              <div className="cd-section-head">
                <span className="cd-section-title">Active Investigation</span>
                <span className="cd-section-badge">LOADED</span>
              </div>
              <div id="active-mission-name" className="mission-active-name">
                ISS Baseline (Saffire-I)
              </div>
              <div id="active-mission-desc" className="mission-active-desc">
                0.00g ISS Zero-G // 21.0% O2 // 14.7 psi nominal cabin environment.
              </div>
              <button
                type="button"
                id="btn-browse-22-missions"
                className="btn-secondary-inline"
                style={{ marginTop: 4 }}
              >
                Open Full 22-Investigation Archive
              </button>
            </div>

            <div className="cd-section-head">
              <span className="cd-section-title">Flight Benchmark Presets</span>
            </div>

            <div className="mission-scroll-list">
              {CURATED_MISSIONS.map((m, idx) => (
                <div
                  key={m.id}
                  className={`mission-item-card ${idx === 0 ? 'active' : ''}`}
                  data-mission={m.id}
                  data-g={m.g}
                  data-o2={m.o2}
                  data-psi={m.psi}
                >
                  <div className="mission-item-top">
                    <span className="mission-item-title">{m.id}</span>
                    <span className="mission-badge">{m.badge}</span>
                  </div>
                  <p className="cd-section-hint">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* TAB 3: COMBUSTION PHYSICS & ROPER SCALING */}
          <div id="tab-combustion" className="cd-tab-pane">
            <div className="cd-control-card">
              <div className="cd-section-head">
                <span className="cd-section-title">NASA Physics Bounds Engine</span>
                <span className="cd-section-badge">ROPER + GRASHOF</span>
              </div>

              <div className="cd-slider-box">
                <div className="cd-slider-head">
                  <span className="label-text">Target gravity</span>
                  <span className="cd-slider-val">
                    <span id="val-nasa-gravity">0.00</span> g
                  </span>
                </div>
                <input
                  type="range"
                  id="slider-nasa-gravity"
                  className="cd-range"
                  min="0"
                  max="2.0"
                  step="0.01"
                  defaultValue="0.0"
                />
              </div>

              <div className="cd-slider-box">
                <div className="cd-slider-head">
                  <span className="label-text">Target oxygen</span>
                  <span className="cd-slider-val">
                    <span id="val-nasa-o2">21.0</span>%
                  </span>
                </div>
                <input
                  type="range"
                  id="slider-nasa-o2"
                  className="cd-range"
                  min="5"
                  max="100"
                  step="0.5"
                  defaultValue="21.0"
                />
              </div>

              <div className="cd-slider-box">
                <div className="cd-slider-head">
                  <span className="label-text">Cabin pressure</span>
                  <span className="cd-slider-val">
                    <span id="val-nasa-pressure">14.7</span> psi
                  </span>
                </div>
                <input
                  type="range"
                  id="slider-nasa-pressure"
                  className="cd-range"
                  min="3"
                  max="20"
                  step="0.1"
                  defaultValue="14.7"
                />
              </div>

              <div className="cd-chip-row">
                <button type="button" className="nasa-preset-btn active" data-preset="iss">
                  ISS 0g
                </button>
                <button type="button" className="nasa-preset-btn" data-preset="moon">
                  Moon 34%
                </button>
                <button type="button" className="nasa-preset-btn" data-preset="mars">
                  Mars 0.38g
                </button>
                <button type="button" className="nasa-preset-btn" data-preset="eva">
                  EVA 100%
                </button>
                <button type="button" className="nasa-preset-btn" data-preset="cfig">
                  CFIG 85%
                </button>
                <button type="button" className="nasa-preset-btn" data-preset="earth">
                  Earth 1g
                </button>
              </div>
            </div>

            <div className="cd-kpi-row">
              <div className="cd-kpi-card">
                <span className="cd-kpi-label">Buoyancy ratio</span>
                <span id="nasa-metric-buoyancy" className="cd-kpi-val">
                  0.0%
                </span>
                <span className="cd-kpi-sub">Relative to Earth 1g</span>
              </div>
              <div className="cd-kpi-card">
                <span className="cd-kpi-label">Convective flow</span>
                <span className="cd-kpi-val">
                  <span id="nasa-metric-convection">0.000</span> m/s
                </span>
                <span className="cd-kpi-sub">Buoyancy induced</span>
              </div>
              <div className="cd-kpi-card">
                <span className="cd-kpi-label">O2 enhancement</span>
                <span id="nasa-metric-o2-factor" className="cd-kpi-val">
                  1.00x
                </span>
                <span className="cd-kpi-sub">vs 21% sea-level</span>
              </div>
              <div className="cd-kpi-card">
                <span className="cd-kpi-label">Est. flame height</span>
                <span className="cd-kpi-val">
                  <span id="nasa-metric-flame-height">28.5</span> mm
                </span>
                <span id="nasa-metric-flame-spread" className="cd-kpi-sub">
                  0.10 - 0.50 mm/s
                </span>
              </div>
            </div>

            {/* Dynamic Roper Curve Chart */}
            <div className="cd-chart-card">
              <div className="cd-section-head">
                <span className="cd-section-title">Roper Scaling Curve (0g - 2g)</span>
                <span className="cd-section-badge">LIVE CURVE</span>
              </div>
              <svg
                id="roper-chart-svg"
                viewBox="0 0 316 132"
                width="100%"
                height="132"
                aria-label="Roper flame height and convective velocity scaling curve"
              />
              <p className="cd-section-hint">
                As gravitational acceleration approaches zero, buoyant upward flow collapses. Oxygen transport relies on molecular diffusion, forming spherical soot shells with lower peak chemiluminescence in the CH* and C2* spectral bands.
              </p>
            </div>
          </div>

          {/* TAB 4: SCENARIO INTELLIGENCE (SI) */}
          <div id="tab-scenario" className="cd-tab-pane">
            <div className="cd-control-card">
              <div className="cd-section-head">
                <span className="cd-section-title">Scenario Intelligence</span>
                <span className="cd-section-badge">PSI RAG + BOUNDS</span>
              </div>
              <textarea
                id="scenario-text-input"
                className="scenario-input"
                placeholder="Describe target atmosphere, gravity, pressure, and fuel (e.g., Lunar habitat at 0.16g, 34% O2, 8.2 psi with polyimide wire insulation)..."
              />

              <div className="cd-chip-row">
                <button
                  type="button"
                  className="scenario-chip-btn"
                  data-scenario="Lunar habitat fire at 0.16g with 34% O2 at 8.2 psi burning polyimide insulation"
                >
                  Lunar 34% O2
                </button>
                <button
                  type="button"
                  className="scenario-chip-btn"
                  data-scenario="Mars surface sealed habitat at 0.38g with 21% O2 at 14.7 psi testing cotton cellulose"
                >
                  Mars 0.38g
                </button>
                <button
                  type="button"
                  className="scenario-chip-btn"
                  data-scenario="ISS microgravity 0.00g with 30% O2 enriched glovebox testing heptane droplet cool flame"
                >
                  ISS Cool Flame
                </button>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" id="btn-analyze-scenario" className="btn-analyze-primary">
                  <span id="btn-analyze-text">Analyze Scenario</span>
                </button>
                <button type="button" id="btn-clear-scenario" className="btn-secondary-inline">
                  Clear
                </button>
              </div>
            </div>

            {/* Loading state */}
            <div
              id="scenario-loading-state"
              className="scenario-result-card"
              style={{ display: 'none' }}
            >
              <div id="scenario-loading-title" className="cd-section-title">
                PROCESSING SCIENTIFIC SCENARIO...
              </div>
              <p id="scenario-loading-step" className="cd-section-hint">
                Querying NASA PSI knowledge base and deterministic physics bounds...
              </p>
              <div id="scenario-fast-fallback-wrap" style={{ display: 'none' }}>
                <button type="button" id="btn-force-offline-analysis" className="btn-secondary-inline">
                  Use Instant Embedded Synthesis
                </button>
              </div>
            </div>

            {/* Error state */}
            <div
              id="scenario-error-state"
              className="o2-alert-banner critical"
              style={{ display: 'none', flexDirection: 'column', alignItems: 'flex-start' }}
            >
              <strong id="scenario-error-title">Analysis Unavailable</strong>
              <span id="scenario-error-desc">Using local NASA model fallback.</span>
            </div>

            {/* Results container */}
            <div
              id="scenario-results-container"
              style={{ display: 'none', flexDirection: 'column', gap: 10 }}
            >
              <div id="scenario-sim-status-banner" className="sim-status-banner" style={{ display: 'none' }}>
                <span id="sim-status-dot" className="sim-status-dot" />
                <span id="sim-status-text">Scenario ready for 3D simulation</span>
              </div>

              <button type="button" id="btn-simulate-scenario" className="btn-simulate-cta" disabled>
                <span id="sim-btn-label">SIMULATE SCENARIO</span>
                <span id="sim-btn-badge" className="tag-pill">
                  STANDBY
                </span>
              </button>

              <div id="scenario-sim-warning-container" style={{ display: 'none' }} />

              <div id="scenario-target-conditions-card" className="scenario-result-card">
                <div className="cd-section-head">
                  <span className="cd-section-title">Extracted Target Conditions</span>
                  <span id="res-extraction-badge" className="tag-pill-sm tag-cyan">
                    EMBEDDED NASA MODEL
                  </span>
                </div>
                <div className="cd-kpi-row">
                  <div className="cd-kpi-card">
                    <span className="cd-kpi-label">Gravity</span>
                    <span id="res-target-gravity" className="cd-kpi-val">
                      0.00 g
                    </span>
                    <span id="res-target-gravity-sub" className="cd-kpi-sub">
                      Microgravity
                    </span>
                  </div>
                  <div className="cd-kpi-card">
                    <span className="cd-kpi-label">Oxygen</span>
                    <span id="res-target-o2" className="cd-kpi-val">
                      21.0%
                    </span>
                    <span id="res-target-o2-sub" className="cd-kpi-sub">
                      Normoxic
                    </span>
                  </div>
                  <div className="cd-kpi-card">
                    <span className="cd-kpi-label">Pressure</span>
                    <span id="res-target-pressure" className="cd-kpi-val">
                      14.7 psi
                    </span>
                    <span id="res-target-pressure-sub" className="cd-kpi-sub">
                      101.3 kPa
                    </span>
                  </div>
                  <div className="cd-kpi-card">
                    <span className="cd-kpi-label">Target fuel</span>
                    <span id="res-target-fuel" className="cd-kpi-sub" style={{ color: 'var(--text-primary)' }}>
                      Solid material
                    </span>
                  </div>
                </div>
              </div>

              <div id="scenario-physics-bounds-card" className="scenario-result-card">
                <span className="cd-section-title">Deterministic Physics Bounds</span>
                <div id="scenario-physics-bounds-list" />
              </div>

              <div
                id="scenario-missing-extrapolation-card"
                className="scenario-result-card"
                style={{ display: 'none' }}
              >
                <div className="missing-title cd-section-title" />
                <p className="missing-desc cd-section-hint" />
              </div>

              <div className="scenario-result-card">
                <span className="cd-section-title">Scientific Synthesis</span>
                <p id="res-combined-insight" className="insight-body-text" />
                <div id="wrap-res-gap-analysis" style={{ display: 'none' }}>
                  <span className="cd-section-title">Research Gaps</span>
                  <p id="res-gap-analysis" className="insight-body-text" />
                </div>
                <div id="wrap-res-recommendations" style={{ display: 'none' }}>
                  <span className="cd-section-title">Recommendations</span>
                  <ul id="res-recommendations-list" style={{ paddingLeft: 16, fontSize: 12, color: 'var(--text-secondary)' }} />
                </div>
              </div>

              <div className="scenario-result-card">
                <div className="cd-section-head">
                  <span className="cd-section-title">NASA Precedents</span>
                  <span id="res-ranked-count" className="tag-pill">
                    0 PRECEDENTS
                  </span>
                </div>
                <div id="res-investigations-list" style={{ display: 'flex', flexDirection: 'column', gap: 6 }} />
                <div id="wrap-res-sources" className="cd-chip-row" style={{ display: 'none' }}>
                  <div id="res-sources-chips" className="cd-chip-row" />
                </div>
              </div>

              <div className="scenario-result-card">
                <div className="cd-section-head">
                  <span className="cd-section-title">Confidence &amp; Caveats</span>
                  <span id="res-confidence-badge" className="tag-pill badge-cyan">
                    MEDIUM CONFIDENCE
                  </span>
                </div>
                <p id="res-confidence-text" className="cd-section-hint" />
                <div id="wrap-res-caveats" style={{ display: 'none' }}>
                  <ul id="res-caveats-list" style={{ paddingLeft: 16, fontSize: 11, color: 'var(--text-muted)' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
