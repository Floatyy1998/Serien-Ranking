import firebase from 'firebase/compat/app';
import { createContext, useContext, useEffect, useState } from 'react';
import { offlineFirebaseService } from '../../services/offlineFirebaseService';

interface AuthContextType {
  user: firebase.User | null;
  setUser: React.Dispatch<React.SetStateAction<firebase.User | null>>;
  authStateResolved: boolean;
  isOffline: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<firebase.User | null>(null);
  const [authStateResolved, setAuthStateResolved] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);

  // Monitor online/offline status
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

  // Initialize Firebase
  useEffect(() => {
    import('../../firebase/initFirebase')
      .then((module) => {
        try {
          module.initFirebase();
          setFirebaseInitialized(true);
          window.setAppReady?.('firebase', true);
        } catch (error) {
          console.error('Firebase initialization error:', error);
          setAuthStateResolved(true);
          window.setAppReady?.('firebase', true);
        }
      })
      .catch((error) => {
        console.error('Failed to load Firebase module:', error);
        setAuthStateResolved(true);
        window.setAppReady?.('firebase', true);
      });
  }, []);

  // Handle auth state changes
  useEffect(() => {
    if (!firebaseInitialized) return;

    let unsubscribe: firebase.Unsubscribe | undefined;

    const setupAuthListener = async () => {
      if (isOffline) {
        try {
          const cachedUser = await offlineFirebaseService.getCachedUser();
          if (cachedUser) {
            setUser(cachedUser as firebase.User);
          }
        } catch (error) {
          console.error('Failed to get cached user:', error);
        }
        setAuthStateResolved(true);
        return;
      }

      try {
        unsubscribe = firebase.auth().onAuthStateChanged(
          async (firebaseUser) => {
            if (firebaseUser) {
              try {
                await offlineFirebaseService.cacheUser(firebaseUser);

                // Set up user profile if needed
                const userRef = firebase.database().ref(`users/${firebaseUser.uid}`);
                const snapshot = await userRef.once('value');

                if (!snapshot.exists()) {
                  const userData = {
                    email: firebaseUser.email,
                    displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
                    profilePicture: firebaseUser.photoURL || null,
                    createdAt: firebase.database.ServerValue.TIMESTAMP,
                    lastLogin: firebase.database.ServerValue.TIMESTAMP,
                  };
                  await userRef.set(userData);
                } else {
                  await userRef.update({
                    lastLogin: firebase.database.ServerValue.TIMESTAMP,
                  });
                }
              } catch (error) {
                console.error('Error setting up user profile:', error);
              }
            } else {
              await offlineFirebaseService.clearCachedUser();
            }

            setUser(firebaseUser);
            setAuthStateResolved(true);
            window.setAppReady?.('auth', true);
            window.setAppReady?.('emailVerification', true);
          },
          (error) => {
            console.error('Auth state change error:', error);
            setAuthStateResolved(true);
            window.setAppReady?.('auth', true);
            window.setAppReady?.('emailVerification', true);
          }
        );
      } catch (error) {
        console.error('Failed to set up auth listener:', error);
        setAuthStateResolved(true);
      }
    };

    setupAuthListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [firebaseInitialized, isOffline]);

  return (
    <AuthContext.Provider value={{ user, setUser, authStateResolved, isOffline }}>
      {children}
    </AuthContext.Provider>
  );
};
