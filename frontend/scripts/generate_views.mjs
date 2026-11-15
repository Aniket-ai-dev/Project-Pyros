import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');
const legacyDir = path.join(rootDir, 'frontend_legacy_backup');
const viewsDir = path.join(rootDir, 'frontend/src/components/views');

const MENU_OPENING_WRAPPER = `  <div id="pyros-main-menu" class="pyros-menu-overlay" style="display: none;">
    <div class="pyros-menu-backdrop"></div>
    <div class="pyros-menu-container">
      
      <!-- Top Brand Header -->
      <header class="pyros-menu-header">
        <div class="pyros-menu-badge">
          <span class="pyros-badge-dot"></span>
          <span>NASA PHYSICAL SCIENCES INFORMATICS // MISSION COMMAND</span>
        </div>
        <h1 class="pyros-menu-title">PROJECT PYROS</h1>
        <p class="pyros-menu-desc">Select an operational simulation environment to initiate exploration</p>
      </header>

      <!-- Scene Selection Cards Grid -->
      <div class="pyros-scenes-grid">

        <!-- SCENE 1: Space Station -->
        <div class="pyros-scene-card active" id="card-scene-station">
          <div class="scene-card-visual station-visual">
            <div class="scene-visual-badge active">
              <span class="live-dot"></span>
              <span>AVAILABLE NOW</span>
            </div>
            <!-- Station Module SVG Illustration -->
            <div class="scene-illustration">
              <svg width="120" height="80" viewBox="0 0 120 80" fill="none">
                <rect x="25" y="24" width="70" height="32" rx="16" fill="rgba(56, 189, 248, 0.12)" stroke="#38bdf8" stroke-width="2"/>
                <line x1="10" y1="40" x2="25" y2="40" stroke="#94a3b8" stroke-width="3"/>
                <line x1="95" y1="40" x2="110" y2="40" stroke="#94a3b8" stroke-width="3"/>
                <rect x="5" y="28" width="8" height="24" rx="2" fill="#64748b"/>
                <rect x="107" y="28" width="8" height="24" rx="2" fill="#64748b"/>
                <circle cx="60" cy="40" r="8" fill="rgba(56, 189, 248, 0.25)" stroke="#38bdf8" stroke-width="1.5"/>
                <circle cx="60" cy="40" r="3" fill="#38bdf8"/>
                <line x1="42" y1="24" x2="42" y2="56" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/>
                <line x1="78" y1="24" x2="78" y2="56" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/>
              </svg>
            </div>
          </div>`;

function extractBodyHTML(rawHtml, fixMenu = false, isCombustion = false) {
  let bodyMatch = rawHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  let body = bodyMatch ? bodyMatch[1] : rawHtml;

  // Remove <script type="module" ...> tags at the end
  body = body.replace(/<script\s+type="module"[^>]*>[\s\S]*?<\/script>/gi, '');

  if (isCombustion) {
    // Remove the redirect script in index.html
    body = body.replace(/<script>[\s\S]*?window\.location\.replace[\s\S]*?<\/script>/gi, '');
  }

  if (fixMenu) {
    // Replace <div id="pyros-main-menu" class="cinematic-navigator-modal"></div>
    body = body.replace(
      /<div\s+id="pyros-main-menu"\s+class="cinematic-navigator-modal"><\/div>/i,
      MENU_OPENING_WRAPPER
    );
  }

  // Replace relative .html links with Next.js routes
  body = body.replace(/(['"])(\.\/)?station\.html(['"])/g, '$1/station$3');
  body = body.replace(/(['"])(\.\/)?mars\.html(['"])/g, '$1/mars$3');
  body = body.replace(/(['"])(\.\/)?moon\.html(['"])/g, '$1/moon$3');
  body = body.replace(/(['"])(\.\/)?rover\.html(['"])/g, '$1/rover$3');
  body = body.replace(/(['"])(\.\/)?index\.html(['"])/g, '$1/combustion$3');

  // Replace window.location.href='./station.html' -> '/station' etc
  body = body.replace(/window\.location\.href=['"](\.\/)?station\.html['"]/g, "window.location.href='/station'");
  body = body.replace(/window\.location\.href=['"](\.\/)?mars\.html['"]/g, "window.location.href='/mars'");
  body = body.replace(/window\.location\.href=['"](\.\/)?moon\.html['"]/g, "window.location.href='/moon'");
  body = body.replace(/window\.location\.href=['"](\.\/)?rover\.html['"]/g, "window.location.href='/rover'");
  body = body.replace(/window\.location\.href=['"](\.\/)?index\.html['"]/g, "window.location.href='/combustion'");

  return body.trim();
}

function escapeForJsTemplate(str) {
  return str.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\${/g, '\\${');
}

// 1. SpaceStationView
const stationRaw = fs.readFileSync(path.join(legacyDir, 'station.html'), 'utf-8');
const stationBody = extractBodyHTML(stationRaw, false, false);
const stationViewCode = `'use client';

import React, { useEffect, useRef } from 'react';

const HTML_CONTENT = \`${escapeForJsTemplate(stationBody)}\`;

export default function SpaceStationView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    import('../../station/stationMain.js')
      .then(({ SpaceStationApp }) => {
        if (!isMounted) return;
        if (appRef.current) {
          appRef.current.destroy();
        }
        appRef.current = new SpaceStationApp();
      })
      .catch((err) => console.error('Failed to init SpaceStationApp:', err));

    return () => {
      isMounted = false;
      if (appRef.current && typeof appRef.current.destroy === 'function') {
        appRef.current.destroy();
        appRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="clean-ui-body station-view-root"
      dangerouslySetInnerHTML={{ __html: HTML_CONTENT }}
    />
  );
}
`;
fs.writeFileSync(path.join(viewsDir, 'SpaceStationView.tsx'), stationViewCode, 'utf-8');
console.log('Created SpaceStationView.tsx');

// 2. MarsSurfaceView
const marsRaw = fs.readFileSync(path.join(legacyDir, 'mars.html'), 'utf-8');
const marsBody = extractBodyHTML(marsRaw, true, false);
const marsViewCode = `'use client';

import React, { useEffect, useRef } from 'react';

const HTML_CONTENT = \`${escapeForJsTemplate(marsBody)}\`;

export default function MarsSurfaceView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    import('../../mars/marsMain.js')
      .then(({ MarsApp }) => {
        if (!isMounted) return;
        if (appRef.current) {
          appRef.current.destroy();
        }
        appRef.current = new MarsApp();
      })
      .catch((err) => console.error('Failed to init MarsApp:', err));

    return () => {
      isMounted = false;
      if (appRef.current && typeof appRef.current.destroy === 'function') {
        appRef.current.destroy();
        appRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="clean-ui-body mars-body mars-view-root"
      dangerouslySetInnerHTML={{ __html: HTML_CONTENT }}
    />
  );
}
`;
fs.writeFileSync(path.join(viewsDir, 'MarsSurfaceView.tsx'), marsViewCode, 'utf-8');
console.log('Created MarsSurfaceView.tsx');

// 3. MoonBaseView
const moonRaw = fs.readFileSync(path.join(legacyDir, 'moon.html'), 'utf-8');
const moonBody = extractBodyHTML(moonRaw, true, false);
const moonViewCode = `'use client';

import React, { useEffect, useRef } from 'react';

const HTML_CONTENT = \`${escapeForJsTemplate(moonBody)}\`;

export default function MoonBaseView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    import('../../moon/moonMain.js')
      .then(({ MoonBaseApp }) => {
        if (!isMounted) return;
        if (appRef.current) {
          appRef.current.destroy();
        }
        appRef.current = new MoonBaseApp();
      })
      .catch((err) => console.error('Failed to init MoonBaseApp:', err));

    return () => {
      isMounted = false;
      if (appRef.current && typeof appRef.current.destroy === 'function') {
        appRef.current.destroy();
        appRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="clean-ui-body moon-body moon-view-root"
      dangerouslySetInnerHTML={{ __html: HTML_CONTENT }}
    />
  );
}
`;
fs.writeFileSync(path.join(viewsDir, 'MoonBaseView.tsx'), moonViewCode, 'utf-8');
console.log('Created MoonBaseView.tsx');

// 4. RoverCircuitView
const roverRaw = fs.readFileSync(path.join(legacyDir, 'rover.html'), 'utf-8');
const roverBody = extractBodyHTML(roverRaw, true, false);
const roverViewCode = `'use client';

import React, { useEffect, useRef } from 'react';

const HTML_CONTENT = \`${escapeForJsTemplate(roverBody)}\`;

export default function RoverCircuitView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    import('../../rover/roverMain.js')
      .then(({ RoverApp }) => {
        if (!isMounted) return;
        if (appRef.current) {
          appRef.current.destroy();
        }
        appRef.current = new RoverApp();
      })
      .catch((err) => console.error('Failed to init RoverApp:', err));

    return () => {
      isMounted = false;
      if (appRef.current && typeof appRef.current.destroy === 'function') {
        appRef.current.destroy();
        appRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="clean-ui-body rover-body rover-view-root"
      dangerouslySetInnerHTML={{ __html: HTML_CONTENT }}
    />
  );
}
`;
fs.writeFileSync(path.join(viewsDir, 'RoverCircuitView.tsx'), roverViewCode, 'utf-8');
console.log('Created RoverCircuitView.tsx');

// 5. CombustionLabView
const indexRaw = fs.readFileSync(path.join(legacyDir, 'index.html'), 'utf-8');
const indexBody = extractBodyHTML(indexRaw, false, true);
const indexViewCode = `'use client';

import React, { useEffect, useRef } from 'react';

const HTML_CONTENT = \`${escapeForJsTemplate(indexBody)}\`;

export default function CombustionLabView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    (window as any).triggerPreset = (presetId: string) => {
      const btn = document.querySelector(\`[data-preset="\${presetId}"]\`) as HTMLElement | null;
      if (btn) btn.click();
      const select = document.getElementById('global-preset-select') as HTMLSelectElement | null;
      if (select && select.value !== presetId) {
        select.value = presetId;
      }
    };

    import('../../main.js')
      .then(({ AeroFireApp }) => {
        if (!isMounted) return;
        if (appRef.current) {
          appRef.current.destroy();
        }
        appRef.current = new AeroFireApp();
      })
      .catch((err) => console.error('Failed to init AeroFireApp:', err));

    return () => {
      isMounted = false;
      if (appRef.current && typeof appRef.current.destroy === 'function') {
        appRef.current.destroy();
        appRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="combustion-view-root"
      dangerouslySetInnerHTML={{ __html: HTML_CONTENT }}
    />
  );
}
`;
fs.writeFileSync(path.join(viewsDir, 'CombustionLabView.tsx'), indexViewCode, 'utf-8');
console.log('Created CombustionLabView.tsx');
