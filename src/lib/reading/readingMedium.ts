/** Welche Lesebereiche jemand nutzt: Bücher und Manga, nur Bücher oder nur Manga. */
export type ReadingAreas = 'both' | 'books' | 'manga';

export const parseReadingAreas = (value: unknown): ReadingAreas | null =>
  value === 'both' || value === 'books' || value === 'manga' ? value : null;

export const usesArea = (areas: ReadingAreas, area: 'books' | 'manga'): boolean =>
  areas === 'both' || areas === area;

/**
 * Für welche Medien es Vorschläge gibt: nur für die, die schon in der Bibliothek stehen.
 * Wer noch gar nichts hat, bekommt beide (im Rahmen der Lesebereiche) zum Einstieg.
 */
export const suggestionAreas = (
  areas: ReadingAreas,
  hasBooks: boolean,
  hasManga: boolean
): { books: boolean; manga: boolean } => {
  const books = usesArea(areas, 'books');
  const manga = usesArea(areas, 'manga');
  const ownsAny = (books && hasBooks) || (manga && hasManga);
  if (!ownsAny) return { books, manga };
  return { books: books && hasBooks, manga: manga && hasManga };
};

/** Dieselbe Regel als Lesebereich, z. B. für die Sprüche in der Begrüßung. */
export const suggestionScope = (
  areas: ReadingAreas,
  hasBooks: boolean,
  hasManga: boolean
): ReadingAreas => {
  const { books, manga } = suggestionAreas(areas, hasBooks, hasManga);
  return books && manga ? 'both' : books ? 'books' : 'manga';
};
