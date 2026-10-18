import { describe, expect, it } from 'vitest';
import type { Book } from '../../types/Book';
import type { Manga } from '../../types/Manga';
import {
  buildLibrary,
  collectLibraryGenres,
  countByStatus,
  filterLibrary,
  groupByYear,
  itemHref,
  libraryHref,
  mediumOptions,
  readLibraryPrefs,
  shelfBooks,
  sortLibrary,
  type LibraryQuery,
} from './library';

const book = (over: Partial<Book>): Book => ({
  id: over.title ?? 'b',
  title: 'Buch',
  authors: [],
  status: 'planned',
  currentPage: 0,
  addedAt: '2026-01-01T00:00:00.000Z',
  ...over,
});

const manga = (over: Partial<Manga>): Manga => ({
  nmr: 1,
  anilistId: 1,
  title: 'Manga',
  poster: 'p.jpg',
  rating: {},
  currentChapter: 0,
  readStatus: 'planned',
  ...over,
});

const lib = (over: {
  books?: Book[];
  hiddenBooks?: Book[];
  manga?: Manga[];
  hiddenManga?: Manga[];
}) =>
  buildLibrary({
    books: over.books ?? [],
    hiddenBooks: over.hiddenBooks ?? [],
    manga: over.manga ?? [],
    hiddenManga: over.hiddenManga ?? [],
    showBooks: true,
    showManga: true,
    uid: 'u1',
  });

const query = (over: Partial<LibraryQuery> = {}): LibraryQuery => ({
  status: 'all',
  medium: 'all',
  query: '',
  genre: null,
  sort: 'title',
  flip: false,
  ...over,
});

const titles = (items: { title: string }[]) => items.map((i) => i.title);

describe('reading library', () => {
  it('lässt Bereiche weg, die man nicht nutzt', () => {
    const items = buildLibrary({
      books: [book({ title: 'Dune' })],
      hiddenBooks: [],
      manga: [manga({ title: 'Berserk' })],
      hiddenManga: [],
      showBooks: false,
      showManga: true,
      uid: 'u1',
    });
    expect(titles(items)).toEqual(['Berserk']);
  });

  it('zählt Status über Bücher und Manga, Ausgeblendetes nur unter „hidden"', () => {
    const items = lib({
      books: [
        book({ title: 'A', status: 'reading', ownedAt: '2026-01-01' }),
        book({ title: 'B', status: 'completed' }),
      ],
      hiddenBooks: [book({ title: 'C', status: 'reading', hidden: true })],
      manga: [manga({ anilistId: 2, readStatus: 'reading' })],
      hiddenManga: [manga({ anilistId: 3, readStatus: 'dropped', hidden: true })],
    });
    const counts = countByStatus(items);
    expect(counts.all).toBe(3);
    expect(counts.reading).toBe(2);
    expect(counts.completed).toBe(1);
    expect(counts.dropped).toBe(0);
    expect(counts.owned).toBe(1);
    expect(counts.hidden).toBe(2);
  });

  it('bietet Medium-Chips nur, wenn es etwas zu unterscheiden gibt', () => {
    expect(mediumOptions(lib({ books: [book({})] }))).toEqual([]);
    expect(mediumOptions(lib({ books: [book({})], manga: [manga({})] }))).toEqual([
      'all',
      'books',
      'manga',
    ]);
    expect(
      mediumOptions(lib({ manga: [manga({}), manga({ anilistId: 2, countryOfOrigin: 'KR' })] }))
    ).toEqual(['all', 'manhwa']);
  });

  it('filtert nach Medium, Manga umfasst Manhwa', () => {
    const items = lib({
      books: [book({ title: 'Dune' })],
      manga: [
        manga({ title: 'Berserk' }),
        manga({ anilistId: 2, title: 'Solo Leveling', countryOfOrigin: 'KR' }),
      ],
    });
    expect(titles(filterLibrary(items, query({ medium: 'books' })))).toEqual(['Dune']);
    expect(titles(filterLibrary(items, query({ medium: 'manga' })))).toEqual([
      'Berserk',
      'Solo Leveling',
    ]);
    expect(titles(filterLibrary(items, query({ medium: 'manhwa' })))).toEqual(['Solo Leveling']);
  });

  it('sucht in Titel, Autor und Alternativtiteln', () => {
    const items = lib({
      books: [book({ title: 'Der Hobbit', authors: ['J. R. R. Tolkien'] })],
      manga: [manga({ title: 'Shingeki no Kyojin', titleEnglish: 'Attack on Titan' })],
    });
    expect(titles(filterLibrary(items, query({ query: 'tolkien' })))).toEqual(['Der Hobbit']);
    expect(titles(filterLibrary(items, query({ query: 'attack titan' })))).toEqual([
      'Shingeki no Kyojin',
    ]);
    expect(filterLibrary(items, query({ query: 'nichts' }))).toEqual([]);
  });

  it('vereint Genres aus Büchern und Manga', () => {
    const items = lib({
      books: [book({ title: 'Dune', categories: ['Fiction / Science Fiction'] })],
      manga: [manga({ genres: ['Sci-Fi', 'Action'] })],
    });
    const genres = collectLibraryGenres(items);
    expect(genres[0]).toMatchObject({ key: 'sci-fi', count: 2 });
    expect(titles(filterLibrary(items, query({ genre: 'sci-fi' })))).toHaveLength(2);
    expect(titles(filterLibrary(items, query({ genre: 'action' })))).toEqual(['Manga']);
  });

  it('sortiert nach Bewertung über beide Medien und kehrt um', () => {
    const items = lib({
      books: [book({ title: 'Mittel', rating: 6 })],
      manga: [manga({ title: 'Top', rating: { u1: 9 } }), manga({ anilistId: 2, title: 'Ohne' })],
    });
    expect(titles(sortLibrary(items, 'rating', false))).toEqual(['Top', 'Mittel', 'Ohne']);
    expect(titles(sortLibrary(items, 'rating', true))).toEqual(['Ohne', 'Mittel', 'Top']);
  });

  it('stellt Manga ohne Autor beim Autor-Sortieren immer nach hinten', () => {
    const items = lib({
      books: [book({ title: 'Z', authors: ['Adams'] }), book({ title: 'Y', authors: ['Zola'] })],
      manga: [manga({ title: 'Berserk' })],
    });
    expect(titles(sortLibrary(items, 'author', false))).toEqual(['Z', 'Y', 'Berserk']);
    expect(titles(sortLibrary(items, 'author', true))).toEqual(['Y', 'Z', 'Berserk']);
  });

  it('sortiert nach letzter Aktivität, Titel ohne Artikel bei Gleichstand', () => {
    const items = lib({
      books: [book({ title: 'Der Alte', lastReadAt: '2026-03-01' })],
      manga: [manga({ title: 'Neu', lastReadAt: '2026-05-01', addedAt: '2026-01-01' })],
    });
    expect(titles(sortLibrary(items, 'recent', false))).toEqual(['Neu', 'Der Alte']);
    expect(
      titles(
        sortLibrary(
          lib({ books: [book({ title: 'Der Zug' }), book({ title: 'Bahn' })] }),
          'title',
          false
        )
      )
    ).toEqual(['Bahn', 'Der Zug']);
  });

  it('gruppiert Beendetes nach Jahr, ohne Datum ans Ende', () => {
    const items = lib({
      books: [
        book({ title: 'A', status: 'completed', completedAt: '2025-05-01' }),
        book({ title: 'B', status: 'completed' }),
      ],
      manga: [manga({ title: 'C', readStatus: 'completed', completedAt: '2026-02-01' })],
    });
    expect(groupByYear(items, 'Früher').map(([y, list]) => [y, titles(list)])).toEqual([
      ['2026', ['C']],
      ['2025', ['A']],
      ['Früher', ['B']],
    ]);
  });

  it('macht aus Manga Buchrücken, die auf den Manga zeigen', () => {
    const items = lib({
      books: [book({ id: 'b 1', title: 'Dune' })],
      manga: [manga({ anilistId: 7, title: 'Berserk', volumes: 2, rating: { u1: 8 } })],
    });
    const spines = shelfBooks(items);
    expect(spines.map((b) => b.id)).toEqual(['b 1', 'manga-7']);
    expect(spines[1]).toMatchObject({ title: 'Berserk', pageCount: 380, rating: 8 });
    expect(libraryHref(spines[0])).toBe('/books/b%201');
    expect(libraryHref(spines[1])).toBe('/manga/7');
    expect(itemHref(items[1])).toBe('/manga/7');
  });

  it('übernimmt alte Sortierung und Ansicht beim ersten Mal', () => {
    const store = (values: Record<string, string>) => (key: string) => values[key] ?? null;
    expect(readLibraryPrefs(store({}))).toEqual({ sort: 'recent', flip: false, view: null });
    expect(readLibraryPrefs(store({ bookShelfSort: 'author:1', bookShelfView: 'grid' }))).toEqual({
      sort: 'author',
      flip: true,
      view: 'grid',
    });
    expect(
      readLibraryPrefs(store({ mangaCollectionPrefs: '{"sort":"progress","status":"all"}' }))
    ).toEqual({ sort: 'progress', flip: false, view: 'grid' });
    expect(
      readLibraryPrefs(
        store({
          readingLibrarySort: 'pages:0',
          readingLibraryView: 'shelf',
          bookShelfSort: 'author:1',
        })
      )
    ).toEqual({ sort: 'pages', flip: false, view: 'shelf' });
  });
});
