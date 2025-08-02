import { Movie } from '../interfaces/Movie';
import { Series } from '../interfaces/Series';

export interface RecommendationResult {
  movies: any[];
  series: any[];
  isPersonalized: boolean;
  loadingMessage: string;
}

// Genre-Mapping von TMDB IDs zu Namen für Empfehlungen
const getGenreMap = (type: 'movies' | 'series') => {
  const MOVIE_GENRES: { [key: number]: string } = {
    28: 'Action',
    12: 'Adventure',
    16: 'Animation',
    35: 'Comedy',
    80: 'Crime',
    99: 'Documentary',
    18: 'Drama',
    10751: 'Family',
    14: 'Fantasy',
    36: 'History',
    27: 'Horror',
    10402: 'Music',
    9648: 'Mystery',
    10749: 'Romance',
    878: 'Science Fiction',
    10770: 'TV Movie',
    53: 'Thriller',
    10752: 'War',
    37: 'Western',
  };

  const TV_GENRES: { [key: number]: string } = {
    10759: 'Action & Adventure',
    16: 'Animation',
    35: 'Comedy',
    80: 'Crime',
    99: 'Documentary',
    18: 'Drama',
    10751: 'Family',
    10762: 'Kids',
    9648: 'Mystery',
    10763: 'News',
    10764: 'Reality',
    10765: 'Sci-Fi & Fantasy',
    10766: 'Soap',
    10767: 'Talk',
    10768: 'War & Politics',
    37: 'Western',
  };

  return type === 'movies' ? MOVIE_GENRES : TV_GENRES;
};

export const generateRecommendations = async (
  userMovies: Movie[],
  userSeries: Series[],
  type: 'movies' | 'series'
): Promise<RecommendationResult> => {
  const TMDB_API_KEY = import.meta.env.VITE_API_TMDB;

  // Erstelle Sets mit bereits hinzugefügten IDs zum Filtern
  const addedMovieIds = new Set(userMovies.map((movie) => movie.id));
  const addedSeriesIds = new Set(userSeries.map((series) => series.id));

  // Filter-Funktion für TMDB-Ergebnisse
  const filterAlreadyAdded = (items: any[]) => {
    if (type === 'movies') {
      return items.filter((item) => !addedMovieIds.has(item.id));
    } else {
      return items.filter((item) => !addedSeriesIds.has(item.id));
    }
  };

  // Bestimme häufigste Genres aus der Benutzerliste
  const getUserGenres = (items: (Movie | Series)[]) => {
    const genreCounts: { [key: string]: number } = {};

    items.forEach((item) => {
      if (item.genre && item.genre.genres) {
        item.genre.genres.forEach((genre: string) => {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        });
      }
    });

    // Sortiere nach Häufigkeit und nimm die Top 3
    return Object.entries(genreCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([genre]) => genre);
  };

  const userList = type === 'movies' ? userMovies : userSeries;
  const hasUserContent = userList.length > 0;

  if (!hasUserContent) {
    // Keine Benutzerdaten - zeige zufällige Trending-Seite
    const randomPage = Math.floor(Math.random() * 5) + 1; // Seite 1-5
    const endpoint =
      type === 'movies'
        ? `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_API_KEY}&language=de-DE&page=${randomPage}`
        : `https://api.themoviedb.org/3/trending/tv/week?api_key=${TMDB_API_KEY}&language=de-DE&page=${randomPage}`;

    try {
      const response = await fetch(endpoint);
      const data = await response.json();

      return {
        movies: type === 'movies' ? filterAlreadyAdded(data.results || []) : [],
        series: type === 'series' ? filterAlreadyAdded(data.results || []) : [],
        isPersonalized: false,
        loadingMessage: 'Lade Trending-Inhalte...',
      };
    } catch (error) {
      console.error('Fehler beim Laden der Trending-Inhalte:', error);
      return {
        movies: [],
        series: [],
        isPersonalized: false,
        loadingMessage: 'Fehler beim Laden',
      };
    }
  }

  // Personalisierte Empfehlungen basierend auf Benutzergenres
  const favoriteGenres = getUserGenres(userList);

  try {
    // Lade verschiedene Kategorien basierend auf Benutzervorlieben
    const promises = [];

    // 1. Genre-basierte Empfehlungen
    if (favoriteGenres.length > 0) {
      const genreMap = getGenreMap(type);
      const genreIds = favoriteGenres
        .map(
          (genre) =>
            Object.entries(genreMap).find(([, name]) => name === genre)?.[0]
        )
        .filter(Boolean)
        .slice(0, 2); // Top 2 Genres

      if (genreIds.length > 0) {
        const genreQuery = genreIds.join(',');
        const genreEndpoint =
          type === 'movies'
            ? `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&language=de-DE&with_genres=${genreQuery}&sort_by=popularity.desc&page=1`
            : `https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&language=de-DE&with_genres=${genreQuery}&sort_by=popularity.desc&page=1`;

        promises.push(fetch(genreEndpoint));
      }
    }

    // 2. Hochbewertete Inhalte in bevorzugten Genres
    if (favoriteGenres.length > 0) {
      const genreMap = getGenreMap(type);
      const topGenreId = Object.entries(genreMap).find(
        ([, name]) => name === favoriteGenres[0]
      )?.[0];
      if (topGenreId) {
        const topRatedEndpoint =
          type === 'movies'
            ? `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&language=de-DE&with_genres=${topGenreId}&sort_by=vote_average.desc&vote_count.gte=100&page=1`
            : `https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&language=de-DE&with_genres=${topGenreId}&sort_by=vote_average.desc&vote_count.gte=50&page=1`;

        promises.push(fetch(topRatedEndpoint));
      }
    }

    // 3. Fallback: Trending dieser Woche
    const trendingEndpoint =
      type === 'movies'
        ? `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_API_KEY}&language=de-DE&page=1`
        : `https://api.themoviedb.org/3/trending/tv/week?api_key=${TMDB_API_KEY}&language=de-DE&page=1`;

    promises.push(fetch(trendingEndpoint));

    const responses = await Promise.all(promises);
    const dataArrays = await Promise.all(responses.map((res) => res.json()));

    // Kombiniere und dedupliziere Ergebnisse
    const allResults = dataArrays.flatMap((data) => data.results || []);
    const uniqueResults = allResults.filter(
      (item, index, self) => index === self.findIndex((t) => t.id === item.id)
    );

    // Filtere bereits hinzugefügte Inhalte und mische für Vielfalt
    const filteredResults = filterAlreadyAdded(uniqueResults);
    const shuffled = filteredResults.sort(() => Math.random() - 0.5);

    return {
      movies: type === 'movies' ? shuffled.slice(0, 12) : [],
      series: type === 'series' ? shuffled.slice(0, 12) : [],
      isPersonalized: true,
      loadingMessage: `Lade personalisierte Empfehlungen basierend auf deinen ${favoriteGenres
        .slice(0, 2)
        .join(' & ')} Vorlieben...`,
    };
  } catch (error) {
    console.error(
      'Fehler beim Laden der personalisierten Empfehlungen:',
      error
    );

    // Fallback zu Trending
    const fallbackEndpoint =
      type === 'movies'
        ? `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_API_KEY}&language=de-DE&page=1`
        : `https://api.themoviedb.org/3/trending/tv/week?api_key=${TMDB_API_KEY}&language=de-DE&page=1`;

    try {
      const response = await fetch(fallbackEndpoint);
      const data = await response.json();

      return {
        movies: type === 'movies' ? filterAlreadyAdded(data.results || []) : [],
        series: type === 'series' ? filterAlreadyAdded(data.results || []) : [],
        isPersonalized: false,
        loadingMessage: 'Lade Trending-Inhalte...',
      };
    } catch (fallbackError) {
      return {
        movies: [],
        series: [],
        isPersonalized: false,
        loadingMessage: 'Fehler beim Laden',
      };
    }
  }
};
