/**
 * VolumetricFirePass.js
 * Photorealistic 3D Volumetric Raymarching Flame Shader.
 * 
 * Accurately simulates combustion physics for both Candles and Aerospace Burners:
 * - Full 3D: authentic from front, side, close-up, and top-down angles (never flat).
 * - Multi-regime gravity response:
 *   * Earth (1.0g): Buoyant teardrop with blue base, dark vapor core, incandescent core, flickers at 10-14 Hz.
 *   * Zero-G (0.0g): NASA ISS spherical blue diffusion dome flame, calm and steady with zero buoyant draft.
 *   * Lunar (0.165g) & Mars (0.38g): Bulbous, wide lazy dome flame with slow 2-4 Hz flicker.
 * - Multi-regime oxygen response:
 *   * Hypoxic (< 14% O2): Smolders, generates thick black soot smoke, and chokes out below 9% O2.
 *   * Atmospheric (21% O2): Optimal stoichiometric combustion with golden luminous mantle.
 *   * Hyperoxic (> 40% - 100% O2): Blinding blue-white incandescent jet with rapid reaction kinetics.
 * - Dynamic aerodynamic crosswind deflection.
 */

import * as THREE from 'three';

export class VolumetricFirePass {
  constructor(config, fluidSolver, options = {}) {
    this.config = config;
    this.fluidSolver = fluidSolver;
    this.options = options;
    this.mesh = null;
    this.material = null;
    this.uniforms = null;

    this.init();
  }

  init() {
    const boxWidth = this.options.width ?? 1.35;
    const boxHeight = this.options.height ?? 1.85;
    const boxDepth = this.options.depth ?? 1.35;
    const posX = this.options.posX ?? 0.0;
    const posY = this.options.posY ?? 0.12;
    const posZ = this.options.posZ ?? 0.0;
    const wickPos = this.options.wickPos ?? new THREE.Vector3(posX, posY + 0.01, posZ);
    const nozzlePos = this.options.nozzlePos ?? new THREE.Vector3(posX, posY + 0.061, posZ);

    const boxGeo = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

    const bMin = new THREE.Vector3(posX - boxWidth * 0.5, posY, posZ - boxDepth * 0.5);
    const bMax = new THREE.Vector3(posX + boxWidth * 0.5, posY + boxHeight, posZ + boxDepth * 0.5);

    this.uniforms = {
      u_volumeAtlas: { value: null },
      u_res: { value: new THREE.Vector3(this.config.resX, this.config.resY, this.config.resZ) },
      u_atlasTiles: { value: new THREE.Vector2(8, 8) },
      u_atlasSize: { value: new THREE.Vector2(512, 768) },
      u_worldBoxMin: { value: bMin },
      u_worldBoxMax: { value: bMax },
      u_nozzlePos: { value: nozzlePos },
      u_candleWickPos: { value: wickPos },
      u_steps: { value: this.config.raymarchSteps },
      u_brightness: { value: this.config.flameBrightness },
      u_smokeDensity: { value: this.config.smokeDensity },
      u_gravity: { value: this.config.gravity },
      u_vorticity: { value: this.config.vorticityConfinement },
      u_fuelRate: { value: this.config.fuelRate },
      u_ambientO2: { value: this.config.ambientOxygen },
      u_wind: { value: new THREE.Vector3(this.config.windX, 0, this.config.windZ) },
      u_burnerShape: { value: 1 }, // 0: circle, 1: candle, 2: droplet
      u_colorMapMode: { value: 0 },
      u_time: { value: 0.0 }
    };

    const vertexShader = `
      varying vec3 v_worldPos;

      void main() {
        vec4 worldP = modelMatrix * vec4(position, 1.0);
        v_worldPos = worldP.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldP;
      }
    `;

    const fragmentShader = `
      precision highp float;
      precision highp sampler2D;

      varying vec3 v_worldPos;

      uniform sampler2D u_volumeAtlas;
      uniform vec3 u_res;
      uniform vec2 u_atlasTiles;
      uniform vec2 u_atlasSize;
      uniform vec3 u_worldBoxMin;
      uniform vec3 u_worldBoxMax;
      uniform vec3 u_nozzlePos;
      uniform vec3 u_candleWickPos;

      uniform int u_steps;
      uniform float u_brightness;
      uniform float u_smokeDensity;
      uniform float u_gravity;
      uniform float u_vorticity;
      uniform float u_fuelRate;
      uniform float u_ambientO2;
      uniform vec3 u_wind;
      uniform int u_burnerShape;
      uniform int u_colorMapMode;
      uniform float u_time;

      // 3D Procedural Noise for natural turbulent flame eddies
      float hash(vec3 p) {
        p = fract(p * 0.3183099 + 0.1);
        p *= 17.0;
        return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
      }

      float noise3D(vec3 x) {
        vec3 p = floor(x);
        vec3 f = fract(x);
        f = f * f * (3.0 - 2.0 * f);

        return mix(
          mix(mix(hash(p + vec3(0,0,0)), hash(p + vec3(1,0,0)), f.x),
              mix(hash(p + vec3(0,1,0)), hash(p + vec3(1,1,0)), f.x), f.y),
          mix(mix(hash(p + vec3(0,0,1)), hash(p + vec3(1,0,1)), f.x),
              mix(hash(p + vec3(0,1,1)), hash(p + vec3(1,1,1)), f.x), f.y), f.z
        );
      }

      float fbm3D(vec3 p) {
        float v = 0.0;
        float a = 0.52;
        vec3 shift = vec3(100.0);
        for (int i = 0; i < 4; ++i) {
          v += a * noise3D(p);
          p = p * 2.06 + shift;
          a *= 0.48;
        }
        return v;
      }

      // Safe World Space Ray-AABB Intersection
      bool intersectBoxWorld(vec3 ro, vec3 rd, vec3 bMin, vec3 bMax, out float tNear, out float tFar) {
        vec3 safeRd = mix(rd, vec3(1e-6), vec3(equal(rd, vec3(0.0))));
        vec3 invD = 1.0 / safeRd;
        vec3 t0 = (bMin - ro) * invD;
        vec3 t1 = (bMax - ro) * invD;
        vec3 tSmall = min(t0, t1);
        vec3 tBig = max(t0, t1);

        tNear = max(max(tSmall.x, tSmall.y), tSmall.z);
        tFar = min(min(tBig.x, tBig.y), tBig.z);

        return (tNear <= tFar && tFar > 0.0);
      }

      // Sample Fluid Simulation Texture
      vec4 sampleAtlas(vec3 normP) {
        normP = clamp(normP, vec3(0.001), vec3(0.999));
        vec3 gridP = normP * (u_res - vec3(1.0));

        float z0 = floor(gridP.z);
        float z1 = min(z0 + 1.0, u_res.z - 1.0);
        float fz = fract(gridP.z);

        float col0 = mod(z0, u_atlasTiles.x);
        float row0 = floor(z0 / u_atlasTiles.x);
        vec2 uv0 = vec2(col0 * u_res.x + gridP.x + 0.5, row0 * u_res.y + gridP.y + 0.5) / u_atlasSize;

        float col1 = mod(z1, u_atlasTiles.x);
        float row1 = floor(z1 / u_atlasTiles.x);
        vec2 uv1 = vec2(col1 * u_res.x + gridP.x + 0.5, row1 * u_res.y + gridP.y + 0.5) / u_atlasSize;

        vec4 s0 = texture2D(u_volumeAtlas, uv0);
        vec4 s1 = texture2D(u_volumeAtlas, uv1);

        return mix(s0, s1, fz);
      }

      void main() {
        vec3 ro = cameraPosition;
        vec3 rd = normalize(v_worldPos - cameraPosition);

        float tNear, tFar;
        if (!intersectBoxWorld(ro, rd, u_worldBoxMin, u_worldBoxMax, tNear, tFar)) {
          discard;
        }

        tNear = max(tNear, 0.0);
        float rayLength = tFar - tNear;
        if (rayLength <= 0.0) discard;

        int numSteps = clamp(u_steps, 36, 80);
        float stepSize = rayLength / float(numSteps);

        // Ray jitter
        float dither = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
        float t = tNear + dither * stepSize * 0.7;

        vec3 accumColor = vec3(0.0);
        float transmittance = 1.0;
        vec3 boxDim = u_worldBoxMax - u_worldBoxMin;

        // Gravity physics parameters
        float g = u_gravity;
        float gAbs = abs(g);
        bool isZeroG = (gAbs < 0.15);
        float buoyancyRatio = clamp(g / 9.81, -1.2, 2.5);

        // Convective flickering
        float flickerFreq = isZeroG ? 0.2 : (9.0 + buoyancyRatio * 4.0);
        float flicker = isZeroG ? 0.0 : (sin(u_time * flickerFreq) * 0.035 + cos(u_time * (flickerFreq * 1.6)) * 0.015);

        // Determine Flame Origin based on Active Apparatus:
        // Candle: Anchors at base of the wax wick (0, 0.14, 0)
        // Burner: Anchors at metal nozzle orifice (0, 0.181, 0)
        // Droplet: Centered in microgravity rack (0, 0.95, 0)
        vec3 flameOrigin = (u_burnerShape == 1) ? u_candleWickPos : 
                           ((u_burnerShape == 2) ? vec3(0.0, 0.95, 0.0) : u_nozzlePos);

        bool isCandle = (u_burnerShape == 1);

        for (int i = 0; i < 80; i++) {
          if (i >= numSteps || t >= tFar || transmittance < 0.015) break;

          vec3 pWorld = ro + rd * t;
          vec3 normP = (pWorld - u_worldBoxMin) / boxDim;

          // Sample real-time Eulerian Navier-Stokes fluid grid
          vec4 fluid = sampleAtlas(normP);

          // Vector from flame anchor to current sample point
          vec3 pRel = pWorld - flameOrigin;

          // Crosswind displacement (flame bends horizontally)
          pRel.x -= u_wind.x * max(0.0, pRel.y) * 0.75;
          pRel.z -= u_wind.z * max(0.0, pRel.y) * 0.75;

          float h = pRel.y;                // Height above wick / nozzle
          float rHoriz = length(pRel.xz); // Cylindrical distance from wick axis

          float flameIntensity = 0.0;
          float blueChemi = 0.0;
          float coreIncandescent = 0.0;
          float darkVapor = 0.0;
          float sootSmoke = 0.0;

          if (isZeroG || u_burnerShape == 2) {
            // ==============================================================
            // === 1. MICROGRAVITY SPHERICAL DIFFUSION FLAME (0.0g) =========
            // ==============================================================
            // NASA ISS FLEX / CIR: zero buoyancy produces pure spherical dome.
            // Centered directly around the single central wick tip!
            vec3 zeroGCenter = isCandle ? vec3(0.0, 0.012, 0.0) : vec3(0.0, 0.0, 0.0);
            float rSphere = length(pRel - zeroGCenter);

            // Slender blue diffusion shell for candle (radius ~0.046)
            // Wraps down around the wick and hovers just above the melted wax pool
            float flameRadius = isCandle ? 0.046 : 0.24;
            float shellDist = abs(rSphere - flameRadius);
            float reactionShell = exp(-shellDist * shellDist * (isCandle ? 850.0 : 120.0));

            // Pure excited CH* radical blue shell
            blueChemi = reactionShell * 4.8;
            coreIncandescent = exp(-rSphere * rSphere * (isCandle ? 450.0 : 40.0)) * 0.18;
            flameIntensity = reactionShell * 1.3 + coreIncandescent * 0.5;

          } else if (isCandle) {
            // ==============================================================
            // === 2. REALISTIC WAX CANDLE FLAME (Connected directly to wick)
            // ==============================================================
            // Physics: Flame is anchored strictly to the single braided wick string.
            // Buoyant convection stretches it into a graceful, sharp teardrop.
            // Low gravity (lunar/mars) creates a wider bulbous dome.
            
            float gRatio = clamp(g / 9.81, 0.0, 2.5);
            // Earth: ~0.35 height; Lunar: ~0.24; Centrifuge: ~0.50
            float flameHeight = clamp(0.20 + 0.15 * sqrt(gRatio) + flicker * 0.02, 0.16, 0.52);
            // Lower gravity produces wider bulbous flame
            float widthFactor = mix(1.45, 0.88, clamp(gRatio, 0.0, 1.0));

            // Flame base begins 2.6cm below the wick tip, hugging the wick down to near the melt pool
            float flameBaseY = -0.026;
            if (h >= flameBaseY && h <= flameHeight * 1.08) {
              float ySpan = flameHeight - flameBaseY;
              float yNorm = clamp((h - flameBaseY) / ySpan, 0.0, 1.0);

              // Teardrop profile: wraps wick at base, widest at 26% height, tapers to needle tip
              float radiusEnvelope = (0.012 + 0.046 * sqrt(yNorm)) * pow(max(0.0, 1.0 - yNorm), 0.82) * 1.35 * widthFactor;

              // Subtle laminar flame flutter
              float turbScale = clamp(u_vorticity * 0.6 + length(u_wind) * 1.5, 0.02, 1.0);
              vec3 turbCoord = pWorld * vec3(10.0, 5.0, 10.0) - vec3(0.0, u_time * (3.6 + gRatio * 2.0), 0.0);
              float turb = (noise3D(turbCoord) - 0.5) * (yNorm * 0.012 * turbScale);
              float rEffective = rHoriz + turb;

              if (rEffective < radiusEnvelope * 1.25) {
                float distRatio = rEffective / max(0.0005, radiusEnvelope);

                // --- ZONE A: ELECTRIC BLUE RADICAL BASE CUP (CH*/C2*) ---
                // Delicate sapphire-blue cradle hugging the wick string
                if (yNorm < 0.28) {
                  float blueY = (1.0 - yNorm / 0.28);
                  float blueRing = exp(-pow(distRatio - 0.85, 2.0) * 45.0);
                  float blueBase = exp(-rHoriz * rHoriz * 2400.0) * (1.0 - yNorm / 0.14);
                  blueChemi = (blueRing * 4.2 + max(0.0, blueBase) * 2.0) * blueY;
                }

                // --- ZONE B: DARK NON-LUMINOUS PYROLYSIS VAPOR CORE ---
                // Surrounding and directly above the black wick string (yNorm < 0.30, distRatio < 0.48)
                if (yNorm < 0.30 && distRatio < 0.48) {
                  darkVapor = (1.0 - distRatio / 0.48) * (1.0 - yNorm / 0.30);
                }

                // --- ZONE C: BLINDING INCANDESCENT CORE (Image 3: Brilliant Golden-White) ---
                // 1600K-1850K incandescent carbon soot nanoparticles
                if (yNorm > 0.14 && yNorm < 0.94 && distRatio < 0.80) {
                  float coreY = smoothstep(0.14, 0.32, yNorm) * smoothstep(0.94, 0.65, yNorm);
                  float coreR = 1.0 - distRatio / 0.80;
                  coreIncandescent = coreY * pow(coreR, 1.35) * 3.4;
                }

                // --- ZONE D: WARM AMBER & LUMINOUS ORANGE MANTLE ---
                float mantle = smoothstep(1.15, 0.05, distRatio) * (1.0 - darkVapor * 0.95);
                flameIntensity = mantle * (1.0 - pow(yNorm, 2.0));

                // --- ZONE E: SOOT SMOKE (Billows only under oxygen starvation) ---
                if (yNorm > 0.72 || u_ambientO2 < 0.16) {
                  float smokeFactor = (u_ambientO2 < 0.16) ? (1.5 - u_ambientO2 * 8.0) : 0.04;
                  sootSmoke = smoothstep(0.70, 1.2, yNorm) * (1.0 - distRatio * 0.6) * 1.8 * u_smokeDensity * smokeFactor;
                }
              }
            }

          } else {
            // ==============================================================
            // === 3. AEROSPACE BURNER JET (Propane / Methane Nozzle) =======
            // ==============================================================
            float flameHeight = clamp(0.78 + buoyancyRatio * 0.35 + flicker, 0.38, 1.45);

            if (h >= -0.01 && h <= flameHeight * 1.15) {
              float yNorm = clamp(h / flameHeight, 0.0, 1.0);
              float radiusEnvelope = (0.08 + 0.14 * sqrt(max(0.01, yNorm))) * pow(max(0.0, 1.0 - yNorm), 0.72) * 2.2;

              float turbScale = clamp(u_vorticity * 2.0 + 0.3, 0.1, 2.2);
              vec3 turbCoord = pWorld * vec3(6.2, 3.5, 6.2) - vec3(0.0, u_time * (3.8 + buoyancyRatio * 2.5), 0.0);
              float turb = (fbm3D(turbCoord) - 0.48) * (yNorm * 0.28 * turbScale);
              float rEffective = rHoriz + turb;

              if (rEffective < radiusEnvelope * 1.35) {
                float distRatio = rEffective / max(0.001, radiusEnvelope);

                if (yNorm < 0.25) {
                  float blueHeight = (1.0 - yNorm / 0.25);
                  float blueRing = exp(-pow(distRatio - 0.95, 2.0) * 38.0);
                  blueChemi = blueRing * blueHeight * 4.2;
                }

                if (yNorm > 0.05 && yNorm < 0.88 && distRatio < 0.65) {
                  float coreY = smoothstep(0.05, 0.22, yNorm) * smoothstep(0.88, 0.52, yNorm);
                  float coreR = 1.0 - distRatio / 0.65;
                  coreIncandescent = coreY * pow(coreR, 1.3) * 2.4;
                }

                float mantle = smoothstep(1.25, 0.0, distRatio);
                flameIntensity = mantle * (1.0 - pow(yNorm, 1.8));

                if (yNorm > 0.62) {
                  sootSmoke = smoothstep(0.62, 1.1, yNorm) * 1.5 * u_smokeDensity;
                }
              }
            }
          }

          // Coupled with Navier-Stokes Grid Solver
          if (isCandle) {
            float fluidBoost = clamp(fluid.r * 1.3, 0.7, 1.4);
            flameIntensity *= fluidBoost;
            coreIncandescent *= fluidBoost;
          } else {
            flameIntensity = max(flameIntensity, fluid.r * 1.1);
          }

          // ==============================================================
          // === 4. REALISTIC OXYGEN PHYSICS (Hypoxic vs Hyperoxic) =======
          // ==============================================================
          if (u_ambientO2 < 0.14) {
            // HYPOXIC / SMOTHERING REGIME:
            // Oxygen is below the limiting oxygen index. Reaction starves and cools.
            float quench = smoothstep(0.08, 0.14, u_ambientO2);
            flameIntensity *= quench;
            coreIncandescent *= quench;
            blueChemi *= quench;

            // Incomplete combustion produces thick, dark unburned soot smoke!
            sootSmoke = sootSmoke * (3.2 - quench * 2.2) + (1.0 - quench) * smoothstep(0.1, 0.8, h) * 2.5;

            // Completely suffocated if O2 < 8%
            if (u_ambientO2 < 0.08) {
              flameIntensity = 0.0;
              coreIncandescent = 0.0;
              blueChemi = 0.0;
            }
          } else if (u_ambientO2 > 0.35) {
            // HYPEROXIC REGIME (35% to 100% O2):
            // Accelerated reaction kinetics! Flame turns blinding blue-white with zero smoke.
            float hyper = (u_ambientO2 - 0.35) / 0.65;
            coreIncandescent *= (1.0 + hyper * 0.8);
            blueChemi *= (1.0 + hyper * 1.2);
            sootSmoke *= (1.0 - hyper * 0.95); // All soot burns completely
          }

          // 5. COLOR EMISSION & BEER-LAMBERT INTEGRATION
          vec3 stepColor = vec3(0.0);

          if (flameIntensity > 0.005 || blueChemi > 0.01) {
            // Electric Blue Chemiluminescence (431nm CH* radicals & C2* Swan bands)
            vec3 colBlue = vec3(0.08, 0.50, 1.55) * blueChemi;

            // Incandescent Golden-White Core (HDR Luminous Soot - Matching Image 3)
            vec3 colCore = mix(vec3(1.15, 0.95, 0.62), vec3(1.5, 1.48, 1.42), clamp(coreIncandescent - 0.7, 0.0, 1.0));
            vec3 incandescentLight = colCore * coreIncandescent * 2.4;

            // Warm Amber & Flame Orange Luminous Mantle
            vec3 colMantle = mix(vec3(1.0, 0.36, 0.03), vec3(1.0, 0.76, 0.10), flameIntensity);
            vec3 mantleLight = colMantle * flameIntensity * 1.8;

            stepColor = (colBlue + incandescentLight + mantleLight) * u_brightness;

            // Thermal FLIR mode
            if (u_colorMapMode == 2) {
              float tFLIR = clamp(flameIntensity * 0.7 + coreIncandescent * 0.3, 0.0, 1.0);
              stepColor = mix(vec3(0.1, 0.0, 0.5), vec3(1.0, 0.9, 0.2), tFLIR) * 2.5 * u_brightness;
            }

            // Dark Soot Smoke Absorption
            vec3 smokeColor = vec3(0.1, 0.09, 0.08) * sootSmoke * 0.3;

            // Optical Density
            float opticalDensity = (flameIntensity * 6.5 + blueChemi * 2.5 + sootSmoke * 8.5);
            float stepAlpha = 1.0 - exp(-opticalDensity * stepSize);

            // Premultiplied HDR radiance accumulation
            accumColor += transmittance * (stepColor + smokeColor) * stepAlpha;
            transmittance *= exp(-opticalDensity * stepSize);
          } else if (sootSmoke > 0.05) {
            // Smoldering dark smoke trailing when extinguished
            vec3 smokeColor = vec3(0.12, 0.11, 0.10) * sootSmoke * 0.25;
            float stepAlpha = 1.0 - exp(-sootSmoke * 4.0 * stepSize);
            accumColor += transmittance * smokeColor * stepAlpha;
            transmittance *= exp(-sootSmoke * 4.0 * stepSize);
          }

          t += stepSize;
        }

        // Soft Atmospheric Candle Aura / Halo
        vec3 pNear = ro + rd * tNear;
        float distToAxis = length(pNear.xz - flameOrigin.xz);
        float auraHeight = pNear.y - flameOrigin.y;
        if (auraHeight > -0.05 && auraHeight < 1.3 && u_ambientO2 > 0.08) {
          float haloRadius = isCandle ? 28.0 : 6.0;
          float haloIntensity = isCandle ? 0.08 : 0.15;
          float halo = exp(-distToAxis * distToAxis * haloRadius) * (1.0 - smoothstep(0.0, 0.8, auraHeight)) * haloIntensity * u_brightness;
          vec3 haloCol = mix(vec3(1.0, 0.45, 0.05), vec3(0.1, 0.3, 0.9), isZeroG ? 0.85 : 0.05);
          accumColor += haloCol * halo * transmittance;
        }

        float finalAlpha = clamp(1.0 - transmittance, 0.0, 1.0);
        if (finalAlpha < 0.001) discard;

        gl_FragColor = vec4(accumColor, finalAlpha);
      }
    `;

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      depthTest: this.options.depthTest !== undefined ? this.options.depthTest : true,
      blending: THREE.CustomBlending,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      blendEquation: THREE.AddEquation,
      side: THREE.DoubleSide
    });

    this.mesh = new THREE.Mesh(boxGeo, this.material);
    this.mesh.renderOrder = this.options.renderOrder ?? 999;
    this.mesh.position.set(posX, posY + boxHeight * 0.5, posZ);
  }

  update(time, solverTexture) {
    this.uniforms.u_time.value = time;
    this.uniforms.u_steps.value = this.config.raymarchSteps;
    this.uniforms.u_brightness.value = this.config.flameBrightness;
    this.uniforms.u_smokeDensity.value = this.config.smokeDensity;
    this.uniforms.u_gravity.value = this.config.gravity;
    this.uniforms.u_vorticity.value = this.config.vorticityConfinement;
    this.uniforms.u_fuelRate.value = this.config.fuelRate;
    this.uniforms.u_ambientO2.value = this.config.ambientOxygen;
    this.uniforms.u_wind.value.set(this.config.windX, 0, this.config.windZ);

    const burnerShapes = { circle: 0, candle: 1, droplet: 2 };
    this.uniforms.u_burnerShape.value = burnerShapes[this.config.burnerShape] ?? 1;

    const modeMap = { blackbody: 0, chemiluminescence: 1, thermal: 2, flame: 3 };
    this.uniforms.u_colorMapMode.value = modeMap[this.config.colorMapMode] ?? 0;

    if (solverTexture) {
      this.uniforms.u_volumeAtlas.value = solverTexture;
    }
  }
}
