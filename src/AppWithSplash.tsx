import { useEffect, useRef, useState } from 'react';
import { App } from './App';
import { SplashScreen } from './components/ui/SplashScreen';
import { applyDisplayScale, getDisplayScale } from './services/displayScale';

/**
 * Globaler Ready-Tracker
 * Andere Komponenten können window.appReadyStatus setzen
 */
declare global {
  interface Window {
    appReadyStatus: {
      theme: boolean;
      auth: boolean;
      firebase: boolean;
      emailVerification: boolean;
      initialData: boolean;
      homeConfig: boolean;
    };
    setAppReady: (key: keyof Window['appReadyStatus'], value: boolean) => void;
    splashScreenComplete: boolean;
  }
}

if (typeof window !== 'undefined') {
  window.appReadyStatus = {
    theme: false,
    auth: false,
    firebase: false,
    emailVerification: false,
    initialData: false,
    homeConfig: false,
  };

  window.setAppReady = (key, value) => {
    window.appReadyStatus[key] = value;
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

  const currentPath = window.location.pathname;
  const isAuthPage =
    currentPath === '/login' || currentPath === '/register' || currentPath === '/start';
  let hasCachedUser = false;
  try {
    hasCachedUser = !!localStorage.getItem('cachedUser');
  } catch {
    // localStorage gesperrt (Private Mode) → lieber ohne Splash starten
  }

  // Anzeigegröße (zoom) erst anwenden, wenn KEIN Splash sichtbar ist — der
  // Splash soll nie mitskalieren. Sichtbarer Splash → Scale 1, danach echt.
  useEffect(() => {
    const splashVisible = !isAuthPage && hasCachedUser && showSplash;
    applyDisplayScale(splashVisible ? 1 : getDisplayScale());
  }, [isAuthPage, hasCachedUser, showSplash]);

  useEffect(() => {
    // Mount App im Hintergrund nach kurzer Verzögerung
    const mountTimer = setTimeout(() => {
      setIsAppMounted(true);
    }, 200);

    checkInterval.current = setInterval(() => {
      const status = window.appReadyStatus;
      const isReady =
        status.theme &&
        status.auth &&
        status.firebase &&
        status.emailVerification &&
        status.initialData &&
        status.homeConfig;

      if (isReady && !allSystemsReady) {
        setAllSystemsReady(true);
        clearInterval(checkInterval.current);
      }
    }, 100);

    // Hard-Fallback: 8 s. Reicht fuer den seltenen Cold-Start ohne Cache,
    // verhindert aber dass User bei Edge-Cases (langsames Firebase, broken
    // Catalog-Fetch) ewig vor dem Splash sitzen.
    const fallbackTimeout = setTimeout(() => {
      // Splash hat sich bereits selbst geschlossen (via SplashScreen.finish über
      // progress=1) — kein Warning, kein lautes Re-Render.
      if (window.splashScreenComplete) {
        setAllSystemsReady(true);
        return;
      }
      setAllSystemsReady(true);
      if (checkInterval.current) {
        clearInterval(checkInterval.current);
      }
    }, 8000);

    return () => {
      clearTimeout(mountTimer);
      clearTimeout(fallbackTimeout);
      if (checkInterval.current) {
        clearInterval(checkInterval.current);
      }
    };
  }, [allSystemsReady]);

  // Ausgeloggte Besucher (kein gecachter User) bekommen KEINEN Splash:
  // initialData/homeConfig werden ohne Login nie ready → sie säßen sonst
  // bis zum 8s-Fallback vor dem Splash. Die Landing rendert sofort.
  if (isAuthPage || !hasCachedUser) {
    return <App />;
  }

  return (
    <>
      {showSplash && (
        <SplashScreen
          onComplete={() => {
            window.splashScreenComplete = true;
            setShowSplash(false);
          }}
          waitForCondition={() => allSystemsReady}
          minDisplayTime={2000}
        />
      )}
      {/* Eine App-Instanz: versteckt während Splash, sichtbar danach */}
      {isAppMounted && (
        <div
          style={
            showSplash
              ? {
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  visibility: 'hidden',
                  pointerEvents: 'none',
                }
              : undefined
          }
        >
          <App />
        </div>
      )}
    </>
  );
};
