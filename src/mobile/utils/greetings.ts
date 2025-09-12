export interface Greeting {
  text: string;
  lang: string;
  title?: string;  // TMDB search title
  type?: 'movie' | 'tv';  // movie or tv series
}

const morningGreetings: Greeting[] = [
  { text: 'Wake up, Neo', lang: 'Matrix', title: 'The Matrix', type: 'movie' },
  { text: 'Good morning, Vietnam', lang: 'Film', title: 'Good Morning, Vietnam', type: 'movie' },
  { text: 'Good morning, starshine', lang: 'Willy Wonka', title: 'Willy Wonka & the Chocolate Factory', type: 'movie' },
  { text: 'Rise and shine, Mr. Freeman', lang: 'Half-Life' },
  { text: 'Rise and shine', lang: 'The Truman Show', title: 'The Truman Show', type: 'movie' },
  { text: 'Good morning', lang: 'The Truman Show', title: 'The Truman Show', type: 'movie' },
  { text: 'Today is a good day to die', lang: 'Star Trek', title: 'Star Trek: The Next Generation', type: 'tv' },
  { text: 'Dawn of a new day', lang: 'Zelda' },
  { text: 'The sun is shining', lang: 'Teletubbies', title: 'Teletubbies', type: 'tv' },
  { text: 'Wakey wakey', lang: 'Kill Bill', title: 'Kill Bill: Vol. 2', type: 'movie' },
  { text: 'Top of the morning', lang: 'Irish' },
  { text: 'Morning, sunshine', lang: 'Remember the Titans', title: 'Remember the Titans', type: 'movie' },
  { text: 'Rise and shine, campers', lang: 'Groundhog Day', title: 'Groundhog Day', type: 'movie' },
  { text: 'I got you babe', lang: 'Groundhog Day', title: 'Groundhog Day', type: 'movie' },
  { text: 'It\'s a beautiful morning', lang: 'The Hunger Games', title: 'The Hunger Games', type: 'movie' },
  { text: 'Good morning, angels', lang: 'Charlie\'s Angels', title: 'Charlie\'s Angels', type: 'movie' },
  { text: 'Time to make the donuts', lang: 'Dunkin\' Donuts' },
  { text: 'Carpe diem', lang: 'Dead Poets Society', title: 'Dead Poets Society', type: 'movie' },
  { text: 'O Captain, My Captain', lang: 'Dead Poets Society', title: 'Dead Poets Society', type: 'movie' },
  { text: 'Seize the day', lang: 'Newsies', title: 'Newsies', type: 'movie' },
  { text: 'Another day, another dollar', lang: 'American Dad', title: 'American Dad!', type: 'tv' },
  { text: 'Good morning, USA', lang: 'American Dad', title: 'American Dad!', type: 'tv' },
  { text: 'It\'s gonna be a lovely day', lang: 'Bill Withers' },
  { text: 'The early bird gets the worm', lang: 'Sprichwort' },
  { text: 'Morning has broken', lang: 'Cat Stevens' },
  { text: 'Here comes the sun', lang: 'The Beatles' },
  { text: 'Beautiful morning', lang: 'Shawshank Redemption', title: 'The Shawshank Redemption', type: 'movie' },
  { text: 'First day of the rest of your life', lang: 'American Beauty', title: 'American Beauty', type: 'movie' },
  { text: 'It\'s a new dawn', lang: 'Feeling Good' },
  { text: 'Good morning, Mr. Hunt', lang: 'Mission Impossible', title: 'Mission: Impossible', type: 'movie' },
  { text: 'Morning, detective', lang: 'True Detective', title: 'True Detective', type: 'tv' },
  { text: 'Breakfast is ready', lang: 'Breaking Bad', title: 'Breaking Bad', type: 'tv' },
  { text: 'Smells like victory', lang: 'Apocalypse Now', title: 'Apocalypse Now', type: 'movie' },
  { text: 'I love the smell of napalm in the morning', lang: 'Apocalypse Now', title: 'Apocalypse Now', type: 'movie' },
  { text: 'Coffee time', lang: 'Twin Peaks', title: 'Twin Peaks', type: 'tv' },
  { text: 'Damn fine cup of coffee', lang: 'Twin Peaks', title: 'Twin Peaks', type: 'tv' },
  { text: 'Time to wake up', lang: 'Inception', title: 'Inception', type: 'movie' },
  { text: 'Houston, we have a morning', lang: 'Apollo 13', title: 'Apollo 13', type: 'movie' },
  { text: 'Morning, Truman', lang: 'The Truman Show', title: 'The Truman Show', type: 'movie' },
  { text: 'It\'s morning again', lang: 'Reagan' },
  { text: 'The rooster crows at dawn', lang: 'Western' },
  { text: 'What\'s up, Doc', lang: 'Bugs Bunny', title: 'Looney Tunes', type: 'tv' },
  { text: 'That\'s all folks', lang: 'Looney Tunes', title: 'Looney Tunes', type: 'tv' },
  { text: 'It\'s morphin\' time', lang: 'Power Rangers', title: 'Power Rangers', type: 'tv' },
  { text: 'Autobots, roll out', lang: 'Transformers', title: 'Transformers', type: 'movie' },
  { text: 'Thunder, Thunder, ThunderCats', lang: 'ThunderCats', title: 'ThunderCats', type: 'tv' },
  { text: 'By the power of Grayskull', lang: 'He-Man', title: 'He-Man and the Masters of the Universe', type: 'tv' },
  { text: 'Cowabunga', lang: 'Ninja Turtles', title: 'Teenage Mutant Ninja Turtles', type: 'tv' }
];

const afternoonGreetings: Greeting[] = [
  { text: 'Good afternoon, Mr. Anderson', lang: 'Matrix', title: 'The Matrix', type: 'movie' },
  { text: 'Lunch time', lang: 'The Office', title: 'The Office', type: 'tv' },
  { text: 'Afternoon delight', lang: 'Anchorman', title: 'Anchorman: The Legend of Ron Burgundy', type: 'movie' },
  { text: 'High noon', lang: 'Western', title: 'High Noon', type: 'movie' },
  { text: 'It\'s 12 o\'clock somewhere', lang: 'Alan Jackson' },
  { text: 'Siesta time', lang: 'Nacho Libre', title: 'Nacho Libre', type: 'movie' },
  { text: 'Tea time', lang: 'Alice in Wonderland', title: 'Alice in Wonderland', type: 'movie' },
  { text: 'It\'s always tea time', lang: 'Mad Hatter', title: 'Alice in Wonderland', type: 'movie' },
  { text: 'Half the day is gone', lang: 'Office Space', title: 'Office Space', type: 'movie' },
  { text: 'Post-lunch lethargy', lang: 'The Office', title: 'The Office', type: 'tv' },
  { text: 'The sun is high', lang: 'The Good, the Bad and the Ugly', title: 'The Good, the Bad and the Ugly', type: 'movie' },
  { text: 'Midday madness', lang: 'Mad Max', title: 'Mad Max: Fury Road', type: 'movie' },
  { text: 'Lunch is for wimps', lang: 'Wall Street', title: 'Wall Street', type: 'movie' },
  { text: 'Let\'s do lunch', lang: 'Hollywood' },
  { text: 'Feeding time', lang: 'Jurassic Park', title: 'Jurassic Park', type: 'movie' },
  { text: 'Clever girl', lang: 'Jurassic Park', title: 'Jurassic Park', type: 'movie' },
  { text: 'The day is not over', lang: 'Gladiator', title: 'Gladiator', type: 'movie' },
  { text: 'Are you not entertained', lang: 'Gladiator', title: 'Gladiator', type: 'movie' },
  { text: 'This is where the fun begins', lang: 'Star Wars', title: 'Star Wars: Episode III - Revenge of the Sith', type: 'movie' },
  { text: 'I\'ve got a bad feeling about this', lang: 'Star Wars', title: 'Star Wars', type: 'movie' },
  { text: 'It\'s Wednesday, my dudes', lang: 'Vine' },
  { text: 'Hump day', lang: 'The Office', title: 'The Office', type: 'tv' },
  { text: 'Middle of the day', lang: 'Breaking Bad', title: 'Breaking Bad', type: 'tv' },
  { text: 'The heat is on', lang: 'Miami Vice', title: 'Miami Vice', type: 'tv' },
  { text: 'Good afternoon, Seattle', lang: 'Frasier', title: 'Frasier', type: 'tv' },
  { text: 'Afternoon, all', lang: 'Cheers', title: 'Cheers', type: 'tv' },
  { text: 'NORM', lang: 'Cheers', title: 'Cheers', type: 'tv' },
  { text: 'How\'s your day going', lang: 'Friends', title: 'Friends', type: 'tv' },
  { text: 'Could this day BE any longer', lang: 'Friends', title: 'Friends', type: 'tv' },
  { text: 'Pivot into the afternoon', lang: 'Friends', title: 'Friends', type: 'tv' },
  { text: 'Legend-wait for it-ary afternoon', lang: 'How I Met Your Mother', title: 'How I Met Your Mother', type: 'tv' },
  { text: 'Suit up for the afternoon', lang: 'How I Met Your Mother', title: 'How I Met Your Mother', type: 'tv' },
  { text: 'It\'s gonna be legendary', lang: 'How I Met Your Mother', title: 'How I Met Your Mother', type: 'tv' },
  { text: 'Afternoon, Brooklyn', lang: 'Brooklyn 99', title: 'Brooklyn Nine-Nine', type: 'tv' },
  { text: 'Cool cool cool afternoon', lang: 'Brooklyn 99', title: 'Brooklyn Nine-Nine', type: 'tv' },
  { text: 'Noice afternoon', lang: 'Brooklyn 99', title: 'Brooklyn Nine-Nine', type: 'tv' },
  { text: 'Troy and Abed in the afternoon', lang: 'Community', title: 'Community', type: 'tv' },
  { text: 'Pop pop afternoon', lang: 'Community', title: 'Community', type: 'tv' },
  { text: 'The afternoon is dark and full of terrors', lang: 'Game of Thrones', title: 'Game of Thrones', type: 'tv' },
  { text: 'A Lannister always pays his debts', lang: 'Game of Thrones', title: 'Game of Thrones', type: 'tv' },
  { text: 'Afternoon is coming', lang: 'Game of Thrones', title: 'Game of Thrones', type: 'tv' },
  { text: 'I am the one who knocks', lang: 'Breaking Bad', title: 'Breaking Bad', type: 'tv' },
  { text: 'Say my name', lang: 'Breaking Bad', title: 'Breaking Bad', type: 'tv' },
  { text: 'Yeah, science', lang: 'Breaking Bad', title: 'Breaking Bad', type: 'tv' },
  { text: 'We have to cook', lang: 'Breaking Bad', title: 'Breaking Bad', type: 'tv' },
  { text: 'The truth is out there', lang: 'X-Files', title: 'The X-Files', type: 'tv' },
  { text: 'I want to believe', lang: 'X-Files', title: 'The X-Files', type: 'tv' },
  { text: 'Afternoon, the final frontier', lang: 'Star Trek', title: 'Star Trek', type: 'tv' },
  { text: 'Make it so', lang: 'Star Trek', title: 'Star Trek: The Next Generation', type: 'tv' }
];

const eveningGreetings: Greeting[] = [
  { text: 'Good evening, Mr. Bond', lang: 'James Bond', title: 'James Bond', type: 'movie' },
  { text: 'Evening, detective', lang: 'Sherlock', title: 'Sherlock', type: 'tv' },
  { text: 'The night is young', lang: 'Dracula', title: 'Dracula', type: 'movie' },
  { text: 'Dinner is coming', lang: 'Game of Thrones', title: 'Game of Thrones', type: 'tv' },
  { text: 'Time for supper', lang: 'The Waltons', title: 'The Waltons', type: 'tv' },
  { text: 'Good evening, John-Boy', lang: 'The Waltons', title: 'The Waltons', type: 'tv' },
  { text: 'Netflix and chill', lang: 'Modern' },
  { text: 'Prime time', lang: 'TV' },
  { text: 'Previously on', lang: 'TV' },
  { text: 'Tonight\'s episode', lang: 'TV' },
  { text: 'Stay tuned', lang: 'TV' },
  { text: 'After these messages', lang: 'TV' },
  { text: 'And now, your feature presentation', lang: 'Cinema' },
  { text: 'Showtime', lang: 'Cinema' },
  { text: 'The show must go on', lang: 'Moulin Rouge', title: 'Moulin Rouge!', type: 'movie' },
  { text: 'It\'s showtime, folks', lang: 'Beetlejuice', title: 'Beetlejuice', type: 'movie' },
  { text: 'Magic hour', lang: 'Cinematography' },
  { text: 'Golden hour', lang: 'Photography' },
  { text: 'The sun is setting', lang: 'Western' },
  { text: 'Ride off into the sunset', lang: 'Western' },
  { text: 'Happy hour', lang: 'Bar' },
  { text: 'It\'s 5 o\'clock somewhere', lang: 'Alan Jackson' },
  { text: 'Miller time', lang: 'Beer Commercial' },
  { text: 'I\'ll have what she\'s having', lang: 'When Harry Met Sally', title: 'When Harry Met Sally...', type: 'movie' },
  { text: 'Shaken, not stirred', lang: 'James Bond', title: 'James Bond', type: 'movie' },
  { text: 'You had me at hello', lang: 'Jerry Maguire', title: 'Jerry Maguire', type: 'movie' },
  { text: 'Here\'s looking at you, kid', lang: 'Casablanca', title: 'Casablanca', type: 'movie' },
  { text: 'Of all the gin joints', lang: 'Casablanca', title: 'Casablanca', type: 'movie' },
  { text: 'We\'ll always have Paris', lang: 'Casablanca', title: 'Casablanca', type: 'movie' },
  { text: 'After all, tomorrow is another day', lang: 'Gone with the Wind', title: 'Gone with the Wind', type: 'movie' },
  { text: 'Frankly, my dear', lang: 'Gone with the Wind', title: 'Gone with the Wind', type: 'movie' },
  { text: 'I\'m going to make him an offer', lang: 'The Godfather', title: 'The Godfather', type: 'movie' },
  { text: 'Keep your friends close', lang: 'The Godfather', title: 'The Godfather', type: 'movie' },
  { text: 'Leave the gun, take the cannoli', lang: 'The Godfather', title: 'The Godfather', type: 'movie' },
  { text: 'Say hello to my little friend', lang: 'Scarface', title: 'Scarface', type: 'movie' },
  { text: 'The first rule of Fight Club', lang: 'Fight Club', title: 'Fight Club', type: 'movie' },
  { text: 'His name was Robert Paulson', lang: 'Fight Club', title: 'Fight Club', type: 'movie' },
  { text: 'I am Jack\'s evening greeting', lang: 'Fight Club', title: 'Fight Club', type: 'movie' },
  { text: 'You met me at a very strange time', lang: 'Fight Club', title: 'Fight Club', type: 'movie' },
  { text: 'Are you watching closely', lang: 'The Prestige', title: 'The Prestige', type: 'movie' },
  { text: 'The pledge, the turn, the prestige', lang: 'The Prestige', title: 'The Prestige', type: 'movie' },
  { text: 'Why do we fall', lang: 'Batman Begins', title: 'Batman Begins', type: 'movie' },
  { text: 'It\'s not who I am underneath', lang: 'Batman Begins', title: 'Batman Begins', type: 'movie' },
  { text: 'I\'m not wearing hockey pads', lang: 'The Dark Knight', title: 'The Dark Knight', type: 'movie' },
  { text: 'Some men just want to watch', lang: 'The Dark Knight', title: 'The Dark Knight', type: 'movie' },
  { text: 'You either die a hero', lang: 'The Dark Knight', title: 'The Dark Knight', type: 'movie' },
  { text: 'This city needs a better class', lang: 'The Dark Knight', title: 'The Dark Knight', type: 'movie' },
  { text: 'Why so serious', lang: 'The Dark Knight', title: 'The Dark Knight', type: 'movie' },
  { text: 'Let\'s put a smile on that face', lang: 'The Dark Knight', title: 'The Dark Knight', type: 'movie' },
  { text: 'It\'s evening', lang: 'Captain Obvious' }
];

const nightGreetings: Greeting[] = [
  { text: 'The night is dark and full of terrors', lang: 'Game of Thrones', title: 'Game of Thrones', type: 'tv' },
  { text: 'Good night, and good luck', lang: 'Edward R. Murrow', title: 'Good Night, and Good Luck', type: 'movie' },
  { text: 'Good night, sweet prince', lang: 'Hamlet', title: 'Hamlet', type: 'movie' },
  { text: 'To sleep, perchance to dream', lang: 'Hamlet', title: 'Hamlet', type: 'movie' },
  { text: 'The witching hour', lang: 'Folklore' },
  { text: 'It\'s past midnight', lang: 'Cinderella', title: 'Cinderella', type: 'movie' },
  { text: 'Stroke of midnight', lang: 'Cinderella', title: 'Cinderella', type: 'movie' },
  { text: 'Don\'t feed them after midnight', lang: 'Gremlins', title: 'Gremlins', type: 'movie' },
  { text: 'The night is still young', lang: 'Dracula', title: 'Dracula', type: 'movie' },
  { text: 'I never drink wine', lang: 'Dracula', title: 'Dracula', type: 'movie' },
  { text: 'Listen to them', lang: 'Dracula', title: 'Dracula', type: 'movie' },
  { text: 'The children of the night', lang: 'Dracula', title: 'Dracula', type: 'movie' },
  { text: 'The vampire hour', lang: 'True Blood', title: 'True Blood', type: 'tv' },
  { text: 'Winter is here', lang: 'Game of Thrones', title: 'Game of Thrones', type: 'tv' },
  { text: 'The long night', lang: 'Game of Thrones', title: 'Game of Thrones', type: 'tv' },
  { text: 'What is dead may never die', lang: 'Game of Thrones', title: 'Game of Thrones', type: 'tv' },
  { text: 'The night is long', lang: 'Game of Thrones', title: 'Game of Thrones', type: 'tv' },
  { text: 'I am the night', lang: 'Batman', title: 'Batman', type: 'movie' },
  { text: 'I am vengeance', lang: 'Batman', title: 'Batman', type: 'movie' },
  { text: 'The Dark Knight rises', lang: 'Batman', title: 'The Dark Knight Rises', type: 'movie' },
  { text: 'It\'s not who I am underneath', lang: 'Batman', title: 'Batman Begins', type: 'movie' },
  { text: 'Do I look like a guy with a plan', lang: 'Joker', title: 'The Dark Knight', type: 'movie' },
  { text: 'Why so serious', lang: 'The Dark Knight', title: 'The Dark Knight', type: 'movie' },
  { text: 'Let\'s put a smile on that face', lang: 'The Dark Knight', title: 'The Dark Knight', type: 'movie' },
  { text: 'This city sleeps', lang: 'Batman', title: 'Batman', type: 'movie' },
  { text: 'Gotham needs its true hero', lang: 'Batman', title: 'Batman', type: 'movie' },
  { text: 'Crime doesn\'t sleep', lang: 'Batman', title: 'Batman', type: 'movie' },
  { text: 'The city that never sleeps', lang: 'NYC' },
  { text: 'Sleep is for the weak', lang: 'Internet' },
  { text: 'I\'ll sleep when I\'m dead', lang: 'Warren Zevon' },
  { text: 'No sleep till Brooklyn', lang: 'Beastie Boys' },
  { text: 'Insomnia is my superpower', lang: 'Fight Club', title: 'Fight Club', type: 'movie' },
  { text: 'His name was Robert Paulson', lang: 'Fight Club', title: 'Fight Club', type: 'movie' },
  { text: 'First rule of Fight Club', lang: 'Fight Club', title: 'Fight Club', type: 'movie' },
  { text: 'You do not talk about Fight Club', lang: 'Fight Club', title: 'Fight Club', type: 'movie' },
  { text: 'It\'s only after we\'ve lost everything', lang: 'Fight Club', title: 'Fight Club', type: 'movie' },
  { text: 'We work jobs we hate', lang: 'Fight Club', title: 'Fight Club', type: 'movie' },
  { text: 'This is your life', lang: 'Fight Club', title: 'Fight Club', type: 'movie' },
  { text: 'You met me at a very strange time', lang: 'Fight Club', title: 'Fight Club', type: 'movie' },
  { text: 'With insomnia, nothing\'s real', lang: 'Fight Club', title: 'Fight Club', type: 'movie' },
  { text: 'Everything\'s a copy of a copy', lang: 'Fight Club', title: 'Fight Club', type: 'movie' },
  { text: 'I haven\'t slept for days', lang: 'Fight Club', title: 'Fight Club', type: 'movie' },
  { text: 'When you have insomnia', lang: 'Fight Club', title: 'Fight Club', type: 'movie' },
  { text: 'Are you still watching', lang: 'Netflix' },
  { text: 'Continue watching', lang: 'Netflix' },
  { text: 'Next episode in 5', lang: 'Netflix' },
  { text: 'Skip intro', lang: 'Netflix' },
  { text: 'One more episode', lang: 'Binge' },
  { text: 'Just one more', lang: 'Binge' },
  { text: 'Still up', lang: 'Late Night' },
  { text: 'Can\'t sleep', lang: 'Insomnia' },
  { text: 'Counting sheep', lang: 'Sleep' }
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
  
  // Use hour as seed for consistent greeting within the same hour
  // Changes only when the hour changes
  const today = new Date();
  const seed = today.getFullYear() * 10000 + 
               today.getMonth() * 100 + 
               today.getDate() + 
               hour;
  
  // Simple hash function for better distribution
  let hash = seed;
  hash = ((hash >> 16) ^ hash) * 0x45d9f3b;
  hash = ((hash >> 16) ^ hash) * 0x45d9f3b;
  hash = (hash >> 16) ^ hash;
  
  const index = Math.abs(hash) % greetings.length;
  return greetings[index];
}