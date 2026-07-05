// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SubscriptionsPage } from './SubscriptionsPage';
import type { ProviderInsight } from '../../types/Subscription';
import type { UseSubscriptionsDataResult } from '../../hooks/useSubscriptionsData';

vi.mock('@mui/icons-material', () => {
  const stub = () => null;
  return Object.fromEntries(
    [
      'AccessTime',
      'Add',
      'Analytics',
      'ArrowBack',
      'ArrowUpward',
      'AutoAwesome',
      'AutoStories',
      'Bookmark',
      'Check',
      'CheckCircle',
      'CheckCircleOutline',
      'ChevronLeft',
      'ChevronRight',
      'Close',
      'CloudSync',
      'DesktopWindows',
      'DragHandle',
      'EmojiEvents',
      'ErrorOutline',
      'ExpandLess',
      'ExpandMore',
      'FilterList',
      'Login',
      'Movie',
      'NewReleases',
      'Notifications',
      'NotificationsActive',
      'NotificationsNone',
      'OpenInNew',
      'People',
      'Person',
      'PersonAdd',
      'PlaylistAdd',
      'PlaylistAddCheck',
      'PlaylistRemove',
      'RecordVoiceOver',
      'Save',
      'Schedule',
      'Search',
      'Send',
      'SentimentDissatisfied',
      'SentimentNeutral',
      'SentimentSatisfied',
      'SentimentVeryDissatisfied',
      'SentimentVerySatisfied',
      'Settings',
      'SnoozeOutlined',
      'Speed',
      'Star',
      'StarOutline',
      'Stop',
      'Subscriptions',
      'SwapHoriz',
      'TrendingUp',
      'Tv',
      'VolumeUp',
      'Warning',
      'ZoomIn',
      'ZoomOut',
    ].map((n) => [n, stub])
  );
});

const navigate = vi.hoisted(() => vi.fn());
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
  useLocation: () => ({ pathname: '/subscriptions' }),
  Link: ({ to, children }: { to: string; children?: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

const theme = vi.hoisted(() => ({
  currentTheme: {
    primary: '#00d123',
    secondary: '#8b5cf6',
    accent: '#8b5cf6',
    background: { default: '#000', surface: '#111', surfaceHover: '#222', card: '#0a0a0a' },
    text: { primary: '#fff', secondary: '#ddd', muted: '#999' },
    border: { default: '#333' },
    status: { success: '#4caf50', warning: '#f59e0b', error: '#ef4444' },
  },
}));
vi.mock('../../contexts/ThemeContextDef', () => ({ useTheme: () => theme }));

const firebaseMock = vi.hoisted(() => ({
  default: {
    database: () => ({ ref: () => ({ update: vi.fn(), set: vi.fn(), remove: vi.fn() }) }),
  },
}));
vi.mock('firebase/compat/app', () => firebaseMock);
vi.mock('firebase/compat/database', () => ({}));

vi.mock('../../hooks/useProviderLogos', () => ({
  useProviderLogos: () => ({}),
  tmdbLogoUrl: () => undefined,
}));

const data = vi.hoisted(() => ({ overrides: {} as Record<string, unknown> }));

const netflix: ProviderInsight = {
  name: 'Netflix',
  active: true,
  monthlyPrice: 12.99,
  cancelIfUnused: false,
  lastWatchedAt: Date.now(),
  daysSinceLastWatch: 1,
  recentCount: 2,
  isUnused: false,
  lastWatchTitle: 'Stranger Things',
  recentWatches: [],
};

vi.mock('../../hooks/useSubscriptionsData', () => ({
  useSubscriptionsData: (): UseSubscriptionsDataResult =>
    ({
      loading: false,
      config: { providers: {} },
      insights: [netflix],
      activeInsights: [netflix],
      unusedInsights: [],
      totalMonthlySpend: 12.99,
      wastedMonthlySpend: 0,
      watchlistGaps: [],
      newSeasonGaps: [],
      unusedThresholdDays: 60,
      setUnusedThreshold: vi.fn(() => Promise.resolve()),
      updateProvider: vi.fn(() => Promise.resolve()),
      setSeriesOverride: vi.fn(() => Promise.resolve()),
      seriesOverrides: {},
      ...data.overrides,
    }) as UseSubscriptionsDataResult,
}));

afterEach(() => {
  cleanup();
  navigate.mockReset();
  data.overrides = {};
});

describe('SubscriptionsPage', () => {
  it('renders the page header and active subscription', () => {
    render(<SubscriptionsPage />);
    expect(screen.getByText('Streaming-Abos')).toBeInTheDocument();
    expect(screen.getByText('Deine Abos')).toBeInTheDocument();
    expect(screen.getByText('1 aktiv')).toBeInTheDocument();
    expect(screen.getByText('Netflix')).toBeInTheDocument();
  });

  it('shows the empty state when there are no active subscriptions', () => {
    data.overrides = { insights: [], activeInsights: [] };
    render(<SubscriptionsPage />);
    expect(screen.getByText('Noch keine Abos markiert')).toBeInTheDocument();
    expect(
      screen.getByText('Wähle unten aus, welche Streaming-Dienste du gerade abonniert hast.')
    ).toBeInTheDocument();
  });
});
