/**
 * Synchroner localStorage-Bootstrap, der VOR jedem React-Mount laeuft.
 *
 * Hintergrund: Frueher wurde der Static-Catalog (seriesMeta, moviesMeta,
 * seasons/*) in localStorage abgelegt. Auf iOS Safari (UTF-16, ~5 MB Quota)
 * sprengte das bei vielen Serien das Quota — und das wiederum brach ALLE
 * anderen setItem-Aufrufe (Theme, HomeConfig, ...). Schlimmer noch: einige
 * Code-Pfade interpretierten quota-Fehler als "Daten korrupt" und loeschten
 * dann den fraglichen Eintrag. Resultat: Theme verschwand bei jedem Open.
 *
 * Diese Migration laeuft als allererstes im App-Bootstrap, raeumt alte
 * Catalog-Eintraege weg und stellt damit sicher, dass nachfolgende Code
 * (insbesondere ThemeContext.getInitialConfig) wieder genug Platz fuer
 * eigene Writes hat. Idempotent — laeuft pro Session genau einmal.
 */

const CATALOG_LS_PREFIX = 'catalog-static:';

function clearLegacyCatalogEntries(): void {
  try {
    if (typeof localStorage === 'undefined') return;
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(CATALOG_LS_PREFIX)) toRemove.push(k);
    }
    for (const k of toRemove) {
      try {
        localStorage.removeItem(k);
      } catch {
        // ignore — partial cleanup ist okay
      }
    }
  } catch {
    // ignore
  }
}

clearLegacyCatalogEntries();
