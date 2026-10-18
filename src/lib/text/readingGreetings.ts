import { t } from '../../services/i18n';
import { usesArea, type ReadingAreas } from '../reading/readingMedium';
import { pickForHour, slotFor, type Slot } from './greetings';
import { moreQuotes, moreSlotGreetings, moreSlotQuotes } from './readingGreetingQuotes';

export interface ReadingGreetingEntry {
  text: string;
  /** Werk als Übersetzungsschlüssel; Autorennamen bleiben unübersetzt. */
  work?: string;
  author?: string;
  /** `any`: passt zu jedem Lesebereich. */
  medium: 'any' | 'books' | 'manga';
}

export interface ReadingGreeting {
  text: string;
  /** „Werk · Autor" — null bei eigenen Grüßen ohne Quelle. */
  source: string | null;
  /** Welches Werk ein Tipp auf den Gruß öffnet. */
  search: { query: string; medium: 'books' | 'manga'; author?: string } | null;
}

const SLOT_GREETINGS: Record<Slot, ReadingGreetingEntry[]> = {
  morning: [
    { text: 'Ein Kapitel zum Frühstück', medium: 'any' },
    { text: 'Kaffee und ein gutes Buch', medium: 'books' },
    { text: 'Morgenlektüre', medium: 'any' },
    { text: 'Neuer Tag, neue Seiten', medium: 'any' },
  ],
  afternoon: [
    { text: 'Lesepause verdient', medium: 'any' },
    { text: 'Zeit für ein Kapitel', medium: 'any' },
    { text: 'Ein Buch in der Mittagspause', medium: 'books' },
    { text: 'Tee und Taschenbuch', medium: 'books' },
  ],
  evening: [
    { text: 'Feierabend mit Buch', medium: 'books' },
    { text: 'Gemütliche Lesestunde', medium: 'any' },
    { text: 'Sofa, Decke, Buch', medium: 'books' },
    { text: 'Lesezeit', medium: 'any' },
  ],
  night: [
    { text: 'Nur noch ein Kapitel', medium: 'any' },
    { text: 'Noch eine Seite', medium: 'any' },
    { text: 'Nachtlektüre', medium: 'any' },
    { text: 'Lesen, bis die Augen zufallen', medium: 'any' },
  ],
};

const SLOT_QUOTES: Partial<Record<Slot, ReadingGreetingEntry[]>> = {
  morning: [
    {
      text: 'Als Gregor Samsa eines Morgens erwachte',
      work: 'Die Verwandlung',
      author: 'Franz Kafka',
      medium: 'books',
    },
    {
      text: 'Jedem Anfang wohnt ein Zauber inne',
      work: 'Stufen',
      author: 'Hermann Hesse',
      medium: 'books',
    },
  ],
};

const QUOTES: ReadingGreetingEntry[] = [
  {
    text: 'Man sieht nur mit dem Herzen gut',
    work: 'Der kleine Prinz',
    author: 'Antoine de Saint-Exupéry',
    medium: 'books',
  },
  {
    text: 'Alle Tiere sind gleich, aber manche sind gleicher',
    work: 'Farm der Tiere',
    author: 'George Orwell',
    medium: 'books',
  },
  {
    text: 'Der Große Bruder sieht dich an',
    work: '1984',
    author: 'George Orwell',
    medium: 'books',
  },
  {
    text: 'In einem Loch im Boden, da wohnte ein Hobbit',
    work: 'Der Hobbit',
    author: 'J. R. R. Tolkien',
    medium: 'books',
  },
  {
    text: 'Nicht alle, die wandern, sind verloren',
    work: 'Der Herr der Ringe',
    author: 'J. R. R. Tolkien',
    medium: 'books',
  },
  {
    text: 'Alle Kinder, außer einem, werden erwachsen',
    work: 'Peter Pan',
    author: 'J. M. Barrie',
    medium: 'books',
  },
  { text: 'Nennt mich Ismael', work: 'Moby Dick', author: 'Herman Melville', medium: 'books' },
  { text: 'Sein oder Nichtsein', work: 'Hamlet', author: 'William Shakespeare', medium: 'books' },
  {
    text: 'Alle glücklichen Familien gleichen einander',
    work: 'Anna Karenina',
    author: 'Leo Tolstoi',
    medium: 'books',
  },
  {
    text: 'Es sind unsere Entscheidungen, die zeigen, wer wir wirklich sind',
    work: 'Harry Potter und die Kammer des Schreckens',
    author: 'J. K. Rowling',
    medium: 'books',
  },
  { text: 'Die Zeit ist das Leben selbst', work: 'Momo', author: 'Michael Ende', medium: 'books' },
  {
    text: 'Tu, was du willst',
    work: 'Die unendliche Geschichte',
    author: 'Michael Ende',
    medium: 'books',
  },
  {
    text: 'Zwei Seelen wohnen, ach, in meiner Brust',
    work: 'Faust',
    author: 'Johann Wolfgang von Goethe',
    medium: 'books',
  },
  {
    text: 'Wenn du etwas wirklich willst, hilft dir das ganze Universum',
    work: 'Der Alchimist',
    author: 'Paulo Coelho',
    medium: 'books',
  },
  {
    text: 'Wer nicht an Zauberei glaubt, wird sie nie finden',
    work: 'Die Minpins',
    author: 'Roald Dahl',
    medium: 'books',
  },
  { text: 'Angst tötet das Denken', work: 'Dune', author: 'Frank Herbert', medium: 'books' },
  {
    text: 'Keine Panik',
    work: 'Per Anhalter durch die Galaxis',
    author: 'Douglas Adams',
    medium: 'books',
  },
  {
    text: 'Die Antwort ist 42',
    work: 'Per Anhalter durch die Galaxis',
    author: 'Douglas Adams',
    medium: 'books',
  },
  {
    text: 'Mach’s gut, und danke für den Fisch',
    work: 'Per Anhalter durch die Galaxis',
    author: 'Douglas Adams',
    medium: 'books',
  },
  {
    text: 'Möge das Glück stets mit euch sein',
    work: 'Die Tribute von Panem',
    author: 'Suzanne Collins',
    medium: 'books',
  },
  {
    text: 'Ich werde König der Piraten',
    work: 'One Piece',
    author: 'Eiichiro Oda',
    medium: 'manga',
  },
  {
    text: 'Das ist mein Ninja-Weg',
    work: 'Naruto',
    author: 'Masashi Kishimoto',
    medium: 'manga',
  },
  {
    text: 'Es gibt immer nur eine Wahrheit',
    work: 'Detektiv Conan',
    author: 'Gosho Aoyama',
    medium: 'manga',
  },
  {
    text: 'Widmet eure Herzen',
    work: 'Attack on Titan',
    author: 'Hajime Isayama',
    medium: 'manga',
  },
  { text: 'Bankai', work: 'Bleach', author: 'Tite Kubo', medium: 'manga' },
  { text: 'Plus Ultra', work: 'My Hero Academia', author: 'Kōhei Horikoshi', medium: 'manga' },
  { text: 'Genau nach Plan', work: 'Death Note', author: 'Tsugumi Ohba', medium: 'manga' },
];

/** Alle Grüße eines Slots, die zu den genutzten Lesebereichen passen. */
export function readingGreetingPool(slot: Slot, areas: ReadingAreas): ReadingGreetingEntry[] {
  return [
    ...SLOT_GREETINGS[slot],
    ...moreSlotGreetings[slot],
    ...(SLOT_QUOTES[slot] ?? []),
    ...(moreSlotQuotes[slot] ?? []),
    ...QUOTES,
    ...moreQuotes,
  ].filter((g) => g.medium === 'any' || usesArea(areas, g.medium));
}

// Eigene Permutation, damit Lese- und Serien-Grüße nicht im Gleichschritt wechseln.
const SEED_OFFSET = 40;

export function getReadingGreeting(hour: number, areas: ReadingAreas = 'both'): ReadingGreeting {
  const g = pickForHour(readingGreetingPool(slotFor(hour), areas), hour, SEED_OFFSET);
  const work = g.work ? t(g.work) : null;
  return {
    text: t(g.text),
    source: work || g.author ? [work, g.author].filter(Boolean).join(' · ') : null,
    search: work && g.medium !== 'any' ? { query: work, medium: g.medium, author: g.author } : null,
  };
}
