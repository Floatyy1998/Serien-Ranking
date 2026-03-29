/**
 * Wrapped Rankings - Top-Listen Berechnungen (Serien, Filme, Genres, Provider)
 */

import type { EpisodeWatchEvent, MovieWatchEvent } from '../../types/WatchActivity';
import { DEFAULT_EPISODE_RUNTIME_MINUTES } from '../../lib/episode/seriesMetrics';
import type {
  TopSeriesEntry,
  TopMovieEntry,
  TopGenreEntry,
  TopProviderEntry,
} from '../../types/Wrapped';

export function calculateTopSeries(episodes: EpisodeWatchEvent[], limit = 5): TopSeriesEntry[] {
  const seriesMap = new Map<number, TopSeriesEntry>();

  for (const ep of episodes) {
    const existing = seriesMap.get(ep.seriesId) || {
      id: ep.seriesId,
      title: ep.seriesTitle,
      episodesWatched: 0,
      minutesWatched: 0,
    };
    existing.episodesWatched++;
    existing.minutesWatched += ep.episodeRuntime || DEFAULT_EPISODE_RUNTIME_MINUTES;
    seriesMap.set(ep.seriesId, existing);
  }

  return [...seriesMap.values()]
    .sort((a, b) => b.episodesWatched - a.episodesWatched)
    .slice(0, limit);
}

export function calculateTopMovies(movies: MovieWatchEvent[], limit = 5): TopMovieEntry[] {
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

export function calculateTopGenres(
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
      const validGenres = episode.genres.filter((g) => !ignoredGenres.has(g));
      if (validGenres.length === 0) continue;

      const minutesPerGenre =
        (episode.episodeRuntime || DEFAULT_EPISODE_RUNTIME_MINUTES) / validGenres.length;
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
      const validGenres = movie.genres.filter((g) => !ignoredGenres.has(g));
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

export function calculateTopProviders(
  episodes: EpisodeWatchEvent[],
  movies: MovieWatchEvent[],
  limit = 5
): TopProviderEntry[] {
  const providerMap = new Map<
    string,
    {
      episodeCount: number;
      movieCount: number;
      minutes: number;
    }
  >();

  let totalMinutes = 0;

  // Sammle Provider aus Episode-Events
  // Unterstützt sowohl das neue providers-Array als auch das alte provider-Feld
  // Jeder Provider bekommt die volle Watchzeit (nicht aufgeteilt)
  for (const episode of episodes) {
    const providers = [
      ...new Set<string>(episode.providers || (episode.provider ? [episode.provider] : [])),
    ];
    const runtime = episode.episodeRuntime || DEFAULT_EPISODE_RUNTIME_MINUTES;

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
    const providers = [
      ...new Set<string>(movie.providers || (movie.provider ? [movie.provider] : [])),
    ];
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
