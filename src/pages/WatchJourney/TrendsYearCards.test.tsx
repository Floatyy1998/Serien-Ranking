// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

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

import { TrendsYearCards } from './TrendsYearCards';

const yearlyData = [
  {
    year: 2024,
    episodes: 120,
    movies: 15,
    totalHours: 90,
    topGenre: 'Drama',
    topProvider: 'Netflix',
    genreDistribution: { Drama: 60 },
  },
];

afterEach(() => cleanup());

describe('TrendsYearCards', () => {
  it('renders the year-by-year cards', () => {
    render(<TrendsYearCards yearlyData={yearlyData} topGenreColors={{ Drama: '#42a5f5' }} />);
    expect(screen.getByText('Jahr für Jahr')).toBeInTheDocument();
    expect(screen.getByText('2024')).toBeInTheDocument();
    expect(screen.getByText('Top: Drama')).toBeInTheDocument();
    expect(screen.getByText('via Netflix')).toBeInTheDocument();
  });
});
