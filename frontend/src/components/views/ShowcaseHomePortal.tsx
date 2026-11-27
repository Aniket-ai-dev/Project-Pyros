'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import StarsBackground from '../ui/StarsBackground';
import IntroWarpGate from './IntroWarpGate';

interface EnvSpec {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  href: string;
  gravity: string;
  atmosphere: string;
  pressure: string;
  focusMetricLabel: string;
  focusMetricValue: string;
  focusMetricNote: string;
  description: string;
  image?: string;
  capabilities: string[];
}

const ENVIRONMENTS: EnvSpec[] = [
  {
    id: 'station',
    code: 'ENV-01 // ISS ORBITAL',
    title: 'Orbital Research Laboratory',
    subtitle: 'Destiny & Columbus modules in microgravity',
    href: '/station',
    gravity: '0.00 g',
    atmosphere: '20.9%–36% O2 / N2',
    pressure: '101.3 kPa',
    focusMetricLabel: 'Flame geometry',
    focusMetricValue: 'Spherical soot shell',
    focusMetricNote: 'Diffusion-controlled steady state',
    description:
      'Operate Environmental Control and Life Support (ECLSS) oxygen and cabin-pressure envelopes alongside 22 historical NASA combustion investigations and the Scenario Intelligence analyzer.',
    image: '/assets/showcase/art_iss@2x.png',
    capabilities: [
      'ECLSS O2/N2 & artificial gravity controls',
      '22-mission NASA physical dataset presets',
      'Live scenario intelligence & Roper scaling',
    ],
  },
  {
    id: 'mars',
    code: 'ENV-02 // JEZERO CRATER',
    title: 'Mars Planetary Surface',
    subtitle: 'CO2 exosphere & pressurized habitat module',
    href: '/mars',
    gravity: '0.38 g',
    atmosphere: '95.3% CO2 exterior',
    pressure: '0.63 kPa ambient',
    focusMetricLabel: 'Chamber modes',
    focusMetricValue: 'Sealed / 34% O2 / Vent',
    focusMetricNote: 'Reduced buoyancy vs Earth 1g',
    description:
      'Traverse Jezero Crater delta stratigraphy between the Sky-Crane descent lander, atmospheric research habitat, and an external combustion chamber capable of venting to tenuous Martian CO2.',
    image: '/assets/showcase/art_mars_sphere@2x.png',
    capabilities: [
      '0.38 g partial buoyancy convection model',
      'Sealed vs vented combustion state toggle',
      '6 surface & avionics camera viewpoints',
    ],
  },
  {
    id: 'rover',
    code: 'ENV-03 // WEB AVIONICS',
    title: 'Rover Electrical Fault Lab',
    subtitle: '28V Warm Electronics Box & FLIR diagnostics',
    href: '/rover',
    gravity: '0.38 g',
    atmosphere: 'Enclosed chassis gas',
    pressure: '101.3 kPa internal',
    focusMetricLabel: 'Fault sequence',
    focusMetricValue: '7 stages (0–35 s)',
    focusMetricNote: 'Contactor trip at 40 A threshold',
    description:
      'Inspect a multi-stage 28V power distribution short circuit across the Power Control Unit, RCE CPU, Li-Ion battery bus, and motor PWM controllers using live raycasting and Ironbow FLIR thermal imaging.',
    image: '/assets/showcase/art_rover_vehicle@2x.png',
    capabilities: [
      'Normal, Circuit trace & FLIR thermal modes',
      'Component raycasting & bus load curves',
      '7-stage fault progression scrubber',
    ],
  },
  {
    id: 'moon',
    code: 'ENV-04 // SHACKLETON RIM',
    title: 'Lunar Ice Home Habitat',
    subtitle: 'Water-ice composite shielding & microgrid',
    href: '/moon',
    gravity: '0.165 g',
    atmosphere: 'Ultrahigh vacuum exterior',
    pressure: '0.00 kPa external',
    focusMetricLabel: 'Habitat shielding',
    focusMetricValue: '1.2 m water-ice shell',
    focusMetricNote: 'SOLA-driven PV microgrid',
    description:
      'Monitor Shackleton Crater solar power routing, habitat ECLSS life support, thermal loops, and the LUCI reduced-gravity combustion test cell inside a translucent regolith and ice-composite dome.',
    image: '/assets/showcase/art_moon_icehome@2x.png',
    capabilities: [
      'Normal, Power, Life Support & Emergency modes',
      'LUCI 0.165 g buoyancy combustion view',
      'Orbital solar & GCR shielding telemetry',
    ],
  },
  {
    id: 'combustion',
    code: 'ENV-05 // CFD PHYSICS LAB',
    title: 'Multi-Gravity Flame Solver',
    subtitle: 'Real-time Navier-Stokes & Roper scaling',
    href: '/combustion',
    gravity: '0.00 g – 3.00 g',
    atmosphere: '10%–50% O2 configurable',
    pressure: '0.30–2.00 atm',
    focusMetricLabel: 'Solver pipeline',
    focusMetricValue: 'WebGPU / WebGL2 + 2D Slice',
    focusMetricNote: 'Gr, Ra, Pe & Fr real-time telemetry',
    description:
      'Simulate buoyant vs diffusive jet flames across candle, cylindrical, and spherical microgravity burner geometries with a synchronized axial 2D temperature slice and live Roper hydrodynamic analysis.',
    capabilities: [
      'Hotkeys 1–6 across gravity regimes',
      '2D thermal cross-section slice inspector',
      'Grashof, Rayleigh, Peclet & Froude readouts',
    ],
  },
];

function PhysicsChamberDiagram() {
  return (
    <svg
      viewBox="0 0 320 260"
      width="300"
      height="244"
      aria-label="Multi-gravity combustion chamber schematic"
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id="flameOuter" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.85" />
          <stop offset="40%" stopColor="#e5a03b" stopOpacity="0.92" />
          <stop offset="100%" stopColor="#ea7a31" stopOpacity="0.18" />
        </linearGradient>
        <linearGradient id="flameCore" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.95" />
          <stop offset="55%" stopColor="#fef08a" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#e5a03b" stopOpacity="0.65" />
        </linearGradient>
      </defs>

      {/* Subtle calibration grid */}
      <g stroke="rgba(236, 240, 246, 0.07)" strokeWidth="1">
        <line x1="40" y1="32" x2="40" y2="220" />
        <line x1="280" y1="32" x2="280" y2="220" />
        <line x1="40" y1="70" x2="280" y2="70" strokeDasharray="3 4" />
        <line x1="40" y1="120" x2="280" y2="120" strokeDasharray="3 4" />
        <line x1="40" y1="170" x2="280" y2="170" strokeDasharray="3 4" />
        <line x1="160" y1="32" x2="160" y2="220" strokeDasharray="2 4" />
      </g>

      {/* Chamber vessel outline */}
      <rect
        x="48"
        y="24"
        width="224"
        height="196"
        rx="8"
        fill="rgba(24, 28, 38, 0.55)"
        stroke="rgba(236, 240, 246, 0.16)"
        strokeWidth="1.25"
      />

      {/* Left microgravity spherical envelope reference */}
      <circle
        cx="112"
        cy="134"
        r="34"
        fill="rgba(56, 189, 248, 0.08)"
        stroke="#38bdf8"
        strokeWidth="1.2"
        strokeDasharray="4 3"
      />
      <circle cx="112" cy="144" r="14" fill="rgba(56, 189, 248, 0.22)" stroke="#38bdf8" strokeWidth="1" />
      <text x="80" y="92" fill="#9aa4b4" fontFamily="JetBrains Mono, monospace" fontSize="10">
        0.00g sphere
      </text>

      {/* Right Earth/Mars buoyant plume */}
      <path
        d="M210 184 C190 165, 190 118, 210 58 C230 118, 230 165, 210 184 Z"
        fill="url(#flameOuter)"
        stroke="#e5a03b"
        strokeWidth="1"
      />
      <path
        d="M210 184 C200 164, 200 132, 210 92 C220 132, 220 164, 210 184 Z"
        fill="url(#flameCore)"
      />
      <text x="176" y="48" fill="#e5a03b" fontFamily="JetBrains Mono, monospace" fontSize="10">
        1.00g plume
      </text>

      {/* Burner nozzles */}
      <rect x="106" y="148" width="12" height="46" rx="2" fill="#202634" stroke="rgba(236, 240, 246, 0.24)" />
      <rect x="204" y="184" width="12" height="36" rx="2" fill="#202634" stroke="rgba(236, 240, 246, 0.24)" />

      {/* Telemetry readout tags inside schematic */}
      <text x="60" y="208" fill="#697487" fontFamily="JetBrains Mono, monospace" fontSize="10">
        Gr = g·beta·dT·L^3 / nu^2
      </text>
    </svg>
  );
}

export default function ShowcaseHomePortal() {
  const [selectedId, setSelectedId] = useState<string>('station');
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'fallback'>('checking');
  const [showIntro, setShowIntro] = useState(true);

  const explorerRef = useRef<{ open: () => void } | null>(null);
  const auditRef = useRef<{ open: () => void } | null>(null);

  const activeEnv = ENVIRONMENTS.find((e) => e.id === selectedId) || ENVIRONMENTS[0];

  useLayoutEffect(() => {
    try {
      if (window.sessionStorage.getItem('pyros_intro_seen') === '1') {
        setShowIntro(false);
      }
    } catch {
      // Ignore storage access errors
    }
  }, []);

  const handleIntroComplete = () => {
    try {
      window.sessionStorage.setItem('pyros_intro_seen', '1');
    } catch {
      // Ignore storage access errors
    }
    setShowIntro(false);
  };

  const handleReplayIntro = () => {
    try {
      window.sessionStorage.removeItem('pyros_intro_seen');
    } catch {
      // Ignore storage access errors
    }
    setShowIntro(true);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [{ NASADataService }, { InvestigationExplorer }, { CriteriaAuditModal }] = await Promise.all([
          import('../../services/NASADataService.js'),
          import('../../ui/InvestigationExplorer.js'),
          import('../../ui/CriteriaAuditModal.js'),
        ]);
        if (!mounted) return;
        const dataService = new NASADataService();
        explorerRef.current = new InvestigationExplorer(dataService, null);
        auditRef.current = new CriteriaAuditModal(dataService);

        const online = await dataService.checkHealth();
        if (mounted) {
          setBackendStatus(online ? 'online' : 'fallback');
        }
      } catch {
        if (mounted) setBackendStatus('fallback');
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleRailKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = ENVIRONMENTS[(idx + 1) % ENVIRONMENTS.length];
      setSelectedId(next.id);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = ENVIRONMENTS[(idx - 1 + ENVIRONMENTS.length) % ENVIRONMENTS.length];
      setSelectedId(prev.id);
    }
  };

  return (
    <>
      <IntroWarpGate isVisible={showIntro} onComplete={handleIntroComplete} />
      <div className="portal-shell">
      <div className="portal-canvas-bg">
        <StarsBackground count={160} size={1.1} color="#6f7c91" speedX={0.012} speedY={0.006} />
      </div>

      <header className="portal-topbar">
        <div className="portal-brand">
          <img
            src="/logo.png"
            alt="Project Pyros mission patch"
            width={32}
            height={32}
            style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
          />
          <div className="portal-brand-text">
            <span className="portal-brand-title">Project Pyros</span>
            <span className="portal-brand-sub">Microgravity combustion &amp; planetary research</span>
          </div>
        </div>

        <div className="portal-header-actions">
          <div className="backend-status-pill" title="Telemetry backend connection status">
            <span
              className={`status-dot ${
                backendStatus === 'online' ? 'online' : backendStatus === 'fallback' ? 'warn' : ''
              }`}
            />
            <span>
              {backendStatus === 'online'
                ? 'API Online'
                : backendStatus === 'fallback'
                ? 'Embedded Physics Active'
                : 'Checking API...'}
            </span>
          </div>

          <button
            type="button"
            className="topbar-btn"
            onClick={() => explorerRef.current?.open()}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M3 5v14a9 3 0 0 0 18 0V5" />
            </svg>
            <span>22 NASA Missions</span>
          </button>

          <button
            type="button"
            className="topbar-btn"
            onClick={() => auditRef.current?.open()}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            <span>Science Audit</span>
          </button>

          <button
            type="button"
            id="btn-replay-intro"
            className="topbar-btn"
            onClick={handleReplayIntro}
            title="Replay galaxy warp intro screen"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            <span>Replay Intro</span>
          </button>
        </div>
      </header>

      <main className="portal-main">
        <section className="portal-intro-row">
          <div>
            <h1 className="portal-headline">Select simulation environment</h1>
            <p className="portal-subtitle">
              Inspect 3D spacecraft hardware, planetary atmospheres, electrical fault progression, and reduced-gravity flame scaling against empirical NASA datasets.
            </p>
          </div>

          <div className="portal-metric-strip">
            <div className="portal-metric-item">
              <span className="portal-metric-val">5</span>
              <span className="portal-metric-lbl">3D Environments</span>
            </div>
            <div className="portal-metric-item">
              <span className="portal-metric-val">22</span>
              <span className="portal-metric-lbl">NASA Datasets</span>
            </div>
            <div className="portal-metric-item">
              <span className="portal-metric-val">0.00–3.00 g</span>
              <span className="portal-metric-lbl">Gravity Envelope</span>
            </div>
          </div>
        </section>

        <section className="portal-stage-grid" aria-label="Mission environments">
          <div className="portal-env-rail" role="tablist" aria-orientation="vertical">
            {ENVIRONMENTS.map((env, idx) => {
              const active = env.id === activeEnv.id;
              return (
                <button
                  key={env.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`portal-rail-item ${active ? 'active' : ''}`}
                  onClick={() => setSelectedId(env.id)}
                  onKeyDown={(e) => handleRailKeyDown(e, idx)}
                >
                  <div className="rail-item-left">
                    <span className="rail-item-code">0{idx + 1}</span>
                    <div>
                      <div className="rail-item-title">{env.title}</div>
                      <div className="rail-item-sub">{env.subtitle}</div>
                    </div>
                  </div>
                  <span className="rail-item-gravity">{env.gravity}</span>
                </button>
              );
            })}
          </div>

          <div className="portal-stage-panel" role="tabpanel">
            <div className="stage-visual-area">
              <div className="stage-copy-col">
                <span className="stage-env-code">{activeEnv.code}</span>
                <h2 className="stage-title">{activeEnv.title}</h2>
                <p className="stage-desc">{activeEnv.description}</p>

                <div className="cd-chip-row" style={{ marginTop: 4 }}>
                  {activeEnv.capabilities.map((cap) => (
                    <span key={cap} className="tag-pill">
                      {cap}
                    </span>
                  ))}
                </div>

                <div className="stage-actions">
                  <Link href={activeEnv.href} className="btn-primary-launch">
                    <span>Launch {activeEnv.title.split(' ')[0]} Simulation</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </Link>

                  <button
                    type="button"
                    className="btn-secondary-launch"
                    onClick={() => explorerRef.current?.open()}
                  >
                    Browse Flight Archive
                  </button>
                </div>
              </div>

              <div className="stage-art-col">
                {activeEnv.image ? (
                  <img
                    src={activeEnv.image}
                    alt={`${activeEnv.title} preview`}
                    className="stage-art-img"
                  />
                ) : (
                  <PhysicsChamberDiagram />
                )}
              </div>
            </div>

            <div className="stage-spec-bar">
              <div className="stage-spec-cell">
                <span className="stage-spec-label">Gravity regime</span>
                <span className="stage-spec-val">{activeEnv.gravity}</span>
                <span className="stage-spec-note">Target acceleration</span>
              </div>
              <div className="stage-spec-cell">
                <span className="stage-spec-label">Atmosphere</span>
                <span className="stage-spec-val">{activeEnv.atmosphere}</span>
                <span className="stage-spec-note">Nominal gas mix</span>
              </div>
              <div className="stage-spec-cell">
                <span className="stage-spec-label">Total pressure</span>
                <span className="stage-spec-val">{activeEnv.pressure}</span>
                <span className="stage-spec-note">Chamber / habitat</span>
              </div>
              <div className="stage-spec-cell">
                <span className="stage-spec-label">{activeEnv.focusMetricLabel}</span>
                <span className="stage-spec-val">{activeEnv.focusMetricValue}</span>
                <span className="stage-spec-note">{activeEnv.focusMetricNote}</span>
              </div>
            </div>
          </div>
        </section>
      </main>
      </div>
    </>
  );
}
