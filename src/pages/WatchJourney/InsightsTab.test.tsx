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

import { InsightsTab } from './InsightsTab';

const data = {
  seriesStats: [
    {
      seriesId: 1,
      title: 'Breaking Bad',
      episodes: 30,
      minutes: 1500,
      avgRuntime: 47,
      rewatchEpisodes: 4,
      bingeEpisodes: 8,
      genres: ['Drama'],
      firstWatched: '2024-01-01',
      lastWatched: '2024-02-01',
    },
  ],
  bingeSessionCount: 3,
  bingeEpisodeCount: 12,
  avgBingeLength: 4,
  longestBinge: 6,
  rewatchCount: 4,
  rewatchMinutes: 200,
  rewatchPercentage: 10,
  avgEpisodeRuntime: 45,
  shortestEpisode: 20,
  longestEpisode: 90,
  totalEpisodes: 30,
  totalMinutes: 1500,
  uniqueSeriesCount: 1,
} as unknown as WatchJourneyData;

afterEach(() => cleanup());

describe('InsightsTab', () => {
  it('renders binge and rewatch stat sections', () => {
    render(<InsightsTab data={data} />);
    expect(screen.getByText('BINGE-STATISTIKEN')).toBeInTheDocument();
    expect(screen.getByText('REWATCH-STATISTIKEN')).toBeInTheDocument();
    expect(screen.getByText('3 Sessions')).toBeInTheDocument();
    expect(screen.getByText('4 Rewatches')).toBeInTheDocument();
  });

  it('renders the runtime distribution and personal records', () => {
    render(<InsightsTab data={data} />);
    expect(screen.getByText('Episodenlängen-Verteilung')).toBeInTheDocument();
    expect(screen.getByText('Deine Rekorde')).toBeInTheDocument();
    // top binged / rewatched lists reference the series title
    expect(screen.getAllByText('Breaking Bad').length).toBeGreaterThan(0);
  });
});
