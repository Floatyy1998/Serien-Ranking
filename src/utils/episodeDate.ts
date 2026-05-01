/**
 * TVMaze-Quirk: Wenn ein Sender keine echte Sendezeit gepflegt hat (airtime
 * "00:00"), schreibt TVMaze den airstamp aufs ENDE des Tages — d. h. lokal
 * exakt Mitternacht des Folgetages. Beispiel:
 *   airdate  = "2026-04-30"
 *   airstamp = "2026-04-30T22:00:00+00:00" → in Berlin = 01.05. 00:00
 * Diese Funktion erkennt den Fall (lokal Mitternacht UND ein Tag nach airdate)
 * und gibt den korrekten Date für airdate 00:00 lokal zurück.
 */
function tvMazeMidnightQuirk(
  airstamp: string | undefined,
  airDateStr: string | undefined
): Date | null {
  if (!airstamp || !airDateStr) return null;
  const stampDate = new Date(airstamp);
  if (isNaN(stampDate.getTime())) return null;
  if (stampDate.getHours() !== 0 || stampDate.getMinutes() !== 0) return null;

  const parts = airDateStr.split('-');
  if (parts.length !== 3) return null;
  const airDateLocal = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  if (isNaN(airDateLocal.getTime())) return null;

  const stampMidnightLocal = new Date(
    stampDate.getFullYear(),
    stampDate.getMonth(),
    stampDate.getDate()
  );
  if (stampMidnightLocal.getTime() - airDateLocal.getTime() !== 86_400_000) return null;

  return airDateLocal;
}

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
  const dateStr = ep.air_date || ep.airDate || ep.firstAired;
  if (ep.airstamp && tvMazeMidnightQuirk(ep.airstamp, dateStr)) {
    return dateStr || null;
  }
  return ep.airstamp?.split('T')[0] || dateStr || null;
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

  if (ep.airstamp) {
    const dateStr = ep.air_date || ep.airDate || ep.firstAired;
    const corrected = tvMazeMidnightQuirk(ep.airstamp, dateStr);
    if (corrected) return corrected;
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
