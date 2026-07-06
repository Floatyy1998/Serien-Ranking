// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TasteMatchResult } from '../../services/tasteMatchService';
import type { TasteMatchData } from './useTasteMatchData';
import { TasteMatchPage } from './TasteMatchPage';

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#00d123',
      accent: '#8b5cf6',
      text: { primary: '#fff', secondary: '#eee', muted: '#999' },
      background: { default: '#000', surface: '#111', card: '#222' },
      border: { default: '#333' },
      status: { error: '#f00' },
    },
  }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/taste-match/f1' }),
}));

vi.mock('./ScoreHeader', () => ({ ScoreHeader: () => <div data-testid="score-header" /> }));
vi.mock('./StatRing', () => ({ StatRing: () => <div data-testid="stat-ring" /> }));
vi.mock('./OverviewTab', () => ({ OverviewTab: () => <div data-testid="overview-tab" /> }));
vi.mock('./SeriesTab', () => ({ SeriesTab: () => <div data-testid="series-tab" /> }));
vi.mock('./MoviesTab', () => ({ MoviesTab: () => <div data-testid="movies-tab" /> }));
vi.mock('./GenresTab', () => ({ GenresTab: () => <div data-testid="genres-tab" /> }));
vi.mock('./TasteMatchShareCard', () => ({
  TasteMatchShareSheet: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="share-sheet" /> : null,
}));

function makeResult(): TasteMatchResult {
  return {
    overallMatch: 85,
    seriesOverlap: {
      score: 70,
      sharedSeries: [{ id: 1, title: 'S1' }],
      userOnlyCount: 0,
      friendOnlyCount: 0,
    },
    movieOverlap: { score: 60, sharedMovies: [], userOnlyCount: 0, friendOnlyCount: 0 },
    genreMatch: { score: 50, sharedGenres: [], userTopGenres: [], friendTopGenres: [] },
    ratingMatch: { score: 90, averageDifference: 0.5, sameRatingCount: 3 },
    providerMatch: { score: 50, sharedProviders: [] },
  };
}

const data = vi.hoisted(() => ({
  value: {} as TasteMatchData,
}));
vi.mock('./useTasteMatchData', () => ({
  useTasteMatchData: () => data.value,
}));

function baseData(overrides: Partial<TasteMatchData> = {}): TasteMatchData {
  return {
    loading: false,
    result: makeResult(),
    friendName: 'Bob',
    friendPhoto: null,
    userName: 'Alice',
    userPhoto: null,
    activeTab: 'overview',
    setActiveTab: vi.fn(),
    handleShare: vi.fn<() => Promise<void>>(() => Promise.resolve()),
    ...overrides,
  };
}

beforeEach(() => {
  data.value = baseData();
});
afterEach(() => cleanup());

describe('TasteMatchPage', () => {
  it('rendert den Loading-State', () => {
    data.value = baseData({ loading: true, result: null });
    render(<TasteMatchPage />);
    expect(screen.getByText('Berechne Match...')).toBeInTheDocument();
  });

  it('rendert nichts wenn kein Ergebnis vorliegt', () => {
    data.value = baseData({ loading: false, result: null });
    const { container } = render(<TasteMatchPage />);
    expect(container.firstChild).toBeNull();
  });

  it('rendert Header und Overview-Tab mit Ergebnis', () => {
    render(<TasteMatchPage />);
    expect(screen.getByText('Taste Match')).toBeInTheDocument();
    expect(screen.getByTestId('score-header')).toBeInTheDocument();
    expect(screen.getByTestId('overview-tab')).toBeInTheDocument();
  });

  it('öffnet das Share-Sheet beim Klick auf den Bild-Teilen-Button', () => {
    render(<TasteMatchPage />);
    expect(screen.queryByTestId('share-sheet')).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Taste Match als Bild teilen'));
    expect(screen.getByTestId('share-sheet')).toBeInTheDocument();
  });
});
