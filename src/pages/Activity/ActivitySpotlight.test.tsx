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
import { ActivitySpotlight } from './ActivitySpotlight';

const theme = {
  primary: '#00d123',
  accent: '#00a0ff',
  status: { error: '#ef4444', warning: '#f59e0b', success: '#22c55e' },
  background: { default: '#000000', surface: '#111111' },
  text: { primary: '#ffffff', secondary: '#dddddd', muted: '#999999' },
};

const watchedActivity: FriendActivity = {
  id: 's1',
  userId: 'u1',
  userName: 'Frank',
  type: 'episode_watched',
  itemTitle: 'Lost',
  timestamp: 2000,
};

afterEach(() => cleanup());

describe('ActivitySpotlight', () => {
  it('renders the eyebrow, user name and verb sentence', () => {
    render(
      <ActivitySpotlight
        activity={watchedActivity}
        posterUrl="https://img/p.jpg"
        itemTitle="Lost"
        userName="Frank"
        timeLabel="vor 5 Min"
        theme={theme}
        onClick={() => {}}
        onAvatarClick={() => {}}
      />
    );
    expect(screen.getByText('Frank')).toBeInTheDocument();
    // suffix form: "{verb} {title} {suffix}" → "eine Folge von Lost geschaut"
    expect(screen.getByText(/eine Folge von Lost geschaut/)).toBeInTheDocument();
    expect(screen.getByText(/ZULETZT · vor 5 Min/)).toBeInTheDocument();
  });

  it('calls onClick when the card is clicked', () => {
    const onClick = vi.fn();
    render(
      <ActivitySpotlight
        activity={watchedActivity}
        itemTitle="Lost"
        userName="Frank"
        timeLabel="vor 5 Min"
        theme={theme}
        onClick={onClick}
        onAvatarClick={() => {}}
      />
    );
    fireEvent.click(screen.getByText(/eine Folge von Lost geschaut/));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('calls onAvatarClick without triggering the card onClick', () => {
    const onClick = vi.fn();
    const onAvatarClick = vi.fn();
    render(
      <ActivitySpotlight
        activity={watchedActivity}
        itemTitle="Lost"
        userName="Frank"
        timeLabel="vor 5 Min"
        theme={theme}
        onClick={onClick}
        onAvatarClick={onAvatarClick}
      />
    );
    fireEvent.click(screen.getByText('Frank'));
    expect(onAvatarClick).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
  });
});
