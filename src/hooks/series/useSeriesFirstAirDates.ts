import { useEffect, useState } from 'react';
import { firstAirDateOfSeasons } from '../../lib/filters/releaseYearFilter';
import { fetchStaticCatalogSeasonsBulk } from '../../services/catalog/staticCatalog';

/**
 * Startdatum je Serie aus den Katalog-Staffeln (seriesMeta hat keins). Lädt den
 * Staffel-Bulk erst, wenn `enabled` wird — für eingeloggte Nutzer liegt er
 * ohnehin schon im Speicher.
 */
export function useSeriesFirstAirDates(
  ids: number[],
  enabled: boolean
): Record<number, string> | null {
  const [dates, setDates] = useState<Record<number, string> | null>(null);
  const idKey = ids.join(',');

  useEffect(() => {
    if (!enabled || !idKey) return;
    let cancelled = false;
    void fetchStaticCatalogSeasonsBulk().then((bulk) => {
      if (cancelled || !bulk) return;
      const next: Record<number, string> = {};
      for (const id of idKey.split(',')) {
        const date = firstAirDateOfSeasons(bulk[id]);
        if (date) next[Number(id)] = date;
      }
      setDates(next);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, idKey]);

  return enabled ? dates : null;
}
