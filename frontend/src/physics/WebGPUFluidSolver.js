/**
 * WebGPUFluidSolver.js
 * High-performance 3D Navier-Stokes combustion fluid simulation via WebGPU Compute Shaders.
 * Simulates velocity field, temperature, fuel, oxidizer (oxygen), and soot concentrations.
 */

export class WebGPUFluidSolver {
  constructor(config) {
    this.config = config;
    this.resX = config.resX;
    this.resY = config.resY;
    this.resZ = config.resZ;
    this.totalCells = this.resX * this.resY * this.resZ;
    this.isReady = false;

    // GPU handles
    this.device = null;
    this.pipelines = {};
    this.bindGroups = {};
    this.buffers = {};
    this.textures = {};
    
    // CPU telemetry buffers
    this.telemetryBuffer = null;
    this.telemetryReadback = new Float32Array(8); // [maxTemp, minTemp, avgTemp, maxVel, flameVolume, o2Min, sootMax, heatRelease]
  }

  async init(device) {
    this.device = device;
    if (!this.device) {
      throw new Error('WebGPU device not supplied');
    }

    try {
      this.createTexturesAndBuffers();
      await this.createComputePipelines();
      this.isReady = true;
      console.log('WebGPU Fluid Solver successfully initialized with resolution:', this.resX, this.resY, this.resZ);
      return true;
    } catch (err) {
      console.error('Failed to initialize WebGPU Fluid Solver:', err);
      this.isReady = false;
      return false;
    }
  }

  createTexturesAndBuffers() {
    const d = this.device;
    const numFloats = this.totalCells * 4;
    const byteSize = numFloats * 4; // float32

    // Simulation Storage Buffers (Ping-Pong for Velocity and Scalars)
    // Scalar buffer layout: R = Temperature, G = Fuel, B = Oxygen, A = Soot
    // Velocity buffer layout: R = u, G = v, B = w, A = 0
    const bufferUsage = GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST;

    this.buffers.vel0 = d.createBuffer({ size: byteSize, usage: bufferUsage });
    this.buffers.vel1 = d.createBuffer({ size: byteSize, usage: bufferUsage });
    this.buffers.scalar0 = d.createBuffer({ size: byteSize, usage: bufferUsage });
    this.buffers.scalar1 = d.createBuffer({ size: byteSize, usage: bufferUsage });
    this.buffers.divergence = d.createBuffer({ size: byteSize, usage: bufferUsage });
    this.buffers.pressure0 = d.createBuffer({ size: byteSize, usage: bufferUsage });
    this.buffers.pressure1 = d.createBuffer({ size: byteSize, usage: bufferUsage });
    this.buffers.vorticity = d.createBuffer({ size: byteSize, usage: bufferUsage });

    // Telemetry storage buffer (8 floats)
    this.buffers.telemetry = d.createBuffer({
      size: 32,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST
    });
    this.buffers.telemetryRead = d.createBuffer({
      size: 32,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
    });

    // Uniform Buffer for simulation parameters
    this.buffers.params = d.createBuffer({
      size: 256,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    // 3D Texture for Three.js volumetric raymarching
    // Format: rgba16float (or rgba32float)
    this.textures.volume = d.createTexture({
      size: [this.resX, this.resY, this.resZ],
      dimension: '3d',
      format: 'rgba16float',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.STORAGE_BINDING
    });

    // Initialize initial scalar conditions (ambient oxygen = 0.21, ambient temp = 295K, zero fuel)
    const initialScalars = new Float32Array(numFloats);
    const ambientO2 = this.config.ambientOxygen;
    const ambientTemp = this.config.ambientTemp / 2400.0; // normalized temp

    for (let i = 0; i < this.totalCells; i++) {
      const idx = i * 4;
      initialScalars[idx + 0] = ambientTemp; // Temp
      initialScalars[idx + 1] = 0.0;         // Fuel
      initialScalars[idx + 2] = ambientO2;    // Oxygen
      initialScalars[idx + 3] = 0.0;         // Soot
    }
    d.queue.writeBuffer(this.buffers.scalar0, 0, initialScalars);
    d.queue.writeBuffer(this.buffers.scalar1, 0, initialScalars);

    // Zero out velocity
    const zeros = new Float32Array(numFloats);
    d.queue.writeBuffer(this.buffers.vel0, 0, zeros);
    d.queue.writeBuffer(this.buffers.vel1, 0, zeros);
    d.queue.writeBuffer(this.buffers.pressure0, 0, zeros);
    d.queue.writeBuffer(this.buffers.pressure1, 0, zeros);
  }

  async createComputePipelines() {
    const d = this.device;

    const commonWGSL = `
      struct SimParams {
        res: vec4u,            // x, y, z, totalCells
        dt: f32,
        gravity: f32,
        buoyancyAlpha: f32,
        buoyancyBeta: f32,
        ambientO2: f32,
        ambientTemp: f32,
        ignitionTemp: f32,
        fuelRate: f32,
        fuelVel: f32,
        nozzleRadius: f32,
        heatRelease: f32,
        stoichO2: f32,
        sootYield: f32,
        coolingRate: f32,
        vorticityEps: f32,
        wind: vec4f,           // x, y, z, burnerShape (0=circle, 1=candle, 2=droplet)
        time: f32,
        sparkActive: f32,
        pad1: f32,
        pad2: f32,
      };

      @group(0) @binding(0) var<uniform> params: SimParams;

      fn coordToIndex(c: vec3u) -> u32 {
        let clamped = clamp(c, vec3u(0u), params.res.xyz - vec3u(1u));
        return clamped.x + clamped.y * params.res.x + clamped.z * params.res.x * params.res.y;
      }

      fn indexToCoord(idx: u32) -> vec3u {
        let z = idx / (params.res.x * params.res.y);
        let rem = idx % (params.res.x * params.res.y);
        let y = rem / params.res.x;
        let x = rem % params.res.x;
        return vec3u(x, y, z);
      }

      // Trilinear interpolation in 3D grid buffer
      fn sampleTrilinear(buf: ptr<storage, array<vec4f>, read>, uvw: vec3f) -> vec4f {
        let dims = vec3f(params.res.xyz);
        let pos = clamp(uvw * dims - 0.5, vec3f(0.0), dims - 1.001);
        let i0 = vec3u(floor(pos));
        let i1 = min(i0 + vec3u(1u), params.res.xyz - vec3u(1u));
        let f = fract(pos);

        let c000 = (*buf)[coordToIndex(vec3u(i0.x, i0.y, i0.z))];
        let c100 = (*buf)[coordToIndex(vec3u(i1.x, i0.y, i0.z))];
        let c010 = (*buf)[coordToIndex(vec3u(i0.x, i1.y, i0.z))];
        let c110 = (*buf)[coordToIndex(vec3u(i1.x, i1.y, i0.z))];

        let c001 = (*buf)[coordToIndex(vec3u(i0.x, i0.y, i1.z))];
        let c101 = (*buf)[coordToIndex(vec3u(i1.x, i0.y, i1.z))];
        let c011 = (*buf)[coordToIndex(vec3u(i0.x, i1.y, i1.z))];
        let c111 = (*buf)[coordToIndex(vec3u(i1.x, i1.y, i1.z))];

        let c00 = mix(c000, c100, f.x);
        let c10 = mix(c010, c110, f.x);
        let c01 = mix(c001, c101, f.x);
        let c11 = mix(c011, c111, f.x);

        let c0 = mix(c00, c10, f.y);
        let c1 = mix(c01, c11, f.y);

        return mix(c0, c1, f.z);
      }
    `;

    // 1. Advection Shader (Semi-Lagrangian)
    const advectionWGSL = `
      ${commonWGSL}
      @group(0) @binding(1) var<storage, read> velIn: array<vec4f>;
      @group(0) @binding(2) var<storage, read_write> velOut: array<vec4f>;
      @group(0) @binding(3) var<storage, read> scalarIn: array<vec4f>;
      @group(0) @binding(4) var<storage, read_write> scalarOut: array<vec4f>;

      @compute @workgroup_size(8, 8, 8)
      fn main(@builtin(global_invocation_id) gid: vec3u) {
        if (gid.x >= params.res.x || gid.y >= params.res.y || gid.z >= params.res.z) { return; }
        let idx = coordToIndex(gid);
        let u = velIn[idx].xyz;

        // Normalized backtracked coordinate
        let dt = params.dt;
        let dims = vec3f(params.res.xyz);
        let posNorm = (vec3f(gid) + 0.5) / dims;
        let prevPosNorm = posNorm - (u * dt) / dims;

        // Sample backtracked quantities
        let advectedVel = sampleTrilinear(&velIn, prevPosNorm).xyz;
        let advectedScalar = sampleTrilinear(&scalarIn, prevPosNorm);

        velOut[idx] = vec4f(advectedVel, 0.0);
        scalarOut[idx] = advectedScalar;
      }
    `;

    // 2. Combustion & Buoyancy Shader
    const combustionWGSL = `
      ${commonWGSL}
      @group(0) @binding(1) var<storage, read_write> vel: array<vec4f>;
      @group(0) @binding(2) var<storage, read_write> scalar: array<vec4f>;
      @group(0) @binding(3) var<storage, read_write> telemetry: array<f32>;

      @compute @workgroup_size(8, 8, 8)
      fn main(@builtin(global_invocation_id) gid: vec3u) {
        if (gid.x >= params.res.x || gid.y >= params.res.y || gid.z >= params.res.z) { return; }
        let idx = coordToIndex(gid);
        var s = scalar[idx]; // R=T, G=Fuel, B=O2, A=Soot
        var v = vel[idx].xyz;

        let center = vec3f(f32(params.res.x) * 0.5, 4.0, f32(params.res.z) * 0.5);
        let p = vec3f(gid);

        // Distance to burner axis
        let rHorizontal = length(vec2f(p.x - center.x, p.z - center.z));
        let burnerRadiusPx = params.nozzleRadius * f32(params.res.x);

        // Fuel Injection at bottom nozzle
        let burnerShape = u32(params.wind.w);
        let isCandle = (burnerShape == 1u);
        let effRadiusPx = select(burnerRadiusPx, 0.022 * f32(params.res.x), isCandle);
        var isBurner = false;

        if (burnerShape == 0u || burnerShape == 1u) { // Circle or Candle
          if (gid.y <= 4u && rHorizontal <= effRadiusPx) {
            isBurner = true;
            let profile = max(0.0, 1.0 - (rHorizontal / effRadiusPx) * (rHorizontal / effRadiusPx));
            let rate = select(params.fuelRate, params.fuelRate * 0.85, isCandle);
            let heat = select(0.72, 0.68, isCandle);
            let vel = select(params.fuelVel, params.fuelVel * 0.35, isCandle);
            s.y = max(s.y, rate * profile);
            s.x = max(s.x, heat * profile);
            v.y += vel * profile;
          }
        } else if (burnerShape == 2u) { // Microgravity Droplet (centered in domain)
          let dropCenter = vec3f(params.res.xyz) * 0.5;
          let distDrop = length(p - dropCenter);
          if (distDrop <= burnerRadiusPx * 1.5) {
            isBurner = true;
            s.y = max(s.y, params.fuelRate * 0.95);
            s.x = max(s.x, 0.70); // Droplet surface ignition
          }
        }

        // Ignition source (Pilot spark or startup)
        if (params.sparkActive > 0.5) {
          let sparkPos = center + vec3f(0.0, 3.0, 0.0);
          if (length(p - sparkPos) < 5.0) {
            s.x = max(s.x, 0.85); // 2000K ignition spark
          }
        }

        // Arrhenius Combustion Reaction
        let T_actual = s.x * 2400.0; // Kelvin
        let T_ignite = params.ignitionTemp;
        let fuel = max(0.0, s.y);
        let o2 = max(0.0, s.z);

        if (T_actual > T_ignite && fuel > 0.005 && o2 > 0.005) {
          // Arrhenius rate: k = A * exp(-Ea / T)
          let Ea_R = 3500.0;
          let kArrhenius = 45.0 * exp(-Ea_R / (T_actual + 10.0));
          let reactionRate = kArrhenius * fuel * o2;

          let burnAmount = min(fuel, min(o2 / max(0.1, params.stoichO2), reactionRate * params.dt));

          // Consume fuel and oxygen
          s.y = max(0.0, s.y - burnAmount);
          s.z = max(0.0, s.z - burnAmount * params.stoichO2);

          // Heat release and soot formation
          s.x = min(1.0, s.x + burnAmount * params.heatRelease * 1.8);
          s.w = s.w + burnAmount * params.sootYield * 2.2;
        }

        // Radiative Cooling (Planck loss ~ T^4)
        let T_diff = max(0.0, s.x - params.ambientTemp / 2400.0);
        s.x = max(params.ambientTemp / 2400.0, s.x - params.coolingRate * T_diff * s.x * s.x * params.dt);

        // Soot dissipation / smoke dispersal
        s.w = max(0.0, s.w * (1.0 - 0.004 * params.dt));

        // Ambient Oxygen Replenishment & Boundary conditions
        if (gid.x == 0u || gid.x == params.res.x - 1u || 
            gid.y == params.res.y - 1u ||
            gid.z == 0u || gid.z == params.res.z - 1u) {
          s.z = mix(s.z, params.ambientO2, 0.15);
          s.x = mix(s.x, params.ambientTemp / 2400.0, 0.2);
          s.y *= 0.8;
          s.w *= 0.8;
        }

        // BUOYANCY FORCE (Boussinesq Approximation)
        // f_buoy = alpha * (T - T_amb) * (-g) - beta * Soot * g
        let tempDiff = (s.x * 2400.0 - params.ambientTemp);
        let buoyancyForceY = params.buoyancyAlpha * tempDiff * (params.gravity / 9.81) - params.buoyancyBeta * s.w * params.gravity;

        // Add Buoyancy + Wind
        v.y += buoyancyForceY * params.dt;
        v.x += params.wind.x * params.dt;
        v.z += params.wind.z * params.dt;

        scalar[idx] = s;
        vel[idx] = vec4f(v, 0.0);
      }
    `;

    // 3. Vorticity Confinement Shader
    const vorticityWGSL = `
      ${commonWGSL}
      @group(0) @binding(1) var<storage, read> velIn: array<vec4f>;
      @group(0) @binding(2) var<storage, read_write> vortOut: array<vec4f>;

      @compute @workgroup_size(8, 8, 8)
      fn calcVorticity(@builtin(global_invocation_id) gid: vec3u) {
        if (gid.x >= params.res.x || gid.y >= params.res.y || gid.z >= params.res.z) { return; }
        let idx = coordToIndex(gid);

        // Central differences for curl(v) = (dw/dy - dv/dz, du/dz - dw/dx, dv/dx - du/dy)
        let v_yp = velIn[coordToIndex(gid + vec3u(0u, 1u, 0u))].xyz;
        let v_ym = velIn[coordToIndex(gid - vec3u(0u, 1u, 0u))].xyz;
        let v_zp = velIn[coordToIndex(gid + vec3u(0u, 0u, 1u))].xyz;
        let v_zm = velIn[coordToIndex(gid - vec3u(0u, 0u, 1u))].xyz;
        let v_xp = velIn[coordToIndex(gid + vec3u(1u, 0u, 0u))].xyz;
        let v_xm = velIn[coordToIndex(gid - vec3u(1u, 0u, 0u))].xyz;

        let curlX = (v_yp.z - v_ym.z) * 0.5 - (v_zp.y - v_zm.y) * 0.5;
        let curlY = (v_zp.x - v_zm.x) * 0.5 - (v_xp.z - v_xm.z) * 0.5;
        let curlZ = (v_xp.y - v_xm.y) * 0.5 - (v_yp.x - v_ym.x) * 0.5;
        let curl = vec3f(curlX, curlY, curlZ);

        vortOut[idx] = vec4f(curl, length(curl));
      }
    `;

    const applyVorticityWGSL = `
      ${commonWGSL}
      @group(0) @binding(1) var<storage, read_write> vel: array<vec4f>;
      @group(0) @binding(2) var<storage, read> vort: array<vec4f>;

      @compute @workgroup_size(8, 8, 8)
      fn applyConfinement(@builtin(global_invocation_id) gid: vec3u) {
        if (gid.x >= params.res.x || gid.y >= params.res.y || gid.z >= params.res.z) { return; }
        let idx = coordToIndex(gid);

        // Gradient of vorticity magnitude: eta = grad(|omega|)
        let etaX = (vort[coordToIndex(gid + vec3u(1u, 0u, 0u))].w - vort[coordToIndex(gid - vec3u(1u, 0u, 0u))].w) * 0.5;
        let etaY = (vort[coordToIndex(gid + vec3u(0u, 1u, 0u))].w - vort[coordToIndex(gid - vec3u(0u, 1u, 0u))].w) * 0.5;
        let etaZ = (vort[coordToIndex(gid + vec3u(0u, 0u, 1u))].w - vort[coordToIndex(gid - vec3u(0u, 0u, 1u))].w) * 0.5;
        let eta = vec3f(etaX, etaY, etaZ);

        let lenEta = length(eta);
        if (lenEta > 0.0001) {
          let N = eta / lenEta;
          let omega = vort[idx].xyz;
          let f_conf = params.vorticityEps * cross(N, omega);
          vel[idx] = vec4f(vel[idx].xyz + f_conf * params.dt, 0.0);
        }
      }
    `;

    // 4. Divergence Shader
    const divergenceWGSL = `
      ${commonWGSL}
      @group(0) @binding(1) var<storage, read> vel: array<vec4f>;
      @group(0) @binding(2) var<storage, read_write> div: array<vec4f>;

      @compute @workgroup_size(8, 8, 8)
      fn main(@builtin(global_invocation_id) gid: vec3u) {
        if (gid.x >= params.res.x || gid.y >= params.res.y || gid.z >= params.res.z) { return; }
        let idx = coordToIndex(gid);

        let u_xp = vel[coordToIndex(gid + vec3u(1u, 0u, 0u))].x;
        let u_xm = vel[coordToIndex(gid - vec3u(1u, 0u, 0u))].x;
        let v_yp = vel[coordToIndex(gid + vec3u(0u, 1u, 0u))].y;
        let v_ym = vel[coordToIndex(gid - vec3u(0u, 1u, 0u))].y;
        let w_zp = vel[coordToIndex(gid + vec3u(0u, 0u, 1u))].z;
        let w_zm = vel[coordToIndex(gid - vec3u(0u, 0u, 1u))].z;

        let divergence = 0.5 * ((u_xp - u_xm) + (v_yp - v_ym) + (w_zp - w_zm));
        div[idx] = vec4f(divergence, 0.0, 0.0, 0.0);
      }
    `;

    // 5. Jacobi Pressure Solve Shader
    const jacobiWGSL = `
      ${commonWGSL}
      @group(0) @binding(1) var<storage, read> pIn: array<vec4f>;
      @group(0) @binding(2) var<storage, read_write> pOut: array<vec4f>;
      @group(0) @binding(3) var<storage, read> div: array<vec4f>;

      @compute @workgroup_size(8, 8, 8)
      fn main(@builtin(global_invocation_id) gid: vec3u) {
        if (gid.x >= params.res.x || gid.y >= params.res.y || gid.z >= params.res.z) { return; }
        let idx = coordToIndex(gid);

        let p_xp = pIn[coordToIndex(gid + vec3u(1u, 0u, 0u))].x;
        let p_xm = pIn[coordToIndex(gid - vec3u(1u, 0u, 0u))].x;
        let p_yp = pIn[coordToIndex(gid + vec3u(0u, 1u, 0u))].x;
        let p_ym = pIn[coordToIndex(gid - vec3u(0u, 1u, 0u))].x;
        let p_zp = pIn[coordToIndex(gid + vec3u(0u, 0u, 1u))].x;
        let p_zm = pIn[coordToIndex(gid - vec3u(0u, 0u, 1u))].x;

        let d = div[idx].x;
        let p_new = (p_xp + p_xm + p_yp + p_ym + p_zp + p_zm - d) / 6.0;

        pOut[idx] = vec4f(p_new, 0.0, 0.0, 0.0);
      }
    `;

    // 6. Projection (Gradient Subtraction) Shader
    const projectWGSL = `
      ${commonWGSL}
      @group(0) @binding(1) var<storage, read_write> vel: array<vec4f>;
      @group(0) @binding(2) var<storage, read> pressure: array<vec4f>;

      @compute @workgroup_size(8, 8, 8)
      fn main(@builtin(global_invocation_id) gid: vec3u) {
        if (gid.x >= params.res.x || gid.y >= params.res.y || gid.z >= params.res.z) { return; }
        let idx = coordToIndex(gid);

        let p_xp = pressure[coordToIndex(gid + vec3u(1u, 0u, 0u))].x;
        let p_xm = pressure[coordToIndex(gid - vec3u(1u, 0u, 0u))].x;
        let p_yp = pressure[coordToIndex(gid + vec3u(0u, 1u, 0u))].x;
        let p_ym = pressure[coordToIndex(gid - vec3u(0u, 1u, 0u))].x;
        let p_zp = pressure[coordToIndex(gid + vec3u(0u, 0u, 1u))].x;
        let p_zm = pressure[coordToIndex(gid - vec3u(0u, 0u, 1u))].x;

        let gradP = vec3f(p_xp - p_xm, p_yp - p_ym, p_zp - p_zm) * 0.5;
        vel[idx] = vec4f(vel[idx].xyz - gradP, 0.0);
      }
    `;

    // 7. Copy to 3D Volume Texture Shader (for volumetric raymarcher)
    const copyToVolumeWGSL = `
      ${commonWGSL}
      @group(0) @binding(1) var<storage, read> scalar: array<vec4f>;
      @group(0) @binding(2) var outVolume: texture_storage_3d<rgba16float, write>;

      @compute @workgroup_size(8, 8, 8)
      fn main(@builtin(global_invocation_id) gid: vec3u) {
        if (gid.x >= params.res.x || gid.y >= params.res.y || gid.z >= params.res.z) { return; }
        let idx = coordToIndex(gid);
        let s = scalar[idx]; // R=T, G=Fuel, B=O2, A=Soot
        textureStore(outVolume, gid, s);
      }
    `;

    // Compile modules and pipelines
    const createPipeline = (code, entry) => {
      const module = d.createShaderModule({ code });
      return d.createComputePipeline({
        layout: 'auto',
        compute: { module, entryPoint: entry }
      });
    };

    this.pipelines.advection = createPipeline(advectionWGSL, 'main');
    this.pipelines.combustion = createPipeline(combustionWGSL, 'main');
    this.pipelines.calcVorticity = createPipeline(vorticityWGSL, 'calcVorticity');
    this.pipelines.applyVorticity = createPipeline(applyVorticityWGSL, 'applyConfinement');
    this.pipelines.divergence = createPipeline(divergenceWGSL, 'main');
    this.pipelines.jacobi = createPipeline(jacobiWGSL, 'main');
    this.pipelines.project = createPipeline(projectWGSL, 'main');
    this.pipelines.copyToVolume = createPipeline(copyToVolumeWGSL, 'main');
  }

  updateUniforms(gasConfig, sparkActive = false) {
    const d = this.device;
    const c = this.config;

    const u = new ArrayBuffer(256);
    const u32 = new Uint32Array(u);
    const f32 = new Float32Array(u);

    // res: vec4u (resX, resY, resZ, totalCells)
    u32[0] = this.resX;
    u32[1] = this.resY;
    u32[2] = this.resZ;
    u32[3] = this.totalCells;

    // dt, gravity, buoyancyAlpha, buoyancyBeta
    f32[4] = c.timeStep;
    f32[5] = c.gravity;
    f32[6] = c.buoyancyAlpha;
    f32[7] = c.buoyancyBeta;

    // ambientO2, ambientTemp, ignitionTemp, fuelRate
    f32[8] = c.ambientOxygen;
    f32[9] = c.ambientTemp;
    f32[10] = c.ignitionTemp;
    f32[11] = c.fuelRate;

    // fuelVel, nozzleRadius, heatRelease, stoichO2
    f32[12] = c.fuelVelocity;
    f32[13] = c.nozzleRadius;
    f32[14] = gasConfig.heatOfCombustion;
    f32[15] = gasConfig.stoichiometricRatio;

    // sootYield, coolingRate, vorticityEps
    f32[16] = gasConfig.sootYield;
    f32[17] = c.coolingRate;
    f32[18] = c.vorticityConfinement;

    // wind: vec4f (x, y, z, burnerShape)
    f32[20] = c.windX;
    f32[21] = c.windY;
    f32[22] = c.windZ;
    f32[23] = c.burnerShape === 'circle' ? 0 : (c.burnerShape === 'candle' ? 1 : 2);

    // time, sparkActive
    f32[24] = performance.now() * 0.001;
    f32[25] = sparkActive ? 1.0 : 0.0;

    d.queue.writeBuffer(this.buffers.params, 0, u);
  }

  step(gasConfig, sparkActive = false) {
    if (!this.isReady || this.config.paused) return;

    this.updateUniforms(gasConfig, sparkActive);

    const d = this.device;
    const commandEncoder = d.createCommandEncoder({ label: 'FluidStepEncoder' });
    const computePass = commandEncoder.beginComputePass({ label: 'FluidComputePass' });

    const workgroupsX = Math.ceil(this.resX / 8);
    const workgroupsY = Math.ceil(this.resY / 8);
    const workgroupsZ = Math.ceil(this.resZ / 8);

    // Helper to bind and dispatch
    const dispatch = (pipeline, entries) => {
      const bindGroup = d.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries
      });
      computePass.setPipeline(pipeline);
      computePass.setBindGroup(0, bindGroup);
      computePass.dispatchWorkgroups(workgroupsX, workgroupsY, workgroupsZ);
    };

    // 1. Advection (Ping-Pong 0 -> 1)
    dispatch(this.pipelines.advection, [
      { binding: 0, resource: { buffer: this.buffers.params } },
      { binding: 1, resource: { buffer: this.buffers.vel0 } },
      { binding: 2, resource: { buffer: this.buffers.vel1 } },
      { binding: 3, resource: { buffer: this.buffers.scalar0 } },
      { binding: 4, resource: { buffer: this.buffers.scalar1 } }
    ]);

    // 2. Combustion & Buoyancy (Operates on scalar1, vel1)
    dispatch(this.pipelines.combustion, [
      { binding: 0, resource: { buffer: this.buffers.params } },
      { binding: 1, resource: { buffer: this.buffers.vel1 } },
      { binding: 2, resource: { buffer: this.buffers.scalar1 } },
      { binding: 3, resource: { buffer: this.buffers.telemetry } }
    ]);

    // 3. Vorticity Confinement
    dispatch(this.pipelines.calcVorticity, [
      { binding: 0, resource: { buffer: this.buffers.params } },
      { binding: 1, resource: { buffer: this.buffers.vel1 } },
      { binding: 2, resource: { buffer: this.buffers.vorticity } }
    ]);
    dispatch(this.pipelines.applyVorticity, [
      { binding: 0, resource: { buffer: this.buffers.params } },
      { binding: 1, resource: { buffer: this.buffers.vel1 } },
      { binding: 2, resource: { buffer: this.buffers.vorticity } }
    ]);

    // 4. Divergence of velocity
    dispatch(this.pipelines.divergence, [
      { binding: 0, resource: { buffer: this.buffers.params } },
      { binding: 1, resource: { buffer: this.buffers.vel1 } },
      { binding: 2, resource: { buffer: this.buffers.divergence } }
    ]);

    // 5. Jacobi Pressure Solve (28 iterations ping-pong)
    let pRead = this.buffers.pressure0;
    let pWrite = this.buffers.pressure1;
    for (let it = 0; it < this.config.pressureIterations; it++) {
      dispatch(this.pipelines.jacobi, [
        { binding: 0, resource: { buffer: this.buffers.params } },
        { binding: 1, resource: { buffer: pRead } },
        { binding: 2, resource: { buffer: pWrite } },
        { binding: 3, resource: { buffer: this.buffers.divergence } }
      ]);
      // Swap pressure buffers
      const tmp = pRead;
      pRead = pWrite;
      pWrite = tmp;
    }

    // 6. Project (Gradient subtraction on vel1)
    dispatch(this.pipelines.project, [
      { binding: 0, resource: { buffer: this.buffers.params } },
      { binding: 1, resource: { buffer: this.buffers.vel1 } },
      { binding: 2, resource: { buffer: pRead } }
    ]);

    // 7. Copy scalar1 to 3D storage texture for Raymarching
    dispatch(this.pipelines.copyToVolume, [
      { binding: 0, resource: { buffer: this.buffers.params } },
      { binding: 1, resource: { buffer: this.buffers.scalar1 } },
      { binding: 2, resource: this.textures.volume.createView() }
    ]);

    computePass.end();

    // Copy vel1 -> vel0, scalar1 -> scalar0 for next frame
    const byteSize = this.totalCells * 16;
    commandEncoder.copyBufferToBuffer(this.buffers.vel1, 0, this.buffers.vel0, 0, byteSize);
    commandEncoder.copyBufferToBuffer(this.buffers.scalar1, 0, this.buffers.scalar0, 0, byteSize);

    d.queue.submit([commandEncoder.finish()]);
  }

  reset() {
    if (!this.device) return;
    const numFloats = this.totalCells * 4;
    const initialScalars = new Float32Array(numFloats);
    const ambientO2 = this.config.ambientOxygen;
    const ambientTemp = this.config.ambientTemp / 2400.0;

    for (let i = 0; i < this.totalCells; i++) {
      const idx = i * 4;
      initialScalars[idx + 0] = ambientTemp;
      initialScalars[idx + 1] = 0.0;
      initialScalars[idx + 2] = ambientO2;
      initialScalars[idx + 3] = 0.0;
    }
    this.device.queue.writeBuffer(this.buffers.scalar0, 0, initialScalars);
    this.device.queue.writeBuffer(this.buffers.scalar1, 0, initialScalars);

    const zeros = new Float32Array(numFloats);
    this.device.queue.writeBuffer(this.buffers.vel0, 0, zeros);
    this.device.queue.writeBuffer(this.buffers.vel1, 0, zeros);
    this.device.queue.writeBuffer(this.buffers.pressure0, 0, zeros);
    this.device.queue.writeBuffer(this.buffers.pressure1, 0, zeros);
  }
}

