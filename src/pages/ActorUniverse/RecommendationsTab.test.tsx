// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RecommendationsTab } from './RecommendationsTab';

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

const recommendations = [
  {
    series: { id: 501, title: 'Better Call Saul', poster: null, voteAverage: 8.9 },
    actors: [
      { id: 1, name: 'Bob Odenkirk' },
      { id: 2, name: 'Rhea Seehorn' },
      { id: 3, name: 'Jonathan Banks' },
      { id: 4, name: 'Giancarlo Esposito' },
    ],
  },
];

afterEach(() => {
  cleanup();
  navigate.mockReset();
});

describe('RecommendationsTab', () => {
  it('renders the section header', () => {
    render(<RecommendationsTab recommendations={[]} loadingRecommendations={false} />);
    expect(screen.getByText('Basierend auf deinen Lieblings-Schauspielern')).toBeInTheDocument();
  });

  it('shows the empty state when there are no recommendations', () => {
    render(<RecommendationsTab recommendations={[]} loadingRecommendations={false} />);
    expect(screen.getByText('Keine Empfehlungen gefunden')).toBeInTheDocument();
  });

  it('renders a recommendation and navigates on click', () => {
    render(<RecommendationsTab recommendations={recommendations} loadingRecommendations={false} />);
    expect(screen.getByText('Better Call Saul')).toBeInTheDocument();
    expect(screen.getByText('4 deiner Schauspieler')).toBeInTheDocument();
    // shows +1 overflow chip for the 4th actor (first 3 shown)
    expect(screen.getByText('+1')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Better Call Saul'));
    expect(navigate).toHaveBeenCalledWith('/series/501');
  });
});
