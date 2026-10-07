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
    activeTab: 'series' as 'series' | 'movies' | 'lists',
    setActiveTab: vi.fn(),
    openFolderId: null as string | null,
    setOpenFolderId: vi.fn(),
    allSeries: [] as FpItem[],
    allMovies: [] as FpItem[],
    filters: {} as Record<string, string>,
    setFilters: vi.fn(),
    ratedSeries: [{ id: 1 }] as unknown as FpItem[],
    ratedMovies: [] as FpItem[],
    currentItems: [{ id: 1, title: 'Fringe', poster: '/p.jpg', seasons: [{}] }] as FpItem[],
    averageRating: 8.4,
    itemsWithRatingCount: 3,
    scrollRef: { current: null },
    handleItemClick: vi.fn(),
    navigateToTasteMatch: vi.fn(),
  },
}));

const { friendsState, dbState, dbGetMock, navigateMock } = vi.hoisted(() => {
  const dbState = { isPublicProfile: false as boolean, publicProfileId: '' };
  return {
    friendsState: {
      friends: [{ uid: 'friend-1' }] as { uid: string }[],
      loading: false,
      sentRequests: [] as { toUserId: string; status: string }[],
      friendRequests: [] as { id: string; fromUserId: string; status: string }[],
      sendFriendRequest: vi.fn(async () => true),
      acceptFriendRequest: vi.fn(async () => {}),
      declineFriendRequest: vi.fn(async () => {}),
      grantedToMe: new Set(['friend-1']),
      shareState: (() => 'granted') as () => 'granted' | 'pending' | 'none',
      requestShare: vi.fn(async () => true),
    },
    dbState,
    dbGetMock: vi.fn(async (path: string) => {
      if (path.endsWith('/isPublicProfile')) return dbState.isPublicProfile;
      if (path.endsWith('/publicProfileId')) return dbState.publicProfileId || null;
      return { username: 'mia', displayName: 'Mia', photoURL: '' };
    }),
    navigateMock: vi.fn(),
  };
});

vi.mock('react-router-dom', () => ({ useNavigate: () => navigateMock }));
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'me' } }),
}));
vi.mock('../../contexts/OptimizedFriendsContext', () => ({
  useOptimizedFriends: () => friendsState,
}));
vi.mock('../../services/db/ref', () => ({
  dbGet: dbGetMock,
  dbRef: () => ({ once: () => Promise.resolve({ val: () => null }) }),
  userPath: (uid: string, ...segments: string[]) => ['users', uid, ...segments].join('/'),
}));
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
vi.mock('./FriendComparisonCard', () => ({ FriendComparisonCard: () => null }));
const { mangaState } = vi.hoisted(() => ({
  mangaState: {
    list: [] as {
      anilistId: number;
      title: string;
      poster: string;
      rating: Record<string, number>;
      currentChapter: number;
      readStatus: string;
      nmr: number;
    }[],
    loading: false,
  },
}));
vi.mock('./useFriendManga', () => ({ useFriendManga: () => mangaState }));
vi.mock('./FriendReadingSection', () => ({ FriendReadingSection: () => null }));
vi.mock('../../contexts/MangaListContext', () => ({
  useMangaList: () => ({ mangaList: [], hiddenMangaList: [] }),
}));
vi.mock('../../services/api/anilistService', () => ({ getMangaById: vi.fn() }));
vi.mock('../Manga/addMangaToList', () => ({ addMangaToList: vi.fn() }));
const { foldersState } = vi.hoisted(() => ({
  foldersState: {
    folders: [] as { id: string; name: string; createdAt: number; items: Set<string> }[],
    loading: false,
  },
}));
vi.mock('./useFriendFolders', () => ({ useFriendFolders: () => foldersState }));
vi.mock('../Ratings/RatingFolderGrid', () => ({
  RatingFolderGrid: ({
    folders,
    onOpen,
  }: {
    folders: { id: string; name: string }[];
    onOpen: (id: string) => void;
  }) => (
    <div>
      {folders.map((f) => (
        <button key={f.id} onClick={() => onOpen(f.id)}>
          folder-{f.name}
        </button>
      ))}
    </div>
  ),
}));
vi.mock('./useFriendComparison', () => ({
  useFriendComparison: () => ({ own: {}, friend: null, loading: false }),
}));
vi.mock('@mui/icons-material', () => ({
  ArrowBack: () => null,
  AutoStories: () => null,
  ChatBubbleOutlined: () => null,
  CheckRounded: () => null,
  CloseRounded: () => null,
  PersonAddRounded: () => null,
  ListAlt: () => null,
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
  BackButton: () => <div />,
  NameBadges: () => null,
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
  SearchInput: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <input aria-label="search" value={value} onChange={(e) => onChange(e.target.value)} />
  ),
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
  fpState.openFolderId = null;
  fpState.ratedMovies = [];
  fpState.ratedSeries = [{ id: 1 }] as unknown as FpItem[];
  foldersState.folders = [];
  friendsState.friends = [{ uid: 'friend-1' }];
  friendsState.loading = false;
  friendsState.sentRequests = [];
  friendsState.sendFriendRequest.mockClear();
  friendsState.friendRequests = [];
  friendsState.acceptFriendRequest.mockClear();
  friendsState.declineFriendRequest.mockClear();
  friendsState.grantedToMe = new Set(['friend-1']);
  friendsState.shareState = () => 'granted';
  fpState.currentItems = [{ id: 1, title: 'Fringe', poster: '/p.jpg', seasons: [{}] }];
  fpState.setActiveTab.mockReset();
  fpState.navigateToTasteMatch.mockReset();
  fpState.handleItemClick.mockReset();
  dbState.isPublicProfile = false;
  dbState.publicProfileId = '';
  navigateMock.mockReset();
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

  it('zeigt den Manga-Reiter nur, wenn der Freund Manga hat', () => {
    render(<FriendProfilePage />);
    expect(screen.queryByText('tab-Manga')).not.toBeInTheDocument();
    cleanup();

    mangaState.list = [
      {
        anilistId: 7,
        title: 'Solo Leveling',
        poster: 'p.jpg',
        rating: {},
        currentChapter: 3,
        readStatus: 'reading',
        nmr: 1,
      },
    ];
    render(<FriendProfilePage />);
    fireEvent.click(screen.getByText('tab-Manga'));
    expect(fpState.setActiveTab).toHaveBeenCalledWith('manga');
    mangaState.list = [];
  });

  it('zeigt den Listen-Reiter nur, wenn der Freund Listen hat', () => {
    render(<FriendProfilePage />);
    expect(screen.queryByText('tab-Listen')).not.toBeInTheDocument();
    cleanup();

    foldersState.folders = [{ id: 'f1', name: 'Marvel', createdAt: 1, items: new Set(['s_1']) }];
    render(<FriendProfilePage />);
    fireEvent.click(screen.getByText('tab-Listen'));
    expect(fpState.setActiveTab).toHaveBeenCalledWith('lists');
  });

  it('oeffnet eine Liste des Freundes und zeigt nur ihre Titel', () => {
    foldersState.folders = [{ id: 'f1', name: 'Marvel', createdAt: 1, items: new Set(['s_1']) }];
    fpState.activeTab = 'lists';
    fpState.ratedSeries = [{ id: 1, title: 'Fringe', poster: '/p.jpg', seasons: [{}] }];
    render(<FriendProfilePage />);
    fireEvent.click(screen.getByText('folder-Marvel'));
    expect(fpState.setOpenFolderId).toHaveBeenCalledWith('f1');
    cleanup();

    fpState.openFolderId = 'f1';
    render(<FriendProfilePage />);
    expect(screen.getByText('Marvel')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fringe' })).toBeInTheDocument();
  });

  it('shows the empty state when there are no items', () => {
    fpState.currentItems = [];
    render(<FriendProfilePage />);
    expect(screen.getByText('Keine Serien gefunden')).toBeInTheDocument();
  });

  it('zeigt Nicht-Freunden nur die Privat-Ansicht mit Anfrage-Button', async () => {
    friendsState.friends = [];
    render(<FriendProfilePage />);
    expect(await screen.findByText(/Dieses Profil ist privat/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Fringe' })).not.toBeInTheDocument();
    await waitFor(() => expect(dbGetMock).toHaveBeenCalledWith('userSearchIndex/friend-1'));
    await waitFor(() =>
      expect(screen.getByText('Freundschaftsanfrage senden').closest('button')).not.toBeDisabled()
    );
    fireEvent.click(screen.getByText('Freundschaftsanfrage senden'));
    expect(await screen.findByText('Anfrage gesendet ✓')).toBeInTheDocument();
    // Die uid entscheidet, der Name ist nur noch Beiwerk — sonst scheiterte die
    // Anfrage bei Konten ohne oder mit abweichendem Benutzernamen.
    expect(friendsState.sendFriendRequest).toHaveBeenCalledWith('mia', 'friend-1');
  });

  it('zeigt Nicht-Freunden mit oeffentlichem Profil die volle Ansicht ohne Freundes-Teile', async () => {
    // publicProfile true: Bibliothek und Bewertungen gibt schon die Regel frei.
    friendsState.friends = [];
    friendsState.grantedToMe = new Set<string>();
    dbState.isPublicProfile = true;
    dbState.publicProfileId = 'abc123';

    render(<FriendProfilePage />);

    expect(await screen.findByRole('button', { name: 'Fringe' })).toBeInTheDocument();
    expect(screen.queryByText(/Dieses Profil ist privat/)).not.toBeInTheDocument();
    // Chat, Match und der Freigabe-Hinweis gehoeren nur zu Freunden
    expect(screen.queryByText('Match')).not.toBeInTheDocument();
    expect(screen.queryByText(/teilt die eigenen Serien nicht/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Freundschaftsanfrage senden'));
    expect(await screen.findByText('Anfrage gesendet ✓')).toBeInTheDocument();
    expect(friendsState.sendFriendRequest).toHaveBeenCalledWith('mia', 'friend-1');
  });

  it('bleibt bei privatem Profil bei der bisherigen Sperrseite', async () => {
    friendsState.friends = [];
    dbState.isPublicProfile = false;
    dbState.publicProfileId = 'abc123';

    render(<FriendProfilePage />);

    await waitFor(() => expect(dbGetMock).toHaveBeenCalledWith('users/friend-1/isPublicProfile'));
    expect(await screen.findByText(/Dieses Profil ist privat/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Fringe' })).not.toBeInTheDocument();
  });

  it('zeigt bei bereits gesendeter Anfrage den Gesendet-Status', async () => {
    friendsState.friends = [];
    friendsState.sentRequests = [{ toUserId: 'friend-1', status: 'pending' }];
    render(<FriendProfilePage />);
    expect(await screen.findByText('Anfrage gesendet ✓')).toBeInTheDocument();
  });

  it('bietet bei eingehender Anfrage Annehmen und Ablehnen statt Senden an', async () => {
    friendsState.friends = [];
    friendsState.friendRequests = [{ id: 'req-1', fromUserId: 'friend-1', status: 'pending' }];
    dbState.isPublicProfile = true;
    dbState.publicProfileId = 'abc123';

    render(<FriendProfilePage />);

    expect(
      await screen.findByText(/hat dir eine Freundschaftsanfrage geschickt/)
    ).toBeInTheDocument();
    expect(screen.queryByText('Freundschaftsanfrage senden')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Annehmen/ }));
    await waitFor(() => expect(friendsState.acceptFriendRequest).toHaveBeenCalledWith('req-1'));
  });

  it('lehnt eine eingehende Anfrage auch auf dem privaten Profil ab', async () => {
    friendsState.friends = [];
    friendsState.friendRequests = [{ id: 'req-1', fromUserId: 'friend-1', status: 'pending' }];

    render(<FriendProfilePage />);

    expect(await screen.findByText(/Dieses Profil ist privat/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Ablehnen/ }));
    await waitFor(() => expect(friendsState.declineFriendRequest).toHaveBeenCalledWith('req-1'));
  });

  it('zeigt Freunden die Einblicke auch ohne Kalender-Freigabe', async () => {
    friendsState.grantedToMe = new Set<string>();
    friendsState.shareState = () => 'none';
    render(<FriendProfilePage />);
    expect(await screen.findByText('Nichts Aktuelles')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Einblick anfragen/ })).not.toBeInTheDocument();
  });
});
