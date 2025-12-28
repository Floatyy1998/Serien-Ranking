export interface Greeting {
  text: string;
  lang: string;
  title?: string; // TMDB search title
  type?: 'movie' | 'tv'; // movie or tv series
}

const morningGreetings: Greeting[] = [
  // Deutsche Morgen-Grüße (mit Komma zum Namen passend)
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

  // Deutsche Film/Serien-Zitate
  { text: 'Guten Morgen, Sam', lang: 'Der Herr der Ringe', title: 'The Lord of the Rings', type: 'movie' },
  { text: 'Ich bin ein Berliner', lang: 'JFK' },
  { text: 'Lauf, Forrest, lauf', lang: 'Forrest Gump', title: 'Forrest Gump', type: 'movie' },
  { text: 'Houston, wir haben ein Problem', lang: 'Apollo 13', title: 'Apollo 13', type: 'movie' },
  { text: 'Möge die Macht mit dir sein', lang: 'Star Wars', title: 'Star Wars', type: 'movie' },
  { text: 'Ich bin dein Vater', lang: 'Star Wars', title: 'Star Wars', type: 'movie' },
  { text: 'Das ist Sparta', lang: '300', title: '300', type: 'movie' },
  { text: 'Yippie-Ya-Yeah, Schweinebacke', lang: 'Stirb Langsam', title: 'Die Hard', type: 'movie' },

  // Klassische deutsche Filme
  { text: 'Ich bin dann mal weg', lang: 'Hape Kerkeling' },
  { text: 'Morgen, Kartoffelsalat', lang: 'Deutsch' },
  { text: 'Das Boot ist voll', lang: 'Das Boot', title: 'Das Boot', type: 'movie' },
  { text: 'Lola rennt', lang: 'Lola rennt', title: 'Lola rennt', type: 'movie' },
  { text: 'Good Bye, Lenin', lang: 'Good Bye Lenin!', title: 'Good Bye Lenin!', type: 'movie' },

  // Weitere Grüße
  { text: 'Wach auf, Neo', lang: 'Matrix', title: 'The Matrix', type: 'movie' },
  { text: 'Guten Morgen, Vietnam', lang: 'Film', title: 'Good Morning, Vietnam', type: 'movie' },
  { text: 'Carpe diem - Nutze den Tag', lang: 'Der Club der toten Dichter', title: 'Dead Poets Society', type: 'movie' },
  { text: 'Nach dem Frühstück', lang: 'Der Hobbit', title: 'The Hobbit', type: 'movie' },
  { text: 'Winter is coming', lang: 'Game of Thrones', title: 'Game of Thrones', type: 'tv' },
  { text: 'Und täglich grüßt das Murmeltier', lang: 'Und täglich grüßt das Murmeltier', title: 'Groundhog Day', type: 'movie' },
];

const afternoonGreetings: Greeting[] = [
  // Deutsche Nachmittags-Grüße (mit Komma zum Namen passend)
  { text: 'Guten Tag', lang: 'Deutsch' },
  { text: 'Mahlzeit', lang: 'Deutsch' },
  { text: 'Hallo', lang: 'Deutsch' },
  { text: 'Grüß dich', lang: 'Deutsch' },
  { text: 'Servus', lang: 'Süddeutsch' },
  { text: 'Na', lang: 'Deutsch' },
  { text: 'Schönen Nachmittag noch', lang: 'Deutsch' },
  { text: 'Moin', lang: 'Norddeutsch' },
  { text: 'Tag auch', lang: 'Deutsch' },
  { text: 'Grüezi', lang: 'Schweizerdeutsch' },
  { text: 'Tach', lang: 'Berlinerisch' },

  // Deutsche Film/Serien-Zitate
  { text: 'Bis zur Unendlichkeit und noch viel weiter', lang: 'Toy Story', title: 'Toy Story', type: 'movie' },
  { text: 'Leben ist wie eine Schachtel Pralinen', lang: 'Forrest Gump', title: 'Forrest Gump', type: 'movie' },
  { text: 'Ich mache ihm ein Angebot, das er nicht ablehnen kann', lang: 'Der Pate', title: 'The Godfather', type: 'movie' },
  { text: 'Schau mir in die Augen, Kleines', lang: 'Casablanca', title: 'Casablanca', type: 'movie' },
  { text: 'Ich sehe tote Menschen', lang: 'The Sixth Sense', title: 'The Sixth Sense', type: 'movie' },
  { text: 'E.T. nach Hause telefonieren', lang: 'E.T.', title: 'E.T. the Extra-Terrestrial', type: 'movie' },

  // Deutsche Produktionen
  { text: 'Das Leben ist kein Ponyhof', lang: 'Deutsch' },
  { text: 'Alles in Butter', lang: 'Deutsch' },
  { text: 'Läuft bei dir', lang: 'Deutsch' },
  { text: 'Mach mal halblang', lang: 'Deutsch' },
  { text: 'Kommst du heute nicht, kommst du morgen', lang: 'Deutsch' },

  // Weitere bekannte Zitate
  { text: 'Ich bin zu alt für diesen Scheiß', lang: 'Lethal Weapon', title: 'Lethal Weapon', type: 'movie' },
  { text: 'Bazinga', lang: 'The Big Bang Theory', title: 'The Big Bang Theory', type: 'tv' },
  { text: 'How you doin\'', lang: 'Friends', title: 'Friends', type: 'tv' },
  { text: 'Cool, cool, cool', lang: 'Brooklyn Nine-Nine', title: 'Brooklyn Nine-Nine', type: 'tv' },
  { text: 'Das ist der Weg', lang: 'The Mandalorian', title: 'The Mandalorian', type: 'tv' },
];

const eveningGreetings: Greeting[] = [
  // Deutsche Abend-Grüße (mit Komma zum Namen passend)
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

  // Deutsche Film/Serien-Zitate für Abend
  { text: 'Ich bin der König der Welt', lang: 'Titanic', title: 'Titanic', type: 'movie' },
  { text: 'Frankenstein Junior', lang: 'Frankenstein Junior', title: 'Young Frankenstein', type: 'movie' },
  { text: 'Nach Hause telefonieren', lang: 'E.T.', title: 'E.T. the Extra-Terrestrial', type: 'movie' },
  { text: 'Ich komme wieder', lang: 'Terminator', title: 'The Terminator', type: 'movie' },
  { text: 'Hasta la vista, Baby', lang: 'Terminator 2', title: 'Terminator 2: Judgment Day', type: 'movie' },

  // Deutsche TV-Shows
  { text: 'Wetten, dass', lang: 'ZDF' },
  { text: 'Tatort gleich', lang: 'ARD' },
  { text: 'Tagesschau um 20 Uhr', lang: 'ARD' },
  { text: 'Heute Journal Zeit', lang: 'ZDF' },
  { text: 'Die Sendung mit der Maus', lang: 'WDR' },

  // Abend-Stimmung
  { text: 'Zeit für Netflix', lang: 'Modern' },
  { text: 'Couch-Zeit', lang: 'Deutsch' },
  { text: 'Füße hoch', lang: 'Deutsch' },
  { text: 'Erstmal ein Bier', lang: 'Deutsch' },
  { text: 'Pizza bestellen', lang: 'Deutsch' },

  // Weitere Zitate
  { text: 'Widerstand ist zwecklos', lang: 'Star Trek', title: 'Star Trek', type: 'tv' },
  { text: 'Beam mich hoch, Scotty', lang: 'Star Trek', title: 'Star Trek', type: 'tv' },
  { text: 'Der Winter naht', lang: 'Game of Thrones', title: 'Game of Thrones', type: 'tv' },
  { text: 'Ein Lannister zahlt immer seine Schulden', lang: 'Game of Thrones', title: 'Game of Thrones', type: 'tv' },
  { text: 'Hodor', lang: 'Game of Thrones', title: 'Game of Thrones', type: 'tv' },
];

const nightGreetings: Greeting[] = [
  // Deutsche Nacht-Grüße (mit Komma zum Namen passend)
  { text: 'Gute Nacht', lang: 'Deutsch' },
  { text: 'Noch wach', lang: 'Deutsch' },
  { text: 'Na, noch nicht müde', lang: 'Deutsch' },
  { text: 'Hey Nachteule', lang: 'Deutsch' },
  { text: 'Hallo', lang: 'Deutsch' },
  { text: 'Na du', lang: 'Deutsch' },
  { text: 'Auch noch wach', lang: 'Deutsch' },
  { text: 'Kannst nicht schlafen', lang: 'Deutsch' },
  { text: 'Noch am Bingen', lang: 'Deutsch' },
  { text: 'Schlaflos', lang: 'Deutsch' },
  { text: 'Nachtschicht', lang: 'Deutsch' },
  { text: 'Noch eine Folge', lang: 'Binge Watching' },
  { text: 'Hey', lang: 'Deutsch' },

  // Deutsche Film/Serien-Zitate für Nacht
  { text: 'Die Nacht ist dunkel und voller Schrecken', lang: 'Game of Thrones', title: 'Game of Thrones', type: 'tv' },
  { text: 'Ich bin Batman', lang: 'Batman', title: 'Batman', type: 'movie' },
  { text: 'Warum so ernst', lang: 'The Dark Knight', title: 'The Dark Knight', type: 'movie' },
  { text: 'Nach Mitternacht kommen die Geister', lang: 'Deutsch' },
  { text: 'Die Geisterstunde', lang: 'Deutsch' },

  // Schlaflos-Zitate
  { text: 'Schlaflos in Seattle', lang: 'Schlaflos in Seattle', title: 'Sleepless in Seattle', type: 'movie' },
  { text: 'Fight Club Regel Nr. 1', lang: 'Fight Club', title: 'Fight Club', type: 'movie' },
  { text: 'Die erste Regel des Fight Club', lang: 'Fight Club', title: 'Fight Club', type: 'movie' },
  { text: 'Wir sprechen nicht über Fight Club', lang: 'Fight Club', title: 'Fight Club', type: 'movie' },

  // Nacht-Stimmung
  { text: 'Nur noch diese eine Folge', lang: 'Netflix' },
  { text: 'Schläfst du schon', lang: 'WhatsApp' },
  { text: 'Noch online', lang: 'Modern' },
  { text: 'Nachts sind alle Katzen grau', lang: 'Sprichwort' },
  { text: 'Die Nacht ist noch jung', lang: 'Deutsch' },

  // Horror/Thriller
  { text: 'Ich sehe was, was du nicht siehst', lang: 'Deutsch' },
  { text: 'Süße Träume', lang: 'Nightmare on Elm Street', title: 'A Nightmare on Elm Street', type: 'movie' },
  { text: 'Redrum', lang: 'The Shining', title: 'The Shining', type: 'movie' },
  { text: 'Sie kommen', lang: 'Poltergeist', title: 'Poltergeist', type: 'movie' },

  // Weitere Nacht-Grüße
  { text: 'Sandmann kommt gleich', lang: 'DDR' },
  { text: 'Ab ins Bett', lang: 'Deutsch' },
  { text: 'Träum was Schönes', lang: 'Deutsch' },
  { text: 'Bis morgen', lang: 'Deutsch' },
  { text: 'Schlaf gut', lang: 'Deutsch' },
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

  // Use current time for seed
  // This ensures a new random greeting every hour
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