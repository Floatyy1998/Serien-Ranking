// Web Worker for heavy statistics calculations
// Workers can't import modules, so define local interfaces
interface WorkerEpisode {
  air_date?: string;
  id: number;
  name?: string;
  watched: boolean | number | string;
  watchCount?: number;
  firstWatchedAt?: string;
  lastWatchedAt?: string;
  runtime?: number;
  episode_number?: number;
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
  episodeRuntime?: number;
  seasons?: WorkerSeason[];
  poster?: string | { poster?: string };
  genre?: { genres?: string[] };
  provider?: { provider?: { id: number; name: string; logo: string }[] };
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
}

self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'CALCULATE_STATS':
      const stats = calculateStats(data);
      self.postMessage({ type: 'STATS_RESULT', data: stats });
      break;
      
    case 'PROCESS_EPISODES':
      const episodes = processEpisodes(data);
      self.postMessage({ type: 'EPISODES_RESULT', data: episodes });
      break;
  }
});

function calculateStats(data: { seriesList: WorkerSeries[]; movieList: WorkerMovie[]; userId: string }) {
  const { seriesList, movieList, userId } = data;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();
  
  let totalSeries = 0;
  let watchlistCount = 0;
  let watchedEpisodes = 0;
  let totalAiredEpisodes = 0;
  let todayTotalEpisodes = 0;
  
  // Process series in worker thread
  for (let i = 0; i < seriesList.length; i++) {
    const series = seriesList[i];
    // Allow nmr: 0 as valid
    if (!series || (series.nmr === undefined || series.nmr === null)) continue;
    
    totalSeries++;
    if (series.watchlist === true) watchlistCount++;
    
    const seasons = series.seasons;
    if (!seasons) continue;
    
    for (let j = 0; j < seasons.length; j++) {
      const season = seasons[j];
      const episodes = season.episodes;
      if (!episodes) continue;
      
      for (let k = 0; k < episodes.length; k++) {
        const episode = episodes[k];
        if (!episode) continue;

        // Episode is watched if it has firstWatchedAt OR watched: true OR watchCount > 0
        const isWatched = !!(
          episode.firstWatchedAt ||
          episode.watched === true ||
          (episode.watched as unknown) === 1 ||
          (episode.watched as unknown) === 'true' ||
          (episode.watchCount && episode.watchCount > 0)
        );
        
        if (episode.air_date) {
          const airDate = new Date(episode.air_date);
          if (!isNaN(airDate.getTime())) {
            airDate.setHours(0, 0, 0, 0);
            const airDateTime = airDate.getTime();
            
            if (airDateTime <= todayTime) {
              totalAiredEpisodes++;
              if (isWatched) {
                watchedEpisodes++;
              }
              
              if (airDateTime === todayTime) {
                todayTotalEpisodes++;
              }
            }
          }
        } else {
          // No air_date means it's probably an old episode that's already aired
          totalAiredEpisodes++;
          if (isWatched) {
            watchedEpisodes++;
          }
        }
      }
    }
  }
  
  // Process movies
  let totalMovies = 0;
  let watchedMovies = 0;
  
  for (let i = 0; i < movieList.length; i++) {
    const movie = movieList[i];
    // Allow nmr: 0 as valid
    if (!movie || (movie.nmr === undefined || movie.nmr === null)) continue;
    
    totalMovies++;
    
    if (movie.rating && userId) {
      const userRating = movie.rating[userId];
      if (userRating && userRating > 0) {
        watchedMovies++;
      }
    }
  }
  
  const progress = totalAiredEpisodes > 0 
    ? Math.round((watchedEpisodes / totalAiredEpisodes) * 100)
    : 0;
  
  return {
    totalSeries,
    totalMovies,
    watchedEpisodes,
    totalEpisodes: totalAiredEpisodes,
    watchedMovies,
    watchlistCount,
    todayEpisodes: todayTotalEpisodes,
    progress,
  };
}

// Worker kann keine Module importieren - lokale Kopie nötig
const getImageUrl = (posterObj: string | { poster?: string } | null | undefined): string => {
  if (!posterObj) return '/placeholder.jpg';
  const path = typeof posterObj === 'object' ? posterObj.poster : posterObj;
  if (!path) return '/placeholder.jpg';
  if (path.startsWith('http')) return path;
  return `https://image.tmdb.org/t/p/w342${path}`;
};

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
        if (!episode || !episode.air_date || episode.watched) continue;
        
        const episodeDate = new Date(episode.air_date);
        if (isNaN(episodeDate.getTime())) continue;
        
        episodeDate.setHours(0, 0, 0, 0);
        
        if (episodeDate.getTime() === todayTime) {
          const actualSeasonIndex = series.seasons?.findIndex((s: WorkerSeason) => s.seasonNumber === season.seasonNumber) ?? 0;
          const seasonNum = (season.seasonNumber ?? 0) + 1;
          const epNum = k + 1;
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
            seriesProviders: series.provider?.provider?.map((p: { id: number; name: string; logo: string }) => p.name),
            runtime: episode.runtime || series.episodeRuntime || 45,
          });
        }
      }
    }
  }
  
  return episodes;
}

export {};