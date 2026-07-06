// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Actor } from '../../hooks/useActorUniverse';
import { ActorUniversePage } from './ActorUniversePage';

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
  useLocation: () => ({ pathname: '/actor-universe' }),
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
vi.mock('../../contexts/ThemeContext', () => ({ useTheme: () => theme }));

const firebaseMock = vi.hoisted(() => ({
  default: {
    database: () => ({ ref: () => ({ update: vi.fn(), set: vi.fn(), remove: vi.fn() }) }),
  },
}));
vi.mock('firebase/compat/app', () => firebaseMock);
vi.mock('firebase/compat/database', () => ({}));

const mocks = vi.hoisted(() => ({
  setActiveTab: vi.fn(),
  toggleVoiceActors: vi.fn(),
  setSelectedActor: vi.fn(),
  setHoveredActor: vi.fn(),
  getActorConnections: vi.fn(() => []),
  overrides: {} as Record<string, unknown>,
}));

const baseActor = {
  id: 1,
  name: 'Bryan Cranston',
  profilePath: null,
  seriesCount: 3,
  knownFor: '',
  popularity: 1,
  series: [],
  recommendations: [],
} as Actor;

vi.mock('./useActorUniverseData', () => ({
  useActorUniverseData: () => ({
    actors: [baseActor],
    connections: [],
    topActors: [baseActor],
    recommendations: [],
    stats: { totalActors: 12, actorsInMultipleSeries: 4, mostConnectedPair: null },
    loading: false,
    progress: 0,
    loadingRecommendations: false,
    hideVoiceActors: false,
    toggleVoiceActors: mocks.toggleVoiceActors,
    selectedActor: null,
    setSelectedActor: mocks.setSelectedActor,
    hoveredActor: null,
    setHoveredActor: mocks.setHoveredActor,
    activeTab: 'recommendations',
    setActiveTab: mocks.setActiveTab,
    getActorConnections: mocks.getActorConnections,
    ...mocks.overrides,
  }),
}));

afterEach(() => {
  cleanup();
  navigate.mockReset();
  mocks.setActiveTab.mockReset();
  mocks.toggleVoiceActors.mockReset();
  mocks.overrides = {};
});

describe('ActorUniversePage', () => {
  it('renders the header title and actor stats', () => {
    render(<ActorUniversePage />);
    expect(screen.getByText('Actor Universe')).toBeInTheDocument();
    expect(screen.getByText('12 Schauspieler • 4 in mehreren Serien')).toBeInTheDocument();
  });

  it('changes the active tab when a tab is clicked', () => {
    render(<ActorUniversePage />);
    fireEvent.click(screen.getByText('Top Actors'));
    expect(mocks.setActiveTab).toHaveBeenCalledWith('top');
  });

  it('toggles voice actors from the toggle button', () => {
    render(<ActorUniversePage />);
    fireEvent.click(screen.getByTitle('Voice Actors ausblenden'));
    expect(mocks.toggleVoiceActors).toHaveBeenCalledTimes(1);
  });

  it('shows the loading screen while loading with no actors', () => {
    mocks.overrides = { loading: true, actors: [], progress: 42 };
    render(<ActorUniversePage />);
    expect(screen.getByText('42% - Sammle Schauspieler-Daten')).toBeInTheDocument();
  });
});
