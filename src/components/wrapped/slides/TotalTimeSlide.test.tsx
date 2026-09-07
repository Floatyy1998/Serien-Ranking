// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { TotalTimeSlide } from './TotalTimeSlide';

afterEach(() => cleanup());

describe('TotalTimeSlide', () => {
  it('renders the day representation when at least one day was watched', () => {
    render(
      <TotalTimeSlide
        totalMinutes={5000}
        totalHours={83}
        totalDays={3.5}
        totalEpisodes={200}
        totalMovies={12}
      />
    );
    expect(screen.getByText('3.5')).toBeInTheDocument();
    expect(screen.getByText('Tage')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('falls back to hours when less than a day was watched', () => {
    render(
      <TotalTimeSlide
        totalMinutes={300}
        totalHours={5}
        totalDays={0.2}
        totalEpisodes={10}
        totalMovies={1}
      />
    );
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Stunden')).toBeInTheDocument();
  });
});
