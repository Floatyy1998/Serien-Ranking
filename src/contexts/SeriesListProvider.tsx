import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../App';
import { Series } from '../interfaces/Series';

interface SeriesListContextType {
  seriesList: Series[];
  loading: boolean;
}

export const SeriesListContext = createContext<SeriesListContextType>({
  seriesList: [],
  loading: true,
});
export const SeriesListProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user } = useAuth()!;
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!user) {
      // Bei Logout: Liste leeren
      setSeriesList([]);
      setLoading(false);
      return;
    }
    // Beim Login: Firebase Listener setzen für automatische Aktualisierung
    setLoading(true);
    const ref = firebase.database().ref(`${user.uid}/serien`);
    ref.on('value', (snapshot) => {
      const data = snapshot.val();
      setSeriesList(data ? (Object.values(data) as Series[]) : []);
      setLoading(false);
    });
    return () => {
      ref.off();
    };
  }, [user]);
  return (
    <SeriesListContext.Provider value={{ seriesList, loading }}>
      {children}
    </SeriesListContext.Provider>
  );
};
export const useSeriesList = () => useContext(SeriesListContext);
