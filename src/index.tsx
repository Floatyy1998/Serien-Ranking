import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';
import './utils/badgeValidator';
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(<App />);
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').then(
      (registration) => {
        console.log(
          'Service Worker registered with scope:',
          registration.scope
        );
      },
      (error) => {
        console.error('Service Worker registration failed:', error);
      }
    );
  });
}
