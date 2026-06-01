/**
 * Zentrale Helper-Funktionen um Provider-Listen aus mehreren Quellen zu mergen:
 *  - Catalog (`series.provider.provider`) — vom Server, kann veraltet sein
 *  - knownProviders (Firebase) — TMDB-Live-Snapshot, aktueller
 *  - TMDB-Live-Fetch (page-lokal) — frischester Stand
 *
 * Resultat ist normalisiert + dedupliziert. Für Provider, die nur als Name
 * (ohne Logo) kommen — z. B. aus `knownProviders` — wird das Logo aus einer
 * statischen Map nachgereicht.
 */

import { normalizeProviderName } from './validation/providerChangeDetection';

/**
 * Statisches Logo-Mapping (normalisierter Provider-Name → TMDB-CDN-Logo-URL).
 * Gespiegelt aus der serverseitigen `getProviders`-Funktion. Wird genutzt,
 * wenn die Quelle nur den Namen liefert (knownProviders).
 */
const PROVIDER_LOGOS: Record<string, string> = {
  'Disney Plus': 'https://image.tmdb.org/t/p/w342/7rwgEs15tFwyR9NPQ5vpzxTj19Q.jpg',
  Netflix: 'https://image.tmdb.org/t/p/w342/t2yyOv40HZeVlLjYsCsPHnWLk4W.jpg',
  'Amazon Prime Video': 'https://image.tmdb.org/t/p/w342/emthp39XA2YScoYL1p0sdbAH2WA.jpg',
  Crunchyroll: 'https://image.tmdb.org/t/p/w342/8Gt1iClBlzTeQs8WQm8UrCoIxnQ.jpg',
  WOW: 'https://image.tmdb.org/t/p/w342/1WESsDFMs3cJc2TeT3nnzwIffGv.jpg',
  'Apple TV Plus': 'https://image.tmdb.org/t/p/w342/6uhKBfmtzFqOcLousHwZuzcrScK.jpg',
  'Joyn Plus': 'https://image.tmdb.org/t/p/w342/2joD3S2goOB6lmepX35A8dmaqgM.jpg',
  'Paramount Plus': 'https://image.tmdb.org/t/p/w342/xbhHHa1YgtpwhC8lb1NQ3ACVcLd.jpg',
  MagentaTV: 'https://image.tmdb.org/t/p/w342/uULoezj2skPc6amfwru72UPjYXV.jpg',
  'RTL+': 'https://image.tmdb.org/t/p/w342/3hI22hp7YDZXyrmXVqDGnVivNTI.jpg',
  'Animation Digital Network': 'https://image.tmdb.org/t/p/w342/w86FOwg0bbgUSHWWnjOTuEjsUvq.jpg',
  'HBO Max': 'https://image.tmdb.org/t/p/w342/aS2zvJWn9mwiCOeaaCkIh4wleZS.jpg',
};

export function getProviderLogoUrl(name: string): string | undefined {
  return PROVIDER_LOGOS[name];
}

/**
 * Wendet einen User-Override auf eine Provider-Liste an: wenn ein Override
 * existiert, wird DIESE als alleiniger Provider returnt (synthetisches
 * Provider-Objekt mit Logo aus der statischen Map). Sonst Original.
 *
 * Format-agnostisch — funktioniert mit `{id, logo, name}` und `{provider_id,
 * provider_name, logo_path}`.
 */
export function applyOverrideToProviders<T extends RawProvider>(
  providers: T[] | undefined,
  override: string | null
): (T | { name: string; logo: string | undefined; id: undefined })[] {
  if (!override) return providers ?? [];
  return [
    {
      id: undefined,
      logo: PROVIDER_LOGOS[override],
      name: override,
    },
  ];
}

/**
 * Helper für Overlay-Badges in HomePage-Sections: liefert die fertig fetchbare
 * Bild-URL für ein Provider-Logo. Bevorzugt einen User-Override; fällt sonst
 * auf das übergebene TMDB-Logo zurück.
 */
export function resolveProviderOverlay(
  override: string | null,
  fallbackLogo: string | undefined | null,
  fallbackName: string | undefined | null
): { src: string; name: string } | null {
  if (override) {
    const url = PROVIDER_LOGOS[override];
    if (url) return { src: url, name: override };
  }
  if (!fallbackLogo) return null;
  const src = fallbackLogo.startsWith('http')
    ? fallbackLogo
    : `https://image.tmdb.org/t/p/w92${fallbackLogo}`;
  return { src, name: fallbackName || '' };
}

export interface RawProvider {
  id?: number;
  logo?: string;
  name?: string;
  provider_id?: number;
  provider_name?: string;
  logo_path?: string;
}

export interface MergedProvider {
  id?: number;
  logo?: string;
  name: string;
}

function unifyProvider(p: RawProvider): MergedProvider | null {
  const name = p.name ?? p.provider_name;
  if (!name) return null;
  return {
    id: p.id ?? p.provider_id,
    logo: p.logo ?? p.logo_path,
    name,
  };
}

export interface MergeProviderInput {
  catalog?: RawProvider[];
  known?: string[];
  live?: RawProvider[];
}

/**
 * Merged drei Provider-Quellen zu einer eindeutigen Liste. Dedupliziert nach
 * normalisiertem Namen — der erste Treffer einer Quelle gewinnt für Logo/ID.
 * Reihenfolge der Quellen: catalog → known → live (Live hat dadurch niedrigste
 * Logo-Priorität, weil es nur Namen liefert).
 */
export function mergeProviders(input: MergeProviderInput): MergedProvider[] {
  const seen = new Set<string>();
  const out: MergedProvider[] = [];

  const add = (raw: RawProvider) => {
    const unified = unifyProvider(raw);
    if (!unified) return;
    const normalized = normalizeProviderName(unified.name);
    if (!normalized) return;
    if (seen.has(normalized)) return;
    seen.add(normalized);
    const logo = unified.logo || PROVIDER_LOGOS[normalized];
    out.push({ ...unified, name: normalized, logo });
  };

  for (const p of input.catalog ?? []) add(p);
  for (const name of input.known ?? []) add({ name });
  for (const p of input.live ?? []) add(p);

  return out;
}

/** Nur die normalisierten Namen, dedupliziert. */
export function mergeProviderNames(input: MergeProviderInput): string[] {
  return mergeProviders(input).map((p) => p.name);
}
