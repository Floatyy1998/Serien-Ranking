import { useMemo } from 'react';
import { Series } from '../types/Series';
import { getImageUrl } from '../utils/imageUrl';

export interface WeeklyEpisode {
  seriesId: number;
  seriesNmr: number;
  seriesTitle: string;
  poster: string;
  seasonNumber: number;
  episodeNumber: number;
  episodeName: string;
  airDate: string;
  watched: boolean;
  seasonIndex: number;
  episodeIndex: number;
  runtime: number;
  providerNames: string[];
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
          const airDateStr = ep.air_date || ep.airDate || ep.firstAired;
          if (!airDateStr) continue;

          const airDate = new Date(airDateStr);
          if (isNaN(airDate.getTime())) continue;

          // Check if episode falls within this week
          airDate.setHours(0, 0, 0, 0);
          if (airDate < monday || airDate > sunday) continue;

          const dateKey = toDateKey(airDate);

          // Detect premiere type
          let premiereType: WeeklyEpisode['premiereType'];
          if (eIdx === 0) {
            premiereType = 'season-start';
          } else {
            // Check gap to previous episode for mid-season return
            const prevEp = episodes[eIdx - 1];
            const prevAirStr = prevEp?.air_date || prevEp?.airDate || prevEp?.firstAired;
            if (prevAirStr) {
              const prevAirDate = new Date(prevAirStr);
              if (!isNaN(prevAirDate.getTime())) {
                const gapDays = (airDate.getTime() - prevAirDate.getTime()) / (1000 * 60 * 60 * 24);
                if (gapDays > 14) {
                  premiereType = 'mid-season-return';
                }
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
            watched: !!ep.watched,
            seasonIndex: sIdx,
            episodeIndex: eIdx,
            runtime: ep.runtime || series.episodeRuntime || 45,
            providerNames: series.provider?.provider?.map((p) => p.name) || [],
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

    // Sort episodes within each day by series title
    for (const [, episodes] of schedule) {
      episodes.sort((a, b) => a.seriesTitle.localeCompare(b.seriesTitle));
    }

    return { schedule, monday, sunday, totalEpisodes, watchedCount };
  }, [seriesList, weekOffset, watchlistOnly]);
};
