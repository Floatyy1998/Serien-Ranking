// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Firebase-Mock. Deckt beide Listener-Wege ab:
//  - Realtime:  ref.on('value', cb, errCb)  / ref.off('value', listener)
//  - Delta:     ref.on('child_changed'|'child_added'|'child_removed', cb)
//  - once('value') für Full-Load + Version-Reads (val()/exists()).
// `dataByPath` steuert once()-Rückgaben; Listener-Callbacks werden erfasst.
type AnyCb = (snap: FbSnapshot) => void;
type ErrCb = (err: { message?: string }) => void;
interface FbSnapshot {
  exists: () => boolean;
  val: () => unknown;
  key?: string;
}

const fb = vi.hoisted(() => {
  const state = {
    dataByPath: {} as Record<string, unknown>,
    onceCalls: [] as string[],
    listeners: [] as Array<{ path: string; event: string; cb: AnyCb; err?: ErrCb }>,
    offCalls: [] as Array<{ path: string; event: string }>,
  };
  const snap = (data: unknown): FbSnapshot => ({
    exists: () =>
      data !== null &&
      data !== undefined &&
      (typeof data !== 'object' || Object.keys(data as object).length > 0),
    val: () => (data === undefined ? null : data),
  });
  const makeRef = (path: string) => {
    const refObj = {
      path,
      on: (event: string, cb: AnyCb, err?: ErrCb) => {
        state.listeners.push({ path, event, cb, err });
        return cb;
      },
      off: (event: string) => {
        state.offCalls.push({ path, event });
      },
      once: async (_event: string) => {
        state.onceCalls.push(path);
        return snap(state.dataByPath[path]);
      },
    };
    return refObj;
  };
  const ref = (path: string) => makeRef(path);
  return { state, snap, ref };
});

vi.mock('firebase/compat/app', () => ({
  default: { database: () => ({ ref: fb.ref }) },
}));
vi.mock('firebase/compat/database', () => ({}));

vi.mock('../services/offlineFirebaseService', () => ({
  offlineFirebaseService: {
    getCachedData: vi.fn(async () => null),
    cacheData: vi.fn(async () => undefined),
    getCacheVersion: vi.fn(async () => null),
    removeCachedData: vi.fn(async () => undefined),
  },
}));

import { useEnhancedFirebaseCache } from './useEnhancedFirebaseCache';
import { offlineFirebaseService } from '../services/offlineFirebaseService';

const mockedCache = vi.mocked(offlineFirebaseService);

// Snapshot für Delta-Child-Events (key + val).
function childSnap(key: string, value: unknown): FbSnapshot {
  return { key, exists: () => true, val: () => value };
}

function findListener(path: string, event: string): AnyCb | undefined {
  return fb.state.listeners.find((l) => l.path === path && l.event === event)?.cb;
}

beforeEach(() => {
  fb.state.dataByPath = {};
  fb.state.onceCalls = [];
  fb.state.listeners = [];
  fb.state.offCalls = [];
  mockedCache.getCachedData.mockReset().mockResolvedValue(null);
  mockedCache.cacheData.mockReset().mockResolvedValue(undefined);
  mockedCache.getCacheVersion.mockReset().mockResolvedValue(null);
  mockedCache.removeCachedData.mockReset().mockResolvedValue(undefined);
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useEnhancedFirebaseCache — path guard', () => {
  it('macht nichts bei leerem Pfad (data null, loading false, kein Listener)', async () => {
    const { result } = renderHook(() => useEnhancedFirebaseCache(''));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBeNull();
    expect(fb.state.listeners).toHaveLength(0);
  });
});

describe('useEnhancedFirebaseCache — initial cache load', () => {
  it('lädt sofort aus dem Cache (data + loading=false)', async () => {
    mockedCache.getCachedData.mockResolvedValue({ a: 1 } as never);
    const { result } = renderHook(() =>
      useEnhancedFirebaseCache<Record<string, number>>('items', { useRealtimeListener: true })
    );
    await waitFor(() => expect(result.current.data).toEqual({ a: 1 }));
    expect(result.current.loading).toBe(false);
  });
});

describe('useEnhancedFirebaseCache — realtime listener', () => {
  it('re-hydriert State bei einem Realtime-Update und cached ihn', async () => {
    mockedCache.getCachedData.mockResolvedValue({ a: 1 } as never);
    const { result } = renderHook(() =>
      useEnhancedFirebaseCache<Record<string, number>>('items', { useRealtimeListener: true })
    );
    await waitFor(() => expect(findListener('items', 'value')).toBeDefined());

    const cb = findListener('items', 'value');
    await act(async () => {
      await cb?.(fb.snap({ a: 1, b: 2 }));
    });

    await waitFor(() => expect(result.current.data).toEqual({ a: 1, b: 2 }));
    expect(result.current.isStale).toBe(false);
    expect(mockedCache.cacheData).toHaveBeenCalledWith(
      'items',
      { a: 1, b: 2 },
      expect.any(Number),
      undefined
    );
  });

  it('hängt den Realtime-Listener bei Unmount ab (off)', async () => {
    mockedCache.getCachedData.mockResolvedValue({ a: 1 } as never);
    const { unmount } = renderHook(() =>
      useEnhancedFirebaseCache('items', { useRealtimeListener: true })
    );
    await waitFor(() => expect(findListener('items', 'value')).toBeDefined());
    unmount();
    expect(fb.state.offCalls).toContainEqual({ path: 'items', event: 'value' });
  });
});

describe('useEnhancedFirebaseCache — delta sync', () => {
  it('merged ein child_changed-Event in den State', async () => {
    mockedCache.getCachedData.mockResolvedValue({ s1: { rating: 5 } } as never);
    const { result } = renderHook(() =>
      useEnhancedFirebaseCache<Record<string, { rating: number }>>('series', {
        useDeltaSync: true,
      })
    );
    await waitFor(() => expect(findListener('series', 'child_changed')).toBeDefined());

    const changed = findListener('series', 'child_changed');
    act(() => changed?.(childSnap('s1', { rating: 9 })));

    await waitFor(() => expect(result.current.data?.s1.rating).toBe(9));
    expect(mockedCache.cacheData).toHaveBeenCalled();
  });

  it('fügt via child_added ein neues Child hinzu', async () => {
    mockedCache.getCachedData.mockResolvedValue({ s1: { rating: 5 } } as never);
    const { result } = renderHook(() =>
      useEnhancedFirebaseCache<Record<string, { rating: number }>>('series', {
        useDeltaSync: true,
      })
    );
    await waitFor(() => expect(findListener('series', 'child_added')).toBeDefined());

    const added = findListener('series', 'child_added');
    // s1 ist bekannt (aus initialData) → wird als initiales Event geskippt.
    act(() => added?.(childSnap('s1', { rating: 5 })));
    // s2 ist neu → wird gemerged.
    act(() => added?.(childSnap('s2', { rating: 1 })));

    await waitFor(() => expect(result.current.data?.s2).toEqual({ rating: 1 }));
  });
});

describe('useEnhancedFirebaseCache — version check', () => {
  it('überspringt den Full-Load wenn Remote- und Cache-Version übereinstimmen', async () => {
    mockedCache.getCachedData.mockResolvedValue({ s1: { rating: 5 } } as never);
    mockedCache.getCacheVersion.mockResolvedValue(7);
    fb.state.dataByPath['meta/version'] = 7;

    const { result } = renderHook(() =>
      useEnhancedFirebaseCache<Record<string, { rating: number }>>('series', {
        useDeltaSync: true,
        versionPath: 'meta/version',
      })
    );

    await waitFor(() => expect(fb.state.onceCalls).toContain('meta/version'));
    // Version stimmt → KEIN Full-Load auf dem Haupt-Pfad.
    expect(fb.state.onceCalls).not.toContain('series');
    expect(result.current.data).toEqual({ s1: { rating: 5 } });
  });

  it('macht einen Full-Load wenn die Versionen abweichen', async () => {
    mockedCache.getCachedData.mockResolvedValue({ s1: { rating: 5 } } as never);
    mockedCache.getCacheVersion.mockResolvedValue(5);
    fb.state.dataByPath['meta/version'] = 9;
    fb.state.dataByPath['series'] = { s1: { rating: 5 }, s2: { rating: 2 } };

    const { result } = renderHook(() =>
      useEnhancedFirebaseCache<Record<string, { rating: number }>>('series', {
        useDeltaSync: true,
        versionPath: 'meta/version',
      })
    );

    await waitFor(() => expect(result.current.data?.s2).toEqual({ rating: 2 }));
    // Full-Load auf dem Haupt-Pfad hat stattgefunden.
    expect(fb.state.onceCalls).toContain('series');
  });
});

describe('useEnhancedFirebaseCache — plain fetch + refetch', () => {
  it('lädt ohne Cache direkt von Firebase (once) auf dem Haupt-Pfad', async () => {
    fb.state.dataByPath['items'] = { a: 1 };
    const { result } = renderHook(() => useEnhancedFirebaseCache<Record<string, number>>('items'));
    await waitFor(() => expect(result.current.data).toEqual({ a: 1 }));
    expect(fb.state.onceCalls).toContain('items');
    expect(mockedCache.cacheData).toHaveBeenCalled();
  });

  it('refetch liest den aktuellen Firebase-Wert neu', async () => {
    fb.state.dataByPath['items'] = { a: 1 };
    const { result } = renderHook(() => useEnhancedFirebaseCache<Record<string, number>>('items'));
    await waitFor(() => expect(result.current.data).toEqual({ a: 1 }));

    fb.state.dataByPath['items'] = { a: 2 };
    await act(async () => {
      await result.current.refetch();
    });
    await waitFor(() => expect(result.current.data).toEqual({ a: 2 }));
  });

  it('clearCache räumt den Offline-Cache des Pfads auf', async () => {
    const { result } = renderHook(() => useEnhancedFirebaseCache('items'));
    await act(async () => {
      await result.current.clearCache();
    });
    expect(mockedCache.removeCachedData).toHaveBeenCalledWith('items');
  });
});
