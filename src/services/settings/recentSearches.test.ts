// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  addRecentSearch,
  getRecentSearches,
  removeRecentSearch,
  useRecentSearches,
} from './recentSearches';

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe('recentSearches', () => {
  it('stellt neue Begriffe nach vorn und entdoppelt ohne Groß-/Kleinschreibung', () => {
    addRecentSearch('books', 'Stephen King');
    addRecentSearch('books', '  Dune ');
    addRecentSearch('books', 'stephen king');
    expect(getRecentSearches('books')).toEqual(['stephen king', 'Dune']);
    expect(JSON.parse(localStorage.getItem('bookRecentSearches') || '[]')).toEqual([
      'stephen king',
      'Dune',
    ]);
  });

  it('ignoriert Begriffe unter zwei Zeichen', () => {
    addRecentSearch('media', ' a ');
    addRecentSearch('media', '');
    expect(getRecentSearches('media')).toEqual([]);
    expect(localStorage.getItem('recentSearches')).toBeNull();
  });

  it('hält die Bereiche getrennt und nutzt die bisherigen Schlüssel', () => {
    addRecentSearch('media', 'Breaking Bad');
    addRecentSearch('books', 'Tolkien');
    addRecentSearch('manga', 'One Piece');
    expect(getRecentSearches('media')).toEqual(['Breaking Bad']);
    expect(getRecentSearches('books')).toEqual(['Tolkien']);
    expect(getRecentSearches('manga')).toEqual(['One Piece']);
    expect(localStorage.getItem('recentSearches')).toBe(JSON.stringify(['Breaking Bad']));
    expect(localStorage.getItem('mangaRecentSearches')).toBe(JSON.stringify(['One Piece']));
  });

  it('kappt Serien/Filme bei 6 und Bücher bei 8 Einträgen', () => {
    for (let i = 1; i <= 10; i++) {
      addRecentSearch('media', `Serie ${i}`);
      addRecentSearch('books', `Buch ${i}`);
    }
    expect(getRecentSearches('media')).toHaveLength(6);
    expect(getRecentSearches('media')[0]).toBe('Serie 10');
    expect(getRecentSearches('books')).toHaveLength(8);
    expect(getRecentSearches('books')[7]).toBe('Buch 3');
  });

  it('entfernt einen Eintrag nur aus seinem Bereich', () => {
    addRecentSearch('media', 'Dune');
    addRecentSearch('books', 'Dune');
    removeRecentSearch('books', 'Dune');
    expect(getRecentSearches('books')).toEqual([]);
    expect(getRecentSearches('media')).toEqual(['Dune']);
  });

  it('liest Einträge, die andere Seiten direkt geschrieben haben, und verwirft Kaputtes', () => {
    localStorage.setItem('mangaRecentSearches', JSON.stringify(['Berserk', 7, 'Vagabond']));
    expect(getRecentSearches('manga')).toEqual(['Berserk', 'Vagabond']);
    localStorage.setItem('mangaRecentSearches', '{kaputt');
    expect(getRecentSearches('manga')).toEqual([]);
  });

  it('behält den Verlauf im Speicher, wenn localStorage voll ist', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    addRecentSearch('books', 'Pratchett');
    expect(getRecentSearches('books')).toEqual(['Pratchett']);
    setItem.mockRestore();
    removeRecentSearch('books', 'Pratchett');
    expect(localStorage.getItem('bookRecentSearches')).toBe('[]');
  });

  it('aktualisiert den Hook bei jeder Änderung', () => {
    const { result } = renderHook(() => useRecentSearches('books'));
    expect(result.current).toEqual([]);
    act(() => addRecentSearch('books', 'Murakami'));
    expect(result.current).toEqual(['Murakami']);
    act(() => removeRecentSearch('books', 'Murakami'));
    expect(result.current).toEqual([]);
  });
});
