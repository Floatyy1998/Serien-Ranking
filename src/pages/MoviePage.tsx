import React, { useCallback, useState } from 'react';
import { useAuth } from '../App';
import MovieSearchFilters from '../components/filters/MovieSearchFilters';
import ProfileLayout from '../components/layout/ProfileLayout';
import MovieGrid from '../components/movies/MovieGrid';
import { useMovieList } from '../contexts/MovieListProvider';
import { useSeriesList } from '../contexts/SeriesListProvider';
import { calculateOverallRating } from '../utils/rating';

export const MoviePage: React.FC = () => {
  const { user } = useAuth()!;
  const { movieList } = useMovieList();
  const { seriesList } = useSeriesList();
  const [searchValue, setSearchValue] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedProvider, setSelectedProvider] = useState('All');

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
  }, []);

  const handleGenreChange = useCallback((value: string) => {
    setSelectedGenre(value);
  }, []);

  const handleProviderChange = useCallback((value: string) => {
    setSelectedProvider(value);
  }, []);

  // Kombinierte Benutzer-Statistiken für Serien und Filme
  const stats = React.useMemo(() => {
    // Filme-Bewertungen
    const movieRatings = movieList
      .map((m) => {
        if (m.rating && typeof m.rating === 'object') {
          const ratings = Object.values(m.rating);
          return ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
            : 0;
        }
        return 0;
      })
      .filter((rating) => rating > 0);

    // Serien-Bewertungen
    const seriesRatings = seriesList
      .map((s) => parseFloat(calculateOverallRating(s)))
      .filter((rating) => rating > 0);

    // Kombinierte Bewertungen
    const allRatings = [...movieRatings, ...seriesRatings];
    const averageRating =
      allRatings.length > 0
        ? allRatings.reduce((sum, rating) => sum + rating, 0) /
          allRatings.length
        : 0;

    // Gesehene Episoden aus Serien
    const totalWatchedEpisodes = seriesList.reduce((total, series) => {
      if (series.seasons) {
        return (
          total +
          series.seasons.reduce((seasonTotal: number, season: any) => {
            return (
              seasonTotal +
              (season.episodes || []).filter((ep: any) => ep.watched).length
            );
          }, 0)
        );
      }
      return total;
    }, 0);

    return {
      seriesCount: seriesList.length,
      moviesCount: movieList.length,
      averageRating,
      totalWatchedEpisodes,
    };
  }, [movieList, seriesList]);

  const userProfile = React.useMemo(() => {
    if (!user) return undefined;
    return {
      username: user.displayName || user.email?.split('@')[0] || 'User',
      displayName: user.displayName || undefined,
      photoURL: user.photoURL || undefined,
      isOnline: true,
    };
  }, [user]);

  return (
    <ProfileLayout
      title='🎬 Meine Filme'
      subtitle='Entdecke, bewerte und verwalte deine Lieblingsfilme'
      userProfile={userProfile}
      stats={stats}
    >
      <div className='flex flex-col gap-4 items-start'>
        <MovieSearchFilters
          onSearchChange={handleSearchChange}
          onGenreChange={handleGenreChange}
          onProviderChange={handleProviderChange}
        />
        <MovieGrid
          searchValue={searchValue}
          selectedGenre={selectedGenre}
          selectedProvider={selectedProvider}
        />
      </div>
    </ProfileLayout>
  );
};

export default MoviePage;
