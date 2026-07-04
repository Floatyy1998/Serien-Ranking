// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { Series } from '../types/Series';
import type { WebWorkerOptions, WebWorkerResult } from './useWebWorker';
import type { TodayEpisode } from './useWebWorkerTodayEpisodes';

const capture = vi.hoisted(() => ({
  lastOptions: null as WebWorkerOptions<unknown> | null,
  ret: { data: [], loading: false, error: null } as WebWorkerResult<unknown>,
}));

vi.mock('./useWebWorker', () => ({
  useWebWorker: vi.fn((_initial: unknown, options: WebWorkerOptions<unknown>) => {
    capture.lastOptions = options;
    return capture.ret;
  }),
}));

const listState = vi.hoisted(() => ({ seriesList: [] as Series[] }));
vi.mock('../contexts/SeriesListContext', () => ({
  useSeriesList: () => ({ seriesList: listState.seriesList }),
}));

import { useWebWorkerTodayEpisodes } from './useWebWorkerTodayEpisodes';

const makeSeries = (over: Partial<Series> = {}): Series =>
  ({ id: 1, title: 'S', seasons: [], ...over }) as unknown as Series;

const RESULT: TodayEpisode[] = [
  {
    seriesId: '1',
    seriesTitle: 'S',
    poster: '',
    seasonNumber: 1,
    episodeNumber: 1,
    seasonIndex: 0,
    episodeIndex: 0,
    episodeId: 'e1',
    episodeName: 'Pilot',
    watched: false,
    runtime: 20,
  },
];

beforeEach(() => {
  capture.lastOptions = null;
  capture.ret = { data: RESULT, loading: false, error: null };
  listState.seriesList = [];
});

describe('useWebWorkerTodayEpisodes', () => {
  it('gibt die vom Worker gelieferten Episoden zurück', () => {
    listState.seriesList = [makeSeries()];
    const { result } = renderHook(() => useWebWorkerTodayEpisodes());
    expect(result.current).toBe(RESULT);
  });

  it('konfiguriert die Episoden-Nachrichtentypen', () => {
    listState.seriesList = [makeSeries()];
    renderHook(() => useWebWorkerTodayEpisodes());
    expect(capture.lastOptions?.messageType).toBe('PROCESS_EPISODES');
    expect(capture.lastOptions?.resultType).toBe('EPISODES_RESULT');
  });

  it('enabled folgt der Länge der Serienliste', () => {
    renderHook(() => useWebWorkerTodayEpisodes());
    expect(capture.lastOptions?.enabled).toBe(false);

    listState.seriesList = [makeSeries()];
    renderHook(() => useWebWorkerTodayEpisodes());
    expect(capture.lastOptions?.enabled).toBe(true);
  });

  it('reicht die Serienliste als workerInput durch', () => {
    const series = makeSeries();
    listState.seriesList = [series];
    renderHook(() => useWebWorkerTodayEpisodes());
    const input = capture.lastOptions?.data as { seriesList: Series[] };
    expect(input.seriesList).toEqual([series]);
  });

  it('depsKey zählt watched-Episoden mit (ändert sich beim Markieren)', () => {
    const series = makeSeries({
      seasons: [
        { episodes: [{ watched: true } as never, { watched: false } as never] } as never,
      ] as never,
    });
    listState.seriesList = [series];
    renderHook(() => useWebWorkerTodayEpisodes());
    // Format `${seriesList.length}-${watchedCount}`
    expect(capture.lastOptions?.depsKey).toBe('1-1');
  });
});
