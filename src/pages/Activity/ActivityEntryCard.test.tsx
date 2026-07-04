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
import { ActivityEntryCard } from './ActivityEntryCard';

const theme = {
  primary: '#00d123',
  accent: '#00a0ff',
  status: { error: '#ef4444', warning: '#f59e0b', success: '#22c55e' },
  background: { default: '#000000', surface: '#111111' },
  text: { primary: '#ffffff', secondary: '#dddddd', muted: '#999999' },
  border: { default: '#222222' },
};

const ratedActivity: FriendActivity = {
  id: 'e1',
  userId: 'u1',
  userName: 'Frank',
  type: 'series_rated',
  itemTitle: 'Breaking Bad',
  rating: 9,
  timestamp: 1000,
};

afterEach(() => cleanup());

describe('ActivityEntryCard', () => {
  it('renders the user name, item title and rating badge', () => {
    render(
      <ActivityEntryCard
        activity={ratedActivity}
        posterUrl="https://img/p.jpg"
        itemTitle="Breaking Bad"
        userName="Frank"
        theme={theme}
        onClick={() => {}}
      />
    );
    expect(screen.getByText('Frank')).toBeInTheDocument();
    expect(screen.getByText('Breaking Bad')).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
  });

  it('calls onClick when the row is clicked', () => {
    const onClick = vi.fn();
    render(
      <ActivityEntryCard
        activity={ratedActivity}
        posterUrl={undefined}
        itemTitle="Breaking Bad"
        userName="Frank"
        theme={theme}
        onClick={onClick}
      />
    );
    fireEvent.click(screen.getByText('Breaking Bad'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('calls onAvatarClick and stops row propagation when the avatar is tapped', () => {
    const onClick = vi.fn();
    const onAvatarClick = vi.fn();
    render(
      <ActivityEntryCard
        activity={ratedActivity}
        posterUrl={undefined}
        itemTitle="Breaking Bad"
        userName="Frank"
        theme={theme}
        onClick={onClick}
        onAvatarClick={onAvatarClick}
      />
    );
    fireEvent.click(screen.getByLabelText('Profil von Frank'));
    expect(onAvatarClick).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
  });
});
