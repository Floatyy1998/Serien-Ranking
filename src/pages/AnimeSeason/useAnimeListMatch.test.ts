// @vitest-environment jsdom
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SeasonAnime } from '../../services/anilistSeasonService';
import type { Series } from '../../types/Series';

interface FbSnap {
  val: () => unknown;
}

const fb = vi.hoisted(() => {
  const state = { malByPath: {} as Record<string, unknown> };
  const ref = vi.fn((path: string) => ({
    once: async (): Promise<FbSnap> => ({ val: () => state.malByPath[path] ?? null }),
  }));
  const database = Object.assign(() => ({ ref }), {});
  return { state, ref, database };
});

vi.mock('firebase/compat/app', () => ({ default: { database: fb.database } }));
vi.mock('firebase/compat/database', () => ({}));

const listState = vi.hoisted(() => ({ seriesList: [] as unknown[] }));
vi.mock('../../contexts/SeriesListContext', () => ({
  useSeriesList: () => ({ seriesList: listState.seriesList }),
}));

const filler = vi.hoisted(() => ({ cacheById: {} as Record<number, { malId: number | null }> }));
vi.mock('../../services/animeFillerService', () => ({
  readFillerCacheSync: (id: number) => filler.cacheById[id] ?? null,
}));

import { normalizeTitle, useAnimeListMatch } from './useAnimeListMatch';

function makeSeries(overrides: Partial<Series>): Series {
  return { id: 1, title: '', genre: { genres: [] }, ...overrides } as unknown as Series;
}
function makeAnime(overrides: Partial<SeasonAnime>): SeasonAnime {
  return {
    idMal: null,
    title: { english: null, romaji: null },
    ...overrides,
  } as unknown as SeasonAnime;
}

beforeEach(() => {
  fb.state.malByPath = {};
  listState.seriesList = [];
  filler.cacheById = {};
  sessionStorage.clear();
  fb.ref.mockClear();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('normalizeTitle', () => {
  it('normalisiert lowercase + Sonderzeichen', () => {
    expect(normalizeTitle('Saga of Tanya: the Evil!!')).toBe('saga of tanya the evil');
    expect(normalizeTitle(null)).toBe('');
  });
});

describe('useAnimeListMatch', () => {
  it('matcht exakt per TMDB-Id (schlägt jede Heuristik)', () => {
    listState.seriesList = [makeSeries({ id: 42, title: 'Irgendwas' })];
    const { result } = renderHook(() => useAnimeListMatch());
    const anime = makeAnime({ title: { english: 'Other', romaji: null } });
    expect(result.current.matchAnime(anime, 42)?.id).toBe(42);
  });

  it('matcht per MAL-Id aus dem Filler-Cache', () => {
    listState.seriesList = [makeSeries({ id: 7, title: 'Serie 7' })];
    filler.cacheById = { 7: { malId: 999 } };
    const { result } = renderHook(() => useAnimeListMatch());
    const anime = makeAnime({ idMal: 999 });
    expect(result.current.matchAnime(anime)?.id).toBe(7);
  });

  it('matcht per normalisiertem Titel', () => {
    listState.seriesList = [makeSeries({ id: 3, title: 'Attack on Titan' })];
    const { result } = renderHook(() => useAnimeListMatch());
    const anime = makeAnime({
      title: { english: 'Attack on Titan', romaji: 'Shingeki no Kyojin' },
    });
    expect(result.current.matchAnime(anime)?.id).toBe(3);
  });

  it('matcht Sequel-Season über den gestrippten Basistitel', () => {
    listState.seriesList = [makeSeries({ id: 5, title: 'Saga of Tanya the Evil' })];
    const { result } = renderHook(() => useAnimeListMatch());
    const anime = makeAnime({
      title: { english: 'Saga of Tanya the Evil Season 2', romaji: null },
    });
    expect(result.current.matchAnime(anime)?.id).toBe(5);
  });

  it('liefert undefined ohne Treffer', () => {
    listState.seriesList = [makeSeries({ id: 1, title: 'Foo' })];
    const { result } = renderHook(() => useAnimeListMatch());
    expect(
      result.current.matchAnime(makeAnime({ title: { english: 'Bar', romaji: null } }))
    ).toBeUndefined();
  });

  it('reichert fehlende MAL-Ids aus Firebase an und matcht danach', async () => {
    listState.seriesList = [
      makeSeries({ id: 88, title: 'Anime Serie', genre: { genres: ['Anime'] } }),
    ];
    fb.state.malByPath['admin/animeFiller/88/malId'] = 4242;
    const { result } = renderHook(() => useAnimeListMatch());
    const anime = makeAnime({ idMal: 4242 });
    await waitFor(() => expect(result.current.matchAnime(anime)?.id).toBe(88));
    expect(fb.ref).toHaveBeenCalledWith('admin/animeFiller/88/malId');
  });
});
