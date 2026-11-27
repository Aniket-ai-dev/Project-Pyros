'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { StarsCanvas } from '@/components/ui/stars-canvas';

interface IntroWarpGateProps {
  isVisible: boolean;
  onComplete: () => void;
}

type GatePhase = 'standby' | 'playing' | 'exiting';

const WARP_START_SEC = 3.2;
const WARP_EXIT_SEC = 14.5;
const SAFETY_TIMEOUT_MS = 15000;

export default function IntroWarpGate({ isVisible, onComplete }: IntroWarpGateProps) {
  const [phase, setPhase] = useState<GatePhase>('standby');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const completedRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finishIntro = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setPhase('exiting');
    setTimeout(() => {
      onComplete();
    }, 280);
  }, [onComplete]);

  // Reset standby frame when gate becomes visible (e.g. Replay Intro)
  useEffect(() => {
    if (!isVisible) return;
    completedRef.current = false;
    setPhase('standby');
    const v = videoRef.current;
    if (v) {
      try {
        v.pause();
        v.currentTime = 0.5;
      } catch {
        // Ignore seek errors before metadata loads
      }
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isVisible]);

  const handleEnter = useCallback(async () => {
    if (phase !== 'standby') return;
    setPhase('playing');

    timeoutRef.current = setTimeout(() => {
      finishIntro();
    }, SAFETY_TIMEOUT_MS);

    const v = videoRef.current;
    if (!v) {
      finishIntro();
      return;
    }

    try {
      v.currentTime = WARP_START_SEC;
      await v.play();
    } catch {
      finishIntro();
    }
  }, [phase, finishIntro]);

  useEffect(() => {
    if (!isVisible) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (phase === 'standby' && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        handleEnter();
      } else if (phase === 'playing' && e.key === 'Escape') {
        e.preventDefault();
        finishIntro();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isVisible, phase, handleEnter, finishIntro]);

  if (!isVisible) return null;

  return (
    <div
      id="intro-warp-gate"
      className={`intro-gate-overlay ${phase === 'exiting' ? 'exiting' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Project Pyros Launch Gate"
    >
      <StarsCanvas
        monochrome
        maxStars={1200}
        brightness={1}
        speedMultiplier={1.2}
        twinkleIntensity={20}
        paused={phase !== 'standby'}
        className={`intro-stars-canvas ${phase !== 'standby' ? 'playing' : ''}`}
      />

      <video
        ref={videoRef}
        src="/videos/galaxy_warp.mp4"
        muted
        playsInline
        preload="auto"
        className={`intro-gate-video ${phase !== 'standby' ? 'playing' : ''}`}
        onTimeUpdate={(e) => {
          if (phase === 'playing' && e.currentTarget.currentTime >= WARP_EXIT_SEC) {
            finishIntro();
          }
        }}
        onEnded={finishIntro}
        onError={() => {
          if (phase === 'playing') finishIntro();
        }}
      />

      <div className={`intro-gate-scrim ${phase !== 'standby' ? 'playing' : ''}`} />

      <div className={`intro-nasa-corner ${phase !== 'standby' ? 'faded' : ''}`}>
        <img
          src="/nasa.png"
          alt="NASA Space Apps Challenge"
          className="intro-nasa-logo"
        />
      </div>

      <div className={`intro-center-stage ${phase !== 'standby' ? 'hidden-stage' : ''}`}>
        <h1 className="intro-title-nasal">PROJECT PYROS</h1>
        <p className="intro-subtitle">
          Microgravity combustion and planetary surface research platform
        </p>
        <button
          type="button"
          id="btn-intro-enter"
          className="intro-enter-btn"
          onClick={handleEnter}
        >
          <span>ENTER</span>
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>

      {phase === 'playing' && (
        <button
          type="button"
          id="btn-intro-skip"
          className="intro-skip-btn"
          onClick={finishIntro}
        >
          Skip Warp
        </button>
      )}
    </div>
  );
}
