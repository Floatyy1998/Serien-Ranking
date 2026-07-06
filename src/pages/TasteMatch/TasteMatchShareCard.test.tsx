// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { TasteMatchResult } from '../../services/tasteMatchService';
import { TasteMatchShareSheet } from './TasteMatchShareCard';

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#00d123',
      accent: '#8b5cf6',
      text: { primary: '#fff', secondary: '#eee', muted: '#999' },
      background: { default: '#000', surface: '#111' },
    },
  }),
}));

vi.mock('./useTasteMatchData', () => ({
  useTasteMatchData: () => ({}),
  getScoreMessage: (score: number) => (score >= 80 ? 'Seelenverwandte!' : 'Andere'),
}));

// ShareCardSheet ist eine BottomSheet-Hülle — wir rendern nur die Karte selbst.
vi.mock('../../components/share/ShareCardSheet', () => ({
  ShareCardSheet: ({
    isOpen,
    renderCard,
  }: {
    isOpen: boolean;
    renderCard: (showImages: boolean) => ReactNode;
  }) => (isOpen ? <div>{renderCard(false)}</div> : null),
}));

function makeResult(): TasteMatchResult {
  return {
    overallMatch: 85,
    seriesOverlap: {
      score: 0,
      sharedSeries: [{ id: 1, title: 'Serie Eins' }],
      userOnlyCount: 0,
      friendOnlyCount: 0,
    },
    movieOverlap: { score: 0, sharedMovies: [], userOnlyCount: 0, friendOnlyCount: 0 },
    genreMatch: {
      score: 0,
      sharedGenres: [{ genre: 'Action', userPercentage: 30, friendPercentage: 20, match: 90 }],
      userTopGenres: [],
      friendTopGenres: [],
    },
    ratingMatch: { score: 0, averageDifference: 0, sameRatingCount: 0 },
    providerMatch: { score: 0, sharedProviders: [] },
  };
}

afterEach(() => cleanup());

describe('TasteMatchShareSheet', () => {
  it('rendert die Karte mit Namen, Score und Genres wenn offen', () => {
    render(
      <TasteMatchShareSheet
        isOpen
        onClose={vi.fn()}
        result={makeResult()}
        userName="Alice"
        userPhoto={null}
        friendName="Bob"
        friendPhoto={null}
      />
    );
    expect(screen.getByText('Taste Match')).toBeInTheDocument();
    expect(screen.getByText('Alice × Bob')).toBeInTheDocument();
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
    expect(screen.getByText('Serie Eins')).toBeInTheDocument();
  });

  it('rendert nichts wenn geschlossen', () => {
    render(
      <TasteMatchShareSheet
        isOpen={false}
        onClose={vi.fn()}
        result={makeResult()}
        userName="Alice"
        userPhoto={null}
        friendName="Bob"
        friendPhoto={null}
      />
    );
    expect(screen.queryByText('Taste Match')).not.toBeInTheDocument();
  });
});
