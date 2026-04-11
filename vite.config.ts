import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { criticalCSSPlugin } from './vite-plugin-critical-css';
// import viteCompression from 'vite-plugin-compression';
// import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path';

dotenv.config();

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    criticalCSSPlugin(), // Temporarily disabled - causing build hang
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico'],
      manifest: {
        name: 'Serien Tracker',
        short_name: 'Serien',
        theme_color: '#8b5cf6',
        background_color: '#06090f',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        // HTML nicht precachen - muss immer frisch vom Server kommen,
        // damit nach einem Deploy sofort die neuen Chunk-Referenzen geladen werden
        globPatterns: ['**/*.{js,css,svg,png,jpg,jpeg,webp}'],
        navigateFallback: null, // Disable navigate fallback to prevent loops
        skipWaiting: true, // Auto-update: neuer Worker übernimmt sofort
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
    // Compression - temporarily disabled
    // viteCompression({ algorithm: 'gzip', ext: '.gz', threshold: 1024 }),
    // viteCompression({ algorithm: 'brotliCompress', ext: '.br', threshold: 1024 }),
    // visualizer({ open: false, gzipSize: true, brotliSize: true }),
  ],
  define: {
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
    cssCodeSplit: true,
    sourcemap: false,
    reportCompressedSize: false,
    rolldownOptions: {
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
          // MUI ist auf mehreren Seiten gleichzeitig genutzt - in einem chunk
          // halten vermeidet Duplication in mehreren Lazy-Chunks
          if (id.includes('node_modules/@mui/')) return 'mui';
          // recharts, framer-motion etc werden automatisch an die Lazy-Pages
          // gebunden die sie brauchen - kein eager laden mehr
        },
      },
    },
  },
});
