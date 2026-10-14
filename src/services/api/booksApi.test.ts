// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../i18n', () => ({ appLocale: 'de' }));

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
    vi.stubEnv('VITE_GOOGLE_BOOKS_API_KEY', '');
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

  it('fragt Google bei Hintergrund-Abgleichen nie, auch mit Schlüssel', async () => {
    vi.stubEnv('VITE_GOOGLE_BOOKS_API_KEY', 'test-key');
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
});

describe('searchBooks per ISBN', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('findet deutsche Ausgaben über die DNB, wenn Google und Open Library nichts liefern', async () => {
    vi.stubEnv('VITE_GOOGLE_BOOKS_API_KEY', 'test-key');
    vi.stubGlobal(
      'fetch',
      route({ google: () => new Response('', { status: 503 }), dnb: DNB_RECORD })
    );
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
    vi.stubEnv('VITE_GOOGLE_BOOKS_API_KEY', '');
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
    vi.stubEnv('VITE_GOOGLE_BOOKS_API_KEY', '');
    vi.stubGlobal('fetch', route({}));
    expect(await searchBooks('9783328600930')).toEqual([]);
    vi.stubGlobal('fetch', route({ dnb: DNB_RECORD }));
    expect((await searchBooks('9783328600930'))[0]?.title).toBe('Artemis Fowl - die Rache');
  });

  it('nimmt ohne Autor-Rolle den Haupteintrag und entfernt MARC-Sortierzeichen', async () => {
    vi.stubEnv('VITE_GOOGLE_BOOKS_API_KEY', 'test-key');
    vi.stubGlobal(
      'fetch',
      route({ google: () => new Response('', { status: 503 }), dnb: MANHWA_RECORD })
    );
    const [hit] = await searchBooks('978-3-96358-885-3');
    expect(hit).toMatchObject({
      title: "A returner's magic should be special 1",
      authors: ['Jag ga Ug'],
      source: 'dnb',
    });
  });

  it('behält authors als leeres Array, wenn die DNB gar keine Person kennt', async () => {
    vi.stubEnv('VITE_GOOGLE_BOOKS_API_KEY', '');
    vi.stubGlobal(
      'fetch',
      route({ dnb: MANHWA_RECORD.replace(/<datafield tag="100"[\s\S]*?<\/datafield>/, '') })
    );
    const [hit] = await searchBooks('9783963588853');
    expect(hit.authors).toEqual([]);
  });

  it('repariert gecachte Treffer ohne authors', async () => {
    vi.stubEnv('VITE_GOOGLE_BOOKS_API_KEY', '');
    const fetchMock = route({});
    vi.stubGlobal('fetch', fetchMock);
    localStorage.setItem(
      'bk:search:de:o:9783963588850',
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
