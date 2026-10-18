import { describe, expect, it } from 'vitest';
import { parseReadingAreas, suggestionAreas, suggestionScope, usesArea } from './readingMedium';

describe('readingMedium', () => {
  it('kennt nur gültige Lesebereiche', () => {
    expect(parseReadingAreas('books')).toBe('books');
    expect(parseReadingAreas('both')).toBe('both');
    expect(parseReadingAreas('alles')).toBeNull();
    expect(parseReadingAreas(null)).toBeNull();
  });

  it('weiß, ob ein Bereich genutzt wird', () => {
    expect(usesArea('both', 'manga')).toBe(true);
    expect(usesArea('books', 'books')).toBe(true);
    expect(usesArea('books', 'manga')).toBe(false);
    expect(usesArea('manga', 'books')).toBe(false);
  });

  it('schlägt nur Medien vor, die schon in der Bibliothek stehen', () => {
    expect(suggestionAreas('both', false, true)).toEqual({ books: false, manga: true });
    expect(suggestionAreas('both', true, false)).toEqual({ books: true, manga: false });
    expect(suggestionAreas('both', true, true)).toEqual({ books: true, manga: true });
    expect(suggestionScope('both', false, true)).toBe('manga');
  });

  it('zeigt Neuen beide Medien, aber nur im gewählten Lesebereich', () => {
    expect(suggestionAreas('both', false, false)).toEqual({ books: true, manga: true });
    expect(suggestionAreas('books', false, true)).toEqual({ books: true, manga: false });
    expect(suggestionScope('manga', true, false)).toBe('manga');
  });
});
