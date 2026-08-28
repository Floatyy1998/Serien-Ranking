import { useEffect, useMemo, useState } from 'react';
import { fetchStaticDropOff } from '../services/staticCatalog';
import { analyzeDropOff, type DropOffEntry, type DropOffInsight } from '../lib/dropOff';

/**
 * Gemeinsamer Zugriff auf das statische Abbruch-Aggregat (`drop-off.json`).
 * Wie {@link useAnimeFillerCatalog}: der erste Mount startet den Abruf, ein
 * erfolgreiches Ergebnis wird modulweit gemerkt, ein Fehlschlag (404, solange
 * das Backend die Datei nicht schreibt) bewusst nicht.
 */
let sharedData: Record<string, DropOffEntry> | null = null;
let inFlight: Promise<Record<string, DropOffEntry> | null> | null = null;

export function useDropOffCatalog(): Record<string, DropOffEntry> | null {
  const [data, setData] = useState<Record<string, DropOffEntry> | null>(sharedData);

  useEffect(() => {
    if (sharedData) return;
    let cancelled = false;
    if (!inFlight) inFlight = fetchStaticDropOff();
    inFlight
      .then((res) => {
        if (res) sharedData = res;
        else inFlight = null;
        if (!cancelled) setData(res ?? {});
      })
      .catch(() => {
        inFlight = null;
        if (!cancelled) setData({});
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return data;
}

/** Ausgewertetes Abbruch-Bild einer Serie. Null, solange nichts geladen ist. */
export function useDropOff(seriesId: number | undefined): DropOffInsight | null {
  const catalog = useDropOffCatalog();

  return useMemo(() => {
    if (!catalog || seriesId === undefined) return null;
    const insight = analyzeDropOff(catalog[String(seriesId)]);
    return insight.shouldShow ? insight : null;
  }, [catalog, seriesId]);
}
