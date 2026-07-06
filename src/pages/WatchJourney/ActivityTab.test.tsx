// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { WatchJourneyData } from '../../services/watchJourneyService';

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

vi.mock('recharts', () => {
  const P = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  return {
    ResponsiveContainer: P,
    BarChart: P,
    Bar: P,
    CartesianGrid: P,
    Legend: P,
    Tooltip: P,
    XAxis: P,
    YAxis: P,
  };
});

import { ActivityTab } from './ActivityTab';

const data = {
  activity: [
    { month: 1, monthName: 'Jan', episodes: 10, movies: 2, totalMinutes: 500 },
    { month: 2, monthName: 'Feb', episodes: 30, movies: 5, totalMinutes: 900 },
  ],
  totalEpisodes: 40,
  totalMovies: 7,
  totalMinutes: 1400,
} as unknown as WatchJourneyData;

afterEach(() => cleanup());

describe('ActivityTab', () => {
  it('renders the yearly hero stats', () => {
    render(<ActivityTab data={data} />);
    expect(screen.getByText('DEIN JAHR IN ZAHLEN')).toBeInTheDocument();
    expect(screen.getByText('40')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('highlights the best month in the fun facts', () => {
    render(<ActivityTab data={data} />);
    expect(screen.getByText('Bester Monat: Feb')).toBeInTheDocument();
    expect(screen.getByText('Monatliche Aktivität')).toBeInTheDocument();
  });
});
