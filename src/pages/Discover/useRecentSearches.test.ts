// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useRecentSearches } from './useRecentSearches';

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe('useRecentSearches', () => {
  it('exposes a stable list of popular searches', () => {
    const { result } = renderHook(() => useRecentSearches());
    expect(result.current.popularSearches.length).toBeGreaterThan(0);
  });

  it('hydrates the recent list from localStorage', () => {
    localStorage.setItem('recentSearches', JSON.stringify(['Dune', 'Severance']));
    const { result } = renderHook(() => useRecentSearches());
    expect(result.current.recentSearches).toEqual(['Dune', 'Severance']);
  });

  it('ignores terms shorter than 2 characters', () => {
    const { result } = renderHook(() => useRecentSearches());
    act(() => result.current.saveToRecent('a'));
    expect(result.current.recentSearches).toEqual([]);
    expect(localStorage.getItem('recentSearches')).toBeNull();
  });

  it('prepends, deduplicates and caps the recent list at 5', () => {
    const { result } = renderHook(() => useRecentSearches());
    act(() => {
      ['one', 'two', 'three', 'four', 'five', 'six'].forEach((t) => result.current.saveToRecent(t));
    });
    // Neueste zuerst, älteste (one) fällt raus.
    expect(result.current.recentSearches).toEqual(['six', 'five', 'four', 'three', 'two']);

    act(() => result.current.saveToRecent('three'));
    // Bereits vorhanden → wandert nach vorne, keine Duplikate.
    expect(result.current.recentSearches).toEqual(['three', 'six', 'five', 'four', 'two']);
    expect(JSON.parse(localStorage.getItem('recentSearches') || '[]')).toEqual([
      'three',
      'six',
      'five',
      'four',
      'two',
    ]);
  });

  it('removes a term and persists the change', () => {
    localStorage.setItem('recentSearches', JSON.stringify(['Dune', 'Severance']));
    const { result } = renderHook(() => useRecentSearches());
    act(() => result.current.removeRecentSearch('Dune'));
    expect(result.current.recentSearches).toEqual(['Severance']);
    expect(JSON.parse(localStorage.getItem('recentSearches') || '[]')).toEqual(['Severance']);
  });
});
