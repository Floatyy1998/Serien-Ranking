import type { CommunityRatingEntry } from '../../services/staticCatalog';
import type { Series } from '../../types/Series';
import { hasEpisodeAired } from '../../utils/episodeDate';

/** Ab so vielen community-bewerteten Folgen wird die Fieberkurve angezeigt. */
export const MIN_EPISODES_FOR_CURVE = 5;
/** Mindestanzahl Bewertungen, damit eine Folge als beste/schlechteste markiert wird. */
export const MIN_COUNT_FOR_HIGHLIGHT = 3;

export interface FeverPoint {
  /** Fortlaufender Index über alle Staffeln (X-Achse). */
  x: number;
  episodeId: number;
  /** 0-basiert wie in Series.seasons — Anzeige ist seasonNumber + 1. */
  seasonNumber: number;
  /** 1-basiert. */
  episodeNumber: number;
  title: string;
  avg: number | null;
  count: number;
  own: number | null;
}

export interface SeasonSegment {
  seasonNumber: number;
  startX: number;
  endX: number;
  /** Nach Bewertungsanzahl gewichteter Community-Schnitt der Staffel. */
  avg: number | null;
}

export interface FeverCurve {
  points: FeverPoint[];
  segments: SeasonSegment[];
  best: FeverPoint | null;
  worst: FeverPoint | null;
  /** Folgen mit Community-Wert. */
  communityCount: number;
  /** Folgen mit eigener Bewertung. */
  ownCount: number;
  hasOwn: boolean;
}

/**
 * Baut aus den Katalog-Staffeln, den anonymen Community-Episodenbewertungen
 * ({episodeId: {a, c}}) und den eigenen Folgenbewertungen die Datenreihe der
 * Fieberkurve. Nur ausgestrahlte Folgen; Folgen ohne Community-Wert bleiben
 * als Lücke erhalten (avg = null), damit die X-Achse vollständig ist.
 */
export function buildFeverCurve(
  seasons: Series['seasons'] | undefined,
  entries: Record<string, CommunityRatingEntry> | null | undefined
): FeverCurve {
  const points: FeverPoint[] = [];
  const segments: SeasonSegment[] = [];
  let x = 0;
  let ownCount = 0;

  for (const season of seasons || []) {
    const startX = x;
    let weightedSum = 0;
    let weight = 0;

    (season.episodes || []).forEach((ep, idx) => {
      if (!ep || !hasEpisodeAired(ep)) return;
      const entry = ep.id != null ? entries?.[String(ep.id)] : undefined;
      const own = typeof ep.userRating === 'number' && ep.userRating > 0 ? ep.userRating : null;
      if (own !== null) ownCount += 1;
      if (entry) {
        weightedSum += entry.a * entry.c;
        weight += entry.c;
      }
      points.push({
        x,
        episodeId: ep.id,
        seasonNumber: season.seasonNumber,
        episodeNumber: ep.episode_number ?? idx + 1,
        title: ep.name || '',
        avg: entry ? entry.a : null,
        count: entry ? entry.c : 0,
        own,
      });
      x += 1;
    });

    if (x > startX) {
      segments.push({
        seasonNumber: season.seasonNumber,
        startX,
        endX: x - 1,
        avg: weight > 0 ? Math.round((weightedSum / weight) * 10) / 10 : null,
      });
    }
  }

  const rated = points.filter((p) => p.avg !== null);
  const highlightable = rated.filter((p) => p.count >= MIN_COUNT_FOR_HIGHLIGHT);
  let best: FeverPoint | null = null;
  let worst: FeverPoint | null = null;
  for (const p of highlightable) {
    if (!best || (p.avg as number) > (best.avg as number)) best = p;
    if (!worst || (p.avg as number) < (worst.avg as number)) worst = p;
  }
  if (best && worst && best.episodeId === worst.episodeId) worst = null;

  return {
    points,
    segments,
    best,
    worst,
    communityCount: rated.length,
    ownCount,
    hasOwn: ownCount > 0,
  };
}

/** Farbe für einen Bewertungswert (Heatmap-Zellen), bewusst theme-unabhängig. */
export function ratingHeatColor(avg: number): string {
  if (avg >= 9) return '#22c55e';
  if (avg >= 8) return '#84cc16';
  if (avg >= 7) return '#eab308';
  if (avg >= 6) return '#f59e0b';
  if (avg >= 5) return '#f97316';
  return '#ef4444';
}
