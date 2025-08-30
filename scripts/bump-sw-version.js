#!/usr/bin/env node

/**
 * Script zum manuellen Erhöhen der Service Worker Version
 * Nutze dies VOR einem Release/Deploy
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SW_PATH = path.join(__dirname, '..', 'public', 'service-worker.js');

// Lese Service Worker
let swContent = fs.readFileSync(SW_PATH, 'utf8');

// Finde aktuelle Version
const versionMatch = swContent.match(/const CACHE_VERSION = 'v(\d{4})\.(\d{2})\.(\d{2})\.(\d{3})'/);

if (versionMatch) {
  const [, year, month, day, build] = versionMatch;
  
  // Generiere neue Version
  const now = new Date();
  const newYear = now.getFullYear();
  const newMonth = (now.getMonth() + 1).toString().padStart(2, '0');
  const newDay = now.getDate().toString().padStart(2, '0');
  
  let newBuild;
  
  // Wenn gleicher Tag, erhöhe Build-Nummer
  if (year === newYear.toString() && month === newMonth && day === newDay) {
    newBuild = (parseInt(build) + 1).toString().padStart(3, '0');
  } else {
    // Neuer Tag, starte bei 001
    newBuild = '001';
  }
  
  const newVersion = `v${newYear}.${newMonth}.${newDay}.${newBuild}`;
  
  // Ersetze Version
  swContent = swContent.replace(
    /const CACHE_VERSION = '[^']+'/,
    `const CACHE_VERSION = '${newVersion}'`
  );
  
  // Schreibe zurück
  fs.writeFileSync(SW_PATH, swContent, 'utf8');
  
  // console.log(`✅ Service Worker Version aktualisiert: ${newVersion}`);
  // console.log('🚀 Bereit für Deployment!');
} else {
  // console.error('❌ Konnte Version nicht finden');
  process.exit(1);
}