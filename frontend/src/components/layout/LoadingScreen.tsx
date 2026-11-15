'use client';

import React, { useState, useEffect } from 'react';

interface Props {
  onComplete?: () => void;
}

export default function LoadingScreen({ onComplete }: Props) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('INITIALIZING ORBITAL SIMULATION MODULES...');
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const milestones = [
      { pct: 15, msg: 'LOADING DESTINY & COLUMBUS MODULE GEOMETRY...' },
      { pct: 35, msg: 'INITIALIZING 3D PBR MATERIALS & LIGHTING FIXTURES...' },
      { pct: 55, msg: 'CALIBRATING MICROGRAVITY DIFFUSION COMBUSTION KINETICS...' },
      { pct: 75, msg: 'ESTABLISHING ECLSS LIFE SUPPORT AIRFLOW VECTOR DYNAMICS...' },
      { pct: 90, msg: 'CONNECTING NASA PHYSICAL SCIENCES INFORMATICS ENGINE...' },
      { pct: 100, msg: 'SYSTEM READY // ORBITAL INITIALIZATION COMPLETE' },
    ];

    let currentIdx = 0;
    const interval = setInterval(() => {
      if (currentIdx < milestones.length) {
        setProgress(milestones[currentIdx].pct);
        setStatusText(milestones[currentIdx].msg);
        currentIdx++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setHidden(true);
          onComplete?.();
        }, 350);
      }
    }, 180);

    return () => clearInterval(interval);
  }, [onComplete]);

  if (hidden) return null;

  return (
    <div
      id="pyros-loading-screen"
      className="pyros-loader-overlay"
      onClick={() => {
        setHidden(true);
        onComplete?.();
      }}
    >
      <div className="pyros-loader-content">
        <div className="pyros-emblem-emblem">
          <div className="pyros-emblem-glow" />
          <div className="pyros-emblem-ring" />
          <div style={{ fontSize: '20px', fontWeight: 'bold', letterSpacing: '3px', color: '#38bdf8', fontFamily: 'monospace' }}>
            [PYROS]
          </div>
        </div>

        <div className="pyros-loader-text-group">
          <span className="pyros-loader-subtitle">NASA MICROGRAVITY SIMULATION PLATFORM</span>
          <h1 className="pyros-loader-title">PROJECT PYROS</h1>
          <p className="pyros-loader-tagline">Orbital Space Station & Combustion Intelligence</p>
        </div>

        <div className="pyros-loader-progress-box">
          <div className="pyros-loader-bar-track">
            <div
              id="pyros-loader-bar-fill"
              className="pyros-loader-bar-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="pyros-loader-status-row">
            <span id="pyros-loader-status-text" className="pyros-loader-status">
              {statusText}
            </span>
            <span id="pyros-loader-percent" className="pyros-loader-percent">
              {progress}%
            </span>
          </div>
        </div>

        <button className="pyros-loader-skip-btn">Click anywhere to skip</button>
      </div>
    </div>
  );
}
