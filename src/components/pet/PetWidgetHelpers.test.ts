import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  getStatusColor,
  isPetHealthy,
  convertPercentToEdge,
  getNavbarHeight,
  calculatePixelPosition,
  calculateEdgeFromPosition,
} from './PetWidgetHelpers';
import type { Pet } from '../../types/pet.types';

const pet = (over: Partial<Pet> = {}): Pet =>
  ({ isAlive: true, hunger: 0, happiness: 100, ...over }) as unknown as Pet;

describe('getStatusColor', () => {
  it('totes Pet → grau', () => {
    expect(getStatusColor(pet({ isAlive: false }))).toBe('#6b7280');
  });

  it('hunger >= 75 → rot', () => {
    expect(getStatusColor(pet({ hunger: 75 }))).toBe('#ef4444');
    expect(getStatusColor(pet({ hunger: 90 }))).toBe('#ef4444');
  });

  it('hunger 70-74 → orange', () => {
    expect(getStatusColor(pet({ hunger: 70 }))).toBe('#f97316');
    expect(getStatusColor(pet({ hunger: 74 }))).toBe('#f97316');
  });

  it('hunger >= 40 oder happiness <= 60 → gelb', () => {
    expect(getStatusColor(pet({ hunger: 40 }))).toBe('#eab308');
    expect(getStatusColor(pet({ hunger: 0, happiness: 60 }))).toBe('#eab308');
  });

  it('gesundes Pet → grün', () => {
    expect(getStatusColor(pet({ hunger: 10, happiness: 90 }))).toBe('#22c55e');
  });
});

describe('isPetHealthy', () => {
  it('lebend + hunger < 50 + happiness > 50 → healthy', () => {
    expect(isPetHealthy(pet({ hunger: 49, happiness: 51 }))).toBe(true);
  });

  it('an den Grenzen nicht healthy', () => {
    expect(isPetHealthy(pet({ hunger: 50, happiness: 51 }))).toBe(false);
    expect(isPetHealthy(pet({ hunger: 49, happiness: 50 }))).toBe(false);
  });

  it('totes Pet ist nie healthy', () => {
    expect(isPetHealthy(pet({ isAlive: false, hunger: 0, happiness: 100 }))).toBe(false);
  });
});

describe('convertPercentToEdge (pure)', () => {
  it('mappt Prozentposition auf die vier Ecken', () => {
    expect(convertPercentToEdge({ xPercent: 10, yPercent: 10 }).edge).toBe('top-left');
    expect(convertPercentToEdge({ xPercent: 90, yPercent: 10 }).edge).toBe('top-right');
    expect(convertPercentToEdge({ xPercent: 10, yPercent: 90 }).edge).toBe('bottom-left');
    expect(convertPercentToEdge({ xPercent: 90, yPercent: 90 }).edge).toBe('bottom-right');
  });

  it('liefert festen Offset von 2', () => {
    const pos = convertPercentToEdge({ xPercent: 25, yPercent: 25 });
    expect(pos.offsetX).toBe(2);
    expect(pos.offsetY).toBe(2);
  });
});

describe('window-abhängige Positionierung', () => {
  beforeAll(() => {
    vi.stubGlobal('window', {
      innerWidth: 1000,
      innerHeight: 800,
      visualViewport: { height: 800 },
    });
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it('getNavbarHeight summiert die Basiswerte', () => {
    // 16 + 32 + 14 + (800 - 800) = 62
    expect(getNavbarHeight()).toBe(62);
  });

  it('calculatePixelPosition: top-left nutzt die Offsets direkt', () => {
    expect(calculatePixelPosition({ edge: 'top-left', offsetX: 5, offsetY: 7 })).toEqual({
      x: 5,
      y: 7,
    });
  });

  it('calculatePixelPosition: top-right spiegelt an der Breite', () => {
    // 1000 - 70 - 2 = 928
    expect(calculatePixelPosition({ edge: 'top-right', offsetX: 2, offsetY: 2 })).toEqual({
      x: 928,
      y: 2,
    });
  });

  it('calculateEdgeFromPosition wählt die nächste Ecke', () => {
    expect(calculateEdgeFromPosition({ x: 0, y: 0 }).edge).toBe('top-left');
    expect(calculateEdgeFromPosition({ x: 930, y: 0 }).edge).toBe('top-right');
  });
});
