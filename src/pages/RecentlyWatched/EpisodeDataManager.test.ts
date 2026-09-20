import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EpisodeDataManager } from './EpisodeDataManager';
import type { Movie } from '../../types/Movie';
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

function makeMovie(overrides: Record<string, unknown> = {}): Movie {
  return {
    id: 10,
    title: 'Dune',
    poster: { poster: '/dune.jpg' },
    rating: {},
    runtime: 155,
    ...overrides,
  } as unknown as Movie;
}

const dayKey = (day: number) => new Date(2026, 6, day).toDateString();

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-07-04T12:00:00'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('EpisodeDataManager', () => {
  it('initialisiert daysToShow leere Datumsgruppen', () => {
    const mgr = new EpisodeDataManager([], [], 7, '');
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
    const mgr = new EpisodeDataManager([series], [], 7, '');
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
    const mgr = new EpisodeDataManager([series], [], 7, '');
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
    const mgr = new EpisodeDataManager([series], [], 7, '');
    await mgr.loadEpisodesForDateRange(START, END);
    const found = mgr.getEpisodesForDate(new Date(2026, 6, 3).toDateString());
    expect(found).toHaveLength(1);
    expect(found[0].dateSource).toBe('lastWatched');
  });

  it('überspringt ungesehene Episoden', async () => {
    const series = makeSeries({
      seasons: [{ seasonNumber: 0, episodes: [ep({ watched: false, watchCount: 0 })] }],
    });
    const mgr = new EpisodeDataManager([series], [], 7, '');
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
    const mgr = new EpisodeDataManager([a, b], [], 7, 'office');
    await mgr.loadEpisodesForDateRange(START, END);
    const found = mgr.getEpisodesForDate(new Date(2026, 6, 4).toDateString());
    expect(found).toHaveLength(1);
    expect(found[0].seriesId).toBe(2);
  });

  it('ordnet gesehene Filme ihren Watch-Tagen zu', async () => {
    const movie = makeMovie({ watched: true, watchedAt: '2026-07-03T20:00:00' });
    const mgr = new EpisodeDataManager([], [movie], 7, '');
    await mgr.loadEpisodesForDateRange(START, END);

    const group = mgr.getDateGroups().find((g) => g.date === dayKey(3));
    expect(group?.movies).toHaveLength(1);
    expect(group?.movies[0]).toMatchObject({ movieId: 10, title: 'Dune', dateSource: 'watched' });
  });

  it('vertritt ein fehlendes watchedAt durch das Bewertungsdatum', async () => {
    const movie = makeMovie({ rating: { Action: 8 }, ratedAt: '2026-07-02T20:00:00' });
    const mgr = new EpisodeDataManager([], [movie], 7, '');
    await mgr.loadEpisodesForDateRange(START, END);

    const group = mgr.getDateGroups().find((g) => g.date === dayKey(2));
    expect(group?.movies[0]).toMatchObject({ dateSource: 'rated', rating: 8 });
  });

  it('laesst ungesehene Filme und solche ohne Zeitstempel weg', async () => {
    const unwatched = makeMovie({ id: 11, watchedAt: '2026-07-03T20:00:00' });
    const noStamp = makeMovie({ id: 12, watched: true });
    const mgr = new EpisodeDataManager([], [unwatched, noStamp], 7, '');
    await mgr.loadEpisodesForDateRange(START, END);

    expect(mgr.getDateGroups().every((g) => g.movies.length === 0)).toBe(true);
  });

  it('filtert Filme ueber die Suche', async () => {
    const dune = makeMovie({ watched: true, watchedAt: '2026-07-03T20:00:00' });
    const heat = makeMovie({
      id: 11,
      title: 'Heat',
      watched: true,
      watchedAt: '2026-07-03T20:00:00',
    });
    const mgr = new EpisodeDataManager([], [dune, heat], 7, 'heat');
    await mgr.loadEpisodesForDateRange(START, END);

    const group = mgr.getDateGroups().find((g) => g.date === dayKey(3));
    expect(group?.movies.map((m) => m.movieId)).toEqual([11]);
  });

  it('legt einen Tag auch dann an, wenn nur ein Film darauf faellt', async () => {
    const movie = makeMovie({ watched: true, watchedAt: '2026-06-25T20:00:00' });
    const mgr = new EpisodeDataManager([], [movie], 3, '');
    await mgr.loadEpisodesForDateRange(START, END);

    const group = mgr.getDateGroups().find((g) => g.date === new Date(2026, 5, 25).toDateString());
    expect(group?.movies).toHaveLength(1);
    expect(group?.episodes).toEqual([]);
  });

  it('markDateGroupLoaded / markDateGroupLoading setzen die Flags', () => {
    const mgr = new EpisodeDataManager([], [], 3, '');
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
    const mgr = new EpisodeDataManager([series], [], 7, '');
    await mgr.loadEpisodesForDateRange(START, END);
    mgr.clearCache();
    expect(mgr.getDateGroups()).toHaveLength(0);
    expect(mgr.getEpisodesForDate(new Date(2026, 6, 4).toDateString())).toEqual([]);
  });
});
