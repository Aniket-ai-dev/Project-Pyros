'use client';

import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoverCircuitScene } from '@/three/RoverCircuitScene.js';

export interface RoverHandle {
  setSimTime: (t: number) => void;
  toggleBusIsolation: () => void;
}

interface Props {
  simTime?: number;
}

const RoverViewport = forwardRef<RoverHandle, Props>(function RoverViewport({ simTime = 0 }, ref) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const appRef = useRef<{
    renderer: THREE.WebGLRenderer | null;
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    controls: OrbitControls | null;
    roverScene: any | null;
    rafId: number | null;
    lastTimestamp: number;
  }>({
    renderer: null,
    scene: null,
    camera: null,
    controls: null,
    roverScene: null,
    rafId: null,
    lastTimestamp: 0,
  });

  useImperativeHandle(ref, () => ({
    setSimTime(t: number) {
      if (appRef.current.roverScene) {
        // Evaluate simulation stage based on time
        const s = appRef.current.roverScene;
        if (t < 3.5) {
          s.simState.stage = 1;
          s.simState.pcuTemp = 24.5 + t * 4;
          s.simState.sparksActive = false;
        } else if (t < 7.5) {
          s.simState.stage = 2;
          s.simState.pcuTemp = 38.5 + (t - 3.5) * 15;
          s.simState.sparksActive = false;
        } else if (t < 11.5) {
          s.simState.stage = 3;
          s.simState.pcuTemp = 98.5 + (t - 7.5) * 22;
          s.simState.sparksActive = false;
        } else if (t < 15.0) {
          s.simState.stage = 4;
          s.simState.pcuTemp = 186.0 + (t - 11.5) * 15;
          s.simState.sparksActive = true;
        } else {
          s.simState.stage = 5;
          s.simState.isolationTripped = true;
          s.simState.sparksActive = false;
        }
      }
    },
    toggleBusIsolation() {
      if (appRef.current.roverScene) {
        appRef.current.roverScene.simState.isolationTripped = !appRef.current.roverScene.simState.isolationTripped;
      }
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060c09);

    const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.02, 25);
    camera.position.set(0.0, 0.32, 0.52);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(0, 0.04, 0);

    const roverScene = new RoverCircuitScene(scene);

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    const app = appRef.current;
    app.renderer = renderer;
    app.scene = scene;
    app.camera = camera;
    app.controls = controls;
    app.roverScene = roverScene;
    app.lastTimestamp = performance.now();

    const renderLoop = (timestamp: number) => {
      app.rafId = requestAnimationFrame(renderLoop);
      const dt = app.lastTimestamp ? Math.min(0.1, (timestamp - app.lastTimestamp) / 1000) : 0.016;
      app.lastTimestamp = timestamp;

      controls.update();
      roverScene.update(dt, timestamp * 0.001);
      renderer.render(scene, camera);
    };

    app.rafId = requestAnimationFrame(renderLoop);

    return () => {
      if (app.rafId) cancelAnimationFrame(app.rafId);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      controls.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} id="canvas-rover" style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', display: 'block', outline: 'none' }} />;
});

export default RoverViewport;
