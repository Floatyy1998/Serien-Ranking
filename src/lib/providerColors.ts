/**
 * D4 — Provider-Markenfarben für die Farb-Facette an Karten.
 *
 * Keyed auf die kanonischen Provider-Namen aus `normalizeProviderName`
 * (lib/validation/providerChangeDetection). Die Töne sind Marken-Approximationen,
 * teils fürs dunkle UI leicht angehoben (z. B. Disney+, dessen Brand-Navy auf
 * Schwarz absäuft). Reine Daten/Logik — kein I/O.
 */

import { normalizeProviderName } from './validation/providerChangeDetection';

export const PROVIDER_COLORS: Record<string, string> = {
  Netflix: '#e50914',
  'Amazon Prime Video': '#00a8e1',
  'Disney Plus': '#4e79ff',
  'Apple TV Plus': '#a2aaad',
  'Paramount Plus': '#0f6dff',
  'HBO Max': '#9d5cff',
  'Joyn Plus': '#ffd800',
  WOW: '#ff2ba6',
  Crunchyroll: '#f47521',
  'Animation Digital Network': '#0099ff',
  MagentaTV: '#e20074',
  'RTL+': '#ff3350',
};

/**
 * Markenfarbe für einen (rohen TMDB- oder kanonischen) Provider-Namen,
 * oder null wenn unbekannt.
 */
export function getProviderColor(rawName?: string | null): string | null {
  if (!rawName) return null;
  const canonical = normalizeProviderName(rawName);
  return (canonical && PROVIDER_COLORS[canonical]) || null;
}
