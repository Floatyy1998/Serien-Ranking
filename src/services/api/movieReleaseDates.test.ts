// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const tmdbFetch = vi.hoisted(() => vi.fn());
vi.mock('./tmdbClient', () => ({ tmdbFetch }));
vi.mock('../settings/region', () => ({ watchRegion: 'DE' }));

const catalog = vi.hoisted(() => ({
  fetch: vi.fn(),
  onChange: null as (() => void) | null,
}));
vi.mock('../catalog/staticCatalog', () => ({
  fetchStaticMovieReleases: catalog.fetch,
  subscribeCatalogChange: (listener: () => void) => {
    catalog.onChange = listener;
    return () => {};
  },
}));

import {
  ensureMovieReleases,
  getMovieRelease,
  getMovieReleasesSnapshot,
  isMovieReleaseSettled,
  resetMovieReleasesForTests,
  subscribeMovieReleases,
} from './movieReleaseDates';

const STORAGE_KEY = 'movieReleaseDates:v1';
const NOW = new Date('2026-11-19T12:00:00Z');
const HOUR = 3_600_000;

const response = (date: string, type = 3) => ({
  results: [{ iso_3166_1: 'DE', release_dates: [{ type, release_date: `${date}T00:00:00.000Z` }] }],
});

const settle = async () => {
  for (let i = 0; i < 12; i++) await Promise.resolve();
};

const store = (entries: Record<string, [string, string, number]>, region = 'DE') =>
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ region, entries }));

describe('movieReleaseDates', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    localStorage.clear();
    tmdbFetch.mockReset();
    catalog.fetch.mockReset();
    catalog.fetch.mockResolvedValue({});
    catalog.onChange = null;
    resetMovieReleasesForTests();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Katalog', () => {
    it('nimmt den Start aus dem Katalog, ohne TMDB zu fragen', async () => {
      catalog.fetch.mockResolvedValue({ 10: '2026-12-17|2027-02-01', 11: '|2027-03-05' });
      const listener = vi.fn();
      subscribeMovieReleases(listener);

      ensureMovieReleases([10, 11]);
      expect(isMovieReleaseSettled(10)).toBe(false);
      await settle();

      expect(tmdbFetch).not.toHaveBeenCalled();
      expect(getMovieRelease(10)).toEqual({ date: '2026-12-17', kind: 'cinema' });
      expect(getMovieRelease(11)).toEqual({ date: '2027-03-05', kind: 'digital' });
      expect(isMovieReleaseSettled(10)).toBe(true);
      expect(listener).toHaveBeenCalled();
    });

    it('führt geprüfte Filme ohne Start als null und fragt nicht nach', async () => {
      catalog.fetch.mockResolvedValue({ 12: '' });
      ensureMovieReleases([12]);
      await settle();
      expect(getMovieRelease(12)).toBeNull();
      expect(isMovieReleaseSettled(12)).toBe(true);
      expect(tmdbFetch).not.toHaveBeenCalled();
    });

    it('fragt TMDB nur für Filme, die im Katalog fehlen', async () => {
      catalog.fetch.mockResolvedValue({ 10: '2026-12-17|' });
      tmdbFetch.mockResolvedValue(response('2026-12-03'));
      ensureMovieReleases([10, 13]);
      await settle();
      expect(tmdbFetch).toHaveBeenCalledTimes(1);
      expect(tmdbFetch).toHaveBeenCalledWith('movie/13/release_dates', { language: undefined });
      expect(getMovieRelease(13)).toEqual({ date: '2026-12-03', kind: 'cinema' });
    });

    it('zieht den Katalog einem älteren eigenen Abruf vor', async () => {
      store({ 10: ['2026-12-01', 'c', NOW.getTime()] });
      catalog.fetch.mockResolvedValue({ 10: '2026-12-17|' });
      ensureMovieReleases([10]);
      await settle();
      expect(getMovieRelease(10)).toEqual({ date: '2026-12-17', kind: 'cinema' });
    });

    it('lädt den Katalog nur einmal und fällt bei einem Fehler auf TMDB zurück', async () => {
      catalog.fetch.mockRejectedValue(new Error('offline'));
      tmdbFetch.mockResolvedValue(response('2026-12-17'));
      ensureMovieReleases([14]);
      ensureMovieReleases([14]);
      await settle();
      expect(catalog.fetch).toHaveBeenCalledTimes(1);
      expect(tmdbFetch).toHaveBeenCalledTimes(1);
      expect(getMovieRelease(14)).toEqual({ date: '2026-12-17', kind: 'cinema' });
    });

    it('übernimmt einen neuen Katalog-Stand', async () => {
      catalog.fetch.mockResolvedValue({ 10: '2026-12-17|' });
      ensureMovieReleases([10]);
      await settle();
      const before = getMovieReleasesSnapshot();

      catalog.fetch.mockResolvedValue({ 10: '2026-12-24|' });
      catalog.onChange?.();
      await settle();

      expect(getMovieRelease(10)).toEqual({ date: '2026-12-24', kind: 'cinema' });
      expect(getMovieReleasesSnapshot()).not.toBe(before);
    });

    it('behält den alten Stand, wenn der neue nicht lesbar ist', async () => {
      catalog.fetch.mockResolvedValue({ 10: '2026-12-17|' });
      ensureMovieReleases([10]);
      await settle();
      catalog.fetch.mockResolvedValue(null);
      catalog.onChange?.();
      await settle();
      expect(getMovieRelease(10)).toEqual({ date: '2026-12-17', kind: 'cinema' });
    });
  });

  describe('TMDB-Rückfall', () => {
    it('löst den regionalen Start auf, meldet Abonnenten und speichert ihn', async () => {
      tmdbFetch.mockResolvedValue(response('2026-12-17'));
      const listener = vi.fn();
      const unsubscribe = subscribeMovieReleases(listener);
      const before = getMovieReleasesSnapshot();

      expect(getMovieRelease(10)).toBeUndefined();
      ensureMovieReleases([10]);
      expect(isMovieReleaseSettled(10)).toBe(false);
      await settle();

      expect(tmdbFetch).toHaveBeenCalledWith('movie/10/release_dates', { language: undefined });
      expect(getMovieRelease(10)).toEqual({ date: '2026-12-17', kind: 'cinema' });
      expect(isMovieReleaseSettled(10)).toBe(true);
      expect(listener).toHaveBeenCalled();
      expect(getMovieReleasesSnapshot()).not.toBe(before);
      expect(getMovieReleasesSnapshot().release(10)).toEqual({
        date: '2026-12-17',
        kind: 'cinema',
      });
      expect(JSON.parse(localStorage.getItem(STORAGE_KEY) as string)).toMatchObject({
        region: 'DE',
        entries: { 10: ['2026-12-17', 'c', NOW.getTime()] },
      });
      unsubscribe();
    });

    it('merkt sich Filme ohne regionalen Start als null', async () => {
      tmdbFetch.mockResolvedValue({ results: [] });
      ensureMovieReleases([11]);
      await settle();
      expect(getMovieRelease(11)).toBeNull();
    });

    it('fragt frische Einträge nicht erneut ab', async () => {
      store({ 12: ['2026-12-01', 'd', NOW.getTime() - 2 * HOUR] });
      ensureMovieReleases([12]);
      await settle();
      expect(tmdbFetch).not.toHaveBeenCalled();
      expect(getMovieRelease(12)).toEqual({ date: '2026-12-01', kind: 'digital' });
    });

    it('zeigt abgelaufene Einträge weiter an und frischt sie auf', async () => {
      store({ 13: ['2026-12-01', 'c', NOW.getTime() - 25 * HOUR] });
      tmdbFetch.mockResolvedValue(response('2026-12-08'));
      expect(getMovieRelease(13)).toEqual({ date: '2026-12-01', kind: 'cinema' });
      ensureMovieReleases([13]);
      await settle();
      expect(getMovieRelease(13)).toEqual({ date: '2026-12-08', kind: 'cinema' });
    });

    it('hält vergangene Starts lange vor', async () => {
      store({ 14: ['2026-10-01', 'c', NOW.getTime() - 10 * 24 * HOUR] });
      ensureMovieReleases([14]);
      await settle();
      expect(tmdbFetch).not.toHaveBeenCalled();
    });

    it('verwirft den Cache einer anderen Region', async () => {
      store({ 15: ['2026-12-01', 'c', NOW.getTime()] }, 'US');
      tmdbFetch.mockResolvedValue(response('2026-12-17'));
      expect(getMovieRelease(15)).toBeUndefined();
      ensureMovieReleases([15]);
      await settle();
      expect(getMovieRelease(15)).toEqual({ date: '2026-12-17', kind: 'cinema' });
    });

    it('wiederholt fehlgeschlagene Abrufe erst nach einer Pause', async () => {
      tmdbFetch.mockRejectedValue(new Error('offline'));
      ensureMovieReleases([16]);
      await settle();
      expect(getMovieRelease(16)).toBeUndefined();
      expect(isMovieReleaseSettled(16)).toBe(true);

      ensureMovieReleases([16]);
      await settle();
      expect(tmdbFetch).toHaveBeenCalledTimes(1);

      vi.setSystemTime(NOW.getTime() + 11 * 60_000);
      tmdbFetch.mockResolvedValue(response('2026-12-17'));
      ensureMovieReleases([16]);
      await settle();
      expect(tmdbFetch).toHaveBeenCalledTimes(2);
      expect(getMovieRelease(16)).toEqual({ date: '2026-12-17', kind: 'cinema' });
    });

    it('lässt höchstens vier Abrufe gleichzeitig laufen', async () => {
      const open: (() => void)[] = [];
      tmdbFetch.mockImplementation(
        () => new Promise((resolve) => open.push(() => resolve(response('2026-12-17'))))
      );
      ensureMovieReleases([21, 22, 23, 24, 25, 26]);
      await settle();
      expect(tmdbFetch).toHaveBeenCalledTimes(4);
      open.splice(0).forEach((finish) => finish());
      await settle();
      expect(tmdbFetch).toHaveBeenCalledTimes(6);
      open.splice(0).forEach((finish) => finish());
      await settle();
      expect(getMovieRelease(26)).toEqual({ date: '2026-12-17', kind: 'cinema' });
    });
  });
});
