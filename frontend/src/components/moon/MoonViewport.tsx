'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MoonBaseScene } from '@/three/MoonBaseScene.js';

export default function MoonViewport() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 800);
    camera.position.set(-6.2, 6.8, 29.0);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.target.set(0.0, 2.4, 0.0);
    controls.maxPolarAngle = Math.PI * 0.495;

    const moonScene = new MoonBaseScene(scene);

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    let lastTimestamp = performance.now();
    let rafId: number;

    const renderLoop = (timestamp: number) => {
      rafId = requestAnimationFrame(renderLoop);
      const delta = Math.min((timestamp - lastTimestamp) / 1000.0, 0.1);
      lastTimestamp = timestamp;
      const t = timestamp * 0.001;

      controls.update();
      moonScene.update(delta, t);
      renderer.render(scene, camera);
    };

    rafId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      controls.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} id="canvas-moon" style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', display: 'block', outline: 'none' }} />;
}
