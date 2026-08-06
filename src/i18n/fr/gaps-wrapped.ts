/** Französische Übersetzungen: Wrapped (Achievements, Slide-Titel, Labels).
 *  Die Quell-Labels liegen als statische Daten in types/Wrapped.ts (darf t()
 *  nicht importieren — Layer-Regel), daher werden sie an den Render-Stellen
 *  in components/wrapped/* per t() übersetzt. */

const dict: Record<string, string> = {
  Nachteule: 'Couche-tard',
  'Mehr als 30% nachts geschaut': 'Plus de 30 % la nuit',
  'Mehr als 30% morgens geschaut': 'Plus de 30 % le matin',
  '30+ Tage Streak': "30+ jours d'affilée",
  Frühaufsteher: 'Lève-tôt',
  'Binge-König': 'Roi du binge',
  Cineast: 'Cinéphile',
  'Serien-Junkie': 'Accro aux séries',
  'Genre-Entdecker': 'Explorateur de genres',
  'Wochenend-Krieger': 'Guerrier du week-end',
  Beständig: 'Régulier',
  'Marathon-Läufer': 'Marathonien',
  Abschließer: 'Finisseur',
  '10+ Episoden am Stück': "10+ épisodes d'affilée",
  '20+ Filme geschaut': '20+ films vus',
  '500+ Episoden geschaut': '500+ épisodes vus',
  '5+ verschiedene Genres': '5+ genres différents',
  '50%+ am Wochenende': '50 %+ le week-end',
  '100+ Stunden geschaut': '100+ heures vues',
  '5+ Serien abgeschlossen': '5+ séries terminées',
  Zusammenfassung: 'Résumé',
  Gesamtzeit: 'Temps total',
  'Top Serien': 'Top séries',
  'Top Filme': 'Top films',
  'Top Genres': 'Top genres',
  'Streaming-Dienste': 'Services de streaming',
  Zeitmuster: 'Habitudes horaires',
  'Deine Watch-Zeiten': 'Tes heures de visionnage',
  'Rekord-Tag': 'Jour record',
  Nachtschwärmer: 'Oiseau de nuit',
  'Binge-Statistiken': 'Stats de binge-watching',
  'Erstes & Letztes': 'Premier & dernier',
  Monatsübersicht: 'Aperçu mensuel',
  Mär: 'Mars',
};

export default dict;
