const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  getAutoStart: () => ipcRenderer.invoke('get-auto-start'),
  setAutoStart: (enabled) => ipcRenderer.invoke('set-auto-start', enabled),
});

// Mark the page as running in Electron and add drag region for window moving
window.addEventListener('DOMContentLoaded', () => {
  document.documentElement.classList.add('electron');

  const dragBar = document.createElement('div');
  dragBar.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 138px;
    height: 36px;
    z-index: 99999;
    -webkit-app-region: drag;
  `;
  document.body.prepend(dragBar);
});
