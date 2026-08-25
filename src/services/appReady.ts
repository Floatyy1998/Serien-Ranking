/**
 * Globaler Ready-Tracker fuer den Splashscreen.
 *
 * Bewusst ein eigenes Modul und nicht Teil von AppWithSplash: sowohl der
 * Wrapper als auch der SplashScreen brauchen APP_READY_EVENT, und ein
 * gegenseitiger Import waere ein Zyklus.
 */
declare global {
  interface Window {
    appReadyStatus: {
      theme: boolean;
      auth: boolean;
      firebase: boolean;
      emailVerification: boolean;
      initialData: boolean;
      homeConfig: boolean;
    };
    setAppReady: (key: keyof Window['appReadyStatus'], value: boolean) => void;
    splashScreenComplete: boolean;
  }
}

/** Feuert bei jeder echten Aenderung an appReadyStatus. */
export const APP_READY_EVENT = 'appReadyChange';

export const APP_READY_KEYS = [
  'theme',
  'auth',
  'firebase',
  'emailVerification',
  'initialData',
  'homeConfig',
] as const;

if (typeof window !== 'undefined') {
  window.appReadyStatus = {
    theme: false,
    auth: false,
    firebase: false,
    emailVerification: false,
    initialData: false,
    homeConfig: false,
  };

  // Event statt Polling: der Splash reagiert auf das letzte Flag sofort,
  // statt bis zu einem Intervall-Tick spaeter.
  window.setAppReady = (key, value) => {
    if (window.appReadyStatus[key] === value) return;
    window.appReadyStatus[key] = value;
    if (value && startupTimings[key] === undefined) {
      startupTimings[key] = performance.now();
    }
    window.dispatchEvent(new CustomEvent(APP_READY_EVENT));
    if (isAppReady()) logStartupTimings();
  };

  window.splashScreenComplete = false;
}

/**
 * Start-Messung: wann welches Teilsystem fertig wurde, in ms seit Navigation.
 * Immer erhoben (kostet einen performance.now()-Aufruf pro Flag), ausgegeben
 * nur mit localStorage.debugStartup='1'. Damit laesst sich beantworten, welches
 * Flag den Splash tatsaechlich haelt — statt es zu schaetzen.
 */
export const startupTimings: Partial<Record<(typeof APP_READY_KEYS)[number], number>> = {};

function logStartupTimings(): void {
  try {
    if (localStorage.getItem('debugStartup') !== '1') return;
    const rows = APP_READY_KEYS.map((key) => `${key}=${Math.round(startupTimings[key] ?? -1)}ms`);
    console.warn(`[startup] ${rows.join('  ')}  total=${Math.round(performance.now())}ms`);
  } catch {
    /* Messung darf nie den Start stoeren */
  }
}

/** Anzahl fertiger Teilsysteme (0…APP_READY_KEYS.length). */
export function countAppReady(): number {
  const status = typeof window !== 'undefined' ? window.appReadyStatus : undefined;
  if (!status) return 0;
  return APP_READY_KEYS.filter((key) => status[key]).length;
}

export function isAppReady(): boolean {
  return countAppReady() === APP_READY_KEYS.length;
}
