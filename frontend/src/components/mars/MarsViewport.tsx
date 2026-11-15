'use client';

import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MarsSurfaceScene } from '@/three/MarsSurfaceScene.js';

export interface MarsHandle {
  transitionToView: (view: 'panorama' | 'habitat' | 'chamber' | 'dunes') => void;
}

const MarsViewport = forwardRef<MarsHandle, {}>(function MarsViewport(_props, ref) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const appRef = useRef<{
    renderer: THREE.WebGLRenderer | null;
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    controls: OrbitControls | null;
    marsScene: any | null;
    rafId: number | null;
    lastTimestamp: number;
    isTransitioning: boolean;
    transitionStart: number;
    camStartPos: THREE.Vector3;
    camEndPos: THREE.Vector3;
    targetStart: THREE.Vector3;
    targetEnd: THREE.Vector3;
  }>({
    renderer: null,
    scene: null,
    camera: null,
    controls: null,
    marsScene: null,
    rafId: null,
    lastTimestamp: 0,
    isTransitioning: false,
    transitionStart: 0,
    camStartPos: new THREE.Vector3(),
    camEndPos: new THREE.Vector3(),
    targetStart: new THREE.Vector3(),
    targetEnd: new THREE.Vector3(),
  });

  const views = {
    panorama: { pos: new THREE.Vector3(0.5, 3.8, 19.5), target: new THREE.Vector3(0, 2.5, 0) },
    habitat: { pos: new THREE.Vector3(-1.8, 2.2, 5.2), target: new THREE.Vector3(0, 2.0, 0) },
    chamber: { pos: new THREE.Vector3(12.2, 1.6, -4.5), target: new THREE.Vector3(13.8, 1.2, -6.0) },
    dunes: { pos: new THREE.Vector3(22.0, 4.5, 28.0), target: new THREE.Vector3(0, 0, 0) },
  };

  useImperativeHandle(ref, () => ({
    transitionToView(view: 'panorama' | 'habitat' | 'chamber' | 'dunes') {
      const v = views[view];
      const app = appRef.current;
      if (!v || !app.camera || !app.controls) return;
      app.camStartPos.copy(app.camera.position);
      app.camEndPos.copy(v.pos);
      app.targetStart.copy(app.controls.target);
      app.targetEnd.copy(v.target);
      app.transitionStart = performance.now();
      app.isTransitioning = true;
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
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 600);
    camera.position.set(0.5, 3.8, 19.5);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.target.set(0, 2.5, 0);
    controls.maxPolarAngle = Math.PI * 0.495;
    controls.minDistance = 1.0;
    controls.maxDistance = 120.0;

    const marsScene = new MarsSurfaceScene(scene);

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
    app.marsScene = marsScene;
    app.lastTimestamp = performance.now();

    const renderLoop = () => {
      app.rafId = requestAnimationFrame(renderLoop);
      const now = performance.now();
      const dt = Math.min((now - app.lastTimestamp) / 1000, 0.05);
      app.lastTimestamp = now;

      if (app.isTransitioning) {
        const elapsed = (now - app.transitionStart) / 1000;
        const progress = Math.min(elapsed / 1.6, 1.0);
        const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        camera.position.lerpVectors(app.camStartPos, app.camEndPos, ease);
        controls.target.lerpVectors(app.targetStart, app.targetEnd, ease);
        controls.update();
        if (progress >= 1.0) app.isTransitioning = false;
      } else {
        controls.update();
      }

      marsScene.update(now * 0.001, dt);
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

  return <canvas ref={canvasRef} id="canvas-mars" style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', display: 'block', outline: 'none' }} />;
});

export default MarsViewport;
