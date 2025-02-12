import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(<App />);
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').then(
      (registration) => {
        console.log(
          'Service Worker registriert mit Scope:',
          registration.scope
        );
      },
      (error) => {
        console.log('Service Worker Registrierung fehlgeschlagen:', error);
      }
    );
  });
}
