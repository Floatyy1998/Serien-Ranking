import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  isLikelyAnime,
  anilistLinkCountsForDe,
  fetchAniListProviderFallback,
} from './anilistProviderFallback';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/** Baut eine fetch-Antwort für den AniList-Media-Query. */
const stubFetch = (media: unknown, ok = true) => {
  const fetchMock = vi.fn(async () => ({
    ok,
    json: async () => ({ data: { Media: media } }),
  }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

describe('isLikelyAnime', () => {
  it('Anime-Genre → true', () => {
    expect(isLikelyAnime({ genre: { genres: ['Anime'] } })).toBe(true);
  });

  it('Animation + asiatische Sprache → true', () => {
    expect(isLikelyAnime({ genre: { genres: ['Animation'] }, original_language: 'ja' })).toBe(true);
    expect(isLikelyAnime({ genre: { genres: ['Animation'] }, origin_country: ['KR'] })).toBe(true);
  });

  it('Animation ohne origin_country → true (unbekannte Herkunft)', () => {
    expect(isLikelyAnime({ genre: { genres: ['Animation'] } })).toBe(true);
  });

  it('Animation + westliche Herkunft → false', () => {
    expect(
      isLikelyAnime({
        genre: { genres: ['Animation'] },
        original_language: 'en',
        origin_country: ['US'],
      })
    ).toBe(false);
  });

  it('kein Anime/Animation-Genre → false', () => {
    expect(isLikelyAnime({ genre: { genres: ['Drama'] } })).toBe(false);
    expect(isLikelyAnime({})).toBe(false);
  });
});

describe('anilistLinkCountsForDe', () => {
  it('regionslose Provider akzeptieren null/German/English', () => {
    expect(anilistLinkCountsForDe('Crunchyroll', null)).toBe(true);
    expect(anilistLinkCountsForDe('Crunchyroll', 'German')).toBe(true);
    expect(anilistLinkCountsForDe('Crunchyroll', 'English')).toBe(true);
    expect(anilistLinkCountsForDe('Netflix', undefined)).toBe(true);
    expect(anilistLinkCountsForDe('Amazon Prime Video', 'English')).toBe(true);
  });

  it('regionslose Provider lehnen andere Sprachen ab', () => {
    expect(anilistLinkCountsForDe('Crunchyroll', 'French')).toBe(false);
    expect(anilistLinkCountsForDe('Netflix', 'Spanish')).toBe(false);
  });

  it('andere Provider nur mit explizitem German', () => {
    expect(anilistLinkCountsForDe('Disney Plus', 'German')).toBe(true);
    expect(anilistLinkCountsForDe('Disney Plus', 'English')).toBe(false);
    expect(anilistLinkCountsForDe('Disney Plus', null)).toBe(false);
    expect(anilistLinkCountsForDe('WOW', undefined)).toBe(false);
  });
});

describe('fetchAniListProviderFallback', () => {
  it('leerer Titel → [] (kein fetch)', async () => {
    const fetchMock = stubFetch(null);
    await expect(fetchAniListProviderFallback('   ')).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('liefert normalisierte Provider aus STREAMING-Links eines aktuellen Titels', async () => {
    stubFetch({
      title: { english: 'Frieren', romaji: 'Sousou no Frieren' },
      status: 'RELEASING',
      startDate: { year: 2024 },
      externalLinks: [
        { site: 'Crunchyroll', type: 'STREAMING', language: null },
        { site: 'Some Blog', type: 'INFO', language: null },
      ],
    });
    const result = await fetchAniListProviderFallback('Frieren');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Crunchyroll');
    expect(typeof result[0].logo).toBe('string');
  });

  it('nicht-ok Antwort → []', async () => {
    stubFetch({ title: { romaji: 'X' }, status: 'RELEASING' }, false);
    await expect(fetchAniListProviderFallback('X')).resolves.toEqual([]);
  });

  it('kein Media-Treffer → []', async () => {
    stubFetch(null);
    await expect(fetchAniListProviderFallback('Unbekannt')).resolves.toEqual([]);
  });

  it('alter Titel (nicht recent) → []', async () => {
    stubFetch({
      title: { romaji: 'Gurren Lagann' },
      status: 'FINISHED',
      startDate: { year: 2007 },
      externalLinks: [{ site: 'Crunchyroll', type: 'STREAMING', language: null }],
    });
    await expect(fetchAniListProviderFallback('Gurren Lagann')).resolves.toEqual([]);
  });

  it('Titel-Mismatch (Fuzzy-Fehltreffer) → []', async () => {
    stubFetch({
      title: { english: 'Etwas ganz anderes', romaji: 'Voellig anders' },
      status: 'RELEASING',
      startDate: { year: 2024 },
      externalLinks: [{ site: 'Crunchyroll', type: 'STREAMING', language: null }],
    });
    await expect(fetchAniListProviderFallback('Frieren')).resolves.toEqual([]);
  });

  it('regionsgebundene Provider ohne German-Link werden gefiltert', async () => {
    stubFetch({
      title: { romaji: 'Frieren' },
      status: 'RELEASING',
      startDate: { year: 2024 },
      externalLinks: [{ site: 'Disney Plus', type: 'STREAMING', language: 'English' }],
    });
    await expect(fetchAniListProviderFallback('Frieren')).resolves.toEqual([]);
  });

  it('Netzwerkfehler → []', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline');
      })
    );
    await expect(fetchAniListProviderFallback('Frieren')).resolves.toEqual([]);
  });
});
