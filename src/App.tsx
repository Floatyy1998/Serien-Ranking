import { CssBaseline, ThemeProvider } from '@mui/material';
import Firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { createContext, lazy, useContext, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from 'react-router-dom';
import { VerifiedRoute } from './components/auth/VerifiedRoute';
import { UsernameRequiredDialog } from './components/dialogs/UsernameRequiredDialog';
import { FriendsProvider } from './contexts/FriendsProvider';
import { GlobalLoadingProvider } from './contexts/GlobalLoadingContext';
import { MovieListProvider } from './contexts/MovieListProvider';
import { NotificationProvider } from './contexts/NotificationProvider';
import { SeriesListProvider } from './contexts/SeriesListProvider';
import { StatsProvider } from './contexts/StatsProvider';
import { FriendSeriesListPage } from './pages/FriendSeriesListPage';
import { FriendsPage } from './pages/FriendsPage';
import MainPage from './pages/MainPage';
import MoviePage from './pages/MoviePage';
import SharedSeriesList from './pages/SharedSeriesList';
import { UserProfilePage } from './pages/UserProfilePage';
import { theme } from './theme';
// Nur diese bleiben lazy
const LoginPage = lazy(() => import('./components/auth/LoginPage'));
const RegisterPage = lazy(() => import('./components/auth/RegisterPage'));
const StartPage = lazy(() => import('./pages/StartPage'));
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
  useEffect(() => {
    import('./firebase/initFirebase').then((module) => {
      module.initFirebase();
      Firebase.auth().onAuthStateChanged(async (user) => {
        setUser(user);
        setAuthStateResolved(true);

        // User Profile in Firebase initialisieren falls noch nicht vorhanden
        if (user) {
          const userRef = Firebase.database().ref(`users/${user.uid}`);
          const snapshot = await userRef.once('value');

          if (!snapshot.exists()) {
            // Neuer Benutzer - nur grundlegende Daten setzen (Username wird in ProfileDialog gesetzt)
            await userRef.set({
              uid: user.uid,
              email: user.email,
              displayName:
                user.displayName || user.email?.split('@')[0] || 'Unbekannt',
              photoURL: user.photoURL || null,
              createdAt: Firebase.database.ServerValue.TIMESTAMP,
              lastActive: Firebase.database.ServerValue.TIMESTAMP,
              isOnline: true,
              // username wird beim ersten Profil-Setup gesetzt
            });
          } else {
            // Bestehender Benutzer - Online-Status aktualisieren
            await userRef.update({
              lastActive: Firebase.database.ServerValue.TIMESTAMP,
              isOnline: true,
            });
          }

          // Bei Disconnect offline setzen
          userRef.child('isOnline').onDisconnect().set(false);
          userRef
            .child('lastActive')
            .onDisconnect()
            .set(Firebase.database.ServerValue.TIMESTAMP);
        }
      });
      setFirebaseInitialized(true);
    });
  }, []);
  if (!firebaseInitialized || !authStateResolved) {
    return null; // Lass das GlobalLoadingProvider das Skeleton zeigen
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
        <AppContent />
      </GlobalLoadingProvider>
    </Router>
  );
}

function AppContent() {
  return (
    <AuthProvider>
      <FriendsProvider>
        <NotificationProvider>
          <SeriesListProvider>
            <MovieListProvider>
              <StatsProvider>
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
                      <Routes>
                        <Route path='/login' element={<LoginPage />} />
                        <Route path='/register' element={<RegisterPage />} />
                        <Route
                          path='/'
                          element={
                            <AuthContext.Consumer>
                              {(auth) =>
                                auth?.user ? (
                                  <VerifiedRoute>
                                    <MainPage />
                                  </VerifiedRoute>
                                ) : (
                                  <StartPage />
                                )
                              }
                            </AuthContext.Consumer>
                          }
                        />
                        <Route
                          path='/shared-list/:linkId'
                          element={<SharedSeriesList />}
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
                          path='/friend/:friendId'
                          element={
                            <AuthContext.Consumer>
                              {(auth) =>
                                auth?.user ? (
                                  <VerifiedRoute>
                                    <FriendSeriesListPage />
                                  </VerifiedRoute>
                                ) : (
                                  <Navigate to='/login' />
                                )
                              }
                            </AuthContext.Consumer>
                          }
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
                    </main>
                  </div>
                </ThemeProvider>
              </StatsProvider>
            </MovieListProvider>
          </SeriesListProvider>
        </NotificationProvider>
      </FriendsProvider>
    </AuthProvider>
  );
}

export default App;
