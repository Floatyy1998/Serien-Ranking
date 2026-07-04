// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MonthlyBreakdownSlide } from './MonthlyBreakdownSlide';
import type { MonthStats } from '../../types/Wrapped';

vi.mock('../../contexts/ThemeContextDef', () => ({
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

const months: MonthStats[] = Array.from({ length: 12 }, (_, i) => ({
  month: i + 1,
  monthName: `Monat${i + 1}`,
  episodesWatched: i * 2,
  moviesWatched: i,
  minutesWatched: i * 100,
}));

const mostActive: MonthStats = {
  month: 12,
  monthName: 'Dezember',
  episodesWatched: 40,
  moviesWatched: 5,
  minutesWatched: 2000,
};

describe('MonthlyBreakdownSlide', () => {
  it('renders the most active month with its stats', () => {
    render(<MonthlyBreakdownSlide monthlyBreakdown={months} mostActiveMonth={mostActive} />);
    expect(screen.getByText('Dein aktivster Monat')).toBeInTheDocument();
    expect(screen.getByText('Dezember')).toBeInTheDocument();
    expect(screen.getByText('40 Episoden • 5 Filme')).toBeInTheDocument();
  });

  it('renders a short-month label for each bar', () => {
    render(<MonthlyBreakdownSlide monthlyBreakdown={months} mostActiveMonth={mostActive} />);
    expect(screen.getByText('Jan')).toBeInTheDocument();
    expect(screen.getByText('Dez')).toBeInTheDocument();
    expect(screen.getByText('Watchtime pro Monat')).toBeInTheDocument();
  });
});
