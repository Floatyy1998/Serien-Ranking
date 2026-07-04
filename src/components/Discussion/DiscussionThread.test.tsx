// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Discussion } from '../../types/Discussion';

const { authRef, discussionsRef } = vi.hoisted(() => ({
  authRef: { current: { user: { uid: 'u1' } } as { user: { uid: string } | null } },
  discussionsRef: {
    current: {
      discussions: [] as Discussion[],
      loading: false,
      error: null as string | null,
    },
  },
}));

vi.mock('../../contexts/ThemeContextDef', () => {
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

// framer-motion's motion-value lifecycle throws in the jsdom test env
// (`removeOnChange is not a function`); a prop-stripping passthrough is enough here.
vi.mock('framer-motion', async () => {
  const { createElement, forwardRef, Fragment } = await import('react');
  const SKIP = new Set([
    'initial',
    'animate',
    'exit',
    'whileTap',
    'whileHover',
    'whileInView',
    'whileFocus',
    'whileDrag',
    'viewport',
    'transition',
    'layout',
    'layoutId',
    'drag',
    'dragConstraints',
    'onViewportEnter',
    'onViewportLeave',
    'variants',
    'custom',
    'onAnimationStart',
    'onAnimationComplete',
  ]);
  const make = (tag: string) =>
    forwardRef((props: Record<string, unknown>, ref: React.Ref<unknown>) => {
      const clean: Record<string, unknown> = {};
      for (const k in props) if (!SKIP.has(k)) clean[k] = props[k];
      return createElement(tag, { ...clean, ref });
    });
  const cache: Record<string, unknown> = {};
  const motion = new Proxy(
    {},
    { get: (_t: object, tag: string | symbol) => (cache[String(tag)] ??= make(String(tag))) }
  );
  return {
    motion,
    AnimatePresence: ({ children }: { children?: React.ReactNode }) =>
      createElement(Fragment, null, children),
    useMotionValue: (v: unknown) => ({ get: () => v, set: () => {} }),
    useSpring: (v: unknown) => v,
    useTransform: () => ({ get: () => 0, set: () => {} }),
    useMotionTemplate: () => '',
  };
});

vi.mock('../../AuthContext', () => ({ useAuth: () => authRef.current }));

vi.mock('../ui', () => ({
  LoadingSpinner: ({ text }: { text?: string }) => <div>{text}</div>,
}));

vi.mock('../../hooks/useDiscussions', () => ({
  useDiscussions: () => ({
    discussions: discussionsRef.current.discussions,
    loading: discussionsRef.current.loading,
    error: discussionsRef.current.error,
    createDiscussion: vi.fn().mockResolvedValue('new-id'),
    editDiscussion: vi.fn().mockResolvedValue(true),
    deleteDiscussion: vi.fn(),
    toggleLike: vi.fn(),
  }),
}));

vi.mock('./DiscussionItem', () => ({
  DiscussionItem: ({ discussion }: { discussion: Discussion }) => (
    <div data-testid="discussion-item">{discussion.title}</div>
  ),
}));

vi.mock('./NewDiscussionForm', () => ({
  NewDiscussionForm: ({ onCancel }: { onCancel: () => void }) => (
    <div data-testid="new-form">
      <button onClick={onCancel}>close-form</button>
    </div>
  ),
}));

import { DiscussionThread } from './DiscussionThread';

beforeEach(() => {
  authRef.current = { user: { uid: 'u1' } };
  discussionsRef.current = { discussions: [], loading: false, error: null };
  localStorage.clear();
});

afterEach(() => cleanup());

describe('DiscussionThread', () => {
  it('renders the empty state and the new discussion button for a logged-in user', () => {
    render(<DiscussionThread itemId={1} itemType="series" />);
    expect(screen.getByText('Noch keine Diskussionen')).toBeInTheDocument();
    expect(screen.getByText('+ Neue Diskussion')).toBeInTheDocument();
  });

  it('shows the loading spinner while discussions load', () => {
    discussionsRef.current = { discussions: [], loading: true, error: null };
    render(<DiscussionThread itemId={1} itemType="series" />);
    expect(screen.getByText('Diskussionen werden geladen...')).toBeInTheDocument();
  });

  it('renders discussion items and a count badge', () => {
    discussionsRef.current = {
      discussions: [
        {
          id: 'd1',
          itemId: 1,
          itemType: 'series',
          userId: 'x',
          username: 'X',
          title: 'Topic One',
          content: 'c',
          createdAt: Date.now(),
          likes: [],
          replyCount: 0,
        },
      ],
      loading: false,
      error: null,
    };
    render(<DiscussionThread itemId={1} itemType="series" />);
    expect(screen.getByTestId('discussion-item')).toHaveTextContent('Topic One');
  });

  it('reveals the discussions behind a spoiler wall for unwatched episodes', () => {
    render(
      <DiscussionThread
        itemId={1}
        itemType="episode"
        seasonNumber={1}
        episodeNumber={2}
        isWatched={false}
      />
    );
    expect(screen.getByText('Spoiler-Warnung')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Trotzdem anzeigen'));
    expect(screen.getByText('Noch keine Diskussionen')).toBeInTheDocument();
  });

  it('opens the new discussion form when the button is clicked', () => {
    render(<DiscussionThread itemId={1} itemType="series" />);
    fireEvent.click(screen.getByText('+ Neue Diskussion'));
    expect(screen.getByTestId('new-form')).toBeInTheDocument();
  });
});
