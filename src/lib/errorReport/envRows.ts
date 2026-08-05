/**
 * Übersetzt die Rohfelder eines Fehlerberichts in beschriftete, formatierte
 * Zeilen. Rohe Feldnamen und nackte Millisekunden sind beim Sichten eines
 * Fehlers nicht lesbar — und die Reihenfolge von `Object.entries` ist zufällig.
 */
import type { ErrorEnvironment } from '../../types/ErrorReport';

export interface EnvRow {
  label: string;
  value: string;
  /** Über die volle Breite — für lange Werte wie den User-Agent. */
  wide?: boolean;
}

/** `77528` → `1 min 18 s`, `860` → `0,9 s`. */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '–';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1).replace('.', ',')} s`;
  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);
  if (minutes < 60) return rest ? `${minutes} min ${rest} s` : `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `${hours} h ${minutes % 60} min`;
}

const number = (value: number): string => value.toLocaleString('de-DE');

const PLATFORM_LABEL: Record<string, string> = {
  web: 'Browser',
  pwa: 'PWA (installiert)',
  ios: 'iOS-App',
  android: 'Android-App',
  electron: 'Desktop-App',
};

export function buildEnvRows(env: ErrorEnvironment | undefined): EnvRow[] {
  if (!env || typeof env !== 'object') return [];
  const rows: EnvRow[] = [];
  const push = (label: string, value: string | undefined | null, wide?: boolean) => {
    if (value === undefined || value === null || value === '') return;
    rows.push(wide ? { label, value, wide } : { label, value });
  };

  push('Route', env.route);
  push('Vorherige Route', env.prevRoute);
  push('Build', env.build);
  push('Plattform', PLATFORM_LABEL[env.platform] || env.platform);
  push('Sprache', env.language);
  push('Fenster', env.viewport);
  if (env.displayScale) push('Anzeigegröße', `${Math.round(env.displayScale * 100)} %`);
  push('Verbindung', env.connection);
  push('Online', env.online ? 'ja' : 'nein');
  if (env.memoryMb != null) push('Heap', `${number(env.memoryMb)} MB`);
  if (env.storageUsedMb != null) {
    push(
      'Speicher',
      env.storageQuotaMb != null
        ? `${number(env.storageUsedMb)} / ${number(env.storageQuotaMb)} MB`
        : `${number(env.storageUsedMb)} MB`
    );
  }
  if (env.sessionAgeMs != null) push('Sitzungsalter', formatDuration(env.sessionAgeMs));
  push('Sichtbar', env.visibility === 'hidden' ? 'nein' : 'ja');
  if (env.sessionErrorCount != null) push('Fehler in Sitzung', String(env.sessionErrorCount));
  push('User-Agent', env.userAgent, true);

  return rows;
}
