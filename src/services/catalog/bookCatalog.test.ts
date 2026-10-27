// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const backend = vi.hoisted(() => ({
  fetch: vi.fn(async () => new Response('{}')),
  session: true,
}));

vi.mock('../api/backendApi', () => ({
  backendFetch: backend.fetch,
  hasBackendSession: () => backend.session,
}));
vi.mock('../i18n', () => ({ appLocale: 'de' }));

import {
  describeFromCatalog,
  keepInCatalog,
  loadBookCatalogItem,
  searchBookCatalog,
} from './bookCatalog';

const INDEX = {
  v: 7,
  n: 2,
  items: [
    {
      id: 'hc-1',
      t: 'Onyx Storm',
      a: ['Rebecca Yarros'],
      y: 2025,
      i: '9783423284318',
      c: 1,
      v: 100,
    },
    { id: 'ol-OL2W', t: 'Der Hobbit', a: ['J. R. R. Tolkien'], v: 90 },
  ],
};
const ITEMS: Record<string, unknown> = {
  'hc-1': {
    id: 'hc-1',
    title: 'Onyx Storm',
    authors: ['Rebecca Yarros'],
    cover: 'https://serienapi.konrad-dinges.de/bookcover/book/hc-1-L.jpg?v=100',
    hardcoverId: 1,
    pageCount: 500,
    v: 100,
    coverSrc: ['https://assets.hardcover.app/x.jpg'],
    adds: 3,
    addedAt: '2026-10-27T00:00:00.000Z',
  },
  'ol-OL2W': {
    id: 'ol-OL2W',
    title: 'Der Hobbit',
    authors: ['J. R. R. Tolkien'],
    olWorkId: 'OL2W',
    v: 90,
  },
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const fetchMock = vi.fn(async (url: string) => {
  if (url.endsWith('/books/version')) return json({ version: 7, count: 2 });
  if (url.includes('/catalog/books/index.json?v=7')) return json(INDEX);
  const item = /\/catalog\/books\/items\/([^.]+)\.json\?v=\d+/.exec(url);
  if (item && ITEMS[item[1]]) return json(ITEMS[item[1]]);
  return json({ error: 'nope' }, 404);
});

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  backend.session = true;
});

afterEach(() => {
  vi.unstubAllGlobals();
  backend.fetch.mockClear();
});

describe('Bücher-Katalog', () => {
  it('findet Katalog-Bücher per Titel und liefert den vollen Eintrag ohne interne Felder', async () => {
    const hits = await searchBookCatalog('onyx');
    expect(hits.map((h) => h.id)).toEqual(['hc-1']);
    const [hit] = hits;
    expect(hit.pageCount).toBe(500);
    expect(hit.source).toBe('hardcover');
    expect(hit.cover).toContain('/bookcover/book/hc-1-L.jpg');
    expect(hit).not.toHaveProperty('coverSrc');
    expect(hit).not.toHaveProperty('adds');
    expect(fetchMock.mock.calls.map(([u]) => u)).toContainEqual(
      expect.stringContaining('/catalog/books/items/hc-1.json?v=100')
    );
  });

  it('trifft per ISBN exakt und ohne Titelvergleich', async () => {
    const hits = await searchBookCatalog('978-3-423-28431-8');
    expect(hits.map((h) => h.id)).toEqual(['hc-1']);
  });

  it('leitet die Quelle aus den IDs ab, wenn der Eintrag keine nennt', async () => {
    const hits = await searchBookCatalog('hobbit tolkien');
    expect(hits).toHaveLength(1);
    expect(hits[0].source).toBe('openlibrary');
    expect(hits[0].authors).toEqual(['J. R. R. Tolkien']);
  });

  it('liefert null für Bücher, die der Katalog nicht kennt', async () => {
    await expect(loadBookCatalogItem('gb-unbekannt')).resolves.toBeNull();
  });

  it('schickt beim Hinzufügen nur Buchfelder an den Katalog, keine Bewertungen', () => {
    keepInCatalog({
      id: 'hc-9',
      title: 'Fourth Wing',
      authors: ['Rebecca Yarros'],
      cover: 'https://assets.hardcover.app/y.jpg',
      hardcoverId: 9,
      avgRating: 4.4,
      popularity: 1200,
      source: 'hardcover',
    });
    expect(backend.fetch).toHaveBeenCalledTimes(1);
    const [path, init] = backend.fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(path).toBe('/books/add');
    const body = JSON.parse(String(init.body)) as { lang: string; book: Record<string, unknown> };
    expect(body.lang).toBe('de');
    expect(body.book.hardcoverId).toBe(9);
    expect(body.book).not.toHaveProperty('avgRating');
    expect(body.book).not.toHaveProperty('popularity');
  });

  it('ruft den Katalog ohne Anmeldung gar nicht erst', () => {
    backend.session = false;
    keepInCatalog({ id: 'hc-9', title: 'Fourth Wing' });
    expect(backend.fetch).not.toHaveBeenCalled();
  });

  it('holt die Beschreibung in App-Sprache aus dem Katalog und merkt sie sich', async () => {
    backend.fetch.mockResolvedValueOnce(json({ text: 'Harry erfährt …', source: 'ai' }));
    const first = await describeFromCatalog('hc-1', 'de');
    expect(first).toEqual({ text: 'Harry erfährt …', capped: false, translated: true });
    const [path, init] = backend.fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(path).toBe('/books/describe');
    expect(JSON.parse(String(init.body))).toEqual({ id: 'hc-1', lang: 'de' });
    const second = await describeFromCatalog('hc-1', 'de');
    expect(second.text).toBe('Harry erfährt …');
    expect(backend.fetch).toHaveBeenCalledTimes(1);
  });

  it('meldet ein leeres Tagesbudget als capped, ohne es zu cachen', async () => {
    backend.fetch.mockResolvedValueOnce(json({ text: null, reason: 'cap' }));
    expect(await describeFromCatalog('hc-2', 'de')).toEqual({
      text: null,
      capped: true,
      translated: false,
    });
    backend.fetch.mockResolvedValueOnce(json({ text: 'Jetzt da', source: 'catalog' }));
    expect((await describeFromCatalog('hc-2', 'de')).text).toBe('Jetzt da');
  });
});
