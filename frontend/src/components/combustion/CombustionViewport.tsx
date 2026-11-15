'use client';

import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SimulationConfig, GAS_PRESETS } from '@/three/CombustionPhysics.js';
import { WebGL2FluidSolver } from '@/three/WebGL2FluidSolver.js';
import { VolumetricFirePass } from '@/three/VolumetricFirePass.js';
import { ChamberScene } from '@/three/ChamberScene.js';

export interface CombustionHandle {
  triggerSpark: () => void;
  resetSimulation: () => void;
  setBurnerShape: (shape: 'candle' | 'circle' | 'droplet') => void;
  setGravity: (g: number) => void;
  setAmbientOxygen: (o2: number) => void;
  setFuelType: (fuel: string) => void;
}

interface Props {
  onSliceUpdate?: (texture: any) => void;
}

const CombustionViewport = forwardRef<CombustionHandle, Props>(function CombustionViewport(_props, ref) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const appRef = useRef<{
    renderer: THREE.WebGLRenderer | null;
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    controls: OrbitControls | null;
    config: any;
    solver: any;
    chamber: any;
    firePass: any;
    sparkMesh: any;
    sparkActive: boolean;
    sparkTimer: number;
    rafId: number | null;
  }>({
    renderer: null,
    scene: null,
    camera: null,
    controls: null,
    config: null,
    solver: null,
    chamber: null,
    firePass: null,
    sparkMesh: null,
    sparkActive: false,
    sparkTimer: 0,
    rafId: null,
  });

  useImperativeHandle(ref, () => ({
    triggerSpark() {
      const app = appRef.current;
      app.sparkActive = true;
      app.sparkTimer = 0.35;
      if (app.sparkMesh) app.sparkMesh.material.opacity = 1.0;
    },
    resetSimulation() {
      if (appRef.current.solver) appRef.current.solver.reset();
    },
    setBurnerShape(shape: 'candle' | 'circle' | 'droplet') {
      if (appRef.current.config) appRef.current.config.burnerShape = shape;
    },
    setGravity(g: number) {
      if (appRef.current.config) appRef.current.config.gravity = g;
    },
    setAmbientOxygen(o2: number) {
      if (appRef.current.config) appRef.current.config.ambientOxygen = o2;
    },
    setFuelType(fuel: string) {
      if (appRef.current.config) appRef.current.config.fuelType = fuel;
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const config = new SimulationConfig();

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06090e);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 50);
    camera.position.set(0.0, 0.50, 1.85);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0.32, 0);

    const solver = new WebGL2FluidSolver(renderer, config);
    const chamber = new ChamberScene(scene, config);
    const firePass = new VolumetricFirePass(config, solver);
    scene.add(firePass.mesh);

    // Spark line
    const sparkGeo = new THREE.BufferGeometry();
    const positions = new Float32Array([
      0.12 * Math.cos(Math.PI * 0.25), 0.26, 0.12 * Math.sin(Math.PI * 0.25),
      0, 0.26, 0,
      0.12 * Math.cos(Math.PI * 1.25), 0.26, 0.12 * Math.sin(Math.PI * 1.25),
    ]);
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const sparkMat = new THREE.LineBasicMaterial({ color: 0x88e0ff, transparent: true, opacity: 0.0 });
    const sparkMesh = new THREE.Line(sparkGeo, sparkMat);
    scene.add(sparkMesh);

    const app = appRef.current;
    app.renderer = renderer;
    app.scene = scene;
    app.camera = camera;
    app.controls = controls;
    app.config = config;
    app.solver = solver;
    app.chamber = chamber;
    app.firePass = firePass;
    app.sparkMesh = sparkMesh;

    // Initial ignition spark
    app.sparkActive = true;
    app.sparkTimer = 0.35;
    sparkMat.opacity = 1.0;

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    const renderLoop = (timestamp: number) => {
      app.rafId = requestAnimationFrame(renderLoop);
      const time = timestamp * 0.001;

      if (app.sparkActive) {
        app.sparkTimer -= 0.016;
        if (app.sparkTimer <= 0) {
          app.sparkActive = false;
          sparkMat.opacity = 0.0;
        }
      }

      const gasConfig = GAS_PRESETS[config.fuelType] || GAS_PRESETS.propane;

      if (solver && !config.paused) {
        solver.step(gasConfig, app.sparkActive);
      }

      if (firePass) {
        const tex = solver.getScalarTexture();
        firePass.update(time, tex);
      }

      if (chamber) {
        chamber.update(time, 0.75, config.gravity, config.burnerShape, true);
      }

      controls.update();
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

  return <canvas ref={canvasRef} id="canvas-3d" style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', display: 'block', outline: 'none' }} />;
});

export default CombustionViewport;
