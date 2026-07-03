/**
 * AniList-Streaming-Link-Fallback für Provider — für JEDEN Anime, auch ohne
 * Katalog- oder Listen-Eintrag (z. B. Detailseite einer nie getrackten
 * Serie): TMDBs JustWatch-Daten fehlen bei Nischen-Titeln und frischen
 * Simulcasts oft, während AniList den Crunchyroll/Netflix-Link ab
 * Ankündigung führt.
 *
 * Ablauf: AniList-Suche per Titel (type ANIME) → grobe Titel-Validierung
 * (gegen Fuzzy-Fehl-Matches) → externalLinks vom Typ STREAMING (sprachneutral
 * bzw. DE/EN) → App-Provider via normalizeProviderName, Logos aus der
 * lokalen Provider-Map. Ergebnisse (auch leere) werden pro Titel in
 * sessionStorage gecacht — eine Detailseite kostet also max. EINEN
 * AniList-Request pro Session.
 */

import { getProviderLogoUrl } from './providerMerge';
import type { MergedProvider } from './providerMerge';
import { normalizeProviderName } from './validation/providerChangeDetection';

const ANILIST_API = 'https://graphql.anilist.co';
// v3: nur laufende/junge Titel (Klassiker-Kataloge sind fragmentiert)
const CACHE_KEY = 'anilistProviderFallback:v3';

type FallbackCache = Record<string, MergedProvider[]>;

function readCache(): FallbackCache {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as FallbackCache) : {};
  } catch {
    return {};
  }
}

function writeCache(key: string, providers: MergedProvider[]): void {
  try {
    const cache = readCache();
    cache[key] = providers;
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* quota – ignorieren */
  }
}

/** Titel normalisieren (lowercase, Sonderzeichen raus) — wie useAnimeListMatch. */
function normalizeTitle(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Anime-Heuristik (wie useAnimeListMatch.isAnimeCandidate): Anime-Genre,
 * oder Animation + asiatische Herkunft. Verhindert AniList-Anfragen für
 * West-Cartoons und Live-Action.
 */
export function isLikelyAnime(series: {
  original_language?: string;
  origin_country?: string[];
  genre?: { genres?: unknown[] };
}): boolean {
  const genres = series.genre?.genres ?? [];
  const hasAnimeGenre = genres.some((g) => typeof g === 'string' && /anime/i.test(g));
  const hasAnimationGenre = genres.some((g) => typeof g === 'string' && /animation/i.test(g));
  const isAsian =
    series.original_language === 'ja' ||
    series.original_language === 'zh' ||
    series.original_language === 'ko' ||
    (series.origin_country ?? []).some((c) => c === 'JP' || c === 'KR' || c === 'CN' || c === 'TW');
  return hasAnimeGenre || (hasAnimationGenre && (isAsian || !series.origin_country?.length));
}

interface AniListMedia {
  title?: { english?: string | null; romaji?: string | null };
  status?: string | null;
  startDate?: { year?: number | null } | null;
  externalLinks?: { site?: string; type?: string | null; language?: string | null }[];
}

/**
 * Provider für einen Anime-Titel aus AniList-Streaming-Links.
 * Liefert [] wenn kein (valider) Treffer — auch das wird gecacht.
 */
export async function fetchAniListProviderFallback(title: string): Promise<MergedProvider[]> {
  const cacheKey = normalizeTitle(title);
  if (!cacheKey) return [];
  const cached = readCache()[cacheKey];
  if (cached !== undefined) return cached;

  try {
    const response = await fetch(ANILIST_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `query ($q: String) {
          Media(search: $q, type: ANIME) {
            title { english romaji }
            status
            startDate { year }
            externalLinks { site type language }
          }
        }`,
        variables: { q: title },
      }),
    });
    if (!response.ok) return [];
    const json = (await response.json()) as { data?: { Media?: AniListMedia | null } };
    const media = json.data?.Media;
    if (!media) {
      writeCache(cacheKey, []);
      return [];
    }

    // Nur laufende/junge Titel: Simulcast-Links bedeuten fast immer
    // DE-Verfügbarkeit — bei alten Klassikern (Gurren Lagann!) ist der
    // DE-Katalog fragmentiert, da raten wir NICHT.
    const recent =
      media.status === 'RELEASING' ||
      media.status === 'NOT_YET_RELEASED' ||
      (media.startDate?.year ?? 0) >= new Date().getFullYear() - 1;
    if (!recent) {
      writeCache(cacheKey, []);
      return [];
    }

    // Fuzzy-Search-Absicherung: der Treffer muss zum gesuchten Titel passen.
    const names = [media.title?.english, media.title?.romaji]
      .map((name) => normalizeTitle(name))
      .filter(Boolean);
    const matches = names.some(
      (name) => name === cacheKey || name.startsWith(cacheKey) || cacheKey.startsWith(name)
    );
    if (!matches) {
      writeCache(cacheKey, []);
      return [];
    }

    const seen = new Set<string>();
    const providers: MergedProvider[] = [];
    for (const link of media.externalLinks ?? []) {
      if (link?.type !== 'STREAMING') continue;
      const normalized = normalizeProviderName(link.site ?? '');
      if (!normalized || seen.has(normalized)) continue;
      // AniList-Links tragen KEINE Region (US-Bias!): Crunchyroll gilt auch
      // sprachneutral (EU-weiter Anime-Katalog), alle anderen Anbieter nur
      // mit explizitem language=German — sonst würden US-Lizenzen (Netflix/
      // Hulu-Style) fälschlich als in DE verfügbar angezeigt.
      const isCrunchyroll = /crunchyroll/i.test(normalized);
      const langOk = isCrunchyroll
        ? !link.language || link.language === 'German' || link.language === 'English'
        : link.language === 'German';
      if (!langOk) continue;
      const logo = getProviderLogoUrl(normalized);
      if (!logo) continue;
      seen.add(normalized);
      providers.push({ name: normalized, logo });
    }
    writeCache(cacheKey, providers);
    return providers;
  } catch {
    // Netzwerkfehler NICHT cachen — nächster Besuch versucht es erneut.
    return [];
  }
}
