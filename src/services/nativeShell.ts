/** Brücke zur Capacitor-Hülle — läuft auch im Browser und muss dort kompletter No-op sein. */

interface CapacitorAppPlugin {
  addListener?: (
    event: 'backButton',
    handler: (state: { canGoBack: boolean }) => void
  ) => Promise<unknown>;
  minimizeApp?: () => Promise<void>;
}

interface CapacitorBadgePlugin {
  set?: (options: { count: number }) => Promise<void>;
  clear?: () => Promise<void>;
}

interface CapacitorAppShortcutsPlugin {
  set?: (options: { shortcuts: { id: string; title: string }[] }) => Promise<void>;
  addListener?: (
    event: 'click',
    handler: (payload: { shortcutId: string }) => void
  ) => Promise<unknown>;
}

interface CapacitorWidgetBridgePlugin {
  setData?: (options: { json: string }) => Promise<void>;
}

interface CapacitorGlobal {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
  Plugins?: {
    App?: CapacitorAppPlugin;
    Badge?: CapacitorBadgePlugin;
    AppShortcuts?: CapacitorAppShortcutsPlugin;
    WidgetBridge?: CapacitorWidgetBridgePlugin;
  };
}

const getCapacitor = (): CapacitorGlobal | null => {
  if (typeof window === 'undefined') return null;
  const cap = (window as { Capacitor?: CapacitorGlobal }).Capacitor;
  return cap?.isNativePlatform?.() ? cap : null;
};

/** True, wenn die App gerade in der nativen iOS/Android-Hülle läuft. */
export const isNativeApp = (): boolean => getCapacitor() !== null;

/** App-Icon-Badge setzen — nativ via Badge-Plugin, im Browser via Badging API (installierte PWA). */
export const setAppBadge = (count: number): void => {
  const badge = getCapacitor()?.Plugins?.Badge;
  if (badge?.set) {
    if (count > 0) badge.set({ count }).catch(() => {});
    else badge.clear?.().catch(() => {});
    return;
  }
  try {
    const nav = navigator as Navigator & {
      setAppBadge?: (count: number) => Promise<void>;
      clearAppBadge?: () => Promise<void>;
    };
    if (count > 0) nav.setAppBadge?.(count)?.catch(() => {});
    else nav.clearAppBadge?.()?.catch(() => {});
  } catch {
    /* Badging API nicht verfügbar */
  }
};

/** Spiegelt die Widget-Daten (heutige Folgen + Countdown) in die native Hülle. */
export const setWidgetData = (data: unknown): void => {
  const bridge = getCapacitor()?.Plugins?.WidgetBridge;
  if (!bridge?.setData) return;
  try {
    bridge.setData({ json: JSON.stringify(data) }).catch(() => {});
  } catch {
    /* Hülle ohne WidgetBridge (alter Build) */
  }
};

const SHORTCUT_ROUTES: Record<string, string> = {
  'watch-next': '/watchlist',
  search: '/search',
  calendar: '/calendar',
};

const initAppShortcuts = (cap: CapacitorGlobal): void => {
  const shortcuts = cap.Plugins?.AppShortcuts;
  if (!shortcuts?.set) return;
  shortcuts
    .set({
      shortcuts: [
        { id: 'watch-next', title: 'Weiter schauen' },
        { id: 'search', title: 'Suche' },
        { id: 'calendar', title: 'Kalender' },
      ],
    })
    .catch(() => {});
  shortcuts.addListener?.('click', ({ shortcutId }) => {
    const route = SHORTCUT_ROUTES[shortcutId];
    if (!route) return;
    window.history.pushState({}, '', route);
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
};

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

  initAppShortcuts(cap);

  document.documentElement.classList.add('native-app', `native-${cap.getPlatform?.() ?? ''}`);
};

try {
  initNativeShell();
} catch {
  /* Hülle ohne Bridge — normal im Browser */
}
