// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useGenreRatingStage } from './useGenreRatingStage';

afterEach(cleanup);

describe('useGenreRatingStage', () => {
  it('seeds the own genres with the prefill and leaves foreign genres unrated', () => {
    const { result } = renderHook(() =>
      useGenreRatingStage({ active: true, initialRating: 8, genres: ['Drama'] })
    );
    expect(result.current.rating).toBe(8);
    expect(result.current.ownGenres).toEqual(['Drama']);
    expect(result.current.genreValues.Drama).toBe(8);
    expect(result.current.genreValues.Western).toBe(0);
    // Ohne Zutun wird gefächert gespeichert, nicht je Genre.
    expect(result.current.genreRatingsForSave()).toBeUndefined();
  });

  it('keeps the prefill instead of re-averaging stored genre values', () => {
    const { result } = renderHook(() =>
      useGenreRatingStage({
        active: true,
        initialRating: 7.5,
        genres: ['Drama', 'Crime'],
        initialGenreRatings: { Drama: 9, Crime: 7 },
      })
    );
    expect(result.current.rating).toBe(7.5);
    expect(result.current.differs).toBe(true);
    // Auseinanderlaufende Werte klappen die Stufe von selbst auf.
    expect(result.current.expanded).toBe(true);
  });

  it('averages the stored values when there is no prefill', () => {
    const { result } = renderHook(() =>
      useGenreRatingStage({
        active: true,
        genres: ['Drama', 'Crime'],
        initialGenreRatings: { Drama: 9, Crime: 6 },
      })
    );
    expect(result.current.rating).toBe(7.5);
  });

  it('switches to per-genre saving once a single genre is moved', () => {
    const { result } = renderHook(() =>
      useGenreRatingStage({ active: true, initialRating: 8, genres: ['Drama', 'Crime'] })
    );
    act(() => result.current.setGenre('Crime', 6));
    expect(result.current.rating).toBe(7);
    expect(result.current.genreRatingsForSave()).toEqual({ Drama: 8, Crime: 6 });
  });

  it('levels the rated genres back onto the overall value', () => {
    const { result } = renderHook(() =>
      useGenreRatingStage({ active: true, initialRating: 8, genres: ['Drama', 'Crime'] })
    );
    act(() => result.current.setGenre('Crime', 6));
    act(() => result.current.level());
    expect(result.current.genreValues).toMatchObject({ Drama: 7, Crime: 7 });
    expect(result.current.differs).toBe(false);
  });

  it('starts over when the reset key changes, even with identical genres', () => {
    const { result, rerender } = renderHook(
      ({ key }: { key: string }) =>
        useGenreRatingStage({ active: true, genres: ['Drama'], resetKey: key }),
      { initialProps: { key: 'series-1' } }
    );
    act(() => result.current.setOverall(9));
    expect(result.current.rating).toBe(9);

    // Zweite Karte der Queue, gleiche Genres — darf nicht die 9 erben.
    rerender({ key: 'series-2' });
    expect(result.current.rating).toBe(0);
    expect(result.current.genreValues.Drama).toBe(0);
  });

  it('keeps the genre stage open across cards when asked to', () => {
    const { result, rerender } = renderHook(
      ({ key }: { key: string }) =>
        useGenreRatingStage({
          active: true,
          genres: ['Drama'],
          resetKey: key,
          preserveExpanded: true,
        }),
      { initialProps: { key: 'series-1' } }
    );
    act(() => result.current.setExpanded(true));
    rerender({ key: 'series-2' });
    expect(result.current.expanded).toBe(true);
    expect(result.current.rating).toBe(0);
  });

  it('collapses on the next title without preserveExpanded', () => {
    const { result, rerender } = renderHook(
      ({ key }: { key: string }) =>
        useGenreRatingStage({ active: true, genres: ['Drama'], resetKey: key }),
      { initialProps: { key: 'series-1' } }
    );
    act(() => result.current.setExpanded(true));
    rerender({ key: 'series-2' });
    expect(result.current.expanded).toBe(false);
  });

  it('offers the movie genre list for movies', () => {
    const { result } = renderHook(() =>
      useGenreRatingStage({ active: true, genres: ['Drama'], mediaType: 'movie' })
    );
    // „Science Fiction" gibt es nur in der Film-Liste, „Sci-Fi & Fantasy" nur bei Serien.
    expect(result.current.otherGenres).toContain('Science Fiction');
    expect(result.current.otherGenres).not.toContain('Sci-Fi & Fantasy');
  });

  it('does not sync while inactive', () => {
    const { result, rerender } = renderHook(
      ({ active }: { active: boolean }) =>
        useGenreRatingStage({ active, initialRating: 8, genres: ['Drama'] }),
      { initialProps: { active: false } }
    );
    expect(result.current.genreValues).toEqual({});
    rerender({ active: true });
    expect(result.current.genreValues.Drama).toBe(8);
  });
});
