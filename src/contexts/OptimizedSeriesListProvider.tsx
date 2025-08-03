import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useAuth } from '../App';
import { useEnhancedFirebaseCache } from '../hooks/useEnhancedFirebaseCache';
import { Series } from '../interfaces/Series';
import { detectNewSeasons } from '../utils/newSeasonDetection';

interface SeriesListContextType {
  seriesList: Series[];
  loading: boolean;
  seriesWithNewSeasons: Series[];
  clearNewSeasons: () => void;
  recheckForNewSeasons: () => void;
  refetchSeries: () => void;
  isOffline: boolean;
  isStale: boolean;
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

export const SeriesListProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user } = useAuth()!;
  const [seriesWithNewSeasons, setSeriesWithNewSeasons] = useState<Series[]>(
    []
  );
  const [hasCheckedForNewSeasons, setHasCheckedForNewSeasons] = useState(false);
  const detectionRunRef = useRef(false);
  const detectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 🚀 Enhanced Cache mit Offline-Support für Serien
  const {
    data: seriesData,
    loading,
    refetch,
    isStale,
    isOffline,
  } = useEnhancedFirebaseCache<Record<string, Series>>(
    user ? `${user.uid}/serien` : '',
    {
      ttl: 5 * 60 * 1000, // 5 Minuten Cache
      useRealtimeListener: true, // Realtime für sofortige Updates
      enableOfflineSupport: true, // Offline-First Unterstützung
      syncOnReconnect: true, // Auto-Sync bei Reconnect
    }
  );

  // Konvertiere Object zu Array
  const seriesList: Series[] = seriesData ? Object.values(seriesData) : [];

  // Debounced detection function
  const runNewSeasonDetection = useCallback(
    (seriesList: Series[], userId: string) => {
      if (detectionTimeoutRef.current) {
        clearTimeout(detectionTimeoutRef.current);
      }

      detectionTimeoutRef.current = setTimeout(async () => {
        if (detectionRunRef.current || seriesList.length === 0) {
          return;
        }

        detectionRunRef.current = true;

        try {
          const newSeasons = await detectNewSeasons(seriesList, userId);

          if (newSeasons.length > 0) {
            setSeriesWithNewSeasons(newSeasons);
          }

          setHasCheckedForNewSeasons(true);
        } catch (error) {
          console.warn('New season detection failed:', error);
          setHasCheckedForNewSeasons(true);
        }
      }, 200);
    },
    []
  );

  // New season detection nur beim ersten Load und wenn online
  useEffect(() => {
    if (!user || !seriesList.length || hasCheckedForNewSeasons || isOffline)
      return;

    runNewSeasonDetection(seriesList, user.uid);
  }, [
    user,
    seriesList,
    hasCheckedForNewSeasons,
    isOffline,
    runNewSeasonDetection,
  ]);

  // Reset bei User-Wechsel
  useEffect(() => {
    if (!user) {
      setSeriesWithNewSeasons([]);
      setHasCheckedForNewSeasons(false);
      detectionRunRef.current = false;

      if (detectionTimeoutRef.current) {
        clearTimeout(detectionTimeoutRef.current);
        detectionTimeoutRef.current = null;
      }
    }
  }, [user]);

  const clearNewSeasons = useCallback(() => {
    setSeriesWithNewSeasons([]);
    detectionRunRef.current = false;
  }, []);

  const recheckForNewSeasons = useCallback(() => {
    detectionRunRef.current = false;
    setHasCheckedForNewSeasons(false);

    if (user && seriesList.length > 0) {
      runNewSeasonDetection(seriesList, user.uid);
    }
  }, [user, seriesList, runNewSeasonDetection]);

  const refetchSeries = useCallback(() => {
    refetch();
  }, [refetch]);

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
      }}
    >
      {children}
    </SeriesListContext.Provider>
  );
};

export const useSeriesList = () => useContext(SeriesListContext);
