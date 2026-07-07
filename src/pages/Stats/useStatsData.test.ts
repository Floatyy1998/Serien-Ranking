// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, cleanup } from '@testing-library/react';
import type { Series } from '../../types/Series';
import type { Movie } from '../../types/Movie';

const ctx = vi.hoisted(() => ({
  user: null as { uid: string } | null,
  seriesList: [] as Series[],
  allSeriesList: [] as Series[],
  movieList: [] as Movie[],
}));

vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: ctx.user }) }));
vi.mock('../../contexts/SeriesListContext', () => ({
  useSeriesList: () => ({ seriesList: ctx.seriesList, allSeriesList: ctx.allSeriesList }),
}));
vi.mock('../../contexts/MovieListContext', () => ({
  useMovieList: () => ({ movieList: ctx.movieList }),
}));

import { useStatsData, formatTime, formatTimeDetailed } from './useStatsData';

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
  ({ id: 1, title: 'Movie', runtime: 120, rating: {}, ...o }) as unknown as Movie;

const run = () => renderHook(() => useStatsData()).result;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));
  ctx.user = null;
  ctx.seriesList = [];
  ctx.allSeriesList = [];
  ctx.movieList = [];
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('formatTime', () => {
  it('formatiert Minuten unter einer Stunde', () => {
    expect(formatTime(45)).toMatchObject({ value: '45', unit: 'Min' });
  });
  it('formatiert Stunden unter einem Tag', () => {
    expect(formatTime(150)).toMatchObject({ value: '2', unit: 'Stunden' });
  });
  it('formatiert Tage', () => {
    const r = formatTime(3 * 24 * 60);
    expect(r).toMatchObject({ value: '3', unit: 'Tage' });
  });
  it('liefert eine Breakdown-Liste für große Werte', () => {
    const r = formatTime(400 * 24 * 60); // > 1 Jahr
    expect(r.unit).toMatch(/Jahr/);
    expect(r.breakdown.length).toBeGreaterThan(0);
  });
});

describe('formatTimeDetailed', () => {
  it('Minuten', () => expect(formatTimeDetailed(30)).toBe('30 Min'));
  it('Stunden + Minuten', () => expect(formatTimeDetailed(90)).toBe('1h 30m'));
  it('Tage + Stunden', () => expect(formatTimeDetailed(25 * 60)).toBe('1d 1h'));
  it('Monate + Tage', () => expect(formatTimeDetailed(31 * 24 * 60)).toBe('1M 1d'));
});

describe('useStatsData', () => {
  it('liefert EMPTY_STATS ohne User', () => {
    const r = run();
    expect(r.current.totalSeries).toBe(0);
    expect(r.current.progress).toBe(0);
    expect(r.current.topGenres).toEqual([]);
  });

  it('berechnet Episoden-Fortschritt nur für begonnene, ausgestrahlte Serien', () => {
    ctx.user = { uid: 'u1' };
    ctx.seriesList = [
      makeSeries({
        id: 1,
        seasons: [
          {
            seasonNumber: 0,
            episodes: [ep({ id: 1, watched: true }), ep({ id: 2, watched: false })],
          } as Season,
        ],
      }),
      // nicht begonnen → zählt nicht in den Fortschritt
      makeSeries({
        id: 2,
        seasons: [{ seasonNumber: 0, episodes: [ep({ id: 3, watched: false })] } as Season],
      }),
    ];
    const r = run();
    expect(r.current.totalSeries).toBe(2);
    expect(r.current.watchedEpisodes).toBe(1);
    expect(r.current.totalEpisodes).toBe(2); // nur begonnene Serie zählt
    expect(r.current.progress).toBe(50);
  });

  it('zählt vollständig gesehene Serien und Watch-Zeit über allSeriesList', () => {
    ctx.user = { uid: 'u1' };
    const completed = makeSeries({
      id: 1,
      episodeRuntime: 30,
      seasons: [
        {
          seasonNumber: 0,
          episodes: [ep({ id: 1, watched: true }), ep({ id: 2, watched: true, watchCount: 2 })],
        } as Season,
      ],
    });
    ctx.seriesList = [completed];
    ctx.allSeriesList = [completed];
    const r = run();
    expect(r.current.completedSeries).toBe(1);
    // 30 + 30*2 = 90
    expect(r.current.seriesMinutes).toBe(90);
  });

  it('aggregiert Film-Statistiken und Durchschnittsratings', () => {
    ctx.user = { uid: 'u1' };
    ctx.movieList = [
      makeMovie({ id: 1, runtime: 100, rating: { u1: 9 } as Movie['rating'] }),
      makeMovie({ id: 2, runtime: 100, rating: {} as Movie['rating'] }),
    ];
    const r = run();
    expect(r.current.totalMovies).toBe(2);
    expect(r.current.watchedMovies).toBe(1);
    expect(r.current.movieMinutes).toBe(100);
    expect(r.current.avgMovieRating).toBe(9);
  });

  it('liefert Top-Genres und Top-Provider sortiert', () => {
    ctx.user = { uid: 'u1' };
    ctx.seriesList = [
      makeSeries({
        id: 1,
        genre: { genres: ['Drama'] } as Series['genre'],
        provider: { provider: [{ id: 8, logo: 'l', name: 'Netflix' }] } as Series['provider'],
      }),
      makeSeries({
        id: 2,
        genre: { genres: ['Drama', 'Action'] } as Series['genre'],
        provider: {
          provider: [{ id: 9, logo: 'l', name: 'Disney Plus' }],
        } as Series['provider'],
      }),
    ];
    const r = run();
    expect(r.current.topGenres[0]).toEqual({ name: 'Drama', count: 2 });
    expect(r.current.topProviders.map((p) => p.name).sort()).toEqual(['Disney Plus', 'Netflix']);
  });

  it('zählt in der letzten Woche gesehene Episoden über allSeriesList', () => {
    ctx.user = { uid: 'u1' };
    const s = makeSeries({
      seasons: [
        {
          seasonNumber: 0,
          episodes: [
            ep({ id: 1, watched: true, lastWatchedAt: '2026-06-14T12:00:00Z' }),
            ep({ id: 2, watched: true, firstWatchedAt: '2026-01-01T12:00:00Z' }),
          ],
        } as Season,
      ],
    });
    ctx.allSeriesList = [s];
    const r = run();
    expect(r.current.lastWeekWatched).toBe(1);
  });
});
