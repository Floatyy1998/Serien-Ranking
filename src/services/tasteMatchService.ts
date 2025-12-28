/**
 * TasteMatchService - Berechnet Geschmacks-Match zwischen zwei Usern
 */

import firebase from 'firebase/compat/app';
import 'firebase/compat/database';

export interface TasteMatchResult {
  overallMatch: number; // 0-100
  seriesOverlap: {
    score: number;
    sharedSeries: SharedItem[];
    userOnlyCount: number;
    friendOnlyCount: number;
  };
  movieOverlap: {
    score: number;
    sharedMovies: SharedItem[];
    userOnlyCount: number;
    friendOnlyCount: number;
  };
  genreMatch: {
    score: number;
    sharedGenres: GenreComparison[];
    userTopGenres: string[];
    friendTopGenres: string[];
  };
  ratingMatch: {
    score: number;
    averageDifference: number;
    sameRatingCount: number;
  };
  providerMatch: {
    score: number;
    sharedProviders: string[];
  };
}

export interface SharedItem {
  id: number;
  title: string;
  poster?: string;
  userRating?: number;
  friendRating?: number;
  ratingDiff?: number;
}

export interface GenreComparison {
  genre: string;
  userPercentage: number;
  friendPercentage: number;
  match: number; // 0-100 wie nah die Prozente sind
}

interface UserData {
  series: SeriesItem[];
  movies: MovieItem[];
}

interface SeriesItem {
  id: number;
  title: string;
  poster?: string;
  rating?: Record<string, number>;
  genres: string[];
  providers: string[];
}

interface MovieItem {
  id: number;
  title: string;
  poster?: string;
  rating?: Record<string, number>;
  genres: string[];
  providers: string[];
}

/**
 * Lädt Serien und Filme eines Users
 */
async function loadUserData(userId: string): Promise<UserData> {
  const [seriesSnapshot, moviesSnapshot] = await Promise.all([
    firebase.database().ref(`${userId}/serien`).once('value'),
    firebase.database().ref(`${userId}/filme`).once('value'),
  ]);

  const seriesData = seriesSnapshot.val() || {};
  const moviesData = moviesSnapshot.val() || {};

  const series: SeriesItem[] = Object.values(seriesData).map((s: any) => ({
    id: s.id,
    title: s.title || s.original_name || 'Unknown',
    poster: s.poster?.poster,
    rating: s.rating,
    genres: s.genre?.genres || [],
    providers: s.provider?.provider?.map((p: any) => p.name) || [],
  }));

  const movies: MovieItem[] = Object.values(moviesData).map((m: any) => ({
    id: m.id,
    title: m.title || 'Unknown',
    poster: m.poster?.poster,
    rating: m.rating,
    genres: m.genre?.genres || [],
    providers: m.provider?.provider?.map((p: any) => p.name) || [],
  }));

  return { series, movies };
}

/**
 * Prüft ob ein Genre gültig ist (keine Platzhalter wie "All")
 */
function isValidGenre(genre: string): boolean {
  if (!genre || typeof genre !== 'string') return false;
  const invalid = ['all', 'alle', 'unknown', 'other', 'sonstige'];
  return !invalid.includes(genre.toLowerCase().trim());
}

/**
 * Berechnet Genre-Verteilung eines Users
 */
function calculateGenreDistribution(series: SeriesItem[], movies: MovieItem[]): Map<string, number> {
  const genreCounts = new Map<string, number>();
  let total = 0;

  // Serien zählen (gewichtet x2 weil mehr Zeitinvest)
  series.forEach((s) => {
    s.genres.filter(isValidGenre).forEach((genre) => {
      genreCounts.set(genre, (genreCounts.get(genre) || 0) + 2);
      total += 2;
    });
  });

  // Filme zählen
  movies.forEach((m) => {
    m.genres.filter(isValidGenre).forEach((genre) => {
      genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1);
      total += 1;
    });
  });

  // In Prozent umrechnen
  const distribution = new Map<string, number>();
  genreCounts.forEach((count, genre) => {
    distribution.set(genre, Math.round((count / total) * 100));
  });

  return distribution;
}

/**
 * Berechnet durchschnittliches Rating eines Items
 */
function getAverageRating(rating: Record<string, number> | undefined): number | undefined {
  if (!rating) return undefined;
  const values = Object.values(rating).filter((v) => typeof v === 'number' && v > 0);
  if (values.length === 0) return undefined;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Hauptfunktion: Berechnet Taste Match zwischen zwei Usern
 */
export async function calculateTasteMatch(
  userId: string,
  friendId: string
): Promise<TasteMatchResult> {
  // Daten laden
  const [userData, friendData] = await Promise.all([
    loadUserData(userId),
    loadUserData(friendId),
  ]);

  // 1. Serien-Overlap berechnen
  const userSeriesIds = new Set(userData.series.map((s) => s.id));
  const friendSeriesIds = new Set(friendData.series.map((s) => s.id));
  const sharedSeriesIds = [...userSeriesIds].filter((id) => friendSeriesIds.has(id));

  const sharedSeries: SharedItem[] = sharedSeriesIds.map((id) => {
    const userSeries = userData.series.find((s) => s.id === id)!;
    const friendSeries = friendData.series.find((s) => s.id === id)!;
    const userRating = getAverageRating(userSeries.rating);
    const friendRating = getAverageRating(friendSeries.rating);
    return {
      id,
      title: userSeries.title,
      poster: userSeries.poster,
      userRating,
      friendRating,
      ratingDiff: userRating && friendRating ? Math.abs(userRating - friendRating) : undefined,
    };
  });

  const totalUniqueSeries = new Set([...userSeriesIds, ...friendSeriesIds]).size;
  const seriesOverlapScore = totalUniqueSeries > 0
    ? Math.round((sharedSeriesIds.length / totalUniqueSeries) * 100)
    : 0;

  // 2. Film-Overlap berechnen
  const userMovieIds = new Set(userData.movies.map((m) => m.id));
  const friendMovieIds = new Set(friendData.movies.map((m) => m.id));
  const sharedMovieIds = [...userMovieIds].filter((id) => friendMovieIds.has(id));

  const sharedMovies: SharedItem[] = sharedMovieIds.map((id) => {
    const userMovie = userData.movies.find((m) => m.id === id)!;
    const friendMovie = friendData.movies.find((m) => m.id === id)!;
    const userRating = getAverageRating(userMovie.rating);
    const friendRating = getAverageRating(friendMovie.rating);
    return {
      id,
      title: userMovie.title,
      poster: userMovie.poster,
      userRating,
      friendRating,
      ratingDiff: userRating && friendRating ? Math.abs(userRating - friendRating) : undefined,
    };
  });

  const totalUniqueMovies = new Set([...userMovieIds, ...friendMovieIds]).size;
  const movieOverlapScore = totalUniqueMovies > 0
    ? Math.round((sharedMovieIds.length / totalUniqueMovies) * 100)
    : 0;

  // 3. Genre-Match berechnen
  const userGenres = calculateGenreDistribution(userData.series, userData.movies);
  const friendGenres = calculateGenreDistribution(friendData.series, friendData.movies);

  const allGenres = new Set([...userGenres.keys(), ...friendGenres.keys()]);
  const genreComparisons: GenreComparison[] = [...allGenres].map((genre) => {
    const userPct = userGenres.get(genre) || 0;
    const friendPct = friendGenres.get(genre) || 0;
    const maxDiff = 100;
    const diff = Math.abs(userPct - friendPct);
    const match = Math.round(100 - (diff / maxDiff) * 100);
    return { genre, userPercentage: userPct, friendPercentage: friendPct, match };
  });

  // Gewichteter Genre-Score (Genres mit höherer Nutzung haben mehr Gewicht)
  let genreScoreSum = 0;
  let genreWeightSum = 0;
  genreComparisons.forEach((gc) => {
    const weight = gc.userPercentage + gc.friendPercentage;
    genreScoreSum += gc.match * weight;
    genreWeightSum += weight;
  });
  const genreMatchScore = genreWeightSum > 0 ? Math.round(genreScoreSum / genreWeightSum) : 0;

  const userTopGenres = [...userGenres.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([genre]) => genre);

  const friendTopGenres = [...friendGenres.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([genre]) => genre);

  const sharedGenres = genreComparisons
    .filter((gc) => gc.userPercentage > 0 && gc.friendPercentage > 0)
    .sort((a, b) => (b.userPercentage + b.friendPercentage) - (a.userPercentage + a.friendPercentage));

  // 4. Rating-Match berechnen (für gemeinsame Items)
  const allSharedItems = [...sharedSeries, ...sharedMovies];
  const itemsWithBothRatings = allSharedItems.filter(
    (item) => item.userRating !== undefined && item.friendRating !== undefined
  );

  let ratingMatchScore = 50; // Default wenn keine Vergleiche möglich
  let averageRatingDiff = 0;
  let sameRatingCount = 0;

  if (itemsWithBothRatings.length > 0) {
    const totalDiff = itemsWithBothRatings.reduce((sum, item) => sum + (item.ratingDiff || 0), 0);
    averageRatingDiff = totalDiff / itemsWithBothRatings.length;
    // Max Diff ist 10 (Rating 0-10), Score ist umgekehrt proportional
    ratingMatchScore = Math.round(100 - (averageRatingDiff / 10) * 100);
    sameRatingCount = itemsWithBothRatings.filter((item) => (item.ratingDiff || 0) < 1).length;
  }

  // 5. Provider-Match berechnen
  const userProviders = new Set<string>();
  const friendProviders = new Set<string>();

  userData.series.forEach((s) => s.providers.forEach((p) => userProviders.add(p)));
  userData.movies.forEach((m) => m.providers.forEach((p) => userProviders.add(p)));
  friendData.series.forEach((s) => s.providers.forEach((p) => friendProviders.add(p)));
  friendData.movies.forEach((m) => m.providers.forEach((p) => friendProviders.add(p)));

  const sharedProviders = [...userProviders].filter((p) => friendProviders.has(p));
  const totalProviders = new Set([...userProviders, ...friendProviders]).size;
  const providerMatchScore = totalProviders > 0
    ? Math.round((sharedProviders.length / totalProviders) * 100)
    : 0;

  // 6. Overall Match berechnen (gewichteter Durchschnitt)
  const weights = {
    series: 25,
    movies: 15,
    genres: 35,
    ratings: 15,
    providers: 10,
  };

  const overallMatch = Math.round(
    (seriesOverlapScore * weights.series +
      movieOverlapScore * weights.movies +
      genreMatchScore * weights.genres +
      ratingMatchScore * weights.ratings +
      providerMatchScore * weights.providers) /
      (weights.series + weights.movies + weights.genres + weights.ratings + weights.providers)
  );

  return {
    overallMatch,
    seriesOverlap: {
      score: seriesOverlapScore,
      sharedSeries: sharedSeries.sort((a, b) => (b.userRating || 0) - (a.userRating || 0)),
      userOnlyCount: userSeriesIds.size - sharedSeriesIds.length,
      friendOnlyCount: friendSeriesIds.size - sharedSeriesIds.length,
    },
    movieOverlap: {
      score: movieOverlapScore,
      sharedMovies: sharedMovies.sort((a, b) => (b.userRating || 0) - (a.userRating || 0)),
      userOnlyCount: userMovieIds.size - sharedMovieIds.length,
      friendOnlyCount: friendMovieIds.size - sharedMovieIds.length,
    },
    genreMatch: {
      score: genreMatchScore,
      sharedGenres,
      userTopGenres,
      friendTopGenres,
    },
    ratingMatch: {
      score: ratingMatchScore,
      averageDifference: Math.round(averageRatingDiff * 10) / 10,
      sameRatingCount,
    },
    providerMatch: {
      score: providerMatchScore,
      sharedProviders,
    },
  };
}

export default { calculateTasteMatch };