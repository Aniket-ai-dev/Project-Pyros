'use client';

import React, { useState, useEffect } from 'react';
import { NASADataService } from '@/services/NASADataService.js';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectInvestigation?: (inv: any) => void;
}

export default function InvestigationExplorerModal({ isOpen, onClose, onSelectInvestigation }: Props) {
  const [investigations, setInvestigations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedInv, setSelectedInv] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    const service = new NASADataService();
    service
      .getInvestigations()
      .then((data: any) => {
        const list = Array.isArray(data) ? data : data.investigations || [];
        setInvestigations(list);
      })
      .catch(() => {
        // Fallback to embedded investigations in NASADataService
        setInvestigations([]);
      })
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const categories = ['ALL', 'CANDLE', 'DROPLET', 'SOLID', 'SMOLDER', 'GASEOUS', 'CIR / FLEX'];

  const filtered = investigations.filter((inv) => {
    const title = (inv.title || inv.name || '').toLowerCase();
    const desc = (inv.description || inv.summary || '').toLowerCase();
    const app = (inv.apparatus || inv.hardware || '').toLowerCase();
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || title.includes(q) || desc.includes(q) || app.includes(q);

    if (!matchesSearch) return false;
    if (selectedCategory === 'ALL') return true;
    if (selectedCategory === 'CANDLE') return title.includes('candle') || desc.includes('candle') || app.includes('candle');
    if (selectedCategory === 'DROPLET') return title.includes('droplet') || desc.includes('droplet') || title.includes('flex');
    if (selectedCategory === 'SOLID') return title.includes('solid') || desc.includes('solid') || title.includes('bass');
    if (selectedCategory === 'SMOLDER') return title.includes('smolder') || desc.includes('smolder');
    if (selectedCategory === 'GASEOUS') return title.includes('gas') || desc.includes('gas') || title.includes('acme');
    if (selectedCategory === 'CIR / FLEX') return app.includes('cir') || app.includes('flex') || desc.includes('cir');
    return true;
  });

  return (
    <div className="modal-overlay open" style={{ display: 'flex', zIndex: 10000 }}>
      <div className="modal-card" style={{ maxWidth: '960px', width: '92vw', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}>
        {/* Modal Header */}
        <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="live-dot" style={{ background: '#38bdf8' }} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', letterSpacing: '0.05em' }}>
                NASA PHYSICAL SCIENCES INFORMATICS (PSI)
              </span>
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '4px 0 0', color: '#0f172a' }}>
              22 Flight Combustion Investigations Database
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="modal-close-btn" 
            aria-label="Close Modal"
            style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              border: '1px solid #e2e8f0', 
              background: '#ffffff', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: '#64748b',
              transition: 'all 0.15s ease' 
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Search & Category Filter Bar */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search experiments by name, apparatus, or fuel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: '1 1 240px',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '12.5px',
              outline: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '5px 10px',
                  borderRadius: '20px',
                  border: '1px solid',
                  borderColor: selectedCategory === cat ? '#38bdf8' : '#e2e8f0',
                  background: selectedCategory === cat ? 'rgba(56, 189, 248, 0.12)' : '#ffffff',
                  color: selectedCategory === cat ? '#0284c7' : '#64748b',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Investigations Grid & Details Modal Body */}
        <div 
          className="investigations-modal-grid-body"
          style={{ 
            padding: '16px', 
            overflowY: 'auto', 
            flex: 1, 
            display: 'grid', 
            gridTemplateColumns: selectedInv ? 'repeat(auto-fit, minmax(280px, 1fr))' : 'repeat(auto-fill, minmax(260px, 1fr))', 
            gap: '12px' 
          }}
        >
          {loading ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#64748b' }}>
              Loading NASA PSI Flight Investigations...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#64748b' }}>
              No flight investigations match your search.
            </div>
          ) : (
            filtered.map((inv, idx) => (
              <div
                key={inv.id || idx}
                onClick={() => setSelectedInv(inv)}
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  border: '1px solid',
                  borderColor: selectedInv === inv ? '#38bdf8' : '#e2e8f0',
                  background: selectedInv === inv ? '#f0f9ff' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#0284c7', background: 'rgba(56, 189, 248, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                      {inv.apparatus || inv.hardware || 'NASA ISS / MSG'}
                    </span>
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>{inv.id || `EXP-${idx + 1}`}</span>
                  </div>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 6px', color: '#0f172a' }}>
                    {inv.title || inv.name}
                  </h4>
                  <p style={{ fontSize: '11.5px', color: '#64748b', margin: 0, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {inv.description || inv.summary}
                  </p>
                </div>
                <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10.5px', color: '#64748b' }}>Fuel: {inv.fuel || 'Hydrocarbon / Wax'}</span>
                  <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 600 }}>Inspect →</span>
                </div>
              </div>
            ))
          )}

          {/* Slide-out detail view if selected */}
          {selectedInv && (
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #38bdf8',
                borderRadius: '12px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'sticky',
                top: 0,
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#0284c7' }}>
                    {selectedInv.apparatus || 'NASA ISS Facility'}
                  </span>
                  <button 
                    onClick={() => setSelectedInv(null)} 
                    aria-label="Close Dossier"
                    style={{ 
                      width: '28px', 
                      height: '28px', 
                      borderRadius: '50%', 
                      border: '1px solid #e2e8f0', 
                      background: '#ffffff', 
                      cursor: 'pointer', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      color: '#64748b' 
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '8px 0', color: '#0f172a' }}>
                  {selectedInv.title || selectedInv.name}
                </h3>
                <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.6, margin: '10px 0' }}>
                  {selectedInv.description || selectedInv.summary}
                </div>

                {selectedInv.key_findings && (
                  <div style={{ marginTop: '12px', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a' }}>KEY SCIENTIFIC FINDINGS:</span>
                    <p style={{ fontSize: '11.5px', color: '#475569', margin: '4px 0 0', lineHeight: 1.5 }}>
                      {selectedInv.key_findings}
                    </p>
                  </div>
                )}
              </div>

              <div style={{ marginTop: '16px' }}>
                <button
                  onClick={() => {
                    onSelectInvestigation?.(selectedInv);
                    onClose();
                  }}
                  className="scene-launch-btn"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <span>Apply Conditions to Simulation</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
