// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { useOnboardingSearch as UseOnboardingSearch } from './useOnboardingSearch';

const authState = vi.hoisted(() => ({ user: null as { uid: string } | null }));
vi.mock('../../../contexts/AuthContext', () => ({ useAuth: () => ({ user: authState.user }) }));

const refetchAfterAdd = vi.hoisted(() => vi.fn(async () => {}));
vi.mock('../../../contexts/SeriesListContext', () => ({
  useSeriesList: () => ({ refetchAfterAdd }),
}));

const backend = vi.hoisted(() => ({
  backendFetch: vi.fn<(path: string, init?: unknown) => Promise<{ ok: boolean }>>(),
}));
vi.mock('../../../services/backendApi', () => ({ backendFetch: backend.backendFetch }));

async function loadHook(): Promise<typeof UseOnboardingSearch> {
  vi.resetModules();
  return (await import('./useOnboardingSearch')).useOnboardingSearch;
}

function jsonRes(body: unknown) {
  // `ok: true` ist Pflicht — der zentrale tmdbClient prüft `res.ok`.
  return { ok: true, json: async () => body };
}

beforeEach(() => {
  authState.user = { uid: 'u1' };
  refetchAfterAdd.mockClear();
  backend.backendFetch.mockReset();
  vi.stubEnv('VITE_API_TMDB', 'tmdb-key');
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('useOnboardingSearch – fetchSuggestions', () => {
  it('lädt Trending-Vorschläge (TV + Movie) und sortiert nach Bewertung', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('trending/tv'))
        return jsonRes({
          results: [
            { id: 1, name: 'B Show', poster_path: '/b.jpg', vote_average: 7 },
            { id: 2, name: 'A Show', poster_path: '/a.jpg', vote_average: 9 },
            { id: 3, name: 'No Poster', poster_path: null, vote_average: 10 },
          ],
        });
      return jsonRes({
        results: [{ id: 20, title: 'Film', poster_path: '/f.jpg', vote_average: 8 }],
      });
    });
    vi.stubGlobal('fetch', fetchMock);
    const useOnboardingSearch = await loadHook();
    const { result } = renderHook(() => useOnboardingSearch());

    await act(async () => {
      await result.current.fetchSuggestions([]);
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    // TV zuerst (nach vote_average sortiert), dann Movies; ohne Poster gefiltert
    expect(result.current.suggestions.map((s) => s.id)).toEqual([2, 1, 20]);
  });

  it('bricht ohne API-Key ab', async () => {
    vi.stubEnv('VITE_API_TMDB', '');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const useOnboardingSearch = await loadHook();
    const { result } = renderHook(() => useOnboardingSearch());
    await act(async () => {
      await result.current.fetchSuggestions([]);
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
  });
});

describe('useOnboardingSearch – search (debounced)', () => {
  it('leert Ergebnisse bei leerer Query', async () => {
    vi.stubGlobal('fetch', vi.fn());
    const useOnboardingSearch = await loadHook();
    const { result } = renderHook(() => useOnboardingSearch());
    act(() => result.current.search('   '));
    expect(result.current.searchResults).toEqual([]);
    expect(result.current.searchLoading).toBe(false);
  });

  it('sucht nach Debounce und nutzt EN-Fallback für nicht-lateinische Titel', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('/search/tv') && url.includes('de-DE'))
        return jsonRes({
          results: [{ id: 1, name: '進撃の巨人', poster_path: '/x.jpg', vote_average: 9 }],
        });
      if (url.includes('/search/tv') && url.includes('en-US'))
        return jsonRes({ results: [{ id: 1, name: 'Attack on Titan' }] });
      return jsonRes({ results: [] });
    });
    vi.stubGlobal('fetch', fetchMock);
    const useOnboardingSearch = await loadHook();
    const { result } = renderHook(() => useOnboardingSearch());

    act(() => result.current.search('titan'));
    expect(result.current.searchLoading).toBe(true);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(result.current.searchLoading).toBe(false);
    expect(result.current.searchResults[0]?.title).toBe('Attack on Titan');
  });
});

describe('useOnboardingSearch – addToList', () => {
  it('fügt eine Serie hinzu und triggert refetch', async () => {
    vi.stubGlobal('fetch', vi.fn());
    backend.backendFetch.mockResolvedValue({ ok: true });
    const useOnboardingSearch = await loadHook();
    const { result } = renderHook(() => useOnboardingSearch());
    let ok = false;
    await act(async () => {
      ok = await result.current.addToList({
        id: 5,
        title: 'X',
        poster_path: '/x.jpg',
        vote_average: 8,
        type: 'series',
      });
    });
    expect(ok).toBe(true);
    expect(backend.backendFetch).toHaveBeenCalledWith(
      '/add',
      expect.objectContaining({ method: 'POST' })
    );
    expect(refetchAfterAdd).toHaveBeenCalledWith(5);
  });

  it('gibt false zurück ohne User', async () => {
    authState.user = null;
    vi.stubGlobal('fetch', vi.fn());
    const useOnboardingSearch = await loadHook();
    const { result } = renderHook(() => useOnboardingSearch());
    let ok = true;
    await act(async () => {
      ok = await result.current.addToList({
        id: 5,
        title: 'X',
        poster_path: null,
        vote_average: 0,
        type: 'movie',
      });
    });
    expect(ok).toBe(false);
    expect(backend.backendFetch).not.toHaveBeenCalled();
  });
});
