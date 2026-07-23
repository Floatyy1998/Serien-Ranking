import firebase from 'firebase/compat/app';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { initAnalyticsIfConsented, setAnalyticsUser } from './services/firebase/analytics';
import { offlineFirebaseService } from './services/offlineFirebaseService';
import { adjustBrightness, updateThemeColorMeta } from './themeHelpers';
import { AuthContext } from './contexts/AuthContext';
import { getOfflineBadgeSystem } from './features/badges/offlineBadgeSystem';
import { syncUserSearchIndex } from './services/firebase/userSearchIndex';
import { dbRef, paths, serverTimestamp } from './services/db/ref';
import { isEnglish } from './services/i18n';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<firebase.User | null>(null);
  const [, setFirebaseInitialized] = useState(false);
  const [authStateResolved, setAuthStateResolved] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(true);
  const [_isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
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

    import('./services/firebase/initFirebase')
      .then((module) => {
        if (cancelled) return;
        try {
          module.initFirebase();
          initAnalyticsIfConsented();
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
                    // ignore — corrupted cached user is non-fatal, auth will re-resolve
                  }
                }
              }
            },
            !navigator.onLine ? 2000 : 5000
          ); // Kürzerer Timeout wenn offline

          unsubscribeAuth = firebase.auth().onAuthStateChanged(async (user) => {
            if (authTimeout) clearTimeout(authTimeout);
            setUser(user);
            setAuthStateResolved(true);
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
                  const badgeSystem = getOfflineBadgeSystem(user.uid);

                  // Prüfe ob wir kürzlich schon gecheckt haben (innerhalb der letzten 5 Minuten)
                  const lastCheckKey = `lastBadgeCheck_${user.uid}`;
                  const lastCheck = localStorage.getItem(lastCheckKey);
                  const now = Date.now();
                  const fiveMinutes = 5 * 60 * 1000;

                  if (!lastCheck || now - parseInt(lastCheck) > fiveMinutes) {
                    const newBadges = await badgeSystem.checkForNewBadges();

                    if (newBadges.length > 0) {
                      window.dispatchEvent(
                        new CustomEvent('badgeProgressUpdate', {
                          detail: { newBadges },
                        })
                      );
                    }

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
                const themeRef = dbRef(paths.theme(user.uid));
                try {
                  const themeSnapshot = await themeRef.once('value');
                  const cloudTheme = themeSnapshot.val();

                  if (cloudTheme) {
                    const validHex = (c: string | undefined, fb: string) =>
                      c && /^#?[0-9a-fA-F]{6}$/.test(c) ? c : fb;
                    const primary = validHex(cloudTheme.primaryColor, '#00d123');
                    const accent = validHex(cloudTheme.accentColor, '#008a6e');
                    const bg = validHex(cloudTheme.backgroundColor, '#000000');
                    const surface = validHex(cloudTheme.surfaceColor, '#0f0f0f');

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

                    window.dispatchEvent(new CustomEvent('themeChanged'));
                  }
                } catch {
                  // ignore — cloud theme is a fallback, defaults apply otherwise
                }
              }
              // else: local theme exists, keep it — cloud updates are ignored

              const userRef = dbRef(paths.user(user.uid));
              const snapshot = await userRef.once('value');

              // Neuling auch dann erkennen, wenn der Knoten schon als RUMPF
              // existiert: beim (Social-)Erstlogin mounten App-Provider parallel
              // und schreiben z. B. readTimes/language, BEVOR dieser Check läuft
              // — dann wäre exists() true und der Nutzer bekäme nie ein
              // Onboarding. Echte Bestandsnutzer haben immer ein uid-Feld
              // (RegisterPage/dieser Zweig schreiben es seit jeher).
              const existingData = snapshot.exists()
                ? (snapshot.val() as Record<string, unknown>)
                : null;
              const isFreshAccount =
                !existingData ||
                (existingData.uid === undefined && existingData.onboardingComplete === undefined);

              if (isFreshAccount) {
                // Neuer Benutzer - nur grundlegende Daten setzen (Username wird in ProfileDialog gesetzt)
                const userData = {
                  uid: user.uid,
                  email: user.email,
                  displayName: user.displayName || user.email?.split('@')[0] || 'Unbekannt',
                  photoURL: user.photoURL || null,
                  createdAt: serverTimestamp(),
                  lastActive: serverTimestamp(),
                  isOnline: true,
                  onboardingComplete: false,
                };

                // update statt set: parallel entstandene Felder (readTimes,
                // language …) nicht überschreiben.
                await userRef.update(userData);
                setOnboardingComplete(false);

                // Willkommens-Notification beim Erstlogin (Sprache = App-Sprache).
                try {
                  void userRef.child('notifications').push({
                    type: 'welcome',
                    title: isEnglish() ? 'Welcome to TV-Rank!' : 'Willkommen bei TV-Rank!',
                    message: isEnglish()
                      ? 'Great to have you here — have fun tracking your series and movies! If you run into any problems or have questions, just reach out via the little red bug icon. Thanks for being part of TV-Rank!'
                      : 'Schön, dass du da bist — viel Spaß beim Tracken deiner Serien und Filme! Wenn etwas nicht funktioniert oder du Fragen hast, melde dich einfach über das kleine rote Käfer-Symbol. Danke, dass du bei TV-Rank dabei bist!',
                    timestamp: Date.now(),
                    read: false,
                  });
                } catch {
                  /* best-effort */
                }

                // Self-Heal: Such-Index spiegeln (best-effort, wirft nie)
                void syncUserSearchIndex(user.uid, userData);

                // Cache User-Daten für Offline-Zugriff
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
                  lastActive: serverTimestamp(),
                  isOnline: true,
                };

                await userRef.update(updateData);

                // Self-Heal: Such-Index aus dem frischen Profil-Stand spiegeln
                // (best-effort, wirft nie) — hält userSearchIndex für Bestands-
                // nutzer aktuell, ohne dass ein Admin-Backfill nötig ist.
                void syncUserSearchIndex(user.uid, {
                  username: existingData?.username,
                  displayName: existingData?.displayName,
                  photoURL: existingData?.photoURL,
                  bio: existingData?.bio,
                });

                // Cache aktualisierte User-Daten für Offline-Zugriff
                const userData = snapshot.val();
                await offlineFirebaseService.cacheData(
                  `users/${user.uid}`,
                  { ...userData, ...updateData },
                  60 * 60 * 1000 // 1 Stunde Cache
                );
              }

              // Bei Disconnect offline setzen
              userRef.child('isOnline').onDisconnect().set(false);
              userRef.child('lastActive').onDisconnect().set(serverTimestamp());
            }
          });
        } catch {
          // Auch bei Fehler Auth-State als resolved setzen, sonst haengt der Splash.
          setAuthStateResolved(true);
          window.setAppReady?.('emailVerification', true);
        }
      })
      .catch(() => {
        // Firebase-Modul konnte nicht geladen werden — App im "logged out"-State starten.
        setAuthStateResolved(true);
        window.setAppReady?.('emailVerification', true);
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
