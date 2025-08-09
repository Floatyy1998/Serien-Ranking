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
export const calculateOverallRating = (series: Series | Movie) => {
  let totalRating = 0;
  let genreCount = 0;

  try {
    Object.entries(series.rating).forEach(([key, value]) => {
      if (series.genre.genres.includes(key)) {
        totalRating += value;
        genreCount += 1;
      } else {
        totalRating += value * 0.002;
        genreCount += 0.002;
      }
    });

    const overallRating = totalRating / genreCount;
    const roundedRating = addZeroes(round(overallRating, 0.01));
    return roundedRating;
  } catch (error) {
    const roundedRating = addZeroes(round(totalRating / genreCount, 0.01));
    return roundedRating;
  }
};
