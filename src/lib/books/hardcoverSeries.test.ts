import { describe, expect, it } from 'vitest';
import type { Book, BookSeriesPart } from '../../types/Book';
import {
  adoptSeries,
  displayVolume,
  fitsSeries,
  needsSeriesLookup,
  SERIES_LOOKUP_VERSION,
  seriesProgress,
} from './bookSeries';

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

describe('needsSeriesLookup', () => {
  const LATER = new Date('2026-11-20T12:00:00').getTime();

  it('sucht, wenn der eigene Reihen-Schlüssel keine Bände liefert', () => {
    expect(needsSeriesLookup(book(), 0, false, NOW)).toBe(true);
  });

  it('lässt Bücher mit funktionierender Reihe und gefundenem Band in Ruhe', () => {
    expect(needsSeriesLookup(book(), 7, true, NOW)).toBe(false);
  });

  it('sucht, wenn die Reihe Bände hat, der eigene Band darin aber fehlt', () => {
    expect(needsSeriesLookup(book(), 7, false, NOW)).toBe(true);
  });

  it('braucht eine Hardcover-ID oder ISBN', () => {
    expect(needsSeriesLookup(book({ isbn13: undefined }), 0, false, NOW)).toBe(false);
    expect(needsSeriesLookup(book({ isbn13: undefined, hardcoverId: 42 }), 0, false, NOW)).toBe(
      true
    );
  });

  const checked = (at: string, v = SERIES_LOOKUP_VERSION) =>
    book({ seriesChecked: at, seriesCheckedV: v });

  it('fragt erst nach 30 Tagen erneut', () => {
    expect(needsSeriesLookup(checked('2026-11-10T00:00:00.000Z'), 0, false, LATER)).toBe(false);
    expect(needsSeriesLookup(checked('2026-10-01T00:00:00.000Z'), 0, false, LATER)).toBe(true);
  });

  it('wiederholt Prüfungen mit älterem Stand der Quellen sofort', () => {
    expect(needsSeriesLookup(checked('2026-11-19T00:00:00.000Z', 2), 0, false, LATER)).toBe(true);
    expect(
      needsSeriesLookup(book({ seriesChecked: '2026-11-19T00:00:00.000Z' }), 0, false, LATER)
    ).toBe(true);
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
  it('zeigt den nächsten Band schon, während Band 1 gelesen wird', () => {
    const reading = book({
      status: 'reading',
      series: { name: 'Dune', position: 1, wikidataId: 'hc:Dune' },
    });
    const parts = [part(1, 'Der Wüstenplanet'), part(2, 'Der Herr des Wüstenplaneten')];
    const [first] = seriesProgress([reading], { 'hc:Dune': parts }, {}, NOW);
    expect(first.next.part.position).toBe(2);
    expect(first.ownedCount).toBe(0);
  });

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

describe('Blade Runner: Romanvorlage vor Jeters Fortsetzungen', () => {
  const hcPart = (position: number, title: string, author: string): BookSeriesPart => ({
    wikidataId: `hc-${position}`,
    title,
    position,
    result: {
      id: `hc-${position}`,
      title,
      authors: [author],
      source: 'hardcover',
      series: { name: 'Blade Runner', position, wikidataId: 'hc:Blade Runner' },
    },
  });
  const parts = [
    hcPart(1, 'Blade Runner 2: The Edge of Human', 'K.W. Jeter'),
    hcPart(2, 'Blade Runner 3: Replicant Night', 'K.W. Jeter'),
    hcPart(3, 'Blade Runner 4: Eye and Talon', 'K.W. Jeter'),
  ];
  const dick = (position: number) =>
    book({
      title: 'Blade Runner: Träumen Androiden von elektrischen Schafen?',
      authors: ['Philip K. Dick'],
      series: { name: 'Blade Runner', position, wikidataId: 'hc:Blade Runner' },
    });

  it('schlägt nach Dicks Roman (Band 0) Jeters ersten Teil vor', () => {
    const [first] = seriesProgress([dick(0)], { 'hc:Blade Runner': parts }, {}, NOW);
    expect(first.next.part.title).toBe('Blade Runner 2: The Edge of Human');
    expect(first.volume).toBe(2);
    expect(first.author).toBe('K.W. Jeter');
  });

  it('überspringt Jeters ersten Teil nicht, wenn der Roman auf Platz 1 steht', () => {
    const [first] = seriesProgress([dick(1)], { 'hc:Blade Runner': parts }, {}, NOW);
    expect(first.next.part.title).toBe('Blade Runner 2: The Edge of Human');
  });

  it('geht nach Jeters erstem Teil normal weiter', () => {
    const edge = book({
      title: 'Blade Runner 2: The Edge of Human',
      authors: ['K. W. Jeter'],
      series: { name: 'Blade Runner', position: 1, wikidataId: 'hc:Blade Runner' },
    });
    const [first] = seriesProgress([dick(0), edge], { 'hc:Blade Runner': parts }, {}, NOW);
    expect(first.next.part.title).toBe('Blade Runner 3: Replicant Night');
    expect(first.volume).toBe(3);
  });
});

describe('displayVolume', () => {
  it('nimmt die Bandnummer der Reihe sonst unverändert', () => {
    expect(displayVolume(part(4, 'Der Gottkaiser des Wüstenplaneten'), 'Dune')).toBe(4);
    expect(displayVolume(part(2, 'Fahrenheit 451'), 'Dune')).toBe(2);
  });
});

describe('fitsSeries', () => {
  const orv = [1, 2, 3].map((position) => ({
    wikidataId: `hc-orv-${position}`,
    title: `Omniscient Reader's Viewpoint (Manhwa), Vol. ${position}`,
    position,
    result: {
      id: `hc-orv-${position}`,
      title: `Omniscient Reader's Viewpoint (Manhwa), Vol. ${position}`,
      authors: ['singNsong', 'Sleepy-C'],
      source: 'hardcover' as const,
    },
  }));
  const key = "hc:Omniscient Reader's Viewpoint (Manhwa)";

  it('erkennt eine falsch zugeordnete Reihe am Autor', () => {
    const atsumori = book({
      title: 'Verlobt mit Atsumori-kun 06',
      authors: ['Taamo'],
      series: { name: "Omniscient Reader's Viewpoint (Manhwa)", position: 1, wikidataId: key },
    });
    expect(fitsSeries(atsumori, orv, key)).toBe(false);
  });

  it('lässt richtig zugeordnete Bände gelten', () => {
    const reader = book({
      title: 'The Omniscient Reader 2',
      authors: ['singNsong'],
      series: { name: "Omniscient Reader's Viewpoint (Manhwa)", position: 2, wikidataId: key },
    });
    expect(fitsSeries(reader, orv, key)).toBe(true);
  });
});

describe('Verlobt mit Atsumori-kun: alter und neuer DNB-Schlüssel', () => {
  const OLD = 'dnb:Verlobt mit Atsumori-kun';
  const NEW = 'dnb:1238297749:Verlobt mit Atsumori-kun';
  const parts = [1, 2, 3, 4, 5, 6].map((position) => ({
    wikidataId: `dnb-97838420${position}`,
    title: `Verlobt mit Atsumori-kun ${position}`,
    position,
    result: {
      id: `dnb-97838420${position}`,
      title: `Verlobt mit Atsumori-kun ${position}`,
      authors: ['Taamo'],
      isbn13: `978384200000${position}`,
      source: 'dnb' as const,
    },
  }));
  const volume = (position: number, key: string | undefined, over: Partial<Book> = {}) =>
    book({
      id: `gb-${position}`,
      title: `Verlobt mit Atsumori-kun 0${position}`,
      authors: ['Taamo'],
      isbn13: `978384299999${position}`,
      series: key ? { name: 'Verlobt mit Atsumori-kun', position, wikidataId: key } : undefined,
      ...over,
    });

  it('zählt den letzten Band unter dem neuen Schlüssel auch in der alten Reihe', () => {
    const books = [1, 2, 3, 4, 5].map((n) => volume(n, OLD)).concat(volume(6, NEW));
    expect(seriesProgress(books, { [OLD]: parts, [NEW]: parts }, {}, NOW)).toEqual([]);
  });

  it('findet „06" als Band 6 über den Titel', () => {
    const books = [1, 2, 3, 4, 5].map((n) => volume(n, OLD)).concat(volume(6, undefined));
    expect(seriesProgress(books, { [OLD]: parts }, {}, NOW)).toEqual([]);
  });

  it('zeigt eine Reihe unter zwei Schlüsseln nur einmal', () => {
    const books = [1, 2, 3].map((n) => volume(n, n === 3 ? NEW : OLD));
    const out = seriesProgress(books, { [OLD]: parts, [NEW]: parts }, {}, NOW);
    expect(out).toHaveLength(1);
    expect(out[0].seriesId).toBe(NEW);
    expect(out[0].next.part.position).toBe(4);
  });
});
