import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';
import { defineConfig } from 'vite';
import { criticalCSSPlugin } from './vite-plugin-critical-css';
import { VitePWA } from 'vite-plugin-pwa';
import viteCompression from 'vite-plugin-compression';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path';

dotenv.config();

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }],
        ],
      },
    }),
    criticalCSSPlugin(),
    // PWA with aggressive caching
    VitePWA({
      registerType: 'autoUpdate',
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
    // Compression
    viteCompression({ 
      algorithm: 'gzip', 
      ext: '.gz', 
      threshold: 1024,
      deleteOriginFile: false,
    }),
    viteCompression({ 
      algorithm: 'brotliCompress', 
      ext: '.br', 
      threshold: 1024,
      deleteOriginFile: false,
    }),
    visualizer({ 
      open: false, 
      gzipSize: true, 
      brotliSize: true,
      filename: 'dist/stats.html',
    }),
  ],
  define: {
    // Firebase environment variables
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
  publicDir: 'public',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@mobile': path.resolve(__dirname, './src/mobile'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@contexts': path.resolve(__dirname, './src/contexts'),
      '@features': path.resolve(__dirname, './src/features'),
      '@types': path.resolve(__dirname, './src/types'),
    },
  },
  build: {
    target: 'es2020', // More modern target for smaller bundles
    chunkSizeWarningLimit: 200,
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
        passes: 2, // Fixed duplicate passes
        unsafe: false,
        unsafe_comps: false,
        unsafe_math: false,
        unsafe_proto: false,
        unsafe_regexp: false,
        dead_code: true,
        unused: true,
      },
      mangle: {
        keep_fnames: true, // Keep function names for Firebase
        safari10: true,
      },
      format: {
        comments: false,
        ecma: 2020,
      },
    },
    rollupOptions: {
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
      },
      output: {
        // Optimize for smaller chunks
        compact: true,
        generatedCode: {
          constBindings: true,
        },
        manualChunks: (id) => {
          // Vendor chunks - optimized grouping
          if (id.includes('node_modules')) {
            // Core React ecosystem
            if (id.includes('react-dom')) return 'react-dom';
            if (id.includes('react-router') || id.includes('@remix-run')) return 'react-router';
            if (id.includes('react')) return 'react-core';
            
            // Firebase - split into smaller chunks
            if (id.includes('firebase/compat/app')) return 'firebase-app';
            if (id.includes('firebase/compat/auth')) return 'firebase-auth';
            if (id.includes('firebase/compat/database')) return 'firebase-database';
            if (id.includes('firebase/compat/storage')) return 'firebase-storage';
            if (id.includes('firebase')) return 'firebase-other';
            
            // Material-UI - split by component type
            if (id.includes('@mui/icons-material')) return 'mui-icons';
            if (id.includes('@mui/material/styles')) return 'mui-styles';
            if (id.includes('@mui/material')) return 'mui-core';
            if (id.includes('@mui')) return 'mui-other';
            
            // Emotion (MUI's CSS-in-JS)
            if (id.includes('@emotion')) return 'emotion';
            
            // Animation libraries
            if (id.includes('framer-motion')) return 'framer-motion';
            
            // Date utilities
            if (id.includes('date-fns')) return 'date-fns';
            
            // Lodash utilities
            if (id.includes('lodash')) return 'lodash';
            
            // Other large libraries
            if (id.includes('axios')) return 'axios';
            if (id.includes('dompurify')) return 'dompurify';
            
            // All other vendor code
            return 'vendor-misc';
          }
          
          // App code - feature-based splitting
          if (!id.includes('node_modules')) {
            // Mobile pages - lazy loaded
            if (id.includes('/mobile/pages/')) {
              if (id.includes('MobileHomePage')) return 'page-home';
              if (id.includes('MobileSeriesDetailPage')) return 'page-series';
              if (id.includes('MobileMovieDetailPage')) return 'page-movie';
              if (id.includes('MobileSearchPage')) return 'page-search';
              if (id.includes('MobileDiscoverPage')) return 'page-discover';
              if (id.includes('MobileWatchNextPage')) return 'page-watchnext';
              if (id.includes('MobileProfilePage')) return 'page-profile';
              if (id.includes('MobileStatsPage')) return 'page-stats';
              return 'pages-other';
            }
            
            // Mobile components
            if (id.includes('/mobile/components/')) return 'mobile-components';
            
            // Features
            if (id.includes('/features/auth/')) return 'feature-auth';
            if (id.includes('/features/badges/')) return 'feature-badges';
            if (id.includes('/features/stats/')) return 'feature-stats';
            
            // Contexts and providers
            if (id.includes('/contexts/')) return 'contexts';
            
            // Hooks
            if (id.includes('/hooks/')) return 'hooks';
            
            // Utilities and libraries
            if (id.includes('/lib/')) return 'lib';
            if (id.includes('/services/')) return 'services';
            
            // Core components
            if (id.includes('/components/')) return 'components';
            
            // Main app entry
            if (id.includes('App.tsx') || id.includes('index.tsx')) return 'app-core';
          }
        },
      },
    },
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@mui/material',
      'firebase/compat/app',
      'firebase/compat/auth',
      'firebase/compat/database',
    ],
    exclude: ['@vite/client', '@vite/env'],
  },
  // Server options for development
  server: {
    hmr: {
      overlay: false,
    },
  },
});