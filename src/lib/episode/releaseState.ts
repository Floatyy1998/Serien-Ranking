import { getEpisodeAirDate, hasEpisodeAired } from '../../utils/episodeDate';
import { isEpisodeWatched } from './seriesMetrics';

export interface ReleaseStateEpisode {
  airstamp?: string;
  air_date?: string;
  airDate?: string;
  firstAired?: string;
  firstWatchedAt?: string;
  watched?: boolean | number | string;
  watchCount?: number;
}

const hasAirDate = (ep: ReleaseStateEpisode): boolean => getEpisodeAirDate(ep) !== null;

/** Folge mit bekanntem Ausstrahlungsdatum in der Zukunft. */
export const isEpisodeUnreleased = (ep: ReleaseStateEpisode): boolean =>
  hasAirDate(ep) && !hasEpisodeAired(ep);

/**
 * Folgen, die eine Bulk-Aktion abhaken darf. Datumslose Folgen sind mehrdeutig:
 * innerhalb einer Staffel mit Daten sind sie unangekündigte Platzhalter (nur
 * markierbar, wenn eine spätere Folge schon lief), in einer komplett datumslosen
 * Staffel dagegen eine Metadaten-Lücke und damit abhakbar. Bereits einzeln
 * markierte Folgen bleiben immer drin.
 */
export const filterBulkMarkable = <T extends ReleaseStateEpisode>(episodes: T[]): T[] => {
  if (episodes.length === 0) return [];
  if (!episodes.some(hasAirDate)) return episodes;

  let lastAiredIndex = -1;
  episodes.forEach((ep, i) => {
    if (hasAirDate(ep) && hasEpisodeAired(ep)) lastAiredIndex = i;
  });

  return episodes.filter((ep, i) => {
    if (isEpisodeWatched(ep)) return true;
    if (hasAirDate(ep)) return hasEpisodeAired(ep);
    return i < lastAiredIndex;
  });
};
