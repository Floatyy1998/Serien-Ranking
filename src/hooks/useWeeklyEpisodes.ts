import { useMemo } from 'react';
import { DEFAULT_EPISODE_RUNTIME_MINUTES } from '../lib/episode/seriesMetrics';
import { Series } from '../types/Series';
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
              if (gapDays > 14) {
                premiereType = 'mid-season-return';
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

    // Deduplicate: if same series has same air_date from different seasons, keep highest season
    for (const [dateKey, episodes] of schedule) {
      const seen = new Map<string, number>(); // key: seriesId-epName → index in array
      const toRemove = new Set<number>();
      for (let i = 0; i < episodes.length; i++) {
        const ep = episodes[i];
        const key = `${ep.seriesId}-${ep.episodeName}`;
        if (seen.has(key)) {
          const prevIdx = seen.get(key)!;
          // Keep the one with the higher season number (more recent source)
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
