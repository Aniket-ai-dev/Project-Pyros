'use client';

import React, { useEffect, useRef } from 'react';
import { initVerticalControls } from '@/ui/VerticalControlsController';

const HTML_CONTENT = `<!-- =========================================================================
       PROJECT PYROS CINEMATIC DESTINATION NAVIGATOR (Modal Overlay)
       ========================================================================= -->
    <div id="pyros-main-menu" class="pyros-menu-overlay" style="display: none;">
    <div class="pyros-menu-backdrop"></div>
    <div class="pyros-menu-container">
      
      <!-- Top Brand Header -->
      <header class="pyros-menu-header">
        <div class="pyros-menu-badge">
          <span class="pyros-badge-dot"></span>
          <span>NASA PHYSICAL SCIENCES INFORMATICS // MISSION COMMAND</span>
        </div>
        <h1 class="pyros-menu-title">PROJECT PYROS</h1>
        <p class="pyros-menu-desc">Select an operational simulation environment to initiate exploration</p>
      </header>

      <!-- Scene Selection Cards Grid -->
      <div class="pyros-scenes-grid">

        <!-- SCENE 1: Space Station -->
        <div class="pyros-scene-card active" id="card-scene-station">
          <div class="scene-card-visual station-visual">
            <div class="scene-visual-badge active">
              <span class="live-dot"></span>
              <span>AVAILABLE NOW</span>
            </div>
            <!-- Station Module SVG Illustration -->
            <div class="scene-illustration">
              <svg width="120" height="80" viewBox="0 0 120 80" fill="none">
                <rect x="25" y="24" width="70" height="32" rx="16" fill="rgba(56, 189, 248, 0.12)" stroke="#38bdf8" stroke-width="2"/>
                <line x1="10" y1="40" x2="25" y2="40" stroke="#94a3b8" stroke-width="3"/>
                <line x1="95" y1="40" x2="110" y2="40" stroke="#94a3b8" stroke-width="3"/>
                <rect x="5" y="28" width="8" height="24" rx="2" fill="#64748b"/>
                <rect x="107" y="28" width="8" height="24" rx="2" fill="#64748b"/>
                <circle cx="60" cy="40" r="8" fill="rgba(56, 189, 248, 0.25)" stroke="#38bdf8" stroke-width="1.5"/>
                <circle cx="60" cy="40" r="3" fill="#38bdf8"/>
                <line x1="42" y1="24" x2="42" y2="56" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/>
                <line x1="78" y1="24" x2="78" y2="56" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/>
              </svg>
            </div>
          </div>
          <div class="scene-card-body">
            <div class="scene-header-meta">
              <span class="scene-tag">ORBITAL HABITAT // 0.00g</span>
              <span class="scene-version">v2.4 READY</span>
            </div>
            <h3 class="scene-name">Space Station Laboratory</h3>
            <p class="scene-summary">
              Explore the Destiny & Columbus pressurized module with interactive ECLSS atmosphere controls, microgravity candle flames, and the Microgravity Science Glovebox (MSG).
            </p>
            <div class="scene-features-pills">
              <span>- 3D Free Flight</span>
              <span>- ECLSS Controls</span>
              <span>- 22 NASA Missions</span>
            </div>
            <a href="/station" class="scene-launch-btn">
              <span>Launch Space Station</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
          </div>
        </div>

        <!-- SCENE 2: Mars Planet Surface (ACTIVE) -->
        <div class="pyros-scene-card active" id="card-scene-mars" onclick="window.location.href='/mars'">
          <div class="scene-card-visual mars-visual">
            <div class="scene-visual-badge active" style="background: rgba(249, 115, 22, 0.15); border-color: rgba(249, 115, 22, 0.4); color: #fb923c;">
              <span class="live-dot" style="background: #f97316; box-shadow: 0 0 6px #f97316;"></span>
              <span>AVAILABLE NOW</span>
            </div>
            <div class="scene-illustration">
              <svg width="120" height="80" viewBox="0 0 120 80" fill="none">
                <ellipse cx="60" cy="48" rx="42" ry="16" fill="rgba(245, 158, 11, 0.12)" stroke="rgba(249, 115, 22, 0.45)" stroke-width="1.8"/>
                <path d="M30 48 Q 60 16, 90 48" fill="none" stroke="#f97316" stroke-width="2.2"/>
                <circle cx="60" cy="30" r="5" fill="#f97316" opacity="0.9"/>
              </svg>
            </div>
          </div>
          <div class="scene-card-body">
            <div class="scene-header-meta">
              <span class="scene-tag" style="color: #fb923c;">PLANETARY SURFACE // 0.38g</span>
              <span class="scene-version" style="color: #fb923c;">v1.0 READY</span>
            </div>
            <h3 class="scene-name">Mars Planet Surface</h3>
            <p class="scene-summary">
              Accurate Martian Jezero Crater terrain with iron-oxide dunes, impact basins, NASA Surveyor science lander, geodesic habitat dome, and 0.38g flame test chamber.
            </p>
            <div class="scene-features-pills">
              <span>- Jezero Crater Dunes</span>
              <span>- 0.38g Gravity</span>
              <span>- NASA Outpost</span>
              <span>- Dust Phenomena</span>
            </div>
            <a href="/mars" class="scene-launch-btn" style="background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%);">
              <span>Explore Mars Surface</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
          </div>
        </div>

        <!-- SCENE 3: Martian Rover Circuit Failure (CURRENT SCENE) -->
        <div class="pyros-scene-card active" id="card-scene-rover">
          <div class="scene-card-visual rover-visual" style="border-color: rgba(239, 68, 68, 0.5);">
            <div class="scene-visual-badge active" style="background: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.4); color: #f87171;">
              <span class="live-dot" style="background: #ef4444; box-shadow: 0 0 6px #ef4444;"></span>
              <span>EXPLORING NOW</span>
            </div>
            <div class="scene-illustration">
              <svg width="120" height="80" viewBox="0 0 120 80" fill="none">
                <rect x="22" y="16" width="76" height="48" rx="4" fill="rgba(16, 185, 129, 0.12)" stroke="#10b981" stroke-width="1.8"/>
                <rect x="32" y="24" width="22" height="18" rx="2" fill="rgba(239, 68, 68, 0.3)" stroke="#ef4444" stroke-width="1.5"/>
                <rect x="62" y="24" width="26" height="16" rx="2" fill="rgba(56, 189, 248, 0.2)" stroke="#38bdf8" stroke-width="1.2"/>
                <rect x="32" y="48" width="56" height="10" rx="2" fill="rgba(245, 158, 11, 0.2)" stroke="#f59e0b" stroke-width="1.2"/>
                <path d="M43 24v-8M75 24v-8M54 33h8M43 42v6" stroke="#fbbf24" stroke-width="1.2" stroke-linecap="round"/>
                <circle cx="43" cy="33" r="2.5" fill="#f87171"/>
                <path d="M41 33h4M43 31v4" stroke="#ffffff" stroke-width="1"/>
              </svg>
            </div>
          </div>
          <div class="scene-card-body">
            <div class="scene-header-meta">
              <span class="scene-tag" style="color: #f87171;">AVIONICS COMPARTMENT // 0.38g</span>
              <span class="scene-version" style="color: #f87171;">LIVE EXPLORATION</span>
            </div>
            <h3 class="scene-name">Rover Circuit Failure</h3>
            <p class="scene-summary">
              Inside the Warm Electronics Box (WEB): Martian dust cooling insulation, power controller thermal runaway, electrical arcing, and autonomous bus isolation.
            </p>
            <div class="scene-features-pills">
              <span>- 3D Avionics PCB</span>
              <span>- Thermal Runaway</span>
              <span>- Electrical Arcs</span>
              <span>- Auto-Isolation</span>
            </div>
            <button id="btn-resume-rover" class="scene-launch-btn" style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);">
              <span>Resume Rover Avionics</span>
              </button>
          </div>
        </div>

        <!-- SCENE 4: Moon Base (NEW / AVAILABLE NOW) -->
        <div class="pyros-scene-card active" id="card-scene-moon" onclick="window.location.href='/moon'">
          <div class="scene-card-visual" style="background: radial-gradient(circle at center, rgba(148, 163, 184, 0.25) 0%, rgba(15, 23, 42, 0.9) 100%); border-color: rgba(56, 189, 248, 0.4);">
            <div class="scene-visual-badge active" style="background: rgba(56, 189, 248, 0.15); border-color: rgba(56, 189, 248, 0.4); color: #38bdf8;">
              <span class="live-dot" style="background: #38bdf8; box-shadow: 0 0 6px #38bdf8;"></span>
              <span>AVAILABLE NOW</span>
            </div>
            <div class="scene-illustration">
              <svg width="120" height="80" viewBox="0 0 120 80" fill="none">
                <path d="M15 62 Q 60 48, 105 62" stroke="#94a3b8" stroke-width="2" fill="none"/>
                <circle cx="32" cy="24" r="10" fill="#0284c7" stroke="#38bdf8" stroke-width="1.2"/>
                <circle cx="34" cy="22" r="3" fill="#22c55e" opacity="0.8"/>
                <rect x="52" y="38" width="16" height="20" rx="3" fill="rgba(226, 232, 240, 0.3)" stroke="#e2e8f0" stroke-width="1.5"/>
                <ellipse cx="60" cy="38" rx="6" ry="4" fill="#38bdf8" opacity="0.8"/>
                <line x1="76" y1="36" x2="98" y2="36" stroke="#38bdf8" stroke-width="2.5"/>
                <line x1="87" y1="36" x2="87" y2="58" stroke="#64748b" stroke-width="1.5"/>
              </svg>
            </div>
          </div>
          <div class="scene-card-body">
            <div class="scene-header-meta">
              <span class="scene-tag" style="color: #38bdf8;">LUNAR OUTPOST // 0.166g</span>
              <span class="scene-version" style="color: #38bdf8;">v1.0 READY</span>
            </div>
            <h3 class="scene-name">Moon Base (NASA Ice Home)</h3>
            <p class="scene-summary">
              NASA Inflatable Ice Home on the Moon: Translucent quilted ice-composite radiation shield, two-story pressurized habitat, airlock vestibule, dual support modules, and LUCI 0.166g lunar combustion test stand.
            </p>
            <div class="scene-features-pills">
              <span>- NASA Ice Home</span>
              <span>- 0.166g Lunar Physics</span>
              <span>- Translucent Dome</span>
              <span>- Deep Space Sky</span>
            </div>
            <a href="/moon" class="scene-launch-btn" style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);">
              <span>Launch Moon Base</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
          </div>
        </div>

      </div>

      <!-- Menu Footer -->
      <footer class="pyros-menu-footer">
        <div class="menu-footer-left">
          <span>PROJECT PYROS // v2.4</span>
          <span class="dot">•</span>
          <span>NASA PSI Space Apps Challenge</span>
        </div>
        <div class="menu-footer-right">
          <span>3D WebGL PBR Engine Active</span>
          <span class="pulse-indicator"></span>
        </div>
      </footer>

      <!-- Floating Close Menu Button -->
      <button id="btn-close-main-menu" class="pyros-menu-close-btn" title="Back to Simulation">[CLOSE]</button>

    </div>
  </div>

  <!-- 3D Three.js WebGL Viewport Canvas -->
  <canvas id="canvas-rover"></canvas>

  <!-- TOP FLOATING DOCK (Clean, modern navbar) -->
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

      <button class="capsule-item rover-cam-pill active" data-view="overview" title="Full Enclosed Rover Electronic Box">
        <div class="capsule-item-icon"><svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="12" rx="2"/><circle cx="7" cy="19" r="2"/><circle cx="17" cy="19" r="2"/></svg></div>
        <span class="capsule-item-label">Overview</span>
      </button>

      <button class="capsule-item rover-cam-pill" data-view="pcu" title="Power Conditioning Unit">
        <div class="capsule-item-icon"><svg viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></div>
        <span class="capsule-item-label">PCU</span>
      </button>

      <button class="capsule-item rover-cam-pill" data-view="regulator" title="28V Bus Regulator">
        <div class="capsule-item-icon"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg></div>
        <span class="capsule-item-label">Regulator</span>
      </button>

      <button class="capsule-item rover-cam-pill" data-view="thermal" title="Thermal Sensors Array">
        <div class="capsule-item-icon"><svg viewBox="0 0 24 24"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg></div>
        <span class="capsule-item-label">Thermal</span>
      </button>

      <button id="btn-toggle-audio" class="capsule-item active" title="Toggle Sound">
        <div class="capsule-item-icon"><svg viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg></div>
        <span class="capsule-item-label">Audio</span>
      </button>

      <button id="btn-criteria-audit" class="capsule-item" title="Criteria Audit">
        <div class="capsule-item-icon"><svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg></div>
        <span class="capsule-item-label">Audit</span>
      </button>

      <button id="btn-toggle-hud" class="capsule-item active" title="Toggle HUD Controls Panel">
        <div class="capsule-item-icon"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg></div>
        <span class="capsule-item-label">HUD</span>
      </button>

      <button id="btn-screenshot" class="capsule-item" title="Capture Screenshot">
        <div class="capsule-item-icon"><svg viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg></div>
        <span class="capsule-item-label">Snap</span>
      </button>

      <button id="btn-fullscreen" class="capsule-item" title="Fullscreen">
        <div class="capsule-item-icon"><svg viewBox="0 0 24 24"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg></div>
        <span class="capsule-item-label">Full</span>
      </button>
    </div>
  </header>

  <!-- =========================================================================
       UNIFIED AVIONICS HUD PANEL (Left side)
       ========================================================================= -->
  <aside id="hud-unified-panel" class="cd-unified-panel">
    
    <!-- Panel Header: Title + Collapse Button -->
    <div class="cd-panel-head-bar">
      <div class="cd-panel-title-wrap">
        <span class="cd-panel-chip" style="background: rgba(239, 68, 68, 0.12); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.28);">MARTIAN ROVER // WEB</span>
        <h2 class="cd-panel-heading">Avionics Failure Simulation</h2>
      </div>
      <button id="btn-collapse-hud" class="cd-panel-close-btn" title="Minimize Panel">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
    </div>

    <!-- Scrollable Panel Content -->
    <div class="cd-tab-scroll-wrap">

      <!-- CARD 1: 7-STAGE CHRONOLOGICAL TIMELINE & CONTROLS -->
      <section class="cd-card rover-timeline-card" style="border-top: 3px solid #3b82f6;">
        <div class="cd-card-head">
          <div class="cd-card-title-wrap">
            <h3 class="cd-card-title">Avionics Sequence Timeline</h3>
            <span id="hud-stage-title" class="cd-card-caption">Stage 1: Normal Operations</span>
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <span id="sim-time-display" class="timeline-time-display">T+0.0s // 35s</span>
            <span id="hud-stage-badge" class="cd-trend-pill success">NOMINAL</span>
          </div>
        </div>

        <p id="hud-stage-desc" class="timeline-desc">
          All avionics systems nominal. Primary 28V DC bus operating at 28.1V, drawing 14.2A. Steady current flow along bus traces. Power Conditioning Unit operating at nominal 24.5°C.
        </p>

        <!-- Stage Pill Quick Jump Grid -->
        <div class="stage-pills-grid">
          <button class="stage-pill-btn active" data-stage="1">1 Normal</button>
          <button class="stage-pill-btn" data-stage="2">2 Stress</button>
          <button class="stage-pill-btn" data-stage="3">3 Overheat</button>
          <button class="stage-pill-btn" data-stage="4">4 Fault</button>
          <button class="stage-pill-btn" data-stage="5">5 Fire</button>
          <button class="stage-pill-btn" data-stage="6">6 Cascade</button>
          <button class="stage-pill-btn" data-stage="7">7 Safe Mode</button>
        </div>

        <!-- Custom Scrubber Slider -->
        <div class="timeline-slider-wrap">
          <input type="range" id="sim-timeline-slider" class="rover-timeline-range" min="0" max="35" step="0.1" value="0">
        </div>

        <!-- Controls Row -->
        <div class="timeline-controls-row">
          <div class="timeline-btn-group">
            <button id="btn-step-prev" class="timeline-ctrl-btn" title="Previous Stage">◀ Step</button>
            <button id="btn-play-pause" class="timeline-ctrl-btn primary" title="Play / Pause">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
              <span>Pause</span>
            </button>
            <button id="btn-step-next" class="timeline-ctrl-btn" title="Next Stage">Step ▶</button>
            <button id="btn-reset-sim" class="timeline-ctrl-btn" title="Reset Simulation">↺</button>
          </div>

          <div class="speed-btn-group">
            <button class="speed-btn" data-speed="0.5">0.5x</button>
            <button class="speed-btn active" data-speed="1.0">1.0x</button>
            <button class="speed-btn" data-speed="2.0">2.0x</button>
          </div>
        </div>
      </section>

      <!-- CARD 2: 28V PRIMARY BUS ELECTRICAL TELEMETRY -->
      <section class="cd-card" style="border-top: 3px solid #10b981;">
        <div class="cd-card-head">
          <div class="cd-card-title-wrap">
            <h3 class="cd-card-title">28V Primary Power Bus</h3>
            <span class="cd-card-caption">EPS Main Electrical Distribution</span>
          </div>
          <span id="badge-contactor-status" class="status-tag tag-green">CLOSED (ENERGIZED)</span>
        </div>

        <div class="comp-metrics-grid">
          <div class="comp-metric-cell">
            <div class="comp-metric-label">Bus Voltage</div>
            <div class="comp-metric-value"><span id="val-bus-voltage">28.1</span> <span class="comp-metric-unit">V</span></div>
          </div>
          <div class="comp-metric-cell">
            <div class="comp-metric-label">Bus Current Draw</div>
            <div class="comp-metric-value"><span id="val-bus-current">14.2</span> <span class="comp-metric-unit">A</span></div>
          </div>
          <div class="comp-metric-cell">
            <div class="comp-metric-label">PCU Epicenter Temp</div>
            <div class="comp-metric-value"><span id="val-pcu-temp" style="color: #ef4444;">24.5</span> <span class="comp-metric-unit">°C</span></div>
          </div>
          <div class="comp-metric-cell">
            <div class="comp-metric-label">Mars Gravity</div>
            <div class="comp-metric-value">0.38 <span class="comp-metric-unit">g</span></div>
          </div>
        </div>
      </section>

      <!-- CARD 3: INTERACTIVE COMPONENT INSPECTOR -->
      <section class="cd-card" style="border-top: 3px solid #818cf8;">
        <div class="cd-card-head">
          <div class="cd-card-title-wrap">
            <h3 class="cd-card-title">Component Inspector</h3>
            <span class="cd-card-caption">Click a component in 3D or select below</span>
          </div>
        </div>

        <!-- Subsystem Selector Pills -->
        <div class="component-selector-row">
          <button class="component-select-pill active" data-component="pcu">PCU</button>
          <button class="component-select-pill" data-component="rce">RCE (CPU)</button>
          <button class="component-select-pill" data-component="battery">Battery</button>
          <button class="component-select-pill" data-component="motor">Motors</button>
          <button class="component-select-pill" data-component="comms">Telecom</button>
        </div>

        <!-- Component Detail Box -->
        <div class="comp-detail-box">
          <div class="comp-detail-header">
            <span id="comp-detail-name" class="comp-detail-title">Power Conditioning Unit (PCU)</span>
            <span id="comp-detail-status" class="status-tag tag-green">NOMINAL</span>
          </div>

          <div class="comp-metrics-grid">
            <div class="comp-metric-cell">
              <div class="comp-metric-label">Junction Temp</div>
              <div id="comp-detail-temp" class="comp-metric-value">24.5 °C</div>
            </div>
            <div class="comp-metric-cell">
              <div class="comp-metric-label">Operating Rail</div>
              <div id="comp-detail-volt" class="comp-metric-value">28.1 V</div>
            </div>
            <div class="comp-metric-cell">
              <div class="comp-metric-label">Branch Current</div>
              <div id="comp-detail-curr" class="comp-metric-value">14.2 A</div>
            </div>
            <div class="comp-metric-cell">
              <div class="comp-metric-label">Subsystem Health</div>
              <div id="comp-detail-health" class="comp-metric-value" style="color: #10b981;">100%</div>
            </div>
          </div>

          <p id="comp-detail-role" class="comp-role-text">
            Primary 28V power regulation, battery charge management, and secondary DC-DC distribution.
          </p>
        </div>
      </section>

    </div>
  </aside>

  <!-- =========================================================================
       THERMAL FLIR COLORBAR LEGEND (Bottom Right Floating)
       ========================================================================= -->
  <div id="thermal-legend-panel" class="thermal-legend-panel">
    <div class="thermal-legend-head">
      <span class="thermal-legend-title">NASA FLIR Thermal Heatmap</span>
      <span style="font-family: var(--font-mono); font-size: 10px; color: #38bdf8;">IRONBOW</span>
    </div>
    <div class="thermal-legend-bar"></div>
    <div class="thermal-legend-labels">
      <span>20°C</span>
      <span>64°C</span>
      <span>119°C</span>
      <span>185°C</span>
      <span>240°C+</span>
    </div>
  </div>

  <!-- Global Error Overlay (Protects against silent failures) -->
  <div id="pyros-global-error" style="display:none; position:fixed; bottom:24px; left:24px; z-index:999999; background:rgba(220,38,38,0.95); color:#fff; padding:12px 18px; border-radius:10px; font-family:monospace; font-size:12px; box-shadow:0 4px 20px rgba(0,0,0,0.5);"></div>
  <script>
    function showGlobalErr(msg) {
      const el = document.getElementById('pyros-global-error');
      if (el) {
        el.style.display = 'block';
        el.textContent = 'Runtime Error: ' + msg;
      }
      console.error(msg);
    }
    window.addEventListener('error', function(e) {
      showGlobalErr(e.message || (e.error && e.error.message) || e.error);
    });
    window.addEventListener('unhandledrejection', function(e) {
      showGlobalErr(e.reason && e.reason.message ? e.reason.message : e.reason);
    });
  </script>


  <!-- Vertical Collapsible Navigation & Flight Controls Menu (Right Side) -->
  <aside class="pyros-vertical-controls" aria-label="Flight & Camera Navigation Controls">
    <div class="controls-header">
      <div class="controls-title-group">
        <span class="controls-title-dot"></span>
        <span class="controls-title">Rover Controls</span>
      </div>
      <button class="controls-hide-btn" title="Hide controls (Press H)">[HIDE ⮞]</button>
    </div>
    <div class="controls-body">
      <div class="control-row">
        <div class="control-keys">
          <kbd class="key-cap">W</kbd>
          <kbd class="key-cap">A</kbd>
          <kbd class="key-cap">S</kbd>
          <kbd class="key-cap">D</kbd>
        </div>
        <span class="control-label">Navigate PCB</span>
      </div>
      <div class="control-row">
        <div class="control-keys">
          <kbd class="key-cap">Space</kbd>
          <kbd class="key-cap">Shift</kbd>
        </div>
        <span class="control-label">Elevation Up / Down</span>
      </div>
      <div class="control-row">
        <div class="control-keys">
          <kbd class="key-cap">Left Drag</kbd>
        </div>
        <span class="control-label">Orbit Chassis</span>
      </div>
      <div class="control-row">
        <div class="control-keys">
          <kbd class="key-cap">Right Drag</kbd>
        </div>
        <span class="control-label">Pan Circuit</span>
      </div>
      <div class="control-row">
        <div class="control-keys">
          <kbd class="key-cap">Scroll</kbd>
        </div>
        <span class="control-label">Zoom In / Out</span>
      </div>
    </div>
  </aside>

  <!-- Collapsed Right-Edge Floating Reopen Tab -->
  <button class="controls-reopen-tab" title="Show controls (Press H)">
    <span>⌨ CONTROLS</span>
    <span>⮜</span>
  </button>

  <!-- Application Entry Point -->`;

export default function RoverCircuitView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<any>(null);

  useEffect(() => {
    initVerticalControls();
    let isMounted = true;

    import('../../rover/roverMain.js')
      .then(({ RoverApp }) => {
        if (!isMounted) return;
        if (appRef.current) {
          appRef.current.destroy();
        }
        appRef.current = new RoverApp();
      })
      .catch((err) => console.error('Failed to init RoverApp:', err));

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
      className="clean-ui-body rover-body rover-view-root"
      dangerouslySetInnerHTML={{ __html: HTML_CONTENT }}
    />
  );
}
