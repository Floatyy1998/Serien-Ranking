// @vitest-environment jsdom
import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ADMIN_UID } from '../../config/admin';

/* useProfileData bündelt viele Contexts. Alle Context-Hooks + Firebase-Auth
 * + useEnhancedFirebaseCache werden gemockt; computeStats (echt) läuft über
 * die echten Serien-/Film-Daten. */
const state = vi.hoisted(() => ({
  user: null as { uid: string; displayName?: string; photoURL?: string } | null,
  userData: undefined as unknown,
  allSeriesList: [] as unknown[],
  movieList: [] as unknown[],
  mangaList: [] as unknown[],
  unreadActivitiesCount: 0,
  unreadRequestsCount: 0,
  unreadBadgesCount: 0,
  navigate: vi.fn<(to: string) => void>(),
  signOut: vi.fn<() => Promise<void>>(() => Promise.resolve()),
}));

const theme = vi.hoisted(() => ({
  primary: '#p',
  secondary: '#s',
  accent: '#a',
  status: { warning: '#w', error: '#e', success: '#su' },
  text: { primary: '#tp', secondary: '#ts' },
}));

vi.mock('firebase/compat/app', () => ({
  default: { auth: () => ({ signOut: state.signOut }) },
}));
vi.mock('firebase/compat/auth', () => ({}));
vi.mock('react-router-dom', () => ({ useNavigate: () => state.navigate }));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: state.user }) }));
vi.mock('../../contexts/ThemeContext', () => ({ useTheme: () => ({ currentTheme: theme }) }));
vi.mock('../../contexts/SeriesListContext', () => ({
  useSeriesList: () => ({ allSeriesList: state.allSeriesList }),
}));
vi.mock('../../contexts/MovieListContext', () => ({
  useMovieList: () => ({ movieList: state.movieList }),
}));
vi.mock('../../contexts/MangaListContext', () => ({
  useMangaList: () => ({ mangaList: state.mangaList }),
}));
vi.mock('../../contexts/OptimizedFriendsContext', () => ({
  useOptimizedFriends: () => ({
    unreadActivitiesCount: state.unreadActivitiesCount,
    unreadRequestsCount: state.unreadRequestsCount,
  }),
}));
vi.mock('../../features/badges/BadgeContext', () => ({
  useBadges: () => ({ unreadBadgesCount: state.unreadBadgesCount }),
}));
vi.mock('../../hooks/useEnhancedFirebaseCache', () => ({
  useEnhancedFirebaseCache: () => ({ data: state.userData }),
}));

import { useProfileData } from './useProfileData';

beforeEach(() => {
  state.user = { uid: 'me', displayName: 'Me' };
  state.userData = { username: 'me' };
  state.allSeriesList = [];
  state.movieList = [];
  state.mangaList = [];
  state.unreadActivitiesCount = 0;
  state.unreadRequestsCount = 0;
  state.unreadBadgesCount = 0;
  state.navigate.mockReset();
  state.signOut.mockReset();
  state.signOut.mockResolvedValue(undefined);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('useProfileData - computeStats', () => {
  it('zählt gesehene, ausgestrahlte Episoden und Minuten (inkl. watchCount)', () => {
    state.allSeriesList = [
      {
        episodeRuntime: 30,
        seasons: [
          {
            episodes: [
              { watched: true, air_date: '2000-01-01', watchCount: 2 },
              { watched: true, air_date: '2000-01-02' },
              { watched: false, air_date: '2000-01-03' },
            ],
          },
        ],
      },
    ];
    state.movieList = [{ rating: { Drama: 8 }, runtime: 90 }];

    const { result } = renderHook(() => useProfileData());
    const stats = result.current.stats;
    expect(stats.totalSeries).toBe(1);
    expect(stats.totalMovies).toBe(1);
    expect(stats.watchedEpisodes).toBe(2);
    // 30*2 (rewatch) + 30*1 + Film 90 = 180
    expect(stats.totalMinutes).toBe(180);
    expect(stats.timeString).toContain('S');
  });

  it('liefert 0Min bei leeren Listen', () => {
    const { result } = renderHook(() => useProfileData());
    expect(result.current.stats.totalMinutes).toBe(0);
    expect(result.current.stats.timeString).toBe('0Min');
  });
});

describe('useProfileData - Menüs & Aktionen', () => {
  it('setzt das Aktivitäts-Badge aus Activities + Requests', () => {
    state.unreadActivitiesCount = 2;
    state.unreadRequestsCount = 3;
    const { result } = renderHook(() => useProfileData());
    const activity = result.current.menuItems.find((m) => m.path === '/activity');
    expect(activity?.badge).toBe(5);
  });

  it('zeigt erweiterte Manga-Menüpunkte nur bei nicht-leerer Manga-Liste', () => {
    const { result: empty } = renderHook(() => useProfileData());
    const emptyLen = empty.current.mangaMenuItems.length;

    state.mangaList = [{ id: 1 }];
    const { result: filled } = renderHook(() => useProfileData());
    expect(filled.current.mangaMenuItems.length).toBeGreaterThan(emptyLen);
  });

  it('blendet das Admin-Panel nur für die Admin-UID ein', () => {
    const { result: normal } = renderHook(() => useProfileData());
    expect(normal.current.settingsItems.some((i) => i.path === '/admin')).toBe(false);

    state.user = { uid: ADMIN_UID };
    const { result: admin } = renderHook(() => useProfileData());
    expect(admin.current.settingsItems.some((i) => i.path === '/admin')).toBe(true);
  });

  it('handleLogout meldet ab und navigiert zur Startseite', async () => {
    const { result } = renderHook(() => useProfileData());
    await result.current.handleLogout();
    expect(state.signOut).toHaveBeenCalled();
    expect(state.navigate).toHaveBeenCalledWith('/');
  });

  it('goTo navigiert zum übergebenen Pfad', () => {
    const { result } = renderHook(() => useProfileData());
    result.current.goTo('/stats');
    expect(state.navigate).toHaveBeenCalledWith('/stats');
  });
});
