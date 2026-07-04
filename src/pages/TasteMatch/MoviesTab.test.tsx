// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SharedItem, TasteMatchResult } from '../../services/tasteMatchService';
import { MoviesTab } from './MoviesTab';

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));

function makeResult(sharedMovies: SharedItem[]): TasteMatchResult {
  return {
    overallMatch: 80,
    seriesOverlap: { score: 0, sharedSeries: [], userOnlyCount: 0, friendOnlyCount: 0 },
    movieOverlap: { score: 60, sharedMovies, userOnlyCount: 0, friendOnlyCount: 0 },
    genreMatch: { score: 0, sharedGenres: [], userTopGenres: [], friendTopGenres: [] },
    ratingMatch: { score: 0, averageDifference: 0, sameRatingCount: 0 },
    providerMatch: { score: 0, sharedProviders: [] },
  };
}

afterEach(() => cleanup());

describe('MoviesTab', () => {
  it('rendert die Anzahl gemeinsamer Filme und die Karten', () => {
    const result = makeResult([{ id: 5, title: 'Inception', ratingDiff: 0.5 }]);
    render(<MoviesTab result={result} cardBg="#111" />);
    expect(screen.getByText('1 gemeinsame Filme')).toBeInTheDocument();
    expect(screen.getByText('Inception')).toBeInTheDocument();
  });

  it('rendert den Empty-State ohne gemeinsame Filme', () => {
    render(<MoviesTab result={makeResult([])} cardBg="#111" />);
    expect(screen.getByText('Keine gemeinsamen Filme')).toBeInTheDocument();
  });
});
