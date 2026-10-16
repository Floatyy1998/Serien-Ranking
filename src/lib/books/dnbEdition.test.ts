// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mapDnbRecord } from './bookSearchMapping';

const record = (fields: string) => `<?xml version="1.0"?>
<record xmlns="http://www.loc.gov/MARC21/slim">
  <datafield tag="245" ind1="1" ind2="0"><subfield code="a">Terra</subfield><subfield code="b">Roman</subfield></datafield>
  ${fields}
</record>`;

describe('DNB-Auflage', () => {
  it('übernimmt die Ausgabebezeichnung aus Feld 250', () => {
    const xml = record(
      '<datafield tag="250" ind1=" " ind2=" "><subfield code="a">3. Auflage.</subfield></datafield>'
    );
    expect(mapDnbRecord(xml, '9783453319677')?.edition).toBe('3. Auflage');
  });

  it('lässt die Auflage ohne Feld 250 weg', () => {
    expect(mapDnbRecord(record(''), '9783453319677')).not.toHaveProperty('edition');
  });
});

describe('DNB-Reihe', () => {
  const series = (a: string, v: string) =>
    `<datafield tag="490" ind1="1" ind2=" "><subfield code="a">${a}</subfield><subfield code="v">${v}</subfield></datafield>`;

  it('liest Reihe und Band aus Feld 490', () => {
    const hit = mapDnbRecord(record(series('Dead Mount Death Play', '16')), '9783753946818');
    expect(hit?.series).toEqual({
      name: 'Dead Mount Death Play',
      position: 16,
      wikidataId: 'hc:Dead Mount Death Play',
    });
  });

  it('findet die Zahl auch in „Band 7 ; 1"', () => {
    expect(
      mapDnbRecord(record(series('Solo Leveling', 'Band 7 ; 1')), '9783753946818')?.series?.position
    ).toBe(7);
  });

  it('behält die Reihe ohne Bandnummer', () => {
    const hit = mapDnbRecord(record(series('Marry my husband', '')), '9783551630254');
    expect(hit?.series?.name).toBe('Marry my husband');
    expect(hit?.series).not.toHaveProperty('position');
  });

  it('lässt die Reihe ohne Feld 490 weg', () => {
    expect(mapDnbRecord(record(''), '9783453319677')).not.toHaveProperty('series');
  });
});
