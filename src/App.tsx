import { CssBaseline, ThemeProvider } from '@mui/material';
import { Suspense, useEffect, useState } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { EmailVerificationBanner } from './components/auth/EmailVerificationBanner';
// BadgeNotificationManager entfernt - BadgeProvider übernimmt alle Badge-Notifications
// Badge Migration Tools für Development
import { MangaListProvider } from './contexts/MangaListProvider';
import { MovieListProvider } from './contexts/MovieListProvider';
import { NotificationProvider as GeneralNotificationProvider } from './contexts/NotificationContext';
import { OptimizedFriendsProvider } from './contexts/OptimizedFriendsProvider';
import { SeriesListProvider } from './contexts/OptimizedSeriesListProvider';
import { RatingsStateProvider } from './contexts/RatingsStateContext';
import { BadgeProvider } from './features/badges/BadgeProvider';
import { StatsProvider } from './features/stats/StatsProvider';
import { DynamicThemeProvider } from './contexts/ThemeContext';
import { CookieConsentBanner } from './components/CookieConsentBanner';
import { ElectronUpdateToast } from './components/ElectronUpdateToast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { RouteTracker } from './components/RouteTracker';

import './styles/performance.css';
import { updateTheme } from './theme';
import { AuthProvider } from './authProvider';
import { AuthContext } from './AuthContext';
import { loadSavedTheme } from './themeHelpers';
import { lazy } from 'react';

// Retry wrapper: on chunk load failure (after deploy), reload the page once
const RELOAD_KEY = 'chunk-reload';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function lazyWithRetry(factory: () => Promise<any>) {
  return lazy(() =>
    factory().catch((error: unknown) => {
      const alreadyReloaded = sessionStorage.getItem(RELOAD_KEY);
      if (!alreadyReloaded) {
        sessionStorage.setItem(RELOAD_KEY, '1');
        window.location.reload();
        return new Promise(() => {});
      }
      sessionStorage.removeItem(RELOAD_KEY);
      throw error;
    })
  );
}

// Lazy load mobile app for all platforms
const MobileApp = lazyWithRetry(() =>
  import('./MobileApp').then((m) => ({ default: m.MobileApp }))
);
const StartPage = lazyWithRetry(() =>
  import('./pages/Start').then((m) => ({
    default: m.StartPage,
  }))
);
const LoginPage = lazyWithRetry(() =>
  import('./pages/Auth/LoginPage').then((m) => ({
    default: m.LoginPage,
  }))
);
const RegisterPage = lazyWithRetry(() =>
  import('./pages/Auth/RegisterPage').then((m) => ({
    default: m.RegisterPage,
  }))
);
const PublicProfilePage = lazyWithRetry(() =>
  import('./pages/PublicProfile').then((m) => ({
    default: m.PublicProfilePage,
  }))
);
const PrivacyPage = lazyWithRetry(() =>
  import('./pages/Privacy').then((m) => ({
    default: m.PrivacyPage,
  }))
);
const ImpressumPage = lazyWithRetry(() =>
  import('./pages/Impressum').then((m) => ({
    default: m.ImpressumPage,
  }))
);

// Loading component
const PageLoader = () => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'var(--theme-background, #000)',
    }}
  >
    <div style={{ color: 'var(--theme-primary, #fff)' }}>Loading...</div>
  </div>
);

export function App() {
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);

  // Theme beim App-Start laden - aber NACH Firebase Initialisierung
  useEffect(() => {
    // Sofort lokales Theme laden für schnellen Start (braucht kein Firebase)
    const initializeTheme = async () => {
      // Erst mal lokales Theme laden (sofort verfügbar, braucht kein Firebase)
      await loadSavedTheme();

      // Theme wurde geladen - State setzen
      setIsThemeLoaded(true);
      window.setAppReady?.('theme', true);
      // console.log('[App] Theme loaded, app ready for display');

      // Wichtig: Theme-Change Event nach kurzer Verzögerung auslösen
      // damit Material-UI Zeit hat sich zu initialisieren
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('themeChanged'));
      }, 100);
    };

    initializeTheme();
  }, []);

  // Kein SplashScreen mehr hier - wird in AppWithSplash gehandelt
  // Warte nur noch auf Theme
  if (!isThemeLoaded) {
    // Zeige nichts - App lädt im Hintergrund während SplashScreen läuft
    return null;
  }

  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
        <CookieConsentBanner />
      </Router>
    </ErrorBoundary>
  );
}

function AppContent() {
  // Theme initial mit updateTheme erstellen um CSS-Variablen zu lesen
  const [currentTheme, setCurrentTheme] = useState(() => updateTheme());

  // Theme bei Änderungen aktualisieren
  useEffect(() => {
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
      <GeneralNotificationProvider>
        <SeriesListProvider>
          <MovieListProvider>
            <MangaListProvider>
              <StatsProvider>
                <BadgeProvider>
                  <RatingsStateProvider>
                    <ThemeProvider theme={currentTheme}>
                      <DynamicThemeProvider>
                        <CssBaseline />
                        <RouteTracker />
                        <ElectronUpdateToast />
                        <div className="w-full">
                          <a href="#main-content" className="skip-to-content">
                            Zum Hauptinhalt springen
                          </a>
                          <main className="w-full" id="main-content" tabIndex={-1}>
                            <Suspense fallback={<PageLoader />}>
                              <Routes>
                                <Route
                                  path="/login"
                                  element={
                                    <AuthContext.Consumer>
                                      {(auth) => (auth?.user ? <Navigate to="/" /> : <LoginPage />)}
                                    </AuthContext.Consumer>
                                  }
                                />
                                <Route
                                  path="/register"
                                  element={
                                    <AuthContext.Consumer>
                                      {(auth) =>
                                        auth?.user ? <Navigate to="/" /> : <RegisterPage />
                                      }
                                    </AuthContext.Consumer>
                                  }
                                />
                                <Route path="/public/:publicId" element={<PublicProfilePage />} />
                                <Route path="/privacy" element={<PrivacyPage />} />
                                <Route path="/impressum" element={<ImpressumPage />} />
                                <Route
                                  path="/*"
                                  element={
                                    <AuthContext.Consumer>
                                      {(auth) => {
                                        // Kein LoadingSpinner mehr - alles wird im SplashScreen geladen
                                        if (auth?.user) {
                                          return (
                                            <EmailVerificationBanner>
                                              <MobileApp />
                                            </EmailVerificationBanner>
                                          );
                                        } else if (auth?.authStateResolved) {
                                          return <StartPage />;
                                        } else {
                                          // Während Auth noch lädt, zeige nichts (Splash Screen ist noch aktiv)
                                          return null;
                                        }
                                      }}
                                    </AuthContext.Consumer>
                                  }
                                />
                                <Route path="*" element={<Navigate to="/" />} />
                              </Routes>
                            </Suspense>
                          </main>
                        </div>
                      </DynamicThemeProvider>
                    </ThemeProvider>
                  </RatingsStateProvider>
                </BadgeProvider>
              </StatsProvider>
            </MangaListProvider>
          </MovieListProvider>
        </SeriesListProvider>
      </GeneralNotificationProvider>
    </OptimizedFriendsProvider>
  );
}

export default App;
