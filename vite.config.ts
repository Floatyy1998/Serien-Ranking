import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';
import viteCompression from 'vite-plugin-compression';
import { VitePWA } from 'vite-plugin-pwa';
import { criticalCSSPlugin } from './vite-plugin-critical-css';

dotenv.config();

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  base: '/',
  plugins: [
    react(),
    criticalCSSPlugin(),
    VitePWA({
      // 'prompt': der neue Worker WARTET nach der Installation, statt sofort
      // zu uebernehmen. Aktiviert wird er vom serviceWorkerManager nur zu
      // unsichtbaren Momenten (Tab im Hintergrund) oder per User-Klick —
      // nie als aufgezwungener Mid-Session-Reload.
      registerType: 'prompt',
      includeAssets: ['favicon.ico'],
      manifest: {
        name: 'Serien Tracker',
        short_name: 'Serien',
        theme_color: '#8b5cf6',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        // index.html mitprecachen + als Navigation-Fallback: PWA muss auch
        // bei schlechter/keiner Verbindung laden koennen. Update-Fluss:
        // neuer Worker wird im Hintergrund vorinstalliert und WARTET;
        // serviceWorkerManager.ts aktiviert ihn unsichtbar (Tab hidden)
        // oder per Klick auf die Update-Pille — kein Zwangs-Reload mehr.
        globPatterns: ['**/*.{js,css,svg,png,jpg,jpeg,webp,html}'],
        // stats.html ist der Bundle-Visualizer-Report — nicht ausliefern,
        // ist mehrere MB gross und nur fuer lokales Debugging gedacht.
        globIgnores: ['**/stats.html'],
        navigateFallback: 'index.html',
        skipWaiting: false, // Neuer Worker wartet, bis wir ihn gezielt aktivieren
        clientsClaim: true, // Take control of all pages once activated
        cleanupOutdatedCaches: true,
        // Disable verbose logging
        disableDevLogs: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/image\.tmdb\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'tmdb-images',
              expiration: { maxEntries: 1000, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/api\.themoviedb\.org\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'tmdb-api',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 },
            },
          },
        ],
      },
    }),
    viteCompression({ algorithm: 'gzip', ext: '.gz', threshold: 1024, deleteOriginFile: false }),
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024,
      deleteOriginFile: false,
    }),
    visualizer({ open: false, gzipSize: true, brotliSize: true, filename: 'dist/stats.html' }),
  ],
  define: {
    // In Production-Builds: console.log/debug/info zu No-Op replacen, dann
    // strippt der Tree-Shaker die Aufrufe komplett raus. console.warn und
    // console.error bleiben — die wollen wir bei echten Problemen sehen.
    // Im Dev-Server bleibt alles erhalten, sonst waere Debugging unmoeglich.
    ...(command === 'build'
      ? {
          'console.log': '(()=>{})',
          'console.debug': '(()=>{})',
          'console.info': '(()=>{})',
        }
      : {}),
    // Firebase Umgebungsvariablen - korrigierte Namen
    'process.env.VITE_FIREBASE_API_KEY': JSON.stringify(process.env.VITE_FIREBASE_API_KEY),
    'process.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(process.env.VITE_FIREBASE_AUTH_DOMAIN),
    'process.env.VITE_FIREBASE_DATABASE_URL': JSON.stringify(
      process.env.VITE_FIREBASE_DATABASE_URL
    ),
    'process.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(process.env.VITE_FIREBASE_PROJECT_ID),
    'process.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(
      process.env.VITE_FIREBASE_STORAGE_BUCKET
    ),
    'process.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(
      process.env.VITE_FIREBASE_MESSAGING_SENDER_ID
    ),
    'process.env.VITE_FIREBASE_APP_ID': JSON.stringify(process.env.VITE_FIREBASE_APP_ID),
    'process.env.VITE_FIREBASE_MEASUREMENT_ID': JSON.stringify(
      process.env.VITE_FIREBASE_MEASUREMENT_ID
    ),
    // TMDB API
    'process.env.VITE_API_TMDB': JSON.stringify(process.env.VITE_API_TMDB),
  },
  publicDir: 'public', // Stellen Sie sicher, dass dies korrekt konfiguriert ist
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@mobile': path.resolve(__dirname, './src/mobile'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@lib': path.resolve(__dirname, './src/lib'),
    },
  },
  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 150,
    minify: 'oxc',
    modulePreload: { polyfill: false },
    cssMinify: 'lightningcss',
    // Ohne Targets verschmilzt Lightning CSS `-webkit-backdrop-filter` +
    // `backdrop-filter` zu EINER Deklaration (die letzte gewinnt) — das hat
    // live den Blur in Firefox gekillt. Mit Targets generiert er die nötigen
    // Prefixe selbst (Safari < 18 braucht -webkit-backdrop-filter).
    cssTarget: ['chrome100', 'safari16', 'firefox115'],
    cssCodeSplit: true,
    sourcemap: false,
    reportCompressedSize: false,
    rolldownOptions: {
      // ACHTUNG: kein `treeshake: { moduleSideEffects: false }` hier — das hat
      // den `import 'firebase/compat/auth'` Side-Effect weggetreeshaked und
      // damit `firebase.auth()` undefined gemacht ("y.auth is not a function").
      // Firebase Compat registriert die Sub-Module ausschliesslich ueber
      // Side-Effect-Imports. Default-Treeshaking ist hier sicher.
      output: {
        manualChunks(id) {
          // Firebase wird vom AuthProvider ueberall eager benoetigt -> eigenes chunk
          if (id.includes('node_modules/firebase')) return 'firebase';
          // react / react-dom zusammen halten, sonst wird das initial chunk fragmentiert
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/scheduler/')
          ) {
            return 'react';
          }
          // MUI-Icons als eigenes Chunk: dann landen nicht alle Icons in jeder Lazy-Page
          if (id.includes('node_modules/@mui/icons-material')) return 'mui-icons';
          // Rest von MUI in einem Chunk halten - vermeidet Duplication
          if (id.includes('node_modules/@mui/')) return 'mui';
          // recharts: ~250kB minified, wird von AdminDashboard, Stats und
          // WatchJourney geteilt. Eigenes Chunk -> einmal laden, dann cached
          // beim Wechsel zwischen den Pages, statt 3x dupliziert zu werden.
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) {
            return 'recharts';
          }
          // framer-motion: ~50kB, wird quasi ueberall genutzt (Sheets, Cards,
          // Notifications). Eigenes Chunk verhindert Duplication in jedem
          // Lazy-Page-Chunk und gibt einen besseren Cache-Hit.
          if (id.includes('node_modules/framer-motion') || id.includes('node_modules/motion')) {
            return 'framer-motion';
          }
        },
      },
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@mui/material',
      'firebase/app',
      'firebase/auth',
      'firebase/database',
    ],
    exclude: ['@vite/client', '@vite/env'],
  },
}));
