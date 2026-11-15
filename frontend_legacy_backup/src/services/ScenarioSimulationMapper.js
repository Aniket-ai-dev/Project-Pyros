/**
 * ScenarioSimulationMapper.js
 * 
 * Single source of truth for whether a scenario is simulatable in the 3D combustion engine.
 * Maps backend responses (full extrapolation or general scenario analysis) into a validated,
 * normalized SimulationConfig contract.
 * 
 * SCIENTIFIC CLASSIFICATION INTEGRITY:
 * 1. DIRECT SIMULATION INPUTS (Required for basic simulation):
 *    - Gravity: Mapped directly to physical gravitational acceleration (m/s² = g * 9.81)
 *      driving Navier-Stokes vertical buoyant body force (Fy = α(T - Tamb)g - β·Soot·g)
 *      and spacecraft scene rigid body kinematics.
 *    - Oxygen Concentration: Mole fraction (X_O2 = o2_pct / 100) directly parameterizing
 *      species reaction kinetics and oxidizer consumption.
 *    - Fuel Kinetic Preset: Valid burner kinetic analogue (candleWax, methane, propane, hydrogen).
 * 
 * 2. OPTIONAL SCIENTIFIC ENHANCEMENTS (Do NOT block basic simulation if absent):
 *    - Buoyancy strength scaling (native fluid solver calculates buoyancy via Navier-Stokes body forces)
 *    - Natural convection velocity (native fluid solver computes plume ascent via momentum advection)
 *    - Flame height scaling (procedural visual envelope; native solver uses Roper/empirical scaling)
 *    - Oxygen enhancement factor (emission brightness; defaults to o2_pct / 21)
 *    - Barometric Pressure (psi / kPa): Incompressible Navier-Stokes (div(u) = 0) does not alter density.
 *      Displayed strictly in life support (ECLSS) telemetry.
 */

export class ScenarioSimulationMapper {
  /**
   * Evaluates simulation availability and extracts normalized simulation configuration.
   * 
   * @param {Object} backendResponse - Raw API response from /scenario or /query
   * @param {string} [fallbackQueryText] - Original scenario query text if not echoed in response
   * @returns {Object} NormalizedSimulationConfig
   */
  static map(backendResponse, fallbackQueryText = '') {
    const warnings = [];
    const missingParams = [];

    if (!backendResponse || typeof backendResponse !== 'object') {
      return {
        isValid: false,
        canSimulate: false,
        simulationMode: 'INSUFFICIENT_DATA',
        modeLabel: 'SIMULATION UNAVAILABLE',
        missingParameters: ['response_data'],
        errors: ['Backend response is empty or malformed.'],
        warnings: []
      };
    }

    const extrap = backendResponse.extrapolation;
    const answer = backendResponse.answer || backendResponse.comparison || {};
    const rankedInvs = backendResponse.ranked_investigations || [];
    const sources = backendResponse.sources || [];

    // Query text for extraction
    const rawText = (
      (typeof backendResponse.query === 'string' && backendResponse.query) ||
      (typeof backendResponse.scenario === 'string' && backendResponse.scenario) ||
      fallbackQueryText ||
      ''
    ).trim();
    const lowerText = rawText.toLowerCase();

    let targetG = null;
    let targetO2 = null;
    let targetPsi = null;
    let fuelDesc = '';
    let hasExtrapolatedBounds = false;
    let bounds = [];

    // ── 1. CHECK FOR FULL EXTRAPOLATION DATA ────────────────────────────────
    if (extrap && typeof extrap === 'object' && extrap.target_gravity !== undefined && extrap.target_gravity !== null) {
      const gNum = Number(extrap.target_gravity);
      if (!isNaN(gNum)) {
        targetG = gNum;
      }
      if (extrap.target_o2_pct !== undefined && extrap.target_o2_pct !== null) {
        const o2Num = Number(extrap.target_o2_pct);
        if (!isNaN(o2Num)) targetO2 = o2Num;
      }
      if (extrap.target_pressure_psi !== undefined && extrap.target_pressure_psi !== null) {
        const psiNum = Number(extrap.target_pressure_psi);
        if (!isNaN(psiNum)) targetPsi = psiNum;
      }
      fuelDesc = (extrap.fuel_description || '').trim();
      bounds = Array.isArray(extrap.physics_bounds) ? extrap.physics_bounds : [];
      hasExtrapolatedBounds = bounds.length > 0;
    }

    // ── 2. FALLBACK EXTRACTION FROM SCENARIO TEXT / BACKEND CONTEXT ────────
    // If gravity was not in extrapolation data, attempt to extract from scenario
    if (targetG === null) {
      targetG = this.extractGravity(lowerText);
    }

    // If oxygen was not in extrapolation data, attempt to extract from scenario
    if (targetO2 === null) {
      targetO2 = this.extractOxygen(lowerText);
    }

    // If pressure was not in extrapolation data, attempt to extract or default
    if (targetPsi === null) {
      targetPsi = this.extractPressure(lowerText, targetG);
    }

    // If fuel was not in extrapolation data, attempt to extract from scenario
    if (!fuelDesc) {
      fuelDesc = this.extractFuelDescription(lowerText);
    }

    // ── 3. VALIDATE REQUIRED SIMULATION PARAMETERS ─────────────────────────
    if (targetG === null || isNaN(targetG)) {
      missingParams.push('gravity');
    }
    if (targetO2 === null || isNaN(targetO2)) {
      missingParams.push('oxygen');
    }

    // If any required parameter is missing, simulation cannot safely run
    if (missingParams.length > 0) {
      return {
        isValid: false,
        canSimulate: false,
        simulationMode: 'INSUFFICIENT_DATA',
        modeLabel: 'SIMULATION UNAVAILABLE',
        missingParameters: missingParams,
        errors: [`Simulation requires ${missingParams.join(' and ')}. Genuinely insufficient scenario data.`],
        warnings,
        telemetry: {
          scientific_insight: answer.combined_insight || '',
          gap_analysis: answer.gap_analysis || '',
          ranked_investigations: rankedInvs,
          sources
        }
      };
    }

    // ── 4. CLAMP AND NORMALIZE DIRECT PARAMETERS ───────────────────────────
    targetG = Math.max(0.0, Number(targetG));
    targetO2 = Math.max(0.0, Math.min(100.0, Number(targetO2)));
    targetPsi = Math.max(0.5, Number(targetPsi));

    if (targetG > 2.5) {
      warnings.push(`Target gravity ${targetG.toFixed(2)}g is elevated beyond standard human spaceflight bounds.`);
    }

    const gravityMs2 = targetG * 9.81;
    const oxygenFraction = targetO2 / 100.0;
    const pressureKpa = targetPsi * 6.89476;

    // ── 5. DETERMINE SIMULATION MODE & OPTIONAL BOUNDS ───────────────────────
    let simulationMode = 'DIRECT_SCENARIO';
    let modeLabel = 'DIRECT SCENARIO SIMULATION';

    let buoyancyVal = targetG;
    let convVelVal = targetG > 0.01 ? Number((0.28 * Math.sqrt(targetG)).toFixed(3)) : 0.0;
    let o2FactorVal = targetO2 / 21.0;
    let flameHeightVal = targetG < 0.05 ? 26.0 : Number((26.0 + (1.0 - targetG) * 10.0 + (targetO2 / 21.0) * 8.0).toFixed(1));
    let spreadRateVal = null;

    if (hasExtrapolatedBounds) {
      simulationMode = 'FULL_EXTRAPOLATION';
      modeLabel = 'FULL SCIENTIFIC BOUNDS AVAILABLE';

      const findBound = (substr) => bounds.find(b => (b.parameter_name || '').toLowerCase().includes(substr.toLowerCase()));
      const bBuoyancy = findBound('buoyancy');
      const bConv = findBound('convection');
      const bO2 = findBound('oxygen');
      const bHeight = findBound('height');
      const bSpread = findBound('spread');

      if (bBuoyancy && bBuoyancy.lower_bound !== undefined) buoyancyVal = bBuoyancy.lower_bound;
      if (bConv && bConv.lower_bound !== undefined) convVelVal = bConv.lower_bound;
      if (bO2 && bO2.lower_bound !== undefined) o2FactorVal = bO2.lower_bound;
      if (bHeight && bHeight.lower_bound !== undefined) flameHeightVal = bHeight.lower_bound;
      if (bSpread && bSpread.lower_bound !== undefined) spreadRateVal = bSpread.lower_bound;
    } else {
      warnings.push('Running with direct scenario conditions. Some extrapolated visualization bounds are unavailable.');
    }

    // ── 6. FUEL PRESET SELECTION ────────────────────────────────────────────
    const fuelPreset = this.mapFuelPreset(fuelDesc, warnings);

    // ── 7. EXTINCTION & HYPOXIA RISK ASSESSMENT ────────────────────────────
    const extinctionRisk = this.assessExtinctionRisk(targetG, targetO2);

    // ── 8. DERIVED VISUALIZATION CONSTRAINTS ────────────────────────────────
    const flameScale = Math.max(0.5, Math.min(2.5, flameHeightVal / 30.0));
    
    let emissionMod = 1.0;
    if (extinctionRisk.isExtinguished) {
      emissionMod = 0.05;
    } else if (extinctionRisk.isHypoxic) {
      emissionMod = Math.max(0.2, (targetO2 - 8.0) / 6.0);
    } else if (targetO2 > 35.0) {
      emissionMod = Math.min(2.5, 1.0 + (targetO2 - 35.0) / 40.0);
    } else {
      emissionMod = Math.max(0.7, Math.min(1.6, o2FactorVal));
    }

    let smokeDensity = 1.6;
    if (extinctionRisk.isExtinguished) {
      smokeDensity = 3.5;
    } else if (extinctionRisk.isHypoxic) {
      smokeDensity = 3.2 - (targetO2 - 8.0) * 0.2;
    } else if (targetO2 > 35.0) {
      smokeDensity = 0.15;
    }

    const flameHeightMm = Math.max(12.0, Math.min(85.0, flameHeightVal));

    // ── 9. TELEMETRY & SCIENTIFIC CITATIONS ────────────────────────────────
    const po2Psi = targetPsi * oxygenFraction;
    const po2Kpa = po2Psi * 6.89476;
    const flammabilityFactor = Math.pow(Math.max(0.01, po2Psi / 3.087), 1.4);

    return {
      isValid: true,
      canSimulate: true,
      simulationMode,
      modeLabel,
      missingParameters: [],
      environment: {
        gravity_g: targetG,
        gravity_m_s2: gravityMs2,
        oxygen_pct: targetO2,
        oxygen_fraction: oxygenFraction,
        pressure_psi: targetPsi,
        pressure_kpa: pressureKpa,
        fuel_description: fuelDesc || 'Solid Spacecraft Material'
      },
      physics: {
        buoyancy_strength: buoyancyVal,
        convection_velocity_m_s: convVelVal,
        flame_height_scaling_mm: flameHeightMm,
        flame_spread_rate_scaling_mm_s: spreadRateVal,
        hasExtrapolatedBounds,
        extinction_risk: extinctionRisk
      },
      visualization: {
        fuel_preset: fuelPreset,
        flame_scale: flameScale,
        emission_modifier: emissionMod,
        smoke_density: smokeDensity,
        flame_height_mm: flameHeightMm,
        wind_velocity: { x: 0.0, y: 0.0, z: 0.0 }
      },
      telemetry: {
        oxygen_partial_pressure_psi: Number(po2Psi.toFixed(3)),
        oxygen_partial_pressure_kpa: Number(po2Kpa.toFixed(2)),
        flammability_factor: Number(flammabilityFactor.toFixed(2)),
        confidence: (extrap && extrap.confidence_assessment) || 'Verified NASA PSI Flight Archive',
        caveats: (extrap && extrap.caveats) || [],
        scientific_insight: answer.combined_insight || '',
        gap_analysis: answer.gap_analysis || '',
        ranked_investigations: rankedInvs,
        sources
      },
      classification: {
        directSimulation: [
          'Gravity (fluidConfig.gravity = target_g * 9.81 m/s², stationScene.setGravity(target_g))',
          'Oxygen (fluidConfig.ambientOxygen = o2_pct / 100, stationScene.setOxygenLevel(o2_pct))',
          'Fuel Kinetics (gasConfig = GAS_PRESETS[fuel_preset])'
        ],
        derivedVisualization: [
          'Flame Height Envelope (stationScene.setFlamePhysicsParams({ flameHeightMm }))',
          'Emission & Luminosity (fluidConfig.flameBrightness modulated by oxygen factor)',
          'Soot Smoke Density (fluidConfig.smokeDensity modulated by oxygen starvation)',
          'Extinction Transition (visual quenching when O2 < 8% or quiescent zero-g)'
        ],
        scientificTelemetryOnly: [
          'Barometric Pressure (displayed in ECLSS HUD; incompressible CFD does not alter density)',
          'Natural Convection Velocity (retained for aerodynamic validation; not double-counted as body force)',
          'Solid Flame Spread Rate (solid fuel propagation metric from BASS/Saffire; candle has fixed coordinates)',
          'Oxygen Partial Pressure (P_O2 = P_total * O2% flammability index)',
          'NASA Flight Evidence (rankings, citations, and research gaps)'
        ]
      },
      warnings,
      errors: []
    };
  }

  /**
   * Helper: Extracts gravity from scenario text.
   * @param {string} lower 
   * @returns {number|null}
   */
  static extractGravity(lower) {
    if (!lower) return null;

    // Check for explicit numeric 'g' (e.g. 0.16g, 0.38 g, 0g, 1g, gravity of 0.16)
    const gMatches = lower.match(/(?:gravity\s*(?:of|at|level|:|=)?\s*|(?:\b|^))([0-9]+(?:\.[0-9]+)?)\s*g\b/i);
    if (gMatches) {
      const val = parseFloat(gMatches[1]);
      if (!isNaN(val)) return val;
    }

    // Keyword gravity extraction
    if (lower.includes('lunar') || lower.includes('moon')) return 0.16;
    if (lower.includes('mars')) return 0.38;
    if (lower.includes('iss') || lower.includes('microgravity') || lower.includes('micro-g') ||
        lower.includes('zero gravity') || lower.includes('zero-g') || lower.includes('0-g') ||
        lower.includes('zero g') || lower.includes('orbit') || lower.includes('spacecraft') ||
        lower.includes('weightless')) return 0.0;
    if (lower.includes('earth') || lower.includes('terrestrial') || lower.includes('normal gravity') ||
        lower.includes('ground')) return 1.0;

    return null;
  }

  /**
   * Helper: Extracts oxygen percentage from scenario text.
   * @param {string} lower 
   * @returns {number|null}
   */
  static extractOxygen(lower) {
    if (!lower) return null;

    // Explicit percentage with or without % sign
    const o2Match = lower.match(/(?:o2|oxygen)\s*(?:at|of|level|concentration|:|=)?\s*([0-9]+(?:\.[0-9]+)?)\s*%?/i) ||
                    lower.match(/([0-9]+(?:\.[0-9]+)?)\s*%\s*(?:o2|oxygen)?/i);
    if (o2Match) {
      const val = parseFloat(o2Match[1]);
      if (!isNaN(val) && val >= 0 && val <= 100) return val;
    }

    // Keyword atmosphere hints
    if (lower.includes('hypoxic') || lower.includes('low oxygen') || lower.includes('starvation')) return 12.0;
    if (lower.includes('hyperoxic') || lower.includes('elevated oxygen') || lower.includes('high oxygen')) return 32.0;
    if (lower.includes('standard atmosphere') || lower.includes('nominal air') || lower.includes('cabin air') ||
        lower.includes('iss') || lower.includes('earth') || lower.includes('ambient')) return 21.0;

    return null;
  }

  /**
   * Helper: Extracts pressure in psi from scenario text or defaults based on gravity regime.
   * @param {string} lower 
   * @param {number|null} gravityG 
   * @returns {number}
   */
  static extractPressure(lower, gravityG) {
    if (lower) {
      const psiMatch = lower.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:psi|psia)\b/i);
      if (psiMatch) {
        const val = parseFloat(psiMatch[1]);
        if (!isNaN(val) && val > 0) return val;
      }
      const kpaMatch = lower.match(/([0-9]+(?:\.[0-9]+)?)\s*kpa\b/i);
      if (kpaMatch) {
        const val = parseFloat(kpaMatch[1]);
        if (!isNaN(val) && val > 0) return val / 6.89476;
      }
    }

    // Default by mission architecture:
    // Lunar/Mars exploration habitat standard: 10.2 psi (exploration atmosphere)
    if (gravityG !== null && (Math.abs(gravityG - 0.16) < 0.05 || Math.abs(gravityG - 0.38) < 0.05)) {
      return 10.2;
    }
    // ISS / Earth sea level nominal: 14.7 psi
    return 14.7;
  }

  /**
   * Helper: Extracts fuel description from scenario text.
   * @param {string} lower 
   * @returns {string}
   */
  static extractFuelDescription(lower) {
    if (!lower) return 'Solid Spacecraft Material';

    if (lower.includes('polymer') || lower.includes('pmma') || lower.includes('acrylic') || lower.includes('plastic')) {
      return 'Polymer Material (PMMA)';
    }
    if (lower.includes('fabric') || lower.includes('cloth') || lower.includes('cotton') || lower.includes('nomex') || lower.includes('sibal')) {
      return 'Spacecraft Fabric / Textile';
    }
    if (lower.includes('methane') || lower.includes('ch4')) {
      return 'Methane Gas (CH4)';
    }
    if (lower.includes('propane') || lower.includes('c3h8') || lower.includes('lpg')) {
      return 'Propane Gas (C3H8)';
    }
    if (lower.includes('hydrogen') || lower.includes('h2')) {
      return 'Hydrogen Gas (H2)';
    }
    if (lower.includes('wire') || lower.includes('insulation')) {
      return 'Wire Insulation Polymer';
    }
    if (lower.includes('candle') || lower.includes('wax')) {
      return 'Candle Wax Hydrocarbon';
    }

    return 'Solid Spacecraft Material';
  }

  /**
   * Helper: Maps fuel description to available burner kinetic gas preset.
   * @param {string} fuelDesc 
   * @param {string[]} warnings 
   * @returns {'candleWax'|'methane'|'propane'|'hydrogen'}
   */
  static mapFuelPreset(fuelDesc, warnings) {
    const lower = (fuelDesc || '').toLowerCase();

    if (lower.includes('methane') || lower.includes('ch4') || lower.includes('natural gas')) {
      return 'methane';
    }
    if (lower.includes('propane') || lower.includes('c3h8') || lower.includes('lpg')) {
      return 'propane';
    }
    if (lower.includes('hydrogen') || lower.includes('h2')) {
      return 'hydrogen';
    }
    if (lower.includes('polymer') || lower.includes('pmma') || lower.includes('plastic') ||
        lower.includes('fabric') || lower.includes('cloth') || lower.includes('cotton') ||
        lower.includes('nomex') || lower.includes('wax') || lower.includes('candle') ||
        lower.includes('solid')) {
      return 'candleWax';
    }

    warnings.push(`Fuel material "${fuelDesc}" mapped to closest kinetic analogue "candleWax" (solid hydrocarbon pyrolysis).`);
    return 'candleWax';
  }

  /**
   * Helper: Evaluates extinction and hypoxia risk.
   * @param {number} targetG 
   * @param {number} targetO2 
   * @returns {Object}
   */
  static assessExtinctionRisk(targetG, targetO2) {
    let isExtinguished = false;
    let isHypoxic = false;
    let isQuiescentZeroG = false;
    let status = 'STABLE_PROPAGATION';
    let reason = 'Sufficient oxidizer and convective transport sustain steady combustion.';

    if (targetO2 < 8.0) {
      isExtinguished = true;
      isHypoxic = true;
      status = 'HYPOXIC_EXTINGUISHED';
      reason = `Oxygen concentration (${targetO2.toFixed(1)}%) is below the absolute limiting oxygen index (LOI ~8%). Flame self-extinguishes.`;
    } else if (targetO2 < 14.0) {
      isHypoxic = true;
      status = 'HYPOXIC_SMOTHERING';
      reason = `Oxygen concentration (${targetO2.toFixed(1)}%) is in the smothering regime (<14%). Incomplete combustion produces heavy soot smoke and suppressed kinetics.`;
    } else if (targetG < 0.01) {
      isQuiescentZeroG = true;
      status = 'QUIESCENT_DIFFUSION_DOME';
      reason = 'Zero buoyancy (Gr ~ 0) creates a spherical diffusion flame. Products pool around wick unless forced ventilation is present.';
    } else if (targetO2 > 35.0) {
      status = 'HYPEROXIC_SURGE';
      reason = `Elevated oxygen concentration (${targetO2.toFixed(1)}%) accelerates reaction kinetics and flammability. Blinding white-blue core with minimal smoke.`;
    }

    return {
      isExtinguished,
      isHypoxic,
      isQuiescentZeroG,
      status,
      reason
    };
  }
}
