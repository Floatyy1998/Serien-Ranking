// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { WatchJourneyData } from '../../services/watchJourneyService';

const timeline = vi.hoisted(() => ({
  result: {
    seriesStats: [] as unknown[],
    timelineSeries: [] as unknown[],
    totalEpisodes: 0,
    uniqueSeriesCount: 0,
    avgEpisodesPerSeries: 0,
  },
}));

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

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('../../hooks/useDeviceType', () => ({ useDeviceType: () => ({ isMobile: false }) }));

vi.mock('./serienTabHelpers', () => ({
  TMDB_IMAGE_BASE: 'https://img/',
  MONTH_NAMES: [
    'Januar',
    'Februar',
    'März',
    'April',
    'Mai',
    'Juni',
    'Juli',
    'August',
    'September',
    'Oktober',
    'November',
    'Dezember',
  ],
  formatDate: (d: string) => d,
  formatDateShort: (d: Date) => d.toISOString(),
  useSeriesPosters: () => ({}),
  useTimelineSeries: () => timeline.result,
}));

vi.mock('./SerienTabRanking', () => ({
  SerienTabRanking: () => <div>ranking-marker</div>,
}));

import { SerienTab } from './SerienTab';

const data = { seriesStats: [], year: 2024 } as unknown as WatchJourneyData;

afterEach(() => cleanup());

describe('SerienTab', () => {
  it('renders the empty state when there are no series', () => {
    timeline.result = {
      seriesStats: [],
      timelineSeries: [],
      totalEpisodes: 0,
      uniqueSeriesCount: 0,
      avgEpisodesPerSeries: 0,
    };
    render(<SerienTab data={data} />);
    expect(screen.getByText('Keine Serien-Daten')).toBeInTheDocument();
  });

  it('renders the series journey hero when data exists', () => {
    timeline.result = {
      seriesStats: [{ seriesId: 1, title: 'Lost', episodes: 20 }],
      timelineSeries: [
        {
          seriesId: 1,
          title: 'Lost',
          episodes: 20,
          totalHours: 15,
          effectiveStart: new Date('2024-01-01'),
          effectiveEnd: new Date('2024-02-01'),
          startPercent: 0,
          widthPercent: 50,
        },
      ],
      totalEpisodes: 20,
      uniqueSeriesCount: 1,
      avgEpisodesPerSeries: 20,
    };
    render(<SerienTab data={data} />);
    expect(screen.getByText('DEINE SERIEN-REISE')).toBeInTheDocument();
    expect(screen.getByText('ranking-marker')).toBeInTheDocument();
  });
});
