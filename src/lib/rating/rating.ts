import { Movie } from '../../types/Movie';
import { Series } from '../../types/Series';

const addZeroes = (num: number) => num.toFixed(2);
const round = (num: number, precision: number) => {
  const factor = 1 / precision;
  return Math.round(num * factor) / factor;
};

// Vereinfachte Bewertungsberechnung nur für die Durchschnittsanzeige
export const calculateSimpleAverageRating = (items: (Series | Movie)[]) => {
  const allRatings: number[] = [];

  items.forEach((item) => {
    if (item.rating && typeof item.rating === 'object') {
      const ratings = Object.values(item.rating);
      if (ratings.length > 0) {
        const avgRating =
          ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
        allRatings.push(avgRating);
      }
    }
  });

  if (allRatings.length === 0) return 0;

  const average =
    allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length;
  return Math.round(average * 100) / 100; // Auf 2 Dezimalstellen runden
};

// Korrekte Durchschnittsbewertung basierend auf calculateOverallRating
export const calculateCorrectAverageRating = (items: (Series | Movie)[]) => {
  if (!items || items.length === 0) return 0;

  const validRatings: number[] = [];

  items.forEach((item) => {
    // Prüfe, ob das Item überhaupt Bewertungen hat
    if (!item.rating || typeof item.rating !== 'object') {
      return; // Überspringe Items ohne Bewertungen
    }

    const overallRating = calculateOverallRating(item);
    const numericRating = parseFloat(overallRating);

    // Nur Serien mit Overall Rating > 0 berücksichtigen
    if (!isNaN(numericRating) && numericRating > 0) {
      validRatings.push(numericRating);
    }
  });

  // Wenn keine bewerteten Serien vorhanden sind, gib 0 zurück
  if (validRatings.length === 0) return 0;

  // Durchschnitt berechnen: Summe aller Overall Ratings / Anzahl bewerteter Serien
  const totalRating = validRatings.reduce((sum, rating) => sum + rating, 0);
  const average = totalRating / validRatings.length;

  return Math.round(average * 100) / 100; // Auf 2 Dezimalstellen runden
};
export const calculateOverallRating = (item: Series | Movie) => {
  try {
    if (!item.rating || typeof item.rating !== 'object') {
      return '0.00';
    }

    // Check if this is a Movie (has runtime property) vs Series (has seasons)
    const isMovie = 'runtime' in item && !('seasons' in item);

    if (isMovie) {
      // For movies: rating[userId] contains the user's rating
      // We need to get the current user's rating
      // Since we don't have access to user context here, we'll take the first non-zero rating
      // or modify this to accept userId as parameter
      const ratings = Object.values(item.rating).filter(r => typeof r === 'number' && r > 0) as number[];
      if (ratings.length === 0) return '0.00';
      
      // For movies, just return the user's rating (there should only be one)
      const rating = ratings[0];
      return addZeroes(round(rating, 0.01));
    } else {
      // For series: rating contains genre ratings
      let totalRating = 0;
      let genreCount = 0;

      Object.entries(item.rating).forEach(([key, value]) => {
        if (typeof value === 'number' && value > 0) {
          totalRating += value;
          genreCount += 1;
        }
      });

      if (genreCount === 0) return '0.00';
      
      const overallRating = totalRating / genreCount;
      return addZeroes(round(overallRating, 0.01));
    }
  } catch (error) {
    console.error('Error in calculateOverallRating:', error);
    return '0.00';
  }
};

// Helper function to get user-specific movie rating
export const getMovieUserRating = (movie: Movie, userId: string): number => {
  if (!movie.rating || typeof movie.rating !== 'object') {
    return 0;
  }
  return movie.rating[userId] || 0;
};
