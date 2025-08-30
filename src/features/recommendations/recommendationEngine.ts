import { Movie } from '../../types/Movie';
import { Series } from '../../types/Series';

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
  type: 'movies' | 'series',
  basedOnItems?: (Movie | Series)[] // Neu: Spezifische Items für Empfehlungen
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

  // Bestimme welche Items für Genre-Analyse verwendet werden sollen
  const itemsForAnalysis =
    basedOnItems && basedOnItems.length > 0
      ? basedOnItems
      : type === 'movies'
      ? userMovies
      : userSeries;

  const hasUserContent = itemsForAnalysis.length > 0;

  if (!hasUserContent) {
    // Keine Benutzerdaten - zeige Top Trending aus mehreren Regionen
    const endpoints = [
      type === 'movies'
        ? `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_API_KEY}&language=de-DE&region=DE&page=1`
        : `https://api.themoviedb.org/3/trending/tv/week?api_key=${TMDB_API_KEY}&language=de-DE&region=DE&page=1`,
      type === 'movies'
        ? `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_API_KEY}&language=en-US&region=US&page=1`
        : `https://api.themoviedb.org/3/trending/tv/week?api_key=${TMDB_API_KEY}&language=en-US&region=US&page=1`,
      // Zusätzlich: Top bewertete Inhalte für bessere Qualität
      type === 'movies'
        ? `https://api.themoviedb.org/3/movie/top_rated?api_key=${TMDB_API_KEY}&language=de-DE&region=DE&page=1`
        : `https://api.themoviedb.org/3/tv/top_rated?api_key=${TMDB_API_KEY}&language=de-DE&region=DE&page=1`,
    ];

    try {
      const responses = await Promise.all(
        endpoints.map((endpoint) => fetch(endpoint))
      );
      const dataArrays = await Promise.all(responses.map((res) => res.json()));

      const allResults = dataArrays.flatMap((data) => data.results || []);
      const uniqueResults = allResults.filter(
        (item: any, index: number, self: any[]) =>
          index === self.findIndex((t: any) => t.id === item.id)
      );
      const filteredResults = filterAlreadyAdded(uniqueResults);

      return {
        movies: type === 'movies' ? filteredResults.slice(0, 32) : [],
        series: type === 'series' ? filteredResults.slice(0, 32) : [],
        isPersonalized: false,
        loadingMessage: 'Lade Trending-Inhalte...',
      };
    } catch (error) {
      // console.error('Fehler beim Laden der Trending-Inhalte:', error);
      return {
        movies: [],
        series: [],
        isPersonalized: false,
        loadingMessage: 'Fehler beim Laden',
      };
    }
  }

  // Personalisierte Empfehlungen basierend auf spezifischen Items oder Benutzergenres
  const favoriteGenres = getUserGenres(itemsForAnalysis);

  try {
    // Wenn spezifische Items übergeben wurden, verwende ähnliche Inhalte-API
    if (basedOnItems && basedOnItems.length > 0) {
      const fetchPromises: Promise<any>[] = [];

      // Für jedes basedOnItem: Lade ähnliche Inhalte aus mehreren Regionen
      for (const item of basedOnItems.slice(0, 5)) {
        // Alle 5 zufälligen Items verwenden für maximale Vielfalt
        const mediaType = type === 'movies' ? 'movie' : 'tv';

        // Lade die besten Empfehlungen aus mehreren Quellen
        const endpoints = [
          `https://api.themoviedb.org/3/${mediaType}/${item.id}/recommendations?api_key=${TMDB_API_KEY}&language=de-DE&page=1`,
          `https://api.themoviedb.org/3/${mediaType}/${item.id}/recommendations?api_key=${TMDB_API_KEY}&language=en-US&page=1`,
          `https://api.themoviedb.org/3/${mediaType}/${item.id}/similar?api_key=${TMDB_API_KEY}&language=de-DE&page=1`,
          `https://api.themoviedb.org/3/${mediaType}/${item.id}/similar?api_key=${TMDB_API_KEY}&language=en-US&page=1`,
          // Zusätzlich Seite 2 für noch mehr hochwertige Empfehlungen
          `https://api.themoviedb.org/3/${mediaType}/${item.id}/recommendations?api_key=${TMDB_API_KEY}&language=de-DE&page=2`,
          `https://api.themoviedb.org/3/${mediaType}/${item.id}/recommendations?api_key=${TMDB_API_KEY}&language=en-US&page=2`,
          `https://api.themoviedb.org/3/${mediaType}/${item.id}/similar?api_key=${TMDB_API_KEY}&language=de-DE&page=2`,
          `https://api.themoviedb.org/3/${mediaType}/${item.id}/similar?api_key=${TMDB_API_KEY}&language=en-US&page=2`,
        ];

        // Sende alle Requests parallel aber fange 404 Fehler komplett ab
        const endpointPromises = endpoints.map(async (endpoint) => {
          try {
            const response = await fetch(endpoint);
            if (response.ok) {
              return await response.json();
            } else {
              // 404 ist normal für fehlende Seiten - nur bei anderen Fehlern loggen
              if (response.status !== 404) {
                // console.warn(`API ${response.status} für:`, endpoint);
              }
              return { results: [] };
            }
          } catch (error) {
            // console.warn('Fetch Fehler für:', endpoint, error);
            return { results: [] };
          }
        });

        fetchPromises.push(...endpointPromises);
      }

      const dataArrays = await Promise.all(fetchPromises);

      // Kombiniere alle Empfehlungen
      const allResults = dataArrays.flatMap((data) => data.results || []);
      const uniqueResults = allResults.filter(
        (item: any, index: number, self: any[]) =>
          index === self.findIndex((t: any) => t.id === item.id)
      );
      const filteredResults = filterAlreadyAdded(uniqueResults);
      const shuffled = filteredResults.sort(() => Math.random() - 0.5);

      return {
        movies: type === 'movies' ? shuffled.slice(0, 48) : [], // Noch mehr Empfehlungen durch mehr Quellen
        series: type === 'series' ? shuffled.slice(0, 48) : [],
        isPersonalized: true,
        loadingMessage: `Lade Empfehlungen basierend auf deiner Auswahl...`,
      };
    }

    // Fallback: Genre-basierte Empfehlungen für allgemeine Suche
    const promises: Promise<Response>[] = [];

    // 1. Primäre Empfehlungen basierend auf Genres mit mehreren Regionen
    if (favoriteGenres.length > 0) {
      const genreMap = getGenreMap(type);
      const topGenreId = Object.entries(genreMap).find(
        ([, name]) => name === favoriteGenres[0]
      )?.[0];

      if (topGenreId) {
        // DE und US Regionen für mehr Vielfalt + mehrere Seiten der besten Ergebnisse
        const genreEndpoints = [
          // Seite 1 - die absolut besten
          type === 'movies'
            ? `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&language=de-DE&region=DE&with_genres=${topGenreId}&sort_by=popularity.desc&page=1`
            : `https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&language=de-DE&region=DE&with_genres=${topGenreId}&sort_by=popularity.desc&page=1`,
          type === 'movies'
            ? `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&language=en-US&region=US&with_genres=${topGenreId}&sort_by=popularity.desc&page=1`
            : `https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&language=en-US&region=US&with_genres=${topGenreId}&sort_by=popularity.desc&page=1`,
          // Seite 2 - noch mehr hochwertige Optionen
          type === 'movies'
            ? `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&language=de-DE&region=DE&with_genres=${topGenreId}&sort_by=popularity.desc&page=2`
            : `https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&language=de-DE&region=DE&with_genres=${topGenreId}&sort_by=popularity.desc&page=2`,
          type === 'movies'
            ? `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&language=en-US&region=US&with_genres=${topGenreId}&sort_by=popularity.desc&page=2`
            : `https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&language=en-US&region=US&with_genres=${topGenreId}&sort_by=popularity.desc&page=2`,
          // Top bewertete in diesem Genre
          type === 'movies'
            ? `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&language=de-DE&region=DE&with_genres=${topGenreId}&sort_by=vote_average.desc&vote_count.gte=500&page=1`
            : `https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&language=de-DE&region=DE&with_genres=${topGenreId}&sort_by=vote_average.desc&vote_count.gte=100&page=1`,
          type === 'movies'
            ? `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&language=en-US&region=US&with_genres=${topGenreId}&sort_by=vote_average.desc&vote_count.gte=500&page=1`
            : `https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&language=en-US&region=US&with_genres=${topGenreId}&sort_by=vote_average.desc&vote_count.gte=100&page=1`,
        ];

        genreEndpoints.forEach((endpoint) => promises.push(fetch(endpoint)));
      }
    }

    // 2. Trending aus beiden Regionen + weitere hochwertige Quellen
    const trendingEndpoints = [
      // Trending diese Woche
      type === 'movies'
        ? `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_API_KEY}&language=de-DE&page=1`
        : `https://api.themoviedb.org/3/trending/tv/week?api_key=${TMDB_API_KEY}&language=de-DE&page=1`,
      type === 'movies'
        ? `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_API_KEY}&language=en-US&page=1`
        : `https://api.themoviedb.org/3/trending/tv/week?api_key=${TMDB_API_KEY}&language=en-US&page=1`,
      // Zusätzlich: Top bewertete für bessere Qualität
      type === 'movies'
        ? `https://api.themoviedb.org/3/movie/top_rated?api_key=${TMDB_API_KEY}&language=de-DE&page=1`
        : `https://api.themoviedb.org/3/tv/top_rated?api_key=${TMDB_API_KEY}&language=de-DE&page=1`,
      // Populäre Inhalte
      type === 'movies'
        ? `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=de-DE&page=1`
        : `https://api.themoviedb.org/3/tv/popular?api_key=${TMDB_API_KEY}&language=de-DE&page=1`,
    ];

    trendingEndpoints.forEach((endpoint) => promises.push(fetch(endpoint)));

    const responses = await Promise.all(promises);
    const dataArrays = await Promise.all(responses.map((res) => res.json()));

    // Kombiniere alle Ergebnisse aus verschiedenen Regionen
    const allResults = dataArrays.flatMap((data) => data.results || []);

    // Dedupliziere basierend auf ID
    const uniqueResults = allResults.filter(
      (item: any, index: number, self: any[]) =>
        index === self.findIndex((t: any) => t.id === item.id)
    );
    const filteredResults = filterAlreadyAdded(uniqueResults);

    // Leichte Randomisierung für Abwechslung bei wiederholten Aufrufen
    const shuffled = filteredResults.sort(() => Math.random() - 0.5);

    return {
      movies: type === 'movies' ? shuffled.slice(0, 32) : [], // Mehr Ergebnisse durch mehr Quellen
      series: type === 'series' ? shuffled.slice(0, 32) : [],
      isPersonalized: favoriteGenres.length > 0,
      loadingMessage:
        favoriteGenres.length > 0
          ? `Lade Empfehlungen für ${favoriteGenres[0]}...`
          : 'Lade Trending-Inhalte...',
    };
  } catch (error) {
    // console.error(
    //   'Fehler beim Laden der personalisierten Empfehlungen:',
    //   error
    // );

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
