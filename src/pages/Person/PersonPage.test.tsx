// @vitest-environment jsdom
import type React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
  useParams: () => ({ id: '1253360' }),
}));
vi.mock(
  '@mui/icons-material',
  () =>
    new Proxy(
      { __esModule: true },
      {
        get: (_t, p) =>
          p === '__esModule'
            ? true
            : typeof p === 'symbol' || p === 'then'
              ? undefined
              : () => null,
        has: () => true,
      }
    )
);
vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get:
        () =>
        ({ children, className }: { children?: React.ReactNode; className?: string }) => (
          <div className={className}>{children}</div>
        ),
    }
  ),
}));
vi.mock('../../contexts/ThemeContext', () => {
  const make = (): unknown =>
    new Proxy(() => '#3355ff', {
      get: (_t, p) =>
        p === Symbol.toPrimitive || p === 'toString' || p === 'valueOf' ? () => '#3355ff' : make(),
    });
  return { useTheme: () => ({ currentTheme: make() }) };
});
vi.mock('../../theme/colorUtils', () => ({ getOptimalTextColor: () => '#fff' }));
vi.mock('../../components/ui', () => ({
  BackButton: () => null,
  PageState: ({ mode, error }: { mode: string; error?: { title: string } }) => (
    <div data-testid={`state-${mode}`}>{error?.title}</div>
  ),
}));
vi.mock('../../components/ui/overlay/QuickRatingSheet', () => ({
  QuickRatingSheet: () => null,
}));
vi.mock('../../hooks/rating/useCommunityRatings', () => ({
  useCommunityRatingsMap: () => null,
  pickDisplayRating: () => null,
}));
vi.mock('../../services/rating/quickRating', () => ({
  markMovieWatched: vi.fn(),
  saveQuickRating: vi.fn(),
}));
vi.mock('../../lib/interaction/toast', () => ({ showToast: vi.fn() }));

const state = vi.hoisted(() => ({
  series: [] as unknown[],
  movies: [] as unknown[],
}));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: { uid: 'u1' } }) }));
vi.mock('../../contexts/SeriesListContext', () => ({
  useSeriesList: () => ({ allSeriesList: state.series, refetchAfterAdd: vi.fn(), loading: false }),
}));
vi.mock('../../contexts/MovieListContext', () => ({
  useMovieList: () => ({ movieList: state.movies, loading: false }),
}));

const api = vi.hoisted(() => ({
  fetchPersonProfile: vi.fn(),
  addToLibrary: vi.fn(async () => 'added'),
}));
vi.mock('../../services/api/tmdbPeople', () => ({
  fetchPersonProfile: (...a: unknown[]) => api.fetchPersonProfile(...a),
}));
vi.mock('../../services/series/addToLibrary', () => ({
  addToLibrary: (...a: unknown[]) => api.addToLibrary(...(a as [])),
}));

import { PersonPage } from './PersonPage';

const profile = {
  id: 1253360,
  name: 'Pedro Pascal',
  biography: 'Chilenisch-amerikanischer Schauspieler.',
  birthday: '1975-04-02',
  placeOfBirth: 'Santiago, Chile',
  profilePath: '/pedro.jpg',
  department: 'Acting',
  cast: [
    {
      id: 100088,
      media_type: 'tv',
      name: 'The Last of Us',
      first_air_date: '2023-01-15',
      character: 'Joel Miller',
      episode_count: 16,
      vote_count: 6000,
    },
    {
      id: 464052,
      media_type: 'movie',
      title: 'Wonder Woman 1984',
      release_date: '2020-12-16',
      character: 'Maxwell Lord',
      order: 2,
      vote_count: 9000,
    },
    { id: 1, media_type: 'movie', title: 'Making of', character: 'Self', vote_count: 5 },
  ],
  crew: [],
};

afterEach(() => {
  cleanup();
  state.series = [];
  state.movies = [];
  api.fetchPersonProfile.mockReset();
  api.addToLibrary.mockClear();
  navigateMock.mockClear();
});

const titles = (container: HTMLElement) =>
  [...container.querySelectorAll('.pp-card__title')].map((el) => el.textContent);

describe('PersonPage', () => {
  it('zeigt Kopf, Biografie und die Filmografie ohne Auftritte als man selbst', async () => {
    api.fetchPersonProfile.mockResolvedValue(profile);
    const { container } = render(<PersonPage />);
    expect(await screen.findByRole('heading', { name: 'Pedro Pascal' })).toBeTruthy();
    expect(api.fetchPersonProfile).toHaveBeenCalledWith(1253360);
    expect(screen.getByText('Chilenisch-amerikanischer Schauspieler.')).toBeTruthy();
    expect(screen.getByText(/Santiago, Chile/)).toBeTruthy();
    expect(titles(container)).toEqual(['Wonder Woman 1984', 'The Last of Us']);
    expect(screen.queryByText('Making of')).toBeNull();
    expect(screen.queryByText('Aus deiner Liste')).toBeNull();
  });

  it('hebt Titel aus der eigenen Liste hervor', async () => {
    state.series = [{ id: 100088, title: 'The Last of Us' }];
    api.fetchPersonProfile.mockResolvedValue(profile);
    const { container } = render(<PersonPage />);
    expect(await screen.findByText('Aus deiner Liste')).toBeTruthy();
    const owned = container.querySelector('.pp-section .pp-grid');
    expect(owned?.textContent).toContain('The Last of Us');
    expect(owned?.textContent).not.toContain('Wonder Woman 1984');
  });

  it('filtert nach Serien und öffnet einen Titel', async () => {
    api.fetchPersonProfile.mockResolvedValue(profile);
    const { container } = render(<PersonPage />);
    await screen.findByRole('heading', { name: 'Pedro Pascal' });
    fireEvent.click(screen.getByRole('button', { name: /Serien/ }));
    expect(titles(container)).toEqual(['The Last of Us']);
    fireEvent.click(container.querySelector('.pp-card') as HTMLElement);
    expect(navigateMock).toHaveBeenCalledWith('/series/100088');
  });

  it('legt einen Titel direkt aus der Filmografie in die Liste', async () => {
    api.fetchPersonProfile.mockResolvedValue(profile);
    render(<PersonPage />);
    await screen.findByRole('heading', { name: 'Pedro Pascal' });
    fireEvent.click(screen.getByRole('button', { name: '„The Last of Us" zur Liste hinzufügen' }));
    await waitFor(() =>
      expect(api.addToLibrary).toHaveBeenCalledWith(
        'u1',
        expect.objectContaining({ id: 100088, type: 'series', title: 'The Last of Us' }),
        'person'
      )
    );
  });

  it('zeigt einen Fehlerzustand, wenn TMDB nicht antwortet', async () => {
    api.fetchPersonProfile.mockRejectedValue(new Error('offline'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<PersonPage />);
    expect(await screen.findByTestId('state-error')).toBeTruthy();
  });
});
