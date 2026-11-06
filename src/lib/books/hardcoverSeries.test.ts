import { describe, expect, it } from 'vitest';
import type { Book, BookSeriesPart } from '../../types/Book';
import { adoptSeries, needsHardcoverSeries, seriesProgress } from './bookSeries';

const NOW = new Date('2026-11-07T12:00:00').getTime();

const book = (over: Partial<Book> = {}): Book => ({
  id: 'dnb-9783423762113',
  title: 'Throne of Glass – Die Erwählte',
  authors: ['Sarah J. Maas'],
  status: 'completed',
  currentPage: 0,
  addedAt: '2026-10-01T00:00:00.000Z',
  isbn13: '9783423762113',
  series: {
    name: 'Throne of Glass – Die Reihe',
    position: 1,
    wikidataId: 'hc:Throne of Glass – Die Reihe',
  },
  ...over,
});

const part = (position: number, title: string): BookSeriesPart => ({
  wikidataId: `hc-${position}`,
  title,
  position,
});

describe('needsHardcoverSeries', () => {
  it('sucht, wenn der eigene Reihen-Schlüssel keine Bände liefert', () => {
    expect(needsHardcoverSeries(book(), 0, NOW)).toBe(true);
  });

  it('lässt Bücher mit funktionierender Reihe in Ruhe', () => {
    expect(needsHardcoverSeries(book(), 7, NOW)).toBe(false);
  });

  it('braucht eine Hardcover-ID oder ISBN', () => {
    expect(needsHardcoverSeries(book({ isbn13: undefined }), 0, NOW)).toBe(false);
    expect(needsHardcoverSeries(book({ isbn13: undefined, hardcoverId: 42 }), 0, NOW)).toBe(true);
  });

  it('fragt erst nach 30 Tagen erneut', () => {
    expect(needsHardcoverSeries(book({ seriesChecked: '2026-10-20T00:00:00.000Z' }), 0, NOW)).toBe(
      false
    );
    expect(needsHardcoverSeries(book({ seriesChecked: '2026-09-01T00:00:00.000Z' }), 0, NOW)).toBe(
      true
    );
  });
});

describe('adoptSeries', () => {
  it('behält den eigenen Namen, nimmt Schlüssel und Band von Hardcover', () => {
    expect(
      adoptSeries(book().series, {
        name: 'Throne of Glass',
        position: 1,
        wikidataId: 'hc:Throne of Glass',
        hardcoverId: 77,
      })
    ).toEqual({
      name: 'Throne of Glass – Die Reihe',
      position: 1,
      wikidataId: 'hc:Throne of Glass',
      hardcoverId: 77,
    });
  });

  it('fällt ohne Hardcover-Band auf die eigene Bandnummer zurück', () => {
    expect(
      adoptSeries({ name: 'Eigene Reihe', position: 3 }, { name: 'X', wikidataId: 'hc:X' })
    ).toEqual({ name: 'Eigene Reihe', position: 3, wikidataId: 'hc:X' });
    expect(adoptSeries(undefined, { name: 'X', wikidataId: 'hc:X' })).toEqual({
      name: 'X',
      wikidataId: 'hc:X',
    });
  });
});

describe('seriesProgress mit übernommener Hardcover-Reihe', () => {
  it('zeigt nach Band 1 den zweiten Band', () => {
    const adopted = book({
      series: adoptSeries(book().series, {
        name: 'Throne of Glass',
        position: 1,
        wikidataId: 'hc:Throne of Glass',
      }),
    });
    const parts = [part(1, 'Die Erwählte'), part(2, 'Die Sterbliche'), part(3, 'Die Erbin')];
    const [first] = seriesProgress([adopted], { 'hc:Throne of Glass': parts }, {}, NOW);
    expect(first.next.part.title).toBe('Die Sterbliche');
    expect(first.seriesName).toBe('Throne of Glass – Die Reihe');
  });
});
