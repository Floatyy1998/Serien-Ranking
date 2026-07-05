// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { MultiYearTrendsData } from '../../services/watchJourneyService';

vi.mock('../../contexts/ThemeContextDef', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#00d123',
      accent: '#00ff88',
      text: { primary: '#fff', secondary: '#ccc', muted: '#999' },
      background: { surface: '#111', default: '#000' },
      border: { default: '#333' },
      status: { success: '#00b894', error: '#e17055' },
    },
  }),
}));

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));

vi.mock('recharts', () => {
  const P = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  return {
    ResponsiveContainer: P,
    AreaChart: P,
    Area: P,
    BarChart: P,
    Bar: P,
    CartesianGrid: P,
    Legend: P,
    Tooltip: P,
    XAxis: P,
    YAxis: P,
  };
});

import { TrendsTab } from './TrendsTab';

const singleYear = {
  years: [2024],
  yearlyData: [
    {
      year: 2024,
      episodes: 120,
      movies: 15,
      totalMinutes: 5400,
      totalHours: 90,
      topGenre: 'Drama',
      topProvider: 'Netflix',
      genreDistribution: { Drama: 60 },
      providerDistribution: { Netflix: 90 },
    },
  ],
  allTimeTopGenres: [{ genre: 'Drama', hours: 60, color: '#42a5f5' }],
  allTimeTopProviders: [{ provider: 'Netflix', hours: 90, color: '#e50914' }],
  episodesTrend: 'up',
  hoursTrend: 'up',
  totalEpisodes: 120,
  totalMovies: 15,
  totalHours: 90,
} as unknown as MultiYearTrendsData;

const emptyData = {
  years: [],
  yearlyData: [],
  allTimeTopGenres: [],
  allTimeTopProviders: [],
  episodesTrend: 'stable',
  hoursTrend: 'stable',
  totalEpisodes: 0,
  totalMovies: 0,
  totalHours: 0,
} as unknown as MultiYearTrendsData;

afterEach(() => cleanup());

describe('TrendsTab', () => {
  it('renders an empty state when there is no yearly data', () => {
    render(<TrendsTab data={emptyData} />);
    expect(screen.getByText('Keine Trend-Daten')).toBeInTheDocument();
  });

  it('renders the single-year overview', () => {
    render(<TrendsTab data={singleYear} />);
    expect(screen.getByText('JAHRESÜBERSICHT 2024')).toBeInTheDocument();
    expect(screen.getByText('Dein Jahr in Zahlen')).toBeInTheDocument();
    // Year-by-year cards (child component) rendered too
    expect(screen.getByText('Jahr für Jahr')).toBeInTheDocument();
  });
});
