// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { PreparedItem } from './useRatingsData';
import type React from 'react';

const folderMocks = vi.hoisted(() => ({ deleteWithUndo: vi.fn(async () => undefined) }));
const rateMocks = vi.hoisted(() => ({
  open: vi.fn(),
  markWatched: vi.fn(async () => undefined),
}));

const { theme, dataRef } = vi.hoisted(() => ({
  theme: {
    primary: '#3355ff',
    accent: '#22d3ee',
    background: { default: '#000000', surface: '#111111' },
    text: { primary: '#ffffff', secondary: '#dddddd', muted: '#999999' },
    border: { default: '#333333' },
    status: { error: '#ff0000' },
  },
  dataRef: {
    current: {
      user: { uid: 'me' } as { uid: string } | null,
      activeTab: 'series' as 'series' | 'movies' | 'folders',
      itemsToRender: [] as PreparedItem[],
      currentItems: [] as PreparedItem[],
      seriesCount: 0,
      moviesCount: 0,
      stats: { count: 0, average: 0 },
      filters: {},
      handleTabChange: vi.fn(),
      handleQuickFilterChange: vi.fn(),
      handleGridClick: vi.fn(),
      scrollRef: { current: null },
      quickFilter: null as unknown,
      folders: [] as { id: string; name: string; createdAt: number; items: Set<string> }[],
      activeFolder: null as {
        id: string;
        name: string;
        createdAt: number;
        items: Set<string>;
      } | null,
      folderPreviews: {} as Record<string, { count: number; posters: string[] }>,
      handleFolderChange: vi.fn(),
    },
  },
}));

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({ currentTheme: theme, getMobilePageBackground: () => '#000000' }),
}));
vi.mock('./useRatingsData', () => ({ useRatingsData: () => dataRef.current }));
vi.mock('./RatingItemCard', () => ({
  RatingItemCard: ({ item }: { item: PreparedItem }) => (
    <div className="ratings-grid-item" data-id={item.id} data-movie={item.isMovie || undefined}>
      {item.title}
    </div>
  ),
}));
vi.mock('./RatingsEmptyState', () => ({
  RatingsEmptyState: () => <div data-testid="empty" />,
}));

vi.mock('./RatingsHeader', () => ({ RatingsHeader: () => <div data-testid="header" /> }));
vi.mock('./RatingFolderSheet', () => ({
  RatingFolderSheet: ({ state }: { state: { open: boolean } }) =>
    state.open ? <div data-testid="folder-sheet" /> : null,
}));
vi.mock('./deleteFolderWithUndo', () => ({ deleteFolderWithUndo: folderMocks.deleteWithUndo }));
vi.mock('../../hooks/rating/useQuickRatingSheet', () => ({
  useQuickRatingSheet: () => ({
    quickRating: { open: false, title: '', afterWatched: false, initialRating: 0, genres: [] },
    openQuickRating: rateMocks.open,
    closeQuickRating: vi.fn(),
    saveQuickRating: vi.fn(),
  }),
}));
vi.mock('../../services/rating/quickRating', () => ({ markMovieWatched: rateMocks.markWatched }));
vi.mock('../../services/rating/ratingFoldersService', () => ({ setRatingFolderItem: vi.fn() }));
vi.mock('../../components/ui', () => ({
  QuickRatingSheet: () => null,
  BottomSheet: ({ isOpen, children }: { isOpen: boolean; children?: React.ReactNode }) =>
    isOpen ? <div data-testid="actions-sheet">{children}</div> : null,
  QuickFilter: () => <div data-testid="quick-filter" />,
  ScrollToTopButton: () => null,
  SkeletonRatingsGrid: () => <div data-testid="skeleton" />,
}));

import { RatingsPage } from './RatingsPage';

const sampleItem: PreparedItem = {
  id: 1,
  title: 'Dark',
  posterUrl: '',
  rating: 8,
  progress: 0,
  watched: false,
  isMovie: false,
  watchlist: false,
  providers: [],
};

beforeEach(() => {
  dataRef.current.user = { uid: 'me' };
  dataRef.current.itemsToRender = [];
  dataRef.current.currentItems = [];
  dataRef.current.folders = [];
  dataRef.current.activeTab = 'series';
  dataRef.current.folderPreviews = {};
  dataRef.current.filters = {};
  dataRef.current.activeFolder = null;
  dataRef.current.handleFolderChange.mockClear();
});

afterEach(() => cleanup());

describe('RatingsPage', () => {
  it('renders the skeleton grid while the user is loading', () => {
    dataRef.current.user = null;
    render(<RatingsPage />);
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('renders the grid of rating cards', () => {
    dataRef.current.itemsToRender = [sampleItem];
    render(<RatingsPage />);
    expect(screen.getByText('Dark')).toBeInTheDocument();
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('renders the empty state when there are no items at all', () => {
    dataRef.current.itemsToRender = [];
    dataRef.current.currentItems = [];
    render(<RatingsPage />);
    expect(screen.getByTestId('empty')).toBeInTheDocument();
  });

  it('shows the folder overview with collages and opens a folder', () => {
    dataRef.current.activeTab = 'folders';
    dataRef.current.folders = [
      { id: 'f1', name: 'Marvel', createdAt: 1, items: new Set(['m_1', 'm_2']) },
      { id: 'f2', name: 'Lieblingsfilme', createdAt: 2, items: new Set() },
    ];
    dataRef.current.folderPreviews = {
      f1: { count: 2, posters: ['/a.jpg', '/b.jpg'] },
      f2: { count: 0, posters: [] },
    };
    const { container } = render(<RatingsPage />);
    expect(container.querySelectorAll('.rf-collage__img')).toHaveLength(2);
    expect(container.querySelector('.rf-collage--2')).not.toBeNull();
    expect(screen.getByText('2 Titel')).toBeInTheDocument();
    expect(screen.queryByTestId('quick-filter')).toBeNull();
    expect(screen.queryByTestId('empty')).toBeNull();
    fireEvent.click(screen.getByLabelText('Marvel'));
    expect(dataRef.current.handleFolderChange).toHaveBeenCalledWith('f1');
  });

  it('filters folders by the header search in the overview', () => {
    dataRef.current.activeTab = 'folders';
    dataRef.current.filters = { search: 'lieb' };
    dataRef.current.folders = [
      { id: 'f1', name: 'Marvel', createdAt: 1, items: new Set() },
      { id: 'f2', name: 'Lieblingsfilme', createdAt: 2, items: new Set() },
    ];
    render(<RatingsPage />);
    expect(screen.queryByLabelText('Marvel')).toBeNull();
    expect(screen.getByLabelText('Lieblingsfilme')).toBeInTheDocument();
  });

  it('opens the folder sheet from the new-folder card', () => {
    dataRef.current.activeTab = 'folders';
    render(<RatingsPage />);
    fireEvent.click(screen.getByText('Neue Liste'));
    expect(screen.getByTestId('folder-sheet')).toBeInTheDocument();
  });

  it('shows an open folder with back, edit and an empty state', () => {
    const folder = { id: 'f1', name: 'Marvel', createdAt: 1, items: new Set<string>() };
    dataRef.current.activeTab = 'folders';
    dataRef.current.folders = [folder];
    dataRef.current.activeFolder = folder;
    render(<RatingsPage />);
    expect(screen.getByText('Diese Liste ist noch leer')).toBeInTheDocument();
    expect(screen.getByTestId('quick-filter')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Alle Listen'));
    expect(dataRef.current.handleFolderChange).toHaveBeenCalledWith(null);
    fireEvent.click(screen.getByText('Titel hinzufügen'));
    expect(screen.getByTestId('folder-sheet')).toBeInTheDocument();
  });

  it('long press on a folder offers edit and delete', () => {
    const folder = { id: 'f1', name: 'Marvel', createdAt: 1, items: new Set<string>() };
    dataRef.current.activeTab = 'folders';
    dataRef.current.folders = [folder];
    render(<RatingsPage />);
    fireEvent.pointerDown(screen.getByLabelText('Marvel'), { button: 2 });
    fireEvent.contextMenu(screen.getByLabelText('Marvel'));
    expect(screen.getByTestId('actions-sheet')).toBeInTheDocument();
    expect(dataRef.current.handleFolderChange).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('Bearbeiten'));
    expect(screen.getByTestId('folder-sheet')).toBeInTheDocument();
    expect(screen.queryByTestId('actions-sheet')).toBeNull();

    fireEvent.pointerDown(screen.getByLabelText('Marvel'), { button: 2 });
    fireEvent.contextMenu(screen.getByLabelText('Marvel'));
    fireEvent.click(screen.getByText('Liste löschen'));
    expect(folderMocks.deleteWithUndo).toHaveBeenCalledWith('me', folder, expect.any(Function));
  });

  it('long press on a movie card offers rating, mark watched and lists', async () => {
    const movie = { ...sampleItem, id: 7, title: 'Iron Man', isMovie: true, rating: 0 };
    dataRef.current.itemsToRender = [movie];
    dataRef.current.currentItems = [movie];
    dataRef.current.folders = [{ id: 'f1', name: 'Marvel', createdAt: 1, items: new Set() }];
    render(<RatingsPage />);
    const card = screen.getByText('Iron Man');

    fireEvent.pointerDown(card, { button: 2 });
    fireEvent.contextMenu(card);
    fireEvent.click(screen.getByText('Bewerten'));
    expect(rateMocks.open).toHaveBeenCalledWith(
      { id: 7, type: 'movie', title: 'Iron Man', userRating: 0 },
      false
    );

    fireEvent.pointerDown(card, { button: 2 });
    fireEvent.contextMenu(card);
    fireEvent.click(screen.getByText('Als gesehen markieren'));
    await waitFor(() => expect(rateMocks.markWatched).toHaveBeenCalledWith('me', 7));
    await waitFor(() => expect(rateMocks.open).toHaveBeenLastCalledWith(expect.anything(), true));

    fireEvent.pointerDown(card, { button: 2 });
    fireEvent.contextMenu(card);
    fireEvent.click(screen.getByText('Zu Liste hinzufügen'));
    expect(screen.getByText('Marvel')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Neue Liste'));
    expect(screen.getByTestId('folder-sheet')).toBeInTheDocument();
  });

  it('series cards do not offer mark watched and rated ones say change rating', () => {
    dataRef.current.itemsToRender = [sampleItem];
    dataRef.current.currentItems = [sampleItem];
    render(<RatingsPage />);
    const card = screen.getByText('Dark');
    fireEvent.pointerDown(card, { button: 2 });
    fireEvent.contextMenu(card);
    expect(screen.getByText('Bewertung ändern')).toBeInTheDocument();
    expect(screen.queryByText('Als gesehen markieren')).toBeNull();
  });
});
