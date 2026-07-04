import { describe, expect, it } from 'vitest';
import {
  SEASON_BREAK_GAP_DAYS,
  ONE_DAY_MS,
  SEVEN_DAYS_MS,
  HOME_CAROUSEL_MAX_ITEMS,
  PRIORITY_PROVIDER_IDS,
} from './constants';

describe('episode/constants', () => {
  it('SEASON_BREAK_GAP_DAYS ist 28', () => {
    expect(SEASON_BREAK_GAP_DAYS).toBe(28);
  });

  it('ONE_DAY_MS entspricht 24h in Millisekunden', () => {
    expect(ONE_DAY_MS).toBe(24 * 60 * 60 * 1000);
    expect(ONE_DAY_MS).toBe(86_400_000);
  });

  it('SEVEN_DAYS_MS ist genau 7 Tage', () => {
    expect(SEVEN_DAYS_MS).toBe(7 * ONE_DAY_MS);
  });

  it('HOME_CAROUSEL_MAX_ITEMS ist eine positive Ganzzahl', () => {
    expect(HOME_CAROUSEL_MAX_ITEMS).toBe(10);
    expect(Number.isInteger(HOME_CAROUSEL_MAX_ITEMS)).toBe(true);
  });

  it('PRIORITY_PROVIDER_IDS priorisiert Crunchyroll (283) vor ADN (415)', () => {
    expect(PRIORITY_PROVIDER_IDS[283]).toBe(0);
    expect(PRIORITY_PROVIDER_IDS[415]).toBe(1);
    expect(PRIORITY_PROVIDER_IDS[283]).toBeLessThan(PRIORITY_PROVIDER_IDS[415]);
    expect(PRIORITY_PROVIDER_IDS[999]).toBeUndefined();
  });
});
