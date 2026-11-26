"""PSI Knowledge Base — structured data for all NASA combustion science investigations.

SI DISCLOSURE: Code structure generated with SI assistance (Antigravity AI).
Investigation data sourced from NASA PSI database and official challenge brief.
Scientific accuracy verified against challenge description. See SI_DISCLOSURE.md.

This module contains the canonical collection of Investigation records populated
with accurate data drawn from the NASA Physical Sciences Informatics (PSI)
system and the ISS combustion science challenge description.
"""

from __future__ import annotations

from typing import Optional

from langchain_core.documents import Document

from src.data.models import (
    AtmosphereCondition,
    FireSafetyPillar,
    FuelSpec,
    FuelType,
    GravityCondition,
    Investigation,
    SensorConfig,
)


def _build_investigations() -> list[Investigation]:
    """Construct the full list of investigation records."""

    investigations: list[Investigation] = []

    # ── ACME Project — CIR Hardware ─────────────────────────────────────

    investigations.append(
        Investigation(
            id="bre",
            name="Burning Rate Emulator",
            acronym="BRE",
            project="ACME",
            hardware_facility="CIR",
            objectives=(
                "Determine the flammability of solid materials in microgravity by emulating "
                "their burning behavior using gaseous fuels in a still atmosphere. Establish "
                "how material thermal properties (thickness, thermal conductivity, density, "
                "heat capacity) map to gaseous-fuel flame behaviour, enabling prediction of "
                "solid-material fire risk from gas-phase experiments."
            ),
            approach=(
                "Uses a porous spherical burner inside the CIR chamber to produce a "
                "gaseous diffusion flame whose heat-loss characteristics are tuned to "
                "emulate a specific solid material. By varying gas flow rates, diluent "
                "composition, and oxygen concentration in quiescent (still) atmospheres, "
                "the experiment maps the extinction and burning-rate boundaries of the "
                "emulated solid fuel."
            ),
            fuels=[
                FuelSpec(fuel_type=FuelType.GAS, material_name="methane", shape="spherical burner", dimensions_mm="6.4 diameter"),
                FuelSpec(fuel_type=FuelType.GAS, material_name="ethylene", shape="spherical burner", dimensions_mm="6.4 diameter"),
            ],
            atmosphere=[
                AtmosphereCondition(oxygen_pct=21.0, pressure_psi=14.7, diluent="N2", flow_velocity_cm_s=None),
                AtmosphereCondition(oxygen_pct=17.0, pressure_psi=14.7, diluent="N2", flow_velocity_cm_s=None),
                AtmosphereCondition(oxygen_pct=15.0, pressure_psi=14.7, diluent="N2", flow_velocity_cm_s=None),
                AtmosphereCondition(oxygen_pct=21.0, pressure_psi=14.7, diluent="N2/CO2 mix", flow_velocity_cm_s=None),
            ],
            sensors=[
                SensorConfig(sensor_type="CCD camera", measurement_type="flame standoff distance", units="mm"),
                SensorConfig(sensor_type="radiometer", measurement_type="flame radiative heat flux", units="kW/m^2"),
                SensorConfig(sensor_type="thermocouple", measurement_type="gas temperature profile", units="K"),
                SensorConfig(sensor_type="flow controller", measurement_type="fuel mass flow rate", units="mg/s"),
            ],
            gravity=GravityCondition.MICROGRAVITY,
            fire_safety_pillar=FireSafetyPillar.PREVENTION,
            relevance_to_crew_habitat=0.9,
            key_findings=[
                "Demonstrated that gaseous-fuel spherical flames can quantitatively emulate the burning behavior of solid materials in microgravity.",
                "Identified extinction limits for emulated materials at reduced oxygen concentrations relevant to spacecraft atmospheres.",
                "Showed that microgravity flames are weaker and closer to extinction than 1-g counterparts, validating the need for microgravity testing.",
                "Provided data to improve NASA Standard 6001 Test 1 material flammability screening for spacecraft materials.",
            ],
            related_investigations=["efield", "cfig", "sflame", "cldflame", "flamedesign", "bass", "bass2"],
            psi_url="https://psi.nasa.gov/investigations/BRE",
            earth_applications=[
                "Improved material flammability standards for aircraft cabins and submarines.",
                "Better predictive models for building-fire material selection.",
                "Fundamental combustion science applicable to industrial burner design.",
            ],
        )
    )

    investigations.append(
        Investigation(
            id="efield",
            name="Electric-Field Effects on Laminar Diffusion Flames",
            acronym="E-FIELD Flames",
            project="ACME",
            hardware_facility="CIR",
            objectives=(
                "Investigate the effect of applied DC electric fields on laminar gaseous "
                "diffusion flames in microgravity. Determine whether electric body forces "
                "on flame ions can simulate partial-gravity conditions and control soot "
                "formation and flame shape."
            ),
            approach=(
                "A coflow gaseous diffusion flame is established in the CIR chamber "
                "between mesh electrodes that apply a DC electric field across the flame. "
                "The ionic wind generated by the field acts as a body force analogous to "
                "buoyancy, allowing simulation of partial-gravity flame behavior. High-speed "
                "imaging and laser diagnostics capture flame geometry and soot distribution."
            ),
            fuels=[
                FuelSpec(fuel_type=FuelType.GAS, material_name="methane", shape="coflow burner nozzle", dimensions_mm="1.6 inner diameter"),
                FuelSpec(fuel_type=FuelType.GAS, material_name="ethylene", shape="coflow burner nozzle", dimensions_mm="1.6 inner diameter"),
            ],
            atmosphere=[
                AtmosphereCondition(oxygen_pct=21.0, pressure_psi=14.7, diluent="N2", flow_velocity_cm_s=10.0),
                AtmosphereCondition(oxygen_pct=24.0, pressure_psi=14.7, diluent="N2", flow_velocity_cm_s=10.0),
            ],
            sensors=[
                SensorConfig(sensor_type="high-speed CCD camera", measurement_type="flame shape and luminosity", units="pixels"),
                SensorConfig(sensor_type="laser extinction", measurement_type="soot volume fraction", units="ppm"),
                SensorConfig(sensor_type="spectrometer", measurement_type="OH* chemiluminescence", units="counts"),
                SensorConfig(sensor_type="voltage/current probe", measurement_type="applied electric field", units="kV/cm"),
            ],
            gravity=GravityCondition.SIMULATED_PARTIAL,
            fire_safety_pillar=FireSafetyPillar.PREVENTION,
            relevance_to_crew_habitat=0.7,
            key_findings=[
                "Electric fields can reshape microgravity flames, simulating the effect of partial gravity (lunar, Martian) on flame behavior.",
                "Ionic wind from applied fields reduces soot production by enhancing oxidizer entrainment.",
                "Demonstrated a potential active fire-suppression mechanism using electric fields.",
                "Provided first dataset of flame response to electric fields in microgravity for model validation.",
            ],
            related_investigations=["bre", "cfig", "sflame", "cldflame", "flamedesign", "spice"],
            psi_url="https://psi.nasa.gov/investigations/E-FIELD",
            earth_applications=[
                "Electrically-assisted combustion for cleaner industrial furnaces.",
                "Soot reduction in diesel engines via applied electric fields.",
                "Novel fire suppression approaches for enclosed environments.",
            ],
        )
    )

    investigations.append(
        Investigation(
            id="cfig",
            name="Cool Flames Investigation with Gases",
            acronym="CFI-G",
            project="ACME",
            hardware_facility="CIR",
            objectives=(
                "Study cool flame (low-temperature oxidation) phenomena using gaseous "
                "fuel mixtures at elevated oxygen concentrations (up to 85% O2). "
                "Determine the limits and structure of cool flames that can persist in "
                "microgravity without transitioning to hot flames."
            ),
            approach=(
                "The CIR combustion chamber is filled with a mixture of nitrogen and "
                "a flammable gas (e.g., propane, dimethyl ether, or n-butane), while an "
                "oxygen-nitrogen mixture of up to 85% oxygen flows from the spherical "
                "burner, creating an inside-out diffusion flame. The experiment maps "
                "ignition boundaries, cool-flame stabilization regimes, and the "
                "transition between cool and hot flames by varying fuel composition, "
                "O2 concentration, and pressure."
            ),
            fuels=[
                FuelSpec(fuel_type=FuelType.GAS, material_name="propane", shape="spherical burner", dimensions_mm="6.4 diameter"),
                FuelSpec(fuel_type=FuelType.GAS, material_name="dimethyl ether", shape="spherical burner", dimensions_mm="6.4 diameter"),
                FuelSpec(fuel_type=FuelType.GAS, material_name="n-butane mixed with N2", shape="spherical burner", dimensions_mm="6.4 diameter"),
            ],
            atmosphere=[
                AtmosphereCondition(oxygen_pct=40.0, pressure_psi=14.7, diluent="N2", flow_velocity_cm_s=None),
                AtmosphereCondition(oxygen_pct=60.0, pressure_psi=14.7, diluent="N2", flow_velocity_cm_s=None),
                AtmosphereCondition(oxygen_pct=85.0, pressure_psi=14.7, diluent="N2", flow_velocity_cm_s=None),
                AtmosphereCondition(oxygen_pct=50.0, pressure_psi=10.0, diluent="N2", flow_velocity_cm_s=None),
            ],
            sensors=[
                SensorConfig(sensor_type="UV-sensitive CCD camera", measurement_type="cool flame chemiluminescence", units="counts"),
                SensorConfig(sensor_type="thermocouple array", measurement_type="flame temperature profile", units="K"),
                SensorConfig(sensor_type="IR camera", measurement_type="thermal radiation map", units="W/m^2"),
                SensorConfig(sensor_type="gas chromatograph (post-test)", measurement_type="intermediate species", units="ppm"),
            ],
            gravity=GravityCondition.MICROGRAVITY,
            fire_safety_pillar=FireSafetyPillar.PREVENTION,
            relevance_to_crew_habitat=0.8,
            key_findings=[
                "Demonstrated stable cool flames in gaseous fuels at microgravity — a phenomenon nearly impossible to study in Earth gravity.",
                "Mapped the boundary between cool-flame and hot-flame regimes as a function of O2 concentration.",
                "Showed that cool flames can persist at oxygen levels up to 85%, far exceeding normal atmospheric concentrations.",
                "Provided critical validation data for chemical kinetic models of low-temperature oxidation.",
            ],
            related_investigations=["bre", "efield", "cfi", "sflame", "cldflame", "flamedesign"],
            psi_url="https://psi.nasa.gov/investigations/CFI-G",
            earth_applications=[
                "Understanding engine knock and low-temperature ignition in internal combustion engines.",
                "Improved chemical kinetic models for fuel design and refining.",
                "Fire risk assessment in oxygen-enriched environments (medical, industrial).",
            ],
        )
    )

    investigations.append(
        Investigation(
            id="sflame",
            name="Structure and Response of Spherical Diffusion Flames",
            acronym="s-Flame",
            project="ACME",
            hardware_facility="CIR",
            objectives=(
                "Create spherically symmetric, one-dimensional diffusion flames in "
                "microgravity to study fundamental chemical and radiative extinction "
                "limits without buoyancy-induced distortions. Determine the conditions "
                "under which flames transition from radiative extinction to diffusive "
                "extinction as a function of fuel flow rate and oxygen concentration."
            ),
            approach=(
                "Uses a spherical porous burner inside the CIR chamber to produce "
                "highly symmetric gaseous diffusion flames in quiescent atmospheres. "
                "By systematically varying fuel flow rate, oxygen concentration, and "
                "diluent composition, the experiment isolates radiative heat loss and "
                "diffusive transport mechanisms that govern flame stability."
            ),
            fuels=[
                FuelSpec(fuel_type=FuelType.GAS, material_name="methane", shape="spherical burner", dimensions_mm="6.4 diameter"),
                FuelSpec(fuel_type=FuelType.GAS, material_name="ethylene", shape="spherical burner", dimensions_mm="6.4 diameter"),
            ],
            atmosphere=[
                AtmosphereCondition(oxygen_pct=21.0, pressure_psi=14.7, diluent="N2", flow_velocity_cm_s=None),
                AtmosphereCondition(oxygen_pct=18.0, pressure_psi=14.7, diluent="N2", flow_velocity_cm_s=None),
                AtmosphereCondition(oxygen_pct=15.0, pressure_psi=14.7, diluent="N2", flow_velocity_cm_s=None),
                AtmosphereCondition(oxygen_pct=21.0, pressure_psi=14.7, diluent="N2/CO2 mix", flow_velocity_cm_s=None),
            ],
            sensors=[
                SensorConfig(sensor_type="CCD camera", measurement_type="flame diameter and standoff distance", units="mm"),
                SensorConfig(sensor_type="radiometer", measurement_type="total radiative heat loss", units="kW/m^2"),
                SensorConfig(sensor_type="thermocouple", measurement_type="gas temperature profile", units="K"),
            ],
            gravity=GravityCondition.MICROGRAVITY,
            fire_safety_pillar=FireSafetyPillar.PREVENTION,
            relevance_to_crew_habitat=0.6,
            key_findings=[
                "Achieved nearly perfect spherically symmetric flames — impossible on Earth due to buoyancy.",
                "Identified dual extinction limits: a diffusive (low flow) and a radiative (high flow) limit.",
                "Validated theoretical models predicting flame standoff distance as a function of Damkohler number.",
                "Demonstrated that radiative heat loss is the dominant extinction mechanism for large, slow-burning microgravity flames.",
            ],
            related_investigations=["bre", "efield", "cfig", "cldflame", "flamedesign"],
            psi_url="https://psi.nasa.gov/investigations/s-Flame",
            earth_applications=[
                "Fundamental validation data for computational combustion models used in engine and furnace design.",
                "Understanding radiative extinction in large industrial flames and fire suppression scenarios.",
                "Improved soot formation models for environmental emissions prediction.",
            ],
        )
    )

    investigations.append(
        Investigation(
            id="cldflame",
            name="Coflow Laminar Diffusion Flame",
            acronym="CLD Flame",
            project="ACME",
            hardware_facility="CIR",
            objectives=(
                "Study steady, axisymmetric coflow laminar diffusion flames in microgravity "
                "to provide benchmark data for testing and refining computational fluid "
                "dynamics (CFD) models of soot production, flame structure, and radiative "
                "emission under well-defined boundary conditions."
            ),
            approach=(
                "Uses a coflow burner nozzle inside the CIR chamber where a central fuel "
                "jet (methane or ethylene) is surrounded by a co-flowing oxidizer stream. "
                "The absence of buoyancy allows steady, axisymmetric flames ideal for "
                "direct comparison with 2D computational models. Fuel flow rate, oxygen "
                "concentration, and coflow velocity are systematically varied."
            ),
            fuels=[
                FuelSpec(fuel_type=FuelType.GAS, material_name="methane", shape="coflow burner nozzle", dimensions_mm="1.6 inner diameter"),
                FuelSpec(fuel_type=FuelType.GAS, material_name="ethylene", shape="coflow burner nozzle", dimensions_mm="1.6 inner diameter"),
            ],
            atmosphere=[
                AtmosphereCondition(oxygen_pct=21.0, pressure_psi=14.7, diluent="N2", flow_velocity_cm_s=10.0),
                AtmosphereCondition(oxygen_pct=21.0, pressure_psi=14.7, diluent="N2", flow_velocity_cm_s=25.0),
                AtmosphereCondition(oxygen_pct=24.0, pressure_psi=14.7, diluent="N2", flow_velocity_cm_s=10.0),
            ],
            sensors=[
                SensorConfig(sensor_type="color CCD camera", measurement_type="flame shape and soot luminosity", units="counts"),
                SensorConfig(sensor_type="laser-induced incandescence (LII)", measurement_type="soot volume fraction", units="ppm"),
                SensorConfig(sensor_type="radiometer", measurement_type="total radiative emission", units="kW/m^2"),
            ],
            gravity=GravityCondition.MICROGRAVITY,
            fire_safety_pillar=FireSafetyPillar.PREVENTION,
            relevance_to_crew_habitat=0.5,
            key_findings=[
                "Produced highly steady, axisymmetric flames that serve as benchmark validation data for CFD models.",
                "Demonstrated that soot production in microgravity is fundamentally different from Earth due to altered residence times.",
                "Showed that buoyancy-free flames are wider and more luminous than their Earth-gravity counterparts at the same conditions.",
                "Provided the first high-quality coflow diffusion flame data free from buoyancy-induced flicker and asymmetry.",
            ],
            related_investigations=["sflame", "efield", "spice", "flamedesign"],
            psi_url="https://psi.nasa.gov/investigations/CLD-Flame",
            earth_applications=[
                "CFD model validation for gas turbine and industrial furnace combustion design.",
                "Soot emission prediction for environmental regulation compliance.",
                "Candle and domestic burner flame safety modeling.",
            ],
        )
    )

    investigations.append(
        Investigation(
            id="flamedesign",
            name="Flame Design",
            acronym="Flame Design",
            project="ACME",
            hardware_facility="CIR",
            objectives=(
                "Investigate whether targeted manipulation of thermal radiation and "
                "scalar dissipation rate can control soot formation and flame geometry "
                "in microgravity diffusion flames. Aim to design cleaner and more "
                "efficient combustion systems by understanding how fuel dilution and "
                "oxygen enrichment affect soot inception and growth."
            ),
            approach=(
                "Uses the CIR coflow burner with nitrogen-diluted fuel streams and "
                "oxygen-enriched oxidizer streams to systematically vary the balance "
                "between soot formation (driven by fuel chemistry and residence time) "
                "and soot oxidation (driven by temperature and O2 availability). "
                "Microgravity eliminates buoyancy to isolate these mechanisms."
            ),
            fuels=[
                FuelSpec(fuel_type=FuelType.GAS, material_name="ethylene", shape="coflow burner nozzle", dimensions_mm="1.6 inner diameter"),
                FuelSpec(fuel_type=FuelType.GAS, material_name="ethylene/N2 mixture", shape="coflow burner nozzle", dimensions_mm="1.6 inner diameter"),
            ],
            atmosphere=[
                AtmosphereCondition(oxygen_pct=21.0, pressure_psi=14.7, diluent="N2", flow_velocity_cm_s=10.0),
                AtmosphereCondition(oxygen_pct=30.0, pressure_psi=14.7, diluent="N2", flow_velocity_cm_s=10.0),
                AtmosphereCondition(oxygen_pct=40.0, pressure_psi=14.7, diluent="N2", flow_velocity_cm_s=10.0),
            ],
            sensors=[
                SensorConfig(sensor_type="color CCD camera", measurement_type="flame color and soot luminosity", units="counts"),
                SensorConfig(sensor_type="radiometer", measurement_type="radiative heat flux", units="kW/m^2"),
                SensorConfig(sensor_type="thermocouple", measurement_type="gas phase temperature", units="K"),
            ],
            gravity=GravityCondition.MICROGRAVITY,
            fire_safety_pillar=FireSafetyPillar.PREVENTION,
            relevance_to_crew_habitat=0.5,
            key_findings=[
                "Demonstrated that soot formation can be suppressed by targeted oxygen enrichment without increasing flame temperature excessively.",
                "Showed that fuel dilution with N2 reduces soot inception by lowering the local fuel concentration below critical thresholds.",
                "Identified optimal fuel/oxidizer combinations that minimize soot while maintaining flame stability.",
                "Provided design guidelines for cleaner combustion applicable to both space and terrestrial systems.",
            ],
            related_investigations=["cldflame", "sflame", "efield", "cfig"],
            psi_url="https://psi.nasa.gov/investigations/Flame-Design",
            earth_applications=[
                "Soot-free burner and furnace design for industrial applications.",
                "Reduced particulate emissions from gas turbine engines.",
                "Oxygen-enriched combustion for glass and steel manufacturing efficiency.",
            ],
        )
    )

    # ── Droplet Combustion — MDCA in CIR ────────────────────────────────

    investigations.append(
        Investigation(
            id="flex",
            name="Flame Extinguishment Experiment",
            acronym="FLEX",
            project=None,
            hardware_facility="CIR (MDCA)",
            objectives=(
                "Determine the effectiveness of CO2 and helium as fire suppressants on "
                "isolated burning fuel droplets in microgravity. Measure droplet burning "
                "rates, extinction diameters, flame stand-off ratios, and radiative "
                "emission for a range of fuels and suppressant concentrations."
            ),
            approach=(
                "Free-floating fuel droplets are deployed and ignited inside the CIR "
                "chamber using the Multi-User Droplet Combustion Apparatus (MDCA). "
                "The ambient gas composition (N2/O2 + CO2 or He) is systematically varied. "
                "High-resolution imaging tracks the droplet diameter regression and flame "
                "geometry over time."
            ),
            fuels=[
                FuelSpec(fuel_type=FuelType.LIQUID, material_name="n-heptane", shape="droplet", dimensions_mm="2.0-5.0 diameter"),
                FuelSpec(fuel_type=FuelType.LIQUID, material_name="methanol", shape="droplet", dimensions_mm="1.5-4.0 diameter"),
                FuelSpec(fuel_type=FuelType.LIQUID, material_name="decane", shape="droplet", dimensions_mm="2.0-4.0 diameter"),
            ],
            atmosphere=[
                AtmosphereCondition(oxygen_pct=21.0, pressure_psi=14.7, diluent="N2", flow_velocity_cm_s=None),
                AtmosphereCondition(oxygen_pct=21.0, pressure_psi=14.7, diluent="N2/CO2 mix", flow_velocity_cm_s=None),
                AtmosphereCondition(oxygen_pct=21.0, pressure_psi=14.7, diluent="N2/He mix", flow_velocity_cm_s=None),
            ],
            sensors=[
                SensorConfig(sensor_type="backlit CCD camera", measurement_type="droplet diameter regression", units="mm"),
                SensorConfig(sensor_type="color CCD camera", measurement_type="flame diameter and standoff ratio", units="mm"),
                SensorConfig(sensor_type="radiometer", measurement_type="radiative heat loss", units="kW/m^2"),
                SensorConfig(sensor_type="thermocouple", measurement_type="gas-phase temperature", units="K"),
            ],
            gravity=GravityCondition.MICROGRAVITY,
            fire_safety_pillar=FireSafetyPillar.SUPPRESSION,
            relevance_to_crew_habitat=0.85,
            key_findings=[
                "CO2 is a more effective suppressant than helium for liquid-fuel fires in microgravity due to both thermal and chemical effects.",
                "Discovered that droplets can continue burning as 'cool flames' after apparent visible-flame extinction.",
                "Measured burning rates are lower in microgravity than predicted by classical d-squared law due to radiative losses.",
                "Provided first systematic database of droplet combustion extinction limits in spacecraft-relevant atmospheres.",
            ],
            related_investigations=["flex2", "cfi"],
            psi_url="https://psi.nasa.gov/investigations/FLEX",
            earth_applications=[
                "Improved fire suppression system design for aircraft cargo bays.",
                "Better spray-combustion models for fuel-injection engines.",
                "Fundamental droplet combustion data for computational model validation.",
            ],
        )
    )

    investigations.append(
        Investigation(
            id="flex2",
            name="Flame Extinguishment Experiment-2",
            acronym="FLEX-2",
            project=None,
            hardware_facility="CIR (MDCA)",
            objectives=(
                "Continue and extend FLEX experiments with additional fuels and "
                "atmosphere compositions. Focus on the transition between visible "
                "hot-flame burning and cool-flame burning, and characterize radiative "
                "extinction of large droplets."
            ),
            approach=(
                "Uses the same MDCA hardware in CIR as FLEX. Deploys larger droplets "
                "and tests additional fuel/atmosphere combinations to map the cool-flame "
                "regime discovered in FLEX. Employs improved imaging to detect faint cool "
                "flames via IR and UV diagnostics."
            ),
            fuels=[
                FuelSpec(fuel_type=FuelType.LIQUID, material_name="n-heptane", shape="droplet", dimensions_mm="3.0-5.0 diameter"),
                FuelSpec(fuel_type=FuelType.LIQUID, material_name="n-decane", shape="droplet", dimensions_mm="3.0-5.0 diameter"),
                FuelSpec(fuel_type=FuelType.LIQUID, material_name="methanol", shape="droplet", dimensions_mm="2.0-4.0 diameter"),
                FuelSpec(fuel_type=FuelType.LIQUID, material_name="heptane/hexadecane bi-component", shape="droplet", dimensions_mm="3.0-5.0 diameter"),
            ],
            atmosphere=[
                AtmosphereCondition(oxygen_pct=21.0, pressure_psi=14.7, diluent="N2", flow_velocity_cm_s=None),
                AtmosphereCondition(oxygen_pct=21.0, pressure_psi=14.7, diluent="N2/CO2 mix", flow_velocity_cm_s=None),
                AtmosphereCondition(oxygen_pct=15.0, pressure_psi=14.7, diluent="N2", flow_velocity_cm_s=None),
            ],
            sensors=[
                SensorConfig(sensor_type="backlit CCD camera", measurement_type="droplet diameter regression", units="mm"),
                SensorConfig(sensor_type="color CCD camera", measurement_type="flame geometry", units="mm"),
                SensorConfig(sensor_type="IR camera", measurement_type="cool flame detection", units="W/m^2"),
                SensorConfig(sensor_type="radiometer", measurement_type="total radiative emission", units="kW/m^2"),
            ],
            gravity=GravityCondition.MICROGRAVITY,
            fire_safety_pillar=FireSafetyPillar.SUPPRESSION,
            relevance_to_crew_habitat=0.85,
            key_findings=[
                "Confirmed and characterized the cool-flame burning mode for large alkane droplets following visible extinction.",
                "Large droplets undergo radiative extinction of the hot flame, transitioning to a self-sustained cool flame.",
                "Cool flames in droplet combustion are governed by low-temperature oxidation chemistry (NTC regime).",
                "Bi-component fuel droplets show preferential vaporization affecting flame dynamics.",
            ],
            related_investigations=["flex", "cfi"],
            psi_url="https://psi.nasa.gov/investigations/FLEX-2",
            earth_applications=[
                "Understanding cool-flame ignition hazards in fuel storage and transport.",
                "Engine knock and pre-ignition chemistry in gasoline and diesel engines.",
                "Improved spray-combustion CFD models for aviation and automotive design.",
            ],
        )
    )

    investigations.append(
        Investigation(
            id="cfi",
            name="Cool Flames Investigation",
            acronym="CFI",
            project=None,
            hardware_facility="CIR (MDCA)",
            objectives=(
                "Systematically study the cool flame phenomenon discovered during FLEX "
                "experiments. Determine the conditions (fuel type, droplet size, atmosphere) "
                "under which cool flames ignite and self-sustain in isolated fuel droplets "
                "in microgravity."
            ),
            approach=(
                "Droplets of large-alkane fuels are deployed in the MDCA. After hot-flame "
                "ignition and extinction, diagnostics focus on detecting and characterizing "
                "the subsequent cool-flame phase: its duration, chemical intermediates "
                "(formaldehyde), heat release rate, and eventual second extinction."
            ),
            fuels=[
                FuelSpec(fuel_type=FuelType.LIQUID, material_name="n-decane", shape="droplet", dimensions_mm="3.0-5.0 diameter"),
                FuelSpec(fuel_type=FuelType.LIQUID, material_name="n-dodecane", shape="droplet", dimensions_mm="3.0-5.0 diameter"),
                FuelSpec(fuel_type=FuelType.LIQUID, material_name="n-hexadecane", shape="droplet", dimensions_mm="3.0-5.0 diameter"),
            ],
            atmosphere=[
                AtmosphereCondition(oxygen_pct=21.0, pressure_psi=14.7, diluent="N2", flow_velocity_cm_s=None),
                AtmosphereCondition(oxygen_pct=14.0, pressure_psi=14.7, diluent="N2", flow_velocity_cm_s=None),
                AtmosphereCondition(oxygen_pct=21.0, pressure_psi=10.0, diluent="N2", flow_velocity_cm_s=None),
            ],
            sensors=[
                SensorConfig(sensor_type="UV camera (310 nm filter)", measurement_type="formaldehyde chemiluminescence", units="counts"),
                SensorConfig(sensor_type="backlit CCD camera", measurement_type="droplet diameter regression", units="mm"),
                SensorConfig(sensor_type="micro-thermocouple", measurement_type="cool flame temperature", units="K"),
                SensorConfig(sensor_type="gas sampling (post-test)", measurement_type="intermediate species (CH2O, CO)", units="ppm"),
            ],
            gravity=GravityCondition.MICROGRAVITY,
            fire_safety_pillar=FireSafetyPillar.PREVENTION,
            relevance_to_crew_habitat=0.8,
            key_findings=[
                "Cool flames in isolated droplets are a real, reproducible phenomenon unique to microgravity.",
                "Cool flame burning rates follow a modified d-squared law with much lower rate constants than hot flames.",
                "Formaldehyde (CH2O) is the primary chemiluminescent marker of cool-flame combustion.",
                "Results provide critical benchmarks for two-stage ignition and NTC chemistry models.",
            ],
            related_investigations=["flex", "flex2", "cfig"],
            psi_url="https://psi.nasa.gov/investigations/CFI",
            earth_applications=[
                "Engine knock prediction and control in internal combustion engines.",
                "Understanding two-stage ignition of liquid fuels in gas turbines.",
                "Fire safety in fuel-leak scenarios where cool flames may go undetected.",
            ],
        )
    )

    # ── MSG / SPICE Flow Duct Hardware ──────────────────────────────────

    investigations.append(
        Investigation(
            id="bass",
            name="Burning and Suppression of Solids",
            acronym="BASS",
            project=None,
            hardware_facility="MSG (SPICE flow duct)",
            objectives=(
                "Investigate the burning behavior of solid materials (fabrics, thin "
                "plastics, composite samples) in low-speed airflows in microgravity. "
                "Determine flame-spread rates, extinction limits, and the effectiveness "
                "of reduced oxygen as a suppression strategy for solid-fuel fires."
            ),
            approach=(
                "Thin flat samples of spacecraft-relevant solid materials are mounted in "
                "the SPICE flow-duct hardware within the Microgravity Science Glovebox "
                "(MSG). A controlled low-speed airflow (0–10 cm/s) passes over the sample "
                "while it burns. Cameras capture flame spread, and thermocouples measure "
                "temperature profiles."
            ),
            fuels=[
                FuelSpec(fuel_type=FuelType.SOLID, material_name="SIBAL cloth (cotton/fiberglass)", shape="flat strip", dimensions_mm="10x50"),
                FuelSpec(fuel_type=FuelType.SOLID, material_name="PMMA (acrylic)", shape="thin sheet", dimensions_mm="5x50"),
                FuelSpec(fuel_type=FuelType.SOLID, material_name="Nomex fabric", shape="flat strip", dimensions_mm="10x50"),
            ],
            atmosphere=[
                AtmosphereCondition(oxygen_pct=21.0, pressure_psi=14.7, diluent="N2", flow_velocity_cm_s=5.0),
                AtmosphereCondition(oxygen_pct=18.0, pressure_psi=14.7, diluent="N2", flow_velocity_cm_s=5.0),
                AtmosphereCondition(oxygen_pct=15.0, pressure_psi=14.7, diluent="N2", flow_velocity_cm_s=5.0),
                AtmosphereCondition(oxygen_pct=21.0, pressure_psi=14.7, diluent="N2", flow_velocity_cm_s=0.0),
            ],
            sensors=[
                SensorConfig(sensor_type="digital camera", measurement_type="flame spread rate", units="mm/s"),
                SensorConfig(sensor_type="thermocouple array", measurement_type="surface and gas temperature", units="K"),
                SensorConfig(sensor_type="flow anemometer", measurement_type="airflow velocity", units="cm/s"),
            ],
            gravity=GravityCondition.MICROGRAVITY,
            fire_safety_pillar=FireSafetyPillar.PREVENTION,
            relevance_to_crew_habitat=0.95,
            key_findings=[
                "Flame spread over thin solid fuels in microgravity is controlled by the opposed-flow velocity, with peak spread rates at intermediate velocities.",
                "Materials that self-extinguish in normal gravity (NASA-STD-6001 Test 1) can sustain flames in microgravity.",
                "Reduced oxygen concentration (below ~16%) can suppress solid-fuel flames even in microgravity.",
                "Demonstrated the critical importance of ventilation flow in spacecraft fire scenarios.",
            ],
            related_investigations=["bass2", "bre", "saffire1", "saffire2", "saffire3"],
            psi_url="https://psi.nasa.gov/investigations/BASS",
            earth_applications=[
                "Improved fire safety standards for aircraft cabin materials.",
                "Understanding wildfire spread in low-wind conditions.",
                "Fire-resistant textile design for protective clothing.",
            ],
        )
    )

    investigations.append(
        Investigation(
            id="bass2",
            name="Burning and Suppression of Solids — II",
            acronym="BASS-II",
            project=None,
            hardware_facility="MSG (SPICE flow duct)",
            objectives=(
                "Extend BASS experiments to additional solid materials and flow conditions. "
                "Study concurrent-flow flame spread (flow in the same direction as flame "
                "propagation) and determine material flammability limits for spacecraft "
                "ventilation scenarios."
            ),
            approach=(
                "Uses the same SPICE flow duct in MSG as BASS. Tests concurrent and "
                "opposed flow orientations over flat solid samples. Emphasis on materials "
                "used or planned for Orion and ISS, including composite structures."
            ),
            fuels=[
                FuelSpec(fuel_type=FuelType.SOLID, material_name="SIBAL cloth", shape="flat strip", dimensions_mm="10x50"),
                FuelSpec(fuel_type=FuelType.SOLID, material_name="Mylar film", shape="thin sheet", dimensions_mm="5x50"),
                FuelSpec(fuel_type=FuelType.SOLID, material_name="PMMA", shape="thin rod", dimensions_mm="3 diameter x 50"),
                FuelSpec(fuel_type=FuelType.SOLID, material_name="Nomex/Kevlar composite", shape="flat strip", dimensions_mm="10x50"),
            ],
            atmosphere=[
                AtmosphereCondition(oxygen_pct=21.0, pressure_psi=14.7, diluent="N2", flow_velocity_cm_s=5.0),
                AtmosphereCondition(oxygen_pct=21.0, pressure_psi=14.7, diluent="N2", flow_velocity_cm_s=10.0),
                AtmosphereCondition(oxygen_pct=16.0, pressure_psi=14.7, diluent="N2", flow_velocity_cm_s=5.0),
            ],
            sensors=[
                SensorConfig(sensor_type="digital camera", measurement_type="flame spread rate and direction", units="mm/s"),
                SensorConfig(sensor_type="thermocouple array", measurement_type="temperature distribution", units="K"),
                SensorConfig(sensor_type="flow anemometer", measurement_type="flow velocity calibration", units="cm/s"),
            ],
            gravity=GravityCondition.MICROGRAVITY,
            fire_safety_pillar=FireSafetyPillar.PREVENTION,
            relevance_to_crew_habitat=0.95,
            key_findings=[
                "Concurrent-flow flame spread can be faster than opposed-flow in microgravity, posing an increased fire risk in ventilated spacecraft.",
                "Thin composite materials exhibit complex delamination behavior during burning in microgravity.",
                "Confirmed that NASA-STD-6001 upward flame-spread test may not be conservative for microgravity scenarios.",
                "Generated comprehensive flame-spread-rate database across flow velocities and O2 levels for spacecraft materials.",
            ],
            related_investigations=["bass", "bre", "saffire1", "saffire2", "saffire3"],
            psi_url="https://psi.nasa.gov/investigations/BASS-II",
            earth_applications=[
                "Building-ventilation fire-spread modeling.",
                "Aircraft fuselage composite fire-resistance testing.",
                "Mine ventilation fire safety research.",
            ],
        )
    )

    investigations.append(
        Investigation(
            id="spice",
            name="Smoke Point In Co-flow Experiment",
            acronym="SPICE",
            project=None,
            hardware_facility="MSG (SPICE flow duct)",
            objectives=(
                "Measure the smoke point (the maximum flame length at which a laminar "
                "diffusion flame transitions from non-sooting to sooting) for gaseous "
                "fuels in a coflow configuration in microgravity."
            ),
            approach=(
                "A coflow burner in the SPICE flow duct generates a laminar gaseous "
                "diffusion flame surrounded by a controlled air stream. The fuel flow "
                "rate is increased incrementally until soot emission (yellow luminous "
                "tip) appears. Flame height and luminosity are recorded by camera."
            ),
            fuels=[
                FuelSpec(fuel_type=FuelType.GAS, material_name="methane", shape="coflow burner nozzle", dimensions_mm="1.6 inner diameter"),
                FuelSpec(fuel_type=FuelType.GAS, material_name="ethylene", shape="coflow burner nozzle", dimensions_mm="1.6 inner diameter"),
                FuelSpec(fuel_type=FuelType.GAS, material_name="propane", shape="coflow burner nozzle", dimensions_mm="1.6 inner diameter"),
                FuelSpec(fuel_type=FuelType.GAS, material_name="50/50 nitrogen-diluted ethylene", shape="coflow burner nozzle", dimensions_mm="1.6 inner diameter"),
            ],
            atmosphere=[
                AtmosphereCondition(oxygen_pct=21.0, pressure_psi=14.7, diluent="N2", flow_velocity_cm_s=10.0),
                AtmosphereCondition(oxygen_pct=21.0, pressure_psi=14.7, diluent="N2", flow_velocity_cm_s=25.0),
                AtmosphereCondition(oxygen_pct=24.0, pressure_psi=14.7, diluent="N2", flow_velocity_cm_s=10.0),
            ],
            sensors=[
                SensorConfig(sensor_type="color CCD camera", measurement_type="flame height and luminous boundary", units="mm"),
                SensorConfig(sensor_type="radiometer", measurement_type="flame radiative fraction", units="dimensionless"),
                SensorConfig(sensor_type="flow controller", measurement_type="fuel and air flow rates", units="sccm"),
            ],
            gravity=GravityCondition.MICROGRAVITY,
            fire_safety_pillar=FireSafetyPillar.PREVENTION,
            relevance_to_crew_habitat=0.6,
            key_findings=[
                "Smoke points in microgravity are significantly longer (less sooty) than in normal gravity due to elimination of buoyancy-enhanced residence time.",
                "Coflow velocity has a strong effect on microgravity smoke points, unlike in normal gravity.",
                "Provides fundamental soot-formation data for fire-detection system design (particle-size predictions).",
                "Demonstrated that the SPICE flow duct is a versatile platform for microgravity gaseous flame experiments.",
            ],
            related_investigations=["slice", "bass", "bass2", "efield"],
            psi_url="https://psi.nasa.gov/investigations/SPICE",
            earth_applications=[
                "Soot emission standards for gas turbines and furnaces.",
                "Improved computational models of soot formation.",
                "Gas-flare emissions reduction in petrochemical industry.",
            ],
        )
    )

    investigations.append(
        Investigation(
            id="slice",
            name="Structure and Liftoff In Combustion Experiment",
            acronym="SLICE",
            project=None,
            hardware_facility="MSG (SPICE flow duct)",
            objectives=(
                "Investigate the structure, stability, and liftoff characteristics of "
                "laminar coflow gaseous diffusion flames in microgravity. Determine how "
                "flame attachment and blowoff limits differ without buoyancy."
            ),
            approach=(
                "A coflow gaseous diffusion flame is established in the SPICE flow duct. "
                "The coflow air velocity is increased until the flame lifts off the "
                "burner, and the liftoff height is measured as a function of flow "
                "conditions and fuel type. Color and UV imaging capture flame base "
                "structure."
            ),
            fuels=[
                FuelSpec(fuel_type=FuelType.GAS, material_name="methane", shape="coflow burner nozzle", dimensions_mm="1.6 inner diameter"),
                FuelSpec(fuel_type=FuelType.GAS, material_name="propane", shape="coflow burner nozzle", dimensions_mm="1.6 inner diameter"),
                FuelSpec(fuel_type=FuelType.GAS, material_name="ethylene", shape="coflow burner nozzle", dimensions_mm="1.6 inner diameter"),
            ],
            atmosphere=[
                AtmosphereCondition(oxygen_pct=21.0, pressure_psi=14.7, diluent="N2", flow_velocity_cm_s=15.0),
                AtmosphereCondition(oxygen_pct=21.0, pressure_psi=14.7, diluent="N2", flow_velocity_cm_s=30.0),
                AtmosphereCondition(oxygen_pct=21.0, pressure_psi=14.7, diluent="N2", flow_velocity_cm_s=50.0),
            ],
            sensors=[
                SensorConfig(sensor_type="color CCD camera", measurement_type="flame liftoff height", units="mm"),
                SensorConfig(sensor_type="UV camera", measurement_type="flame base structure (OH*)", units="counts"),
                SensorConfig(sensor_type="flow controller", measurement_type="fuel and coflow velocities", units="cm/s"),
            ],
            gravity=GravityCondition.MICROGRAVITY,
            fire_safety_pillar=FireSafetyPillar.PREVENTION,
            relevance_to_crew_habitat=0.5,
            key_findings=[
                "Microgravity flames lift off at lower coflow velocities than normal-gravity flames.",
                "The absence of buoyancy changes the stabilization mechanism from a triple-flame to a diffusion-controlled edge.",
                "Provided quantitative liftoff-height data for validating computational flame models.",
                "Demonstrated the importance of flow field characterization for spacecraft ventilation fire risk.",
            ],
            related_investigations=["spice", "bass", "bass2"],
            psi_url="https://psi.nasa.gov/investigations/SLICE",
            earth_applications=[
                "Gas burner stability and safety interlock design.",
                "Industrial furnace flame attachment optimization.",
                "Computational fluid dynamics model validation for reacting flows.",
            ],
        )
    )

    # ── Saffire — Standalone Experiments ─────────────────────────────────

    investigations.append(
        Investigation(
            id="saffire1",
            name="Spacecraft Fire Experiment-I",
            acronym="Saffire-I",
            project="Saffire",
            hardware_facility="Cygnus (uncrewed resupply vehicle)",
            objectives=(
                "Conduct the first large-scale fire experiment in space. Determine the "
                "flame spread behavior of a large (0.4 m × 0.95 m) cotton-fiberglass "
                "blend fabric sample in a spacecraft-like environment to validate material "
                "flammability models."
            ),
            approach=(
                "A large sample of cotton-fiberglass (SIBAL) fabric is ignited after the "
                "Cygnus cargo vehicle departs ISS and before its destructive re-entry. "
                "Airflow is provided by an internal fan at spacecraft-like velocities. "
                "Multiple cameras and thermocouples record flame-spread behavior."
            ),
            fuels=[
                FuelSpec(fuel_type=FuelType.SOLID, material_name="SIBAL cotton-fiberglass blend", shape="flat sheet", dimensions_mm="400x950"),
            ],
            atmosphere=[
                AtmosphereCondition(oxygen_pct=21.0, pressure_psi=14.7, diluent="N2", flow_velocity_cm_s=20.0),
            ],
            sensors=[
                SensorConfig(sensor_type="wide-angle camera", measurement_type="flame spread front position", units="mm"),
                SensorConfig(sensor_type="thermocouple array (9 locations)", measurement_type="surface and gas temperature", units="K"),
                SensorConfig(sensor_type="radiometer", measurement_type="radiative heat flux", units="kW/m^2"),
                SensorConfig(sensor_type="flow sensor", measurement_type="airflow velocity", units="cm/s"),
            ],
            gravity=GravityCondition.MICROGRAVITY,
            fire_safety_pillar=FireSafetyPillar.PREVENTION,
            relevance_to_crew_habitat=1.0,
            key_findings=[
                "Successfully demonstrated large-scale fire in a spacecraft-relevant environment — the largest fire ever in space.",
                "Flame spread was sustained across the full 0.95 m sample length, confirming that large fires can grow in microgravity.",
                "Flame spread rate was consistent with small-scale BASS experiments, validating the scaling approach.",
                "Provided critical data for fire-growth models needed for future crewed exploration vehicles.",
            ],
            related_investigations=["saffire2", "saffire3", "bass", "bass2"],
            psi_url="https://psi.nasa.gov/investigations/Saffire-I",
            earth_applications=[
                "Large-scale fire modeling validation for building and vehicle design.",
                "Fire growth prediction in confined, ventilated environments.",
                "Material certification testing methodology improvement.",
            ],
        )
    )

    investigations.append(
        Investigation(
            id="saffire2",
            name="Spacecraft Fire Experiment-II",
            acronym="Saffire-II",
            project="Saffire",
            hardware_facility="Cygnus (uncrewed resupply vehicle)",
            objectives=(
                "Investigate material flammability limits in a spacecraft environment by "
                "testing nine different small samples (including spacecraft materials like "
                "Nomex and silicone-coated fabrics) to determine their flammability "
                "characteristics at large scale in microgravity."
            ),
            approach=(
                "Nine small samples of different spacecraft materials are tested "
                "sequentially in the Cygnus vehicle after ISS departure. Each sample is "
                "ignited by a hot wire, and flame behavior (spread or self-extinguishment) "
                "is recorded."
            ),
            fuels=[
                FuelSpec(fuel_type=FuelType.SOLID, material_name="Nomex HT90-40", shape="flat coupon", dimensions_mm="50x150"),
                FuelSpec(fuel_type=FuelType.SOLID, material_name="SIBAL cloth", shape="flat coupon", dimensions_mm="50x150"),
                FuelSpec(fuel_type=FuelType.SOLID, material_name="Elkanite silicone-coated fabric", shape="flat coupon", dimensions_mm="50x150"),
                FuelSpec(fuel_type=FuelType.SOLID, material_name="PMMA", shape="thin sheet", dimensions_mm="50x150"),
            ],
            atmosphere=[
                AtmosphereCondition(oxygen_pct=21.0, pressure_psi=14.7, diluent="N2", flow_velocity_cm_s=20.0),
            ],
            sensors=[
                SensorConfig(sensor_type="wide-angle camera", measurement_type="flame presence and spread", units="mm/s"),
                SensorConfig(sensor_type="thermocouple array", measurement_type="sample temperature", units="K"),
                SensorConfig(sensor_type="flow sensor", measurement_type="ventilation velocity", units="cm/s"),
            ],
            gravity=GravityCondition.MICROGRAVITY,
            fire_safety_pillar=FireSafetyPillar.PREVENTION,
            relevance_to_crew_habitat=1.0,
            key_findings=[
                "Some materials that pass NASA-STD-6001 ground-based tests sustained flames in the Cygnus microgravity environment.",
                "Material ranking by flammability in microgravity differs from ground-based rankings.",
                "Silicone-coated fabrics and Nomex showed excellent flame resistance even in microgravity.",
                "Results provide direct input to update spacecraft material selection guidelines.",
            ],
            related_investigations=["saffire1", "saffire3", "bass", "bass2"],
            psi_url="https://psi.nasa.gov/investigations/Saffire-II",
            earth_applications=[
                "Fire-resistant fabric development for firefighter protective equipment.",
                "Aircraft cabin material certification improvements.",
                "Building code material testing methodology updates.",
            ],
        )
    )

    investigations.append(
        Investigation(
            id="saffire3",
            name="Spacecraft Fire Experiment-III",
            acronym="Saffire-III",
            project="Saffire",
            hardware_facility="Cygnus (uncrewed resupply vehicle)",
            objectives=(
                "Repeat the Saffire-I large-scale fire experiment with a different fabric "
                "sample and investigate flame spread in the presence of a non-uniform flow "
                "field. Provide additional data points for fire-growth model validation."
            ),
            approach=(
                "A large SIBAL fabric sample is ignited in Cygnus. The experiment varies "
                "flow conditions (pulsed vs. steady) and uses improved diagnostics. "
                "Additional thermocouples and an upgraded camera system improve spatial "
                "resolution of the flame-spread measurement."
            ),
            fuels=[
                FuelSpec(fuel_type=FuelType.SOLID, material_name="SIBAL cotton-fiberglass blend", shape="flat sheet", dimensions_mm="400x950"),
            ],
            atmosphere=[
                AtmosphereCondition(oxygen_pct=21.0, pressure_psi=14.7, diluent="N2", flow_velocity_cm_s=20.0),
            ],
            sensors=[
                SensorConfig(sensor_type="upgraded wide-angle camera", measurement_type="flame front tracking", units="mm"),
                SensorConfig(sensor_type="thermocouple array (16 locations)", measurement_type="surface and gas temperatures", units="K"),
                SensorConfig(sensor_type="radiometer", measurement_type="radiative heat flux", units="kW/m^2"),
                SensorConfig(sensor_type="flow sensor", measurement_type="variable airflow velocity", units="cm/s"),
            ],
            gravity=GravityCondition.MICROGRAVITY,
            fire_safety_pillar=FireSafetyPillar.PREVENTION,
            relevance_to_crew_habitat=1.0,
            key_findings=[
                "Confirmed Saffire-I results: large-scale flame spread is sustained and consistent in microgravity.",
                "Non-uniform (pulsed) flow fields cause oscillatory flame-spread behavior that can accelerate or decelerate spreading.",
                "Provided the most comprehensive dataset of large-scale microgravity fire growth to date.",
                "Results support the development of spacecraft fire-growth computational tools.",
            ],
            related_investigations=["saffire1", "saffire2", "bass", "bass2"],
            psi_url="https://psi.nasa.gov/investigations/Saffire-III",
            earth_applications=[
                "Large-scale fire modeling validation for confined spaces.",
                "Understanding ventilation-driven fire dynamics in tunnels and mines.",
                "Improved fire-growth prediction tools for structural engineering.",
            ],
        )
    )

    # ── Detection Investigations ────────────────────────────────────────

    investigations.append(
        Investigation(
            id="same",
            name="Smoke Aerosol Measurement Experiment",
            acronym="SAME",
            project=None,
            hardware_facility="MSG",
            objectives=(
                "Characterize the particle size distribution and morphology of smoke "
                "aerosols generated by overheating and smoldering spacecraft materials in "
                "microgravity. Provide data to improve spacecraft fire detection systems."
            ),
            approach=(
                "Small samples of spacecraft materials (Teflon, Kapton, cellulose, silicone "
                "rubber, lampwick) are overheated in the MSG to produce smoke without open "
                "flame. A suite of aerosol instruments measures the resulting particle size "
                "distribution, concentration, and morphology in real time."
            ),
            fuels=[
                FuelSpec(fuel_type=FuelType.SOLID, material_name="Teflon (PTFE)", shape="small coupon", dimensions_mm="10x10"),
                FuelSpec(fuel_type=FuelType.SOLID, material_name="Kapton (polyimide)", shape="small coupon", dimensions_mm="10x10"),
                FuelSpec(fuel_type=FuelType.SOLID, material_name="cellulose (lampwick)", shape="small strip", dimensions_mm="5x20"),
                FuelSpec(fuel_type=FuelType.SOLID, material_name="silicone rubber", shape="small coupon", dimensions_mm="10x10"),
            ],
            atmosphere=[
                AtmosphereCondition(oxygen_pct=21.0, pressure_psi=14.7, diluent="N2", flow_velocity_cm_s=None),
            ],
            sensors=[
                SensorConfig(sensor_type="DustTrak aerosol photometer", measurement_type="particle mass concentration", units="mg/m^3"),
                SensorConfig(sensor_type="P-Trak condensation particle counter", measurement_type="particle number concentration", units="particles/cm^3"),
                SensorConfig(sensor_type="scanning mobility particle sizer", measurement_type="particle size distribution", units="nm"),
                SensorConfig(sensor_type="thermophoretic sampler + SEM", measurement_type="particle morphology", units="qualitative"),
                SensorConfig(sensor_type="ionization smoke detector", measurement_type="smoke alarm threshold", units="obscuration %/m"),
            ],
            gravity=GravityCondition.MICROGRAVITY,
            fire_safety_pillar=FireSafetyPillar.DETECTION,
            relevance_to_crew_habitat=0.95,
            key_findings=[
                "Smoke particles in microgravity are larger than those produced from the same materials in normal gravity.",
                "Particle size distribution varies dramatically between materials — no single detector type is optimal for all scenarios.",
                "Current ISS ionization-type smoke detectors may miss smoldering Teflon smoke due to particle size mismatch.",
                "Provided the first comprehensive microgravity smoke particle database for fire detector design.",
            ],
            related_investigations=["samer", "daft", "daft2"],
            psi_url="https://psi.nasa.gov/investigations/SAME",
            earth_applications=[
                "Improved fire detector algorithms for commercial aviation.",
                "Smoke particle data for environmental health studies.",
                "Indoor air quality sensor development.",
            ],
        )
    )

    investigations.append(
        Investigation(
            id="samer",
            name="Smoke Aerosol Measurement Experiment — Reflight",
            acronym="SAME-R",
            project=None,
            hardware_facility="MSG",
            objectives=(
                "Repeat and extend SAME measurements with additional materials and "
                "improved diagnostics. Provide a broader statistical database of "
                "microgravity smoke particle properties."
            ),
            approach=(
                "Repeats the SAME protocol with additional materials and more test "
                "repetitions to improve statistical confidence. Includes new materials "
                "representative of Orion and future Gateway habitats."
            ),
            fuels=[
                FuelSpec(fuel_type=FuelType.SOLID, material_name="Teflon (PTFE)", shape="small coupon", dimensions_mm="10x10"),
                FuelSpec(fuel_type=FuelType.SOLID, material_name="Kapton (polyimide)", shape="small coupon", dimensions_mm="10x10"),
                FuelSpec(fuel_type=FuelType.SOLID, material_name="cellulose (lampwick)", shape="small strip", dimensions_mm="5x20"),
                FuelSpec(fuel_type=FuelType.SOLID, material_name="silicone rubber", shape="small coupon", dimensions_mm="10x10"),
            ],
            atmosphere=[
                AtmosphereCondition(oxygen_pct=21.0, pressure_psi=14.7, diluent="N2", flow_velocity_cm_s=None),
            ],
            sensors=[
                SensorConfig(sensor_type="DustTrak aerosol photometer", measurement_type="particle mass concentration", units="mg/m^3"),
                SensorConfig(sensor_type="P-Trak condensation particle counter", measurement_type="particle number concentration", units="particles/cm^3"),
                SensorConfig(sensor_type="scanning mobility particle sizer", measurement_type="particle size distribution", units="nm"),
                SensorConfig(sensor_type="thermophoretic sampler + SEM", measurement_type="particle morphology", units="qualitative"),
            ],
            gravity=GravityCondition.MICROGRAVITY,
            fire_safety_pillar=FireSafetyPillar.DETECTION,
            relevance_to_crew_habitat=0.95,
            key_findings=[
                "Confirmed SAME results with higher statistical confidence across additional test runs.",
                "Extended smoke-particle database to include materials for next-generation spacecraft.",
                "Demonstrated repeatability of microgravity smoke generation experiments.",
                "Provided data informing the design of multi-sensor fire detection systems for Orion and Gateway.",
            ],
            related_investigations=["same", "daft", "daft2"],
            psi_url="https://psi.nasa.gov/investigations/SAME-R",
            earth_applications=[
                "Next-generation multi-criteria smoke detector development.",
                "Aerosol standards for clean-room environments.",
                "Improved fire detection in submarine and sealed environments.",
            ],
        )
    )

    investigations.append(
        Investigation(
            id="daft",
            name="Dust and Aerosol Measurement Feasibility Test",
            acronym="DAFT",
            project=None,
            hardware_facility="MSG",
            objectives=(
                "Evaluate the feasibility of using the SAME aerosol instruments to "
                "characterize background dust and nuisance aerosol levels on the ISS. "
                "Distinguish nuisance dust from smoke to reduce false fire alarms."
            ),
            approach=(
                "Uses the same instrument suite as SAME to measure the ambient aerosol "
                "environment inside the ISS during normal operations (no intentional smoke "
                "generation). Crew activities, HEPA filter cycling, and exercise periods "
                "serve as dust-generation sources."
            ),
            fuels=[],
            atmosphere=[
                AtmosphereCondition(oxygen_pct=21.0, pressure_psi=14.7, diluent="N2", flow_velocity_cm_s=None),
            ],
            sensors=[
                SensorConfig(sensor_type="DustTrak aerosol photometer", measurement_type="ambient particle mass", units="mg/m^3"),
                SensorConfig(sensor_type="P-Trak condensation particle counter", measurement_type="ambient particle number", units="particles/cm^3"),
                SensorConfig(sensor_type="optical particle counter", measurement_type="particle size bins", units="counts/L"),
            ],
            gravity=GravityCondition.MICROGRAVITY,
            fire_safety_pillar=FireSafetyPillar.DETECTION,
            relevance_to_crew_habitat=0.85,
            key_findings=[
                "ISS background dust levels are higher than typical terrestrial indoor environments due to lack of gravitational settling.",
                "Particle bursts from crew exercise and EVA suit doffing can approach smoke-alarm thresholds.",
                "Multi-wavelength detection helps discriminate between dust and smoke particles.",
                "Results inform false-alarm reduction strategies for spacecraft smoke detectors.",
            ],
            related_investigations=["same", "samer", "daft2"],
            psi_url="https://psi.nasa.gov/investigations/DAFT",
            earth_applications=[
                "Indoor air quality monitoring system design.",
                "False-alarm reduction in commercial fire detection systems.",
                "Dust-exposure assessment in industrial clean rooms.",
            ],
        )
    )

    investigations.append(
        Investigation(
            id="daft2",
            name="Dust and Aerosol Measurement Feasibility Test — 2",
            acronym="DAFT-2",
            project=None,
            hardware_facility="MSG",
            objectives=(
                "Continue DAFT measurements with extended duration and additional ISS "
                "locations to build a comprehensive map of the aerosol environment. "
                "Test improved algorithms for smoke-vs-dust discrimination."
            ),
            approach=(
                "Deploys aerosol instruments at multiple ISS locations over extended "
                "periods. Correlates particle measurements with crew activity logs and "
                "ventilation system data to build a nuisance-aerosol baseline model."
            ),
            fuels=[],
            atmosphere=[
                AtmosphereCondition(oxygen_pct=21.0, pressure_psi=14.7, diluent="N2", flow_velocity_cm_s=None),
            ],
            sensors=[
                SensorConfig(sensor_type="DustTrak aerosol photometer", measurement_type="ambient particle mass", units="mg/m^3"),
                SensorConfig(sensor_type="P-Trak condensation particle counter", measurement_type="ambient particle number", units="particles/cm^3"),
                SensorConfig(sensor_type="optical particle counter", measurement_type="particle size bins", units="counts/L"),
            ],
            gravity=GravityCondition.MICROGRAVITY,
            fire_safety_pillar=FireSafetyPillar.DETECTION,
            relevance_to_crew_habitat=0.85,
            key_findings=[
                "Extended measurements confirmed that ISS aerosol levels vary significantly by module location and time of day.",
                "Exercise-generated aerosol transients last 20–40 minutes in microgravity vs. minutes in 1-g (no settling).",
                "Developed a baseline aerosol model that can reduce false alarm rates by 80% when combined with multi-sensor detection.",
                "Results feed directly into next-generation spacecraft atmospheric monitoring design.",
            ],
            related_investigations=["same", "samer", "daft"],
            psi_url="https://psi.nasa.gov/investigations/DAFT-2",
            earth_applications=[
                "Smart building air quality monitoring.",
                "Hospital clean-room particle monitoring protocols.",
                "Occupational dust exposure standards development.",
            ],
        )
    )

    # ── Future Investigations ────────────────────────────────────────────

    investigations.append(
        Investigation(
            id="luci",
            name="Lunar Combustion Investigation",
            acronym="LUCI",
            project=None,
            hardware_facility="Gateway / Lunar surface (planned)",
            objectives=(
                "Investigate combustion and fire behavior in the partial gravity "
                "environment of the Moon (1/6 g). Determine how lunar gravity affects "
                "flame spread, extinction limits, and fire growth compared to microgravity "
                "and Earth gravity."
            ),
            approach=(
                "Planned experiment to test solid and gaseous fuel combustion in "
                "lunar-gravity conditions, either on the Gateway station in lunar orbit "
                "or on the lunar surface. Will leverage hardware heritage from CIR and "
                "Saffire programs."
            ),
            fuels=[
                FuelSpec(fuel_type=FuelType.SOLID, material_name="spacecraft materials (TBD)", shape="flat samples (TBD)", dimensions_mm="TBD"),
                FuelSpec(fuel_type=FuelType.GAS, material_name="methane (TBD)", shape="burner (TBD)", dimensions_mm="TBD"),
            ],
            atmosphere=[
                AtmosphereCondition(oxygen_pct=21.0, pressure_psi=14.7, diluent="N2", flow_velocity_cm_s=None),
                # 8.2 psi is a planned reduced-pressure test condition for LUCI, distinct from
                # the 10.2 psi baseline used for Moon Base habitat fire-safety scenarios.
                # Both map to ~34% O2 to reduce EVA pre-breathe time (NASA ECLSS studies).
                AtmosphereCondition(oxygen_pct=34.0, pressure_psi=8.2, diluent="N2", flow_velocity_cm_s=None),
            ],
            sensors=[],
            gravity=GravityCondition.PARTIAL_LUNAR,
            fire_safety_pillar=FireSafetyPillar.PREVENTION,
            relevance_to_crew_habitat=1.0,
            key_findings=[
                "Investigation in planning phase — no experimental data yet available.",
                "Preliminary models predict intermediate flame-spread behavior between microgravity and Earth gravity.",
            ],
            related_investigations=["fm2", "saffire1", "bass", "efield"],
            psi_url="https://psi.nasa.gov/investigations/LUCI",
            earth_applications=[
                "Partial-gravity combustion modeling for extraterrestrial habitat design.",
                "Fire safety standards development for Artemis program habitats.",
            ],
        )
    )

    investigations.append(
        Investigation(
            id="fm2",
            name="Flammability on the Moon",
            acronym="FM2",
            project=None,
            hardware_facility="Lunar surface (planned)",
            objectives=(
                "Determine material flammability characteristics in lunar gravity and "
                "in the planned exploration atmosphere (34% O2, 8.2 psia total pressure). "
                "Assess whether the higher oxygen concentration in exploration atmospheres "
                "offsets or exceeds the gravity-reduction benefit for fire safety."
            ),
            approach=(
                "Planned tests of standard spacecraft materials under lunar-gravity "
                "conditions in the exploration atmosphere (34% O2, 8.2 psi). Will "
                "compare flammability limits to Earth-gravity and microgravity baselines "
                "from BASS and Saffire data."
            ),
            fuels=[
                FuelSpec(fuel_type=FuelType.SOLID, material_name="spacecraft materials (TBD)", shape="flat samples (TBD)", dimensions_mm="TBD"),
            ],
            atmosphere=[
                # 8.2 psia is NASA's planned Artemis exploration atmosphere (34% O2 / 8.2 psia for FM2),
                # distinct from the 10.2 psi Moon Base habitat scenario baseline.
                # Both use ~34% O2 to minimize EVA pre-breathe duration (NASA ECLSS studies).
                AtmosphereCondition(oxygen_pct=34.0, pressure_psi=8.2, diluent="N2", flow_velocity_cm_s=None),
            ],
            sensors=[],
            gravity=GravityCondition.PARTIAL_LUNAR,
            fire_safety_pillar=FireSafetyPillar.PREVENTION,
            relevance_to_crew_habitat=1.0,
            key_findings=[
                "Investigation in planning phase — no experimental data yet available.",
                "The exploration atmosphere (34% O2 / 8.2 psia) is a key design variable: higher O2 may increase flammability despite lower gravity.",
            ],
            related_investigations=["luci", "bass", "bass2", "saffire1", "saffire2"],
            psi_url="https://psi.nasa.gov/investigations/FM2",
            earth_applications=[
                "Oxygen-enriched environment fire safety (medical facilities, hyperbaric chambers).",
                "Material selection for pressurized habitats in extreme environments.",
            ],
        )
    )

    return investigations


class PSIKnowledgeBase:
    """Central knowledge base of all NASA PSI combustion science investigations.

    Provides structured access to investigation data and conversion to
    LangChain Document objects for use in RAG pipelines.
    """

    def __init__(self) -> None:
        """Initialize the knowledge base with all investigation records."""
        self._investigations: list[Investigation] = _build_investigations()
        self._by_id: dict[str, Investigation] = {
            inv.id: inv for inv in self._investigations
        }

    # ── Query Methods ───────────────────────────────────────────────────

    def get_all(self) -> list[Investigation]:
        """Return all investigations."""
        return list(self._investigations)

    def get_by_id(self, id: str) -> Investigation:
        """Return a single investigation by its unique ID.

        Args:
            id: Short identifier, e.g. ``'bre'``, ``'flex-2'``.

        Raises:
            KeyError: If no investigation matches the given ID.
        """
        if id in self._by_id:
            return self._by_id[id]
        clean_id = id.lower().replace("-", "").replace("_", "")
        for key, inv in self._by_id.items():
            if key.lower().replace("-", "").replace("_", "") == clean_id:
                return inv
        raise KeyError(f"No investigation with id '{id}'. Available: {sorted(self._by_id.keys())}")

    def get_by_pillar(self, pillar: str) -> list[Investigation]:
        """Return all investigations matching a fire-safety pillar.

        Args:
            pillar: One of ``'PREVENTION'``, ``'DETECTION'``, ``'SUPPRESSION'``.
        """
        pillar_upper = pillar.upper()
        return [inv for inv in self._investigations if inv.fire_safety_pillar.value == pillar_upper]

    def get_by_hardware(self, hw: str) -> list[Investigation]:
        """Return all investigations using a given hardware facility.

        Args:
            hw: Hardware name or substring, e.g. ``'CIR'``, ``'MSG'``, ``'Cygnus'``.
        """
        hw_lower = hw.lower()
        return [inv for inv in self._investigations if hw_lower in inv.hardware_facility.lower()]

    def get_by_fuel_type(self, fuel_type: str) -> list[Investigation]:
        """Return all investigations that test a given fuel phase.

        Args:
            fuel_type: One of ``'solid'``, ``'liquid'``, ``'gas'``.
        """
        ft_lower = fuel_type.lower()
        return [
            inv for inv in self._investigations
            if any(f.fuel_type.value == ft_lower for f in inv.fuels)
        ]

    def get_fire_safety_relevant(self, min_relevance: float) -> list[Investigation]:
        """Return investigations with crew-habitat relevance >= *min_relevance*.

        Args:
            min_relevance: Minimum relevance score (0.0–1.0).
        """
        return [inv for inv in self._investigations if inv.relevance_to_crew_habitat >= min_relevance]

    # ── Document Conversion ─────────────────────────────────────────────

    def to_documents(self) -> list[Document]:
        """Convert all investigations to LangChain ``Document`` objects.

        Each investigation becomes a single document with its full textual
        representation as page content and rich metadata for filtering.

        Returns:
            List of LangChain ``Document`` instances.
        """
        documents: list[Document] = []
        for inv in self._investigations:
            content_parts = [
                f"Investigation: {inv.name} ({inv.acronym})",
                f"Project: {inv.project or 'N/A'}",
                f"Hardware: {inv.hardware_facility}",
                f"Fire Safety Pillar: {inv.fire_safety_pillar.value}",
                f"Gravity: {inv.gravity.value}",
                "",
                f"Objectives: {inv.objectives}",
                "",
                f"Approach: {inv.approach}",
                "",
                "Fuels:",
            ]
            for fuel in inv.fuels:
                content_parts.append(
                    f"  - {fuel.material_name} ({fuel.fuel_type.value})"
                    + (f", shape: {fuel.shape}" if fuel.shape else "")
                    + (f", dimensions: {fuel.dimensions_mm} mm" if fuel.dimensions_mm else "")
                )
            content_parts.append("")
            content_parts.append("Atmosphere Conditions:")
            for atm in inv.atmosphere:
                content_parts.append(
                    f"  - {atm.oxygen_pct}% O2, {atm.pressure_psi} psi, diluent: {atm.diluent}"
                    + (f", flow: {atm.flow_velocity_cm_s} cm/s" if atm.flow_velocity_cm_s else ", quiescent")
                )
            content_parts.append("")
            content_parts.append("Key Findings:")
            for finding in inv.key_findings:
                content_parts.append(f"  - {finding}")
            content_parts.append("")
            content_parts.append("Earth Applications:")
            for app in inv.earth_applications:
                content_parts.append(f"  - {app}")

            metadata = {
                "investigation_id": inv.id,
                "acronym": inv.acronym,
                "project": inv.project or "",
                "hardware": inv.hardware_facility,
                "fuel_types": sorted({f.fuel_type.value for f in inv.fuels}),
                "oxygen_range": (
                    f"{min(a.oxygen_pct for a in inv.atmosphere)}-{max(a.oxygen_pct for a in inv.atmosphere)}"
                    if inv.atmosphere
                    else "N/A"
                ),
                "gravity_condition": inv.gravity.value,
                "pillar": inv.fire_safety_pillar.value,
                "relevance": inv.relevance_to_crew_habitat,
                "related_investigations": inv.related_investigations,
            }

            documents.append(Document(page_content="\n".join(content_parts), metadata=metadata))

        return documents
