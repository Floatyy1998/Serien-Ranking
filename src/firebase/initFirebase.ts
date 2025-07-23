import Firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database';
import 'firebase/compat/storage';

export const initFirebase = () => {
  const config = {
    apiKey: process.env.VITE_APIKEY,
    authDomain: process.env.VITE_AUTHDOMAIN,
    databaseURL: process.env.VITE_DATABASEURL,
    projectId: process.env.VITE_PROJECTID,
    storageBucket: process.env.VITE_STORAGEBUCKET,
    messagingSenderId: process.env.VITE_MESSAGINGSENDERID,
    appId: process.env.VITE_APPID,
    measurementId: process.env.VITE_MEASUREMENTID,
  };
  if (!Firebase.apps.length) {
    Firebase.initializeApp(config);
  }
};
