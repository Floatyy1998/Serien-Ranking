import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';
import { defineConfig } from 'vite';

dotenv.config();

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Firebase Umgebungsvariablen - korrigierte Namen
    'process.env.VITE_FIREBASE_API_KEY': JSON.stringify(
      process.env.VITE_FIREBASE_API_KEY
    ),
    'process.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(
      process.env.VITE_FIREBASE_AUTH_DOMAIN
    ),
    'process.env.VITE_FIREBASE_DATABASE_URL': JSON.stringify(
      process.env.VITE_FIREBASE_DATABASE_URL
    ),
    'process.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(
      process.env.VITE_FIREBASE_PROJECT_ID
    ),
    'process.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(
      process.env.VITE_FIREBASE_STORAGE_BUCKET
    ),
    'process.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(
      process.env.VITE_FIREBASE_MESSAGING_SENDER_ID
    ),
    'process.env.VITE_FIREBASE_APP_ID': JSON.stringify(
      process.env.VITE_FIREBASE_APP_ID
    ),
    'process.env.VITE_FIREBASE_MEASUREMENT_ID': JSON.stringify(
      process.env.VITE_FIREBASE_MEASUREMENT_ID
    ),
    // TMDB API
    'process.env.VITE_API_TMDB': JSON.stringify(process.env.VITE_API_TMDB),
  },
  publicDir: 'public', // Stellen Sie sicher, dass dies korrekt konfiguriert ist
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Splittet node_modules in eigene Chunks
            return id.toString().split('node_modules/')[1].split('/')[0];
          }
        },
      },
    },
  },
});
