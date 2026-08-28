/**
 * Aufhol-Plan: rechnet den offenen Rückstand einer Serie gegen einen Termin
 * (Staffelstart oder Mid-Season-Rückkehr) und nennt die Hebel, die ihn retten.
 */

import { hasEpisodeAired } from '../utils/episodeDate';
import { DEFAULT_EPISODE_RUNTIME_MINUTES, normalizeSeasons } from './episode/seriesMetrics';
import type { Series } from '../types/Series';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Unter dieser Anzahl offener Folgen lohnt kein Plan. */
const MIN_REMAINING_EPISODES = 2;

type SeriesEpisode = Series['seasons'][number]['episodes'][number];

/** Prüft, ob eine Folge (1-basierte Staffel/Folge) Filler ist. */
export type IsFillerEpisode = (seasonNumber: number, episodeNumber: number) => boolean;

export interface OpenEpisodeStats {
  episodes: number;
  hours: number;
  fillerEpisodes: number;
  fillerHours: number;
}

export interface CatchUpPlanInput extends OpenEpisodeStats {
  /** Gemessenes Tempo für diese Serie. 0 = pausiert oder zu wenig Daten. */
  episodesPerWeek: number;
  targetDate: Date;
  now: Date;
}

export interface CatchUpVariant {
  episodes: number;
  hours: number;
  projectedDate: Date | null;
  willMakeIt: boolean;
  /** Tage nach dem Termin. 0, wenn es reicht. */
  daysLate: number;
}

export interface CatchUpPlan {
  shouldShow: boolean;
  daysUntilTarget: number;
  episodesPerWeek: number;
  /** Nötiges Tempo, um pünktlich fertig zu werden. */
  requiredPerWeek: number;
  current: CatchUpVariant;
  /** Dieselbe Rechnung ohne die offenen Filler-Folgen. Null ohne Filler. */
  withoutFiller: CatchUpVariant | null;
  /** Der Filler-Hebel allein reicht, um den Termin zu halten. */
  fillerSavesIt: boolean;
}

const episodesOf = (season: Series['seasons'][number]): SeriesEpisode[] =>
  Array.isArray(season.episodes)
    ? season.episodes
    : Object.values((season.episodes ?? {}) as Record<string, SeriesEpisode>);

/**
 * Offene (ausgestrahlte, ungesehene) Folgen einer Serie samt Filler-Anteil.
 * `isFiller` kommt vom Aufrufer, damit die Katalog-I/O draußen bleibt.
 */
export function collectOpenEpisodes(series: Series, isFiller?: IsFillerEpisode): OpenEpisodeStats {
  let episodes = 0;
  let minutes = 0;
  let fillerEpisodes = 0;
  let fillerMinutes = 0;

  const seasons = normalizeSeasons(series.seasons);
  for (const season of seasons) {
    const seasonNumber = (season.seasonNumber ?? 0) + 1;
    const list = episodesOf(season);
    for (let index = 0; index < list.length; index++) {
      const episode = list[index];
      if (!episode || episode.watched) continue;
      if (!hasEpisodeAired(episode)) continue;

      const runtime =
        episode.runtime && episode.runtime > 0
          ? episode.runtime
          : series.episodeRuntime > 0
            ? series.episodeRuntime
            : DEFAULT_EPISODE_RUNTIME_MINUTES;

      episodes += 1;
      minutes += runtime;

      const episodeNumber = episode.episode_number ?? index + 1;
      if (isFiller?.(seasonNumber, episodeNumber)) {
        fillerEpisodes += 1;
        fillerMinutes += runtime;
      }
    }
  }

  return { episodes, hours: minutes / 60, fillerEpisodes, fillerHours: fillerMinutes / 60 };
}

function projectVariant(
  episodes: number,
  hours: number,
  episodesPerWeek: number,
  now: Date,
  targetDate: Date
): CatchUpVariant {
  if (episodes <= 0) {
    return { episodes: 0, hours: 0, projectedDate: now, willMakeIt: true, daysLate: 0 };
  }
  if (episodesPerWeek <= 0) {
    return { episodes, hours, projectedDate: null, willMakeIt: false, daysLate: 0 };
  }

  const days = (episodes / episodesPerWeek) * 7;
  const projectedDate = new Date(now.getTime() + days * DAY_MS);
  const lateMs = projectedDate.getTime() - targetDate.getTime();

  return {
    episodes,
    hours,
    projectedDate,
    willMakeIt: lateMs <= 0,
    daysLate: lateMs <= 0 ? 0 : Math.ceil(lateMs / DAY_MS),
  };
}

export function buildCatchUpPlan(input: CatchUpPlanInput): CatchUpPlan {
  const { episodes, hours, fillerEpisodes, fillerHours, episodesPerWeek, targetDate, now } = input;

  const daysUntilTarget = Math.ceil((targetDate.getTime() - now.getTime()) / DAY_MS);
  const current = projectVariant(episodes, hours, episodesPerWeek, now, targetDate);

  const weeksUntilTarget = daysUntilTarget / 7;
  const requiredPerWeek =
    weeksUntilTarget > 0 ? Math.ceil((episodes / weeksUntilTarget) * 10) / 10 : 0;

  const withoutFiller =
    fillerEpisodes > 0
      ? projectVariant(
          episodes - fillerEpisodes,
          Math.max(0, hours - fillerHours),
          episodesPerWeek,
          now,
          targetDate
        )
      : null;

  return {
    shouldShow: episodes >= MIN_REMAINING_EPISODES && daysUntilTarget > 0,
    daysUntilTarget,
    episodesPerWeek,
    requiredPerWeek,
    current,
    withoutFiller,
    fillerSavesIt: !current.willMakeIt && withoutFiller !== null && withoutFiller.willMakeIt,
  };
}
