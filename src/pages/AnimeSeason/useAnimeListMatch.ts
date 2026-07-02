/**
 * Feature „Anime-Season-Kalender" — „In meiner Liste"-Abgleich.
 *
 * Matching-Strategie (in dieser Reihenfolge):
 *   1. MAL-Id-Mapping: Die Backend-Pipeline (AniList→Jikan) schreibt
 *      `admin/animeFiller/{tmdbId}.malId` — AniList liefert `idMal`, darüber
 *      matchen wir exakt. Quelle ist zuerst der synchrone localStorage-Cache
 *      des animeFillerService (kostenlos), danach ein begrenzter Satz
 *      Einzelfeld-Reads (`…/malId`, ~50 Bytes) für Anime-Kandidaten aus der
 *      Nutzerliste, gecacht in sessionStorage.
 *   2. Titel-Heuristik: normalisierte Titel (lowercase, Sonderzeichen raus)
 *      der Nutzerserien gegen english/romaji des AniList-Eintrags.
 *   3. Basistitel-Heuristik: Season-/Part-Suffix gestrippt („Saga of Tanya
 *      the Evil Season 2" → „Saga of Tanya the Evil") — Sequel-Seasons sind
 *      bei TMDB dieselbe Serie, tragen auf AniList aber eigene MAL-Ids und
 *      Suffix-Titel und würden sonst nie matchen.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useSeriesList } from '../../contexts/SeriesListContext';
import { readFillerCacheSync } from '../../services/animeFillerService';
import { franchiseTitle, stripSeasonSuffix } from './animeFormat';
import type { SeasonAnime } from '../../services/anilistSeasonService';
import type { Series } from '../../types/Series';

const ENRICH_CACHE_KEY = 'animeSeasonMalIds:v1';
/** Obergrenze für Firebase-Einzelfeld-Reads pro Session (Egress-Schutz). */
const MAX_ENRICH_READS = 40;

/** Titel normalisieren: lowercase, Diakritika + Sonderzeichen raus, Whitespace bündeln. */
export function normalizeTitle(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Kandidaten, für die sich ein malId-Read lohnt (Anime-Heuristik wie CastCrew). */
function isAnimeCandidate(series: Series): boolean {
  const genres = series.genre?.genres ?? [];
  const hasAnimeGenre = genres.some((g) => typeof g === 'string' && /anime/i.test(g));
  const hasAnimationGenre = genres.some((g) => typeof g === 'string' && /animation/i.test(g));
  const isAsian =
    series.original_language === 'ja' ||
    (series.origin_country ?? []).some((c) => c === 'JP' || c === 'KR' || c === 'CN');
  return hasAnimeGenre || (hasAnimationGenre && (isAsian || !series.origin_country?.length));
}

type EnrichCache = Record<string, number | null>;

function readEnrichCache(): EnrichCache {
  try {
    const raw = sessionStorage.getItem(ENRICH_CACHE_KEY);
    return raw ? (JSON.parse(raw) as EnrichCache) : {};
  } catch {
    return {};
  }
}

function writeEnrichCache(cache: EnrichCache): void {
  try {
    sessionStorage.setItem(ENRICH_CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* quota – ignorieren */
  }
}

export interface AnimeListMatch {
  /** Liefert die Serie aus der Nutzerliste, falls der AniList-Eintrag dazugehört. */
  matchAnime: (anime: SeasonAnime) => Series | undefined;
}

export function useAnimeListMatch(): AnimeListMatch {
  const { seriesList } = useSeriesList();
  const [enrichedMalIds, setEnrichedMalIds] = useState<EnrichCache>(() => readEnrichCache());

  // MAL-Id → Serie: synchroner animeFiller-Cache + nachgeladene Einzelfeld-Reads.
  const malIdMap = useMemo(() => {
    const map = new Map<number, Series>();
    for (const series of seriesList) {
      const enriched = enrichedMalIds[String(series.id)];
      const malId = readFillerCacheSync(series.id)?.malId ?? enriched ?? null;
      if (typeof malId === 'number' && malId > 0 && !map.has(malId)) {
        map.set(malId, series);
      }
    }
    return map;
  }, [seriesList, enrichedMalIds]);

  // Normalisierter Titel → Serie (title/name/original_name).
  const titleMap = useMemo(() => {
    const map = new Map<string, Series>();
    for (const series of seriesList) {
      for (const candidate of [series.title, series.name, series.original_name]) {
        const normalized = normalizeTitle(candidate);
        if (normalized && !map.has(normalized)) map.set(normalized, series);
      }
    }
    return map;
  }, [seriesList]);

  // Best-effort-Anreicherung: fehlende malIds für Anime-Kandidaten nachladen.
  useEffect(() => {
    if (!seriesList.length) return;
    const known = readEnrichCache();
    const pending = seriesList
      .filter(isAnimeCandidate)
      .filter((s) => readFillerCacheSync(s.id)?.malId == null && known[String(s.id)] === undefined)
      .slice(0, MAX_ENRICH_READS);
    if (!pending.length) return;

    let cancelled = false;
    (async () => {
      const updates: EnrichCache = {};
      await Promise.all(
        pending.map(async (series) => {
          try {
            const snap = await firebase
              .database()
              .ref(`admin/animeFiller/${series.id}/malId`)
              .once('value');
            const value = snap.val();
            updates[String(series.id)] = typeof value === 'number' ? value : null;
          } catch {
            /* best-effort – kein Negativ-Cache bei Netzwerkfehlern */
          }
        })
      );
      if (cancelled || !Object.keys(updates).length) return;
      const merged = { ...readEnrichCache(), ...updates };
      writeEnrichCache(merged);
      setEnrichedMalIds(merged);
    })();

    return () => {
      cancelled = true;
    };
  }, [seriesList]);

  const matchAnime = useCallback(
    (anime: SeasonAnime): Series | undefined => {
      if (anime.idMal != null) {
        const byMalId = malIdMap.get(anime.idMal);
        if (byMalId) return byMalId;
      }
      for (const title of [anime.title.english, anime.title.romaji]) {
        const normalized = normalizeTitle(title);
        if (!normalized) continue;
        const byTitle = titleMap.get(normalized);
        if (byTitle) return byTitle;
      }
      // Sequel-Season? Basistitel (ohne „Season 2"/„Part 2"/„II") probieren —
      // die TMDB-Serie in der Liste heißt wie Staffel 1.
      for (const title of [anime.title.english, anime.title.romaji]) {
        if (!title) continue;
        const stripped = stripSeasonSuffix(title);
        if (!stripped || stripped === title) continue;
        const byBase = titleMap.get(normalizeTitle(stripped));
        if (byBase) return byBase;
      }
      // Arc-Untertitel? Franchise-Titel probieren („Tokyo Revengers:
      // Santen Sensou-hen" → „Tokyo Revengers").
      for (const title of [anime.title.english, anime.title.romaji]) {
        if (!title) continue;
        const franchise = franchiseTitle(title);
        if (!franchise) continue;
        const byFranchise = titleMap.get(normalizeTitle(franchise));
        if (byFranchise) return byFranchise;
      }
      return undefined;
    },
    [malIdMap, titleMap]
  );

  return { matchAnime };
}
