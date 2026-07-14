// @vitest-environment jsdom
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Series } from '../../types/Series';

// Context mock
const ctx = vi.hoisted(() => ({
  seriesList: [] as Series[],
  hiddenSeriesList: [] as Series[],
}));

vi.mock('../../contexts/SeriesListContext', () => ({
  useSeriesList: () => ({
    seriesList: ctx.seriesList,
    hiddenSeriesList: ctx.hiddenSeriesList,
  }),
}));

import { useSeriesData } from './useSeriesData';

const makeSeries = (o: Partial<Series> = {}): Series =>
  ({
    id: 123,
    title: 'Local Show',
    name: 'Local Show',
    seasons: [],
    rating: {},
    imdb: { imdb_id: '' },
    genre: { genres: [] },
    poster: { poster: '/p.jpg' },
    ...o,
  }) as unknown as Series;

type FetchResult = { ok: boolean; json: () => Promise<unknown> };
const jsonRes = (body: unknown): FetchResult => ({ ok: true, json: async () => body });

function stubFetch(handler: (url: string) => unknown) {
  const fetchMock = vi.fn(async (url: string): Promise<FetchResult> => jsonRes(handler(url)));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const FULL_REMOTE = {
  id: 999,
  name: 'Remote Show',
  poster_path: '/r.jpg',
  genres: [{ id: 1, name: 'Drama' }],
  seasons: [{ season_number: 0 }, { season_number: 1 }, { season_number: 2 }],
  first_air_date: '2020-01-01',
  status: 'Ended',
  overview: 'Beschreibung',
  backdrop_path: '/b.jpg',
  external_ids: { imdb_id: 'tt999' },
  vote_average: 8,
  vote_count: 100,
  original_language: 'en',
  original_name: 'Remote Show',
  popularity: 5,
  origin_country: ['US'],
};

// Routes any TMDB/OMDb url to a canned payload.
function fullDataHandler(url: string): unknown {
  if (url.includes('omdbapi')) return { imdbRating: '9.1', imdbVotes: '1,234' };
  if (url.includes('/watch/providers'))
    return {
      results: {
        DE: {
          flatrate: [
            { provider_name: 'Netflix', provider_id: 8, logo_path: '/n.png' },
            { provider_name: 'Some Unsupported Service', provider_id: 99, logo_path: '/u.png' },
          ],
        },
      },
    };
  if (url.includes('/season/')) {
    return {
      episodes: [
        { id: 5001, name: 'Pilot', episode_number: 1, air_date: '2020-01-01' },
        { id: 5002, name: 'Second', episode_number: 2, air_date: '2020-01-08' },
      ],
    };
  }
  if (url.includes('append_to_response')) return FULL_REMOTE; // de-DE full
  if (url.includes('language=en-US')) return { name: 'Remote Show' };
  // first backdrop/rating fetch (tv/{id}?...de-DE)
  return {
    backdrop_path: '/b.jpg',
    vote_average: 8,
    vote_count: 100,
    first_air_date: '2020-01-01',
    overview: 'Beschreibung',
  };
}

beforeEach(() => {
  ctx.seriesList = [];
  ctx.hiddenSeriesList = [];
  vi.stubEnv('VITE_API_TMDB', 'tmdb-key');
  vi.stubEnv('VITE_API_OMDb', 'omdb-key');
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('useSeriesData', () => {
  it('returns the local series without a full TMDB fetch and marks it non-read-only', async () => {
    ctx.seriesList = [makeSeries({ id: 123, imdb: { imdb_id: 'tt123' } })];
    const fetchMock = stubFetch(fullDataHandler);

    const { result } = renderHook(() => useSeriesData('123'));

    expect(result.current.series?.id).toBe(123);
    expect(result.current.localSeries?.id).toBe(123);
    expect(result.current.isReadOnlyTmdbSeries).toBe(false);
    expect(result.current.loading).toBe(false);

    await waitFor(() => expect(result.current.tmdbBackdrop).toBe('/b.jpg'));
    // No append_to_response (full) request should have been made for a local series.
    const urls = fetchMock.mock.calls.map((c) => c[0] as string);
    expect(urls.some((u) => u.includes('append_to_response'))).toBe(false);
  });

  it('does not fetch when the TMDB api key is missing', () => {
    vi.stubEnv('VITE_API_TMDB', '');
    const fetchMock = stubFetch(fullDataHandler);
    renderHook(() => useSeriesData('123'));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('filters watch providers down to the supported set', async () => {
    ctx.seriesList = [makeSeries({ id: 123 })];
    stubFetch(fullDataHandler);
    const { result } = renderHook(() => useSeriesData('123'));
    await waitFor(() => expect(result.current.providers).not.toBeNull());
    expect(result.current.providers).toHaveLength(1);
    expect(result.current.providers?.[0]?.provider_name).toBe('Netflix');
  });

  it('does a full TMDB fetch for a series not in the user lists and marks it read-only', async () => {
    stubFetch(fullDataHandler);
    const { result } = renderHook(() => useSeriesData('999'));

    await waitFor(() => expect(result.current.tmdbSeries).not.toBeNull());
    const s = result.current.tmdbSeries as Series;
    expect(result.current.isReadOnlyTmdbSeries).toBe(true);
    expect(result.current.loading).toBe(false);
    // regular seasons (season_number > 0) → 2 seasons, 0-based seasonNumber
    expect(s.seasons).toHaveLength(2);
    expect(s.seasons[0].seasonNumber).toBe(0);
    expect(s.seasons[0].episodes[0]).toMatchObject({ id: 5001, watched: false, watchCount: 0 });
    expect(s.title).toBe('Remote Show');
    expect(s.imdb.imdb_id).toBe('tt999');
  });

  it('fetches the IMDB rating from OMDb once an imdb id is available', async () => {
    ctx.seriesList = [makeSeries({ id: 123, imdb: { imdb_id: 'tt123' } })];
    stubFetch(fullDataHandler);
    const { result } = renderHook(() => useSeriesData('123'));
    await waitFor(() => expect(result.current.imdbRating).not.toBeNull());
    expect(result.current.imdbRating).toEqual({ rating: 9.1, votes: '1,234' });
  });
});
