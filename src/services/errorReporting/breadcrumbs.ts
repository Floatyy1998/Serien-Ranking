/**
 * Ringpuffer der letzten Nutzer- und Netzwerkereignisse. Er beantwortet beim
 * Sichten eines Fehlers die eigentlich wichtige Frage: was ist unmittelbar
 * davor passiert. Enthält bewusst nur Struktur (Pfade, Selektoren, Status),
 * keinen Text aus dem DOM.
 */
import { redactUrl, selectorFor, truncate } from '../../lib/errorReport/redact';
import type { BreadcrumbType, ErrorBreadcrumb } from '../../types/ErrorReport';

const MAX_BREADCRUMBS = 25;

const startedAt = Date.now();
let buffer: ErrorBreadcrumb[] = [];
let currentRoute = '';
let previousRoute = '';
let installed = false;
let insideConsoleHook = false;

export const sessionAgeMs = (): number => Date.now() - startedAt;

export const getBreadcrumbs = (): ErrorBreadcrumb[] => buffer.slice();

export const getRoutes = (): { route: string; prevRoute: string } => ({
  route: currentRoute || redactUrl(location.pathname + location.search),
  prevRoute: previousRoute,
});

/** Nur für Tests — der Puffer ist sonst bewusst prozessweit. */
export const resetBreadcrumbs = (): void => {
  buffer = [];
  currentRoute = '';
  previousRoute = '';
};

export function addBreadcrumb(type: BreadcrumbType, label: string, detail?: string): void {
  buffer.push({
    t: sessionAgeMs(),
    type,
    label: truncate(label, 160),
    ...(detail ? { detail: truncate(detail, 120) } : {}),
  });
  if (buffer.length > MAX_BREADCRUMBS) buffer = buffer.slice(-MAX_BREADCRUMBS);
}

function trackRoute(): void {
  const next = redactUrl(location.pathname + location.search);
  if (next === currentRoute) return;
  previousRoute = currentRoute;
  currentRoute = next;
  addBreadcrumb('route', next);
}

function installHistoryHook(): void {
  const patch = (method: 'pushState' | 'replaceState') => {
    const original = history[method];
    history[method] = function patched(this: History, ...args: Parameters<History['pushState']>) {
      const result = original.apply(this, args);
      trackRoute();
      return result;
    };
  };
  patch('pushState');
  patch('replaceState');
  window.addEventListener('popstate', trackRoute);
}

function installFetchHook(): void {
  if (typeof window.fetch !== 'function') return;
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url =
      typeof input === 'string' ? input : input instanceof URL ? input.href : input?.url || '';
    try {
      const response = await originalFetch(input, init);
      if (!response.ok) addBreadcrumb('fetch', redactUrl(url), String(response.status));
      return response;
    } catch (err) {
      addBreadcrumb('fetch', redactUrl(url), err instanceof Error ? err.name : 'network');
      throw err;
    }
  };
}

function installConsoleHook(): void {
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    if (!insideConsoleHook) {
      insideConsoleHook = true;
      try {
        const first = args[0];
        const text = first instanceof Error ? `${first.name}: ${first.message}` : String(first);
        addBreadcrumb('console', truncate(text, 160));
      } catch {
        // Breadcrumbs duerfen nie die eigentliche Ausgabe verhindern
      }
      insideConsoleHook = false;
    }
    originalError.apply(console, args);
  };
}

export function installBreadcrumbs(): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  trackRoute();
  installHistoryHook();
  installFetchHook();
  installConsoleHook();

  document.addEventListener(
    'click',
    (event) => {
      const target = event.target as Element | null;
      const selector = selectorFor(target?.closest?.('button, a, [role="button"]') || target);
      if (selector) addBreadcrumb('click', selector);
    },
    true
  );

  document.addEventListener('visibilitychange', () => {
    addBreadcrumb('visibility', document.visibilityState);
  });
}
