'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Props {
  activeView?: string;
  onViewChange?: (view: string) => void;
  onResetCamera?: () => void;
  isHudOpen?: boolean;
  onToggleHud?: () => void;
  onOpenMenu?: () => void;
  onOpenMissions?: () => void;
  onOpenAudit?: () => void;
  onOpenGuide?: () => void;
}

export default function HeaderNav({
  activeView = 'corridor',
  onViewChange,
  onResetCamera,
  isHudOpen = true,
  onToggleHud,
  onOpenMenu,
  onOpenMissions,
  onOpenAudit,
  onOpenGuide,
}: Props) {
  const pathname = usePathname();
  const isStation = pathname === '/' || pathname === '/station';

  return (
    <header className="pyros-capsule-navbar">
      {/* Pinned Left White Circle Badge */}
      <Link href="/" className="capsule-brand-circle" title="Project Pyros Home">
        <svg viewBox="0 0 24 24">
          <path d="M12 2c1.1 0 2 .9 2 2 0 1.2-.8 2.1-1.8 2.6C16.4 8.2 19 11.8 19 16c0 3.9-3.1 7-7 7s-7-3.1-7-7c0-4.2 2.6-7.8 6.8-9.4C10.8 6.1 10 5.2 10 4c0-1.1.9-2 2-2z"/>
        </svg>
      </Link>

      {/* Draggable & Swipeable Horizontal Sliding Track */}
      <div className="capsule-slide-track">
        {/* Home */}
        <Link href="/" className={`capsule-item ${pathname === '/' ? 'active' : ''}`} title="Home Screen">
          <div className="capsule-item-icon">
            <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </div>
          <span className="capsule-item-label">Home</span>
        </Link>

        {isStation && onViewChange && (
          <>
            {[
              { id: 'corridor', label: 'Corridor', icon: <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /> },
              { id: 'glovebox', label: 'Glovebox', icon: <circle cx="12" cy="12" r="3" /> },
              { id: 'candle', label: 'Candle', icon: <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" /> },
              { id: 'vents', label: 'Diffusers', icon: <path d="M9.59 4.59A2 2 0 1 1 11 8H2" /> },
              { id: 'hatch', label: 'Cupola', icon: <circle cx="12" cy="12" r="10" /> },
            ].map((pill) => (
              <button
                key={pill.id}
                onClick={() => onViewChange(pill.id)}
                className={`capsule-item viewpoint-btn ${activeView === pill.id ? 'active' : ''}`}
              >
                <div className="capsule-item-icon">
                  <svg viewBox="0 0 24 24">{pill.icon}</svg>
                </div>
                <span className="capsule-item-label">{pill.label}</span>
              </button>
            ))}
          </>
        )}

        {!isStation && (
          <>
            <Link href="/station" className={`capsule-item ${pathname === '/station' ? 'active' : ''}`}>
              <div className="capsule-item-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M3 12h6M15 12h6M12 3v6M12 15v6"/></svg></div>
              <span className="capsule-item-label">Station</span>
            </Link>
            <Link href="/mars" className={`capsule-item ${pathname === '/mars' ? 'active' : ''}`}>
              <div className="capsule-item-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M16 8l-8 8"/></svg></div>
              <span className="capsule-item-label">Mars</span>
            </Link>
            <Link href="/moon" className={`capsule-item ${pathname === '/moon' ? 'active' : ''}`}>
              <div className="capsule-item-icon"><svg viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg></div>
              <span className="capsule-item-label">Moon</span>
            </Link>
            <Link href="/rover" className={`capsule-item ${pathname === '/rover' ? 'active' : ''}`}>
              <div className="capsule-item-icon"><svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="12" rx="2"/><circle cx="7" cy="19" r="2"/><circle cx="17" cy="19" r="2"/></svg></div>
              <span className="capsule-item-label">Rover</span>
            </Link>
            <Link href="/combustion" className={`capsule-item ${pathname === '/combustion' ? 'active' : ''}`}>
              <div className="capsule-item-icon"><svg viewBox="0 0 24 24"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg></div>
              <span className="capsule-item-label">Physics</span>
            </Link>
          </>
        )}

        {onOpenMissions && (
          <button onClick={onOpenMissions} className="capsule-item" title="22 NASA Investigations Database">
            <div className="capsule-item-icon"><svg viewBox="0 0 24 24"><path d="M10 2v7.31"/><path d="M14 9.3V1.99"/><path d="M8.5 2h7"/><path d="M14 9.3a6.5 6.5 0 1 1-4 0"/></svg></div>
            <span className="capsule-item-label">Missions</span>
          </button>
        )}

        {onOpenAudit && (
          <button onClick={onOpenAudit} className="capsule-item" title="NASA Space Apps Criteria Audit">
            <div className="capsule-item-icon"><svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg></div>
            <span className="capsule-item-label">Audit</span>
          </button>
        )}

        {onOpenGuide && (
          <button onClick={onOpenGuide} className="capsule-item" title="Physics Guide">
            <div className="capsule-item-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>
            <span className="capsule-item-label">Guide</span>
          </button>
        )}

        {onResetCamera && (
          <button onClick={onResetCamera} className="capsule-item" title="Reset Camera View">
            <div className="capsule-item-icon"><svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg></div>
            <span className="capsule-item-label">Reset Cam</span>
          </button>
        )}

        {onToggleHud && (
          <button onClick={onToggleHud} className={`capsule-item ${isHudOpen ? 'active' : ''}`} title="Toggle HUD Controls Panel">
            <div className="capsule-item-icon"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg></div>
            <span className="capsule-item-label">HUD</span>
          </button>
        )}

        <Link href="/" className="capsule-item" title="Return to Home Screen">
          <div className="capsule-item-icon"><svg viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg></div>
          <span className="capsule-item-label">Menu</span>
        </Link>
      </div>
    </header>
  );
}
