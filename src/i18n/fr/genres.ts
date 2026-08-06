/** Französische Übersetzungen: TMDB-Genre-Labels (utils/genreMap GENRE_MAP).
 *  Nur die deutschen Labels brauchen einen Eintrag — die bereits englischen
 *  (Action, Comedy, Drama, …) fallen unverändert durch. Der statische Katalog
 *  liefert Genres ohnehin englisch; das betrifft nur den mapGenreIds-Pfad
 *  (Discover/Seasonal/Anime). */

const dict: Record<string, string> = {
  Abenteuer: 'Aventure',
  Krimi: 'Policier',
  Dokumentation: 'Documentaire',
  Familie: 'Familial',
  Historie: 'Histoire',
  Musik: 'Musique',
  Romantik: 'Romance',
  'TV-Film': 'Téléfilm',
  Krieg: 'Guerre',
  'Action und Abenteuer': 'Action et aventure',
  Reality: 'Télé-réalité',
  'Sci-Fi & Fantasy': 'SF & Fantastique',
  'Sci-Fi': 'SF',
  Soap: 'Feuilleton',
  'Action & Adventure': 'Action & Aventure',
  Animation: 'Animation',
  Comedy: 'Comédie',
  Crime: 'Crime',
  Drama: 'Drame',
  Documentary: 'Documentaire',
  Family: 'Familial',
  Kids: 'Enfants',
  Mystery: 'Mystère',
  Talk: 'Talk-show',
  'War & Politics': 'Guerre & Politique',
  Western: 'Western',
  Action: 'Action',
  Adventure: 'Aventure',
  Fantasy: 'Fantastique',
  History: 'Histoire',
  Horror: 'Horreur',
  Music: 'Musique',
  Romance: 'Romance',
  'Science Fiction': 'Science-Fiction',
  Thriller: 'Thriller',
  War: 'Guerre',
  News: 'Actualités',
};

export default dict;
