// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Series } from '../../types/Series';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  block: vi.fn(async () => {}),
  fetchBlocked: vi.fn(async () => new Set<number>()),
  tmdbFetch: vi.fn(async () => ({ results: [] })),
  seriesList: [] as Series[],
}));

vi.mock('react-router-dom', () => ({ useNavigate: () => mocks.navigate }));
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'u1' } }),
}));
vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#ef6f8a',
      accent: '#f2a648',
      text: { primary: '#fff', secondary: '#aaa' },
    },
  }),
}));
vi.mock('../../contexts/SeriesListContext', () => ({
  useSeriesList: () => ({ seriesList: mocks.seriesList }),
}));
vi.mock('../../contexts/MovieListContext', () => ({
  useMovieList: () => ({ movieList: [] }),
}));
vi.mock('../../services/recFeedbackService', () => ({
  blockRecommendation: mocks.block,
  fetchBlockedRecommendations: mocks.fetchBlocked,
}));
vi.mock('../ui/BottomSheet', () => ({
  BottomSheet: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
    isOpen ? <div>{children}</div> : null,
}));
vi.mock('../../services/tmdbClient', () => ({
  tmdbFetch: mocks.tmdbFetch,
}));
vi.mock('../../services/region', () => ({ watchRegion: 'DE' }));
vi.mock('../../hooks/useActiveSubscriptions', () => ({
  useActiveSubscriptions: () => ({
    activeProviders: new Set<string>(),
    hasAnySubscription: false,
    isOnActiveSub: () => false,
    seriesOverrides: {},
    getSeriesOverride: () => null,
    loading: false,
  }),
}));
vi.mock('../../pages/Discover/watchProviderFilter', () => ({
  filterItemsByActiveProviders: async <T,>(items: T[]) => items,
}));

import { TonightSheet } from './TonightSheet';

const series = {
  id: 7,
  title: 'Testserie',
  poster: { poster: '/x.jpg' },
  genre: { genres: ['Drama'] },
  seasons: [
    {
      seasonNumber: 0,
      episodes: [
        {
          id: 701,
          episode_number: 1,
          name: 'Eins',
          air_date: '2020-01-01',
          watched: true,
          runtime: 40,
        },
        {
          id: 702,
          episode_number: 2,
          name: 'Zwei',
          air_date: '2020-01-08',
          watched: false,
          runtime: 40,
        },
      ],
    },
  ],
} as unknown as Series;

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorage.clear();
  mocks.seriesList = [];
});

describe('TonightSheet', () => {
  it('zeigt den besten Vorschlag mit Folge und Begründung', async () => {
    mocks.seriesList = [series];
    render(<TonightSheet isOpen onClose={vi.fn()} />);
    await waitFor(() => expect(screen.getByText('Testserie')).toBeInTheDocument());
    expect(screen.getByText(/S1E2/)).toBeInTheDocument();
  });

  it('navigiert bei „Los geht’s" zur Serie', async () => {
    mocks.seriesList = [series];
    const onClose = vi.fn();
    render(<TonightSheet isOpen onClose={onClose} />);
    await waitFor(() => screen.getByText('Testserie'));
    fireEvent.click(screen.getByText('Los geht’s'));
    expect(mocks.navigate).toHaveBeenCalledWith('/series/7');
    expect(onClose).toHaveBeenCalled();
  });

  it('blockt bei „Nicht mein Ding" und entfernt den Titel', async () => {
    mocks.seriesList = [series];
    render(<TonightSheet isOpen onClose={vi.fn()} />);
    await waitFor(() => screen.getByText('Testserie'));
    fireEvent.click(screen.getByRole('button', { name: 'Nicht mein Ding' }));
    expect(mocks.block).toHaveBeenCalledWith('u1', 7, 'series');
    await waitFor(() => expect(screen.queryByText('Testserie')).not.toBeInTheDocument());
  });

  it('zeigt den Leer-Hinweis, wenn nichts passt', async () => {
    render(<TonightSheet isOpen onClose={vi.fn()} />);
    await waitFor(() =>
      expect(screen.getByText(/Nichts passt zu den Filtern/)).toBeInTheDocument()
    );
  });
});
