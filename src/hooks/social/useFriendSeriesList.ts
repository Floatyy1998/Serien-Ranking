import { useEffect, useState } from 'react';
import { mergeToSeriesView } from '../../lib/series/seriesAdapter';
import {
  fetchStaticCatalogSeasonsBulk,
  fetchStaticCatalogSeries,
} from '../../services/catalog/staticCatalog';
import { dbGet, paths } from '../../services/db/ref';
import type { CatalogSeries } from '../../types/CatalogTypes';
import type { Series } from '../../types/Series';

/** Sitzungs-Cache je Freund — der Wechsel zwischen zwei Freunden ist ein Tipp. */
const cache = new Map<string, Series[]>();

export function clearFriendSeriesCache(): void {
  cache.clear();
}

/**
 * Baut die Serienliste eines Freundes in genau der Form, die auch die eigene
 * hat — dieselbe reine `mergeToSeriesView` wie im `SeriesListProvider`. Die
 * teure Hälfte (Katalog-Meta + Staffeln) liegt bereits im Speicher, es bleiben
 * zwei gezielte RTDB-Reads: `series` und `seriesWatch`. Beide sind für Freunde
 * freigegeben (`database.rules.json`).
 */
export function useFriendSeriesList(friendUid: string | null): {
  loading: boolean;
  seriesList: Series[];
  error: boolean;
} {
  const [seriesList, setSeriesList] = useState<Series[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!friendUid) {
      setSeriesList(null);
      setError(false);
      return;
    }
    const cached = cache.get(friendUid);
    if (cached) {
      setSeriesList(cached);
      setError(false);
      return;
    }

    let cancelled = false;
    setSeriesList(null);
    setError(false);

    (async () => {
      try {
        const [refs, watch, catalogMeta, catalogSeasons] = await Promise.all([
          dbGet<Record<string, Record<string, unknown>>>(paths.series(friendUid)),
          dbGet<Record<string, Record<string, unknown>>>(paths.seriesWatch(friendUid)).catch(
            () => null
          ),
          fetchStaticCatalogSeries(),
          fetchStaticCatalogSeasonsBulk(),
        ]);
        if (cancelled) return;

        if (!refs || !catalogMeta) {
          setSeriesList([]);
          return;
        }

        const merged: Series[] = [];
        for (const [tmdbIdStr, userRef] of Object.entries(refs)) {
          const meta = catalogMeta[tmdbIdStr];
          if (!meta) continue;
          const withSeasons: CatalogSeries = {
            ...meta,
            seasons: catalogSeasons?.[tmdbIdStr] || undefined,
          };
          merged.push(
            mergeToSeriesView(
              Number(tmdbIdStr),
              withSeasons,
              userRef as never,
              (watch?.[tmdbIdStr] as never) || undefined
            )
          );
        }
        cache.set(friendUid, merged);
        setSeriesList(merged);
      } catch (err) {
        if (cancelled) return;
        console.error('[useFriendSeriesList] failed', err);
        setError(true);
        setSeriesList([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [friendUid]);

  return { loading: !!friendUid && seriesList === null, seriesList: seriesList ?? [], error };
}
