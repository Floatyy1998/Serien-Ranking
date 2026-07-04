// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { TasteMatchResult } from '../../services/tasteMatchService';
import { OverviewTab } from './OverviewTab';

function makeResult(overrides: Partial<TasteMatchResult> = {}): TasteMatchResult {
  return {
    overallMatch: 80,
    seriesOverlap: {
      score: 70,
      sharedSeries: [{ id: 1, title: 'S1' }],
      userOnlyCount: 0,
      friendOnlyCount: 0,
    },
    movieOverlap: { score: 60, sharedMovies: [], userOnlyCount: 0, friendOnlyCount: 0 },
    genreMatch: {
      score: 50,
      sharedGenres: [{ genre: 'Action', userPercentage: 30, friendPercentage: 20, match: 90 }],
      userTopGenres: [],
      friendTopGenres: [],
    },
    ratingMatch: { score: 90, averageDifference: 0.5, sameRatingCount: 3 },
    providerMatch: { score: 50, sharedProviders: ['Netflix'] },
    ...overrides,
  };
}

afterEach(() => cleanup());

describe('OverviewTab', () => {
  it('rendert die Quick-Stat-Labels', () => {
    render(<OverviewTab result={makeResult()} cardBg="#111" />);
    expect(screen.getByText('Gemeinsame Serien')).toBeInTheDocument();
    expect(screen.getByText('Gemeinsame Filme')).toBeInTheDocument();
    expect(screen.getByText('Gleiche Bewertungen')).toBeInTheDocument();
  });

  it('rendert die Provider-Karte mit gemeinsamen Diensten', () => {
    render(<OverviewTab result={makeResult()} cardBg="#111" />);
    expect(screen.getByText('Gemeinsame Streaming-Dienste')).toBeInTheDocument();
    expect(screen.getByText('Netflix')).toBeInTheDocument();
  });

  it('blendet die Provider-Karte aus wenn keine geteilt werden', () => {
    const result = makeResult({ providerMatch: { score: 0, sharedProviders: [] } });
    render(<OverviewTab result={result} cardBg="#111" />);
    expect(screen.queryByText('Gemeinsame Streaming-Dienste')).not.toBeInTheDocument();
  });
});
