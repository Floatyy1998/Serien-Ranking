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
        // Simplified chunking - let Vite handle most of it automatically
        manualChunks: {
          // Only split the biggest dependencies to avoid loading order issues
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/database', 'firebase/storage', 'firebase/analytics'],
          'recharts': ['recharts'],
          'framer': ['framer-motion'],
        },
      },
    },
  },
});
