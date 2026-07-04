// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { TimePatternSlide } from './TimePatternSlide';
import type { DayOfWeekStats, TimeOfDayStats } from '../../types/Wrapped';

afterEach(() => cleanup());

const dayOfWeek: DayOfWeekStats = {
  dayOfWeek: 6,
  dayName: 'Samstag',
  count: 50,
  percentage: 42,
};

const timeOfDay = (t: TimeOfDayStats['timeOfDay']): TimeOfDayStats => ({
  timeOfDay: t,
  label: 'Custom-Label',
  count: 30,
  percentage: 55,
});

describe('TimePatternSlide', () => {
  it('renders the evening label and percentages', () => {
    render(
      <TimePatternSlide favoriteTimeOfDay={timeOfDay('evening')} favoriteDayOfWeek={dayOfWeek} />
    );
    expect(screen.getByText('Abends')).toBeInTheDocument();
    expect(screen.getByText('55%')).toBeInTheDocument();
    expect(screen.getByText('Samstag')).toBeInTheDocument();
    expect(screen.getByText('42%')).toBeInTheDocument();
  });

  it('renders the favorite day heading', () => {
    render(
      <TimePatternSlide favoriteTimeOfDay={timeOfDay('night')} favoriteDayOfWeek={dayOfWeek} />
    );
    expect(screen.getByText('Nachts')).toBeInTheDocument();
    expect(screen.getByText('Dein liebster Serien-Tag')).toBeInTheDocument();
  });
});
