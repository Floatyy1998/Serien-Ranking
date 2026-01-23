import { Movie } from '../../types/Movie';
import { Series } from '../../types/Series';

const addZeroes = (num: number) => num.toFixed(2);
const round = (num: number, precision: number) => {
  const factor = 1 / precision;
  return Math.round(num * factor) / factor;
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
    Object.entries(series.rating).forEach(([, value]) => {
      if (value > 0) {
        totalRating += value;
        genreCount += 1;
      }
    });

    if (genreCount === 0) return '0.00';
    
    const overallRating = totalRating / genreCount;
    const roundedRating = addZeroes(round(overallRating, 0.01));
    return roundedRating;
  } catch (error) {
    return '0.00';
  }
};
