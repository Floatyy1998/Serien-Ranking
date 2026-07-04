import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Series } from '../types/Series';

// In-Memory-Firebase (nur für fixMissingFirstWatchedAt).
const fb = vi.hoisted(() => {
  const store = new Map<string, unknown>();
  const makeRef = (path?: string) => ({
    update: async (m: Record<string, unknown>) => {
      for (const [k, v] of Object.entries(m)) store.set(k, v);
    },
    once: async () => ({ val: () => (path && store.has(path) ? store.get(path) : null) }),
  });
  return { store, makeRef };
});
vi.mock('firebase/compat/app', () => ({
  default: { database: () => ({ ref: (p?: string) => fb.makeRef(p) }) },
}));
vi.mock('firebase/compat/database', () => ({}));

// Alle Detection-Module mocken — hier wird nur der Orchestrator getestet.
const mocks = vi.hoisted(() => ({
  detectNewSeasons: vi.fn(async () => [] as Series[]),
  detectInactiveSeries: vi.fn(async () => [] as Series[]),
  detectInactiveRewatches: vi.fn(async () => [] as Series[]),
  detectCompletedSeries: vi.fn(async () => [] as Series[]),
  detectUnratedSeries: vi.fn(async () => [] as Series[]),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  detectProviderChanges: vi.fn(async () => [] as any[]),
}));
vi.mock('../lib/validation/newSeasonDetection', () => ({
  detectNewSeasons: mocks.detectNewSeasons,
}));
vi.mock('../lib/validation/inactiveSeriesDetection', () => ({
  detectInactiveSeries: mocks.detectInactiveSeries,
  detectInactiveRewatches: mocks.detectInactiveRewatches,
}));
vi.mock('../lib/validation/completedSeriesDetection', () => ({
  detectCompletedSeries: mocks.detectCompletedSeries,
}));
vi.mock('../lib/validation/unratedSeriesDetection', () => ({
  detectUnratedSeries: mocks.detectUnratedSeries,
}));
vi.mock('../lib/validation/providerChangeDetection', () => ({
  detectProviderChanges: mocks.detectProviderChanges,
}));

import { runSequentialDetections, fixMissingFirstWatchedAt } from './seriesListDetection';

const UID = 'u1';
const series = (id: number): Series => ({ id, title: `S${id}` }) as unknown as Series;
const signal = () => new AbortController().signal;

beforeEach(() => {
  fb.store.clear();
  for (const fn of Object.values(mocks)) {
    fn.mockReset();
    fn.mockResolvedValue([]);
  }
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('runSequentialDetections', () => {
  it('leere seriesList → keine Detection läuft, kein onUpdate', async () => {
    const onUpdate = vi.fn();
    await runSequentialDetections([], UID, onUpdate, signal());
    expect(mocks.detectNewSeasons).not.toHaveBeenCalled();
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('meldet Ergebnisse jeder Detection über onUpdate', async () => {
    mocks.detectNewSeasons.mockResolvedValue([series(1)]);
    mocks.detectInactiveSeries.mockResolvedValue([series(2)]);
    mocks.detectInactiveRewatches.mockResolvedValue([series(3)]);
    mocks.detectCompletedSeries.mockResolvedValue([series(4)]);
    mocks.detectUnratedSeries.mockResolvedValue([series(5)]);
    mocks.detectProviderChanges.mockResolvedValue([{ seriesId: 6 }]);

    const partials: Record<string, unknown>[] = [];
    await runSequentialDetections([series(1)], UID, (p) => partials.push(p), signal());

    expect(partials).toEqual([
      { seriesWithNewSeasons: [series(1)] },
      { inactiveSeries: [series(2)], inactiveRewatches: [series(3)] },
      { completedSeries: [series(4)] },
      { unratedSeries: [series(5)] },
      { providerChanges: [{ seriesId: 6 }] },
    ]);
  });

  it('ruft onUpdate NICHT für leere Detection-Ergebnisse', async () => {
    // alle geben [] zurück (default)
    const onUpdate = vi.fn();
    await runSequentialDetections([series(1)], UID, onUpdate, signal());
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('kombiniert nur die nicht-leeren Teile von inactive/rewatch', async () => {
    mocks.detectInactiveRewatches.mockResolvedValue([series(3)]);
    const partials: Record<string, unknown>[] = [];
    await runSequentialDetections([series(1)], UID, (p) => partials.push(p), signal());
    expect(partials).toEqual([{ inactiveRewatches: [series(3)] }]);
  });

  it('Detections laufen sequentiell in Prioritätsreihenfolge', async () => {
    await runSequentialDetections([series(1)], UID, () => {}, signal());
    const order = [
      mocks.detectNewSeasons.mock.invocationCallOrder[0],
      mocks.detectCompletedSeries.mock.invocationCallOrder[0],
      mocks.detectUnratedSeries.mock.invocationCallOrder[0],
      mocks.detectProviderChanges.mock.invocationCallOrder[0],
    ];
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it('ein Fehler in einer Detection stoppt die nachfolgenden nicht', async () => {
    mocks.detectNewSeasons.mockRejectedValue(new Error('boom'));
    mocks.detectCompletedSeries.mockResolvedValue([series(4)]);
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const partials: Record<string, unknown>[] = [];
    await runSequentialDetections([series(1)], UID, (p) => partials.push(p), signal());

    expect(mocks.detectCompletedSeries).toHaveBeenCalled();
    expect(partials).toContainEqual({ completedSeries: [series(4)] });
  });
});

describe('fixMissingFirstWatchedAt', () => {
  it('schreibt firstWatchedAt (Unix-Sekunden) für geschaute Episoden ohne Timestamp', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-04T12:00:00Z'));
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const expectedSec = Math.floor(Date.now() / 1000);

    const seriesData: Record<string, Series> = {
      '10': {
        id: 10,
        seasons: [
          {
            seasonNumber: 0,
            episodes: [
              { id: 100, watched: true }, // fehlt firstWatchedAt → wird gesetzt
              { id: 101, watched: true, firstWatchedAt: '2025-01-01' }, // schon gesetzt → skip
              { id: 102, watched: false }, // nicht geschaut → skip
            ],
          },
        ],
      } as unknown as Series,
    };

    await fixMissingFirstWatchedAt(UID, seriesData);

    expect(fb.store.get('users/u1/seriesWatch/10/seasons/0/eps/100/f')).toBe(expectedSec);
    expect(fb.store.get('users/u1/seriesWatch/10/seasons/0/eps/101/f')).toBeUndefined();
    expect(fb.store.get('users/u1/seriesWatch/10/seasons/0/eps/102/f')).toBeUndefined();
    vi.useRealTimers();
  });

  it('keine passenden Episoden → kein Write', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const seriesData: Record<string, Series> = {
      '10': { id: 10, seasons: [] } as unknown as Series,
    };
    await fixMissingFirstWatchedAt(UID, seriesData);
    expect(fb.store.size).toBe(0);
  });
});
