import { CssBaseline, ThemeProvider } from '@mui/material';
import { lazy, Suspense } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { AuthProvider } from './components/auth/AuthProvider';
import { MovieListProvider } from './contexts/MovieListProvider';
import { NotificationProvider as GeneralNotificationProvider } from './contexts/NotificationContext';
import { NotificationProvider } from './contexts/NotificationProvider';
import { OptimizedFriendsProvider } from './contexts/OptimizedFriendsProvider';
import { SeriesListProvider } from './contexts/OptimizedSeriesListProvider';
import { StatsProvider } from './features/stats/StatsProvider';
import './mobile/styles/performance.css';
import { useAuth } from './components/auth/AuthProvider';
import { updateTheme } from './theme';
import { useEffect } from 'react';

// Lazy load mobile app for all platforms
const MobileApp = lazy(() => import('./mobile/MobileApp').then((m) => ({ default: m.MobileApp })));
const StartPage = lazy(() =>
  import('./pages/MobileStartPage').then((m) => ({
    default: m.MobileStartPage,
  }))
);
const LoginPage = lazy(() =>
  import('./features/auth/MobileLoginPage').then((m) => ({
    default: m.MobileLoginPage,
  }))
);
const RegisterPage = lazy(() =>
  import('./features/auth/MobileRegisterPage').then((m) => ({
    default: m.MobileRegisterPage,
  }))
);
const PasswordResetPage = lazy(() =>
  import('./features/auth/PasswordResetPage').then((m) => ({
    default: m.PasswordResetPage,
  }))
);
const PublicProfilePage = lazy(() =>
  import('./mobile/pages/MobilePublicProfilePage').then((m) => ({
    default: m.MobilePublicProfilePage,
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

function updateThemeColorMeta(color: string) {
  const metaThemeColor = document.querySelector("meta[name='theme-color']");
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', color);
  }
}

function adjustBrightness(color: string, percent: number) {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;
  return (
    '#' +
    (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
  );
}

const AppContent = () => {
  const { user, authStateResolved } = useAuth();

  useEffect(() => {
    // Load theme from localStorage or user settings
    if (user && user.theme) {
      const root = document.documentElement;
      root.style.setProperty('--theme-primary', user.theme.primaryColor || '#00fed7');
      const primaryHover = adjustBrightness(user.theme.primaryColor || '#00fed7', 10);
      root.style.setProperty('--theme-primary-hover', primaryHover);
      
      // Update theme-color Meta-Tag for PWA Status Bar
      updateThemeColorMeta(user.theme.primaryColor || '#000000');
      
      window.dispatchEvent(new CustomEvent('themeChanged'));
    } else {
      // Load theme from localStorage if available
      const localTheme = localStorage.getItem('customTheme');
      if (localTheme) {
        try {
          const theme = JSON.parse(localTheme);
          const root = document.documentElement;
          root.style.setProperty('--theme-primary', theme.primaryColor || '#00fed7');
          const primaryHover = adjustBrightness(theme.primaryColor || '#00fed7', 10);
          root.style.setProperty('--theme-primary-hover', primaryHover);
          root.style.setProperty('--theme-accent', theme.accentColor || '#ff6b6b');
          root.style.setProperty('--theme-background', theme.backgroundColor || '#000000');
          root.style.setProperty('--theme-surface', theme.surfaceColor || '#2d2d30');
          root.style.setProperty('--theme-text-primary', theme.primaryColor || '#00fed7');
          root.style.setProperty('--theme-text-secondary', '#ffffff');
          
          updateThemeColorMeta(theme.backgroundColor || '#000000');
          window.dispatchEvent(new CustomEvent('themeChanged'));
        } catch (error) {
          console.error('Error loading local theme:', error);
        }
      }
    }
  }, [user]);

  // Wait for auth to be resolved before rendering
  if (!authStateResolved) {
    return <PageLoader />;
  }

  return (
    <ThemeProvider theme={updateTheme()}>
      <CssBaseline />
      
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route path="/start" element={<StartPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/reset-password" element={<PasswordResetPage />} />
          <Route path="/public/profile/:username" element={<PublicProfilePage />} />

          {/* Protected routes */}
          <Route
            path="/*"
            element={
              user ? (
                <StatsProvider>
                  <SeriesListProvider>
                    <MovieListProvider>
                      <OptimizedFriendsProvider>
                        <NotificationProvider>
                          <GeneralNotificationProvider>
                            <MobileApp />
                          </GeneralNotificationProvider>
                        </NotificationProvider>
                      </OptimizedFriendsProvider>
                    </MovieListProvider>
                  </SeriesListProvider>
                </StatsProvider>
              ) : (
                <Navigate to="/start" replace />
              )
            }
          />
        </Routes>
      </Suspense>
    </ThemeProvider>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
export { useAuth };