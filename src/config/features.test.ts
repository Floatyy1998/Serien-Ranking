import { describe, expect, it } from 'vitest';
import FEATURES, { FEATURES as NamedFeatures } from './features';

describe('config/features', () => {
  it('Default-Export und Named-Export sind identisch', () => {
    expect(FEATURES).toBe(NamedFeatures);
  });

  it('WRAPPED_ENABLED ist ein Boolean', () => {
    expect(typeof FEATURES.WRAPPED_ENABLED).toBe('boolean');
  });

  it('WRAPPED_YEAR ist ein plausibles Jahr', () => {
    expect(Number.isInteger(FEATURES.WRAPPED_YEAR)).toBe(true);
    expect(FEATURES.WRAPPED_YEAR).toBeGreaterThanOrEqual(2024);
    expect(FEATURES.WRAPPED_YEAR).toBeLessThan(2100);
  });
});
