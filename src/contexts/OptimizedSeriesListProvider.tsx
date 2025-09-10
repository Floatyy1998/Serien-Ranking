import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from '../components/auth/AuthProvider';
import apiService from '../services/api.service';
import { detectNewSeasons } from '../lib/validation/newSeasonDetection';
import { Series } from '../types/Series';

interface SeriesListContextType {
  seriesList: Series[];
  loading: boolean;
  seriesWithNewSeasons: Series[];
  clearNewSeasons: () => void;
  recheckForNewSeasons: () => void;
  refetchSeries: () => void;
  isOffline: boolean;
  isStale: boolean;
  updateSeries: (seriesId: string, updates: Partial<Series>) => Promise<void>;
  updateEpisode: (seriesId: string, episodeData: any) => Promise<void>;
  deleteSeries: (seriesId: string) => Promise<void>;
  addSeries: (tmdbId: number, data?: any) => Promise<void>;
}

export const SeriesListContext = createContext<SeriesListContextType>({
  seriesList: [],
  loading: true,
  seriesWithNewSeasons: [],
  clearNewSeasons: () => {},
  recheckForNewSeasons: () => {},
  refetchSeries: () => {},
  isOffline: false,
  isStale: false,
  updateSeries: async () => {},
  updateEpisode: async () => {},
  deleteSeries: async () => {},
  addSeries: async () => {},
});

export const SeriesListProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isOffline } = useAuth();
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStale, setIsStale] = useState(false);
  
  // Handle new seasons detection
  const [seriesWithNewSeasons, setSeriesWithNewSeasons] = useState<Series[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('seriesWithNewSeasons');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          console.error('Failed to parse stored new seasons:', e);
        }
      }
    }
    return [];
  });

  const [hasCheckedForNewSeasons, setHasCheckedForNewSeasons] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('hasCheckedForNewSeasons') === 'true';
    }
    return false;
  });

  const detectionRunRef = useRef(false);
  const detectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch series from API
  const fetchSeries = useCallback(async () => {
    if (!user) {
      setSeriesList([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // First load minimal data for faster initial response
      console.time('Initial series load (minimal)');
      const minimalData = await apiService.getSeries({ minimal: 'true' });
      console.timeEnd('Initial series load (minimal)');
      console.log('Loaded minimal series from API:', minimalData.length);
      
      // Set minimal data immediately for faster UI
      setSeriesList(minimalData);
      setIsStale(false);
      
      // Then load full data in background
      console.time('Full series load');
      const fullData = await apiService.getSeries();
      console.timeEnd('Full series load');
      console.log('Loaded full series from API:', fullData.length);
      console.log('Sample series data:', fullData.find((s: any) => s.id === 1769));
      
      // Update with full data
      setSeriesList(fullData);
      const data = fullData; // For caching below
      
      // Cache data for offline use with optimized storage
      if (typeof window !== 'undefined') {
        try {
          // Create minimal cache data - only essential fields
          const cacheData = data.map(series => ({
            id: series.id,
            tmdbId: series.tmdbId,
            title: series.title,
            overview: series.overview,
            posterPath: series.posterPath,
            backdropPath: series.backdropPath,
            status: series.status,
            watchlist: series.watchlist,
            rating: series.rating,
            progress: series.progress,
            // Store only essential season/episode data
            seasons: series.seasons?.map(season => ({
              season_number: season.season_number,
              seasonNumber: season.seasonNumber,
              episode_count: season.episode_count,
              episodes: season.episodes?.map(ep => ({
                episode_number: ep.episode_number,
                watched: ep.watched,
                watchCount: ep.watchCount,
                firstWatchedAt: ep.firstWatchedAt
              })) || []
            })) || [],
            firstAirDate: series.firstAirDate,
            lastAirDate: series.lastAirDate,
            createdAt: series.createdAt,
            updatedAt: series.updatedAt
          }));
          
          // Check if cache size is reasonable before storing
          const cacheString = JSON.stringify(cacheData);
          const cacheSizeKB = new Blob([cacheString]).size / 1024;
          
          if (cacheSizeKB > 4000) { // If cache is over 4MB
            console.warn(`Cache size too large (${cacheSizeKB.toFixed(0)}KB), clearing old cache`);
            // Clear all series caches to free up space
            Object.keys(localStorage).forEach(key => {
              if (key.startsWith('series_')) {
                localStorage.removeItem(key);
              }
            });
          }
          
          localStorage.setItem(`series_${user.uid}`, cacheString);
          localStorage.setItem(`series_${user.uid}_timestamp`, Date.now().toString());
          console.log(`Series cache updated: ${cacheSizeKB.toFixed(0)}KB for ${data.length} series`);
        } catch (error) {
          console.warn('Failed to cache series data - localStorage quota exceeded:', error);
          // Progressive cleanup strategy
          try {
            // First, try clearing just this user's cache
            localStorage.removeItem(`series_${user.uid}`);
            localStorage.removeItem(`series_${user.uid}_timestamp`);
            
            // If still failing, clear all series caches
            Object.keys(localStorage).forEach(key => {
              if (key.startsWith('series_')) {
                localStorage.removeItem(key);
              }
            });
            
            // Try caching again with even more minimal data
            const minimalCache = data.map(series => ({
              id: series.id,
              tmdbId: series.tmdbId,
              title: series.title,
              watchlist: series.watchlist,
              progress: {
                watchedEpisodes: series.progress?.watchedEpisodes || 0,
                totalEpisodes: series.progress?.totalEpisodes || 0
              }
            }));
            
            localStorage.setItem(`series_${user.uid}`, JSON.stringify(minimalCache));
            localStorage.setItem(`series_${user.uid}_timestamp`, Date.now().toString());
            console.log('Stored minimal series cache after cleanup');
          } catch (e) {
            console.error('Failed to cache even minimal data:', e);
            // Give up on caching
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch series:', error);
      
      // Try to load from cache if offline
      if (isOffline && typeof window !== 'undefined') {
        const cached = localStorage.getItem(`series_${user.uid}`);
        const cacheTimestamp = localStorage.getItem(`series_${user.uid}_timestamp`);
        
        if (cached) {
          try {
            const data = JSON.parse(cached);
            setSeriesList(data);
            
            // Check if cache is stale (older than 24 hours)
            if (cacheTimestamp) {
              const age = Date.now() - parseInt(cacheTimestamp);
              setIsStale(age > 24 * 60 * 60 * 1000);
            }
          } catch (e) {
            console.error('Failed to parse cached series:', e);
          }
        }
      }
    } finally {
      setLoading(false);
      window.setAppReady?.('initialData', true);
    }
  }, [user, isOffline]);

  // Initial fetch
  useEffect(() => {
    fetchSeries();
  }, [fetchSeries]);

  // Setup WebSocket listeners for real-time updates
  useEffect(() => {
    if (!user) return;

    const socket = apiService.getSocket();
    if (!socket) return;

    const handleSeriesUpdate = (data: any) => {
      if (data.userId === user.uid) {
        fetchSeries(); // Refetch to get updated data
      }
    };

    socket.on('seriesUpdate', handleSeriesUpdate);
    socket.on('episodeWatched', handleSeriesUpdate);

    return () => {
      socket.off('seriesUpdate', handleSeriesUpdate);
      socket.off('episodeWatched', handleSeriesUpdate);
    };
  }, [user, fetchSeries]);

  // Detect new seasons
  const runNewSeasonDetection = useCallback((seriesList: Series[], userId: string) => {
    if (detectionTimeoutRef.current) {
      clearTimeout(detectionTimeoutRef.current);
      detectionTimeoutRef.current = null;
    }

    if (detectionRunRef.current) {
      return;
    }

    detectionTimeoutRef.current = setTimeout(async () => {
      if (detectionRunRef.current || seriesList.length === 0) {
        return;
      }

      detectionRunRef.current = true;

      try {
        const newSeasons = await detectNewSeasons(seriesList, userId);

        if (newSeasons.length > 0) {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('seriesWithNewSeasons', JSON.stringify(newSeasons));
          }
          setSeriesWithNewSeasons(newSeasons);
        } else {
          setHasCheckedForNewSeasons(true);
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('hasCheckedForNewSeasons', 'true');
          }
        }
      } catch (error) {
        console.error('Failed to detect new seasons:', error);
        setHasCheckedForNewSeasons(true);
      } finally {
        detectionRunRef.current = false;
      }
    }, 2000);
  }, []);

  // Run detection when series list changes
  useEffect(() => {
    if (user && seriesList.length > 0 && !hasCheckedForNewSeasons && !loading) {
      runNewSeasonDetection(seriesList, user.uid);
    }
  }, [seriesList, user, hasCheckedForNewSeasons, loading, runNewSeasonDetection]);

  const clearNewSeasons = useCallback(() => {
    setSeriesWithNewSeasons([]);
    setHasCheckedForNewSeasons(true);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('seriesWithNewSeasons');
      sessionStorage.setItem('hasCheckedForNewSeasons', 'true');
    }
  }, []);

  const recheckForNewSeasons = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('hasCheckedForNewSeasons');
      sessionStorage.removeItem('seriesWithNewSeasons');
    }
    setHasCheckedForNewSeasons(false);
    setSeriesWithNewSeasons([]);
    detectionRunRef.current = false;
    
    if (user && seriesList.length > 0) {
      runNewSeasonDetection(seriesList, user.uid);
    }
  }, [user, seriesList, runNewSeasonDetection]);

  const updateSeries = useCallback(async (seriesId: string, updates: Partial<Series>) => {
    try {
      const updatedSeries = await apiService.updateSeries(seriesId, updates);
      setSeriesList(prev => prev.map(s => s._id === seriesId ? updatedSeries : s));
    } catch (error) {
      console.error('Failed to update series:', error);
      throw error;
    }
  }, []);

  const updateEpisode = useCallback(async (seriesId: string, episodeData: any) => {
    try {
      const updatedSeries = await apiService.updateEpisode(seriesId, episodeData);
      console.log('Updated series from API:', updatedSeries);
      
      setSeriesList(prev => {
        const newList = prev.map(s => {
          // Check all possible ID fields
          const matches = s.id?.toString() === seriesId || 
                         s._id === seriesId || 
                         s.tmdbId?.toString() === seriesId;
          
          if (matches) {
            console.log('Updating series in context:', s.id, 'with new data');
            return updatedSeries;
          }
          return s;
        });
        console.log('Series list after update:', newList.find(s => s.id?.toString() === seriesId));
        return newList;
      });
    } catch (error) {
      console.error('Failed to update episode:', error);
      throw error;
    }
  }, []);

  const deleteSeries = useCallback(async (seriesId: string) => {
    try {
      await apiService.deleteSeries(seriesId);
      setSeriesList(prev => prev.filter(s => s._id !== seriesId));
    } catch (error) {
      console.error('Failed to delete series:', error);
      throw error;
    }
  }, []);

  const addSeries = useCallback(async (tmdbId: number, data?: any) => {
    try {
      const newSeries = await apiService.addSeries(tmdbId, data);
      setSeriesList(prev => [...prev, newSeries]);
    } catch (error) {
      console.error('Failed to add series:', error);
      throw error;
    }
  }, []);

  return (
    <SeriesListContext.Provider value={{
      seriesList,
      loading,
      seriesWithNewSeasons,
      clearNewSeasons,
      recheckForNewSeasons,
      refetchSeries: fetchSeries,
      isOffline,
      isStale,
      updateSeries,
      updateEpisode,
      deleteSeries,
      addSeries,
    }}>
      {children}
    </SeriesListContext.Provider>
  );
};

export const useSeriesList = () => {
  const context = useContext(SeriesListContext);
  if (!context) {
    throw new Error('useSeriesList must be used within a SeriesListProvider');
  }
  return context;
};