import { describe, expect, it } from 'vitest';
import type { Book } from '../../types/Book';
import { eventPages, readingStreak, type CompactBookEvent } from './bookEvents';
import { bookMatchKey, looksLikeIsbn, pickIsbn13, toIsbn13 } from './bookIdentity';
import { applyPageUpdate, applyStatusChange, progressPercent } from './bookProgress';
import { coverAtSize, directCoverAtSize, mapOpenLibraryDoc } from './bookSearchMapping';
import { findNextVolume, normalizeSeriesParts } from './bookSeries';
import { computeBookYearStats, goalPace } from './bookStats';
import { guessLanguage, htmlToPlainText } from './bookText';
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
