// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';

// Stabile Identitäten sind Pflicht: ein pro Render frisches user-Objekt lässt
// die Effect-Dependency permanent wechseln → endlose Transition-Render-Schleife.
const { authValue, seriesValue, movieValue } = vi.hoisted(() => ({
  authValue: { user: { uid: 'u1' } },
  seriesValue: { seriesList: [] as unknown[] },
  movieValue: { movieList: [] as unknown[] },
}));

vi.mock('firebase/compat/database', () => ({}));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => authValue }));
vi.mock('../../contexts/SeriesListContext', () => ({ useSeriesList: () => seriesValue }));
vi.mock('../../contexts/MovieListContext', () => ({ useMovieList: () => movieValue }));
vi.mock('../../lib/rating/rating', () => ({ calculateOverallRating: () => '8.00' }));
vi.mock('../../config/menuItems', () => ({ isSupportedProvider: () => true }));

import { StatsProvider } from './StatsProvider';
import { useStats } from './StatsContext';

const Consumer = () => {
  const { seriesStatsData } = useStats();
  return (
    <div data-testid="ep">
      {seriesStatsData ? seriesStatsData.userStats.episodesWatched : 'none'}
    </div>
  );
};

afterEach(() => {
  cleanup();
  seriesValue.seriesList = [];
  movieValue.movieList = [];
});

describe('StatsProvider', () => {
  it('renders its children', () => {
    render(
      <StatsProvider>
        <div>CHILD</div>
      </StatsProvider>
    );
    expect(screen.getByText('CHILD')).toBeInTheDocument();
  });

  it('computes watched episodes from the series list and exposes them via context', async () => {
    seriesValue.seriesList = [
      {
        episodeRuntime: 20,
        rating: { u1: 8 },
        genre: { genres: ['Drama'] },
        provider: { provider: [{ name: 'Netflix' }] },
        seasons: [{ episodes: [{ watched: true, watchCount: 2, runtime: 20 }] }],
      },
    ];
    render(
      <StatsProvider>
        <Consumer />
      </StatsProvider>
    );
    await waitFor(() => expect(screen.getByTestId('ep').textContent).toBe('2'));
  });
});
