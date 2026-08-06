/** Spanische Übersetzungen: TMDB-Genre-Labels (utils/genreMap GENRE_MAP).
 *  Nur die deutschen Labels brauchen einen Eintrag — die bereits englischen
 *  (Action, Comedy, Drama, …) fallen unverändert durch. Der statische Katalog
 *  liefert Genres ohnehin englisch; das betrifft nur den mapGenreIds-Pfad
 *  (Discover/Seasonal/Anime). */

const dict: Record<string, string> = {
  Abenteuer: 'Aventura',
  Krimi: 'Crimen',
  Dokumentation: 'Documental',
  Familie: 'Familia',
  Historie: 'Historia',
  Musik: 'Música',
  Romantik: 'Romance',
  'TV-Film': 'Película de TV',
  Krieg: 'Guerra',
  'Action und Abenteuer': 'Acción y aventura',
  'Action & Adventure': 'Acción y aventura',
  Animation: 'Animación',
  Comedy: 'Comedia',
  Crime: 'Crimen',
  Drama: 'Drama',
  Documentary: 'Documental',
  Family: 'Familia',
  Kids: 'Infantil',
  Mystery: 'Misterio',
  Reality: 'Reality',
  'Sci-Fi & Fantasy': 'Ciencia ficción y fantasía',
  Talk: 'Talk show',
  'War & Politics': 'Guerra y política',
  Western: 'Western',
  Action: 'Acción',
  Adventure: 'Aventura',
  Fantasy: 'Fantasía',
  History: 'Historia',
  Horror: 'Terror',
  Music: 'Música',
  Romance: 'Romance',
  'Science Fiction': 'Ciencia ficción',
  Thriller: 'Thriller',
  War: 'Guerra',
  'Sci-Fi': 'Ciencia ficción',
  News: 'Noticias',
  Soap: 'Telenovela',
};

export default dict;
