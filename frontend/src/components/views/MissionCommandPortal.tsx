'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface MissionCard {
  id: string;
  verticalLabel: string;
  image: string;
  tag: string;
  version: string;
  title: string;
  summary: string;
  href: string;
  buttonLabel: string;
  buttonClass: string;
  glowColor: string;
  tagColor: string;
  isSelected?: boolean;
  features: string[];
  telemetry: React.ReactNode;
}

export default function MissionCommandPortal() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const cards: MissionCard[] = [
    {
      id: 'space',
      verticalLabel: 'SPACE',
      image: '/assets/cards/art_space@2x.png',
      tag: 'ORBITAL HABITAT // 0.00g',
      version: '+2.4 READY',
      title: 'Space Station Laboratory',
      summary:
        'Explore the Destiny & Columbus pressurized module with interactive ECLSS atmosphere controls, microgravity candle flames, and the Microgravity Science Glovebox (MSG).',
      href: '/station',
      buttonLabel: 'Launch Space Station',
      buttonClass: 'btn-space',
      glowColor: 'rgba(56, 189, 248, 0.4)',
      tagColor: '#38bdf8',
      features: ['+ 3D Free Flight', '+ ECLSS Controls', '+ 22 NASA Missions', '+ Glovebox Exp'],
      telemetry: (
        <div className="telemetry-inner">
          <div className="telemetry-chart-col">
            <div className="telemetry-header">
              <span className="telemetry-label">ECLS</span>
              <span className="telemetry-ready-cyan">
                <span className="dot-pulse-cyan" />
                READY
              </span>
            </div>
            <svg width="100" height="24" viewBox="0 0 100 24" fill="none">
              <path
                d="M0 16 L12 16 L18 12 L24 18 L32 8 L40 16 L48 14 L56 20 L64 6 L72 14 L80 12 L88 17 L96 11 L100 13"
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M0 16 L12 16 L18 12 L24 18 L32 8 L40 16 L48 14 L56 20 L64 6 L72 14 L80 12 L88 17 L96 11 L100 13 L100 24 L0 24 Z"
                fill="url(#blue-ecls-grad)"
                opacity="0.22"
              />
              <defs>
                <linearGradient id="blue-ecls-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="telemetry-stat-col">
            <div className="stat-label">MISSION</div>
            <div className="stat-value">02:15:30</div>
          </div>
        </div>
      ),
    },
    {
      id: 'mars',
      verticalLabel: 'MARS',
      image: '/assets/cards/art_mars@2x.png',
      tag: 'PLANETARY SURFACE // 0.38g',
      version: '+1.0 READY',
      title: 'Mars Planet Surface',
      summary:
        'Accurate Martian planet Crater terrain with iron-oxide dunes, impact basins, NASA Surveyor science lander, geodesic habitat dome, and 0.38g flame test chamber.',
      href: '/mars',
      buttonLabel: 'Explore Mars Surface',
      buttonClass: 'btn-mars',
      glowColor: 'rgba(249, 115, 22, 0.4)',
      tagColor: '#fb923c',
      features: ['+ Jezero Crater Dunes', '+ 0.38g Gravity', '+ NASA Outpost', '+ Dust Phenomena'],
      telemetry: (
        <div className="telemetry-inner">
          <div className="telemetry-chart-col">
            <div className="telemetry-header">
              <span className="telemetry-label">DUNES</span>
              <span className="telemetry-ready-orange">
                <span className="dot-pulse-orange" />
                READY
              </span>
            </div>
            <svg width="100" height="24" viewBox="0 0 100 24" fill="none">
              <path d="M0 18 Q 25 8, 50 15 T 100 12" stroke="#fb923c" strokeWidth="1.5" fill="none" />
              <path
                d="M0 18 Q 25 8, 50 15 T 100 12 L100 24 L0 24 Z"
                fill="url(#orange-dune-grad)"
                opacity="0.22"
              />
              <defs>
                <linearGradient id="orange-dune-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fb923c" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="telemetry-gauge-col">
            <div className="gauge-wrap">
              <svg width="38" height="38" viewBox="0 0 38 38">
                <circle cx="19" cy="19" r="15" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                <circle
                  cx="19"
                  cy="19"
                  r="15"
                  fill="none"
                  stroke="#fb923c"
                  strokeWidth="3"
                  strokeDasharray="94"
                  strokeDashoffset="58"
                  strokeLinecap="round"
                  transform="rotate(-90 19 19)"
                />
              </svg>
              <div className="gauge-text">
                <span className="gauge-val">+0.38g</span>
                <span className="gauge-sub">GRAVITY</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'circuit',
      verticalLabel: 'CIRCUIT',
      image: '/assets/cards/art_circuit@2x.png',
      tag: 'ROVER CIRCUIT //',
      version: '+1.0 READY',
      title: 'Rover Circuit Failure',
      summary:
        'Inside the Warm Electronics Box (WEB): Martian dust cooling insulation, power controller thermal runaway, electrical arcing, and autonomous bus isolation.',
      href: '/rover',
      buttonLabel: 'Inspect Rover Electronics',
      buttonClass: 'btn-circuit',
      glowColor: 'rgba(56, 189, 248, 0.9)',
      tagColor: '#f87171',
      isSelected: true,
      features: ['+ 3D Avionics PCB', '+ Thermal Runaway', '+ Electrical Arcs', '+ Auto-Isolation'],
      telemetry: (
        <div className="telemetry-inner">
          <div className="telemetry-chart-col">
            <div className="telemetry-header">
              <span className="telemetry-label-red">ELECTRICS</span>
            </div>
            <svg width="78" height="22" viewBox="0 0 78 22" fill="none">
              <path
                d="M0 18 L18 18 L26 15 L34 3 L42 19 L50 17 L58 18 L78 18"
                stroke="#ef4444"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="telemetry-timeline-col">
            <div className="timeline-title">TIMELINE</div>
            <div className="timeline-bar-row">
              <span className="t-label">Trace 1</span>
              <div className="t-track"><div className="t-fill t-cyan" style={{ width: '85%' }} /></div>
            </div>
            <div className="timeline-bar-row">
              <span className="t-label">Trace 2</span>
              <div className="t-track"><div className="t-fill t-orange" style={{ width: '70%' }} /></div>
            </div>
            <div className="timeline-bar-row">
              <span className="t-label">Trace 3</span>
              <div className="t-track"><div className="t-fill t-red" style={{ width: '95%' }} /></div>
            </div>
            <div className="timeline-bar-row">
              <span className="t-label">Trace 4</span>
              <div className="t-track"><div className="t-fill t-blue" style={{ width: '45%' }} /></div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'moon',
      verticalLabel: 'MOON',
      image: '/assets/cards/art_moon@2x.png',
      tag: 'LUNAR OUTPOST // 0.166g',
      version: '+1.0 READY',
      title: 'Moon Base (NASA Ice Home)',
      summary:
        'NASA Inflatable Ice Home on the Moon: Translucent quilted ice-composite radiation shield, two-story pressurized habitat, airlock vestibule, dual support modules, and LUCI 0.166g lunar combustion test stand.',
      href: '/moon',
      buttonLabel: 'Launch Moon Base',
      buttonClass: 'btn-moon',
      glowColor: 'rgba(56, 189, 248, 0.4)',
      tagColor: '#38bdf8',
      features: ['+ NASA Ice Home', '+ 0.166g Lunar Physics', '+ Translucent Dome', '+ Deep Space Sky'],
      telemetry: (
        <div className="telemetry-inner">
          <div className="telemetry-patch-col">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <ellipse cx="12" cy="12" rx="9" ry="6" stroke="#38bdf8" strokeWidth="1.4" fill="rgba(56,189,248,0.12)" />
              <circle cx="12" cy="9" r="3" fill="#38bdf8" />
            </svg>
            <div className="patch-info">
              <span className="patch-val">0.166g</span>
              <span className="patch-ready">READY</span>
            </div>
          </div>
          <div className="telemetry-gauge-col">
            <div className="gauge-wrap">
              <svg width="38" height="38" viewBox="0 0 38 38">
                <circle cx="19" cy="19" r="15" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                <circle
                  cx="19"
                  cy="19"
                  r="15"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="3"
                  strokeDasharray="94"
                  strokeDashoffset="65"
                  strokeLinecap="round"
                  transform="rotate(-90 19 19)"
                />
              </svg>
              <div className="gauge-text">
                <span className="gauge-val">1.0</span>
                <span className="gauge-sub">GRAVITY</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'combustion',
      verticalLabel: 'PHYSICS',
      image: '/assets/cards/art_combustion@2x.png',
      tag: 'PHYSICS CHAMBER // MULTI-G',
      version: '+2.0 READY',
      title: 'Combustion Laboratory',
      summary:
        '3D Eulerian Navier-Stokes fluid solver, volumetric raymarching flame shader, and 2D voxel cross-section slice analyzer for candle and burner diffusion flames.',
      href: '/combustion',
      buttonLabel: 'Launch Combustion Lab',
      buttonClass: 'btn-combustion',
      glowColor: 'rgba(168, 85, 247, 0.45)',
      tagColor: '#c084fc',
      features: ['+ Navier-Stokes Solver', '+ Volumetric Raymarch', '+ 2D Eulerian Slice', '+ Gas Presets'],
      telemetry: (
        <div className="telemetry-inner">
          <div className="telemetry-chart-col">
            <div className="telemetry-header">
              <span className="telemetry-label" style={{ color: '#c084fc' }}>FLUID</span>
              <span className="telemetry-ready-cyan" style={{ color: '#a855f7' }}>
                <span className="dot-pulse-cyan" style={{ background: '#a855f7', boxShadow: '0 0 4px #a855f7' }} />
                SOLVER
              </span>
            </div>
            <svg width="100" height="24" viewBox="0 0 100 24" fill="none">
              <path
                d="M0 20 Q 20 5, 40 18 T 80 8 L 100 14"
                stroke="#c084fc"
                strokeWidth="1.5"
                fill="none"
              />
              <path
                d="M0 20 Q 20 5, 40 18 T 80 8 L 100 14 L 100 24 L 0 24 Z"
                fill="url(#purple-fluid-grad)"
                opacity="0.25"
              />
              <defs>
                <linearGradient id="purple-fluid-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#c084fc" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="telemetry-stat-col">
            <div className="stat-label" style={{ color: '#c084fc' }}>MULTI-G</div>
            <div className="stat-value" style={{ color: '#f3e8ff' }}>RAYMARCH</div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="mission-command-portal">
      {/* Subtle Carbon Fiber / Honeycomb Corner Accents */}
      <div className="honeycomb-corner top-left" />
      <div className="honeycomb-corner top-right" />

      {/* Main Container */}
      <div className="portal-container" style={{ maxWidth: 1640 }}>
        {/* Top Mission Command Pill */}
        <div className="portal-header">
          <div className="mission-badge-pill">
            <span className="pill-dot" />
            <span>NASA PHYSICAL SCIENCES INFORMATICS // MISSION COMMAND</span>
          </div>

          <h1 className="portal-title">PROJECT PYROS</h1>
          <p className="portal-subtitle">
            Select an operational simulation environment to initiate exploration
          </p>
        </div>

        {/* 5 Mission Cards Grid */}
        <div className="cards-grid five-cards">
          {cards.map((card) => {
            const isHovered = hoveredCard === card.id;
            const isHighlighted = card.isSelected;

            return (
              <div
                key={card.id}
                className={`mission-card ${isHighlighted ? 'card-selected' : ''}`}
                onMouseEnter={() => setHoveredCard(card.id)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  boxShadow: isHovered
                    ? `0 12px 40px rgba(0, 0, 0, 0.8), 0 0 30px ${card.glowColor}`
                    : isHighlighted
                    ? `0 0 25px rgba(56, 189, 248, 0.45), 0 8px 32px rgba(0, 0, 0, 0.7)`
                    : '0 8px 30px rgba(0, 0, 0, 0.55)',
                }}
              >
                {/* Upper Section: Vertical Sidebar Text + Artwork */}
                <div className="card-top-row">
                  <div className="vertical-label-col">
                    <span className="vertical-text">{card.verticalLabel}</span>
                  </div>
                  <div className="card-art-wrap">
                    <img
                      src={card.image}
                      alt={card.title}
                      className="card-art-img"
                      loading="eager"
                    />
                  </div>
                </div>

                {/* Card Main Body */}
                <div className="card-body">
                  {/* Status & Environment Tag */}
                  <div className="card-tag-row">
                    <span className="card-tag" style={{ color: card.tagColor }}>
                      {card.tag}
                    </span>
                    <span className="card-version" style={{ color: card.tagColor }}>
                      {card.version}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="card-title">{card.title}</h2>

                  {/* Summary */}
                  <p className="card-summary">{card.summary}</p>

                  {/* Telemetry Box */}
                  <div className="card-telemetry-box">{card.telemetry}</div>

                  {/* Features (2x2 Grid) */}
                  <div className="card-features-grid">
                    {card.features.map((feat, idx) => (
                      <div key={idx} className="feature-pill">
                        {feat}
                      </div>
                    ))}
                  </div>

                  {/* Functional Navigation Action Button */}
                  <Link href={card.href} className={`card-action-btn ${card.buttonClass}`}>
                    <span>{card.buttonLabel}</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Pagination Dots */}
        <div className="portal-pagination">
          <span className="page-dot" />
          <span className="page-dot active" />
          <span className="page-dot" />
          <span className="page-dot" />
          <span className="page-dot" />
        </div>
      </div>
    </div>
  );
}
