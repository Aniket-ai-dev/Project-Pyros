'use client';

import React from 'react';

interface Props {
  shape: 'candle' | 'circle' | 'droplet';
  onShapeChange: (s: 'candle' | 'circle' | 'droplet') => void;
  onTriggerSpark: () => void;
  onReset: () => void;
  onGravityChange: (g: number) => void;
  onOxygenChange: (o2: number) => void;
  onFuelChange: (f: string) => void;
}

export default function CombustionControls({
  shape,
  onShapeChange,
  onTriggerSpark,
  onReset,
  onGravityChange,
  onOxygenChange,
  onFuelChange,
}: Props) {
  return (
    <div
      style={{
        position: 'fixed',
        top: '80px',
        right: '20px',
        width: '320px',
        background: 'rgba(15, 23, 42, 0.88)',
        backdropFilter: 'blur(8px)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        color: '#ffffff',
        padding: '16px',
        zIndex: 90,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8' }}>APPARATUS GEOMETRY</span>
      </div>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
        {[
          { id: 'candle', label: 'Candle Flame' },
          { id: 'circle', label: 'Burner Jet' },
          { id: 'droplet', label: 'Droplet' },
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => onShapeChange(btn.id as any)}
            style={{
              flex: 1,
              padding: '6px 8px',
              fontSize: '11px',
              borderRadius: '8px',
              border: shape === btn.id ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
              background: shape === btn.id ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.05)',
              color: '#ffffff',
              cursor: 'pointer',
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: '14px' }}>
        <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>FUEL PRESET</span>
        <select
          onChange={(e) => onFuelChange(e.target.value)}
          style={{
            width: '100%',
            padding: '6px 10px',
            borderRadius: '6px',
            background: '#1e293b',
            color: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            fontSize: '12px',
          }}
        >
          <option value="candleWax">Paraffin Wax (Candle)</option>
          <option value="propane">Propane (CIR Burner)</option>
          <option value="methane">Methane (CH4)</option>
          <option value="heptane">Heptane (Droplet FLEX)</option>
        </select>
      </div>

      <div style={{ marginBottom: '14px' }}>
        <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>GRAVITATIONAL ACCELERATION</span>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { label: '0.00g (ISS)', g: 0.0 },
            { label: '0.166g (Moon)', g: 1.62 },
            { label: '0.38g (Mars)', g: 3.72 },
            { label: '1.00g (Earth)', g: 9.81 },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => onGravityChange(item.g)}
              style={{
                flex: 1,
                padding: '5px',
                fontSize: '10px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
        <button
          onClick={onTriggerSpark}
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            color: '#ffffff',
            border: 'none',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          [PILOT SPARK]
        </button>
        <button
          onClick={onReset}
          style={{
            padding: '8px 14px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.1)',
            color: '#ffffff',
            border: 'none',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          [RESET]
        </button>
      </div>
    </div>
  );
}
