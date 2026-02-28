import type { Series } from '../types/Series';

export interface WatchingPace {
  episodesPerWeek: number;
  remainingEpisodes: number;
  estimatedCompletionDate: Date | null;
  remainingHours: number;
  isPaused: boolean;
  shouldShow: boolean;
}

export function calculateWatchingPace(
  seasons: Series['seasons'],
  episodeRuntime?: number
): WatchingPace {
  const noShow: WatchingPace = {
    episodesPerWeek: 0,
    remainingEpisodes: 0,
    estimatedCompletionDate: null,
    remainingHours: 0,
    isPaused: false,
    shouldShow: false,
  };

  if (!seasons || seasons.length === 0) return noShow;

  const now = new Date();
  const watchDates: Date[] = [];
  let watchedCount = 0;
  let airedCount = 0;
  let totalRuntimeMinutes = 0;
  let runtimeSamples = 0;

  for (const season of seasons) {
    if (!season.episodes) continue;
    for (const episode of season.episodes) {
      const airDate = episode.air_date ? new Date(episode.air_date) : null;
      const isAired = airDate && airDate <= now;

      if (isAired) {
        airedCount++;
        if (episode.watched) {
          watchedCount++;
          if (episode.firstWatchedAt) {
            watchDates.push(new Date(episode.firstWatchedAt));
          }
        }
      }

      const rt = episode.runtime || episodeRuntime;
      if (rt && rt > 0) {
        totalRuntimeMinutes += rt;
        runtimeSamples++;
      }
    }
  }

  const remaining = airedCount - watchedCount;

  if (remaining < 1) return noShow;

  // Remaining watchtime (always calculable)
  const avgRuntime =
    runtimeSamples > 0 ? totalRuntimeMinutes / runtimeSamples : episodeRuntime || 45;
  const remainingHoursCalc = Math.round(((remaining * avgRuntime) / 60) * 10) / 10;

  // Not enough timestamps for pace calculation — still show pausiert + remaining time
  if (watchDates.length < 2) {
    const lastWatch = watchDates.length > 0 ? Math.max(...watchDates.map((d) => d.getTime())) : 0;
    const daysSinceLastWatch =
      lastWatch > 0 ? (now.getTime() - lastWatch) / (1000 * 60 * 60 * 24) : Infinity;

    return {
      episodesPerWeek: 0,
      remainingEpisodes: remaining,
      estimatedCompletionDate: null,
      remainingHours: remainingHoursCalc,
      isPaused: daysSinceLastWatch > 14,
      shouldShow: true,
    };
  }

  // Sort dates ascending
  watchDates.sort((a, b) => a.getTime() - b.getTime());

  // Try recent pace (last 30 days)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const recentDates = watchDates.filter((d) => d >= thirtyDaysAgo);

  let episodesPerDay: number;
  let isPaused = false;

  if (recentDates.length >= 2) {
    // Recent pace: episodes in the last 30 days
    const daySpan = Math.max((now.getTime() - recentDates[0].getTime()) / (1000 * 60 * 60 * 24), 1);
    episodesPerDay = recentDates.length / daySpan;
  } else {
    // Fallback: overall pace
    const firstWatch = watchDates[0];
    const lastWatch = watchDates[watchDates.length - 1];
    const daySpan = (lastWatch.getTime() - firstWatch.getTime()) / (1000 * 60 * 60 * 24);

    if (daySpan < 1) {
      // All watched in one day (binge)
      episodesPerDay = watchDates.length;
    } else {
      episodesPerDay = watchDates.length / daySpan;
    }

    // If last watch was more than 30 days ago, mark as paused
    const lastWatchDate = watchDates[watchDates.length - 1];
    if (now.getTime() - lastWatchDate.getTime() > 30 * 24 * 60 * 60 * 1000) {
      isPaused = true;
    }
  }

  const episodesPerWeek = Math.round(episodesPerDay * 7 * 10) / 10;

  // Estimated completion
  let estimatedCompletionDate: Date | null = null;
  if (episodesPerDay > 0 && !isPaused) {
    const daysRemaining = remaining / episodesPerDay;
    estimatedCompletionDate = new Date(now.getTime() + daysRemaining * 24 * 60 * 60 * 1000);
  }

  return {
    episodesPerWeek,
    remainingEpisodes: remaining,
    estimatedCompletionDate,
    remainingHours: remainingHoursCalc,
    isPaused,
    shouldShow: true,
  };
}

export function formatPaceLine(pace: WatchingPace, compact = false): string {
  if (!pace.shouldShow) return '';

  const parts: string[] = [];

  if (pace.episodesPerWeek === 0 && !pace.isPaused) {
    return `Nicht genügend Daten · ${pace.remainingEpisodes} Ep. offen`;
  } else if (pace.isPaused) {
    return `Pausiert · ${pace.remainingEpisodes} Ep. offen`;
  } else {
    // Pace
    if (pace.episodesPerWeek >= 7) {
      const perDay = Math.round((pace.episodesPerWeek / 7) * 10) / 10;
      parts.push(`~${perDay} Ep./Tag`);
    } else {
      parts.push(`~${pace.episodesPerWeek} Ep./Woche`);
    }

    // Estimated completion
    if (pace.estimatedCompletionDate) {
      const daysRemaining = Math.ceil(
        (pace.estimatedCompletionDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      if (compact) {
        // Compact format for homepage cards
        if (daysRemaining <= 1) {
          parts.push('noch ~1 Tag');
        } else if (daysRemaining < 7) {
          parts.push(`noch ~${daysRemaining} Tage`);
        } else {
          const weeks = Math.round(daysRemaining / 7);
          parts.push(`noch ~${weeks} ${weeks === 1 ? 'Woche' : 'Wochen'}`);
        }
      } else {
        // Full format for detail page
        if (daysRemaining <= 1) {
          parts.push('Fertig ca. heute');
        } else if (daysRemaining <= 14) {
          parts.push(`noch ~${daysRemaining} Tage`);
        } else {
          const day = pace.estimatedCompletionDate.getDate().toString().padStart(2, '0');
          const month = (pace.estimatedCompletionDate.getMonth() + 1).toString().padStart(2, '0');
          parts.push(`Fertig ca. am ${day}.${month}.`);
        }
      }
    }
  }

  // Remaining hours (only in full format)
  if (!compact && pace.remainingHours > 0) {
    if (pace.remainingHours >= 1) {
      parts.push(`~${Math.round(pace.remainingHours)} Std. übrig`);
    } else {
      parts.push(`~${Math.round(pace.remainingHours * 60)} Min. übrig`);
    }
  }

  return parts.join(' · ');
}
