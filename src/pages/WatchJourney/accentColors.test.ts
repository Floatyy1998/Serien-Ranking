import { describe, expect, it } from 'vitest';
import { ACCENT_COLORS } from './accentColors';

describe('ACCENT_COLORS', () => {
  it('enthält alle erwarteten Schlüssel', () => {
    expect(Object.keys(ACCENT_COLORS).sort()).toEqual([
      'episodes',
      'fire',
      'movies',
      'time',
      'trending',
    ]);
  });

  it('alle Werte sind gültige Hex-Farben', () => {
    for (const color of Object.values(ACCENT_COLORS)) {
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('die Akzentfarben sind distinkt', () => {
    const values = Object.values(ACCENT_COLORS);
    expect(new Set(values).size).toBe(values.length);
  });
});
