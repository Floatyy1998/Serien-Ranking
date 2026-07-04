// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
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
import type { FriendActivity } from '../../types/Friend';
import { ActiveFriendsRow } from './ActiveFriendsRow';

const theme = {
  primary: '#00d123',
  accent: '#00a0ff',
  text: { secondary: '#dddddd', muted: '#999999' },
  background: { default: '#000000', surface: '#111111' },
};

const act = (id: string, userId: string): FriendActivity => ({
  id,
  userId,
  userName: `User ${userId}`,
  type: 'series_added',
  itemTitle: 'Lost',
  timestamp: 1000,
});

afterEach(() => cleanup());

describe('ActiveFriendsRow', () => {
  it('returns nothing when there are no activities', () => {
    const { container } = render(
      <ActiveFriendsRow
        activities={[]}
        resolveUser={() => ({ name: 'x' })}
        theme={theme}
        onSelect={() => {}}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders one entry per unique user with a first-name label', () => {
    const resolveUser = vi.fn((uid: string) => ({ name: `Frank ${uid}` }));
    render(
      <ActiveFriendsRow
        activities={[act('a1', 'u1'), act('a2', 'u1'), act('a3', 'u2')]}
        resolveUser={resolveUser}
        theme={theme}
        onSelect={() => {}}
      />
    );
    // Two unique users → two list items.
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByLabelText('Profil von Frank u1')).toBeInTheDocument();
  });

  it('calls onSelect with the userId when a friend is tapped', () => {
    const onSelect = vi.fn();
    render(
      <ActiveFriendsRow
        activities={[act('a1', 'u1')]}
        resolveUser={(uid) => ({ name: `Frank ${uid}` })}
        theme={theme}
        onSelect={onSelect}
      />
    );
    fireEvent.click(screen.getByLabelText('Profil von Frank u1'));
    expect(onSelect).toHaveBeenCalledWith('u1');
  });
});
