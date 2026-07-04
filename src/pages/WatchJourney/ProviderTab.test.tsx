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
    BarChart: P,
    Bar: P,
    CartesianGrid: P,
    Tooltip: P,
    XAxis: P,
    YAxis: P,
  };
});

import { ProviderTab } from './ProviderTab';

const withProviders = {
  providerMonths: [{ month: 1, monthName: 'Jan', values: { Netflix: 180 }, total: 180 }],
  topProviders: ['Netflix'],
  providerColors: { Netflix: '#e50914' },
} as unknown as WatchJourneyData;

const empty = {
  providerMonths: [],
  topProviders: [],
  providerColors: {},
} as unknown as WatchJourneyData;

afterEach(() => cleanup());

describe('ProviderTab', () => {
  it('renders an empty state when there is no provider data', () => {
    render(<ProviderTab data={empty} />);
    expect(screen.getByText('Keine Provider-Daten')).toBeInTheDocument();
  });

  it('renders the top provider hero when data exists', () => {
    render(<ProviderTab data={withProviders} />);
    expect(screen.getByText('DEIN TOP STREAMING-DIENST')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Netflix' })).toBeInTheDocument();
  });
});
