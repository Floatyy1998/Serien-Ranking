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
import type { Friend } from '../../../types/Friend';

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

vi.mock('react-router-dom', () => ({ useNavigate: () => navigateMock }));

const social = vi.hoisted(() => ({
  favoriteIds: new Set<string>(),
  zustand: 'granted' as 'granted' | 'pending' | 'none',
  toggleFavoriteFriend: vi.fn(async () => {}),
  requestShare: vi.fn(async () => true),
}));
vi.mock('../../../contexts/OptimizedFriendsContext', () => ({
  useOptimizedFriends: () => ({
    favoriteIds: social.favoriteIds,
    toggleFavoriteFriend: social.toggleFavoriteFriend,
    requestShare: social.requestShare,
    shareState: () => social.zustand,
  }),
}));
vi.mock('../../../contexts/ThemeContext', () => {
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
vi.mock('../../../components/ui', () => ({
  NameBadges: () => null,
  EmptyState: ({
    title,
    action,
  }: {
    title: string;
    action?: { label: string; onClick: () => void };
  }) => (
    <div>
      <span>{title}</span>
      {action && <button onClick={action.onClick}>{action.label}</button>}
    </div>
  ),
}));

import { FriendsTab } from './FriendsTab';

const friend = (uid: string, name: string): Friend => ({
  uid,
  email: `${uid}@x.de`,
  username: name.toLowerCase(),
  displayName: name,
  friendsSince: 0,
});

/** Ein Freund, damit die Zustands-Anzeige neben ihm geprueft werden kann. */
const renderTab = () =>
  render(
    <FriendsTab
      friends={[friend('f1', 'Frank')]}
      friendProfiles={{}}
      saveScrollPosition={vi.fn()}
      onAddFriend={vi.fn()}
      onRemoveFriend={vi.fn()}
    />
  );

beforeEach(() => {
  navigateMock.mockReset();
  social.favoriteIds = new Set();
  social.zustand = 'granted';
  social.toggleFavoriteFriend.mockClear();
  social.requestShare.mockClear();
});
afterEach(() => cleanup());

describe('FriendsTab', () => {
  it('renders the empty state with an add action when there are no friends', () => {
    const onAddFriend = vi.fn();
    render(
      <FriendsTab
        friends={[]}
        friendProfiles={{}}
        saveScrollPosition={vi.fn()}
        onAddFriend={onAddFriend}
        onRemoveFriend={vi.fn()}
      />
    );
    expect(screen.getByText('Noch keine Freunde')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Freund hinzufügen'));
    expect(onAddFriend).toHaveBeenCalledTimes(1);
  });

  it('lists friends and filters them by the search query', () => {
    render(
      <FriendsTab
        friends={[friend('u1', 'Frank'), friend('u2', 'Berta')]}
        friendProfiles={{}}
        saveScrollPosition={vi.fn()}
        onAddFriend={vi.fn()}
        onRemoveFriend={vi.fn()}
      />
    );
    expect(screen.getByText('Frank')).toBeInTheDocument();
    expect(screen.getByText('Berta')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('2 Freunde durchsuchen'), {
      target: { value: 'fra' },
    });
    expect(screen.getByText('Frank')).toBeInTheDocument();
    expect(screen.queryByText('Berta')).not.toBeInTheDocument();
  });

  it('calls onRemoveFriend when a friend remove button is pressed', () => {
    const onRemoveFriend = vi.fn();
    render(
      <FriendsTab
        friends={[friend('u1', 'Frank')]}
        friendProfiles={{}}
        saveScrollPosition={vi.fn()}
        onAddFriend={vi.fn()}
        onRemoveFriend={onRemoveFriend}
      />
    );
    fireEvent.click(screen.getByLabelText('Frank entfernen'));
    expect(onRemoveFriend).toHaveBeenCalledWith({ uid: 'u1', name: 'Frank' });
  });

  it('zeigt bei offener Bitte „wartet" und keinen Frage-Knopf', () => {
    social.favoriteIds = new Set(['f1']);
    social.zustand = 'pending';
    renderTab();
    expect(screen.getByText('wartet')).toBeInTheDocument();
    expect(screen.queryByText(/Kein Zugriff/)).not.toBeInTheDocument();
  });

  it('bietet nach einer Absage erneutes Fragen an — kein toter Zustand', () => {
    // Genau die Falle: frueher blieb hier ewig die Sanduhr stehen.
    social.favoriteIds = new Set(['f1']);
    social.zustand = 'none';
    renderTab();
    expect(screen.queryByText('wartet')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText(/Kein Zugriff/));
    expect(social.requestShare).toHaveBeenCalledWith('f1');
  });

  it('zeigt bei erteiltem Einblick gar keinen Hinweis', () => {
    social.favoriteIds = new Set(['f1']);
    social.zustand = 'granted';
    renderTab();
    expect(screen.queryByText('wartet')).not.toBeInTheDocument();
    expect(screen.queryByText(/Kein Zugriff/)).not.toBeInTheDocument();
  });

  it('faerbt den Stern nur bei tatsaechlichem Einblick golden', () => {
    // Ein goldener Stern neben „Kein Zugriff" liest sich als Erfolgsmeldung
    // und widerspricht dem Hinweis daneben.
    social.favoriteIds = new Set(['f1']);
    social.zustand = 'granted';
    const { unmount } = renderTab();
    const gold = screen.getByLabelText(/nicht mehr als Favorit/).getAttribute('style');
    unmount();

    social.zustand = 'none';
    renderTab();
    const gedaempft = screen.getByLabelText(/nicht mehr als Favorit/).getAttribute('style');

    expect(gedaempft).not.toEqual(gold);
  });
});
