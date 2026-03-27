import { getEpisodeAirDate } from './episodeDate';

export type EpisodeChipType =
  | 'season-start'
  | 'mid-season-return'
  | 'season-finale'
  | 'season-break';

/**
 * Detect premiere/break chip type for an episode within its season.
 * Works with raw episode arrays from Series type.
 */
export function detectEpisodeChip(
  episodes: { air_date?: string; airstamp?: string; airDate?: string; firstAired?: string }[],
  episodeIndex: number,
  isInProduction: boolean
): EpisodeChipType | undefined {
  if (!episodes || episodes.length === 0) return undefined;

  const ep = episodes[episodeIndex];
  if (!ep) return undefined;

  const airDate = getEpisodeAirDate(ep);
  if (!airDate) return undefined;

  const airDay = new Date(airDate);
  airDay.setHours(0, 0, 0, 0);

  // Premiere detection
  if (episodeIndex === 0) {
    return 'season-start';
  }

  const prevEp = episodes[episodeIndex - 1];
  const prevAirDate = getEpisodeAirDate(prevEp);
  if (prevAirDate) {
    const prevDay = new Date(prevAirDate);
    prevDay.setHours(0, 0, 0, 0);
    const gapDays = (airDay.getTime() - prevDay.getTime()) / (1000 * 60 * 60 * 24);
    if (gapDays > 14) {
      return 'mid-season-return';
    }
  }

  // Break/finale detection
  const isLastEpisode = episodeIndex === episodes.length - 1;

  if (isLastEpisode) {
    const totalEps = episodes.length;
    if (totalEps >= 4 || !isInProduction) {
      return 'season-finale';
    }
  } else {
    const remaining = episodes.slice(episodeIndex + 1);
    const nextEp = remaining[0];
    const nextAirDate = getEpisodeAirDate(nextEp);
    if (nextAirDate) {
      const nextDay = new Date(nextAirDate);
      nextDay.setHours(0, 0, 0, 0);
      const gapDays = (nextDay.getTime() - airDay.getTime()) / (1000 * 60 * 60 * 24);
      if (gapDays > 14) {
        return 'season-break';
      }
    } else if (remaining.length > 1) {
      const anyHasDate = remaining.some((e) => getEpisodeAirDate(e));
      if (!anyHasDate) {
        return 'season-break';
      }
    }
  }

  return undefined;
}

/** Labels for chip types */
export function chipLabel(type: EpisodeChipType): string {
  switch (type) {
    case 'season-start':
      return 'Staffelstart';
    case 'mid-season-return':
      return 'Rückkehr';
    case 'season-finale':
      return 'Staffelende';
    case 'season-break':
      return 'Staffelpause';
  }
}

/** Colors for chip types */
export function chipColor(type: EpisodeChipType): string {
  switch (type) {
    case 'season-start':
    case 'mid-season-return':
      return '#f59e0b'; // warning/amber
    case 'season-finale':
      return '#7c3aed'; // deep violet
    case 'season-break':
      return '#a78bfa'; // lavender
  }
}
