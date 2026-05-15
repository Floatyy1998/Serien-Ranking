import type { Series } from '../types/Series';
import type { Movie } from '../types/Movie';
import type {
  CatalogSeries,
  CatalogMovie,
  CatalogEpisode,
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
import type { EpidSeason, LegacyArraySeason } from './compactWatch';

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
    const seasonsEntries = Array.isArray(catalog.seasons)
      ? catalog.seasons.map((s, i) => [String(i), s] as const).filter(([, s]) => s != null)
      : Object.entries(catalog.seasons).filter(([, s]) => s != null);
    for (const [snKey, catalogSeason] of seasonsEntries) {
      if (!catalogSeason) continue;
      const episodesRaw = (catalogSeason as { episodes?: unknown }).episodes;
      const episodesList = ensureArray<CatalogEpisode>(episodesRaw);
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

        const epidSeason =
          seasonWatch && isEpidSeason(seasonWatch) ? (seasonWatch as unknown as EpidSeason) : null;
        const epidHit = epidSeason && ep.id != null ? epidSeason.eps[String(ep.id)] : undefined;

        if (epidHit && epidSeason && ep.id != null) {
          const cw = readEpisodeById(epidSeason, ep.id);
          watched = cw.watched;
          watchCount = cw.watchCount;
          firstWatchedAt = cw.firstWatchedAt;
          lastWatchedAt = cw.lastWatchedAt;
        } else if (seasonWatch && isLegacyArraySeason(seasonWatch)) {
          // Fallback wenn Season teil-migriert ist (eps existiert, aber diese
          // Episode steht noch im Legacy-Array). Sonst gehen vorher gesehene
          // Episoden bei der ersten ID-basierten Swipe-Markierung verloren.
          const cw = readEpisodeFromLegacyArray(seasonWatch as LegacyArraySeason, idx);
          watched = cw.watched;
          watchCount = cw.watchCount;
          firstWatchedAt = cw.firstWatchedAt;
          lastWatchedAt = cw.lastWatchedAt;
        } else if (seasonWatch) {
          const sw = seasonWatch as unknown as Record<string, unknown>;
          const eps = sw?.episodes as Record<string, Record<string, unknown>> | undefined;
          const watch = eps?.[String(idx)];
          watched = (watch?.watched as boolean) ?? false;
          watchCount = (watch?.watchCount as number) ?? 0;
          firstWatchedAt = watch?.firstWatchedAt as string | undefined;
          lastWatchedAt = watch?.lastWatchedAt as string | undefined;
        }

        const rawEp = ep as unknown as Record<string, unknown>;
        return {
          id: ep.id ?? 0,
          name: ep.name,
          air_date: ep.airDate || (rawEp.air_date as string) || '',
          airstamp: ep.airstamp || (rawEp.airstamp as string) || undefined,
          // season_number wird serverseitig nicht mehr in jede Episode geschrieben
          // (Bulk-File-Slim-Down). Outer Key `sn` ist die zuverlaessige Quelle.
          season_number: ep.seasonNumber ?? (rawEp.season_number as number) ?? sn,
          episode_number: ep.episodeNumber ?? (rawEp.episode_number as number) ?? idx + 1,
          runtime: ep.runtime ?? (rawEp.runtime as number) ?? undefined,
          watched,
          watchCount,
          ...(firstWatchedAt ? { firstWatchedAt } : {}),
          ...(lastWatchedAt ? { lastWatchedAt } : {}),
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
    addedAt: userRef.addedAt,
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
