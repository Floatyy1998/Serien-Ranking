/**
 * Client-seitiger "Läuft auf meinen Abos"-Filter für Discover- und Search-
 * Ergebnisse (Feature F7).
 *
 * Warum client-seitig statt TMDBs `with_watch_providers`?
 *  - `with_watch_providers` funktioniert NUR auf dem `/discover`-Endpunkt, nicht
 *    auf `/search`, `/recommendations` oder den Listen-Endpunkten
 *    (`/trending`, `/popular`, `/top_rated`, `/on_the_air`), die Discover nutzt.
 *  - Es bräuchte zusätzlich eine fest verdrahtete Name→TMDB-Provider-ID-Tabelle,
 *    die es im Projekt nirgends gibt (die Abos sind ausschließlich über den
 *    normalisierten Namen adressiert).
 *
 * Deshalb wird pro Ergebnis-Item die frei zugängliche `watch/providers`-Info
 * (Region DE, `flatrate`) nachgeladen — dasselbe Muster wie
 * `lib/validation/providerChangeDetection.fetchTMDBProviders` — und der
 * normalisierte Provider-Name gegen die aktiven Abos des Nutzers geprüft.
 * Ein Modul-Cache verhindert Mehrfach-Fetches beim Paginieren/Umschalten.
 */

import { SUPPORTED_PROVIDERS } from '../../config/menuItems';

/** Minimal-Typ, den sowohl `DiscoverItem` als auch `SearchResult` erfüllen. */
export interface ProviderFilterableItem {
  id: number;
  type: 'series' | 'movie';
}

const TMDB_BASE = 'https://api.themoviedb.org/3';

/**
 * Normalisiert einen TMDB-`provider_name` auf den kanonischen Abo-Namen (die
 * Werte aus `providerMenuItems`). Gespiegelt aus
 * `lib/validation/providerChangeDetection.normalizeProviderName` — bewusst hier
 * inline gehalten, damit der Discover-/Search-Bundle nicht das
 * firebase-lastige Notification-Subsystem mitzieht. Bei Änderungen an der
 * kanonischen Funktion hier nachziehen.
 */
export function normalizeProviderName(name: string): string | null {
  const lower = name.toLowerCase();
  // "X Channel"-Einträge sind kostenpflichtige Add-Ons in anderen Plattformen
  // (z.B. "Wow Fiction Amazon Channel") und gehören nicht zum Standard-Abo.
  if (lower.includes(' channel')) return null;
  if (lower.includes('netflix')) return 'Netflix';
  if (lower.includes('freevee')) return 'Amazon Prime Video';
  if (lower.includes('amazon') || lower.includes('prime video')) return 'Amazon Prime Video';
  if (lower.includes('disney')) return 'Disney Plus';
  if (lower.includes('paramount')) return 'Paramount Plus';
  if (lower.includes('apple tv')) return 'Apple TV Plus';
  if (lower.includes('joyn')) return 'Joyn Plus';
  if (lower.includes('hbo') || lower === 'max') return 'HBO Max';
  if (SUPPORTED_PROVIDERS.has(name)) return name;
  return null;
}

// Session-Cache: `${type}-${id}` → normalisierte Provider-Namen (flatrate, DE).
// Vermeidet doppelte Fetches, wenn dieselben Titel beim Scrollen/Umschalten
// erneut geprüft werden.
const providerCache = new Map<string, string[]>();

/** Nur für Tests: leert den Modul-Cache. */
export function clearProviderCache(): void {
  providerCache.clear();
}

/**
 * Lädt die deutschen Flatrate-Provider eines Titels (normalisiert, dedupliziert).
 * Fehler/leere Antworten ergeben eine leere Liste (und werden gecached, damit ein
 * Titel ohne Streaming-Verfügbarkeit nicht bei jeder Seite erneut gefetcht wird).
 */
export async function fetchItemProviders(type: 'series' | 'movie', id: number): Promise<string[]> {
  const key = `${type}-${id}`;
  const cached = providerCache.get(key);
  if (cached) return cached;

  const mediaType = type === 'series' ? 'tv' : 'movie';
  const apiKey = import.meta.env.VITE_API_TMDB;
  try {
    const res = await fetch(`${TMDB_BASE}/${mediaType}/${id}/watch/providers?api_key=${apiKey}`);
    if (!res.ok) {
      providerCache.set(key, []);
      return [];
    }
    const data = await res.json();
    const flatrate = data?.results?.DE?.flatrate;
    if (!Array.isArray(flatrate)) {
      providerCache.set(key, []);
      return [];
    }
    const seen = new Set<string>();
    const names: string[] = [];
    for (const p of flatrate) {
      const normalized = normalizeProviderName(
        (p as { provider_name?: string })?.provider_name ?? ''
      );
      if (normalized && !seen.has(normalized)) {
        seen.add(normalized);
        names.push(normalized);
      }
    }
    providerCache.set(key, names);
    return names;
  } catch {
    // Transiente Fehler NICHT cachen — ein späterer Retry soll erneut fetchen.
    return [];
  }
}

/**
 * Behält nur die Items, die auf mindestens einem der aktiven Abos laufen.
 * Ist die Abo-Menge leer, wird die Liste unverändert zurückgegeben (No-Op) —
 * so filtert der Toggle nie ohne Grund alles weg.
 *
 * TMDB-Requests laufen in Batches (Default 5 parallel), analog zum bestehenden
 * Provider-Change-Detection-Muster, um den 6-Verbindungen-Limit-Effekt zu meiden.
 */
export async function filterItemsByActiveProviders<T extends ProviderFilterableItem>(
  items: T[],
  activeProviders: Set<string>,
  batchSize = 5
): Promise<T[]> {
  if (!activeProviders || activeProviders.size === 0) return items;

  const kept: T[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (item) => {
        const providers = await fetchItemProviders(item.type, item.id);
        return providers.some((p) => activeProviders.has(p)) ? item : null;
      })
    );
    for (const r of results) {
      if (r) kept.push(r);
    }
  }
  return kept;
}
