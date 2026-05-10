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

// gh check
try {
  execSync('gh --version', { stdio: 'ignore' });
} catch {
  console.error('ERROR: gh CLI not found. Install via "winget install GitHub.cli".');
  process.exit(1);
}

// Release anlegen falls noch nicht vorhanden — sonst nur Asset hochladen.
const checkRelease = spawnSync('gh', ['release', 'view', tag, '--repo', REPO], {
  stdio: 'ignore',
});
const releaseExists = checkRelease.status === 0;

if (!releaseExists) {
  console.log(`Creating release ${tag}...`);
  const create = spawnSync(
    'gh',
    [
      'release',
      'create',
      tag,
      '--repo',
      REPO,
      '--title',
      `TV-Rank ${tag}`,
      '--notes',
      `Automatisch erstellter Build von ${tag}.`,
    ],
    { stdio: 'inherit' }
  );
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
const upload = spawnSync(
  'gh',
  ['release', 'upload', tag, ...existingAssets, '--repo', REPO, '--clobber'],
  { stdio: 'inherit' }
);
if (upload.status !== 0) {
  console.error('ERROR: gh release upload failed.');
  process.exit(1);
}

console.log('\nDone! Download links:');
console.log(`  Versioned: https://github.com/${REPO}/releases/download/${tag}/${EXE_NAME}`);
console.log(`  Latest:    https://github.com/${REPO}/releases/latest/download/${EXE_NAME}`);
