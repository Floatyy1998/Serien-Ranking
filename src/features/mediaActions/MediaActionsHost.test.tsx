// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type React from 'react';
import { mediaTargetProps } from '../../lib/interaction/mediaTarget';

const mocks = vi.hoisted(() => ({
  open: vi.fn(),
  markWatched: vi.fn(async () => undefined),
  setFolderItem: vi.fn(async () => undefined),
  add: vi.fn(async () => 'added' as const),
  series: [] as unknown[],
  movies: [] as unknown[],
  folders: [] as { id: string; name: string; createdAt: number; items: Set<string> }[],
}));

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#3355ff',
      accent: '#22d3ee',
      background: { default: '#000000', surface: '#111111' },
      text: { primary: '#ffffff', secondary: '#dddddd', muted: '#999999' },
      border: { default: '#333333' },
      status: { error: '#ff0000' },
    },
  }),
}));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: { uid: 'me' } }) }));
vi.mock('../../contexts/SeriesListContext', () => ({
  useSeriesList: () => ({ allSeriesList: mocks.series, refetchAfterAdd: vi.fn() }),
}));
vi.mock('../../contexts/MovieListContext', () => ({
  useMovieList: () => ({ movieList: mocks.movies }),
}));
vi.mock('../../hooks/rating/useRatingFolders', () => ({
  useRatingFolders: () => ({ folders: mocks.folders, loading: false }),
}));
vi.mock('../../hooks/rating/useQuickRatingSheet', () => ({
  useQuickRatingSheet: () => ({
    quickRating: { open: false, title: '', afterWatched: false, initialRating: 0, genres: [] },
    openQuickRating: mocks.open,
    closeQuickRating: vi.fn(),
    saveQuickRating: vi.fn(),
  }),
}));
vi.mock('../../services/rating/quickRating', () => ({ markMovieWatched: mocks.markWatched }));
vi.mock('../../services/rating/ratingFoldersService', () => ({
  setRatingFolderItem: mocks.setFolderItem,
}));
vi.mock('../../services/series/addToLibrary', () => ({ addToLibrary: mocks.add }));
vi.mock('../../lib/interaction/haptics', () => ({ hapticTap: vi.fn() }));
vi.mock('../../lib/interaction/toast', () => ({ showToast: vi.fn() }));
vi.mock('../../components/ui/overlay/QuickRatingSheet', () => ({ QuickRatingSheet: () => null }));
vi.mock('../../pages/Ratings/RatingFolderSheet', () => ({
  RatingFolderSheet: ({ state }: { state: { open: boolean } }) =>
    state.open ? <div data-testid="folder-sheet" /> : null,
}));
vi.mock('../../components/ui', () => ({
  BottomSheet: ({ isOpen, children }: { isOpen: boolean; children?: React.ReactNode }) =>
    isOpen ? <div data-testid="actions-sheet">{children}</div> : null,
}));

import { MediaActionsHost } from './MediaActionsHost';

const Card = ({ type, id, title }: { type: 'series' | 'movie'; id: number; title: string }) => (
  <div {...mediaTargetProps({ type, id, title })}>
    <span>{title}</span>
  </div>
);

const longPress = (el: Element) => {
  fireEvent.pointerDown(el, { button: 2 });
  fireEvent.contextMenu(el);
};

beforeEach(() => {
  mocks.series = [];
  mocks.movies = [];
  mocks.folders = [];
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('MediaActionsHost', () => {
  it('bietet für einen eigenen Film Bewerten, Gesehen und Listen an', async () => {
    mocks.movies = [{ id: 7, title: 'Iron Man', rating: {}, poster: { poster: '/p.jpg' } }];
    mocks.folders = [{ id: 'f1', name: 'Marvel', createdAt: 1, items: new Set() }];
    render(
      <>
        <Card type="movie" id={7} title="Iron Man" />
        <MediaActionsHost />
      </>
    );
    const card = screen.getByText('Iron Man');

    longPress(card);
    fireEvent.click(screen.getByText('Bewerten'));
    await waitFor(() =>
      expect(mocks.open).toHaveBeenCalledWith({
        id: 7,
        type: 'movie',
        title: 'Iron Man',
        userRating: 0,
      })
    );
    expect(mocks.add).not.toHaveBeenCalled();

    longPress(card);
    fireEvent.click(screen.getByText('Als gesehen markieren'));
    await waitFor(() => expect(mocks.markWatched).toHaveBeenCalledWith('me', 7));

    longPress(card);
    fireEvent.click(screen.getByText('Zu Liste hinzufügen'));
    fireEvent.click(screen.getByText('Marvel'));
    await waitFor(() => expect(mocks.setFolderItem).toHaveBeenCalledWith('me', 'f1', 'm_7', true));
    fireEvent.click(screen.getByText('Neue Liste'));
    await waitFor(() => expect(screen.getByTestId('folder-sheet')).toBeInTheDocument());
  });

  it('bewertete Serien zeigen „Bewertung ändern" und kein Gesehen', () => {
    mocks.series = [{ id: 1, title: 'Dark', rating: { Drama: 8 } }];
    render(
      <>
        <Card type="series" id={1} title="Dark" />
        <MediaActionsHost />
      </>
    );
    longPress(screen.getByText('Dark'));
    expect(screen.getByText('Bewertung ändern')).toBeInTheDocument();
    expect(screen.queryByText('Als gesehen markieren')).toBeNull();
  });

  it('fremde Titel werden vor dem Bewerten hinzugefügt', async () => {
    render(
      <>
        <Card type="series" id={9} title="Severance" />
        <MediaActionsHost />
      </>
    );
    longPress(screen.getByText('Severance'));
    expect(screen.getByText('Zu meinen Serien hinzufügen')).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByText('Bewerten'));
    });
    expect(mocks.add).toHaveBeenCalledWith(
      'me',
      { id: 9, type: 'series', title: 'Severance', posterPath: undefined },
      'long_press'
    );
    expect(mocks.open).toHaveBeenCalledWith({
      id: 9,
      type: 'series',
      title: 'Severance',
      userRating: 0,
    });
  });

  it('schluckt den Klick nach einem langen Druck, nicht aber normale Klicks', () => {
    const onClick = vi.fn();
    render(
      <>
        <div onClick={onClick}>
          <Card type="movie" id={3} title="Heat" />
        </div>
        <MediaActionsHost />
      </>
    );
    const card = screen.getByText('Heat');
    fireEvent.click(card);
    expect(onClick).toHaveBeenCalledTimes(1);
    longPress(card);
    fireEvent.click(card);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
