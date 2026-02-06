import { useEffect, useMemo, useState } from 'react';
import { useSeriesList } from '../../contexts/OptimizedSeriesListProvider';
import { getTVDBIdFromTMDB, getTVDBSeasons } from '../../services/tvdbService';
import { Series } from '../../types/Series';
import type { TMDBSeason, TMDBEpisode, TMDBGenre, TMDBWatchProvider, SeriesSeason } from './types';

interface UseSeriesDataResult {
  series: Series | null;
  localSeries: Series | undefined;
  tmdbSeries: Series | null;
  isReadOnlyTmdbSeries: boolean;
  loading: boolean;
  tmdbBackdrop: string | null;
  providers: TMDBWatchProvider[] | null;
  tmdbRating: { vote_average: number; vote_count: number } | null;
  imdbRating: { rating: number; votes: string } | null;
  tmdbFirstAirDate: string | null;
}

export const useSeriesData = (id: string | undefined): UseSeriesDataResult => {
  const { seriesList } = useSeriesList();

  const [tmdbSeries, setTmdbSeries] = useState<Series | null>(null);
  const [loading, setLoading] = useState(false);
  const [tmdbBackdrop, setTmdbBackdrop] = useState<string | null>(null);
  const [providers, setProviders] = useState<TMDBWatchProvider[] | null>(null);
  const [tmdbRating, setTmdbRating] = useState<{ vote_average: number; vote_count: number } | null>(
    null
  );
  const [imdbRating, setImdbRating] = useState<{ rating: number; votes: string } | null>(null);
  const [tmdbFirstAirDate, setTmdbFirstAirDate] = useState<string | null>(null);

  // Find the series locally first
  const localSeries = useMemo(() => {
    return seriesList.find((s: Series) => s.id.toString() === id);
  }, [seriesList, id]);

  // Fetch from TMDB - always for backdrop and full data if not found locally
  useEffect(() => {
    const apiKey = import.meta.env.VITE_API_TMDB;

    // ALWAYS fetch backdrop and providers from TMDB
    if (id && apiKey) {
      // Fetch backdrop and TMDB rating
      fetch(`https://api.themoviedb.org/3/tv/${id}?api_key=${apiKey}&language=de-DE`)
        .then((res) => res.json())
        .then((data) => {
          if (data.backdrop_path) {
            setTmdbBackdrop(data.backdrop_path);
          }
          // Store TMDB rating data
          if (data.vote_average && data.vote_count) {
            setTmdbRating({
              vote_average: data.vote_average,
              vote_count: data.vote_count,
            });
          }
          // Store first_air_date
          if (data.first_air_date) {
            setTmdbFirstAirDate(data.first_air_date);
          }
        })
        .catch(() => {
          // Handle error silently
        });

      // Fetch providers
      fetch(`https://api.themoviedb.org/3/tv/${id}/watch/providers?api_key=${apiKey}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.results?.DE?.flatrate) {
            setProviders(data.results.DE.flatrate);
          }
        })
        .catch(() => {
          // Handle error silently
        });
    }

    // Full fetch if not found locally
    if (!localSeries && id && apiKey && !tmdbSeries) {
      setLoading(true);
      fetch(
        `https://api.themoviedb.org/3/tv/${id}?api_key=${apiKey}&language=de-DE&append_to_response=credits,external_ids`
      )
        .then((res) => res.json())
        .then(async (data) => {
          if (data.id) {
            // Get TVDB ID and fetch episodes from TVDB (TVDB already filters out Season 0)
            let seasonsWithEpisodes: SeriesSeason[] = [];
            try {
              const tvdbId = await getTVDBIdFromTMDB(Number(id));
              if (tvdbId) {
                const tvdbSeasons = await getTVDBSeasons(tvdbId);
                seasonsWithEpisodes = tvdbSeasons.map((season) => ({
                  seasonNumber: season.seasonNumber - 1, // Convert to 0-based to match local data format
                  episodes: season.episodes.map((ep) => ({
                    id: ep.id,
                    name: ep.name || '',
                    episode_number: ep.number,
                    air_date: ep.aired || '',
                    watched: false,
                    watchCount: 0,
                  })),
                }));
              }
            } catch (error) {
              console.error('Error fetching TVDB data:', error);
            }

            // Fallback to TMDB if TVDB fails
            if (seasonsWithEpisodes.length === 0) {
              const regularSeasons = (data.seasons || []).filter((s: TMDBSeason) => s.season_number > 0);
              seasonsWithEpisodes = await Promise.all(
                regularSeasons.map(async (season: TMDBSeason) => {
                  try {
                    const seasonResponse = await fetch(
                      `https://api.themoviedb.org/3/tv/${id}/season/${season.season_number}?api_key=${apiKey}&language=de-DE`
                    );
                    const seasonData = await seasonResponse.json();

                    return {
                      seasonNumber: season.season_number - 1,
                      episodes:
                        seasonData.episodes?.map((ep: TMDBEpisode) => ({
                          id: ep.id,
                          name: ep.name,
                          episode_number: ep.episode_number,
                          air_date: ep.air_date || '',
                          watched: false,
                          watchCount: 0,
                        })) || [],
                    };
                  } catch (error) {
                    return {
                      seasonNumber: season.season_number - 1,
                      episodes: [],
                    };
                  }
                })
              );
            }

            // Transform TMDB data to match our Series type
            const series: Series = {
              id: data.id,
              nmr: 0, // No nmr for non-user series
              title: data.name,
              name: data.name,
              poster: { poster: data.poster_path },
              genre: { genres: data.genres?.map((g: TMDBGenre) => g.name) || [] },
              provider: { provider: [] },
              seasons: seasonsWithEpisodes,
              first_air_date: data.first_air_date,
              status: data.status,
              rating: {},
              watchlist: false,
              overview: data.overview,
              backdrop: data.backdrop_path,
              // Required fields with defaults
              begründung: '',
              beschreibung: data.overview || '',
              episodeCount: 0,
              episodeRuntime: 0,
              imdb: { imdb_id: data.external_ids?.imdb_id || '' },
              nextEpisode: {
                episode: 0,
                nextEpisode: '',
                nextEpisodes: [],
                season: 0,
              },
              origin_country: data.origin_country || [],
              original_language: data.original_language || '',
              original_name: data.original_name || data.name || '',
              popularity: data.popularity || 0,
              vote_average: data.vote_average || 0,
              vote_count: data.vote_count || 0,
              seasonCount: seasonsWithEpisodes.length || 0,
              tvMaze: { tvMazeID: 0 },
              watchtime: 0,
              wo: { wo: '' },
              release_date: data.first_air_date || '',
            };
            setTmdbSeries(series);
          }
        })
        .catch((_err) => {})
        .finally(() => setLoading(false));
    }
  }, [localSeries, id, tmdbSeries]); // Remove loading dependency, add tmdbSeries to prevent re-fetching

  // Use local series if available, otherwise use TMDB series
  const series = localSeries || tmdbSeries;

  // Fetch IMDB rating from OMDb API
  useEffect(() => {
    const omdbKey = import.meta.env.VITE_API_OMDb;
    const imdbId = series?.imdb?.imdb_id || localSeries?.imdb?.imdb_id;

    if (imdbId && omdbKey) {
      fetch(`https://www.omdbapi.com/?i=${imdbId}&apikey=${omdbKey}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.imdbRating && data.imdbRating !== 'N/A') {
            setImdbRating({
              rating: parseFloat(data.imdbRating),
              votes: data.imdbVotes || '0',
            });
          }
        })
        .catch(() => {
          // Handle error silently
        });
    }
  }, [series, localSeries]);

  // Check if this is a TMDB-only series (not in user's list)
  const isReadOnlyTmdbSeries = !localSeries && !!tmdbSeries;

  return {
    series: series || null,
    localSeries,
    tmdbSeries,
    isReadOnlyTmdbSeries,
    loading,
    tmdbBackdrop,
    providers,
    tmdbRating,
    imdbRating,
    tmdbFirstAirDate,
  };
};
