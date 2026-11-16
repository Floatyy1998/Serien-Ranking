import { describe, expect, it } from 'vitest';
import { countsForWrapped, liveWrappedYear, resolveWrapped, wrappedCutoff } from './wrappedPeriod';

const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h);

describe('Wrapped-Zeitraum', () => {
  it('läuft vom 6.12. bis 31.12.', () => {
    expect(liveWrappedYear(at(2026, 12, 5, 23))).toBeNull();
    expect(liveWrappedYear(at(2026, 12, 6, 0))).toBe(2026);
    expect(liveWrappedYear(at(2026, 12, 31, 23))).toBe(2026);
    expect(liveWrappedYear(at(2027, 1, 1, 0))).toBeNull();
    expect(liveWrappedYear(at(2026, 11, 20))).toBeNull();
  });

  it('zählt bis einschließlich 5.12., danach nichts mehr', () => {
    expect(countsForWrapped(at(2026, 1, 1, 0).getTime(), 2026)).toBe(true);
    expect(countsForWrapped(at(2026, 12, 5, 23).getTime(), 2026)).toBe(true);
    expect(countsForWrapped(wrappedCutoff(2026), 2026)).toBe(false);
    expect(countsForWrapped(at(2026, 12, 24).getTime(), 2026)).toBe(false);
    expect(countsForWrapped(Number.NaN, 2026)).toBe(false);
  });
});

describe('resolveWrapped', () => {
  it('schaltet sich im Zeitraum von selbst ein, auch wenn der Schalter aus ist', () => {
    expect(resolveWrapped({ enabled: false, year: 2024 }, at(2026, 12, 10))).toEqual({
      enabled: true,
      year: 2026,
    });
    expect(resolveWrapped(null, at(2026, 12, 6, 0))).toEqual({ enabled: true, year: 2026 });
  });

  it('bleibt außerhalb des Zeitraums aus', () => {
    expect(resolveWrapped({ enabled: false, year: 2026 }, at(2026, 11, 16))).toEqual({
      enabled: false,
      year: 2026,
    });
    expect(resolveWrapped(null, at(2027, 1, 1))).toEqual({ enabled: false, year: 2027 });
  });

  it('lässt sich per Schalter vorziehen, mit dessen Jahr', () => {
    expect(resolveWrapped({ enabled: true, year: 2025 }, at(2026, 11, 16))).toEqual({
      enabled: true,
      year: 2025,
    });
    expect(resolveWrapped({ enabled: true }, at(2026, 11, 16))).toEqual({
      enabled: true,
      year: 2026,
    });
  });

  it('zeigt im Zeitraum immer das laufende Jahr, auch bei veraltetem Schalter-Jahr', () => {
    expect(resolveWrapped({ enabled: true, year: 2025 }, at(2026, 12, 20))).toEqual({
      enabled: true,
      year: 2026,
    });
  });

  it('hält mit der Notbremse auch im Zeitraum an', () => {
    expect(resolveWrapped({ paused: true }, at(2026, 12, 10))).toEqual({
      enabled: false,
      year: 2026,
    });
  });
});
