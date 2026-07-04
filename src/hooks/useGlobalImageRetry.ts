import { useEffect } from 'react';
import { buildThemedPlaceholderDataUrl } from '../utils/themedPlaceholder';

/**
 * App-weiter Bild-Retry: fängt JEDEN fehlgeschlagenen <img>-Load ab und lädt
 * ihn automatisch neu (bis zu 2×, mit Cache-Buster). So müssen nicht 40
 * Karten-Komponenten einzeln Retry-Logik bekommen — Trending, Seasonal,
 * Detailseiten usw. sind mit EINEM Listener abgedeckt.
 *
 * `error` bubbelt NICHT, deshalb Capture-Phase am document. Nach dem letzten
 * Fehlversuch bekommen TMDB-Bilder (image.tmdb.org) dasselbe Themed-Placeholder
 * wie die Suche, statt als leeres Loch stehen zu bleiben.
 *
 * Übersprungen werden: data:-URIs (schon Placeholder), Bilder mit eigener
 * Retry-Logik (`data-poster-image`, siehe PosterImage) und bereits ersetzte.
 */

const MAX_RETRIES = 2;

/** Themed-Placeholder aus den aktuellen CSS-Theme-Variablen bauen (gecacht). */
let placeholderCache: { key: string; url: string } | null = null;
function themedPlaceholder(): string {
  const root = getComputedStyle(document.documentElement);
  const primary = root.getPropertyValue('--theme-primary').trim() || '#00d123';
  const secondary =
    root.getPropertyValue('--theme-secondary-gradient').trim() ||
    root.getPropertyValue('--theme-accent').trim() ||
    primary;
  const key = `${primary}|${secondary}`;
  if (placeholderCache?.key !== key) {
    placeholderCache = { key, url: buildThemedPlaceholderDataUrl(primary, secondary) };
  }
  return placeholderCache.url;
}

export function useGlobalImageRetry(): void {
  useEffect(() => {
    const handler = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (!target || target.tagName !== 'IMG') return;
      const img = target as HTMLImageElement & { dataset: DOMStringMap };
      if (img.dataset.posterImage === 'true') return; // hat eigene Logik
      const src = img.currentSrc || img.src;
      if (!src || src.startsWith('data:')) return;

      const tries = Number(img.dataset.retryCount || '0');
      if (tries >= MAX_RETRIES) {
        // Endgültig fehlgeschlagen → Themed-Placeholder nur für TMDB-CONTENT
        // (Poster/Backdrop/Profil). Kleine Provider-Logos (w45/w92) bleiben
        // aussen vor — ein „Kein Poster"-Platzhalter im Logo-Slot wäre falsch.
        const isTmdb = src.includes('image.tmdb.org');
        const isLogo = src.includes('/w92/') || src.includes('/w45/');
        if (isTmdb && !isLogo && img.dataset.retryFallback !== 'true') {
          img.dataset.retryFallback = 'true';
          img.src = themedPlaceholder();
        }
        return;
      }

      img.dataset.retryCount = String(tries + 1);
      const bust = src.includes('?') ? '&' : '?';
      // Kleiner Backoff, damit ein kurzer Netz-Aussetzer abklingen kann.
      window.setTimeout(
        () => {
          img.src = `${src}${bust}retry=${tries + 1}`;
        },
        350 * (tries + 1)
      );
    };

    document.addEventListener('error', handler, true);
    return () => document.removeEventListener('error', handler, true);
  }, []);
}
