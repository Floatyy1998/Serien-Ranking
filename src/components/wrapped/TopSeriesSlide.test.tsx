// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { TopSeriesSlide } from './TopSeriesSlide';
import type { TopSeriesEntry } from '../../types/Wrapped';

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#00d123',
      accent: '#8b5cf6',
      text: { primary: '#fff', secondary: '#eee', muted: '#999' },
      background: { default: '#000', surface: '#111' },
    },
  }),
}));

afterEach(() => cleanup());

const series = (
  id: number,
  title: string,
  extra: Partial<TopSeriesEntry> = {}
): TopSeriesEntry => ({
  id,
  title,
  episodesWatched: 24,
  minutesWatched: 720,
  ...extra,
});

describe('TopSeriesSlide', () => {
  it('shows the empty state without series', () => {
    render(<TopSeriesSlide topSeries={[]} />);
    expect(screen.getByText('Keine Serien dieses Jahr')).toBeInTheDocument();
  });

  it('renders the #1 series with its episode count', () => {
    render(<TopSeriesSlide topSeries={[series(1, 'Breaking Bad', { episodesWatched: 62 })]} />);
    expect(screen.getByText('Deine #1 Serie')).toBeInTheDocument();
    expect(screen.getByText('Breaking Bad')).toBeInTheDocument();
    expect(screen.getByText('62')).toBeInTheDocument();
  });

  it('renders the runner-up series', () => {
    render(<TopSeriesSlide topSeries={[series(1, 'Alpha'), series(2, 'Beta')]} />);
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });
});
