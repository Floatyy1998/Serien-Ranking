// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Series } from '../types/Series';
import type { useCharacterDescriptions as UseCharacterDescriptions } from './useCharacterDescriptions';

// --- Auth ---
const auth = vi.hoisted(() => ({ user: { uid: 'u1' } as { uid: string } | null }));
vi.mock('../AuthContext', () => ({ useAuth: () => ({ user: auth.user }) }));

// --- normalizeSeasons: liefert eine kontrollierte Fortschritts-Struktur ---
const seriesMetrics = vi.hoisted(() => ({
  normalizeSeasons: vi.fn(() => [
    {
      seasonNumber: 0,
      episodes: [
        { watched: true, episode_number: 1 },
        { watched: false, episode_number: 2 },
      ],
    },
  ]),
}));
vi.mock('../lib/episode/seriesMetrics', () => ({
  normalizeSeasons: seriesMetrics.normalizeSeasons,
}));

// --- backendFetch: routet nach AI-Endpunkt ---
const backend = vi.hoisted(() => ({ backendFetch: vi.fn() }));
vi.mock('../lib/backendApi', () => ({ backendFetch: backend.backendFetch }));

function makeSeries(overrides: Partial<Series> = {}): Series {
  return {
    id: 42,
    title: 'Test Serie',
    original_name: 'Test Serie',
    cast: [{ name: 'Jane Doe', character: 'Heldin', profile_path: '/jane.jpg' }],
    genre: { genres: ['Drama'] },
    origin_country: ['US'],
    original_language: 'en',
    seasons: [],
    ...overrides,
  } as unknown as Series;
}

function okResponse(body: unknown): Response {
  return { ok: true, status: 200, json: async () => body } as unknown as Response;
}
function errResponse(status: number, body: unknown = {}): Response {
  return { ok: false, status, json: async () => body } as unknown as Response;
}

async function loadHook(): Promise<typeof UseCharacterDescriptions> {
  vi.resetModules();
  return (await import('./useCharacterDescriptions')).useCharacterDescriptions;
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  auth.user = { uid: 'u1' };
  sessionStorage.clear();
  vi.stubEnv('VITE_BACKEND_API_URL', 'https://backend.test');
  vi.stubEnv('VITE_API_TMDB', 'tmdb-test-key');
  backend.backendFetch.mockReset();
  seriesMetrics.normalizeSeasons.mockClear();
  // Global fetch bedient nur die TMDB-Episoden-Kontextabfrage (fetchEpisodeContext).
  fetchMock = vi.fn(async (url: string) => {
    if (url.includes('themoviedb.org')) {
      return okResponse({ episodes: [{ episode_number: 1, name: 'Pilot', overview: 'Auftakt' }] });
    }
    return okResponse({});
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('useCharacterDescriptions – progress derivation', () => {
  it('derives the current watch progress from the series seasons', async () => {
    const useCharacterDescriptions = await loadHook();
    const { result } = renderHook(() => useCharacterDescriptions(makeSeries()));
    // Letzte gesehene Episode: S1E1 (seasonNumber 0 +1), nicht komplett (E2 offen)
    expect(result.current.userProgress).toEqual({ season: 1, episode: 1, isComplete: false });
  });

  it('returns null progress when nothing has been watched', async () => {
    seriesMetrics.normalizeSeasons.mockReturnValueOnce([
      { seasonNumber: 0, episodes: [{ watched: false, episode_number: 1 }] },
    ]);
    const useCharacterDescriptions = await loadHook();
    const { result } = renderHook(() => useCharacterDescriptions(makeSeries()));
    expect(result.current.userProgress).toBeNull();
  });
});

describe('useCharacterDescriptions – generate()', () => {
  it('loads character descriptions from the backend AI endpoint and caches them', async () => {
    backend.backendFetch.mockResolvedValue(
      okResponse({ characters: [{ character: 'Heldin', description: 'Die Protagonistin.' }] })
    );
    const useCharacterDescriptions = await loadHook();
    const { result } = renderHook(() => useCharacterDescriptions(makeSeries()));

    await act(async () => {
      await result.current.generate();
    });

    expect(backend.backendFetch).toHaveBeenCalledWith('/ai/characters', expect.any(Object));
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.characters).toHaveLength(1);
    const first = result.current.characters[0];
    expect(first?.character).toBe('Heldin');
    expect(first?.description).toBe('Die Protagonistin.');
    expect(first?.name).toBe('Jane Doe');
    expect(first?.profilePath).toBe('/jane.jpg');
    // Ergebnis wurde im sessionStorage gecacht
    expect(sessionStorage.getItem('char-desc-42-S1E1')).not.toBeNull();
  });

  it('serves cached characters without hitting the backend again', async () => {
    const cached = [
      {
        name: 'Cached',
        character: 'C',
        description: 'aus Cache',
        profilePath: null,
        imageUrl: null,
      },
    ];
    sessionStorage.setItem('char-desc-42-S1E1', JSON.stringify(cached));
    const useCharacterDescriptions = await loadHook();
    const { result } = renderHook(() => useCharacterDescriptions(makeSeries()));

    await act(async () => {
      await result.current.generate();
    });

    expect(backend.backendFetch).not.toHaveBeenCalled();
    expect(result.current.characters[0]?.description).toBe('aus Cache');
  });

  it('maps a 429 rate-limit response to the backend error message', async () => {
    backend.backendFetch.mockResolvedValue(errResponse(429, { error: 'Tageslimit erreicht' }));
    const useCharacterDescriptions = await loadHook();
    const { result } = renderHook(() => useCharacterDescriptions(makeSeries()));

    await act(async () => {
      await result.current.generate();
    });

    expect(result.current.error).toBe('Tageslimit erreicht');
    expect(result.current.loading).toBe(false);
    expect(result.current.characters).toHaveLength(0);
  });

  it('maps a 404 to the "unknown series" message', async () => {
    backend.backendFetch.mockResolvedValue(errResponse(404));
    const useCharacterDescriptions = await loadHook();
    const { result } = renderHook(() => useCharacterDescriptions(makeSeries()));

    await act(async () => {
      await result.current.generate();
    });

    expect(result.current.error).toBe('Serie dem KI-Modell nicht bekannt');
  });

  it('sets a generic error when the backend call throws', async () => {
    backend.backendFetch.mockRejectedValue(new Error('network'));
    const useCharacterDescriptions = await loadHook();
    const { result } = renderHook(() => useCharacterDescriptions(makeSeries()));

    await act(async () => {
      await result.current.generate();
    });

    expect(result.current.error).toBe('Fehler beim Laden der Charaktere');
    expect(result.current.loading).toBe(false);
  });
});

describe('useCharacterDescriptions – askQuestion()', () => {
  it('stores the AI answer on success', async () => {
    backend.backendFetch.mockResolvedValue(okResponse({ answer: '42 ist die Antwort.' }));
    const useCharacterDescriptions = await loadHook();
    const { result } = renderHook(() => useCharacterDescriptions(makeSeries()));

    await act(async () => {
      await result.current.askQuestion('Wer ist der Mörder?');
    });

    expect(backend.backendFetch).toHaveBeenCalledWith('/ai/character-question', expect.any(Object));
    expect(result.current.questionAnswer).toBe('42 ist die Antwort.');
    expect(result.current.questionLoading).toBe(false);
  });

  it('ignores empty questions', async () => {
    const useCharacterDescriptions = await loadHook();
    const { result } = renderHook(() => useCharacterDescriptions(makeSeries()));

    await act(async () => {
      await result.current.askQuestion('   ');
    });

    expect(backend.backendFetch).not.toHaveBeenCalled();
    expect(result.current.questionAnswer).toBeNull();
  });

  it('prefixes a rate-limit answer with a warning on 429', async () => {
    backend.backendFetch.mockResolvedValue(errResponse(429, { error: 'Zu viele Fragen' }));
    const useCharacterDescriptions = await loadHook();
    const { result } = renderHook(() => useCharacterDescriptions(makeSeries()));

    await act(async () => {
      await result.current.askQuestion('Frage?');
    });

    expect(result.current.questionAnswer).toContain('Zu viele Fragen');
  });
});
