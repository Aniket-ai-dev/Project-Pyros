'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface StarsBackgroundProps {
  count?: number;
  size?: number;
  color?: string;
  shape?: 'circle' | 'star' | 'square';
  sceneDepth?: number;
  cameraDepth?: number;
  speedX?: number;
  speedY?: number;
  className?: string;
}

export default function StarsBackground({
  count = 3500,
  size = 1.8,
  color = '#e0f2fe',
  shape = 'circle',
  sceneDepth = 2000,
  cameraDepth = 1000,
  speedX = 2.0,
  speedY = 2.0,
  className = '',
}: StarsBackgroundProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !mountRef.current) return;

    let isActive = true;
    const mountNode = mountRef.current;
    const width = mountNode.clientWidth || window.innerWidth;
    const height = mountNode.clientHeight || window.innerHeight;

    // 1. Setup Camera
    const farPlane = cameraDepth || 1000;
    const camera = new THREE.PerspectiveCamera(75, width / height, 1, farPlane);
    camera.position.z = farPlane / 2;

    // 2. Setup Scene
    const scene = new THREE.Scene();

    // 3. Setup WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setClearColor(0x000000, 0); // Transparent so radial space gradient shines through
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.inset = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.pointerEvents = 'none';

    mountNode.appendChild(renderer.domElement);

    // 4. Create Star Geometry
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const halfDepth = (sceneDepth || 2000) / 2;

    for (let i = 0; i < count; i++) {
      positions[i * 3] = Math.random() * sceneDepth - halfDepth;
      positions[i * 3 + 1] = Math.random() * sceneDepth - halfDepth;
      positions[i * 3 + 2] = Math.random() * sceneDepth - halfDepth;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // 5. Generate Procedural Star Texture with soft glow falloff
    function createTexture(shapeType: string) {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.fillStyle = '#ffffff';

      if (shapeType === 'circle') {
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.25, 'rgba(235, 248, 255, 0.85)');
        gradient.addColorStop(0.6, 'rgba(125, 211, 252, 0.25)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(32, 32, 30, 0, Math.PI * 2);
        ctx.fill();
      } else if (shapeType === 'star') {
        const path = new Path2D(`
          M32 2 L41 22 L62 25 L47 40 L50 62 L32 52 L14 62 L17 40 L2 25 L23 22 Z
        `);
        ctx.fill(path);
      } else {
        ctx.fillRect(4, 4, 56, 56);
      }

      return new THREE.CanvasTexture(canvas);
    }

    const starTexture = createTexture(shape);

    const material = new THREE.PointsMaterial({
      size: size,
      map: starTexture || null,
      color: new THREE.Color(color),
      transparent: true,
      depthWrite: false,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
    });

    const stars = new THREE.Points(geometry, material);
    scene.add(stars);

    // 6. Interactive Mouse Movement Tracking (Desktop Parallax)
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX - window.innerWidth / 2;
      mouseRef.current.y = e.clientY - window.innerHeight / 2;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // 7. Window Resize Handler
    const handleResize = () => {
      if (!mountNode) return;
      const w = mountNode.clientWidth || window.innerWidth;
      const h = mountNode.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // 8. Continuous Render Loop with Camera Lerp Inertia
    const velX = (speedX ?? 2) * 0.0005;
    const velY = (speedY ?? 2) * 0.0005;

    const animate = () => {
      if (!isActive) return;
      animFrameRef.current = requestAnimationFrame(animate);

      // Smooth camera parallax drift
      camera.position.x += (mouseRef.current.x - camera.position.x) * velX;
      camera.position.y += (-mouseRef.current.y - camera.position.y) * velY;
      camera.lookAt(scene.position);

      // Subtle slow rotation of the celestial sphere
      stars.rotation.y += 0.0002;
      stars.rotation.x += 0.0001;

      renderer.render(scene, camera);
    };

    animate();

    // 9. Cleanup on Unmount
    return () => {
      isActive = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);

      geometry.dispose();
      material.dispose();
      if (starTexture) starTexture.dispose();
      renderer.dispose();

      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [count, size, color, shape, sceneDepth, cameraDepth, speedX, speedY]);

  return (
    <div
      ref={mountRef}
      className={`stars-background-container ${className}`}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  );
}
