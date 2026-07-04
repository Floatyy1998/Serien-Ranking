import { describe, expect, it } from 'vitest';
import { MONTH_NAMES, TMDB_IMAGE_BASE, formatDate, formatDateShort } from './serienTabHelpers';

// Hinweis: useSeriesPosters und useTimelineSeries sind React-Hooks (fetch +
// useState/useMemo) und werden hier NICHT getestet — sie benötigen einen
// React-Renderer/jsdom. Getestet werden die reinen Exporte.

describe('Konstanten', () => {
  it('TMDB_IMAGE_BASE zeigt auf w185', () => {
    expect(TMDB_IMAGE_BASE).toBe('https://image.tmdb.org/t/p/w185');
  });

  it('MONTH_NAMES hat 12 deutsche Kurzmonate', () => {
    expect(MONTH_NAMES).toHaveLength(12);
    expect(MONTH_NAMES[0]).toBe('Jan');
    expect(MONTH_NAMES[11]).toBe('Dez');
    expect(new Set(MONTH_NAMES).size).toBe(12);
  });
});

describe('formatDateShort', () => {
  it('formatiert ein Date als "TT. Mon"', () => {
    const out = formatDateShort(new Date(2026, 6, 3));
    expect(out).toContain('03');
    expect(typeof out).toBe('string');
  });
});

describe('formatDate', () => {
  it('parst einen ISO-String und formatiert ihn', () => {
    const out = formatDate('2026-07-03T12:00:00');
    expect(out).toContain('03');
  });
});
