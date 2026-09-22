/** Gesamtwertung der Rangliste + Freundes-Vergleich — Deutsch → Englisch. */

const dict: Record<string, string> = {
  'Alles, was du je gesehen hast — ohne Wertung': 'Everything you have ever watched — no scoring',
  'Zählt am 1. wieder bei null · Nachgetragene Folgen zählen nicht':
    'Resets on the 1st · Catch-up episodes do not count',
  'Ein Freund hat noch keine Gesamtdaten — die Zahlen erscheinen nach dem nächsten Öffnen der App.':
    'One friend has no overall data yet — the numbers show up the next time they open the app.',
  '{n} Freunde haben noch keine Gesamtdaten — die Zahlen erscheinen, sobald sie die App wieder öffnen.':
    '{n} friends have no overall data yet — the numbers show up as soon as they open the app again.',
  'Wie die Rangliste zählt': 'How the ranking counts',
  'Der Wettbewerb läuft monatlich: Am Monatsersten starten alle wieder bei null, der Vormonat wandert in die Trophäen.':
    'The competition runs monthly: on the first of the month everyone starts at zero again, and the previous month moves into the trophies.',
  'Damit niemand die Wertung verfälscht, zählen nachgetragene Folgen nicht mit: Wer in kurzer Zeit viele Folgen auf einmal abhakt, trägt seine Bibliothek nach, statt zu schauen.':
    'So nobody can distort the ranking, catch-up episodes do not count: ticking off many episodes at once in a short time means filling in a library, not watching.',
  'Die Gesamtwertung zeigt alles, was du je gesehen hast — inklusive nachgetragener Folgen und Rewatches. Deshalb passt sie zu deiner Statistik-Seite, vergibt aber bewusst keine Trophäen.':
    'The overall ranking shows everything you have ever watched — including catch-up episodes and rewatches. That is why it matches your statistics page, but deliberately awards no trophies.',
  'Gesamt ansehen': 'View overall',
  'Die Gesamtwertung gibt es nur unter Freunden': 'The overall ranking only exists among friends',
  Gesamt: 'Overall',
  T: 'd',
  J: 'y',
  'davon {n} komplett': '{n} of them complete',
  'Vergleich wird geladen …': 'Loading comparison …',
  'Von {name} gibt es noch keine Gesamtzahlen.': 'There are no overall numbers from {name} yet.',
  'Ihr im Vergleich': 'You two compared',
  'Zur Gesamt-Rangliste': 'To the overall ranking',
  'Platz {rank} von {of} unter deinen Freunden': 'Rank {rank} of {of} among your friends',
  '{gap} Vorsprung': '{gap} ahead',
  'Du führst': 'You are in the lead',
  '{gap} hinter {name}': '{gap} behind {name}',
  'Dein Stand': 'Your standing',
  'von {n}': 'of {n}',
  Spitzenreiter: 'Leader',
  'Platz {n}': 'Rank {n}',
  Vorsprung: 'Lead',
};

export default dict;
