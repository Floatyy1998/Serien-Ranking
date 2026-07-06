// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

const navigate = vi.hoisted(() => vi.fn<(path: string) => void>());

vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#00d123',
      accent: '#00ff88',
      text: { primary: '#fff', secondary: '#ccc', muted: '#999' },
      background: { surface: '#111', default: '#000' },
      border: { default: '#333' },
    },
  }),
}));

import { SerienTabRanking } from './SerienTabRanking';

const seriesStats = [
  {
    seriesId: 42,
    title: 'The Wire',
    episodes: 60,
    minutes: 3000,
    firstWatched: '2024-01-01',
    lastWatched: '2024-03-01',
    avgRuntime: 50,
    rewatchEpisodes: 2,
  },
];

beforeEach(() => navigate.mockReset());
afterEach(() => cleanup());

describe('SerienTabRanking', () => {
  it('renders the ranking heading and series title', () => {
    render(<SerienTabRanking seriesStats={seriesStats} posters={{}} formatDate={(d) => d} />);
    expect(screen.getByText('Top 10 Serien')).toBeInTheDocument();
    expect(screen.getByText('The Wire')).toBeInTheDocument();
  });

  it('navigates to the series detail on click', () => {
    render(<SerienTabRanking seriesStats={seriesStats} posters={{}} formatDate={(d) => d} />);
    fireEvent.click(screen.getByText('The Wire'));
    expect(navigate).toHaveBeenCalledWith('/series/42');
  });
});
