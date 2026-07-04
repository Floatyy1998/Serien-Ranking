// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { RecordDaySlide } from './RecordDaySlide';
import type { DayStats } from '../../types/Wrapped';

afterEach(() => cleanup());

const day: DayStats = {
  date: '2025-06-15',
  dayName: 'Sonntag',
  episodesWatched: 8,
  moviesWatched: 2,
  minutesWatched: 240,
};

describe('RecordDaySlide', () => {
  it('renders the record day name and heading', () => {
    render(<RecordDaySlide mostActiveDay={day} />);
    expect(screen.getByText('Dein Rekord-Tag')).toBeInTheDocument();
    expect(screen.getByText('Sonntag')).toBeInTheDocument();
  });

  it('renders the per-category counts and total titles', () => {
    render(<RecordDaySlide mostActiveDay={day} />);
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    // 240 minutes => 4h
    expect(screen.getByText('4h')).toBeInTheDocument();
    // 8 + 2 = 10 titles
    expect(screen.getByText('10 Titel')).toBeInTheDocument();
  });
});
