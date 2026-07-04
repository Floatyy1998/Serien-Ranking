// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { GenreComparison, TasteMatchResult } from '../../services/tasteMatchService';
import { GenresTab } from './GenresTab';

function makeResult(sharedGenres: GenreComparison[]): TasteMatchResult {
  return {
    overallMatch: 80,
    seriesOverlap: { score: 0, sharedSeries: [], userOnlyCount: 0, friendOnlyCount: 0 },
    movieOverlap: { score: 0, sharedMovies: [], userOnlyCount: 0, friendOnlyCount: 0 },
    genreMatch: { score: 50, sharedGenres, userTopGenres: [], friendTopGenres: [] },
    ratingMatch: { score: 0, averageDifference: 0, sameRatingCount: 0 },
    providerMatch: { score: 0, sharedProviders: [] },
  };
}

afterEach(() => cleanup());

describe('GenresTab', () => {
  it('rendert Legende, Section-Header und Genre-Balken', () => {
    const result = makeResult([
      { genre: 'Action', userPercentage: 40, friendPercentage: 40, match: 100 },
      { genre: 'Drama', userPercentage: 20, friendPercentage: 10, match: 80 },
    ]);
    render(<GenresTab result={result} userName="Alice" friendName="Bob" cardBg="#111" />);
    expect(screen.getByText('Genre-Vergleich')).toBeInTheDocument();
    expect(screen.getByText('2 Genres')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
    expect(screen.getByText('Drama')).toBeInTheDocument();
  });

  it('filtert Genres ohne Prozente heraus', () => {
    const result = makeResult([
      { genre: 'Leer', userPercentage: 0, friendPercentage: 0, match: 0 },
    ]);
    render(<GenresTab result={result} userName="Alice" friendName="Bob" cardBg="#111" />);
    expect(screen.getByText('0 Genres')).toBeInTheDocument();
    expect(screen.queryByText('Leer')).not.toBeInTheDocument();
  });
});
