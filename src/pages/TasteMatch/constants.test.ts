import { describe, expect, it } from 'vitest';
import {
  ACCENT_COLORS,
  FRIEND_COLOR,
  FRIEND_GRADIENT,
  USER_COLOR,
  USER_GRADIENT,
  getCompatibilityColors,
} from './constants';

describe('Accent-Konstanten', () => {
  it('User-Farbe folgt dem Theme, Friend-Farbe ist gültiger Hex-Wert', () => {
    expect(USER_COLOR).toMatch(/^var\(--theme-primary, #[0-9a-f]{6}\)$/i);
    expect(FRIEND_COLOR).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('Gradients sind linear-gradient CSS-Strings', () => {
    expect(USER_GRADIENT).toContain('linear-gradient');
    expect(FRIEND_GRADIENT).toContain('linear-gradient');
  });

  it('ACCENT_COLORS sind alle gültige Hex-Farben', () => {
    for (const color of Object.values(ACCENT_COLORS)) {
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});

describe('getCompatibilityColors', () => {
  it('>= 80 → grün/cyan', () => {
    expect(getCompatibilityColors(80)).toEqual({ from: '#00cec9', to: '#00b894' });
    expect(getCompatibilityColors(95)).toEqual({ from: '#00cec9', to: '#00b894' });
  });

  it('60–79 → gold', () => {
    expect(getCompatibilityColors(60)).toEqual({ from: '#fdcb6e', to: '#f39c12' });
    expect(getCompatibilityColors(79)).toEqual({ from: '#fdcb6e', to: '#f39c12' });
  });

  it('40–59 → orange/rot', () => {
    expect(getCompatibilityColors(40)).toEqual({ from: '#e17055', to: '#d63031' });
  });

  it('< 40 → grau', () => {
    expect(getCompatibilityColors(39)).toEqual({ from: '#636e72', to: '#2d3436' });
    expect(getCompatibilityColors(0)).toEqual({ from: '#636e72', to: '#2d3436' });
  });

  it('jedes Ergebnis liefert gültige Hex-Farben', () => {
    for (const score of [0, 40, 60, 80, 100]) {
      const { from, to } = getCompatibilityColors(score);
      expect(from).toMatch(/^#[0-9a-f]{6}$/i);
      expect(to).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});
