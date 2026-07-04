// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { TasteMatchResult } from '../../services/tasteMatchService';
import { ScoreHeader } from './ScoreHeader';

vi.mock('../../contexts/ThemeContextDef', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#00d123',
      accent: '#8b5cf6',
      text: { primary: '#fff', secondary: '#eee', muted: '#999' },
      background: { default: '#000', surface: '#111' },
    },
  }),
}));

// useTasteMatchData zieht firebase-compat rein — hier nur die reinen Helfer.
vi.mock('./useTasteMatchData', () => ({
  useTasteMatchData: () => ({}),
  getScoreColor: () => '#00cec9',
  getScoreMessage: (score: number) => (score >= 80 ? 'Seelenverwandte!' : 'Andere'),
}));

function makeResult(overrides: Partial<TasteMatchResult> = {}): TasteMatchResult {
  return {
    overallMatch: 85,
    seriesOverlap: { score: 0, sharedSeries: [], userOnlyCount: 0, friendOnlyCount: 0 },
    movieOverlap: { score: 0, sharedMovies: [], userOnlyCount: 0, friendOnlyCount: 0 },
    genreMatch: { score: 0, sharedGenres: [], userTopGenres: [], friendTopGenres: [] },
    ratingMatch: { score: 0, averageDifference: 0, sameRatingCount: 0 },
    providerMatch: { score: 0, sharedProviders: [] },
    ...overrides,
  };
}

afterEach(() => cleanup());

describe('ScoreHeader', () => {
  it('rendert beide Namen und die Score-Nachricht', () => {
    render(
      <ScoreHeader
        result={makeResult()}
        userName="Alice"
        userPhoto={null}
        friendName="Bob"
        friendPhoto={null}
      />
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Seelenverwandte!')).toBeInTheDocument();
  });

  it('zeigt die Initiale wenn kein Foto vorhanden ist', () => {
    render(
      <ScoreHeader
        result={makeResult()}
        userName="Alice"
        userPhoto={null}
        friendName="Bob"
        friendPhoto={null}
      />
    );
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });
});
