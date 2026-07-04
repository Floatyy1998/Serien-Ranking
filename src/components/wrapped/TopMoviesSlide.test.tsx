// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { TopMoviesSlide } from './TopMoviesSlide';
import type { TopMovieEntry } from '../../types/Wrapped';

afterEach(() => cleanup());

const movie = (id: number, title: string, extra: Partial<TopMovieEntry> = {}): TopMovieEntry => ({
  id,
  title,
  minutesWatched: 120,
  ...extra,
});

describe('TopMoviesSlide', () => {
  it('shows the empty state when there are no movies', () => {
    render(<TopMoviesSlide topMovies={[]} />);
    expect(screen.getByText('Keine Filme dieses Jahr')).toBeInTheDocument();
  });

  it('renders the hero movie with its rating', () => {
    render(<TopMoviesSlide topMovies={[movie(1, 'Inception', { rating: 8.7 })]} />);
    expect(screen.getByText('Deine Top Filme')).toBeInTheDocument();
    expect(screen.getByText('Inception')).toBeInTheDocument();
    expect(screen.getByText('8.7')).toBeInTheDocument();
  });

  it('renders additional ranked movies', () => {
    render(
      <TopMoviesSlide topMovies={[movie(1, 'First'), movie(2, 'Second'), movie(3, 'Third')]} />
    );
    expect(screen.getByText('Second')).toBeInTheDocument();
    expect(screen.getByText('Third')).toBeInTheDocument();
  });

  it('respects the maxItems limit', () => {
    render(
      <TopMoviesSlide topMovies={[movie(1, 'A'), movie(2, 'B'), movie(3, 'C')]} maxItems={1} />
    );
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.queryByText('B')).not.toBeInTheDocument();
  });
});
