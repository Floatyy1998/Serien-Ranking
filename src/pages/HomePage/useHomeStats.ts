import { useMemo } from 'react';
import { formatMinutesToString } from '../../lib/date';
import { useAuth } from '../../contexts/AuthContext';
import { isSupportedProvider } from '../../config/menuItems';
import { useMovieList } from '../../contexts/MovieListContext';
import { useSeriesList } from '../../contexts/SeriesListContext';
import { calculateOverallRating, isMovieWatched } from '../../lib/rating/rating';
import type { Movie as MovieType } from '../../types/Movie';
import type { Series } from '../../types/Series';
import { isEpisodeWatched, DEFAULT_EPISODE_RUNTIME_MINUTES } from '../../lib/episode/seriesMetrics';
import { hasEpisodeAired } from '../../utils/episodeDate';
import { useWebWorkerStatsOptimized } from '../../hooks/useWebWorkerStatsOptimized';

export function useHomeStats() {
  const { user } = useAuth() || {};
  const { allSeriesList } = useSeriesList();
  const { movieList } = useMovieList();
  const workerStats = useWebWorkerStatsOptimized();

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
    // total series count includes hidden (you own them all)
    const totalSeries = allSeriesList.length;

    // Episode progress ring: vom Worker (non-hidden, mind. 1 Folge gesehen = begonnen)
    const watchedEpisodes = workerStats.watchedEpisodesActive;
    const totalEpisodes = workerStats.totalEpisodes;

    // Movies stats — gesehen = explizit als watched markiert (F1) ODER Rating > 0.
    const totalMovies = movieList.length;
    const watchedMovies = movieList.filter((movie: MovieType) => isMovieWatched(movie)).length;

    // Time stats - all series including hidden (you did watch those episodes)
    let seriesMinutesWatched = 0;
    let moviesMinutesWatched = 0;

    allSeriesList.forEach((series) => {
      if (!series) return;
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

    movieList.forEach((movie: MovieType) => {
      if (!movie) return;
      if (isMovieWatched(movie)) {
        moviesMinutesWatched += movie.runtime || 120;
      }
    });

    const totalMinutesWatched = seriesMinutesWatched + moviesMinutesWatched;

    const timeString = formatMinutesToString(totalMinutesWatched);

    const seriesTimeString = formatMinutesToString(seriesMinutesWatched);
    const movieTimeString = formatMinutesToString(moviesMinutesWatched);

    // Gleiche Rating-Berechnung wie MobileRatingsPage (calculateOverallRating).
    const seriesWithRating = allSeriesList.filter((s: Series) => {
      if (!s) return false;
      const rating = parseFloat(calculateOverallRating(s));
      return !isNaN(rating) && rating > 0;
    });

    const avgSeriesRating =
      seriesWithRating.length > 0
        ? seriesWithRating.reduce((acc, s) => acc + parseFloat(calculateOverallRating(s)), 0) /
          seriesWithRating.length
        : 0;

    const moviesWithRating = movieList.filter((m: MovieType) => {
      if (!m) return false;
      const rating = parseFloat(calculateOverallRating(m));
      return !isNaN(rating) && rating > 0;
    });

    const avgMovieRating =
      moviesWithRating.length > 0
        ? moviesWithRating.reduce((acc, m) => acc + parseFloat(calculateOverallRating(m)), 0) /
          moviesWithRating.length
        : 0;

    const genreCounts: Record<string, number> = {};
    ([...allSeriesList, ...movieList] as (Series | MovieType)[]).forEach(
      (item: Series | MovieType) => {
        if (!item) return;

        // Genre hat mehrere Shapes (Wrapper vs. raw TMDB)
        let genres: string[] = [];

        if (item.genre?.genres && Array.isArray(item.genre.genres)) {
          genres = item.genre.genres;
        } else if (item.genres && Array.isArray(item.genres)) {
          genres = item.genres.map((g: string | { id: number; name: string }) =>
            typeof g === 'string' ? g : g.name
          );
        }

        genres.forEach((genre: string) => {
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

    const providerCounts: Record<string, number> = {};
    ([...allSeriesList, ...movieList] as (Series | MovieType)[]).forEach(
      (item: Series | MovieType) => {
        if (!item) return;

        let providers: { id: number; logo: string; name: string }[] = [];

        if (item.provider?.provider && Array.isArray(item.provider.provider)) {
          providers = item.provider.provider;
        }

        providers.forEach((provider: { id: number; logo: string; name: string }) => {
          const name = provider.name;
          if (name && typeof name === 'string' && isSupportedProvider(name)) {
            providerCounts[name] = (providerCounts[name] || 0) + 1;
          }
        });
      }
    );
    const topProvider =
      Object.entries(providerCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Keine';

    // Date.now() ist in useMemo() durch die Deps stabilisiert (laeuft nur bei Daten-Change neu),
    // wird aber von der purity-Rule trotzdem geflaggt — pragmatisch disabled.
    // eslint-disable-next-line react-hooks/purity
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const lastWeekWatched = allSeriesList.reduce((acc, series) => {
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
        if (!s || !s.seasons || s.seasons.length === 0) return false;

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
  }, [
    allSeriesList,
    movieList,
    user,
    workerStats.totalEpisodes,
    workerStats.watchedEpisodesActive,
  ]);

  return stats;
}
