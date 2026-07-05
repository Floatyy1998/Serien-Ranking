import { useEffect, useState } from 'react';
import { fetchStaticAnimeFiller, type AnimeFillerStaticEntry } from '../lib/staticCatalog';

/**
 * Shared, load-once accessor for the static anime-filler catalog
 * (`catalog/anime-filler.json`, tmdbId -> { f, r }).
 *
 * Every list surface that wants filler chips (Home sections, WatchNext) reads
 * from this single in-memory map instead of firing a Firebase read per series.
 * The first hook to mount kicks off the fetch; a *successful* result is memoised
 * at module scope so later mounts return it synchronously with no duplicate
 * requests. `staticCatalog` itself handles IDB caching + version revalidation.
 *
 * A failed / 404 load (e.g. the backend hasn't published the file yet) is
 * deliberately NOT memoised — otherwise an empty result would stick for the
 * whole session and the chips would never appear even after the file goes live.
 * Such a case resets the in-flight guard so the next mount retries.
 *
 * Returns `null` until the first load settles, then the map (possibly empty).
 */

let sharedData: Record<string, AnimeFillerStaticEntry> | null = null;
let inFlight: Promise<Record<string, AnimeFillerStaticEntry> | null> | null = null;

export function useAnimeFillerCatalog(): Record<string, AnimeFillerStaticEntry> | null {
  const [data, setData] = useState<Record<string, AnimeFillerStaticEntry> | null>(sharedData);

  useEffect(() => {
    if (sharedData) return; // already loaded successfully
    let cancelled = false;
    if (!inFlight) inFlight = fetchStaticAnimeFiller();
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
