'use client';

import React from 'react';
import Link from 'next/link';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function CinematicNavigatorModal({ isOpen, onClose }: Props) {
  if (!isOpen) return null;

  const panels = [
    {
      id: 'space',
      letters: ['S', 'P', 'A', 'C', 'E'],
      title: 'Space Station Laboratory',
      artImage: '/assets/showcase/art_astronaut@2x.png',
      altText: 'Astronaut in Microgravity',
      description:
        'Explore the Destiny & Columbus pressurized module with interactive ECLSS atmosphere controls, microgravity candle flames, and the Microgravity Science Glovebox (MSG).',
      btnText: 'EXPLORE SPACE',
      href: '/station',
      dotIndex: 0,
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
    },
  ];

  return (
    <div id="pyros-main-menu" className="pyros-menu-overlay" style={{ display: 'flex', zIndex: 9999 }}>
      <div className="pyros-menu-backdrop" onClick={onClose} />
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 1300, padding: 20 }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 0,
            right: 20,
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.25)',
            color: '#fff',
            borderRadius: '6px',
            padding: '6px 14px',
            fontFamily: 'monospace',
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: 1,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
          }}
          title="Close Menu"
        >
          [CLOSE]
        </button>

        <div className="showcase-stage">
          {panels.map((panel) => (
            <div key={panel.id} className={`phone-mockup phone-mockup-${panel.id}`}>
              <div className="phone-screen">
                <div className="phone-status-bar">
                  <span className="status-time">9:41</span>
                  <div className="status-notch" />
                  <div className="status-icons">
                    <span style={{ fontSize: 9.5, fontFamily: 'monospace', color: '#94a3b8', fontWeight: 700 }}>[NET: OK]</span>
                  </div>
                </div>

                <div className="phone-content-upper">
                  <div className="exploring-banner">
                    <span className="exploring-text">EXPLORING THE</span>
                  </div>

                  <div className="letters-stack">
                    {panel.letters.map((char, cIdx) => (
                      <span key={cIdx} className="char-letter">
                        {char}
                      </span>
                    ))}
                  </div>

                  <div className="panel-desc-box">
                    <p className="panel-desc-text">{panel.description}</p>
                  </div>
                </div>

                <div className="phone-art-container">
                  <img src={panel.artImage} alt={panel.altText} className="phone-art-img" />
                </div>

                <div className="phone-footer">
                  <Link href={panel.href} onClick={onClose} className="explore-pill-btn">
                    <span>{panel.btnText}</span>
                  </Link>

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
      </div>
    </div>
  );
}
