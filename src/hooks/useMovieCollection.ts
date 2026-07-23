import { useEffect, useState } from 'react';
import { tmdbFetch } from '../services/tmdbClient';

export interface CollectionPart {
  id: number;
  title: string;
  poster_path: string | null;
  release_date?: string;
}

export interface MovieCollectionInfo {
  id: number;
  name: string;
  parts: CollectionPart[];
}

// Pro Film gemerkt (auch `null` = gehört zu keiner Reihe) — spart Doppel-Requests
// beim Hin- und Hernavigieren innerhalb einer Session.
const cache = new Map<number, MovieCollectionInfo | null>();

/**
 * TMDB-Filmreihe (Collection) zu einem Film: „Gehört zu?" + alle Teile,
 * chronologisch sortiert. null solange nichts geladen ist oder der Film zu
 * keiner Reihe gehört.
 */
export function useMovieCollection(movieId: number | undefined): MovieCollectionInfo | null {
  const [info, setInfo] = useState<MovieCollectionInfo | null>(() =>
    movieId != null ? (cache.get(movieId) ?? null) : null
  );

  useEffect(() => {
    if (!movieId) {
      setInfo(null);
      return;
    }
    if (cache.has(movieId)) {
      setInfo(cache.get(movieId) ?? null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const detail = await tmdbFetch<{
          belongs_to_collection?: { id: number; name: string } | null;
        }>(`movie/${movieId}`);
        const col = detail.belongs_to_collection;
        if (!col) {
          cache.set(movieId, null);
          if (!cancelled) setInfo(null);
          return;
        }
        const data = await tmdbFetch<{ id: number; name: string; parts?: CollectionPart[] }>(
          `collection/${col.id}`
        );
        const parts = (data.parts || [])
          .filter((p) => !!p.id)
          .sort((a, b) => (a.release_date || '9999').localeCompare(b.release_date || '9999'));
        const result: MovieCollectionInfo = { id: data.id, name: data.name || col.name, parts };
        cache.set(movieId, result);
        if (!cancelled) setInfo(result);
      } catch {
        // best-effort — ohne Collection-Daten fehlt nur die Karte
        if (!cancelled) setInfo(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [movieId]);

  return info;
}
