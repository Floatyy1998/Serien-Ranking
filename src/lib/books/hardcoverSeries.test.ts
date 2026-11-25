import { describe, expect, it } from 'vitest';
import type { Book, BookSearchResult, BookSeriesPart } from '../../types/Book';
import { createBookIndex } from './bookIdentity';
import {
  adoptSeries,
  displayVolume,
  fitsSeries,
  editionLanguage,
  inheritSeries,
  needsSeriesLookup,
  nextPartLanguage,
  partPositionOf,
  partsFitLanguage,
  SERIES_LOOKUP_VERSION,
  seriesProgress,
} from './bookSeries';
import { localEditionGaps } from './catalogSeries';

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

describe('Her Tale of Shim Chong: Bandliste in der Sprache des Buchs', () => {
  const reader = book({
    id: 'gb-epMB0QEACAAJ',
    title: 'Her tale of Shim Chong 2',
    authors: ['Seri'],
    isbn13: '9783989490741',
    language: 'de',
    series: {
      name: '그녀의 심청 (Her Tale of Shim Chong)',
      position: 2,
      wikidataId: 'hc:그녀의 심청 (Her Tale of Shim Chong)',
    },
  });
  const korean = [1, 2, 3].map((position, i) => ({
    wikidataId: `hc-${position}`,
    title: `그녀의 심청 (Her Tale of Shim Chong) #${position}`,
    position,
    result: {
      id: `hc-${position}`,
      title: `그녀의 심청 #${position}`,
      authors: ['Seri', '비완'],
      language: 'en',
      isbn13: ['9791162207475', '9791189709402', '9791196720575'][i],
      source: 'hardcover' as const,
    },
  }));
  const german = [1, 2, 3].map((position) => ({
    wikidataId: `dnb-978398949073${position + 3}`,
    title: `Her Tale of Shim Chong ${position}`,
    position,
    result: {
      id: `dnb-978398949073${position + 3}`,
      title: `Her Tale of Shim Chong ${position}`,
      authors: ['Seri'],
      language: 'de',
      isbn13: `978398949073${position + 3}`,
      source: 'dnb' as const,
    },
  }));

  it('liest die Sprache aus der ISBN-Gruppe, nicht aus Hardcovers pauschalem „en"', () => {
    expect(editionLanguage({ isbn13: '9783989490741' })).toBe('de');
    expect(editionLanguage({ isbn13: '9788467951234' })).toBe('es');
    expect(editionLanguage({ isbn13: '9782505012345' })).toBe('fr');
    expect(editionLanguage({ isbn13: '9786555123456' })).toBe('pt');
    expect(editionLanguage({ isbn13: '9780062315007' })).toBe('en');
    expect(
      editionLanguage({ isbn13: '9791189709402', language: 'en', source: 'hardcover' })
    ).toBeUndefined();
    expect(editionLanguage({ language: 'pt-BR' })).toBe('pt');
    expect(editionLanguage({ language: 'ko' })).toBeUndefined();
    expect(editionLanguage(undefined)).toBeUndefined();
  });

  it('verwirft für ein deutsches Buch eine Liste nur mit Originalausgaben', () => {
    expect(partsFitLanguage(reader, korean)).toBe(false);
    expect(partsFitLanguage(reader, german)).toBe(true);
    expect(partsFitLanguage(reader, [...korean.slice(0, 2), german[2]])).toBe(true);
  });

  it('gilt für alle App-Sprachen', () => {
    const spanish = { ...korean[2], result: { ...korean[2].result, isbn13: '9788467951234' } };
    expect(partsFitLanguage({ isbn13: '9788467950000' }, korean)).toBe(false);
    expect(partsFitLanguage({ isbn13: '9788467950000' }, [...korean.slice(0, 2), spanish])).toBe(
      true
    );
    expect(partsFitLanguage({ isbn13: '9780062315007', language: 'en' }, korean)).toBe(false);
  });

  it('lässt Bücher ohne App-Sprache und leere Listen in Ruhe', () => {
    expect(partsFitLanguage({ isbn13: '9791162207475', language: 'ko' }, korean)).toBe(true);
    expect(partsFitLanguage(reader, [])).toBe(true);
  });

  it('sucht neu, obwohl das Buch in der Originalliste seinen Platz hat', () => {
    const placed = fitsSeries(reader, korean, 'hc:그녀의 심청 (Her Tale of Shim Chong)');
    expect(placed).toBe(true);
    const settled = placed && partsFitLanguage(reader, korean);
    expect(needsSeriesLookup(reader, korean.length, settled, NOW)).toBe(true);
  });
});

describe('Lady Eris: das eigene Buch macht eine Originalliste nicht deutsch', () => {
  const KEY = 'hc:악녀를 죽여 줘 [Agnyeoreul Jugyeo Jwo] (Comic)';
  const reader = book({
    id: 'hc-2262232',
    title: 'Lady Eris - Nur der Tod kann mich erlösen 01',
    authors: ['Haegi', 'Your April'],
    isbn13: '9783989500570',
    language: 'de',
    source: 'hardcover',
    series: {
      name: '악녀를 죽여 줘 [Agnyeoreul Jugyeo Jwo] (Comic)',
      position: 1,
      wikidataId: KEY,
    },
  });
  const part = (position: number, title: string, isbn13: string, language: string) => ({
    wikidataId: `hc-${isbn13}`,
    title,
    position,
    result: {
      id: `hc-${isbn13}`,
      title,
      authors: ['Haegi'],
      language,
      isbn13,
      source: 'hardcover' as const,
    },
  });
  const mixed = [
    part(1, 'Lady Eris - Nur der Tod kann mich erlösen 01', '9783989500570', 'de'),
    part(6, '악녀를 죽여 줘 6', '9791193821893', 'en'),
    part(7, '악녀를 죽여 줘 7', '9791173820335', 'en'),
  ];

  it('zählt nur andere Bände in der Sprache des Buchs', () => {
    expect(partsFitLanguage(reader, mixed)).toBe(false);
    expect(
      partsFitLanguage(reader, [...mixed, part(2, 'Lady Eris 2', '9783989500587', 'de')])
    ).toBe(true);
  });

  it('sucht deshalb trotz Platz in der Liste neu', () => {
    const placed = fitsSeries(reader, mixed, KEY);
    expect(placed).toBe(true);
    expect(
      needsSeriesLookup(reader, mixed.length, placed && partsFitLanguage(reader, mixed), NOW)
    ).toBe(true);
  });
});

describe('Omniscient Reader: DNB nennt den Zeichner, Hardcover führt dasselbe Werk', () => {
  const DNB = "dnb:1325535427:Omniscient reader's viewpoint";
  const HC = "hc:Omniscient Reader's Viewpoint (Manhwa)";
  const isbnDe = ['9783551630063', '9783551630070', '9783551630087', '9783551630186'];
  const dnbParts = isbnDe.map((isbn13, i) => ({
    wikidataId: `dnb-${isbn13}`,
    title: `Omniscient reader's viewpoint ${i + 1}`,
    position: i + 1,
    publishedDate: '2024-06-01',
    result: {
      id: `dnb-${isbn13}`,
      title: `Omniscient reader's viewpoint ${i + 1}`,
      authors: ['Seul li pi - C'],
      isbn13,
      source: 'dnb' as const,
    },
  }));
  const hcParts = ['9798400901065', '9783551630070', '9798400901614', '9791164287048'].map(
    (isbn13, i) => ({
      wikidataId: `hc-${isbn13}`,
      title: `Omniscient Reader's Viewpoint (Manhwa), Vol. ${i + 1}`,
      position: i + 1,
      publishedDate: '2022-01-01',
      result: {
        id: `hc-${isbn13}`,
        title: `Omniscient Reader's Viewpoint (Manhwa), Vol. ${i + 1}`,
        authors: ['singNsong', 'Sleepy-C'],
        isbn13,
        source: 'hardcover' as const,
      },
    })
  );
  const volume = (id: string, position: number, key: string, isbn13: string, title: string) =>
    book({
      id,
      title,
      authors: ['sing N song', 'Umi'],
      isbn13,
      series: { name: "Omniscient Reader's Viewpoint", position, wikidataId: key },
    });
  const books = [
    volume('gb-3', 3, DNB, '9783551630087', 'The Omniscient Reader 3'),
    volume('gb-1', 1, DNB, '9783551630063', "Omniscient Reader's Viewpoint 1"),
    volume('hc-2', 2, HC, '9783551630070', 'The Omniscient Reader 2'),
    volume('hc-en-1', 1, HC, '9798400901065', '전지적 독자 시점 1'),
    volume('hc-en-3', 3, HC, '9798400901614', "Omniscient Reader's Viewpoint (Manhwa), Vol. 3"),
  ];

  it('erkennt den Band an der ISBN, auch wenn der Autor nicht passt', () => {
    expect(fitsSeries(books[0], dnbParts, DNB)).toBe(true);
  });

  it('schlägt nach Band 3 den vierten deutschen Band vor, und die Reihe nur einmal', () => {
    const out = seriesProgress(books, { [DNB]: dnbParts, [HC]: hcParts }, {}, NOW);
    expect(out).toHaveLength(1);
    expect(out[0].seriesId).toBe(DNB);
    expect(out[0].next.part.result?.isbn13).toBe('9783551630186');
  });
});

// Ticket 21.11.2026: Hardcover kennt die deutschen Roman-Bände 2 und 5 nicht — die Liste zeigt dort die englische Ausgabe.
describe('Solo Leveling: Roman neben Comic', () => {
  const NOVEL = 'hc:Solo Leveling (Novel)';
  const COMIC = 'hc:Solo Leveling (Comic)';
  const novelPart = (position: number, id: string, title: string, isbn13: string) => ({
    wikidataId: id,
    title,
    position,
    publishedDate: '2021-01-01',
    result: {
      id,
      title,
      authors: ['Chugong'],
      isbn13,
      hardcoverId: Number(id.slice(3)),
      source: 'hardcover' as const,
      series: { name: 'Solo Leveling (Novel)', position, wikidataId: NOVEL },
    },
  });
  const novelParts: BookSeriesPart[] = [
    novelPart(1, 'hc-1509648', 'Solo Leveling Roman 01', '9783963587160'),
    novelPart(2, 'hc-1979308', 'Solo Leveling (Novel), Vol. 2', '9781975325893'),
    novelPart(3, 'hc-705287', 'Solo Leveling Roman 03', '9783963587504'),
    novelPart(4, 'hc-893196', 'Solo Leveling Roman 04 mit Box', '9783753904764'),
    novelPart(5, 'hc-893204', 'Solo Leveling (Novel), Vol. 5', '9781975319366'),
    novelPart(6, 'hc-927597', 'Solo Leveling Roman 06', '9783963587535'),
  ];
  const roman1 = book({
    id: 'hc-1509648',
    title: 'Solo Leveling Roman 01',
    authors: ['Chugong'],
    isbn13: '9783963587160',
    hardcoverId: 1509648,
    series: { name: 'Solo Leveling (Novel)', position: 1, wikidataId: NOVEL, hardcoverId: 20376 },
  });
  const comic2 = book({
    id: 'dnb-9783963585265',
    title: 'Solo leveling 2',
    authors: ['Chu gong'],
    isbn13: '9783963585265',
    hardcoverId: 848094,
    categories: ['Fantasy', 'Comics'],
    series: { name: 'Solo Leveling (Comic)', position: 2, wikidataId: COMIC, hardcoverId: 225411 },
  });
  const roman2: BookSearchResult = {
    id: 'gb-roman2',
    title: 'Solo Leveling Roman 02',
    authors: ['Chugong'],
    isbn13: '9783963587498',
    source: 'google',
  };

  it('schlägt Roman-Band 2 vor, den der eigene Comic-Band 2 nicht ersetzt', () => {
    const [next] = seriesProgress([roman1, comic2], { [NOVEL]: novelParts }, {}, NOW);
    expect(next.next.part.position).toBe(2);
    expect(createBookIndex([roman1, comic2]).find(novelParts[1].result ?? roman2)).toBeUndefined();
  });

  it('erkennt den deutschen Band 2 am Titel der Nachbarbände', () => {
    expect(partPositionOf(roman2, novelParts, NOVEL)).toBe(2);
    expect(partPositionOf(comic2, novelParts, NOVEL)).toBeUndefined();
    expect(partPositionOf({ title: 'Solo Leveling Roman 09' }, novelParts, NOVEL)).toBeUndefined();
    const read = book({ ...roman2, series: undefined });
    const [next] = seriesProgress([roman1, comic2, read], { [NOVEL]: novelParts }, {}, NOW);
    expect(next.next.part.title).toBe('Solo Leveling Roman 03');
  });

  it('vererbt die Reihe des eigenen Bands 1 an den neuen Band 2', () => {
    expect(inheritSeries(roman2, [comic2, roman1]).series).toEqual({
      name: 'Solo Leveling (Novel)',
      position: 2,
      wikidataId: NOVEL,
      hardcoverId: 20376,
    });
    expect(inheritSeries(roman2, [comic2]).series).toBeUndefined();
    expect(
      inheritSeries({ ...roman2, authors: ['Jemand Anderes'] }, [roman1]).series
    ).toBeUndefined();
    const known = { name: 'X', wikidataId: 'hc:X' };
    expect(inheritSeries({ ...roman2, series: known }, [roman1]).series).toBe(known);
    expect(inheritSeries({ title: 'Solo Leveling Roman', authors: ['Chugong'] }, [roman1])).toEqual(
      {
        title: 'Solo Leveling Roman',
        authors: ['Chugong'],
      }
    );
  });

  // Ticket 25.11.2026: Hardcover kennt Band 2 nur englisch, die DNB führt die deutsche Reihe schlicht als „Solo leveling".
  describe('deutsche Bandliste der DNB', () => {
    const DNB = 'dnb:1235188582:Solo leveling';
    const dnbPart = (position: number, isbn13: string): BookSeriesPart => ({
      wikidataId: `dnb-${isbn13}`,
      title: `Solo leveling ${position}`,
      position,
      publishedDate: '2021-01-01',
      result: {
        id: `dnb-${isbn13}`,
        title: `Solo leveling ${position}`,
        authors: ['Chu gong'],
        isbn13,
        categories: ['Roman'],
        source: 'dnb',
        series: { name: 'Solo leveling', position, wikidataId: DNB },
      },
    });
    const dnbParts = [
      dnbPart(1, '9783963587160'),
      dnbPart(2, '9783963587498'),
      dnbPart(3, '9783963587504'),
    ];
    const moved = { ...roman1, series: { name: 'Solo leveling', position: 1, wikidataId: DNB } };

    it('merkt, dass der nächste Band bei Hardcover nur englisch vorliegt, bei der DNB deutsch', () => {
      expect(partsFitLanguage(roman1, novelParts)).toBe(true);
      expect(nextPartLanguage(roman1, novelParts, NOVEL)).toBe('foreign');
      expect(nextPartLanguage(moved, dnbParts, DNB)).toBe('local');
      const roman3 = book({
        ...roman1,
        id: 'hc-705287',
        isbn13: '9783963587504',
        series: { name: 'Solo Leveling (Novel)', position: 3, wikidataId: NOVEL },
      });
      expect(nextPartLanguage(roman3, novelParts, NOVEL)).toBe('local');
      expect(nextPartLanguage({ ...moved, isbn13: '9783963587504' }, dnbParts, DNB)).toBe('local');
      expect(
        nextPartLanguage({ ...moved, series: { ...moved.series, position: 3 } }, dnbParts, DNB)
      ).toBeUndefined();
    });

    it('findet das Buch in der DNB-Liste über die ISBN oder den Autor („Chugong" = „Chu gong")', () => {
      expect(fitsSeries(moved, dnbParts, DNB)).toBe(true);
      expect(fitsSeries({ ...moved, isbn13: '9783963587641' }, dnbParts, DNB)).toBe(true);
      expect(fitsSeries({ ...moved, isbn13: undefined, authors: ['Dubu'] }, dnbParts, DNB)).toBe(
        false
      );
    });

    it('schlägt nach den deutschen Bänden 1 und 2 den deutschen Band 3 vor, die Reihe nur einmal', () => {
      const dnbRoman2 = book({
        id: 'dnb-9783963587498',
        title: 'Solo leveling 2',
        authors: ['Chu gong'],
        isbn13: '9783963587498',
        categories: ['Roman'],
        series: { name: 'Solo leveling', position: 2, wikidataId: DNB },
      });
      expect(partPositionOf(dnbRoman2, novelParts, NOVEL)).toBeUndefined();
      const out = seriesProgress(
        [roman1, dnbRoman2, comic2],
        { [NOVEL]: novelParts, [DNB]: dnbParts },
        {},
        NOW
      );
      expect(out).toHaveLength(1);
      expect(out[0].seriesId).toBe(DNB);
      expect(out[0].next.part.result?.isbn13).toBe('9783963587504');
    });
  });

  it('füllt fremdsprachige Bände aus dem eigenen Katalog', () => {
    const editions = [
      { id: 'gb-CdqvzgEACAAJ', t: 'Solo Leveling Roman 05', i: '9783963587528', h: 893204, v: 1 },
      { id: 'gb-roman2', t: 'Solo Leveling Roman 02', a: ['Chugong'], i: '9783963587498', v: 2 },
      {
        id: 'dnb-9783963587658',
        t: 'Solo leveling 2',
        i: '9783963587658',
        s: 'dnb:1:Solo leveling',
        sp: 2,
        v: 3,
      },
      { id: 'gb-en', t: 'Solo Leveling Roman 02', i: '9781975325893', v: 4 },
    ];
    expect(
      localEditionGaps(NOVEL, novelParts, 'de', editions).map((gap) => [
        gap.position,
        gap.edition.id,
      ])
    ).toEqual([
      [2, 'gb-roman2'],
      [5, 'gb-CdqvzgEACAAJ'],
    ]);
    expect(localEditionGaps(NOVEL, novelParts, 'de', [editions[2], editions[3]])).toEqual([]);
    expect(localEditionGaps(NOVEL, novelParts, 'fr', editions)).toEqual([]);
  });
});
