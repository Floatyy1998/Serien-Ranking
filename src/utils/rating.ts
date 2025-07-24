import { Movie } from '../interfaces/Movie';
import { Series } from '../interfaces/Series';

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

// Funktion um IMDB-Rating zu holen und Genres entsprechend vorzubelegen
export const calculateGenreRatingsFromIMDB = (
  imdbRating: number,
  itemGenres: string[]
): { [key: string]: number } => {
  const genreRatings: { [key: string]: number } = {};

  if (!itemGenres || itemGenres.length === 0) {
    return genreRatings;
  }

  const targetRating = Math.max(1, Math.min(10, imdbRating)); // Begrenzen auf 1-10

  // Erstelle eine Verteilung mit leichten Variationen
  // Aber so dass der Durchschnitt das Ziel-Rating ergibt
  const variations = itemGenres.map((_, index) => {
    // Kleine zufällige Variation zwischen -0.3 und +0.3
    // Aber deterministisch basierend auf Genre-Index für Konsistenz
    const seed = index * 0.2; // Deterministischer "Zufall"
    const variation = Math.sin(seed) * 0.3; // -0.3 bis +0.3
    return variation;
  });

  // Berechne den Durchschnitt der Variationen
  const avgVariation =
    variations.reduce((sum, v) => sum + v, 0) / variations.length;

  // Adjustiere die Variationen so dass ihr Durchschnitt 0 ist
  const adjustedVariations = variations.map((v) => v - avgVariation);

  // Weise die Bewertungen zu
  itemGenres.forEach((genre, index) => {
    const ratingWithVariation = targetRating + adjustedVariations[index];
    // Begrenzen auf sinnvolle Werte und auf 2 Dezimalstellen runden
    const finalRating = Math.max(1, Math.min(10, ratingWithVariation));
    genreRatings[genre] = Math.round(finalRating * 100) / 100;
  });

  return genreRatings;
};

// Erweiterte Funktion für komplexere Verteilung (optional)
export const calculateGenreRatingsFromIMDBAdvanced = (
  imdbRating: number,
  itemGenres: string[],
  allGenres: string[]
): { [key: string]: number } => {
  const genreRatings: { [key: string]: number } = {};

  if (!itemGenres || itemGenres.length === 0) {
    return genreRatings;
  }

  const targetRating = Math.max(1, Math.min(10, imdbRating));

  // Hauptgenres (die, die der Serie/Film hat) bekommen die volle Bewertung
  itemGenres.forEach((genre) => {
    genreRatings[genre] = Math.round(targetRating * 100) / 100;
  });

  // Andere Genres bekommen eine niedrigere Bewertung (optional)
  const otherGenres = allGenres.filter(
    (genre) => !itemGenres.includes(genre) && genre !== 'All'
  );
  const lowerRating = Math.max(1, targetRating - 2); // 2 Punkte niedriger

  otherGenres.forEach((genre) => {
    genreRatings[genre] = Math.round(lowerRating * 100) / 100;
  });

  return genreRatings;
};

// Funktion um IMDB-Rating von TMDB zu holen
export const fetchIMDBRating = async (
  tmdbId: number,
  mediaType: 'movie' | 'tv'
): Promise<number | null> => {
  try {
    const apiKey = import.meta.env.VITE_API_TMDB;
    if (!apiKey) {
      console.warn('TMDB API Key nicht gefunden');
      return null;
    }

    const response = await fetch(
      `https://api.themoviedb.org/3/${mediaType}/${tmdbId}?api_key=${apiKey}&language=de-DE`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // TMDB vote_average ist 0-10, genau wie unsere Skala
    return data.vote_average ? Math.round(data.vote_average * 100) / 100 : null;
  } catch (error) {
    console.error('Fehler beim Laden der TMDB-Bewertung:', error);
    return null;
  }
};
