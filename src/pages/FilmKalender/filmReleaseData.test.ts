import { beforeEach, describe, expect, it, vi } from 'vitest';

const tmdbFetch = vi.hoisted(() => vi.fn());

vi.mock('../../services/api/tmdbClient', () => ({ tmdbFetch }));
vi.mock('../../services/settings/region', () => ({
  watchRegion: 'DE',
  pickProviderTiers: () => [],
}));

import { fetchFilmReleases, pickDirectors, pickLeadCast } from './filmReleaseData';

const PAGE_SIZE = 20;
const REISSUE_ID = 42;

function mockTmdb(totalResults: number, day: string, reissueDay: string) {
  const totalPages = Math.ceil(totalResults / PAGE_SIZE);
  tmdbFetch.mockImplementation(async (path: string, params: Record<string, unknown>) => {
    if (path === 'discover/movie') {
      const page = Number(params.page);
      const first = (page - 1) * PAGE_SIZE + 1;
      const last = Math.min(page * PAGE_SIZE, totalResults);
      const results = [];
      for (let id = first; id <= last; id++) results.push({ id, title: `Film ${id}` });
      return { results, total_pages: totalPages, total_results: totalResults };
    }
    const id = Number(path.split('/')[1]);
    const release_dates =
      id === REISSUE_ID
        ? [
            { type: 3, release_date: '1977-04-01T00:00:00.000Z' },
            { type: 3, release_date: `${reissueDay}T00:00:00.000Z` },
          ]
        : [{ type: 3, release_date: `${day}T00:00:00.000Z` }];
    return { release_dates: { results: [{ iso_3166_1: 'DE', release_dates }] } };
  });
}

const discoverPages = () =>
  tmdbFetch.mock.calls
    .filter(([path]) => path === 'discover/movie')
    .map(([, params]) => Number(params.page))
    .sort((x, y) => x - y);

describe('fetchFilmReleases', () => {
  beforeEach(() => {
    tmdbFetch.mockReset();
  });

  it('lädt die ersten hundert Filme und meldet den Rest', async () => {
    mockTmdb(130, '2026-11-10', '2026-11-25');
    const page = await fetchFilmReleases(new Date(2026, 9, 1), 'cinema');
    expect(discoverPages()).toEqual([1, 2, 3, 4, 5]);
    expect(page.entries).toHaveLength(100);
    expect(page.remaining).toBe(30);
    expect(page.entries.some((entry) => entry.tmdbId === 60)).toBe(true);
  });

  it('behält eine Wiederaufführung mit ihrem Termin im Zeitraum', async () => {
    mockTmdb(60, '2026-04-10', '2026-06-25');
    const page = await fetchFilmReleases(new Date(2026, 3, 1), 'cinema');
    expect(page.entries).toHaveLength(60);
    expect(page.remaining).toBe(0);
    expect(page.entries[page.entries.length - 1]).toMatchObject({
      tmdbId: REISSUE_ID,
      releaseDate: '2026-06-25',
    });
  });

  it('verwirft Filme ohne Termin im Zeitraum', async () => {
    mockTmdb(40, '2026-11-10', '2026-11-25');
    const page = await fetchFilmReleases(new Date(2027, 9, 1), 'cinema');
    expect(page.entries).toHaveLength(0);
  });

  it('hängt mit more den nächsten Block an und liefert danach den Cache', async () => {
    mockTmdb(130, '2026-09-10', '2026-09-11');
    const quarter = new Date(2026, 6, 1);

    const first = await fetchFilmReleases(quarter, 'cinema');
    expect(first.entries).toHaveLength(100);
    expect(first.remaining).toBe(30);

    const second = await fetchFilmReleases(quarter, 'cinema', true);
    expect(discoverPages()).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(second.entries).toHaveLength(130);
    expect(second.remaining).toBe(0);

    const calls = tmdbFetch.mock.calls.length;
    const cached = await fetchFilmReleases(quarter, 'cinema');
    expect(cached.entries).toHaveLength(130);
    expect(await fetchFilmReleases(quarter, 'cinema', true)).toEqual(cached);
    expect(tmdbFetch.mock.calls.length).toBe(calls);
  });
});

describe('pickDirectors', () => {
  it('nimmt nur Regie-Einträge, ohne Dubletten, höchstens zwei', () => {
    const credits = {
      crew: [
        { name: 'Anna Autorin', job: 'Screenplay' },
        { name: 'Jared Bush', job: 'Director' },
        { name: 'Jared Bush', job: 'Director' },
        { name: 'Byron Howard', job: 'Director' },
        { name: 'Dritte Person', job: 'Director' },
      ],
    };
    expect(pickDirectors(credits)).toEqual(['Jared Bush', 'Byron Howard']);
  });

  it('liefert ohne Credits eine leere Liste', () => {
    expect(pickDirectors(undefined)).toEqual([]);
    expect(pickDirectors({})).toEqual([]);
  });
});

describe('pickLeadCast', () => {
  it('sortiert nach order und nimmt die ersten drei', () => {
    const credits = {
      cast: [
        { name: 'Vierte', order: 3 },
        { name: 'Zweite', order: 1 },
        { name: 'Erste', order: 0 },
        { name: 'Ohne Rang' },
        { name: 'Dritte', order: 2 },
      ],
    };
    expect(pickLeadCast(credits)).toEqual(['Erste', 'Zweite', 'Dritte']);
  });

  it('überspringt Einträge ohne Namen', () => {
    expect(pickLeadCast({ cast: [{ order: 0 }, { name: 'Einzige', order: 1 }] })).toEqual([
      'Einzige',
    ]);
  });
});
