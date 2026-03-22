/**
 * Wrapped Temporal - Zeitliche Berechnungen (Monate, Tage, Tageszeiten, Heatmap)
 */

import { ActivityEvent, EpisodeWatchEvent, MovieWatchEvent } from '../../types/WatchActivity';
import { DEFAULT_EPISODE_RUNTIME_MINUTES } from '../../lib/episode/seriesMetrics';
import {
  MonthStats,
  DayStats,
  TimeOfDayStats,
  DayOfWeekStats,
  FirstLastWatch,
  LateNightStats,
  MONTH_NAMES,
  DAY_NAMES,
  TIME_OF_DAY_LABELS,
} from '../../types/Wrapped';

export function calculateMonthlyBreakdown(events: ActivityEvent[]): MonthStats[] {
  const months: MonthStats[] = [];

  for (let month = 1; month <= 12; month++) {
    const monthEvents = events.filter((e) => e.month === month);
    const episodeEvents = monthEvents.filter(
      (e) => e.type === 'episode_watch'
    ) as EpisodeWatchEvent[];
    const movieEvents = monthEvents.filter(
      (e) => e.type === 'movie_watch' || e.type === 'movie_rating'
    ) as MovieWatchEvent[];

    months.push({
      month,
      monthName: MONTH_NAMES[month - 1],
      episodesWatched: episodeEvents.length,
      moviesWatched: movieEvents.length,
      minutesWatched:
        episodeEvents.reduce(
          (sum, e) => sum + (e.episodeRuntime || DEFAULT_EPISODE_RUNTIME_MINUTES),
          0
        ) + movieEvents.reduce((sum, e) => sum + (e.runtime || 120), 0),
    });
  }

  return months;
}

export function findMostActiveMonth(breakdown: MonthStats[]): MonthStats {
  return breakdown.reduce((max, m) =>
    m.episodesWatched + m.moviesWatched > max.episodesWatched + max.moviesWatched ? m : max
  );
}

export function findMostActiveDay(events: ActivityEvent[]): DayStats {
  const dayMap = new Map<string, { episodes: number; movies: number; minutes: number }>();

  for (const event of events) {
    const dateKey = event.timestamp.split('T')[0];
    const existing = dayMap.get(dateKey) || { episodes: 0, movies: 0, minutes: 0 };

    if (event.type === 'episode_watch') {
      existing.episodes++;
      existing.minutes +=
        (event as EpisodeWatchEvent).episodeRuntime || DEFAULT_EPISODE_RUNTIME_MINUTES;
    } else if (event.type === 'movie_watch') {
      existing.movies++;
      existing.minutes += (event as MovieWatchEvent).runtime || 120;
    }

    dayMap.set(dateKey, existing);
  }

  let maxDay = { date: '', episodes: 0, movies: 0, minutes: 0 };

  for (const [date, data] of dayMap) {
    if (data.episodes + data.movies > maxDay.episodes + maxDay.movies) {
      maxDay = { date, ...data };
    }
  }

  const dateObj = new Date(maxDay.date);

  return {
    date: maxDay.date,
    dayName: DAY_NAMES[dateObj.getDay()],
    episodesWatched: maxDay.episodes,
    moviesWatched: maxDay.movies,
    minutesWatched: maxDay.minutes,
  };
}

/**
 * Berechnet die Tageszeit basierend auf der Stunde
 */
function getTimeOfDay(hour: number): 'morning' | 'afternoon' | 'evening' | 'night' {
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
}

export function calculateFavoriteTimeOfDay(events: ActivityEvent[]): TimeOfDayStats {
  const counts: Record<string, number> = { morning: 0, afternoon: 0, evening: 0, night: 0 };
  const total = events.length;

  for (const event of events) {
    if (event.hour !== undefined) {
      const timeOfDay = getTimeOfDay(event.hour);
      counts[timeOfDay]++;
    }
  }

  const favorite = Object.entries(counts).reduce(
    (max, [time, count]) => (count > max[1] ? [time, count] : max),
    ['evening', 0]
  );

  return {
    timeOfDay: favorite[0] as 'morning' | 'afternoon' | 'evening' | 'night',
    label: TIME_OF_DAY_LABELS[favorite[0]],
    count: favorite[1] as number,
    percentage: total > 0 ? Math.round(((favorite[1] as number) / total) * 100) : 0,
  };
}

export function calculateFavoriteDayOfWeek(events: ActivityEvent[]): DayOfWeekStats {
  const counts = [0, 0, 0, 0, 0, 0, 0]; // So-Sa
  const total = events.length;

  for (const event of events) {
    if (event.dayOfWeek !== undefined) {
      counts[event.dayOfWeek]++;
    }
  }

  const maxIndex = counts.indexOf(Math.max(...counts));

  return {
    dayOfWeek: maxIndex,
    dayName: DAY_NAMES[maxIndex],
    count: counts[maxIndex],
    percentage: total > 0 ? Math.round((counts[maxIndex] / total) * 100) : 0,
  };
}

// ========================================
// First/Last Watch
// ========================================

export function findFirstWatch(events: ActivityEvent[]): FirstLastWatch | null {
  const watchEvents = events.filter(
    (e) => e.type === 'episode_watch' || e.type === 'movie_watch' || e.type === 'movie_rating'
  );

  if (watchEvents.length === 0) return null;

  // Sortiere nach Timestamp aufsteigend
  const sorted = [...watchEvents].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const first = sorted[0];
  const date = new Date(first.timestamp);

  if (first.type === 'episode_watch') {
    const ep = first as EpisodeWatchEvent;
    return {
      type: 'episode',
      title: ep.seriesTitle,
      subtitle: `S${ep.seasonNumber} E${ep.episodeNumber}`,
      date: date.toLocaleDateString('de-DE', { day: 'numeric', month: 'long' }),
      timestamp: first.timestamp,
      id: ep.seriesId,
    };
  } else {
    const movie = first as MovieWatchEvent;
    return {
      type: 'movie',
      title: movie.movieTitle,
      date: date.toLocaleDateString('de-DE', { day: 'numeric', month: 'long' }),
      timestamp: first.timestamp,
      id: movie.movieId,
    };
  }
}

export function findLastWatch(events: ActivityEvent[]): FirstLastWatch | null {
  const watchEvents = events.filter(
    (e) => e.type === 'episode_watch' || e.type === 'movie_watch' || e.type === 'movie_rating'
  );

  if (watchEvents.length === 0) return null;

  // Sortiere nach Timestamp absteigend
  const sorted = [...watchEvents].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const last = sorted[0];
  const date = new Date(last.timestamp);

  if (last.type === 'episode_watch') {
    const ep = last as EpisodeWatchEvent;
    return {
      type: 'episode',
      title: ep.seriesTitle,
      subtitle: `S${ep.seasonNumber} E${ep.episodeNumber}`,
      date: date.toLocaleDateString('de-DE', { day: 'numeric', month: 'long' }),
      timestamp: last.timestamp,
      id: ep.seriesId,
    };
  } else {
    const movie = last as MovieWatchEvent;
    return {
      type: 'movie',
      title: movie.movieTitle,
      date: date.toLocaleDateString('de-DE', { day: 'numeric', month: 'long' }),
      timestamp: last.timestamp,
      id: movie.movieId,
    };
  }
}

// ========================================
// Late Night Stats
// ========================================

export function calculateLateNightStats(events: ActivityEvent[]): LateNightStats {
  const watchEvents = events.filter(
    (e) => e.type === 'episode_watch' || e.type === 'movie_watch' || e.type === 'movie_rating'
  );

  const total = watchEvents.length;
  let lateNightCount = 0; // 22-6 Uhr
  let midnightCount = 0; // 0-4 Uhr
  let latestWatch: { time: string; title: string; hour: number } | null = null;

  for (const event of watchEvents) {
    const hour = event.hour ?? 12;

    // Late Night: 22-23 oder 0-5
    if (hour >= 22 || hour < 6) {
      lateNightCount++;
    }

    // Midnight: 0-4
    if (hour >= 0 && hour < 5) {
      midnightCount++;
    }

    // Track latest watch (nach Uhrzeit, nicht Datum)
    // Wir suchen die späteste Uhrzeit (z.B. 3:45 Uhr nachts)
    const normalizedHour = hour < 6 ? hour + 24 : hour; // 3 Uhr wird zu 27
    if (!latestWatch || normalizedHour > latestWatch.hour) {
      const title =
        event.type === 'episode_watch'
          ? (event as EpisodeWatchEvent).seriesTitle
          : (event as MovieWatchEvent).movieTitle;
      const timeStr = `${hour.toString().padStart(2, '0')}:${new Date(event.timestamp)
        .getMinutes()
        .toString()
        .padStart(2, '0')}`;
      latestWatch = { time: timeStr, title, hour: normalizedHour };
    }
  }

  return {
    totalLateNightWatches: lateNightCount,
    midnightWatches: midnightCount,
    latestWatch: latestWatch ? { time: latestWatch.time, title: latestWatch.title } : null,
    percentage: total > 0 ? Math.round((lateNightCount / total) * 100) : 0,
  };
}

// ========================================
// Heatmap Data (7 Tage x 24 Stunden)
// ========================================

export function calculateHeatmapData(events: ActivityEvent[]): number[][] {
  // Erstelle 7x24 Matrix (Tage x Stunden)
  const heatmap: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));

  const watchEvents = events.filter(
    (e) => e.type === 'episode_watch' || e.type === 'movie_watch' || e.type === 'movie_rating'
  );

  for (const event of watchEvents) {
    const dayOfWeek = event.dayOfWeek ?? 0;
    const hour = event.hour ?? 12;
    heatmap[dayOfWeek][hour]++;
  }

  return heatmap;
}
