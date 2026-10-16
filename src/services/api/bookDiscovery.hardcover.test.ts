// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BookSearchResult } from '../../types/Book';

const hc = vi.hoisted(() => ({ browse: vi.fn(), author: vi.fn() }));
const staticShelf = vi.hoisted(() => vi.fn());

vi.mock('./bookStatic', () => ({ loadStaticShelf: staticShelf }));
vi.mock('../i18n', () => ({ appLocale: 'de' }));
vi.mock('./hardcoverApi', () => ({
  hardcoverReady: () => true,
  hardcoverBrowse: hc.browse,
  hardcoverAuthorBooks: hc.author,
}));

const book = (n: number, over: Partial<BookSearchResult> = {}): BookSearchResult => ({
  id: `hc-${n}`,
  hardcoverId: n,
  title: `Buch ${n}`,
  authors: [`Autor ${n}`],
  cover: `https://serienapi.konrad-dinges.de/bookcover/hc/${n}.jpg`,
  source: 'hardcover',
  ...over,
});

describe('Stöbern über Hardcover', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    hc.browse.mockReset();
    hc.author.mockReset();
    staticShelf.mockReset();
    staticShelf.mockResolvedValue(null);
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ docs: [] }) });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fragt Untergenre, Zielgruppe und Sortierung beim Server und lässt Bücher ohne Cover weg', async () => {
    hc.browse.mockResolvedValue({
      items: [
        ...Array.from({ length: 9 }, (_, i) => book(i + 1)),
        book(50, { cover: undefined }),
        book(51, { title: 'Buch 1', authors: ['Autor 1'] }),
      ],
      done: false,
    });
    const { fetchShelf } = await import('./bookDiscovery');
    const list = await fetchShelf('fantasy', {
      sort: 'gems',
      theme: 'dragons',
      audience: 'adult',
      limit: 24,
    });
    expect(hc.browse).toHaveBeenCalledWith(
      expect.objectContaining({
        shelf: 'fantasy',
        sort: 'gems',
        theme: 'dragons',
        audience: 'adult',
        page: 1,
      })
    );
    expect(list).toHaveLength(9);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('nimmt zuerst das vorberechnete Regal, ohne den Server zu fragen', async () => {
    staticShelf.mockResolvedValue(Array.from({ length: 10 }, (_, i) => book(i + 1)));
    const { fetchShelf } = await import('./bookDiscovery');
    const list = await fetchShelf('thriller', { sort: 'top', limit: 5 });
    expect(list).toHaveLength(5);
    expect(hc.browse).not.toHaveBeenCalled();
  });

  it('fällt auf Open Library zurück, wenn Hardcover zu wenig oder nichts liefert', async () => {
    hc.browse.mockResolvedValue({ items: [book(1)], done: true });
    const { fetchShelf } = await import('./bookDiscovery');
    await fetchShelf('horror', { sort: 'popular' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain('openlibrary.org');
  });

  it('holt Folgeseiten als Hardcover-Seite n + 1', async () => {
    hc.browse.mockResolvedValue({ items: [book(1), book(2)], done: true });
    const { fetchShelfPage } = await import('./bookDiscovery');
    const page = await fetchShelfPage('romance', { sort: 'top' }, 1);
    expect(hc.browse).toHaveBeenCalledWith(expect.objectContaining({ page: 2, sort: 'top' }));
    expect(page).toEqual({ items: expect.any(Array), done: true });
    expect(page.items).toHaveLength(2);
  });

  it('nimmt weitere Bücher des Autors aus Hardcover, ohne das gerade gezeigte', async () => {
    hc.author.mockResolvedValue([
      book(1, { title: 'Fourth Wing', authors: ['Rebecca Yarros'] }),
      book(2, { title: 'Iron Flame', authors: ['Rebecca Yarros'] }),
      book(3, { title: 'Onyx Storm', authors: ['Rebecca Yarros'] }),
      book(4, { title: 'Threshing Day', authors: ['Rebecca Yarros'] }),
    ]);
    const { fetchMoreByAuthor } = await import('./bookDiscovery');
    const list = await fetchMoreByAuthor('Rebecca Yarros', 'Fourth Wing');
    expect(list.map((b) => b.title)).toEqual(['Iron Flame', 'Onyx Storm', 'Threshing Day']);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('Katalog-Genres über Hardcover', () => {
  beforeEach(() => {
    vi.resetModules();
    hc.browse.mockReset();
  });

  it('holt Genre, Stimmung und Sortierung seitenweise und lässt Bücher ohne Cover weg', async () => {
    hc.browse.mockResolvedValue({
      items: [
        book(1),
        book(2, { cover: undefined }),
        book(3, { title: 'Buch 1', authors: ['Autor 1'] }),
      ],
      done: false,
    });
    const { fetchCatalogPage } = await import('./bookDiscovery');
    const page = await fetchCatalogPage('horror', { mood: 'dark', sort: 'top' }, 2);
    expect(hc.browse).toHaveBeenCalledWith({
      genre: 'horror',
      mood: 'dark',
      sort: 'top',
      audience: undefined,
      page: 2,
    });
    expect(page.items.map((b) => b.id)).toEqual(['hc-1']);
    expect(page.done).toBe(false);
  });

  it('merkt sich Seiten im Arbeitsspeicher', async () => {
    hc.browse.mockResolvedValue({ items: [book(1)], done: true });
    const { fetchCatalogPage } = await import('./bookDiscovery');
    await fetchCatalogPage('poetry', {}, 1);
    await fetchCatalogPage('poetry', {}, 1);
    expect(hc.browse).toHaveBeenCalledTimes(1);
  });
});
