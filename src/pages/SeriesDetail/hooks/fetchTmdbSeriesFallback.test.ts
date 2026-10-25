import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CatalogEpisode, CatalogSeason, CatalogSeries } from '../../../types/CatalogTypes';

const mocks = vi.hoisted(() => ({
  fetchStaticCatalogSeries: vi.fn<() => Promise<Record<string, CatalogSeries> | null>>(),
  fetchStaticCatalogSeasons:
    vi.fn<(id: string | number) => Promise<Record<string, CatalogSeason> | null>>(),
  tmdbFetch: vi.fn<(path: string) => Promise<unknown>>(),
}));

vi.mock('../../../services/catalog/staticCatalog', () => ({
  fetchStaticCatalogSeries: mocks.fetchStaticCatalogSeries,
  fetchStaticCatalogSeasons: mocks.fetchStaticCatalogSeasons,
}));
vi.mock('../../../services/api/tmdbClient', () => ({ tmdbFetch: mocks.tmdbFetch }));

import { fetchTmdbSeriesFallback } from './fetchTmdbSeriesFallback';

const META: CatalogSeries = {
  title: 'Katalog-Serie',
  poster: 'https://image.tmdb.org/t/p/w342/p.jpg',
  genres: ['Animation'],
  providers: [],
  imdbId: 'tt1',
  woUrl: null,
  production: true,
  episodeCount: 36,
  episodeRuntime: 24,
  watchtime: 864,
  seasonCount: 3,
  lastUpdated: 1,
};

const ep = (id: number, n: number, airDate: string): CatalogEpisode => ({
  id,
  name: `Folge ${n}`,
  airDate,
  episodeNumber: n,
});

// Drei Cours à 12 wie bei TVMaze — TMDB führt dieselbe Serie als eine Staffel.
const SEASONS: Record<string, CatalogSeason> = {
  '0': { seasonNumber: 0, episodes: [ep(1, 1, '2024-04-07'), ep(2, 2, '2024-04-14')] },
  '1': { seasonNumber: 1, episodes: [ep(3, 1, '2024-09-29')] },
  '2': { seasonNumber: 2, episodes: [ep(4, 1, '2026-09-27'), ep(5, 2, '2026-10-04')] },
};

function tmdbHandler(path: string): unknown {
  if (path.includes('/season/')) {
    return { episodes: [{ id: 5001, name: 'Pilot', episode_number: 1, air_date: '2020-01-01' }] };
  }
  return {
    id: 999,
    name: 'Remote Show',
    seasons: [{ season_number: 0 }, { season_number: 1 }],
    genres: [],
    external_ids: { imdb_id: 'tt999' },
  };
}

beforeEach(() => {
  mocks.fetchStaticCatalogSeries.mockReset();
  mocks.fetchStaticCatalogSeasons.mockReset();
  mocks.tmdbFetch.mockReset();
  mocks.tmdbFetch.mockImplementation(async (path: string) => tmdbHandler(path));
});

describe('fetchTmdbSeriesFallback', () => {
  it('baut eine Katalog-Serie aus Meta und Staffeln, ohne TMDB anzufragen', async () => {
    mocks.fetchStaticCatalogSeries.mockResolvedValue({ '237150': META });
    mocks.fetchStaticCatalogSeasons.mockResolvedValue(SEASONS);

    const s = await fetchTmdbSeriesFallback('237150');

    expect(s?.id).toBe(237150);
    expect(s?.title).toBe('Katalog-Serie');
    expect(s?.episodeRuntime).toBe(24);
    expect(s?.seasons.map((x) => x.seasonNumber)).toEqual([0, 1, 2]);
    expect(s?.seasons[2].episodes[1]).toMatchObject({
      id: 5,
      season_number: 2,
      episode_number: 2,
      watched: false,
      watchCount: 0,
    });
    expect(mocks.fetchStaticCatalogSeasons).toHaveBeenCalledWith('237150');
    expect(mocks.tmdbFetch).not.toHaveBeenCalled();
  });

  it('faellt auf TMDB zurueck, wenn die Serie nicht im Katalog ist', async () => {
    mocks.fetchStaticCatalogSeries.mockResolvedValue({});

    const s = await fetchTmdbSeriesFallback('999');

    expect(s?.id).toBe(999);
    expect(s?.title).toBe('Remote Show');
    expect(s?.seasons).toHaveLength(1);
    expect(s?.seasons[0]).toMatchObject({ seasonNumber: 0 });
    expect(s?.seasons[0].episodes[0]).toMatchObject({ id: 5001, watched: false });
    expect(mocks.fetchStaticCatalogSeasons).not.toHaveBeenCalled();
  });

  it('faellt auf TMDB zurueck, wenn die Katalog-Staffeln fehlen oder leer sind', async () => {
    mocks.fetchStaticCatalogSeries.mockResolvedValue({ '999': META });
    mocks.fetchStaticCatalogSeasons.mockResolvedValueOnce(null).mockResolvedValueOnce({});

    expect((await fetchTmdbSeriesFallback('999'))?.title).toBe('Remote Show');
    expect((await fetchTmdbSeriesFallback('999'))?.title).toBe('Remote Show');
  });

  it('faellt auf TMDB zurueck, wenn der Katalog nicht erreichbar ist', async () => {
    mocks.fetchStaticCatalogSeries.mockRejectedValue(new Error('offline'));

    const s = await fetchTmdbSeriesFallback('999');

    expect(s?.title).toBe('Remote Show');
  });
});
