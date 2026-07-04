import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatRelativeTime, extractImageUrls } from './utils';

describe('formatRelativeTime', () => {
  const NOW = new Date('2025-06-15T12:00:00Z').getTime();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('< 1 Minute → "gerade eben"', () => {
    expect(formatRelativeTime(NOW - 30 * 1000)).toBe('gerade eben');
    expect(formatRelativeTime(NOW)).toBe('gerade eben');
  });

  it('Minuten', () => {
    expect(formatRelativeTime(NOW - 5 * 60 * 1000)).toBe('vor 5 Min.');
    expect(formatRelativeTime(NOW - 59 * 60 * 1000)).toBe('vor 59 Min.');
  });

  it('Stunden', () => {
    expect(formatRelativeTime(NOW - 3 * 60 * 60 * 1000)).toBe('vor 3 Std.');
    expect(formatRelativeTime(NOW - 23 * 60 * 60 * 1000)).toBe('vor 23 Std.');
  });

  it('Tage (< 7)', () => {
    expect(formatRelativeTime(NOW - 2 * 24 * 60 * 60 * 1000)).toBe('vor 2 Tagen');
    expect(formatRelativeTime(NOW - 6 * 24 * 60 * 60 * 1000)).toBe('vor 6 Tagen');
  });

  it('>= 7 Tage → deutsches Datum', () => {
    const old = NOW - 10 * 24 * 60 * 60 * 1000;
    expect(formatRelativeTime(old)).toBe(new Date(old).toLocaleDateString('de-DE'));
  });
});

describe('extractImageUrls', () => {
  it('extrahiert Bild-URLs und entfernt sie aus dem Text', () => {
    const result = extractImageUrls('Schau mal https://example.com/pic.jpg cool');
    expect(result.images).toEqual(['https://example.com/pic.jpg']);
    expect(result.text).toBe('Schau mal  cool');
  });

  it('unterstützt mehrere Formate und Query-Strings', () => {
    const result = extractImageUrls(
      'https://a.com/1.png https://b.com/2.webp?x=1 https://c.com/3.gif'
    );
    expect(result.images).toEqual([
      'https://a.com/1.png',
      'https://b.com/2.webp?x=1',
      'https://c.com/3.gif',
    ]);
  });

  it('ohne Bilder → leeres Array und getrimmter Text', () => {
    const result = extractImageUrls('  nur text  ');
    expect(result.images).toEqual([]);
    expect(result.text).toBe('nur text');
  });

  it('ignoriert Nicht-Bild-URLs', () => {
    const result = extractImageUrls('siehe https://example.com/page');
    expect(result.images).toEqual([]);
    expect(result.text).toBe('siehe https://example.com/page');
  });
});
