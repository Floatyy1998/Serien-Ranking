/** Englische Übersetzungen: Patch Notes. */
const dict: Record<string, string> = {
  // Version titles
  'Juli 2026 – Filme im Rampenlicht': 'July 2026 – Movies in the Spotlight',
  'Juli 2026 – TV-Rank klopft an': 'July 2026 – TV-Rank Comes Knocking',
  'Juli 2026 – Deine Navigation, dein Layout': 'July 2026 – Your Navigation, Your Layout',
  'Juli 2026 – Das große Redesign': 'July 2026 – The Big Redesign',
  'Juli 2026 – Anime-Season-Kalender': 'July 2026 – Anime Season Calendar',
  'Juni 2026 – Mehr über deine Freunde': 'June 2026 – More About Your Friends',
  'Juni 2026 – Anime, Aktivität & Polish': 'June 2026 – Anime, Activity & Polish',
  'Juni 2026 – Empfehlungen an Freunde': 'June 2026 – Recommendations to Friends',
  'Juni 2026 – Streaming-Abos': 'June 2026 – Streaming Subscriptions',
  'März 2026 – QoL Update': 'March 2026 – QoL Update',
  'März 2026 – Update 3': 'March 2026 – Update 3',
  'März 2026 – Update 2': 'March 2026 – Update 2',
  'März 2026': 'March 2026',
  'Februar 2026': 'February 2026',

  // Link labels
  'Zum Film-Kalender': 'Go to the Movie Calendar',
  'Zu den Einstellungen': 'Go to Settings',
  'Leiste anpassen': 'Customize the Bar',
  'Zur Rangliste': 'Go to the Leaderboard',
  'Zum Profil': 'Go to Profile',
  'Zum Anime-Season-Kalender': 'Go to the Anime Season Calendar',
  'Layout anpassen': 'Customize Layout',
  'Sektionen sortieren': 'Sort Sections',
  'Streaming-Abos öffnen': 'Open Streaming Subscriptions',
  'Abos verwalten': 'Manage Subscriptions',
  'Insights ansehen': 'View Insights',
  'Konflikte auflösen': 'Resolve Conflicts',
  'Lücken ansehen': 'View Gaps',
  'Kalender öffnen': 'Open Calendar',
  'Weiterschauen öffnen': 'Open Continue Watching',
  'Empfehlungen ansehen': 'View Recommendations',
  'Watchlist öffnen': 'Open Watchlist',

  // Feature titles
  'Der Film-Kalender ist da': 'The Movie Calendar Is Here',
  'Filmreihen mit Fortschritt': 'Movie Collections with Progress',
  'Fairness & Feinschliff': 'Fairness & Polish',
  'Push-Benachrichtigungen in den Apps': 'Push Notifications in the Apps',

  // Feature descriptions (Film-Update Juli 2026)
  'Was startet wann? Der neue Film-Kalender zeigt dir Kinostarts und Streaming-Releases für deine Watch-Region — als Timeline mit Quartals-Tabs wie beim Serien-Kalender, inklusive Anbieter-Logos bei Digital-Releases und „+"-Button zum direkten Hinzufügen.':
    'What starts when? The new movie calendar shows theatrical and streaming releases for your watch region — as a timeline with quarter tabs like the series calendar, including provider logos on digital releases and a "+" button to add movies right away.',
  'Die Startseite passt jetzt auf deine Filmliste auf: Landet ein noch ungesehener Film aus deiner Liste auf einem deiner Abos, taucht er in der neuen Sektion „Neu auf deinen Abos" auf — und du bekommst eine Benachrichtigung. Die Sektion lässt sich im Layout-Editor verschieben oder ausblenden.':
    'The homepage now keeps an eye on your movie list: when an unwatched movie from your list lands on one of your subscriptions, it shows up in the new "New on your subscriptions" section — and you get a notification. The section can be moved or hidden in the layout editor.',
  'Herr der Ringe, MCU, Fluch der Karibik: Gehört ein Film zu einer Reihe, zeigt seine Detailseite jetzt die komplette Reihe chronologisch — mit Fortschrittsbalken, Haken auf allem Gesehenen und kommenden Teilen samt Jahr. Reihe komplett? Sag niemals nie.':
    'Lord of the Rings, MCU, Pirates of the Caribbean: if a movie belongs to a collection, its detail page now shows the whole collection in order — with a progress bar, checkmarks on everything watched and upcoming parts with their year. Collection complete? Never say never.',
  'Massen-Nachtragen von Filmen zählt nicht mehr für die Rangliste (wie bei Serien), Push-Benachrichtigungen nennen jetzt Staffel und Anbieter statt „und 3 weitere", und viele Details wurden poliert — vom Ranglisten-Podium auf Mobile bis zu den Abständen der Film-Detailseite.':
    'Bulk-importing movies no longer counts toward the leaderboard (same as series), push notifications now name the season and provider instead of "and 3 more", and lots of details got polished — from the leaderboard podium on mobile to the spacing on the movie detail page.',

  // Announcement (Film-Update Juli 2026)
  'Neu: Filme im Rampenlicht': 'New: Movies in the Spotlight',
  'Großes Film-Update: Der neue Film-Kalender zeigt Kinostarts und Streaming-Releases für deine Region, die Startseite meldet Filme von deiner Liste, sobald sie auf deinen Abos landen, und Filmreihen trackst du jetzt mit Fortschritt direkt auf der Filmseite. Alle Details in den Patch Notes.':
    'Big movie update: the new movie calendar shows theatrical and streaming releases for your region, the homepage alerts you when movies from your list land on your subscriptions, and you can now track movie collections with progress right on the movie page. All details in the patch notes.',
  'Die untere Leiste gehört jetzt dir': 'The Bottom Bar Is Now Yours',
  'Neuer Layout-Editor: deine App in klein': 'New Layout Editor: Your App in Miniature',
  'Rangliste im Kino-Look': 'Leaderboard in Cinema Style',
  'Backdrops in Originalauflösung': 'Backdrops in Original Resolution',
  'Feinschliff im ganzen System': 'Polish Across the Whole System',
  'Komplettes Redesign — jede Seite neu': 'Complete Redesign — Every Page Rebuilt',
  'Neues Profil: dein Kino auf einem Screen': 'New Profile: Your Cinema on One Screen',
  'Desktop nutzt endlich die volle Breite': 'Desktop Finally Uses the Full Width',
  'Neue Startseite, Login & Registrierung': 'New Landing Page, Login & Sign-Up',
  'Sanfte Updates — nie wieder Zwangs-Reload': 'Gentle Updates — No More Forced Reload',
  'Schnellerer Start': 'Faster Start',
  'Mobile-Feinschliff': 'Mobile Polish',
  'Neue Seite: Anime-Season-Kalender': 'New Page: Anime Season Calendar',
  'Live-Countdown zur nächsten Premiere': 'Live Countdown to the Next Premiere',
  '„Staffel 2"-, „Part 2"- und „NEU"-Chips': '"Season 2", "Part 2" and "NEW" Chips',
  'Termine wie in deinem Kalender': 'Dates Like in Your Calendar',
  'Deine Serien werden erkannt': 'Your Shows Are Recognized',
  'Komfort beim Stöbern': 'Easier Browsing',
  'Filter: Serien, Filme & Provider': 'Filter: Shows, Movies & Providers',
  'Direkt zur Liste hinzufügen': 'Add Straight to Your List',
  'TMDB-Rating auf den Karten': 'TMDB Rating on the Cards',
  'Beschreibung komplett lesen': 'Read the Full Description',
  'Freunde-Stand auf der Seriendetail-Seite': "Friends' Progress on the Series Detail Page",
  'Was schaut [Freund] gerade?': 'What Is [Friend] Watching Right Now?',
  'Worauf wartet [Freund]?': 'What Is [Friend] Waiting For?',
  'Pet-Sneakpeek + Snack schicken': 'Pet Sneak Peek + Send a Snack',
  'Air-Date + Erstes-Mal-Gesehen pro Folge': 'Air Date + First-Watched Per Episode',
  'Anime-Filler & Recap im Detail': 'Anime Filler & Recap in Detail',
  'Freunde-Aktivitäten als Ticker': "Friends' Activity as a Ticker",
  'Streaming-Reminder direkt auf der Homepage': 'Streaming Reminder Right on the Homepage',
  'Now-Playing-Indikator auf Postern': 'Now-Playing Indicator on Posters',
  'Pet reagiert auf deine Streak': 'Your Pet Reacts to Your Streak',
  'Recap-Button statt Auto-Popup': 'Recap Button Instead of Auto-Popup',
  'Sanfte Seitenwechsel (View Transitions)': 'Gentle Page Transitions (View Transitions)',
  'Layout aufgeräumt': 'Layout Tidied Up',
  'Serien & Filme empfehlen': 'Recommend Shows & Movies',
  'Empfehlung im Bell-Hub': 'Recommendation in the Bell Hub',
  'Smart Friend-Filter': 'Smart Friend Filter',
  'Neue Sektion: Streaming-Abos': 'New Section: Streaming Subscriptions',
  'Kosten transparent machen': 'Make Costs Transparent',
  'Smart-Attribution': 'Smart Attribution',
  'Pro-Serie Override': 'Per-Show Override',
  'Watchlist-Lücken erkennen': 'Spot Watchlist Gaps',
  'TV-Kalender mit Brand-Color': 'TV Calendar with Brand Colors',
  '„Nur meine Abos" Filter': '"Only My Subscriptions" Filter',
  'Onboarding-Schritt: Abos': 'Onboarding Step: Subscriptions',
  'Server-seitiges Catalog-Refresh': 'Server-Side Catalog Refresh',
  'Kalender: Auto-Scroll zum heutigen Tag': 'Calendar: Auto-Scroll to Today',
  'Kalender: Staffelpause & Staffelende Chips': 'Calendar: Season Break & Season Finale Chips',
  'Provider-Badge auf allen Karten': 'Provider Badge on All Cards',
  'Smarter Status-Badge': 'Smarter Status Badge',
  'Nächste Folge im Hero': 'Next Episode in the Hero',
  '"Zuletzt gesehen" in Weiterschauen': '"Last Watched" in Continue Watching',
  'Staffel & Tab merken': 'Remember Season & Tab',
  'Trending, Saisonal & Bestbewertet Redesign': 'Trending, Seasonal & Top-Rated Redesign',
  'KI-Empfehlungen': 'AI Recommendations',
  'Proaktive Recaps verbessert': 'Proactive Recaps Improved',
  'Navbar Redesign': 'Navbar Redesign',
  'TV-Kalender überarbeitet': 'TV Calendar Reworked',
  'Serien-Fortschritt': 'Series Progress',
  'Neue Sortierung': 'New Sorting',
  'Provider-Filter': 'Provider Filter',
  'Rewatch-Fortschritt': 'Rewatch Progress',
  '"Ich bin bei…" Markierung': '"I\'m At…" Marker',
  'Homepage Layout': 'Homepage Layout',

  // Feature descriptions
  'Die iOS- und Android-App melden sich jetzt von selbst: morgens, wenn eine deiner Serien heute eine neue Folge bekommt, und sofort, wenn dich eine Freundschaftsanfrage erreicht. Einschalten unter Einstellungen → Benachrichtigungen → Push-Benachrichtigungen.':
    'The iOS and Android apps now reach out on their own: in the morning when one of your shows gets a new episode today, and instantly when a friend request arrives. Turn it on under Settings → Notifications → Push Notifications.',
  'Belege bis zu 4 Plätze der Navigationsleiste mit deinen Lieblingszielen — Kalender raus, Statistiken rein? Rangliste statt Manga? Du entscheidest. Seiten in der Leiste verlieren automatisch ihren Zurück-Pfeil, denn sie sind jetzt ein Zuhause.':
    'Fill up to 4 slots in the navigation bar with your favorite destinations — drop the calendar, add stats? Leaderboard instead of manga? You decide. Pages in the bar automatically lose their back arrow, because they are a home base now.',
  'Homepage anpassen heißt jetzt anfassen: Deine App schwebt als Miniatur in der Mitte — Sektionen greifst und verschiebst du direkt, das Auge blendet aus, und die Leiste bestückst du per Tipp. Was du siehst, ist live dein Layout.':
    'Customizing the homepage now means hands-on: your app floats as a miniature in the center — grab and move sections directly, the eye hides them, and you fill the bar with a tap. What you see is your layout, live.',
  'Das Podium ist jetzt eine Bühne: große Avatare mit Medaillen-Ring und Krone, Glas-Sockel mit Gold-, Silber- und Bronze-Lichtkante und deine Zahl groß im Rampenlicht. Die Trophäen-Galerie füllt den Desktop als Glas-Karten in voller Breite.':
    'The podium is now a stage: large avatars with medal rings and crowns, glass pedestals with gold, silver and bronze light edges, and your number big in the spotlight. The trophy gallery fills the desktop as full-width glass cards.',
  'Auf großen und hochauflösenden Displays laden die Kino-Zeilen auf der Startseite ihre Artworks jetzt in Originalqualität — kein weiches Hochskalieren mehr. Auch die Backdrop-Collage im Profil ist deutlich schärfer geworden.':
    'On large, high-resolution displays the cinema rows on the homepage now load their artwork in original quality — no more soft upscaling. The backdrop collage on your profile has become much sharper too.',
  'Tooltips sind jetzt feine Glas-Kapseln, Formulare (z. B. Feedback & Bugs) bekommen Glas-Felder mit leuchtendem Fokus, Manga-Filter sind runde Pills mit schöneren Leer-Zuständen — und selbst Text-Markierung und Scrollbar färben sich nach deinem Theme.':
    'Tooltips are now delicate glass capsules, forms (e.g. Feedback & Bugs) get glass fields with a glowing focus, manga filters are round pills with nicer empty states — and even text selection and the scrollbar take on your theme colors.',
  'TV-Rank sieht überall neu aus: Liquid-Glass-Flächen, Kino-Backdrops, getönte Schalter statt greller Neon-Balken und einheitliche Karten-Grids. Über 30 Seiten wurden von Grund auf überarbeitet — von den Stats über den Backlog bis zu Taste Match, Manga und der Episoden-Verwaltung.':
    'TV-Rank looks new everywhere: liquid-glass surfaces, cinema backdrops, tinted toggles instead of harsh neon bars and consistent card grids. Over 30 pages were reworked from the ground up — from Stats through the Backlog to Taste Match, Manga and episode management.',
  'Das Profil ist jetzt eine Kommandozentrale ohne Scrollen: Oben ein Kino-Hero aus den Backdrops deiner bestbewerteten Serien mit Watchtime und Stats, darunter alle Bereiche als übersichtliche Spalten. Alles auf einen Blick, nichts mehr suchen.':
    'The profile is now a command center with no scrolling: at the top a cinema hero built from the backdrops of your top-rated shows with watchtime and stats, below it all areas as clear columns. Everything at a glance, nothing left to hunt for.',
  'Keine gestreckten Endlos-Listen mehr: Episoden, Freunde, Empfehlungen, Countdowns, Diskussionen und Manga-Listen liegen am Desktop jetzt als Karten-Grids nebeneinander. Statistiken sind ein dichtes Bento-Dashboard statt einer Einspalten-Wurst.':
    'No more stretched endless lists: on desktop, episodes, friends, recommendations, countdowns, discussions and manga lists now sit side by side as card grids. Stats are a dense bento dashboard instead of a single-column sprawl.',
  'Wer nicht eingeloggt ist, sieht jetzt eine echte Bühne: eine animierte Poster-Wand aus den Trending-Serien der Woche, eine Live-Vorschau der App und Anmelden/Registrieren im Kino-Split. Perfekt, um TV-Rank Freunden zu zeigen.':
    "If you're not logged in, you now see a real stage: an animated poster wall from the week's trending shows, a live preview of the app, and login/sign-up in a cinema split. Perfect for showing TV-Rank to friends.",
  'Neue Versionen laden sich komplett im Hintergrund vor und werden nur noch angewendet, wenn du es nicht merkst (beim Tab-Wechsel) oder wenn du selbst auf „Aktualisieren" tippst. Der „Update wird installiert"-Reload mitten in der Session ist Geschichte.':
    'New versions preload completely in the background and are only applied when you don\'t notice (on tab switch) or when you tap "Update" yourself. The "installing update" reload mid-session is history.',
  'Die Startseite lädt für Besucher jetzt in rund einer Sekunde — der Ladebildschirm erscheint nur noch dort, wo er wirklich gebraucht wird.':
    'The landing page now loads for visitors in about a second — the loading screen only appears where it is really needed.',
  'Die Begrüßung auf der Startseite bricht jetzt sauber um statt abgeschnitten zu werden, und der Bug, bei dem Text beim Antippen kurz unsichtbar wurde, ist behoben.':
    'The greeting on the homepage now wraps cleanly instead of being cut off, and the bug where text briefly became invisible on tap is fixed.',
  'Alle Anime der laufenden Season auf einen Blick – als Premieren-Timeline mit einem Datums-Node pro Tag: „HEUTE" pulsiert, vergangene Premieren sind gedimmt, „Start noch offen" sammelt Einträge ohne Termin. Vorherige und nächste Season sind per Tab erreichbar, „Fortlaufend" und „Beendet" hängen unten dran.':
    'All anime of the current season at a glance – as a premiere timeline with one date node per day: "TODAY" pulses, past premieres are dimmed, "Start still open" collects entries without a date. Previous and next season are reachable by tab, "Ongoing" and "Finished" hang below.',
  'Der Hero zeigt die nächste große Premiere der Season mit tickendem Countdown (Tage · Std · Min · Sek), Poster, deutscher Beschreibung und Provider-Logos. Läuft schon alles, übernimmt das Season-Highlight.':
    "The hero shows the season's next big premiere with a ticking countdown (days · hrs · min · sec), poster, description and provider logos. If everything is already airing, the season highlight takes over.",
  'Jede Karte zeigt sofort, ob ein Anime eine Fortsetzung ist („Staffel 2", „Part 2", „Fortsetzung" – erkannt aus Titel und AniList-Relationen) oder eine komplett neue Serie („NEU").':
    'Every card shows instantly whether an anime is a continuation ("Season 2", "Part 2", "Sequel" – detected from the title and AniList relations) or a completely new show ("NEW").',
  'AniList kennt nur den japanischen TV-Termin – der Season-Kalender priorisiert deshalb: Termin aus deinem Serien-Kalender (für Serien in deiner Liste) → TVMaze-geprüfter Termin → AniList. Simulcast-Verschiebungen um einen Tag sind damit Geschichte.':
    'AniList only knows the Japanese TV date – so the season calendar prioritizes: date from your series calendar (for shows in your list) → TVMaze-verified date → AniList. One-day simulcast shifts are now history.',
  'Sequel-Seasons („Saga of Tanya the Evil Season 2") und Arc-Titel („Tokyo Revengers: Santen Sensou-hen") matchen jetzt zuverlässig auf die Serie in deiner Liste – mit Badge, deinen Providern und Direkteinstieg in die Detailseite. Deutsche Beschreibungen und Provider-Logos laden für alle anderen automatisch nach.':
    'Sequel seasons ("Saga of Tanya the Evil Season 2") and arc titles ("Tokyo Revengers: Santen Sensou-hen") now reliably match the show in your list – with a badge, your providers and a direct jump into the detail page. Descriptions and provider logos load automatically for everything else.',
  'Zurück von einer Detailseite landest du exakt dort, wo du warst – inklusive gewähltem Season-Tab. Dazu: Schnellsprung zu „Fortlaufend" im Timeline-Header und der bekannte Scroll-to-top-Button.':
    'Coming back from a detail page, you land exactly where you were – including the selected season tab. Plus: a quick jump to "Ongoing" in the timeline header and the familiar scroll-to-top button.',
  'Oben filterst du per „Alle · Serien · Filme" und blendest mit „Mit Provider" alles aus, was keinen deutschen Streaming-Anbieter hat. Anime-Filme haben ein eigenes Badge und öffnen ihre Film-Detailseite.':
    'At the top you filter by "All · Shows · Movies" and use "With provider" to hide everything without a streaming provider. Anime movies have their own badge and open their movie detail page.',
  'Jede Karte (und der Hero) hat einen „+"-Button – Serie oder Film landet ohne Umweg über die Suche in deiner Liste und zeigt danach sofort Kalender-Termin, Provider und Haken.':
    'Every card (and the hero) has a "+" button – a show or movie lands in your list without a detour through search and then instantly shows its calendar date, providers and check mark.',
  'Statt der AniList-Prozente steht jetzt das TMDB-Rating auf der 10er-Skala („★ 8.4") auf jeder Karte – dieselbe Bewertung wie auf den Detailseiten.':
    'Instead of AniList percentages, every card now shows the TMDB rating on the 10-point scale ("★ 8.4") – the same rating as on the detail pages.',
  'Mit „mehr lesen" klappst du die volle Beschreibung direkt auf der Karte auf – ohne die Seite zu verlassen.':
    'With "read more" you expand the full description right on the card – without leaving the page.',
  'Pro Serie zeigt eine eigene Sektion welche Freunde auch dabei sind, bei welcher Folge sie aktuell stehen (S/E), und wie viele Folgen sie voraus oder hinter dir sind. Sortiert nach Fortschritt, klappbar – der Zustand wird gespeichert. Klick auf einen Eintrag öffnet das Freund-Profil.':
    "Per show, a dedicated section shows which friends are also watching, which episode they are currently on (S/E), and how many episodes they are ahead of or behind you. Sorted by progress, collapsible – the state is saved. Clicking an entry opens the friend's profile.",
  'Auf jedem Friend-Profil erscheint die heißeste Serie der letzten 14 Tage mit Status („Binge-Modus", „Aktiv dabei", „Schaut entspannt", „Pausiert" oder „Rewatch"), aktueller Folge und Spoiler-Diff zu deinem Stand. Rewatch wird erkannt und blendet den Spoiler-Hinweis automatisch aus.':
    'Every friend profile shows the hottest show of the last 14 days with a status ("Binge mode", "Actively watching", "Watching casually", "Paused" or "Rewatch"), the current episode and a spoiler diff to your progress. Rewatches are detected and hide the spoiler warning automatically.',
  'Ebenfalls auf dem Friend-Profil: die nächsten anstehenden Folgen aus der Watchlist deines Freundes, sortiert nach Air-Date. Wenn ihr beide eine Serie wartet, gibt es ein „Ihr beide"-Badge – idealer Co-Watch-Hinweis.':
    "Also on the friend profile: the next upcoming episodes from your friend's watchlist, sorted by air date. If you're both waiting on a show, there's a \"Both of you\" badge – an ideal co-watch hint.",
  'Du siehst Level, Hunger und Glück des Pets von deinem Freund – und kannst einmal pro Tag pro Freund einen Snack schicken. Sein Pet bekommt −10 Hunger und +5 Glück, sobald die App das nächste Mal geöffnet wird. In der Glocke landet zusätzlich eine Notification „X schickt Snack".':
    'You see the level, hunger and happiness of your friend\'s pet – and can send a snack once per day per friend. Their pet gets −10 hunger and +5 happiness the next time the app is opened. A notification "X sends a snack" also lands in the bell.',
  'In der Episodenliste steht jetzt rechts neben jeder Folge das Erstausstrahlungs-Datum und – falls geschaut – wann du sie zum ersten Mal gesehen hast. Auf dem Handy klappt die Info unter die Folge.':
    'In the episode list, each episode now shows its original air date on the right and – if watched – when you first saw it. On mobile the info folds below the episode.',
  'Für japanische Animes erscheint auf der Detail-Seite jetzt ein Banner mit Filler- und Recap-Folgen (Quelle: Jikan/MyAnimeList). In der Episodenliste markieren kleine F/R-Chips jede betroffene Folge, auf der Episode-Discussion-Seite siehst du die Markierung direkt neben dem S/E-Badge. Daten kommen aus dem Backend – kein API-Hänger im Frontend, ein täglicher Job hält alles frisch.':
    'For Japanese anime, the detail page now shows a banner with filler and recap episodes (source: Jikan/MyAnimeList). In the episode list, small F/R chips mark each affected episode; on the episode discussion page you see the marker right next to the S/E badge. The data comes from the backend – no API hang in the frontend, a daily job keeps everything fresh.',
  'Eine sanfte Lauf-Schrift unter dem Greeting zeigt was deine Freunde gerade tun („Lisa hat Folge 5 von Breaking Bad gesehen · Tim hat Dune 2 mit 9.0 bewertet …"). Pixelgenaue Geschwindigkeit, hover hält die Marquee an genau der Position an. Ein- und ausblendbar im Sektionen-Layout.':
    'A gentle marquee under the greeting shows what your friends are up to ("Lisa watched episode 5 of Breaking Bad · Tim rated Dune 2 a 9.0 …"). Pixel-precise speed, hover pauses the marquee at exactly that position. Can be shown or hidden in the section layout.',
  'Ungenutzte Abos schlummern jetzt nicht mehr versteckt im Subscriptions-Tab. Eine eigene Card im „Für dich"-Bereich listet die schlafendsten Anbieter inline mit Pausieren-Button samt Undo-Toast. Geld sparen ohne Seitenwechsel.':
    'Unused subscriptions no longer slumber hidden in the Subscriptions tab. A dedicated card in the "For you" area lists the most dormant providers inline with a pause button and undo toast. Save money without switching pages.',
  'In der Weiterschauen-Liste pulsiert ein dezenter 3-Bar-Equalizer auf Serien, die du in den letzten 3 Tagen aktiv weiterschaust. Sofort erkennbar woran du gerade dran bist, ohne den Provider-Sticker zu überlagern.':
    'In the Continue Watching list, a subtle 3-bar equalizer pulses on shows you have actively continued in the last 3 days. Instantly shows what you are on right now, without overlapping the provider sticker.',
  'Wenn dein Watch-Streak steigt oder ein Meilenstein erreicht ist (3, 7, 14, 21, 30, 50, 100 Tage …), erscheint eine kleine Sprechblase über deinem Pet mit Emoji und Glückwunsch. Verbindet Streak-Tracking und Pet-System ohne extra Klick.':
    'When your watch streak grows or hits a milestone (3, 7, 14, 21, 30, 50, 100 days …), a little speech bubble with an emoji and congratulations appears above your pet. Connects streak tracking and the pet system without an extra click.',
  'Die Detail-Seite öffnet das Recap-Sheet nicht mehr automatisch – stattdessen liegt ein klar sichtbarer „Recap der letzten N Folgen"-Button im Info-Tab, sobald du Episoden gesehen hast. Du entscheidest wann es dich interessiert.':
    'The detail page no longer opens the recap sheet automatically – instead a clearly visible "Recap of the last N episodes" button sits in the Info tab once you have watched episodes. You decide when you want it.',
  'Wechsel von Homepage zu Detail-Seite, von einer Detail-Seite zur nächsten, oder vom Carousel – alles jetzt mit einem dezenten Crossfade statt hartem Sprung. Nutzt die native View-Transitions-API des Browsers, respektiert „prefers-reduced-motion".':
    'Switching from the homepage to a detail page, from one detail page to the next, or from the carousel – all now with a subtle crossfade instead of a hard jump. Uses the browser\'s native View Transitions API, respects "prefers-reduced-motion".',
  'Die „Hauptaktionen"-Sektion mit den großen Weiterschauen/Entdecken-Buttons ist entfernt – beide bleiben bequem im Schnellzugriff und in der Bottom-Nav erreichbar. Neue Sektionen tauchen ab sofort an ihrer vorgesehenen Position auf, nicht mehr automatisch am Ende deiner Liste.':
    'The "Main actions" section with the big Continue Watching/Discover buttons is gone – both remain easily reachable in quick access and the bottom nav. New sections now appear at their intended position, no longer automatically at the end of your list.',
  'Auf jeder Serien- und Film-Detailseite gibt es jetzt einen „Empfehlen"-Button. Wähle deine Freunde aus, schreib optional eine Nachricht dazu, fertig – wie bei Spotify, nur für Serien.':
    'Every series and movie detail page now has a "Recommend" button. Pick your friends, optionally add a message, done – like on Spotify, just for shows.',
  'Empfänger sehen die Empfehlung als eigene Karte in den Benachrichtigungen: Poster, Sender-Avatar, deine Nachricht als Speech-Bubble. Mit einem Klick auf „Anschauen" geht es direkt zur Detailseite, oder „Nope" wenn nix für dich.':
    'Recipients see the recommendation as its own card in their notifications: poster, sender avatar, your message as a speech bubble. One click on "Watch" jumps straight to the detail page, or "Nope" if it\'s not for you.',
  'Du kannst nur Freunden etwas empfehlen, die die Serie oder den Film noch nicht in ihrer Sammlung haben. Wer es schon kennt, wird ausgegraut mit „Hat das schon" – spart Zeit und macht Empfehlungen wertvoller.':
    'You can only recommend something to friends who don\'t already have the show or movie in their collection. Anyone who already knows it is grayed out with "Already has it" – saving time and making recommendations more valuable.',
  'Pflege deine aktiven Abos (Netflix, Disney+, Crunchyroll …) mit Monatspreis und Schwellenwert für „ungenutzt". Live-Insights zeigen Total/Monat und wie viel du gerade für nichts zahlst.':
    'Manage your active subscriptions (Netflix, Disney+, Crunchyroll …) with a monthly price and a threshold for "unused". Live insights show the total per month and how much you\'re currently paying for nothing.',
  'Pro Anbieter wird gezeigt was du seit Wochen nicht mehr geschaut hast und welche Serien deiner Watchlist nur dort laufen. Markiere ein Abo als „Kündigen wenn ungenutzt" und du bekommst einen klaren Vorschlag.':
    'For each provider you see what you haven\'t watched in weeks and which of your watchlist shows only air there. Mark a subscription as "Cancel if unused" and you get a clear suggestion.',
  'Eine Episode läuft auf mehreren Anbietern? Wir ordnen sie automatisch dem Provider zu, den du am häufigsten exklusiv nutzt. So weiß deine Statistik, wofür du wirklich Wert ziehst.':
    'An episode airs on multiple providers? We automatically assign it to the provider you most often use exclusively. That way your stats know where you really get value.',
  'Rick and Morty schaust du auf HBO Max, nicht Netflix? Tipp im Subscriptions-Diagnose-Panel auf „verschieben" und alle vergangenen & künftigen Watches wandern korrekt zum gewählten Anbieter – inkl. Logo + Brand-Color überall.':
    'You watch Rick and Morty on HBO Max, not Netflix? Tap "move" in the subscriptions diagnostics panel and all past & future watches move correctly to the chosen provider – including logo + brand color everywhere.',
  'Auf der Subscriptions-Seite findest du alle Watchlist-Serien, die NUR auf Anbietern laufen, die du gerade nicht abonniert hast. Auf der Homepage erscheint außerdem eine Notification, wenn eine neue Staffel auf einem nicht-abonnierten Provider startet.':
    'On the Subscriptions page you find all watchlist shows that air ONLY on providers you are not currently subscribed to. On the homepage a notification also appears when a new season starts on an unsubscribed provider.',
  'Jede Episode-Card im Kalender bekommt links einen Streifen in Provider-Farbe (Netflix-Rot, Disney-Blau, HBO-Lila …). Serien, die nur auf Anbietern laufen die du nicht hast, werden ausgegraut – auf einen Blick erkennbar was läuft.':
    "Every episode card in the calendar gets a stripe on the left in the provider color (Netflix red, Disney blue, HBO purple …). Shows that only air on providers you don't have are grayed out – see at a glance what's on.",
  'Im Weiterschauen-Tab ein neuer Toggle: zeigt nur Watchlist-Serien, die du auf deinen aktiven Abos schauen kannst. Spart das Hin- und Herklicken zwischen den Streaming-Diensten.':
    'A new toggle in the Continue Watching tab: shows only watchlist shows you can watch on your active subscriptions. Saves clicking back and forth between streaming services.',
  'Neue User werden im Onboarding direkt nach ihren Streaming-Abos gefragt – damit Empfehlungen, Filter und Kalender vom ersten Login an passen.':
    'New users are asked about their streaming subscriptions right in onboarding – so recommendations, filters and the calendar fit from the very first login.',
  'Wenn TMDB neue Streaming-Provider für eine Serie hinzufügt (z. B. Chernobyl kommt zu Disney+), wird das jetzt täglich automatisch ins Catalog gespiegelt – kein 30-Tage-Lag mehr.':
    'When TMDB adds new streaming providers for a show (e.g. Chernobyl comes to Disney+), it is now mirrored into the catalog automatically every day – no more 30-day lag.',
  'Auf dem Handy scrollt der Kalender jetzt automatisch zum heutigen Wochentag – kein manuelles Suchen mehr.':
    "On mobile the calendar now scrolls automatically to today's weekday – no more manual searching.",
  'Neue Badges zeigen dir direkt im Kalender ob eine Serie in die Pause geht oder das Staffelfinale kommt. Erkennt auch Pausen wenn kommende Folgen noch kein Datum haben.':
    "New badges show you right in the calendar whether a show is going on break or the season finale is coming. Also detects breaks when upcoming episodes don't have a date yet.",
  'Kleine Streaming-Logos (Crunchyroll, Netflix, etc.) auf dem Poster – überall: Weiterschauen, Heute Neu, Rewatches und Watchlist.':
    'Small streaming logos (Crunchyroll, Netflix, etc.) on the poster – everywhere: Continue Watching, New Today, Rewatches and Watchlist.',
  'Der Status-Badge im Serien-Detail zeigt jetzt den Ausstrahlungsrhythmus: "Läuft · Sonntags neue Folge" oder "Läuft · Alle 2 Wochen" statt nur "Fortlaufend".':
    'The status badge in the series detail now shows the airing rhythm: "Airing · New episode on Sundays" or "Airing · Every 2 weeks" instead of just "Ongoing".',
  'Neuer Chip im Serien-Detail zeigt sofort die nächste Episode mit Datum an – ohne scrollen zu müssen.':
    'A new chip in the series detail immediately shows the next episode with its date – without having to scroll.',
  'Jede Karte in Weiterschauen zeigt jetzt wann du die Serie zuletzt geschaut hast – hilft beim Priorisieren.':
    'Every card in Continue Watching now shows when you last watched the show – helps with prioritizing.',
  'Wenn du in einem Serien-Detail eine Staffel oder Tab (Info/Besetzung/KI-Guide) wählst und zurücknavigierst, landest du wieder an der gleichen Stelle.':
    'When you select a season or tab (Info/Cast/AI Guide) in a series detail and navigate back, you land at the same spot again.',
  'Komplett neues Card-Design im Kino-Stil: Trending-Cards mit Rang-Nummer in abgerundeter Ecke, Genre-Anzeige, TMDB-Rating und Erscheinungsjahr – einheitlich für alle drei Sektionen.':
    'A completely new card design in cinema style: trending cards with a rank number in a rounded corner, genre display, TMDB rating and release year – consistent across all three sections.',
  'Personalisierte Serien- und Film-Empfehlungen basierend auf deinen Bewertungen, Binge-Verhalten, Genre-Vorlieben und Watch-Patterns. Mit Poster, TMDB-Rating und Streaming-Anbietern – klick auf eine Empfehlung um direkt zur Serie zu gelangen.':
    'Personalized series and movie recommendations based on your ratings, binge behavior, genre preferences and watch patterns. With poster, TMDB rating and streaming providers – click a recommendation to jump straight to the show.',
  'Recaps werden nicht mehr automatisch geladen – erst wenn du auf "Recap lesen" klickst. Spart KI-Anfragen und lädt schneller.':
    'Recaps are no longer loaded automatically – only when you click "Read recap". Saves AI requests and loads faster.',
  'Neue Glassmorphism-Navigation mit Glow-Effekt auf dem aktiven Tab. Bessere Lesbarkeit der inaktiven Icons.':
    'New glassmorphism navigation with a glow effect on the active tab. The inactive icons are easier to read.',
  'Neue Wochenansicht mit Navigation, Desktop-Grid-Layout mit 7-Spalten und automatische Episoden-Gruppierung pro Serie.':
    'New week view with navigation, a 7-column desktop grid layout and automatic episode grouping per show.',
  'Progress-Bars auf jeder Watchlist-Karte zeigen wie weit du bist – mit Staffel-Info und verbleibenden Episoden.':
    'Progress bars on every watchlist card show how far along you are – with season info and remaining episodes.',
  'Sortiere deine Watchlist nach Fortschritt oder verbleibenden Episoden – finde schnell was fast fertig ist.':
    "Sort your watchlist by progress or remaining episodes – quickly find what's almost finished.",
  'Filtere deine Watchlist nach Streaming-Anbieter – zeige nur Netflix, Disney+ oder andere.':
    'Filter your watchlist by streaming provider – show only Netflix, Disney+ or others.',
  'Rewatches zeigen jetzt ihren eigenen Fortschritt statt den der Original-Serie.':
    "Rewatches now show their own progress, not the original show's.",
  'Wähle Staffel und Episode – alles davor wird automatisch als gesehen markiert. Perfekt für Serien die du woanders geschaut hast.':
    'Pick a season and episode – everything before it is automatically marked as watched. Perfect for shows you watched elsewhere.',
  'Sektionen auf der Homepage sortieren, ausblenden und nach deinem Geschmack anpassen.':
    'Sort, hide and customize sections on the homepage to your taste.',
};

export default dict;
