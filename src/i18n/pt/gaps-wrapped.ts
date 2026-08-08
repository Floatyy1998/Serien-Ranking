/** Portugiesische Übersetzungen: Wrapped (Achievements, Slide-Titel, Labels).
 *  Die Quell-Labels liegen als statische Daten in types/Wrapped.ts (darf t()
 *  nicht importieren — Layer-Regel), daher werden sie an den Render-Stellen
 *  in components/wrapped/* per t() übersetzt. */

const dict: Record<string, string> = {
  Nachteule: 'Coruja noturna',
  'Marathon-Läufer': 'Maratonista',
  Abschließer: 'Finalizador',
  'Mehr als 30% nachts geschaut': 'Mais de 30% assistido à noite',
  Nachtschwärmer: 'Notívago',
  Frühaufsteher: 'Madrugador',
  'Binge-König': 'Rei da maratona',
  Cineast: 'Cinéfilo',
  'Serien-Junkie': 'Viciado em séries',
  'Genre-Entdecker': 'Explorador de gêneros',
  'Wochenend-Krieger': 'Guerreiro de fim de semana',
  Beständig: 'Constante',
  'Mehr als 30% morgens geschaut': 'Mais de 30% assistido pela manhã',
  '10+ Episoden am Stück': '10+ episódios seguidos',
  '20+ Filme geschaut': '20+ filmes assistidos',
  '500+ Episoden geschaut': '500+ episódios assistidos',
  '5+ verschiedene Genres': '5+ gêneros diferentes',
  '50%+ am Wochenende': '50%+ no fim de semana',
  '30+ Tage Streak': 'Sequência de 30+ dias',
  '100+ Stunden geschaut': '100+ horas assistidas',
  '5+ Serien abgeschlossen': '5+ séries concluídas',
  Zusammenfassung: 'Resumo',
  Gesamtzeit: 'Tempo total',
  'Top Serien': 'Top séries',
  'Top Filme': 'Top filmes',
  'Top Genres': 'Top gêneros',
  'Streaming-Dienste': 'Plataformas',
  Zeitmuster: 'Padrões de horário',
  'Deine Watch-Zeiten': 'Seus horários de exibição',
  'Rekord-Tag': 'Dia recorde',
  'Erstes & Letztes': 'Primeiro e último',
  'Binge-Statistiken': 'Estatísticas de maratona',
  Monatsübersicht: 'Resumo mensal',
  Mär: 'Mar',
};

export default dict;
