import { useEffect, useState } from 'react';
import { fetchStaticAnimeManga, type AnimeMangaStaticEntry } from '../services/staticCatalog';

/**
 * Shared, load-once accessor for the static anime→manga bridge catalog
 * (`catalog/anime-manga.json`, tmdbId -> { m, t, c, s, cf }).
 *
 * Mirrors {@link useAnimeFillerCatalog}: the first mount kicks off the fetch, a
 * *successful* result is memoised at module scope so later mounts return it
 * without a duplicate request; a 404/failure is NOT memoised so a later mount
 * retries once the backend has published the file.
 *
 * Returns `null` until the first load settles, then the map (possibly empty).
 */

let sharedData: Record<string, AnimeMangaStaticEntry> | null = null;
let inFlight: Promise<Record<string, AnimeMangaStaticEntry> | null> | null = null;

export function useAnimeMangaCatalog(): Record<string, AnimeMangaStaticEntry> | null {
  const [data, setData] = useState<Record<string, AnimeMangaStaticEntry> | null>(sharedData);

  useEffect(() => {
    if (sharedData) return; // already loaded successfully
    let cancelled = false;
    if (!inFlight) inFlight = fetchStaticAnimeManga();
    inFlight
      .then((res) => {
        if (res)
          sharedData = res; // memoise only a real result
        else inFlight = null; // failure/404 → let the next mount retry
        if (!cancelled) setData(res ?? {});
      })
      .catch(() => {
        inFlight = null;
        if (!cancelled) setData({});
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return data;
}
