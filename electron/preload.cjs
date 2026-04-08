// Mark the page as running in Electron and add drag region for window moving
window.addEventListener('DOMContentLoaded', () => {
  document.documentElement.classList.add('electron');

  // Add invisible drag region at the top for moving the window
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
