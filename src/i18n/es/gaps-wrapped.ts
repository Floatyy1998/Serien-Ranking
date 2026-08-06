/** Spanische Übersetzungen: Wrapped (Achievements, Slide-Titel, Labels).
 *  Die Quell-Labels liegen als statische Daten in types/Wrapped.ts (darf t()
 *  nicht importieren — Layer-Regel), daher werden sie an den Render-Stellen
 *  in components/wrapped/* per t() übersetzt. */

const dict: Record<string, string> = {
  Nachteule: 'Búho nocturno',
  'Marathon-Läufer': 'Maratoniano',
  Abschließer: 'Completista',
  'Mehr als 30% nachts geschaut': 'Más del 30% visto por la noche',
  Nachtschwärmer: 'Noctámbulo',
  Frühaufsteher: 'Madrugador',
  'Binge-König': 'Rey del maratón',
  Cineast: 'Cinéfilo',
  'Serien-Junkie': 'Adicto a las series',
  'Genre-Entdecker': 'Explorador de géneros',
  'Wochenend-Krieger': 'Guerrero del fin de semana',
  Beständig: 'Constante',
  'Mehr als 30% morgens geschaut': 'Más del 30% visto por la mañana',
  '10+ Episoden am Stück': '10+ episodios seguidos',
  '20+ Filme geschaut': '20+ películas vistas',
  '500+ Episoden geschaut': '500+ episodios vistos',
  '5+ verschiedene Genres': '5+ géneros distintos',
  '50%+ am Wochenende': '50%+ en fin de semana',
  '30+ Tage Streak': 'Racha de 30+ días',
  '100+ Stunden geschaut': '100+ horas vistas',
  '5+ Serien abgeschlossen': '5+ series completadas',
  Zusammenfassung: 'Resumen',
  Gesamtzeit: 'Tiempo total',
  'Top Serien': 'Top series',
  'Top Filme': 'Top películas',
  'Top Genres': 'Top géneros',
  'Streaming-Dienste': 'Plataformas',
  Zeitmuster: 'Patrones horarios',
  'Deine Watch-Zeiten': 'Tus horas de visionado',
  'Rekord-Tag': 'Día récord',
  'Erstes & Letztes': 'Primero y último',
  'Binge-Statistiken': 'Estadísticas de maratón',
  Monatsübersicht: 'Resumen mensual',
  Mär: 'Mar',
};

export default dict;
