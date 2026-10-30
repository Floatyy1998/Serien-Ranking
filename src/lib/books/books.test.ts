import { describe, expect, it } from 'vitest';
import type { Book } from '../../types/Book';
import { eventPages, readingStreak, type CompactBookEvent } from './bookEvents';
import {
  bookMatchKey,
  bookTitleKey,
  createBookIndex,
  findMangaForBook,
  isSameBookIdentity,
  looksLikeIsbn,
  pickIsbn13,
  sameBookAuthors,
  toIsbn13,
} from './bookIdentity';
import { applyPageUpdate, applyStatusChange, pagesReadOf, progressPercent } from './bookProgress';
import { coverAtSize, directCoverAtSize, mapOpenLibraryDoc } from './bookSearchMapping';
import { alignSeriesKey, findNextVolume, normalizeSeriesParts, partPositionOf } from './bookSeries';
import { bookTotals, computeBookYearStats, goalPace } from './bookStats';
import { guessLanguage, htmlToPlainText } from './bookText';
import {
  computeReadingTaste,
  genresFromCategories,
  hasReadingTaste,
  tasteGenres,
} from './readingTaste';
import { buildImportPreview, parseCsv, splitSeriesFromTitle } from './goodreadsCsv';

const book = (over: Partial<Book> = {}): Book => ({
  id: 'b1',
  title: 'Der Schwarm',
  authors: ['Frank Schätzing'],
  status: 'reading',
  currentPage: 100,
  pageCount: 300,
  addedAt: '2026-01-01T12:00:00.000Z',
  ...over,
});

describe('bookIdentity', () => {
  it('wandelt ISBN-10 in ISBN-13 um und bevorzugt deutsche Ausgaben', () => {
    expect(toIsbn13('3423262648')).toBe('9783423262644');
    expect(toIsbn13('978-3-423-26264-4')).toBe('9783423262644');
    expect(toIsbn13('abc')).toBeUndefined();
    expect(pickIsbn13(['9780316029186', '3423262648'])).toBe('9783423262644');
    expect(looksLikeIsbn('978 3423 262644')).toBe(true);
    expect(looksLikeIsbn('Hexer')).toBe(false);
  });

  it('erkennt dasselbe Buch über Ausgaben hinweg', () => {
    expect(bookMatchKey('Der Schwarm: Roman', ['Frank Schätzing'])).toBe(
      bookMatchKey('Der Schwarm', ['F. Schätzing'])
    );
  });

  it('gleicht Bandangaben an, ohne verschiedene Bände zu verschmelzen', () => {
    expect(bookTitleKey('One Piece, Band 105')).toBe('one piece 105');
    expect(bookTitleKey('One Piece 105')).toBe('one piece 105');
    expect(bookTitleKey('One Piece: Bd. 105')).toBe('one piece 105');
    expect(bookTitleKey('Jujutsu Kaisen – Band 20')).toBe('jujutsu kaisen 20');
    expect(bookTitleKey('One Piece: Band 104')).not.toBe(bookTitleKey('One Piece 105'));
    expect(bookTitleKey('Der Schwarm: Roman')).toBe('der schwarm');
  });

  it('nimmt die Bandnummer auch vom Ende des Untertitels (deutsche Manga-Ausgaben)', () => {
    const band2 = 'Requiem of the rose king: die Königin und der Ritter der Rose 2';
    const band1 = 'Requiem of the rose king: die Königin und der Ritter der Rose 1';
    expect(bookTitleKey(band2)).toBe('requiem of the rose king 2');
    expect(bookTitleKey(band2)).not.toBe(bookTitleKey(band1));
    expect(bookTitleKey(band2)).toBe(bookTitleKey('Requiem of the Rose King, Vol. 2'));
    expect(bookMatchKey(band2, ['Aya Kanno'])).not.toBe(bookMatchKey(band1, ['Aya Kanno']));
    expect(bookTitleKey('Chernobyl: Die Katastrophe 1986')).toBe('chernobyl');
  });
});

describe('isSameBookIdentity', () => {
  // Gemeldete Dublette (Ticket 30.10.2026): DNB nennt das Zeichenstudio, Google die Autorin in anderer Reihenfolge
  const dnb = {
    id: 'dnb-9783551630315',
    title: 'Marry my husband 7',
    authors: ['Studio LICO'],
    isbn13: '9783551630315',
  };
  const google = { id: 'gb-abc', title: 'Marry My Husband 7', authors: ['Sojak Sung'] };

  it('gleicht Beteiligte über Namensreihenfolge und Mitwirkende ab', () => {
    expect(sameBookAuthors(['Sung Sojak'], ['Sojak Sung'])).toBe(true);
    expect(sameBookAuthors(['Studio LICO', 'Sung Sojak'], ['Sojak Sung'])).toBe(true);
    expect(sameBookAuthors(['Frank Herbert'], ['Brian Herbert'])).toBe(true);
    expect(sameBookAuthors(['Studio LICO'], ['Studio Pierrot'])).toBe(false);
    expect(sameBookAuthors([], ['Irgendwer'])).toBe(true);
  });

  it('erkennt einen Reihenband auch mit anders genannten Beteiligten', () => {
    expect(isSameBookIdentity(dnb, google)).toBe(true);
    expect(isSameBookIdentity(dnb, { ...google, title: 'Marry My Husband 6' })).toBe(false);
    expect(isSameBookIdentity(dnb, { ...google, title: 'Marry My Husband, Vol. 7' })).toBe(true);
  });

  it('hält gleichnamige Bücher ohne Band und ohne gemeinsamen Beteiligten auseinander', () => {
    const dune = { id: 'a', title: 'Dune', authors: ['Frank Herbert'] };
    expect(isSameBookIdentity(dune, { id: 'b', title: 'Dune', authors: ['Hugh Howey'] })).toBe(
      false
    );
    expect(isSameBookIdentity(dune, { id: 'b', title: 'Dune: Roman', authors: [] })).toBe(true);
    expect(isSameBookIdentity(dune, { id: 'b', title: 'Dune', authors: ['F. Herbert'] })).toBe(
      true
    );
  });

  it('nimmt gleiche ISBN oder Hardcover-ID unabhängig vom Titel', () => {
    expect(isSameBookIdentity(dnb, { title: 'Ganz anders', isbn13: '9783551630315' })).toBe(true);
    expect(isSameBookIdentity({ title: 'A', hardcoverId: 7 }, { title: 'B', hardcoverId: 7 })).toBe(
      true
    );
    expect(isSameBookIdentity({ title: 'A', hardcoverId: 7 }, { title: 'B', hardcoverId: 8 })).toBe(
      false
    );
  });

  it('createBookIndex findet das eigene Buch über ID, ISBN und Titel samt Band', () => {
    const index = createBookIndex([dnb, { id: 'x', title: 'Dune', authors: ['Frank Herbert'] }]);
    expect(index.find(google)?.id).toBe('dnb-9783551630315');
    expect(index.find({ title: 'Egal', isbn13: '9783551630315' })?.id).toBe('dnb-9783551630315');
    expect(index.find({ id: 'x', title: '' })?.id).toBe('x');
    expect(index.has({ title: 'Dune', authors: ['Hugh Howey'] })).toBe(false);
    expect(index.has({ title: 'Dune', authors: ['Herbert, Frank'] })).toBe(true);
    expect(index.has({ title: 'Marry My Husband 8', authors: ['Sojak Sung'] })).toBe(false);
  });
});

describe('findMangaForBook', () => {
  const library = [
    { title: 'One Piece', titleRomaji: 'ONE PIECE' },
    { title: 'SPY x FAMILY', titleRomaji: 'SPY×FAMILY' },
    { title: 'Kaiju No. 8', titleRomaji: 'Kaijuu 8-gou' },
    { title: 'Solo Leveling', titleRomaji: 'Na Honjaman Level Up' },
  ];

  it('erkennt Manga-Bände der eigenen Reihen', () => {
    expect(findMangaForBook({ title: 'One Piece 105' }, library)).toBe(library[0]);
    expect(findMangaForBook({ title: 'One Piece', subtitle: 'Band 3' }, library)).toBe(library[0]);
    expect(findMangaForBook({ title: 'Spy × Family, Vol. 12' }, library)).toBe(library[1]);
    expect(findMangaForBook({ title: 'Kaiju No. 8 – Band 10' }, library)).toBe(library[2]);
  });

  it('erkennt Bände mit deutschem Untertitel und Nummer am Ende', () => {
    const library = [{ title: 'Requiem of the Rose King', titleRomaji: 'Baraou no Souretsu' }];
    expect(
      findMangaForBook(
        { title: 'Requiem of the rose king: die Königin und der Ritter der Rose 2' },
        library
      )
    ).toBe(library[0]);
    expect(
      findMangaForBook(
        { title: 'Requiem of the rose king', subtitle: 'die Königin und der Ritter der Rose 2' },
        library
      )
    ).toBe(library[0]);
    expect(
      findMangaForBook({ title: 'Requiem of the rose king: Das offizielle Artbook' }, library)
    ).toBeUndefined();
  });

  it('lässt Romane, Spin-offs und fremde Reihen in Ruhe', () => {
    expect(findMangaForBook({ title: 'Solo Leveling – Roman 1' }, library)).toBeUndefined();
    expect(findMangaForBook({ title: 'One Piece Film Red' }, library)).toBeUndefined();
    expect(findMangaForBook({ title: 'Der Schwarm' }, library)).toBeUndefined();
  });
});

describe('pagesReadOf', () => {
  it('zählt den Stand, beendete Bücher voll und abgeschlossene Re-Reads mit', () => {
    expect(pagesReadOf(book({ status: 'reading', currentPage: 120 }))).toBe(120);
    expect(pagesReadOf(book({ status: 'completed', currentPage: 0 }))).toBe(300);
    expect(pagesReadOf(book({ status: 'reading', currentPage: 50, rereadCount: 2 }))).toBe(650);
    expect(pagesReadOf(book({ status: 'planned', currentPage: 0, pageCount: undefined }))).toBe(0);
  });
});

describe('bookProgress', () => {
  it('startet und beendet ein Buch über den Seitenstand', () => {
    const now = '2026-10-12T10:00:00.000Z';
    const start = applyPageUpdate(book({ status: 'planned', currentPage: 0 }), 40, now);
    expect(start.updates.status).toBe('reading');
    expect(start.pagesRead).toBe(40);
    const end = applyPageUpdate(book(), 999, now);
    expect(end.newPage).toBe(300);
    expect(end.finished).toBe(true);
    expect(end.updates.completedAt).toBe(now);
  });

  it('setzt beim erneuten Lesen zurück und zählt mit', () => {
    const updates = applyStatusChange(
      book({ status: 'completed', rereadCount: 1 }),
      'reading',
      'x'
    );
    expect(updates).toMatchObject({ currentPage: 0, rereadCount: 2, status: 'reading' });
    expect(progressPercent(book({ currentPage: 150 }))).toBe(50);
    expect(progressPercent(book({ status: 'completed' }))).toBe(100);
  });
});

describe('bookEvents und bookStats', () => {
  const ts = (iso: string) => Math.floor(new Date(iso).getTime() / 1000);
  const ev = (iso: string, n: number, s = 'b1'): CompactBookEvent => ({
    ts: ts(iso),
    t: 'pg',
    s,
    st: 'x',
    n,
  });

  it('ignoriert nachgetragene Riesensprünge', () => {
    expect(eventPages(ev('2026-03-01T10:00:00', 50))).toBe(50);
    expect(eventPages(ev('2026-03-01T10:00:00', 900))).toBe(0);
  });

  it('zählt die Lese-Serie bis gestern oder heute', () => {
    const now = new Date('2026-10-12T20:00:00').getTime();
    const events = [ev('2026-10-10T09:00:00', 10), ev('2026-10-11T09:00:00', 10)];
    expect(readingStreak(events, now)).toBe(2);
    expect(readingStreak([ev('2026-10-01T09:00:00', 10)], now)).toBe(0);
  });

  it('nimmt Seiten aus Events und sonst die Seitenzahl beendeter Bücher', () => {
    const now = new Date('2026-12-31T12:00:00').getTime();
    const books = [
      book({
        id: 'a',
        status: 'completed',
        completedAt: '2026-05-02T12:00:00.000Z',
        pageCount: 300,
        rating: 8,
      }),
      book({
        id: 'b',
        status: 'completed',
        completedAt: '2026-06-02T12:00:00.000Z',
        pageCount: 500,
      }),
    ];
    const stats = computeBookYearStats(books, [ev('2026-05-01T10:00:00', 120, 'a')], 2026, now);
    expect(stats.booksFinished).toBe(2);
    expect(stats.pagesRead).toBe(620);
    expect(stats.longestBook?.id).toBe('b');
    expect(stats.avgRating).toBe(8);
  });

  it('summiert gelesene Bücher und Seiten über alle Jahre', () => {
    const totals = bookTotals([
      book({ id: 'a', status: 'completed', currentPage: 0, pageCount: 300 }),
      book({ id: 'b', status: 'reading', currentPage: 40, pageCount: 200, rereadCount: 1 }),
      book({ id: 'c', status: 'reading', currentPage: 120 }),
      book({ id: 'd', status: 'planned', currentPage: 0 }),
    ]);
    expect(totals.booksRead).toBe(2);
    expect(totals.pagesRead).toBe(300 + 240 + 120);
  });

  it('rechnet das Jahresziel gegen den Kalender', () => {
    const july = new Date(2026, 6, 3, 12).getTime();
    expect(goalPace(24, 12, july).diff).toBe(0);
    expect(goalPace(24, 24, july).done).toBe(true);
  });
});

describe('bookSeries', () => {
  it('bereinigt Wikidata-Teile und findet den nächsten Band', () => {
    const parts = normalizeSeriesParts([
      { wikidataId: 'Q1', title: 'Band eins', position: '1', date: '2020-01-01T00:00:00Z' },
      { wikidataId: 'Q1b', title: 'Band eins (Übersetzung)', position: '1', date: '2021-01-01' },
      { wikidataId: 'Q2', title: 'Band zwei', position: '2', date: '2030-05-01' },
      { wikidataId: 'Q3', title: 'Novelle', position: '1.5' },
      { wikidataId: 'Q4', title: 'Q123', position: '3' },
    ]);
    expect(parts.map((p) => p.title)).toEqual(['Band eins', 'Band zwei']);
    const next = findNextVolume(parts, [1], new Date('2030-04-21T00:00:00').getTime());
    expect(next?.state).toBe('upcoming');
    expect(next?.daysUntil).toBe(10);
  });

  it('erkennt gelesene Bände auch unter Ausgabentitel, ID oder Klammer-Schreibweise', () => {
    const parts = normalizeSeriesParts([
      { wikidataId: 'Q10', title: 'Bis(s) zum Morgengrauen', position: '1' },
      { wikidataId: 'Q11', title: 'Bis(s) zur Mittagsstunde', position: '2', olWorkId: 'OL2W' },
      { wikidataId: 'Q12', title: 'Fourth Wing', position: '3' },
      { wikidataId: 'Q13', title: 'Iron Flame', position: '4' },
    ]);
    expect(partPositionOf({ title: 'Biss zum Morgengrauen' }, parts)).toBe(1);
    expect(partPositionOf({ title: 'Ganz anders', olWorkId: 'OL2W' }, parts)).toBe(2);
    expect(partPositionOf({ title: 'Ganz anders', wikidataId: 'Q13' }, parts)).toBe(4);
    expect(partPositionOf({ title: 'Fourth Wing – Flammengeküsst' }, parts)).toBe(3);
    expect(partPositionOf({ title: 'Ein anderes Buch' }, parts)).toBeUndefined();
  });

  it('ordnet einen mehrdeutigen Kurztitel keinem Band zu', () => {
    const parts = normalizeSeriesParts([
      { wikidataId: 'Q20', title: 'Percy Jackson: Diebe im Olymp', position: '1' },
      { wikidataId: 'Q21', title: 'Percy Jackson: Im Bann des Zyklopen', position: '2' },
    ]);
    expect(partPositionOf({ title: 'Percy Jackson: Im Bann des Zyklopen' }, parts)).toBe(2);
    expect(partPositionOf({ title: 'Percy Jackson' }, parts)).toBeUndefined();
  });

  it('nimmt eine gespeicherte Bandnummer nur aus derselben Reihe', () => {
    const parts = normalizeSeriesParts([
      { wikidataId: 'Q30', title: 'Eins', position: '1' },
      { wikidataId: 'Q31', title: 'Zwei', position: '2' },
    ]);
    const book = { title: 'Zwei', series: { wikidataId: 'QX', position: 7 } };
    expect(partPositionOf(book, parts, 'QX')).toBe(7);
    expect(partPositionOf(book, parts, 'Q-andere')).toBe(2);
  });
});

describe('Import', () => {
  it('parst CSV mit Anführungszeichen und Zeilenumbrüchen im Feld', () => {
    expect(parseCsv('a,"b,c","d ""e"""\n"x\ny",z')).toEqual([
      ['a', 'b,c', 'd "e"'],
      ['x\ny', 'z'],
    ]);
  });

  it('liest einen Goodreads-Export inklusive Reihe, Bewertung und Datum', () => {
    const csv = [
      'Book Id,Title,Author,ISBN,ISBN13,My Rating,Number of Pages,Date Read,Date Added,Exclusive Shelf,Read Count',
      '1,"Mockingjay (The Hunger Games, #3)",Suzanne Collins,"=""0439023513""","=""9780439023511""",4,390,2024/05/14,2024/01/02,read,1',
      '2,Dune,Frank Herbert,"=""""","=""""",0,,,2024/02/01,to-read,0',
    ].join('\n');
    const preview = buildImportPreview(csv, '2026-10-12T00:00:00.000Z');
    expect(preview?.source).toBe('goodreads');
    expect(preview?.counts).toMatchObject({ completed: 1, planned: 1 });
    const [mockingjay] = preview?.books ?? [];
    expect(mockingjay).toMatchObject({
      title: 'Mockingjay',
      series: { name: 'The Hunger Games', position: 3 },
      rating: 8,
      isbn13: '9780439023511',
      currentPage: 390,
    });
    expect(mockingjay.completedAt?.startsWith('2024-05-14')).toBe(true);
    expect(splitSeriesFromTitle('Ohne Reihe').series).toBeUndefined();
  });
});

describe('Mapping und Text', () => {
  it('nimmt aus Open Library die passende Ausgabe statt des Originals', () => {
    const result = mapOpenLibraryDoc({
      key: '/works/OL1W',
      title: 'Ostatnie Życzenie',
      author_name: ['Andrzej Sapkowski'],
      editions: {
        docs: [
          { title: 'Der letzte Wunsch', cover_i: 42, language: ['ger'], isbn: ['3423262648'] },
        ],
      },
    });
    expect(result).toMatchObject({
      title: 'Der letzte Wunsch',
      language: 'de',
      isbn13: '9783423262644',
    });
    expect(coverAtSize(result?.cover, 'M')).toMatch(/\/bookcover\/id\/42-M\.jpg$/);
    expect(directCoverAtSize(result?.cover, 'M')).toBe(
      'https://covers.openlibrary.org/b/id/42-M.jpg'
    );
  });

  it('leitet nur Cover-IDs über den Spiegel, ISBN- und Google-Cover bleiben direkt', () => {
    const isbn = 'https://covers.openlibrary.org/b/isbn/9783423262644-L.jpg?default=false';
    expect(coverAtSize(isbn, 'M')).toBe(
      'https://covers.openlibrary.org/b/isbn/9783423262644-M.jpg?default=false'
    );
    expect(coverAtSize('https://books.google.com/books/content?id=x&zoom=1', 'L')).toBe(
      'https://books.google.com/books/content?id=x&zoom=1&fife=w480-h720'
    );
    expect(coverAtSize(undefined, 'M')).toBeUndefined();
  });

  it('wechselt bei Katalog-Covern nur die Größe und behält den Versionsstempel', () => {
    const own = 'https://serienapi.konrad-dinges.de/bookcover/book/hc-123-L.jpg?v=1793117589';
    expect(coverAtSize(own, 'M')).toBe(
      'https://serienapi.konrad-dinges.de/bookcover/book/hc-123-M.jpg?v=1793117589'
    );
    expect(coverAtSize(own, 'L')).toBe(own);
    expect(directCoverAtSize(own, 'M')).toBe(own);
  });

  it('macht aus HTML lesbaren Text und erkennt die Sprache grob', () => {
    expect(htmlToPlainText('<p>Ein <b>großes</b> Buch&nbsp;&amp; mehr</p><p>Zweiter</p>')).toBe(
      'Ein großes Buch & mehr\n\nZweiter'
    );
    expect(
      guessLanguage(
        'Der Junge und die Katze sind nicht mit dem Hund auf der Wiese, denn die Sonne scheint'
      )
    ).toBe('de');
    expect(
      guessLanguage(
        'The boy and the cat are in the garden with the dog, and it is a sunny day for all'
      )
    ).toBe('en');
  });
});

describe('readingTaste', () => {
  it('liest Genres aus Google- und Open-Library-Kategorien', () => {
    expect(genresFromCategories(['Fiction', 'Fantasy', 'Romance'])).toEqual(['fantasy', 'romance']);
    expect(genresFromCategories(['Krimis und Thriller'])).toEqual(['thriller']);
    expect(genresFromCategories(['Science fiction'])).toEqual(['scifi']);
    expect(genresFromCategories(['History', 'Biography & Autobiography'])).toEqual(['nonfiction']);
    expect(genresFromCategories(undefined)).toEqual([]);
  });

  it('gewichtet Gelesenes und gute Bewertungen stärker und nennt Lieblingsautoren', () => {
    const taste = computeReadingTaste([
      book({ id: '1', status: 'completed', categories: ['Fantasy'], rating: 9, authors: ['A'] }),
      book({ id: '2', status: 'completed', categories: ['Fantasy'], authors: ['A'] }),
      book({ id: '3', status: 'planned', categories: ['Thriller'], authors: ['B'] }),
      book({ id: '4', status: 'dropped', categories: ['Horror'], authors: ['C'] }),
      book({ id: '5', status: 'reading', title: 'Ohne Kategorie', authors: ['D'] }),
    ]);
    expect(taste.genres.map((g) => g.id)).toEqual(['fantasy', 'thriller']);
    expect(taste.genres[0].share).toBe(86);
    expect(taste.authors).toEqual([{ name: 'A', count: 2 }]);
    expect(taste.classified).toBe(3);
    expect(tasteGenres(taste)).toHaveLength(2);
  });

  it('nimmt Genres aus den Regalen dazu und zeigt erst ab drei eingeordneten Büchern welche', () => {
    const shelf = (b: Book) => (b.id === 'x' ? (['romance'] as const).slice() : []);
    const taste = computeReadingTaste([book({ id: 'x', status: 'completed' })], shelf);
    expect(taste.genres).toEqual([{ id: 'romance', share: 100 }]);
    expect(tasteGenres(taste)).toEqual([]);
    expect(hasReadingTaste(taste)).toBe(false);
  });
});

describe('Hardcover-Cover in Größen', () => {
  const mirror = 'https://serienapi.konrad-dinges.de/bookcover/hc/L2VkaXRpb24vMS9hLmpwZw';

  it('hängt die Größe vor die Dateiendung', () => {
    expect(coverAtSize(`${mirror}.jpg`, 'M')).toBe(`${mirror}.M.jpg`);
    expect(coverAtSize(`${mirror}.jpg`, 'L')).toBe(`${mirror}.L.jpg`);
  });

  it('tauscht eine vorhandene Größe aus', () => {
    expect(coverAtSize(`${mirror}.M.jpg`, 'L')).toBe(`${mirror}.L.jpg`);
  });

  it('lässt das Original für directCoverAtSize unangetastet', () => {
    expect(directCoverAtSize(`${mirror}.jpg`, 'M')).toBe(`${mirror}.jpg`);
  });
});

describe('DNB-Cover über den Spiegel', () => {
  const dnb = 'https://portal.dnb.de/opac/mvb/cover?isbn=9783741650987';

  it('leitet auf den Backend-Spiegel in der passenden Größe um', () => {
    expect(coverAtSize(dnb, 'M')).toMatch(/\/bookcover\/dnb\/9783741650987-M\.jpg$/);
    expect(coverAtSize(dnb, 'L')).toMatch(/\/bookcover\/dnb\/9783741650987-L\.jpg$/);
    expect(directCoverAtSize(dnb, 'M')).toBe(dnb);
  });
});

describe('alignSeriesKey', () => {
  const owned = (series: Book['series']): Book =>
    ({
      id: 'b1',
      title: 'Band 1',
      authors: [],
      status: 'planned',
      currentPage: 0,
      addedAt: '',
      series,
    }) as Book;

  it('übernimmt den Schlüssel einer schon geführten Reihe (Schreibweise egal)', () => {
    const item = { series: { name: 'Harry Potter', position: 3, wikidataId: 'hc:Harry Potter' } };
    const library = [owned({ name: 'Harry-Potter', wikidataId: 'Q8337' })];
    expect(alignSeriesKey(item, library).series?.wikidataId).toBe('Q8337');
    expect(alignSeriesKey(item, library).series?.position).toBe(3);
  });

  it('lässt alles, wie es ist, wenn keine passende Reihe da ist', () => {
    const item = { series: { name: 'Dune', wikidataId: 'hc:Dune' } };
    expect(alignSeriesKey(item, [owned({ name: 'Foundation', wikidataId: 'Q1' })])).toBe(item);
    expect(alignSeriesKey({}, [])).toEqual({});
  });
});
