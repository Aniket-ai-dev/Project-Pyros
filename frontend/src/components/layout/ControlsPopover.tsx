'use client';

import React, { useState, useEffect } from 'react';

export interface ControlShortcut {
  keys: string[];
  action: string;
}

interface ControlsPopoverProps {
  shortcuts: ControlShortcut[];
  isOpen?: boolean;
  onToggle?: () => void;
}

export default function ControlsPopover({
  shortcuts,
  isOpen: controlledOpen,
  onToggle,
}: ControlsPopoverProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const toggle = () => {
    if (onToggle) onToggle();
    else setInternalOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'h' || e.key === 'H' || e.key === '?') {
        toggle();
      } else if (e.key === 'Escape' && open) {
        if (onToggle) onToggle();
        else setInternalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onToggle]);

  return (
    <div className="controls-popover-wrap">
      <button
        type="button"
        className={`topbar-btn ${open ? 'active' : ''}`}
        onClick={toggle}
        aria-expanded={open}
        title="Navigation shortcuts (H)"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10" />
        </svg>
        <span className="topbar-btn-label">Controls</span>
      </button>

      {open && (
        <div className="pyros-controls-popover" role="dialog" aria-label="Viewport navigation controls">
          <div className="popover-header">
            <span>Navigation controls</span>
            <span className="kbd-cap">H to toggle</span>
          </div>
          <div className="popover-list">
            {shortcuts.map((row, idx) => (
              <div className="popover-row" key={idx}>
                <span>{row.action}</span>
                <div className="kbd-group">
                  {row.keys.map((k, ki) => (
                    <kbd className="kbd-cap" key={ki}>
                      {k}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
