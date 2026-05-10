const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  getAutoStart: () => ipcRenderer.invoke('get-auto-start'),
  setAutoStart: (enabled) => ipcRenderer.invoke('set-auto-start', enabled),
  // Auto-Update API
  onUpdateStatus: (cb) => {
    const listener = (_event, status) => cb(status);
    ipcRenderer.on('update-status', listener);
    return () => ipcRenderer.removeListener('update-status', listener);
  },
  installUpdate: () => ipcRenderer.invoke('install-update'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
});

// Mark the page as running in Electron and add drag region for window moving.
// left: 100px laesst Platz fuer BackButtons (typisch 90px breit auf top:12-20px),
// rechts werden 138px freigelassen fuer Window-Steuerung (min/max/close).
window.addEventListener('DOMContentLoaded', () => {
  document.documentElement.classList.add('electron');

  const dragBar = document.createElement('div');
  dragBar.style.cssText = `
    position: fixed;
    top: 0;
    left: 100px;
    right: 138px;
    height: 36px;
    z-index: 99999;
    -webkit-app-region: drag;
  `;
  document.body.prepend(dragBar);
});
