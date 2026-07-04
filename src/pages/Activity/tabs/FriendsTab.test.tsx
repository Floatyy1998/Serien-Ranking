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
vi.mock('../../../contexts/ThemeContextDef', () => {
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

beforeEach(() => navigateMock.mockReset());
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
});
