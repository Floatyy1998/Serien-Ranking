/**
 * Umgebungsdaten zum Zeitpunkt eines Fehlers. Der Anspruch ist, dass ein
 * Bericht ohne Rückfrage beim Nutzer auswertbar ist: Route, Build, Plattform,
 * Fenstergröße, Verbindung, Speicherlage.
 */
import { getDisplayScale } from '../displayScale';
import { appLocale } from '../i18n';
import { getRoutes, sessionAgeMs } from './breadcrumbs';
import type { ErrorEnvironment, ErrorPlatform } from '../../types/ErrorReport';

interface NetworkInformation {
  effectiveType?: string;
  downlink?: number;
  saveData?: boolean;
}

let storageUsedMb: number | undefined;
let storageQuotaMb: number | undefined;

/** Speicherschätzung ist asynchron — einmal beim Start holen und cachen. */
export async function primeErrorContext(): Promise<void> {
  try {
    const estimate = await navigator.storage?.estimate?.();
    if (!estimate) return;
    if (typeof estimate.usage === 'number') storageUsedMb = Math.round(estimate.usage / 1048576);
    if (typeof estimate.quota === 'number') storageQuotaMb = Math.round(estimate.quota / 1048576);
  } catch {
    // Ohne Storage-API bleibt das Feld leer
  }
}

function detectPlatform(): ErrorPlatform {
  const root = document.documentElement.classList;
  if (root.contains('native-ios')) return 'ios';
  if (root.contains('native-android')) return 'android';
  if (root.contains('electron')) return 'electron';
  const standalone =
    window.matchMedia?.('(display-mode: standalone)')?.matches ||
    (navigator as { standalone?: boolean }).standalone === true;
  return standalone ? 'pwa' : 'web';
}

function describeConnection(): string | undefined {
  const conn = (navigator as { connection?: NetworkInformation }).connection;
  if (!conn) return undefined;
  const parts = [conn.effectiveType || '?'];
  if (typeof conn.downlink === 'number') parts.push(`down=${conn.downlink}`);
  if (conn.saveData) parts.push('saveData');
  return parts.join(' ');
}

function usedHeapMb(): number | undefined {
  const memory = (performance as { memory?: { usedJSHeapSize?: number } }).memory;
  const used = memory?.usedJSHeapSize;
  return typeof used === 'number' ? Math.round(used / 1048576) : undefined;
}

export function collectEnvironment(sessionErrorCount: number): ErrorEnvironment {
  const { route, prevRoute } = getRoutes();
  const scale = getDisplayScale();
  const connection = describeConnection();
  const memoryMb = usedHeapMb();

  return {
    route,
    ...(prevRoute ? { prevRoute } : {}),
    build: __APP_BUILD__,
    platform: detectPlatform(),
    language: appLocale,
    userAgent: navigator.userAgent.slice(0, 300),
    viewport: `${window.innerWidth}x${window.innerHeight}@${window.devicePixelRatio || 1}`,
    ...(scale && scale !== 1 ? { displayScale: scale } : {}),
    online: navigator.onLine !== false,
    ...(connection ? { connection } : {}),
    ...(memoryMb != null ? { memoryMb } : {}),
    ...(storageUsedMb != null ? { storageUsedMb } : {}),
    ...(storageQuotaMb != null ? { storageQuotaMb } : {}),
    sessionAgeMs: sessionAgeMs(),
    visibility: document.visibilityState === 'hidden' ? 'hidden' : 'visible',
    sessionErrorCount,
  };
}
