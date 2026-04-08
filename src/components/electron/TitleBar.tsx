import { useEffect } from 'react';

declare global {
  interface Window {
    electronAPI?: { isElectron: boolean };
  }
}

export const TitleBar = () => {
  useEffect(() => {
    if (window.electronAPI?.isElectron) {
      document.documentElement.classList.add('electron');
    }
  }, []);

  if (!window.electronAPI?.isElectron) return null;

  // Invisible drag region for moving the window (native controls are handled by titleBarOverlay)
  return (
    <div
      style={
        {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 138, // Leave space for native window controls (~3 buttons × 46px)
          height: '36px',
          zIndex: 99999,
          WebkitAppRegion: 'drag',
        } as React.CSSProperties
      }
    />
  );
};
