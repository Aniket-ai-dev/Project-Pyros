'use client';

import React from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onViewChange: (view: 'panorama' | 'habitat' | 'chamber' | 'dunes') => void;
}

export default function MarsHUD({ isOpen, onClose, onViewChange }: Props) {
  if (!isOpen) return null;

  return (
    <aside id="hud-unified-panel" className="cd-panel-container" style={{ display: 'flex' }}>
      <div className="cd-panel-header">
        <div className="cd-panel-title-group">
          <div className="cd-panel-tag">
            <span className="live-dot" style={{ background: '#f97316' }} />
            <span>JEZERO CRATER OUTPOST // 0.38g</span>
          </div>
          <h2 className="cd-panel-heading">Mars Surface ECLSS</h2>
        </div>
        <button onClick={onClose} className="cd-panel-close-btn" title="Collapse Panel">
          [CLOSE]
        </button>
      </div>

      <div style={{ padding: '16px', overflowY: 'auto' }}>
        <div className="cd-section">
          <span className="cd-section-title">PLANETARY TELEMETRY</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px' }}>
            <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>GRAVITY</span>
              <strong style={{ fontSize: '13px', color: '#0f172a' }}>0.38g (3.72 m/s²)</strong>
            </div>
            <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>PRESSURE</span>
              <strong style={{ fontSize: '13px', color: '#0f172a' }}>0.636 kPa (6.3 mbar)</strong>
            </div>
            <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>SURFACE TEMP</span>
              <strong style={{ fontSize: '13px', color: '#0f172a' }}>-62.5°C</strong>
            </div>
            <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>WIND SPEED</span>
              <strong style={{ fontSize: '13px', color: '#0f172a' }}>6.4 m/s (Eolian)</strong>
            </div>
          </div>
        </div>

        <div className="cd-section" style={{ marginTop: '18px' }}>
          <span className="cd-section-title">CINEMATIC OUTPOST VIEWS</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
            {[
              { id: 'panorama', label: 'Panorama: Habitat Complex' },
              { id: 'habitat', label: 'NASA Ice Home Dome' },
              { id: 'chamber', label: '0.38g Surface Combustion Rig' },
              { id: 'dunes', label: 'Jezero Transverse Dunes' },
            ].map((v) => (
              <button
                key={v.id}
                onClick={() => onViewChange(v.id as any)}
                className="cd-nav-pill"
                style={{ textAlign: 'left', padding: '8px 12px', justifyContent: 'flex-start' }}
              >
                <span>{v.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
