import type { Series } from '../types/Series';
import type { Movie } from '../types/Movie';
import type {
  CatalogSeries,
  CatalogMovie,
  UserSeriesRef,
  UserMovieRef,
  SeriesWatchData,
} from '../types/CatalogTypes';

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
    for (const [snKey, catalogSeason] of Object.entries(catalog.seasons)) {
      // Firebase serialisiert Objects mit numerischen Keys als Arrays. Fehlt
      // Index 0, enthaelt das Array einen null-Eintrag. Ueberspringen.
      if (!catalogSeason || !Array.isArray(catalogSeason.episodes)) continue;
      const sn = Number(snKey);
      const seasonWatch = watchData?.seasons?.[snKey];

      const episodes = catalogSeason.episodes.map((ep, idx) => {
        const watch = seasonWatch?.episodes?.[String(idx)];
        // Catalog kann sowohl camelCase (airDate) als auch snake_case (air_date) haben
        const rawEp = ep as unknown as Record<string, unknown>;
        return {
          id: ep.id ?? 0,
          name: ep.name,
          air_date: ep.airDate || (rawEp.air_date as string) || '',
          airstamp: ep.airstamp || (rawEp.airstamp as string) || undefined,
          season_number: ep.seasonNumber ?? (rawEp.season_number as number) ?? 0,
          episode_number: ep.episodeNumber ?? (rawEp.episode_number as number) ?? 0,
          runtime: ep.runtime ?? (rawEp.runtime as number) ?? undefined,
          watched: watch?.watched ?? false,
          watchCount: watch?.watchCount ?? 0,
          ...(watch?.firstWatchedAt ? { firstWatchedAt: watch.firstWatchedAt } : {}),
          ...(watch?.lastWatchedAt ? { lastWatchedAt: watch.lastWatchedAt } : {}),
        };
      });

      seasons.push({ seasonNumber: sn, episodes });
    }

    seasons.sort((a, b) => a.seasonNumber - b.seasonNumber);
  }

  return {
    id: tmdbId,
    title: catalog.title,
    nmr: userRef.legacyNmr ?? 0,
    poster: { poster: catalog.poster },
    genre: { genres: ensureArray<string>(catalog.genres) },
    provider: { provider: ensureArray(catalog.providers) },
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
    // Required by Series but not stored in catalog — provide defaults
    origin_country: [],
    original_language: '',
    original_name: '',
    popularity: 0,
    vote_average: 0,
    vote_count: 0,
    release_date: '',
  } as Series;
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
    nmr: userRef.legacyNmr ?? 0,
    title: catalog.title,
    poster: { poster: catalog.poster },
    genre: { genres: ensureArray<string>(catalog.genres) },
    provider: { provider: ensureArray(catalog.providers) },
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
  } as Movie;
}
