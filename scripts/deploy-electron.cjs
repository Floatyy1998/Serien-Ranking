const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const RELEASE_DIR = path.join(__dirname, '..', 'release');
const EXE_NAME = 'TV-Rank-Setup.exe';
const SERVER = 'serien@serienapi.konrad-dinges.de';
const REMOTE_PATH = '/home/serien/downloads';

const exePath = path.join(RELEASE_DIR, EXE_NAME);

if (!fs.existsSync(exePath)) {
  console.error(`ERROR: ${exePath} not found. Run build:electron first.`);
  process.exit(1);
}

// Upload EXE directly
console.log(`Uploading to ${SERVER}:${REMOTE_PATH}/...`);
execSync(`ssh ${SERVER} "mkdir -p ${REMOTE_PATH}"`, { stdio: 'inherit' });
execSync(`scp "${exePath}" ${SERVER}:${REMOTE_PATH}/${EXE_NAME}`, { stdio: 'inherit' });

console.log('\nDone! Download available at:');
console.log(`https://serienapi.konrad-dinges.de/downloads/${EXE_NAME}`);
