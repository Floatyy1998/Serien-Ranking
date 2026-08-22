/**
 * Streaming-Provider (Flatrate) eines einzelnen Titels — inklusive Logo, für
 * die Poster-Badges in Entdecken/Suche. Erst der statische Katalog (kostenlos,
 * regions-korrigiert), sonst TMDB `watch/providers` mit gedrosselter Parallelität.
 */

import { normalizeProviderName } from '../lib/providerName';
import { pickProviderRegion, watchRegion } from './region';
import { fetchStaticCatalogMovies, fetchStaticCatalogSeries } from './staticCatalog';
import { tmdbFetch } from './tmdbClient';
import type { TmdbWatchProvidersResponse } from './tmdb.types';

export interface ItemProvider {
  name: string;
  logo: string;
}

export type ProviderItemType = 'series' | 'movie';

const cache = new Map<string, ItemProvider[]>();
const inFlight = new Map<string, Promise<ItemProvider[]>>();

const cacheKey = (type: ProviderItemType, id: number) => `${type}-${id}`;

/** Bereits aufgelöste Provider, ohne Fetch. `null` = noch unbekannt. */
export function getCachedItemProviders(type: ProviderItemType, id: number): ItemProvider[] | null {
  return cache.get(cacheKey(type, id)) ?? null;
}

/** Nur für Tests. */
export function clearItemProviderCache(): void {
  cache.clear();
  inFlight.clear();
}

// TMDB teilt sich einen Key über alle Clients — die Poster-Badges eines Grids
// dürfen ihn nicht mit 20 gleichzeitigen Requests belegen.
const MAX_PARALLEL = 4;
let active = 0;
const waiting: (() => void)[] = [];

async function withSlot<T>(run: () => Promise<T>): Promise<T> {
  if (active >= MAX_PARALLEL) await new Promise<void>((resolve) => waiting.push(resolve));
  active++;
  try {
    return await run();
  } finally {
    active--;
    waiting.shift()?.();
  }
}

function toProviders(entries: { name?: string; logo?: string }[]): ItemProvider[] {
  const seen = new Set<string>();
  const out: ItemProvider[] = [];
  for (const entry of entries) {
    const raw = entry?.name ?? '';
    const logo = entry?.logo ?? '';
    if (!raw || !logo) continue;
    // Channel-Add-Ons sind kein eigenes Abo — normalizeProviderName verwirft sie.
    const name = normalizeProviderName(raw);
    if (!name || seen.has(name)) continue;
    seen.add(name);
    out.push({ name, logo });
  }
  return out;
}

async function fromCatalog(type: ProviderItemType, id: number): Promise<ItemProvider[] | null> {
  try {
    const map =
      type === 'series' ? await fetchStaticCatalogSeries() : await fetchStaticCatalogMovies();
    const entry = map?.[String(id)];
    if (!entry) return null;
    const providers = toProviders(entry.providers || []);
    // Leerer Katalog-Eintrag gilt nur in DE als Antwort; für andere Regionen
    // fehlt der Provider-Overlay-Eintrag womöglich nur — dann lieber TMDB.
    if (providers.length === 0 && watchRegion !== 'DE') return null;
    return providers;
  } catch {
    return null;
  }
}

async function fromTmdb(type: ProviderItemType, id: number): Promise<ItemProvider[]> {
  const mediaType = type === 'series' ? 'tv' : 'movie';
  try {
    const data = await withSlot(() =>
      tmdbFetch<TmdbWatchProvidersResponse>(`${mediaType}/${id}/watch/providers`, {
        language: undefined,
      })
    );
    const flatrate = pickProviderRegion(data?.results)?.flatrate;
    if (!Array.isArray(flatrate)) return [];
    return toProviders(
      flatrate.map((p) => ({
        name: p?.provider_name,
        logo: p?.logo_path ? `https://image.tmdb.org/t/p/w92${p.logo_path}` : '',
      }))
    );
  } catch {
    return [];
  }
}

/** Provider eines Titels (Logo + kanonischer Name), dedupliziert und gecached. */
export function fetchItemProviderDetails(
  type: ProviderItemType,
  id: number
): Promise<ItemProvider[]> {
  const key = cacheKey(type, id);
  const cached = cache.get(key);
  if (cached) return Promise.resolve(cached);
  const running = inFlight.get(key);
  if (running) return running;

  const task = (async () => {
    const catalog = await fromCatalog(type, id);
    const providers = catalog ?? (await fromTmdb(type, id));
    cache.set(key, providers);
    return providers;
  })().finally(() => inFlight.delete(key));

  inFlight.set(key, task);
  return task;
}
