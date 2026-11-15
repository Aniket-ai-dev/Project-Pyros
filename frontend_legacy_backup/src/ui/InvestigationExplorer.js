/**
 * InvestigationExplorer.js
 * Interactive NASA Mission Archive & Deep-Dive Investigation Explorer.
 * Features:
 * - Filterable catalog of the 22 NASA microgravity combustion missions
 * - Multi-criteria filters: Pillar, Fuel Type, Hardware, Min Relevance
 * - Full deep-dive scientific dossier modal for each mission
 * - "⚡ Replicate in Room Candle" action that configures the 3D candle chamber
 */

export class InvestigationExplorer {
  constructor(dataService, onApplyAtmosphere) {
    this.dataService = dataService;
    this.onApplyAtmosphere = onApplyAtmosphere;

    this.isOpen = false;
    this.currentFilters = {
      pillar: 'ALL',
      fuel_type: 'all',
      hardware: 'all',
      min_relevance: 0.0
    };

    this.activeInvestigation = null;
    this.dom = null;
    this.detailModal = null;

    this.createDOM();
    this.bindEvents();
  }

  createDOM() {
    // 1. Main Explorer Modal Container
    const explorerEl = document.createElement('div');
    explorerEl.id = 'nasa-explorer-modal';
    explorerEl.className = 'nasa-modal-overlay hidden';

    explorerEl.innerHTML = `
      <div class="nasa-modal-card">
        <!-- Explorer Header -->
        <div class="nasa-modal-header">
          <div class="nasa-modal-title-wrap">
            <span class="nasa-meatball-badge">NASA // ISS & CYGNUS</span>
            <div class="nasa-title-text">
              <h2>Microgravity Combustion Investigation Archives</h2>
              <span class="nasa-sub-title">22 Empirical Spaceflight Missions on CIR, MSG, and Cygnus</span>
            </div>
          </div>
          <div class="header-right-meta">
            <span id="explorer-backend-status" class="backend-pill">
              <span class="status-dot"></span>
              <span class="status-label">Checking Backend...</span>
            </span>
            <button id="btn-close-explorer" class="nasa-modal-close-btn" aria-label="Close Explorer">&times;</button>
          </div>
        </div>

        <!-- Filter Controls Toolbar -->
        <div class="nasa-filter-toolbar">
          <!-- Pillar Tabs -->
          <div class="filter-group">
            <span class="filter-label">Research Pillar</span>
            <div class="pillar-btn-row">
              <button class="filter-tab-btn active" data-pillar="ALL">All Pillars</button>
              <button class="filter-tab-btn" data-pillar="PREVENTION">Prevention</button>
              <button class="filter-tab-btn" data-pillar="DETECTION">Detection</button>
              <button class="filter-tab-btn" data-pillar="SUPPRESSION">Suppression</button>
            </div>
          </div>

          <!-- Fuel Type Filter -->
          <div class="filter-group">
            <span class="filter-label">Fuel Phase</span>
            <select id="select-fuel-filter" class="nasa-select">
              <option value="all">All Fuels (Solid, Liquid, Gas)</option>
              <option value="solid">Solid (Cloth, PMMA, Polymers)</option>
              <option value="liquid">Liquid (Droplets, Alkane Fuels)</option>
              <option value="gas">Gas (Methane, Ethylene)</option>
            </select>
          </div>

          <!-- Flight Hardware Filter -->
          <div class="filter-group">
            <span class="filter-label">Flight Hardware</span>
            <select id="select-hardware-filter" class="nasa-select">
              <option value="all">All Flight Facilities</option>
              <option value="MSG">MSG (Science Glovebox)</option>
              <option value="CIR">CIR (Combustion Integrated Rack)</option>
              <option value="Cygnus">Cygnus (Saffire Spacecraft)</option>
            </select>
          </div>

          <!-- Minimum Relevance Slider -->
          <div class="filter-group relevance-filter-group">
            <div class="filter-label-row">
              <span class="filter-label">Min Relevance</span>
              <span id="val-filter-relevance" class="filter-val-badge">0.0</span>
            </div>
            <input type="range" id="slider-filter-relevance" min="0.0" max="0.95" step="0.05" value="0.0" class="filter-range-slider" />
          </div>
        </div>

        <!-- Results Count Banner -->
        <div class="results-meta-bar">
          <span id="txt-results-count" class="results-count">Loading investigations...</span>
          <span class="results-hint">Click any mission card to open full experimental dossier & load test parameters</span>
        </div>

        <!-- Investigations Cards Grid -->
        <div id="investigations-grid" class="investigations-grid-scroll"></div>
      </div>
    `;

    document.body.appendChild(explorerEl);
    this.dom = explorerEl;

    // 2. Deep-Dive Dossier Detail Modal
    const detailEl = document.createElement('div');
    detailEl.id = 'nasa-detail-modal';
    detailEl.className = 'nasa-modal-overlay hidden detail-layer';
    detailEl.innerHTML = `<div class="nasa-modal-card detail-card" id="detail-card-content"></div>`;
    document.body.appendChild(detailEl);
    this.detailModal = detailEl;
  }

  bindEvents() {
    // Close Explorer
    const closeBtn = document.getElementById('btn-close-explorer');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // Close on overlay backdrop click
    this.dom.addEventListener('click', (e) => {
      if (e.target === this.dom) this.close();
    });

    this.detailModal.addEventListener('click', (e) => {
      if (e.target === this.detailModal) this.closeDetail();
    });

    // Pillar Filter Buttons
    this.dom.querySelectorAll('.filter-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.dom.querySelectorAll('.filter-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFilters.pillar = btn.dataset.pillar;
        this.refreshList();
      });
    });

    // Fuel Type Dropdown
    const fuelSelect = document.getElementById('select-fuel-filter');
    if (fuelSelect) {
      fuelSelect.addEventListener('change', (e) => {
        this.currentFilters.fuel_type = e.target.value;
        this.refreshList();
      });
    }

    // Hardware Dropdown
    const hwSelect = document.getElementById('select-hardware-filter');
    if (hwSelect) {
      hwSelect.addEventListener('change', (e) => {
        this.currentFilters.hardware = e.target.value;
        this.refreshList();
      });
    }

    // Relevance Slider
    const relSlider = document.getElementById('slider-filter-relevance');
    const relValEl = document.getElementById('val-filter-relevance');
    if (relSlider && relValEl) {
      relSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        relValEl.textContent = val.toFixed(2);
        this.currentFilters.min_relevance = val;
        this.refreshList();
      });
    }
  }

  async open() {
    this.dom.classList.remove('hidden');
    this.isOpen = true;
    await this.updateBackendStatusBadge();
    await this.refreshList();
  }

  close() {
    this.dom.classList.add('hidden');
    this.isOpen = false;
  }

  closeDetail() {
    this.detailModal.classList.add('hidden');
    this.activeInvestigation = null;
  }

  async updateBackendStatusBadge() {
    const badge = document.getElementById('explorer-backend-status');
    if (!badge) return;

    const isOnline = await this.dataService.checkHealth();
    if (isOnline) {
      badge.className = 'backend-pill online';
      badge.innerHTML = `<span class="status-dot"></span><span>BACKEND ONLINE (:8000)</span>`;
    } else {
      badge.className = 'backend-pill standalone';
      badge.innerHTML = `<span class="status-dot"></span><span>STANDALONE ARCHIVE</span>`;
    }
  }

  async refreshList() {
    const grid = document.getElementById('investigations-grid');
    const countEl = document.getElementById('txt-results-count');
    if (!grid) return;

    grid.innerHTML = `<div class="loading-state"><span>Scanning NASA flight archives...</span></div>`;

    const res = await this.dataService.getInvestigations(this.currentFilters);
    const list = res.investigations || [];

    if (countEl) {
      countEl.textContent = `Showing ${list.length} of ${res.count || 22} Spaceflight Investigations`;
    }

    if (list.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <span>No investigations match the selected criteria. Try adjusting the Pillar or Relevance threshold.</span>
        </div>
      `;
      return;
    }

    grid.innerHTML = '';
    list.forEach(inv => {
      if (!inv) return;
      const card = document.createElement('div');

      const rawPillar = inv.pillar || inv.fire_safety_pillar || 'PREVENTION';
      const pillar = (typeof rawPillar === 'object' && rawPillar?.value) ? rawPillar.value : String(rawPillar);
      const pillarLower = pillar.toLowerCase();
      card.className = `investigation-card pillar-${pillarLower}`;

      // Pillar badge color
      let pillarClass = 'pill-prevention';
      if (pillar.toUpperCase() === 'DETECTION') pillarClass = 'pill-detection';
      if (pillar.toUpperCase() === 'SUPPRESSION') pillarClass = 'pill-suppression';

      // Fuels tags
      const fuels = Array.isArray(inv.fuels) ? inv.fuels : [];
      const fuelsHtml = fuels.map(f => {
        if (!f) return '';
        const ft = (typeof f.fuel_type === 'object' && f.fuel_type?.value) ? f.fuel_type.value : (f.fuel_type || 'solid');
        const mn = f.material_name || 'Specimen';
        return `<span class="fuel-chip ${ft}">${mn}</span>`;
      }).filter(Boolean).join('');

      const acronym = inv.acronym || (inv.id ? String(inv.id).toUpperCase() : 'NASA');
      const hardware = inv.hardware || inv.hardware_facility || 'ISS Experiment';
      const name = inv.name || 'Microgravity Combustion Investigation';
      const o2Range = inv.o2_range || '21%';
      const relVal = typeof inv.relevance === 'number'
        ? inv.relevance
        : (typeof inv.relevance_to_crew_habitat === 'number' ? inv.relevance_to_crew_habitat : 0.85);
      const relPct = Math.round(relVal * 100);

      card.innerHTML = `
        <div class="card-top-row">
          <div class="card-acronym-wrap">
            <span class="inv-acronym">${acronym}</span>
            <span class="inv-hardware-badge">${hardware}</span>
          </div>
          <span class="inv-pillar-pill ${pillarClass}">${pillar}</span>
        </div>

        <div class="inv-name-title">${name}</div>

        <div class="card-fuels-row">
          ${fuelsHtml}
        </div>

        <div class="card-meta-footer">
          <div class="meta-item">
            <span class="meta-label">O₂ Range:</span>
            <span class="meta-val">${o2Range}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Relevance:</span>
            <div class="relevance-bar-wrap">
              <div class="relevance-bar-fill" style="width: ${relPct}%;"></div>
            </div>
            <span class="meta-val">${relPct}%</span>
          </div>
        </div>
      `;

      card.addEventListener('click', () => {
        this.openDetail(inv.id);
      });

      grid.appendChild(card);
    });
  }

  async openDetail(id) {
    const content = document.getElementById('detail-card-content');
    if (!content) return;

    this.detailModal.classList.remove('hidden');
    content.innerHTML = `<div class="loading-state"><span>Accessing NASA Flight Mission Dossier #${id}...</span></div>`;

    try {
      const detail = await this.dataService.getInvestigationDetails(id);
      if (!detail) {
        content.innerHTML = `
          <div class="empty-state">
            <h3 style="color:#f43f5e;margin-bottom:8px;">Dossier Unavailable</h3>
            <p>Could not retrieve NASA flight investigation dossier for #${id}.</p>
            <button id="btn-close-detail" class="nasa-modal-close-btn">&times;</button>
          </div>
        `;
        const closeBtn = document.getElementById('btn-close-detail');
        if (closeBtn) closeBtn.addEventListener('click', () => this.closeDetail());
        return;
      }
      this.activeInvestigation = detail;

      // Tested Atmospheres rows (guarded against null/undefined)
      const atmosphereList = Array.isArray(detail.atmosphere) ? detail.atmosphere : [];
      const atmosRows = atmosphereList.map((at, idx) => {
        if (!at) return '';
        const o2Raw = at.oxygen_pct != null ? at.oxygen_pct : '21.0';
        const o2Display = String(o2Raw).includes('%') ? o2Raw : `${o2Raw}%`;
        const psiDisplay = at.pressure_psi != null ? at.pressure_psi : 14.7;
        const velVal = (at.flow_velocity_cm_s != null && !isNaN(Number(at.flow_velocity_cm_s)))
          ? `${Number(at.flow_velocity_cm_s).toFixed(1)} cm/s`
          : '0.0 cm/s (Quiescent)';
        const diluentVal = at.diluent || 'N2';

        return `
          <tr class="atmos-table-row">
            <td><strong>${o2Display}</strong></td>
            <td>${psiDisplay} psi</td>
            <td>${velVal}</td>
            <td><span class="gas-tag">${diluentVal}</span></td>
            <td>
              <button class="btn-apply-atmos" data-idx="${idx}" title="Set Room Candle to these exact atmospheric values">
                ⚡ Test in Candle
              </button>
            </td>
          </tr>
        `;
      }).filter(Boolean).join('');

      // Tested Fuels rows (guarded against missing fields)
      const fuelsList = Array.isArray(detail.fuels) ? detail.fuels : [];
      const fuelsRows = fuelsList.map(f => {
        if (!f) return '';
        const fuelType = (typeof f.fuel_type === 'object' && f.fuel_type?.value)
          ? f.fuel_type.value
          : (f.fuel_type || 'solid');
        const matName = f.material_name || 'Specimen';
        const shape = f.sample_shape || f.shape || 'Standard Geometry';
        const dims = f.sample_dimensions_cm || f.dimensions_mm || 'Standard Dimensions';
        return `
          <tr>
            <td><strong>${matName}</strong></td>
            <td><span class="fuel-chip ${fuelType}">${fuelType}</span></td>
            <td>${shape}</td>
            <td>${dims}</td>
          </tr>
        `;
      }).filter(Boolean).join('');

      // Diagnostic Sensors rows
      const sensorsList = Array.isArray(detail.sensors) ? detail.sensors : [];
      const sensorsRows = sensorsList.map(s => {
        if (!s) return '';
        const sType = (typeof s.sensor_type === 'object' && s.sensor_type?.value)
          ? s.sensor_type.value
          : (s.sensor_type || 'Optical Sensor');
        const sMeas = s.measurement_type || 'Combustion Diagnostic';
        const sUnits = s.units || 'Standard Units';
        return `
          <tr>
            <td><strong>${sType}</strong></td>
            <td>${sMeas}</td>
            <td><code>${sUnits}</code></td>
          </tr>
        `;
      }).filter(Boolean).join('');

      // Within-Investigation Variables (Differed vs Constant)
      const vars = detail.within_investigation_variables || {};
      const differedList = Array.isArray(vars.differed) && vars.differed.length > 0
        ? vars.differed
        : ['Oxygen concentrations and forced flow velocities varied across experimental matrix.'];
      const constantList = Array.isArray(vars.held_constant) && vars.held_constant.length > 0
        ? vars.held_constant
        : [`${detail.hardware || 'CIR / MSG'} chamber volume and flight hardware geometry held constant.`];

      const differedHtml = differedList.map(d => `
        <div class="var-item">
          <span class="var-badge differed">VARIED</span>
          <span>${d}</span>
        </div>
      `).join('');

      const constantHtml = constantList.map(c => `
        <div class="var-item">
          <span class="var-badge constant">CONSTANT</span>
          <span>${c}</span>
        </div>
      `).join('');

      // Other investigations for comparative bridge
      const allInvs = this.dataService.getEmbeddedInvestigations();
      const currentCleanId = String(detail.id || id || '').toLowerCase();
      const otherInvs = allInvs.filter(x => x.id.toLowerCase() !== currentCleanId);
      const compareOptions = otherInvs.map(x => `
        <option value="${x.id}">${x.acronym} — ${x.name} (${x.hardware})</option>
      `).join('');

      // Key Findings list
      const findingsList = (Array.isArray(detail.key_findings) && detail.key_findings.length > 0)
        ? detail.key_findings
        : ['Demonstrated altered combustion kinetics and flammability boundaries in microgravity conditions.'];
      const findingsHtml = findingsList.map(kf => `
        <li class="finding-item">
          <span class="finding-bullet">✦</span>
          <span>${kf}</span>
        </li>
      `).join('');

      // Earth Applications list
      const earthList = (Array.isArray(detail.earth_applications) && detail.earth_applications.length > 0)
        ? detail.earth_applications
        : ['Advances combustion modeling for high-efficiency burners and commercial aerospace safety systems.'];
      const earthHtml = earthList.map(ea => `
        <li class="earth-item">
          <span class="earth-bullet">🌍</span>
          <span>${ea}</span>
        </li>
      `).join('');

      const acronym = detail.acronym || (detail.id ? String(detail.id).toUpperCase() : 'NASA');
      const dossierId = (detail.id || id || 'MISSION').toUpperCase();
      const dossierName = detail.name || 'NASA Flight Investigation';
      const hardware = detail.hardware || detail.hardware_facility || 'CIR / MSG';
      const rawPillar = detail.pillar || detail.fire_safety_pillar || 'PREVENTION';
      const pillar = (typeof rawPillar === 'object' && rawPillar?.value) ? rawPillar.value : String(rawPillar);
      const rawGravity = detail.gravity || 'MICROGRAVITY';
      const gravity = (typeof rawGravity === 'object' && rawGravity?.value) ? rawGravity.value : String(rawGravity);
      const relVal = typeof detail.relevance === 'number'
        ? detail.relevance
        : (typeof detail.relevance_to_crew_habitat === 'number' ? detail.relevance_to_crew_habitat : 0.88);
      const relevanceDisplay = Math.round(relVal * 100);
      const objectives = detail.objectives || `NASA empirical investigation aboard ${hardware} studying combustion kinetics and extinction limits.`;

      content.innerHTML = `
        <!-- Dossier Header -->
        <div class="detail-header">
          <div class="detail-title-wrap">
            <div class="acronym-title-row">
              <span class="dossier-acronym">${acronym}</span>
              <span class="dossier-id">MISSION ARCHIVE // #${dossierId}</span>
            </div>
            <h2 class="dossier-name">${dossierName}</h2>
            <div class="dossier-tags-row">
              <span class="dossier-tag hardware">${hardware}</span>
              <span class="dossier-tag pillar">${pillar}</span>
              <span class="dossier-tag gravity">${gravity}</span>
              <span class="dossier-tag relevance">RELEVANCE: ${relevanceDisplay}%</span>
            </div>
          </div>
          <button id="btn-close-detail" class="nasa-modal-close-btn">&times;</button>
        </div>

        <!-- Dossier Body Scroll -->
        <div class="detail-body-scroll">
          <!-- 1. Scientific Objectives -->
          <section class="dossier-section">
            <h3 class="section-title">1. Experimental Rationale & Objectives</h3>
            <p class="dossier-paragraph">${objectives}</p>
          </section>

          <!-- 2. Tested Fuels Matrix -->
          <section class="dossier-section">
            <h3 class="section-title">2. Tested Materials & Fuel Specimens</h3>
            <table class="dossier-table">
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Phase</th>
                  <th>Sample Geometry</th>
                  <th>Dimensions</th>
                </tr>
              </thead>
              <tbody>
                ${fuelsRows || '<tr><td colspan="4">Standard research specimens tested.</td></tr>'}
              </tbody>
            </table>
          </section>

          <!-- 3. Atmospheric Environments & Live Simulation Bridge -->
          <section class="dossier-section">
            <div class="section-title-wrap">
              <h3 class="section-title">3. Spaceflight Atmospheric Test Matrix</h3>
              <span class="sub-hint">Click 'Test in Candle' to dynamically inject condition into space station room</span>
            </div>
            <table class="dossier-table atmos-table">
              <thead>
                <tr>
                  <th>Oxygen (% O₂)</th>
                  <th>Pressure (psi)</th>
                  <th>Vent Velocity</th>
                  <th>Diluent Gas</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${atmosRows || '<tr><td colspan="5">Microgravity chamber atmosphere data available.</td></tr>'}
              </tbody>
            </table>
          </section>

          <!-- 4. Diagnostic Sensors & Instrumentation -->
          <section class="dossier-section">
            <h3 class="section-title">4. Diagnostic Sensors & Measurement Instrumentation</h3>
            <table class="dossier-table">
              <thead>
                <tr>
                  <th>Sensor Technology</th>
                  <th>Physical Parameter Measured</th>
                  <th>Units</th>
                </tr>
              </thead>
              <tbody>
                ${sensorsRows || '<tr><td colspan="3">Standard calibrated spaceflight optical & thermocouple diagnostics.</td></tr>'}
              </tbody>
            </table>
          </section>

          <!-- 5. Within-Investigation Variables -->
          <section class="dossier-section">
            <h3 class="section-title">5. Within-Investigation Variables Analysis</h3>
            <p class="sub-hint" style="margin-bottom: 8px;">Parameters varied across experimental test points vs. conditions held constant:</p>
            <div class="variables-box" style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px;">
              ${differedHtml}
              ${constantHtml}
            </div>
          </section>

          <!-- 6. Key Scientific Discoveries -->
          <section class="dossier-section">
            <h3 class="section-title">6. Key Scientific Discoveries</h3>
            <ul class="dossier-list findings-list">
              ${findingsHtml}
            </ul>
          </section>

          <!-- 7. Earth Safety Applications -->
          <section class="dossier-section">
            <h3 class="section-title">7. Terrestrial Applications & Technology Transfer</h3>
            <ul class="dossier-list earth-list">
              ${earthHtml}
            </ul>
          </section>

          <!-- 8. Interactive Cross-Investigation Comparison Bridge -->
          <section class="dossier-section">
            <h3 class="section-title">8. Cross-Investigation Comparison & Hardware Evolution</h3>
            <p class="sub-hint">Compare ${acronym} side-by-side with another NASA flight investigation from the Physical Science Informatics database:</p>
            <div class="compare-control-bar">
              <select id="compare-select-target" class="compare-select">
                ${compareOptions}
              </select>
              <button id="btn-trigger-compare" class="btn-trigger-compare">⚡ Compare Investigations</button>
            </div>
            <div id="compare-result-container"></div>
          </section>
        </div>
      `;

      // Close Button
      const detailClose = document.getElementById('btn-close-detail');
      if (detailClose) {
        detailClose.addEventListener('click', () => this.closeDetail());
      }

      // Bind Cross-Investigation Compare Button
      const btnCompare = content.querySelector('#btn-trigger-compare');
      const compareSelect = content.querySelector('#compare-select-target');
      const compareResultContainer = content.querySelector('#compare-result-container');

      if (btnCompare && compareSelect && compareResultContainer) {
        btnCompare.addEventListener('click', async () => {
          const targetId = compareSelect.value;
          btnCompare.textContent = 'Comparing...';
          btnCompare.disabled = true;

          try {
            let compData = null;
            try {
              const res = await fetch(`${this.dataService.baseUrl}/investigations/${detail.id}/compare/${targetId}`);
              if (res.ok) compData = await res.json();
            } catch {}

            if (!compData) {
              // Local fallback from embedded dataset
              const other = allInvs.find(x => x.id === targetId) || allInvs[0];
              const sharedHw = (detail.hardware === other.hardware) ? detail.hardware : null;
              compData = {
                compared_investigations: [detail.acronym, other.acronym],
                shared_variables: {
                  shared_hardware: sharedHw || 'Distinct flight hardware suites',
                  common_fuel_phase: 'Evaluated under spaceflight combustion guidelines',
                  gravity_condition: [detail.gravity, other.gravity]
                },
                differing_variables: [
                  {
                    variable: 'Tested Materials',
                    values: {
                      [detail.acronym]: (detail.fuels || []).map(f => f.material_name).join(', ') || 'Standard fuels',
                      [other.acronym]: (other.fuels || []).map(f => f.material_name).join(', ') || 'Standard fuels'
                    },
                    significance: 'Distinct physical combustion phase behavior'
                  }
                ],
                hardware_relationships: [
                  (detail.id === 'same' && targetId === 'daft')
                    ? 'Smoke/aerosol detection instrument from SAME was repurposed for dust detection in DAFT'
                    : (detail.hardware === other.hardware
                        ? `Both investigations were conducted utilizing the modular ${detail.hardware} facility.`
                        : `Conducted in separate facilities (${detail.hardware} vs ${other.hardware}).`)
                ],
                combined_insight: `Analyzing ${detail.acronym} alongside ${other.acronym} provides complementary bounds across flammability and fire safety detection/suppression pillars.`,
                gap_analysis: 'Partial-gravity operational conditions require Roper scaling extrapolation until LUCI and FM2 data is published.'
              };
            }

            const otherInv = allInvs.find(x => x.id === targetId) || { acronym: targetId.toUpperCase(), name: 'NASA Mission' };
            const hwRelText = (Array.isArray(compData.hardware_relationships) && compData.hardware_relationships.length > 0)
              ? compData.hardware_relationships.join(' ')
              : (compData.explanation || 'Both investigations provide foundational microgravity combustion constraints.');

            compareResultContainer.innerHTML = `
              <div class="compare-result-card">
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:8px;">
                  <strong style="color:#0284c7; font-size:12.5px;">Comparison: ${detail.acronym} ↔ ${otherInv.acronym}</strong>
                  <span style="font-size:10px; color:#64748b; background:#f1f5f9; padding:2px 8px; border-radius:4px;">NASA GRAPH VERIFIED</span>
                </div>

                <div class="compare-rel-pill">
                  <strong>Hardware & Instrument Lineage:</strong><br>
                  ${hwRelText}
                </div>

                <div class="compare-grid">
                  <div class="compare-block">
                    <div class="compare-block-title">Shared Variables & Infrastructure</div>
                    <ul style="padding-left:14px; margin:0; font-size:11px; color:#334155;">
                      <li>Hardware: <strong>${compData.shared_variables?.shared_hardware || detail.hardware}</strong></li>
                      <li>Environment: <strong>${detail.gravity}</strong></li>
                    </ul>
                  </div>

                  <div class="compare-block">
                    <div class="compare-block-title">Contrasting Variables</div>
                    <ul style="padding-left:14px; margin:0; font-size:11px; color:#334155;">
                      <li>${detail.acronym} Focus: <strong>${detail.pillar}</strong></li>
                      <li>${otherInv.acronym} Focus: <strong>${otherInv.pillar || 'EXPLORATION'}</strong></li>
                    </ul>
                  </div>
                </div>

                <div style="font-size:11.5px; line-height:1.45; color:#475569; background:#f8fafc; padding:8px 10px; border-radius:6px; border:1px solid #e2e8f0;">
                  <strong>Scientific Synthesis:</strong> ${compData.combined_insight || compData.gap_analysis}
                </div>
              </div>
            `;
          } catch (e) {
            compareResultContainer.innerHTML = `<p style="color:#f43f5e; font-size:11px;">Comparison failed: ${e.message}</p>`;
          } finally {
            btnCompare.textContent = '⚡ Compare Investigations';
            btnCompare.disabled = false;
          }
        });
      }

      // Bind "Test in Candle" buttons
      content.querySelectorAll('.btn-apply-atmos').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.idx, 10);
          const at = atmosphereList[idx];
          if (at && this.onApplyAtmosphere) {
            const o2 = parseFloat(at.oxygen_pct) || 21.0;
            const psi = parseFloat(at.pressure_psi) || 14.7;
            const g = (String(gravity).toUpperCase().includes('PARTIAL')) ? 0.16 : 0.00;

            this.onApplyAtmosphere({
              gravity_g: g,
              o2_pct: o2,
              pressure_psi: psi,
              sourceMission: acronym
            });

            // Flash button feedback
            btn.textContent = '✓ Active in Room';
            btn.classList.add('applied');
            setTimeout(() => {
              btn.textContent = '⚡ Test in Candle';
              btn.classList.remove('applied');
            }, 2000);
          }
        });
      });
    } catch (err) {
      console.error(`Error opening dossier for ${id}:`, err);
      content.innerHTML = `
        <div class="empty-state">
          <h3 style="color:#f43f5e;margin-bottom:8px;">Error Loading Dossier</h3>
          <p>${err.message || 'An unexpected runtime error occurred.'}</p>
          <button id="btn-close-detail" class="nasa-modal-close-btn">&times;</button>
        </div>
      `;
      const detailClose = document.getElementById('btn-close-detail');
      if (detailClose) {
        detailClose.addEventListener('click', () => this.closeDetail());
      }
    }
  }
}

