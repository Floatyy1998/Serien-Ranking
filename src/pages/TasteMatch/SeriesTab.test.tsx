// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SharedItem, TasteMatchResult } from '../../services/tasteMatchService';
import { SeriesTab } from './SeriesTab';

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));

function makeResult(sharedSeries: SharedItem[]): TasteMatchResult {
  return {
    overallMatch: 80,
    seriesOverlap: { score: 70, sharedSeries, userOnlyCount: 0, friendOnlyCount: 0 },
    movieOverlap: { score: 0, sharedMovies: [], userOnlyCount: 0, friendOnlyCount: 0 },
    genreMatch: { score: 0, sharedGenres: [], userTopGenres: [], friendTopGenres: [] },
    ratingMatch: { score: 0, averageDifference: 0, sameRatingCount: 0 },
    providerMatch: { score: 0, sharedProviders: [] },
  };
}

afterEach(() => cleanup());

describe('SeriesTab', () => {
  it('rendert die Anzahl gemeinsamer Serien und die Karten', () => {
    const result = makeResult([
      { id: 1, title: 'Serie Eins', ratingDiff: 0.5 },
      { id: 2, title: 'Serie Zwei', ratingDiff: 3 },
    ]);
    render(<SeriesTab result={result} cardBg="#111" />);
    expect(screen.getByText('2 gemeinsame Serien')).toBeInTheDocument();
    expect(screen.getByText('Serie Eins')).toBeInTheDocument();
    expect(screen.getByText('1 perfekte Matches')).toBeInTheDocument();
  });

  it('rendert den Empty-State ohne gemeinsame Serien', () => {
    render(<SeriesTab result={makeResult([])} cardBg="#111" />);
    expect(screen.getByText('Keine gemeinsamen Serien')).toBeInTheDocument();
  });
});
