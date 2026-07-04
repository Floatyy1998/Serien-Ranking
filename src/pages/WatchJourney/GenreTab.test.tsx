// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { WatchJourneyData } from '../../services/watchJourneyService';

vi.mock('../../contexts/ThemeContextDef', () => ({
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

vi.mock('recharts', () => {
  const P = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  return {
    ResponsiveContainer: P,
    AreaChart: P,
    Area: P,
    PieChart: P,
    Pie: P,
    CartesianGrid: P,
    Tooltip: P,
    XAxis: P,
    YAxis: P,
  };
});

import { GenreTab } from './GenreTab';

const withGenres = {
  genreMonths: [{ month: 1, monthName: 'Jan', values: { Drama: 120 }, total: 120 }],
  topGenres: ['Drama'],
  genreColors: { Drama: '#42a5f5' },
} as unknown as WatchJourneyData;

const empty = { genreMonths: [], topGenres: [], genreColors: {} } as unknown as WatchJourneyData;

afterEach(() => cleanup());

describe('GenreTab', () => {
  it('renders an empty state when there are no genres', () => {
    render(<GenreTab data={empty} />);
    expect(screen.getByText('Keine Genre-Daten')).toBeInTheDocument();
  });

  it('renders the top genre hero when data exists', () => {
    render(<GenreTab data={withGenres} />);
    expect(screen.getByText('DEIN TOP GENRE')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Drama' })).toBeInTheDocument();
    expect(screen.getByText('Genre-Verteilung')).toBeInTheDocument();
  });
});
