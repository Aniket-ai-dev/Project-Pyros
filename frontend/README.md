# 🔥 PROJECT PYROS — Frontend 3D WebGL Simulation Suite & Exploration UI

<p align="center">
  <img src="https://img.shields.io/badge/WebGL%20%2F%20Three.js-0.170.0-000000?style=for-the-badge&logo=three.js&logoColor=white" alt="Three.js">
  <img src="https://img.shields.io/badge/Scenes-4%20Interactive%20Environments-purple?style=for-the-badge" alt="4 Scenes">
  <img src="https://img.shields.io/badge/NASA%20PSI%20Missions-22%20Verified%20(100%25)-success?style=for-the-badge" alt="22 Missions">
  <img src="https://img.shields.io/badge/Zero%20Mockups-Deterministic%20Data-orange?style=for-the-badge" alt="Zero Mockups">
</p>

> The frontend of **PROJECT PYROS** is a high-fidelity, physically interactive 3D WebGL aerospace visualization and scientific intelligence suite. Powered by Three.js and vanilla ES modules, it brings two decades of microgravity combustion research from **NASA's Physical Sciences Informatics (PSI)** database into real-time interactive simulations across four distinct operational regimes: orbital space stations, lunar base camps, pressurized Martian rovers, and planetary surface habitats.

---

## ⚡ Quickstart: Running the Frontend

To launch the frontend locally, navigate to the `frontend/` directory and run a standard Python HTTP server:

```bash
# Navigate to the frontend directory
cd "frontend"

# Launch local HTTP server on port 8080
python3 -m http.server 8080 --bind 0.0.0.0
```

Open your browser to:
- 🛰️ **Space Station Laboratory:** [`http://localhost:8080/station.html`](http://localhost:8080/station.html)
- 🌕 **Moon Base (Artemis Base Camp):** [`http://localhost:8080/moon.html`](http://localhost:8080/moon.html)
- 🏎️ **Martian Rover Circuit Failure:** [`http://localhost:8080/rover.html`](http://localhost:8080/rover.html)
- 🪐 **Mars Planet Surface Outpost:** [`http://localhost:8080/mars.html`](http://localhost:8080/mars.html)
- 🧭 **Multi-Scene Switcher:** Accessible via the **`Menu`** button in the top navbar of every scene.

---

## 🎮 The 4 Interactive 3D WebGL Simulation Scenes

```
┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                             PROJECT PYROS SCENE SUITE                                             │
├────────────────────────────┬─────────────────────────────┬─────────────────────────────┬──────────────────────────┤
│   1. SPACE STATION LAB     │     2. MOON BASE (ARTEMIS)  │    3. ROVER AVIONICS WEB    │  4. MARS SURFACE OUTPOST │
│   (station.html)           │     (moon.html)             │    (rover.html)             │  (mars.html)             │
├────────────────────────────┼─────────────────────────────┼─────────────────────────────┼──────────────────────────┤
│ • Microgravity (0.00g)     │ • Lunar Gravity (0.166g)    │ • Partial Gravity (0.38g)   │ • Partial Gravity (0.38g)│
│ • Destiny & Columbus Racks │ • Shackleton Rim Terrain    │ • Sealed Warm Box (WEB)     │ • Jezero Crater Dunes    │
│ • Interactive ECLSS Air    │ • Interconnected Hab Pods   │ • 7-Stage Failure Timeline  │ • Surveyor Science Lander│
│ • 22-Mission Dossier Modal │ • Solar Farm & Fuel Cells   │ • Component Raycasting HUD  │ • Geodesic Ice Home Dome │
│ • 5-Step Criteria Audit    │ • 5 Simulation Modes        │ • NASA FLIR Thermal Shader  │ • Hypoxic Venting Testbed│
└────────────────────────────┴─────────────────────────────┴─────────────────────────────┴──────────────────────────┘
```

### 1. Space Station Laboratory (`station.html`)
- **Orbital Flight & Module Interior:** Interactive 3D exploration inside the ISS Destiny and Columbus pressurized modules.
- **Eulerian Navier-Stokes Candle Physics:** Real-time 3D fluid simulation modeling the disappearance of buoyant convection ($g = 0$), isotropic molecular diffusion, and the spherical blue radical dome ($CH^*, C_2^*$).
- **Dynamic ECLSS Life Support Controls:** Interactive sliders for oxygen concentration ($10\% - 100\%$), cabin pressure ($2 - 20\text{ psi}$), and ventilation airflow velocity ($0 - 50\text{ cm/s}$).
- **Complete 22 NASA Investigations Explorer:**
  - **Dossier Cards:** Search, filter by fuel phase (Gas, Liquid, Solid, Dust/Aerosol), and inspect complete NASA flight dossiers.
  - **Diagnostic Sensors Table:** Lists sensor technologies, measured parameters, and measurement units.
  - **Within-Investigation Variables Analysis:** Details what varied across runs vs what was held constant.
  - **Cross-Investigation Comparison Bridge:** Side-by-side comparative analysis linking missions with hardware lineage and scientific syntheses via `GET /investigations/{inv1}/compare/{inv2}`.
- **Interactive Criteria Audit Modal (`✦ Criteria Audit`):** 5-step interactive verification tour validating every NASA Space Apps Challenge objective with live evidence.

### 2. Moon Base — Artemis Base Camp (`moon.html`)
- **Shackleton Crater Lunar Landscape:** Realistic grey lunar regolith, micro-craters with raised ejecta rims, impact-fractured breccia boulders, and porous retro-reflective roughness.
- **Deep Space Vacuum & Planetary Lighting:** Zero atmospheric scattering, pitch-black space sky with 4,000+ stars, unattenuated directional sunlight casting deep black shadows, and **Earth ("The Blue Marble")** rotating in the lunar sky with atmospheric limb halo.
- **Interconnected Base Architecture:**
  - Central Operations Hub with geodesic observation cupola and interior console illumination.
  - Twin Habitation Modules (Alpha & Beta) insulated in gold/silver MLI thermal blankets.
  - Pressurized connection tunnels and EVA airlock with status beacons.
  - Dual tracking articulated solar array wings with photovoltaic blue-violet cells.
  - Regenerative Fuel Cell (RFC) substation with cryogenic $\text{LH}_2/\text{LOX}$ reactant spheres.
  - Active Thermal Control System (ATCS) deployable vertical heat rejection radiators.
  - Steerable high-gain Earth relay dish antenna tracking Earth with active RF carrier beacon.
  - In-Situ Resource Utilization (ISRU) regolith sintering reactor.
  - **NASA PSI Partial-Gravity Combustion Testbed:** Models the upcoming **LUCI** and **FM2** investigations ($0.166\text{g}$).
  - Pressurized Lunar Terrain Vehicle (LTV) rover docked at the airlock charging station.
- **5 Interactive Simulation Modes:**
  - *Normal View*: Steady-state operational base.
  - *Power Grid View*: Visualizes energy generation and flowing conduit pulses ($148.5\text{ kW}$ solar, $94.2\%$ battery SOC).
  - *Life Support View*: Shows Artemis exploration atmosphere ($10.2\text{ psi}$, $34.0\%\text{ O}_2$, cabin temps, and scrubbers).
  - *Thermal View*: False-color infrared visualization of cryogenic shadows ($-130^\circ\text{C}$) vs sunlit modules ($+118^\circ\text{C}$).
  - *Emergency Failure View*: Simulates solar input curtailment $\to$ battery draw surge $\to$ automatic load shedding of non-essential ISRU systems $\to$ energy conservation safe mode.

### 3. Martian Rover Circuit Failure (`rover.html`)
- **Sealed Warm Electronics Box (WEB):** Highly detailed 3D motherboard backplane inside the rover chassis under Martian partial gravity ($0.38\text{g}$).
- **Mezzanine Power Stage (PCU):** Precision power conditioning unit elevated on **24 mm precision brass standoffs** above the motherboard, modeling authentic aerospace thermal isolation and landing shock damping.
- **7-Stage Chronological Failure Timeline:**
  1. *Normal Operations*: Steady-state current draw ($3.2\text{ A}$ nominal, $28.0\text{ V}$).
  2. *Thermal Overstress*: Dust accumulation on heatsinks; MOSFET junction temperature climbs $>125^\circ\text{C}$.
  3. *Dielectric Breakdown*: Solder whisker formation and insulation micro-cracking under Martian thermal cycling.
  4. *Micro-arcing Sparks*: High-voltage capacitive discharge across $0.8\text{ mm}$ PCB traces.
  5. *Polymer Combustion*: FR-4 epoxy and conformal coating ignition ($0.38\text{g}$ reduced buoyancy slows smoke dissipation).
  6. *Conformal Fire Spread*: Flame creeping along adjacent component leads and electrolytic capacitors.
  7. *Autonomous SAFE MODE*: Overcurrent protection triggers solid-state bus isolation in $<15\text{ ms}$.
- **Interactive Component Raycasting:** Inspect live telemetry in the Left Avionics HUD.
- **NASA FLIR / Ironbow Thermal Camera:** High-contrast false-color thermal shader displaying live heat gradients.

### 4. Mars Planet Surface Outpost (`mars.html`)
- **Jezero Crater Martian Environment:** Procedural iron-oxide dunes, scattered basalt rock fields, and atmospheric dust haze.
- **Planetary Hardware Suite:** NASA Surveyor-class science lander, geodesic Ice Home pressurized crew habitat, and partial-gravity combustion test chamber.
- **Interactive Hypoxic Extinction Venting:**
  - Simulates the primary non-toxic fire suppression protocol for extraterrestrial habitats.
  - Vents the pressurized chamber atmosphere ($21\%\text{ O}_2$, $101.3\text{ kPa}$) into the hostile Martian ambient atmosphere ($0.13\%\text{ O}_2$, $0.636\text{ kPa}$).
  - Real-time pressure decay and oxygen deprivation snuff the flame in $<2.5\text{ seconds}$ without chemical residue.

---

## 🏛️ Frontend Architecture & File Structure

```
frontend/
├── station.html                  # Space Station Laboratory WebGL page
├── moon.html                     # Moon Base (Artemis Lunar Base) WebGL page
├── rover.html                    # Martian Rover Avionics Failure WebGL page
├── mars.html                     # Mars Surface Outpost WebGL page
├── station.css                   # Master clean UI stylesheet (aerospace telemetry design)
├── favicon.ico                   # Microgravity blue-core flame icon
├── run.sh                        # Fast-launch shell script
└── src/
    ├── station/
    │   ├── stationMain.js        # Station scene coordinator & ECLSS bindings
    │   └── SpaceStationScene.js  # ISS Destiny & Columbus 3D module geometry
    ├── moon/
    │   ├── moonMain.js           # Moon Base coordinator, camera & simulation modes
    │   └── MoonBaseScene.js      # Artemis base, regolith PBR, Earth, solar farm & LTV
    ├── rover/
    │   ├── roverMain.js          # Rover failure sequence controller & HUD
    │   └── RoverCircuitScene.js  # Motherboard, mezzanine PCU, standoffs & shaders
    ├── mars/
    │   ├── marsMain.js           # Mars outpost coordinator & camera kinematics
    │   └── MarsSurfaceScene.js   # Jezero Crater terrain, Surveyor lander & dome
    ├── services/
    │   ├── NASADataService.js    # 22-investigation complete embedded flight dataset
    │   └── ScenarioSimulationMapper.js # Maps SI scenarios to WebGL simulation states
    ├── ui/
    │   ├── InvestigationExplorer.js # 22-Mission Dossiers, Sensors, Variables & Compare
    │   └── CriteriaAuditModal.js # 5-Step Challenge Verification Tour
    ├── physics/
    │   ├── CombustionPhysics.js  # Physical constants, gas mixtures & Arrhenius rates
    │   ├── WebGL2FluidSolver.js  # 3D GPGPU Navier-Stokes Eulerian fluid solver
    │   └── WebGPUFluidSolver.js  # Native WGSL compute shader fluid solver
    └── rendering/
        └── VolumetricFirePass.js # Volumetric raymarching shader with Planck emission
```

---

## 💎 Zero-Mockup Embedded Data Service

All flight investigation records in `NASADataService.js` are derived directly from published NASA PSI research:
- **22 Flight Investigations**: ACME (BRE, E-FIELD, CFI-G, s-Flame, CLD Flame, Flame Design), MDCA (FLEX, FLEX-2, CFI), MSG (BASS, BASS-II, SPICE, SLICE, SAME, SAME-R, DAFT, DAFT-2), Cygnus (Saffire-I, II, III), and Artemis (LUCI, FM2).
- **Diagnostic Sensor Metadata**: Photometers, radiometers, pyrometers, and high-speed schlieren imaging.
- **Autonomous Fallback**: If the backend REST server is temporarily unreachable, the frontend seamlessly resolves cross-investigation comparisons, hardware lineages, and scenario queries using the verified embedded manifest.

---

## 📜 References
- **NASA Glenn Research Center**: *Combustion Integrated Rack (CIR) & Multi-user Droplet Combustion Apparatus (MDCA)*.
- **NASA Physical Sciences Informatics (PSI)**: [`https://psi.nasa.gov`](https://psi.nasa.gov).
- **Three.js Documentation**: [`https://threejs.org`](https://threejs.org).
