const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const RELEASE_DIR = path.join(__dirname, '..', 'release');
const EXE_NAME = 'TV-Rank-Setup.exe';
const ZIP_NAME = 'TV-Rank-Setup.zip';
const SERVER = 'serien@serienapi.konrad-dinges.de';
const REMOTE_PATH = '/home/serien/downloads';

const exePath = path.join(RELEASE_DIR, EXE_NAME);
const zipPath = path.join(RELEASE_DIR, ZIP_NAME);

if (!fs.existsSync(exePath)) {
  console.error(`ERROR: ${exePath} not found. Run build:electron first.`);
  process.exit(1);
}

// Zip the EXE
console.log('Zipping release...');
// Remove old zip if exists
if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
execSync(`powershell Compress-Archive -Path "${exePath}" -DestinationPath "${zipPath}"`, {
  stdio: 'inherit',
});
console.log(`Created: ${zipPath}`);

// Create remote directory and upload
console.log(`Uploading to ${SERVER}:${REMOTE_PATH}/...`);
execSync(`ssh ${SERVER} "mkdir -p ${REMOTE_PATH}"`, { stdio: 'inherit' });
execSync(`scp "${zipPath}" ${SERVER}:${REMOTE_PATH}/${ZIP_NAME}`, { stdio: 'inherit' });

console.log('\nDone! Download available at:');
console.log(`https://serienapi.konrad-dinges.de/downloads/${ZIP_NAME}`);
