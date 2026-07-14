// @vitest-environment jsdom
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/*
 * Firebase-Mock mit Query-Chain (orderByChild/startAt/limitToLast → once).
 * useSeriesList + static catalog gemockt; readEventUniversal (compactEvent)
 * bleibt echt und reicht Legacy-Events durch.
 */
const fb = vi.hoisted(() => {
  const state = { events: null as unknown, onceCalls: [] as string[] };
  const makeRef = (path: string) => {
    const refObj = {
      orderByChild: () => refObj,
      startAt: () => refObj,
      limitToLast: () => refObj,
      once: async (_e: string) => {
        state.onceCalls.push(path);
        return { val: () => state.events };
      },
    };
    return refObj;
  };
  return { state, ref: (path: string) => makeRef(path) };
});

const ctx = vi.hoisted(() => ({ seriesList: [] as unknown[] }));
const cat = vi.hoisted(() => ({ series: {} as Record<string, unknown> }));

vi.mock('firebase/compat/app', () => ({
  default: { database: () => ({ ref: fb.ref }) },
}));
vi.mock('firebase/compat/database', () => ({}));
vi.mock('../../contexts/SeriesListContext', () => ({
  useSeriesList: () => ({ seriesList: ctx.seriesList }),
}));
vi.mock('../../services/staticCatalog', () => ({
  fetchStaticCatalogSeries: () => Promise.resolve(cat.series),
  subscribeCatalogChange: () => () => {},
}));

import { useFriendCurrentlyWatching } from './useFriendCurrentlyWatching';

const iso = (offsetHours: number) => new Date(Date.now() - offsetHours * 3600 * 1000).toISOString();

const epEvent = (o: Record<string, unknown>) => ({
  type: 'episode_watch',
  timestamp: iso(2),
  ...o,
});

beforeEach(() => {
  fb.state.events = null;
  fb.state.onceCalls = [];
  ctx.seriesList = [];
  cat.series = {};
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('useFriendCurrentlyWatching', () => {
  it('bleibt ohne friendUid im Loading und liest kein Firebase', () => {
    const { result } = renderHook(() => useFriendCurrentlyWatching(undefined));
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(fb.state.onceCalls).toHaveLength(0);
  });

  it('wählt die Serie mit den meisten Events und mergt den Katalog-Titel', async () => {
    cat.series = { '1': { title: 'Katalog Titel', poster: 'p.jpg' } };
    fb.state.events = {
      a: epEvent({ seriesId: 1, seriesTitle: 'Ev Titel', seasonNumber: 1, episodeNumber: 3 }),
      b: epEvent({ seriesId: 1, seasonNumber: 1, episodeNumber: 4 }),
      c: epEvent({ seriesId: 1, seasonNumber: 1, episodeNumber: 5 }),
      d: epEvent({ seriesId: 2, seasonNumber: 1, episodeNumber: 1 }),
    };
    const { result } = renderHook(() => useFriendCurrentlyWatching('friend'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const data = result.current.data;
    expect(data?.seriesId).toBe(1);
    expect(data?.title).toBe('Katalog Titel');
    expect(data?.episodeCount).toBe(3);
    expect(data?.mood).toBe('active');
    // Ohne eigene Serie: userLast=null → spoilerDiff "unknown", warnt bei ep>1
    expect(data?.spoilerDiff.kind).toBe('unknown');
    expect(data?.spoilerDiff.warning).toBe(true);
  });

  it('erkennt eine Rewatch-Session (kein Spoiler-Risiko)', async () => {
    cat.series = { '5': { title: 'Rewatch Show' } };
    fb.state.events = {
      a: epEvent({ seriesId: 5, seasonNumber: 2, episodeNumber: 1, isRewatch: true }),
      b: epEvent({ seriesId: 5, seasonNumber: 2, episodeNumber: 2, isRewatch: true }),
    };
    const { result } = renderHook(() => useFriendCurrentlyWatching('friend'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data?.isRewatch).toBe(true);
    expect(result.current.data?.mood).toBe('rewatch');
    expect(result.current.data?.spoilerDiff.kind).toBe('rewatch');
  });

  it('vergleicht gegen den eigenen Fortschritt (gleichauf)', async () => {
    cat.series = { '7': { title: 'Shared' } };
    ctx.seriesList = [
      {
        id: 7,
        seasons: [
          {
            seasonNumber: 0,
            episodes: [{ watched: true }, { watched: true }, { watched: true }],
          },
        ],
      },
    ];
    fb.state.events = {
      a: epEvent({ seriesId: 7, seasonNumber: 1, episodeNumber: 3 }),
    };
    const { result } = renderHook(() => useFriendCurrentlyWatching('friend'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data?.spoilerDiff.kind).toBe('equal');
  });

  it('liefert data=null wenn keine Episoden-Events vorliegen', async () => {
    fb.state.events = { a: { type: 'movie_watch', timestamp: iso(1) } };
    const { result } = renderHook(() => useFriendCurrentlyWatching('friend'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBeNull();
  });
});
