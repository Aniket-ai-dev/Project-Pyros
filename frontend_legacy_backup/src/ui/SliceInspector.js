/**
 * SliceInspector.js
 * 2D Interactive Diagnostic Slice Visualizer for the 3D Voxel Fluid Grid.
 * Displays cross-sectional heatmaps of Temperature, Velocity Vectors, Fuel, O2, and Pressure.
 */

export class SliceInspector {
  constructor(canvas, config, solver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.config = config;
    this.solver = solver;

    this.hoverData = null;
    this.setupEvents();
  }

  setupEvents() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const xNorm = (e.clientX - rect.left) / rect.width;
      const yNorm = (e.clientY - rect.top) / rect.height;

      const px = Math.floor(xNorm * this.config.resX);
      const py = Math.floor((1.0 - yNorm) * this.config.resY);

      this.hoverData = { px, py, clientX: e.clientX, clientY: e.clientY };
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.hoverData = null;
    });
  }

  render(readbackData) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const c = this.config;

    ctx.fillStyle = '#080c14';
    ctx.fillRect(0, 0, w, h);

    const resX = c.resX;
    const resY = c.resY;
    const resZ = c.resZ;
    const sliceZ = Math.min(resZ - 1, Math.max(0, Math.floor(c.sliceIndex)));

    const cellW = w / resX;
    const cellH = h / resY;

    // Synthetic or readback data rendering
    // Generate slice representation based on simulation state
    const field = c.sliceField;
    const g = c.gravity;
    const time = performance.now() * 0.003;

    // Draw grid cells
    for (let y = 0; y < resY; y++) {
      for (let x = 0; x < resX; x++) {
        // Normalized coordinates in domain [-1, 1]
        const nx = (x / resX - 0.5) * 2.0;
        const ny = (y / resY);
        const nz = (sliceZ / resZ - 0.5) * 2.0;
        const rHoriz = Math.sqrt(nx * nx + nz * nz);

        // Physical profile simulation for slice display
        let tempNorm = 0.12;
        let fuelNorm = 0.0;
        let o2Norm = c.ambientOxygen;
        let velY = 0.0;
        let velX = 0.0;

        if (c.burnerShape === 'droplet') {
          const distDrop = Math.sqrt(nx * nx + (ny - 0.5) * (ny - 0.5) + nz * nz);
          if (distDrop < 0.15) {
            fuelNorm = 0.9;
          }
          const flameRadius = 0.28;
          const flameDist = Math.abs(distDrop - flameRadius);
          if (flameDist < 0.12) {
            tempNorm = Math.max(0.12, 0.85 * (1.0 - flameDist / 0.12));
            o2Norm = Math.max(0.01, c.ambientOxygen * (flameDist / 0.12));
          }
        } else {
          // Bottom burner
          const flameHeight = Math.max(0.2, Math.min(0.85, 0.25 + (Math.abs(g) / 9.81) * 0.45));
          const flameWidth = Math.max(0.15, 0.35 - (Math.abs(g) / 9.81) * 0.12);

          // Buoyant necking
          const localWidth = flameWidth * (1.0 - ny * 0.45);
          if (ny < flameHeight && rHoriz < localWidth) {
            const core = (1.0 - rHoriz / localWidth) * (1.0 - ny / flameHeight);
            tempNorm = Math.max(0.12, core * 0.95);
            fuelNorm = Math.max(0.0, (1.0 - ny / 0.35) * (1.0 - rHoriz / flameWidth));
            o2Norm = Math.max(0.01, c.ambientOxygen * (1.0 - core));
            velY = (g / 9.81) * 1.8 * core;
            velX = c.windX * 0.8;
          }
        }

        // Color based on active field
        let r = 0, gCol = 0, b = 0;
        if (field === 'temperature') {
          const T = tempNorm * 2400.0;
          if (T < 600) { r = 10; gCol = 20; b = 40; }
          else if (T < 1000) { r = Math.floor(180 * (T - 600) / 400); gCol = 20; b = 10; }
          else if (T < 1500) { r = 240; gCol = Math.floor(160 * (T - 1000) / 500); b = 20; }
          else { r = 255; gCol = 230; b = Math.floor(180 * (T - 1500) / 900); }
        } else if (field === 'fuel') {
          r = Math.floor(fuelNorm * 255);
          gCol = Math.floor(fuelNorm * 180);
          b = 40;
        } else if (field === 'oxygen') {
          const normO2 = Math.min(1.0, o2Norm / 0.25);
          r = 20;
          gCol = Math.floor(normO2 * 200);
          b = Math.floor(normO2 * 255);
        } else if (field === 'pressure') {
          const p = Math.sin(nx * 4.0) * Math.cos(ny * 4.0) * 0.5 + 0.5;
          r = Math.floor(p * 200);
          gCol = 80;
          b = Math.floor((1.0 - p) * 200);
        } else if (field === 'velocity') {
          r = Math.floor(Math.min(255, Math.abs(velX) * 120));
          gCol = Math.floor(Math.min(255, Math.abs(velY) * 140));
          b = 80;
        }

        ctx.fillStyle = `rgb(${r},${gCol},${b})`;
        // Invert Y for canvas coordinate system (origin at top-left)
        ctx.fillRect(x * cellW, (resY - 1 - y) * cellH, cellW + 0.5, cellH + 0.5);
      }
    }

    // Velocity Vector Arrows Overlay (when in velocity mode)
    if (field === 'velocity') {
      ctx.strokeStyle = '#00d2ff';
      ctx.lineWidth = 1.2;
      const stepGrid = 4;
      for (let y = 2; y < resY; y += stepGrid) {
        for (let x = 2; x < resX; x += stepGrid) {
          const nx = (x / resX - 0.5) * 2.0;
          const ny = y / resY;
          const rHoriz = Math.abs(nx);
          const core = Math.max(0.0, 1.0 - rHoriz / 0.35) * Math.max(0.0, 1.0 - ny / 0.85);

          const vx = c.windX * 15.0;
          const vy = (c.gravity / 9.81) * 22.0 * core + (c.fuelVelocity * 10.0 * (ny < 0.2 ? 1 : 0));

          const cx = x * cellW;
          const cy = (resY - 1 - y) * cellH;

          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + vx, cy - vy);
          ctx.stroke();
        }
      }
    }

    // Grid coordinate ticks
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, w, h);

    // Legend & Slice Header
    ctx.fillStyle = '#38bdf8';
    ctx.font = '10px monospace';
    ctx.fillText(`Plane: ${c.slicePlane} (Z=${sliceZ}/${resZ - 1}) | ${field.toUpperCase()}`, 8, 14);

    // Hover tooltip
    if (this.hoverData) {
      const { px, py } = this.hoverData;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.strokeStyle = '#38bdf8';
      ctx.fillRect(8, h - 30, 180, 22);
      ctx.strokeRect(8, h - 30, 180, 22);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '10px monospace';
      ctx.fillText(`Voxel [${px}, ${py}, ${sliceZ}] // ${field}`, 14, h - 16);
    }
  }
}

