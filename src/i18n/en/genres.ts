/** Englische Übersetzungen: TMDB-Genre-Labels (utils/genreMap GENRE_MAP).
 *  Nur die deutschen Labels brauchen einen Eintrag — die bereits englischen
 *  (Action, Comedy, Drama, …) fallen unverändert durch. Der statische Katalog
 *  liefert Genres ohnehin englisch; das betrifft nur den mapGenreIds-Pfad
 *  (Discover/Seasonal/Anime). */
const dict: Record<string, string> = {
  Abenteuer: 'Adventure',
  Krimi: 'Crime',
  Dokumentation: 'Documentary',
  Familie: 'Family',
  Historie: 'History',
  Musik: 'Music',
  Romantik: 'Romance',
  'TV-Film': 'TV Movie',
  Krieg: 'War',
  'Action und Abenteuer': 'Action & Adventure',
};

export default dict;
