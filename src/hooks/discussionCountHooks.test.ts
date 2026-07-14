// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Firebase-Mock: ref(path).once('value') → Snapshot mit .val(). Für den
// Batch-Read auch orderByKey/startAt/endAt (chainbar, no-op).
const fb = vi.hoisted(() => {
  const state = {
    dataByPath: {} as Record<string, unknown>,
    onceCalls: [] as string[],
  };
  const makeRef = (path: string) => {
    const refObj = {
      path,
      orderByKey: () => refObj,
      startAt: () => refObj,
      endAt: () => refObj,
      once: async (_event: string) => {
        state.onceCalls.push(path);
        const data = state.dataByPath[path] ?? null;
        return { val: () => data };
      },
    };
    return refObj;
  };
  const ref = (path: string) => makeRef(path);
  return { state, ref };
});

vi.mock('firebase/compat/app', () => ({
  default: { database: () => ({ ref: fb.ref }) },
}));
vi.mock('firebase/compat/database', () => ({}));

import { useDiscussionCount, useEpisodeDiscussionCounts } from './discussionCountHooks';

beforeEach(() => {
  fb.state.dataByPath = {};
  fb.state.onceCalls = [];
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useDiscussionCount', () => {
  it('liest die Anzahl der Diskussionen für ein Item (einmaliger Read)', async () => {
    fb.state.dataByPath['discussions/series/42'] = { d1: {}, d2: {}, d3: {} };
    const { result } = renderHook(() => useDiscussionCount('series', 42));
    await waitFor(() => expect(result.current).toBe(3));
    expect(fb.state.onceCalls).toContain('discussions/series/42');
  });

  it('baut den Episode-Pfad aus Season + Episode', async () => {
    fb.state.dataByPath['discussions/episode/9_s1_e4'] = { x: {} };
    const { result } = renderHook(() => useDiscussionCount('episode', 9, 1, 4));
    await waitFor(() => expect(result.current).toBe(1));
    expect(fb.state.onceCalls).toContain('discussions/episode/9_s1_e4');
  });

  it('liefert 0 wenn keine Daten vorhanden sind', async () => {
    const { result } = renderHook(() => useDiscussionCount('movie', 555));
    await waitFor(() => expect(fb.state.onceCalls).toContain('discussions/movie/555'));
    expect(result.current).toBe(0);
  });

  it('überspringt den Read bei itemId 0 (Guard)', () => {
    renderHook(() => useDiscussionCount('series', 0));
    expect(fb.state.onceCalls).toHaveLength(0);
  });
});

describe('useEpisodeDiscussionCounts', () => {
  it('liest die Counts aller Episoden einer Staffel per Batch-Read', async () => {
    fb.state.dataByPath['discussions/episode'] = {
      '77_s1_e1': { a: {}, b: {} },
      '77_s1_e2': { a: {} },
      // e3 hat keine Diskussionen
    };
    const { result } = renderHook(() => useEpisodeDiscussionCounts(77, 1, 3));
    await waitFor(() => expect(Object.keys(result.current).length).toBeGreaterThan(0));
    expect(result.current[1]).toBe(2);
    expect(result.current[2]).toBe(1);
    expect(result.current[3]).toBeUndefined();
  });

  it('überspringt den Read bei fehlender seriesId oder episodeCount (Guard)', () => {
    renderHook(() => useEpisodeDiscussionCounts(0, 1, 5));
    renderHook(() => useEpisodeDiscussionCounts(5, 1, 0));
    expect(fb.state.onceCalls).toHaveLength(0);
  });

  it('liefert ein leeres Objekt wenn keine Daten existieren', async () => {
    const { result } = renderHook(() => useEpisodeDiscussionCounts(88, 2, 4));
    await waitFor(() => expect(fb.state.onceCalls).toContain('discussions/episode'));
    expect(result.current).toEqual({});
  });
});
