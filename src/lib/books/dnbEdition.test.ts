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
