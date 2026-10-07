// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Manga } from '../../types/Manga';
import { MangaPage } from './MangaPage';

const listState = vi.hoisted(() => ({ list: [] as Manga[], loading: false }));
vi.mock('../../contexts/MangaListContext', () => ({
  useMangaList: () => ({
    mangaList: listState.list,
    hiddenMangaList: [],
    loading: listState.loading,
  }),
}));

const layoutState = vi.hoisted(() => ({ hidden: [] as string[] }));
vi.mock('../../hooks/manga/useMangaLayout', async () => {
  const { defaultMangaLayout } = await import('../../services/settings/mangaLayout');
  return {
    useMangaLayout: () => {
      const layout = defaultMangaLayout();
      return { ...layout, sections: { ...layout.sections, hidden: layoutState.hidden } };
    },
  };
});

vi.mock('../../services/db/ref', () => ({
  dbRef: () => ({ once: () => Promise.resolve({ val: () => null }), set: () => Promise.resolve() }),
  paths: { mangaLayout: (uid: string) => `users/${uid}/mangaLayout` },
}));

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#00d123',
      accent: '#00b0ff',
      background: { default: '#000', surface: '#111' },
      text: { primary: '#fff', secondary: '#aaa', muted: '#777' },
      status: { warning: '#f59e0b', error: '#ef4444' },
    },
  }),
}));

vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: { uid: 'u1' } }) }));

const navigate = vi.hoisted(() => vi.fn());
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));

vi.mock('../../hooks/data/useEnhancedFirebaseCache', () => ({
  useEnhancedFirebaseCache: () => ({ data: null }),
}));

vi.mock('../../hooks/manga/useMangaTrending', () => ({
  useMangaTrending: () => [],
  useMangaPopular: () => [],
  useMangaTopRated: () => [],
}));

vi.mock('../HomePage/hooks/useUnifiedNotifications', () => ({
  useUnifiedNotifications: () => ({
    totalUnreadBadge: 0,
    unifiedNotifications: [],
    handleMarkAllNotificationsRead: vi.fn(),
    markAsRead: vi.fn(),
    dismissAnnouncement: vi.fn(),
    acceptFriendRequest: vi.fn(),
    declineFriendRequest: vi.fn(),
    acceptRecommendation: vi.fn(),
    declineRecommendation: vi.fn(),
  }),
}));

vi.mock('../HomePage/sheets/NotificationSheet', () => ({ NotificationSheet: () => null }));
vi.mock('../../components/pet/CaseOpeningOverlay', () => ({ CaseOpeningOverlay: () => null }));

vi.mock('./sections/ContinueReadingSection', () => ({ ContinueReadingSection: () => null }));
vi.mock('./sections/HiddenMangaCard', () => ({ HiddenMangaCard: () => null }));
vi.mock('./sections/MangaCatchUpCard', () => ({ MangaCatchUpCard: () => null }));
vi.mock('./sections/MangaStatsSection', () => ({ MangaStatsSection: () => null }));
vi.mock('./sections/MangaCarouselSection', () => ({ MangaCarouselSection: () => null }));
vi.mock('./sections/RecentlyAddedMangaSection', () => ({ RecentlyAddedMangaSection: () => null }));
vi.mock('./sections/NewChaptersSection', () => ({ NewChaptersSection: () => null }));
vi.mock('./sections/UpNextSection', () => ({ UpNextSection: () => null }));
vi.mock('./sections/GenrePicksSection', () => ({ GenrePicksSection: () => null }));
vi.mock('./sections/MangaRatingQueueCard', () => ({ MangaRatingQueueCard: () => null }));
vi.mock('./sections/MangaRereadCard', () => ({ MangaRereadCard: () => null }));

vi.mock('../../components/ui', () => ({
  NavEscapeButtons: () => null,
  GradientText: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  HeaderActions: () => <div data-testid="header-actions" />,
  SectionHeader: ({ title }: { title?: ReactNode }) => <h2>{title}</h2>,
  EmptyState: ({ title, description }: { title: string; description?: string }) => (
    <div>
      <p>{title}</p>
      <p>{description}</p>
    </div>
  ),
}));

vi.mock('../../components/ui/feedback/LoadingSpinner', () => ({
  LoadingSpinner: ({ text }: { text?: ReactNode }) => <div>{text}</div>,
}));

function makeManga(overrides: Partial<Manga> = {}): Manga {
  return {
    nmr: 1,
    anilistId: 1,
    title: 'Sammlungs-Manga',
    poster: 'p.jpg',
    rating: {},
    currentChapter: 10,
    readStatus: 'reading',
    format: 'MANGA',
    chapters: 100,
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
  listState.list = [];
  listState.loading = false;
  layoutState.hidden = [];
  localStorage.clear();
  navigate.mockReset();
});

describe('MangaPage', () => {
  it('rendert das Deck und den Leerzustand ohne Manga', () => {
    render(<MangaPage />);
    expect(screen.getByText('Manga')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Suche oben nach Manga, Manhwa oder Manhua und füge sie zu deiner Sammlung hinzu.'
      )
    ).toBeInTheDocument();
  });

  it('rendert das Sammlungsraster mit Fortschritt', () => {
    listState.list = [makeManga({ anilistId: 2, title: 'Sammlungs-Manga' })];
    render(<MangaPage />);
    expect(screen.getByText('1 Titel in deiner Sammlung')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sammlung' })).toBeInTheDocument();
    expect(screen.getByText('Sammlungs-Manga')).toBeInTheDocument();
    expect(screen.getByText('Kap. 10 / 100')).toBeInTheDocument();
  });

  it('filtert die Sammlung über die eigene Suche', () => {
    listState.list = [
      makeManga({ anilistId: 2, title: 'Berserk' }),
      makeManga({ anilistId: 3, title: 'Vagabond' }),
    ];
    render(<MangaPage />);
    fireEvent.change(screen.getByPlaceholderText('In deiner Sammlung suchen'), {
      target: { value: 'vaga' },
    });
    expect(screen.getByText('Vagabond')).toBeInTheDocument();
    expect(screen.queryByText('Berserk')).not.toBeInTheDocument();
  });

  it('blendet ausgeblendete Sektionen aus', () => {
    listState.list = [makeManga({ anilistId: 2, title: 'Sammlungs-Manga' })];
    layoutState.hidden = ['collection'];
    render(<MangaPage />);
    expect(screen.queryByText('Sammlungs-Manga')).not.toBeInTheDocument();
  });

  it('zeigt den Ladezustand, solange noch keine Sammlung da ist', () => {
    listState.loading = true;
    render(<MangaPage />);
    expect(screen.getByText('Sammlung wird geladen …')).toBeInTheDocument();
  });

  it('führt zum Layout-Editor', () => {
    render(<MangaPage />);
    fireEvent.click(screen.getByText('Übersicht anpassen'));
    expect(navigate).toHaveBeenCalledWith('/manga/layout');
  });
});
