#!/usr/bin/env node

/**
 * 🔄 Automatische Service Worker Version Update
 * Ersetzt die CACHE_VERSION mit aktueller Zeitstempel bei jedem Build
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SW_PATH = path.join(__dirname, '../public/service-worker.js');
const ADVANCED_SW_PATH = path.join(__dirname, '../src/workers/advanced-service-worker.ts');

// Generiere neue Version basierend auf Zeitstempel
const now = new Date();
const buildVersion = `v${now.getFullYear()}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getDate().toString().padStart(2, '0')}.${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;

console.log(`🔄 Updating Service Worker version to: ${buildVersion}`);

// Update public/service-worker.js
if (fs.existsSync(SW_PATH)) {
  let swContent = fs.readFileSync(SW_PATH, 'utf8');
  swContent = swContent.replace(
    /const CACHE_VERSION = '[^']+';/,
    `const CACHE_VERSION = '${buildVersion}';`
  );
  fs.writeFileSync(SW_PATH, swContent);
  console.log('✅ Updated public/service-worker.js');
}

// Update src/workers/advanced-service-worker.ts
if (fs.existsSync(ADVANCED_SW_PATH)) {
  let advancedSwContent = fs.readFileSync(ADVANCED_SW_PATH, 'utf8');
  advancedSwContent = advancedSwContent.replace(
    /const CACHE_VERSION = '[^']+';/,
    `const CACHE_VERSION = '${buildVersion}';`
  );
  fs.writeFileSync(ADVANCED_SW_PATH, advancedSwContent);
  console.log('✅ Updated src/workers/advanced-service-worker.ts');
}

console.log(`🚀 Service Worker cache will be invalidated on next deployment`);