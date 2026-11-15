'use client';

import React from 'react';

interface Props {
  simTime: number;
  onTimeChange: (time: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
}

export default function RoverTimelineControls({ simTime, onTimeChange, isPlaying, onTogglePlay }: Props) {
  const maxTime = 18.0;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '84px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        background: 'rgba(255, 255, 255, 0.94)',
        backdropFilter: 'blur(8px)',
        borderRadius: '50px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 12px 35px rgba(15, 23, 42, 0.08)',
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        width: '90vw',
        maxWidth: '720px',
      }}
    >
      <button
        onClick={onTogglePlay}
        className="cd-tool-btn"
        style={{
          background: isPlaying ? '#ef4444' : '#0284c7',
          color: '#ffffff',
          borderRadius: '20px',
          padding: '6px 14px',
        }}
      >
        <span>{isPlaying ? '[PAUSE]' : '[PLAY FAILURE SIM]'}</span>
      </button>

      <span style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'monospace', color: '#0f172a', minWidth: '45px' }}>
        {simTime.toFixed(1)}s
      </span>

      <input
        type="range"
        min="0"
        max={maxTime}
        step="0.1"
        value={simTime}
        onChange={(e) => onTimeChange(parseFloat(e.target.value))}
        style={{ flex: 1, accentColor: '#0284c7' }}
      />

      <div style={{ display: 'flex', gap: '4px' }}>
        {[
          { label: 'S1', t: 0 },
          { label: 'S2', t: 4.5 },
          { label: 'S3', t: 8.5 },
          { label: 'S4', t: 12.5 },
          { label: 'S5', t: 16.0 },
        ].map((s) => (
          <button
            key={s.label}
            onClick={() => onTimeChange(s.t)}
            style={{
              padding: '3px 8px',
              fontSize: '10.5px',
              fontWeight: 700,
              borderRadius: '4px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              cursor: 'pointer',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
