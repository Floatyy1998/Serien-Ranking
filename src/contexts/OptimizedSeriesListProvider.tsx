import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from '../App';
import { useEnhancedFirebaseCache } from '../hooks/useEnhancedFirebaseCache';
import { detectNewSeasons } from '../lib/validation/newSeasonDetection';
import { Series } from '../types/Series';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';

interface SeriesListContextType {
  seriesList: Series[];
  loading: boolean;
  seriesWithNewSeasons: Series[];
  clearNewSeasons: () => void;
  recheckForNewSeasons: () => void;
  refetchSeries: () => void;
  isOffline: boolean;
  isStale: boolean;
  // Test functions for development
  simulateNewSeason?: (seriesId: number) => void;
  forceDetection?: () => void;
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
});

export const SeriesListProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth()!;

  // Verwende sessionStorage um State zwischen Re-Renders zu behalten
  const [seriesWithNewSeasons, setSeriesWithNewSeasons] = useState<Series[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('seriesWithNewSeasons');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          console.log('📦 Loaded from sessionStorage:', parsed);
          return parsed;
        } catch (e) {
          console.error('❌ Error parsing sessionStorage:', e);
        }
      }
    }
    return [];
  });

  // Check sessionStorage periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof window !== 'undefined') {
        const stored = sessionStorage.getItem('seriesWithNewSeasons');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed.length > 0 && seriesWithNewSeasons.length === 0) {
              setSeriesWithNewSeasons(parsed);
            }
          } catch (e) {}
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [seriesWithNewSeasons.length]);

  const [hasCheckedForNewSeasons, setHasCheckedForNewSeasons] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('hasCheckedForNewSeasons') === 'true';
    }
    return false;
  });

  const detectionRunRef = useRef(false);
  const detectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstWatchedAtFixedRef = useRef(false);

  // 🚀 Enhanced Cache mit Offline-Support für Serien
  const {
    data: seriesData,
    loading,
    refetch,
    isStale,
    isOffline,
  } = useEnhancedFirebaseCache<Record<string, Series>>(user ? `${user.uid}/serien` : '', {
    ttl: 24 * 60 * 60 * 1000, // 24h Cache - offline kann eh nichts geändert werden
    useRealtimeListener: true, // Realtime für sofortige Updates
    enableOfflineSupport: true, // Offline-First Unterstützung
    syncOnReconnect: true, // Auto-Sync bei Reconnect
  });

  // Konvertiere Object zu Array
  const seriesList: Series[] = seriesData ? Object.values(seriesData) : [];

  // Function to fix missing firstWatchedAt dates (run once)
  const fixMissingFirstWatchedAt = useCallback(async (userId: string, seriesData: Record<string, Series>) => {
    console.log('🔧 Starting firstWatchedAt fix for user:', userId);
    console.log('📊 Series data keys:', Object.keys(seriesData));

    try {
      const todayISO = new Date().toISOString();
      const updates: { [key: string]: any } = {};
      let totalUpdated = 0;
      let totalWatchedEpisodes = 0;
      let totalEpisodesWithFirstWatched = 0;

      // Iterate through all series
      Object.keys(seriesData).forEach((seriesKey) => {
        const series: Series = seriesData[seriesKey];

        if (!series.seasons) return;

        // Iterate through all seasons
        series.seasons.forEach((season, seasonIndex) => {
          if (!season.episodes) return;

          // Iterate through all episodes
          season.episodes.forEach((episode, episodeIndex) => {
            if (episode.watched) {
              totalWatchedEpisodes++;

              if (episode.firstWatchedAt) {
                totalEpisodesWithFirstWatched++;
              } else {
                // Check if episode is watched but doesn't have firstWatchedAt
                const episodePath = `${userId}/serien/${seriesKey}/seasons/${seasonIndex}/episodes/${episodeIndex}/firstWatchedAt`;
                updates[episodePath] = todayISO;
                totalUpdated++;
              }
            }
          });
        });
      });

      console.log('📈 Statistics:', {
        totalWatchedEpisodes,
        totalEpisodesWithFirstWatched,
        episodesToFix: totalUpdated
      });

      // Apply all updates in a single batch
      if (Object.keys(updates).length > 0) {
        console.log('💾 Applying updates to Firebase...');
        await firebase.database().ref().update(updates);
        console.log(`✅ Fixed ${totalUpdated} episodes with missing firstWatchedAt`);
      } else {
        console.log('✅ No episodes need fixing - all watched episodes already have firstWatchedAt');
      }

      console.log('🏁 FirstWatchedAt fix completed successfully');

    } catch (error) {
      console.error('❌ Error fixing firstWatchedAt dates:', error);
      console.log('🏁 FirstWatchedAt fix completed with errors');
    }
  }, []);

  // Make fix function available globally for manual execution
  useEffect(() => {
    if (user && seriesData && !loading) {
      // Make function available in console
      (window as any).fixFirstWatchedAt = () => {
        console.log('🚀 Running firstWatchedAt fix manually...');
        fixMissingFirstWatchedAt(user.uid, seriesData);
      };

      console.log('💡 Type "fixFirstWatchedAt()" in console to fix missing firstWatchedAt dates');
    } else {
      // Remove function when not ready
      delete (window as any).fixFirstWatchedAt;
    }
  }, [user, seriesData, loading, fixMissingFirstWatchedAt]);

  // Signal when initial data is loaded
  useEffect(() => {
    // If no user, data is immediately "ready" (empty)
    if (!user) {
      window.setAppReady?.('initialData', true);
      return;
    }

    // If user exists and data has loaded
    if (!loading) {
      window.setAppReady?.('initialData', true);
    }
  }, [user, loading]);

  // Debounced detection function
  const runNewSeasonDetection = useCallback((seriesList: Series[], userId: string) => {
    // Clear any pending timeout
    if (detectionTimeoutRef.current) {
      clearTimeout(detectionTimeoutRef.current);
      detectionTimeoutRef.current = null;
    }

    // Check if already running
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
          console.log('🎉 New seasons detected:', newSeasons);
          // Speichere in sessionStorage
          if (typeof window !== 'undefined') {
            const dataToStore = JSON.stringify(newSeasons);
            console.log('💾 Storing to sessionStorage:', dataToStore);
            sessionStorage.setItem('seriesWithNewSeasons', dataToStore);
          }
          setSeriesWithNewSeasons(newSeasons);
          // Force update
          setTimeout(() => {
            setSeriesWithNewSeasons([...newSeasons]);
          }, 100);
          // WICHTIG: Nicht sofort hasCheckedForNewSeasons setzen, damit der Dialog angezeigt werden kann
        } else {
          setHasCheckedForNewSeasons(true);
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('hasCheckedForNewSeasons', 'true');
          }
        }
      } catch (error) {
        setHasCheckedForNewSeasons(true);
      } finally {
        detectionRunRef.current = false;
      }
    }, 500); // Erhöht auf 500ms für besseres Debouncing
  }, []);

  // New season detection nur beim ersten Load und wenn online
  useEffect(() => {
    // Prüfe ob bereits neue Staffeln im State sind
    if (seriesWithNewSeasons.length > 0) {
      return;
    }

    if (!user || !seriesList.length || hasCheckedForNewSeasons || isOffline) {
      return;
    }

    runNewSeasonDetection(seriesList, user.uid);
  }, [
    user,
    seriesList.length, // Nur auf Längenänderung reagieren, nicht auf jede Änderung
    hasCheckedForNewSeasons,
    isOffline,
    seriesWithNewSeasons.length,
    runNewSeasonDetection,
  ]);

  // Reset bei User-Wechsel
  useEffect(() => {
    if (!user) {
      setSeriesWithNewSeasons([]);
      setHasCheckedForNewSeasons(false);
      detectionRunRef.current = false;
      firstWatchedAtFixedRef.current = false; // Reset fix flag on logout

      if (detectionTimeoutRef.current) {
        clearTimeout(detectionTimeoutRef.current);
        detectionTimeoutRef.current = null;
      }

      // Clear sessionStorage on logout
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('seriesWithNewSeasons');
        sessionStorage.removeItem('hasCheckedForNewSeasons');
      }
    }
  }, [user]);

  const clearNewSeasons = useCallback(() => {
    setSeriesWithNewSeasons([]);
    setHasCheckedForNewSeasons(true); // Jetzt als gecheckt markieren
    detectionRunRef.current = false;

    // Clear from sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('seriesWithNewSeasons');
      sessionStorage.setItem('hasCheckedForNewSeasons', 'true');
    }
  }, []);

  const recheckForNewSeasons = useCallback(() => {
    detectionRunRef.current = false;
    setHasCheckedForNewSeasons(false);

    // Clear sessionStorage to allow new check
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('hasCheckedForNewSeasons');
      sessionStorage.removeItem('seriesWithNewSeasons');
    }

    if (user && seriesList.length > 0) {
      runNewSeasonDetection(seriesList, user.uid);
    }
  }, [user, seriesList, runNewSeasonDetection]);

  const refetchSeries = useCallback(() => {
    refetch();
  }, [refetch]);

  // TEST FUNCTIONS - Only available in development
  const simulateNewSeason = useCallback((seriesId: number) => {
    if (process.env.NODE_ENV !== 'development') return;
    
    const series = seriesList.find(s => s.id === seriesId);
    if (series) {
      // Create a test series with increased season count
      const testSeries = {
        ...series,
        seasonCount: (series.seasonCount || 0) + 1
      };
      
      // Add to new seasons list
      setSeriesWithNewSeasons(prev => [...prev, testSeries]);
      
      // Store in sessionStorage
      if (typeof window !== 'undefined') {
        const newList = [...seriesWithNewSeasons, testSeries];
        sessionStorage.setItem('seriesWithNewSeasons', JSON.stringify(newList));
      }
      
      console.log(`🧪 Simulated new season for ${series.title || series.original_name}: Season ${testSeries.seasonCount}`);
      console.log('🧪 Test Series Data:', testSeries);
    }
  }, [seriesList, seriesWithNewSeasons]);

  const forceDetection = useCallback(() => {
    if (process.env.NODE_ENV !== 'development') return;
    
    // Reset detection state
    detectionRunRef.current = false;
    setHasCheckedForNewSeasons(false);
    
    // Clear sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('hasCheckedForNewSeasons');
      sessionStorage.removeItem('seriesWithNewSeasons');
    }
    
    // Force run detection
    if (user && seriesList.length > 0) {
      console.log('🧪 Forcing new season detection...');
      runNewSeasonDetection(seriesList, user.uid);
    }
  }, [user, seriesList, runNewSeasonDetection]);

  return (
    <SeriesListContext.Provider
      value={{
        seriesList,
        loading,
        seriesWithNewSeasons,
        clearNewSeasons,
        recheckForNewSeasons,
        refetchSeries,
        isOffline,
        isStale,
        ...(process.env.NODE_ENV === 'development' ? {
          simulateNewSeason,
          forceDetection
        } : {})
      }}
    >
      {children}
    </SeriesListContext.Provider>
  );
};

export const useSeriesList = () => useContext(SeriesListContext);
