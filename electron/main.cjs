const { app, BrowserWindow, shell, ipcMain, session } = require('electron');
const path = require('path');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
try {
  if (require('electron-squirrel-startup')) app.quit();
} catch {
  // electron-squirrel-startup not installed, ignore
}

const APP_URL = 'https://tv-rank.de';
let mainWindow;

function getIconPath() {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'app-icon.ico')
    : path.join(__dirname, '..', 'public', 'app-icon.ico');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 400,
    minHeight: 600,
    icon: getIconPath(),
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#06090f',
      symbolColor: '#cccccc',
      height: 36,
    },
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    backgroundColor: '#06090f',
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // DevTools-Shortcuts manuell registrieren (packaged Electron deaktiviert
  // das Default-Menu, deshalb greifen Ctrl+Shift+I / F12 sonst nicht).
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;
    const isToggleDevtools =
      input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i');
    if (isToggleDevtools) {
      mainWindow.webContents.toggleDevTools();
      event.preventDefault();
    }
  });

  // Open external links in default browser, keep app links in Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith(APP_URL)) return { action: 'allow' };
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.loadURL(APP_URL);
}

// HTTP-Cache beim Start einmalig leeren, damit Electron beim naechsten Launch
// nach einem Frontend-Deploy immer die frische version.json + index.html vom
// Server zieht und nicht aus dem Chromium-Cache veraltet serviert. LocalStorage
// bleibt erhalten (Auth, Settings, Catalog-Daten werden ueber den Version-Check
// des Frontend-Codes invalidiert). Kostet <100ms beim Start.
async function clearStartupCache() {
  try {
    await session.defaultSession.clearCache();
  } catch {
    // ignore — Cache-Clear ist best-effort
  }
}

// IPC handlers for autostart toggle
ipcMain.handle('get-auto-start', () => {
  return app.getLoginItemSettings().openAtLogin;
});
ipcMain.handle('set-auto-start', (_event, enabled) => {
  app.setLoginItemSettings({ openAtLogin: enabled });
  return enabled;
});

app.whenReady().then(async () => {
  await clearStartupCache();
  createWindow();
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
