/**
 * WebGL2FluidSolver.js
 * High-performance 3D Navier-Stokes combustion fluid simulation using Three.js WebGLRenderTarget.
 * Provides 100% universal browser compatibility, zero driver leaks, and seamless Three.js integration.
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

export class WebGL2FluidSolver {
  constructor(renderer, config) {
    this.renderer = renderer;
    this.config = config;
    this.resX = config.resX;
    this.resY = config.resY;
    this.resZ = config.resZ;
    this.tilesX = 8;
    this.tilesY = Math.ceil(this.resZ / this.tilesX); // 8x8 = 64
    this.atlasW = this.resX * this.tilesX;           // 512
    this.atlasH = this.resY * this.tilesY;           // 768

    this.isReady = false;

    // Fullscreen Quad for GPGPU render passes
    this.quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quadScene = new THREE.Scene();
    this.quadGeo = new THREE.PlaneGeometry(2, 2);
    this.quadMesh = new THREE.Mesh(this.quadGeo, null);
    this.quadScene.add(this.quadMesh);

    this.createRenderTargets();
    this.createMaterials();
    this.reset();

    this.isReady = true;
    console.log(`WebGL2 Fluid Solver (Three.js GPGPU) active: ${this.resX}x${this.resY}x${this.resZ}`);
  }

  createRT() {
    return new THREE.WebGLRenderTarget(this.atlasW, this.atlasH, {
      type: THREE.HalfFloatType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      depthBuffer: false,
      stencilBuffer: false,
      generateMipmaps: false
    });
  }

  createRenderTargets() {
    this.vel0 = this.createRT();
    this.vel1 = this.createRT();
    this.scalar0 = this.createRT();
    this.scalar1 = this.createRT();
    this.pressure0 = this.createRT();
    this.pressure1 = this.createRT();
    this.divergence = this.createRT();
    this.vorticity = this.createRT();
  }

  createMaterials() {
    const commonGLSL = `
      precision highp float;
      precision highp sampler2D;

      uniform vec3 u_res;
      uniform vec2 u_atlasTiles;
      uniform vec2 u_atlasSize;

      vec3 uvToGrid(vec2 uv) {
        vec2 pixel = uv * u_atlasSize;
        float tileCol = floor(pixel.x / u_res.x);
        float tileRow = floor(pixel.y / u_res.y);
        float z = tileRow * u_atlasTiles.x + tileCol;
        float x = mod(pixel.x, u_res.x);
        float y = mod(pixel.y, u_res.y);
        return vec3(x, y, z);
      }

      vec2 gridToUV(vec3 p) {
        p = clamp(p, vec3(0.0), u_res - vec3(1.0));
        float z = floor(p.z);
        float tileCol = mod(z, u_atlasTiles.x);
        float tileRow = floor(z / u_atlasTiles.x);
        vec2 pixel = vec2(tileCol * u_res.x + p.x + 0.5, tileRow * u_res.y + p.y + 0.5);
        return pixel / u_atlasSize;
      }

      vec4 sample3DTrilinear(sampler2D tex, vec3 p) {
        p = clamp(p, vec3(0.0), u_res - vec3(1.0));
        float z0 = floor(p.z);
        float z1 = min(z0 + 1.0, u_res.z - 1.0);
        float fz = fract(p.z);

        vec2 uv0 = gridToUV(vec3(p.xy, z0));
        vec2 uv1 = gridToUV(vec3(p.xy, z1));

        vec4 s0 = texture2D(tex, uv0);
        vec4 s1 = texture2D(tex, uv1);
        return mix(s0, s1, fz);
      }
    `;

    const commonUniforms = {
      u_res: { value: new THREE.Vector3(this.resX, this.resY, this.resZ) },
      u_atlasTiles: { value: new THREE.Vector2(this.tilesX, this.tilesY) },
      u_atlasSize: { value: new THREE.Vector2(this.atlasW, this.atlasH) }
    };

    // 1. Advection Material
    this.matAdvect = new THREE.ShaderMaterial({
      uniforms: {
        ...commonUniforms,
        u_vel: { value: null },
        u_quantity: { value: null },
        u_dt: { value: this.config.timeStep }
      },
      vertexShader: `
        varying vec2 v_uv;
        void main() {
          v_uv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: `
        ${commonGLSL}
        varying vec2 v_uv;
        uniform sampler2D u_vel;
        uniform sampler2D u_quantity;
        uniform float u_dt;

        void main() {
          vec3 p = uvToGrid(v_uv);
          vec3 u = texture2D(u_vel, v_uv).xyz;
          vec3 pPrev = p - u * u_dt;
          gl_FragColor = sample3DTrilinear(u_quantity, pPrev);
        }
      `
    });

    // 2. Combustion Kinetics Material
    this.matCombustion = new THREE.ShaderMaterial({
      uniforms: {
        ...commonUniforms,
        u_scalar: { value: null },
        u_dt: { value: this.config.timeStep },
        u_ambientO2: { value: this.config.ambientOxygen },
        u_ambientTemp: { value: this.config.ambientTemp },
        u_ignitionTemp: { value: this.config.ignitionTemp },
        u_fuelRate: { value: this.config.fuelRate },
        u_nozzleRadius: { value: this.config.nozzleRadius },
        u_heatRelease: { value: 1.0 },
        u_stoichO2: { value: 2.0 },
        u_sootYield: { value: 0.2 },
        u_coolingRate: { value: this.config.coolingRate },
        u_burnerShape: { value: 0 },
        u_spark: { value: 0.0 }
      },
      vertexShader: `
        varying vec2 v_uv;
        void main() { v_uv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
      `,
      fragmentShader: `
        ${commonGLSL}
        varying vec2 v_uv;
        uniform sampler2D u_scalar;
        uniform float u_dt;
        uniform float u_ambientO2;
        uniform float u_ambientTemp;
        uniform float u_ignitionTemp;
        uniform float u_fuelRate;
        uniform float u_nozzleRadius;
        uniform float u_heatRelease;
        uniform float u_stoichO2;
        uniform float u_sootYield;
        uniform float u_coolingRate;
        uniform int u_burnerShape;
        uniform float u_spark;

        void main() {
          vec3 p = uvToGrid(v_uv);
          vec4 s = texture2D(u_scalar, v_uv);

          vec3 center = vec3(u_res.x * 0.5, 3.0, u_res.z * 0.5);
          float rHoriz = length(vec2(p.x - center.x, p.z - center.z));
          float burnerRadiusPx = u_nozzleRadius * u_res.x;
          float effRadiusPx = (u_burnerShape == 1) ? (0.022 * u_res.x) : burnerRadiusPx;

          // Fuel Injection & Flame Anchoring
          if (u_burnerShape == 0) { // Circle Jet Burner
            if (p.y <= 4.0 && rHoriz <= burnerRadiusPx) {
              float profile = max(0.0, 1.0 - (rHoriz / burnerRadiusPx) * (rHoriz / burnerRadiusPx));
              s.y = max(s.y, u_fuelRate * profile);
              s.x = max(s.x, 0.72 * profile); // Anchoring heat (1728 K)
            }
          } else if (u_burnerShape == 1) { // Candle Wick (Tightly localized to wick cord)
            if (p.y <= 4.0 && rHoriz <= effRadiusPx) {
              float profile = max(0.0, 1.0 - (rHoriz / effRadiusPx) * (rHoriz / effRadiusPx));
              s.y = max(s.y, u_fuelRate * 0.85 * profile);
              s.x = max(s.x, 0.68 * profile); // 1630 K wick base anchoring
            }
          } else if (u_burnerShape == 2) { // Microgravity Droplet
            vec3 dropCenter = u_res * 0.5;
            if (length(p - dropCenter) <= burnerRadiusPx * 1.5) {
              s.y = max(s.y, u_fuelRate * 0.95);
              s.x = max(s.x, 0.70); // Droplet surface ignition
            }
          }

          // Pilot Spark
          if (u_spark > 0.5) {
            vec3 sparkPos = center + vec3(0.0, 3.0, 0.0);
            if (length(p - sparkPos) < 5.0) {
              s.x = max(s.x, 0.85); // 2040K
            }
          }

          // Arrhenius Combustion Reaction
          float T_actual = s.x * 2400.0;
          float fuel = max(0.0, s.y);
          float o2 = max(0.0, s.z);

          if (T_actual > u_ignitionTemp && fuel > 0.005 && o2 > 0.005) {
            float Ea_R = 3500.0;
            float kArrhenius = 45.0 * exp(-Ea_R / (T_actual + 10.0));
            float reactionRate = kArrhenius * fuel * o2;
            float burnAmount = min(fuel, min(o2 / max(0.1, u_stoichO2), reactionRate * u_dt));

            s.y = max(0.0, s.y - burnAmount);
            s.z = max(0.0, s.z - burnAmount * u_stoichO2);
            s.x = min(1.0, s.x + burnAmount * u_heatRelease * 1.8);
            s.w = s.w + burnAmount * u_sootYield * 2.2;
          }

          // Radiative Cooling
          float T_diff = max(0.0, s.x - u_ambientTemp / 2400.0);
          s.x = max(u_ambientTemp / 2400.0, s.x - u_coolingRate * T_diff * s.x * s.x * u_dt);
          s.w = max(0.0, s.w * (1.0 - 0.004 * u_dt));

          // Boundary replenishment
          if (p.x <= 1.0 || p.x >= u_res.x - 2.0 || p.y >= u_res.y - 2.0 || p.z <= 1.0 || p.z >= u_res.z - 2.0) {
            s.z = mix(s.z, u_ambientO2, 0.15);
            s.x = mix(s.x, u_ambientTemp / 2400.0, 0.2);
            s.y *= 0.8;
            s.w *= 0.8;
          }

          gl_FragColor = s;
        }
      `
    });

    // 3. Buoyancy & Forces Material (Updates Velocity)
    this.matBuoyancy = new THREE.ShaderMaterial({
      uniforms: {
        ...commonUniforms,
        u_vel: { value: null },
        u_scalar: { value: null },
        u_dt: { value: this.config.timeStep },
        u_gravity: { value: this.config.gravity },
        u_buoyancyAlpha: { value: this.config.buoyancyAlpha },
        u_buoyancyBeta: { value: this.config.buoyancyBeta },
        u_ambientTemp: { value: this.config.ambientTemp },
        u_fuelVel: { value: this.config.fuelVelocity },
        u_nozzleRadius: { value: this.config.nozzleRadius },
        u_wind: { value: new THREE.Vector3() },
        u_burnerShape: { value: 0 }
      },
      vertexShader: `
        varying vec2 v_uv;
        void main() { v_uv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
      `,
      fragmentShader: `
        ${commonGLSL}
        varying vec2 v_uv;
        uniform sampler2D u_vel;
        uniform sampler2D u_scalar;
        uniform float u_dt;
        uniform float u_gravity;
        uniform float u_buoyancyAlpha;
        uniform float u_buoyancyBeta;
        uniform float u_ambientTemp;
        uniform float u_fuelVel;
        uniform float u_nozzleRadius;
        uniform vec3 u_wind;
        uniform int u_burnerShape;

        void main() {
          vec3 p = uvToGrid(v_uv);
          vec3 v = texture2D(u_vel, v_uv).xyz;
          vec4 s = texture2D(u_scalar, v_uv);

          // Buoyancy Force: alpha * (T - T_amb) * (-g) - beta * Soot * g
          float tempDiff = (s.x * 2400.0 - u_ambientTemp);
          float buoyancyForceY = u_buoyancyAlpha * tempDiff * (u_gravity / 9.81) - u_buoyancyBeta * s.w * u_gravity;

          v.y += buoyancyForceY * u_dt;
          v.x += u_wind.x * u_dt;
          v.z += u_wind.z * u_dt;

          // Nozzle injection velocity boost
          vec3 center = vec3(u_res.x * 0.5, 3.0, u_res.z * 0.5);
          float rHoriz = length(vec2(p.x - center.x, p.z - center.z));
          float burnerRadiusPx = (u_burnerShape == 1) ? (0.022 * u_res.x) : (u_nozzleRadius * u_res.x);
          float maxFuelVel = (u_burnerShape == 1) ? (u_fuelVel * 0.35) : u_fuelVel;
          if (p.y <= 4.0 && rHoriz <= burnerRadiusPx && u_burnerShape <= 1) {
            float profile = max(0.0, 1.0 - (rHoriz / burnerRadiusPx) * (rHoriz / burnerRadiusPx));
            v.y += maxFuelVel * profile;
          }

          if (length(v) > 20.0) v = normalize(v) * 20.0;

          gl_FragColor = vec4(v, 0.0);
        }
      `
    });

    // 4. Vorticity Calculation Material
    this.matVorticity = new THREE.ShaderMaterial({
      uniforms: {
        ...commonUniforms,
        u_vel: { value: null }
      },
      vertexShader: `
        varying vec2 v_uv;
        void main() { v_uv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
      `,
      fragmentShader: `
        ${commonGLSL}
        varying vec2 v_uv;
        uniform sampler2D u_vel;

        void main() {
          vec3 p = uvToGrid(v_uv);
          vec3 v_yp = texture2D(u_vel, gridToUV(p + vec3(0.0, 1.0, 0.0))).xyz;
          vec3 v_ym = texture2D(u_vel, gridToUV(p - vec3(0.0, 1.0, 0.0))).xyz;
          vec3 v_zp = texture2D(u_vel, gridToUV(p + vec3(0.0, 0.0, 1.0))).xyz;
          vec3 v_zm = texture2D(u_vel, gridToUV(p - vec3(0.0, 0.0, 1.0))).xyz;
          vec3 v_xp = texture2D(u_vel, gridToUV(p + vec3(1.0, 0.0, 0.0))).xyz;
          vec3 v_xm = texture2D(u_vel, gridToUV(p - vec3(1.0, 0.0, 0.0))).xyz;

          float curlX = (v_yp.z - v_ym.z) * 0.5 - (v_zp.y - v_zm.y) * 0.5;
          float curlY = (v_zp.x - v_zm.x) * 0.5 - (v_xp.z - v_xm.z) * 0.5;
          float curlZ = (v_xp.y - v_xm.y) * 0.5 - (v_yp.x - v_ym.x) * 0.5;
          vec3 curl = vec3(curlX, curlY, curlZ);

          gl_FragColor = vec4(curl, length(curl));
        }
      `
    });

    // 5. Apply Vorticity Confinement Material
    this.matApplyVorticity = new THREE.ShaderMaterial({
      uniforms: {
        ...commonUniforms,
        u_vel: { value: null },
        u_vort: { value: null },
        u_vorticityEps: { value: this.config.vorticityConfinement },
        u_dt: { value: this.config.timeStep }
      },
      vertexShader: `
        varying vec2 v_uv;
        void main() { v_uv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
      `,
      fragmentShader: `
        ${commonGLSL}
        varying vec2 v_uv;
        uniform sampler2D u_vel;
        uniform sampler2D u_vort;
        uniform float u_vorticityEps;
        uniform float u_dt;

        void main() {
          vec3 p = uvToGrid(v_uv);
          vec3 v = texture2D(u_vel, v_uv).xyz;

          float etaX = (texture2D(u_vort, gridToUV(p + vec3(1.0, 0.0, 0.0))).w - texture2D(u_vort, gridToUV(p - vec3(1.0, 0.0, 0.0))).w) * 0.5;
          float etaY = (texture2D(u_vort, gridToUV(p + vec3(0.0, 1.0, 0.0))).w - texture2D(u_vort, gridToUV(p - vec3(0.0, 1.0, 0.0))).w) * 0.5;
          float etaZ = (texture2D(u_vort, gridToUV(p + vec3(0.0, 0.0, 1.0))).w - texture2D(u_vort, gridToUV(p - vec3(0.0, 0.0, 1.0))).w) * 0.5;
          vec3 eta = vec3(etaX, etaY, etaZ);

          float lenEta = length(eta);
          if (lenEta > 0.0001) {
            vec3 N = eta / lenEta;
            vec3 omega = texture2D(u_vort, v_uv).xyz;
            vec3 f_conf = u_vorticityEps * cross(N, omega);
            v += f_conf * u_dt;
          }

          gl_FragColor = vec4(v, 0.0);
        }
      `
    });

    // 6. Divergence Material
    this.matDivergence = new THREE.ShaderMaterial({
      uniforms: {
        ...commonUniforms,
        u_vel: { value: null }
      },
      vertexShader: `
        varying vec2 v_uv;
        void main() { v_uv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
      `,
      fragmentShader: `
        ${commonGLSL}
        varying vec2 v_uv;
        uniform sampler2D u_vel;

        void main() {
          vec3 p = uvToGrid(v_uv);
          float u_xp = texture2D(u_vel, gridToUV(p + vec3(1.0, 0.0, 0.0))).x;
          float u_xm = texture2D(u_vel, gridToUV(p - vec3(1.0, 0.0, 0.0))).x;
          float v_yp = texture2D(u_vel, gridToUV(p + vec3(0.0, 1.0, 0.0))).y;
          float v_ym = texture2D(u_vel, gridToUV(p - vec3(0.0, 1.0, 0.0))).y;
          float w_zp = texture2D(u_vel, gridToUV(p + vec3(0.0, 0.0, 1.0))).z;
          float w_zm = texture2D(u_vel, gridToUV(p - vec3(0.0, 0.0, 1.0))).z;

          float div = 0.5 * ((u_xp - u_xm) + (v_yp - v_ym) + (w_zp - w_zm));
          gl_FragColor = vec4(div, 0.0, 0.0, 0.0);
        }
      `
    });

    // 7. Jacobi Material
    this.matJacobi = new THREE.ShaderMaterial({
      uniforms: {
        ...commonUniforms,
        u_p: { value: null },
        u_div: { value: null }
      },
      vertexShader: `
        varying vec2 v_uv;
        void main() { v_uv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
      `,
      fragmentShader: `
        ${commonGLSL}
        varying vec2 v_uv;
        uniform sampler2D u_p;
        uniform sampler2D u_div;

        void main() {
          vec3 p = uvToGrid(v_uv);
          float p_xp = texture2D(u_p, gridToUV(p + vec3(1.0, 0.0, 0.0))).x;
          float p_xm = texture2D(u_p, gridToUV(p - vec3(1.0, 0.0, 0.0))).x;
          float p_yp = texture2D(u_p, gridToUV(p + vec3(0.0, 1.0, 0.0))).y;
          float p_ym = texture2D(u_p, gridToUV(p - vec3(0.0, 1.0, 0.0))).y;
          float p_zp = texture2D(u_p, gridToUV(p + vec3(0.0, 0.0, 1.0))).x;
          float p_zm = texture2D(u_p, gridToUV(p - vec3(0.0, 0.0, 1.0))).x;

          float d = texture2D(u_div, v_uv).x;
          float p_new = (p_xp + p_xm + p_yp + p_ym + p_zp + p_zm - d) / 6.0;

          gl_FragColor = vec4(p_new, 0.0, 0.0, 0.0);
        }
      `
    });

    // 8. Project Material
    this.matProject = new THREE.ShaderMaterial({
      uniforms: {
        ...commonUniforms,
        u_vel: { value: null },
        u_p: { value: null }
      },
      vertexShader: `
        varying vec2 v_uv;
        void main() { v_uv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
      `,
      fragmentShader: `
        ${commonGLSL}
        varying vec2 v_uv;
        uniform sampler2D u_vel;
        uniform sampler2D u_p;

        void main() {
          vec3 p = uvToGrid(v_uv);
          vec3 v = texture2D(u_vel, v_uv).xyz;

          float p_xp = texture2D(u_p, gridToUV(p + vec3(1.0, 0.0, 0.0))).x;
          float p_xm = texture2D(u_p, gridToUV(p - vec3(1.0, 0.0, 0.0))).x;
          float p_yp = texture2D(u_p, gridToUV(p + vec3(0.0, 1.0, 0.0))).y;
          float p_ym = texture2D(u_p, gridToUV(p - vec3(0.0, 1.0, 0.0))).y;
          float p_zp = texture2D(u_p, gridToUV(p + vec3(0.0, 0.0, 1.0))).x;
          float p_zm = texture2D(u_p, gridToUV(p - vec3(0.0, 0.0, 1.0))).x;

          vec3 gradP = vec3(p_xp - p_xm, p_yp - p_ym, p_zp - p_zm) * 0.5;
          gl_FragColor = vec4(v - gradP, 0.0);
        }
      `
    });
  }

  renderPass(material, target) {
    this.quadMesh.material = material;
    this.renderer.setRenderTarget(target);
    this.renderer.render(this.quadScene, this.quadCamera);
  }

  reset() {
    // Clear targets
    this.renderer.setRenderTarget(this.vel0);
    this.renderer.clearColor();
    this.renderer.setRenderTarget(this.vel1);
    this.renderer.clearColor();
    this.renderer.setRenderTarget(this.pressure0);
    this.renderer.clearColor();
    this.renderer.setRenderTarget(this.pressure1);
    this.renderer.clearColor();

    // Initial ambient scalars (Temp = ambient, O2 = ambient)
    const initMat = new THREE.ShaderMaterial({
      uniforms: {
        u_ambientO2: { value: this.config.ambientOxygen },
        u_ambientTemp: { value: this.config.ambientTemp / 2400.0 }
      },
      vertexShader: `void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }`,
      fragmentShader: `
        uniform float u_ambientO2;
        uniform float u_ambientTemp;
        void main() {
          gl_FragColor = vec4(u_ambientTemp, 0.0, u_ambientO2, 0.0);
        }
      `
    });

    this.renderPass(initMat, this.scalar0);
    this.renderPass(initMat, this.scalar1);
    this.renderer.setRenderTarget(null);
  }

  step(gasConfig, sparkActive = false) {
    if (!this.isReady || this.config.paused) return;

    const c = this.config;

    // 1. Advect Velocity (vel0 -> vel1)
    this.matAdvect.uniforms.u_dt.value = c.timeStep;
    this.matAdvect.uniforms.u_vel.value = this.vel0.texture;
    this.matAdvect.uniforms.u_quantity.value = this.vel0.texture;
    this.renderPass(this.matAdvect, this.vel1);

    // 2. Advect Scalars (scalar0 -> scalar1)
    this.matAdvect.uniforms.u_vel.value = this.vel0.texture;
    this.matAdvect.uniforms.u_quantity.value = this.scalar0.texture;
    this.renderPass(this.matAdvect, this.scalar1);

    // 3. Combustion Kinetics (scalar1 -> scalar0)
    const mComb = this.matCombustion.uniforms;
    mComb.u_dt.value = c.timeStep;
    mComb.u_scalar.value = this.scalar1.texture;
    mComb.u_ambientO2.value = c.ambientOxygen;
    mComb.u_ambientTemp.value = c.ambientTemp;
    mComb.u_ignitionTemp.value = c.ignitionTemp;
    mComb.u_fuelRate.value = c.fuelRate;
    mComb.u_nozzleRadius.value = c.nozzleRadius;
    mComb.u_heatRelease.value = gasConfig.heatOfCombustion;
    mComb.u_stoichO2.value = gasConfig.stoichiometricRatio;
    mComb.u_sootYield.value = gasConfig.sootYield;
    mComb.u_coolingRate.value = c.coolingRate;
    mComb.u_burnerShape.value = c.burnerShape === 'circle' ? 0 : (c.burnerShape === 'candle' ? 1 : 2);
    mComb.u_spark.value = sparkActive ? 1.0 : 0.0;
    this.renderPass(this.matCombustion, this.scalar0);

    // 4. Buoyancy & Forces on Velocity (vel1 -> vel0)
    const mBuoy = this.matBuoyancy.uniforms;
    mBuoy.u_dt.value = c.timeStep;
    mBuoy.u_vel.value = this.vel1.texture;
    mBuoy.u_scalar.value = this.scalar0.texture;
    mBuoy.u_gravity.value = c.gravity;
    mBuoy.u_buoyancyAlpha.value = c.buoyancyAlpha;
    mBuoy.u_buoyancyBeta.value = c.buoyancyBeta;
    mBuoy.u_ambientTemp.value = c.ambientTemp;
    mBuoy.u_fuelVel.value = c.fuelVelocity;
    mBuoy.u_nozzleRadius.value = c.nozzleRadius;
    mBuoy.u_wind.value.set(c.windX, c.windY, c.windZ);
    mBuoy.u_burnerShape.value = c.burnerShape === 'circle' ? 0 : (c.burnerShape === 'candle' ? 1 : 2);
    this.renderPass(this.matBuoyancy, this.vel0);

    // 5. Vorticity Confinement (vel0 -> vorticity -> vel1)
    this.matVorticity.uniforms.u_vel.value = this.vel0.texture;
    this.renderPass(this.matVorticity, this.vorticity);

    this.matApplyVorticity.uniforms.u_dt.value = c.timeStep;
    this.matApplyVorticity.uniforms.u_vel.value = this.vel0.texture;
    this.matApplyVorticity.uniforms.u_vort.value = this.vorticity.texture;
    this.matApplyVorticity.uniforms.u_vorticityEps.value = c.vorticityConfinement;
    this.renderPass(this.matApplyVorticity, this.vel1);

    // 6. Divergence (vel1 -> divergence)
    this.matDivergence.uniforms.u_vel.value = this.vel1.texture;
    this.renderPass(this.matDivergence, this.divergence);

    // 7. Jacobi Pressure Solve (pressure0 <-> pressure1)
    let pRead = this.pressure0;
    let pWrite = this.pressure1;
    this.matJacobi.uniforms.u_div.value = this.divergence.texture;

    for (let it = 0; it < c.pressureIterations; it++) {
      this.matJacobi.uniforms.u_p.value = pRead.texture;
      this.renderPass(this.matJacobi, pWrite);

      const tmp = pRead;
      pRead = pWrite;
      pWrite = tmp;
    }

    // 8. Project (vel1 - gradP -> vel0)
    this.matProject.uniforms.u_vel.value = this.vel1.texture;
    this.matProject.uniforms.u_p.value = pRead.texture;
    this.renderPass(this.matProject, this.vel0);

    // Restore default render target
    this.renderer.setRenderTarget(null);
  }

  getScalarTexture() {
    return this.scalar0.texture;
  }
}
