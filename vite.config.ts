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
    chunkSizeWarningLimit: 450, // Set warning limit to 450kb
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
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
          
          // React, Emotion, MUI System and utils MUST be together to avoid circular deps
          if (id.includes('react-dom')) {
            return 'react-vendor';
          }
          if (id.includes('react/') || (id.includes('react') && !id.includes('react-'))) {
            return 'react-vendor';
          }
          if (id.includes('scheduler')) {
            return 'react-vendor';
          }
          // MUI utils must be with React to avoid initialization issues
          if (id.includes('@mui/utils')) {
            return 'react-vendor';
          }
          // Emotion, MUI System and Framer Motion must be with React too
          if (id.includes('@emotion') || 
              id.includes('emotion') || 
              id.includes('stylis') ||
              id.includes('@mui/styled-engine') ||
              id.includes('@mui/system') ||
              id.includes('@mui/private-theming')) {
            return 'react-vendor';
          }
          
          // React Router separate
          if (id.includes('react-router')) {
            return 'react-router';
          }
          
          // Firebase - split into even smaller chunks
          if (id.includes('firebase')) {
            if (id.includes('@firebase/auth')) return 'fb-auth';
            if (id.includes('firebase/compat/auth')) return 'fb-auth-compat';
            if (id.includes('@firebase/database')) return 'fb-database';
            if (id.includes('firebase/compat/database')) return 'fb-database-compat';
            if (id.includes('@firebase/storage')) return 'fb-storage';
            if (id.includes('firebase/compat/storage')) return 'fb-storage-compat';
            if (id.includes('@firebase/app')) return 'fb-app';
            if (id.includes('firebase/compat/app')) return 'fb-app-compat';
            if (id.includes('@firebase/analytics')) return 'fb-analytics';
            if (id.includes('@firebase/util')) return 'fb-util';
            if (id.includes('@firebase/component')) return 'fb-component';
            return 'fb-core';
          }
          
          // Emotion and MUI System are now bundled with react-vendor
          
          // MUI - keep only non-problematic splits
          if (id.includes('@mui')) {
            // Icons can stay split - they don't have circular deps
            if (id.includes('icons-material')) {
              if (id.includes('esm/')) {
                const iconPath = id.split('esm/')[1];
                if (iconPath) {
                  const firstLetter = iconPath[0].toLowerCase();
                  if (firstLetter <= 'd') return 'mui-icons-1';
                  if (firstLetter <= 'h') return 'mui-icons-2';
                  if (firstLetter <= 'n') return 'mui-icons-3';
                  if (firstLetter <= 's') return 'mui-icons-4';
                  return 'mui-icons-5';
                }
              }
              return 'mui-icons-core';
            }
            
            // Date pickers can stay separate
            if (id.includes('@mui/x-date-pickers')) return 'mui-date';
            if (id.includes('@mui/x-')) return 'mui-x-core';
            
            // Bundle ALL @mui/material together to avoid circular deps
            if (id.includes('@mui/material') || 
                id.includes('@mui/base') || 
                id.includes('@mui/lab')) {
              return 'mui-material-all';
            }
            
            return 'mui-core';
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
          
          // Small utilities
          if (id.includes('tslib')) return 'util-tslib';
          if (id.includes('scheduler')) return 'util-scheduler';
          if (id.includes('prop-types')) return 'util-proptypes';
          if (id.includes('object-assign')) return 'util-assign';
          if (id.includes('cookie')) return 'util-cookie';
          if (id.includes('fast-deep-equal')) return 'util-equal';
          if (id.includes('clsx')) return 'util-clsx';
          
          // Everything else
          return 'vendor';
        }
      },
    },
  },
});
