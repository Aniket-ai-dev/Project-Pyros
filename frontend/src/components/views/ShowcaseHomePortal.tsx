'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import CriteriaAuditModal from '@/components/station/CriteriaAuditModal';
import StarsBackground from '@/components/ui/StarsBackground';

interface ShowcasePanel {
  id: string;
  letters: string[];
  title: string;
  artImage: string;
  altText: string;
  description: string;
  btnText: string;
  href: string;
  dotIndex: number;
  badgeLabel: string;
}

export default function ShowcaseHomePortal() {
  const [activeMenu, setActiveMenu] = useState(false);
  const [activeSlide, setActiveSlide] = useState<number | null>(null);
  const [isAuditOpen, setIsAuditOpen] = useState(false);

  const panels: ShowcasePanel[] = [
    {
      id: 'space',
      letters: ['S', 'P', 'A', 'C', 'E'],
      title: 'Space Station Laboratory',
      artImage: '/assets/showcase/art_iss@2x.png',
      altText: 'International Space Station (ISS) Airlock',
      description:
        'Explore the Destiny & Columbus pressurized module with interactive ECLSS atmosphere controls, microgravity candle flames, and the Microgravity Science Glovebox (MSG).',
      btnText: 'EXPLORE SPACE',
      href: '/station',
      dotIndex: 0,
      badgeLabel: 'ORBITAL // 0.00g',
    },
    {
      id: 'mars',
      letters: ['M', 'A', 'R', 'S'],
      title: 'Mars Planet Surface',
      artImage: '/assets/showcase/art_mars_sphere@2x.png',
      altText: 'Mars Planet Horizon',
      description:
        'Mars is the fourth planet from the Sun. Accurate Jezero Crater terrain with iron-oxide dunes, NASA Surveyor lander, geodesic habitat dome, and 0.38g flame test chamber.',
      btnText: 'EXPLORE MARS',
      href: '/mars',
      dotIndex: 1,
      badgeLabel: 'SURFACE // 0.38g',
    },
    {
      id: 'rover',
      letters: ['R', 'O', 'V', 'E', 'R'],
      title: 'Mars Rover & WEB Circuit',
      artImage: '/assets/showcase/art_rover_vehicle@2x.png',
      altText: 'NASA Mars Exploration Rover',
      description:
        'Autonomous Martian surface exploration inside the Warm Electronics Box (WEB): dust cooling insulation, power distribution, thermal runaway, and electrical arc diagnostics.',
      btnText: 'EXPLORE ROVER',
      href: '/rover',
      dotIndex: 2,
      badgeLabel: 'SURFACE ROVER // 0.38g',
    },
    {
      id: 'moon',
      letters: ['M', 'O', 'O', 'N'],
      title: 'Moon Base (NASA Ice Home)',
      artImage: '/assets/showcase/art_moon_icehome@2x.png',
      altText: 'NASA Inflatable Ice Home on Lunar Surface',
      description:
        'NASA Inflatable Ice Home on the Moon: Translucent quilted ice-composite radiation shield, two-story pressurized habitat, airlock vestibule, and LUCI 0.166g lunar combustion test stand.',
      btnText: 'EXPLORE MOON',
      href: '/moon',
      dotIndex: 3,
      badgeLabel: 'LUNAR BASE // 0.166g',
    },
  ];

  return (
    <div className="showcase-viewport">
      {/* 3D Interactive Three.js Stars Particle Background (Framer Stars-2) */}
      <StarsBackground count={3500} size={1.8} color="#e0f2fe" shape="circle" speedX={1.8} speedY={1.8} />

      {/* Top Left NASA Brand Logo */}
      <Link href="/" className="home-top-left-brand" title="NASA Physical Sciences Informatics // Project Pyros">
        <img
          src="/nasa.png"
          alt="NASA Logo"
          className="home-nasa-logo"
        />
      </Link>

      {/* Top Center Title Header */}
      <header className="pyros-home-header">
        <h1 className="pyros-home-title">PROJECT PYROS</h1>
        <p className="pyros-home-desc">
          Select an operational simulation environment to initiate exploration
        </p>
      </header>

      {/* Main Container Showing the 4 Mockup Panels side-by-side */}
      <div className="showcase-stage" onMouseLeave={() => setActiveSlide(null)}>
        {panels.map((panel, idx) => (
          <div
            key={panel.id}
            className={`phone-mockup phone-mockup-${panel.id} ${activeSlide === idx ? 'phone-active' : ''}`}
            onMouseEnter={() => setActiveSlide(idx)}
            onClick={() => setActiveSlide(idx)}
          >
            {/* Phone Screen Glass */}
            <div className="phone-screen">
              {/* Top Status Bar */}
              <div className="phone-status-bar">
                <span className="status-time">9:41</span>
                <div className="status-notch" />
                <div className="status-icons">
                  <span className="status-bracket-tag">[NET: OK]</span>
                </div>
              </div>

              {/* Upper Body: Vertical stacked text & Explorer label */}
              <div className="phone-content-upper">
                {/* Thin vertical 'EXPLORING THE' banner */}
                <div className="exploring-banner">
                  <span className="exploring-text">EXPLORING THE</span>
                </div>

                {/* Giant Bold Vertical Stacked Letters */}
                <div className="letters-stack">
                  {panel.letters.map((char, cIdx) => (
                    <span key={cIdx} className="char-letter">
                      {char}
                    </span>
                  ))}
                </div>

                {/* Right Description Text (Matching image layout) */}
                <div className="panel-desc-box">
                  <p className="panel-desc-text">{panel.description}</p>
                </div>
              </div>

              {/* Lower Section: Planet / Astronaut Artwork */}
              <div className="phone-art-container">
                <img
                  src={panel.artImage}
                  alt={panel.altText}
                  className="phone-art-img"
                  loading="eager"
                />
              </div>

              {/* Bottom Action Button & Pagination */}
              <div className="phone-footer">
                <Link
                  href={panel.href}
                  className="explore-pill-btn"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span>{panel.btnText}</span>
                </Link>

                {/* Pagination Dots */}
                <div className="phone-dots">
                  {panels.map((_, dIdx) => (
                    <span
                      key={dIdx}
                      className={`dot-indicator ${dIdx === panel.dotIndex ? 'active' : ''}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Slide-over Full Menu Modal when Hamburger is Clicked */}
      <div
        className="showcase-menu-modal"
        style={{
          display: activeMenu ? 'flex' : 'none',
          pointerEvents: activeMenu ? 'auto' : 'none',
        }}
      >
        <div className="menu-modal-backdrop" onClick={() => setActiveMenu(false)} />
        <div className="menu-modal-content">
          <div className="modal-header-row">
            <div className="modal-badge">
              <span className="badge-dot-live" />
              <span>NASA PHYSICAL SCIENCES INFORMATICS</span>
            </div>
            <button
              className="modal-close-bracket-btn"
              onClick={() => setActiveMenu(false)}
              title="Close Menu"
            >
              [CLOSE]
            </button>
          </div>

          <h2 className="modal-title">MISSION COMMAND</h2>
          <p className="modal-desc">Select an operational simulation environment to initiate exploration</p>

          <div className="modal-links-grid">
            {panels.map((p) => (
              <Link
                key={p.id}
                href={p.href}
                className="modal-env-link"
                onClick={() => setActiveMenu(false)}
              >
                <div className="env-art-thumb">
                  <img src={p.artImage} alt={p.title} />
                </div>
                <div className="env-info">
                  <span className="env-badge">{p.badgeLabel}</span>
                  <h3 className="env-title">{p.title}</h3>
                  <span className="env-action">[{p.btnText}]</span>
                </div>
              </Link>
            ))}

            {/* 5th Combustion Lab Link */}
            <Link
              href="/combustion"
              className="modal-env-link"
              onClick={() => setActiveMenu(false)}
            >
              <div className="env-art-thumb">
                <img src="/assets/cards/art_combustion@2x.png" alt="Combustion Laboratory" />
              </div>
              <div className="env-info">
                <span className="env-badge" style={{ color: '#c084fc' }}>PHYSICS // MULTI-G</span>
                <h3 className="env-title">Combustion Laboratory</h3>
                <span className="env-action" style={{ color: '#c084fc' }}>[EXPLORE COMBUSTION]</span>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Criteria Audit Modal */}
      <CriteriaAuditModal isOpen={isAuditOpen} onClose={() => setIsAuditOpen(false)} />
    </div>
  );
}
