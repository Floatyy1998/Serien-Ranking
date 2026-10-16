/** Englische Übersetzungen: Toasts/Push, Snooze-Labels, Bug-Report-Bereich. */

const dict: Record<string, string> = {
  '1 Staffel': '1 season',
  'Noch nicht begonnen · {n} Ep. offen': 'Not started yet · {n} eps left',
  // Pace-Zeile (lib/date/paceCalculation)
  'Nicht genügend Daten · {n} Ep. offen': 'Not enough data · {n} eps left',
  'Pausiert · {n} Ep. offen': 'Paused · {n} eps left',
  '~{n} Ep./Tag': '~{n} eps/day',
  '~{n} Ep./Woche': '~{n} eps/week',
  'noch ~1 Tag': '~1 day left',
  'noch ~{n} Tage': '~{n} days left',
  'noch ~1 Woche': '~1 week left',
  'noch ~{n} Wochen': '~{n} weeks left',
  'Fertig ca. heute': 'Done ~today',
  'Fertig ca. am {day}.{month}.': 'Done ~{month}/{day}',
  '~{n} Std. übrig': '~{n}h left',
  '~{n} Min. übrig': '~{n} min left',
  '{n} Ep. offen': '{n} eps left',

  // Anime-Season-Labels (anilistSeasonService)
  Frühling: 'Spring',
  Sommer: 'Summer',
  Herbst: 'Fall',

  // Stats-Watchtime-Einheiten (StatsProvider)
  Jahre: 'years',
  Monate: 'months',
  Tage: 'days',
  Stunden: 'hours',
  Minuten: 'minutes',

  // markNextEpisode (Toasts)
  '{title} {label} als gesehen markiert': '{title} {label} marked as watched',
  'Undo fehlgeschlagen': 'Undo failed',
  'Fehler beim Speichern': 'Failed to save',

  // Empfehlungen (Push)
  Unbekannt: 'Unknown',
  '🎬 Empfehlung von {name}': '🎬 Recommendation from {name}',
  '{title} — „{message}“': '{title} — "{message}"',

  // Snooze-Labels
  '1 Tag': '1 day',
  '1 Woche': '1 week',
  '1 Monat': '1 month',

  // Ticket-Status / Priorität
  Offen: 'Open',
  'In Bearbeitung': 'In progress',
  Erledigt: 'Done',
  Abgelehnt: 'Rejected',
  Hinfällig: 'Obsolete',
  Niedrig: 'Low',
  Mittel: 'Medium',
  Hoch: 'High',

  // Bug-Report-Seite
  'Bugs melden oder Features vorschlagen': 'Report bugs or suggest features',
  'Neues Ticket erstellen': 'Create new ticket',
  'Meine Tickets': 'My tickets',
  'Laden...': 'Loading...',
  'Du hast noch keine Tickets erstellt.': "You haven't created any tickets yet.",

  // Ticket-Formular
  'Neues Ticket': 'New ticket',
  Priorität: 'Priority',
  'Titel *': 'Title *',
  'Kurze Beschreibung des Problems': 'Brief description of the problem',
  'Kurze Beschreibung des Features': 'Brief description of the feature',
  'Beschreibung *': 'Description *',
  'Was genau ist passiert? Was hast du erwartet?': 'What exactly happened? What did you expect?',
  'Was soll das Feature können? Warum wäre es nützlich?':
    'What should the feature do? Why would it be useful?',
  'Schritte zum Reproduzieren': 'Steps to reproduce',
  'Beschreibung des Ablaufs': 'How it should work',
  '1. Gehe zu ...\n2. Klicke auf ...\n3. Der Fehler tritt auf ...':
    '1. Go to ...\n2. Click on ...\n3. The error occurs ...',
  '1. User öffnet ...\n2. User klickt auf ...\n3. Es passiert ...':
    '1. User opens ...\n2. User clicks on ...\n3. Then ...',
  Bild: 'Image',
  'Fehlermeldungen aus der Konsole (optional)': 'Console error messages (optional)',
  'Falls vorhanden: Fehlermeldungen aus der Browser-Konsole (F12) hier einfügen':
    'Paste any error messages from the browser console (F12) here',
  Abbrechen: 'Cancel',
  'Wird gesendet...': 'Sending...',
  Absenden: 'Submit',

  // Ticket-Karte
  Titel: 'Title',
  Beschreibung: 'Description',
  Speichern: 'Save',
  Bearbeiten: 'Edit',
  Kommentare: 'Comments',
  'Betreiber von TV-Rank': 'TV-Rank Owner',
  Champion: 'Champion',
  'Hat ein TV-Rank-Event gewonnen': 'Won a TV-Rank event',
  Supporter: 'Supporter',
  'Unterstützt TV-Rank': 'Supports TV-Rank',
  'Wiedereroeffnung beantragen': 'Request to reopen',
  'Begruendung fuer die Wiedereroeffnung:': 'Reason for reopening:',
  'Warum soll das Ticket wieder geoeffnet werden?': 'Why should the ticket be reopened?',
  '[Antrag auf Wiedereroeffnung] {text}': '[Reopen request] {text}',
  'Antrag senden': 'Send request',
  'Kommentar schreiben...': 'Write a comment...',

  // Admin-Notifications (Bug-Tickets)
  'Neues Bug-Ticket': 'New bug ticket',
  'Neuer Feature-Wunsch': 'New feature request',
  'Neuer Kommentar': 'New comment',
  '{name} hat auf "{title}" geantwortet': '{name} replied to "{title}"',
  'Ticket-Status geändert': 'Ticket status changed',
  'Dein Ticket "{title}" ist jetzt: {status}': 'Your ticket "{title}" is now: {status}',
  'Antwort auf dein Ticket': 'Reply to your ticket',
  'Admin hat auf "{title}" geantwortet: {snippet}': 'Admin replied to "{title}": {snippet}',
  Geschlossen: 'Closed',
  Archiv: 'Archive',
  'Ticket schließen': 'Close ticket',
  'Ticket wirklich schließen?': 'Close this ticket?',
  'Keine offenen Tickets.': 'No open tickets.',
  'Keine archivierten Tickets.': 'No archived tickets.',
  'Ticket geschlossen': 'Ticket closed',
  '{name} hat das Ticket "{title}" geschlossen': '{name} closed the ticket "{title}"',
  'Kontakt:': 'Contact:',
  'E-Mail:': 'Email:',
  'Rechtliche Informationen konnten nicht geladen werden.': "Couldn't load legal information.",
  // Ausgeblendete Serien wieder aktiv schalten
  Ausgeblendet: 'Hidden',
  'Wieder einblenden': 'Unhide',
  'Wieder einblenden?': 'Unhide it?',
  'Serie wird wieder angezeigt': 'Show is visible again',
  '„{title}" wird wieder angezeigt': '"{title}" is visible again',
  'Serien, Filme, Manga, Bücher …': 'Shows, movies, manga, books …',
  'Gerade dabei': 'In progress',
  'Kapitel {n}': 'Chapter {n}',
  'Serien · Filme · Anime · Manga · Bücher': 'Shows · Movies · Anime · Manga · Books',
  'Ein Ort für alles, was du schaust und liest.': 'One place for everything you watch and read.',
  'Hak Folgen ab, verfolge neue Kapitel, führ dein Bücherregal – und sieh, was deine Freunde gerade schauen und lesen.':
    'Check off episodes, follow new chapters, keep your bookshelf – and see what your friends are watching and reading.',
  'Ob Staffelfinale oder neues Kapitel – TV-Rank merkt sich, wo du stehst.':
    'Season finale or new chapter – TV-Rank remembers where you are.',
  Schauen: 'Watch',
  'Serien, Filme und Anime': 'Shows, movies and anime',
  'Folgen abhaken – einzeln, staffelweise oder per Wisch':
    'Check off episodes – one by one, by season or with a swipe',
  'Kalender mit allem, was diese Woche läuft': 'A calendar with everything airing this week',
  'Wo es läuft: Streaming-Anbieter für dein Land':
    'Where to watch: streaming services in your country',
  'Anime mit Filler- und Recap-Markierung': 'Anime with filler and recap labels',
  'Manga, Manhwa und Bücher': 'Manga, manhwa and books',
  'Neue Kapitel im Blick – nach Kapiteln oder Bänden':
    'Keep up with new chapters – by chapter or by volume',
  'Bücher mit Seiten, Lesedatum und Jahresziel':
    'Books with pages, reading dates and a yearly goal',
  'ISBN-Scanner für Bücher und Manga-Bände': 'ISBN scanner for books and manga volumes',
  'Bücher zu deinen Lieblingsserien': 'Books behind your favorite shows',
  'Was TV-Rank alles kann': 'Everything TV-Rank can do',
  'Jede Folge im Blick – neue Staffeln, Kalender und Countdowns.':
    'Every episode at a glance – new seasons, calendar and countdowns.',
  'Watchlist, Bewertungen und wo der Film gerade läuft.':
    'Watchlist, ratings and where the movie is streaming right now.',
  'Die aktuelle Saison mit deutschen Anbietern, Filler und Recaps markiert.':
    'The current season with local services, fillers and recaps marked.',
  'Manga, Manhwa und Manhua – nach Kapiteln oder Bänden, mit neuen Releases.':
    'Manga, manhwa and manhua – by chapter or volume, with new releases.',
  'Dein Regal mit Seiten, Lesejahr, Wunschliste und ISBN-Scanner.':
    'Your shelf with pages, reading year, wishlist and ISBN scanner.',
  'Freunde & Chat': 'Friends & chat',
  'Sieh, was Freunde schauen und lesen, empfiehl Titel und schreib im Chat.':
    'See what friends watch and read, recommend titles and chat.',
  'Badges & Pets': 'Badges & pets',
  'Sammle Badges und zieh dein Pet groß – es levelt mit jeder Folge.':
    'Collect badges and raise your pet – it levels up with every episode.',
  'Wrapped & Statistiken': 'Wrapped & stats',
  'Dein Jahr in Zahlen – Folgen, Filme, Kapitel und Seiten.':
    'Your year in numbers – episodes, movies, chapters and pages.',
  'Überall dabei': 'Everywhere you are',
  'Web, Android, iPhone und Windows – alles synchron.':
    'Web, Android, iPhone and Windows – always in sync.',
  'Push zur richtigen Zeit': 'Pushes at the right moment',
  'Neue Folgen, neue Kapitel und Nachrichten von Freunden.':
    'New episodes, new chapters and messages from friends.',
  'Für dein Land': 'For your country',
  'Welche Anbieter was im Programm haben – passend zu deiner Region.':
    'Which services carry what – matched to your region.',
  'In deiner Sprache': 'In your language',
  'Deutsch, Englisch, Spanisch, Französisch und Portugiesisch.':
    'German, English, Spanish, French and Portuguese.',
  'Starte noch heute – mit deiner Lieblingsserie, deinem Manga oder dem Buch auf deinem Nachttisch.':
    'Start today – with your favorite show, your manga or the book on your nightstand.',
};

export default dict;
