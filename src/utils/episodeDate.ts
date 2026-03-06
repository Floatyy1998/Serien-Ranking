/**
 * Extracts the best available air date from an episode object.
 * Prefers airstamp (exact UTC) > air_date > airDate > firstAired.
 * Returns null if no date is available.
 */
export function getEpisodeAirDateStr(
  ep:
    | {
        airstamp?: string;
        air_date?: string;
        airDate?: string;
        firstAired?: string;
      }
    | null
    | undefined
): string | null {
  if (!ep) return null;
  return ep.airstamp?.split('T')[0] || ep.air_date || ep.airDate || ep.firstAired || null;
}

/**
 * Returns a Date object for the episode's air date in local timezone.
 * Uses airstamp (full UTC timestamp) when available for accurate timezone conversion,
 * otherwise falls back to date-only strings.
 */
export function getEpisodeAirDate(
  ep:
    | {
        airstamp?: string;
        air_date?: string;
        airDate?: string;
        firstAired?: string;
      }
    | null
    | undefined
): Date | null {
  if (!ep) return null;

  // Prefer airstamp for timezone-accurate date
  if (ep.airstamp) {
    const d = new Date(ep.airstamp);
    if (!isNaN(d.getTime())) return d;
  }

  const dateStr = ep.air_date || ep.airDate || ep.firstAired;
  if (!dateStr) return null;

  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Checks if an episode has already aired (date <= now).
 * Uses airstamp for accurate comparison when available.
 */
export function hasEpisodeAired(
  ep:
    | {
        airstamp?: string;
        air_date?: string;
        airDate?: string;
        firstAired?: string;
      }
    | null
    | undefined
): boolean {
  const airDate = getEpisodeAirDate(ep);
  if (!airDate) return false;

  // If we have airstamp, compare exact timestamps
  if (ep?.airstamp) {
    return airDate.getTime() <= Date.now();
  }

  // Date-only comparison (set to end of day to be safe)
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return airDate <= today;
}
