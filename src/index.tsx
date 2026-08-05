// MUSS als allererstes importiert werden — raeumt alte localStorage-Eintraege
// vom alten Catalog-Cache weg, bevor React mountet. Sonst sehen ThemeContext
// und Co. ein volles Quota und loeschen aus Versehen ihre eigenen Eintraege.
import './services/localStorageBootstrap';

import ReactDOM from 'react-dom/client';
import { AppWithSplash } from './AppWithSplash';
import { installErrorReporting } from './services/errorReporting/errorReporter';
import './index.css';
// Die Anzeigegröße (zoom) wird in AppWithSplash gesetzt — erst NACHDEM der
// Splash verschwunden ist, damit der Splash nie mitskaliert.

// Service Worker Manager — sofort importieren damit SW beim App-Start registriert wird
import './services/serviceWorkerManager';

// Native Capacitor-Hülle (iOS/Android): Back-Button etc.; im Browser No-op
import './services/nativeShell';

// Vor dem Rendern installieren, damit auch Fehler beim Bootstrap erfasst
// werden. Geschrieben wird erst, sobald der Nutzer feststeht (authProvider).
installErrorReporting();

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<AppWithSplash />);
