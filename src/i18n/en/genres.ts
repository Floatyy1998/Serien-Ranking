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
  // Auf Deutsch und Englisch gleich geschrieben. Der Eintrag steht hier
  // trotzdem, sonst koennen Spanisch und Franzoesisch ihn nie erreichen —
  // "Horror" heisst auf Spanisch "Terror", "Comedy" heisst "Comedia".
  'Action & Adventure': 'Action & Adventure',
  Animation: 'Animation',
  Comedy: 'Comedy',
  Crime: 'Crime',
  Drama: 'Drama',
  Documentary: 'Documentary',
  Family: 'Family',
  Kids: 'Kids',
  Mystery: 'Mystery',
  Reality: 'Reality',
  'Sci-Fi & Fantasy': 'Sci-Fi & Fantasy',
  Talk: 'Talk',
  'War & Politics': 'War & Politics',
  Western: 'Western',
  Action: 'Action',
  Adventure: 'Adventure',
  Fantasy: 'Fantasy',
  History: 'History',
  Horror: 'Horror',
  Music: 'Music',
  Romance: 'Romance',
  'Science Fiction': 'Science Fiction',
  Thriller: 'Thriller',
  War: 'War',
  'Sci-Fi': 'Sci-Fi',
  News: 'News',
  Soap: 'Soap',
};

export default dict;
