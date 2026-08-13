/** Seitenhilfe („Das kannst du hier") — Deutsch → Englisch. */

const tour: Record<string, string> = {
  Rückmeldung: 'Getting an answer',
  'Das kannst du hier': 'What you can do here',
  'Seitenhilfen zurücksetzen': 'Reset page tips',
  'Die Kurzhilfe erscheint beim nächsten Besuch jeder Seite erneut':
    'The short tips will show again the next time you open each page',
  'Seitenhilfen werden wieder angezeigt': 'Page tips are switched back on',

  Startseite: 'Home',
  'Dein Einstieg in alles, was gerade läuft.': 'Your way into everything you are in the middle of.',
  'Die oberste Reihe bringt dich mit einem Fingertipp zur nächsten offenen Folge.':
    'The top row takes you to your next unwatched episode in one tap.',
  'Streak halten': 'Keep your streak',
  'Deine Streak wächst an jedem Tag, an dem du mindestens eine Folge abhakst.':
    'Your streak grows on every day you check off at least one episode.',
  'Die Glocke sammelt neue Folgen, Anbieterwechsel und Anfragen von Freunden.':
    'The bell collects new episodes, provider changes and friend requests.',
  'Startseite umbauen': 'Rearrange the home screen',
  'Unter Einstellungen und Homepage Layout sortierst du die Abschnitte um oder blendest sie aus.':
    'Under Settings and Homepage Layout you can reorder the sections or hide them.',

  'Alle Serien mit einer offenen Folge, in der Reihenfolge, die du willst.':
    'Every show with an unwatched episode, in the order you want.',
  'Folge abhaken': 'Check off an episode',
  'Tippe eine Karte an, um die nächste Folge als gesehen zu markieren.':
    'Tap a card to mark the next episode as watched.',
  Wischen: 'Swipe',
  'Wisch eine Karte zur Seite, um sie ohne Umweg abzuhaken.':
    'Swipe a card aside to check it off straight away.',
  'Nach Anbieter filtern': 'Filter by provider',
  'Über Filter schränkst du auf einzelne Streaming-Dienste ein oder blendest alles außerhalb deiner Abos aus.':
    'Filter narrows things down to single streaming services, or hides everything outside your subscriptions.',
  Reihenfolge: 'Order',
  'Sortiere nach Datum, Name oder Fortschritt, oder stell dir eine eigene Reihenfolge zusammen.':
    'Sort by date, name or progress, or put together an order of your own.',

  'Wann welche Folge läuft, Woche für Woche.': 'Which episode airs when, week by week.',
  'Woche wechseln': 'Switch weeks',
  'Blättere zwischen den Wochen und tippe einen Tag an, um seine Folgen zu sehen.':
    'Page through the weeks and tap a day to see its episodes.',
  'Direkt abhaken': 'Check off right here',
  'Folgen lassen sich aus dem Kalender heraus als gesehen markieren.':
    'Episodes can be marked as watched straight from the calendar.',
  'Nur Watchlist': 'Watchlist only',
  'Der Filter reduziert den Kalender auf die Serien, die du dir gemerkt hast.':
    'The filter cuts the calendar down to the shows you saved.',
  'Weitere Kalender': 'More calendars',
  'Über die Kopfzeile kommst du zum Serien-, Film- und Anime-Season-Kalender.':
    'The header takes you to the series, movie and anime season calendars.',

  'Alles, was du bewertet hast, und alles, was noch fehlt.':
    'Everything you have rated, and everything still missing.',
  'Tippe einen Titel an, um deine Wertung zu setzen oder zu ändern.':
    'Tap a title to set or change your rating.',
  'Ansicht wechseln': 'Switch the view',
  'Zwischen der cinematischen Ansicht und der kompakten Liste umschalten.':
    'Switch between the cinematic view and the compact list.',
  Filtern: 'Filter',
  'Serien, Filme, Watchlist oder alles noch Unbewertete getrennt anzeigen.':
    'Show series, movies, your watchlist or everything still unrated on their own.',
  'Eigene Liste durchsuchen': 'Search your own list',
  'Das Suchfeld findet einen Titel in deinem eigenen Bestand.':
    'The search field finds a title inside your own collection.',

  'Der Weg zu allem, was noch nicht in deiner Liste steht.':
    'The way to everything that is not on your list yet.',
  'Serien und Filme im gesamten Katalog finden.':
    'Find series and movies across the whole catalogue.',
  'Der Knopf auf dem Poster legt einen Titel direkt in deine Liste.':
    'The button on the poster drops a title straight onto your list.',
  'Blendet aus, was du auf deinen aktiven Streaming-Diensten nicht sehen kannst.':
    'Hides whatever you cannot watch on your active streaming services.',
  'Frühere Suchbegriffe stehen unter dem Feld bereit.':
    'Earlier search terms are waiting below the field.',

  'Vorschläge, die zu dem passen, was du schon geschaut hast.':
    'Suggestions that match what you have already watched.',
  'Empfehlungen auf Basis der Titel, die schon in deiner Liste liegen.':
    'Recommendations based on the titles already on your list.',
  'Nach Genre filtern': 'Filter by genre',
  'Die Genre-Leiste grenzt die Vorschläge ein.': 'The genre bar narrows the suggestions down.',
  'Zeigt ausschließlich Titel auf deinen aktiven Abos.':
    'Shows only titles on your active subscriptions.',
  'Direkt übernehmen': 'Add on the spot',
  'Aus jeder Karte heraus landet ein Titel in deiner Liste.':
    'Every card can put a title onto your list.',

  'Dein Viewing-Universum in Zahlen.': 'Your viewing universe in numbers.',
  'Deine Zahlen': 'Your numbers',
  'Watchtime, gesehene Episoden und abgeschlossene Serien auf einen Blick.':
    'Watch time, episodes seen and finished shows at a glance.',
  'Top-Genres und Anbieter': 'Top genres and providers',
  'Zeigt, worauf deine Watchtime wirklich entfällt.': 'Shows where your watch time actually goes.',
  'Die Statistiken lassen sich als fertige Grafik weitergeben.':
    'The stats can be passed on as a ready-made graphic.',
  'Actor Universe': 'Actor Universe',
  'Verfolge, über welche Schauspieler deine Serien zusammenhängen.':
    'Trace which actors connect your shows to each other.',

  Seriendetails: 'Series details',
  'Staffeln, Fortschritt und alles, was du zur Serie tun kannst.':
    'Seasons, progress and everything you can do with the show.',
  'Auf die Watchlist': 'Onto the watchlist',
  'Nur Serien auf der Watchlist erscheinen unter Weiterschauen. Beim ersten Abhaken landet eine Serie automatisch dort.':
    'Only shows on your watchlist appear under Continue watching. The first episode you check off puts a show there automatically.',
  'Folgen abhaken': 'Check off episodes',
  'Einzelne Folgen antippen oder über Alle verwalten eine ganze Staffel setzen.':
    'Tap single episodes, or set a whole season through Manage all.',
  'Die Serie und jede einzelne Folge lassen sich bewerten.':
    'You can rate the show and every single episode.',
  'Starte einen Durchlauf von vorn, ohne deine bisherige Historie zu verlieren.':
    'Start a run from the top without losing your history so far.',
  'Freunde vergleichen': 'Compare with friends',
  'Der Freunde-Bereich zeigt, wie weit die anderen in dieser Serie sind.':
    'The friends section shows how far the others are into this show.',

  Filmdetails: 'Movie details',
  'Alles zum Film und was du damit machen kannst.':
    'Everything about the movie and what you can do with it.',
  'Einmal antippen, und der Film wandert in deine Historie.':
    'One tap is enough, the movie moves into your history.',
  'Deine Wertung fließt in Statistiken und Empfehlungen ein.':
    'Your rating feeds into your stats and recommendations.',
  'Von der Besetzung aus springst du zu anderen Titeln derselben Person.':
    'From the cast you can jump to other titles by the same person.',
  Reihen: 'Collections',
  'Gehört der Film zu einer Reihe, siehst du hier die fehlenden Teile.':
    'If the movie belongs to a collection, you see the missing parts here.',

  'Dein Konto, deine Zahlen und der Weg in alle Nebenbereiche.':
    'Your account, your numbers and the way into every side area.',
  'Deine Eckdaten': 'Your key figures',
  'Watchtime, Episoden, Filme und Manga in der Übersicht.':
    'Watch time, episodes, movies and manga in one overview.',
  'Alles Weitere': 'Everything else',
  'Die Kacheln führen zu Badges, Pets, Rangliste, Verlauf und allem Weiteren.':
    'The tiles lead to badges, pets, leaderboard, history and everything else.',
  'Von hier geht es zu Konto, Design, Sprache und Benachrichtigungen.':
    'From here you reach your account, theme, language and notifications.',

  'Was deine Freunde gerade schauen, und wer noch dazukommen will.':
    'What your friends are watching, and who wants to join.',
  'Feed und Freunde': 'Feed and friends',
  'Zwei Reiter: der Aktivitäts-Feed und deine Freundesliste.':
    'Two tabs: the activity feed and your friends list.',
  'Offene Freundschaftsanfragen annehmen oder ablehnen.': 'Accept or decline open friend requests.',
  'Diskussionen und Chats': 'Discussions and chats',
  'Von hier kommst du in den Diskussions-Feed und zu deinen Chats.':
    'From here you get to the discussion feed and to your chats.',

  'Alles, was du dir schon verdient hast, und was noch fehlt.':
    'Everything you have earned so far, and what is still missing.',
  'Fortschritt lesen': 'Read your progress',
  'Jedes Badge zeigt, wie viele Schritte bis zur Freischaltung fehlen.':
    'Every badge shows how many steps are left before it unlocks.',
  'Nach Seltenheit filtern': 'Filter by rarity',
  'Von Gewöhnlich bis Legendär getrennt durchsehen.': 'Browse common through legendary separately.',
  'Der Prüfen-Knopf rechnet deine Badges sofort neu durch.':
    'The check button recalculates your badges right away.',

  'Deine Begleiter wachsen mit jeder Folge, die du schaust.':
    'Your companions grow with every episode you watch.',
  'Füttern und pflegen': 'Feed and care',
  'Ein gesundes Pet bringt dir mehr XP pro Episode.':
    'A healthy pet earns you more XP per episode.',
  'Aussehen ändern': 'Change the look',
  'Farben, Hintergründe und Accessoires lassen sich frei kombinieren.':
    'Colours, backgrounds and accessories can be combined freely.',
  'Mehrere Pets': 'Several pets',
  'Du kannst weitere Pets erschaffen und zwischen ihnen wechseln.':
    'You can create more pets and switch between them.',

  'Wie du im Vergleich zu anderen dastehst.': 'Where you stand next to everyone else.',
  'Zeitraum wählen': 'Pick a period',
  'Diesen Monat oder aller Zeiten, je nachdem was dich interessiert.':
    'This month or all time, whichever you care about.',
  'Freunde oder alle': 'Friends or everyone',
  'Wechsle zwischen deinem Freundeskreis und allen Nutzern.':
    'Switch between your circle of friends and all users.',
  'Wertung verstehen': 'How it is counted',
  'Gezählt werden Episoden, Filme und die Watchtime, die dabei zusammenkommt.':
    'Episodes, movies and the watch time they add up to are what counts.',

  'Die Serien, bei denen du am weitesten hinterherhinkst.':
    'The shows you have fallen behind on the most.',
  'Rückstand sehen': 'See the backlog',
  'Je Serie stehen offene Episoden und der Fortschritt nebeneinander.':
    'Per show you see the open episodes and the progress side by side.',
  Sortieren: 'Sort',
  'Nach Episoden, Fortschritt, verbleibender Zeit oder zuletzt geschaut.':
    'By episodes, progress, remaining time or last watched.',
  'Aus jeder Karte heraus geht es direkt in die Serie zum Abhaken.':
    'Every card takes you straight into the show to check things off.',

  'Was von deinen Serien als Nächstes zurückkommt.': 'Which of your shows returns next.',
  'Kommende Staffeln': 'Upcoming seasons',
  'Jede angekündigte Rückkehr mit Countdown bis zum Starttag.':
    'Every announced return with a countdown to its first day.',
  'Eine Karte antippen führt direkt zur Serie.': 'Tapping a card takes you straight to the show.',
  'Woher das kommt': 'Where this comes from',
  'Gelistet werden angekündigte Staffeln der Serien in deiner Liste.':
    'Listed here are announced seasons of the shows on your list.',

  'Womit du streamst, bestimmt viele Filter in der App.':
    'The services you use drive a lot of filters across the app.',
  'Abos markieren': 'Mark your subscriptions',
  'Tippe die Dienste an, die du tatsächlich abonniert hast.':
    'Tap the services you actually subscribe to.',
  'Was das bewirkt': 'What it changes',
  'Erst damit funktionieren die Filter „Nur meine Abos" in Suche, Entdecken und Weiterschauen.':
    'Only then do the My subscriptions filters in search, discover and Continue watching do anything.',
  Anbieterwechsel: 'Provider changes',
  'Verlässt eine deiner Serien einen Dienst, bekommst du eine Meldung.':
    'If one of your shows leaves a service, you get a notification.',

  'Was du zuletzt gesehen hast, chronologisch.': 'What you watched most recently, in order.',
  'Die letzten Tage oder Wochen getrennt durchsehen.':
    'Go through the last days or weeks separately.',
  'Das Suchfeld grenzt den Verlauf auf eine einzelne Serie ein.':
    'The search field narrows the history down to a single show.',
  'Eine Folge lässt sich von hier aus direkt noch einmal abhaken.':
    'An episode can be checked off again straight from here.',

  'Ausgeblendete Serien': 'Hidden shows',
  'Alles, was du aus deinen Listen genommen hast.': 'Everything you have taken off your lists.',
  'Was hier landet': 'What ends up here',
  'Ausgeblendete Serien verschwinden aus Weiterschauen, Kalender und Statistiken.':
    'Hidden shows disappear from Continue watching, the calendar and your stats.',
  Zurückholen: 'Bring it back',
  'Ein Tippen auf Weiter macht eine Serie wieder überall sichtbar.':
    'A tap on Continue makes a show visible everywhere again.',
  'Nichts geht verloren': 'Nothing is lost',
  'Dein Fortschritt bleibt beim Ausblenden vollständig erhalten.':
    'Hiding a show keeps your progress completely intact.',

  'Deine Sehgewohnheiten über die Jahre.': 'Your viewing habits across the years.',
  'Zeigt, wann du besonders viel und wann du kaum geschaut hast.':
    'Shows when you watched a lot and when you barely watched at all.',
  'Wie oft du Sessions am Stück durchgezogen hast, samt Rekorden.':
    'How often you pulled through a session in one go, records included.',
  'Nach Genre eingrenzen': 'Narrow by genre',
  'Die Auswertung lässt sich auf einzelne Genres beschränken.':
    'The analysis can be limited to individual genres.',

  Jahresrückblick: 'Year in review',
  'Dein Serienjahr als Abfolge von Karten.': 'Your year in shows, card by card.',
  'Nach links und rechts wischen blättert durch die Karten.':
    'Swiping left and right pages through the cards.',
  'Was drinsteht': 'What is inside',
  'Watchtime, Top-Serien, Lieblingsgenres und deine Rekorde des Jahres.':
    'Watch time, top shows, favourite genres and your records of the year.',
  Weitergeben: 'Pass it on',
  'Einzelne Karten lassen sich als Bild teilen.': 'Single cards can be shared as an image.',

  'Die Schauspieler, die deine Serien miteinander verbinden.':
    'The actors that tie your shows together.',
  'Verbindungen lesen': 'Read the connections',
  'Linien zeigen, welche Schauspieler in mehreren deiner Serien mitspielen.':
    'Lines show which actors appear in more than one of your shows.',
  'Bewegen und zoomen': 'Move and zoom',
  'Ziehen verschiebt die Karte, Ansicht zurücksetzen bringt sie zurück.':
    'Dragging moves the map, Reset view brings it back.',
  'Personen öffnen': 'Open a person',
  'Ein Tippen auf einen Namen öffnet dessen Serien und Filme.':
    'Tapping a name opens that person’s shows and movies.',

  Geschmacksprofil: 'Taste profile',
  'Empfehlungen aus deinen Bewertungen und Sehmustern.':
    'Recommendations drawn from your ratings and viewing patterns.',
  'Empfehlungen erzeugen': 'Generate recommendations',
  'Der Knopf lässt frische Vorschläge für dich berechnen.':
    'The button has fresh suggestions calculated for you.',
  Übernehmen: 'Take it over',
  'Was passt, wandert direkt in deine Liste.': 'Whatever fits goes straight onto your list.',
  'Wird mit der Zeit besser': 'It gets better over time',
  'Je mehr du bewertest, desto genauer werden die Vorschläge.':
    'The more you rate, the sharper the suggestions get.',

  'Geschmacks-Match': 'Taste match',
  'Wie weit dein Geschmack und der deines Freundes auseinanderliegen.':
    'How far apart your taste and your friend’s taste are.',
  Übereinstimmung: 'Match score',
  'Ein Wert fasst zusammen, wie ähnlich ihr bewertet.':
    'One number sums up how similarly the two of you rate.',
  Gemeinsamkeiten: 'Common ground',
  'Gemeinsame Serien, Filme und Genres stehen einzeln aufgelistet.':
    'Shared shows, movies and genres are listed one by one.',
  'Perfekte Treffer': 'Perfect matches',
  'Titel, die ihr beide gleich stark mögt, werden hervorgehoben.':
    'Titles you both like equally are highlighted.',

  Freundesprofil: 'Friend profile',
  'Was dein Freund schaut und wie weit ihr auseinander seid.':
    'What your friend is watching and how far apart you are.',
  'Vorsprung sehen': 'See the lead',
  'Bei gemeinsamen Serien steht, wer wie viele Folgen voraus ist.':
    'On shared shows you see who is ahead by how many episodes.',
  'Von hier kommst du direkt ins Geschmacks-Match.':
    'From here you go straight into the taste match.',
  'Pet und Badges': 'Pet and badges',
  'Auch Pet, Streak und freigeschaltete Badges sind sichtbar.':
    'Pet, streak and unlocked badges are visible too.',

  'Die Ansicht, die andere über deinen Link sehen.': 'The view other people get through your link.',
  'Gezeigt werden die bewerteten Serien und Filme, nicht dein ganzer Bestand.':
    'It shows the shows and movies you rated, not your whole collection.',
  'Serien und Filme lassen sich getrennt durchsehen.':
    'Shows and movies can be browsed separately.',
  Sichtbarkeit: 'Visibility',
  'Ob es diese Seite überhaupt gibt, entscheidest du in den Einstellungen.':
    'Whether this page exists at all is your call in the settings.',

  'Direkte Unterhaltungen mit deinen Freunden.': 'Direct conversations with your friends.',
  'Unterhaltung öffnen': 'Open a conversation',
  'Chats gibt es nur mit Leuten, mit denen du befreundet bist.':
    'Chats only exist with people you are friends with.',
  Aussehen: 'Appearance',
  'Chat-Design und Hintergrund lassen sich je Unterhaltung ändern.':
    'Chat theme and background can be changed per conversation.',
  'Blockieren und löschen': 'Block and delete',
  'Eine Unterhaltung lässt sich stummschalten, blockieren oder ganz entfernen.':
    'A conversation can be muted, blocked or removed entirely.',

  'Schreiben, ohne die nächste Folge zu verraten.': 'Write without giving away the next episode.',
  'Verdeckt die Nachricht, bis dein Gegenüber sie bewusst aufdeckt.':
    'Covers the message until the other person deliberately reveals it.',
  'Bilder bis 8 MB lassen sich mit Bildunterschrift schicken.':
    'Images up to 8 MB can be sent with a caption.',
  'Über das Chat-Design änderst du Farbe und Hintergrund der Unterhaltung.':
    'Chat theme changes the colour and background of the conversation.',

  'Alle Gespräche zu Serien, Filmen und Folgen an einem Ort.':
    'Every conversation about shows, movies and episodes in one place.',
  'Bereich wählen': 'Pick an area',
  'Getrennt nach Serien, Filmen und einzelnen Episoden.':
    'Split into shows, movies and single episodes.',
  Mitreden: 'Join in',
  'Ein Beitrag führt dich zur Diskussion, wo du antworten kannst.':
    'A post takes you into the discussion, where you can reply.',
  Spoilerschutz: 'Spoiler protection',
  'Beiträge zu Folgen, die du noch nicht gesehen hast, bleiben verdeckt.':
    'Posts about episodes you have not seen stay covered.',

  'Der schnelle Weg, viele Folgen auf einmal zu setzen.':
    'The fast way to set many episodes at once.',
  Sammelaktionen: 'Bulk actions',
  'Ganze Staffeln als gesehen oder wieder als ungesehen markieren.':
    'Mark whole seasons as watched, or as unwatched again.',
  'Zähler ändern': 'Change the counter',
  'Plus und Minus setzen, wie oft du eine Folge gesehen hast.':
    'Plus and minus set how often you have seen an episode.',
  'Zu jeder Folge kommst du von hier in ihre Diskussion.':
    'For every episode you can get to its discussion from here.',

  'Folgen-Diskussion': 'Episode discussion',
  'Das Gespräch zu genau dieser Folge.': 'The conversation about this exact episode.',
  'Schreiben und antworten': 'Write and reply',
  'Beiträge verfassen und auf die Beiträge anderer antworten.':
    'Write posts and reply to what other people wrote.',
  'Wer die Folge noch nicht gesehen hat, sieht den Inhalt erst nach dem Aufdecken.':
    'Anyone who has not seen the episode only sees the content after revealing it.',
  'Die Bewertung dieser Folge lässt sich hier direkt setzen.':
    'The rating for this episode can be set right here.',

  'Bewertung bearbeiten': 'Edit rating',
  'Deine Wertung, aufgeschlüsselt nach Genres.': 'Your rating, broken down by genre.',
  'Je Genre bewerten': 'Rate per genre',
  'Jedes Genre bekommt einen eigenen Wert, daraus entsteht die Gesamtnote.':
    'Every genre gets its own value, and together they make the overall score.',
  'Erst mit Speichern landet die Änderung in deiner Liste.':
    'The change only reaches your list once you save.',
  'Eine Bewertung lässt sich vollständig zurücknehmen.': 'A rating can be taken back completely.',

  'Neue Serien und Staffelstarts, unabhängig von deiner Liste.':
    'New shows and season starts, regardless of what is on your list.',
  'Premieren sehen': 'See the premieres',
  'Kommende Starts mit Countdown bis zum ersten Tag.':
    'Upcoming starts with a countdown to their first day.',
  'Die Genre-Suche grenzt die Premieren ein.': 'The genre search narrows the premieres down.',
  'Was dich interessiert, landet mit einem Fingertipp in deiner Liste.':
    'Whatever catches your eye lands on your list with one tap.',

  'Kinostarts und Streaming-Releases in deiner Region.':
    'Cinema releases and streaming releases in your region.',
  'Kino oder Streaming': 'Cinema or streaming',
  'Zwischen Kinostarts und digitalen Releases umschalten.':
    'Switch between cinema releases and digital releases.',
  'Nach Datum': 'By date',
  'Die Liste läuft chronologisch, der heutige Tag ist markiert.':
    'The list runs chronologically, with today marked.',
  Vormerken: 'Save for later',
  'Ein Film lässt sich von hier direkt in deine Liste legen.':
    'A movie can be put on your list straight from here.',

  'Die laufende und die kommende Anime-Saison im Überblick.':
    'The current and the upcoming anime season at a glance.',
  'Nach Studio filtern': 'Filter by studio',
  'Die Saison lässt sich auf einzelne Studios eingrenzen.':
    'The season can be narrowed down to individual studios.',
  'Status sehen': 'See the status',
  'Fortlaufend, beendet oder noch nicht gestartet, jeweils mit Countdown.':
    'Ongoing, finished or not started yet, each with a countdown.',
  'Ein Titel wandert mit einem Fingertipp in deine Serienliste.':
    'One tap moves a title onto your series list.',

  'Konto, Aussehen, Benachrichtigungen und deine Daten.':
    'Account, appearance, notifications and your data.',
  'Push ein- und ausschalten und einstellen, worüber du informiert wirst.':
    'Turn push on or off and choose what you get told about.',
  'Aussehen und Sprache': 'Appearance and language',
  'Design, Anzeigegröße, Startseiten-Layout und Sprache liegen hier.':
    'Theme, display size, home layout and language live here.',
  'Import und Export': 'Import and export',
  'Deine Watch-History als JSON sichern oder als CSV weitergeben.':
    'Back up your watch history as JSON, or pass it on as CSV.',

  'Die ganze App nimmt deine Farben an.': 'The whole app takes on your colours.',
  'Farben setzen': 'Set the colours',
  'Haupt-, Akzent- und Hintergrundfarbe lassen sich einzeln wählen.':
    'Primary, accent and background colour can each be picked separately.',
  Vorlagen: 'Presets',
  'Fertige Kombinationen als Startpunkt, danach frei anpassbar.':
    'Ready-made combinations as a starting point, free to adjust afterwards.',
  'Alle Farben auf Standard bringt dich jederzeit zurück.':
    'Reset all colours takes you back at any time.',

  'Startseiten-Layout': 'Home layout',
  'Die Vorschau ist der Editor.': 'The preview is the editor.',
  'Reihenfolge ändern': 'Change the order',
  'Halten und ziehen verschiebt einen Abschnitt.': 'Hold and drag moves a section.',
  'Das Auge blendet einen Abschnitt aus, ohne ihn zu verlieren.':
    'The eye hides a section without losing it.',
  'Navigation belegen': 'Fill the navigation',
  'Auch die vier freien Plätze der unteren Leiste stellst du hier ein.':
    'The four free slots in the bottom bar are set here too.',

  'Feedback und Bugs': 'Feedback and bugs',
  'Der direkte Draht, wenn etwas klemmt oder fehlt.':
    'The direct line when something is broken or missing.',
  'Ticket erstellen': 'Create a ticket',
  'Fehler melden oder ein Feature vorschlagen.': 'Report a bug or suggest a feature.',
  'Deine Tickets': 'Your tickets',
  'Offene und archivierte Meldungen stehen getrennt.': 'Open and archived reports are kept apart.',
  'Sobald jemand reagiert, siehst du es an deinem Ticket.':
    'As soon as somebody responds, you see it on your ticket.',

  'Manga-Sammlung': 'Manga collection',
  'Der Einstieg in alles rund um Manga, Manhwa und Manhua.':
    'The way into everything around manga, manhwa and manhua.',
  'Suchen und hinzufügen': 'Search and add',
  'Neue Titel findest du über die Manga-Suche.': 'New titles come from the manga search.',
  'Sammlung filtern': 'Filter the collection',
  'Am Lesen, Geplant, Abgeschlossen oder Abgebrochen getrennt anzeigen.':
    'Show reading, planned, completed or dropped separately.',
  Bereiche: 'Areas',
  'Leseliste, Bewertungen, Entdecken, Statistiken und Journey erreichst du von hier.':
    'Reading list, ratings, discover, stats and journey are all reachable from here.',

  'Was gerade offen ist, in deiner Reihenfolge.': 'What is open right now, in your order.',
  'Kapitel setzen': 'Set the chapter',
  'Ein Kapitel weiter oder zurück, direkt auf der Karte.':
    'One chapter forward or back, right on the card.',
  'Nach Fortschritt, Bewertung oder Titel ordnen.': 'Order by progress, rating or title.',
  'Nur Titel mit Status Lese ich oder Geplant erscheinen in der Leseliste.':
    'Only titles set to Reading or Planned appear in the reading list.',

  'Manga-Suche': 'Manga search',
  'Der Weg zu allem, was noch nicht in deiner Sammlung ist.':
    'The way to everything not yet in your collection.',
  'Manga, Manhwa und Manhua über den gesamten Bestand finden.':
    'Find manga, manhwa and manhua across the whole catalogue.',
  'Ein Titel landet mit einem Fingertipp in deiner Sammlung.':
    'One tap puts a title into your collection.',
  'Status setzen': 'Set the status',
  'Beim Hinzufügen legst du fest, ob du liest, planst oder schon durch bist.':
    'While adding you decide whether you are reading, planning or already done.',

  'Alles, was du bewertet hast, und was noch offen ist.':
    'Everything you have rated, and what is still open.',
  'Nach Bewertung auf- oder absteigend ordnen.': 'Order by rating, ascending or descending.',
  'Unbewertetes finden': 'Find the unrated',
  'Der Filter zeigt, wo noch eine Wertung fehlt.': 'The filter shows where a rating is missing.',

  'Vorschläge und beliebte Titel, die zu dir passen.':
    'Suggestions and popular titles that suit you.',
  'Empfehlungen auf Basis deiner Sammlung und Bewertungen.':
    'Recommendations based on your collection and ratings.',
  'Beliebt und Formate': 'Popular and formats',
  'Zwischen Empfehlungen, Beliebtem und einzelnen Formaten wechseln.':
    'Switch between recommendations, popular titles and single formats.',
  'Aus jeder Karte heraus landet ein Titel in deiner Sammlung.':
    'Every card can put a title into your collection.',

  'Dein Lese-Universum in Zahlen.': 'Your reading universe in numbers.',
  'Gelesene Kapitel, Titel und Durchschnittsbewertung auf einen Blick.':
    'Chapters read, titles and your average rating at a glance.',
  'Genres und Formate': 'Genres and formats',
  'Zeigt, worauf deine Lesezeit wirklich entfällt.': 'Shows where your reading time actually goes.',
  'Die Auswertung lässt sich als Bild teilen.': 'The analysis can be shared as an image.',

  'Manga aufholen': 'Catch up on manga',
  'Wo du beim Lesen am weitesten zurückliegst.': 'Where you have fallen behind the most.',
  'Je Titel stehen offene Kapitel und Fortschritt nebeneinander.':
    'Per title you see the open chapters and the progress side by side.',
  'Bis zu einem bestimmten Kapitel auf einmal als gelesen markieren.':
    'Mark everything up to a chosen chapter as read in one go.',
  Erscheinungsrhythmus: 'Release rhythm',
  'Zu vielen Titeln steht, in welchem Abstand neue Kapitel kommen.':
    'For many titles you see how often new chapters arrive.',

  'Lese-Journey': 'Reading journey',
  'Deine Lese-Trends über die Zeit.': 'Your reading trends over time.',
  'Zeigt, wann du viel und wann du kaum gelesen hast.':
    'Shows when you read a lot and when you barely read at all.',
  'Wie viele Tage am Stück du gelesen hast.': 'How many days in a row you have been reading.',
  'Welche Genres und Formate deine Sammlung prägen.':
    'Which genres and formats shape your collection.',

  'Deine letzten Kapitel, chronologisch.': 'Your latest chapters, in order.',
  'Die letzten Tage, Wochen oder Monate getrennt durchsehen.':
    'Go through the last days, weeks or months separately.',
  'Ein Eintrag führt zurück zum Titel und seinem Stand.':
    'An entry takes you back to the title and where you left off.',
  'Zeigt, wie gleichmäßig du zuletzt gelesen hast.':
    'Shows how steadily you have been reading lately.',

  'Ausgeblendete Manga': 'Hidden manga',
  'Titel, die du aus deiner Sammlung genommen hast.':
    'Titles you have taken out of your collection.',
  'Ausgeblendete Titel verschwinden aus Leseliste, Aufholen und Statistiken.':
    'Hidden titles disappear from the reading list, catch-up and your stats.',
  'Einblenden macht einen Titel wieder überall sichtbar.':
    'Unhide makes a title visible everywhere again.',
  'Dein Kapitel-Fortschritt bleibt beim Ausblenden erhalten.':
    'Hiding a title keeps your chapter progress intact.',

  'Manga-Details': 'Manga details',
  'Alles zum Titel und was du damit machen kannst.':
    'Everything about the title and what you can do with it.',
  'Fortschritt setzen': 'Set your progress',
  'Aktuelles Kapitel ändern oder bis zu einem Kapitel alles als gelesen markieren.':
    'Change the current chapter, or mark everything up to a chapter as read.',
  'Lese ich, Geplant, Abgeschlossen, Pausiert oder Abgebrochen.':
    'Reading, planned, completed, on hold or dropped.',
  'Bewerten und notieren': 'Rate and take notes',
  'Wertung setzen und eigene Notizen zum Titel hinterlegen.':
    'Set a rating and keep your own notes on the title.',
};

export default tour;
