import { CssBaseline } from '@mui/material';
import { MotionConfig } from 'framer-motion';
import { Suspense, useEffect, useState } from 'react';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { EmailVerificationBanner } from './components/auth/EmailVerificationBanner';
import { AppProviders } from './AppProviders';
import { useGlobalImageRetry } from './hooks/useGlobalImageRetry';
import { DynamicThemeProvider } from './contexts/ThemeProvider';
import { AppInstallBanner } from './components/AppInstallBanner';
import { CookieConsentBanner } from './components/CookieConsentBanner';
import { ElectronUpdateToast } from './components/ElectronUpdateToast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { RouteTracker } from './components/RouteTracker';

import './styles/performance.css';
import { AuthProvider } from './authProvider';
import { AuthContext } from './contexts/AuthContext';
import { loadSavedTheme } from './themeHelpers';
import { lazy, type ComponentType } from 'react';

// Retry wrapper: on chunk load failure (after deploy), reload the page once
const RELOAD_KEY = 'chunk-reload';
// React.lazy itself constrains T to ComponentType<any>; we mirror that so the
// retry wrapper accepts the same shapes (FC<{}>, ComponentType<Props>, ...).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function lazyWithRetry<T extends ComponentType<any>>(factory: () => Promise<{ default: T }>) {
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
const AccountDeletionPage = lazyWithRetry(() =>
  import('./pages/AccountDeletion').then((m) => ({
    default: m.AccountDeletionPage,
  }))
);
const ImpressumPage = lazyWithRetry(() =>
  import('./pages/Impressum').then((m) => ({
    default: m.ImpressumPage,
  }))
);

// Loading component — themed Spinner statt rohem "Loading..."-Text
const PageLoader = () => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'var(--theme-background, #000000)',
    }}
  >
    <LoadingSpinner />
  </div>
);

export function App() {
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);

  useEffect(() => {
    const initializeTheme = async () => {
      // Lokales Theme sofort laden für schnellen Start (braucht kein Firebase)
      await loadSavedTheme();

      setIsThemeLoaded(true);
      window.setAppReady?.('theme', true);

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
      {/* reducedMotion="user": alle framer-motion-Animationen respektieren
          prefers-reduced-motion global (die CSS-Media-Query allein stoppt
          keine JS-Transforms) */}
      <MotionConfig reducedMotion="user">
        <Router>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
          <CookieConsentBanner />
        </Router>
      </MotionConfig>
    </ErrorBoundary>
  );
}

function AppContent() {
  // App-weiter Bild-Retry: fehlgeschlagene <img>-Loads (TMDB u.a.) automatisch
  // neu laden + Themed-Placeholder-Fallback — deckt Trending, Seasonal, Detail
  // etc. mit EINEM Listener ab.
  useGlobalImageRetry();

  // Das MUI-Theme kommt ausschließlich aus <DynamicThemeProvider> (baut das
  // Objekt-Theme via createMuiTheme aus den --theme-*-CSS-Variablen und
  // reagiert selbst auf 'themeChanged'). Der frühere äußere
  // <ThemeProvider theme={themeConfig}> wurde von MUI komplett ersetzt und ist
  // deshalb entfernt — siehe theme/dynamicTheme.ts createMuiTheme.

  return (
    <AppProviders>
      <DynamicThemeProvider>
        <CssBaseline />
        <RouteTracker />
        <ElectronUpdateToast />
        <AppInstallBanner />
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
                      {(auth) => (auth?.user ? <Navigate to="/" /> : <RegisterPage />)}
                    </AuthContext.Consumer>
                  }
                />
                <Route path="/public/:publicId" element={<PublicProfilePage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/impressum" element={<ImpressumPage />} />
                <Route path="/konto-loeschen" element={<AccountDeletionPage />} />
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
    </AppProviders>
  );
}

export default App;
