/** Englische Übersetzungen: Wrapped (Achievements, Slide-Titel, Labels).
 *  Die Quell-Labels liegen als statische Daten in types/Wrapped.ts (darf t()
 *  nicht importieren — Layer-Regel), daher werden sie an den Render-Stellen
 *  in components/wrapped/* per t() übersetzt. */
const dict: Record<string, string> = {
  // Achievements (Titel)
  Nachteule: 'Night Owl',
  Frühaufsteher: 'Early Bird',
  'Binge-König': 'Binge King',
  Cineast: 'Cinephile',
  'Serien-Junkie': 'Series Addict',
  'Genre-Entdecker': 'Genre Explorer',
  'Wochenend-Krieger': 'Weekend Warrior',
  Beständig: 'Consistent',
  'Marathon-Läufer': 'Marathon Runner',
  Abschließer: 'Completionist',
  // Achievements (Beschreibung)
  'Mehr als 30% nachts geschaut': 'More than 30% watched at night',
  'Mehr als 30% morgens geschaut': 'More than 30% watched in the morning',
  '10+ Episoden am Stück': '10+ episodes in a row',
  '20+ Filme geschaut': '20+ movies watched',
  '500+ Episoden geschaut': '500+ episodes watched',
  '5+ verschiedene Genres': '5+ different genres',
  '50%+ am Wochenende': '50%+ on weekends',
  '30+ Tage Streak': '30+ day streak',
  '100+ Stunden geschaut': '100+ hours watched',
  '5+ Serien abgeschlossen': '5+ series completed',
  // Slide-Titel
  Zusammenfassung: 'Summary',
  Gesamtzeit: 'Total time',
  'Top Serien': 'Top series',
  'Top Filme': 'Top movies',
  'Top Genres': 'Top genres',
  'Streaming-Dienste': 'Streaming services',
  Zeitmuster: 'Time patterns',
  'Deine Watch-Zeiten': 'Your watch times',
  'Rekord-Tag': 'Record day',
  Nachtschwärmer: 'Night owl',
  'Erstes & Letztes': 'First & last',
  'Binge-Statistiken': 'Binge stats',
  Monatsübersicht: 'Monthly overview',
  // Monatskürzel (nur die abweichenden)
  Mär: 'Mar',
};

export default dict;
