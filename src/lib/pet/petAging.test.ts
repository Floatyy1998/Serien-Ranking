import { describe, expect, it } from 'vitest';
import { agePetVitals, type PetAgingRules } from './petAging';

const HOUR = 60 * 60 * 1000;
const RULES: PetAgingRules = {
  stepHours: 3,
  hungerPerStep: 2,
  happinessLossPerStep: 1,
  highHungerThreshold: 80,
  highHungerHappinessPenalty: 1,
};

describe('agePetVitals', () => {
  it('zaehlt nur ganze Schritte und meldet die verbrauchte Zeit', () => {
    const r = agePetVitals({ hunger: 10, happiness: 90 }, 7 * HOUR, RULES);
    expect(r).toEqual({ hunger: 14, happiness: 88, steps: 2, consumedMs: 6 * HOUR });
  });

  it('keine oder negative Zeit → unveraendert', () => {
    expect(agePetVitals({ hunger: 10, happiness: 90 }, -HOUR, RULES).steps).toBe(0);
    expect(agePetVitals({ hunger: 10, happiness: 90 }, Number.NaN, RULES).steps).toBe(0);
  });

  it('ueber der Hunger-Schwelle sinkt die Laune je Schritt doppelt', () => {
    const r = agePetVitals({ hunger: 80, happiness: 50 }, 6 * HOUR, RULES);
    expect(r.hunger).toBe(84);
    expect(r.happiness).toBe(46);
  });

  it('bleibt im Band 0..100 und hoert beim Tod auf zu rechnen', () => {
    const r = agePetVitals({ hunger: 0, happiness: 100 }, 365 * 24 * HOUR, RULES);
    expect(r.hunger).toBe(100);
    expect(r.happiness).toBeGreaterThanOrEqual(0);
  });
});
