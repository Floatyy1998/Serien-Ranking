// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { FormattedTime, StatsData } from './useStatsData';

const { theme } = vi.hoisted(() => ({
  theme: {
    primary: '#3355ff',
    text: { primary: '#ffffff', secondary: '#eeeeee', muted: '#888888' },
  },
}));
vi.mock('../../contexts/ThemeContextDef', () => ({ useTheme: () => ({ currentTheme: theme }) }));
vi.mock('../../components/ui', () => ({
  GradientText: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));
vi.mock('../../components/share/ShareCardFrame', () => ({
  ShareCardFrame: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('../../components/share/ShareCardSheet', () => ({
  ShareCardSheet: ({
    isOpen,
    renderCard,
  }: {
    isOpen: boolean;
    renderCard: () => React.ReactNode;
  }) => (isOpen ? <div data-testid="sheet">{renderCard()}</div> : null),
}));

import { StatsShareSheet } from './StatsShareCard';

const stats = {
  watchedEpisodes: 1200,
  totalSeries: 40,
  totalMovies: 12,
  topGenres: [{ name: 'Drama', count: 5 }],
  topProviders: [{ name: 'Netflix', count: 3 }],
} as unknown as StatsData;

const timeData: FormattedTime = { value: '42', unit: 'Tage', details: '', breakdown: [] };

afterEach(() => cleanup());

describe('StatsShareSheet', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <StatsShareSheet isOpen={false} onClose={vi.fn()} stats={stats} timeData={timeData} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the share card metrics when open', () => {
    render(<StatsShareSheet isOpen onClose={vi.fn()} stats={stats} timeData={timeData} />);
    expect(screen.getByText('1.200')).toBeInTheDocument();
    expect(screen.getByText('Episoden')).toBeInTheDocument();
  });

  it('renders the top genre and top provider rows when open', () => {
    render(<StatsShareSheet isOpen onClose={vi.fn()} stats={stats} timeData={timeData} />);
    expect(screen.getByText('Drama')).toBeInTheDocument();
    expect(screen.getByText('Netflix')).toBeInTheDocument();
  });
});
