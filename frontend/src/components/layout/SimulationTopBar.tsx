'use client';

import React from 'react';
import Link from 'next/link';
import ControlsPopover, { type ControlShortcut } from './ControlsPopover';

export type SimRouteId = 'station' | 'mars' | 'rover' | 'moon' | 'combustion';

interface SimulationTopBarProps {
  activeRoute: SimRouteId;
  envCode: string;
  shortcuts: ControlShortcut[];
  showExplorerBtn?: boolean;
  showAuditBtn?: boolean;
  showGuideBtn?: boolean;
  showAudioBtn?: boolean;
  showScreenshotBtn?: boolean;
  showHudToggleBtn?: boolean;
  showCombustionDockToggles?: boolean;
  showResetCamBtn?: boolean;
  showFullscreenBtn?: boolean;
}

const ROUTES: { id: SimRouteId; label: string; href: string }[] = [
  { id: 'station', label: 'Orbital', href: '/station' },
  { id: 'mars', label: 'Mars', href: '/mars' },
  { id: 'rover', label: 'Rover', href: '/rover' },
  { id: 'moon', label: 'Moon', href: '/moon' },
  { id: 'combustion', label: 'Physics Lab', href: '/combustion' },
];

export default function SimulationTopBar({
  activeRoute,
  envCode,
  shortcuts,
  showExplorerBtn = false,
  showAuditBtn = true,
  showGuideBtn = false,
  showAudioBtn = false,
  showScreenshotBtn = false,
  showHudToggleBtn = true,
  showCombustionDockToggles = false,
  showResetCamBtn = true,
  showFullscreenBtn = true,
}: SimulationTopBarProps) {
  return (
    <header className="pyros-topbar">
      <div className="topbar-brand-group">
        <Link href="/" className="topbar-brand-link" title="Return to Mission Control portal">
          <img
            src="/logo.png"
            alt="Project Pyros mission patch"
            width={24}
            height={24}
            style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
          />
          <span className="topbar-wordmark">Project Pyros</span>
        </Link>
        <span className="topbar-env-tag">{envCode}</span>
      </div>

      <nav className="topbar-nav-links" aria-label="Simulation environments">
        {ROUTES.map((r) => (
          <Link
            key={r.id}
            href={r.href}
            className={`topbar-nav-item ${activeRoute === r.id ? 'active' : ''}`}
          >
            <span className="topbar-nav-dot" />
            <span>{r.label}</span>
          </Link>
        ))}
      </nav>

      <div className="topbar-tools">
        {showExplorerBtn && (
          <button
            type="button"
            id="btn-open-nasa-explorer"
            className="topbar-btn"
            title="Open NASA 22-investigation flight archive"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M3 5v14a9 3 0 0 0 18 0V5" />
              <path d="M3 12a9 3 0 0 0 18 0" />
            </svg>
            <span className="topbar-btn-label">Archive</span>
          </button>
        )}

        {showAuditBtn && (
          <button
            type="button"
            id="btn-criteria-audit"
            className="topbar-btn"
            title="NASA fire-safety and physics verification"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            <span className="topbar-btn-label">Audit</span>
          </button>
        )}

        {showGuideBtn && (
          <button
            type="button"
            id="btn-open-guide"
            className="topbar-btn"
            title="Open dimensionless number and flame physics guide"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            </svg>
            <span className="topbar-btn-label">Physics Guide</span>
          </button>
        )}

        {showAudioBtn && (
          <button
            type="button"
            id="btn-toggle-audio"
            className="topbar-btn"
            title="Toggle synthesized electrical arc telemetry audio"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
            <span className="topbar-btn-label">Audio</span>
          </button>
        )}

        {showScreenshotBtn && (
          <button
            type="button"
            id="btn-screenshot"
            className="topbar-btn topbar-btn-icon"
            title="Capture high-res PNG snapshot"
            aria-label="Capture snapshot"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
              <circle cx="12" cy="13" r="3" />
            </svg>
          </button>
        )}

        {showResetCamBtn && (
          <button
            type="button"
            id="btn-reset-cam"
            className="topbar-btn topbar-btn-icon"
            title="Reset viewport camera"
            aria-label="Reset camera"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>
        )}

        {showCombustionDockToggles && (
          <>
            <button
              type="button"
              id="btn-toggle-telemetry"
              className="topbar-btn active"
              title="Toggle Telemetry HUD dock"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18" />
                <path d="m19 9-5 5-4-4-3 3" />
              </svg>
              <span className="topbar-btn-label">Telemetry</span>
            </button>
            <button
              type="button"
              id="btn-toggle-controls"
              className="topbar-btn active"
              title="Toggle Physics Parameters dock"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="21" x2="4" y2="14" />
                <line x1="4" y1="10" x2="4" y2="3" />
                <line x1="12" y1="21" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12" y2="3" />
                <line x1="20" y1="21" x2="20" y2="16" />
                <line x1="20" y1="12" x2="20" y2="3" />
                <line x1="2" y1="14" x2="6" y2="14" />
                <line x1="10" y1="8" x2="14" y2="8" />
                <line x1="18" y1="16" x2="22" y2="16" />
              </svg>
              <span className="topbar-btn-label">Parameters</span>
            </button>
          </>
        )}

        {showHudToggleBtn && (
          <button
            type="button"
            id="btn-toggle-hud"
            className="topbar-btn active"
            title="Toggle telemetry HUD"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 3v18" />
            </svg>
            <span className="topbar-btn-label">HUD</span>
          </button>
        )}

        <ControlsPopover shortcuts={shortcuts} />

        {showFullscreenBtn && (
          <button
            type="button"
            id="btn-fullscreen"
            className="topbar-btn topbar-btn-icon"
            title="Toggle fullscreen"
            aria-label="Toggle fullscreen"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
          </button>
        )}
      </div>
    </header>
  );
}
