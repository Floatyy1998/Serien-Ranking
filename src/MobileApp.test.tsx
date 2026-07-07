// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

const { authValue } = vi.hoisted(() => ({
  authValue: { onboardingComplete: true as boolean },
}));

vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/' }),
  Routes: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Route: () => null,
  Navigate: () => <div data-testid="redirect" />,
}));
vi.mock('./components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('./components/layout', () => ({
  Layout: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  ScrollToTop: () => <div data-testid="scroll-top" />,
}));
vi.mock('./components/ui/LoadingSpinner', () => ({ LoadingSpinner: () => <div /> }));
vi.mock('./AuthContext', () => ({ useAuth: () => authValue }));
vi.mock('./contexts/OptimizedFriendsContext', () => ({
  useOptimizedFriends: () => ({
    unreadActivitiesCount: 0,
    unreadRequestsCount: 0,
    friendActivities: [],
    friendRequests: [],
  }),
}));
vi.mock('./contexts/NotificationContext', () => ({
  useNotifications: () => ({ unreadCount: 0, notifications: [] }),
}));
vi.mock('./hooks/useAdminHealthAlert', () => ({ useAdminHealthAlert: () => {} }));
vi.mock('./hooks/usePetGiftReceiver', () => ({ usePetGiftReceiver: () => {} }));
vi.mock('./hooks/useNetworkStatus', () => ({ useNetworkStatus: () => {} }));
vi.mock('./pages/BugReport/useBugReportData', () => ({ cleanupOldTickets: vi.fn() }));

vi.mock('./pages/HomePage', () => ({ HomePage: () => <div /> }));
vi.mock('./pages/WatchNext', () => ({ WatchNextPage: () => <div /> }));
vi.mock('./pages/Ratings', () => ({ RatingsPage: () => <div /> }));
vi.mock('./pages/Profile', () => ({ ProfilePage: () => <div /> }));
vi.mock('./pages/Search', () => ({ SearchPage: () => <div /> }));

vi.mock('./lazyRoutes', () => {
  const Stub = () => <div />;
  const names = [
    'SeriesDetailPage',
    'MovieDetailPage',
    'DiscoverPage',
    'ActivityPage',
    'StatsPage',
    'RecentlyWatchedPage',
    'BadgesPage',
    'PetsPage',
    'ThemePage',
    'HomeLayoutPage',
    'WrappedPage',
    'ActorUniversePage',
    'SettingsPage',
    'EpisodeManagementPage',
    'EpisodeDiscussionPage',
    'RatingEditorPage',
    'FriendProfilePage',
    'TasteMatchPage',
    'TasteProfilePage',
    'WatchJourneyPage',
    'CatchUpPage',
    'HiddenSeriesPage',
    'ImpressumPage',
    'PrivacyPage',
    'DiscussionFeedPage',
    'CountdownPage',
    'CalendarPage',
    'OnboardingPage',
    'LeaderboardPage',
    'PatchNotesPage',
    'AdminDashboardPage',
    'BugReportPage',
    'MangaPage',
    'MangaDetailPage',
    'MangaRatingsPage',
    'MangaSearchPage',
    'MangaCatchUpPage',
    'HiddenMangaPage',
    'RecentlyReadPage',
    'MangaStatsPage',
    'MangaDiscoverPage',
    'MangaReadJourneyPage',
    'MangaReadingListPage',
    'SubscriptionsPage',
    'AnimeSeasonPage',
    'SerienKalenderPage',
  ];
  return { ...Object.fromEntries(names.map((n) => [n, Stub])), preloadRoutes: vi.fn() };
});

import { MobileApp } from './MobileApp';

beforeEach(() => {
  authValue.onboardingComplete = true;
});

afterEach(() => cleanup());

describe('MobileApp', () => {
  it('renders the app shell without throwing', () => {
    render(<MobileApp />);
    expect(screen.getByTestId('scroll-top')).toBeInTheDocument();
  });

  it('redirects to onboarding when onboarding is incomplete', () => {
    authValue.onboardingComplete = false;
    render(<MobileApp />);
    expect(screen.getByTestId('redirect')).toBeInTheDocument();
    expect(screen.queryByTestId('scroll-top')).not.toBeInTheDocument();
  });
});
