import { isSeriesEnded, isSeriesOngoing } from '../../lib/series/seriesStatus';
import { fetchTmdbSeriesCard } from './itemProviders';
import { fetchStaticCatalogSeries } from './staticCatalog';

export type SeriesAiring = 'ongoing' | 'ended';

const cache = new Map<number, SeriesAiring | null>();

function toAiring(
  status: string | undefined,
  production: boolean | undefined
): SeriesAiring | null {
  const source = { status, production: production === undefined ? null : { production } };
  return isSeriesOngoing(source) ? 'ongoing' : isSeriesEnded(source) ? 'ended' : null;
}

export function getCachedSeriesAiring(id: number): SeriesAiring | null | undefined {
  return cache.get(id);
}

export function clearSeriesAiringCache(): void {
  cache.clear();
}

export async function fetchSeriesAiring(id: number): Promise<SeriesAiring | null> {
  const cached = cache.get(id);
  if (cached !== undefined) return cached;
  try {
    const entry = (await fetchStaticCatalogSeries())?.[String(id)];
    let airing: SeriesAiring | null;
    if (entry) {
      airing = toAiring(undefined, entry.production);
    } else {
      const card = await fetchTmdbSeriesCard(id);
      airing = toAiring(card.status, card.inProduction);
    }
    cache.set(id, airing);
    return airing;
  } catch {
    return null;
  }
}
