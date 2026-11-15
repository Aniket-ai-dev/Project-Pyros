/**
 * CombustionPhysics.js
 * Physical constants, gas mixtures, and kinetic parameters for 
 * Navier-Stokes combustion simulation in variable gravity.
 */

export const GAS_PRESETS = {
  methane: {
    name: 'Methane (CH₄) - Natural Gas',
    stoichiometricRatio: 2.0, // CH4 + 2 O2 -> CO2 + 2 H2O
    heatOfCombustion: 1.0,     // Normalized heat release
    activationEnergy: 2.5,     // Arrhenius Ea/R
    sootYield: 0.15,           // Low-to-moderate soot
    chemiluminescence: 0.85,   // Strong blue CH*/C2* radical emissions
    diffusionRate: 0.0025,
    flameTempMax: 2220         // Kelvin
  },
  propane: {
    name: 'Propane (C₃H₈)',
    stoichiometricRatio: 5.0, // C3H8 + 5 O2 -> 3 CO2 + 4 H2O
    heatOfCombustion: 1.25,
    activationEnergy: 2.2,
    sootYield: 0.45,           // High soot yield (bright yellow flame)
    chemiluminescence: 0.4,
    diffusionRate: 0.0018,
    flameTempMax: 2250
  },
  candleWax: {
    name: 'Paraffin Wax Vapor (C₂₅H₅₂)',
    stoichiometricRatio: 38.0,
    heatOfCombustion: 0.95,
    activationEnergy: 2.0,
    sootYield: 0.70,           // Very high luminous soot
    chemiluminescence: 0.25,
    diffusionRate: 0.0012,
    flameTempMax: 1670
  },
  hydrogen: {
    name: 'Hydrogen (H₂) - High Energy',
    stoichiometricRatio: 0.5, // 2 H2 + O2 -> 2 H2O
    heatOfCombustion: 1.6,
    activationEnergy: 1.4,
    sootYield: 0.0,            // Zero soot! Pure blue/invisible flame
    chemiluminescence: 1.0,
    diffusionRate: 0.0060,     // Very high molecular diffusivity
    flameTempMax: 2400
  }
};

export const GRAVITY_PRESETS = {
  earth: {
    name: 'Earth Gravity (1.0g)',
    gravity: 9.81,
    description: 'Strong buoyant convection elongates flame into a teardrop shape with turbulent flickering.'
  },
  iss: {
    name: 'ISS Microgravity (0.0g)',
    gravity: 0.0,
    description: 'Zero buoyancy convection. Pure spherical/dome diffusion flame as seen on NASA CIR/FLEX.'
  },
  moon: {
    name: 'Lunar Gravity (0.165g)',
    gravity: 1.62,
    description: 'Weak buoyancy results in a bulbous, dome-shaped flame with slow lazy flicker.'
  },
  mars: {
    name: 'Mars Gravity (0.38g)',
    gravity: 3.72,
    description: 'Moderate buoyancy producing a wider, shorter flame than Earth with distinct vortex rolls.'
  },
  centrifuge: {
    name: 'Hypergravity (2.5g)',
    gravity: 24.5,
    description: 'Intense buoyancy creates a needle-thin, high-velocity jet with high-frequency fluttering.'
  },
  inverted: {
    name: 'Inverted Gravity (-1.0g)',
    gravity: -9.81,
    description: 'Inverted buoyancy causes the flame to burn downward against the nozzle.'
  }
};

export class SimulationConfig {
  constructor() {
    // Grid dimensions
    this.resX = 64;
    this.resY = 96;
    this.resZ = 64;

    // Physical Conditions
    this.gravity = 9.81;        // m/s^2 (Earth = 9.81, ISS = 0.0)
    this.buoyancyAlpha = 0.045; // Thermal expansion buoyancy coefficient
    this.buoyancyBeta = 0.02;   // Soot drag/weight coefficient
    this.ambientOxygen = 0.21;  // Earth standard: 21% O2
    this.ambientTemp = 295.0;   // Ambient temperature in Kelvin
    this.ignitionTemp = 650.0;  // Threshold for Arrhenius reaction

    // Fuel Injection (Defaults to Realistic Candle Apparatus)
    this.fuelType = 'candleWax';
    this.fuelRate = 1.0;
    this.fuelVelocity = 0.08;   // Natural gentle wick capillary evaporation velocity
    this.nozzleRadius = 0.025;  // Slender wick cord radius
    this.burnerShape = 'candle';// 'candle', 'circle', 'droplet'

    // Fluid Dynamics
    this.timeStep = 0.12;
    this.viscosity = 0.0001;
    this.thermalDiffusion = 0.0008;
    this.oxygenDiffusion = 0.0015;
    this.vorticityConfinement = 0.28; // Preserves turbulent curls & flame tongues
    this.pressureIterations = 28;    // Jacobi projection iterations
    this.coolingRate = 0.012;         // Radiative heat loss (Planck cooling)

    // Wind / External Flow
    this.windX = 0.0;
    this.windY = 0.0;
    this.windZ = 0.0;

    // Rendering Parameters
    this.raymarchSteps = 96;
    this.flameBrightness = 2.4;
    this.smokeDensity = 1.6;
    this.sootColor = [0.12, 0.11, 0.10];
    this.colorMapMode = 'blackbody'; // 'blackbody', 'chemiluminescence', 'thermal', 'flame'
    this.bloomStrength = 0.8;
    this.shadowQuality = 1.0;

    // Diagnostics & Inspection
    this.slicePlane = 'XY';          // 'XY', 'XZ', 'YZ'
    this.sliceIndex = 32;
    this.sliceField = 'temperature'; // 'temperature', 'velocity', 'fuel', 'oxygen', 'pressure'
    this.paused = false;
  }
}

