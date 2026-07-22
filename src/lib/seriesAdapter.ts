import type { Series } from '../types/Series';
import type { Movie } from '../types/Movie';
import type {
  CatalogSeries,
  CatalogSeason,
  CatalogMovie,
  CatalogEpisode,
  EpisodeWatchData,
  UserSeriesRef,
  UserMovieRef,
  SeriesWatchData,
} from '../types/CatalogTypes';
import {
  isEpidSeason,
  isLegacyArraySeason,
  readEpisodeById,
  readEpisodeFromLegacyArray,
} from './compactWatch';

/**
 * Firebase RTDB serialisiert Objects mit numerischen Keys, bei denen Index 0
 * fehlt, als sparse objects (z.B. {1: 'Drama', 2: 'Action'}). Das kann fuer
 * genres/providers passieren. Downstream-Code erwartet aber Arrays und ruft
 * .forEach/.filter drauf. Deshalb hier defensiv zu Array konvertieren.
 */
function ensureArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, T>);
  }
  return [];
}

/** Provider-Eintrag im Catalog-/Legacy-Wrapper-Format ({id, logo, name}). */
type ProviderEntry = CatalogSeries['providers'][number];

/**
 * Aeltere Catalog-Snapshots tragen Episodenfelder noch im TMDB-Rohformat
 * (snake_case). Der Adapter liest sie als Fallback zu den camelCase-Feldern
 * aus CatalogEpisode.
 */
interface LegacyRawEpisodeFields {
  air_date?: string;
  season_number?: number;
  episode_number?: number;
}

type AdapterCatalogEpisode = CatalogEpisode & LegacyRawEpisodeFields;

/**
 * Merges catalog data + user ref + watch data into the legacy Series interface.
 * This allows existing components to work without changes during migration.
 */
export function mergeToSeriesView(
  tmdbId: number,
  catalog: CatalogSeries,
  userRef: UserSeriesRef,
  watchData?: SeriesWatchData
): Series {
  const seasons: Series['seasons'] = [];

  if (catalog.seasons) {
    // Static-Catalog-JSON liefert seasons als Array, RTDB-Reste als Objekt
    // mit numerischen Keys — beides kann null-Loecher enthalten.
    const seasonsEntries: ReadonlyArray<readonly [string, CatalogSeason | null | undefined]> =
      Array.isArray(catalog.seasons)
        ? catalog.seasons.map((s, i) => [String(i), s] as const).filter(([, s]) => s != null)
        : Object.entries(catalog.seasons).filter(([, s]) => s != null);
    for (const [snKey, catalogSeason] of seasonsEntries) {
      if (!catalogSeason) continue;
      const episodesList = ensureArray<AdapterCatalogEpisode>(catalogSeason.episodes);
      if (episodesList.length === 0) continue;
      const sn = Number(snKey);
      const seasonWatch = watchData?.seasons?.[snKey];

      const episodes = episodesList.map((ep, idx) => {
        // ID-basiertes Format (eps-Map) bevorzugen, sonst Legacy-Array, sonst
        // pre-compact Episodes-Objekt.
        let watched = false;
        let watchCount = 0;
        let firstWatchedAt: string | undefined;
        let lastWatchedAt: string | undefined;
        let userRating: number | undefined;

        const epidSeason = seasonWatch && isEpidSeason(seasonWatch) ? seasonWatch : null;
        const epidHit = epidSeason && ep.id != null ? epidSeason.eps?.[String(ep.id)] : undefined;

        if (epidHit && epidSeason && ep.id != null) {
          const cw = readEpisodeById(epidSeason, ep.id);
          watched = cw.watched;
          watchCount = cw.watchCount;
          firstWatchedAt = cw.firstWatchedAt;
          lastWatchedAt = cw.lastWatchedAt;
          userRating = cw.userRating;
        } else if (seasonWatch && isLegacyArraySeason(seasonWatch)) {
          // Fallback wenn Season teil-migriert ist (eps existiert, aber diese
          // Episode steht noch im Legacy-Array). Sonst gehen vorher gesehene
          // Episoden bei der ersten ID-basierten Swipe-Markierung verloren.
          const cw = readEpisodeFromLegacyArray(seasonWatch, idx);
          watched = cw.watched;
          watchCount = cw.watchCount;
          firstWatchedAt = cw.firstWatchedAt;
          lastWatchedAt = cw.lastWatchedAt;
        } else if (seasonWatch) {
          const watch: EpisodeWatchData | undefined = seasonWatch.episodes?.[String(idx)];
          watched = watch?.watched ?? false;
          watchCount = watch?.watchCount ?? 0;
          firstWatchedAt = watch?.firstWatchedAt;
          lastWatchedAt = watch?.lastWatchedAt;
        }

        return {
          id: ep.id ?? 0,
          name: ep.name,
          air_date: ep.airDate || ep.air_date || '',
          airstamp: ep.airstamp || undefined,
          // season_number wird serverseitig nicht mehr in jede Episode geschrieben
          // (Bulk-File-Slim-Down). Outer Key `sn` ist die zuverlaessige Quelle.
          season_number: ep.seasonNumber ?? ep.season_number ?? sn,
          episode_number: ep.episodeNumber ?? ep.episode_number ?? idx + 1,
          runtime: ep.runtime ?? undefined,
          watched,
          watchCount,
          ...(firstWatchedAt ? { firstWatchedAt } : {}),
          ...(lastWatchedAt ? { lastWatchedAt } : {}),
          ...(userRating ? { userRating } : {}),
        };
      });

      seasons.push({ seasonNumber: sn, episodes });
    }

    seasons.sort((a, b) => a.seasonNumber - b.seasonNumber);
  }

  return {
    id: tmdbId,
    title: catalog.title,
    addedAt: userRef.addedAt,
    poster: { poster: catalog.poster },
    backdrop: catalog.backdrop,
    genre: { genres: ensureArray<string>(catalog.genres) },
    provider: { provider: ensureArray<ProviderEntry>(catalog.providers) },
    imdb: { imdb_id: catalog.imdbId ?? '' },
    wo: { wo: catalog.woUrl ?? '' },
    production: { production: catalog.production },
    rating: userRef.rating,
    begründung: userRef.begpirate ?? '',
    beschreibung: userRef.beschreibung,
    hidden: userRef.hidden,
    watchlist: userRef.watchlist,
    rewatch: userRef.rewatch,
    episodeCount: catalog.episodeCount,
    episodeRuntime: catalog.episodeRuntime,
    watchtime: catalog.watchtime,
    seasonCount: catalog.seasonCount,
    seasons,
    // origin_country / original_language stammen aus dem Catalog (Backend
    // schreibt sie in processSeriesWithTVDB), Defaults für aeltere Catalog-
    // Eintraege ohne diese Felder.
    origin_country: ensureArray<string>(catalog.originCountry),
    original_language: catalog.originalLanguage ?? '',
    original_name: '',
    popularity: 0,
    vote_average: 0,
    vote_count: 0,
    release_date: '',
  };
}

/**
 * Merges catalog movie data + user ref into the legacy Movie interface.
 * This allows existing components to work without changes during migration.
 */
export function mergeToMovieView(
  tmdbId: number,
  catalog: CatalogMovie,
  userRef: UserMovieRef
): Movie {
  return {
    id: tmdbId,
    title: catalog.title,
    poster: { poster: catalog.poster },
    backdrop: catalog.backdrop,
    genre: { genres: ensureArray<string>(catalog.genres) },
    provider: { provider: ensureArray<ProviderEntry>(catalog.providers) },
    imdb: { imdb_id: catalog.imdbId ?? '' },
    wo: { wo: catalog.woUrl ?? '' },
    runtime: catalog.runtime,
    rating: userRef.rating,
    begründung: userRef.begpirate ?? '',
    beschreibung: userRef.beschreibung,
    watchlist: userRef.watchlist,
    watched: userRef.watched,
    status: catalog.status ?? undefined,
    release_date: catalog.releaseDate ?? undefined,
    collection_id: catalog.collectionId ?? undefined,
    addedAt: userRef.addedAt,
    watchedAt: userRef.watchedAt,
    ratedAt: userRef.ratedAt,
    watchHistory: userRef.watchHistory,
  };
}
