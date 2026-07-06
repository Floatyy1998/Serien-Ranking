// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

// framer-motion passthrough: the real lib throws on unmount in jsdom
// ("removeOnChange is not a function"). Strip motion-only props, render plain tags.
vi.mock('framer-motion', async () => {
  const React = await import('react');
  const skip = new Set([
    'initial',
    'animate',
    'exit',
    'transition',
    'variants',
    'layout',
    'layoutId',
    'whileTap',
    'whileHover',
    'whileInView',
    'whileFocus',
    'whileDrag',
    'viewport',
    'drag',
    'dragConstraints',
    'dragElastic',
    'dragMomentum',
    'dragSnapToOrigin',
    'onDragEnd',
  ]);
  const make = (tag: string) =>
    React.forwardRef(function Motion(props: Record<string, unknown>, ref: unknown) {
      const clean: Record<string, unknown> = { ref };
      for (const k in props) if (!skip.has(k)) clean[k] = props[k];
      return React.createElement(tag, clean);
    });
  const motion = new Proxy({} as Record<string, unknown>, { get: (_t, tag) => make(String(tag)) });
  return {
    motion,
    AnimatePresence: (props: Record<string, unknown>) =>
      React.createElement(React.Fragment, null, props.children as React.ReactNode),
    useReducedMotion: () => true,
    useDragControls: () => ({ start: () => {} }),
  };
});

const { navigateMock, friendsValue, notificationsValue } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  friendsValue: {
    friends: [],
    friendRequests: [],
    sentRequests: [],
    friendActivities: [],
    unreadActivitiesCount: 0,
    unreadRequestsCount: 0,
    markActivitiesAsRead: vi.fn(),
    markRequestsAsRead: vi.fn(),
    acceptFriendRequest: vi.fn(),
    declineFriendRequest: vi.fn(),
    cancelFriendRequest: vi.fn(),
    removeFriend: vi.fn<() => Promise<void>>(),
  },
  notificationsValue: { notifications: [], markAsRead: vi.fn() },
}));

vi.mock('react-router-dom', () => ({ useNavigate: () => navigateMock }));
vi.mock('../../hooks/useScrollRestore', () => ({
  useScrollRestore: () => ({ saveNow: vi.fn() }),
}));
vi.mock('../../contexts/NotificationContext', () => ({
  useNotifications: () => notificationsValue,
}));
vi.mock('../../contexts/OptimizedFriendsContext', () => ({
  useOptimizedFriends: () => friendsValue,
}));
vi.mock('../../contexts/ThemeContext', () => {
  const make = (): unknown =>
    new Proxy(() => '#3355ff', {
      get: (_t, prop) => {
        if (prop === Symbol.toPrimitive || prop === 'toString' || prop === 'valueOf')
          return () => '#3355ff';
        return make();
      },
    });
  return { useTheme: () => ({ currentTheme: make() }) };
});
vi.mock('../../theme/colorUtils', () => ({ getOptimalTextColor: () => '#ffffff' }));
vi.mock('./useActivityFriendProfiles', () => ({
  useActivityFriendProfiles: () => ({ friendProfiles: {}, requestProfiles: {} }),
}));

vi.mock('../../components/ui', () => ({
  PageHeader: ({ title, actions }: { title: string; actions?: React.ReactNode }) => (
    <div>
      <h1>{title}</h1>
      {actions}
    </div>
  ),
  IconContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ScrollToTopButton: () => <div data-testid="scroll-top" />,
}));

vi.mock('./tabs/ActivityFeedTab', () => ({ ActivityFeedTab: () => <div>FEED_TAB</div> }));
vi.mock('./tabs/FriendsTab', () => ({ FriendsTab: () => <div>FRIENDS_TAB</div> }));
vi.mock('./tabs/RequestsTab', () => ({ RequestsTab: () => <div>REQUESTS_TAB</div> }));
vi.mock('./tabs/DiscussionsTab', () => ({ DiscussionsTab: () => <div>DISCUSSIONS_TAB</div> }));
vi.mock('./AddFriendDialog', () => ({ AddFriendDialog: () => <div data-testid="add-dialog" /> }));
vi.mock('./RemoveFriendSheet', () => ({
  RemoveFriendSheet: () => <div data-testid="remove-sheet" />,
}));

import { ActivityPage } from './ActivityPage';

beforeEach(() => {
  navigateMock.mockReset();
});

afterEach(() => cleanup());

describe('ActivityPage', () => {
  it('renders the page header and default feed tab', () => {
    render(<ActivityPage />);
    expect(screen.getByText('Aktivität')).toBeInTheDocument();
    expect(screen.getByText('FEED_TAB')).toBeInTheDocument();
  });

  it('renders all four navigation tabs', () => {
    render(<ActivityPage />);
    expect(screen.getByRole('tab', { name: 'Feed' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Freunde' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Anfragen' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Chat' })).toBeInTheDocument();
  });

  it('switches to the friends tab when its nav button is clicked', () => {
    render(<ActivityPage />);
    fireEvent.click(screen.getByRole('tab', { name: 'Freunde' }));
    expect(screen.getByText('FRIENDS_TAB')).toBeInTheDocument();
  });
});
