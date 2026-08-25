// MUSS als allererstes importiert werden — raeumt alte localStorage-Eintraege
// vom alten Catalog-Cache weg, bevor React mountet. Sonst sehen ThemeContext
// und Co. ein volles Quota und loeschen aus Versehen ihre eigenen Eintraege.
import './services/localStorageBootstrap';

import ReactDOM from 'react-dom/client';
import { AppWithSplash } from './AppWithSplash';
import { installErrorReporting } from './services/errorReporting/errorReporter';
import { ensureAllDictionaries } from './services/i18n';
import { APP_READY_EVENT, isAppReady } from './services/appReady';
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

/**
 * Warmstart der beiden Chunks, die auf dem kritischen Pfad des Splashscreens
 * liegen. Ohne das startet ihr Download erst, nachdem React gemountet und das
 * Theme geladen ist — also mehrere hundert ms zu spaet:
 *   - initFirebase: der AuthProvider importiert es dynamisch, und erst danach
 *     koennen die Flags auth/firebase/emailVerification ueberhaupt fallen.
 *   - MobileApp: haelt MainTabs + HomePage statisch, also auch useHomeConfig
 *     mit dem homeConfig-Flag.
 * Fehler sind egal — die echten Imports laufen gleich sowieso und haben ihr
 * eigenes Retry.
 */
function warmCriticalChunks(): void {
  void import('./services/firebase/initFirebase').catch(() => {});
  void import('./MobileApp').catch(() => {});
}

/**
 * Alle uebrigen Woerterbuecher nachladen. Sie werden nur fuer Meldungen an
 * ANDERE Nutzer gebraucht (localizedVariants) — das passiert fruehestens, wenn
 * jemand kommentiert oder schreibt, also lange nach dem Start.
 *
 * Erst NACH dem Startvorgang, nicht per requestIdleCallback allein: waehrend
 * der Splash laeuft ist der Hauptthread oft kurz untaetig, der Idle-Callback
 * feuert dann sofort und ~940 kB Woerterbuecher nehmen dem Firebase-Roundtrip
 * die Bandbreite weg. Genau das hat homeConfig gemessen um ~250 ms verzoegert.
 */
function preloadRemainingDictionaries(): void {
  let started = false;
  const run = () => {
    if (started) return;
    started = true;
    const idle = (window as { requestIdleCallback?: (cb: () => void) => number })
      .requestIdleCallback;
    const load = () => void ensureAllDictionaries();
    if (idle) idle(load);
    else setTimeout(load, 1000);
  };

  if (isAppReady()) {
    run();
    return;
  }
  const onReady = () => {
    if (!isAppReady()) return;
    window.removeEventListener(APP_READY_EVENT, onReady);
    run();
  };
  window.addEventListener(APP_READY_EVENT, onReady);
  // Fallback, falls ein Flag nie faellt — die Woerterbuecher muessen trotzdem kommen.
  setTimeout(run, 15000);
}

// Das Woerterbuch der aktiven Sprache steht hier bereits: services/i18n laedt
// es per Top-Level-await, also noch bevor dieses Modul ausgewertet wird.
root.render(<AppWithSplash />);
warmCriticalChunks();
preloadRemainingDictionaries();
