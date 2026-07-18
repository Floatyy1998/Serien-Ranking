/** Brücke zur Capacitor-Hülle — läuft auch im Browser und muss dort kompletter No-op sein. */

interface CapacitorAppPlugin {
  addListener?: ((
    event: 'backButton',
    handler: (state: { canGoBack: boolean }) => void
  ) => Promise<unknown>) &
    ((event: 'appUrlOpen', handler: (data: { url: string }) => void) => Promise<unknown>);
  minimizeApp?: () => Promise<void>;
  getLaunchUrl?: () => Promise<{ url: string } | undefined>;
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

// Rohes pushState({}) zerstört React Routers history.state.idx (NaN-Kette →
// jeder BackButton fällt auf Home zurück) — Index deshalb selbst weiterführen
const routerNavigate = (path: string): void => {
  const state = window.history.state as { idx?: number } | null;
  const idx = typeof state?.idx === 'number' && Number.isFinite(state.idx) ? state.idx : 0;
  window.history.pushState({ idx: idx + 1 }, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
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
    if (route) routerNavigate(route);
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

  // Deep-Links: Widget/Shortcut (de.tvrank.app://calendar) und App-/Universal-
  // Links (https://tv-rank.de/series/123) → in-App-Route. lastDeepLink dedupet,
  // falls Launch-URL und appUrlOpen fuer denselben Start beide feuern.
  let lastDeepLink = '';
  const openDeepLink = (url: string | undefined): void => {
    if (!url || url === lastDeepLink) return;
    lastDeepLink = url;
    const path = url.replace(/^[a-z0-9.+-]+:\/\//i, '/').replace(/^\/(www\.)?tv-rank\.de/, '');
    if (path.startsWith('/')) routerNavigate(path);
  };
  app?.addListener?.('appUrlOpen', ({ url }: { url: string }) => openDeepLink(url));
  // Kaltstart durch Link: dann gibt es kein appUrlOpen-Event, nur die Launch-URL.
  app
    ?.getLaunchUrl?.()
    .then((r) => openDeepLink(r?.url))
    .catch(() => {});

  initAppShortcuts(cap);

  document.documentElement.classList.add('native-app', `native-${cap.getPlatform?.() ?? ''}`);
};

try {
  initNativeShell();
} catch {
  /* Hülle ohne Bridge — normal im Browser */
}
