import { useEffect, useMemo, useState } from 'react';
import { useMangaList } from '../../contexts/MangaListContext';
import { findMangaForBook } from '../../lib/books/bookIdentity';
import {
  hasComicHint,
  isMangaVolumeCandidate,
  mangaAsSearchResult,
  splitVolume,
  type MangaLink,
  type MangaVolumeInput,
} from '../../lib/books/mangaVolume';
import { resolveMangaVolumes, type MangaVolumeHit } from '../../services/books/mangaVolumes';
import type { Manga } from '../../types/Manga';

const EMPTY: Record<string, MangaVolumeHit> = {};

/**
 * Ordnet Buchtreffer, die Manga-Bände sind, ihrer Reihe zu — eigene Manga sofort,
 * alle anderen nach dem AniList-Abgleich. pending: Abgleich läuft noch.
 * query: der Suchbegriff, zu dem die Treffer gehören (erkennt Bände ohne Comic-Merkmal).
 */
export function useMangaVolumes(
  items: MangaVolumeInput[],
  options: { deep?: boolean; query?: string } = {}
) {
  const { allMangaList } = useMangaList();
  const deep = !!options.deep;
  const query = options.query?.trim() || undefined;
  const key = items.map((item) => item.id).join('|');
  const needsLookup = useMemo(
    () => items.some((item) => isMangaVolumeCandidate(item, query)),
    [items, query]
  );
  const [state, setState] = useState<{ key: string; hits: Record<string, MangaVolumeHit> }>({
    key: '',
    hits: EMPTY,
  });

  useEffect(() => {
    if (!needsLookup) return;
    let alive = true;
    resolveMangaVolumes(items, { deep, query })
      .catch(() => EMPTY)
      .then((hits) => {
        if (alive) setState({ key, hits });
      });
    return () => {
      alive = false;
    };
  }, [items, key, deep, query, needsLookup]);

  const hits = state.key === key ? state.hits : EMPTY;
  const pending = needsLookup && state.key !== key;

  const links = useMemo(() => {
    const owned = new Map<number, Manga>(allMangaList.map((m) => [m.anilistId, m]));
    const map = new Map<string, MangaLink>();
    for (const item of items) {
      const hit = hits[item.id];
      if (hit) {
        map.set(item.id, { manga: hit.manga, owned: owned.get(hit.manga.id), volume: hit.volume });
        continue;
      }
      const { volume } = splitVolume(item.title);
      if (volume === undefined && !hasComicHint(item)) continue;
      const own = findMangaForBook(item, allMangaList);
      if (own) map.set(item.id, { manga: mangaAsSearchResult(own), owned: own, volume });
    }
    return map;
  }, [items, hits, allMangaList]);

  const isPending = (item: MangaVolumeInput) =>
    pending && !links.has(item.id) && isMangaVolumeCandidate(item, query);

  return { links, pending, isPending };
}
