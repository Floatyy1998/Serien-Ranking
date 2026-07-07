import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildTmdbUrl, tmdbFetch } from './tmdbClient';

describe('tmdbClient', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_TMDB', 'testkey');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('buildTmdbUrl', () => {
    it('setzt api_key + Default-Sprache de-DE', () => {
      const url = new URL(buildTmdbUrl('tv/123'));
      expect(url.origin + url.pathname).toBe('https://api.themoviedb.org/3/tv/123');
      expect(url.searchParams.get('api_key')).toBe('testkey');
      expect(url.searchParams.get('language')).toBe('de-DE');
    });

    it('überschreibt die Sprache und lässt sie via undefined weg', () => {
      expect(
        new URL(buildTmdbUrl('tv/1', { language: 'en-US' })).searchParams.get('language')
      ).toBe('en-US');
      expect(
        new URL(buildTmdbUrl('tv/1/watch/providers', { language: undefined })).searchParams.has(
          'language'
        )
      ).toBe(false);
    });

    it('lässt null/leer-Params weg und serialisiert Zahlen', () => {
      const url = new URL(buildTmdbUrl('discover/tv', { page: 2, with_genres: null, region: '' }));
      expect(url.searchParams.get('page')).toBe('2');
      expect(url.searchParams.has('with_genres')).toBe(false);
      expect(url.searchParams.has('region')).toBe(false);
    });

    it('normalisiert führende Slashes im Pfad', () => {
      expect(new URL(buildTmdbUrl('/movie/5')).pathname).toBe('/3/movie/5');
    });
  });

  describe('tmdbFetch', () => {
    it('parst JSON bei ok', async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValue({ ok: true, json: () => Promise.resolve({ id: 7 }) });
      vi.stubGlobal('fetch', fetchMock);
      await expect(tmdbFetch('tv/7')).resolves.toEqual({ id: 7 });
      expect(fetchMock).toHaveBeenCalledOnce();
    });

    it('wirft bei !ok', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
      await expect(tmdbFetch('tv/nope')).rejects.toThrow('TMDB 404');
    });

    it('wirft ohne API-Key', async () => {
      vi.stubEnv('VITE_API_TMDB', '');
      await expect(tmdbFetch('tv/1')).rejects.toThrow('VITE_API_TMDB');
    });
  });
});
