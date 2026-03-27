import { memo, useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContextDef';
import { getEpisodeAirDate, hasEpisodeAired } from '../../utils/episodeDate';
import type { Series } from '../../types/Series';

interface StatusBadgeProps {
  series: Series;
}

/** Detect airing rhythm from recent episode air dates */
function detectAiringRhythm(series: Series): string | null {
  if (!series.seasons || series.seasons.length === 0) return null;

  // Collect air dates from the latest season that has dated episodes
  for (let sIdx = series.seasons.length - 1; sIdx >= 0; sIdx--) {
    const season = series.seasons[sIdx];
    if (!season?.episodes) continue;

    const dates: Date[] = [];
    for (const ep of season.episodes) {
      const d = getEpisodeAirDate(ep);
      if (d) dates.push(d);
    }
    if (dates.length < 2) continue;

    dates.sort((a, b) => a.getTime() - b.getTime());

    // Calculate gaps between consecutive episodes
    const gaps: number[] = [];
    for (let i = 1; i < dates.length; i++) {
      const gapDays = Math.round(
        (dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24)
      );
      if (gapDays > 0 && gapDays < 60) gaps.push(gapDays);
    }
    if (gaps.length === 0) continue;

    const median = gaps.sort((a, b) => a - b)[Math.floor(gaps.length / 2)];

    // Check if most recent episode is recent enough (within 2x the rhythm)
    const lastDate = dates[dates.length - 1];
    const daysSinceLast = (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLast > median * 2.5) return null; // likely on break

    const DAYS = [
      'Sonntags',
      'Montags',
      'Dienstags',
      'Mittwochs',
      'Donnerstags',
      'Freitags',
      'Samstags',
    ];

    if (median >= 5 && median <= 9) {
      // Weekly — show day of week from most recent episode
      const dayName = DAYS[lastDate.getDay()];
      return `${dayName} neue Folge`;
    }
    if (median >= 12 && median <= 16) {
      return 'Alle 2 Wochen';
    }
    return null;
  }
  return null;
}

/** Find next unwatched or upcoming episode */
function getNextEpisodeInfo(
  series: Series
): { label: string; color: 'upcoming' | 'unwatched' } | null {
  if (!series.seasons) return null;

  const now = new Date();

  // First: find next unaired episode (upcoming)
  let nearestFuture: { date: Date; season: number; episode: number } | null = null;

  for (const season of series.seasons) {
    if (!season?.episodes) continue;
    for (let eIdx = 0; eIdx < season.episodes.length; eIdx++) {
      const ep = season.episodes[eIdx];
      const airDate = getEpisodeAirDate(ep);
      if (!airDate) continue;
      if (airDate > now) {
        if (!nearestFuture || airDate < nearestFuture.date) {
          nearestFuture = {
            date: airDate,
            season: (season.seasonNumber ?? 0) + 1,
            episode: eIdx + 1,
          };
        }
      }
    }
  }

  if (nearestFuture) {
    const formatted = nearestFuture.date.toLocaleDateString('de-DE', {
      day: 'numeric',
      month: 'short',
      timeZone: 'Europe/Berlin',
    });
    return {
      label: `S${nearestFuture.season}E${nearestFuture.episode} · ${formatted}`,
      color: 'upcoming',
    };
  }

  // Fallback: next unwatched aired episode
  for (const season of series.seasons) {
    if (!season?.episodes) continue;
    for (let eIdx = 0; eIdx < season.episodes.length; eIdx++) {
      const ep = season.episodes[eIdx];
      if (!ep.watched && hasEpisodeAired(ep)) {
        return {
          label: `S${(season.seasonNumber ?? 0) + 1}E${eIdx + 1} · ${ep.name || `Episode ${eIdx + 1}`}`,
          color: 'unwatched',
        };
      }
    }
  }

  return null;
}

export const StatusBadge = memo<StatusBadgeProps>(({ series }) => {
  const { currentTheme } = useTheme();
  const isOngoing =
    series.status === 'Returning Series' ||
    series.status === 'ongoing' ||
    (!series.status && series.production?.production === true);
  const isEnded =
    series.status === 'Ended' ||
    series.status === 'Canceled' ||
    (!series.status && series.production?.production === false);

  const rhythm = useMemo(
    () => (isOngoing ? detectAiringRhythm(series) : null),
    [series, isOngoing]
  );

  if (!isOngoing && !isEnded) return null;

  const color = isOngoing ? currentTheme.status?.success || '#22c55e' : currentTheme.text.muted;
  const label = isOngoing ? (rhythm ? `Läuft · ${rhythm}` : 'Fortlaufend') : 'Beendet';

  return (
    <span className="status-badge" style={{ borderColor: `${color}66`, color }}>
      <div className="status-badge__dot" style={{ background: color }} />
      {label}
    </span>
  );
});

StatusBadge.displayName = 'StatusBadge';

/** Separate chip showing next episode info */
export const NextEpisodeChip = memo<StatusBadgeProps>(({ series }) => {
  const { currentTheme } = useTheme();
  const nextEp = useMemo(() => getNextEpisodeInfo(series), [series]);

  if (!nextEp) return null;

  const isUpcoming = nextEp.color === 'upcoming';
  const color = isUpcoming ? currentTheme.accent : currentTheme.primary;

  return (
    <span className="status-badge" style={{ borderColor: `${color}66`, color }}>
      {isUpcoming ? 'Nächste' : 'Dran'}
      <span style={{ opacity: 0.7, marginLeft: 2 }}>{nextEp.label}</span>
    </span>
  );
});

NextEpisodeChip.displayName = 'NextEpisodeChip';
