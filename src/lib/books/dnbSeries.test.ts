// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mapDnbRecord } from './bookSearchMapping';
import { mapDnbSeriesParts } from './dnbSeries';

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
