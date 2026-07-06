// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { Movie } from '../../types/Movie';

vi.mock('@mui/icons-material', () => ({ Info: () => null }));
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

import { MovieInfoTab } from './MovieInfoTab';

const movie = { id: 1, title: 'Dune', beschreibung: 'Wüstenplanet Arrakis' } as unknown as Movie;

afterEach(() => cleanup());

describe('MovieInfoTab', () => {
  it('renders the overview heading and the description text', () => {
    render(<MovieInfoTab movie={movie} isMobile={false} tmdbOverview={null} />);
    expect(screen.getByText('Handlung')).toBeInTheDocument();
    expect(screen.getByText('Wüstenplanet Arrakis')).toBeInTheDocument();
  });

  it('falls back to the tmdb overview when no local description exists', () => {
    const bare = { id: 2, title: 'Arrival' } as unknown as Movie;
    render(<MovieInfoTab movie={bare} isMobile={true} tmdbOverview="Ankunft der Fremden" />);
    expect(screen.getByText('Ankunft der Fremden')).toBeInTheDocument();
  });

  it('renders no overview section when there is no text at all', () => {
    const bare = { id: 3, title: 'Empty' } as unknown as Movie;
    const { container } = render(
      <MovieInfoTab movie={bare} isMobile={false} tmdbOverview={null} />
    );
    expect(container.querySelector('.md-info__section')).toBeNull();
  });
});
