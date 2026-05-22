// Web Worker for heavy statistics calculations
import { isEpisodeWatched, DEFAULT_EPISODE_RUNTIME_MINUTES } from '../lib/episode/seriesMetrics';
interface WorkerEpisode {
  air_date?: string;
  airstamp?: string;
  id: number;
  name?: string;
  watched: boolean | number | string;
  watchCount?: number;
  firstWatchedAt?: string;
  lastWatchedAt?: string;
  runtime?: number;
  episode_number?: number;
}

// TVMaze-Quirk inline (Worker baut als classic worker, keine zusaetzlichen Imports moeglich):
// Wenn airstamp lokal Mitternacht ist UND einen Tag nach air_date liegt, ist es ein
// "00:00 airtime"-Eintrag, der eigentlich am Vortag stattfindet.
function tvMazeMidnightQuirk(airstamp: string, airDateStr: string): Date | null {
  const stampDate = new Date(airstamp);
  if (isNaN(stampDate.getTime())) return null;
  if (stampDate.getHours() !== 0 || stampDate.getMinutes() !== 0) return null;
  const parts = airDateStr.split('-');
  if (parts.length !== 3) return null;
  const airDateLocal = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  if (isNaN(airDateLocal.getTime())) return null;
  const stampMidnightLocal = new Date(
    stampDate.getFullYear(),
    stampDate.getMonth(),
    stampDate.getDate()
  );
  if (stampMidnightLocal.getTime() - airDateLocal.getTime() !== 86_400_000) return null;
  return airDateLocal;
}

/** Parse episode date as local midnight, honoring the TVMaze midnight quirk. */
function parseEpisodeDateLocal(episode: WorkerEpisode): Date | null {
  if (episode.airstamp) {
    if (episode.air_date) {
      const corrected = tvMazeMidnightQuirk(episode.airstamp, episode.air_date);
      if (corrected) return corrected;
    }
    const d = new Date(episode.airstamp);
    if (!isNaN(d.getTime())) {
      d.setHours(0, 0, 0, 0);
      return d;
    }
  }
  if (episode.air_date) {
    const p = episode.air_date.split('-');
    const d = new Date(+p[0], +p[1] - 1, +p[2]);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

interface WorkerSeason {
  seasonNumber: number;
  season_number?: number;
  episodes?: WorkerEpisode[];
}

interface WorkerSeries {
  id: number;
  nmr?: number;
  title: string;
  watchlist?: boolean;
  hidden?: boolean;
  episodeRuntime?: number;
  seasons?: WorkerSeason[];
  poster?: string | { poster?: string };
  genre?: { genres?: string[] };
  provider?: { provider?: { id: number; name: string; logo: string }[] };
  production?: { production?: boolean };
}

interface WorkerMovie {
  id: number;
  nmr?: number;
  rating?: Record<string, number>;
}

interface WorkerProcessedEpisode {
  seriesId: number;
  seriesNmr: number | undefined;
  seriesTitle: string;
  poster: string;
  seasonNumber: number;
  episodeNumber: number;
  seasonIndex: number;
  episodeIndex: number;
  episodeId: number;
  episodeName: string | undefined;
  watched: boolean | number | string;
  seriesGenre: string[] | undefined;
  seriesProviders: string[] | undefined;
  runtime: number;
  providerLogo?: string;
  providerName?: string;
  chipType?: 'season-start' | 'mid-season-return' | 'season-finale' | 'season-break';
}

self.addEventListener('message', (event) => {
  const { type, data } = event.data;

  switch (type) {
    case 'CALCULATE_STATS': {
      const stats = calculateStats(data);
      self.postMessage({ type: 'STATS_RESULT', data: stats });
      break;
    }

    case 'PROCESS_EPISODES': {
      const episodes = processEpisodes(data);
      self.postMessage({ type: 'EPISODES_RESULT', data: episodes });
      break;
    }
  }
});

function calculateStats(data: {
  seriesList: WorkerSeries[];
  movieList: WorkerMovie[];
  userId: string;
}) {
  const { seriesList, movieList, userId } = data;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();

  let totalSeries = 0;
  let watchlistCount = 0;
  let watchedEpisodes = 0; // unique watched episodes (all series incl. hidden)
  let totalViews = 0; // sum of watchCounts — counts rewatches too (for mystery box etc.)
  let totalAiredEpisodes = 0; // non-hidden only (denominator for progress %)
  let watchedEpisodesVisible = 0; // non-hidden only (numerator for progress %)
  let todayTotalEpisodes = 0;

  // Process series in worker thread
  for (let i = 0; i < seriesList.length; i++) {
    const series = seriesList[i];
    // Allow nmr: 0 as valid
    if (!series || series.nmr === undefined || series.nmr === null) continue;

    totalSeries++;
    if (series.watchlist === true) watchlistCount++;

    const isHidden = series.hidden === true;
    const seasons = series.seasons;
    if (!seasons) continue;

    // Per-series counters — only add to progress if series has been started (>0 watched)
    let seriesWatchedVisible = 0;
    let seriesTotalVisible = 0;

    for (let j = 0; j < seasons.length; j++) {
      const season = seasons[j];
      const episodes = season.episodes;
      if (!episodes) continue;

      for (let k = 0; k < episodes.length; k++) {
        const episode = episodes[k];
        if (!episode) continue;

        const isWatched = isEpisodeWatched(episode);
        const viewCount = episode.watchCount || (isWatched ? 1 : 0);

        // watchedEpisodes und totalViews: immer zaehlen wenn gesehen,
        // unabhaengig vom Air-Date. Sonst werden early-watches (Netflix drops
        // vor offiziellem Air-Date) nicht gezaehlt. Der Aired-Check gilt nur
        // noch fuer watchedEpisodesVisible/todayTotalEpisodes wo er fachlich
        // Sinn macht.
        if (isWatched) watchedEpisodes++;
        totalViews += viewCount;

        if (episode.air_date || episode.airstamp) {
          const airDate = parseEpisodeDateLocal(episode);
          if (airDate) {
            const airDateTime = airDate.getTime();

            if (airDateTime <= todayTime && !isHidden) {
              seriesTotalVisible++;
              if (isWatched) seriesWatchedVisible++;
              if (airDateTime === todayTime) todayTotalEpisodes++;
            }
          }
        } else if (!isHidden) {
          // Kein Datum = alte Episode, immer als aired behandeln
          seriesTotalVisible++;
          if (isWatched) seriesWatchedVisible++;
        }
      }
    }

    // Only count in progress ring if at least 1 episode has been watched (serie begonnen)
    if (!isHidden && seriesWatchedVisible > 0) {
      totalAiredEpisodes += seriesTotalVisible;
      watchedEpisodesVisible += seriesWatchedVisible;
    }
  }

  // Process movies
  let totalMovies = 0;
  let watchedMovies = 0;

  for (let i = 0; i < movieList.length; i++) {
    const movie = movieList[i];
    // Allow nmr: 0 as valid
    if (!movie || movie.nmr === undefined || movie.nmr === null) continue;

    totalMovies++;

    if (movie.rating && userId) {
      const userRating = movie.rating[userId];
      if (userRating && userRating > 0) {
        watchedMovies++;
      }
    }
  }

  const progress =
    totalAiredEpisodes > 0 ? Math.round((watchedEpisodesVisible / totalAiredEpisodes) * 100) : 0;

  return {
    totalSeries,
    totalMovies,
    watchedEpisodes,
    watchedEpisodesActive: watchedEpisodesVisible,
    totalViews,
    totalEpisodes: totalAiredEpisodes,
    watchedMovies,
    watchlistCount,
    todayEpisodes: todayTotalEpisodes,
    progress,
  };
}

// Worker kann keine Module importieren - lokale Kopie noetig. Themed-Placeholder
// gibt's hier nicht (kein React-Context im Worker), Fallback bleibt der
// statische /placeholder.svg — die UI ersetzt das beim Render durch den
// themed Placeholder, wenn das Bild als <img src=> gerendert wird (404 oder
// onError, je nach Caller).
const getImageUrl = (posterObj: string | { poster?: string } | null | undefined): string => {
  if (!posterObj) return '/placeholder.svg';
  const path = typeof posterObj === 'object' ? posterObj.poster : posterObj;
  if (!path) return '/placeholder.svg';
  if (path.startsWith('http')) {
    if (path.endsWith('null') || path.endsWith('undefined')) return '/placeholder.svg';
    return path;
  }
  return `https://image.tmdb.org/t/p/w342${path}`;
};

/** Detect episode chip type inline (worker can't import modules) */
function detectChipType(
  episodes: WorkerEpisode[],
  idx: number,
  isInProduction: boolean
): WorkerProcessedEpisode['chipType'] {
  const ep = episodes[idx];
  if (!ep) return undefined;
  const airDate = parseEpisodeDateLocal(ep);
  if (!airDate) return undefined;

  if (idx === 0) return 'season-start';

  const prevDate = parseEpisodeDateLocal(episodes[idx - 1]);
  if (prevDate) {
    const gap = (airDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
    if (gap > 28) return 'mid-season-return'; // SEASON_BREAK_GAP_DAYS from lib/episode/constants
  }

  const isLast = idx === episodes.length - 1;
  if (isLast) {
    if (episodes.length >= 4 || !isInProduction) return 'season-finale';
  } else {
    const remaining = episodes.slice(idx + 1);
    const nextDate = parseEpisodeDateLocal(remaining[0]);
    if (nextDate) {
      const gap = (nextDate.getTime() - airDate.getTime()) / (1000 * 60 * 60 * 24);
      if (gap > 28) return 'season-break'; // SEASON_BREAK_GAP_DAYS from lib/episode/constants
    } else if (remaining.length > 1 && !remaining.some((e) => parseEpisodeDateLocal(e))) {
      return 'season-break';
    }
  }
  return undefined;
}

function processEpisodes(data: { seriesList: WorkerSeries[] }) {
  const { seriesList } = data;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();

  const episodes: WorkerProcessedEpisode[] = [];

  for (let i = 0; i < seriesList.length; i++) {
    const series = seriesList[i];
    const seasons = series.seasons;
    if (!seasons) continue;

    for (let j = 0; j < seasons.length; j++) {
      const season = seasons[j];
      const seasonEpisodes = season.episodes;
      if (!seasonEpisodes) continue;

      for (let k = 0; k < seasonEpisodes.length; k++) {
        const episode = seasonEpisodes[k];
        if (!episode || (!episode.air_date && !episode.airstamp) || episode.watched) continue;

        const episodeDate = parseEpisodeDateLocal(episode);
        if (!episodeDate) continue;

        if (episodeDate.getTime() === todayTime) {
          const actualSeasonIndex =
            series.seasons?.findIndex(
              (s: WorkerSeason) => s.seasonNumber === season.seasonNumber
            ) ?? 0;
          const seasonNum = (season.seasonNumber ?? 0) + 1;
          const epNum = k + 1;
          const isInProduction = series.production?.production !== false;
          episodes.push({
            seriesId: series.id,
            seriesNmr: series.nmr,
            seriesTitle: series.title,
            poster: getImageUrl(series.poster),
            seasonNumber: seasonNum,
            episodeNumber: epNum,
            seasonIndex: actualSeasonIndex,
            episodeIndex: k,
            episodeId: episode.id,
            episodeName: episode.name,
            watched: episode.watched,
            seriesGenre: series.genre?.genres,
            seriesProviders: series.provider?.provider?.map(
              (p: { id: number; name: string; logo: string }) => p.name
            ),
            runtime: episode.runtime || series.episodeRuntime || DEFAULT_EPISODE_RUNTIME_MINUTES,
            providerLogo: series.provider?.provider?.[0]?.logo,
            providerName: series.provider?.provider?.[0]?.name,
            chipType: detectChipType(seasonEpisodes, k, isInProduction),
          });
        }
      }
    }
  }

  return episodes;
}

export {};
