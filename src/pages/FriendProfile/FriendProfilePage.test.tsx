// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

interface FpItem {
  id: number;
  title: string;
  poster: string;
  seasons?: unknown[];
  release_date?: string;
}

const { fpState } = vi.hoisted(() => ({
  fpState: {
    loading: false,
    friendId: 'friend-1',
    friendName: 'Mia',
    activeTab: 'series' as 'series' | 'movies',
    setActiveTab: vi.fn(),
    setFilters: vi.fn(),
    ratedSeries: [{ id: 1 }],
    ratedMovies: [],
    currentItems: [{ id: 1, title: 'Fringe', poster: '/p.jpg', seasons: [{}] }] as FpItem[],
    averageRating: 8.4,
    itemsWithRatingCount: 3,
    scrollRef: { current: null },
    handleItemClick: vi.fn(),
    navigateToTasteMatch: vi.fn(),
  },
}));

const { friendsState, dbGetMock } = vi.hoisted(() => ({
  friendsState: {
    friends: [{ uid: 'friend-1' }] as { uid: string }[],
    loading: false,
    sentRequests: [] as { toUserId: string; status: string }[],
    sendFriendRequest: vi.fn(async () => true),
  },
  dbGetMock: vi.fn(async () => ({ username: 'mia', displayName: 'Mia', photoURL: '' })),
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'me' } }),
}));
vi.mock('../../contexts/OptimizedFriendsContext', () => ({
  useOptimizedFriends: () => friendsState,
}));
vi.mock('../../services/db/ref', () => ({ dbGet: dbGetMock }));
vi.mock('./useFriendProfileData', () => ({
  useFriendProfileData: () => fpState,
  calculateFriendRating: () => '8.0',
  calculateProgress: () => 0,
}));
vi.mock('./useFriendCurrentlyWatching', () => ({
  useFriendCurrentlyWatching: () => ({ data: null, loading: false }),
}));
vi.mock('./useFriendAnticipation', () => ({
  useFriendAnticipation: () => ({ items: [], loading: false }),
}));
vi.mock('./useFriendPet', () => ({ useFriendPet: () => ({ pet: null, loading: false }) }));
vi.mock('./FriendCurrentlyWatchingCard', () => ({ FriendCurrentlyWatchingCard: () => null }));
vi.mock('./FriendAnticipationSection', () => ({ FriendAnticipationSection: () => null }));
vi.mock('./FriendPetCard', () => ({ FriendPetCard: () => null }));
vi.mock('@mui/icons-material', () => ({
  CompareArrows: () => null,
  ExpandLess: () => null,
  ExpandMore: () => null,
  Movie: () => null,
  Star: () => null,
  Tv: () => null,
}));
vi.mock('../../utils/imageUrl', () => ({ getImageUrl: () => 'poster.jpg' }));
vi.mock('framer-motion', async () => {
  const React = await import('react');
  const skip = new Set(['initial', 'animate', 'exit', 'transition', 'whileTap', 'mode']);
  const make = (tag: string) =>
    React.forwardRef(function Motion(props: Record<string, unknown>, ref: unknown) {
      const clean: Record<string, unknown> = { ref };
      for (const k in props) if (!skip.has(k)) clean[k] = props[k];
      return React.createElement(tag, clean);
    });
  return {
    motion: new Proxy({} as Record<string, unknown>, { get: (_t, tag) => make(String(tag)) }),
    AnimatePresence: (props: Record<string, unknown>) =>
      React.createElement(React.Fragment, null, props.children as React.ReactNode),
  };
});
vi.mock('../../components/ui', () => ({
  EmptyState: ({ title }: { title: string }) => <div>{title}</div>,
  Skeleton: () => <div />,
  SkeletonPosterRow: () => <div />,
  PageLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PageHeader: ({ title, actions }: { title: string; actions?: React.ReactNode }) => (
    <div>
      <h1>{title}</h1>
      {actions}
    </div>
  ),
  ProfileItemCard: ({ title, onClick }: { title: string; onClick: () => void }) => (
    <button onClick={onClick}>{title}</button>
  ),
  QuickFilter: () => <div />,
  ScrollToTopButton: () => <div />,
  UserAvatar: () => <div />,
  TabSwitcher: ({
    tabs,
    onTabChange,
  }: {
    tabs: { id: string; label: string }[];
    onTabChange: (id: string) => void;
  }) => (
    <div>
      {tabs.map((t) => (
        <button key={t.id} onClick={() => onTabChange(t.id)}>
          tab-{t.label}
        </button>
      ))}
    </div>
  ),
}));
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

import { FriendProfilePage } from './FriendProfilePage';

beforeEach(() => {
  fpState.loading = false;
  fpState.activeTab = 'series';
  friendsState.friends = [{ uid: 'friend-1' }];
  friendsState.loading = false;
  friendsState.sentRequests = [];
  friendsState.sendFriendRequest.mockClear();
  fpState.currentItems = [{ id: 1, title: 'Fringe', poster: '/p.jpg', seasons: [{}] }];
  fpState.setActiveTab.mockReset();
  fpState.navigateToTasteMatch.mockReset();
  fpState.handleItemClick.mockReset();
});
afterEach(() => cleanup());

describe('FriendProfilePage', () => {
  it('shows the loading skeleton while loading', () => {
    fpState.loading = true;
    render(<FriendProfilePage />);
    expect(screen.getByRole('status', { name: 'Lade Profil' })).toBeInTheDocument();
  });

  it('renders the friend name and rated items', () => {
    render(<FriendProfilePage />);
    expect(screen.getByText('Mia')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fringe' })).toBeInTheDocument();
  });

  it('triggers the taste-match navigation from the Match button', () => {
    render(<FriendProfilePage />);
    fireEvent.click(screen.getByText('Match'));
    expect(fpState.navigateToTasteMatch).toHaveBeenCalled();
  });

  it('switches tabs via the TabSwitcher', () => {
    render(<FriendProfilePage />);
    fireEvent.click(screen.getByText('tab-Filme'));
    expect(fpState.setActiveTab).toHaveBeenCalledWith('movies');
  });

  it('shows the empty state when there are no items', () => {
    fpState.currentItems = [];
    render(<FriendProfilePage />);
    expect(screen.getByText('Keine Serien gefunden')).toBeInTheDocument();
  });

  it('zeigt Nicht-Freunden nur die Privat-Ansicht mit Anfrage-Button', async () => {
    friendsState.friends = [];
    render(<FriendProfilePage />);
    expect(screen.getByText(/Dieses Profil ist privat/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Fringe' })).not.toBeInTheDocument();
    await waitFor(() => expect(dbGetMock).toHaveBeenCalledWith('userSearchIndex/friend-1'));
    await waitFor(() =>
      expect(screen.getByText('Freundschaftsanfrage senden').closest('button')).not.toBeDisabled()
    );
    fireEvent.click(screen.getByText('Freundschaftsanfrage senden'));
    expect(await screen.findByText('Anfrage gesendet ✓')).toBeInTheDocument();
    expect(friendsState.sendFriendRequest).toHaveBeenCalledWith('mia');
  });

  it('zeigt bei bereits gesendeter Anfrage den Gesendet-Status', () => {
    friendsState.friends = [];
    friendsState.sentRequests = [{ toUserId: 'friend-1', status: 'pending' }];
    render(<FriendProfilePage />);
    expect(screen.getByText('Anfrage gesendet ✓')).toBeInTheDocument();
  });
});
