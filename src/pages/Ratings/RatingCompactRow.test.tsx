// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { useTheme } from '../../contexts/ThemeContext';
import type { Series } from '../../types/Series';
import type { PreparedItem } from './useRatingsData';

vi.mock('@mui/icons-material', () => ({ Check: () => null, Star: () => null }));

const mark = vi.hoisted(() => ({
  findNextEpisode: vi.fn(),
  markNextEpisodeWatched: vi.fn(async () => true),
}));
vi.mock('../../hooks/markNextEpisode', () => mark);

import { RatingCompactRow } from './RatingCompactRow';

const theme = {
  primary: '#3355ff',
  background: { default: '#000', surface: '#111' },
  text: { primary: '#fff', muted: '#888' },
  status: { success: '#4cd137', warning: '#f5a623' },
} as unknown as ReturnType<typeof useTheme>['currentTheme'];

const series = { id: 1, title: 'Dark' } as unknown as Series;

const item: PreparedItem = {
  id: 1,
  title: 'Dark',
  posterUrl: 'https://example.com/p.jpg',
  rating: 8.4,
  progress: 50,
  isMovie: false,
  watchlist: false,
  year: '2017',
  genres: 'Drama',
  providers: [],
};

beforeEach(() => {
  mark.findNextEpisode.mockReset();
  mark.markNextEpisodeWatched.mockClear();
});
afterEach(() => cleanup());

describe('RatingCompactRow (D5)', () => {
  it('zeigt „Weiter: S/E" und markiert per 1-Tap die nächste Folge', async () => {
    mark.findNextEpisode.mockReturnValue({
      seasonNumber: 3,
      episodeNumber: 7,
      episodeName: 'Finale',
    });
    render(<RatingCompactRow item={item} series={series} uid="u1" theme={theme} />);

    expect(screen.getByText(/Weiter: S3 E7/)).toBeInTheDocument();
    const btn = screen.getByRole('button', { name: /S3 E7 als gesehen markieren/ });
    fireEvent.click(btn);
    expect(mark.markNextEpisodeWatched).toHaveBeenCalledWith('u1', series);
  });

  it('zeigt „Komplett gesehen" ohne Button, wenn keine Folge offen ist', () => {
    mark.findNextEpisode.mockReturnValue(null);
    render(
      <RatingCompactRow item={{ ...item, progress: 100 }} series={series} uid="u1" theme={theme} />
    );
    expect(screen.getByText(/Komplett gesehen/)).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('Filme: Jahr/Genre-Zeile, kein Mark-Button, kein findNextEpisode-Aufruf', () => {
    render(
      <RatingCompactRow item={{ ...item, isMovie: true, progress: 0 }} uid="u1" theme={theme} />
    );
    expect(screen.getByText(/2017 • Drama/)).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(mark.findNextEpisode).not.toHaveBeenCalled();
  });

  it('trägt die Grid-Delegations-Attribute (data-id, ratings-grid-item)', () => {
    mark.findNextEpisode.mockReturnValue(null);
    const { container } = render(
      <RatingCompactRow item={item} series={series} uid="u1" theme={theme} />
    );
    const row = container.querySelector('.ratings-grid-item.ratings-row') as HTMLElement;
    expect(row).toBeTruthy();
    expect(row.dataset.id).toBe('1');
    expect(row.dataset.movie).toBeUndefined();
  });
});
