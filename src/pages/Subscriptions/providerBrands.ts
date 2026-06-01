/**
 * Brand-Mapping pro Streaming-Anbieter: dient als visueller Anker
 * (Farbe + Initials-Logo) für die Subscriptions-Page.
 */

export interface ProviderBrand {
  /** Primärfarbe für Card-Akzent und Logo-Hintergrund */
  color: string;
  /** Sekundärfarbe für Gradient (optional, fällt auf color zurück) */
  accent?: string;
  /** Kurzes Logo-Kürzel (max 3 Zeichen) */
  abbr: string;
}

const FALLBACK: ProviderBrand = { color: '#888888', abbr: '?' };

export const PROVIDER_BRANDS: Record<string, ProviderBrand> = {
  Netflix: { color: '#E50914', accent: '#B81D24', abbr: 'N' },
  'Amazon Prime Video': { color: '#00A8E1', accent: '#0F79AF', abbr: 'P' },
  'Disney Plus': { color: '#1F80E0', accent: '#0E2A6B', abbr: 'D+' },
  'Apple TV Plus': { color: '#1E1E1E', accent: '#6E6E6E', abbr: 'tv+' },
  'Paramount Plus': { color: '#0064FF', accent: '#0033A0', abbr: 'P+' },
  'HBO Max': { color: '#B026FF', accent: '#5A1F8C', abbr: 'M' },
  Crunchyroll: { color: '#F47521', accent: '#D45B0F', abbr: 'CR' },
  'Joyn Plus': { color: '#FF005A', accent: '#A8003D', abbr: 'J+' },
  WOW: { color: '#00D1FF', accent: '#0080A0', abbr: 'W!' },
  'RTL+': { color: '#FF0000', accent: '#9C0000', abbr: 'RTL' },
  'Animation Digital Network': { color: '#1A4FBC', accent: '#0E2D6E', abbr: 'ADN' },
  MagentaTV: { color: '#E20074', accent: '#8C0049', abbr: 'M' },
  Freevee: { color: '#2EE6CA', accent: '#1E9C88', abbr: 'FV' },
};

export function getProviderBrand(name: string): ProviderBrand {
  return PROVIDER_BRANDS[name] ?? FALLBACK;
}
