/** Weiteste gesehene Folge — Staffel-Schlüssel sind Positionen, daher `seasonNumber + 1`. */

interface PositionSeason {
  seasonNumber?: number;
  episodes?: ({ watched?: boolean } | null)[] | Record<string, { watched?: boolean } | null>;
}

export interface WatchPosition {
  season: number;
  episode: number;
}

export function furthestWatchedPosition(
  seasons: PositionSeason[] | null | undefined
): WatchPosition | null {
  if (!seasons) return null;
  let found: WatchPosition | null = null;
  const ordered = [...seasons].sort((a, b) => (a.seasonNumber ?? 0) - (b.seasonNumber ?? 0));
  for (const season of ordered) {
    const episodes = Array.isArray(season?.episodes)
      ? season.episodes
      : Object.values(season?.episodes || {});
    episodes.forEach((ep, idx) => {
      if (ep?.watched) found = { season: (season.seasonNumber ?? 0) + 1, episode: idx + 1 };
    });
  }
  return found;
}
