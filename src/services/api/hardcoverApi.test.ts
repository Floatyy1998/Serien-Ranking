// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const backendFetch = vi.hoisted(() => vi.fn());
const captureError = vi.hoisted(() => vi.fn());
const session = vi.hoisted(() => ({ active: true }));

vi.mock('../i18n', () => ({ appLocale: 'de' }));
vi.mock('./backendApi', () => ({ backendFetch, hasBackendSession: () => session.active }));
vi.mock('../errorReporting/errorReporter', () => ({ captureError }));

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const item = {
  id: 'hc-328491',
  hardcoverId: 328491,
  title: 'Harry Potter und der Stein der Weisen',
  authors: ['J.K. Rowling'],
  cover: 'https://serienapi.konrad-dinges.de/bookcover/hc/abc.jpg',
  isbn13: '9783551354013',
  language: 'de',
  popularity: 16084,
  avgRating: 4.3,
  series: { name: 'Harry Potter', position: 1, hardcoverId: 7 },
};

describe('hardcoverApi', () => {
  beforeEach(() => {
    vi.resetModules();
    backendFetch.mockReset();
    captureError.mockReset();
    localStorage.clear();
    session.active = true;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sucht auch ohne Anmeldung bei Hardcover (Onboarding vor der Registrierung)', async () => {
    session.active = false;
    backendFetch.mockResolvedValue(json({ results: [item] }));
    const { hardcoverReady, hardcoverSearch } = await import('./hardcoverApi');
    expect(hardcoverReady()).toBe(true);
    expect(await hardcoverSearch('harry')).toHaveLength(1);
    expect(backendFetch.mock.calls[0][0]).toBe('/hc/search');
  });

  it('schickt Login-Routen ohne Anmeldung gar nicht erst ab und pausiert nicht', async () => {
    session.active = false;
    const { hardcoverReady, hardcoverAuthorBooks } = await import('./hardcoverApi');
    await expect(hardcoverAuthorBooks('Rowling')).rejects.toMatchObject({ code: 'guest' });
    expect(backendFetch).not.toHaveBeenCalled();
    expect(hardcoverReady()).toBe(true);
  });

  it('bildet Treffer im App-Format ab, mit Reihe im Schlüsselfeld der Wikidata-ID', async () => {
    backendFetch.mockResolvedValue(json({ results: [item] }));
    const { hardcoverSearch } = await import('./hardcoverApi');
    const [hit] = await hardcoverSearch('harry potter');
    expect(hit).toMatchObject({
      id: 'hc-328491',
      hardcoverId: 328491,
      source: 'hardcover',
      cover: item.cover,
      series: { name: 'Harry Potter', position: 1, wikidataId: 'hc:Harry Potter', hardcoverId: 7 },
    });
    const [path, init] = backendFetch.mock.calls[0];
    expect(path).toBe('/hc/search');
    expect(JSON.parse(init.body)).toEqual({ lang: 'de', q: 'harry potter' });
    expect(backendFetch.mock.calls[0][2]).toEqual({ quietStatuses: [503] });
  });

  it('meldet einen 503 im Vordergrund erst, wenn auch die Wiederholung scheitert', async () => {
    vi.useFakeTimers();
    backendFetch.mockImplementation(async () => json({ error: 'upstream' }, 503));
    const { hardcoverSearch } = await import('./hardcoverApi');
    const pending = hardcoverSearch('harry potter');
    const assertion = expect(pending).rejects.toMatchObject({ code: 'upstream' });
    await vi.advanceTimersByTimeAsync(2000);
    await assertion;
    expect(backendFetch.mock.calls.map((call) => call[2])).toEqual([
      { quietStatuses: [503] },
      undefined,
    ]);
  });

  it('wiederholt nicht, wenn der Aufrufer inzwischen abgebrochen hat, und zählt das nicht als Hardcover-Fehler', async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    backendFetch.mockImplementation(async () => json({ error: 'upstream' }, 503));
    const { hardcoverSearch, hardcoverFailureCount, hardcoverReady } =
      await import('./hardcoverApi');
    const pending = hardcoverSearch('harry', controller.signal);
    const assertion = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    await vi.advanceTimersByTimeAsync(500);
    controller.abort();
    await vi.advanceTimersByTimeAsync(2000);
    await assertion;
    expect(backendFetch).toHaveBeenCalledTimes(1);
    expect(hardcoverFailureCount()).toBe(0);
    expect(hardcoverReady()).toBe(true);
    expect(captureError).not.toHaveBeenCalled();
  });

  it('fragt nach einem Abbruch gar nicht erst an', async () => {
    const controller = new AbortController();
    controller.abort();
    const { hardcoverSearch } = await import('./hardcoverApi');
    await expect(hardcoverSearch('harry', controller.signal)).rejects.toMatchObject({
      name: 'AbortError',
    });
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it('wiederholt einen 503 nicht, auf den der Server schon lange gewartet hat, und meldet ihn selbst', async () => {
    vi.useFakeTimers();
    backendFetch.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 15_000));
      return json({ error: 'upstream' }, 503);
    });
    const { hardcoverSearch } = await import('./hardcoverApi');
    const pending = hardcoverSearch('harry');
    const assertion = expect(pending).rejects.toMatchObject({ code: 'upstream' });
    await vi.advanceTimersByTimeAsync(20_000);
    await assertion;
    expect(backendFetch).toHaveBeenCalledTimes(1);
    expect(captureError).toHaveBeenCalledTimes(1);
    expect(captureError.mock.calls[0][0].message).toContain(
      'POST /hc/search -> 503 upstream nach 15 s, keine Wiederholung'
    );
  });

  it('meldet abgewiesene Hintergrund-Abfragen nicht als Fehler und zählt sie als gescheitert', async () => {
    vi.useFakeTimers();
    backendFetch.mockImplementation(async () => json({ error: 'busy' }, 503));
    const { hardcoverSearch, hardcoverFailureCount } = await import('./hardcoverApi');
    const before = hardcoverFailureCount();
    const pending = hardcoverSearch('harry potter', undefined, true);
    const assertion = expect(pending).rejects.toMatchObject({ code: 'busy' });
    await vi.advanceTimersByTimeAsync(2000);
    await assertion;
    expect(backendFetch.mock.calls[0][2]).toEqual({ quietStatuses: [429, 503] });
    expect(hardcoverFailureCount()).toBe(before + 1);
  });

  it('nimmt ohne eigenes Cover das ISBN-Cover der Sprache', async () => {
    const { mapHardcoverItem } = await import('./hardcoverApi');
    const german = mapHardcoverItem({
      ...item,
      cover: undefined,
      coverFallback: 'https://x/y.jpg',
    });
    expect(german.cover).toContain('portal.dnb.de');
    expect(german.coverFallback).toBe('https://x/y.jpg');
    const english = mapHardcoverItem({ ...item, cover: undefined, language: 'en' });
    expect(english.cover).toContain('covers.openlibrary.org/b/isbn/9783551354013');
    const none = mapHardcoverItem({ ...item, cover: undefined, isbn13: undefined });
    expect(none.cover).toBeUndefined();
  });

  it('pausiert nach leerem Kontingent und fragt dann gar nicht erst', async () => {
    backendFetch.mockResolvedValue(json({ error: 'budget' }, 503));
    const { hardcoverSearch, hardcoverReady } = await import('./hardcoverApi');
    expect(hardcoverReady()).toBe(true);
    await expect(hardcoverSearch('harry')).rejects.toMatchObject({ code: 'budget' });
    expect(hardcoverReady()).toBe(false);
    await expect(hardcoverSearch('harry')).rejects.toMatchObject({ code: 'paused' });
    expect(backendFetch).toHaveBeenCalledTimes(1);
  });

  it('pausiert kurz, wenn der Proxy noch nicht deployt ist (404)', async () => {
    backendFetch.mockResolvedValue(new Response('nope', { status: 404 }));
    const { hardcoverIsbn, hardcoverReady } = await import('./hardcoverApi');
    await expect(hardcoverIsbn('9783551354013')).rejects.toMatchObject({ code: 'config' });
    expect(hardcoverReady()).toBe(false);
  });

  it('wiederholt einen weichen Fehler einmal, ohne Hardcover zu pausieren', async () => {
    vi.useFakeTimers();
    backendFetch
      .mockResolvedValueOnce(json({ error: 'busy' }, 503))
      .mockResolvedValueOnce(json({ results: [item] }));
    const { hardcoverSearch, hardcoverReady } = await import('./hardcoverApi');
    const pending = hardcoverSearch('harry');
    await vi.advanceTimersByTimeAsync(1500);
    expect(await pending).toHaveLength(1);
    expect(backendFetch).toHaveBeenCalledTimes(2);
    expect(hardcoverReady()).toBe(true);
  });

  it('merkt sich übersetzte Klappentexte, aber kein „Tageslimit erreicht“', async () => {
    localStorage.clear();
    backendFetch
      .mockResolvedValueOnce(json({ text: null, reason: 'cap' }))
      .mockResolvedValueOnce(json({ text: 'Ein Buch über Drachen.' }));
    const { hardcoverDescription } = await import('./hardcoverApi');
    expect(await hardcoverDescription(7)).toEqual({ text: null, capped: true });
    expect((await hardcoverDescription(7)).text).toBe('Ein Buch über Drachen.');
    expect((await hardcoverDescription(7)).text).toBe('Ein Buch über Drachen.');
    expect(backendFetch).toHaveBeenCalledTimes(2);
  });

  it('wiederholt ein 429 der Ratenbremse nicht', async () => {
    backendFetch.mockResolvedValue(new Response('slow down', { status: 429 }));
    const { hardcoverSearch } = await import('./hardcoverApi');
    await expect(hardcoverSearch('harry')).rejects.toMatchObject({ code: 'busy' });
    expect(backendFetch).toHaveBeenCalledTimes(1);
  });

  it('pausiert erst, wenn sich weiche Fehler binnen einer Minute häufen', async () => {
    vi.useFakeTimers();
    backendFetch.mockResolvedValue(json({ error: 'upstream' }, 503));
    const { hardcoverSearch, hardcoverReady } = await import('./hardcoverApi');
    for (let i = 0; i < 2; i++) {
      const pending = hardcoverSearch(`harry ${i}`).catch((e) => e);
      await vi.advanceTimersByTimeAsync(1500);
      await pending;
      expect(hardcoverReady()).toBe(true);
    }
    const third = hardcoverSearch('harry 3').catch((e) => e);
    await vi.advanceTimersByTimeAsync(1500);
    await third;
    expect(hardcoverReady()).toBe(false);
  });

  it('liefert Reihenteile nur mit ganzzahliger Bandnummer und zeigt Zukunftsbände als erscheinend', async () => {
    const { seriesPartsFrom, mapHardcoverItem } = await import('./hardcoverApi');
    const book = (position: number, year: number) =>
      mapHardcoverItem({
        ...item,
        id: `hc-${position}`,
        hardcoverId: position * 10,
        title: `Band ${position}`,
        publishedYear: year,
        series: { name: 'Harry Potter', position },
      });
    const parts = seriesPartsFrom(
      [book(3, 1999), book(0.5, 2010), book(1, 1997), book(4, 2031)],
      new Date('2026-10-16')
    );
    expect(parts.map((p) => p.position)).toEqual([1, 3, 4]);
    expect(parts[2].publishedDate).toBe('2031-01-01');
    expect(parts[0].publishedDate).toBeUndefined();
    expect(parts[0].result?.title).toBe('Band 1');
  });

  it('holt Reihenteile einmal und merkt sie sich', async () => {
    backendFetch.mockResolvedValue(
      json({
        results: [
          { ...item, id: 'hc-1', hardcoverId: 1 },
          { ...item, id: 'hc-2', hardcoverId: 2, series: { name: 'Harry Potter', position: 2 } },
        ],
      })
    );
    const { hardcoverSeriesParts } = await import('./hardcoverApi');
    expect(await hardcoverSeriesParts('Harry Potter')).toHaveLength(2);
    expect(await hardcoverSeriesParts('Harry Potter')).toHaveLength(2);
    expect(backendFetch).toHaveBeenCalledTimes(1);
  });
});
