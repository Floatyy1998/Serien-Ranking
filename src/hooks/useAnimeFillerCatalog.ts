import { useEffect, useState } from 'react';
import { fetchStaticAnimeFiller, type AnimeFillerStaticEntry } from '../lib/staticCatalog';

/**
 * Shared, load-once accessor for the static anime-filler catalog
 * (`catalog/anime-filler.json`, tmdbId -> { f, r }).
 *
 * Every list surface that wants filler chips (Home sections, WatchNext) reads
 * from this single in-memory map instead of firing a Firebase read per series.
 * The first hook to mount kicks off the fetch; the result is memoised at module
 * scope so subsequent mounts return it synchronously and no duplicate requests
 * go out. `staticCatalog` itself handles IDB caching + version revalidation.
 *
 * Returns `null` until loaded (or if the backend hasn't published the file yet).
 */

let sharedData: Record<string, AnimeFillerStaticEntry> | null = null;
let inFlight: Promise<Record<string, AnimeFillerStaticEntry> | null> | null = null;

export function useAnimeFillerCatalog(): Record<string, AnimeFillerStaticEntry> | null {
  const [data, setData] = useState<Record<string, AnimeFillerStaticEntry> | null>(sharedData);

  useEffect(() => {
    if (sharedData) return;
    let cancelled = false;
    if (!inFlight) {
      inFlight = fetchStaticAnimeFiller().then((res) => {
        sharedData = res ?? {};
        return sharedData;
      });
    }
    void inFlight.then((res) => {
      if (!cancelled) setData(res);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return data;
}
