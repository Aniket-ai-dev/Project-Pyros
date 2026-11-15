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

        <!-- SCENE 2: Mars Planet Surface -->
        <div class="pyros-scene-card active" id="card-scene-mars" onclick="window.location.href='/mars'">
          <div class="scene-card-visual mars-visual" style="border-color: rgba(249, 115, 22, 0.5);">
            <div class="scene-visual-badge active"
              style="background: rgba(249, 115, 22, 0.15); border-color: rgba(249, 115, 22, 0.4); color: #fb923c;">
              <span class="live-dot" style="background: #f97316; box-shadow: 0 0 6px #f97316;"></span>
              <span>AVAILABLE NOW</span>
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
              <span class="scene-version" style="color: #fb923c;">v2.1 READY</span>
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
            <a href="/mars" class="scene-launch-btn" style="background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%);">
              <span>Launch Mars Surface</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>

        <!-- SCENE 3: Martian Rover Circuit Failure -->
        <div class="pyros-scene-card active" id="card-scene-rover" onclick="window.location.href='/rover'">
          <div class="scene-card-visual rover-visual" style="border-color: rgba(239, 68, 68, 0.4);">
            <div class="scene-visual-badge active" style="background: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.4); color: #f87171;">
              <span class="live-dot" style="background: #ef4444; box-shadow: 0 0 6px #ef4444;"></span>
              <span>AVAILABLE NOW</span>
            </div>
            <div class="scene-illustration">
              <svg width="120" height="80" viewBox="0 0 120 80" fill="none">
                <rect x="22" y="16" width="76" height="48" rx="4" fill="rgba(16, 185, 129, 0.12)" stroke="#10b981" stroke-width="1.8"/>
                <rect x="32" y="24" width="22" height="18" rx="2" fill="rgba(239, 68, 68, 0.3)" stroke="#ef4444" stroke-width="1.5"/>
                <rect x="62" y="24" width="26" height="16" rx="2" fill="rgba(56, 189, 248, 0.2)" stroke="#38bdf8" stroke-width="1.2"/>
                <rect x="32" y="48" width="56" height="10" rx="2" fill="rgba(245, 158, 11, 0.2)" stroke="#f59e0b" stroke-width="1.2"/>
                <path d="M43 24v-8M75 24v-8M54 33h8M43 42v6" stroke="#fbbf24" stroke-width="1.2" stroke-linecap="round"/>
                <circle cx="43" cy="33" r="2.5" fill="#f87171"/>
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

        <!-- SCENE 4: Moon Base (CURRENT SCENE) -->
        <div class="pyros-scene-card active" id="card-scene-moon" style="border-color: rgba(56, 189, 248, 0.6);">
          <div class="scene-card-visual" style="background: radial-gradient(circle at center, rgba(148, 163, 184, 0.25) 0%, rgba(15, 23, 42, 0.9) 100%); border-color: rgba(56, 189, 248, 0.4);">
            <div class="scene-visual-badge active" style="background: rgba(56, 189, 248, 0.15); border-color: rgba(56, 189, 248, 0.4); color: #38bdf8;">
              <span class="live-dot" style="background: #38bdf8; box-shadow: 0 0 6px #38bdf8;"></span>
              <span>EXPLORING NOW</span>
            </div>
            <div class="scene-illustration">
              <svg width="120" height="80" viewBox="0 0 120 80" fill="none">
                <!-- Crater Surface Arc -->
                <path d="M15 62 Q 60 48, 105 62" stroke="#94a3b8" stroke-width="2" fill="none"/>
                <!-- Earth in sky -->
                <circle cx="32" cy="24" r="10" fill="#0284c7" stroke="#38bdf8" stroke-width="1.2"/>
                <circle cx="34" cy="22" r="3" fill="#22c55e" opacity="0.8"/>
                <!-- Central Habitat Hub -->
                <rect x="52" y="38" width="16" height="20" rx="3" fill="rgba(226, 232, 240, 0.3)" stroke="#e2e8f0" stroke-width="1.5"/>
                <!-- Cupola Dome -->
                <ellipse cx="60" cy="38" rx="6" ry="4" fill="#38bdf8" opacity="0.8"/>
                <!-- Solar Arrays -->
                <line x1="76" y1="36" x2="98" y2="36" stroke="#38bdf8" stroke-width="2.5"/>
                <line x1="87" y1="36" x2="87" y2="58" stroke="#64748b" stroke-width="1.5"/>
              </svg>
            </div>
          </div>
          <div class="scene-card-body">
            <div class="scene-header-meta">
              <span class="scene-tag" style="color: #38bdf8;">LUNAR OUTPOST // 0.166g</span>
              <span class="scene-version" style="color: #38bdf8;">LIVE EXPLORATION</span>
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
            <button id="btn-resume-moon" class="scene-launch-btn" style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);">
              <span>Resume Moon Base</span>
              </button>
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
      <button id="btn-close-main-menu" class="pyros-menu-close-btn" title="Back to Moon Base">[CLOSE]</button>

    </div>
  </div>

  <!-- 3D Three.js WebGL Viewport Canvas -->
  <canvas id="canvas-moon"></canvas>

  <!-- TOP FLOATING DOCK (Clean, modern, aesthetic navbar) -->
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

      <button class="capsule-item viewpoint-btn active" data-view="panorama" title="Shackleton Crater Panorama">
        <div class="capsule-item-icon"><svg viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg></div>
        <span class="capsule-item-label">Panorama</span>
      </button>

      <button class="capsule-item viewpoint-btn" data-view="icehome" title="NASA Inflatable Ice Home">
        <div class="capsule-item-icon"><svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 0 1 18 0v7H3v-7z"/></svg></div>
        <span class="capsule-item-label">Ice Home</span>
      </button>

      <button class="capsule-item viewpoint-btn" data-view="interior" title="Two-Story Pressurized Habitat">
        <div class="capsule-item-icon"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="12" r="3"/></svg></div>
        <span class="capsule-item-label">Interior</span>
      </button>

      <button class="capsule-item viewpoint-btn" data-view="solar" title="Solar Array & Cryogenic Tanks">
        <div class="capsule-item-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg></div>
        <span class="capsule-item-label">Power</span>
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

      <a href="/" id="btn-open-main-menu" class="capsule-item" title="Return to Home Screen">
        <div class="capsule-item-icon"><svg viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg></div>
        <span class="capsule-item-label">Menu</span>
      </a>
    </div>
  </header>

  <!-- =========================================================================
       MOON BASE UNIFIED TELEMETRY HUD (Left Side)
       ========================================================================= -->
  <aside id="hud-moon-panel" class="cd-unified-panel">

    <!-- Panel Header -->
    <div class="cd-panel-head-bar">
      <div class="cd-panel-title-wrap">
        <span class="cd-panel-chip" style="background: rgba(56, 189, 248, 0.12); color: #38bdf8;">SHACKLETON RIM</span>
        <h2 class="cd-panel-heading">Moon Base Telemetry</h2>
      </div>
      <button id="btn-collapse-hud" class="cd-panel-close-btn" title="Minimize Panel">◀</button>
    </div>

    <!-- Base Status Ribbon -->
    <div style="background: rgba(15, 23, 42, 0.85); border-bottom: 1px solid rgba(255,255,255,0.08); padding: 8px 18px; display: flex; justify-content: space-between; align-items: center;">
      <span style="font-family: var(--font-mono); font-size: 10.5px; font-weight: 700; color: #38bdf8; letter-spacing: 0.5px;">NOMINAL OPERATIONS // BASE CAMP</span>
      <span style="font-size: 9.5px; color: #94a3b8; font-family: var(--font-mono);">0.166g GRAVITY</span>
    </div>

    <div class="cd-tab-scroll-wrap">

      <!-- CARD 1: Power & Energy Grid -->
      <section class="cd-card cd-card-revenue" style="border-top: 2px solid #38bdf8;">
        <div class="cd-card-head">
          <div class="cd-card-title-wrap">
            <h3 class="cd-card-title">Habitat Power & ECLSS Grid</h3>
            <span class="cd-card-caption">Solar Arrays & Regenerative Fuel Cells</span>
          </div>
          <span class="cd-badge-live" style="background: rgba(56, 189, 248, 0.15); color: #38bdf8;">GRID NOMINAL</span>
        </div>

        <!-- Hero Metric -->
        <div class="cd-hero-block">
          <div class="cd-hero-metric">
            <span id="metric-power-gen">88.5</span><span class="cd-hero-unit">kW</span>
          </div>
          <div class="cd-trend-pill positive">
            <span class="trend-arrow">▲</span>
            <span>Solar & Buffer Online</span>
          </div>
        </div>

        <div class="cd-property-stack" style="margin-top: 14px;">
          <div class="cd-prop-card" style="padding: 10px 14px; margin-bottom: 6px;">
            <div class="cd-prop-info">
              <span class="cd-prop-name" style="font-size: 13px;">Solar Array Generation</span>
              <span class="cd-prop-meta">Tracking Surface Photovoltaics</span>
            </div>
            <div class="cd-prop-price"><span class="price-val" style="color: #38bdf8;">88.5 kW</span></div>
          </div>
          <div class="cd-prop-card" style="padding: 10px 14px; margin-bottom: 6px;">
            <div class="cd-prop-info">
              <span class="cd-prop-name" style="font-size: 13px;">Habitat Power Draw</span>
              <span class="cd-prop-meta">Primary Habitation & Life Support</span>
            </div>
            <div class="cd-prop-price"><span class="price-val" id="metric-power-con" style="color: #10b981;">52.4 kW</span></div>
          </div>
          <div class="cd-prop-card" style="padding: 10px 14px; margin-bottom: 6px;">
            <div class="cd-prop-info">
              <span class="cd-prop-name" style="font-size: 13px;">Cryogenic Fuel Cell Buffer</span>
              <span class="cd-prop-meta">Regenerative Cryo H₂/O₂ Reserve</span>
            </div>
            <div class="cd-prop-price"><span class="price-val" id="metric-battery-soc" style="color: #10b981;">95.8%</span></div>
          </div>
          <div class="cd-prop-card" style="padding: 10px 14px; margin-bottom: 6px;">
            <div class="cd-prop-info">
              <span class="cd-prop-name" style="font-size: 13px;">Ice Shield Radiation Attenuation</span>
              <span class="cd-prop-meta">Translucent Water-Ice Composite</span>
            </div>
            <div class="cd-prop-price"><span class="price-val" style="color: #38bdf8;">-94.6% GCR</span></div>
          </div>
        </div>
      </section>

      <!-- CARD 2: Habitat ECLSS & Artemis Exploration Atmosphere -->
      <section class="cd-card" style="border-top: 2px solid #10b981;">
        <div class="cd-card-head">
          <div class="cd-card-title-wrap">
            <h3 class="cd-card-title">Habitat ECLSS Atmosphere</h3>
            <span class="cd-card-caption">NASA Artemis Exploration Standard</span>
          </div>
          <span class="cd-badge-live" style="background: rgba(16, 185, 129, 0.15); color: #10b981;">OPTIMAL</span>
        </div>

        <div class="cd-hero-block">
          <div class="cd-hero-metric">
            <span>10.2</span><span class="cd-hero-unit">psi</span>
          </div>
          <div class="cd-trend-pill" style="background: rgba(16, 185, 129, 0.15); color: #34d399;">
            <span class="trend-arrow">●</span>
            <span>34.0% O₂ (P_O2 = 3.47 psi)</span>
          </div>
        </div>

        <div class="cd-property-stack" style="margin-top: 14px;">
          <div class="cd-prop-card" style="padding: 10px 14px; margin-bottom: 6px;">
            <div class="cd-prop-info">
              <span class="cd-prop-name" style="font-size: 13px;">Cabin Oxygen Concentration</span>
              <span class="cd-prop-meta">Reduces EVA Pre-Breathe to 15 min</span>
            </div>
            <div class="cd-prop-price"><span class="price-val" style="color: #10b981;">34.0% O₂</span></div>
          </div>
          <div class="cd-prop-card" style="padding: 10px 14px; margin-bottom: 6px;">
            <div class="cd-prop-info">
              <span class="cd-prop-name" style="font-size: 13px;">Regulated Cabin Temperature</span>
              <span class="cd-prop-meta">Thermal Active Loops</span>
            </div>
            <div class="cd-prop-price"><span class="price-val">21.5°C</span></div>
          </div>
          <div class="cd-prop-card" style="padding: 10px 14px; margin-bottom: 6px;">
            <div class="cd-prop-info">
              <span class="cd-prop-name" style="font-size: 13px;">Carbon Dioxide Partial Press.</span>
              <span class="cd-prop-meta">CDRA Amine Scrubber Bed</span>
            </div>
            <div class="cd-prop-price"><span class="price-val">1.8 mmHg</span></div>
          </div>
          <div class="cd-prop-card" style="padding: 10px 14px; margin-bottom: 6px;">
            <div class="cd-prop-info">
              <span class="cd-prop-name" style="font-size: 13px;">Water Recycling Recovery</span>
              <span class="cd-prop-meta">Vapor Compression Distillation</span>
            </div>
            <div class="cd-prop-price"><span class="price-val" style="color: #38bdf8;">98.2%</span></div>
          </div>
        </div>
      </section>

      <!-- CARD 3: Lunar Surface Planetary Physics -->
      <section class="cd-card cd-card-occupancy">
        <div class="cd-card-head">
          <div class="cd-card-title-wrap">
            <h3 class="cd-card-title">Lunar Surface Environment</h3>
            <span class="cd-card-caption">Vacuum & Thermal Extreme Conditions</span>
          </div>
        </div>

        <div class="cd-property-stack">
          <div class="cd-prop-card" style="padding: 10px 14px; margin-bottom: 6px;">
            <div class="cd-prop-info">
              <span class="cd-prop-name" style="font-size: 13px;">Surface Gravity (g)</span>
              <span class="cd-prop-meta">1.62 m/s² Acceleration</span>
            </div>
            <div class="cd-prop-price"><span class="price-val" style="color: #38bdf8;">0.166 g</span></div>
          </div>
          <div class="cd-prop-card" style="padding: 10px 14px; margin-bottom: 6px;">
            <div class="cd-prop-info">
              <span class="cd-prop-name" style="font-size: 13px;">Direct Sunlight Surface Temp</span>
              <span class="cd-prop-meta">Unfiltered Solar Radiation</span>
            </div>
            <div class="cd-prop-price"><span class="price-val" style="color: #f59e0b;">+118.0°C</span></div>
          </div>
          <div class="cd-prop-card" style="padding: 10px 14px; margin-bottom: 6px;">
            <div class="cd-prop-info">
              <span class="cd-prop-name" style="font-size: 13px;">Permanent Shadow Temp</span>
              <span class="cd-prop-meta">Deep Space Radiative Sink</span>
            </div>
            <div class="cd-prop-price"><span class="price-val" style="color: #60a5fa;">−130.0°C</span></div>
          </div>
          <div class="cd-prop-card" style="padding: 10px 14px; margin-bottom: 6px;">
            <div class="cd-prop-info">
              <span class="cd-prop-name" style="font-size: 13px;">Atmospheric Density / Vacuum</span>
              <span class="cd-prop-meta">Zero Rayleigh Scattering</span>
            </div>
            <div class="cd-prop-price"><span class="price-val">10⁻¹² torr</span></div>
          </div>
        </div>
      </section>

      <!-- CARD 4: Earth Telemetry & DSN Comm Link -->
      <section class="cd-card" style="border-top: 2px solid #818cf8;">
        <div class="cd-card-head">
          <div class="cd-card-title-wrap">
            <h3 class="cd-card-title">Earth Deep Space Network (DSN)</h3>
            <span class="cd-card-caption">High-Gain Parabolic Relay</span>
          </div>
          <span class="cd-badge-live" style="background: rgba(129, 140, 248, 0.15); color: #818cf8;">CARRIER LOCK</span>
        </div>

        <div class="cd-property-stack">
          <div class="cd-prop-card" style="padding: 10px 14px; margin-bottom: 6px;">
            <div class="cd-prop-info">
              <span class="cd-prop-name" style="font-size: 13px;">Active Tracking Ground Station</span>
              <span class="cd-prop-meta">Madrid 70m Dish (DSS-63)</span>
            </div>
            <div class="cd-prop-price"><span class="price-val" style="color: #818cf8;">DSN-63</span></div>
          </div>
          <div class="cd-prop-card" style="padding: 10px 14px; margin-bottom: 6px;">
            <div class="cd-prop-info">
              <span class="cd-prop-name" style="font-size: 13px;">Earth-Moon Line-of-Sight Distance</span>
              <span class="cd-prop-meta">Perigee Orbit Vector</span>
            </div>
            <div class="cd-prop-price"><span class="price-val">384,400 km</span></div>
          </div>
          <div class="cd-prop-card" style="padding: 10px 14px; margin-bottom: 6px;">
            <div class="cd-prop-info">
              <span class="cd-prop-name" style="font-size: 13px;">Light-Time Comm Round-Trip (RTT)</span>
              <span class="cd-prop-meta">Speed of Light Latency (2 x d / c)</span>
            </div>
            <div class="cd-prop-price"><span class="price-val">2.56 sec</span></div>
          </div>
          <div class="cd-prop-card" style="padding: 10px 14px; margin-bottom: 6px;">
            <div class="cd-prop-info">
              <span class="cd-prop-name" style="font-size: 13px;">RF Signal Link Margin</span>
              <span class="cd-prop-meta">Ka-Band 26 GHz Uplink</span>
            </div>
            <div class="cd-prop-price"><span class="price-val" style="color: #10b981;">+18.4 dB</span></div>
          </div>
        </div>
      </section>

      <!-- CARD 5: NASA PSI Lunar Combustion Science (LUCI & FM2) -->
      <section class="cd-card" style="border-top: 2px solid #f43f5e;">
        <div class="cd-card-head">
          <div class="cd-card-title-wrap">
            <h3 class="cd-card-title">NASA PSI Partial-g Science</h3>
            <span class="cd-card-caption">LUCI & FM2 Lunar Combustion Experiments</span>
          </div>
          <span class="cd-badge-live" style="background: rgba(244, 63, 94, 0.15); color: #f43f5e;">0.166g BENCHMARK</span>
        </div>

        <div style="font-size: 11.5px; line-height: 1.45; color: #cbd5e1; background: rgba(15, 23, 42, 0.6); padding: 10px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06); margin-bottom: 10px;">
          <strong>Lunar Gateway & Surface Precedents:</strong> NASA PSI's upcoming <strong>LUCI</strong> (Lunar Combustion Investigation) and <strong>FM2</strong> (Flammability on the Moon) will establish the first empirical partial-gravity fire spread limits.
        </div>

        <div class="cd-property-stack">
          <div class="cd-prop-card" style="padding: 10px 14px; margin-bottom: 6px;">
            <div class="cd-prop-info">
              <span class="cd-prop-name" style="font-size: 13px;">Roper Flame Height Scaling L_f</span>
              <span class="cd-prop-meta">L_f(0.166g) = L_f(1g) · (0.166)⁻⁰·²⁵</span>
            </div>
            <div class="cd-prop-price"><span class="price-val" style="color: #f43f5e;">+57% Elongated</span></div>
          </div>
          <div class="cd-prop-card" style="padding: 10px 14px; margin-bottom: 6px;">
            <div class="cd-prop-info">
              <span class="cd-prop-name" style="font-size: 13px;">Buoyant Convection Velocity</span>
              <span class="cd-prop-meta">u_conv ∝ √(g) (~0.226 m/s vs 0.554 m/s)</span>
            </div>
            <div class="cd-prop-price"><span class="price-val">-59% Slower</span></div>
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
        <span class="controls-title">Lunar Controls</span>
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
        <span class="control-label">Fly Astronaut</span>
      </div>
      <div class="control-row">
        <div class="control-keys">
          <kbd class="key-cap">Space</kbd>
          <kbd class="key-cap">Shift</kbd>
        </div>
        <span class="control-label">Float Up / Down</span>
      </div>
      <div class="control-row">
        <div class="control-keys">
          <kbd class="key-cap">Left Drag</kbd>
        </div>
        <span class="control-label">Look 360°</span>
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

  <!-- Application Entry Point -->`;

export default function MoonBaseView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<any>(null);

  useEffect(() => {
    initVerticalControls();
    let isMounted = true;

    import('../../moon/moonMain.js')
      .then(({ MoonBaseApp }) => {
        if (!isMounted) return;
        if (appRef.current) {
          appRef.current.destroy();
        }
        appRef.current = new MoonBaseApp();
      })
      .catch((err) => console.error('Failed to init MoonBaseApp:', err));

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
      className="clean-ui-body moon-body moon-view-root"
      dangerouslySetInnerHTML={{ __html: HTML_CONTENT }}
    />
  );
}
