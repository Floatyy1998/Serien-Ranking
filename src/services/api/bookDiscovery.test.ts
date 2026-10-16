import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const staticShelf = vi.hoisted(() => vi.fn());

vi.mock('./bookStatic', () => ({ loadStaticShelf: staticShelf }));
vi.mock('../i18n', () => ({ appLocale: 'de' }));

const doc = (key: string, title: string, author: string) => ({
  key: `/works/${key}`,
  title,
  author_name: [author],
  cover_i: 1,
  readinglog_count: 100,
  ratings_average: 4.4567,
  ratings_count: 33,
});

const staticItem = (n: number) => ({
  id: `ol-OL${n}W`,
  title: `Buch ${n}`,
  authors: ['A'],
  source: 'openlibrary',
});

describe('fetchShelf', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.resetModules();
    staticShelf.mockReset();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ docs: [doc('OL1W', 'Mort', 'Terry Pratchett')] }),
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const query = () => new URL(fetchMock.mock.calls[0][0] as string).searchParams;

  it('nimmt das vorberechnete Variantenregal, wenn es genug Bücher hat', async () => {
    staticShelf.mockResolvedValue(Array.from({ length: 10 }, (_, i) => staticItem(i)));
    const { fetchShelf } = await import('./bookDiscovery');
    const list = await fetchShelf('fantasy', { sort: 'gems', limit: 4 });
    expect(staticShelf).toHaveBeenCalledWith('fantasy:gems');
    expect(list).toHaveLength(4);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fragt ohne Tagesexport live nach Bewertung sortiert und übernimmt Sterne', async () => {
    staticShelf.mockResolvedValue(null);
    const { fetchShelf } = await import('./bookDiscovery');
    const [first] = await fetchShelf('fantasy', { sort: 'top' });
    expect(query().get('sort')).toBe('rating');
    expect(query().get('q')).toBe('subject:fantasy ratings_count:[15 TO *] language:ger');
    expect(first.avgRating).toBe(4.5);
    expect(first.ratingCount).toBe(33);
  });

  it('ersetzt bei einem Untergenre die Genre-Abfrage und geht immer live', async () => {
    const { fetchShelf } = await import('./bookDiscovery');
    await fetchShelf('horror', { sort: 'gems', theme: 'ghosts' });
    expect(staticShelf).not.toHaveBeenCalled();
    expect(query().get('q')).toBe(
      'subject:horror subject:ghosts readinglog_count:[15 TO 800] ratings_count:[4 TO *] language:ger'
    );
  });

  it('holt Folgeseiten live mit Versatz und meldet das Ende', async () => {
    const { fetchShelfPage, SHELF_PAGE_SIZE } = await import('./bookDiscovery');
    const { items, done } = await fetchShelfPage('fantasy', { sort: 'gems' }, 2);
    expect(staticShelf).not.toHaveBeenCalled();
    expect(query().get('offset')).toBe(String(2 * SHELF_PAGE_SIZE));
    expect(query().get('limit')).toBe(String(SHELF_PAGE_SIZE));
    expect(query().get('sort')).toBe('rating');
    expect(items).toHaveLength(1);
    expect(done).toBe(true);
  });

  it('grenzt die Zielgruppe ein und geht dafür immer live, auch auf Folgeseiten', async () => {
    staticShelf.mockResolvedValue(Array.from({ length: 10 }, (_, i) => staticItem(i)));
    const { fetchShelf, fetchShelfPage } = await import('./bookDiscovery');
    await fetchShelf('fantasy', { sort: 'top', audience: 'adult' });
    expect(staticShelf).not.toHaveBeenCalled();
    expect(query().get('q')).toBe(
      'subject:fantasy -subject:juvenile_fiction -subject:young_adult_fiction ratings_count:[15 TO *] language:ger'
    );
    fetchMock.mockClear();
    await fetchShelfPage('romance', { sort: 'top', audience: 'young' }, 1);
    expect(query().get('q')).toBe(
      'subject:romance (subject:juvenile_fiction OR subject:young_adult_fiction) ratings_count:[15 TO *] language:ger'
    );
  });

  it('lässt die Zielgruppe bei Young Adult und Sachbuch weg', async () => {
    staticShelf.mockResolvedValue(null);
    const { fetchShelf } = await import('./bookDiscovery');
    await fetchShelf('ya', { audience: 'adult' });
    expect(staticShelf).toHaveBeenCalledWith('ya');
    expect(query().get('q')).toBe('subject:young_adult_fiction language:ger');
  });

  it('ignoriert unbekannte Untergenres', async () => {
    staticShelf.mockResolvedValue(null);
    const { fetchShelf } = await import('./bookDiscovery');
    await fetchShelf('fantasy', { theme: 'gibtsnicht' });
    expect(staticShelf).toHaveBeenCalledWith('fantasy');
    expect(query().get('q')).toBe('subject:fantasy language:ger');
  });
});
