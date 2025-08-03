import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useAuth } from '../App';
import { useFirebaseCache } from '../hooks/useFirebaseCache';
import { Series } from '../interfaces/Series';
import { detectNewSeasons } from '../utils/newSeasonDetection';

interface SeriesListContextType {
  seriesList: Series[];
  loading: boolean;
  seriesWithNewSeasons: Series[];
  clearNewSeasons: () => void;
  recheckForNewSeasons: () => void;
  refetchSeries: () => void;
}

export const SeriesListContext = createContext<SeriesListContextType>({
  seriesList: [],
  loading: true,
  seriesWithNewSeasons: [],
  clearNewSeasons: () => {},
  recheckForNewSeasons: () => {},
  refetchSeries: () => {},
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

  // 🚀 Ultra-responsiver Cache - sofortige UI Updates
  const {
    data: seriesData,
    loading,
    refetch,
  } = useFirebaseCache<Record<string, Series>>(
    user ? `${user.uid}/serien` : '',
    {
      ttl: 500, // 2 Sekunden Cache für sofortige Updates
      checkInterval: 100, // Check alle 500ms für ultra-responsive UI
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

  // New season detection nur beim ersten Load
  useEffect(() => {
    if (!user || !seriesList.length || hasCheckedForNewSeasons) return;

    runNewSeasonDetection(seriesList, user.uid);
  }, [user, seriesList, hasCheckedForNewSeasons, runNewSeasonDetection]);

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
      }}
    >
      {children}
    </SeriesListContext.Provider>
  );
};

export const useSeriesList = () => useContext(SeriesListContext);
