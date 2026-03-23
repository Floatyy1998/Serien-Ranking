/**
 * useStatsData - Business logic hook for StatsPage
 * Computes all viewing statistics from series and movie lists.
 */

import { useMemo } from 'react';
import { useAuth } from '../../AuthContext';
import { useMovieList } from '../../contexts/MovieListContext';
import { useSeriesList } from '../../contexts/SeriesListContext';
import { calculateOverallRating } from '../../lib/rating/rating';
import type { Movie as MovieType } from '../../types/Movie';
import type { Series } from '../../types/Series';
import { hasEpisodeAired } from '../../utils/episodeDate';
import { DEFAULT_EPISODE_RUNTIME_MINUTES } from '../../lib/episode/seriesMetrics';

export interface StatsData {
  totalSeries: number;
  watchedEpisodes: number;
  totalEpisodes: number;
  totalMovies: number;
  watchedMovies: number;
  totalMinutes: number;
  seriesMinutes: number;
  movieMinutes: number;
  avgSeriesRating: number;
  avgMovieRating: number;
  topGenres: { name: string; count: number }[];
  topProviders: { name: string; count: number }[];
  lastWeekWatched: number;
  completedSeries: number;
  progress: number;
}

const EMPTY_STATS: StatsData = {
  totalSeries: 0,
  watchedEpisodes: 0,
  totalEpisodes: 0,
  totalMovies: 0,
  watchedMovies: 0,
  totalMinutes: 0,
  seriesMinutes: 0,
  movieMinutes: 0,
  avgSeriesRating: 0,
  avgMovieRating: 0,
  topGenres: [],
  topProviders: [],
  lastWeekWatched: 0,
  completedSeries: 0,
  progress: 0,
};

export interface FormattedTime {
  value: string;
  unit: string;
  details: string;
  breakdown: { value: number; unit: string }[];
}

/** Format minutes into a primary display value with optional detailed breakdown */
export const formatTime = (minutes: number): FormattedTime => {
  const totalHours = Math.floor(minutes / 60);
  const totalDays = Math.floor(totalHours / 24);
  const totalMonths = Math.floor(totalDays / 30);
  const totalYears = Math.floor(totalMonths / 12);

  const breakdown: { value: number; unit: string }[] = [];
  let remaining = minutes;

  if (totalYears > 0) {
    breakdown.push({ value: totalYears, unit: totalYears === 1 ? 'Jahr' : 'Jahre' });
    remaining -= totalYears * 12 * 30 * 24 * 60;
  }

  const remainingMonths = Math.floor(remaining / (30 * 24 * 60));
  if (remainingMonths > 0) {
    breakdown.push({
      value: remainingMonths,
      unit: remainingMonths === 1 ? 'Monat' : 'Monate',
    });
    remaining -= remainingMonths * 30 * 24 * 60;
  }

  const remainingDays = Math.floor(remaining / (24 * 60));
  if (remainingDays > 0) {
    breakdown.push({ value: remainingDays, unit: remainingDays === 1 ? 'Tag' : 'Tage' });
    remaining -= remainingDays * 24 * 60;
  }

  const remainingHours = Math.floor(remaining / 60);
  if (remainingHours > 0 && totalDays < 30) {
    breakdown.push({
      value: remainingHours,
      unit: remainingHours === 1 ? 'Stunde' : 'Stunden',
    });
  }

  if (minutes < 60) {
    return { value: String(minutes), unit: 'Min', details: '', breakdown };
  }
  if (totalHours < 24) {
    return { value: String(totalHours), unit: 'Stunden', details: '', breakdown };
  }
  if (totalDays < 30) {
    const details = remainingHours > 0 ? `${remainingHours} Stunden` : '';
    return { value: String(totalDays), unit: 'Tage', details, breakdown };
  }
  if (totalMonths < 12) {
    const daysLeft = Math.floor((remaining + remainingMonths * 30 * 24 * 60) / (24 * 60)) % 30;
    const details = daysLeft > 0 ? `${daysLeft} Tage` : '';
    return { value: String(totalMonths), unit: 'Monate', details, breakdown };
  }

  const detailParts: string[] = [];
  if (remainingMonths > 0)
    detailParts.push(`${remainingMonths} ${remainingMonths === 1 ? 'Monat' : 'Monate'}`);
  if (remainingDays > 0)
    detailParts.push(`${remainingDays} ${remainingDays === 1 ? 'Tag' : 'Tage'}`);
  const details = detailParts.join(', ');

  return {
    value: String(totalYears),
    unit: totalYears === 1 ? 'Jahr' : 'Jahre',
    details,
    breakdown,
  };
};

/** Format minutes into a compact detailed string (e.g. "3d 5h") */
export const formatTimeDetailed = (minutes: number): string => {
  if (minutes < 60) return `${minutes} Min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours < 24) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  if (days < 30) return `${days}d ${remainingHours}h`;
  const months = Math.floor(days / 30);
  const remainingDays = days % 30;
  return `${months}M ${remainingDays}d`;
};

export const useStatsData = (): StatsData => {
  const { user } = useAuth() || {};
  const { seriesList, allSeriesList } = useSeriesList();
  const { movieList } = useMovieList();

  return useMemo(() => {
    if (!user?.uid) return EMPTY_STATS;

    const totalSeries = seriesList.filter((s) => s && s.nmr !== undefined && s.nmr !== null).length;

    // Progress: only non-hidden series, only started ones
    let watchedEpisodes = 0;
    let totalAiredEpisodes = 0;
    let completedSeries = 0;

    seriesList.forEach((series) => {
      if (!series || series.nmr === undefined || series.nmr === null) return;

      let seriesTotal = 0;
      let seriesWatched = 0;

      series.seasons?.forEach((season) => {
        season.episodes?.forEach((ep) => {
          const isWatched = !!(
            ep.firstWatchedAt ||
            ep.watched === true ||
            (ep.watched as unknown) === 1 ||
            (ep.watchCount && ep.watchCount > 0)
          );

          if (hasEpisodeAired(ep) || !ep.air_date) {
            seriesTotal++;
            if (isWatched) seriesWatched++;
          }
        });
      });

      if (seriesWatched > 0) {
        totalAiredEpisodes += seriesTotal;
        watchedEpisodes += seriesWatched;
      }

      if (seriesTotal > 0 && seriesTotal === seriesWatched) {
        completedSeries++;
      }
    });

    // Watch time: ALL series including hidden (you watched those episodes)
    let seriesMinutes = 0;
    allSeriesList.forEach((series) => {
      if (!series || series.nmr === undefined || series.nmr === null) return;
      const seriesRuntime = series.episodeRuntime || DEFAULT_EPISODE_RUNTIME_MINUTES;

      series.seasons?.forEach((season) => {
        season.episodes?.forEach((ep) => {
          const isWatched = !!(
            ep.firstWatchedAt ||
            ep.watched === true ||
            (ep.watched as unknown) === 1 ||
            (ep.watchCount && ep.watchCount > 0)
          );

          if (isWatched && (hasEpisodeAired(ep) || !ep.air_date)) {
            const count = ep.watchCount && ep.watchCount > 1 ? ep.watchCount : 1;
            seriesMinutes += (ep.runtime || seriesRuntime) * count;
          }
        });
      });
    });

    // Movies
    const totalMovies = movieList.filter((m) => m && m.nmr !== undefined && m.nmr !== null).length;
    let watchedMovies = 0;
    let movieMinutes = 0;

    movieList.forEach((movie: MovieType) => {
      if (!movie || movie.nmr === undefined || movie.nmr === null) return;
      const rating = parseFloat(calculateOverallRating(movie));
      if (!isNaN(rating) && rating > 0) {
        watchedMovies++;
        movieMinutes += movie.runtime || 120;
      }
    });

    // Ratings
    const seriesWithRating = seriesList.filter((s: Series) => {
      if (!s || s.nmr === undefined) return false;
      const rating = parseFloat(calculateOverallRating(s));
      return !isNaN(rating) && rating > 0;
    });

    const avgSeriesRating =
      seriesWithRating.length > 0
        ? seriesWithRating.reduce((acc, s) => acc + parseFloat(calculateOverallRating(s)), 0) /
          seriesWithRating.length
        : 0;

    const moviesWithRating = movieList.filter((m: MovieType) => {
      if (!m || m.nmr === undefined) return false;
      const rating = parseFloat(calculateOverallRating(m));
      return !isNaN(rating) && rating > 0;
    });

    const avgMovieRating =
      moviesWithRating.length > 0
        ? moviesWithRating.reduce((acc, m) => acc + parseFloat(calculateOverallRating(m)), 0) /
          moviesWithRating.length
        : 0;

    // Genres
    const genreCounts: Record<string, number> = {};
    ([...seriesList, ...movieList] as (Series | MovieType)[]).forEach(
      (item: Series | MovieType) => {
        if (!item || item.nmr === undefined) return;
        let genres: string[] = [];
        if (item.genre?.genres && Array.isArray(item.genre.genres)) {
          genres = item.genre.genres;
        } else if (item.genres && Array.isArray(item.genres)) {
          genres = item.genres.map((g: string | { id: number; name: string }) =>
            typeof g === 'string' ? g : g.name
          );
        }
        genres.forEach((genre: string) => {
          if (genre && genre.toLowerCase() !== 'all' && genre.toLowerCase() !== 'alle') {
            genreCounts[genre] = (genreCounts[genre] || 0) + 1;
          }
        });
      }
    );

    const topGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Providers
    const providerCounts: Record<string, number> = {};
    ([...seriesList, ...movieList] as (Series | MovieType)[]).forEach(
      (item: Series | MovieType) => {
        if (!item || item.nmr === undefined) return;
        if (item.provider?.provider && Array.isArray(item.provider.provider)) {
          item.provider.provider.forEach((p: { id: number; logo: string; name: string }) => {
            const name = p.name;
            if (name) providerCounts[name] = (providerCounts[name] || 0) + 1;
          });
        }
      }
    );

    const topProviders = Object.entries(providerCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Last week
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    let lastWeekWatched = 0;
    allSeriesList.forEach((series) => {
      series.seasons?.forEach((season) => {
        season.episodes?.forEach((ep) => {
          const dateStr = ep.lastWatchedAt || ep.firstWatchedAt;
          if (dateStr) {
            const watchDate = new Date(dateStr);
            if (!isNaN(watchDate.getTime()) && watchDate > oneWeekAgo) {
              lastWeekWatched++;
            }
          }
        });
      });
    });

    const progress = totalAiredEpisodes > 0 ? (watchedEpisodes / totalAiredEpisodes) * 100 : 0;

    return {
      totalSeries,
      watchedEpisodes,
      totalEpisodes: totalAiredEpisodes,
      totalMovies,
      watchedMovies,
      totalMinutes: seriesMinutes + movieMinutes,
      seriesMinutes,
      movieMinutes,
      avgSeriesRating,
      avgMovieRating,
      topGenres,
      topProviders,
      lastWeekWatched,
      completedSeries,
      progress,
    };
  }, [seriesList, allSeriesList, movieList, user]);
};
