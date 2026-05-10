const { execSync, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const RELEASE_DIR = path.join(__dirname, '..', 'release');
const EXE_NAME = 'TV-Rank-Setup.exe';
const REPO = 'Floatyy1998/Serien-Ranking';

// electron-updater braucht zusaetzlich latest.yml (Manifest mit Version + SHA512)
// und die .blockmap (fuer differential updates — User laedt nur das Delta).
const ASSETS = [EXE_NAME, `${EXE_NAME}.blockmap`, 'latest.yml'];
const assetPaths = ASSETS.map((name) => path.join(RELEASE_DIR, name));

const exePath = assetPaths[0];
if (!fs.existsSync(exePath)) {
  console.error(`ERROR: ${exePath} not found. Run build:electron first.`);
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf-8'));
const version = pkg.version;
const tag = `v${version}`;

// gh CLI suchen — auf Windows ist's gh.cmd / gh.exe, Node findet's nur via shell.
// Wir nutzen "where" (Windows) bzw. "which" (Unix) um den absoluten Pfad zu
// holen und dann spawnSync ohne shell aufzurufen. Das vermeidet Quoting-
// Probleme bei Argumenten mit Spaces.
function findGhPath() {
  const isWin = process.platform === 'win32';
  try {
    const out = execSync(`${isWin ? 'where' : 'which'} gh`, { encoding: 'utf-8' });
    const firstLine = out.split(/\r?\n/).find((l) => l.trim());
    return firstLine ? firstLine.trim() : null;
  } catch {
    return null;
  }
}

const ghPath = findGhPath();
if (!ghPath) {
  console.error('ERROR: gh CLI not found. Install via "winget install GitHub.cli".');
  process.exit(1);
}

function runGh(args, opts = {}) {
  return spawnSync(ghPath, args, { stdio: 'inherit', ...opts });
}

// Release anlegen falls noch nicht vorhanden — sonst nur Asset hochladen.
const checkRelease = runGh(['release', 'view', tag, '--repo', REPO], { stdio: 'ignore' });
const releaseExists = checkRelease.status === 0;

if (!releaseExists) {
  console.log(`Creating release ${tag}...`);
  const create = runGh([
    'release',
    'create',
    tag,
    '--repo',
    REPO,
    '--title',
    `TV-Rank ${tag}`,
    '--notes',
    `Automatisch erstellter Build von ${tag}.`,
  ]);
  if (create.status !== 0) {
    console.error('ERROR: gh release create failed.');
    process.exit(1);
  }
} else {
  console.log(`Release ${tag} exists — uploading asset (--clobber).`);
}

// Assets hochladen / überschreiben — fehlende werden uebersprungen mit Warnung
const existingAssets = assetPaths.filter((p) => {
  if (fs.existsSync(p)) return true;
  console.warn(`WARN: ${p} not found, skipping.`);
  return false;
});

console.log(`Uploading ${existingAssets.length} asset(s) to ${REPO}@${tag}...`);
const upload = runGh(['release', 'upload', tag, ...existingAssets, '--repo', REPO, '--clobber']);
if (upload.status !== 0) {
  console.error('ERROR: gh release upload failed.');
  process.exit(1);
}

console.log('\nDone! Download links:');
console.log(`  Versioned: https://github.com/${REPO}/releases/download/${tag}/${EXE_NAME}`);
console.log(`  Latest:    https://github.com/${REPO}/releases/latest/download/${EXE_NAME}`);
