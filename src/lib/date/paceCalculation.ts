import type { Series } from '../../types/Series';
import { hasEpisodeAired } from '../../utils/episodeDate';
import { t } from '../../services/i18n';
import { DEFAULT_EPISODE_RUNTIME_MINUTES, normalizeSeasons } from '../episode/seriesMetrics';

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

  const normalizedSeasons = normalizeSeasons(seasons);
  if (normalizedSeasons.length === 0) return noShow;

  const now = new Date();
  const watchDates: Date[] = [];
  let watchedCount = 0;
  let airedCount = 0;
  let totalRuntimeMinutes = 0;
  let runtimeSamples = 0;

  for (const season of normalizedSeasons) {
    // Bewusst lenient (kein normalizeEpisodes): auch Episoden ohne
    // episode_number zählen hier für Pace/Runtime
    type Episode = Series['seasons'][number]['episodes'][number];
    const episodes: Episode[] = Array.isArray(season.episodes)
      ? season.episodes
      : Object.values((season.episodes ?? {}) as Record<string, Episode>);
    for (const episode of episodes) {
      if (!episode) continue;
      if (hasEpisodeAired(episode)) {
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
    runtimeSamples > 0
      ? totalRuntimeMinutes / runtimeSamples
      : episodeRuntime || DEFAULT_EPISODE_RUNTIME_MINUTES;
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
    return t('Nicht genügend Daten · {n} Ep. offen', { n: pace.remainingEpisodes });
  } else if (pace.isPaused) {
    return t('Pausiert · {n} Ep. offen', { n: pace.remainingEpisodes });
  } else {
    // Pace
    if (pace.episodesPerWeek >= 7) {
      const perDay = Math.round((pace.episodesPerWeek / 7) * 10) / 10;
      parts.push(t('~{n} Ep./Tag', { n: perDay }));
    } else {
      parts.push(t('~{n} Ep./Woche', { n: pace.episodesPerWeek }));
    }

    // Estimated completion
    if (pace.estimatedCompletionDate) {
      const daysRemaining = Math.ceil(
        (pace.estimatedCompletionDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      if (compact) {
        // Compact format for homepage cards
        if (daysRemaining <= 1) {
          parts.push(t('noch ~1 Tag'));
        } else if (daysRemaining < 7) {
          parts.push(t('noch ~{n} Tage', { n: daysRemaining }));
        } else {
          const weeks = Math.round(daysRemaining / 7);
          parts.push(weeks === 1 ? t('noch ~1 Woche') : t('noch ~{n} Wochen', { n: weeks }));
        }
      } else {
        // Full format for detail page
        if (daysRemaining <= 1) {
          parts.push(t('Fertig ca. heute'));
        } else if (daysRemaining <= 14) {
          parts.push(t('noch ~{n} Tage', { n: daysRemaining }));
        } else {
          const day = pace.estimatedCompletionDate.getDate().toString().padStart(2, '0');
          const month = (pace.estimatedCompletionDate.getMonth() + 1).toString().padStart(2, '0');
          parts.push(t('Fertig ca. am {day}.{month}.', { day, month }));
        }
      }
    }
  }

  // Remaining hours (only in full format)
  if (!compact && pace.remainingHours > 0) {
    if (pace.remainingHours >= 1) {
      parts.push(t('~{n} Std. übrig', { n: Math.round(pace.remainingHours) }));
    } else {
      parts.push(t('~{n} Min. übrig', { n: Math.round(pace.remainingHours * 60) }));
    }
  }

  // Remaining episodes am Ende
  if (pace.remainingEpisodes > 0) {
    parts.push(t('{n} Ep. offen', { n: pace.remainingEpisodes }));
  }

  return parts.join(' · ');
}
