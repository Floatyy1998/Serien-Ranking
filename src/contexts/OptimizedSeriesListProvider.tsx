import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from '../App';
import { useEnhancedFirebaseCache } from '../hooks/useEnhancedFirebaseCache';
import { detectNewSeasons } from '../lib/validation/newSeasonDetection';
import { detectInactiveSeries } from '../lib/validation/inactiveSeriesDetection';
import { detectCompletedSeries } from '../lib/validation/completedSeriesDetection';
import { Series } from '../types/Series';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';

interface SeriesListContextType {
  seriesList: Series[];
  allSeriesList: Series[];
  hiddenSeriesList: Series[];
  loading: boolean;
  seriesWithNewSeasons: Series[];
  inactiveSeries: Series[];
  completedSeries: Series[];
  clearNewSeasons: () => void;
  clearInactiveSeries: () => void;
  clearCompletedSeries: () => void;
  recheckForNewSeasons: () => void;
  refetchSeries: () => void;
  toggleHideSeries: (nmr: number, hidden: boolean) => Promise<void>;
  isOffline: boolean;
  isStale: boolean;
  // Test functions for development
  simulateNewSeason?: (seriesId: number) => void;
  forceDetection?: () => void;
}

export const SeriesListContext = createContext<SeriesListContextType>({
  seriesList: [],
  allSeriesList: [],
  hiddenSeriesList: [],
  loading: true,
  seriesWithNewSeasons: [],
  inactiveSeries: [],
  completedSeries: [],
  clearNewSeasons: () => {},
  clearInactiveSeries: () => {},
  clearCompletedSeries: () => {},
  recheckForNewSeasons: () => {},
  refetchSeries: () => {},
  toggleHideSeries: async () => {},
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
          return parsed;
        } catch (e) {
          console.error('❌ Error parsing sessionStorage:', e);
        }
      }
    }
    return [];
  });

  // Listen for sessionStorage updates from other tabs via storage event
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'seriesWithNewSeasons' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed.length > 0 && seriesWithNewSeasons.length === 0) {
            setSeriesWithNewSeasons(parsed);
          }
        } catch (e) {
          console.error('Failed to parse seriesWithNewSeasons from storage event:', e);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [seriesWithNewSeasons.length]);

  const [hasCheckedForNewSeasons, setHasCheckedForNewSeasons] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('hasCheckedForNewSeasons') === 'true';
    }
    return false;
  });

  // State für inaktive Serien
  const [inactiveSeries, setInactiveSeries] = useState<Series[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('inactiveSeries');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          console.error('❌ Error parsing inactiveSeries from sessionStorage:', e);
        }
      }
    }
    return [];
  });

  const [hasCheckedForInactive, setHasCheckedForInactive] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('hasCheckedForInactive') === 'true';
    }
    return false;
  });

  // State für komplett geschaute Serien
  const [completedSeries, setCompletedSeries] = useState<Series[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('completedSeries');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          console.error('❌ Error parsing completedSeries from sessionStorage:', e);
        }
      }
    }
    return [];
  });

  const [hasCheckedForCompleted, setHasCheckedForCompleted] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('hasCheckedForCompleted') === 'true';
    }
    return false;
  });

  const detectionRunRef = useRef(false);
  const inactiveDetectionRunRef = useRef(false);
  const completedDetectionRunRef = useRef(false);
  const detectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inactiveDetectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completedDetectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  // Konvertiere Object zu Array und trenne sichtbare/versteckte Serien
  const allSeries: Series[] = seriesData ? Object.values(seriesData) : [];
  const seriesList = allSeries.filter(s => !s.hidden);
  const hiddenSeriesList = allSeries.filter(s => s.hidden === true);

  // ⚠️ LEGACY FUNCTION - NUR FÜR MIGRATION, NICHT FÜR WRAPPED 2026!
  // Diese Funktion setzt das HEUTIGE Datum für alte Episoden - das verfälscht historische Daten!
  // Für Wrapped 2026 werden die Daten korrekt über WatchActivityService gesammelt.
  // Diese Funktion sollte NICHT mehr verwendet werden, außer für spezielle Migrations-Fälle.
  const fixMissingFirstWatchedAt = useCallback(async (userId: string, seriesData: Record<string, Series>) => {
    console.warn('⚠️ WARNUNG: Diese Funktion setzt das HEUTIGE Datum für alle alten Episoden!');
    console.warn('⚠️ Für Wrapped 2026 werden Daten automatisch korrekt gesammelt.');
    console.warn('⚠️ Nur verwenden wenn du weißt was du tust!');
    try {
      const todayISO = new Date().toISOString();
      const updates: Record<string, string | null> = {};
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

      // Apply all updates in a single batch
      if (Object.keys(updates).length > 0) {
        await firebase.database().ref().update(updates);
      }

    } catch (error) {
      console.error('❌ Error fixing firstWatchedAt dates:', error);
    }
  }, []);

  // Make fix function available globally for manual execution
  useEffect(() => {
    if (user && seriesData && !loading) {
      // Make function available in console
      (window as any).fixFirstWatchedAt = () => {
        fixMissingFirstWatchedAt(user.uid, seriesData);
      };

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
          // Speichere in sessionStorage
          if (typeof window !== 'undefined') {
            const dataToStore = JSON.stringify(newSeasons);
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

  // Debounced detection function for inactive series
  const runInactiveSeriesDetection = useCallback((seriesList: Series[], userId: string) => {
    if (inactiveDetectionTimeoutRef.current) {
      clearTimeout(inactiveDetectionTimeoutRef.current);
      inactiveDetectionTimeoutRef.current = null;
    }

    if (inactiveDetectionRunRef.current) {
      return;
    }

    inactiveDetectionTimeoutRef.current = setTimeout(async () => {
      if (inactiveDetectionRunRef.current || seriesList.length === 0) {
        return;
      }

      inactiveDetectionRunRef.current = true;

      try {
        const inactive = await detectInactiveSeries(seriesList, userId);

        if (inactive.length > 0) {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('inactiveSeries', JSON.stringify(inactive));
          }
          setInactiveSeries(inactive);
          setTimeout(() => {
            setInactiveSeries([...inactive]);
          }, 100);
        } else {
          setHasCheckedForInactive(true);
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('hasCheckedForInactive', 'true');
          }
        }
      } catch (error) {
        console.error('Error detecting inactive series:', error);
        setHasCheckedForInactive(true);
      } finally {
        inactiveDetectionRunRef.current = false;
      }
    }, 500);
  }, []);

  // Debounced detection function for completed series
  const runCompletedSeriesDetection = useCallback((seriesList: Series[], userId: string) => {
    if (completedDetectionTimeoutRef.current) {
      clearTimeout(completedDetectionTimeoutRef.current);
      completedDetectionTimeoutRef.current = null;
    }

    if (completedDetectionRunRef.current) {
      return;
    }

    completedDetectionTimeoutRef.current = setTimeout(async () => {
      if (completedDetectionRunRef.current || seriesList.length === 0) {
        return;
      }

      completedDetectionRunRef.current = true;

      try {
        const completed = await detectCompletedSeries(seriesList, userId);

        if (completed.length > 0) {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('completedSeries', JSON.stringify(completed));
          }
          setCompletedSeries(completed);
          setTimeout(() => {
            setCompletedSeries([...completed]);
          }, 100);
        } else {
          setHasCheckedForCompleted(true);
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('hasCheckedForCompleted', 'true');
          }
        }
      } catch (error) {
        console.error('Error detecting completed series:', error);
        setHasCheckedForCompleted(true);
      } finally {
        completedDetectionRunRef.current = false;
      }
    }, 500);
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

  // Inactive series detection
  useEffect(() => {
    if (inactiveSeries.length > 0) {
      return;
    }

    if (!user || !seriesList.length || hasCheckedForInactive || isOffline) {
      return;
    }

    runInactiveSeriesDetection(seriesList, user.uid);
  }, [
    user,
    seriesList.length,
    hasCheckedForInactive,
    isOffline,
    inactiveSeries.length,
    runInactiveSeriesDetection,
  ]);

  // Completed series detection
  useEffect(() => {
    if (completedSeries.length > 0) {
      return;
    }

    if (!user || !seriesList.length || hasCheckedForCompleted || isOffline) {
      return;
    }

    runCompletedSeriesDetection(seriesList, user.uid);
  }, [
    user,
    seriesList.length,
    hasCheckedForCompleted,
    isOffline,
    completedSeries.length,
    runCompletedSeriesDetection,
  ]);

  // Reset bei User-Wechsel
  useEffect(() => {
    if (!user) {
      setSeriesWithNewSeasons([]);
      setHasCheckedForNewSeasons(false);
      setInactiveSeries([]);
      setHasCheckedForInactive(false);
      setCompletedSeries([]);
      setHasCheckedForCompleted(false);
      detectionRunRef.current = false;
      inactiveDetectionRunRef.current = false;
      completedDetectionRunRef.current = false;
      firstWatchedAtFixedRef.current = false; // Reset fix flag on logout

      if (detectionTimeoutRef.current) {
        clearTimeout(detectionTimeoutRef.current);
        detectionTimeoutRef.current = null;
      }
      if (inactiveDetectionTimeoutRef.current) {
        clearTimeout(inactiveDetectionTimeoutRef.current);
        inactiveDetectionTimeoutRef.current = null;
      }
      if (completedDetectionTimeoutRef.current) {
        clearTimeout(completedDetectionTimeoutRef.current);
        completedDetectionTimeoutRef.current = null;
      }

      // Clear sessionStorage on logout
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('seriesWithNewSeasons');
        sessionStorage.removeItem('hasCheckedForNewSeasons');
        sessionStorage.removeItem('inactiveSeries');
        sessionStorage.removeItem('hasCheckedForInactive');
        sessionStorage.removeItem('completedSeries');
        sessionStorage.removeItem('hasCheckedForCompleted');
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

  const clearInactiveSeries = useCallback(() => {
    setInactiveSeries([]);
    setHasCheckedForInactive(true);
    inactiveDetectionRunRef.current = false;

    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('inactiveSeries');
      sessionStorage.setItem('hasCheckedForInactive', 'true');
    }
  }, []);

  const clearCompletedSeries = useCallback(() => {
    setCompletedSeries([]);
    setHasCheckedForCompleted(true);
    completedDetectionRunRef.current = false;

    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('completedSeries');
      sessionStorage.setItem('hasCheckedForCompleted', 'true');
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

  const toggleHideSeries = useCallback(async (nmr: number, hidden: boolean) => {
    if (!user) return;
    const ref = firebase.database().ref(`${user.uid}/serien/${nmr}/hidden`);
    if (hidden) {
      await ref.set(true);
    } else {
      await ref.remove();
    }
  }, [user]);

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
      runNewSeasonDetection(seriesList, user.uid);
    }
  }, [user, seriesList, runNewSeasonDetection]);

  return (
    <SeriesListContext.Provider
      value={{
        seriesList,
        allSeriesList: allSeries,
        hiddenSeriesList,
        loading,
        seriesWithNewSeasons,
        inactiveSeries,
        completedSeries,
        clearNewSeasons,
        clearInactiveSeries,
        clearCompletedSeries,
        recheckForNewSeasons,
        refetchSeries,
        toggleHideSeries,
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
