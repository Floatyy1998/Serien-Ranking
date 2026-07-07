// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { backendFetch } from '../services/backendApi';
import type { Series } from '../types/Series';

const authState = vi.hoisted(() => ({ uid: 'u1' as string | undefined }));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: authState.uid ? { uid: authState.uid } : null }),
}));

vi.mock('../services/backendApi', () => ({
  backendFetch: vi.fn(),
}));

const mockedBackendFetch = vi.mocked(backendFetch);

// BACKEND_URL / TMDB_API_KEY werden beim Modul-Load aus import.meta.env
// gelesen — deshalb env stubben und den Hook dynamisch importieren.
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
let useRecapData: (typeof import('./useRecapData'))['useRecapData'];

beforeAll(async () => {
  vi.stubEnv('VITE_BACKEND_API_URL', 'https://backend.test');
  vi.stubEnv('VITE_API_TMDB', 'tmdb-key');
  ({ useRecapData } = await import('./useRecapData'));
});

const DAY_MS = 24 * 60 * 60 * 1000;

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * DAY_MS).toISOString();
}

interface SeriesOpts {
  lastWatchedDaysAgo?: number;
  hasUnwatchedAired?: boolean;
  rewatchActive?: boolean;
}

function makeSeries(id: number, opts: SeriesOpts = {}): Series {
  const { lastWatchedDaysAgo = 40, hasUnwatchedAired = true, rewatchActive = false } = opts;
  return {
    id,
    title: 'Test Show',
    original_name: 'Test Show',
    rewatch: rewatchActive ? { active: true, round: 1 } : undefined,
    seasons: [
      {
        seasonNumber: 0,
        episodes: [
          {
            id: 1,
            name: 'E1',
            episode_number: 1,
            air_date: '2020-01-01',
            watched: true,
            lastWatchedAt: isoDaysAgo(lastWatchedDaysAgo),
          },
          {
            id: 2,
            name: 'E2',
            episode_number: 2,
            air_date: hasUnwatchedAired ? '2020-01-08' : '2999-01-01',
            watched: false,
          },
        ],
      },
    ],
  } as unknown as Series;
}

function tmdbResponse(): Response {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      episodes: [
        {
          episode_number: 1,
          name: 'Pilot',
          overview: 'Der Anfang der Geschichte.',
          still_path: '/still.jpg',
        },
      ],
    }),
  } as unknown as Response;
}

beforeEach(() => {
  authState.uid = 'u1';
  sessionStorage.clear();
  localStorage.clear();
  mockedBackendFetch.mockReset();
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => tmdbResponse())
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('useRecapData', () => {
  it('zeigt keinen Recap ohne Serie', () => {
    const { result } = renderHook(() => useRecapData(undefined));
    expect(result.current.shouldShowRecap).toBe(false);
  });

  it('zeigt keinen Recap bei kürzlich geschauter Serie (< 30 Tage)', () => {
    const series = makeSeries(1, { lastWatchedDaysAgo: 5 });
    const { result } = renderHook(() => useRecapData(series));
    expect(result.current.shouldShowRecap).toBe(false);
  });

  it('zeigt einen Recap bei alter Serie mit ungeschauten, ausgestrahlten Episoden', async () => {
    const series = makeSeries(1);
    const { result } = renderHook(() => useRecapData(series));

    await waitFor(() => expect(result.current.shouldShowRecap).toBe(true));
    expect(result.current.daysSinceLastWatch).toBeGreaterThanOrEqual(30);
    await waitFor(() => expect(result.current.recapEpisodes).toHaveLength(1));
    expect(result.current.recapEpisodes[0].name).toBe('Pilot');
  });

  it('zeigt keinen Recap während eines Rewatch', () => {
    const series = makeSeries(1, { rewatchActive: true });
    const { result } = renderHook(() => useRecapData(series));
    expect(result.current.shouldShowRecap).toBe(false);
  });

  it('zeigt keinen Recap, wenn permanent dismissed (localStorage)', () => {
    localStorage.setItem('recap-permanent-dismiss-1', 'true');
    const series = makeSeries(1);
    const { result } = renderHook(() => useRecapData(series));
    expect(result.current.shouldShowRecap).toBe(false);
  });

  it('dismiss() blendet den Recap aus', async () => {
    const series = makeSeries(1);
    const { result } = renderHook(() => useRecapData(series));
    await waitFor(() => expect(result.current.shouldShowRecap).toBe(true));

    act(() => {
      result.current.dismiss();
    });
    expect(result.current.shouldShowRecap).toBe(false);
    expect(result.current.dismissed).toBe(true);
  });

  it('dismissPermanent() schreibt das Flag nach localStorage', async () => {
    const series = makeSeries(1);
    const { result } = renderHook(() => useRecapData(series));
    await waitFor(() => expect(result.current.shouldShowRecap).toBe(true));

    act(() => {
      result.current.dismissPermanent();
    });
    expect(result.current.shouldShowRecap).toBe(false);
    expect(localStorage.getItem('recap-permanent-dismiss-1')).toBe('true');
  });

  it('generateAiRecap() setzt den KI-Recap bei Erfolg', async () => {
    mockedBackendFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ recap: 'Eine KI-Zusammenfassung.' }),
    } as unknown as Response);

    const series = makeSeries(1);
    const { result } = renderHook(() => useRecapData(series));
    await waitFor(() => expect(result.current.recapEpisodes).toHaveLength(1));

    let p: Promise<void> = Promise.resolve();
    act(() => {
      p = result.current.generateAiRecap();
    });
    await p;

    expect(mockedBackendFetch).toHaveBeenCalledWith('/ai/recap', expect.any(Object));
    await waitFor(() => expect(result.current.aiRecap).toBe('Eine KI-Zusammenfassung.'));
    expect(result.current.aiError).toBeNull();
  });

  it('generateAiRecap() setzt aiError bei Rate-Limit (429)', async () => {
    mockedBackendFetch.mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ error: 'Zu viele Anfragen' }),
    } as unknown as Response);

    const series = makeSeries(1);
    const { result } = renderHook(() => useRecapData(series));
    await waitFor(() => expect(result.current.recapEpisodes).toHaveLength(1));

    let p: Promise<void> = Promise.resolve();
    act(() => {
      p = result.current.generateAiRecap();
    });
    await p;

    await waitFor(() => expect(result.current.aiError).toBe('Zu viele Anfragen'));
    expect(result.current.aiRecap).toBeNull();
  });

  it('askQuestion() beantwortet eine Charakterfrage', async () => {
    mockedBackendFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ answer: 'Die Antwort.' }),
    } as unknown as Response);

    const series = makeSeries(1);
    const { result } = renderHook(() => useRecapData(series));
    await waitFor(() => expect(result.current.recapEpisodes).toHaveLength(1));

    let p: Promise<void> = Promise.resolve();
    act(() => {
      p = result.current.askQuestion('Wer ist der Bösewicht?');
    });
    await p;

    expect(mockedBackendFetch).toHaveBeenCalledWith('/ai/character-question', expect.any(Object));
    await waitFor(() => expect(result.current.questionAnswer).toBe('Die Antwort.'));
  });
});
