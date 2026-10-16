// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const backendFetch = vi.hoisted(() => vi.fn());

vi.mock('../i18n', () => ({ appLocale: 'de' }));
vi.mock('./backendApi', () => ({ backendFetch }));

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
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
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
