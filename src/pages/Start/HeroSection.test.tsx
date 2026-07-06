// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HeroSection } from './HeroSection';

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

vi.mock('react-router-dom', () => ({
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

beforeEach(() => {
  (window as unknown as { electronAPI?: unknown }).electronAPI = undefined;
});

afterEach(() => {
  cleanup();
});

describe('HeroSection', () => {
  it('renders the brand name and tagline', () => {
    render(<HeroSection />);
    expect(screen.getByText('TV-RANK')).toBeInTheDocument();
    expect(screen.getByText('Serien, Film & Manga Tracker')).toBeInTheDocument();
  });

  it('renders the register and login CTAs with correct links', () => {
    render(<HeroSection />);
    expect(screen.getByRole('link', { name: /Kostenlos starten/ })).toHaveAttribute(
      'href',
      '/register'
    );
    expect(screen.getByRole('link', { name: /Anmelden/ })).toHaveAttribute('href', '/login');
  });

  it('shows the desktop download button outside Electron', () => {
    render(<HeroSection />);
    expect(screen.getByRole('link', { name: /Desktop App herunterladen/ })).toBeInTheDocument();
  });

  it('hides the desktop download button inside Electron', () => {
    (window as unknown as { electronAPI?: { isElectron: boolean } }).electronAPI = {
      isElectron: true,
    };
    render(<HeroSection />);
    expect(
      screen.queryByRole('link', { name: /Desktop App herunterladen/ })
    ).not.toBeInTheDocument();
  });
});
