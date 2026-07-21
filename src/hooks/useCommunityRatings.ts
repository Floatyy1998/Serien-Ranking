import { useEffect, useState } from 'react';
import {
  fetchStaticCommunityRatings,
  fetchStaticEpisodeRatings,
  type CommunityRatings,
  type CommunityRatingEntry,
} from '../services/staticCatalog';

/**
 * Komplette Community-Ratings-Map (Serien + Filme) für Karten-Listen.
 * Kommt nach dem ersten Laden aus dem Memory-Cache — pro Karte unbedenklich.
 */
export function useCommunityRatingsMap(): CommunityRatings | null {
  const [map, setMap] = useState<CommunityRatings | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchStaticCommunityRatings()
      .then((data) => {
        if (!cancelled) setMap(data);
      })
      .catch(() => {
        if (!cancelled) setMap(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return map;
}

/**
 * Anzeige-Rating für Karten: Community-Durchschnitt der TV-Rank-Nutzer, wenn
 * vorhanden (ab 5 Bewertungen) — sonst der übergebene Fallback (z. B. TMDB).
 * `isCommunity` erlaubt den Kartenchips, die Quelle optisch zu markieren.
 */
export function pickDisplayRating(
  community: CommunityRatings | null,
  kind: 'series' | 'movies',
  id: number | string | undefined,
  fallback: number | undefined | null
): { value: number; isCommunity: boolean } | null {
  const entry = id != null ? community?.[kind]?.[String(id)] : undefined;
  if (entry) return { value: entry.a, isCommunity: true };
  if (typeof fallback === 'number' && fallback > 0)
    return { value: Math.round(fallback * 10) / 10, isCommunity: false };
  return null;
}

/**
 * Anonymes Community-Rating (Durchschnitt aller TV-Rank-Nutzer, ab 5
 * Bewertungen) für eine Serie oder einen Film aus dem statischen Katalog.
 * null solange keine Daten (oder unter der Schwelle).
 */
export function useCommunityRating(
  kind: 'series' | 'movies',
  id: number | string | undefined
): CommunityRatingEntry | null {
  const [entry, setEntry] = useState<CommunityRatingEntry | null>(null);

  useEffect(() => {
    if (!id) {
      setEntry(null);
      return;
    }
    let cancelled = false;
    fetchStaticCommunityRatings()
      .then((data) => {
        if (!cancelled) setEntry(data?.[kind]?.[String(id)] ?? null);
      })
      .catch(() => {
        if (!cancelled) setEntry(null);
      });
    return () => {
      cancelled = true;
    };
  }, [kind, id]);

  return entry;
}

/**
 * Community-Episodenbewertungen einer Serie ({episodeId: {a, c}}), lazy pro
 * Serie geladen. null = keine Daten vorhanden.
 */
export function useEpisodeRatings(
  seriesId: number | undefined
): Record<string, CommunityRatingEntry> | null {
  const [entries, setEntries] = useState<Record<string, CommunityRatingEntry> | null>(null);

  useEffect(() => {
    if (!seriesId) {
      setEntries(null);
      return;
    }
    let cancelled = false;
    fetchStaticEpisodeRatings(seriesId)
      .then((data) => {
        if (!cancelled) setEntries(data);
      })
      .catch(() => {
        if (!cancelled) setEntries(null);
      });
    return () => {
      cancelled = true;
    };
  }, [seriesId]);

  return entries;
}
