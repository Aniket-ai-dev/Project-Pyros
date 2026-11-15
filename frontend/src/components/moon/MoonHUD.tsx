'use client';

import React from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function MoonHUD({ isOpen, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <aside id="hud-unified-panel" className="cd-panel-container" style={{ display: 'flex' }}>
      <div className="cd-panel-header">
        <div className="cd-panel-title-group">
          <div className="cd-panel-tag">
            <span className="live-dot" style={{ background: '#38bdf8' }} />
            <span>SHACKLETON CRATER // 0.166g</span>
          </div>
          <h2 className="cd-panel-heading">Lunar Base ECLSS</h2>
        </div>
        <button onClick={onClose} className="cd-panel-close-btn" title="Collapse Panel">
          [CLOSE]
        </button>
      </div>

      <div style={{ padding: '16px', overflowY: 'auto' }}>
        <div className="cd-section">
          <span className="cd-section-title">LUNAR SURFACE TELEMETRY</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px' }}>
            <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>GRAVITY</span>
              <strong style={{ fontSize: '13px', color: '#0f172a' }}>0.166g (1.62 m/s²)</strong>
            </div>
            <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>PRESSURE</span>
              <strong style={{ fontSize: '13px', color: '#0f172a' }}>10⁻¹² Torr (Hard Vacuum)</strong>
            </div>
            <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>SURFACE TEMP</span>
              <strong style={{ fontSize: '13px', color: '#0f172a' }}>-130°C to +120°C</strong>
            </div>
            <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>RADIATION SHIELD</span>
              <strong style={{ fontSize: '13px', color: '#0f172a' }}>Ice-Composite Dome</strong>
            </div>
          </div>
        </div>

        <div className="cd-section" style={{ marginTop: '18px' }}>
          <span className="cd-section-title">0.166g LUNAR COMBUSTION REGIME</span>
          <p className="cd-section-desc" style={{ marginTop: '6px' }}>
            At 1/6th Earth gravity, buoyant convection is dramatically reduced (Rayleigh & Grashof ~0.16). Flames transition into wide, bulbous domes with lazy 2–4 Hz flickers.
          </p>
        </div>
      </div>
    </aside>
  );
}
