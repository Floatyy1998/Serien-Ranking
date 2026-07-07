// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Manga } from '../../types/Manga';
import { MangaPage } from './MangaPage';

const listState = vi.hoisted(() => ({ list: [] as Manga[], loading: false }));
vi.mock('../../contexts/MangaListContext', () => ({
  useMangaList: () => ({ mangaList: listState.list, loading: listState.loading }),
}));

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#00d123',
      accent: '#00b0ff',
      background: { default: '#000', surface: '#111' },
      text: { primary: '#fff', secondary: '#aaa' },
      status: { warning: '#f59e0b', error: '#ef4444' },
    },
  }),
}));

vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: { uid: 'u1' } }) }));

const navigate = vi.hoisted(() => vi.fn());
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));

vi.mock('../../hooks/useEnhancedFirebaseCache', () => ({
  useEnhancedFirebaseCache: () => ({ data: null }),
}));

vi.mock('../../hooks/useMangaTrending', () => ({
  useMangaTrending: () => [],
  useMangaPopular: () => [],
  useMangaTopRated: () => [],
}));

vi.mock('../HomePage/useUnifiedNotifications', () => ({
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

vi.mock('../HomePage/NotificationSheet', () => ({ NotificationSheet: () => null }));
vi.mock('../../components/pet/CaseOpeningOverlay', () => ({ CaseOpeningOverlay: () => null }));

vi.mock('./sections/ContinueReadingSection', () => ({ ContinueReadingSection: () => null }));
vi.mock('./sections/HiddenMangaCard', () => ({ HiddenMangaCard: () => null }));
vi.mock('./sections/MangaCatchUpCard', () => ({ MangaCatchUpCard: () => null }));
vi.mock('./sections/MangaStatsSection', () => ({ MangaStatsSection: () => null }));
vi.mock('./sections/MangaCarouselSection', () => ({ MangaCarouselSection: () => null }));
vi.mock('./sections/RecentlyAddedMangaSection', () => ({ RecentlyAddedMangaSection: () => null }));

vi.mock('../../components/ui', () => ({
  GradientText: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  HeaderActions: () => <div data-testid="header-actions" />,
  SectionHeader: ({ title }: { title?: ReactNode }) => <div>{title}</div>,
}));

vi.mock('../../components/ui/LoadingSpinner', () => ({
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
  navigate.mockReset();
});

describe('MangaPage', () => {
  it('rendert die Kopfzeile und den Leerzustand ohne Manga', () => {
    render(<MangaPage />);
    expect(screen.getByText('Manga')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Suche oben nach Manga, Manhwa oder Manhua und füge sie zu deiner Sammlung hinzu.'
      )
    ).toBeInTheDocument();
  });

  it('rendert das Sammlungsraster mit Manga', () => {
    listState.list = [makeManga({ anilistId: 2, title: 'Sammlungs-Manga' })];
    render(<MangaPage />);
    expect(screen.getByText('1 Titel in deiner Sammlung')).toBeInTheDocument();
    expect(screen.getByText('Sammlung')).toBeInTheDocument();
    expect(screen.getByText('Sammlungs-Manga')).toBeInTheDocument();
  });

  it('zeigt den Ladezustand des Sammlungsrasters', () => {
    listState.list = [makeManga()];
    listState.loading = true;
    render(<MangaPage />);
    expect(screen.getByText('Sammlung wird geladen …')).toBeInTheDocument();
  });
});
