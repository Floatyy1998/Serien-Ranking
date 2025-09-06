import ReactDOM from 'react-dom/client';
import { AppWithSplash } from './AppWithSplash';
import './index.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(<AppWithSplash />);
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').then(
      (registration) => {
        // console.log('Service Worker registered with scope:', registration.scope);
        
        // Check for updates less aggressively 
        setInterval(() => {
          registration.update();
        }, 300000); // Check every 5 minutes instead of 1
        
        // Listen for updates - but don't auto-refresh
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available, but don't auto-refresh for PWA
                // console.log('🔄 New version available');
                // Store update availability
                localStorage.setItem('updateAvailable', 'true');
              }
            });
          }
        });
      },
      (_error) => {
        // console.error('Service Worker registration failed:', error);
      }
    );
    
    // Listen for cache update messages
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data.type === 'CACHE_UPDATED') {
        // console.log('🔄 Cache updated to version:', event.data.version);
        // Store update info but don't force refresh
        localStorage.setItem('cacheUpdated', 'true');
        localStorage.setItem('cacheVersion', event.data.version);
      }
    });
  });
}
