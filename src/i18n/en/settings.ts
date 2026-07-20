/** Einstellungen (Settings-Bereich) — Deutsch → Englisch. */

const settings: Record<string, string> = {
  Sprache: 'Language',
  'Auto nutzt die Gerätesprache: Deutsch im DACH-Raum, sonst Englisch.':
    'Auto follows your device language: German in the DACH region, English everywhere else.',
  'Streaming-Land': 'Streaming country',
  'Auto (aus Gerätesprache)': 'Auto (from device language)',
  'Bestimmt, für welches Land Streaming-Anbieter angezeigt werden.':
    "Sets which country's streaming providers are shown.",
  Deutschland: 'Germany',
  Österreich: 'Austria',
  Schweiz: 'Switzerland',
  Großbritannien: 'United Kingdom',
  Irland: 'Ireland',
  Kanada: 'Canada',
  Australien: 'Australia',
  Frankreich: 'France',
  Italien: 'Italy',
  Spanien: 'Spain',
  Niederlande: 'Netherlands',
  Polen: 'Poland',
  Schweden: 'Sweden',
  Norwegen: 'Norway',
  Dänemark: 'Denmark',
  Finnland: 'Finland',
  Brasilien: 'Brazil',
  Mexiko: 'Mexico',
  Südkorea: 'South Korea',
  Indien: 'India',
  Türkei: 'Turkey',

  // SettingsPage
  Einstellungen: 'Settings',
  'TV-Rank für Windows herunterladen': 'Download TV-Rank for Windows',
  'APK direkt herunterladen und installieren': 'Download and install the APK directly',
  'TV-Rank beim Hochfahren starten': 'Launch TV-Rank at startup',
  Abmelden: 'Log out',

  // useSettingsData (Snackbars/Dialoge)
  'Möchtest du dich wirklich abmelden?': 'Do you really want to log out?',
  'Bild darf maximal 100MB groß sein': 'Image must be 100MB or smaller',
  'Profilbild erfolgreich hochgeladen!': 'Profile picture uploaded!',
  'Fehler beim Hochladen des Bildes': 'Failed to upload the image',
  'Anzeigename gespeichert!': 'Display name saved!',
  'Fehler beim Speichern des Anzeigenamens': 'Failed to save the display name',
  'Link kopiert!': 'Link copied!',
  'Schau dir mein TV-Rank-Profil an!': 'Check out my TV-Rank profile!',
  'Teilen nicht möglich': 'Sharing not available',

  // ProfileSection
  'Profilbild von {name}': 'Profile picture of {name}',
  Benutzer: 'User',
  'Profilbild hochladen': 'Upload profile picture',
  'Tippe auf die Kamera um ein neues Profilbild hochzuladen':
    'Tap the camera to upload a new profile picture',
  Anzeigename: 'Display name',
  'Anzeigename eingeben': 'Enter display name',
  'Nicht festgelegt': 'Not set',
  'Anzeigename ändern': 'Edit display name',

  // PublicProfileSection
  'Öffentliches Profil': 'Public profile',
  'Profil öffentlich teilen': 'Share profile publicly',
  'Andere können deine Serien und Filme sehen': 'Others can see your shows and movies',
  'Dein öffentlicher Link': 'Your public link',
  Teilen: 'Share',
  Kopieren: 'Copy',
  Neu: 'New',
  'Wenn aktiviert, können andere deine bewerteten Serien und Filme auch ohne Anmeldung sehen':
    'When enabled, others can see your rated shows and movies without signing in',

  // DeleteAccountSection
  'Konto löschen': 'Delete account',
  'Dein Konto und': 'Your account and',
  'alle Daten': 'all data',
  '(Serien, Filme, Manga, Bewertungen, Statistiken, Freundschaften) werden':
    '(shows, movies, manga, ratings, statistics, friendships) will be',
  'endgültig gelöscht': 'permanently deleted',
  '. Das kann nicht rückgängig gemacht werden.': '. This cannot be undone.',
  'Passwort zur Bestätigung': 'Password to confirm',
  'Zur Bestätigung meldest du dich gleich noch einmal mit Google bzw. Apple an.':
    "To confirm, you'll sign in once more with Google or Apple.",
  'Wird gelöscht…': 'Deleting…',
  'Konto endgültig löschen': 'Permanently delete account',
  'Falsches Passwort.': 'Wrong password.',
  'Zu viele Versuche — bitte später erneut versuchen.':
    'Too many attempts — please try again later.',
  'Bestätigung abgebrochen.': 'Confirmation canceled.',
  'Löschen fehlgeschlagen. Bitte erneut versuchen.': 'Deletion failed. Please try again.',

  // SecuritySection
  'Anmeldung & Sicherheit': 'Sign-in & security',
  'Passwort muss mindestens 6 Zeichen lang sein.': 'Password must be at least 6 characters.',
  'Passwörter stimmen nicht überein.': 'Passwords do not match.',
  'Passwort ist zu schwach.': 'Password is too weak.',
  'Passwort konnte nicht gespeichert werden. Bitte erneut versuchen.':
    'Could not save the password. Please try again.',
  'Passwort gesetzt — du kannst dich jetzt zusätzlich mit E-Mail & Passwort anmelden (z. B. in der Browser-Extension).':
    'Password set — you can now also sign in with email & password (e.g. in the browser extension).',
  'Du meldest dich mit Google oder Apple an. Lege zusätzlich ein Passwort fest, um dich auch mit E-Mail & Passwort anzumelden — nötig z. B. für die Browser-Extension.':
    'You sign in with Google or Apple. Set an additional password so you can also sign in with email & password — needed e.g. for the browser extension.',
  'Neues Passwort': 'New password',
  'Passwort wiederholen': 'Repeat password',
  'Wird gespeichert…': 'Saving…',
  'Passwort festlegen': 'Set password',

  // AppearanceSection
  'Farben und Aussehen anpassen': 'Customize colors and appearance',
  'Homepage Layout': 'Homepage layout',
  'Sektionen sortieren & ausblenden': 'Sort & hide sections',

  // LegalSection
  'Rechtliches & Datenquellen': 'Legal & data sources',
  Datenschutzerklärung: 'Privacy policy',
  Impressum: 'Legal notice',
  'Analyse & Cookies': 'Analytics & cookies',
  'Anonymisierte Nutzungsdaten zur Verbesserung der App':
    'Anonymized usage data to improve the app',
  Datenquellen: 'Data sources',
  'Streaming-Anbieter': 'Streaming providers',
  'Episoden-Informationen': 'Episode information',
  'Film- & Seriendaten': 'Movie & TV data',
  Bewertungen: 'Ratings',

  // NotificationsSection
  Benachrichtigungen: 'Notifications',
  'Push-Benachrichtigungen': 'Push notifications',
  'Neue Folgen deiner Serien und Freundschaftsanfragen direkt aufs Handy':
    'New episodes of your shows and friend requests straight to your phone',
  'Inaktive Serien': 'Inactive shows',
  'Erinnerung nach X Tagen ohne neue Episode': 'Reminder after X days without a new episode',
  Aus: 'Off',
  '{days} T.': '{days} d.',
  'Provider-Änderungen': 'Provider changes',
  'Benachrichtigung wenn ein Streaming-Anbieter wechselt':
    'Get notified when a streaming provider changes',
  'Provider-Änderungs-Benachrichtigungen': 'Provider change notifications',
  'Erinnerungen kommen frühestens 30 Tage nach der letzten Anzeige wieder — selbst wenn die Serie weiter inaktiv ist. Schaust du eine Episode, wird die Erinnerung beim nächsten Inaktivwerden direkt wieder freigeschaltet.':
    'Reminders come back no sooner than 30 days after they were last shown — even if the show stays inactive. Once you watch an episode, the reminder is re-armed the next time the show goes inactive.',

  // ThemePage
  'Farben anpassen': 'Customize colors',
  Primär: 'Primary',
  'Hauptfarbe für Buttons': 'Main color for buttons',
  Hintergrund: 'Background',
  Hintergrundfarbe: 'Background color',
  Textfarbe: 'Text color',
  Oberfläche: 'Surface',
  Kartenfarben: 'Card colors',
  Akzent: 'Accent',
  Akzentfarbe: 'Accent color',
  'Sehr geringer Kontrast zwischen Text und Hintergrund – Text ist kaum lesbar.':
    'Very low contrast between text and background – text is barely readable.',
  'Geringer Kontrast zwischen Text und Hintergrund (unter WCAG-AA 4.5:1).':
    'Low contrast between text and background (below WCAG AA 4.5:1).',
  '{name} – Farbe wählen': '{name} – pick a color',
  '{name} – Hex-Wert': '{name} – hex value',
  'Theme zurücksetzen': 'Reset theme',
  'Alle Farben auf Standard': 'All colors back to default',
  Zurücksetzen: 'Reset',
  Abbrechen: 'Cancel',

  // HomeLayoutPage
  'Layout anpassen': 'Customize layout',
  'Die Vorschau ist der Editor': 'The preview is the editor',
  'Dein Zuhause.': 'Your home.',
  'Deine Regeln.': 'Your rules.',
  'Was du hier anfasst, ist sofort deine App — keine Vorschau, das Original in klein.':
    'Whatever you touch here is instantly your app — not a preview, the real thing in miniature.',
  'Halten und ziehen ändert die Reihenfolge': 'Hold and drag to change the order',
  'Das Auge blendet eine Sektion aus': 'The eye hides a section',
  'Die untere Leiste belegst du selbst — bis zu {n} Ziele':
    'You fill the bottom bar yourself — up to {n} destinations',
  '{name} einblenden': 'Show {name}',
  '{name} ausblenden': 'Hide {name}',
  Mehr: 'More',
  'Antippen legt ein Ziel in die untere Leiste — Tippen in der Leiste entfernt es wieder, Ziehen sortiert.':
    'Tap to put a destination in the bottom bar — tap it in the bar to remove it again, drag to sort.',
  '{name} aus der Navigation entfernen': 'Remove {name} from the navigation',
  '{name} zur Navigation hinzufügen': 'Add {name} to the navigation',
  'Alle {n} Plätze belegt — entferne erst ein Ziel in der Leiste.':
    'All {n} slots are taken — remove a destination from the bar first.',

  // Sektions-Labels (Home-Layout)
  'Freunde-Aktivitäten': 'Friend activity',
  Schnellzugriff: 'Quick access',
  Weiterschauen: 'Continue watching',
  'Heute Neu': 'New today',
  'Saisonale Empfehlungen': 'Seasonal picks',
  Bestbewertet: 'Top rated',
  'Für dich': 'For you',
  Statistiken: 'Statistics',
  'KI-Empfehlungen': 'AI recommendations',
  'Bewertungs-Queue': 'Rating queue',
  'Nicht weitergeschaut': 'Not continued',
  Entdecken: 'Discover',
  Verlauf: 'History',
  Freunde: 'Friends',
  Rangliste: 'Leaderboard',

  // Nav-Slot-Labels (Dock/Palette)
  Weiter: 'Next',
  Kalender: 'Calendar',
  Aktivität: 'Activity',
  Abos: 'Subscriptions',
};

export default settings;
