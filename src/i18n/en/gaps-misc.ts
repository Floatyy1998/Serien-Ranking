/** Englische Übersetzungen: verstreute Kleintexte (Offline/SW/Toasts/Platzhalter/Saison). */
const dict: Record<string, string> = {
  // App-Install-Banner (components/AppInstallBanner.tsx)
  'TV-Rank als App': 'Get the TV-Rank app',
  'Widgets, Push & schneller.': 'Widgets, push & faster.',
  Öffnen: 'Open',

  // Offline-Sync (services/offline/queuedUpdate.ts)
  'Offline — wird synchronisiert, sobald du online bist':
    "Offline — will sync as soon as you're back online",
  '1 Offline-Änderung synchronisiert': '1 offline change synced',
  '{n} Offline-Änderungen synchronisiert': '{n} offline changes synced',

  // Service-Worker-Update-Pille (services/serviceWorkerManager.ts)
  'Neue Version verfügbar': 'New version available',
  Aktualisieren: 'Update',
  Später: 'Later',
  'Update erfolgreich installiert': 'Update installed successfully',

  // Undo-Toast (lib/toast.ts)
  Rückgängig: 'Undo',

  // Poster-Platzhalter (lib/posterPlaceholder.ts, utils/themedPlaceholder.ts)
  'Kein Poster': 'No poster',
  'KEIN POSTER': 'NO POSTER',
  VORHANDEN: 'AVAILABLE',
  'SERIEN · FILME · MANGA': 'SERIES · MOVIES · MANGA',
  'Coverbild bald verfügbar': 'Cover art coming soon',

  // Datumsformat (lib/date/date.utils.ts)
  'Kein Datum': 'No date',
  'Ungültiges Datum': 'Invalid date',

  // WatchJourney (pages/WatchJourney/TrendsTab.tsx)
  'Dein Jahr in Zahlen': 'Your year in numbers',

  // Anime-Season-Timeline (pages/AnimeSeason/animeSeasonUtils.ts)
  'Start noch offen': 'Start date TBA',

  // Manga-Karussell (pages/Manga/sections/MangaCarouselSection.tsx)
  '{title} öffnen': 'Open {title}',

  // Saisonale Empfehlungen (hooks/useSeasonalRecommendations.ts)
  Valentinstag: "Valentine's Day",
  'Winter-Abende': 'Winter Evenings',
  Frühlingsgefühle: 'Spring Fever',
  'Sommer-Blockbuster': 'Summer Blockbusters',
  'Herbst-Krimis': 'Autumn Crime',
  'Halloween & Grusel': 'Halloween & Horror',
  'Weihnachts-Highlights': 'Christmas Highlights',
  Empfehlungen: 'Recommendations',
};
export default dict;
