// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mapDnbRecord, parseDnbSeriesKey } from './bookSearchMapping';
import {
  dnbPartDate,
  mapDnbSeriesParts,
  mergeSeriesParts,
  plannedMonthOf,
  seriesFromTitle,
} from './dnbSeries';

const NAME = 'Verliebt in mehr als dein Gesicht';

const sub = (code: string, value: string) => `<subfield code="${code}">${value}</subfield>`;
const field = (tag: string, ...subs: string[]) =>
  `<datafield tag="${tag}" ind1=" " ind2=" ">${subs.join('')}</datafield>`;

/** Wie die DNB Manga führt: Druckausgabe mit Band in 245 $n, E-Book und neuere Bände mit Feld 490. */
const record = (opts: {
  isbn: string;
  n?: string;
  title?: string;
  v?: string;
  year: string;
  pages?: boolean;
}) =>
  `<record xmlns="http://www.loc.gov/MARC21/slim">
    ${field('020', sub('9', opts.isbn))}
    ${field('245', sub('a', opts.title ?? NAME), ...(opts.n ? [sub('n', opts.n)] : []))}
    ${field('264', sub('b', 'Altraverse GmbH'), sub('c', opts.year))}
    ${opts.pages ? field('300', sub('a', '192 Seiten')) : ''}
    ${opts.v ? field('490', sub('a', NAME), sub('v', opts.v)) : ''}
  </record>`;

const response = (...records: string[]) => `<?xml version="1.0"?>
<searchRetrieveResponse xmlns="http://www.loc.gov/zing/srw/"><records>
${records.map((r) => `<record><recordData>${r}</recordData></record>`).join('\n')}
</records></searchRetrieveResponse>`;

describe('DNB-Reihe aus der Titel-Teilnummer', () => {
  it('liest den Band aus 245 $n, wenn Feld 490 fehlt', () => {
    const xml = record({ isbn: '978-3-7539-2106-8', n: '7', year: '2024', pages: true });
    expect(mapDnbRecord(xml, '9783753921068')?.series).toEqual({
      name: NAME,
      position: 7,
      wikidataId: `dnb:${NAME}`,
    });
  });
});

describe('mapDnbSeriesParts', () => {
  const xml = response(
    record({ isbn: '978-3-7539-2106-8', n: '7', year: '2024', pages: true }),
    record({ isbn: '978-3-7539-2107-5', title: `${NAME} 07`, v: '7', year: '2024' }),
    record({ isbn: '978-3-7539-2505-9', n: '8', year: '2024', pages: true }),
    record({ isbn: '978-3-7539-5173-7', title: `${NAME} 17`, v: '17', year: '2027', pages: true }),
    record({ isbn: '978-3-7539-9999-1', title: `${NAME} – Artbook`, year: '2025', pages: true })
  );
  const parts = mapDnbSeriesParts(xml, NAME, new Date('2026-11-07'));

  it('sammelt die Bände der Reihe, auch angekündigte', () => {
    expect(parts.map((p) => p.position)).toEqual([7, 8, 17]);
    expect(parts[2].publishedDate).toBe('2027-01-01');
    expect(parts[0].publishedDate).toBe('2024-01-01');
  });

  it('nimmt pro Band die Druckausgabe', () => {
    expect(parts[0].result?.isbn13).toBe('9783753921068');
    expect(parts[0].result?.pageCount).toBe(192);
  });
});

describe('DNB-Reihenschlüssel mit Gesamttitel', () => {
  it('nimmt die IDN aus Feld 773 in den Schlüssel', () => {
    const xml = `<record xmlns="http://www.loc.gov/MARC21/slim">
      ${field('245', sub('a', 'Existence'), sub('n', '1'))}
      ${field('773', sub('q', '11'), sub('w', '(DE-101)1354617061'))}
    </record>`;
    expect(mapDnbRecord(xml, '9783551630483')?.series?.wikidataId).toBe('dnb:1354617061:Existence');
  });

  it('liest Schlüssel mit und ohne Gesamttitel', () => {
    expect(parseDnbSeriesKey('dnb:1354617061:Existence')).toEqual({
      parentId: '1354617061',
      name: 'Existence',
    });
    expect(parseDnbSeriesKey('dnb:130039255X:How to use a returner')).toEqual({
      parentId: '130039255X',
      name: 'How to use a returner',
    });
    expect(parseDnbSeriesKey(`dnb:${NAME}`)).toEqual({ name: NAME });
  });

  it('führt Bandlisten zusammen und behält die Druckausgabe', () => {
    const print = mapDnbSeriesParts(
      response(record({ isbn: '978-3-7539-2106-8', n: '7', year: '2024', pages: true })),
      NAME
    );
    const ebook = mapDnbSeriesParts(
      response(
        record({ isbn: '978-3-7539-2107-5', title: `${NAME} 07`, v: '7', year: '2024' }),
        record({ isbn: '978-3-7539-5173-7', title: `${NAME} 17`, v: '17', year: '2027' })
      ),
      NAME
    );
    const merged = mergeSeriesParts([ebook, print]);
    expect(merged.map((p) => p.position)).toEqual([7, 17]);
    expect(merged[0].result?.isbn13).toBe('9783753921068');
  });
});

describe('seriesFromTitle', () => {
  const part = (position: number, authors: string[], parent = '1165341840') => ({
    wikidataId: `dnb-${position}`,
    title: `Bungo Stray Dogs ${position}`,
    position,
    result: {
      id: `dnb-${position}`,
      title: `Bungo Stray Dogs ${position}`,
      authors,
      source: 'dnb' as const,
      series: {
        name: 'Bungo Stray Dogs',
        position,
        wikidataId: `dnb:${parent}:Bungo Stray Dogs`,
      },
    },
  });
  const parts = [1, 2, 3].map((n) => part(n, ['Sango Harukawa', 'Kafuka Asagiri']));

  it('nimmt Reihe und Band aus dem Titel, wenn der Autor stimmt', () => {
    expect(
      seriesFromTitle(
        { title: 'Bungo Stray Dogs 01', authors: ['Kafka Asagiri', 'Sango Harukawa'] },
        parts
      )
    ).toEqual({
      name: 'Bungo Stray Dogs',
      position: 1,
      wikidataId: 'dnb:1165341840:Bungo Stray Dogs',
    });
  });

  it('lehnt Bände anderer Autoren und Titel ohne Bandnummer ab', () => {
    expect(
      seriesFromTitle({ title: 'Bungo Stray Dogs 01', authors: ['Ray Bradbury'] }, parts)
    ).toBe(null);
    expect(seriesFromTitle({ title: 'Bungo Stray Dogs', authors: ['Kafka Asagiri'] }, parts)).toBe(
      null
    );
  });
});

describe('dnbPartDate', () => {
  const now = new Date('2026-11-07T12:00:00');

  it('nimmt den geplanten Monat aus Feld 263, im laufenden Monat bleibt er offen', () => {
    expect(dnbPartDate(2026, '2026-12', now)).toBe('2026-12-01');
    expect(dnbPartDate(2026, '2026-10', now)).toBe('2026-10-01');
    expect(dnbPartDate(2026, '2026-11', now)).toBeUndefined();
  });

  it('wertet Bände ohne geplanten Monat als erschienen', () => {
    expect(dnbPartDate(2026, undefined, now)).toBe('2026-01-01');
    expect(dnbPartDate(2027, undefined, now)).toBe('2027-01-01');
    expect(dnbPartDate(undefined, undefined, now)).toBeUndefined();
  });

  it('liest Feld 263', () => {
    expect(plannedMonthOf('202702')).toBe('2027-02');
    expect(plannedMonthOf('20270215')).toBe('2027-02');
    expect(plannedMonthOf(undefined)).toBeUndefined();
  });
});
