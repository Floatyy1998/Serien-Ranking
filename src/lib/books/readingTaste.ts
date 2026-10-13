import type { Book } from '../../types/Book';

export type TasteGenre =
  'fantasy' | 'thriller' | 'romance' | 'scifi' | 'ya' | 'classics' | 'horror' | 'nonfiction';

const KEYWORDS: [TasteGenre, RegExp][] = [
  ['fantasy', /fantas|magic|magie|zauber|wizard|dragon|drachen|\bfae\b|feen|sword and sorcery/],
  [
    'thriller',
    /thriller|krimi|crime|mystery|myster|detective|detektiv|suspense|spannung|murder|mord/,
  ],
  ['romance', /romance|romanze|romantic|romantik|liebesroman|love stor|new adult/],
  ['scifi', /science.?fiction|sci-?fi|dystop|space opera|weltraum|cyberpunk|zeitreise|time travel/],
  ['ya', /young adult|juvenile|jugendbuch|jugendliteratur|teen|kinderbuch|children'?s/],
  ['horror', /horror|grusel|ghost|geister|vampir|zombie|paranormal|übernatürlich|occult/],
  ['classics', /classic|klassiker|klassische literatur/],
  [
    'nonfiction',
    /biograph|memoir|autobiograph|history|geschichte|psycholog|self-help|ratgeber|sachbuch|business|wirtschaft|philosoph|politi|non-?fiction|essay|science(?!.?fiction)|wissenschaft|health|gesundheit|cooking|kochen/,
  ],
];

export function genresFromCategories(categories: string[] | undefined): TasteGenre[] {
  if (!categories?.length) return [];
  const text = categories.join(' | ').toLowerCase();
  return KEYWORDS.filter(([, pattern]) => pattern.test(text)).map(([genre]) => genre);
}

export interface ReadingTaste {
  genres: { id: TasteGenre; share: number }[];
  authors: { name: string; count: number }[];
  /** Bücher, die in die Genre-Wertung eingeflossen sind. */
  classified: number;
}

const weightOf = (book: Book): number => {
  if (book.status === 'dropped') return 0;
  const base =
    book.status === 'completed' || book.status === 'reading'
      ? 1
      : book.status === 'paused'
        ? 0.7
        : 0.4;
  return (book.rating ?? 0) >= 8 ? base * 1.5 : base;
};

/** Was jemand am meisten liest: Genres nach Gewicht (gelesen > geplant, gut bewertet zählt mehr) und Lieblingsautoren. */
export function computeReadingTaste(
  books: Book[],
  extraGenres?: (book: Book) => TasteGenre[]
): ReadingTaste {
  const genreWeight = new Map<TasteGenre, number>();
  const authorCount = new Map<string, number>();
  let classified = 0;
  for (const book of books) {
    const weight = weightOf(book);
    if (weight === 0) continue;
    const genres = [
      ...new Set([...genresFromCategories(book.categories), ...(extraGenres?.(book) ?? [])]),
    ];
    if (genres.length) {
      classified += 1;
      for (const genre of genres) {
        genreWeight.set(genre, (genreWeight.get(genre) ?? 0) + weight / genres.length);
      }
    }
    const author = book.authors?.[0];
    if (author && book.status !== 'planned') {
      authorCount.set(author, (authorCount.get(author) ?? 0) + 1);
    }
  }
  const total = [...genreWeight.values()].reduce((sum, w) => sum + w, 0);
  return {
    genres: [...genreWeight.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id, w]) => ({ id, share: total ? Math.round((w / total) * 100) : 0 })),
    authors: [...authorCount.entries()]
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count })),
    classified,
  };
}

export const MIN_TASTE_BOOKS = 3;

/** Genres erst ab drei eingeordneten Büchern — darunter wäre „liest am liebsten" geraten. */
export const tasteGenres = (taste: ReadingTaste) =>
  taste.classified >= MIN_TASTE_BOOKS ? taste.genres : [];

export const hasReadingTaste = (taste: ReadingTaste) =>
  tasteGenres(taste).length > 0 || taste.authors.length > 0;
