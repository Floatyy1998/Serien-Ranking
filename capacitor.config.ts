import type { CapacitorConfig } from '@capacitor/cli';

// Gleiche Philosophie wie der Electron-Shell: die native Hülle lädt die
// Live-Web-App — jedes Web-Deploy aktualisiert damit auch die Mobile-Apps,
// ohne Store-Release. webDir dient nur als Fallback-Platzhalter.
const config: CapacitorConfig = {
  appId: 'de.tvrank.app',
  appName: 'TV-Rank',
  webDir: 'dist',
  server: {
    url: 'https://tv-rank.de',
    androidScheme: 'https',
  },
  backgroundColor: '#000000',
  android: {
    allowMixedContent: false,
  },
  ios: {
    contentInset: 'never',
    backgroundColor: '#000000',
  },
};

export default config;
