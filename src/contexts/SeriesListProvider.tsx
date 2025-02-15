import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../App';
import { Series } from '../interfaces/Series';
interface SharedLink {
  key: string;
  link: string;
  expiresAt: number;
}
interface SeriesListContextType {
  seriesList: Series[];
  loading: boolean;
  sharedLinks: SharedLink[];
}
export const SeriesListContext = createContext<SeriesListContextType>({
  seriesList: [],
  loading: true,
  sharedLinks: [],
});
export const SeriesListProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user } = useAuth()!;
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [sharedLinks, setSharedLinks] = useState<SharedLink[]>([]);
  useEffect(() => {
    if (!user) {
      // Bei Logout: Liste leeren
      setSeriesList([]);
      setSharedLinks([]);
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
  useEffect(() => {
    if (user && window.location.pathname === '/shared-list') {
      const ref = firebase
        .database()
        .ref('sharedLists')
        .orderByChild('userId')
        .equalTo(user.uid);
      ref.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const links = Object.keys(data).map((key) => ({
            key,
            link: `${window.location.origin}/shared-list/${key}`,
            expiresAt: data[key].expiresAt,
          }));
          setSharedLinks(links);
        } else {
          setSharedLinks([]);
        }
      });
      return () => ref.off();
    } else {
      setSharedLinks([]);
    }
  }, [user]);
  return (
    <SeriesListContext.Provider value={{ seriesList, loading, sharedLinks }}>
      {children}
    </SeriesListContext.Provider>
  );
};
export const useSeriesList = () => useContext(SeriesListContext);
