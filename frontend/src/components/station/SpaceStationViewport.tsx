'use client';

import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SpaceStationScene } from '@/three/SpaceStationScene.js';

export interface SpaceStationHandle {
  setOxygenLevel: (percent: number) => void;
  setGravity: (g: number) => void;
  setLightingMode: (mode: 'nominal' | 'sleep' | 'emergency') => void;
  transitionToViewpoint: (viewKey: string) => void;
  nudgeObjects: () => void;
  resetObjects: () => void;
}

interface Props {
  oxygenLevel?: number;
  gravity?: number;
  lightingMode?: 'nominal' | 'sleep' | 'emergency';
}

const SpaceStationViewport = forwardRef<SpaceStationHandle, Props>(function SpaceStationViewport(
  { oxygenLevel = 21.0, gravity = 0.0, lightingMode = 'nominal' },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const appRef = useRef<{
    renderer: THREE.WebGLRenderer | null;
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    controls: OrbitControls | null;
    stationScene: any | null;
    rafId: number | null;
    isTransitioning: boolean;
    transitionTime: number;
    transitionDuration: number;
    startCamPos: THREE.Vector3;
    startLookPos: THREE.Vector3;
    transitionMidPos: THREE.Vector3;
    cameraTargetPos: THREE.Vector3;
    cameraLookTarget: THREE.Vector3;
    scratchCurLook: THREE.Vector3;
    lastTimestamp: number;
  }>({
    renderer: null,
    scene: null,
    camera: null,
    controls: null,
    stationScene: null,
    rafId: null,
    isTransitioning: false,
    transitionTime: 0,
    transitionDuration: 1.8,
    startCamPos: new THREE.Vector3(),
    startLookPos: new THREE.Vector3(),
    transitionMidPos: new THREE.Vector3(),
    cameraTargetPos: new THREE.Vector3(),
    cameraLookTarget: new THREE.Vector3(),
    scratchCurLook: new THREE.Vector3(),
    lastTimestamp: 0,
  });

  const viewpoints: Record<string, { pos: THREE.Vector3; target: THREE.Vector3 }> = {
    corridor: {
      pos: new THREE.Vector3(0, 0.08, -4.20),
      target: new THREE.Vector3(0.18, -0.05, 0.50),
    },
    candle: {
      pos: new THREE.Vector3(0.10, -0.05, -3.10),
      target: new THREE.Vector3(0.38, -0.22, -2.20),
    },
    glovebox: {
      pos: new THREE.Vector3(-1.05, 0.48, -0.80),
      target: new THREE.Vector3(-1.80, 0.48, -0.80),
    },
    vents: {
      pos: new THREE.Vector3(0, -0.35, 0.35),
      target: new THREE.Vector3(0, 1.50, -0.40),
    },
    racks: {
      pos: new THREE.Vector3(0.45, 0.10, 1.80),
      target: new THREE.Vector3(1.55, 0.10, 1.80),
    },
    floor: {
      pos: new THREE.Vector3(0, -0.80, 0.60),
      target: new THREE.Vector3(0, -1.48, 0.10),
    },
    hatch: {
      pos: new THREE.Vector3(0, 0.05, 4.20),
      target: new THREE.Vector3(0, 0.0, 9.50),
    },
  };

  useImperativeHandle(ref, () => ({
    setOxygenLevel(percent: number) {
      if (appRef.current.stationScene) {
        appRef.current.stationScene.setOxygenLevel(percent);
      }
    },
    setGravity(g: number) {
      if (appRef.current.stationScene) {
        appRef.current.stationScene.setGravity(g);
      }
    },
    setLightingMode(mode: 'nominal' | 'sleep' | 'emergency') {
      if (appRef.current.stationScene) {
        appRef.current.stationScene.baseLightingMode = mode;
        appRef.current.stationScene.setLightingMode(mode);
      }
    },
    transitionToViewpoint(viewKey: string) {
      const vp = viewpoints[viewKey];
      if (!vp || !appRef.current.camera || !appRef.current.controls) return;
      const app = appRef.current;
      app.startCamPos.copy(app.camera.position);
      app.startLookPos.copy(app.controls.target);
      app.cameraTargetPos.copy(vp.pos);
      app.cameraLookTarget.copy(vp.target);
      app.transitionMidPos.copy(app.startCamPos).lerp(app.cameraTargetPos, 0.5);
      app.transitionMidPos.y += 0.25;
      app.transitionTime = 0.0;
      app.isTransitioning = true;
      app.controls.enabled = false;
    },
    nudgeObjects() {
      if (appRef.current.stationScene) {
        appRef.current.stationScene.nudgeObjects();
      }
    },
    resetObjects() {
      if (appRef.current.stationScene) {
        appRef.current.stationScene.resetObjects();
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
    renderer.toneMappingExposure = 1.15;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06090f);

    const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.05, 50);
    camera.position.set(0, 0.08, -4.2);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(0.18, -0.05, 0.50);
    controls.minDistance = 0.15;
    controls.maxDistance = 10.0;
    controls.maxPolarAngle = Math.PI * 0.96;
    controls.minPolarAngle = Math.PI * 0.04;

    const stationScene = new SpaceStationScene(scene);
    stationScene.setOxygenLevel(oxygenLevel);
    stationScene.setGravity(gravity);
    stationScene.setLightingMode(lightingMode);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      stationScene.interactWithObject(raycaster);
    };
    canvas.addEventListener('pointerdown', onPointerDown);

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
    app.stationScene = stationScene;

    const renderLoop = (timestamp: number) => {
      app.rafId = requestAnimationFrame(renderLoop);
      const time = timestamp * 0.001;
      if (!app.lastTimestamp) app.lastTimestamp = timestamp;
      const dt = Math.min((timestamp - app.lastTimestamp) * 0.001, 0.05);
      app.lastTimestamp = timestamp;

      if (app.isTransitioning) {
        app.transitionTime += dt;
        const rawT = Math.min(1.0, app.transitionTime / app.transitionDuration);
        const ease = rawT < 0.5 ? 4 * rawT * rawT * rawT : 1 - Math.pow(-2 * rawT + 2, 3) / 2;
        const invEase = 1.0 - ease;
        const curX = invEase * invEase * app.startCamPos.x + 2 * invEase * ease * app.transitionMidPos.x + ease * ease * app.cameraTargetPos.x;
        const curY = invEase * invEase * app.startCamPos.y + 2 * invEase * ease * app.transitionMidPos.y + ease * ease * app.cameraTargetPos.y;
        const curZ = invEase * invEase * app.startCamPos.z + 2 * invEase * ease * app.transitionMidPos.z + ease * ease * app.cameraTargetPos.z;
        camera.position.set(curX, curY, curZ);

        const curLook = app.scratchCurLook.lerpVectors(app.startLookPos, app.cameraLookTarget, ease);
        camera.lookAt(curLook);
        controls.target.copy(curLook);

        if (rawT >= 1.0) {
          app.isTransitioning = false;
          camera.position.copy(app.cameraTargetPos);
          controls.target.copy(app.cameraLookTarget);
          camera.lookAt(app.cameraLookTarget);
          controls.enabled = true;
          controls.update();
        }
      } else {
        controls.update();
      }

      stationScene.update(time, dt);
      renderer.render(scene, camera);
    };

    app.rafId = requestAnimationFrame(renderLoop);

    return () => {
      if (app.rafId) cancelAnimationFrame(app.rafId);
      window.removeEventListener('resize', onResize);
      canvas.removeEventListener('pointerdown', onPointerDown);
      renderer.dispose();
      controls.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} id="canvas-station" style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', display: 'block', outline: 'none' }} />;
});

export default SpaceStationViewport;
