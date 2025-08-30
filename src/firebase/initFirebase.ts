import Firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database';
import 'firebase/compat/storage';

export const initFirebase = () => {
  const config = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.VITE_FIREBASE_DATABASE_URL,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
    measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID,
  };

  // Überprüfe kritische Konfigurationswerte
  if (!config.apiKey || !config.authDomain || !config.projectId) {
    // console.error('Firebase: Kritische Konfigurationswerte fehlen!', {
    //   apiKey: !!config.apiKey,
    //   authDomain: !!config.authDomain,
    //   projectId: !!config.projectId,
    // });
    throw new Error(
      'Firebase-Konfiguration unvollständig. Überprüfen Sie die .env-Datei.'
    );
  }

  if (!Firebase.apps.length) {
    try {
      Firebase.initializeApp(config);
    } catch (error) {
      // console.error('Fehler bei Firebase-Initialisierung:', error);
      throw error;
    }
  }
};
