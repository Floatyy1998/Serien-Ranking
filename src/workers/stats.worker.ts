// Web Worker for heavy statistics calculations
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

function calculateStats(data: any) {
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
        
        // Episode is watched if it has firstWatchedAt OR watched: true OR watchCount > 0
        const isWatched = !!(
          episode.firstWatchedAt ||
          episode.watched === true ||
          (episode.watched as any) === 1 ||
          (episode.watched as any) === 'true' ||
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

const getImageUrl = (posterObj: any): string => {
  if (!posterObj) return '/placeholder.jpg';
  const path = typeof posterObj === 'object' ? posterObj.poster : posterObj;
  if (!path) return '/placeholder.jpg';
  if (path.startsWith('http')) return path;
  return `https://image.tmdb.org/t/p/w342${path}`;
};

function processEpisodes(data: any) {
  const { seriesList } = data;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();
  
  const episodes: any[] = [];
  
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
        if (!episode.air_date || episode.watched) continue;
        
        const episodeDate = new Date(episode.air_date);
        if (isNaN(episodeDate.getTime())) continue;
        
        episodeDate.setHours(0, 0, 0, 0);
        
        if (episodeDate.getTime() === todayTime) {
          // Find actual season index
          const actualSeasonIndex = j; // Use the iteration index directly
          
          // Get season number - use what's stored in DB
          // seasonNumber and season_number should be the same (actual TMDB season number)
          const seasonNum = season.seasonNumber ?? season.season_number ?? (j + 1);
          
          // Debug log for problematic series
          if (series.id === 107113) {
            console.log('Processing episode for series 107113:', {
              seriesTitle: series.title,
              seasonIndex: j,
              seasonNumber: seasonNum,
              season_number: season.season_number,
              seasonNumber_field: season.seasonNumber,
              episodeNumber: episode.episode_number,
              episodeIndex: k
            });
          }
          
          episodes.push({
            seriesId: series.id,
            seriesNmr: series.nmr,
            seriesTitle: series.title,
            poster: getImageUrl(series.poster),
            seasonNumber: seasonNum, // Use actual season number from DB
            episodeNumber: episode.episode_number || (k + 1), // Use episode_number if available
            seasonIndex: actualSeasonIndex,
            episodeIndex: k,
            episodeId: episode.id,
            episodeName: episode.name,
            watched: episode.watched,
          });
        }
      }
    }
  }
  
  return episodes;
}

export {};