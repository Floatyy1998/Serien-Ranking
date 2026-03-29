export interface Greeting {
  text: string;
  lang: string;
  title?: string; // TMDB search title
  type?: 'movie' | 'tv'; // movie or tv series
}

const morningGreetings: Greeting[] = [
  // Klassische Morgen-Grüße
  { text: 'Guten Morgen', lang: 'Deutsch' },
  { text: 'Moin', lang: 'Norddeutsch' },
  { text: 'Moin moin', lang: 'Norddeutsch' },
  { text: 'Servus', lang: 'Süddeutsch' },
  { text: 'Grüß Gott', lang: 'Süddeutsch' },
  { text: 'Morgen', lang: 'Deutsch' },
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
  { text: 'Ich bin dann mal weg', lang: 'Hape Kerkeling' },
  { text: 'Tschakka, du schaffst das', lang: 'Deutsch' },
  {
    text: 'Auf ein Neues',
    lang: 'Deutsch',
  },
  {
    text: 'Bereit für Abenteuer',
    lang: 'Deutsch',
  },
];

const afternoonGreetings: Greeting[] = [
  // Klassische Nachmittags-Grüße
  { text: 'Guten Tag', lang: 'Deutsch' },
  { text: 'Mahlzeit', lang: 'Deutsch' },
  { text: 'Hallo', lang: 'Deutsch' },
  { text: 'Grüß dich', lang: 'Deutsch' },
  { text: 'Servus', lang: 'Süddeutsch' },
  { text: 'Na', lang: 'Deutsch' },
  { text: 'Schönen Nachmittag', lang: 'Deutsch' },
  { text: 'Moin', lang: 'Norddeutsch' },
  { text: 'Tag auch', lang: 'Deutsch' },
  { text: 'Grüezi', lang: 'Schweizerdeutsch' },
  { text: 'Tach', lang: 'Berlinerisch' },
  { text: 'Was geht', lang: 'Deutsch' },
  { text: 'Alles klar', lang: 'Deutsch' },
  { text: 'Hey', lang: 'Deutsch' },
  { text: 'Ciao', lang: 'Italienisch' },
  { text: 'Hola', lang: 'Spanisch' },
  { text: 'Yo', lang: 'Slang' },

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
];

const eveningGreetings: Greeting[] = [
  // Klassische Abend-Grüße
  { text: 'Guten Abend', lang: 'Deutsch' },
  { text: 'Nabend', lang: 'Deutsch' },
  { text: 'Schönen Feierabend', lang: 'Deutsch' },
  { text: 'Hallo', lang: 'Deutsch' },
  { text: 'Grüß dich', lang: 'Deutsch' },
  { text: 'Servus', lang: 'Süddeutsch' },
  { text: 'Hey', lang: 'Deutsch' },
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
];

export function getGreeting(hour: number): Greeting {
  let greetings: Greeting[];

  if (hour >= 5 && hour < 12) {
    greetings = morningGreetings;
  } else if (hour >= 12 && hour < 17) {
    greetings = afternoonGreetings;
  } else if (hour >= 17 && hour < 22) {
    greetings = eveningGreetings;
  } else {
    greetings = nightGreetings;
  }

  // Use current time for seed — new random greeting every hour
  const now = new Date();
  const seed =
    now.getFullYear() * 1000000 + now.getMonth() * 10000 + now.getDate() * 100 + now.getHours();

  // Simple hash function for better distribution
  let hash = seed;
  hash = ((hash >> 16) ^ hash) * 0x45d9f3b;
  hash = ((hash >> 16) ^ hash) * 0x45d9f3b;
  hash = (hash >> 16) ^ hash;

  const index = Math.abs(hash) % greetings.length;
  return greetings[index];
}
