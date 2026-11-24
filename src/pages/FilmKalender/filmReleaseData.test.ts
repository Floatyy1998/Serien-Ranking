import { beforeEach, describe, expect, it, vi } from 'vitest';

const tmdbFetch = vi.hoisted(() => vi.fn());

vi.mock('../../services/api/tmdbClient', () => ({ tmdbFetch }));
vi.mock('../../services/settings/region', () => ({
  watchRegion: 'DE',
  pickProviderTiers: () => [],
}));

import {
  fetchFilmDetails,
  fetchFilmReleases,
  peekFilmDetails,
  pickDirectors,
  pickLeadCast,
} from './filmReleaseData';

const PAGE_SIZE = 20;
const REISSUE_ID = 42;

function mockDiscover(totalResults: number, day: string) {
  const totalPages = Math.ceil(totalResults / PAGE_SIZE);
  tmdbFetch.mockImplementation(async (path: string, params: Record<string, unknown>) => {
    if (path !== 'discover/movie') throw new Error(`unerwartet: ${path}`);
    const page = Number(params.page);
    const first = (page - 1) * PAGE_SIZE + 1;
    const last = Math.min(page * PAGE_SIZE, totalResults);
    const results = [];
    for (let id = first; id <= last; id++) {
      results.push({
        id,
        title: `Film ${id}`,
        release_date: id === REISSUE_ID ? '1977-04-01' : day,
      });
    }
    return { results, total_pages: totalPages, total_results: totalResults };
  });
}

const discoverCalls = () => tmdbFetch.mock.calls.filter(([path]) => path === 'discover/movie');

describe('fetchFilmReleases', () => {
  beforeEach(() => {
    tmdbFetch.mockReset();
  });

  it('lädt alle Seiten des Quartals in einem Zug, ohne Abruf pro Film', async () => {
    mockDiscover(130, '2026-11-10');
    const entries = await fetchFilmReleases(new Date(2026, 9, 1), 'cinema');
    expect(
      discoverCalls()
        .map(([, params]) => Number(params.page))
        .sort((x, y) => x - y)
    ).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(tmdbFetch.mock.calls).toHaveLength(7);
    expect(entries).toHaveLength(129);
    expect(entries.some((entry) => entry.tmdbId === 130)).toBe(true);
  });

  it('lässt Wiederaufführungen weg', async () => {
    mockDiscover(60, '2026-05-10');
    const entries = await fetchFilmReleases(new Date(2026, 3, 1), 'cinema');
    expect(entries.find((entry) => entry.tmdbId === REISSUE_ID)).toBeUndefined();
    expect(discoverCalls()[0][1]).toMatchObject({
      'release_date.gte': '2026-04-01',
      'release_date.lte': '2026-06-30',
      'primary_release_date.gte': '2024-04-01',
    });
  });

  it('liefert beim zweiten Aufruf den Cache', async () => {
    mockDiscover(30, '2026-08-10');
    const quarter = new Date(2026, 6, 1);
    const first = await fetchFilmReleases(quarter, 'digital');
    const calls = tmdbFetch.mock.calls.length;
    expect(await fetchFilmReleases(quarter, 'digital')).toBe(first);
    expect(tmdbFetch.mock.calls.length).toBe(calls);
  });
});

describe('fetchFilmDetails', () => {
  beforeEach(() => {
    tmdbFetch.mockReset();
  });

  it('holt im Kino-Modus nur die Credits und merkt sie sich', async () => {
    tmdbFetch.mockResolvedValue({
      crew: [{ name: 'David Fincher', job: 'Director' }],
      cast: [{ name: 'Brad Pitt', order: 0 }],
    });
    expect(peekFilmDetails(7, 'cinema')).toBeUndefined();
    const details = await fetchFilmDetails(7, 'cinema');
    expect(details).toEqual({ providers: [], directors: ['David Fincher'], cast: ['Brad Pitt'] });
    expect(tmdbFetch.mock.calls.map(([path]) => path)).toEqual(['movie/7/credits']);
    expect(peekFilmDetails(7, 'cinema')).toBe(details);
    await fetchFilmDetails(7, 'cinema');
    expect(tmdbFetch).toHaveBeenCalledTimes(1);
  });

  it('fragt im Streaming-Modus zusätzlich die Anbieter ab', async () => {
    tmdbFetch.mockResolvedValue({});
    await fetchFilmDetails(8, 'digital');
    expect(tmdbFetch.mock.calls.map(([path]) => path).sort()).toEqual([
      'movie/8/credits',
      'movie/8/watch/providers',
    ]);
  });

  it('liefert leere Angaben, wenn TMDB nicht antwortet', async () => {
    tmdbFetch.mockRejectedValue(new Error('offline'));
    expect(await fetchFilmDetails(9, 'cinema')).toEqual({ providers: [], directors: [], cast: [] });
  });

  it('lässt höchstens sechs Abrufe gleichzeitig laufen', async () => {
    let running = 0;
    let peak = 0;
    tmdbFetch.mockImplementation(async () => {
      running++;
      peak = Math.max(peak, running);
      await new Promise((resolve) => setTimeout(resolve, 5));
      running--;
      return {};
    });
    await Promise.all(
      Array.from({ length: 20 }, (_, index) => fetchFilmDetails(100 + index, 'cinema'))
    );
    expect(peak).toBe(6);
    expect(tmdbFetch).toHaveBeenCalledTimes(20);
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
