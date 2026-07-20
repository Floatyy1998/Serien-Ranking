/** Englische Übersetzungen: Toasts/Push, Snooze-Labels, Bug-Report-Bereich. */

const dict: Record<string, string> = {
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
  '~{n} Std. übrig': '~{n} h left',
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
  'Beschreibung des Ablaufs': 'Description of the flow',
  '1. Gehe zu ...\n2. Klicke auf ...\n3. Der Fehler tritt auf ...':
    '1. Go to ...\n2. Click on ...\n3. The error occurs ...',
  '1. User öffnet ...\n2. User klickt auf ...\n3. Es passiert ...':
    '1. User opens ...\n2. User clicks on ...\n3. Then ...',
  Bild: 'Image',
  'Fehlermeldungen aus der Konsole (optional)': 'Console error messages (optional)',
  'Falls vorhanden: Fehlermeldungen aus der Browser-Konsole (F12) hier einfügen':
    'If available: paste error messages from the browser console (F12) here',
  Abbrechen: 'Cancel',
  'Wird gesendet...': 'Sending...',
  Absenden: 'Submit',

  // Ticket-Karte
  Titel: 'Title',
  Beschreibung: 'Description',
  Speichern: 'Save',
  Bearbeiten: 'Edit',
  Kommentare: 'Comments',
  'Wiedereroeffnung beantragen': 'Request reopening',
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
};

export default dict;
