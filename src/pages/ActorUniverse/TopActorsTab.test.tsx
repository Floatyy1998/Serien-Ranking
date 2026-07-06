// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TopActorsTab } from './TopActorsTab';
import type { Actor } from '../../hooks/useActorUniverse';

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

const makeActor = (id: number, name: string, seriesCount: number): Actor => ({
  id,
  name,
  profilePath: null,
  seriesCount,
  knownFor: '',
  popularity: 1,
  series: [],
  recommendations: [],
});

const topActors = [
  makeActor(1, 'Bryan Cranston', 5),
  makeActor(2, 'Aaron Paul', 4),
  makeActor(3, 'Bob Odenkirk', 3),
];

afterEach(() => {
  cleanup();
});

describe('TopActorsTab', () => {
  it('renders the heading and top actor names', () => {
    render(<TopActorsTab topActors={topActors} actors={topActors} onSelectActor={vi.fn()} />);
    expect(screen.getByText('Deine meistgesehenen Schauspieler')).toBeInTheDocument();
    expect(screen.getByText('Bryan Cranston')).toBeInTheDocument();
    expect(screen.getByText('5 Serien')).toBeInTheDocument();
  });

  it('calls onSelectActor when a top actor is clicked', () => {
    const onSelectActor = vi.fn();
    render(<TopActorsTab topActors={topActors} actors={topActors} onSelectActor={onSelectActor} />);
    fireEvent.click(screen.getByText('Aaron Paul'));
    expect(onSelectActor).toHaveBeenCalledWith(topActors[1]);
  });
});
