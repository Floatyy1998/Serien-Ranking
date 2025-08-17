import { CssBaseline, ThemeProvider } from '@mui/material';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { BackgroundMedia } from './components/ui/BackgroundMedia';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import React, {
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
import { EmailVerificationBanner } from './components/auth/EmailVerificationBanner';
// BadgeNotificationManager entfernt - BadgeProvider übernimmt alle Badge-Notifications
import { UsernameRequiredDialog } from './components/domain/dialogs/UsernameRequiredDialog';
import { UpdateNotification } from './components/ui/UpdateNotification';
// Badge Migration Tools für Development
import { GlobalLoadingProvider } from './contexts/GlobalLoadingContext';
import { MovieListProvider } from './contexts/MovieListProvider';
import { NotificationProvider } from './contexts/NotificationProvider';
import { OptimizedFriendsProvider } from './contexts/OptimizedFriendsProvider';
import { SeriesListProvider } from './contexts/OptimizedSeriesListProvider';
import { BadgeProvider } from './features/badges/BadgeProvider';
import { StatsProvider } from './features/stats/StatsProvider';
import { FriendsPage } from './pages/FriendsPage';
import MainPage from './pages/MainPage';
import { PublicListPage } from './pages/PublicListPage';
import StartPage from './pages/StartPage'; // Eager loading für bessere Offline-Performance
import { UserProfilePage } from './pages/UserProfilePage';
import { offlineFirebaseService } from './services/offlineFirebaseService';
import { updateTheme } from './theme';

// Nur diese bleiben lazy
const LoginPage = lazy(() => import('./features/auth/LoginPage'));
const RegisterPage = lazy(() => import('./features/auth/RegisterPage'));
const DuckFacts = lazy(() => import('./features/DuckFacts'));
export const AuthContext = createContext<{
  user: firebase.User | null;
  setUser: React.Dispatch<React.SetStateAction<firebase.User | null>>;
  authStateResolved: boolean;
} | null>(null);
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<firebase.User | null>(null);
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

          firebase.auth().onAuthStateChanged(async (user) => {
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
              // WICHTIG: Lokales Theme hat Vorrang - Cloud-Theme nur als Fallback
              const localTheme = localStorage.getItem('customTheme');
              
              if (!localTheme) {
                // Kein lokales Theme vorhanden - versuche Cloud-Theme zu laden
                console.log('No local theme found, checking for cloud theme as fallback...');
                const themeRef = firebase.database().ref(`users/${user.uid}/theme`);
                try {
                  const themeSnapshot = await themeRef.once('value');
                  const cloudTheme = themeSnapshot.val();
                  
                  if (cloudTheme) {
                    console.log('Cloud theme found as fallback, applying...');
                    // Cloud-Theme als Fallback verwenden
                    const root = document.documentElement;
                    root.style.setProperty('--theme-primary', cloudTheme.primaryColor || '#00fed7');
                    const primaryHover = adjustBrightness(cloudTheme.primaryColor || '#00fed7', 10);
                    root.style.setProperty('--theme-primary-hover', primaryHover);
                    root.style.setProperty('--theme-accent', cloudTheme.accentColor || '#ff6b6b');
                    root.style.setProperty('--theme-background', cloudTheme.backgroundColor || '#000000');
                    root.style.setProperty('--theme-surface', cloudTheme.surfaceColor || '#2d2d30');
                    root.style.setProperty('--theme-text-primary', cloudTheme.primaryColor || '#00fed7');
                    root.style.setProperty('--theme-text-secondary', '#ffffff');
                    
                    // Update theme-color Meta-Tag für PWA Status Bar
                    updateThemeColorMeta(cloudTheme.backgroundColor || '#000000');
                    
                    // WICHTIG: Cloud-Theme NICHT automatisch lokal speichern
                    // Sonst würde es zum lokalen Theme werden und könnte nicht mehr überschrieben werden
                    // User muss explizit im Theme-Editor "Speichern" klicken um ein lokales Theme zu erstellen
                    
                    window.dispatchEvent(new CustomEvent('themeChanged'));
                  }
                } catch (error) {
                  console.error('Error loading cloud theme:', error);
                }
              } else {
                console.log('Local theme exists, keeping it (has priority over cloud theme - cloud updates are ignored)');
              }
              
              const userRef = firebase.database().ref(`users/${user.uid}`);
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
                  createdAt: firebase.database.ServerValue.TIMESTAMP,
                  lastActive: firebase.database.ServerValue.TIMESTAMP,
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
                  lastActive: firebase.database.ServerValue.TIMESTAMP,
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
                .set(firebase.database.ServerValue.TIMESTAMP);
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
      <LoadingSpinner 
        text="Initialisierung..." 
        showOfflineMessage={isOffline}
      />
    );
  }

  return (
    <AuthContext.Provider value={{ user, setUser, authStateResolved }}>
      {children}
    </AuthContext.Provider>
  );
};
export const useAuth = () => useContext(AuthContext);
// Theme beim App-Start laden
// Funktion um eine Farbe heller oder dunkler zu machen
const adjustBrightness = (color: string, percent: number) => {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return '#' + (0x1000000 + (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 + 
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 + 
    (B < 255 ? (B < 1 ? 0 : B) : 255)).toString(16).slice(1);
};

// Funktion zum Updaten des theme-color Meta-Tags
const updateThemeColorMeta = (backgroundColor: string) => {
  const metaThemeColor = document.getElementById('theme-color-meta') as HTMLMetaElement;
  if (metaThemeColor) {
    metaThemeColor.content = backgroundColor;
  }
};

const loadSavedTheme = async (userId?: string) => {
  let theme = null;
  
  // WICHTIG: Lokales Theme hat Vorrang vor Cloud-Theme
  // Erst lokales Theme versuchen
  const savedTheme = localStorage.getItem('customTheme');
  if (savedTheme) {
    try {
      theme = JSON.parse(savedTheme);
      console.log('Lokales Theme geladen (hat Vorrang):', theme);
    } catch (error) {
      console.error('Fehler beim Laden des lokalen Themes:', error);
    }
  }
  
  // Falls kein lokales Theme, Cloud-Theme als Fallback laden
  if (!theme && userId) {
    try {
      const themeRef = firebase.database().ref(`users/${userId}/theme`);
      const snapshot = await themeRef.once('value');
      theme = snapshot.val();
      if (theme) {
        console.log('Cloud-Theme als Fallback geladen:', theme);
      }
    } catch (error) {
      console.error('Fehler beim Laden des Cloud-Themes:', error);
    }
  }
  
  // Theme anwenden oder Defaults verwenden
  const root = document.documentElement;
  
  if (theme) {
    root.style.setProperty('--theme-primary', theme.primaryColor || '#00fed7');
    // Hover-Farbe automatisch berechnen (etwas heller/dunkler)
    const primaryHover = adjustBrightness(theme.primaryColor || '#00fed7', 10);
    root.style.setProperty('--theme-primary-hover', primaryHover);
    root.style.setProperty('--theme-accent', theme.accentColor || '#ff6b6b');
    root.style.setProperty('--theme-background', theme.backgroundColor || '#000000');
    root.style.setProperty('--theme-surface', theme.surfaceColor || '#2d2d30');
    root.style.setProperty('--theme-text-primary', theme.primaryColor || '#00fed7');
    root.style.setProperty('--theme-text-secondary', '#ffffff');
    
    // Update theme-color Meta-Tag für PWA Status Bar
    updateThemeColorMeta(theme.backgroundColor || '#000000');
  } else {
    // Stelle sicher, dass Default-Werte gesetzt sind
    root.style.setProperty('--theme-primary', '#00fed7');
    root.style.setProperty('--theme-primary-hover', adjustBrightness('#00fed7', 10));
    root.style.setProperty('--theme-accent', '#ff6b6b');
    root.style.setProperty('--theme-background', '#000000');
    root.style.setProperty('--theme-surface', '#2d2d30');
    root.style.setProperty('--theme-text-primary', '#00fed7');
    root.style.setProperty('--theme-text-secondary', '#ffffff');
    
    // Update theme-color Meta-Tag für PWA Status Bar
    updateThemeColorMeta('#000000');
  }
};

export function App() {
  const [isThemeLoaded, setIsThemeLoaded] = React.useState(false);
  
  // Theme beim App-Start laden - aber NACH Firebase Initialisierung
  React.useEffect(() => {
    // Sofort lokales Theme laden für schnellen Start (braucht kein Firebase)
    const initializeTheme = async () => {
      // Erst mal lokales Theme laden (sofort verfügbar, braucht kein Firebase)
      await loadSavedTheme();
      
      // Theme wurde geladen - State setzen
      setIsThemeLoaded(true);
      
      // Wichtig: Theme-Change Event nach kurzer Verzögerung auslösen
      // damit Material-UI Zeit hat sich zu initialisieren
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('themeChanged'));
      }, 100);
    };
    
    initializeTheme();
  }, []);

  // Warte bis Theme geladen ist bevor App gerendert wird
  if (!isThemeLoaded) {
    return <LoadingSpinner text="Lade Theme..." />;
  }

  return (
    <Router>
      <GlobalLoadingProvider>
        <AuthProvider>
          <BackgroundMedia />
          <AppContent />
        </AuthProvider>
      </GlobalLoadingProvider>
    </Router>
  );
}

function AppContent() {
  // Theme initial mit updateTheme erstellen um CSS-Variablen zu lesen
  const [currentTheme, setCurrentTheme] = React.useState(() => updateTheme());

  // Theme bei Änderungen aktualisieren
  React.useEffect(() => {
    const handleThemeChange = () => {
      const newTheme = updateTheme();
      setCurrentTheme(newTheme);
    };

    // Event Listener für Theme-Änderungen
    window.addEventListener('themeChanged', handleThemeChange);
    
    // Initiales Theme nochmal updaten falls CSS-Variablen sich geändert haben
    handleThemeChange();
    
    return () => {
      window.removeEventListener('themeChanged', handleThemeChange);
    };
  }, []);

  return (
    <OptimizedFriendsProvider>
      <NotificationProvider>
        <SeriesListProvider>
          <MovieListProvider>
            <StatsProvider>
              <BadgeProvider>
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
                <ThemeProvider theme={currentTheme}>
                  <CssBaseline />
                  <div className='w-full'>
                    <UsernameRequiredDialog />
                    <UpdateNotification />
                    <main className='w-full'>
                      <Suspense
                        fallback={
                          <LoadingSpinner 
                            text="⏳ Lade Komponente..." 
                            variant="centered"
                          />
                        }
                      >
                        <Routes>
                          <Route path='/login' element={<LoginPage />} />
                          <Route path='/register' element={<RegisterPage />} />
                          <Route
                            path='/'
                            element={
                              <AuthContext.Consumer>
                                {(auth) => {
                                  if (!auth?.authStateResolved) {
                                    return (
                                      <LoadingSpinner 
                                        text="⏳ Wird geladen..." 
                                        variant="centered"
                                      />
                                    );
                                  }

                                  if (auth?.user) {
                                    return (
                                      <EmailVerificationBanner>
                                        <MainPage />
                                      </EmailVerificationBanner>
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
                                    <EmailVerificationBanner>
                                      <FriendsPage />
                                    </EmailVerificationBanner>
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
                                    <EmailVerificationBanner>
                                      <UserProfilePage />
                                    </EmailVerificationBanner>
                                  ) : (
                                    <Navigate to='/login' />
                                  )
                                }
                              </AuthContext.Consumer>
                            }
                          />
                          <Route path='/duckfacts' element={<DuckFacts />} />
                          <Route path='*' element={<Navigate to='/' />} />
                        </Routes>
                      </Suspense>
                    </main>
                  </div>
                </ThemeProvider>
              </BadgeProvider>
            </StatsProvider>
          </MovieListProvider>
        </SeriesListProvider>
      </NotificationProvider>
    </OptimizedFriendsProvider>
  );
}

export default App;
