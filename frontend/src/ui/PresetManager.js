/**
 * PresetManager.js
 * NASA flight experiments & combustion regimes presets.
 * Includes comprehensive candle physics across variable gravity and oxygen levels.
 */

export const FLIGHT_PRESETS = [
  {
    id: 'candle-earth',
    name: '🕯️ Real Earth Candle (1.0g)',
    badge: '1.0g // 21% O₂',
    description: 'Classic Earth candle. Natural buoyant convection stretches the flame into a graceful teardrop with a blue base cup, dark unburned vapor core, and luminous golden-white soot cap.',
    config: {
      gravity: 9.81,
      ambientOxygen: 0.21,
      fuelType: 'candleWax',
      fuelRate: 1.0,
      fuelVelocity: 0.08,
      nozzleRadius: 0.025,
      burnerShape: 'candle',
      vorticityConfinement: 0.26,
      smokeDensity: 1.6,
      colorMapMode: 'blackbody',
      windX: 0.0
    }
  },
  {
    id: 'candle-iss',
    name: '🛰️ ISS Zero-G Spherical Candle (0.0g)',
    badge: '0.0g // Pure Blue Dome',
    description: 'NASA ISS microgravity candle. Buoyant convection vanishes completely. Isotropic molecular diffusion produces a calm, spherical blue dome flame centered around the wick.',
    config: {
      gravity: 0.0,
      ambientOxygen: 0.21,
      fuelType: 'candleWax',
      fuelRate: 0.85,
      fuelVelocity: 0.02,
      nozzleRadius: 0.025,
      burnerShape: 'candle',
      vorticityConfinement: 0.02,
      smokeDensity: 0.4,
      colorMapMode: 'chemiluminescence',
      windX: 0.0
    }
  },
  {
    id: 'candle-lunar',
    name: '🌕 Lunar Gravity Candle (0.165g)',
    badge: '0.165g (1.62 m/s²)',
    description: 'Moon surface gravity. Weak buoyant convection produces a fat, bulbous dome flame twice as wide as Earth with a slow, lazy 2-4 Hz flicker.',
    config: {
      gravity: 1.62,
      ambientOxygen: 0.21,
      fuelType: 'candleWax',
      fuelRate: 0.95,
      fuelVelocity: 0.08,
      nozzleRadius: 0.025,
      burnerShape: 'candle',
      vorticityConfinement: 0.16,
      smokeDensity: 1.2,
      colorMapMode: 'blackbody',
      windX: 0.0
    }
  },
  {
    id: 'candle-mars',
    name: '🔴 Mars Atmosphere Candle (0.38g)',
    badge: '0.38g (3.72 m/s²)',
    description: 'Mars atmospheric gravity testing. Intermediate buoyancy creates a wider flame than Earth with distinct periodic vortex shedding.',
    config: {
      gravity: 3.72,
      ambientOxygen: 0.21,
      fuelType: 'candleWax',
      fuelRate: 1.0,
      fuelVelocity: 0.08,
      nozzleRadius: 0.025,
      burnerShape: 'candle',
      vorticityConfinement: 0.22,
      smokeDensity: 1.4,
      colorMapMode: 'blackbody',
      windX: 0.0
    }
  },
  {
    id: 'candle-hypoxic',
    name: '⚠️ Hypoxic Starvation (11% O₂)',
    badge: 'Low O₂ // Heavy Smoke',
    description: 'Atmospheric oxygen drops below the limiting oxygen index (LOI). Flame starves, cools rapidly, produces heavy black unburned soot smoke, and suffocates.',
    config: {
      gravity: 9.81,
      ambientOxygen: 0.11,
      fuelType: 'candleWax',
      fuelRate: 0.7,
      fuelVelocity: 0.06,
      nozzleRadius: 0.025,
      burnerShape: 'candle',
      vorticityConfinement: 0.35,
      smokeDensity: 3.2,
      colorMapMode: 'blackbody',
      windX: 0.0
    }
  },
  {
    id: 'candle-hyper',
    name: '⚡ Hyperoxic Pure O₂ Candle (100% O₂)',
    badge: '100% O₂ // Ultra-Intense',
    description: 'Pure oxidizer environment. Arrhenius reaction accelerates exponentially, producing a blinding blue-white incandescent flame with zero soot and ultra-high heat release.',
    config: {
      gravity: 9.81,
      ambientOxygen: 1.0,
      fuelType: 'candleWax',
      fuelRate: 1.4,
      fuelVelocity: 0.25,
      nozzleRadius: 0.025,
      burnerShape: 'candle',
      vorticityConfinement: 0.42,
      smokeDensity: 0.2,
      colorMapMode: 'chemiluminescence',
      windX: 0.0
    }
  },
  {
    id: 'candle-wind',
    name: '💨 Candle in Crosswind',
    badge: 'Wind: 0.35 m/s',
    description: 'Aerodynamic crosswind deflects the flame horizontally, causing turbulent wake vortex shedding and flame elongation.',
    config: {
      gravity: 9.81,
      ambientOxygen: 0.21,
      fuelType: 'candleWax',
      fuelRate: 1.1,
      fuelVelocity: 0.12,
      nozzleRadius: 0.025,
      burnerShape: 'candle',
      vorticityConfinement: 0.45,
      smokeDensity: 1.8,
      colorMapMode: 'blackbody',
      windX: 0.35
    }
  },
  {
    id: 'burner-jet',
    name: '🚀 NASA CIR Aerospike Burner',
    badge: 'Propane Jet',
    description: 'Stainless-steel aerospace combustion chamber burner jet with high velocity fuel injection and tungsten pilot igniters.',
    config: {
      gravity: 9.81,
      ambientOxygen: 0.21,
      fuelType: 'propane',
      fuelRate: 1.1,
      fuelVelocity: 0.18,
      nozzleRadius: 0.12,
      burnerShape: 'circle',
      vorticityConfinement: 0.32,
      smokeDensity: 1.5,
      colorMapMode: 'blackbody',
      windX: 0.0
    }
  }
];

export class PresetManager {
  constructor(config, onPresetApply) {
    this.config = config;
    this.onPresetApply = onPresetApply;
  }

  apply(presetId) {
    const preset = FLIGHT_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    Object.assign(this.config, preset.config);
    if (this.onPresetApply) {
      this.onPresetApply(preset);
    }
  }
}
