// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { Series } from '../types/Series';
import type { Movie } from '../types/Movie';
import type { WebWorkerOptions, WebWorkerResult } from './useWebWorker';

// ---------------------------------------------------------------------------
// useWebWorker wird gemockt: wir testen die Wrapper-Logik (depsKey, workerInput,
// enabled, messageType/resultType) — nicht den Worker selbst.
// ---------------------------------------------------------------------------
const capture = vi.hoisted(() => ({
  lastOptions: null as WebWorkerOptions<unknown> | null,
  lastInitial: undefined as unknown,
  ret: { data: {}, loading: false, error: null } as WebWorkerResult<unknown>,
}));

vi.mock('./useWebWorker', () => ({
  useWebWorker: vi.fn((initial: unknown, options: WebWorkerOptions<unknown>) => {
    capture.lastInitial = initial;
    capture.lastOptions = options;
    return capture.ret;
  }),
}));

const authState = vi.hoisted(() => ({ user: { uid: 'u1' } as { uid: string } | null }));
vi.mock('../AuthContext', () => ({ useAuth: () => ({ user: authState.user }) }));

const listState = vi.hoisted(() => ({
  allSeriesList: [] as Series[],
  movieList: [] as Movie[],
}));
vi.mock('../contexts/SeriesListContext', () => ({
  useSeriesList: () => ({ allSeriesList: listState.allSeriesList }),
}));
vi.mock('../contexts/MovieListContext', () => ({
  useMovieList: () => ({ movieList: listState.movieList }),
}));

import { useWebWorkerStatsOptimized, type WorkerStats } from './useWebWorkerStatsOptimized';

const makeSeries = (over: Partial<Series> = {}): Series =>
  ({ id: 1, title: 'S', seasons: [], ...over }) as unknown as Series;

const makeMovie = (over: Partial<Movie> = {}): Movie => ({ id: 1, ...over }) as unknown as Movie;

const RESULT_STATS: WorkerStats = {
  totalSeries: 3,
  totalMovies: 2,
  watchedEpisodes: 10,
  watchedEpisodesActive: 8,
  totalViews: 12,
  totalEpisodes: 20,
  watchedMovies: 1,
  watchlistCount: 4,
  todayEpisodes: 1,
  progress: 50,
};

beforeEach(() => {
  capture.lastOptions = null;
  capture.lastInitial = undefined;
  capture.ret = { data: RESULT_STATS, loading: false, error: null };
  authState.user = { uid: 'u1' };
  listState.allSeriesList = [];
  listState.movieList = [];
});

describe('useWebWorkerStatsOptimized', () => {
  it('gibt die vom Worker gelieferten Stats zurück', () => {
    listState.allSeriesList = [makeSeries()];
    const { result } = renderHook(() => useWebWorkerStatsOptimized());
    expect(result.current).toBe(RESULT_STATS);
  });

  it('konfiguriert Nachrichtentypen und Debounce korrekt', () => {
    listState.allSeriesList = [makeSeries()];
    renderHook(() => useWebWorkerStatsOptimized());
    const opts = capture.lastOptions!;
    expect(opts.messageType).toBe('CALCULATE_STATS');
    expect(opts.resultType).toBe('STATS_RESULT');
    expect(opts.debounceMs).toBe(300);
  });

  it('enabled ist false bei leerer Serienliste, true sobald Serien existieren', () => {
    renderHook(() => useWebWorkerStatsOptimized());
    expect(capture.lastOptions!.enabled).toBe(false);

    listState.allSeriesList = [makeSeries()];
    renderHook(() => useWebWorkerStatsOptimized());
    expect(capture.lastOptions!.enabled).toBe(true);
  });

  it('reicht seriesList, movieList und userId als workerInput durch', () => {
    const series = makeSeries();
    const movie = makeMovie({ watched: true });
    listState.allSeriesList = [series];
    listState.movieList = [movie];
    renderHook(() => useWebWorkerStatsOptimized());
    const input = capture.lastOptions!.data as {
      seriesList: Series[];
      movieList: Movie[];
      userId: string | undefined;
    };
    expect(input.seriesList).toEqual([series]);
    expect(input.movieList).toEqual([movie]);
    expect(input.userId).toBe('u1');
  });

  it('depsKey berücksichtigt Rewatches über watchCount (viewCount)', () => {
    const withCounts = makeSeries({
      seasons: [
        { episodes: [{ watchCount: 2 } as never, { watched: true } as never] } as never,
      ] as never,
    });
    listState.allSeriesList = [withCounts];
    listState.movieList = [makeMovie({ watched: true }), makeMovie()];
    renderHook(() => useWebWorkerStatsOptimized());
    // Format: `${series}-${movies}-${viewCount}-${watchedMovies}-${uid}`
    // viewCount = 2 (watchCount) + 1 (watched) = 3; watchedMovies = 1
    expect(capture.lastOptions!.depsKey).toBe('1-2-3-1-u1');
  });

  it('nimmt user?.uid in den depsKey auf (undefined ohne User)', () => {
    authState.user = null;
    listState.allSeriesList = [makeSeries()];
    renderHook(() => useWebWorkerStatsOptimized());
    expect(capture.lastOptions!.depsKey).toBe('1-0-0-0-undefined');
  });
});
