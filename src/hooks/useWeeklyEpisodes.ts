import { useMemo } from 'react';
import { SEASON_BREAK_GAP_DAYS } from '../lib/episode/constants';
import { DEFAULT_EPISODE_RUNTIME_MINUTES } from '../lib/episode/seriesMetrics';
import type { Series } from '../types/Series';
import { getImageUrl } from '../utils/imageUrl';
import { getEpisodeAirDateStr, getEpisodeAirDate } from '../utils/episodeDate';

/** Priority providers: Crunchyroll (283) first, ADN (415) second */
const PROVIDER_PRIORITY: Record<number, number> = { 283: 0, 415: 1 };

function prioritizeProviders(providers: WeeklyEpisodeProvider[]): WeeklyEpisodeProvider[] {
  if (providers.length <= 1) return providers;
  return [...providers].sort((a, b) => {
    const pa = PROVIDER_PRIORITY[a.id] ?? 99;
    const pb = PROVIDER_PRIORITY[b.id] ?? 99;
    return pa - pb;
  });
}

export interface WeeklyEpisodeProvider {
  id: number;
  logo: string;
  name: string;
}

export interface WeeklyEpisode {
  seriesId: number;
  seriesNmr: number;
  seriesTitle: string;
  poster: string;
  seasonNumber: number;
  episodeNumber: number;
  episodeName: string;
  airDate: string;
  airstamp?: string;
  watched: boolean;
  seasonIndex: number;
  episodeIndex: number;
  runtime: number;
  providerNames: string[];
  providers: WeeklyEpisodeProvider[];
  premiereType?: 'season-start' | 'mid-season-return';
  breakType?: 'season-finale' | 'season-break';
}

export type WeeklySchedule = Map<string, WeeklyEpisode[]>;

/**
 * Returns the Monday of the week for a given date offset.
 * weekOffset: 0 = current week, -1 = last week, +1 = next week
 */
function getWeekBounds(weekOffset: number): { monday: Date; sunday: Date } {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ...
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday + weekOffset * 7);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { monday, sunday };
}

/** Format: 'YYYY-MM-DD' */
function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export const useWeeklyEpisodes = (
  seriesList: Series[],
  weekOffset: number,
  watchlistOnly: boolean = false
): {
  schedule: WeeklySchedule;
  monday: Date;
  sunday: Date;
  totalEpisodes: number;
  watchedCount: number;
} => {
  return useMemo(() => {
    const { monday, sunday } = getWeekBounds(weekOffset);
    const schedule: WeeklySchedule = new Map();
    let totalEpisodes = 0;
    let watchedCount = 0;

    // Initialize all 7 days
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      schedule.set(toDateKey(day), []);
    }

    const visibleSeries = seriesList.filter((s) => !s.hidden && (!watchlistOnly || s.watchlist));

    for (const series of visibleSeries) {
      const seasonsArray = Array.isArray(series.seasons)
        ? series.seasons
        : series.seasons
          ? (Object.values(series.seasons) as typeof series.seasons)
          : [];

      for (let sIdx = 0; sIdx < seasonsArray.length; sIdx++) {
        const season = seasonsArray[sIdx];
        const episodes = Array.isArray(season.episodes)
          ? season.episodes
          : season.episodes
            ? (Object.values(season.episodes) as typeof season.episodes)
            : [];

        for (let eIdx = 0; eIdx < episodes.length; eIdx++) {
          const ep = episodes[eIdx];
          const airDateStr = getEpisodeAirDateStr(ep);
          if (!airDateStr) continue;

          const airDate = getEpisodeAirDate(ep);
          if (!airDate) continue;

          // Check if episode falls within this week
          const airDateDay = new Date(airDate);
          airDateDay.setHours(0, 0, 0, 0);
          if (airDateDay < monday || airDateDay > sunday) continue;

          const dateKey = toDateKey(airDateDay);

          // Detect premiere type
          let premiereType: WeeklyEpisode['premiereType'];
          if (eIdx === 0) {
            premiereType = 'season-start';
          } else {
            // Check gap to previous episode for mid-season return
            const prevEp = episodes[eIdx - 1];
            const prevAirDate = getEpisodeAirDate(prevEp);
            if (prevAirDate) {
              const gapDays =
                (airDateDay.getTime() - prevAirDate.getTime()) / (1000 * 60 * 60 * 24);
              if (gapDays > SEASON_BREAK_GAP_DAYS) {
                premiereType = 'mid-season-return';
              }
            }
          }

          // Detect break type (season finale or upcoming hiatus)
          let breakType: WeeklyEpisode['breakType'];
          const isLastEpisode = eIdx === episodes.length - 1;

          if (isLastEpisode) {
            // Last known episode in this season
            const totalEps = episodes.length;
            const isInProduction = series.production?.production !== false;

            // Only mark as finale if we're confident it's truly the last:
            // - Season has enough episodes to be credible (≥4), OR
            // - Series is confirmed not in production anymore
            // This prevents marking a series with only 1-2 announced eps as "finale"
            if (totalEps >= 4 || !isInProduction) {
              breakType = 'season-finale';
            }
          } else {
            // Check if next episode has a large gap → upcoming break
            const remaining = episodes.slice(eIdx + 1);
            const nextEp = remaining[0];
            const nextAirDate = getEpisodeAirDate(nextEp);
            if (nextAirDate) {
              const nextDay = new Date(nextAirDate);
              nextDay.setHours(0, 0, 0, 0);
              const gapDays = (nextDay.getTime() - airDateDay.getTime()) / (1000 * 60 * 60 * 24);
              if (gapDays > SEASON_BREAK_GAP_DAYS) {
                breakType = 'season-break';
              }
            } else if (remaining.length > 1) {
              // Multiple upcoming episodes but none have a date → likely on hiatus
              const anyHasDate = remaining.some((e) => getEpisodeAirDate(e));
              if (!anyHasDate) {
                breakType = 'season-break';
              }
            }
          }

          const entry: WeeklyEpisode = {
            seriesId: series.id,
            seriesNmr: series.nmr,
            seriesTitle: series.title,
            poster: getImageUrl(series.poster),
            seasonNumber: season.seasonNumber + 1,
            episodeNumber: eIdx + 1,
            episodeName: ep.name || `Episode ${eIdx + 1}`,
            airDate: airDateStr,
            airstamp: ep.airstamp || undefined,
            watched: !!ep.watched,
            seasonIndex: sIdx,
            episodeIndex: eIdx,
            runtime: ep.runtime || series.episodeRuntime || DEFAULT_EPISODE_RUNTIME_MINUTES,
            providerNames: series.provider?.provider?.map((p) => p.name) || [],
            providers: prioritizeProviders(series.provider?.provider || []),
            premiereType,
            breakType,
          };

          const dayEpisodes = schedule.get(dateKey);
          if (dayEpisodes) {
            dayEpisodes.push(entry);
          } else {
            schedule.set(dateKey, [entry]);
          }

          totalEpisodes++;
          if (ep.watched) watchedCount++;
        }
      }
    }

    // Deduplicate: wenn dieselbe Serie dieselbe Episode aus verschiedenen
    // Seasons listet, die aus der hoechsten Season behalten. Dedup nur per
    // echtem Titel — Placeholder-Namen ("TBA", "Folge X", "Episode X", leer)
    // bekommen einen eindeutigen Key inkl. seasonNumber+episodeNumber, damit
    // Netflix-Binge-Drops (alle 8 Folgen gleicher Tag, alle "TBA") nicht
    // bis auf die erste weggefiltert werden.
    const isPlaceholderTitle = (name: string | undefined | null): boolean => {
      if (!name) return true;
      const trimmed = name.trim();
      if (trimmed.length === 0) return true;
      if (/^tba$/i.test(trimmed)) return true;
      if (/^(episode|folge)\s*\d+$/i.test(trimmed)) return true;
      return false;
    };
    for (const [dateKey, episodes] of schedule) {
      const seen = new Map<string, number>();
      const toRemove = new Set<number>();
      for (let i = 0; i < episodes.length; i++) {
        const ep = episodes[i];
        const key = isPlaceholderTitle(ep.episodeName)
          ? `${ep.seriesId}-S${ep.seasonNumber}E${ep.episodeNumber}`
          : `${ep.seriesId}-${ep.episodeName}`;
        if (seen.has(key)) {
          const prevIdx = seen.get(key) ?? 0;
          if (ep.seasonNumber > episodes[prevIdx].seasonNumber) {
            toRemove.add(prevIdx);
            seen.set(key, i);
          } else {
            toRemove.add(i);
          }
        } else {
          seen.set(key, i);
        }
      }
      if (toRemove.size > 0) {
        const filtered = episodes.filter((_, idx) => !toRemove.has(idx));
        schedule.set(dateKey, filtered);
        totalEpisodes -= toRemove.size;
      }
    }

    // Sort episodes within each day by air time, then series title
    for (const [, episodes] of schedule) {
      episodes.sort((a, b) => {
        const aTime = a.airstamp || '';
        const bTime = b.airstamp || '';
        if (aTime && bTime) return aTime.localeCompare(bTime);
        if (aTime) return -1;
        if (bTime) return 1;
        return a.seriesTitle.localeCompare(b.seriesTitle);
      });
    }

    return { schedule, monday, sunday, totalEpisodes, watchedCount };
  }, [seriesList, weekOffset, watchlistOnly]);
};
