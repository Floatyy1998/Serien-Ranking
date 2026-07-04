import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { discoverManga, getMangaById, searchManga } from './anilistService';

// ---------------------------------------------------------------------------
// AniList = GraphQL über globales fetch(). Wir stubben fetch und geben
// realistische { data: { Page | Media } }-Shapes zurück.
// ---------------------------------------------------------------------------
const fetchMock = vi.fn();

function graphqlOk(data: unknown) {
  return { ok: true, status: 200, json: async () => ({ data }) };
}

const mediaFixture = {
  id: 30002,
  title: { romaji: 'Berserk', english: 'Berserk', native: 'ベルセルク' },
  coverImage: { large: 'l.jpg', medium: 'm.jpg' },
  bannerImage: 'b.jpg',
  description: 'A dark fantasy manga.',
  chapters: 364,
  volumes: 41,
  status: 'RELEASING',
  format: 'MANGA',
  countryOfOrigin: 'JP',
  genres: ['Action', 'Horror'],
  averageScore: 93,
  startDate: { year: 1989, month: 8, day: 25 },
  isAdult: false,
};

/** Body des letzten fetch-Aufrufs als geparstes JSON zurückgeben. */
function lastBody(): { query: string; variables: Record<string, unknown> } {
  const call = fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
  return JSON.parse((call?.[1] as RequestInit).body as string);
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('searchManga', () => {
  it('gibt results/hasNextPage/total aus der Page zurück', async () => {
    fetchMock.mockResolvedValueOnce(
      graphqlOk({
        Page: {
          pageInfo: { total: 5, hasNextPage: true },
          media: [mediaFixture],
        },
      })
    );

    const res = await searchManga('berserk', 2, 10);

    expect(res.results).toEqual([mediaFixture]);
    expect(res.hasNextPage).toBe(true);
    expect(res.total).toBe(5);
  });

  it('sendet POST an graphql.anilist.co mit search/page/perPage-Variablen', async () => {
    fetchMock.mockResolvedValueOnce(
      graphqlOk({ Page: { pageInfo: { total: 0, hasNextPage: false }, media: [] } })
    );

    await searchManga('naruto', 3, 25);

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('https://graphql.anilist.co');
    expect((init as RequestInit).method).toBe('POST');
    const body = lastBody();
    expect(body.variables).toEqual({ search: 'naruto', page: 3, perPage: 25 });
    expect(body.query).toContain('type: MANGA');
  });

  it('nutzt Default-Paging (page=1, perPage=20)', async () => {
    fetchMock.mockResolvedValueOnce(
      graphqlOk({ Page: { pageInfo: { total: 0, hasNextPage: false }, media: [] } })
    );
    await searchManga('one piece');
    expect(lastBody().variables).toMatchObject({ page: 1, perPage: 20 });
  });

  it('wirft bei non-ok Response mit Statuscode', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 503, json: async () => ({}) });
    await expect(searchManga('x')).rejects.toThrow('AniList API error: 503');
  });

  it('wirft die GraphQL-Fehlermeldung, wenn json.errors gesetzt ist', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ errors: [{ message: 'Rate limited' }] }),
    });
    await expect(searchManga('x')).rejects.toThrow('Rate limited');
  });

  it('wirft generischen Fehler, wenn errors[0] keine message hat', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ errors: [{}] }),
    });
    await expect(searchManga('x')).rejects.toThrow('AniList API error');
  });
});

describe('getMangaById', () => {
  it('gibt Media zurück und schickt die id-Variable', async () => {
    fetchMock.mockResolvedValueOnce(graphqlOk({ Media: mediaFixture }));

    const res = await getMangaById(30002);

    expect(res).toEqual(mediaFixture);
    expect(lastBody().variables).toEqual({ id: 30002 });
    expect(lastBody().query).toContain('recommendations');
  });

  it('propagiert Fehler', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({}) });
    await expect(getMangaById(1)).rejects.toThrow('AniList API error: 404');
  });
});

describe('discoverManga', () => {
  it('mappt Kategorie → Sort-Array (trending)', async () => {
    fetchMock.mockResolvedValueOnce(
      graphqlOk({ Page: { pageInfo: { total: 1, hasNextPage: false }, media: [mediaFixture] } })
    );

    const res = await discoverManga('trending');

    expect(res.results).toEqual([mediaFixture]);
    expect(res.total).toBe(1);
    expect(lastBody().variables.sort).toEqual(['TRENDING_DESC']);
  });

  it.each([
    ['popular', ['POPULARITY_DESC']],
    ['top_rated', ['SCORE_DESC']],
    ['upcoming', ['START_DATE_DESC']],
  ] as const)('Kategorie %s → sort %j', async (category, expectedSort) => {
    fetchMock.mockResolvedValueOnce(
      graphqlOk({ Page: { pageInfo: { total: 0, hasNextPage: false }, media: [] } })
    );
    await discoverManga(category);
    expect(lastBody().variables.sort).toEqual(expectedSort);
  });

  it('setzt countryOfOrigin, wenn gesetzt und != "all"', async () => {
    fetchMock.mockResolvedValueOnce(
      graphqlOk({ Page: { pageInfo: { total: 0, hasNextPage: false }, media: [] } })
    );
    await discoverManga('popular', 1, 20, 'KR');
    expect(lastBody().variables.countryOfOrigin).toBe('KR');
  });

  it('lässt countryOfOrigin weg bei "all"', async () => {
    fetchMock.mockResolvedValueOnce(
      graphqlOk({ Page: { pageInfo: { total: 0, hasNextPage: false }, media: [] } })
    );
    await discoverManga('popular', 1, 20, 'all');
    expect(lastBody().variables).not.toHaveProperty('countryOfOrigin');
  });

  it('lässt countryOfOrigin weg, wenn undefined', async () => {
    fetchMock.mockResolvedValueOnce(
      graphqlOk({ Page: { pageInfo: { total: 0, hasNextPage: false }, media: [] } })
    );
    await discoverManga('trending');
    expect(lastBody().variables).not.toHaveProperty('countryOfOrigin');
  });

  it('propagiert Fehler', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) });
    await expect(discoverManga('trending')).rejects.toThrow('AniList API error: 500');
  });
});
