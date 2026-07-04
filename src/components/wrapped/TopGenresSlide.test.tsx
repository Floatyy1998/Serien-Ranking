// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { TopGenresSlide } from './TopGenresSlide';
import type { TopGenreEntry } from '../../types/Wrapped';

afterEach(() => cleanup());

const genre = (name: string, percentage: number): TopGenreEntry => ({
  genre: name,
  count: 10,
  percentage,
  minutesWatched: 600,
});

describe('TopGenresSlide', () => {
  it('shows the empty state without genre data', () => {
    render(<TopGenresSlide topGenres={[]} />);
    expect(screen.getByText('Keine Genre-Daten')).toBeInTheDocument();
  });

  it('renders the top genre as the hero', () => {
    render(<TopGenresSlide topGenres={[genre('Drama', 45), genre('Comedy', 30)]} />);
    expect(screen.getByText('Dein Lieblings-Genre')).toBeInTheDocument();
    // Hero heading + bar list both render the top genre name and its share.
    expect(screen.getAllByText('Drama').length).toBeGreaterThan(0);
    expect(screen.getAllByText('45%').length).toBeGreaterThan(0);
  });

  it('renders a bar row for each genre', () => {
    render(<TopGenresSlide topGenres={[genre('Action', 50), genre('Horror', 20)]} />);
    expect(screen.getByText('Horror')).toBeInTheDocument();
    expect(screen.getByText('20%')).toBeInTheDocument();
  });
});
