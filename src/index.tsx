import ReactDOM from 'react-dom/client';
import { AppWithSplash } from './AppWithSplash';
import './index.css';

// Service Worker Manager — sofort importieren damit SW beim App-Start registriert wird
import './services/serviceWorkerManager';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<AppWithSplash />);
