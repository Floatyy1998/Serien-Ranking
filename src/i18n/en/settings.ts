/** Einstellungen (Settings-Bereich) — Deutsch → Englisch. */

const settings: Record<string, string> = {
  'Bild wird geladen…': 'Loading image…',
  'Bild konnte nicht geladen werden': 'That image could not be loaded',
  'Bild zuschneiden': 'Crop image',
  'Ziehen zum Verschieben, Regler zum Vergrößern': 'Drag to move, slider to zoom',
  'Als Profilbild verwenden': 'Use as profile picture',
  Vergrößern: 'Zoom',
  'Wird hochgeladen…': 'Uploading…',
  'Das ist kein Bild': 'That is not an image',
  'Bild darf maximal 10 MB groß sein': 'Images may be up to 10 MB',
  'Profilbild ändern': 'Change profile picture',
  Schließen: 'Close',
  Sprache: 'Language',
  'Auto nutzt die Gerätesprache. Sprechen wir sie nicht, erscheint die App auf Englisch.':
    "Auto uses your device language. If we don't speak it, the app will be in English.",
  'Streaming-Land': 'Streaming country',
  'Auto (aus Gerätesprache)': 'Auto (from device language)',
  'Bestimmt, für welches Land Streaming-Anbieter angezeigt werden.':
    "Sets which country's streaming providers are shown.",
  // USA, Portugal und Japan heißen im Englischen gleich — der Eintrag steht
  // trotzdem hier, damit jeder übersetzbare Schlüssel in `en/` auftaucht und
  // weitere Sprachen ihn nicht übersehen (auf Spanisch „EE. UU.", „Japón").
  USA: 'USA',
  Portugal: 'Portugal',
  Japan: 'Japan',
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
  Argentinien: 'Argentina',
  Kolumbien: 'Colombia',
  Chile: 'Chile',
  Peru: 'Peru',
  Südkorea: 'South Korea',
  Indien: 'India',
  Türkei: 'Turkey',

  // SettingsPage
  Einstellungen: 'Settings',
  'TV-Rank für Windows herunterladen': 'Download TV-Rank for Windows',
  'APK direkt herunterladen und installieren': 'Download and install the APK directly',
  'App bewerten': 'Rate the app',
  'Eine Bewertung im Store hilft anderen beim Finden':
    'A store review helps other people find TV-Rank',
  'TV-Rank beim Hochfahren starten': 'Launch TV-Rank at startup',
  Abmelden: 'Log out',

  // useSettingsData (Snackbars/Dialoge)
  'Möchtest du dich wirklich abmelden?': 'Are you sure you want to log out?',
  'Bild darf maximal 100MB groß sein': 'Image must be 100MB or smaller',
  'Profilbild erfolgreich hochgeladen!': 'Profile picture uploaded!',
  'Fehler beim Hochladen des Bildes': "Couldn't upload image",
  'Anzeigename gespeichert!': 'Display name saved!',
  'Fehler beim Speichern des Anzeigenamens': "Couldn't save display name",
  'Link kopiert!': 'Link copied!',
  'Schau dir mein TV-Rank-Profil an!': 'Check out my TV-Rank profile!',
  'Teilen nicht möglich': 'Sharing not available',

  // ProfileSection
  'Profilbild von {name}': "{name}'s profile picture",
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
  'Passwort wiederholen': 'Confirm password',
  'Wird gespeichert…': 'Saving…',
  'Passwort festlegen': 'Set password',

  // AppearanceSection
  'Farben und Aussehen anpassen': 'Customize colors and appearance',
  'Homepage Layout': 'Homepage layout',
  'Sektionen sortieren & ausblenden': 'Reorder & hide sections',
  Anzeigegröße: 'Display size',
  'Ganze App größer oder kleiner': 'Make the whole app bigger or smaller',
  Klein: 'Small',
  Standard: 'Default',
  Groß: 'Large',
  'Sehr groß': 'Extra large',

  // LegalSection
  'Rechtliches & Datenquellen': 'Legal & data sources',
  Datenschutzerklärung: 'Privacy policy',
  Impressum: 'Legal notice',
  'Analyse & Datenschutz': 'Analytics & privacy',
  Nutzungsstatistiken: 'Usage statistics',
  'Kontobezogene Nutzungsdaten zur Verbesserung der App — keine Drittanbieter':
    'Account-linked usage data to improve the app — no third parties',
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
  'Import & Export': 'Import & Export',
  'Export als JSON (Backup)': 'Export as JSON (backup)',
  'Export als CSV': 'Export as CSV',
  'JSON enthält deine komplette Watch-History (re-importierbar), CSV eine Zeile pro Folge/Film mit TMDB-Ids für andere Apps.':
    'JSON contains your complete watch history (re-importable), CSV has one row per episode/movie with TMDB ids for other apps.',
  'Import (TV-Rank- oder Trakt-JSON)': 'Import (TV-Rank or Trakt JSON)',
  'Datei nicht erkannt. Unterstützt: TV-Rank-Export-JSON und Trakt-JSON.':
    'File not recognized. Supported: TV-Rank export JSON and Trakt JSON.',
  '{n} Serien ({e} Folgen), {m} Filme erkannt': '{n} shows ({e} episodes), {m} movies found',
  '{n} Serien davon neu — sie werden deiner Liste hinzugefügt.':
    "{n} of these shows are new — they'll be added to your list.",
  'Bestehende Markierungen werden nie überschrieben.':
    'Existing watch progress is never overwritten.',
  'Import läuft… {done}/{total}': 'Importing… {done}/{total}',
  'Import starten': 'Start import',
  'Import abgeschlossen!': 'Import complete!',
  'Import fehlgeschlagen': 'Import failed',
  '{n} Einträge ohne auflösbare TMDB-Id übersprungen.':
    '{n} entries skipped (no resolvable TMDB id).',
  '{s} Serien neu, {e} Folgen importiert, {se} Folgen übersprungen (schon markiert), {m} Filme aktualisiert, {sm} Filme übersprungen.':
    '{s} new series, {e} episodes imported, {se} episodes skipped (already marked), {m} movies updated, {sm} movies skipped.',
  '{n} Einträge fehlgeschlagen:': '{n} entries failed:',
  '{days} T.': '{days} d.',
  'Provider-Änderungen': 'Provider changes',
  'Benachrichtigung wenn ein Streaming-Anbieter wechselt':
    'Get notified when a streaming provider changes',
  'Provider-Änderungs-Benachrichtigungen': 'Provider change notifications',
  'Erinnerungen kommen frühestens 30 Tage nach der letzten Anzeige wieder — selbst wenn die Serie weiter inaktiv ist. Schaust du eine Episode, wird die Erinnerung beim nächsten Inaktivwerden direkt wieder freigeschaltet.':
    'Reminders come back no sooner than 30 days after they were last shown — even if the show stays inactive. Once you watch an episode, the reminder is ready again the next time the show goes inactive.',

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
  'Das Auge blendet eine Sektion aus': 'Tap the eye to hide a section',
  'Die untere Leiste belegst du selbst — bis zu {n} Ziele':
    'You fill the bottom bar yourself — up to {n} tabs',
  '{name} einblenden': 'Show {name}',
  '{name} ausblenden': 'Hide {name}',
  Mehr: 'More',
  'Antippen legt ein Ziel in die untere Leiste — Tippen in der Leiste entfernt es wieder, Ziehen sortiert.':
    'Tap to add a tab to the bottom bar — tap it in the bar to remove it, drag to reorder.',
  '{name} aus der Navigation entfernen': 'Remove {name} from the navigation',
  '{name} zur Navigation hinzufügen': 'Add {name} to the navigation',
  'Alle {n} Plätze belegt — entferne erst ein Ziel in der Leiste.':
    'All {n} slots are full — remove a tab from the bar first.',

  // Sektions-Labels (Home-Layout)
  'Freunde-Aktivitäten': 'Friend activity',
  Schnellzugriff: 'Quick access',
  Weiterschauen: 'Continue watching',
  'Heute Neu': 'New today',
  'Saisonale Empfehlungen': 'Seasonal picks',
  Bestbewertet: 'Top rated',
  'Für dich': 'For you',
  Statistiken: 'Stats',
  'KI-Empfehlungen': 'AI recommendations',
  'Bewertungs-Queue': 'Rating queue',
  'Nicht weitergeschaut': 'Stopped watching',
  Entdecken: 'Discover',
  Verlauf: 'History',
  Freunde: 'Friends',
  Rangliste: 'Leaderboard',

  // Nav-Slot-Labels (Dock/Palette)
  Weiter: 'Next',
  Kalender: 'Calendar',
  Aktivität: 'Activity',
  Abos: 'Subscriptions',

  // Spoiler-Schutz ('Aus' ist oben schon übersetzt)
  'Spoiler-Schutz': 'Spoiler protection',
  Bilder: 'Images',
  Streng: 'Strict',
  'Alles sichtbar': 'Show everything',
  'Bilder ungesehener Folgen blurren': 'Blur images for unwatched episodes',
  'Auch Titel und Beschreibungen verstecken': 'Also hide titles and descriptions',
  // Auf Deutsch und Englisch gleich geschrieben — der Eintrag steht hier
  // trotzdem, damit weitere Sprachen ihn überhaupt erreichen können.
  Text: 'Text',
  // Auf Deutsch und Englisch gleich geschrieben — der Eintrag steht hier
  // trotzdem, damit weitere Sprachen ihn überhaupt erreichen können.
  'Diese Seite beschreibt, wie du dein TV-Rank-Konto (App und Web, Anbieter: Konrad Dinges) endgültig löschst und welche Daten dabei entfernt werden.':
    'This page explains how to permanently delete your TV-Rank account (app and web, provider: Konrad Dinges) and which data is removed in the process.',
  'So löschst du dein Konto': 'How to delete your account',
  'Melde dich in der TV-Rank-App oder auf tv-rank.de an.':
    'Sign in to the TV-Rank app or at tv-rank.de.',
  Öffne: 'Open',
  'Mehr → Einstellungen': 'More → Settings',
  'Wähle unten': 'At the bottom, select',
  'und bestätige mit deinem Passwort.': 'and confirm with your password.',
  'Die Löschung erfolgt sofort und kann nicht rückgängig gemacht werden.':
    "Deletion takes effect immediately and can't be undone.",
  'Welche Daten gelöscht werden': 'What data gets deleted',
  'Mit dem Konto werden alle zugehörigen Daten dauerhaft gelöscht: Anmeldedaten (E-Mail-Adresse), Profil und Profilbild, deine Serien-, Film- und Manga-Listen samt Watch-Verlauf, Bewertungen, Statistiken, Erfolge und virtuelle Haustiere, Freundschaften, Ranglisten-Einträge sowie ein eventuell aktiviertes öffentliches Profil. Es gibt keine zusätzliche Aufbewahrungsfrist.':
    'Deleting your account permanently removes all associated data: login details (email address), your profile and profile picture, your show, movie and manga lists including watch history, ratings, stats, achievements and virtual pets, friends, leaderboard entries, and a public profile if you enabled one. There is no additional retention period.',
  'Von dir verfasste Beiträge in öffentlichen Diskussionen können in anonymisierter Form erhalten bleiben.':
    "Posts you've written in public discussions may be kept in anonymized form.",
  'Alternativ: Löschung anfordern': 'Alternative: request deletion',
  'Ohne Zugriff auf dein Konto kannst du die Löschung auch per E-Mail über die Kontaktdaten im':
    "If you can't access your account, you can also request deletion by email using the contact details in the",
  'anfordern. Weitere Informationen zur Datenverarbeitung findest du in der':
    ". You'll find more information on how your data is processed in the",
  'Desktop App': 'Desktop App',
  // Gleich geschrieben wie auf Deutsch — Eintrag noetig, damit Spanisch und
  // Franzoesisch sie ueberhaupt erreichen.
  Design: 'Appearance',
  'Android App': 'Android App',
  Autostart: 'Launch at startup',
  'Design & Themes': 'Appearance & Themes',
  'Patch Notes': 'Patch Notes',
};

export default settings;
