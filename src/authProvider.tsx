import firebase from 'firebase/compat/app';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { initAnalyticsIfConsented, setAnalyticsUser } from './firebase/analytics';
import { offlineFirebaseService } from './services/offlineFirebaseService';
import { adjustBrightness, updateThemeColorMeta } from './themeHelpers';
import { AuthContext } from './AuthContext';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<firebase.User | null>(null);
  const [, setFirebaseInitialized] = useState(false);
  const [authStateResolved, setAuthStateResolved] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(true);
  const [_isOffline, setIsOffline] = useState(!navigator.onLine);

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
    let authTimeout: ReturnType<typeof setTimeout> | null = null;
    let badgeCheckTimeout: ReturnType<typeof setTimeout> | null = null;
    let unsubscribeAuth: (() => void) | null = null;
    let cancelled = false;

    import('./firebase/initFirebase')
      .then((module) => {
        if (cancelled) return;
        try {
          module.initFirebase();
          initAnalyticsIfConsented();
          // Remove compat analytics import (GA4 replaced by RTDB)
          // firebase/compat/analytics is no longer needed
          setFirebaseInitialized(true);
          window.setAppReady?.('firebase', true);

          // Service Worker initialisieren
          if ('serviceWorker' in navigator) {
            // Service Worker Manager ist bereits als Singleton initialisiert
          }

          authTimeout = setTimeout(
            () => {
              setAuthStateResolved(true);
              window.setAppReady?.('emailVerification', true); // No verification check on timeout

              // Wenn offline, versuche gespeicherten User zu laden
              if (!navigator.onLine) {
                const savedUser = localStorage.getItem('cachedUser');
                if (savedUser) {
                  try {
                    const parsedUser = JSON.parse(savedUser);
                    setUser(parsedUser);
                  } catch {
                    // console.error(
                    //   'Fehler beim Laden des gespeicherten Users:',
                    //   error
                    // );
                  }
                }
              }
            },
            !navigator.onLine ? 2000 : 5000
          ); // Kürzerer Timeout wenn offline

          unsubscribeAuth = firebase.auth().onAuthStateChanged(async (user) => {
            if (authTimeout) clearTimeout(authTimeout); // Timeout löschen wenn Auth State sich ändert
            setUser(user);
            setAuthStateResolved(true);
            // Set analytics user for RTDB analytics
            setAnalyticsUser(user?.uid ?? null);
            window.setAppReady?.('auth', true);
            window.setAppReady?.('emailVerification', true); // Email verification check happens elsewhere if needed

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

              // Automatischer Badge-Check beim App-Start
              // Verzögerung damit alle Daten geladen sind
              if (badgeCheckTimeout) clearTimeout(badgeCheckTimeout);
              badgeCheckTimeout = setTimeout(async () => {
                if (cancelled) return;
                try {
                  const { getOfflineBadgeSystem } =
                    await import('./features/badges/offlineBadgeSystem');
                  const badgeSystem = getOfflineBadgeSystem(user.uid);

                  // Prüfe ob wir kürzlich schon gecheckt haben (innerhalb der letzten 5 Minuten)
                  const lastCheckKey = `lastBadgeCheck_${user.uid}`;
                  const lastCheck = localStorage.getItem(lastCheckKey);
                  const now = Date.now();
                  const fiveMinutes = 5 * 60 * 1000;

                  if (!lastCheck || now - parseInt(lastCheck) > fiveMinutes) {
                    const newBadges = await badgeSystem.checkForNewBadges();

                    if (newBadges.length > 0) {
                      // Event für neue Badges auslösen
                      window.dispatchEvent(
                        new CustomEvent('badgeProgressUpdate', {
                          detail: { newBadges },
                        })
                      );
                    }

                    // Zeitstempel für letzten Check speichern
                    localStorage.setItem(lastCheckKey, now.toString());
                  }
                } catch (error) {
                  console.error('Error during automatic badge check:', error);
                }
              }, 3000); // 3 Sekunden Verzögerung für App-Initialisierung
            } else {
              localStorage.removeItem('cachedUser');
            }

            // User Profile in Firebase initialisieren falls noch nicht vorhanden
            if (user) {
              // WICHTIG: Lokales Theme hat Vorrang - Cloud-Theme nur als Fallback
              const localTheme = localStorage.getItem('customTheme');

              if (!localTheme) {
                // Kein lokales Theme vorhanden - versuche Cloud-Theme zu laden
                // console.log(
                //   'No local theme found, checking for cloud theme as fallback...'
                // );
                const themeRef = firebase.database().ref(`users/${user.uid}/theme`);
                try {
                  const themeSnapshot = await themeRef.once('value');
                  const cloudTheme = themeSnapshot.val();

                  if (cloudTheme) {
                    const validHex = (c: string | undefined, fb: string) =>
                      c && /^#?[0-9a-fA-F]{6}$/.test(c) ? c : fb;
                    const primary = validHex(cloudTheme.primaryColor, '#00fed7');
                    const accent = validHex(cloudTheme.accentColor, '#ff6b6b');
                    const bg = validHex(cloudTheme.backgroundColor, '#06090f');
                    const surface = validHex(cloudTheme.surfaceColor, '#0e1420');

                    const root = document.documentElement;
                    root.style.setProperty('--theme-primary', primary);
                    root.style.setProperty('--theme-primary-hover', adjustBrightness(primary, 10));
                    root.style.setProperty('--theme-accent', accent);
                    root.style.setProperty('--theme-background', bg);
                    root.style.setProperty('--theme-surface', surface);
                    root.style.setProperty('--theme-text-primary', primary);
                    root.style.setProperty('--theme-text-secondary', '#ffffff');

                    updateThemeColorMeta(bg);

                    // WICHTIG: Cloud-Theme temporär im localStorage speichern,
                    // damit BackgroundMedia Komponente es aufgreifen kann (speziell für Videos)
                    // Dies ist kein "lokales Theme", sondern nur ein temporärer Cache
                    localStorage.setItem('customTheme', JSON.stringify(cloudTheme));
                    // console.log('Cloud-Theme temporär im localStorage gespeichert für BackgroundMedia');

                    window.dispatchEvent(new CustomEvent('themeChanged'));
                  }
                } catch {
                  // console.error('Error loading cloud theme:', error);
                }
              } else {
                // console.log(
                //   'Local theme exists, keeping it (has priority over cloud theme - cloud updates are ignored)'
                // );
              }

              const userRef = firebase.database().ref(`users/${user.uid}`);
              const snapshot = await userRef.once('value');

              if (!snapshot.exists()) {
                // Neuer Benutzer - nur grundlegende Daten setzen (Username wird in ProfileDialog gesetzt)
                const userData = {
                  uid: user.uid,
                  email: user.email,
                  displayName: user.displayName || user.email?.split('@')[0] || 'Unbekannt',
                  photoURL: user.photoURL || null,
                  createdAt: firebase.database.ServerValue.TIMESTAMP,
                  lastActive: firebase.database.ServerValue.TIMESTAMP,
                  isOnline: true,
                  onboardingComplete: false,
                };

                await userRef.set(userData);
                setOnboardingComplete(false);

                // 🚀 Cache User-Daten für Offline-Zugriff
                await offlineFirebaseService.cacheData(
                  `users/${user.uid}`,
                  userData,
                  60 * 60 * 1000 // 1 Stunde Cache
                );
              } else {
                // Bestehender Benutzer - Online-Status aktualisieren
                const existingData = snapshot.val();
                setOnboardingComplete(existingData?.onboardingComplete !== false);

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
        } catch {
          // console.error('Fehler bei Firebase-Initialisierung:', error);
          setAuthStateResolved(true); // Auch bei Fehler Auth-State als resolved setzen
          window.setAppReady?.('emailVerification', true); // No verification needed when auth fails
        }
      })
      .catch((_error) => {
        // console.error('Fehler beim Laden des Firebase-Moduls:', error);
        setAuthStateResolved(true);
        window.setAppReady?.('emailVerification', true); // No verification when Firebase fails to load
      });

    return () => {
      cancelled = true;
      if (authTimeout) clearTimeout(authTimeout);
      if (badgeCheckTimeout) clearTimeout(badgeCheckTimeout);
      if (unsubscribeAuth) unsubscribeAuth();
    };
  }, []);

  // Kein LoadingSpinner mehr - SplashScreen handled das
  // Provider trotzdem rendern damit initialData gesetzt werden kann

  const setOnboardingCompleteCallback = useCallback(
    (value: React.SetStateAction<boolean>) => setOnboardingComplete(value),
    []
  );
  const setUserCallback = useCallback(
    (value: React.SetStateAction<firebase.User | null>) => setUser(value),
    []
  );

  const authContextValue = useMemo(
    () => ({
      user,
      setUser: setUserCallback,
      authStateResolved,
      onboardingComplete,
      setOnboardingComplete: setOnboardingCompleteCallback,
    }),
    [user, setUserCallback, authStateResolved, onboardingComplete, setOnboardingCompleteCallback]
  );

  return <AuthContext.Provider value={authContextValue}>{children}</AuthContext.Provider>;
};
