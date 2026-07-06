// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Movie } from '../../types/Movie';

const { mdState, navigateMock } = vi.hoisted(() => {
  const navigateMock = vi.fn();
  return {
    navigateMock,
    mdState: {
      id: '5',
      navigate: navigateMock,
      movie: { id: 5, title: 'Dune' } as unknown as Movie,
      isReadOnlyTmdbMovie: false,
      loading: false,
      tmdbBackdrop: null,
      tmdbRating: null,
      imdbRating: null,
      tmdbOverview: null,
      providers: null,
      isWatched: false,
      averageRating: 8,
      activeTab: 'info' as 'info' | 'cast',
      setActiveTab: vi.fn(),
      isMobile: false,
      showDeleteConfirm: false,
      setShowDeleteConfirm: vi.fn(),
      isAdding: false,
      dialog: { open: false, message: '', type: 'info' as const },
      setDialog: vi.fn(),
      snackbar: { open: false, message: '' },
      handleAddMovie: vi.fn(),
      handleDeleteMovie: vi.fn(),
      getBackdropUrl: (p: string | undefined) => p ?? '',
      formatRuntime: (m: number) => `${m}`,
    },
  };
});

vi.mock('./useMovieData', () => ({ useMovieData: () => mdState }));
vi.mock('./MovieHeroSection', () => ({ MovieHeroSection: () => <div data-testid="hero" /> }));
vi.mock('./MovieActionButtons', () => ({
  MovieActionButtons: () => <div data-testid="actions" />,
}));
vi.mock('./MovieInfoTab', () => ({ MovieInfoTab: () => <div data-testid="info-tab" /> }));
vi.mock('../../components/ui', () => ({ Dialog: () => null }));
vi.mock('../../components/Discussion', () => ({
  DiscussionThread: () => <div data-testid="discussion" />,
}));
vi.mock('../../components/detail', () => ({
  CastCrew: () => <div data-testid="cast" />,
  RecommendationsSection: () => <div data-testid="recs" />,
}));
vi.mock('@mui/icons-material/Info', () => ({ default: () => null }));
vi.mock('@mui/icons-material/People', () => ({ default: () => null }));
vi.mock('@mui/icons-material/Star', () => ({ default: () => null }));
vi.mock('../../contexts/ThemeContext', () => {
  const make = (): unknown =>
    new Proxy(() => '#3355ff', {
      get: (_t, prop) => {
        if (prop === Symbol.toPrimitive || prop === 'toString' || prop === 'valueOf')
          return () => '#3355ff';
        return make();
      },
    });
  return { useTheme: () => ({ currentTheme: make() }) };
});

import { MovieDetailPage } from './MovieDetailPage';

beforeEach(() => {
  mdState.movie = { id: 5, title: 'Dune' } as unknown as Movie;
  mdState.loading = false;
  mdState.activeTab = 'info';
  mdState.setActiveTab.mockReset();
  navigateMock.mockReset();
});
afterEach(() => cleanup());

describe('MovieDetailPage', () => {
  it('renders the hero, actions and info tab for a loaded movie', () => {
    render(<MovieDetailPage />);
    expect(screen.getByTestId('hero')).toBeInTheDocument();
    expect(screen.getByTestId('actions')).toBeInTheDocument();
    expect(screen.getByTestId('info-tab')).toBeInTheDocument();
  });

  it('switches to the cast tab when the Besetzung tab is clicked', () => {
    render(<MovieDetailPage />);
    fireEvent.click(screen.getByText('Besetzung'));
    expect(mdState.setActiveTab).toHaveBeenCalledWith('cast');
  });

  it('shows the not-found state when there is no movie', () => {
    mdState.movie = null as unknown as Movie;
    mdState.loading = false;
    render(<MovieDetailPage />);
    expect(screen.getByText('Film nicht gefunden')).toBeInTheDocument();
  });

  it('shows the loading state', () => {
    mdState.movie = null as unknown as Movie;
    mdState.loading = true;
    render(<MovieDetailPage />);
    expect(screen.getByText('Lade...')).toBeInTheDocument();
  });
});
