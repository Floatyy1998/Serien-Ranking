import { appLocale, t } from '../../services/i18n';
import { quoteGreetings, slotQuoteGreetings } from './greetingQuotes';

export interface Greeting {
  text: string;
  lang: string;
  title?: string; // TMDB search title
  type?: 'movie' | 'tv'; // movie or tv series
  /** Nur auf Deutsch zeigen (Dialekt-Grüße, deutsche Kultur-Referenzen). */
  deOnly?: boolean;
  /** Nur auf Englisch zeigen (kolloquiale EN-Grüße als Gegenstück). */
  enOnly?: boolean;
}

const morningGreetings: Greeting[] = [
  // Klassische Morgen-Grüße
  { text: 'Guten Morgen', lang: 'Deutsch' },
  { text: 'Moin', lang: 'Norddeutsch', deOnly: true },
  { text: 'Moin moin', lang: 'Norddeutsch', deOnly: true },
  { text: 'Servus', lang: 'Süddeutsch', deOnly: true },
  { text: 'Grüß Gott', lang: 'Süddeutsch', deOnly: true },
  // Key „Morgen" ist im en-Wörterbuch als „Tomorrow" (Countdown) belegt
  { text: 'Schönen guten Morgen', lang: 'Deutsch' },
  { text: 'Guten Morgen, Sonnenschein', lang: 'Deutsch' },
  { text: 'Na, schon wach', lang: 'Deutsch' },
  { text: 'Gut geschlafen', lang: 'Deutsch' },
  { text: 'Aufgestanden', lang: 'Deutsch' },
  { text: 'Kaffee schon getrunken', lang: 'Deutsch' },
  { text: 'Ausgeschlafen', lang: 'Deutsch' },
  { text: 'Rise and shine', lang: 'Englisch' },
  { text: 'Top of the morning', lang: 'Irisch' },
  { text: 'Buongiorno', lang: 'Italienisch' },
  { text: 'Bonjour', lang: 'Französisch' },
  { text: 'Ohayō', lang: 'Japanisch' },
  { text: "Mornin'", lang: 'Englisch', enOnly: true },
  { text: 'Howdy', lang: 'Amerikanisch', enOnly: true },

  // Film/Serien-Zitate die als Morgen-Gruß funktionieren
  {
    text: 'Guten Morgen, Sam',
    lang: 'Der Herr der Ringe',
    title: 'The Lord of the Rings',
    type: 'movie',
  },
  {
    text: 'Lauf, Forrest, lauf',
    lang: 'Forrest Gump',
    title: 'Forrest Gump',
    type: 'movie',
  },
  {
    text: 'Möge die Macht mit dir sein',
    lang: 'Star Wars',
    title: 'Star Wars',
    type: 'movie',
  },
  {
    text: 'Wach auf, Neo',
    lang: 'Matrix',
    title: 'The Matrix',
    type: 'movie',
  },
  {
    text: 'Guten Morgen, Vietnam',
    lang: 'Film',
    title: 'Good Morning, Vietnam',
    type: 'movie',
  },
  {
    text: 'Carpe diem — Nutze den Tag',
    lang: 'Der Club der toten Dichter',
    title: 'Dead Poets Society',
    type: 'movie',
  },
  {
    text: 'Und täglich grüßt das Murmeltier',
    lang: 'Film',
    title: 'Groundhog Day',
    type: 'movie',
  },
  {
    text: 'Heute ist ein guter Tag zum Sterben',
    lang: 'Star Trek',
    title: 'Star Trek',
    type: 'tv',
  },
  {
    text: 'Ich bin Groot',
    lang: 'Guardians of the Galaxy',
    title: 'Guardians of the Galaxy',
    type: 'movie',
  },
  {
    text: 'Hakuna Matata',
    lang: 'Der König der Löwen',
    title: 'The Lion King',
    type: 'movie',
  },
  {
    text: 'Ohana heißt Familie',
    lang: 'Lilo & Stitch',
    title: 'Lilo & Stitch',
    type: 'movie',
  },
  {
    text: 'Zu mir, mein Schatz',
    lang: 'Der Herr der Ringe',
    title: 'The Lord of the Rings',
    type: 'movie',
  },
  {
    text: 'Das ist der Weg',
    lang: 'The Mandalorian',
    title: 'The Mandalorian',
    type: 'tv',
  },
  { text: 'Ich bin dann mal weg', lang: 'Hape Kerkeling', deOnly: true },
  { text: 'Tschakka, du schaffst das', lang: 'Deutsch', deOnly: true },
  {
    text: 'Auf ein Neues',
    lang: 'Deutsch',
  },
  {
    text: 'Bereit für Abenteuer',
    lang: 'Deutsch',
  },

  // Weitere Morgen-Grüße
  { text: 'Na, Schlafmütze', lang: 'Deutsch' },
  { text: 'Erstmal Kaffee', lang: 'Deutsch' },
  { text: 'Einen wunderschönen guten Morgen', lang: 'Deutsch' },
  { text: 'Frühstück schon gehabt', lang: 'Deutsch' },
  { text: 'Der Tag gehört dir', lang: 'Deutsch' },
  { text: 'Neuer Tag, neue Folgen', lang: 'Deutsch' },
  { text: 'Neuer Tag, neues Glück', lang: 'Deutsch' },
  { text: 'Der frühe Vogel fängt den Wurm', lang: 'Sprichwort' },
  { text: 'Morgenstund hat Gold im Mund', lang: 'Sprichwort', deOnly: true },
  { text: 'Moinsen', lang: 'Norddeutsch', deOnly: true },
  { text: 'Gude', lang: 'Hessisch', deOnly: true },
  { text: 'Morje', lang: 'Kölsch', deOnly: true },
  { text: 'Buenos días', lang: 'Spanisch' },
  { text: 'Bom dia', lang: 'Portugiesisch' },
  { text: 'Goedemorgen', lang: 'Niederländisch' },
  { text: 'God morgen', lang: 'Norwegisch' },
  { text: 'Kalimera', lang: 'Griechisch' },
  { text: 'Günaydın', lang: 'Türkisch' },
  { text: 'Dobré ráno', lang: 'Tschechisch' },
  { text: 'Rise and grind', lang: 'Slang', enOnly: true },
  { text: 'Wakey wakey', lang: 'Englisch', enOnly: true },
  { text: 'Up and at ’em', lang: 'Englisch', enOnly: true },
  {
    text: 'Ich liebe den Geruch von Napalm am Morgen',
    lang: 'Apocalypse Now',
    title: 'Apocalypse Now',
    type: 'movie',
  },
  {
    text: 'Guten Morgen, Sternenschein',
    lang: 'Charlie und die Schokoladenfabrik',
    title: 'Charlie and the Chocolate Factory',
    type: 'movie',
  },
  {
    text: 'Tu es oder tu es nicht. Es gibt kein Versuchen',
    lang: 'Star Wars',
    title: 'The Empire Strikes Back',
    type: 'movie',
  },
  {
    text: 'Ich bin bereit',
    lang: 'SpongeBob Schwammkopf',
    title: 'SpongeBob SquarePants',
    type: 'tv',
  },
  { text: 'Schnapp sie dir alle', lang: 'Pokémon', title: 'Pokémon', type: 'tv' },
  { text: 'Plus Ultra', lang: 'My Hero Academia', title: 'My Hero Academia', type: 'tv' },
  { text: 'Ich werde König der Piraten', lang: 'One Piece', title: 'One Piece', type: 'tv' },
  { text: 'Dattebayo', lang: 'Naruto', title: 'Naruto', type: 'tv' },
  { text: 'Yabba Dabba Doo', lang: 'Familie Feuerstein', title: 'The Flintstones', type: 'tv' },
  {
    text: 'Cowabunga',
    lang: 'Teenage Mutant Ninja Turtles',
    title: 'Teenage Mutant Ninja Turtles',
    type: 'tv',
  },
  {
    text: 'Es ist ein wunderschöner Tag in der Nachbarschaft',
    lang: 'Film',
    title: 'A Beautiful Day in the Neighborhood',
    type: 'movie',
  },
  {
    text: 'Heute ist nicht alle Tage, ich komm wieder, keine Frage',
    lang: 'Der rosarote Panther',
    title: 'The Pink Panther Show',
    type: 'tv',
    deOnly: true,
  },
  {
    text: 'Ich hab heute leider kein Foto für dich',
    lang: 'GNTM',
    title: "Germany's Next Topmodel",
    type: 'tv',
    deOnly: true,
  },
];

const afternoonGreetings: Greeting[] = [
  // Klassische Nachmittags-Grüße
  { text: 'Guten Tag', lang: 'Deutsch' },
  { text: 'Mahlzeit', lang: 'Deutsch', deOnly: true },
  { text: 'Hallo', lang: 'Deutsch' },
  { text: 'Grüß dich', lang: 'Deutsch' },
  { text: 'Servus', lang: 'Süddeutsch', deOnly: true },
  { text: 'Na', lang: 'Deutsch' },
  { text: 'Schönen Nachmittag', lang: 'Deutsch' },
  { text: 'Moin', lang: 'Norddeutsch', deOnly: true },
  { text: 'Tag auch', lang: 'Deutsch' },
  { text: 'Grüezi', lang: 'Schweizerdeutsch', deOnly: true },
  { text: 'Tach', lang: 'Berlinerisch', deOnly: true },
  { text: 'Was geht', lang: 'Deutsch' },
  { text: 'Alles klar', lang: 'Deutsch' },
  { text: 'Hey', lang: 'Deutsch' },
  { text: 'Ciao', lang: 'Italienisch' },
  { text: 'Hola', lang: 'Spanisch' },
  { text: 'Yo', lang: 'Slang' },
  { text: "G'day", lang: 'Australisch', enOnly: true },
  { text: 'Hiya', lang: 'Britisch', enOnly: true },

  // Film/Serien-Zitate
  {
    text: 'Bis zur Unendlichkeit und noch viel weiter',
    lang: 'Toy Story',
    title: 'Toy Story',
    type: 'movie',
  },
  {
    text: 'Leben ist wie eine Schachtel Pralinen',
    lang: 'Forrest Gump',
    title: 'Forrest Gump',
    type: 'movie',
  },
  {
    text: 'Ich mache ihm ein Angebot, das er nicht ablehnen kann',
    lang: 'Der Pate',
    title: 'The Godfather',
    type: 'movie',
  },
  {
    text: 'Schau mir in die Augen, Kleines',
    lang: 'Casablanca',
    title: 'Casablanca',
    type: 'movie',
  },
  {
    text: 'Ich bin zu alt für diesen Scheiß',
    lang: 'Lethal Weapon',
    title: 'Lethal Weapon',
    type: 'movie',
  },
  { text: 'Bazinga', lang: 'The Big Bang Theory', title: 'The Big Bang Theory', type: 'tv' },
  { text: "How you doin'", lang: 'Friends', title: 'Friends', type: 'tv' },
  {
    text: 'Cool, cool, cool',
    lang: 'Brooklyn Nine-Nine',
    title: 'Brooklyn Nine-Nine',
    type: 'tv',
  },
  { text: 'Das ist der Weg', lang: 'The Mandalorian', title: 'The Mandalorian', type: 'tv' },
  { text: 'Läuft bei dir', lang: 'Deutsch' },
  { text: 'Das Leben ist kein Ponyhof', lang: 'Deutsch' },
  { text: 'Alles in Butter', lang: 'Deutsch' },
  {
    text: 'Legen … wait for it … dary',
    lang: 'How I Met Your Mother',
    title: 'How I Met Your Mother',
    type: 'tv',
  },
  {
    text: 'Ich bin der, der klopft',
    lang: 'Breaking Bad',
    title: 'Breaking Bad',
    type: 'tv',
  },
  {
    text: 'Surprise, Motherfucker',
    lang: 'Dexter',
    title: 'Dexter',
    type: 'tv',
  },
  {
    text: "That's what she said",
    lang: 'The Office',
    title: 'The Office',
    type: 'tv',
  },
  {
    text: 'Allons-y',
    lang: 'Doctor Who',
    title: 'Doctor Who',
    type: 'tv',
  },
  {
    text: 'Yippie-Ya-Yeah, Schweinebacke',
    lang: 'Stirb Langsam',
    title: 'Die Hard',
    type: 'movie',
  },
  {
    text: 'Ich bin der König der Welt',
    lang: 'Titanic',
    title: 'Titanic',
    type: 'movie',
  },
  {
    text: 'Houston, wir haben ein Problem',
    lang: 'Apollo 13',
    title: 'Apollo 13',
    type: 'movie',
  },
  {
    text: 'Wakanda forever',
    lang: 'Black Panther',
    title: 'Black Panther',
    type: 'movie',
  },
  {
    text: 'Avengers, assemble',
    lang: 'Avengers',
    title: 'Avengers: Endgame',
    type: 'movie',
  },
  {
    text: 'Nach mir, nach mir',
    lang: 'Findet Nemo',
    title: 'Finding Nemo',
    type: 'movie',
  },
  {
    text: 'Just keep swimming',
    lang: 'Findet Nemo',
    title: 'Finding Nemo',
    type: 'movie',
  },

  // Weitere Nachmittags-Grüße
  { text: 'Hallöchen', lang: 'Deutsch' },
  { text: 'Schönen Tag noch', lang: 'Deutsch' },
  { text: 'Na, alles fit', lang: 'Deutsch' },
  { text: 'Halbzeit', lang: 'Deutsch' },
  { text: 'Mittagstief', lang: 'Deutsch' },
  { text: 'Pause verdient', lang: 'Deutsch' },
  { text: 'Hallihallo', lang: 'Deutsch', deOnly: true },
  { text: 'Was macht die Kunst', lang: 'Deutsch', deOnly: true },
  { text: 'Grüße gehen raus', lang: 'Deutsch', deOnly: true },
  { text: 'Holla, die Waldfee', lang: 'Deutsch', deOnly: true },
  { text: 'Ich glaub, mich knutscht ein Elch', lang: 'Deutsch', deOnly: true },
  { text: 'Nicht schlecht, Herr Specht', lang: 'Deutsch', deOnly: true },
  { text: 'Alles paletti', lang: 'Deutsch', deOnly: true },
  { text: 'Hoi', lang: 'Schweizerdeutsch', deOnly: true },
  { text: 'Griaß di', lang: 'Bairisch', deOnly: true },
  { text: 'Habe die Ehre', lang: 'Österreichisch', deOnly: true },
  { text: 'Salut', lang: 'Französisch' },
  { text: 'Konnichiwa', lang: 'Japanisch' },
  { text: 'Annyeong', lang: 'Koreanisch' },
  { text: 'Namaste', lang: 'Hindi' },
  { text: 'Aloha', lang: 'Hawaiianisch' },
  { text: 'Olá', lang: 'Portugiesisch' },
  { text: 'Hej', lang: 'Schwedisch' },
  { text: 'Shalom', lang: 'Hebräisch' },
  { text: 'Salam', lang: 'Arabisch' },
  { text: 'Nǐ hǎo', lang: 'Chinesisch' },
  { text: 'Ahoj', lang: 'Tschechisch' },
  { text: 'Cześć', lang: 'Polnisch' },
  { text: 'Privet', lang: 'Russisch' },
  { text: 'Mamma mia', lang: 'Italienisch' },
  { text: 'Sup', lang: 'Slang', enOnly: true },
  { text: 'Wassup', lang: 'Slang', enOnly: true },
  { text: 'Ey up', lang: 'Britisch', enOnly: true },
  { text: 'What’s crackin’', lang: 'Slang', enOnly: true },
  {
    text: 'Hello there',
    lang: 'Star Wars',
    title: 'Star Wars: Episode III - Revenge of the Sith',
    type: 'movie',
  },
  {
    text: 'Ich hab da ein ganz mieses Gefühl',
    lang: 'Star Wars',
    title: 'Star Wars',
    type: 'movie',
  },
  { text: 'Ich bin Iron Man', lang: 'Iron Man', title: 'Iron Man', type: 'movie' },
  {
    text: 'Ich kann das den ganzen Tag machen',
    lang: 'Captain America',
    title: 'Captain America: The First Avenger',
    type: 'movie',
  },
  {
    text: 'Aus großer Kraft folgt große Verantwortung',
    lang: 'Spider-Man',
    title: 'Spider-Man',
    type: 'movie',
  },
  { text: 'Pivot', lang: 'Friends', title: 'Friends', type: 'tv' },
  { text: 'We were on a break', lang: 'Friends', title: 'Friends', type: 'tv' },
  {
    text: 'Treat yo self',
    lang: 'Parks and Recreation',
    title: 'Parks and Recreation',
    type: 'tv',
  },
  { text: 'Good news, everyone', lang: 'Futurama', title: 'Futurama', type: 'tv' },
  { text: 'Wubba lubba dub dub', lang: 'Rick and Morty', title: 'Rick and Morty', type: 'tv' },
  { text: 'D’oh', lang: 'Die Simpsons', title: 'The Simpsons', type: 'tv' },
  { text: 'Ay, caramba', lang: 'Die Simpsons', title: 'The Simpsons', type: 'tv' },
  {
    text: 'Das ist ein Bingo',
    lang: 'Inglourious Basterds',
    title: 'Inglourious Basterds',
    type: 'movie',
  },
  {
    text: 'Was für ein Tag, was für ein herrlicher Tag',
    lang: 'Mad Max: Fury Road',
    title: 'Mad Max: Fury Road',
    type: 'movie',
  },
  { text: 'Lebe lang und in Frieden', lang: 'Star Trek', title: 'Star Trek', type: 'tv' },
  {
    text: 'Ich will genau das, was sie hatte',
    lang: 'Harry und Sally',
    title: 'When Harry Met Sally...',
    type: 'movie',
  },
  {
    text: 'Sag hallo zu meinem kleinen Freund',
    lang: 'Scarface',
    title: 'Scarface',
    type: 'movie',
  },
  {
    text: 'Nur eine Fleischwunde',
    lang: 'Die Ritter der Kokosnuss',
    title: 'Monty Python and the Holy Grail',
    type: 'movie',
  },
  {
    text: 'Yare yare daze',
    lang: 'JoJo’s Bizarre Adventure',
    title: "JoJo's Bizarre Adventure",
    type: 'tv',
  },
  { text: 'Shiny', lang: 'Firefly', title: 'Firefly', type: 'tv' },
];

const eveningGreetings: Greeting[] = [
  // Klassische Abend-Grüße
  { text: 'Guten Abend', lang: 'Deutsch' },
  { text: 'Nabend', lang: 'Deutsch' },
  { text: 'Schönen Feierabend', lang: 'Deutsch' },
  { text: 'Hallo', lang: 'Deutsch' },
  { text: 'Grüß dich', lang: 'Deutsch' },
  { text: 'Servus', lang: 'Süddeutsch', deOnly: true },
  { text: 'Hey', lang: 'Deutsch' },
  { text: 'Alright, mate', lang: 'Britisch', enOnly: true },
  { text: 'Na du', lang: 'Deutsch' },
  { text: 'Schönen Abend noch', lang: 'Deutsch' },
  { text: 'Feierabend', lang: 'Deutsch' },
  { text: 'Prost', lang: 'Deutsch' },
  { text: 'Couch-Zeit', lang: 'Deutsch' },
  { text: 'Füße hoch', lang: 'Deutsch' },
  { text: 'Zeit für Netflix', lang: 'Deutsch' },
  { text: 'Binge-Time', lang: 'Deutsch' },
  { text: 'Bonsoir', lang: 'Französisch' },
  { text: 'Buonasera', lang: 'Italienisch' },

  // Film/Serien-Zitate
  { text: 'Ich komme wieder', lang: 'Terminator', title: 'The Terminator', type: 'movie' },
  {
    text: 'Hasta la vista, Baby',
    lang: 'Terminator 2',
    title: 'Terminator 2: Judgment Day',
    type: 'movie',
  },
  {
    text: 'Widerstand ist zwecklos',
    lang: 'Star Trek',
    title: 'Star Trek',
    type: 'tv',
  },
  {
    text: 'Beam mich hoch, Scotty',
    lang: 'Star Trek',
    title: 'Star Trek',
    type: 'tv',
  },
  {
    text: 'Winter is coming',
    lang: 'Game of Thrones',
    title: 'Game of Thrones',
    type: 'tv',
  },
  {
    text: 'Ein Lannister zahlt immer seine Schulden',
    lang: 'Game of Thrones',
    title: 'Game of Thrones',
    type: 'tv',
  },
  {
    text: 'Ich bin dein Vater',
    lang: 'Star Wars',
    title: 'Star Wars',
    type: 'movie',
  },
  {
    text: 'Ich trinke und ich weiß Dinge',
    lang: 'Game of Thrones',
    title: 'Game of Thrones',
    type: 'tv',
  },
  {
    text: 'Say my name',
    lang: 'Breaking Bad',
    title: 'Breaking Bad',
    type: 'tv',
  },
  {
    text: 'Domo arigato, Mr. Roboto',
    lang: 'Mr. Robot',
    title: 'Mr. Robot',
    type: 'tv',
  },
  {
    text: 'Hello, friend',
    lang: 'Mr. Robot',
    title: 'Mr. Robot',
    type: 'tv',
  },
  {
    text: 'Tread lightly',
    lang: 'Breaking Bad',
    title: 'Breaking Bad',
    type: 'tv',
  },
  {
    text: 'Science, bitch',
    lang: 'Breaking Bad',
    title: 'Breaking Bad',
    type: 'tv',
  },
  {
    text: 'Everybody lies',
    lang: 'Dr. House',
    title: 'House',
    type: 'tv',
  },
  {
    text: 'Es ist nie Lupus',
    lang: 'Dr. House',
    title: 'House',
    type: 'tv',
  },
  {
    text: 'Wanna cook',
    lang: 'Breaking Bad',
    title: 'Breaking Bad',
    type: 'tv',
  },
  {
    text: 'Title of your sex tape',
    lang: 'Brooklyn Nine-Nine',
    title: 'Brooklyn Nine-Nine',
    type: 'tv',
  },
  {
    text: 'Indeed',
    lang: 'Stargate SG-1',
    title: 'Stargate SG-1',
    type: 'tv',
  },
  {
    text: 'Noice',
    lang: 'Brooklyn Nine-Nine',
    title: 'Brooklyn Nine-Nine',
    type: 'tv',
  },
  {
    text: "Omar comin'",
    lang: 'The Wire',
    title: 'The Wire',
    type: 'tv',
  },
  {
    text: 'You know nothing',
    lang: 'Game of Thrones',
    title: 'Game of Thrones',
    type: 'tv',
  },

  // Weitere Abend-Grüße
  { text: 'Endlich Feierabend', lang: 'Deutsch' },
  { text: 'Popcorn bereit', lang: 'Deutsch' },
  { text: 'Licht aus, Serie an', lang: 'Deutsch' },
  { text: 'Decke, Tee, Serie', lang: 'Deutsch' },
  { text: 'Was läuft heute', lang: 'Deutsch' },
  { text: 'Serienabend', lang: 'Deutsch' },
  { text: 'Filmabend', lang: 'Deutsch' },
  { text: 'Zeit zum Abschalten', lang: 'Deutsch' },
  { text: 'Das Sofa ruft', lang: 'Deutsch' },
  { text: 'Schon Pläne für heute Abend', lang: 'Deutsch' },
  { text: 'Primetime', lang: 'Fernsehen' },
  { text: 'Feierabendbier', lang: 'Deutsch' },
  { text: 'Lass krachen', lang: 'Deutsch', deOnly: true },
  { text: 'Buenas tardes', lang: 'Spanisch' },
  { text: 'Konbanwa', lang: 'Japanisch' },
  { text: 'Kalispera', lang: 'Griechisch' },
  { text: 'İyi akşamlar', lang: 'Türkisch' },
  { text: 'Goedenavond', lang: 'Niederländisch' },
  { text: 'God kväll', lang: 'Schwedisch' },
  { text: 'Dobrý večer', lang: 'Tschechisch' },
  { text: 'Evenin’, all', lang: 'Britisch', enOnly: true },
  { text: 'Cheers, love', lang: 'Britisch', enOnly: true },
  {
    text: 'Guten Abend, Clarice',
    lang: 'Das Schweigen der Lämmer',
    title: 'The Silence of the Lambs',
    type: 'movie',
  },
  {
    text: 'Mein Name ist Bond. James Bond',
    lang: 'James Bond',
    title: 'Casino Royale',
    type: 'movie',
  },
  {
    text: 'Geschüttelt, nicht gerührt',
    lang: 'James Bond',
    title: 'Goldfinger',
    type: 'movie',
  },
  {
    text: 'Du kannst nicht vorbei',
    lang: 'Der Herr der Ringe',
    title: 'The Lord of the Rings',
    type: 'movie',
  },
  {
    text: 'Ein Ring, sie zu knechten',
    lang: 'Der Herr der Ringe',
    title: 'The Lord of the Rings',
    type: 'movie',
  },
  {
    text: 'Man spaziert nicht einfach so nach Mordor',
    lang: 'Der Herr der Ringe',
    title: 'The Lord of the Rings',
    type: 'movie',
  },
  { text: 'Dracarys', lang: 'Game of Thrones', title: 'Game of Thrones', type: 'tv' },
  { text: 'Valar Morghulis', lang: 'Game of Thrones', title: 'Game of Thrones', type: 'tv' },
  {
    text: 'Freunde lügen nicht',
    lang: 'Stranger Things',
    title: 'Stranger Things',
    type: 'tv',
  },
  { text: 'Geronimo', lang: 'Doctor Who', title: 'Doctor Who', type: 'tv' },
  { text: 'The game is on', lang: 'Sherlock', title: 'Sherlock', type: 'tv' },
  {
    text: 'Elementar, mein lieber Watson',
    lang: 'Sherlock Holmes',
    title: 'Sherlock Holmes',
    type: 'movie',
  },
  {
    text: 'Warum ist der Rum weg',
    lang: 'Fluch der Karibik',
    title: 'Pirates of the Caribbean: The Curse of the Black Pearl',
    type: 'movie',
  },
  {
    text: 'Ich liebe es, wenn ein Plan funktioniert',
    lang: 'Das A-Team',
    title: 'The A-Team',
    type: 'tv',
  },
  {
    text: 'Mein Baby gehört zu mir',
    lang: 'Dirty Dancing',
    title: 'Dirty Dancing',
    type: 'movie',
  },
  { text: 'Redest du mit mir', lang: 'Taxi Driver', title: 'Taxi Driver', type: 'movie' },
  { text: 'Ich liebe dich 3000', lang: 'Avengers', title: 'Avengers: Endgame', type: 'movie' },
  {
    text: 'Behalt das Wechselgeld, du dreckiges Tier',
    lang: 'Kevin – Allein zu Haus',
    title: 'Home Alone',
    type: 'movie',
  },
  {
    text: 'Ich glaub, wir sind nicht mehr in Kansas',
    lang: 'Der Zauberer von Oz',
    title: 'The Wizard of Oz',
    type: 'movie',
  },
  { text: 'Shut up and take my money', lang: 'Futurama', title: 'Futurama', type: 'tv' },
  { text: 'Ich bin Spartacus', lang: 'Spartacus', title: 'Spartacus', type: 'movie' },
  {
    text: 'Die Wahrheit ist irgendwo da draußen',
    lang: 'Akte X',
    title: 'The X-Files',
    type: 'tv',
  },
];

const nightGreetings: Greeting[] = [
  // Klassische Nacht-Grüße
  { text: 'Gute Nacht', lang: 'Deutsch' },
  { text: 'Noch wach', lang: 'Deutsch' },
  { text: 'Na, noch nicht müde', lang: 'Deutsch' },
  { text: 'Hey Nachteule', lang: 'Deutsch' },
  { text: 'Na du', lang: 'Deutsch' },
  { text: 'Auch noch wach', lang: 'Deutsch' },
  { text: 'Kannst nicht schlafen', lang: 'Deutsch' },
  { text: 'Noch am Bingen', lang: 'Deutsch' },
  { text: 'Schlaflos', lang: 'Deutsch' },
  { text: 'Nachtschicht', lang: 'Deutsch' },
  { text: 'Noch eine Folge', lang: 'Binge Watching' },
  { text: 'Hey', lang: 'Deutsch' },
  { text: 'Nur noch diese eine Folge', lang: 'Deutsch' },
  { text: 'Die Nacht ist noch jung', lang: 'Deutsch' },
  { text: 'Nachts sind alle Katzen grau', lang: 'Sprichwort' },
  { text: 'Träum was Schönes', lang: 'Deutsch' },
  { text: 'Schlaf gut', lang: 'Deutsch' },
  { text: 'Ab ins Bett', lang: 'Deutsch' },
  { text: 'Buenas noches', lang: 'Spanisch' },
  { text: 'Buonanotte', lang: 'Italienisch' },
  { text: 'Bonne nuit', lang: 'Französisch' },
  { text: 'Burning the midnight oil', lang: 'Englisch', enOnly: true },

  // Film/Serien-Zitate für Nacht
  {
    text: 'Die Nacht ist dunkel und voller Schrecken',
    lang: 'Game of Thrones',
    title: 'Game of Thrones',
    type: 'tv',
  },
  { text: 'Ich bin Batman', lang: 'Batman', title: 'The Batman', type: 'movie' },
  {
    text: 'Warum so ernst',
    lang: 'The Dark Knight',
    title: 'The Dark Knight',
    type: 'movie',
  },
  {
    text: 'Schlaflos in Seattle',
    lang: 'Film',
    title: 'Sleepless in Seattle',
    type: 'movie',
  },
  {
    text: 'Wir sprechen nicht über Fight Club',
    lang: 'Fight Club',
    title: 'Fight Club',
    type: 'movie',
  },
  {
    text: 'Süße Träume',
    lang: 'Nightmare on Elm Street',
    title: 'A Nightmare on Elm Street',
    type: 'movie',
  },
  {
    text: 'Redrum',
    lang: 'The Shining',
    title: 'The Shining',
    type: 'movie',
  },
  {
    text: "Here's Johnny",
    lang: 'The Shining',
    title: 'The Shining',
    type: 'movie',
  },
  {
    text: 'Hodor',
    lang: 'Game of Thrones',
    title: 'Game of Thrones',
    type: 'tv',
  },
  {
    text: 'I see dead people',
    lang: 'The Sixth Sense',
    title: 'The Sixth Sense',
    type: 'movie',
  },
  {
    text: 'Wir werden ein größeres Boot brauchen',
    lang: 'Der weiße Hai',
    title: 'Jaws',
    type: 'movie',
  },
  {
    text: 'To infinity and beyond',
    lang: 'Toy Story',
    title: 'Toy Story',
    type: 'movie',
  },
  {
    text: 'After all this time? — Always',
    lang: 'Harry Potter',
    title: 'Harry Potter',
    type: 'movie',
  },
  {
    text: 'Mischief managed',
    lang: 'Harry Potter',
    title: 'Harry Potter',
    type: 'movie',
  },
  {
    text: 'I am inevitable',
    lang: 'Avengers',
    title: 'Avengers: Endgame',
    type: 'movie',
  },
  {
    text: 'One more episode',
    lang: 'Binge Watching',
  },
  {
    text: 'Just five more minutes',
    lang: 'Binge Watching',
  },

  // Weitere Nacht-Grüße
  { text: 'Nachtaktiv', lang: 'Deutsch' },
  { text: 'Mitternachtssnack', lang: 'Deutsch' },
  { text: 'Geisterstunde', lang: 'Deutsch' },
  { text: 'Noch nicht im Bett', lang: 'Deutsch' },
  { text: 'Der Schlaf kann warten', lang: 'Deutsch' },
  { text: 'Die Nacht gehört uns', lang: 'Deutsch' },
  { text: 'Schäfchen zählen', lang: 'Deutsch' },
  { text: 'Wer schläft, verpasst was', lang: 'Deutsch' },
  { text: 'Nur noch kurz', lang: 'Deutsch' },
  { text: 'Schlaf ist was für Schwache', lang: 'Deutsch' },
  { text: 'Ich schlafe, wenn ich tot bin', lang: 'Deutsch' },
  { text: 'Vampire schlafen auch nicht', lang: 'Deutsch' },
  { text: 'Guten Abend, gute Nacht', lang: 'Wiegenlied', deOnly: true },
  { text: 'Schlaf, Kindlein, schlaf', lang: 'Wiegenlied', deOnly: true },
  { text: 'Boa noite', lang: 'Portugiesisch' },
  { text: 'Oyasumi', lang: 'Japanisch' },
  { text: 'Kalinichta', lang: 'Griechisch' },
  { text: 'İyi geceler', lang: 'Türkisch' },
  { text: 'Dobrou noc', lang: 'Tschechisch' },
  { text: 'Welterusten', lang: 'Niederländisch' },
  { text: 'God natt', lang: 'Schwedisch' },
  { text: 'Laila tov', lang: 'Hebräisch' },
  { text: 'Nighty night', lang: 'Englisch', enOnly: true },
  { text: 'Up past your bedtime', lang: 'Englisch', enOnly: true },
  { text: 'Hallo Dunkelheit, mein alter Freund', lang: 'Simon & Garfunkel' },
  {
    text: 'Morgen ist auch noch ein Tag',
    lang: 'Vom Winde verweht',
    title: 'Gone with the Wind',
    type: 'movie',
  },
  { text: 'Es lebt', lang: 'Frankenstein', title: 'Frankenstein', type: 'movie' },
  {
    text: 'Sie kommen meistens nachts. Meistens',
    lang: 'Aliens',
    title: 'Aliens',
    type: 'movie',
  },
  {
    text: 'Im Weltall hört dich niemand schreien',
    lang: 'Alien',
    title: 'Alien',
    type: 'movie',
  },
  {
    text: 'Nach Mitternacht nicht füttern',
    lang: 'Gremlins',
    title: 'Gremlins',
    type: 'movie',
  },
  { text: 'Ich trinke nie … Wein', lang: 'Dracula', title: 'Dracula', type: 'movie' },
  { text: 'Expecto Patronum', lang: 'Harry Potter', title: 'Harry Potter', type: 'movie' },
  { text: 'Lumos', lang: 'Harry Potter', title: 'Harry Potter', type: 'movie' },
  { text: 'Nox', lang: 'Harry Potter', title: 'Harry Potter', type: 'movie' },
  {
    text: 'Ich bin die Nacht',
    lang: 'Batman',
    title: 'Batman: The Animated Series',
    type: 'tv',
  },
  { text: 'Es war einmal', lang: 'Once Upon a Time', title: 'Once Upon a Time', type: 'tv' },
  { text: 'Wir müssen zurück', lang: 'Lost', title: 'Lost', type: 'tv' },
  { text: '4 8 15 16 23 42', lang: 'Lost', title: 'Lost', type: 'tv' },
  {
    text: 'Du betrittst eine andere Dimension',
    lang: 'Twilight Zone',
    title: 'The Twilight Zone',
    type: 'tv',
  },
  {
    text: 'Mit Schlaflosigkeit ist nichts real',
    lang: 'Fight Club',
    title: 'Fight Club',
    type: 'movie',
  },
  {
    text: 'Nicht die Mama',
    lang: 'Die Dinos',
    title: 'Dinosaurs',
    type: 'tv',
    deOnly: true,
  },
  {
    text: 'Nun, liebe Kinder, gebt fein acht',
    lang: 'Sandmännchen',
    title: 'Unser Sandmännchen',
    type: 'tv',
    deOnly: true,
  },
];

// mulberry32: kleiner, schneller PRNG mit sauberem Avalanche-Verhalten.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Deterministischer Fisher-Yates-Shuffle mit seeded PRNG.
function seededShuffle<T>(arr: readonly T[], seed: number): T[] {
  const out = arr.slice();
  const rng = mulberry32(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function gcd(a: number, b: number): number {
  while (b) [a, b] = [b, a % b];
  return a;
}

// Tages-Schrittweite nahe dem goldenen Schnitt und teilerfremd zur Poolgröße:
// so wandert die Auswahl über die Tage gleichmäßig durch den ganzen Pool
// (Fibonacci-Hashing) und kommt erst nach n Tagen wieder beim selben
// Eintrag an.
function dayStride(n: number): number {
  let s = Math.max(7, Math.round(n * 0.6180339887));
  while (gcd(s, n) !== 1) s++;
  return s;
}

/** Lokaler Tageszähler (Tage seit Epoche in der Zeitzone des Geräts). */
function localDayNumber(d: Date): number {
  return Math.floor((d.getTime() - d.getTimezoneOffset() * 60_000) / 86_400_000);
}

type Slot = 'morning' | 'afternoon' | 'evening' | 'night';

const SLOTS: Record<Slot, { list: Greeting[]; start: number; seed: number }> = {
  morning: { list: morningGreetings, start: 5, seed: 1 },
  afternoon: { list: afternoonGreetings, start: 12, seed: 2 },
  evening: { list: eveningGreetings, start: 17, seed: 3 },
  night: { list: nightGreetings, start: 22, seed: 4 },
};

function slotFor(hour: number): Slot {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

/** Vollständiger, sprachgefilterter Pool eines Slots (Slot-Grüße + Zitate). */
export function greetingPool(slot: Slot): Greeting[] {
  const all = [...SLOTS[slot].list, ...slotQuoteGreetings[slot], ...quoteGreetings];
  // Dialekt-Grüße bringen nur Lesern der jeweiligen Sprache etwas — „Moin"
  // nur auf Deutsch, „Howdy" nur auf Englisch.
  return all.filter((g) => {
    if (g.deOnly) return appLocale === 'de';
    if (g.enOnly) return appLocale === 'en';
    return true;
  });
}

export function getGreeting(hour: number): Greeting {
  const slot = slotFor(hour);
  const { start, seed } = SLOTS[slot];
  const now = new Date();
  // 0–4 Uhr zählt zur Nacht des Vortags, damit die Nacht durchgehend bleibt.
  const day = localDayNumber(now) - (hour < 5 ? 1 : 0);
  const offsetHour = hour < 5 ? hour + 2 : hour - start;
  const year = new Date(day * 86_400_000).getUTCFullYear();

  // Pro Jahr und Slot eine frische Permutation des gesamten Pools. Innerhalb
  // des Jahres wird sie sequenziell abgelaufen: Tag × Schrittweite + Stunde.
  // Aufeinanderfolgende Stunden sind dadurch immer verschieden, und wer
  // täglich zur selben Zeit reinschaut, sieht erst nach „Poolgröße" Tagen
  // einen Gruß zum zweiten Mal.
  const pool = greetingPool(slot);
  const shuffled = seededShuffle(pool, year * 7919 + seed * 104_729);
  const n = shuffled.length;
  const index = (((day * dayStride(n) + offsetHour) % n) + n) % n;
  const g = shuffled[index];
  return { ...g, text: t(g.text), lang: t(g.lang) };
}
