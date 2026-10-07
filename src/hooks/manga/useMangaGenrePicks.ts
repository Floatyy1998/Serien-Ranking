import { useEffect, useMemo, useState } from 'react';
import { discoverMangaByGenres } from '../../services/api/anilistService';
import type { AniListMangaSearchResult } from '../../types/Manga';

const CACHE_PREFIX = 'mangaGenrePicks:';
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;

const readCache = (key: string): AniListMangaSearchResult[] | null => {
  try {
    const raw = JSON.parse(sessionStorage.getItem(CACHE_PREFIX + key) || 'null');
    if (raw && Date.now() - raw.at < CACHE_TTL_MS) return raw.items;
  } catch {
    /* ignore */
  }
  return null;
};

/** AniList-Titel aus dem Lieblingsgenre, ohne die, die schon in der Sammlung sind. */
export function useMangaGenrePicks(
  genre: string | undefined,
  ownedIds: Set<number>,
  limit = 15
): AniListMangaSearchResult[] {
  const [fetched, setFetched] = useState<AniListMangaSearchResult[]>([]);

  useEffect(() => {
    if (!genre) return;
    const cached = readCache(genre);
    if (cached) {
      setFetched(cached);
      return;
    }
    let cancelled = false;
    discoverMangaByGenres([genre], 40)
      .then((items) => {
        if (cancelled) return;
        setFetched(items);
        try {
          sessionStorage.setItem(CACHE_PREFIX + genre, JSON.stringify({ at: Date.now(), items }));
        } catch {
          /* ignore */
        }
      })
      .catch((error) => console.error('Genre-Empfehlungen konnten nicht geladen werden:', error));
    return () => {
      cancelled = true;
    };
  }, [genre]);

  // Beim Genre-Wechsel bleiben die alten Treffer stehen, bis die neuen da sind — kein Springen.
  return useMemo(
    () => (genre ? fetched.filter((item) => !ownedIds.has(item.id)).slice(0, limit) : []),
    [fetched, genre, ownedIds, limit]
  );
}
