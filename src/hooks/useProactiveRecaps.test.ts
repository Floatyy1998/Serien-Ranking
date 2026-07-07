// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { backendFetch } from '../services/backendApi';
import type { Series } from '../types/Series';

const authState = vi.hoisted(() => ({ uid: 'u1' as string | undefined }));
const seriesState = vi.hoisted(() => ({ seriesList: [] as unknown[] }));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: authState.uid ? { uid: authState.uid } : null }),
}));

vi.mock('../contexts/SeriesListContext', () => ({
  useSeriesList: () => seriesState,
}));

vi.mock('../services/backendApi', () => ({
  backendFetch: vi.fn(),
}));

// Firebase-Mock: once (dismissed-Node), set (dismiss-Write), root update (cleanup).
const fb = vi.hoisted(() => {
  const store: Record<string, unknown> = {};
  const setMock = vi.fn((_p: string, _v: unknown) => {});
  const updateMock = vi.fn(async (_u?: unknown) => {});
  const makeSnap = (val: unknown) => ({ val: () => val });
  const refMock = vi.fn((path?: string) => {
    if (path == null) return { update: updateMock };
    return {
      once: vi.fn(async () => makeSnap(store[path] ?? null)),
      set: vi.fn(async (v: unknown) => {
        store[path] = v;
        setMock(path, v);
      }),
    };
  });
  const database = () => ({ ref: refMock });
  const reset = () => {
    for (const k of Object.keys(store)) delete store[k];
    setMock.mockClear();
    updateMock.mockClear();
    refMock.mockClear();
  };
  return { store, setMock, updateMock, refMock, database, reset };
});

vi.mock('firebase/compat/app', () => ({ default: { database: fb.database } }));
vi.mock('firebase/compat/database', () => ({}));

const mockedBackendFetch = vi.mocked(backendFetch);
const dismissedPath = 'users/u1/proactiveRecapDismissed';

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
let useProactiveRecaps: (typeof import('./useProactiveRecaps'))['useProactiveRecaps'];

beforeAll(async () => {
  vi.stubEnv('VITE_BACKEND_API_URL', 'https://backend.test');
  vi.stubEnv('VITE_API_TMDB', 'tmdb-key');
  ({ useProactiveRecaps } = await import('./useProactiveRecaps'));
});

function todayNoonISO(): string {
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), t.getDate(), 12, 0, 0).toISOString();
}

// Serie mit abgeschlossener S0 und einer neuen S1, deren erste Folge heute läuft.
function newSeasonSeries(id: number): Series {
  return {
    id,
    title: 'Proactive Show',
    original_name: 'Proactive Show',
    watchlist: true,
    poster: { poster: 'poster.jpg' },
    seasons: [
      {
        seasonNumber: 0,
        episodes: [
          { episode_number: 1, name: 'S1E1', air_date: '2020-01-01', watched: true },
          { episode_number: 2, name: 'S1E2', air_date: '2020-01-08', watched: true },
        ],
      },
      {
        seasonNumber: 1,
        episodes: [{ episode_number: 1, name: 'S2E1', airstamp: todayNoonISO(), watched: false }],
      },
    ],
  } as unknown as Series;
}

function tmdbSeasonResponse(): Response {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      episodes: [
        { episode_number: 1, name: 'A', overview: 'Übersicht 1' },
        { episode_number: 2, name: 'B', overview: 'Übersicht 2' },
      ],
    }),
  } as unknown as Response;
}

const CACHE_KEY = (id: number) => `proactive-recap-${id}-new-season-S2`;

beforeEach(() => {
  authState.uid = 'u1';
  seriesState.seriesList = [];
  sessionStorage.clear();
  fb.reset();
  mockedBackendFetch.mockReset();
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => tmdbSeasonResponse())
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('useProactiveRecaps', () => {
  it('liefert keine Recaps ohne passende Trigger', async () => {
    seriesState.seriesList = [];
    const { result } = renderHook(() => useProactiveRecaps());
    await waitFor(() => expect(fb.refMock).toHaveBeenCalledWith(dismissedPath));
    expect(result.current.recaps).toHaveLength(0);
  });

  it('erzeugt einen new-season Recap für eine startende Staffel', async () => {
    seriesState.seriesList = [newSeasonSeries(10)];
    fb.store[dismissedPath] = null;

    const { result } = renderHook(() => useProactiveRecaps());

    await waitFor(() => expect(result.current.recaps).toHaveLength(1));
    const recap = result.current.recaps[0];
    expect(recap.seriesId).toBe(10);
    expect(recap.triggerType).toBe('new-season');
    expect(recap.startsToday).toBe(true);
    expect(recap.seasonNumber).toBe(2);
    expect(recap.cacheKey).toBe(CACHE_KEY(10));
  });

  it('filtert bereits (in Firebase) dismissed Recaps heraus', async () => {
    seriesState.seriesList = [newSeasonSeries(10)];
    fb.store[dismissedPath] = { [CACHE_KEY(10)]: Date.now() };

    const { result } = renderHook(() => useProactiveRecaps());

    await waitFor(() => expect(fb.refMock).toHaveBeenCalledWith(dismissedPath));
    // Kurz warten, dann sicherstellen dass nichts erscheint.
    await waitFor(() => expect(result.current.recaps).toHaveLength(0));
  });

  it('dismiss() entfernt den Recap lokal und schreibt nach Firebase', async () => {
    seriesState.seriesList = [newSeasonSeries(10)];
    fb.store[dismissedPath] = null;

    const { result } = renderHook(() => useProactiveRecaps());
    await waitFor(() => expect(result.current.recaps).toHaveLength(1));

    act(() => {
      result.current.dismiss(CACHE_KEY(10));
    });

    await waitFor(() => expect(result.current.recaps).toHaveLength(0));
    expect(fb.setMock).toHaveBeenCalledWith(
      `${dismissedPath}/${CACHE_KEY(10)}`,
      expect.any(Number)
    );
  });

  it('fetchRecap() lädt den KI-Recap und cached ihn in sessionStorage', async () => {
    seriesState.seriesList = [newSeasonSeries(10)];
    fb.store[dismissedPath] = null;
    mockedBackendFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ recap: 'Der proaktive Recap.' }),
    } as unknown as Response);

    const { result } = renderHook(() => useProactiveRecaps());
    await waitFor(() => expect(result.current.recaps).toHaveLength(1));

    let p: Promise<void> = Promise.resolve();
    act(() => {
      p = result.current.fetchRecap(CACHE_KEY(10));
    });
    await p;

    await waitFor(() => expect(result.current.recaps[0].recap).toBe('Der proaktive Recap.'));
    expect(mockedBackendFetch).toHaveBeenCalledWith('/ai/recap', expect.any(Object));
    expect(sessionStorage.getItem(CACHE_KEY(10))).toBe('Der proaktive Recap.');
  });

  it('liest ohne User keinen dismissed-State aus Firebase', () => {
    authState.uid = undefined;
    seriesState.seriesList = [newSeasonSeries(10)];
    const { result } = renderHook(() => useProactiveRecaps());
    // Kein User → der once-Read-Effekt feuert nicht.
    expect(fb.refMock).not.toHaveBeenCalledWith(dismissedPath);
    expect(result.current.recaps).toHaveLength(0);
  });
});
