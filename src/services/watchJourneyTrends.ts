import { calculateWatchJourney } from './watchJourneyService';
import type { MultiYearTrendsData, YearlyTrendData } from './watchJourneyTypes';
import { getColor, GENRE_COLORS, PROVIDER_COLORS } from './watchJourneyTypes';

// ============================================================================
// MULTI-YEAR TRENDS CALCULATION
// ============================================================================

export async function calculateMultiYearTrends(
  userId: string,
  years: number[]
): Promise<MultiYearTrendsData> {
  // Fetch data for all years in parallel
  const yearDataPromises = years.map((year) => calculateWatchJourney(userId, year));
  const allYearData = await Promise.all(yearDataPromises);

  // Process each year
  const yearlyData: YearlyTrendData[] = allYearData.map((data) => {
    // Calculate genre distribution (hours)
    const genreDistribution: Record<string, number> = {};
    data.genreMonths.forEach((month) => {
      Object.entries(month.values).forEach(([genre, mins]) => {
        genreDistribution[genre] = (genreDistribution[genre] || 0) + mins / 60;
      });
    });

    // Calculate provider distribution (hours)
    const providerDistribution: Record<string, number> = {};
    data.providerMonths.forEach((month) => {
      Object.entries(month.values).forEach(([provider, mins]) => {
        providerDistribution[provider] = (providerDistribution[provider] || 0) + mins / 60;
      });
    });

    // Find top genre
    const topGenre =
      Object.entries(genreDistribution)
        .filter(([genre]) => genre !== 'Andere')
        .sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

    // Find top provider
    const topProvider =
      Object.entries(providerDistribution)
        .filter(([provider]) => provider !== 'Andere')
        .sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

    return {
      year: data.year,
      episodes: data.totalEpisodes,
      movies: data.totalMovies,
      totalMinutes: data.totalMinutes,
      totalHours: Math.round(data.totalMinutes / 60),
      topGenre,
      topProvider,
      genreDistribution,
      providerDistribution,
    };
  });

  // Sort by year
  yearlyData.sort((a, b) => a.year - b.year);

  // Aggregate all-time top genres
  const allGenres: Record<string, number> = {};
  yearlyData.forEach((yd) => {
    Object.entries(yd.genreDistribution).forEach(([genre, hours]) => {
      if (genre !== 'Andere') {
        allGenres[genre] = (allGenres[genre] || 0) + hours;
      }
    });
  });
  const allTimeTopGenres = Object.entries(allGenres)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([genre, hours], i) => ({
      genre,
      hours: Math.round(hours),
      color: getColor(genre, GENRE_COLORS, i),
    }));

  // Aggregate all-time top providers
  const allProviders: Record<string, number> = {};
  yearlyData.forEach((yd) => {
    Object.entries(yd.providerDistribution).forEach(([provider, hours]) => {
      if (provider !== 'Andere') {
        allProviders[provider] = (allProviders[provider] || 0) + hours;
      }
    });
  });
  const allTimeTopProviders = Object.entries(allProviders)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([provider, hours], i) => ({
      provider,
      hours: Math.round(hours),
      color: getColor(provider, PROVIDER_COLORS, i),
    }));

  // Calculate trends (compare last two years if available)
  let episodesTrend: 'up' | 'down' | 'stable' = 'stable';
  let hoursTrend: 'up' | 'down' | 'stable' = 'stable';

  if (yearlyData.length >= 2) {
    const lastYear = yearlyData[yearlyData.length - 1];
    const prevYear = yearlyData[yearlyData.length - 2];

    if (lastYear.episodes > prevYear.episodes * 1.1) episodesTrend = 'up';
    else if (lastYear.episodes < prevYear.episodes * 0.9) episodesTrend = 'down';

    if (lastYear.totalHours > prevYear.totalHours * 1.1) hoursTrend = 'up';
    else if (lastYear.totalHours < prevYear.totalHours * 0.9) hoursTrend = 'down';
  }

  // Totals
  const totalEpisodes = yearlyData.reduce((sum, yd) => sum + yd.episodes, 0);
  const totalMovies = yearlyData.reduce((sum, yd) => sum + yd.movies, 0);
  const totalHours = yearlyData.reduce((sum, yd) => sum + yd.totalHours, 0);

  return {
    years: yearlyData.map((yd) => yd.year),
    yearlyData,
    allTimeTopGenres,
    allTimeTopProviders,
    episodesTrend,
    hoursTrend,
    totalEpisodes,
    totalMovies,
    totalHours,
  };
}
