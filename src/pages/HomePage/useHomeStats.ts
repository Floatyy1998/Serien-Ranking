import { useMemo } from 'react';
import { formatMinutesToString } from '../../lib/date';
import { useAuth } from '../../App';
import { useMovieList } from '../../contexts/MovieListProvider';
import { useSeriesList } from '../../contexts/OptimizedSeriesListProvider';
import { calculateOverallRating } from '../../lib/rating/rating';
import type { Movie as MovieType } from '../../types/Movie';
import type { Series } from '../../types/Series';
import { isEpisodeWatched, DEFAULT_EPISODE_RUNTIME_MINUTES } from '../../lib/episode/seriesMetrics';
import { hasEpisodeAired } from '../../utils/episodeDate';
import { useWebWorkerStatsOptimized } from '../../hooks/useWebWorkerStatsOptimized';

export function useHomeStats() {
  const { user } = useAuth()!;
  const { seriesList, allSeriesList } = useSeriesList();
  const { movieList } = useMovieList();
  const workerStats = useWebWorkerStatsOptimized();

  // Calculate statistics
  const stats = useMemo(() => {
    if (!user?.uid) {
      return {
        totalSeries: 0,
        watchedEpisodes: 0,
        totalEpisodes: 0,
        totalMovies: 0,
        watchedMovies: 0,
        timeString: '0Min',
        totalHours: 0,
        seriesTimeString: '0Min',
        movieTimeString: '0Min',
        avgSeriesRating: '0.0',
        avgMovieRating: '0.0',
        topGenre: 'Keine',
        topProvider: 'Keine',
        lastWeekWatched: 0,
        completedSeries: 0,
      };
    }
    // Series stats - total series count includes hidden (you own them all)
    const totalSeries = allSeriesList.filter(
      (s) => s && s.nmr !== undefined && s.nmr !== null
    ).length;

    // Episode progress ring: vom Worker (non-hidden, mind. 1 Folge gesehen = begonnen)
    const watchedEpisodes = workerStats.watchedEpisodesActive;
    const totalEpisodes = workerStats.totalEpisodes;

    // Movies stats - only count valid movies with ratings
    // Allow nmr: 0 as valid
    const totalMovies = movieList.filter((m) => m && m.nmr !== undefined && m.nmr !== null).length;
    const watchedMovies = movieList.filter((movie: MovieType) => {
      // Allow nmr: 0 as valid
      if (!movie || movie.nmr === undefined || movie.nmr === null) return false;
      // A movie is watched if it has a rating > 0
      const rating = parseFloat(calculateOverallRating(movie));
      return !isNaN(rating) && rating > 0;
    }).length;

    // Time stats - all series including hidden (you did watch those episodes)
    let seriesMinutesWatched = 0;
    let moviesMinutesWatched = 0;

    // Series watch time
    allSeriesList.forEach((series) => {
      // Allow nmr: 0 as valid (only skip if undefined/null)
      if (!series || series.nmr === undefined || series.nmr === null) return;
      const seriesRuntime = series.episodeRuntime || DEFAULT_EPISODE_RUNTIME_MINUTES;

      series.seasons?.forEach((season) => {
        season.episodes?.forEach((ep) => {
          if (isEpisodeWatched(ep) && (hasEpisodeAired(ep) || !ep.air_date)) {
            const epRuntime = ep.runtime || seriesRuntime;
            const count = ep.watchCount && ep.watchCount > 1 ? ep.watchCount : 1;
            seriesMinutesWatched += epRuntime * count;
          }
        });
      });
    });

    // Movie watch time
    movieList.forEach((movie: MovieType) => {
      if (movie && movie.nmr !== undefined && movie.nmr !== null) {
        const rating = parseFloat(calculateOverallRating(movie));
        const isWatched = !isNaN(rating) && rating > 0;
        if (isWatched) {
          moviesMinutesWatched += movie.runtime || 120;
        }
      }
    });

    const totalMinutesWatched = seriesMinutesWatched + moviesMinutesWatched;

    const timeString = formatMinutesToString(totalMinutesWatched);

    // Format series and movie times separately
    const seriesTimeString = formatMinutesToString(seriesMinutesWatched);
    const movieTimeString = formatMinutesToString(moviesMinutesWatched);

    // Ratings - calculate average ratings using calculateOverallRating (same as MobileRatingsPage)
    const seriesWithRating = allSeriesList.filter((s: Series) => {
      if (!s || s.nmr === undefined || s.nmr === null) return false;
      const rating = parseFloat(calculateOverallRating(s));
      return !isNaN(rating) && rating > 0;
    });

    const avgSeriesRating =
      seriesWithRating.length > 0
        ? seriesWithRating.reduce((acc, s) => acc + parseFloat(calculateOverallRating(s)), 0) /
          seriesWithRating.length
        : 0;

    const moviesWithRating = movieList.filter((m: MovieType) => {
      if (!m || m.nmr === undefined || m.nmr === null) return false;
      const rating = parseFloat(calculateOverallRating(m));
      return !isNaN(rating) && rating > 0;
    });

    const avgMovieRating =
      moviesWithRating.length > 0
        ? moviesWithRating.reduce((acc, m) => acc + parseFloat(calculateOverallRating(m)), 0) /
          moviesWithRating.length
        : 0;

    // Genres - fix genre detection and exclude "All"
    const genreCounts: Record<string, number> = {};
    ([...allSeriesList, ...movieList] as (Series | MovieType)[]).forEach(
      (item: Series | MovieType) => {
        if (!item || item.nmr === undefined || item.nmr === null) return; // Only count valid items

        // Handle different genre structures
        let genres: string[] = [];

        if (item.genre?.genres && Array.isArray(item.genre.genres)) {
          genres = item.genre.genres;
        } else if (item.genres && Array.isArray(item.genres)) {
          genres = item.genres.map((g: string | { id: number; name: string }) =>
            typeof g === 'string' ? g : g.name
          );
        }

        genres.forEach((genre: string) => {
          // Exclude "All" and other invalid genres
          if (
            genre &&
            typeof genre === 'string' &&
            genre.toLowerCase() !== 'all' &&
            genre.toLowerCase() !== 'alle' &&
            genre.trim() !== ''
          ) {
            genreCounts[genre] = (genreCounts[genre] || 0) + 1;
          }
        });
      }
    );
    const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Keine';

    // Providers - fix provider detection with the correct data structure
    const providerCounts: Record<string, number> = {};
    ([...allSeriesList, ...movieList] as (Series | MovieType)[]).forEach(
      (item: Series | MovieType) => {
        if (!item || item.nmr === undefined || item.nmr === null) return; // Only count valid items

        // Check the actual provider structure used in the app
        let providers: { id: number; logo: string; name: string }[] = [];

        // Main provider structure: item.provider.provider[]
        if (item.provider?.provider && Array.isArray(item.provider.provider)) {
          providers = item.provider.provider;
        }

        providers.forEach((provider: { id: number; logo: string; name: string }) => {
          const name = provider.name;
          if (name && typeof name === 'string') {
            providerCounts[name] = (providerCounts[name] || 0) + 1;
          }
        });
      }
    );
    const topProvider =
      Object.entries(providerCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Keine';

    // Activity - fix date handling and add safety checks
    const lastWeekWatched = allSeriesList.reduce((acc, series) => {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      if (!series.seasons) return acc;

      return (
        acc +
        series.seasons.reduce((sAcc, season) => {
          if (!season.episodes) return sAcc;

          return (
            sAcc +
            season.episodes.filter((ep) => {
              if (!ep.firstWatchedAt && !ep.lastWatchedAt) return false;

              try {
                const dateStr = ep.lastWatchedAt || ep.firstWatchedAt;
                if (!dateStr) return false;
                const watchDate = new Date(dateStr);
                return !isNaN(watchDate.getTime()) && watchDate > oneWeekAgo;
              } catch {
                return false;
              }
            }).length
          );
        }, 0)
      );
    }, 0);

    return {
      totalSeries,
      watchedEpisodes,
      totalEpisodes,
      totalMovies,
      watchedMovies,
      timeString,
      totalHours: Math.round(totalMinutesWatched / 60),
      seriesTimeString,
      movieTimeString,
      avgSeriesRating: avgSeriesRating > 0 ? avgSeriesRating.toFixed(1) : '0.0',
      avgMovieRating: avgMovieRating > 0 ? avgMovieRating.toFixed(1) : '0.0',
      topGenre,
      topProvider,
      lastWeekWatched,
      completedSeries: allSeriesList.filter((s) => {
        if (!s || s.nmr === undefined || s.nmr === null || !s.seasons || s.seasons.length === 0)
          return false;

        // Only count aired episodes for completion
        let totalAired = 0;
        let watchedAired = 0;

        s.seasons.forEach((season) => {
          season.episodes?.forEach((ep) => {
            if (hasEpisodeAired(ep) || !ep.air_date) {
              totalAired++;
              if (ep.watched === true) {
                watchedAired++;
              }
            }
          });
        });

        return totalAired > 0 && totalAired === watchedAired;
      }).length,
    };
  }, [seriesList, allSeriesList, movieList, user]);

  return stats;
}
