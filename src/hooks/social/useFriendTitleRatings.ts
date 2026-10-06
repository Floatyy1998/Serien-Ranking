import { useEffect, useMemo, useState } from 'react';
import { useOptimizedFriends } from '../../contexts/OptimizedFriendsContext';
import {
  analyzeFriendWatch,
  buildSeasonMapsFromCatalog,
  totalEpisodesOf,
  type SeriesWatchSnap,
} from '../../lib/series/friendWatchProgress';
import { overallRatingValue } from '../../lib/rating/rating';
import { fetchStaticCatalogSeasons } from '../../services/catalog/staticCatalog';
import { dbGet, paths, userPath } from '../../services/db/ref';
import type { Movie } from '../../types/Movie';
import type { Series } from '../../types/Series';

export interface FriendTitleRating {
  uid: string;
  displayName: string;
  photoURL?: string;
  /** Gesamtbewertung des Freundes, 0 = hat den Titel, aber nicht bewertet. */
  rating: number;
  /** Nur bei Serien: gesehene Folgen in Prozent. */
  percentage: number | null;
  latestSeason: number | null;
  latestEpisode: number | null;
  completed: boolean;
}

/** Sitzungs-Cache: dasselbe Sheet geht oft mehrmals zum selben Titel auf. */
const cache = new Map<string, FriendTitleRating[]>();

/** Nach Kontowechsel/Abmeldung nicht die Werte des Vorgängers zeigen. */
export function clearFriendTitleRatingsCache(): void {
  cache.clear();
}

/**
 * Bewertung und Fortschritt der Favoriten-Freunde zu einem Titel. Liest gezielt
 * `users/$freund/{series|movies}/$id` (~500 Byte) statt der ganzen Fremdliste —
 * die Rechte dafür stehen in `database.rules.json`. Lädt erst, wenn `enabled`
 * gesetzt ist, damit ein geschlossenes Sheet nichts kostet.
 */
export function useFriendTitleRatings(
  itemId: number | string | undefined,
  mediaType: 'series' | 'movie',
  enabled: boolean
): { loading: boolean; entries: FriendTitleRating[] } {
  const { favoriteFriends } = useOptimizedFriends();
  const [entries, setEntries] = useState<FriendTitleRating[] | null>(null);

  // Stabiler Schlüssel: die Favoritenliste ist bei jedem Render ein neues Array.
  const favoriteKey = useMemo(
    () => favoriteFriends.map((friend) => friend.uid).join(','),
    [favoriteFriends]
  );
  const cacheKey = `${mediaType}:${itemId}:${favoriteKey}`;

  useEffect(() => {
    if (!enabled || !itemId || favoriteFriends.length === 0) {
      setEntries(enabled ? [] : null);
      return;
    }
    const cached = cache.get(cacheKey);
    if (cached) {
      setEntries(cached);
      return;
    }

    let cancelled = false;
    setEntries(null);

    (async () => {
      const subPath = mediaType === 'series' ? 'series' : 'movies';
      // Staffeln nur einmal je Titel — kommen aus dem Speicher-Bulk, kein Netz.
      const maps =
        mediaType === 'series'
          ? buildSeasonMapsFromCatalog(await fetchStaticCatalogSeasons(itemId).catch(() => null))
          : null;
      const total = maps ? totalEpisodesOf(maps) : 0;

      const results = await Promise.all(
        favoriteFriends.map(async (friend): Promise<FriendTitleRating | null> => {
          try {
            const item = await dbGet<Record<string, unknown>>(
              userPath(friend.uid, subPath, itemId)
            );
            if (!item) return null;

            let percentage: number | null = null;
            let latestSeason: number | null = null;
            let latestEpisode: number | null = null;
            if (maps) {
              const watch = await dbGet<SeriesWatchSnap>(
                paths.seriesWatchItem(friend.uid, itemId)
              ).catch(() => null);
              const analyzed = analyzeFriendWatch(watch, maps);
              percentage =
                total > 0 ? Math.min(100, Math.round((analyzed.watched / total) * 100)) : 0;
              latestSeason = analyzed.latest?.seasonNumber ?? null;
              latestEpisode = analyzed.latest?.episodeNumber ?? null;
            }

            return {
              uid: friend.uid,
              displayName: friend.displayName || friend.username || 'Friend',
              photoURL: friend.photoURL,
              rating: overallRatingValue(item as unknown as Series | Movie),
              percentage,
              latestSeason,
              latestEpisode,
              completed: percentage === 100,
            };
          } catch (error) {
            console.error('[useFriendTitleRatings] read failed', error);
            return null;
          }
        })
      );
      if (cancelled) return;

      const list = results
        .filter((entry): entry is FriendTitleRating => entry !== null)
        .sort((a, b) => b.rating - a.rating);
      cache.set(cacheKey, list);
      setEntries(list);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, itemId, mediaType, cacheKey]);

  return { loading: enabled && entries === null, entries: entries ?? [] };
}
