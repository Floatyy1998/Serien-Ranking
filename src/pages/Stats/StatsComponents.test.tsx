// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { FormattedTime, StatsData } from './useStatsData';

vi.mock('framer-motion', async () => {
  const React = await import('react');
  const skip = new Set(['initial', 'animate', 'exit', 'transition', 'whileTap']);
  const make = (tag: string) =>
    React.forwardRef(function Motion(props: Record<string, unknown>, ref: unknown) {
      const clean: Record<string, unknown> = { ref };
      for (const k in props) if (!skip.has(k)) clean[k] = props[k];
      return React.createElement(tag, clean);
    });
  const motion = new Proxy({} as Record<string, unknown>, { get: (_t, tag) => make(String(tag)) });
  return { motion };
});

vi.mock('@mui/icons-material', () => ({
  AutoAwesome: () => null,
  EmojiEvents: () => null,
  Movie: () => null,
  Timer: () => null,
  Tv: () => null,
  Category: () => null,
  LocalFireDepartment: () => null,
  Star: () => null,
  Stream: () => null,
}));

vi.mock('../../components/ui', () => ({
  GradientText: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

vi.mock('./useStatsData', () => ({
  formatTimeDetailed: (m: number) => `${m} Min`,
}));

import {
  ActorUniverseBanner,
  AnimatedRing,
  HeroSection,
  TimeBreakdownSection,
} from './StatsComponents';

const theme = {
  primary: '#3355ff',
  accent: '#22d3ee',
  background: { default: '#000000', surface: '#111111' },
  text: { primary: '#ffffff', secondary: '#eeeeee', muted: '#888888' },
  border: { default: '#333333' },
  status: { success: '#4cd137', error: '#e74c3c', warning: '#f5a623' },
};

const stats = {
  progress: 60,
  watchedEpisodes: 1200,
  totalEpisodes: 2000,
  totalSeries: 40,
  totalMovies: 12,
  completedSeries: 8,
} as unknown as StatsData;

const timeData: FormattedTime = {
  value: '42',
  unit: 'Tage',
  details: '3 Std',
  breakdown: [],
};

afterEach(() => cleanup());

describe('StatsComponents', () => {
  it('renders an svg for AnimatedRing', () => {
    const { container } = render(
      <AnimatedRing progress={60} size={90} strokeWidth={8} color="#3355ff" />
    );
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('renders the hero time value and episode counts', () => {
    render(<HeroSection stats={stats} timeData={timeData} theme={theme} />);
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Gesamte Watchtime')).toBeInTheDocument();
    expect(screen.getByText('1.200')).toBeInTheDocument();
  });

  it('fires onNavigate when the Actor Universe banner is clicked', () => {
    const onNavigate = vi.fn();
    render(<ActorUniverseBanner theme={theme} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByText('Actor Universe'));
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it('renders the time breakdown with formatted durations', () => {
    render(<TimeBreakdownSection seriesMinutes={120} movieMinutes={45} theme={theme} />);
    expect(screen.getByText('Zeit-Aufteilung')).toBeInTheDocument();
    expect(screen.getByText('120 Min')).toBeInTheDocument();
    expect(screen.getByText('45 Min')).toBeInTheDocument();
  });
});
