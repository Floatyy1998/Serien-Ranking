import type { Series } from '../../types/Series';

export interface EpPosition {
  seasonNumber: number;
  episodeNumber: number;
  absIndex: number;
}

export interface SeasonWatch {
  eps?: Record<string, { w?: number }>;
  w?: number[];
}

export interface SeriesWatchSnap {
  seasons?: Record<string, SeasonWatch | null>;
}

export interface SeasonMaps {
  /** TMDB-Episoden-ID → Position (Compact-Format `{eps}`). */
  epIdToPos: Map<number, EpPosition>;
  /** Staffel-Schlüssel → Positionen in Staffel-Reihenfolge (Alt-Format `{w[]}`). */
  seasonArrayPositions: Map<string, EpPosition[]>;
}

/**
 * Positionstabellen aus den Katalog-Staffeln. Staffel-Schlüssel sind
 * Positionen, keine Staffelnummern — daher `seasonNumber + 1` für die Anzeige.
 */
export function buildSeasonMaps(seasons: Series['seasons'] | null | undefined): SeasonMaps {
  const epIdToPos = new Map<number, EpPosition>();
  const seasonArrayPositions = new Map<string, EpPosition[]>();
  if (!seasons) return { epIdToPos, seasonArrayPositions };
  let absIndex = 0;
  for (const season of seasons) {
    if (!season?.episodes) continue;
    const sn = (season.seasonNumber ?? 0) + 1;
    const arr: EpPosition[] = [];
    season.episodes.forEach((ep, idx) => {
      absIndex += 1;
      const pos: EpPosition = {
        seasonNumber: sn,
        episodeNumber: idx + 1,
        absIndex,
      };
      arr.push(pos);
      if (typeof ep?.id === 'number') epIdToPos.set(ep.id, pos);
    });
    seasonArrayPositions.set(String(season.seasonNumber ?? 0), arr);
  }
  return { epIdToPos, seasonArrayPositions };
}

/**
 * Dasselbe aus den rohen Katalog-Staffeln (`seasons/{id}.json`). Der äußere
 * Schlüssel ist die Position und damit der Schlüssel, unter dem auch die
 * Watch-Daten liegen — `season.seasonNumber` darf dafür NICHT benutzt werden
 * (siehe `lib/series/seriesAdapter`, das `Number(snKey)` nimmt).
 */
export function buildSeasonMapsFromCatalog(
  record: Record<string, { episodes?: { id?: number | null }[] }> | null | undefined
): SeasonMaps {
  if (!record) return buildSeasonMaps(null);
  const seasons = Object.entries(record)
    .map(([key, season]) => ({
      seasonNumber: Number(key),
      episodes: (season?.episodes ?? []) as { id: number }[],
    }))
    .sort((a, b) => a.seasonNumber - b.seasonNumber);
  return buildSeasonMaps(seasons as unknown as Series['seasons']);
}

/** Gesamtzahl der Episoden aus denselben Karten — Nenner für den Prozentwert. */
export function totalEpisodesOf(maps: SeasonMaps): number {
  let total = 0;
  for (const positions of maps.seasonArrayPositions.values()) total += positions.length;
  return total;
}

/**
 * Zählt die gesehenen Episoden eines fremden `seriesWatch`-Knotens und merkt
 * sich die weiteste. Versteht beide Formate: Compact (`{eps}` nach Episoden-ID)
 * und das alte Positions-Array (`{w[]}`).
 */
export function analyzeFriendWatch(
  data: SeriesWatchSnap | null,
  { epIdToPos, seasonArrayPositions }: SeasonMaps
): { watched: number; latest: EpPosition | null } {
  if (!data?.seasons) return { watched: 0, latest: null };
  let watched = 0;
  let latest: EpPosition | null = null;
  const consider = (pos: EpPosition | undefined | null) => {
    if (!pos) return;
    if (!latest || pos.absIndex > latest.absIndex) latest = pos;
  };

  for (const [seasonKey, season] of Object.entries(data.seasons)) {
    if (!season) continue;
    if (season.eps && typeof season.eps === 'object') {
      for (const [epIdStr, ep] of Object.entries(season.eps)) {
        if (ep?.w !== 1) continue;
        watched += 1;
        const epId = parseInt(epIdStr, 10);
        if (!isNaN(epId)) consider(epIdToPos.get(epId));
      }
    } else if (Array.isArray(season.w)) {
      const positions = seasonArrayPositions.get(seasonKey);
      season.w.forEach((flag, idx) => {
        if (flag !== 1) return;
        watched += 1;
        if (positions && positions[idx]) consider(positions[idx]);
      });
    }
  }
  return { watched, latest };
}
