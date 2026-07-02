import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@': r('./src'),
      '@components': r('./src/components'),
      '@hooks': r('./src/hooks'),
      '@lib': r('./src/lib'),
    },
  },
  test: {
    // Nur pure Logik-Module werden getestet (node-Umgebung, kein jsdom nötig)
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'node',
  },
});
