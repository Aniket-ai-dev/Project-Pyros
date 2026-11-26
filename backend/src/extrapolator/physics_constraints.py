"""Hard physics constraints for combustion behavior extrapolation.

Encodes known physical scaling laws that govern how combustion phenomena
change with gravity, oxygen concentration, and pressure.  These are
deterministic relationships derived from established combustion science —
NOT LLM-generated predictions — and serve as hard bounds that the LLM
extrapolator must respect.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Any


@dataclass
class PartialGravityBounds:
    """Physics-derived bounds on a combustion parameter at partial gravity.

    Attributes:
        gravity_g: Target gravity level relative to Earth (e.g. 0.16 for Moon).
        parameter_name: Human-readable name of the bounded parameter.
        lower_bound: Lowest physically plausible value.
        upper_bound: Highest physically plausible value.
        confidence: Confidence in the bounds (0–1).
        physical_basis: Explanation of the underlying physics.
        caveats: Known limitations or conditions where bounds may not hold.
    """

    gravity_g: float
    parameter_name: str
    lower_bound: float
    upper_bound: float
    confidence: float
    physical_basis: str
    caveats: list[str] = field(default_factory=list)


class CombustionPhysics:
    """Static methods encoding combustion scaling laws for gravity extrapolation.

    Every method here is pure physics — no LLM calls.  The relationships are
    derived from textbook combustion science and peer-reviewed microgravity
    combustion research (Law, Ronney, Dietrich, etc.).
    """

    # ------------------------------------------------------------------ #
    #  Buoyancy
    # ------------------------------------------------------------------ #

    @staticmethod
    def buoyancy_strength(gravity_g: float) -> float:
        """Relative buoyancy strength at the given gravity level.

        The Grashof number — which drives natural-convection intensity —
        scales linearly with gravitational acceleration.

        Args:
            gravity_g: Gravity as a fraction of Earth-g (e.g. 1.0 = Earth,
                       0.16 = Moon, 0.38 = Mars, 0.0 = microgravity).

        Returns:
            Relative buoyancy strength (1.0 at Earth-g, 0.0 at true 0-g).
        """
        return max(0.0, float(gravity_g))

    # ------------------------------------------------------------------ #
    #  Flame height
    # ------------------------------------------------------------------ #

    @staticmethod
    def flame_height_scaling(
        gravity_g: float,
        earth_flame_height_mm: float,
    ) -> tuple[float, float]:
        """Estimate laminar diffusion-flame height at partial gravity.

        In the buoyancy-dominated regime, Roper (1977) and classical laminar
        diffusion flame theory establish that flame height scales weakly with
        buoyancy as L_f ~ g^(-0.25) to g^(-0.33).
        
        As gravity approaches microgravity (g -> 0), buoyant acceleration drops
        to zero and the flame transitions from buoyancy-dominated to
        momentum-dominated and diffusion-controlled (spherical/hemispherical).
        In this regime, flame length is governed by the fuel jet momentum and
        mass diffusivity, asymptotically leveling off at ~2.5x to 3.0x the
        1g height while expanding radially. It does NOT diverge to infinity.

        Args:
            gravity_g: Target gravity level (fraction of Earth-g).
            earth_flame_height_mm: Measured flame height at 1 g in mm.

        Returns:
            Tuple of (estimated_height_mm, confidence) where confidence ∈ [0, 1].
        """
        if gravity_g <= 0.0:
            # In true microgravity, spherical/diffusion regime dominates.
            # Axial elongation is bounded by momentum diffusion (~2.5x 1g).
            return (earth_flame_height_mm * 2.5, 0.4)

        g_clamped = max(0.01, float(gravity_g))
        # Roper buoyancy scaling L_f ~ g^(-0.25), bounded between 1.0x and 3.0x
        scale_factor = min(3.0, max(1.0, g_clamped ** -0.25))
        estimated = earth_flame_height_mm * scale_factor

        # Confidence is high near 1g and moderate in bounded partial-g
        if gravity_g >= 0.5:
            confidence = 0.85
        elif gravity_g >= 0.1:
            confidence = 0.70
        else:
            confidence = 0.45

        return (estimated, confidence)

    # ------------------------------------------------------------------ #
    #  Flammability limits
    # ------------------------------------------------------------------ #

    @staticmethod
    def flammability_limit_bounds(
        o2_pct: float,
        pressure_psi: float,
        gravity_g: float,
        micro_g_limit: float,
        earth_g_limit: float,
    ) -> tuple[float, float]:
        """Bound flammability limits at partial gravity by interpolation.

        Key physical insight (Ronney, 1998): as gravity decreases from 1 g to
        micro-g the lean flammability limit generally *decreases* (materials
        become flammable at lower concentrations) and the rich limit generally
        *increases*, because buoyancy-induced quenching is reduced.  The
        relationship is roughly monotonic but **not linear** — heat-loss
        mechanisms change qualitatively below ~0.1 g.

        This method returns conservative (wide) bounds by using a
        power-law interpolation envelope.

        Args:
            o2_pct: Oxygen percentage in the atmosphere.
            pressure_psi: Total pressure in psi.
            gravity_g: Target gravity level (fraction of Earth-g).
            micro_g_limit: Measured flammability limit at 0 g.
            earth_g_limit: Measured flammability limit at 1 g.

        Returns:
            (lower_bound, upper_bound) for the flammability limit at the
            target gravity.
        """
        if gravity_g <= 0.0:
            return (micro_g_limit, micro_g_limit)
        if gravity_g >= 1.0:
            return (earth_g_limit, earth_g_limit)

        # Linear interpolation gives one estimate
        linear_interp = micro_g_limit + gravity_g * (earth_g_limit - micro_g_limit)

        # Power-law interpolation (g^0.5) gives another — captures non-linearity
        power_interp = micro_g_limit + (gravity_g ** 0.5) * (earth_g_limit - micro_g_limit)

        # Use the two interpolations to define the envelope
        lower = min(linear_interp, power_interp)
        upper = max(linear_interp, power_interp)

        # Widen the envelope by 10 % for safety
        margin = 0.10 * abs(upper - lower) if upper != lower else 0.05 * abs(lower)
        lower -= margin
        upper += margin

        return (lower, upper)

    # ------------------------------------------------------------------ #
    #  Natural convection velocity
    # ------------------------------------------------------------------ #

    @staticmethod
    def natural_convection_velocity(
        gravity_g: float,
        delta_T_K: float = 500.0,
        length_scale_m: float = 0.05,
    ) -> float:
        """Estimate natural-convection velocity scale at partial gravity.

        Uses the classic scaling  V ~ sqrt(g · β · ΔT · L)  where β ≈ 1/T
        for an ideal gas at ~800 K ambient flame zone.

        In microgravity this velocity → 0, meaning forced flow (or diffusion)
        dominates the transport.

        Args:
            gravity_g: Gravity fraction of Earth-g.
            delta_T_K: Temperature difference driving convection (K).
            length_scale_m: Characteristic length scale (m).

        Returns:
            Estimated natural-convection velocity in m/s.
        """
        g = gravity_g * 9.81  # m/s²
        beta = 1.0 / 800.0  # volumetric expansion coeff for ideal gas at ~800 K
        v_squared = g * beta * delta_T_K * length_scale_m
        return math.sqrt(max(0.0, v_squared))

    # ------------------------------------------------------------------ #
    #  Flame spread rate
    # ------------------------------------------------------------------ #

    @staticmethod
    def spread_rate_bounds(
        gravity_g: float,
        micro_g_rate: float,
        earth_g_rate: float,
        orientation: str = "horizontal",
    ) -> tuple[float, float]:
        """Bound flame spread rate at partial gravity.

        Physical basis:
        - **Upward spread** is buoyancy-aided: spread rate *increases* with g
          because the buoyant flow preheats the fuel ahead of the flame.
        - **Downward spread** is buoyancy-opposed: spread rate is weakly
          dependent on g and may actually be *higher* in micro-g than at 1 g
          because radiative preheating dominates without convective cooling.
        - **Horizontal spread** behaviour lies between these extremes.

        Args:
            gravity_g: Target gravity fraction.
            micro_g_rate: Measured spread rate at 0 g (mm/s).
            earth_g_rate: Measured spread rate at 1 g (mm/s).
            orientation: 'upward', 'downward', or 'horizontal'.

        Returns:
            (lower_bound_mm_s, upper_bound_mm_s)
        """
        if gravity_g <= 0.0:
            return (micro_g_rate, micro_g_rate)
        if gravity_g >= 1.0:
            return (earth_g_rate, earth_g_rate)

        low_endpoint = min(micro_g_rate, earth_g_rate)
        high_endpoint = max(micro_g_rate, earth_g_rate)

        orientation_lower = orientation.lower().strip()

        if orientation_lower == "upward":
            # Buoyancy-aided: rate increases roughly monotonically with g.
            # Use power-law envelope.
            linear_est = micro_g_rate + gravity_g * (earth_g_rate - micro_g_rate)
            power_est = micro_g_rate + (gravity_g ** 0.5) * (earth_g_rate - micro_g_rate)
            lower = min(linear_est, power_est) * 0.85
            upper = max(linear_est, power_est) * 1.15
        elif orientation_lower == "downward":
            # Buoyancy-opposed: non-monotonic — rate may peak at intermediate g.
            # Conservative: full range from low to high endpoint.
            lower = low_endpoint * 0.7
            upper = high_endpoint * 1.3
        else:
            # Horizontal or unspecified: intermediate behaviour.
            linear_est = micro_g_rate + gravity_g * (earth_g_rate - micro_g_rate)
            power_est = micro_g_rate + (gravity_g ** 0.5) * (earth_g_rate - micro_g_rate)
            lower = min(linear_est, power_est) * 0.80
            upper = max(linear_est, power_est) * 1.20

        return (max(0.0, lower), upper)

    # ------------------------------------------------------------------ #
    #  Oxygen enhancement & Partial Pressure
    # ------------------------------------------------------------------ #

    @staticmethod
    def oxygen_partial_pressure_psi(pressure_psi: float, o2_pct: float) -> float:
        """Compute the oxygen partial pressure (P_O2) in psi.

        P_O2 = P_total * (O2% / 100).
        Standard Earth sea-level: 14.7 psi * 0.21 = 3.087 psi (normoxic).
        """
        return max(0.0, float(pressure_psi)) * (max(0.0, float(o2_pct)) / 100.0)

    @staticmethod
    def oxygen_enhancement_factor(
        o2_pct: float,
        pressure_psi: float = 14.7,
        baseline_o2: float = 21.0,
        baseline_pressure_psi: float = 14.7,
    ) -> float:
        """How much more flammable materials are under elevated partial pressure of O2.

        In aerospace combustion and NASA-STD-6001 materials testing, flammability,
        ignition delay, and flame spread are governed by the oxygen partial
        pressure (P_O2 = P_total * O2%), which dictates the molar concentration
        of oxidizer at the reaction zone.

        Baseline reference: Sea-level standard air (21% O2 at 14.7 psi -> P_O2 = 3.087 psi).
        - Sea-level Earth: 21% at 14.7 psi -> P_O2 = 3.09 psi -> 1.00x (Normoxic)
        - Lunar Base: 30% at 10.2 psi -> P_O2 = 3.06 psi -> ~0.99x (Normoxic baseline)
        - Lunar Base (Elevated): 34% at 10.2 psi -> P_O2 = 3.47 psi -> 1.18x
        - Spacesuit EVA: 100% at 4.3 psi -> P_O2 = 4.30 psi -> 1.59x (Hyperoxic risk)
        - CFI-G extreme: 85% at 14.7 psi -> P_O2 = 12.50 psi -> 7.08x

        Power-law scaling: Enhancement = (P_O2 / P_O2_baseline)^1.4

        Args:
            o2_pct: Actual oxygen percentage (e.g. 21.0, 30.0, 100.0).
            pressure_psi: Total atmospheric pressure in psi (default: 14.7 psi).
            baseline_o2: Reference oxygen percentage (default: 21.0%).
            baseline_pressure_psi: Reference pressure (default: 14.7 psi).

        Returns:
            Multiplicative enhancement factor relative to standard sea-level air.
        """
        p_o2_baseline = baseline_pressure_psi * (baseline_o2 / 100.0)
        if p_o2_baseline <= 0.0:
            return 1.0

        p_o2_actual = CombustionPhysics.oxygen_partial_pressure_psi(pressure_psi, o2_pct)
        exponent = 1.4
        return (p_o2_actual / p_o2_baseline) ** exponent

    @staticmethod
    def quiescent_extinction_check(gravity_g: float, flow_velocity_cm_s: float = 0.0) -> dict[str, Any]:
        """Assess the quiescent extinction boundary in microgravity.

        In microgravity (g ~ 0), buoyant upward flow ceases completely (V_buoyant -> 0).
        Without forced ventilation (> 0.5 - 2.0 cm/s), laminar diffusion flames
        accumulate combustion products (CO2, H2O) and soot in a spherical cloud,
        starving the reaction zone of oxygen and radiatively cooling until
        self-extinction occurs (as observed in ACME BRE and BASS quiescent tests).

        Returns:
            Dict containing extinction status, risk level, and engineering guidance.
        """
        is_quiescent = (gravity_g < 0.01) and (flow_velocity_cm_s < 0.5)
        return {
            "quiescent_regime": is_quiescent,
            "buoyancy_absent": gravity_g < 0.01,
            "extinction_risk": "HIGH_SELF_EXTINGUISHING" if is_quiescent else "STABLE_PROPAGATION",
            "guidance": (
                "Flames in zero-gravity will self-extinguish due to oxygen starvation "
                "unless forced ventilation (> 0.5 cm/s) supplies fresh oxidizer."
                if is_quiescent
                else "Convective or forced flow sustains oxidizer transport to the flame zone."
            ),
        }
