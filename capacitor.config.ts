import type { CapacitorConfig } from '@capacitor/cli';

// Gleiche Philosophie wie der Electron-Shell: die native Hülle lädt die
// Live-Web-App — jedes Web-Deploy aktualisiert damit auch die Mobile-Apps,
// ohne Store-Release. webDir ist bewusst NICHT dist: der volle Vite-Build
// (mit .gz-Duplikaten) sprengt Androids Asset-Merger und wäre totes Gewicht.
const config: CapacitorConfig = {
  appId: 'de.tvrank.app',
  appName: 'TV-Rank',
  webDir: 'capacitor-shell',
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
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
