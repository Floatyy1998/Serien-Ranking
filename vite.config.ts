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
  server: {
    proxy: {
      '/api': {
        target: 'https://serienapi.konrad-dinges.de',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [
    react({
      babel: {
        plugins: [['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }]],
      },
    }),
    criticalCSSPlugin(), // Temporarily disabled - causing build hang
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico'],
      manifest: {
        name: 'Serien Tracker',
        short_name: 'Serien',
        theme_color: '#8b5cf6',
        background_color: '#0a0e1a',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,jpeg,webp}'],
        navigateFallback: null, // Disable navigate fallback to prevent loops
        skipWaiting: false, // Don't auto-activate new SW versions
        clientsClaim: false, // Don't auto-take control
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
    minify: 'terser',
    cssMinify: true,
    cssCodeSplit: true,
    sourcemap: false,
    reportCompressedSize: false,
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.trace'],
        passes: 2, // Optimized compression passes
        // Remove unsafe options that break Firebase
        unsafe: false,
        unsafe_comps: false,
        unsafe_math: false,
        unsafe_proto: false,
        unsafe_regexp: false,
      },
      mangle: {
        // Don't mangle properties - it breaks Firebase!
        keep_fnames: true, // Keep function names for Firebase
      },
      format: {
        comments: false, // Remove all comments
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Your app code - split by feature/domain
          if (!id.includes('node_modules')) {
            // Mobile code
            if (id.includes('/mobile/')) {
              if (id.includes('/mobile/pages/')) {
                // Split mobile pages into separate chunks
                if (id.includes('MobileHomePage')) return 'mobile-home';
                if (id.includes('MobileSeriesDetailPage')) return 'mobile-series-detail';
                if (id.includes('MobileMovieDetailPage')) return 'mobile-movie-detail';
                if (id.includes('MobileWatchNextPage')) return 'mobile-watchnext';
                if (id.includes('MobileDiscoverPage')) return 'mobile-discover';
                if (id.includes('MobileSearchPage')) return 'mobile-search';
                if (id.includes('MobileRatingPage')) return 'mobile-rating';
                if (id.includes('MobileProfilePage')) return 'mobile-profile';
                if (id.includes('MobileBadgesPage')) return 'mobile-badges';
                if (id.includes('MobileStatsPage')) return 'mobile-stats';
                return 'mobile-pages';
              }
              if (id.includes('/mobile/components/')) return 'mobile-components';
              return 'mobile-core';
            }

            // Desktop components
            if (id.includes('/components/')) {
              if (id.includes('/components/domain/series/')) return 'comp-series';
              if (id.includes('/components/domain/movies/')) return 'comp-movies';
              if (id.includes('/components/domain/dialogs/')) return 'comp-dialogs';
              if (id.includes('/components/ui/')) return 'comp-ui';
              return 'comp-core';
            }

            // Features
            if (id.includes('/features/')) {
              if (id.includes('/features/badges/')) return 'feat-badges';
              if (id.includes('/features/auth/')) return 'feat-auth';
              if (id.includes('/features/friends/')) return 'feat-friends';
              if (id.includes('/features/notifications/')) return 'feat-notifications';
              return 'feat-core';
            }

            // Contexts
            if (id.includes('/contexts/')) return 'contexts';

            // Utils
            if (id.includes('/utils/') || id.includes('/lib/')) return 'app-utils';

            // Types
            if (id.includes('/types/')) return 'types';

            return;
          }

          // Bundle React ecosystem together
          if (
            id.includes('react') ||
            id.includes('scheduler') ||
            id.includes('@emotion') ||
            id.includes('emotion') ||
            id.includes('stylis') ||
            id.includes('prop-types')
          ) {
            return 'react-vendor';
          }

          // Firebase - all in one chunk
          if (id.includes('firebase')) {
            return 'firebase-all';
          }

          // Emotion and MUI System are now bundled with react-vendor

          // MUI - simpler chunking
          if (id.includes('@mui')) {
            return 'mui-all';
          }

          // Framer Motion - all in one chunk to avoid circular deps
          if (id.includes('framer-motion')) {
            return 'framer-all';
          }
          // Other motion libraries
          if (id.includes('motion') && !id.includes('framer-motion')) {
            return 'motion-core';
          }

          // Other libraries
          if (id.includes('dayjs')) return 'dayjs';
          if (id.includes('lucide')) return 'lucide';
          if (id.includes('react-dnd')) return 'dnd-react';
          if (id.includes('dnd-core')) return 'dnd-core';
          if (id.includes('redux')) return 'redux';
          if (id.includes('react-helmet')) return 'helmet';
          if (id.includes('react-colorful')) return 'colorful';
          if (id.includes('react-confetti')) return 'confetti';
          if (id.includes('react-transition-group')) return 'transition';
          if (id.includes('@popperjs')) return 'popper';
          if (id.includes('idb')) return 'idb';

          // react-window is now handled by the general react check above

          // Small utilities
          if (id.includes('tslib')) return 'util-tslib';
          // prop-types is now in react-vendor
          if (id.includes('object-assign')) return 'util-assign';
          if (id.includes('cookie')) return 'util-cookie';
          if (id.includes('fast-deep-equal')) return 'util-equal';
          if (id.includes('clsx')) return 'util-clsx';

          // Everything else
          return 'vendor';
        },
      },
    },
  },
});
