/** Startseite (HomePage-Bereich inkl. Begrüßungen) — Deutsch → Englisch. */

const dict: Record<string, string> = {
  // HomePage
  'Für dich': 'For you',
  'Trending diese Woche': 'Trending this week',
  Bestbewertet: 'Top rated',

  // GreetingSection
  Episoden: 'Episodes',
  Filme: 'Movies',
  Aktiv: 'Active',
  Heute: 'Today',
  'Sprache des Grußes anzeigen': 'Show the language of this greeting',
  'Suche öffnen': 'Open search',
  'Suche nach Serien oder Filmen': 'Search for series or movies',

  // LiveClock
  '{time} Uhr': '{time}',

  // StatsGrid
  'Deine Statistiken': 'Your stats',
  'Statistiken einklappen': 'Collapse stats',
  'Statistiken ausklappen': 'Expand stats',
  'Eps. (begonnen, nicht abgebr.)': 'Eps. (started, not dropped)',
  Serien: 'Series',
  '{n} komplett': '{n} completed',
  '{n} geschaut': '{n} watched',
  'Gesamte Watchzeit': 'Total watch time',
  'Diese Woche': 'This week',
  '{n} Ep.': '{n} eps',
  'neu geschaut': 'newly watched',
  'Zeit mit Serien': 'Series watch time',
  'Zeit mit Filmen': 'Movie watch time',
  'Ø Serien-Rating': 'Avg. series rating',
  'Ø Film-Rating': 'Avg. movie rating',
  Lieblingsgenre: 'Favorite genre',
  Hauptprovider: 'Main provider',
  Keine: 'None',

  // Quick/Secondary actions
  Entdecken: 'Discover',
  Verlauf: 'History',
  Freunde: 'Friends',
  Rangliste: 'Leaderboard',

  // CatchUpCard
  '{n} Min': '{n} min',
  '{n} Std': '{n} hrs',
  '{n}+ Tage': '{n}+ days',
  'Backlog: {series} Serien, {episodes} Episoden': 'Backlog: {series} series, {episodes} episodes',
  '{series} Serien · {episodes} Ep.': '{series} series · {episodes} eps',

  // RatingQueueCard
  'Schnell bewerten: {n} gesehene Titel ohne Bewertung':
    'Quick rate: {n} watched titles without a rating',
  Bewerten: 'Rate',
  '{n} Titel wartet auf deine Bewertung': '{n} title is waiting for your rating',
  '{n} Titel warten auf deine Bewertung': '{n} titles are waiting for your rating',

  // CountdownBanner
  'Heute!': 'Today!',
  Morgen: 'Tomorrow',
  'in {n} Tagen': 'in {n} days',
  'Countdown: {title}, Staffel {season} {days}': 'Countdown: {title}, season {season} {days}',
  'Staffel {n}': 'Season {n}',
  Tag: 'day',
  Tage: 'days',

  // HiddenSeriesCard
  'Nicht weitergeschaut': 'Stopped watching',
  'Nicht weitergeschaut: {n} Serie ausgeblendet': 'Stopped watching: {n} series hidden',
  'Nicht weitergeschaut: {n} Serien ausgeblendet': 'Stopped watching: {n} series hidden',
  '{n} Serie ausgeblendet': '{n} series hidden',
  '{n} Serien ausgeblendet': '{n} series hidden',

  // PosterNavSheet
  'Zur Episode': 'Go to episode',
  'Zur Serie': 'Go to series',

  // StreakShieldDialog
  Schließen: 'Close',
  opfert: 'sacrifices',
  'um deine': 'to save your',
  '{n}-Tage-Streak': '{n}-day streak',
  ' zu retten.': '.',
  'XP-Kosten': 'XP cost',
  '{name} wird auf Level {level} fallen': '{name} will drop to level {level}',
  Abbrechen: 'Cancel',
  'Aktiviere...': 'Activating...',
  Aktivieren: 'Activate',

  // StreamingReminderCard
  'lange nicht mehr': 'ages',
  gestern: 'a day',
  '{n} Tagen': '{n} days',
  '{n} Monaten': '{n} months',
  '{n} Jahren': '{n} years',
  '{name} pausiert': '{name} paused',
  '{amount}/Monat schläft': '{amount}/month sitting idle',
  '{n} Abo ungenutzt': '{n} unused subscription',
  '{n} Abos ungenutzt': '{n} unused subscriptions',
  '{n} Abo ohne Aktivität · Tippen für Details':
    '{n} subscription with no activity · tap for details',
  '{n} Abos ohne Aktivität · Tippen für Details':
    '{n} subscriptions with no activity · tap for details',
  'Seit {time} nichts mehr': 'Inactive for {time}',
  '{amount}/M': '{amount}/mo',
  '{name} pausieren': 'Pause {name}',
  Pausieren: 'Pause',

  // NotificationSheet
  'Neues in TV-Rank': "What's new in TV-Rank",
  Benachrichtigungen: 'Notifications',
  '{n} ungelesen': '{n} unread',
  'Alles gelesen': 'All caught up',
  'Alle als gelesen markieren': 'Mark all as read',
  'Alles ruhig hier': 'All quiet here',
  'Keine neuen Benachrichtigungen': 'No new notifications',
  'Alle Aktivitäten anzeigen': 'Show all activity',

  // useUnifiedNotifications
  Unbekannt: 'Unknown',
  Freund: 'Friend',
  'hat "{title}" bewertet': 'rated "{title}"',
  'hat "{title}" auf die Watchlist gesetzt': 'added "{title}" to their watchlist',
  'hat "{title}" hinzugefügt': 'added "{title}"',
  Freundschaftsanfrage: 'Friend request',
  'empfiehlt dir "{title}"': 'recommends "{title}" to you',
  'gerade eben': 'just now',
  'vor {n} Min': '{n} min ago',
  'vor {n} Std': '{n} hrs ago',
  'vor {n} Tag': '{n} day ago',
  'vor {n} Tagen': '{n} days ago',

  // Announcements
  'Neu: Deine Navigation, dein Layout 🎛️': 'New: Your navigation, your layout 🎛️',
  'Die untere Leiste gehört jetzt dir: Belege bis zu 4 Plätze mit deinen Lieblingszielen — von Statistiken bis Backlog. Dazu ein komplett neuer Layout-Editor, in dem du deine Homepage als Mini-App direkt anfasst, eine neu gebaute Rangliste im Kino-Look und schärfere Backdrops auf großen Displays. Alle Details in den Patch Notes.':
    'The bottom bar is yours now: fill up to 4 slots with your favorite destinations — from stats to backlog. Plus an all-new layout editor where you shape your homepage like a mini app, a rebuilt cinematic leaderboard, and sharper backdrops on large displays. Full details in the patch notes.',
  'TV-Rank in neuem Gewand ✨': 'A whole new look for TV-Rank ✨',
  'Das größte Update aller Zeiten: komplettes Redesign mit Kino-Look auf jeder Seite, neues Profil mit Backdrop-Hero deiner Top-Serien, Desktop nutzt endlich die volle Breite, neue Startseite — und Updates installieren sich ab jetzt unsichtbar im Hintergrund, ohne dich je zu unterbrechen. Alle Details in den Patch Notes.':
    'The biggest update ever: a complete redesign with a cinematic look on every page, a new profile with a backdrop hero of your top shows, desktop finally uses the full width, a new home screen — and updates now install invisibly in the background without ever interrupting you. Full details in the patch notes.',
  'Neu: Anime-Season-Kalender': 'New: Anime season calendar',
  'Alle Anime der Season auf einen Blick: Premieren-Timeline mit Live-Countdown zur nächsten großen Premiere, „Staffel 2"/„NEU"-Chips, Termine wie in deinem Kalender (TVMaze-geprüft) und Direkteinstieg zu deinen Serien. Alles in den Patch Notes.':
    'Every anime of the season at a glance: a premiere timeline with a live countdown to the next big premiere, "Season 2"/"NEW" chips, dates just like in your calendar (TVMaze-verified), and quick access to your shows. All in the patch notes.',
  'Neu: Mehr über deine Freunde': 'New: More about your friends',
  'Freunde-Stand auf jeder Seriendetail-Seite, „Was schaut Lisa gerade", „Worauf wartet sie", Pet-Sneakpeek mit Snack-Geschenk und Air-Date + Watched-Date pro Folge. Alles in den Patch Notes.':
    'Friend progress on every series detail page, "What\'s Lisa watching right now", "What\'s she waiting for", a pet sneak peek with snack gifts, and air date + watched date per episode. All in the patch notes.',
  'Neu: Anime-Filler, Aktivitäts-Ticker & mehr': 'New: Anime fillers, activity ticker & more',
  'Anime-Filler/Recap auf Detail-Seite und in der Episoden-Liste, Freunde-Aktivitäten als sanfter Ticker auf der Homepage, Streaming-Reminder mit Pausieren-Button, Pet-Reaktionen auf Streaks, sanfte Seitenwechsel – alles in den Patch Notes.':
    'Anime filler/recap on the detail page and in the episode list, friend activity as a gentle ticker on the home screen, streaming reminders with a pause button, pet reactions to streaks, smooth page transitions — all in the patch notes.',
  'Neu: Empfehlungen an Freunde': 'New: Recommend to friends',
  'Auf jeder Detailseite ist jetzt ein „Empfehlen"-Button. Schick Serien & Filme an deine Freunde – sie sehen die Empfehlung als Karte im Bell-Hub mit „Anschauen" oder „Nope". Freunde, die das Item schon haben, sind ausgegraut.':
    'Every detail page now has a "Recommend" button. Send series & movies to your friends — they see the recommendation as a card in the bell hub with "Watch" or "Nope". Friends who already have the item are greyed out.',
  'Neu: Streaming-Abos': 'New: Streaming subscriptions',
  'Pflege deine aktiven Anbieter, sieh was du ungenutzt zahlst, finde Watchlist-Lücken und filtere alles nach deinen Abos. Calendar bekommt Brand-Color-Streifen, Override pro Serie ist möglich.':
    'Manage your active providers, see what you pay for without using it, find watchlist gaps, and filter everything by your subscriptions. The calendar gets brand-color stripes, with per-series overrides.',
  'Neues Feature: Homepage Layout': 'New feature: Homepage layout',
  'Du kannst jetzt deine Homepage-Sektionen sortieren und ausblenden! Gehe zu Profil → Homepage Layout um es auszuprobieren.':
    'You can now reorder and hide your homepage sections! Go to Profile → Homepage Layout to try it out.',
  'Neue Features: Kalender, Fortschritt & mehr': 'New features: Calendar, progress & more',
  'Neuer Kalender, Progress-Bars, Provider-Filter & Schnellmarkierung.':
    'New calendar, progress bars, provider filters & quick marking.',
  'Neu: KI-Empfehlungen': 'New: AI recommendations',
  'Personalisierte Serien- und Film-Vorschläge basierend auf deinem Geschmack. Jetzt unter "Für dich" auf der Startseite ausprobieren!':
    'Personalized series and movie suggestions based on your taste. Try it now under "For you" on the home screen!',
  'Neues Design: Trending & Co.': 'New design: Trending & co.',
  'Trending, Saisonal und Bestbewertet haben ein neues Kino-Design mit Rang-Nummern, Genres und Ratings bekommen!':
    'Trending, Seasonal, and Top Rated got a new cinematic design with rank numbers, genres, and ratings!',
  'QoL-Update: Kalender, Detail & Provider': 'QoL update: Calendar, detail & providers',
  'Auto-Scroll zum heutigen Tag, Staffelpause/Staffelende-Chips, Provider-Badges auf allen Karten, smarter Status-Badge und mehr!':
    'Auto-scroll to today, season break/finale chips, provider badges on all cards, a smarter status badge, and more!',

  // NotificationItem / RecommendationCard
  Annehmen: 'Accept',
  Ablehnen: 'Decline',
  'empfiehlt dir': 'recommends to you',
  Film: 'Movie',
  Serie: 'Series',
  Anschauen: 'Watch',

  // SeriesNotificationHub
  Neu: 'New',
  'Abo fehlt': 'No sub',
  Inaktiv: 'Inactive',
  Fertig: 'Done',
  'Benachrichtigungs-Kategorien': 'Notification categories',

  // WrappedNotification
  'Dein {year} Wrapped ist da – Entdecke deinen Jahresrückblick':
    'Your {year} Wrapped is here – explore your year in review',
  'Dein Wrapped ist da': 'Your Wrapped is here',
  'Entdecke deinen Jahresrückblick': 'Explore your year in review',

  // ActivityMarquee
  Jemand: 'Someone',
  '{who} hat „{title}" hinzugefügt': '{who} added "{title}"',
  '{who} hat „{title}" auf die Watchlist gesetzt': '{who} added "{title}" to their watchlist',
  '{who} hat eine Folge von „{title}" gesehen': '{who} watched an episode of "{title}"',
  '{who} bingt gerade „{title}"': '{who} is binging "{title}"',
  '{who} hat „{title}" mit {rating} bewertet': '{who} rated "{title}" {rating}',
  '{who} hat „{title}" bewertet': '{who} rated "{title}"',
  'Aktivitäten deiner Freunde anzeigen': "Show your friends' activity",

  // PlayTestBanner
  'Hol TV-Rank in den Play Store!': 'Get TV-Rank on the Play Store!',
  'Du willst die Android-App testen? Öffne ein Feature-Ticket mit deiner Play-Store-E-Mail — du wirst dann persönlich zum Test eingeladen.':
    'Want to test the Android app? Open a feature ticket with your Play Store email — you will get a personal invite to the test.',
  'Hinweis ausblenden': 'Dismiss note',
  'Feature-Ticket öffnen': 'Open feature ticket',

  // DailySpinCard
  'Glücksrad drehen': 'Spin the wheel',
  'Glücksrad – morgen wieder verfügbar': 'Daily Spin – back tomorrow',
  Glücksrad: 'Daily Spin',
  'Jetzt drehen!': 'Spin now!',
  'Morgen wieder verfügbar': 'Back tomorrow',
  '{n}d Bonus': '{n}d bonus',
  '{n}x gedreht': '{n} spins',

  // MilestoneBoxCard
  'Mystery Box öffnen – {n} verfügbar': 'Open Mystery Box – {n} available',
  '{n} Box verfügbar!': '{n} box available!',
  '{n} Boxen verfügbar!': '{n} boxes available!',
  'Nächste in {n} Episoden': 'Next in {n} episodes',

  // ProactiveRecapCard
  heute: 'today',
  morgen: 'tomorrow',
  'Staffel {n} startet {when}!': 'Season {n} starts {when}!',
  'Staffel {n} wird {when} fortgesetzt!': 'Season {n} continues {when}!',
  'Recap wird generiert...': 'Generating recap...',
  'Recap der vorherigen Staffel': 'Recap of the previous season',
  'Recap vor der Fortsetzung': 'Recap before it continues',
  Einklappen: 'Collapse',
  'Recap lesen': 'Read recap',
  '{current} von {total}': '{current} of {total}',

  // TasteProfileCard / TasteMatchCard / WatchJourneyCard
  'KI Geschmacksprofil: Dein Seriengeschmack analysiert':
    'AI taste profile: your series taste analyzed',
  'KI-Empfehlungen': 'AI recommendations',
  'Personalisierte Vorschläge': 'Personalized suggestions',
  'Taste Match: Geschmack mit Freunden vergleichen': 'Taste Match: compare taste with friends',
  'Geschmack vergleichen': 'Compare taste',
  'Profilbild von {name}': "{name}'s profile picture",
  'Freund auswählen': 'Pick a friend',
  'Watch Journey: Trends und Entwicklung anzeigen': 'Watch Journey: view trends and progress',
  'Trends & Entwicklung': 'Trends & progress',

  // WatchStreakCard
  'Fehler beim Aktivieren des Shields': 'Failed to activate the shield',
  'Kein Pet vorhanden': 'No pet available',
  'Dein Pet lebt nicht': "Your pet isn't alive",
  'Nicht genug XP ({have}/{need})': 'Not enough XP ({have}/{need})',
  'Cooldown: noch {n} Tag': 'Cooldown: {n} day left',
  'Cooldown: noch {n} Tage': 'Cooldown: {n} days left',
  'Streak gerettet!': 'Streak saved!',
  '{n} Tag in Folge': '{n} day in a row',
  '{n} Tage in Folge': '{n} days in a row',
  'Schau heute!': 'Watch today!',
  'Streak in Gefahr!': 'Streak in danger!',
  'Starte eine neue Streak!': 'Start a new streak!',
  'Streak Shield aktivieren': 'Activate streak shield',
  Rekord: 'Record',
  'Best: {n}': 'Best: {n}',
  'Heute geschaut': 'Watched today',
  'Schau heute, sonst bricht die Streak': 'Watch today or lose your streak',
  'Streak verloren': 'Streak lost',

  // useRewatchHandler
  'Episode-ID fehlt': 'Episode ID missing',
  '{title} {episode} Rewatch als gesehen markiert': '{title} {episode} rewatch marked as watched',
  'Undo fehlgeschlagen': 'Undo failed',
  'Fehler beim Speichern': 'Failed to save',

  // ContinueWatchingSection
  'Gerade eben gesehen': 'Watched just now',
  'Vor {n}h gesehen': 'Watched {n}h ago',
  'Gestern gesehen': 'Watched yesterday',
  'Vor {n} Tagen gesehen': 'Watched {n} days ago',
  'Vor 1 Woche gesehen': 'Watched 1 week ago',
  'Vor {n} Wochen gesehen': 'Watched {n} weeks ago',
  'Vor 1 Monat gesehen': 'Watched 1 month ago',
  'Vor {n} Monaten gesehen': 'Watched {n} months ago',
  Weiterschauen: 'Continue watching',
  'Noch nichts zum Weiterschauen': 'Nothing to continue yet',
  'Tippe in einer Serie auf das Lesezeichen-Symbol, damit sie hier erscheint.':
    'Tap the bookmark icon on a series to make it show up here.',
  '{n} Serie wartet noch.': '{n} series is still waiting.',
  '{n} Serien warten noch.': '{n} series are still waiting.',
  'Noch keine Serien in deiner Liste': 'No series in your list yet',
  'Stöbere unter Entdecken oder such direkt nach deiner Lieblingsserie — sobald du eine hinzufügst, geht’s hier weiter.':
    'Browse Discover or search for your favorite show — as soon as you add one, this is where you’ll pick it back up.',

  // TodayEpisodesSection
  'Heute Neu': 'New today',

  // TrendingRankCard
  'Platz {rank}: {title}': 'Rank {rank}: {title}',

  // MiniProviderBadges
  '{name}: Titel kopieren + Suche öffnen': '{name}: copy title + open search',
  '{name} öffnen': 'Open {name}',

  // HomeSearchOverlay
  Alle: 'All',
  '„{title}" hinzugefügt': '"{title}" added',
  'In deiner Liste': 'In your list',
  '„{title}" zur Liste hinzufügen': 'Add "{title}" to your list',
  'Serien & Filme suchen…': 'Search series & movies…',
  'Serien und Filme suchen': 'Search series and movies',
  'Suche leeren': 'Clear search',
  'Suche schließen': 'Close search',
  'Keine Treffer für „{query}“': 'No results for "{query}"',
  'Zuletzt gesucht': 'Recent searches',
  '„{term}" entfernen': 'Remove "{term}"',
  Beliebt: 'Popular',

  // Begrüßungen (Textpool) — Sprachen/Herkunft
  Deutsch: 'German',
  Norddeutsch: 'Northern German',
  Süddeutsch: 'Southern German',
  Englisch: 'English',
  Irisch: 'Irish',
  Italienisch: 'Italian',
  Französisch: 'French',
  Japanisch: 'Japanese',
  Spanisch: 'Spanish',
  Schweizerdeutsch: 'Swiss German',
  Berlinerisch: 'Berlin dialect',
  Sprichwort: 'Proverb',
  'Der Herr der Ringe': 'The Lord of the Rings',
  'Der Club der toten Dichter': 'Dead Poets Society',
  'Der König der Löwen': 'The Lion King',
  'Der Pate': 'The Godfather',
  'Stirb Langsam': 'Die Hard',
  'Findet Nemo': 'Finding Nemo',
  'Der weiße Hai': 'Jaws',
  'Dr. House': 'House',

  // Begrüßungen — Morgen
  'Guten Morgen': 'Good morning',
  'Schönen guten Morgen': 'Good morning to you',
  'Guten Morgen, Sonnenschein': 'Good morning, sunshine',
  'Na, schon wach': 'Hey, up already',
  'Gut geschlafen': 'Slept well',
  Aufgestanden: 'Up and about',
  'Kaffee schon getrunken': 'Had your coffee yet',
  Ausgeschlafen: 'Well rested',
  'Guten Morgen, Sam': 'Good morning, Sam',
  'Lauf, Forrest, lauf': 'Run, Forrest, run',
  'Möge die Macht mit dir sein': 'May the Force be with you',
  'Wach auf, Neo': 'Wake up, Neo',
  'Guten Morgen, Vietnam': 'Good morning, Vietnam',
  'Carpe diem — Nutze den Tag': 'Carpe diem — seize the day',
  'Und täglich grüßt das Murmeltier': "It's Groundhog Day… again",
  'Heute ist ein guter Tag zum Sterben': 'Today is a good day to die',
  'Ich bin Groot': 'I am Groot',
  'Ohana heißt Familie': 'Ohana means family',
  'Zu mir, mein Schatz': 'Come to me, my precious',
  'Das ist der Weg': 'This is the way',
  'Ich bin dann mal weg': "I'm off then",
  'Tschakka, du schaffst das': 'Tschakka, you can do it',
  'Auf ein Neues': 'Here we go again',
  'Bereit für Abenteuer': 'Ready for adventure',

  // Begrüßungen — Nachmittag
  'Guten Tag': 'Good day',
  Mahlzeit: 'Lunchtime',
  Hallo: 'Hello',
  'Grüß dich': 'Hi there',
  Na: 'Hey there',
  'Schönen Nachmittag': 'Good afternoon',
  'Tag auch': 'Afternoon',
  'Was geht': "What's up",
  'Alles klar': 'All good',
  'Bis zur Unendlichkeit und noch viel weiter': 'To infinity and beyond',
  'Leben ist wie eine Schachtel Pralinen': 'Life is like a box of chocolates',
  'Ich mache ihm ein Angebot, das er nicht ablehnen kann':
    "I'm gonna make him an offer he can't refuse",
  'Schau mir in die Augen, Kleines': "Here's looking at you, kid",
  'Ich bin zu alt für diesen Scheiß': "I'm too old for this shit",
  'Läuft bei dir': "You're on a roll",
  'Das Leben ist kein Ponyhof': "Life's no picnic",
  'Alles in Butter': "Everything's peachy",
  'Ich bin der, der klopft': 'I am the one who knocks',
  'Yippie-Ya-Yeah, Schweinebacke': 'Yippee-ki-yay, motherfucker',
  'Ich bin der König der Welt': "I'm the king of the world",
  'Houston, wir haben ein Problem': 'Houston, we have a problem',
  'Nach mir, nach mir': 'Mine, mine, mine',

  // Begrüßungen — Abend
  'Guten Abend': 'Good evening',
  Nabend: "Evenin'",
  'Schönen Feierabend': 'Enjoy your evening',
  'Na du': 'Hey you',
  'Schönen Abend noch': 'Have a nice evening',
  Feierabend: 'Quitting time',
  Prost: 'Cheers',
  'Couch-Zeit': 'Couch time',
  'Füße hoch': 'Feet up',
  'Zeit für Netflix': 'Time for Netflix',
  'Binge-Time': 'Binge time',
  'Ich komme wieder': "I'll be back",
  'Widerstand ist zwecklos': 'Resistance is futile',
  'Beam mich hoch, Scotty': 'Beam me up, Scotty',
  'Ein Lannister zahlt immer seine Schulden': 'A Lannister always pays his debts',
  'Ich bin dein Vater': 'I am your father',
  'Ich trinke und ich weiß Dinge': 'I drink and I know things',
  'Es ist nie Lupus': "It's never lupus",

  // Begrüßungen — Nacht
  'Gute Nacht': 'Good night',
  'Noch wach': 'Still up',
  'Na, noch nicht müde': 'Not sleepy yet',
  'Hey Nachteule': 'Hey night owl',
  'Auch noch wach': 'You up too',
  'Kannst nicht schlafen': "Can't sleep",
  'Noch am Bingen': 'Still binging',
  Schlaflos: 'Sleepless',
  Nachtschicht: 'Night shift',
  'Noch eine Folge': 'One more episode',
  'Nur noch diese eine Folge': 'Just this one last episode',
  'Die Nacht ist noch jung': 'The night is still young',
  'Nachts sind alle Katzen grau': 'All cats are grey in the dark',
  'Träum was Schönes': 'Sweet dreams',
  'Schlaf gut': 'Sleep tight',
  'Ab ins Bett': 'Off to bed',
  'Die Nacht ist dunkel und voller Schrecken': 'The night is dark and full of terrors',
  'Ich bin Batman': "I'm Batman",
  'Warum so ernst': 'Why so serious',
  'Schlaflos in Seattle': 'Sleepless in Seattle',
  'Wir sprechen nicht über Fight Club': "We don't talk about Fight Club",
  'Süße Träume': 'Sweet dreams',
  'Wir werden ein größeres Boot brauchen': "You're gonna need a bigger boat",
};

export default dict;
