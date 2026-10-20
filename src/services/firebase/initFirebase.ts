import { getApp } from 'firebase/app';
import {
  browserLocalPersistence,
  browserSessionPersistence,
  debugErrorMap,
  indexedDBLocalPersistence,
  initializeAuth,
  inMemoryPersistence,
} from 'firebase/auth';
import Firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database';
import 'firebase/compat/storage';
import { appLocale } from '../i18n';
import { hasNativeSocialLogin } from './socialAuth';

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
    throw new Error('Firebase-Konfiguration unvollständig. Überprüfen Sie die .env-Datei.');
  }

  if (!Firebase.apps.length) {
    Firebase.initializeApp(config);
    // Ohne Resolver wartet Auth auf Mobilgeräten nicht auf Googles Iframe (apis.google.com).
    // localStorage zuerst: Android-WebViews räumen IndexedDB, localStorage bleibt; Firebase zieht Alt-Logins um.
    if (hasNativeSocialLogin()) {
      try {
        initializeAuth(getApp(), {
          persistence: [
            browserLocalPersistence,
            indexedDBLocalPersistence,
            browserSessionPersistence,
            inMemoryPersistence,
          ],
          errorMap: debugErrorMap,
        });
      } catch {
        /* compat initialisiert Auth dann mit Resolver */
      }
    }
    // Auth-Mails (Verifizierung, Passwort-Reset) in der App-Sprache verschicken.
    // Greift für Firebases Standard-Templates — angepasste Template-Texte in
    // der Console überschreiben die Lokalisierung.
    try {
      Firebase.auth().languageCode = appLocale;
    } catch {
      /* Auth noch nicht verfügbar — Standardsprache bleibt */
    }
  }
};
