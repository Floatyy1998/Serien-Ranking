import { Series } from '../interfaces/Series';

const addZeroes = (num: number) => num.toFixed(2);

const round = (num: number, precision: number) => {
  const factor = 1 / precision;
  return Math.round(num * factor) / factor;
};

export const calculateOverallRating = (series: Series) => {
  let totalRating = 0;
  let genreCount = 0;

  try {
    Object.entries(series.rating).forEach(([key, value]) => {
      if (series.genre.genres.includes(key)) {
        totalRating += value; // Genres that the series has count normally
        genreCount += 1;
      } else {
        totalRating += value * 0.002; // Other genres give an even more minimal bonus
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
