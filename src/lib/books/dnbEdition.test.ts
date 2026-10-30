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

  it('gibt abgekürzten Auflagen ihren Punkt zurück', () => {
    const xml = record(
      '<datafield tag="250" ind1=" " ind2=" "><subfield code="a">1. Aufl.</subfield></datafield>'
    );
    expect(mapDnbRecord(xml, '9783551630292')?.edition).toBe('1. Aufl.');
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

  it('hält die Verlagsnummer („Carlsen ; 815") nicht für eine Reihe', () => {
    const publisher =
      '<datafield tag="264" ind1="3" ind2="1"><subfield code="a">Hamburg</subfield><subfield code="b">Carlsen</subfield><subfield code="c">2009</subfield></datafield>';
    const hit = mapDnbRecord(record(series('Carlsen', '815') + publisher), '9783551358158');
    expect(hit?.publisher).toBe('Carlsen');
    expect(hit).not.toHaveProperty('series');
    const imprint = mapDnbRecord(
      record(
        series('Fischer Taschenbuch', '1234') +
          publisher.replace('Carlsen', 'Fischer Taschenbuch Verlag')
      ),
      '9783596297290'
    );
    expect(imprint).not.toHaveProperty('series');
  });

  it('lässt die Reihe ohne Feld 490 weg', () => {
    expect(mapDnbRecord(record(''), '9783453319677')).not.toHaveProperty('series');
  });
});

describe('DNB-Autoren und Genres', () => {
  const marc = (fields: string) => `<?xml version="1.0"?>
<record xmlns="http://www.loc.gov/MARC21/slim">
  ${fields}
</record>`;
  const comicVolume = marc(`
  <datafield tag="041" ind1=" " ind2=" "><subfield code="a">ger</subfield><subfield code="h">kor</subfield></datafield>
  <datafield tag="082" ind1="7" ind2="4"><subfield code="a">741.5</subfield><subfield code="q">DE-101</subfield></datafield>
  <datafield tag="245" ind1="1" ind2="0"><subfield code="a">Marry my husband</subfield><subfield code="n">5</subfield><subfield code="c">Artwork: Studio LICO ; Original: Sung Sojak ; aus dem Koreanischen von Jessica Walther</subfield></datafield>
  <datafield tag="264" ind1=" " ind2="1"><subfield code="a">Hamburg</subfield><subfield code="b">C Lines</subfield><subfield code="c">2025</subfield></datafield>
  <datafield tag="300" ind1=" " ind2=" "><subfield code="a">258 Seiten</subfield></datafield>
  <datafield tag="655" ind1=" " ind2="7"><subfield code="a">Comic</subfield><subfield code="2">gnd-content</subfield></datafield>`);

  it('nimmt die Verantwortlichkeitsangabe, wenn die DNB keine Personen-Felder anlegt (Comics)', () => {
    const hit = mapDnbRecord(comicVolume, '9783551630292');
    expect(hit).toMatchObject({
      title: 'Marry my husband 5',
      authors: ['Studio LICO', 'Sung Sojak'],
      publisher: 'C Lines',
      publishedYear: 2025,
      pageCount: 258,
      categories: ['Comics'],
    });
  });

  it('schneidet Übersetzer und Rollen ab und lässt die Personen-Felder vorgehen', () => {
    const novel = marc(`
  <datafield tag="245" ind1="1" ind2="0"><subfield code="a">Nevernight</subfield><subfield code="c">Jay Kristoff. Aus dem Englischen von Kirsten Borchardt</subfield></datafield>`);
    expect(mapDnbRecord(novel, '9783596297290')?.authors).toEqual(['Jay Kristoff']);
    const withPerson = marc(`
  <datafield tag="100" ind1="1" ind2=" "><subfield code="a">Rowling, J. K.</subfield><subfield code="4">aut</subfield></datafield>
  <datafield tag="245" ind1="1" ind2="0"><subfield code="a">Harry Potter</subfield><subfield code="c">Text: Jemand anderes</subfield></datafield>`);
    expect(mapDnbRecord(withPerson, '9783551354013')?.authors).toEqual(['J. K. Rowling']);
  });

  it('übernimmt Formschlagwörter als Genres, ohne Comics doppelt zu nennen', () => {
    const fantasy = marc(`
  <datafield tag="245" ind1="1" ind2="0"><subfield code="a">Terra</subfield></datafield>
  <datafield tag="655" ind1=" " ind2="7"><subfield code="a">Fantasy</subfield><subfield code="2">gnd-content</subfield></datafield>
  <datafield tag="655" ind1=" " ind2="7"><subfield code="a">Jugendbuch</subfield><subfield code="2">gnd-content</subfield></datafield>`);
    expect(mapDnbRecord(fantasy, '9783453319677')?.categories).toEqual(['Fantasy', 'Jugendbuch']);
    expect(mapDnbRecord(comicVolume, '9783551630292')?.categories).toEqual(['Comics']);
  });
});
