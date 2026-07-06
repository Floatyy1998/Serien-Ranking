// @vitest-environment jsdom
import type React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import { StatsGrid } from './StatsGrid';

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

vi.mock('react-router-dom', () => ({ useNavigate: () => navigateMock }));

vi.mock('../../contexts/ThemeContext', () => {
  const make = (): unknown =>
    new Proxy(() => '#3355ff', {
      get: (_t, p) =>
        p === Symbol.toPrimitive || p === 'toString' || p === 'valueOf' ? () => '#3355ff' : make(),
    });
  return { useTheme: () => ({ currentTheme: make() }) };
});

type SectionHeaderProps = { title: string; action?: React.ReactNode };
vi.mock('../../components/ui', () => ({
  SectionHeader: (p: SectionHeaderProps) => (
    <div>
      <span>{p.title}</span>
      {p.action}
    </div>
  ),
}));

vi.mock('./useHomeStats', () => ({
  useHomeStats: () => ({
    totalSeries: 10,
    totalMovies: 5,
    watchedMovies: 3,
    completedSeries: 2,
    totalEpisodes: 100,
    watchedEpisodes: 50,
    timeString: '10h',
    lastWeekWatched: 4,
    seriesTimeString: '8h',
    movieTimeString: '2h',
    avgSeriesRating: '8.5',
    avgMovieRating: '7.0',
    topGenre: 'Drama',
    topProvider: 'Netflix',
  }),
}));

afterEach(cleanup);

function renderGrid() {
  return render(
    <ThemeProvider theme={createTheme()}>
      <StatsGrid />
    </ThemeProvider>
  );
}

describe('StatsGrid', () => {
  it('renders the header and progress percentage (smoke)', () => {
    renderGrid();
    expect(screen.getByText('Deine Statistiken')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('renders the primary stat tiles', () => {
    renderGrid();
    expect(screen.getByText('Serien')).toBeInTheDocument();
    expect(screen.getByText('Filme')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('navigates to ratings when the Serien tile is clicked', () => {
    renderGrid();
    fireEvent.click(screen.getByText('Serien'));
    expect(navigateMock).toHaveBeenCalledWith('/ratings');
  });
});
