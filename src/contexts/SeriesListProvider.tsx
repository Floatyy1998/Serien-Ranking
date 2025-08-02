import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useAuth } from '../App';
import { Series } from '../interfaces/Series';
import { detectNewSeasons } from '../utils/newSeasonDetection';

interface SeriesListContextType {
  seriesList: Series[];
  loading: boolean;
  seriesWithNewSeasons: Series[];
  clearNewSeasons: () => void;
  recheckForNewSeasons: () => void;
}

export const SeriesListContext = createContext<SeriesListContextType>({
  seriesList: [],
  loading: true,
  seriesWithNewSeasons: [],
  clearNewSeasons: () => {},
  recheckForNewSeasons: () => {},
});
export const SeriesListProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user } = useAuth()!;
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [seriesWithNewSeasons, setSeriesWithNewSeasons] = useState<Series[]>(
    []
  );
  const [hasCheckedForNewSeasons, setHasCheckedForNewSeasons] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const detectionRunRef = useRef(false);
  const foundNewSeasonsRef = useRef<Series[]>([]);
  const detectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced detection function um doppelte Firebase Calls zu handhaben
  const runNewSeasonDetection = useCallback(
    (seriesList: Series[], userId: string) => {
      // Cancle vorherigen Timeout
      if (detectionTimeoutRef.current) {
        clearTimeout(detectionTimeoutRef.current);
      }

      // Setze neuen Timeout - läuft nur wenn keine weiteren Calls kommen
      detectionTimeoutRef.current = setTimeout(async () => {
        if (detectionRunRef.current) {
          return;
        }

        detectionRunRef.current = true;

        try {
          const newSeasons = await detectNewSeasons(seriesList, userId);

          if (newSeasons.length > 0) {
            foundNewSeasonsRef.current = newSeasons;
            setSeriesWithNewSeasons(newSeasons);
          }

          setHasCheckedForNewSeasons(true);
          setInitialLoad(false);
        } catch (error) {
          setHasCheckedForNewSeasons(true);
          setInitialLoad(false);
        }
      }, 200); // 200ms Debounce
    },
    []
  );

  useEffect(() => {
    if (!user) {
      // Bei Logout: Liste leeren
      setSeriesList([]);
      setSeriesWithNewSeasons([]);
      setHasCheckedForNewSeasons(false);
      setInitialLoad(true);
      detectionRunRef.current = false;
      foundNewSeasonsRef.current = [];

      // Cleanup timeout
      if (detectionTimeoutRef.current) {
        clearTimeout(detectionTimeoutRef.current);
        detectionTimeoutRef.current = null;
      }

      setLoading(false);
      return;
    }

    // 🚀 Smart Loading: Erst cached Daten laden, dann Firebase Listener
    let cachedData: Series[] = [];
    try {
      const cached = localStorage.getItem(`seriesCache_${user.uid}`);
      if (cached) {
        cachedData = JSON.parse(cached);
        setSeriesList(cachedData);
        setLoading(false);
      }
    } catch (error) {
      console.warn('Failed to load cached series:', error);
    }

    // Beim Login: Firebase Listener setzen für automatische Aktualisierung
    setLoading(cachedData.length === 0); // Nur loading wenn kein Cache
    const ref = firebase.database().ref(`${user.uid}/serien`);

    let lastUpdateTime = 0;
    const UPDATE_THROTTLE = 250; // Max 4 Updates pro Sekunde (reduziert von 1000ms)

    ref.on('value', async (snapshot) => {
      const now = Date.now();
      if (now - lastUpdateTime < UPDATE_THROTTLE) return;
      lastUpdateTime = now;

      const data = snapshot.val();
      const newSeriesList = data ? (Object.values(data) as Series[]) : [];

      // 🔧 Fix: Vergleiche mit aktuellem State, nicht mit statischem Cache
      setSeriesList((prevSeriesList) => {
        // Nur Update wenn sich Daten wirklich geändert haben
        if (JSON.stringify(newSeriesList) !== JSON.stringify(prevSeriesList)) {
          console.log('📡 SeriesList updated from Firebase');

          // Cache aktualisieren (async)
          try {
            localStorage.setItem(
              `seriesCache_${user.uid}`,
              JSON.stringify(newSeriesList)
            );
          } catch (error) {
            console.warn('Failed to cache series:', error);
          }

          return newSeriesList;
        }
        return prevSeriesList;
      });

      setLoading(false);

      // Nur beim allerersten Laden nach Login prüfen auf neue Staffeln
      if (!hasCheckedForNewSeasons && newSeriesList.length > 0) {
        runNewSeasonDetection(newSeriesList, user.uid);
      } else if (initialLoad) {
        // Auch bei leerem Array initialLoad auf false setzen
        setInitialLoad(false);
      }
    });

    return () => {
      ref.off();
      // Cleanup timeout bei Unmount
      if (detectionTimeoutRef.current) {
        clearTimeout(detectionTimeoutRef.current);
        detectionTimeoutRef.current = null;
      }
    };
  }, [user, hasCheckedForNewSeasons, initialLoad, runNewSeasonDetection]);

  const clearNewSeasons = () => {
    setSeriesWithNewSeasons([]);
    detectionRunRef.current = false; // Reset für nächste Detection
  };

  const recheckForNewSeasons = useCallback(() => {
    detectionRunRef.current = false;
    setHasCheckedForNewSeasons(false);

    if (user && seriesList.length > 0) {
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
      }}
    >
      {children}
    </SeriesListContext.Provider>
  );
};
export const useSeriesList = () => useContext(SeriesListContext);
