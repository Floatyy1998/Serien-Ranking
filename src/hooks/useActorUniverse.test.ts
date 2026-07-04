// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Series } from '../types/Series';
import type { useActorUniverse as UseActorUniverse } from './useActorUniverse';

// Series-Liste wird ueber einen mutierbaren Halter in den gemockten Context gespeist.
const ctx = vi.hoisted(() => ({ seriesList: [] as unknown[] }));
vi.mock('../contexts/SeriesListContext', () => ({
  useSeriesList: () => ({ allSeriesList: ctx.seriesList }),
}));

function makeSeries(id: number, title: string): Series {
  return { id, title, poster: { poster: `poster-${id}` } } as unknown as Series;
}

interface CastMember {
  id: number;
  name: string;
  character?: string;
  profile_path: string | null;
  popularity?: number;
  known_for_department?: string;
}

function castMember(id: number, name: string, character = 'Role'): CastMember {
  return {
    id,
    name,
    character,
    profile_path: null,
    popularity: 10,
    known_for_department: 'Acting',
  };
}

// Routet fetch nach TMDB-Endpunkt. credits -> Serien-Cast, tv_credits -> Empfehlungen.
function installFetch(opts: {
  creditsById?: Record<number, CastMember[]>;
  tvCreditsById?: Record<number, unknown[]>;
  creditsOk?: boolean;
}): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn(async (url: string) => {
    const creditsMatch = url.match(/\/tv\/(\d+)\/credits/);
    if (creditsMatch) {
      if (opts.creditsOk === false) return { ok: false, json: async () => ({}) };
      const id = Number(creditsMatch[1]);
      return { ok: true, json: async () => ({ cast: opts.creditsById?.[id] ?? [] }) };
    }
    const personMatch = url.match(/\/person\/(\d+)\/tv_credits/);
    if (personMatch) {
      const id = Number(personMatch[1]);
      return { ok: true, json: async () => ({ cast: opts.tvCreditsById?.[id] ?? [] }) };
    }
    return { ok: false, json: async () => ({}) };
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

async function loadHook(): Promise<typeof UseActorUniverse> {
  vi.resetModules();
  return (await import('./useActorUniverse')).useActorUniverse;
}

beforeEach(() => {
  ctx.seriesList = [];
  vi.stubEnv('VITE_API_TMDB', 'tmdb-test-key');
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('useActorUniverse – cast aggregation', () => {
  it('aggregates actors and surfaces those appearing in >= 2 series', async () => {
    ctx.seriesList = [makeSeries(1, 'Alpha'), makeSeries(2, 'Beta')];
    installFetch({
      creditsById: {
        1: [castMember(100, 'Shared Star'), castMember(200, 'Only In One')],
        2: [castMember(100, 'Shared Star'), castMember(300, 'Only In Two')],
      },
    });
    const useActorUniverse = await loadHook();
    const { result } = renderHook(() => useActorUniverse());

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Alle drei Schauspieler sind bekannt, aber nur der geteilte ist "significant".
    expect(result.current.stats.totalActors).toBe(3);
    expect(result.current.stats.actorsInMultipleSeries).toBe(1);
    expect(result.current.actors.map((a) => a.id)).toEqual([100]);
    expect(result.current.topActors[0]?.name).toBe('Shared Star');
    expect(result.current.progress).toBe(100);
  });

  it('does not fetch and drops loading when the TMDB key is missing', async () => {
    ctx.seriesList = [makeSeries(1, 'Alpha')];
    vi.stubEnv('VITE_API_TMDB', '');
    const fetchMock = installFetch({ creditsById: { 1: [castMember(100, 'X')] } });
    const useActorUniverse = await loadHook();
    const { result } = renderHook(() => useActorUniverse());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.actors).toEqual([]);
  });

  it('handles failed credit responses without producing actors', async () => {
    ctx.seriesList = [makeSeries(1, 'Alpha')];
    installFetch({ creditsOk: false });
    const useActorUniverse = await loadHook();
    const { result } = renderHook(() => useActorUniverse());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.actors).toEqual([]);
    expect(result.current.stats.totalActors).toBe(0);
  });

  it('serves the second consumer instantly from the cross-navigation cache', async () => {
    ctx.seriesList = [makeSeries(1, 'Alpha'), makeSeries(2, 'Beta')];
    installFetch({
      creditsById: {
        1: [castMember(100, 'Shared Star')],
        2: [castMember(100, 'Shared Star')],
      },
    });
    const useActorUniverse = await loadHook();
    const first = renderHook(() => useActorUniverse());
    await waitFor(() => expect(first.result.current.loading).toBe(false));

    // Zweiter Consumer (gleiches Modul, gleiche Serienliste) startet ohne Loading.
    const second = renderHook(() => useActorUniverse());
    expect(second.result.current.loading).toBe(false);
    expect(second.result.current.progress).toBe(100);
    expect(second.result.current.actors.map((a) => a.id)).toEqual([100]);
  });
});

describe('useActorUniverse – recommendations', () => {
  it('recommends other well-rated series for multi-series actors', async () => {
    ctx.seriesList = [makeSeries(1, 'Alpha'), makeSeries(2, 'Beta')];
    installFetch({
      creditsById: {
        1: [castMember(100, 'Shared Star')],
        2: [castMember(100, 'Shared Star')],
      },
      tvCreditsById: {
        100: [
          {
            id: 999,
            name: 'Hidden Gem',
            character: 'Hero',
            poster_path: '/g.jpg',
            vote_average: 8.4,
            vote_count: 500,
          },
          // Gefiltert: der User besitzt Serie 1 bereits
          {
            id: 1,
            name: 'Alpha',
            character: 'Self',
            poster_path: null,
            vote_average: 9,
            vote_count: 900,
          },
          // Gefiltert: zu wenige Stimmen
          {
            id: 555,
            name: 'Obscure',
            character: 'Extra',
            poster_path: null,
            vote_average: 8,
            vote_count: 5,
          },
        ],
      },
    });
    const useActorUniverse = await loadHook();
    const { result } = renderHook(() => useActorUniverse());

    await waitFor(() => expect(result.current.loading).toBe(false));
    await waitFor(() => expect(result.current.recommendations.length).toBeGreaterThan(0), {
      timeout: 3000,
    });

    const rec = result.current.recommendations[0];
    expect(rec?.series.id).toBe(999);
    expect(rec?.series.title).toBe('Hidden Gem');
    expect(rec?.actors[0]?.name).toBe('Shared Star');
    await waitFor(() => expect(result.current.loadingRecommendations).toBe(false));
  });
});
