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
    Tooltip: P,
    XAxis: P,
    YAxis: P,
  };
});

import { HeatmapTab } from './HeatmapTab';

const data = {
  heatmap: [
    { hour: 22, dayOfWeek: 6, count: 5, minutes: 100 },
    { hour: 20, dayOfWeek: 1, count: 3, minutes: 60 },
  ],
  peakHour: 22,
  peakDay: 6,
} as unknown as WatchJourneyData;

afterEach(() => cleanup());

describe('HeatmapTab', () => {
  it('renders the prime-time hero with the peak hour', () => {
    render(<HeatmapTab data={data} width={400} />);
    expect(screen.getByText('DEINE PRIME TIME')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '22:00' })).toBeInTheDocument();
    expect(screen.getByText('Sa ist dein aktivster Tag')).toBeInTheDocument();
  });

  it('shows the night-owl badge when the peak hour is late', () => {
    render(<HeatmapTab data={data} width={400} />);
    expect(screen.getByText(/Nachteule/)).toBeInTheDocument();
    expect(screen.getByText('Uhrzeitverteilung')).toBeInTheDocument();
  });
});
