// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { Series } from '../../types/Series';

vi.mock('../../contexts/ThemeContext', () => {
  const make = (): unknown =>
    new Proxy(() => '#3355ff', {
      get: (_t, prop) => {
        if (prop === Symbol.toPrimitive || prop === 'toString' || prop === 'valueOf')
          return () => '#3355ff';
        return make();
      },
    });
  return { useTheme: () => ({ currentTheme: make() }) };
});

import { RatingsCard } from './RatingsCard';

const series = {
  id: 5,
  vote_average: 8.4,
  vote_count: 2000,
  imdb: { imdb_id: 'tt123' },
} as unknown as Series;

afterEach(() => cleanup());

describe('RatingsCard', () => {
  it('renders both TMDB and IMDb rating badges', () => {
    render(
      <RatingsCard
        series={series}
        localSeries={undefined}
        tmdbRating={{ vote_average: 8.4, vote_count: 2000 }}
        imdbRating={{ rating: 9.1, votes: '12,345' }}
        seriesId="5"
        isMobile={false}
      />
    );
    expect(screen.getByText('TMDB')).toBeInTheDocument();
    expect(screen.getByText('IMDb')).toBeInTheDocument();
    expect(screen.getByText('8.4/10')).toBeInTheDocument();
    expect(screen.getByText('9.1/10')).toBeInTheDocument();
  });

  it('links the TMDB badge to the correct external page', () => {
    render(
      <RatingsCard
        series={series}
        localSeries={undefined}
        tmdbRating={null}
        imdbRating={null}
        seriesId="5"
        isMobile
      />
    );
    const tmdb = screen.getByText('TMDB').closest('a');
    expect(tmdb).toHaveAttribute('href', 'https://www.themoviedb.org/tv/5');
  });

  it('disables the IMDb badge when no imdb id is present', () => {
    const noImdb = { id: 5, vote_average: 7, vote_count: 10 } as unknown as Series;
    render(
      <RatingsCard
        series={noImdb}
        localSeries={undefined}
        tmdbRating={null}
        imdbRating={null}
        seriesId="5"
        isMobile={false}
      />
    );
    const imdb = screen.getByText('IMDb').closest('a');
    expect(imdb).toHaveStyle({ pointerEvents: 'none' });
  });
});
