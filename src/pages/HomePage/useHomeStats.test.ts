// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, cleanup } from '@testing-library/react';
import type { Series } from '../../types/Series';
import type { Movie } from '../../types/Movie';
import type { WorkerStats } from '../../hooks/useWebWorkerStatsOptimized';

// --- Context / hook mocks ---------------------------------------------------
const ctx = vi.hoisted(() => ({
  user: null as { uid: string } | null,
  allSeriesList: [] as Series[],
  movieList: [] as Movie[],
  workerStats: {
    watchedEpisodesActive: 0,
    totalEpisodes: 0,
  } as WorkerStats,
}));

vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: ctx.user }) }));
vi.mock('../../contexts/SeriesListContext', () => ({
  useSeriesList: () => ({ allSeriesList: ctx.allSeriesList }),
}));
vi.mock('../../contexts/MovieListContext', () => ({
  useMovieList: () => ({ movieList: ctx.movieList }),
}));
vi.mock('../../hooks/useWebWorkerStatsOptimized', () => ({
  useWebWorkerStatsOptimized: () => ctx.workerStats,
}));

import { useHomeStats } from './useHomeStats';

type Season = Series['seasons'][number];
type Episode = Season['episodes'][number];

const ep = (o: Partial<Episode> & { id: number }): Episode =>
  ({
    air_date: '2020-01-01',
    name: `Ep ${o.id}`,
    watched: false,
    episode_number: o.id,
    ...o,
  }) as Episode;

const makeSeries = (o: Partial<Series> = {}): Series =>
  ({
    id: 1,
    title: 'Series',
    episodeRuntime: 30,
    seasons: [],
    rating: {},
    ...o,
  }) as unknown as Series;

const makeMovie = (o: Partial<Movie> = {}): Movie =>
  ({
    id: 1,
    title: 'Movie',
    runtime: 120,
    rating: {},
    ...o,
  }) as unknown as Movie;

const run = () => renderHook(() => useHomeStats()).result;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));
  ctx.user = null;
  ctx.allSeriesList = [];
  ctx.movieList = [];
  ctx.workerStats = { watchedEpisodesActive: 0, totalEpisodes: 0 } as WorkerStats;
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('useHomeStats', () => {
  it('liefert Null-Werte ohne eingeloggten User', () => {
    const r = run();
    expect(r.current.totalSeries).toBe(0);
    expect(r.current.timeString).toBe('0Min');
    expect(r.current.topGenre).toBe('Keine');
    expect(r.current.topProvider).toBe('Keine');
    expect(r.current.avgSeriesRating).toBe('0.0');
  });

  it('übernimmt Episoden-Fortschritt aus den Worker-Stats', () => {
    ctx.user = { uid: 'u1' };
    ctx.workerStats = {
      watchedEpisodesActive: 7,
      totalEpisodes: 20,
    } as WorkerStats;
    ctx.allSeriesList = [makeSeries()];
    const r = run();
    expect(r.current.watchedEpisodes).toBe(7);
    expect(r.current.totalEpisodes).toBe(20);
    expect(r.current.totalSeries).toBe(1);
  });

  it('berechnet Watch-Zeit aus gesehenen, ausgestrahlten Episoden inkl. Rewatch-Count', () => {
    ctx.user = { uid: 'u1' };
    ctx.allSeriesList = [
      makeSeries({
        episodeRuntime: 30,
        seasons: [
          {
            seasonNumber: 0,
            episodes: [
              ep({ id: 1, watched: true }), // 30 min
              ep({ id: 2, watched: true, watchCount: 3 }), // 30 * 3 = 90 min
              ep({ id: 3, watched: false }), // nicht gesehen
            ],
          } as Season,
        ],
      }),
    ];
    const r = run();
    // 30 + 90 = 120 min → '2S'
    expect(r.current.seriesTimeString).toBe('2S');
    expect(r.current.totalHours).toBe(2);
  });

  it('zählt bewertete Filme als gesehen und berechnet Durchschnittsrating', () => {
    ctx.user = { uid: 'u1' };
    ctx.movieList = [
      makeMovie({ id: 1, rating: { u1: 8 } as Movie['rating'] }),
      makeMovie({ id: 2, rating: { u1: 6 } as Movie['rating'] }),
      makeMovie({ id: 3, rating: {} as Movie['rating'] }), // unbewertet
    ];
    const r = run();
    expect(r.current.totalMovies).toBe(3);
    expect(r.current.watchedMovies).toBe(2);
    expect(r.current.avgMovieRating).toBe('7.0');
  });

  it('ermittelt Top-Genre und Top-Provider', () => {
    ctx.user = { uid: 'u1' };
    ctx.allSeriesList = [
      makeSeries({
        id: 1,
        genre: { genres: ['Drama'] } as Series['genre'],
        provider: { provider: [{ id: 8, logo: 'l', name: 'Netflix' }] } as Series['provider'],
      }),
      makeSeries({
        id: 2,
        genre: { genres: ['Drama', 'Komödie'] } as Series['genre'],
        provider: { provider: [{ id: 8, logo: 'l', name: 'Netflix' }] } as Series['provider'],
      }),
    ];
    const r = run();
    expect(r.current.topGenre).toBe('Drama');
    expect(r.current.topProvider).toBe('Netflix');
  });

  it('zählt in der letzten Woche gesehene Episoden', () => {
    ctx.user = { uid: 'u1' };
    ctx.allSeriesList = [
      makeSeries({
        seasons: [
          {
            seasonNumber: 0,
            episodes: [
              ep({ id: 1, watched: true, lastWatchedAt: '2026-06-14T12:00:00Z' }), // innerhalb
              ep({ id: 2, watched: true, lastWatchedAt: '2026-05-01T12:00:00Z' }), // außerhalb
            ],
          } as Season,
        ],
      }),
    ];
    const r = run();
    expect(r.current.lastWeekWatched).toBe(1);
  });

  it('zählt vollständig gesehene Serien als completedSeries', () => {
    ctx.user = { uid: 'u1' };
    ctx.allSeriesList = [
      makeSeries({
        id: 1,
        seasons: [
          {
            seasonNumber: 0,
            episodes: [ep({ id: 1, watched: true }), ep({ id: 2, watched: true })],
          } as Season,
        ],
      }),
      makeSeries({
        id: 2,
        seasons: [
          {
            seasonNumber: 0,
            episodes: [ep({ id: 3, watched: true }), ep({ id: 4, watched: false })],
          } as Season,
        ],
      }),
    ];
    const r = run();
    expect(r.current.completedSeries).toBe(1);
  });
});
