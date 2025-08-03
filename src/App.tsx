import { CssBaseline, ThemeProvider } from '@mui/material';
import Firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import {
  createContext,
  lazy,
  Suspense,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Helmet } from 'react-helmet';
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from 'react-router-dom';
import { VerifiedRoute } from './components/auth/VerifiedRoute';
import BadgeNotificationManager from './components/badges/BadgeNotificationManager';
import { UsernameRequiredDialog } from './components/dialogs/UsernameRequiredDialog';
import { BadgeProvider } from './contexts/BadgeProvider';
import { GlobalLoadingProvider } from './contexts/GlobalLoadingContext';
import { MovieListProvider } from './contexts/MovieListProvider';
import { NotificationProvider } from './contexts/NotificationProvider';
import { OptimizedFriendsProvider } from './contexts/OptimizedFriendsProvider';
import { SeriesListProvider } from './contexts/OptimizedSeriesListProvider';
import { StatsProvider } from './contexts/StatsProvider';
import { FriendsPage } from './pages/FriendsPage';
import MainPage from './pages/MainPage';
import MoviePage from './pages/MoviePage';
import { PublicListPage } from './pages/PublicListPage';
import StartPage from './pages/StartPage'; // Eager loading für bessere Offline-Performance
import { UserProfilePage } from './pages/UserProfilePage';
import { offlineFirebaseService } from './services/offlineFirebaseService';
import { theme } from './theme';

// Nur diese bleiben lazy
const LoginPage = lazy(() => import('./components/auth/LoginPage'));
const RegisterPage = lazy(() => import('./components/auth/RegisterPage'));
const DuckFacts = lazy(() => import('./components/DuckFacts'));
export const AuthContext = createContext<{
  user: Firebase.User | null;
  setUser: React.Dispatch<React.SetStateAction<Firebase.User | null>>;
  authStateResolved: boolean;
} | null>(null);
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<Firebase.User | null>(null);
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);
  const [authStateResolved, setAuthStateResolved] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    // Online/Offline Status überwachen
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    import('./firebase/initFirebase')
      .then((module) => {
        try {
          module.initFirebase();
          setFirebaseInitialized(true);

          // Service Worker initialisieren
          if ('serviceWorker' in navigator) {
            // Service Worker Manager ist bereits als Singleton initialisiert
          }

          const authTimeout = setTimeout(
            () => {
              setAuthStateResolved(true);

              // Wenn offline, versuche gespeicherten User zu laden
              if (isOffline) {
                const savedUser = localStorage.getItem('cachedUser');
                if (savedUser) {
                  try {
                    const parsedUser = JSON.parse(savedUser);
                    setUser(parsedUser);
                  } catch (error) {
                    console.error(
                      'Fehler beim Laden des gespeicherten Users:',
                      error
                    );
                  }
                }
              }
            },
            isOffline ? 2000 : 5000
          ); // Kürzerer Timeout wenn offline

          Firebase.auth().onAuthStateChanged(async (user) => {
            clearTimeout(authTimeout); // Timeout löschen wenn Auth State sich ändert
            setUser(user);
            setAuthStateResolved(true);

            // User für Offline-Zugriff speichern
            if (user) {
              localStorage.setItem(
                'cachedUser',
                JSON.stringify({
                  uid: user.uid,
                  email: user.email,
                  displayName: user.displayName,
                  photoURL: user.photoURL,
                })
              );
            } else {
              localStorage.removeItem('cachedUser');
            }

            // User Profile in Firebase initialisieren falls noch nicht vorhanden
            if (user) {
              const userRef = Firebase.database().ref(`users/${user.uid}`);
              const snapshot = await userRef.once('value');

              if (!snapshot.exists()) {
                // Neuer Benutzer - nur grundlegende Daten setzen (Username wird in ProfileDialog gesetzt)
                const userData = {
                  uid: user.uid,
                  email: user.email,
                  displayName:
                    user.displayName ||
                    user.email?.split('@')[0] ||
                    'Unbekannt',
                  photoURL: user.photoURL || null,
                  createdAt: Firebase.database.ServerValue.TIMESTAMP,
                  lastActive: Firebase.database.ServerValue.TIMESTAMP,
                  isOnline: true,
                  // username wird beim ersten Profil-Setup gesetzt
                };

                await userRef.set(userData);

                // 🚀 Cache User-Daten für Offline-Zugriff
                await offlineFirebaseService.cacheData(
                  `users/${user.uid}`,
                  userData,
                  60 * 60 * 1000 // 1 Stunde Cache
                );
              } else {
                // Bestehender Benutzer - Online-Status aktualisieren
                const updateData = {
                  lastActive: Firebase.database.ServerValue.TIMESTAMP,
                  isOnline: true,
                };

                await userRef.update(updateData);

                // 🚀 Cache aktualisierte User-Daten
                const userData = snapshot.val();
                await offlineFirebaseService.cacheData(
                  `users/${user.uid}`,
                  { ...userData, ...updateData },
                  60 * 60 * 1000 // 1 Stunde Cache
                );
              }

              // Bei Disconnect offline setzen
              userRef.child('isOnline').onDisconnect().set(false);
              userRef
                .child('lastActive')
                .onDisconnect()
                .set(Firebase.database.ServerValue.TIMESTAMP);
            }
          });
        } catch (error) {
          console.error('Fehler bei Firebase-Initialisierung:', error);
          setAuthStateResolved(true); // Auch bei Fehler Auth-State als resolved setzen
        }
      })
      .catch((error) => {
        console.error('Fehler beim Laden des Firebase-Moduls:', error);
        setAuthStateResolved(true);
      });
  }, []);

  if (!firebaseInitialized || !authStateResolved) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: '#0a0a0a',
          color: '#00fed7',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <div
          style={{
            width: '50px',
            height: '50px',
            border: '4px solid #00fed7',
            borderTop: '4px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <div>Initialisierung...</div>
        {isOffline && (
          <div
            style={{
              color: '#ff9800',
              fontSize: '0.9rem',
              textAlign: 'center',
              marginTop: '10px',
            }}
          >
            Offline-Modus aktiv
            <br />
            Gespeicherte Daten werden geladen...
          </div>
        )}
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, setUser, authStateResolved }}>
      {children}
    </AuthContext.Provider>
  );
};
export const useAuth = () => useContext(AuthContext);
export function App() {
  return (
    <Router>
      <GlobalLoadingProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </GlobalLoadingProvider>
    </Router>
  );
}

function AppContent() {
  return (
    <OptimizedFriendsProvider>
      <NotificationProvider>
        <SeriesListProvider>
          <MovieListProvider>
            <StatsProvider>
              <BadgeProvider>
                <BadgeNotificationManager>
                  <Helmet>
                    <title>
                      TV-RANK - Entdecke, bewerte und verwalte deine
                      Lieblingsserien
                    </title>
                    <meta
                      name='description'
                      content='Entdecke, bewerte und verwalte deine Lieblingsserien mit TV-RANK. Finde neue Serien, führe deine Watchlist und verpasse keine Folge mehr.'
                    />
                    <meta
                      name='keywords'
                      content='Serien, TV, Bewertung, Watchlist, TV-RANK'
                    />
                    <meta
                      property='og:title'
                      content='TV-RANK - Entdecke, bewerte und verwalte deine Lieblingsserien'
                    />
                    <meta
                      property='og:description'
                      content='Entdecke, bewerte und verwalte deine Lieblingsserien mit TV-RANK. Finde neue Serien, führe deine Watchlist und verpasse keine Folge mehr.'
                    />
                    <meta property='og:image' content='/favicon.ico' />
                    <meta property='og:url' content='https://tv-rank.de' />
                    <meta name='twitter:card' content='summary_large_image' />
                  </Helmet>
                  <ThemeProvider theme={theme}>
                    <CssBaseline />
                    <div className='w-full'>
                      <UsernameRequiredDialog />
                      <main className='w-full'>
                        <Suspense
                          fallback={
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                minHeight: '50vh',
                                color: '#00fed7',
                              }}
                            >
                              ⏳ Lade Komponente...
                            </div>
                          }
                        >
                          <Routes>
                            <Route path='/login' element={<LoginPage />} />
                            <Route
                              path='/register'
                              element={<RegisterPage />}
                            />
                            <Route
                              path='/'
                              element={
                                <AuthContext.Consumer>
                                  {(auth) => {
                                    if (!auth?.authStateResolved) {
                                      return (
                                        <div
                                          style={{
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            minHeight: '50vh',
                                            color: '#00fed7',
                                          }}
                                        >
                                          ⏳ Wird geladen...
                                        </div>
                                      );
                                    }

                                    if (auth?.user) {
                                      return (
                                        <VerifiedRoute>
                                          <MainPage />
                                        </VerifiedRoute>
                                      );
                                    } else {
                                      return <StartPage />;
                                    }
                                  }}
                                </AuthContext.Consumer>
                              }
                            />
                            <Route
                              path='/friends'
                              element={
                                <AuthContext.Consumer>
                                  {(auth) =>
                                    auth?.user ? (
                                      <VerifiedRoute>
                                        <FriendsPage />
                                      </VerifiedRoute>
                                    ) : (
                                      <Navigate to='/login' />
                                    )
                                  }
                                </AuthContext.Consumer>
                              }
                            />
                            <Route
                              path='/public/:friendId'
                              element={<PublicListPage />}
                            />
                            <Route
                              path='/profile/:userId'
                              element={
                                <AuthContext.Consumer>
                                  {(auth) =>
                                    auth?.user ? (
                                      <VerifiedRoute>
                                        <UserProfilePage />
                                      </VerifiedRoute>
                                    ) : (
                                      <Navigate to='/login' />
                                    )
                                  }
                                </AuthContext.Consumer>
                              }
                            />
                            <Route path='/duckfacts' element={<DuckFacts />} />
                            <Route
                              path='/movies'
                              element={
                                <AuthContext.Consumer>
                                  {(auth) =>
                                    auth?.user ? (
                                      <VerifiedRoute>
                                        <MoviePage />
                                      </VerifiedRoute>
                                    ) : (
                                      <StartPage />
                                    )
                                  }
                                </AuthContext.Consumer>
                              }
                            />
                            <Route path='*' element={<Navigate to='/' />} />
                          </Routes>
                        </Suspense>
                      </main>
                    </div>
                  </ThemeProvider>
                </BadgeNotificationManager>
              </BadgeProvider>
            </StatsProvider>
          </MovieListProvider>
        </SeriesListProvider>
      </NotificationProvider>
    </OptimizedFriendsProvider>
  );
}

export default App;
