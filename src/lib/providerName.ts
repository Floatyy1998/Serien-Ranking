import { SUPPORTED_PROVIDERS } from '../config/menuItems';

/**
 * Normalize provider names so ad-supported tiers map to the standard name.
 *
 * Pure Helfer (kein I/O) — lebte historisch in providerChangeDetection und
 * wurde beim S9-Move der Detection-Module nach services/detection hierher
 * extrahiert, damit reine lib/-Module (providerColors, providerMerge) nicht
 * aus services/ importieren müssen.
 */
export const normalizeProviderName = (name: string): string | null => {
  const lower = name.toLowerCase();
  // "X Channel"-Einträge auf TMDB sind kostenpflichtige Add-Ons innerhalb anderer
  // Plattformen (z.B. "Wow Fiction Amazon Channel" — ein WOW-Channel über Prime).
  // Diese gehören NICHT zum Standard-Abo des Wirts und werden ignoriert, sonst
  // gibt es falsche Provider-Treffer ("Amazon Prime Video" obwohl nur ein Channel).
  if (lower.includes(' channel')) return null;
  if (lower.includes('netflix')) return 'Netflix';
  // Freevee wurde 2024 von Amazon eingestellt und in Prime Video integriert.
  // Historische Freevee-Watches remappen wir auf Amazon Prime Video, statt sie
  // zu verlieren — damit Stats/WatchJourney/Wrapped korrekt bleiben.
  if (lower.includes('freevee')) return 'Amazon Prime Video';
  if (lower.includes('amazon') || lower.includes('prime video')) return 'Amazon Prime Video';
  if (lower.includes('disney')) return 'Disney Plus';
  if (lower.includes('paramount')) return 'Paramount Plus';
  if (lower.includes('apple tv')) return 'Apple TV Plus';
  if (lower.includes('joyn')) return 'Joyn Plus';
  if (lower.includes('hbo') || lower === 'max') return 'HBO Max';
  if (SUPPORTED_PROVIDERS.has(name)) return name;
  return null;
};
