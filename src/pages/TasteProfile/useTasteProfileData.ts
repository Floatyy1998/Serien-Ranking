import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../AuthContext';
import { SUPPORTED_PROVIDERS } from '../../config/menuItems';
import { useSeriesList } from '../../contexts/SeriesListContext';
import { useMovieList } from '../../contexts/MovieListContext';
import { calculateOverallRating } from '../../lib/rating/rating';
import { calculateWatchJourney } from '../../services/watchJourneyService';
import { getWatchStreak } from '../../services/watchActivityService';
import type { WatchJourneyData } from '../../services/watchJourneyTypes';
import type { Series } from '../../types/Series';
import type { Movie } from '../../types/Movie';

const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL;
const TMDB_API_KEY = import.meta.env.VITE_API_TMDB;
const MIN_RATED_ITEMS = 5;

// ==================== Types ====================

export interface Recommendation {
  title: string;
  reason: string;
  matchGenres: string[];
  confidence: 'high' | 'medium';
  posterUrl?: string;
  providers?: { name: string; logo: string }[];
  tmdbId?: number;
  mediaType?: 'tv' | 'movie';
  overview?: string;
  rating?: number;
}

export interface TasteProfileResult {
  recommendations: Recommendation[];
  generatedAt: string;
}

export interface GenreStats {
  name: string;
  avgRating: number;
  count: number;
}

export interface TasteProfileStats {
  totalRatedSeries: number;
  totalRatedMovies: number;
  avgRating: number;
  topGenres: GenreStats[];
  topProviders: { name: string; count: number }[];
  topSeries: { title: string; rating: number; genres: string[] }[];
  topMovies: { title: string; rating: number; genres: string[] }[];
  lowestSeries: { title: string; rating: number; genres: string[] }[];
  originCountries: Record<string, number>;
  totalWatchtime: number;
  completedSeries: number;
  droppedSeries: number;
  rewatchedSeries: number;
  watchlistCount: number;
}

// ==================== Helpers ====================

function getRatedItems<T extends Series | Movie>(items: T[]): T[] {
  return items.filter((item) => {
    if (!item.rating || typeof item.rating !== 'object') return false;
    const overall = parseFloat(calculateOverallRating(item));
    return !isNaN(overall) && overall > 0;
  });
}

function getGenreStats(items: (Series | Movie)[]): GenreStats[] {
  const genreMap: Record<string, { total: number; count: number }> = {};

  const IGNORED_KEYS = ['all', 'gesamt', 'overall', 'total'];

  for (const item of items) {
    if (!item.rating || typeof item.rating !== 'object') continue;
    for (const [genre, value] of Object.entries(item.rating)) {
      if (typeof value !== 'number' || value <= 0) continue;
      if (IGNORED_KEYS.includes(genre.toLowerCase())) continue;
      if (!genreMap[genre]) genreMap[genre] = { total: 0, count: 0 };
      genreMap[genre].total += value;
      genreMap[genre].count += 1;
    }
  }

  return Object.entries(genreMap)
    .map(([name, { total, count }]) => ({
      name,
      avgRating: Math.round((total / count) * 100) / 100,
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

function getTopProviders(items: (Series | Movie)[]): { name: string; count: number }[] {
  const providerMap: Record<string, number> = {};

  for (const item of items) {
    const providers = item.provider?.provider;
    if (!providers) continue;
    for (const p of providers) {
      if (p.name) {
        providerMap[p.name] = (providerMap[p.name] || 0) + 1;
      }
    }
  }

  return Object.entries(providerMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function getOriginCountries(series: Series[]): Record<string, number> {
  const countryMap: Record<string, number> = {};
  for (const s of series) {
    if (s.origin_country) {
      for (const c of s.origin_country) {
        countryMap[c] = (countryMap[c] || 0) + 1;
      }
    }
  }
  return countryMap;
}

function getCompletedCount(series: Series[]): number {
  return series.filter((s) => {
    if (!s.seasons || s.seasons.length === 0) return false;
    return s.seasons.every((season) => season.episodes?.every((ep) => ep.watched));
  }).length;
}

function getDroppedCount(series: Series[]): number {
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  return series.filter((s) => {
    if (!s.seasons || s.seasons.length === 0) return false;
    // Hat ungeschaute Episoden und letzte Aktivität > 30 Tage
    const hasUnwatched = s.seasons.some((season) => season.episodes?.some((ep) => !ep.watched));
    if (!hasUnwatched) return false;
    const lastWatched = s.seasons
      .flatMap((season) => season.episodes || [])
      .filter((ep) => ep.lastWatchedAt)
      .map((ep) => new Date(ep.lastWatchedAt as string).getTime())
      .sort((a, b) => b - a)[0];
    return lastWatched && lastWatched < thirtyDaysAgo;
  }).length;
}

function getRewatchedCount(series: Series[]): number {
  return series.filter((s) => s.rewatch?.round && s.rewatch.round > 0).length;
}

/** Top Serien pro Genre (für die KI) */
function getTopSeriesPerGenre(
  series: Series[]
): Record<string, { title: string; rating: number }[]> {
  const genreMap: Record<string, { title: string; rating: number }[]> = {};

  for (const s of series) {
    const overall = parseFloat(calculateOverallRating(s));
    if (isNaN(overall) || overall <= 0) continue;
    const genres = s.genre?.genres || [];
    for (const genre of genres) {
      if (!genreMap[genre]) genreMap[genre] = [];
      genreMap[genre].push({ title: s.title, rating: overall });
    }
  }

  // Top 3 pro Genre
  for (const genre of Object.keys(genreMap)) {
    genreMap[genre] = genreMap[genre].sort((a, b) => b.rating - a.rating).slice(0, 3);
  }

  return genreMap;
}

/** Heatmap → Peak-Stunde und Lieblings-Tag als Text */
function analyzeHeatmap(heatmap: WatchJourneyData['heatmap']): {
  peakHourLabel: string;
  peakDayLabel: string;
  nightOwlPercent: number;
  weekendPercent: number;
} {
  const dayNames = [
    'Sonntag',
    'Montag',
    'Dienstag',
    'Mittwoch',
    'Donnerstag',
    'Freitag',
    'Samstag',
  ];
  const hourCounts: number[] = new Array(24).fill(0);
  const dayCounts: number[] = new Array(7).fill(0);
  let total = 0;

  for (const cell of heatmap) {
    hourCounts[cell.hour] += cell.count;
    dayCounts[cell.dayOfWeek] += cell.count;
    total += cell.count;
  }

  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
  const peakDay = dayCounts.indexOf(Math.max(...dayCounts));

  // Nacht-Eule: 22-6 Uhr
  const nightCount = hourCounts.filter((_, h) => h >= 22 || h < 6).reduce((a, b) => a + b, 0);
  const nightOwlPercent = total > 0 ? Math.round((nightCount / total) * 100) : 0;

  // Wochenende: Sa + So
  const weekendCount = (dayCounts[0] || 0) + (dayCounts[6] || 0);
  const weekendPercent = total > 0 ? Math.round((weekendCount / total) * 100) : 0;

  return {
    peakHourLabel: `${peakHour}:00 Uhr`,
    peakDayLabel: dayNames[peakDay] || 'Unbekannt',
    nightOwlPercent,
    weekendPercent,
  };
}

// ==================== TMDB Enrichment ====================

async function enrichRecsWithTMDB(recs: Recommendation[]): Promise<Recommendation[]> {
  if (!TMDB_API_KEY || recs.length === 0) return recs;

  return Promise.all(
    recs.map(async (rec) => {
      try {
        // Titel bereinigen: Klammerzusätze wie (Serie), (1980), (Staffel 1) entfernen
        const cleanTitle = rec.title
          .replace(/\s*\(.*?\)\s*/g, '')
          .replace(/\s*Staffel\s*\d+/i, '')
          .trim();

        // Suche nach Serie und Film parallel
        const [tvRes, movieRes] = await Promise.all([
          fetch(
            `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(cleanTitle)}&language=de-DE`
          ),
          fetch(
            `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(cleanTitle)}&language=de-DE`
          ),
        ]);

        const tvData = tvRes.ok ? await tvRes.json() : { results: [] };
        const movieData = movieRes.ok ? await movieRes.json() : { results: [] };

        // Bestes Ergebnis (TV bevorzugt, dann Movie)
        const tvHit = tvData.results?.[0];
        const movieHit = movieData.results?.[0];

        // Wähle den besseren Treffer (höhere Popularität)
        const isTv = tvHit && (!movieHit || (tvHit.popularity || 0) >= (movieHit.popularity || 0));
        const hit = isTv ? tvHit : movieHit;

        if (!hit) return rec;

        const mediaType = isTv ? 'tv' : 'movie';
        const tmdbId = hit.id;
        const posterUrl = hit.poster_path
          ? `https://image.tmdb.org/t/p/w200${hit.poster_path}`
          : undefined;
        const overview = hit.overview || undefined;
        const rating = hit.vote_average ? Math.round(hit.vote_average * 10) / 10 : undefined;

        // Provider holen
        let providers: { name: string; logo: string }[] = [];
        try {
          const provRes = await fetch(
            `https://api.themoviedb.org/3/${mediaType}/${tmdbId}/watch/providers?api_key=${TMDB_API_KEY}`
          );
          if (provRes.ok) {
            const provData = await provRes.json();
            const de = provData.results?.DE;
            const flatrate = de?.flatrate || [];
            providers = flatrate
              .filter((p: { provider_name: string }) => SUPPORTED_PROVIDERS.has(p.provider_name))
              .slice(0, 3)
              .map((p: { provider_name: string; logo_path: string }) => ({
                name: p.provider_name,
                logo: p.logo_path ? `https://image.tmdb.org/t/p/w45${p.logo_path}` : '',
              }));
          }
        } catch {
          // Provider optional
        }

        return {
          ...rec,
          title: cleanTitle || rec.title,
          posterUrl,
          providers,
          tmdbId,
          mediaType,
          overview,
          rating,
        };
      } catch {
        return rec;
      }
    })
  );
}

// ==================== Hook ====================

export const useTasteProfileData = () => {
  const { user } = useAuth() || {};
  const { allSeriesList } = useSeriesList();
  const { movieList } = useMovieList();

  const [result, setResult] = useState<TasteProfileResult | null>(() => {
    if (!user?.uid) return null;
    const cached = sessionStorage.getItem(`taste-profile-${user.uid}`);
    return cached ? JSON.parse(cached) : null;
  });
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [journeyData, setJourneyData] = useState<WatchJourneyData | null>(null);
  const [streakData, setStreakData] = useState<{ current: number; longest: number } | null>(null);

  // Load journey data on mount
  useEffect(() => {
    if (!user?.uid) return;
    const year = new Date().getFullYear();

    calculateWatchJourney(user.uid, year)
      .then(setJourneyData)
      .catch(() => {});

    getWatchStreak(user.uid, year)
      .then((streak) => {
        if (streak) {
          setStreakData({
            current: streak.currentStreak || 0,
            longest: streak.longestStreak || 0,
          });
        }
      })
      .catch(() => {});
  }, [user?.uid]);

  // Pre-compute stats from series/movie lists
  const stats: TasteProfileStats = useMemo(() => {
    const ratedSeries = getRatedItems(allSeriesList);
    const ratedMovies = getRatedItems(movieList);
    const allRated = [...ratedSeries, ...ratedMovies];

    const genreStats = getGenreStats(allRated);
    const topProviders = getTopProviders(allRated);
    const originCountries = getOriginCountries(ratedSeries);

    const ratings = allRated.map((i) => parseFloat(calculateOverallRating(i))).filter((r) => r > 0);
    const avgRating =
      ratings.length > 0
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 100) / 100
        : 0;

    const topSeries = ratedSeries
      .map((s) => ({
        title: s.title,
        rating: parseFloat(calculateOverallRating(s)),
        genres: s.genre?.genres || [],
      }))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 10);

    const lowestSeries = ratedSeries
      .map((s) => ({
        title: s.title,
        rating: parseFloat(calculateOverallRating(s)),
        genres: s.genre?.genres || [],
      }))
      .filter((s) => s.rating > 0)
      .sort((a, b) => a.rating - b.rating)
      .slice(0, 5);

    const topMovies = ratedMovies
      .map((m) => ({
        title: m.title,
        rating: parseFloat(calculateOverallRating(m)),
        genres: m.genre?.genres || [],
      }))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 10);

    const totalWatchtime = ratedSeries.reduce((sum, s) => sum + (s.watchtime || 0), 0);

    return {
      totalRatedSeries: ratedSeries.length,
      totalRatedMovies: ratedMovies.length,
      avgRating,
      topGenres: genreStats.slice(0, 10),
      topProviders,
      topSeries,
      topMovies,
      lowestSeries,
      originCountries,
      totalWatchtime,
      completedSeries: getCompletedCount(ratedSeries),
      droppedSeries: getDroppedCount(allSeriesList),
      rewatchedSeries: getRewatchedCount(allSeriesList),
      watchlistCount: allSeriesList.filter((s) => s.watchlist).length,
    };
  }, [allSeriesList, movieList]);

  const hasEnoughData = stats.totalRatedSeries + stats.totalRatedMovies >= MIN_RATED_ITEMS;

  const generateProfile = useCallback(async () => {
    if (!user?.uid || !BACKEND_URL || !hasEnoughData) return;

    setGenerating(true);
    setError(null);

    // Top Serien pro Genre berechnen
    const ratedSeries = getRatedItems(allSeriesList);
    const topSeriesPerGenre = getTopSeriesPerGenre(ratedSeries);

    // Journey-Daten aufbereiten
    const heatmapInsights = journeyData ? analyzeHeatmap(journeyData.heatmap) : null;

    try {
      const res = await fetch(`${BACKEND_URL}/ai/taste-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          tasteData: {
            // Basis-Daten
            genreRatings: Object.fromEntries(
              stats.topGenres.map((g) => [g.name, { avg: g.avgRating, count: g.count }])
            ),
            topSeries: stats.topSeries,
            topMovies: stats.topMovies,
            lowestRatedSeries: stats.lowestSeries,
            topSeriesPerGenre,
            totalSeries: stats.totalRatedSeries,
            totalMovies: stats.totalRatedMovies,
            completedSeries: stats.completedSeries,
            droppedSeries: stats.droppedSeries,
            rewatchedSeries: stats.rewatchedSeries,
            watchlistCount: stats.watchlistCount,
            avgRating: stats.avgRating,
            topProviders: stats.topProviders.map((p) => `${p.name} (${p.count})`),
            originCountries: stats.originCountries,
            totalWatchtime: stats.totalWatchtime,
            // Vollständige Titelliste damit KI keine bereits gesehenen empfiehlt
            allTitles: [...allSeriesList.map((s) => s.title), ...movieList.map((m) => m.title)],

            // Journey-Daten (Verhaltensmuster)
            ...(journeyData
              ? {
                  bingeStats: {
                    sessionCount: journeyData.bingeSessionCount,
                    totalEpisodes: journeyData.bingeEpisodeCount,
                    avgLength: journeyData.avgBingeLength,
                    longestBinge: journeyData.longestBinge,
                    mostBingedSeries: journeyData.mostBingedSeries?.title,
                  },
                  rewatchStats: {
                    count: journeyData.rewatchCount,
                    minutes: journeyData.rewatchMinutes,
                    percentage: journeyData.rewatchPercentage,
                  },
                  runtimePreference: {
                    avgEpisodeRuntime: journeyData.avgEpisodeRuntime,
                    shortestEpisode: journeyData.shortestEpisode,
                    longestEpisode: journeyData.longestEpisode,
                  },
                  watchPatterns: {
                    peakHour: heatmapInsights?.peakHourLabel,
                    peakDay: heatmapInsights?.peakDayLabel,
                    nightOwlPercent: heatmapInsights?.nightOwlPercent,
                    weekendPercent: heatmapInsights?.weekendPercent,
                  },
                  genreEvolution: journeyData.genreMonths
                    .filter((m) => m.total > 0)
                    .map((m) => {
                      const sorted = Object.entries(m.values).sort(([, a], [, b]) => b - a);
                      return {
                        month: m.monthName,
                        topGenre: sorted[0]?.[0] || '',
                        topMinutes: Math.round(sorted[0]?.[1] || 0),
                      };
                    }),
                  topWatchedSeries: journeyData.seriesStats
                    .sort((a, b) => b.episodes - a.episodes)
                    .slice(0, 10)
                    .map((s) => ({
                      title: s.title,
                      episodes: s.episodes,
                      minutes: s.minutes,
                      bingeEpisodes: s.bingeEpisodes,
                      genres: s.genres,
                    })),
                  yearTotals: {
                    episodes: journeyData.totalEpisodes,
                    movies: journeyData.totalMovies,
                    minutes: journeyData.totalMinutes,
                    uniqueSeries: journeyData.uniqueSeriesCount,
                  },
                }
              : {}),

            // Streak-Daten
            ...(streakData
              ? {
                  streaks: {
                    currentStreak: streakData.current,
                    longestStreak: streakData.longest,
                  },
                }
              : {}),
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();

        // Filtere Empfehlungen die der User bereits hat (fuzzy match)
        const normalize = (t: string) =>
          t
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // ō → o, é → e
            .replace(/\s*\(.*?\)\s*/g, '') // (2024), (Serie) etc.
            .replace(/[^a-z0-9 ]/g, '') // Sonderzeichen weg
            .trim();

        const ownedNormalized = new Set([
          ...allSeriesList.map((s) => normalize(s.title)),
          ...movieList.map((m) => normalize(m.title)),
        ]);

        const filteredRecs = ((data.recommendations || []) as Recommendation[]).filter(
          (rec) => !ownedNormalized.has(normalize(rec.title))
        );

        // TMDB-Daten holen (Poster, Provider, Rating)
        const enrichedRecs = await enrichRecsWithTMDB(filteredRecs);

        const profileResult: TasteProfileResult = {
          recommendations: enrichedRecs,
          generatedAt: new Date().toISOString(),
        };
        setResult(profileResult);
        setError(null);
        sessionStorage.setItem(`taste-profile-${user.uid}`, JSON.stringify(profileResult));
      } else if (res.status === 429) {
        const data = await res.json();
        setError(data.error || 'Zu viele Anfragen – bitte warte kurz.');
      } else {
        setError('Empfehlungen konnten nicht erstellt werden.');
      }
    } catch {
      setError('Empfehlungen konnten nicht erstellt werden.');
    } finally {
      setGenerating(false);
    }
  }, [user, hasEnoughData, stats, allSeriesList, movieList, journeyData, streakData]);

  const clearCache = useCallback(() => {
    if (!user?.uid) return;
    sessionStorage.removeItem(`taste-profile-${user.uid}`);
    setResult(null);
  }, [user]);

  return {
    stats,
    result,
    generating,
    error,
    hasEnoughData,
    generateProfile,
    clearCache,
  };
};
