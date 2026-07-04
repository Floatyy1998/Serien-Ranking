import { describe, expect, it } from 'vitest';
import { adjustColor } from './colorUtils';

describe('adjustColor', () => {
  it('hellt eine Farbe um den positiven Betrag auf (pro Kanal)', () => {
    expect(adjustColor('#102030', 16)).toBe('#203040');
  });

  it('dunkelt bei negativem Betrag ab', () => {
    expect(adjustColor('#203040', -16)).toBe('#102030');
  });

  it('funktioniert auch ohne führendes #', () => {
    expect(adjustColor('102030', 16)).toBe('#203040');
  });

  it('clamped bei 255 (kein Overflow)', () => {
    expect(adjustColor('#ffffff', 50)).toBe('#ffffff');
    expect(adjustColor('#f0f0f0', 100)).toBe('#ffffff');
  });

  it('clamped bei 0 (kein Underflow)', () => {
    expect(adjustColor('#000000', -50)).toBe('#000000');
    expect(adjustColor('#0a0a0a', -100)).toBe('#000000');
  });

  it('Betrag 0 lässt die Farbe unverändert', () => {
    expect(adjustColor('#3a7bd5', 0)).toBe('#3a7bd5');
  });

  it('gibt immer 6-stellige Hex-Strings zurück (padding)', () => {
    const result = adjustColor('#000000', 1);
    expect(result).toMatch(/^#[0-9a-f]{6}$/);
    expect(result).toBe('#010101');
  });
});
