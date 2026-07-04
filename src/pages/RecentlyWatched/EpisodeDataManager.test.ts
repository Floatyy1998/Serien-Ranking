import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EpisodeDataManager } from './EpisodeDataManager';
import type { Series } from '../../types/Series';

// Datumsfenster bewusst breit, damit Zeitzonen-Offsets die Zuordnung nicht kippen.
const START = '2026-06-20';
const END = '2026-07-10';

function ep(overrides: Record<string, unknown> = {}) {
  return { episode_number: 1, watched: true, name: 'Pilot', ...overrides };
}

function makeSeries(overrides: Record<string, unknown> = {}): Series {
  return {
    id: 1,
    title: 'Breaking Bad',
    poster: { poster: '/poster.jpg' },
    seasons: [],
    ...overrides,
  } as unknown as Series;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-07-04T12:00:00'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('EpisodeDataManager', () => {
  it('initialisiert daysToShow leere Datumsgruppen', () => {
    const mgr = new EpisodeDataManager([], 7, '');
    const groups = mgr.getDateGroups();
    expect(groups).toHaveLength(7);
    expect(groups[0].displayDate).toBe('Heute');
    expect(groups[1].displayDate).toBe('Gestern');
    expect(groups[2].displayDate).toBe('Vorgestern');
    expect(groups.every((g) => g.episodes.length === 0)).toBe(true);
  });

  it('ordnet gesehene Episoden ihren Watch-Tagen zu', async () => {
    const series = makeSeries({
      seasons: [
        {
          seasonNumber: 0,
          episodes: [
            ep({ firstWatchedAt: '2026-07-04T10:00:00', watchCount: 3 }),
            ep({ episode_number: 2, name: 'Zwei', firstWatchedAt: '2026-07-02T10:00:00' }),
          ],
        },
      ],
    });
    const mgr = new EpisodeDataManager([series], 7, '');
    await mgr.loadEpisodesForDateRange(START, END);

    const todayKey = new Date(2026, 6, 4).toDateString();
    const today = mgr.getEpisodesForDate(todayKey);
    expect(today).toHaveLength(1);
    expect(today[0].episodeName).toBe('Pilot');
    expect(today[0].episodeNumber).toBe(1);
    expect(today[0].seasonNumber).toBe(1); // (seasonNumber 0 ?? idx) + 1
    expect(today[0].watchCount).toBe(3);
    expect(today[0].dateSource).toBe('firstWatched');
    expect(today[0].seriesPoster).toContain('/poster.jpg');

    const key2 = new Date(2026, 6, 2).toDateString();
    expect(mgr.getEpisodesForDate(key2)).toHaveLength(1);
  });

  it('watchCount fehlt → Default 1', async () => {
    const series = makeSeries({
      seasons: [{ seasonNumber: 0, episodes: [ep({ firstWatchedAt: '2026-07-04T10:00:00' })] }],
    });
    const mgr = new EpisodeDataManager([series], 7, '');
    await mgr.loadEpisodesForDateRange(START, END);
    expect(mgr.getEpisodesForDate(new Date(2026, 6, 4).toDateString())[0].watchCount).toBe(1);
  });

  it('nutzt den neueren Timestamp (lastWatched) bei Rewatches', async () => {
    const series = makeSeries({
      seasons: [
        {
          seasonNumber: 0,
          episodes: [
            ep({ firstWatchedAt: '2026-07-01T10:00:00', lastWatchedAt: '2026-07-03T10:00:00' }),
          ],
        },
      ],
    });
    const mgr = new EpisodeDataManager([series], 7, '');
    await mgr.loadEpisodesForDateRange(START, END);
    const found = mgr.getEpisodesForDate(new Date(2026, 6, 3).toDateString());
    expect(found).toHaveLength(1);
    expect(found[0].dateSource).toBe('lastWatched');
  });

  it('überspringt ungesehene Episoden', async () => {
    const series = makeSeries({
      seasons: [{ seasonNumber: 0, episodes: [ep({ watched: false, watchCount: 0 })] }],
    });
    const mgr = new EpisodeDataManager([series], 7, '');
    await mgr.loadEpisodesForDateRange(START, END);
    const all = mgr.getDateGroups().flatMap((g) => g.episodes);
    expect(all).toHaveLength(0);
  });

  it('filtert Serien nach searchQuery', async () => {
    const a = makeSeries({
      id: 1,
      title: 'Breaking Bad',
      seasons: [{ seasonNumber: 0, episodes: [ep({ firstWatchedAt: '2026-07-04T10:00:00' })] }],
    });
    const b = makeSeries({
      id: 2,
      title: 'The Office',
      seasons: [{ seasonNumber: 0, episodes: [ep({ firstWatchedAt: '2026-07-04T10:00:00' })] }],
    });
    const mgr = new EpisodeDataManager([a, b], 7, 'office');
    await mgr.loadEpisodesForDateRange(START, END);
    const found = mgr.getEpisodesForDate(new Date(2026, 6, 4).toDateString());
    expect(found).toHaveLength(1);
    expect(found[0].seriesId).toBe(2);
  });

  it('markDateGroupLoaded / markDateGroupLoading setzen die Flags', () => {
    const mgr = new EpisodeDataManager([], 3, '');
    const key = mgr.getDateGroups()[0].date;
    mgr.markDateGroupLoading(key);
    expect(mgr.getDateGroups().find((g) => g.date === key)?.loading).toBe(true);
    mgr.markDateGroupLoaded(key);
    const g = mgr.getDateGroups().find((x) => x.date === key);
    expect(g?.loaded).toBe(true);
    expect(g?.loading).toBe(false);
  });

  it('clearCache leert Cache und Datumsgruppen', async () => {
    const series = makeSeries({
      seasons: [{ seasonNumber: 0, episodes: [ep({ firstWatchedAt: '2026-07-04T10:00:00' })] }],
    });
    const mgr = new EpisodeDataManager([series], 7, '');
    await mgr.loadEpisodesForDateRange(START, END);
    mgr.clearCache();
    expect(mgr.getDateGroups()).toHaveLength(0);
    expect(mgr.getEpisodesForDate(new Date(2026, 6, 4).toDateString())).toEqual([]);
  });
});
