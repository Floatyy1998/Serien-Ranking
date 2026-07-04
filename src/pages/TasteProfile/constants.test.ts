import { describe, expect, it } from 'vitest';
import { CONFIDENCE_COLORS } from './constants';

describe('CONFIDENCE_COLORS', () => {
  it('definiert high und medium', () => {
    expect(CONFIDENCE_COLORS.high).toBe('#00b894');
    expect(CONFIDENCE_COLORS.medium).toBe('#fdcb6e');
  });

  it('alle Werte sind gültige Hex-Farben', () => {
    for (const color of Object.values(CONFIDENCE_COLORS)) {
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});
