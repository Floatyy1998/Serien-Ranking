// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ActorDetailModal } from './ActorDetailModal';
import type { Actor, ActorConnection } from '../../hooks/useActorUniverse';

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
vi.mock('../../contexts/ThemeContextDef', () => ({ useTheme: () => theme }));

const firebaseMock = vi.hoisted(() => ({
  default: {
    database: () => ({ ref: () => ({ update: vi.fn(), set: vi.fn(), remove: vi.fn() }) }),
  },
}));
vi.mock('firebase/compat/app', () => firebaseMock);
vi.mock('firebase/compat/database', () => ({}));

const cranston: Actor = {
  id: 1,
  name: 'Bryan Cranston',
  profilePath: null,
  seriesCount: 2,
  knownFor: '',
  popularity: 1,
  series: [{ id: 100, title: 'Breaking Bad', character: 'Walter White', poster: null }],
  recommendations: [
    { id: 200, title: 'Malcolm mittendrin', poster: null, character: 'Hal', voteAverage: 7.8 },
  ],
};
const paul: Actor = {
  id: 2,
  name: 'Aaron Paul',
  profilePath: null,
  seriesCount: 1,
  knownFor: '',
  popularity: 1,
  series: [],
  recommendations: [],
};

const connection: ActorConnection = {
  actor1Id: 1,
  actor2Id: 2,
  sharedSeries: [{ id: 100, title: 'Breaking Bad' }],
  strength: 3,
};

afterEach(() => {
  cleanup();
  navigate.mockReset();
});

describe('ActorDetailModal', () => {
  it('renders nothing when no actor is selected', () => {
    render(
      <ActorDetailModal
        selectedActor={null}
        actors={[cranston, paul]}
        onClose={vi.fn()}
        onSelectActor={vi.fn()}
        getActorConnections={() => []}
      />
    );
    expect(screen.queryByText('Bryan Cranston')).not.toBeInTheDocument();
  });

  it('renders the selected actor with series and character', () => {
    render(
      <ActorDetailModal
        selectedActor={cranston}
        actors={[cranston, paul]}
        onClose={vi.fn()}
        onSelectActor={vi.fn()}
        getActorConnections={() => []}
      />
    );
    expect(screen.getByText('Bryan Cranston')).toBeInTheDocument();
    expect(screen.getByText('2 Serien')).toBeInTheDocument();
    expect(screen.getByText('als Walter White')).toBeInTheDocument();
  });

  it('closes and navigates to the series when a series is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(
      <ActorDetailModal
        selectedActor={cranston}
        actors={[cranston, paul]}
        onClose={onClose}
        onSelectActor={vi.fn()}
        getActorConnections={() => []}
      />
    );
    const item = container.querySelector('.au-modal-series-item') as HTMLElement;
    fireEvent.click(item);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/series/100');
  });

  it('renders connected actors and selects one on click', () => {
    const onSelectActor = vi.fn();
    render(
      <ActorDetailModal
        selectedActor={cranston}
        actors={[cranston, paul]}
        onClose={vi.fn()}
        onSelectActor={onSelectActor}
        getActorConnections={() => [connection]}
      />
    );
    expect(screen.getByText('Spielt zusammen mit')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Aaron Paul'));
    expect(onSelectActor).toHaveBeenCalledWith(paul);
  });
});
