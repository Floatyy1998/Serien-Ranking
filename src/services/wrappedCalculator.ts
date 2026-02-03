/**
 * Wrapped Calculator - Berechnet alle Statistiken für den Jahresrückblick
 *
 * Dieses Modul ist Jahr-agnostisch und kann jedes Jahr wiederverwendet werden.
 */

import { ActivityEvent, EpisodeWatchEvent, MovieWatchEvent, BingeSession } from '../types/WatchActivity';
import {
  WrappedStats,
  TopSeriesEntry,
  TopMovieEntry,
  TopGenreEntry,
  TopProviderEntry,
  MonthStats,
  DayStats,
  TimeOfDayStats,
  DayOfWeekStats,
  BingeSessionStats,
  DeviceBreakdown,
  WrappedAchievement,
  FunFact,
  FirstLastWatch,
  LateNightStats,
  WRAPPED_ACHIEVEMENTS,
  MONTH_NAMES,
  DAY_NAMES,
  TIME_OF_DAY_LABELS,
} from '../types/Wrapped';

// ========================================
// Haupt-Berechnungsfunktion
// ========================================

export function calculateWrappedStats(
  events: ActivityEvent[],
  bingeSessions: BingeSession[],
  year: number
): WrappedStats {
  // Filtere Events für das gewünschte Jahr
  const yearEvents = events.filter((e) => e.year === year);
  const episodeEvents = yearEvents.filter((e) => e.type === 'episode_watch') as EpisodeWatchEvent[];
  const movieEvents = yearEvents.filter((e) => e.type === 'movie_watch' || e.type === 'movie_rating') as MovieWatchEvent[];

  // Grundlegende Berechnungen
  const totalEpisodes = episodeEvents.length;
  const totalMovies = movieEvents.length;

  const episodeMinutes = episodeEvents.reduce((sum, e) => sum + (e.episodeRuntime || 45), 0);
  const movieMinutes = movieEvents.reduce((sum, e) => sum + (e.runtime || 120), 0);
  const totalMinutes = episodeMinutes + movieMinutes;

  // Top Serien
  const topSeries = calculateTopSeries(episodeEvents);

  // Top Filme
  const topMovies = calculateTopMovies(movieEvents);

  // Top Genres
  const topGenres = calculateTopGenres(episodeEvents, movieEvents);

  // Top Providers (Streaming-Dienste)
  const topProviders = calculateTopProviders(episodeEvents, movieEvents);

  // Zeitliche Muster
  const monthlyBreakdown = calculateMonthlyBreakdown(yearEvents);
  const mostActiveMonth = findMostActiveMonth(monthlyBreakdown);
  const mostActiveDay = findMostActiveDay(yearEvents);
  const favoriteTimeOfDay = calculateFavoriteTimeOfDay(yearEvents);
  const favoriteDayOfWeek = calculateFavoriteDayOfWeek(yearEvents);

  // Binge-Statistiken
  const yearBingeSessions = bingeSessions.filter(
    (s) => new Date(s.startedAt).getFullYear() === year
  );
  const longestBinge = findLongestBingeSession(yearBingeSessions);

  // Geräte-Breakdown
  const deviceBreakdown = calculateDeviceBreakdown(yearEvents);

  // Unique Serien
  const uniqueSeriesIds = new Set(episodeEvents.map((e) => e.seriesId));

  // Achievements
  const achievements = calculateAchievements({
    totalEpisodes,
    totalMovies,
    totalMinutes,
    favoriteTimeOfDay,
    favoriteDayOfWeek,
    topGenres,
    longestStreak: 0, // TODO: Aus Streak-Daten
    yearBingeSessions,
  });

  // Fun Facts
  const funFacts = generateFunFacts({
    totalMinutes,
    totalEpisodes,
    totalMovies,
    topSeries,
    mostActiveMonth,
    favoriteTimeOfDay,
  });

  // NEUE BERECHNUNGEN
  // First & Last Watch
  const firstWatch = findFirstWatch(yearEvents);
  const lastWatch = findLastWatch(yearEvents);

  // Late Night Stats
  const lateNightStats = calculateLateNightStats(yearEvents);

  // Heatmap Data
  const heatmapData = calculateHeatmapData(yearEvents);

  return {
    year,
    totalEpisodesWatched: totalEpisodes,
    totalMoviesWatched: totalMovies,
    totalMinutesWatched: totalMinutes,
    totalHoursWatched: Math.round(totalMinutes / 60),
    totalDaysEquivalent: Math.round((totalMinutes / 60 / 24) * 10) / 10,
    totalSeriesStarted: yearEvents.filter((e) => e.type === 'series_added').length,
    totalSeriesCompleted: 0, // TODO: Implementieren wenn Daten verfügbar
    uniqueSeriesWatched: uniqueSeriesIds.size,
    topSeries,
    topMovies,
    topGenres,
    topProviders,
    mostActiveMonth,
    mostActiveDay,
    favoriteTimeOfDay,
    favoriteDayOfWeek,
    monthlyBreakdown,
    totalBingeSessions: yearBingeSessions.length,
    longestBingeSession: longestBinge,
    averageBingeLength: yearBingeSessions.length > 0
      ? Math.round(yearBingeSessions.reduce((sum, s) => sum + s.episodes.length, 0) / yearBingeSessions.length)
      : 0,
    longestStreak: 0, // TODO: Aus Streak-Daten holen
    currentStreak: 0,
    deviceBreakdown,
    achievements,
    funFacts,
    // Neue Stats
    firstWatch,
    lastWatch,
    lateNightStats,
    heatmapData,
  };
}

// ========================================
// Top-Listen Berechnungen
// ========================================

function calculateTopSeries(episodes: EpisodeWatchEvent[], limit = 5): TopSeriesEntry[] {
  const seriesMap = new Map<number, TopSeriesEntry>();

  for (const ep of episodes) {
    const existing = seriesMap.get(ep.seriesId) || {
      id: ep.seriesId,
      title: ep.seriesTitle,
      episodesWatched: 0,
      minutesWatched: 0,
    };
    existing.episodesWatched++;
    existing.minutesWatched += ep.episodeRuntime || 45;
    seriesMap.set(ep.seriesId, existing);
  }

  return [...seriesMap.values()]
    .sort((a, b) => b.episodesWatched - a.episodesWatched)
    .slice(0, limit);
}

function calculateTopMovies(movies: MovieWatchEvent[], limit = 5): TopMovieEntry[] {
  return movies
    .map((m) => ({
      id: m.movieId,
      title: m.movieTitle,
      rating: m.rating,
      minutesWatched: m.runtime || 120,
    }))
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, limit);
}

function calculateTopGenres(
  episodes: EpisodeWatchEvent[],
  movies: MovieWatchEvent[],
  limit = 5
): TopGenreEntry[] {
  const genreMap = new Map<string, { count: number; minutes: number }>();
  let totalMinutes = 0;

  // Genres die ignoriert werden sollen (zu generisch)
  const ignoredGenres = new Set(['All', 'all', 'Alle', 'alle']);

  // Sammle Genres aus Episode-Events
  for (const episode of episodes) {
    if (episode.genres && episode.genres.length > 0) {
      // Filtere ignorierte Genres heraus
      const validGenres = episode.genres.filter(g => !ignoredGenres.has(g));
      if (validGenres.length === 0) continue;

      const minutesPerGenre = (episode.episodeRuntime || 45) / validGenres.length;
      for (const genre of validGenres) {
        const existing = genreMap.get(genre) || { count: 0, minutes: 0 };
        existing.count++;
        existing.minutes += minutesPerGenre;
        genreMap.set(genre, existing);
        totalMinutes += minutesPerGenre;
      }
    }
  }

  // Sammle Genres aus Movie-Events
  for (const movie of movies) {
    if (movie.genres && movie.genres.length > 0) {
      // Filtere ignorierte Genres heraus
      const validGenres = movie.genres.filter(g => !ignoredGenres.has(g));
      if (validGenres.length === 0) continue;

      const minutesPerGenre = (movie.runtime || 120) / validGenres.length;
      for (const genre of validGenres) {
        const existing = genreMap.get(genre) || { count: 0, minutes: 0 };
        existing.count++;
        existing.minutes += minutesPerGenre;
        genreMap.set(genre, existing);
        totalMinutes += minutesPerGenre;
      }
    }
  }

  // Falls keine Genre-Daten vorhanden, leeres Array zurückgeben
  if (genreMap.size === 0) {
    return [];
  }

  return [...genreMap.entries()]
    .map(([genre, data]) => ({
      genre,
      count: data.count,
      percentage: totalMinutes > 0 ? Math.round((data.minutes / totalMinutes) * 100) : 0,
      minutesWatched: Math.round(data.minutes),
    }))
    .sort((a, b) => b.minutesWatched - a.minutesWatched)
    .slice(0, limit);
}

function calculateTopProviders(
  episodes: EpisodeWatchEvent[],
  movies: MovieWatchEvent[],
  limit = 5
): TopProviderEntry[] {
  const providerMap = new Map<string, {
    episodeCount: number;
    movieCount: number;
    minutes: number;
  }>();

  let totalMinutes = 0;

  // Sammle Provider aus Episode-Events
  // Unterstützt sowohl das neue providers-Array als auch das alte provider-Feld
  // Jeder Provider bekommt die volle Watchzeit (nicht aufgeteilt)
  for (const episode of episodes) {
    const providers = [...new Set<string>(episode.providers || (episode.provider ? [episode.provider] : []))];
    const runtime = episode.episodeRuntime || 45;

    for (const providerName of providers) {
      if (!providerName) continue;
      const existing = providerMap.get(providerName) || {
        episodeCount: 0,
        movieCount: 0,
        minutes: 0,
      };
      existing.episodeCount++;
      existing.minutes += runtime; // Volle Zeit für jeden Provider
      providerMap.set(providerName, existing);
    }
    if (providers.length > 0) {
      totalMinutes += runtime;
    }
  }

  // Sammle Provider aus Movie-Events
  for (const movie of movies) {
    const providers = [...new Set<string>(movie.providers || (movie.provider ? [movie.provider] : []))];
    const runtime = movie.runtime || 120;

    for (const providerName of providers) {
      if (!providerName) continue;
      const existing = providerMap.get(providerName) || {
        episodeCount: 0,
        movieCount: 0,
        minutes: 0,
      };
      existing.movieCount++;
      existing.minutes += runtime; // Volle Zeit für jeden Provider
      providerMap.set(providerName, existing);
    }
    if (providers.length > 0) {
      totalMinutes += runtime;
    }
  }

  if (providerMap.size === 0) {
    return [];
  }

  return [...providerMap.entries()]
    .map(([name, data]) => ({
      name,
      episodeCount: data.episodeCount,
      movieCount: data.movieCount,
      totalCount: data.episodeCount + data.movieCount,
      minutesWatched: Math.round(data.minutes),
      percentage: totalMinutes > 0 ? Math.round((data.minutes / totalMinutes) * 100) : 0,
    }))
    .sort((a, b) => b.minutesWatched - a.minutesWatched)
    .slice(0, limit);
}

// ========================================
// Zeitliche Berechnungen
// ========================================

function calculateMonthlyBreakdown(events: ActivityEvent[]): MonthStats[] {
  const months: MonthStats[] = [];

  for (let month = 1; month <= 12; month++) {
    const monthEvents = events.filter((e) => e.month === month);
    const episodeEvents = monthEvents.filter((e) => e.type === 'episode_watch') as EpisodeWatchEvent[];
    const movieEvents = monthEvents.filter((e) => e.type === 'movie_watch' || e.type === 'movie_rating') as MovieWatchEvent[];

    months.push({
      month,
      monthName: MONTH_NAMES[month - 1],
      episodesWatched: episodeEvents.length,
      moviesWatched: movieEvents.length,
      minutesWatched:
        episodeEvents.reduce((sum, e) => sum + (e.episodeRuntime || 45), 0) +
        movieEvents.reduce((sum, e) => sum + (e.runtime || 120), 0),
    });
  }

  return months;
}

function findMostActiveMonth(breakdown: MonthStats[]): MonthStats {
  return breakdown.reduce((max, m) =>
    m.episodesWatched + m.moviesWatched > max.episodesWatched + max.moviesWatched ? m : max
  );
}

function findMostActiveDay(events: ActivityEvent[]): DayStats {
  const dayMap = new Map<string, { episodes: number; movies: number; minutes: number }>();

  for (const event of events) {
    const dateKey = event.timestamp.split('T')[0];
    const existing = dayMap.get(dateKey) || { episodes: 0, movies: 0, minutes: 0 };

    if (event.type === 'episode_watch') {
      existing.episodes++;
      existing.minutes += (event as EpisodeWatchEvent).episodeRuntime || 45;
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

function calculateFavoriteTimeOfDay(events: ActivityEvent[]): TimeOfDayStats {
  const counts: Record<string, number> = { morning: 0, afternoon: 0, evening: 0, night: 0 };
  const total = events.length;

  for (const event of events) {
    if (event.hour !== undefined) {
      const timeOfDay = getTimeOfDay(event.hour);
      counts[timeOfDay]++;
    }
  }

  const favorite = Object.entries(counts).reduce((max, [time, count]) =>
    count > max[1] ? [time, count] : max
  , ['evening', 0]);

  return {
    timeOfDay: favorite[0] as 'morning' | 'afternoon' | 'evening' | 'night',
    label: TIME_OF_DAY_LABELS[favorite[0]],
    count: favorite[1] as number,
    percentage: total > 0 ? Math.round((favorite[1] as number / total) * 100) : 0,
  };
}

function calculateFavoriteDayOfWeek(events: ActivityEvent[]): DayOfWeekStats {
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
// Binge-Berechnungen
// ========================================

function findLongestBingeSession(sessions: BingeSession[]): BingeSessionStats | null {
  if (sessions.length === 0) return null;

  const longest = sessions.reduce((max, s) =>
    s.episodes.length > max.episodes.length ? s : max
  );

  return {
    seriesId: longest.seriesId,
    seriesTitle: longest.seriesTitle,
    episodeCount: longest.episodes.length,
    totalMinutes: longest.totalMinutes,
    date: longest.startedAt.split('T')[0],
  };
}

// ========================================
// Geräte-Berechnungen
// ========================================

function calculateDeviceBreakdown(events: ActivityEvent[]): DeviceBreakdown {
  const counts = { mobile: 0, desktop: 0, tablet: 0 };
  const total = events.length;

  for (const event of events) {
    if (event.deviceType) {
      counts[event.deviceType]++;
    }
  }

  return {
    mobile: {
      count: counts.mobile,
      percentage: total > 0 ? Math.round((counts.mobile / total) * 100) : 0,
    },
    desktop: {
      count: counts.desktop,
      percentage: total > 0 ? Math.round((counts.desktop / total) * 100) : 0,
    },
    tablet: {
      count: counts.tablet,
      percentage: total > 0 ? Math.round((counts.tablet / total) * 100) : 0,
    },
  };
}

// ========================================
// Achievements
// ========================================

interface AchievementContext {
  totalEpisodes: number;
  totalMovies: number;
  totalMinutes: number;
  favoriteTimeOfDay: TimeOfDayStats;
  favoriteDayOfWeek: DayOfWeekStats;
  topGenres: TopGenreEntry[];
  longestStreak: number;
  yearBingeSessions: BingeSession[];
}

function calculateAchievements(ctx: AchievementContext): WrappedAchievement[] {
  const achievements: WrappedAchievement[] = [];

  for (const template of WRAPPED_ACHIEVEMENTS) {
    let unlocked = false;
    let value: string | number | undefined;

    switch (template.id) {
      case 'night_owl':
        unlocked = ctx.favoriteTimeOfDay.timeOfDay === 'night' && ctx.favoriteTimeOfDay.percentage >= 30;
        value = `${ctx.favoriteTimeOfDay.percentage}%`;
        break;

      case 'early_bird':
        unlocked = ctx.favoriteTimeOfDay.timeOfDay === 'morning' && ctx.favoriteTimeOfDay.percentage >= 30;
        value = `${ctx.favoriteTimeOfDay.percentage}%`;
        break;

      case 'binge_king':
        const maxBinge = ctx.yearBingeSessions.reduce(
          (max, s) => Math.max(max, s.episodes.length),
          0
        );
        unlocked = maxBinge >= 10;
        value = maxBinge;
        break;

      case 'movie_lover':
        unlocked = ctx.totalMovies >= 20;
        value = ctx.totalMovies;
        break;

      case 'series_addict':
        unlocked = ctx.totalEpisodes >= 500;
        value = ctx.totalEpisodes;
        break;

      case 'genre_explorer':
        unlocked = ctx.topGenres.length >= 5;
        value = ctx.topGenres.length;
        break;

      case 'weekend_warrior':
        const isWeekend = ctx.favoriteDayOfWeek.dayOfWeek === 0 || ctx.favoriteDayOfWeek.dayOfWeek === 6;
        unlocked = isWeekend && ctx.favoriteDayOfWeek.percentage >= 50;
        value = `${ctx.favoriteDayOfWeek.percentage}%`;
        break;

      case 'consistent':
        unlocked = ctx.longestStreak >= 30;
        value = ctx.longestStreak;
        break;

      case 'marathon_runner':
        const hours = Math.round(ctx.totalMinutes / 60);
        unlocked = hours >= 100;
        value = `${hours}h`;
        break;
    }

    achievements.push({ ...template, unlocked, value });
  }

  // Sortiere: Freigeschaltete zuerst
  return achievements.sort((a, b) => (b.unlocked ? 1 : 0) - (a.unlocked ? 1 : 0));
}

// ========================================
// Fun Facts
// ========================================

interface FunFactContext {
  totalMinutes: number;
  totalEpisodes: number;
  totalMovies: number;
  topSeries: TopSeriesEntry[];
  mostActiveMonth: MonthStats;
  favoriteTimeOfDay: TimeOfDayStats;
}

function generateFunFacts(ctx: FunFactContext): FunFact[] {
  const facts: FunFact[] = [];
  const hours = Math.round(ctx.totalMinutes / 60);
  const days = Math.round((ctx.totalMinutes / 60 / 24) * 10) / 10;

  // Zeit-Vergleiche
  facts.push({
    id: 'time_flights',
    text: `Mit ${hours} Stunden könntest du ${Math.round(hours / 12)} Mal nach New York fliegen ✈️`,
    icon: '✈️',
  });

  facts.push({
    id: 'time_sleep',
    text: `Das entspricht ${days} Tagen durchgehend schauen - ohne Schlaf!`,
    icon: '😴',
  });

  // Top Serie
  if (ctx.topSeries.length > 0) {
    const top = ctx.topSeries[0];
    facts.push({
      id: 'top_series',
      text: `"${top.title}" war dein Favorit mit ${top.episodesWatched} Episoden`,
      icon: '🏆',
    });
  }

  // Aktivster Monat
  facts.push({
    id: 'active_month',
    text: `Dein aktivster Monat war ${ctx.mostActiveMonth.monthName} mit ${ctx.mostActiveMonth.episodesWatched + ctx.mostActiveMonth.moviesWatched} Titeln`,
    icon: '📅',
  });

  // Tageszeit
  const timeEmoji = {
    morning: '🌅',
    afternoon: '☀️',
    evening: '🌆',
    night: '🌙',
  };
  facts.push({
    id: 'time_of_day',
    text: `Du schaust am liebsten ${ctx.favoriteTimeOfDay.label.toLowerCase()}`,
    icon: timeEmoji[ctx.favoriteTimeOfDay.timeOfDay],
  });

  return facts;
}

// ========================================
// First/Last Watch
// ========================================

function findFirstWatch(events: ActivityEvent[]): FirstLastWatch | null {
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

function findLastWatch(events: ActivityEvent[]): FirstLastWatch | null {
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

function calculateLateNightStats(events: ActivityEvent[]): LateNightStats {
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

function calculateHeatmapData(events: ActivityEvent[]): number[][] {
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

// ========================================
// Export
// ========================================

export default {
  calculateWrappedStats,
};
