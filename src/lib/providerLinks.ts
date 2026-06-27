/**
 * Deep-Link Mapping für deutsche Streaming-Anbieter.
 *
 * Zentrale Quelle der Wahrheit — wird sowohl vom generischen ProviderBadges
 * (TMDB-Provider-Objekte mit ID/Logo) als auch von den HomePage-/Ratings-Cards
 * (normalisierte name+logo Provider) genutzt.
 *
 * Eingang: normalisierter Provider-Name (siehe `normalizeProviderName`).
 * Ausgang: URL zur Suche oder Landing-Page beim jeweiligen Provider.
 */

import type React from 'react';

/** Provider, deren Such-Seite keine URL-Query liest und wo wir deshalb den
 *  Titel beim Klick in die Zwischenablage kopieren müssen, damit der User
 *  ihn nur noch ins Suchfeld pasten muss. */
const CLIPBOARD_FALLBACK_PROVIDERS = new Set(['Disney Plus']);

export function providerNeedsClipboardCopy(normalizedName: string): boolean {
  return CLIPBOARD_FALLBACK_PROVIDERS.has(normalizedName);
}

/**
 * Behandelt den Klick auf einen Provider-Badge. Stoppt immer die Propagation
 * (damit der Eltern-Klick — meistens Navigation zur Detail-Seite — nicht
 * feuert). Bei Providern aus `CLIPBOARD_FALLBACK_PROVIDERS` (aktuell Disney+)
 * kopiert die Funktion den Titel in die Zwischenablage und öffnet die
 * Suchseite per `window.open`, weil das normale `<a href>` Verhalten nicht
 * ausreicht — Disney+ liest keine URL-Query, die Suche muss vom User getippt
 * werden, also reichen wir wenigstens den Titel zum Pasten bereit.
 */
export function handleProviderLinkClick(
  event: React.MouseEvent,
  normalizedName: string,
  title: string,
  url: string | null
): void {
  event.stopPropagation();
  if (!url || !providerNeedsClipboardCopy(normalizedName)) {
    // <a href> kümmert sich um die Navigation, nichts weiter zu tun.
    return;
  }
  event.preventDefault();
  const open = () => window.open(url, '_blank', 'noopener,noreferrer');
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    // Fire-and-forget: auch wenn die Clipboard-API failed, soll die Suchseite
    // trotzdem aufgehen. Promise-then statt await, weil der Handler synchron
    // bleiben muss, damit `window.open` nicht vom Popup-Blocker geschluckt
    // wird (Browser erlauben Popups nur direkt im User-Gesture-Stack).
    navigator.clipboard.writeText(title).catch(() => {});
  }
  open();
}

/**
 * Liefert eine Deep-Link URL für den Provider. Bei Disney+ wird auf die Browse-
 * Search Seite verwiesen (ohne Query-Parameter), weil Disney+'s Suche die URL-
 * Query ignoriert — sie macht den API-Call erst beim Tippen im Input. Der alte
 * `?q=…` Link führte auf eine Error-Seite. Stattdessen kopieren wir per
 * `handleProviderLinkClick` den Titel ins Clipboard, damit der User nur noch
 * pasten muss.
 */
export function getProviderSearchUrl(normalizedName: string, title: string): string | null {
  const enc = encodeURIComponent(title);
  switch (normalizedName) {
    case 'Netflix':
      return `https://www.netflix.com/search?q=${enc}`;
    case 'Amazon Prime Video':
      return `https://www.amazon.de/s?k=${enc}&i=instant-video`;
    case 'Disney Plus':
      return 'https://www.disneyplus.com/de-de/browse/search';
    case 'Apple TV Plus':
      return `https://tv.apple.com/de/search?term=${enc}`;
    case 'Paramount Plus':
      return `https://www.paramountplus.com/de/search/?q=${enc}`;
    case 'WOW':
      return `https://www.wowtv.de/suche?search=${enc}`;
    case 'Crunchyroll':
      return `https://www.crunchyroll.com/de/search?q=${enc}`;
    case 'RTL+':
      return `https://plus.rtl.de/suche?term=${enc}`;
    case 'Joyn Plus':
      return `https://www.joyn.de/search?q=${enc}`;
    case 'MagentaTV':
      return `https://web.magentatv.de/search?q=${enc}`;
    case 'Animation Digital Network':
      return `https://animationdigitalnetwork.de/search/${enc}`;
    case 'HBO Max':
      return `https://play.hbomax.com/search/result?q=${enc}`;
    default:
      return null;
  }
}
