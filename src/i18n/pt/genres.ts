/** Portugiesische Übersetzungen: TMDB-Genre-Labels (utils/genreMap GENRE_MAP).
 *  Nur die deutschen Labels brauchen einen Eintrag — die bereits englischen
 *  (Action, Comedy, Drama, …) fallen unverändert durch. Der statische Katalog
 *  liefert Genres ohnehin englisch; das betrifft nur den mapGenreIds-Pfad
 *  (Discover/Seasonal/Anime). */

const dict: Record<string, string> = {
  Abenteuer: 'Aventura',
  Krimi: 'Crime',
  Dokumentation: 'Documentário',
  Familie: 'Família',
  Historie: 'História',
  Musik: 'Música',
  Romantik: 'Romance',
  'TV-Film': 'Filme de TV',
  Krieg: 'Guerra',
  'Action und Abenteuer': 'Ação e aventura',
  'Action & Adventure': 'Ação e aventura',
  Animation: 'Animação',
  Comedy: 'Comédia',
  Crime: 'Crime',
  Drama: 'Drama',
  Documentary: 'Documentário',
  Family: 'Família',
  Kids: 'Infantil',
  Mystery: 'Mistério',
  Reality: 'Reality',
  'Sci-Fi & Fantasy': 'Ficção científica e fantasia',
  Talk: 'Talk show',
  'War & Politics': 'Guerra e política',
  Western: 'Faroeste',
  Action: 'Ação',
  Adventure: 'Aventura',
  Fantasy: 'Fantasia',
  History: 'História',
  Horror: 'Terror',
  Music: 'Música',
  Romance: 'Romance',
  'Science Fiction': 'Ficção científica',
  Thriller: 'Thriller',
  War: 'Guerra',
  'Sci-Fi': 'Ficção científica',
  News: 'Notícias',
  Soap: 'Novela',
};

export default dict;
