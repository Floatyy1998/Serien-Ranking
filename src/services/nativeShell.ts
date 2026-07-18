/** Brücke zur Capacitor-Hülle — läuft auch im Browser und muss dort kompletter No-op sein. */

interface CapacitorAppPlugin {
  addListener?: (
    event: 'backButton',
    handler: (state: { canGoBack: boolean }) => void
  ) => Promise<unknown>;
  minimizeApp?: () => Promise<void>;
}

interface CapacitorGlobal {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
  Plugins?: { App?: CapacitorAppPlugin };
}

const getCapacitor = (): CapacitorGlobal | null => {
  if (typeof window === 'undefined') return null;
  const cap = (window as { Capacitor?: CapacitorGlobal }).Capacitor;
  return cap?.isNativePlatform?.() ? cap : null;
};

/** True, wenn die App gerade in der nativen iOS/Android-Hülle läuft. */
export const isNativeApp = (): boolean => getCapacitor() !== null;

const initNativeShell = (): void => {
  const cap = getCapacitor();
  if (!cap) return;

  // Android-Hardware-Back: History zurück; auf der Startseite App minimieren.
  const app = cap.Plugins?.App;
  app?.addListener?.('backButton', ({ canGoBack }) => {
    if (canGoBack && window.location.pathname !== '/') {
      window.history.back();
    } else {
      app.minimizeApp?.().catch(() => {});
    }
  });

  document.documentElement.classList.add('native-app', `native-${cap.getPlatform?.() ?? ''}`);
};

try {
  initNativeShell();
} catch {
  /* Hülle ohne Bridge — normal im Browser */
}
