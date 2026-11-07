import { describe, expect, it } from 'vitest';
import { mapCatalogSeries, seriesFileName } from './catalogSeries';

describe('seriesFileName', () => {
  it('ist der FNV-1a-Hash wie im Backend', () => {
    expect(seriesFileName('dnb:Verliebt in mehr als dein Gesicht')).toBe('2f513bfc.json');
    expect(seriesFileName('dnb:How to use a returner')).toBe('44adc9d9.json');
  });
});

describe('mapCatalogSeries', () => {
  const file = {
    key: 'dnb:How to use a returner',
    name: 'How to use a returner',
    v: 1,
    parts: [
      { id: 'dnb-9783910530355', title: 'How to use a returner 4', position: 4, year: 2023 },
      { id: 'dnb-9783910530348', title: 'How to use a returner 3', position: 3, year: 2023 },
      { id: 'dnb-9783910530447', title: 'How to use a returner 13', position: 13, year: 2026 },
      { id: 'dnb-9783910530461', title: 'How to use a returner 15', position: 15, year: 2027 },
      {
        id: 'dnb-9783910530454',
        title: 'How to use a returner 14',
        position: 14,
        year: 2027,
        planned: '2027-03',
      },
      { id: 'hc-12', title: 'Hardcover-Band 12', position: 12, year: 2026 },
      { id: 'hc-0', title: 'Vorgeschichte', position: 0 },
    ],
  };
  const parts = mapCatalogSeries(file, new Date('2026-11-07'));

  it('sortiert nach Band und lässt Band 0 weg', () => {
    expect(parts.map((p) => p.position)).toEqual([3, 4, 12, 13, 14, 15]);
  });

  it('datiert DNB-Bände nach geplantem Monat, sonst gelten sie als erschienen', () => {
    expect(parts[0].publishedDate).toBe('2023-01-01');
    expect(parts[3].publishedDate).toBe('2026-01-01');
    expect(parts[4].publishedDate).toBe('2027-03-01');
    expect(parts[5].publishedDate).toBe('2027-01-01');
  });

  it('lässt Hardcover-Bände aus dem laufenden Jahr offen', () => {
    expect(parts[2].publishedDate).toBeUndefined();
  });

  it('liefert einen fertigen Treffer mit Quelle und Reihe', () => {
    expect(parts[1].result).toMatchObject({
      id: 'dnb-9783910530355',
      source: 'dnb',
      authors: [],
      series: { name: 'How to use a returner', position: 4, wikidataId: file.key },
    });
  });
});
