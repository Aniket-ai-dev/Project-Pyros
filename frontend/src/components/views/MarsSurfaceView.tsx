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
              Explore the Destiny & Columbus pressurized module with interactive ECLSS atmosphere controls, microgravity
              candle flames, and the Microgravity Science Glovebox (MSG).
            </p>
            <div class="scene-features-pills">
              <span>- 3D Free Flight</span>
              <span>- ECLSS Controls</span>
              <span>- 22 NASA Missions</span>
            </div>
            <a href="/station" class="scene-launch-btn">
              <span>Launch Space Station</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>

        <!-- SCENE 2: Mars Planet Surface (CURRENT SCENE) -->
        <div class="pyros-scene-card active" id="card-scene-mars">
          <div class="scene-card-visual mars-visual" style="border-color: rgba(249, 115, 22, 0.5);">
            <div class="scene-visual-badge active"
              style="background: rgba(249, 115, 22, 0.15); border-color: rgba(249, 115, 22, 0.4); color: #fb923c;">
              <span class="live-dot" style="background: #f97316; box-shadow: 0 0 6px #f97316;"></span>
              <span>EXPLORING NOW</span>
            </div>
            <div class="scene-illustration">
              <svg width="120" height="80" viewBox="0 0 120 80" fill="none">
                <ellipse cx="60" cy="48" rx="42" ry="16" fill="rgba(245, 158, 11, 0.12)"
                  stroke="rgba(249, 115, 22, 0.45)" stroke-width="1.8" />
                <path d="M30 48 Q 60 16, 90 48" fill="none" stroke="#f97316" stroke-width="2.2" />
                <circle cx="60" cy="30" r="5" fill="#f97316" opacity="0.9" />
              </svg>
            </div>
          </div>
          <div class="scene-card-body">
            <div class="scene-header-meta">
              <span class="scene-tag" style="color: #fb923c;">PLANETARY SURFACE // 0.38g</span>
              <span class="scene-version" style="color: #fb923c;">LIVE EXPLORATION</span>
            </div>
            <h3 class="scene-name">Mars Planet Surface</h3>
            <p class="scene-summary">
              Accurate Martian Jezero Crater terrain with iron-oxide dunes, impact basins, NASA Surveyor science lander,
              geodesic habitat dome, and 0.38g flame test chamber.
            </p>
            <div class="scene-features-pills">
              <span>- Jezero Crater Dunes</span>
              <span>- 0.38g Gravity</span>
              <span>- NASA Outpost</span>
              <span>- Dust Phenomena</span>
            </div>
            <button id="btn-resume-mars" class="scene-launch-btn"
              style="background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%);">
              <span>Resume Mars Surface</span>
              </button>
          </div>
        </div>

        <!-- SCENE 3: Martian Rover Circuit Failure (NEW / ACTIVE) -->
        <div class="pyros-scene-card active" id="card-scene-rover" onclick="window.location.href='/rover'">
          <div class="scene-card-visual rover-visual" style="border-color: rgba(239, 68, 68, 0.4);">
            <div class="scene-visual-badge active" style="background: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.4); color: #f87171;">
              <span class="live-dot" style="background: #ef4444; box-shadow: 0 0 6px #ef4444;"></span>
              <span>AVAILABLE NOW</span>
            </div>
            <div class="scene-illustration">
              <svg width="120" height="80" viewBox="0 0 120 80" fill="none">
                <!-- PCB Substrate -->
                <rect x="22" y="16" width="76" height="48" rx="4" fill="rgba(16, 185, 129, 0.12)" stroke="#10b981" stroke-width="1.8"/>
                <!-- Power Controller (Epicenter) -->
                <rect x="32" y="24" width="22" height="18" rx="2" fill="rgba(239, 68, 68, 0.3)" stroke="#ef4444" stroke-width="1.5"/>
                <!-- Flight Computer -->
                <rect x="62" y="24" width="26" height="16" rx="2" fill="rgba(56, 189, 248, 0.2)" stroke="#38bdf8" stroke-width="1.2"/>
                <!-- Battery Pack -->
                <rect x="32" y="48" width="56" height="10" rx="2" fill="rgba(245, 158, 11, 0.2)" stroke="#f59e0b" stroke-width="1.2"/>
                <!-- Gold Bus Traces -->
                <path d="M43 24v-8M75 24v-8M54 33h8M43 42v6" stroke="#fbbf24" stroke-width="1.2" stroke-linecap="round"/>
                <!-- Arc / Spark dot -->
                <circle cx="43" cy="33" r="2.5" fill="#f87171"/>
                <path d="M41 33h4M43 31v4" stroke="#ffffff" stroke-width="1"/>
              </svg>
            </div>
          </div>
          <div class="scene-card-body">
            <div class="scene-header-meta">
              <span class="scene-tag" style="color: #f87171;">AVIONICS COMPARTMENT // 0.38g</span>
              <span class="scene-version" style="color: #f87171;">v1.0 READY</span>
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
            <a href="/rover" class="scene-launch-btn" style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);">
              <span>Inspect Rover Electronics</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
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
          <span>NASA PSI Planetary Exploration</span>
        </div>
        <div class="menu-footer-right">
          <span>3D WebGL PBR Engine Active</span>
          <span class="pulse-indicator"></span>
        </div>
      </footer>

      <!-- Close Menu Button -->
      <button id="btn-close-main-menu" class="pyros-menu-close-btn" title="Back to Mars Surface">[CLOSE]</button>

    </div>
  </div>

  <!-- 3D Three.js WebGL Viewport Canvas -->
  <canvas id="canvas-mars"></canvas>

  <!-- TOP FLOATING DOCK (Clean, modern, aesthetic navbar) -->
    <!-- FLOATING SWIPEABLE CAPSULE NAVBAR (Reference Match) -->
  <header class="pyros-capsule-navbar">
    <a href="/" class="capsule-brand-circle" title="Project Pyros Home">
      <img src="/logo.png" alt="Project Pyros Logo" class="capsule-brand-logo" />
    </a>

    <div class="capsule-slide-track">
      <a href="/" class="capsule-item" title="Home Screen">
        <div class="capsule-item-icon"><svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>
        <span class="capsule-item-label">Home</span>
      </a>

      <button class="capsule-item viewpoint-btn active" data-view="panorama" title="Jezero Crater Dunes Panorama">
        <div class="capsule-item-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M16 8l-8 8"/></svg></div>
        <span class="capsule-item-label">Dunes</span>
      </button>

      <button class="capsule-item viewpoint-btn" data-view="lander" title="NASA Science Lander">
        <div class="capsule-item-icon"><svg viewBox="0 0 24 24"><path d="M12 2l3 7h6l-5 4 2 7-6-4-6 4 2-7-5-4h6z"/></svg></div>
        <span class="capsule-item-label">Lander</span>
      </button>

      <button class="capsule-item viewpoint-btn" data-view="habitat" title="Geodesic Hab Dome">
        <div class="capsule-item-icon"><svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 0 1 18 0v7H3v-7z"/></svg></div>
        <span class="capsule-item-label">Habitat</span>
      </button>

      <button class="capsule-item viewpoint-btn" data-view="avionics" title="NASA Telemetry & Avionics Module">
        <div class="capsule-item-icon"><svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><circle cx="12" cy="12" r="3"/></svg></div>
        <span class="capsule-item-label">Avionics</span>
      </button>

      <button id="btn-criteria-audit" class="capsule-item" title="Criteria Audit">
        <div class="capsule-item-icon"><svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg></div>
        <span class="capsule-item-label">Audit</span>
      </button>

      <button id="btn-reset-cam" class="capsule-item" title="Reset Camera View">
        <div class="capsule-item-icon"><svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg></div>
        <span class="capsule-item-label">Reset Cam</span>
      </button>

      <button id="btn-toggle-hud" class="capsule-item active" title="Toggle HUD Controls Panel">
        <div class="capsule-item-icon"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg></div>
        <span class="capsule-item-label">HUD</span>
      </button>

      <button id="btn-fullscreen" class="capsule-item" title="Fullscreen">
        <div class="capsule-item-icon"><svg viewBox="0 0 24 24"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg></div>
        <span class="capsule-item-label">Full</span>
      </button>
    </div>
  </header>

  <!-- =========================================================================
       MARS SURFACE UNIFIED TELEMETRY HUD (Left Side)
       ========================================================================= -->
  <aside id="hud-mars-panel" class="cd-unified-panel">

    <!-- Panel Header -->
    <div class="cd-panel-head-bar">
      <div class="cd-panel-title-wrap">
        <span class="cd-panel-chip" style="background: rgba(234, 88, 12, 0.12); color: #ea580c;">JEZERO CRATER</span>
        <h2 class="cd-panel-heading">Mars Surface Telemetry</h2>
      </div>
      <button id="btn-collapse-hud" class="cd-panel-close-btn" title="Minimize Panel">◀</button>
    </div>

    <div class="cd-tab-scroll-wrap">

      <!-- CARD 1: Ambient Atmosphere & Pressure -->
      <section class="cd-card cd-card-revenue" style="border-top: 2px solid #ea580c;">
        <div class="cd-card-head">
          <div class="cd-card-title-wrap">
            <h3 class="cd-card-title">Surface Atmosphere</h3>
            <span class="cd-card-caption">In-Situ Jezero Weather Station</span>
          </div>
          <span class="cd-badge-live" style="background: rgba(234, 88, 12, 0.15); color: #ea580c;">SOL 142</span>
        </div>

        <!-- Hero Metric -->
        <div class="cd-hero-block">
          <div class="cd-hero-metric">
            <span>0.636</span><span class="cd-hero-unit">kPa</span>
          </div>
          <div class="cd-trend-pill warning">
            <span class="trend-arrow">●</span>
            <span>95.3% CO₂</span>
            <span class="trend-note">(0.092 psi)</span>
          </div>
        </div>

        <!-- Atmospheric Partial Pressure Breakdown -->
        <div class="cd-property-stack" style="margin-top: 14px;">
          <div class="cd-prop-card" style="padding: 10px 14px; margin-bottom: 6px;">
            <div class="cd-prop-info">
              <span class="cd-prop-name" style="font-size: 13px;">Carbon Dioxide (CO₂)</span>
              <span class="cd-prop-meta">Primary Bulk Atmosphere</span>
            </div>
            <div class="cd-prop-price"><span class="price-val" style="color: #ea580c;">95.32%</span></div>
          </div>
          <div class="cd-prop-card" style="padding: 10px 14px; margin-bottom: 6px;">
            <div class="cd-prop-info">
              <span class="cd-prop-name" style="font-size: 13px;">Nitrogen (N₂)</span>
              <span class="cd-prop-meta">Inert Trace Carrier</span>
            </div>
            <div class="cd-prop-price"><span class="price-val">2.60%</span></div>
          </div>
          <div class="cd-prop-card" style="padding: 10px 14px; margin-bottom: 6px;">
            <div class="cd-prop-info">
              <span class="cd-prop-name" style="font-size: 13px;">Argon (Ar)</span>
              <span class="cd-prop-meta">Noble Element Fraction</span>
            </div>
            <div class="cd-prop-price"><span class="price-val">1.90%</span></div>
          </div>
          <div class="cd-prop-card" style="padding: 10px 14px; margin-bottom: 6px;">
            <div class="cd-prop-info">
              <span class="cd-prop-name" style="font-size: 13px;">Free Oxygen (O₂)</span>
              <span class="cd-prop-meta">Severe Combustion Hypoxia</span>
            </div>
            <div class="cd-prop-price"><span class="price-val" style="color: #ef4444;">0.13%</span></div>
          </div>
        </div>
      </section>

      <!-- CARD 2: Physical & Planetary Constants -->
      <section class="cd-card cd-card-occupancy">
        <div class="cd-card-head">
          <div class="cd-card-title-wrap">
            <h3 class="cd-card-title">Planetary Physics</h3>
            <span class="cd-card-caption">Gravitational & Solar Parameters</span>
          </div>
        </div>

        <div class="cd-property-stack">
          <div class="cd-prop-card" style="padding: 10px 14px; margin-bottom: 6px;">
            <div class="cd-prop-info">
              <span class="cd-prop-name" style="font-size: 13px;">Surface Gravity (g)</span>
              <span class="cd-prop-meta">3.72 m/s² Acceleration</span>
            </div>
            <div class="cd-prop-price"><span class="price-val" style="color: #38bdf8;">0.38 g</span></div>
          </div>
          <div class="cd-prop-card" style="padding: 10px 14px; margin-bottom: 6px;">
            <div class="cd-prop-info">
              <span class="cd-prop-name" style="font-size: 13px;">Surface Temperature</span>
              <span class="cd-prop-meta">Diurnal Mean (210.6 K)</span>
            </div>
            <div class="cd-prop-price"><span class="price-val">−62.5°C</span></div>
          </div>
          <div class="cd-prop-card" style="padding: 10px 14px; margin-bottom: 6px;">
            <div class="cd-prop-info">
              <span class="cd-prop-name" style="font-size: 13px;">Surface Wind Velocity</span>
              <span class="cd-prop-meta">Eolian Drift (Azimuth 45°)</span>
            </div>
            <div class="cd-prop-price"><span class="price-val">6.4 m/s</span></div>
          </div>
          <div class="cd-prop-card" style="padding: 10px 14px; margin-bottom: 6px;">
            <div class="cd-prop-info">
              <span class="cd-prop-name" style="font-size: 13px;">Atmospheric Dust Opacity</span>
              <span class="cd-prop-meta">Optical Depth Tau (τ)</span>
            </div>
            <div class="cd-prop-price"><span class="price-val" style="color: #f59e0b;">0.85 τ</span></div>
          </div>
        </div>
      </section>

      <!-- CARD 3: Mars Combustion Physics & Chamber Telemetry -->
      <section class="cd-card cd-combustion-physics-card" style="border-top: 2px solid #ef4444;">
        <div class="cd-card-head">
          <div class="cd-card-title-wrap">
            <h3 class="cd-card-title">Mars Combustion Physics</h3>
            <span class="cd-card-caption">Can a Candle Burn in Open Martian Air?</span>
          </div>
          <span class="cd-badge-live" style="background: rgba(239, 68, 68, 0.12); color: #ef4444; border-color: rgba(239, 68, 68, 0.3); font-size: 9px; padding: 2px 7px;">
            IMPOSSIBLE IN AMBIENT AIR
          </span>
        </div>

        <!-- Alert Callout Banner -->
        <div class="mars-alert-box">
          <div class="alert-icon">[ALERT]</div>
          <div class="alert-content">
            <div class="alert-title">Natural Open Flame is Physically Impossible</div>
            <div class="alert-text">
              A candle cannot ignite or burn in the open Martian atmosphere. If exposed, any flame is immediately and violently extinguished by three simultaneous physical mechanisms:
            </div>
          </div>
        </div>

        <!-- 3 Fundamental Extinction Mechanisms -->
        <div class="cd-property-stack" style="margin-top: 10px;">
          
          <div class="cd-prop-card mars-extinction-prop">
            <div class="mars-extinction-header">
              <div class="cd-prop-info">
                <span class="cd-prop-name" style="font-size: 12.5px;">1. Severe Hypoxia (0.13% O₂)</span>
                <span class="cd-prop-meta">Limiting Oxygen Index (LOI) Collapse</span>
              </div>
              <div class="cd-prop-price"><span class="price-val" style="color: #ef4444;">LOI Deficit</span></div>
            </div>
            <p class="extinction-desc">
              Paraffin wax (C₂₅H₅₂) requires a minimum <strong>LOI of ≥ 14.5%–15.0% O₂</strong> to sustain combustion. Mars has only <strong>0.13% O₂</strong> (partial pressure ~0.8 Pa vs Earth's 21,300 Pa). Radical chain branching (H + O₂ → OH + O) instantly halts.
            </p>
          </div>

          <div class="cd-prop-card mars-extinction-prop">
            <div class="mars-extinction-header">
              <div class="cd-prop-info">
                <span class="cd-prop-name" style="font-size: 12.5px;">2. Near-Vacuum (0.636 kPa / 0.09 psi)</span>
                <span class="cd-prop-meta">Sub-Armstrong Flash Evaporation</span>
              </div>
              <div class="cd-prop-price"><span class="price-val" style="color: #ea580c;">0.006 atm</span></div>
            </div>
            <p class="extinction-desc">
              At &lt;1% of Earth's atmospheric pressure, volatile wax hydrocarbons flash-boil and disperse rapidly into the ambient vacuum before a combustible fuel-air diffusion zone can form around the wick.
            </p>
          </div>

          <div class="cd-prop-card mars-extinction-prop">
            <div class="mars-extinction-header">
              <div class="cd-prop-info">
                <span class="cd-prop-name" style="font-size: 12.5px;">3. Active CO₂ Quenching (95.3% CO₂)</span>
                <span class="cd-prop-meta">Chemical & Thermal Fire Suppression</span>
              </div>
              <div class="cd-prop-price"><span class="price-val" style="color: #f59e0b;">95.3% CO₂</span></div>
            </div>
            <p class="extinction-desc">
              Dense carbon dioxide possesses high molar heat capacity, acting as an active chemical and thermal fire-extinguishing blanket that siphons reaction enthalpy and deactivates flame radicals.
            </p>
          </div>

        </div>

        <!-- How the candle is burning in this simulation -->
        <div class="mars-simulation-explainer">
          <div class="explainer-head">
            <span class="explainer-heading">Why Is This Candle Burning In The Scene?</span>
          </div>
          <p class="explainer-text">
            The candle is housed inside a <strong>hermetically sealed quartz test chamber (NASA CIR-M Rig)</strong> supplied with artificial habitat atmosphere (<strong>21% O₂, 101.3 kPa</strong>) piped through the umbilical from the Ice Home.
          </p>
          <p class="explainer-text" style="margin-top: 6px;">
            This isolates and tests <em>only</em> Mars's <strong>0.38g reduced gravity</strong>: natural buoyant convection drops by <strong>62%</strong> (Grashof Number Gr ≈ 38% of Earth), transforming the tall teardrop flame into a wide, spherical-dome envelope with lower soot production.
          </p>
        </div>

        <!-- Interactive Chamber Venting Demo -->
        <div class="mars-chamber-controls">
          <div class="chamber-status-header">
            <span class="chamber-status-title">QUARTZ CHAMBER TELEMETRY</span>
            <span id="chamber-status-badge" class="chamber-status-badge sealed">
              <span class="pulse-dot-green"></span>
              <span id="chamber-status-text">SEALED (21% O₂ // 101.3 kPa)</span>
            </span>
          </div>

          <button id="btn-vent-chamber" class="btn-vent-toggle" title="Vent quartz chamber to ambient Mars atmosphere">
            <span id="btn-vent-label">Vent Chamber to Mars Air (Simulate Extinction)</span>
          </button>
          
          <div class="vent-hint-text">
            Breach chamber seals to vent habitat air into Jezero ambient (0.636 kPa, 0.13% O₂), instantly suffocating the flame.
          </div>
        </div>

      </section>

    </div>
  </aside>

  <!-- Vertical Collapsible Navigation & Flight Controls Menu (Right Side) -->
  <aside class="pyros-vertical-controls" aria-label="Flight & Camera Navigation Controls">
    <div class="controls-header">
      <div class="controls-title-group">
        <span class="controls-title-dot"></span>
        <span class="controls-title">Mars Controls</span>
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
        <span class="control-label">Fly Rover / Drone</span>
      </div>
      <div class="control-row">
        <div class="control-keys">
          <kbd class="key-cap">Space</kbd>
          <kbd class="key-cap">Shift</kbd>
        </div>
        <span class="control-label">Altitude Up / Down</span>
      </div>
      <div class="control-row">
        <div class="control-keys">
          <kbd class="key-cap">Left Drag</kbd>
        </div>
        <span class="control-label">Orbit / Look 360°</span>
      </div>
      <div class="control-row">
        <div class="control-keys">
          <kbd class="key-cap">Right Drag</kbd>
        </div>
        <span class="control-label">Pan Camera</span>
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

  <!-- Main JavaScript App -->`;

export default function MarsSurfaceView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<any>(null);

  useEffect(() => {
    initVerticalControls();
    let isMounted = true;

    import('../../mars/marsMain.js')
      .then(({ MarsApp }) => {
        if (!isMounted) return;
        if (appRef.current) {
          appRef.current.destroy();
        }
        appRef.current = new MarsApp();
      })
      .catch((err) => console.error('Failed to init MarsApp:', err));

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
      className="clean-ui-body mars-body mars-view-root"
      dangerouslySetInnerHTML={{ __html: HTML_CONTENT }}
    />
  );
}
