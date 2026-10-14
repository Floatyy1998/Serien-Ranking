import { describe, expect, it } from 'vitest';
import type { BookSearchResult } from '../../types/Book';
import { capPerAuthor, curateShelf, daySeed, mixShelves, seededShuffle } from './discoverMix';

const r = (id: string, author: string, popularity = 0, title = id): BookSearchResult => ({
  id,
  title,
  authors: author ? [author] : [],
  source: 'openlibrary',
  popularity,
});

const ids = (list: BookSearchResult[]) => list.map((x) => x.id);

describe('capPerAuthor', () => {
  it('behält je Autor das meistgelesene Buch auf dem ersten Platz des Autors', () => {
    const list = [
      r('words-of-radiance', 'Brandon Sanderson', 465),
      r('going-postal', 'Terry Pratchett', 217),
      r('way-of-kings', 'Brandon Sanderson', 1175),
      r('final-empire', 'Brandon Sanderson', 1568),
      r('mort', 'Terry Pratchett', 512),
    ];
    expect(ids(capPerAuthor(list, 1))).toEqual(['final-empire', 'mort']);
  });

  it('lässt bei max 2 die zwei meistgelesenen in Ranglisten-Reihenfolge stehen', () => {
    const list = [
      r('hp7', 'J. K. Rowling', 10),
      r('hp1', 'J. K. Rowling', 50),
      r('got', 'George R. R. Martin', 40),
      r('hp2', 'J. K. Rowling', 30),
      r('hp3', 'J. K. Rowling', 20),
    ];
    expect(ids(capPerAuthor(list, 2))).toEqual(['hp1', 'hp2', 'got']);
  });

  it('erkennt Autoren unabhängig von Schreibweise und behandelt Bücher ohne Autor einzeln', () => {
    const list = [
      r('a', 'J.R.R. Tolkien', 5),
      r('b', 'J. R. R. Tolkien', 9),
      r('c', ''),
      r('d', ''),
    ];
    expect(ids(capPerAuthor(list, 1))).toEqual(['b', 'c', 'd']);
  });
});

describe('seededShuffle', () => {
  const list = Array.from({ length: 20 }, (_, i) => i);

  it('mischt deterministisch je Seed und verliert nichts', () => {
    const a = seededShuffle(list, '2026-10-14:fantasy');
    expect(seededShuffle(list, '2026-10-14:fantasy')).toEqual(a);
    expect([...a].sort((x, y) => x - y)).toEqual(list);
    expect(a).not.toEqual(list);
  });

  it('liefert an einem anderen Tag eine andere Reihenfolge', () => {
    expect(seededShuffle(list, '2026-10-15:fantasy')).not.toEqual(
      seededShuffle(list, '2026-10-14:fantasy')
    );
  });
});

describe('curateShelf', () => {
  it('blendet eigene Bücher und Dubletten aus und zählt die ausgeblendeten', () => {
    const list = [
      r('ol-1', 'A', 1, 'Eins'),
      r('ol-2', 'B', 1, 'Zwei'),
      r('ol-1b', 'A', 1, 'Eins'),
      r('ol-3', 'C', 1, 'Drei'),
    ];
    const { items, hidden } = curateShelf(list, {
      isOwned: (x) => x.id === 'ol-2',
      perAuthor: 2,
    });
    expect(ids(items)).toEqual(['ol-1', 'ol-3']);
    expect(hidden).toBe(1);
  });
});

describe('Sammelboxen', () => {
  it('fliegen aus dem Stöbern, Einzeltitel mit Zahlen bleiben', () => {
    const list = [
      r('box', 'J. K. Rowling', 1, 'Harry Potter 1-7'),
      r('set', 'George R. R. Martin', 1, 'A Song of Ice and Fire Box Set'),
      r('catch', 'Joseph Heller', 1, 'Catch-22'),
      r('f451', 'Ray Bradbury', 1, 'Fahrenheit 451'),
    ];
    expect(ids(curateShelf(list, { isOwned: () => false, perAuthor: 1 }).items)).toEqual([
      'catch',
      'f451',
    ]);
  });
});

describe('Folgebände', () => {
  it('fliegen raus, Band 1 und Titel mit Jahreszahlen bleiben', () => {
    const list = [
      r('malazan', 'Steven Erikson', 1, 'Malazan Book 2'),
      r('scythe', 'Neal Shusterman', 1, 'Scythe 2 - Der Zorn der Gerechten'),
      r('bestimmung', 'Veronica Roth', 1, 'Die Bestimmung 02 - Tödliche Wahrheit'),
      r('band3', 'Cornelia Funke', 1, 'Tintenwelt Band 3'),
      r('percy', 'Rick Riordan', 1, 'Percy Jackson 1'),
      r('odyssey', 'Arthur C. Clarke', 1, '2001'),
      r('f451', 'Ray Bradbury', 1, 'Fahrenheit 451'),
      r('bahnen', 'Caroline Wahl', 1, '22 Bahnen'),
    ];
    expect(ids(curateShelf(list, { isOwned: () => false, perAuthor: 1 }).items)).toEqual([
      'percy',
      'odyssey',
      'f451',
      'bahnen',
    ]);
  });
});

describe('mixShelves', () => {
  const gems = Array.from({ length: 12 }, (_, i) => r(`gem-${i}`, `Gem Autor ${i}`));
  const top = Array.from({ length: 12 }, (_, i) => r(`top-${i}`, `Top Autor ${i}`));

  it('mischt reihum, schneidet auf die Größe und bleibt für denselben Seed gleich', () => {
    const opts = { seed: 'tag', size: 10, isOwned: () => false, perAuthor: 1 };
    const mixed = mixShelves([gems, top], opts);
    expect(mixed).toHaveLength(10);
    expect(mixed.map((x) => x.id.split('-')[0])).toEqual([
      'gem',
      'top',
      'gem',
      'top',
      'gem',
      'top',
      'gem',
      'top',
      'gem',
      'top',
    ]);
    expect(ids(mixShelves([gems, top], opts))).toEqual(ids(mixed));
  });

  it('nimmt eigene Bücher und doppelte Autoren raus', () => {
    const sameAuthor = [r('x1', 'Stephen King', 9), r('x2', 'Stephen King', 3)];
    const mixed = mixShelves([sameAuthor, [r('y', 'Shirley Jackson')]], {
      seed: 's',
      size: 10,
      isOwned: (x) => x.id === 'y',
      perAuthor: 1,
    });
    expect(ids(mixed)).toEqual(['x1']);
  });

  it('kommt mit leeren Regalen klar', () => {
    expect(mixShelves([], { seed: 's', size: 5, isOwned: () => false, perAuthor: 1 })).toEqual([]);
  });
});

describe('daySeed', () => {
  it('nimmt das lokale Datum', () => {
    expect(daySeed(new Date(2026, 9, 14, 23, 59))).toBe('2026-10-14');
    expect(daySeed(new Date(2026, 9, 15, 0, 1))).toBe('2026-10-15');
  });
});
