"""Pydantic data models for NASA PSI combustion science investigations.

Defines structured representations for fuel specifications, atmosphere
conditions, sensor configurations, gravity environments, and complete
investigation records used throughout the application.
"""

from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class FuelType(str, Enum):
    """Classification of fuel phase used in combustion experiments."""

    SOLID = "solid"
    LIQUID = "liquid"
    GAS = "gas"


class GravityCondition(str, Enum):
    """Gravity environment for an investigation."""

    MICROGRAVITY = "MICROGRAVITY"
    EARTH = "EARTH"
    PARTIAL_LUNAR = "PARTIAL_LUNAR"
    PARTIAL_MARS = "PARTIAL_MARS"
    SIMULATED_PARTIAL = "SIMULATED_PARTIAL"


class FireSafetyPillar(str, Enum):
    """Fire safety research pillar classification."""

    PREVENTION = "PREVENTION"
    DETECTION = "DETECTION"
    SUPPRESSION = "SUPPRESSION"


class FuelSpec(BaseModel):
    """Specification of a fuel used in a combustion investigation."""

    fuel_type: FuelType = Field(description="Phase of the fuel: solid, liquid, or gas.")
    material_name: str = Field(description="Name of the fuel material, e.g. 'methane', 'heptane', 'SIBAL cloth'.")
    shape: Optional[str] = Field(default=None, description="Physical shape of the fuel sample, e.g. 'droplet', 'flat sheet', 'spherical burner'.")
    dimensions_mm: Optional[str] = Field(default=None, description="Dimensions of the fuel sample in mm, e.g. '2.0 diameter', '50x100'.")


class AtmosphereCondition(BaseModel):
    """Atmosphere conditions for a combustion test point."""

    oxygen_pct: float = Field(ge=0.0, le=100.0, description="Oxygen concentration as a percentage.")
    pressure_psi: float = Field(gt=0.0, description="Total chamber pressure in psi.")
    diluent: str = Field(description="Diluent gas, e.g. 'N2', 'CO2', 'He', 'N2/CO2 mix'.")
    flow_velocity_cm_s: Optional[float] = Field(default=None, description="Co-flow or forced flow velocity in cm/s, None for quiescent.")


class SensorConfig(BaseModel):
    """Configuration of a measurement sensor or diagnostic."""

    sensor_type: str = Field(description="Type of sensor hardware, e.g. 'CCD camera', 'thermocouple', 'radiometer'.")
    measurement_type: str = Field(description="What is being measured, e.g. 'flame spread rate', 'temperature', 'soot volume fraction'.")
    units: str = Field(description="Units of measurement, e.g. 'mm/s', 'K', 'ppm'.")


class Investigation(BaseModel):
    """Complete record of a NASA PSI combustion science investigation.

    Each investigation captures experimental objectives, hardware, fuel and
    atmosphere parameters, key findings, and relationships to fire-safety
    goals and other investigations.
    """

    id: str = Field(description="Short unique identifier, e.g. 'bre', 'flex-2'.")
    name: str = Field(description="Full descriptive name of the investigation.")
    acronym: str = Field(description="Short acronym, e.g. 'BRE', 'FLEX-2'.")
    project: Optional[str] = Field(default=None, description="Parent project if any, e.g. 'ACME'.")
    hardware_facility: str = Field(description="Primary hardware/facility, e.g. 'CIR', 'MSG', 'Cygnus'.")
    objectives: str = Field(description="Scientific objectives of the investigation.")
    approach: str = Field(description="Experimental approach and methodology.")
    fuels: list[FuelSpec] = Field(default_factory=list, description="Fuel specifications tested.")
    atmosphere: list[AtmosphereCondition] = Field(default_factory=list, description="Atmosphere conditions tested.")
    sensors: list[SensorConfig] = Field(default_factory=list, description="Sensors and diagnostics used.")
    gravity: GravityCondition = Field(description="Gravity environment.")
    fire_safety_pillar: FireSafetyPillar = Field(description="Primary fire safety pillar.")
    relevance_to_crew_habitat: float = Field(
        ge=0.0,
        le=1.0,
        description="Relevance score (0.0–1.0) for crew habitat fire safety.",
    )
    key_findings: list[str] = Field(default_factory=list, description="Major scientific findings.")
    related_investigations: list[str] = Field(default_factory=list, description="IDs of related investigations.")
    psi_url: str = Field(default="", description="URL to the PSI investigation page.")
    earth_applications: list[str] = Field(default_factory=list, description="Terrestrial applications of findings.")

    @field_validator("relevance_to_crew_habitat")
    @classmethod
    def _clamp_relevance(cls, v: float) -> float:
        """Ensure relevance stays in [0, 1]."""
        return max(0.0, min(1.0, v))
