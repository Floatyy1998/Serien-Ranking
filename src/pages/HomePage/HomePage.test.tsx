// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

// Mutable auth state so we can toggle the "no user" redirect branch.
const authState = vi.hoisted(() => ({
  value: { user: { uid: 'u1', displayName: 'Konrad', photoURL: null } } as unknown,
}));

vi.mock('firebase/compat/app', () => ({
  default: {
    database: () => ({
      ref: () => ({
        once: () => Promise.resolve({ val: () => null }),
        on: vi.fn(),
        off: vi.fn(),
      }),
    }),
  },
}));
vi.mock('firebase/compat/database', () => ({}));

const navigate = vi.fn<(to: string) => void>();
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));

vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => authState.value }));
vi.mock('../../contexts/ThemeContext', async () => {
  const actual = await import('../../theme/dynamicTheme');
  return { useTheme: () => ({ currentTheme: actual.defaultDynamicTheme }) };
});

vi.mock('../../contexts/SeriesListContext', () => ({
  useSeriesList: () => ({
    seriesWithNewSeasons: [],
    inactiveSeries: [],
    inactiveRewatches: [],
    completedSeries: [],
    unratedSeries: [],
    providerChanges: [],
    clearNewSeasons: vi.fn(),
    clearInactiveSeries: vi.fn(),
    clearInactiveRewatches: vi.fn(),
    clearCompletedSeries: vi.fn(),
    clearUnratedSeries: vi.fn(),
    clearProviderChanges: vi.fn(),
  }),
}));

// --- data hooks ---
vi.mock('../../hooks/useEpisodeSwipeHandlers', () => ({
  useEpisodeSwipeHandlers: () => ({
    continueWatching: [],
    swipingContinueEpisodes: new Set<string>(),
    setSwipingContinueEpisodes: vi.fn(),
    dragOffsetsContinue: {},
    setDragOffsetsContinue: vi.fn(),
    completingContinueEpisodes: new Set<string>(),
    hiddenContinueEpisodes: new Set<string>(),
    handleContinueEpisodeComplete: vi.fn(),
    todayEpisodes: [],
    swipingEpisodes: new Set<string>(),
    setSwipingEpisodes: vi.fn(),
    dragOffsetsEpisodes: {},
    setDragOffsetsEpisodes: vi.fn(),
    completingEpisodes: new Set<string>(),
    hiddenEpisodes: new Set<string>(),
    handleEpisodeComplete: vi.fn(),
    swipeDirections: {},
    quickRatingOpen: false,
    quickRatingSeries: null,
    quickRatingSeasonNumber: 0,
    closeQuickRating: vi.fn(),
    saveQuickRating: vi.fn(async () => {}),
  }),
}));
vi.mock('./useRewatchHandler', () => ({
  useRewatchHandler: () => ({
    rewatchEpisodes: [],
    completingRewatches: new Set<string>(),
    hiddenRewatches: new Set<string>(),
    swipingRewatches: new Set<string>(),
    dragOffsetsRewatches: {},
    rewatchSwipeDirections: {},
    handleRewatchComplete: vi.fn(),
    handleRewatchSwipeStart: vi.fn(),
    handleRewatchSwipeDrag: vi.fn(),
    handleRewatchSwipeEnd: vi.fn(),
  }),
}));
vi.mock('../../hooks/useProactiveRecaps', () => ({
  useProactiveRecaps: () => ({ recaps: [], dismiss: vi.fn(), fetchRecap: vi.fn(async () => {}) }),
}));
vi.mock('../../hooks/useSeasonalRecommendations', () => ({
  useSeasonalRecommendations: () => ({
    items: [],
    title: 'Saisonal',
    iconColor: '#fff',
    loading: false,
  }),
}));
vi.mock('../../hooks/useSeriesCountdowns', () => ({
  useSeriesCountdowns: () => ({ countdowns: [] }),
}));
vi.mock('../../hooks/useUnsubscribedNewSeasons', () => ({
  useUnsubscribedNewSeasons: () => ({ entries: [], dismiss: vi.fn() }),
}));
vi.mock('../../hooks/useTMDBTrending', () => ({
  useTMDBTrending: () => ({ trending: [], loading: false }),
}));
vi.mock('../../hooks/useTopRated', () => ({ useTopRated: () => [] }));
vi.mock('../../hooks/useWebWorkerStatsOptimized', () => ({
  useWebWorkerStatsOptimized: () => ({
    watchedEpisodes: 0,
    totalMovies: 0,
    progress: 0,
    todayEpisodes: 0,
  }),
}));
vi.mock('./useHomeConfig', () => ({
  useHomeConfig: () => ({
    visibleSections: [],
    forYouOrder: [],
    hiddenForYou: [],
    quickActionsOrder: [],
    hiddenQuickActions: [],
    secondaryActionsOrder: [],
    hiddenSecondaryActions: [],
  }),
}));
vi.mock('./useUnifiedNotifications', () => ({
  useUnifiedNotifications: () => ({
    unifiedNotifications: [],
    totalUnreadBadge: 0,
    dismissAnnouncement: vi.fn(),
    handleMarkAllNotificationsRead: vi.fn(),
    markAsRead: vi.fn(),
    acceptFriendRequest: vi.fn(),
    declineFriendRequest: vi.fn(),
    acceptRecommendation: vi.fn(),
    declineRecommendation: vi.fn(),
  }),
}));

// --- child components: shallow stubs so nothing heavy mounts ---
vi.mock('../../components/ui', () => ({ SectionHeader: () => null }));
vi.mock('../../components/ui/QuickRatingSheet', () => ({ QuickRatingSheet: () => null }));
vi.mock('../../components/pet/CaseOpeningOverlay', () => ({ CaseOpeningOverlay: () => null }));
vi.mock('./SeriesNotificationHub', () => ({ SeriesNotificationHub: () => null }));
vi.mock('./CatchUpCard', () => ({ CatchUpCard: () => null }));
vi.mock('./CountdownBanner', () => ({ CountdownBanner: () => null }));
vi.mock('./HiddenSeriesCard', () => ({ HiddenSeriesCard: () => null }));
vi.mock('./HomeActionSections', () => ({
  QuickActionsSection: () => null,
  SecondaryActionsSection: () => null,
}));
vi.mock('./NotificationSheet', () => ({ NotificationSheet: () => null }));
vi.mock('./PosterNavSheet', () => ({ PosterNavSheet: () => null }));
vi.mock('./StatsGrid', () => ({ StatsGrid: () => null }));
vi.mock('./TasteMatchCard', () => ({ TasteMatchCard: () => null }));
vi.mock('./TasteProfileCard', () => ({ TasteProfileCard: () => null }));
vi.mock('./WatchJourneyCard', () => ({ WatchJourneyCard: () => null }));
vi.mock('./WatchStreakCard', () => ({ WatchStreakCard: () => null }));
vi.mock('./DailySpinCard', () => ({ DailySpinCard: () => null }));
vi.mock('./StreamingReminderCard', () => ({ StreamingReminderCard: () => null }));
vi.mock('./ActivityMarquee', () => ({ ActivityMarquee: () => null }));
vi.mock('./MilestoneBoxCard', () => ({ MilestoneBoxCard: () => null }));
vi.mock('./WrappedNotification', () => ({ WrappedNotification: () => null }));
vi.mock('./sections/GreetingSection', () => ({
  GreetingSection: () => <div data-testid="greeting" />,
}));
vi.mock('./sections/ContinueWatchingSection', () => ({ ContinueWatchingSection: () => null }));
vi.mock('./sections/RewatchSection', () => ({ RewatchSection: () => null }));
vi.mock('./sections/TodayEpisodesSection', () => ({ TodayEpisodesSection: () => null }));
vi.mock('./sections/MediaCarouselSection', () => ({ MediaCarouselSection: () => null }));

import { HomePage } from './HomePage';

afterEach(() => {
  cleanup();
  navigate.mockReset();
  authState.value = { user: { uid: 'u1', displayName: 'Konrad', photoURL: null } };
});

describe('HomePage (shallow smoke)', () => {
  it('renders for an authenticated user without throwing', () => {
    render(<HomePage />);
    expect(screen.getByTestId('greeting')).toBeInTheDocument();
  });

  it('shows the redirect placeholder when there is no auth context', () => {
    authState.value = null;
    render(<HomePage />);
    expect(screen.getByText('Redirecting...')).toBeInTheDocument();
  });
});
