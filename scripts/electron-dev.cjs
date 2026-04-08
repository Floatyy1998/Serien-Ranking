const { spawn } = require('child_process');
const http = require('http');

const VITE_URL = 'http://localhost:5173';

function waitForVite() {
  return new Promise((resolve) => {
    const check = () => {
      http
        .get(VITE_URL, () => resolve())
        .on('error', () => setTimeout(check, 500));
    };
    check();
  });
}

async function main() {
  console.log('Waiting for Vite dev server...');
  await waitForVite();
  console.log('Vite is ready, starting Electron...');

  const electron = spawn(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['electron', '.'],
    {
      stdio: 'inherit',
      env: { ...process.env, VITE_DEV_SERVER_URL: VITE_URL },
    }
  );

  electron.on('close', () => process.exit());
}

main();
