import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';
import { defineConfig } from 'vite';

dotenv.config();

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': process.env,
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
