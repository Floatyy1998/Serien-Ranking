import { useEffect, useRef, useState } from 'react';
import App from './App';
import { SplashScreen } from './components/ui/SplashScreen';

/**
 * Globaler Ready-Tracker
 * Andere Komponenten können window.appReadyStatus setzen
 */
declare global {
  interface Window {
    appReadyStatus: {
      theme: boolean;
      auth: boolean;
      emailVerification: boolean;
      initialData: boolean;
    };
    setAppReady: (key: keyof Window['appReadyStatus'], value: boolean) => void;
    splashScreenComplete: boolean;
  }
}

// Initialisiere globalen Status
if (typeof window !== 'undefined') {
  window.appReadyStatus = {
    theme: false,
    auth: false,
    emailVerification: false,
    initialData: false,
  };

  window.setAppReady = (key, value) => {
    window.appReadyStatus[key] = value;
    // console.log(`[AppReady] ${key}: ${value}`, window.appReadyStatus);
  };

  window.splashScreenComplete = false;
}

/**
 * Wrapper-Component die SOFORT den SplashScreen zeigt
 * und im Hintergrund die App lädt
 */
export const AppWithSplash: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [isAppMounted, setIsAppMounted] = useState(false);
  const [allSystemsReady, setAllSystemsReady] = useState(false);
  const checkInterval = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    // Mount App im Hintergrund nach kurzer Verzögerung
    const mountTimer = setTimeout(() => {
      // console.log('[AppWithSplash] Mounting App in background...');
      setIsAppMounted(true);
    }, 200);

    // Prüfe regelmäßig ob alle Systeme ready sind
    checkInterval.current = setInterval(() => {
      const status = window.appReadyStatus;
      const isReady =
        status.theme &&
        status.auth &&
        status.emailVerification &&
        status.initialData;
        // Removed firebase check since we're not using Firebase anymore

      if (isReady && !allSystemsReady) {
        // console.log('[AppWithSplash] 🎉 ALLE SYSTEME BEREIT!', status);
        setAllSystemsReady(true);
        clearInterval(checkInterval.current);
      }
    }, 100);

    // Timeout nach 5 Sekunden als Fallback
    const fallbackTimeout = setTimeout(() => {
      // console.warn('[AppWithSplash] Timeout - zeige App trotzdem');
      setAllSystemsReady(true);
      if (checkInterval.current) {
        clearInterval(checkInterval.current);
      }
    }, 5000);

    return () => {
      clearTimeout(mountTimer);
      clearTimeout(fallbackTimeout);
      if (checkInterval.current) {
        clearInterval(checkInterval.current);
      }
    };
  }, [allSystemsReady]);

  // Check if we're on auth pages - if so, skip splash screen
  const currentPath = window.location.pathname;
  const isAuthPage =
    currentPath === '/login' || 
    currentPath === '/register' || 
    currentPath === '/start' ||
    currentPath === '/reset-password' ||
    currentPath.startsWith('/reset-password'); // Include reset-password with token

  // Skip splash screen for auth pages
  if (isAuthPage) {
    return <App />;
  }

  // Zeige SplashScreen nur für die Hauptapp (nicht für Auth-Seiten)
  if (showSplash) {
    return (
      <>
        <SplashScreen
          onComplete={() => {
            // console.log('[AppWithSplash] Splash complete, hiding...');
            window.splashScreenComplete = true;
            setShowSplash(false);
          }}
          waitForCondition={() => allSystemsReady}
          minDisplayTime={2000}
        />
        {/* Rendere App im Hintergrund (unsichtbar) für Preloading */}
        {isAppMounted && (
          <div style={{ display: 'none', position: 'absolute', left: '-9999px' }}>
            <App />
          </div>
        )}
      </>
    );
  }

  // Nach SplashScreen: App ist vollständig ready
  return <App />;
};
