/** Pre-Auth-Bereich (Start-Landing, Login/Registrierung, Onboarding) — Deutsch → Englisch. */

const dict: Record<string, string> = {
  // --- Auth: gemeinsame Bausteine ---
  'E-Mail': 'Email',
  Passwort: 'Password',
  'Passwort verbergen': 'Hide password',
  'Passwort anzeigen': 'Show password',
  'Ungültige E-Mail-Adresse.': 'Invalid email address.',
  'Unbekannter Fehler': 'Unknown error',
  'Dein Kino. Dein Ranking.': 'Your cinema. Your ranking.',
  'Tracke Serien, Filme & Manga — mit Freunden, Stats und allem Drum und Dran.':
    'Track series, movies & manga — with friends, stats, and all the bells and whistles.',

  // --- Login ---
  'Willkommen zurück': 'Welcome back',
  'Bitte gib zuerst deine E-Mail-Adresse ein.': 'Please enter your email address first.',
  'Wir haben dir eine E-Mail zum Zurücksetzen deines Passworts geschickt.':
    "We've sent you an email to reset your password.",
  'Falls ein Konto existiert, haben wir dir eine E-Mail geschickt.':
    "If an account exists, we've sent you an email.",
  'E-Mail konnte nicht gesendet werden. Bitte versuche es später erneut.':
    "The email couldn't be sent. Please try again later.",
  'Kein Benutzer mit dieser E-Mail-Adresse gefunden.': 'No user found with this email address.',
  'Falsches Passwort.': 'Wrong password.',
  'E-Mail oder Passwort ist falsch.': 'Email or password is incorrect.',
  'Ein Fehler ist aufgetreten: {code}': 'Something went wrong: {code}',
  'Anmelden...': 'Signing in...',
  Anmelden: 'Sign in',
  'Passwort vergessen?': 'Forgot your password?',
  'Noch kein Konto?': 'No account yet?',
  'Jetzt registrieren': 'Sign up now',
  '← Zur Startseite': '← Back to start',

  // --- Registrierung ---
  'Erstelle dein Konto': 'Create your account',
  'Passwörter stimmen nicht überein.': "Passwords don't match.",
  'Passwort muss mindestens 6 Zeichen lang sein.': 'Password must be at least 6 characters long.',
  'Anzeigename muss mindestens 3 Zeichen lang sein.':
    'Display name must be at least 3 characters long.',
  'Diese E-Mail-Adresse wird bereits verwendet.': 'This email address is already in use.',
  'Passwort ist zu schwach.': 'Password is too weak.',
  'Ein Fehler ist aufgetreten. Bitte versuche es später erneut.':
    'Something went wrong. Please try again later.',
  Anzeigename: 'Display name',
  'Passwort bestätigen': 'Confirm password',
  'Registrieren...': 'Signing up...',
  Registrieren: 'Sign up',
  'Bereits ein Konto?': 'Already have an account?',
  'Jetzt anmelden': 'Sign in now',

  // --- Social-Login ---
  'oder weiter mit': 'or continue with',
  'Anmelden…': 'Signing in…',
  'Mit Google anmelden': 'Sign in with Google',
  'Mit Apple anmelden': 'Sign in with Apple',
  'Kein ID-Token vom nativen Login erhalten.': 'No ID token received from native sign-in.',
  'Login in dieser App-Version noch nicht verfügbar.':
    'Sign-in is not available in this app version yet.',
  'E-Mail & Passwort': 'email & password',
  'einer anderen Methode': 'another sign-in method',
  'Für diese E-Mail existiert bereits ein Konto mit {label}. Bitte melde dich damit an.':
    'An account already exists for this email using {label}. Please sign in with that method.',
  'Diese Anmeldemethode ist noch nicht freigeschaltet. Bitte versuche es später erneut.':
    'This sign-in method is not enabled yet. Please try again later.',
  'Netzwerkfehler — bitte prüfe deine Internetverbindung.':
    'Network error — please check your internet connection.',
  'Zu viele Versuche — bitte warte einen Moment.': 'Too many attempts — please wait a moment.',
  'Anmeldung fehlgeschlagen: {code}': 'Sign-in failed: {code}',
  'Kein Social-Login-Konto.': 'Not a social sign-in account.',
  'Kein angemeldeter Nutzer mit E-Mail.': 'No signed-in user with an email.',

  // --- Onboarding: Schritte & Inhaltsverzeichnis ---
  Kuration: 'Curation',
  Serien: 'Series',
  Filme: 'Movies',
  Abos: 'Subscriptions',
  'Richtungen wählen': 'Pick directions',
  'Deine Favoriten': 'Your favorites',
  'Kino-Highlights': 'Cinema highlights',
  'Was streamst du': 'What you stream',
  'Vorhang auf': 'Curtain up',
  Programm: 'Program',
  '4 Akte': '4 acts',
  '5 Akte': '5 acts',

  // --- Onboarding: Welcome ---
  '01 — Kuration': '01 — Curation',
  'Wie dürfen wir dich nennen?': 'What should we call you?',
  'Dein Name': 'Your name',
  'Willkommen, {name}.': 'Welcome, {name}.',
  'Was läuft': 'What are you',
  'bei dir?': 'watching?',
  'wähle bis zu {max} richtungen': 'pick up to {max} directions',
  weiter: 'continue',
  'name: min. 3 zeichen': 'name: min. 3 characters',
  'mit {n}': 'with {n}',
  'wähle min. 1': 'pick at least 1',
  'jetzt nicht': 'not now',
  Komödie: 'Comedy',
  Krimi: 'Crime',
  Romanze: 'Romance',

  // --- Onboarding: Discovery (Serien/Filme) ---
  'Was läuft, was schaust, was willst du verfolgen?':
    "What's on, what are you watching, what do you want to follow?",
  'Welche Filme dürfen nicht fehlen?': 'Which movies are must-haves?',
  '← zurück': '← back',
  serien: 'series',
  filme: 'movies',
  'serie suchen — auch unbekannte titel …': 'search series — obscure titles welcome …',
  'film suchen — auch unbekannte titel …': 'search movies — obscure titles welcome …',
  gewählt: 'picked',
  'die katalogwand wird durchforstet …': 'combing through the catalog wall …',
  'kuration läuft …': 'curating …',
  'nichts.': 'nothing.',
  'leer.': 'empty.',
  'keine treffer für „{query}"': 'no matches for "{query}"',
  'nutze die suche, um etwas hinzuzufügen': 'use the search to add something',
  'weiter zu filmen': 'on to movies',
  fertig: 'done',
  '{n} gewählt': '{n} picked',
  'überspringen ok': 'skipping is fine',

  // --- Onboarding: Watch-Status & Episoden ---
  'Wo bist du bei': 'Where are you in',
  'Noch nicht gesehen': 'Not watched yet',
  'Steht auf der Watchlist': 'On my watchlist',
  'Bin mittendrin': "I'm in the middle",
  'Episode auswählen': 'Pick an episode',
  'Komplett gesehen': 'Watched it all',
  'Alle Episoden abhaken': 'Check off every episode',
  '← andere option': '← other option',
  'lade episoden …': 'loading episodes …',
  'Diese Serie ist noch nicht im Katalog. Wir notieren sie als watchlist — Episoden-Status kannst du später setzen.':
    "This series isn't in the catalog yet. We'll add it to your watchlist — you can set your episode progress later.",
  übernehmen: 'apply',
  'Tippe die letzte gesehene Episode an — alles davor wird abgehakt.':
    'Tap the last episode you watched — everything before it gets checked off.',
  hier: 'here',
  'gesehen · komplett': 'watched · all',
  'bei s{s} · e{e}': 'at s{s} · e{e}',
  entfernen: 'remove',

  // --- Onboarding: Abos ---
  'Was streamst du?': 'What do you stream?',
  'Deine Abos.': 'Your subscriptions.',
  'Damit zeigen wir dir welche Serien du direkt schauen kannst – und welche dir fehlen. Optional, kannst du auch später unter':
    "This shows you which series you can watch right away – and which ones you're missing. Optional — you can also manage this later under",
  'Profil → Streaming-Abos': 'Profile → Streaming subscriptions',
  'pflegen.': 'whenever you like.',
  '{n} ausgewählt': '{n} selected',
  'weiter · 1 Abo': 'continue · 1 subscription',
  'weiter · {n} Abos': 'continue · {n} subscriptions',
  überspringen: 'skip',

  // --- Onboarding: Abschluss ---
  'Setup läuft …': 'Setting up …',
  'Wir bereiten': 'Preparing',
  'deine Bühne vor.': 'your stage.',
  'Kapitel 04 — Premiere': 'Chapter 04 — Premiere',
  Vorhang: 'Curtain',
  'auf.': 'up.',
  'Deine Mediathek ist eingerichtet. Vom ersten Pilot bis zum letzten Abspann — alles ist bereit.':
    'Your library is all set. From the first pilot to the final credits — everything is ready.',
  fortgesetzt: 'resumed',
  'Deine Auswahl': 'Your picks',
  "los geht's": "let's go",

  // --- Start-Landing ---
  'Serien, Film & Manga Tracker': 'Series, movie & manga tracker',
  'Dein ultimativer Serien, Film & Manga Tracker': 'Your ultimate series, movie & manga tracker',
  'Entdecke neue Serien, Filme und Manga, verwalte deine Watchlist, tracke deinen Fortschritt und teile deine Favoriten mit Freunden.':
    'Discover new series, movies and manga, manage your watchlist, track your progress, and share your favorites with friends.',
  'Kostenlos starten': 'Start for free',
  'Desktop App herunterladen': 'Download the desktop app',
  'Alles was du brauchst': 'Everything you need',
  'Features für das beste Tracking-Erlebnis': 'Features for the best tracking experience',
  'Serien-Tracking': 'Series tracking',
  'Verfolge jede Episode, markiere gesehene Folgen und verpasse nie wieder eine neue Staffel.':
    'Follow every episode, mark them as watched, and never miss a new season again.',
  'Film-Bibliothek': 'Movie library',
  'Organisiere deine Filmsammlung, bewerte Filme und entdecke neue Highlights.':
    'Organize your movie collection, rate films, and discover new highlights.',
  Bewertungssystem: 'Rating system',
  'Bewerte nach verschiedenen Kategorien und behalte den Überblick über deine Favoriten.':
    'Rate across different categories and keep track of your favorites.',
  'Badges & Erfolge': 'Badges & achievements',
  'Sammle Badges für deine Aktivitäten und zeige deine Achievements.':
    'Collect badges for your activity and show off your achievements.',
  'Freunde-System': 'Friends system',
  'Teile deine Listen mit Freunden und entdecke, was andere schauen.':
    'Share your lists with friends and see what others are watching.',
  'Manga-Tracking': 'Manga tracking',
  'Tracke Manga, Manhwa und Manhua. Kapitelfortschritt, Bewertungen und Release-Daten.':
    'Track manga, manhwa, and manhua. Chapter progress, ratings, and release dates.',
  Statistiken: 'Statistics',
  'Detaillierte Einblicke in deine Seh- und Lesegewohnheiten.':
    'Detailed insights into your watching and reading habits.',
  'Weitere Highlights': 'More highlights',
  Blitzschnell: 'Lightning fast',
  'Optimierte Performance für ein flüssiges Erlebnis':
    'Optimized performance for a smooth experience',
  'Deine Daten auf allen Geräten synchronisiert': 'Your data synced across all your devices',
  'Benachrichtigungen für neue Episoden und Updates': 'Notifications for new episodes and updates',
  'Umfassende Einblicke in deine Seh- und Lesegewohnheiten':
    'Comprehensive insights into your watching and reading habits',
  'Bereit loszulegen?': 'Ready to dive in?',
  'Starte noch heute und entdecke deine neue Lieblingsserie':
    'Start today and find your next favorite series',
  'Jetzt kostenlos registrieren': 'Sign up for free now',
  Datenschutz: 'Privacy',
  Impressum: 'Legal notice',
  'Suche nach Serien oder Filmen': 'Search for series or movies',
  Weiterschauen: 'Continue watching',
  'Staffel 2 · Folge 5': 'Season 2 · Episode 5',
  'Staffel 1 · Folge 8': 'Season 1 · Episode 8',
  'Staffel 4 · Folge 12': 'Season 4 · Episode 12',
};

export default dict;
