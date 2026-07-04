import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getShieldCooldown, getStreakStatus } from './watchStreakHelpers';

// PET_CONFIG: STREAK_SHIELD_MAX_MISSED_DAYS = 2, STREAK_SHIELD_COOLDOWN_DAYS = 7

beforeEach(() => {
  vi.useFakeTimers();
  // Mittag lokal, damit toLocalDateString stabil den 04.07.2026 liefert.
  vi.setSystemTime(new Date('2026-07-04T12:00:00'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('getStreakStatus', () => {
  it('heute gesehen → active', () => {
    expect(getStreakStatus('2026-07-04')).toBe('active');
  });

  it('gestern gesehen → at_risk', () => {
    expect(getStreakStatus('2026-07-03')).toBe('at_risk');
  });

  it('2 Tage her → shieldable', () => {
    expect(getStreakStatus('2026-07-02')).toBe('shieldable');
  });

  it('3 Tage her (MAX_MISSED + 1) → shieldable', () => {
    expect(getStreakStatus('2026-07-01')).toBe('shieldable');
  });

  it('4 Tage her → lost', () => {
    expect(getStreakStatus('2026-06-30')).toBe('lost');
  });

  it('leeres Datum → lost (Infinity)', () => {
    expect(getStreakStatus('')).toBe('lost');
  });
});

describe('getShieldCooldown', () => {
  it('ohne bisherige Shield-Nutzung → nicht auf Cooldown', () => {
    expect(getShieldCooldown(undefined)).toEqual({ onCooldown: false, daysRemaining: 0 });
  });

  it('heute genutzt → 7 Tage verbleibend', () => {
    expect(getShieldCooldown('2026-07-04')).toEqual({ onCooldown: true, daysRemaining: 7 });
  });

  it('vor 3 Tagen genutzt → 4 Tage verbleibend', () => {
    expect(getShieldCooldown('2026-07-01')).toEqual({ onCooldown: true, daysRemaining: 4 });
  });

  it('vor 7 Tagen genutzt → Cooldown vorbei', () => {
    expect(getShieldCooldown('2026-06-27')).toEqual({ onCooldown: false, daysRemaining: 0 });
  });

  it('vor 10 Tagen genutzt → daysRemaining nie negativ', () => {
    expect(getShieldCooldown('2026-06-24')).toEqual({ onCooldown: false, daysRemaining: 0 });
  });
});
