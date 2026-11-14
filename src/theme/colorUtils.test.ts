// Tests für die neuen Theme-Kontrast-Guards in colorUtils:
// Primary-Lesbarkeits-Guard (ensurePrimaryReadability) und
// Glass-Schutz-Klemme (clampBackgroundForGlass) inkl. Verdrahtung
// in normalizeThemeColors. Nur Rendering-Normalisierung – gespeicherte
// Configs bleiben unangetastet.
import { describe, expect, it } from 'vitest';
import {
  ensurePrimaryReadability,
  getContrastRatio,
  getRelativeLuminance,
  normalizeThemeColors,
} from './colorUtils';

describe('getRelativeLuminance / getContrastRatio (Basis der Guards)', () => {
  it('Kontrastverhältnis Schwarz↔Weiß ist 21:1', () => {
    expect(getContrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
  });
});

describe('ensurePrimaryReadability (Primary-Lesbarkeits-Guard)', () => {
  it('lässt eine bereits gut lesbare Primärfarbe unverändert (Idempotenz)', () => {
    // Default-Palette: Grün auf Schwarz hat weit über 3:1 Kontrast
    expect(getContrastRatio('#00d123', '#000000')).toBeGreaterThanOrEqual(3);
    expect(ensurePrimaryReadability('#00d123', '#000000')).toBe('#00d123');
  });

  it('hellt eine zu dunkle Primärfarbe auf dunklem Hintergrund auf, bis ≥3:1', () => {
    const fixed = ensurePrimaryReadability('#0a1f0d', '#000000');
    expect(fixed).not.toBe('#0a1f0d');
    expect(getContrastRatio(fixed, '#000000')).toBeGreaterThanOrEqual(3);
    // Aufhellen, nicht abdunkeln
    expect(getRelativeLuminance(fixed)).toBeGreaterThan(getRelativeLuminance('#0a1f0d'));
  });

  it('dunkelt eine zu helle Primärfarbe auf hellem Hintergrund ab, bis ≥3:1', () => {
    const fixed = ensurePrimaryReadability('#f0f0f0', '#ffffff');
    expect(getContrastRatio(fixed, '#ffffff')).toBeGreaterThanOrEqual(3);
    // Abdunkeln, nicht aufhellen
    expect(getRelativeLuminance(fixed)).toBeLessThan(getRelativeLuminance('#f0f0f0'));
  });

  it('ist idempotent: erneuter Aufruf ändert nichts mehr', () => {
    const once = ensurePrimaryReadability('#0a1f0d', '#000000');
    const twice = ensurePrimaryReadability(once, '#000000');
    expect(twice).toBe(once);
  });
});

describe('normalizeThemeColors (Verdrahtung der Guards)', () => {
  it('gute Kombi (Default Grün/Schwarz) bleibt unverändert', () => {
    const result = normalizeThemeColors({
      primaryColor: '#00d123',
      backgroundColor: '#000000',
    });
    expect(result.primaryColor).toBe('#00d123');
    expect(result.backgroundColor).toBe('#000000');
  });

  it('garantiert nach Normalisierung ≥3:1 Kontrast Primary↔Background', () => {
    const result = normalizeThemeColors({
      primaryColor: '#0a1f0d', // fast unsichtbar auf Schwarz
      backgroundColor: '#000000',
    });
    expect(getContrastRatio(result.primaryColor, result.backgroundColor)).toBeGreaterThanOrEqual(3);
  });

  it('lässt einen hellen Hintergrund hell und mutiert die Config nicht', () => {
    const config = { primaryColor: '#00d123', backgroundColor: '#ffffff' };
    const result = normalizeThemeColors(config);
    expect(result.backgroundColor).toBe('#ffffff');
    expect(config.backgroundColor).toBe('#ffffff');
    expect(config.primaryColor).toBe('#00d123');
  });

  it('ersetzt praktisch unsichtbaren Text durch eine lesbare Farbe', () => {
    const result = normalizeThemeColors({
      primaryColor: '#b0124a',
      backgroundColor: '#ffffff',
      textColor: '#f1e8ee',
    });
    expect(getContrastRatio(result.textColor as string, '#ffffff')).toBeGreaterThanOrEqual(4.5);
  });

  it('lässt lesbaren Text unangetastet', () => {
    const result = normalizeThemeColors({
      primaryColor: '#b0124a',
      backgroundColor: '#ffffff',
      textColor: '#221a24',
    });
    expect(result.textColor).toBe('#221a24');
  });

  it('ist idempotent: zweite Normalisierung ändert nichts mehr', () => {
    const first = normalizeThemeColors({
      primaryColor: '#0a1f0d',
      backgroundColor: '#e8e8e8',
    });
    const second = normalizeThemeColors({
      primaryColor: first.primaryColor,
      backgroundColor: first.backgroundColor,
    });
    expect(second.primaryColor).toBe(first.primaryColor);
    expect(second.backgroundColor).toBe(first.backgroundColor);
  });
});
