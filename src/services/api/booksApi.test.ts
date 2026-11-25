// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const hc = vi.hoisted(() => ({ ready: false, failures: 0, search: vi.fn() }));

vi.mock('../i18n', () => ({ appLocale: 'de' }));
const catalog = vi.hoisted(() => ({ hits: [] as unknown[] }));
vi.mock('../catalog/bookCatalog', () => ({ searchBookCatalog: async () => catalog.hits }));
vi.mock('./hardcoverApi', () => ({
  hardcoverReady: () => hc.ready,
  hardcoverFailureCount: () => hc.failures,
  hardcoverSearch: hc.search,
  hardcoverIsbn: vi.fn(),
  hardcoverDetails: vi.fn(),
  hardcoverBrowse: vi.fn(),
  hardcoverAuthorBooks: vi.fn(),
}));

import { findBook, searchBooks } from './booksApi';

const DNB_RECORD = `<?xml version="1.0" encoding="UTF-8"?>
<searchRetrieveResponse xmlns="http://www.loc.gov/zing/srw/"><numberOfRecords>1</numberOfRecords><records><record><recordData>
<record xmlns="http://www.loc.gov/MARC21/slim" type="Bibliographic">
  <datafield tag="020" ind1=" " ind2=" "><subfield code="a">9783551358158</subfield></datafield>
  <datafield tag="041" ind1=" " ind2=" "><subfield code="a">ger</subfield><subfield code="h">eng</subfield></datafield>
  <datafield tag="100" ind1="1" ind2=" "><subfield code="a">Colfer, Eoin</subfield><subfield code="4">aut</subfield></datafield>
  <datafield tag="245" ind1="1" ind2="0"><subfield code="a">Artemis Fowl - die Rache</subfield><subfield code="c">Eoin Colfer. Aus dem Engl. von Claudia Feldmann</subfield></datafield>
  <datafield tag="264" ind1="3" ind2="1"><subfield code="a">[Hamburg]</subfield><subfield code="b">Carlsen</subfield><subfield code="c">2009</subfield></datafield>
  <datafield tag="300" ind1=" " ind2=" "><subfield code="a">334 S.</subfield></datafield>
  <datafield tag="700" ind1="1" ind2=" "><subfield code="a">Feldmann, Claudia</subfield><subfield code="4">trl</subfield></datafield>
</record></recordData></record></records></searchRetrieveResponse>`;

const MANHWA_RECORD = `<?xml version="1.0" encoding="UTF-8"?>
<searchRetrieveResponse xmlns="http://www.loc.gov/zing/srw/"><numberOfRecords>1</numberOfRecords><records><record><recordData>
<record xmlns="http://www.loc.gov/MARC21/slim" type="Bibliographic">
  <datafield tag="100" ind1="1" ind2=" "><subfield code="a">Ug, Jag ga</subfield><subfield code="e">Künstler</subfield><subfield code="4">art</subfield></datafield>
  <datafield tag="245" ind1="1" ind2="0"><subfield code="a">&#152;A&#156; returner's magic should be special</subfield><subfield code="n">1 / aus dem Koreanischen von Anna Herr</subfield><subfield code="c">Artwork: Wookjakga ; Original Story: Usonan</subfield></datafield>
  <datafield tag="264" ind1="3" ind2="1"><subfield code="a">Hamburg</subfield><subfield code="b">Altraverse GmbH</subfield><subfield code="c">2021</subfield></datafield>
  <datafield tag="300" ind1=" " ind2=" "><subfield code="a">282 Seiten</subfield></datafield>
</record></recordData></record></records></searchRetrieveResponse>`;

const novelRecord = (isbnFields: string, edition: string, parent: string) => `<record><recordData>
<record xmlns="http://www.loc.gov/MARC21/slim" type="Bibliographic">
  ${isbnFields}
  <datafield tag="100" ind1="0" ind2=" "><subfield code="a">Chu gong</subfield><subfield code="4">aut</subfield></datafield>
  <datafield tag="245" ind1="1" ind2="0"><subfield code="a">Solo leveling</subfield><subfield code="n">2 / aus dem Koreanischen von Jiye Josephine Lee</subfield><subfield code="c">Chugong</subfield></datafield>
  <datafield tag="250" ind1=" " ind2=" "><subfield code="a">${edition}</subfield></datafield>
  <datafield tag="264" ind1="3" ind2="1"><subfield code="a">Hamburg</subfield><subfield code="b">Altraverse GmbH</subfield><subfield code="c">2021</subfield></datafield>
  <datafield tag="336" ind1=" " ind2=" "><subfield code="a">Text</subfield><subfield code="b">txt</subfield></datafield>
  <datafield tag="653" ind1=" " ind2=" "><subfield code="a">Roman</subfield></datafield>
  <datafield tag="773" ind1="0" ind2="8"><subfield code="q">12</subfield><subfield code="w">(DE-101)${parent}</subfield></datafield>
</record></recordData></record>`;

const isbnField = (isbn: string, note?: string) =>
  `<datafield tag="020" ind1=" " ind2=" "><subfield code="a">${isbn}</subfield>${note ? `<subfield code="q">${note}</subfield>` : ''}</datafield>`;

const NOVEL_RECORDS = `<?xml version="1.0" encoding="UTF-8"?>
<searchRetrieveResponse xmlns="http://www.loc.gov/zing/srw/"><numberOfRecords>2</numberOfRecords><records>
${novelRecord(isbnField('9783753904771', 'Bände 1-4') + isbnField('9783963587498', 'Band 2'), '2. Auflage', '1265048096')}
${novelRecord(isbnField('9783963587498'), '1. Auflage', '1235188582')}
</records></searchRetrieveResponse>`;

const route = (handlers: { google?: () => Response; ol?: unknown[]; dnb?: string }) =>
  vi.fn(async (url: string) => {
    if (url.includes('googleapis.com')) return handlers.google?.() ?? respond([]);
    if (url.includes('services.dnb.de')) return new Response(handlers.dnb ?? '<x/>');
    return respond(handlers.ol ?? []);
  });

const doc = (title: string, author: string) => ({
  key: `/works/OL${title.length}W`,
  title,
  author_name: [author],
});

const respond = (docs: unknown[]) => new Response(JSON.stringify({ docs }), { status: 200 });

describe('findBook', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('sucht ohne Treffer für Titel + Autor noch einmal nur nach dem Titel', async () => {
    const fetchMock = vi.fn(async (url: string) =>
      respond(
        new URL(url).searchParams.get('q') === 'Der Hobbit'
          ? [doc('Der Hobbit', 'J.R.R. Tolkien')]
          : []
      )
    );
    vi.stubGlobal('fetch', fetchMock);
    expect((await findBook('Der Hobbit', 'J. R. R. Tolkien'))?.title).toBe('Der Hobbit');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('fragt Google bei der Suche nie', async () => {
    const fetchMock = route({
      google: () => respond([]),
      ol: [doc('Der kleine Hobbit', 'J.R.R. Tolkien')],
    });
    vi.stubGlobal('fetch', fetchMock);
    expect((await findBook('Der kleine Hobbit', 'J. R. R. Tolkien'))?.title).toBe(
      'Der kleine Hobbit'
    );
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('googleapis.com'))).toBe(
      false
    );
  });

  it('merkt sich Fehlschläge nicht', async () => {
    let docs: unknown[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => respond(docs))
    );
    expect(await findBook('Shrek!', 'William Steig')).toBeNull();
    docs = [doc('Shrek!', 'William Steig')];
    expect((await findBook('Shrek!', 'William Steig'))?.title).toBe('Shrek!');
  });

  describe('mit erreichbarem Hardcover', () => {
    beforeEach(() => {
      hc.ready = true;
      hc.failures = 0;
      hc.search.mockReset();
    });

    afterEach(() => {
      hc.ready = false;
    });

    it('merkt sich ein „nicht gefunden", wenn Hardcover geantwortet hat', async () => {
      hc.search.mockResolvedValue([]);
      let docs: unknown[] = [];
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => respond(docs))
      );
      expect(await findBook('Momo', 'Michael Ende')).toBeNull();
      docs = [doc('Momo', 'Michael Ende')];
      expect(await findBook('Momo', 'Michael Ende')).toBeNull();
    });

    it('merkt sich kein „nicht gefunden", wenn der Server Hardcover-Abfragen abgewiesen hat', async () => {
      hc.search.mockImplementation(async () => {
        hc.failures++;
        throw new Error('busy');
      });
      let docs: unknown[] = [];
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => respond(docs))
      );
      expect(await findBook('Krabat', 'Otfried Preußler')).toBeNull();
      docs = [doc('Krabat', 'Otfried Preußler')];
      expect((await findBook('Krabat', 'Otfried Preußler'))?.title).toBe('Krabat');
    });
  });
});

describe('searchBooks per ISBN', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('übernimmt kein fremdes Buch von Google: die ISBN-Suche fragt dort nicht mehr', async () => {
    // Google nannte zu 9783963587498 (Roman 02) den Comic-Band 1 mit anderer ISBN.
    const wrongVolume = {
      id: 'cntEzQEACAAJ',
      volumeInfo: {
        title: 'Solo Leveling 01',
        industryIdentifiers: [{ type: 'ISBN_13', identifier: '9783963585258' }],
      },
    };
    const fetchMock = route({
      google: () => new Response(JSON.stringify({ items: [wrongVolume] }), { status: 200 }),
      dnb: NOVEL_RECORDS,
    });
    vi.stubGlobal('fetch', fetchMock);
    const hits = await searchBooks('978-3-96358-749-8');
    expect(hits).toHaveLength(1);
    expect(hits[0]).toMatchObject({
      id: 'dnb-9783963587498',
      title: 'Solo leveling 2',
      isbn13: '9783963587498',
      categories: ['Roman'],
      edition: '1. Auflage',
      series: { position: 2, wikidataId: 'dnb:1235188582:Solo leveling' },
    });
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('googleapis.com'))).toBe(
      false
    );
  });

  it('findet deutsche Ausgaben über die DNB, wenn Open Library nichts liefert', async () => {
    vi.stubGlobal('fetch', route({ dnb: DNB_RECORD }));
    const [hit] = await searchBooks('978-3-551-35815-8');
    expect(hit).toMatchObject({
      title: 'Artemis Fowl - die Rache',
      authors: ['Eoin Colfer'],
      publisher: 'Carlsen',
      publishedYear: 2009,
      pageCount: 334,
      language: 'de',
      isbn13: '9783551358158',
      source: 'dnb',
    });
    expect(hit.cover).toContain('portal.dnb.de/opac/mvb/cover?isbn=9783551358158');
  });

  it('ergänzt einen Open-Library-Treffer um Cover und Seitenzahl aus der DNB', async () => {
    vi.stubGlobal(
      'fetch',
      route({
        ol: [{ key: '/works/OL9W', title: 'Artemis Fowl', author_name: ['Eoin Colfer'] }],
        dnb: DNB_RECORD,
      })
    );
    const [hit] = await searchBooks('9783551358158');
    expect(hit).toMatchObject({ olWorkId: 'OL9W', pageCount: 334, isbn13: '9783551358158' });
    expect(hit.cover).toContain('portal.dnb.de');
  });

  it('merkt sich eine leere Suche nicht', async () => {
    vi.stubGlobal('fetch', route({}));
    expect(await searchBooks('9783328600930')).toEqual([]);
    vi.stubGlobal('fetch', route({ dnb: DNB_RECORD }));
    expect((await searchBooks('9783328600930'))[0]?.title).toBe('Artemis Fowl - die Rache');
  });

  it('nimmt ohne Autor-Rolle den Haupteintrag und entfernt MARC-Sortierzeichen', async () => {
    vi.stubGlobal('fetch', route({ dnb: MANHWA_RECORD }));
    const [hit] = await searchBooks('978-3-96358-885-3');
    expect(hit).toMatchObject({
      title: "A returner's magic should be special 1",
      authors: ['Jag ga Ug'],
      source: 'dnb',
    });
  });

  it('liest ohne Personen-Felder die Namen aus der Verantwortlichkeitsangabe', async () => {
    vi.stubGlobal(
      'fetch',
      route({ dnb: MANHWA_RECORD.replace(/<datafield tag="100"[\s\S]*?<\/datafield>/, '') })
    );
    const [hit] = await searchBooks('9783963588853');
    expect(hit.authors).toEqual(['Wookjakga', 'Usonan']);
  });

  it('füllt einen dünnen Katalog-Eintrag mit den Daten der ISBN-Quellen auf, statt sie zu verwerfen', async () => {
    catalog.hits = [
      {
        id: 'dnb-9783551358165',
        title: 'Artemis Fowl - die Rache',
        authors: [],
        cover: 'https://api.tv-rank.de/bookcover/book/dnb-9783551358165-L.jpg',
        isbn13: '9783551358165',
        source: 'dnb',
      },
    ];
    try {
      vi.stubGlobal('fetch', route({ dnb: DNB_RECORD }));
      const hits = await searchBooks('9783551358165');
      expect(hits).toHaveLength(1);
      expect(hits[0]).toMatchObject({
        id: 'dnb-9783551358165',
        authors: ['Eoin Colfer'],
        pageCount: 334,
        publisher: 'Carlsen',
      });
      expect(hits[0].cover).toContain('/bookcover/book/');
    } finally {
      catalog.hits = [];
    }
  });

  it('repariert gecachte Treffer ohne authors', async () => {
    const fetchMock = route({});
    vi.stubGlobal('fetch', fetchMock);
    localStorage.setItem(
      'bk:search:e5:de:o:9783963588850',
      JSON.stringify({
        at: Date.now(),
        value: [{ id: 'dnb-9783963588850', title: 'Ohne Autor', source: 'dnb' }],
      })
    );
    const [hit] = await searchBooks('9783963588850');
    expect(hit.authors).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
