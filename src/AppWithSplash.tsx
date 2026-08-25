import { useCallback, useEffect, useRef, useState } from 'react';
import { App } from './App';
import { SplashScreen } from './components/ui/SplashScreen';
import { APP_READY_EVENT, isAppReady } from './services/appReady';
import { applyDisplayScale, getDisplayScale, watchWidthStep } from './services/displayScale';

/**
 * Wrapper-Component die SOFORT den SplashScreen zeigt
 * und im Hintergrund die App lädt
 */
export const AppWithSplash: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [isAppMounted, setIsAppMounted] = useState(false);
  const [allSystemsReady, setAllSystemsReady] = useState(false);
  // Waehrend der Splash ausblendet ist die App schon sichtbar — sonst schaut
  // der Nutzer die Fade-Dauer lang auf einen leeren Hintergrund.
  const [splashHiding, setSplashHiding] = useState(false);

  const currentPath = window.location.pathname;
  const isAuthPage =
    currentPath === '/login' || currentPath === '/register' || currentPath === '/start';
  let hasCachedUser = false;
  try {
    hasCachedUser = !!localStorage.getItem('cachedUser');
  } catch {
    // localStorage gesperrt (Private Mode) → lieber ohne Splash starten
  }

  // Anzeigegröße (zoom) anwenden, sobald der Splash ausblendet — die App liegt
  // dann schon sichtbar darunter und soll nicht erst nach dem Fade umspringen.
  // Der Splash selbst skaliert trotzdem nicht mit: SplashContainer gegen-zoomt
  // ueber --display-scale.
  useEffect(() => {
    const splashVisible = !isAuthPage && hasCachedUser && showSplash && !splashHiding;
    applyDisplayScale(splashVisible ? 1 : getDisplayScale());
  }, [isAuthPage, hasCachedUser, showSplash, splashHiding]);

  // Breiten-Stufe (data-width) an Größenänderungen hängen — sie ist die
  // zoom-feste Alternative zu Media Queries.
  useEffect(watchWidthStep, []);

  // App so frueh wie moeglich mounten: erst ab hier laufen Theme, Firebase-Init
  // und alle Daten-Provider los. Zwei rAF reichen, damit der Splash vorher
  // paintet (~32 ms statt der frueheren 200 ms Pauschal-Verzoegerung, die den
  // gesamten Startvorgang nach hinten geschoben hat).
  useEffect(() => {
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setIsAppMounted(true));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, []);

  const readyRef = useRef(false);
  useEffect(() => {
    const check = () => {
      if (readyRef.current || !isAppReady()) return;
      readyRef.current = true;
      setAllSystemsReady(true);
    };
    check();
    window.addEventListener(APP_READY_EVENT, check);

    // Sicherheitsnetz, falls ein Flag jemals ohne setAppReady gesetzt wird.
    const safetyInterval = setInterval(check, 250);

    // Hard-Fallback: 8 s. Reicht fuer den seltenen Cold-Start ohne Cache,
    // verhindert aber dass User bei Edge-Cases (langsames Firebase, broken
    // Catalog-Fetch) ewig vor dem Splash sitzen.
    const fallbackTimeout = setTimeout(() => {
      readyRef.current = true;
      setAllSystemsReady(true);
    }, 8000);

    return () => {
      window.removeEventListener(APP_READY_EVENT, check);
      clearInterval(safetyInterval);
      clearTimeout(fallbackTimeout);
    };
  }, []);

  const handleHideStart = useCallback(() => setSplashHiding(true), []);
  const handleComplete = useCallback(() => {
    window.splashScreenComplete = true;
    setShowSplash(false);
  }, []);
  const waitForCondition = useCallback(() => allSystemsReady, [allSystemsReady]);

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
          onComplete={handleComplete}
          onHideStart={handleHideStart}
          waitForCondition={waitForCondition}
        />
      )}
      {/* Eine App-Instanz: versteckt während Splash, sichtbar sobald er ausblendet */}
      {isAppMounted && (
        <div
          style={
            showSplash && !splashHiding
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
