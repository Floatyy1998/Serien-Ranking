// MUSS als allererstes importiert werden — raeumt alte localStorage-Eintraege
// vom alten Catalog-Cache weg, bevor React mountet. Sonst sehen ThemeContext
// und Co. ein volles Quota und loeschen aus Versehen ihre eigenen Eintraege.
import './lib/localStorageBootstrap';

import ReactDOM from 'react-dom/client';
import { AppWithSplash } from './AppWithSplash';
import './index.css';

// Service Worker Manager — sofort importieren damit SW beim App-Start registriert wird
import './services/serviceWorkerManager';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<AppWithSplash />);
