'use client';

import React from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  simTime: number;
}

export default function RoverHUD({ isOpen, onClose, simTime }: Props) {
  if (!isOpen) return null;

  const stage = simTime < 3.5 ? 1 : simTime < 7.5 ? 2 : simTime < 11.5 ? 3 : simTime < 15.0 ? 4 : 5;
  const pcuTemp =
    stage === 1
      ? 24.5 + simTime * 4
      : stage === 2
      ? 38.5 + (simTime - 3.5) * 15
      : stage === 3
      ? 98.5 + (simTime - 7.5) * 22
      : stage === 4
      ? 186.0 + (simTime - 11.5) * 15
      : 84.0;

  const busCurrent = stage === 4 ? 42.8 : stage === 5 ? 0.0 : 3.4;
  const busVoltage = stage === 5 ? 0.0 : 28.0;

  const stageNames = [
    'Stage 1: Nominal Power Transmission',
    'Stage 2: Dust Layer Thermal Blanket Effect',
    'Stage 3: MOSFET Thermal Runaway (>125°C)',
    'Stage 4: Dielectric Breakdown & Micro-Arc Plasma',
    'Stage 5: Autonomous Solid-State Bus Isolation',
  ];

  return (
    <aside id="hud-unified-panel" className="cd-panel-container" style={{ display: 'flex' }}>
      <div className="cd-panel-header">
        <div className="cd-panel-title-group">
          <div className="cd-panel-tag">
            <span className="live-dot" style={{ background: '#ef4444' }} />
            <span>WARM ELECTRONICS BOX (WEB)</span>
          </div>
          <h2 className="cd-panel-heading">Avionics Diagnostics</h2>
        </div>
        <button onClick={onClose} className="cd-panel-close-btn" title="Collapse Panel" aria-label="Collapse Panel">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div style={{ padding: '16px', overflowY: 'auto' }}>
        <div className="cd-section">
          <span className="cd-section-title">ACTIVE FAILURE REGIME</span>
          <div
            style={{
              marginTop: '8px',
              padding: '10px',
              borderRadius: '8px',
              background: stage >= 4 ? 'rgba(239, 68, 68, 0.12)' : '#f8fafc',
              border: `1px solid ${stage >= 4 ? '#ef4444' : '#e2e8f0'}`,
            }}
          >
            <strong style={{ fontSize: '12.5px', color: stage >= 4 ? '#ef4444' : '#0f172a' }}>
              {stageNames[stage - 1]}
            </strong>
          </div>
        </div>

        <div className="cd-section" style={{ marginTop: '18px' }}>
          <span className="cd-section-title">REAL-TIME CIRCUIT TELEMETRY</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px' }}>
            <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>PCU MOSFET TEMP</span>
              <strong style={{ fontSize: '13px', color: pcuTemp > 125 ? '#ef4444' : '#0f172a' }}>
                {pcuTemp.toFixed(1)}°C
              </strong>
            </div>
            <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>BUS VOLTAGE</span>
              <strong style={{ fontSize: '13px', color: '#0f172a' }}>{busVoltage.toFixed(1)} V DC</strong>
            </div>
            <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>CURRENT DRAW</span>
              <strong style={{ fontSize: '13px', color: busCurrent > 10 ? '#ef4444' : '#0f172a' }}>
                {busCurrent.toFixed(1)} A
              </strong>
            </div>
            <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>ISO SWITCH</span>
              <strong style={{ fontSize: '13px', color: stage === 5 ? '#10b981' : '#f59e0b' }}>
                {stage === 5 ? 'TRIPPED (SAFE)' : 'CLOSED (LIVE)'}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
