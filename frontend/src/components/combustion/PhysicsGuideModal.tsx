'use client';

import React from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function PhysicsGuideModal({ isOpen, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <div id="physics-guide-modal" className="modal-overlay open" style={{ display: 'flex', zIndex: 10000 }}>
      <div className="modal-card" style={{ maxWidth: '840px', width: '92vw', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header">
          <div className="modal-title">
            <span>Microgravity Combustion Physics // Student & Research Guide</span>
          </div>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close Guide">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="modal-body" style={{ overflowY: 'auto', padding: '20px' }}>
          <div className="theory-box">
            <div className="theory-heading">1. Navier-Stokes Buoyancy & Convection</div>
            <p>
              In normal Earth gravity, flames are shaped by buoyant natural convection. Thermal expansion decreases the gas density in the flame zone, creating an upward buoyant force described by the Boussinesq approximation:
            </p>
            <div className="formula-block">ρ (∂u/∂t + u · ∇u) = -∇p + μ ∇²u + ρ₀ β (T - T₀) g</div>
            <p>
              The buoyant upward acceleration draws surrounding air inward and upward, stretching the flame into its familiar <strong>teardrop shape</strong> and driving convective flickering at 10–14 Hz.
            </p>
          </div>

          <div className="theory-box" style={{ marginTop: '16px' }}>
            <div className="theory-heading">2. The ISS Microgravity Spherical Diffusion Regime (g = 0.0)</div>
            <p>
              In orbital freefall aboard the International Space Station (ISS), the effective gravitational acceleration is zero (<strong>g = 0.0 m/s²</strong>). The buoyant term drops out entirely.
            </p>
            <div className="formula-block">Gr → 0 ⟹ ∂Y/∂t = D ∇²Y - ω̇</div>
            <p>
              Combustion becomes purely governed by <strong>isotropic molecular diffusion</strong>. Oxygen diffuses symmetrically from all radial directions toward the wick, and combustion products diffuse outward. Because there is no buoyant draft to stretch the gas, the flame naturally settles into a calm, ethereal <strong>spherical blue diffusion dome</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
