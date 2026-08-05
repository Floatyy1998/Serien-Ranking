import { describe, expect, it } from 'vitest';
import { buildEnvRows, formatDuration } from './envRows';
import type { ErrorEnvironment } from '../../types/ErrorReport';

const env = (over: Partial<ErrorEnvironment> = {}): ErrorEnvironment =>
  ({
    route: '/home',
    build: '2026-08-05 19:38',
    platform: 'web',
    language: 'de',
    userAgent: 'Mozilla/5.0',
    viewport: '1816x1364@1',
    online: true,
    sessionAgeMs: 77528,
    visibility: 'visible',
    sessionErrorCount: 2,
    ...over,
  }) as ErrorEnvironment;

describe('formatDuration', () => {
  it('zeigt Millisekunden unter einer Sekunde', () => {
    expect(formatDuration(340)).toBe('340 ms');
  });

  it('zeigt Sekunden mit einer Nachkommastelle und Komma', () => {
    expect(formatDuration(6760)).toBe('6,8 s');
  });

  it('zeigt Minuten und Sekunden', () => {
    expect(formatDuration(77528)).toBe('1 min 18 s');
  });

  it('laesst glatte Minuten ohne Sekundenrest', () => {
    expect(formatDuration(120000)).toBe('2 min');
  });

  it('zeigt Stunden', () => {
    expect(formatDuration(3 * 3600 * 1000 + 300000)).toBe('3 h 5 min');
  });

  it('faengt Unsinn ab', () => {
    expect(formatDuration(-1)).toBe('–');
    expect(formatDuration(NaN)).toBe('–');
  });
});

describe('buildEnvRows', () => {
  it('vertraegt fehlende Umgebung', () => {
    expect(buildEnvRows(undefined)).toEqual([]);
  });

  it('beschriftet auf Deutsch statt roher Feldnamen', () => {
    const labels = buildEnvRows(env()).map((r) => r.label);
    expect(labels).toContain('Route');
    expect(labels).toContain('Sitzungsalter');
    expect(labels).not.toContain('sessionAgeMs');
  });

  it('haelt eine feste, sinnvolle Reihenfolge ein', () => {
    const labels = buildEnvRows(env()).map((r) => r.label);
    expect(labels[0]).toBe('Route');
    expect(labels[labels.length - 1]).toBe('User-Agent');
  });

  it('setzt den User-Agent ueber die volle Breite', () => {
    const ua = buildEnvRows(env()).find((r) => r.label === 'User-Agent');
    expect(ua?.wide).toBe(true);
  });

  it('formatiert Werte mit Einheit', () => {
    const rows = buildEnvRows(env({ memoryMb: 81, storageUsedMb: 3574, storageQuotaMb: 13814 }));
    expect(rows.find((r) => r.label === 'Sitzungsalter')?.value).toBe('1 min 18 s');
    expect(rows.find((r) => r.label === 'Heap')?.value).toBe('81 MB');
    expect(rows.find((r) => r.label === 'Speicher')?.value).toBe('3.574 / 13.814 MB');
  });

  it('uebersetzt die Plattform', () => {
    expect(buildEnvRows(env({ platform: 'ios' })).find((r) => r.label === 'Plattform')?.value).toBe(
      'iOS-App'
    );
  });

  it('reicht unbekannte Plattformen durch', () => {
    const value = buildEnvRows(env({ platform: 'watch' as ErrorEnvironment['platform'] })).find(
      (r) => r.label === 'Plattform'
    )?.value;
    expect(value).toBe('watch');
  });

  it('laesst leere Felder weg', () => {
    const labels = buildEnvRows(env()).map((r) => r.label);
    expect(labels).not.toContain('Vorherige Route');
    expect(labels).not.toContain('Verbindung');
    expect(labels).not.toContain('Anzeigegröße');
  });

  it('zeigt Online und Sichtbarkeit als ja/nein', () => {
    const rows = buildEnvRows(env({ online: false, visibility: 'hidden' }));
    expect(rows.find((r) => r.label === 'Online')?.value).toBe('nein');
    expect(rows.find((r) => r.label === 'Sichtbar')?.value).toBe('nein');
  });

  it('zeigt die Anzeigegroesse in Prozent', () => {
    expect(
      buildEnvRows(env({ displayScale: 1.25 })).find((r) => r.label === 'Anzeigegröße')?.value
    ).toBe('125 %');
  });

  it('zeigt Speicher ohne Quota allein', () => {
    expect(
      buildEnvRows(env({ storageUsedMb: 500 })).find((r) => r.label === 'Speicher')?.value
    ).toBe('500 MB');
  });
});
