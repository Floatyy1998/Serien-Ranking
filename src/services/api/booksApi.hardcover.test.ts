// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BookSearchResult } from '../../types/Book';

const hc = vi.hoisted(() => ({
  ready: true,
  search: vi.fn(),
  isbn: vi.fn(),
  details: vi.fn(),
}));

vi.mock('../i18n', () => ({ appLocale: 'de' }));
vi.mock('../catalog/bookCatalog', () => ({ searchBookCatalog: async () => [] }));
vi.mock('./hardcoverApi', () => ({
  hardcoverReady: () => hc.ready,
  hardcoverSearch: hc.search,
  hardcoverIsbn: hc.isbn,
  hardcoverDetails: hc.details,
  hardcoverBrowse: vi.fn(),
  hardcoverAuthorBooks: vi.fn(),
}));

import { findBook, getBookDetails, searchBooks } from './booksApi';

const hit = (over: Partial<BookSearchResult>): BookSearchResult => ({
  id: 'hc-1',
  hardcoverId: 1,
  title: 'Fourth Wing',
  authors: ['Rebecca Yarros'],
  cover: 'https://serienapi.konrad-dinges.de/bookcover/hc/x.jpg',
  language: 'de',
  source: 'hardcover',
  popularity: 8000,
  ...over,
});

const DNB_RECORD = `<?xml version="1.0" encoding="UTF-8"?>
<searchRetrieveResponse xmlns="http://www.loc.gov/zing/srw/"><records><record><recordData>
<record xmlns="http://www.loc.gov/MARC21/slim" type="Bibliographic">
  <datafield tag="100" ind1="1" ind2=" "><subfield code="a">Yarros, Rebecca</subfield><subfield code="4">aut</subfield></datafield>
  <datafield tag="245" ind1="1" ind2="0"><subfield code="a">Fourth Wing</subfield></datafield>
  <datafield tag="250" ind1=" " ind2=" "><subfield code="a">3. Auflage</subfield></datafield>
  <datafield tag="300" ind1=" " ind2=" "><subfield code="a">762 S.</subfield></datafield>
</record></recordData></record></records></searchRetrieveResponse>`;

const olDocs = (titles: string[]) => ({
  docs: titles.map((title, i) => ({
    key: `/works/OL${i}W`,
    title,
    author_name: ['Rebecca Yarros'],
    cover_i: 5,
  })),
});

const route = (handlers: { ol?: unknown; dnb?: string }) =>
  vi.fn(async (url: string) => {
    if (url.includes('services.dnb.de')) return new Response(handlers.dnb ?? '<x/>');
    if (url.includes('openlibrary.org')) {
      return new Response(JSON.stringify(handlers.ol ?? { docs: [] }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response('{}', { status: 404 });
  });

describe('Buchsuche mit Hardcover als erster Quelle', () => {
  beforeEach(() => {
    localStorage.clear();
    hc.ready = true;
    hc.search.mockReset();
    hc.isbn.mockReset();
    hc.details.mockReset();
    vi.stubEnv('VITE_GOOGLE_BOOKS_API_KEY', '');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('antwortet aus Hardcover, ohne Open Library zu fragen', async () => {
    hc.search.mockResolvedValue([
      hit({}),
      hit({ id: 'hc-2', hardcoverId: 2, title: 'Iron Flame' }),
    ]);
    const fetchMock = route({});
    vi.stubGlobal('fetch', fetchMock);
    const results = await searchBooks('fourth wing');
    expect(results[0].title).toBe('Fourth Wing');
    expect(results[0].source).toBe('hardcover');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fällt auf Open Library zurück, wenn Hardcover ausfällt', async () => {
    hc.search.mockRejectedValue(new Error('budget'));
    vi.stubGlobal('fetch', route({ ol: olDocs(['Iron Flame']) }));
    const results = await searchBooks('iron flame');
    expect(results[0].source).toBe('openlibrary');
  });

  it('ergänzt angefangene Wörter aus Open Library, die Hardcover nicht findet', async () => {
    hc.search.mockResolvedValue([
      hit({ id: 'hc-9', hardcoverId: 9, title: 'König Heinrich IV.', authors: ['Shakespeare'] }),
    ]);
    vi.stubGlobal('fetch', route({ ol: olDocs(['Fourth Wing']) }));
    const results = await searchBooks('fourth wi');
    expect(results.map((r) => r.title)).toContain('Fourth Wing');
  });

  it('fragt bei pausiertem Hardcover gar nicht erst', async () => {
    hc.ready = false;
    vi.stubGlobal('fetch', route({ ol: olDocs(['Onyx Storm']) }));
    await searchBooks('onyx storm');
    expect(hc.search).not.toHaveBeenCalled();
  });

  it('nimmt für die ISBN Hardcover und ergänzt Auflage aus der DNB', async () => {
    hc.isbn.mockResolvedValue(hit({ isbn13: '9783423283403', pageCount: undefined }));
    const fetchMock = route({ dnb: DNB_RECORD });
    vi.stubGlobal('fetch', fetchMock);
    const [found] = await searchBooks('9783423283403');
    expect(found.source).toBe('hardcover');
    expect(found.edition).toBe('3. Auflage');
    expect(found.pageCount).toBe(762);
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('openlibrary.org'))).toBe(
      false
    );
  });

  it('versucht bei unbekannter ISBN Open Library und die DNB', async () => {
    hc.isbn.mockResolvedValue(null);
    const fetchMock = route({ dnb: DNB_RECORD, ol: olDocs(['Fourth Wing']) });
    vi.stubGlobal('fetch', fetchMock);
    const [found] = await searchBooks('9783423283830');
    expect(found).toBeTruthy();
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('openlibrary.org'))).toBe(
      true
    );
  });

  it('holt Details über die Hardcover-ID', async () => {
    hc.details.mockResolvedValue({ description: 'Ein Drachenreiter-Epos.', pageCount: 762 });
    const details = await getBookDetails({ hardcoverId: 1 });
    expect(details?.description).toBe('Ein Drachenreiter-Epos.');
    expect(hc.details).toHaveBeenCalledWith(1);
  });

  it('merkt sich einen Fehltreffer im Hintergrund, solange Hardcover erreichbar ist', async () => {
    hc.search.mockResolvedValue([]);
    vi.stubGlobal('fetch', route({}));
    expect(await findBook('Unbekannt', 'Niemand')).toBeNull();
    const calls = hc.search.mock.calls.length;
    expect(await findBook('Unbekannt', 'Niemand')).toBeNull();
    expect(hc.search.mock.calls.length).toBe(calls);
  });
});
