import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';
import { defineConfig } from 'vite';

dotenv.config();

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Nur spezifische Umgebungsvariablen definieren für Sicherheit
    'process.env.VITE_APIKEY': JSON.stringify(process.env.VITE_APIKEY),
    'process.env.VITE_AUTHDOMAIN': JSON.stringify(process.env.VITE_AUTHDOMAIN),
    'process.env.VITE_DATABASEURL': JSON.stringify(
      process.env.VITE_DATABASEURL
    ),
    'process.env.VITE_PROJECTID': JSON.stringify(process.env.VITE_PROJECTID),
    'process.env.VITE_STORAGEBUCKET': JSON.stringify(
      process.env.VITE_STORAGEBUCKET
    ),
    'process.env.VITE_MESSAGINGSENDERID': JSON.stringify(
      process.env.VITE_MESSAGINGSENDERID
    ),
    'process.env.VITE_APPID': JSON.stringify(process.env.VITE_APPID),
    'process.env.VITE_MEASUREMENTID': JSON.stringify(
      process.env.VITE_MEASUREMENTID
    ),
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
