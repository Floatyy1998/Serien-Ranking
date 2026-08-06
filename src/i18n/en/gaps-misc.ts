/** Englische Übersetzungen: verstreute Kleintexte (Offline/SW/Toasts/Platzhalter/Saison). */
const dict: Record<string, string> = {
  // Willkommens-Benachrichtigungen beim Erstlogin (authProvider.tsx)
  'Willkommen bei TV-Rank!': 'Welcome to TV-Rank!',
  'Schön, dass du da bist — viel Spaß beim Tracken deiner Serien und Filme! Wenn etwas nicht funktioniert oder du Fragen hast, melde dich einfach über das kleine rote Käfer-Symbol. Danke, dass du bei TV-Rank dabei bist!':
    "Great to have you here — have fun tracking your series and movies! If something's not working or you have a question, just tap the little red bug icon. Thanks for being part of TV-Rank!",
  'Mach TV-Rank zu deinem': 'Make TV-Rank yours',
  'Wusstest du? Unter „Mehr" kannst du die Theme-Farben komplett frei anpassen und deine Startseite im Layout-Editor selbst zusammenstellen — ganz nach deinem Geschmack.':
    'Did you know? Under "More" you can freely customize the theme colors and arrange your homepage in the layout editor — entirely to your taste.',

  // Film-Verfügbarkeit (services/detection/movieAvailabilityDetection.ts)
  'Jetzt für dich streambar': 'Now streaming for you',
  '„{title}" von deiner Liste ist jetzt bei {providers} verfügbar.':
    '"{title}" from your list is now available on {providers}.',
  '{count} Filme aus deiner Liste jetzt streambar':
    '{count} movies from your list are now available to stream',
  'Jetzt auf deinen Abos verfügbar: {list}': 'Now available on your services: {list}',

  // App-Install-Banner (components/AppInstallBanner.tsx)
  'TV-Rank als App': 'Get the TV-Rank app',
  'Widgets, Push & schneller.': 'Widgets, notifications & faster.',
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
  'Herbst-Krimis': 'Autumn Mysteries',
  'Halloween & Grusel': 'Halloween & Horror',
  'Weihnachts-Highlights': 'Christmas Highlights',
  Empfehlungen: 'Recommendations',
};
export default dict;
