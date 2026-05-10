const { app, BrowserWindow, shell, ipcMain, session, screen } = require('electron');
const path = require('path');
const fs = require('fs');

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

// ─── Window-State-Persistence ──────────────────────────────
// Speichert Position, Groesse und Maximize-Status zwischen App-Starts.
// Datei liegt in userData (z.B. %APPDATA%/<App>/window-state.json) und
// wird bei resize/move (throttled) sowie close geschrieben — letzteres
// als Sicherheitsnetz fuer Crashes.

const WINDOW_STATE_FILE = () => path.join(app.getPath('userData'), 'window-state.json');
const DEFAULT_BOUNDS = { width: 1280, height: 800 };

function loadWindowState() {
  try {
    const raw = fs.readFileSync(WINDOW_STATE_FILE(), 'utf-8');
    const state = JSON.parse(raw);
    if (
      typeof state.width !== 'number' ||
      typeof state.height !== 'number' ||
      state.width < 400 ||
      state.height < 600
    ) {
      return null;
    }
    return state;
  } catch {
    return null;
  }
}

function saveWindowState() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  try {
    const isMaximized = mainWindow.isMaximized();
    // getNormalBounds liefert die Bounds vor Maximize, sonst beim
    // Wiederherstellen liegt das Fenster zwar nicht-maximiert vor, aber
    // mit Bildschirmgroesse — und User kommt nicht ans normale Layout.
    const bounds = isMaximized ? mainWindow.getNormalBounds() : mainWindow.getBounds();
    const state = {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      isMaximized,
    };
    fs.writeFileSync(WINDOW_STATE_FILE(), JSON.stringify(state));
  } catch {
    // best-effort
  }
}

// Pruefen ob die gespeicherte Position noch auf einem aktuell verbundenen
// Display liegt — sonst startet das Fenster auf einem unsichtbaren Monitor,
// wenn der User den Bildschirm-Setup geaendert hat.
function isWithinDisplayBounds(state) {
  if (typeof state.x !== 'number' || typeof state.y !== 'number') return false;
  const displays = screen.getAllDisplays();
  return displays.some((d) => {
    const b = d.workArea;
    return (
      state.x >= b.x &&
      state.y >= b.y &&
      state.x + state.width <= b.x + b.width &&
      state.y + state.height <= b.y + b.height
    );
  });
}

let saveTimer = null;
function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(saveWindowState, 500);
}

function createWindow() {
  const savedState = loadWindowState();
  const bounds =
    savedState && isWithinDisplayBounds(savedState)
      ? { x: savedState.x, y: savedState.y, width: savedState.width, height: savedState.height }
      : DEFAULT_BOUNDS;

  mainWindow = new BrowserWindow({
    ...bounds,
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

  if (savedState?.isMaximized) {
    mainWindow.maximize();
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('resize', scheduleSave);
  mainWindow.on('move', scheduleSave);
  mainWindow.on('maximize', scheduleSave);
  mainWindow.on('unmaximize', scheduleSave);
  mainWindow.on('close', saveWindowState);

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
